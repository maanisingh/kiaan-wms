const BaseShippingClient = require('./BaseShippingClient');
const axios = require('axios');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * DPD UK Integration
 * API Documentation: https://www.dpd.co.uk/content/products_services/uk_services.jsp
 *
 * Services supported:
 * - DPD Next Day
 * - DPD 12:00
 * - DPD 10:30
 * - DPD Saturday
 * - DPD Sunday
 * - DPD Express
 */
class DPDClient extends BaseShippingClient {
  constructor(carrierId, credentials) {
    super(carrierId, credentials);

    this.username = credentials.username;
    this.password = credentials.password;
    this.accountNumber = credentials.accountNumber;
    this.geoSession = credentials.geoSession; // GeoSession key for authentication
    this.baseUrl = credentials.sandbox
      ? 'https://api.sandbox.dpd.co.uk'
      : 'https://api.dpd.co.uk';

    this.authToken = null;
    this.tokenExpiry = null;
  }

  /**
   * Authenticate with DPD API
   * DPD uses a GeoSession-based authentication system
   */
  async authenticate() {
    if (this.authToken && this.tokenExpiry && Date.now() < this.tokenExpiry) {
      return this.authToken;
    }

    try {
      const response = await axios.post(
        `${this.baseUrl}/user/`,
        {
          username: this.username,
          password: this.password,
          geoSession: this.geoSession
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          }
        }
      );

      this.authToken = response.data.data.geoSession;
      this.tokenExpiry = Date.now() + (3600 * 1000); // 1 hour validity

      return this.authToken;
    } catch (error) {
      console.error('DPD authentication failed:', error.response?.data || error.message);
      throw new Error(`DPD Authentication failed: ${error.response?.data?.error || error.message}`);
    }
  }

  /**
   * Make authenticated request to DPD API
   */
  async makeRequest(method, endpoint, data = null) {
    const token = await this.authenticate();

    const config = {
      method,
      url: `${this.baseUrl}${endpoint}`,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'GEOClient': 'account/' + this.accountNumber,
        'GEOSession': token
      }
    };

    if (data) {
      config.data = data;
    }

    try {
      const response = await axios(config);
      return response.data;
    } catch (error) {
      console.error('DPD API request failed:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Create DPD shipment and generate label
   * @param {Object} orderDetails - Order and shipping details
   */
  async createShipment(orderDetails) {
    try {
      const {
        orderId,
        serviceCode, // 'NEXT_DAY', '12:00', '10:30', 'SATURDAY', 'SUNDAY', 'EXPRESS'
        recipientName,
        recipientCompany,
        recipientAddress,
        recipientPostcode,
        recipientCountry = 'GB',
        recipientPhone,
        recipientEmail,
        senderName,
        senderCompany,
        senderAddress,
        senderPostcode,
        senderCountry = 'GB',
        senderPhone,
        parcelWeight, // In kg
        numberOfParcels = 1,
        parcelValue,
        parcelDescription,
        deliveryInstructions,
        notificationEmail,
        notificationSMS
      } = orderDetails;

      // Rate limiting: DPD allows 100 requests/minute
      await this.checkLimit('create_shipment', 100, 60000);

      const shipmentRequest = {
        jobId: null, // Auto-generated
        collectionOnDelivery: false,
        invoice: null,
        deliveryDetails: {
          contactDetails: {
            contactName: recipientName,
            telephone: recipientPhone,
            email: recipientEmail
          },
          address: {
            organisation: recipientCompany || '',
            property: '',
            street: recipientAddress.line1,
            locality: recipientAddress.line2 || '',
            town: recipientAddress.city,
            county: recipientAddress.county || '',
            postcode: recipientPostcode,
            countryCode: recipientCountry
          },
          notificationDetails: {
            email: notificationEmail || recipientEmail,
            mobile: notificationSMS || recipientPhone
          }
        },
        networkCode: this.getNetworkCode(serviceCode),
        numberOfParcels: numberOfParcels,
        totalWeight: parcelWeight,
        shippingRef1: orderId,
        shippingRef2: '',
        shippingRef3: '',
        customsValue: parcelValue || 0,
        deliveryInstructions: deliveryInstructions || '',
        parcelDescription: parcelDescription || 'Goods',
        liabilityValue: 0,
        liability: false
      };

      const response = await this.makeRequest('POST', '/shipping/shipment', {
        data: shipmentRequest
      });

      // DPD returns multiple parcel numbers if numberOfParcels > 1
      const parcels = response.data.shipmentDetail || [];
      const mainParcel = parcels[0];

      if (!mainParcel) {
        throw new Error('No parcel details returned from DPD');
      }

      // Store shipment in database
      const shipment = await prisma.shipment.create({
        data: {
          carrierId: this.carrierId,
          orderId: orderId,
          trackingNumber: mainParcel.parcelNumber,
          serviceCode: serviceCode,
          labelUrl: mainParcel.label || null,
          status: 'CREATED',
          carrierShipmentId: mainParcel.shipmentId,
          cost: 0, // DPD doesn't return cost in create response
          currency: 'GBP',
          numberOfParcels: numberOfParcels
        }
      });

      await this.logOperation('CREATE_SHIPMENT', 'SUCCESS', {
        orderId,
        trackingNumber: mainParcel.parcelNumber,
        serviceCode,
        numberOfParcels
      });

      return {
        success: true,
        shipmentId: shipment.id,
        trackingNumber: mainParcel.parcelNumber,
        parcelNumbers: parcels.map(p => p.parcelNumber),
        labelUrl: mainParcel.label,
        labelFormat: 'PDF',
        consignmentNumber: response.data.consignmentDetail?.consignmentNumber,
        numberOfParcels: numberOfParcels
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
   * Get available DPD services with pricing
   * @param {Object} fromAddress - Origin address
   * @param {Object} toAddress - Destination address
   * @param {Object} parcelDetails - Parcel details
   */
  async getServices(fromAddress, toAddress, parcelDetails) {
    try {
      await this.checkLimit('get_services', 100, 60000);

      // DPD service options with pricing tiers
      const services = [
        {
          serviceCode: 'NEXT_DAY',
          serviceName: 'DPD Next Day',
          description: 'Delivery by end of next working day',
          networkCode: '1^12',
          estimatedDeliveryDays: 1,
          tracked: true,
          signed: true
        },
        {
          serviceCode: '12:00',
          serviceName: 'DPD 12:00',
          description: 'Delivery by 12:00 next working day',
          networkCode: '1^01',
          estimatedDeliveryDays: 1,
          tracked: true,
          signed: true
        },
        {
          serviceCode: '10:30',
          serviceName: 'DPD 10:30',
          description: 'Delivery by 10:30 next working day',
          networkCode: '1^05',
          estimatedDeliveryDays: 1,
          tracked: true,
          signed: true
        },
        {
          serviceCode: 'SATURDAY',
          serviceName: 'DPD Saturday',
          description: 'Saturday delivery',
          networkCode: '1^06',
          estimatedDeliveryDays: 1,
          tracked: true,
          signed: true
        },
        {
          serviceCode: 'SUNDAY',
          serviceName: 'DPD Sunday',
          description: 'Sunday delivery',
          networkCode: '1^07',
          estimatedDeliveryDays: 1,
          tracked: true,
          signed: true
        },
        {
          serviceCode: 'EXPRESS',
          serviceName: 'DPD Express',
          description: 'Express international delivery',
          networkCode: '2^12',
          estimatedDeliveryDays: 2,
          tracked: true,
          signed: true
        }
      ];

      // Note: DPD doesn't provide a public pricing API
      // Pricing is typically negotiated per account
      // For accurate pricing, integrate with account management portal or use fixed rates

      return services.map(service => ({
        ...service,
        price: null, // Requires account-specific pricing
        currency: 'GBP'
      }));
    } catch (error) {
      console.error('Failed to get DPD services:', error);
      throw error;
    }
  }

  /**
   * Track DPD shipment
   * @param {string} trackingNumber - DPD parcel number
   */
  async trackShipment(trackingNumber) {
    try {
      await this.checkLimit('track_shipment', 100, 60000);

      const response = await this.makeRequest('GET', `/shipping/track/${trackingNumber}`);

      const trackingData = response.data;

      if (!trackingData || !trackingData.parcel) {
        throw new Error('No tracking data available');
      }

      const trackingInfo = {
        trackingNumber: trackingData.parcel.parcelNumber,
        status: this.normalizeStatus(trackingData.parcel.statusCode),
        statusDescription: trackingData.parcel.statusDescription,
        estimatedDelivery: trackingData.parcel.deliveryDate
          ? new Date(trackingData.parcel.deliveryDate)
          : null,
        events: (trackingData.parcel.scanEvents || []).map(event => ({
          timestamp: new Date(event.scanDate + ' ' + event.scanTime),
          location: event.depot || event.location,
          description: event.scanDescription,
          status: event.scanCode
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
      console.error('Failed to track DPD shipment:', error);
      throw error;
    }
  }

  /**
   * Cancel DPD shipment
   * Note: DPD shipments can only be cancelled before collection
   * @param {string} shipmentId - DPD shipment/consignment number
   */
  async cancelShipment(shipmentId) {
    try {
      await this.checkLimit('cancel_shipment', 100, 60000);

      const shipment = await prisma.shipment.findFirst({
        where: { carrierShipmentId: shipmentId, carrierId: this.carrierId }
      });

      if (!shipment) {
        throw new Error('Shipment not found');
      }

      if (shipment.status === 'COLLECTED' || shipment.status === 'IN_TRANSIT') {
        throw new Error('Cannot cancel shipment after collection');
      }

      // DPD cancellation via shipment deletion
      await this.makeRequest('DELETE', `/shipping/shipment/${shipmentId}`);

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
   * Print/download DPD shipping label
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

      // If label URL exists, return it
      if (shipment.labelUrl) {
        return {
          labelUrl: shipment.labelUrl,
          format: 'PDF',
          trackingNumber: shipment.trackingNumber
        };
      }

      // Otherwise, fetch label from DPD API
      const response = await this.makeRequest(
        'GET',
        `/shipping/shipment/${shipment.carrierShipmentId}/label`
      );

      // Update database with label URL
      await prisma.shipment.update({
        where: { id: shipmentId },
        data: { labelUrl: response.data.labelUrl }
      });

      return {
        labelUrl: response.data.labelUrl,
        format: 'PDF',
        trackingNumber: shipment.trackingNumber
      };
    } catch (error) {
      console.error('Failed to get DPD label:', error);
      throw error;
    }
  }

  /**
   * Get DPD network code from service code
   * Network codes determine the service type
   */
  getNetworkCode(serviceCode) {
    const networkCodes = {
      'NEXT_DAY': '1^12',
      '12:00': '1^01',
      '10:30': '1^05',
      'SATURDAY': '1^06',
      'SUNDAY': '1^07',
      'EXPRESS': '2^12'
    };

    return networkCodes[serviceCode] || '1^12'; // Default to Next Day
  }

  /**
   * Normalize DPD status codes to standard statuses
   */
  normalizeStatus(dpdStatus) {
    // DPD uses various status codes - map to standard statuses
    const statusMap = {
      'C': 'CREATED',
      'P': 'COLLECTED',
      'T': 'IN_TRANSIT',
      'O': 'OUT_FOR_DELIVERY',
      'D': 'DELIVERED',
      'F': 'EXCEPTION',
      'R': 'RETURNED',
      'X': 'CANCELLED'
    };

    return statusMap[dpdStatus] || 'UNKNOWN';
  }

  /**
   * Create collection request for DPD pickup
   * @param {Object} collectionDetails - Collection details
   */
  async createCollection(collectionDetails) {
    try {
      await this.checkLimit('create_collection', 100, 60000);

      const {
        collectionDate,
        collectionAddress,
        contactName,
        contactPhone,
        numberOfParcels,
        totalWeight,
        specialInstructions
      } = collectionDetails;

      const collectionRequest = {
        collectionDate: collectionDate,
        address: {
          organisation: collectionAddress.company || '',
          property: '',
          street: collectionAddress.line1,
          locality: collectionAddress.line2 || '',
          town: collectionAddress.city,
          county: collectionAddress.county || '',
          postcode: collectionAddress.postcode,
          countryCode: collectionAddress.country || 'GB'
        },
        contactDetails: {
          contactName: contactName,
          telephone: contactPhone
        },
        numberOfParcels: numberOfParcels,
        totalWeight: totalWeight,
        specialInstructions: specialInstructions || ''
      };

      const response = await this.makeRequest('POST', '/collection/', {
        data: collectionRequest
      });

      await this.logOperation('CREATE_COLLECTION', 'SUCCESS', {
        collectionDate,
        numberOfParcels
      });

      return {
        success: true,
        collectionId: response.data.collectionId,
        collectionDate: response.data.collectionDate
      };
    } catch (error) {
      await this.logOperation('CREATE_COLLECTION', 'FAILED', {
        error: error.message
      });
      throw error;
    }
  }
}

module.exports = DPDClient;
