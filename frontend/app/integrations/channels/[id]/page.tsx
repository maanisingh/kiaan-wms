'use client';

import React from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, Descriptions, Tag, Button, Tabs, Timeline, Table, Statistic, Row, Col } from 'antd';
import { ArrowLeftOutlined, SyncOutlined, CheckCircleOutlined, SettingOutlined, BarChartOutlined } from '@ant-design/icons';
import Link from 'next/link';
import { formatDate } from '@/lib/utils';

export default function ChannelDetailPage({ params }: { params: { id: string } }) {
  const [activeTab, setActiveTab] = React.useState('details');

  const channel = {
    id: params.id,
    name: params.id === '1' ? 'Shopify Store' : params.id === '2' ? 'Amazon Seller Central' : 'eBay Store',
    type: params.id === '1' ? 'E-Commerce' : 'Marketplace',
    status: 'active',
    orders: params.id === '1' ? 1245 : params.id === '2' ? 3456 : 567,
    revenue: params.id === '1' ? 45600 : params.id === '2' ? 123400 : 23100,
    lastSync: '5 min ago',
    apiKey: 'shpat_xxxxxxxxxxxx',
    webhookUrl: 'https://wms.example.com/webhooks/shopify',
    createdDate: '2024-01-15',
    avgOrderValue: 215.50,
    syncFrequency: '5 minutes',
  };

  const syncHistory = [
    { time: '2024-11-17 14:30', status: 'Success', records: 45, duration: '2.3s' },
    { time: '2024-11-17 14:25', status: 'Success', records: 32, duration: '1.8s' },
    { time: '2024-11-17 14:20', status: 'Success', records: 28, duration: '2.1s' },
    { time: '2024-11-17 14:15', status: 'Failed', records: 0, duration: '0.5s' },
    { time: '2024-11-17 14:10', status: 'Success', records: 54, duration: '3.2s' },
  ];

  const recentOrders = [
    { id: '1', orderId: 'ORD-1001', customer: 'John Doe', amount: 245.99, status: 'synced', date: '2024-11-17' },
    { id: '2', orderId: 'ORD-1002', customer: 'Jane Smith', amount: 189.50, status: 'synced', date: '2024-11-17' },
    { id: '3', orderId: 'ORD-1003', customer: 'Bob Johnson', amount: 320.00, status: 'pending', date: '2024-11-17' },
  ];

  const orderColumns = [
    { title: 'Order ID', dataIndex: 'orderId', key: 'orderId', width: 120 },
    { title: 'Customer', dataIndex: 'customer', key: 'customer', width: 150 },
    { title: 'Amount', dataIndex: 'amount', key: 'amount', width: 120, render: (val: number) => `$${val.toFixed(2)}` },
    { title: 'Status', dataIndex: 'status', key: 'status', width: 100, render: (status: string) => <Tag color={status === 'synced' ? 'green' : 'orange'}>{status}</Tag> },
    { title: 'Date', dataIndex: 'date', key: 'date', width: 120, render: (date: string) => formatDate(date) },
  ];

  const tabItems = [
    {
      key: 'details',
      label: 'Channel Details',
      children: (
        <div className="space-y-6">
          <Card title="Channel Information">
            <Descriptions column={2} bordered>
              <Descriptions.Item label="Channel Name">{channel.name}</Descriptions.Item>
              <Descriptions.Item label="Type">
                <Tag color="blue">{channel.type}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Status">
                <Tag color="green" icon={<CheckCircleOutlined />}>Active</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Last Sync">{channel.lastSync}</Descriptions.Item>
              <Descriptions.Item label="API Key">{channel.apiKey}</Descriptions.Item>
              <Descriptions.Item label="Webhook URL">{channel.webhookUrl}</Descriptions.Item>
              <Descriptions.Item label="Sync Frequency">{channel.syncFrequency}</Descriptions.Item>
              <Descriptions.Item label="Created Date">{formatDate(channel.createdDate)}</Descriptions.Item>
            </Descriptions>
          </Card>

          <Card title="Recent Orders">
            <Table
              dataSource={recentOrders}
              columns={orderColumns}
              rowKey="id"
              pagination={false}
            />
          </Card>
        </div>
      ),
    },
    {
      key: 'sync',
      label: 'Sync History',
      children: (
        <Card title="Synchronization Log">
          <Timeline>
            {syncHistory.map((event, index) => (
              <Timeline.Item
                key={index}
                color={event.status === 'Success' ? 'green' : 'red'}
                dot={event.status === 'Success' ? <CheckCircleOutlined style={{ fontSize: '16px' }} /> : undefined}
              >
                <div className="font-semibold">{event.status}</div>
                <div className="text-sm text-gray-600">{event.time} - {event.records} records - {event.duration}</div>
              </Timeline.Item>
            ))}
          </Timeline>
        </Card>
      ),
    },
    {
      key: 'performance',
      label: 'Performance',
      children: (
        <div className="space-y-6">
          <Row gutter={16}>
            <Col span={6}>
              <Card>
                <Statistic title="Total Orders" value={channel.orders} />
              </Card>
            </Col>
            <Col span={6}>
              <Card>
                <Statistic title="Total Revenue" value={channel.revenue} prefix="$" />
              </Card>
            </Col>
            <Col span={6}>
              <Card>
                <Statistic title="Avg Order Value" value={channel.avgOrderValue} prefix="$" precision={2} />
              </Card>
            </Col>
            <Col span={6}>
              <Card>
                <Statistic title="Sync Success Rate" value={98.5} suffix="%" />
              </Card>
            </Col>
          </Row>
        </div>
      ),
    },
  ];

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Link href="/integrations/channels">
              <Button icon={<ArrowLeftOutlined />}>Back to Channels</Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold">{channel.name}</h1>
              <p className="text-gray-600 mt-1">{channel.type} Integration</p>
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
              <p className="text-gray-500 text-sm">Orders</p>
              <p className="text-2xl font-bold text-blue-600">{channel.orders.toLocaleString()}</p>
            </div>
          </Card>
          <Card>
            <div className="text-center">
              <p className="text-gray-500 text-sm">Revenue</p>
              <p className="text-2xl font-bold text-green-600">${channel.revenue.toLocaleString()}</p>
            </div>
          </Card>
          <Card>
            <div className="text-center">
              <p className="text-gray-500 text-sm">Avg Order</p>
              <p className="text-2xl font-bold text-purple-600">${channel.avgOrderValue}</p>
            </div>
          </Card>
          <Card>
            <div className="text-center">
              <p className="text-gray-500 text-sm">Success Rate</p>
              <p className="text-2xl font-bold text-orange-600">98.5%</p>
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
