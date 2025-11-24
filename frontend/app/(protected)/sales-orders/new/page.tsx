'use client';

import React, { useState } from 'react';

import { Card, Form, Input, Select, Button, Row, Col, message, DatePicker, Table, InputNumber, Divider } from 'antd';
import { SaveOutlined, ArrowLeftOutlined, PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import { useMutation } from '@apollo/client';
import { CREATE_SALES_ORDER } from '@/lib/graphql/mutations';
import { PRIORITY_LEVELS } from '@/lib/constants';

const { Option } = Select;
const { TextArea } = Input;

export default function NewSalesOrderPage() {
  const router = useRouter();
  const [form] = Form.useForm();
  const [createSalesOrder, { loading }] = useMutation(CREATE_SALES_ORDER);
  const [orderItems, setOrderItems] = useState<any[]>([]);

  const handleAddItem = () => {
    const newItem = {
      key: Date.now(),
      product: '',
      quantity: 1,
      price: 0,
      total: 0,
    };
    setOrderItems([...orderItems, newItem]);
  };

  const handleRemoveItem = (key: number) => {
    setOrderItems(orderItems.filter(item => item.key !== key));
  };

  const handleItemChange = (key: number, field: string, value: any) => {
    const updatedItems = orderItems.map(item => {
      if (item.key === key) {
        const updated = { ...item, [field]: value };
        if (field === 'quantity' || field === 'price') {
          updated.total = updated.quantity * updated.price;
        }
        return updated;
      }
      return item;
    });
    setOrderItems(updatedItems);
  };

  const calculateTotal = () => {
    return orderItems.reduce((sum, item) => sum + (item.total || 0), 0);
  };

  const handleSubmit = async (values: any) => {
    if (orderItems.length === 0) {
      message.error('Please add at least one item to the order');
      return;
    }

    try {
      // Generate UUID for the sales order
      const uuid = crypto.randomUUID();
      const totalAmount = calculateTotal();

      const orderData = {
        id: uuid,  // Required field
        orderNumber: values.orderNumber || `SO-${Date.now()}`,
        orderDate: values.orderDate?.toISOString() || new Date().toISOString(),
        requiredDate: values.requiredDate?.toISOString() || null,
        customerId: values.customerId,
        status: 'PENDING',
        priority: values.priority || 'MEDIUM',
        salesChannel: values.salesChannel || 'DIRECT',
        isWholesale: false,  // Required field
        subtotal: totalAmount,  // Required field
        taxAmount: 0,  // Required field
        shippingCost: 0,  // Required field
        discountAmount: 0,  // Required field
        totalAmount: totalAmount,
        notes: values.notes || null,
        updatedAt: new Date().toISOString(),  // Required field
        salesOrderItems: {  // Changed to lowercase
          data: orderItems.map(item => ({
            id: crypto.randomUUID(),  // Generate UUID for each line item
            productId: item.product,
            quantity: parseInt(item.quantity),
            unitPrice: parseFloat(item.price),
            discount: 0,  // Required field
            tax: 0,  // Required field
            totalPrice: parseFloat(item.total),
          })),
        },
      };

      const { data } = await createSalesOrder({
        variables: { object: orderData },
      });

      if (data?.insert_SalesOrder_one) {
        message.success('Sales order created successfully!');
        router.push('/sales-orders');
      }
    } catch (error: any) {
      console.error('Error creating sales order:', error);
      message.error(error?.message || 'Failed to create sales order. Please try again.');
    }
  };

  const itemColumns = [
    {
      title: 'Product',
      dataIndex: 'product',
      key: 'product',
      width: '30%',
      render: (text: string, record: any) => (
        <Select
          style={{ width: '100%' }}
          placeholder="Select product"
          value={text || undefined}
          onChange={(value) => handleItemChange(record.key, 'product', value)}
        >
          <Option value="PROD-001">Laptop Stand - PRD-001</Option>
          <Option value="PROD-002">Wireless Mouse - PRD-002</Option>
          <Option value="PROD-003">USB-C Cable - PRD-003</Option>
        </Select>
      ),
    },
    {
      title: 'Quantity',
      dataIndex: 'quantity',
      key: 'quantity',
      width: '15%',
      render: (value: number, record: any) => (
        <InputNumber
          min={1}
          value={value}
          onChange={(val) => handleItemChange(record.key, 'quantity', val || 1)}
          style={{ width: '100%' }}
        />
      ),
    },
    {
      title: 'Unit Price',
      dataIndex: 'price',
      key: 'price',
      width: '20%',
      render: (value: number, record: any) => (
        <InputNumber
          min={0}
          step={0.01}
          value={value}
          onChange={(val) => handleItemChange(record.key, 'price', val || 0)}
          prefix="$"
          style={{ width: '100%' }}
        />
      ),
    },
    {
      title: 'Total',
      dataIndex: 'total',
      key: 'total',
      width: '20%',
      render: (value: number) => <span className="font-semibold">${value.toFixed(2)}</span>,
    },
    {
      title: 'Action',
      key: 'action',
      width: '15%',
      render: (_: any, record: any) => (
        <Button
          type="link"
          danger
          icon={<DeleteOutlined />}
          onClick={() => handleRemoveItem(record.key)}
        >
          Remove
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button
            icon={<ArrowLeftOutlined />}
            onClick={() => router.back()}
          >
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Create New Sales Order</h1>
            <p className="text-gray-600 mt-1">Add a new customer sales order</p>
          </div>
        </div>

        <Card>
          <Form
            form={form}
            layout="vertical"
            onFinish={handleSubmit}
            initialValues={{
              priority: 'MEDIUM',
              salesChannel: 'DIRECT',
              status: 'PENDING',
            }}
          >
            <h3 className="text-lg font-semibold mb-4">Order Information</h3>

            <Row gutter={16}>
              <Col xs={24} md={12}>
                <Form.Item
                  label="Customer"
                  name="customerId"
                  rules={[{ required: true, message: 'Please select a customer' }]}
                >
                  <Select size="large" placeholder="Select customer">
                    <Option value="1">Acme Corporation</Option>
                    <Option value="2">TechStart Inc</Option>
                    <Option value="3">Global Traders Ltd</Option>
                  </Select>
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item
                  label="Order Number"
                  name="orderNumber"
                  rules={[{ required: true, message: 'Please enter order number' }]}
                >
                  <Input placeholder="SO-2024-001" size="large" />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col xs={24} md={8}>
                <Form.Item
                  label="Order Date"
                  name="orderDate"
                  rules={[{ required: true, message: 'Please select order date' }]}
                >
                  <DatePicker size="large" style={{ width: '100%' }} />
                </Form.Item>
              </Col>
              <Col xs={24} md={8}>
                <Form.Item
                  label="Required Date"
                  name="requiredDate"
                >
                  <DatePicker size="large" style={{ width: '100%' }} />
                </Form.Item>
              </Col>
              <Col xs={24} md={8}>
                <Form.Item
                  label="Priority"
                  name="priority"
                  rules={[{ required: true }]}
                >
                  <Select size="large">
                    {PRIORITY_LEVELS.map(level => (
                      <Option key={level.value} value={level.value}>
                        {level.label}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col xs={24} md={12}>
                <Form.Item
                  label="Sales Channel"
                  name="salesChannel"
                  rules={[{ required: true }]}
                >
                  <Select size="large">
                    <Option value="DIRECT">Direct</Option>
                    <Option value="AMAZON">Amazon</Option>
                    <Option value="SHOPIFY">Shopify</Option>
                    <Option value="EBAY">eBay</Option>
                    <Option value="WEBSITE">Website</Option>
                  </Select>
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item label="Reference Number" name="referenceNumber">
                  <Input placeholder="Customer PO or reference" size="large" />
                </Form.Item>
              </Col>
            </Row>

            <Form.Item label="Notes" name="notes">
              <TextArea rows={3} placeholder="Add any notes or special instructions..." />
            </Form.Item>

            <Divider />

            <h3 className="text-lg font-semibold mb-4">Order Items</h3>

            <Table
              dataSource={orderItems}
              columns={itemColumns}
              pagination={false}
              locale={{ emptyText: 'No items added yet' }}
              summary={() => (
                <Table.Summary fixed>
                  <Table.Summary.Row>
                    <Table.Summary.Cell index={0} colSpan={3} align="right">
                      <strong>Total:</strong>
                    </Table.Summary.Cell>
                    <Table.Summary.Cell index={1}>
                      <strong className="text-xl text-blue-600">${calculateTotal().toFixed(2)}</strong>
                    </Table.Summary.Cell>
                    <Table.Summary.Cell index={2} />
                  </Table.Summary.Row>
                </Table.Summary>
              )}
            />

            <Button
              type="dashed"
              onClick={handleAddItem}
              icon={<PlusOutlined />}
              block
              size="large"
              className="mt-4"
            >
              Add Item
            </Button>

            <div className="flex gap-4 mt-6">
              <Button
                type="primary"
                htmlType="submit"
                icon={<SaveOutlined />}
                size="large"
                loading={loading}
              >
                Create Order
              </Button>
              <Button size="large" onClick={() => router.back()}>
                Cancel
              </Button>
            </div>
          </Form>
        </Card>
      </div>
      );
}
