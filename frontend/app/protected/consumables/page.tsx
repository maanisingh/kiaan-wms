'use client';

import React, { useState, useEffect } from 'react';
import {
  Card, Table, Button, Space, Tag, Input, Select, message, Statistic, Row, Col
} from 'antd';
import {
  PlusOutlined, SearchOutlined, InboxOutlined, DollarOutlined,
  WarningOutlined, ReloadOutlined
} from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import { formatCurrency } from '@/lib/utils';
import apiService from '@/services/api';
import Link from 'next/link';

interface Consumable {
  id: string;
  sku: string;
  name: string;
  category: string;
  costPriceEach?: number;
  unitPerPack?: number;
  costPricePack?: number;
  onStock: number;
  reorderLevel?: number;
  supplier?: { id: string; name: string };
  isActive: boolean;
}

export default function ConsumablesPage() {
  const router = useRouter();
  const [consumables, setConsumables] = useState<Consumable[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string | undefined>(undefined);

  const fetchConsumables = async () => {
    try {
      setLoading(true);
      const data = await apiService.get('/consumables');
      setConsumables(data.consumables || []);
    } catch (err: any) {
      console.error('Failed to fetch consumables:', err);
      message.error(err.message || 'Failed to load consumables');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConsumables();
  }, []);

  const filteredConsumables = consumables.filter((item) => {
    const matchesSearch = !searchText ||
      item.name.toLowerCase().includes(searchText.toLowerCase()) ||
      item.sku.toLowerCase().includes(searchText.toLowerCase());
    const matchesCategory = !categoryFilter || item.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const categories = Array.from(new Set(consumables.map(c => c.category)));

  // Calculate stats
  const totalValue = consumables.reduce((sum, c) => sum + (c.onStock * (c.costPriceEach || 0)), 0);
  const lowStockItems = consumables.filter(c => c.reorderLevel && c.onStock <= c.reorderLevel).length;
  const totalItems = consumables.length;

  const columns = [
    {
      title: 'SKU',
      dataIndex: 'sku',
      key: 'sku',
      render: (sku: string, record: Consumable) => (
        <Link href={`/protected/consumables/${record.id}`}>
          <span className="font-mono text-blue-600 hover:underline cursor-pointer">{sku}</span>
        </Link>
      ),
    },
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      render: (name: string) => <span className="font-semibold">{name}</span>,
    },
    {
      title: 'Category',
      dataIndex: 'category',
      key: 'category',
      render: (category: string) => (
        <Tag color="blue">{category}</Tag>
      ),
    },
    {
      title: 'Cost/Each',
      dataIndex: 'costPriceEach',
      key: 'costEach',
      align: 'right' as const,
      render: (cost?: number) => formatCurrency(cost || 0),
    },
    {
      title: 'Units/Pack',
      dataIndex: 'unitPerPack',
      key: 'unitsPack',
      align: 'center' as const,
      render: (units?: number) => units || '-',
    },
    {
      title: 'Pack Cost',
      dataIndex: 'costPricePack',
      key: 'packCost',
      align: 'right' as const,
      render: (cost?: number) => formatCurrency(cost || 0),
    },
    {
      title: 'In Stock',
      dataIndex: 'onStock',
      key: 'stock',
      align: 'right' as const,
      render: (stock: number, record: Consumable) => {
        const isLow = record.reorderLevel && stock <= record.reorderLevel;
        return (
          <span className={isLow ? 'text-red-600 font-semibold' : ''}>
            {stock}
            {isLow && <WarningOutlined className="ml-2 text-orange-500" />}
          </span>
        );
      },
    },
    {
      title: 'Stock Value',
      key: 'value',
      align: 'right' as const,
      render: (_: any, record: Consumable) => {
        const value = record.onStock * (record.costPriceEach || 0);
        return formatCurrency(value);
      },
    },
    {
      title: 'Supplier',
      dataIndex: 'supplier',
      key: 'supplier',
      render: (supplier?: { name: string }) => supplier?.name || '-',
    },
    {
      title: 'Status',
      dataIndex: 'isActive',
      key: 'status',
      render: (isActive: boolean) => (
        <Tag color={isActive ? 'green' : 'red'}>
          {isActive ? 'Active' : 'Inactive'}
        </Tag>
      ),
    },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Consumables & Packaging</h1>
          <p className="text-gray-500 mt-1">
            Manage packaging materials, boxes, tape, labels, and other consumables
          </p>
        </div>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          size="large"
          onClick={() => router.push('/protected/consumables/new')}
        >
          Add Consumable
        </Button>
      </div>

      {/* Stats Cards */}
      <Row gutter={16}>
        <Col span={8}>
          <Card>
            <Statistic
              title="Total Items"
              value={totalItems}
              prefix={<InboxOutlined />}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic
              title="Total Stock Value"
              value={totalValue}
              precision={2}
              prefix="£"
              valueStyle={{ color: '#3f8600' }}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic
              title="Low Stock Items"
              value={lowStockItems}
              prefix={<WarningOutlined />}
              valueStyle={{ color: lowStockItems > 0 ? '#cf1322' : '#3f8600' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Filters */}
      <Card>
        <div className="flex gap-4 items-center">
          <Input
            placeholder="Search by name or SKU..."
            prefix={<SearchOutlined />}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            style={{ width: 300 }}
            allowClear
          />
          <Select
            placeholder="Filter by category"
            value={categoryFilter}
            onChange={setCategoryFilter}
            style={{ width: 200 }}
            allowClear
          >
            {categories.map((cat) => (
              <Select.Option key={cat} value={cat}>
                {cat}
              </Select.Option>
            ))}
          </Select>
          <Button
            icon={<ReloadOutlined />}
            onClick={fetchConsumables}
          >
            Refresh
          </Button>
        </div>
      </Card>

      {/* Consumables Table */}
      <Card>
        <Table
          dataSource={filteredConsumables}
          columns={columns}
          rowKey="id"
          loading={loading}
          pagination={{
            pageSize: 20,
            showSizeChanger: true,
            showTotal: (total) => `Total ${total} items`,
          }}
        />
      </Card>
    </div>
  );
}
