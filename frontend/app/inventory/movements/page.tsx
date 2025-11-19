'use client';

import React, { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Table, Button, Input, Card, Tag, Tabs } from 'antd';
import { PlusOutlined, SearchOutlined, EyeOutlined, InboxOutlined, SwapOutlined, ArrowRightOutlined } from '@ant-design/icons';
import { formatDate } from '@/lib/utils';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

const { Search } = Input;

export default function MovementsPage() {
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const router = useRouter();

  const mockData = [
    { id: 'MOV-001', date: '2024-01-15T10:30:00', productName: 'Laptop Computer', fromLocation: 'A-01', toLocation: 'B-02', quantity: 10, type: 'Transfer', user: 'John Doe' },
    { id: 'MOV-002', date: '2024-01-14T14:20:00', productName: 'Office Chair', fromLocation: 'B-02', toLocation: 'C-03', quantity: 5, type: 'Transfer', user: 'Jane Smith' },
    { id: 'MOV-003', date: '2024-01-13T09:15:00', productName: 'Wireless Mouse', fromLocation: 'C-03', toLocation: 'A-01', quantity: 25, type: 'Relocation', user: 'Mike Johnson' },
    { id: 'MOV-004', date: '2024-01-12T11:00:00', productName: 'Monitor 24"', fromLocation: 'D-04', toLocation: 'A-01', quantity: 8, type: 'Transfer', user: 'Sarah Lee' },
  ];

  const columns = [
    {
      title: 'Movement ID',
      dataIndex: 'id',
      key: 'id',
      width: 150,
      render: (text: string, record: any) => (
        <Link href={`/inventory/movements/${record.id}`}>
          <span className="font-medium text-blue-600 cursor-pointer hover:underline">{text}</span>
        </Link>
      )
    },
    { title: 'Date', dataIndex: 'date', key: 'date', width: 150, render: (date: string) => formatDate(date) },
    { title: 'Product', dataIndex: 'productName', key: 'product', width: 200 },
    { title: 'From', dataIndex: 'fromLocation', key: 'from', width: 120, render: (text: string) => <Tag color="orange">{text}</Tag> },
    { title: 'To', dataIndex: 'toLocation', key: 'to', width: 120, render: (text: string) => <Tag color="green">{text}</Tag> },
    { title: 'Quantity', dataIndex: 'quantity', key: 'quantity', width: 100 },
    { title: 'Type', dataIndex: 'type', key: 'type', width: 120, render: (type: string) => <Tag color="blue">{type}</Tag> },
    { title: 'User', dataIndex: 'user', key: 'user', width: 150 },
    {
      title: 'Actions',
      key: 'actions',
      width: 120,
      render: (_: any, record: any) => (
        <Link href={`/inventory/movements/${record.id}`}>
          <Button type="link" icon={<EyeOutlined />} size="small">View</Button>
        </Link>
      ),
    },
  ];

  const allMovements = mockData;
  const transfers = mockData.filter(m => m.type === 'Transfer');
  const relocations = mockData.filter(m => m.type === 'Relocation');

  const renderFiltersAndTable = (dataSource: any[]) => (
    <>
      <div className="flex gap-4 mb-4">
        <Search placeholder="Search movements..." style={{ width: 300 }} prefix={<SearchOutlined />} />
      </div>
      <Table
        columns={columns}
        dataSource={dataSource}
        rowKey="id"
        loading={loading}
        scroll={{ x: 1200 }}
        onRow={(record) => ({
          onClick: () => router.push(`/inventory/movements/${record.id}`),
          style: { cursor: 'pointer' }
        })}
      />
    </>
  );

  const tabItems = [
    {
      key: 'all',
      label: <span className="flex items-center gap-2"><InboxOutlined />All Movements ({allMovements.length})</span>,
      children: renderFiltersAndTable(allMovements),
    },
    {
      key: 'transfers',
      label: <span className="flex items-center gap-2"><SwapOutlined />Transfers ({transfers.length})</span>,
      children: renderFiltersAndTable(transfers),
    },
    {
      key: 'relocations',
      label: <span className="flex items-center gap-2"><ArrowRightOutlined />Relocations ({relocations.length})</span>,
      children: renderFiltersAndTable(relocations),
    },
  ];

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              Inventory Movements
            </h1>
            <p className="text-gray-600 mt-1">Track stock movements between locations</p>
          </div>
          <Button type="primary" icon={<PlusOutlined />} size="large">
            New Movement
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <div className="text-center">
              <p className="text-gray-500 text-sm">Total Movements</p>
              <p className="text-3xl font-bold text-blue-600">{allMovements.length}</p>
            </div>
          </Card>
          <Card>
            <div className="text-center">
              <p className="text-gray-500 text-sm">Transfers</p>
              <p className="text-3xl font-bold text-green-600">{transfers.length}</p>
            </div>
          </Card>
          <Card>
            <div className="text-center">
              <p className="text-gray-500 text-sm">Relocations</p>
              <p className="text-3xl font-bold text-orange-600">{relocations.length}</p>
            </div>
          </Card>
          <Card>
            <div className="text-center">
              <p className="text-gray-500 text-sm">Items Moved</p>
              <p className="text-3xl font-bold text-purple-600">{mockData.reduce((sum, m) => sum + m.quantity, 0)}</p>
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
