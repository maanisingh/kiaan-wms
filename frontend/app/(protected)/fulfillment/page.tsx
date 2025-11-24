'use client';

import React, { useState } from 'react';

import { Table, Button, Tag, Tabs, Card, Space } from 'antd';
import { PlusOutlined, ShoppingCartOutlined, ClockCircleOutlined, TruckOutlined, CheckCircleOutlined, EyeOutlined } from '@ant-design/icons';
import { formatDate } from '@/lib/utils';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function FulfillmentPage() {
  const [activeTab, setActiveTab] = useState('pending');
  const router = useRouter();

  const mockOrders = [
    { id: '1', orderNumber: 'ORD-001', customer: 'Acme Corp', items: 5, status: 'pending', priority: 'high', orderDate: '2024-11-15', dueDate: '2024-11-20' },
    { id: '2', orderNumber: 'ORD-002', customer: 'Tech Start', items: 3, status: 'picking', priority: 'medium', orderDate: '2024-11-16', dueDate: '2024-11-21' },
    { id: '3', orderNumber: 'ORD-003', customer: 'Global Trade', items: 8, status: 'packing', priority: 'high', orderDate: '2024-11-14', dueDate: '2024-11-19' },
    { id: '4', orderNumber: 'ORD-004', customer: 'Tech Solutions', items: 12, status: 'shipped', priority: 'low', orderDate: '2024-11-12', dueDate: '2024-11-18' },
  ];

  const columns = [
    {
      title: 'Order #',
      dataIndex: 'orderNumber',
      key: 'orderNumber',
      width: 120,
      render: (text: string, record: any) => (
        <Link href={`/fulfillment/${record.id}`}>
          <span className="font-medium text-blue-600 cursor-pointer hover:underline">{text}</span>
        </Link>
      )
    },
    { title: 'Customer', dataIndex: 'customer', key: 'customer', width: 180 },
    { title: 'Items', dataIndex: 'items', key: 'items', width: 80 },
    { title: 'Priority', dataIndex: 'priority', key: 'priority', width: 100, render: (p: string) => <Tag color={p === 'high' ? 'red' : p === 'medium' ? 'orange' : 'blue'}>{p}</Tag> },
    { title: 'Order Date', dataIndex: 'orderDate', key: 'orderDate', width: 120, render: (d: string) => formatDate(d) },
    { title: 'Due Date', dataIndex: 'dueDate', key: 'dueDate', width: 120, render: (d: string) => formatDate(d) },
    { title: 'Status', dataIndex: 'status', key: 'status', width: 120, render: (s: string) => <Tag color="blue">{s}</Tag> },
    {
      title: 'Actions',
      key: 'actions',
      width: 120,
      render: (_: any, record: any) => (
        <Link href={`/fulfillment/${record.id}`}>
          <Button type="link" icon={<EyeOutlined />} size="small">View</Button>
        </Link>
      )
    },
  ];

  const tabItems = [
    { key: 'pending', label: <span className="flex items-center gap-2"><ClockCircleOutlined />Pending</span>, children: <Table dataSource={mockOrders.filter(o => o.status === 'pending')} columns={columns} rowKey="id" onRow={(record) => ({ onClick: () => router.push(`/fulfillment/${record.id}`), style: { cursor: 'pointer' } })} /> },
    { key: 'picking', label: <span className="flex items-center gap-2"><ShoppingCartOutlined />Picking</span>, children: <Table dataSource={mockOrders.filter(o => o.status === 'picking')} columns={columns} rowKey="id" onRow={(record) => ({ onClick: () => router.push(`/fulfillment/${record.id}`), style: { cursor: 'pointer' } })} /> },
    { key: 'packing', label: <span className="flex items-center gap-2"><ShoppingCartOutlined />Packing</span>, children: <Table dataSource={mockOrders.filter(o => o.status === 'packing')} columns={columns} rowKey="id" onRow={(record) => ({ onClick: () => router.push(`/fulfillment/${record.id}`), style: { cursor: 'pointer' } })} /> },
    { key: 'shipped', label: <span className="flex items-center gap-2"><TruckOutlined />Shipped</span>, children: <Table dataSource={mockOrders.filter(o => o.status === 'shipped')} columns={columns} rowKey="id" onRow={(record) => ({ onClick: () => router.push(`/fulfillment/${record.id}`), style: { cursor: 'pointer' } })} /> },
  ];

  return (
    <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Fulfillment Center</h1>
            <p className="text-gray-600 mt-1">Manage order fulfillment workflow</p>
          </div>
          <Button type="primary" icon={<PlusOutlined />} size="large">New Order</Button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card><div className="text-center"><p className="text-gray-500 text-sm">Pending</p><p className="text-3xl font-bold text-orange-600">24</p></div></Card>
          <Card><div className="text-center"><p className="text-gray-500 text-sm">In Progress</p><p className="text-3xl font-bold text-blue-600">18</p></div></Card>
          <Card><div className="text-center"><p className="text-gray-500 text-sm">Shipped Today</p><p className="text-3xl font-bold text-green-600">45</p></div></Card>
          <Card><div className="text-center"><p className="text-gray-500 text-sm">Fulfillment Rate</p><p className="text-3xl font-bold text-purple-600">98.5%</p></div></Card>
        </div>
        <Tabs activeKey={activeTab} onChange={setActiveTab} items={tabItems} size="large" className="bg-white rounded-lg shadow-sm p-4" />
      </div>
      );
}
