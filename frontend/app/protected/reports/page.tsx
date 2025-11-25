'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Table, Button, Input, Select, Tag, Card, Modal, Form, Tabs, Spin, Alert, App } from 'antd';
import { PlusOutlined, SearchOutlined, FilterOutlined, DownloadOutlined, EyeOutlined, FileTextOutlined, ShoppingOutlined, BarChartOutlined, DollarOutlined, ReloadOutlined, DeleteOutlined } from '@ant-design/icons';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import apiService from '@/services/api';
import { formatDate } from '@/lib/utils';

const { Search } = Input;
const { Option } = Select;

interface Report {
  id: string;
  reportName: string;
  name?: string;
  category: string;
  schedule?: string;
  lastRun?: string;
  format?: string;
  status: string;
  createdAt?: string;
  updatedAt?: string;
}

export default function ReportsAndAnalyticsPage() {
  const { modal, message } = App.useApp();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [reports, setReports] = useState<Report[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('all');
  const [searchText, setSearchText] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form] = Form.useForm();

  // Fetch reports from API
  const fetchReports = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await apiService.get('/reports');
      setReports(Array.isArray(data) ? data : []);
    } catch (err: any) {
      console.error('Failed to fetch reports:', err);
      setError(err.message || 'Failed to load reports');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  // Filter reports based on search and tab
  const getFilteredReports = () => {
    let filtered = reports;

    // Filter by tab/category
    if (activeTab === 'inventory') {
      filtered = filtered.filter(r => r.category?.toLowerCase() === 'inventory');
    } else if (activeTab === 'orders') {
      filtered = filtered.filter(r => r.category?.toLowerCase() === 'orders');
    } else if (activeTab === 'performance') {
      filtered = filtered.filter(r => r.category?.toLowerCase() === 'performance');
    } else if (activeTab === 'financial') {
      filtered = filtered.filter(r => r.category?.toLowerCase() === 'financial');
    }

    // Filter by search
    if (searchText) {
      const search = searchText.toLowerCase();
      filtered = filtered.filter(r =>
        r.reportName?.toLowerCase().includes(search) ||
        r.name?.toLowerCase().includes(search) ||
        r.category?.toLowerCase().includes(search)
      );
    }

    return filtered;
  };

  const handleSubmit = async (values: any) => {
    try {
      setSaving(true);
      await apiService.post('/reports', {
        reportName: values.reportName,
        name: values.reportName,
        category: values.category,
        format: values.format,
        schedule: values.schedule,
        status: 'active'
      });
      message.success('Report created successfully!');
      form.resetFields();
      setModalOpen(false);
      fetchReports();
    } catch (err: any) {
      console.error('Failed to create report:', err);
      message.error(err.message || 'Failed to create report');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (record: Report) => {
    modal.confirm({
      title: 'Delete Report',
      content: `Are you sure you want to delete "${record.reportName || record.name}"? This action cannot be undone.`,
      okText: 'Delete',
      okType: 'danger',
      onOk: async () => {
        try {
          await apiService.delete(`/reports/${record.id}`);
          message.success('Report deleted successfully!');
          fetchReports();
        } catch (err: any) {
          message.error(err.message || 'Failed to delete report');
        }
      }
    });
  };

  const columns = [
    {
      title: 'Report Name',
      key: 'reportName',
      width: 250,
      render: (_: any, record: Report) => (
        <Link href={`/protected/reports/${record.id}`}>
          <span className="font-medium text-blue-600 cursor-pointer hover:underline">
            {record.reportName || record.name}
          </span>
        </Link>
      )
    },
    {
      title: 'Category',
      dataIndex: 'category',
      key: 'category',
      width: 130,
      render: (cat: string) => <Tag color="blue">{cat || '-'}</Tag>
    },
    {
      title: 'Schedule',
      dataIndex: 'schedule',
      key: 'schedule',
      width: 120,
      render: (schedule: string) => schedule || '-'
    },
    {
      title: 'Last Run',
      key: 'lastRun',
      width: 130,
      render: (_: any, record: Report) => formatDate(record.lastRun || record.updatedAt || '') || '-'
    },
    {
      title: 'Format',
      dataIndex: 'format',
      key: 'format',
      width: 100,
      render: (format: string) => format || 'PDF'
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => (
        <Tag color={status === 'active' ? 'green' : 'red'}>
          {status || 'active'}
        </Tag>
      )
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 150,
      render: (_: any, record: Report) => (
        <div className="flex gap-2">
          <Link href={`/protected/reports/${record.id}`}>
            <Button type="link" icon={<EyeOutlined />} size="small">View</Button>
          </Link>
          <Button type="link" danger icon={<DeleteOutlined />} size="small" onClick={() => handleDelete(record)}>
            Delete
          </Button>
        </div>
      ),
    },
  ];

  const allReports = getFilteredReports();
  const inventoryReports = reports.filter(r => r.category?.toLowerCase() === 'inventory');
  const orderReports = reports.filter(r => r.category?.toLowerCase() === 'orders');
  const performanceReports = reports.filter(r => r.category?.toLowerCase() === 'performance');
  const financialReports = reports.filter(r => r.category?.toLowerCase() === 'financial');

  const renderFiltersAndTable = () => (
    <>
      <div className="flex gap-4 mb-4">
        <Search
          placeholder="Search reports..."
          style={{ width: 300 }}
          prefix={<SearchOutlined />}
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          allowClear
        />
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
        <Button icon={<ReloadOutlined />} onClick={fetchReports}>Refresh</Button>
      </div>
      {error && (
        <Alert
          message="Error"
          description={error}
          type="error"
          showIcon
          className="mb-4"
          closable
          onClose={() => setError(null)}
        />
      )}
      <Table
        columns={columns}
        dataSource={getFilteredReports()}
        rowKey="id"
        loading={loading}
        scroll={{ x: 1000 }}
        onRow={(record) => ({
          onClick: () => router.push(`/protected/reports/${record.id}`),
          style: { cursor: 'pointer' }
        })}
        pagination={{
          showSizeChanger: true,
          showTotal: (total) => `Total ${total} reports`,
        }}
      />
    </>
  );

  const tabItems = [
    {
      key: 'all',
      label: <span className="flex items-center gap-2"><FileTextOutlined />All Reports ({reports.length})</span>,
      children: renderFiltersAndTable(),
    },
    {
      key: 'inventory',
      label: <span className="flex items-center gap-2"><ShoppingOutlined />Inventory ({inventoryReports.length})</span>,
      children: renderFiltersAndTable(),
    },
    {
      key: 'orders',
      label: <span className="flex items-center gap-2"><FileTextOutlined />Orders ({orderReports.length})</span>,
      children: renderFiltersAndTable(),
    },
    {
      key: 'performance',
      label: <span className="flex items-center gap-2"><BarChartOutlined />Performance ({performanceReports.length})</span>,
      children: renderFiltersAndTable(),
    },
    {
      key: 'financial',
      label: <span className="flex items-center gap-2"><DollarOutlined />Financial ({financialReports.length})</span>,
      children: renderFiltersAndTable(),
    },
  ];

  if (loading && reports.length === 0) {
    return (
      <div className="flex justify-center items-center h-96">
        <Spin size="large" tip="Loading reports..." />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
            Reports & Analytics
          </h1>
          <p className="text-gray-600 mt-1">Generate warehouse performance and analytics reports</p>
        </div>
        <Button type="primary" icon={<PlusOutlined />} size="large" onClick={() => setModalOpen(true)}>
          Create Report
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <div className="text-center">
            <p className="text-gray-500 text-sm">Total Reports</p>
            <p className="text-3xl font-bold text-blue-600">{reports.length}</p>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <p className="text-gray-500 text-sm">Inventory Reports</p>
            <p className="text-3xl font-bold text-green-600">{inventoryReports.length}</p>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <p className="text-gray-500 text-sm">Order Reports</p>
            <p className="text-3xl font-bold text-purple-600">{orderReports.length}</p>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <p className="text-gray-500 text-sm">Financial Reports</p>
            <p className="text-3xl font-bold text-orange-600">{financialReports.length}</p>
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
        open={modalOpen}
        onCancel={() => {
          setModalOpen(false);
          form.resetFields();
        }}
        onOk={() => form.submit()}
        confirmLoading={saving}
        width={600}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item label="Report Name" name="reportName" rules={[{ required: true, message: 'Please enter report name' }]}>
            <Input placeholder="Enter report name" />
          </Form.Item>
          <Form.Item label="Category" name="category" rules={[{ required: true, message: 'Please select category' }]}>
            <Select placeholder="Select category">
              <Option value="Inventory">Inventory</Option>
              <Option value="Orders">Orders</Option>
              <Option value="Performance">Performance</Option>
              <Option value="Financial">Financial</Option>
            </Select>
          </Form.Item>
          <Form.Item label="Format" name="format" rules={[{ required: true, message: 'Please select format' }]}>
            <Select placeholder="Select format">
              <Option value="PDF">PDF</Option>
              <Option value="Excel">Excel</Option>
              <Option value="CSV">CSV</Option>
            </Select>
          </Form.Item>
          <Form.Item label="Schedule" name="schedule">
            <Select placeholder="Select schedule (optional)">
              <Option value="Daily">Daily</Option>
              <Option value="Weekly">Weekly</Option>
              <Option value="Monthly">Monthly</Option>
              <Option value="One-time">One-time</Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
