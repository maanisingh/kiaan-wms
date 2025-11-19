'use client';

import React, { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Table, Button, Input, Select, Card, Modal, Form, message, Tag, Tabs } from 'antd';
import { PlusOutlined, SearchOutlined, EyeOutlined, ShoppingOutlined, ShopOutlined, GlobalOutlined, CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';
import { useModal } from '@/hooks/useModal';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

const { Search } = Input;
const { Option } = Select;

export default function IntegrationChannelsPage() {
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const addModal = useModal();
  const [form] = Form.useForm();
  const router = useRouter();

  const mockData = [
    { id: '1', name: 'Shopify Store', type: 'E-Commerce', status: 'active', orders: 1245, revenue: 45600, lastSync: '5 min ago' },
    { id: '2', name: 'Amazon Seller Central', type: 'Marketplace', status: 'active', orders: 3456, revenue: 123400, lastSync: '2 min ago' },
    { id: '3', name: 'eBay Store', type: 'Marketplace', status: 'active', orders: 567, revenue: 23100, lastSync: '10 min ago' },
    { id: '4', name: 'WooCommerce', type: 'E-Commerce', status: 'inactive', orders: 0, revenue: 0, lastSync: '2 days ago' },
    { id: '5', name: 'BigCommerce', type: 'E-Commerce', status: 'active', orders: 892, revenue: 34500, lastSync: '1 min ago' },
  ];

  const columns = [
    {
      title: 'Channel Name',
      dataIndex: 'name',
      key: 'name',
      width: 200,
      render: (text: string, record: any) => (
        <Link href={`/integrations/channels/${record.id}`}>
          <span className="font-medium text-blue-600 cursor-pointer hover:underline">{text}</span>
        </Link>
      )
    },
    { title: 'Type', dataIndex: 'type', key: 'type', width: 150, render: (type: string) => <Tag color="blue">{type}</Tag> },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status: string) => (
        <Tag color={status === 'active' ? 'green' : 'red'} icon={status === 'active' ? <CheckCircleOutlined /> : <CloseCircleOutlined />}>
          {status}
        </Tag>
      )
    },
    { title: 'Orders', dataIndex: 'orders', key: 'orders', width: 100, render: (val: number) => val.toLocaleString() },
    { title: 'Revenue', dataIndex: 'revenue', key: 'revenue', width: 120, render: (val: number) => `$${val.toLocaleString()}` },
    { title: 'Last Sync', dataIndex: 'lastSync', key: 'lastSync', width: 120 },
    {
      title: 'Actions',
      key: 'actions',
      width: 120,
      render: (_: any, record: any) => (
        <Link href={`/integrations/channels/${record.id}`}>
          <Button type="link" icon={<EyeOutlined />} size="small">View</Button>
        </Link>
      ),
    },
  ];

  const handleSubmit = (values: any) => {
    console.log('Form values:', values);
    message.success('Channel created successfully!');
    form.resetFields();
    addModal.close();
  };

  const allChannels = mockData;
  const activeChannels = mockData.filter(c => c.status === 'active');
  const inactiveChannels = mockData.filter(c => c.status === 'inactive');
  const ecommerceChannels = mockData.filter(c => c.type === 'E-Commerce');
  const marketplaceChannels = mockData.filter(c => c.type === 'Marketplace');

  const renderFiltersAndTable = (dataSource: any[]) => (
    <>
      <div className="flex gap-4 mb-4">
        <Search placeholder="Search channels..." style={{ width: 300 }} prefix={<SearchOutlined />} />
        <Select placeholder="Type" style={{ width: 150 }} allowClear>
          <Option value="E-Commerce">E-Commerce</Option>
          <Option value="Marketplace">Marketplace</Option>
        </Select>
      </div>
      <Table
        columns={columns}
        dataSource={dataSource}
        rowKey="id"
        loading={loading}
        scroll={{ x: 1000 }}
        onRow={(record) => ({
          onClick: () => router.push(`/integrations/channels/${record.id}`),
          style: { cursor: 'pointer' }
        })}
      />
    </>
  );

  const tabItems = [
    {
      key: 'all',
      label: <span className="flex items-center gap-2"><GlobalOutlined />All Channels ({allChannels.length})</span>,
      children: renderFiltersAndTable(allChannels),
    },
    {
      key: 'active',
      label: <span className="flex items-center gap-2"><CheckCircleOutlined />Active ({activeChannels.length})</span>,
      children: renderFiltersAndTable(activeChannels),
    },
    {
      key: 'inactive',
      label: <span className="flex items-center gap-2"><CloseCircleOutlined />Inactive ({inactiveChannels.length})</span>,
      children: renderFiltersAndTable(inactiveChannels),
    },
    {
      key: 'ecommerce',
      label: <span className="flex items-center gap-2"><ShopOutlined />E-Commerce ({ecommerceChannels.length})</span>,
      children: renderFiltersAndTable(ecommerceChannels),
    },
    {
      key: 'marketplace',
      label: <span className="flex items-center gap-2"><ShoppingOutlined />Marketplace ({marketplaceChannels.length})</span>,
      children: renderFiltersAndTable(marketplaceChannels),
    },
  ];

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
              Integration Channels
            </h1>
            <p className="text-gray-600 mt-1">Manage sales and fulfillment channels</p>
          </div>
          <Button type="primary" icon={<PlusOutlined />} size="large" onClick={addModal.open}>
            Add Channel
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <div className="text-center">
              <p className="text-gray-500 text-sm">Active Channels</p>
              <p className="text-3xl font-bold text-green-600">{activeChannels.length}</p>
            </div>
          </Card>
          <Card>
            <div className="text-center">
              <p className="text-gray-500 text-sm">Total Orders</p>
              <p className="text-3xl font-bold text-blue-600">{mockData.reduce((sum, c) => sum + c.orders, 0).toLocaleString()}</p>
            </div>
          </Card>
          <Card>
            <div className="text-center">
              <p className="text-gray-500 text-sm">Total Revenue</p>
              <p className="text-3xl font-bold text-purple-600">${mockData.reduce((sum, c) => sum + c.revenue, 0).toLocaleString()}</p>
            </div>
          </Card>
          <Card>
            <div className="text-center">
              <p className="text-gray-500 text-sm">Sync Status</p>
              <p className="text-3xl font-bold text-orange-600">99.5%</p>
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

        <Modal title="Add Channel" open={addModal.isOpen} onCancel={addModal.close} onOk={() => form.submit()} width={600}>
          <Form form={form} layout="vertical" onFinish={handleSubmit}>
            <Form.Item label="Channel Name" name="name" rules={[{ required: true }]}>
              <Input placeholder="Enter channel name" />
            </Form.Item>
            <Form.Item label="API Key" name="apiKey" rules={[{ required: true }]}>
              <Input.Password placeholder="Enter API key" />
            </Form.Item>
          </Form>
        </Modal>
      </div>
    </MainLayout>
  );
}
