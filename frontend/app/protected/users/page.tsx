'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Table, Button, Input, Select, Tag, Card, Modal, Form, Tabs, Spin, Alert, App } from 'antd';
import { PlusOutlined, SearchOutlined, FilterOutlined, EyeOutlined, UserOutlined, TeamOutlined, ClockCircleOutlined, DeleteOutlined, EditOutlined, ReloadOutlined } from '@ant-design/icons';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import apiService from '@/services/api';
import { formatDate } from '@/lib/utils';

const { Search } = Input;
const { Option } = Select;

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  warehouse?: { id: string; name: string } | null;
  warehouseId?: string;
  status: string;
  lastLogin?: string;
  createdAt?: string;
  updatedAt?: string;
}

interface Warehouse {
  id: string;
  name: string;
  code: string;
}

export default function UserManagementPage() {
  const { modal, message } = App.useApp();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<User[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('all');
  const [searchText, setSearchText] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [saving, setSaving] = useState(false);
  const [form] = Form.useForm();

  // Fetch users from API
  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await apiService.get('/users');
      setUsers(Array.isArray(data) ? data : []);
    } catch (err: any) {
      console.error('Failed to fetch users:', err);
      setError(err.message || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch warehouses for dropdown
  const fetchWarehouses = useCallback(async () => {
    try {
      const data = await apiService.get('/warehouses');
      setWarehouses(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to fetch warehouses:', err);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
    fetchWarehouses();
  }, [fetchUsers, fetchWarehouses]);

  // Filter users based on search and tab
  const getFilteredUsers = () => {
    let filtered = users;

    // Filter by tab
    if (activeTab === 'active') {
      filtered = filtered.filter(u => u.status?.toLowerCase() === 'active');
    } else if (activeTab === 'inactive') {
      filtered = filtered.filter(u => u.status?.toLowerCase() === 'inactive');
    } else if (activeTab === 'admins') {
      filtered = filtered.filter(u => u.role?.toLowerCase().includes('admin'));
    }

    // Filter by search
    if (searchText) {
      const search = searchText.toLowerCase();
      filtered = filtered.filter(u =>
        u.name?.toLowerCase().includes(search) ||
        u.email?.toLowerCase().includes(search) ||
        u.role?.toLowerCase().includes(search)
      );
    }

    return filtered;
  };

  const handleSubmit = async (values: any) => {
    try {
      setSaving(true);

      if (editMode && selectedUser) {
        // Update user
        await apiService.put(`/users/${selectedUser.id}`, {
          name: values.name,
          email: values.email,
          role: values.role,
          warehouseId: values.warehouseId,
          status: values.status || 'ACTIVE'
        });
        message.success('User updated successfully!');
      } else {
        // Create user
        await apiService.post('/users', {
          name: values.name,
          email: values.email,
          password: values.password,
          role: values.role,
          warehouseId: values.warehouseId,
          status: 'ACTIVE'
        });
        message.success('User created successfully!');
      }

      form.resetFields();
      setModalOpen(false);
      setEditMode(false);
      setSelectedUser(null);
      fetchUsers();
    } catch (err: any) {
      console.error('Failed to save user:', err);
      message.error(err.message || 'Failed to save user');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (record: User) => {
    setSelectedUser(record);
    form.setFieldsValue({
      name: record.name,
      email: record.email,
      role: record.role,
      warehouseId: record.warehouseId || record.warehouse?.id,
      status: record.status
    });
    setEditMode(true);
    setModalOpen(true);
  };

  const handleDelete = (record: User) => {
    modal.confirm({
      title: 'Delete User',
      content: `Are you sure you want to delete "${record.name}"? This action cannot be undone.`,
      okText: 'Delete',
      okType: 'danger',
      onOk: async () => {
        try {
          await apiService.delete(`/users/${record.id}`);
          message.success('User deleted successfully!');
          fetchUsers();
        } catch (err: any) {
          message.error(err.message || 'Failed to delete user');
        }
      }
    });
  };

  const columns = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      width: 180,
      render: (text: string, record: User) => (
        <Link href={`/protected/users/${record.id}`}>
          <span className="font-medium text-blue-600 cursor-pointer hover:underline">{text}</span>
        </Link>
      )
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
      width: 220
    },
    {
      title: 'Role',
      dataIndex: 'role',
      key: 'role',
      width: 150,
      render: (role: string) => (
        <Tag color={role?.toLowerCase().includes('admin') ? 'purple' : 'blue'}>
          {role || '-'}
        </Tag>
      )
    },
    {
      title: 'Warehouse',
      key: 'warehouse',
      width: 180,
      render: (_: any, record: User) => record.warehouse?.name || '-'
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => (
        <Tag color={status?.toLowerCase() === 'active' ? 'green' : 'red'}>
          {status || 'Active'}
        </Tag>
      )
    },
    {
      title: 'Last Login',
      key: 'lastLogin',
      width: 150,
      render: (_: any, record: User) => formatDate(record.lastLogin || record.updatedAt || '') || '-'
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 180,
      render: (_: any, record: User) => (
        <div className="flex gap-1">
          <Link href={`/protected/users/${record.id}`}>
            <Button type="link" icon={<EyeOutlined />} size="small">View</Button>
          </Link>
          <Button type="link" icon={<EditOutlined />} size="small" onClick={() => handleEdit(record)}>
            Edit
          </Button>
          <Button type="link" danger icon={<DeleteOutlined />} size="small" onClick={() => handleDelete(record)}>
            Delete
          </Button>
        </div>
      ),
    },
  ];

  const allUsers = getFilteredUsers();
  const activeUsers = users.filter(u => u.status?.toLowerCase() === 'active');
  const inactiveUsers = users.filter(u => u.status?.toLowerCase() === 'inactive');
  const adminUsers = users.filter(u => u.role?.toLowerCase().includes('admin'));

  const renderFiltersAndTable = () => (
    <>
      <div className="flex gap-4 mb-4">
        <Search
          placeholder="Search users..."
          style={{ width: 300 }}
          prefix={<SearchOutlined />}
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          allowClear
        />
        <Select placeholder="Role" style={{ width: 200 }} allowClear>
          <Option value="SUPER_ADMIN">Super Admin</Option>
          <Option value="ADMIN">Admin</Option>
          <Option value="WAREHOUSE_MANAGER">Warehouse Manager</Option>
          <Option value="PICKER">Picker</Option>
          <Option value="PACKER">Packer</Option>
          <Option value="VIEWER">Viewer</Option>
        </Select>
        <Select
          placeholder="Warehouse"
          style={{ width: 200 }}
          allowClear
        >
          {warehouses.map(w => (
            <Option key={w.id} value={w.id}>{w.name}</Option>
          ))}
        </Select>
        <Button icon={<ReloadOutlined />} onClick={fetchUsers}>Refresh</Button>
      </div>
      {error && (
        <Alert
          message="Error"
          description={error}
          type="error"
          showIcon
          className="mb-4"
          closable
          onClose={() => setError(null)}
        />
      )}
      <Table
        columns={columns}
        dataSource={getFilteredUsers()}
        rowKey="id"
        loading={loading}
        scroll={{ x: 1200 }}
        onRow={(record) => ({
          onClick: () => router.push(`/protected/users/${record.id}`),
          style: { cursor: 'pointer' }
        })}
        pagination={{
          showSizeChanger: true,
          showTotal: (total) => `Total ${total} users`,
        }}
      />
    </>
  );

  const tabItems = [
    {
      key: 'all',
      label: <span className="flex items-center gap-2"><TeamOutlined />All Users ({users.length})</span>,
      children: renderFiltersAndTable(),
    },
    {
      key: 'active',
      label: <span className="flex items-center gap-2"><UserOutlined />Active ({activeUsers.length})</span>,
      children: renderFiltersAndTable(),
    },
    {
      key: 'inactive',
      label: <span className="flex items-center gap-2"><ClockCircleOutlined />Inactive ({inactiveUsers.length})</span>,
      children: renderFiltersAndTable(),
    },
    {
      key: 'admins',
      label: <span className="flex items-center gap-2"><UserOutlined />Admins ({adminUsers.length})</span>,
      children: renderFiltersAndTable(),
    },
  ];

  if (loading && users.length === 0) {
    return (
      <div className="flex justify-center items-center h-96">
        <Spin size="large" tip="Loading users..." />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            User Management
          </h1>
          <p className="text-gray-600 mt-1">Manage user accounts, roles, and permissions</p>
        </div>
        <Button type="primary" icon={<PlusOutlined />} size="large" onClick={() => {
          setEditMode(false);
          setSelectedUser(null);
          form.resetFields();
          setModalOpen(true);
        }}>
          Add User
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <div className="text-center">
            <p className="text-gray-500 text-sm">Total Users</p>
            <p className="text-3xl font-bold text-blue-600">{users.length}</p>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <p className="text-gray-500 text-sm">Active Users</p>
            <p className="text-3xl font-bold text-green-600">{activeUsers.length}</p>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <p className="text-gray-500 text-sm">Inactive Users</p>
            <p className="text-3xl font-bold text-orange-600">{inactiveUsers.length}</p>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <p className="text-gray-500 text-sm">Administrators</p>
            <p className="text-3xl font-bold text-purple-600">{adminUsers.length}</p>
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
        title={editMode ? 'Edit User' : 'Add User'}
        open={modalOpen}
        onCancel={() => {
          setModalOpen(false);
          setEditMode(false);
          setSelectedUser(null);
          form.resetFields();
        }}
        onOk={() => form.submit()}
        confirmLoading={saving}
        width={600}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item label="Name" name="name" rules={[{ required: true, message: 'Please enter name' }]}>
            <Input placeholder="Enter full name" />
          </Form.Item>
          <Form.Item label="Email" name="email" rules={[
            { required: true, message: 'Please enter email' },
            { type: 'email', message: 'Please enter a valid email' }
          ]}>
            <Input placeholder="Enter email address" />
          </Form.Item>
          <Form.Item label="Role" name="role" rules={[{ required: true, message: 'Please select role' }]}>
            <Select placeholder="Select role">
              <Option value="SUPER_ADMIN">Super Admin</Option>
              <Option value="ADMIN">Admin</Option>
              <Option value="WAREHOUSE_MANAGER">Warehouse Manager</Option>
              <Option value="PICKER">Picker</Option>
              <Option value="PACKER">Packer</Option>
              <Option value="VIEWER">Viewer</Option>
            </Select>
          </Form.Item>
          <Form.Item label="Warehouse" name="warehouseId">
            <Select placeholder="Select warehouse (optional)" allowClear>
              {warehouses.map(w => (
                <Option key={w.id} value={w.id}>{w.name}</Option>
              ))}
            </Select>
          </Form.Item>
          {!editMode && (
            <Form.Item label="Password" name="password" rules={[{ required: true, message: 'Please enter password' }]}>
              <Input.Password placeholder="Enter password" />
            </Form.Item>
          )}
          {editMode && (
            <Form.Item label="Status" name="status">
              <Select placeholder="Select status">
                <Option value="ACTIVE">Active</Option>
                <Option value="INACTIVE">Inactive</Option>
              </Select>
            </Form.Item>
          )}
        </Form>
      </Modal>
    </div>
  );
}
