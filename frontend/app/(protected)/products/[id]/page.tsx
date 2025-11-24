'use client';

import React from 'react';

import { Card, Button, Tag, Descriptions, Table, Space, Tabs, Row, Col, Statistic, Spin } from 'antd';
import {
  ArrowLeftOutlined,
  EditOutlined,
  PrinterOutlined,
  BarChartOutlined,
  HistoryOutlined,
  InboxOutlined,
  CalendarOutlined,
  WarningOutlined,
} from '@ant-design/icons';
import { useRouter, useParams } from 'next/navigation';
import { formatCurrency, formatDate, getStatusColor } from '@/lib/utils';
import { useQuery } from '@apollo/client';
import { GET_PRODUCT_BY_ID } from '@/lib/graphql/queries';
import Link from 'next/link';

export default function ProductDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { data, loading, error } = useQuery(GET_PRODUCT_BY_ID, {
    variables: { id: params.id as string },
    skip: !params.id,
  });

  const product = data?.Product_by_pk;

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
          <Spin size="large" />
        </div>
      </MainLayout>
    );
  }

  if (error || !product) {
    return (
      <div className="text-center py-12">
          <h2 className="text-2xl">Product not found</h2>
          <p className="text-gray-600 mt-2">{error?.message || 'The product you are looking for does not exist.'}</p>
          <Button className="mt-4" onClick={() => router.push('/products')}>
            Back to Products
          </Button>
        </div>
          );
  }

  const inventoryColumns = [
    {
      title: 'Warehouse',
      dataIndex: 'warehouse',
      key: 'warehouse',
    },
    {
      title: 'Location',
      dataIndex: 'location',
      key: 'location',
    },
    {
      title: 'Quantity',
      dataIndex: 'quantity',
      key: 'quantity',
    },
    {
      title: 'Available',
      dataIndex: 'available',
      key: 'available',
    },
    {
      title: 'Reserved',
      dataIndex: 'reserved',
      key: 'reserved',
    },
  ];

  // Mock inventory data
  const inventoryData = [
    { id: '1', warehouse: 'Main Warehouse', location: 'A-01-05', quantity: 150, available: 120, reserved: 30 },
    { id: '2', warehouse: 'Secondary Warehouse', location: 'B-02-10', quantity: 85, available: 85, reserved: 0 },
  ];

  // Mock inventory data with BB dates (for Expiry tab)
  const inventoryWithBBDates = [
    {
      id: '1',
      lotNumber: 'LOT-2024-11-15-001',
      batchNumber: 'BATCH-NK-2024-Q4',
      bestBeforeDate: '2026-06-08',
      quantity: 120,
      location: 'A-02-15-C',
      warehouse: 'Main Warehouse',
      daysUntilExpiry: 201,
      fefoRank: 2
    },
    {
      id: '2',
      lotNumber: 'LOT-2024-12-01-003',
      batchNumber: 'BATCH-NK-2024-Q4',
      bestBeforeDate: '2026-08-15',
      quantity: 85,
      location: 'A-02-16-A',
      warehouse: 'Main Warehouse',
      daysUntilExpiry: 269,
      fefoRank: 1
    },
    {
      id: '3',
      lotNumber: 'LOT-2024-10-20-005',
      batchNumber: 'BATCH-NK-2024-Q3',
      bestBeforeDate: '2026-04-20',
      quantity: 45,
      location: 'FBA-PREP',
      warehouse: 'FBA Prep Center',
      daysUntilExpiry: 152,
      fefoRank: 3
    },
  ];

  const expiryColumns = [
    {
      title: 'Lot Number',
      dataIndex: 'lotNumber',
      key: 'lotNumber',
      render: (text: string) => <span className="font-mono font-medium text-blue-600">{text}</span>
    },
    {
      title: 'Best-Before Date',
      dataIndex: 'bestBeforeDate',
      key: 'bestBeforeDate',
      render: (date: string, record: any) => (
        <span className={record.daysUntilExpiry < 180 ? 'text-orange-600 font-semibold' : ''}>
          {formatDate(date)} {record.daysUntilExpiry < 180 && <WarningOutlined className="ml-1" />}
        </span>
      )
    },
    {
      title: 'Days Until Expiry',
      dataIndex: 'daysUntilExpiry',
      key: 'daysUntilExpiry',
      render: (days: number) => (
        <Tag color={days < 90 ? 'red' : days < 180 ? 'orange' : 'green'}>
          {days} days
        </Tag>
      ),
      sorter: (a: any, b: any) => a.daysUntilExpiry - b.daysUntilExpiry,
    },
    {
      title: 'Quantity',
      dataIndex: 'quantity',
      key: 'quantity',
    },
    {
      title: 'Location',
      dataIndex: 'location',
      key: 'location',
    },
    {
      title: 'Batch Number',
      dataIndex: 'batchNumber',
      key: 'batchNumber',
      render: (text: string) => <span className="font-mono text-xs">{text}</span>
    },
    {
      title: 'FEFO Rank',
      dataIndex: 'fefoRank',
      key: 'fefoRank',
      render: (rank: number) => <Tag color="blue">RANK {rank}</Tag>
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
              <h1 className="text-3xl font-bold">{product.name}</h1>
              <p className="text-gray-600 mt-1">SKU: {product.sku}</p>
            </div>
          </div>
          <Space>
            <Button icon={<PrinterOutlined />} size="large">
              Print Label
            </Button>
            <Link href={`/products/${product.id}/edit`}>
              <Button icon={<EditOutlined />} type="primary" size="large">
                Edit Product
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
                value={product.status}
                valueStyle={{ color: getStatusColor(product.status) }}
                prefix={<Tag color={getStatusColor(product.status)}>{product.status.toUpperCase()}</Tag>}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="Total Stock"
                value={235}
                prefix={<InboxOutlined />}
                suffix="units"
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="Unit Cost"
                value={product.pricing?.cost || 0}
                prefix="$"
                precision={2}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="Unit Price"
                value={product.pricing?.price || 0}
                prefix="$"
                precision={2}
              />
            </Card>
          </Col>
        </Row>

        {/* Product Details */}
        <Card>
          <Tabs
            defaultActiveKey="details"
            items={[
              {
                key: 'details',
                label: 'Product Details',
                children: (
                  <Descriptions column={2} bordered>
                    <Descriptions.Item label="SKU">{product.sku}</Descriptions.Item>
                    <Descriptions.Item label="Barcode">{product.barcode || '-'}</Descriptions.Item>
                    <Descriptions.Item label="Product Name" span={2}>{product.name}</Descriptions.Item>
                    <Descriptions.Item label="Description" span={2}>
                      {product.description || '-'}
                    </Descriptions.Item>
                    <Descriptions.Item label="Category">{product.category?.name || '-'}</Descriptions.Item>
                    <Descriptions.Item label="Type">
                      <Tag color="blue" className="uppercase">{product.type}</Tag>
                    </Descriptions.Item>
                    <Descriptions.Item label="Status">
                      <Tag color={getStatusColor(product.status)} className="uppercase">
                        {product.status}
                      </Tag>
                    </Descriptions.Item>
                    <Descriptions.Item label="Created">
                      {formatDate(product.createdAt || new Date().toISOString())}
                    </Descriptions.Item>
                    <Descriptions.Item label="Unit Cost">
                      {formatCurrency(product.pricing?.cost || 0)}
                    </Descriptions.Item>
                    <Descriptions.Item label="Unit Price">
                      {formatCurrency(product.pricing?.price || 0)}
                    </Descriptions.Item>
                    <Descriptions.Item label="Weight">
                      {product.dimensions?.weight || '-'} {product.dimensions?.weightUnit || ''}
                    </Descriptions.Item>
                    <Descriptions.Item label="Dimensions">
                      {product.dimensions?.length && product.dimensions?.width && product.dimensions?.height
                        ? `${product.dimensions.length} x ${product.dimensions.width} x ${product.dimensions.height} ${product.dimensions.dimensionUnit || ''}`
                        : '-'
                      }
                    </Descriptions.Item>
                  </Descriptions>
                ),
              },
              {
                key: 'inventory',
                label: (
                  <span>
                    <InboxOutlined /> Inventory
                  </span>
                ),
                children: (
                  <Table
                    dataSource={inventoryData}
                    columns={inventoryColumns}
                    rowKey="id"
                    pagination={false}
                  />
                ),
              },
              {
                key: 'expiry',
                label: (
                  <span>
                    <CalendarOutlined /> Expiry & Tracking
                  </span>
                ),
                children: (
                  <div className="space-y-6">
                    <Row gutter={16}>
                      <Col span={8}>
                        <Card>
                          <Statistic
                            title="Shelf Life"
                            value="365"
                            suffix="days"
                            prefix={<CalendarOutlined />}
                          />
                        </Card>
                      </Col>
                      <Col span={8}>
                        <Card>
                          <Statistic
                            title="Expiry Tracking"
                            value="Enabled"
                            valueStyle={{ color: '#52c41a' }}
                            prefix="✅"
                          />
                        </Card>
                      </Col>
                      <Col span={8}>
                        <Card>
                          <Statistic
                            title="FEFO Picking"
                            value="Enabled"
                            valueStyle={{ color: '#52c41a' }}
                            prefix="✅"
                          />
                        </Card>
                      </Col>
                    </Row>

                    <Card title="Current Stock by Best-Before Date" className="shadow-sm">
                      <Table
                        dataSource={inventoryWithBBDates}
                        columns={expiryColumns}
                        rowKey="id"
                        pagination={false}
                        scroll={{ x: 1000 }}
                      />
                    </Card>

                    <Card title="Expiry Policy" className="shadow-sm">
                      <Descriptions column={1} bordered>
                        <Descriptions.Item label="Default Shelf Life">
                          365 days from manufacturing date
                        </Descriptions.Item>
                        <Descriptions.Item label="Expiry Tracking">
                          <Tag color="green">ENABLED</Tag> - Best-Before dates are tracked for all inventory
                        </Descriptions.Item>
                        <Descriptions.Item label="FEFO Strategy">
                          <Tag color="blue">ENABLED</Tag> - First-Expiry, First-Out picking is enforced
                        </Descriptions.Item>
                        <Descriptions.Item label="Alert Threshold">
                          <Tag color="orange">180 days</Tag> - Alert when stock is within 180 days of expiry
                        </Descriptions.Item>
                      </Descriptions>
                    </Card>
                  </div>
                ),
              },
              {
                key: 'history',
                label: (
                  <span>
                    <HistoryOutlined /> History
                  </span>
                ),
                children: (
                  <div className="text-center py-8 text-gray-500">
                    <HistoryOutlined style={{ fontSize: 48 }} />
                    <p className="mt-4">No history records available</p>
                  </div>
                ),
              },
              {
                key: 'analytics',
                label: (
                  <span>
                    <BarChartOutlined /> Analytics
                  </span>
                ),
                children: (
                  <div className="text-center py-8 text-gray-500">
                    <BarChartOutlined style={{ fontSize: 48 }} />
                    <p className="mt-4">Analytics coming soon</p>
                  </div>
                ),
              },
            ]}
          />
        </Card>
      </div>
      );
}
