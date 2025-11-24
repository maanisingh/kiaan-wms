'use client';

import React from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, Descriptions, Tag, Button, Tabs, Timeline, Space, Table } from 'antd';
import { ArrowLeftOutlined, PrinterOutlined, CheckOutlined } from '@ant-design/icons';
import Link from 'next/link';
import { formatDate, formatCurrency } from '@/lib/utils';

export default function TransferDetailPage({ params }: { params: { id: string } }) {
  const [activeTab, setActiveTab] = React.useState('details');

  const transfer = {
    id: params.id,
    transferNumber: `TRN-${String(params.id).padStart(3, '0')}`,
    fromWarehouse: 'NYC Warehouse',
    toWarehouse: 'LA Warehouse',
    status: 'in_transit',
    requestedDate: '2024-11-10',
    shippedDate: '2024-11-12',
    expectedDate: '2024-11-20',
    items: 45,
    value: 12500,
  };

  const items = [
    { id: '1', sku: 'LAP-001', name: 'Laptop Computer', quantity: 10, value: 2500 },
    { id: '2', sku: 'MOU-002', name: 'Wireless Mouse', quantity: 25, value: 500 },
    { id: '3', sku: 'KEY-003', name: 'Mechanical Keyboard', quantity: 10, value: 1500 },
  ];

  const timeline = [
    { time: '2024-11-10 10:00', status: 'Transfer Requested', location: 'NYC Warehouse' },
    { time: '2024-11-11 14:30', status: 'Approved', location: 'NYC Warehouse' },
    { time: '2024-11-12 09:00', status: 'Items Picked', location: 'NYC Warehouse' },
    { time: '2024-11-12 16:45', status: 'Shipped', location: 'NYC Warehouse' },
  ];

  const itemColumns = [
    { title: 'SKU', dataIndex: 'sku', key: 'sku', width: 120 },
    { title: 'Product Name', dataIndex: 'name', key: 'name', width: 250 },
    { title: 'Quantity', dataIndex: 'quantity', key: 'quantity', width: 100 },
    { title: 'Value', dataIndex: 'value', key: 'value', width: 120, render: (v: number) => formatCurrency(v) },
  ];

  const tabItems = [
    {
      key: 'details',
      label: 'Transfer Details',
      children: (
        <div className="space-y-6">
          <Card title="Transfer Information">
            <Descriptions column={2} bordered>
              <Descriptions.Item label="Transfer Number">{transfer.transferNumber}</Descriptions.Item>
              <Descriptions.Item label="Status"><Tag color="blue">{transfer.status}</Tag></Descriptions.Item>
              <Descriptions.Item label="From Warehouse">{transfer.fromWarehouse}</Descriptions.Item>
              <Descriptions.Item label="To Warehouse">{transfer.toWarehouse}</Descriptions.Item>
              <Descriptions.Item label="Requested Date">{formatDate(transfer.requestedDate)}</Descriptions.Item>
              <Descriptions.Item label="Shipped Date">{formatDate(transfer.shippedDate)}</Descriptions.Item>
              <Descriptions.Item label="Expected Date">{formatDate(transfer.expectedDate)}</Descriptions.Item>
              <Descriptions.Item label="Total Items">{transfer.items}</Descriptions.Item>
              <Descriptions.Item label="Total Value">{formatCurrency(transfer.value)}</Descriptions.Item>
            </Descriptions>
          </Card>
          <Card title="Transfer Items">
            <Table dataSource={items} columns={itemColumns} rowKey="id" pagination={false} />
          </Card>
        </div>
      ),
    },
    {
      key: 'timeline',
      label: 'Timeline',
      children: (
        <Card title="Transfer Timeline">
          <Timeline>
            {timeline.map((event, index) => (
              <Timeline.Item key={index} color="blue">
                <div className="font-semibold">{event.status}</div>
                <div className="text-sm text-gray-600">{event.time} - {event.location}</div>
              </Timeline.Item>
            ))}
          </Timeline>
        </Card>
      ),
    },
  ];

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Link href="/transfers">
              <Button icon={<ArrowLeftOutlined />}>Back to Transfers</Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold">Transfer {transfer.transferNumber}</h1>
              <p className="text-gray-600 mt-1">{transfer.fromWarehouse} → {transfer.toWarehouse}</p>
            </div>
          </div>
          <Space>
            <Button icon={<PrinterOutlined />} size="large">Print Transfer</Button>
            <Button icon={<CheckOutlined />} type="primary" size="large">Complete Transfer</Button>
          </Space>
        </div>

        <Card className="shadow-sm">
          <Tabs activeKey={activeTab} onChange={setActiveTab} items={tabItems} size="large" />
        </Card>
      </div>
    </MainLayout>
  );
}
