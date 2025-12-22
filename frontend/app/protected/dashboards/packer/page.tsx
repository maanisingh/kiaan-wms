'use client';

import React, { useEffect, useState } from 'react';

import { KPICard } from '@/components/ui/KPICard';
import { Card, Table, Button, Tag, Row, Col, Progress, Spin, Empty, message } from 'antd';
import {
  InboxOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  TrophyOutlined,
  ReloadOutlined,
  PrinterOutlined,
} from '@ant-design/icons';
import Link from 'next/link';
import { useAuthStore } from '@/store/authStore';
import { apiClient } from '@/lib/api';

interface PackingQueueItem {
  id: string;
  orderNumber: string;
  packingNumber: string;
  priority: string;
  items: number;
  carrier: string;
  estimatedTime: string;
  status: string;
  customerName: string;
}

interface PackerStats {
  ordersPackedToday: { value: number; change: number; trend: 'up' | 'down' };
  itemsPacked: { value: number; change: number; trend: 'up' | 'down' };
  accuracy: { value: number; change: number; trend: 'up' | 'down' };
  avgPackTime: { value: number; change: number; trend: 'up' | 'down' };
}

interface DashboardData {
  stats: PackerStats;
  packingQueue: PackingQueueItem[];
  dailyGoal: number;
  goalProgress: number;
}

export default function PackerDashboardPage() {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<DashboardData | null>(null);

  const fetchDashboardData = async () => {
    if (!user?.id) return;

    setLoading(true);
    try {
      const response = await apiClient.get(`/packing/user-stats/${user.id}`);
      setData(response.data);
    } catch (error) {
      console.error('Failed to fetch packer stats:', error);
      message.error('Failed to load dashboard data');
      // Set default data on error
      setData({
        stats: {
          ordersPackedToday: { value: 0, change: 0, trend: 'up' },
          itemsPacked: { value: 0, change: 0, trend: 'up' },
          accuracy: { value: 100, change: 0, trend: 'up' },
          avgPackTime: { value: 0, change: 0, trend: 'down' },
        },
        packingQueue: [],
        dailyGoal: 45,
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
      render: (text: string, record: PackingQueueItem) => (
        <div>
          <div className="font-medium">{text}</div>
          <div className="text-xs text-gray-500">{record.packingNumber}</div>
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
      title: 'Carrier',
      dataIndex: 'carrier',
      key: 'carrier',
      render: (carrier: string) => <Tag color="geekblue">{carrier}</Tag>
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
      render: (_: any, record: PackingQueueItem) => (
        <Link href={`/packing/${record.id}`}>
          <Button type="primary" size="small">
            {record.status === 'IN_PROGRESS' ? 'Continue' : 'Start Packing'}
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
    ordersPackedToday: { value: 0, change: 0, trend: 'up' as const },
    itemsPacked: { value: 0, change: 0, trend: 'up' as const },
    accuracy: { value: 100, change: 0, trend: 'up' as const },
    avgPackTime: { value: 0, change: 0, trend: 'down' as const },
  };

  const packingQueue = data?.packingQueue || [];
  const dailyGoal = data?.dailyGoal || 45;
  const goalProgress = data?.goalProgress || 0;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Packer Dashboard</h1>
          <p className="text-gray-600 mt-1">Welcome back, {user?.name || 'Packer'}! Here are your packing tasks.</p>
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
            title="Orders Packed Today"
            value={stats.ordersPackedToday.value}
            change={stats.ordersPackedToday.change}
            trend={stats.ordersPackedToday.trend}
            icon={<InboxOutlined />}
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <KPICard
            title="Items Packed"
            value={stats.itemsPacked.value}
            change={stats.itemsPacked.change}
            trend={stats.itemsPacked.trend}
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
            title="Avg Pack Time"
            value={stats.avgPackTime.value}
            change={stats.avgPackTime.change}
            trend={stats.avgPackTime.trend}
            icon={<ClockCircleOutlined />}
            suffix="min"
          />
        </Col>
      </Row>

      {/* Packing Queue */}
      <Card
        title="Packing Queue"
        extra={
          <Tag color={packingQueue.length > 0 ? 'blue' : 'green'}>
            {packingQueue.length} orders waiting
          </Tag>
        }
      >
        {packingQueue.length > 0 ? (
          <Table
            dataSource={packingQueue}
            columns={columns}
            rowKey="id"
            pagination={false}
          />
        ) : (
          <Empty
            description="No pending packing tasks. Great job!"
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
                  <span className="font-semibold">{stats.ordersPackedToday.value} / {dailyGoal} orders</span>
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
                  <span className="font-semibold">{stats.avgPackTime.value} / 5 min avg</span>
                </div>
                <Progress
                  percent={stats.avgPackTime.value > 0 ? Math.min(100, (5 / stats.avgPackTime.value) * 100) : 100}
                  status={stats.avgPackTime.value <= 5 ? 'success' : 'exception'}
                />
              </div>
            </div>
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="Quick Actions">
            <div className="grid grid-cols-1 gap-3">
              <Link href="/packing">
                <Button block size="large" type="primary">
                  View All Packing Orders
                </Button>
              </Link>
              <Link href="/labels">
                <Button block size="large" icon={<PrinterOutlined />}>
                  Print Shipping Labels
                </Button>
              </Link>
              <Link href="/shipments">
                <Button block size="large">
                  Process Shipments
                </Button>
              </Link>
              <Link href="/scanner">
                <Button block size="large">
                  Open Scanner
                </Button>
              </Link>
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
}
