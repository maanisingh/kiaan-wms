'use client';

import React, { useState, useEffect } from 'react';
import {
  Card, Form, Input, Select, Button, Table, InputNumber, DatePicker, message,
  Space, Row, Col, Divider, Tag, Alert
} from 'antd';
import {
  ArrowLeftOutlined, SaveOutlined, PlusOutlined, DeleteOutlined,
  DownloadOutlined, BarcodeOutlined
} from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import apiService from '@/services/api';
import dayjs from 'dayjs';

const { Option } = Select;
const { TextArea } = Input;

interface Product {
  id: string;
  name: string;
  sku: string;
  barcode?: string;
}

interface LineItem {
  key: string;
  productId: string;
  productName: string;
  sku: string;
  expectedQty: number;
  receivedQty: number;
  lotNumber?: string;
  bestBeforeDate?: string;
  notes?: string;
}

export default function NewGoodsReceivingPage() {
  const router = useRouter();
  const [form] = Form.useForm();
  const [products, setProducts] = useState<Product[]>([]);
  const [lineItems, setLineItems] = useState<LineItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Fetch products
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const data = await apiService.get('/products');
        setProducts(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error('Failed to fetch products:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  const handleAddLine = () => {
    const newLine: LineItem = {
      key: `line-${Date.now()}`,
      productId: '',
      productName: '',
      sku: '',
      expectedQty: 0,
      receivedQty: 0,
    };
    setLineItems([...lineItems, newLine]);
  };

  const handleRemoveLine = (key: string) => {
    setLineItems(lineItems.filter(item => item.key !== key));
  };

  const handleLineChange = (key: string, field: string, value: any) => {
    setLineItems(lineItems.map(item => {
      if (item.key === key) {
        if (field === 'productId') {
          const product = products.find(p => p.id === value);
          return {
            ...item,
            productId: value,
            productName: product?.name || '',
            sku: product?.sku || '',
          };
        }
        return { ...item, [field]: value };
      }
      return item;
    }));
  };

  const handleSubmit = async (values: any) => {
    if (lineItems.length === 0) {
      message.error('Please add at least one line item');
      return;
    }

    try {
      setSaving(true);

      const grData = {
        referenceNumber: values.referenceNumber,
        poNumber: values.poNumber || null,
        supplier: values.supplier || null,
        expectedDate: values.expectedDate?.toISOString() || null,
        notes: values.notes || null,
        lineItems: lineItems.map(item => ({
          productId: item.productId,
          expectedQty: item.expectedQty,
          receivedQty: item.receivedQty,
          lotNumber: item.lotNumber || null,
          bestBeforeDate: item.bestBeforeDate || null,
          notes: item.notes || null,
        })),
      };

      // In a real app, this would call the API
      // await apiService.post('/goods-receiving', grData);

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      message.success('Goods receiving created successfully!');
      router.push('/protected/goods-receiving');
    } catch (error: any) {
      console.error('Error creating goods receiving:', error);
      message.error(error?.message || 'Failed to create goods receiving');
    } finally {
      setSaving(false);
    }
  };

  const columns = [
    {
      title: 'Product',
      dataIndex: 'productId',
      key: 'product',
      width: 250,
      render: (_: any, record: LineItem) => (
        <Select
          placeholder="Select product"
          style={{ width: '100%' }}
          value={record.productId || undefined}
          onChange={(value) => handleLineChange(record.key, 'productId', value)}
          showSearch
          optionFilterProp="label"
          options={products.map(p => ({
            value: p.id,
            label: `${p.name} (${p.sku})`,
          }))}
        />
      ),
    },
    {
      title: 'SKU',
      dataIndex: 'sku',
      key: 'sku',
      width: 100,
      render: (text: string) => <span className="font-mono">{text || '-'}</span>,
    },
    {
      title: 'Expected Qty',
      dataIndex: 'expectedQty',
      key: 'expectedQty',
      width: 100,
      render: (_: any, record: LineItem) => (
        <InputNumber
          min={0}
          value={record.expectedQty}
          onChange={(value) => handleLineChange(record.key, 'expectedQty', value || 0)}
          style={{ width: '100%' }}
        />
      ),
    },
    {
      title: 'Received Qty',
      dataIndex: 'receivedQty',
      key: 'receivedQty',
      width: 100,
      render: (_: any, record: LineItem) => (
        <InputNumber
          min={0}
          value={record.receivedQty}
          onChange={(value) => handleLineChange(record.key, 'receivedQty', value || 0)}
          style={{ width: '100%' }}
        />
      ),
    },
    {
      title: 'Lot Number',
      dataIndex: 'lotNumber',
      key: 'lotNumber',
      width: 130,
      render: (_: any, record: LineItem) => (
        <Input
          placeholder="LOT-..."
          value={record.lotNumber}
          onChange={(e) => handleLineChange(record.key, 'lotNumber', e.target.value)}
        />
      ),
    },
    {
      title: 'Best-Before',
      dataIndex: 'bestBeforeDate',
      key: 'bestBeforeDate',
      width: 130,
      render: (_: any, record: LineItem) => (
        <DatePicker
          placeholder="Select date"
          value={record.bestBeforeDate ? dayjs(record.bestBeforeDate) : null}
          onChange={(date) => handleLineChange(record.key, 'bestBeforeDate', date?.toISOString())}
          style={{ width: '100%' }}
        />
      ),
    },
    {
      title: 'Variance',
      key: 'variance',
      width: 80,
      render: (_: any, record: LineItem) => {
        const variance = record.receivedQty - record.expectedQty;
        if (variance === 0 && record.expectedQty === 0) return '-';
        const color = variance === 0 ? 'green' : variance > 0 ? 'blue' : 'red';
        return <Tag color={color}>{variance > 0 ? `+${variance}` : variance}</Tag>;
      },
    },
    {
      title: '',
      key: 'actions',
      width: 50,
      render: (_: any, record: LineItem) => (
        <Button
          type="link"
          danger
          icon={<DeleteOutlined />}
          onClick={() => handleRemoveLine(record.key)}
        />
      ),
    },
  ];

  const totalExpected = lineItems.reduce((sum, item) => sum + (item.expectedQty || 0), 0);
  const totalReceived = lineItems.reduce((sum, item) => sum + (item.receivedQty || 0), 0);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <Button icon={<ArrowLeftOutlined />} onClick={() => router.back()}>
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-green-600 to-teal-600 bg-clip-text text-transparent">
              New Goods Receiving
            </h1>
            <p className="text-gray-600 mt-1">Record incoming inventory from suppliers</p>
          </div>
        </div>
        <Space>
          <Button onClick={() => router.back()}>Cancel</Button>
          <Button
            type="primary"
            icon={<SaveOutlined />}
            size="large"
            onClick={() => form.submit()}
            loading={saving}
          >
            Create GRN
          </Button>
        </Space>
      </div>

      <Alert
        message="Best-Before Date Tracking"
        description="For products with expiry dates, enter the Lot Number and Best-Before date for each line. This enables FEFO (First-Expiry, First-Out) picking."
        type="info"
        showIcon
        className="mb-4"
      />

      <Form form={form} layout="vertical" onFinish={handleSubmit}>
        <Card title="Receipt Details" className="mb-6">
          <Row gutter={16}>
            <Col xs={24} md={8}>
              <Form.Item
                label="Reference Number"
                name="referenceNumber"
                rules={[{ required: true, message: 'Please enter reference number' }]}
              >
                <Input placeholder="GRN-2024-001" size="large" />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item label="PO Number" name="poNumber">
                <Input placeholder="PO-2024-001" size="large" />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item label="Expected Date" name="expectedDate">
                <DatePicker style={{ width: '100%' }} size="large" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item label="Supplier" name="supplier">
                <Input placeholder="Enter supplier name" size="large" />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item label="Warehouse" name="warehouseId">
                <Select placeholder="Select warehouse" size="large">
                  <Option value="main">Main Warehouse</Option>
                  <Option value="secondary">Secondary Warehouse</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item label="Notes" name="notes">
            <TextArea rows={2} placeholder="Additional notes..." />
          </Form.Item>
        </Card>

        <Card
          title="Line Items"
          extra={
            <Button type="dashed" icon={<PlusOutlined />} onClick={handleAddLine}>
              Add Line
            </Button>
          }
        >
          {lineItems.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <DownloadOutlined style={{ fontSize: 48 }} />
              <p className="mt-4">No line items added yet.</p>
              <Button type="primary" icon={<PlusOutlined />} onClick={handleAddLine} className="mt-4">
                Add First Item
              </Button>
            </div>
          ) : (
            <>
              <Table
                dataSource={lineItems}
                columns={columns}
                rowKey="key"
                pagination={false}
                scroll={{ x: 1000 }}
              />
              <Divider />
              <Row gutter={16} className="text-right">
                <Col span={12}>
                  <span className="text-gray-600">Total Expected:</span>
                  <span className="ml-2 font-semibold text-lg">{totalExpected}</span>
                </Col>
                <Col span={12}>
                  <span className="text-gray-600">Total Received:</span>
                  <span className="ml-2 font-semibold text-lg">{totalReceived}</span>
                  {totalReceived !== totalExpected && (
                    <Tag color={totalReceived > totalExpected ? 'blue' : 'red'} className="ml-2">
                      {totalReceived - totalExpected > 0 ? '+' : ''}{totalReceived - totalExpected}
                    </Tag>
                  )}
                </Col>
              </Row>
            </>
          )}
        </Card>
      </Form>
    </div>
  );
}
