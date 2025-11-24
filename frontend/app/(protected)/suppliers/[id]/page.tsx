'use client';

import React, { useState, useEffect } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, Button, Tag, Descriptions, Table, Space, Tabs, Row, Col, Statistic, Timeline, Avatar } from 'antd';
import {
  ArrowLeftOutlined,
  EditOutlined,
  MailOutlined,
  PhoneOutlined,
  GlobalOutlined,
  HomeOutlined,
  StarFilled,
  CheckCircleOutlined,
  ShoppingOutlined,
  FileTextOutlined,
  HistoryOutlined,
} from '@ant-design/icons';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';

export default function SupplierDetailPage() {
  const router = useRouter();
  const params = useParams();
  const [supplier, setSupplier] = useState<any>(null);

  useEffect(() => {
    // Mock supplier data
    const mockSupplier = {
      id: params.id,
      name: 'Global Foods UK Ltd',
      contactPerson: 'John Smith',
      email: 'john.smith@globalfoods.co.uk',
      phone: '+44 20 7123 4567',
      alternativePhone: '+44 20 7123 4568',
      website: 'www.globalfoods.co.uk',
      country: 'United Kingdom',
      city: 'London',
      address: '123 Oxford Street',
      postcode: 'W1D 2HG',
      status: 'active',
      rating: 5,
      category: 'Food & Beverage',
      productsSupplied: 45,
      totalPurchases: 125000,
      lastOrderDate: '2024-11-18',
      paymentTerms: 'Net 30',
      currency: 'GBP',
      creditLimit: 50000,
      vatNumber: 'GB123456789',
      companyNumber: '12345678',
      badges: ['Premium', 'Verified', 'Fast Delivery', 'ISO Certified'],
      channels: ['Amazon UK', 'Shopify', 'Direct'],
      notes: 'Premium supplier with excellent track record. Offers volume discounts on orders over £5,000.',
    };
    setSupplier(mockSupplier);
  }, [params.id]);

  if (!supplier) {
    return (
      <MainLayout>
        <div className="text-center py-12">
          <h2 className="text-2xl">Supplier not found</h2>
          <Button className="mt-4" onClick={() => router.push('/suppliers')}>
            Back to Suppliers
          </Button>
        </div>
      </MainLayout>
    );
  }

  // Mock products supplied
  const productsData = [
    { id: '1', sku: 'NK-CC-35G', name: 'Nakd Cashew Cookie Bar 35g', unitCost: 0.85, lastPurchase: '2024-11-15', totalOrdered: 2500 },
    { id: '2', sku: 'GR-VB-50G', name: 'Graze Vanilla Bliss 50g', unitCost: 1.20, lastPurchase: '2024-11-10', totalOrdered: 1800 },
    { id: '3', sku: 'KD-DC-40G', name: 'KIND Dark Chocolate Bar 40g', unitCost: 1.45, lastPurchase: '2024-11-08', totalOrdered: 1200 },
  ];

  // Mock purchase orders
  const purchaseOrdersData = [
    { id: 'PO-2024-1234', date: '2024-11-18', amount: 5250, status: 'delivered', items: 12 },
    { id: 'PO-2024-1198', date: '2024-11-10', amount: 3800, status: 'delivered', items: 8 },
    { id: 'PO-2024-1156', date: '2024-10-28', amount: 4500, status: 'delivered', items: 10 },
    { id: 'PO-2024-1089', date: '2024-10-15', amount: 6200, status: 'cancelled', items: 15 },
  ];

  const getRatingStars = (rating: number) => {
    return (
      <span className="flex items-center gap-1">
        {[...Array(5)].map((_, i) => (
          <StarFilled
            key={i}
            style={{ color: i < rating ? '#faad14' : '#d9d9d9', fontSize: 18 }}
          />
        ))}
      </span>
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'green';
      case 'pending': return 'orange';
      case 'inactive': return 'red';
      case 'delivered': return 'green';
      case 'cancelled': return 'red';
      default: return 'default';
    }
  };

  const productColumns = [
    { title: 'SKU', dataIndex: 'sku', key: 'sku', render: (text: string) => <span className="font-mono text-blue-600">{text}</span> },
    { title: 'Product Name', dataIndex: 'name', key: 'name', width: 300 },
    { title: 'Unit Cost', dataIndex: 'unitCost', key: 'cost', render: (value: number) => `£${value.toFixed(2)}` },
    { title: 'Last Purchase', dataIndex: 'lastPurchase', key: 'lastPurchase', render: (date: string) => new Date(date).toLocaleDateString('en-GB') },
    { title: 'Total Ordered', dataIndex: 'totalOrdered', key: 'totalOrdered', render: (value: number) => value.toLocaleString() },
  ];

  const purchaseOrderColumns = [
    {
      title: 'PO Number',
      dataIndex: 'id',
      key: 'id',
      render: (text: string) => <Link href={`/purchase-orders/${text}`}><span className="font-mono text-blue-600 hover:underline cursor-pointer">{text}</span></Link>
    },
    { title: 'Date', dataIndex: 'date', key: 'date', render: (date: string) => new Date(date).toLocaleDateString('en-GB') },
    { title: 'Amount', dataIndex: 'amount', key: 'amount', render: (value: number) => `£${value.toLocaleString()}` },
    { title: 'Items', dataIndex: 'items', key: 'items' },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => <Tag color={getStatusColor(status)} className="uppercase">{status}</Tag>
    },
  ];

  return (
    <MainLayout>
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
              <h1 className="text-3xl font-bold">{supplier.name}</h1>
              <p className="text-gray-600 mt-1">Supplier ID: {supplier.id}</p>
            </div>
          </div>
          <Space>
            <Link href={`/suppliers/${supplier.id}/edit`}>
              <Button icon={<EditOutlined />} type="primary" size="large">
                Edit Supplier
              </Button>
            </Link>
          </Space>
        </div>

        {/* Status and Stats */}
        <Row gutter={16}>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="Status"
                value={supplier.status.toUpperCase()}
                valueStyle={{ color: supplier.status === 'active' ? '#52c41a' : '#ff4d4f', fontSize: 18 }}
                prefix={<Tag color={getStatusColor(supplier.status)}>{supplier.status.toUpperCase()}</Tag>}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="Supplier Rating"
                value={`${supplier.rating}.0`}
                prefix={getRatingStars(supplier.rating)}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="Total Purchases (YTD)"
                value={supplier.totalPurchases}
                prefix="£"
                precision={0}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="Products Supplied"
                value={supplier.productsSupplied}
                suffix="items"
              />
            </Card>
          </Col>
        </Row>

        {/* Badges */}
        <Card>
          <div className="flex flex-wrap gap-2">
            <span className="font-semibold text-gray-700 mr-2">Badges:</span>
            {supplier.badges.map((badge: string, i: number) => (
              <Tag key={i} color={
                badge === 'Premium' ? 'gold' :
                badge === 'Verified' ? 'green' :
                badge === 'Fast Delivery' ? 'blue' :
                badge === 'ISO Certified' ? 'purple' :
                'default'
              } style={{ fontSize: 14, padding: '4px 12px' }}>
                {badge === 'Verified' && <CheckCircleOutlined />}
                {' '}{badge}
              </Tag>
            ))}
          </div>
        </Card>

        {/* Supplier Details */}
        <Card>
          <Tabs
            defaultActiveKey="details"
            items={[
              {
                key: 'details',
                label: 'Supplier Details',
                children: (
                  <Descriptions column={2} bordered>
                    <Descriptions.Item label="Company Name" span={2}>{supplier.name}</Descriptions.Item>
                    <Descriptions.Item label="Contact Person">{supplier.contactPerson}</Descriptions.Item>
                    <Descriptions.Item label="Category">
                      <Tag color="blue">{supplier.category}</Tag>
                    </Descriptions.Item>
                    <Descriptions.Item label="Email">
                      <a href={`mailto:${supplier.email}`} className="text-blue-600">
                        <MailOutlined /> {supplier.email}
                      </a>
                    </Descriptions.Item>
                    <Descriptions.Item label="Phone">
                      <a href={`tel:${supplier.phone}`} className="text-blue-600">
                        <PhoneOutlined /> {supplier.phone}
                      </a>
                    </Descriptions.Item>
                    <Descriptions.Item label="Alternative Phone">
                      <a href={`tel:${supplier.alternativePhone}`} className="text-blue-600">
                        <PhoneOutlined /> {supplier.alternativePhone}
                      </a>
                    </Descriptions.Item>
                    <Descriptions.Item label="Website">
                      <a href={`https://${supplier.website}`} target="_blank" rel="noopener noreferrer" className="text-blue-600">
                        <GlobalOutlined /> {supplier.website}
                      </a>
                    </Descriptions.Item>
                    <Descriptions.Item label="Address" span={2}>
                      <HomeOutlined /> {supplier.address}, {supplier.city}, {supplier.postcode}, {supplier.country}
                    </Descriptions.Item>
                    <Descriptions.Item label="VAT Number">{supplier.vatNumber}</Descriptions.Item>
                    <Descriptions.Item label="Company Number">{supplier.companyNumber}</Descriptions.Item>
                    <Descriptions.Item label="Payment Terms">{supplier.paymentTerms}</Descriptions.Item>
                    <Descriptions.Item label="Currency">{supplier.currency}</Descriptions.Item>
                    <Descriptions.Item label="Credit Limit">£{supplier.creditLimit.toLocaleString()}</Descriptions.Item>
                    <Descriptions.Item label="Last Order Date">
                      {new Date(supplier.lastOrderDate).toLocaleDateString('en-GB')}
                    </Descriptions.Item>
                    <Descriptions.Item label="Sales Channels" span={2}>
                      {supplier.channels.map((channel: string, i: number) => (
                        <Tag key={i} color="purple" icon={<GlobalOutlined />} style={{ margin: '2px' }}>
                          {channel}
                        </Tag>
                      ))}
                    </Descriptions.Item>
                    <Descriptions.Item label="Notes" span={2}>
                      {supplier.notes}
                    </Descriptions.Item>
                  </Descriptions>
                ),
              },
              {
                key: 'products',
                label: (
                  <span>
                    <ShoppingOutlined /> Products Supplied
                  </span>
                ),
                children: (
                  <Table
                    dataSource={productsData}
                    columns={productColumns}
                    rowKey="id"
                    pagination={{ pageSize: 10 }}
                  />
                ),
              },
              {
                key: 'orders',
                label: (
                  <span>
                    <FileTextOutlined /> Purchase Orders
                  </span>
                ),
                children: (
                  <Table
                    dataSource={purchaseOrdersData}
                    columns={purchaseOrderColumns}
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
                            <p className="font-semibold">Purchase Order Delivered</p>
                            <p className="text-sm text-gray-500">PO-2024-1234 • 18 Nov 2024</p>
                            <p className="text-xs text-gray-400">12 items delivered on time • £5,250</p>
                          </div>
                        ),
                      },
                      {
                        color: 'blue',
                        children: (
                          <div>
                            <p className="font-semibold">Rating Updated</p>
                            <p className="text-sm text-gray-500">Increased to 5 stars • 15 Nov 2024</p>
                          </div>
                        ),
                      },
                      {
                        color: 'green',
                        children: (
                          <div>
                            <p className="font-semibold">Purchase Order Delivered</p>
                            <p className="text-sm text-gray-500">PO-2024-1198 • 10 Nov 2024</p>
                            <p className="text-xs text-gray-400">8 items delivered • £3,800</p>
                          </div>
                        ),
                      },
                      {
                        color: 'orange',
                        children: (
                          <div>
                            <p className="font-semibold">Payment Terms Changed</p>
                            <p className="text-sm text-gray-500">Changed from Net 45 to Net 30 • 1 Nov 2024</p>
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
    </MainLayout>
  );
}
