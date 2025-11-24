'use client';

import React, { useState } from 'react';

import { Table, Button, Input, Select, Tag, Card, Modal, Form, message } from 'antd';
import { PlusOutlined, SearchOutlined, FilterOutlined } from '@ant-design/icons';
import { useModal } from '@/hooks/useModal';

const { Search } = Input;
const { Option } = Select;

export default function MultiCompanyManagementPage() {
  const [loading, setLoading] = useState(false);
  const addModal = useModal();
  const [form] = Form.useForm();

  const mockData = [
    { id: '1', name: 'Kiaan Logistics LLC', code: 'KIAN001', warehouses: 5, users: 45, status: 'active' },
    { id: '2', name: 'Global Trading Inc', code: 'GLOB002', warehouses: 8, users: 67, status: 'active' },
  ];

  const columns = [
    { title: 'Company Name', dataIndex: 'name', key: 'name', render: (text: string) => <span className="font-medium text-blue-600">{text}</span> },
    { title: 'Code', dataIndex: 'code', key: 'code' },
    { title: 'Warehouses', dataIndex: 'warehouses', key: 'warehouses' },
    { title: 'Users', dataIndex: 'users', key: 'users' },
    { title: 'Status', dataIndex: 'status', key: 'status', render: (status: string) => <Tag color="green">{status}</Tag> },
  ];

  const handleSubmit = (values: any) => {
    console.log('Form values:', values);
    message.success('Company added successfully!');
    form.resetFields();
    addModal.close();
  };

  return (
    <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
              Multi-Company Management
            </h1>
            <p className="text-gray-600 mt-1">Manage multiple companies and tenants</p>
          </div>
          <Button type="primary" icon={<PlusOutlined />} size="large" onClick={addModal.open}>
            Add New
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <div className="text-center">
              <p className="text-gray-500 text-sm">Total Companies</p>
              <p className="text-3xl font-bold text-blue-600">8</p>
            </div>
          </Card> <Card>
            <div className="text-center">
              <p className="text-gray-500 text-sm">Active Users</p>
              <p className="text-3xl font-bold text-green-600">145</p>
            </div>
          </Card> <Card>
            <div className="text-center">
              <p className="text-gray-500 text-sm">Total Warehouses</p>
              <p className="text-3xl font-bold text-purple-600">24</p>
            </div>
          </Card> <Card>
            <div className="text-center">
              <p className="text-gray-500 text-sm">Combined Revenue</p>
              <p className="text-3xl font-bold text-orange-600">$12.4M</p>
            </div>
          </Card>
        </div>

        <Card>
          <div className="flex gap-4 mb-4">
            <Search placeholder="Search..." style={{ width: 300 }} prefix={<SearchOutlined />} />
            <Select placeholder="Filter" style={{ width: 150 }} allowClear>
              <Option value="all">All</Option>
            </Select>
            <Button icon={<FilterOutlined />}>More Filters</Button>
          </div>
          <Table columns={columns} dataSource={mockData} rowKey="id" loading={loading} />
        </Card>

        <Modal
          title="Add New Company"
          open={addModal.isOpen}
          onCancel={addModal.close}
          onOk={() => form.submit()}
          width={600}
        >
          <Form form={form} layout="vertical" onFinish={handleSubmit}>
            <Form.Item label="Company Name" name="name" rules={[{ required: true, message: 'Please enter company name' }]}>
              <Input placeholder="Enter company name" />
            </Form.Item>
            <Form.Item label="Company Code" name="code" rules={[{ required: true, message: 'Please enter company code' }]}>
              <Input placeholder="Enter company code" />
            </Form.Item>
            <Form.Item label="Status" name="status" rules={[{ required: true, message: 'Please select status' }]}>
              <Select placeholder="Select status">
                <Option value="active">Active</Option>
                <Option value="inactive">Inactive</Option>
              </Select>
            </Form.Item>
          </Form>
        </Modal>
      </div>
      );
}
