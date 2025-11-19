'use client';

import React, { useState, useEffect } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, Button, Tag, Descriptions, Table, Space, Tabs, Row, Col, Statistic, Progress } from 'antd';
import {
  ArrowLeftOutlined,
  EditOutlined,
  HomeOutlined,
  EnvironmentOutlined,
  InboxOutlined,
  TeamOutlined,
  BarChartOutlined,
} from '@ant-design/icons';
import { useRouter, useParams } from 'next/navigation';
import { formatDate, getStatusColor, calculatePercentage } from '@/lib/utils';
import { mockWarehouses } from '@/lib/mockData';
import Link from 'next/link';

export default function WarehouseDetailPage() {
  const router = useRouter();
  const params = useParams();
  const [warehouse, setWarehouse] = useState<any>(null);

  useEffect(() => {
    // Simulate fetching warehouse data
    console.log('Searching for warehouse:', params.id);
    console.log('Available warehouses:', mockWarehouses.map(w => w.id));
    const foundWarehouse = mockWarehouses.find((w) => w.id === params.id);
    console.log('Found warehouse:', foundWarehouse);
    if (foundWarehouse) {
      setWarehouse(foundWarehouse);
    }
  }, [params.id]);

  if (!warehouse) {
    return (
      <MainLayout>
        <div className="text-center py-12">
          <h2 className="text-2xl">Warehouse not found</h2>
          <Button className="mt-4" onClick={() => router.push('/warehouses')}>
            Back to Warehouses
          </Button>
        </div>
      </MainLayout>
    );
  }

  const utilizationPercent = calculatePercentage(warehouse.capacity.used, warehouse.capacity.total);

  const zonesColumns = [
    {
      title: 'Zone Name',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      render: (type: string) => <Tag color="blue">{type}</Tag>,
    },
    {
      title: 'Locations',
      dataIndex: 'locations',
      key: 'locations',
    },
    {
      title: 'Capacity',
      dataIndex: 'capacity',
      key: 'capacity',
    },
    {
      title: 'Used',
      dataIndex: 'used',
      key: 'used',
    },
    {
      title: 'Utilization',
      key: 'utilization',
      render: (_: any, record: any) => (
        <Progress percent={calculatePercentage(record.used, record.capacity)} size="small" />
      ),
    },
  ];

  // Mock zones data
  const zonesData = [
    { id: '1', name: 'Zone A', type: 'Storage', locations: 120, capacity: 5000, used: 3200 },
    { id: '2', name: 'Zone B', type: 'Picking', locations: 80, capacity: 3000, used: 2100 },
    { id: '3', name: 'Zone C', type: 'Packing', locations: 40, capacity: 2000, used: 1500 },
  ];

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-4">
            <Button
              icon={<ArrowLeftOutlined />}
              onClick={() => router.back()}
            >
              Back
            </Button>
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-2">
                <HomeOutlined className="text-blue-600" />
                {warehouse.name}
              </h1>
              <p className="text-gray-600 mt-1">Code: {warehouse.code}</p>
            </div>
          </div>
          <Space>
            <Link href={`/warehouses/${warehouse.id}/edit`}>
              <Button icon={<EditOutlined />} type="primary" size="large">
                Edit Warehouse
              </Button>
            </Link>
          </Space>
        </div>

        {/* Stats */}
        <Row gutter={16}>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="Status"
                value={warehouse.status}
                valueStyle={{ color: '#3f8600' }}
                prefix={<Tag color="green">{warehouse.status.toUpperCase()}</Tag>}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="Capacity Utilization"
                value={utilizationPercent}
                suffix="%"
                prefix={<InboxOutlined />}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="Total Locations"
                value={240}
                prefix={<EnvironmentOutlined />}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="Staff"
                value={warehouse.staff || 25}
                prefix={<TeamOutlined />}
              />
            </Card>
          </Col>
        </Row>

        {/* Capacity Indicator */}
        <Card>
          <h3 className="text-lg font-semibold mb-4">Storage Capacity</h3>
          <Progress
            percent={utilizationPercent}
            status={utilizationPercent > 80 ? 'exception' : utilizationPercent > 60 ? 'normal' : 'active'}
            strokeWidth={20}
          />
          <div className="flex justify-between mt-2 text-gray-600">
            <span>Used: {warehouse.capacity.used.toLocaleString()} {warehouse.capacity.unit}</span>
            <span>Total: {warehouse.capacity.total.toLocaleString()} {warehouse.capacity.unit}</span>
          </div>
        </Card>

        {/* Warehouse Details */}
        <Card>
          <Tabs
            defaultActiveKey="details"
            items={[
              {
                key: 'details',
                label: 'Warehouse Details',
                children: (
                  <Descriptions column={2} bordered>
                    <Descriptions.Item label="Code">{warehouse.code}</Descriptions.Item>
                    <Descriptions.Item label="Type">
                      <Tag color="blue">{warehouse.type}</Tag>
                    </Descriptions.Item>
                    <Descriptions.Item label="Status">
                      <Tag color={getStatusColor(warehouse.status)} className="uppercase">
                        {warehouse.status}
                      </Tag>
                    </Descriptions.Item>
                    <Descriptions.Item label="Manager">{warehouse.manager || 'Not assigned'}</Descriptions.Item>
                    <Descriptions.Item label="Address" span={2}>
                      <div className="flex items-start gap-2">
                        <EnvironmentOutlined className="mt-1" />
                        <div>
                          {warehouse.address.street}<br />
                          {warehouse.address.city}, {warehouse.address.state} {warehouse.address.zipCode}<br />
                          {warehouse.address.country}
                        </div>
                      </div>
                    </Descriptions.Item>
                    <Descriptions.Item label="Total Capacity">
                      {warehouse.capacity.total.toLocaleString()} {warehouse.capacity.unit}
                    </Descriptions.Item>
                    <Descriptions.Item label="Used Capacity">
                      {warehouse.capacity.used.toLocaleString()} {warehouse.capacity.unit}
                    </Descriptions.Item>
                    <Descriptions.Item label="Phone">{warehouse.contact?.phone || '-'}</Descriptions.Item>
                    <Descriptions.Item label="Email">{warehouse.contact?.email || '-'}</Descriptions.Item>
                    <Descriptions.Item label="Operating Hours" span={2}>
                      {warehouse.operatingHours || 'Monday - Friday, 8:00 AM - 6:00 PM'}
                    </Descriptions.Item>
                  </Descriptions>
                ),
              },
              {
                key: 'zones',
                label: (
                  <span>
                    <EnvironmentOutlined /> Zones
                  </span>
                ),
                children: (
                  <div>
                    <div className="mb-4 flex justify-between items-center">
                      <h3 className="text-lg font-semibold">Warehouse Zones</h3>
                      <Link href="/warehouses/zones">
                        <Button type="primary">Manage Zones</Button>
                      </Link>
                    </div>
                    <Table
                      dataSource={zonesData}
                      columns={zonesColumns}
                      rowKey="id"
                      pagination={false}
                    />
                  </div>
                ),
              },
              {
                key: 'locations',
                label: (
                  <span>
                    <EnvironmentOutlined /> Locations
                  </span>
                ),
                children: (
                  <div className="text-center py-8">
                    <Link href="/warehouses/locations">
                      <Button type="primary" size="large">
                        View All Locations
                      </Button>
                    </Link>
                  </div>
                ),
              },
              {
                key: 'analytics',
                label: (
                  <span>
                    <BarChartOutlined /> Analytics
                  </span>
                ),
                children: (
                  <div className="text-center py-8 text-gray-500">
                    <BarChartOutlined style={{ fontSize: 48 }} />
                    <p className="mt-4">Analytics and reports coming soon</p>
                  </div>
                ),
              },
            ]}
          />
        </Card>
      </div>
    </MainLayout>
  );
}
