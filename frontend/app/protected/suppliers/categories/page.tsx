'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Table, Button, Input, Card, Modal, Form, Space, Tag, Spin, Alert, App, Drawer, Descriptions, List, Avatar } from 'antd';
import {
  PlusOutlined,
  SearchOutlined,
  EditOutlined,
  DeleteOutlined,
  TagOutlined,
  ReloadOutlined,
  EyeOutlined,
  ShoppingOutlined,
  RightOutlined,
} from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import apiService from '@/services/api';

interface Category {
  id: string;
  name: string;
  code: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  _count?: { products: number };
}

interface Product {
  id: string;
  name: string;
  sku: string;
  sellingPrice?: number;
  status: string;
}

export default function SupplierCategoriesPage() {
  const { modal, message } = App.useApp();
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchText, setSearchText] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form] = Form.useForm();

  // Drill-down drawer
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [categoryProducts, setCategoryProducts] = useState<Product[]>([]);
  const [productsLoading, setProductsLoading] = useState(false);

  // Fetch categories
  const fetchCategories = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await apiService.get('/categories');
      setCategories(Array.isArray(data) ? data : []);
    } catch (err: any) {
      console.error('Failed to fetch categories:', err);
      setError(err.message || 'Failed to load categories');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  // Fetch products for a specific category (drill-down)
  const fetchCategoryProducts = async (categoryId: string) => {
    try {
      setProductsLoading(true);
      const data = await apiService.get(`/products?brandId=${categoryId}`);
      setCategoryProducts(Array.isArray(data) ? data : []);
    } catch (err: any) {
      console.error('Failed to fetch category products:', err);
      message.error('Failed to load products for this category');
      setCategoryProducts([]);
    } finally {
      setProductsLoading(false);
    }
  };

  // Filter categories by search text
  const filteredCategories = categories.filter((c) => {
    const matchesSearch =
      !searchText ||
      c.name?.toLowerCase().includes(searchText.toLowerCase()) ||
      c.code?.toLowerCase().includes(searchText.toLowerCase());
    return matchesSearch;
  });

  const handleSubmit = async (values: any) => {
    try {
      setSaving(true);

      if (selectedCategory) {
        // UPDATE existing category
        await apiService.put(`/categories/${selectedCategory.id}`, {
          name: values.name,
          description: values.description || null,
        });
        message.success('Category updated successfully!');
        setEditModalOpen(false);
      } else {
        // CREATE new category
        const categoryCode = values.name.substring(0, 3).toUpperCase() + '-' + Date.now().toString().slice(-4);
        await apiService.post('/categories', {
          name: values.name,
          code: categoryCode,
          description: values.description || null,
        });
        message.success('Category created successfully!');
        setAddModalOpen(false);
      }

      form.resetFields();
      setSelectedCategory(null);
      fetchCategories();
    } catch (err: any) {
      console.error('Error saving category:', err);
      message.error(err.message || 'Failed to save category');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (record: Category) => {
    setSelectedCategory(record);
    form.setFieldsValue({
      name: record.name,
      description: record.description,
    });
    setEditModalOpen(true);
  };

  const handleDelete = (record: Category) => {
    modal.confirm({
      title: 'Delete Category',
      content: `Are you sure you want to delete category "${record.name}"? This action cannot be undone.`,
      okText: 'Delete',
      okType: 'danger',
      onOk: async () => {
        try {
          await apiService.delete(`/categories/${record.id}`);
          message.success('Category deleted successfully!');
          fetchCategories();
        } catch (err: any) {
          message.error(err.message || 'Failed to delete category');
        }
      },
    });
  };

  const handleAddCategory = () => {
    setSelectedCategory(null);
    form.resetFields();
    setAddModalOpen(true);
  };

  // Handle drill-down click
  const handleViewProducts = (record: Category) => {
    setSelectedCategory(record);
    setDrawerOpen(true);
    fetchCategoryProducts(record.id);
  };

  const columns = [
    {
      title: 'Category Code',
      dataIndex: 'code',
      key: 'code',
      width: 150,
      render: (text: string) => <Tag color="blue" className="font-mono">{text}</Tag>,
    },
    {
      title: 'Category Name',
      dataIndex: 'name',
      key: 'name',
      width: 220,
      render: (text: string, record: Category) => (
        <div
          className="flex items-center gap-2 cursor-pointer hover:text-blue-600"
          onClick={() => handleViewProducts(record)}
        >
          <TagOutlined className="text-purple-500" />
          <span className="font-medium">{text}</span>
          <RightOutlined className="text-gray-400 text-xs" />
        </div>
      ),
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
      render: (text: string) => text || <span className="text-gray-400">-</span>,
    },
    {
      title: 'Products',
      dataIndex: ['_count', 'products'],
      key: 'products',
      width: 120,
      align: 'center' as const,
      render: (count: number, record: Category) => (
        <Button
          type="link"
          size="small"
          onClick={() => handleViewProducts(record)}
        >
          {count || 0} products
        </Button>
      ),
    },
    {
      title: 'Created',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 120,
      render: (date: string) => (date ? new Date(date).toLocaleDateString() : '-'),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 200,
      render: (_: any, record: Category) => (
        <Space>
          <Button
            type="link"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => handleViewProducts(record)}
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

  if (loading && categories.length === 0) {
    return (
      <div className="flex justify-center items-center h-96">
        <Spin size="large" tip="Loading categories..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <Alert
          message="Error Loading Categories"
          description={error}
          type="error"
          showIcon
          action={
            <Button onClick={fetchCategories} icon={<ReloadOutlined />}>
              Retry
            </Button>
          }
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            Supplier Categories
          </h1>
          <p className="text-gray-600 mt-1">Manage product categories and view products in each category</p>
        </div>
        <Space>
          <Button icon={<ReloadOutlined />} onClick={fetchCategories} loading={loading}>
            Refresh
          </Button>
          <Button type="primary" icon={<PlusOutlined />} size="large" onClick={handleAddCategory}>
            Add Category
          </Button>
        </Space>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <div className="text-center">
            <p className="text-gray-500 text-sm">Total Categories</p>
            <p className="text-3xl font-bold text-purple-600">{categories.length}</p>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <p className="text-gray-500 text-sm">Total Products</p>
            <p className="text-3xl font-bold text-blue-600">
              {categories.reduce((sum, c) => sum + (c._count?.products || 0), 0)}
            </p>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <p className="text-gray-500 text-sm">Categories with Products</p>
            <p className="text-3xl font-bold text-green-600">
              {categories.filter(c => (c._count?.products || 0) > 0).length}
            </p>
          </div>
        </Card>
      </div>

      {/* Table */}
      <Card className="shadow-sm">
        <div className="flex gap-4 mb-4">
          <Input
            placeholder="Search by category name or code..."
            allowClear
            style={{ width: 350 }}
            prefix={<SearchOutlined />}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
          />
        </div>
        <Table
          columns={columns}
          dataSource={filteredCategories}
          rowKey="id"
          loading={loading}
          pagination={{
            total: filteredCategories.length,
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total) => `Total ${total} categories`,
          }}
        />
      </Card>

      {/* Add Modal */}
      <Modal
        title="Add Category"
        open={addModalOpen}
        onCancel={() => {
          setAddModalOpen(false);
          form.resetFields();
        }}
        onOk={() => form.submit()}
        width={600}
        confirmLoading={saving}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item
            label="Category Name"
            name="name"
            rules={[{ required: true, message: 'Please enter category name' }]}
          >
            <Input placeholder="Enter category name (e.g., Electronics, Food & Beverages)" />
          </Form.Item>
          <Form.Item label="Description" name="description">
            <Input.TextArea placeholder="Enter category description (optional)" rows={3} />
          </Form.Item>
          <p className="text-xs text-gray-500">Category code will be auto-generated based on the category name.</p>
        </Form>
      </Modal>

      {/* Edit Modal */}
      <Modal
        title="Edit Category"
        open={editModalOpen}
        onCancel={() => {
          setEditModalOpen(false);
          setSelectedCategory(null);
          form.resetFields();
        }}
        onOk={() => form.submit()}
        width={600}
        confirmLoading={saving}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item
            label="Category Name"
            name="name"
            rules={[{ required: true, message: 'Please enter category name' }]}
          >
            <Input placeholder="Enter category name" />
          </Form.Item>
          <Form.Item label="Description" name="description">
            <Input.TextArea placeholder="Enter category description (optional)" rows={3} />
          </Form.Item>
        </Form>
      </Modal>

      {/* Drill-down Drawer - Products in Category */}
      <Drawer
        title={
          <div className="flex items-center gap-3">
            <TagOutlined className="text-purple-600" />
            <span>Products in "{selectedCategory?.name}"</span>
          </div>
        }
        placement="right"
        width={700}
        open={drawerOpen}
        onClose={() => {
          setDrawerOpen(false);
          setSelectedCategory(null);
          setCategoryProducts([]);
        }}
      >
        {selectedCategory && (
          <div className="space-y-6">
            {/* Category Info */}
            <Card size="small" className="bg-gray-50">
              <Descriptions size="small" column={2}>
                <Descriptions.Item label="Category Code">
                  <Tag color="blue" className="font-mono">{selectedCategory.code}</Tag>
                </Descriptions.Item>
                <Descriptions.Item label="Total Products">
                  <Tag color="green">{selectedCategory._count?.products || 0}</Tag>
                </Descriptions.Item>
                <Descriptions.Item label="Description" span={2}>
                  {selectedCategory.description || 'No description'}
                </Descriptions.Item>
              </Descriptions>
            </Card>

            {/* Products List */}
            <div>
              <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                <ShoppingOutlined />
                Products ({categoryProducts.length})
              </h3>

              {productsLoading ? (
                <div className="flex justify-center py-8">
                  <Spin tip="Loading products..." />
                </div>
              ) : categoryProducts.length === 0 ? (
                <Alert
                  message="No Products"
                  description="This category doesn't have any products yet."
                  type="info"
                  showIcon
                />
              ) : (
                <List
                  itemLayout="horizontal"
                  dataSource={categoryProducts}
                  renderItem={(product) => (
                    <List.Item
                      actions={[
                        <Button
                          key="view"
                          type="link"
                          onClick={() => router.push(`/products/${product.id}`)}
                        >
                          View Details
                        </Button>
                      ]}
                    >
                      <List.Item.Meta
                        avatar={
                          <Avatar
                            icon={<ShoppingOutlined />}
                            style={{ backgroundColor: '#1890ff' }}
                          />
                        }
                        title={
                          <span
                            className="cursor-pointer hover:text-blue-600"
                            onClick={() => router.push(`/products/${product.id}`)}
                          >
                            {product.name}
                          </span>
                        }
                        description={
                          <div className="flex items-center gap-4">
                            <span className="font-mono text-xs bg-gray-100 px-2 py-0.5 rounded">
                              {product.sku}
                            </span>
                            <span className="text-green-600 font-medium">
                              ${product.sellingPrice?.toFixed(2) || '0.00'}
                            </span>
                            <Tag color={product.status === 'ACTIVE' ? 'green' : 'orange'}>
                              {product.status}
                            </Tag>
                          </div>
                        }
                      />
                    </List.Item>
                  )}
                />
              )}
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
}
