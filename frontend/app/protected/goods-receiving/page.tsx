'use client';

import React, { useState } from 'react';

import { Table, Button, Input, Select, Tag, Card, Modal, Form, message } from 'antd';
import { PlusOutlined, SearchOutlined, InboxOutlined } from '@ant-design/icons';
import { formatDate } from '@/lib/utils';
import { useModal } from '@/hooks/useModal';

const { Search } = Input;
const { Option } = Select;

export default function GoodsReceivingPage() {
  const [loading, setLoading] = useState(false);
  const receiveModal = useModal();
  const [form] = Form.useForm();

  const mockReceipts = [
    { id: '1', receiptNumber: 'GRN-2024-001', poNumber: 'PO-2024-001', supplier: 'Global Suppliers', receivedDate: '2024-11-13', items: 5, status: 'completed' },
    { id: '2', receiptNumber: 'GRN-2024-002', poNumber: 'PO-2024-002', supplier: 'TechParts Ltd', receivedDate: '2024-11-12', items: 8, status: 'partial' },
  ];

  const columns = [
    { title: 'GRN Number', dataIndex: 'receiptNumber', key: 'receiptNumber', render: (text: string) => <span className="font-medium text-blue-600">{text}</span> },
    { title: 'PO Number', dataIndex: 'poNumber', key: 'poNumber' },
    { title: 'Supplier', dataIndex: 'supplier', key: 'supplier' },
    { title: 'Received Date', dataIndex: 'receivedDate', key: 'receivedDate', render: (date: string) => formatDate(date) },
    { title: 'Items', dataIndex: 'items', key: 'items' },
    { title: 'Status', dataIndex: 'status', key: 'status', render: (status: string) => <Tag color={status === 'completed' ? 'green' : 'orange'}>{status}</Tag> },
  ];

  const handleSubmit = (values: any) => {
    console.log('Form values:', values);
    message.success('Goods receipt created successfully!');
    form.resetFields();
    receiveModal.close();
  };

  return (
    <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">Goods Receiving</h1>
            <p className="text-gray-600 mt-1">Receive and process incoming inventory</p>
          </div>
          <Button type="primary" icon={<InboxOutlined />} size="large" onClick={receiveModal.open}>Receive Goods</Button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card><div className="text-center"><p className="text-gray-500 text-sm">Today's Receipts</p><p className="text-3xl font-bold text-green-600">8</p></div></Card>
          <Card><div className="text-center"><p className="text-gray-500 text-sm">Pending</p><p className="text-3xl font-bold text-orange-600">3</p></div></Card>
          <Card><div className="text-center"><p className="text-gray-500 text-sm">This Week</p><p className="text-3xl font-bold text-blue-600">45</p></div></Card>
          <Card><div className="text-center"><p className="text-gray-500 text-sm">Total Items</p><p className="text-3xl font-bold text-purple-600">1,234</p></div></Card>
        </div>
        <Card>
          <div className="flex gap-4 mb-4">
            <Search placeholder="Search receipts..." style={{ width: 300 }} prefix={<SearchOutlined />} />
            <Select placeholder="Status" style={{ width: 150 }} allowClear>
              <Option value="completed">Completed</Option>
              <Option value="partial">Partial</Option>
            </Select>
          </div>
          <Table columns={columns} dataSource={mockReceipts} rowKey="id" loading={loading} />
        </Card>

        <Modal
          title="Receive Goods"
          open={receiveModal.isOpen}
          onCancel={receiveModal.close}
          onOk={() => form.submit()}
          width={600}
        >
          <Form form={form} layout="vertical" onFinish={handleSubmit}>
            <Form.Item label="PO Number" name="poNumber" rules={[{ required: true }]}>
              <Select placeholder="Select purchase order">
                <Option value="PO-2024-001">PO-2024-001</Option>
                <Option value="PO-2024-002">PO-2024-002</Option>
              </Select>
            </Form.Item>
            <Form.Item label="Supplier" name="supplier" rules={[{ required: true }]}>
              <Input placeholder="Enter supplier name" />
            </Form.Item>
            <Form.Item label="Number of Items" name="items" rules={[{ required: true }]}>
              <Input type="number" placeholder="Enter number of items" />
            </Form.Item>
          </Form>
        </Modal>
      </div>
      );
}
