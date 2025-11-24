'use client';

import React, { useState } from 'react';

import { Table, Button, Tag, Card, Input, Select, Space, Avatar, Tooltip } from 'antd';
import {
  PlusOutlined,
  SearchOutlined,
  FilterOutlined,
  UsergroupAddOutlined,
  MailOutlined,
  PhoneOutlined,
  GlobalOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  CrownOutlined,
  ShopOutlined,
} from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const { Search } = Input;
const { Option } = Select;

// Mock client data
const mockClients = [
  {
    id: 'CLI-001',
    name: 'Amazon FBA UK',
    type: 'B2B',
    contactPerson: 'Account Manager',
    email: 'uk-seller-support@amazon.co.uk',
    phone: '+44 800 279 7234',
    country: 'United Kingdom',
    city: 'London',
    address: 'Amazon UK Services, 1 Principal Place, Worship Street, London EC2A 2FA',
    status: 'active',
    tier: 'Premium',
    segment: 'E-commerce Platform',
    totalRevenue: 450000,
    totalOrders: 1250,
    lastOrderDate: '2024-11-19',
    badges: ['Premium', 'Verified', 'High Volume', 'FBA'],
    channels: ['Amazon UK', 'Amazon EU'],
    creditLimit: 100000,
    paymentTerms: 'Net 14',
  },
  {
    id: 'CLI-002',
    name: 'Shopify Store - Health Foods',
    type: 'B2C',
    contactPerson: 'Emily Watson',
    email: 'emily@healthfoodsshop.com',
    phone: '+44 20 8765 4321',
    country: 'United Kingdom',
    city: 'Manchester',
    address: '45 Market Street, Manchester M1 1WR',
    status: 'active',
    tier: 'Gold',
    segment: 'Online Retailer',
    totalRevenue: 185000,
    totalOrders: 850,
    lastOrderDate: '2024-11-18',
    badges: ['Verified', 'Regular Customer', 'Shopify'],
    channels: ['Shopify', 'Direct'],
    creditLimit: 50000,
    paymentTerms: 'Net 30',
  },
  {
    id: 'CLI-003',
    name: 'Tesco Wholesale Division',
    type: 'B2B',
    contactPerson: 'David Miller',
    email: 'david.miller@tesco.com',
    phone: '+44 1707 912345',
    country: 'United Kingdom',
    city: 'Hertfordshire',
    address: 'Tesco House, Shire Park, Welwyn Garden City AL7 1GA',
    status: 'active',
    tier: 'Premium',
    segment: 'Retail Chain',
    totalRevenue: 680000,
    totalOrders: 320,
    lastOrderDate: '2024-11-17',
    badges: ['Premium', 'Verified', 'Corporate', 'Volume Discount'],
    channels: ['Direct', 'EDI'],
    creditLimit: 150000,
    paymentTerms: 'Net 60',
  },
  {
    id: 'CLI-004',
    name: 'Waitrose Partners',
    type: 'B2B',
    contactPerson: 'Sarah Thompson',
    email: 'sarah.thompson@waitrose.com',
    phone: '+44 1344 424680',
    country: 'United Kingdom',
    city: 'Bracknell',
    address: 'Waitrose Limited, Doncastle Road, Bracknell RG12 8YA',
    status: 'active',
    tier: 'Premium',
    segment: 'Retail Chain',
    totalRevenue: 520000,
    totalOrders: 280,
    lastOrderDate: '2024-11-16',
    badges: ['Premium', 'Verified', 'Corporate'],
    channels: ['Direct', 'EDI'],
    creditLimit: 120000,
    paymentTerms: 'Net 45',
  },
  {
    id: 'CLI-005',
    name: 'eBay Seller - Snacks Direct',
    type: 'B2C',
    contactPerson: 'Michael Brown',
    email: 'michael@snacksdirect.co.uk',
    phone: '+44 121 765 4321',
    country: 'United Kingdom',
    city: 'Birmingham',
    address: '123 High Street, Birmingham B1 1AA',
    status: 'active',
    tier: 'Silver',
    segment: 'Online Seller',
    totalRevenue: 95000,
    totalOrders: 420,
    lastOrderDate: '2024-11-15',
    badges: ['Verified', 'eBay'],
    channels: ['eBay', 'Direct'],
    creditLimit: 25000,
    paymentTerms: 'Net 30',
  },
  {
    id: 'CLI-006',
    name: 'Holland & Barrett Wholesale',
    type: 'B2B',
    contactPerson: 'Jessica Lee',
    email: 'jessica.lee@hollandandbarrett.com',
    phone: '+44 1455 230000',
    country: 'United Kingdom',
    city: 'Nuneaton',
    address: 'Samuel Ryder House, Barling Way, Nuneaton CV10 7RH',
    status: 'pending',
    tier: 'Gold',
    segment: 'Retail Chain',
    totalRevenue: 0,
    totalOrders: 0,
    lastOrderDate: null,
    badges: ['New Client', 'Corporate'],
    channels: ['Direct'],
    creditLimit: 75000,
    paymentTerms: 'Net 30',
  },
];

