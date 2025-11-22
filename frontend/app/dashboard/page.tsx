'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@apollo/client/react';
import { MainLayout } from '@/components/layout/MainLayout';
import { KPICard } from '@/components/ui/KPICard';
import { Card, Table, Button, Tag, Row, Col, Spin, Alert } from 'antd';
import {
  DatabaseOutlined,
  ShoppingCartOutlined,
  InboxOutlined,
  WarningOutlined,
  EyeOutlined,
} from '@ant-design/icons';
import { GET_DASHBOARD_STATS, GET_SALES_ORDERS } from '@/lib/graphql/queries';
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

export default function DashboardWithRealData() {
  const router = useRouter();
  const { user } = useAuthStore();

  // Fetch dashboard statistics from Hasura
  const { data: statsData, loading: statsLoading, error: statsError } = useQuery(GET_DASHBOARD_STATS);

  // Fetch recent sales orders
  const { data: ordersData, loading: ordersLoading, error: ordersError } = useQuery(GET_SALES_ORDERS, {
    variables: { limit: 10, offset: 0 }
  });

  // Redirect to role-specific dashboard if not admin
  useEffect(() => {
    if (user && user.role !== 'admin') {
      const dashboardPath = getRoleDashboardPath(user.role);
      router.replace(dashboardPath);
    }
  }, [user, router]);

  // Extract statistics
  const stats = {
    totalProducts: statsData?.Product_aggregate?.aggregate?.count || 0,
    totalInventory: statsData?.Inventory_aggregate?.aggregate?.sum?.quantity || 0,
    availableInventory: statsData?.Inventory_aggregate?.aggregate?.sum?.availableQuantity || 0,
    totalOrders: statsData?.SalesOrder_aggregate?.aggregate?.count || 0,
    pendingOrders: statsData?.SalesOrder_aggregate?.aggregate?.count || 0, // Will be filtered in actual query
    warehouses: statsData?.Warehouse_aggregate?.aggregate?.count || 0,
  };

  const recentOrders = ordersData?.SalesOrder || [];

  // Loading state
  if (statsLoading || ordersLoading) {
    return (
      <MainLayout>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
          <Spin size="large" tip="Loading dashboard data..." />
        </div>
      </MainLayout>
    );
  }

  // Error state
  if (statsError || ordersError) {
    return (
      <MainLayout>
        <Alert
          message="Error Loading Dashboard"
          description={statsError?.message || ordersError?.message}
          type="error"
          showIcon
        />
      </MainLayout>
    );
  }

  // Daily orders chart data (mock for now, can be enhanced with real time-series data)
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
        data: [stats.totalInventory - stats.availableInventory, stats.availableInventory],
        backgroundColor: ['#1890ff', '#e6f7ff'],
        borderWidth: 0,
      },
    ],
  };

  // Recent orders table columns
  const columns = [
    {
      title: 'Order #',
      dataIndex: 'orderNumber',
      key: 'orderNumber',
      render: (text: string, record: any) => (
        <Link href={`/sales-orders/${record.id}`}>
          <Button type="link">{text}</Button>
        </Link>
      ),
    },
    {
      title: 'Customer',
      dataIndex: ['Customer', 'name'],
      key: 'customer',
    },
    {
      title: 'Date',
      dataIndex: 'orderDate',
      key: 'orderDate',
      render: (date: string) => formatDate(date),
    },
    {
      title: 'Items',
      dataIndex: 'SalesOrderItems',
      key: 'items',
      render: (items: any[]) => items?.length || 0,
    },
    {
      title: 'Total',
      dataIndex: 'totalAmount',
      key: 'totalAmount',
      render: (amount: number) => formatCurrency(amount || 0),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={getStatusColor(status)}>{status}</Tag>
      ),
    },
    {
      title: 'Action',
      key: 'action',
      render: (_: any, record: any) => (
        <Link href={`/sales-orders/${record.id}`}>
          <Button type="link" icon={<EyeOutlined />}>View</Button>
        </Link>
      ),
    },
  ];

  return (
    <MainLayout>
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Dashboard Overview</h1>
          <div className="text-sm text-gray-500">
            Last updated: {new Date().toLocaleString()}
          </div>
        </div>

        {/* KPI Cards */}
        <Row gutter={[16, 16]} className="mb-6">
          <Col xs={24} sm={12} lg={6}>
            <KPICard
              title="Total Products"
              value={stats.totalProducts}
              icon={<DatabaseOutlined />}
              color="#1890ff"
              trend={{ value: 12, isPositive: true }}
            />
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <KPICard
              title="Total Inventory"
              value={stats.totalInventory.toLocaleString()}
              icon={<InboxOutlined />}
              color="#52c41a"
              trend={{ value: 8, isPositive: true }}
            />
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <KPICard
              title="Sales Orders"
              value={stats.totalOrders}
              icon={<ShoppingCartOutlined />}
              color="#faad14"
              trend={{ value: 5, isPositive: false }}
            />
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <KPICard
              title="Pending Orders"
              value={stats.pendingOrders}
              icon={<WarningOutlined />}
              color="#f5222d"
              trend={{ value: 3, isPositive: true }}
            />
          </Col>
        </Row>

        {/* Charts Row */}
        <Row gutter={[16, 16]} className="mb-6">
          <Col xs={24} lg={12}>
            <Card title="Daily Orders Trend" bordered={false}>
              <Line data={dailyOrdersData} options={{ responsive: true, maintainAspectRatio: true }} />
            </Card>
          </Col>
          <Col xs={24} lg={12}>
            <Card title="Receiving vs Shipping" bordered={false}>
              <Bar data={receivingShippingData} options={{ responsive: true, maintainAspectRatio: true }} />
            </Card>
          </Col>
        </Row>

        {/* Warehouse Utilization & Recent Orders */}
        <Row gutter={[16, 16]}>
          <Col xs={24} lg={8}>
            <Card title="Warehouse Utilization" bordered={false}>
              <Doughnut data={utilizationData} options={{ responsive: true, maintainAspectRatio: true }} />
              <div className="text-center mt-4">
                <div className="text-2xl font-bold">{((stats.totalInventory - stats.availableInventory) / stats.totalInventory * 100).toFixed(1)}%</div>
                <div className="text-gray-500">Space Used</div>
              </div>
            </Card>
          </Col>
          <Col xs={24} lg={16}>
            <Card
              title="Recent Sales Orders"
              bordered={false}
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
                size="small"
              />
            </Card>
          </Col>
        </Row>
      </div>
    </MainLayout>
  );
}
