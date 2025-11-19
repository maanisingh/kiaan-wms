'use client';

import React from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, Descriptions, Tag, Button, Tabs, Timeline, Table } from 'antd';
import { ArrowLeftOutlined, CheckCircleOutlined, PrinterOutlined, UserOutlined } from '@ant-design/icons';
import Link from 'next/link';
import { formatDate } from '@/lib/utils';

export default function PickingDetailPage({ params }: { params: { id: string } }) {
  const [activeTab, setActiveTab] = React.useState('details');

  const pickList = {
    id: params.id,
    pickListNumber: `PICK-${String(params.id).padStart(3, '0')}`,
    orderNumber: `SO-2024-${String(45 + parseInt(params.id)).padStart(3, '0')}`,
    picker: params.id === '1' ? 'John Doe' : params.id === '2' ? 'Jane Smith' : 'Bob Wilson',
    status: params.id === '1' ? 'in_progress' : params.id === '2' ? 'pending' : 'completed',
    items: params.id === '1' ? 12 : params.id === '2' ? 8 : 15,
    zone: params.id === '1' ? 'A1' : params.id === '2' ? 'B2' : 'A1',
    priority: params.id === '1' ? 'high' : params.id === '2' ? 'medium' : 'low',
    createdDate: '2024-11-15',
    startedTime: params.id !== '2' ? '2024-11-17 09:30' : null,
    completedTime: params.id === '3' ? '2024-11-17 10:45' : null,
  };

  const pickingHistory = [
    { time: '2024-11-17 10:45', action: 'Picked', item: 'Wireless Mouse', quantity: 5, location: 'A1-23-B' },
    { time: '2024-11-17 10:30', action: 'Picked', item: 'USB Keyboard', quantity: 3, location: 'A1-25-C' },
    { time: '2024-11-17 10:15', action: 'Picked', item: 'Laptop Stand', quantity: 2, location: 'A1-22-A' },
    { time: '2024-11-17 09:30', action: 'Started', item: 'Pick list assigned', quantity: 0, location: 'Zone A1' },
  ];

  const items = [
    { id: '1', sku: 'PROD-001', name: 'Wireless Mouse', quantity: 5, location: 'A1-23-B', status: 'picked' },
    { id: '2', sku: 'PROD-002', name: 'USB Keyboard', quantity: 3, location: 'A1-25-C', status: 'picked' },
    { id: '3', sku: 'PROD-003', name: 'Laptop Stand', quantity: 2, location: 'A1-22-A', status: 'picked' },
    { id: '4', sku: 'PROD-004', name: 'Phone Holder', quantity: 2, location: 'A1-24-D', status: 'pending' },
  ];

  const itemColumns = [
    { title: 'SKU', dataIndex: 'sku', key: 'sku', width: 120 },
    { title: 'Item Name', dataIndex: 'name', key: 'name', width: 200 },
    { title: 'Quantity', dataIndex: 'quantity', key: 'quantity', width: 100 },
    { title: 'Location', dataIndex: 'location', key: 'location', width: 120, render: (text: string) => <code className="bg-gray-100 px-2 py-1 rounded">{text}</code> },
    { title: 'Status', dataIndex: 'status', key: 'status', width: 120, render: (status: string) => <Tag color={status === 'picked' ? 'green' : 'orange'}>{status}</Tag> },
  ];

  const tabItems = [
    {
      key: 'details',
      label: 'Pick List Details',
      children: (
        <div className="space-y-6">
          <Card title="Pick List Information">
            <Descriptions column={2} bordered>
              <Descriptions.Item label="Pick List Number">{pickList.pickListNumber}</Descriptions.Item>
              <Descriptions.Item label="Order Number">{pickList.orderNumber}</Descriptions.Item>
              <Descriptions.Item label="Picker">
                <Tag icon={<UserOutlined />} color="blue">{pickList.picker}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Status">
                <Tag color={pickList.status === 'completed' ? 'green' : pickList.status === 'in_progress' ? 'blue' : 'orange'}>
                  {pickList.status.replace('_', ' ')}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Zone">{pickList.zone}</Descriptions.Item>
              <Descriptions.Item label="Priority">
                <Tag color={pickList.priority === 'high' ? 'red' : pickList.priority === 'medium' ? 'orange' : 'blue'}>
                  {pickList.priority}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Total Items">{pickList.items}</Descriptions.Item>
              <Descriptions.Item label="Created Date">{formatDate(pickList.createdDate)}</Descriptions.Item>
              {pickList.startedTime && (
                <Descriptions.Item label="Started Time">{pickList.startedTime}</Descriptions.Item>
              )}
              {pickList.completedTime && (
                <Descriptions.Item label="Completed Time">{pickList.completedTime}</Descriptions.Item>
              )}
            </Descriptions>
          </Card>

          <Card title="Items to Pick">
            <Table
              dataSource={items}
              columns={itemColumns}
              rowKey="id"
              pagination={false}
            />
          </Card>
        </div>
      ),
    },
    {
      key: 'history',
      label: 'Picking History',
      children: (
        <Card title="Activity Log">
          <Timeline>
            {pickingHistory.map((event, index) => (
              <Timeline.Item
                key={index}
                color={event.action === 'Picked' ? 'green' : 'blue'}
                dot={event.action === 'Picked' ? <CheckCircleOutlined style={{ fontSize: '16px' }} /> : undefined}
              >
                <div className="font-semibold">{event.action}: {event.item}</div>
                <div className="text-sm text-gray-600">{event.time}</div>
                <div className="text-sm text-gray-500">
                  {event.quantity > 0 && `Qty: ${event.quantity} | `}
                  Location: {event.location}
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
            <Link href="/picking">
              <Button icon={<ArrowLeftOutlined />}>Back to Pick Lists</Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold">{pickList.pickListNumber}</h1>
              <p className="text-gray-600 mt-1">Order: {pickList.orderNumber}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button icon={<PrinterOutlined />} size="large">Print</Button>
            {pickList.status !== 'completed' && (
              <Button icon={<CheckCircleOutlined />} type="primary" size="large">Mark Complete</Button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <div className="text-center">
              <p className="text-gray-500 text-sm">Total Items</p>
              <p className="text-2xl font-bold text-blue-600">{pickList.items}</p>
            </div>
          </Card>
          <Card>
            <div className="text-center">
              <p className="text-gray-500 text-sm">Picked</p>
              <p className="text-2xl font-bold text-green-600">{items.filter(i => i.status === 'picked').length}</p>
            </div>
          </Card>
          <Card>
            <div className="text-center">
              <p className="text-gray-500 text-sm">Remaining</p>
              <p className="text-2xl font-bold text-orange-600">{items.filter(i => i.status === 'pending').length}</p>
            </div>
          </Card>
          <Card>
            <div className="text-center">
              <p className="text-gray-500 text-sm">Zone</p>
              <p className="text-2xl font-bold text-purple-600">{pickList.zone}</p>
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
