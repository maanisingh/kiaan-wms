/**
 * Sandbox Credentials Manager
 *
 * Credentials are stored in environment variables for security.
 * NEVER commit actual credentials to version control.
 *
 * Required environment variables for testing:
 *
 * eBay Sandbox:
 *   EBAY_SANDBOX_APP_ID
 *   EBAY_SANDBOX_CERT_ID
 *   EBAY_SANDBOX_DEV_ID
 *   EBAY_SANDBOX_AUTH_TOKEN
 *
 * Amazon Sandbox:
 *   AMAZON_SANDBOX_CLIENT_ID
 *   AMAZON_SANDBOX_CLIENT_SECRET
 *   AMAZON_SANDBOX_REFRESH_TOKEN
 *
 * Shopify Test Store:
 *   SHOPIFY_TEST_SHOP
 *   SHOPIFY_TEST_ACCESS_TOKEN
 *
 * Royal Mail Sandbox:
 *   ROYAL_MAIL_SANDBOX_CLIENT_ID
 *   ROYAL_MAIL_SANDBOX_CLIENT_SECRET
 *
 * DPD Sandbox:
 *   DPD_SANDBOX_USERNAME
 *   DPD_SANDBOX_PASSWORD
 *   DPD_SANDBOX_ACCOUNT
 */

const sandboxConfigs = {
  EBAY: {
    envVars: {
      appId: 'EBAY_SANDBOX_APP_ID',
      certId: 'EBAY_SANDBOX_CERT_ID',
      devId: 'EBAY_SANDBOX_DEV_ID',
      authToken: 'EBAY_SANDBOX_AUTH_TOKEN'
    },
    defaults: {
      sandbox: true,
      siteId: 3 // UK
    }
  },

  AMAZON_MFN: {
    envVars: {
      clientId: 'AMAZON_SANDBOX_CLIENT_ID',
      clientSecret: 'AMAZON_SANDBOX_CLIENT_SECRET',
      refreshToken: 'AMAZON_SANDBOX_REFRESH_TOKEN'
    },
    defaults: {
      sandbox: true,
      region: 'eu',
      marketplaceId: 'A1F83G8C2ARO7P', // UK
      fulfillmentType: 'MFN'
    }
  },

  AMAZON_FBA: {
    envVars: {
      clientId: 'AMAZON_SANDBOX_CLIENT_ID',
      clientSecret: 'AMAZON_SANDBOX_CLIENT_SECRET',
      refreshToken: 'AMAZON_SANDBOX_REFRESH_TOKEN'
    },
    defaults: {
      sandbox: true,
      region: 'eu',
      marketplaceId: 'A1F83G8C2ARO7P',
      fulfillmentType: 'FBA'
    }
  },

  SHOPIFY: {
    envVars: {
      shop: 'SHOPIFY_TEST_SHOP',
      accessToken: 'SHOPIFY_TEST_ACCESS_TOKEN'
    },
    defaults: {
      apiVersion: '2024-01'
    }
  },

  TIKTOK: {
    envVars: {
      appKey: 'TIKTOK_SANDBOX_APP_KEY',
      appSecret: 'TIKTOK_SANDBOX_APP_SECRET',
      accessToken: 'TIKTOK_SANDBOX_ACCESS_TOKEN',
      shopId: 'TIKTOK_SANDBOX_SHOP_ID'
    },
    defaults: {
      sandbox: true,
      region: 'UK'
    }
  },

  ROYAL_MAIL: {
    envVars: {
      clientId: 'ROYAL_MAIL_SANDBOX_CLIENT_ID',
      clientSecret: 'ROYAL_MAIL_SANDBOX_CLIENT_SECRET'
    },
    defaults: {
      sandbox: true
    }
  },

  DPD: {
    envVars: {
      username: 'DPD_SANDBOX_USERNAME',
      password: 'DPD_SANDBOX_PASSWORD',
      accountNumber: 'DPD_SANDBOX_ACCOUNT'
    },
    defaults: {
      sandbox: true
    }
  },

  PARCEL_FORCE: {
    envVars: {
      apiKey: 'PARCEL_FORCE_SANDBOX_API_KEY',
      accountNumber: 'PARCEL_FORCE_SANDBOX_ACCOUNT',
      contractNumber: 'PARCEL_FORCE_SANDBOX_CONTRACT'
    },
    defaults: {
      sandbox: true
    }
  }
};

/**
 * Get sandbox credentials for an integration
 * @param {string} integrationName - Name of the integration (e.g., 'EBAY', 'SHOPIFY')
 * @returns {Object|null} - Credentials object or null if not configured
 */
function getSandboxCredentials(integrationName) {
  const config = sandboxConfigs[integrationName];

  if (!config) {
    throw new Error(`Unknown integration: ${integrationName}`);
  }

  const credentials = { ...config.defaults };
  const missingVars = [];

  for (const [field, envVar] of Object.entries(config.envVars)) {
    const value = process.env[envVar];
    if (!value) {
      missingVars.push(envVar);
    }
    credentials[field] = value;
  }

  if (missingVars.length > 0) {
    console.warn(`[Sandbox] Missing credentials for ${integrationName}: ${missingVars.join(', ')}`);
    return null;
  }

  return credentials;
}

/**
 * Check if sandbox credentials are available for an integration
 * @param {string} integrationName - Name of the integration
 * @returns {boolean} - True if credentials are available
 */
function hasSandboxCredentials(integrationName) {
  const config = sandboxConfigs[integrationName];
  if (!config) return false;

  for (const envVar of Object.values(config.envVars)) {
    if (!process.env[envVar]) return false;
  }

  return true;
}

/**
 * List all available sandbox integrations
 * @returns {Array<string>} - List of integration names with credentials
 */
function listAvailableSandboxes() {
  return Object.keys(sandboxConfigs).filter(name => hasSandboxCredentials(name));
}

module.exports = {
  getSandboxCredentials,
  hasSandboxCredentials,
  listAvailableSandboxes,
  sandboxConfigs
};
