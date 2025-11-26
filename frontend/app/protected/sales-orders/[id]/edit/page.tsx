'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Card, Button, Form, Input, Select, message, Space, Spin, Alert, Row, Col
} from 'antd';
import { ArrowLeftOutlined, SaveOutlined, ReloadOutlined } from '@ant-design/icons';
import { useRouter, useParams } from 'next/navigation';
import apiService from '@/services/api';
import { PRIORITY_LEVELS, ORDER_STATUSES } from '@/lib/constants';
import { formatCurrency, formatDate } from '@/lib/utils';

const { Option } = Select;
const { TextArea } = Input;

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
  customer?: {
    id: string;
    name: string;
    email?: string;
  };
  salesOrderItems?: Array<{
    id: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    product?: {
      name: string;
      sku: string;
    };
  }>;
}

export default function SalesOrderEditPage() {
  const router = useRouter();
  const params = useParams();
  const [form] = Form.useForm();
  const [order, setOrder] = useState<SalesOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchOrder = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await apiService.get(`/sales-orders/${params.id}`);
      setOrder(data);

      // Set form values
      form.setFieldsValue({
        orderNumber: data.orderNumber,
        status: data.status,
        priority: data.priority,
        salesChannel: data.salesChannel,
        notes: data.notes,
        isWholesale: data.isWholesale,
      });
    } catch (err: any) {
      console.error('Failed to fetch order:', err);
      setError(err.message || 'Failed to load order');
    } finally {
      setLoading(false);
    }
  }, [params.id, form]);

  useEffect(() => {
    if (params.id) {
      fetchOrder();
    }
  }, [params.id, fetchOrder]);

  const handleSubmit = async (values: any) => {
    try {
      setSaving(true);

      const updateData = {
        status: values.status,
        priority: values.priority,
        notes: values.notes,
        isWholesale: values.isWholesale,
      };

      await apiService.put(`/sales-orders/${params.id}`, updateData);
      message.success('Sales order updated successfully!');
      router.push(`/protected/sales-orders/${params.id}`);
    } catch (error: any) {
      console.error('Error updating sales order:', error);
      message.error(error?.message || 'Failed to update sales order. Please try again.');
    } finally {
      setSaving(false);
    }
  };

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

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <Button icon={<ArrowLeftOutlined />} onClick={() => router.back()}>
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
              Edit Sales Order
            </h1>
            <p className="text-gray-600 mt-1">Order #{order.orderNumber}</p>
          </div>
        </div>
        <Space>
          <Button onClick={() => router.back()}>Cancel</Button>
          <Button
            type="primary"
            icon={<SaveOutlined />}
            onClick={() => form.submit()}
            loading={saving}
            size="large"
          >
            Save Changes
          </Button>
        </Space>
      </div>

      {/* Form */}
      <Card>
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item label="Order Number" name="orderNumber">
                <Input size="large" disabled />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item
                label="Status"
                name="status"
                rules={[{ required: true, message: 'Please select status' }]}
              >
                <Select size="large" placeholder="Select status">
                  {ORDER_STATUSES.map(status => (
                    <Option key={status.value} value={status.value}>
                      {status.label}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col xs={24} md={8}>
              <Form.Item
                label="Priority"
                name="priority"
                rules={[{ required: true, message: 'Please select priority' }]}
              >
                <Select size="large" placeholder="Select priority">
                  {PRIORITY_LEVELS.map(level => (
                    <Option key={level.value} value={level.value}>
                      {level.label}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item label="Sales Channel" name="salesChannel">
                <Select size="large" disabled>
                  <Option value="DIRECT">Direct</Option>
                  <Option value="AMAZON">Amazon</Option>
                  <Option value="SHOPIFY">Shopify</Option>
                  <Option value="EBAY">eBay</Option>
                  <Option value="WEBSITE">Website</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item label="Order Type" name="isWholesale">
                <Select size="large">
                  <Option value={false}>Retail (B2C)</Option>
                  <Option value={true}>Wholesale (B2B)</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item label="Notes" name="notes">
            <TextArea rows={4} placeholder="Enter any notes or special instructions" />
          </Form.Item>
        </Form>
      </Card>

      {/* Order Summary (Read-Only) */}
      <Card title="Order Summary" className="bg-gray-50">
        <Row gutter={[16, 16]}>
          <Col xs={24} md={12}>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-600">Customer</p>
                <p className="font-medium">{order.customer?.name || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Customer Email</p>
                <p className="font-medium">{order.customer?.email || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Order Date</p>
                <p className="font-medium">{formatDate(order.orderDate)}</p>
              </div>
              {order.requiredDate && (
                <div>
                  <p className="text-sm text-gray-600">Required Date</p>
                  <p className="font-medium">{formatDate(order.requiredDate)}</p>
                </div>
              )}
            </div>
          </Col>
          <Col xs={24} md={12}>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-600">Items</p>
                <p className="font-medium">{order.salesOrderItems?.length || 0} items</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Subtotal</p>
                <p className="font-medium">{formatCurrency(order.subtotal || order.totalAmount || 0)}</p>
              </div>
              {(order.taxAmount || 0) > 0 && (
                <div>
                  <p className="text-sm text-gray-600">Tax</p>
                  <p className="font-medium">{formatCurrency(order.taxAmount || 0)}</p>
                </div>
              )}
              <div>
                <p className="text-sm text-gray-600">Total Amount</p>
                <p className="font-medium text-xl text-blue-600">{formatCurrency(order.totalAmount || 0)}</p>
              </div>
            </div>
          </Col>
        </Row>

        {order.salesOrderItems && order.salesOrderItems.length > 0 && (
          <div className="mt-6">
            <h4 className="font-semibold mb-3">Order Items</h4>
            <div className="space-y-2">
              {order.salesOrderItems.map((item, index) => (
                <div key={item.id || index} className="flex justify-between items-center p-3 bg-white rounded border">
                  <div>
                    <p className="font-medium">{item.product?.name || 'Unknown Product'}</p>
                    <p className="text-sm text-gray-500">SKU: {item.product?.sku || '-'}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{formatCurrency(item.totalPrice)}</p>
                    <p className="text-sm text-gray-500">{item.quantity} × {formatCurrency(item.unitPrice)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
