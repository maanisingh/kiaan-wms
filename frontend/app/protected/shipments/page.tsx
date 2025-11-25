'use client';

import React, { useState, useEffect } from 'react';
import { Table, Button, Input, Select, Tag, Card, Modal, Form, message, Tabs } from 'antd';
import { PlusOutlined, SearchOutlined, FilterOutlined, EyeOutlined, TruckOutlined, ClockCircleOutlined, CheckCircleOutlined, ReloadOutlined } from '@ant-design/icons';
import { useModal } from '@/hooks/useModal';
import Link from 'next/link';
import { formatDate } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import apiService from '@/services/api';

const { Search } = Input;
const { Option } = Select;

export default function ShipmentManagementPage() {
  const [loading, setLoading] = useState(false);
  const [shipments, setShipments] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('all');
  const addModal = useModal();
  const [form] = Form.useForm();
  const router = useRouter();

  // Fetch shipments
  const fetchShipments = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await apiService.get('/shipments');
      setShipments(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch shipments');
      message.error(err.message || 'Failed to fetch shipments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchShipments();
  }, []);

  const handleSubmit = async (values: any) => {
    try {
      await apiService.post('/shipments', values);
      message.success('Shipment created successfully!');
      form.resetFields();
      addModal.close();
      fetchShipments();
    } catch (err: any) {
      message.error(err.message || 'Failed to create shipment');
    }
  };

  const allShipments = shipments;
  const pendingShipments = shipments.filter(s => s.status === 'pending');
  const inTransitShipments = shipments.filter(s => s.status === 'in_transit');
  const deliveredShipments = shipments.filter(s => s.status === 'delivered');

  const columns = [
    {
      title: 'Shipment #',
      dataIndex: 'shipmentNumber',
      key: 'shipmentNumber',
      width: 130,
      render: (text: string, record: any) => (
        <Link href={`/shipments/${record.id}`}>
          <span className="font-medium text-blue-600 cursor-pointer hover:underline">{text}</span>
        </Link>
      )
    },
    { title: 'Carrier', dataIndex: 'carrier', key: 'carrier', width: 100 },
    { title: 'Tracking', dataIndex: 'tracking', key: 'tracking', width: 180 },
    { title: 'Status', dataIndex: 'status', key: 'status', width: 120, render: (status: string) => <Tag color={status === 'delivered' ? 'green' : status === 'in_transit' ? 'blue' : 'orange'}>{status.replace('_', ' ')}</Tag> },
    { title: 'Orders', dataIndex: 'orders', key: 'orders', width: 80 },
    { title: 'Ship Date', dataIndex: 'shipDate', key: 'shipDate', width: 120, render: (date: string) => date ? formatDate(date) : '-' },
    { title: 'Destination', dataIndex: 'destination', key: 'destination', width: 200 },
    {
      title: 'Actions',
      key: 'actions',
      width: 120,
      render: (_: any, record: any) => (
        <Link href={`/shipments/${record.id}`}>
          <Button type="link" icon={<EyeOutlined />} size="small">View</Button>
        </Link>
      ),
    },
  ];

  const renderFiltersAndTable = (dataSource: any[]) => (
    <>
      <div className="flex gap-4 mb-4">
        <Search placeholder="Search shipments..." style={{ width: 300 }} prefix={<SearchOutlined />} />
        <Select placeholder="Carrier" style={{ width: 150 }} allowClear>
          <Option value="FedEx">FedEx</Option>
          <Option value="UPS">UPS</Option>
          <Option value="DHL">DHL</Option>
          <Option value="USPS">USPS</Option>
        </Select>
        <Button icon={<FilterOutlined />}>More Filters</Button>
        <Button icon={<ReloadOutlined />} onClick={fetchShipments}>
          Refresh
        </Button>
      </div>
      <Table
        columns={columns}
        dataSource={dataSource}
        rowKey="id"
        loading={loading}
        scroll={{ x: 1200 }}
        onRow={(record) => ({
          onClick: () => router.push(`/shipments/${record.id}`),
          style: { cursor: 'pointer' }
        })}
      />
    </>
  );

  const tabItems = [
    {
      key: 'all',
      label: <span className="flex items-center gap-2"><TruckOutlined />All Shipments ({allShipments.length})</span>,
      children: renderFiltersAndTable(allShipments),
    },
    {
      key: 'pending',
      label: <span className="flex items-center gap-2"><ClockCircleOutlined />Pending ({pendingShipments.length})</span>,
      children: renderFiltersAndTable(pendingShipments),
    },
    {
      key: 'in-transit',
      label: <span className="flex items-center gap-2"><TruckOutlined />In Transit ({inTransitShipments.length})</span>,
      children: renderFiltersAndTable(inTransitShipments),
    },
    {
      key: 'delivered',
      label: <span className="flex items-center gap-2"><CheckCircleOutlined />Delivered ({deliveredShipments.length})</span>,
      children: renderFiltersAndTable(deliveredShipments),
    },
  ];

  return (
    <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-green-600 to-teal-600 bg-clip-text text-transparent">
              Shipment Management
            </h1>
            <p className="text-gray-600 mt-1">Track and manage outbound shipments</p>
          </div>
          <Button type="primary" icon={<PlusOutlined />} size="large" onClick={addModal.open}>
            Add New
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <div className="text-center">
              <p className="text-gray-500 text-sm">In Transit</p>
              <p className="text-3xl font-bold text-blue-600">{inTransitShipments.length}</p>
            </div>
          </Card>
          <Card>
            <div className="text-center">
              <p className="text-gray-500 text-sm">Delivered Today</p>
              <p className="text-3xl font-bold text-green-600">{deliveredShipments.length}</p>
            </div>
          </Card>
          <Card>
            <div className="text-center">
              <p className="text-gray-500 text-sm">Pending Pickup</p>
              <p className="text-3xl font-bold text-orange-600">{pendingShipments.length}</p>
            </div>
          </Card>
          <Card>
            <div className="text-center">
              <p className="text-gray-500 text-sm">Total</p>
              <p className="text-3xl font-bold text-purple-600">{allShipments.length}</p>
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
          title="Create Shipment"
          open={addModal.isOpen}
          onCancel={addModal.close}
          onOk={() => form.submit()}
          width={600}
        >
          <Form form={form} layout="vertical" onFinish={handleSubmit}>
            <Form.Item label="Carrier" name="carrier" rules={[{ required: true }]}>
              <Select placeholder="Select carrier">
                <Option value="FedEx">FedEx</Option>
                <Option value="UPS">UPS</Option>
                <Option value="DHL">DHL</Option>
                <Option value="USPS">USPS</Option>
              </Select>
            </Form.Item>
            <Form.Item label="Tracking Number" name="tracking" rules={[{ required: true }]}>
              <Input placeholder="Enter tracking number" />
            </Form.Item>
            <Form.Item label="Destination" name="destination" rules={[{ required: true }]}>
              <Input placeholder="Enter destination" />
            </Form.Item>
          </Form>
        </Modal>
      </div>
      );
}
