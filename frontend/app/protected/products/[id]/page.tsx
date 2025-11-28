'use client';

import React, { useState, useEffect } from 'react';
import {
  Card, Button, Tag, Descriptions, Table, Space, Tabs, Row, Col, Statistic, Spin, Alert,
  Timeline, Empty, Progress, message
} from 'antd';
import {
  ArrowLeftOutlined, EditOutlined, PrinterOutlined, BarChartOutlined,
  HistoryOutlined, InboxOutlined, CalendarOutlined, WarningOutlined, ReloadOutlined,
  BarcodeOutlined, SwapOutlined, ShoppingCartOutlined, ArrowUpOutlined, ArrowDownOutlined
} from '@ant-design/icons';
import { useRouter, useParams } from 'next/navigation';
import { formatCurrency, formatDate, getStatusColor } from '@/lib/utils';
import apiService from '@/services/api';
import Link from 'next/link';
import Barcode from 'react-barcode';
import BarcodeScanner from '@/components/BarcodeScanner';

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
  inventory?: Array<{
    id: string;
    quantity: number;
    availableQuantity: number;
    reservedQuantity: number;
    lotNumber?: string;
    batchNumber?: string;
    bestBeforeDate?: string;
    warehouse: { id: string; name: string; code: string };
    location: { id: string; name: string; code: string; aisle?: string; rack?: string };
  }>;
}

interface HistoryItem {
  id: string;
  type: string;
  quantity: number;
  reason?: string;
  reference?: string;
  createdAt: string;
  warehouse?: { name: string; code: string };
  fromLocation?: { name: string; code: string };
  toLocation?: { name: string; code: string };
  user?: { name: string; email: string };
}

interface Analytics {
  currentStock: {
    totalQuantity: number;
    availableQuantity: number;
    reservedQuantity: number;
    locationCount: number;
  };
  movements30Days: Record<string, { count: number; totalQuantity: number }>;
  orderHistory: {
    totalOrders: number;
    totalQuantitySold: number;
  };
  expiringSoon: Array<{
    id: string;
    lotNumber: string;
    bestBeforeDate: string;
    quantity: number;
    warehouse: string;
    location: string;
    daysUntilExpiry: number;
  }>;
}

interface BarcodeHistory {
  productBarcode: string;
  sku: string;
  name: string;
  batchBarcodes: Array<{
    id: string;
    lotNumber: string;
    batchNumber: string;
    barcode: string;
    bestBeforeDate: string;
    quantity: number;
    warehouse: string;
    location: string;
    receivedAt: string;
  }>;
}

