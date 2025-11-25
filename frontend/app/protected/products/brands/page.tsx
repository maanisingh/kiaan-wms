'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Table, Button, Input, Card, Modal, Form, message, Space, Tag, Spin, Alert } from 'antd';
import {
  PlusOutlined,
  SearchOutlined,
  EditOutlined,
  DeleteOutlined,
  TagOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import apiService from '@/services/api';

interface Brand {
  id: string;
  name: string;
  code: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  _count?: { products: number };
}

export default function ProductBrandsPage() {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchText, setSearchText] = useState('');
  const [selectedBrand, setSelectedBrand] = useState<Brand | null>(null);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form] = Form.useForm();

  // Fetch brands
  const fetchBrands = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await apiService.get('/brands');
      setBrands(Array.isArray(data) ? data : []);
    } catch (err: any) {
      console.error('Failed to fetch brands:', err);
      setError(err.message || 'Failed to load brands');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBrands();
  }, [fetchBrands]);

  // Filter brands by search text
  const filteredBrands = brands.filter((b) => {
    const matchesSearch =
      !searchText ||
      b.name?.toLowerCase().includes(searchText.toLowerCase()) ||
      b.code?.toLowerCase().includes(searchText.toLowerCase());
    return matchesSearch;
  });

  const handleSubmit = async (values: any) => {
    try {
      setSaving(true);

      if (selectedBrand) {
        // UPDATE existing brand
        await apiService.put(`/brands/${selectedBrand.id}`, {
          name: values.name,
          description: values.description || null,
        });
        message.success('Brand updated successfully!');
        setEditModalOpen(false);
      } else {
        // CREATE new brand
        const brandCode = values.name.substring(0, 3).toUpperCase() + '-' + Date.now().toString().slice(-4);
        await apiService.post('/brands', {
          name: values.name,
          code: brandCode,
          description: values.description || null,
        });
        message.success('Brand created successfully!');
        setAddModalOpen(false);
      }

      form.resetFields();
      setSelectedBrand(null);
      fetchBrands();
    } catch (err: any) {
      console.error('Error saving brand:', err);
      message.error(err.message || 'Failed to save brand');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (record: Brand) => {
    setSelectedBrand(record);
    form.setFieldsValue({
      name: record.name,
      description: record.description,
    });
    setEditModalOpen(true);
  };

  const handleDelete = (record: Brand) => {
    Modal.confirm({
      title: 'Delete Brand',
      content: `Are you sure you want to delete brand "${record.name}"? This action cannot be undone.`,
      okText: 'Delete',
      okType: 'danger',
      onOk: async () => {
        try {
          await apiService.delete(`/brands/${record.id}`);
          message.success('Brand deleted successfully!');
          fetchBrands();
        } catch (err: any) {
          message.error(err.message || 'Failed to delete brand');
        }
      },
    });
  };

  const handleAddBrand = () => {
    setSelectedBrand(null);
    form.resetFields();
    setAddModalOpen(true);
  };

  const columns = [
    {
      title: 'Brand Code',
      dataIndex: 'code',
      key: 'code',
      width: 150,
      render: (text: string) => <Tag color="blue" className="font-mono">{text}</Tag>,
    },
    {
      title: 'Brand Name',
      dataIndex: 'name',
      key: 'name',
      width: 220,
      render: (text: string) => (
        <div className="flex items-center gap-2">
          <TagOutlined className="text-purple-500" />
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
      render: (count: number) => count || 0,
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
      width: 180,
      render: (_: any, record: Brand) => (
        <Space>
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

  if (loading && brands.length === 0) {
    return (
      <div className="flex justify-center items-center h-96">
        <Spin size="large" tip="Loading brands..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <Alert
          message="Error Loading Brands"
          description={error}
          type="error"
          showIcon
          action={
            <Button onClick={fetchBrands} icon={<ReloadOutlined />}>
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
            Brand Management
          </h1>
          <p className="text-gray-600 mt-1">Manage product brands and manufacturers</p>
        </div>
        <Space>
          <Button icon={<ReloadOutlined />} onClick={fetchBrands} loading={loading}>
            Refresh
          </Button>
          <Button type="primary" icon={<PlusOutlined />} size="large" onClick={handleAddBrand}>
            Add Brand
          </Button>
        </Space>
      </div>

      {/* Stats Card */}
      <Card>
        <div className="text-center">
          <p className="text-gray-500 text-sm">Total Brands</p>
          <p className="text-3xl font-bold text-purple-600">{brands.length}</p>
        </div>
      </Card>

      {/* Table */}
      <Card className="shadow-sm">
        <div className="flex gap-4 mb-4">
          <Input
            placeholder="Search by brand name or code..."
            allowClear
            style={{ width: 350 }}
            prefix={<SearchOutlined />}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
          />
        </div>
        <Table
          columns={columns}
          dataSource={filteredBrands}
          rowKey="id"
          loading={loading}
          pagination={{
            total: filteredBrands.length,
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total) => `Total ${total} brands`,
          }}
        />
      </Card>

      {/* Add Modal */}
      <Modal
        title="Add Brand"
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
            label="Brand Name"
            name="name"
            rules={[{ required: true, message: 'Please enter brand name' }]}
          >
            <Input placeholder="Enter brand name (e.g., Nike, Nakd, Graze)" />
          </Form.Item>
          <Form.Item label="Description" name="description">
            <Input.TextArea placeholder="Enter brand description (optional)" rows={3} />
          </Form.Item>
          <p className="text-xs text-gray-500">Brand code will be auto-generated based on the brand name.</p>
        </Form>
      </Modal>

      {/* Edit Modal */}
      <Modal
        title="Edit Brand"
        open={editModalOpen}
        onCancel={() => {
          setEditModalOpen(false);
          setSelectedBrand(null);
          form.resetFields();
        }}
        onOk={() => form.submit()}
        width={600}
        confirmLoading={saving}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item
            label="Brand Name"
            name="name"
            rules={[{ required: true, message: 'Please enter brand name' }]}
          >
            <Input placeholder="Enter brand name" />
          </Form.Item>
          <Form.Item label="Description" name="description">
            <Input.TextArea placeholder="Enter brand description (optional)" rows={3} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
