'use client';

import React, { useState, useEffect } from 'react';
import { Card, Descriptions, Table, Tabs, Button, Spin, message, Tag, Space } from 'antd';
import { ArrowLeftOutlined, EditOutlined, HomeOutlined, UserOutlined, ShopOutlined } from '@ant-design/icons';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/store/authStore';

interface Company {
  id: string;
  name: string;
  code: string;
  description?: string;
  address?: string;
  phone?: string;
  email?: string;
  createdAt: string;
  warehouses?: any[];
  users?: any[];
  _count?: {
    warehouses: number;
    products: number;
    users: number;
    customers: number;
    suppliers: number;
  };
}

export default function CompanyDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);
  const { token } = useAuthStore();

  // Ensure API URL doesn't have duplicate /api prefix
  const rawApiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://wms-api.alexandratechlab.com';
  const API_URL = rawApiUrl.endsWith('/api') ? rawApiUrl.replace(/\/api$/, '') : rawApiUrl;

  useEffect(() => {
    const fetchCompany = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${API_URL}/api/companies/${params.id}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) {
          throw new Error('Company not found');
        }

        const data = await response.json();
        setCompany(data);
      } catch (error) {
        console.error('Error fetching company:', error);
        message.error('Failed to load company details');
      } finally {
        setLoading(false);
      }
    };

    if (token && params.id) {
      fetchCompany();
    }
  }, [token, params.id]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <Spin size="large" tip="Loading company details..." />
      </div>
    );
  }

  if (!company) {
    return (
      <div className="text-center py-20">
        <h2 className="text-xl text-gray-500">Company not found</h2>
        <Button type="primary" className="mt-4" onClick={() => router.push('/protected/companies')}>
          Back to Companies
        </Button>
      </div>
    );
  }

  const warehouseColumns = [
    { title: 'Name', dataIndex: 'name', key: 'name' },
    { title: 'Code', dataIndex: 'code', key: 'code' },
    { title: 'Address', dataIndex: 'address', key: 'address' },
    {
      title: 'Status',
      dataIndex: 'isActive',
      key: 'status',
      render: (active: boolean) => (
        <Tag color={active ? 'green' : 'red'}>{active ? 'Active' : 'Inactive'}</Tag>
      )
    }
  ];

  const userColumns = [
    { title: 'Name', dataIndex: 'name', key: 'name' },
    { title: 'Email', dataIndex: 'email', key: 'email' },
    {
      title: 'Role',
      dataIndex: 'role',
      key: 'role',
      render: (role: string) => <Tag color="blue">{role}</Tag>
    }
  ];

  const tabItems = [
    {
      key: 'overview',
      label: 'Overview',
      children: (
        <Descriptions bordered column={2}>
          <Descriptions.Item label="Company Name">{company.name}</Descriptions.Item>
          <Descriptions.Item label="Code">{company.code}</Descriptions.Item>
          <Descriptions.Item label="Description" span={2}>{company.description || '-'}</Descriptions.Item>
          <Descriptions.Item label="Address" span={2}>{company.address || '-'}</Descriptions.Item>
          <Descriptions.Item label="Phone">{company.phone || '-'}</Descriptions.Item>
          <Descriptions.Item label="Email">{company.email || '-'}</Descriptions.Item>
          <Descriptions.Item label="Created">
            {new Date(company.createdAt).toLocaleDateString()}
          </Descriptions.Item>
        </Descriptions>
      )
    },
    {
      key: 'warehouses',
      label: `Warehouses (${company._count?.warehouses || 0})`,
      children: (
        <Table
          columns={warehouseColumns}
          dataSource={company.warehouses || []}
          rowKey="id"
          pagination={{ pageSize: 10 }}
        />
      )
    },
    {
      key: 'users',
      label: `Users (${company._count?.users || 0})`,
      children: (
        <Table
          columns={userColumns}
          dataSource={company.users || []}
          rowKey="id"
          pagination={{ pageSize: 10 }}
        />
      )
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <Button icon={<ArrowLeftOutlined />} onClick={() => router.push('/protected/companies')}>
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{company.name}</h1>
            <p className="text-gray-500">Company Code: {company.code}</p>
          </div>
        </div>
        <Link href={`/protected/companies/${company.id}/edit`}>
          <Button type="primary" icon={<EditOutlined />}>Edit Company</Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <div className="text-center">
            <HomeOutlined className="text-2xl text-blue-500 mb-2" />
            <p className="text-gray-500 text-sm">Warehouses</p>
            <p className="text-2xl font-bold">{company._count?.warehouses || 0}</p>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <ShopOutlined className="text-2xl text-green-500 mb-2" />
            <p className="text-gray-500 text-sm">Products</p>
            <p className="text-2xl font-bold">{company._count?.products || 0}</p>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <UserOutlined className="text-2xl text-purple-500 mb-2" />
            <p className="text-gray-500 text-sm">Users</p>
            <p className="text-2xl font-bold">{company._count?.users || 0}</p>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <p className="text-gray-500 text-sm">Customers</p>
            <p className="text-2xl font-bold">{company._count?.customers || 0}</p>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <p className="text-gray-500 text-sm">Suppliers</p>
            <p className="text-2xl font-bold">{company._count?.suppliers || 0}</p>
          </div>
        </Card>
      </div>

      <Card>
        <Tabs items={tabItems} defaultActiveKey="overview" />
      </Card>
    </div>
  );
}
