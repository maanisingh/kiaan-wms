'use client';

import React, { useState } from 'react';

import { Table, Button, Input, Select, Card, Modal, Form, message, Tag, Tabs } from 'antd';
import { PlusOutlined, SearchOutlined, EyeOutlined, ApiOutlined, ShoppingOutlined, UserOutlined, DatabaseOutlined } from '@ant-design/icons';
import { useModal } from '@/hooks/useModal';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

const { Search } = Input;
const { Option } = Select;

export default function IntegrationMappingsPage() {
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const addModal = useModal();
  const [form] = Form.useForm();
  const router = useRouter();

  const mockData = [
    { id: '1', field: 'Product SKU', external: 'item_code', internal: 'sku', channel: 'Shopify', type: 'Product', status: 'active' },
    { id: '2', field: 'Customer Name', external: 'buyer_name', internal: 'customer_name', channel: 'Amazon', type: 'Customer', status: 'active' },
    { id: '3', field: 'Product Name', external: 'title', internal: 'product_name', channel: 'Shopify', type: 'Product', status: 'active' },
    { id: '4', field: 'Order Number', external: 'order_id', internal: 'order_number', channel: 'eBay', type: 'Order', status: 'active' },
    { id: '5', field: 'Shipping Address', external: 'ship_to', internal: 'shipping_address', channel: 'Amazon', type: 'Customer', status: 'inactive' },
    { id: '6', field: 'Product Price', external: 'amount', internal: 'unit_price', channel: 'Shopify', type: 'Product', status: 'active' },
  ];

  const columns = [
    {
      title: 'Field Name',
      dataIndex: 'field',
      key: 'field',
      width: 180,
      render: (text: string, record: any) => (
        <Link href={`/integrations/mappings/${record.id}`}>
          <span className="font-medium text-blue-600 cursor-pointer hover:underline">{text}</span>
        </Link>
      )
    },
    { title: 'External Field', dataIndex: 'external', key: 'external', width: 150, render: (text: string) => <code className="bg-gray-100 px-2 py-1 rounded">{text}</code> },
    { title: 'Internal Field', dataIndex: 'internal', key: 'internal', width: 150, render: (text: string) => <code className="bg-blue-50 px-2 py-1 rounded">{text}</code> },
    { title: 'Channel', dataIndex: 'channel', key: 'channel', width: 120 },
    { title: 'Type', dataIndex: 'type', key: 'type', width: 100, render: (type: string) => <Tag color="purple">{type}</Tag> },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => <Tag color={status === 'active' ? 'green' : 'red'}>{status}</Tag>
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 120,
      render: (_: any, record: any) => (
        <Link href={`/integrations/mappings/${record.id}`}>
          <Button type="link" icon={<EyeOutlined />} size="small">View</Button>
        </Link>
      ),
    },
  ];

  const handleSubmit = (values: any) => {
    console.log('Form values:', values);
    message.success('Mapping created successfully!');
    form.resetFields();
    addModal.close();
  };

  const allMappings = mockData;
  const productMappings = mockData.filter(m => m.type === 'Product');
  const customerMappings = mockData.filter(m => m.type === 'Customer');
  const orderMappings = mockData.filter(m => m.type === 'Order');

  const renderFiltersAndTable = (dataSource: any[]) => (
    <>
      <div className="flex gap-4 mb-4">
        <Search placeholder="Search mappings..." style={{ width: 300 }} prefix={<SearchOutlined />} />
        <Select placeholder="Channel" style={{ width: 150 }} allowClear>
          <Option value="Shopify">Shopify</Option>
          <Option value="Amazon">Amazon</Option>
          <Option value="eBay">eBay</Option>
        </Select>
        <Select placeholder="Type" style={{ width: 150 }} allowClear>
          <Option value="Product">Product</Option>
          <Option value="Customer">Customer</Option>
          <Option value="Order">Order</Option>
        </Select>
      </div>
      <Table
        columns={columns}
        dataSource={dataSource}
        rowKey="id"
        loading={loading}
        scroll={{ x: 1000 }}
        onRow={(record) => ({
          onClick: () => router.push(`/integrations/mappings/${record.id}`),
          style: { cursor: 'pointer' }
        })}
      />
    </>
  );

  const tabItems = [
    {
      key: 'all',
      label: <span className="flex items-center gap-2"><ApiOutlined />All Mappings ({allMappings.length})</span>,
      children: renderFiltersAndTable(allMappings),
    },
    {
      key: 'product',
      label: <span className="flex items-center gap-2"><ShoppingOutlined />Product ({productMappings.length})</span>,
      children: renderFiltersAndTable(productMappings),
    },
    {
      key: 'customer',
      label: <span className="flex items-center gap-2"><UserOutlined />Customer ({customerMappings.length})</span>,
      children: renderFiltersAndTable(customerMappings),
    },
    {
      key: 'order',
      label: <span className="flex items-center gap-2"><DatabaseOutlined />Order ({orderMappings.length})</span>,
      children: renderFiltersAndTable(orderMappings),
    },
  ];

  return (
    <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              Field Mappings
            </h1>
            <p className="text-gray-600 mt-1">Map external fields to internal system</p>
          </div>
          <Button type="primary" icon={<PlusOutlined />} size="large" onClick={addModal.open}>
            Add Mapping
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <div className="text-center">
              <p className="text-gray-500 text-sm">Total Mappings</p>
              <p className="text-3xl font-bold text-blue-600">{allMappings.length}</p>
            </div>
          </Card>
          <Card>
            <div className="text-center">
              <p className="text-gray-500 text-sm">Product Fields</p>
              <p className="text-3xl font-bold text-purple-600">{productMappings.length}</p>
            </div>
          </Card>
          <Card>
            <div className="text-center">
              <p className="text-gray-500 text-sm">Customer Fields</p>
              <p className="text-3xl font-bold text-green-600">{customerMappings.length}</p>
            </div>
          </Card>
          <Card>
            <div className="text-center">
              <p className="text-gray-500 text-sm">Order Fields</p>
              <p className="text-3xl font-bold text-orange-600">{orderMappings.length}</p>
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

        <Modal title="Add Mapping" open={addModal.isOpen} onCancel={addModal.close} onOk={() => form.submit()} width={600}>
          <Form form={form} layout="vertical" onFinish={handleSubmit}>
            <Form.Item label="Field Name" name="field" rules={[{ required: true }]}>
              <Input placeholder="Enter field name" />
            </Form.Item>
            <Form.Item label="External Field" name="external" rules={[{ required: true }]}>
              <Input placeholder="Enter external field name" />
            </Form.Item>
            <Form.Item label="Internal Field" name="internal" rules={[{ required: true }]}>
              <Input placeholder="Enter internal field name" />
            </Form.Item>
          </Form>
        </Modal>
      </div>
      );
}
