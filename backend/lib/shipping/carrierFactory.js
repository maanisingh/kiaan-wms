const RoyalMailClient = require('./RoyalMailClient');
const DPDClient = require('./DPDClient');
const ParcelForceClient = require('./ParcelForceClient');
const encryptionService = require('../encryption');

/**
 * Factory for creating shipping carrier clients
 * Handles decryption of credentials and instantiation of correct carrier class
 */
class ShippingCarrierFactory {
  /**
   * Create shipping carrier client based on carrier type
   * @param {Object} carrier - Carrier model from database
   * @returns {BaseShippingClient} - Instantiated carrier client
   */
  static createClient(carrier) {
    if (!carrier) {
      throw new Error('Carrier object is required');
    }

    if (!carrier.isActive) {
      throw new Error(`Carrier ${carrier.id} is not active`);
    }

    // Decrypt stored credentials
    let credentials;
    try {
      const encryptedObj = JSON.parse(carrier.credentials);
      const decryptedJson = encryptionService.decrypt(encryptedObj);
      credentials = JSON.parse(decryptedJson);
    } catch (error) {
      throw new Error(`Failed to decrypt credentials for carrier ${carrier.id}: ${error.message}`);
    }

    // Instantiate appropriate client based on carrier
    switch (carrier.carrierCode) {
      case 'ROYAL_MAIL':
        return new RoyalMailClient(carrier.id, credentials);

      case 'DPD':
        return new DPDClient(carrier.id, credentials);

      case 'PARCEL_FORCE':
        return new ParcelForceClient(carrier.id, credentials);

      case 'AMAZON_BUY_SHIPPING':
        // Note: Amazon Buy Shipping is handled via AmazonSPAPIClient
        // in marketplace integrations - no separate client needed
        throw new Error('Amazon Buy Shipping should be accessed via marketplace integration');

      default:
        throw new Error(`Unsupported carrier: ${carrier.carrierCode}`);
    }
  }

  /**
   * Get list of supported carriers
   * @returns {Array<Object>} - Carrier configurations
   */
  static getSupportedCarriers() {
    return [
      {
        carrierCode: 'ROYAL_MAIL',
        name: 'Royal Mail Click & Drop',
        country: 'GB',
        type: 'NATIONAL',
        requiredCredentials: ['clientId', 'clientSecret'],
        description: 'Royal Mail domestic and international shipping',
        services: [
          { code: 'CRL24', name: 'Royal Mail 24' },
          { code: 'CRL48', name: 'Royal Mail 48' },
          { code: 'TPN24', name: 'Royal Mail Tracked 24' },
          { code: 'TPS48', name: 'Royal Mail Tracked 48' },
          { code: 'SD1', name: 'Special Delivery Guaranteed by 1pm' }
        ],
        features: {
          tracking: true,
          proofOfDelivery: true,
          insurance: true,
          internationalShipping: true,
          pickupService: false,
          labelFormat: 'PDF'
        }
      },
      {
        carrierCode: 'DPD',
        name: 'DPD UK',
        country: 'GB',
        type: 'NATIONAL',
        requiredCredentials: ['username', 'password', 'accountNumber', 'geoSession'],
        description: 'DPD UK domestic parcel delivery',
        services: [
          { code: 'NEXT_DAY', name: 'DPD Next Day' },
          { code: '12:00', name: 'DPD 12:00' },
          { code: '10:30', name: 'DPD 10:30' },
          { code: 'SATURDAY', name: 'DPD Saturday' },
          { code: 'SUNDAY', name: 'DPD Sunday' },
          { code: 'EXPRESS', name: 'DPD Express' }
        ],
        features: {
          tracking: true,
          proofOfDelivery: true,
          insurance: true,
          internationalShipping: true,
          pickupService: true,
          labelFormat: 'PDF',
          realTimeTracking: true,
          oneHourSlot: true
        }
      },
      {
        carrierCode: 'PARCEL_FORCE',
        name: 'Parcel Force Worldwide',
        country: 'GB',
        type: 'INTERNATIONAL',
        requiredCredentials: ['apiKey', 'accountNumber', 'contractNumber'],
        description: 'Parcel Force domestic and international express delivery',
        services: [
          { code: 'EXPRESS_9', name: 'Express 9' },
          { code: 'EXPRESS_10', name: 'Express 10' },
          { code: 'EXPRESS_AM', name: 'Express AM' },
          { code: 'EXPRESS_24', name: 'Express 24' },
          { code: 'EXPRESS_48', name: 'Express 48' },
          { code: 'GLOBAL_EXPRESS', name: 'Global Express' }
        ],
        features: {
          tracking: true,
          proofOfDelivery: true,
          insurance: true,
          internationalShipping: true,
          pickupService: true,
          labelFormat: 'PDF',
          customsDocuments: true,
          signatureOnDelivery: true
        }
      },
      {
        carrierCode: 'AMAZON_BUY_SHIPPING',
        name: 'Amazon Buy Shipping',
        country: 'MULTI',
        type: 'MARKETPLACE',
        requiredCredentials: [],
        description: 'Amazon Buy Shipping (via Amazon SP-API Integration)',
        services: [
          { code: 'STANDARD', name: 'Amazon Standard Shipping' },
          { code: 'EXPEDITED', name: 'Amazon Expedited Shipping' },
          { code: 'PRIORITY', name: 'Amazon Priority Shipping' }
        ],
        features: {
          tracking: true,
          proofOfDelivery: true,
          insurance: true,
          internationalShipping: true,
          pickupService: false,
          labelFormat: 'PDF',
          autoRating: true
        },
        note: 'Access via Amazon SP-API integration - no separate credentials needed'
      }
    ];
  }

