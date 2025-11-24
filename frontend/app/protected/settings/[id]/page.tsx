'use client';

import React from 'react';

import { Card, Descriptions, Tag, Button, Tabs, Form, Input, Select, Switch, Space, Timeline } from 'antd';
import { ArrowLeftOutlined, SaveOutlined, HistoryOutlined } from '@ant-design/icons';
import Link from 'next/link';
import { formatDate } from '@/lib/utils';

const { Option } = Select;
const { TextArea } = Input;

export default function SettingDetailPage({ params }: { params: { id: string } }) {
  const [activeTab, setActiveTab] = React.useState('details');
  const [form] = Form.useForm();

  const setting = {
    id: params.id,
    category: 'Operations',
    setting: 'Auto Allocate Orders',
    value: 'Enabled',
    type: 'Boolean',
    description: 'Automatically allocate inventory to orders based on configured allocation rules',
    lastModified: '2024-11-14',
    modifiedBy: 'Admin User',
    defaultValue: 'Disabled',
    allowedValues: ['Enabled', 'Disabled'],
  };

  const changeHistory = [
    { time: '2024-11-14 10:30', user: 'Admin User', oldValue: 'Disabled', newValue: 'Enabled', reason: 'Enable auto allocation for faster processing' },
    { time: '2024-10-20 14:15', user: 'Manager User', oldValue: 'Enabled', newValue: 'Disabled', reason: 'Temporary disable for inventory audit' },
    { time: '2024-09-15 09:00', user: 'Admin User', oldValue: 'Disabled', newValue: 'Enabled', reason: 'Initial configuration' },
  ];

  const handleSave = (values: any) => {
    console.log('Saving setting:', values);
  };

  const tabItems = [
    {
      key: 'details',
      label: 'Setting Details',
      children: (
        <div className="space-y-6">
          <Card title="Information">
            <Descriptions column={2} bordered>
              <Descriptions.Item label="Category">
                <Tag color="blue">{setting.category}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Type">{setting.type}</Descriptions.Item>
              <Descriptions.Item label="Setting Name" span={2}>{setting.setting}</Descriptions.Item>
              <Descriptions.Item label="Description" span={2}>{setting.description}</Descriptions.Item>
              <Descriptions.Item label="Current Value">
                <Tag color="green">{setting.value}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Default Value">{setting.defaultValue}</Descriptions.Item>
              <Descriptions.Item label="Last Modified">{formatDate(setting.lastModified)}</Descriptions.Item>
              <Descriptions.Item label="Modified By">{setting.modifiedBy}</Descriptions.Item>
            </Descriptions>
          </Card>

          <Card title="Update Setting Value">
            <Form form={form} layout="vertical" onFinish={handleSave} initialValues={{ value: setting.value }}>
              {setting.type === 'Boolean' && (
                <Form.Item label="Value" name="value">
                  <Select>
                    <Option value="Enabled">Enabled</Option>
                    <Option value="Disabled">Disabled</Option>
                  </Select>
                </Form.Item>
              )}
              {setting.type === 'Text' && (
                <Form.Item label="Value" name="value">
                  <Input placeholder="Enter value" />
                </Form.Item>
              )}
              {setting.type === 'Number' && (
                <Form.Item label="Value" name="value">
                  <Input type="number" placeholder="Enter number" />
                </Form.Item>
              )}
              {setting.type === 'Dropdown' && (
                <Form.Item label="Value" name="value">
                  <Select>
                    {setting.allowedValues.map(val => (
                      <Option key={val} value={val}>{val}</Option>
                    ))}
                  </Select>
                </Form.Item>
              )}
              <Form.Item label="Reason for Change" name="reason">
                <TextArea rows={3} placeholder="Enter reason for changing this setting" />
              </Form.Item>
              <Form.Item>
                <Button type="primary" htmlType="submit" icon={<SaveOutlined />}>
                  Save Changes
                </Button>
              </Form.Item>
            </Form>
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
            {changeHistory.map((change, index) => (
              <Timeline.Item key={index} color="blue">
                <div className="font-semibold">Value changed from "{change.oldValue}" to "{change.newValue}"</div>
                <div className="text-sm text-gray-600">{change.time} - by {change.user}</div>
                <div className="text-sm text-gray-500">Reason: {change.reason}</div>
              </Timeline.Item>
            ))}
          </Timeline>
        </Card>
      ),
    },
  ];

  return (
    <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Link href="/settings">
              <Button icon={<ArrowLeftOutlined />}>Back to Settings</Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold">{setting.setting}</h1>
              <p className="text-gray-600 mt-1">{setting.category} Setting</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <div className="text-center">
              <p className="text-gray-500 text-sm">Current Value</p>
              <p className="text-2xl font-bold text-green-600">{setting.value}</p>
            </div>
          </Card>
          <Card>
            <div className="text-center">
              <p className="text-gray-500 text-sm">Type</p>
              <p className="text-2xl font-bold text-blue-600">{setting.type}</p>
            </div>
          </Card>
          <Card>
            <div className="text-center">
              <p className="text-gray-500 text-sm">Category</p>
              <p className="text-2xl font-bold text-purple-600">{setting.category}</p>
            </div>
          </Card>
          <Card>
            <div className="text-center">
              <p className="text-gray-500 text-sm">Changes</p>
              <p className="text-2xl font-bold text-orange-600">{changeHistory.length}</p>
            </div>
          </Card>
        </div>

        <Card className="shadow-sm">
          <Tabs activeKey={activeTab} onChange={setActiveTab} items={tabItems} size="large" />
        </Card>
      </div>
      );
}
