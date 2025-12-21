'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Table, Button, Input, Select, Tag, Space, Card, Form, Drawer, Modal, Tabs, App } from 'antd';
import {
  PlusOutlined,
  SearchOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  UserOutlined,
  MailOutlined,
  PhoneOutlined,
  InboxOutlined,
  CheckCircleOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import apiService from '@/services/api';

const { Search } = Input;
const { Option } = Select;

interface Customer {
  id: string;
  code: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  customerType?: 'B2C' | 'B2B';
  createdAt: string;
  updatedAt: string;
}

export default function CustomersPage() {
  const { modal, message } = App.useApp();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [activeTab, setActiveTab] = useState('all');
  const [searchText, setSearchText] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form] = Form.useForm();

  // Fetch customers from API
  const fetchCustomers = useCallback(async () => {
    try {
      setLoading(true);
      const data = await apiService.get('/customers');
      setCustomers(Array.isArray(data) ? data : []);
    } catch (err: any) {
      console.error('Failed to fetch customers:', err);
      message.error(err.message || 'Failed to load customers');
    } finally {
      setLoading(false);
    }
  }, [message]);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  // Filter customers by search text and status
  const filteredCustomers = customers.filter((c: Customer) => {
    const matchesSearch = !searchText ||
      c.name?.toLowerCase().includes(searchText.toLowerCase()) ||
      c.email?.toLowerCase().includes(searchText.toLowerCase()) ||
      c.code?.toLowerCase().includes(searchText.toLowerCase());
    return matchesSearch;
  });

  const allCustomers = filteredCustomers;
  const b2cCustomers = filteredCustomers.filter((c: Customer) => c.customerType === 'B2C');
  const b2bCustomers = filteredCustomers.filter((c: Customer) => c.customerType === 'B2B');

  const handleSubmit = async (values: any) => {
    try {
      setSaving(true);

      if (editMode && selectedCustomer) {
        // UPDATE existing customer
        await apiService.put(`/customers/${selectedCustomer.id}`, values);
        message.success('Customer updated successfully!');
      } else {
        // CREATE new customer
        await apiService.post('/customers', values);
        message.success('Customer created successfully!');
      }

      form.resetFields();
      setModalOpen(false);
      setEditMode(false);
      setSelectedCustomer(null);
      fetchCustomers();
    } catch (error: any) {
      console.error('Error saving customer:', error);
      message.error(error.response?.data?.message || error.message || 'Failed to save customer');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (record: Customer) => {
    setSelectedCustomer(record);
    form.setFieldsValue({
      code: record.code,
      name: record.name,
      email: record.email,
      phone: record.phone,
      address: record.address,
      customerType: record.customerType,
    });
    setEditMode(true);
    setModalOpen(true);
  };

  const handleDelete = (record: Customer) => {
    modal.confirm({
      title: 'Delete Customer',
      content: `Are you sure you want to delete customer "${record.name}"? This action cannot be undone.`,
      okText: 'Delete',
      okType: 'danger',
      onOk: async () => {
        try {
          await apiService.delete(`/customers/${record.id}`);
          message.success('Customer deleted successfully!');
          fetchCustomers();
        } catch (error: any) {
          message.error(error.response?.data?.message || error.message || 'Failed to delete customer');
        }
      },
    });
  };

  const handleAddCustomer = () => {
    setSelectedCustomer(null);
    setEditMode(false);
    form.resetFields();
    setModalOpen(true);
  };

  const columns = [
    {
      title: 'Customer Code',
      dataIndex: 'code',
      key: 'code',
      width: 130,
      render: (text: string) => (
        <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">{text}</span>
      ),
    },
    {
      title: 'Customer Name',
      dataIndex: 'name',
      key: 'name',
      width: 200,
      render: (text: string, record: Customer) => (
        <div
          className="flex items-center gap-2 cursor-pointer hover:text-blue-600"
          onClick={() => router.push(`/protected/customers/${record.id}`)}
        >
          <UserOutlined className="text-blue-500" />
          <span className="font-medium text-blue-600 hover:underline">{text}</span>
        </div>
      ),
    },
    {
      title: 'Orders',
      dataIndex: '_count',
      key: 'orders',
      width: 80,
      render: (_count: any) => (
        <Tag color="blue">{_count?.orders || 0}</Tag>
      ),
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
      width: 200,
      render: (email: string) => (
        <div className="flex items-center gap-2">
          <MailOutlined className="text-gray-400" />
          <span>{email || '-'}</span>
        </div>
      ),
    },
    {
      title: 'Phone',
      dataIndex: 'phone',
      key: 'phone',
      width: 150,
      render: (phone: string) => (
        <div className="flex items-center gap-2">
          <PhoneOutlined className="text-gray-400" />
          <span>{phone || '-'}</span>
        </div>
      ),
    },
    {
      title: 'Type',
      dataIndex: 'customerType',
      key: 'customerType',
      width: 100,
      render: (type: string) => (
        <Tag color={type === 'B2B' ? 'blue' : 'green'} className="uppercase">
          {type || 'N/A'}
        </Tag>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, record: Customer) => (
        <Space>
          <Button
            type="link"
            icon={<EyeOutlined />}
            onClick={() => {
              setSelectedCustomer(record);
              setDrawerOpen(true);
            }}
          >
            View
          </Button>
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

  const renderTable = (dataSource: Customer[]) => (
    <>
      <div className="flex gap-4 flex-wrap mb-4">
        <Search
          placeholder="Search by name, email, or code..."
          allowClear
          style={{ width: 350 }}
          prefix={<SearchOutlined />}
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
        />
        <Button icon={<ReloadOutlined />} onClick={fetchCustomers}>Refresh</Button>
      </div>
      <Table
        columns={columns}
        dataSource={dataSource}
        rowKey="id"
        loading={loading}
        pagination={{
          total: dataSource.length,
          pageSize: 10,
          showSizeChanger: true,
          showTotal: (total) => `Total ${total} customers`,
        }}
      />
    </>
  );

  const tabItems = [
    {
      key: 'all',
      label: <span className="flex items-center gap-2"><InboxOutlined />All Customers ({allCustomers.length})</span>,
      children: renderTable(allCustomers),
    },
    {
      key: 'b2c',
      label: <span className="flex items-center gap-2"><UserOutlined />B2C ({b2cCustomers.length})</span>,
      children: renderTable(b2cCustomers),
    },
    {
      key: 'b2b',
      label: <span className="flex items-center gap-2"><CheckCircleOutlined />B2B ({b2bCustomers.length})</span>,
      children: renderTable(b2bCustomers),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Customer Management
          </h1>
          <p className="text-gray-600 mt-1">Manage your customer database and relationships</p>
        </div>
        <Button type="primary" icon={<PlusOutlined />} size="large" onClick={handleAddCustomer}>
          Add Customer
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <div className="text-center">
            <p className="text-gray-500 text-sm">Total Customers</p>
            <p className="text-3xl font-bold text-blue-600">{allCustomers.length}</p>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <p className="text-gray-500 text-sm">B2C Customers</p>
            <p className="text-3xl font-bold text-green-600">{b2cCustomers.length}</p>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <p className="text-gray-500 text-sm">B2B Customers</p>
            <p className="text-3xl font-bold text-purple-600">{b2bCustomers.length}</p>
          </div>
        </Card>
      </div>

      <Card className="shadow-sm">
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={tabItems}
          size="large"
        />
      </Card>

      <Drawer
        title="Customer Details"
        placement="right"
        width={600}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
      >
        {selectedCustomer && (
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold text-lg">{selectedCustomer.name}</h3>
              <p className="text-gray-600">{selectedCustomer.email || 'No email provided'}</p>
            </div>
            <div className="border-t pt-4">
              <p><strong>Customer Code:</strong> <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">{selectedCustomer.code}</span></p>
              <p><strong>Type:</strong> <Tag color={selectedCustomer.customerType === 'B2B' ? 'blue' : 'green'}>{selectedCustomer.customerType}</Tag></p>
              <p><strong>Phone:</strong> {selectedCustomer.phone || 'Not provided'}</p>
              <p><strong>Address:</strong> {selectedCustomer.address || 'Not provided'}</p>
              <p className="text-xs text-gray-500 mt-4">Created: {new Date(selectedCustomer.createdAt).toLocaleDateString()}</p>
            </div>
          </div>
        )}
      </Drawer>

      <Modal
        title={editMode ? 'Edit Customer' : 'Add Customer'}
        open={modalOpen}
        onCancel={() => {
          setModalOpen(false);
          setEditMode(false);
          setSelectedCustomer(null);
          form.resetFields();
        }}
        onOk={() => form.submit()}
        width={600}
        confirmLoading={saving}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item label="Customer Code" name="code" rules={[{ required: true, message: 'Please enter customer code' }]}>
            <Input placeholder="Enter customer code (e.g., CUST-001)" disabled={editMode} />
          </Form.Item>
          <Form.Item label="Customer Name" name="name" rules={[{ required: true, message: 'Please enter customer name' }]}>
            <Input placeholder="Enter customer name" />
          </Form.Item>
          <Form.Item label="Customer Type" name="customerType" rules={[{ required: true, message: 'Please select customer type' }]}>
            <Select placeholder="Select customer type">
              <Option value="B2C">B2C (Business to Consumer)</Option>
              <Option value="B2B">B2B (Business to Business)</Option>
            </Select>
          </Form.Item>
          <Form.Item label="Email" name="email" rules={[{ type: 'email', message: 'Please enter a valid email' }]}>
            <Input placeholder="Enter email (optional)" />
          </Form.Item>
          <Form.Item label="Phone" name="phone">
            <Input placeholder="Enter phone number (optional)" />
          </Form.Item>
          <Form.Item label="Address" name="address">
            <Input.TextArea placeholder="Enter address (optional)" rows={3} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
