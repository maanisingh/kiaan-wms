'use client';

import React, { useState, useEffect } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Table, Button, Tag, Card, Space, Statistic, Row, Col } from 'antd';
import { PackageOutlined, ShoppingOutlined } from '@ant-design/icons';
import apiService from '@/services/api';
import Link from 'next/link';

export default function BundlesPage() {
  const [bundles, setBundles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBundles();
  }, []);

  const fetchBundles = async () => {
    setLoading(true);
    try {
      const data = await apiService.get('/products?type=BUNDLE');
      setBundles(data || []);
    } catch (error) {
      console.error('Error fetching bundles:', error);
      setBundles([]);
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      title: 'SKU',
      dataIndex: 'sku',
      key: 'sku',
      width: 150,
      render: (text: string, record: any) => (
        <Link href={`/products/${record.id}`} className="text-blue-600 hover:text-blue-800 font-medium">
          {text}
        </Link>
      ),
    },
    {
      title: 'Bundle Name',
      dataIndex: 'name',
      key: 'name',
      width: 300,
    },
    {
      title: 'Brand',
      dataIndex: ['brand', 'name'],
      key: 'brand',
      width: 150,
    },
    {
      title: 'Items in Bundle',
      key: 'items',
      width: 150,
      render: (_: any, record: any) => (
        <Tag color="purple" icon={<PackageOutlined />}>
          {record.bundleItems?.length || 0} items
        </Tag>
      ),
    },
    {
      title: 'Cost Price',
      dataIndex: 'costPrice',
      key: 'cost',
      width: 120,
      render: (price: number) => price ? `£${price.toFixed(2)}` : '-',
    },
    {
      title: 'Selling Price',
      dataIndex: 'sellingPrice',
      key: 'price',
      width: 120,
      render: (price: number) => price ? `£${price.toFixed(2)}` : '-',
    },
    {
      title: 'Margin',
      key: 'margin',
      width: 100,
      render: (_: any, record: any) => {
        if (!record.costPrice || !record.sellingPrice) return '-';
        const margin = ((record.sellingPrice - record.costPrice) / record.sellingPrice * 100);
        const color = margin >= 20 ? 'success' : margin >= 10 ? 'warning' : 'error';
        return <Tag color={color}>{margin.toFixed(1)}%</Tag>;
      },
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => {
        const color = status === 'ACTIVE' ? 'green' : 'red';
        return <Tag color={color}>{status}</Tag>;
      },
    },
  ];

  const totalBundles = bundles.length;
  const activeBundles = bundles.filter((b: any) => b.status === 'ACTIVE').length;
  const avgMargin = bundles.length > 0
    ? bundles.reduce((sum: number, b: any) => {
        if (!b.costPrice || !b.sellingPrice) return sum;
        return sum + ((b.sellingPrice - b.costPrice) / b.sellingPrice * 100);
      }, 0) / bundles.length
    : 0;

  return (
    <MainLayout>
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">Product Bundles</h1>
          <p className="text-gray-500">Multi-pack and bundle products (e.g., 12-packs, cases)</p>
        </div>

        <Row gutter={16} className="mb-6">
          <Col span={8}>
            <Card>
              <Statistic
                title="Total Bundles"
                value={totalBundles}
                prefix={<PackageOutlined />}
              />
            </Card>
          </Col>
          <Col span={8}>
            <Card>
              <Statistic
                title="Active Bundles"
                value={activeBundles}
                valueStyle={{ color: '#3f8600' }}
              />
            </Card>
          </Col>
          <Col span={8}>
            <Card>
              <Statistic
                title="Average Margin"
                value={avgMargin.toFixed(1)}
                suffix="%"
                valueStyle={{ color: avgMargin >= 20 ? '#3f8600' : '#cf1322' }}
              />
            </Card>
          </Col>
        </Row>

        <Card>
          <Table
            columns={columns}
            dataSource={bundles}
            rowKey="id"
            loading={loading}
            pagination={{ pageSize: 20 }}
            expandable={{
              expandedRowRender: (record: any) => (
                <div className="p-4 bg-gray-50">
                  <h4 className="font-semibold mb-2">Bundle Contents:</h4>
                  <ul className="list-disc list-inside">
                    {record.bundleItems?.map((item: any, idx: number) => (
                      <li key={idx}>
                        {item.quantity}x {item.child?.name || 'Unknown Product'} ({item.child?.sku || '-'})
                      </li>
                    ))}
                  </ul>
                </div>
              ),
            }}
          />
        </Card>
      </div>
    </MainLayout>
  );
}
