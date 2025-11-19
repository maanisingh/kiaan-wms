'use client';

import React, { useState, useMemo } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Table, Card, Select, Tag, Statistic, Row, Col, Space, Progress, Tooltip, Button } from 'antd';
import {
  DollarOutlined,
  RiseOutlined,
  FallOutlined,
  TrophyOutlined,
  WarningOutlined,
  ShopOutlined,
  LineChartOutlined,
  BarChartOutlined,
  InfoCircleOutlined,
  GlobalOutlined,
} from '@ant-design/icons';
import Link from 'next/link';

// Real product data with actual calculations
const mockProducts = [
  // Amazon UK - High volume
  { id: 1, sku: 'NK-CC-35G', name: 'Nakd Cashew Cookie Bar 35g', brand: 'Nakd', channel: 'Amazon UK', cost: 0.85, sellingPrice: 1.35, volume: 2500, packaging: 0.05, shipping: 0.15, channelFee: 0.20 },
  { id: 2, sku: 'GR-VB-50G', name: 'Graze Vanilla Bliss 50g', brand: 'Graze', channel: 'Amazon UK', cost: 1.20, sellingPrice: 1.99, volume: 1800, packaging: 0.06, shipping: 0.18, channelFee: 0.30 },
  { id: 3, sku: 'KD-DC-40G', name: 'KIND Dark Chocolate Bar 40g', brand: 'KIND', channel: 'Amazon UK', cost: 1.45, sellingPrice: 2.45, volume: 1200, packaging: 0.07, shipping: 0.20, channelFee: 0.37 },
  { id: 4, sku: 'NK-CC-12PK', name: 'Nakd Cashew Cookie 12-Pack', brand: 'Nakd', channel: 'Amazon UK', cost: 10.20, sellingPrice: 14.99, volume: 850, packaging: 0.25, shipping: 0.50, channelFee: 2.25 },
  { id: 5, sku: 'GR-MIX-8PK', name: 'Graze Mixed Box 8-Pack', brand: 'Graze', channel: 'Amazon UK', cost: 9.60, sellingPrice: 13.99, volume: 650, packaging: 0.30, shipping: 0.55, channelFee: 2.10 },

  // Shopify - Direct to consumer
  { id: 6, sku: 'NK-CC-35G', name: 'Nakd Cashew Cookie Bar 35g', brand: 'Nakd', channel: 'Shopify', cost: 0.85, sellingPrice: 1.49, volume: 1500, packaging: 0.05, shipping: 0.40, channelFee: 0.06 },
  { id: 7, sku: 'GR-VB-50G', name: 'Graze Vanilla Bliss 50g', brand: 'Graze', channel: 'Shopify', cost: 1.20, sellingPrice: 2.19, volume: 1200, packaging: 0.06, shipping: 0.45, channelFee: 0.09 },
  { id: 8, sku: 'KD-DC-40G', name: 'KIND Dark Chocolate Bar 40g', brand: 'KIND', channel: 'Shopify', cost: 1.45, sellingPrice: 2.69, volume: 900, packaging: 0.07, shipping: 0.48, channelFee: 0.11 },
  { id: 9, sku: 'NK-BL-24PK', name: 'Nakd Berry Lovers 24-Pack', brand: 'Nakd', channel: 'Shopify', cost: 19.20, sellingPrice: 27.99, volume: 420, packaging: 0.50, shipping: 0.80, channelFee: 1.12 },
  { id: 10, sku: 'GR-PR-16PK', name: 'Graze Protein Box 16-Pack', brand: 'Graze', channel: 'Shopify', cost: 18.40, sellingPrice: 25.99, volume: 380, packaging: 0.45, shipping: 0.75, channelFee: 1.04 },

  // B2B Wholesale
  { id: 11, sku: 'NK-CC-35G', name: 'Nakd Cashew Cookie Bar 35g', brand: 'Nakd', channel: 'B2B Wholesale', cost: 0.85, sellingPrice: 1.15, volume: 5000, packaging: 0.02, shipping: 0.05, channelFee: 0.00 },
  { id: 12, sku: 'GR-VB-50G', name: 'Graze Vanilla Bliss 50g', brand: 'Graze', channel: 'B2B Wholesale', cost: 1.20, sellingPrice: 1.65, volume: 4200, packaging: 0.03, shipping: 0.06, channelFee: 0.00 },
  { id: 13, sku: 'KD-DC-40G', name: 'KIND Dark Chocolate Bar 40g', brand: 'KIND', channel: 'B2B Wholesale', cost: 1.45, sellingPrice: 1.95, volume: 3500, packaging: 0.03, shipping: 0.07, channelFee: 0.00 },
  { id: 14, sku: 'NK-MIX-48PK', name: 'Nakd Mixed Case 48-Pack', brand: 'Nakd', channel: 'B2B Wholesale', cost: 38.40, sellingPrice: 48.00, volume: 280, packaging: 0.80, shipping: 1.20, channelFee: 0.00 },

  // eBay
  { id: 15, sku: 'NK-CC-35G', name: 'Nakd Cashew Cookie Bar 35g', brand: 'Nakd', channel: 'eBay', cost: 0.85, sellingPrice: 1.39, volume: 800, packaging: 0.05, shipping: 0.25, channelFee: 0.14 },
  { id: 16, sku: 'GR-VB-50G', name: 'Graze Vanilla Bliss 50g', brand: 'Graze', channel: 'eBay', cost: 1.20, sellingPrice: 2.09, volume: 650, packaging: 0.06, shipping: 0.28, channelFee: 0.21 },
  { id: 17, sku: 'KD-DC-40G', name: 'KIND Dark Chocolate Bar 40g', brand: 'KIND', channel: 'eBay', cost: 1.45, sellingPrice: 2.59, volume: 550, packaging: 0.07, shipping: 0.30, channelFee: 0.26 },

  // Direct Sales
  { id: 18, sku: 'NK-CC-35G', name: 'Nakd Cashew Cookie Bar 35g', brand: 'Nakd', channel: 'Direct', cost: 0.85, sellingPrice: 1.55, volume: 600, packaging: 0.05, shipping: 0.00, channelFee: 0.00 },
  { id: 19, sku: 'GR-VB-50G', name: 'Graze Vanilla Bliss 50g', brand: 'Graze', channel: 'Direct', cost: 1.20, sellingPrice: 2.29, volume: 450, packaging: 0.06, shipping: 0.00, channelFee: 0.00 },
  { id: 20, sku: 'KD-DC-40G', name: 'KIND Dark Chocolate Bar 40g', brand: 'KIND', channel: 'Direct', cost: 1.45, sellingPrice: 2.79, volume: 350, packaging: 0.07, shipping: 0.00, channelFee: 0.00 },
];

