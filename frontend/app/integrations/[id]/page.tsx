'use client';

import React from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, Descriptions, Tag, Button, Tabs, Timeline, Table } from 'antd';
import { ArrowLeftOutlined, SyncOutlined, SettingOutlined, CheckCircleOutlined } from '@ant-design/icons';
import Link from 'next/link';
import { formatDate } from '@/lib/utils';

export default function IntegrationDetailPage({ params }: { params: { id: string } }) {
  const [activeTab, setActiveTab] = React.useState('details');

  const integration = {
    id: params.id,
    name: 'Shopify',
    type: 'E-Commerce',
    status: 'active',
    apiEndpoint: 'https://shopify.com/api/v2024-01',
    lastSync: '2024-11-17 14:30:00',
    syncFrequency: 'Real-time',
    totalOrders: 12450,
    totalProducts: 567,
    apiCalls: 45289,
  };

  const syncHistory = [
    { time: '2024-11-17 14:30', status: 'Success', records: 45, type: 'Orders' },
    { time: '2024-11-17 14:15', status: 'Success', records: 12, type: 'Products' },
    { time: '2024-11-17 14:00', status: 'Success', records: 67, type: 'Orders' },
    { time: '2024-11-17 13:45', status: 'Failed', records: 0, type: 'Inventory', error: 'API rate limit exceeded' },
  ];

  const syncColumns = [
    { title: 'Time', dataIndex: 'time', key: 'time', width: 180 },
    { title: 'Type', dataIndex: 'type', key: 'type', width: 120 },
    { title: 'Records', dataIndex: 'records', key: 'records', width: 100 },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status: string) => (
        <Tag color={status === 'Success' ? 'green' : 'red'}>{status}</Tag>
      ),
    },
    { title: 'Error', dataIndex: 'error', key: 'error', render: (error: string) => error || '-' },
  ];

  const tabItems = [
    {
      key: 'details',
      label: 'Integration Details',
      children: (
        <Card title="Configuration">
          <Descriptions column={2} bordered>
            <Descriptions.Item label="Name">{integration.name}</Descriptions.Item>
            <Descriptions.Item label="Type"><Tag color="blue">{integration.type}</Tag></Descriptions.Item>
            <Descriptions.Item label="Status">
              <Tag color={integration.status === 'active' ? 'green' : 'red'}>{integration.status}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="API Endpoint">{integration.apiEndpoint}</Descriptions.Item>
            <Descriptions.Item label="Sync Frequency">{integration.syncFrequency}</Descriptions.Item>
            <Descriptions.Item label="Last Sync">{integration.lastSync}</Descriptions.Item>
            <Descriptions.Item label="Total Orders">{integration.totalOrders.toLocaleString()}</Descriptions.Item>
            <Descriptions.Item label="Total Products">{integration.totalProducts.toLocaleString()}</Descriptions.Item>
            <Descriptions.Item label="API Calls Today">{integration.apiCalls.toLocaleString()}</Descriptions.Item>
          </Descriptions>
        </Card>
      ),
    },
    {
      key: 'sync-history',
      label: 'Sync History',
      children: (
        <Card title="Recent Sync Activity">
          <Table
            dataSource={syncHistory}
            columns={syncColumns}
            rowKey={(record, index) => index?.toString() || '0'}
            pagination={{ pageSize: 10 }}
          />
        </Card>
      ),
    },
  ];

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Link href="/integrations">
              <Button icon={<ArrowLeftOutlined />}>Back to Integrations</Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold">{integration.name} Integration</h1>
              <p className="text-gray-600 mt-1">{integration.type} Platform</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button icon={<SyncOutlined />} size="large">Sync Now</Button>
            <Button icon={<SettingOutlined />} type="primary" size="large">Configure</Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <div className="text-center">
              <p className="text-gray-500 text-sm">Orders Synced</p>
              <p className="text-2xl font-bold text-blue-600">{integration.totalOrders.toLocaleString()}</p>
            </div>
          </Card>
          <Card>
            <div className="text-center">
              <p className="text-gray-500 text-sm">Products</p>
              <p className="text-2xl font-bold text-purple-600">{integration.totalProducts}</p>
            </div>
          </Card>
          <Card>
            <div className="text-center">
              <p className="text-gray-500 text-sm">API Calls</p>
              <p className="text-2xl font-bold text-green-600">{integration.apiCalls.toLocaleString()}</p>
            </div>
          </Card>
          <Card>
            <div className="text-center">
              <p className="text-gray-500 text-sm">Success Rate</p>
              <p className="text-2xl font-bold text-orange-600">99.2%</p>
            </div>
          </Card>
        </div>

        <Card className="shadow-sm">
          <Tabs activeKey={activeTab} onChange={setActiveTab} items={tabItems} size="large" />
        </Card>
      </div>
    </MainLayout>
  );
}
