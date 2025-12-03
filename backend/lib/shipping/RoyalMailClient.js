const BaseShippingClient = require('./BaseShippingClient');
const axios = require('axios');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * Royal Mail Click & Drop Integration
 * API Documentation: https://developer.royalmail.net/
 *
 * Services supported:
 * - Royal Mail 24 (next day)
 * - Royal Mail 48 (2-3 days)
 * - Royal Mail Tracked 24/48
 * - Royal Mail Special Delivery
 */
class RoyalMailClient extends BaseShippingClient {
  constructor(carrierId, credentials) {
    super(carrierId, credentials);

    this.clientId = credentials.clientId;
    this.clientSecret = credentials.clientSecret;
    this.baseUrl = credentials.sandbox
      ? 'https://api.sandbox.royalmail.net'
      : 'https://api.royalmail.net';

    this.accessToken = null;
    this.tokenExpiry = null;
  }

  /**
   * Authenticate with Royal Mail API using OAuth2 Client Credentials flow
   */
  async authenticate() {
    if (this.accessToken && this.tokenExpiry && Date.now() < this.tokenExpiry) {
      return this.accessToken;
    }

    try {
      const response = await axios.post(
        `${this.baseUrl}/oauth2/token`,
        'grant_type=client_credentials',
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': `Basic ${Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64')}`
          }
        }
      );

      this.accessToken = response.data.access_token;
      this.tokenExpiry = Date.now() + (response.data.expires_in * 1000) - 60000; // Refresh 1 min early

      return this.accessToken;
    } catch (error) {
      console.error('Royal Mail authentication failed:', error.response?.data || error.message);
      throw new Error(`Authentication failed: ${error.response?.data?.error_description || error.message}`);
    }
  }

  /**
   * Make authenticated request to Royal Mail API
   */
  async makeRequest(method, endpoint, data = null) {
    const token = await this.authenticate();

    const config = {
      method,
      url: `${this.baseUrl}${endpoint}`,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    };

    if (data) {
      config.data = data;
    }

    try {
      const response = await axios(config);
      return response.data;
    } catch (error) {
      console.error('Royal Mail API request failed:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Create shipment and generate label
   * @param {Object} orderDetails - Order and shipping details
   * @returns {Object} - Shipment details including tracking number and label URL
   */
  async createShipment(orderDetails) {
    try {
      const {
        orderId,
        serviceCode, // e.g., 'CRL24', 'CRL48', 'TPN24', 'TPS48', 'SD1'
        recipientName,
        recipientAddress,
        recipientPostcode,
        recipientCountry = 'GB',
        recipientPhone,
        recipientEmail,
        senderName,
        senderAddress,
        senderPostcode,
        senderCountry = 'GB',
        parcelWeight, // In grams
        parcelLength, // In cm
        parcelWidth,
        parcelHeight,
        contents,
        customsValue,
        customsCurrency = 'GBP'
      } = orderDetails;

      // Rate limiting: 60 requests/minute for Royal Mail
      await this.checkLimit('create_shipment', 60, 60000);

      const shipmentRequest = {
        orderReference: orderId,
        recipient: {
          name: recipientName,
          addressLine1: recipientAddress.line1,
          addressLine2: recipientAddress.line2 || '',
          addressLine3: recipientAddress.line3 || '',
          town: recipientAddress.city,
          county: recipientAddress.county || '',
          postcode: recipientPostcode,
          countryCode: recipientCountry,
          phoneNumber: recipientPhone,
          emailAddress: recipientEmail
        },
        sender: {
          tradingName: senderName,
          addressLine1: senderAddress.line1,
          addressLine2: senderAddress.line2 || '',
          town: senderAddress.city,
          county: senderAddress.county || '',
          postcode: senderPostcode,
          countryCode: senderCountry
        },
        packages: [{
          weightInGrams: parcelWeight,
          packageFormatIdentifier: this.determinePackageFormat(parcelLength, parcelWidth, parcelHeight),
          dimensions: {
            lengthInCms: parcelLength,
            widthInCms: parcelWidth,
            heightInCms: parcelHeight
          }
        }],
        serviceSettings: {
          serviceLevel: serviceCode,
          serviceFormat: 'P', // Parcel
          safePlace: orderDetails.safePlace || '',
          saturdayGuaranteed: orderDetails.saturdayDelivery || false,
          consequentialLoss: orderDetails.consequentialLoss || 0,
          recordedSignedFor: serviceCode.includes('TPN') || serviceCode.includes('TPS') || serviceCode.includes('SD')
        }
      };

      // Add customs information for international shipments
      if (recipientCountry !== 'GB') {
        shipmentRequest.customsDeclaration = {
          categoryType: 'GIFT', // or 'SALE', 'COMMERCIAL_SAMPLE', 'DOCUMENTS', 'OTHER'
          invoiceNumber: orderId,
          invoiceDate: new Date().toISOString().split('T')[0],
          packageContents: contents || 'Merchandise',
          customsValue: customsValue,
          currency: customsCurrency
        };
      }

      const response = await this.makeRequest('POST', '/shipping/v3/orders', shipmentRequest);

      // Store shipment in database
      const shipment = await prisma.shipment.create({
        data: {
          carrierId: this.carrierId,
          orderId: orderId,
          trackingNumber: response.shipmentTrackingNumber,
          serviceCode: serviceCode,
          labelUrl: response.labelUrl,
          status: 'CREATED',
          carrierShipmentId: response.shipmentId,
          cost: response.totalCharge || 0,
          currency: 'GBP',
          estimatedDelivery: response.estimatedDeliveryDate
            ? new Date(response.estimatedDeliveryDate)
            : null
        }
      });

      await this.logOperation('CREATE_SHIPMENT', 'SUCCESS', {
        orderId,
        trackingNumber: response.shipmentTrackingNumber,
        serviceCode
      });

      return {
        success: true,
        shipmentId: shipment.id,
        trackingNumber: response.shipmentTrackingNumber,
        labelUrl: response.labelUrl,
        labelFormat: 'PDF',
        estimatedDelivery: response.estimatedDeliveryDate,
        cost: response.totalCharge,
        currency: 'GBP'
      };
    } catch (error) {
      await this.logOperation('CREATE_SHIPMENT', 'FAILED', {
        orderId: orderDetails.orderId,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Get available shipping services with rates
   * @param {Object} fromAddress - Origin address
   * @param {Object} toAddress - Destination address
   * @param {Object} parcelDetails - Parcel dimensions and weight
   */
  async getServices(fromAddress, toAddress, parcelDetails) {
    try {
      await this.checkLimit('get_services', 60, 60000);

      const quoteRequest = {
        originPostcode: fromAddress.postcode,
        destinationPostcode: toAddress.postcode,
        destinationCountryCode: toAddress.country || 'GB',
        weightInGrams: parcelDetails.weight,
        lengthInCms: parcelDetails.length,
        widthInCms: parcelDetails.width,
        heightInCms: parcelDetails.height
      };

      const response = await this.makeRequest('POST', '/shipping/v3/quotes', quoteRequest);

      const services = response.services.map(service => ({
        serviceCode: service.serviceCode,
        serviceName: service.serviceName,
        description: service.description,
        price: service.price,
        currency: 'GBP',
        estimatedDeliveryDays: service.deliveryDays,
        tracked: service.tracked,
        signed: service.signatureRequired,
        compensation: service.compensation
      }));

      return services;
    } catch (error) {
      console.error('Failed to get Royal Mail services:', error);
      throw error;
    }
  }

  /**
   * Track shipment status
   * @param {string} trackingNumber - Royal Mail tracking number
   */
  async trackShipment(trackingNumber) {
    try {
      await this.checkLimit('track_shipment', 60, 60000);

      const response = await this.makeRequest('GET', `/shipping/v3/tracking/${trackingNumber}`);

      const trackingInfo = {
        trackingNumber: response.trackingNumber,
        status: this.normalizeStatus(response.status),
        statusDescription: response.statusDescription,
        estimatedDelivery: response.estimatedDeliveryDate,
        events: response.events.map(event => ({
          timestamp: new Date(event.eventDateTime),
          location: event.location,
          description: event.eventDescription,
          status: event.eventCode
        }))
      };

      // Update shipment status in database
      await prisma.shipment.updateMany({
        where: { trackingNumber },
        data: {
          status: trackingInfo.status,
          lastTrackedAt: new Date()
        }
      });

      return trackingInfo;
    } catch (error) {
      console.error('Failed to track Royal Mail shipment:', error);
      throw error;
    }
  }

  /**
   * Cancel shipment (only possible before collection)
   * @param {string} shipmentId - Royal Mail shipment ID
   */
  async cancelShipment(shipmentId) {
    try {
      await this.checkLimit('cancel_shipment', 60, 60000);

      // Get shipment from database
      const shipment = await prisma.shipment.findFirst({
        where: { carrierShipmentId: shipmentId, carrierId: this.carrierId }
      });

      if (!shipment) {
        throw new Error('Shipment not found');
      }

      if (shipment.status === 'COLLECTED' || shipment.status === 'IN_TRANSIT') {
        throw new Error('Cannot cancel shipment after collection');
      }

      await this.makeRequest('DELETE', `/shipping/v3/orders/${shipmentId}`);

      // Update database
      await prisma.shipment.update({
        where: { id: shipment.id },
        data: { status: 'CANCELLED' }
      });

      await this.logOperation('CANCEL_SHIPMENT', 'SUCCESS', {
        shipmentId,
        trackingNumber: shipment.trackingNumber
      });

      return { success: true, message: 'Shipment cancelled successfully' };
    } catch (error) {
      await this.logOperation('CANCEL_SHIPMENT', 'FAILED', {
        shipmentId,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Print/download shipping label
   * @param {string} shipmentId - Shipment database ID
   */
  async printLabel(shipmentId) {
    try {
      const shipment = await prisma.shipment.findUnique({
        where: { id: shipmentId }
      });

      if (!shipment) {
        throw new Error('Shipment not found');
      }

      // Royal Mail provides label URL in create response
      // No separate API call needed
      return {
        labelUrl: shipment.labelUrl,
        format: 'PDF',
        trackingNumber: shipment.trackingNumber
      };
    } catch (error) {
      console.error('Failed to get Royal Mail label:', error);
      throw error;
    }
  }

  /**
   * Determine package format based on dimensions
   * Royal Mail package formats:
   * - LETTER: Up to 24cm x 16.5cm x 0.5cm
   * - LARGE_LETTER: Up to 35.3cm x 25cm x 2.5cm
   * - SMALL_PARCEL: Up to 45cm x 35cm x 16cm
   * - MEDIUM_PARCEL: Up to 61cm x 46cm x 46cm
   * - LARGE_PARCEL: Over medium parcel size
   */
  determinePackageFormat(length, width, height) {
    const maxDim = Math.max(length, width, height);
    const midDim = [length, width, height].sort((a, b) => b - a)[1];
    const minDim = Math.min(length, width, height);

    if (maxDim <= 24 && midDim <= 16.5 && minDim <= 0.5) return 'LETTER';
    if (maxDim <= 35.3 && midDim <= 25 && minDim <= 2.5) return 'LARGE_LETTER';
    if (maxDim <= 45 && midDim <= 35 && minDim <= 16) return 'SMALL_PARCEL';
    if (maxDim <= 61 && midDim <= 46 && minDim <= 46) return 'MEDIUM_PARCEL';

    return 'LARGE_PARCEL';
  }

  /**
   * Normalize Royal Mail status codes to standard statuses
   */
  normalizeStatus(rmStatus) {
    const statusMap = {
      'CREATED': 'CREATED',
      'COLLECTED': 'COLLECTED',
      'IN_TRANSIT': 'IN_TRANSIT',
      'OUT_FOR_DELIVERY': 'OUT_FOR_DELIVERY',
      'DELIVERED': 'DELIVERED',
      'FAILED_DELIVERY': 'EXCEPTION',
      'RETURNED': 'RETURNED',
      'CANCELLED': 'CANCELLED'
    };

    return statusMap[rmStatus] || 'UNKNOWN';
  }

  /**
   * Get manifest for daily collection
   * Royal Mail requires a manifest to be submitted before collection
   */
  async createManifest(shipmentIds) {
    try {
      await this.checkLimit('create_manifest', 60, 60000);

      const manifestRequest = {
        manifestDate: new Date().toISOString().split('T')[0],
        shipmentIds: shipmentIds
      };

      const response = await this.makeRequest('POST', '/shipping/v3/manifest', manifestRequest);

      await this.logOperation('CREATE_MANIFEST', 'SUCCESS', {
        manifestId: response.manifestId,
        shipmentCount: shipmentIds.length
      });

      return {
        manifestId: response.manifestId,
        manifestUrl: response.manifestUrl,
        shipmentCount: shipmentIds.length
      };
    } catch (error) {
      await this.logOperation('CREATE_MANIFEST', 'FAILED', {
        error: error.message
      });
      throw error;
    }
  }
}

module.exports = RoyalMailClient;