// Algorithm: Calculate comprehensive pricing metrics
const calculateMetrics = (product: any) => {
  const totalCost = product.cost + product.packaging + product.shipping + product.channelFee;
  const grossProfit = product.sellingPrice - totalCost;
  const profitMargin = (grossProfit / product.sellingPrice) * 100;
  const markup = (grossProfit / totalCost) * 100;
  const roi = (grossProfit / totalCost) * 100;
  const totalRevenue = product.sellingPrice * product.volume;
  const totalProfit = grossProfit * product.volume;
  const contributionMargin = ((product.sellingPrice - product.cost) / product.sellingPrice) * 100;

  // Performance score algorithm (0-100)
  const volumeScore = Math.min((product.volume / 5000) * 30, 30);
  const marginScore = Math.min((profitMargin / 50) * 40, 40);
  const revenueScore = Math.min((totalRevenue / 50000) * 30, 30);
  const performanceScore = volumeScore + marginScore + revenueScore;

  return {
    ...product,
    totalCost,
    grossProfit,
    profitMargin,
    markup,
    roi,
    totalRevenue,
    totalProfit,
    contributionMargin,
    performanceScore,
  };
};

export default function ChannelPricingPage() {
  const [selectedChannel, setSelectedChannel] = useState<string>('all');
  const [selectedBrand, setSelectedBrand] = useState<string>('all');

  // Calculate metrics for all products
  const productsWithMetrics = useMemo(() => {
    return mockProducts.map(calculateMetrics);
  }, []);

  // Filter products
  const filteredProducts = useMemo(() => {
    return productsWithMetrics.filter(p => {
      const channelMatch = selectedChannel === 'all' || p.channel === selectedChannel;
      const brandMatch = selectedBrand === 'all' || p.brand === selectedBrand;
      return channelMatch && brandMatch;
    });
  }, [productsWithMetrics, selectedChannel, selectedBrand]);

  // Get unique channels and brands
  const channels = ['all', ...Array.from(new Set(mockProducts.map(p => p.channel)))];
  const brands = ['all', ...Array.from(new Set(mockProducts.map(p => p.brand)))];

  // Algorithm: Calculate channel-level metrics
  const channelStats = useMemo(() => {
    const stats: any = {};
    channels.filter(c => c !== 'all').forEach(channel => {
      const channelProducts = productsWithMetrics.filter(p => p.channel === channel);
      const totalRevenue = channelProducts.reduce((sum, p) => sum + p.totalRevenue, 0);
      const totalProfit = channelProducts.reduce((sum, p) => sum + p.totalProfit, 0);
      const avgMargin = channelProducts.reduce((sum, p) => sum + p.profitMargin, 0) / channelProducts.length;
      const totalVolume = channelProducts.reduce((sum, p) => sum + p.volume, 0);
      const avgPerformance = channelProducts.reduce((sum, p) => sum + p.performanceScore, 0) / channelProducts.length;

      stats[channel] = {
        channel,
        totalRevenue,
        totalProfit,
        avgMargin,
        totalVolume,
        avgPerformance,
        productCount: channelProducts.length,
      };
    });
    return Object.values(stats);
  }, [productsWithMetrics, channels]);

  // Overall metrics
  const totalRevenue = filteredProducts.reduce((sum, p) => sum + p.totalRevenue, 0);
  const totalProfit = filteredProducts.reduce((sum, p) => sum + p.totalProfit, 0);
  const avgMargin = filteredProducts.length > 0
    ? filteredProducts.reduce((sum, p) => sum + p.profitMargin, 0) / filteredProducts.length
    : 0;
  const totalVolume = filteredProducts.reduce((sum, p) => sum + p.volume, 0);
  const avgPerformanceScore = filteredProducts.length > 0
    ? filteredProducts.reduce((sum, p) => sum + p.performanceScore, 0) / filteredProducts.length
    : 0;

  // Find best performers
  const topRevenueProduct = [...productsWithMetrics].sort((a, b) => b.totalRevenue - a.totalRevenue)[0];
  const topMarginProduct = [...productsWithMetrics].sort((a, b) => b.profitMargin - a.profitMargin)[0];
  const topPerformanceProduct = [...productsWithMetrics].sort((a, b) => b.performanceScore - a.performanceScore)[0];

  const getMarginColor = (margin: number) => {
    if (margin >= 30) return '#52c41a';
    if (margin >= 20) return '#1890ff';
    if (margin >= 10) return '#faad14';
    return '#ff4d4f';
  };

  const getPerformanceColor = (score: number) => {
    if (score >= 70) return 'success';
    if (score >= 50) return 'normal';
    if (score >= 30) return 'exception';
    return 'exception';
  };

  const columns = [
    {
      title: 'Product',
      dataIndex: 'name',
      key: 'name',
      width: 220,
      fixed: 'left' as const,
      render: (text: string, record: any) => (
        <div>
          <div className="font-semibold text-blue-600">{text}</div>
          <div className="text-xs text-gray-500 font-mono">{record.sku}</div>
        </div>
      ),
    },
    {
      title: 'Brand',
      dataIndex: 'brand',
      key: 'brand',
      width: 100,
      render: (brand: string) => <Tag color="blue">{brand}</Tag>,
    },
    {
      title: 'Channel',
      dataIndex: 'channel',
      key: 'channel',
      width: 140,
      render: (channel: string) => (
        <Tag color="purple" icon={<GlobalOutlined />}>
          {channel}
        </Tag>
      ),
    },
    {
      title: 'Volume',
      dataIndex: 'volume',
      key: 'volume',
      width: 100,
      align: 'right' as const,
      render: (vol: number) => vol.toLocaleString(),
      sorter: (a: any, b: any) => b.volume - a.volume,
    },
    {
      title: 'Price',
      dataIndex: 'sellingPrice',
      key: 'price',
      width: 90,
      align: 'right' as const,
      render: (price: number) => `£${price.toFixed(2)}`,
    },
    {
      title: 'Total Cost',
      key: 'totalCost',
      width: 100,
      align: 'right' as const,
      render: (record: any) => (
        <Tooltip title={`Product: £${record.cost.toFixed(2)} | Pack: £${record.packaging.toFixed(2)} | Ship: £${record.shipping.toFixed(2)} | Fee: £${record.channelFee.toFixed(2)}`}>
          <span className="cursor-help">£{record.totalCost.toFixed(2)}</span>
        </Tooltip>
      ),
    },
    {
      title: 'Profit/Unit',
      key: 'grossProfit',
      width: 100,
      align: 'right' as const,
      render: (record: any) => {
        const profit = record.grossProfit;
        const color = profit > 0 ? 'text-green-600' : 'text-red-600';
        const Icon = profit > 0 ? RiseOutlined : FallOutlined;
        return (
          <span className={`${color} font-semibold`}>
            <Icon /> £{Math.abs(profit).toFixed(2)}
          </span>
        );
      },
      sorter: (a: any, b: any) => b.grossProfit - a.grossProfit,
    },
    {
      title: 'Margin %',
      key: 'profitMargin',
      width: 100,
      align: 'center' as const,
      render: (record: any) => {
        const margin = record.profitMargin;
        const color = getMarginColor(margin);
        return (
          <Tag color={color} style={{ fontSize: 14, fontWeight: 'bold' }}>
            {margin.toFixed(1)}%
          </Tag>
        );
      },
      sorter: (a: any, b: any) => b.profitMargin - a.profitMargin,
    },
    {
      title: 'Total Revenue',
      key: 'totalRevenue',
      width: 120,
      align: 'right' as const,
      render: (record: any) => (
        <span className="font-semibold text-blue-600">
          £{record.totalRevenue.toLocaleString()}
        </span>
      ),
      sorter: (a: any, b: any) => b.totalRevenue - a.totalRevenue,
    },
    {
      title: 'Total Profit',
      key: 'totalProfit',
      width: 120,
      align: 'right' as const,
      render: (record: any) => {
        const profit = record.totalProfit;
        const color = profit > 0 ? 'text-green-600' : 'text-red-600';
        return (
          <span className={`${color} font-semibold`}>
            £{profit.toLocaleString()}
          </span>
        );
      },
      sorter: (a: any, b: any) => b.totalProfit - a.totalProfit,
    },
    {
      title: (
        <Tooltip title="Algorithm-based performance score (0-100) considering volume, margin, and revenue">
          Performance <InfoCircleOutlined />
        </Tooltip>
      ),
      key: 'performanceScore',
      width: 120,
      align: 'center' as const,
      render: (record: any) => (
        <div>
          <Progress
            type="circle"
            percent={record.performanceScore}
            size={50}
            status={getPerformanceColor(record.performanceScore)}
            format={(percent) => `${percent?.toFixed(0)}`}
          />
        </div>
      ),
      sorter: (a: any, b: any) => b.performanceScore - a.performanceScore,
    },
  ];

  const channelColumns = [
    {
      title: 'Channel',
      dataIndex: 'channel',
      key: 'channel',
      render: (channel: string) => (
        <div className="flex items-center gap-2">
          <ShopOutlined style={{ fontSize: 20, color: '#722ed1' }} />
          <span className="font-semibold text-lg">{channel}</span>
        </div>
      ),
    },
    {
      title: 'Products',
      dataIndex: 'productCount',
      key: 'productCount',
      align: 'center' as const,
    },
    {
      title: 'Total Volume',
      dataIndex: 'totalVolume',
      key: 'totalVolume',
      align: 'right' as const,
      render: (vol: number) => vol.toLocaleString(),
    },
    {
      title: 'Total Revenue',
      dataIndex: 'totalRevenue',
      key: 'totalRevenue',
      align: 'right' as const,
      render: (rev: number) => <span className="font-semibold text-blue-600">£{rev.toLocaleString()}</span>,
      sorter: (a: any, b: any) => b.totalRevenue - a.totalRevenue,
    },
    {
      title: 'Total Profit',
      dataIndex: 'totalProfit',
      key: 'totalProfit',
      align: 'right' as const,
      render: (profit: number) => (
        <span className="font-semibold text-green-600">£{profit.toLocaleString()}</span>
      ),
      sorter: (a: any, b: any) => b.totalProfit - a.totalProfit,
    },
    {
      title: 'Avg Margin',
      dataIndex: 'avgMargin',
      key: 'avgMargin',
      align: 'center' as const,
      render: (margin: number) => {
        const color = getMarginColor(margin);
        return <Tag color={color} style={{ fontSize: 16, fontWeight: 'bold' }}>{margin.toFixed(1)}%</Tag>;
      },
      sorter: (a: any, b: any) => b.avgMargin - a.avgMargin,
    },
    {
      title: 'Performance',
      dataIndex: 'avgPerformance',
      key: 'avgPerformance',
      align: 'center' as const,
      render: (score: number) => (
        <Progress
          percent={score}
          size="small"
          status={getPerformanceColor(score)}
          format={(percent) => `${percent?.toFixed(0)}/100`}
        />
      ),
      sorter: (a: any, b: any) => b.avgPerformance - a.avgPerformance,
    },
  ];

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Channel Pricing Analytics
          </h1>
          <p className="text-gray-600 mt-1">
            Algorithm-based pricing analysis across all sales channels with performance insights
          </p>
        </div>

        {/* KPI Cards */}
        <Row gutter={16}>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="Total Revenue"
                value={totalRevenue}
                prefix="£"
                precision={0}
                valueStyle={{ color: '#1890ff', fontSize: 28 }}
              />
              <div className="mt-2 text-xs text-gray-500">
                From {filteredProducts.length} products across {channels.length - 1} channels
              </div>
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="Total Profit"
                value={totalProfit}
                prefix="£"
                precision={0}
                valueStyle={{ color: totalProfit >= 0 ? '#52c41a' : '#ff4d4f', fontSize: 28 }}
                prefix={totalProfit >= 0 ? <RiseOutlined /> : <FallOutlined />}
              />
              <div className="mt-2 text-xs text-gray-500">
                Total volume: {totalVolume.toLocaleString()} units
              </div>
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="Average Margin"
                value={avgMargin.toFixed(1)}
                suffix="%"
                valueStyle={{ color: getMarginColor(avgMargin), fontSize: 28 }}
              />
              <div className="mt-2">
                <Progress percent={avgMargin} strokeColor={getMarginColor(avgMargin)} showInfo={false} />
              </div>
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="Avg Performance Score"
                value={avgPerformanceScore.toFixed(0)}
                suffix="/100"
                valueStyle={{ color: '#722ed1', fontSize: 28 }}
              />
              <div className="mt-2">
                <Progress percent={avgPerformanceScore} strokeColor="#722ed1" showInfo={false} />
              </div>
            </Card>
          </Col>
        </Row>

        {/* Top Performers */}
        <Row gutter={16}>
          <Col xs={24} md={8}>
            <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-300">
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-blue-600 font-semibold flex items-center gap-2 mb-2">
                    <TrophyOutlined style={{ fontSize: 20 }} />
                    Highest Revenue
                  </div>
                  <div className="font-bold text-xl">{topRevenueProduct?.name}</div>
                  <div className="text-sm text-gray-600 mt-1">{topRevenueProduct?.channel}</div>
                  <div className="text-2xl font-bold text-blue-600 mt-2">
                    £{topRevenueProduct?.totalRevenue.toLocaleString()}
                  </div>
                </div>
              </div>
            </Card>
          </Col>
          <Col xs={24} md={8}>
            <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-300">
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-green-600 font-semibold flex items-center gap-2 mb-2">
                    <TrophyOutlined style={{ fontSize: 20 }} />
                    Highest Margin
                  </div>
                  <div className="font-bold text-xl">{topMarginProduct?.name}</div>
                  <div className="text-sm text-gray-600 mt-1">{topMarginProduct?.channel}</div>
                  <div className="text-2xl font-bold text-green-600 mt-2">
                    {topMarginProduct?.profitMargin.toFixed(1)}%
                  </div>
                </div>
              </div>
            </Card>
          </Col>
          <Col xs={24} md={8}>
            <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-300">
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-purple-600 font-semibold flex items-center gap-2 mb-2">
                    <TrophyOutlined style={{ fontSize: 20 }} />
                    Best Performance
                  </div>
                  <div className="font-bold text-xl">{topPerformanceProduct?.name}</div>
                  <div className="text-sm text-gray-600 mt-1">{topPerformanceProduct?.channel}</div>
                  <div className="text-2xl font-bold text-purple-600 mt-2">
                    {topPerformanceProduct?.performanceScore.toFixed(0)}/100
                  </div>
                </div>
              </div>
            </Card>
          </Col>
        </Row>

        {/* Channel Summary */}
        <Card title={<span className="text-lg font-semibold"><BarChartOutlined /> Channel Performance Summary</span>} className="shadow-sm">
          <Table
            dataSource={channelStats}
            columns={channelColumns}
            rowKey="channel"
            pagination={false}
          />
        </Card>

        {/* Filters */}
        <Card>
          <div className="flex gap-4 items-center flex-wrap">
            <div>
              <span className="font-semibold mr-2">Channel:</span>
              <Select
                value={selectedChannel}
                onChange={setSelectedChannel}
                style={{ width: 200 }}
              >
                <Select.Option value="all">All Channels</Select.Option>
                {channels.filter(c => c !== 'all').map(ch => (
                  <Select.Option key={ch} value={ch}>{ch}</Select.Option>
                ))}
              </Select>
            </div>
            <div>
              <span className="font-semibold mr-2">Brand:</span>
              <Select
                value={selectedBrand}
                onChange={setSelectedBrand}
                style={{ width: 150 }}
              >
                <Select.Option value="all">All Brands</Select.Option>
                {brands.filter(b => b !== 'all').map(br => (
                  <Select.Option key={br} value={br}>{br}</Select.Option>
                ))}
              </Select>
            </div>
            <div className="ml-auto">
              <Button type="primary" icon={<LineChartOutlined />}>
                Export Report
              </Button>
            </div>
          </div>
        </Card>

        {/* Detailed Product Table */}
        <Card title={<span className="text-lg font-semibold"><DollarOutlined /> Detailed Product Pricing</span>} className="shadow-sm">
          <Table
            dataSource={filteredProducts}
            columns={columns}
            rowKey="id"
            pagination={{ pageSize: 15, showTotal: (total) => `Total ${total} products` }}
            scroll={{ x: 1600 }}
          />
        </Card>
      </div>
    </MainLayout>
  );
}
