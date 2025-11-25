'use client';

import React, { useState, useEffect } from 'react';
import { Table, Button, Input, Select, Tag, Card, Modal, Form, message } from 'antd';
import { PlusOutlined, SearchOutlined, InboxOutlined, ReloadOutlined } from '@ant-design/icons';
import { formatDate } from '@/lib/utils';
import { useModal } from '@/hooks/useModal';
import apiService from '@/services/api';

const { Search } = Input;
const { Option } = Select;

export default function GoodsReceivingPage() {
  const [loading, setLoading] = useState(false);
  const [receipts, setReceipts] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const receiveModal = useModal();
  const [form] = Form.useForm();

  // Fetch goods receipts
  const fetchReceipts = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await apiService.get('/api/goods-receiving');
      setReceipts(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch receipts');
      message.error(err.message || 'Failed to fetch receipts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReceipts();
  }, []);

  const handleSubmit = async (values: any) => {
    try {
      await apiService.post('/api/goods-receiving', values);
      message.success('Goods receipt created successfully!');
      form.resetFields();
      receiveModal.close();
      fetchReceipts();
    } catch (err: any) {
      message.error(err.message || 'Failed to create goods receipt');
    }
  };

  const columns = [
    { title: 'GRN Number', dataIndex: 'receiptNumber', key: 'receiptNumber', render: (text: string) => <span className="font-medium text-blue-600">{text}</span> },
    { title: 'PO Number', dataIndex: 'poNumber', key: 'poNumber' },
    { title: 'Supplier', dataIndex: 'supplier', key: 'supplier' },
    { title: 'Received Date', dataIndex: 'receivedDate', key: 'receivedDate', render: (date: string) => formatDate(date) },
    { title: 'Items', dataIndex: 'items', key: 'items' },
    { title: 'Status', dataIndex: 'status', key: 'status', render: (status: string) => <Tag color={status === 'completed' ? 'green' : 'orange'}>{status}</Tag> },
  ];

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
          <Card><div className="text-center"><p className="text-gray-500 text-sm">Today's Receipts</p><p className="text-3xl font-bold text-green-600">{receipts.filter(r => new Date(r.receivedDate).toDateString() === new Date().toDateString()).length}</p></div></Card>
          <Card><div className="text-center"><p className="text-gray-500 text-sm">Pending</p><p className="text-3xl font-bold text-orange-600">{receipts.filter(r => r.status === 'partial').length}</p></div></Card>
          <Card><div className="text-center"><p className="text-gray-500 text-sm">This Week</p><p className="text-3xl font-bold text-blue-600">{receipts.length}</p></div></Card>
          <Card><div className="text-center"><p className="text-gray-500 text-sm">Total Items</p><p className="text-3xl font-bold text-purple-600">{receipts.reduce((sum, r) => sum + (r.items || 0), 0)}</p></div></Card>
        </div>
        <Card>
          <div className="flex gap-4 mb-4">
            <Search placeholder="Search receipts..." style={{ width: 300 }} prefix={<SearchOutlined />} />
            <Select placeholder="Status" style={{ width: 150 }} allowClear>
              <Option value="completed">Completed</Option>
              <Option value="partial">Partial</Option>
            </Select>
            <Button icon={<ReloadOutlined />} onClick={fetchReceipts}>
              Refresh
            </Button>
          </div>
          <Table columns={columns} dataSource={receipts} rowKey="id" loading={loading} />
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
