'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Table, Button, Input, Select, Tag, Space, Card, Form, Drawer, Modal, App } from 'antd';
import {
  PlusOutlined,
  SearchOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  HomeOutlined,
  EnvironmentOutlined,
  PhoneOutlined,
  InboxOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import apiService from '@/services/api';

const { Search } = Input;
const { Option } = Select;

interface Warehouse {
  id: string;
  code: string;
  name: string;
  type: 'MAIN' | 'PREP' | 'RETURNS' | 'OVERFLOW';
  status: 'ACTIVE' | 'INACTIVE' | 'MAINTENANCE';
  address?: string;
  phone?: string;
  capacity?: number;
  createdAt: string;
  updatedAt: string;
}

export default function WarehousesPage() {
  const { modal, message } = App.useApp();
  const [loading, setLoading] = useState(true);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedWarehouse, setSelectedWarehouse] = useState<Warehouse | null>(null);
  const [searchText, setSearchText] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form] = Form.useForm();

  // Fetch warehouses from REST API
  const fetchWarehouses = useCallback(async () => {
    try {
      setLoading(true);
      const data = await apiService.get('/warehouses');
      setWarehouses(Array.isArray(data) ? data : []);
    } catch (err: any) {
      console.error('Failed to fetch warehouses:', err);
      message.error(err.message || 'Failed to load warehouses');
    } finally {
      setLoading(false);
    }
  }, [message]);

  useEffect(() => {
    fetchWarehouses();
  }, [fetchWarehouses]);

  // Filter warehouses by search text
  const filteredWarehouses = warehouses.filter((w: Warehouse) => {
    const matchesSearch = !searchText ||
      w.name?.toLowerCase().includes(searchText.toLowerCase()) ||
      w.code?.toLowerCase().includes(searchText.toLowerCase()) ||
      w.address?.toLowerCase().includes(searchText.toLowerCase());
    return matchesSearch;
  });

  const handleSubmit = async (values: any) => {
    try {
      setSaving(true);

      if (editMode && selectedWarehouse) {
        // UPDATE existing warehouse
        await apiService.put(`/warehouses/${selectedWarehouse.id}`, values);
        message.success('Warehouse updated successfully!');
      } else {
        // CREATE new warehouse
        await apiService.post('/warehouses', values);
        message.success('Warehouse created successfully!');
      }

      form.resetFields();
      setModalOpen(false);
      setEditMode(false);
      setSelectedWarehouse(null);
      fetchWarehouses();
    } catch (error: any) {
      console.error('Error saving warehouse:', error);
      message.error(error.response?.data?.error || error.message || 'Failed to save warehouse');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (record: Warehouse) => {
    setSelectedWarehouse(record);
    form.setFieldsValue({
      code: record.code,
      name: record.name,
      type: record.type,
      status: record.status,
      address: record.address,
      phone: record.phone,
      capacity: record.capacity,
    });
    setEditMode(true);
    setModalOpen(true);
  };

  const handleDelete = (record: Warehouse) => {
    modal.confirm({
      title: 'Delete Warehouse',
      content: `Are you sure you want to delete warehouse "${record.name}"? This action cannot be undone.`,
      okText: 'Delete',
      okType: 'danger',
      onOk: async () => {
        try {
          await apiService.delete(`/warehouses/${record.id}`);
          message.success('Warehouse deleted successfully!');
          fetchWarehouses();
        } catch (error: any) {
          message.error(error.response?.data?.error || error.message || 'Failed to delete warehouse');
        }
      },
    });
  };

  const handleAddWarehouse = () => {
    setSelectedWarehouse(null);
    setEditMode(false);
    form.resetFields();
    setModalOpen(true);
  };

  const getTypeColor = (type: string) => {
    const colors: any = {
      MAIN: 'blue',
      PREP: 'purple',
      RETURNS: 'orange',
      OVERFLOW: 'cyan',
    };
    return colors[type] || 'default';
  };

  const getStatusColor = (status: string) => {
    const colors: any = {
      ACTIVE: 'green',
      INACTIVE: 'red',
      MAINTENANCE: 'orange',
    };
    return colors[status] || 'default';
  };

  const columns = [
    {
      title: 'Warehouse Code',
      dataIndex: 'code',
      key: 'code',
      width: 130,
      render: (text: string) => (
        <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">{text}</span>
      ),
    },
    {
      title: 'Warehouse Name',
      dataIndex: 'name',
      key: 'name',
      width: 200,
      render: (text: string) => (
        <div className="flex items-center gap-2">
          <HomeOutlined className="text-blue-500" />
          <span className="font-medium">{text}</span>
        </div>
      ),
    },
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      width: 120,
      render: (type: string) => (
        <Tag color={getTypeColor(type)}>{type}</Tag>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status: string) => (
        <Tag color={getStatusColor(status)}>{status}</Tag>
      ),
    },
    {
      title: 'Address',
      dataIndex: 'address',
      key: 'address',
      ellipsis: true,
      render: (address: string) => (
        <div className="flex items-center gap-2">
          <EnvironmentOutlined className="text-gray-400" />
          <span>{address || '-'}</span>
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
      title: 'Capacity',
      dataIndex: 'capacity',
      key: 'capacity',
      width: 100,
      render: (capacity: number) => (
        <div className="flex items-center gap-2">
          <InboxOutlined className="text-gray-400" />
          <span>{capacity ? capacity.toLocaleString() : '-'}</span>
        </div>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 200,
      render: (_: any, record: Warehouse) => (
        <Space>
          <Button
            type="link"
            icon={<EyeOutlined />}
            onClick={() => {
              setSelectedWarehouse(record);
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

  // Stats by type
  const mainWarehouses = filteredWarehouses.filter((w: Warehouse) => w.type === 'MAIN').length;
  const prepWarehouses = filteredWarehouses.filter((w: Warehouse) => w.type === 'PREP').length;
  const activeWarehouses = filteredWarehouses.filter((w: Warehouse) => w.status === 'ACTIVE').length;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
            Warehouse Management
          </h1>
          <p className="text-gray-600 mt-1">Manage your warehouse locations and facilities</p>
        </div>
        <Button type="primary" icon={<PlusOutlined />} size="large" onClick={handleAddWarehouse}>
          Add Warehouse
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <div className="text-center">
            <p className="text-gray-500 text-sm">Total Warehouses</p>
            <p className="text-3xl font-bold text-blue-600">{filteredWarehouses.length}</p>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <p className="text-gray-500 text-sm">Active</p>
            <p className="text-3xl font-bold text-green-600">{activeWarehouses}</p>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <p className="text-gray-500 text-sm">Main Warehouses</p>
            <p className="text-3xl font-bold text-purple-600">{mainWarehouses}</p>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <p className="text-gray-500 text-sm">Prep Centers</p>
            <p className="text-3xl font-bold text-orange-600">{prepWarehouses}</p>
          </div>
        </Card>
      </div>

      <Card className="shadow-sm">
        <div className="flex gap-4 flex-wrap mb-4">
          <Search
            placeholder="Search by name, code, or address..."
            allowClear
            style={{ width: 350 }}
            prefix={<SearchOutlined />}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
          />
          <Button icon={<ReloadOutlined />} onClick={fetchWarehouses}>Refresh</Button>
        </div>
        <Table
          columns={columns}
          dataSource={filteredWarehouses}
          rowKey="id"
          loading={loading}
          scroll={{ x: 1200 }}
          pagination={{
            total: filteredWarehouses.length,
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total) => `Total ${total} warehouses`,
          }}
        />
      </Card>

      <Drawer
        title="Warehouse Details"
        placement="right"
        width={600}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
      >
        {selectedWarehouse && (
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold text-lg">{selectedWarehouse.name}</h3>
              <div className="flex gap-2 mt-2">
                <Tag color={getTypeColor(selectedWarehouse.type)}>{selectedWarehouse.type}</Tag>
                <Tag color={getStatusColor(selectedWarehouse.status)}>{selectedWarehouse.status}</Tag>
              </div>
            </div>
            <div className="border-t pt-4 space-y-2">
              <p><strong>Warehouse Code:</strong> <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">{selectedWarehouse.code}</span></p>
              <p><strong>Phone:</strong> {selectedWarehouse.phone || 'Not provided'}</p>
              <p><strong>Address:</strong> {selectedWarehouse.address || 'Not provided'}</p>
              <p><strong>Capacity:</strong> {selectedWarehouse.capacity ? selectedWarehouse.capacity.toLocaleString() + ' units' : 'Not specified'}</p>
              <p className="text-xs text-gray-500 mt-4">Created: {new Date(selectedWarehouse.createdAt).toLocaleDateString()}</p>
            </div>
          </div>
        )}
      </Drawer>

      <Modal
        title={editMode ? 'Edit Warehouse' : 'Add Warehouse'}
        open={modalOpen}
        onCancel={() => {
          setModalOpen(false);
          setEditMode(false);
          setSelectedWarehouse(null);
          form.resetFields();
        }}
        onOk={() => form.submit()}
        width={600}
        confirmLoading={saving}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item
            label="Warehouse Code"
            name="code"
            rules={[{ required: true, message: 'Please enter warehouse code' }]}
          >
            <Input placeholder="Enter warehouse code (e.g., WH-001)" disabled={editMode} />
          </Form.Item>
          <Form.Item
            label="Warehouse Name"
            name="name"
            rules={[{ required: true, message: 'Please enter warehouse name' }]}
          >
            <Input placeholder="Enter warehouse name" />
          </Form.Item>
          <Form.Item
            label="Warehouse Type"
            name="type"
            rules={[{ required: true, message: 'Please select warehouse type' }]}
          >
            <Select placeholder="Select warehouse type">
              <Option value="MAIN">Main Warehouse</Option>
              <Option value="PREP">Prep Center</Option>
              <Option value="RETURNS">Returns Center</Option>
              <Option value="OVERFLOW">Overflow Storage</Option>
            </Select>
          </Form.Item>
          <Form.Item
            label="Status"
            name="status"
            rules={[{ required: true, message: 'Please select status' }]}
          >
            <Select placeholder="Select status">
              <Option value="ACTIVE">Active</Option>
              <Option value="INACTIVE">Inactive</Option>
              <Option value="MAINTENANCE">Maintenance</Option>
            </Select>
          </Form.Item>
          <Form.Item label="Phone" name="phone">
            <Input placeholder="Enter phone number (optional)" />
          </Form.Item>
          <Form.Item label="Address" name="address">
            <Input.TextArea placeholder="Enter address (optional)" rows={3} />
          </Form.Item>
          <Form.Item label="Capacity (units)" name="capacity">
            <Input type="number" placeholder="Enter capacity (optional)" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
