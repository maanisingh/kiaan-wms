'use client';

import React, { useState, useEffect } from 'react';
import { Card, Table, Tag, Button, Statistic, Row, Col, Spin, Alert, Input, Select, Modal, Form, InputNumber, DatePicker, App, Tooltip, Popconfirm, Space, Descriptions, Divider, List } from 'antd';
import {
  ArrowLeftOutlined,
  ShoppingCartOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  TruckOutlined,
  SearchOutlined,
  ReloadOutlined,
  LoadingOutlined,
  DollarOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  SendOutlined,
} from '@ant-design/icons';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import dayjs from 'dayjs';
import apiService from '@/services/api';

const { Search } = Input;
const { Option } = Select;
const { TextArea } = Input;

interface Client {
  id: string;
  name: string;
  code: string;
}

interface OrderItem {
  id: string;
  productId?: string;
  productName: string;
  productSku: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  tax: number;
  totalPrice: number;
}

interface Order {
  id: string;
  orderNumber: string;
  externalOrderId?: string;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  salesChannel?: string;
  isWholesale: boolean;
  status: string;
  priority: string;
  items: OrderItem[];
  subtotal: number;
  taxAmount: number;
  shippingCost: number;
  discountAmount: number;
  totalAmount: number;
  shippingAddress?: string;
  shippingMethod?: string;
  trackingNumber?: string;
  carrier?: string;
  notes?: string;
  orderDate: string;
  requiredDate?: string;
  shippedDate?: string;
  deliveredDate?: string;
  createdAt: string;
}

interface Stats {
  totalOrders: number;
  pendingOrders: number;
  shippedOrders: number;
  deliveredOrders: number;
  cancelledOrders: number;
  totalRevenue: number;
  thisMonthOrders: number;
  thisMonthRevenue: number;
}