export default function ProductDetailPage() {
  const router = useRouter();
  const params = useParams();
  const [product, setProduct] = useState<Product | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [barcodeData, setBarcodeData] = useState<BarcodeHistory | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('details');

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

  const fetchHistory = async () => {
    try {
      const data = await apiService.get(`/products/${params.id}/history`);
      setHistory(data.history || []);
    } catch (err) {
      console.error('Failed to fetch history:', err);
    }
  };

  const fetchAnalytics = async () => {
    try {
      const data = await apiService.get(`/products/${params.id}/analytics`);
      setAnalytics(data);
    } catch (err) {
      console.error('Failed to fetch analytics:', err);
    }
  };

  const fetchBarcodeHistory = async () => {
    try {
      const data = await apiService.get(`/products/${params.id}/barcode-history`);
      setBarcodeData(data);
    } catch (err) {
      console.error('Failed to fetch barcode history:', err);
    }
  };

  useEffect(() => {
    if (params.id) {
      fetchProduct();
      fetchHistory();
      fetchAnalytics();
      fetchBarcodeHistory();
    }
  }, [params.id]);

  const handleBarcodeScan = async (barcode: string) => {
    try {
      message.loading('Looking up barcode...', 0.5);
      const result = await apiService.get(`/products/barcode/${barcode}`);
      if (result.id !== params.id) {
        message.info(`Found different product: ${result.name}`);
        router.push(`/protected/products/${result.id}`);
      } else {
        message.success(`Barcode matches this product: ${result.name}`);
      }
    } catch (err: any) {
      message.error(err.message || 'Product not found with this barcode');
    }
  };

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

  // Calculate totals from inventory
  const totalStock = product.inventory?.reduce((sum, inv) => sum + (inv.quantity || 0), 0) || 0;
  const totalAvailable = product.inventory?.reduce((sum, inv) => sum + (inv.availableQuantity || 0), 0) || 0;
  const totalReserved = product.inventory?.reduce((sum, inv) => sum + (inv.reservedQuantity || 0), 0) || 0;

  const inventoryColumns = [
    {
      title: 'Warehouse',
      dataIndex: ['warehouse', 'name'],
      key: 'warehouse',
      render: (_: any, record: any) => (
        <span className="font-medium">{record.warehouse?.name || '-'}</span>
      )
    },
    {
      title: 'Location',
      key: 'location',
      render: (_: any, record: any) => (
        <span className="font-mono text-blue-600">
          {record.location?.code || record.location?.name || '-'}
        </span>
      )
    },
    {
      title: 'Lot/Batch',
      dataIndex: 'lotNumber',
      key: 'lotNumber',
      render: (text: string) => <span className="font-mono text-xs">{text || '-'}</span>
    },
    {
      title: 'Quantity',
      dataIndex: 'quantity',
      key: 'quantity',
      render: (qty: number) => <span className="font-semibold">{qty}</span>
    },
    {
      title: 'Available',
      dataIndex: 'availableQuantity',
      key: 'availableQuantity',
      render: (qty: number) => <Tag color="green">{qty}</Tag>
    },
    {
      title: 'Reserved',
      dataIndex: 'reservedQuantity',
      key: 'reservedQuantity',
      render: (qty: number) => qty > 0 ? <Tag color="orange">{qty}</Tag> : <span className="text-gray-400">0</span>
    },
  ];

  // Calculate days until expiry for inventory items
  const inventoryWithExpiry = product.inventory?.map(inv => {
    const daysUntilExpiry = inv.bestBeforeDate
      ? Math.ceil((new Date(inv.bestBeforeDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
      : null;
    return { ...inv, daysUntilExpiry };
  }).sort((a, b) => {
    if (!a.bestBeforeDate) return 1;
    if (!b.bestBeforeDate) return -1;
    return new Date(a.bestBeforeDate).getTime() - new Date(b.bestBeforeDate).getTime();
  }) || [];

  const expiryColumns = [
    {
      title: 'Lot Number',
      dataIndex: 'lotNumber',
      key: 'lotNumber',
      render: (text: string) => <span className="font-mono font-medium text-blue-600">{text || '-'}</span>
    },
    {
      title: 'Best-Before Date',
      dataIndex: 'bestBeforeDate',
      key: 'bestBeforeDate',
      render: (date: string, record: any) => (
        <span className={record.daysUntilExpiry && record.daysUntilExpiry < 180 ? 'text-orange-600 font-semibold' : ''}>
          {date ? formatDate(date) : '-'}
          {record.daysUntilExpiry && record.daysUntilExpiry < 180 && <WarningOutlined className="ml-1" />}
        </span>
      )
    },
    {
      title: 'Days Until Expiry',
      key: 'daysUntilExpiry',
      render: (_: any, record: any) => {
        if (!record.daysUntilExpiry) return <span className="text-gray-400">N/A</span>;
        const days = record.daysUntilExpiry;
        return (
          <Tag color={days < 0 ? 'red' : days < 90 ? 'red' : days < 180 ? 'orange' : 'green'}>
            {days < 0 ? `Expired ${Math.abs(days)} days ago` : `${days} days`}
          </Tag>
        );
      },
      sorter: (a: any, b: any) => (a.daysUntilExpiry || 999) - (b.daysUntilExpiry || 999),
    },
    { title: 'Quantity', dataIndex: 'quantity', key: 'quantity' },
    {
      title: 'Location',
      key: 'location',
      render: (_: any, record: any) => record.location?.code || '-'
    },
    {
      title: 'FEFO Rank',
      key: 'fefoRank',
      render: (_: any, __: any, index: number) => <Tag color="blue">RANK {index + 1}</Tag>
    },
  ];

  const getMovementIcon = (type: string) => {
    switch (type) {
      case 'IN': return <ArrowDownOutlined className="text-green-500" />;
      case 'OUT': return <ArrowUpOutlined className="text-red-500" />;
      case 'TRANSFER': return <SwapOutlined className="text-blue-500" />;
      case 'ADJUSTMENT': return <EditOutlined className="text-orange-500" />;
      default: return <InboxOutlined />;
    }
  };

  const barcodeColumns = [
    {
      title: 'Lot/Batch Number',
      dataIndex: 'lotNumber',
      key: 'lotNumber',
      render: (text: string) => <span className="font-mono font-semibold">{text}</span>
    },
    {
      title: 'Best Before',
      dataIndex: 'bestBeforeDate',
      key: 'bestBeforeDate',
      render: (date: string) => date ? formatDate(date) : '-'
    },
    { title: 'Quantity', dataIndex: 'quantity', key: 'quantity' },
    { title: 'Warehouse', dataIndex: 'warehouse', key: 'warehouse' },
    { title: 'Location', dataIndex: 'location', key: 'location' },
    {
      title: 'Received',
      dataIndex: 'receivedAt',
      key: 'receivedAt',
      render: (date: string) => formatDate(date)
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
          <BarcodeScanner
            onScan={handleBarcodeScan}
            buttonText="Scan Barcode"
            buttonSize="large"
          />
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
          activeKey={activeTab}
          onChange={setActiveTab}
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
                  <Descriptions.Item label="Brand/Category">{product.brand?.name || '-'}</Descriptions.Item>
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
                  <InboxOutlined /> Inventory ({product.inventory?.length || 0})
                </span>
              ),
              children: (
                <div className="space-y-4">
                  <Row gutter={16}>
                    <Col span={8}>
                      <Card size="small">
                        <Statistic title="Total Quantity" value={totalStock} />
                      </Card>
                    </Col>
                    <Col span={8}>
                      <Card size="small">
                        <Statistic title="Available" value={totalAvailable} valueStyle={{ color: '#52c41a' }} />
                      </Card>
                    </Col>
                    <Col span={8}>
                      <Card size="small">
                        <Statistic title="Reserved" value={totalReserved} valueStyle={{ color: '#faad14' }} />
                      </Card>
                    </Col>
                  </Row>
                  {product.inventory && product.inventory.length > 0 ? (
                    <Table
                      dataSource={product.inventory}
                      columns={inventoryColumns}
                      rowKey="id"
                      pagination={false}
                    />
                  ) : (
                    <Empty description="No inventory records found" />
                  )}
                </div>
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
                          title="Batches with Expiry"
                          value={inventoryWithExpiry.filter(i => i.bestBeforeDate).length}
                          suffix={`/ ${inventoryWithExpiry.length} total`}
                        />
                      </Card>
                    </Col>
                    <Col span={8}>
                      <Card>
                        <Statistic
                          title="Expiring Soon (90 days)"
                          value={inventoryWithExpiry.filter(i => i.daysUntilExpiry && i.daysUntilExpiry > 0 && i.daysUntilExpiry <= 90).length}
                          valueStyle={{ color: inventoryWithExpiry.filter(i => i.daysUntilExpiry && i.daysUntilExpiry <= 90).length > 0 ? '#fa541c' : '#52c41a' }}
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

                  <Card title="Stock by Best-Before Date (FEFO Order)" className="shadow-sm">
                    {inventoryWithExpiry.length > 0 ? (
                      <Table
                        dataSource={inventoryWithExpiry}
                        columns={expiryColumns}
                        rowKey="id"
                        pagination={false}
                        scroll={{ x: 900 }}
                      />
                    ) : (
                      <Empty description="No expiry tracking data available" />
                    )}
                  </Card>
                </div>
              ),
            },
            {
              key: 'history',
              label: (
                <span>
                  <HistoryOutlined /> History ({history.length})
                </span>
              ),
              children: (
                <div>
                  {history.length > 0 ? (
                    <Timeline
                      items={history.map(item => ({
                        dot: getMovementIcon(item.type),
                        children: (
                          <div className="pb-4">
                            <div className="flex justify-between items-start">
                              <div>
                                <span className="font-semibold">
                                  <Tag color={item.type === 'IN' ? 'green' : item.type === 'OUT' ? 'red' : 'blue'}>
                                    {item.type}
                                  </Tag>
                                  {item.quantity} units
                                </span>
                                {item.reason && <span className="ml-2 text-gray-500">- {item.reason}</span>}
                              </div>
                              <span className="text-gray-400 text-sm">{formatDate(item.createdAt)}</span>
                            </div>
                            <div className="text-sm text-gray-500 mt-1">
                              {item.warehouse?.name && <span>Warehouse: {item.warehouse.name}</span>}
                              {item.fromLocation && item.toLocation && (
                                <span className="ml-4">
                                  {item.fromLocation.code} → {item.toLocation.code}
                                </span>
                              )}
                              {item.user?.name && <span className="ml-4">By: {item.user.name}</span>}
                            </div>
                            {item.reference && (
                              <div className="text-xs text-gray-400 mt-1">Ref: {item.reference}</div>
                            )}
                          </div>
                        ),
                      }))}
                    />
                  ) : (
                    <Empty
                      image={<HistoryOutlined style={{ fontSize: 48 }} />}
                      description="No movement history available"
                    />
                  )}
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
              children: analytics ? (
                <div className="space-y-6">
                  <Row gutter={16}>
                    <Col span={6}>
                      <Card>
                        <Statistic
                          title="Total Locations"
                          value={analytics.currentStock.locationCount}
                          prefix={<InboxOutlined />}
                        />
                      </Card>
                    </Col>
                    <Col span={6}>
                      <Card>
                        <Statistic
                          title="Available Stock"
                          value={analytics.currentStock.availableQuantity}
                          valueStyle={{ color: '#52c41a' }}
                        />
                      </Card>
                    </Col>
                    <Col span={6}>
                      <Card>
                        <Statistic
                          title="Total Orders"
                          value={analytics.orderHistory.totalOrders}
                          prefix={<ShoppingCartOutlined />}
                        />
                      </Card>
                    </Col>
                    <Col span={6}>
                      <Card>
                        <Statistic
                          title="Total Sold"
                          value={analytics.orderHistory.totalQuantitySold}
                          suffix="units"
                        />
                      </Card>
                    </Col>
                  </Row>

                  <Card title="Movements (Last 30 Days)">
                    <Row gutter={16}>
                      {Object.entries(analytics.movements30Days).map(([type, data]) => (
                        <Col span={6} key={type}>
                          <Statistic
                            title={type}
                            value={data.totalQuantity}
                            suffix={`(${data.count} movements)`}
                            valueStyle={{ color: type === 'IN' ? '#52c41a' : type === 'OUT' ? '#fa541c' : '#1890ff' }}
                          />
                        </Col>
                      ))}
                      {Object.keys(analytics.movements30Days).length === 0 && (
                        <Col span={24}>
                          <Empty description="No movements in the last 30 days" />
                        </Col>
                      )}
                    </Row>
                  </Card>

                  {analytics.expiringSoon.length > 0 && (
                    <Card title="Expiring Soon (Within 90 Days)" className="border-orange-200">
                      <Table
                        dataSource={analytics.expiringSoon}
                        columns={[
                          { title: 'Lot', dataIndex: 'lotNumber', key: 'lot' },
                          { title: 'Expiry', dataIndex: 'bestBeforeDate', key: 'expiry', render: (d: string) => formatDate(d) },
                          {
                            title: 'Days Left',
                            dataIndex: 'daysUntilExpiry',
                            key: 'days',
                            render: (d: number) => <Tag color={d < 30 ? 'red' : 'orange'}>{d} days</Tag>
                          },
                          { title: 'Qty', dataIndex: 'quantity', key: 'qty' },
                          { title: 'Location', dataIndex: 'location', key: 'loc' },
                        ]}
                        rowKey="id"
                        pagination={false}
                        size="small"
                      />
                    </Card>
                  )}
                </div>
              ) : (
                <div className="flex justify-center py-8">
                  <Spin tip="Loading analytics..." />
                </div>
              ),
            },
            {
              key: 'barcodes',
              label: (
                <span>
                  <BarcodeOutlined /> Barcodes
                </span>
              ),
              children: (
                <div className="space-y-6">
                  {/* Main Product Barcode */}
                  <Card title="Product Barcode">
                    <div className="flex items-center gap-8">
                      <div className="text-center">
                        {product.barcode ? (
                          <div className="p-4 bg-white border rounded-lg inline-block">
                            <Barcode value={product.barcode} height={60} width={2} fontSize={14} />
                          </div>
                        ) : (
                          <div className="p-8 bg-gray-100 rounded-lg">
                            <Empty description="No barcode assigned" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1">
                        <Descriptions column={1} size="small">
                          <Descriptions.Item label="Barcode">{product.barcode || 'Not set'}</Descriptions.Item>
                          <Descriptions.Item label="SKU">{product.sku}</Descriptions.Item>
                          <Descriptions.Item label="Product">{product.name}</Descriptions.Item>
                        </Descriptions>
                        <div className="mt-4">
                          <BarcodeScanner
                            onScan={handleBarcodeScan}
                            buttonText="Scan to Verify"
                            buttonType="default"
                          />
                        </div>
                      </div>
                    </div>
                  </Card>

                  {/* Batch Barcodes */}
                  <Card title="Batch/Lot Barcodes">
                    {barcodeData && barcodeData.batchBarcodes.length > 0 ? (
                      <Table
                        dataSource={barcodeData.batchBarcodes}
                        columns={barcodeColumns}
                        rowKey="id"
                        pagination={{ pageSize: 10 }}
                        expandable={{
                          expandedRowRender: (record) => (
                            <div className="p-4 bg-gray-50">
                              <div className="text-center">
                                <Barcode value={record.lotNumber} height={40} width={1.5} fontSize={12} />
                                <p className="mt-2 text-sm text-gray-500">Scan this barcode to identify this specific batch</p>
                              </div>
                            </div>
                          ),
                        }}
                      />
                    ) : (
                      <Empty description="No batch barcodes available" />
                    )}
                  </Card>
                </div>
              ),
            },
          ]}
        />
      </Card>
    </div>
  );
}
