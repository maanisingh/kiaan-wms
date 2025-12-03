const BaseShippingClient = require('./BaseShippingClient');
const axios = require('axios');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * Parcel Force (Royal Mail Group) Integration
 * API Documentation: https://www.parcelforce.com/integration
 *
 * Services supported:
 * - Express 9
 * - Express 10
 * - Express AM
 * - Express 24
 * - Express 48
 * - Global Express (International)
 */
class ParcelForceClient extends BaseShippingClient {
  constructor(carrierId, credentials) {
    super(carrierId, credentials);

    this.apiKey = credentials.apiKey;
    this.accountNumber = credentials.accountNumber;
    this.contractNumber = credentials.contractNumber;
    this.baseUrl = credentials.sandbox
      ? 'https://api.sandbox.parcelforce.com'
      : 'https://api.parcelforce.com';
  }

  /**
   * Make authenticated request to Parcel Force API
   * Parcel Force uses API key authentication
   */
  async makeRequest(method, endpoint, data = null) {
    const config = {
      method,
      url: `${this.baseUrl}${endpoint}`,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'X-API-Key': this.apiKey,
        'X-Account-Number': this.accountNumber
      }
    };

    if (data) {
      config.data = data;
    }

    try {
      const response = await axios(config);
      return response.data;
    } catch (error) {
      console.error('Parcel Force API request failed:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Create Parcel Force shipment and generate label
   * @param {Object} orderDetails - Order and shipping details
   */
  async createShipment(orderDetails) {
    try {
      const {
        orderId,
        serviceCode, // 'EXPRESS_9', 'EXPRESS_10', 'EXPRESS_AM', 'EXPRESS_24', 'EXPRESS_48', 'GLOBAL_EXPRESS'
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
        senderEmail,
        parcelWeight, // In kg
        numberOfParcels = 1,
        parcelValue,
        parcelDescription,
        contents,
        requiresSignature = true,
        saturdayDelivery = false,
        safePlace,
        deliveryInstructions,
        customsDetails // Required for international shipments
      } = orderDetails;

      // Rate limiting: Parcel Force allows 60 requests/minute
      await this.checkLimit('create_shipment', 60, 60000);

      const shipmentRequest = {
        contractNumber: this.contractNumber,
        accountNumber: this.accountNumber,
        serviceCode: this.getServiceCode(serviceCode),
        despatchDate: new Date().toISOString().split('T')[0],
        numberOfParcels: numberOfParcels,
        totalWeight: parcelWeight,
        customerReference: orderId,
        sender: {
          name: senderName,
          companyName: senderCompany || '',
          address: {
            addressLine1: senderAddress.line1,
            addressLine2: senderAddress.line2 || '',
            addressLine3: senderAddress.line3 || '',
            town: senderAddress.city,
            county: senderAddress.county || '',
            postcode: senderPostcode,
            countryCode: senderCountry
          },
          contactDetails: {
            telephone: senderPhone,
            email: senderEmail
          }
        },
        recipient: {
          name: recipientName,
          companyName: recipientCompany || '',
          address: {
            addressLine1: recipientAddress.line1,
            addressLine2: recipientAddress.line2 || '',
            addressLine3: recipientAddress.line3 || '',
            town: recipientAddress.city,
            county: recipientAddress.county || '',
            postcode: recipientPostcode,
            countryCode: recipientCountry
          },
          contactDetails: {
            telephone: recipientPhone,
            email: recipientEmail
          }
        },
        parcels: Array(numberOfParcels).fill(null).map((_, index) => ({
          parcelNumber: index + 1,
          weight: parcelWeight / numberOfParcels,
          length: orderDetails.parcelLength || 0,
          width: orderDetails.parcelWidth || 0,
          height: orderDetails.parcelHeight || 0,
          value: parcelValue ? (parcelValue / numberOfParcels) : 0
        })),
        deliveryOptions: {
          requiresSignature: requiresSignature,
          saturdayDelivery: saturdayDelivery,
          safePlace: safePlace || '',
          deliveryInstructions: deliveryInstructions || ''
        },
        parcelsContents: parcelDescription || contents || 'Goods'
      };

      // Add customs declaration for international shipments
      if (recipientCountry !== 'GB') {
        if (!customsDetails) {
          throw new Error('Customs details required for international shipments');
        }

        shipmentRequest.customsDeclaration = {
          categoryType: customsDetails.categoryType || 'SALE', // GIFT, SALE, DOCUMENTS, SAMPLE, OTHER
          invoiceNumber: orderId,
          invoiceDate: new Date().toISOString().split('T')[0],
          exportReason: customsDetails.exportReason || 'SALE',
          shippingCharges: customsDetails.shippingCharges || 0,
          otherCharges: customsDetails.otherCharges || 0,
          quotedLandedCost: customsDetails.quotedLandedCost || 0,
          items: customsDetails.items || [{
            description: parcelDescription || 'Merchandise',
            quantity: 1,
            weight: parcelWeight,
            value: parcelValue || 0,
            originCountryCode: senderCountry,
            hsCode: customsDetails.hsCode || ''
          }]
        };
      }

      const response = await this.makeRequest('POST', '/v1/shipments', shipmentRequest);

      // Store shipment in database
      const shipment = await prisma.shipment.create({
        data: {
          carrierId: this.carrierId,
          orderId: orderId,
          trackingNumber: response.trackingNumber,
          serviceCode: serviceCode,
          labelUrl: response.labelUrl,
          status: 'CREATED',
          carrierShipmentId: response.shipmentId,
          cost: response.totalCost || 0,
          currency: 'GBP',
          estimatedDelivery: response.estimatedDeliveryDate
            ? new Date(response.estimatedDeliveryDate)
            : null,
          numberOfParcels: numberOfParcels
        }
      });

      await this.logOperation('CREATE_SHIPMENT', 'SUCCESS', {
        orderId,
        trackingNumber: response.trackingNumber,
        serviceCode,
        numberOfParcels
      });

      return {
        success: true,
        shipmentId: shipment.id,
        trackingNumber: response.trackingNumber,
        labelUrl: response.labelUrl,
        labelFormat: 'PDF',
        manifestUrl: response.manifestUrl,
        estimatedDelivery: response.estimatedDeliveryDate,
        cost: response.totalCost,
        currency: 'GBP',
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
   * Get available Parcel Force services with rates
   * @param {Object} fromAddress - Origin address
   * @param {Object} toAddress - Destination address
   * @param {Object} parcelDetails - Parcel details
   */
  async getServices(fromAddress, toAddress, parcelDetails) {
    try {
      await this.checkLimit('get_services', 60, 60000);

      const quoteRequest = {
        accountNumber: this.accountNumber,
        origin: {
          postcode: fromAddress.postcode,
          countryCode: fromAddress.country || 'GB'
        },
        destination: {
          postcode: toAddress.postcode,
          countryCode: toAddress.country || 'GB'
        },
        parcels: [{
          weight: parcelDetails.weight,
          length: parcelDetails.length || 0,
          width: parcelDetails.width || 0,
          height: parcelDetails.height || 0,
          value: parcelDetails.value || 0
        }],
        numberOfParcels: parcelDetails.numberOfParcels || 1
      };

      const response = await this.makeRequest('POST', '/v1/quotes', quoteRequest);

      const services = response.services.map(service => ({
        serviceCode: service.serviceCode,
        serviceName: service.serviceName,
        description: service.description,
        price: service.totalCost,
        currency: 'GBP',
        estimatedDeliveryDays: service.deliveryDays,
        estimatedDeliveryDate: service.estimatedDeliveryDate,
        tracked: true,
        signed: service.signatureRequired,
        compensation: service.compensationLimit,
        features: service.features || []
      }));

      return services;
    } catch (error) {
      console.error('Failed to get Parcel Force services:', error);
      throw error;
    }
  }

  /**
   * Track Parcel Force shipment
   * @param {string} trackingNumber - Parcel Force tracking number
   */
  async trackShipment(trackingNumber) {
    try {
      await this.checkLimit('track_shipment', 60, 60000);

      const response = await this.makeRequest('GET', `/v1/tracking/${trackingNumber}`);

      const trackingData = response.tracking;

      const trackingInfo = {
        trackingNumber: trackingData.trackingNumber,
        status: this.normalizeStatus(trackingData.statusCode),
        statusDescription: trackingData.statusDescription,
        estimatedDelivery: trackingData.estimatedDeliveryDate
          ? new Date(trackingData.estimatedDeliveryDate)
          : null,
        actualDelivery: trackingData.deliveredDate
          ? new Date(trackingData.deliveredDate)
          : null,
        deliveredTo: trackingData.deliveredTo || null,
        signedBy: trackingData.signedBy || null,
        events: (trackingData.events || []).map(event => ({
          timestamp: new Date(event.eventDateTime),
          location: event.location,
          depot: event.depot,
          description: event.description,
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
      console.error('Failed to track Parcel Force shipment:', error);
      throw error;
    }
  }

  /**
   * Cancel Parcel Force shipment
   * @param {string} shipmentId - Parcel Force shipment ID
   */
  async cancelShipment(shipmentId) {
    try {
      await this.checkLimit('cancel_shipment', 60, 60000);

      const shipment = await prisma.shipment.findFirst({
        where: { carrierShipmentId: shipmentId, carrierId: this.carrierId }
      });

      if (!shipment) {
        throw new Error('Shipment not found');
      }

      if (shipment.status === 'COLLECTED' || shipment.status === 'IN_TRANSIT') {
        throw new Error('Cannot cancel shipment after collection');
      }

      await this.makeRequest('DELETE', `/v1/shipments/${shipmentId}`);

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
   * Print/download Parcel Force shipping label
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

      // Otherwise, fetch label from Parcel Force API
      const response = await this.makeRequest(
        'GET',
        `/v1/shipments/${shipment.carrierShipmentId}/label`
      );

      // Update database with label URL
      await prisma.shipment.update({
        where: { id: shipmentId },
        data: { labelUrl: response.labelUrl }
      });

      return {
        labelUrl: response.labelUrl,
        format: response.format || 'PDF',
        trackingNumber: shipment.trackingNumber
      };
    } catch (error) {
      console.error('Failed to get Parcel Force label:', error);
      throw error;
    }
  }

  /**
   * Get Parcel Force service code from friendly service code
   */
  getServiceCode(serviceCode) {
    const serviceCodes = {
      'EXPRESS_9': 'EX09',
      'EXPRESS_10': 'EX10',
      'EXPRESS_AM': 'EXAM',
      'EXPRESS_24': 'EX24',
      'EXPRESS_48': 'EX48',
      'GLOBAL_EXPRESS': 'GLEX',
      'GLOBAL_PRIORITY': 'GLPR',
      'GLOBAL_VALUE': 'GLVA',
      'EURO_PRIORITY': 'EUPR'
    };

    return serviceCodes[serviceCode] || 'EX24'; // Default to Express 24
  }

  /**
   * Normalize Parcel Force status codes to standard statuses
   */
  normalizeStatus(pfStatus) {
    const statusMap = {
      'CREATED': 'CREATED',
      'COLLECTED': 'COLLECTED',
      'IN_DEPOT': 'IN_TRANSIT',
      'IN_TRANSIT': 'IN_TRANSIT',
      'OUT_FOR_DELIVERY': 'OUT_FOR_DELIVERY',
      'DELIVERED': 'DELIVERED',
      'DELIVERY_ATTEMPTED': 'EXCEPTION',
      'HELD_AT_DEPOT': 'EXCEPTION',
      'RETURNED_TO_SENDER': 'RETURNED',
      'CANCELLED': 'CANCELLED'
    };

    return statusMap[pfStatus] || 'UNKNOWN';
  }

  /**
   * Request proof of delivery
   * @param {string} trackingNumber - Parcel Force tracking number
   */
  async getProofOfDelivery(trackingNumber) {
    try {
      await this.checkLimit('get_pod', 60, 60000);

      const response = await this.makeRequest(
        'GET',
        `/v1/tracking/${trackingNumber}/pod`
      );

      return {
        trackingNumber: trackingNumber,
        deliveryDate: new Date(response.deliveryDate),
        deliveryTime: response.deliveryTime,
        signedBy: response.signedBy,
        signatureImageUrl: response.signatureImageUrl,
        recipientType: response.recipientType, // e.g., 'RESIDENT', 'NEIGHBOUR', 'RECEPTION'
        location: response.deliveryLocation
      };
    } catch (error) {
      console.error('Failed to get Parcel Force proof of delivery:', error);
      throw error;
    }
  }

  /**
   * Arrange collection for Parcel Force parcels
   * @param {Object} collectionDetails - Collection details
   */
  async arrangeCollection(collectionDetails) {
    try {
      await this.checkLimit('arrange_collection', 60, 60000);

      const {
        collectionDate,
        readyTime,
        closeTime,
        collectionAddress,
        contactName,
        contactPhone,
        shipmentIds,
        specialInstructions
      } = collectionDetails;

      const collectionRequest = {
        accountNumber: this.accountNumber,
        contractNumber: this.contractNumber,
        collectionDate: collectionDate,
        readyTime: readyTime || '09:00',
        closeTime: closeTime || '17:00',
        address: {
          companyName: collectionAddress.company || '',
          addressLine1: collectionAddress.line1,
          addressLine2: collectionAddress.line2 || '',
          town: collectionAddress.city,
          county: collectionAddress.county || '',
          postcode: collectionAddress.postcode,
          countryCode: collectionAddress.country || 'GB'
        },
        contactDetails: {
          name: contactName,
          telephone: contactPhone
        },
        shipmentIds: shipmentIds,
        specialInstructions: specialInstructions || ''
      };

      const response = await this.makeRequest('POST', '/v1/collections', collectionRequest);

      await this.logOperation('ARRANGE_COLLECTION', 'SUCCESS', {
        collectionDate,
        collectionId: response.collectionId,
        numberOfShipments: shipmentIds.length
      });

      return {
        success: true,
        collectionId: response.collectionId,
        collectionDate: response.confirmedDate,
        collectionReference: response.collectionReference
      };
    } catch (error) {
      await this.logOperation('ARRANGE_COLLECTION', 'FAILED', {
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Validate address with Parcel Force address validation service
   * @param {Object} address - Address to validate
   */
  async validateAddress(address) {
    try {
      await this.checkLimit('validate_address', 60, 60000);

      const response = await this.makeRequest('POST', '/v1/address/validate', {
        addressLine1: address.line1,
        addressLine2: address.line2 || '',
        town: address.city,
        county: address.county || '',
        postcode: address.postcode,
        countryCode: address.country || 'GB'
      });

      return {
        valid: response.valid,
        confidence: response.confidence, // HIGH, MEDIUM, LOW
        suggestions: response.suggestions || [],
        correctedAddress: response.correctedAddress || null
      };
    } catch (error) {
      console.error('Failed to validate address:', error);
      throw error;
    }
  }
}

module.exports = ParcelForceClient;
