'use client';

import React from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { KPICard } from '@/components/ui/KPICard';
import { Card, Table, Button, Tag, Row, Col, Progress } from 'antd';
import {
  ShoppingCartOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  TrophyOutlined,
} from '@ant-design/icons';
import Link from 'next/link';

export default function PickerDashboardPage() {
  const stats = {
    ordersPickedToday: { value: 42, change: 8, trend: 'up' as const },
    itemsPicked: { value: 186, change: 15, trend: 'up' as const },
    accuracy: { value: 98.5, change: 0.5, trend: 'up' as const },
    avgPickTime: { value: 3.2, change: -0.3, trend: 'down' as const },
  };

  const pickingQueue = [
    {
      id: 1,
      orderNumber: 'SO-2024-156',
      priority: 'urgent',
      items: 8,
      zone: 'Zone A',
      estimatedTime: '12 min',
    },
    {
      id: 2,
      orderNumber: 'SO-2024-157',
      priority: 'high',
      items: 5,
      zone: 'Zone B',
      estimatedTime: '8 min',
    },
    {
      id: 3,
      orderNumber: 'SO-2024-158',
      priority: 'normal',
      items: 12,
      zone: 'Zone A',
      estimatedTime: '15 min',
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
    { title: 'Zone', dataIndex: 'zone', key: 'zone', render: (zone: string) => <Tag color="cyan">{zone}</Tag> },
    { title: 'Est. Time', dataIndex: 'estimatedTime', key: 'estimatedTime' },
    {
      title: 'Action',
      key: 'action',
      render: (_: any, record: any) => (
        <Link href={`/picking/${record.id}`}>
          <Button type="primary" size="small">Start Picking</Button>
        </Link>
      ),
    },
  ];

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Picker Dashboard</h1>
            <p className="text-gray-600 mt-1">Your picking assignments and performance</p>
          </div>
        </div>

        {/* KPI Cards */}
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} lg={6}>
            <KPICard
              title="Orders Picked"
              value={stats.ordersPickedToday.value}
              change={stats.ordersPickedToday.change}
              trend={stats.ordersPickedToday.trend}
              icon={<ShoppingCartOutlined />}
            />
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <KPICard
              title="Items Picked"
              value={stats.itemsPicked.value}
              change={stats.itemsPicked.change}
              trend={stats.itemsPicked.trend}
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
              title="Avg Pick Time"
              value={stats.avgPickTime.value}
              change={stats.avgPickTime.change}
              trend={stats.avgPickTime.trend}
              icon={<ClockCircleOutlined />}
              suffix="min"
            />
          </Col>
        </Row>

        {/* Picking Queue */}
        <Card title="Picking Queue" extra={<Tag color="blue">{pickingQueue.length} orders waiting</Tag>}>
          <Table
            dataSource={pickingQueue}
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
                    <span className="font-semibold">42 / 50 orders</span>
                  </div>
                  <Progress percent={84} status="active" />
                </div>
                <div>
                  <div className="flex justify-between mb-2">
                    <span>Accuracy Target</span>
                    <span className="font-semibold">98.5% / 98%</span>
                  </div>
                  <Progress percent={100} status="success" />
                </div>
                <div>
                  <div className="flex justify-between mb-2">
                    <span>Speed Target</span>
                    <span className="font-semibold">3.2 / 4 min avg</span>
                  </div>
                  <Progress percent={125} status="success" />
                </div>
              </div>
            </Card>
          </Col>
          <Col xs={24} lg={12}>
            <Card title="Quick Actions">
              <div className="grid grid-cols-1 gap-3">
                <Link href="/picking">
                  <Button block size="large" type="primary">
                    View All Pick Lists
                  </Button>
                </Link>
                <Button block size="large">Report Issue</Button>
                <Button block size="large">Request Stock Check</Button>
                <Link href="/inventory">
                  <Button block size="large">Check Inventory</Button>
                </Link>
              </div>
            </Card>
          </Col>
        </Row>
      </div>
    </MainLayout>
  );
}
