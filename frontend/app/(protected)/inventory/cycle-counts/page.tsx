'use client';

import React, { useState } from 'react';

import { Table, Button, Input, Card, Tag, Tabs } from 'antd';
import { PlusOutlined, SearchOutlined, EyeOutlined, InboxOutlined, CheckCircleOutlined, ClockCircleOutlined, WarningOutlined } from '@ant-design/icons';
import { formatDate } from '@/lib/utils';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

const { Search } = Input;

export default function CycleCountsPage() {
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const router = useRouter();

  const mockData = [
    { id: 'CC-001', date: '2024-01-15', location: 'A-01', itemsCount: 45, discrepancies: 2, status: 'completed', counter: 'John Doe' },
    { id: 'CC-002', date: '2024-01-14', location: 'B-02', itemsCount: 38, discrepancies: 0, status: 'completed', counter: 'Jane Smith' },
    { id: 'CC-003', date: '2024-01-13', location: 'C-03', itemsCount: 52, discrepancies: 5, status: 'pending', counter: 'Mike Johnson' },
    { id: 'CC-004', date: '2024-01-12', location: 'D-04', itemsCount: 30, discrepancies: 1, status: 'in_progress', counter: 'Sarah Lee' },
  ];

  const columns = [
    {
      title: 'Count ID',
      dataIndex: 'id',
      key: 'id',
      width: 150,
      render: (text: string, record: any) => (
        <Link href={`/inventory/cycle-counts/${record.id}`}>
          <span className="font-medium text-blue-600 cursor-pointer hover:underline">{text}</span>
        </Link>
      )
    },
    { title: 'Date', dataIndex: 'date', key: 'date', width: 120, render: (date: string) => formatDate(date) },
    { title: 'Location', dataIndex: 'location', key: 'location', width: 120 },
    { title: 'Items Counted', dataIndex: 'itemsCount', key: 'items', width: 120 },
    { title: 'Discrepancies', dataIndex: 'discrepancies', key: 'discrepancies', width: 120, render: (val: number) => <span className={val > 0 ? 'text-red-600 font-semibold' : ''}>{val}</span> },
    { title: 'Status', dataIndex: 'status', key: 'status', width: 120, render: (status: string) => <Tag color={status === 'completed' ? 'green' : status === 'in_progress' ? 'blue' : 'orange'}>{status}</Tag> },
    { title: 'Counter', dataIndex: 'counter', key: 'counter', width: 150 },
    {
      title: 'Actions',
      key: 'actions',
      width: 120,
      render: (_: any, record: any) => (
        <Link href={`/inventory/cycle-counts/${record.id}`}>
          <Button type="link" icon={<EyeOutlined />} size="small">View</Button>
        </Link>
      ),
    },
  ];

  const allCounts = mockData;
  const completed = mockData.filter(c => c.status === 'completed');
  const inProgress = mockData.filter(c => c.status === 'in_progress');
  const withDiscrepancies = mockData.filter(c => c.discrepancies > 0);

  const renderFiltersAndTable = (dataSource: any[]) => (
    <>
      <div className="flex gap-4 mb-4">
        <Search placeholder="Search cycle counts..." style={{ width: 300 }} prefix={<SearchOutlined />} />
      </div>
      <Table
        columns={columns}
        dataSource={dataSource}
        rowKey="id"
        loading={loading}
        scroll={{ x: 1100 }}
        onRow={(record) => ({
          onClick: () => router.push(`/inventory/cycle-counts/${record.id}`),
          style: { cursor: 'pointer' }
        })}
      />
    </>
  );

  const tabItems = [
    {
      key: 'all',
      label: <span className="flex items-center gap-2"><InboxOutlined />All Counts ({allCounts.length})</span>,
      children: renderFiltersAndTable(allCounts),
    },
    {
      key: 'completed',
      label: <span className="flex items-center gap-2"><CheckCircleOutlined />Completed ({completed.length})</span>,
      children: renderFiltersAndTable(completed),
    },
    {
      key: 'in_progress',
      label: <span className="flex items-center gap-2"><ClockCircleOutlined />In Progress ({inProgress.length})</span>,
      children: renderFiltersAndTable(inProgress),
    },
    {
      key: 'discrepancies',
      label: <span className="flex items-center gap-2"><WarningOutlined />With Discrepancies ({withDiscrepancies.length})</span>,
      children: renderFiltersAndTable(withDiscrepancies),
    },
  ];

  return (
    <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
              Cycle Counts
            </h1>
            <p className="text-gray-600 mt-1">Track inventory cycle counting operations</p>
          </div>
          <Button type="primary" icon={<PlusOutlined />} size="large">
            Start Count
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <div className="text-center">
              <p className="text-gray-500 text-sm">Total Counts</p>
              <p className="text-3xl font-bold text-blue-600">{allCounts.length}</p>
            </div>
          </Card>
          <Card>
            <div className="text-center">
              <p className="text-gray-500 text-sm">Completed</p>
              <p className="text-3xl font-bold text-green-600">{completed.length}</p>
            </div>
          </Card>
          <Card>
            <div className="text-center">
              <p className="text-gray-500 text-sm">In Progress</p>
              <p className="text-3xl font-bold text-orange-600">{inProgress.length}</p>
            </div>
          </Card>
          <Card>
            <div className="text-center">
              <p className="text-gray-500 text-sm">Discrepancies</p>
              <p className="text-3xl font-bold text-red-600">{mockData.reduce((sum, c) => sum + c.discrepancies, 0)}</p>
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
      );
}
