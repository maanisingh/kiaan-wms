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
  const { user, token } = useAuthStore();
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs]>([
    dayjs().subtract(30, 'days'),
    dayjs(),
  ]);
  const [loading, setLoading] = useState(false);

  // Demo data for when backend is not available or using demo mode
  const demoData = {
    kpis: {
      totalStock: { value: 15420, change: 5, trend: 'up' },
      lowStockItems: { value: 23, change: -2, trend: 'down' },
      pendingOrders: { value: 147, change: 12, trend: 'up' },
      activePickLists: { value: 12, change: -3, trend: 'down' },
      warehouseUtilization: { value: 78, change: 2, trend: 'stable' },
      ordersToday: { value: 34, change: 8, trend: 'up' },
    },
    salesTrend: [
      { date: 'Mon', orders: 45, revenue: 12500 },
      { date: 'Tue', orders: 52, revenue: 15200 },
      { date: 'Wed', orders: 38, revenue: 9800 },
      { date: 'Thu', orders: 61, revenue: 18400 },
      { date: 'Fri', orders: 55, revenue: 16300 },
      { date: 'Sat', orders: 32, revenue: 8900 },
      { date: 'Sun', orders: 28, revenue: 7200 },
    ],
    topProducts: [
      { name: 'Widget Pro X', sold: 234, revenue: 11700 },
      { name: 'Smart Gadget', sold: 189, revenue: 9450 },
      { name: 'Power Cable 2m', sold: 156, revenue: 1560 },
      { name: 'USB Hub 7-Port', sold: 134, revenue: 4020 },
      { name: 'Wireless Mouse', sold: 98, revenue: 2940 },
    ],
    ordersByStatus: [
      { status: 'PENDING', count: 45, color: '#faad14' },
      { status: 'PROCESSING', count: 32, color: '#722ed1' },
      { status: 'PICKING', count: 28, color: '#13c2c2' },
      { status: 'PACKING', count: 18, color: '#eb2f96' },
      { status: 'SHIPPED', count: 156, color: '#52c41a' },
    ],
    recentOrders: [
      { id: 1, orderNumber: 'ORD-2024-001', customer: 'Tech Solutions Ltd', items: 5, total: 1250, status: 'pending', date: new Date().toISOString() },
      { id: 2, orderNumber: 'ORD-2024-002', customer: 'Global Imports Co', items: 12, total: 3400, status: 'picking', date: new Date().toISOString() },
      { id: 3, orderNumber: 'ORD-2024-003', customer: 'Retail Express', items: 3, total: 890, status: 'shipped', date: new Date().toISOString() },
    ],
    lowStockAlerts: [
      { id: 1, sku: 'SKU-001', name: 'Widget Pro X', current: 5, reorderPoint: 20, status: 'critical' },
      { id: 2, sku: 'SKU-002', name: 'Smart Gadget', current: 12, reorderPoint: 15, status: 'warning' },
      { id: 3, sku: 'SKU-003', name: 'Power Cable 2m', current: 8, reorderPoint: 10, status: 'low' },
    ],
    recentActivity: [] as { id: number; action: string; user: string; entity: string; time: string; icon: React.ReactNode; color: string }[],
  };

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

  // Fetch dashboard data from real API endpoints
  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);

      // If using demo token, use demo data
      if (!token || token.startsWith('demo_token_')) {
        setDashboardData({
          ...demoData,
          recentActivity: [
            { id: 1, action: 'Dashboard loaded (Demo Mode)', user: user?.name || 'Demo User', entity: 'Dashboard', time: 'Just now', icon: <CheckCircleOutlined />, color: '#52c41a' },
          ],
        });
        setLoading(false);
        return;
      }

      try {
        const headers = { 'Authorization': `Bearer ${token}` };
        const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8056/api';

        // Fetch real data from multiple endpoints
        const [productsRes, ordersRes, inventoryRes, pickingRes, warehousesRes] = await Promise.allSettled([
          fetch(`${API}/products`, { headers }),
          fetch(`${API}/orders`, { headers }),
          fetch(`${API}/inventory`, { headers }),
          fetch(`${API}/picking`, { headers }),
          fetch(`${API}/warehouses`, { headers }),
        ]);

        let products: any[] = [];
        let orders: any[] = [];
        let inventory: any[] = [];
        let pickLists: any[] = [];
        let warehouses: any[] = [];

        if (productsRes.status === 'fulfilled' && productsRes.value.ok) {
          products = await productsRes.value.json();
          products = Array.isArray(products) ? products : [];
        }

        if (ordersRes.status === 'fulfilled' && ordersRes.value.ok) {
          orders = await ordersRes.value.json();
          orders = Array.isArray(orders) ? orders : [];
        }

        if (inventoryRes.status === 'fulfilled' && inventoryRes.value.ok) {
          inventory = await inventoryRes.value.json();
          inventory = Array.isArray(inventory) ? inventory : [];
        }

        if (pickingRes.status === 'fulfilled' && pickingRes.value.ok) {
          pickLists = await pickingRes.value.json();
          pickLists = Array.isArray(pickLists) ? pickLists : [];
        }

        if (warehousesRes.status === 'fulfilled' && warehousesRes.value.ok) {
          warehouses = await warehousesRes.value.json();
          warehouses = Array.isArray(warehouses) ? warehouses : [];
        }

        // Calculate real KPIs
        const totalStock = inventory.reduce((sum, inv) => sum + (inv.quantity || 0), 0);
        const lowStockItems = inventory.filter((inv) => (inv.quantity || 0) < (inv.reorderPoint || 10)).length;
        const pendingOrders = orders.filter((o) => ['PENDING', 'CONFIRMED', 'PROCESSING'].includes(o.status?.toUpperCase())).length;
        const activePickLists = pickLists.filter((p) => ['PENDING', 'IN_PROGRESS', 'PARTIAL'].includes(p.status?.toUpperCase())).length;
        const todayOrders = orders.filter((o) => {
          const orderDate = new Date(o.createdAt);
          const today = new Date();
          return orderDate.toDateString() === today.toDateString();
        }).length;

        // Calculate warehouse utilization (simplified)
        const warehouseUtilization = warehouses.length > 0 ? Math.min(85, Math.round((inventory.length / (warehouses.length * 100)) * 100)) : 0;

        // Get recent orders (last 5)
        const recentOrders = orders
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
          .slice(0, 5)
          .map((o: any, i: number) => ({
            id: i + 1,
            orderNumber: o.orderNumber || `ORD-${o.id?.slice(0, 8)}`,
            customer: o.client?.name || o.customer?.name || 'Walk-in Customer',
            items: o.items?.length || o._count?.items || 0,
            total: o.totalAmount || o.total || 0,
            status: o.status?.toLowerCase() || 'pending',
            date: o.createdAt,
          }));

        // Get low stock alerts
        const lowStockAlerts = inventory
          .filter((inv) => (inv.quantity || 0) < (inv.reorderPoint || 10))
          .slice(0, 5)
          .map((inv: any, i: number) => ({
            id: i + 1,
            sku: inv.product?.sku || inv.productId?.slice(0, 8),
            name: inv.product?.name || 'Unknown Product',
            current: inv.quantity || 0,
            reorderPoint: inv.reorderPoint || 10,
            status: (inv.quantity || 0) === 0 ? 'critical' : (inv.quantity || 0) < 5 ? 'warning' : 'low',
          }));

        // Orders by status for pie chart
        const statusCounts: Record<string, number> = {};
        orders.forEach((o) => {
          const status = o.status?.toUpperCase() || 'PENDING';
          statusCounts[status] = (statusCounts[status] || 0) + 1;
        });

        const statusColors: Record<string, string> = {
          PENDING: '#faad14',
          CONFIRMED: '#1890ff',
          PROCESSING: '#722ed1',
          PICKING: '#13c2c2',
          PACKING: '#eb2f96',
          SHIPPED: '#52c41a',
          DELIVERED: '#389e0d',
          CANCELLED: '#f5222d',
        };

        const ordersByStatus = Object.entries(statusCounts).map(([status, count]) => ({
          status,
          count,
          color: statusColors[status] || '#8c8c8c',
        }));

        // Sales trend (last 7 days)
        const last7Days: { date: string; orders: number; revenue: number }[] = [];
        for (let i = 6; i >= 0; i--) {
          const date = new Date();
          date.setDate(date.getDate() - i);
          const dateStr = date.toISOString().split('T')[0];
          const dayOrders = orders.filter((o) => o.createdAt?.startsWith(dateStr));
          last7Days.push({
            date: date.toLocaleDateString('en-US', { weekday: 'short' }),
            orders: dayOrders.length,
            revenue: dayOrders.reduce((sum, o) => sum + (o.totalAmount || o.total || 0), 0),
          });
        }

        // Top products by orders
        const productCounts: Record<string, { name: string; sold: number; revenue: number }> = {};
        orders.forEach((order) => {
          order.items?.forEach((item: any) => {
            const name = item.product?.name || item.productName || 'Unknown';
            if (!productCounts[name]) {
              productCounts[name] = { name, sold: 0, revenue: 0 };
            }
            productCounts[name].sold += item.quantity || 1;
            productCounts[name].revenue += (item.price || 0) * (item.quantity || 1);
          });
        });

        const topProducts = Object.values(productCounts)
          .sort((a, b) => b.sold - a.sold)
          .slice(0, 5);

        setDashboardData({
          kpis: {
            totalStock: { value: totalStock, change: 5, trend: 'up' },
            lowStockItems: { value: lowStockItems, change: -2, trend: 'down' },
            pendingOrders: { value: pendingOrders, change: 12, trend: 'up' },
            activePickLists: { value: activePickLists, change: -3, trend: 'down' },
            warehouseUtilization: { value: warehouseUtilization, change: 2, trend: 'stable' },
            ordersToday: { value: todayOrders, change: 8, trend: 'up' },
          },
          salesTrend: last7Days,
          topProducts: topProducts.length > 0 ? topProducts : [
            { name: 'No data', sold: 0, revenue: 0 },
          ],
          ordersByStatus: ordersByStatus.length > 0 ? ordersByStatus : [
            { status: 'No Orders', count: 0, color: '#8c8c8c' },
          ],
          recentOrders,
          lowStockAlerts,
          recentActivity: [
            { id: 1, action: 'Dashboard loaded', user: user?.name || 'System', entity: 'Dashboard', time: 'Just now', icon: <CheckCircleOutlined />, color: '#52c41a' },
          ],
        });

      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        // Fallback to demo data on error
        setDashboardData({
          ...demoData,
          recentActivity: [
            { id: 1, action: 'Using demo data (API unavailable)', user: user?.name || 'System', entity: 'Dashboard', time: 'Just now', icon: <CheckCircleOutlined />, color: '#faad14' },
          ],
        });
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [user?.name, token]);

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
