'use client';

import React, { useState, useEffect } from 'react';
import { Card, Button, Tag, Descriptions, Row, Col, Statistic, Spin, Alert, Modal, Form, Input, Select, App, Progress, Table } from 'antd';
import {
  ArrowLeftOutlined,
  EditOutlined,
  MailOutlined,
  PhoneOutlined,
  GlobalOutlined,
  HomeOutlined,
  CheckCircleOutlined,
  CrownOutlined,
  LoadingOutlined,
  ShopOutlined,
  DatabaseOutlined,
  ShoppingCartOutlined,
  DollarOutlined,
  RightOutlined,
  InboxOutlined,
  ExclamationCircleOutlined,
  RiseOutlined,
  SyncOutlined,
  ClockCircleOutlined,
  TruckOutlined,
  WarningOutlined,
} from '@ant-design/icons';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import apiService from '@/services/api';

const { Option } = Select;

interface Client {
  id: string;
  name: string;
  code: string;
  type: string;
  contactName?: string;
  contactPerson?: string;
  email?: string;
  phone?: string;
  country?: string;
  city?: string;
  address?: string;
  status?: string;
  tier?: string;
  segment?: string;
  creditLimit?: number;
  paymentTerms?: string;
  notes?: string;
  storageRatePerPallet?: number;
  handlingRatePerUnit?: number;
  pickPackRatePerOrder?: number;
  returnsProcessingRate?: number;
  createdAt: string;
  updatedAt: string;
}

interface ClientStats {
  inventory: {
    totalSKUs: number;
    totalUnits: number;
    totalValue: number;
    lowStockItems: number;
    availableUnits: number;
    reservedUnits: number;
  };
  orders: {
    totalOrders: number;
    pendingOrders: number;
    completedOrders: number;
    shippedOrders: number;
    totalRevenue: number;
  };
  billing: {
    totalInvoices: number;
    totalBilled: number;
    totalPaid: number;
    totalOutstanding: number;
    overdueAmount: number;
    overdueCount: number;
  };
}

interface RecentActivity {
  id: string;
  type: 'order' | 'inventory' | 'invoice' | 'payment';
  description: string;
  timestamp: string;
  status?: string;
}

