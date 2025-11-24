'use client';

import React from 'react';

import { Card, Descriptions, Tag, Button, Tabs, Table, Timeline } from 'antd';
import { ArrowLeftOutlined, PrinterOutlined, CheckCircleOutlined, WarningOutlined } from '@ant-design/icons';
import Link from 'next/link';
import { formatDate } from '@/lib/utils';

export default function CycleCountDetailPage({ params }: { params: { id: string } }) {
  const [activeTab, setActiveTab] = React.useState('details');

  const cycleCount = {
    id: params.id,
    date: '2024-01-15',
    location: params.id.includes('001') ? 'A-01' : params.id.includes('002') ? 'B-02' : 'C-03',
    itemsCount: params.id.includes('001') ? 45 : params.id.includes('002') ? 38 : 52,
    discrepancies: params.id.includes('001') ? 2 : params.id.includes('002') ? 0 : 5,
    status: params.id.includes('003') ? 'pending' : 'completed',
    counter: params.id.includes('002') ? 'Jane Smith' : params.id.includes('003') ? 'Mike Johnson' : 'John Doe',
    startTime: '2024-01-15 09:00',
    endTime: params.id.includes('003') ? null : '2024-01-15 11:30',
    accuracy: params.id.includes('001') ? 95.6 : params.id.includes('002') ? 100.0 : null,
  };

  const items = [
    { id: '1', sku: 'PROD-001', product: 'Wireless Mouse', expected: 50, counted: params.id.includes('001') ? 48 : 50, variance: params.id.includes('001') ? -2 : 0, status: params.id.includes('001') ? 'discrepancy' : 'match' },
    { id: '2', sku: 'PROD-002', product: 'USB Keyboard', expected: 30, counted: 30, variance: 0, status: 'match' },
    { id: '3', sku: 'PROD-003', product: 'Laptop Stand', expected: 20, counted: params.id.includes('003') ? 15 : 20, variance: params.id.includes('003') ? -5 : 0, status: params.id.includes('003') ? 'discrepancy' : 'match' },
  ];

  const itemColumns = [
    { title: 'SKU', dataIndex: 'sku', key: 'sku', width: 120 },
    { title: 'Product', dataIndex: 'product', key: 'product', width: 200 },
    { title: 'Expected', dataIndex: 'expected', key: 'expected', width: 100 },
    { title: 'Counted', dataIndex: 'counted', key: 'counted', width: 100 },
    {
      title: 'Variance',
      dataIndex: 'variance',
      key: 'variance',
      width: 100,
      render: (val: number) => (
        <span className={val === 0 ? 'text-green-600' : 'text-red-600 font-semibold'}>
          {val > 0 ? `+${val}` : val}
        </span>
      )
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status: string) => <Tag color={status === 'match' ? 'green' : 'red'}>{status}</Tag>
    },
  ];

  const history = [
    { time: '2024-01-15 11:30', action: 'Cycle count completed', user: cycleCount.counter, status: 'Completed' },
    { time: '2024-01-15 10:45', action: 'Discrepancies noted', user: cycleCount.counter, status: 'In Progress' },
    { time: '2024-01-15 09:00', action: 'Cycle count started', user: cycleCount.counter, status: 'In Progress' },
    { time: '2024-01-14 16:00', action: 'Cycle count scheduled', user: 'System', status: 'Scheduled' },
  ];

  const tabItems = [
    {
      key: 'details',
      label: 'Count Details',
      children: (
        <div className="space-y-6">
          <Card title="Cycle Count Information">
            <Descriptions column={2} bordered>
              <Descriptions.Item label="Count ID">{cycleCount.id}</Descriptions.Item>
              <Descriptions.Item label="Status">
                <Tag color={cycleCount.status === 'completed' ? 'green' : 'orange'}>{cycleCount.status}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Location">{cycleCount.location}</Descriptions.Item>
              <Descriptions.Item label="Counter">{cycleCount.counter}</Descriptions.Item>
              <Descriptions.Item label="Date">{formatDate(cycleCount.date)}</Descriptions.Item>
              <Descriptions.Item label="Items Counted">{cycleCount.itemsCount}</Descriptions.Item>
              <Descriptions.Item label="Start Time">{cycleCount.startTime}</Descriptions.Item>
              <Descriptions.Item label="End Time">{cycleCount.endTime || 'In Progress'}</Descriptions.Item>
              <Descriptions.Item label="Discrepancies">
                {cycleCount.discrepancies > 0 ? (
                  <Tag color="red" icon={<WarningOutlined />}>{cycleCount.discrepancies}</Tag>
                ) : (
                  <Tag color="green" icon={<CheckCircleOutlined />}>{cycleCount.discrepancies}</Tag>
                )}
              </Descriptions.Item>
              <Descriptions.Item label="Accuracy">
                {cycleCount.accuracy ? `${cycleCount.accuracy}%` : 'Pending'}
              </Descriptions.Item>
            </Descriptions>
          </Card>

          <Card title="Counted Items">
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
      label: 'History',
      children: (
        <Card title="Count History">
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
                  <Tag color={event.status === 'Completed' ? 'green' : event.status === 'Scheduled' ? 'default' : 'blue'}>{event.status}</Tag>
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
              <h1 className="text-3xl font-bold">{cycleCount.id}</h1>
              <p className="text-gray-600 mt-1">Cycle Count - {cycleCount.location}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button icon={<PrinterOutlined />} size="large">Print</Button>
            {cycleCount.status !== 'completed' && (
              <Button icon={<CheckCircleOutlined />} type="primary" size="large">Complete Count</Button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <div className="text-center">
              <p className="text-gray-500 text-sm">Items Counted</p>
              <p className="text-2xl font-bold text-blue-600">{cycleCount.itemsCount}</p>
            </div>
          </Card>
          <Card>
            <div className="text-center">
              <p className="text-gray-500 text-sm">Discrepancies</p>
              <p className="text-2xl font-bold text-red-600">{cycleCount.discrepancies}</p>
            </div>
          </Card>
          <Card>
            <div className="text-center">
              <p className="text-gray-500 text-sm">Accuracy</p>
              <p className="text-2xl font-bold text-green-600">{cycleCount.accuracy ? `${cycleCount.accuracy}%` : 'N/A'}</p>
            </div>
          </Card>
          <Card>
            <div className="text-center">
              <p className="text-gray-500 text-sm">Status</p>
              <p className="text-2xl font-bold text-purple-600">{cycleCount.status}</p>
            </div>
          </Card>
        </div>

        <Card className="shadow-sm">
          <Tabs activeKey={activeTab} onChange={setActiveTab} items={tabItems} size="large" />
        </Card>
      </div>
      );
}
