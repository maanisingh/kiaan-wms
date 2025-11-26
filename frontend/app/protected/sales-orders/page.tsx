'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Table, Button, Input, Tag, Space, Card, Tabs, Spin, Alert, Modal, App } from 'antd';
import {
  PlusOutlined,
  SearchOutlined,
  EyeOutlined,
  ExportOutlined,
  InboxOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  RocketOutlined,
  EditOutlined,
  DeleteOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import { formatCurrency, formatDate, getStatusColor } from '@/lib/utils';
import Link from 'next/link';
import apiService from '@/services/api';

const { Search } = Input;

interface SalesOrder {
  id: string;
  orderNumber: string;
  orderDate: string;
  requiredDate?: string;
  status: string;
  priority?: string;
  salesChannel?: string;
  isWholesale?: boolean;
  subtotal?: number;
  taxAmount?: number;
  shippingCost?: number;
  discountAmount?: number;
  totalAmount?: number;
  notes?: string;
  customer?: {
    id: string;
    name: string;
  };
  salesOrderItems?: Array<{
    id: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
  }>;
  createdAt: string;
  updatedAt: string;
}

export default function SalesOrdersPage() {
  const { modal, message } = App.useApp();
  const [orders, setOrders] = useState<SalesOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('all');
  const [searchText, setSearchText] = useState('');

  // Fetch sales orders from REST API
  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await apiService.get('/sales-orders');
      setOrders(Array.isArray(data) ? data : []);
    } catch (err: any) {
      console.error('Failed to fetch sales orders:', err);
      setError(err.message || 'Failed to load sales orders');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // Filter orders by search text and status
  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      !searchText ||
      order.orderNumber?.toLowerCase().includes(searchText.toLowerCase()) ||
      order.customer?.name?.toLowerCase().includes(searchText.toLowerCase());

    // Filter by tab status
    if (activeTab === 'all') return matchesSearch;
    if (activeTab === 'in_progress') {
      return matchesSearch && ['PICKING', 'PACKING', 'ALLOCATED'].includes(order.status?.toUpperCase());
    }
    return matchesSearch && order.status?.toUpperCase() === activeTab.toUpperCase();
  });

  const handleDelete = (id: string, orderNumber: string) => {
    modal.confirm({
      title: 'Delete Sales Order',
      content: `Are you sure you want to delete order ${orderNumber}? This action cannot be undone.`,
      okText: 'Delete',
      okType: 'danger',
      onOk: async () => {
        try {
          await apiService.delete(`/sales-orders/${id}`);
          message.success('Sales order deleted successfully');
          fetchOrders();
        } catch (err: any) {
          message.error(err.message || 'Failed to delete sales order');
        }
      },
    });
  };

  const tableColumns = [
    {
      title: 'Order #',
      dataIndex: 'orderNumber',
      key: 'orderNumber',
      fixed: 'left' as const,
      width: 140,
      render: (text: string, record: SalesOrder) => (
        <Link href={`/protected/sales-orders/${record.id}`} className="text-blue-600 hover:text-blue-800 font-medium">
          {text}
        </Link>
      ),
    },
    {
      title: 'Customer',
      dataIndex: ['customer', 'name'],
      key: 'customer',
      width: 200,
      ellipsis: true,
      render: (text: string) => text || '-',
    },
    {
      title: 'Type',
      dataIndex: 'isWholesale',
      key: 'type',
      width: 100,
      render: (isWholesale: boolean) => (
        <Tag color={isWholesale ? 'purple' : 'blue'}>
          {isWholesale ? 'WHOLESALE' : 'RETAIL'}
        </Tag>
      ),
    },
    {
      title: 'Channel',
      dataIndex: 'salesChannel',
      key: 'channel',
      width: 120,
      render: (channel: string) => (
        <Tag color="blue" className="uppercase">
          {channel || 'DIRECT'}
        </Tag>
      ),
    },
    {
      title: 'Order Date',
      dataIndex: 'orderDate',
      key: 'orderDate',
      width: 120,
      render: (date: string) => formatDate(date),
    },
    {
      title: 'Items',
      dataIndex: 'salesOrderItems',
      key: 'items',
      width: 80,
      align: 'center' as const,
      render: (items: any[]) => items?.length || 0,
    },
    {
      title: 'Total',
      dataIndex: 'totalAmount',
      key: 'totalAmount',
      width: 120,
      align: 'right' as const,
      render: (amount: number) => formatCurrency(amount || 0),
    },
    {
      title: 'Priority',
      dataIndex: 'priority',
      key: 'priority',
      width: 100,
      render: (priority: string) => {
        const colors: any = { HIGH: 'red', MEDIUM: 'orange', LOW: 'green' };
        return <Tag color={colors[priority] || 'default'}>{priority || 'NORMAL'}</Tag>;
      },
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status: string) => (
        <Tag color={getStatusColor(status?.toLowerCase() || 'pending')}>
          {status || 'PENDING'}
        </Tag>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      fixed: 'right' as const,
      width: 180,
      render: (_: any, record: SalesOrder) => (
        <Space>
          <Link href={`/protected/sales-orders/${record.id}`}>
            <Button type="link" icon={<EyeOutlined />} size="small">
              View
            </Button>
          </Link>
          <Link href={`/protected/sales-orders/${record.id}/edit`}>
            <Button type="link" icon={<EditOutlined />} size="small">
              Edit
            </Button>
          </Link>
          <Button
            type="link"
            danger
            icon={<DeleteOutlined />}
            size="small"
            onClick={() => handleDelete(record.id, record.orderNumber)}
          >
            Delete
          </Button>
        </Space>
      ),
    },
  ];

  if (loading && orders.length === 0) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
        <Spin size="large" tip="Loading sales orders..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <Alert
          message="Error Loading Sales Orders"
          description={error}
          type="error"
          showIcon
          action={
            <Button onClick={fetchOrders} icon={<ReloadOutlined />}>
              Retry
            </Button>
          }
        />
      </div>
    );
  }

  // Calculate counts for tabs
  const allCount = orders.length;
  const pendingCount = orders.filter((o) => o.status?.toUpperCase() === 'PENDING').length;
  const confirmedCount = orders.filter((o) => o.status?.toUpperCase() === 'CONFIRMED').length;
  const inProgressCount = orders.filter((o) => ['PICKING', 'PACKING', 'ALLOCATED'].includes(o.status?.toUpperCase())).length;
  const completedCount = orders.filter((o) => o.status?.toUpperCase() === 'COMPLETED').length;

  const tabItems = [
    {
      key: 'all',
      label: <span className="flex items-center gap-2"><InboxOutlined />All Orders ({allCount})</span>,
    },
    {
      key: 'pending',
      label: <span className="flex items-center gap-2"><ClockCircleOutlined />Pending ({pendingCount})</span>,
    },
    {
      key: 'confirmed',
      label: <span className="flex items-center gap-2"><CheckCircleOutlined />Confirmed ({confirmedCount})</span>,
    },
    {
      key: 'in_progress',
      label: <span className="flex items-center gap-2"><RocketOutlined />In Progress ({inProgressCount})</span>,
    },
    {
      key: 'completed',
      label: <span className="flex items-center gap-2"><CheckCircleOutlined className="text-green-500" />Completed ({completedCount})</span>,
    },
  ];

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Sales Orders</h1>
          <p className="text-gray-500">Manage and track all sales orders</p>
        </div>
        <Space>
          <Button icon={<ReloadOutlined />} onClick={fetchOrders} loading={loading}>
            Refresh
          </Button>
          <Button icon={<ExportOutlined />}>Export</Button>
          <Link href="/protected/sales-orders/new">
            <Button type="primary" icon={<PlusOutlined />}>
              New Order
            </Button>
          </Link>
        </Space>
      </div>

      {/* Filters */}
      <Card className="mb-4">
        <Search
          placeholder="Search by order number or customer name..."
          allowClear
          style={{ width: 400 }}
          prefix={<SearchOutlined />}
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
        />
      </Card>

      {/* Tabs & Table */}
      <Card>
        <Tabs activeKey={activeTab} onChange={setActiveTab} items={tabItems} />
        <Table
          dataSource={filteredOrders}
          columns={tableColumns}
          rowKey="id"
          loading={loading}
          scroll={{ x: 1400 }}
          pagination={{
            total: filteredOrders.length,
            pageSize: 50,
            showSizeChanger: true,
            showTotal: (total) => `Total ${total} orders`,
          }}
        />
      </Card>
    </div>
  );
}
