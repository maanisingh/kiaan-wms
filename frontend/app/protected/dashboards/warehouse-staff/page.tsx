'use client';

import React from 'react';

import { KPICard } from '@/components/ui/KPICard';
import { Card, Table, Button, Tag, Row, Col } from 'antd';
import {
  InboxOutlined,
  SendOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
} from '@ant-design/icons';
import Link from 'next/link';

export default function WarehouseStaffDashboardPage() {
  const stats = {
    receivedToday: { value: 15, change: 5, trend: 'up' as const },
    shippedToday: { value: 23, change: 3, trend: 'up' as const },
    tasksCompleted: { value: 38, change: 8, trend: 'up' as const },
    pendingTasks: { value: 12, change: -2, trend: 'down' as const },
  };

  const myTasks = [
    { id: 1, task: 'Receive PO-2024-045', type: 'Receiving', priority: 'high', status: 'in_progress' },
    { id: 2, task: 'Put away items to Zone A', type: 'Putaway', priority: 'normal', status: 'pending' },
    { id: 3, task: 'Cycle count Zone B', type: 'Counting', priority: 'low', status: 'pending' },
  ];

  const columns = [
    { title: 'Task', dataIndex: 'task', key: 'task' },
    { title: 'Type', dataIndex: 'type', key: 'type', render: (type: string) => <Tag>{type}</Tag> },
    {
      title: 'Priority',
      dataIndex: 'priority',
      key: 'priority',
      render: (priority: string) => (
        <Tag color={priority === 'high' ? 'red' : priority === 'normal' ? 'blue' : 'default'}>
          {priority.toUpperCase()}
        </Tag>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={status === 'in_progress' ? 'blue' : 'default'}>
          {status.replace('_', ' ').toUpperCase()}
        </Tag>
      ),
    },
    {
      title: 'Action',
      key: 'action',
      render: () => <Button type="link" size="small">Start Task</Button>,
    },
  ];

  return (
    <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Warehouse Staff Dashboard</h1>
            <p className="text-gray-600 mt-1">Your daily tasks and activities</p>
          </div>
        </div>

        {/* KPI Cards */}
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} lg={6}>
            <KPICard
              title="Received Today"
              value={stats.receivedToday.value}
              change={stats.receivedToday.change}
              trend={stats.receivedToday.trend}
              icon={<InboxOutlined />}
            />
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <KPICard
              title="Shipped Today"
              value={stats.shippedToday.value}
              change={stats.shippedToday.change}
              trend={stats.shippedToday.trend}
              icon={<SendOutlined />}
            />
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <KPICard
              title="Tasks Completed"
              value={stats.tasksCompleted.value}
              change={stats.tasksCompleted.change}
              trend={stats.tasksCompleted.trend}
              icon={<CheckCircleOutlined />}
            />
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <KPICard
              title="Pending Tasks"
              value={stats.pendingTasks.value}
              change={stats.pendingTasks.change}
              trend={stats.pendingTasks.trend}
              icon={<ClockCircleOutlined />}
            />
          </Col>
        </Row>

        {/* My Tasks */}
        <Card title="My Tasks">
          <Table
            dataSource={myTasks}
            columns={columns}
            rowKey="id"
            pagination={false}
          />
        </Card>

        {/* Quick Actions */}
        <Card title="Quick Actions">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Link href="/protected/goods-receiving">
              <Button block size="large">Receive Goods</Button>
            </Link>
            <Link href="/protected/inventory/movements">
              <Button block size="large">Stock Movement</Button>
            </Link>
            <Link href="/protected/inventory/cycle-counts">
              <Button block size="large">Cycle Count</Button>
            </Link>
            <Link href="/protected/shipments">
              <Button block size="large">Process Shipment</Button>
            </Link>
          </div>
        </Card>
      </div>
      );
}
