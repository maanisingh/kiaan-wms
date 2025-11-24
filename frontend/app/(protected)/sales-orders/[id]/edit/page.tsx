'use client';

import React, { useState, useEffect } from 'react';

import { Card, Button, Form, Input, Select, message, Space, Spin } from 'antd';
import { ArrowLeftOutlined, SaveOutlined } from '@ant-design/icons';
import { useRouter, useParams } from 'next/navigation';
import { useQuery, useMutation } from '@apollo/client';
import { GET_SALES_ORDERS } from '@/lib/graphql/queries';
import { UPDATE_SALES_ORDER_STATUS } from '@/lib/graphql/mutations';
import { PRIORITY_LEVELS, ORDER_STATUSES } from '@/lib/constants';

const { Option } = Select;
const { TextArea } = Input;

export default function SalesOrderEditPage() {
  const router = useRouter();
  const params = useParams();
  const [form] = Form.useForm();

  // Fetch order data
  const { data, loading: queryLoading, error } = useQuery(GET_SALES_ORDERS, {
    variables: { where: { id: { _eq: params.id } }, limit: 1 },
  });

  const [updateOrder, { loading: mutationLoading }] = useMutation(UPDATE_SALES_ORDER_STATUS);

  const order = data?.SalesOrder?.[0];

  useEffect(() => {
    if (order) {
      // Set form values from fetched order
      form.setFieldsValue({
        orderNumber: order.orderNumber,
        status: order.status,
        priority: order.priority,
        salesChannel: order.salesChannel,
        notes: order.notes,
      });
    }
  }, [order, form]);

  const handleSubmit = async (values: any) => {
    try {
      const { data: updateData } = await updateOrder({
        variables: {
          id: params.id as string,
          status: values.status,
        },
      });

      if (updateData?.update_SalesOrder_by_pk) {
        message.success('Sales order updated successfully!');
        router.push(`/sales-orders/${params.id}`);
      }
    } catch (error: any) {
      console.error('Error updating sales order:', error);
      message.error(error?.message || 'Failed to update sales order. Please try again.');
    }
  };

  if (queryLoading) {
    return (
      <div className="flex justify-center items-center py-12">
          <Spin size="large" />
        </div>
    );
  }

  if (error || !order) {
    return (
      <div className="text-center py-12">
          <h2 className="text-2xl">Sales order not found</h2>
          <Button className="mt-4" onClick={() => router.push('/sales-orders')}>
            Back to Sales Orders
          </Button>
        </div>
          );
  }

  return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Button
              icon={<ArrowLeftOutlined />}
              onClick={() => router.back()}
            >
              Back
            </Button>
            <div>
              <h1 className="text-3xl font-bold">Edit Sales Order</h1>
              <p className="text-gray-600 mt-1">Order #{order.orderNumber}</p>
            </div>
          </div>
          <Space>
            <Button onClick={() => router.back()}>
              Cancel
            </Button>
            <Button
              type="primary"
              icon={<SaveOutlined />}
              onClick={() => form.submit()}
              loading={mutationLoading}
              size="large"
            >
              Save Changes
            </Button>
          </Space>
        </div>

        {/* Form */}
        <Card>
          <Form
            form={form}
            layout="vertical"
            onFinish={handleSubmit}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Form.Item
                label="Order Number"
                name="orderNumber"
              >
                <Input size="large" disabled />
              </Form.Item>

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

              <Form.Item
                label="Sales Channel"
                name="salesChannel"
              >
                <Select size="large" disabled>
                  <Option value="DIRECT">Direct</Option>
                  <Option value="AMAZON">Amazon</Option>
                  <Option value="SHOPIFY">Shopify</Option>
                  <Option value="EBAY">eBay</Option>
                  <Option value="WEBSITE">Website</Option>
                </Select>
              </Form.Item>

              <Form.Item
                label="Notes"
                name="notes"
                className="md:col-span-2"
              >
                <TextArea rows={4} placeholder="Enter any notes" />
              </Form.Item>
            </div>
          </Form>
        </Card>

        <Card title="Order Details" className="bg-gray-50">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">Customer</p>
              <p className="font-medium">{order.customer?.name || '-'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Amount</p>
              <p className="font-medium text-lg">${(order.totalAmount || 0).toFixed(2)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Items</p>
              <p className="font-medium">{order.salesOrderItems?.length || 0} items</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Order Date</p>
              <p className="font-medium">{new Date(order.orderDate).toLocaleDateString()}</p>
            </div>
          </div>
        </Card>
      </div>
      );
}
