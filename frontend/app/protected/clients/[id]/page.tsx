'use client';

import React, { useState, useEffect } from 'react';

import { Card, Button, Tag, Descriptions, Table, Space, Tabs, Row, Col, Statistic, Timeline } from 'antd';
import {
  ArrowLeftOutlined,
  EditOutlined,
  MailOutlined,
  PhoneOutlined,
  GlobalOutlined,
  HomeOutlined,
  CheckCircleOutlined,
  ShoppingOutlined,
  FileTextOutlined,
  HistoryOutlined,
  CrownOutlined,
  DollarOutlined,
  ShopOutlined,
} from '@ant-design/icons';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';

export default function ClientDetailPage() {
  const router = useRouter();
  const params = useParams();
  const [client, setClient] = useState<any>(null);

  useEffect(() => {
    // Mock client data
    const mockClient = {
      id: params.id,
      name: 'Amazon FBA UK',
      type: 'B2B',
      contactPerson: 'Account Manager',
      email: 'uk-seller-support@amazon.co.uk',
      phone: '+44 800 279 7234',
      alternativePhone: '+44 800 279 7235',
      website: 'www.amazon.co.uk',
      country: 'United Kingdom',
      city: 'London',
      address: 'Amazon UK Services, 1 Principal Place, Worship Street',
      postcode: 'EC2A 2FA',
      status: 'active',
      tier: 'Premium',
      segment: 'E-commerce Platform',
      totalRevenue: 450000,
      totalOrders: 1250,
      lastOrderDate: '2024-11-19',
      paymentTerms: 'Net 14',
      currency: 'GBP',
      creditLimit: 100000,
      vatNumber: 'GB999 9999 73',
      companyNumber: '04868353',
      badges: ['Premium', 'Verified', 'High Volume', 'FBA'],
      channels: ['Amazon UK', 'Amazon EU'],
      notes: 'Premium FBA client with high volume orders. Requires special labeling for FBA shipments.',
      accountManager: 'John Smith',
      onboardingDate: '2023-01-15',
    };
    setClient(mockClient);
  }, [params.id]);

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

  // Mock products purchased
  const productsData = [
    { id: '1', sku: 'NK-CC-35G', name: 'Nakd Cashew Cookie Bar 35g', unitPrice: 1.20, totalOrdered: 15000, totalRevenue: 18000 },
    { id: '2', sku: 'GR-VB-50G', name: 'Graze Vanilla Bliss 50g', unitPrice: 1.65, totalOrdered: 12500, totalRevenue: 20625 },
    { id: '3', sku: 'KD-DC-40G', name: 'KIND Dark Chocolate Bar 40g', unitPrice: 1.95, totalOrdered: 10000, totalRevenue: 19500 },
    { id: '4', sku: 'NK-CC-12PK', name: 'Nakd Cashew Cookie 12-Pack', unitPrice: 12.50, totalOrdered: 850, totalRevenue: 10625 },
  ];

  // Mock sales orders
  const salesOrdersData = [
    { id: 'SO-2024-5678', date: '2024-11-19', amount: 8250, status: 'shipped', items: 18, channel: 'Amazon UK' },
    { id: 'SO-2024-5623', date: '2024-11-18', amount: 6800, status: 'delivered', items: 15, channel: 'Amazon UK' },
    { id: 'SO-2024-5591', date: '2024-11-16', amount: 9500, status: 'delivered', items: 22, channel: 'Amazon EU' },
    { id: 'SO-2024-5534', date: '2024-11-14', amount: 7200, status: 'delivered', items: 16, channel: 'Amazon UK' },
  ];

  const getTierIcon = (tier: string) => {
    switch (tier) {
      case 'Premium': return <CrownOutlined style={{ color: '#FFD700' }} />;
      case 'Gold': return <CrownOutlined style={{ color: '#FFB800' }} />;
      case 'Silver': return <CrownOutlined style={{ color: '#C0C0C0' }} />;
      default: return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'green';
      case 'pending': return 'orange';
      case 'inactive': return 'red';
      case 'shipped': return 'blue';
      case 'delivered': return 'green';
      default: return 'default';
    }
  };

  const productColumns = [
    { title: 'SKU', dataIndex: 'sku', key: 'sku', render: (text: string) => <span className="font-mono text-blue-600">{text}</span> },
    { title: 'Product Name', dataIndex: 'name', key: 'name', width: 300 },
    { title: 'Unit Price', dataIndex: 'unitPrice', key: 'price', render: (value: number) => `£${value.toFixed(2)}` },
    { title: 'Total Ordered', dataIndex: 'totalOrdered', key: 'totalOrdered', render: (value: number) => value.toLocaleString() },
    { title: 'Total Revenue', dataIndex: 'totalRevenue', key: 'revenue', render: (value: number) => `£${value.toLocaleString()}` },
  ];

  const salesOrderColumns = [
    {
      title: 'SO Number',
      dataIndex: 'id',
      key: 'id',
      render: (text: string) => <Link href={`/sales-orders/${text}`}><span className="font-mono text-blue-600 hover:underline cursor-pointer">{text}</span></Link>
    },
    { title: 'Date', dataIndex: 'date', key: 'date', render: (date: string) => new Date(date).toLocaleDateString('en-GB') },
    { title: 'Amount', dataIndex: 'amount', key: 'amount', render: (value: number) => `£${value.toLocaleString()}` },
    { title: 'Items', dataIndex: 'items', key: 'items' },
    {
      title: 'Channel',
      dataIndex: 'channel',
      key: 'channel',
      render: (channel: string) => <Tag color="purple" icon={<GlobalOutlined />}>{channel}</Tag>
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => <Tag color={getStatusColor(status)} className="uppercase">{status}</Tag>
    },
  ];

  return (
    <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-4">
            <Button
              icon={<ArrowLeftOutlined />}
              onClick={() => router.back()}
            >
              Back
            </Button>
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-2">
                {client.name}
                {getTierIcon(client.tier)}
              </h1>
              <p className="text-gray-600 mt-1">Client ID: {client.id}</p>
            </div>
          </div>
          <Space>
            <Link href={`/clients/${client.id}/edit`}>
              <Button icon={<EditOutlined />} type="primary" size="large">
                Edit Client
              </Button>
            </Link>
          </Space>
        </div>

        {/* Type Badge */}
        <Card>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Tag color={client.type === 'B2B' ? 'blue' : 'green'} style={{ fontSize: 18, padding: '8px 16px' }}>
                <ShopOutlined /> {client.type} Client
              </Tag>
              <Tag color={
                client.tier === 'Premium' ? 'gold' :
                client.tier === 'Gold' ? 'orange' :
                'default'
              } style={{ fontSize: 16, padding: '6px 12px' }}>
                {getTierIcon(client.tier)} {client.tier} Tier
              </Tag>
              <Tag color="cyan" style={{ fontSize: 14, padding: '4px 10px' }}>
                {client.segment}
              </Tag>
            </div>
            <Tag color={getStatusColor(client.status)} style={{ fontSize: 16, padding: '6px 12px' }} className="uppercase">
              <CheckCircleOutlined /> {client.status}
            </Tag>
          </div>
        </Card>

        {/* Status and Stats */}
        <Row gutter={16}>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="Total Revenue (YTD)"
                value={client.totalRevenue}
                prefix="£"
                precision={0}
                valueStyle={{ color: '#9c27b0' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="Total Orders"
                value={client.totalOrders}
                suffix="orders"
                valueStyle={{ color: '#1890ff' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="Credit Limit"
                value={client.creditLimit}
                prefix="£"
                precision={0}
                valueStyle={{ color: '#52c41a' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="Average Order Value"
                value={(client.totalRevenue / client.totalOrders).toFixed(0)}
                prefix="£"
                valueStyle={{ color: '#fa8c16' }}
              />
            </Card>
          </Col>
        </Row>

        {/* Badges */}
        <Card>
          <div className="flex flex-wrap gap-2">
            <span className="font-semibold text-gray-700 mr-2">Badges:</span>
            {client.badges.map((badge: string, i: number) => (
              <Tag key={i} color={
                badge === 'Premium' ? 'gold' :
                badge === 'Verified' ? 'green' :
                badge === 'High Volume' ? 'purple' :
                badge === 'FBA' ? 'blue' :
                'default'
              } style={{ fontSize: 14, padding: '4px 12px' }}>
                {badge === 'Verified' && <CheckCircleOutlined />}
                {' '}{badge}
              </Tag>
            ))}
          </div>
        </Card>

        {/* Client Details */}
        <Card>
          <Tabs
            defaultActiveKey="details"
            items={[
              {
                key: 'details',
                label: 'Client Details',
                children: (
                  <Descriptions column={2} bordered>
                    <Descriptions.Item label="Company Name" span={2}>{client.name}</Descriptions.Item>
                    <Descriptions.Item label="Client Type">
                      <Tag color={client.type === 'B2B' ? 'blue' : 'green'}>{client.type}</Tag>
                    </Descriptions.Item>
                    <Descriptions.Item label="Tier">
                      <Tag color={client.tier === 'Premium' ? 'gold' : client.tier === 'Gold' ? 'orange' : 'default'}>
                        {getTierIcon(client.tier)} {client.tier}
                      </Tag>
                    </Descriptions.Item>
                    <Descriptions.Item label="Contact Person">{client.contactPerson}</Descriptions.Item>
                    <Descriptions.Item label="Account Manager">{client.accountManager}</Descriptions.Item>
                    <Descriptions.Item label="Email">
                      <a href={`mailto:${client.email}`} className="text-blue-600">
                        <MailOutlined /> {client.email}
                      </a>
                    </Descriptions.Item>
                    <Descriptions.Item label="Phone">
                      <a href={`tel:${client.phone}`} className="text-blue-600">
                        <PhoneOutlined /> {client.phone}
                      </a>
                    </Descriptions.Item>
                    <Descriptions.Item label="Alternative Phone">
                      <a href={`tel:${client.alternativePhone}`} className="text-blue-600">
                        <PhoneOutlined /> {client.alternativePhone}
                      </a>
                    </Descriptions.Item>
                    <Descriptions.Item label="Website">
                      <a href={`https://${client.website}`} target="_blank" rel="noopener noreferrer" className="text-blue-600">
                        <GlobalOutlined /> {client.website}
                      </a>
                    </Descriptions.Item>
                    <Descriptions.Item label="Address" span={2}>
                      <HomeOutlined /> {client.address}, {client.city}, {client.postcode}, {client.country}
                    </Descriptions.Item>
                    <Descriptions.Item label="VAT Number">{client.vatNumber}</Descriptions.Item>
                    <Descriptions.Item label="Company Number">{client.companyNumber}</Descriptions.Item>
                    <Descriptions.Item label="Payment Terms">{client.paymentTerms}</Descriptions.Item>
                    <Descriptions.Item label="Currency">{client.currency}</Descriptions.Item>
                    <Descriptions.Item label="Credit Limit">£{client.creditLimit.toLocaleString()}</Descriptions.Item>
                    <Descriptions.Item label="Last Order Date">
                      {new Date(client.lastOrderDate).toLocaleDateString('en-GB')}
                    </Descriptions.Item>
                    <Descriptions.Item label="Onboarding Date">
                      {new Date(client.onboardingDate).toLocaleDateString('en-GB')}
                    </Descriptions.Item>
                    <Descriptions.Item label="Segment">
                      <Tag color="cyan">{client.segment}</Tag>
                    </Descriptions.Item>
                    <Descriptions.Item label="Sales Channels" span={2}>
                      {client.channels.map((channel: string, i: number) => (
                        <Tag key={i} color="purple" icon={<GlobalOutlined />} style={{ margin: '2px' }}>
                          {channel}
                        </Tag>
                      ))}
                    </Descriptions.Item>
                    <Descriptions.Item label="Notes" span={2}>
                      {client.notes}
                    </Descriptions.Item>
                  </Descriptions>
                ),
              },
              {
                key: 'products',
                label: (
                  <span>
                    <ShoppingOutlined /> Products Purchased
                  </span>
                ),
                children: (
                  <Table
                    dataSource={productsData}
                    columns={productColumns}
                    rowKey="id"
                    pagination={{ pageSize: 10 }}
                    summary={(pageData) => {
                      let totalRevenue = 0;
                      let totalOrdered = 0;
                      pageData.forEach(({ totalRevenue: rev, totalOrdered: ord }) => {
                        totalRevenue += rev;
                        totalOrdered += ord;
                      });
                      return (
                        <Table.Summary fixed>
                          <Table.Summary.Row>
                            <Table.Summary.Cell index={0} colSpan={3}><strong>Total</strong></Table.Summary.Cell>
                            <Table.Summary.Cell index={3}>
                              <strong>{totalOrdered.toLocaleString()}</strong>
                            </Table.Summary.Cell>
                            <Table.Summary.Cell index={4}>
                              <strong>£{totalRevenue.toLocaleString()}</strong>
                            </Table.Summary.Cell>
                          </Table.Summary.Row>
                        </Table.Summary>
                      );
                    }}
                  />
                ),
              },
              {
                key: 'orders',
                label: (
                  <span>
                    <FileTextOutlined /> Sales Orders
                  </span>
                ),
                children: (
                  <Table
                    dataSource={salesOrdersData}
                    columns={salesOrderColumns}
                    rowKey="id"
                    pagination={{ pageSize: 10 }}
                  />
                ),
              },
              {
                key: 'history',
                label: (
                  <span>
                    <HistoryOutlined /> Activity History
                  </span>
                ),
                children: (
                  <Timeline
                    items={[
                      {
                        color: 'green',
                        children: (
                          <div>
                            <p className="font-semibold">Sales Order Shipped</p>
                            <p className="text-sm text-gray-500">SO-2024-5678 • 19 Nov 2024</p>
                            <p className="text-xs text-gray-400">18 items shipped via Amazon UK • £8,250</p>
                          </div>
                        ),
                      },
                      {
                        color: 'green',
                        children: (
                          <div>
                            <p className="font-semibold">Sales Order Delivered</p>
                            <p className="text-sm text-gray-500">SO-2024-5623 • 18 Nov 2024</p>
                            <p className="text-xs text-gray-400">15 items delivered • £6,800</p>
                          </div>
                        ),
                      },
                      {
                        color: 'blue',
                        children: (
                          <div>
                            <p className="font-semibold">New Sales Order Created</p>
                            <p className="text-sm text-gray-500">SO-2024-5591 • 16 Nov 2024</p>
                            <p className="text-xs text-gray-400">22 items ordered via Amazon EU • £9,500</p>
                          </div>
                        ),
                      },
                      {
                        color: 'orange',
                        children: (
                          <div>
                            <p className="font-semibold">Credit Limit Increased</p>
                            <p className="text-sm text-gray-500">From £75,000 to £100,000 • 10 Nov 2024</p>
                          </div>
                        ),
                      },
                    ]}
                  />
                ),
              },
            ]}
          />
        </Card>
      </div>
      );
}
