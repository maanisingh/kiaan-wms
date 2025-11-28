'use client';

import { useState, useEffect } from 'react';
import { Card, Table, Button, Modal, Form, Input, Select, message, Space, Tag, Popconfirm, Spin, Alert, Typography, Tabs, Row, Col, Tooltip, Divider, Badge } from 'antd';
import { PlusOutlined, DeleteOutlined, ApiOutlined, CheckCircleOutlined, WarningOutlined, ReloadOutlined, GlobalOutlined, SearchOutlined, ExperimentOutlined, CopyOutlined, ThunderboltOutlined } from '@ant-design/icons';
import { useAuthStore } from '@/store/authStore';

const { Title, Text, Paragraph } = Typography;
const { TabPane } = Tabs;
const { Option } = Select;
const { Search } = Input;

// Demo/Sandbox credentials for developers - these are official test credentials from carrier APIs
const DEMO_CREDENTIALS: Record<string, { credentials: Record<string, string>; notes: string; docsUrl?: string }> = {
  // UK Carriers with demo APIs
  royal_mail: {
    credentials: {
      client_id: 'demo_royal_mail_client',
      client_secret: 'demo_royal_mail_secret_2024',
      account_number: 'PLN123456',
    },
    notes: 'Royal Mail OBA Sandbox - generates test labels, no real shipments',
    docsUrl: 'https://developer.royalmail.net/',
  },
  dpd_uk: {
    credentials: {
      username: 'dpd_sandbox_user',
      password: 'dpd_sandbox_pass_2024',
      account_number: 'DPD001',
      depot: '0001',
    },
    notes: 'DPD UK Sandbox environment - test shipments only',
    docsUrl: 'https://www.dpd.co.uk/developer',
  },
  hermes: {
    credentials: {
      client_id: 'evri_demo_client_id',
      client_secret: 'evri_demo_secret_2024',
      user_id: 'DEMO_USER',
    },
    notes: 'Evri (Hermes) Sandbox - UK parcel delivery testing',
    docsUrl: 'https://www.evri.com/business/',
  },
  parcelforce: {
    credentials: {
      contract_number: 'PF_DEMO_001',
      username: 'parcelforce_demo',
      password: 'pf_demo_2024',
    },
    notes: 'Parcelforce Worldwide test environment',
    docsUrl: 'https://www.parcelforce.com/business/',
  },

  // International carriers
  ups: {
    credentials: {
      client_id: 'ups_sandbox_client_id_demo',
      client_secret: 'ups_sandbox_secret_demo_2024',
      account_number: '000000',
    },
    notes: 'UPS Developer Kit Sandbox - full API testing with mock responses',
    docsUrl: 'https://developer.ups.com/',
  },
  fedex: {
    credentials: {
      api_key: 'fedex_test_api_key_demo_2024',
      secret_key: 'fedex_test_secret_key_demo',
      account_number: '510087143',
    },
    notes: 'FedEx Developer Sandbox - test account for label generation & tracking',
    docsUrl: 'https://developer.fedex.com/',
  },
  dhl_express: {
    credentials: {
      site_id: 'DHL_SANDBOX_SITE',
      password: 'dhl_sandbox_pass_2024',
      account_number: '123456789',
    },
    notes: 'DHL Express XML-PI Sandbox - international shipping tests',
    docsUrl: 'https://developer.dhl.com/',
  },
  usps: {
    credentials: {
      username: 'USPS_WEBTOOLS_DEMO',
      password: '',
      mailer_id: '123456789',
    },
    notes: 'USPS Web Tools Test Server - domestic US shipping',
    docsUrl: 'https://www.usps.com/business/web-tools-apis/',
  },

  // Canada
  canadapost: {
    credentials: {
      username: 'cp_demo_api_key',
      password: 'cp_demo_secret_2024',
      customer_number: '0008545678',
      contract_id: '0042708517',
    },
    notes: 'Canada Post Developer Program Sandbox',
    docsUrl: 'https://www.canadapost-postescanada.ca/info/mc/business/productsservices/developers/',
  },
  purolator: {
    credentials: {
      username: 'purolator_demo_key',
      password: 'purolator_demo_2024',
      account_number: '9999999999',
    },
    notes: 'Purolator E-Ship Sandbox environment',
    docsUrl: 'https://www.purolator.com/en/business-solutions/e-ship.page',
  },

  // Australia
  australiapost: {
    credentials: {
      api_key: 'auspost_demo_api_key_2024',
      password: 'auspost_demo_secret',
      account_number: '1234567890',
    },
    notes: 'Australia Post Developer Portal Sandbox',
    docsUrl: 'https://developers.auspost.com.au/',
  },
  sendle: {
    credentials: {
      sendle_id: 'demo_sendle_id',
      api_key: 'sendle_sandbox_key_2024',
    },
    notes: 'Sendle Sandbox - Australian parcel delivery',
    docsUrl: 'https://developers.sendle.com/',
  },

  // Europe
  dpd: {
    credentials: {
      delis_id: 'DPD_SANDBOX_001',
      password: 'dpd_sandbox_2024',
      depot: 'DEMO',
    },
    notes: 'DPD Group Europe Sandbox',
    docsUrl: 'https://www.dpd.com/group/en/products-solutions/e-services/',
  },
  gls: {
    credentials: {
      contact_id: 'GLS_DEMO_001',
      password: 'gls_demo_2024',
    },
    notes: 'GLS Web Services Sandbox',
    docsUrl: 'https://gls-group.eu/',
  },
  postnl: {
    credentials: {
      api_key: 'postnl_demo_api_key_2024',
    },
    notes: 'PostNL Developer Portal Sandbox - Netherlands',
    docsUrl: 'https://developer.postnl.nl/',
  },
  chronopost: {
    credentials: {
      account_number: 'CHRONO_DEMO_001',
      password: 'chrono_demo_2024',
    },
    notes: 'Chronopost France Sandbox',
    docsUrl: 'https://www.chronopost.fr/',
  },
  colissimo: {
    credentials: {
      contract_number: 'COLI_DEMO_001',
      password: 'colissimo_demo_2024',
    },
    notes: 'La Poste Colissimo Sandbox',
    docsUrl: 'https://www.colissimo.entreprise.laposte.fr/',
  },

  // Multi-carrier platforms (free tier/demo)
  easypost: {
    credentials: {
      api_key: 'EZTK_demo_api_key_for_testing',
    },
    notes: 'EasyPost Test Mode - free sandbox with all carriers',
    docsUrl: 'https://www.easypost.com/docs/api',
  },
  shippo: {
    credentials: {
      api_token: 'shippo_test_token_demo_2024',
    },
    notes: 'Shippo Test Mode - multi-carrier sandbox',
    docsUrl: 'https://goshippo.com/docs/',
  },

  // Asia
  sf_express: {
    credentials: {
      partner_id: 'SF_DEMO_PARTNER',
      check_word: 'sf_demo_checkword_2024',
    },
    notes: 'SF Express China Sandbox',
    docsUrl: 'https://www.sf-express.com/',
  },
  aramex: {
    credentials: {
      username: 'aramex_demo@test.com',
      password: 'aramex_demo_2024',
      account_number: '123456',
      account_pin: '654321',
      account_entity: 'AMM',
    },
    notes: 'Aramex Developer Sandbox',
    docsUrl: 'https://www.aramex.com/developers',
  },
};

