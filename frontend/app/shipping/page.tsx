'use client';

import React, { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Table, Button, Tag, Tabs, Card } from 'antd';
import { PlusOutlined, TruckOutlined, ClockCircleOutlined, CheckCircleOutlined, GlobalOutlined, EyeOutlined } from '@ant-design/icons';
import { formatDate } from '@/lib/utils';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function ShippingPage() {
  const [activeTab, setActiveTab] = useState('pending');
  const router = useRouter();

  const mockShipments = [
    { id: '1', shipmentNumber: 'SHP-001', carrier: 'FedEx', tracking: 'FX123456789', status: 'pending', destination: 'New York, NY', shipDate: null },
    { id: '2', shipmentNumber: 'SHP-002', carrier: 'UPS', tracking: 'UPS987654321', status: 'in-transit', destination: 'Los Angeles, CA', shipDate: '2024-11-15' },
    { id: '3', shipmentNumber: 'SHP-003', carrier: 'DHL', tracking: 'DHL555555555', status: 'delivered', destination: 'San Francisco, CA', shipDate: '2024-11-10' },
  ];

  const columns = [
    {
      title: 'Shipment #',
      dataIndex: 'shipmentNumber',
      key: 'shipmentNumber',
      width: 130,
      render: (text: string, record: any) => (
        <Link href={`/shipping/${record.id}`}>
          <span className="font-medium text-blue-600 cursor-pointer hover:underline">{text}</span>
        </Link>
      )
    },
    { title: 'Carrier', dataIndex: 'carrier', key: 'carrier', width: 100 },
    { title: 'Tracking #', dataIndex: 'tracking', key: 'tracking', width: 180 },
    { title: 'Destination', dataIndex: 'destination', key: 'destination', width: 200 },
    { title: 'Ship Date', dataIndex: 'shipDate', key: 'shipDate', width: 120, render: (d: string) => d ? formatDate(d) : '-' },
    { title: 'Status', dataIndex: 'status', key: 'status', width: 120, render: (s: string) => <Tag color={s === 'delivered' ? 'green' : s === 'in-transit' ? 'blue' : 'orange'}>{s}</Tag> },
    {
      title: 'Actions',
      key: 'actions',
      width: 120,
      render: (_: any, record: any) => (
        <Link href={`/shipping/${record.id}`}>
          <Button type="link" icon={<EyeOutlined />} size="small">View</Button>
        </Link>
      ),
    },
  ];

  const tabItems = [
    { key: 'pending', label: <span className="flex items-center gap-2"><ClockCircleOutlined />Pending</span>, children: <Table dataSource={mockShipments.filter(s => s.status === 'pending')} columns={columns} rowKey="id" onRow={(record) => ({ onClick: () => router.push(`/shipping/${record.id}`), style: { cursor: 'pointer' } })} /> },
    { key: 'in-transit', label: <span className="flex items-center gap-2"><TruckOutlined />In Transit</span>, children: <Table dataSource={mockShipments.filter(s => s.status === 'in-transit')} columns={columns} rowKey="id" onRow={(record) => ({ onClick: () => router.push(`/shipping/${record.id}`), style: { cursor: 'pointer' } })} /> },
    { key: 'delivered', label: <span className="flex items-center gap-2"><CheckCircleOutlined />Delivered</span>, children: <Table dataSource={mockShipments.filter(s => s.status === 'delivered')} columns={columns} rowKey="id" onRow={(record) => ({ onClick: () => router.push(`/shipping/${record.id}`), style: { cursor: 'pointer' } })} /> },
    { key: 'international', label: <span className="flex items-center gap-2"><GlobalOutlined />International</span>, children: <Table dataSource={[]} columns={columns} rowKey="id" onRow={(record) => ({ onClick: () => router.push(`/shipping/${record.id}`), style: { cursor: 'pointer' } })} /> },
  ];

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Shipping Management</h1>
            <p className="text-gray-600 mt-1">Track and manage shipments</p>
          </div>
          <Button type="primary" icon={<PlusOutlined />} size="large">Create Shipment</Button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card><div className="text-center"><p className="text-gray-500 text-sm">Pending</p><p className="text-3xl font-bold text-orange-600">12</p></div></Card>
          <Card><div className="text-center"><p className="text-gray-500 text-sm">In Transit</p><p className="text-3xl font-bold text-blue-600">45</p></div></Card>
          <Card><div className="text-center"><p className="text-gray-500 text-sm">Delivered Today</p><p className="text-3xl font-bold text-green-600">78</p></div></Card>
          <Card><div className="text-center"><p className="text-gray-500 text-sm">On-Time Rate</p><p className="text-3xl font-bold text-purple-600">99.2%</p></div></Card>
        </div>
        <Tabs activeKey={activeTab} onChange={setActiveTab} items={tabItems} size="large" className="bg-white rounded-lg shadow-sm p-4" />
      </div>
    </MainLayout>
  );
}
