'use client';

import React, { useState, useEffect } from 'react';
import { Table, Button, Tag, Tabs, Card, Space, message } from 'antd';
import { PlusOutlined, ShoppingCartOutlined, ClockCircleOutlined, TruckOutlined, CheckCircleOutlined, EyeOutlined, ReloadOutlined } from '@ant-design/icons';
import { formatDate, getStatusColor } from '@/lib/utils';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import api from '@/services/api';

export default function FulfillmentPage() {
  const [activeTab, setActiveTab] = useState('pending');
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<any[]>([]);
  const [stats, setStats] = useState({ pending: 0, inProgress: 0, shippedToday: 0, fulfillmentRate: 0 });
  const router = useRouter();

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/sales-orders');
      const salesOrders = res.data || [];

      setOrders(salesOrders.map((o: any) => ({
        id: o.id,
        orderNumber: o.orderNumber,
        customer: o.customer?.name || 'N/A',
        items: o.items?.length || 0,
        status: o.status?.toLowerCase() || 'pending',
        priority: o.priority?.toLowerCase() || 'medium',
        orderDate: o.orderDate || o.createdAt,
        dueDate: o.requiredDate || o.orderDate,
        salesChannel: o.salesChannel,
        totalAmount: o.totalAmount
      })));

      // Calculate stats
      const pending = salesOrders.filter((o: any) => o.status === 'PENDING' || o.status === 'CONFIRMED').length;
      const picking = salesOrders.filter((o: any) => o.status === 'PICKING').length;
      const packing = salesOrders.filter((o: any) => o.status === 'PACKING').length;
      const inProgress = picking + packing;

      const today = new Date().toISOString().split('T')[0];
      const shippedToday = salesOrders.filter((o: any) =>
        (o.status === 'SHIPPED' || o.status === 'DELIVERED') &&
        o.shippedDate?.split('T')[0] === today
      ).length;

      const total = salesOrders.length;
      const fulfilled = salesOrders.filter((o: any) => o.status === 'DELIVERED' || o.status === 'SHIPPED').length;
      const rate = total > 0 ? ((fulfilled / total) * 100).toFixed(1) : 0;

      setStats({ pending, inProgress, shippedToday, fulfillmentRate: Number(rate) });

    } catch (error: any) {
      console.error('Error fetching fulfillment data:', error);
      message.error('Failed to load fulfillment data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const getStatusLabel = (status: string) => {
    const map: Record<string, string> = {
      'pending': 'Pending',
      'confirmed': 'Confirmed',
      'picking': 'Picking',
      'packing': 'Packing',
      'shipped': 'Shipped',
      'delivered': 'Delivered',
      'cancelled': 'Cancelled'
    };
    return map[status.toLowerCase()] || status;
  };

  const columns = [
    {
      title: 'Order #',
      dataIndex: 'orderNumber',
      key: 'orderNumber',
      width: 140,
      render: (text: string, record: any) => (
        <Link href={`/protected/sales-orders/${record.id}/edit`}>
          <span className="font-medium text-blue-600 cursor-pointer hover:underline">{text}</span>
        </Link>
      )
    },
    { title: 'Customer', dataIndex: 'customer', key: 'customer', width: 180 },
    { title: 'Channel', dataIndex: 'salesChannel', key: 'salesChannel', width: 150, render: (c: string) => c ? <Tag>{c}</Tag> : '-' },
    { title: 'Items', dataIndex: 'items', key: 'items', width: 80 },
    { title: 'Total', dataIndex: 'totalAmount', key: 'totalAmount', width: 100, render: (v: number) => v ? `£${v.toFixed(2)}` : '-' },
    { title: 'Priority', dataIndex: 'priority', key: 'priority', width: 100, render: (p: string) => <Tag color={p === 'high' ? 'red' : p === 'medium' ? 'orange' : 'blue'}>{p}</Tag> },
    { title: 'Order Date', dataIndex: 'orderDate', key: 'orderDate', width: 120, render: (d: string) => formatDate(d) },
    { title: 'Status', dataIndex: 'status', key: 'status', width: 120, render: (s: string) => <Tag color={getStatusColor(s)}>{getStatusLabel(s)}</Tag> },
    {
      title: 'Actions',
      key: 'actions',
      width: 150,
      render: (_: any, record: any) => (
        <Space>
          <Link href={`/protected/fulfillment/${record.id}`}>
            <Button type="link" icon={<EyeOutlined />} size="small">Fulfill</Button>
          </Link>
        </Space>
      )
    },
  ];

  const pendingOrders = orders.filter(o => o.status === 'pending' || o.status === 'confirmed');
  const pickingOrders = orders.filter(o => o.status === 'picking');
  const packingOrders = orders.filter(o => o.status === 'packing');
  const shippedOrders = orders.filter(o => o.status === 'shipped' || o.status === 'delivered');

  const tabItems = [
    {
      key: 'pending',
      label: <span className="flex items-center gap-2"><ClockCircleOutlined />Pending ({pendingOrders.length})</span>,
      children: <Table dataSource={pendingOrders} columns={columns} rowKey="id" loading={loading} pagination={{ pageSize: 20 }} />
    },
    {
      key: 'picking',
      label: <span className="flex items-center gap-2"><ShoppingCartOutlined />Picking ({pickingOrders.length})</span>,
      children: <Table dataSource={pickingOrders} columns={columns} rowKey="id" loading={loading} pagination={{ pageSize: 20 }} />
    },
    {
      key: 'packing',
      label: <span className="flex items-center gap-2"><ShoppingCartOutlined />Packing ({packingOrders.length})</span>,
      children: <Table dataSource={packingOrders} columns={columns} rowKey="id" loading={loading} pagination={{ pageSize: 20 }} />
    },
    {
      key: 'shipped',
      label: <span className="flex items-center gap-2"><TruckOutlined />Shipped ({shippedOrders.length})</span>,
      children: <Table dataSource={shippedOrders} columns={columns} rowKey="id" loading={loading} pagination={{ pageSize: 20 }} />
    },
  ];

  return (
    <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Fulfillment Center</h1>
            <p className="text-gray-600 mt-1">Manage order fulfillment workflow</p>
          </div>
          <Space>
            <Button icon={<ReloadOutlined />} onClick={fetchData} loading={loading}>Refresh</Button>
            <Link href="/protected/sales-orders/new">
              <Button type="primary" icon={<PlusOutlined />} size="large">New Order</Button>
            </Link>
          </Space>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card><div className="text-center"><p className="text-gray-500 text-sm">Pending</p><p className="text-3xl font-bold text-orange-600">{loading ? '...' : stats.pending}</p></div></Card>
          <Card><div className="text-center"><p className="text-gray-500 text-sm">In Progress</p><p className="text-3xl font-bold text-blue-600">{loading ? '...' : stats.inProgress}</p></div></Card>
          <Card><div className="text-center"><p className="text-gray-500 text-sm">Shipped Today</p><p className="text-3xl font-bold text-green-600">{loading ? '...' : stats.shippedToday}</p></div></Card>
          <Card><div className="text-center"><p className="text-gray-500 text-sm">Fulfillment Rate</p><p className="text-3xl font-bold text-purple-600">{loading ? '...' : `${stats.fulfillmentRate}%`}</p></div></Card>
        </div>
        <Tabs activeKey={activeTab} onChange={setActiveTab} items={tabItems} size="large" className="bg-white rounded-lg shadow-sm p-4" />
      </div>
      );
}
