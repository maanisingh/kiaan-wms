'use client';

import React, { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Table, Button, Tag, Tabs, Card, Input } from 'antd';
import { PlusOutlined, InboxOutlined, CheckCircleOutlined, WarningOutlined, StopOutlined, SearchOutlined } from '@ant-design/icons';
import { mockInventory } from '@/lib/mockData';
import { formatDate, getStatusColor } from '@/lib/utils';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

const { Search } = Input;

export default function InventoryPage() {
  const [activeTab, setActiveTab] = useState('all');
  const router = useRouter();

  const inventoryColumns = [
    {
      title: 'Product SKU',
      dataIndex: ['product', 'sku'],
      key: 'sku',
      width: 120,
      render: (text: string, record: any) => (
        <Link href={`/products/${record.productId}`}>
          <span className="font-medium text-blue-600 cursor-pointer hover:underline">{text}</span>
        </Link>
      )
    },
    { title: 'Product Name', dataIndex: ['product', 'name'], key: 'name', width: 250, ellipsis: true },
    { title: 'Location', dataIndex: 'locationId', key: 'location', width: 100 },
    { title: 'Quantity', dataIndex: 'quantity', key: 'quantity', width: 100 },
    { title: 'Available', dataIndex: 'availableQuantity', key: 'available', width: 100 },
    { title: 'Reserved', dataIndex: 'reservedQuantity', key: 'reserved', width: 100 },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status: string) => <Tag color={getStatusColor(status)}>{status}</Tag>
    },
    { title: 'Batch', dataIndex: 'batchNumber', key: 'batch', width: 120, render: (text: string) => text || '-' },
    { title: 'Expiry Date', dataIndex: 'expiryDate', key: 'expiry', width: 120, render: (date: string) => date ? formatDate(date) : '-' },
  ];

  // Filter inventory by status
  const allItems = mockInventory;
  const inStock = mockInventory.filter(i => i.quantity > 0 && i.quantity >= 50);
  const lowStock = mockInventory.filter(i => i.quantity > 0 && i.quantity < 50);
  const outOfStock = mockInventory.filter(i => i.quantity === 0);

  const renderTable = (dataSource: any[]) => (
    <>
      <div className="flex gap-4 mb-4">
        <Search placeholder="Search inventory..." style={{ width: 300 }} prefix={<SearchOutlined />} />
      </div>
      <Table
        dataSource={dataSource}
        columns={inventoryColumns}
        rowKey="id"
        scroll={{ x: 1200 }}
        pagination={{ pageSize: 15 }}
        onRow={(record) => ({
          onClick: () => router.push(`/products/${record.productId}`),
          style: { cursor: 'pointer' }
        })}
      />
    </>
  );

  const tabItems = [
    {
      key: 'all',
      label: <span className="flex items-center gap-2"><InboxOutlined />All Items ({allItems.length})</span>,
      children: renderTable(allItems),
    },
    {
      key: 'in_stock',
      label: <span className="flex items-center gap-2"><CheckCircleOutlined />In Stock ({inStock.length})</span>,
      children: renderTable(inStock),
    },
    {
      key: 'low_stock',
      label: <span className="flex items-center gap-2"><WarningOutlined />Low Stock ({lowStock.length})</span>,
      children: renderTable(lowStock),
    },
    {
      key: 'out_of_stock',
      label: <span className="flex items-center gap-2"><StopOutlined />Out of Stock ({outOfStock.length})</span>,
      children: renderTable(outOfStock),
    },
  ];

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
              Inventory Overview
            </h1>
            <p className="text-gray-600 mt-1">View and manage stock levels across all locations</p>
          </div>
          <Link href="/inventory/adjustments/new">
            <Button type="primary" icon={<PlusOutlined />} size="large">
              Stock Adjustment
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <div className="text-center">
              <p className="text-gray-500 text-sm">Total Items</p>
              <p className="text-3xl font-bold text-blue-600">{allItems.length}</p>
            </div>
          </Card>
          <Card>
            <div className="text-center">
              <p className="text-gray-500 text-sm">In Stock</p>
              <p className="text-3xl font-bold text-green-600">{inStock.length}</p>
            </div>
          </Card>
          <Card>
            <div className="text-center">
              <p className="text-gray-500 text-sm">Low Stock</p>
              <p className="text-3xl font-bold text-orange-600">{lowStock.length}</p>
            </div>
          </Card>
          <Card>
            <div className="text-center">
              <p className="text-gray-500 text-sm">Out of Stock</p>
              <p className="text-3xl font-bold text-red-600">{outOfStock.length}</p>
            </div>
          </Card>
        </div>

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
