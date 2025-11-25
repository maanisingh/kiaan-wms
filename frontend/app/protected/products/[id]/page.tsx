'use client';

import React, { useState, useEffect } from 'react';
import {
  Card, Button, Tag, Descriptions, Table, Space, Tabs, Row, Col, Statistic, Spin, Alert
} from 'antd';
import {
  ArrowLeftOutlined, EditOutlined, PrinterOutlined, BarChartOutlined,
  HistoryOutlined, InboxOutlined, CalendarOutlined, WarningOutlined, ReloadOutlined
} from '@ant-design/icons';
import { useRouter, useParams } from 'next/navigation';
import { formatCurrency, formatDate, getStatusColor } from '@/lib/utils';
import apiService from '@/services/api';
import Link from 'next/link';

interface Product {
  id: string;
  name: string;
  sku: string;
  barcode?: string;
  description?: string;
  type: string;
  status: string;
  costPrice?: number;
  sellingPrice?: number;
  weight?: number;
  weightUnit?: string;
  length?: number;
  width?: number;
  height?: number;
  dimensionUnit?: string;
  reorderPoint?: number;
  maxStockLevel?: number;
  createdAt?: string;
  brand?: { id: string; name: string };
  inventory?: Array<{ quantity: number; warehouseId: string }>;
  _count?: { inventory: number };
}

export default function ProductDetailPage() {
  const router = useRouter();
  const params = useParams();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProduct = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await apiService.get(`/products/${params.id}`);
      setProduct(data);
    } catch (err: any) {
      console.error('Failed to fetch product:', err);
      setError(err.message || 'Failed to load product');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (params.id) {
      fetchProduct();
    }
  }, [params.id]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <Spin size="large" tip="Loading product..." />
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="p-6">
        <Alert
          message="Error Loading Product"
          description={error || 'Product not found'}
          type="error"
          showIcon
          action={
            <Space>
              <Button onClick={fetchProduct} icon={<ReloadOutlined />}>
                Retry
              </Button>
              <Button onClick={() => router.push('/protected/products')}>
                Back to Products
              </Button>
            </Space>
          }
        />
      </div>
    );
  }

  const inventoryColumns = [
    { title: 'Warehouse', dataIndex: 'warehouse', key: 'warehouse' },
    { title: 'Location', dataIndex: 'location', key: 'location' },
    { title: 'Quantity', dataIndex: 'quantity', key: 'quantity' },
    { title: 'Available', dataIndex: 'available', key: 'available' },
    { title: 'Reserved', dataIndex: 'reserved', key: 'reserved' },
  ];

  // Mock inventory data for now
  const inventoryData = [
    { id: '1', warehouse: 'Main Warehouse', location: 'A-01-05', quantity: 150, available: 120, reserved: 30 },
    { id: '2', warehouse: 'Secondary Warehouse', location: 'B-02-10', quantity: 85, available: 85, reserved: 0 },
  ];

  const totalStock = product.inventory?.reduce((sum, inv) => sum + (inv.quantity || 0), 0) ||
    inventoryData.reduce((sum, inv) => sum + inv.quantity, 0);

  // Mock expiry data
  const inventoryWithBBDates = [
    {
      id: '1',
      lotNumber: 'LOT-2024-11-15-001',
      batchNumber: 'BATCH-2024-Q4',
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
      batchNumber: 'BATCH-2024-Q4',
      bestBeforeDate: '2026-08-15',
      quantity: 85,
      location: 'A-02-16-A',
      warehouse: 'Main Warehouse',
      daysUntilExpiry: 269,
      fefoRank: 1
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
    { title: 'Quantity', dataIndex: 'quantity', key: 'quantity' },
    { title: 'Location', dataIndex: 'location', key: 'location' },
    {
      title: 'FEFO Rank',
      dataIndex: 'fefoRank',
      key: 'fefoRank',
      render: (rank: number) => <Tag color="blue">RANK {rank}</Tag>
    },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div className="flex items-center gap-4">
          <Button icon={<ArrowLeftOutlined />} onClick={() => router.back()}>
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
          <Link href={`/protected/products/${product.id}/edit`}>
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
              valueRender={() => (
                <Tag color={getStatusColor(product.status?.toLowerCase() || 'active')} className="text-lg">
                  {product.status?.toUpperCase() || 'ACTIVE'}
                </Tag>
              )}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Total Stock"
              value={totalStock}
              prefix={<InboxOutlined />}
              suffix="units"
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Cost Price"
              value={product.costPrice || 0}
              prefix="£"
              precision={2}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Selling Price"
              value={product.sellingPrice || 0}
              prefix="£"
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
                  <Descriptions.Item label="Brand">{product.brand?.name || '-'}</Descriptions.Item>
                  <Descriptions.Item label="Type">
                    <Tag color="blue" className="uppercase">{product.type || 'SIMPLE'}</Tag>
                  </Descriptions.Item>
                  <Descriptions.Item label="Status">
                    <Tag color={getStatusColor(product.status?.toLowerCase() || 'active')} className="uppercase">
                      {product.status || 'ACTIVE'}
                    </Tag>
                  </Descriptions.Item>
                  <Descriptions.Item label="Created">
                    {product.createdAt ? formatDate(product.createdAt) : '-'}
                  </Descriptions.Item>
                  <Descriptions.Item label="Cost Price">
                    {formatCurrency(product.costPrice || 0)}
                  </Descriptions.Item>
                  <Descriptions.Item label="Selling Price">
                    {formatCurrency(product.sellingPrice || 0)}
                  </Descriptions.Item>
                  <Descriptions.Item label="Weight">
                    {product.weight ? `${product.weight} ${product.weightUnit || 'kg'}` : '-'}
                  </Descriptions.Item>
                  <Descriptions.Item label="Dimensions">
                    {product.length && product.width && product.height
                      ? `${product.length} x ${product.width} x ${product.height} ${product.dimensionUnit || 'cm'}`
                      : '-'
                    }
                  </Descriptions.Item>
                  <Descriptions.Item label="Reorder Point">
                    {product.reorderPoint || '-'}
                  </Descriptions.Item>
                  <Descriptions.Item label="Max Stock Level">
                    {product.maxStockLevel || '-'}
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
                        />
                      </Card>
                    </Col>
                    <Col span={8}>
                      <Card>
                        <Statistic
                          title="FEFO Picking"
                          value="Enabled"
                          valueStyle={{ color: '#52c41a' }}
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
                      scroll={{ x: 900 }}
                    />
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
