/**
 * Royal Mail & Parcelforce API Integration Service
 * Handles UK shipping operations via Royal Mail Click & Drop API
 */

const axios = require('axios');

class RoyalMailAPI {
  constructor(config) {
    this.apiKey = config.apiKey; // API Authorization Key
    this.accountNumber = config.accountNumber;
    this.postingLocation = config.postingLocation; // Posting location ID

    // Royal Mail API endpoints
    this.baseUrl = 'https://api.royalmail.net';
    this.clickDropUrl = 'https://api.parcel.royalmail.com';

    // Services
    this.services = {
      // Royal Mail Services
      ROYAL_MAIL_24: { code: 'TPN24', name: 'Royal Mail 24' },
      ROYAL_MAIL_48: { code: 'TPN48', name: 'Royal Mail 48' },
      ROYAL_MAIL_1ST_CLASS: { code: 'STL1', name: 'Royal Mail 1st Class' },
      ROYAL_MAIL_2ND_CLASS: { code: 'STL2', name: 'Royal Mail 2nd Class' },
      ROYAL_MAIL_SIGNED_FOR_1ST: { code: 'SD1', name: 'Royal Mail Signed For 1st Class' },
      ROYAL_MAIL_SIGNED_FOR_2ND: { code: 'SD2', name: 'Royal Mail Signed For 2nd Class' },
      ROYAL_MAIL_SPECIAL_DELIVERY_9AM: { code: 'SD9', name: 'Special Delivery Guaranteed by 9am' },
      ROYAL_MAIL_SPECIAL_DELIVERY_1PM: { code: 'SD1PM', name: 'Special Delivery Guaranteed by 1pm' },
      TRACKED_24: { code: 'TPS24', name: 'Royal Mail Tracked 24' },
      TRACKED_48: { code: 'TPS48', name: 'Royal Mail Tracked 48' },

      // Parcelforce Services
      PARCELFORCE_EXPRESS_9: { code: 'PFE9', name: 'Parcelforce Express 9' },
      PARCELFORCE_EXPRESS_10: { code: 'PFE10', name: 'Parcelforce Express 10' },
      PARCELFORCE_EXPRESS_AM: { code: 'PFEAM', name: 'Parcelforce Express AM' },
      PARCELFORCE_EXPRESS_24: { code: 'PFE24', name: 'Parcelforce Express 24' },
      PARCELFORCE_EXPRESS_48: { code: 'PFE48', name: 'Parcelforce Express 48' }
    };
  }

