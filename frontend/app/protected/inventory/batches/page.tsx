'use client';

import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Tag,
  Button,
  Space,
  Modal,
  Form,
  Input,
  InputNumber,
  DatePicker,
  Select,
  message,
  Tabs,
  Badge,
  Statistic,
  Row,
  Col,
  Tooltip,
  Drawer,
  Timeline,
  Descriptions,
} from 'antd';
import {
  PlusOutlined,
  ReloadOutlined,
  EyeOutlined,
  EditOutlined,
  FilterOutlined,
  BoxPlotOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  WarningOutlined,
  StopOutlined,
  BugOutlined,
} from '@ant-design/icons';
import { useAuthStore } from '@/store/authStore';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import apiService from '@/services/api';

dayjs.extend(relativeTime);

const { Option } = Select;

interface Batch {
  id: string;
  batchNumber: string;
  productId: string;
  product: any;
  locationId: string;
  location: any;
  quantity: number;
  availableQuantity: number;
  receivedDate: string;
  expiryDate?: string;
  manufacturingDate?: string;
  unitCost: number;
  supplier?: string;
  status: string;
  createdAt: string;
  movements?: any[];
}

export default function BatchesPage() {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [filteredBatches, setFilteredBatches] = useState<Batch[]>([]);
  const [activeTab, setActiveTab] = useState('all');
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [detailsDrawerVisible, setDetailsDrawerVisible] = useState(false);
  const [selectedBatch, setSelectedBatch] = useState<Batch | null>(null);
  const [allocationModalVisible, setAllocationModalVisible] = useState(false);
  const [allocationMethod, setAllocationMethod] = useState<'FIFO' | 'LIFO' | 'FEFO'>('FIFO');
  const [form] = Form.useForm();
  const [allocationForm] = Form.useForm();

  // Fetch batches
  const fetchBatches = async (status?: string) => {
    setLoading(true);
    try {
      const url = status ? `/inventory/batches?status=${status}` : '/inventory/batches';
      const data = await apiService.get(url);
      setBatches(Array.isArray(data) ? data : []);
      setFilteredBatches(Array.isArray(data) ? data : []);
    } catch (error: any) {
      console.error('Fetch batches error:', error);
      message.error(error.message || 'Error loading batches');
    } finally {
      setLoading(false);
    }
  };

  // Fetch batch details with movements
  const fetchBatchDetails = async (batchId: string) => {
    try {
      const data = await apiService.get(`/inventory/batches/${batchId}`);
      setSelectedBatch(data);
      setDetailsDrawerVisible(true);
    } catch (error: any) {
      console.error('Fetch batch details error:', error);
      message.error(error.message || 'Error loading batch details');
    }
  };

  useEffect(() => {
    fetchBatches();
  }, []);

  // Apply filters
  useEffect(() => {
    let filtered = [...batches];

    if (activeTab !== 'all') {
      filtered = filtered.filter(b => b.status === activeTab.toUpperCase());
    }

    setFilteredBatches(filtered);
  }, [batches, activeTab]);

  // Create new batch
  const handleCreateBatch = async (values: any) => {
    try {
      const payload = {
        ...values,
        receivedDate: values.receivedDate?.toISOString(),
        expiryDate: values.expiryDate?.toISOString(),
        manufacturingDate: values.manufacturingDate?.toISOString(),
      };

      await apiService.post('/inventory/batches', payload);
      message.success('Batch created successfully');
      form.resetFields();
      setCreateModalVisible(false);
      fetchBatches();
    } catch (error: any) {
      console.error('Create batch error:', error);
      message.error(error.response?.data?.error || error.message || 'Failed to create batch');
    }
  };

  // Allocate inventory
  const handleAllocate = async (values: any) => {
    try {
      const endpoint = allocationMethod === 'FIFO'
        ? '/inventory/batches/allocate-fifo'
        : allocationMethod === 'LIFO'
        ? '/inventory/batches/allocate-lifo'
        : '/inventory/batches/allocate-fefo';

      const result = await apiService.post(endpoint, values);
      message.success(`Allocated ${result.totalAllocated} units using ${result.method}`);
      allocationForm.resetFields();
      setAllocationModalVisible(false);
      fetchBatches();

      // Show allocation details
      Modal.info({
        title: `${result.method} Allocation Result`,
        content: (
          <div>
            <p><strong>Total Allocated:</strong> {result.totalAllocated} units</p>
            <p><strong>Number of Batches:</strong> {result.allocations.length}</p>
            <div className="mt-4">
              <strong>Allocation Details:</strong>
              <ul className="mt-2">
                {result.allocations.map((alloc: any, index: number) => (
                  <li key={index}>
                    Batch {alloc.batchNumber}: {alloc.quantity} units
                    {alloc.expiryDate && ` (Expires: ${dayjs(alloc.expiryDate).format('MMM DD, YYYY')})`}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ),
        width: 600,
      });
    } catch (error: any) {
      console.error('Allocate error:', error);
      message.error(error.response?.data?.error || error.message || 'Failed to allocate inventory');
    }
  };

  // Update batch status
  const handleUpdateStatus = async (batchId: string, newStatus: string) => {
    try {
      await apiService.patch(`/inventory/batches/${batchId}/status`, { status: newStatus });
      message.success('Batch status updated successfully');
      fetchBatches();
    } catch (error: any) {
      console.error('Update status error:', error);
      message.error(error.message || 'Error updating batch status');
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      ACTIVE: 'green',
      DEPLETED: 'default',
      EXPIRED: 'red',
      QUARANTINED: 'orange',
      DAMAGED: 'volcano',
    };
    return colors[status] || 'default';
  };

  const getStatusIcon = (status: string) => {
    const icons: Record<string, any> = {
      ACTIVE: <CheckCircleOutlined />,
      DEPLETED: <StopOutlined />,
      EXPIRED: <ExclamationCircleOutlined />,
      QUARANTINED: <WarningOutlined />,
      DAMAGED: <BugOutlined />,
    };
    return icons[status] || <ClockCircleOutlined />;
  };

  // Statistics
  const stats = {
    total: batches.length,
    active: batches.filter(b => b.status === 'ACTIVE').length,
    depleted: batches.filter(b => b.status === 'DEPLETED').length,
    expired: batches.filter(b => b.status === 'EXPIRED').length,
    quarantined: batches.filter(b => b.status === 'QUARANTINED').length,
    totalQuantity: batches.reduce((sum, b) => sum + b.quantity, 0),
    availableQuantity: batches.reduce((sum, b) => sum + b.availableQuantity, 0),
  };

  // Table columns
  const columns = [
    {
      title: 'Batch Number',
      dataIndex: 'batchNumber',
      key: 'batchNumber',
      fixed: 'left' as const,
      width: 150,
      render: (text: string, record: Batch) => (
        <Button type="link" onClick={() => fetchBatchDetails(record.id)}>
          {text}
        </Button>
      ),
    },
    {
      title: 'Product',
      dataIndex: 'product',
      key: 'product',
      width: 200,
      render: (product: any) => (
        <div>
          <div className="font-medium">{product?.name || 'Unknown'}</div>
          <div className="text-xs text-gray-500">SKU: {product?.sku || 'N/A'}</div>
        </div>
      ),
    },
    {
      title: 'Location',
      dataIndex: 'location',
      key: 'location',
      width: 120,
      render: (location: any) =>
        location ? `${location.aisle}-${location.rack}-${location.bin}` : 'N/A',
    },
    {
      title: 'Quantity',
      key: 'quantity',
      width: 150,
      render: (record: Batch) => (
        <div>
          <div className="font-bold text-green-600">
            {record.availableQuantity} / {record.quantity}
          </div>
          <div className="text-xs text-gray-500">Available / Total</div>
        </div>
      ),
      sorter: (a: Batch, b: Batch) => a.availableQuantity - b.availableQuantity,
    },
    {
      title: 'Received Date',
      dataIndex: 'receivedDate',
      key: 'receivedDate',
      width: 130,
      render: (date: string) => dayjs(date).format('MMM DD, YYYY'),
      sorter: (a: Batch, b: Batch) =>
        new Date(a.receivedDate).getTime() - new Date(b.receivedDate).getTime(),
    },
    {
      title: 'Expiry Date',
      dataIndex: 'expiryDate',
      key: 'expiryDate',
      width: 150,
      render: (date: string) => {
        if (!date) return <Tag>No Expiry</Tag>;
        const daysUntilExpiry = Math.floor(
          (new Date(date).getTime() - Date.now()) / (24 * 60 * 60 * 1000)
        );
        return (
          <div>
            <div>{dayjs(date).format('MMM DD, YYYY')}</div>
            <Tag
              color={
                daysUntilExpiry < 0
                  ? 'red'
                  : daysUntilExpiry < 30
                  ? 'orange'
                  : daysUntilExpiry < 90
                  ? 'gold'
                  : 'green'
              }
            >
              {daysUntilExpiry < 0
                ? 'Expired'
                : `${daysUntilExpiry} days`}
            </Tag>
          </div>
        );
      },
      sorter: (a: Batch, b: Batch) => {
        if (!a.expiryDate && !b.expiryDate) return 0;
        if (!a.expiryDate) return 1;
        if (!b.expiryDate) return -1;
        return new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime();
      },
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 130,
      render: (status: string) => (
        <Tag icon={getStatusIcon(status)} color={getStatusColor(status)}>
          {status}
        </Tag>
      ),
    },
    {
      title: 'Unit Cost',
      dataIndex: 'unitCost',
      key: 'unitCost',
      width: 100,
      render: (cost: number) => `$${cost.toFixed(2)}`,
    },
    {
      title: 'Actions',
      key: 'actions',
      fixed: 'right' as const,
      width: 200,
      render: (record: Batch) => (
        <Space>
          <Tooltip title="View Details">
            <Button
              type="text"
              icon={<EyeOutlined />}
              onClick={() => fetchBatchDetails(record.id)}
            />
          </Tooltip>
          <Select
            placeholder="Update Status"
            style={{ width: 120 }}
            size="small"
            value={record.status}
            onChange={(value) => handleUpdateStatus(record.id, value)}
          >
            <Option value="ACTIVE">Active</Option>
            <Option value="DEPLETED">Depleted</Option>
            <Option value="EXPIRED">Expired</Option>
            <Option value="QUARANTINED">Quarantine</Option>
            <Option value="DAMAGED">Damaged</Option>
          </Select>
        </Space>
      ),
    },
  ];

  const tabItems = [
    {
      key: 'all',
      label: (
        <span>
          All Batches
          <Badge count={stats.total} style={{ marginLeft: 8, backgroundColor: '#52c41a' }} />
        </span>
      ),
    },
    {
      key: 'active',
      label: (
        <span>
          Active
          <Badge count={stats.active} style={{ marginLeft: 8, backgroundColor: '#52c41a' }} />
        </span>
      ),
    },
    {
      key: 'depleted',
      label: (
        <span>
          Depleted
          <Badge count={stats.depleted} style={{ marginLeft: 8 }} />
        </span>
      ),
    },
    {
      key: 'expired',
      label: (
        <span>
          Expired
          <Badge count={stats.expired} style={{ marginLeft: 8, backgroundColor: '#ff4d4f' }} />
        </span>
      ),
    },
    {
      key: 'quarantined',
      label: (
        <span>
          Quarantined
          <Badge count={stats.quarantined} style={{ marginLeft: 8, backgroundColor: '#faad14' }} />
        </span>
      ),
    },
  ];

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
              <BoxPlotOutlined className="text-blue-600" />
              Batch/Lot Management
            </h1>
            <p className="text-gray-600 mt-1">Track inventory batches with FIFO/LIFO/FEFO allocation</p>
          </div>
          <Space>
            <Button icon={<ReloadOutlined />} onClick={() => fetchBatches()}>
              Refresh
            </Button>
            <Button
              type="default"
              onClick={() => setAllocationModalVisible(true)}
            >
              Allocate Inventory
            </Button>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => setCreateModalVisible(true)}>
              Create Batch
            </Button>
          </Space>
        </div>
      </div>

      {/* KPI Statistics */}
      <Row gutter={[16, 16]} className="mb-6">
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Total Batches"
              value={stats.total}
              prefix={<BoxPlotOutlined className="text-blue-600" />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Active Batches"
              value={stats.active}
              prefix={<CheckCircleOutlined className="text-green-600" />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Total Quantity"
              value={stats.totalQuantity}
              suffix="units"
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Available Quantity"
              value={stats.availableQuantity}
              suffix="units"
              valueStyle={{ color: '#3f8600' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Batches Table */}
      <Card>
        <Tabs activeKey={activeTab} onChange={setActiveTab} items={tabItems} className="mb-4" />

        <Table
          dataSource={filteredBatches}
          columns={columns}
          rowKey="id"
          loading={loading}
          scroll={{ x: 1400 }}
          pagination={{
            pageSize: 20,
            showSizeChanger: true,
            showTotal: (total) => `Total ${total} batches`,
          }}
        />
      </Card>

      {/* Create Batch Modal */}
      <Modal
        title="Create New Batch"
        open={createModalVisible}
        onCancel={() => setCreateModalVisible(false)}
        onOk={() => form.submit()}
        width={600}
      >
        <Form form={form} layout="vertical" onFinish={handleCreateBatch}>
          <Form.Item
            name="batchNumber"
            label="Batch Number"
            rules={[{ required: true, message: 'Please enter batch number' }]}
          >
            <Input placeholder="e.g., BATCH-2025-001" />
          </Form.Item>

          <Form.Item
            name="productId"
            label="Product ID"
            rules={[{ required: true, message: 'Please enter product ID' }]}
          >
            <Input placeholder="Product UUID" />
          </Form.Item>

          <Form.Item
            name="locationId"
            label="Location ID"
            rules={[{ required: true, message: 'Please enter location ID' }]}
          >
            <Input placeholder="Location UUID" />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="quantity"
                label="Quantity"
                rules={[{ required: true, message: 'Please enter quantity' }]}
              >
                <InputNumber min={1} style={{ width: '100%' }} placeholder="Units" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="unitCost" label="Unit Cost">
                <InputNumber min={0} step={0.01} style={{ width: '100%' }} prefix="$" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="receivedDate" label="Received Date">
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="expiryDate" label="Expiry Date">
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="manufacturingDate" label="Manufacturing Date">
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item name="supplier" label="Supplier">
            <Input placeholder="Supplier name" />
          </Form.Item>
        </Form>
      </Modal>

      {/* Allocation Modal */}
      <Modal
        title="Allocate Inventory"
        open={allocationModalVisible}
        onCancel={() => setAllocationModalVisible(false)}
        onOk={() => allocationForm.submit()}
        width={500}
      >
        <Form form={allocationForm} layout="vertical" onFinish={handleAllocate}>
          <Form.Item
            name="allocationMethod"
            label="Allocation Method"
            initialValue="FIFO"
            rules={[{ required: true }]}
          >
            <Select onChange={(value) => setAllocationMethod(value)}>
              <Option value="FIFO">
                <span>
                  <strong>FIFO</strong> - First In, First Out (Oldest batches first)
                </span>
              </Option>
              <Option value="LIFO">
                <span>
                  <strong>LIFO</strong> - Last In, First Out (Newest batches first)
                </span>
              </Option>
              <Option value="FEFO">
                <span>
                  <strong>FEFO</strong> - First Expired, First Out (Earliest expiry first)
                </span>
              </Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="productId"
            label="Product ID"
            rules={[{ required: true, message: 'Please enter product ID' }]}
          >
            <Input placeholder="Product UUID" />
          </Form.Item>

          <Form.Item name="locationId" label="Location ID (Optional)">
            <Input placeholder="Filter by location" />
          </Form.Item>

          <Form.Item
            name="quantityNeeded"
            label="Quantity Needed"
            rules={[{ required: true, message: 'Please enter quantity' }]}
          >
            <InputNumber min={1} style={{ width: '100%' }} placeholder="Units to allocate" />
          </Form.Item>
        </Form>
      </Modal>

      {/* Batch Details Drawer */}
      <Drawer
        title="Batch Details"
        open={detailsDrawerVisible}
        onClose={() => setDetailsDrawerVisible(false)}
        width={700}
      >
        {selectedBatch && (
          <div>
            <Descriptions bordered column={2}>
              <Descriptions.Item label="Batch Number" span={2}>
                <strong>{selectedBatch.batchNumber}</strong>
              </Descriptions.Item>
              <Descriptions.Item label="Product">
                {selectedBatch.product?.name || 'Unknown'}
              </Descriptions.Item>
              <Descriptions.Item label="SKU">
                {selectedBatch.product?.sku || 'N/A'}
              </Descriptions.Item>
              <Descriptions.Item label="Location">
                {selectedBatch.location
                  ? `${selectedBatch.location.aisle}-${selectedBatch.location.rack}-${selectedBatch.location.bin}`
                  : 'N/A'}
              </Descriptions.Item>
              <Descriptions.Item label="Status">
                <Tag icon={getStatusIcon(selectedBatch.status)} color={getStatusColor(selectedBatch.status)}>
                  {selectedBatch.status}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Quantity">{selectedBatch.quantity}</Descriptions.Item>
              <Descriptions.Item label="Available">
                <strong className="text-green-600">{selectedBatch.availableQuantity}</strong>
              </Descriptions.Item>
              <Descriptions.Item label="Received">
                {dayjs(selectedBatch.receivedDate).format('MMM DD, YYYY')}
              </Descriptions.Item>
              <Descriptions.Item label="Expiry">
                {selectedBatch.expiryDate
                  ? dayjs(selectedBatch.expiryDate).format('MMM DD, YYYY')
                  : 'No Expiry'}
              </Descriptions.Item>
              <Descriptions.Item label="Unit Cost">${selectedBatch.unitCost.toFixed(2)}</Descriptions.Item>
              <Descriptions.Item label="Supplier">{selectedBatch.supplier || 'N/A'}</Descriptions.Item>
            </Descriptions>

            {selectedBatch.movements && selectedBatch.movements.length > 0 && (
              <div className="mt-6">
                <h3 className="text-lg font-semibold mb-4">Movement History</h3>
                <Timeline
                  items={selectedBatch.movements.map((movement: any) => ({
                    children: (
                      <div>
                        <div className="font-medium">{movement.type}</div>
                        <div className="text-sm text-gray-600">
                          Quantity: {movement.quantity} units
                        </div>
                        <div className="text-xs text-gray-500">
                          {dayjs(movement.createdAt).format('MMM DD, YYYY HH:mm')}
                        </div>
                      </div>
                    ),
                  }))}
                />
              </div>
            )}
          </div>
        )}
      </Drawer>
    </div>
  );
}
