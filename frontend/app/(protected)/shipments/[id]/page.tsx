'use client';

import React from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, Descriptions, Tag, Button, Tabs, Timeline, Space, Table } from 'antd';
import { ArrowLeftOutlined, PrinterOutlined, TruckOutlined } from '@ant-design/icons';
import Link from 'next/link';
import { formatDate } from '@/lib/utils';

export default function ShipmentDetailPage({ params }: { params: { id: string } }) {
  const [activeTab, setActiveTab] = React.useState('details');

  const shipment = {
    id: params.id,
    shipmentNumber: `SHIP-${String(params.id).padStart(3, '0')}`,
    carrier: 'FedEx',
    tracking: `FDX${String(params.id).padStart(9, '0')}`,
    status: 'in-transit',
    origin: 'New York, NY',
    destination: 'Los Angeles, CA',
    shipDate: '2024-11-15',
    estimatedDelivery: '2024-11-18',
    actualDelivery: null,
    weight: '45 lbs',
    dimensions: '24x18x12 inches',
    orders: 3,
    value: 2500,
  };

  const orders = [
    { id: '1', orderNumber: 'SO-2024-045', customer: 'Acme Corp', items: 5, value: 1200 },
    { id: '2', orderNumber: 'SO-2024-046', customer: 'Tech Start', items: 3, value: 800 },
    { id: '3', orderNumber: 'SO-2024-047', customer: 'Global Trade', items: 2, value: 500 },
  ];

  const tracking = [
    { time: '2024-11-15 09:00', location: 'New York, NY', status: 'Package picked up', detail: 'Picked up from warehouse' },
    { time: '2024-11-15 14:30', location: 'Newark, NJ', status: 'In transit', detail: 'Arrived at FedEx facility' },
    { time: '2024-11-15 22:00', location: 'Philadelphia, PA', status: 'In transit', detail: 'Departed FedEx facility' },
    { time: '2024-11-16 08:15', location: 'Columbus, OH', status: 'In transit', detail: 'Package in transit' },
  ];

  const orderColumns = [
    { title: 'Order #', dataIndex: 'orderNumber', key: 'orderNumber', width: 150 },
    { title: 'Customer', dataIndex: 'customer', key: 'customer', width: 200 },
    { title: 'Items', dataIndex: 'items', key: 'items', width: 80 },
    { title: 'Value', dataIndex: 'value', key: 'value', width: 120, render: (v: number) => `$${v}` },
  ];

  const tabItems = [
    {
      key: 'details',
      label: 'Shipment Details',
      children: (
        <div className="space-y-6">
          <Card title="Shipment Information">
            <Descriptions column={2} bordered>
              <Descriptions.Item label="Shipment Number">{shipment.shipmentNumber}</Descriptions.Item>
              <Descriptions.Item label="Status">
                <Tag color="blue">{shipment.status}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Carrier">{shipment.carrier}</Descriptions.Item>
              <Descriptions.Item label="Tracking Number">{shipment.tracking}</Descriptions.Item>
              <Descriptions.Item label="Origin">{shipment.origin}</Descriptions.Item>
              <Descriptions.Item label="Destination">{shipment.destination}</Descriptions.Item>
              <Descriptions.Item label="Ship Date">{formatDate(shipment.shipDate)}</Descriptions.Item>
              <Descriptions.Item label="Estimated Delivery">{formatDate(shipment.estimatedDelivery)}</Descriptions.Item>
              <Descriptions.Item label="Weight">{shipment.weight}</Descriptions.Item>
              <Descriptions.Item label="Dimensions">{shipment.dimensions}</Descriptions.Item>
              <Descriptions.Item label="Total Value">${shipment.value}</Descriptions.Item>
              <Descriptions.Item label="Orders">{shipment.orders}</Descriptions.Item>
            </Descriptions>
          </Card>
          <Card title="Orders in Shipment">
            <Table dataSource={orders} columns={orderColumns} rowKey="id" pagination={false} />
          </Card>
        </div>
      ),
    },
    {
      key: 'tracking',
      label: 'Tracking History',
      children: (
        <Card title="Tracking Events">
          <Timeline>
            {tracking.map((event, index) => (
              <Timeline.Item key={index} color="blue">
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
    <MainLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Link href="/shipments">
              <Button icon={<ArrowLeftOutlined />}>Back to Shipments</Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold">Shipment {shipment.shipmentNumber}</h1>
              <p className="text-gray-600 mt-1">{shipment.origin} → {shipment.destination}</p>
            </div>
          </div>
          <Space>
            <Button icon={<PrinterOutlined />} size="large">Print Label</Button>
            <Button icon={<TruckOutlined />} type="primary" size="large">Track Package</Button>
          </Space>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <div className="text-center">
              <p className="text-gray-500 text-sm">Carrier</p>
              <p className="text-2xl font-bold text-blue-600">{shipment.carrier}</p>
            </div>
          </Card>
          <Card>
            <div className="text-center">
              <p className="text-gray-500 text-sm">Weight</p>
              <p className="text-2xl font-bold text-green-600">{shipment.weight}</p>
            </div>
          </Card>
          <Card>
            <div className="text-center">
              <p className="text-gray-500 text-sm">Orders</p>
              <p className="text-2xl font-bold text-purple-600">{shipment.orders}</p>
            </div>
          </Card>
          <Card>
            <div className="text-center">
              <p className="text-gray-500 text-sm">Total Value</p>
              <p className="text-2xl font-bold text-orange-600">${shipment.value}</p>
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
