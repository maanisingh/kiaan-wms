'use client';

import React, { useState, useEffect } from 'react';
import { Table, Button, Input, Select, Tag, Card, Modal, Form, message, Tabs, Space, Tooltip } from 'antd';
import {
  PlusOutlined, SearchOutlined, EyeOutlined, InboxOutlined, SyncOutlined,
  CheckCircleOutlined, RocketOutlined, ReloadOutlined, UserOutlined,
  ShoppingCartOutlined, EnvironmentOutlined
} from '@ant-design/icons';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import apiService from '@/services/api';
import { formatDate } from '@/lib/utils';

const { Search } = Input;
const { Option } = Select;

interface PackingTask {
  id: string;
  packingSlip: string;
  pickListNumber: string;
  orderNumber: string;
  orderId?: string;
  customer: string;
  customerId?: string;
  packer: string;
  packerId?: string;
  status: string;
  priority: string;
  items: number;
  itemCount: number;
  weight: string;
  completedAt?: string;
  createdAt: string;
  shippingAddress?: string;
  shippingMethod?: string;
  trackingNumber?: string;
}

export default function PackingPage() {
  const [loading, setLoading] = useState(false);
  const [packingTasks, setPackingTasks] = useState<PackingTask[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('all');
  const [searchText, setSearchText] = useState('');
  const router = useRouter();

  const fetchPackingTasks = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await apiService.get('/packing');
      console.log('Packing API response:', data);
      const tasks = Array.isArray(data) ? data : [];
      console.log('Packing tasks:', tasks.map(t => ({ id: t.id, packingSlip: t.packingSlip })));
      setPackingTasks(tasks);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch packing tasks');
      message.error(err.message || 'Failed to fetch packing tasks');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPackingTasks();
  }, []);

  // Filter by search text
  const filteredTasks = packingTasks.filter(task =>
    !searchText ||
    task.packingSlip.toLowerCase().includes(searchText.toLowerCase()) ||
    task.orderNumber.toLowerCase().includes(searchText.toLowerCase()) ||
    task.customer.toLowerCase().includes(searchText.toLowerCase())
  );

  const allPacks = filteredTasks;
  const readyToPack = filteredTasks.filter(p => p.status === 'ready_to_pack');
  const packing = filteredTasks.filter(p => p.status === 'packing');
  const packed = filteredTasks.filter(p => p.status === 'packed' || p.status === 'ready_to_ship');

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ready_to_pack': return 'orange';
      case 'packing': return 'blue';
      case 'packed': return 'cyan';
      case 'ready_to_ship': return 'green';
      case 'shipped': return 'default';
      default: return 'default';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority?.toLowerCase()) {
      case 'high': return 'red';
      case 'medium': return 'orange';
      case 'low': return 'blue';
      default: return 'default';
    }
  };

  const columns = [
    {
      title: 'Packing Slip',
      dataIndex: 'packingSlip',
      key: 'packingSlip',
      width: 150,
      render: (text: string, record: PackingTask) => (
        <Link href={`/protected/packing/${record.id}`}>
          <span className="font-semibold text-blue-600 hover:underline cursor-pointer">{text}</span>
        </Link>
      )
    },
    {
      title: 'Order',
      dataIndex: 'orderNumber',
      key: 'orderNumber',
      width: 140,
      render: (text: string, record: PackingTask) => (
        <Tooltip title="View Order">
          <Link href={`/protected/sales-orders/${record.orderId}`}>
            <span className="text-blue-600 hover:underline flex items-center gap-1">
              <ShoppingCartOutlined /> {text}
            </span>
          </Link>
        </Tooltip>
      )
    },
    {
      title: 'Customer',
      dataIndex: 'customer',
      key: 'customer',
      width: 180,
      render: (text: string) => (
        <span className="flex items-center gap-1">
          <UserOutlined className="text-gray-400" /> {text}
        </span>
      )
    },
    {
      title: 'Items',
      key: 'items',
      width: 100,
      render: (_: any, record: PackingTask) => (
        <span>
          <strong>{record.items}</strong> units
          <span className="text-gray-400 text-xs ml-1">({record.itemCount} SKUs)</span>
        </span>
      )
    },
    {
      title: 'Weight',
      dataIndex: 'weight',
      key: 'weight',
      width: 100
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 130,
      render: (status: string) => (
        <Tag color={getStatusColor(status)} className="uppercase">
          {status.replace(/_/g, ' ')}
        </Tag>
      )
    },
    {
      title: 'Priority',
      dataIndex: 'priority',
      key: 'priority',
      width: 100,
      render: (p: string) => (
        <Tag color={getPriorityColor(p)} className="uppercase">
          {p}
        </Tag>
      )
    },
    {
      title: 'Packer',
      dataIndex: 'packer',
      key: 'packer',
      width: 130,
      render: (text: string) => text || <span className="text-gray-400">Unassigned</span>
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 120,
      render: (_: any, record: PackingTask) => (
        <Space>
          <Link href={`/protected/packing/${record.id}`}>
            <Button type="primary" icon={<EyeOutlined />} size="small">
              Pack
            </Button>
          </Link>
        </Space>
      ),
    },
  ];

  const renderTable = (dataSource: PackingTask[]) => (
    <Table
      columns={columns}
      dataSource={dataSource}
      rowKey="id"
      loading={loading}
      scroll={{ x: 1200 }}
      pagination={{ pageSize: 20, showSizeChanger: true }}
      onRow={(record) => ({
        onClick: () => router.push(`/protected/packing/${record.id}`),
        style: { cursor: 'pointer' }
      })}
      locale={{
        emptyText: error ? (
          <div className="text-center py-8">
            <p className="text-red-500 mb-2">{error}</p>
            <Button onClick={fetchPackingTasks}>Retry</Button>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <InboxOutlined className="text-4xl mb-2" />
            <p>No packing tasks found</p>
            <p className="text-sm">Complete picking on orders to see them here</p>
          </div>
        )
      }}
    />
  );

  const tabItems = [
    {
      key: 'all',
      label: (
        <span className="flex items-center gap-2">
          <InboxOutlined />All ({allPacks.length})
        </span>
      ),
      children: renderTable(allPacks),
    },
    {
      key: 'ready_to_pack',
      label: (
        <span className="flex items-center gap-2">
          <InboxOutlined className="text-orange-500" />
          Ready to Pack ({readyToPack.length})
        </span>
      ),
      children: renderTable(readyToPack),
    },
    {
      key: 'packing',
      label: (
        <span className="flex items-center gap-2">
          <SyncOutlined className="text-blue-500" spin={packing.length > 0} />
          Packing ({packing.length})
        </span>
      ),
      children: renderTable(packing),
    },
    {
      key: 'packed',
      label: (
        <span className="flex items-center gap-2">
          <CheckCircleOutlined className="text-green-500" />
          Packed / Ready to Ship ({packed.length})
        </span>
      ),
      children: renderTable(packed),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
            Packing & Shipping Preparation
          </h1>
          <p className="text-gray-600 mt-1">Pack orders and prepare for shipment</p>
        </div>
        <Space>
          <Button icon={<ReloadOutlined />} onClick={fetchPackingTasks} loading={loading}>
            Refresh
          </Button>
        </Space>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-orange-500">
          <div className="text-center">
            <p className="text-gray-500 text-sm">Ready to Pack</p>
            <p className="text-3xl font-bold text-orange-600">{readyToPack.length}</p>
          </div>
        </Card>
        <Card className="border-l-4 border-l-blue-500">
          <div className="text-center">
            <p className="text-gray-500 text-sm">Packing Now</p>
            <p className="text-3xl font-bold text-blue-600">{packing.length}</p>
          </div>
        </Card>
        <Card className="border-l-4 border-l-cyan-500">
          <div className="text-center">
            <p className="text-gray-500 text-sm">Packed</p>
            <p className="text-3xl font-bold text-cyan-600">
              {packed.filter(p => p.status === 'packed').length}
            </p>
          </div>
        </Card>
        <Card className="border-l-4 border-l-green-500">
          <div className="text-center">
            <p className="text-gray-500 text-sm">Ready to Ship</p>
            <p className="text-3xl font-bold text-green-600">
              {packed.filter(p => p.status === 'ready_to_ship').length}
            </p>
          </div>
        </Card>
      </div>

      <Card className="shadow-sm">
        <div className="flex gap-4 mb-4">
          <Search
            placeholder="Search packing slips, orders, customers..."
            style={{ width: 350 }}
            prefix={<SearchOutlined />}
            allowClear
            onChange={(e) => setSearchText(e.target.value)}
          />
        </div>

        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={tabItems}
          size="large"
        />
      </Card>
    </div>
  );
}
