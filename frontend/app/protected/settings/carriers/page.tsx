'use client';

import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Button,
  Modal,
  Form,
  Input,
  Select,
  Switch,
  Tag,
  Space,
  message,
  Tabs,
  Row,
  Col,
  Statistic,
  Typography,
  Tooltip,
  Popconfirm,
  Badge,
  Divider,
  Alert,
  InputNumber,
  Upload,
  Image
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  SettingOutlined,
  ApiOutlined,
  TruckOutlined,
  GlobalOutlined,
  SafetyCertificateOutlined,
  ReloadOutlined,
  LinkOutlined,
  DisconnectOutlined,
  UploadOutlined,
  InfoCircleOutlined
} from '@ant-design/icons';
import { apiService } from '@/services/api';

const { Title, Text } = Typography;
const { TabPane } = Tabs;
const { Option } = Select;

// Carrier types
const CARRIER_TYPES = [
  { value: 'FEDEX', label: 'FedEx', color: 'purple' },
  { value: 'UPS', label: 'UPS', color: 'gold' },
  { value: 'DHL', label: 'DHL', color: 'red' },
  { value: 'USPS', label: 'USPS', color: 'blue' },
  { value: 'ARAMEX', label: 'Aramex', color: 'orange' },
  { value: 'DPD', label: 'DPD', color: 'magenta' },
  { value: 'TNT', label: 'TNT', color: 'volcano' },
  { value: 'ROYAL_MAIL', label: 'Royal Mail', color: 'geekblue' },
  { value: 'CANADA_POST', label: 'Canada Post', color: 'cyan' },
  { value: 'AUSTRALIA_POST', label: 'Australia Post', color: 'lime' },
  { value: 'CUSTOM', label: 'Custom Carrier', color: 'default' }
];

// Service types
const SERVICE_TYPES = {
  FEDEX: ['Ground', 'Express Saver', '2Day', 'Standard Overnight', 'Priority Overnight', 'First Overnight', 'International Economy', 'International Priority'],
  UPS: ['Ground', '3 Day Select', '2nd Day Air', 'Next Day Air Saver', 'Next Day Air', 'Worldwide Express', 'Worldwide Expedited'],
  DHL: ['Express Worldwide', 'Express 12:00', 'Express 9:00', 'Economy Select'],
  USPS: ['First Class', 'Priority Mail', 'Priority Mail Express', 'Ground Advantage', 'Media Mail'],
  ARAMEX: ['Priority Express', 'Express', 'Deferred', 'Economy'],
  DPD: ['Classic', 'Express', 'Air Classic', 'Air Express'],
  TNT: ['Express', 'Economy Express', '12:00 Express', '9:00 Express'],
  ROYAL_MAIL: ['First Class', 'Second Class', 'Special Delivery Guaranteed', 'Tracked 24', 'Tracked 48'],
  CANADA_POST: ['Regular Parcel', 'Expedited Parcel', 'Xpresspost', 'Priority'],
  AUSTRALIA_POST: ['Parcel Post', 'Express Post', 'StarTrack Express', 'StarTrack Premium'],
  CUSTOM: ['Standard', 'Express', 'Economy']
};

interface Carrier {
  id: string;
  name: string;
  type: string;
  code: string;
  isActive: boolean;
  isDefault: boolean;
  apiKey?: string;
  apiSecret?: string;
  accountNumber?: string;
  meterNumber?: string;
  testMode: boolean;
  webhookUrl?: string;
  trackingUrl?: string;
  labelFormat: string;
  services: string[];
  supportedCountries: string[];
  maxWeight?: number;
  maxDimensions?: { length: number; width: number; height: number };
  insuranceEnabled: boolean;
  signatureRequired: boolean;
  createdAt: string;
  lastConnected?: string;
  connectionStatus: 'connected' | 'disconnected' | 'error';
}

