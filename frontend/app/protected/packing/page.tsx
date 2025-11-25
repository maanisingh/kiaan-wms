'use client';

import React, { useState, useEffect } from 'react';
import { Table, Button, Input, Select, Tag, Card, Modal, Form, message, Tabs } from 'antd';
import { PlusOutlined, SearchOutlined, FilterOutlined, EyeOutlined, InboxOutlined, SyncOutlined, CheckCircleOutlined, RocketOutlined, ReloadOutlined } from '@ant-design/icons';
import { useModal } from '@/hooks/useModal';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import apiService from '@/services/api';

const { Search } = Input;
const { Option } = Select;

export default function PackingAndShippingPreparationPage() {
  const [loading, setLoading] = useState(false);
  const [packingTasks, setPackingTasks] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('all');
  const addModal = useModal();
  const [form] = Form.useForm();
  const router = useRouter();

  // Fetch packing tasks
  const fetchPackingTasks = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await apiService.get('/api/packing');
      setPackingTasks(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch packing tasks');
      message.error(err.message || 'Failed to fetch packing tasks');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPackingTasks();
  }, []);

  const handleSubmit = async (values: any) => {
    try {
      await apiService.post('/api/packing', values);
      message.success('Packing slip created successfully!');
      form.resetFields();
      addModal.close();
      fetchPackingTasks();
    } catch (err: any) {
      message.error(err.message || 'Failed to create packing slip');
    }
  };

  const allPacks = packingTasks;
  const readyToPack = packingTasks.filter(p => p.status === 'ready_to_pack');
  const packing = packingTasks.filter(p => p.status === 'packing');
  const packed = packingTasks.filter(p => p.status === 'packed');
  const readyToShip = packingTasks.filter(p => p.status === 'ready_to_ship');

  const columns = [
    {
      title: 'Packing Slip',
      dataIndex: 'packingSlip',
      key: 'packingSlip',
      width: 130,
      render: (text: string, record: any) => (
        <Link href={`/packing/${record.id}`}>
          <span className="font-medium text-blue-600 cursor-pointer hover:underline">{text}</span>
        </Link>
      )
    },
    { title: 'Order #', dataIndex: 'orderNumber', key: 'orderNumber', width: 140 },
    { title: 'Packer', dataIndex: 'packer', key: 'packer', width: 130 },
    { title: 'Status', dataIndex: 'status', key: 'status', width: 130, render: (status: string) => <Tag color={status === 'ready_to_ship' ? 'green' : status === 'packed' ? 'cyan' : status === 'packing' ? 'blue' : 'orange'}>{status.replace(/_/g, ' ')}</Tag> },
    { title: 'Priority', dataIndex: 'priority', key: 'priority', width: 100, render: (p: string) => <Tag color={p === 'high' ? 'red' : p === 'medium' ? 'orange' : 'blue'}>{p}</Tag> },
    { title: 'Items', dataIndex: 'items', key: 'items', width: 80 },
    { title: 'Weight', dataIndex: 'weight', key: 'weight', width: 100 },
    {
      title: 'Actions',
      key: 'actions',
      width: 120,
      render: (_: any, record: any) => (
        <Link href={`/packing/${record.id}`}>
          <Button type="link" icon={<EyeOutlined />} size="small">View</Button>
        </Link>
      ),
    },
  ];

  const renderFiltersAndTable = (dataSource: any[]) => (
    <>
      <div className="flex gap-4 mb-4">
        <Search placeholder="Search packing slips..." style={{ width: 300 }} prefix={<SearchOutlined />} />
        <Select placeholder="Packer" style={{ width: 150 }} allowClear>
          <Option value="Mike Johnson">Mike Johnson</Option>
          <Option value="Sarah Lee">Sarah Lee</Option>
          <Option value="Tom Davis">Tom Davis</Option>
        </Select>
        <Select placeholder="Priority" style={{ width: 150 }} allowClear>
          <Option value="high">High</Option>
          <Option value="medium">Medium</Option>
          <Option value="low">Low</Option>
        </Select>
        <Button icon={<ReloadOutlined />} onClick={fetchPackingTasks}>
          Refresh
        </Button>
      </div>
      <Table
        columns={columns}
        dataSource={dataSource}
        rowKey="id"
        loading={loading}
        scroll={{ x: 1000 }}
        onRow={(record) => ({
          onClick: () => router.push(`/packing/${record.id}`),
          style: { cursor: 'pointer' }
        })}
      />
    </>
  );

  const tabItems = [
    {
      key: 'all',
      label: <span className="flex items-center gap-2"><InboxOutlined />All Packs ({allPacks.length})</span>,
      children: renderFiltersAndTable(allPacks),
    },
    {
      key: 'ready_to_pack',
      label: <span className="flex items-center gap-2"><InboxOutlined />Ready to Pack ({readyToPack.length})</span>,
      children: renderFiltersAndTable(readyToPack),
    },
    {
      key: 'packing',
      label: <span className="flex items-center gap-2"><SyncOutlined />Packing ({packing.length})</span>,
      children: renderFiltersAndTable(packing),
    },
    {
      key: 'packed',
      label: <span className="flex items-center gap-2"><CheckCircleOutlined />Packed ({packed.length})</span>,
      children: renderFiltersAndTable(packed),
    },
    {
      key: 'ready_to_ship',
      label: <span className="flex items-center gap-2"><RocketOutlined />Ready to Ship ({readyToShip.length})</span>,
      children: renderFiltersAndTable(readyToShip),
    },
  ];

  return (
    <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
              Packing & Shipping Preparation
            </h1>
            <p className="text-gray-600 mt-1">Pack orders and prepare for shipment</p>
          </div>
          <Button type="primary" icon={<PlusOutlined />} size="large" onClick={addModal.open}>
            Create Packing Slip
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <div className="text-center">
              <p className="text-gray-500 text-sm">Ready to Pack</p>
              <p className="text-3xl font-bold text-orange-600">{readyToPack.length}</p>
            </div>
          </Card>
          <Card>
            <div className="text-center">
              <p className="text-gray-500 text-sm">Packing Now</p>
              <p className="text-3xl font-bold text-blue-600">{packing.length}</p>
            </div>
          </Card>
          <Card>
            <div className="text-center">
              <p className="text-gray-500 text-sm">Packed</p>
              <p className="text-3xl font-bold text-cyan-600">{packed.length}</p>
            </div>
          </Card>
          <Card>
            <div className="text-center">
              <p className="text-gray-500 text-sm">Ready to Ship</p>
              <p className="text-3xl font-bold text-green-600">{readyToShip.length}</p>
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
          title="Create Packing Slip"
          open={addModal.isOpen}
          onCancel={addModal.close}
          onOk={() => form.submit()}
          width={600}
        >
          <Form form={form} layout="vertical" onFinish={handleSubmit}>
            <Form.Item label="Order Number" name="orderNumber" rules={[{ required: true }]}>
              <Input placeholder="Enter order number" />
            </Form.Item>
            <Form.Item label="Packer" name="packer" rules={[{ required: true }]}>
              <Input placeholder="Select packer" />
            </Form.Item>
            <Form.Item label="Weight (kg)" name="weight" rules={[{ required: true }]}>
              <Input type="number" placeholder="Enter weight" />
            </Form.Item>
          </Form>
        </Modal>
      </div>
      );
}
