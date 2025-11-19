'use client';

import React, { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Table, Button, Input, Select, Tag, Card, Modal, Form, message, Tabs } from 'antd';
import { PlusOutlined, SearchOutlined, FilterOutlined, FileTextOutlined, ClockCircleOutlined, TruckOutlined, CheckCircleOutlined, SwapOutlined, EyeOutlined } from '@ant-design/icons';
import { useModal } from '@/hooks/useModal';
import { formatDate } from '@/lib/utils';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

const { Search } = Input;
const { Option } = Select;

export default function StockTransfersPage() {
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const addModal = useModal();
  const [form] = Form.useForm();
  const router = useRouter();

  const mockData = [
    { id: '1', transferNumber: 'TRN-001', fromWarehouse: 'NYC Warehouse', toWarehouse: 'LA Warehouse', items: 45, status: 'in_transit', value: 12500, requestedDate: '2024-11-10', shippedDate: '2024-11-12', expectedDate: '2024-11-20' },
    { id: '2', transferNumber: 'TRN-002', fromWarehouse: 'SF Warehouse', toWarehouse: 'NYC Warehouse', items: 32, status: 'pending', value: 8900, requestedDate: '2024-11-15', shippedDate: null, expectedDate: '2024-11-25' },
    { id: '3', transferNumber: 'TRN-003', fromWarehouse: 'LA Warehouse', toWarehouse: 'SF Warehouse', items: 28, status: 'completed', value: 15600, requestedDate: '2024-11-05', shippedDate: '2024-11-06', expectedDate: '2024-11-10' },
    { id: '4', transferNumber: 'TRN-004', fromWarehouse: 'NYC Warehouse', toWarehouse: 'LA Warehouse', items: 52, status: 'in_transit', value: 23400, requestedDate: '2024-11-12', shippedDate: '2024-11-14', expectedDate: '2024-11-22' },
  ];

  const columns = [
    {
      title: 'Transfer #',
      dataIndex: 'transferNumber',
      key: 'transferNumber',
      width: 130,
      render: (text: string, record: any) => (
        <Link href={`/transfers/${record.id}`}>
          <span className="font-medium text-blue-600 cursor-pointer hover:underline">{text}</span>
        </Link>
      )
    },
    { title: 'From', dataIndex: 'fromWarehouse', key: 'fromWarehouse', width: 180 },
    { title: 'To', dataIndex: 'toWarehouse', key: 'toWarehouse', width: 180 },
    { title: 'Items', dataIndex: 'items', key: 'items', width: 80 },
    { title: 'Value', dataIndex: 'value', key: 'value', width: 120, render: (val: number) => `$${val.toLocaleString()}` },
    { title: 'Requested', dataIndex: 'requestedDate', key: 'requested', width: 120, render: (date: string) => formatDate(date) },
    { title: 'Expected', dataIndex: 'expectedDate', key: 'expected', width: 120, render: (date: string) => formatDate(date) },
    { title: 'Status', dataIndex: 'status', key: 'status', width: 130, render: (status: string) => <Tag color={status === 'in_transit' ? 'blue' : status === 'completed' ? 'green' : 'orange'}>{status.replace('_', ' ')}</Tag> },
    {
      title: 'Actions',
      key: 'actions',
      width: 120,
      render: (_: any, record: any) => (
        <Link href={`/transfers/${record.id}`}>
          <Button type="link" icon={<EyeOutlined />} size="small">View</Button>
        </Link>
      ),
    },
  ];

  const handleSubmit = (values: any) => {
    console.log('Form values:', values);
    message.success('Transfer created successfully!');
    form.resetFields();
    addModal.close();
  };

  const allTransfers = mockData;
  const pendingTransfers = mockData.filter(t => t.status === 'pending');
  const inTransitTransfers = mockData.filter(t => t.status === 'in_transit');
  const completedTransfers = mockData.filter(t => t.status === 'completed');

  const renderFiltersAndTable = (dataSource: any[]) => (
    <>
      <div className="flex gap-4 mb-4">
        <Search placeholder="Search transfers..." style={{ width: 300 }} prefix={<SearchOutlined />} />
        <Select placeholder="Warehouse" style={{ width: 200 }} allowClear>
          <Option value="nyc">NYC Warehouse</Option>
          <Option value="la">LA Warehouse</Option>
          <Option value="sf">SF Warehouse</Option>
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
          onClick: () => router.push(`/transfers/${record.id}`),
          style: { cursor: 'pointer' }
        })}
      />
    </>
  );

  const tabItems = [
    {
      key: 'all',
      label: <span className="flex items-center gap-2"><FileTextOutlined />All Transfers ({allTransfers.length})</span>,
      children: renderFiltersAndTable(allTransfers),
    },
    {
      key: 'pending',
      label: <span className="flex items-center gap-2"><ClockCircleOutlined />Pending ({pendingTransfers.length})</span>,
      children: renderFiltersAndTable(pendingTransfers),
    },
    {
      key: 'in-transit',
      label: <span className="flex items-center gap-2"><TruckOutlined />In Transit ({inTransitTransfers.length})</span>,
      children: renderFiltersAndTable(inTransitTransfers),
    },
    {
      key: 'completed',
      label: <span className="flex items-center gap-2"><CheckCircleOutlined />Completed ({completedTransfers.length})</span>,
      children: renderFiltersAndTable(completedTransfers),
    },
  ];

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-teal-600 to-green-600 bg-clip-text text-transparent">
              Stock Transfers
            </h1>
            <p className="text-gray-600 mt-1">Manage inter-warehouse stock transfers</p>
          </div>
          <Button type="primary" icon={<PlusOutlined />} size="large" onClick={addModal.open}>
            Create Transfer
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <div className="text-center">
              <p className="text-gray-500 text-sm">Pending Transfers</p>
              <p className="text-3xl font-bold text-orange-600">8</p>
            </div>
          </Card>
          <Card>
            <div className="text-center">
              <p className="text-gray-500 text-sm">In Transit</p>
              <p className="text-3xl font-bold text-blue-600">15</p>
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
              <p className="text-gray-500 text-sm">Total Value</p>
              <p className="text-3xl font-bold text-purple-600">$145K</p>
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
          title="Create Transfer"
          open={addModal.isOpen}
          onCancel={addModal.close}
          onOk={() => form.submit()}
          width={600}
        >
          <Form form={form} layout="vertical" onFinish={handleSubmit}>
            <Form.Item label="From Warehouse" name="fromWarehouse" rules={[{ required: true }]}>
              <Select placeholder="Select source warehouse">
                <Option value="NYC Warehouse">NYC Warehouse</Option>
                <Option value="LA Warehouse">LA Warehouse</Option>
                <Option value="SF Warehouse">SF Warehouse</Option>
              </Select>
            </Form.Item>
            <Form.Item label="To Warehouse" name="toWarehouse" rules={[{ required: true }]}>
              <Select placeholder="Select destination warehouse">
                <Option value="NYC Warehouse">NYC Warehouse</Option>
                <Option value="LA Warehouse">LA Warehouse</Option>
                <Option value="SF Warehouse">SF Warehouse</Option>
              </Select>
            </Form.Item>
            <Form.Item label="Number of Items" name="items" rules={[{ required: true }]}>
              <Input type="number" placeholder="Enter number of items" />
            </Form.Item>
          </Form>
        </Modal>
      </div>
    </MainLayout>
  );
}
