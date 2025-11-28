'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, Button, Tag, Descriptions, Table, Space, Tabs, Row, Col, Statistic, Spin, Alert, Avatar, List, App, Empty, Timeline, Modal, Form, Input } from 'antd';
import {
  ArrowLeftOutlined,
  EditOutlined,
  MailOutlined,
  PhoneOutlined,
  HomeOutlined,
  StarFilled,
  CheckCircleOutlined,
  ShoppingOutlined,
  FileTextOutlined,
  HistoryOutlined,
  ReloadOutlined,
  ContactsOutlined,
  PlusOutlined,
  ClockCircleOutlined,
  InboxOutlined,
} from '@ant-design/icons';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import apiService from '@/services/api';

interface Supplier {
  id: string;
  code: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  createdAt: string;
  updatedAt: string;
  purchaseOrders?: PurchaseOrder[];
  _count?: { purchaseOrders: number };
}

interface Product {
  id: string;
  name: string;
  sku: string;
  sellingPrice?: number;
  costPrice?: number;
  unitCost?: number;
  status: string;
  brand?: { name: string };
  totalOrdered?: number;
  lastPurchase?: string;
  lastPONumber?: string;
}

interface PurchaseOrder {
  id: string;
  poNumber: string;
  status: string;
  totalAmount: number;
  createdAt: string;
  items?: any[];
  goodsReceipts?: any[];
}