  /**
   * Validate credentials for a carrier
   * @param {string} carrierCode - Carrier code
   * @param {Object} credentials - Credentials object to validate
   * @returns {Object} - Validation result with errors if any
   */
  static validateCredentials(carrierCode, credentials) {
    const carrierConfig = this.getSupportedCarriers().find(c => c.carrierCode === carrierCode);

    if (!carrierConfig) {
      return {
        valid: false,
        errors: [`Unknown carrier: ${carrierCode}`]
      };
    }

    const errors = [];
    const missingFields = [];

    for (const field of carrierConfig.requiredCredentials) {
      if (!credentials[field]) {
        missingFields.push(field);
      }
    }

    if (missingFields.length > 0) {
      errors.push(`Missing required credentials: ${missingFields.join(', ')}`);
    }

    // Carrier-specific validation
    switch (carrierCode) {
      case 'ROYAL_MAIL':
        if (credentials.clientId && credentials.clientId.length < 10) {
          errors.push('Royal Mail clientId appears to be invalid');
        }
        break;

      case 'DPD':
        if (credentials.accountNumber && isNaN(credentials.accountNumber)) {
          errors.push('DPD account number must be numeric');
        }
        break;

      case 'PARCEL_FORCE':
        if (credentials.accountNumber && credentials.accountNumber.length < 8) {
          errors.push('Parcel Force account number appears to be invalid');
        }
        break;
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Test carrier connection
   * @param {Object} carrier - Carrier model
   * @returns {Promise<Object>} - Connection test result
   */
  static async testConnection(carrier) {
    try {
      const client = this.createClient(carrier);

      // Test with a simple operation - get available services
      switch (carrier.carrierCode) {
        case 'ROYAL_MAIL':
          await client.authenticate();
          return {
            success: true,
            message: 'Successfully connected to Royal Mail Click & Drop API'
          };

        case 'DPD':
          await client.authenticate();
          return {
            success: true,
            message: 'Successfully connected to DPD UK API'
          };

        case 'PARCEL_FORCE':
          // Test with a simple address validation
          const testResult = await client.validateAddress({
            line1: '123 Test Street',
            city: 'London',
            postcode: 'SW1A 1AA',
            country: 'GB'
          });
          return {
            success: true,
            message: 'Successfully connected to Parcel Force API'
          };

        default:
          return {
            success: false,
            message: 'Connection test not implemented for this carrier'
          };
      }
    } catch (error) {
      return {
        success: false,
        message: error.message,
        error: error.toString()
      };
    }
  }

  /**
   * Get carrier service details
   * @param {string} carrierCode - Carrier code
   * @param {string} serviceCode - Service code
   */
  static getServiceDetails(carrierCode, serviceCode) {
    const carrier = this.getSupportedCarriers().find(c => c.carrierCode === carrierCode);

    if (!carrier) {
      return null;
    }

    const service = carrier.services.find(s => s.code === serviceCode);

    if (!service) {
      return null;
    }

    return {
      ...service,
      carrier: {
        code: carrier.carrierCode,
        name: carrier.name
      },
      features: carrier.features
    };
  }

  /**
   * Get all services for a carrier
   * @param {string} carrierCode - Carrier code
   */
  static getCarrierServices(carrierCode) {
    const carrier = this.getSupportedCarriers().find(c => c.carrierCode === carrierCode);

    if (!carrier) {
      return [];
    }

    return carrier.services.map(service => ({
      ...service,
      carrier: {
        code: carrier.carrierCode,
        name: carrier.name
      }
    }));
  }

  /**
   * Compare shipping rates across carriers
   * @param {Object} fromAddress - Origin address
   * @param {Object} toAddress - Destination address
   * @param {Object} parcelDetails - Parcel details
   * @param {Array<string>} carrierCodes - Carrier codes to compare (optional, defaults to all)
   */
  static async compareRates(fromAddress, toAddress, parcelDetails, carrierCodes = null) {
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();

    try {
      // Get active carriers
      const whereClause = { isActive: true };
      if (carrierCodes && carrierCodes.length > 0) {
        whereClause.carrierCode = { in: carrierCodes };
      }

      const carriers = await prisma.shippingCarrier.findMany({
        where: whereClause
      });

      const rates = [];

      for (const carrier of carriers) {
        try {
          const client = this.createClient(carrier);
          const services = await client.getServices(fromAddress, toAddress, parcelDetails);

          for (const service of services) {
            rates.push({
              carrier: {
                id: carrier.id,
                code: carrier.carrierCode,
                name: carrier.name
              },
              service: {
                code: service.serviceCode,
                name: service.serviceName,
                description: service.description
              },
              price: service.price,
              currency: service.currency,
              estimatedDeliveryDays: service.estimatedDeliveryDays,
              estimatedDeliveryDate: service.estimatedDeliveryDate,
              features: {
                tracked: service.tracked,
                signed: service.signed,
                compensation: service.compensation
              }
            });
          }
        } catch (error) {
          console.error(`Failed to get rates from ${carrier.carrierCode}:`, error.message);
          // Continue with other carriers
        }
      }

      // Sort by price (cheapest first)
      rates.sort((a, b) => (a.price || 999999) - (b.price || 999999));

      return rates;
    } catch (error) {
      console.error('Failed to compare shipping rates:', error);
      throw error;
    }
  }
}

module.exports = ShippingCarrierFactory;