export default function CarriersPage() {
  const [carriers, setCarriers] = useState<Carrier[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingCarrier, setEditingCarrier] = useState<Carrier | null>(null);
  const [testingConnection, setTestingConnection] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('carriers');
  const [form] = Form.useForm();

  // Demo carriers data
  const demoCarriers: Carrier[] = [
    {
      id: '1',
      name: 'FedEx Production',
      type: 'FEDEX',
      code: 'FEDEX_PROD',
      isActive: true,
      isDefault: true,
      accountNumber: '****7890',
      meterNumber: '****5678',
      testMode: false,
      trackingUrl: 'https://www.fedex.com/fedextrack/?trknbr={tracking_number}',
      labelFormat: 'PDF',
      services: ['Ground', 'Express Saver', '2Day', 'Standard Overnight'],
      supportedCountries: ['US', 'CA', 'MX', 'GB', 'DE', 'FR'],
      maxWeight: 150,
      maxDimensions: { length: 108, width: 68, height: 68 },
      insuranceEnabled: true,
      signatureRequired: false,
      createdAt: '2025-01-15T10:00:00Z',
      lastConnected: '2025-11-28T09:30:00Z',
      connectionStatus: 'connected'
    },
    {
      id: '2',
      name: 'UPS Business',
      type: 'UPS',
      code: 'UPS_BIZ',
      isActive: true,
      isDefault: false,
      accountNumber: '****1234',
      testMode: false,
      trackingUrl: 'https://www.ups.com/track?tracknum={tracking_number}',
      labelFormat: 'ZPL',
      services: ['Ground', '3 Day Select', '2nd Day Air', 'Next Day Air'],
      supportedCountries: ['US', 'CA', 'GB', 'DE'],
      maxWeight: 150,
      insuranceEnabled: true,
      signatureRequired: true,
      createdAt: '2025-02-20T14:30:00Z',
      lastConnected: '2025-11-28T08:45:00Z',
      connectionStatus: 'connected'
    },
    {
      id: '3',
      name: 'DHL Express',
      type: 'DHL',
      code: 'DHL_EXP',
      isActive: true,
      isDefault: false,
      accountNumber: '****5678',
      testMode: false,
      trackingUrl: 'https://www.dhl.com/en/express/tracking.html?AWB={tracking_number}',
      labelFormat: 'PDF',
      services: ['Express Worldwide', 'Express 12:00', 'Economy Select'],
      supportedCountries: ['US', 'GB', 'DE', 'FR', 'ES', 'IT', 'NL', 'AE', 'SA'],
      maxWeight: 70,
      insuranceEnabled: true,
      signatureRequired: true,
      createdAt: '2025-03-10T09:15:00Z',
      lastConnected: '2025-11-27T16:20:00Z',
      connectionStatus: 'connected'
    },
    {
      id: '4',
      name: 'USPS Commercial',
      type: 'USPS',
      code: 'USPS_COM',
      isActive: false,
      isDefault: false,
      accountNumber: '****9012',
      testMode: true,
      trackingUrl: 'https://tools.usps.com/go/TrackConfirmAction?tLabels={tracking_number}',
      labelFormat: 'PDF',
      services: ['First Class', 'Priority Mail', 'Priority Mail Express'],
      supportedCountries: ['US'],
      maxWeight: 70,
      insuranceEnabled: false,
      signatureRequired: false,
      createdAt: '2025-04-05T11:00:00Z',
      connectionStatus: 'disconnected'
    },
    {
      id: '5',
      name: 'Aramex International',
      type: 'ARAMEX',
      code: 'ARAMEX_INT',
      isActive: true,
      isDefault: false,
      accountNumber: '****3456',
      testMode: false,
      trackingUrl: 'https://www.aramex.com/track/results?ShipmentNumber={tracking_number}',
      labelFormat: 'PDF',
      services: ['Priority Express', 'Express', 'Economy'],
      supportedCountries: ['AE', 'SA', 'EG', 'JO', 'KW', 'QA', 'BH', 'OM'],
      maxWeight: 50,
      insuranceEnabled: true,
      signatureRequired: true,
      createdAt: '2025-05-15T08:30:00Z',
      lastConnected: '2025-11-28T07:00:00Z',
      connectionStatus: 'connected'
    }
  ];

  useEffect(() => {
    loadCarriers();
  }, []);

  const loadCarriers = async () => {
    setLoading(true);
    try {
      const response = await apiService.get('/shipping/carriers');
      if (response.data && Array.isArray(response.data) && response.data.length > 0) {
        setCarriers(response.data);
      } else {
        setCarriers(demoCarriers);
      }
    } catch (error) {
      console.error('Error loading carriers:', error);
      setCarriers(demoCarriers);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setEditingCarrier(null);
    form.resetFields();
    form.setFieldsValue({
      testMode: true,
      labelFormat: 'PDF',
      insuranceEnabled: false,
      signatureRequired: false,
      isActive: true
    });
    setModalVisible(true);
  };

  const handleEdit = (carrier: Carrier) => {
    setEditingCarrier(carrier);
    form.setFieldsValue({
      ...carrier,
      services: carrier.services,
      supportedCountries: carrier.supportedCountries
    });
    setModalVisible(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await apiService.delete(`/shipping/carriers/${id}`);
      message.success('Carrier deleted successfully');
      setCarriers(prev => prev.filter(c => c.id !== id));
    } catch (error) {
      message.error('Failed to delete carrier');
    }
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();

      if (editingCarrier) {
        const updated = { ...editingCarrier, ...values };
        setCarriers(prev => prev.map(c => c.id === editingCarrier.id ? updated : c));
        message.success('Carrier updated successfully');
      } else {
        const newCarrier: Carrier = {
          id: Date.now().toString(),
          ...values,
          createdAt: new Date().toISOString(),
          connectionStatus: 'disconnected'
        };
        setCarriers(prev => [...prev, newCarrier]);
        message.success('Carrier added successfully');
      }

      setModalVisible(false);
      form.resetFields();
    } catch (error) {
      message.error('Please fill in all required fields');
    }
  };

  const testConnection = async (carrier: Carrier) => {
    setTestingConnection(carrier.id);
    try {
      await apiService.post(`/shipping/carriers/${carrier.id}/test`);
      message.success(`Connection to ${carrier.name} successful!`);
      setCarriers(prev => prev.map(c =>
        c.id === carrier.id
          ? { ...c, connectionStatus: 'connected', lastConnected: new Date().toISOString() }
          : c
      ));
    } catch (error) {
      message.error(`Connection to ${carrier.name} failed`);
      setCarriers(prev => prev.map(c =>
        c.id === carrier.id ? { ...c, connectionStatus: 'error' } : c
      ));
    } finally {
      setTestingConnection(null);
    }
  };

  const setAsDefault = async (carrier: Carrier) => {
    setCarriers(prev => prev.map(c => ({
      ...c,
      isDefault: c.id === carrier.id
    })));
    message.success(`${carrier.name} set as default carrier`);
  };

  const toggleActive = async (carrier: Carrier) => {
    setCarriers(prev => prev.map(c =>
      c.id === carrier.id ? { ...c, isActive: !c.isActive } : c
    ));
    message.success(`${carrier.name} ${carrier.isActive ? 'deactivated' : 'activated'}`);
  };

  const getCarrierTypeInfo = (type: string) => {
    return CARRIER_TYPES.find(t => t.value === type) || { label: type, color: 'default' };
  };

  const getConnectionStatusBadge = (status: string) => {
    switch (status) {
      case 'connected':
        return <Badge status="success" text="Connected" />;
      case 'disconnected':
        return <Badge status="default" text="Disconnected" />;
      case 'error':
        return <Badge status="error" text="Error" />;
      default:
        return <Badge status="default" text="Unknown" />;
    }
  };

  const columns = [
    {
      title: 'Carrier',
      key: 'carrier',
      render: (record: Carrier) => (
        <Space direction="vertical" size={0}>
          <Space>
            <TruckOutlined />
            <Text strong>{record.name}</Text>
            {record.isDefault && <Tag color="green">Default</Tag>}
          </Space>
          <Text type="secondary" style={{ fontSize: 12 }}>
            Code: {record.code}
          </Text>
        </Space>
      )
    },
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      render: (type: string) => {
        const info = getCarrierTypeInfo(type);
        return <Tag color={info.color}>{info.label}</Tag>;
      }
    },
    {
      title: 'Status',
      key: 'status',
      render: (record: Carrier) => (
        <Space direction="vertical" size={0}>
          <Switch
            checked={record.isActive}
            onChange={() => toggleActive(record)}
            checkedChildren="Active"
            unCheckedChildren="Inactive"
            size="small"
          />
          {record.testMode && (
            <Tag color="orange" style={{ marginTop: 4 }}>Test Mode</Tag>
          )}
        </Space>
      )
    },
    {
      title: 'Connection',
      key: 'connection',
      render: (record: Carrier) => (
        <Space direction="vertical" size={0}>
          {getConnectionStatusBadge(record.connectionStatus)}
          {record.lastConnected && (
            <Text type="secondary" style={{ fontSize: 11 }}>
              Last: {new Date(record.lastConnected).toLocaleString()}
            </Text>
          )}
        </Space>
      )
    },
    {
      title: 'Services',
      key: 'services',
      render: (record: Carrier) => (
        <Tooltip title={record.services.join(', ')}>
          <Text>{record.services.length} services</Text>
        </Tooltip>
      )
    },
    {
      title: 'Label Format',
      dataIndex: 'labelFormat',
      key: 'labelFormat',
      render: (format: string) => <Tag>{format}</Tag>
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (record: Carrier) => (
        <Space>
          <Tooltip title="Test Connection">
            <Button
              type="text"
              icon={<ApiOutlined spin={testingConnection === record.id} />}
              onClick={() => testConnection(record)}
              loading={testingConnection === record.id}
            />
          </Tooltip>
          <Tooltip title="Edit">
            <Button
              type="text"
              icon={<EditOutlined />}
              onClick={() => handleEdit(record)}
            />
          </Tooltip>
          {!record.isDefault && (
            <Tooltip title="Set as Default">
              <Button
                type="text"
                icon={<CheckCircleOutlined />}
                onClick={() => setAsDefault(record)}
              />
            </Tooltip>
          )}
          <Popconfirm
            title="Delete this carrier?"
            description="This action cannot be undone."
            onConfirm={() => handleDelete(record.id)}
            okText="Delete"
            okButtonProps={{ danger: true }}
          >
            <Button type="text" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      )
    }
  ];

  const activeCarriers = carriers.filter(c => c.isActive);
  const connectedCarriers = carriers.filter(c => c.connectionStatus === 'connected');

  return (
    <div style={{ padding: 24 }}>
      <Row justify="space-between" align="middle" style={{ marginBottom: 24 }}>
        <Col>
          <Title level={2} style={{ margin: 0 }}>
            <TruckOutlined style={{ marginRight: 12 }} />
            Carrier Management
          </Title>
          <Text type="secondary">Configure shipping carriers and API integrations</Text>
        </Col>
        <Col>
          <Space>
            <Button icon={<ReloadOutlined />} onClick={loadCarriers}>
              Refresh
            </Button>
            <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
              Add Carrier
            </Button>
          </Space>
        </Col>
      </Row>

      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="Total Carriers"
              value={carriers.length}
              prefix={<TruckOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Active Carriers"
              value={activeCarriers.length}
              valueStyle={{ color: '#52c41a' }}
              prefix={<CheckCircleOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Connected"
              value={connectedCarriers.length}
              valueStyle={{ color: '#1890ff' }}
              prefix={<LinkOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Services Available"
              value={carriers.reduce((acc, c) => acc + c.services.length, 0)}
              prefix={<GlobalOutlined />}
            />
          </Card>
        </Col>
      </Row>

      <Card>
        <Tabs activeKey={activeTab} onChange={setActiveTab}>
          <TabPane tab="Carriers" key="carriers">
            <Table
              columns={columns}
              dataSource={carriers}
              rowKey="id"
              loading={loading}
              pagination={false}
            />
          </TabPane>
          <TabPane tab="Integration Guide" key="guide">
            <Alert
              message="Carrier API Integration"
              description="To integrate with a carrier, you'll need API credentials from the carrier's developer portal. Most carriers offer sandbox/test environments for development."
              type="info"
              showIcon
              style={{ marginBottom: 24 }}
            />

            <Row gutter={[24, 24]}>
              {CARRIER_TYPES.slice(0, 6).map(carrier => (
                <Col span={8} key={carrier.value}>
                  <Card
                    title={
                      <Space>
                        <TruckOutlined />
                        {carrier.label}
                      </Space>
                    }
                    size="small"
                  >
                    <Space direction="vertical" size="small">
                      <Text type="secondary">
                        {carrier.value === 'FEDEX' && 'Developer portal: developer.fedex.com'}
                        {carrier.value === 'UPS' && 'Developer portal: developer.ups.com'}
                        {carrier.value === 'DHL' && 'Developer portal: developer.dhl.com'}
                        {carrier.value === 'USPS' && 'Developer portal: developer.usps.com'}
                        {carrier.value === 'ARAMEX' && 'Developer portal: aramex.com/developers'}
                        {carrier.value === 'DPD' && 'Contact DPD for API access'}
                      </Text>
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        Required: API Key, Secret, Account Number
                      </Text>
                    </Space>
                  </Card>
                </Col>
              ))}
            </Row>
          </TabPane>
        </Tabs>
      </Card>

      <Modal
        title={editingCarrier ? 'Edit Carrier' : 'Add New Carrier'}
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => {
          setModalVisible(false);
          form.resetFields();
        }}
        width={800}
        okText={editingCarrier ? 'Update' : 'Create'}
      >
        <Form form={form} layout="vertical">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="name"
                label="Carrier Name"
                rules={[{ required: true, message: 'Please enter carrier name' }]}
              >
                <Input placeholder="e.g., FedEx Production" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="code"
                label="Carrier Code"
                rules={[{ required: true, message: 'Please enter carrier code' }]}
              >
                <Input placeholder="e.g., FEDEX_PROD" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="type"
                label="Carrier Type"
                rules={[{ required: true, message: 'Please select carrier type' }]}
              >
                <Select placeholder="Select carrier type">
                  {CARRIER_TYPES.map(type => (
                    <Option key={type.value} value={type.value}>
                      {type.label}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="labelFormat" label="Label Format">
                <Select>
                  <Option value="PDF">PDF</Option>
                  <Option value="ZPL">ZPL (Zebra)</Option>
                  <Option value="PNG">PNG</Option>
                  <Option value="EPL">EPL</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Divider>API Credentials</Divider>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="apiKey" label="API Key">
                <Input.Password placeholder="Enter API key" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="apiSecret" label="API Secret">
                <Input.Password placeholder="Enter API secret" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="accountNumber" label="Account Number">
                <Input placeholder="Enter account number" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="meterNumber" label="Meter Number (FedEx only)">
                <Input placeholder="Enter meter number" />
              </Form.Item>
            </Col>
          </Row>

          <Divider>Settings</Divider>

          <Row gutter={16}>
            <Col span={24}>
              <Form.Item name="trackingUrl" label="Tracking URL Template">
                <Input placeholder="https://carrier.com/track?num={tracking_number}" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="maxWeight" label="Max Weight (lbs)">
                <InputNumber style={{ width: '100%' }} min={0} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="testMode" label="Test Mode" valuePropName="checked">
                <Switch />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="isActive" label="Active" valuePropName="checked">
                <Switch />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="insuranceEnabled" label="Insurance Enabled" valuePropName="checked">
                <Switch />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="signatureRequired" label="Signature Required" valuePropName="checked">
                <Switch />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="services"
            label="Available Services"
          >
            <Select mode="multiple" placeholder="Select available services">
              {SERVICE_TYPES[form.getFieldValue('type') as keyof typeof SERVICE_TYPES]?.map(service => (
                <Option key={service} value={service}>{service}</Option>
              )) || SERVICE_TYPES.CUSTOM.map(service => (
                <Option key={service} value={service}>{service}</Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="supportedCountries"
            label="Supported Countries"
          >
            <Select mode="multiple" placeholder="Select supported countries">
              <Option value="US">United States</Option>
              <Option value="CA">Canada</Option>
              <Option value="MX">Mexico</Option>
              <Option value="GB">United Kingdom</Option>
              <Option value="DE">Germany</Option>
              <Option value="FR">France</Option>
              <Option value="ES">Spain</Option>
              <Option value="IT">Italy</Option>
              <Option value="NL">Netherlands</Option>
              <Option value="AE">UAE</Option>
              <Option value="SA">Saudi Arabia</Option>
              <Option value="AU">Australia</Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
