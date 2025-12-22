'use client';

import React, { useEffect, useState } from 'react';

import { KPICard } from '@/components/ui/KPICard';
import { Card, Table, Button, Tag, Row, Col, Progress, Spin, Empty, message } from 'antd';
import {
  ShoppingCartOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  TrophyOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import Link from 'next/link';
import { useAuthStore } from '@/store/authStore';
import { apiClient } from '@/lib/api';

interface PickingQueueItem {
  id: string;
  orderNumber: string;
  pickListNumber: string;
  priority: string;
  items: number;
  zone: string;
  estimatedTime: string;
  status: string;
  customerName: string;
}

interface PickerStats {
  ordersPickedToday: { value: number; change: number; trend: 'up' | 'down' };
  itemsPicked: { value: number; change: number; trend: 'up' | 'down' };
  accuracy: { value: number; change: number; trend: 'up' | 'down' };
  avgPickTime: { value: number; change: number; trend: 'up' | 'down' };
}

interface DashboardData {
  stats: PickerStats;
  pickingQueue: PickingQueueItem[];
  dailyGoal: number;
  goalProgress: number;
}

export default function PickerDashboardPage() {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<DashboardData | null>(null);

  const fetchDashboardData = async () => {
    if (!user?.id) return;

    setLoading(true);
    try {
      const response = await apiClient.get(`/picking/user-stats/${user.id}`);
      setData(response.data);
    } catch (error) {
      console.error('Failed to fetch picker stats:', error);
      message.error('Failed to load dashboard data');
      // Set default data on error
      setData({
        stats: {
          ordersPickedToday: { value: 0, change: 0, trend: 'up' },
          itemsPicked: { value: 0, change: 0, trend: 'up' },
          accuracy: { value: 100, change: 0, trend: 'up' },
          avgPickTime: { value: 0, change: 0, trend: 'down' },
        },
        pickingQueue: [],
        dailyGoal: 50,
        goalProgress: 0,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    // Refresh every 30 seconds
    const interval = setInterval(fetchDashboardData, 30000);
    return () => clearInterval(interval);
  }, [user?.id]);

  const columns = [
    {
      title: 'Order #',
      dataIndex: 'orderNumber',
      key: 'orderNumber',
      render: (text: string, record: PickingQueueItem) => (
        <div>
          <div className="font-medium">{text}</div>
          <div className="text-xs text-gray-500">{record.pickListNumber}</div>
        </div>
      )
    },
    {
      title: 'Priority',
      dataIndex: 'priority',
      key: 'priority',
      render: (priority: string) => (
        <Tag color={priority === 'urgent' ? 'red' : priority === 'high' ? 'orange' : 'blue'}>
          {priority.toUpperCase()}
        </Tag>
      ),
    },
    { title: 'Items', dataIndex: 'items', key: 'items' },
    {
      title: 'Zone',
      dataIndex: 'zone',
      key: 'zone',
      render: (zone: string) => <Tag color="cyan">{zone}</Tag>
    },
    { title: 'Est. Time', dataIndex: 'estimatedTime', key: 'estimatedTime' },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={status === 'IN_PROGRESS' ? 'processing' : 'default'}>
          {status === 'IN_PROGRESS' ? 'In Progress' : 'Pending'}
        </Tag>
      ),
    },
    {
      title: 'Action',
      key: 'action',
      render: (_: any, record: PickingQueueItem) => (
        <Link href={`/picking/${record.id}`}>
          <Button type="primary" size="small">
            {record.status === 'IN_PROGRESS' ? 'Continue' : 'Start Picking'}
          </Button>
        </Link>
      ),
    },
  ];

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Spin size="large" tip="Loading dashboard..." />
      </div>
    );
  }

  const stats = data?.stats || {
    ordersPickedToday: { value: 0, change: 0, trend: 'up' as const },
    itemsPicked: { value: 0, change: 0, trend: 'up' as const },
    accuracy: { value: 100, change: 0, trend: 'up' as const },
    avgPickTime: { value: 0, change: 0, trend: 'down' as const },
  };

  const pickingQueue = data?.pickingQueue || [];
  const dailyGoal = data?.dailyGoal || 50;
  const goalProgress = data?.goalProgress || 0;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Picker Dashboard</h1>
          <p className="text-gray-600 mt-1">Welcome back, {user?.name || 'Picker'}! Here are your assignments.</p>
        </div>
        <Button
          icon={<ReloadOutlined />}
          onClick={fetchDashboardData}
          loading={loading}
        >
          Refresh
        </Button>
      </div>

      {/* KPI Cards */}
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <KPICard
            title="Orders Picked Today"
            value={stats.ordersPickedToday.value}
            change={stats.ordersPickedToday.change}
            trend={stats.ordersPickedToday.trend}
            icon={<ShoppingCartOutlined />}
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <KPICard
            title="Items Picked"
            value={stats.itemsPicked.value}
            change={stats.itemsPicked.change}
            trend={stats.itemsPicked.trend}
            icon={<CheckCircleOutlined />}
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <KPICard
            title="Accuracy Rate"
            value={stats.accuracy.value}
            change={stats.accuracy.change}
            trend={stats.accuracy.trend}
            icon={<TrophyOutlined />}
            suffix="%"
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <KPICard
            title="Avg Pick Time"
            value={stats.avgPickTime.value}
            change={stats.avgPickTime.change}
            trend={stats.avgPickTime.trend}
            icon={<ClockCircleOutlined />}
            suffix="min"
          />
        </Col>
      </Row>

      {/* Picking Queue */}
      <Card
        title="Picking Queue"
        extra={
          <Tag color={pickingQueue.length > 0 ? 'blue' : 'green'}>
            {pickingQueue.length} orders waiting
          </Tag>
        }
      >
        {pickingQueue.length > 0 ? (
          <Table
            dataSource={pickingQueue}
            columns={columns}
            rowKey="id"
            pagination={false}
          />
        ) : (
          <Empty
            description="No pending pick lists. Great job!"
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          />
        )}
      </Card>

      {/* Performance Summary */}
      <Row gutter={16}>
        <Col xs={24} lg={12}>
          <Card title="Today's Performance">
            <div className="space-y-4">
              <div>
                <div className="flex justify-between mb-2">
                  <span>Daily Goal Progress</span>
                  <span className="font-semibold">{stats.ordersPickedToday.value} / {dailyGoal} orders</span>
                </div>
                <Progress
                  percent={goalProgress}
                  status={goalProgress >= 100 ? 'success' : 'active'}
                />
              </div>
              <div>
                <div className="flex justify-between mb-2">
                  <span>Accuracy Target</span>
                  <span className="font-semibold">{stats.accuracy.value}% / 98%</span>
                </div>
                <Progress
                  percent={Math.min(100, (stats.accuracy.value / 98) * 100)}
                  status={stats.accuracy.value >= 98 ? 'success' : 'normal'}
                />
              </div>
              <div>
                <div className="flex justify-between mb-2">
                  <span>Speed Target</span>
                  <span className="font-semibold">{stats.avgPickTime.value} / 4 min avg</span>
                </div>
                <Progress
                  percent={stats.avgPickTime.value > 0 ? Math.min(100, (4 / stats.avgPickTime.value) * 100) : 100}
                  status={stats.avgPickTime.value <= 4 ? 'success' : 'exception'}
                />
              </div>
            </div>
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="Quick Actions">
            <div className="grid grid-cols-1 gap-3">
              <Link href="/picking">
                <Button block size="large" type="primary">
                  View All Pick Lists
                </Button>
              </Link>
              <Link href="/scanner">
                <Button block size="large">
                  Open Scanner
                </Button>
              </Link>
              <Button block size="large" disabled>Report Issue</Button>
              <Button block size="large" disabled>Request Stock Check</Button>
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
}
