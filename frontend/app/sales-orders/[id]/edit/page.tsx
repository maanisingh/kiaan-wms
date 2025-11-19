'use client';

import React, { useState, useEffect } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, Button, Form, Input, Select, InputNumber, message, Space, Table, DatePicker } from 'antd';
import { ArrowLeftOutlined, SaveOutlined, PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import { useRouter, useParams } from 'next/navigation';
import { mockSalesOrders } from '@/lib/mockData';
import dayjs from 'dayjs';

const { Option } = Select;
const { TextArea } = Input;

export default function SalesOrderEditPage() {
  const router = useRouter();
  const params = useParams();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [order, setOrder] = useState<any>(null);
  const [items, setItems] = useState<any[]>([]);

  useEffect(() => {
    // Simulate fetching order data
    const foundOrder = mockSalesOrders.find((o) => o.id === params.id);
    if (foundOrder) {
      setOrder(foundOrder);
      setItems(foundOrder.items || []);
      // Set form values
      form.setFieldsValue({
        orderNumber: foundOrder.orderNumber,
        customerName: foundOrder.customer?.name,
        customerEmail: foundOrder.customer?.email,
        customerPhone: foundOrder.customer?.phone,
        channel: foundOrder.channel,
        status: foundOrder.status,
        priority: foundOrder.priority,
        requiredDate: foundOrder.requiredDate ? dayjs(foundOrder.requiredDate) : null,
        referenceNumber: (foundOrder as any).referenceNumber || '',
        street: foundOrder.shippingAddress?.street,
        city: foundOrder.shippingAddress?.city,
        state: foundOrder.shippingAddress?.state,
        zipCode: foundOrder.shippingAddress?.postalCode,
        country: foundOrder.shippingAddress?.country,
        notes: (foundOrder as any).notes || '',
      });
    }
  }, [params.id, form]);

  const handleSubmit = async (values: any) => {
    setLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      console.log('Updated order values:', values);
      console.log('Updated items:', items);
      message.success('Sales order updated successfully!');
      router.push(`/sales-orders/${params.id}`);
    } catch (error) {
      message.error('Failed to update sales order');
    } finally {
      setLoading(false);
    }
  };

  const handleAddItem = () => {
    const newItem = {
      id: Date.now().toString(),
      product: { sku: '', name: '' },
      quantity: 1,
      unitPrice: 0,
      total: 0,
    };
    setItems([...items, newItem]);
  };

  const handleRemoveItem = (id: string) => {
    setItems(items.filter(item => item.id !== id));
  };

  const handleItemChange = (id: string, field: string, value: any) => {
    const updatedItems = items.map(item => {
      if (item.id === id) {
        const updated = { ...item, [field]: value };
        if (field === 'quantity' || field === 'unitPrice') {
          updated.total = (updated.quantity || 0) * (updated.unitPrice || 0);
        }
        return updated;
      }
      return item;
    });
    setItems(updatedItems);
  };

  const itemColumns = [
    {
      title: 'SKU',
      dataIndex: ['product', 'sku'],
      key: 'sku',
      width: 150,
      render: (_: any, record: any) => (
        <Input
          value={record.product.sku}
          onChange={(e) => handleItemChange(record.id, 'product', { ...record.product, sku: e.target.value })}
          placeholder="Enter SKU"
        />
      ),
    },
    {
      title: 'Product Name',
      dataIndex: ['product', 'name'],
      key: 'name',
      render: (_: any, record: any) => (
        <Input
          value={record.product.name}
          onChange={(e) => handleItemChange(record.id, 'product', { ...record.product, name: e.target.value })}
          placeholder="Enter product name"
        />
      ),
    },
    {
      title: 'Quantity',
      dataIndex: 'quantity',
      key: 'quantity',
      width: 120,
      render: (_: any, record: any) => (
        <InputNumber
          value={record.quantity}
          onChange={(value) => handleItemChange(record.id, 'quantity', value)}
          min={1}
          style={{ width: '100%' }}
        />
      ),
    },
    {
      title: 'Unit Price',
      dataIndex: 'unitPrice',
      key: 'unitPrice',
      width: 120,
      render: (_: any, record: any) => (
        <InputNumber
          value={record.unitPrice}
          onChange={(value) => handleItemChange(record.id, 'unitPrice', value)}
          min={0}
          precision={2}
          prefix="$"
          style={{ width: '100%' }}
        />
      ),
    },
    {
      title: 'Total',
      dataIndex: 'total',
      key: 'total',
      width: 120,
      render: (total: number) => `$${(total || 0).toFixed(2)}`,
    },
    {
      title: 'Action',
      key: 'action',
      width: 80,
      render: (_: any, record: any) => (
        <Button
          type="link"
          danger
          icon={<DeleteOutlined />}
          onClick={() => handleRemoveItem(record.id)}
        />
      ),
    },
  ];

  if (!order) {
    return (
      <MainLayout>
        <div className="text-center py-12">
          <h2 className="text-2xl">Order not found</h2>
          <Button className="mt-4" onClick={() => router.push('/sales-orders')}>
            Back to Sales Orders
          </Button>
        </div>
      </MainLayout>
    );
  }

  const totalAmount = items.reduce((sum, item) => sum + (item.total || 0), 0);

  return (
    <MainLayout>
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
              loading={loading}
              size="large"
            >
              Save Changes
            </Button>
          </Space>
        </div>

        {/* Form */}
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
        >
          {/* Order Information */}
          <Card title="Order Information" className="mb-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <Form.Item
                label="Order Number"
                name="orderNumber"
                rules={[{ required: true, message: 'Please enter order number' }]}
              >
                <Input size="large" placeholder="Enter order number" disabled />
              </Form.Item>

              <Form.Item
                label="Channel"
                name="channel"
                rules={[{ required: true, message: 'Please select channel' }]}
              >
                <Select size="large" placeholder="Select channel">
                  <Option value="amazon">Amazon</Option>
                  <Option value="shopify">Shopify</Option>
                  <Option value="ebay">eBay</Option>
                  <Option value="website">Website</Option>
                  <Option value="manual">Manual</Option>
                </Select>
              </Form.Item>

              <Form.Item
                label="Status"
                name="status"
                rules={[{ required: true, message: 'Please select status' }]}
              >
                <Select size="large" placeholder="Select status">
                  <Option value="pending">Pending</Option>
                  <Option value="confirmed">Confirmed</Option>
                  <Option value="allocated">Allocated</Option>
                  <Option value="picking">Picking</Option>
                  <Option value="packing">Packing</Option>
                  <Option value="shipped">Shipped</Option>
                </Select>
              </Form.Item>

              <Form.Item
                label="Priority"
                name="priority"
              >
                <Select size="large" placeholder="Select priority">
                  <Option value="low">Low</Option>
                  <Option value="normal">Normal</Option>
                  <Option value="high">High</Option>
                  <Option value="urgent">Urgent</Option>
                </Select>
              </Form.Item>

              <Form.Item
                label="Required Date"
                name="requiredDate"
              >
                <DatePicker size="large" style={{ width: '100%' }} />
              </Form.Item>

              <Form.Item
                label="Reference Number"
                name="referenceNumber"
              >
                <Input size="large" placeholder="Enter reference number" />
              </Form.Item>
            </div>
          </Card>

          {/* Customer Information */}
          <Card title="Customer Information" className="mb-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Form.Item
                label="Customer Name"
                name="customerName"
                rules={[{ required: true, message: 'Please enter customer name' }]}
              >
                <Input size="large" placeholder="Enter customer name" />
              </Form.Item>

              <Form.Item
                label="Email"
                name="customerEmail"
                rules={[{ type: 'email', message: 'Please enter valid email' }]}
              >
                <Input size="large" placeholder="Enter email" />
              </Form.Item>

              <Form.Item
                label="Phone"
                name="customerPhone"
              >
                <Input size="large" placeholder="Enter phone number" />
              </Form.Item>
            </div>
          </Card>

          {/* Shipping Address */}
          <Card title="Shipping Address" className="mb-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Form.Item
                label="Street Address"
                name="street"
                className="md:col-span-2"
              >
                <Input size="large" placeholder="Enter street address" />
              </Form.Item>

              <Form.Item
                label="City"
                name="city"
              >
                <Input size="large" placeholder="Enter city" />
              </Form.Item>

              <Form.Item
                label="State/Province"
                name="state"
              >
                <Input size="large" placeholder="Enter state" />
              </Form.Item>

              <Form.Item
                label="ZIP/Postal Code"
                name="zipCode"
              >
                <Input size="large" placeholder="Enter ZIP code" />
              </Form.Item>

              <Form.Item
                label="Country"
                name="country"
              >
                <Input size="large" placeholder="Enter country" />
              </Form.Item>
            </div>
          </Card>

          {/* Order Items */}
          <Card title="Order Items" className="mb-4">
            <div className="mb-4">
              <Button
                type="dashed"
                icon={<PlusOutlined />}
                onClick={handleAddItem}
                block
              >
                Add Item
              </Button>
            </div>
            <Table
              dataSource={items}
              columns={itemColumns}
              rowKey="id"
              pagination={false}
              scroll={{ x: 800 }}
              footer={() => (
                <div className="text-right">
                  <strong>Total: ${totalAmount.toFixed(2)}</strong>
                </div>
              )}
            />
          </Card>

          {/* Notes */}
          <Card title="Notes">
            <Form.Item
              name="notes"
            >
              <TextArea rows={4} placeholder="Enter any additional notes" />
            </Form.Item>
          </Card>
        </Form>
      </div>
    </MainLayout>
  );
}
