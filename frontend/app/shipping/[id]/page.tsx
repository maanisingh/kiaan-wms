'use client';

import React from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, Descriptions, Tag, Button, Tabs, Timeline, Space } from 'antd';
import { ArrowLeftOutlined, PrinterOutlined, EnvironmentOutlined } from '@ant-design/icons';
import Link from 'next/link';
import { formatDate } from '@/lib/utils';

export default function ShippingDetailPage({ params }: { params: { id: string } }) {
  const [activeTab, setActiveTab] = React.useState('details');

  const shipment = {
    id: params.id,
    shipmentNumber: `SHP-${String(params.id).padStart(3, '0')}`,
    carrier: 'FedEx',
    tracking: `FX${String(params.id).padStart(9, '0')}`,
    status: 'in-transit',
    origin: 'New York, NY',
    destination: 'Los Angeles, CA',
    shipDate: '2024-11-15',
    estimatedDelivery: '2024-11-20',
    actualDelivery: null,
    weight: '45.5 lbs',
    dimensions: '24" x 18" x 12"',
  };

  const tracking = [
    { time: '2024-11-15 09:00', location: 'New York, NY', status: 'Package picked up', detail: 'Picked up from sender' },
    { time: '2024-11-15 14:30', location: 'Newark, NJ', status: 'In transit', detail: 'Arrived at FedEx facility' },
    { time: '2024-11-16 08:15', location: 'Philadelphia, PA', status: 'In transit', detail: 'Departed FedEx facility' },
    { time: '2024-11-16 18:45', location: 'Chicago, IL', status: 'In transit', detail: 'Arrived at sort facility' },
  ];

  const tabItems = [
    {
      key: 'details',
      label: 'Shipment Details',
      children: (
        <Card title="Shipment Information">
          <Descriptions column={2} bordered>
            <Descriptions.Item label="Shipment Number">{shipment.shipmentNumber}</Descriptions.Item>
            <Descriptions.Item label="Tracking Number">{shipment.tracking}</Descriptions.Item>
            <Descriptions.Item label="Carrier">{shipment.carrier}</Descriptions.Item>
            <Descriptions.Item label="Status"><Tag color="blue">{shipment.status}</Tag></Descriptions.Item>
            <Descriptions.Item label="Origin">{shipment.origin}</Descriptions.Item>
            <Descriptions.Item label="Destination">{shipment.destination}</Descriptions.Item>
            <Descriptions.Item label="Ship Date">{formatDate(shipment.shipDate)}</Descriptions.Item>
            <Descriptions.Item label="Est. Delivery">{formatDate(shipment.estimatedDelivery)}</Descriptions.Item>
            <Descriptions.Item label="Weight">{shipment.weight}</Descriptions.Item>
            <Descriptions.Item label="Dimensions">{shipment.dimensions}</Descriptions.Item>
          </Descriptions>
        </Card>
      ),
    },
    {
      key: 'tracking',
      label: 'Tracking',
      children: (
        <Card title="Tracking History">
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
            <Link href="/shipping">
              <Button icon={<ArrowLeftOutlined />}>Back to Shipping</Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold">Shipment {shipment.shipmentNumber}</h1>
              <p className="text-gray-600 mt-1">{shipment.carrier} - {shipment.tracking}</p>
            </div>
          </div>
          <Space>
            <Button icon={<PrinterOutlined />} size="large">Print Label</Button>
            <Button icon={<EnvironmentOutlined />} type="primary" size="large">Track on Map</Button>
          </Space>
        </div>

        <Card className="shadow-sm">
          <Tabs activeKey={activeTab} onChange={setActiveTab} items={tabItems} size="large" />
        </Card>
      </div>
    </MainLayout>
  );
}
