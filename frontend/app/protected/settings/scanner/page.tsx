'use client';

import React, { useState, useEffect } from 'react';
import { Card, Form, Switch, Select, Input, InputNumber, Button, Space, Tabs, Tag, Alert, message, Divider, Row, Col, Checkbox, Collapse, Modal, Table, Badge, Tooltip } from 'antd';
import {
  MobileOutlined,
  CameraOutlined,
  ScanOutlined,
  SettingOutlined,
  ApiOutlined,
  DownloadOutlined,
  CodeOutlined,
  SyncOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  PlusOutlined,
  DeleteOutlined,
  PlayCircleOutlined,
  LinkOutlined,
  DisconnectOutlined,
  QuestionCircleOutlined,
  ThunderboltOutlined
} from '@ant-design/icons';
import apiService from '@/services/api';

interface SupportedScanner {
  name: string;
  models: string[];
  connectionTypes: string[];
  plugin: string;
}

interface ConnectedScanner {
  id: string;
  brand: string;
  brandName: string;
  model: string;
  name: string;
  connectionType: string;
  plugin: string;
  status: string;
  connectedAt: string;
  lastSeen: string;
  scanCount?: number;
  battery?: number;
}

interface ScannerSettings {
  defaultScanner: 'camera' | 'tc21';
  scannerMode: 'camera' | 'tc21';
  tc21Config: {
    enabled: boolean;
    connectionType: 'usb' | 'bluetooth' | 'network';
    ip: string;
    port: number;
    symbologies: string[];
    beepOnScan: boolean;
    vibrate: boolean;
    aimingMode: 'trigger' | 'continuous' | 'presentation';
    scanTimeout: number;
  };
  cameraConfig: {
    enabled: boolean;
    preferredCamera: 'back' | 'front';
    torch: boolean;
    zoom: number;
    symbologies: string[];
    beepOnScan: boolean;
    vibrate: boolean;
    scanAreaGuide: boolean;
  };
  mobileAppConfig: {
    platform: 'expo' | 'react-native' | 'capacitor';
    scannerPlugin: string;
    offlineMode: boolean;
    syncInterval: number;
  };
}

const allSymbologies = [
  'Code128', 'Code39', 'Code93', 'Codabar',
  'QRCode', 'DataMatrix', 'PDF417', 'Aztec',
  'EAN13', 'EAN8', 'UPC', 'UPCE',
  'ITF', 'Interleaved2of5'
];