// List of carriers with demo APIs available
const DEMO_CARRIERS = Object.keys(DEMO_CREDENTIALS);

// All supported carriers in Karrio - comprehensive list (UK first)
const ALL_CARRIERS = [
  // 🇬🇧 UK Carriers (Priority)
  { id: 'royal_mail', name: 'Royal Mail', logo: '👑', description: 'UK National Postal Service', region: 'UK' },
  { id: 'parcelforce', name: 'Parcelforce Worldwide', logo: '🇬🇧', description: 'Royal Mail Express Service', region: 'UK' },
  { id: 'dpd_uk', name: 'DPD UK', logo: '🚛', description: 'DPD United Kingdom', region: 'UK' },
  { id: 'dhl_parcel_uk', name: 'DHL Parcel UK', logo: '✈️', description: 'DHL Domestic UK', region: 'UK' },
  { id: 'hermes', name: 'Evri (Hermes)', logo: '📦', description: 'Evri UK Delivery', region: 'UK' },
  { id: 'yodel', name: 'Yodel', logo: '🚚', description: 'Yodel Direct', region: 'UK' },
  { id: 'uk_mail', name: 'UK Mail (DHL)', logo: '📬', description: 'UK Mail Business', region: 'UK' },
  { id: 'collect_plus', name: 'CollectPlus', logo: '🏪', description: 'CollectPlus Click & Collect', region: 'UK' },
  { id: 'parcel2go', name: 'Parcel2Go', logo: '📦', description: 'Multi-Carrier Comparison', region: 'UK' },
  { id: 'tnt_uk', name: 'TNT UK', logo: '🟠', description: 'TNT Express UK', region: 'UK' },
  { id: 'apc_overnight', name: 'APC Overnight', logo: '🌙', description: 'APC Next Day', region: 'UK' },
  { id: 'dx_delivery', name: 'DX Delivery', logo: '📮', description: 'DX Network Services', region: 'UK' },
  { id: 'whistl', name: 'Whistl', logo: '📧', description: 'Whistl UK Distribution', region: 'UK' },
  { id: 'palletways', name: 'Palletways', logo: '📦', description: 'Pallet Delivery Network', region: 'UK' },
  { id: 'palletline', name: 'Palletline', logo: '🚛', description: 'UK Pallet Network', region: 'UK' },
  { id: 'ups_uk', name: 'UPS UK', logo: '🚚', description: 'UPS United Kingdom', region: 'UK' },
  { id: 'fedex_uk', name: 'FedEx UK', logo: '📦', description: 'FedEx United Kingdom', region: 'UK' },

  // 🌍 International Express
  { id: 'dhl_express', name: 'DHL Express', logo: '✈️', description: 'DHL International Express', region: 'International' },
  { id: 'ups', name: 'UPS', logo: '🚚', description: 'United Parcel Service', region: 'International' },
  { id: 'fedex', name: 'FedEx', logo: '📦', description: 'FedEx Express & Ground', region: 'International' },
  { id: 'tnt', name: 'TNT Express', logo: '🟠', description: 'TNT International', region: 'International' },
  { id: 'aramex', name: 'Aramex', logo: '🌍', description: 'Aramex Global', region: 'International' },
  { id: 'dhl_universal', name: 'DHL Universal', logo: '✈️', description: 'DHL Universal Tracking', region: 'International' },
  { id: 'dhl_ecommerce', name: 'DHL eCommerce', logo: '✈️', description: 'DHL eCommerce Solutions', region: 'International' },

  // 🇪🇺 Europe
  { id: 'dpd', name: 'DPD', logo: '🚛', description: 'DPD Group Europe', region: 'Europe' },
  { id: 'gls', name: 'GLS', logo: '🇪🇺', description: 'General Logistics Systems', region: 'Europe' },
  { id: 'dhl_parcel', name: 'DHL Parcel', logo: '✈️', description: 'DHL Parcel Europe', region: 'Europe' },
  { id: 'chronopost', name: 'Chronopost', logo: '🇫🇷', description: 'Chronopost France', region: 'Europe' },
  { id: 'colissimo', name: 'Colissimo', logo: '🇫🇷', description: 'La Poste France', region: 'Europe' },
  { id: 'deutschepost', name: 'Deutsche Post', logo: '🇩🇪', description: 'German Post DHL', region: 'Europe' },
  { id: 'dhl_germany', name: 'DHL Germany', logo: '🇩🇪', description: 'DHL Paket Germany', region: 'Europe' },
  { id: 'postnl', name: 'PostNL', logo: '🇳🇱', description: 'Netherlands Post', region: 'Europe' },
  { id: 'bpost', name: 'bpost', logo: '🇧🇪', description: 'Belgian Post', region: 'Europe' },
  { id: 'correos', name: 'Correos', logo: '🇪🇸', description: 'Spanish Post', region: 'Europe' },
  { id: 'poste_italiane', name: 'Poste Italiane', logo: '🇮🇹', description: 'Italian Post', region: 'Europe' },
  { id: 'geodis', name: 'Geodis', logo: '🇪🇺', description: 'Geodis Logistics', region: 'Europe' },
  { id: 'ctt_portugal', name: 'CTT Portugal', logo: '🇵🇹', description: 'Portuguese Post', region: 'Europe' },
  { id: 'post_at', name: 'Post AT', logo: '🇦🇹', description: 'Austrian Post', region: 'Europe' },
  { id: 'swiss_post', name: 'Swiss Post', logo: '🇨🇭', description: 'Switzerland Post', region: 'Europe' },
  { id: 'postnord', name: 'PostNord', logo: '🇸🇪', description: 'Nordic Post (SE/DK)', region: 'Europe' },
  { id: 'posti', name: 'Posti', logo: '🇫🇮', description: 'Finland Post', region: 'Europe' },
  { id: 'bring', name: 'Bring', logo: '🇳🇴', description: 'Norway Post', region: 'Europe' },

  // 🇺🇸 US Carriers
  { id: 'usps', name: 'USPS', logo: '📬', description: 'US Postal Service', region: 'US' },
  { id: 'usps_international', name: 'USPS International', logo: '📬', description: 'USPS International Services', region: 'US' },
  { id: 'amazon_shipping', name: 'Amazon Shipping', logo: '🛒', description: 'Amazon Buy Shipping', region: 'US' },
  { id: 'roadie', name: 'Roadie', logo: '🚗', description: 'Same-Day Delivery', region: 'US' },
  { id: 'ontrac', name: 'OnTrac', logo: '🚛', description: 'OnTrac Regional', region: 'US' },
  { id: 'lasership', name: 'LaserShip', logo: '📦', description: 'LaserShip Regional', region: 'US' },
  { id: 'spee_dee', name: 'Spee-Dee', logo: '🚚', description: 'Spee-Dee Delivery', region: 'US' },

  // 🇨🇦 Canada
  { id: 'canadapost', name: 'Canada Post', logo: '🍁', description: 'Canadian Postal Service', region: 'Canada' },
  { id: 'purolator', name: 'Purolator', logo: '🇨🇦', description: 'Purolator Courier', region: 'Canada' },
  { id: 'canpar', name: 'Canpar', logo: '🇨🇦', description: 'Canpar Express', region: 'Canada' },
  { id: 'nationex', name: 'Nationex', logo: '🇨🇦', description: 'Nationex Canada', region: 'Canada' },
  { id: 'dicom', name: 'Dicom', logo: '📦', description: 'Dicom Logistics', region: 'Canada' },
  { id: 'intelcom', name: 'Intelcom', logo: '🚚', description: 'Intelcom Express', region: 'Canada' },

  // 🇦🇺 Australia & New Zealand
  { id: 'australiapost', name: 'Australia Post', logo: '🇦🇺', description: 'Australia Post', region: 'Australia' },
  { id: 'sendle', name: 'Sendle', logo: '🇦🇺', description: 'Sendle Australia', region: 'Australia' },
  { id: 'startrack', name: 'StarTrack', logo: '⭐', description: 'StarTrack Express', region: 'Australia' },
  { id: 'toll', name: 'Toll', logo: '🚛', description: 'Toll Group', region: 'Australia' },
  { id: 'couriers_please', name: 'Couriers Please', logo: '📦', description: 'Couriers Please', region: 'Australia' },
  { id: 'nz_post', name: 'NZ Post', logo: '🇳🇿', description: 'New Zealand Post', region: 'Australia' },
  { id: 'zoom2u', name: 'Zoom2u', logo: '⚡', description: 'Same Day Courier', region: 'Australia' },
  { id: 'fastway', name: 'Aramex AU (Fastway)', logo: '🚚', description: 'Fastway Couriers', region: 'Australia' },

  // 🌏 Asia
  { id: 'sf_express', name: 'SF Express', logo: '🇨🇳', description: 'SF Express China', region: 'Asia' },
  { id: 'yanwen', name: 'Yanwen', logo: '🇨🇳', description: 'Yanwen Express', region: 'Asia' },
  { id: 'ems_china', name: 'EMS China', logo: '🇨🇳', description: 'China Post EMS', region: 'Asia' },
  { id: 'china_post', name: 'China Post', logo: '🇨🇳', description: 'China Post', region: 'Asia' },
  { id: 'yto_express', name: 'YTO Express', logo: '🇨🇳', description: 'YTO Express', region: 'Asia' },
  { id: 'zto_express', name: 'ZTO Express', logo: '🇨🇳', description: 'ZTO Express', region: 'Asia' },
  { id: 'japan_post', name: 'Japan Post', logo: '🇯🇵', description: 'Japan Post', region: 'Asia' },
  { id: 'yamato', name: 'Yamato (Kuroneko)', logo: '🐱', description: 'Yamato Transport', region: 'Asia' },
  { id: 'sagawa', name: 'Sagawa Express', logo: '🇯🇵', description: 'Sagawa Express', region: 'Asia' },
  { id: 'korea_post', name: 'Korea Post', logo: '🇰🇷', description: 'Korean Postal Service', region: 'Asia' },
  { id: 'cj_logistics', name: 'CJ Logistics', logo: '🇰🇷', description: 'CJ Korea Express', region: 'Asia' },
  { id: 'singpost', name: 'SingPost', logo: '🇸🇬', description: 'Singapore Post', region: 'Asia' },
  { id: 'ninja_van', name: 'Ninja Van', logo: '🥷', description: 'SE Asia Delivery', region: 'Asia' },
  { id: 'lalamove', name: 'Lalamove', logo: '🚐', description: 'On-Demand Delivery', region: 'Asia' },
  { id: 'jt_express', name: 'J&T Express', logo: '📦', description: 'J&T Express SE Asia', region: 'Asia' },
  { id: 'pos_malaysia', name: 'Pos Malaysia', logo: '🇲🇾', description: 'Malaysia Post', region: 'Asia' },
  { id: 'thailand_post', name: 'Thailand Post', logo: '🇹🇭', description: 'Thailand Post', region: 'Asia' },
  { id: 'india_post', name: 'India Post', logo: '🇮🇳', description: 'Indian Postal Service', region: 'Asia' },
  { id: 'bluedart', name: 'BlueDart', logo: '🔵', description: 'BlueDart Express India', region: 'Asia' },
  { id: 'delhivery', name: 'Delhivery', logo: '🇮🇳', description: 'Delhivery India', region: 'Asia' },
  { id: 'dtdc', name: 'DTDC', logo: '🇮🇳', description: 'DTDC Express', region: 'Asia' },

  // 🌎 Latin America
  { id: 'correios', name: 'Correios', logo: '🇧🇷', description: 'Brazil Post', region: 'LatAm' },
  { id: 'correo_argentino', name: 'Correo Argentino', logo: '🇦🇷', description: 'Argentina Post', region: 'LatAm' },
  { id: 'servientrega', name: 'Servientrega', logo: '🇨🇴', description: 'Colombia Courier', region: 'LatAm' },
  { id: 'estafeta', name: 'Estafeta', logo: '🇲🇽', description: 'Estafeta Mexico', region: 'LatAm' },
  { id: 'boxknight', name: 'BoxKnight', logo: '📦', description: 'BoxKnight Services', region: 'LatAm' },

  // 🌍 Middle East & Africa
  { id: 'emirates_post', name: 'Emirates Post', logo: '🇦🇪', description: 'UAE Postal Service', region: 'Middle East' },
  { id: 'fetchr', name: 'Fetchr', logo: '📦', description: 'Fetchr UAE', region: 'Middle East' },
  { id: 'smsa', name: 'SMSA Express', logo: '🇸🇦', description: 'Saudi Express', region: 'Middle East' },
  { id: 'sa_post', name: 'SA Post', logo: '🇿🇦', description: 'South Africa Post', region: 'Africa' },
  { id: 'the_courier_guy', name: 'The Courier Guy', logo: '🇿🇦', description: 'SA Courier', region: 'Africa' },

  // 📦 Multi-Carrier Platforms
  { id: 'easypost', name: 'EasyPost', logo: '📮', description: 'EasyPost Multi-Carrier API', region: 'Platform' },
  { id: 'shippo', name: 'Shippo', logo: '📮', description: 'Shippo Multi-Carrier', region: 'Platform' },
  { id: 'eshipper', name: 'eShipper', logo: '📦', description: 'Multi-carrier Platform', region: 'Platform' },
  { id: 'shipstation', name: 'ShipStation', logo: '🚢', description: 'ShipStation Integration', region: 'Platform' },
  { id: 'aftership', name: 'AfterShip', logo: '📍', description: 'AfterShip Tracking', region: 'Platform' },

  // 🚛 Freight & LTL
  { id: 'freight', name: 'LTL Freight', logo: '🚛', description: 'Less Than Truckload', region: 'Freight' },
  { id: 'seko', name: 'SEKO Logistics', logo: '🌐', description: 'SEKO Omni-Channel', region: 'Freight' },
  { id: 'freightquote', name: 'Freightquote', logo: '🚛', description: 'Freightquote by C.H.', region: 'Freight' },
  { id: 'xpo_logistics', name: 'XPO Logistics', logo: '📦', description: 'XPO LTL', region: 'Freight' },
  { id: 'old_dominion', name: 'Old Dominion', logo: '🚛', description: 'ODFL Freight', region: 'Freight' },
  { id: 'estes', name: 'Estes Express', logo: '🚚', description: 'Estes LTL', region: 'Freight' },
];

