'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Card, Button, Tag, Descriptions, Table, Space, Timeline, Divider, Row, Col,
  Spin, Alert, Statistic
} from 'antd';
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
  ReloadOutlined,
  DollarOutlined,
} from '@ant-design/icons';
import { useRouter, useParams } from 'next/navigation';
import { formatCurrency, formatDate, getStatusColor } from '@/lib/utils';
import apiService from '@/services/api';
import Link from 'next/link';

interface SalesOrderItem {
  id: string;
  productId: string;
  quantity: number;
  unitPrice: number;
  discount?: number;
  tax?: number;
  totalPrice: number;
  product?: {
    id: string;
    name: string;
    sku: string;
  };
}

interface SalesOrder {
  id: string;
  orderNumber: string;
  orderDate: string;
  requiredDate?: string;
  status: string;
  priority?: string;
  salesChannel?: string;
  isWholesale?: boolean;
  subtotal?: number;
  taxAmount?: number;
  shippingCost?: number;
  discountAmount?: number;
  totalAmount?: number;
  notes?: string;
  referenceNumber?: string;
  customer?: {
    id: string;
    name: string;
    email?: string;
    phone?: string;
    address?: string;
  };
  salesOrderItems?: SalesOrderItem[];
  createdAt: string;
  updatedAt: string;
}

