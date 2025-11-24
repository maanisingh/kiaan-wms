'use client';

import React from 'react';

import { Card, Descriptions, Tag, Button, Tabs, Timeline, Space, Table } from 'antd';
import { ArrowLeftOutlined, CheckOutlined, CloseOutlined } from '@ant-design/icons';
import Link from 'next/link';
import { formatDate, formatCurrency } from '@/lib/utils';

export default function ReturnDetailPage({ params }: { params: { id: string } }) {
  const [activeTab, setActiveTab] = React.useState('details');

  const returnOrder = {
    id: params.id,
    rmaNumber: `RMA-${String(params.id).padStart(3, '0')}`,
    orderNumber: 'SO-2024-034',
    customer: 'Acme Corporation',
    status: 'processing',
    type: 'Return',
    reason: 'Damaged',
    requestedDate: '2024-11-10',
    approvedDate: '2024-11-12',
    value: 245,
  };

  const items = [
    { id: '1', sku: 'LAP-001', name: 'Laptop Computer', quantity: 1, condition: 'Damaged', refundAmount: 245 },
  ];

  const timeline = [
    { time: '2024-11-10 14:30', status: 'Return Requested', user: 'Customer' },
    { time: '2024-11-12 09:15', status: 'Return Approved', user: 'John Doe' },
    { time: '2024-11-14 11:20', status: 'Item Received', user: 'Jane Smith' },
    { time: '2024-11-14 15:45', status: 'Quality Inspection', user: 'Mike Johnson' },
  ];

  const itemColumns = [
    { title: 'SKU', dataIndex: 'sku', key: 'sku', width: 120 },
    { title: 'Product Name', dataIndex: 'name', key: 'name', width: 250 },
    { title: 'Quantity', dataIndex: 'quantity', key: 'quantity', width: 100 },
    { title: 'Condition', dataIndex: 'condition', key: 'condition', width: 120, render: (c: string) => <Tag color="red">{c}</Tag> },
    { title: 'Refund Amount', dataIndex: 'refundAmount', key: 'refund', width: 120, render: (v: number) => formatCurrency(v) },
  ];

  const tabItems = [
    {
      key: 'details',
      label: 'Return Details',
      children: (
        <div className="space-y-6">
          <Card title="RMA Information">
            <Descriptions column={2} bordered>
              <Descriptions.Item label="RMA Number">{returnOrder.rmaNumber}</Descriptions.Item>
              <Descriptions.Item label="Order Number">{returnOrder.orderNumber}</Descriptions.Item>
              <Descriptions.Item label="Customer">{returnOrder.customer}</Descriptions.Item>
              <Descriptions.Item label="Type"><Tag color="purple">{returnOrder.type}</Tag></Descriptions.Item>
              <Descriptions.Item label="Reason">{returnOrder.reason}</Descriptions.Item>
              <Descriptions.Item label="Status"><Tag color="blue">{returnOrder.status}</Tag></Descriptions.Item>
              <Descriptions.Item label="Requested Date">{formatDate(returnOrder.requestedDate)}</Descriptions.Item>
              <Descriptions.Item label="Approved Date">{formatDate(returnOrder.approvedDate)}</Descriptions.Item>
              <Descriptions.Item label="Total Value">{formatCurrency(returnOrder.value)}</Descriptions.Item>
            </Descriptions>
          </Card>
          <Card title="Returned Items">
            <Table dataSource={items} columns={itemColumns} rowKey="id" pagination={false} />
          </Card>
        </div>
      ),
    },
    {
      key: 'timeline',
      label: 'Timeline',
      children: (
        <Card title="Return Timeline">
          <Timeline>
            {timeline.map((event, index) => (
              <Timeline.Item key={index} color="blue">
                <div className="font-semibold">{event.status}</div>
                <div className="text-sm text-gray-600">{event.time} - {event.user}</div>
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
            <Link href="/returns">
              <Button icon={<ArrowLeftOutlined />}>Back to Returns</Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold">RMA {returnOrder.rmaNumber}</h1>
              <p className="text-gray-600 mt-1">{returnOrder.customer} - {returnOrder.orderNumber}</p>
            </div>
          </div>
          <Space>
            <Button icon={<CheckOutlined />} type="primary" size="large">Approve Refund</Button>
            <Button icon={<CloseOutlined />} danger size="large">Reject</Button>
          </Space>
        </div>

        <Card className="shadow-sm">
          <Tabs activeKey={activeTab} onChange={setActiveTab} items={tabItems} size="large" />
        </Card>
      </div>
      );
}
