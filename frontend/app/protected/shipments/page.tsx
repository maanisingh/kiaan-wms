'use client';

import React, { useState, useEffect } from 'react';
import { Table, Button, Input, Select, Tag, Card, Modal, Form, message, Tabs, Tooltip, Space, Divider, Alert } from 'antd';
import { PlusOutlined, SearchOutlined, FilterOutlined, EyeOutlined, TruckOutlined, ClockCircleOutlined, CheckCircleOutlined, ReloadOutlined, SettingOutlined, ApiOutlined, PrinterOutlined } from '@ant-design/icons';
import { useModal } from '@/hooks/useModal';
import Link from 'next/link';
import { formatDate } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import apiService from '@/services/api';

const { Search } = Input;
const { Option } = Select;

// UK-focused carrier list
const UK_CARRIERS = [
  { value: 'royal_mail', label: 'Royal Mail', color: 'red' },
  { value: 'dpd', label: 'DPD UK', color: 'volcano' },
  { value: 'evri', label: 'Evri (Hermes)', color: 'orange' },
  { value: 'parcelforce', label: 'Parcelforce', color: 'gold' },
  { value: 'yodel', label: 'Yodel', color: 'lime' },
  { value: 'dhl', label: 'DHL Express', color: 'yellow' },
  { value: 'fedex', label: 'FedEx UK', color: 'purple' },
  { value: 'ups', label: 'UPS UK', color: 'brown' },
  { value: 'amazon', label: 'Amazon Logistics', color: 'geekblue' },
  { value: 'collect_plus', label: 'Collect+', color: 'cyan' },
];

