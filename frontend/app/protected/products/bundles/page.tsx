'use client';

import React, { useState } from 'react';
import { useQuery, useMutation } from '@apollo/client';

import {
  Table, Button, Tag, Card, Space, Statistic, Row, Col, Modal, Form,
  Input, Select, message, InputNumber, Drawer
} from 'antd';
import {
  BoxPlotOutlined, PlusOutlined, EditOutlined, DeleteOutlined,
  EyeOutlined, MinusCircleOutlined
} from '@ant-design/icons';
import { GET_BUNDLES, GET_PRODUCTS } from '@/lib/graphql/queries';
import { CREATE_PRODUCT, UPDATE_PRODUCT, DELETE_PRODUCT, CREATE_BUNDLE_ITEM, DELETE_BUNDLE_ITEMS_BY_PARENT } from '@/lib/graphql/mutations';
import { useModal } from '@/hooks/useModal';

const { Option } = Select;

export default function BundlesPage() {
  const [selectedBundle, setSelectedBundle] = useState<any>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const addModal = useModal();
  const editModal = useModal();
  const [form] = Form.useForm();

  // Query bundles (products with type=BUNDLE)
  const { data, loading, refetch } = useQuery(GET_BUNDLES, {
    variables: {
      limit: 100,
      offset: 0,
      where: { type: { _eq: 'BUNDLE' } },
    },
  });

  // Query all simple products (for bundle components)
  const { data: productsData } = useQuery(GET_PRODUCTS, {
    variables: {
      limit: 1000,
      offset: 0,
      where: { type: { _eq: 'SIMPLE' } },
    },
  });

  const bundles = data?.Product || [];
  const products = productsData?.Product || [];

  // GraphQL mutations
  const [createProduct, { loading: creating }] = useMutation(CREATE_PRODUCT);
  const [updateProduct, { loading: updating }] = useMutation(UPDATE_PRODUCT);
  const [deleteProduct] = useMutation(DELETE_PRODUCT);
  const [createBundleItem] = useMutation(CREATE_BUNDLE_ITEM);
  const [deleteBundleItems] = useMutation(DELETE_BUNDLE_ITEMS_BY_PARENT);

  const handleSubmit = async (values: any) => {
    try {
      if (selectedBundle) {
        // UPDATE existing bundle
        await updateProduct({
          variables: {
            id: selectedBundle.id,
            set: {
              name: values.name,
              sku: values.sku,
              description: values.description,
              sellingPrice: parseFloat(values.sellingPrice),
              costPrice: parseFloat(values.costPrice || 0),
              status: values.status,
              updatedAt: new Date().toISOString(),
            },
          },
        });

        // Update bundle items: delete all and recreate
        await deleteBundleItems({ variables: { parentId: selectedBundle.id } });

        for (const item of values.bundleItems || []) {
          await createBundleItem({
            variables: {
              object: {
                id: crypto.randomUUID(),
                parentId: selectedBundle.id,
                childId: item.productId,
                quantity: parseInt(item.quantity),
              },
            },
          });
        }

        message.success('Bundle updated successfully!');
        editModal.close();
      } else {
        // CREATE new bundle
        const bundleId = crypto.randomUUID();

        // 1. Create bundle product
        await createProduct({
          variables: {
            object: {
              id: bundleId,
              name: values.name,
              sku: values.sku,
              description: values.description || null,
              sellingPrice: parseFloat(values.sellingPrice),
              costPrice: parseFloat(values.costPrice || 0),
              status: values.status,
              type: 'BUNDLE',
              brandId: null,
              companyId: '53c65d84-4606-4b0a-8aa5-6eda9e50c3df',
              updatedAt: new Date().toISOString(),
            },
          },
        });

        // 2. Create bundle items
        for (const item of values.bundleItems || []) {
          await createBundleItem({
            variables: {
              object: {
                id: crypto.randomUUID(),
                parentId: bundleId,
                childId: item.productId,
                quantity: parseInt(item.quantity),
              },
            },
          });
        }

        message.success('Bundle created successfully!');
        addModal.close();
      }

      form.resetFields();
      refetch();
    } catch (error: any) {
      console.error('Error saving bundle:', error);
      message.error(error?.message || 'Failed to save bundle');
    }
  };

  const handleEdit = (record: any) => {
    setSelectedBundle(record);
    form.setFieldsValue({
      name: record.name,
      sku: record.sku,
      description: record.description,
      sellingPrice: record.sellingPrice,
      costPrice: record.costPrice,
      status: record.status,
      bundleItems: record.bundleItems.map((item: any) => ({
        productId: item.child.id,
        quantity: item.quantity,
      })),
    });
    editModal.open();
  };

  const handleDelete = (record: any) => {
    Modal.confirm({
      title: 'Delete Bundle',
      content: `Are you sure you want to delete bundle "${record.name}"? This will also delete all bundle items.`,
      okText: 'Delete',
      okType: 'danger',
      onOk: async () => {
        await deleteProduct({ variables: { id: record.id } });
        message.success('Bundle deleted successfully!');
        refetch();
      },
    });
  };

  const handleAddBundle = () => {
    setSelectedBundle(null);
    form.resetFields();
    form.setFieldsValue({ status: 'ACTIVE', bundleItems: [{}] });
    addModal.open();
  };

  const columns = [
    {
      title: 'SKU',
      dataIndex: 'sku',
      key: 'sku',
      width: 120,
      render: (text: string) => <span className="font-medium">{text}</span>,
    },
    {
      title: 'Bundle Name',
      dataIndex: 'name',
      key: 'name',
      width: 250,
    },
    {
      title: 'Items',
      key: 'items',
      width: 100,
      render: (_: any, record: any) => (
        <Tag color="purple" icon={<BoxPlotOutlined />}>
          {record.bundleItems?.length || 0}
        </Tag>
      ),
    },
    {
      title: 'Cost Price',
      dataIndex: 'costPrice',
      key: 'cost',
      width: 120,
      align: 'right' as const,
      render: (price: number) => price ? `£${price.toFixed(2)}` : '-',
    },
    {
      title: 'Selling Price',
      dataIndex: 'sellingPrice',
      key: 'price',
      width: 120,
      align: 'right' as const,
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
    {
      title: 'Actions',
      key: 'actions',
      width: 200,
      fixed: 'right' as const,
      render: (_: any, record: any) => (
        <Space>
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
  const activeBundles = bundles.filter((b: any) => b.status === 'ACTIVE').length;
  const avgMargin = bundles.length > 0
    ? bundles.reduce((sum: number, b: any) => {
        if (!b.costPrice || !b.sellingPrice) return sum;
        return sum + ((b.sellingPrice - b.costPrice) / b.sellingPrice * 100);
      }, 0) / bundles.length
    : 0;

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
          <Button type="primary" icon={<PlusOutlined />} size="large" onClick={handleAddBundle}>
            Create Bundle
          </Button>
        </div>

        {/* Stats */}
        <Row gutter={16} className="mb-6">
          <Col span={8}>
            <Card>
              <Statistic
                title="Total Bundles"
                value={totalBundles}
                prefix={<BoxPlotOutlined />}
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

        {/* Table */}
        <Card>
          <Table
            columns={columns}
            dataSource={bundles}
            rowKey="id"
            loading={loading}
            scroll={{ x: 1200 }}
            pagination={{ pageSize: 20, showSizeChanger: true }}
            expandable={{
              expandedRowRender: (record: any) => (
                <div className="p-4 bg-gray-50">
                  <h4 className="font-semibold mb-2">Bundle Contents:</h4>
                  <ul className="list-disc list-inside">
                    {record.bundleItems?.map((item: any) => (
                      <li key={item.id}>
                        {item.quantity}x {item.child?.name || 'Unknown Product'} ({item.child?.sku || '-'}) - £{item.child?.sellingPrice?.toFixed(2) || '0.00'}
                      </li>
                    ))}
                  </ul>
                </div>
              ),
            }}
          />
        </Card>

        {/* Details Drawer */}
        <Drawer
          title="Bundle Details"
          placement="right"
          width={600}
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
        >
          {selectedBundle && (
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-lg">{selectedBundle.name}</h3>
                <p className="text-gray-600">SKU: {selectedBundle.sku}</p>
              </div>
              <div className="border-t pt-4 space-y-2">
                <p><strong>Description:</strong> {selectedBundle.description || 'Not provided'}</p>
                <p><strong>Cost Price:</strong> £{selectedBundle.costPrice?.toFixed(2) || '0.00'}</p>
                <p><strong>Selling Price:</strong> £{selectedBundle.sellingPrice?.toFixed(2) || '0.00'}</p>
                <p><strong>Status:</strong> <Tag color={selectedBundle.status === 'ACTIVE' ? 'green' : 'red'}>{selectedBundle.status}</Tag></p>
                <div className="border-t pt-4">
                  <p className="font-semibold mb-2">Bundle Contents ({selectedBundle.bundleItems?.length} items):</p>
                  <ul className="list-disc list-inside space-y-1">
                    {selectedBundle.bundleItems?.map((item: any) => (
                      <li key={item.id}>
                        {item.quantity}x {item.child?.name} ({item.child?.sku})
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}
        </Drawer>

        {/* Add/Edit Modal */}
        <Modal
          title={selectedBundle ? 'Edit Bundle' : 'Create Bundle'}
          open={addModal.isOpen || editModal.isOpen}
          onCancel={() => {
            addModal.close();
            editModal.close();
          }}
          onOk={() => form.submit()}
          width={800}
          confirmLoading={creating || updating}
        >
          <Form form={form} layout="vertical" onFinish={handleSubmit}>
            <div className="grid grid-cols-2 gap-4">
              <Form.Item
                label="Bundle Name"
                name="name"
                rules={[{ required: true, message: 'Please enter bundle name' }]}
              >
                <Input placeholder="e.g., Variety Pack 12x330ml" />
              </Form.Item>

              <Form.Item
                label="SKU"
                name="sku"
                rules={[{ required: true, message: 'Please enter SKU' }]}
              >
                <Input placeholder="e.g., BUNDLE-001" />
              </Form.Item>
            </div>

            <Form.Item label="Description" name="description">
              <Input.TextArea placeholder="Enter bundle description (optional)" rows={2} />
            </Form.Item>

            <div className="grid grid-cols-3 gap-4">
              <Form.Item
                label="Cost Price"
                name="costPrice"
                rules={[{ required: true, message: 'Required' }]}
              >
                <InputNumber
                  style={{ width: '100%' }}
                  prefix="£"
                  placeholder="0.00"
                  min={0}
                  step={0.01}
                />
              </Form.Item>

              <Form.Item
                label="Selling Price"
                name="sellingPrice"
                rules={[{ required: true, message: 'Required' }]}
              >
                <InputNumber
                  style={{ width: '100%' }}
                  prefix="£"
                  placeholder="0.00"
                  min={0}
                  step={0.01}
                />
              </Form.Item>

              <Form.Item
                label="Status"
                name="status"
                rules={[{ required: true, message: 'Required' }]}
              >
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
                            {products.map((p: any) => (
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
                        <Button
                          type="link"
                          danger
                          icon={<MinusCircleOutlined />}
                          onClick={() => remove(name)}
                        />
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
