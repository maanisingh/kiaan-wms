'use client';

import React, { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Table, Button, Input, Card, Modal, Form, message, Tag, Tabs } from 'antd';
import { PlusOutlined, SearchOutlined, EyeOutlined, InboxOutlined, ArrowUpOutlined, ArrowDownOutlined, CheckCircleOutlined, ClockCircleOutlined } from '@ant-design/icons';
import { useModal } from '@/hooks/useModal';
import { formatDate } from '@/lib/utils';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

const { Search } = Input;

export default function AdjustmentsPage() {
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const addModal = useModal();
  const [form] = Form.useForm();
  const router = useRouter();

  const mockData = [
    { id: 'ADJ-001', date: '2024-01-15', productName: 'Laptop Computer', type: 'increase', quantity: 50, reason: 'Purchase receipt', user: 'John Doe', status: 'completed' },
    { id: 'ADJ-002', date: '2024-01-14', productName: 'Office Chair', type: 'decrease', quantity: 5, reason: 'Damaged items', user: 'Jane Smith', status: 'completed' },
    { id: 'ADJ-003', date: '2024-01-13', productName: 'Wireless Mouse', type: 'increase', quantity: 100, reason: 'Inventory correction', user: 'Mike Johnson', status: 'pending' },
    { id: 'ADJ-004', date: '2024-01-12', productName: 'Monitor 24"', type: 'decrease', quantity: 3, reason: 'Missing items', user: 'John Doe', status: 'completed' },
  ];

  const columns = [
    {
      title: 'Adjustment ID',
      dataIndex: 'id',
      key: 'id',
      width: 150,
      render: (text: string, record: any) => (
        <Link href={`/inventory/adjustments/${record.id}`}>
          <span className="font-medium text-blue-600 cursor-pointer hover:underline">{text}</span>
        </Link>
      )
    },
    { title: 'Date', dataIndex: 'date', key: 'date', width: 120, render: (date: string) => formatDate(date) },
    { title: 'Product', dataIndex: 'productName', key: 'product', width: 200 },
    { title: 'Type', dataIndex: 'type', key: 'type', width: 120, render: (type: string) => <Tag color={type === 'increase' ? 'green' : 'red'}>{type}</Tag> },
    { title: 'Quantity', dataIndex: 'quantity', key: 'quantity', width: 100 },
    { title: 'Reason', dataIndex: 'reason', key: 'reason', width: 200 },
    { title: 'User', dataIndex: 'user', key: 'user', width: 150 },
    { title: 'Status', dataIndex: 'status', key: 'status', width: 120, render: (status: string) => <Tag color={status === 'completed' ? 'green' : 'orange'}>{status}</Tag> },
    {
      title: 'Actions',
      key: 'actions',
      width: 120,
      render: (_: any, record: any) => (
        <Link href={`/inventory/adjustments/${record.id}`}>
          <Button type="link" icon={<EyeOutlined />} size="small">View</Button>
        </Link>
      ),
    },
  ];

  const handleSubmit = (values: any) => {
    console.log('Form values:', values);
    message.success('Adjustment created successfully!');
    form.resetFields();
    addModal.close();
  };

  const allAdjustments = mockData;
  const increases = mockData.filter(a => a.type === 'increase');
  const decreases = mockData.filter(a => a.type === 'decrease');
  const completed = mockData.filter(a => a.status === 'completed');
  const pending = mockData.filter(a => a.status === 'pending');

  const renderFiltersAndTable = (dataSource: any[]) => (
    <>
      <div className="flex gap-4 mb-4">
        <Search placeholder="Search adjustments..." style={{ width: 300 }} prefix={<SearchOutlined />} />
      </div>
      <Table
        columns={columns}
        dataSource={dataSource}
        rowKey="id"
        loading={loading}
        scroll={{ x: 1200 }}
        onRow={(record) => ({
          onClick: () => router.push(`/inventory/adjustments/${record.id}`),
          style: { cursor: 'pointer' }
        })}
      />
    </>
  );

  const tabItems = [
    {
      key: 'all',
      label: <span className="flex items-center gap-2"><InboxOutlined />All Adjustments ({allAdjustments.length})</span>,
      children: renderFiltersAndTable(allAdjustments),
    },
    {
      key: 'increase',
      label: <span className="flex items-center gap-2"><ArrowUpOutlined />Increases ({increases.length})</span>,
      children: renderFiltersAndTable(increases),
    },
    {
      key: 'decrease',
      label: <span className="flex items-center gap-2"><ArrowDownOutlined />Decreases ({decreases.length})</span>,
      children: renderFiltersAndTable(decreases),
    },
    {
      key: 'completed',
      label: <span className="flex items-center gap-2"><CheckCircleOutlined />Completed ({completed.length})</span>,
      children: renderFiltersAndTable(completed),
    },
    {
      key: 'pending',
      label: <span className="flex items-center gap-2"><ClockCircleOutlined />Pending ({pending.length})</span>,
      children: renderFiltersAndTable(pending),
    },
  ];

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-green-600 to-teal-600 bg-clip-text text-transparent">
              Inventory Adjustments
            </h1>
            <p className="text-gray-600 mt-1">Manage stock adjustments and corrections</p>
          </div>
          <Button type="primary" icon={<PlusOutlined />} size="large" onClick={addModal.open}>
            New Adjustment
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <div className="text-center">
              <p className="text-gray-500 text-sm">Total Adjustments</p>
              <p className="text-3xl font-bold text-blue-600">{allAdjustments.length}</p>
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

        <Modal title="New Adjustment" open={addModal.isOpen} onCancel={addModal.close} onOk={() => form.submit()} width={600}>
          <Form form={form} layout="vertical" onFinish={handleSubmit}>
            <Form.Item label="Product" name="product" rules={[{ required: true }]}>
              <Input placeholder="Enter product name" />
            </Form.Item>
            <Form.Item label="Quantity" name="quantity" rules={[{ required: true }]}>
              <Input type="number" placeholder="Enter quantity" />
            </Form.Item>
            <Form.Item label="Reason" name="reason" rules={[{ required: true }]}>
              <Input.TextArea placeholder="Enter reason for adjustment" />
            </Form.Item>
          </Form>
        </Modal>
      </div>
    </MainLayout>
  );
}
