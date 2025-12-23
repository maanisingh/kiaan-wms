'use client';

import React, { useState, useEffect } from 'react';
import { Table, Button, Tag, Tabs, Card, Space, Spin, message } from 'antd';
import {
  PlusOutlined,
  ShoppingCartOutlined,
  InboxOutlined,
  TruckOutlined,
  CheckCircleOutlined,
  FileTextOutlined,
  ReloadOutlined
} from '@ant-design/icons';
import { formatDate, getStatusColor } from '@/lib/utils';
import api from '@/services/api';

export default function OutboundPage() {
  const [activeTab, setActiveTab] = useState('picking');
  const [loading, setLoading] = useState(true);
  const [pickingData, setPickingData] = useState([]);
  const [packingData, setPackingData] = useState([]);
  const [shippingData, setShippingData] = useState([]);
  const [stats, setStats] = useState({ pickingPending: 0, packingInProgress: 0, readyToShip: 0, shippedToday: 0 });

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch pick lists
      const pickListRes = await api.get('/api/pick-lists');
      const pickLists = pickListRes.data || [];
      setPickingData(pickLists.map((pl: any) => ({
        id: pl.id,
        orderNumber: pl.order?.orderNumber || pl.pickListNumber || '-',
        customer: pl.order?.customer?.name || 'N/A',
        items: pl.items?.length || 0,
        status: pl.status?.toLowerCase() || 'pending',
        priority: pl.priority?.toLowerCase() || 'medium',
        assignedTo: pl.assignedUser?.name || null,
        dueDate: pl.dueDate || pl.createdAt
      })));

      // Fetch packing tasks
      const packingRes = await api.get('/api/packing');
      const packingTasks = packingRes.data || [];
      setPackingData(packingTasks.map((pt: any) => ({
        id: pt.id,
        orderNumber: pt.order?.orderNumber || '-',
        customer: pt.order?.customer?.name || 'N/A',
        items: pt.itemsCount || pt.order?.items?.length || 0,
        status: pt.status?.toLowerCase() || 'pending',
        packages: pt.packagesCount || 0,
        assignedTo: pt.assignedUser?.name || null
      })));

      // Fetch shipments
      const shipmentsRes = await api.get('/api/shipments');
      const shipments = shipmentsRes.data || [];
      setShippingData(shipments.map((s: any) => ({
        id: s.id,
        orderNumber: s.orderNumbers || '-',
        customer: s.destination?.substring(0, 30) || 'N/A',
        carrier: s.carrier || 'Royal Mail',
        trackingNumber: s.tracking || s.shipmentNumber,
        status: s.status?.toLowerCase() || 'pending',
        shipDate: s.shipDate || s.createdAt
      })));

      // Calculate stats
      const pickPending = pickLists.filter((p: any) => p.status === 'PENDING' || p.status === 'pending').length;
      const packInProgress = packingTasks.filter((p: any) => p.status === 'IN_PROGRESS' || p.status === 'in_progress').length;
      const readyShip = packingTasks.filter((p: any) => p.status === 'COMPLETED' || p.status === 'completed').length;
      const today = new Date().toISOString().split('T')[0];
      const shippedToday = shipments.filter((s: any) => s.createdAt?.split('T')[0] === today).length;

      setStats({ pickingPending: pickPending, packingInProgress: packInProgress, readyToShip: readyShip, shippedToday: shippedToday });

    } catch (error: any) {
      console.error('Error fetching outbound data:', error);
      message.error('Failed to load outbound data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

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

  const tabItems = [
    {
      key: 'picking',
      label: <span className="flex items-center gap-2"><ShoppingCartOutlined />Picking ({pickingData.length})</span>,
      children: (
        <div className="bg-white rounded-lg shadow-sm">
          <Table dataSource={pickingData} columns={pickingColumns} rowKey="id" scroll={{ x: 1200 }} pagination={{ pageSize: 20 }} loading={loading} />
        </div>
      ),
    },
    {
      key: 'packing',
      label: <span className="flex items-center gap-2"><InboxOutlined />Packing ({packingData.length})</span>,
      children: (
        <div className="bg-white rounded-lg shadow-sm">
          <Table dataSource={packingData} columns={packingColumns} rowKey="id" scroll={{ x: 1200 }} pagination={{ pageSize: 20 }} loading={loading} />
        </div>
      ),
    },
    {
      key: 'shipping',
      label: <span className="flex items-center gap-2"><TruckOutlined />Shipping ({shippingData.length})</span>,
      children: (
        <div className="bg-white rounded-lg shadow-sm">
          <Table dataSource={shippingData} columns={shippingColumns} rowKey="id" scroll={{ x: 1200 }} pagination={{ pageSize: 20 }} loading={loading} />
        </div>
      ),
    },
  ];

  return (
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
              <p className="text-3xl font-bold text-blue-600">{loading ? '...' : stats.pickingPending}</p>
            </div>
          </Card>
          <Card>
            <div className="text-center">
              <p className="text-gray-500 text-sm">Packing In Progress</p>
              <p className="text-3xl font-bold text-orange-600">{loading ? '...' : stats.packingInProgress}</p>
            </div>
          </Card>
          <Card>
            <div className="text-center">
              <p className="text-gray-500 text-sm">Ready to Ship</p>
              <p className="text-3xl font-bold text-green-600">{loading ? '...' : stats.readyToShip}</p>
            </div>
          </Card>
          <Card>
            <div className="text-center">
              <p className="text-gray-500 text-sm">Shipped Today</p>
              <p className="text-3xl font-bold text-purple-600">{loading ? '...' : stats.shippedToday}</p>
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
      );
}
