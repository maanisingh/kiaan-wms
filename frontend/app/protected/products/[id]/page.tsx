'use client';

import React, { useState, useEffect } from 'react';
import {
  Card, Button, Tag, Descriptions, Table, Space, Tabs, Row, Col, Statistic, Spin, Alert,
  Timeline, Empty, Progress, message, Modal, Form, Input, Select, Switch, Badge, InputNumber
} from 'antd';
import {
  ArrowLeftOutlined, EditOutlined, PrinterOutlined, BarChartOutlined,
  HistoryOutlined, InboxOutlined, CalendarOutlined, WarningOutlined, ReloadOutlined,
  BarcodeOutlined, SwapOutlined, ShoppingCartOutlined, ArrowUpOutlined, ArrowDownOutlined,
  GlobalOutlined, PlusOutlined, DeleteOutlined, TeamOutlined
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
  // Marketplace SKUs
  vatRate?: number;
  vatCode?: string;
  cartonSizes?: number;
  ffdSku?: string;
  ffdSaleSku?: string;
  wsSku?: string;
  amzSku?: string;
  amzSkuBb?: string;
  amzSkuM?: string;
  amzSkuEu?: string;
  onBuySku?: string;
  isHeatSensitive?: boolean;
  isPerishable?: boolean;
  primarySupplierId?: string;
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

interface AlternativeSKU {
  id: string;
  channelType: string;
  channelSKU: string;
  skuType?: string;
  isActive: boolean;
  isPrimary: boolean;
  notes?: string;
  createdAt: string;
}

interface SupplierProduct {
  id: string;
  supplierId: string;
  supplierSku: string;
  supplierName?: string;
  caseSize: number;
  caseCost?: number;
  unitCost?: number;
  isPrimary: boolean;
  leadTimeDays?: number;
  moq?: number;
}

export default function ProductDetailPage() {
  const router = useRouter();
  const params = useParams();
  const [product, setProduct] = useState<Product | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [barcodeData, setBarcodeData] = useState<BarcodeHistory | null>(null);
  const [alternativeSKUs, setAlternativeSKUs] = useState<AlternativeSKU[]>([]);
  const [supplierProducts, setSupplierProducts] = useState<SupplierProduct[]>([]);
  const [suppliers, setSuppliers] = useState<{ id: string; name: string; code: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('details');
  const [showAltSKUModal, setShowAltSKUModal] = useState(false);
  const [editingAltSKU, setEditingAltSKU] = useState<AlternativeSKU | null>(null);
  const [altSKUForm] = Form.useForm();
  const [showSupplierProductModal, setShowSupplierProductModal] = useState(false);
  const [editingSupplierProduct, setEditingSupplierProduct] = useState<SupplierProduct | null>(null);
  const [supplierProductForm] = Form.useForm();

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

  const fetchSupplierProducts = async () => {
    try {
      const data = await apiService.get(`/products/${params.id}/supplier-products`);
      setSupplierProducts(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to fetch supplier products:', err);
    }
  };

  const fetchSuppliers = async () => {
    try {
      const data = await apiService.get('/suppliers');
      setSuppliers(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to fetch suppliers:', err);
    }
  };

  const fetchAlternativeSKUs = async () => {
    try {
      const data = await apiService.get(`/products/${params.id}/alternative-skus`);
      // Backend returns array directly with channelType and channelSKU mapped
      setAlternativeSKUs(Array.isArray(data) ? data : (data.alternativeSKUs || []));
    } catch (err) {
      console.error('Failed to fetch alternative SKUs:', err);
      setAlternativeSKUs([]);
    }
  };

  const handleAddAltSKU = () => {
    setEditingAltSKU(null);
    altSKUForm.resetFields();
    setShowAltSKUModal(true);
  };

  const handleEditAltSKU = (sku: AlternativeSKU) => {
    setEditingAltSKU(sku);
    altSKUForm.setFieldsValue(sku);
    setShowAltSKUModal(true);
  };

  const handleDeleteAltSKU = async (id: string) => {
    try {
      await apiService.delete(`/products/${params.id}/alternative-skus/${id}`);
      message.success('Alternative SKU deleted');
      fetchAlternativeSKUs();
    } catch (err: any) {
      message.error(err.message || 'Failed to delete alternative SKU');
    }
  };

  const handleSaveAltSKU = async (values: any) => {
    try {
      if (editingAltSKU) {
        await apiService.put(`/products/${params.id}/alternative-skus/${editingAltSKU.id}`, values);
        message.success('Alternative SKU updated');
      } else {
        await apiService.post(`/products/${params.id}/alternative-skus`, values);
        message.success('Alternative SKU added');
      }
      setShowAltSKUModal(false);
      fetchAlternativeSKUs();
    } catch (err: any) {
      message.error(err.message || 'Failed to save alternative SKU');
    }
  };

  const handleEditSupplierProduct = (supplierProduct: SupplierProduct) => {
    setEditingSupplierProduct(supplierProduct);
    supplierProductForm.setFieldsValue(supplierProduct);
    setShowSupplierProductModal(true);
  };

  const handleDeleteSupplierProduct = async (id: string) => {
    try {
      await apiService.delete(`/products/${params.id}/supplier-products/${id}`);
      message.success('Supplier product deleted');
      fetchSupplierProducts();
    } catch (err: any) {
      message.error(err.message || 'Failed to delete supplier product');
    }
  };

  const handleSaveSupplierProduct = async (values: any) => {
    try {
      if (editingSupplierProduct) {
        await apiService.put(`/products/${params.id}/supplier-products/${editingSupplierProduct.id}`, values);
        message.success('Supplier product updated');
      } else {
        await apiService.post(`/products/${params.id}/supplier-products`, values);
        message.success('Supplier product added');
      }
      setShowSupplierProductModal(false);
      fetchSupplierProducts();
    } catch (err: any) {
      message.error(err.message || 'Failed to save supplier product');
    }
  };

  useEffect(() => {
    if (params.id) {
      fetchProduct();
      fetchHistory();
      fetchAnalytics();
      fetchBarcodeHistory();
      fetchAlternativeSKUs();
    }
  }, [params.id]);

  useEffect(() => {
    if (params.id && activeTab === 'supplier-products') {
      fetchSupplierProducts();
      fetchSuppliers();
    }
  }, [params.id, activeTab]);

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
                  <Descriptions.Item label="VAT Rate">
                    {product.vatRate !== undefined ? `${product.vatRate}%` : '20%'}
                  </Descriptions.Item>
                  <Descriptions.Item label="VAT Code">
                    {product.vatCode || '-'}
                  </Descriptions.Item>
                  <Descriptions.Item label="Carton Sizes">
                    {product.cartonSizes ? `${product.cartonSizes} units/case` : '-'}
                  </Descriptions.Item>
                  <Descriptions.Item label="Heat Sensitive">
                    {product.isHeatSensitive ? <Tag color="orange">Yes</Tag> : <Tag color="blue">No</Tag>}
                  </Descriptions.Item>
                  <Descriptions.Item label="Perishable">
                    {product.isPerishable ? <Tag color="red">Yes</Tag> : <Tag color="green">No</Tag>}
                  </Descriptions.Item>

                  {/* Marketplace SKUs Section */}
                  {(product.ffdSku || product.wsSku || product.amzSku || product.amzSkuBb || product.amzSkuM || product.amzSkuEu || product.onBuySku || product.ffdSaleSku) && (
                    <>
                      <Descriptions.Item label="FFD SKU" span={2}>
                        <span className="font-mono text-blue-600">{product.ffdSku || '-'}</span>
                      </Descriptions.Item>
                      <Descriptions.Item label="FFD Sale SKU" span={2}>
                        <span className="font-mono text-blue-600">{product.ffdSaleSku || '-'}</span>
                      </Descriptions.Item>
                      <Descriptions.Item label="Wholesale SKU" span={2}>
                        <span className="font-mono text-blue-600">{product.wsSku || '-'}</span>
                      </Descriptions.Item>
                      <Descriptions.Item label="Amazon SKU">
                        <span className="font-mono text-purple-600">{product.amzSku || '-'}</span>
                      </Descriptions.Item>
                      <Descriptions.Item label="Amazon BB Rotation">
                        <span className="font-mono text-orange-600">{product.amzSkuBb || '-'}</span>
                      </Descriptions.Item>
                      <Descriptions.Item label="Amazon MFN">
                        <span className="font-mono text-green-600">{product.amzSkuM || '-'}</span>
                      </Descriptions.Item>
                      <Descriptions.Item label="Amazon EU">
                        <span className="font-mono text-indigo-600">{product.amzSkuEu || '-'}</span>
                      </Descriptions.Item>
                      <Descriptions.Item label="OnBuy SKU" span={2}>
                        <span className="font-mono text-cyan-600">{product.onBuySku || '-'}</span>
                      </Descriptions.Item>
                    </>
                  )}
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
              key: 'locations',
              label: (
                <span>
                  <InboxOutlined /> By Location
                </span>
              ),
              children: (
                <div className="space-y-4">
                  <Card title="Inventory Grouped by Location" className="shadow-sm">
                    {product.inventory && product.inventory.length > 0 ? (
                      (() => {
                        // Group inventory by location
                        const locationGroups = product.inventory.reduce((acc: any, inv: any) => {
                          const locKey = inv.location?.id || 'unassigned';
                          if (!acc[locKey]) {
                            acc[locKey] = {
                              location: inv.location || { code: 'Unassigned', zone: '-' },
                              items: [],
                              totalQuantity: 0,
                              totalAvailable: 0,
                              totalReserved: 0,
                            };
                          }
                          acc[locKey].items.push(inv);
                          acc[locKey].totalQuantity += inv.quantity || 0;
                          acc[locKey].totalAvailable += inv.availableQuantity || 0;
                          acc[locKey].totalReserved += inv.reservedQuantity || 0;
                          return acc;
                        }, {});

                        const locationData = Object.values(locationGroups);

                        return (
                          <Table
                            dataSource={locationData}
                            rowKey={(record: any) => record.location.id || 'unassigned'}
                            pagination={false}
                            expandable={{
                              expandedRowRender: (record: any) => (
                                <Table
                                  dataSource={record.items}
                                  rowKey="id"
                                  size="small"
                                  pagination={false}
                                  columns={[
                                    {
                                      title: 'Batch',
                                      dataIndex: 'batchNumber',
                                      render: (batch: string) => batch || '-',
                                    },
                                    {
                                      title: 'Best Before',
                                      dataIndex: 'bestBeforeDate',
                                      render: (date: string) => date ? formatDate(date) : '-',
                                    },
                                    {
                                      title: 'Quantity',
                                      dataIndex: 'quantity',
                                    },
                                    {
                                      title: 'Available',
                                      dataIndex: 'availableQuantity',
                                      render: (val: number) => <Tag color="green">{val}</Tag>,
                                    },
                                    {
                                      title: 'Reserved',
                                      dataIndex: 'reservedQuantity',
                                      render: (val: number) => val > 0 ? <Tag color="orange">{val}</Tag> : <Tag>0</Tag>,
                                    },
                                  ]}
                                />
                              ),
                            }}
                            columns={[
                              {
                                title: 'Location',
                                key: 'location',
                                render: (_: any, record: any) => (
                                  <div>
                                    <div className="font-semibold text-blue-600">
                                      {record.location.code}
                                    </div>
                                    {record.location.zone && (
                                      <div className="text-xs text-gray-500">
                                        Zone: {record.location.zone}
                                      </div>
                                    )}
                                  </div>
                                ),
                              },
                              {
                                title: 'Type',
                                key: 'type',
                                render: (_: any, record: any) => {
                                  const type = record.location.type || 'PICK';
                                  const colors: Record<string, string> = {
                                    PICK: 'green',
                                    BULK: 'blue',
                                    BULK_LW: 'orange',
                                  };
                                  return <Tag color={colors[type]}>{type}</Tag>;
                                },
                              },
                              {
                                title: 'Batches',
                                key: 'batches',
                                render: (_: any, record: any) => (
                                  <Tag color="purple">{record.items.length}</Tag>
                                ),
                              },
                              {
                                title: 'Total Quantity',
                                dataIndex: 'totalQuantity',
                                render: (val: number) => (
                                  <span className="font-semibold">{val}</span>
                                ),
                              },
                              {
                                title: 'Available',
                                dataIndex: 'totalAvailable',
                                render: (val: number) => (
                                  <Tag color="green" className="font-semibold">{val}</Tag>
                                ),
                              },
                              {
                                title: 'Reserved',
                                dataIndex: 'totalReserved',
                                render: (val: number) => (
                                  val > 0 ? <Tag color="orange" className="font-semibold">{val}</Tag> : <Tag>0</Tag>
                                ),
                              },
                            ]}
                          />
                        );
                      })()
                    ) : (
                      <Empty description="No inventory records found" />
                    )}
                  </Card>

                  {/* Location Info Card */}
                  <Card size="small" className="bg-blue-50 border-blue-200">
                    <div className="text-sm">
                      <strong>📍 Location Types:</strong>
                      <ul className="mt-2 ml-4 list-disc text-gray-700">
                        <li><strong>PICK:</strong> Front-line picking locations for order fulfillment</li>
                        <li><strong>BULK:</strong> Reserve storage for bulk inventory</li>
                        <li><strong>BULK_LW:</strong> Bulk storage with 200kg weight limit (for LightWeight items)</li>
                      </ul>
                    </div>
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
            {
              key: 'alternative-skus',
              label: (
                <span>
                  <GlobalOutlined /> Alternative SKUs ({alternativeSKUs.length})
                </span>
              ),
              children: (
                <div className="space-y-4">
                  <div className="flex justify-between items-center mb-4">
                    <div>
                      <h3 className="text-lg font-semibold">Marketplace & Channel SKUs</h3>
                      <p className="text-sm text-gray-500">
                        Manage alternative SKUs for different sales channels (Amazon, Shopify, eBay, etc.)
                      </p>
                    </div>
                    <Button
                      type="primary"
                      icon={<PlusOutlined />}
                      onClick={handleAddAltSKU}
                    >
                      Add Alternative SKU
                    </Button>
                  </div>

                  {alternativeSKUs.length > 0 ? (
                    <Table
                      dataSource={alternativeSKUs}
                      rowKey="id"
                      pagination={false}
                      columns={[
                        {
                          title: 'Channel',
                          dataIndex: 'channelType',
                          key: 'channel',
                          render: (type: string) => (
                            <Tag color="purple" icon={<GlobalOutlined />}>
                              {type}
                            </Tag>
                          ),
                        },
                        {
                          title: 'Alternative SKU',
                          dataIndex: 'channelSKU',
                          key: 'sku',
                          render: (sku: string) => (
                            <span className="font-mono font-semibold text-blue-600">{sku}</span>
                          ),
                        },
                        {
                          title: 'SKU Type',
                          dataIndex: 'skuType',
                          key: 'type',
                          render: (type: string) => {
                            if (!type) return '-';
                            const colors: Record<string, string> = {
                              'NORMAL': 'blue',
                              'BB_ROTATION': 'orange',
                              'MFN': 'green',
                            };
                            return <Tag color={colors[type] || 'default'}>{type}</Tag>;
                          },
                        },
                        {
                          title: 'Primary',
                          dataIndex: 'isPrimary',
                          key: 'primary',
                          render: (isPrimary: boolean) =>
                            isPrimary ? <Tag color="gold">Primary</Tag> : '-',
                        },
                        {
                          title: 'Status',
                          dataIndex: 'isActive',
                          key: 'status',
                          render: (isActive: boolean) => (
                            <Tag color={isActive ? 'green' : 'red'}>
                              {isActive ? 'Active' : 'Inactive'}
                            </Tag>
                          ),
                        },
                        {
                          title: 'Notes',
                          dataIndex: 'notes',
                          key: 'notes',
                          ellipsis: true,
                          render: (notes: string) => notes || '-',
                        },
                        {
                          title: 'Actions',
                          key: 'actions',
                          render: (_: any, record: AlternativeSKU) => (
                            <Space>
                              <Button
                                size="small"
                                onClick={() => handleEditAltSKU(record)}
                              >
                                Edit
                              </Button>
                              <Button
                                size="small"
                                danger
                                icon={<DeleteOutlined />}
                                onClick={() => {
                                  Modal.confirm({
                                    title: 'Delete Alternative SKU',
                                    content: `Are you sure you want to delete ${record.channelSKU}?`,
                                    onOk: () => handleDeleteAltSKU(record.id),
                                  });
                                }}
                              >
                                Delete
                              </Button>
                            </Space>
                          ),
                        },
                      ]}
                    />
                  ) : (
                    <Empty
                      description="No alternative SKUs configured"
                      image={Empty.PRESENTED_IMAGE_SIMPLE}
                    >
                      <Button type="primary" icon={<PlusOutlined />} onClick={handleAddAltSKU}>
                        Add First Alternative SKU
                      </Button>
                    </Empty>
                  )}

                  {/* Example Amazon 3-SKU System Info */}
                  <Card size="small" className="bg-blue-50 border-blue-200">
                    <div className="text-sm">
                      <strong>Amazon 3-SKU System Example:</strong>
                      <ul className="mt-2 ml-4 list-disc text-gray-700">
                        <li><strong>Normal SKU:</strong> OL_SEL_10_PR (main listing)</li>
                        <li><strong>BB Rotation:</strong> OL_SEL_10_PR_BB (for stock rotation with different best-before dates)</li>
                        <li><strong>MFN:</strong> OL_SEL_10_PR_M (merchant fulfilled network - backup when FBA stock runs out)</li>
                      </ul>
                    </div>
                  </Card>
                </div>
              ),
            },
            {
              key: 'supplier-products',
              label: (
                <span>
                  <TeamOutlined /> Supplier Products
                  {supplierProducts.length > 0 && (
                    <Badge count={supplierProducts.length} style={{ marginLeft: 8 }} />
                  )}
                </span>
              ),
              children: (
                <div className="space-y-4">
                  <div className="flex justify-between items-center mb-4">
                    <div>
                      <h3 className="text-lg font-semibold">Supplier Products</h3>
                      <p className="text-gray-600">
                        Manage supplier relationships, SKUs, and pricing for this product
                      </p>
                    </div>
                    <Button
                      type="primary"
                      icon={<PlusOutlined />}
                      onClick={() => {
                        setEditingSupplierProduct(null);
                        setShowSupplierProductModal(true);
                      }}
                    >
                      Add Supplier Product
                    </Button>
                  </div>

                  {supplierProducts.length > 0 ? (
                    <Table
                      dataSource={supplierProducts}
                      rowKey="id"
                      pagination={false}
                      size="middle"
                      columns={[
                        {
                          title: 'Supplier',
                          key: 'supplier',
                          render: (_: any, record: any) => (
                            <div>
                              <div className="font-semibold">{record.supplier?.name || record.supplierName || 'Unknown Supplier'}</div>
                              {record.supplier?.code && <div className="text-xs text-gray-500">{record.supplier.code}</div>}
                              {record.isPrimary && <Tag color="gold">Primary</Tag>}
                            </div>
                          ),
                        },
                        {
                          title: 'Supplier SKU',
                          dataIndex: 'supplierSku',
                          key: 'supplierSku',
                          render: (sku: string) => (
                            <span className="font-mono text-blue-600">{sku}</span>
                          ),
                        },
                        {
                          title: 'Case Size',
                          dataIndex: 'caseSize',
                          key: 'caseSize',
                          render: (size: number) => `${size} units`,
                        },
                        {
                          title: 'Case Cost',
                          dataIndex: 'caseCost',
                          key: 'caseCost',
                          render: (cost: number) => cost ? `£${cost.toFixed(2)}` : '-',
                        },
                        {
                          title: 'Unit Cost',
                          dataIndex: 'unitCost',
                          key: 'unitCost',
                          render: (cost: number, record: SupplierProduct) => {
                            const calculated = record.caseCost && record.caseSize
                              ? record.caseCost / record.caseSize
                              : cost;
                            return calculated ? `£${calculated.toFixed(4)}` : '-';
                          },
                        },
                        {
                          title: 'Lead Time',
                          dataIndex: 'leadTimeDays',
                          key: 'leadTime',
                          render: (days: number) => days ? `${days} days` : '-',
                        },
                        {
                          title: 'MOQ',
                          dataIndex: 'moq',
                          key: 'moq',
                          render: (moq: number) => moq ? `${moq} units` : '-',
                        },
                        {
                          title: 'Actions',
                          key: 'actions',
                          render: (_: any, record: SupplierProduct) => (
                            <Space>
                              <Button
                                size="small"
                                onClick={() => handleEditSupplierProduct(record)}
                              >
                                Edit
                              </Button>
                              <Button
                                size="small"
                                danger
                                icon={<DeleteOutlined />}
                                onClick={() => {
                                  Modal.confirm({
                                    title: 'Delete Supplier Product',
                                    content: `Are you sure you want to remove ${record.supplierName || 'this supplier'}?`,
                                    onOk: () => handleDeleteSupplierProduct(record.id),
                                  });
                                }}
                              >
                                Delete
                              </Button>
                            </Space>
                          ),
                        },
                      ]}
                    />
                  ) : (
                    <Empty
                      description="No supplier products configured"
                      image={Empty.PRESENTED_IMAGE_SIMPLE}
                    >
                      <Button
                        type="primary"
                        icon={<PlusOutlined />}
                        onClick={() => {
                          setEditingSupplierProduct(null);
                          setShowSupplierProductModal(true);
                        }}
                      >
                        Add First Supplier Product
                      </Button>
                    </Empty>
                  )}

                  {/* Info Card */}
                  <Card size="small" className="bg-green-50 border-green-200">
                    <div className="text-sm">
                      <strong>💡 Supplier Products Help:</strong>
                      <ul className="mt-2 ml-4 list-disc text-gray-700">
                        <li>Link this product to multiple suppliers with their specific SKUs</li>
                        <li>Track case sizes and costs from each supplier</li>
                        <li>Set one supplier as "Primary" for default ordering</li>
                        <li>Monitor lead times and minimum order quantities (MOQ)</li>
                      </ul>
                    </div>
                  </Card>
                </div>
              ),
            },
          ]}
        />
      </Card>

      {/* Alternative SKU Modal */}
      <Modal
        title={editingAltSKU ? 'Edit Alternative SKU' : 'Add Alternative SKU'}
        open={showAltSKUModal}
        onCancel={() => setShowAltSKUModal(false)}
        onOk={() => altSKUForm.submit()}
        width={600}
      >
        <Form
          form={altSKUForm}
          layout="vertical"
          onFinish={handleSaveAltSKU}
          initialValues={{ isActive: true, isPrimary: false }}
        >
          <Form.Item
            label="Channel Type"
            name="channelType"
            rules={[{ required: true, message: 'Please select a channel' }]}
          >
            <Select placeholder="Select marketplace/channel">
              <Select.Option value="AMAZON_FBA">Amazon FBA</Select.Option>
              <Select.Option value="AMAZON_MFN">Amazon MFN (Seller Fulfilled)</Select.Option>
              <Select.Option value="SHOPIFY">Shopify</Select.Option>
              <Select.Option value="EBAY">eBay</Select.Option>
              <Select.Option value="TIKTOK">TikTok Shop</Select.Option>
              <Select.Option value="TEMU">Temu</Select.Option>
              <Select.Option value="OTHER">Other / Direct Sales</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item
            label="Alternative SKU"
            name="channelSKU"
            rules={[{ required: true, message: 'Please enter the alternative SKU' }]}
          >
            <Input placeholder="e.g., OL_SEL_10_PR or FFD_OL_SEL_10_PR" />
          </Form.Item>

          <Form.Item
            label="SKU Type (for Amazon)"
            name="skuType"
            tooltip="Use for Amazon's 3-SKU system: Normal, BB Rotation, or MFN"
          >
            <Select placeholder="Optional - select if Amazon SKU" allowClear>
              <Select.Option value="NORMAL">Normal (main listing)</Select.Option>
              <Select.Option value="BB_ROTATION">BB Rotation (_BB suffix)</Select.Option>
              <Select.Option value="MFN">MFN (_M suffix)</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item label="Primary SKU for this channel" name="isPrimary" valuePropName="checked">
            <Switch />
          </Form.Item>

          <Form.Item label="Active" name="isActive" valuePropName="checked">
            <Switch />
          </Form.Item>

          <Form.Item label="Notes" name="notes">
            <Input.TextArea rows={3} placeholder="Optional notes about this SKU..." />
          </Form.Item>
        </Form>
      </Modal>

      {/* Supplier Product Modal */}
      <Modal
        title={editingSupplierProduct ? 'Edit Supplier Product' : 'Add Supplier Product'}
        open={showSupplierProductModal}
        onCancel={() => setShowSupplierProductModal(false)}
        onOk={() => supplierProductForm.submit()}
        width={700}
      >
        <Form
          form={supplierProductForm}
          layout="vertical"
          onFinish={handleSaveSupplierProduct}
          initialValues={{ isPrimary: false }}
        >
          <Form.Item
            label="Supplier"
            name="supplierId"
            rules={[{ required: true, message: 'Please select a supplier' }]}
          >
            <Select
              placeholder="Select supplier"
              showSearch
              optionFilterProp="label"
              options={suppliers.map(s => ({
                value: s.id,
                label: `${s.name} (${s.code})`
              }))}
            />
          </Form.Item>

          <Form.Item
            label="Supplier SKU"
            name="supplierSku"
            rules={[{ required: true, message: 'Please enter the supplier SKU' }]}
          >
            <Input placeholder="e.g., SUP_12345" />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="Case Size"
                name="caseSize"
                rules={[{ required: true, message: 'Please enter case size' }]}
                tooltip="Number of units per case/carton"
              >
                <InputNumber
                  min={1}
                  style={{ width: '100%' }}
                  placeholder="e.g., 24"
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="Case Cost (£)"
                name="caseCost"
                tooltip="Cost per case from this supplier"
              >
                <InputNumber
                  min={0}
                  step={0.01}
                  style={{ width: '100%' }}
                  placeholder="e.g., 120.00"
                  prefix="£"
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="Lead Time (days)"
                name="leadTimeDays"
                tooltip="Delivery lead time from order to arrival"
              >
                <InputNumber
                  min={0}
                  style={{ width: '100%' }}
                  placeholder="e.g., 7"
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="MOQ (Minimum Order Quantity)"
                name="moq"
                tooltip="Minimum order quantity in units"
              >
                <InputNumber
                  min={0}
                  style={{ width: '100%' }}
                  placeholder="e.g., 100"
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            label="Primary Supplier"
            name="isPrimary"
            valuePropName="checked"
            tooltip="Set as the default supplier for this product"
          >
            <Switch />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
