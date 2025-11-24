'use client';

import React from 'react';

import { Card, Descriptions, Tag, Button, Tabs, Timeline } from 'antd';
import { ArrowLeftOutlined, PrinterOutlined, SwapOutlined } from '@ant-design/icons';
import Link from 'next/link';
import { formatDate } from '@/lib/utils';

export default function MovementDetailPage({ params }: { params: { id: string } }) {
  const [activeTab, setActiveTab] = React.useState('details');

  const movement = {
    id: params.id,
    date: params.id.includes('001') ? '2024-01-15T10:30:00' : params.id.includes('002') ? '2024-01-14T14:20:00' : '2024-01-13T09:15:00',
    productName: params.id.includes('001') ? 'Laptop Computer' : params.id.includes('002') ? 'Office Chair' : 'Wireless Mouse',
    sku: params.id.includes('001') ? 'LAP-001' : params.id.includes('002') ? 'CHR-002' : 'MOU-003',
    fromLocation: params.id.includes('001') ? 'A-01' : params.id.includes('002') ? 'B-02' : 'C-03',
    toLocation: params.id.includes('001') ? 'B-02' : params.id.includes('002') ? 'C-03' : 'A-01',
    quantity: params.id.includes('001') ? 10 : params.id.includes('002') ? 5 : 25,
    type: params.id.includes('003') ? 'Relocation' : 'Transfer',
    user: params.id.includes('002') ? 'Jane Smith' : params.id.includes('003') ? 'Mike Johnson' : 'John Doe',
    reason: 'Stock rebalancing',
    status: 'completed',
    batchNumber: params.id.includes('001') ? 'BATCH-001' : params.id.includes('002') ? 'BATCH-002' : 'BATCH-003',
  };

  const history = [
    { time: movement.date, action: 'Movement completed', user: movement.user, location: movement.toLocation },
    { time: new Date(new Date(movement.date).getTime() - 10 * 60000).toISOString(), action: 'Items picked from source', user: movement.user, location: movement.fromLocation },
    { time: new Date(new Date(movement.date).getTime() - 20 * 60000).toISOString(), action: 'Movement initiated', user: movement.user, location: movement.fromLocation },
  ];

  const tabItems = [
    {
      key: 'details',
      label: 'Movement Details',
      children: (
        <Card title="Stock Movement Information">
          <Descriptions column={2} bordered>
            <Descriptions.Item label="Movement ID">{movement.id}</Descriptions.Item>
            <Descriptions.Item label="Status">
              <Tag color="green">Completed</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Date & Time">{formatDate(movement.date)}</Descriptions.Item>
            <Descriptions.Item label="Type">
              <Tag color="blue">{movement.type}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Product">{movement.productName}</Descriptions.Item>
            <Descriptions.Item label="SKU">{movement.sku}</Descriptions.Item>
            <Descriptions.Item label="From Location">
              <Tag color="orange">{movement.fromLocation}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="To Location">
              <Tag color="green">{movement.toLocation}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Quantity">{movement.quantity}</Descriptions.Item>
            <Descriptions.Item label="Batch Number">{movement.batchNumber}</Descriptions.Item>
            <Descriptions.Item label="User">{movement.user}</Descriptions.Item>
            <Descriptions.Item label="Reason">{movement.reason}</Descriptions.Item>
          </Descriptions>
        </Card>
      ),
    },
    {
      key: 'history',
      label: 'Movement History',
      children: (
        <Card title="Movement Timeline">
          <Timeline>
            {history.map((event, index) => (
              <Timeline.Item
                key={index}
                color={index === 0 ? 'green' : 'blue'}
                dot={index === 0 ? <SwapOutlined style={{ fontSize: '16px' }} /> : undefined}
              >
                <div className="font-semibold">{event.action}</div>
                <div className="text-sm text-gray-600">{formatDate(event.time)} - {event.user}</div>
                <div className="text-sm text-gray-500">Location: {event.location}</div>
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
            <Link href="/inventory">
              <Button icon={<ArrowLeftOutlined />}>Back to Inventory</Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold">{movement.id}</h1>
              <p className="text-gray-600 mt-1">{movement.fromLocation} → {movement.toLocation}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button icon={<PrinterOutlined />} size="large">Print</Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <div className="text-center">
              <p className="text-gray-500 text-sm">Quantity Moved</p>
              <p className="text-2xl font-bold text-blue-600">{movement.quantity}</p>
            </div>
          </Card>
          <Card>
            <div className="text-center">
              <p className="text-gray-500 text-sm">From Location</p>
              <p className="text-2xl font-bold text-orange-600">{movement.fromLocation}</p>
            </div>
          </Card>
          <Card>
            <div className="text-center">
              <p className="text-gray-500 text-sm">To Location</p>
              <p className="text-2xl font-bold text-green-600">{movement.toLocation}</p>
            </div>
          </Card>
          <Card>
            <div className="text-center">
              <p className="text-gray-500 text-sm">Type</p>
              <p className="text-2xl font-bold text-purple-600">{movement.type}</p>
            </div>
          </Card>
        </div>

        <Card className="shadow-sm">
          <Tabs activeKey={activeTab} onChange={setActiveTab} items={tabItems} size="large" />
        </Card>
      </div>
      );
}
