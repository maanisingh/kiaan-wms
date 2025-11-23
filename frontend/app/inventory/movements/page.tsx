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
  Select,
  message,
  Tabs,
  Badge,
  Statistic,
  Row,
  Col,
  DatePicker,
  Timeline,
} from 'antd';
import {
  PlusOutlined,
  ReloadOutlined,
  EyeOutlined,
  SwapOutlined,
  ArrowRightOutlined,
  InboxOutlined,
  CarOutlined,
  DatabaseOutlined,
  FilterOutlined,
} from '@ant-design/icons';
import { useAuthStore } from '@/store/authStore';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);

const { Option } = Select;
const { RangePicker } = DatePicker;

interface Movement {
  id: string;
  type: string;
  productId: string;
  product: any;
  batchId?: string;
  batch?: any;
  fromLocationId?: string;
  fromLocation?: any;
  toLocationId?: string;
  toLocation?: any;
  quantity: number;
  reason?: string;
  notes?: string;
  userId: string;
  user: any;
  createdAt: string;
}

export default function InventoryMovementsPage() {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [movements, setMovements] = useState<Movement[]>([]);
  const [filteredMovements, setFilteredMovements] = useState<Movement[]>([]);
  const [activeTab, setActiveTab] = useState('all');
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [productHistoryVisible, setProductHistoryVisible] = useState(false);
  const [selectedProductMovements, setSelectedProductMovements] = useState<Movement[]>([]);
  const [form] = Form.useForm();
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs | null, dayjs.Dayjs | null]>([null, null]);
  const [typeFilter, setTypeFilter] = useState<string>('all');

  // Fetch movements
  const fetchMovements = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      let url = '/api/inventory/movements?limit=100';

      if (dateRange[0] && dateRange[1]) {
        url += `&startDate=${dateRange[0].toISOString()}&endDate=${dateRange[1].toISOString()}`;
      }

      if (typeFilter !== 'all') {
        url += `&type=${typeFilter}`;
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8010'}${url}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setMovements(data);
        setFilteredMovements(data);
      } else {
        message.error('Failed to fetch movements');
      }
    } catch (error) {
      console.error('Fetch movements error:', error);
      message.error('Error loading movements');
    } finally {
      setLoading(false);
    }
  };

  // Fetch product movement history
  const fetchProductHistory = async (productId: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8010'}/api/inventory/movements/product/${productId}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setSelectedProductMovements(data);
        setProductHistoryVisible(true);
      } else {
        message.error('Failed to fetch product history');
      }
    } catch (error) {
      console.error('Fetch product history error:', error);
      message.error('Error loading product history');
    }
  };

  useEffect(() => {
    fetchMovements();
  }, [dateRange, typeFilter]);

  // Apply tab filters
  useEffect(() => {
    let filtered = [...movements];

    if (activeTab !== 'all') {
      filtered = filtered.filter(m => m.type === activeTab.toUpperCase());
    }

    setFilteredMovements(filtered);
  }, [movements, activeTab]);

  // Create new movement
  const handleCreateMovement = async (values: any) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8010'}/api/inventory/movements`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(values),
      });

      if (response.ok) {
        message.success('Movement created successfully');
        form.resetFields();
        setCreateModalVisible(false);
        fetchMovements();
      } else {
        const error = await response.json();
        message.error(error.error || 'Failed to create movement');
      }
    } catch (error) {
      console.error('Create movement error:', error);
      message.error('Error creating movement');
    }
  };

  const getMovementTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      INBOUND: 'green',
      OUTBOUND: 'red',
      TRANSFER: 'blue',
      ADJUSTMENT: 'orange',
      RETURN: 'purple',
      RELOCATION: 'cyan',
    };
    return colors[type] || 'default';
  };

  // Statistics
  const stats = {
    total: movements.length,
    inbound: movements.filter(m => m.type === 'INBOUND').length,
    outbound: movements.filter(m => m.type === 'OUTBOUND').length,
    transfers: movements.filter(m => m.type === 'TRANSFER').length,
    adjustments: movements.filter(m => m.type === 'ADJUSTMENT').length,
    totalQuantity: movements.reduce((sum, m) => sum + m.quantity, 0),
  };

  // Table columns
  const columns = [
    {
      title: 'Date',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 150,
      render: (date: string) => (
        <div>
          <div>{dayjs(date).format('MMM DD, YYYY')}</div>
          <div className="text-xs text-gray-500">{dayjs(date).format('HH:mm')}</div>
        </div>
      ),
      sorter: (a: Movement, b: Movement) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    },
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      width: 120,
      render: (type: string) => (
        <Tag color={getMovementTypeColor(type)}>
          {type}
        </Tag>
      ),
    },
    {
      title: 'Product',
      dataIndex: 'product',
      key: 'product',
      width: 200,
      render: (product: any, record: Movement) => (
        <div>
          <div className="font-medium">{product?.name || 'Unknown'}</div>
          <div className="text-xs text-gray-500">
            SKU: {product?.sku || 'N/A'}
            {record.batch && ` • Batch: ${record.batch.batchNumber}`}
          </div>
        </div>
      ),
    },
    {
      title: 'From Location',
      dataIndex: 'fromLocation',
      key: 'fromLocation',
      width: 130,
      render: (location: any) =>
        location ? (
          <Tag color="orange">
            {location.aisle}-{location.rack}-{location.bin}
          </Tag>
        ) : (
          <Tag>N/A</Tag>
        ),
    },
    {
      title: 'To Location',
      dataIndex: 'toLocation',
      key: 'toLocation',
      width: 130,
      render: (location: any) =>
        location ? (
          <Tag color="green">
            {location.aisle}-{location.rack}-{location.bin}
          </Tag>
        ) : (
          <Tag>N/A</Tag>
        ),
    },
    {
      title: 'Quantity',
      dataIndex: 'quantity',
      key: 'quantity',
      width: 100,
      render: (qty: number) => <strong>{qty} units</strong>,
    },
    {
      title: 'User',
      dataIndex: 'user',
      key: 'user',
      width: 150,
      render: (user: any) => (
        <div>
          <div>{user?.name || 'Unknown'}</div>
          <div className="text-xs text-gray-500">{user?.email || 'N/A'}</div>
        </div>
      ),
    },
    {
      title: 'Reason',
      dataIndex: 'reason',
      key: 'reason',
      width: 150,
      ellipsis: true,
      render: (reason: string) => reason || '-',
    },
    {
      title: 'Actions',
      key: 'actions',
      fixed: 'right' as const,
      width: 120,
      render: (record: Movement) => (
        <Space>
          <Button
            type="link"
            icon={<EyeOutlined />}
            onClick={() => fetchProductHistory(record.productId)}
          >
            History
          </Button>
        </Space>
      ),
    },
  ];

  const tabItems = [
    {
      key: 'all',
      label: (
        <span>
          All Movements
          <Badge count={stats.total} style={{ marginLeft: 8, backgroundColor: '#52c41a' }} />
        </span>
      ),
    },
    {
      key: 'inbound',
      label: (
        <span>
          Inbound
          <Badge count={stats.inbound} style={{ marginLeft: 8, backgroundColor: '#52c41a' }} />
        </span>
      ),
    },
    {
      key: 'outbound',
      label: (
        <span>
          Outbound
          <Badge count={stats.outbound} style={{ marginLeft: 8, backgroundColor: '#ff4d4f' }} />
        </span>
      ),
    },
    {
      key: 'transfer',
      label: (
        <span>
          Transfers
          <Badge count={stats.transfers} style={{ marginLeft: 8, backgroundColor: '#1890ff' }} />
        </span>
      ),
    },
    {
      key: 'adjustment',
      label: (
        <span>
          Adjustments
          <Badge count={stats.adjustments} style={{ marginLeft: 8, backgroundColor: '#faad14' }} />
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
              <CarOutlined className="text-blue-600" />
              Inventory Movements
            </h1>
            <p className="text-gray-600 mt-1">Track all inventory movements and transfers</p>
          </div>
          <Space>
            <Button icon={<ReloadOutlined />} onClick={() => fetchMovements()}>
              Refresh
            </Button>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => setCreateModalVisible(true)}>
              Create Movement
            </Button>
          </Space>
        </div>
      </div>

      {/* KPI Statistics */}
      <Row gutter={[16, 16]} className="mb-6">
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Total Movements"
              value={stats.total}
              prefix={<DatabaseOutlined className="text-blue-600" />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Inbound"
              value={stats.inbound}
              prefix={<InboxOutlined className="text-green-600" />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Transfers"
              value={stats.transfers}
              prefix={<SwapOutlined className="text-blue-600" />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Total Quantity Moved"
              value={stats.totalQuantity}
              suffix="units"
            />
          </Card>
        </Col>
      </Row>

      {/* Filters */}
      <Card className="mb-4">
        <Space>
          <RangePicker
            value={dateRange as any}
            onChange={(dates) => setDateRange(dates as any)}
            format="MMM DD, YYYY"
          />
          <Select
            value={typeFilter}
            onChange={setTypeFilter}
            style={{ width: 150 }}
            placeholder="Filter by Type"
          >
            <Option value="all">All Types</Option>
            <Option value="INBOUND">Inbound</Option>
            <Option value="OUTBOUND">Outbound</Option>
            <Option value="TRANSFER">Transfer</Option>
            <Option value="ADJUSTMENT">Adjustment</Option>
            <Option value="RETURN">Return</Option>
            <Option value="RELOCATION">Relocation</Option>
          </Select>
        </Space>
      </Card>

      {/* Movements Table */}
      <Card>
        <Tabs activeKey={activeTab} onChange={setActiveTab} items={tabItems} className="mb-4" />

        <Table
          dataSource={filteredMovements}
          columns={columns}
          rowKey="id"
          loading={loading}
          scroll={{ x: 1300 }}
          pagination={{
            pageSize: 20,
            showSizeChanger: true,
            showTotal: (total) => `Total ${total} movements`,
          }}
        />
      </Card>

      {/* Create Movement Modal */}
      <Modal
        title="Create Inventory Movement"
        open={createModalVisible}
        onCancel={() => setCreateModalVisible(false)}
        onOk={() => form.submit()}
        width={600}
      >
        <Form form={form} layout="vertical" onFinish={handleCreateMovement}>
          <Form.Item
            name="type"
            label="Movement Type"
            rules={[{ required: true, message: 'Please select movement type' }]}
          >
            <Select placeholder="Select type">
              <Option value="INBOUND">Inbound (Receiving)</Option>
              <Option value="OUTBOUND">Outbound (Shipping)</Option>
              <Option value="TRANSFER">Transfer (Between Locations)</Option>
              <Option value="ADJUSTMENT">Adjustment</Option>
              <Option value="RETURN">Return</Option>
              <Option value="RELOCATION">Relocation</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="productId"
            label="Product ID"
            rules={[{ required: true, message: 'Please enter product ID' }]}
          >
            <Input placeholder="Product UUID" />
          </Form.Item>

          <Form.Item name="batchId" label="Batch ID (Optional)">
            <Input placeholder="Batch UUID" />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="fromLocationId" label="From Location ID">
                <Input placeholder="Source location UUID" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="toLocationId" label="To Location ID">
                <Input placeholder="Destination location UUID" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="quantity"
            label="Quantity"
            rules={[{ required: true, message: 'Please enter quantity' }]}
          >
            <InputNumber min={1} style={{ width: '100%' }} placeholder="Units" />
          </Form.Item>

          <Form.Item name="reason" label="Reason">
            <Input placeholder="e.g., Stock replenishment, Customer order, etc." />
          </Form.Item>

          <Form.Item name="notes" label="Notes">
            <Input.TextArea rows={3} placeholder="Additional notes (optional)" />
          </Form.Item>
        </Form>
      </Modal>

      {/* Product History Modal */}
      <Modal
        title="Product Movement History"
        open={productHistoryVisible}
        onCancel={() => setProductHistoryVisible(false)}
        footer={null}
        width={700}
      >
        {selectedProductMovements.length > 0 && (
          <div>
            <div className="mb-4">
              <p className="text-gray-600">
                <strong>Product:</strong> {selectedProductMovements[0].product?.name}
              </p>
              <p className="text-gray-600">
                <strong>SKU:</strong> {selectedProductMovements[0].product?.sku}
              </p>
            </div>

            <Timeline
              items={selectedProductMovements.map((movement) => ({
                color: getMovementTypeColor(movement.type),
                children: (
                  <div>
                    <div className="flex justify-between items-start">
                      <div>
                        <Tag color={getMovementTypeColor(movement.type)}>{movement.type}</Tag>
                        <div className="mt-2 text-sm text-gray-600">
                          {movement.fromLocation && (
                            <span>
                              From: {movement.fromLocation.aisle}-{movement.fromLocation.rack}-
                              {movement.fromLocation.bin}
                            </span>
                          )}
                          {movement.fromLocation && movement.toLocation && <span> → </span>}
                          {movement.toLocation && (
                            <span>
                              To: {movement.toLocation.aisle}-{movement.toLocation.rack}-
                              {movement.toLocation.bin}
                            </span>
                          )}
                        </div>
                        <div className="mt-1 text-sm">
                          <strong>Quantity:</strong> {movement.quantity} units
                        </div>
                        {movement.reason && (
                          <div className="mt-1 text-sm text-gray-600">
                            <strong>Reason:</strong> {movement.reason}
                          </div>
                        )}
                        <div className="mt-1 text-xs text-gray-500">
                          {movement.user?.name} • {dayjs(movement.createdAt).format('MMM DD, YYYY HH:mm')}
                        </div>
                      </div>
                    </div>
                  </div>
                ),
              }))}
            />
          </div>
        )}
      </Modal>
    </div>
  );
}
