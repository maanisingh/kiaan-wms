'use client';

import React, { useState, useEffect } from 'react';
import { Table, Button, Tag, Tabs, Card, Space, message } from 'antd';
import {
  PlusOutlined,
  InboxOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  TruckOutlined,
  FileTextOutlined,
  ReloadOutlined
} from '@ant-design/icons';
import { formatDate, getStatusColor } from '@/lib/utils';
import Link from 'next/link';
import api from '@/services/api';

export default function InboundPage() {
  const [activeTab, setActiveTab] = useState('receiving');
  const [loading, setLoading] = useState(true);
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [stockAdjustments, setStockAdjustments] = useState([]);
  const [transfers, setTransfers] = useState([]);
  const [stats, setStats] = useState({ pendingReceipts: 0, inTransit: 0, qcInProgress: 0, putawayPending: 0 });

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch purchase orders for receiving
      const poRes = await api.get('/api/purchase-orders');
      const pos = poRes.data || [];
      setPurchaseOrders(pos.map((po: any) => ({
        id: po.id,
        poNumber: po.orderNumber || po.poNumber || `PO-${po.id?.substring(0, 8)}`,
        supplier: po.supplier?.name || 'Unknown Supplier',
        status: po.status?.toLowerCase() || 'pending',
        items: po.items?.length || 0,
        expectedDate: po.expectedDeliveryDate || po.createdAt,
        receivedDate: po.receivedDate
      })));

      // Fetch stock adjustments for quality control
      const saRes = await api.get('/api/inventory/adjustments');
      const adjustments = saRes.data || [];
      setStockAdjustments(adjustments.map((sa: any) => ({
        id: sa.id,
        poNumber: sa.referenceNumber || `ADJ-${sa.id?.substring(0, 8)}`,
        product: sa.product?.name || 'N/A',
        quantity: sa.adjustedQuantity || 0,
        status: sa.status?.toLowerCase() || 'pending',
        inspector: sa.user?.name || 'System',
        date: sa.createdAt
      })));

      // Fetch transfers for putaway
      const trRes = await api.get('/api/transfers');
      const transferList = trRes.data || [];
      setTransfers(transferList.map((tr: any) => ({
        id: tr.id,
        product: tr.product?.name || 'N/A',
        quantity: tr.quantity || 0,
        fromLocation: tr.fromWarehouse?.name || tr.fromLocation || 'N/A',
        toLocation: tr.toWarehouse?.name || tr.toLocation || 'N/A',
        status: tr.status?.toLowerCase() || 'pending',
        user: tr.user?.name || null,
        date: tr.createdAt
      })));

      // Calculate stats
      const pending = pos.filter((p: any) => p.status === 'PENDING' || p.status === 'pending').length;
      const inTransit = pos.filter((p: any) => p.status === 'IN_TRANSIT' || p.status === 'ORDERED' || p.status === 'ordered').length;
      const qcProgress = adjustments.filter((s: any) => s.status === 'IN_PROGRESS' || s.status === 'pending').length;
      const putaway = transferList.filter((t: any) => t.status === 'PENDING' || t.status === 'pending').length;

      setStats({
        pendingReceipts: pending,
        inTransit: inTransit,
        qcInProgress: qcProgress,
        putawayPending: putaway
      });

    } catch (error: any) {
      console.error('Error fetching inbound data:', error);
      message.error('Failed to load inbound data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const receivingColumns = [
    { title: 'PO Number', dataIndex: 'poNumber', key: 'poNumber', width: 150 },
    { title: 'Supplier', dataIndex: 'supplier', key: 'supplier', width: 200 },
    { title: 'Items', dataIndex: 'items', key: 'items', width: 80 },
    { title: 'Expected Date', dataIndex: 'expectedDate', key: 'expected', width: 130, render: (date: string) => formatDate(date) },
    { title: 'Received Date', dataIndex: 'receivedDate', key: 'received', width: 130, render: (date: string) => date ? formatDate(date) : '-' },
    { title: 'Status', dataIndex: 'status', key: 'status', width: 120, render: (status: string) => <Tag color={getStatusColor(status)}>{status}</Tag> },
    { title: 'Actions', key: 'actions', width: 150, render: (_: any, record: any) => (
      <Space>
        <Link href={`/protected/purchase-orders/${record.id}`}><Button type="link" size="small">View</Button></Link>
        <Button type="link" size="small">Process</Button>
      </Space>
    )},
  ];

  const qualityColumns = [
    { title: 'Reference', dataIndex: 'poNumber', key: 'poNumber', width: 130 },
    { title: 'Product', dataIndex: 'product', key: 'product', width: 200 },
    { title: 'Quantity', dataIndex: 'quantity', key: 'quantity', width: 100 },
    { title: 'Inspector', dataIndex: 'inspector', key: 'inspector', width: 150 },
    { title: 'Date', dataIndex: 'date', key: 'date', width: 120, render: (date: string) => formatDate(date) },
    { title: 'Status', dataIndex: 'status', key: 'status', width: 120, render: (status: string) => <Tag color={getStatusColor(status)}>{status}</Tag> },
    { title: 'Actions', key: 'actions', width: 150, render: () => <Space><Button type="link" size="small">View</Button><Button type="link" size="small">Report</Button></Space> },
  ];

  const putawayColumns = [
    { title: 'Product', dataIndex: 'product', key: 'product', width: 200 },
    { title: 'Quantity', dataIndex: 'quantity', key: 'quantity', width: 100 },
    { title: 'From', dataIndex: 'fromLocation', key: 'from', width: 150 },
    { title: 'To', dataIndex: 'toLocation', key: 'to', width: 150 },
    { title: 'User', dataIndex: 'user', key: 'user', width: 150, render: (user: string) => user || '-' },
    { title: 'Date', dataIndex: 'date', key: 'date', width: 120, render: (date: string) => date ? formatDate(date) : '-' },
    { title: 'Status', dataIndex: 'status', key: 'status', width: 120, render: (status: string) => <Tag color={getStatusColor(status)}>{status}</Tag> },
    { title: 'Actions', key: 'actions', width: 150, render: (_: any, record: any) => (
      <Space>
        <Link href={`/protected/transfers/${record.id}`}><Button type="link" size="small">View</Button></Link>
        <Button type="link" size="small">Complete</Button>
      </Space>
    )},
  ];

  const tabItems = [
    {
      key: 'receiving',
      label: <span className="flex items-center gap-2"><InboxOutlined />Receiving ({purchaseOrders.length})</span>,
      children: (
        <div className="bg-white rounded-lg shadow-sm">
          <Table dataSource={purchaseOrders} columns={receivingColumns} rowKey="id" scroll={{ x: 1200 }} pagination={{ pageSize: 20 }} loading={loading} />
        </div>
      ),
    },
    {
      key: 'quality',
      label: <span className="flex items-center gap-2"><CheckCircleOutlined />Quality Control ({stockAdjustments.length})</span>,
      children: (
        <div className="bg-white rounded-lg shadow-sm">
          <Table dataSource={stockAdjustments} columns={qualityColumns} rowKey="id" scroll={{ x: 1200 }} pagination={{ pageSize: 20 }} loading={loading} />
        </div>
      ),
    },
    {
      key: 'putaway',
      label: <span className="flex items-center gap-2"><TruckOutlined />Putaway Tasks ({transfers.length})</span>,
      children: (
        <div className="bg-white rounded-lg shadow-sm">
          <Table dataSource={transfers} columns={putawayColumns} rowKey="id" scroll={{ x: 1200 }} pagination={{ pageSize: 20 }} loading={loading} />
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Inbound Operations</h1>
            <p className="text-gray-600 mt-1">Manage receiving, quality control, and putaway</p>
          </div>
          <Space>
            <Button icon={<ReloadOutlined />} onClick={fetchData} loading={loading}>Refresh</Button>
            <Link href="/protected/purchase-orders/new">
              <Button type="primary" icon={<PlusOutlined />} size="large">Create Receipt</Button>
            </Link>
          </Space>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <div className="text-center">
              <p className="text-gray-500 text-sm">Pending Receipts</p>
              <p className="text-3xl font-bold text-orange-600">{loading ? '...' : stats.pendingReceipts}</p>
            </div>
          </Card>
          <Card>
            <div className="text-center">
              <p className="text-gray-500 text-sm">In Transit / Ordered</p>
              <p className="text-3xl font-bold text-blue-600">{loading ? '...' : stats.inTransit}</p>
            </div>
          </Card>
          <Card>
            <div className="text-center">
              <p className="text-gray-500 text-sm">QC In Progress</p>
              <p className="text-3xl font-bold text-purple-600">{loading ? '...' : stats.qcInProgress}</p>
            </div>
          </Card>
          <Card>
            <div className="text-center">
              <p className="text-gray-500 text-sm">Putaway Pending</p>
              <p className="text-3xl font-bold text-green-600">{loading ? '...' : stats.putawayPending}</p>
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
