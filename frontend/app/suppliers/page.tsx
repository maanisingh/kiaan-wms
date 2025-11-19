'use client';

import React, { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Table, Button, Tag, Card, Input, Select, Space, Badge, Avatar, Tooltip } from 'antd';
import {
  PlusOutlined,
  SearchOutlined,
  FilterOutlined,
  ContactsOutlined,
  MailOutlined,
  PhoneOutlined,
  GlobalOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  StarFilled,
} from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const { Search } = Input;
const { Option } = Select;

// Mock supplier data
const mockSuppliers = [
  {
    id: 'SUP-001',
    name: 'Global Foods UK Ltd',
    contactPerson: 'John Smith',
    email: 'john.smith@globalfoods.co.uk',
    phone: '+44 20 7123 4567',
    country: 'United Kingdom',
    city: 'London',
    address: '123 Oxford Street, London W1D 2HG',
    status: 'active',
    rating: 5,
    category: 'Food & Beverage',
    productsSupplied: 45,
    totalPurchases: 125000,
    lastOrderDate: '2024-11-18',
    paymentTerms: 'Net 30',
    badges: ['Premium', 'Verified', 'Fast Delivery'],
    channels: ['Amazon UK', 'Shopify'],
  },
  {
    id: 'SUP-002',
    name: 'Nakd Foods Wholesale',
    contactPerson: 'Sarah Johnson',
    email: 'sarah@nakdfoods.com',
    phone: '+44 161 123 4567',
    country: 'United Kingdom',
    city: 'Manchester',
    address: '45 Deansgate, Manchester M3 2AY',
    status: 'active',
    rating: 4,
    category: 'Food & Beverage',
    productsSupplied: 28,
    totalPurchases: 85000,
    lastOrderDate: '2024-11-17',
    paymentTerms: 'Net 45',
    badges: ['Organic Certified', 'Verified'],
    channels: ['Amazon UK'],
  },
  {
    id: 'SUP-003',
    name: 'Packaging Solutions Ltd',
    contactPerson: 'Michael Brown',
    email: 'michael@packagingsolutions.com',
    phone: '+44 121 123 4567',
    country: 'United Kingdom',
    city: 'Birmingham',
    address: '78 High Street, Birmingham B1 1BN',
    status: 'active',
    rating: 5,
    category: 'Packaging',
    productsSupplied: 12,
    totalPurchases: 45000,
    lastOrderDate: '2024-11-16',
    paymentTerms: 'Net 30',
    badges: ['Eco-Friendly', 'Fast Delivery'],
    channels: ['Direct'],
  },
  {
    id: 'SUP-004',
    name: 'Graze Snacks Distributor',
    contactPerson: 'Emma Wilson',
    email: 'emma@grazedistributor.com',
    phone: '+44 20 8123 4567',
    country: 'United Kingdom',
    city: 'London',
    address: '234 Camden High St, London NW1 8QS',
    status: 'active',
    rating: 4,
    category: 'Food & Beverage',
    productsSupplied: 35,
    totalPurchases: 95000,
    lastOrderDate: '2024-11-15',
    paymentTerms: 'Net 30',
    badges: ['Verified', 'Volume Discount'],
    channels: ['Amazon UK', 'eBay'],
  },
  {
    id: 'SUP-005',
    name: 'KIND Bars UK',
    contactPerson: 'David Lee',
    email: 'david@kindbars.co.uk',
    phone: '+44 20 7987 6543',
    country: 'United Kingdom',
    city: 'London',
    address: '567 Regent Street, London W1B 5TF',
    status: 'pending',
    rating: 3,
    category: 'Food & Beverage',
    productsSupplied: 18,
    totalPurchases: 52000,
    lastOrderDate: '2024-11-10',
    paymentTerms: 'Net 60',
    badges: ['New Supplier'],
    channels: ['Amazon UK'],
  },
  {
    id: 'SUP-006',
    name: 'Euro Logistics Partners',
    contactPerson: 'Anna Schmidt',
    email: 'anna@eurologistics.de',
    phone: '+49 30 1234 5678',
    country: 'Germany',
    city: 'Berlin',
    address: 'Friedrichstraße 123, 10117 Berlin',
    status: 'inactive',
    rating: 3,
    category: 'Logistics',
    productsSupplied: 0,
    totalPurchases: 15000,
    lastOrderDate: '2024-08-20',
    paymentTerms: 'Net 30',
    badges: ['International'],
    channels: ['Amazon EU'],
  },
];

