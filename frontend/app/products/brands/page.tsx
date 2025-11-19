'use client';

import React, { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Table, Button, Input, Card, Modal, Form, message } from 'antd';
import { PlusOutlined, SearchOutlined } from '@ant-design/icons';
import { useModal } from '@/hooks/useModal';

export default function ProductCategoriesPage() {
  const [loading, setLoading] = useState(false);
  const addModal = useModal();
  const [form] = Form.useForm();

  const mockData = [
    { id: '1', name: 'Electronics', code: 'ELEC', products: 245, parent: null },
    { id: '2', name: 'Clothing', code: 'CLTH', products: 189, parent: null },
  ];

  const columns = [
    { title: 'Category Name', dataIndex: 'name', key: 'name' },
    { title: 'Code', dataIndex: 'code', key: 'code' },
    { title: 'Products', dataIndex: 'products', key: 'products' },
  ];

  const handleSubmit = (values: any) => {
    console.log('Form values:', values);
    message.success('Category created successfully!');
    form.resetFields();
    addModal.close();
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Product Categories</h1>
            <p className="text-gray-600 mt-1">Manage product categories and classifications</p>
          </div>
          <Button type="primary" icon={<PlusOutlined />} size="large" onClick={addModal.open}>
            Add Category
          </Button>
        </div>

        <Card>
          <div className="flex gap-4 mb-4">
            <Input.Search placeholder="Search categories..." style={{ width: 300 }} prefix={<SearchOutlined />} />
          </div>
          <Table columns={columns} dataSource={mockData} rowKey="id" loading={loading} />
        </Card>

        <Modal title="Add Category" open={addModal.isOpen} onCancel={addModal.close} onOk={() => form.submit()} width={600}>
          <Form form={form} layout="vertical" onFinish={handleSubmit}>
            <Form.Item label="Category Name" name="name" rules={[{ required: true }]}>
              <Input placeholder="Enter category name" />
            </Form.Item>
            <Form.Item label="Code" name="code" rules={[{ required: true }]}>
              <Input placeholder="Enter category code" />
            </Form.Item>
          </Form>
        </Modal>
      </div>
    </MainLayout>
  );
}
