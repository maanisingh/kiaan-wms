'use client';

import React, { useState, useEffect } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, Table, Progress, Statistic, Row, Col } from 'antd';
import { DollarOutlined } from '@ant-design/icons';
import apiService from '@/services/api';

export default function MarginAnalysisPage() {
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
      console.error('Error:', error);
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
    },
    {
      title: 'Channel',
      dataIndex: ['channel', 'name'],
      key: 'channel',
      width: 150,
    },
    {
      title: 'Revenue',
      dataIndex: 'sellingPrice',
      key: 'revenue',
      width: 120,
      render: (v: number) => `£${v?.toFixed(2)}`,
    },
    {
      title: 'Cost',
      dataIndex: 'totalCost',
      key: 'cost',
      width: 120,
      render: (v: number) => `£${v?.toFixed(2)}`,
    },
    {
      title: 'Profit',
      dataIndex: 'grossProfit',
      key: 'profit',
      width: 120,
      render: (v: number) => `£${v?.toFixed(2)}`,
    },
    {
      title: 'Margin',
      dataIndex: 'profitMargin',
      key: 'margin',
      width: 200,
      render: (margin: number) => (
        <Progress
          percent={margin}
          strokeColor={margin >= 20 ? '#52c41a' : margin >= 10 ? '#faad14' : '#f5222d'}
          format={(percent) => `${percent?.toFixed(1)}%`}
        />
      ),
    },
  ];

  const avgMargin = prices.length > 0 ? prices.reduce((s: number, p: any) => s + (p.profitMargin || 0), 0) / prices.length : 0;
  const totalProfit = prices.reduce((s: number, p: any) => s + (p.grossProfit || 0), 0);
  const highMarginCount = prices.filter((p: any) => p.profitMargin >= 20).length;

  return (
    <MainLayout>
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-6">Margin Analysis</h1>

        <Row gutter={16} className="mb-6">
          <Col span={8}>
            <Card>
              <Statistic title="Average Margin" value={avgMargin.toFixed(1)} suffix="%" />
            </Card>
          </Col>
          <Col span={8}>
            <Card>
              <Statistic title="Total Profit" value={totalProfit.toFixed(2)} prefix="£" />
            </Card>
          </Col>
          <Col span={8}>
            <Card>
              <Statistic title="High Margin Products" value={highMarginCount} suffix={`/ ${prices.length}`} />
            </Card>
          </Col>
        </Row>

        <Card>
          <Table columns={columns} dataSource={prices} loading={loading} rowKey="id" />
        </Card>
      </div>
    </MainLayout>
  );
}
