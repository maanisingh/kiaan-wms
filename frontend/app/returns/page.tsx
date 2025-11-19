'use client';

import React, { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Table, Button, Input, Select, Tag, Card, Modal, Form, message, Tabs, Space } from 'antd';
import { PlusOutlined, SearchOutlined, FilterOutlined, FileTextOutlined, ClockCircleOutlined, SyncOutlined, CheckCircleOutlined, CloseCircleOutlined, EyeOutlined } from '@ant-design/icons';
import { useModal } from '@/hooks/useModal';
import { formatDate } from '@/lib/utils';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

const { Search } = Input;
const { Option } = Select;

export default function ReturnsAndRMAManagementPage() {
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const addModal = useModal();
  const [form] = Form.useForm();
  const router = useRouter();

  const mockData = [
    { id: '1', rmaNumber: 'RMA-001', orderNumber: 'SO-2024-034', customer: 'Acme Corp', reason: 'Damaged', status: 'pending', value: 245, requestedDate: '2024-11-10', type: 'Return' },
    { id: '2', rmaNumber: 'RMA-002', orderNumber: 'SO-2024-028', customer: 'Tech Start', reason: 'Wrong Item', status: 'processing', value: 580, requestedDate: '2024-11-12', type: 'Exchange' },
    { id: '3', rmaNumber: 'RMA-003', orderNumber: 'SO-2024-045', customer: 'Global Trade', reason: 'Defective', status: 'approved', value: 1200, requestedDate: '2024-11-14', type: 'Return' },
    { id: '4', rmaNumber: 'RMA-004', orderNumber: 'SO-2024-032', customer: 'Tech Solutions', reason: 'Not as Described', status: 'completed', value: 340, requestedDate: '2024-11-08', type: 'Refund' },
    { id: '5', rmaNumber: 'RMA-005', orderNumber: 'SO-2024-051', customer: 'Acme Corp', reason: 'Changed Mind', status: 'rejected', value: 89, requestedDate: '2024-11-15', type: 'Return' },
  ];

  const columns = [
    {
      title: 'RMA #',
      dataIndex: 'rmaNumber',
      key: 'rmaNumber',
      width: 120,
      render: (text: string, record: any) => (
        <Link href={`/returns/${record.id}`}>
          <span className="font-medium text-blue-600 cursor-pointer hover:underline">{text}</span>
        </Link>
      )
    },
    { title: 'Order #', dataIndex: 'orderNumber', key: 'orderNumber', width: 130 },
    { title: 'Customer', dataIndex: 'customer', key: 'customer', width: 180 },
    { title: 'Type', dataIndex: 'type', key: 'type', width: 100, render: (type: string) => <Tag color="purple">{type}</Tag> },
    { title: 'Reason', dataIndex: 'reason', key: 'reason', width: 150 },
    { title: 'Requested', dataIndex: 'requestedDate', key: 'requestedDate', width: 120, render: (date: string) => formatDate(date) },
    { title: 'Value', dataIndex: 'value', key: 'value', width: 100, render: (val: number) => `$${val}` },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status: string) => {
        const colors: any = {
          pending: 'orange',
          processing: 'blue',
          approved: 'cyan',
          completed: 'green',
          rejected: 'red'
        };
        return <Tag color={colors[status]}>{status}</Tag>;
      }
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 150,
      render: (_: any, record: any) => (
        <Space>
          <Link href={`/returns/${record.id}`}>
            <Button type="link" icon={<EyeOutlined />} size="small">View</Button>
          </Link>
          <Button type="link" size="small">Process</Button>
        </Space>
      ),
    },
  ];

  const handleSubmit = (values: any) => {
    console.log('Form values:', values);
    message.success('RMA created successfully!');
    form.resetFields();
    addModal.close();
  };

  const allReturns = mockData;
  const pendingReturns = mockData.filter(r => r.status === 'pending');
  const processingReturns = mockData.filter(r => r.status === 'processing');
  const approvedReturns = mockData.filter(r => r.status === 'approved');
  const completedReturns = mockData.filter(r => r.status === 'completed');

  const renderFiltersAndTable = (dataSource: any[]) => (
    <>
      <div className="flex gap-4 mb-4">
        <Search placeholder="Search RMAs..." style={{ width: 300 }} prefix={<SearchOutlined />} />
        <Select placeholder="Return Type" style={{ width: 150 }} allowClear>
          <Option value="return">Return</Option>
          <Option value="exchange">Exchange</Option>
          <Option value="refund">Refund</Option>
        </Select>
        <Select placeholder="Reason" style={{ width: 150 }} allowClear>
          <Option value="damaged">Damaged</Option>
          <Option value="wrong">Wrong Item</Option>
          <Option value="defective">Defective</Option>
        </Select>
        <Button icon={<FilterOutlined />}>More Filters</Button>
      </div>
      <Table
        columns={columns}
        dataSource={dataSource}
        rowKey="id"
        loading={loading}
        scroll={{ x: 1200 }}
        onRow={(record) => ({
          onClick: () => router.push(`/returns/${record.id}`),
          style: { cursor: 'pointer' }
        })}
      />
    </>
  );

  const tabItems = [
    {
      key: 'all',
      label: <span className="flex items-center gap-2"><FileTextOutlined />All Returns ({allReturns.length})</span>,
      children: renderFiltersAndTable(allReturns),
    },
    {
      key: 'pending',
      label: <span className="flex items-center gap-2"><ClockCircleOutlined />Pending ({pendingReturns.length})</span>,
      children: renderFiltersAndTable(pendingReturns),
    },
    {
      key: 'processing',
      label: <span className="flex items-center gap-2"><SyncOutlined />Processing ({processingReturns.length})</span>,
      children: renderFiltersAndTable(processingReturns),
    },
    {
      key: 'approved',
      label: <span className="flex items-center gap-2"><CheckCircleOutlined />Approved ({approvedReturns.length})</span>,
      children: renderFiltersAndTable(approvedReturns),
    },
    {
      key: 'completed',
      label: <span className="flex items-center gap-2"><CheckCircleOutlined />Completed ({completedReturns.length})</span>,
      children: renderFiltersAndTable(completedReturns),
    },
  ];

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-red-600 to-orange-600 bg-clip-text text-transparent">
              Returns & RMA Management
            </h1>
            <p className="text-gray-600 mt-1">Process product returns and exchanges</p>
          </div>
          <Button type="primary" icon={<PlusOutlined />} size="large" onClick={addModal.open}>
            Create RMA
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <div className="text-center">
              <p className="text-gray-500 text-sm">Pending Returns</p>
              <p className="text-3xl font-bold text-orange-600">15</p>
            </div>
          </Card>
          <Card>
            <div className="text-center">
              <p className="text-gray-500 text-sm">Processing</p>
              <p className="text-3xl font-bold text-blue-600">7</p>
            </div>
          </Card>
          <Card>
            <div className="text-center">
              <p className="text-gray-500 text-sm">Completed Today</p>
              <p className="text-3xl font-bold text-green-600">23</p>
            </div>
          </Card>
          <Card>
            <div className="text-center">
              <p className="text-gray-500 text-sm">Return Rate</p>
              <p className="text-3xl font-bold text-red-600">2.8%</p>
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
          title="Create RMA"
          open={addModal.isOpen}
          onCancel={addModal.close}
          onOk={() => form.submit()}
          width={600}
        >
          <Form form={form} layout="vertical" onFinish={handleSubmit}>
            <Form.Item label="Order Number" name="orderNumber" rules={[{ required: true }]}>
              <Input placeholder="Enter order number" />
            </Form.Item>
            <Form.Item label="Customer" name="customer" rules={[{ required: true }]}>
              <Input placeholder="Enter customer name" />
            </Form.Item>
            <Form.Item label="Return Type" name="type" rules={[{ required: true }]}>
              <Select placeholder="Select type">
                <Option value="Return">Return</Option>
                <Option value="Exchange">Exchange</Option>
                <Option value="Refund">Refund</Option>
              </Select>
            </Form.Item>
            <Form.Item label="Reason" name="reason" rules={[{ required: true }]}>
              <Select placeholder="Select reason">
                <Option value="Damaged">Damaged</Option>
                <Option value="Wrong Item">Wrong Item</Option>
                <Option value="Defective">Defective</Option>
                <Option value="Not as Described">Not as Described</Option>
                <Option value="Changed Mind">Changed Mind</Option>
                <Option value="Other">Other</Option>
              </Select>
            </Form.Item>
            <Form.Item label="Value ($)" name="value" rules={[{ required: true }]}>
              <Input type="number" placeholder="Enter value" />
            </Form.Item>
          </Form>
        </Modal>
      </div>
    </MainLayout>
  );
}