export default function SuppliersPage() {
  const router = useRouter();
  const [filteredSuppliers, setFilteredSuppliers] = useState(mockSuppliers);
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'green';
      case 'pending': return 'orange';
      case 'inactive': return 'red';
      default: return 'default';
    }
  };

  const getRatingStars = (rating: number) => {
    return (
      <span className="flex items-center gap-1">
        {[...Array(5)].map((_, i) => (
          <StarFilled
            key={i}
            style={{ color: i < rating ? '#faad14' : '#d9d9d9', fontSize: 14 }}
          />
        ))}
      </span>
    );
  };

  const columns = [
    {
      title: 'Supplier',
      key: 'supplier',
      width: 280,
      render: (record: any) => (
        <Link href={`/suppliers/${record.id}`}>
          <div className="flex items-center gap-3 cursor-pointer">
            <Avatar size={40} style={{ backgroundColor: '#1890ff' }}>
              <ContactsOutlined />
            </Avatar>
            <div>
              <div className="font-semibold text-blue-600 hover:underline">
                {record.name}
              </div>
              <div className="text-xs text-gray-500">{record.id}</div>
            </div>
          </div>
        </Link>
      ),
    },
    {
      title: 'Contact',
      key: 'contact',
      width: 220,
      render: (record: any) => (
        <div className="text-xs">
          <div className="font-medium">{record.contactPerson}</div>
          <div className="text-gray-500 flex items-center gap-1 mt-1">
            <MailOutlined /> {record.email}
          </div>
          <div className="text-gray-500 flex items-center gap-1">
            <PhoneOutlined /> {record.phone}
          </div>
        </div>
      ),
    },
    {
      title: 'Location',
      key: 'location',
      width: 150,
      render: (record: any) => (
        <div>
          <div className="font-medium">{record.city}</div>
          <div className="text-xs text-gray-500">{record.country}</div>
        </div>
      ),
    },
    {
      title: 'Category',
      dataIndex: 'category',
      key: 'category',
      width: 140,
      render: (category: string) => <Tag color="blue">{category}</Tag>,
    },
    {
      title: 'Rating',
      dataIndex: 'rating',
      key: 'rating',
      width: 120,
      render: (rating: number) => getRatingStars(rating),
      sorter: (a: any, b: any) => b.rating - a.rating,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => (
        <Tag color={getStatusColor(status)} className="uppercase">
          {status === 'active' && <CheckCircleOutlined />}
          {status === 'inactive' && <CloseCircleOutlined />}
          {' '}{status}
        </Tag>
      ),
    },
    {
      title: 'Badges',
      dataIndex: 'badges',
      key: 'badges',
      width: 220,
      render: (badges: string[]) => (
        <div className="flex flex-wrap gap-1">
          {badges.map((badge, i) => (
            <Tag key={i} color={
              badge === 'Premium' ? 'gold' :
              badge === 'Verified' ? 'green' :
              badge === 'Organic Certified' ? 'cyan' :
              badge === 'Fast Delivery' ? 'blue' :
              badge === 'Eco-Friendly' ? 'lime' :
              badge === 'New Supplier' ? 'orange' :
              'default'
            }>
              {badge}
            </Tag>
          ))}
        </div>
      ),
    },
    {
      title: 'Channels',
      dataIndex: 'channels',
      key: 'channels',
      width: 150,
      render: (channels: string[]) => (
        <div className="flex flex-wrap gap-1">
          {channels.map((channel, i) => (
            <Tag key={i} color="purple" icon={<GlobalOutlined />}>
              {channel}
            </Tag>
          ))}
        </div>
      ),
    },
    {
      title: 'Products',
      dataIndex: 'productsSupplied',
      key: 'products',
      width: 90,
      sorter: (a: any, b: any) => b.productsSupplied - a.productsSupplied,
    },
    {
      title: 'Total Purchases',
      dataIndex: 'totalPurchases',
      key: 'purchases',
      width: 130,
      render: (value: number) => `£${value.toLocaleString()}`,
      sorter: (a: any, b: any) => b.totalPurchases - a.totalPurchases,
    },
    {
      title: 'Last Order',
      dataIndex: 'lastOrderDate',
      key: 'lastOrder',
      width: 110,
      render: (date: string) => new Date(date).toLocaleDateString('en-GB'),
      sorter: (a: any, b: any) => new Date(b.lastOrderDate).getTime() - new Date(a.lastOrderDate).getTime(),
    },
  ];

  const handleSearch = (value: string) => {
    const filtered = mockSuppliers.filter(
      (supplier) =>
        supplier.name.toLowerCase().includes(value.toLowerCase()) ||
        supplier.contactPerson.toLowerCase().includes(value.toLowerCase()) ||
        supplier.email.toLowerCase().includes(value.toLowerCase())
    );
    setFilteredSuppliers(filtered);
  };

  const handleStatusFilter = (value: string) => {
    setStatusFilter(value);
    if (value === 'all') {
      setFilteredSuppliers(mockSuppliers);
    } else {
      setFilteredSuppliers(mockSuppliers.filter(s => s.status === value));
    }
  };

  const handleCategoryFilter = (value: string) => {
    setCategoryFilter(value);
    if (value === 'all') {
      setFilteredSuppliers(mockSuppliers);
    } else {
      setFilteredSuppliers(mockSuppliers.filter(s => s.category === value));
    }
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              Suppliers Management
            </h1>
            <p className="text-gray-600 mt-1">
              Manage your suppliers, contacts, and procurement relationships
            </p>
          </div>
          <Link href="/suppliers/new">
            <Button type="primary" icon={<PlusOutlined />} size="large">
              Add Supplier
            </Button>
          </Link>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <div className="text-center">
              <p className="text-gray-500 text-sm">Total Suppliers</p>
              <p className="text-3xl font-bold text-blue-600">{mockSuppliers.length}</p>
            </div>
          </Card>
          <Card>
            <div className="text-center">
              <p className="text-gray-500 text-sm">Active</p>
              <p className="text-3xl font-bold text-green-600">
                {mockSuppliers.filter(s => s.status === 'active').length}
              </p>
            </div>
          </Card>
          <Card>
            <div className="text-center">
              <p className="text-gray-500 text-sm">Total Purchases (YTD)</p>
              <p className="text-3xl font-bold text-purple-600">
                £{mockSuppliers.reduce((sum, s) => sum + s.totalPurchases, 0).toLocaleString()}
              </p>
            </div>
          </Card>
          <Card>
            <div className="text-center">
              <p className="text-gray-500 text-sm">Average Rating</p>
              <p className="text-3xl font-bold text-yellow-600">
                {(mockSuppliers.reduce((sum, s) => sum + s.rating, 0) / mockSuppliers.length).toFixed(1)} ⭐
              </p>
            </div>
          </Card>
        </div>

        {/* Filters and Search */}
        <Card>
          <div className="flex flex-wrap gap-4">
            <Search
              placeholder="Search suppliers, contacts, email..."
              onSearch={handleSearch}
              style={{ width: 400 }}
              prefix={<SearchOutlined />}
              allowClear
            />
            <Select
              value={statusFilter}
              onChange={handleStatusFilter}
              style={{ width: 150 }}
              placeholder="Status"
            >
              <Option value="all">All Status</Option>
              <Option value="active">Active</Option>
              <Option value="pending">Pending</Option>
              <Option value="inactive">Inactive</Option>
            </Select>
            <Select
              value={categoryFilter}
              onChange={handleCategoryFilter}
              style={{ width: 180 }}
              placeholder="Category"
            >
              <Option value="all">All Categories</Option>
              <Option value="Food & Beverage">Food & Beverage</Option>
              <Option value="Packaging">Packaging</Option>
              <Option value="Logistics">Logistics</Option>
            </Select>
            <Button icon={<FilterOutlined />}>Advanced Filters</Button>
          </div>
        </Card>

        {/* Suppliers Table */}
        <Card className="shadow-sm">
          <Table
            dataSource={filteredSuppliers}
            columns={columns}
            rowKey="id"
            scroll={{ x: 1600 }}
            pagination={{
              pageSize: 10,
              showTotal: (total) => `Total ${total} suppliers`,
            }}
            onRow={(record) => ({
              onClick: () => router.push(`/suppliers/${record.id}`),
              style: { cursor: 'pointer' },
            })}
          />
        </Card>
      </div>
    </MainLayout>
  );
}
