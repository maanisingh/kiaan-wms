'use client';

import React, { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Table, Button, Input, Select, Tag, Card, Modal, Form, message, Tabs } from 'antd';
import { PlusOutlined, SearchOutlined, FilterOutlined, EyeOutlined, ClockCircleOutlined, SyncOutlined, CheckCircleOutlined, InboxOutlined } from '@ant-design/icons';
import { useModal } from '@/hooks/useModal';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

const { Search } = Input;
const { Option } = Select;

export default function PickListsAndWavePickingPage() {
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const addModal = useModal();
  const [form] = Form.useForm();
  const router = useRouter();

  const mockData = [
    { id: '1', pickListNumber: 'PICK-001', orderNumber: 'SO-2024-045', picker: 'John Doe', status: 'in_progress', items: 12, zone: 'A1', priority: 'high' },
    { id: '2', pickListNumber: 'PICK-002', orderNumber: 'SO-2024-046', picker: 'Jane Smith', status: 'pending', items: 8, zone: 'B2', priority: 'medium' },
    { id: '3', pickListNumber: 'PICK-003', orderNumber: 'SO-2024-047', picker: 'Bob Wilson', status: 'completed', items: 15, zone: 'A1', priority: 'low' },
    { id: '4', pickListNumber: 'PICK-004', orderNumber: 'SO-2024-048', picker: 'Alice Brown', status: 'in_progress', items: 6, zone: 'C1', priority: 'high' },
    { id: '5', pickListNumber: 'PICK-005', orderNumber: 'SO-2024-049', picker: 'John Doe', status: 'pending', items: 20, zone: 'B1', priority: 'medium' },
  ];

  const columns = [
    {
      title: 'Pick List',
      dataIndex: 'pickListNumber',
      key: 'pickListNumber',
      width: 130,
      render: (text: string, record: any) => (
        <Link href={`/picking/${record.id}`}>
          <span className="font-medium text-blue-600 cursor-pointer hover:underline">{text}</span>
        </Link>
      )
    },
    { title: 'Order #', dataIndex: 'orderNumber', key: 'orderNumber', width: 140 },
    { title: 'Picker', dataIndex: 'picker', key: 'picker', width: 130 },
    { title: 'Status', dataIndex: 'status', key: 'status', width: 120, render: (status: string) => <Tag color={status === 'completed' ? 'green' : status === 'in_progress' ? 'blue' : 'orange'}>{status.replace('_', ' ')}</Tag> },
    { title: 'Priority', dataIndex: 'priority', key: 'priority', width: 100, render: (p: string) => <Tag color={p === 'high' ? 'red' : p === 'medium' ? 'orange' : 'blue'}>{p}</Tag> },
    { title: 'Items', dataIndex: 'items', key: 'items', width: 80 },
    { title: 'Zone', dataIndex: 'zone', key: 'zone', width: 80 },
    {
      title: 'Actions',
      key: 'actions',
      width: 120,
      render: (_: any, record: any) => (
        <Link href={`/picking/${record.id}`}>
          <Button type="link" icon={<EyeOutlined />} size="small">View</Button>
        </Link>
      ),
    },
  ];

  const handleSubmit = (values: any) => {
    console.log('Form values:', values);
    message.success('Pick list created successfully!');
    form.resetFields();
    addModal.close();
  };

  const allPicks = mockData;
  const pendingPicks = mockData.filter(p => p.status === 'pending');
  const inProgressPicks = mockData.filter(p => p.status === 'in_progress');
  const completedPicks = mockData.filter(p => p.status === 'completed');

  const renderFiltersAndTable = (dataSource: any[]) => (
    <>
      <div className="flex gap-4 mb-4">
        <Search placeholder="Search pick lists..." style={{ width: 300 }} prefix={<SearchOutlined />} />
        <Select placeholder="Zone" style={{ width: 150 }} allowClear>
          <Option value="A1">Zone A1</Option>
          <Option value="B1">Zone B1</Option>
          <Option value="C1">Zone C1</Option>
        </Select>
        <Select placeholder="Picker" style={{ width: 150 }} allowClear>
          <Option value="John Doe">John Doe</Option>
          <Option value="Jane Smith">Jane Smith</Option>
        </Select>
      </div>
      <Table
        columns={columns}
        dataSource={dataSource}
        rowKey="id"
        loading={loading}
        scroll={{ x: 1000 }}
        onRow={(record) => ({
          onClick: () => router.push(`/picking/${record.id}`),
          style: { cursor: 'pointer' }
        })}
      />
    </>
  );

  const tabItems = [
    {
      key: 'all',
      label: <span className="flex items-center gap-2"><InboxOutlined />All Picks ({allPicks.length})</span>,
      children: renderFiltersAndTable(allPicks),
    },
    {
      key: 'pending',
      label: <span className="flex items-center gap-2"><ClockCircleOutlined />Pending ({pendingPicks.length})</span>,
      children: renderFiltersAndTable(pendingPicks),
    },
    {
      key: 'in_progress',
      label: <span className="flex items-center gap-2"><SyncOutlined />In Progress ({inProgressPicks.length})</span>,
      children: renderFiltersAndTable(inProgressPicks),
    },
    {
      key: 'completed',
      label: <span className="flex items-center gap-2"><CheckCircleOutlined />Completed ({completedPicks.length})</span>,
      children: renderFiltersAndTable(completedPicks),
    },
  ];

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              Pick Lists & Wave Picking
            </h1>
            <p className="text-gray-600 mt-1">Manage warehouse picking operations and wave processing</p>
          </div>
          <Button type="primary" icon={<PlusOutlined />} size="large" onClick={addModal.open}>
            Create Pick List
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <div className="text-center">
              <p className="text-gray-500 text-sm">Pending Picks</p>
              <p className="text-3xl font-bold text-orange-600">{pendingPicks.length}</p>
            </div>
          </Card>
          <Card>
            <div className="text-center">
              <p className="text-gray-500 text-sm">In Progress</p>
              <p className="text-3xl font-bold text-blue-600">{inProgressPicks.length}</p>
            </div>
          </Card>
          <Card>
            <div className="text-center">
              <p className="text-gray-500 text-sm">Completed</p>
              <p className="text-3xl font-bold text-green-600">{completedPicks.length}</p>
            </div>
          </Card>
          <Card>
            <div className="text-center">
              <p className="text-gray-500 text-sm">Pick Rate/Hour</p>
              <p className="text-3xl font-bold text-purple-600">98</p>
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
          title="Create Pick List"
          open={addModal.isOpen}
          onCancel={addModal.close}
          onOk={() => form.submit()}
          width={600}
        >
          <Form form={form} layout="vertical" onFinish={handleSubmit}>
            <Form.Item label="Order Number" name="orderNumber" rules={[{ required: true }]}>
              <Input placeholder="Enter order number" />
            </Form.Item>
            <Form.Item label="Picker" name="picker" rules={[{ required: true }]}>
              <Input placeholder="Select picker" />
            </Form.Item>
            <Form.Item label="Zone" name="zone" rules={[{ required: true }]}>
              <Select placeholder="Select zone">
                <Option value="A1">Zone A1</Option>
                <Option value="A2">Zone A2</Option>
                <Option value="B1">Zone B1</Option>
                <Option value="B2">Zone B2</Option>
              </Select>
            </Form.Item>
          </Form>
        </Modal>
      </div>
    </MainLayout>
  );
}
