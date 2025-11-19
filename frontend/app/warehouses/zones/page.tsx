'use client';

import React, { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Table, Button, Input, Select, Card, Modal, Form, message } from 'antd';
import { PlusOutlined, SearchOutlined } from '@ant-design/icons';
import { useModal } from '@/hooks/useModal';

export default function WarehouseZonesPage() {
  const [loading, setLoading] = useState(false);
  const addModal = useModal();
  const [form] = Form.useForm();

  const mockData = [
    { id: '1', name: 'Zone A', code: 'A1', warehouse: 'NYC Warehouse', type: 'Receiving', capacity: 1000 },
    { id: '2', name: 'Zone B', code: 'B1', warehouse: 'NYC Warehouse', type: 'Storage', capacity: 5000 },
  ];

  const columns = [
    { title: 'Zone Name', dataIndex: 'name', key: 'name' },
    { title: 'Code', dataIndex: 'code', key: 'code' },
    { title: 'Warehouse', dataIndex: 'warehouse', key: 'warehouse' },
    { title: 'Type', dataIndex: 'type', key: 'type' },
    { title: 'Capacity', dataIndex: 'capacity', key: 'capacity' },
  ];

  const handleSubmit = (values: any) => {
    console.log('Form values:', values);
    message.success('Zone created successfully!');
    form.resetFields();
    addModal.close();
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Warehouse Zones</h1>
            <p className="text-gray-600 mt-1">Manage warehouse zones and areas</p>
          </div>
          <Button type="primary" icon={<PlusOutlined />} size="large" onClick={addModal.open}>
            Add Zone
          </Button>
        </div>

        <Card>
          <div className="flex gap-4 mb-4">
            <Input.Search placeholder="Search zones..." style={{ width: 300 }} prefix={<SearchOutlined />} />
          </div>
          <Table columns={columns} dataSource={mockData} rowKey="id" loading={loading} />
        </Card>

        <Modal title="Add Zone" open={addModal.isOpen} onCancel={addModal.close} onOk={() => form.submit()} width={600}>
          <Form form={form} layout="vertical" onFinish={handleSubmit}>
            <Form.Item label="Zone Name" name="name" rules={[{ required: true }]}>
              <Input placeholder="Enter zone name" />
            </Form.Item>
            <Form.Item label="Code" name="code" rules={[{ required: true }]}>
              <Input placeholder="Enter zone code" />
            </Form.Item>
            <Form.Item label="Type" name="type" rules={[{ required: true }]}>
              <Select placeholder="Select type">
                <Select.Option value="Receiving">Receiving</Select.Option>
                <Select.Option value="Storage">Storage</Select.Option>
                <Select.Option value="Packing">Packing</Select.Option>
                <Select.Option value="Shipping">Shipping</Select.Option>
              </Select>
            </Form.Item>
          </Form>
        </Modal>
      </div>
    </MainLayout>
  );
}
