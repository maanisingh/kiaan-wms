'use client';

import React from 'react';

import { Card, Descriptions, Tag, Button, Tabs, Timeline, Table } from 'antd';
import { ArrowLeftOutlined, CheckCircleOutlined, PrinterOutlined, UserOutlined, RocketOutlined } from '@ant-design/icons';
import Link from 'next/link';
import { formatDate } from '@/lib/utils';

export default function PackingDetailPage({ params }: { params: { id: string } }) {
  const [activeTab, setActiveTab] = React.useState('details');

  const packingSlip = {
    id: params.id,
    packingSlip: `PACK-${String(params.id).padStart(3, '0')}`,
    orderNumber: `SO-2024-${String(45 + parseInt(params.id)).padStart(3, '0')}`,
    packer: params.id === '1' ? 'Mike Johnson' : params.id === '2' ? 'Sarah Lee' : 'Tom Davis',
    status: params.id === '1' ? 'packing' : params.id === '2' ? 'ready_to_pack' : params.id === '3' ? 'packed' : 'ready_to_ship',
    items: params.id === '1' ? 12 : params.id === '2' ? 8 : params.id === '3' ? 15 : 6,
    weight: params.id === '1' ? '15.5 kg' : params.id === '2' ? '8.2 kg' : params.id === '3' ? '22.1 kg' : '5.8 kg',
    priority: params.id === '1' ? 'high' : params.id === '2' ? 'medium' : params.id === '3' ? 'low' : 'high',
    createdDate: '2024-11-15',
    startedTime: params.id !== '2' ? '2024-11-17 09:30' : null,
    completedTime: params.id === '3' || params.id === '4' ? '2024-11-17 10:45' : null,
    carrier: 'UPS',
    trackingNumber: params.id === '4' ? 'UPS123456789' : null,
  };

  const packingHistory = [
    { time: '2024-11-17 10:45', action: 'Packed', item: 'Wireless Mouse (5 units)', box: 'Box 1' },
    { time: '2024-11-17 10:30', action: 'Packed', item: 'USB Keyboard (3 units)', box: 'Box 1' },
    { time: '2024-11-17 10:15', action: 'Added', item: 'Bubble wrap and padding', box: 'Box 1' },
    { time: '2024-11-17 09:30', action: 'Started', item: 'Packing slip created', box: 'N/A' },
  ];

  const items = [
    { id: '1', sku: 'PROD-001', name: 'Wireless Mouse', quantity: 5, weight: '1.2 kg', box: 'Box 1', status: 'packed' },
    { id: '2', sku: 'PROD-002', name: 'USB Keyboard', quantity: 3, weight: '3.5 kg', box: 'Box 1', status: 'packed' },
    { id: '3', sku: 'PROD-003', name: 'Laptop Stand', quantity: 2, weight: '8.0 kg', box: 'Box 2', status: 'packed' },
    { id: '4', sku: 'PROD-004', name: 'Phone Holder', quantity: 2, weight: '0.8 kg', box: 'Box 2', status: 'pending' },
  ];

  const itemColumns = [
    { title: 'SKU', dataIndex: 'sku', key: 'sku', width: 120 },
    { title: 'Item Name', dataIndex: 'name', key: 'name', width: 200 },
    { title: 'Quantity', dataIndex: 'quantity', key: 'quantity', width: 100 },
    { title: 'Weight', dataIndex: 'weight', key: 'weight', width: 100 },
    { title: 'Box', dataIndex: 'box', key: 'box', width: 100, render: (text: string) => <Tag color="blue">{text}</Tag> },
    { title: 'Status', dataIndex: 'status', key: 'status', width: 120, render: (status: string) => <Tag color={status === 'packed' ? 'green' : 'orange'}>{status}</Tag> },
  ];

  const tabItems = [
    {
      key: 'details',
      label: 'Packing Details',
      children: (
        <div className="space-y-6">
          <Card title="Packing Slip Information">
            <Descriptions column={2} bordered>
              <Descriptions.Item label="Packing Slip">{packingSlip.packingSlip}</Descriptions.Item>
              <Descriptions.Item label="Order Number">{packingSlip.orderNumber}</Descriptions.Item>
              <Descriptions.Item label="Packer">
                <Tag icon={<UserOutlined />} color="blue">{packingSlip.packer}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Status">
                <Tag color={
                  packingSlip.status === 'ready_to_ship' ? 'green' :
                  packingSlip.status === 'packed' ? 'cyan' :
                  packingSlip.status === 'packing' ? 'blue' : 'orange'
                }>
                  {packingSlip.status.replace(/_/g, ' ')}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Priority">
                <Tag color={packingSlip.priority === 'high' ? 'red' : packingSlip.priority === 'medium' ? 'orange' : 'blue'}>
                  {packingSlip.priority}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Total Items">{packingSlip.items}</Descriptions.Item>
              <Descriptions.Item label="Total Weight">{packingSlip.weight}</Descriptions.Item>
              <Descriptions.Item label="Created Date">{formatDate(packingSlip.createdDate)}</Descriptions.Item>
              {packingSlip.startedTime && (
                <Descriptions.Item label="Started Time">{packingSlip.startedTime}</Descriptions.Item>
              )}
              {packingSlip.completedTime && (
                <Descriptions.Item label="Completed Time">{packingSlip.completedTime}</Descriptions.Item>
              )}
              {packingSlip.carrier && (
                <Descriptions.Item label="Carrier">{packingSlip.carrier}</Descriptions.Item>
              )}
              {packingSlip.trackingNumber && (
                <Descriptions.Item label="Tracking Number">
                  <code className="bg-gray-100 px-2 py-1 rounded">{packingSlip.trackingNumber}</code>
                </Descriptions.Item>
              )}
            </Descriptions>
          </Card>

          <Card title="Items in Package">
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
      label: 'Packing History',
      children: (
        <Card title="Activity Log">
          <Timeline>
            {packingHistory.map((event, index) => (
              <Timeline.Item
                key={index}
                color={event.action === 'Packed' ? 'green' : 'blue'}
                dot={event.action === 'Packed' ? <CheckCircleOutlined style={{ fontSize: '16px' }} /> : undefined}
              >
                <div className="font-semibold">{event.action}: {event.item}</div>
                <div className="text-sm text-gray-600">{event.time}</div>
                <div className="text-sm text-gray-500">Box: {event.box}</div>
              </Timeline.Item>
            ))}
          </Timeline>
        </Card>
      ),
    },
  ];

  return (
    <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Link href="/packing">
              <Button icon={<ArrowLeftOutlined />}>Back to Packing</Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold">{packingSlip.packingSlip}</h1>
              <p className="text-gray-600 mt-1">Order: {packingSlip.orderNumber}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button icon={<PrinterOutlined />} size="large">Print Label</Button>
            {packingSlip.status === 'packed' && (
              <Button icon={<RocketOutlined />} type="primary" size="large">Ready to Ship</Button>
            )}
            {packingSlip.status !== 'packed' && packingSlip.status !== 'ready_to_ship' && (
              <Button icon={<CheckCircleOutlined />} type="primary" size="large">Mark Packed</Button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <div className="text-center">
              <p className="text-gray-500 text-sm">Total Items</p>
              <p className="text-2xl font-bold text-blue-600">{packingSlip.items}</p>
            </div>
          </Card>
          <Card>
            <div className="text-center">
              <p className="text-gray-500 text-sm">Packed</p>
              <p className="text-2xl font-bold text-green-600">{items.filter(i => i.status === 'packed').length}</p>
            </div>
          </Card>
          <Card>
            <div className="text-center">
              <p className="text-gray-500 text-sm">Total Weight</p>
              <p className="text-2xl font-bold text-purple-600">{packingSlip.weight}</p>
            </div>
          </Card>
          <Card>
            <div className="text-center">
              <p className="text-gray-500 text-sm">Boxes</p>
              <p className="text-2xl font-bold text-orange-600">2</p>
            </div>
          </Card>
        </div>

        <Card className="shadow-sm">
          <Tabs activeKey={activeTab} onChange={setActiveTab} items={tabItems} size="large" />
        </Card>
      </div>
      );
}
