'use client';

import React from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { KPICard } from '@/components/ui/KPICard';
import { Card, Table, Button, Tag, Row, Col, Progress } from 'antd';
import {
  InboxOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  TrophyOutlined,
} from '@ant-design/icons';
import Link from 'next/link';

export default function PackerDashboardPage() {
  const stats = {
    ordersPackedToday: { value: 38, change: 6, trend: 'up' as const },
    itemsPacked: { value: 142, change: 12, trend: 'up' as const },
    accuracy: { value: 99.2, change: 0.3, trend: 'up' as const },
    avgPackTime: { value: 4.5, change: -0.5, trend: 'down' as const },
  };

  const packingQueue = [
    {
      id: 1,
      orderNumber: 'SO-2024-156',
      priority: 'urgent',
      items: 8,
      carrier: 'UPS',
      estimatedTime: '15 min',
    },
    {
      id: 2,
      orderNumber: 'SO-2024-157',
      priority: 'high',
      items: 5,
      carrier: 'FedEx',
      estimatedTime: '10 min',
    },
    {
      id: 3,
      orderNumber: 'SO-2024-158',
      priority: 'normal',
      items: 12,
      carrier: 'USPS',
      estimatedTime: '18 min',
    },
  ];

  const columns = [
    { title: 'Order #', dataIndex: 'orderNumber', key: 'orderNumber' },
    {
      title: 'Priority',
      dataIndex: 'priority',
      key: 'priority',
      render: (priority: string) => (
        <Tag color={priority === 'urgent' ? 'red' : priority === 'high' ? 'orange' : 'blue'}>
          {priority.toUpperCase()}
        </Tag>
      ),
    },
    { title: 'Items', dataIndex: 'items', key: 'items' },
    { title: 'Carrier', dataIndex: 'carrier', key: 'carrier', render: (carrier: string) => <Tag>{carrier}</Tag> },
    { title: 'Est. Time', dataIndex: 'estimatedTime', key: 'estimatedTime' },
    {
      title: 'Action',
      key: 'action',
      render: (_: any, record: any) => (
        <Link href={`/packing/${record.id}`}>
          <Button type="primary" size="small">Start Packing</Button>
        </Link>
      ),
    },
  ];

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Packer Dashboard</h1>
            <p className="text-gray-600 mt-1">Your packing assignments and performance</p>
          </div>
        </div>

        {/* KPI Cards */}
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} lg={6}>
            <KPICard
              title="Orders Packed"
              value={stats.ordersPackedToday.value}
              change={stats.ordersPackedToday.change}
              trend={stats.ordersPackedToday.trend}
              icon={<InboxOutlined />}
            />
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <KPICard
              title="Items Packed"
              value={stats.itemsPacked.value}
              change={stats.itemsPacked.change}
              trend={stats.itemsPacked.trend}
              icon={<CheckCircleOutlined />}
            />
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <KPICard
              title="Accuracy Rate"
              value={stats.accuracy.value}
              change={stats.accuracy.change}
              trend={stats.accuracy.trend}
              icon={<TrophyOutlined />}
              suffix="%"
            />
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <KPICard
              title="Avg Pack Time"
              value={stats.avgPackTime.value}
              change={stats.avgPackTime.change}
              trend={stats.avgPackTime.trend}
              icon={<ClockCircleOutlined />}
              suffix="min"
            />
          </Col>
        </Row>

        {/* Packing Queue */}
        <Card title="Packing Queue" extra={<Tag color="blue">{packingQueue.length} orders waiting</Tag>}>
          <Table
            dataSource={packingQueue}
            columns={columns}
            rowKey="id"
            pagination={false}
          />
        </Card>

        {/* Performance Summary */}
        <Row gutter={16}>
          <Col xs={24} lg={12}>
            <Card title="Today's Performance">
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between mb-2">
                    <span>Daily Goal Progress</span>
                    <span className="font-semibold">38 / 45 orders</span>
                  </div>
                  <Progress percent={84} status="active" />
                </div>
                <div>
                  <div className="flex justify-between mb-2">
                    <span>Accuracy Target</span>
                    <span className="font-semibold">99.2% / 98%</span>
                  </div>
                  <Progress percent={100} status="success" />
                </div>
                <div>
                  <div className="flex justify-between mb-2">
                    <span>Speed Target</span>
                    <span className="font-semibold">4.5 / 5 min avg</span>
                  </div>
                  <Progress percent={110} status="success" />
                </div>
              </div>
            </Card>
          </Col>
          <Col xs={24} lg={12}>
            <Card title="Quick Actions">
              <div className="grid grid-cols-1 gap-3">
                <Link href="/packing">
                  <Button block size="large" type="primary">
                    View All Packing Orders
                  </Button>
                </Link>
                <Button block size="large">Print Shipping Label</Button>
                <Button block size="large">Report Packaging Issue</Button>
                <Link href="/shipments">
                  <Button block size="large">Process Shipment</Button>
                </Link>
              </div>
            </Card>
          </Col>
        </Row>
      </div>
    </MainLayout>
  );
}
