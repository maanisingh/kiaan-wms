'use client';

import React, { useState, useEffect } from 'react';

import {
  Card,
  Button,
  Tag,
  Descriptions,
  Table,
  Space,
  Tabs,
  Row,
  Col,
  Statistic,
  Alert,
  Divider,
} from 'antd';
import {
  ArrowLeftOutlined,
  EditOutlined,
  PrinterOutlined,
  InboxOutlined,
  AppstoreOutlined,
  DollarOutlined,
  PercentageOutlined,
  ShoppingOutlined,
} from '@ant-design/icons';
import { useRouter, useParams } from 'next/navigation';
import { formatCurrency, formatDate, getStatusColor } from '@/lib/utils';
import Link from 'next/link';

export default function BundleDetailPage() {
  const router = useRouter();
  const params = useParams();
  const [bundle, setBundle] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBundleDetails();
  }, [params.id]);

  const fetchBundleDetails = async () => {
    try {
      // TODO: Replace with actual API call
      const response = await fetch(`/api/products/${params.id}?type=BUNDLE`);
      if (response.ok) {
        const data = await response.json();
        setBundle(data);
      }
    } catch (error) {
      console.error('Failed to fetch bundle:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!bundle && !loading) {
    return (
      <div className="text-center py-12">
          <h2 className="text-2xl">Bundle not found</h2>
          <Button className="mt-4" onClick={() => router.push('/products/bundles')}>
            Back to Bundles
          </Button>
        </div>
          );
  }

  // Bundle components columns
  const componentColumns = [
    {
      title: 'Product',
      dataIndex: 'name',
      key: 'name',
      render: (text: string, record: any) => (
        <div>
          <div className="font-medium">{text}</div>
          <div className="text-sm text-gray-500">SKU: {record.sku}</div>
        </div>
      ),
    },
    {
      title: 'Brand',
      dataIndex: 'brand',
      key: 'brand',
      render: (brand: any) => <Tag color="blue">{brand?.name || '-'}</Tag>,
    },
    {
      title: 'Quantity in Bundle',
      dataIndex: 'quantityInBundle',
      key: 'quantityInBundle',
      align: 'center' as const,
      render: (qty: number) => (
        <Tag color="green" className="text-lg font-semibold">
          {qty}x
        </Tag>
      ),
    },
    {
      title: 'Unit Cost',
      dataIndex: 'unitCost',
      key: 'unitCost',
      align: 'right' as const,
      render: (cost: number) => formatCurrency(cost),
    },
    {
      title: 'Total Cost',
      dataIndex: 'totalCost',
      key: 'totalCost',
      align: 'right' as const,
      render: (_: any, record: any) => (
        <span className="font-semibold">
          {formatCurrency(record.unitCost * record.quantityInBundle)}
        </span>
      ),
    },
  ];

  // Mock data for when API isn't available
  const mockComponents = bundle?.components || [
    {
      id: '1',
      sku: 'NAKD-CSHW-BAR',
      name: 'Nakd Cashew Cookie Bar 35g',
      brand: { name: 'Nakd' },
      quantityInBundle: 12,
      unitCost: 0.85,
    },
  ];

  const bundleStats = {
    totalItems: mockComponents.reduce((sum: number, c: any) => sum + c.quantityInBundle, 0),
    totalCost: mockComponents.reduce(
      (sum: number, c: any) => sum + c.unitCost * c.quantityInBundle,
      0
    ),
    sellingPrice: bundle?.sellingPrice || 18.99,
  };

  const margin =
    ((bundleStats.sellingPrice - bundleStats.totalCost) / bundleStats.sellingPrice) * 100;

  return (
    <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-4">
            <Button
              icon={<ArrowLeftOutlined />}
              onClick={() => router.push('/products/bundles')}
            >
              Back to Bundles
            </Button>
            <div>
              <h1 className="text-3xl font-bold">
                {bundle?.name || 'Bundle Details'}
              </h1>
              <p className="text-gray-600 mt-1">
                SKU: {bundle?.sku || params.id} | {bundleStats.totalItems} items per bundle
              </p>
            </div>
          </div>
          <Space>
            <Button icon={<PrinterOutlined />} size="large">
              Print Label
            </Button>
            <Link href={`/products/${params.id}/edit`}>
              <Button icon={<EditOutlined />} type="primary" size="large">
                Edit Bundle
              </Button>
            </Link>
          </Space>
        </div>

        {/* Bundle-Specific Alert */}
        <Alert
          message="Bundle Product - Multi-Pack"
          description="This is a bundle product containing multiple individual items. Bundle picking ensures all items have the same best-before date for wholesale orders."
          type="info"
          showIcon
          icon={<AppstoreOutlined />}
        />

        {/* Statistics */}
        <Row gutter={16}>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="Status"
                value={bundle?.status || 'Active'}
                valueStyle={{
                  color: getStatusColor(bundle?.status || 'active'),
                }}
                prefix={
                  <Tag color={getStatusColor(bundle?.status || 'active')}>
                    {(bundle?.status || 'active').toUpperCase()}
                  </Tag>
                }
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="Items in Bundle"
                value={bundleStats.totalItems}
                prefix={<AppstoreOutlined />}
                suffix="units"
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="Bundle Cost"
                value={bundleStats.totalCost}
                prefix={<DollarOutlined />}
                precision={2}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="Selling Price"
                value={bundleStats.sellingPrice}
                prefix={<DollarOutlined />}
                precision={2}
              />
            </Card>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="Gross Margin"
                value={margin}
                precision={1}
                suffix="%"
                prefix={<PercentageOutlined />}
                valueStyle={{ color: margin > 30 ? '#3f8600' : '#cf1322' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="Profit per Bundle"
                value={bundleStats.sellingPrice - bundleStats.totalCost}
                prefix={<DollarOutlined />}
                precision={2}
                valueStyle={{ color: '#3f8600' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="Available Stock"
                value={bundle?.stock?.available || 0}
                prefix={<InboxOutlined />}
                suffix="bundles"
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="Reserved"
                value={bundle?.stock?.reserved || 0}
                prefix={<ShoppingOutlined />}
                suffix="bundles"
              />
            </Card>
          </Col>
        </Row>

        {/* Bundle Details Tabs */}
        <Card>
          <Tabs
            defaultActiveKey="components"
            items={[
              {
                key: 'components',
                label: (
                  <span>
                    <AppstoreOutlined /> Bundle Components
                  </span>
                ),
                children: (
                  <div className="space-y-4">
                    <Alert
                      message="Bundle Composition"
                      description={`This bundle contains ${bundleStats.totalItems} individual items. Each component must be available with matching best-before dates for wholesale orders.`}
                      type="warning"
                      showIcon
                    />
                    <Table
                      columns={componentColumns}
                      dataSource={mockComponents}
                      rowKey="id"
                      pagination={false}
                      loading={loading}
                      summary={(data) => {
                        const totalCost = data.reduce(
                          (sum, record) =>
                            sum + record.unitCost * record.quantityInBundle,
                          0
                        );
                        return (
                          <Table.Summary fixed>
                            <Table.Summary.Row>
                              <Table.Summary.Cell index={0} colSpan={3}>
                                <strong>Total Bundle Cost</strong>
                              </Table.Summary.Cell>
                              <Table.Summary.Cell index={1} />
                              <Table.Summary.Cell index={2} align="right">
                                <strong className="text-lg">
                                  {formatCurrency(totalCost)}
                                </strong>
                              </Table.Summary.Cell>
                            </Table.Summary.Row>
                          </Table.Summary>
                        );
                      }}
                    />
                  </div>
                ),
              },
              {
                key: 'details',
                label: 'Bundle Details',
                children: (
                  <Descriptions column={2} bordered>
                    <Descriptions.Item label="Bundle SKU">
                      {bundle?.sku || params.id}
                    </Descriptions.Item>
                    <Descriptions.Item label="Barcode">
                      {bundle?.barcode || '-'}
                    </Descriptions.Item>
                    <Descriptions.Item label="Bundle Name" span={2}>
                      {bundle?.name || 'Bundle Product'}
                    </Descriptions.Item>
                    <Descriptions.Item label="Description" span={2}>
                      {bundle?.description || 'Multi-pack bundle product'}
                    </Descriptions.Item>
                    <Descriptions.Item label="Brand">
                      {bundle?.brand?.name || '-'}
                    </Descriptions.Item>
                    <Descriptions.Item label="Type">
                      <Tag color="purple" className="uppercase">
                        BUNDLE
                      </Tag>
                    </Descriptions.Item>
                    <Descriptions.Item label="Status">
                      <Tag
                        color={getStatusColor(bundle?.status || 'active')}
                        className="uppercase"
                      >
                        {bundle?.status || 'Active'}
                      </Tag>
                    </Descriptions.Item>
                    <Descriptions.Item label="Created">
                      {formatDate(
                        bundle?.createdAt || new Date().toISOString()
                      )}
                    </Descriptions.Item>
                    <Descriptions.Item label="Bundle Cost">
                      {formatCurrency(bundleStats.totalCost)}
                    </Descriptions.Item>
                    <Descriptions.Item label="Selling Price">
                      {formatCurrency(bundleStats.sellingPrice)}
                    </Descriptions.Item>
                    <Descriptions.Item label="Gross Margin">
                      <span
                        className={
                          margin > 30 ? 'text-green-600' : 'text-red-600'
                        }
                      >
                        {margin.toFixed(1)}%
                      </span>
                    </Descriptions.Item>
                    <Descriptions.Item label="Profit per Bundle">
                      <span className="text-green-600 font-semibold">
                        {formatCurrency(
                          bundleStats.sellingPrice - bundleStats.totalCost
                        )}
                      </span>
                    </Descriptions.Item>
                  </Descriptions>
                ),
              },
              {
                key: 'pricing',
                label: 'Channel Pricing',
                children: (
                  <div className="space-y-4">
                    <Alert
                      message="Multi-Channel Pricing"
                      description="Set different prices for each sales channel (Amazon FBA, Shopify, eBay, etc.)"
                      type="info"
                      showIcon
                    />
                    <Table
                      columns={[
                        {
                          title: 'Sales Channel',
                          dataIndex: 'channel',
                          key: 'channel',
                        },
                        {
                          title: 'Price',
                          dataIndex: 'price',
                          key: 'price',
                          render: (price: number) => formatCurrency(price),
                        },
                        {
                          title: 'Fees',
                          dataIndex: 'fees',
                          key: 'fees',
                          render: (fees: number) => formatCurrency(fees),
                        },
                        {
                          title: 'Net Profit',
                          dataIndex: 'netProfit',
                          key: 'netProfit',
                          render: (profit: number) => (
                            <span className="text-green-600 font-semibold">
                              {formatCurrency(profit)}
                            </span>
                          ),
                        },
                      ]}
                      dataSource={[
                        {
                          key: '1',
                          channel: 'Amazon FBA UK',
                          price: 18.99,
                          fees: 4.75,
                          netProfit: 3.24,
                        },
                        {
                          key: '2',
                          channel: 'Shopify Retail',
                          price: 16.99,
                          fees: 0.79,
                          netProfit: 5.20,
                        },
                        {
                          key: '3',
                          channel: 'Direct Wholesale',
                          price: 14.99,
                          fees: 0.0,
                          netProfit: 4.0,
                        },
                      ]}
                      pagination={false}
                    />
                  </div>
                ),
              },
              {
                key: 'inventory',
                label: 'Inventory',
                children: (
                  <div className="space-y-4">
                    <Alert
                      message="Bundle Inventory Tracking"
                      description="Bundle inventory is tracked separately. Best-before dates from individual components determine bundle expiry."
                      type="info"
                      showIcon
                    />
                    <Table
                      columns={[
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
                        {
                          title: 'Earliest BB Date',
                          dataIndex: 'bestBeforeDate',
                          key: 'bestBeforeDate',
                          render: (date: string) =>
                            date ? formatDate(date) : '-',
                        },
                      ]}
                      dataSource={[
                        {
                          key: '1',
                          warehouse: 'Main Warehouse',
                          location: 'A-BULK-01',
                          quantity: 45,
                          available: 35,
                          reserved: 10,
                          bestBeforeDate: '2026-08-15',
                        },
                        {
                          key: '2',
                          warehouse: 'FBA Prep Warehouse',
                          location: 'FBA-PREP-05',
                          quantity: 120,
                          available: 120,
                          reserved: 0,
                          bestBeforeDate: '2026-06-08',
                        },
                      ]}
                      pagination={false}
                    />
                  </div>
                ),
              },
            ]}
          />
        </Card>
      </div>
      );
}