export default function ClientsPage() {
  const router = useRouter();
  const [filteredClients, setFilteredClients] = useState(mockClients);
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [tierFilter, setTierFilter] = useState('all');

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'green';
      case 'pending': return 'orange';
      case 'inactive': return 'red';
      default: return 'default';
    }
  };

  const getTierIcon = (tier: string) => {
    switch (tier) {
      case 'Premium': return <CrownOutlined style={{ color: '#FFD700' }} />;
      case 'Gold': return <CrownOutlined style={{ color: '#FFB800' }} />;
      case 'Silver': return <CrownOutlined style={{ color: '#C0C0C0' }} />;
      default: return null;
    }
  };

  const columns = [
    {
      title: 'Client',
      key: 'client',
      width: 300,
      render: (record: any) => (
        <Link href={`/clients/${record.id}`}>
          <div className="flex items-center gap-3 cursor-pointer">
            <Avatar size={40} style={{ backgroundColor: '#722ed1' }}>
              <UsergroupAddOutlined />
            </Avatar>
            <div>
              <div className="font-semibold text-purple-600 hover:underline flex items-center gap-2">
                {record.name}
                {getTierIcon(record.tier)}
              </div>
              <div className="text-xs text-gray-500">{record.id}</div>
            </div>
          </div>
        </Link>
      ),
    },
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      width: 90,
      render: (type: string) => (
        <Tag color={type === 'B2B' ? 'blue' : 'green'} className="font-semibold">
          {type}
        </Tag>
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
      title: 'Segment',
      dataIndex: 'segment',
      key: 'segment',
      width: 140,
      render: (segment: string) => <Tag color="cyan">{segment}</Tag>,
    },
    {
      title: 'Tier',
      dataIndex: 'tier',
      key: 'tier',
      width: 100,
      render: (tier: string) => (
        <Tag color={
          tier === 'Premium' ? 'gold' :
          tier === 'Gold' ? 'orange' :
          tier === 'Silver' ? 'default' :
          'blue'
        }>
          {getTierIcon(tier)} {tier}
        </Tag>
      ),
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
      width: 240,
      render: (badges: string[]) => (
        <div className="flex flex-wrap gap-1">
          {badges.map((badge, i) => (
            <Tag key={i} color={
              badge === 'Premium' ? 'gold' :
              badge === 'Verified' ? 'green' :
              badge === 'High Volume' ? 'purple' :
              badge === 'FBA' ? 'blue' :
              badge === 'Corporate' ? 'magenta' :
              badge === 'Regular Customer' ? 'cyan' :
              badge === 'New Client' ? 'orange' :
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
      title: 'Total Revenue',
      dataIndex: 'totalRevenue',
      key: 'revenue',
      width: 130,
      render: (value: number) => `£${value.toLocaleString()}`,
      sorter: (a: any, b: any) => b.totalRevenue - a.totalRevenue,
    },
    {
      title: 'Orders',
      dataIndex: 'totalOrders',
      key: 'orders',
      width: 90,
      sorter: (a: any, b: any) => b.totalOrders - a.totalOrders,
    },
    {
      title: 'Last Order',
      dataIndex: 'lastOrderDate',
      key: 'lastOrder',
      width: 110,
      render: (date: string | null) => date ? new Date(date).toLocaleDateString('en-GB') : '-',
      sorter: (a: any, b: any) => {
        if (!a.lastOrderDate) return 1;
        if (!b.lastOrderDate) return -1;
        return new Date(b.lastOrderDate).getTime() - new Date(a.lastOrderDate).getTime();
      },
    },
  ];

  const handleSearch = (value: string) => {
    const filtered = mockClients.filter(
      (client) =>
        client.name.toLowerCase().includes(value.toLowerCase()) ||
        client.contactPerson.toLowerCase().includes(value.toLowerCase()) ||
        client.email.toLowerCase().includes(value.toLowerCase())
    );
    setFilteredClients(filtered);
  };

  const handleStatusFilter = (value: string) => {
    setStatusFilter(value);
    if (value === 'all') {
      setFilteredClients(mockClients);
    } else {
      setFilteredClients(mockClients.filter(c => c.status === value));
    }
  };

  const handleTypeFilter = (value: string) => {
    setTypeFilter(value);
    if (value === 'all') {
      setFilteredClients(mockClients);
    } else {
      setFilteredClients(mockClients.filter(c => c.type === value));
    }
  };

  const handleTierFilter = (value: string) => {
    setTierFilter(value);
    if (value === 'all') {
      setFilteredClients(mockClients);
    } else {
      setFilteredClients(mockClients.filter(c => c.tier === value));
    }
  };

  return (
    <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              Clients Management
            </h1>
            <p className="text-gray-600 mt-1">
              Manage your B2B and B2C clients, customer relationships, and sales channels
            </p>
          </div>
          <Link href="/clients/new">
            <Button type="primary" icon={<PlusOutlined />} size="large">
              Add Client
            </Button>
          </Link>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Card>
            <div className="text-center">
              <p className="text-gray-500 text-sm">Total Clients</p>
              <p className="text-3xl font-bold text-purple-600">{mockClients.length}</p>
            </div>
          </Card>
          <Card>
            <div className="text-center">
              <p className="text-gray-500 text-sm">B2B Clients</p>
              <p className="text-3xl font-bold text-blue-600">
                {mockClients.filter(c => c.type === 'B2B').length}
              </p>
            </div>
          </Card>
          <Card>
            <div className="text-center">
              <p className="text-gray-500 text-sm">B2C Clients</p>
              <p className="text-3xl font-bold text-green-600">
                {mockClients.filter(c => c.type === 'B2C').length}
              </p>
            </div>
          </Card>
          <Card>
            <div className="text-center">
              <p className="text-gray-500 text-sm">Total Revenue (YTD)</p>
              <p className="text-3xl font-bold text-amber-600">
                £{mockClients.reduce((sum, c) => sum + c.totalRevenue, 0).toLocaleString()}
              </p>
            </div>
          </Card>
          <Card>
            <div className="text-center">
              <p className="text-gray-500 text-sm">Premium Clients</p>
              <p className="text-3xl font-bold text-yellow-600">
                {mockClients.filter(c => c.tier === 'Premium').length} 👑
              </p>
            </div>
          </Card>
        </div>

        {/* Filters and Search */}
        <Card>
          <div className="flex flex-wrap gap-4">
            <Search
              placeholder="Search clients, contacts, email..."
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
              value={typeFilter}
              onChange={handleTypeFilter}
              style={{ width: 120 }}
              placeholder="Type"
            >
              <Option value="all">All Types</Option>
              <Option value="B2B">B2B</Option>
              <Option value="B2C">B2C</Option>
            </Select>
            <Select
              value={tierFilter}
              onChange={handleTierFilter}
              style={{ width: 150 }}
              placeholder="Tier"
            >
              <Option value="all">All Tiers</Option>
              <Option value="Premium">Premium</Option>
              <Option value="Gold">Gold</Option>
              <Option value="Silver">Silver</Option>
            </Select>
            <Button icon={<FilterOutlined />}>Advanced Filters</Button>
          </div>
        </Card>

        {/* Clients Table */}
        <Card className="shadow-sm">
          <Table
            dataSource={filteredClients}
            columns={columns}
            rowKey="id"
            scroll={{ x: 1800 }}
            pagination={{
              pageSize: 10,
              showTotal: (total) => `Total ${total} clients`,
            }}
            onRow={(record) => ({
              onClick: () => router.push(`/clients/${record.id}`),
              style: { cursor: 'pointer' },
            })}
          />
        </Card>
      </div>
      );
}