export default function ScannerSettingsPage() {
  const [settings, setSettings] = useState<ScannerSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form] = Form.useForm();
  const [connectForm] = Form.useForm();

  // Scanner management state
  const [supportedScanners, setSupportedScanners] = useState<Record<string, SupportedScanner>>({});
  const [connectedScanners, setConnectedScanners] = useState<ConnectedScanner[]>([]);
  const [connectModalOpen, setConnectModalOpen] = useState(false);
  const [setupGuideOpen, setSetupGuideOpen] = useState(false);
  const [selectedBrand, setSelectedBrand] = useState<string>('');
  const [setupGuide, setSetupGuide] = useState<any>(null);

  useEffect(() => {
    fetchSettings();
    fetchSupportedScanners();
    fetchConnectedScanners();
  }, []);

  const fetchSupportedScanners = async () => {
    try {
      const data = await apiService.get('/scanners/supported');
      setSupportedScanners(data || {});
    } catch (error) {
      console.error('Error fetching supported scanners:', error);
    }
  };

  const fetchConnectedScanners = async () => {
    try {
      const data = await apiService.get('/scanners/connected');
      setConnectedScanners(data || []);
    } catch (error) {
      console.error('Error fetching connected scanners:', error);
    }
  };

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const data = await apiService.get('/scanner-settings');
      setSettings(data);
      form.setFieldsValue({
        ...data,
        tc21Symbologies: data.tc21Config?.symbologies || [],
        cameraSymbologies: data.cameraConfig?.symbologies || [],
      });
    } catch (error) {
      console.error('Error fetching scanner settings:', error);
      message.error('Failed to load scanner settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (values: any) => {
    setSaving(true);
    try {
      const payload: ScannerSettings = {
        defaultScanner: values.defaultScanner,
        scannerMode: values.scannerMode,
        tc21Config: {
          enabled: values.tc21Enabled || false,
          connectionType: values.tc21ConnectionType || 'usb',
          ip: values.tc21Ip || '',
          port: values.tc21Port || 9100,
          symbologies: values.tc21Symbologies || [],
          beepOnScan: values.tc21Beep ?? true,
          vibrate: values.tc21Vibrate ?? true,
          aimingMode: values.tc21AimingMode || 'trigger',
          scanTimeout: values.tc21Timeout || 5000,
        },
        cameraConfig: {
          enabled: values.cameraEnabled ?? true,
          preferredCamera: values.cameraPreferred || 'back',
          torch: values.cameraTorch || false,
          zoom: values.cameraZoom || 1,
          symbologies: values.cameraSymbologies || [],
          beepOnScan: values.cameraBeep ?? true,
          vibrate: values.cameraVibrate ?? true,
          scanAreaGuide: values.cameraScanGuide ?? true,
        },
        mobileAppConfig: {
          platform: values.mobilePlatform || 'expo',
          scannerPlugin: values.mobilePlugin || 'expo-barcode-scanner',
          offlineMode: values.mobileOffline || false,
          syncInterval: values.mobileSyncInterval || 30000,
        },
      };

      await apiService.put('/scanner-settings', payload);
      message.success('Scanner settings saved successfully');
      setSettings(payload);
    } catch (error) {
      console.error('Error saving settings:', error);
      message.error('Failed to save scanner settings');
    } finally {
      setSaving(false);
    }
  };

  const switchMode = async (mode: 'camera' | 'tc21') => {
    try {
      await apiService.post('/scanner-settings/switch-mode', { mode });
      message.success(`Switched to ${mode === 'tc21' ? 'TC21 Handheld' : 'Camera'} scanning mode`);
      fetchSettings();
    } catch (error) {
      message.error('Failed to switch scanner mode');
    }
  };

  const downloadDataWedgeProfile = async () => {
    try {
      const profile = await apiService.get('/scanner-settings/tc21-profile');
      const blob = new Blob([JSON.stringify(profile, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'KiaanWMS_DataWedge_Profile.json';
      a.click();
      URL.revokeObjectURL(url);
      message.success('DataWedge profile downloaded');
    } catch (error) {
      message.error('Failed to download profile');
    }
  };

  const handleConnectScanner = async (values: any) => {
    try {
      await apiService.post('/scanners/connect', {
        brand: values.brand,
        model: values.model,
        connectionType: values.connectionType,
        name: values.name,
        setActive: values.setActive,
      });
      message.success('Scanner connected successfully');
      setConnectModalOpen(false);
      connectForm.resetFields();
      fetchConnectedScanners();
      fetchSettings();
    } catch (error) {
      message.error('Failed to connect scanner');
    }
  };

  const handleDisconnectScanner = async (scannerId: string) => {
    Modal.confirm({
      title: 'Disconnect Scanner',
      content: 'Are you sure you want to disconnect this scanner?',
      okType: 'danger',
      onOk: async () => {
        try {
          await apiService.delete(`/scanners/${scannerId}`);
          message.success('Scanner disconnected');
          fetchConnectedScanners();
          fetchSettings();
        } catch (error) {
          message.error('Failed to disconnect scanner');
        }
      },
    });
  };

  const handleActivateScanner = async (scannerId: string) => {
    try {
      await apiService.post(`/scanners/${scannerId}/activate`);
      message.success('Scanner activated');
      fetchConnectedScanners();
      fetchSettings();
    } catch (error) {
      message.error('Failed to activate scanner');
    }
  };

  const showSetupGuide = async (brand: string) => {
    try {
      const guide = await apiService.get(`/scanners/${brand}/setup-guide`);
      setSetupGuide(guide);
      setSetupGuideOpen(true);
    } catch (error) {
      message.error('Failed to load setup guide');
    }
  };

  const connectedScannerColumns = [
    {
      title: 'Scanner',
      key: 'name',
      render: (_: any, record: ConnectedScanner) => (
        <div>
          <div className="font-medium">{record.name}</div>
          <div className="text-xs text-gray-500">{record.brandName} - {record.model}</div>
        </div>
      ),
    },
    {
      title: 'Connection',
      dataIndex: 'connectionType',
      key: 'connection',
      render: (type: string) => (
        <Tag color={type === 'bluetooth' ? 'blue' : type === 'usb' ? 'green' : 'purple'}>
          {type.toUpperCase()}
        </Tag>
      ),
    },
    {
      title: 'Status',
      key: 'status',
      render: (_: any, record: ConnectedScanner) => (
        <Badge
          status={record.status === 'connected' ? 'success' : 'default'}
          text={record.status === 'connected' ? 'Connected' : 'Offline'}
        />
      ),
    },
    {
      title: 'Scans',
      dataIndex: 'scanCount',
      key: 'scans',
      render: (count: number) => count || 0,
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, record: ConnectedScanner) => (
        <Space>
          <Tooltip title="Activate this scanner">
            <Button
              size="small"
              type="primary"
              icon={<PlayCircleOutlined />}
              onClick={() => handleActivateScanner(record.id)}
            >
              Activate
            </Button>
          </Tooltip>
          <Tooltip title="Setup Guide">
            <Button
              size="small"
              icon={<QuestionCircleOutlined />}
              onClick={() => showSetupGuide(record.brand)}
            />
          </Tooltip>
          <Tooltip title="Disconnect">
            <Button
              size="small"
              danger
              icon={<DisconnectOutlined />}
              onClick={() => handleDisconnectScanner(record.id)}
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  if (loading) {
    return <div className="p-6 text-center">Loading scanner settings...</div>;
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Scanner Settings</h1>
          <p className="text-gray-500">Configure barcode scanners: TC21 Handheld or Camera-based scanning</p>
        </div>
        <Space>
          <Tag color={settings?.scannerMode === 'tc21' ? 'blue' : 'green'} icon={settings?.scannerMode === 'tc21' ? <MobileOutlined /> : <CameraOutlined />}>
            Active: {settings?.scannerMode === 'tc21' ? 'TC21 Handheld' : 'Camera'}
          </Tag>
          <Button onClick={fetchSettings} icon={<SyncOutlined />}>Refresh</Button>
        </Space>
      </div>

      {/* Connected Scanners */}
      <Card className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Connected Scanners</h3>
          <Space>
            <Button onClick={fetchConnectedScanners} icon={<SyncOutlined />}>Refresh</Button>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => setConnectModalOpen(true)}>
              Connect Scanner
            </Button>
          </Space>
        </div>

        {connectedScanners.length > 0 ? (
          <Table
            columns={connectedScannerColumns}
            dataSource={connectedScanners}
            rowKey="id"
            pagination={false}
            size="small"
          />
        ) : (
          <div className="text-center py-8 text-gray-500">
            <ScanOutlined style={{ fontSize: 48, opacity: 0.3 }} />
            <p className="mt-4">No scanners connected</p>
            <p className="text-sm">Click "Connect Scanner" to add a barcode scanner</p>
          </div>
        )}

        {/* Supported Scanners Info */}
        <Divider />
        <h4 className="font-semibold mb-3">Supported Scanner Brands</h4>
        <Row gutter={[12, 12]}>
          {Object.entries(supportedScanners).map(([key, scanner]) => (
            <Col key={key}>
              <Card size="small" className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => showSetupGuide(key)}>
                <div className="text-center">
                  <div className="font-medium">{scanner.name}</div>
                  <div className="text-xs text-gray-500">{scanner.models.length} models</div>
                  <Tag size="small" color="blue" className="mt-1">{scanner.connectionTypes.join(', ')}</Tag>
                </div>
              </Card>
            </Col>
          ))}
        </Row>
      </Card>

      {/* Quick Mode Switch */}
      <Card className="mb-6">
        <h3 className="text-lg font-semibold mb-4">Quick Mode Switch</h3>
        <Space size="large" wrap>
          <Button
            type={settings?.scannerMode === 'camera' ? 'primary' : 'default'}
            size="large"
            icon={<CameraOutlined />}
            onClick={() => switchMode('camera')}
          >
            Camera Scanning
          </Button>
          <Button
            type={settings?.scannerMode === 'tc21' ? 'primary' : 'default'}
            size="large"
            icon={<MobileOutlined />}
            onClick={() => switchMode('tc21')}
          >
            TC21 Handheld
          </Button>
          {connectedScanners.map(scanner => (
            <Button
              key={scanner.id}
              type={settings?.activeScannerBrand === scanner.brand ? 'primary' : 'default'}
              size="large"
              icon={<ThunderboltOutlined />}
              onClick={() => handleActivateScanner(scanner.id)}
            >
              {scanner.name}
            </Button>
          ))}
        </Space>
        <p className="text-gray-500 mt-2 text-sm">
          Switch between camera-based scanning and connected hardware scanners
        </p>
      </Card>

      <Form
        form={form}
        layout="vertical"
        onFinish={handleSave}
        initialValues={{
          defaultScanner: settings?.defaultScanner || 'camera',
          scannerMode: settings?.scannerMode || 'camera',
          // TC21
          tc21Enabled: settings?.tc21Config?.enabled || false,
          tc21ConnectionType: settings?.tc21Config?.connectionType || 'usb',
          tc21Ip: settings?.tc21Config?.ip || '',
          tc21Port: settings?.tc21Config?.port || 9100,
          tc21Symbologies: settings?.tc21Config?.symbologies || [],
          tc21Beep: settings?.tc21Config?.beepOnScan ?? true,
          tc21Vibrate: settings?.tc21Config?.vibrate ?? true,
          tc21AimingMode: settings?.tc21Config?.aimingMode || 'trigger',
          tc21Timeout: settings?.tc21Config?.scanTimeout || 5000,
          // Camera
          cameraEnabled: settings?.cameraConfig?.enabled ?? true,
          cameraPreferred: settings?.cameraConfig?.preferredCamera || 'back',
          cameraTorch: settings?.cameraConfig?.torch || false,
          cameraZoom: settings?.cameraConfig?.zoom || 1,
          cameraSymbologies: settings?.cameraConfig?.symbologies || [],
          cameraBeep: settings?.cameraConfig?.beepOnScan ?? true,
          cameraVibrate: settings?.cameraConfig?.vibrate ?? true,
          cameraScanGuide: settings?.cameraConfig?.scanAreaGuide ?? true,
          // Mobile App
          mobilePlatform: settings?.mobileAppConfig?.platform || 'expo',
          mobilePlugin: settings?.mobileAppConfig?.scannerPlugin || 'expo-barcode-scanner',
          mobileOffline: settings?.mobileAppConfig?.offlineMode || false,
          mobileSyncInterval: settings?.mobileAppConfig?.syncInterval || 30000,
        }}
      >
        {/* Show settings based on selected scanner mode */}
        {settings?.scannerMode === 'tc21' ? (
          // TC21 Handheld Settings
          <Card className="mb-4">
            <div className="flex items-center gap-2 mb-4">
              <MobileOutlined className="text-xl text-blue-500" />
              <h3 className="text-lg font-semibold m-0">TC21 Handheld Scanner Settings</h3>
              <Tag color="blue">Active Mode</Tag>
            </div>
            <Alert
              message="Zebra TC21 Integration (Open Source)"
              description={
                <div>
                  <p>Uses <strong>react-native-datawedge</strong> for seamless integration with Zebra DataWedge.</p>
                  <p className="mt-2">DataWedge provides hardware-level barcode scanning with:</p>
                  <ul className="list-disc ml-5 mt-1">
                    <li>Physical trigger button support</li>
                    <li>Intent-based scan delivery</li>
                    <li>Profile-based configuration</li>
                    <li>All major symbologies supported</li>
                  </ul>
                </div>
              }
              type="info"
              showIcon
              className="mb-4"
            />

            <Row gutter={16}>
              <Col span={12}>
                <Form.Item name="tc21Enabled" label="Enable TC21 Support" valuePropName="checked">
                  <Switch />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="tc21ConnectionType" label="Connection Type">
                  <Select>
                    <Select.Option value="usb">USB (Tethered)</Select.Option>
                    <Select.Option value="bluetooth">Bluetooth</Select.Option>
                    <Select.Option value="network">Network/WiFi</Select.Option>
                  </Select>
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col span={12}>
                <Form.Item name="tc21AimingMode" label="Aiming Mode">
                  <Select>
                    <Select.Option value="trigger">Trigger (Press to Scan)</Select.Option>
                    <Select.Option value="continuous">Continuous</Select.Option>
                    <Select.Option value="presentation">Presentation Mode</Select.Option>
                  </Select>
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="tc21Timeout" label="Scan Timeout (ms)">
                  <InputNumber min={1000} max={30000} step={1000} style={{ width: '100%' }} />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col span={12}>
                <Form.Item name="tc21Beep" label="Beep on Scan" valuePropName="checked">
                  <Switch />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="tc21Vibrate" label="Vibrate on Scan" valuePropName="checked">
                  <Switch />
                </Form.Item>
              </Col>
            </Row>

            <Form.Item name="tc21Symbologies" label="Enabled Symbologies">
              <Checkbox.Group options={allSymbologies.map(s => ({ label: s, value: s }))} />
            </Form.Item>

            <Divider />

            <h4 className="font-semibold mb-3">DataWedge Profile Setup</h4>
            <p className="text-gray-600 text-sm mb-3">
              Download the DataWedge profile configuration to import into your TC21 device.
              This configures the scanner to send barcodes to the Kiaan WMS app via Intent.
            </p>
            <Button icon={<DownloadOutlined />} onClick={downloadDataWedgeProfile}>
              Download DataWedge Profile
            </Button>

            <Collapse className="mt-4" items={[{
              key: '1',
              label: 'Manual DataWedge Setup Instructions',
              children: (
                <div className="text-sm">
                  <ol className="list-decimal ml-5 space-y-2">
                    <li>Open <strong>DataWedge</strong> app on your TC21</li>
                    <li>Create a new profile named "KiaanWMS"</li>
                    <li>Associate it with <code>com.kiaan.wms</code></li>
                    <li>Enable <strong>Barcode Input</strong></li>
                    <li>Disable <strong>Keystroke Output</strong></li>
                    <li>Enable <strong>Intent Output</strong> with:
                      <ul className="list-disc ml-5 mt-1">
                        <li>Intent Action: <code>com.kiaan.wms.SCAN</code></li>
                        <li>Intent Delivery: <code>Broadcast</code></li>
                      </ul>
                    </li>
                  </ol>
                </div>
              ),
            }]} />
          </Card>
        ) : (
          // Camera Scanning Settings
          <Card className="mb-4">
            <div className="flex items-center gap-2 mb-4">
              <CameraOutlined className="text-xl text-green-500" />
              <h3 className="text-lg font-semibold m-0">Camera Scanner Settings</h3>
              <Tag color="green">Active Mode</Tag>
            </div>
            <Alert
              message="Camera-Based Scanning (Open Source)"
              description={
                <div>
                  <p>Uses device camera for barcode scanning. Recommended libraries:</p>
                  <ul className="list-disc ml-5 mt-1">
                    <li><strong>expo-barcode-scanner</strong> - Expo managed workflow</li>
                    <li><strong>react-native-vision-camera</strong> - Best performance, bare workflow</li>
                    <li><strong>react-native-camera</strong> - Legacy support</li>
                  </ul>
                </div>
              }
              type="info"
              showIcon
              className="mb-4"
            />

            <Row gutter={16}>
              <Col span={12}>
                <Form.Item name="cameraEnabled" label="Enable Camera Scanning" valuePropName="checked">
                  <Switch />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="cameraPreferred" label="Preferred Camera">
                  <Select>
                    <Select.Option value="back">Back Camera</Select.Option>
                    <Select.Option value="front">Front Camera</Select.Option>
                  </Select>
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col span={8}>
                <Form.Item name="cameraTorch" label="Enable Torch" valuePropName="checked">
                  <Switch />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item name="cameraZoom" label="Default Zoom">
                  <InputNumber min={1} max={5} step={0.5} style={{ width: '100%' }} />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item name="cameraScanGuide" label="Show Scan Guide" valuePropName="checked">
                  <Switch />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col span={12}>
                <Form.Item name="cameraBeep" label="Beep on Scan" valuePropName="checked">
                  <Switch />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="cameraVibrate" label="Vibrate on Scan" valuePropName="checked">
                  <Switch />
                </Form.Item>
              </Col>
            </Row>

            <Form.Item name="cameraSymbologies" label="Enabled Symbologies">
              <Checkbox.Group options={allSymbologies.map(s => ({ label: s, value: s }))} />
            </Form.Item>
          </Card>
        )}

        {/* Mobile App Configuration - Collapsible section */}
        <Collapse
          className="mb-4"
          items={[{
            key: 'mobile-config',
            label: <span><ApiOutlined /> Mobile App Config</span>,
            children: (
              <Card>
                <Alert
                  message="React Native / Expo Configuration"
                  description="Configure the mobile app framework and scanner plugin for development."
                  type="info"
                  showIcon
                  className="mb-4"
                />

                <Row gutter={16}>
                  <Col span={12}>
                    <Form.Item name="mobilePlatform" label="Mobile Platform">
                      <Select>
                        <Select.Option value="expo">Expo (Managed)</Select.Option>
                        <Select.Option value="react-native">React Native (Bare)</Select.Option>
                        <Select.Option value="capacitor">Capacitor</Select.Option>
                      </Select>
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item name="mobilePlugin" label="Scanner Plugin">
                      <Select>
                        <Select.Option value="expo-barcode-scanner">expo-barcode-scanner</Select.Option>
                        <Select.Option value="react-native-vision-camera">react-native-vision-camera</Select.Option>
                        <Select.Option value="react-native-camera">react-native-camera (legacy)</Select.Option>
                        <Select.Option value="datawedge">react-native-datawedge (TC21)</Select.Option>
                      </Select>
                    </Form.Item>
                  </Col>
                </Row>

                <Row gutter={16}>
                  <Col span={12}>
                    <Form.Item name="mobileOffline" label="Enable Offline Mode" valuePropName="checked">
                      <Switch />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item name="mobileSyncInterval" label="Sync Interval (ms)">
                      <InputNumber min={5000} max={300000} step={5000} style={{ width: '100%' }} />
                    </Form.Item>
                  </Col>
                </Row>

                <Divider />

                <h4 className="font-semibold mb-3">Recommended Open Source Libraries</h4>
                <div className="bg-gray-50 p-4 rounded">
                  <pre className="text-sm whitespace-pre-wrap">{`# For Expo (Managed Workflow)
npx expo install expo-barcode-scanner expo-camera

# For React Native (Bare Workflow)
npm install react-native-vision-camera
npm install @shopify/react-native-skia  # For ML Kit barcode scanning

# For Zebra TC21 DataWedge
npm install react-native-datawedge-intents

# Alternative: react-native-camera (older but stable)
npm install react-native-camera`}</pre>
                </div>

                <Collapse className="mt-4" items={[{
                  key: '1',
                  label: 'Example Scanner Component Code',
                  children: (
                    <div className="bg-gray-900 text-green-400 p-4 rounded text-xs overflow-auto">
                      <pre>{`// DataWedge Integration for TC21
import { useEffect } from 'react';
import DataWedgeIntents from 'react-native-datawedge-intents';

export const useDataWedgeScanner = (onScan) => {
  useEffect(() => {
    // Register for scan events
    DataWedgeIntents.registerReceiver(
      'com.kiaan.wms.SCAN',
      (intent) => {
        const barcode = intent.data;
        const symbology = intent.labelType;
        onScan({ barcode, symbology });
      }
    );

    return () => {
      DataWedgeIntents.unregisterReceiver();
    };
  }, [onScan]);
};

// Camera Scanner Component
import { BarCodeScanner } from 'expo-barcode-scanner';

export const CameraScanner = ({ onScan }) => {
  const [hasPermission, setHasPermission] = useState(null);

  useEffect(() => {
    (async () => {
      const { status } = await BarCodeScanner.requestPermissionsAsync();
      setHasPermission(status === 'granted');
    })();
  }, []);

  return (
    <BarCodeScanner
      onBarCodeScanned={({ data, type }) => onScan({ barcode: data, symbology: type })}
      style={{ flex: 1 }}
    />
  );
};`}</pre>
                    </div>
                  ),
                }]} />
              </Card>
            ),
          },
        ]} />

        <div className="mt-6 flex justify-end">
          <Space>
            <Button onClick={fetchSettings}>Reset</Button>
            <Button type="primary" htmlType="submit" loading={saving} icon={<CheckCircleOutlined />}>
              Save Settings
            </Button>
          </Space>
        </div>
      </Form>

      {/* Connect Scanner Modal */}
      <Modal
        title="Connect New Scanner"
        open={connectModalOpen}
        onCancel={() => {
          setConnectModalOpen(false);
          connectForm.resetFields();
        }}
        onOk={() => connectForm.submit()}
        width={600}
      >
        <Form form={connectForm} layout="vertical" onFinish={handleConnectScanner}>
          <Form.Item
            name="brand"
            label="Scanner Brand"
            rules={[{ required: true, message: 'Please select a brand' }]}
          >
            <Select
              placeholder="Select brand"
              onChange={(value) => {
                setSelectedBrand(value);
                connectForm.setFieldsValue({ model: undefined, connectionType: undefined });
              }}
            >
              {Object.entries(supportedScanners).map(([key, scanner]) => (
                <Select.Option key={key} value={key}>{scanner.name}</Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="model"
            label="Scanner Model"
            rules={[{ required: true, message: 'Please select a model' }]}
          >
            <Select placeholder="Select model" disabled={!selectedBrand}>
              {selectedBrand && supportedScanners[selectedBrand]?.models.map((model) => (
                <Select.Option key={model} value={model}>{model}</Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="connectionType"
            label="Connection Type"
            rules={[{ required: true, message: 'Please select connection type' }]}
          >
            <Select placeholder="Select connection type" disabled={!selectedBrand}>
              {selectedBrand && supportedScanners[selectedBrand]?.connectionTypes.map((type) => (
                <Select.Option key={type} value={type}>{type.toUpperCase()}</Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item name="name" label="Display Name (optional)">
            <Input placeholder="e.g., Warehouse Scanner 1" />
          </Form.Item>

          <Form.Item name="setActive" valuePropName="checked" initialValue={true}>
            <Checkbox>Set as active scanner immediately</Checkbox>
          </Form.Item>

          {selectedBrand && (
            <Alert
              message={`Plugin Required: ${supportedScanners[selectedBrand]?.plugin}`}
              description={
                <Button size="small" icon={<QuestionCircleOutlined />} onClick={() => showSetupGuide(selectedBrand)}>
                  View Setup Guide
                </Button>
              }
              type="info"
              className="mt-4"
            />
          )}
        </Form>
      </Modal>

      {/* Setup Guide Modal */}
      <Modal
        title={setupGuide?.title || 'Setup Guide'}
        open={setupGuideOpen}
        onCancel={() => setSetupGuideOpen(false)}
        footer={[
          <Button key="close" onClick={() => setSetupGuideOpen(false)}>Close</Button>
        ]}
        width={700}
      >
        {setupGuide && (
          <div>
            <h4 className="font-semibold mb-2">Setup Steps:</h4>
            <ol className="list-decimal ml-5 space-y-2 mb-4">
              {setupGuide.steps?.map((step: string, index: number) => (
                <li key={index}>{step}</li>
              ))}
            </ol>

            <Divider />

            <h4 className="font-semibold mb-2">Required Plugin:</h4>
            <div className="bg-gray-100 p-3 rounded font-mono text-sm mb-4">
              {setupGuide.plugin}
            </div>

            <h4 className="font-semibold mb-2">Integration Code:</h4>
            <div className="bg-gray-900 text-green-400 p-4 rounded text-xs overflow-auto">
              <pre>{setupGuide.code}</pre>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
