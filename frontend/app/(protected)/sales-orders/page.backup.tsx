'use client';

import React, { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Table, Button, Input, Select, Tag, Space, Segmented, Card, Row, Col, Tabs } from 'antd';
import {
  PlusOutlined,
  SearchOutlined,
  FilterOutlined,
  AppstoreOutlined,
  BarsOutlined,
  EyeOutlined,
  InboxOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  SyncOutlined,
  RocketOutlined,
} from '@ant-design/icons';
import { mockSalesOrders } from '@/lib/mockData';
import { formatCurrency, formatDate, getStatusColor } from '@/lib/utils';
import Link from 'next/link';
import type { SalesOrder } from '@/types';

const { Search } = Input;
const { Option } = Select;

export default function SalesOrdersPage() {
  const [orders, setOrders] = useState(mockSalesOrders);
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState<'table' | 'kanban'>('table');
  const [selectedStatus, setSelectedStatus] = useState<string | undefined>(undefined);
  const [activeTab, setActiveTab] = useState('all');

  const statusColumns = [
    { key: 'pending', label: 'Pending', color: 'orange' },
    { key: 'confirmed', label: 'Confirmed', color: 'blue' },
    { key: 'allocated', label: 'Allocated', color: 'cyan' },
    { key: 'picking', label: 'Picking', color: 'purple' },
    { key: 'packing', label: 'Packing', color: 'purple' },
    { key: 'shipped', label: 'Shipped', color: 'green' },
  ];

  const getOrdersByStatus = (status: string) => {
    return orders.filter(o => o.status === status);
  };

  // Filter orders for tabs
  const allOrders = orders;
  const pendingOrders = orders.filter(o => o.status === 'pending');
  const confirmedOrders = orders.filter(o => o.status === 'confirmed');
  const inProgressOrders = orders.filter(o => ['allocated', 'picking', 'packing'].includes(o.status));
  const shippedOrders = orders.filter(o => o.status === 'shipped');

  const tableColumns = [
    {
      title: 'Order #',
      dataIndex: 'orderNumber',
      key: 'orderNumber',
      fixed: 'left' as const,
      width: 140,
      render: (text: string, record: SalesOrder) => (
        <Link href={`/sales-orders/${record.id}`} className="text-blue-600 hover:text-blue-800 font-medium">
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
    },
    {
      title: 'Channel',
      dataIndex: 'channel',
      key: 'channel',
      width: 120,
      render: (channel: string) => (
        <Tag color="blue" className="uppercase">
          {channel}
        </Tag>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 130,
      render: (status: string) => (
        <Tag color={getStatusColor(status)} className="uppercase">
          {status.replace('_', ' ')}
        </Tag>
      ),
    },
    {
      title: 'Priority',
      dataIndex: 'priority',
      key: 'priority',
      width: 100,
      render: (priority: string) => (
        <Tag color={getStatusColor(priority)} className="uppercase">
          {priority}
        </Tag>
      ),
    },
    {
      title: 'Items',
      dataIndex: 'items',
      key: 'items',
      width: 80,
      render: (items: any[]) => items.length,
    },
    {
      title: 'Total',
      dataIndex: 'total',
      key: 'total',
      width: 120,
      render: (total: number) => formatCurrency(total),
    },
    {
      title: 'Order Date',
      dataIndex: 'orderDate',
      key: 'orderDate',
      width: 120,
      render: (date: string) => formatDate(date),
    },
    {
      title: 'Required Date',
      dataIndex: 'requiredDate',
      key: 'requiredDate',
      width: 120,
      render: (date: string) => date ? formatDate(date) : '-',
    },
    {
      title: 'Actions',
      key: 'actions',
      fixed: 'right' as const,
      width: 120,
      render: (_: any, record: SalesOrder) => (
        <Link href={`/sales-orders/${record.id}`}>
          <Button type="link" icon={<EyeOutlined />} size="small">
            View
          </Button>
        </Link>
      ),
    },
  ];

  const renderContent = (dataSource: SalesOrder[]) => (
    <>
      <div className="flex items-center justify-between mb-4">
        <div className="flex gap-4">
          <Search
            placeholder="Search by order number or customer..."
            prefix={<SearchOutlined />}
            style={{ width: 300 }}
            allowClear
          />
          <Select
            placeholder="Filter by priority"
            style={{ width: 150 }}
            allowClear
          >
            <Option value="low">Low</Option>
            <Option value="normal">Normal</Option>
            <Option value="high">High</Option>
            <Option value="urgent">Urgent</Option>
          </Select>
        </div>
        <Segmented
          value={viewMode}
          onChange={(value) => setViewMode(value as any)}
          options={[
            { label: 'Table', value: 'table', icon: <BarsOutlined /> },
            { label: 'Kanban', value: 'kanban', icon: <AppstoreOutlined /> },
          ]}
        />
      </div>

      {viewMode === 'table' ? (
        <Table
          dataSource={dataSource}
          columns={tableColumns}
          rowKey="id"
          loading={loading}
          scroll={{ x: 1400 }}
          pagination={{
            total: dataSource.length,
            pageSize: 15,
            showSizeChanger: true,
            showTotal: (total) => `Total ${total} orders`,
          }}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          {statusColumns.map(status => {
            const statusOrders = dataSource.filter(o => o.status === status.key);
            return (
              <div key={status.key} className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold">{status.label}</h3>
                  <Tag color={status.color}>{statusOrders.length}</Tag>
                </div>
                <div className="space-y-3 max-h-[600px] overflow-y-auto">
                  {statusOrders.map(order => (
                    <Link key={order.id} href={`/sales-orders/${order.id}`}>
                      <Card
                        size="small"
                        className="hover:shadow-md transition-shadow cursor-pointer"
                        bodyStyle={{ padding: '12px' }}
                      >
                        <p className="font-medium text-blue-600 mb-1">{order.orderNumber}</p>
                        <p className="text-sm text-gray-600 truncate mb-2">{order.customer?.name}</p>
                        <div className="flex justify-between items-center text-xs">
                          <Tag color={getStatusColor(order.priority)} className="text-xs">
                            {order.priority}
                          </Tag>
                          <span className="font-semibold">{formatCurrency(order.total)}</span>
                        </div>
                      </Card>
                    </Link>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </>
  );

  const tabItems = [
    {
      key: 'all',
      label: <span className="flex items-center gap-2"><InboxOutlined />All Orders ({allOrders.length})</span>,
      children: renderContent(allOrders),
    },
    {
      key: 'pending',
      label: <span className="flex items-center gap-2"><ClockCircleOutlined />Pending ({pendingOrders.length})</span>,
      children: renderContent(pendingOrders),
    },
    {
      key: 'confirmed',
      label: <span className="flex items-center gap-2"><CheckCircleOutlined />Confirmed ({confirmedOrders.length})</span>,
      children: renderContent(confirmedOrders),
    },
    {
      key: 'in_progress',
      label: <span className="flex items-center gap-2"><SyncOutlined />In Progress ({inProgressOrders.length})</span>,
      children: renderContent(inProgressOrders),
    },
    {
      key: 'shipped',
      label: <span className="flex items-center gap-2"><RocketOutlined />Shipped ({shippedOrders.length})</span>,
      children: renderContent(shippedOrders),
    },
  ];

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-green-600 to-teal-600 bg-clip-text text-transparent">
              Sales Orders
            </h1>
            <p className="text-gray-600 mt-1">
              Manage customer orders
            </p>
          </div>
          <Link href="/sales-orders/new">
            <Button type="primary" icon={<PlusOutlined />} size="large">
              New Order
            </Button>
          </Link>
        </div>

        {/* Stats Cards */}
        <Row gutter={[16, 16]}>
          {statusColumns.map(status => (
            <Col key={status.key} xs={24} sm={12} lg={4}>
              <Card className="hover:shadow-md transition-shadow">
                <div className="text-center">
                  <p className="text-gray-500 text-sm mb-1">{status.label}</p>
                  <p className="text-2xl font-bold" style={{ color: `var(--ant-${status.color}-6)` }}>
                    {getOrdersByStatus(status.key).length}
                  </p>
                </div>
              </Card>
            </Col>
          ))}
        </Row>

        {/* Tabs with Table/Kanban Views */}
        <Card className="shadow-sm">
          <Tabs
            activeKey={activeTab}
            onChange={setActiveTab}
            items={tabItems}
            size="large"
          />
        </Card>
      </div>
    </MainLayout>
  );
}
