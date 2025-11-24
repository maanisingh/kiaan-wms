'use client';

import React, { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Table, Button, Input, Card, Modal, Form, message, Space, Tag } from 'antd';
import {
  PlusOutlined,
  SearchOutlined,
  EditOutlined,
  DeleteOutlined,
  TagOutlined,
} from '@ant-design/icons';
import { useModal } from '@/hooks/useModal';
import { useQuery, useMutation } from '@apollo/client';
import { GET_BRANDS } from '@/lib/graphql/queries';
import { CREATE_BRAND, UPDATE_BRAND, DELETE_BRAND } from '@/lib/graphql/mutations';

export default function ProductBrandsPage() {
  const [searchText, setSearchText] = useState('');
  const [selectedBrand, setSelectedBrand] = useState<any>(null);
  const addModal = useModal();
  const editModal = useModal();
  const [form] = Form.useForm();

  // GraphQL query for brands
  const { data, loading, error, refetch } = useQuery(GET_BRANDS, {
    variables: {
      limit: 100,
      offset: 0,
    },
  });

  // GraphQL mutations
  const [createBrand, { loading: creating }] = useMutation(CREATE_BRAND, {
    onCompleted: () => {
      message.success('Brand created successfully!');
      form.resetFields();
      addModal.close();
      refetch();
    },
    onError: (err) => {
      message.error(`Failed to create brand: ${err.message}`);
    },
  });

  const [updateBrand, { loading: updating }] = useMutation(UPDATE_BRAND, {
    onCompleted: () => {
      message.success('Brand updated successfully!');
      form.resetFields();
      editModal.close();
      refetch();
    },
    onError: (err) => {
      message.error(`Failed to update brand: ${err.message}`);
    },
  });

  const [deleteBrand] = useMutation(DELETE_BRAND, {
    onCompleted: () => {
      message.success('Brand deleted successfully!');
      refetch();
    },
    onError: (err) => {
      message.error(`Failed to delete brand: ${err.message}`);
    },
  });

  // Get brands from GraphQL data
  const brands = data?.Brand || [];

  // Filter brands by search text
  const filteredBrands = brands.filter((b: any) => {
    const matchesSearch = !searchText ||
      b.name?.toLowerCase().includes(searchText.toLowerCase()) ||
      b.code?.toLowerCase().includes(searchText.toLowerCase());
    return matchesSearch;
  });

  const handleSubmit = async (values: any) => {
    try {
      if (selectedBrand) {
        // UPDATE existing brand
        await updateBrand({
          variables: {
            id: selectedBrand.id,
            set: {
              name: values.name,
              description: values.description || null,
              updatedAt: new Date().toISOString(),
            },
          },
        });
      } else {
        // CREATE new brand
        const uuid = crypto.randomUUID();
        const brandCode = values.name.substring(0, 3).toUpperCase() + '-' + Date.now().toString().slice(-4);

        await createBrand({
          variables: {
            object: {
              id: uuid,
              code: brandCode,
              name: values.name,
              description: values.description || null,
              companyId: '53c65d84-4606-4b0a-8aa5-6eda9e50c3df',
              updatedAt: new Date().toISOString(),
            },
          },
        });
      }
    } catch (error: any) {
      console.error('Error saving brand:', error);
      message.error(error?.message || 'Failed to save brand');
    }
  };

  const handleEdit = (record: any) => {
    setSelectedBrand(record);
    form.setFieldsValue({
      name: record.name,
      description: record.description,
    });
    editModal.open();
  };

  const handleDelete = (record: any) => {
    Modal.confirm({
      title: 'Delete Brand',
      content: `Are you sure you want to delete brand "${record.name}"? This action cannot be undone.`,
      okText: 'Delete',
      okType: 'danger',
      onOk: async () => {
        await deleteBrand({ variables: { id: record.id } });
      },
    });
  };

  const handleAddBrand = () => {
    setSelectedBrand(null);
    form.resetFields();
    addModal.open();
  };

  const columns = [
    {
      title: 'Brand Code',
      dataIndex: 'code',
      key: 'code',
      width: 130,
      render: (text: string) => (
        <Tag color="blue" className="font-mono">{text}</Tag>
      ),
    },
    {
      title: 'Brand Name',
      dataIndex: 'name',
      key: 'name',
      width: 200,
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
      title: 'Created',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 120,
      render: (date: string) => new Date(date).toLocaleDateString(),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 150,
      render: (_: any, record: any) => (
        <Space>
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            Edit
          </Button>
          <Button
            type="link"
            size="small"
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDelete(record)}
          >
            Delete
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              Brand Management
            </h1>
            <p className="text-gray-600 mt-1">Manage product brands and manufacturers</p>
          </div>
          <Button type="primary" icon={<PlusOutlined />} size="large" onClick={handleAddBrand}>
            Add Brand
          </Button>
        </div>

        {/* Stats Card */}
        <Card>
          <div className="text-center">
            <p className="text-gray-500 text-sm">Total Brands</p>
            <p className="text-3xl font-bold text-purple-600">{filteredBrands.length}</p>
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
          open={addModal.isOpen}
          onCancel={addModal.close}
          onOk={() => form.submit()}
          width={600}
          confirmLoading={creating}
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
              <Input.TextArea
                placeholder="Enter brand description (optional)"
                rows={3}
              />
            </Form.Item>
            <p className="text-xs text-gray-500">
              Brand code will be auto-generated based on the brand name.
            </p>
          </Form>
        </Modal>

        {/* Edit Modal */}
        <Modal
          title="Edit Brand"
          open={editModal.isOpen}
          onCancel={editModal.close}
          onOk={() => form.submit()}
          width={600}
          confirmLoading={updating}
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
              <Input.TextArea
                placeholder="Enter brand description (optional)"
                rows={3}
              />
            </Form.Item>
          </Form>
        </Modal>
      </div>
    </MainLayout>
  );
}
