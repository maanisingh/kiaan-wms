'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Table, Button, Tag, Card, Input, Select, Space, Avatar, Tooltip, Modal, Form, App } from 'antd';
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
  EditOutlined,
  DeleteOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import apiService from '@/services/api';

const { Search } = Input;
const { Option } = Select;

interface Client {
  id: string;
  name: string;
  type: 'B2B' | 'B2C';
  contactPerson?: string;
  email?: string;
  phone?: string;
  country?: string;
  city?: string;
  address?: string;
  status?: 'active' | 'pending' | 'inactive';
  tier?: string;
  segment?: string;
  totalRevenue?: number;
  totalOrders?: number;
  lastOrderDate?: string;
  badges?: string[];
  channels?: string[];
  creditLimit?: number;
  paymentTerms?: string;
  createdAt: string;
  updatedAt: string;
}

export default function ClientsPage() {
  const { modal, message } = App.useApp();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [clients, setClients] = useState<Client[]>([]);
  const [filteredClients, setFilteredClients] = useState<Client[]>([]);
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [tierFilter, setTierFilter] = useState('all');
  const [searchText, setSearchText] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [saving, setSaving] = useState(false);
  const [form] = Form.useForm();

  // Fetch clients from API
  const fetchClients = useCallback(async () => {
    try {
      setLoading(true);
      const data = await apiService.get('/clients');
      setClients(Array.isArray(data) ? data : []);
      setFilteredClients(Array.isArray(data) ? data : []);
    } catch (err: any) {
      console.error('Failed to fetch clients:', err);
      message.error(err.message || 'Failed to load clients');
    } finally {
      setLoading(false);
    }
  }, [message]);

  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  // Apply filters
  useEffect(() => {
    let filtered = clients;

    if (statusFilter !== 'all') {
      filtered = filtered.filter(c => c.status === statusFilter);
    }

    if (typeFilter !== 'all') {
      filtered = filtered.filter(c => c.type === typeFilter);
    }

    if (tierFilter !== 'all') {
      filtered = filtered.filter(c => c.tier === tierFilter);
    }

    if (searchText) {
      const search = searchText.toLowerCase();
      filtered = filtered.filter(c =>
        c.name?.toLowerCase().includes(search) ||
        c.contactPerson?.toLowerCase().includes(search) ||
        c.email?.toLowerCase().includes(search)
      );
    }

    setFilteredClients(filtered);
  }, [clients, statusFilter, typeFilter, tierFilter, searchText]);

  const handleSubmit = async (values: any) => {
    try {
      setSaving(true);

      if (editMode && selectedClient) {
        // UPDATE existing client
        await apiService.put(`/clients/${selectedClient.id}`, values);
        message.success('Client updated successfully!');
      } else {
        // CREATE new client
        await apiService.post('/clients', values);
        message.success('Client created successfully!');
      }

      form.resetFields();
      setModalOpen(false);
      setEditMode(false);
      setSelectedClient(null);
      fetchClients();
    } catch (error: any) {
      console.error('Error saving client:', error);
      message.error(error.response?.data?.message || error.message || 'Failed to save client');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (record: Client) => {
    setSelectedClient(record);
    form.setFieldsValue({
      name: record.name,
      type: record.type,
      contactPerson: record.contactPerson,
      email: record.email,
      phone: record.phone,
      country: record.country,
      city: record.city,
      address: record.address,
      tier: record.tier,
      segment: record.segment,
    });
    setEditMode(true);
    setModalOpen(true);
  };

  const handleDelete = (record: Client) => {
    modal.confirm({
      title: 'Delete Client',
      content: `Are you sure you want to delete client "${record.name}"? This action cannot be undone.`,
      okText: 'Delete',
      okType: 'danger',
      onOk: async () => {
        try {
          await apiService.delete(`/clients/${record.id}`);
          message.success('Client deleted successfully!');
          fetchClients();
        } catch (error: any) {
          message.error(error.response?.data?.message || error.message || 'Failed to delete client');
        }
      },
    });
  };

  const handleAddClient = () => {
    setSelectedClient(null);
    setEditMode(false);
    form.resetFields();
    setModalOpen(true);
  };

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
      render: (record: Client) => (
        <div className="flex items-center gap-3">
          <Avatar size={40} style={{ backgroundColor: '#722ed1' }}>
            <UsergroupAddOutlined />
          </Avatar>
          <div>
            <div className="font-semibold text-purple-600 flex items-center gap-2">
              {record.name}
              {getTierIcon(record.tier || '')}
            </div>
            <div className="text-xs text-gray-500">{record.id?.slice(0, 8)}</div>
          </div>
        </div>
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
      render: (record: Client) => (
        <div className="text-xs">
          <div className="font-medium">{record.contactPerson || '-'}</div>
          <div className="text-gray-500 flex items-center gap-1 mt-1">
            <MailOutlined /> {record.email || '-'}
          </div>
          <div className="text-gray-500 flex items-center gap-1">
            <PhoneOutlined /> {record.phone || '-'}
          </div>
        </div>
      ),
    },
    {
      title: 'Location',
      key: 'location',
      width: 150,
      render: (record: Client) => (
        <div>
          <div className="font-medium">{record.city || '-'}</div>
          <div className="text-xs text-gray-500">{record.country || '-'}</div>
        </div>
      ),
    },
    {
      title: 'Segment',
      dataIndex: 'segment',
      key: 'segment',
      width: 140,
      render: (segment: string) => segment ? <Tag color="cyan">{segment}</Tag> : '-',
    },
    {
      title: 'Tier',
      dataIndex: 'tier',
      key: 'tier',
      width: 100,
      render: (tier: string) => tier ? (
        <Tag color={
          tier === 'Premium' ? 'gold' :
          tier === 'Gold' ? 'orange' :
          tier === 'Silver' ? 'default' :
          'blue'
        }>
          {getTierIcon(tier)} {tier}
        </Tag>
      ) : '-',
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
          {' '}{status || 'active'}
        </Tag>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 200,
      render: (_: any, record: Client) => (
        <Space>
          <Button type="link" icon={<EditOutlined />} onClick={() => handleEdit(record)}>
            Edit
          </Button>
          <Button type="link" danger icon={<DeleteOutlined />} onClick={() => handleDelete(record)}>
            Delete
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            Clients Management
          </h1>
          <p className="text-gray-600 mt-1">
            Manage your B2B and B2C clients, customer relationships, and sales channels
          </p>
        </div>
        <Button type="primary" icon={<PlusOutlined />} size="large" onClick={handleAddClient}>
          Add Client
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <div className="text-center">
            <p className="text-gray-500 text-sm">Total Clients</p>
            <p className="text-3xl font-bold text-purple-600">{clients.length}</p>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <p className="text-gray-500 text-sm">B2B Clients</p>
            <p className="text-3xl font-bold text-blue-600">
              {clients.filter(c => c.type === 'B2B').length}
            </p>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <p className="text-gray-500 text-sm">B2C Clients</p>
            <p className="text-3xl font-bold text-green-600">
              {clients.filter(c => c.type === 'B2C').length}
            </p>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <p className="text-gray-500 text-sm">Active</p>
            <p className="text-3xl font-bold text-green-600">
              {clients.filter(c => c.status === 'active').length}
            </p>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <p className="text-gray-500 text-sm">Premium Clients</p>
            <p className="text-3xl font-bold text-yellow-600">
              {clients.filter(c => c.tier === 'Premium').length}
            </p>
          </div>
        </Card>
      </div>

      <Card>
        <div className="flex flex-wrap gap-4 mb-4">
          <Search
            placeholder="Search clients, contacts, email..."
            style={{ width: 400 }}
            prefix={<SearchOutlined />}
            allowClear
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
          />
          <Select
            value={statusFilter}
            onChange={setStatusFilter}
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
            onChange={setTypeFilter}
            style={{ width: 120 }}
            placeholder="Type"
          >
            <Option value="all">All Types</Option>
            <Option value="B2B">B2B</Option>
            <Option value="B2C">B2C</Option>
          </Select>
          <Select
            value={tierFilter}
            onChange={setTierFilter}
            style={{ width: 150 }}
            placeholder="Tier"
          >
            <Option value="all">All Tiers</Option>
            <Option value="Premium">Premium</Option>
            <Option value="Gold">Gold</Option>
            <Option value="Silver">Silver</Option>
          </Select>
          <Button icon={<ReloadOutlined />} onClick={fetchClients}>Refresh</Button>
        </div>
      </Card>

      <Card className="shadow-sm">
        <Table
          dataSource={filteredClients}
          columns={columns}
          rowKey="id"
          loading={loading}
          scroll={{ x: 1400 }}
          pagination={{
            pageSize: 10,
            showTotal: (total) => `Total ${total} clients`,
          }}
        />
      </Card>

      <Modal
        title={editMode ? 'Edit Client' : 'Add Client'}
        open={modalOpen}
        onCancel={() => {
          setModalOpen(false);
          setEditMode(false);
          setSelectedClient(null);
          form.resetFields();
        }}
        onOk={() => form.submit()}
        width={700}
        confirmLoading={saving}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item label="Client Name" name="name" rules={[{ required: true, message: 'Please enter client name' }]}>
            <Input placeholder="Enter client name" />
          </Form.Item>
          <Form.Item label="Client Type" name="type" rules={[{ required: true, message: 'Please select client type' }]}>
            <Select placeholder="Select type">
              <Option value="B2B">B2B (Business to Business)</Option>
              <Option value="B2C">B2C (Business to Consumer)</Option>
            </Select>
          </Form.Item>
          <Form.Item label="Contact Person" name="contactPerson">
            <Input placeholder="Enter contact person name" />
          </Form.Item>
          <Form.Item label="Email" name="email" rules={[{ type: 'email', message: 'Please enter a valid email' }]}>
            <Input placeholder="Enter email" />
          </Form.Item>
          <Form.Item label="Phone" name="phone">
            <Input placeholder="Enter phone number" />
          </Form.Item>
          <Form.Item label="Country" name="country">
            <Input placeholder="Enter country" />
          </Form.Item>
          <Form.Item label="City" name="city">
            <Input placeholder="Enter city" />
          </Form.Item>
          <Form.Item label="Address" name="address">
            <Input.TextArea placeholder="Enter address" rows={2} />
          </Form.Item>
          <Form.Item label="Tier" name="tier">
            <Select placeholder="Select tier">
              <Option value="Premium">Premium</Option>
              <Option value="Gold">Gold</Option>
              <Option value="Silver">Silver</Option>
            </Select>
          </Form.Item>
          <Form.Item label="Segment" name="segment">
            <Input placeholder="Enter business segment (e.g., E-commerce, Retail)" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
