'use client';

import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Statistic, Table, Tag, Button, DatePicker, Space, Alert, Avatar, List, Timeline, Progress } from 'antd';
import {
  DatabaseOutlined,
  ShoppingCartOutlined,
  InboxOutlined,
  WarningOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  PlusOutlined,
  EyeOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  ExclamationCircleOutlined,
  UserOutlined,
  ShopOutlined,
  CarOutlined,
  BoxPlotOutlined,
} from '@ant-design/icons';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, AreaChart, Area, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useAuthStore } from '@/store/authStore';
import Link from 'next/link';
import dayjs from 'dayjs';

const { RangePicker } = DatePicker;

export default function DashboardPage() {
  const { user } = useAuthStore();
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs]>([
    dayjs().subtract(30, 'days'),
    dayjs(),
  ]);
  const [loading, setLoading] = useState(false);

  // Real data from API
  const [dashboardData, setDashboardData] = useState({
    kpis: {
      totalStock: { value: 0, change: 0, trend: 'stable' },
      lowStockItems: { value: 0, change: 0, trend: 'stable' },
      pendingOrders: { value: 0, change: 0, trend: 'stable' },
      activePickLists: { value: 0, change: 0, trend: 'stable' },
      warehouseUtilization: { value: 0, change: 0, trend: 'stable' },
      ordersToday: { value: 0, change: 0, trend: 'stable' },
    },
    salesTrend: [] as { date: string; orders: number; revenue: number }[],
    topProducts: [] as { name: string; sold: number; revenue: number }[],
    ordersByStatus: [] as { status: string; count: number; color: string }[],
    recentOrders: [] as { id: number; orderNumber: string; customer: string; items: number; total: number; status: string; date: string }[],
    lowStockAlerts: [] as { id: number; sku: string; name: string; current: number; reorderPoint: number; status: string }[],
    recentActivity: [] as { id: number; action: string; user: string; entity: string; time: string; icon: React.ReactNode; color: string }[],
  });

  // Fetch dashboard data from API
  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem('auth-storage');
        const authData = token ? JSON.parse(token) : null;
        const authToken = authData?.state?.token;

        if (!authToken) return;

        const headers = { 'Authorization': `Bearer ${authToken}` };
        const API = process.env.NEXT_PUBLIC_API_URL || 'https://serene-adaptation-production-c6d3.up.railway.app/api';

        // Fetch stats
        const statsRes = await fetch(`${API}/dashboard/stats`, { headers });
        if (statsRes.ok) {
          const stats = await statsRes.json();
          setDashboardData(prev => ({
            ...prev,
            kpis: stats.kpis || prev.kpis,
          }));
        }

        // Fetch recent orders
        const ordersRes = await fetch(`${API}/dashboard/recent-orders?limit=5`, { headers });
        if (ordersRes.ok) {
          const orders = await ordersRes.json();
          setDashboardData(prev => ({
            ...prev,
            recentOrders: orders.map((o: any, i: number) => ({
              id: i + 1,
              orderNumber: o.orderNumber,
              customer: o.customer?.name || 'N/A',
              items: o.items?.length || 0,
              total: o.totalAmount || 0,
              status: o.status?.toLowerCase() || 'pending',
              date: o.createdAt,
            })),
          }));
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'orange',
      picking: 'blue',
      packing: 'cyan',
      shipped: 'purple',
      delivered: 'green',
      critical: 'red',
      warning: 'orange',
      low: 'gold',
    };
    return colors[status.toLowerCase()] || 'default';
  };

  const quickActions = [
    { title: 'Create Order', icon: <PlusOutlined />, href: '/sales-orders/new', color: '#1890ff' },
    { title: 'Receive Goods', icon: <InboxOutlined />, href: '/goods-receiving/new', color: '#52c41a' },
    { title: 'Create Transfer', icon: <CarOutlined />, href: '/transfers/new', color: '#722ed1' },
    { title: 'Add Product', icon: <BoxPlotOutlined />, href: '/products/new', color: '#faad14' },
  ];

  const orderColumns = [
    {
      title: 'Order #',
      dataIndex: 'orderNumber',
      key: 'orderNumber',
      render: (text: string) => <a className="text-blue-600 hover:text-blue-800">{text}</a>,
    },
    {
      title: 'Customer',
      dataIndex: 'customer',
      key: 'customer',
    },
    {
      title: 'Items',
      dataIndex: 'items',
      key: 'items',
    },
    {
      title: 'Total',
      dataIndex: 'total',
      key: 'total',
      render: (value: number) => `$${value.toLocaleString()}`,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => <Tag color={getStatusColor(status)}>{status.toUpperCase()}</Tag>,
    },
    {
      title: 'Date',
      dataIndex: 'date',
      key: 'date',
      render: (date: string) => dayjs(date).format('MMM DD, YYYY'),
    },
  ];

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="mb-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-gray-600 mt-1">Welcome back, {user?.name || 'User'}!</p>
          </div>
          <Space>
            <RangePicker
              value={dateRange}
              onChange={(dates) => dates && setDateRange([dates[0]!, dates[1]!])}
              format="MMM DD, YYYY"
            />
            <Button type="primary" icon={<PlusOutlined />}>Quick Add</Button>
          </Space>
        </div>
      </div>

      {/* KPI Cards */}
      <Row gutter={[16, 16]} className="mb-6">
        <Col xs={24} sm={12} lg={8}>
          <Card>
            <Statistic
              title="Total Stock"
              value={dashboardData.kpis.totalStock.value}
              prefix={<DatabaseOutlined className="text-blue-600" />}
              suffix={
                <span className={`text-sm ${dashboardData.kpis.totalStock.trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
                  {dashboardData.kpis.totalStock.trend === 'up' ? <ArrowUpOutlined /> : <ArrowDownOutlined />}
                  {Math.abs(dashboardData.kpis.totalStock.change)}%
                </span>
              }
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={8}>
          <Card>
            <Statistic
              title="Low Stock Items"
              value={dashboardData.kpis.lowStockItems.value}
              prefix={<WarningOutlined className="text-orange-600" />}
              suffix={
                <span className="text-sm text-green-600">
                  <ArrowDownOutlined /> {Math.abs(dashboardData.kpis.lowStockItems.change)}%
                </span>
              }
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={8}>
          <Card>
            <Statistic
              title="Pending Orders"
              value={dashboardData.kpis.pendingOrders.value}
              prefix={<ShoppingCartOutlined className="text-purple-600" />}
              suffix={
                <span className="text-sm text-green-600">
                  <ArrowUpOutlined /> {dashboardData.kpis.pendingOrders.change}%
                </span>
              }
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={8}>
          <Card>
            <Statistic
              title="Active Pick Lists"
              value={dashboardData.kpis.activePickLists.value}
              prefix={<BoxPlotOutlined className="text-green-600" />}
              suffix={
                <span className="text-sm text-green-600">
                  <ArrowDownOutlined /> {Math.abs(dashboardData.kpis.activePickLists.change)}%
                </span>
              }
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={8}>
          <Card>
            <Statistic
              title="Warehouse Utilization"
              value={dashboardData.kpis.warehouseUtilization.value}
              prefix={<ShopOutlined className="text-cyan-600" />}
              suffix="%"
            />
            <Progress percent={dashboardData.kpis.warehouseUtilization.value} size="small" className="mt-2" />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={8}>
          <Card>
            <Statistic
              title="Orders Today"
              value={dashboardData.kpis.ordersToday.value}
              prefix={<ClockCircleOutlined className="text-blue-600" />}
              suffix={
                <span className="text-sm text-green-600">
                  <ArrowUpOutlined /> {dashboardData.kpis.ordersToday.change}%
                </span>
              }
            />
          </Card>
        </Col>
      </Row>

      {/* Quick Actions */}
      <Card title="Quick Actions" className="mb-6">
        <Row gutter={[16, 16]}>
          {quickActions.map((action, index) => (
            <Col xs={12} sm={6} key={index}>
              <Link href={action.href}>
                <Card
                  hoverable
                  className="text-center"
                  bodyStyle={{ padding: '24px 12px' }}
                >
                  <div style={{ fontSize: 32, color: action.color, marginBottom: 8 }}>
                    {action.icon}
                  </div>
                  <div className="font-medium">{action.title}</div>
                </Card>
              </Link>
            </Col>
          ))}
        </Row>
      </Card>

      {/* Charts Row */}
      <Row gutter={[16, 16]} className="mb-6">
        <Col xs={24} lg={12}>
          <Card title="Sales Trend (Last 7 Days)" extra={<Button type="link">View Report</Button>}>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={dashboardData.salesTrend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip />
                <Legend />
                <Area yAxisId="left" type="monotone" dataKey="orders" stroke="#1890ff" fill="#1890ff" fillOpacity={0.3} name="Orders" />
                <Area yAxisId="right" type="monotone" dataKey="revenue" stroke="#52c41a" fill="#52c41a" fillOpacity={0.3} name="Revenue ($)" />
              </AreaChart>
            </ResponsiveContainer>
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Card title="Top Products (Units Sold)" extra={<Button type="link">View All</Button>}>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={dashboardData.topProducts}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="sold" fill="#1890ff" name="Units Sold" />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </Col>
      </Row>

      {/* Orders by Status and Recent Activity */}
      <Row gutter={[16, 16]} className="mb-6">
        <Col xs={24} lg={8}>
          <Card title="Orders by Status">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={dashboardData.ordersByStatus}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(entry) => `${entry.status}: ${entry.count}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="count"
                >
                  {dashboardData.ordersByStatus.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </Card>
        </Col>

        <Col xs={24} lg={16}>
          <Card title="Recent Activity" extra={<Button type="link">View All</Button>}>
            <Timeline
              items={dashboardData.recentActivity.map((activity) => ({
                dot: <Avatar icon={activity.icon} style={{ backgroundColor: activity.color }} size="small" />,
                children: (
                  <div>
                    <div className="font-medium">{activity.action}</div>
                    <div className="text-sm text-gray-600">
                      {activity.user} • {activity.entity} • {activity.time}
                    </div>
                  </div>
                ),
              }))}
            />
          </Card>
        </Col>
      </Row>

      {/* Low Stock Alerts */}
      <Row gutter={[16, 16]} className="mb-6">
        <Col xs={24} lg={12}>
          <Card title={<><WarningOutlined className="text-orange-600 mr-2" />Low Stock Alerts</>} extra={<Button type="link">View All</Button>}>
            <List
              dataSource={dashboardData.lowStockAlerts}
              renderItem={(item) => (
                <List.Item
                  actions={[<Button type="link" key="reorder">Reorder</Button>]}
                >
                  <List.Item.Meta
                    title={<span>{item.name} <Tag color={getStatusColor(item.status)}>{item.status.toUpperCase()}</Tag></span>}
                    description={`SKU: ${item.sku} • Current: ${item.current} • Reorder Point: ${item.reorderPoint}`}
                  />
                </List.Item>
              )}
            />
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Card title="Recent Orders" extra={<Button type="link">View All</Button>}>
            <Table
              dataSource={dashboardData.recentOrders}
              columns={orderColumns}
              pagination={false}
              size="small"
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
}
