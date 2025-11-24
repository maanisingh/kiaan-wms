'use client';

import React from 'react';

import { Card, Descriptions, Tag, Button, Tabs, Timeline } from 'antd';
import { ArrowLeftOutlined, PrinterOutlined, CheckCircleOutlined } from '@ant-design/icons';
import Link from 'next/link';
import { formatDate } from '@/lib/utils';

export default function AdjustmentDetailPage({ params }: { params: { id: string } }) {
  const [activeTab, setActiveTab] = React.useState('details');

  const adjustment = {
    id: params.id,
    date: '2024-01-15',
    productName: params.id.includes('001') ? 'Laptop Computer' : params.id.includes('002') ? 'Office Chair' : 'Wireless Mouse',
    sku: params.id.includes('001') ? 'LAP-001' : params.id.includes('002') ? 'CHR-002' : 'MOU-003',
    type: params.id.includes('002') ? 'decrease' : 'increase',
    quantity: params.id.includes('001') ? 50 : params.id.includes('002') ? 5 : 100,
    reason: params.id.includes('002') ? 'Damaged items' : params.id.includes('003') ? 'Inventory correction' : 'Purchase receipt',
    user: params.id.includes('002') ? 'Jane Smith' : params.id.includes('003') ? 'Mike Johnson' : 'John Doe',
    location: 'A-01-02',
    beforeQuantity: params.id.includes('001') ? 200 : params.id.includes('002') ? 45 : 150,
    afterQuantity: params.id.includes('001') ? 250 : params.id.includes('002') ? 40 : 250,
    notes: 'Regular stock adjustment as per standard procedure',
    approvedBy: 'Manager',
    approvedDate: '2024-01-15',
  };

  const history = [
    { time: '2024-01-15 14:30', action: 'Approved', user: 'Manager', status: 'Completed' },
    { time: '2024-01-15 14:00', action: 'Submitted for approval', user: adjustment.user, status: 'Pending' },
    { time: '2024-01-15 13:45', action: 'Adjustment created', user: adjustment.user, status: 'Draft' },
  ];

  const tabItems = [
    {
      key: 'details',
      label: 'Adjustment Details',
      children: (
        <Card title="Stock Adjustment Information">
          <Descriptions column={2} bordered>
            <Descriptions.Item label="Adjustment ID">{adjustment.id}</Descriptions.Item>
            <Descriptions.Item label="Date">{formatDate(adjustment.date)}</Descriptions.Item>
            <Descriptions.Item label="Product">{adjustment.productName}</Descriptions.Item>
            <Descriptions.Item label="SKU">{adjustment.sku}</Descriptions.Item>
            <Descriptions.Item label="Type">
              <Tag color={adjustment.type === 'increase' ? 'green' : 'red'}>{adjustment.type}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Quantity">{adjustment.quantity}</Descriptions.Item>
            <Descriptions.Item label="Location">{adjustment.location}</Descriptions.Item>
            <Descriptions.Item label="Reason">{adjustment.reason}</Descriptions.Item>
            <Descriptions.Item label="Before Quantity">{adjustment.beforeQuantity}</Descriptions.Item>
            <Descriptions.Item label="After Quantity">{adjustment.afterQuantity}</Descriptions.Item>
            <Descriptions.Item label="User">{adjustment.user}</Descriptions.Item>
            <Descriptions.Item label="Approved By">{adjustment.approvedBy}</Descriptions.Item>
            <Descriptions.Item label="Approved Date">{formatDate(adjustment.approvedDate)}</Descriptions.Item>
            <Descriptions.Item label="Notes" span={2}>{adjustment.notes}</Descriptions.Item>
          </Descriptions>
        </Card>
      ),
    },
    {
      key: 'history',
      label: 'History',
      children: (
        <Card title="Adjustment History">
          <Timeline>
            {history.map((event, index) => (
              <Timeline.Item
                key={index}
                color={event.status === 'Completed' ? 'green' : 'blue'}
                dot={event.status === 'Completed' ? <CheckCircleOutlined style={{ fontSize: '16px' }} /> : undefined}
              >
                <div className="font-semibold">{event.action}</div>
                <div className="text-sm text-gray-600">{event.time} - {event.user}</div>
                <div className="text-sm">
                  <Tag color={event.status === 'Completed' ? 'green' : event.status === 'Pending' ? 'orange' : 'default'}>{event.status}</Tag>
                </div>
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
              <h1 className="text-3xl font-bold">{adjustment.id}</h1>
              <p className="text-gray-600 mt-1">Stock Adjustment - {adjustment.productName}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button icon={<PrinterOutlined />} size="large">Print</Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <div className="text-center">
              <p className="text-gray-500 text-sm">Type</p>
              <p className="text-2xl font-bold" style={{ color: adjustment.type === 'increase' ? '#52c41a' : '#ff4d4f' }}>
                {adjustment.type}
              </p>
            </div>
          </Card>
          <Card>
            <div className="text-center">
              <p className="text-gray-500 text-sm">Quantity</p>
              <p className="text-2xl font-bold text-blue-600">{adjustment.quantity}</p>
            </div>
          </Card>
          <Card>
            <div className="text-center">
              <p className="text-gray-500 text-sm">Before</p>
              <p className="text-2xl font-bold text-orange-600">{adjustment.beforeQuantity}</p>
            </div>
          </Card>
          <Card>
            <div className="text-center">
              <p className="text-gray-500 text-sm">After</p>
              <p className="text-2xl font-bold text-purple-600">{adjustment.afterQuantity}</p>
            </div>
          </Card>
        </div>

        <Card className="shadow-sm">
          <Tabs activeKey={activeTab} onChange={setActiveTab} items={tabItems} size="large" />
        </Card>
      </div>
      );
}
