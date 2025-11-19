'use client';

import React, { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Table, Button, Input, Card, Modal, Form, message } from 'antd';
import { PlusOutlined, SearchOutlined } from '@ant-design/icons';
import { useModal } from '@/hooks/useModal';

export default function WarehouseLocationsPage() {
  const [loading, setLoading] = useState(false);
  const addModal = useModal();
  const [form] = Form.useForm();

  const mockData = [
    { id: '1', location: 'A1-01-01', zone: 'Zone A', aisle: '01', rack: '01', shelf: '01', type: 'Standard' },
    { id: '2', location: 'B1-01-02', zone: 'Zone B', aisle: '01', rack: '02', shelf: '01', type: 'Standard' },
  ];

  const columns = [
    { title: 'Location', dataIndex: 'location', key: 'location' },
    { title: 'Zone', dataIndex: 'zone', key: 'zone' },
    { title: 'Aisle', dataIndex: 'aisle', key: 'aisle' },
    { title: 'Rack', dataIndex: 'rack', key: 'rack' },
    { title: 'Shelf', dataIndex: 'shelf', key: 'shelf' },
    { title: 'Type', dataIndex: 'type', key: 'type' },
  ];

  const handleSubmit = (values: any) => {
    console.log('Form values:', values);
    message.success('Location created successfully!');
    form.resetFields();
    addModal.close();
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Warehouse Locations</h1>
            <p className="text-gray-600 mt-1">Manage warehouse storage locations</p>
          </div>
          <Button type="primary" icon={<PlusOutlined />} size="large" onClick={addModal.open}>
            Add Location
          </Button>
        </div>

        <Card>
          <div className="flex gap-4 mb-4">
            <Input.Search placeholder="Search locations..." style={{ width: 300 }} prefix={<SearchOutlined />} />
          </div>
          <Table columns={columns} dataSource={mockData} rowKey="id" loading={loading} />
        </Card>

        <Modal title="Add Location" open={addModal.isOpen} onCancel={addModal.close} onOk={() => form.submit()} width={600}>
          <Form form={form} layout="vertical" onFinish={handleSubmit}>
            <Form.Item label="Location Code" name="location" rules={[{ required: true }]}>
              <Input placeholder="Enter location code (e.g., A1-01-01)" />
            </Form.Item>
            <Form.Item label="Aisle" name="aisle" rules={[{ required: true }]}>
              <Input placeholder="Enter aisle number" />
            </Form.Item>
            <Form.Item label="Rack" name="rack" rules={[{ required: true }]}>
              <Input placeholder="Enter rack number" />
            </Form.Item>
            <Form.Item label="Shelf" name="shelf" rules={[{ required: true }]}>
              <Input placeholder="Enter shelf number" />
            </Form.Item>
          </Form>
        </Modal>
      </div>
    </MainLayout>
  );
}
