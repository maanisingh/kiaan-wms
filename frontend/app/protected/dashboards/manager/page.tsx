'use client';

import React from 'react';

import { KPICard } from '@/components/ui/KPICard';
import { Card, Table, Button, Tag, Row, Col, Progress } from 'antd';
import {
  DatabaseOutlined,
  ShoppingCartOutlined,
  TeamOutlined,
  WarningOutlined,
  EyeOutlined,
} from '@ant-design/icons';
import Link from 'next/link';

export default function ManagerDashboardPage() {
  const stats = {
    totalOrders: { value: 156, change: 12, trend: 'up' as const },
    activeStaff: { value: 24, change: 2, trend: 'up' as const },
    warehouseUtilization: { value: 78, change: -3, trend: 'down' as const },
    pendingIssues: { value: 8, change: -2, trend: 'down' as const },
  };

  const staffPerformance = [
    { id: 1, name: 'John Picker', role: 'Picker', ordersCompleted: 45, efficiency: 95 },
    { id: 2, name: 'Sarah Packer', role: 'Packer', ordersCompleted: 38, efficiency: 92 },
    { id: 3, name: 'Mike Handler', role: 'Staff', ordersCompleted: 32, efficiency: 88 },
  ];

  const columns = [
    { title: 'Name', dataIndex: 'name', key: 'name' },
    { title: 'Role', dataIndex: 'role', key: 'role', render: (role: string) => <Tag color="blue">{role}</Tag> },
    { title: 'Orders Completed', dataIndex: 'ordersCompleted', key: 'ordersCompleted' },
    {
      title: 'Efficiency',
      dataIndex: 'efficiency',
      key: 'efficiency',
      render: (efficiency: number) => <Progress percent={efficiency} size="small" />,
    },
  ];

  return (
    <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Manager Dashboard</h1>
            <p className="text-gray-600 mt-1">Overview of warehouse operations and team performance</p>
          </div>
        </div>

        {/* KPI Cards */}
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} lg={6}>
            <KPICard
              title="Total Orders"
              value={stats.totalOrders.value}
              change={stats.totalOrders.change}
              trend={stats.totalOrders.trend}
              icon={<ShoppingCartOutlined />}
            />
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <KPICard
              title="Active Staff"
              value={stats.activeStaff.value}
              change={stats.activeStaff.change}
              trend={stats.activeStaff.trend}
              icon={<TeamOutlined />}
            />
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <KPICard
              title="Warehouse Capacity"
              value={stats.warehouseUtilization.value}
              change={stats.warehouseUtilization.change}
              trend={stats.warehouseUtilization.trend}
              icon={<DatabaseOutlined />}
              suffix="%"
            />
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <KPICard
              title="Pending Issues"
              value={stats.pendingIssues.value}
              change={stats.pendingIssues.change}
              trend={stats.pendingIssues.trend}
              icon={<WarningOutlined />}
            />
          </Col>
        </Row>

        {/* Staff Performance */}
        <Card title="Team Performance Today">
          <Table
            dataSource={staffPerformance}
            columns={columns}
            rowKey="id"
            pagination={false}
          />
        </Card>

        {/* Quick Actions */}
        <Card title="Manager Actions">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Link href="/protected/users">
              <Button block size="large">Manage Staff</Button>
            </Link>
            <Link href="/protected/reports">
              <Button block size="large">View Reports</Button>
            </Link>
            <Link href="/protected/warehouses">
              <Button block size="large">Warehouse Management</Button>
            </Link>
            <Link href="/protected/inventory">
              <Button block size="large">Inventory Overview</Button>
            </Link>
          </div>
        </Card>
      </div>
      );
}