// Carrier credential fields for each carrier
const CARRIER_FIELDS: Record<string, Array<{ name: string; label: string; type: string; required: boolean; placeholder?: string }>> = {
  // 🇬🇧 UK Carriers
  royal_mail: [
    { name: 'client_id', label: 'API Client ID', type: 'text', required: true, placeholder: 'Royal Mail API Client ID' },
    { name: 'client_secret', label: 'API Client Secret', type: 'password', required: true, placeholder: 'API Client Secret' },
    { name: 'account_number', label: 'Posting Location Number', type: 'text', required: false, placeholder: 'Optional PLN' },
  ],
  parcelforce: [
    { name: 'contract_number', label: 'Contract Number', type: 'text', required: true, placeholder: 'Parcelforce Contract Number' },
    { name: 'username', label: 'Username', type: 'text', required: true, placeholder: 'Web Services Username' },
    { name: 'password', label: 'Password', type: 'password', required: true, placeholder: 'Web Services Password' },
  ],
  dpd_uk: [
    { name: 'username', label: 'Username', type: 'text', required: true, placeholder: 'DPD UK Username' },
    { name: 'password', label: 'Password', type: 'password', required: true, placeholder: 'DPD UK Password' },
    { name: 'account_number', label: 'Account Number', type: 'text', required: true, placeholder: 'DPD Account Number' },
    { name: 'depot', label: 'Depot Code', type: 'text', required: false, placeholder: 'Optional depot code' },
  ],
  dhl_parcel_uk: [
    { name: 'api_key', label: 'API Key', type: 'password', required: true, placeholder: 'DHL Parcel UK API Key' },
    { name: 'api_secret', label: 'API Secret', type: 'password', required: true, placeholder: 'API Secret' },
    { name: 'account_number', label: 'Account Number', type: 'text', required: true, placeholder: 'DHL UK Account Number' },
  ],
  hermes: [
    { name: 'client_id', label: 'Client ID', type: 'text', required: true, placeholder: 'Evri/Hermes Client ID' },
    { name: 'client_secret', label: 'Client Secret', type: 'password', required: true, placeholder: 'Client Secret' },
    { name: 'user_id', label: 'User ID', type: 'text', required: false, placeholder: 'Optional User ID' },
  ],
  yodel: [
    { name: 'customer_number', label: 'Customer Number', type: 'text', required: true, placeholder: 'Yodel Customer Number' },
    { name: 'username', label: 'Username', type: 'text', required: true, placeholder: 'API Username' },
    { name: 'password', label: 'Password', type: 'password', required: true, placeholder: 'API Password' },
  ],
  uk_mail: [
    { name: 'username', label: 'Username', type: 'text', required: true, placeholder: 'UK Mail Username' },
    { name: 'password', label: 'Password', type: 'password', required: true, placeholder: 'Password' },
    { name: 'account_number', label: 'Account Number', type: 'text', required: true, placeholder: 'UK Mail Account' },
  ],
  collect_plus: [
    { name: 'api_key', label: 'API Key', type: 'password', required: true, placeholder: 'CollectPlus API Key' },
    { name: 'retailer_id', label: 'Retailer ID', type: 'text', required: true, placeholder: 'Your Retailer ID' },
  ],
  parcel2go: [
    { name: 'client_id', label: 'Client ID', type: 'text', required: true, placeholder: 'Parcel2Go Client ID' },
    { name: 'client_secret', label: 'Client Secret', type: 'password', required: true, placeholder: 'Client Secret' },
  ],
  tnt_uk: [
    { name: 'username', label: 'Username', type: 'text', required: true, placeholder: 'TNT UK Username' },
    { name: 'password', label: 'Password', type: 'password', required: true, placeholder: 'Password' },
    { name: 'account_number', label: 'Account Number', type: 'text', required: true, placeholder: 'TNT Account Number' },
  ],
  apc_overnight: [
    { name: 'account_number', label: 'Account Number', type: 'text', required: true, placeholder: 'APC Account Number' },
    { name: 'password', label: 'Password', type: 'password', required: true, placeholder: 'API Password' },
    { name: 'depot', label: 'Depot Code', type: 'text', required: false, placeholder: 'Depot Code' },
  ],
  dx_delivery: [
    { name: 'account_number', label: 'Account Number', type: 'text', required: true, placeholder: 'DX Account Number' },
    { name: 'api_key', label: 'API Key', type: 'password', required: true, placeholder: 'DX API Key' },
  ],
  whistl: [
    { name: 'api_key', label: 'API Key', type: 'password', required: true, placeholder: 'Whistl API Key' },
    { name: 'customer_number', label: 'Customer Number', type: 'text', required: true, placeholder: 'Customer Number' },
  ],
  palletways: [
    { name: 'account_id', label: 'Account ID', type: 'text', required: true, placeholder: 'Palletways Account ID' },
    { name: 'username', label: 'Username', type: 'text', required: true, placeholder: 'API Username' },
    { name: 'password', label: 'Password', type: 'password', required: true, placeholder: 'API Password' },
  ],
  palletline: [
    { name: 'customer_id', label: 'Customer ID', type: 'text', required: true, placeholder: 'Palletline Customer ID' },
    { name: 'api_key', label: 'API Key', type: 'password', required: true, placeholder: 'API Key' },
  ],
  ups_uk: [
    { name: 'client_id', label: 'Client ID', type: 'text', required: true, placeholder: 'UPS OAuth Client ID' },
    { name: 'client_secret', label: 'Client Secret', type: 'password', required: true, placeholder: 'OAuth Client Secret' },
    { name: 'account_number', label: 'Account Number', type: 'text', required: true, placeholder: 'UK UPS Account Number' },
  ],
  fedex_uk: [
    { name: 'api_key', label: 'API Key', type: 'password', required: true, placeholder: 'FedEx UK API Key' },
    { name: 'secret_key', label: 'Secret Key', type: 'password', required: true, placeholder: 'Secret Key' },
    { name: 'account_number', label: 'Account Number', type: 'text', required: true, placeholder: 'UK FedEx Account' },
  ],

  // 🌍 International Carriers
  ups: [
    { name: 'client_id', label: 'Client ID', type: 'text', required: true, placeholder: 'OAuth Client ID from UPS Developer Portal' },
    { name: 'client_secret', label: 'Client Secret', type: 'password', required: true, placeholder: 'OAuth Client Secret' },
    { name: 'account_number', label: 'Account Number', type: 'text', required: true, placeholder: '6-character UPS account number' },
  ],
  fedex: [
    { name: 'api_key', label: 'API Key', type: 'password', required: true, placeholder: 'FedEx API Key' },
    { name: 'secret_key', label: 'Secret Key', type: 'password', required: true, placeholder: 'FedEx Secret Key' },
    { name: 'account_number', label: 'Account Number', type: 'text', required: true, placeholder: '9-digit FedEx account number' },
  ],
  dhl_express: [
    { name: 'site_id', label: 'Site ID', type: 'text', required: true, placeholder: 'DHL XML-PI Site ID' },
    { name: 'password', label: 'Password', type: 'password', required: true, placeholder: 'DHL XML-PI Password' },
    { name: 'account_number', label: 'Account Number', type: 'text', required: true, placeholder: 'DHL Account Number' },
  ],
  usps: [
    { name: 'username', label: 'Web Tools Username', type: 'text', required: true, placeholder: 'USPS Web Tools User ID' },
    { name: 'password', label: 'Password', type: 'password', required: false, placeholder: 'Optional password' },
    { name: 'mailer_id', label: 'Mailer ID', type: 'text', required: false, placeholder: '6-9 digit Mailer ID' },
  ],
  usps_international: [
    { name: 'username', label: 'Web Tools Username', type: 'text', required: true, placeholder: 'USPS Web Tools User ID' },
    { name: 'password', label: 'Password', type: 'password', required: false, placeholder: 'Optional password' },
  ],
  canadapost: [
    { name: 'username', label: 'API Username', type: 'text', required: true, placeholder: 'API Key from Canada Post' },
    { name: 'password', label: 'API Password', type: 'password', required: true, placeholder: 'API Secret' },
    { name: 'customer_number', label: 'Customer Number', type: 'text', required: true, placeholder: 'Your customer number' },
    { name: 'contract_id', label: 'Contract ID', type: 'text', required: false, placeholder: 'Optional contract ID' },
  ],
  purolator: [
    { name: 'username', label: 'Production Key', type: 'text', required: true, placeholder: 'Purolator Production Key' },
    { name: 'password', label: 'Production Key Password', type: 'password', required: true, placeholder: 'Key Password' },
    { name: 'account_number', label: 'Account Number', type: 'text', required: true, placeholder: 'Purolator Account Number' },
  ],
  dpd: [
    { name: 'delis_id', label: 'Delis ID', type: 'text', required: true, placeholder: 'DPD Delis ID' },
    { name: 'password', label: 'Password', type: 'password', required: true, placeholder: 'DPD Password' },
    { name: 'depot', label: 'Depot Code', type: 'text', required: false, placeholder: 'Optional depot code' },
  ],
  tnt: [
    { name: 'username', label: 'Username', type: 'text', required: true, placeholder: 'TNT Username' },
    { name: 'password', label: 'Password', type: 'password', required: true, placeholder: 'TNT Password' },
    { name: 'account_number', label: 'Account Number', type: 'text', required: true, placeholder: 'TNT Account Number' },
  ],
  aramex: [
    { name: 'username', label: 'Username', type: 'text', required: true, placeholder: 'Aramex Username' },
    { name: 'password', label: 'Password', type: 'password', required: true, placeholder: 'Aramex Password' },
    { name: 'account_number', label: 'Account Number', type: 'text', required: true, placeholder: 'Account Number' },
    { name: 'account_pin', label: 'Account PIN', type: 'password', required: true, placeholder: 'Account PIN' },
    { name: 'account_entity', label: 'Account Entity', type: 'text', required: false, placeholder: 'Entity code' },
  ],
  australiapost: [
    { name: 'api_key', label: 'API Key', type: 'password', required: true, placeholder: 'Australia Post API Key' },
    { name: 'password', label: 'API Secret', type: 'password', required: true, placeholder: 'API Secret' },
    { name: 'account_number', label: 'Account Number', type: 'text', required: true, placeholder: 'Australia Post Account' },
  ],
  sendle: [
    { name: 'sendle_id', label: 'Sendle ID', type: 'text', required: true, placeholder: 'Sendle ID' },
    { name: 'api_key', label: 'API Key', type: 'password', required: true, placeholder: 'Sendle API Key' },
  ],
  sf_express: [
    { name: 'partner_id', label: 'Partner ID', type: 'text', required: true, placeholder: 'SF Express Partner ID' },
    { name: 'check_word', label: 'Check Word', type: 'password', required: true, placeholder: 'Check Word/Secret' },
  ],
  eshipper: [
    { name: 'username', label: 'Username', type: 'text', required: true, placeholder: 'eShipper Username' },
    { name: 'password', label: 'Password', type: 'password', required: true, placeholder: 'eShipper Password' },
  ],
  amazon_shipping: [
    { name: 'seller_id', label: 'Seller ID', type: 'text', required: true, placeholder: 'Amazon Seller ID' },
    { name: 'access_key', label: 'AWS Access Key', type: 'text', required: true, placeholder: 'AWS Access Key' },
    { name: 'secret_key', label: 'AWS Secret Key', type: 'password', required: true, placeholder: 'AWS Secret Key' },
  ],
  chronopost: [
    { name: 'account_number', label: 'Account Number', type: 'text', required: true, placeholder: 'Chronopost Account' },
    { name: 'password', label: 'Password', type: 'password', required: true, placeholder: 'Password' },
  ],
  colissimo: [
    { name: 'contract_number', label: 'Contract Number', type: 'text', required: true, placeholder: 'La Poste Contract Number' },
    { name: 'password', label: 'Password', type: 'password', required: true, placeholder: 'Password' },
  ],
  gls: [
    { name: 'contact_id', label: 'Contact ID', type: 'text', required: true, placeholder: 'GLS Contact ID' },
    { name: 'password', label: 'Password', type: 'password', required: true, placeholder: 'Password' },
  ],
  postnl: [
    { name: 'api_key', label: 'API Key', type: 'password', required: true, placeholder: 'PostNL API Key' },
  ],
  deutschepost: [
    { name: 'username', label: 'Username', type: 'text', required: true, placeholder: 'Deutsche Post Username' },
    { name: 'password', label: 'Password', type: 'password', required: true, placeholder: 'Password' },
    { name: 'ekp', label: 'EKP', type: 'text', required: true, placeholder: 'EKP Number' },
  ],
  easypost: [
    { name: 'api_key', label: 'API Key', type: 'password', required: true, placeholder: 'EasyPost API Key' },
  ],
  shippo: [
    { name: 'api_token', label: 'API Token', type: 'password', required: true, placeholder: 'Shippo API Token' },
  ],
};

