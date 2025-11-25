'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Table, Button, Input, Select, Tag, Card, Modal, Form, Tabs, Spin, Alert, App, Switch } from 'antd';
import { PlusOutlined, SearchOutlined, SaveOutlined, EyeOutlined, SettingOutlined, AppstoreOutlined, DatabaseOutlined, BellOutlined, DeleteOutlined, EditOutlined, ReloadOutlined } from '@ant-design/icons';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import apiService from '@/services/api';
import { formatDate } from '@/lib/utils';

const { Search } = Input;
const { Option } = Select;

interface Setting {
  id: string;
  key: string;
  category: string;
  setting?: string;
  name?: string;
  value: string;
  type: string;
  description?: string;
  lastModified?: string;
  updatedAt?: string;
  createdAt?: string;
}

export default function SystemSettingsPage() {
  const { modal, message } = App.useApp();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState<Setting[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('all');
  const [searchText, setSearchText] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedSetting, setSelectedSetting] = useState<Setting | null>(null);
  const [saving, setSaving] = useState(false);
  const [form] = Form.useForm();

  // Fetch settings from API
  const fetchSettings = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await apiService.get('/settings');
      setSettings(Array.isArray(data) ? data : []);
    } catch (err: any) {
      console.error('Failed to fetch settings:', err);
      setError(err.message || 'Failed to load settings');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  // Filter settings based on search and tab
  const getFilteredSettings = () => {
    let filtered = settings;

    // Filter by tab/category
    if (activeTab === 'general') {
      filtered = filtered.filter(s => s.category?.toLowerCase() === 'general');
    } else if (activeTab === 'operations') {
      filtered = filtered.filter(s => s.category?.toLowerCase() === 'operations');
    } else if (activeTab === 'inventory') {
      filtered = filtered.filter(s => s.category?.toLowerCase() === 'inventory');
    } else if (activeTab === 'notifications') {
      filtered = filtered.filter(s => s.category?.toLowerCase() === 'notifications');
    }

    // Filter by search
    if (searchText) {
      const search = searchText.toLowerCase();
      filtered = filtered.filter(s =>
        s.key?.toLowerCase().includes(search) ||
        s.setting?.toLowerCase().includes(search) ||
        s.name?.toLowerCase().includes(search) ||
        s.category?.toLowerCase().includes(search) ||
        s.value?.toLowerCase().includes(search)
      );
    }

    return filtered;
  };

  const handleSubmit = async (values: any) => {
    try {
      setSaving(true);

      if (editMode && selectedSetting) {
        // Update setting
        await apiService.put(`/settings/${selectedSetting.id}`, {
          key: values.key,
          category: values.category,
          value: values.value,
          type: values.type,
          description: values.description
        });
        message.success('Setting updated successfully!');
      } else {
        // Create setting
        await apiService.post('/settings', {
          key: values.key,
          category: values.category,
          value: values.value,
          type: values.type,
          description: values.description
        });
        message.success('Setting created successfully!');
      }

      form.resetFields();
      setModalOpen(false);
      setEditMode(false);
      setSelectedSetting(null);
      fetchSettings();
    } catch (err: any) {
      console.error('Failed to save setting:', err);
      message.error(err.message || 'Failed to save setting');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (record: Setting) => {
    setSelectedSetting(record);
    form.setFieldsValue({
      key: record.key || record.setting || record.name,
      category: record.category,
      value: record.value,
      type: record.type,
      description: record.description
    });
    setEditMode(true);
    setModalOpen(true);
  };

  const handleDelete = (record: Setting) => {
    modal.confirm({
      title: 'Delete Setting',
      content: `Are you sure you want to delete "${record.key || record.setting || record.name}"? This action cannot be undone.`,
      okText: 'Delete',
      okType: 'danger',
      onOk: async () => {
        try {
          await apiService.delete(`/settings/${record.id}`);
          message.success('Setting deleted successfully!');
          fetchSettings();
        } catch (err: any) {
          message.error(err.message || 'Failed to delete setting');
        }
      }
    });
  };

  const columns = [
    {
      title: 'Category',
      dataIndex: 'category',
      key: 'category',
      width: 130,
      render: (cat: string) => <Tag color="blue">{cat || '-'}</Tag>
    },
    {
      title: 'Setting',
      key: 'setting',
      width: 250,
      render: (_: any, record: Setting) => (
        <Link href={`/protected/settings/${record.id}`}>
          <span className="font-medium text-blue-600 cursor-pointer hover:underline">
            {record.key || record.setting || record.name}
          </span>
        </Link>
      )
    },
    {
      title: 'Value',
      dataIndex: 'value',
      key: 'value',
      width: 200,
      render: (value: string, record: Setting) => {
        if (record.type?.toLowerCase() === 'boolean') {
          return <Tag color={value === 'true' || value === 'Enabled' ? 'green' : 'red'}>{value}</Tag>;
        }
        return value || '-';
      }
    },
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      width: 100,
      render: (type: string) => type || 'Text'
    },
    {
      title: 'Last Modified',
      key: 'lastModified',
      width: 150,
      render: (_: any, record: Setting) => formatDate(record.lastModified || record.updatedAt || '') || '-'
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 180,
      render: (_: any, record: Setting) => (
        <div className="flex gap-1">
          <Link href={`/protected/settings/${record.id}`}>
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

  const allSettings = getFilteredSettings();
  const generalSettings = settings.filter(s => s.category?.toLowerCase() === 'general');
  const operationsSettings = settings.filter(s => s.category?.toLowerCase() === 'operations');
  const inventorySettings = settings.filter(s => s.category?.toLowerCase() === 'inventory');
  const notificationSettings = settings.filter(s => s.category?.toLowerCase() === 'notifications');

  const renderFiltersAndTable = () => (
    <>
      <div className="flex gap-4 mb-4">
        <Search
          placeholder="Search settings..."
          style={{ width: 300 }}
          prefix={<SearchOutlined />}
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          allowClear
        />
        <Select placeholder="Type" style={{ width: 150 }} allowClear>
          <Option value="Text">Text</Option>
          <Option value="Boolean">Boolean</Option>
          <Option value="Number">Number</Option>
          <Option value="Dropdown">Dropdown</Option>
        </Select>
        <Button icon={<ReloadOutlined />} onClick={fetchSettings}>Refresh</Button>
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
        dataSource={getFilteredSettings()}
        rowKey="id"
        loading={loading}
        scroll={{ x: 1000 }}
        onRow={(record) => ({
          onClick: () => router.push(`/protected/settings/${record.id}`),
          style: { cursor: 'pointer' }
        })}
        pagination={{
          showSizeChanger: true,
          showTotal: (total) => `Total ${total} settings`,
        }}
      />
    </>
  );

  const tabItems = [
    {
      key: 'all',
      label: <span className="flex items-center gap-2"><SettingOutlined />All Settings ({settings.length})</span>,
      children: renderFiltersAndTable(),
    },
    {
      key: 'general',
      label: <span className="flex items-center gap-2"><AppstoreOutlined />General ({generalSettings.length})</span>,
      children: renderFiltersAndTable(),
    },
    {
      key: 'operations',
      label: <span className="flex items-center gap-2"><DatabaseOutlined />Operations ({operationsSettings.length})</span>,
      children: renderFiltersAndTable(),
    },
    {
      key: 'inventory',
      label: <span className="flex items-center gap-2"><DatabaseOutlined />Inventory ({inventorySettings.length})</span>,
      children: renderFiltersAndTable(),
    },
    {
      key: 'notifications',
      label: <span className="flex items-center gap-2"><BellOutlined />Notifications ({notificationSettings.length})</span>,
      children: renderFiltersAndTable(),
    },
  ];

  if (loading && settings.length === 0) {
    return (
      <div className="flex justify-center items-center h-96">
        <Spin size="large" tip="Loading settings..." />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-600 to-gray-800 bg-clip-text text-transparent">
            System Settings
          </h1>
          <p className="text-gray-600 mt-1">Configure system preferences and operational parameters</p>
        </div>
        <Button type="primary" icon={<PlusOutlined />} size="large" onClick={() => {
          setEditMode(false);
          setSelectedSetting(null);
          form.resetFields();
          setModalOpen(true);
        }}>
          Add Setting
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <div className="text-center">
            <p className="text-gray-500 text-sm">Total Settings</p>
            <p className="text-3xl font-bold text-blue-600">{settings.length}</p>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <p className="text-gray-500 text-sm">General</p>
            <p className="text-3xl font-bold text-green-600">{generalSettings.length}</p>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <p className="text-gray-500 text-sm">Operations</p>
            <p className="text-3xl font-bold text-purple-600">{operationsSettings.length}</p>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <p className="text-gray-500 text-sm">Notifications</p>
            <p className="text-3xl font-bold text-orange-600">{notificationSettings.length}</p>
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
        title={editMode ? 'Edit Setting' : 'Add Setting'}
        open={modalOpen}
        onCancel={() => {
          setModalOpen(false);
          setEditMode(false);
          setSelectedSetting(null);
          form.resetFields();
        }}
        onOk={() => form.submit()}
        confirmLoading={saving}
        width={600}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item label="Category" name="category" rules={[{ required: true, message: 'Please select category' }]}>
            <Select placeholder="Select category">
              <Option value="General">General</Option>
              <Option value="Operations">Operations</Option>
              <Option value="Inventory">Inventory</Option>
              <Option value="Notifications">Notifications</Option>
            </Select>
          </Form.Item>
          <Form.Item label="Setting Key" name="key" rules={[{ required: true, message: 'Please enter setting key' }]}>
            <Input placeholder="Enter setting key (e.g., company_name)" />
          </Form.Item>
          <Form.Item label="Value" name="value" rules={[{ required: true, message: 'Please enter value' }]}>
            <Input placeholder="Enter value" />
          </Form.Item>
          <Form.Item label="Type" name="type" rules={[{ required: true, message: 'Please select type' }]}>
            <Select placeholder="Select type">
              <Option value="Text">Text</Option>
              <Option value="Number">Number</Option>
              <Option value="Boolean">Boolean</Option>
              <Option value="Dropdown">Dropdown</Option>
              <Option value="Time">Time</Option>
            </Select>
          </Form.Item>
          <Form.Item label="Description" name="description">
            <Input.TextArea placeholder="Enter description (optional)" rows={3} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