export default function ClientOrdersPage() {
  const { message } = App.useApp();
  const router = useRouter();
  const params = useParams();
  const [client, setClient] = useState<Client | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Modal states
  const [modalOpen, setModalOpen] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [viewingOrder, setViewingOrder] = useState<Order | null>(null);
  const [saving, setSaving] = useState(false);
  const [form] = Form.useForm();
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);

  useEffect(() => {
    if (params.id) {
      fetchData();
    }
  }, [params.id]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch client-specific orders using the new endpoint
      const response = await apiService.get(`/clients/${params.id}/orders`);
      setClient(response.client);
      setOrders(response.orders || []);
      setStats(response.stats);
    } catch (err: any) {
      console.error('Failed to fetch data:', err);
      setError(err.message || 'Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setEditingOrder(null);
    setOrderItems([{ id: `temp-${Date.now()}`, productName: '', productSku: '', quantity: 1, unitPrice: 0, discount: 0, tax: 0, totalPrice: 0 }]);
    form.resetFields();
    setModalOpen(true);
  };

  const handleEdit = (record: Order) => {
    setEditingOrder(record);
    setOrderItems(record.items || []);
    form.setFieldsValue({
      ...record,
      requiredDate: record.requiredDate ? dayjs(record.requiredDate) : null,
    });
    setModalOpen(true);
  };

  const handleView = (record: Order) => {
    setViewingOrder(record);
    setViewModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await apiService.delete(`/clients/${params.id}/orders/${id}`);
      message.success('Order deleted successfully');
      fetchData();
    } catch (err: any) {
      message.error(err.message || 'Failed to delete order');
    }
  };

  const handleUpdateStatus = async (orderId: string, newStatus: string) => {
    try {
      await apiService.put(`/clients/${params.id}/orders/${orderId}`, { status: newStatus });
      message.success(`Order status updated to ${newStatus}`);
      fetchData();
    } catch (err: any) {
      message.error(err.message || 'Failed to update status');
    }
  };

  const handleSave = async (values: any) => {
    try {
      setSaving(true);
      const data = {
        ...values,
        items: orderItems.filter(item => item.productName && item.productSku),
        requiredDate: values.requiredDate?.toISOString(),
      };

      if (editingOrder) {
        await apiService.put(`/clients/${params.id}/orders/${editingOrder.id}`, data);
        message.success('Order updated successfully');
      } else {
        await apiService.post(`/clients/${params.id}/orders`, data);
        message.success('Order created successfully');
      }
      setModalOpen(false);
      fetchData();
    } catch (err: any) {
      message.error(err.message || 'Failed to save order');
    } finally {
      setSaving(false);
    }
  };

  const addOrderItem = () => {
    setOrderItems([...orderItems, { id: `temp-${Date.now()}`, productName: '', productSku: '', quantity: 1, unitPrice: 0, discount: 0, tax: 0, totalPrice: 0 }]);
  };

  const updateOrderItem = (index: number, field: string, value: any) => {
    const updated = [...orderItems];
    (updated[index] as any)[field] = value;
    if (field === 'quantity' || field === 'unitPrice') {
      updated[index].totalPrice = updated[index].quantity * updated[index].unitPrice;
    }
    setOrderItems(updated);
  };

  const removeOrderItem = (index: number) => {
    setOrderItems(orderItems.filter((_, i) => i !== index));
  };

  // Filter orders
  const filteredOrders = orders.filter(order => {
    let matches = true;

    if (searchText) {
      const search = searchText.toLowerCase();
      matches = order.orderNumber?.toLowerCase().includes(search) ||
                order.customerName?.toLowerCase().includes(search) ||
                order.trackingNumber?.toLowerCase().includes(search) ||
                order.externalOrderId?.toLowerCase().includes(search);
    }

    if (statusFilter !== 'all') {
      matches = matches && order.status === statusFilter;
    }

    return matches;
  });

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      PENDING: 'orange',
      CONFIRMED: 'blue',
      ALLOCATED: 'cyan',
      PICKING: 'geekblue',
      PACKING: 'purple',
      READY_TO_SHIP: 'lime',
      SHIPPED: 'green',
      DELIVERED: 'green',
      CANCELLED: 'red',
      ON_HOLD: 'gold',
      RETURNED: 'volcano',
    };
    return colors[status] || 'default';
  };

  const getStatusIcon = (status: string) => {
    if (status === 'PENDING' || status === 'ON_HOLD') return <ClockCircleOutlined />;
    if (status === 'SHIPPED' || status === 'DELIVERED') return <TruckOutlined />;
    return <CheckCircleOutlined />;
  };

  const columns = [
    {
      title: 'Order #',
      dataIndex: 'orderNumber',
      key: 'orderNumber',
      width: 140,
      render: (orderNumber: string, record: Order) => (
        <a onClick={() => handleView(record)} className="text-blue-600 font-semibold hover:underline cursor-pointer">
          {orderNumber}
        </a>
      ),
    },
    {
      title: 'Date',
      dataIndex: 'orderDate',
      key: 'orderDate',
      width: 100,
      render: (date: string) => date ? new Date(date).toLocaleDateString('en-GB') : '-',
    },
    {
      title: 'Customer',
      key: 'customer',
      width: 180,
      render: (record: Order) => (
        <div>
          <div className="font-medium">{record.customerName || 'Walk-in'}</div>
          {record.salesChannel && (
            <Tag color="blue" className="mt-1">{record.salesChannel}</Tag>
          )}
          {record.isWholesale && (
            <Tag color="purple" className="mt-1">Wholesale</Tag>
          )}
        </div>
      ),
    },
    {
      title: 'Items',
      key: 'items',
      width: 60,
      render: (record: Order) => (
        <span className="font-medium">{record.items?.length || 0}</span>
      ),
    },
    {
      title: 'Total',
      dataIndex: 'totalAmount',
      key: 'total',
      width: 100,
      render: (amount: number) => (
        <span className="font-semibold text-green-600">
          £{(amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
        </span>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 130,
      render: (status: string) => (
        <Tag color={getStatusColor(status)} className="uppercase">
          {getStatusIcon(status)} {status?.replace('_', ' ')}
        </Tag>
      ),
    },
    {
      title: 'Tracking',
      dataIndex: 'trackingNumber',
      key: 'tracking',
      width: 130,
      render: (tracking: string) => tracking || '-',
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 180,
      fixed: 'right' as const,
      render: (_: any, record: Order) => (
        <Space>
          <Tooltip title="View">
            <Button type="text" icon={<EyeOutlined />} onClick={() => handleView(record)} />
          </Tooltip>
          <Tooltip title="Edit">
            <Button type="text" icon={<EditOutlined />} onClick={() => handleEdit(record)} />
          </Tooltip>
          {record.status === 'PENDING' && (
            <Tooltip title="Confirm">
              <Button type="text" icon={<CheckCircleOutlined />} onClick={() => handleUpdateStatus(record.id, 'CONFIRMED')} />
            </Tooltip>
          )}
          {record.status === 'READY_TO_SHIP' && (
            <Tooltip title="Mark Shipped">
              <Button type="text" icon={<SendOutlined />} onClick={() => handleUpdateStatus(record.id, 'SHIPPED')} />
            </Tooltip>
          )}
          <Popconfirm
            title="Delete this order?"
            onConfirm={() => handleDelete(record.id)}
            okText="Yes"
            cancelText="No"
          >
            <Tooltip title="Delete">
              <Button type="text" danger icon={<DeleteOutlined />} />
            </Tooltip>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spin indicator={<LoadingOutlined style={{ fontSize: 48 }} spin />} tip="Loading orders..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <Alert
          type="error"
          message="Error Loading Orders"
          description={error}
          action={
            <Button onClick={() => router.push('/clients')}>
              Back to Clients
            </Button>
          }
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div className="flex items-center gap-4">
          <Button
            icon={<ArrowLeftOutlined />}
            onClick={() => router.push(`/clients/${params.id}`)}
          >
            Back to Client
          </Button>
          <div>
            <h1 className="text-3xl font-bold">
              <ShoppingCartOutlined className="mr-2 text-green-500" />
              {client?.name} - Orders
            </h1>
            <p className="text-gray-600 mt-1">
              Manage sales orders for this 3PL client
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
            Create Order
          </Button>
          <Button icon={<ReloadOutlined />} onClick={fetchData}>
            Refresh
          </Button>
        </div>
      </div>

      {/* Breadcrumb */}
      <div className="flex gap-2 text-sm">
        <Link href="/clients" className="text-blue-600 hover:underline">Clients</Link>
        <span>/</span>
        <Link href={`/clients/${params.id}`} className="text-blue-600 hover:underline">{client?.name}</Link>
        <span>/</span>
        <span className="text-gray-600">Orders</span>
      </div>

      {/* Stats */}
      <Row gutter={16}>
        <Col xs={24} sm={12} lg={3}>
          <Card>
            <Statistic
              title="Total Orders"
              value={stats?.totalOrders || 0}
              prefix={<ShoppingCartOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={3}>
          <Card>
            <Statistic
              title="Pending"
              value={stats?.pendingOrders || 0}
              prefix={<ClockCircleOutlined />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={3}>
          <Card>
            <Statistic
              title="Shipped"
              value={stats?.shippedOrders || 0}
              prefix={<TruckOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={3}>
          <Card>
            <Statistic
              title="Delivered"
              value={stats?.deliveredOrders || 0}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#13c2c2' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={4}>
          <Card>
            <Statistic
              title="Total Revenue"
              value={stats?.totalRevenue || 0}
              prefix="£"
              precision={2}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={4}>
          <Card>
            <Statistic
              title="This Month"
              value={stats?.thisMonthRevenue || 0}
              prefix="£"
              precision={2}
              valueStyle={{ color: '#eb2f96' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={4}>
          <Card>
            <Statistic
              title="This Month Orders"
              value={stats?.thisMonthOrders || 0}
              valueStyle={{ color: '#fa8c16' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Filters */}
      <Card>
        <div className="flex flex-wrap gap-4">
          <Search
            placeholder="Search by order #, customer, tracking..."
            style={{ width: 400 }}
            prefix={<SearchOutlined />}
            allowClear
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
          />
          <Select
            value={statusFilter}
            onChange={setStatusFilter}
            style={{ width: 180 }}
            placeholder="Order Status"
          >
            <Option value="all">All Status</Option>
            <Option value="PENDING">Pending</Option>
            <Option value="CONFIRMED">Confirmed</Option>
            <Option value="ALLOCATED">Allocated</Option>
            <Option value="PICKING">Picking</Option>
            <Option value="PACKING">Packing</Option>
            <Option value="READY_TO_SHIP">Ready to Ship</Option>
            <Option value="SHIPPED">Shipped</Option>
            <Option value="DELIVERED">Delivered</Option>
            <Option value="ON_HOLD">On Hold</Option>
            <Option value="CANCELLED">Cancelled</Option>
            <Option value="RETURNED">Returned</Option>
          </Select>
        </div>
      </Card>

      {/* Orders Table */}
      <Card>
        <Table
          dataSource={filteredOrders}
          columns={columns}
          rowKey="id"
          scroll={{ x: 1200 }}
          pagination={{
            pageSize: 20,
            showTotal: (total) => `Total ${total} orders`,
          }}
        />
      </Card>

      {/* Create/Edit Order Modal */}
      <Modal
        title={editingOrder ? 'Edit Order' : 'Create New Order'}
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onOk={() => form.submit()}
        width={900}
        confirmLoading={saving}
        okText={editingOrder ? 'Update' : 'Create'}
      >
        <Form form={form} layout="vertical" onFinish={handleSave}>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item label="Customer Name" name="customerName">
                <Input placeholder="Enter customer name" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="Customer Email" name="customerEmail">
                <Input placeholder="email@example.com" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="Customer Phone" name="customerPhone">
                <Input placeholder="+44..." />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item label="Sales Channel" name="salesChannel">
                <Select placeholder="Select channel" allowClear>
                  <Option value="Website">Website</Option>
                  <Option value="Shopify">Shopify</Option>
                  <Option value="Amazon">Amazon</Option>
                  <Option value="eBay">eBay</Option>
                  <Option value="Wholesale">Wholesale</Option>
                  <Option value="Phone">Phone Order</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="External Order ID" name="externalOrderId">
                <Input placeholder="External reference" />
              </Form.Item>
            </Col>
            <Col span={4}>
              <Form.Item label="Wholesale" name="isWholesale" valuePropName="checked">
                <Select placeholder="Type">
                  <Option value={false}>Retail</Option>
                  <Option value={true}>Wholesale</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={4}>
              <Form.Item label="Priority" name="priority">
                <Select placeholder="Priority">
                  <Option value="LOW">Low</Option>
                  <Option value="MEDIUM">Medium</Option>
                  <Option value="HIGH">High</Option>
                  <Option value="URGENT">Urgent</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Divider>Order Items</Divider>

          <div className="mb-4">
            {orderItems.map((item, index) => (
              <div key={item.id} className="flex gap-2 mb-2 items-end">
                <Input
                  placeholder="Product Name"
                  value={item.productName}
                  onChange={(e) => updateOrderItem(index, 'productName', e.target.value)}
                  style={{ width: 200 }}
                />
                <Input
                  placeholder="SKU"
                  value={item.productSku}
                  onChange={(e) => updateOrderItem(index, 'productSku', e.target.value)}
                  style={{ width: 120 }}
                />
                <InputNumber
                  placeholder="Qty"
                  min={1}
                  value={item.quantity}
                  onChange={(value) => updateOrderItem(index, 'quantity', value || 1)}
                  style={{ width: 80 }}
                />
                <InputNumber
                  placeholder="Price"
                  min={0}
                  step={0.01}
                  value={item.unitPrice}
                  onChange={(value) => updateOrderItem(index, 'unitPrice', value || 0)}
                  style={{ width: 100 }}
                  prefix="£"
                />
                <span className="font-semibold text-green-600 w-24">
                  £{(item.totalPrice || 0).toFixed(2)}
                </span>
                <Button danger icon={<DeleteOutlined />} onClick={() => removeOrderItem(index)} />
              </div>
            ))}
            <Button type="dashed" onClick={addOrderItem} icon={<PlusOutlined />}>
              Add Item
            </Button>
          </div>

          <Divider>Shipping</Divider>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="Shipping Address" name="shippingAddress">
                <TextArea rows={2} placeholder="Full shipping address" />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item label="Shipping Method" name="shippingMethod">
                <Select placeholder="Method" allowClear>
                  <Option value="Standard">Standard</Option>
                  <Option value="Express">Express</Option>
                  <Option value="Next Day">Next Day</Option>
                  <Option value="Collection">Collection</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item label="Required Date" name="requiredDate">
                <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item label="Carrier" name="carrier">
                <Input placeholder="e.g., Royal Mail, DPD" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="Tracking Number" name="trackingNumber">
                <Input placeholder="Tracking number" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="Status" name="status">
                <Select placeholder="Status">
                  <Option value="PENDING">Pending</Option>
                  <Option value="CONFIRMED">Confirmed</Option>
                  <Option value="ALLOCATED">Allocated</Option>
                  <Option value="PICKING">Picking</Option>
                  <Option value="PACKING">Packing</Option>
                  <Option value="READY_TO_SHIP">Ready to Ship</Option>
                  <Option value="SHIPPED">Shipped</Option>
                  <Option value="DELIVERED">Delivered</Option>
                  <Option value="ON_HOLD">On Hold</Option>
                  <Option value="CANCELLED">Cancelled</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item label="Notes" name="notes">
            <TextArea rows={2} placeholder="Order notes" />
          </Form.Item>
        </Form>
      </Modal>

      {/* View Order Modal */}
      <Modal
        title={`Order ${viewingOrder?.orderNumber}`}
        open={viewModalOpen}
        onCancel={() => setViewModalOpen(false)}
        footer={[
          <Button key="close" onClick={() => setViewModalOpen(false)}>Close</Button>,
          <Button key="edit" type="primary" icon={<EditOutlined />} onClick={() => { setViewModalOpen(false); handleEdit(viewingOrder!); }}>
            Edit Order
          </Button>
        ]}
        width={800}
      >
        {viewingOrder && (
          <div className="space-y-4">
            <Descriptions column={2} bordered size="small">
              <Descriptions.Item label="Order Number">{viewingOrder.orderNumber}</Descriptions.Item>
              <Descriptions.Item label="External ID">{viewingOrder.externalOrderId || '-'}</Descriptions.Item>
              <Descriptions.Item label="Customer">{viewingOrder.customerName || 'Walk-in'}</Descriptions.Item>
              <Descriptions.Item label="Email">{viewingOrder.customerEmail || '-'}</Descriptions.Item>
              <Descriptions.Item label="Phone">{viewingOrder.customerPhone || '-'}</Descriptions.Item>
              <Descriptions.Item label="Channel">{viewingOrder.salesChannel || '-'}</Descriptions.Item>
              <Descriptions.Item label="Status">
                <Tag color={getStatusColor(viewingOrder.status)}>{viewingOrder.status}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Priority">
                <Tag color={viewingOrder.priority === 'URGENT' ? 'red' : viewingOrder.priority === 'HIGH' ? 'orange' : 'blue'}>
                  {viewingOrder.priority}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Order Date">{new Date(viewingOrder.orderDate).toLocaleDateString('en-GB')}</Descriptions.Item>
              <Descriptions.Item label="Required Date">{viewingOrder.requiredDate ? new Date(viewingOrder.requiredDate).toLocaleDateString('en-GB') : '-'}</Descriptions.Item>
              <Descriptions.Item label="Shipping Address" span={2}>{viewingOrder.shippingAddress || '-'}</Descriptions.Item>
              <Descriptions.Item label="Carrier">{viewingOrder.carrier || '-'}</Descriptions.Item>
              <Descriptions.Item label="Tracking">{viewingOrder.trackingNumber || '-'}</Descriptions.Item>
            </Descriptions>

            <Divider>Order Items</Divider>

            <List
              dataSource={viewingOrder.items}
              renderItem={(item: OrderItem) => (
                <List.Item>
                  <div className="flex justify-between w-full">
                    <div>
                      <span className="font-semibold">{item.productName}</span>
                      <span className="text-gray-500 ml-2">({item.productSku})</span>
                    </div>
                    <div className="text-right">
                      <span>{item.quantity} x £{item.unitPrice?.toFixed(2)}</span>
                      <span className="font-bold ml-4">£{item.totalPrice?.toFixed(2)}</span>
                    </div>
                  </div>
                </List.Item>
              )}
            />

            <div className="text-right border-t pt-4">
              <div className="text-lg font-bold text-green-600">
                Total: £{viewingOrder.totalAmount?.toFixed(2)}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