export default function ClientDetailPage() {
  const { message } = App.useApp();
  const router = useRouter();
  const params = useParams();
  const [client, setClient] = useState<Client | null>(null);
  const [stats, setStats] = useState<ClientStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form] = Form.useForm();

  const fetchClient = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await apiService.get(`/clients/${params.id}`);
      setClient(data);
    } catch (err: any) {
      console.error('Failed to fetch client:', err);
      setError(err.message || 'Failed to load client');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      // Fetch all stats in parallel
      const [inventoryRes, ordersRes, invoicesRes] = await Promise.all([
        apiService.get(`/clients/${params.id}/inventory`).catch(() => ({ stats: null })),
        apiService.get(`/clients/${params.id}/orders`).catch(() => ({ stats: null })),
        apiService.get(`/clients/${params.id}/invoices`).catch(() => ({ stats: null })),
      ]);

      setStats({
        inventory: inventoryRes.stats || {
          totalSKUs: 0,
          totalUnits: 0,
          totalValue: 0,
          lowStockItems: 0,
          availableUnits: 0,
          reservedUnits: 0,
        },
        orders: ordersRes.stats || {
          totalOrders: 0,
          pendingOrders: 0,
          completedOrders: 0,
          shippedOrders: 0,
          totalRevenue: 0,
        },
        billing: {
          totalInvoices: invoicesRes.stats?.totalInvoices || 0,
          totalBilled: invoicesRes.stats?.totalBilled || 0,
          totalPaid: invoicesRes.stats?.totalPaid || 0,
          totalOutstanding: invoicesRes.stats?.totalOutstanding || 0,
          overdueAmount: invoicesRes.stats?.overdueAmount || 0,
          overdueCount: invoicesRes.stats?.overdueCount || 0,
        },
      });
    } catch (err: any) {
      console.error('Failed to fetch stats:', err);
    }
  };

  useEffect(() => {
    if (params.id) {
      fetchClient();
      fetchStats();
    }
  }, [params.id]);

  const handleEdit = () => {
    if (client) {
      form.setFieldsValue({
        name: client.name,
        type: client.type,
        contactPerson: client.contactName || client.contactPerson,
        email: client.email,
        phone: client.phone,
        country: client.country,
        city: client.city,
        address: client.address,
        tier: client.tier,
        segment: client.segment,
        creditLimit: client.creditLimit,
        paymentTerms: client.paymentTerms,
        notes: client.notes,
        storageRatePerPallet: client.storageRatePerPallet,
        handlingRatePerUnit: client.handlingRatePerUnit,
        pickPackRatePerOrder: client.pickPackRatePerOrder,
        returnsProcessingRate: client.returnsProcessingRate,
      });
      setEditModalOpen(true);
    }
  };

  const handleSave = async (values: any) => {
    try {
      setSaving(true);
      await apiService.put(`/clients/${params.id}`, values);
      message.success('Client updated successfully!');
      setEditModalOpen(false);
      fetchClient(); // Refresh data
    } catch (err: any) {
      console.error('Failed to update client:', err);
      message.error(err.message || 'Failed to update client');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spin indicator={<LoadingOutlined style={{ fontSize: 48 }} spin />} tip="Loading client..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <Alert
          type="error"
          message="Error Loading Client"
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

  if (!client) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl">Client not found</h2>
        <Button className="mt-4" onClick={() => router.push('/clients')}>
          Back to Clients
        </Button>
      </div>
    );
  }

  const getTierIcon = (tier: string | undefined) => {
    switch (tier) {
      case 'Premium': return <CrownOutlined style={{ color: '#FFD700' }} />;
      case 'Gold': return <CrownOutlined style={{ color: '#FFB800' }} />;
      case 'Silver': return <CrownOutlined style={{ color: '#C0C0C0' }} />;
      default: return null;
    }
  };

  const getStatusColor = (status: string | undefined) => {
    switch (status?.toLowerCase()) {
      case 'active': return 'green';
      case 'pending': case 'inactive': return 'orange';
      case 'suspended': return 'red';
      default: return 'default';
    }
  };

  const getTierColor = (tier: string | undefined) => {
    switch (tier) {
      case 'Premium': return 'gold';
      case 'Gold': return 'orange';
      case 'Silver': return 'default';
      default: return 'blue';
    }
  };

  // Calculate credit utilization
  const creditUsed = stats?.billing?.totalOutstanding || 0;
  const creditLimit = client?.creditLimit || 0;
  const creditUtilization = creditLimit > 0 ? Math.min((creditUsed / creditLimit) * 100, 100) : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <Button
            icon={<ArrowLeftOutlined />}
            onClick={() => router.push('/clients')}
          >
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              {client.name}
              {getTierIcon(client.tier)}
            </h1>
            <p className="text-gray-600 mt-1">
              Client Code: <span className="font-mono">{client.code}</span>
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button icon={<SyncOutlined />} onClick={() => { fetchClient(); fetchStats(); }}>
            Refresh
          </Button>
          <Button icon={<EditOutlined />} type="primary" size="large" onClick={handleEdit}>
            Edit Client
          </Button>
        </div>
      </div>

      {/* Type Badge */}
      <Card>
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-4 flex-wrap">
            <Tag color={client.type === 'B2B' ? 'blue' : 'green'} style={{ fontSize: 18, padding: '8px 16px' }}>
              <ShopOutlined /> {client.type} Client
            </Tag>
            {client.tier && (
              <Tag color={getTierColor(client.tier)} style={{ fontSize: 16, padding: '6px 12px' }}>
                {getTierIcon(client.tier)} {client.tier} Tier
              </Tag>
            )}
            {client.segment && (
              <Tag color="cyan" style={{ fontSize: 14, padding: '4px 10px' }}>
                {client.segment}
              </Tag>
            )}
          </div>
          <Tag color={getStatusColor(client.status)} style={{ fontSize: 16, padding: '6px 12px' }} className="uppercase">
            <CheckCircleOutlined /> {client.status || 'active'}
          </Tag>
        </div>
      </Card>

      {/* Key Stats Overview */}
      <Row gutter={16}>
        <Col xs={24} sm={12} lg={6}>
          <Card className="hover:shadow-lg transition-shadow">
            <Statistic
              title={<span><DatabaseOutlined className="mr-2" />Inventory SKUs</span>}
              value={stats?.inventory?.totalSKUs || 0}
              valueStyle={{ color: '#1890ff' }}
            />
            <div className="text-xs text-gray-500 mt-2">
              {(stats?.inventory?.totalUnits || 0).toLocaleString()} total units
            </div>
            <Progress
              percent={stats?.inventory?.totalUnits ? Math.min((stats.inventory.availableUnits / stats.inventory.totalUnits) * 100, 100) : 0}
              size="small"
              strokeColor="#52c41a"
              className="mt-2"
            />
            <div className="text-xs text-gray-500">
              {stats?.inventory?.availableUnits || 0} available / {stats?.inventory?.reservedUnits || 0} reserved
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className="hover:shadow-lg transition-shadow">
            <Statistic
              title={<span><ShoppingCartOutlined className="mr-2" />Active Orders</span>}
              value={stats?.orders?.pendingOrders || 0}
              valueStyle={{ color: '#fa8c16' }}
            />
            <div className="text-xs text-gray-500 mt-2">
              {stats?.orders?.totalOrders || 0} total orders
            </div>
            <div className="flex gap-2 mt-2 flex-wrap">
              <Tag color="blue" className="text-xs">
                <ClockCircleOutlined /> {stats?.orders?.pendingOrders || 0} Pending
              </Tag>
              <Tag color="green" className="text-xs">
                <TruckOutlined /> {stats?.orders?.shippedOrders || 0} Shipped
              </Tag>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className="hover:shadow-lg transition-shadow">
            <Statistic
              title={<span><DollarOutlined className="mr-2" />Outstanding</span>}
              value={stats?.billing?.totalOutstanding || 0}
              prefix="£"
              valueStyle={{ color: creditUtilization > 80 ? '#ff4d4f' : '#faad14' }}
            />
            <div className="text-xs text-gray-500 mt-2">
              £{(stats?.billing?.totalBilled || 0).toLocaleString()} total billed
            </div>
            <Progress
              percent={creditUtilization}
              size="small"
              strokeColor={creditUtilization > 80 ? '#ff4d4f' : creditUtilization > 50 ? '#faad14' : '#52c41a'}
              className="mt-2"
            />
            <div className="text-xs text-gray-500">
              Credit: £{creditUsed.toLocaleString()} / £{creditLimit.toLocaleString()}
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className="hover:shadow-lg transition-shadow">
            <Statistic
              title={<span><RiseOutlined className="mr-2" />Revenue (Orders)</span>}
              value={stats?.orders?.totalRevenue || 0}
              prefix="£"
              valueStyle={{ color: '#52c41a' }}
            />
            <div className="text-xs text-gray-500 mt-2">
              From {stats?.orders?.completedOrders || 0} completed orders
            </div>
            {(stats?.billing?.overdueCount || 0) > 0 && (
              <Tag color="red" className="mt-2">
                <WarningOutlined /> {stats?.billing?.overdueCount} overdue invoices
              </Tag>
            )}
          </Card>
        </Col>
      </Row>

      {/* Alerts */}
      {((stats?.inventory?.lowStockItems || 0) > 0 || (stats?.billing?.overdueCount || 0) > 0) && (
        <Row gutter={16}>
          {(stats?.inventory?.lowStockItems || 0) > 0 && (
            <Col xs={24} md={12}>
              <Alert
                message={`${stats?.inventory?.lowStockItems} Low Stock Items`}
                description="Some inventory items for this client are running low. Consider replenishment."
                type="warning"
                showIcon
                icon={<ExclamationCircleOutlined />}
                action={
                  <Link href={`/clients/${params.id}/inventory`}>
                    <Button size="small" type="primary">View Inventory</Button>
                  </Link>
                }
              />
            </Col>
          )}
          {(stats?.billing?.overdueCount || 0) > 0 && (
            <Col xs={24} md={12}>
              <Alert
                message={`${stats?.billing?.overdueCount} Overdue Invoice${(stats?.billing?.overdueCount || 0) > 1 ? 's' : ''}`}
                description={`Total overdue amount: £${(stats?.billing?.overdueAmount || 0).toLocaleString()}`}
                type="error"
                showIcon
                icon={<WarningOutlined />}
                action={
                  <Link href={`/clients/${params.id}/billing`}>
                    <Button size="small" danger>View Billing</Button>
                  </Link>
                }
              />
            </Col>
          )}
        </Row>
      )}

      {/* Quick Navigation */}
      <Card title="3PL Client Management" className="bg-gradient-to-r from-purple-50 to-blue-50">
        <Row gutter={16}>
          <Col xs={24} sm={8}>
            <Link href={`/clients/${params.id}/inventory`}>
              <Card
                hoverable
                className="text-center border-2 border-blue-200 hover:border-blue-500 transition-colors"
              >
                <DatabaseOutlined className="text-5xl text-blue-500 mb-4" />
                <h3 className="text-lg font-semibold mb-2">Inventory</h3>
                <p className="text-gray-500 text-sm mb-2">
                  View and manage all inventory stored for this client
                </p>
                <div className="text-2xl font-bold text-blue-600 mb-4">
                  {stats?.inventory?.totalSKUs || 0} SKUs
                </div>
                <Button type="primary" icon={<RightOutlined />}>
                  Manage Inventory
                </Button>
              </Card>
            </Link>
          </Col>
          <Col xs={24} sm={8}>
            <Link href={`/clients/${params.id}/orders`}>
              <Card
                hoverable
                className="text-center border-2 border-green-200 hover:border-green-500 transition-colors"
              >
                <ShoppingCartOutlined className="text-5xl text-green-500 mb-4" />
                <h3 className="text-lg font-semibold mb-2">Orders</h3>
                <p className="text-gray-500 text-sm mb-2">
                  View and manage sales orders for this client
                </p>
                <div className="text-2xl font-bold text-green-600 mb-4">
                  {stats?.orders?.totalOrders || 0} Orders
                </div>
                <Button type="primary" className="bg-green-500 hover:bg-green-600" icon={<RightOutlined />}>
                  Manage Orders
                </Button>
              </Card>
            </Link>
          </Col>
          <Col xs={24} sm={8}>
            <Link href={`/clients/${params.id}/billing`}>
              <Card
                hoverable
                className="text-center border-2 border-purple-200 hover:border-purple-500 transition-colors"
              >
                <DollarOutlined className="text-5xl text-purple-500 mb-4" />
                <h3 className="text-lg font-semibold mb-2">Billing</h3>
                <p className="text-gray-500 text-sm mb-2">
                  3PL service charges and invoices
                </p>
                <div className="text-2xl font-bold text-purple-600 mb-4">
                  {stats?.billing?.totalInvoices || 0} Invoices
                </div>
                <Button type="primary" className="bg-purple-500 hover:bg-purple-600" icon={<RightOutlined />}>
                  Manage Billing
                </Button>
              </Card>
            </Link>
          </Col>
        </Row>
      </Card>

      {/* Client Details */}
      <Row gutter={16}>
        <Col xs={24} lg={16}>
          <Card title="Client Information">
            <Descriptions column={{ xs: 1, sm: 2, lg: 2 }} bordered size="small">
              <Descriptions.Item label="Company Name" span={2}>
                <strong>{client.name}</strong>
              </Descriptions.Item>
              <Descriptions.Item label="Client Code">
                <span className="font-mono bg-gray-100 px-2 py-1 rounded">{client.code}</span>
              </Descriptions.Item>
              <Descriptions.Item label="Client Type">
                <Tag color={client.type === 'B2B' ? 'blue' : 'green'}>{client.type}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Contact Person">
                {client.contactName || client.contactPerson || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="Tier">
                {client.tier ? (
                  <Tag color={getTierColor(client.tier)}>
                    {getTierIcon(client.tier)} {client.tier}
                  </Tag>
                ) : '-'}
              </Descriptions.Item>
              <Descriptions.Item label="Email">
                {client.email ? (
                  <a href={`mailto:${client.email}`} className="text-blue-600">
                    <MailOutlined /> {client.email}
                  </a>
                ) : '-'}
              </Descriptions.Item>
              <Descriptions.Item label="Phone">
                {client.phone ? (
                  <a href={`tel:${client.phone}`} className="text-blue-600">
                    <PhoneOutlined /> {client.phone}
                  </a>
                ) : '-'}
              </Descriptions.Item>
              <Descriptions.Item label="Country">
                {client.country ? (
                  <span><GlobalOutlined /> {client.country}</span>
                ) : '-'}
              </Descriptions.Item>
              <Descriptions.Item label="City">
                {client.city || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="Address" span={2}>
                {client.address ? (
                  <span><HomeOutlined /> {client.address}</span>
                ) : '-'}
              </Descriptions.Item>
              <Descriptions.Item label="Segment">
                {client.segment ? <Tag color="cyan">{client.segment}</Tag> : '-'}
              </Descriptions.Item>
              <Descriptions.Item label="Status">
                <Tag color={getStatusColor(client.status)} className="uppercase">
                  {client.status || 'active'}
                </Tag>
              </Descriptions.Item>
              {client.notes && (
                <Descriptions.Item label="Notes" span={2}>
                  {client.notes}
                </Descriptions.Item>
              )}
              <Descriptions.Item label="Created">
                {new Date(client.createdAt).toLocaleDateString('en-GB', {
                  day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
                })}
              </Descriptions.Item>
              <Descriptions.Item label="Last Updated">
                {new Date(client.updatedAt).toLocaleDateString('en-GB', {
                  day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
                })}
              </Descriptions.Item>
            </Descriptions>
          </Card>
        </Col>
        <Col xs={24} lg={8}>
          <div className="space-y-4">
            {/* Financial Summary */}
            <Card title="Financial Summary" size="small">
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Credit Limit</span>
                  <span className="font-bold">£{(client.creditLimit || 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Payment Terms</span>
                  <Tag color="blue">{client.paymentTerms || 'Not set'}</Tag>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Available Credit</span>
                  <span className="font-bold text-green-600">
                    £{Math.max(0, creditLimit - creditUsed).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Credit Used</span>
                  <span className="font-bold text-orange-500">
                    £{creditUsed.toLocaleString()}
                  </span>
                </div>
                <Progress
                  percent={creditUtilization}
                  strokeColor={creditUtilization > 80 ? '#ff4d4f' : creditUtilization > 50 ? '#faad14' : '#52c41a'}
                />
              </div>
            </Card>

            {/* 3PL Service Rates */}
            <Card title="3PL Service Rates" size="small">
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Storage (per pallet/month)</span>
                  <span className="font-bold">£{(client.storageRatePerPallet || 15.00).toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Handling (per unit)</span>
                  <span className="font-bold">£{(client.handlingRatePerUnit || 0.50).toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Pick & Pack (per order)</span>
                  <span className="font-bold">£{(client.pickPackRatePerOrder || 2.50).toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Returns Processing</span>
                  <span className="font-bold">£{(client.returnsProcessingRate || 3.00).toFixed(2)}</span>
                </div>
              </div>
            </Card>

            {/* Client Since */}
            <Card size="small">
              <Statistic
                title="Client Since"
                value={new Date(client.createdAt).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })}
                valueStyle={{ color: '#722ed1', fontSize: 24 }}
              />
            </Card>
          </div>
        </Col>
      </Row>

      {/* Edit Modal */}
      <Modal
        title="Edit Client"
        open={editModalOpen}
        onCancel={() => setEditModalOpen(false)}
        onOk={() => form.submit()}
        width={800}
        confirmLoading={saving}
        okText="Save Changes"
      >
        <Form form={form} layout="vertical" onFinish={handleSave}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="Client Name" name="name" rules={[{ required: true, message: 'Please enter client name' }]}>
                <Input placeholder="Enter client name" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Client Type" name="type" rules={[{ required: true, message: 'Please select client type' }]}>
                <Select placeholder="Select type">
                  <Option value="B2B">B2B (Business to Business)</Option>
                  <Option value="B2C">B2C (Business to Consumer)</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="Contact Person" name="contactPerson">
                <Input placeholder="Enter contact person name" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Email" name="email" rules={[{ type: 'email', message: 'Please enter a valid email' }]}>
                <Input placeholder="Enter email" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="Phone" name="phone">
                <Input placeholder="Enter phone number" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Tier" name="tier">
                <Select placeholder="Select tier" allowClear>
                  <Option value="Premium">Premium</Option>
                  <Option value="Gold">Gold</Option>
                  <Option value="Silver">Silver</Option>
                  <Option value="Standard">Standard</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="Country" name="country">
                <Input placeholder="Enter country" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="City" name="city">
                <Input placeholder="Enter city" />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item label="Address" name="address">
            <Input.TextArea placeholder="Enter address" rows={2} />
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="Segment" name="segment">
                <Input placeholder="Enter business segment (e.g., E-commerce, Retail)" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Credit Limit" name="creditLimit">
                <Input type="number" placeholder="Enter credit limit" prefix="£" />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item label="Payment Terms" name="paymentTerms">
            <Select placeholder="Select payment terms" allowClear>
              <Option value="NET30">NET 30 Days</Option>
              <Option value="NET60">NET 60 Days</Option>
              <Option value="NET90">NET 90 Days</Option>
              <Option value="COD">Cash on Delivery</Option>
              <Option value="PREPAID">Prepaid</Option>
            </Select>
          </Form.Item>

          {/* 3PL Rates Section */}
          <div className="bg-gray-50 p-4 rounded-lg mb-4">
            <h4 className="font-semibold mb-3">3PL Service Rates</h4>
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item label="Storage Rate (per pallet/month)" name="storageRatePerPallet">
                  <Input type="number" step="0.01" placeholder="15.00" prefix="£" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item label="Handling Rate (per unit)" name="handlingRatePerUnit">
                  <Input type="number" step="0.01" placeholder="0.50" prefix="£" />
                </Form.Item>
              </Col>
            </Row>
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item label="Pick & Pack Rate (per order)" name="pickPackRatePerOrder">
                  <Input type="number" step="0.01" placeholder="2.50" prefix="£" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item label="Returns Processing Rate" name="returnsProcessingRate">
                  <Input type="number" step="0.01" placeholder="3.00" prefix="£" />
                </Form.Item>
              </Col>
            </Row>
          </div>

          <Form.Item label="Notes" name="notes">
            <Input.TextArea placeholder="Enter any notes" rows={3} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
