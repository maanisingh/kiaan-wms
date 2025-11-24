'use client';

import React from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, Descriptions, Tag, Button, Tabs, Timeline, Space, Table } from 'antd';
import { ArrowLeftOutlined, EditOutlined, LockOutlined, UserOutlined } from '@ant-design/icons';
import Link from 'next/link';
import { formatDate } from '@/lib/utils';

export default function UserDetailPage({ params }: { params: { id: string } }) {
  const [activeTab, setActiveTab] = React.useState('details');

  const user = {
    id: params.id,
    name: 'John Doe',
    email: 'john@company.com',
    role: 'Admin',
    warehouse: 'NYC Warehouse',
    status: 'active',
    phone: '+1 (555) 123-4567',
    department: 'Operations',
    joinDate: '2023-01-15',
    lastLogin: '2024-11-17 10:30 AM',
    permissions: ['View Inventory', 'Edit Orders', 'Manage Users', 'Configure System'],
  };

  const activityLog = [
    { time: '2024-11-17 10:30', action: 'Logged in', detail: 'From NYC Office (192.168.1.45)' },
    { time: '2024-11-17 10:35', action: 'Created Order', detail: 'Order #SO-2024-156' },
    { time: '2024-11-17 11:00', action: 'Updated Inventory', detail: 'SKU: LAP-001, Quantity: +50' },
    { time: '2024-11-17 11:30', action: 'Approved Transfer', detail: 'Transfer #TRN-045' },
  ];

  const assignedTasks = [
    { id: '1', task: 'Process Inbound Shipment', priority: 'High', status: 'In Progress', dueDate: '2024-11-18' },
    { id: '2', task: 'Cycle Count - Zone A', priority: 'Medium', status: 'Pending', dueDate: '2024-11-20' },
    { id: '3', task: 'Quality Check - Returns', priority: 'Low', status: 'Completed', dueDate: '2024-11-15' },
  ];

  const taskColumns = [
    { title: 'Task', dataIndex: 'task', key: 'task', width: 250 },
    {
      title: 'Priority',
      dataIndex: 'priority',
      key: 'priority',
      width: 100,
      render: (p: string) => (
        <Tag color={p === 'High' ? 'red' : p === 'Medium' ? 'orange' : 'blue'}>{p}</Tag>
      )
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (s: string) => (
        <Tag color={s === 'Completed' ? 'green' : s === 'In Progress' ? 'blue' : 'orange'}>{s}</Tag>
      )
    },
    { title: 'Due Date', dataIndex: 'dueDate', key: 'dueDate', width: 120, render: (d: string) => formatDate(d) },
  ];

  const tabItems = [
    {
      key: 'details',
      label: 'User Details',
      children: (
        <div className="space-y-6">
          <Card title="Profile Information">
            <Descriptions column={2} bordered>
              <Descriptions.Item label="Full Name">{user.name}</Descriptions.Item>
              <Descriptions.Item label="Email">{user.email}</Descriptions.Item>
              <Descriptions.Item label="Phone">{user.phone}</Descriptions.Item>
              <Descriptions.Item label="Role">
                <Tag color="blue">{user.role}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Warehouse">{user.warehouse}</Descriptions.Item>
              <Descriptions.Item label="Department">{user.department}</Descriptions.Item>
              <Descriptions.Item label="Status">
                <Tag color={user.status === 'active' ? 'green' : 'red'}>{user.status}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Join Date">{formatDate(user.joinDate)}</Descriptions.Item>
              <Descriptions.Item label="Last Login">{user.lastLogin}</Descriptions.Item>
            </Descriptions>
          </Card>
          <Card title="Permissions">
            <div className="space-y-2">
              {user.permissions.map((perm, index) => (
                <Tag key={index} color="green" className="text-sm py-1 px-3">
                  {perm}
                </Tag>
              ))}
            </div>
          </Card>
        </div>
      ),
    },
    {
      key: 'activity',
      label: 'Activity Log',
      children: (
        <Card title="Recent Activity">
          <Timeline>
            {activityLog.map((event, index) => (
              <Timeline.Item key={index} color="blue">
                <div className="font-semibold">{event.action}</div>
                <div className="text-sm text-gray-600">{event.time}</div>
                <div className="text-sm text-gray-500">{event.detail}</div>
              </Timeline.Item>
            ))}
          </Timeline>
        </Card>
      ),
    },
    {
      key: 'tasks',
      label: 'Assigned Tasks',
      children: (
        <Card title="Tasks">
          <Table
            dataSource={assignedTasks}
            columns={taskColumns}
            rowKey="id"
            pagination={false}
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
            <Link href="/users">
              <Button icon={<ArrowLeftOutlined />}>Back to Users</Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold">{user.name}</h1>
              <p className="text-gray-600 mt-1">{user.role} - {user.warehouse}</p>
            </div>
          </div>
          <Space>
            <Button icon={<LockOutlined />} size="large">Reset Password</Button>
            <Button icon={<EditOutlined />} type="primary" size="large">Edit User</Button>
          </Space>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <div className="text-center">
              <p className="text-gray-500 text-sm">Status</p>
              <p className="text-2xl font-bold text-green-600">{user.status}</p>
            </div>
          </Card>
          <Card>
            <div className="text-center">
              <p className="text-gray-500 text-sm">Role</p>
              <p className="text-2xl font-bold text-blue-600">{user.role}</p>
            </div>
          </Card>
          <Card>
            <div className="text-center">
              <p className="text-gray-500 text-sm">Tasks</p>
              <p className="text-2xl font-bold text-purple-600">{assignedTasks.length}</p>
            </div>
          </Card>
          <Card>
            <div className="text-center">
              <p className="text-gray-500 text-sm">Permissions</p>
              <p className="text-2xl font-bold text-orange-600">{user.permissions.length}</p>
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
