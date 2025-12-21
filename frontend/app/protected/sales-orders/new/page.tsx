'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Card, Form, Input, Select, Button, Row, Col, message, DatePicker, Table,
  InputNumber, Divider, Spin, Alert
} from 'antd';
import {
  SaveOutlined, ArrowLeftOutlined, PlusOutlined, DeleteOutlined, ReloadOutlined
} from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import apiService from '@/services/api';
import { PRIORITY_LEVELS } from '@/lib/constants';

const { Option } = Select;
const { TextArea } = Input;

interface Customer {
  id: string;
  code: string;
  name: string;
}

interface Product {
  id: string;
  sku: string;
  name: string;
  sellingPrice?: number;
  availableQuantity?: number;
  totalQuantity?: number;
}

interface OrderItem {
  key: number;
  productId: string;
  productName?: string;
  sku?: string;
  quantity: number;
  unitPrice: number;
  total: number;
  availableQuantity?: number;
}

export default function NewSalesOrderPage() {
  const router = useRouter();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);

  // Fetch customers and products
  const fetchData = useCallback(async () => {
    try {
      setLoadingData(true);
      const [customersData, productsData] = await Promise.all([
        apiService.get('/customers'),
        apiService.get('/products'),
      ]);
      setCustomers(Array.isArray(customersData) ? customersData : []);
      setProducts(Array.isArray(productsData) ? productsData : []);
    } catch (err) {
      console.error('Failed to fetch data:', err);
      message.error('Failed to load customers and products');
    } finally {
      setLoadingData(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleAddItem = () => {
    const newItem: OrderItem = {
      key: Date.now(),
      productId: '',
      quantity: 1,
      unitPrice: 0,
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

        // If product changed, update price and available quantity
        if (field === 'productId') {
          const product = products.find(p => p.id === value);
          if (product) {
            updated.productName = product.name;
            updated.sku = product.sku;
            updated.unitPrice = product.sellingPrice || 0;
            updated.availableQuantity = product.availableQuantity || 0;
            // Reset quantity to 1 or max available
            updated.quantity = Math.min(1, product.availableQuantity || 1);
            updated.total = updated.quantity * updated.unitPrice;
          }
        }

        // Recalculate total if quantity or price changed
        if (field === 'quantity' || field === 'unitPrice') {
          // Validate quantity doesn't exceed available
          if (field === 'quantity' && updated.availableQuantity !== undefined) {
            if (value > updated.availableQuantity) {
              message.warning(`Only ${updated.availableQuantity} units available for ${updated.productName}`);
              updated.quantity = updated.availableQuantity;
            }
          }
          updated.total = updated.quantity * updated.unitPrice;
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

    // Validate all items have products selected
    const invalidItems = orderItems.filter(item => !item.productId);
    if (invalidItems.length > 0) {
      message.error('Please select a product for all items');
      return;
    }

    try {
      setLoading(true);
      const totalAmount = calculateTotal();

      const orderData = {
        orderNumber: values.orderNumber || `SO-${Date.now()}`,
        orderDate: values.orderDate?.toISOString() || new Date().toISOString(),
        requiredDate: values.requiredDate?.toISOString() || null,
        customerId: values.customerId,
        status: 'PENDING',
        priority: values.priority || 'MEDIUM',
        salesChannel: values.salesChannel || 'DIRECT',
        isWholesale: values.isWholesale || false,
        subtotal: totalAmount,
        taxAmount: 0,
        shippingCost: 0,
        discountAmount: 0,
        totalAmount: totalAmount,
        notes: values.notes || null,
        items: orderItems.map(item => ({
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          discount: 0,
          tax: 0,
          totalPrice: item.total,
        })),
      };

      await apiService.post('/sales-orders', orderData);
      message.success('Sales order created successfully!');
      router.push('/protected/sales-orders');
    } catch (error: any) {
      console.error('Error creating sales order:', error);
      const errorMsg = error?.response?.data?.error || error?.message || 'Failed to create sales order. Please try again.';
      message.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const itemColumns = [
    {
      title: 'Product',
      dataIndex: 'productId',
      key: 'productId',
      width: '30%',
      render: (productId: string, record: OrderItem) => (
        <Select
          style={{ width: '100%' }}
          placeholder="Select product"
          value={productId || undefined}
          onChange={(value) => handleItemChange(record.key, 'productId', value)}
          showSearch
          optionFilterProp="label"
          loading={loadingData}
        >
          {products.map(product => (
            <Option
              key={product.id}
              value={product.id}
              label={`${product.name} - ${product.sku}`}
              disabled={(product.availableQuantity || 0) <= 0}
            >
              <div className="flex justify-between items-center">
                <span>{product.name} - {product.sku}</span>
                <span className={`text-xs font-medium ${(product.availableQuantity || 0) > 0 ? 'text-green-600' : 'text-red-500'}`}>
                  Stock: {product.availableQuantity || 0}
                </span>
              </div>
            </Option>
          ))}
        </Select>
      ),
    },
    {
      title: 'SKU',
      dataIndex: 'sku',
      key: 'sku',
      width: '12%',
      render: (sku: string) => <span className="font-mono text-sm">{sku || '-'}</span>,
    },
    {
      title: 'Available',
      dataIndex: 'availableQuantity',
      key: 'availableQuantity',
      width: '10%',
      render: (qty: number) => (
        <span className={`font-medium ${(qty || 0) > 0 ? 'text-green-600' : 'text-red-500'}`}>
          {qty || 0}
        </span>
      ),
    },
    {
      title: 'Quantity',
      dataIndex: 'quantity',
      key: 'quantity',
      width: '12%',
      render: (value: number, record: OrderItem) => (
        <InputNumber
          min={1}
          max={record.availableQuantity || 9999}
          value={value}
          onChange={(val) => handleItemChange(record.key, 'quantity', val || 1)}
          style={{ width: '100%' }}
          status={value > (record.availableQuantity || 0) ? 'error' : undefined}
        />
      ),
    },
    {
      title: 'Unit Price',
      dataIndex: 'unitPrice',
      key: 'unitPrice',
      width: '15%',
      render: (value: number, record: OrderItem) => (
        <InputNumber
          min={0}
          step={0.01}
          value={value}
          onChange={(val) => handleItemChange(record.key, 'unitPrice', val || 0)}
          prefix="£"
          style={{ width: '100%' }}
        />
      ),
    },
    {
      title: 'Total',
      dataIndex: 'total',
      key: 'total',
      width: '15%',
      render: (value: number) => <span className="font-semibold">£{(value || 0).toFixed(2)}</span>,
    },
    {
      title: 'Action',
      key: 'action',
      width: '10%',
      render: (_: any, record: OrderItem) => (
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

  if (loadingData) {
    return (
      <div className="flex justify-center items-center h-96">
        <Spin size="large" tip="Loading..." />
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
            Create New Sales Order
          </h1>
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
            isWholesale: false,
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
                <Select
                  size="large"
                  placeholder="Select customer"
                  showSearch
                  optionFilterProp="label"
                >
                  {customers.map(customer => (
                    <Option key={customer.id} value={customer.id} label={customer.name}>
                      {customer.name} ({customer.code})
                    </Option>
                  ))}
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
              <Form.Item label="Required Date" name="requiredDate">
                <DatePicker size="large" style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item label="Priority" name="priority" rules={[{ required: true }]}>
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
            <Col xs={24} md={8}>
              <Form.Item label="Sales Channel" name="salesChannel" rules={[{ required: true }]}>
                <Select size="large">
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
            <Col xs={24} md={8}>
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
            rowKey="key"
            locale={{ emptyText: 'No items added yet. Click "Add Item" to begin.' }}
            summary={() => (
              <Table.Summary fixed>
                <Table.Summary.Row>
                  <Table.Summary.Cell index={0} colSpan={5} align="right">
                    <strong>Total:</strong>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={1}>
                    <strong className="text-xl text-blue-600">£{calculateTotal().toFixed(2)}</strong>
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
