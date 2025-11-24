'use client';

import React, { useState, useEffect } from 'react';

import { Table, Card, Tag, Button, Select, Space, Statistic, Row, Col, message } from 'antd';
import { CheckOutlined, ClockCircleOutlined, SyncOutlined } from '@ant-design/icons';
import apiService from '@/services/api';
import { format } from 'date-fns';

export default function ReplenishmentTasksPage() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string | undefined>();

  useEffect(() => {
    fetchTasks();
  }, [statusFilter]);

  const fetchTasks = async () => {
    setLoading(true);
    try {
      const url = statusFilter
        ? `/replenishment/tasks?status=${statusFilter}`
        : '/replenishment/tasks';
      const data = await apiService.get(url);
      setTasks(data || []);
    } catch (error) {
      console.error('Error fetching tasks:', error);
      setTasks([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteTask = async (taskId: string) => {
    try {
      await apiService.patch(`/replenishment/tasks/${taskId}`, {
        status: 'COMPLETED',
        completedAt: new Date().toISOString()
      });
      message.success('Task marked as completed');
      fetchTasks();
    } catch (error) {
      message.error('Failed to update task');
    }
  };

  const columns = [
    {
      title: 'Task #',
      dataIndex: 'taskNumber',
      key: 'taskNumber',
      width: 120,
      fixed: 'left' as const,
    },
    {
      title: 'Product',
      dataIndex: ['product', 'name'],
      key: 'product',
      width: 250,
    },
    {
      title: 'Brand',
      dataIndex: ['product', 'brand', 'name'],
      key: 'brand',
      width: 120,
    },
    {
      title: 'From',
      dataIndex: 'fromLocation',
      key: 'from',
      width: 120,
      render: (loc: string) => loc || '-',
    },
    {
      title: 'To',
      dataIndex: 'toLocation',
      key: 'to',
      width: 120,
      render: (loc: string) => loc || '-',
    },
    {
      title: 'Quantity',
      key: 'quantity',
      width: 120,
      render: (_: any, record: any) => (
        <span className={record.quantityMoved >= record.quantityNeeded ? 'text-green-600' : ''}>
          {record.quantityMoved || 0} / {record.quantityNeeded}
        </span>
      ),
    },
    {
      title: 'Priority',
      dataIndex: 'priority',
      key: 'priority',
      width: 100,
      render: (priority: string) => {
        const colors: Record<string, string> = {
          LOW: 'default',
          MEDIUM: 'blue',
          HIGH: 'orange',
          URGENT: 'red',
        };
        return <Tag color={colors[priority] || 'default'}>{priority}</Tag>;
      },
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status: string) => {
        const config: Record<string, { color: string; icon: React.ReactNode }> = {
          PENDING: { color: 'orange', icon: <ClockCircleOutlined /> },
          IN_PROGRESS: { color: 'blue', icon: <SyncOutlined spin /> },
          COMPLETED: { color: 'green', icon: <CheckOutlined /> },
        };
        const { color, icon } = config[status] || { color: 'default', icon: null };
        return <Tag color={color} icon={icon}>{status.replace('_', ' ')}</Tag>;
      },
    },
    {
      title: 'Created',
      dataIndex: 'createdAt',
      key: 'created',
      width: 120,
      render: (date: string) => date ? format(new Date(date), 'dd/MM/yyyy') : '-',
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 120,
      fixed: 'right' as const,
      render: (_: any, record: any) => (
        record.status !== 'COMPLETED' && (
          <Button
            size="small"
            type="primary"
            icon={<CheckOutlined />}
            onClick={() => handleCompleteTask(record.id)}
          >
            Complete
          </Button>
        )
      ),
    },
  ];

  const pendingCount = tasks.filter((t: any) => t.status === 'PENDING').length;
  const inProgressCount = tasks.filter((t: any) => t.status === 'IN_PROGRESS').length;
  const completedCount = tasks.filter((t: any) => t.status === 'COMPLETED').length;

  return (
    <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold">Replenishment Tasks</h1>
            <p className="text-gray-500">Manage stock replenishment from bulk to pick locations</p>
          </div>
          <Button type="primary" onClick={fetchTasks} icon={<SyncOutlined />}>
            Refresh
          </Button>
        </div>

        <Row gutter={16} className="mb-6">
          <Col span={8}>
            <Card>
              <Statistic
                title="Pending Tasks"
                value={pendingCount}
                valueStyle={{ color: '#faad14' }}
                prefix={<ClockCircleOutlined />}
              />
            </Card>
          </Col>
          <Col span={8}>
            <Card>
              <Statistic
                title="In Progress"
                value={inProgressCount}
                valueStyle={{ color: '#1890ff' }}
                prefix={<SyncOutlined spin={inProgressCount > 0} />}
              />
            </Card>
          </Col>
          <Col span={8}>
            <Card>
              <Statistic
                title="Completed"
                value={completedCount}
                valueStyle={{ color: '#52c41a' }}
                prefix={<CheckOutlined />}
              />
            </Card>
          </Col>
        </Row>

        <Card>
          <div className="mb-4">
            <Space>
              <span>Filter by status:</span>
              <Select
                placeholder="All statuses"
                style={{ width: 150 }}
                value={statusFilter}
                onChange={setStatusFilter}
                allowClear
              >
                <Select.Option value="PENDING">Pending</Select.Option>
                <Select.Option value="IN_PROGRESS">In Progress</Select.Option>
                <Select.Option value="COMPLETED">Completed</Select.Option>
              </Select>
            </Space>
          </div>

          <Table
            columns={columns}
            dataSource={tasks}
            loading={loading}
            rowKey="id"
            pagination={{ pageSize: 20 }}
            scroll={{ x: 1200 }}
          />
        </Card>
      </div>
      );
}
