'use client';

import React, { useState, useEffect } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, Button, Tag, Descriptions, Table, Space, Tabs, Row, Col, Statistic } from 'antd';
import {
  ArrowLeftOutlined,
  EditOutlined,
  PrinterOutlined,
  BarChartOutlined,
  HistoryOutlined,
  InboxOutlined,
} from '@ant-design/icons';
import { useRouter, useParams } from 'next/navigation';
import { formatCurrency, formatDate, getStatusColor } from '@/lib/utils';
import { mockProducts } from '@/lib/mockData';
import Link from 'next/link';

export default function ProductDetailPage() {
  const router = useRouter();
  const params = useParams();
  const [product, setProduct] = useState<any>(null);

  useEffect(() => {
    // Simulate fetching product data
    const foundProduct = mockProducts.find((p) => p.id === params.id);
    if (foundProduct) {
      setProduct(foundProduct);
    }
  }, [params.id]);

  if (!product) {
    return (
      <MainLayout>
        <div className="text-center py-12">
          <h2 className="text-2xl">Product not found</h2>
          <Button className="mt-4" onClick={() => router.push('/products')}>
            Back to Products
          </Button>
        </div>
      </MainLayout>
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
    </MainLayout>
  );
}
