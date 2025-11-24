'use client';

import React from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, Descriptions, Tag, Table, Button, Tabs, Space, Timeline } from 'antd';
import { ArrowLeftOutlined, EditOutlined, PrinterOutlined, CheckCircleOutlined, ClockCircleOutlined } from '@ant-design/icons';
import Link from 'next/link';
import { formatDate, formatCurrency } from '@/lib/utils';

export default function FulfillmentDetailPage({ params }: { params: { id: string } }) {
  const [activeTab, setActiveTab] = React.useState('details');

  // Mock data
  const order = {
    id: params.id,
    orderNumber: `SO-2024-${String(params.id).padStart(3, '0')}`,
    customer: 'Acme Corporation',
    status: 'picking',
    priority: 'high',
    orderDate: '2024-11-15',
    dueDate: '2024-11-20',
    totalValue: 12450,
    items: 5,
    shippingAddress: '123 Main St, New York, NY 10001',
    billingAddress: '123 Main St, New York, NY 10001',
  };

  const items = [
    { id: '1', sku: 'LAP-001', name: 'Laptop Computer', quantity: 10, picked: 10, location: 'A-01-05', status: 'picked' },
    { id: '2', sku: 'MOU-002', name: 'Wireless Mouse', quantity: 25, picked: 15, location: 'B-03-12', status: 'picking' },
    { id: '3', sku: 'KEY-003', name: 'Mechanical Keyboard', quantity: 15, picked: 0, location: 'B-03-14', status: 'pending' },
  ];

  const timeline = [
    { time: '2024-11-15 10:30', status: 'Order Received', user: 'System', color: 'green' },
    { time: '2024-11-15 11:45', status: 'Order Validated', user: 'John Doe', color: 'green' },
    { time: '2024-11-16 09:15', status: 'Picking Started', user: 'Jane Smith', color: 'blue' },
    { time: '2024-11-16 14:30', status: 'Picking In Progress', user: 'Jane Smith', color: 'blue' },
  ];

  const itemColumns = [
    { title: 'SKU', dataIndex: 'sku', key: 'sku', width: 120 },
    { title: 'Product Name', dataIndex: 'name', key: 'name', width: 250 },
    { title: 'Location', dataIndex: 'location', key: 'location', width: 120 },
    { title: 'Ordered', dataIndex: 'quantity', key: 'quantity', width: 100 },
    { title: 'Picked', dataIndex: 'picked', key: 'picked', width: 100 },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status: string) => {
        const colors = { picked: 'green', picking: 'blue', pending: 'orange' };
        return <Tag color={colors[status as keyof typeof colors]}>{status}</Tag>;
      }
    },
  ];

  const tabItems = [
    {
      key: 'details',
      label: 'Order Details',
      children: (
        <div className="space-y-6">
          <Card title="Order Information">
            <Descriptions column={2} bordered>
              <Descriptions.Item label="Order Number">{order.orderNumber}</Descriptions.Item>
              <Descriptions.Item label="Customer">{order.customer}</Descriptions.Item>
              <Descriptions.Item label="Order Date">{formatDate(order.orderDate)}</Descriptions.Item>
              <Descriptions.Item label="Due Date">{formatDate(order.dueDate)}</Descriptions.Item>
              <Descriptions.Item label="Status">
                <Tag color="blue">{order.status}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Priority">
                <Tag color={order.priority === 'high' ? 'red' : 'orange'}>{order.priority}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Total Value">{formatCurrency(order.totalValue)}</Descriptions.Item>
              <Descriptions.Item label="Total Items">{order.items}</Descriptions.Item>
              <Descriptions.Item label="Shipping Address" span={2}>{order.shippingAddress}</Descriptions.Item>
              <Descriptions.Item label="Billing Address" span={2}>{order.billingAddress}</Descriptions.Item>
            </Descriptions>
          </Card>

          <Card title="Order Items">
            <Table
              dataSource={items}
              columns={itemColumns}
              rowKey="id"
              pagination={false}
              scroll={{ x: 1000 }}
            />
          </Card>
        </div>
      ),
    },
    {
      key: 'timeline',
      label: 'Timeline',
      children: (
        <Card title="Order Timeline">
          <Timeline>
            {timeline.map((event, index) => (
              <Timeline.Item key={index} color={event.color}>
                <div className="font-semibold">{event.status}</div>
                <div className="text-sm text-gray-600">{event.time} - {event.user}</div>
              </Timeline.Item>
            ))}
          </Timeline>
        </Card>
      ),
    },
    {
      key: 'documents',
      label: 'Documents',
      children: (
        <Card title="Order Documents">
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 border rounded">
              <div>
                <div className="font-semibold">Pick List</div>
                <div className="text-sm text-gray-600">Generated: {formatDate(order.orderDate)}</div>
              </div>
              <Button icon={<PrinterOutlined />}>Print</Button>
            </div>
            <div className="flex items-center justify-between p-4 border rounded">
              <div>
                <div className="font-semibold">Packing Slip</div>
                <div className="text-sm text-gray-600">Not generated yet</div>
              </div>
              <Button disabled icon={<PrinterOutlined />}>Print</Button>
            </div>
            <div className="flex items-center justify-between p-4 border rounded">
              <div>
                <div className="font-semibold">Shipping Label</div>
                <div className="text-sm text-gray-600">Not generated yet</div>
              </div>
              <Button disabled icon={<PrinterOutlined />}>Print</Button>
            </div>
          </div>
        </Card>
      ),
    },
  ];

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Link href="/fulfillment">
              <Button icon={<ArrowLeftOutlined />}>Back to Fulfillment</Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold">Order {order.orderNumber}</h1>
              <p className="text-gray-600 mt-1">{order.customer}</p>
            </div>
          </div>
          <Space>
            <Button icon={<PrinterOutlined />} size="large">Print</Button>
            <Button icon={<EditOutlined />} type="primary" size="large">Edit Order</Button>
          </Space>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <div className="text-center">
              <p className="text-gray-500 text-sm">Order Value</p>
              <p className="text-2xl font-bold text-blue-600">{formatCurrency(order.totalValue)}</p>
            </div>
          </Card>
          <Card>
            <div className="text-center">
              <p className="text-gray-500 text-sm">Items</p>
              <p className="text-2xl font-bold text-purple-600">{order.items}</p>
            </div>
          </Card>
          <Card>
            <div className="text-center">
              <p className="text-gray-500 text-sm">Picked</p>
              <p className="text-2xl font-bold text-green-600">{items.reduce((acc, item) => acc + item.picked, 0)}</p>
            </div>
          </Card>
          <Card>
            <div className="text-center">
              <p className="text-gray-500 text-sm">Progress</p>
              <p className="text-2xl font-bold text-orange-600">60%</p>
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
