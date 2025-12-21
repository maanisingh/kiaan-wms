'use client';

import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Modal, Form, Input, Select, message, Space, Tag, Popconfirm, Spin, Alert, Typography, Tabs, Row, Col, Tooltip, Divider, Switch, Badge, Descriptions } from 'antd';
import {
  PlusOutlined,
  DeleteOutlined,
  ApiOutlined,
  CheckCircleOutlined,
  WarningOutlined,
  ReloadOutlined,
  ShopOutlined,
  AmazonOutlined,
  EyeOutlined,
  EyeInvisibleOutlined,
  EditOutlined,
  SyncOutlined,
  SettingOutlined,
  SafetyCertificateOutlined,
  CloudOutlined,
  LinkOutlined
} from '@ant-design/icons';
import apiService from '@/services/api';

const { Title, Text, Paragraph } = Typography;
const { TabPane } = Tabs;
const { Option } = Select;

// Marketplace types matching the backend enum
const MARKETPLACE_TYPES = [
  { id: 'AMAZON_FBA', name: 'Amazon FBA', logo: '🛒', description: 'Fulfillment by Amazon', color: '#FF9900' },
  { id: 'AMAZON_MFN', name: 'Amazon MFN', logo: '📦', description: 'Merchant Fulfilled Network', color: '#FF9900' },
  { id: 'SHOPIFY', name: 'Shopify', logo: '🛍️', description: 'Shopify Store', color: '#96BF48' },
  { id: 'EBAY', name: 'eBay', logo: '🏷️', description: 'eBay Marketplace', color: '#E53238' },
  { id: 'TIKTOK', name: 'TikTok Shop', logo: '🎵', description: 'TikTok Commerce', color: '#000000' },
  { id: 'TEMU', name: 'Temu', logo: '🛒', description: 'Temu Platform', color: '#F56C2D' },
  { id: 'OTHER', name: 'Other', logo: '🔗', description: 'Custom API Integration', color: '#666666' },
];

// Courier types matching the backend enum
const COURIER_TYPES = [
  { id: 'ROYAL_MAIL', name: 'Royal Mail', logo: '👑', description: 'UK National Post', color: '#E20613' },
  { id: 'PARCELFORCE', name: 'Parcelforce', logo: '🇬🇧', description: 'Parcelforce Worldwide', color: '#003087' },
  { id: 'DPD_UK', name: 'DPD UK', logo: '🚛', description: 'DPD United Kingdom', color: '#DC0032' },
  { id: 'EVRI', name: 'Evri (Hermes)', logo: '📦', description: 'Evri UK Delivery', color: '#00A0DC' },
  { id: 'YODEL', name: 'Yodel', logo: '🚚', description: 'Yodel Direct', color: '#00AEEF' },
  { id: 'UPS', name: 'UPS', logo: '🟤', description: 'United Parcel Service', color: '#351C15' },
  { id: 'FEDEX', name: 'FedEx', logo: '📦', description: 'FedEx Express', color: '#4D148C' },
  { id: 'DHL', name: 'DHL', logo: '✈️', description: 'DHL Express', color: '#FFCC00' },
  { id: 'AMAZON_BUY_SHIPPING', name: 'Amazon Buy Shipping', logo: '🛒', description: 'Amazon Shipping', color: '#FF9900' },
  { id: 'OTHER', name: 'Other Courier', logo: '🚚', description: 'Custom Courier API', color: '#666666' },
];

