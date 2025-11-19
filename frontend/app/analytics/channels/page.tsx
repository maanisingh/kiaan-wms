'use client';

import React, { useState, useEffect } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Table, Card, Select, Tag, Statistic, Row, Col, Space } from 'antd';
import { DollarOutlined, RiseOutlined, FallOutlined } from '@ant-design/icons';
import apiService from '@/services/api';

export default function ChannelPricingPage() {
  const [prices, setPrices] = useState([]);
  const [channels, setChannels] = useState([]);
  const [selectedChannel, setSelectedChannel] = useState<string | undefined>();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchChannels();
    fetchPrices();
  }, [selectedChannel]);

  const fetchChannels = async () => {
    try {
      const data = await apiService.get('/channels');
      setChannels(data || []);
    } catch (error) {
      console.error('Error fetching channels:', error);
    }
  };

  const fetchPrices = async () => {
    setLoading(true);
    try {
      const url = selectedChannel
        ? `/analytics/channel-prices?channelId=${selectedChannel}`
        : '/analytics/channel-prices';
      const data = await apiService.get(url);
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
      fixed: 'left' as const,
    },
    {
      title: 'Brand',
      dataIndex: ['product', 'brand', 'name'],
      key: 'brand',
      width: 120,
    },
    {
      title: 'Channel',
      dataIndex: ['channel', 'name'],
      key: 'channel',
      width: 150,
    },
    {
      title: 'Selling Price',
      dataIndex: 'sellingPrice',
      key: 'price',
      width: 120,
      align: 'right' as const,
      render: (price: number) => price ? `£${price.toFixed(2)}` : '-',
    },
    {
      title: 'Product Cost',
      dataIndex: 'productCost',
      key: 'cost',
      width: 120,
      align: 'right' as const,
      render: (cost: number) => cost ? `£${cost.toFixed(2)}` : '-',
    },
    {
      title: 'Labor',
      dataIndex: 'laborCost',
      key: 'labor',
      width: 100,
      align: 'right' as const,
      render: (cost: number) => cost ? `£${cost.toFixed(2)}` : '-',
    },
    {
      title: 'Materials',
      dataIndex: 'materialCost',
      key: 'materials',
      width: 100,
      align: 'right' as const,
      render: (cost: number) => cost ? `£${cost.toFixed(2)}` : '-',
    },
    {
      title: 'Total Cost',
      dataIndex: 'totalCost',
      key: 'totalCost',
      width: 120,
      align: 'right' as const,
      render: (cost: number) => cost ? `£${cost.toFixed(2)}` : '-',
    },
    {
      title: 'Gross Profit',
      dataIndex: 'grossProfit',
      key: 'profit',
      width: 120,
      align: 'right' as const,
      render: (profit: number) => {
        if (!profit) return '-';
        const color = profit > 0 ? 'text-green-600' : 'text-red-600';
        const icon = profit > 0 ? <RiseOutlined /> : <FallOutlined />;
        return (
          <span className={color}>
            {icon} £{Math.abs(profit).toFixed(2)}
          </span>
        );
      },
    },
    {
      title: 'Margin %',
      dataIndex: 'profitMargin',
      key: 'margin',
      width: 100,
      align: 'center' as const,
      render: (margin: number) => {
        if (!margin) return '-';
        const color = margin >= 20 ? 'success' : margin >= 10 ? 'warning' : 'error';
        return <Tag color={color}>{margin.toFixed(1)}%</Tag>;
      },
    },
  ];

  const avgMargin = prices.length > 0
    ? prices.reduce((sum: number, p: any) => sum + (p.profitMargin || 0), 0) / prices.length
    : 0;

  const totalProfit = prices.reduce((sum: number, p: any) => sum + (p.grossProfit || 0), 0);
  const totalRevenue = prices.reduce((sum: number, p: any) => sum + (p.sellingPrice || 0), 0);

  return (
    <MainLayout>
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">Channel Pricing Analysis</h1>
          <p className="text-gray-500">Compare pricing and margins across different sales channels</p>
        </div>

        <Row gutter={16} className="mb-6">
          <Col span={6}>
            <Card>
              <Statistic
                title="Total Products"
                value={prices.length}
                suffix="items"
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="Total Revenue"
                value={totalRevenue.toFixed(2)}
                prefix="£"
                valueStyle={{ color: '#1890ff' }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="Total Gross Profit"
                value={totalProfit.toFixed(2)}
                prefix="£"
                valueStyle={{ color: totalProfit >= 0 ? '#3f8600' : '#cf1322' }}
                prefix={totalProfit >= 0 ? <RiseOutlined /> : <FallOutlined />}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="Average Margin"
                value={avgMargin.toFixed(1)}
                suffix="%"
                valueStyle={{ color: avgMargin >= 20 ? '#3f8600' : '#cf1322' }}
              />
            </Card>
          </Col>
        </Row>

        <Card>
          <div className="mb-4">
            <Space>
              <span className="font-medium">Filter by channel:</span>
              <Select
                placeholder="All channels"
                style={{ width: 250 }}
                value={selectedChannel}
                onChange={setSelectedChannel}
                allowClear
              >
                {channels.map((ch: any) => (
                  <Select.Option key={ch.id} value={ch.id}>
                    {ch.name}
                  </Select.Option>
                ))}
              </Select>
            </Space>
          </div>

          <Table
            columns={columns}
            dataSource={prices}
            loading={loading}
            rowKey="id"
            pagination={{ pageSize: 20 }}
            scroll={{ x: 1400 }}
          />
        </Card>
      </div>
    </MainLayout>
  );
}
