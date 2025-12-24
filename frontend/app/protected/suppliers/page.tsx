'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Table, Button, Input, Select, Tag, Space, Card, Form, Drawer, Modal, Tabs, App } from 'antd';
import {
  PlusOutlined,
  SearchOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  ContactsOutlined,
  MailOutlined,
  PhoneOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import apiService from '@/services/api';
import { usePermissions } from '@/hooks/usePermissions';

const { Search } = Input;
const { Option } = Select;

interface Supplier {
  id: string;
  code: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  createdAt: string;
  updatedAt: string;
}

export default function SuppliersPage() {
  const { modal, message } = App.useApp();
  const router = useRouter();
  const { canDelete } = usePermissions();
  const [loading, setLoading] = useState(true);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [searchText, setSearchText] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form] = Form.useForm();

  // Fetch suppliers from API
  const fetchSuppliers = useCallback(async () => {
    try {
      setLoading(true);
      const data = await apiService.get('/suppliers');
      setSuppliers(Array.isArray(data) ? data : []);
    } catch (err: any) {
      console.error('Failed to fetch suppliers:', err);
      message.error(err.message || 'Failed to load suppliers');
    } finally {
      setLoading(false);
    }
  }, [message]);

  useEffect(() => {
    fetchSuppliers();
  }, [fetchSuppliers]);

  // Filter suppliers by search text
  const filteredSuppliers = suppliers.filter((s: Supplier) => {
    const matchesSearch = !searchText ||
      s.name?.toLowerCase().includes(searchText.toLowerCase()) ||
      s.email?.toLowerCase().includes(searchText.toLowerCase()) ||
      s.code?.toLowerCase().includes(searchText.toLowerCase());
    return matchesSearch;
  });

  const handleSubmit = async (values: any) => {
    try {
      setSaving(true);

      if (editMode && selectedSupplier) {
        // UPDATE existing supplier
        await apiService.put(`/suppliers/${selectedSupplier.id}`, values);
        message.success('Supplier updated successfully!');
      } else {
        // CREATE new supplier
        await apiService.post('/suppliers', values);
        message.success('Supplier created successfully!');
      }

      form.resetFields();
      setModalOpen(false);
      setEditMode(false);
      setSelectedSupplier(null);
      fetchSuppliers();
    } catch (error: any) {
      console.error('Error saving supplier:', error);
      message.error(error.response?.data?.message || error.message || 'Failed to save supplier');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (record: Supplier) => {
    setSelectedSupplier(record);
    form.setFieldsValue({
      code: record.code,
      name: record.name,
      email: record.email,
      phone: record.phone,
      address: record.address,
    });
    setEditMode(true);
    setModalOpen(true);
  };

  const handleDelete = (record: Supplier) => {
    modal.confirm({
      title: 'Delete Supplier',
      content: `Are you sure you want to delete supplier "${record.name}"? This action cannot be undone.`,
      okText: 'Delete',
      okType: 'danger',
      onOk: async () => {
        try {
          await apiService.delete(`/suppliers/${record.id}`);
          message.success('Supplier deleted successfully!');
          fetchSuppliers();
        } catch (error: any) {
          message.error(error.response?.data?.message || error.message || 'Failed to delete supplier');
        }
      },
    });
  };

  const handleAddSupplier = () => {
    setSelectedSupplier(null);
    setEditMode(false);
    form.resetFields();
    setModalOpen(true);
  };

  const columns = [
    {
      title: 'Supplier Code',
      dataIndex: 'code',
      key: 'code',
      width: 130,
      render: (text: string) => (
        <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">{text}</span>
      ),
    },
    {
      title: 'Supplier Name',
      dataIndex: 'name',
      key: 'name',
      width: 200,
      render: (text: string, record: Supplier) => (
        <div
          className="flex items-center gap-2 cursor-pointer hover:text-blue-600"
          onClick={() => router.push(`/protected/suppliers/${record.id}`)}
        >
          <ContactsOutlined className="text-blue-500" />
          <span className="font-medium">{text}</span>
        </div>
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
      title: 'Actions',
      key: 'actions',
      width: 200,
      render: (_: any, record: Supplier) => (
        <Space>
          <Button
            type="link"
            icon={<EyeOutlined />}
            onClick={() => router.push(`/protected/suppliers/${record.id}`)}
          >
            View
          </Button>
          <Button type="link" icon={<EditOutlined />} onClick={() => handleEdit(record)}>
            Edit
          </Button>
          {canDelete() && (
            <Button type="link" danger icon={<DeleteOutlined />} onClick={() => handleDelete(record)}>
              Delete
            </Button>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Supplier Management
          </h1>
          <p className="text-gray-600 mt-1">Manage your supplier database and relationships</p>
        </div>
        <Button type="primary" icon={<PlusOutlined />} size="large" onClick={handleAddSupplier}>
          Add Supplier
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <div className="text-center">
            <p className="text-gray-500 text-sm">Total Suppliers</p>
            <p className="text-3xl font-bold text-blue-600">{filteredSuppliers.length}</p>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <p className="text-gray-500 text-sm">Active Suppliers</p>
            <p className="text-3xl font-bold text-green-600">{filteredSuppliers.length}</p>
          </div>
        </Card>
      </div>

      <Card className="shadow-sm">
        <div className="flex gap-4 flex-wrap mb-4">
          <Search
            placeholder="Search by name, email, or code..."
            allowClear
            style={{ width: 350 }}
            prefix={<SearchOutlined />}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
          />
          <Button icon={<ReloadOutlined />} onClick={fetchSuppliers}>Refresh</Button>
        </div>
        <Table
          columns={columns}
          dataSource={filteredSuppliers}
          rowKey="id"
          loading={loading}
          pagination={{
            total: filteredSuppliers.length,
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total) => `Total ${total} suppliers`,
          }}
        />
      </Card>

      <Drawer
        title="Supplier Details"
        placement="right"
        width={600}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
      >
        {selectedSupplier && (
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold text-lg">{selectedSupplier.name}</h3>
              <p className="text-gray-600">{selectedSupplier.email || 'No email provided'}</p>
            </div>
            <div className="border-t pt-4">
              <p><strong>Supplier Code:</strong> <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">{selectedSupplier.code}</span></p>
              <p><strong>Phone:</strong> {selectedSupplier.phone || 'Not provided'}</p>
              <p><strong>Address:</strong> {selectedSupplier.address || 'Not provided'}</p>
              <p className="text-xs text-gray-500 mt-4">Created: {new Date(selectedSupplier.createdAt).toLocaleDateString()}</p>
            </div>
          </div>
        )}
      </Drawer>

      <Modal
        title={editMode ? 'Edit Supplier' : 'Add Supplier'}
        open={modalOpen}
        onCancel={() => {
          setModalOpen(false);
          setEditMode(false);
          setSelectedSupplier(null);
          form.resetFields();
        }}
        onOk={() => form.submit()}
        width={600}
        confirmLoading={saving}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item label="Supplier Code" name="code" rules={[{ required: true, message: 'Please enter supplier code' }]}>
            <Input placeholder="Enter supplier code (e.g., SUP-001)" disabled={editMode} />
          </Form.Item>
          <Form.Item label="Supplier Name" name="name" rules={[{ required: true, message: 'Please enter supplier name' }]}>
            <Input placeholder="Enter supplier name" />
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