// Credential field definitions for each marketplace
const MARKETPLACE_FIELDS: Record<string, Array<{ name: string; label: string; type: string; required: boolean; placeholder?: string; tooltip?: string }>> = {
  AMAZON_FBA: [
    { name: 'sellerId', label: 'Merchant Token', type: 'text', required: true, placeholder: 'A9OL3A5DX0D9M', tooltip: 'Your Amazon Seller ID / Merchant Token' },
    { name: 'clientId', label: 'Client ID', type: 'text', required: true, placeholder: 'amzn1.application-oa2-client.xxx', tooltip: 'SP-API LWA Client ID' },
    { name: 'clientSecret', label: 'Client Secret', type: 'password', required: true, placeholder: 'amzn1.oa2-cs.v1.xxx', tooltip: 'SP-API LWA Client Secret' },
    { name: 'refreshToken', label: 'Refresh Token', type: 'password', required: false, placeholder: 'Atzr|xxx', tooltip: 'LWA Refresh Token (auto-generated during OAuth)' },
    { name: 'region', label: 'AWS Region', type: 'select', required: true, placeholder: 'eu-west-1', tooltip: 'AWS region for SP-API' },
  ],
  AMAZON_MFN: [
    { name: 'sellerId', label: 'Merchant Token', type: 'text', required: true, placeholder: 'A9OL3A5DX0D9M', tooltip: 'Your Amazon Seller ID / Merchant Token' },
    { name: 'clientId', label: 'Client ID', type: 'text', required: true, placeholder: 'amzn1.application-oa2-client.xxx', tooltip: 'SP-API LWA Client ID' },
    { name: 'clientSecret', label: 'Client Secret', type: 'password', required: true, placeholder: 'amzn1.oa2-cs.v1.xxx', tooltip: 'SP-API LWA Client Secret' },
    { name: 'refreshToken', label: 'Refresh Token', type: 'password', required: false, placeholder: 'Atzr|xxx', tooltip: 'LWA Refresh Token' },
    { name: 'region', label: 'AWS Region', type: 'select', required: true, placeholder: 'eu-west-1', tooltip: 'AWS region for SP-API' },
  ],
  SHOPIFY: [
    { name: 'shopUrl', label: 'Store URL', type: 'text', required: true, placeholder: 'your-store.myshopify.com', tooltip: 'Your Shopify store domain' },
    { name: 'shopifyAccessToken', label: 'Admin API Access Token', type: 'password', required: true, placeholder: 'shpat_xxx', tooltip: 'Shopify Admin API access token' },
    { name: 'shopifyApiKey', label: 'API Key (Optional)', type: 'text', required: false, placeholder: 'Optional for private apps', tooltip: 'Only needed for custom app development' },
    { name: 'shopifyApiSecret', label: 'API Secret (Optional)', type: 'password', required: false, placeholder: 'Optional for private apps', tooltip: 'Only needed for custom app development' },
  ],
  EBAY: [
    { name: 'ebayEnvironment', label: 'Environment', type: 'select', required: true, placeholder: 'production', tooltip: 'Sandbox for testing, Production for live' },
    { name: 'ebayAppId', label: 'App ID (Client ID)', type: 'text', required: true, placeholder: 'FreeFrom-WMS-PRD-xxx', tooltip: 'eBay Application Client ID' },
    { name: 'ebayDevId', label: 'Dev ID', type: 'text', required: true, placeholder: '32b0b799-xxx', tooltip: 'eBay Developer ID' },
    { name: 'ebayCertId', label: 'Cert ID (Client Secret)', type: 'password', required: true, placeholder: 'PRD-xxx', tooltip: 'eBay Certificate ID / Client Secret' },
    { name: 'ebayAuthToken', label: 'OAuth Token', type: 'password', required: false, placeholder: 'Auto-generated via OAuth flow', tooltip: 'User access token (generated via OAuth)' },
    { name: 'ebayRefreshToken', label: 'Refresh Token', type: 'password', required: false, placeholder: 'Auto-generated via OAuth flow', tooltip: 'Refresh token for token renewal' },
  ],
  TIKTOK: [
    { name: 'storeId', label: 'Shop ID', type: 'text', required: true, placeholder: 'Your TikTok Shop ID', tooltip: 'TikTok Shop identifier' },
    { name: 'apiKey', label: 'App Key', type: 'text', required: true, placeholder: 'TikTok App Key', tooltip: 'Your TikTok app key' },
    { name: 'apiSecret', label: 'App Secret', type: 'password', required: true, placeholder: 'TikTok App Secret', tooltip: 'Your TikTok app secret' },
    { name: 'accessToken', label: 'Access Token', type: 'password', required: false, placeholder: 'Access token', tooltip: 'OAuth access token' },
  ],
  TEMU: [
    { name: 'storeId', label: 'Seller ID', type: 'text', required: true, placeholder: 'Your Temu Seller ID', tooltip: 'Temu Seller identifier' },
    { name: 'apiKey', label: 'API Key', type: 'password', required: true, placeholder: 'Temu API Key', tooltip: 'Your Temu API key' },
    { name: 'apiSecret', label: 'API Secret', type: 'password', required: true, placeholder: 'Temu API Secret', tooltip: 'Your Temu API secret' },
  ],
  OTHER: [
    { name: 'storeId', label: 'Store/Account ID', type: 'text', required: false, placeholder: 'Store identifier', tooltip: 'Platform-specific store ID' },
    { name: 'apiKey', label: 'API Key', type: 'password', required: true, placeholder: 'API Key', tooltip: 'API authentication key' },
    { name: 'apiSecret', label: 'API Secret', type: 'password', required: false, placeholder: 'API Secret', tooltip: 'API secret if required' },
    { name: 'shopUrl', label: 'API Base URL', type: 'text', required: false, placeholder: 'https://api.example.com', tooltip: 'Base URL for API calls' },
  ],
};

