'use client';

import React, { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Table, Button, Input, Select, Tag, Card, Modal, Form, message, Tabs } from 'antd';
import { PlusOutlined, SearchOutlined, FilterOutlined, EyeOutlined, UserOutlined, TeamOutlined, ClockCircleOutlined } from '@ant-design/icons';
import { useModal } from '@/hooks/useModal';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

const { Search } = Input;
const { Option } = Select;

export default function UserManagementAndAccessControlPage() {
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const addModal = useModal();
  const [form] = Form.useForm();
  const router = useRouter();

  const mockData = [
    { id: '1', name: 'John Doe', email: 'john@company.com', role: 'Admin', warehouse: 'NYC Warehouse', status: 'active', lastLogin: '2 hours ago' },
    { id: '2', name: 'Jane Smith', email: 'jane@company.com', role: 'Warehouse Manager', warehouse: 'LA Warehouse', status: 'active', lastLogin: '10 min ago' },
    { id: '3', name: 'Mike Johnson', email: 'mike@company.com', role: 'Picker', warehouse: 'NYC Warehouse', status: 'active', lastLogin: '5 min ago' },
    { id: '4', name: 'Sarah Wilson', email: 'sarah@company.com', role: 'Packer', warehouse: 'SF Warehouse', status: 'active', lastLogin: '1 hour ago' },
    { id: '5', name: 'Tom Brown', email: 'tom@company.com', role: 'Admin', warehouse: 'LA Warehouse', status: 'inactive', lastLogin: '3 days ago' },
  ];

  const columns = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      width: 180,
      render: (text: string, record: any) => (
        <Link href={`/users/${record.id}`}>
          <span className="font-medium text-blue-600 cursor-pointer hover:underline">{text}</span>
        </Link>
      )
    },
    { title: 'Email', dataIndex: 'email', key: 'email', width: 220 },
    { title: 'Role', dataIndex: 'role', key: 'role', width: 180, render: (role: string) => <Tag color="blue">{role}</Tag> },
    { title: 'Warehouse', dataIndex: 'warehouse', key: 'warehouse', width: 180 },
    { title: 'Status', dataIndex: 'status', key: 'status', width: 100, render: (status: string) => <Tag color={status === 'active' ? 'green' : 'red'}>{status}</Tag> },
    { title: 'Last Login', dataIndex: 'lastLogin', key: 'lastLogin', width: 150 },
    {
      title: 'Actions',
      key: 'actions',
      width: 120,
      render: (_: any, record: any) => (
        <Link href={`/users/${record.id}`}>
          <Button type="link" icon={<EyeOutlined />} size="small">View</Button>
        </Link>
      ),
    },
  ];

  const handleSubmit = (values: any) => {
    console.log('Form values:', values);
    message.success('User added successfully!');
    form.resetFields();
    addModal.close();
  };

  const allUsers = mockData;
  const activeUsers = mockData.filter(u => u.status === 'active');
  const inactiveUsers = mockData.filter(u => u.status === 'inactive');
  const adminUsers = mockData.filter(u => u.role === 'Admin');

  const renderFiltersAndTable = (dataSource: any[]) => (
    <>
      <div className="flex gap-4 mb-4">
        <Search placeholder="Search users..." style={{ width: 300 }} prefix={<SearchOutlined />} />
        <Select placeholder="Role" style={{ width: 200 }} allowClear>
          <Option value="Admin">Admin</Option>
          <Option value="Warehouse Manager">Warehouse Manager</Option>
          <Option value="Picker">Picker</Option>
          <Option value="Packer">Packer</Option>
        </Select>
        <Select placeholder="Warehouse" style={{ width: 200 }} allowClear>
          <Option value="NYC Warehouse">NYC Warehouse</Option>
          <Option value="LA Warehouse">LA Warehouse</Option>
          <Option value="SF Warehouse">SF Warehouse</Option>
        </Select>
        <Button icon={<FilterOutlined />}>More Filters</Button>
      </div>
      <Table
        columns={columns}
        dataSource={dataSource}
        rowKey="id"
        loading={loading}
        scroll={{ x: 1200 }}
        onRow={(record) => ({
          onClick: () => router.push(`/users/${record.id}`),
          style: { cursor: 'pointer' }
        })}
      />
    </>
  );

  const tabItems = [
    {
      key: 'all',
      label: <span className="flex items-center gap-2"><TeamOutlined />All Users ({allUsers.length})</span>,
      children: renderFiltersAndTable(allUsers),
    },
    {
      key: 'active',
      label: <span className="flex items-center gap-2"><UserOutlined />Active ({activeUsers.length})</span>,
      children: renderFiltersAndTable(activeUsers),
    },
    {
      key: 'inactive',
      label: <span className="flex items-center gap-2"><ClockCircleOutlined />Inactive ({inactiveUsers.length})</span>,
      children: renderFiltersAndTable(inactiveUsers),
    },
    {
      key: 'admins',
      label: <span className="flex items-center gap-2"><UserOutlined />Admins ({adminUsers.length})</span>,
      children: renderFiltersAndTable(adminUsers),
    },
  ];

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              User Management & Access Control
            </h1>
            <p className="text-gray-600 mt-1">Manage user accounts, roles, and permissions</p>
          </div>
          <Button type="primary" icon={<PlusOutlined />} size="large" onClick={addModal.open}>
            Add New
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <div className="text-center">
              <p className="text-gray-500 text-sm">Total Users</p>
              <p className="text-3xl font-bold text-blue-600">145</p>
            </div>
          </Card> <Card>
            <div className="text-center">
              <p className="text-gray-500 text-sm">Active Now</p>
              <p className="text-3xl font-bold text-green-600">78</p>
            </div>
          </Card> <Card>
            <div className="text-center">
              <p className="text-gray-500 text-sm">Pending Approval</p>
              <p className="text-3xl font-bold text-orange-600">5</p>
            </div>
          </Card> <Card>
            <div className="text-center">
              <p className="text-gray-500 text-sm">Roles Defined</p>
              <p className="text-3xl font-bold text-purple-600">12</p>
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

        <Modal
          title="Add User"
          open={addModal.isOpen}
          onCancel={addModal.close}
          onOk={() => form.submit()}
          width={600}
        >
          <Form form={form} layout="vertical" onFinish={handleSubmit}>
            <Form.Item label="Name" name="name" rules={[{ required: true }]}>
              <Input placeholder="Enter full name" />
            </Form.Item>
            <Form.Item label="Email" name="email" rules={[{ required: true, type: 'email' }]}>
              <Input placeholder="Enter email address" />
            </Form.Item>
            <Form.Item label="Role" name="role" rules={[{ required: true }]}>
              <Select placeholder="Select role">
                <Option value="Admin">Admin</Option>
                <Option value="Warehouse Manager">Warehouse Manager</Option>
                <Option value="Picker">Picker</Option>
                <Option value="Packer">Packer</Option>
              </Select>
            </Form.Item>
            <Form.Item label="Warehouse" name="warehouse" rules={[{ required: true }]}>
              <Select placeholder="Select warehouse">
                <Option value="NYC Warehouse">NYC Warehouse</Option>
                <Option value="LA Warehouse">LA Warehouse</Option>
                <Option value="SF Warehouse">SF Warehouse</Option>
              </Select>
            </Form.Item>
            <Form.Item label="Password" name="password" rules={[{ required: true }]}>
              <Input.Password placeholder="Enter password" />
            </Form.Item>
          </Form>
        </Modal>
      </div>
    </MainLayout>
  );
}
