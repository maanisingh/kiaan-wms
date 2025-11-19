'use client';

import React, { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Table, Button, Input, Select, Tag, Space, Card, Form, Drawer, message, Modal, Tabs } from 'antd';
import {
  PlusOutlined,
  SearchOutlined,
  FilterOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  UserOutlined,
  MailOutlined,
  PhoneOutlined,
  InboxOutlined,
  CheckCircleOutlined,
  StopOutlined,
} from '@ant-design/icons';
import { useModal } from '@/hooks/useModal';

const { Search } = Input;
const { Option } = Select;

export default function CustomersPage() {
  const [loading, setLoading] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('all');
  const addModal = useModal();
  const editModal = useModal();
  const [form] = Form.useForm();

  // Mock data
  const customers = [
    {
      id: '1',
      name: 'Acme Corporation',
      email: 'contact@acme.com',
      phone: '+1 234 567 8900',
      address: '123 Business St, New York, NY',
      status: 'active',
      totalOrders: 45,
      totalSpent: 125000,
    },
    {
      id: '2',
      name: 'TechStart Inc',
      email: 'info@techstart.com',
      phone: '+1 234 567 8901',
      address: '456 Tech Ave, San Francisco, CA',
      status: 'active',
      totalOrders: 32,
      totalSpent: 98000,
    },
    {
      id: '3',
      name: 'Global Traders Ltd',
      email: 'sales@globaltraders.com',
      phone: '+1 234 567 8902',
      address: '789 Commerce Blvd, Chicago, IL',
      status: 'inactive',
      totalOrders: 18,
      totalSpent: 54000,
    },
  ];

  // Filter customers by status
  const allCustomers = customers;
  const activeCustomers = customers.filter(c => c.status === 'active');
  const inactiveCustomers = customers.filter(c => c.status === 'inactive');

  const handleSubmit = (values: any) => {
    console.log('Form values:', values);
    message.success('Customer saved successfully!');
    form.resetFields();
    addModal.close();
    editModal.close();
  };

  const handleEdit = (record: any) => {
    setSelectedCustomer(record);
    form.setFieldsValue(record);
    editModal.open();
  };

  const handleDelete = (record: any) => {
    Modal.confirm({
      title: 'Delete Customer',
      content: 'Are you sure you want to delete this customer?',
      onOk: () => {
        message.success('Customer deleted successfully!');
      },
    });
  };

  const columns = [
    {
      title: 'Customer Name',
      dataIndex: 'name',
      key: 'name',
      render: (text: string) => (
        <div className="flex items-center gap-2">
          <UserOutlined className="text-blue-500" />
          <span className="font-medium">{text}</span>
        </div>
      ),
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
      render: (email: string) => (
        <div className="flex items-center gap-2">
          <MailOutlined className="text-gray-400" />
          <span>{email}</span>
        </div>
      ),
    },
    {
      title: 'Phone',
      dataIndex: 'phone',
      key: 'phone',
      render: (phone: string) => (
        <div className="flex items-center gap-2">
          <PhoneOutlined className="text-gray-400" />
          <span>{phone}</span>
        </div>
      ),
    },
    {
      title: 'Total Orders',
      dataIndex: 'totalOrders',
      key: 'totalOrders',
      sorter: (a: any, b: any) => a.totalOrders - b.totalOrders,
    },
    {
      title: 'Total Spent',
      dataIndex: 'totalSpent',
      key: 'totalSpent',
      render: (amount: number) => `$${amount.toLocaleString()}`,
      sorter: (a: any, b: any) => a.totalSpent - b.totalSpent,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={status === 'active' ? 'green' : 'red'} className="uppercase">
          {status}
        </Tag>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, record: any) => (
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

  const renderTable = (dataSource: any[]) => (
    <>
      <div className="flex gap-4 flex-wrap mb-4">
        <Search
          placeholder="Search customers..."
          allowClear
          style={{ width: 300 }}
          prefix={<SearchOutlined />}
        />
        <Select placeholder="Sort by" style={{ width: 150 }} allowClear>
          <Option value="orders">Total Orders</Option>
          <Option value="spent">Total Spent</Option>
        </Select>
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
      key: 'active',
      label: <span className="flex items-center gap-2"><CheckCircleOutlined />Active ({activeCustomers.length})</span>,
      children: renderTable(activeCustomers),
    },
    {
      key: 'inactive',
      label: <span className="flex items-center gap-2"><StopOutlined />Inactive ({inactiveCustomers.length})</span>,
      children: renderTable(inactiveCustomers),
    },
  ];

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Customer Management
            </h1>
            <p className="text-gray-600 mt-1">Manage your customer database and relationships</p>
          </div>
          <Button type="primary" icon={<PlusOutlined />} size="large" onClick={addModal.open}>
            Add Customer
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <div className="text-center">
              <p className="text-gray-500 text-sm">Total Customers</p>
              <p className="text-3xl font-bold text-blue-600">{allCustomers.length}</p>
            </div>
          </Card>
          <Card>
            <div className="text-center">
              <p className="text-gray-500 text-sm">Active Customers</p>
              <p className="text-3xl font-bold text-green-600">{activeCustomers.length}</p>
            </div>
          </Card>
          <Card>
            <div className="text-center">
              <p className="text-gray-500 text-sm">Inactive Customers</p>
              <p className="text-3xl font-bold text-orange-600">{inactiveCustomers.length}</p>
            </div>
          </Card>
          <Card>
            <div className="text-center">
              <p className="text-gray-500 text-sm">Total Revenue</p>
              <p className="text-3xl font-bold text-purple-600">$277K</p>
            </div>
          </Card>
        </div>

        {/* Tabs with Tables */}
        <Card className="shadow-sm">
          <Tabs
            activeKey={activeTab}
            onChange={setActiveTab}
            items={tabItems}
            size="large"
          />
        </Card>

        {/* Details Drawer */}
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
                <p className="text-gray-600">{selectedCustomer.email}</p>
              </div>
              <div className="border-t pt-4">
                <p><strong>Phone:</strong> {selectedCustomer.phone}</p>
                <p><strong>Address:</strong> {selectedCustomer.address}</p>
                <p><strong>Status:</strong> <Tag color={selectedCustomer.status === 'active' ? 'green' : 'red'}>{selectedCustomer.status}</Tag></p>
                <p><strong>Total Orders:</strong> {selectedCustomer.totalOrders}</p>
                <p><strong>Total Spent:</strong> ${selectedCustomer.totalSpent.toLocaleString()}</p>
              </div>
            </div>
          )}
        </Drawer>

        <Modal
          title="Add Customer"
          open={addModal.isOpen}
          onCancel={addModal.close}
          onOk={() => form.submit()}
          width={600}
        >
          <Form form={form} layout="vertical" onFinish={handleSubmit}>
            <Form.Item label="Customer Name" name="name" rules={[{ required: true }]}>
              <Input placeholder="Enter customer name" />
            </Form.Item>
            <Form.Item label="Email" name="email" rules={[{ required: true, type: 'email' }]}>
              <Input placeholder="Enter email" />
            </Form.Item>
            <Form.Item label="Phone" name="phone" rules={[{ required: true }]}>
              <Input placeholder="Enter phone number" />
            </Form.Item>
            <Form.Item label="Address" name="address">
              <Input.TextArea placeholder="Enter address" rows={3} />
            </Form.Item>
            <Form.Item label="Status" name="status" rules={[{ required: true }]}>
              <Select placeholder="Select status">
                <Option value="active">Active</Option>
                <Option value="inactive">Inactive</Option>
              </Select>
            </Form.Item>
          </Form>
        </Modal>

        <Modal
          title="Edit Customer"
          open={editModal.isOpen}
          onCancel={editModal.close}
          onOk={() => form.submit()}
          width={600}
        >
          <Form form={form} layout="vertical" onFinish={handleSubmit}>
            <Form.Item label="Customer Name" name="name" rules={[{ required: true }]}>
              <Input placeholder="Enter customer name" />
            </Form.Item>
            <Form.Item label="Email" name="email" rules={[{ required: true, type: 'email' }]}>
              <Input placeholder="Enter email" />
            </Form.Item>
            <Form.Item label="Phone" name="phone" rules={[{ required: true }]}>
              <Input placeholder="Enter phone number" />
            </Form.Item>
            <Form.Item label="Address" name="address">
              <Input.TextArea placeholder="Enter address" rows={3} />
            </Form.Item>
            <Form.Item label="Status" name="status" rules={[{ required: true }]}>
              <Select placeholder="Select status">
                <Option value="active">Active</Option>
                <Option value="inactive">Inactive</Option>
              </Select>
            </Form.Item>
          </Form>
        </Modal>
      </div>
    </MainLayout>
  );
}