export default function ShipmentManagementPage() {
  const [loading, setLoading] = useState(false);
  const [shipments, setShipments] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('all');
  const [carrierSettingsOpen, setCarrierSettingsOpen] = useState(false);
  const [carrierSettings, setCarrierSettings] = useState<any[]>([]);
  const [savingSettings, setSavingSettings] = useState(false);
  const addModal = useModal();
  const [form] = Form.useForm();
  const [settingsForm] = Form.useForm();
  const router = useRouter();

  // Fetch shipments
  const fetchShipments = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await apiService.get('/shipments');
      setShipments(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch shipments');
      message.error(err.message || 'Failed to fetch shipments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchShipments();
    fetchCarrierSettings();
  }, []);

  // Fetch carrier settings
  const fetchCarrierSettings = async () => {
    try {
      const data = await apiService.get('/shipping/carriers');
      setCarrierSettings(Array.isArray(data) ? data : []);
    } catch (err) {
      // Default empty if not available
      setCarrierSettings([]);
    }
  };

  // Save carrier settings
  const handleSaveCarrierSettings = async (values: any) => {
    try {
      setSavingSettings(true);
      await apiService.post('/shipping/carriers', values);
      message.success('Carrier settings saved successfully!');
      setCarrierSettingsOpen(false);
      settingsForm.resetFields();
      fetchCarrierSettings();
    } catch (err: any) {
      message.error(err.message || 'Failed to save carrier settings');
    } finally {
      setSavingSettings(false);
    }
  };

  // Get rate quotes from carrier
  const handleGetRates = async (shipmentId: string) => {
    try {
      message.loading('Getting shipping rates...');
      const rates = await apiService.post('/shipping/rates', { shipmentId });
      message.success(`Found ${rates?.length || 0} shipping rates`);
      // Could open a modal to show rates
    } catch (err: any) {
      message.error(err.message || 'Failed to get rates');
    }
  };

  // Create shipping label
  const handleCreateLabel = async (shipmentId: string, carrierId: string) => {
    try {
      message.loading('Creating shipping label...');
      const label = await apiService.post('/shipping/labels', { shipmentId, carrierId });
      message.success('Shipping label created!');
      // Could open label preview
      if (label?.labelUrl) {
        window.open(label.labelUrl, '_blank');
      }
    } catch (err: any) {
      message.error(err.message || 'Failed to create label');
    }
  };

  const handleSubmit = async (values: any) => {
    try {
      await apiService.post('/shipments', values);
      message.success('Shipment created successfully!');
      form.resetFields();
      addModal.close();
      fetchShipments();
    } catch (err: any) {
      message.error(err.message || 'Failed to create shipment');
    }
  };

  const allShipments = shipments;
  const pendingShipments = shipments.filter(s => s.status === 'pending');
  const inTransitShipments = shipments.filter(s => s.status === 'in_transit');
  const deliveredShipments = shipments.filter(s => s.status === 'delivered');

  const columns = [
    {
      title: 'Shipment #',
      dataIndex: 'shipmentNumber',
      key: 'shipmentNumber',
      width: 130,
      render: (text: string, record: any) => (
        <Link href={`/shipments/${record.id}`}>
          <span className="font-medium text-blue-600 cursor-pointer hover:underline">{text}</span>
        </Link>
      )
    },
    { title: 'Carrier', dataIndex: 'carrier', key: 'carrier', width: 100 },
    { title: 'Tracking', dataIndex: 'tracking', key: 'tracking', width: 180 },
    { title: 'Status', dataIndex: 'status', key: 'status', width: 120, render: (status: string) => <Tag color={status === 'delivered' ? 'green' : status === 'in_transit' ? 'blue' : 'orange'}>{status.replace('_', ' ')}</Tag> },
    { title: 'Orders', dataIndex: 'orders', key: 'orders', width: 80 },
    { title: 'Ship Date', dataIndex: 'shipDate', key: 'shipDate', width: 120, render: (date: string) => date ? formatDate(date) : '-' },
    { title: 'Destination', dataIndex: 'destination', key: 'destination', width: 200 },
    {
      title: 'Actions',
      key: 'actions',
      width: 120,
      render: (_: any, record: any) => (
        <Link href={`/shipments/${record.id}`}>
          <Button type="link" icon={<EyeOutlined />} size="small">View</Button>
        </Link>
      ),
    },
  ];

  const renderFiltersAndTable = (dataSource: any[]) => (
    <>
      <div className="flex flex-wrap gap-4 mb-4">
        <Search placeholder="Search shipments..." style={{ width: 300 }} prefix={<SearchOutlined />} />
        <Select placeholder="Carrier" style={{ width: 180 }} allowClear>
          {UK_CARRIERS.map(carrier => (
            <Option key={carrier.value} value={carrier.value}>{carrier.label}</Option>
          ))}
        </Select>
        <Button icon={<FilterOutlined />}>More Filters</Button>
        <Button icon={<ReloadOutlined />} onClick={fetchShipments}>
          Refresh
        </Button>
      </div>
      <Table
        columns={columns}
        dataSource={dataSource}
        rowKey="id"
        loading={loading}
        scroll={{ x: 1200 }}
        onRow={(record) => ({
          onClick: () => router.push(`/shipments/${record.id}`),
          style: { cursor: 'pointer' }
        })}
      />
    </>
  );

  const tabItems = [
    {
      key: 'all',
      label: <span className="flex items-center gap-2"><TruckOutlined />All Shipments ({allShipments.length})</span>,
      children: renderFiltersAndTable(allShipments),
    },
    {
      key: 'pending',
      label: <span className="flex items-center gap-2"><ClockCircleOutlined />Pending ({pendingShipments.length})</span>,
      children: renderFiltersAndTable(pendingShipments),
    },
    {
      key: 'in-transit',
      label: <span className="flex items-center gap-2"><TruckOutlined />In Transit ({inTransitShipments.length})</span>,
      children: renderFiltersAndTable(inTransitShipments),
    },
    {
      key: 'delivered',
      label: <span className="flex items-center gap-2"><CheckCircleOutlined />Delivered ({deliveredShipments.length})</span>,
      children: renderFiltersAndTable(deliveredShipments),
    },
  ];

  return (
    <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-green-600 to-teal-600 bg-clip-text text-transparent">
              Shipment Management
            </h1>
            <p className="text-gray-600 mt-1">Track and manage outbound shipments</p>
          </div>
          <Space>
            <Button icon={<SettingOutlined />} size="large" onClick={() => setCarrierSettingsOpen(true)}>
              Carrier Settings
            </Button>
            <Button type="primary" icon={<PlusOutlined />} size="large" onClick={addModal.open}>
              Create Shipment
            </Button>
          </Space>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <div className="text-center">
              <p className="text-gray-500 text-sm">In Transit</p>
              <p className="text-3xl font-bold text-blue-600">{inTransitShipments.length}</p>
            </div>
          </Card>
          <Card>
            <div className="text-center">
              <p className="text-gray-500 text-sm">Delivered Today</p>
              <p className="text-3xl font-bold text-green-600">{deliveredShipments.length}</p>
            </div>
          </Card>
          <Card>
            <div className="text-center">
              <p className="text-gray-500 text-sm">Pending Pickup</p>
              <p className="text-3xl font-bold text-orange-600">{pendingShipments.length}</p>
            </div>
          </Card>
          <Card>
            <div className="text-center">
              <p className="text-gray-500 text-sm">Total</p>
              <p className="text-3xl font-bold text-purple-600">{allShipments.length}</p>
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

        {/* Create Shipment Modal */}
        <Modal
          title="Create Shipment"
          open={addModal.isOpen}
          onCancel={addModal.close}
          onOk={() => form.submit()}
          width={700}
        >
          <Form form={form} layout="vertical" onFinish={handleSubmit}>
            <Form.Item label="Carrier" name="carrier" rules={[{ required: true, message: 'Please select a carrier' }]}>
              <Select placeholder="Select UK carrier">
                {UK_CARRIERS.map(carrier => (
                  <Option key={carrier.value} value={carrier.value}>
                    <Tag color={carrier.color} className="mr-2">{carrier.label}</Tag>
                  </Option>
                ))}
              </Select>
            </Form.Item>
            <Form.Item label="Tracking Number" name="tracking">
              <Input placeholder="Enter tracking number (or leave blank to auto-generate)" />
            </Form.Item>
            <Form.Item label="Recipient Name" name="recipientName" rules={[{ required: true }]}>
              <Input placeholder="Enter recipient name" />
            </Form.Item>
            <Form.Item label="Delivery Address" name="destination" rules={[{ required: true }]}>
              <Input.TextArea placeholder="Enter full UK delivery address" rows={3} />
            </Form.Item>
            <Form.Item label="Postcode" name="postcode" rules={[{ required: true }]}>
              <Input placeholder="e.g., SW1A 1AA" style={{ width: 200 }} />
            </Form.Item>
            <Form.Item label="Service Type" name="serviceType">
              <Select placeholder="Select service type">
                <Option value="standard">Standard Delivery (2-3 days)</Option>
                <Option value="express">Express (Next Day)</Option>
                <Option value="economy">Economy (3-5 days)</Option>
                <Option value="tracked">Tracked & Signed</Option>
              </Select>
            </Form.Item>
          </Form>
        </Modal>

        {/* Carrier Settings Modal */}
        <Modal
          title={<><ApiOutlined className="mr-2" />Carrier API Settings</>}
          open={carrierSettingsOpen}
          onCancel={() => {
            setCarrierSettingsOpen(false);
            settingsForm.resetFields();
          }}
          onOk={() => settingsForm.submit()}
          confirmLoading={savingSettings}
          width={700}
        >
          <Alert
            message="Configure your carrier API credentials"
            description="Enter API keys for each carrier you want to use. These are stored securely and used for generating shipping labels and tracking."
            type="info"
            showIcon
            className="mb-4"
          />
          <Form form={settingsForm} layout="vertical" onFinish={handleSaveCarrierSettings}>
            <Form.Item label="Select Carrier" name="carrierId" rules={[{ required: true }]}>
              <Select placeholder="Select carrier to configure">
                {UK_CARRIERS.map(carrier => (
                  <Option key={carrier.value} value={carrier.value}>
                    <Tag color={carrier.color} className="mr-2">{carrier.label}</Tag>
                  </Option>
                ))}
              </Select>
            </Form.Item>
            <Form.Item label="API Key" name="apiKey" rules={[{ required: true }]}>
              <Input.Password placeholder="Enter carrier API key" />
            </Form.Item>
            <Form.Item label="API Secret" name="apiSecret">
              <Input.Password placeholder="Enter API secret (if required)" />
            </Form.Item>
            <Form.Item label="Account Number" name="accountNumber">
              <Input placeholder="Enter carrier account number" />
            </Form.Item>
            <Form.Item label="Sandbox Mode" name="sandboxMode" valuePropName="checked">
              <Select defaultValue={false} style={{ width: 200 }}>
                <Option value={false}>Production (Live)</Option>
                <Option value={true}>Sandbox (Testing)</Option>
              </Select>
            </Form.Item>
            <Divider />
            <div className="text-sm text-gray-500">
              <p className="font-medium mb-2">Configured Carriers:</p>
              {carrierSettings.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {carrierSettings.map((s: any) => {
                    const carrier = UK_CARRIERS.find(c => c.value === s.carrierId);
                    return (
                      <Tag key={s.carrierId} color={carrier?.color || 'default'}>
                        {carrier?.label || s.carrierId} ✓
                      </Tag>
                    );
                  })}
                </div>
              ) : (
                <p className="text-gray-400">No carriers configured yet</p>
              )}
            </div>
          </Form>
        </Modal>
      </div>
    );
}
