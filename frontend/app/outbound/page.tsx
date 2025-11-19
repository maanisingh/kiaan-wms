'use client';

import React, { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Table, Button, Tag, Tabs, Card, Space } from 'antd';
import {
  PlusOutlined,
  ShoppingCartOutlined,
  InboxOutlined,
  TruckOutlined,
  CheckCircleOutlined,
  FileTextOutlined
} from '@ant-design/icons';
import { formatDate, getStatusColor } from '@/lib/utils';

export default function OutboundPage() {
  const [activeTab, setActiveTab] = useState('picking');

  const mockPickingData = [
    { id: 'PICK-001', orderNumber: 'SO-2024-001', customer: 'Acme Corp', items: 5, status: 'pending', priority: 'high', assignedTo: null, dueDate: '2024-11-20' },
    { id: 'PICK-002', orderNumber: 'SO-2024-002', customer: 'Tech Solutions', items: 3, status: 'in-progress', priority: 'medium', assignedTo: 'John Doe', dueDate: '2024-11-21' },
    { id: 'PICK-003', orderNumber: 'SO-2024-003', customer: 'Global Trade', items: 8, status: 'completed', priority: 'low', assignedTo: 'Jane Smith', dueDate: '2024-11-19' },
  ];

  const mockPackingData = [
    { id: 'PACK-001', orderNumber: 'SO-2024-001', customer: 'Acme Corp', items: 5, status: 'pending', packages: 0, assignedTo: null },
    { id: 'PACK-002', orderNumber: 'SO-2024-002', customer: 'Tech Solutions', items: 3, status: 'in-progress', packages: 1, assignedTo: 'Mike Johnson' },
    { id: 'PACK-003', orderNumber: 'SO-2024-003', customer: 'Global Trade', items: 8, status: 'completed', packages: 3, assignedTo: 'Sarah Lee' },
  ];

  const mockShippingData = [
    { id: 'SHIP-001', orderNumber: 'SO-2024-001', customer: 'Acme Corp', carrier: 'FedEx', trackingNumber: 'FX1234567890', status: 'pending', shipDate: null },
    { id: 'SHIP-002', orderNumber: 'SO-2024-002', customer: 'Tech Solutions', carrier: 'UPS', trackingNumber: 'UPS9876543210', status: 'shipped', shipDate: '2024-11-18' },
    { id: 'SHIP-003', orderNumber: 'SO-2024-003', customer: 'Global Trade', carrier: 'DHL', trackingNumber: 'DHL5555555555', status: 'delivered', shipDate: '2024-11-15' },
  ];

  const mockWaveData = [
    { id: 'WAVE-001', name: 'Morning Wave', orders: 15, items: 45, status: 'in-progress', startTime: '2024-11-17T08:00:00', completedOrders: 8 },
    { id: 'WAVE-002', name: 'Afternoon Wave', orders: 22, items: 67, status: 'pending', startTime: '2024-11-17T14:00:00', completedOrders: 0 },
    { id: 'WAVE-003', name: 'Express Wave', orders: 10, items: 28, status: 'completed', startTime: '2024-11-17T10:00:00', completedOrders: 10 },
  ];

  const pickingColumns = [
    { title: 'Pick ID', dataIndex: 'id', key: 'id', width: 120 },
    { title: 'Order Number', dataIndex: 'orderNumber', key: 'orderNumber', width: 150 },
    { title: 'Customer', dataIndex: 'customer', key: 'customer', width: 200 },
    { title: 'Items', dataIndex: 'items', key: 'items', width: 80 },
    { title: 'Priority', dataIndex: 'priority', key: 'priority', width: 100, render: (priority: string) => <Tag color={priority === 'high' ? 'red' : priority === 'medium' ? 'orange' : 'blue'}>{priority}</Tag> },
    { title: 'Assigned To', dataIndex: 'assignedTo', key: 'assignedTo', width: 150, render: (user: string) => user || '-' },
    { title: 'Due Date', dataIndex: 'dueDate', key: 'dueDate', width: 120, render: (date: string) => formatDate(date) },
    { title: 'Status', dataIndex: 'status', key: 'status', width: 120, render: (status: string) => <Tag color={getStatusColor(status)}>{status}</Tag> },
    { title: 'Actions', key: 'actions', width: 150, render: () => <Space><Button type="link" size="small">Assign</Button><Button type="link" size="small">View</Button></Space> },
  ];

  const packingColumns = [
    { title: 'Pack ID', dataIndex: 'id', key: 'id', width: 120 },
    { title: 'Order Number', dataIndex: 'orderNumber', key: 'orderNumber', width: 150 },
    { title: 'Customer', dataIndex: 'customer', key: 'customer', width: 200 },
    { title: 'Items', dataIndex: 'items', key: 'items', width: 80 },
    { title: 'Packages', dataIndex: 'packages', key: 'packages', width: 100 },
    { title: 'Assigned To', dataIndex: 'assignedTo', key: 'assignedTo', width: 150, render: (user: string) => user || '-' },
    { title: 'Status', dataIndex: 'status', key: 'status', width: 120, render: (status: string) => <Tag color={getStatusColor(status)}>{status}</Tag> },
    { title: 'Actions', key: 'actions', width: 150, render: () => <Space><Button type="link" size="small">Pack</Button><Button type="link" size="small">Print Label</Button></Space> },
  ];

  const shippingColumns = [
    { title: 'Shipment ID', dataIndex: 'id', key: 'id', width: 120 },
    { title: 'Order Number', dataIndex: 'orderNumber', key: 'orderNumber', width: 150 },
    { title: 'Customer', dataIndex: 'customer', key: 'customer', width: 200 },
    { title: 'Carrier', dataIndex: 'carrier', key: 'carrier', width: 100 },
    { title: 'Tracking Number', dataIndex: 'trackingNumber', key: 'tracking', width: 180 },
    { title: 'Ship Date', dataIndex: 'shipDate', key: 'shipDate', width: 120, render: (date: string) => date ? formatDate(date) : '-' },
    { title: 'Status', dataIndex: 'status', key: 'status', width: 120, render: (status: string) => <Tag color={getStatusColor(status)}>{status}</Tag> },
    { title: 'Actions', key: 'actions', width: 150, render: () => <Space><Button type="link" size="small">Track</Button><Button type="link" size="small">Manifest</Button></Space> },
  ];

  const waveColumns = [
    { title: 'Wave ID', dataIndex: 'id', key: 'id', width: 120 },
    { title: 'Wave Name', dataIndex: 'name', key: 'name', width: 180 },
    { title: 'Orders', dataIndex: 'orders', key: 'orders', width: 80 },
    { title: 'Items', dataIndex: 'items', key: 'items', width: 80 },
    { title: 'Completed', dataIndex: 'completedOrders', key: 'completed', width: 120, render: (completed: number, record: any) => `${completed}/${record.orders}` },
    { title: 'Start Time', dataIndex: 'startTime', key: 'startTime', width: 180, render: (date: string) => formatDate(date) },
    { title: 'Status', dataIndex: 'status', key: 'status', width: 120, render: (status: string) => <Tag color={getStatusColor(status)}>{status}</Tag> },
    { title: 'Actions', key: 'actions', width: 150, render: () => <Space><Button type="link" size="small">View</Button><Button type="link" size="small">Release</Button></Space> },
  ];

  const tabItems = [
    {
      key: 'picking',
      label: <span className="flex items-center gap-2"><ShoppingCartOutlined />Picking</span>,
      children: (
        <div className="bg-white rounded-lg shadow-sm">
          <Table dataSource={mockPickingData} columns={pickingColumns} rowKey="id" scroll={{ x: 1200 }} pagination={{ pageSize: 20 }} />
        </div>
      ),
    },
    {
      key: 'packing',
      label: <span className="flex items-center gap-2"><InboxOutlined />Packing</span>,
      children: (
        <div className="bg-white rounded-lg shadow-sm">
          <Table dataSource={mockPackingData} columns={packingColumns} rowKey="id" scroll={{ x: 1200 }} pagination={{ pageSize: 20 }} />
        </div>
      ),
    },
    {
      key: 'shipping',
      label: <span className="flex items-center gap-2"><TruckOutlined />Shipping</span>,
      children: (
        <div className="bg-white rounded-lg shadow-sm">
          <Table dataSource={mockShippingData} columns={shippingColumns} rowKey="id" scroll={{ x: 1200 }} pagination={{ pageSize: 20 }} />
        </div>
      ),
    },
    {
      key: 'waves',
      label: <span className="flex items-center gap-2"><FileTextOutlined />Wave Picking</span>,
      children: (
        <div className="bg-white rounded-lg shadow-sm">
          <Table dataSource={mockWaveData} columns={waveColumns} rowKey="id" scroll={{ x: 1200 }} pagination={{ pageSize: 20 }} />
        </div>
      ),
    },
  ];

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Outbound Operations</h1>
            <p className="text-gray-600 mt-1">Manage picking, packing, and shipping</p>
          </div>
          <Button type="primary" icon={<PlusOutlined />} size="large">
            Create Wave
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <div className="text-center">
              <p className="text-gray-500 text-sm">Picking Pending</p>
              <p className="text-3xl font-bold text-blue-600">18</p>
            </div>
          </Card>
          <Card>
            <div className="text-center">
              <p className="text-gray-500 text-sm">Packing In Progress</p>
              <p className="text-3xl font-bold text-orange-600">12</p>
            </div>
          </Card>
          <Card>
            <div className="text-center">
              <p className="text-gray-500 text-sm">Ready to Ship</p>
              <p className="text-3xl font-bold text-green-600">25</p>
            </div>
          </Card>
          <Card>
            <div className="text-center">
              <p className="text-gray-500 text-sm">Shipped Today</p>
              <p className="text-3xl font-bold text-purple-600">45</p>
            </div>
          </Card>
        </div>

        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={tabItems}
          size="large"
          className="bg-white rounded-lg shadow-sm p-4"
        />
      </div>
    </MainLayout>
  );
}
