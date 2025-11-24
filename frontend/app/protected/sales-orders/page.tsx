'use client';

import React, { useState } from 'react';
import { useQuery, useMutation } from '@apollo/client';

import { Table, Button, Input, Tag, Space, Card, Tabs, Spin, Alert, Modal, message } from 'antd';
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
} from '@ant-design/icons';
import { GET_SALES_ORDERS } from '@/lib/graphql/queries';
import { DELETE_SALES_ORDER } from '@/lib/graphql/mutations';
import { formatCurrency, formatDate, getStatusColor } from '@/lib/utils';
import Link from 'next/link';

const { Search } = Input;

export default function SalesOrdersPageReal() {
  const [activeTab, setActiveTab] = useState('all');
  const [searchText, setSearchText] = useState('');

  // Build where clause
  const buildWhereClause = () => {
    const where: any = {};

    if (searchText) {
      where._or = [
        { orderNumber: { _ilike: `%${searchText}%` } },
        { customer: { name: { _ilike: `%${searchText}%` } } },  // Fixed: Customer → customer
      ];
    }

    // Filter by tab status
    if (activeTab !== 'all') {
      if (activeTab === 'in_progress') {
        where.status = { _in: ['PICKING', 'PACKING', 'ALLOCATED'] };
      } else {
        where.status = { _eq: activeTab.toUpperCase() };
      }
    }

    return Object.keys(where).length > 0 ? where : undefined;
  };

  // Fetch sales orders from Hasura
  const { data, loading, error, refetch } = useQuery(GET_SALES_ORDERS, {
    variables: {
      limit: 100,
      offset: 0,
      where: buildWhereClause(),
    },
    fetchPolicy: 'cache-and-network',
  });

  // Delete sales order mutation
  const [deleteSalesOrder] = useMutation(DELETE_SALES_ORDER, {
    onCompleted: () => {
      message.success('Sales order deleted successfully');
      refetch();
    },
    onError: (err) => {
      message.error(`Failed to delete sales order: ${err.message}`);
    },
  });

  const handleDelete = (id: string, orderNumber: string) => {
    Modal.confirm({
      title: 'Delete Sales Order',
      content: `Are you sure you want to delete order ${orderNumber}? This action cannot be undone.`,
      okText: 'Delete',
      okType: 'danger',
      onOk: async () => {
        await deleteSalesOrder({ variables: { id } });
      },
    });
  };

  const orders = data?.SalesOrder || [];
  const totalCount = data?.SalesOrder_aggregate?.aggregate?.count || 0;

  const tableColumns = [
    {
      title: 'Order #',
      dataIndex: 'orderNumber',
      key: 'orderNumber',
      fixed: 'left' as const,
      width: 140,
      render: (text: string, record: any) => (
        <Link href={`/sales-orders/${record.id}`} className="text-blue-600 hover:text-blue-800 font-medium">
          {text}
        </Link>
      ),
    },
    {
      title: 'Customer',
      dataIndex: ['customer', 'name'],  // Fixed: Customer → customer
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
      dataIndex: 'salesOrderItems',  // Fixed: SalesOrderItems → salesOrderItems
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
      render: (_: any, record: any) => (
        <Space>
          <Link href={`/sales-orders/${record.id}`}>
            <Button type="link" icon={<EyeOutlined />} size="small">
              View
            </Button>
          </Link>
          <Link href={`/sales-orders/${record.id}/edit`}>
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

  if (loading && !data) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
          <Spin size="large" tip="Loading sales orders..." />
        </div>
    );
  }

  if (error) {
    return (
      <Alert
          message="Error Loading Sales Orders"
          description={error.message}
          type="error"
          showIcon
          action={<Button onClick={() => refetch()}>Retry</Button>}
        />
          );
  }

  // Calculate counts for tabs
  const allCount = totalCount;
  const pendingCount = orders.filter((o: any) => o.status === 'PENDING').length;
  const confirmedCount = orders.filter((o: any) => o.status === 'CONFIRMED').length;
  const inProgressCount = orders.filter((o: any) => ['PICKING', 'PACKING', 'ALLOCATED'].includes(o.status)).length;
  const completedCount = orders.filter((o: any) => o.status === 'COMPLETED').length;

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
            <Button icon={<ExportOutlined />}>Export</Button>
            <Link href="/sales-orders/new">
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
            onSearch={setSearchText}
            onChange={(e) => e.target.value === '' && setSearchText('')}
          />
        </Card>

        {/* Tabs & Table */}
        <Card>
          <Tabs activeKey={activeTab} onChange={setActiveTab} items={tabItems} />
          <Table
            dataSource={orders}
            columns={tableColumns}
            rowKey="id"
            loading={loading}
            scroll={{ x: 1400 }}
            pagination={{
              total: totalCount,
              pageSize: 50,
              showSizeChanger: true,
              showTotal: (total) => `Total ${total} orders`,
            }}
          />
        </Card>
      </div>
      );
}
