'use client';

import React, { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Table, Button, Input, Select, Tag, Card, Modal, Form, message, Tabs } from 'antd';
import { PlusOutlined, SearchOutlined, FilterOutlined, DownloadOutlined, EyeOutlined, FileTextOutlined, ShoppingOutlined, BarChartOutlined, DollarOutlined } from '@ant-design/icons';
import { useModal } from '@/hooks/useModal';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

const { Search } = Input;
const { Option } = Select;

export default function ReportsAndAnalyticsPage() {
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const addModal = useModal();
  const [form] = Form.useForm();
  const router = useRouter();

  const mockData = [
    { id: '1', reportName: 'Inventory Aging Report', category: 'Inventory', schedule: 'Daily', lastRun: '2024-11-13', format: 'Excel', status: 'active' },
    { id: '2', reportName: 'Stock Level Analysis', category: 'Inventory', schedule: 'Weekly', lastRun: '2024-11-14', format: 'PDF', status: 'active' },
    { id: '3', reportName: 'ABC Analysis Report', category: 'Inventory', schedule: 'Monthly', lastRun: '2024-11-01', format: 'Excel', status: 'active' },
    { id: '4', reportName: 'Order Fulfillment Summary', category: 'Orders', schedule: 'Weekly', lastRun: '2024-11-12', format: 'PDF', status: 'active' },
    { id: '5', reportName: 'Sales Order Analysis', category: 'Orders', schedule: 'Daily', lastRun: '2024-11-17', format: 'Excel', status: 'active' },
    { id: '6', reportName: 'Backorder Report', category: 'Orders', schedule: 'Daily', lastRun: '2024-11-17', format: 'PDF', status: 'active' },
    { id: '7', reportName: 'Warehouse Efficiency', category: 'Performance', schedule: 'Weekly', lastRun: '2024-11-15', format: 'PDF', status: 'active' },
    { id: '8', reportName: 'Picking Performance', category: 'Performance', schedule: 'Daily', lastRun: '2024-11-17', format: 'Excel', status: 'active' },
    { id: '9', reportName: 'Shipping Accuracy', category: 'Performance', schedule: 'Weekly', lastRun: '2024-11-14', format: 'PDF', status: 'active' },
    { id: '10', reportName: 'Revenue Analysis', category: 'Financial', schedule: 'Monthly', lastRun: '2024-11-01', format: 'Excel', status: 'active' },
    { id: '11', reportName: 'Cost per Order', category: 'Financial', schedule: 'Weekly', lastRun: '2024-11-15', format: 'PDF', status: 'active' },
    { id: '12', reportName: 'Inventory Valuation', category: 'Financial', schedule: 'Monthly', lastRun: '2024-11-01', format: 'Excel', status: 'active' },
  ];

  const columns = [
    { title: 'Report Name', dataIndex: 'reportName', key: 'reportName', width: 250, render: (text: string) => <span className="font-medium text-blue-600">{text}</span> },
    { title: 'Category', dataIndex: 'category', key: 'category', width: 130, render: (cat: string) => <Tag color="blue">{cat}</Tag> },
    { title: 'Schedule', dataIndex: 'schedule', key: 'schedule', width: 120 },
    { title: 'Last Run', dataIndex: 'lastRun', key: 'lastRun', width: 130 },
    { title: 'Format', dataIndex: 'format', key: 'format', width: 100 },
    {
      title: 'Actions',
      key: 'actions',
      width: 120,
      render: (_: any, record: any) => (
        <Link href={`/reports/${record.id}`}>
          <Button type="link" icon={<EyeOutlined />} size="small">View</Button>
        </Link>
      ),
    },
  ];

  const handleSubmit = (values: any) => {
    console.log('Form values:', values);
    message.success('Report created successfully!');
    form.resetFields();
    addModal.close();
  };

  const allReports = mockData;
  const inventoryReports = mockData.filter(r => r.category === 'Inventory');
  const orderReports = mockData.filter(r => r.category === 'Orders');
  const performanceReports = mockData.filter(r => r.category === 'Performance');
  const financialReports = mockData.filter(r => r.category === 'Financial');

  const renderFiltersAndTable = (dataSource: any[]) => (
    <>
      <div className="flex gap-4 mb-4">
        <Search placeholder="Search reports..." style={{ width: 300 }} prefix={<SearchOutlined />} />
        <Select placeholder="Schedule" style={{ width: 150 }} allowClear>
          <Option value="Daily">Daily</Option>
          <Option value="Weekly">Weekly</Option>
          <Option value="Monthly">Monthly</Option>
        </Select>
        <Select placeholder="Format" style={{ width: 150 }} allowClear>
          <Option value="PDF">PDF</Option>
          <Option value="Excel">Excel</Option>
          <Option value="CSV">CSV</Option>
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
          onClick: () => router.push(`/reports/${record.id}`),
          style: { cursor: 'pointer' }
        })}
      />
    </>
  );

  const tabItems = [
    {
      key: 'all',
      label: <span className="flex items-center gap-2"><FileTextOutlined />All Reports ({allReports.length})</span>,
      children: renderFiltersAndTable(allReports),
    },
    {
      key: 'inventory',
      label: <span className="flex items-center gap-2"><ShoppingOutlined />Inventory ({inventoryReports.length})</span>,
      children: renderFiltersAndTable(inventoryReports),
    },
    {
      key: 'orders',
      label: <span className="flex items-center gap-2"><FileTextOutlined />Orders ({orderReports.length})</span>,
      children: renderFiltersAndTable(orderReports),
    },
    {
      key: 'performance',
      label: <span className="flex items-center gap-2"><BarChartOutlined />Performance ({performanceReports.length})</span>,
      children: renderFiltersAndTable(performanceReports),
    },
    {
      key: 'financial',
      label: <span className="flex items-center gap-2"><DollarOutlined />Financial ({financialReports.length})</span>,
      children: renderFiltersAndTable(financialReports),
    },
  ];

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              Reports & Analytics
            </h1>
            <p className="text-gray-600 mt-1">Generate warehouse performance and analytics reports</p>
          </div>
          <Button type="primary" icon={<PlusOutlined />} size="large" onClick={addModal.open}>
            Add New
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <div className="text-center">
              <p className="text-gray-500 text-sm">Available Reports</p>
              <p className="text-3xl font-bold text-blue-600">45</p>
            </div>
          </Card> <Card>
            <div className="text-center">
              <p className="text-gray-500 text-sm">Scheduled</p>
              <p className="text-3xl font-bold text-green-600">12</p>
            </div>
          </Card> <Card>
            <div className="text-center">
              <p className="text-gray-500 text-sm">Generated Today</p>
              <p className="text-3xl font-bold text-purple-600">28</p>
            </div>
          </Card> <Card>
            <div className="text-center">
              <p className="text-gray-500 text-sm">Saved Templates</p>
              <p className="text-3xl font-bold text-orange-600">67</p>
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
          title="Create Report"
          open={addModal.isOpen}
          onCancel={addModal.close}
          onOk={() => form.submit()}
          width={600}
        >
          <Form form={form} layout="vertical" onFinish={handleSubmit}>
            <Form.Item label="Report Name" name="reportName" rules={[{ required: true }]}>
              <Input placeholder="Enter report name" />
            </Form.Item>
            <Form.Item label="Category" name="category" rules={[{ required: true }]}>
              <Select placeholder="Select category">
                <Option value="Inventory">Inventory</Option>
                <Option value="Orders">Orders</Option>
                <Option value="Fulfillment">Fulfillment</Option>
                <Option value="Finance">Finance</Option>
              </Select>
            </Form.Item>
            <Form.Item label="Format" name="format" rules={[{ required: true }]}>
              <Select placeholder="Select format">
                <Option value="PDF">PDF</Option>
                <Option value="Excel">Excel</Option>
                <Option value="CSV">CSV</Option>
              </Select>
            </Form.Item>
            <Form.Item label="Schedule" name="schedule">
              <Select placeholder="Select schedule">
                <Option value="Daily">Daily</Option>
                <Option value="Weekly">Weekly</Option>
                <Option value="Monthly">Monthly</Option>
                <Option value="One-time">One-time</Option>
              </Select>
            </Form.Item>
          </Form>
        </Modal>
      </div>
    </MainLayout>
  );
}