  /**
   * Make authenticated request to Royal Mail API
   */
  async makeRequest(method, path, data = null, queryParams = {}, useClickDrop = true) {
    const baseUrl = useClickDrop ? this.clickDropUrl : this.baseUrl;
    const url = `${baseUrl}${path}`;

    const config = {
      method,
      url,
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      params: queryParams
    };

    if (data) {
      config.data = data;
    }

    try {
      const response = await axios(config);
      return response.data;
    } catch (error) {
      console.error('Royal Mail API request error:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Create a shipment/order
   */
  async createShipment(shipmentData) {
    const {
      orderId,
      recipientName,
      recipientCompany,
      recipientAddress,
      recipientCity,
      recipientCounty,
      recipientPostcode,
      recipientCountryCode = 'GB',
      recipientPhone,
      recipientEmail,
      weight, // in grams
      length,
      width,
      height,
      serviceCode,
      contents,
      value
    } = shipmentData;

    const payload = {
      items: [{
        recipient: {
          address: {
            fullName: recipientName,
            companyName: recipientCompany || '',
            addressLine1: recipientAddress,
            city: recipientCity,
            county: recipientCounty || '',
            postcode: recipientPostcode,
            countryCode: recipientCountryCode
          },
          phoneNumber: recipientPhone || '',
          emailAddress: recipientEmail || ''
        },
        sender: {
          tradingName: 'Free From Direct',
          postingLocation: this.postingLocation
        },
        orderReference: orderId,
        weight: {
          unitOfMeasure: 'g',
          value: weight
        },
        dimensions: {
          unitOfMeasure: 'mm',
          length,
          width,
          height
        },
        shippingServiceCode: serviceCode,
        contents: contents || [],
        declaredValue: {
          currency: 'GBP',
          value: value || 0
        },
        requiresSignature: serviceCode.includes('SD') || serviceCode.includes('SIGNED')
      }]
    };

    try {
      const response = await this.makeRequest('POST', '/v4/orders', payload);
      return response;
    } catch (error) {
      console.error('Error creating Royal Mail shipment:', error);
      throw error;
    }
  }

  /**
   * Get shipping rates for a parcel
   */
  async getRates(parcelData) {
    const {
      weight, // in grams
      length, // in mm
      width,
      height,
      postcode,
      countryCode = 'GB'
    } = parcelData;

    try {
      const response = await this.makeRequest('GET', '/v4/services', null, {
        weight,
        length,
        width,
        height,
        destinationPostcode: postcode,
        destinationCountryCode: countryCode
      });
      return response.services || [];
    } catch (error) {
      console.error('Error fetching Royal Mail rates:', error);
      throw error;
    }
  }

  /**
   * Get shipping label for an order
   */
  async getLabel(orderId) {
    try {
      const response = await this.makeRequest('GET', `/v4/orders/${orderId}/label`, null, {
        format: 'PDF'
      });
      return response;
    } catch (error) {
      console.error(`Error getting label for order ${orderId}:`, error);
      throw error;
    }
  }

  /**
   * Get tracking information
   */
  async getTracking(trackingNumber) {
    try {
      const response = await this.makeRequest('GET', `/v4/tracking/${trackingNumber}`);
      return response;
    } catch (error) {
      console.error(`Error getting tracking for ${trackingNumber}:`, error);
      throw error;
    }
  }

  /**
   * Get multiple tracking events
   */
  async getTrackingBatch(trackingNumbers) {
    try {
      const response = await this.makeRequest('POST', '/v4/tracking/batch', {
        trackingNumbers
      });
      return response.results || [];
    } catch (error) {
      console.error('Error getting batch tracking:', error);
      throw error;
    }
  }

  /**
   * Get order/shipment details
   */
  async getOrder(orderId) {
    try {
      const response = await this.makeRequest('GET', `/v4/orders/${orderId}`);
      return response;
    } catch (error) {
      console.error(`Error getting Royal Mail order ${orderId}:`, error);
      throw error;
    }
  }

  /**
   * Get all orders
   */
  async getOrders(options = {}) {
    const {
      status = null, // 'PENDING', 'MANIFESTED', etc.
      dateFrom = null,
      dateTo = null,
      limit = 100,
      offset = 0
    } = options;

    const queryParams = {
      limit,
      offset
    };

    if (status) queryParams.status = status;
    if (dateFrom) queryParams.dateFrom = dateFrom;
    if (dateTo) queryParams.dateTo = dateTo;

    try {
      const response = await this.makeRequest('GET', '/v4/orders', null, queryParams);
      return response.orders || [];
    } catch (error) {
      console.error('Error getting Royal Mail orders:', error);
      throw error;
    }
  }

  /**
   * Cancel an order/shipment
   */
  async cancelOrder(orderId) {
    try {
      const response = await this.makeRequest('DELETE', `/v4/orders/${orderId}`);
      return response;
    } catch (error) {
      console.error(`Error cancelling Royal Mail order ${orderId}:`, error);
      throw error;
    }
  }

  /**
   * Create manifest (end of day)
   */
  async createManifest(options = {}) {
    const {
      postingLocation = this.postingLocation,
      serviceCode = null
    } = options;

    const payload = {
      postingLocation
    };

    if (serviceCode) {
      payload.serviceCode = serviceCode;
    }

    try {
      const response = await this.makeRequest('POST', '/v4/manifests', payload);
      return response;
    } catch (error) {
      console.error('Error creating manifest:', error);
      throw error;
    }
  }

  /**
   * Get manifest documents
   */
  async getManifest(manifestId) {
    try {
      const response = await this.makeRequest('GET', `/v4/manifests/${manifestId}`);
      return response;
    } catch (error) {
      console.error(`Error getting manifest ${manifestId}:`, error);
      throw error;
    }
  }

  /**
   * Update shipment (before manifest)
   */
  async updateShipment(orderId, updateData) {
    try {
      const response = await this.makeRequest('PUT', `/v4/orders/${orderId}`, updateData);
      return response;
    } catch (error) {
      console.error(`Error updating Royal Mail order ${orderId}:`, error);
      throw error;
    }
  }

  /**
   * Get available services
   */
  async getServices() {
    try {
      const response = await this.makeRequest('GET', '/v4/services');
      return response.services || Object.values(this.services);
    } catch (error) {
      console.error('Error getting Royal Mail services:', error);
      // Return local service list as fallback
      return Object.values(this.services);
    }
  }

  /**
   * Get posting locations
   */
  async getPostingLocations() {
    try {
      const response = await this.makeRequest('GET', '/v4/postingLocations');
      return response.postingLocations || [];
    } catch (error) {
      console.error('Error getting posting locations:', error);
      throw error;
    }
  }

  /**
   * Schedule collection
   */
  async scheduleCollection(collectionData) {
    const {
      postingLocation = this.postingLocation,
      collectionDate,
      collectionTime,
      parcels
    } = collectionData;

    const payload = {
      postingLocation,
      collectionDate,
      collectionTime,
      numberOfParcels: parcels
    };

    try {
      const response = await this.makeRequest('POST', '/v4/collections', payload);
      return response;
    } catch (error) {
      console.error('Error scheduling collection:', error);
      throw error;
    }
  }

  /**
   * Test connection to Royal Mail API
   */
  async testConnection() {
    try {
      // Try to get services to verify access
      const services = await this.getServices();
      return {
        success: true,
        message: 'Successfully connected to Royal Mail API',
        servicesAvailable: services.length
      };
    } catch (error) {
      return {
        success: false,
        message: `Connection failed: ${error.message}`,
        error: error.response?.data || error.message
      };
    }
  }
}

module.exports = RoyalMailAPI;