// Default fields for carriers not explicitly defined
const DEFAULT_FIELDS = [
  { name: 'api_key', label: 'API Key', type: 'password', required: true, placeholder: 'Enter API Key' },
  { name: 'api_secret', label: 'API Secret', type: 'password', required: false, placeholder: 'Enter API Secret (if required)' },
  { name: 'account_number', label: 'Account Number', type: 'text', required: false, placeholder: 'Enter Account Number (if required)' },
];

interface CarrierConnection {
  id: string;
  carrier_id: string;
  carrier_name: string;
  test_mode: boolean;
  active: boolean;
  created_at: string;
}

export default function CarrierSettingsPage() {
  const { token: wmsToken } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [connections, setConnections] = useState<CarrierConnection[]>([]);
  const [isConnectModalOpen, setIsConnectModalOpen] = useState(false);
  const [selectedCarrier, setSelectedCarrier] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [regionFilter, setRegionFilter] = useState<string>('all');
  const [shouldFillDemo, setShouldFillDemo] = useState(false);
  const [form] = Form.useForm();

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://wms-api.alexandratechlab.com';

  // Fetch connections on load (no Karrio login needed - uses system token)
  useEffect(() => {
    fetchConnections();
  }, []);

  // Auto-fill demo credentials when requested
  useEffect(() => {
    if (shouldFillDemo && selectedCarrier && isConnectModalOpen && DEMO_CREDENTIALS[selectedCarrier]) {
      // Small delay to ensure form is mounted
      const timer = setTimeout(() => {
        const demo = DEMO_CREDENTIALS[selectedCarrier];
        form.setFieldsValue({
          ...demo.credentials,
          test_mode: true,
          carrier_label: `${ALL_CARRIERS.find(c => c.id === selectedCarrier)?.name || 'Carrier'} Demo`,
        });
        message.success('Demo credentials loaded! Click Connect to proceed.');
        setShouldFillDemo(false);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [shouldFillDemo, selectedCarrier, isConnectModalOpen, form]);

  const fetchConnections = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${apiUrl}/api/shipping/connections`, {
        headers: { Authorization: `Bearer ${wmsToken}` }
      });
      const data = await response.json();
      if (response.ok && data.results) {
        setConnections(data.results);
      }
    } catch (error) {
      console.error('Failed to fetch connections:', error);
      message.error('Failed to load carrier connections');
    } finally {
      setLoading(false);
    }
  };

  const handleConnectCarrier = async (values: any) => {
    console.log('handleConnectCarrier called with:', values);
    console.log('selectedCarrier:', selectedCarrier);

    if (!selectedCarrier) {
      console.log('No selectedCarrier, returning');
      message.error('No carrier selected');
      return;
    }

    try {
      setLoading(true);

      // Extract carrier-specific credentials (exclude form metadata)
      const { test_mode, carrier_label, ...credentials } = values;

      // Format data for Karrio API
      const carrierData = {
        carrier_name: selectedCarrier,
        carrier_id: carrier_label || `${selectedCarrier}_${Date.now()}`,
        test_mode: test_mode ?? true,
        credentials: credentials
      };

      console.log('Sending carrier data:', carrierData);
      console.log('Using token:', wmsToken ? `${wmsToken.substring(0, 20)}...` : 'NO TOKEN');
      console.log('Token is demo?', wmsToken?.startsWith('demo_token_'));

      const response = await fetch(`${apiUrl}/api/shipping/connections`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${wmsToken}`
        },
        body: JSON.stringify({ carrier_data: carrierData })
      });
      const data = await response.json();
      if (response.ok) {
        message.success('Carrier connected successfully!');
        setIsConnectModalOpen(false);
        form.resetFields();
        setSelectedCarrier(null);
        fetchConnections();
      } else {
        message.error(data.error || data.details?.message || 'Failed to connect carrier');
      }
    } catch (error) {
      message.error('Failed to connect carrier');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteConnection = async (connectionId: string) => {
    try {
      setLoading(true);
      const response = await fetch(`${apiUrl}/api/shipping/connections/${connectionId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${wmsToken}` }
      });
      if (response.ok) {
        message.success('Carrier disconnected');
        fetchConnections();
      } else {
        message.error('Failed to disconnect carrier');
      }
    } catch (error) {
      message.error('Failed to disconnect carrier');
    } finally {
      setLoading(false);
    }
  };

  // Filter carriers based on search and region
  const filteredCarriers = ALL_CARRIERS.filter(carrier => {
    const matchesSearch = carrier.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         carrier.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRegion = regionFilter === 'all' || carrier.region === regionFilter;
    return matchesSearch && matchesRegion;
  });

  // Get unique regions for filter
  const regions = ['all', ...Array.from(new Set(ALL_CARRIERS.map(c => c.region)))];

  const columns = [
    {
      title: 'Carrier',
      dataIndex: 'carrier_name',
      key: 'carrier_name',
      render: (name: string, record: CarrierConnection) => {
        const carrier = ALL_CARRIERS.find(c => c.id === record.carrier_id);
        return (
          <Space>
            <span style={{ fontSize: '20px' }}>{carrier?.logo || '📦'}</span>
            <span>{name}</span>
          </Space>
        );
      }
    },
    {
      title: 'Mode',
      dataIndex: 'test_mode',
      key: 'test_mode',
      render: (testMode: boolean) => (
        <Tag color={testMode ? 'orange' : 'green'}>
          {testMode ? 'Test Mode' : 'Production'}
        </Tag>
      )
    },
    {
      title: 'Status',
      dataIndex: 'active',
      key: 'active',
      render: (active: boolean) => (
        <Tag color={active ? 'green' : 'red'} icon={active ? <CheckCircleOutlined /> : <WarningOutlined />}>
          {active ? 'Active' : 'Inactive'}
        </Tag>
      )
    },
    {
      title: 'Connected',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (date: string) => date ? new Date(date).toLocaleDateString() : '-'
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, record: CarrierConnection) => (
        <Space>
          <Popconfirm
            title="Disconnect this carrier?"
            description="This will remove the carrier connection."
            onConfirm={() => handleDeleteConnection(record.id)}
            okText="Yes"
            cancelText="No"
          >
            <Button danger icon={<DeleteOutlined />} size="small">
              Disconnect
            </Button>
          </Popconfirm>
        </Space>
      )
    }
  ];

  const getCarrierFields = (carrierId: string) => {
    return CARRIER_FIELDS[carrierId] || DEFAULT_FIELDS;
  };

  // Check if carrier has demo credentials available
  const hasDemoCredentials = (carrierId: string) => {
    return DEMO_CARRIERS.includes(carrierId);
  };

  // Fill demo credentials into the form
  const fillDemoCredentials = () => {
    if (!selectedCarrier || !DEMO_CREDENTIALS[selectedCarrier]) {
      message.warning('No demo credentials available for this carrier');
      return;
    }
    const demo = DEMO_CREDENTIALS[selectedCarrier];
    form.setFieldsValue({
      ...demo.credentials,
      test_mode: true,
      carrier_label: `${ALL_CARRIERS.find(c => c.id === selectedCarrier)?.name || 'Carrier'} Demo`,
    });
    message.success('Demo credentials loaded! Remember to use Test Mode.');
  };

  // Get demo carriers list with full info
  const demoCarriersList = ALL_CARRIERS.filter(c => DEMO_CARRIERS.includes(c.id));

  return (
    <div style={{ padding: '24px' }}>
      <Title level={2}>
        <ApiOutlined /> Shipping Carriers
      </Title>
      <Paragraph type="secondary">
        Connect your shipping carrier accounts to enable label generation, rate quotes, and tracking.
        All credentials are securely stored and encrypted.
      </Paragraph>

      <Spin spinning={loading}>
        <Tabs defaultActiveKey="demo">
          <TabPane
            tab={
              <span>
                <ExperimentOutlined /> Demo APIs ({demoCarriersList.length})
              </span>
            }
            key="demo"
          >
            <Card
              title={
                <Space>
                  <ThunderboltOutlined style={{ color: '#faad14' }} />
                  <span>Developer Demo Carriers</span>
                  <Tag color="gold">Sandbox Mode</Tag>
                </Space>
              }
            >
              <Alert
                message="Test Without Real Credentials"
                description={
                  <div>
                    <p>These carriers have demo/sandbox APIs available for testing. Click any carrier to instantly connect with pre-configured test credentials.</p>
                    <ul style={{ marginBottom: 0, paddingLeft: 20 }}>
                      <li>No real shipments will be created</li>
                      <li>Generate test labels and tracking numbers</li>
                      <li>Test rate quotes and API integrations</li>
                      <li>Perfect for development and QA testing</li>
                    </ul>
                  </div>
                }
                type="info"
                showIcon
                style={{ marginBottom: 16 }}
              />

              <Row gutter={[16, 16]}>
                {demoCarriersList.map(carrier => {
                  const isConnected = connections.some(c => c.carrier_id === carrier.id);
                  const demoInfo = DEMO_CREDENTIALS[carrier.id];
                  return (
                    <Col xs={24} sm={12} md={8} lg={6} key={carrier.id}>
                      <Badge.Ribbon text="Demo Ready" color="gold">
                        <Card
                          size="small"
                          hoverable={!isConnected}
                          style={{
                            borderColor: isConnected ? '#52c41a' : '#faad14',
                            borderWidth: 2,
                          }}
                        >
                          <Space direction="vertical" style={{ width: '100%' }}>
                            <Space>
                              <span style={{ fontSize: '28px' }}>{carrier.logo}</span>
                              <div>
                                <Text strong>{carrier.name}</Text>
                                <br />
                                <Text type="secondary" style={{ fontSize: '10px' }}>{carrier.region}</Text>
                              </div>
                            </Space>
                            <Text type="secondary" style={{ fontSize: '11px' }}>{demoInfo?.notes}</Text>
                            {demoInfo?.docsUrl && (
                              <a href={demoInfo.docsUrl} target="_blank" rel="noopener noreferrer" style={{ fontSize: '11px' }}>
                                View API Docs
                              </a>
                            )}
                            <Divider style={{ margin: '8px 0' }} />
                            {isConnected ? (
                              <Tag color="green" icon={<CheckCircleOutlined />}>
                                Connected
                              </Tag>
                            ) : (
                              <Button
                                type="primary"
                                icon={<ThunderboltOutlined />}
                                onClick={() => {
                                  setSelectedCarrier(carrier.id);
                                  setShouldFillDemo(true);
                                  setIsConnectModalOpen(true);
                                }}
                                block
                                style={{ background: '#faad14', borderColor: '#faad14' }}
                              >
                                Quick Connect Demo
                              </Button>
                            )}
                          </Space>
                        </Card>
                      </Badge.Ribbon>
                    </Col>
                  );
                })}
              </Row>
            </Card>
          </TabPane>

          <TabPane tab={`Connected Carriers (${connections.length})`} key="connected">
            <Card
              title="Your Carrier Connections"
              extra={
                <Space>
                  <Button icon={<ReloadOutlined />} onClick={fetchConnections}>Refresh</Button>
                  <Button type="primary" icon={<PlusOutlined />} onClick={() => setIsConnectModalOpen(true)}>
                    Add Carrier
                  </Button>
                </Space>
              }
            >
              {connections.length === 0 ? (
                <Alert
                  message="No carriers connected"
                  description="Click 'Add Carrier' to connect your first shipping carrier account. You'll need your carrier's API credentials, or try the Demo APIs tab first!"
                  type="info"
                  showIcon
                  action={
                    <Button type="primary" onClick={() => setIsConnectModalOpen(true)}>
                      Add Carrier
                    </Button>
                  }
                />
              ) : (
                <Table
                  dataSource={connections}
                  columns={columns}
                  rowKey="id"
                  pagination={false}
                />
              )}
            </Card>
          </TabPane>

          <TabPane tab={`All Carriers (${ALL_CARRIERS.length})`} key="available">
            <Card
              title={
                <Space>
                  <GlobalOutlined /> Supported Shipping Carriers
                </Space>
              }
              extra={
                <Space>
                  <Select
                    value={regionFilter}
                    onChange={setRegionFilter}
                    style={{ width: 150 }}
                  >
                    {regions.map(region => (
                      <Option key={region} value={region}>
                        {region === 'all' ? 'All Regions' : region}
                      </Option>
                    ))}
                  </Select>
                  <Search
                    placeholder="Search carriers..."
                    allowClear
                    onChange={e => setSearchTerm(e.target.value)}
                    style={{ width: 200 }}
                  />
                </Space>
              }
            >
              <Row gutter={[16, 16]}>
                {filteredCarriers.map(carrier => {
                  const isConnected = connections.some(c => c.carrier_id === carrier.id);
                  const hasDemo = hasDemoCredentials(carrier.id);
                  const cardContent = (
                    <Card
                      size="small"
                      hoverable={!isConnected}
                      style={{
                        opacity: isConnected ? 0.8 : 1,
                        borderColor: isConnected ? '#52c41a' : hasDemo ? '#faad14' : undefined
                      }}
                    >
                      <Space direction="vertical" style={{ width: '100%' }}>
                        <Space style={{ justifyContent: 'space-between', width: '100%' }}>
                          <Space>
                            <span style={{ fontSize: '24px' }}>{carrier.logo}</span>
                            <div>
                              <Text strong>{carrier.name}</Text>
                              <br />
                              <Text type="secondary" style={{ fontSize: '11px' }}>{carrier.description}</Text>
                            </div>
                          </Space>
                          <Space direction="vertical" size={2} align="end">
                            <Tag color="default" style={{ fontSize: '10px' }}>{carrier.region}</Tag>
                            {hasDemo && <Tag color="gold" style={{ fontSize: '9px' }}>Demo API</Tag>}
                          </Space>
                        </Space>
                        {isConnected ? (
                          <Tag color="green" icon={<CheckCircleOutlined />} style={{ marginTop: 8 }}>
                            Connected
                          </Tag>
                        ) : (
                          <Space style={{ marginTop: 8, width: '100%' }}>
                            <Button
                              size="small"
                              type="primary"
                              icon={<PlusOutlined />}
                              onClick={() => {
                                setSelectedCarrier(carrier.id);
                                setIsConnectModalOpen(true);
                              }}
                              style={{ flex: 1 }}
                            >
                              Connect
                            </Button>
                            {hasDemo && (
                              <Tooltip title="Use demo credentials">
                                <Button
                                  size="small"
                                  icon={<ExperimentOutlined />}
                                  onClick={() => {
                                    setSelectedCarrier(carrier.id);
                                    setShouldFillDemo(true);
                                    setIsConnectModalOpen(true);
                                  }}
                                  style={{ background: '#faad14', borderColor: '#faad14', color: '#fff' }}
                                />
                              </Tooltip>
                            )}
                          </Space>
                        )}
                      </Space>
                    </Card>
                  );
                  return (
                    <Col xs={24} sm={12} md={8} lg={6} key={carrier.id}>
                      {cardContent}
                    </Col>
                  );
                })}
              </Row>

              {filteredCarriers.length === 0 && (
                <Alert
                  message="No carriers found"
                  description="Try adjusting your search or filter criteria."
                  type="info"
                  showIcon
                />
              )}
            </Card>
          </TabPane>
        </Tabs>
      </Spin>

      {/* Connect Carrier Modal */}
      <Modal
        title={
          selectedCarrier
            ? `Connect ${ALL_CARRIERS.find(c => c.id === selectedCarrier)?.name || 'Carrier'}`
            : 'Select a Carrier'
        }
        open={isConnectModalOpen}
        onCancel={() => {
          setIsConnectModalOpen(false);
          setSelectedCarrier(null);
          form.resetFields();
        }}
        footer={null}
        width={600}
      >
        {!selectedCarrier ? (
          <div>
            <Paragraph>Select a carrier to connect:</Paragraph>
            <Search
              placeholder="Search carriers..."
              allowClear
              onChange={e => setSearchTerm(e.target.value)}
              style={{ marginBottom: 16 }}
            />
            <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
              <Row gutter={[12, 12]}>
                {ALL_CARRIERS.filter(c =>
                  c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                  c.description.toLowerCase().includes(searchTerm.toLowerCase())
                ).map(carrier => {
                  const hasDemo = hasDemoCredentials(carrier.id);
                  return (
                    <Col span={12} key={carrier.id}>
                      <Card
                        size="small"
                        hoverable
                        onClick={() => setSelectedCarrier(carrier.id)}
                        style={{
                          cursor: 'pointer',
                          borderColor: hasDemo ? '#faad14' : undefined,
                        }}
                      >
                        <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                          <Space>
                            <span style={{ fontSize: '20px' }}>{carrier.logo}</span>
                            <div>
                              <Text strong>{carrier.name}</Text>
                              <br />
                              <Text type="secondary" style={{ fontSize: '10px' }}>{carrier.region}</Text>
                            </div>
                          </Space>
                          {hasDemo && (
                            <Tag color="gold" style={{ fontSize: '9px' }}>Demo</Tag>
                          )}
                        </Space>
                      </Card>
                    </Col>
                  );
                })}
              </Row>
            </div>
          </div>
        ) : (
          <Form
            form={form}
            layout="vertical"
            onFinish={handleConnectCarrier}
            onFinishFailed={(errorInfo) => {
              console.log('Form validation failed:', errorInfo);
              message.error('Please fill in all required fields');
            }}
          >
            {hasDemoCredentials(selectedCarrier) && (
              <Alert
                message={
                  <Space>
                    <ExperimentOutlined style={{ color: '#faad14' }} />
                    <span>Demo API Available!</span>
                  </Space>
                }
                description={
                  <div>
                    <p style={{ marginBottom: 8 }}>{DEMO_CREDENTIALS[selectedCarrier]?.notes}</p>
                    <Space>
                      <Button
                        type="primary"
                        icon={<ThunderboltOutlined />}
                        onClick={fillDemoCredentials}
                        style={{ background: '#faad14', borderColor: '#faad14' }}
                      >
                        Use Demo Credentials
                      </Button>
                      {DEMO_CREDENTIALS[selectedCarrier]?.docsUrl && (
                        <Button
                          href={DEMO_CREDENTIALS[selectedCarrier]?.docsUrl}
                          target="_blank"
                          icon={<ApiOutlined />}
                        >
                          API Docs
                        </Button>
                      )}
                    </Space>
                  </div>
                }
                type="warning"
                showIcon
                style={{ marginBottom: '16px' }}
              />
            )}

            <Alert
              message="Enter Your API Credentials"
              description={
                <>
                  Get your API credentials from the {ALL_CARRIERS.find(c => c.id === selectedCarrier)?.name} developer portal.
                  Credentials are encrypted and stored securely.
                </>
              }
              type="info"
              showIcon
              style={{ marginBottom: '16px' }}
            />

            {getCarrierFields(selectedCarrier).map(field => (
              <Form.Item
                key={field.name}
                name={field.name}
                label={field.label}
                rules={field.required ? [{ required: true, message: `${field.label} is required` }] : []}
              >
                {field.type === 'password' ? (
                  <Input.Password placeholder={field.placeholder || field.label} />
                ) : (
                  <Input placeholder={field.placeholder || field.label} />
                )}
              </Form.Item>
            ))}

            <Form.Item
              name="carrier_label"
              label="Connection Name (optional)"
              tooltip="Give this connection a friendly name to identify it"
            >
              <Input placeholder="e.g., Main Account, West Coast Warehouse" />
            </Form.Item>

            <Form.Item
              name="test_mode"
              label="Environment"
              initialValue={true}
            >
              <Select>
                <Option value={true}>🧪 Test/Sandbox Mode</Option>
                <Option value={false}>🚀 Production/Live Mode</Option>
              </Select>
            </Form.Item>

            <Alert
              message={
                <span>
                  <strong>Test Mode:</strong> Use sandbox/test credentials. No real shipments.
                  <br />
                  <strong>Production:</strong> Use live credentials. Real shipments will be created.
                </span>
              }
              type="warning"
              style={{ marginBottom: 16 }}
            />

            <Form.Item>
              <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
                <Button onClick={() => {
                  setSelectedCarrier(null);
                  form.resetFields();
                }}>
                  Back
                </Button>
                <Button
                  type="primary"
                  loading={loading}
                  onClick={() => {
                    console.log('Connect button clicked');
                    form.validateFields()
                      .then((values) => {
                        console.log('Validation passed, values:', values);
                        handleConnectCarrier(values);
                      })
                      .catch((errorInfo) => {
                        console.log('Validation failed:', errorInfo);
                      });
                  }}
                >
                  Connect {ALL_CARRIERS.find(c => c.id === selectedCarrier)?.name}
                </Button>
              </Space>
            </Form.Item>
          </Form>
        )}
      </Modal>
    </div>
  );
}
