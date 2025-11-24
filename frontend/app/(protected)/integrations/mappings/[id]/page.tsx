'use client';

import React from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, Descriptions, Tag, Button, Tabs, Table, Timeline } from 'antd';
import { ArrowLeftOutlined, SaveOutlined, ExperimentOutlined, HistoryOutlined } from '@ant-design/icons';
import Link from 'next/link';
import { formatDate } from '@/lib/utils';

export default function MappingDetailPage({ params }: { params: { id: string } }) {
  const [activeTab, setActiveTab] = React.useState('details');

  const mapping = {
    id: params.id,
    field: params.id === '1' ? 'Product SKU' : params.id === '2' ? 'Customer Name' : 'Product Name',
    external: params.id === '1' ? 'item_code' : params.id === '2' ? 'buyer_name' : 'title',
    internal: params.id === '1' ? 'sku' : params.id === '2' ? 'customer_name' : 'product_name',
    channel: params.id === '1' ? 'Shopify' : params.id === '2' ? 'Amazon' : 'Shopify',
    type: params.id === '1' ? 'Product' : params.id === '2' ? 'Customer' : 'Product',
    status: 'active',
    dataType: 'String',
    required: true,
    defaultValue: '',
    transformation: 'None',
    createdDate: '2024-01-15',
    lastModified: '2024-11-15',
  };

  const transformationHistory = [
    { time: '2024-11-15 14:30', user: 'Admin', action: 'Updated transformation rule', status: 'Success' },
    { time: '2024-10-20 10:15', user: 'Admin', action: 'Changed data type', status: 'Success' },
    { time: '2024-09-05 16:45', user: 'System', action: 'Auto-validated mapping', status: 'Success' },
    { time: '2024-08-12 09:20', user: 'Admin', action: 'Created mapping', status: 'Success' },
  ];

  const testResults = [
    { id: '1', input: 'PROD-001', output: 'PROD-001', status: 'passed', date: '2024-11-17' },
    { id: '2', input: 'item_123', output: 'item_123', status: 'passed', date: '2024-11-17' },
    { id: '3', input: 'SKU-ABC', output: 'SKU-ABC', status: 'passed', date: '2024-11-16' },
  ];

  const testColumns = [
    { title: 'Input', dataIndex: 'input', key: 'input', width: 150, render: (text: string) => <code className="bg-gray-100 px-2 py-1 rounded">{text}</code> },
    { title: 'Output', dataIndex: 'output', key: 'output', width: 150, render: (text: string) => <code className="bg-blue-50 px-2 py-1 rounded">{text}</code> },
    { title: 'Status', dataIndex: 'status', key: 'status', width: 100, render: (status: string) => <Tag color={status === 'passed' ? 'green' : 'red'}>{status}</Tag> },
    { title: 'Date', dataIndex: 'date', key: 'date', width: 120, render: (date: string) => formatDate(date) },
  ];

  const tabItems = [
    {
      key: 'details',
      label: 'Mapping Details',
      children: (
        <div className="space-y-6">
          <Card title="Field Mapping Configuration">
            <Descriptions column={2} bordered>
              <Descriptions.Item label="Field Name">{mapping.field}</Descriptions.Item>
              <Descriptions.Item label="Type">
                <Tag color="purple">{mapping.type}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="External Field">
                <code className="bg-gray-100 px-2 py-1 rounded">{mapping.external}</code>
              </Descriptions.Item>
              <Descriptions.Item label="Internal Field">
                <code className="bg-blue-50 px-2 py-1 rounded">{mapping.internal}</code>
              </Descriptions.Item>
              <Descriptions.Item label="Channel">{mapping.channel}</Descriptions.Item>
              <Descriptions.Item label="Status">
                <Tag color="green">Active</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Data Type">{mapping.dataType}</Descriptions.Item>
              <Descriptions.Item label="Required">
                <Tag color={mapping.required ? 'red' : 'default'}>{mapping.required ? 'Yes' : 'No'}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Transformation">{mapping.transformation}</Descriptions.Item>
              <Descriptions.Item label="Default Value">{mapping.defaultValue || 'None'}</Descriptions.Item>
              <Descriptions.Item label="Created">{formatDate(mapping.createdDate)}</Descriptions.Item>
              <Descriptions.Item label="Last Modified">{formatDate(mapping.lastModified)}</Descriptions.Item>
            </Descriptions>
          </Card>

          <Card title="Test Results">
            <Table
              dataSource={testResults}
              columns={testColumns}
              rowKey="id"
              pagination={false}
            />
          </Card>
        </div>
      ),
    },
    {
      key: 'history',
      label: 'Change History',
      children: (
        <Card title="Modification History">
          <Timeline>
            {transformationHistory.map((event, index) => (
              <Timeline.Item
                key={index}
                color="blue"
              >
                <div className="font-semibold">{event.action}</div>
                <div className="text-sm text-gray-600">{event.time} - {event.user}</div>
                <div className="text-sm">
                  <Tag color="green">{event.status}</Tag>
                </div>
              </Timeline.Item>
            ))}
          </Timeline>
        </Card>
      ),
    },
  ];

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Link href="/integrations/mappings">
              <Button icon={<ArrowLeftOutlined />}>Back to Mappings</Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold">{mapping.field}</h1>
              <p className="text-gray-600 mt-1">{mapping.channel} - {mapping.type} Mapping</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button icon={<ExperimentOutlined />} size="large">Test Mapping</Button>
            <Button icon={<SaveOutlined />} type="primary" size="large">Save Changes</Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <div className="text-center">
              <p className="text-gray-500 text-sm">External Field</p>
              <p className="text-lg font-bold text-blue-600">
                <code className="bg-gray-100 px-2 py-1 rounded">{mapping.external}</code>
              </p>
            </div>
          </Card>
          <Card>
            <div className="text-center">
              <p className="text-gray-500 text-sm">Internal Field</p>
              <p className="text-lg font-bold text-green-600">
                <code className="bg-blue-50 px-2 py-1 rounded">{mapping.internal}</code>
              </p>
            </div>
          </Card>
          <Card>
            <div className="text-center">
              <p className="text-gray-500 text-sm">Test Results</p>
              <p className="text-2xl font-bold text-purple-600">{testResults.length} Passed</p>
            </div>
          </Card>
          <Card>
            <div className="text-center">
              <p className="text-gray-500 text-sm">Status</p>
              <p className="text-2xl font-bold text-orange-600">Active</p>
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
