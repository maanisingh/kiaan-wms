'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Table, Button, Input, Select, Tag, Card, Modal, Form, Tabs, Spin, Alert, App, Switch, Radio, Divider, InputNumber, Space, Typography, Row, Col, Badge, Tooltip, List } from 'antd';
import { PlusOutlined, SearchOutlined, SaveOutlined, EyeOutlined, SettingOutlined, AppstoreOutlined, DatabaseOutlined, BellOutlined, DeleteOutlined, EditOutlined, ReloadOutlined, ScanOutlined, CameraOutlined, MobileOutlined, CheckCircleOutlined, WifiOutlined, UsbOutlined, ApiOutlined, SyncOutlined, InfoCircleOutlined, ThunderboltOutlined, DesktopOutlined, TabletOutlined, AudioOutlined } from '@ant-design/icons';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import apiService from '@/services/api';
import { formatDate } from '@/lib/utils';

const { Search } = Input;
const { Option } = Select;
const { Title, Text, Paragraph } = Typography;

interface Setting {
  id: string;
  key: string;
  category: string;
  setting?: string;
  name?: string;
  value: string;
  type: string;
  description?: string;
  lastModified?: string;
  updatedAt?: string;
  createdAt?: string;
}

// Scanner configuration types
interface ScannerConfig {
  activeScannerType: 'camera' | 'handheld' | 'keyboard';
  camera: {
    enabled: boolean;
    preferredCamera: 'back' | 'front' | 'auto';
    resolution: 'low' | 'medium' | 'high';
    autofocus: boolean;
    beepOnScan: boolean;
    vibrate: boolean;
    flashMode: 'off' | 'on' | 'auto';
    scanFormats: string[];
  };
  handheld: {
    enabled: boolean;
    deviceType: string;
    connectionType: 'usb' | 'bluetooth' | 'wedge';
    prefix: string;
    suffix: string;
    scanTimeout: number;
    continuousMode: boolean;
    triggerMode: 'hardware' | 'software' | 'both';
    beepOnScan: boolean;
  };
  keyboard: {
    enabled: boolean;
    enterToSubmit: boolean;
    minLength: number;
    maxLength: number;
    autoFocus: boolean;
  };
}

const defaultScannerConfig: ScannerConfig = {
  activeScannerType: 'camera',
  camera: {
    enabled: true,
    preferredCamera: 'back',
    resolution: 'high',
    autofocus: true,
    beepOnScan: true,
    vibrate: true,
    flashMode: 'auto',
    scanFormats: ['qr', 'code128', 'code39', 'ean13', 'ean8', 'upca', 'upce'],
  },
  handheld: {
    enabled: false,
    deviceType: 'zebra_tc21',
    connectionType: 'wedge',
    prefix: '',
    suffix: '\n',
    scanTimeout: 5000,
    continuousMode: false,
    triggerMode: 'hardware',
    beepOnScan: true,
  },
  keyboard: {
    enabled: true,
    enterToSubmit: true,
    minLength: 3,
    maxLength: 50,
    autoFocus: true,
  },
};

// Supported handheld devices
const handheldDevices = [
  { value: 'zebra_tc21', label: 'Zebra TC21', brand: 'Zebra', description: 'Compact touch computer for retail/warehouse' },
  { value: 'zebra_tc26', label: 'Zebra TC26', brand: 'Zebra', description: 'Touch computer with extended range' },
  { value: 'zebra_tc52', label: 'Zebra TC52', brand: 'Zebra', description: 'Premium touch computer' },
  { value: 'zebra_tc57', label: 'Zebra TC57', brand: 'Zebra', description: 'Rugged touch computer with WWAN' },
  { value: 'zebra_mc3300', label: 'Zebra MC3300', brand: 'Zebra', description: 'Mobile computer with pistol grip' },
  { value: 'zebra_mc9300', label: 'Zebra MC9300', brand: 'Zebra', description: 'Ultra-rugged mobile computer' },
  { value: 'honeywell_ct40', label: 'Honeywell CT40', brand: 'Honeywell', description: 'Enterprise mobile computer' },
  { value: 'honeywell_ct60', label: 'Honeywell CT60', brand: 'Honeywell', description: 'Rugged mobile computer' },
  { value: 'honeywell_ck65', label: 'Honeywell CK65', brand: 'Honeywell', description: 'Cold storage mobile computer' },
  { value: 'datalogic_memor', label: 'Datalogic Memor 10/11', brand: 'Datalogic', description: 'Android mobile computer' },
  { value: 'datalogic_skorpio', label: 'Datalogic Skorpio X5', brand: 'Datalogic', description: 'Rugged mobile computer' },
  { value: 'generic_usb', label: 'Generic USB Scanner', brand: 'Generic', description: 'Any USB barcode scanner' },
  { value: 'generic_bluetooth', label: 'Generic Bluetooth Scanner', brand: 'Generic', description: 'Any Bluetooth barcode scanner' },
];

const barcodeFormats = [
  { value: 'qr', label: 'QR Code' },
  { value: 'code128', label: 'Code 128' },
  { value: 'code39', label: 'Code 39' },
  { value: 'ean13', label: 'EAN-13' },
  { value: 'ean8', label: 'EAN-8' },
  { value: 'upca', label: 'UPC-A' },
  { value: 'upce', label: 'UPC-E' },
  { value: 'itf', label: 'ITF (Interleaved 2 of 5)' },
  { value: 'datamatrix', label: 'Data Matrix' },
  { value: 'pdf417', label: 'PDF417' },
  { value: 'aztec', label: 'Aztec' },
];

// Carrier configuration types
interface CarrierConfig {
  id: string;
  name: string;
  carrier_code: string;
  enabled: boolean;
  is_test_mode: boolean;
  credentials: Record<string, string>;
  settings: {
    default_service?: string;
    label_format?: string;
    label_size?: string;
    signature_required?: boolean;
    insurance_enabled?: boolean;
    saturday_delivery?: boolean;
  };
}

// Marketplace integration types
interface MarketplaceConfig {
  id: string;
  name: string;
  platform: string;
  enabled: boolean;
  credentials: Record<string, string>;
  settings: {
    sync_orders: boolean;
    sync_inventory: boolean;
    sync_products: boolean;
    auto_fulfill: boolean;
    order_prefix?: string;
    import_interval_minutes: number;
    warehouses?: string[];
  };
  last_sync?: string;
  status: 'connected' | 'disconnected' | 'error';
}

// Available carriers (UK-focused)
const availableCarriers = [
  { code: 'royal_mail', name: 'Royal Mail', logo: '📮', country: 'UK', services: ['First Class', 'Second Class', 'Special Delivery', 'Tracked 24', 'Tracked 48'] },
  { code: 'parcelforce', name: 'Parcelforce Worldwide', logo: '📦', country: 'UK', services: ['Express 9', 'Express 10', 'Express AM', 'Express 24', 'Express 48'] },
  { code: 'dhl_uk', name: 'DHL Express UK', logo: '🟡', country: 'UK', services: ['Express Worldwide', 'Express 12:00', 'Express Easy', 'Economy Select'] },
  { code: 'dpd_uk', name: 'DPD UK', logo: '🔴', country: 'UK', services: ['Next Day', 'Saturday', 'Two Day', 'DPD Pickup'] },
  { code: 'evri', name: 'Evri (formerly Hermes)', logo: '💜', country: 'UK', services: ['Standard', 'Next Day', 'ParcelShop'] },
  { code: 'ups_uk', name: 'UPS UK', logo: '🟤', country: 'UK', services: ['Express Saver', 'Express', 'Express Plus', 'Standard'] },
  { code: 'fedex_uk', name: 'FedEx UK', logo: '🟣', country: 'UK', services: ['Priority Overnight', 'Standard Overnight', 'International Priority'] },
  { code: 'yodel', name: 'Yodel', logo: '🟢', country: 'UK', services: ['Xpect 24', 'Xpect 48', 'Direct'] },
  { code: 'amazon_shipping', name: 'Amazon Shipping', logo: '📦', country: 'UK', services: ['Standard', 'Express', 'Same Day'] },
  { code: 'uk_mail', name: 'UK Mail (DHL Parcel)', logo: '📫', country: 'UK', services: ['Parcel24', 'Parcel48', 'Next Day Plus'] },
];

