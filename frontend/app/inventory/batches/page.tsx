'use client';

import React, { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Table, Button, Input, Card, Tag, Tabs } from 'antd';
import { PlusOutlined, SearchOutlined, EyeOutlined, InboxOutlined, CheckCircleOutlined, WarningOutlined } from '@ant-design/icons';
import { formatDate } from '@/lib/utils';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

const { Search } = Input;

export default function BatchesPage() {
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const router = useRouter();

  const mockData = [
    { id: '1', batchNumber: 'BATCH-001', productName: 'Laptop Computer', quantity: 100, mfgDate: '2024-01-01', expiryDate: '2026-01-01', status: 'active' },
    { id: '2', batchNumber: 'BATCH-002', productName: 'Office Chair', quantity: 50, mfgDate: '2023-12-15', expiryDate: '2025-12-15', status: 'active' },
    { id: '3', batchNumber: 'BATCH-003', productName: 'Wireless Mouse', quantity: 200, mfgDate: '2024-01-10', expiryDate: '2027-01-10', status: 'active' },
    { id: '4', batchNumber: 'BATCH-004', productName: 'Monitor 24"', quantity: 0, mfgDate: '2023-11-01', expiryDate: '2025-11-01', status: 'depleted' },
  ];

  const columns = [
    {
      title: 'Batch Number',
      dataIndex: 'batchNumber',
      key: 'batch',
      width: 150,
      render: (text: string, record: any) => (
        <Link href={`/inventory/batches/${record.id}`}>
          <span className="font-medium text-blue-600 cursor-pointer hover:underline">{text}</span>
        </Link>
      )
    },
    { title: 'Product', dataIndex: 'productName', key: 'product', width: 200 },
    { title: 'Quantity', dataIndex: 'quantity', key: 'quantity', width: 100 },
    { title: 'Manufacturing Date', dataIndex: 'mfgDate', key: 'mfgDate', width: 150, render: (date: string) => formatDate(date) },
    { title: 'Expiry Date', dataIndex: 'expiryDate', key: 'expiryDate', width: 150, render: (date: string) => formatDate(date) },
    { title: 'Status', dataIndex: 'status', key: 'status', width: 120, render: (status: string) => <Tag color={status === 'active' ? 'green' : 'default'}>{status}</Tag> },
    {
      title: 'Actions',
      key: 'actions',
      width: 120,
      render: (_: any, record: any) => (
        <Link href={`/inventory/batches/${record.id}`}>
          <Button type="link" icon={<EyeOutlined />} size="small">View</Button>
        </Link>
      ),
    },
  ];

  const allBatches = mockData;
  const activeBatches = mockData.filter(b => b.status === 'active');
  const depletedBatches = mockData.filter(b => b.status === 'depleted');

  const renderFiltersAndTable = (dataSource: any[]) => (
    <>
      <div className="flex gap-4 mb-4">
        <Search placeholder="Search batches..." style={{ width: 300 }} prefix={<SearchOutlined />} />
      </div>
      <Table
        columns={columns}
        dataSource={dataSource}
        rowKey="id"
        loading={loading}
        scroll={{ x: 1000 }}
        onRow={(record) => ({
          onClick: () => router.push(`/inventory/batches/${record.id}`),
          style: { cursor: 'pointer' }
        })}
      />
    </>
  );

  const tabItems = [
    {
      key: 'all',
      label: <span className="flex items-center gap-2"><InboxOutlined />All Batches ({allBatches.length})</span>,
      children: renderFiltersAndTable(allBatches),
    },
    {
      key: 'active',
      label: <span className="flex items-center gap-2"><CheckCircleOutlined />Active ({activeBatches.length})</span>,
      children: renderFiltersAndTable(activeBatches),
    },
    {
      key: 'depleted',
      label: <span className="flex items-center gap-2"><WarningOutlined />Depleted ({depletedBatches.length})</span>,
      children: renderFiltersAndTable(depletedBatches),
    },
  ];

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              Inventory Batches
            </h1>
            <p className="text-gray-600 mt-1">Track batch numbers and expiry dates</p>
          </div>
          <Button type="primary" icon={<PlusOutlined />} size="large">
            New Batch
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <div className="text-center">
              <p className="text-gray-500 text-sm">Total Batches</p>
              <p className="text-3xl font-bold text-blue-600">{allBatches.length}</p>
            </div>
          </Card>
          <Card>
            <div className="text-center">
              <p className="text-gray-500 text-sm">Active</p>
              <p className="text-3xl font-bold text-green-600">{activeBatches.length}</p>
            </div>
          </Card>
          <Card>
            <div className="text-center">
              <p className="text-gray-500 text-sm">Depleted</p>
              <p className="text-3xl font-bold text-orange-600">{depletedBatches.length}</p>
            </div>
          </Card>
          <Card>
            <div className="text-center">
              <p className="text-gray-500 text-sm">Total Quantity</p>
              <p className="text-3xl font-bold text-purple-600">{mockData.reduce((sum, b) => sum + b.quantity, 0)}</p>
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