export default function SalesOrderDetailPage() {
  const router = useRouter();
  const params = useParams();
  const [order, setOrder] = useState<SalesOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOrder = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await apiService.get(`/sales-orders/${params.id}`);
      setOrder(data);
    } catch (err: any) {
      console.error('Failed to fetch order:', err);
      setError(err.message || 'Failed to load order');
    } finally {
      setLoading(false);
    }
  }, [params.id]);

  useEffect(() => {
    if (params.id) {
      fetchOrder();
    }
  }, [params.id, fetchOrder]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <Spin size="large" tip="Loading order..." />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="p-6">
        <Alert
          message="Error Loading Order"
          description={error || 'Order not found'}
          type="error"
          showIcon
          action={
            <Space>
              <Button onClick={fetchOrder} icon={<ReloadOutlined />}>
                Retry
              </Button>
              <Button onClick={() => router.push('/protected/sales-orders')}>
                Back to Orders
              </Button>
            </Space>
          }
        />
      </div>
    );
  }

  const itemColumns = [
    {
      title: 'Product',
      dataIndex: ['product', 'name'],
      key: 'product',
      render: (text: string) => text || 'Unknown Product',
    },
    {
      title: 'SKU',
      dataIndex: ['product', 'sku'],
      key: 'sku',
      render: (text: string) => <span className="font-mono text-sm">{text || '-'}</span>,
    },
    {
      title: 'Quantity',
      dataIndex: 'quantity',
      key: 'quantity',
      align: 'center' as const,
    },
    {
      title: 'Unit Price',
      dataIndex: 'unitPrice',
      key: 'unitPrice',
      align: 'right' as const,
      render: (price: number) => formatCurrency(price || 0),
    },
    {
      title: 'Discount',
      dataIndex: 'discount',
      key: 'discount',
      align: 'right' as const,
      render: (discount: number) => formatCurrency(discount || 0),
    },
    {
      title: 'Total',
      dataIndex: 'totalPrice',
      key: 'total',
      align: 'right' as const,
      render: (total: number) => <strong>{formatCurrency(total || 0)}</strong>,
    },
  ];

  // Build timeline based on status
  const getTimeline = () => {
    const statuses = ['PENDING', 'CONFIRMED', 'ALLOCATED', 'PICKING', 'PACKING', 'SHIPPED', 'COMPLETED'];
    const currentIndex = statuses.indexOf(order.status?.toUpperCase() || 'PENDING');

    return statuses.map((status, index) => ({
      status: status.replace('_', ' '),
      completed: index <= currentIndex,
      current: index === currentIndex,
    }));
  };

  const timeline = getTimeline();

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div className="flex items-center gap-4">
          <Button icon={<ArrowLeftOutlined />} onClick={() => router.back()}>
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Order {order.orderNumber}</h1>
            <p className="text-gray-600 mt-1">
              Created on {formatDate(order.orderDate || order.createdAt)}
            </p>
          </div>
        </div>
        <Space>
          <Button icon={<ReloadOutlined />} onClick={fetchOrder}>
            Refresh
          </Button>
          <Button icon={<PrinterOutlined />} size="large">
            Print
          </Button>
          <Link href={`/protected/sales-orders/${order.id}/edit`}>
            <Button icon={<EditOutlined />} type="primary" size="large">
              Edit Order
            </Button>
          </Link>
        </Space>
      </div>

      {/* Status Banner */}
      <Card>
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <Tag
              color={order.isWholesale ? 'purple' : 'blue'}
              style={{ fontSize: 18, padding: '8px 16px' }}
            >
              <ShopOutlined /> {order.isWholesale ? 'B2B' : 'B2C'} Order
            </Tag>
            <Tag color="cyan" icon={<GlobalOutlined />} style={{ fontSize: 16, padding: '6px 12px' }}>
              {order.salesChannel || 'DIRECT'}
            </Tag>
          </div>
          <div className="flex items-center gap-4">
            <div>
              <span className="text-gray-600">Status:</span>
              <Tag
                color={getStatusColor(order.status?.toLowerCase() || 'pending')}
                className="ml-2 uppercase text-lg px-4 py-1"
              >
                {order.status?.replace('_', ' ') || 'PENDING'}
              </Tag>
            </div>
            <div>
              <span className="text-gray-600">Priority:</span>
              <Tag
                color={
                  order.priority === 'HIGH' ? 'red' :
                  order.priority === 'MEDIUM' ? 'orange' : 'green'
                }
                className="ml-2 uppercase text-lg px-4 py-1"
              >
                {order.priority || 'NORMAL'}
              </Tag>
            </div>
          </div>
        </div>
      </Card>

      {/* Stats Row */}
      <Row gutter={16}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Subtotal"
              value={order.subtotal || order.totalAmount || 0}
              prefix="£"
              precision={2}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Tax"
              value={order.taxAmount || 0}
              prefix="£"
              precision={2}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Shipping"
              value={order.shippingCost || 0}
              prefix="£"
              precision={2}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Total Amount"
              value={order.totalAmount || 0}
              prefix="£"
              precision={2}
              valueStyle={{ color: '#1890ff', fontWeight: 'bold' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Order Details */}
      <Row gutter={16}>
        <Col xs={24} lg={16}>
          <Card title="Order Information">
            <Descriptions column={2} bordered>
              <Descriptions.Item label="Order Number">{order.orderNumber}</Descriptions.Item>
              <Descriptions.Item label="Channel">
                <Tag color="blue" className="uppercase">{order.salesChannel || 'DIRECT'}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Customer">{order.customer?.name || '-'}</Descriptions.Item>
              <Descriptions.Item label="Email">{order.customer?.email || '-'}</Descriptions.Item>
              <Descriptions.Item label="Phone">{order.customer?.phone || '-'}</Descriptions.Item>
              <Descriptions.Item label="Order Date">{formatDate(order.orderDate)}</Descriptions.Item>
              <Descriptions.Item label="Required Date">
                {order.requiredDate ? formatDate(order.requiredDate) : '-'}
              </Descriptions.Item>
              <Descriptions.Item label="Reference">{order.referenceNumber || '-'}</Descriptions.Item>
            </Descriptions>

            {order.customer?.address && (
              <>
                <Divider />
                <h3 className="text-lg font-semibold mb-4">Customer Address</h3>
                <p>{order.customer.address}</p>
              </>
            )}

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
              dataSource={order.salesOrderItems || []}
              columns={itemColumns}
              rowKey="id"
              pagination={false}
              summary={() => (
                <Table.Summary fixed>
                  <Table.Summary.Row>
                    <Table.Summary.Cell index={0} colSpan={5} align="right">
                      <strong>Subtotal:</strong>
                    </Table.Summary.Cell>
                    <Table.Summary.Cell index={1} align="right">
                      <strong>{formatCurrency(order.subtotal || order.totalAmount || 0)}</strong>
                    </Table.Summary.Cell>
                  </Table.Summary.Row>
                  {(order.taxAmount || 0) > 0 && (
                    <Table.Summary.Row>
                      <Table.Summary.Cell index={0} colSpan={5} align="right">
                        Tax:
                      </Table.Summary.Cell>
                      <Table.Summary.Cell index={1} align="right">
                        {formatCurrency(order.taxAmount || 0)}
                      </Table.Summary.Cell>
                    </Table.Summary.Row>
                  )}
                  {(order.shippingCost || 0) > 0 && (
                    <Table.Summary.Row>
                      <Table.Summary.Cell index={0} colSpan={5} align="right">
                        Shipping:
                      </Table.Summary.Cell>
                      <Table.Summary.Cell index={1} align="right">
                        {formatCurrency(order.shippingCost || 0)}
                      </Table.Summary.Cell>
                    </Table.Summary.Row>
                  )}
                  {(order.discountAmount || 0) > 0 && (
                    <Table.Summary.Row>
                      <Table.Summary.Cell index={0} colSpan={5} align="right">
                        Discount:
                      </Table.Summary.Cell>
                      <Table.Summary.Cell index={1} align="right">
                        -{formatCurrency(order.discountAmount || 0)}
                      </Table.Summary.Cell>
                    </Table.Summary.Row>
                  )}
                  <Table.Summary.Row>
                    <Table.Summary.Cell index={0} colSpan={5} align="right">
                      <strong className="text-lg">Total:</strong>
                    </Table.Summary.Cell>
                    <Table.Summary.Cell index={1} align="right">
                      <strong className="text-xl text-blue-600">
                        {formatCurrency(order.totalAmount || 0)}
                      </strong>
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
                  <p className={`font-medium ${item.current ? 'text-blue-600' : ''}`}>
                    {item.status}
                  </p>
                  <p className="text-sm text-gray-500">
                    {item.completed ? (item.current ? 'Current Status' : 'Completed') : 'Pending'}
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
  );
}
