'use client';

import React, { useState, useEffect } from 'react';
import { Table, Button, Input, Tag, Card, Modal, Form, message, Spin, Space, Popconfirm } from 'antd';
import { PlusOutlined, SearchOutlined, EditOutlined, DeleteOutlined, EyeOutlined } from '@ant-design/icons';
import Link from 'next/link';
import { useAuthStore } from '@/store/authStore';

const { Search } = Input;

interface Company {
  id: string;
  name: string;
  code: string;
  description?: string;
  address?: string;
  phone?: string;
  email?: string;
  _count?: {
    warehouses: number;
    products: number;
    users: number;
  };
}

export default function CompaniesPage() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);
  const [searchText, setSearchText] = useState('');
  const [form] = Form.useForm();
  const { token } = useAuthStore();

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://wms-api.alexandratechlab.com';

  const fetchCompanies = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/api/companies`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Failed to fetch companies');
      const data = await response.json();
      setCompanies(data);
    } catch (error) {
      console.error('Error fetching companies:', error);
      message.error('Failed to load companies');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) fetchCompanies();
  }, [token]);

  const handleSubmit = async (values: any) => {
    try {
      const url = editingCompany
        ? `${API_URL}/api/companies/${editingCompany.id}`
        : `${API_URL}/api/companies`;
      const method = editingCompany ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(values)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to save company');
      }

      message.success(editingCompany ? 'Company updated successfully!' : 'Company created successfully!');
      form.resetFields();
      setModalOpen(false);
      setEditingCompany(null);
      fetchCompanies();
    } catch (error: any) {
      message.error(error.message || 'Failed to save company');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`${API_URL}/api/companies/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) throw new Error('Failed to delete company');

      message.success('Company deleted successfully!');
      fetchCompanies();
    } catch (error) {
      message.error('Failed to delete company');
    }
  };

  const openEditModal = (company: Company) => {
    setEditingCompany(company);
    form.setFieldsValue(company);
    setModalOpen(true);
  };

  const openAddModal = () => {
    setEditingCompany(null);
    form.resetFields();
    setModalOpen(true);
  };

  const filteredCompanies = companies.filter(c =>
    c.name.toLowerCase().includes(searchText.toLowerCase()) ||
    c.code.toLowerCase().includes(searchText.toLowerCase())
  );

  const columns = [
    {
      title: 'Company Name',
      dataIndex: 'name',
      key: 'name',
      render: (text: string, record: Company) => (
        <Link href={`/companies/${record.id}`} className="font-medium text-blue-600 hover:text-blue-800">
          {text}
        </Link>
      )
    },
    { title: 'Code', dataIndex: 'code', key: 'code' },
    {
      title: 'Warehouses',
      key: 'warehouses',
      render: (_: any, record: Company) => record._count?.warehouses || 0
    },
    {
      title: 'Products',
      key: 'products',
      render: (_: any, record: Company) => record._count?.products || 0
    },
    {
      title: 'Users',
      key: 'users',
      render: (_: any, record: Company) => record._count?.users || 0
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, record: Company) => (
        <Space>
          <Link href={`/companies/${record.id}`}>
            <Button type="link" icon={<EyeOutlined />} size="small">View</Button>
          </Link>
          <Button type="link" icon={<EditOutlined />} size="small" onClick={() => openEditModal(record)}>
            Edit
          </Button>
          <Popconfirm
            title="Delete this company?"
            description="This will permanently delete the company."
            onConfirm={() => handleDelete(record.id)}
            okText="Delete"
            cancelText="Cancel"
            okButtonProps={{ danger: true }}
          >
            <Button type="link" danger icon={<DeleteOutlined />} size="small">Delete</Button>
          </Popconfirm>
        </Space>
      )
    }
  ];

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <Spin size="large" tip="Loading companies..." />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Companies</h1>
          <p className="text-gray-500">Manage your companies and tenants</p>
        </div>
        <Button type="primary" icon={<PlusOutlined />} size="large" onClick={openAddModal}>
          Add Company
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <div className="text-center">
            <p className="text-gray-500 text-sm">Total Companies</p>
            <p className="text-3xl font-bold text-blue-600">{companies.length}</p>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <p className="text-gray-500 text-sm">Total Users</p>
            <p className="text-3xl font-bold text-green-600">
              {companies.reduce((sum, c) => sum + (c._count?.users || 0), 0)}
            </p>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <p className="text-gray-500 text-sm">Total Warehouses</p>
            <p className="text-3xl font-bold text-purple-600">
              {companies.reduce((sum, c) => sum + (c._count?.warehouses || 0), 0)}
            </p>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <p className="text-gray-500 text-sm">Total Products</p>
            <p className="text-3xl font-bold text-orange-600">
              {companies.reduce((sum, c) => sum + (c._count?.products || 0), 0)}
            </p>
          </div>
        </Card>
      </div>

      <Card>
        <div className="mb-4">
          <Search
            placeholder="Search companies..."
            allowClear
            style={{ width: 300 }}
            prefix={<SearchOutlined />}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
          />
        </div>
        <Table
          columns={columns}
          dataSource={filteredCompanies}
          rowKey="id"
          pagination={{ pageSize: 10, showTotal: (total) => `Total ${total} companies` }}
        />
      </Card>

      <Modal
        title={editingCompany ? 'Edit Company' : 'Add New Company'}
        open={modalOpen}
        onCancel={() => { setModalOpen(false); setEditingCompany(null); form.resetFields(); }}
        onOk={() => form.submit()}
        width={600}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item label="Company Name" name="name" rules={[{ required: true, message: 'Please enter company name' }]}>
            <Input placeholder="Enter company name" />
          </Form.Item>
          <Form.Item label="Company Code" name="code" rules={[{ required: true, message: 'Please enter company code' }]}>
            <Input placeholder="Enter unique company code (e.g., ACME001)" />
          </Form.Item>
          <Form.Item label="Description" name="description">
            <Input.TextArea placeholder="Company description" rows={3} />
          </Form.Item>
          <Form.Item label="Address" name="address">
            <Input.TextArea placeholder="Company address" rows={2} />
          </Form.Item>
          <div className="grid grid-cols-2 gap-4">
            <Form.Item label="Phone" name="phone">
              <Input placeholder="Phone number" />
            </Form.Item>
            <Form.Item label="Email" name="email">
              <Input placeholder="Email address" type="email" />
            </Form.Item>
          </div>
        </Form>
      </Modal>
    </div>
  );
}
