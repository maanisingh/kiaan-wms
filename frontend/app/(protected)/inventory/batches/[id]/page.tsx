'use client';

import React from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, Descriptions, Tag, Button, Tabs, Table, Timeline } from 'antd';
import { ArrowLeftOutlined, PrinterOutlined, WarningOutlined } from '@ant-design/icons';
import Link from 'next/link';
import { formatDate } from '@/lib/utils';

export default function BatchDetailPage({ params }: { params: { id: string } }) {
  const [activeTab, setActiveTab] = React.useState('details');

  const batch = {
    id: params.id,
    batchNumber: `BATCH-${String(params.id).padStart(3, '0')}`,
    productName: params.id === '1' ? 'Laptop Computer' : params.id === '2' ? 'Office Chair' : 'Wireless Mouse',
    sku: params.id === '1' ? 'LAP-001' : params.id === '2' ? 'CHR-002' : 'MOU-003',
    quantity: params.id === '1' ? 100 : params.id === '2' ? 50 : 200,
    available: params.id === '1' ? 85 : params.id === '2' ? 45 : 180,
    reserved: params.id === '1' ? 15 : params.id === '2' ? 5 : 20,
    mfgDate: params.id === '1' ? '2024-01-01' : params.id === '2' ? '2023-12-15' : '2024-01-10',
    expiryDate: params.id === '1' ? '2026-01-01' : params.id === '2' ? '2025-12-15' : '2027-01-10',
    status: 'active',
    supplier: 'Tech Suppliers Inc.',
    receiptDate: '2024-01-15',
    storageLocation: 'A-01-05',
  };

  const movements = [
    { id: '1', date: '2024-01-16', type: 'Outbound', quantity: 10, reference: 'SO-001', location: 'A-01-05' },
    { id: '2', date: '2024-01-15', type: 'Inbound', quantity: batch.quantity, reference: 'PO-045', location: 'A-01-05' },
  ];

  const movementColumns = [
    { title: 'Date', dataIndex: 'date', key: 'date', width: 120, render: (date: string) => formatDate(date) },
    { title: 'Type', dataIndex: 'type', key: 'type', width: 120, render: (type: string) => <Tag color={type === 'Inbound' ? 'green' : 'orange'}>{type}</Tag> },
    { title: 'Quantity', dataIndex: 'quantity', key: 'quantity', width: 100 },
    { title: 'Reference', dataIndex: 'reference', key: 'reference', width: 120 },
    { title: 'Location', dataIndex: 'location', key: 'location', width: 120 },
  ];

  const history = [
    { time: '2024-01-16 10:30', action: 'Stock allocated', quantity: 15, reference: 'SO-001' },
    { time: '2024-01-15 14:00', action: 'Batch received', quantity: batch.quantity, reference: 'PO-045' },
    { time: '2024-01-15 09:00', action: 'Batch created', quantity: 0, reference: '-' },
  ];

  const daysUntilExpiry = Math.floor((new Date(batch.expiryDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));

  const tabItems = [
    {
      key: 'details',
      label: 'Batch Details',
      children: (
        <div className="space-y-6">
          <Card title="Batch Information">
            <Descriptions column={2} bordered>
              <Descriptions.Item label="Batch Number">{batch.batchNumber}</Descriptions.Item>
              <Descriptions.Item label="Status">
                <Tag color="green">Active</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Product">{batch.productName}</Descriptions.Item>
              <Descriptions.Item label="SKU">{batch.sku}</Descriptions.Item>
              <Descriptions.Item label="Total Quantity">{batch.quantity}</Descriptions.Item>
              <Descriptions.Item label="Available">{batch.available}</Descriptions.Item>
              <Descriptions.Item label="Reserved">{batch.reserved}</Descriptions.Item>
              <Descriptions.Item label="Storage Location">{batch.storageLocation}</Descriptions.Item>
              <Descriptions.Item label="Manufacturing Date">{formatDate(batch.mfgDate)}</Descriptions.Item>
              <Descriptions.Item label="Expiry Date">
                {formatDate(batch.expiryDate)}
                {daysUntilExpiry < 90 && (
                  <Tag color="warning" icon={<WarningOutlined />} className="ml-2">{daysUntilExpiry} days left</Tag>
                )}
              </Descriptions.Item>
              <Descriptions.Item label="Supplier">{batch.supplier}</Descriptions.Item>
              <Descriptions.Item label="Receipt Date">{formatDate(batch.receiptDate)}</Descriptions.Item>
            </Descriptions>
          </Card>

          <Card title="Stock Movements">
            <Table
              dataSource={movements}
              columns={movementColumns}
              rowKey="id"
              pagination={false}
            />
          </Card>
        </div>
      ),
    },
    {
      key: 'history',
      label: 'History',
      children: (
        <Card title="Batch History">
          <Timeline>
            {history.map((event, index) => (
              <Timeline.Item
                key={index}
                color="blue"
              >
                <div className="font-semibold">{event.action}</div>
                <div className="text-sm text-gray-600">{event.time}</div>
                <div className="text-sm text-gray-500">
                  {event.quantity > 0 && `Quantity: ${event.quantity} | `}
                  Reference: {event.reference}
                </div>
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
            <Link href="/inventory">
              <Button icon={<ArrowLeftOutlined />}>Back to Inventory</Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold">{batch.batchNumber}</h1>
              <p className="text-gray-600 mt-1">{batch.productName}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button icon={<PrinterOutlined />} size="large">Print</Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <div className="text-center">
              <p className="text-gray-500 text-sm">Total Quantity</p>
              <p className="text-2xl font-bold text-blue-600">{batch.quantity}</p>
            </div>
          </Card>
          <Card>
            <div className="text-center">
              <p className="text-gray-500 text-sm">Available</p>
              <p className="text-2xl font-bold text-green-600">{batch.available}</p>
            </div>
          </Card>
          <Card>
            <div className="text-center">
              <p className="text-gray-500 text-sm">Reserved</p>
              <p className="text-2xl font-bold text-orange-600">{batch.reserved}</p>
            </div>
          </Card>
          <Card>
            <div className="text-center">
              <p className="text-gray-500 text-sm">Days to Expiry</p>
              <p className="text-2xl font-bold text-purple-600">{daysUntilExpiry}</p>
            </div>
          </Card>
        </div>

        <Card className="shadow-sm">
          <Tabs activeKey={activeTab} onChange={setActiveTab} items={tabItems} size="large" />
        </Card>
      </div>
    </MainLayout>
  );
}
