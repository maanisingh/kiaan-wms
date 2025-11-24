'use client';

import React from 'react';

import { Card, Descriptions, Tag, Button, Tabs, Timeline, Table } from 'antd';
import { ArrowLeftOutlined, PrinterOutlined, TruckOutlined, CheckCircleOutlined } from '@ant-design/icons';
import Link from 'next/link';
import { formatDate } from '@/lib/utils';

export default function FBATransferDetailPage({ params }: { params: { id: string } }) {
  const [activeTab, setActiveTab] = React.useState('details');

  const transfer = {
    id: params.id,
    shipmentId: `FBA-${String(params.id).padStart(3, '0')}`,
    destination: 'FBA-NYC',
    destinationAddress: '123 Fulfillment Center Dr, New York, NY 10001',
    carrier: 'UPS',
    tracking: `UPS${String(params.id).padStart(9, '0')}`,
    status: 'in_transit',
    items: 45,
    totalValue: 5670,
    weight: '145 lbs',
    createdDate: '2024-11-13',
    shipDate: '2024-11-14',
    estimatedDelivery: '2024-11-18',
    createdBy: 'Admin User',
  };

  const trackingEvents = [
    { time: '2024-11-16 14:30', location: 'Newark, NJ', status: 'In Transit', detail: 'Package is on the way' },
    { time: '2024-11-16 08:45', location: 'Philadelphia, PA', status: 'In Transit', detail: 'Arrived at sorting facility' },
    { time: '2024-11-15 16:20', location: 'Baltimore, MD', status: 'Departed', detail: 'Left origin facility' },
    { time: '2024-11-14 10:00', location: 'Warehouse', status: 'Picked Up', detail: 'Package picked up by carrier' },
    { time: '2024-11-13 15:30', location: 'Warehouse', status: 'Created', detail: 'FBA transfer created' },
  ];

  const items = [
    { id: '1', sku: 'PROD-001', name: 'Wireless Mouse', quantity: 15, unitPrice: 25.99, total: 389.85 },
    { id: '2', sku: 'PROD-002', name: 'USB Keyboard', quantity: 12, unitPrice: 45.99, total: 551.88 },
    { id: '3', sku: 'PROD-003', name: 'Laptop Stand', quantity: 8, unitPrice: 35.50, total: 284.00 },
    { id: '4', sku: 'PROD-004', name: 'Phone Holder', quantity: 10, unitPrice: 15.99, total: 159.90 },
  ];

  const itemColumns = [
    { title: 'SKU', dataIndex: 'sku', key: 'sku', width: 120 },
    { title: 'Product Name', dataIndex: 'name', key: 'name', width: 200 },
    { title: 'Quantity', dataIndex: 'quantity', key: 'quantity', width: 100 },
    { title: 'Unit Price', dataIndex: 'unitPrice', key: 'unitPrice', width: 120, render: (val: number) => `$${val.toFixed(2)}` },
    { title: 'Total', dataIndex: 'total', key: 'total', width: 120, render: (val: number) => `$${val.toFixed(2)}` },
  ];

  const tabItems = [
    {
      key: 'details',
      label: 'Transfer Details',
      children: (
        <div className="space-y-6">
          <Card title="Shipment Information">
            <Descriptions column={2} bordered>
              <Descriptions.Item label="Shipment ID">{transfer.shipmentId}</Descriptions.Item>
              <Descriptions.Item label="Status">
                <Tag color={transfer.status === 'delivered' ? 'green' : transfer.status === 'in_transit' ? 'blue' : 'orange'}>
                  {transfer.status.replace('_', ' ')}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Destination FBA">{transfer.destination}</Descriptions.Item>
              <Descriptions.Item label="Address" span={1}>{transfer.destinationAddress}</Descriptions.Item>
              <Descriptions.Item label="Carrier">{transfer.carrier}</Descriptions.Item>
              <Descriptions.Item label="Tracking Number">{transfer.tracking}</Descriptions.Item>
              <Descriptions.Item label="Total Items">{transfer.items}</Descriptions.Item>
              <Descriptions.Item label="Total Value">${transfer.totalValue.toLocaleString()}</Descriptions.Item>
              <Descriptions.Item label="Weight">{transfer.weight}</Descriptions.Item>
              <Descriptions.Item label="Created Date">{formatDate(transfer.createdDate)}</Descriptions.Item>
              <Descriptions.Item label="Ship Date">{formatDate(transfer.shipDate)}</Descriptions.Item>
              <Descriptions.Item label="Est. Delivery">{formatDate(transfer.estimatedDelivery)}</Descriptions.Item>
            </Descriptions>
          </Card>

          <Card title="Items in Transfer">
            <Table
              dataSource={items}
              columns={itemColumns}
              rowKey="id"
              pagination={false}
              summary={(pageData) => {
                const totalValue = pageData.reduce((sum, record) => sum + record.total, 0);
                const totalQty = pageData.reduce((sum, record) => sum + record.quantity, 0);
                return (
                  <Table.Summary.Row>
                    <Table.Summary.Cell index={0} colSpan={2}>
                      <strong>Total</strong>
                    </Table.Summary.Cell>
                    <Table.Summary.Cell index={2}>
                      <strong>{totalQty}</strong>
                    </Table.Summary.Cell>
                    <Table.Summary.Cell index={3}></Table.Summary.Cell>
                    <Table.Summary.Cell index={4}>
                      <strong>${totalValue.toFixed(2)}</strong>
                    </Table.Summary.Cell>
                  </Table.Summary.Row>
                );
              }}
            />
          </Card>
        </div>
      ),
    },
    {
      key: 'tracking',
      label: 'Tracking History',
      children: (
        <Card title="Shipment Tracking">
          <Timeline>
            {trackingEvents.map((event, index) => (
              <Timeline.Item
                key={index}
                color={index === 0 ? 'blue' : 'gray'}
                dot={index === 0 ? <TruckOutlined style={{ fontSize: '16px' }} /> : undefined}
              >
                <div className="font-semibold">{event.status}</div>
                <div className="text-sm text-gray-600">{event.time} - {event.location}</div>
                <div className="text-sm text-gray-500">{event.detail}</div>
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
            <Link href="/fba-transfers">
              <Button icon={<ArrowLeftOutlined />}>Back to FBA Transfers</Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold">{transfer.shipmentId}</h1>
              <p className="text-gray-600 mt-1">FBA Transfer to {transfer.destination}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button icon={<PrinterOutlined />} size="large">Print Label</Button>
            <Button icon={<CheckCircleOutlined />} type="primary" size="large">Mark Delivered</Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <div className="text-center">
              <p className="text-gray-500 text-sm">Items</p>
              <p className="text-2xl font-bold text-blue-600">{transfer.items}</p>
            </div>
          </Card>
          <Card>
            <div className="text-center">
              <p className="text-gray-500 text-sm">Total Value</p>
              <p className="text-2xl font-bold text-green-600">${transfer.totalValue.toLocaleString()}</p>
            </div>
          </Card>
          <Card>
            <div className="text-center">
              <p className="text-gray-500 text-sm">Weight</p>
              <p className="text-2xl font-bold text-purple-600">{transfer.weight}</p>
            </div>
          </Card>
          <Card>
            <div className="text-center">
              <p className="text-gray-500 text-sm">Tracking Events</p>
              <p className="text-2xl font-bold text-orange-600">{trackingEvents.length}</p>
            </div>
          </Card>
        </div>

        <Card className="shadow-sm">
          <Tabs activeKey={activeTab} onChange={setActiveTab} items={tabItems} size="large" />
        </Card>
      </div>
      );
}