// Available marketplace integrations
const availableMarketplaces = [
  { platform: 'amazon', name: 'Amazon (Seller Central)', logo: '🅰️', description: 'Sync orders from Amazon UK/EU marketplaces', apiType: 'SP-API' },
  { platform: 'ebay', name: 'eBay', logo: '🛒', description: 'Connect to eBay UK and international stores', apiType: 'REST' },
  { platform: 'shopify', name: 'Shopify', logo: '🛍️', description: 'Integrate with your Shopify store', apiType: 'REST' },
  { platform: 'woocommerce', name: 'WooCommerce', logo: '🔧', description: 'Connect WordPress/WooCommerce stores', apiType: 'REST' },
  { platform: 'etsy', name: 'Etsy', logo: '🧡', description: 'Sync orders from Etsy marketplace', apiType: 'REST' },
  { platform: 'magento', name: 'Magento / Adobe Commerce', logo: '🟧', description: 'Enterprise e-commerce integration', apiType: 'REST' },
  { platform: 'bigcommerce', name: 'BigCommerce', logo: '🔷', description: 'BigCommerce store integration', apiType: 'REST' },
  { platform: 'onbuy', name: 'OnBuy', logo: '🔵', description: 'UK marketplace integration', apiType: 'REST' },
  { platform: 'fruugo', name: 'Fruugo', logo: '🌍', description: 'Global marketplace for UK sellers', apiType: 'REST' },
  { platform: 'wish', name: 'Wish', logo: '💫', description: 'Wish marketplace integration', apiType: 'REST' },
  { platform: 'tiktok_shop', name: 'TikTok Shop', logo: '📱', description: 'TikTok social commerce', apiType: 'REST' },
  { platform: 'custom_api', name: 'Custom API', logo: '⚙️', description: 'Connect your own API/ERP system', apiType: 'Custom' },
];

const defaultCarrierConfig: CarrierConfig = {
  id: '',
  name: '',
  carrier_code: '',
  enabled: false,
  is_test_mode: true,
  credentials: {},
  settings: {
    label_format: 'PDF',
    label_size: '4x6',
    signature_required: false,
    insurance_enabled: false,
    saturday_delivery: false,
  }
};

const defaultMarketplaceConfig: MarketplaceConfig = {
  id: '',
  name: '',
  platform: '',
  enabled: false,
  credentials: {},
  settings: {
    sync_orders: true,
    sync_inventory: true,
    sync_products: false,
    auto_fulfill: false,
    import_interval_minutes: 15,
  },
  status: 'disconnected'
};