// Courier credential field definitions
const COURIER_FIELDS: Record<string, Array<{ name: string; label: string; type: string; required: boolean; placeholder?: string; tooltip?: string }>> = {
  ROYAL_MAIL: [
    { name: 'apiKey', label: 'API Authorisation Key', type: 'password', required: true, placeholder: 'e5b8471f-e8ae-418a-xxx', tooltip: 'Royal Mail Click & Drop API key' },
    { name: 'royalMailPostingLocation', label: 'Posting Location', type: 'text', required: false, placeholder: 'Optional posting location ID', tooltip: 'Your posting location identifier' },
  ],
  PARCELFORCE: [
    { name: 'apiKey', label: 'API Authorisation Key', type: 'password', required: true, placeholder: 'Same as Royal Mail key', tooltip: 'Parcelforce uses same Royal Mail API' },
    { name: 'parcelforceContractNumber', label: 'Contract Number', type: 'text', required: false, placeholder: 'Your Parcelforce contract number', tooltip: 'Contract number for business accounts' },
  ],
  DPD_UK: [
    { name: 'username', label: 'Username', type: 'text', required: true, placeholder: 'DPD account username', tooltip: 'DPD web services username' },
    { name: 'password', label: 'Password', type: 'password', required: true, placeholder: 'DPD account password', tooltip: 'DPD web services password' },
    { name: 'accountNumber', label: 'Account Number', type: 'text', required: true, placeholder: 'DPD account number', tooltip: 'Your DPD account number' },
    { name: 'dpdGeoSession', label: 'GeoSession (Optional)', type: 'text', required: false, placeholder: 'GeoSession token', tooltip: 'Session token for geo services' },
  ],
  EVRI: [
    { name: 'apiKey', label: 'Client ID', type: 'text', required: true, placeholder: 'Evri Client ID', tooltip: 'Evri API Client ID' },
    { name: 'apiSecret', label: 'Client Secret', type: 'password', required: true, placeholder: 'Evri Client Secret', tooltip: 'Evri API Client Secret' },
  ],
  YODEL: [
    { name: 'username', label: 'Username', type: 'text', required: true, placeholder: 'Yodel username', tooltip: 'Yodel API username' },
    { name: 'password', label: 'Password', type: 'password', required: true, placeholder: 'Yodel password', tooltip: 'Yodel API password' },
    { name: 'accountNumber', label: 'Customer Number', type: 'text', required: true, placeholder: 'Customer number', tooltip: 'Your Yodel customer number' },
  ],
  UPS: [
    { name: 'apiKey', label: 'Client ID', type: 'text', required: true, placeholder: 'UPS OAuth Client ID', tooltip: 'OAuth Client ID from UPS Developer Portal' },
    { name: 'apiSecret', label: 'Client Secret', type: 'password', required: true, placeholder: 'OAuth Client Secret', tooltip: 'OAuth Client Secret' },
    { name: 'accountNumber', label: 'Account Number', type: 'text', required: true, placeholder: '6-character account number', tooltip: 'Your UPS shipper account number' },
  ],
  FEDEX: [
    { name: 'apiKey', label: 'API Key', type: 'password', required: true, placeholder: 'FedEx API Key', tooltip: 'FedEx REST API Key' },
    { name: 'apiSecret', label: 'Secret Key', type: 'password', required: true, placeholder: 'FedEx Secret Key', tooltip: 'FedEx REST Secret Key' },
    { name: 'accountNumber', label: 'Account Number', type: 'text', required: true, placeholder: '9-digit account', tooltip: 'FedEx account number' },
  ],
  DHL: [
    { name: 'username', label: 'Site ID', type: 'text', required: true, placeholder: 'DHL Site ID', tooltip: 'DHL XML-PI Site ID' },
    { name: 'password', label: 'Password', type: 'password', required: true, placeholder: 'DHL Password', tooltip: 'DHL XML-PI Password' },
    { name: 'accountNumber', label: 'Account Number', type: 'text', required: true, placeholder: 'DHL Account', tooltip: 'Your DHL account number' },
  ],
  AMAZON_BUY_SHIPPING: [
    { name: 'apiKey', label: 'Seller ID', type: 'text', required: true, placeholder: 'Amazon Seller ID', tooltip: 'Your Amazon Seller Central ID' },
    { name: 'accessToken', label: 'MWS Auth Token', type: 'password', required: true, placeholder: 'MWS Authorization Token', tooltip: 'MWS authorization token' },
  ],
  OTHER: [
    { name: 'apiKey', label: 'API Key', type: 'password', required: true, placeholder: 'API Key', tooltip: 'Primary API key' },
    { name: 'apiSecret', label: 'API Secret', type: 'password', required: false, placeholder: 'API Secret', tooltip: 'Secondary API secret' },
    { name: 'accountNumber', label: 'Account Number', type: 'text', required: false, placeholder: 'Account identifier', tooltip: 'Account number if required' },
  ],
};

// AWS Region options for Amazon
const AWS_REGIONS = [
  { value: 'eu-west-1', label: 'EU West (Ireland) - UK/EU Sellers' },
  { value: 'us-east-1', label: 'US East (N. Virginia) - NA Sellers' },
  { value: 'us-west-2', label: 'US West (Oregon)' },
  { value: 'eu-west-2', label: 'EU West (London)' },
];

interface MarketplaceConnection {
  id: string;
  marketplace: string;
  accountName: string;
  isActive: boolean;
  autoSyncOrders: boolean;
  autoSyncStock: boolean;
  syncFrequency: number;
  lastSyncAt: string | null;
  lastSyncError: string | null;
  createdAt: string;
  // Credential fields - masked for display
  sellerId?: string;
  shopUrl?: string;
  ebayEnvironment?: string;
}

interface CourierConnection {
  id: string;
  courier: string;
  accountName: string;
  isActive: boolean;
  isDefault: boolean;
  testMode: boolean;
  createdAt: string;
}

