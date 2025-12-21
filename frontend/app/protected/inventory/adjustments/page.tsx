'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Table, Button, Input, Card, Modal, Form, message, Tag, Tabs, Select, InputNumber, Spin, Alert, App } from 'antd';
import { PlusOutlined, SearchOutlined, EyeOutlined, InboxOutlined, ArrowUpOutlined, ArrowDownOutlined, CheckCircleOutlined, ClockCircleOutlined, ReloadOutlined } from '@ant-design/icons';
import { formatDate } from '@/lib/utils';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import apiService from '@/services/api';

const { Search } = Input;

interface Product {
  id: string;
  name: string;
  sku: string;
}

interface Adjustment {
  id: string;
  referenceNumber?: string;
  type: 'INCREASE' | 'DECREASE';
  reason: string;
  notes?: string;
  status: 'PENDING' | 'APPROVED' | 'COMPLETED' | 'REJECTED';
  createdAt: string;
  items?: Array<{
    id: string;
    productId: string;
    quantity: number;
    product?: Product;
  }>;
  createdBy?: {
    id: string;
    name: string;
    email: string;
  };
}

export default function AdjustmentsPage() {
  const { modal, message: msg } = App.useApp();
  const [loading, setLoading] = useState(true);
  const [adjustments, setAdjustments] = useState<Adjustment[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('all');
  const [searchText, setSearchText] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form] = Form.useForm();
  const router = useRouter();

  // Fetch adjustments from API
  const fetchAdjustments = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await apiService.get('/inventory/adjustments');
      setAdjustments(Array.isArray(data) ? data : []);
    } catch (err: any) {
      console.error('Failed to fetch adjustments:', err);
      setError(err.message || 'Failed to load adjustments');
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch products for dropdown
  const fetchProducts = useCallback(async () => {
    try {
      const data = await apiService.get('/products');
      setProducts(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to fetch products:', err);
    }
  }, []);

  useEffect(() => {
    fetchAdjustments();
    fetchProducts();
  }, [fetchAdjustments, fetchProducts]);

  const handleSubmit = async (values: any) => {
    try {
      setSaving(true);

      const payload = {
        type: values.type,
        reason: values.reason,
        notes: values.notes,
        items: [{
          productId: values.productId,
          quantity: values.quantity
        }]
      };

      await apiService.post('/inventory/adjustments', payload);
      msg.success('Adjustment created successfully!');
      form.resetFields();
      setModalOpen(false);
      fetchAdjustments(); // Refresh the list
    } catch (err: any) {
      console.error('Failed to create adjustment:', err);
      msg.error(err.response?.data?.message || 'Failed to create adjustment');
    } finally {
      setSaving(false);
    }
  };

  // Filter adjustments based on active tab and search
  const getFilteredAdjustments = () => {
    let filtered = adjustments;

    // Filter by tab
    if (activeTab === 'increase') {
      filtered = filtered.filter(a => a.type === 'INCREASE');
    } else if (activeTab === 'decrease') {
      filtered = filtered.filter(a => a.type === 'DECREASE');
    } else if (activeTab === 'completed') {
      filtered = filtered.filter(a => a.status === 'COMPLETED' || a.status === 'APPROVED');
    } else if (activeTab === 'pending') {
      filtered = filtered.filter(a => a.status === 'PENDING');
    }

    // Filter by search
    if (searchText) {
      const search = searchText.toLowerCase();
      filtered = filtered.filter(a =>
        a.referenceNumber?.toLowerCase().includes(search) ||
        a.reason?.toLowerCase().includes(search) ||
        a.items?.some(item => item.product?.name?.toLowerCase().includes(search))
      );
    }

    return filtered;
  };

  const columns = [
    {
      title: 'Reference',
      dataIndex: 'referenceNumber',
      key: 'referenceNumber',
      width: 150,
      render: (text: string, record: Adjustment) => (
        <Link href={`/protected/inventory/adjustments/${record.id}`}>
          <span className="font-medium text-blue-600 cursor-pointer hover:underline">
            {text || `ADJ-${record.id.slice(0, 8)}`}
          </span>
        </Link>
      )
    },
    {
      title: 'Date',
      dataIndex: 'createdAt',
      key: 'date',
      width: 120,
      render: (date: string) => formatDate(date)
    },
    {
      title: 'Product(s)',
      key: 'products',
      width: 200,
      render: (_: any, record: Adjustment) => {
        if (!record.items || record.items.length === 0) return '-';
        const firstItem = record.items[0];
        const productName = firstItem.product?.name || 'Unknown Product';
        if (record.items.length === 1) return productName;
        return `${productName} (+${record.items.length - 1} more)`;
      }
    },
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      width: 120,
      render: (type: string) => (
        <Tag color={type === 'INCREASE' ? 'green' : 'red'}>
          {type === 'INCREASE' ? 'Increase' : 'Decrease'}
        </Tag>
      )
    },
    {
      title: 'Quantity',
      key: 'quantity',
      width: 100,
      render: (_: any, record: Adjustment) => {
        const total = record.items?.reduce((sum, item) => sum + item.quantity, 0) || 0;
        return total;
      }
    },
    {
      title: 'Reason',
      dataIndex: 'reason',
      key: 'reason',
      width: 200
    },
    {
      title: 'Created By',
      key: 'user',
      width: 150,
      render: (_: any, record: Adjustment) => record.createdBy?.name || record.createdBy?.email || '-'
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status: string) => (
        <Tag color={status === 'COMPLETED' || status === 'APPROVED' ? 'green' : status === 'REJECTED' ? 'red' : 'orange'}>
          {status.charAt(0) + status.slice(1).toLowerCase()}
        </Tag>
      )
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 120,
      render: (_: any, record: Adjustment) => (
        <Link href={`/protected/inventory/adjustments/${record.id}`}>
          <Button type="link" icon={<EyeOutlined />} size="small">View</Button>
        </Link>
      ),
    },
  ];

  const allAdjustments = getFilteredAdjustments();
  const increases = adjustments.filter(a => a.type === 'INCREASE');
  const decreases = adjustments.filter(a => a.type === 'DECREASE');
  const completed = adjustments.filter(a => a.status === 'COMPLETED' || a.status === 'APPROVED');
  const pending = adjustments.filter(a => a.status === 'PENDING');

  const renderFiltersAndTable = () => (
    <>
      <div className="flex gap-4 mb-4">
        <Search
          placeholder="Search adjustments..."
          style={{ width: 300 }}
          prefix={<SearchOutlined />}
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          allowClear
        />
        <Button icon={<ReloadOutlined />} onClick={fetchAdjustments}>Refresh</Button>
      </div>
      {error && (
        <Alert
          message="Error"
          description={error}
          type="error"
          showIcon
          className="mb-4"
          closable
          onClose={() => setError(null)}
        />
      )}
      <Table
        columns={columns}
        dataSource={getFilteredAdjustments()}
        rowKey="id"
        loading={loading}
        scroll={{ x: 1200 }}
        onRow={(record) => ({
          onClick: () => router.push(`/protected/inventory/adjustments/${record.id}`),
          style: { cursor: 'pointer' }
        })}
        pagination={{
          showSizeChanger: true,
          showTotal: (total) => `Total ${total} adjustments`,
        }}
      />
    </>
  );

  const tabItems = [
    {
      key: 'all',
      label: <span className="flex items-center gap-2"><InboxOutlined />All Adjustments ({adjustments.length})</span>,
      children: renderFiltersAndTable(),
    },
    {
      key: 'increase',
      label: <span className="flex items-center gap-2"><ArrowUpOutlined />Increases ({increases.length})</span>,
      children: renderFiltersAndTable(),
    },
    {
      key: 'decrease',
      label: <span className="flex items-center gap-2"><ArrowDownOutlined />Decreases ({decreases.length})</span>,
      children: renderFiltersAndTable(),
    },
    {
      key: 'completed',
      label: <span className="flex items-center gap-2"><CheckCircleOutlined />Completed ({completed.length})</span>,
      children: renderFiltersAndTable(),
    },
    {
      key: 'pending',
      label: <span className="flex items-center gap-2"><ClockCircleOutlined />Pending ({pending.length})</span>,
      children: renderFiltersAndTable(),
    },
  ];

  if (loading && adjustments.length === 0) {
    return (
      <div className="flex justify-center items-center h-96">
        <Spin size="large" tip="Loading adjustments..." />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-green-600 to-teal-600 bg-clip-text text-transparent">
            Inventory Adjustments
          </h1>
          <p className="text-gray-600 mt-1">Manage stock adjustments and corrections</p>
        </div>
        <Button type="primary" icon={<PlusOutlined />} size="large" onClick={() => setModalOpen(true)}>
          New Adjustment
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <div className="text-center">
            <p className="text-gray-500 text-sm">Total Adjustments</p>
            <p className="text-3xl font-bold text-blue-600">{adjustments.length}</p>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <p className="text-gray-500 text-sm">Increases</p>
            <p className="text-3xl font-bold text-green-600">{increases.length}</p>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <p className="text-gray-500 text-sm">Decreases</p>
            <p className="text-3xl font-bold text-red-600">{decreases.length}</p>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <p className="text-gray-500 text-sm">Pending</p>
            <p className="text-3xl font-bold text-orange-600">{pending.length}</p>
          </div>
        </Card>
      </div>

      <Card className="shadow-sm">
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={tabItems}
          size="large"
        />
      </Card>

      <Modal
        title="New Inventory Adjustment"
        open={modalOpen}
        onCancel={() => {
          setModalOpen(false);
          form.resetFields();
        }}
        onOk={() => form.submit()}
        confirmLoading={saving}
        width={600}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item
            label="Adjustment Type"
            name="type"
            rules={[{ required: true, message: 'Please select adjustment type' }]}
          >
            <Select placeholder="Select type">
              <Select.Option value="INCREASE">
                <span className="flex items-center gap-2">
                  <ArrowUpOutlined className="text-green-500" /> Increase Stock
                </span>
              </Select.Option>
              <Select.Option value="DECREASE">
                <span className="flex items-center gap-2">
                  <ArrowDownOutlined className="text-red-500" /> Decrease Stock
                </span>
              </Select.Option>
            </Select>
          </Form.Item>

          <Form.Item
            label="Product"
            name="productId"
            rules={[{ required: true, message: 'Please select a product' }]}
          >
            <Select
              showSearch
              placeholder="Search and select product"
              optionFilterProp="label"
              filterOption={(input, option) => {
                const label = option?.label;
                if (typeof label === 'string') {
                  return label.toLowerCase().includes(input.toLowerCase());
                }
                return false;
              }}
              options={products.map(p => ({
                value: p.id,
                label: `${p.name} (${p.sku})`
              }))}
              loading={products.length === 0}
              notFoundContent={products.length === 0 ? <Spin size="small" /> : 'No products found'}
            />
          </Form.Item>

          <Form.Item
            label="Quantity"
            name="quantity"
            rules={[
              { required: true, message: 'Please enter quantity' },
              { type: 'number', min: 1, message: 'Quantity must be at least 1' }
            ]}
          >
            <InputNumber
              style={{ width: '100%' }}
              min={1}
              placeholder="Enter quantity to adjust"
            />
          </Form.Item>

          <Form.Item
            label="Reason"
            name="reason"
            rules={[{ required: true, message: 'Please select a reason' }]}
          >
            <Select placeholder="Select reason">
              <Select.Option value="Purchase Receipt">Purchase Receipt</Select.Option>
              <Select.Option value="Return from Customer">Return from Customer</Select.Option>
              <Select.Option value="Inventory Count">Inventory Count</Select.Option>
              <Select.Option value="Damaged Items">Damaged Items</Select.Option>
              <Select.Option value="Missing Items">Missing Items</Select.Option>
              <Select.Option value="Expired Items">Expired Items</Select.Option>
              <Select.Option value="Theft/Loss">Theft/Loss</Select.Option>
              <Select.Option value="Transfer Adjustment">Transfer Adjustment</Select.Option>
              <Select.Option value="Other">Other</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item
            label="Notes (Optional)"
            name="notes"
          >
            <Input.TextArea
              rows={3}
              placeholder="Add any additional notes about this adjustment"
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
