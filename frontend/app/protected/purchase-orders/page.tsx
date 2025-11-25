'use client';

import React, { useState, useEffect } from 'react';
import { Table, Button, Input, Select, Tag, Space, Card, Modal, Form, DatePicker, InputNumber, message, Tabs } from 'antd';
import {
  PlusOutlined,
  SearchOutlined,
  FilterOutlined,
  EyeOutlined,
  EditOutlined,
  DeleteOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  FileTextOutlined,
  ClockCircleOutlined,
  CheckOutlined,
  InboxOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import { formatCurrency, formatDate, getStatusColor } from '@/lib/utils';
import apiService from '@/services/api';

const { Search } = Input;
const { Option } = Select;

export default function PurchaseOrdersPage() {
  const [loading, setLoading] = useState(false);
  const [purchaseOrders, setPurchaseOrders] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const [form] = Form.useForm();

  // Fetch purchase orders
  const fetchPurchaseOrders = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await apiService.get('/purchase-orders');
      setPurchaseOrders(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch purchase orders');
      message.error(err.message || 'Failed to fetch purchase orders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPurchaseOrders();
  }, []);

  const handleSubmit = async (values: any) => {
    try {
      await apiService.post('/purchase-orders', values);
      message.success('Purchase order created successfully!');
      setModalOpen(false);
      form.resetFields();
      fetchPurchaseOrders();
    } catch (err: any) {
      message.error(err.message || 'Failed to create purchase order');
    }
  };

  const allOrders = purchaseOrders;
  const pendingOrders = purchaseOrders.filter(po => po.status === 'pending');
  const approvedOrders = purchaseOrders.filter(po => po.status === 'approved');
  const receivedOrders = purchaseOrders.filter(po => po.status === 'received');

  const columns = [
    {
      title: 'PO Number',
      dataIndex: 'poNumber',
      key: 'poNumber',
      render: (text: string) => <span className="font-medium text-blue-600">{text}</span>,
    },
    {
      title: 'Supplier',
      dataIndex: 'supplier',
      key: 'supplier',
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={getStatusColor(status)} className="uppercase">
          {status}
        </Tag>
      ),
    },
    {
      title: 'Items',
      dataIndex: 'items',
      key: 'items',
    },
    {
      title: 'Total Amount',
      dataIndex: 'totalAmount',
      key: 'totalAmount',
      render: (amount: number) => formatCurrency(amount),
    },
    {
      title: 'Order Date',
      dataIndex: 'orderDate',
      key: 'orderDate',
      render: (date: string) => formatDate(date),
    },
    {
      title: 'Expected Delivery',
      dataIndex: 'expectedDelivery',
      key: 'expectedDelivery',
      render: (date: string) => formatDate(date),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, record: any) => (
        <Space>
          <Button type="link" icon={<EyeOutlined />} size="small">View</Button>
          <Button type="link" icon={<EditOutlined />} size="small">Edit</Button>
          <Button type="link" icon={<CheckCircleOutlined />} size="small">Approve</Button>
        </Space>
      ),
    },
  ];

  const renderFiltersAndTable = (dataSource: any[]) => (
    <>
      <div className="flex gap-4 mb-4">
        <Search placeholder="Search POs..." style={{ width: 300 }} prefix={<SearchOutlined />} />
        <Select placeholder="Supplier" style={{ width: 200 }} allowClear>
          <Option value="global">Global Suppliers Inc</Option>
          <Option value="tech">TechParts Ltd</Option>
          <Option value="mfg">Manufacturing Co</Option>
        </Select>
        <Button icon={<FilterOutlined />}>More Filters</Button>
        <Button icon={<ReloadOutlined />} onClick={fetchPurchaseOrders}>
          Refresh
        </Button>
      </div>
      <Table columns={columns} dataSource={dataSource} rowKey="id" loading={loading} />
    </>
  );

  const tabItems = [
    {
      key: 'all',
      label: (
        <span className="flex items-center gap-2">
          <FileTextOutlined />
          All Orders ({allOrders.length})
        </span>
      ),
      children: renderFiltersAndTable(allOrders),
    },
    {
      key: 'pending',
      label: (
        <span className="flex items-center gap-2">
          <ClockCircleOutlined />
          Pending ({pendingOrders.length})
        </span>
      ),
      children: renderFiltersAndTable(pendingOrders),
    },
    {
      key: 'approved',
      label: (
        <span className="flex items-center gap-2">
          <CheckOutlined />
          Approved ({approvedOrders.length})
        </span>
      ),
      children: renderFiltersAndTable(approvedOrders),
    },
    {
      key: 'received',
      label: (
        <span className="flex items-center gap-2">
          <InboxOutlined />
          Received ({receivedOrders.length})
        </span>
      ),
      children: renderFiltersAndTable(receivedOrders),
    },
  ];

  return (
    <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Purchase Orders
            </h1>
            <p className="text-gray-600 mt-1">Manage supplier purchase orders and procurement</p>
          </div>
          <Button type="primary" icon={<PlusOutlined />} size="large" onClick={() => setModalOpen(true)}>
            Create PO
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <div className="text-center">
              <p className="text-gray-500 text-sm">Total POs</p>
              <p className="text-3xl font-bold text-blue-600">{allOrders.length}</p>
            </div>
          </Card>
          <Card>
            <div className="text-center">
              <p className="text-gray-500 text-sm">Pending</p>
              <p className="text-3xl font-bold text-orange-600">{pendingOrders.length}</p>
            </div>
          </Card>
          <Card>
            <div className="text-center">
              <p className="text-gray-500 text-sm">Approved</p>
              <p className="text-3xl font-bold text-green-600">{approvedOrders.length}</p>
            </div>
          </Card>
          <Card>
            <div className="text-center">
              <p className="text-gray-500 text-sm">Received</p>
              <p className="text-3xl font-bold text-purple-600">{receivedOrders.length}</p>
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

        {/* Create PO Modal */}
        <Modal
          title="Create Purchase Order"
          open={modalOpen}
          onCancel={() => {
            setModalOpen(false);
            form.resetFields();
          }}
          onOk={() => form.submit()}
          width={800}
          okText="Create"
        >
          <Form
            form={form}
            layout="vertical"
            onFinish={handleSubmit}
          >
            <Form.Item
              label="Supplier"
              name="supplier"
              rules={[{ required: true, message: 'Please select a supplier' }]}
            >
              <Select placeholder="Select supplier" size="large">
                <Option value="Global Suppliers Inc">Global Suppliers Inc</Option>
                <Option value="TechParts Ltd">TechParts Ltd</Option>
                <Option value="Manufacturing Co">Manufacturing Co</Option>
              </Select>
            </Form.Item>

            <Form.Item
              label="PO Number"
              name="poNumber"
              rules={[{ required: true, message: 'Please enter PO number' }]}
            >
              <Input placeholder="PO-2024-XXX" size="large" />
            </Form.Item>

            <Form.Item
              label="Expected Delivery Date"
              name="expectedDelivery"
              rules={[{ required: true, message: 'Please select expected delivery date' }]}
            >
              <DatePicker style={{ width: '100%' }} size="large" />
            </Form.Item>

            <Form.Item
              label="Total Amount"
              name="totalAmount"
              rules={[{ required: true, message: 'Please enter total amount' }]}
            >
              <InputNumber
                style={{ width: '100%' }}
                size="large"
                prefix="$"
                min={0}
                step={0.01}
                placeholder="0.00"
              />
            </Form.Item>

            <Form.Item label="Notes" name="notes">
              <Input.TextArea rows={3} placeholder="Add any notes..." />
            </Form.Item>
          </Form>
        </Modal>
      </div>
      );
}
