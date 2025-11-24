'use client';

import React, { useState } from 'react';

import { Table, Button, Input, Card, Modal, Form, message, Tag, Tabs } from 'antd';
import { PlusOutlined, SearchOutlined, EyeOutlined, TruckOutlined, ClockCircleOutlined, CheckCircleOutlined, SyncOutlined } from '@ant-design/icons';
import { useModal } from '@/hooks/useModal';
import { formatDate } from '@/lib/utils';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

const { Search } = Input;

export default function FBATransfersPage() {
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const addModal = useModal();
  const [form] = Form.useForm();
  const router = useRouter();

  const mockData = [
    { id: '1', shipmentId: 'FBA-001', destination: 'FBA-NYC', items: 45, status: 'in_transit', date: '2024-11-13', carrier: 'UPS', tracking: 'UPS123456' },
    { id: '2', shipmentId: 'FBA-002', destination: 'FBA-LA', items: 32, status: 'preparing', date: '2024-11-14', carrier: 'FedEx', tracking: 'FDX789012' },
    { id: '3', shipmentId: 'FBA-003', destination: 'FBA-CHI', items: 67, status: 'delivered', date: '2024-11-10', carrier: 'UPS', tracking: 'UPS345678' },
    { id: '4', shipmentId: 'FBA-004', destination: 'FBA-NYC', items: 28, status: 'preparing', date: '2024-11-15', carrier: 'FedEx', tracking: 'FDX901234' },
  ];

  const columns = [
    {
      title: 'Shipment ID',
      dataIndex: 'shipmentId',
      key: 'shipmentId',
      width: 130,
      render: (text: string, record: any) => (
        <Link href={`/fba-transfers/${record.id}`}>
          <span className="font-medium text-blue-600 cursor-pointer hover:underline">{text}</span>
        </Link>
      )
    },
    { title: 'Destination', dataIndex: 'destination', key: 'destination', width: 150 },
    { title: 'Carrier', dataIndex: 'carrier', key: 'carrier', width: 100 },
    { title: 'Tracking', dataIndex: 'tracking', key: 'tracking', width: 150 },
    { title: 'Items', dataIndex: 'items', key: 'items', width: 80 },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status: string) => (
        <Tag color={status === 'delivered' ? 'green' : status === 'in_transit' ? 'blue' : 'orange'}>
          {status.replace('_', ' ')}
        </Tag>
      )
    },
    { title: 'Date', dataIndex: 'date', key: 'date', width: 120, render: (date: string) => formatDate(date) },
    {
      title: 'Actions',
      key: 'actions',
      width: 120,
      render: (_: any, record: any) => (
        <Link href={`/fba-transfers/${record.id}`}>
          <Button type="link" icon={<EyeOutlined />} size="small">View</Button>
        </Link>
      ),
    },
  ];

  const handleSubmit = (values: any) => {
    console.log('Form values:', values);
    message.success('FBA transfer created successfully!');
    form.resetFields();
    addModal.close();
  };

  const allTransfers = mockData;
  const preparingTransfers = mockData.filter(t => t.status === 'preparing');
  const inTransitTransfers = mockData.filter(t => t.status === 'in_transit');
  const deliveredTransfers = mockData.filter(t => t.status === 'delivered');

  const renderFiltersAndTable = (dataSource: any[]) => (
    <>
      <div className="flex gap-4 mb-4">
        <Search placeholder="Search FBA transfers..." style={{ width: 300 }} prefix={<SearchOutlined />} />
      </div>
      <Table
        columns={columns}
        dataSource={dataSource}
        rowKey="id"
        loading={loading}
        scroll={{ x: 1000 }}
        onRow={(record) => ({
          onClick: () => router.push(`/fba-transfers/${record.id}`),
          style: { cursor: 'pointer' }
        })}
      />
    </>
  );

  const tabItems = [
    {
      key: 'all',
      label: <span className="flex items-center gap-2"><TruckOutlined />All Transfers ({allTransfers.length})</span>,
      children: renderFiltersAndTable(allTransfers),
    },
    {
      key: 'preparing',
      label: <span className="flex items-center gap-2"><SyncOutlined />Preparing ({preparingTransfers.length})</span>,
      children: renderFiltersAndTable(preparingTransfers),
    },
    {
      key: 'in-transit',
      label: <span className="flex items-center gap-2"><ClockCircleOutlined />In Transit ({inTransitTransfers.length})</span>,
      children: renderFiltersAndTable(inTransitTransfers),
    },
    {
      key: 'delivered',
      label: <span className="flex items-center gap-2"><CheckCircleOutlined />Delivered ({deliveredTransfers.length})</span>,
      children: renderFiltersAndTable(deliveredTransfers),
    },
  ];

  return (
    <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
              FBA Transfers
            </h1>
            <p className="text-gray-600 mt-1">Manage Amazon FBA shipments</p>
          </div>
          <Button type="primary" icon={<PlusOutlined />} size="large" onClick={addModal.open}>
            Create Transfer
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <div className="text-center">
              <p className="text-gray-500 text-sm">Preparing</p>
              <p className="text-3xl font-bold text-orange-600">{preparingTransfers.length}</p>
            </div>
          </Card>
          <Card>
            <div className="text-center">
              <p className="text-gray-500 text-sm">In Transit</p>
              <p className="text-3xl font-bold text-blue-600">{inTransitTransfers.length}</p>
            </div>
          </Card>
          <Card>
            <div className="text-center">
              <p className="text-gray-500 text-sm">Delivered</p>
              <p className="text-3xl font-bold text-green-600">{deliveredTransfers.length}</p>
            </div>
          </Card>
          <Card>
            <div className="text-center">
              <p className="text-gray-500 text-sm">Total Value</p>
              <p className="text-3xl font-bold text-purple-600">$24.5K</p>
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

        <Modal title="Add FBA Transfer" open={addModal.isOpen} onCancel={addModal.close} onOk={() => form.submit()} width={600}>
          <Form form={form} layout="vertical" onFinish={handleSubmit}>
            <Form.Item label="Destination FBA" name="destination" rules={[{ required: true }]}>
              <Input placeholder="Enter FBA destination" />
            </Form.Item>
            <Form.Item label="Number of Items" name="items" rules={[{ required: true }]}>
              <Input type="number" placeholder="Enter number of items" />
            </Form.Item>
          </Form>
        </Modal>
      </div>
      );
}
