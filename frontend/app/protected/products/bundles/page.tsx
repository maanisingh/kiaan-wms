'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Table, Button, Tag, Card, Space, Statistic, Row, Col, Modal, Form,
  Input, Select, message, InputNumber, Drawer, Spin, Alert
} from 'antd';
import {
  BoxPlotOutlined, PlusOutlined, EditOutlined, DeleteOutlined,
  EyeOutlined, MinusCircleOutlined, ReloadOutlined
} from '@ant-design/icons';
import apiService from '@/services/api';

const { Option } = Select;

interface BundleItem {
  id: string;
  quantity: number;
  child: {
    id: string;
    name: string;
    sku: string;
    sellingPrice?: number;
    costPrice?: number;
  };
}

interface Bundle {
  id: string;
  name: string;
  sku: string;
  barcode?: string;
  description?: string;
  sellingPrice?: number;
  costPrice?: number;
  status: string;
  type: string;
  bundleItems?: BundleItem[];
}

interface Product {
  id: string;
  name: string;
  sku: string;
  sellingPrice?: number;
}

export default function BundlesPage() {
  const [bundles, setBundles] = useState<Bundle[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedBundle, setSelectedBundle] = useState<Bundle | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form] = Form.useForm();

  // Fetch bundles (products with type=BUNDLE)
  const fetchBundles = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await apiService.get('/products?type=BUNDLE');
      setBundles(Array.isArray(data) ? data : []);
    } catch (err: any) {
      console.error('Failed to fetch bundles:', err);
      setError(err.message || 'Failed to load bundles');
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch simple products for bundle components
  const fetchProducts = useCallback(async () => {
    try {
      const data = await apiService.get('/products?type=SIMPLE');
      setProducts(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to fetch products:', err);
    }
  }, []);

  useEffect(() => {
    fetchBundles();
    fetchProducts();
  }, [fetchBundles, fetchProducts]);

  const handleSubmit = async (values: any) => {
    try {
      setSaving(true);

      const bundleData = {
        name: values.name,
        sku: values.sku,
        description: values.description || null,
        sellingPrice: parseFloat(values.sellingPrice) || 0,
        costPrice: parseFloat(values.costPrice) || 0,
        status: values.status,
        type: 'BUNDLE',
        bundleItems: values.bundleItems?.map((item: any) => ({
          productId: item.productId,
          quantity: parseInt(item.quantity),
        })),
      };

      if (selectedBundle) {
        // UPDATE existing bundle
        await apiService.put(`/products/${selectedBundle.id}`, bundleData);
        message.success('Bundle updated successfully!');
      } else {
        // CREATE new bundle
        await apiService.post('/products', bundleData);
        message.success('Bundle created successfully!');
      }

      form.resetFields();
      setModalOpen(false);
      setSelectedBundle(null);
      fetchBundles();
    } catch (err: any) {
      console.error('Error saving bundle:', err);
      message.error(err.message || 'Failed to save bundle');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (record: Bundle) => {
    setSelectedBundle(record);
    form.setFieldsValue({
      name: record.name,
      sku: record.sku,
      description: record.description,
      sellingPrice: record.sellingPrice,
      costPrice: record.costPrice,
      status: record.status,
      bundleItems: record.bundleItems?.map((item) => ({
        productId: item.child.id,
        quantity: item.quantity,
      })),
    });
    setModalOpen(true);
  };

  const handleDelete = (record: Bundle) => {
    Modal.confirm({
      title: 'Delete Bundle',
      content: `Are you sure you want to delete bundle "${record.name}"? This will also delete all bundle items.`,
      okText: 'Delete',
      okType: 'danger',
      onOk: async () => {
        try {
          await apiService.delete(`/products/${record.id}`);
          message.success('Bundle deleted successfully!');
          fetchBundles();
        } catch (err: any) {
          message.error(err.message || 'Failed to delete bundle');
        }
      },
    });
  };

  const handleAddBundle = () => {
    setSelectedBundle(null);
    form.resetFields();
    form.setFieldsValue({ status: 'ACTIVE', bundleItems: [{}] });
    setModalOpen(true);
  };

  const columns = [
    {
      title: 'SKU',
      dataIndex: 'sku',
      key: 'sku',
      width: 130,
      render: (text: string) => <span className="font-medium">{text}</span>,
    },
    {
      title: 'Bundle Name',
      dataIndex: 'name',
      key: 'name',
      width: 220,
      ellipsis: true,
    },
    {
      title: 'Items',
      key: 'items',
      width: 90,
      align: 'center' as const,
      render: (_: any, record: Bundle) => (
        <Tag color="purple" icon={<BoxPlotOutlined />}>
          {record.bundleItems?.length || 0}
        </Tag>
      ),
    },
    {
      title: 'Cost Price',
      dataIndex: 'costPrice',
      key: 'cost',
      width: 110,
      align: 'right' as const,
      render: (price: number) => (price ? `£${price.toFixed(2)}` : '-'),
    },
    {
      title: 'Selling Price',
      dataIndex: 'sellingPrice',
      key: 'price',
      width: 120,
      align: 'right' as const,
      render: (price: number) => (price ? `£${price.toFixed(2)}` : '-'),
    },
    {
      title: 'Margin',
      key: 'margin',
      width: 90,
      align: 'center' as const,
      render: (_: any, record: Bundle) => {
        if (!record.costPrice || !record.sellingPrice) return '-';
        const margin = ((record.sellingPrice - record.costPrice) / record.sellingPrice) * 100;
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
    {
      title: 'Actions',
      key: 'actions',
      width: 200,
      fixed: 'right' as const,
      render: (_: any, record: Bundle) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => {
              setSelectedBundle(record);
              setDrawerOpen(true);
            }}
          >
            View
          </Button>
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)}>
            Edit
          </Button>
          <Button type="link" size="small" danger icon={<DeleteOutlined />} onClick={() => handleDelete(record)}>
            Delete
          </Button>
        </Space>
      ),
    },
  ];

  const totalBundles = bundles.length;
  const activeBundles = bundles.filter((b) => b.status === 'ACTIVE').length;
  const avgMargin =
    bundles.length > 0
      ? bundles.reduce((sum, b) => {
          if (!b.costPrice || !b.sellingPrice) return sum;
          return sum + ((b.sellingPrice - b.costPrice) / b.sellingPrice) * 100;
        }, 0) / bundles.length
      : 0;

  if (loading && bundles.length === 0) {
    return (
      <div className="flex justify-center items-center h-96">
        <Spin size="large" tip="Loading bundles..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <Alert
          message="Error Loading Bundles"
          description={error}
          type="error"
          showIcon
          action={
            <Button onClick={fetchBundles} icon={<ReloadOutlined />}>
              Retry
            </Button>
          }
        />
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
            Product Bundles
          </h1>
          <p className="text-gray-600 mt-1">Multi-pack and bundle products (e.g., 12-packs, cases)</p>
        </div>
        <Space>
          <Button icon={<ReloadOutlined />} onClick={fetchBundles} loading={loading}>
            Refresh
          </Button>
          <Button type="primary" icon={<PlusOutlined />} size="large" onClick={handleAddBundle}>
            Create Bundle
          </Button>
        </Space>
      </div>

      {/* Stats */}
      <Row gutter={16} className="mb-6">
        <Col span={8}>
          <Card>
            <Statistic title="Total Bundles" value={totalBundles} prefix={<BoxPlotOutlined />} />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic title="Active Bundles" value={activeBundles} valueStyle={{ color: '#3f8600' }} />
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

      {/* Table */}
      <Card>
        <Table
          columns={columns}
          dataSource={bundles}
          rowKey="id"
          loading={loading}
          scroll={{ x: 1100 }}
          pagination={{ pageSize: 20, showSizeChanger: true }}
          expandable={{
            expandedRowRender: (record: Bundle) => (
              <div className="p-4 bg-gray-50">
                <h4 className="font-semibold mb-2">Bundle Contents:</h4>
                {record.bundleItems && record.bundleItems.length > 0 ? (
                  <ul className="list-disc list-inside">
                    {record.bundleItems.map((item) => (
                      <li key={item.id}>
                        {item.quantity}x {item.child?.name || 'Unknown Product'} ({item.child?.sku || '-'}) - £
                        {item.child?.sellingPrice?.toFixed(2) || '0.00'}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-gray-500">No items in this bundle</p>
                )}
              </div>
            ),
          }}
        />
      </Card>

      {/* Details Drawer */}
      <Drawer title="Bundle Details" placement="right" width={600} open={drawerOpen} onClose={() => setDrawerOpen(false)}>
        {selectedBundle && (
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold text-lg">{selectedBundle.name}</h3>
              <p className="text-gray-600">SKU: {selectedBundle.sku}</p>
            </div>
            <div className="border-t pt-4 space-y-2">
              <p>
                <strong>Description:</strong> {selectedBundle.description || 'Not provided'}
              </p>
              <p>
                <strong>Cost Price:</strong> £{selectedBundle.costPrice?.toFixed(2) || '0.00'}
              </p>
              <p>
                <strong>Selling Price:</strong> £{selectedBundle.sellingPrice?.toFixed(2) || '0.00'}
              </p>
              <p>
                <strong>Status:</strong>{' '}
                <Tag color={selectedBundle.status === 'ACTIVE' ? 'green' : 'red'}>{selectedBundle.status}</Tag>
              </p>
              <div className="border-t pt-4">
                <p className="font-semibold mb-2">Bundle Contents ({selectedBundle.bundleItems?.length} items):</p>
                {selectedBundle.bundleItems && selectedBundle.bundleItems.length > 0 ? (
                  <ul className="list-disc list-inside space-y-1">
                    {selectedBundle.bundleItems.map((item) => (
                      <li key={item.id}>
                        {item.quantity}x {item.child?.name} ({item.child?.sku})
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-gray-500">No items in this bundle</p>
                )}
              </div>
            </div>
          </div>
        )}
      </Drawer>

      {/* Add/Edit Modal */}
      <Modal
        title={selectedBundle ? 'Edit Bundle' : 'Create Bundle'}
        open={modalOpen}
        onCancel={() => {
          setModalOpen(false);
          setSelectedBundle(null);
          form.resetFields();
        }}
        onOk={() => form.submit()}
        width={800}
        confirmLoading={saving}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <div className="grid grid-cols-2 gap-4">
            <Form.Item label="Bundle Name" name="name" rules={[{ required: true, message: 'Please enter bundle name' }]}>
              <Input placeholder="e.g., Variety Pack 12x330ml" />
            </Form.Item>

            <Form.Item label="SKU" name="sku" rules={[{ required: true, message: 'Please enter SKU' }]}>
              <Input placeholder="e.g., BUNDLE-001" />
            </Form.Item>
          </div>

          <Form.Item label="Description" name="description">
            <Input.TextArea placeholder="Enter bundle description (optional)" rows={2} />
          </Form.Item>

          <div className="grid grid-cols-3 gap-4">
            <Form.Item label="Cost Price" name="costPrice" rules={[{ required: true, message: 'Required' }]}>
              <InputNumber style={{ width: '100%' }} prefix="£" placeholder="0.00" min={0} step={0.01} />
            </Form.Item>

            <Form.Item label="Selling Price" name="sellingPrice" rules={[{ required: true, message: 'Required' }]}>
              <InputNumber style={{ width: '100%' }} prefix="£" placeholder="0.00" min={0} step={0.01} />
            </Form.Item>

            <Form.Item label="Status" name="status" rules={[{ required: true, message: 'Required' }]}>
              <Select>
                <Option value="ACTIVE">Active</Option>
                <Option value="INACTIVE">Inactive</Option>
              </Select>
            </Form.Item>
          </div>

          <div className="border-t pt-4 mt-4">
            <h4 className="font-semibold mb-3">Bundle Components</h4>
            <Form.List name="bundleItems">
              {(fields, { add, remove }) => (
                <>
                  {fields.map(({ key, name, ...restField }) => (
                    <div key={key} className="flex gap-2 mb-2">
                      <Form.Item
                        {...restField}
                        name={[name, 'productId']}
                        rules={[{ required: true, message: 'Select product' }]}
                        style={{ flex: 2 }}
                      >
                        <Select
                          placeholder="Select product"
                          showSearch
                          filterOption={(input, option: any) =>
                            option.children.toLowerCase().includes(input.toLowerCase())
                          }
                        >
                          {products.map((p) => (
                            <Option key={p.id} value={p.id}>
                              {p.name} ({p.sku})
                            </Option>
                          ))}
                        </Select>
                      </Form.Item>
                      <Form.Item
                        {...restField}
                        name={[name, 'quantity']}
                        rules={[{ required: true, message: 'Qty' }]}
                        style={{ flex: 0.5 }}
                      >
                        <InputNumber placeholder="Qty" min={1} style={{ width: '100%' }} />
                      </Form.Item>
                      <Button type="link" danger icon={<MinusCircleOutlined />} onClick={() => remove(name)} />
                    </div>
                  ))}
                  <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />}>
                    Add Component
                  </Button>
                </>
              )}
            </Form.List>
          </div>

          <p className="text-xs text-gray-500 mt-4">
            A bundle combines multiple simple products sold together as one item.
          </p>
        </Form>
      </Modal>
    </div>
  );
}
