'use client';

import React, { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Table, Button, Input, Select, Tag, Card, Modal, Form, message, Tabs } from 'antd';
import { PlusOutlined, SearchOutlined, FilterOutlined, EyeOutlined, PrinterOutlined, BarcodeOutlined, TagsOutlined } from '@ant-design/icons';
import { useModal } from '@/hooks/useModal';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

const { Search } = Input;
const { Option } = Select;

export default function LabelPrintingAndBarcodesPage() {
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const addModal = useModal();
  const [form] = Form.useForm();
  const router = useRouter();

  const mockData = [
    { id: '1', templateName: 'Shipping Label 4x6', type: 'Shipping', format: 'PDF', uses: 1245, lastUsed: '2024-11-13', status: 'active' },
    { id: '2', templateName: 'Product Barcode', type: 'Product', format: 'ZPL', uses: 3456, lastUsed: '2024-11-13', status: 'active' },
    { id: '3', templateName: 'Location Label', type: 'Location', format: 'PNG', uses: 234, lastUsed: '2024-11-12', status: 'active' },
    { id: '4', templateName: 'Pallet Label', type: 'Pallet', format: 'ZPL', uses: 567, lastUsed: '2024-11-14', status: 'active' },
    { id: '5', templateName: 'Return Label', type: 'Shipping', format: 'PDF', uses: 89, lastUsed: '2024-11-10', status: 'inactive' },
  ];

  const columns = [
    { title: 'Template Name', dataIndex: 'templateName', key: 'templateName', width: 220, render: (text: string) => <span className="font-medium text-blue-600">{text}</span> },
    { title: 'Type', dataIndex: 'type', key: 'type', width: 120, render: (type: string) => <Tag color="blue">{type}</Tag> },
    { title: 'Format', dataIndex: 'format', key: 'format', width: 100 },
    { title: 'Uses', dataIndex: 'uses', key: 'uses', width: 100 },
    { title: 'Last Used', dataIndex: 'lastUsed', key: 'lastUsed', width: 120 },
    { title: 'Status', dataIndex: 'status', key: 'status', width: 100, render: (status: string) => <Tag color={status === 'active' ? 'green' : 'red'}>{status}</Tag> },
    {
      title: 'Actions',
      key: 'actions',
      width: 120,
      render: (_: any, record: any) => (
        <Link href={`/labels/${record.id}`}>
          <Button type="link" icon={<EyeOutlined />} size="small">View</Button>
        </Link>
      )
    },
  ];

  const handleSubmit = (values: any) => {
    console.log('Form values:', values);
    message.success('Label template created successfully!');
    form.resetFields();
    addModal.close();
  };

  const allLabels = mockData;
  const shippingLabels = mockData.filter(l => l.type === 'Shipping');
  const productLabels = mockData.filter(l => l.type === 'Product');
  const locationLabels = mockData.filter(l => l.type === 'Location' || l.type === 'Pallet');

  const renderFiltersAndTable = (dataSource: any[]) => (
    <>
      <div className="flex gap-4 mb-4">
        <Search placeholder="Search templates..." style={{ width: 300 }} prefix={<SearchOutlined />} />
        <Select placeholder="Format" style={{ width: 150 }} allowClear>
          <Option value="PDF">PDF</Option>
          <Option value="ZPL">ZPL</Option>
          <Option value="PNG">PNG</Option>
        </Select>
        <Button icon={<FilterOutlined />}>More Filters</Button>
      </div>
      <Table
        columns={columns}
        dataSource={dataSource}
        rowKey="id"
        loading={loading}
        scroll={{ x: 1000 }}
        onRow={(record) => ({
          onClick: () => router.push(`/labels/${record.id}`),
          style: { cursor: 'pointer' }
        })}
      />
    </>
  );

  const tabItems = [
    {
      key: 'all',
      label: <span className="flex items-center gap-2"><TagsOutlined />All Templates ({allLabels.length})</span>,
      children: renderFiltersAndTable(allLabels),
    },
    {
      key: 'shipping',
      label: <span className="flex items-center gap-2"><PrinterOutlined />Shipping ({shippingLabels.length})</span>,
      children: renderFiltersAndTable(shippingLabels),
    },
    {
      key: 'product',
      label: <span className="flex items-center gap-2"><BarcodeOutlined />Product ({productLabels.length})</span>,
      children: renderFiltersAndTable(productLabels),
    },
    {
      key: 'location',
      label: <span className="flex items-center gap-2"><TagsOutlined />Location ({locationLabels.length})</span>,
      children: renderFiltersAndTable(locationLabels),
    },
  ];

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-blue-600 bg-clip-text text-transparent">
              Label Printing & Barcodes
            </h1>
            <p className="text-gray-600 mt-1">Generate and print shipping and product labels</p>
          </div>
          <Button type="primary" icon={<PlusOutlined />} size="large" onClick={addModal.open}>
            Create Template
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <div className="text-center">
              <p className="text-gray-500 text-sm">Labels Today</p>
              <p className="text-3xl font-bold text-blue-600">456</p>
            </div>
          </Card>
          <Card>
            <div className="text-center">
              <p className="text-gray-500 text-sm">Print Queue</p>
              <p className="text-3xl font-bold text-orange-600">12</p>
            </div>
          </Card>
          <Card>
            <div className="text-center">
              <p className="text-gray-500 text-sm">Templates</p>
              <p className="text-3xl font-bold text-green-600">24</p>
            </div>
          </Card>
          <Card>
            <div className="text-center">
              <p className="text-gray-500 text-sm">Printers Active</p>
              <p className="text-3xl font-bold text-purple-600">8</p>
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
          title="Create Label Template"
          open={addModal.isOpen}
          onCancel={addModal.close}
          onOk={() => form.submit()}
          width={600}
        >
          <Form form={form} layout="vertical" onFinish={handleSubmit}>
            <Form.Item label="Template Name" name="templateName" rules={[{ required: true }]}>
              <Input placeholder="Enter template name" />
            </Form.Item>
            <Form.Item label="Type" name="type" rules={[{ required: true }]}>
              <Select placeholder="Select type">
                <Option value="Shipping">Shipping</Option>
                <Option value="Product">Product</Option>
                <Option value="Location">Location</Option>
                <Option value="Pallet">Pallet</Option>
              </Select>
            </Form.Item>
            <Form.Item label="Format" name="format" rules={[{ required: true }]}>
              <Select placeholder="Select format">
                <Option value="PDF">PDF</Option>
                <Option value="ZPL">ZPL</Option>
                <Option value="PNG">PNG</Option>
              </Select>
            </Form.Item>
          </Form>
        </Modal>
      </div>
    </MainLayout>
  );
}