export default function SupplierDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { message } = App.useApp();
  const [supplier, setSupplier] = useState<Supplier | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Products supplied by this supplier
  const [products, setProducts] = useState<Product[]>([]);
  const [productsLoading, setProductsLoading] = useState(false);

  // Purchase orders for this supplier
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);

  // Edit supplier modal
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [editForm] = Form.useForm();

  // Supplier rating from API
  const [ratingData, setRatingData] = useState<{
    rating: number;
    onTimeRate: number;
    qualityRate: number;
    fulfillmentRate: number;
    totalOrders: number;
    completedOrders: number;
  } | null>(null);
  const [ratingLoading, setRatingLoading] = useState(false);

  // Assign products modal
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [assignLoading, setAssignLoading] = useState(false);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);

  // Fetch supplier details
  const fetchSupplier = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await apiService.get(`/suppliers/${params.id}`);
      setSupplier(data);
    } catch (err: any) {
      console.error('Failed to fetch supplier:', err);
      setError(err.message || 'Failed to load supplier details');
    } finally {
      setLoading(false);
    }
  }, [params.id]);

  // Fetch products supplied by this supplier
  const fetchProducts = useCallback(async () => {
    try {
      setProductsLoading(true);
      const data = await apiService.get(`/suppliers/${params.id}/products`);
      setProducts(Array.isArray(data) ? data : []);
    } catch (err: any) {
      console.error('Failed to fetch products:', err);
      setProducts([]);
    } finally {
      setProductsLoading(false);
    }
  }, [params.id]);

  // Fetch purchase orders for this supplier
  const fetchPurchaseOrders = useCallback(async () => {
    try {
      setOrdersLoading(true);
      const data = await apiService.get(`/suppliers/${params.id}/purchase-orders`);
      setPurchaseOrders(Array.isArray(data) ? data : []);
    } catch (err: any) {
      console.error('Failed to fetch purchase orders:', err);
      setPurchaseOrders([]);
    } finally {
      setOrdersLoading(false);
    }
  }, [params.id]);

  // Fetch supplier rating from API
  const fetchRating = useCallback(async () => {
    try {
      setRatingLoading(true);
      const data = await apiService.get(`/suppliers/${params.id}/rating`);
      setRatingData(data);
    } catch (err: any) {
      console.error('Failed to fetch rating:', err);
      setRatingData(null);
    } finally {
      setRatingLoading(false);
    }
  }, [params.id]);

  // Fetch all products for assignment modal
  const fetchAllProducts = async () => {
    try {
      const data = await apiService.get('/products');
      setAllProducts(Array.isArray(data) ? data : (data?.products || []));
    } catch (err: any) {
      console.error('Failed to fetch all products:', err);
      setAllProducts([]);
    }
  };

  // Assign products to supplier
  const handleAssignProducts = async () => {
    try {
      setAssignLoading(true);
      await apiService.put(`/suppliers/${params.id}/products`, { productIds: selectedProductIds });
      message.success('Products assigned to supplier successfully!');
      setAssignModalOpen(false);
      setSelectedProductIds([]);
      fetchProducts(); // Refresh supplier products
    } catch (err: any) {
      console.error('Failed to assign products:', err);
      message.error(err.message || 'Failed to assign products');
    } finally {
      setAssignLoading(false);
    }
  };

  // Open assign products modal
  const openAssignModal = async () => {
    await fetchAllProducts();
    // Pre-select already assigned products
    setSelectedProductIds(products.map(p => p.id));
    setAssignModalOpen(true);
  };

  useEffect(() => {
    fetchSupplier();
    fetchProducts();
    fetchPurchaseOrders();
    fetchRating();
  }, [fetchSupplier, fetchProducts, fetchPurchaseOrders, fetchRating]);

  // Handle edit supplier
  const handleEditSupplier = () => {
    if (supplier) {
      editForm.setFieldsValue({
        name: supplier.name,
        email: supplier.email || '',
        phone: supplier.phone || '',
        address: supplier.address || '',
      });
      setEditModalOpen(true);
    }
  };

  // Submit edit supplier
  const handleEditSubmit = async (values: any) => {
    try {
      setEditLoading(true);
      await apiService.put(`/suppliers/${params.id}`, values);
      message.success('Supplier updated successfully!');
      setEditModalOpen(false);
      fetchSupplier();
    } catch (err: any) {
      console.error('Failed to update supplier:', err);
      message.error(err.message || 'Failed to update supplier');
    } finally {
      setEditLoading(false);
    }
  };

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
    switch (status?.toUpperCase()) {
      case 'ACTIVE': return 'green';
      case 'PENDING': return 'orange';
      case 'DRAFT': return 'default';
      case 'APPROVED': return 'blue';
      case 'RECEIVED': return 'green';
      case 'PARTIALLY_RECEIVED': return 'cyan';
      case 'CANCELLED': return 'red';
      case 'REJECTED': return 'red';
      default: return 'default';
    }
  };

  const productColumns = [
    {
      title: 'SKU',
      dataIndex: 'sku',
      key: 'sku',
      width: 140,
      render: (text: string, record: Product) => (
        <Link href={`/products/${record.id}`} className="font-mono text-blue-600 hover:underline">
          {text}
        </Link>
      )
    },
    {
      title: 'Product Name',
      dataIndex: 'name',
      key: 'name',
      width: 250,
      render: (text: string, record: Product) => (
        <Link href={`/products/${record.id}`} className="hover:text-blue-600 font-medium">
          {text}
        </Link>
      ),
    },
    {
      title: 'Brand',
      dataIndex: ['brand', 'name'],
      key: 'brand',
      width: 120,
      render: (text: string) => text ? <Tag color="purple">{text}</Tag> : '-',
    },
    {
      title: 'Unit Cost',
      dataIndex: 'unitCost',
      key: 'unitCost',
      width: 100,
      render: (value: number, record: Product) => {
        const cost = value || record.costPrice;
        return cost ? `$${cost.toFixed(2)}` : '-';
      }
    },
    {
      title: 'Total Ordered',
      dataIndex: 'totalOrdered',
      key: 'totalOrdered',
      width: 120,
      render: (value: number) => value ? value.toLocaleString() : '-'
    },
    {
      title: 'Last Purchase',
      dataIndex: 'lastPurchase',
      key: 'lastPurchase',
      width: 120,
      render: (date: string) => date ? new Date(date).toLocaleDateString() : '-'
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => (
        <Tag color={status === 'ACTIVE' ? 'green' : 'orange'}>{status}</Tag>
      )
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 100,
      render: (_: any, record: Product) => (
        <Link href={`/products/${record.id}`}>
          <Button type="link" size="small">View</Button>
        </Link>
      )
    },
  ];

  const purchaseOrderColumns = [
    {
      title: 'PO Number',
      dataIndex: 'poNumber',
      key: 'poNumber',
      width: 140,
      render: (text: string, record: PurchaseOrder) => (
        <Link href={`/purchase-orders/${record.id}`} className="font-mono text-blue-600 hover:underline">
          {text}
        </Link>
      )
    },
    {
      title: 'Date',
      dataIndex: 'createdAt',
      key: 'date',
      width: 120,
      render: (date: string) => new Date(date).toLocaleDateString()
    },
    {
      title: 'Items',
      dataIndex: 'items',
      key: 'items',
      width: 80,
      render: (items: any[]) => items?.length || 0
    },
    {
      title: 'Amount',
      dataIndex: 'totalAmount',
      key: 'amount',
      width: 120,
      render: (value: number) => `$${(value || 0).toLocaleString()}`
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 140,
      render: (status: string) => (
        <Tag color={getStatusColor(status)}>{status?.replace('_', ' ')}</Tag>
      )
    },
    {
      title: 'Received',
      dataIndex: 'goodsReceipts',
      key: 'received',
      width: 100,
      render: (receipts: any[]) => {
        if (!receipts || receipts.length === 0) return <Tag>No</Tag>;
        const completed = receipts.some(r => r.status === 'COMPLETED');
        return completed ? <Tag color="green">Yes</Tag> : <Tag color="orange">Partial</Tag>;
      }
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 100,
      render: (_: any, record: PurchaseOrder) => (
        <Link href={`/purchase-orders/${record.id}`}>
          <Button type="link" size="small">View</Button>
        </Link>
      )
    },
  ];

  // Generate activity history from purchase orders
  const generateActivityHistory = () => {
    const activities: any[] = [];

    // Add supplier creation
    if (supplier) {
      activities.push({
        type: 'created',
        date: supplier.createdAt,
        title: 'Supplier Created',
        description: `Supplier "${supplier.name}" was added to the system`,
        color: 'green',
        icon: <CheckCircleOutlined />
      });
    }

    // Add purchase order activities
    purchaseOrders.forEach(po => {
      activities.push({
        type: 'po_created',
        date: po.createdAt,
        title: `Purchase Order ${po.poNumber}`,
        description: `Created with ${po.items?.length || 0} items - $${(po.totalAmount || 0).toLocaleString()}`,
        color: 'blue',
        icon: <FileTextOutlined />,
        link: `/purchase-orders/${po.id}`
      });

      // Add goods receipt activities
      po.goodsReceipts?.forEach(gr => {
        if (gr.receivedDate) {
          activities.push({
            type: 'received',
            date: gr.receivedDate,
            title: `Goods Received for ${po.poNumber}`,
            description: `Status: ${gr.status}`,
            color: gr.status === 'COMPLETED' ? 'green' : 'orange',
            icon: <InboxOutlined />,
            link: `/goods-receiving`
          });
        }
      });
    });

    // Sort by date descending
    activities.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return activities.slice(0, 10); // Show last 10 activities
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <Spin size="large" tip="Loading supplier details..." />
      </div>
    );
  }

  if (error || !supplier) {
    return (
      <div className="p-6">
        <Alert
          message="Error Loading Supplier"
          description={error || 'Supplier not found'}
          type="error"
          showIcon
          action={
            <Space>
              <Button onClick={fetchSupplier} icon={<ReloadOutlined />}>Retry</Button>
              <Button onClick={() => router.push('/suppliers')}>Back to Suppliers</Button>
            </Space>
          }
        />
      </div>
    );
  }

  // Calculate stats
  const totalPurchases = purchaseOrders.reduce((sum, po) => sum + (po.totalAmount || 0), 0);
  // Use rating from API, fallback to calculated
  const supplierRating = ratingData?.rating || (purchaseOrders.length > 5 ? 5 : purchaseOrders.length > 2 ? 4 : 3);
  const activityHistory = generateActivityHistory();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div className="flex items-center gap-4">
          <Button
            icon={<ArrowLeftOutlined />}
            onClick={() => router.push('/suppliers')}
          >
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <ContactsOutlined className="text-blue-600" />
              {supplier.name}
            </h1>
            <p className="text-gray-600 mt-1">
              Supplier Code: <span className="font-mono bg-gray-100 px-2 py-0.5 rounded">{supplier.code}</span>
            </p>
          </div>
        </div>
        <Space>
          <Button icon={<ReloadOutlined />} onClick={() => { fetchSupplier(); fetchProducts(); fetchPurchaseOrders(); }}>
            Refresh
          </Button>
          <Link href={`/purchase-orders`}>
            <Button icon={<PlusOutlined />}>New PO</Button>
          </Link>
          <Button icon={<EditOutlined />} type="primary" size="large" onClick={handleEditSupplier}>
            Edit Supplier
          </Button>
        </Space>
      </div>

      {/* Status and Stats */}
      <Row gutter={16}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Status"
              value="Active"
              valueStyle={{ color: '#52c41a', fontSize: 18 }}
              prefix={<Tag color="green">ACTIVE</Tag>}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Supplier Rating"
              value={`${supplierRating}.0`}
              prefix={getRatingStars(supplierRating)}
              loading={ratingLoading}
            />
            {ratingData && (
              <div className="mt-2 text-xs text-gray-500 space-y-1">
                <div>On-time: {ratingData.onTimeRate}%</div>
                <div>Quality: {ratingData.qualityRate}%</div>
                <div>Fulfillment: {ratingData.fulfillmentRate}%</div>
              </div>
            )}
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Total Purchases"
              value={totalPurchases}
              prefix="$"
              precision={0}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Purchase Orders"
              value={supplier._count?.purchaseOrders || purchaseOrders.length}
              suffix="orders"
            />
          </Card>
        </Col>
      </Row>

      {/* Supplier Details Tabs */}
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
                  <Descriptions.Item label="Supplier Code">
                    <span className="font-mono bg-gray-100 px-2 py-1 rounded">{supplier.code}</span>
                  </Descriptions.Item>
                  <Descriptions.Item label="Email">
                    {supplier.email ? (
                      <a href={`mailto:${supplier.email}`} className="text-blue-600">
                        <MailOutlined /> {supplier.email}
                      </a>
                    ) : <span className="text-gray-400">Not provided</span>}
                  </Descriptions.Item>
                  <Descriptions.Item label="Phone">
                    {supplier.phone ? (
                      <a href={`tel:${supplier.phone}`} className="text-blue-600">
                        <PhoneOutlined /> {supplier.phone}
                      </a>
                    ) : <span className="text-gray-400">Not provided</span>}
                  </Descriptions.Item>
                  <Descriptions.Item label="Address">
                    {supplier.address ? (
                      <span><HomeOutlined /> {supplier.address}</span>
                    ) : <span className="text-gray-400">Not provided</span>}
                  </Descriptions.Item>
                  <Descriptions.Item label="Created">
                    {new Date(supplier.createdAt).toLocaleDateString()}
                  </Descriptions.Item>
                  <Descriptions.Item label="Last Updated">
                    {new Date(supplier.updatedAt).toLocaleDateString()}
                  </Descriptions.Item>
                  <Descriptions.Item label="Total Products Supplied" span={2}>
                    <Tag color="blue">{products.length} products</Tag>
                  </Descriptions.Item>
                </Descriptions>
              ),
            },
            {
              key: 'products',
              label: (
                <span>
                  <ShoppingOutlined /> Products Supplied ({products.length})
                </span>
              ),
              children: (
                <div>
                  <div className="mb-4 flex justify-between items-center">
                    <p className="text-gray-600">Products directly supplied by this vendor (catalog of available products)</p>
                    <Space>
                      <Button type="primary" icon={<PlusOutlined />} onClick={openAssignModal}>
                        Assign Products
                      </Button>
                      <Link href="/products">
                        <Button type="link">View All Products</Button>
                      </Link>
                    </Space>
                  </div>
                  {productsLoading ? (
                    <div className="flex justify-center py-8">
                      <Spin tip="Loading products..." />
                    </div>
                  ) : products.length === 0 ? (
                    <Empty
                      description="No products assigned to this supplier yet. Click 'Assign Products' to add products this supplier can supply."
                      image={Empty.PRESENTED_IMAGE_SIMPLE}
                    >
                      <Button type="primary" icon={<PlusOutlined />} onClick={openAssignModal}>
                        Assign Products to Supplier
                      </Button>
                    </Empty>
                  ) : (
                    <Table
                      dataSource={products}
                      columns={productColumns}
                      rowKey="id"
                      pagination={{ pageSize: 10, showTotal: (total) => `Total ${total} products` }}
                    />
                  )}
                </div>
              ),
            },
            {
              key: 'orders',
              label: (
                <span>
                  <FileTextOutlined /> Purchase Orders ({purchaseOrders.length})
                </span>
              ),
              children: (
                <div>
                  <div className="mb-4 flex justify-between items-center">
                    <p className="text-gray-600">All purchase orders placed with this supplier</p>
                    <Link href={`/purchase-orders`}>
                      <Button type="primary" icon={<PlusOutlined />}>New Purchase Order</Button>
                    </Link>
                  </div>
                  {ordersLoading ? (
                    <div className="flex justify-center py-8">
                      <Spin tip="Loading orders..." />
                    </div>
                  ) : purchaseOrders.length === 0 ? (
                    <Empty
                      description="No purchase orders with this supplier yet"
                      image={Empty.PRESENTED_IMAGE_SIMPLE}
                    >
                      <Link href={`/purchase-orders`}>
                        <Button type="primary" icon={<PlusOutlined />}>Create First Purchase Order</Button>
                      </Link>
                    </Empty>
                  ) : (
                    <Table
                      dataSource={purchaseOrders}
                      columns={purchaseOrderColumns}
                      rowKey="id"
                      pagination={{ pageSize: 10, showTotal: (total) => `Total ${total} orders` }}
                    />
                  )}
                </div>
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
                <div>
                  <p className="text-gray-600 mb-4">Recent activity with this supplier</p>
                  {activityHistory.length === 0 ? (
                    <Empty description="No activity recorded yet" />
                  ) : (
                    <Timeline
                      items={activityHistory.map((activity, index) => ({
                        color: activity.color,
                        dot: <Avatar size="small" icon={activity.icon} style={{ backgroundColor: activity.color === 'green' ? '#52c41a' : activity.color === 'blue' ? '#1890ff' : '#faad14' }} />,
                        children: (
                          <div key={index}>
                            <div className="font-semibold">
                              {activity.link ? (
                                <Link href={activity.link} className="hover:text-blue-600">
                                  {activity.title}
                                </Link>
                              ) : (
                                activity.title
                              )}
                            </div>
                            <div className="text-sm text-gray-500">{activity.description}</div>
                            <div className="text-xs text-gray-400 flex items-center gap-1 mt-1">
                              <ClockCircleOutlined />
                              {new Date(activity.date).toLocaleDateString()} {new Date(activity.date).toLocaleTimeString()}
                            </div>
                          </div>
                        ),
                      }))}
                    />
                  )}
                </div>
              ),
            },
          ]}
        />
      </Card>

      {/* Edit Supplier Modal */}
      <Modal
        title="Edit Supplier"
        open={editModalOpen}
        onCancel={() => {
          setEditModalOpen(false);
          editForm.resetFields();
        }}
        onOk={() => editForm.submit()}
        confirmLoading={editLoading}
        width={600}
      >
        <Form form={editForm} layout="vertical" onFinish={handleEditSubmit}>
          <Form.Item
            label="Supplier Name"
            name="name"
            rules={[{ required: true, message: 'Please enter supplier name' }]}
          >
            <Input placeholder="Enter supplier name" />
          </Form.Item>
          <Form.Item
            label="Email"
            name="email"
            rules={[{ type: 'email', message: 'Please enter a valid email' }]}
          >
            <Input placeholder="Enter email address (optional)" />
          </Form.Item>
          <Form.Item label="Phone" name="phone">
            <Input placeholder="Enter phone number (optional)" />
          </Form.Item>
          <Form.Item label="Address" name="address">
            <Input.TextArea placeholder="Enter address (optional)" rows={3} />
          </Form.Item>
        </Form>
      </Modal>

      {/* Assign Products Modal */}
      <Modal
        title="Assign Products to Supplier"
        open={assignModalOpen}
        onCancel={() => { setAssignModalOpen(false); setSelectedProductIds([]); }}
        onOk={handleAssignProducts}
        confirmLoading={assignLoading}
        width={800}
        okText="Assign Products"
      >
        <p className="mb-4 text-gray-600">
          Select products that this supplier can provide. These will appear in the supplier's product catalog.
        </p>
        <Table
          rowSelection={{
            selectedRowKeys: selectedProductIds,
            onChange: (keys) => setSelectedProductIds(keys as string[]),
          }}
          dataSource={allProducts}
          columns={[
            { title: 'SKU', dataIndex: 'sku', key: 'sku', width: 120 },
            { title: 'Product Name', dataIndex: 'name', key: 'name' },
            {
              title: 'Brand',
              dataIndex: ['brand', 'name'],
              key: 'brand',
              render: (text: string) => text ? <Tag color="purple">{text}</Tag> : '-'
            },
            {
              title: 'Cost Price',
              dataIndex: 'costPrice',
              key: 'costPrice',
              render: (val: number) => val ? `$${val.toFixed(2)}` : '-'
            },
            {
              title: 'Current Supplier',
              dataIndex: 'supplierId',
              key: 'supplierId',
              render: (val: string) => val === params.id ? <Tag color="green">This Supplier</Tag> : (val ? <Tag color="orange">Other</Tag> : '-')
            },
          ]}
          rowKey="id"
          pagination={{ pageSize: 10 }}
          size="small"
        />
        <p className="mt-2 text-xs text-gray-500">
          Selected: {selectedProductIds.length} product(s)
        </p>
      </Modal>
    </div>
  );
}
