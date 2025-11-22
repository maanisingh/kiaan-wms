'use client';

import React, { useState } from 'react';
import { useQuery } from '@apollo/client/react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Table, Button, Tag, Tabs, Card, Input, Spin, Alert, Space } from 'antd';
import { PlusOutlined, InboxOutlined, CheckCircleOutlined, WarningOutlined, StopOutlined, SearchOutlined, ExportOutlined } from '@ant-design/icons';
import { GET_INVENTORY } from '@/lib/graphql/queries';
import { formatDate, getStatusColor } from '@/lib/utils';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

const { Search } = Input;

export default function InventoryPageReal() {
  const [activeTab, setActiveTab] = useState('all');
  const [searchText, setSearchText] = useState('');
  const router = useRouter();

  // Build where clause
  const buildWhereClause = () => {
    const where: any = {};

    if (searchText) {
      where._or = [
        { Product: { name: { _ilike: `%${searchText}%` } } },
        { Product: { sku: { _ilike: `%${searchText}%` } } },
        { lotNumber: { _ilike: `%${searchText}%` } },
      ];
    }

    // Filter by tab
    if (activeTab === 'in_stock') {
      where.quantity = { _gt: 50 };
    } else if (activeTab === 'low_stock') {
      where.quantity = { _gt: 0, _lte: 50 };
    } else if (activeTab === 'out_of_stock') {
      where.quantity = { _eq: 0 };
    } else if (activeTab === 'expiring') {
      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
      where.bestBeforeDate = { _lte: thirtyDaysFromNow.toISOString().split('T')[0] };
      where.quantity = { _gt: 0 };
    }

    return Object.keys(where).length > 0 ? where : undefined;
  };

  // Fetch inventory from Hasura
  const { data, loading, error, refetch } = useQuery(GET_INVENTORY, {
    variables: {
      limit: 100,
      offset: 0,
      where: buildWhereClause(),
    },
    fetchPolicy: 'cache-and-network',
  });

  const inventory = data?.Inventory || [];
  const totalCount = data?.Inventory_aggregate?.aggregate?.count || 0;
  const totalQty = data?.Inventory_aggregate?.aggregate?.sum?.quantity || 0;
  const availableQty = data?.Inventory_aggregate?.aggregate?.sum?.availableQuantity || 0;

  const inventoryColumns = [
    {
      title: 'Product SKU',
      dataIndex: ['Product', 'sku'],
      key: 'sku',
      width: 120,
      render: (text: string, record: any) => (
        <Link href={`/inventory/${record.id}`}>
          <span className="font-medium text-blue-600 cursor-pointer hover:underline">{text}</span>
        </Link>
      )
    },
    {
      title: 'Product Name',
      dataIndex: ['Product', 'name'],
      key: 'name',
      width: 250,
      ellipsis: true
    },
    {
      title: 'Location',
      dataIndex: ['Location', 'code'],
      key: 'location',
      width: 120,
      render: (text: string) => text || '-'
    },
    {
      title: 'Warehouse',
      dataIndex: ['Location', 'Warehouse', 'name'],
      key: 'warehouse',
      width: 150,
      render: (text: string) => text || '-'
    },
    {
      title: 'Quantity',
      dataIndex: 'quantity',
      key: 'quantity',
      width: 100,
      align: 'right' as const,
      render: (qty: number) => qty?.toLocaleString() || 0
    },
    {
      title: 'Available',
      dataIndex: 'availableQuantity',
      key: 'available',
      width: 100,
      align: 'right' as const,
      render: (qty: number) => qty?.toLocaleString() || 0
    },
    {
      title: 'Reserved',
      dataIndex: 'reservedQuantity',
      key: 'reserved',
      width: 100,
      align: 'right' as const,
      render: (qty: number) => qty?.toLocaleString() || 0
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status: string) => <Tag color={getStatusColor(status?.toLowerCase() || 'available')}>{status || 'AVAILABLE'}</Tag>
    },
    {
      title: 'Lot Number',
      dataIndex: 'lotNumber',
      key: 'lot',
      width: 120,
      render: (text: string) => text || '-'
    },
    {
      title: 'Best Before',
      dataIndex: 'bestBeforeDate',
      key: 'bestBefore',
      width: 120,
      render: (date: string) => {
        if (!date) return '-';
        const isExpiringSoon = new Date(date) < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
        return (
          <span className={isExpiringSoon ? 'text-red-600 font-semibold' : ''}>
            {formatDate(date)}
          </span>
        );
      }
    },
  ];

  if (loading && !data) {
    return (
      <MainLayout>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
          <Spin size="large" tip="Loading inventory..." />
        </div>
      </MainLayout>
    );
  }

  if (error) {
    return (
      <MainLayout>
        <Alert
          message="Error Loading Inventory"
          description={error.message}
          type="error"
          showIcon
          action={<Button onClick={() => refetch()}>Retry</Button>}
        />
      </MainLayout>
    );
  }

  // Calculate counts for tabs
  const allCount = totalCount;
  const inStockCount = inventory.filter((i: any) => (i.quantity || 0) > 50).length;
  const lowStockCount = inventory.filter((i: any) => (i.quantity || 0) > 0 && (i.quantity || 0) <= 50).length;
  const outOfStockCount = inventory.filter((i: any) => (i.quantity || 0) === 0).length;
  const expiringCount = inventory.filter((i: any) => {
    if (!i.bestBeforeDate) return false;
    const thirtyDaysFromNow = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    return new Date(i.bestBeforeDate) < thirtyDaysFromNow && (i.quantity || 0) > 0;
  }).length;

  const renderTable = (dataSource: any[]) => (
    <>
      <div className="flex gap-4 mb-4">
        <Search
          placeholder="Search by product name, SKU, or lot number..."
          style={{ width: 400 }}
          prefix={<SearchOutlined />}
          onSearch={setSearchText}
          onChange={(e) => e.target.value === '' && setSearchText('')}
        />
      </div>
      <Table
        dataSource={dataSource}
        columns={inventoryColumns}
        rowKey="id"
        scroll={{ x: 1400 }}
        loading={loading}
        pagination={{
          pageSize: 50,
          showSizeChanger: true,
          showTotal: (total) => `Total ${total} items`
        }}
        onRow={(record) => ({
          onClick: () => router.push(`/inventory/${record.id}`),
          style: { cursor: 'pointer' }
        })}
      />
    </>
  );

  const tabItems = [
    {
      key: 'all',
      label: <span className="flex items-center gap-2"><InboxOutlined />All Items ({allCount})</span>,
      children: renderTable(inventory),
    },
    {
      key: 'in_stock',
      label: <span className="flex items-center gap-2"><CheckCircleOutlined />In Stock ({inStockCount})</span>,
      children: renderTable(inventory.filter((i: any) => (i.quantity || 0) > 50)),
    },
    {
      key: 'low_stock',
      label: <span className="flex items-center gap-2"><WarningOutlined />Low Stock ({lowStockCount})</span>,
      children: renderTable(inventory.filter((i: any) => (i.quantity || 0) > 0 && (i.quantity || 0) <= 50)),
    },
    {
      key: 'out_of_stock',
      label: <span className="flex items-center gap-2"><StopOutlined />Out of Stock ({outOfStockCount})</span>,
      children: renderTable(inventory.filter((i: any) => (i.quantity || 0) === 0)),
    },
    {
      key: 'expiring',
      label: <span className="flex items-center gap-2"><WarningOutlined className="text-red-500" />Expiring Soon ({expiringCount})</span>,
      children: renderTable(inventory.filter((i: any) => {
        if (!i.bestBeforeDate) return false;
        const thirtyDaysFromNow = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
        return new Date(i.bestBeforeDate) < thirtyDaysFromNow && (i.quantity || 0) > 0;
      })),
    },
  ];

  return (
    <MainLayout>
      <div className="p-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold">Inventory Management</h1>
            <p className="text-gray-500">
              Total: {totalQty.toLocaleString()} units | Available: {availableQty.toLocaleString()} units
            </p>
          </div>
          <Space>
            <Button icon={<ExportOutlined />}>Export</Button>
            <Link href="/inventory/adjustments/new">
              <Button type="primary" icon={<PlusOutlined />}>
                Adjust Inventory
              </Button>
            </Link>
          </Space>
        </div>

        {/* Tabs */}
        <Card>
          <Tabs activeKey={activeTab} onChange={setActiveTab} items={tabItems} />
        </Card>
      </div>
    </MainLayout>
  );
}
