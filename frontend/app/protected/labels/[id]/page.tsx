'use client';

import React from 'react';

import { Card, Descriptions, Tag, Button, Tabs } from 'antd';
import { ArrowLeftOutlined, PrinterOutlined, EditOutlined } from '@ant-design/icons';
import Link from 'next/link';

export default function LabelDetailPage({ params }: { params: { id: string } }) {
  const [activeTab, setActiveTab] = React.useState('details');

  const template = {
    id: params.id,
    name: 'Shipping Label 4x6',
    type: 'Shipping',
    format: 'PDF',
    width: '4 inches',
    height: '6 inches',
    uses: 1245,
    lastUsed: '2024-11-13',
    status: 'active',
    printer: 'Zebra ZP450',
  };

  const tabItems = [
    {
      key: 'details',
      label: 'Template Details',
      children: (
        <div className="space-y-6">
          <Card title="Configuration">
            <Descriptions column={2} bordered>
              <Descriptions.Item label="Template Name">{template.name}</Descriptions.Item>
              <Descriptions.Item label="Type"><Tag color="blue">{template.type}</Tag></Descriptions.Item>
              <Descriptions.Item label="Format">{template.format}</Descriptions.Item>
              <Descriptions.Item label="Dimensions">{template.width} x {template.height}</Descriptions.Item>
              <Descriptions.Item label="Status">
                <Tag color={template.status === 'active' ? 'green' : 'red'}>{template.status}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Default Printer">{template.printer}</Descriptions.Item>
              <Descriptions.Item label="Total Uses">{template.uses.toLocaleString()}</Descriptions.Item>
              <Descriptions.Item label="Last Used">{template.lastUsed}</Descriptions.Item>
            </Descriptions>
          </Card>
          <Card title="Preview">
            <div className="bg-gray-100 p-8 rounded-lg text-center">
              <div className="bg-white border-2 border-dashed border-gray-400 p-12 inline-block">
                <p className="text-gray-500 text-lg">Label Preview</p>
                <p className="text-sm text-gray-400 mt-2">{template.width} x {template.height}</p>
              </div>
            </div>
          </Card>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Link href="/labels">
              <Button icon={<ArrowLeftOutlined />}>Back to Labels</Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold">{template.name}</h1>
              <p className="text-gray-600 mt-1">{template.type} Label Template</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button icon={<PrinterOutlined />} size="large">Print Test</Button>
            <Button icon={<EditOutlined />} type="primary" size="large">Edit Template</Button>
          </div>
        </div>

        <Card className="shadow-sm">
          <Tabs activeKey={activeTab} onChange={setActiveTab} items={tabItems} size="large" />
        </Card>
      </div>
      );
}
