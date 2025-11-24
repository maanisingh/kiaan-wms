'use client';

import React from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, Descriptions, Tag, Button, Tabs, Table, Space, Timeline } from 'antd';
import { ArrowLeftOutlined, DownloadOutlined, PlayCircleOutlined, EditOutlined, BarChartOutlined } from '@ant-design/icons';
import Link from 'next/link';
import { formatDate } from '@/lib/utils';

export default function ReportDetailPage({ params }: { params: { id: string } }) {
  const [activeTab, setActiveTab] = React.useState('details');

  const report = {
    id: params.id,
    reportName: 'Inventory Aging Report',
    category: 'Inventory',
    description: 'Analyzes inventory age and identifies slow-moving or obsolete stock',
    schedule: 'Daily',
    format: 'Excel',
    lastRun: '2024-11-17 08:00',
    nextRun: '2024-11-18 08:00',
    status: 'active',
    createdBy: 'Admin User',
    createdDate: '2024-01-15',
    recipients: ['warehouse@company.com', 'management@company.com'],
    parameters: {
      warehouse: 'All Warehouses',
      ageThreshold: '90 days',
      includeZeroQty: 'No',
    },
  };

  const runHistory = [
    { id: '1', runDate: '2024-11-17 08:00', status: 'Success', duration: '45s', records: 1234, size: '2.4 MB' },
    { id: '2', runDate: '2024-11-16 08:00', status: 'Success', duration: '42s', records: 1228, size: '2.3 MB' },
    { id: '3', runDate: '2024-11-15 08:00', status: 'Success', duration: '48s', records: 1256, size: '2.5 MB' },
    { id: '4', runDate: '2024-11-14 08:00', status: 'Failed', duration: '5s', records: 0, size: '0 MB', error: 'Database timeout' },
    { id: '5', runDate: '2024-11-13 08:00', status: 'Success', duration: '44s', records: 1241, size: '2.4 MB' },
  ];

  const sampleData = [
    { sku: 'LAP-001', product: 'Laptop Computer', age: 125, quantity: 15, value: 3750, location: 'A-12-03' },
    { sku: 'MOU-002', product: 'Wireless Mouse', age: 98, quantity: 45, value: 900, location: 'B-05-12' },
    { sku: 'KEY-003', product: 'Mechanical Keyboard', age: 156, quantity: 8, value: 1200, location: 'A-14-08' },
  ];

  const historyColumns = [
    { title: 'Run Date', dataIndex: 'runDate', key: 'runDate', width: 180 },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => (
        <Tag color={status === 'Success' ? 'green' : 'red'}>{status}</Tag>
      )
    },
    { title: 'Duration', dataIndex: 'duration', key: 'duration', width: 100 },
    { title: 'Records', dataIndex: 'records', key: 'records', width: 100 },
    { title: 'Size', dataIndex: 'size', key: 'size', width: 100 },
    {
      title: 'Error',
      dataIndex: 'error',
      key: 'error',
      width: 200,
      render: (error: string) => error ? <span className="text-red-600">{error}</span> : '-'
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 120,
      render: (_: any, record: any) => (
        record.status === 'Success' ? (
          <Button type="link" icon={<DownloadOutlined />} size="small">Download</Button>
        ) : null
      ),
    },
  ];

  const previewColumns = [
    { title: 'SKU', dataIndex: 'sku', key: 'sku', width: 120 },
    { title: 'Product', dataIndex: 'product', key: 'product', width: 200 },
    { title: 'Age (days)', dataIndex: 'age', key: 'age', width: 100 },
    { title: 'Quantity', dataIndex: 'quantity', key: 'quantity', width: 100 },
    { title: 'Value ($)', dataIndex: 'value', key: 'value', width: 120 },
    { title: 'Location', dataIndex: 'location', key: 'location', width: 120 },
  ];

  const tabItems = [
    {
      key: 'details',
      label: 'Report Details',
      children: (
        <div className="space-y-6">
          <Card title="Configuration">
            <Descriptions column={2} bordered>
              <Descriptions.Item label="Report Name">{report.reportName}</Descriptions.Item>
              <Descriptions.Item label="Category">
                <Tag color="blue">{report.category}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Description" span={2}>{report.description}</Descriptions.Item>
              <Descriptions.Item label="Schedule">{report.schedule}</Descriptions.Item>
              <Descriptions.Item label="Format">{report.format}</Descriptions.Item>
              <Descriptions.Item label="Status">
                <Tag color={report.status === 'active' ? 'green' : 'red'}>{report.status}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Last Run">{formatDate(report.lastRun)}</Descriptions.Item>
              <Descriptions.Item label="Next Run">{formatDate(report.nextRun)}</Descriptions.Item>
              <Descriptions.Item label="Created By">{report.createdBy}</Descriptions.Item>
              <Descriptions.Item label="Created Date">{formatDate(report.createdDate)}</Descriptions.Item>
            </Descriptions>
          </Card>
          <Card title="Parameters">
            <Descriptions column={2} bordered>
              <Descriptions.Item label="Warehouse">{report.parameters.warehouse}</Descriptions.Item>
              <Descriptions.Item label="Age Threshold">{report.parameters.ageThreshold}</Descriptions.Item>
              <Descriptions.Item label="Include Zero Quantity">{report.parameters.includeZeroQty}</Descriptions.Item>
            </Descriptions>
          </Card>
          <Card title="Recipients">
            <div className="space-y-2">
              {report.recipients.map((email, index) => (
                <Tag key={index} color="blue">{email}</Tag>
              ))}
            </div>
          </Card>
        </div>
      ),
    },
    {
      key: 'preview',
      label: 'Data Preview',
      children: (
        <Card title="Sample Report Data">
          <p className="text-gray-600 mb-4">Preview of last run (showing first 3 rows)</p>
          <Table
            dataSource={sampleData}
            columns={previewColumns}
            rowKey="sku"
            pagination={false}
            scroll={{ x: 800 }}
          />
        </Card>
      ),
    },
    {
      key: 'history',
      label: 'Run History',
      children: (
        <Card title="Execution History">
          <Table
            dataSource={runHistory}
            columns={historyColumns}
            rowKey="id"
            scroll={{ x: 1000 }}
          />
        </Card>
      ),
    },
  ];

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Link href="/reports">
              <Button icon={<ArrowLeftOutlined />}>Back to Reports</Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold">{report.reportName}</h1>
              <p className="text-gray-600 mt-1">{report.category} Report</p>
            </div>
          </div>
          <Space>
            <Button icon={<DownloadOutlined />} size="large">Download Latest</Button>
            <Button icon={<PlayCircleOutlined />} size="large">Run Now</Button>
            <Button icon={<EditOutlined />} type="primary" size="large">Edit Report</Button>
          </Space>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <div className="text-center">
              <p className="text-gray-500 text-sm">Total Runs</p>
              <p className="text-3xl font-bold text-blue-600">156</p>
            </div>
          </Card>
          <Card>
            <div className="text-center">
              <p className="text-gray-500 text-sm">Success Rate</p>
              <p className="text-3xl font-bold text-green-600">98.7%</p>
            </div>
          </Card>
          <Card>
            <div className="text-center">
              <p className="text-gray-500 text-sm">Avg Duration</p>
              <p className="text-3xl font-bold text-purple-600">44s</p>
            </div>
          </Card>
          <Card>
            <div className="text-center">
              <p className="text-gray-500 text-sm">Avg Records</p>
              <p className="text-3xl font-bold text-orange-600">1,240</p>
            </div>
          </Card>
        </div>

        <Card className="shadow-sm">
          <Tabs activeKey={activeTab} onChange={setActiveTab} items={tabItems} size="large" />
        </Card>
      </div>
    </MainLayout>
  );
}
