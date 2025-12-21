'use client';

import React, { useState, useEffect } from 'react';
import { Card, Table, Tag, Button, Spin, Descriptions, Statistic, Row, Col, Alert } from 'antd';
import { ArrowLeftOutlined, ShoppingCartOutlined, UserOutlined, MailOutlined, PhoneOutlined } from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import apiService from '@/services/api';
import dayjs from 'dayjs';

interface OrderItem {
  id: string;
  productId: string;
  product: {
    id: string;
    name: string;
    sku: string;
  };
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

interface Order {
  id: string;
  orderNumber: string;
  orderDate: string;
  status: string;
  totalAmount: number;
  items: OrderItem[];
}

interface Customer {
  id: string;
  code: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  country?: string;
  orders: Order[];
  totalOrderValue: number;
  _count: {
    orders: number;
  };
}

export default function CustomerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [customerId, setCustomerId] = useState<string | null>(null);

  useEffect(() => {
    params.then(p => setCustomerId(p.id));
  }, [params]);

  useEffect(() => {
    if (!customerId) return;

    const fetchCustomer = async () => {
      try {
        setLoading(true);
        const data = await apiService.get(`/customers/${customerId}`);
        setCustomer(data);
      } catch (err: any) {
        console.error('Error fetching customer:', err);
        setError(err.message || 'Failed to load customer');
      } finally {
        setLoading(false);
      }
    };

    fetchCustomer();
  }, [customerId]);

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      PENDING: 'orange',
      CONFIRMED: 'blue',
      PROCESSING: 'cyan',
      SHIPPED: 'purple',
      DELIVERED: 'green',
      CANCELLED: 'red',
      COMPLETED: 'green',
    };
    return colors[status] || 'default';
  };

  const orderColumns = [
    {
      title: 'Order Number',
      dataIndex: 'orderNumber',
      key: 'orderNumber',
      render: (text: string, record: Order) => (
        <Link href={`/protected/sales-orders/${record.id}`}>
          <span className="text-blue-600 hover:underline cursor-pointer font-medium">{text}</span>
        </Link>
      ),
    },
    {
      title: 'Date',
      dataIndex: 'orderDate',
      key: 'orderDate',
      render: (date: string) => dayjs(date).format('MMM DD, YYYY'),
    },
    {
      title: 'Items',
      dataIndex: 'items',
      key: 'items',
      render: (items: OrderItem[]) => items?.length || 0,
    },
    {
      title: 'Total',
      dataIndex: 'totalAmount',
      key: 'totalAmount',
      render: (amount: number) => <span className="font-semibold">£{(amount || 0).toFixed(2)}</span>,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => <Tag color={getStatusColor(status)}>{status}</Tag>,
    },
  ];

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <Spin size="large" tip="Loading customer..." />
      </div>
    );
  }

  if (error || !customer) {
    return (
      <div className="p-6">
        <Button icon={<ArrowLeftOutlined />} onClick={() => router.back()} className="mb-4">
          Back
        </Button>
        <Alert type="error" message="Error" description={error || 'Customer not found'} />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button icon={<ArrowLeftOutlined />} onClick={() => router.back()}>
          Back
        </Button>
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
            {customer.name}
          </h1>
          <p className="text-gray-600 mt-1">Customer Code: {customer.code}</p>
        </div>
      </div>

      <Row gutter={[16, 16]}>
        <Col xs={24} md={8}>
          <Card>
            <Statistic
              title="Total Orders"
              value={customer._count?.orders || 0}
              prefix={<ShoppingCartOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card>
            <Statistic
              title="Total Order Value"
              value={customer.totalOrderValue || 0}
              prefix="£"
              precision={2}
            />
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card>
            <Statistic
              title="Avg Order Value"
              value={customer._count?.orders > 0 ? (customer.totalOrderValue / customer._count.orders) : 0}
              prefix="£"
              precision={2}
            />
          </Card>
        </Col>
      </Row>

      <Card title="Customer Details">
        <Descriptions column={{ xs: 1, sm: 2, md: 3 }}>
          <Descriptions.Item label={<><UserOutlined /> Name</>}>{customer.name}</Descriptions.Item>
          <Descriptions.Item label="Code">{customer.code}</Descriptions.Item>
          <Descriptions.Item label={<><MailOutlined /> Email</>}>{customer.email || '-'}</Descriptions.Item>
          <Descriptions.Item label={<><PhoneOutlined /> Phone</>}>{customer.phone || '-'}</Descriptions.Item>
          <Descriptions.Item label="Address">{customer.address || '-'}</Descriptions.Item>
          <Descriptions.Item label="City">{customer.city || '-'}</Descriptions.Item>
          <Descriptions.Item label="Country">{customer.country || '-'}</Descriptions.Item>
        </Descriptions>
      </Card>

      <Card title={`Orders (${customer.orders?.length || 0})`}>
        <Table
          dataSource={customer.orders || []}
          columns={orderColumns}
          rowKey="id"
          pagination={{ pageSize: 10 }}
          locale={{ emptyText: 'No orders found for this customer' }}
          onRow={(record) => ({
            onClick: () => router.push(`/protected/sales-orders/${record.id}`),
            style: { cursor: 'pointer' },
          })}
        />
      </Card>
    </div>
  );
}
