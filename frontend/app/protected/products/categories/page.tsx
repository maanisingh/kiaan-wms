'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Table, Button, Input, Card, Modal, Form, Space, Tag, Spin, Alert, App, Checkbox } from 'antd';
import {
  PlusOutlined,
  SearchOutlined,
  EditOutlined,
  DeleteOutlined,
  AppstoreOutlined,
  ReloadOutlined,
  SettingOutlined,
} from '@ant-design/icons';
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
  brandId?: string;
}

export default function ProductCategoriesPage() {
  const { modal, message } = App.useApp();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchText, setSearchText] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [productsModalOpen, setProductsModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form] = Form.useForm();

  // Products management state
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [productSearchText, setProductSearchText] = useState('');

  // Fetch categories (brands endpoint)
  const fetchCategories = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await apiService.get('/brands');
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
        await apiService.put(`/brands/${selectedCategory.id}`, {
          name: values.name,
          description: values.description || null,
        });
        message.success('Category updated successfully!');
        setEditModalOpen(false);
      } else {
        // CREATE new category
        const categoryCode = values.name.substring(0, 3).toUpperCase() + '-' + Date.now().toString().slice(-4);
        await apiService.post('/brands', {
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
          await apiService.delete(`/brands/${record.id}`);
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

  // Handle Manage Products
  const handleManageProducts = async (record: Category) => {
    setSelectedCategory(record);
    setProductsLoading(true);
    setProductsModalOpen(true);
    setProductSearchText('');

    try {
      // Fetch all products
      const products = await apiService.get('/products');
      setAllProducts(Array.isArray(products) ? products : []);

      // Fetch products assigned to this category
      const categoryProducts = await apiService.get(`/brands/${record.id}/products`);
      const assignedIds = Array.isArray(categoryProducts)
        ? categoryProducts.map((p: Product) => p.id)
        : [];
      setSelectedProductIds(assignedIds);
    } catch (err: any) {
      console.error('Error fetching products:', err);
      message.error('Failed to load products');
    } finally {
      setProductsLoading(false);
    }
  };

  // Save product assignments
  const handleSaveProducts = async () => {
    if (!selectedCategory) return;

    try {
      setSaving(true);
      await apiService.put(`/brands/${selectedCategory.id}/products`, {
        productIds: selectedProductIds,
      });
      message.success('Products updated successfully!');
      setProductsModalOpen(false);
      fetchCategories();
    } catch (err: any) {
      console.error('Error saving products:', err);
      message.error(err.message || 'Failed to update products');
    } finally {
      setSaving(false);
    }
  };

  // Filter products by search
  const filteredProducts = allProducts.filter((p) => {
    const matchesSearch =
      !productSearchText ||
      p.name?.toLowerCase().includes(productSearchText.toLowerCase()) ||
      p.sku?.toLowerCase().includes(productSearchText.toLowerCase());
    return matchesSearch;
  });

  // Product selection columns
  const productColumns = [
    {
      title: 'SKU',
      dataIndex: 'sku',
      key: 'sku',
      width: 150,
      render: (text: string) => <Tag color="blue" className="font-mono">{text}</Tag>,
    },
    {
      title: 'Product Name',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Currently Assigned',
      key: 'assigned',
      width: 140,
      align: 'center' as const,
      render: (_: any, record: Product) => (
        record.brandId === selectedCategory?.id ? (
          <Tag color="green">Yes</Tag>
        ) : record.brandId ? (
          <Tag color="orange">Other Category</Tag>
        ) : (
          <Tag color="default">No</Tag>
        )
      ),
    },
  ];

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
      render: (text: string) => (
        <div className="flex items-center gap-2">
          <AppstoreOutlined className="text-purple-500" />
          <span className="font-medium">{text}</span>
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
      width: 100,
      align: 'center' as const,
      render: (count: number) => (
        <Tag color={count > 0 ? 'green' : 'default'}>{count || 0}</Tag>
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
      width: 280,
      render: (_: any, record: Category) => (
        <Space>
          <Button
            type="primary"
            size="small"
            icon={<SettingOutlined />}
            onClick={() => handleManageProducts(record)}
          >
            Manage Products
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
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            Category Management
          </h1>
          <p className="text-gray-600 mt-1">Manage product categories and assign products</p>
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

      {/* Stats Card */}
      <Card>
        <div className="text-center">
          <p className="text-gray-500 text-sm">Total Categories</p>
          <p className="text-3xl font-bold text-purple-600">{categories.length}</p>
        </div>
      </Card>

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
            <Input placeholder="Enter category name (e.g., Electronics, Clothing, Food)" />
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

      {/* Manage Products Modal */}
      <Modal
        title={`Manage Products - ${selectedCategory?.name || ''}`}
        open={productsModalOpen}
        onCancel={() => {
          setProductsModalOpen(false);
          setSelectedCategory(null);
          setSelectedProductIds([]);
          setProductSearchText('');
        }}
        onOk={handleSaveProducts}
        okText="Save Changes"
        width={800}
        confirmLoading={saving}
      >
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <Input
              placeholder="Search products by name or SKU..."
              allowClear
              style={{ width: 300 }}
              prefix={<SearchOutlined />}
              value={productSearchText}
              onChange={(e) => setProductSearchText(e.target.value)}
            />
            <div className="text-sm text-gray-500">
              {selectedProductIds.length} products selected
            </div>
          </div>

          <Table
            columns={productColumns}
            dataSource={filteredProducts}
            rowKey="id"
            loading={productsLoading}
            size="small"
            pagination={{
              pageSize: 8,
              showSizeChanger: false,
              showTotal: (total) => `${total} products`,
            }}
            rowSelection={{
              type: 'checkbox',
              selectedRowKeys: selectedProductIds,
              onChange: (keys) => setSelectedProductIds(keys as string[]),
              getCheckboxProps: (record: Product) => ({
                // Products already assigned to OTHER categories show a warning
                // but can still be reassigned
              }),
            }}
          />

          <Alert
            message="Note"
            description="Selecting a product will assign it to this category. Products can only belong to one category at a time. Unchecking a product will remove it from this category."
            type="info"
            showIcon
          />
        </div>
      </Modal>
    </div>
  );
}
