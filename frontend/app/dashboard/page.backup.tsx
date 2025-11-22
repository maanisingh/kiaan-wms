'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { MainLayout } from '@/components/layout/MainLayout';
import { KPICard } from '@/components/ui/KPICard';
import { Card, Table, Button, Tag, Row, Col } from 'antd';
import {
  DatabaseOutlined,
  ShoppingCartOutlined,
  InboxOutlined,
  WarningOutlined,
  PlusOutlined,
  EyeOutlined,
} from '@ant-design/icons';
import { mockDashboardStats, mockSalesOrders } from '@/lib/mockData';
import { formatCurrency, formatDate, getStatusColor } from '@/lib/utils';
import { getRoleDashboardPath } from '@/lib/auth';
import { useAuthStore } from '@/store/authStore';
import Link from 'next/link';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export default function DashboardPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const stats = mockDashboardStats;
  const recentOrders = mockSalesOrders.slice(0, 10);

  // Redirect to role-specific dashboard if not admin
  useEffect(() => {
    if (user && user.role !== 'admin') {
      const dashboardPath = getRoleDashboardPath(user.role);
      router.replace(dashboardPath);
    }
  }, [router]);

  // Daily orders chart data
  const dailyOrdersData = {
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    datasets: [
      {
        label: 'Orders',
        data: [65, 78, 90, 81, 96, 85, 100],
        borderColor: '#1890ff',
        backgroundColor: 'rgba(24, 144, 255, 0.1)',
        fill: true,
        tension: 0.4,
      },
    ],
  };

  // Receiving vs Shipping chart data
  const receivingShippingData = {
    labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
    datasets: [
      {
        label: 'Received',
        data: [120, 150, 180, 170],
        backgroundColor: '#52c41a',
      },
      {
        label: 'Shipped',
        data: [100, 130, 160, 190],
        backgroundColor: '#1890ff',
      },
    ],
  };

  // Warehouse utilization chart data
  const utilizationData = {
    labels: ['Used', 'Available'],
    datasets: [
      {
        data: [stats.warehouseUtilization, 100 - stats.warehouseUtilization],
        backgroundColor: ['#1890ff', '#f0f0f0'],
      },
    ],
  };

  const columns = [
    {
      title: 'Order #',
      dataIndex: 'orderNumber',
      key: 'orderNumber',
      render: (text: string, record: any) => (
        <Link href={`/sales-orders/${record.id}`} className="text-blue-600 hover:text-blue-800">
          {text}
        </Link>
      ),
    },
    {
      title: 'Customer',
      dataIndex: ['customer', 'name'],
      key: 'customer',
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={getStatusColor(status)} className="uppercase">
          {status.replace('_', ' ')}
        </Tag>
      ),
    },
    {
      title: 'Priority',
      dataIndex: 'priority',
      key: 'priority',
      render: (priority: string) => (
        <Tag color={getStatusColor(priority)} className="uppercase">
          {priority}
        </Tag>
      ),
    },
    {
      title: 'Total',
      dataIndex: 'total',
      key: 'total',
      render: (total: number) => formatCurrency(total),
    },
    {
      title: 'Date',
      dataIndex: 'orderDate',
      key: 'orderDate',
      render: (date: string) => formatDate(date),
    },
    {
      title: 'Action',
      key: 'action',
      render: (_: any, record: any) => (
        <Link href={`/sales-orders/${record.id}`}>
          <Button type="link" icon={<EyeOutlined />} size="small">
            View
          </Button>
        </Link>
      ),
    },
  ];

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-gray-600 mt-1">Welcome back! Here's what's happening today.</p>
          </div>
          <div className="flex gap-2">
            <Link href="/sales-orders/new">
              <Button type="primary" icon={<PlusOutlined />} size="large">
                New Order
              </Button>
            </Link>
          </div>
        </div>

        {/* KPI Cards */}
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} lg={6}>
            <KPICard
              title="Total Stock"
              value={stats.totalStock.value}
              change={stats.totalStock.change}
              trend={stats.totalStock.trend}
              icon={<DatabaseOutlined />}
              suffix="units"
            />
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <KPICard
              title="Orders Today"
              value={stats.ordersToday.value}
              change={stats.ordersToday.change}
              trend={stats.ordersToday.trend}
              icon={<ShoppingCartOutlined />}
            />
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <KPICard
              title="Pick Backlog"
              value={stats.pickBacklog.value}
              change={stats.pickBacklog.change}
              trend={stats.pickBacklog.trend}
              icon={<InboxOutlined />}
            />
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <KPICard
              title="Expiry Alerts"
              value={stats.expiryAlerts.value}
              change={stats.expiryAlerts.change}
              trend={stats.expiryAlerts.trend}
              icon={<WarningOutlined />}
            />
          </Col>
        </Row>

        {/* Charts Row */}
        <Row gutter={[16, 16]}>
          <Col xs={24} lg={12}>
            <Card title="Daily Orders (Last 7 Days)" className="h-full">
              <Line data={dailyOrdersData} options={{ responsive: true, maintainAspectRatio: true }} />
            </Card>
          </Col>
          <Col xs={24} lg={12}>
            <Card title="Receiving vs Shipping (Last 4 Weeks)" className="h-full">
              <Bar data={receivingShippingData} options={{ responsive: true, maintainAspectRatio: true }} />
            </Card>
          </Col>
        </Row>

        {/* Warehouse Utilization & Order Status */}
        <Row gutter={[16, 16]}>
          <Col xs={24} lg={8}>
            <Card title="Warehouse Utilization" className="h-full">
              <div className="flex items-center justify-center h-64">
                <Doughnut
                  data={utilizationData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: true,
                    plugins: {
                      legend: {
                        position: 'bottom',
                      },
                    },
                  }}
                />
              </div>
              <div className="text-center mt-4">
                <p className="text-2xl font-bold text-blue-600">{stats.warehouseUtilization}%</p>
                <p className="text-gray-600">Capacity Used</p>
              </div>
            </Card>
          </Col>
          <Col xs={24} lg={16}>
            <Card title="Orders by Status" className="h-full">
              <div className="space-y-4">
                {Object.entries(stats.ordersByStatus).map(([status, count]) => (
                  <div key={status} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Tag color={getStatusColor(status)} className="uppercase min-w-[100px] text-center">
                        {status.replace('_', ' ')}
                      </Tag>
                      <span className="text-gray-600">{count} orders</span>
                    </div>
                    <div className="flex-1 mx-4">
                      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-500 transition-all"
                          style={{ width: `${(count / 200) * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </Col>
        </Row>

        {/* Recent Orders Table */}
        <Card
          title="Recent Orders"
          extra={
            <Link href="/sales-orders">
              <Button type="link">View All</Button>
            </Link>
          }
        >
          <Table
            dataSource={recentOrders}
            columns={columns}
            rowKey="id"
            pagination={false}
            scroll={{ x: 800 }}
          />
        </Card>

        {/* Quick Actions */}
        <Card title="Quick Actions">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Link href="/sales-orders/new">
              <Button block size="large">Create Order</Button>
            </Link>
            <Link href="/goods-receiving/new">
              <Button block size="large">Receive Goods</Button>
            </Link>
            <Link href="/inventory/adjustments/new">
              <Button block size="large">Adjust Inventory</Button>
            </Link>
            <Link href="/reports">
              <Button block size="large">Generate Report</Button>
            </Link>
          </div>
        </Card>
      </div>
    </MainLayout>
  );
}
