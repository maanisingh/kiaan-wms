'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Table, Button, Input, Select, Tag, Card, Modal, Form, Tabs, Spin, Alert, App, Tooltip, Checkbox, Divider, Badge } from 'antd';
import { PlusOutlined, SearchOutlined, FilterOutlined, EyeOutlined, UserOutlined, TeamOutlined, ClockCircleOutlined, DeleteOutlined, EditOutlined, ReloadOutlined, LockOutlined, SettingOutlined, SafetyCertificateOutlined } from '@ant-design/icons';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import apiService from '@/services/api';
import { formatDate } from '@/lib/utils';
import { usePermissions } from '@/hooks/usePermissions';

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

interface Role {
  id: string;
  roleKey?: string;
  name: string;
  description: string;
  permissions: string[];
  warehouseAccess: 'all' | 'assigned' | 'none';
  isSystem: boolean;
}

export default function UserManagementPage() {
  const { modal, message } = App.useApp();
  const router = useRouter();
  const { canDelete } = usePermissions();
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<User[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('all');
  const [searchText, setSearchText] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [warehouseModalOpen, setWarehouseModalOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [saving, setSaving] = useState(false);
  const [form] = Form.useForm();

  // Warehouse assignment state
  const [selectedWarehouses, setSelectedWarehouses] = useState<string[]>([]);
  const [userWarehouses, setUserWarehouses] = useState<{ [userId: string]: string[] }>({});

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

  // Fetch roles from API
  const fetchRoles = useCallback(async () => {
    try {
      const data = await apiService.get('/roles');
      setRoles(data.roles || []);
    } catch (err) {
      console.error('Failed to fetch roles:', err);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
    fetchWarehouses();
    fetchRoles();
  }, [fetchUsers, fetchWarehouses, fetchRoles]);

  // Get role info for a user
  const getRoleInfo = (roleKey: string): Role | undefined => {
    return roles.find(r => r.roleKey === roleKey || r.id === roleKey || r.name === roleKey);
  };

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

        // Update warehouse access if selected warehouses changed
        if (values.warehouseIds && values.warehouseIds.length > 0) {
          await apiService.put(`/users/${selectedUser.id}/warehouses`, {
            warehouseIds: values.warehouseIds
          });
        }

        message.success('User updated successfully!');
      } else {
        // Create user
        const newUser = await apiService.post('/users', {
          name: values.name,
          email: values.email,
          password: values.password,
          role: values.role,
          warehouseId: values.warehouseId,
          status: 'ACTIVE'
        });

        // Set warehouse access for new user
        if (values.warehouseIds && values.warehouseIds.length > 0 && newUser?.id) {
          await apiService.put(`/users/${newUser.id}/warehouses`, {
            warehouseIds: values.warehouseIds
          });
        }

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

  const handleEdit = async (record: User) => {
    setSelectedUser(record);

    // Fetch user's warehouse access
    try {
      const warehouseData = await apiService.get(`/users/${record.id}/warehouses`);
      const assignedWarehouses = warehouseData.warehouseIds || warehouseData.warehouses?.map((w: any) => w.id) || [];

      form.setFieldsValue({
        name: record.name,
        email: record.email,
        role: record.role,
        warehouseId: record.warehouseId || record.warehouse?.id,
        warehouseIds: assignedWarehouses,
        status: record.status
      });
    } catch (err) {
      form.setFieldsValue({
        name: record.name,
        email: record.email,
        role: record.role,
        warehouseId: record.warehouseId || record.warehouse?.id,
        warehouseIds: [],
        status: record.status
      });
    }

    setEditMode(true);
    setModalOpen(true);
  };

  const handleManageWarehouses = async (record: User) => {
    setSelectedUser(record);

    try {
      const warehouseData = await apiService.get(`/users/${record.id}/warehouses`);
      const assignedWarehouses = warehouseData.warehouseIds || warehouseData.warehouses?.map((w: any) => w.id) || [];
      setSelectedWarehouses(assignedWarehouses);
    } catch (err) {
      setSelectedWarehouses([]);
    }

    setWarehouseModalOpen(true);
  };

  const handleSaveWarehouses = async () => {
    if (!selectedUser) return;

    try {
      setSaving(true);
      await apiService.put(`/users/${selectedUser.id}/warehouses`, {
        warehouseIds: selectedWarehouses
      });
      message.success('Warehouse access updated!');
      setWarehouseModalOpen(false);
    } catch (err: any) {
      message.error(err.message || 'Failed to update warehouse access');
    } finally {
      setSaving(false);
    }
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

  const getRoleColor = (role: string): string => {
    const roleInfo = getRoleInfo(role);
    if (role === 'SUPER_ADMIN') return 'red';
    if (role === 'COMPANY_ADMIN' || role === 'ADMIN') return 'purple';
    if (role === 'WAREHOUSE_MANAGER') return 'blue';
    if (role === 'INVENTORY_MANAGER') return 'cyan';
    if (role === 'PICKER') return 'green';
    if (role === 'PACKER') return 'orange';
    if (role === 'RECEIVER') return 'gold';
    if (role === 'VIEWER') return 'default';
    return roleInfo?.isSystem ? 'geekblue' : 'volcano';
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
      width: 170,
      render: (role: string) => {
        const roleInfo = getRoleInfo(role);
        return (
          <Tooltip title={roleInfo?.description || role}>
            <Tag color={getRoleColor(role)} className="flex items-center gap-1 w-fit">
              {roleInfo?.isSystem && <LockOutlined className="text-xs" />}
              {roleInfo?.name || role || '-'}
            </Tag>
          </Tooltip>
        );
      }
    },
    {
      title: 'Warehouse Access',
      key: 'warehouse',
      width: 180,
      render: (_: any, record: User) => {
        const roleInfo = getRoleInfo(record.role);
        if (roleInfo?.warehouseAccess === 'all') {
          return <Tag color="green">All Warehouses</Tag>;
        }
        return (
          <div className="flex items-center gap-2">
            <span>{record.warehouse?.name || 'Assigned'}</span>
            <Button
              type="link"
              size="small"
              icon={<SettingOutlined />}
              onClick={(e) => {
                e.stopPropagation();
                handleManageWarehouses(record);
              }}
            >
              Manage
            </Button>
          </div>
        );
      }
    },
    {
      title: 'Permissions',
      key: 'permissions',
      width: 120,
      render: (_: any, record: User) => {
        const roleInfo = getRoleInfo(record.role);
        const permCount = roleInfo?.permissions?.length || 0;
        return (
          <Tooltip title={`${permCount} permissions assigned via ${roleInfo?.name || record.role} role`}>
            <Badge count={permCount} showZero color={permCount > 30 ? 'green' : permCount > 15 ? 'blue' : 'orange'}>
              <Tag icon={<SafetyCertificateOutlined />} color="default">
                Perms
              </Tag>
            </Badge>
          </Tooltip>
        );
      }
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
      width: 200,
      render: (_: any, record: User) => (
        <div className="flex gap-1">
          <Link href={`/protected/users/${record.id}`}>
            <Button type="link" icon={<EyeOutlined />} size="small">View</Button>
          </Link>
          <Button type="link" icon={<EditOutlined />} size="small" onClick={(e) => {
            e.stopPropagation();
            handleEdit(record);
          }}>
            Edit
          </Button>
          {canDelete() && (
            <Button type="link" danger icon={<DeleteOutlined />} size="small" onClick={(e) => {
              e.stopPropagation();
              handleDelete(record);
            }}>
              Delete
            </Button>
          )}
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
      <div className="flex gap-4 mb-4 flex-wrap">
        <Search
          placeholder="Search users..."
          style={{ width: 300 }}
          prefix={<SearchOutlined />}
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          allowClear
        />
        <Select placeholder="Role" style={{ width: 200 }} allowClear onChange={(val) => {
          if (val) {
            setSearchText(val);
          }
        }}>
          {roles.map(role => (
            <Option key={role.id} value={role.roleKey || role.name}>
              <div className="flex items-center gap-2">
                {role.isSystem && <LockOutlined className="text-xs text-gray-400" />}
                {role.name}
              </div>
            </Option>
          ))}
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
        <Link href="/protected/roles">
          <Button icon={<SafetyCertificateOutlined />}>Manage Roles</Button>
        </Link>
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
        scroll={{ x: 1400 }}
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
        <div className="flex gap-2">
          <Link href="/protected/roles">
            <Button icon={<SafetyCertificateOutlined />} size="large">
              Roles & Permissions
            </Button>
          </Link>
          <Button type="primary" icon={<PlusOutlined />} size="large" onClick={() => {
            setEditMode(false);
            setSelectedUser(null);
            form.resetFields();
            setModalOpen(true);
          }}>
            Add User
          </Button>
        </div>
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
            <p className="text-gray-500 text-sm">Available Roles</p>
            <p className="text-3xl font-bold text-purple-600">{roles.length}</p>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <p className="text-gray-500 text-sm">Warehouses</p>
            <p className="text-3xl font-bold text-orange-600">{warehouses.length}</p>
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

      {/* Create/Edit User Modal */}
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
        width={700}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <div className="grid grid-cols-2 gap-4">
            <Form.Item label="Name" name="name" rules={[{ required: true, message: 'Please enter name' }]}>
              <Input placeholder="Enter full name" />
            </Form.Item>
            <Form.Item label="Email" name="email" rules={[
              { required: true, message: 'Please enter email' },
              { type: 'email', message: 'Please enter a valid email' }
            ]}>
              <Input placeholder="Enter email address" />
            </Form.Item>
          </div>

          <Form.Item label="Role" name="role" rules={[{ required: true, message: 'Please select role' }]}>
            <Select placeholder="Select role">
              {roles.map(role => (
                <Option key={role.id} value={role.roleKey || role.name}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {role.isSystem ? <LockOutlined className="text-xs text-gray-400" /> : <SafetyCertificateOutlined className="text-xs text-blue-400" />}
                      <span>{role.name}</span>
                    </div>
                    <span className="text-xs text-gray-400">{role.permissions.length} perms</span>
                  </div>
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Divider className="my-3">Warehouse Access</Divider>

          <Form.Item
            label="Assigned Warehouses"
            name="warehouseIds"
            tooltip="Select warehouses this user can access. Leave empty for role default."
          >
            <Select
              mode="multiple"
              placeholder="Select warehouses"
              allowClear
              style={{ width: '100%' }}
              optionFilterProp="children"
            >
              {warehouses.map(w => (
                <Option key={w.id} value={w.id}>
                  <div className="flex items-center justify-between">
                    <span>{w.name}</span>
                    <span className="text-xs text-gray-400">{w.code}</span>
                  </div>
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            label="Primary Warehouse"
            name="warehouseId"
            tooltip="Default warehouse for this user"
          >
            <Select placeholder="Select primary warehouse (optional)" allowClear>
              {warehouses.map(w => (
                <Option key={w.id} value={w.id}>{w.name}</Option>
              ))}
            </Select>
          </Form.Item>

          {!editMode && (
            <Form.Item label="Password" name="password" rules={[
              { required: true, message: 'Please enter password' },
              { min: 6, message: 'Password must be at least 6 characters' }
            ]}>
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

      {/* Warehouse Assignment Modal */}
      <Modal
        title={`Manage Warehouse Access - ${selectedUser?.name}`}
        open={warehouseModalOpen}
        onCancel={() => {
          setWarehouseModalOpen(false);
          setSelectedUser(null);
          setSelectedWarehouses([]);
        }}
        onOk={handleSaveWarehouses}
        confirmLoading={saving}
        width={500}
      >
        <div className="space-y-4">
          <Alert
            message="Warehouse Access"
            description={`Select which warehouses ${selectedUser?.name} can access. Users with 'All Warehouses' role setting will have access to all warehouses regardless of this selection.`}
            type="info"
            showIcon
            className="mb-4"
          />

          <div className="space-y-2 max-h-80 overflow-y-auto">
            <Checkbox
              checked={selectedWarehouses.length === warehouses.length}
              indeterminate={selectedWarehouses.length > 0 && selectedWarehouses.length < warehouses.length}
              onChange={(e) => {
                if (e.target.checked) {
                  setSelectedWarehouses(warehouses.map(w => w.id));
                } else {
                  setSelectedWarehouses([]);
                }
              }}
              className="font-semibold"
            >
              Select All Warehouses
            </Checkbox>
            <Divider className="my-2" />
            {warehouses.map(warehouse => (
              <div key={warehouse.id} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded">
                <Checkbox
                  checked={selectedWarehouses.includes(warehouse.id)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedWarehouses([...selectedWarehouses, warehouse.id]);
                    } else {
                      setSelectedWarehouses(selectedWarehouses.filter(id => id !== warehouse.id));
                    }
                  }}
                >
                  <span className="font-medium">{warehouse.name}</span>
                </Checkbox>
                <Tag color="default">{warehouse.code}</Tag>
              </div>
            ))}
          </div>

          <div className="mt-4 pt-4 border-t">
            <p className="text-sm text-gray-500">
              Selected: <strong>{selectedWarehouses.length}</strong> of {warehouses.length} warehouses
            </p>
          </div>
        </div>
      </Modal>
    </div>
  );
}
