'use client';

import React, { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Table, Button, Input, Select, Tag, Card, Modal, Form, message, Tabs } from 'antd';
import { PlusOutlined, SearchOutlined, FilterOutlined, SaveOutlined, EyeOutlined, SettingOutlined, AppstoreOutlined, DatabaseOutlined, BellOutlined } from '@ant-design/icons';
import { useModal } from '@/hooks/useModal';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

const { Search } = Input;
const { Option } = Select;

export default function SystemSettingsAndConfigurationPage() {
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const addModal = useModal();
  const [form] = Form.useForm();
  const router = useRouter();

  const mockData = [
    { id: '1', category: 'General', setting: 'Company Name', value: 'Kiaan WMS', type: 'Text', lastModified: '2024-11-15' },
    { id: '2', category: 'General', setting: 'Time Zone', value: 'UTC-5 (EST)', type: 'Dropdown', lastModified: '2024-11-10' },
    { id: '3', category: 'Operations', setting: 'Auto Allocate Orders', value: 'Enabled', type: 'Boolean', lastModified: '2024-11-14' },
    { id: '4', category: 'Operations', setting: 'Order Cutoff Time', value: '5:00 PM', type: 'Time', lastModified: '2024-11-12' },
    { id: '5', category: 'Inventory', setting: 'Low Stock Threshold', value: '10 units', type: 'Number', lastModified: '2024-11-16' },
    { id: '6', category: 'Inventory', setting: 'Reorder Point Calculation', value: 'Automatic', type: 'Dropdown', lastModified: '2024-11-13' },
    { id: '7', category: 'Notifications', setting: 'Email Alerts', value: 'Enabled', type: 'Boolean', lastModified: '2024-11-17' },
    { id: '8', category: 'Notifications', setting: 'Low Stock Alert', value: 'Enabled', type: 'Boolean', lastModified: '2024-11-11' },
  ];

  const columns = [
    { title: 'Category', dataIndex: 'category', key: 'category', width: 130, render: (cat: string) => <Tag color="blue">{cat}</Tag> },
    {
      title: 'Setting',
      dataIndex: 'setting',
      key: 'setting',
      width: 250,
      render: (text: string, record: any) => (
        <Link href={`/settings/${record.id}`}>
          <span className="font-medium text-blue-600 cursor-pointer hover:underline">{text}</span>
        </Link>
      )
    },
    { title: 'Value', dataIndex: 'value', key: 'value', width: 200 },
    { title: 'Type', dataIndex: 'type', key: 'type', width: 100 },
    { title: 'Last Modified', dataIndex: 'lastModified', key: 'lastModified', width: 150 },
    {
      title: 'Actions',
      key: 'actions',
      width: 120,
      render: (_: any, record: any) => (
        <Link href={`/settings/${record.id}`}>
          <Button type="link" icon={<EyeOutlined />} size="small">View</Button>
        </Link>
      ),
    },
  ];

  const handleSubmit = (values: any) => {
    console.log('Form values:', values);
    message.success('Setting added successfully!');
    form.resetFields();
    addModal.close();
  };

  const allSettings = mockData;
  const generalSettings = mockData.filter(s => s.category === 'General');
  const operationsSettings = mockData.filter(s => s.category === 'Operations');
  const inventorySettings = mockData.filter(s => s.category === 'Inventory');
  const notificationSettings = mockData.filter(s => s.category === 'Notifications');

  const renderFiltersAndTable = (dataSource: any[]) => (
    <>
      <div className="flex gap-4 mb-4">
        <Search placeholder="Search settings..." style={{ width: 300 }} prefix={<SearchOutlined />} />
        <Select placeholder="Type" style={{ width: 150 }} allowClear>
          <Option value="Text">Text</Option>
          <Option value="Boolean">Boolean</Option>
          <Option value="Number">Number</Option>
          <Option value="Dropdown">Dropdown</Option>
        </Select>
        <Button icon={<FilterOutlined />}>More Filters</Button>
      </div>
      <Table
        columns={columns}
        dataSource={dataSource}
        rowKey="id"
        loading={loading}
        scroll={{ x: 1000 }}
        onRow={(record) => ({
          onClick: () => router.push(`/settings/${record.id}`),
          style: { cursor: 'pointer' }
        })}
      />
    </>
  );

  const tabItems = [
    {
      key: 'all',
      label: <span className="flex items-center gap-2"><SettingOutlined />All Settings ({allSettings.length})</span>,
      children: renderFiltersAndTable(allSettings),
    },
    {
      key: 'general',
      label: <span className="flex items-center gap-2"><AppstoreOutlined />General ({generalSettings.length})</span>,
      children: renderFiltersAndTable(generalSettings),
    },
    {
      key: 'operations',
      label: <span className="flex items-center gap-2"><DatabaseOutlined />Operations ({operationsSettings.length})</span>,
      children: renderFiltersAndTable(operationsSettings),
    },
    {
      key: 'inventory',
      label: <span className="flex items-center gap-2"><DatabaseOutlined />Inventory ({inventorySettings.length})</span>,
      children: renderFiltersAndTable(inventorySettings),
    },
    {
      key: 'notifications',
      label: <span className="flex items-center gap-2"><BellOutlined />Notifications ({notificationSettings.length})</span>,
      children: renderFiltersAndTable(notificationSettings),
    },
  ];

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-600 to-gray-800 bg-clip-text text-transparent">
              System Settings & Configuration
            </h1>
            <p className="text-gray-600 mt-1">Configure system preferences and operational parameters</p>
          </div>
          <Button type="primary" icon={<PlusOutlined />} size="large" onClick={addModal.open}>
            Add New
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <div className="text-center">
              <p className="text-gray-500 text-sm">Active Warehouses</p>
              <p className="text-3xl font-bold text-blue-600">8</p>
            </div>
          </Card> <Card>
            <div className="text-center">
              <p className="text-gray-500 text-sm">Integration Points</p>
              <p className="text-3xl font-bold text-green-600">12</p>
            </div>
          </Card> <Card>
            <div className="text-center">
              <p className="text-gray-500 text-sm">Custom Rules</p>
              <p className="text-3xl font-bold text-purple-600">24</p>
            </div>
          </Card> <Card>
            <div className="text-center">
              <p className="text-gray-500 text-sm">Scheduled Jobs</p>
              <p className="text-3xl font-bold text-orange-600">15</p>
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
          title="Add Setting"
          open={addModal.isOpen}
          onCancel={addModal.close}
          onOk={() => form.submit()}
          width={600}
        >
          <Form form={form} layout="vertical" onFinish={handleSubmit}>
            <Form.Item label="Category" name="category" rules={[{ required: true }]}>
              <Select placeholder="Select category">
                <Option value="General">General</Option>
                <Option value="Operations">Operations</Option>
                <Option value="Inventory">Inventory</Option>
                <Option value="Finance">Finance</Option>
              </Select>
            </Form.Item>
            <Form.Item label="Setting Name" name="setting" rules={[{ required: true }]}>
              <Input placeholder="Enter setting name" />
            </Form.Item>
            <Form.Item label="Value" name="value" rules={[{ required: true }]}>
              <Input placeholder="Enter value" />
            </Form.Item>
            <Form.Item label="Type" name="type" rules={[{ required: true }]}>
              <Select placeholder="Select type">
                <Option value="Text">Text</Option>
                <Option value="Number">Number</Option>
                <Option value="Boolean">Boolean</Option>
              </Select>
            </Form.Item>
          </Form>
        </Modal>
      </div>
    </MainLayout>
  );
}
