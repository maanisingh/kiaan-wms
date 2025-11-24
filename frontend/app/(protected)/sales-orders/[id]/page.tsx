'use client';

import React, { useState, useEffect } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, Button, Tag, Descriptions, Table, Space, Timeline, Divider, Row, Col } from 'antd';
import {
  ArrowLeftOutlined,
  EditOutlined,
  PrinterOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  ShopOutlined,
  CalendarOutlined,
  WarningOutlined,
  GlobalOutlined,
} from '@ant-design/icons';
import { useRouter, useParams } from 'next/navigation';
import { formatCurrency, formatDate, getStatusColor } from '@/lib/utils';
import { mockSalesOrders } from '@/lib/mockData';

export default function SalesOrderDetailPage() {
  const router = useRouter();
  const params = useParams();
  const [order, setOrder] = useState<any>(null);

  useEffect(() => {
    // Simulate fetching order data
    const foundOrder = mockSalesOrders.find((o) => o.id === params.id);
    if (foundOrder) {
      setOrder(foundOrder);
    }
  }, [params.id]);

  if (!order) {
    return (
      <MainLayout>
        <div className="text-center py-12">
          <h2 className="text-2xl">Order not found</h2>
        </div>
      </MainLayout>
    );
  }

  const itemColumns = [
    {
      title: 'Product',
      dataIndex: ['product', 'name'],
      key: 'product',
    },
    {
      title: 'SKU',
      dataIndex: ['product', 'sku'],
      key: 'sku',
    },
    {
      title: 'Quantity',
      dataIndex: 'quantity',
      key: 'quantity',
    },
    {
      title: 'Best-Before Date',
      key: 'bestBefore',
      render: (record: any) => {
        // Mock BB date - in real app this would come from allocated inventory
        const bbDate = '2026-06-08';
        const daysUntilExpiry = Math.floor((new Date(bbDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
        return (
          <span className={daysUntilExpiry < 180 ? 'text-orange-600 font-semibold' : ''}>
            {formatDate(bbDate)}
            {daysUntilExpiry < 180 && <WarningOutlined className="ml-1" />}
          </span>
        );
      },
    },
    {
      title: 'Lot Number',
      key: 'lotNumber',
      render: () => <span className="font-mono text-xs">LOT-2024-11-15-001</span>,
    },
    {
      title: 'Unit Price',
      dataIndex: 'unitPrice',
      key: 'unitPrice',
      render: (price: number) => formatCurrency(price),
    },
    {
      title: 'Total',
      dataIndex: 'total',
      key: 'total',
      render: (total: number) => formatCurrency(total),
    },
  ];

  const timeline = [
    { status: 'Created', date: order.orderDate, completed: true },
    { status: 'Confirmed', date: order.confirmedDate, completed: order.status !== 'pending' },
    { status: 'Allocated', date: order.allocatedDate, completed: ['allocated', 'picking', 'packing', 'shipped'].includes(order.status) },
    { status: 'Picking', date: order.pickingDate, completed: ['picking', 'packing', 'shipped'].includes(order.status) },
    { status: 'Packing', date: order.packingDate, completed: ['packing', 'shipped'].includes(order.status) },
    { status: 'Shipped', date: order.shippedDate, completed: order.status === 'shipped' },
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
              <h1 className="text-3xl font-bold">Order {order.orderNumber}</h1>
              <p className="text-gray-600 mt-1">
                Created on {formatDate(order.orderDate)}
              </p>
            </div>
          </div>
          <Space>
            <Button icon={<PrinterOutlined />} size="large">
              Print
            </Button>
            <Button icon={<EditOutlined />} type="primary" size="large">
              Edit Order
            </Button>
          </Space>
        </div>

        {/* B2B/B2C Badge and Channel */}
        <Card>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <Tag color={order.channel === 'B2B' || order.channel === 'Wholesale' ? 'blue' : 'green'} style={{ fontSize: 18, padding: '8px 16px' }}>
                <ShopOutlined /> {order.channel === 'B2B' || order.channel === 'Wholesale' ? 'B2B' : 'B2C'} Order
              </Tag>
              <Tag color="purple" icon={<GlobalOutlined />} style={{ fontSize: 16, padding: '6px 12px' }}>
                {order.channel || 'Direct'}
              </Tag>
            </div>
            <div className="flex items-center gap-4">
              <div>
                <span className="text-gray-600">Status:</span>
                <Tag color={getStatusColor(order.status)} className="ml-2 uppercase text-lg px-4 py-1">
                  {order.status.replace('_', ' ')}
                </Tag>
              </div>
              <div>
                <span className="text-gray-600">Priority:</span>
                <Tag color={getStatusColor(order.priority)} className="ml-2 uppercase text-lg px-4 py-1">
                  {order.priority}
                </Tag>
              </div>
            </div>
          </div>
        </Card>

        {/* Order Details */}
        <Row gutter={16}>
          <Col xs={24} lg={16}>
            <Card title="Order Information">
              <Descriptions column={2} bordered>
                <Descriptions.Item label="Order Number">{order.orderNumber}</Descriptions.Item>
                <Descriptions.Item label="Channel">
                  <Tag color="blue" className="uppercase">{order.channel}</Tag>
                </Descriptions.Item>
                <Descriptions.Item label="Customer">{order.customer?.name}</Descriptions.Item>
                <Descriptions.Item label="Email">{order.customer?.email}</Descriptions.Item>
                <Descriptions.Item label="Phone">{order.customer?.phone}</Descriptions.Item>
                <Descriptions.Item label="Order Date">{formatDate(order.orderDate)}</Descriptions.Item>
                <Descriptions.Item label="Required Date">
                  {order.requiredDate ? formatDate(order.requiredDate) : '-'}
                </Descriptions.Item>
                <Descriptions.Item label="Reference">{order.referenceNumber || '-'}</Descriptions.Item>
              </Descriptions>

              <Divider />

              <h3 className="text-lg font-semibold mb-4">Shipping Address</h3>
              <p>
                {order.shippingAddress?.street}<br />
                {order.shippingAddress?.city}, {order.shippingAddress?.state} {order.shippingAddress?.zipCode}<br />
                {order.shippingAddress?.country}
              </p>

              {order.notes && (
                <>
                  <Divider />
                  <h3 className="text-lg font-semibold mb-2">Notes</h3>
                  <p className="text-gray-600">{order.notes}</p>
                </>
              )}
            </Card>

            <Card title="Order Items" className="mt-4">
              <Table
                dataSource={order.items}
                columns={itemColumns}
                rowKey="id"
                pagination={false}
                summary={() => (
                  <Table.Summary fixed>
                    <Table.Summary.Row>
                      <Table.Summary.Cell index={0} colSpan={4} align="right">
                        <strong>Subtotal:</strong>
                      </Table.Summary.Cell>
                      <Table.Summary.Cell index={1}>
                        <strong>{formatCurrency(order.subtotal || order.total)}</strong>
                      </Table.Summary.Cell>
                    </Table.Summary.Row>
                    {order.tax > 0 && (
                      <Table.Summary.Row>
                        <Table.Summary.Cell index={0} colSpan={4} align="right">
                          Tax:
                        </Table.Summary.Cell>
                        <Table.Summary.Cell index={1}>
                          {formatCurrency(order.tax)}
                        </Table.Summary.Cell>
                      </Table.Summary.Row>
                    )}
                    {order.shipping > 0 && (
                      <Table.Summary.Row>
                        <Table.Summary.Cell index={0} colSpan={4} align="right">
                          Shipping:
                        </Table.Summary.Cell>
                        <Table.Summary.Cell index={1}>
                          {formatCurrency(order.shipping)}
                        </Table.Summary.Cell>
                      </Table.Summary.Row>
                    )}
                    <Table.Summary.Row>
                      <Table.Summary.Cell index={0} colSpan={4} align="right">
                        <strong className="text-lg">Total:</strong>
                      </Table.Summary.Cell>
                      <Table.Summary.Cell index={1}>
                        <strong className="text-xl text-blue-600">{formatCurrency(order.total)}</strong>
                      </Table.Summary.Cell>
                    </Table.Summary.Row>
                  </Table.Summary>
                )}
              />
            </Card>
          </Col>

          <Col xs={24} lg={8}>
            <Card title="Order Progress">
              <Timeline>
                {timeline.map((item, index) => (
                  <Timeline.Item
                    key={index}
                    color={item.completed ? 'green' : 'gray'}
                    dot={item.completed ? <CheckCircleOutlined /> : <ClockCircleOutlined />}
                  >
                    <p className="font-medium">{item.status}</p>
                    <p className="text-sm text-gray-500">
                      {item.date ? formatDate(item.date) : 'Pending'}
                    </p>
                  </Timeline.Item>
                ))}
              </Timeline>
            </Card>

            <Card title="Quick Actions" className="mt-4">
              <Space direction="vertical" style={{ width: '100%' }}>
                <Button block>Process Payment</Button>
                <Button block>Allocate Inventory</Button>
                <Button block>Create Pick List</Button>
                <Button block>Print Packing Slip</Button>
                <Button block>Generate Invoice</Button>
                <Button block danger>Cancel Order</Button>
              </Space>
            </Card>
          </Col>
        </Row>
      </div>
    </MainLayout>
  );
}
