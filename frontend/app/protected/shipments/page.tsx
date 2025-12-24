'use client';

import React, { useState, useEffect } from 'react';
import { Table, Button, Input, Select, Tag, Card, Modal, Form, message, Tabs, Tooltip, Space, Divider, Alert, Checkbox, Badge } from 'antd';
import { PlusOutlined, SearchOutlined, FilterOutlined, EyeOutlined, TruckOutlined, ClockCircleOutlined, CheckCircleOutlined, ReloadOutlined, SettingOutlined, ApiOutlined, PrinterOutlined, SendOutlined, ShoppingCartOutlined } from '@ant-design/icons';
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

interface ReadyOrder {
  id: string;
  orderNumber: string;
  customer: {
    id: string;
    name: string;
    email?: string;
    phone?: string;
  };
  shippingAddress: string;
  city: string;
  postcode: string;
  country: string;
  status: string;
  priority: string;
  totalAmount: number;
  itemCount: number;
  skuCount: number;
  weight: number;
  packingNumber: string;
  packingStatus: string;
  packedAt?: string;
  createdAt: string;
}

export default function ShipmentManagementPage() {
  const [loading, setLoading] = useState(false);
  const [shipments, setShipments] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('all');
  const [carrierSettingsOpen, setCarrierSettingsOpen] = useState(false);
  const [carrierSettings, setCarrierSettings] = useState<any[]>([]);
  const [savingSettings, setSavingSettings] = useState(false);
  const [batchModalOpen, setBatchModalOpen] = useState(false);
  const [readyOrders, setReadyOrders] = useState<ReadyOrder[]>([]);
  const [selectedOrderIds, setSelectedOrderIds] = useState<string[]>([]);
  const [loadingReadyOrders, setLoadingReadyOrders] = useState(false);
  const [creatingBatch, setCreatingBatch] = useState(false);
  const addModal = useModal();
  const [form] = Form.useForm();
  const [settingsForm] = Form.useForm();
  const [batchForm] = Form.useForm();
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

  // Fetch orders ready for shipping
  const fetchReadyOrders = async () => {
    try {
      setLoadingReadyOrders(true);
      const data = await apiService.get('/shipments/ready-orders');
      setReadyOrders(Array.isArray(data) ? data : []);
    } catch (err: any) {
      message.error(err.message || 'Failed to fetch ready orders');
      setReadyOrders([]);
    } finally {
      setLoadingReadyOrders(false);
    }
  };

  // Open batch shipping modal
  const openBatchModal = async () => {
    setBatchModalOpen(true);
    setSelectedOrderIds([]);
    batchForm.resetFields();
    await fetchReadyOrders();
  };

  // Create batch shipment and generate labels
  const handleCreateBatchShipment = async (values: any) => {
    if (selectedOrderIds.length === 0) {
      message.error('Please select at least one order');
      return;
    }

    try {
      setCreatingBatch(true);

      // First create the batch shipment
      const shipmentResult = await apiService.post('/shipments/batch', {
        orderIds: selectedOrderIds,
        carrier: values.carrier,
        serviceType: values.serviceType,
        notes: values.notes
      });

      // Then generate labels for all orders
      const labelsResult = await apiService.post('/shipping/labels/batch', {
        orderIds: selectedOrderIds,
        carrier: values.carrier,
        serviceType: values.serviceType
      });

      if (labelsResult.labels && labelsResult.labels.length > 0) {
        // Show success with tracking numbers
        Modal.success({
          title: 'Shipment Created & Labels Generated',
          width: 600,
          content: (
            <div className="mt-4">
              <p className="mb-4">Successfully created shipment with {labelsResult.labels.length} orders.</p>
              <Table
                dataSource={labelsResult.labels}
                size="small"
                pagination={false}
                columns={[
                  { title: 'Order', dataIndex: 'orderNumber', key: 'orderNumber' },
                  { title: 'Customer', dataIndex: 'customer', key: 'customer' },
                  { title: 'Tracking', dataIndex: 'trackingNumber', key: 'trackingNumber', render: (t: string) => <span className="font-mono text-xs">{t}</span> },
                ]}
              />
              <p className="mt-4 text-gray-500 text-sm">
                Note: Configure carrier API credentials in settings to generate actual shipping labels.
              </p>
            </div>
          )
        });
      } else {
        message.success(shipmentResult.message || `Batch shipment created with ${selectedOrderIds.length} orders!`);
      }

      setBatchModalOpen(false);
      setSelectedOrderIds([]);
      batchForm.resetFields();
      fetchShipments();
    } catch (err: any) {
      message.error(err.message || 'Failed to create batch shipment');
    } finally {
      setCreatingBatch(false);
    }
  };

  // Toggle order selection
  const toggleOrderSelection = (orderId: string) => {
    setSelectedOrderIds(prev =>
      prev.includes(orderId)
        ? prev.filter(id => id !== orderId)
        : [...prev, orderId]
    );
  };

  // Select all orders
  const selectAllOrders = () => {
    if (selectedOrderIds.length === readyOrders.length) {
      setSelectedOrderIds([]);
    } else {
      setSelectedOrderIds(readyOrders.map(o => o.id));
    }
  };

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
        <Link href={`/protected/shipments/${record.id}`}>
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
        <Link href={`/protected/shipments/${record.id}`}>
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
          onClick: () => router.push(`/protected/shipments/${record.id}`),
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
            <Badge count={readyOrders.length} offset={[-5, 5]}>
              <Button type="primary" icon={<SendOutlined />} size="large" onClick={openBatchModal}>
                Batch Ship Orders
              </Button>
            </Badge>
            <Button icon={<PlusOutlined />} size="large" onClick={addModal.open}>
              Single Shipment
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

        {/* Batch Shipping Modal */}
        <Modal
          title={
            <div className="flex items-center gap-2">
              <SendOutlined className="text-blue-500" />
              <span>Batch Ship Orders</span>
              {selectedOrderIds.length > 0 && (
                <Tag color="blue">{selectedOrderIds.length} selected</Tag>
              )}
            </div>
          }
          open={batchModalOpen}
          onCancel={() => {
            setBatchModalOpen(false);
            setSelectedOrderIds([]);
            batchForm.resetFields();
          }}
          width={1000}
          footer={null}
        >
          <div className="space-y-4">
            <Alert
              message="Select orders to ship together"
              description="Choose the orders you want to ship in this batch. Labels will be generated for each order using the selected carrier."
              type="info"
              showIcon
            />

            <Form form={batchForm} layout="vertical" onFinish={handleCreateBatchShipment}>
              <div className="grid grid-cols-3 gap-4 mb-4">
                <Form.Item label="Carrier" name="carrier" rules={[{ required: true, message: 'Please select a carrier' }]}>
                  <Select placeholder="Select carrier" size="large">
                    {UK_CARRIERS.map(carrier => (
                      <Option key={carrier.value} value={carrier.value}>
                        <Tag color={carrier.color}>{carrier.label}</Tag>
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
                <Form.Item label="Service Type" name="serviceType" initialValue="standard">
                  <Select size="large">
                    <Option value="standard">Standard (2-3 days)</Option>
                    <Option value="express">Express (Next Day)</Option>
                    <Option value="economy">Economy (3-5 days)</Option>
                    <Option value="tracked">Tracked & Signed</Option>
                  </Select>
                </Form.Item>
                <Form.Item label="Notes" name="notes">
                  <Input placeholder="Optional batch notes" size="large" />
                </Form.Item>
              </div>

              <div className="flex justify-between items-center mb-2">
                <Checkbox
                  checked={selectedOrderIds.length === readyOrders.length && readyOrders.length > 0}
                  indeterminate={selectedOrderIds.length > 0 && selectedOrderIds.length < readyOrders.length}
                  onChange={selectAllOrders}
                >
                  Select All ({readyOrders.length} orders ready)
                </Checkbox>
                <Button icon={<ReloadOutlined />} onClick={fetchReadyOrders} loading={loadingReadyOrders}>
                  Refresh
                </Button>
              </div>

              <Table
                dataSource={readyOrders}
                rowKey="id"
                loading={loadingReadyOrders}
                size="small"
                scroll={{ y: 400 }}
                pagination={false}
                rowSelection={{
                  selectedRowKeys: selectedOrderIds,
                  onChange: (keys) => setSelectedOrderIds(keys as string[]),
                }}
                columns={[
                  {
                    title: 'Order',
                    dataIndex: 'orderNumber',
                    key: 'orderNumber',
                    width: 120,
                    render: (text: string) => <span className="font-medium text-blue-600">{text}</span>
                  },
                  {
                    title: 'Customer',
                    dataIndex: 'customer',
                    key: 'customer',
                    width: 150,
                    render: (customer: any) => customer?.name || 'Unknown'
                  },
                  {
                    title: 'Address',
                    key: 'address',
                    width: 200,
                    render: (_: any, record: ReadyOrder) => (
                      <span className="text-xs text-gray-600">
                        {record.shippingAddress ? record.shippingAddress.substring(0, 40) : 'No address'}...
                      </span>
                    )
                  },
                  {
                    title: 'Postcode',
                    dataIndex: 'postcode',
                    key: 'postcode',
                    width: 80,
                  },
                  {
                    title: 'Items',
                    dataIndex: 'itemCount',
                    key: 'itemCount',
                    width: 60,
                    render: (count: number) => <Tag>{count}</Tag>
                  },
                  {
                    title: 'Weight',
                    dataIndex: 'weight',
                    key: 'weight',
                    width: 80,
                    render: (weight: number) => `${(weight || 0).toFixed(1)} kg`
                  },
                  {
                    title: 'Value',
                    dataIndex: 'totalAmount',
                    key: 'totalAmount',
                    width: 80,
                    render: (amount: number) => `£${(amount || 0).toFixed(2)}`
                  },
                  {
                    title: 'Pack #',
                    dataIndex: 'packingNumber',
                    key: 'packingNumber',
                    width: 100,
                    render: (text: string) => <span className="font-mono text-xs">{text}</span>
                  },
                  {
                    title: 'Priority',
                    dataIndex: 'priority',
                    key: 'priority',
                    width: 80,
                    render: (priority: string) => (
                      <Tag color={priority === 'HIGH' ? 'red' : priority === 'LOW' ? 'blue' : 'orange'}>
                        {priority}
                      </Tag>
                    )
                  }
                ]}
              />

              {readyOrders.length === 0 && !loadingReadyOrders && (
                <Alert
                  message="No orders ready for shipping"
                  description="Complete packing for orders to make them available for shipping."
                  type="warning"
                  showIcon
                  className="mt-4"
                />
              )}

              <Divider />

              <div className="flex justify-between items-center">
                <div>
                  <span className="text-gray-500">
                    {selectedOrderIds.length} orders selected
                    {selectedOrderIds.length > 0 && (
                      <span className="ml-2">
                        | Total weight: {readyOrders.filter(o => selectedOrderIds.includes(o.id)).reduce((sum, o) => sum + (o.weight || 0), 0).toFixed(1)} kg
                        | Total value: £{readyOrders.filter(o => selectedOrderIds.includes(o.id)).reduce((sum, o) => sum + (o.totalAmount || 0), 0).toFixed(2)}
                      </span>
                    )}
                  </span>
                </div>
                <Space>
                  <Button onClick={() => setBatchModalOpen(false)}>Cancel</Button>
                  <Button
                    type="primary"
                    htmlType="submit"
                    icon={<PrinterOutlined />}
                    loading={creatingBatch}
                    disabled={selectedOrderIds.length === 0}
                  >
                    Create Shipment & Generate Labels ({selectedOrderIds.length})
                  </Button>
                </Space>
              </div>
            </Form>
          </div>
        </Modal>
      </div>
    );
}