export default function SystemSettingsPage() {
  const { modal, message } = App.useApp();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState<Setting[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('all');
  const [searchText, setSearchText] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedSetting, setSelectedSetting] = useState<Setting | null>(null);
  const [saving, setSaving] = useState(false);
  const [form] = Form.useForm();

  // Scanner configuration state
  const [scannerConfig, setScannerConfig] = useState<ScannerConfig>(defaultScannerConfig);
  const [scannerSaving, setScannerSaving] = useState(false);
  const [testingScan, setTestingScan] = useState(false);
  const [lastScannedBarcode, setLastScannedBarcode] = useState<string | null>(null);
  const [scannerForm] = Form.useForm();

  // Carrier configuration state
  const [carriers, setCarriers] = useState<CarrierConfig[]>([]);
  const [carrierModalOpen, setCarrierModalOpen] = useState(false);
  const [selectedCarrier, setSelectedCarrier] = useState<CarrierConfig | null>(null);
  const [carrierForm] = Form.useForm();
  const [carrierSaving, setCarrierSaving] = useState(false);

  // Marketplace configuration state
  const [marketplaces, setMarketplaces] = useState<MarketplaceConfig[]>([]);
  const [marketplaceModalOpen, setMarketplaceModalOpen] = useState(false);
  const [selectedMarketplace, setSelectedMarketplace] = useState<MarketplaceConfig | null>(null);
  const [marketplaceForm] = Form.useForm();
  const [marketplaceSaving, setMarketplaceSaving] = useState(false);

  // Fetch settings from API
  const fetchSettings = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await apiService.get('/settings');
      setSettings(Array.isArray(data) ? data : []);
    } catch (err: any) {
      console.error('Failed to fetch settings:', err);
      setError(err.message || 'Failed to load settings');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  // Filter settings based on search and tab
  const getFilteredSettings = () => {
    let filtered = settings;

    // Filter by tab/category
    if (activeTab === 'general') {
      filtered = filtered.filter(s => s.category?.toLowerCase() === 'general');
    } else if (activeTab === 'operations') {
      filtered = filtered.filter(s => s.category?.toLowerCase() === 'operations');
    } else if (activeTab === 'inventory') {
      filtered = filtered.filter(s => s.category?.toLowerCase() === 'inventory');
    } else if (activeTab === 'notifications') {
      filtered = filtered.filter(s => s.category?.toLowerCase() === 'notifications');
    }

    // Filter by search
    if (searchText) {
      const search = searchText.toLowerCase();
      filtered = filtered.filter(s =>
        s.key?.toLowerCase().includes(search) ||
        s.setting?.toLowerCase().includes(search) ||
        s.name?.toLowerCase().includes(search) ||
        s.category?.toLowerCase().includes(search) ||
        s.value?.toLowerCase().includes(search)
      );
    }

    return filtered;
  };

  const handleSubmit = async (values: any) => {
    try {
      setSaving(true);

      if (editMode && selectedSetting) {
        // Update setting
        await apiService.put(`/settings/${selectedSetting.id}`, {
          key: values.key,
          category: values.category,
          value: values.value,
          type: values.type,
          description: values.description
        });
        message.success('Setting updated successfully!');
      } else {
        // Create setting
        await apiService.post('/settings', {
          key: values.key,
          category: values.category,
          value: values.value,
          type: values.type,
          description: values.description
        });
        message.success('Setting created successfully!');
      }

      form.resetFields();
      setModalOpen(false);
      setEditMode(false);
      setSelectedSetting(null);
      fetchSettings();
    } catch (err: any) {
      console.error('Failed to save setting:', err);
      message.error(err.message || 'Failed to save setting');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (record: Setting) => {
    setSelectedSetting(record);
    form.setFieldsValue({
      key: record.key || record.setting || record.name,
      category: record.category,
      value: record.value,
      type: record.type,
      description: record.description
    });
    setEditMode(true);
    setModalOpen(true);
  };

  const handleDelete = (record: Setting) => {
    modal.confirm({
      title: 'Delete Setting',
      content: `Are you sure you want to delete "${record.key || record.setting || record.name}"? This action cannot be undone.`,
      okText: 'Delete',
      okType: 'danger',
      onOk: async () => {
        try {
          await apiService.delete(`/settings/${record.id}`);
          message.success('Setting deleted successfully!');
          fetchSettings();
        } catch (err: any) {
          message.error(err.message || 'Failed to delete setting');
        }
      }
    });
  };

  const columns = [
    {
      title: 'Category',
      dataIndex: 'category',
      key: 'category',
      width: 130,
      render: (cat: string) => <Tag color="blue">{cat || '-'}</Tag>
    },
    {
      title: 'Setting',
      key: 'setting',
      width: 250,
      render: (_: any, record: Setting) => (
        <Link href={`/protected/settings/${record.id}`}>
          <span className="font-medium text-blue-600 cursor-pointer hover:underline">
            {record.key || record.setting || record.name}
          </span>
        </Link>
      )
    },
    {
      title: 'Value',
      dataIndex: 'value',
      key: 'value',
      width: 200,
      render: (value: string, record: Setting) => {
        if (record.type?.toLowerCase() === 'boolean') {
          return <Tag color={value === 'true' || value === 'Enabled' ? 'green' : 'red'}>{value}</Tag>;
        }
        return value || '-';
      }
    },
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      width: 100,
      render: (type: string) => type || 'Text'
    },
    {
      title: 'Last Modified',
      key: 'lastModified',
      width: 150,
      render: (_: any, record: Setting) => formatDate(record.lastModified || record.updatedAt || '') || '-'
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 180,
      render: (_: any, record: Setting) => (
        <div className="flex gap-1">
          <Link href={`/protected/settings/${record.id}`}>
            <Button type="link" icon={<EyeOutlined />} size="small">View</Button>
          </Link>
          <Button type="link" icon={<EditOutlined />} size="small" onClick={() => handleEdit(record)}>
            Edit
          </Button>
          <Button type="link" danger icon={<DeleteOutlined />} size="small" onClick={() => handleDelete(record)}>
            Delete
          </Button>
        </div>
      ),
    },
  ];

  const allSettings = getFilteredSettings();
  const generalSettings = settings.filter(s => s.category?.toLowerCase() === 'general');
  const operationsSettings = settings.filter(s => s.category?.toLowerCase() === 'operations');
  const inventorySettings = settings.filter(s => s.category?.toLowerCase() === 'inventory');
  const notificationSettings = settings.filter(s => s.category?.toLowerCase() === 'notifications');

  // Load scanner config from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('scanner_config');
    if (saved) {
      try {
        setScannerConfig(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to parse scanner config:', e);
      }
    }
  }, []);

  // Save scanner configuration
  const saveScannerConfig = async () => {
    setScannerSaving(true);
    try {
      localStorage.setItem('scanner_config', JSON.stringify(scannerConfig));
      message.success('Scanner configuration saved successfully!');
    } catch (err) {
      message.error('Failed to save scanner configuration');
    } finally {
      setScannerSaving(false);
    }
  };

  // Test scanner functionality
  const testScanner = () => {
    setTestingScan(true);
    setLastScannedBarcode(null);
    message.info('Scanner test started. Scan a barcode now...');

    // Simulate listening for scan
    const handleKeydown = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && testingScan) {
        // In real implementation, capture the scanned value from input buffer
        message.success('Scanner is working! Barcode captured.');
        setTestingScan(false);
      }
    };

    window.addEventListener('keydown', handleKeydown);

    // Timeout after 10 seconds
    setTimeout(() => {
      setTestingScan(false);
      window.removeEventListener('keydown', handleKeydown);
    }, 10000);
  };

  // Scanner configuration UI
  const renderScannerSettings = () => (
    <div className="space-y-6">
      {/* Active Scanner Selection */}
      <Card title={<span><ThunderboltOutlined className="mr-2" />Active Scanner Mode</span>} className="shadow-sm">
        <Alert
          message="Quick Switch"
          description="Select your primary scanning method. You can switch between methods anytime."
          type="info"
          showIcon
          className="mb-4"
        />
        <Radio.Group
          value={scannerConfig.activeScannerType}
          onChange={(e) => setScannerConfig({ ...scannerConfig, activeScannerType: e.target.value })}
          className="w-full"
        >
          <Row gutter={[16, 16]}>
            <Col xs={24} md={8}>
              <Card
                hoverable
                className={`cursor-pointer ${scannerConfig.activeScannerType === 'camera' ? 'border-blue-500 border-2' : ''}`}
                onClick={() => setScannerConfig({ ...scannerConfig, activeScannerType: 'camera' })}
              >
                <div className="text-center">
                  <CameraOutlined style={{ fontSize: 48, color: scannerConfig.activeScannerType === 'camera' ? '#1890ff' : '#8c8c8c' }} />
                  <Title level={4} className="mt-3 mb-1">Camera</Title>
                  <Text type="secondary">Use device camera to scan barcodes</Text>
                  <div className="mt-2">
                    <Radio value="camera">Select</Radio>
                  </div>
                </div>
              </Card>
            </Col>
            <Col xs={24} md={8}>
              <Card
                hoverable
                className={`cursor-pointer ${scannerConfig.activeScannerType === 'handheld' ? 'border-blue-500 border-2' : ''}`}
                onClick={() => setScannerConfig({ ...scannerConfig, activeScannerType: 'handheld' })}
              >
                <div className="text-center">
                  <MobileOutlined style={{ fontSize: 48, color: scannerConfig.activeScannerType === 'handheld' ? '#1890ff' : '#8c8c8c' }} />
                  <Title level={4} className="mt-3 mb-1">Handheld Device</Title>
                  <Text type="secondary">TC21, TC52, or other scanners</Text>
                  <div className="mt-2">
                    <Radio value="handheld">Select</Radio>
                  </div>
                </div>
              </Card>
            </Col>
            <Col xs={24} md={8}>
              <Card
                hoverable
                className={`cursor-pointer ${scannerConfig.activeScannerType === 'keyboard' ? 'border-blue-500 border-2' : ''}`}
                onClick={() => setScannerConfig({ ...scannerConfig, activeScannerType: 'keyboard' })}
              >
                <div className="text-center">
                  <DesktopOutlined style={{ fontSize: 48, color: scannerConfig.activeScannerType === 'keyboard' ? '#1890ff' : '#8c8c8c' }} />
                  <Title level={4} className="mt-3 mb-1">Manual / Keyboard</Title>
                  <Text type="secondary">Type barcodes manually</Text>
                  <div className="mt-2">
                    <Radio value="keyboard">Select</Radio>
                  </div>
                </div>
              </Card>
            </Col>
          </Row>
        </Radio.Group>
      </Card>

      {/* Handheld Device Configuration */}
      <Card
        title={<span><MobileOutlined className="mr-2" />Handheld Scanner Configuration</span>}
        className="shadow-sm"
        extra={
          <Badge status={scannerConfig.handheld.enabled ? 'success' : 'default'} text={scannerConfig.handheld.enabled ? 'Enabled' : 'Disabled'} />
        }
      >
        <Row gutter={[24, 16]}>
          <Col span={24}>
            <div className="flex items-center justify-between mb-4 p-3 bg-gray-50 rounded">
              <div>
                <Text strong>Enable Handheld Scanner</Text>
                <br />
                <Text type="secondary">Use hardware barcode scanners like Zebra TC21</Text>
              </div>
              <Switch
                checked={scannerConfig.handheld.enabled}
                onChange={(checked) => setScannerConfig({
                  ...scannerConfig,
                  handheld: { ...scannerConfig.handheld, enabled: checked }
                })}
              />
            </div>
          </Col>

          <Col xs={24} md={12}>
            <Form.Item label="Device Type">
              <Select
                value={scannerConfig.handheld.deviceType}
                onChange={(value) => setScannerConfig({
                  ...scannerConfig,
                  handheld: { ...scannerConfig.handheld, deviceType: value }
                })}
                disabled={!scannerConfig.handheld.enabled}
              >
                {handheldDevices.map(device => (
                  <Option key={device.value} value={device.value}>
                    <div className="flex justify-between items-center">
                      <span>{device.label}</span>
                      <Tag color={device.brand === 'Zebra' ? 'blue' : device.brand === 'Honeywell' ? 'green' : device.brand === 'Datalogic' ? 'orange' : 'default'} className="ml-2">
                        {device.brand}
                      </Tag>
                    </div>
                  </Option>
                ))}
              </Select>
            </Form.Item>
            <Text type="secondary" className="block mt-1">
              {handheldDevices.find(d => d.value === scannerConfig.handheld.deviceType)?.description}
            </Text>
          </Col>

          <Col xs={24} md={12}>
            <Form.Item label="Connection Type">
              <Select
                value={scannerConfig.handheld.connectionType}
                onChange={(value) => setScannerConfig({
                  ...scannerConfig,
                  handheld: { ...scannerConfig.handheld, connectionType: value }
                })}
                disabled={!scannerConfig.handheld.enabled}
              >
                <Option value="wedge">
                  <UsbOutlined className="mr-2" />Keyboard Wedge (USB/HID)
                </Option>
                <Option value="bluetooth">
                  <WifiOutlined className="mr-2" />Bluetooth SPP
                </Option>
                <Option value="usb">
                  <ApiOutlined className="mr-2" />USB Serial
                </Option>
              </Select>
            </Form.Item>
          </Col>

          <Col xs={24} md={8}>
            <Form.Item label="Trigger Mode">
              <Select
                value={scannerConfig.handheld.triggerMode}
                onChange={(value) => setScannerConfig({
                  ...scannerConfig,
                  handheld: { ...scannerConfig.handheld, triggerMode: value }
                })}
                disabled={!scannerConfig.handheld.enabled}
              >
                <Option value="hardware">Hardware Trigger Only</Option>
                <Option value="software">Software Trigger Only</Option>
                <Option value="both">Both (Hardware + Software)</Option>
              </Select>
            </Form.Item>
          </Col>

          <Col xs={24} md={8}>
            <Form.Item label="Scan Timeout (ms)">
              <InputNumber
                value={scannerConfig.handheld.scanTimeout}
                onChange={(value) => setScannerConfig({
                  ...scannerConfig,
                  handheld: { ...scannerConfig.handheld, scanTimeout: value || 5000 }
                })}
                disabled={!scannerConfig.handheld.enabled}
                min={1000}
                max={30000}
                step={1000}
                style={{ width: '100%' }}
              />
            </Form.Item>
          </Col>

          <Col xs={24} md={8}>
            <Form.Item label="Options">
              <Space direction="vertical" className="w-full">
                <div className="flex justify-between items-center">
                  <Text>Continuous Scan Mode</Text>
                  <Switch
                    size="small"
                    checked={scannerConfig.handheld.continuousMode}
                    onChange={(checked) => setScannerConfig({
                      ...scannerConfig,
                      handheld: { ...scannerConfig.handheld, continuousMode: checked }
                    })}
                    disabled={!scannerConfig.handheld.enabled}
                  />
                </div>
                <div className="flex justify-between items-center">
                  <Text>Beep on Scan</Text>
                  <Switch
                    size="small"
                    checked={scannerConfig.handheld.beepOnScan}
                    onChange={(checked) => setScannerConfig({
                      ...scannerConfig,
                      handheld: { ...scannerConfig.handheld, beepOnScan: checked }
                    })}
                    disabled={!scannerConfig.handheld.enabled}
                  />
                </div>
              </Space>
            </Form.Item>
          </Col>

          <Col xs={24} md={12}>
            <Form.Item label="Barcode Prefix (optional)" tooltip="Characters added before barcode data">
              <Input
                value={scannerConfig.handheld.prefix}
                onChange={(e) => setScannerConfig({
                  ...scannerConfig,
                  handheld: { ...scannerConfig.handheld, prefix: e.target.value }
                })}
                disabled={!scannerConfig.handheld.enabled}
                placeholder="e.g., STX character"
              />
            </Form.Item>
          </Col>

          <Col xs={24} md={12}>
            <Form.Item label="Barcode Suffix" tooltip="Characters added after barcode data">
              <Select
                value={scannerConfig.handheld.suffix}
                onChange={(value) => setScannerConfig({
                  ...scannerConfig,
                  handheld: { ...scannerConfig.handheld, suffix: value }
                })}
                disabled={!scannerConfig.handheld.enabled}
              >
                <Option value="\n">Enter (Line Feed) - Recommended</Option>
                <Option value="\r">Carriage Return</Option>
                <Option value="\r\n">CR + LF</Option>
                <Option value="\t">Tab</Option>
                <Option value="">None</Option>
              </Select>
            </Form.Item>
          </Col>
        </Row>
      </Card>

      {/* Camera Scanner Configuration */}
      <Card
        title={<span><CameraOutlined className="mr-2" />Camera Scanner Configuration</span>}
        className="shadow-sm"
        extra={
          <Badge status={scannerConfig.camera.enabled ? 'success' : 'default'} text={scannerConfig.camera.enabled ? 'Enabled' : 'Disabled'} />
        }
      >
        <Row gutter={[24, 16]}>
          <Col span={24}>
            <div className="flex items-center justify-between mb-4 p-3 bg-gray-50 rounded">
              <div>
                <Text strong>Enable Camera Scanner</Text>
                <br />
                <Text type="secondary">Use device camera to scan barcodes (mobile/tablet)</Text>
              </div>
              <Switch
                checked={scannerConfig.camera.enabled}
                onChange={(checked) => setScannerConfig({
                  ...scannerConfig,
                  camera: { ...scannerConfig.camera, enabled: checked }
                })}
              />
            </div>
          </Col>

          <Col xs={24} md={8}>
            <Form.Item label="Preferred Camera">
              <Select
                value={scannerConfig.camera.preferredCamera}
                onChange={(value) => setScannerConfig({
                  ...scannerConfig,
                  camera: { ...scannerConfig.camera, preferredCamera: value }
                })}
                disabled={!scannerConfig.camera.enabled}
              >
                <Option value="back">Back Camera (Recommended)</Option>
                <Option value="front">Front Camera</Option>
                <Option value="auto">Auto-detect</Option>
              </Select>
            </Form.Item>
          </Col>

          <Col xs={24} md={8}>
            <Form.Item label="Resolution">
              <Select
                value={scannerConfig.camera.resolution}
                onChange={(value) => setScannerConfig({
                  ...scannerConfig,
                  camera: { ...scannerConfig.camera, resolution: value }
                })}
                disabled={!scannerConfig.camera.enabled}
              >
                <Option value="low">Low (faster, less accurate)</Option>
                <Option value="medium">Medium (balanced)</Option>
                <Option value="high">High (best accuracy)</Option>
              </Select>
            </Form.Item>
          </Col>

          <Col xs={24} md={8}>
            <Form.Item label="Flash Mode">
              <Select
                value={scannerConfig.camera.flashMode}
                onChange={(value) => setScannerConfig({
                  ...scannerConfig,
                  camera: { ...scannerConfig.camera, flashMode: value }
                })}
                disabled={!scannerConfig.camera.enabled}
              >
                <Option value="off">Off</Option>
                <Option value="on">Always On</Option>
                <Option value="auto">Auto (low light)</Option>
              </Select>
            </Form.Item>
          </Col>

          <Col xs={24} md={12}>
            <Form.Item label="Feedback Options">
              <Space direction="vertical" className="w-full">
                <div className="flex justify-between items-center">
                  <Text>Autofocus</Text>
                  <Switch
                    size="small"
                    checked={scannerConfig.camera.autofocus}
                    onChange={(checked) => setScannerConfig({
                      ...scannerConfig,
                      camera: { ...scannerConfig.camera, autofocus: checked }
                    })}
                    disabled={!scannerConfig.camera.enabled}
                  />
                </div>
                <div className="flex justify-between items-center">
                  <Text>Beep on Scan</Text>
                  <Switch
                    size="small"
                    checked={scannerConfig.camera.beepOnScan}
                    onChange={(checked) => setScannerConfig({
                      ...scannerConfig,
                      camera: { ...scannerConfig.camera, beepOnScan: checked }
                    })}
                    disabled={!scannerConfig.camera.enabled}
                  />
                </div>
                <div className="flex justify-between items-center">
                  <Text>Vibrate on Scan</Text>
                  <Switch
                    size="small"
                    checked={scannerConfig.camera.vibrate}
                    onChange={(checked) => setScannerConfig({
                      ...scannerConfig,
                      camera: { ...scannerConfig.camera, vibrate: checked }
                    })}
                    disabled={!scannerConfig.camera.enabled}
                  />
                </div>
              </Space>
            </Form.Item>
          </Col>

          <Col xs={24} md={12}>
            <Form.Item label="Supported Barcode Formats">
              <Select
                mode="multiple"
                value={scannerConfig.camera.scanFormats}
                onChange={(value) => setScannerConfig({
                  ...scannerConfig,
                  camera: { ...scannerConfig.camera, scanFormats: value }
                })}
                disabled={!scannerConfig.camera.enabled}
                placeholder="Select barcode formats"
              >
                {barcodeFormats.map(format => (
                  <Option key={format.value} value={format.value}>{format.label}</Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
        </Row>
      </Card>

      {/* Manual/Keyboard Input Configuration */}
      <Card
        title={<span><DesktopOutlined className="mr-2" />Manual Input Configuration</span>}
        className="shadow-sm"
        extra={
          <Badge status={scannerConfig.keyboard.enabled ? 'success' : 'default'} text={scannerConfig.keyboard.enabled ? 'Enabled' : 'Disabled'} />
        }
      >
        <Row gutter={[24, 16]}>
          <Col span={24}>
            <div className="flex items-center justify-between mb-4 p-3 bg-gray-50 rounded">
              <div>
                <Text strong>Enable Manual Input</Text>
                <br />
                <Text type="secondary">Allow typing barcodes manually via keyboard</Text>
              </div>
              <Switch
                checked={scannerConfig.keyboard.enabled}
                onChange={(checked) => setScannerConfig({
                  ...scannerConfig,
                  keyboard: { ...scannerConfig.keyboard, enabled: checked }
                })}
              />
            </div>
          </Col>

          <Col xs={24} md={8}>
            <Form.Item label="Min Barcode Length">
              <InputNumber
                value={scannerConfig.keyboard.minLength}
                onChange={(value) => setScannerConfig({
                  ...scannerConfig,
                  keyboard: { ...scannerConfig.keyboard, minLength: value || 1 }
                })}
                disabled={!scannerConfig.keyboard.enabled}
                min={1}
                max={50}
                style={{ width: '100%' }}
              />
            </Form.Item>
          </Col>

          <Col xs={24} md={8}>
            <Form.Item label="Max Barcode Length">
              <InputNumber
                value={scannerConfig.keyboard.maxLength}
                onChange={(value) => setScannerConfig({
                  ...scannerConfig,
                  keyboard: { ...scannerConfig.keyboard, maxLength: value || 100 }
                })}
                disabled={!scannerConfig.keyboard.enabled}
                min={1}
                max={500}
                style={{ width: '100%' }}
              />
            </Form.Item>
          </Col>

          <Col xs={24} md={8}>
            <Form.Item label="Options">
              <Space direction="vertical" className="w-full">
                <div className="flex justify-between items-center">
                  <Text>Enter to Submit</Text>
                  <Switch
                    size="small"
                    checked={scannerConfig.keyboard.enterToSubmit}
                    onChange={(checked) => setScannerConfig({
                      ...scannerConfig,
                      keyboard: { ...scannerConfig.keyboard, enterToSubmit: checked }
                    })}
                    disabled={!scannerConfig.keyboard.enabled}
                  />
                </div>
                <div className="flex justify-between items-center">
                  <Text>Auto-focus Input</Text>
                  <Switch
                    size="small"
                    checked={scannerConfig.keyboard.autoFocus}
                    onChange={(checked) => setScannerConfig({
                      ...scannerConfig,
                      keyboard: { ...scannerConfig.keyboard, autoFocus: checked }
                    })}
                    disabled={!scannerConfig.keyboard.enabled}
                  />
                </div>
              </Space>
            </Form.Item>
          </Col>
        </Row>
      </Card>

      {/* Test Scanner */}
      <Card title={<span><ScanOutlined className="mr-2" />Test Scanner</span>} className="shadow-sm">
        <Row gutter={[24, 16]}>
          <Col xs={24} md={12}>
            <div className="p-4 bg-gray-50 rounded text-center">
              <Title level={5}>Test Your Scanner</Title>
              <Paragraph type="secondary">
                Click the button below and scan a barcode to verify your scanner is configured correctly.
              </Paragraph>
              <Button
                type="primary"
                size="large"
                icon={testingScan ? <SyncOutlined spin /> : <ScanOutlined />}
                onClick={testScanner}
                loading={testingScan}
              >
                {testingScan ? 'Waiting for scan...' : 'Start Test'}
              </Button>
              {lastScannedBarcode && (
                <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded">
                  <CheckCircleOutlined className="text-green-500 mr-2" />
                  <Text strong>Last scanned: </Text>
                  <Text code>{lastScannedBarcode}</Text>
                </div>
              )}
            </div>
          </Col>
          <Col xs={24} md={12}>
            <div className="p-4 bg-blue-50 rounded">
              <Title level={5}><InfoCircleOutlined className="mr-2" />Setup Tips for TC21</Title>
              <List
                size="small"
                dataSource={[
                  'Enable DataWedge on your TC21 device',
                  'Set output mode to "Keystroke Output"',
                  'Configure suffix as Enter/Line Feed',
                  'Ensure Bluetooth or USB is connected',
                  'Test with the scanner test above',
                ]}
                renderItem={(item) => (
                  <List.Item>
                    <Text type="secondary">• {item}</Text>
                  </List.Item>
                )}
              />
            </div>
          </Col>
        </Row>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end gap-3">
        <Button onClick={() => setScannerConfig(defaultScannerConfig)}>
          Reset to Defaults
        </Button>
        <Button type="primary" icon={<SaveOutlined />} onClick={saveScannerConfig} loading={scannerSaving} size="large">
          Save Scanner Settings
        </Button>
      </div>
    </div>
  );

  // Load carriers from localStorage
  useEffect(() => {
    const savedCarriers = localStorage.getItem('carrier_configs');
    if (savedCarriers) {
      try { setCarriers(JSON.parse(savedCarriers)); } catch (e) { console.error('Failed to parse carriers:', e); }
    }
    const savedMarketplaces = localStorage.getItem('marketplace_configs');
    if (savedMarketplaces) {
      try { setMarketplaces(JSON.parse(savedMarketplaces)); } catch (e) { console.error('Failed to parse marketplaces:', e); }
    }
  }, []);

  // Save carrier
  const saveCarrier = async (values: any) => {
    setCarrierSaving(true);
    try {
      const carrier = availableCarriers.find(c => c.code === values.carrier_code);
      const newCarrier: CarrierConfig = {
        id: selectedCarrier?.id || `carrier_${Date.now()}`,
        name: carrier?.name || values.name,
        carrier_code: values.carrier_code,
        enabled: values.enabled ?? true,
        is_test_mode: values.is_test_mode ?? true,
        credentials: {
          api_key: values.api_key || '',
          api_secret: values.api_secret || '',
          account_number: values.account_number || '',
        },
        settings: {
          default_service: values.default_service,
          label_format: values.label_format || 'PDF',
          label_size: values.label_size || '4x6',
          signature_required: values.signature_required || false,
          insurance_enabled: values.insurance_enabled || false,
          saturday_delivery: values.saturday_delivery || false,
        }
      };

      const updatedCarriers = selectedCarrier
        ? carriers.map(c => c.id === selectedCarrier.id ? newCarrier : c)
        : [...carriers, newCarrier];

      setCarriers(updatedCarriers);
      localStorage.setItem('carrier_configs', JSON.stringify(updatedCarriers));
      message.success(`Carrier ${selectedCarrier ? 'updated' : 'added'} successfully!`);
      setCarrierModalOpen(false);
      setSelectedCarrier(null);
      carrierForm.resetFields();
    } catch (err) {
      message.error('Failed to save carrier');
    } finally {
      setCarrierSaving(false);
    }
  };

  // Delete carrier
  const deleteCarrier = (id: string) => {
    modal.confirm({
      title: 'Delete Carrier',
      content: 'Are you sure you want to remove this carrier configuration?',
      okText: 'Delete',
      okType: 'danger',
      onOk: () => {
        const updated = carriers.filter(c => c.id !== id);
        setCarriers(updated);
        localStorage.setItem('carrier_configs', JSON.stringify(updated));
        message.success('Carrier removed');
      }
    });
  };

  // Save marketplace
  const saveMarketplace = async (values: any) => {
    setMarketplaceSaving(true);
    try {
      const mp = availableMarketplaces.find(m => m.platform === values.platform);
      const newMarketplace: MarketplaceConfig = {
        id: selectedMarketplace?.id || `marketplace_${Date.now()}`,
        name: mp?.name || values.name,
        platform: values.platform,
        enabled: values.enabled ?? true,
        credentials: {
          client_id: values.client_id || '',
          client_secret: values.client_secret || '',
          refresh_token: values.refresh_token || '',
          store_url: values.store_url || '',
          api_key: values.api_key || '',
        },
        settings: {
          sync_orders: values.sync_orders ?? true,
          sync_inventory: values.sync_inventory ?? true,
          sync_products: values.sync_products ?? false,
          auto_fulfill: values.auto_fulfill ?? false,
          order_prefix: values.order_prefix || '',
          import_interval_minutes: values.import_interval_minutes || 15,
        },
        status: 'disconnected'
      };

      const updated = selectedMarketplace
        ? marketplaces.map(m => m.id === selectedMarketplace.id ? newMarketplace : m)
        : [...marketplaces, newMarketplace];

      setMarketplaces(updated);
      localStorage.setItem('marketplace_configs', JSON.stringify(updated));
      message.success(`Marketplace ${selectedMarketplace ? 'updated' : 'connected'} successfully!`);
      setMarketplaceModalOpen(false);
      setSelectedMarketplace(null);
      marketplaceForm.resetFields();
    } catch (err) {
      message.error('Failed to save marketplace');
    } finally {
      setMarketplaceSaving(false);
    }
  };

  // Delete marketplace
  const deleteMarketplace = (id: string) => {
    modal.confirm({
      title: 'Disconnect Marketplace',
      content: 'Are you sure you want to disconnect this marketplace?',
      okText: 'Disconnect',
      okType: 'danger',
      onOk: () => {
        const updated = marketplaces.filter(m => m.id !== id);
        setMarketplaces(updated);
        localStorage.setItem('marketplace_configs', JSON.stringify(updated));
        message.success('Marketplace disconnected');
      }
    });
  };

  // Carrier settings UI
  const renderCarrierSettings = () => (
    <div className="space-y-6">
      <Alert
        message="Shipping Carrier Integration"
        description="Connect your shipping carriers to automatically generate labels, track shipments, and get real-time rates. We support all major UK carriers."
        type="info"
        showIcon
        className="mb-4"
      />

      {/* Connected Carriers */}
      <Card title={<span><CheckCircleOutlined className="mr-2" />Connected Carriers ({carriers.length})</span>} className="shadow-sm">
        {carriers.length === 0 ? (
          <div className="text-center py-8">
            <Text type="secondary">No carriers configured yet. Add your first carrier below.</Text>
          </div>
        ) : (
          <Row gutter={[16, 16]}>
            {carriers.map(carrier => {
              const info = availableCarriers.find(c => c.code === carrier.carrier_code);
              return (
                <Col key={carrier.id} xs={24} md={12} lg={8}>
                  <Card
                    size="small"
                    className={`${carrier.enabled ? 'border-green-300' : 'border-gray-200'}`}
                    actions={[
                      <Button key="edit" type="link" size="small" onClick={() => {
                        setSelectedCarrier(carrier);
                        carrierForm.setFieldsValue({
                          ...carrier,
                          ...carrier.credentials,
                          ...carrier.settings
                        });
                        setCarrierModalOpen(true);
                      }}><EditOutlined /> Edit</Button>,
                      <Button key="delete" type="link" danger size="small" onClick={() => deleteCarrier(carrier.id)}><DeleteOutlined /> Remove</Button>
                    ]}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{info?.logo || '📦'}</span>
                      <div className="flex-1">
                        <Text strong>{carrier.name}</Text>
                        <br />
                        <Space>
                          <Tag color={carrier.enabled ? 'green' : 'default'}>{carrier.enabled ? 'Active' : 'Disabled'}</Tag>
                          {carrier.is_test_mode && <Tag color="orange">Test Mode</Tag>}
                        </Space>
                      </div>
                    </div>
                  </Card>
                </Col>
              );
            })}
          </Row>
        )}
      </Card>

      {/* Available Carriers */}
      <Card title={<span><PlusOutlined className="mr-2" />Add Carrier</span>} className="shadow-sm">
        <Row gutter={[16, 16]}>
          {availableCarriers.map(carrier => {
            const isConnected = carriers.some(c => c.carrier_code === carrier.code);
            return (
              <Col key={carrier.code} xs={24} sm={12} md={8} lg={6}>
                <Card
                  hoverable={!isConnected}
                  size="small"
                  className={isConnected ? 'bg-gray-50' : 'cursor-pointer'}
                  onClick={() => {
                    if (!isConnected) {
                      setSelectedCarrier(null);
                      carrierForm.setFieldsValue({ carrier_code: carrier.code, enabled: true, is_test_mode: true, label_format: 'PDF', label_size: '4x6' });
                      setCarrierModalOpen(true);
                    }
                  }}
                >
                  <div className="text-center">
                    <span className="text-3xl">{carrier.logo}</span>
                    <div className="mt-2">
                      <Text strong className="block">{carrier.name}</Text>
                      <Text type="secondary" className="text-xs">{carrier.services.length} services</Text>
                    </div>
                    {isConnected && <Tag color="green" className="mt-2">Connected</Tag>}
                  </div>
                </Card>
              </Col>
            );
          })}
        </Row>
      </Card>
    </div>
  );

  // Marketplace settings UI
  const renderMarketplaceSettings = () => (
    <div className="space-y-6">
      <Alert
        message="Marketplace & Sales Channel Integration"
        description="Connect your online stores and marketplaces to automatically import orders, sync inventory levels, and update fulfillment status. Powered by unified commerce APIs."
        type="info"
        showIcon
        className="mb-4"
      />

      {/* Connected Marketplaces */}
      <Card title={<span><CheckCircleOutlined className="mr-2" />Connected Channels ({marketplaces.length})</span>} className="shadow-sm">
        {marketplaces.length === 0 ? (
          <div className="text-center py-8">
            <Text type="secondary">No marketplaces connected. Connect your first sales channel below.</Text>
          </div>
        ) : (
          <Row gutter={[16, 16]}>
            {marketplaces.map(mp => {
              const info = availableMarketplaces.find(m => m.platform === mp.platform);
              return (
                <Col key={mp.id} xs={24} md={12}>
                  <Card
                    size="small"
                    className={`${mp.enabled ? 'border-green-300' : 'border-gray-200'}`}
                    actions={[
                      <Button key="sync" type="link" size="small" icon={<SyncOutlined />}>Sync Now</Button>,
                      <Button key="edit" type="link" size="small" onClick={() => {
                        setSelectedMarketplace(mp);
                        marketplaceForm.setFieldsValue({
                          ...mp,
                          ...mp.credentials,
                          ...mp.settings
                        });
                        setMarketplaceModalOpen(true);
                      }}><EditOutlined /> Edit</Button>,
                      <Button key="delete" type="link" danger size="small" onClick={() => deleteMarketplace(mp.id)}><DeleteOutlined /></Button>
                    ]}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{info?.logo || '🛒'}</span>
                      <div className="flex-1">
                        <Text strong>{mp.name}</Text>
                        <br />
                        <Space size="small" wrap>
                          <Tag color={mp.enabled ? 'green' : 'default'}>{mp.enabled ? 'Active' : 'Disabled'}</Tag>
                          <Tag color={mp.status === 'connected' ? 'success' : mp.status === 'error' ? 'error' : 'default'}>{mp.status}</Tag>
                          {mp.settings.sync_orders && <Tag>Orders</Tag>}
                          {mp.settings.sync_inventory && <Tag>Inventory</Tag>}
                        </Space>
                        {mp.last_sync && <div className="mt-1"><Text type="secondary" className="text-xs">Last sync: {formatDate(mp.last_sync)}</Text></div>}
                      </div>
                    </div>
                  </Card>
                </Col>
              );
            })}
          </Row>
        )}
      </Card>

      {/* Available Marketplaces */}
      <Card title={<span><PlusOutlined className="mr-2" />Connect Sales Channel</span>} className="shadow-sm">
        <Row gutter={[16, 16]}>
          {availableMarketplaces.map(mp => {
            const isConnected = marketplaces.some(m => m.platform === mp.platform);
            return (
              <Col key={mp.platform} xs={24} sm={12} md={8} lg={6}>
                <Card
                  hoverable={!isConnected}
                  size="small"
                  className={isConnected ? 'bg-gray-50' : 'cursor-pointer'}
                  onClick={() => {
                    if (!isConnected) {
                      setSelectedMarketplace(null);
                      marketplaceForm.setFieldsValue({ platform: mp.platform, enabled: true, sync_orders: true, sync_inventory: true, import_interval_minutes: 15 });
                      setMarketplaceModalOpen(true);
                    }
                  }}
                >
                  <div className="text-center">
                    <span className="text-3xl">{mp.logo}</span>
                    <div className="mt-2">
                      <Text strong className="block">{mp.name}</Text>
                      <Text type="secondary" className="text-xs">{mp.apiType}</Text>
                    </div>
                    {isConnected && <Tag color="green" className="mt-2">Connected</Tag>}
                  </div>
                </Card>
              </Col>
            );
          })}
        </Row>
      </Card>
    </div>
  );

  // Payment & Invoice settings UI
  const renderPaymentSettings = () => (
    <div className="space-y-6">
      <Alert
        message="Payment & Invoicing Configuration"
        description="Configure Stripe for payment links, set up email templates for invoices, and enable document signing for purchase orders."
        type="info"
        showIcon
        className="mb-4"
      />

      {/* Stripe Configuration */}
      <Card title={<span>💳 Stripe Payment Integration</span>} className="shadow-sm">
        <Form layout="vertical">
          <Row gutter={[24, 16]}>
            <Col span={24}>
              <div className="flex items-center justify-between mb-4 p-3 bg-gray-50 rounded">
                <div>
                  <Text strong>Enable Stripe Payments</Text>
                  <br />
                  <Text type="secondary">Generate payment links for purchase orders and invoices</Text>
                </div>
                <Switch defaultChecked={false} />
              </div>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item label="Stripe Publishable Key">
                <Input placeholder="pk_test_..." />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item label="Stripe Secret Key">
                <Input.Password placeholder="sk_test_..." />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item label="Webhook Secret">
                <Input.Password placeholder="whsec_..." />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item label="Default Currency">
                <Select defaultValue="GBP">
                  <Option value="GBP">GBP (£)</Option>
                  <Option value="EUR">EUR (€)</Option>
                  <Option value="USD">USD ($)</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={24}>
              <Space>
                <div className="flex items-center gap-2">
                  <Text>Test Mode</Text>
                  <Switch defaultChecked={true} size="small" />
                </div>
                <div className="flex items-center gap-2">
                  <Text>Auto-send Payment Links</Text>
                  <Switch defaultChecked={false} size="small" />
                </div>
              </Space>
            </Col>
          </Row>
        </Form>
      </Card>

      {/* Email/Invoice Configuration */}
      <Card title={<span>📧 Email & Invoice Settings</span>} className="shadow-sm">
        <Form layout="vertical">
          <Row gutter={[24, 16]}>
            <Col xs={24} md={12}>
              <Form.Item label="SMTP Host">
                <Input placeholder="smtp.gmail.com" />
              </Form.Item>
            </Col>
            <Col xs={24} md={6}>
              <Form.Item label="SMTP Port">
                <InputNumber defaultValue={587} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col xs={24} md={6}>
              <Form.Item label="Encryption">
                <Select defaultValue="TLS">
                  <Option value="TLS">TLS</Option>
                  <Option value="SSL">SSL</Option>
                  <Option value="NONE">None</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item label="SMTP Username">
                <Input placeholder="your@email.com" />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item label="SMTP Password">
                <Input.Password placeholder="App password or SMTP password" />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item label="From Email">
                <Input placeholder="invoices@yourcompany.com" />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item label="From Name">
                <Input placeholder="Your Company Name" />
              </Form.Item>
            </Col>
            <Col xs={24}>
              <Form.Item label="Invoice Email Subject Template">
                <Input defaultValue="Invoice #{invoice_number} from {company_name}" />
              </Form.Item>
            </Col>
            <Col span={24}>
              <Space direction="vertical" className="w-full">
                <div className="flex items-center justify-between">
                  <Text>Auto-send invoice on PO approval</Text>
                  <Switch defaultChecked={false} size="small" />
                </div>
                <div className="flex items-center justify-between">
                  <Text>Include payment link in invoice</Text>
                  <Switch defaultChecked={true} size="small" />
                </div>
                <div className="flex items-center justify-between">
                  <Text>Send copy to admin</Text>
                  <Switch defaultChecked={true} size="small" />
                </div>
              </Space>
            </Col>
          </Row>
        </Form>
      </Card>

      {/* Document Signing */}
      <Card title={<span>✍️ Document Signing (E-Signature)</span>} className="shadow-sm">
        <Form layout="vertical">
          <Row gutter={[24, 16]}>
            <Col span={24}>
              <div className="flex items-center justify-between mb-4 p-3 bg-gray-50 rounded">
                <div>
                  <Text strong>Enable Document Signing</Text>
                  <br />
                  <Text type="secondary">Require e-signatures on purchase orders and contracts</Text>
                </div>
                <Switch defaultChecked={false} />
              </div>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item label="E-Signature Provider">
                <Select defaultValue="internal">
                  <Option value="internal">Built-in (Canvas Signature)</Option>
                  <Option value="docusign">DocuSign</Option>
                  <Option value="hellosign">Dropbox Sign (HelloSign)</Option>
                  <Option value="adobe_sign">Adobe Sign</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item label="Signature Required For">
                <Select mode="multiple" defaultValue={['purchase_orders']}>
                  <Option value="purchase_orders">Purchase Orders</Option>
                  <Option value="contracts">Contracts</Option>
                  <Option value="invoices">Invoices</Option>
                  <Option value="goods_received">Goods Received Notes</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={24}>
              <Space direction="vertical" className="w-full">
                <div className="flex items-center justify-between">
                  <Text>Require supplier signature</Text>
                  <Switch defaultChecked={true} size="small" />
                </div>
                <div className="flex items-center justify-between">
                  <Text>Require internal approval signature</Text>
                  <Switch defaultChecked={true} size="small" />
                </div>
                <div className="flex items-center justify-between">
                  <Text>Send signature request via email</Text>
                  <Switch defaultChecked={true} size="small" />
                </div>
                <div className="flex items-center justify-between">
                  <Text>Store signed documents</Text>
                  <Switch defaultChecked={true} size="small" />
                </div>
              </Space>
            </Col>
          </Row>
        </Form>
      </Card>

      {/* Company Details for Invoices */}
      <Card title={<span>🏢 Company Details (Invoice Header)</span>} className="shadow-sm">
        <Form layout="vertical">
          <Row gutter={[24, 16]}>
            <Col xs={24} md={12}>
              <Form.Item label="Company Name">
                <Input placeholder="Your Company Ltd" />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item label="Company Registration Number">
                <Input placeholder="12345678" />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item label="VAT Number">
                <Input placeholder="GB123456789" />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item label="Phone">
                <Input placeholder="+44 20 1234 5678" />
              </Form.Item>
            </Col>
            <Col span={24}>
              <Form.Item label="Address">
                <Input.TextArea rows={2} placeholder="123 Business Street&#10;London, EC1A 1BB&#10;United Kingdom" />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item label="Bank Name">
                <Input placeholder="Barclays Bank" />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item label="Sort Code">
                <Input placeholder="12-34-56" />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item label="Account Number">
                <Input placeholder="12345678" />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item label="IBAN (International)">
                <Input placeholder="GB82 BARC 1234 5678 9012 34" />
              </Form.Item>
            </Col>
            <Col xs={24}>
              <Form.Item label="Invoice Terms & Conditions">
                <Input.TextArea rows={3} placeholder="Payment terms: 30 days net&#10;Late payment interest: 8% above base rate..." />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button type="primary" icon={<SaveOutlined />} size="large">
          Save Payment Settings
        </Button>
      </div>
    </div>
  );

  const renderFiltersAndTable = () => (
    <>
      <div className="flex gap-4 mb-4">
        <Search
          placeholder="Search settings..."
          style={{ width: 300 }}
          prefix={<SearchOutlined />}
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          allowClear
        />
        <Select placeholder="Type" style={{ width: 150 }} allowClear>
          <Option value="Text">Text</Option>
          <Option value="Boolean">Boolean</Option>
          <Option value="Number">Number</Option>
          <Option value="Dropdown">Dropdown</Option>
        </Select>
        <Button icon={<ReloadOutlined />} onClick={fetchSettings}>Refresh</Button>
      </div>
      {error && (
        <Alert
          message="Error"
          description={error}
          type="error"
          showIcon
          className="mb-4"
          closable
          onClose={() => setError(null)}
        />
      )}
      <Table
        columns={columns}
        dataSource={getFilteredSettings()}
        rowKey="id"
        loading={loading}
        scroll={{ x: 1000 }}
        onRow={(record) => ({
          onClick: () => router.push(`/protected/settings/${record.id}`),
          style: { cursor: 'pointer' }
        })}
        pagination={{
          showSizeChanger: true,
          showTotal: (total) => `Total ${total} settings`,
        }}
      />
    </>
  );

  const tabItems = [
    {
      key: 'all',
      label: <span className="flex items-center gap-2"><SettingOutlined />All Settings ({settings.length})</span>,
      children: renderFiltersAndTable(),
    },
    {
      key: 'general',
      label: <span className="flex items-center gap-2"><AppstoreOutlined />General ({generalSettings.length})</span>,
      children: renderFiltersAndTable(),
    },
    {
      key: 'operations',
      label: <span className="flex items-center gap-2"><DatabaseOutlined />Operations ({operationsSettings.length})</span>,
      children: renderFiltersAndTable(),
    },
    {
      key: 'inventory',
      label: <span className="flex items-center gap-2"><DatabaseOutlined />Inventory ({inventorySettings.length})</span>,
      children: renderFiltersAndTable(),
    },
    {
      key: 'notifications',
      label: <span className="flex items-center gap-2"><BellOutlined />Notifications ({notificationSettings.length})</span>,
      children: renderFiltersAndTable(),
    },
    {
      key: 'scanner',
      label: <span className="flex items-center gap-2"><ScanOutlined />Scanner</span>,
      children: renderScannerSettings(),
    },
    {
      key: 'payments',
      label: <span className="flex items-center gap-2">💳 Payments & Invoicing</span>,
      children: renderPaymentSettings(),
    },
  ];

  if (loading && settings.length === 0) {
    return (
      <div className="flex justify-center items-center h-96">
        <Spin size="large" tip="Loading settings..." />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-600 to-gray-800 bg-clip-text text-transparent">
            System Settings
          </h1>
          <p className="text-gray-600 mt-1">Configure system preferences and operational parameters</p>
        </div>
        <Button type="primary" icon={<PlusOutlined />} size="large" onClick={() => {
          setEditMode(false);
          setSelectedSetting(null);
          form.resetFields();
          setModalOpen(true);
        }}>
          Add Setting
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <div className="text-center">
            <p className="text-gray-500 text-sm">Total Settings</p>
            <p className="text-3xl font-bold text-blue-600">{settings.length}</p>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <p className="text-gray-500 text-sm">General</p>
            <p className="text-3xl font-bold text-green-600">{generalSettings.length}</p>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <p className="text-gray-500 text-sm">Operations</p>
            <p className="text-3xl font-bold text-purple-600">{operationsSettings.length}</p>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <p className="text-gray-500 text-sm">Notifications</p>
            <p className="text-3xl font-bold text-orange-600">{notificationSettings.length}</p>
          </div>
        </Card>
      </div>

      <Card className="shadow-sm">
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={tabItems}
          size="large"
        />
      </Card>

      <Modal
        title={editMode ? 'Edit Setting' : 'Add Setting'}
        open={modalOpen}
        onCancel={() => {
          setModalOpen(false);
          setEditMode(false);
          setSelectedSetting(null);
          form.resetFields();
        }}
        onOk={() => form.submit()}
        confirmLoading={saving}
        width={600}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item label="Category" name="category" rules={[{ required: true, message: 'Please select category' }]}>
            <Select placeholder="Select category">
              <Option value="General">General</Option>
              <Option value="Operations">Operations</Option>
              <Option value="Inventory">Inventory</Option>
              <Option value="Notifications">Notifications</Option>
            </Select>
          </Form.Item>
          <Form.Item label="Setting Key" name="key" rules={[{ required: true, message: 'Please enter setting key' }]}>
            <Input placeholder="Enter setting key (e.g., company_name)" />
          </Form.Item>
          <Form.Item label="Value" name="value" rules={[{ required: true, message: 'Please enter value' }]}>
            <Input placeholder="Enter value" />
          </Form.Item>
          <Form.Item label="Type" name="type" rules={[{ required: true, message: 'Please select type' }]}>
            <Select placeholder="Select type">
              <Option value="Text">Text</Option>
              <Option value="Number">Number</Option>
              <Option value="Boolean">Boolean</Option>
              <Option value="Dropdown">Dropdown</Option>
              <Option value="Time">Time</Option>
            </Select>
          </Form.Item>
          <Form.Item label="Description" name="description">
            <Input.TextArea placeholder="Enter description (optional)" rows={3} />
          </Form.Item>
        </Form>
      </Modal>

      {/* Carrier Configuration Modal */}
      <Modal
        title={selectedCarrier ? 'Edit Carrier' : 'Add Carrier'}
        open={carrierModalOpen}
        onCancel={() => {
          setCarrierModalOpen(false);
          setSelectedCarrier(null);
          carrierForm.resetFields();
        }}
        onOk={() => carrierForm.submit()}
        confirmLoading={carrierSaving}
        width={700}
      >
        <Form form={carrierForm} layout="vertical" onFinish={saveCarrier}>
          <Form.Item name="carrier_code" hidden>
            <Input />
          </Form.Item>

          <Alert
            message={`Configure ${availableCarriers.find(c => c.code === carrierForm.getFieldValue('carrier_code'))?.name || 'Carrier'}`}
            type="info"
            className="mb-4"
          />

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="Enabled" name="enabled" valuePropName="checked">
                <Switch />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Test Mode" name="is_test_mode" valuePropName="checked">
                <Switch />
              </Form.Item>
            </Col>
          </Row>

          <Divider>API Credentials</Divider>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="API Key" name="api_key" rules={[{ required: true, message: 'API Key is required' }]}>
                <Input.Password placeholder="Enter API key" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="API Secret" name="api_secret">
                <Input.Password placeholder="Enter API secret (if required)" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Account Number" name="account_number">
                <Input placeholder="Your carrier account number" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Default Service" name="default_service">
                <Select placeholder="Select default service">
                  {(availableCarriers.find(c => c.code === carrierForm.getFieldValue('carrier_code'))?.services || []).map(service => (
                    <Option key={service} value={service}>{service}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Divider>Label Settings</Divider>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item label="Label Format" name="label_format">
                <Select>
                  <Option value="PDF">PDF</Option>
                  <Option value="ZPL">ZPL (Zebra)</Option>
                  <Option value="PNG">PNG Image</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="Label Size" name="label_size">
                <Select>
                  <Option value="4x6">4x6 inches (Standard)</Option>
                  <Option value="4x4">4x4 inches</Option>
                  <Option value="6x4">6x4 inches</Option>
                  <Option value="A6">A6</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="Options">
                <Space direction="vertical">
                  <Form.Item name="signature_required" valuePropName="checked" noStyle>
                    <Switch size="small" /> <Text className="ml-2">Signature Required</Text>
                  </Form.Item>
                  <Form.Item name="insurance_enabled" valuePropName="checked" noStyle>
                    <Switch size="small" /> <Text className="ml-2">Insurance</Text>
                  </Form.Item>
                  <Form.Item name="saturday_delivery" valuePropName="checked" noStyle>
                    <Switch size="small" /> <Text className="ml-2">Saturday Delivery</Text>
                  </Form.Item>
                </Space>
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>

      {/* Marketplace Configuration Modal */}
      <Modal
        title={selectedMarketplace ? 'Edit Marketplace Connection' : 'Connect Marketplace'}
        open={marketplaceModalOpen}
        onCancel={() => {
          setMarketplaceModalOpen(false);
          setSelectedMarketplace(null);
          marketplaceForm.resetFields();
        }}
        onOk={() => marketplaceForm.submit()}
        confirmLoading={marketplaceSaving}
        width={700}
      >
        <Form form={marketplaceForm} layout="vertical" onFinish={saveMarketplace}>
          <Form.Item name="platform" hidden>
            <Input />
          </Form.Item>

          {(() => {
            const mp = availableMarketplaces.find(m => m.platform === marketplaceForm.getFieldValue('platform'));
            return mp ? (
              <Alert
                message={`Connect to ${mp.name}`}
                description={mp.description}
                type="info"
                className="mb-4"
              />
            ) : null;
          })()}

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="Enabled" name="enabled" valuePropName="checked">
                <Switch />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Order Prefix" name="order_prefix" tooltip="Prefix added to imported order numbers">
                <Input placeholder="e.g., AMZ-, EBAY-" />
              </Form.Item>
            </Col>
          </Row>

          <Divider>API Credentials</Divider>

          {/* Amazon specific fields */}
          {marketplaceForm.getFieldValue('platform') === 'amazon' && (
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item label="Seller ID" name="seller_id" rules={[{ required: true }]}>
                  <Input placeholder="Your Amazon Seller ID" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item label="MWS Auth Token" name="mws_auth_token">
                  <Input.Password placeholder="MWS Authorization Token" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item label="Refresh Token (SP-API)" name="refresh_token" rules={[{ required: true }]}>
                  <Input.Password placeholder="SP-API Refresh Token" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item label="Marketplace ID" name="marketplace_id">
                  <Select placeholder="Select marketplace">
                    <Option value="A1F83G8C2ARO7P">UK (amazon.co.uk)</Option>
                    <Option value="A13V1IB3VIYZZH">France (amazon.fr)</Option>
                    <Option value="A1PA6795UKMFR9">Germany (amazon.de)</Option>
                    <Option value="APJ6JRA9NG5V4">Italy (amazon.it)</Option>
                    <Option value="A1RKKUPIHCS9HS">Spain (amazon.es)</Option>
                  </Select>
                </Form.Item>
              </Col>
            </Row>
          )}

          {/* eBay specific fields */}
          {marketplaceForm.getFieldValue('platform') === 'ebay' && (
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item label="Client ID (App ID)" name="client_id" rules={[{ required: true }]}>
                  <Input placeholder="eBay App ID" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item label="Client Secret (Cert ID)" name="client_secret" rules={[{ required: true }]}>
                  <Input.Password placeholder="eBay Cert ID" />
                </Form.Item>
              </Col>
              <Col span={24}>
                <Form.Item label="Refresh Token" name="refresh_token" rules={[{ required: true }]}>
                  <Input.Password placeholder="OAuth Refresh Token" />
                </Form.Item>
              </Col>
            </Row>
          )}

          {/* Shopify specific fields */}
          {marketplaceForm.getFieldValue('platform') === 'shopify' && (
            <Row gutter={16}>
              <Col span={24}>
                <Form.Item label="Store URL" name="store_url" rules={[{ required: true }]}>
                  <Input placeholder="yourstore.myshopify.com" addonBefore="https://" />
                </Form.Item>
              </Col>
              <Col span={24}>
                <Form.Item label="Access Token" name="api_key" rules={[{ required: true }]}>
                  <Input.Password placeholder="Shopify Admin API Access Token" />
                </Form.Item>
              </Col>
            </Row>
          )}

          {/* WooCommerce specific fields */}
          {marketplaceForm.getFieldValue('platform') === 'woocommerce' && (
            <Row gutter={16}>
              <Col span={24}>
                <Form.Item label="Store URL" name="store_url" rules={[{ required: true }]}>
                  <Input placeholder="https://yourstore.com" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item label="Consumer Key" name="client_id" rules={[{ required: true }]}>
                  <Input placeholder="ck_..." />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item label="Consumer Secret" name="client_secret" rules={[{ required: true }]}>
                  <Input.Password placeholder="cs_..." />
                </Form.Item>
              </Col>
            </Row>
          )}

          {/* Generic API fields for other platforms */}
          {!['amazon', 'ebay', 'shopify', 'woocommerce'].includes(marketplaceForm.getFieldValue('platform') || '') && (
            <Row gutter={16}>
              <Col span={24}>
                <Form.Item label="Store/API URL" name="store_url">
                  <Input placeholder="https://api.marketplace.com" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item label="API Key / Client ID" name="api_key" rules={[{ required: true }]}>
                  <Input.Password placeholder="API Key or Client ID" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item label="API Secret" name="client_secret">
                  <Input.Password placeholder="API Secret (if required)" />
                </Form.Item>
              </Col>
            </Row>
          )}

          <Divider>Sync Settings</Divider>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="sync_orders" valuePropName="checked">
                <Switch /> <Text className="ml-2">Sync Orders</Text>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="sync_inventory" valuePropName="checked">
                <Switch /> <Text className="ml-2">Sync Inventory</Text>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="sync_products" valuePropName="checked">
                <Switch /> <Text className="ml-2">Sync Products</Text>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="auto_fulfill" valuePropName="checked">
                <Switch /> <Text className="ml-2">Auto-mark as Fulfilled</Text>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Import Interval (minutes)" name="import_interval_minutes">
                <Select>
                  <Option value={5}>Every 5 minutes</Option>
                  <Option value={15}>Every 15 minutes</Option>
                  <Option value={30}>Every 30 minutes</Option>
                  <Option value={60}>Every hour</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>
    </div>
  );
}