export default function MarketplaceAPISettingsPage() {
  const [loading, setLoading] = useState(false);
  const [marketplaceConnections, setMarketplaceConnections] = useState<MarketplaceConnection[]>([]);
  const [courierConnections, setCourierConnections] = useState<CourierConnection[]>([]);
  const [isMarketplaceModalOpen, setIsMarketplaceModalOpen] = useState(false);
  const [isCourierModalOpen, setIsCourierModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedConnection, setSelectedConnection] = useState<any>(null);
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({});
  const [marketplaceForm] = Form.useForm();
  const [courierForm] = Form.useForm();

  useEffect(() => {
    fetchConnections();
  }, []);

  const fetchConnections = async () => {
    setLoading(true);
    try {
      const [marketplaceData, courierData] = await Promise.all([
        apiService.get('/marketplace-connections'),
        apiService.get('/courier-connections'),
      ]);
      setMarketplaceConnections(marketplaceData || []);
      setCourierConnections(courierData || []);
    } catch (error) {
      console.error('Error fetching connections:', error);
      message.error('Failed to fetch API connections');
    } finally {
      setLoading(false);
    }
  };

  // Marketplace handlers
  const handleAddMarketplace = () => {
    setIsEditMode(false);
    setSelectedConnection(null);
    setSelectedType(null);
    marketplaceForm.resetFields();
    setIsMarketplaceModalOpen(true);
  };

  const handleEditMarketplace = (record: MarketplaceConnection) => {
    setIsEditMode(true);
    setSelectedConnection(record);
    setSelectedType(record.marketplace);
    marketplaceForm.setFieldsValue({
      marketplace: record.marketplace,
      accountName: record.accountName,
      autoSyncOrders: record.autoSyncOrders,
      autoSyncStock: record.autoSyncStock,
      syncFrequency: record.syncFrequency,
      isActive: record.isActive,
      // Note: Don't pre-fill sensitive credentials for security
    });
    setIsMarketplaceModalOpen(true);
  };

  const handleDeleteMarketplace = async (id: string, name: string) => {
    Modal.confirm({
      title: 'Delete Marketplace Connection',
      content: `Are you sure you want to delete "${name}"? This action cannot be undone.`,
      okText: 'Delete',
      okType: 'danger',
      onOk: async () => {
        try {
          await apiService.delete(`/marketplace-connections/${id}`);
          message.success('Marketplace connection deleted');
          fetchConnections();
        } catch (error) {
          message.error('Failed to delete connection');
        }
      },
    });
  };

  const handleMarketplaceSubmit = async (values: any) => {
    try {
      setLoading(true);
      if (isEditMode && selectedConnection) {
        await apiService.put(`/marketplace-connections/${selectedConnection.id}`, values);
        message.success('Marketplace connection updated');
      } else {
        await apiService.post('/marketplace-connections', values);
        message.success('Marketplace connection created');
      }
      setIsMarketplaceModalOpen(false);
      marketplaceForm.resetFields();
      setSelectedType(null);
      fetchConnections();
    } catch (error: any) {
      message.error(error.message || 'Failed to save marketplace connection');
    } finally {
      setLoading(false);
    }
  };

  const handleSyncMarketplace = async (id: string, type: 'orders' | 'stock') => {
    try {
      setLoading(true);
      await apiService.post(`/marketplace-connections/${id}/sync-${type}`);
      message.success(`${type === 'orders' ? 'Order' : 'Stock'} sync initiated`);
      fetchConnections();
    } catch (error) {
      message.error(`Failed to sync ${type}`);
    } finally {
      setLoading(false);
    }
  };

  // Courier handlers
  const handleAddCourier = () => {
    setIsEditMode(false);
    setSelectedConnection(null);
    setSelectedType(null);
    courierForm.resetFields();
    setIsCourierModalOpen(true);
  };

  const handleEditCourier = (record: CourierConnection) => {
    setIsEditMode(true);
    setSelectedConnection(record);
    setSelectedType(record.courier);
    courierForm.setFieldsValue({
      courier: record.courier,
      accountName: record.accountName,
      isDefault: record.isDefault,
      isActive: record.isActive,
      testMode: record.testMode,
    });
    setIsCourierModalOpen(true);
  };

  const handleDeleteCourier = async (id: string, name: string) => {
    Modal.confirm({
      title: 'Delete Courier Connection',
      content: `Are you sure you want to delete "${name}"?`,
      okText: 'Delete',
      okType: 'danger',
      onOk: async () => {
        try {
          await apiService.delete(`/courier-connections/${id}`);
          message.success('Courier connection deleted');
          fetchConnections();
        } catch (error) {
          message.error('Failed to delete connection');
        }
      },
    });
  };

  const handleCourierSubmit = async (values: any) => {
    try {
      setLoading(true);
      if (isEditMode && selectedConnection) {
        await apiService.put(`/courier-connections/${selectedConnection.id}`, values);
        message.success('Courier connection updated');
      } else {
        await apiService.post('/courier-connections', values);
        message.success('Courier connection created');
      }
      setIsCourierModalOpen(false);
      courierForm.resetFields();
      setSelectedType(null);
      fetchConnections();
    } catch (error: any) {
      message.error(error.message || 'Failed to save courier connection');
    } finally {
      setLoading(false);
    }
  };

  // Get marketplace info
  const getMarketplaceInfo = (type: string) => MARKETPLACE_TYPES.find(m => m.id === type);
  const getCourierInfo = (type: string) => COURIER_TYPES.find(c => c.id === type);

  // Marketplace columns
  const marketplaceColumns = [
    {
      title: 'Marketplace',
      key: 'marketplace',
      width: 200,
      render: (_: any, record: MarketplaceConnection) => {
        const info = getMarketplaceInfo(record.marketplace);
        return (
          <Space>
            <span style={{ fontSize: '24px' }}>{info?.logo || '📦'}</span>
            <div>
              <Text strong>{info?.name || record.marketplace}</Text>
              <br />
              <Text type="secondary" style={{ fontSize: '11px' }}>{record.accountName}</Text>
            </div>
          </Space>
        );
      }
    },
    {
      title: 'Status',
      key: 'status',
      width: 100,
      render: (_: any, record: MarketplaceConnection) => (
        <Tag color={record.isActive ? 'green' : 'red'} icon={record.isActive ? <CheckCircleOutlined /> : <WarningOutlined />}>
          {record.isActive ? 'Active' : 'Inactive'}
        </Tag>
      )
    },
    {
      title: 'Sync Settings',
      key: 'sync',
      width: 150,
      render: (_: any, record: MarketplaceConnection) => (
        <Space direction="vertical" size={0}>
          <Text style={{ fontSize: '11px' }}>Orders: {record.autoSyncOrders ? 'Auto' : 'Manual'}</Text>
          <Text style={{ fontSize: '11px' }}>Stock: {record.autoSyncStock ? 'Auto' : 'Manual'}</Text>
          <Text type="secondary" style={{ fontSize: '10px' }}>Every {record.syncFrequency} min</Text>
        </Space>
      )
    },
    {
      title: 'Last Sync',
      key: 'lastSync',
      width: 130,
      render: (_: any, record: MarketplaceConnection) => (
        <Space direction="vertical" size={0}>
          <Text style={{ fontSize: '11px' }}>{record.lastSyncAt ? new Date(record.lastSyncAt).toLocaleString() : 'Never'}</Text>
          {record.lastSyncError && (
            <Tooltip title={record.lastSyncError}>
              <Tag color="red" style={{ fontSize: '10px' }}>Error</Tag>
            </Tooltip>
          )}
        </Space>
      )
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 300,
      render: (_: any, record: MarketplaceConnection) => (
        <Space size="small" wrap>
          <Tooltip title="Test Connection">
            <Button size="small" type="primary" ghost icon={<ApiOutlined />} onClick={() => handleTestConnection(record.id, 'marketplace')}>
              Test
            </Button>
          </Tooltip>
          <Tooltip title="Sync Orders">
            <Button size="small" icon={<SyncOutlined />} onClick={() => handleSyncMarketplace(record.id, 'orders')}>
              Orders
            </Button>
          </Tooltip>
          <Tooltip title="Sync Stock">
            <Button size="small" icon={<CloudOutlined />} onClick={() => handleSyncMarketplace(record.id, 'stock')}>
              Stock
            </Button>
          </Tooltip>
          <Button size="small" icon={<EditOutlined />} onClick={() => handleEditMarketplace(record)} />
          <Popconfirm
            title="Delete this connection?"
            onConfirm={() => handleDeleteMarketplace(record.id, record.accountName)}
          >
            <Button size="small" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      )
    }
  ];

  // Courier columns
  const courierColumns = [
    {
      title: 'Courier',
      key: 'courier',
      width: 200,
      render: (_: any, record: CourierConnection) => {
        const info = getCourierInfo(record.courier);
        return (
          <Space>
            <span style={{ fontSize: '24px' }}>{info?.logo || '🚚'}</span>
            <div>
              <Text strong>{info?.name || record.courier}</Text>
              <br />
              <Text type="secondary" style={{ fontSize: '11px' }}>{record.accountName}</Text>
            </div>
          </Space>
        );
      }
    },
    {
      title: 'Status',
      key: 'status',
      width: 100,
      render: (_: any, record: CourierConnection) => (
        <Space direction="vertical" size={0}>
          <Tag color={record.isActive ? 'green' : 'red'}>
            {record.isActive ? 'Active' : 'Inactive'}
          </Tag>
          {record.isDefault && <Tag color="blue">Default</Tag>}
        </Space>
      )
    },
    {
      title: 'Mode',
      key: 'mode',
      width: 100,
      render: (_: any, record: CourierConnection) => (
        <Tag color={record.testMode ? 'orange' : 'green'}>
          {record.testMode ? 'Test' : 'Live'}
        </Tag>
      )
    },
    {
      title: 'Connected',
      key: 'connected',
      width: 120,
      render: (_: any, record: CourierConnection) => (
        <Text style={{ fontSize: '11px' }}>{new Date(record.createdAt).toLocaleDateString()}</Text>
      )
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 200,
      render: (_: any, record: CourierConnection) => (
        <Space size="small">
          <Tooltip title="Test Connection">
            <Button size="small" type="primary" ghost icon={<ApiOutlined />} onClick={() => handleTestConnection(record.id, 'courier')}>
              Test
            </Button>
          </Tooltip>
          <Button size="small" icon={<EditOutlined />} onClick={() => handleEditCourier(record)} />
          <Popconfirm
            title="Delete this connection?"
            onConfirm={() => handleDeleteCourier(record.id, record.accountName)}
          >
            <Button size="small" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      )
    }
  ];

  // Render form fields based on type
  const renderMarketplaceFields = () => {
    if (!selectedType) return null;
    const fields = MARKETPLACE_FIELDS[selectedType] || MARKETPLACE_FIELDS.OTHER;

    return fields.map(field => (
      <Form.Item
        key={field.name}
        name={field.name}
        label={field.label}
        tooltip={field.tooltip}
        rules={field.required ? [{ required: true, message: `${field.label} is required` }] : []}
      >
        {field.type === 'password' ? (
          <Input.Password placeholder={field.placeholder} />
        ) : field.type === 'select' ? (
          field.name === 'region' ? (
            <Select placeholder={field.placeholder}>
              {AWS_REGIONS.map(r => (
                <Option key={r.value} value={r.value}>{r.label}</Option>
              ))}
            </Select>
          ) : field.name === 'ebayEnvironment' ? (
            <Select placeholder={field.placeholder}>
              <Option value="sandbox">Sandbox (Testing)</Option>
              <Option value="production">Production (Live)</Option>
            </Select>
          ) : (
            <Input placeholder={field.placeholder} />
          )
        ) : (
          <Input placeholder={field.placeholder} />
        )}
      </Form.Item>
    ));
  };

  const renderCourierFields = () => {
    if (!selectedType) return null;
    const fields = COURIER_FIELDS[selectedType] || COURIER_FIELDS.OTHER;

    return fields.map(field => (
      <Form.Item
        key={field.name}
        name={field.name}
        label={field.label}
        tooltip={field.tooltip}
        rules={field.required ? [{ required: true, message: `${field.label} is required` }] : []}
      >
        {field.type === 'password' ? (
          <Input.Password placeholder={field.placeholder} />
        ) : (
          <Input placeholder={field.placeholder} />
        )}
      </Form.Item>
    ));
  };

  // Handle testing connection
  const handleTestConnection = async (id: string, type: 'marketplace' | 'courier') => {
    try {
      setLoading(true);
      const endpoint = type === 'marketplace' ? `/marketplace-connections/${id}/test` : `/courier-connections/${id}/test`;
      const result = await apiService.post(endpoint);
      if (result.success) {
        message.success(result.message || 'Connection test successful');
      } else {
        message.warning(result.message || 'Connection test completed with issues');
      }
    } catch (error: any) {
      message.error(error.message || 'Connection test failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '24px' }}>
      <Title level={2}>
        <ApiOutlined /> Marketplace & Courier API Settings
      </Title>
      <Paragraph type="secondary">
        Manage your marketplace integrations (Amazon, Shopify, eBay) and courier connections (Royal Mail, Parcelforce).
        All API credentials are securely encrypted.
      </Paragraph>

      <Alert
        message="Security Notice"
        description="API credentials are encrypted at rest. Never share your API keys or secrets. Use test/sandbox credentials for development."
        type="info"
        showIcon
        icon={<SafetyCertificateOutlined />}
        style={{ marginBottom: 24 }}
      />

      <Spin spinning={loading}>
        <Tabs defaultActiveKey="marketplaces">
          <TabPane
            tab={
              <span>
                <ShopOutlined /> Marketplaces ({marketplaceConnections.length})
              </span>
            }
            key="marketplaces"
          >
            <Card
              title="Marketplace Connections"
              extra={
                <Space>
                  <Button icon={<ReloadOutlined />} onClick={fetchConnections}>Refresh</Button>
                  <Button type="primary" icon={<PlusOutlined />} onClick={handleAddMarketplace}>
                    Add Marketplace
                  </Button>
                </Space>
              }
            >
              {marketplaceConnections.length === 0 ? (
                <Alert
                  message="No Marketplaces Connected"
                  description="Connect your first marketplace (Amazon, Shopify, eBay) to start syncing orders and inventory."
                  type="info"
                  showIcon
                  action={
                    <Button type="primary" onClick={handleAddMarketplace}>
                      Add Marketplace
                    </Button>
                  }
                />
              ) : (
                <Table
                  dataSource={marketplaceConnections}
                  columns={marketplaceColumns}
                  rowKey="id"
                  pagination={false}
                />
              )}

              {/* Quick Add Cards */}
              <Divider>Quick Connect</Divider>
              <Row gutter={[16, 16]}>
                {MARKETPLACE_TYPES.filter(m => m.id !== 'OTHER').map(marketplace => {
                  const isConnected = marketplaceConnections.some(c => c.marketplace === marketplace.id);
                  return (
                    <Col xs={24} sm={12} md={8} lg={6} key={marketplace.id}>
                      <Card
                        size="small"
                        hoverable={!isConnected}
                        style={{
                          borderColor: isConnected ? '#52c41a' : marketplace.color,
                          opacity: isConnected ? 0.7 : 1
                        }}
                      >
                        <Space direction="vertical" style={{ width: '100%' }}>
                          <Space>
                            <span style={{ fontSize: '28px' }}>{marketplace.logo}</span>
                            <div>
                              <Text strong>{marketplace.name}</Text>
                              <br />
                              <Text type="secondary" style={{ fontSize: '11px' }}>{marketplace.description}</Text>
                            </div>
                          </Space>
                          {isConnected ? (
                            <Tag color="green" icon={<CheckCircleOutlined />}>Connected</Tag>
                          ) : (
                            <Button
                              type="primary"
                              size="small"
                              icon={<PlusOutlined />}
                              onClick={() => {
                                setSelectedType(marketplace.id);
                                marketplaceForm.setFieldsValue({ marketplace: marketplace.id });
                                setIsMarketplaceModalOpen(true);
                              }}
                              block
                              style={{ background: marketplace.color, borderColor: marketplace.color }}
                            >
                              Connect
                            </Button>
                          )}
                        </Space>
                      </Card>
                    </Col>
                  );
                })}
              </Row>
            </Card>
          </TabPane>

          <TabPane
            tab={
              <span>
                <LinkOutlined /> Couriers ({courierConnections.length})
              </span>
            }
            key="couriers"
          >
            <Card
              title="Courier Connections"
              extra={
                <Space>
                  <Button icon={<ReloadOutlined />} onClick={fetchConnections}>Refresh</Button>
                  <Button type="primary" icon={<PlusOutlined />} onClick={handleAddCourier}>
                    Add Courier
                  </Button>
                </Space>
              }
            >
              {courierConnections.length === 0 ? (
                <Alert
                  message="No Couriers Connected"
                  description="Connect Royal Mail, Parcelforce, or other couriers to generate shipping labels and track shipments."
                  type="info"
                  showIcon
                  action={
                    <Button type="primary" onClick={handleAddCourier}>
                      Add Courier
                    </Button>
                  }
                />
              ) : (
                <Table
                  dataSource={courierConnections}
                  columns={courierColumns}
                  rowKey="id"
                  pagination={false}
                />
              )}

              {/* Quick Add Cards */}
              <Divider>UK Couriers - Quick Connect</Divider>
              <Row gutter={[16, 16]}>
                {COURIER_TYPES.filter(c => ['ROYAL_MAIL', 'PARCELFORCE', 'DPD_UK', 'EVRI', 'YODEL'].includes(c.id)).map(courier => {
                  const isConnected = courierConnections.some(c => c.courier === courier.id);
                  return (
                    <Col xs={24} sm={12} md={8} lg={6} key={courier.id}>
                      <Card
                        size="small"
                        hoverable={!isConnected}
                        style={{
                          borderColor: isConnected ? '#52c41a' : courier.color,
                          opacity: isConnected ? 0.7 : 1
                        }}
                      >
                        <Space direction="vertical" style={{ width: '100%' }}>
                          <Space>
                            <span style={{ fontSize: '28px' }}>{courier.logo}</span>
                            <div>
                              <Text strong>{courier.name}</Text>
                              <br />
                              <Text type="secondary" style={{ fontSize: '11px' }}>{courier.description}</Text>
                            </div>
                          </Space>
                          {isConnected ? (
                            <Tag color="green" icon={<CheckCircleOutlined />}>Connected</Tag>
                          ) : (
                            <Button
                              type="primary"
                              size="small"
                              icon={<PlusOutlined />}
                              onClick={() => {
                                setSelectedType(courier.id);
                                courierForm.setFieldsValue({ courier: courier.id });
                                setIsCourierModalOpen(true);
                              }}
                              block
                              style={{ background: courier.color, borderColor: courier.color }}
                            >
                              Connect
                            </Button>
                          )}
                        </Space>
                      </Card>
                    </Col>
                  );
                })}
              </Row>
            </Card>
          </TabPane>
        </Tabs>
      </Spin>

      {/* Marketplace Modal */}
      <Modal
        title={
          isEditMode
            ? `Edit ${getMarketplaceInfo(selectedType || '')?.name || 'Marketplace'} Connection`
            : selectedType
              ? `Connect ${getMarketplaceInfo(selectedType)?.name || 'Marketplace'}`
              : 'Add Marketplace Connection'
        }
        open={isMarketplaceModalOpen}
        onCancel={() => {
          setIsMarketplaceModalOpen(false);
          setSelectedType(null);
          marketplaceForm.resetFields();
        }}
        footer={null}
        width={700}
      >
        <Form
          form={marketplaceForm}
          layout="vertical"
          onFinish={handleMarketplaceSubmit}
        >
          {!selectedType && !isEditMode && (
            <>
              <Alert
                message="Select a Marketplace"
                description="Choose which marketplace you want to connect."
                type="info"
                showIcon
                style={{ marginBottom: 16 }}
              />
              <Row gutter={[12, 12]}>
                {MARKETPLACE_TYPES.map(m => (
                  <Col span={8} key={m.id}>
                    <Card
                      size="small"
                      hoverable
                      onClick={() => {
                        setSelectedType(m.id);
                        marketplaceForm.setFieldsValue({ marketplace: m.id });
                      }}
                      style={{ cursor: 'pointer', borderColor: m.color }}
                    >
                      <Space>
                        <span style={{ fontSize: '24px' }}>{m.logo}</span>
                        <div>
                          <Text strong>{m.name}</Text>
                          <br />
                          <Text type="secondary" style={{ fontSize: '10px' }}>{m.description}</Text>
                        </div>
                      </Space>
                    </Card>
                  </Col>
                ))}
              </Row>
            </>
          )}

          {selectedType && (
            <>
              <Form.Item name="marketplace" hidden>
                <Input />
              </Form.Item>

              <Form.Item
                name="accountName"
                label="Account Name"
                rules={[{ required: true, message: 'Please enter a name for this connection' }]}
                tooltip="A friendly name to identify this connection (e.g., 'FFD Main Account', 'Wholesale Store')"
              >
                <Input placeholder="e.g., Free From Direct - Main" />
              </Form.Item>

              <Divider>API Credentials</Divider>

              {renderMarketplaceFields()}

              <Divider>Sync Settings</Divider>

              <Row gutter={16}>
                <Col span={8}>
                  <Form.Item name="autoSyncOrders" label="Auto Sync Orders" valuePropName="checked" initialValue={true}>
                    <Switch />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item name="autoSyncStock" label="Auto Sync Stock" valuePropName="checked" initialValue={true}>
                    <Switch />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item name="syncFrequency" label="Sync Interval" initialValue={30}>
                    <Select>
                      <Option value={15}>Every 15 minutes</Option>
                      <Option value={30}>Every 30 minutes</Option>
                      <Option value={60}>Every hour</Option>
                      <Option value={120}>Every 2 hours</Option>
                    </Select>
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item name="isActive" label="Active" valuePropName="checked" initialValue={true}>
                <Switch />
              </Form.Item>

              <Form.Item>
                <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
                  <Button onClick={() => {
                    setSelectedType(null);
                    if (!isEditMode) marketplaceForm.resetFields();
                  }}>
                    {isEditMode ? 'Cancel' : 'Back'}
                  </Button>
                  <Button type="primary" htmlType="submit" loading={loading}>
                    {isEditMode ? 'Update' : 'Connect'} {getMarketplaceInfo(selectedType)?.name}
                  </Button>
                </Space>
              </Form.Item>
            </>
          )}
        </Form>
      </Modal>

      {/* Courier Modal */}
      <Modal
        title={
          isEditMode
            ? `Edit ${getCourierInfo(selectedType || '')?.name || 'Courier'} Connection`
            : selectedType
              ? `Connect ${getCourierInfo(selectedType)?.name || 'Courier'}`
              : 'Add Courier Connection'
        }
        open={isCourierModalOpen}
        onCancel={() => {
          setIsCourierModalOpen(false);
          setSelectedType(null);
          courierForm.resetFields();
        }}
        footer={null}
        width={700}
      >
        <Form
          form={courierForm}
          layout="vertical"
          onFinish={handleCourierSubmit}
        >
          {!selectedType && !isEditMode && (
            <>
              <Alert
                message="Select a Courier"
                description="Choose which courier service you want to connect."
                type="info"
                showIcon
                style={{ marginBottom: 16 }}
              />
              <Row gutter={[12, 12]}>
                {COURIER_TYPES.map(c => (
                  <Col span={8} key={c.id}>
                    <Card
                      size="small"
                      hoverable
                      onClick={() => {
                        setSelectedType(c.id);
                        courierForm.setFieldsValue({ courier: c.id });
                      }}
                      style={{ cursor: 'pointer', borderColor: c.color }}
                    >
                      <Space>
                        <span style={{ fontSize: '24px' }}>{c.logo}</span>
                        <div>
                          <Text strong>{c.name}</Text>
                          <br />
                          <Text type="secondary" style={{ fontSize: '10px' }}>{c.description}</Text>
                        </div>
                      </Space>
                    </Card>
                  </Col>
                ))}
              </Row>
            </>
          )}

          {selectedType && (
            <>
              <Form.Item name="courier" hidden>
                <Input />
              </Form.Item>

              <Form.Item
                name="accountName"
                label="Account Name"
                rules={[{ required: true, message: 'Please enter a name for this connection' }]}
                tooltip="A friendly name to identify this connection"
              >
                <Input placeholder="e.g., Royal Mail Main Account" />
              </Form.Item>

              <Divider>API Credentials</Divider>

              {renderCourierFields()}

              <Divider>Settings</Divider>

              <Row gutter={16}>
                <Col span={8}>
                  <Form.Item name="isDefault" label="Default Courier" valuePropName="checked" initialValue={false}>
                    <Switch />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item name="testMode" label="Test Mode" valuePropName="checked" initialValue={false}>
                    <Switch />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item name="isActive" label="Active" valuePropName="checked" initialValue={true}>
                    <Switch />
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item>
                <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
                  <Button onClick={() => {
                    setSelectedType(null);
                    if (!isEditMode) courierForm.resetFields();
                  }}>
                    {isEditMode ? 'Cancel' : 'Back'}
                  </Button>
                  <Button type="primary" htmlType="submit" loading={loading}>
                    {isEditMode ? 'Update' : 'Connect'} {getCourierInfo(selectedType)?.name}
                  </Button>
                </Space>
              </Form.Item>
            </>
          )}
        </Form>
      </Modal>
    </div>
  );
}
