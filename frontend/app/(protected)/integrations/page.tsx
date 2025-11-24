'use client';

import React, { useState } from 'react';

import { Table, Button, Input, Select, Tag, Card, Modal, Form, message, Tabs, Space } from 'antd';
import { PlusOutlined, SearchOutlined, FilterOutlined, EyeOutlined, ApiOutlined, ShoppingOutlined, TruckOutlined, DatabaseOutlined } from '@ant-design/icons';
import { useModal } from '@/hooks/useModal';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

const { Search } = Input;
const { Option } = Select;

export default function SystemIntegrationsPage() {
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const addModal = useModal();
  const [form] = Form.useForm();
  const router = useRouter();

  const mockData = [
    { id: '1', name: 'Shopify', type: 'E-Commerce', status: 'active', lastSync: '2 min ago', orders: 245, syncFrequency: 'Real-time' },
    { id: '2', name: 'Amazon FBA', type: 'Marketplace', status: 'active', lastSync: '5 min ago', orders: 189, syncFrequency: '15 min' },
    { id: '3', name: 'FedEx', type: 'Shipping', status: 'active', lastSync: '1 min ago', shipments: 567, syncFrequency: 'Real-time' },
    { id: '4', name: 'SAP ERP', type: 'ERP', status: 'active', lastSync: '10 min ago', transactions: 1234, syncFrequency: '30 min' },
    { id: '5', name: 'WooCommerce', type: 'E-Commerce', status: 'inactive', lastSync: '2 days ago', orders: 0, syncFrequency: 'Manual' },
  ];

  const columns = [
    { title: 'Integration', dataIndex: 'name', key: 'name', width: 180, render: (text: string) => <span className="font-medium text-blue-600">{text}</span> },
    { title: 'Type', dataIndex: 'type', key: 'type', width: 130, render: (type: string) => <Tag color="blue">{type}</Tag> },
    { title: 'Status', dataIndex: 'status', key: 'status', width: 100, render: (status: string) => <Tag color={status === 'active' ? 'green' : 'red'}>{status}</Tag> },
    { title: 'Last Sync', dataIndex: 'lastSync', key: 'lastSync', width: 130 },
    { title: 'Frequency', dataIndex: 'syncFrequency', key: 'frequency', width: 120 },
    {
      title: 'Actions',
      key: 'actions',
      width: 120,
      render: (_: any, record: any) => (
        <Link href={`/integrations/${record.id}`}>
          <Button type="link" icon={<EyeOutlined />} size="small">View</Button>
        </Link>
      )
    },
  ];

  const handleSubmit = (values: any) => {
    console.log('Form values:', values);
    message.success('Integration added successfully!');
    form.resetFields();
    addModal.close();
  };

  const allIntegrations = mockData;
  const ecommerceIntegrations = mockData.filter(i => i.type === 'E-Commerce' || i.type === 'Marketplace');
  const shippingIntegrations = mockData.filter(i => i.type === 'Shipping');
  const erpIntegrations = mockData.filter(i => i.type === 'ERP');

  const renderFiltersAndTable = (dataSource: any[]) => (
    <>
      <div className="flex gap-4 mb-4">
        <Search placeholder="Search integrations..." style={{ width: 300 }} prefix={<SearchOutlined />} />
        <Select placeholder="Status" style={{ width: 150 }} allowClear>
          <Option value="active">Active</Option>
          <Option value="inactive">Inactive</Option>
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
          onClick: () => router.push(`/integrations/${record.id}`),
          style: { cursor: 'pointer' }
        })}
      />
    </>
  );

  const tabItems = [
    {
      key: 'all',
      label: <span className="flex items-center gap-2"><ApiOutlined />All Integrations ({allIntegrations.length})</span>,
      children: renderFiltersAndTable(allIntegrations),
    },
    {
      key: 'ecommerce',
      label: <span className="flex items-center gap-2"><ShoppingOutlined />E-Commerce ({ecommerceIntegrations.length})</span>,
      children: renderFiltersAndTable(ecommerceIntegrations),
    },
    {
      key: 'shipping',
      label: <span className="flex items-center gap-2"><TruckOutlined />Shipping ({shippingIntegrations.length})</span>,
      children: renderFiltersAndTable(shippingIntegrations),
    },
    {
      key: 'erp',
      label: <span className="flex items-center gap-2"><DatabaseOutlined />ERP ({erpIntegrations.length})</span>,
      children: renderFiltersAndTable(erpIntegrations),
    },
  ];

  return (
    <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              System Integrations
            </h1>
            <p className="text-gray-600 mt-1">Connect with ERP, e-commerce, and shipping carriers</p>
          </div>
          <Button type="primary" icon={<PlusOutlined />} size="large" onClick={addModal.open}>
            Add Integration
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <div className="text-center">
              <p className="text-gray-500 text-sm">Active Integrations</p>
              <p className="text-3xl font-bold text-green-600">12</p>
            </div>
          </Card>
          <Card>
            <div className="text-center">
              <p className="text-gray-500 text-sm">API Calls Today</p>
              <p className="text-3xl font-bold text-blue-600">45.2K</p>
            </div>
          </Card>
          <Card>
            <div className="text-center">
              <p className="text-gray-500 text-sm">Pending Sync</p>
              <p className="text-3xl font-bold text-orange-600">3</p>
            </div>
          </Card>
          <Card>
            <div className="text-center">
              <p className="text-gray-500 text-sm">Success Rate</p>
              <p className="text-3xl font-bold text-green-600">99.8%</p>
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
          title="Add Integration"
          open={addModal.isOpen}
          onCancel={addModal.close}
          onOk={() => form.submit()}
          width={600}
        >
          <Form form={form} layout="vertical" onFinish={handleSubmit}>
            <Form.Item label="Integration Name" name="name" rules={[{ required: true }]}>
              <Input placeholder="Enter integration name" />
            </Form.Item>
            <Form.Item label="Type" name="type" rules={[{ required: true }]}>
              <Select placeholder="Select type">
                <Option value="E-Commerce">E-Commerce</Option>
                <Option value="Marketplace">Marketplace</Option>
                <Option value="Shipping">Shipping</Option>
                <Option value="ERP">ERP</Option>
              </Select>
            </Form.Item>
            <Form.Item label="API Key" name="apiKey" rules={[{ required: true }]}>
              <Input.Password placeholder="Enter API key" />
            </Form.Item>
          </Form>
        </Modal>
      </div>
      );
}
