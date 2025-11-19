'use client';

import React, { useState, useEffect } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Table, Card, Tag, Button, Space } from 'antd';
import { RiseOutlined, FallOutlined, CheckCircleOutlined, WarningOutlined } from '@ant-design/icons';
import apiService from '@/services/api';

export default function PriceOptimizerPage() {
  const [prices, setPrices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPrices();
  }, []);

  const fetchPrices = async () => {
    setLoading(true);
    try {
      const data = await apiService.get('/analytics/channel-prices');
      setPrices(data || []);
    } catch (error) {
      console.error('Error fetching prices:', error);
      setPrices([]);
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      title: 'Product',
      dataIndex: ['product', 'name'],
      key: 'product',
      width: 250,
    },
    {
      title: 'Channel',
      dataIndex: ['channel', 'name'],
      key: 'channel',
      width: 150,
    },
    {
      title: 'Current Price',
      dataIndex: 'sellingPrice',
      key: 'current',
      width: 120,
      render: (price: number) => `£${price?.toFixed(2)}`,
    },
    {
      title: 'Current Margin',
      dataIndex: 'profitMargin',
      key: 'margin',
      width: 120,
      render: (margin: number) => {
        const color = margin >= 20 ? 'success' : margin >= 10 ? 'warning' : 'error';
        return <Tag color={color}>{margin?.toFixed(1)}%</Tag>;
      },
    },
    {
      title: 'Recommended Price',
      key: 'recommended',
      width: 150,
      render: (_: any, record: any) => {
        const targetMargin = 20; // 20% target margin
        const recommended = record.totalCost / (1 - targetMargin / 100);
        return `£${recommended.toFixed(2)}`;
      },
    },
    {
      title: 'Price Change',
      key: 'change',
      width: 120,
      render: (_: any, record: any) => {
        const targetMargin = 20;
        const recommended = record.totalCost / (1 - targetMargin / 100);
        const change = recommended - record.sellingPrice;
        const pct = (change / record.sellingPrice * 100);
        const color = change > 0 ? 'text-red-600' : 'text-green-600';
        const icon = change > 0 ? <RiseOutlined /> : <FallOutlined />;
        return (
          <span className={color}>
            {icon} {change > 0 ? '+' : ''}{pct.toFixed(1)}%
          </span>
        );
      },
    },
    {
      title: 'Recommendation',
      key: 'status',
      width: 150,
      render: (_: any, record: any) => {
        if (record.profitMargin >= 20) {
          return <Tag color="success" icon={<CheckCircleOutlined />}>Optimal</Tag>;
        } else if (record.profitMargin >= 10) {
          return <Tag color="warning" icon={<WarningOutlined />}>Consider Increase</Tag>;
        } else {
          return <Tag color="error" icon={<WarningOutlined />}>Increase Required</Tag>;
        }
      },
    },
  ];

  return (
    <MainLayout>
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">Price Optimizer</h1>
          <p className="text-gray-500">AI-powered pricing recommendations to maximize margins</p>
        </div>

        <Card className="mb-4">
          <div className="bg-blue-50 p-4 rounded">
            <h3 className="font-semibold mb-2">Optimization Strategy</h3>
            <p className="text-sm text-gray-700">
              Target margin: <strong>20%</strong> | Algorithm considers product cost, labor, materials, and channel fees
            </p>
          </div>
        </Card>

        <Card>
          <Table
            columns={columns}
            dataSource={prices}
            loading={loading}
            rowKey="id"
            pagination={{ pageSize: 20 }}
          />
        </Card>
      </div>
    </MainLayout>
  );
}
