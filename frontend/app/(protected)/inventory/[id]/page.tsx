'use client';

import React, { useState, useEffect } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import {
  Card,
  Button,
  Tag,
  Descriptions,
  Table,
  Space,
  Tabs,
  Row,
  Col,
  Statistic,
  Alert,
  Progress,
  Timeline,
} from 'antd';
import {
  ArrowLeftOutlined,
  EditOutlined,
  InboxOutlined,
  WarningOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  EnvironmentOutlined,
  BarcodeOutlined,
  CalendarOutlined,
} from '@ant-design/icons';
import { useRouter, useParams } from 'next/navigation';
import { formatCurrency, formatDate, getStatusColor } from '@/lib/utils';
import Link from 'next/link';

export default function InventoryDetailPage() {
  const router = useRouter();
  const params = useParams();
  const [inventory, setInventory] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchInventoryDetails();
  }, [params.id]);

  const fetchInventoryDetails = async () => {
    try {
      const response = await fetch(`/api/inventory/${params.id}`);
      if (response.ok) {
        const data = await response.json();
        setInventory(data);
      }
    } catch (error) {
      console.error('Failed to fetch inventory:', error);
    } finally {
      setLoading(false);
    }
  };

  // Mock data for demonstration
  const mockInventory = inventory || {
    id: params.id,
    sku: 'NAKD-CSHW-35G',
    productName: 'Nakd Cashew Cookie Bar 35g',
    brand: 'Nakd',
    type: 'SINGLE',
    lotNumber: 'LOT-2024-11-15-001',
    batchNumber: 'BATCH-NK-2024-Q4',
    bestBeforeDate: '2026-06-08',
    manufactureDate: '2024-11-15',
    receivedDate: '2024-11-16',
    warehouse: 'Main Warehouse',
    zone: 'A - Dry Food Storage',
    location: 'A-02-15-C',
    quantity: 144,
    available: 120,
    reserved: 24,
    damaged: 0,
    unitCost: 0.85,
    status: 'active',
  };

  // Calculate days until expiry
  const calculateDaysUntilExpiry = (bbDate: string) => {
    const today = new Date();
    const expiry = new Date(bbDate);
    const diffTime = expiry.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const daysUntilExpiry = calculateDaysUntilExpiry(mockInventory.bestBeforeDate);

  const getExpiryStatus = (days: number) => {
    if (days < 0) return { color: 'red', text: 'EXPIRED', icon: <WarningOutlined /> };
    if (days <= 30) return { color: 'red', text: 'EXPIRING SOON', icon: <WarningOutlined /> };
    if (days <= 90) return { color: 'orange', text: 'APPROACHING EXPIRY', icon: <ClockCircleOutlined /> };
    return { color: 'green', text: 'FRESH', icon: <CheckCircleOutlined /> };
  };

  const expiryStatus = getExpiryStatus(daysUntilExpiry);

  // FEFO Priority (lower number = picked first)
  const fefoRank = daysUntilExpiry < 180 ? 1 : daysUntilExpiry < 365 ? 2 : 3;

  // Mock movement history
  const movementHistory = [
    {
      id: '1',
      date: '2024-11-18',
      type: 'Pick',
      reference: 'SO-1234',
      quantity: -24,
      location: 'A-02-15-C',
      user: 'John Smith',
    },
    {
      id: '2',
      date: '2024-11-16',
      type: 'Receive',
      reference: 'PO-5678',
      quantity: 144,
      location: 'A-02-15-C',
      user: 'System',
    },
  ];

  // Mock related orders
  const relatedOrders = [
    {
      id: '1',
      orderNumber: 'SO-1234',
      channel: 'Amazon FBA UK',
      type: 'B2B',
      quantity: 24,
      status: 'picked',
      date: '2024-11-18',
    },
  ];

  // Replenishment settings
  const replenSettings = {
    minLevel: 50,
    maxLevel: 200,
    reorderPoint: 75,
    reorderQuantity: 144,
    currentLevel: mockInventory.quantity,
  };

  const replenProgress = (replenSettings.currentLevel / replenSettings.maxLevel) * 100;
  const needsReplen = replenSettings.currentLevel < replenSettings.minLevel;

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-4">
            <Button
              icon={<ArrowLeftOutlined />}
              onClick={() => router.push('/inventory')}
            >
              Back to Inventory
            </Button>
            <div>
              <h1 className="text-3xl font-bold">{mockInventory.productName}</h1>
              <p className="text-gray-600 mt-1">
                SKU: {mockInventory.sku} | Lot: {mockInventory.lotNumber}
              </p>
            </div>
          </div>
          <Space>
            <Button icon={<EditOutlined />} type="primary" size="large">
              Adjust Inventory
            </Button>
          </Space>
        </div>

        {/* Expiry Alert */}
        {daysUntilExpiry <= 90 && (
          <Alert
            message={`${expiryStatus.text} - ${daysUntilExpiry} days until expiry`}
            description={
              daysUntilExpiry <= 30
                ? 'Urgent: This inventory will expire soon. Prioritize for FEFO picking or mark for disposal.'
                : 'Warning: Consider discounting or prioritizing this inventory to avoid waste.'
            }
            type={daysUntilExpiry <= 30 ? 'error' : 'warning'}
            showIcon
            icon={expiryStatus.icon}
          />
        )}

        {/* Statistics */}
        <Row gutter={16}>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="Quantity Available"
                value={mockInventory.available}
                prefix={<InboxOutlined />}
                suffix="units"
                valueStyle={{ color: '#3f8600' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="Reserved"
                value={mockInventory.reserved}
                suffix="units"
                valueStyle={{ color: '#cf1322' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="Days Until Expiry"
                value={daysUntilExpiry}
                suffix="days"
                prefix={<CalendarOutlined />}
                valueStyle={{ color: expiryStatus.color }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="Total Value"
                value={mockInventory.quantity * mockInventory.unitCost}
                prefix="£"
                precision={2}
              />
            </Card>
          </Col>
        </Row>

        {/* Inventory Details Tabs */}
        <Card>
          <Tabs
            defaultActiveKey="details"
            items={[
              {
                key: 'details',
                label: (
                  <span>
                    <InboxOutlined /> Inventory Details
                  </span>
                ),
                children: (
                  <div className="space-y-6">
                    {/* Product & Lot Information */}
                    <Card title="Product & Lot Information" size="small">
                      <Descriptions column={2} bordered>
                        <Descriptions.Item label="SKU">
                          {mockInventory.sku}
                        </Descriptions.Item>
                        <Descriptions.Item label="Product Type">
                          <Tag color="blue" className="uppercase">
                            {mockInventory.type}
                          </Tag>
                        </Descriptions.Item>
                        <Descriptions.Item label="Product Name" span={2}>
                          {mockInventory.productName}
                        </Descriptions.Item>
                        <Descriptions.Item label="Brand">
                          <Tag color="purple">{mockInventory.brand}</Tag>
                        </Descriptions.Item>
                        <Descriptions.Item label="Status">
                          <Tag color={getStatusColor(mockInventory.status)}>
                            {mockInventory.status.toUpperCase()}
                          </Tag>
                        </Descriptions.Item>
                      </Descriptions>
                    </Card>

                    {/* CRITICAL: Best-Before & Lot Tracking */}
                    <Card
                      title={
                        <span className="text-lg">
                          <CalendarOutlined className="mr-2" />
                          Best-Before Date & Lot Tracking
                        </span>
                      }
                      size="small"
                      className="border-2 border-orange-400"
                    >
                      <Descriptions column={2} bordered>
                        <Descriptions.Item
                          label={
                            <span className="font-bold text-red-600">
                              Best-Before Date
                            </span>
                          }
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-xl font-bold text-red-600">
                              {formatDate(mockInventory.bestBeforeDate)}
                            </span>
                            <Tag color={expiryStatus.color} className="ml-2">
                              {expiryStatus.text}
                            </Tag>
                          </div>
                        </Descriptions.Item>
                        <Descriptions.Item label="Days Until Expiry">
                          <span
                            className="text-xl font-bold"
                            style={{ color: expiryStatus.color }}
                          >
                            {daysUntilExpiry} days
                          </span>
                        </Descriptions.Item>
                        <Descriptions.Item label="Lot Number">
                          <div className="flex items-center gap-2">
                            <BarcodeOutlined className="text-blue-600" />
                            <span className="font-mono font-semibold">
                              {mockInventory.lotNumber}
                            </span>
                          </div>
                        </Descriptions.Item>
                        <Descriptions.Item label="Batch Number">
                          <span className="font-mono">
                            {mockInventory.batchNumber}
                          </span>
                        </Descriptions.Item>
                        <Descriptions.Item label="Manufacture Date">
                          {formatDate(mockInventory.manufactureDate)}
                        </Descriptions.Item>
                        <Descriptions.Item label="Received Date">
                          {formatDate(mockInventory.receivedDate)}
                        </Descriptions.Item>
                        <Descriptions.Item label="FEFO Priority" span={2}>
                          <div className="flex items-center gap-2">
                            <Tag
                              color={
                                fefoRank === 1
                                  ? 'red'
                                  : fefoRank === 2
                                  ? 'orange'
                                  : 'green'
                              }
                              className="text-lg font-bold"
                            >
                              RANK {fefoRank}
                            </Tag>
                            <span className="text-sm text-gray-600">
                              {fefoRank === 1
                                ? 'PICK FIRST - Expiring soonest'
                                : fefoRank === 2
                                ? 'Pick second priority'
                                : 'Pick last - Freshest stock'}
                            </span>
                          </div>
                        </Descriptions.Item>
                      </Descriptions>
                    </Card>

                    {/* Location Information */}
                    <Card
                      title={
                        <span>
                          <EnvironmentOutlined className="mr-2" />
                          Location Details
                        </span>
                      }
                      size="small"
                    >
                      <Descriptions column={2} bordered>
                        <Descriptions.Item label="Warehouse">
                          {mockInventory.warehouse}
                        </Descriptions.Item>
                        <Descriptions.Item label="Zone">
                          {mockInventory.zone}
                        </Descriptions.Item>
                        <Descriptions.Item label="Bin Location" span={2}>
                          <div className="flex items-center gap-2">
                            <EnvironmentOutlined className="text-blue-600 text-xl" />
                            <span className="text-xl font-bold">
                              {mockInventory.location}
                            </span>
                          </div>
                        </Descriptions.Item>
                      </Descriptions>
                    </Card>

                    {/* Quantity Breakdown */}
                    <Card title="Quantity Breakdown" size="small">
                      <Descriptions column={2} bordered>
                        <Descriptions.Item label="Total Quantity">
                          <span className="text-lg font-bold">
                            {mockInventory.quantity} units
                          </span>
                        </Descriptions.Item>
                        <Descriptions.Item label="Unit Cost">
                          {formatCurrency(mockInventory.unitCost)}
                        </Descriptions.Item>
                        <Descriptions.Item label="Available">
                          <span className="text-green-600 font-semibold">
                            {mockInventory.available} units
                          </span>
                        </Descriptions.Item>
                        <Descriptions.Item label="Reserved">
                          <span className="text-orange-600 font-semibold">
                            {mockInventory.reserved} units
                          </span>
                        </Descriptions.Item>
                        <Descriptions.Item label="Damaged">
                          <span className="text-red-600">
                            {mockInventory.damaged} units
                          </span>
                        </Descriptions.Item>
                        <Descriptions.Item label="Total Value">
                          <span className="text-lg font-bold">
                            {formatCurrency(
                              mockInventory.quantity * mockInventory.unitCost
                            )}
                          </span>
                        </Descriptions.Item>
                      </Descriptions>
                    </Card>
                  </div>
                ),
              },
              {
                key: 'replenishment',
                label: 'Replenishment',
                children: (
                  <div className="space-y-4">
                    {needsReplen && (
                      <Alert
                        message="Replenishment Needed"
                        description={`Current stock (${replenSettings.currentLevel}) is below minimum level (${replenSettings.minLevel}). Create replenishment task.`}
                        type="error"
                        showIcon
                        action={
                          <Button type="primary" danger>
                            Create Replen Task
                          </Button>
                        }
                      />
                    )}
                    <Card title="Replenishment Settings">
                      <div className="space-y-4">
                        <div>
                          <div className="flex justify-between mb-2">
                            <span>Current Level: {replenSettings.currentLevel}</span>
                            <span>Max: {replenSettings.maxLevel}</span>
                          </div>
                          <Progress
                            percent={replenProgress}
                            status={needsReplen ? 'exception' : 'normal'}
                            strokeColor={
                              needsReplen ? '#cf1322' : '#52c41a'
                            }
                          />
                        </div>
                        <Descriptions column={2} bordered>
                          <Descriptions.Item label="Min Stock Level">
                            <span className="font-semibold">
                              {replenSettings.minLevel} units
                            </span>
                          </Descriptions.Item>
                          <Descriptions.Item label="Max Stock Level">
                            <span className="font-semibold">
                              {replenSettings.maxLevel} units
                            </span>
                          </Descriptions.Item>
                          <Descriptions.Item label="Reorder Point">
                            {replenSettings.reorderPoint} units
                          </Descriptions.Item>
                          <Descriptions.Item label="Reorder Quantity">
                            {replenSettings.reorderQuantity} units
                          </Descriptions.Item>
                        </Descriptions>
                      </div>
                    </Card>
                  </div>
                ),
              },
              {
                key: 'movements',
                label: 'Movement History',
                children: (
                  <Table
                    columns={[
                      {
                        title: 'Date',
                        dataIndex: 'date',
                        key: 'date',
                        render: (date: string) => formatDate(date),
                      },
                      {
                        title: 'Type',
                        dataIndex: 'type',
                        key: 'type',
                        render: (type: string) => (
                          <Tag
                            color={
                              type === 'Receive'
                                ? 'green'
                                : type === 'Pick'
                                ? 'blue'
                                : 'orange'
                            }
                          >
                            {type}
                          </Tag>
                        ),
                      },
                      {
                        title: 'Reference',
                        dataIndex: 'reference',
                        key: 'reference',
                      },
                      {
                        title: 'Quantity',
                        dataIndex: 'quantity',
                        key: 'quantity',
                        render: (qty: number) => (
                          <span
                            className={
                              qty > 0 ? 'text-green-600' : 'text-red-600'
                            }
                          >
                            {qty > 0 ? '+' : ''}
                            {qty}
                          </span>
                        ),
                      },
                      {
                        title: 'Location',
                        dataIndex: 'location',
                        key: 'location',
                      },
                      {
                        title: 'User',
                        dataIndex: 'user',
                        key: 'user',
                      },
                    ]}
                    dataSource={movementHistory}
                    rowKey="id"
                    pagination={false}
                  />
                ),
              },
              {
                key: 'orders',
                label: 'Related Orders',
                children: (
                  <Table
                    columns={[
                      {
                        title: 'Order Number',
                        dataIndex: 'orderNumber',
                        key: 'orderNumber',
                        render: (num: string) => (
                          <Link href={`/sales-orders/${num}`}>{num}</Link>
                        ),
                      },
                      {
                        title: 'Channel',
                        dataIndex: 'channel',
                        key: 'channel',
                        render: (channel: string) => (
                          <Tag color="orange">{channel}</Tag>
                        ),
                      },
                      {
                        title: 'Type',
                        dataIndex: 'type',
                        key: 'type',
                        render: (type: string) => (
                          <Tag
                            color={type === 'B2B' ? 'purple' : 'blue'}
                            className="font-semibold"
                          >
                            {type}
                          </Tag>
                        ),
                      },
                      {
                        title: 'Quantity Used',
                        dataIndex: 'quantity',
                        key: 'quantity',
                      },
                      {
                        title: 'Status',
                        dataIndex: 'status',
                        key: 'status',
                        render: (status: string) => (
                          <Tag color="green">{status.toUpperCase()}</Tag>
                        ),
                      },
                      {
                        title: 'Date',
                        dataIndex: 'date',
                        key: 'date',
                        render: (date: string) => formatDate(date),
                      },
                    ]}
                    dataSource={relatedOrders}
                    rowKey="id"
                    pagination={false}
                  />
                ),
              },
            ]}
          />
        </Card>
      </div>
    </MainLayout>
  );
}
