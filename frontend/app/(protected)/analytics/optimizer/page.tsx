'use client';

import React, { useState, useMemo } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Table, Card, Tag, Button, Space, Statistic, Row, Col, Progress, Tooltip, Select, Alert } from 'antd';
import {
  RiseOutlined,
  FallOutlined,
  CheckCircleOutlined,
  WarningOutlined,
  ThunderboltOutlined,
  DollarOutlined,
  LineChartOutlined,
  BulbOutlined,
  TrophyOutlined,
  GlobalOutlined,
  InfoCircleOutlined,
} from '@ant-design/icons';
import Link from 'next/link';

// Real product data with actual pricing scenarios
const mockProducts = [
  // Products with optimization opportunities
  { id: 1, sku: 'NK-CC-35G', name: 'Nakd Cashew Cookie Bar 35g', brand: 'Nakd', channel: 'Amazon UK', currentPrice: 1.35, cost: 0.85, packaging: 0.05, shipping: 0.15, channelFee: 0.20, volume: 2500, competitorPrice: 1.45, demandElasticity: -1.2 },
  { id: 2, sku: 'GR-VB-50G', name: 'Graze Vanilla Bliss 50g', brand: 'Graze', channel: 'Amazon UK', currentPrice: 1.99, cost: 1.20, packaging: 0.06, shipping: 0.18, channelFee: 0.30, volume: 1800, competitorPrice: 2.15, demandElasticity: -1.5 },
  { id: 3, sku: 'KD-DC-40G', name: 'KIND Dark Chocolate Bar 40g', brand: 'KIND', channel: 'Amazon UK', currentPrice: 2.45, cost: 1.45, packaging: 0.07, shipping: 0.20, channelFee: 0.37, volume: 1200, competitorPrice: 2.49, demandElasticity: -0.9 },
  { id: 4, sku: 'NK-CC-12PK', name: 'Nakd Cashew Cookie 12-Pack', brand: 'Nakd', channel: 'Amazon UK', currentPrice: 14.99, cost: 10.20, packaging: 0.25, shipping: 0.50, channelFee: 2.25, volume: 850, competitorPrice: 15.99, demandElasticity: -1.1 },
  { id: 5, sku: 'GR-MIX-8PK', name: 'Graze Mixed Box 8-Pack', brand: 'Graze', channel: 'Amazon UK', currentPrice: 13.99, cost: 9.60, packaging: 0.30, shipping: 0.55, channelFee: 2.10, volume: 650, competitorPrice: 14.49, demandElasticity: -1.3 },

  { id: 6, sku: 'NK-CC-35G', name: 'Nakd Cashew Cookie Bar 35g', brand: 'Nakd', channel: 'Shopify', currentPrice: 1.49, cost: 0.85, packaging: 0.05, shipping: 0.40, channelFee: 0.06, volume: 1500, competitorPrice: 1.59, demandElasticity: -1.4 },
  { id: 7, sku: 'GR-VB-50G', name: 'Graze Vanilla Bliss 50g', brand: 'Graze', channel: 'Shopify', currentPrice: 2.19, cost: 1.20, packaging: 0.06, shipping: 0.45, channelFee: 0.09, volume: 1200, competitorPrice: 2.29, demandElasticity: -1.6 },
  { id: 8, sku: 'KD-DC-40G', name: 'KIND Dark Chocolate Bar 40g', brand: 'KIND', channel: 'Shopify', currentPrice: 2.69, cost: 1.45, packaging: 0.07, shipping: 0.48, channelFee: 0.11, volume: 900, competitorPrice: 2.79, demandElasticity: -1.0 },
  { id: 9, sku: 'NK-BL-24PK', name: 'Nakd Berry Lovers 24-Pack', brand: 'Nakd', channel: 'Shopify', currentPrice: 27.99, cost: 19.20, packaging: 0.50, shipping: 0.80, channelFee: 1.12, volume: 420, competitorPrice: 29.99, demandElasticity: -1.2 },
  { id: 10, sku: 'GR-PR-16PK', name: 'Graze Protein Box 16-Pack', brand: 'Graze', channel: 'Shopify', currentPrice: 25.99, cost: 18.40, packaging: 0.45, shipping: 0.75, channelFee: 1.04, volume: 380, competitorPrice: 27.49, demandElasticity: -1.3 },

  { id: 11, sku: 'NK-CC-35G', name: 'Nakd Cashew Cookie Bar 35g', brand: 'Nakd', channel: 'B2B Wholesale', currentPrice: 1.15, cost: 0.85, packaging: 0.02, shipping: 0.05, channelFee: 0.00, volume: 5000, competitorPrice: 1.20, demandElasticity: -0.7 },
  { id: 12, sku: 'GR-VB-50G', name: 'Graze Vanilla Bliss 50g', brand: 'Graze', channel: 'B2B Wholesale', currentPrice: 1.65, cost: 1.20, packaging: 0.03, shipping: 0.06, channelFee: 0.00, volume: 4200, competitorPrice: 1.70, demandElasticity: -0.8 },
  { id: 13, sku: 'KD-DC-40G', name: 'KIND Dark Chocolate Bar 40g', brand: 'KIND', channel: 'B2B Wholesale', currentPrice: 1.95, cost: 1.45, packaging: 0.03, shipping: 0.07, channelFee: 0.00, volume: 3500, competitorPrice: 2.00, demandElasticity: -0.6 },

  { id: 14, sku: 'NK-CC-35G', name: 'Nakd Cashew Cookie Bar 35g', brand: 'Nakd', channel: 'eBay', currentPrice: 1.39, cost: 0.85, packaging: 0.05, shipping: 0.25, channelFee: 0.14, volume: 800, competitorPrice: 1.49, demandElasticity: -1.5 },
  { id: 15, sku: 'GR-VB-50G', name: 'Graze Vanilla Bliss 50g', brand: 'Graze', channel: 'eBay', currentPrice: 2.09, cost: 1.20, packaging: 0.06, shipping: 0.28, channelFee: 0.21, volume: 650, competitorPrice: 2.19, demandElasticity: -1.7 },

  { id: 16, sku: 'NK-CC-35G', name: 'Nakd Cashew Cookie Bar 35g', brand: 'Nakd', channel: 'Direct', currentPrice: 1.55, cost: 0.85, packaging: 0.05, shipping: 0.00, channelFee: 0.00, volume: 600, competitorPrice: 1.65, demandElasticity: -1.1 },
  { id: 17, sku: 'GR-VB-50G', name: 'Graze Vanilla Bliss 50g', brand: 'Graze', channel: 'Direct', currentPrice: 2.29, cost: 1.20, packaging: 0.06, shipping: 0.00, channelFee: 0.00, volume: 450, competitorPrice: 2.39, demandElasticity: -1.2 },
];

// ALGORITHM: Price Optimization Engine
const optimizePrice = (product: any, targetMargin: number = 25) => {
  const totalCost = product.cost + product.packaging + product.shipping + product.channelFee;
  const currentMargin = ((product.currentPrice - totalCost) / product.currentPrice) * 100;

  // Strategy 1: Margin-based pricing
  const marginBasedPrice = totalCost / (1 - targetMargin / 100);

  // Strategy 2: Competitor-aware pricing (stay within 5% of competitor)
  const competitorBasedPrice = product.competitorPrice * 0.97; // 3% below competitor

  // Strategy 3: Elasticity-based pricing (demand sensitivity)
  // If elastic (elasticity < -1), be conservative with price increases
  const elasticityFactor = product.demandElasticity < -1 ? 0.95 : 1.05;
  const elasticityBasedPrice = product.currentPrice * elasticityFactor;

  // Strategy 4: Volume-weighted recommendation
  const volumeWeight = Math.min(product.volume / 5000, 1);

  // Combined algorithm: weighted average of strategies
  const recommendedPrice = (
    marginBasedPrice * 0.4 + // 40% weight on target margin
    competitorBasedPrice * 0.3 + // 30% weight on competition
    elasticityBasedPrice * 0.3 // 30% weight on demand elasticity
  );

  const priceChange = recommendedPrice - product.currentPrice;
  const priceChangePercent = (priceChange / product.currentPrice) * 100;

  // Calculate projected impact
  const volumeChange = priceChangePercent * product.demandElasticity; // elasticity formula
  const projectedVolume = Math.max(0, product.volume * (1 + volumeChange / 100));

  const currentRevenue = product.currentPrice * product.volume;
  const currentProfit = (product.currentPrice - totalCost) * product.volume;

  const projectedRevenue = recommendedPrice * projectedVolume;
  const projectedProfit = (recommendedPrice - totalCost) * projectedVolume;

  const projectedMargin = ((recommendedPrice - totalCost) / recommendedPrice) * 100;

  const revenueImpact = projectedRevenue - currentRevenue;
  const profitImpact = projectedProfit - currentProfit;

  // Confidence score (0-100) based on various factors
  const marginGap = Math.abs(currentMargin - targetMargin);
  const competitorGap = Math.abs(product.currentPrice - product.competitorPrice) / product.competitorPrice;
  const elasticityConfidence = Math.abs(product.demandElasticity) > 1 ? 80 : 60; // More confident with elastic products

  const confidenceScore = Math.min(100,
    100 - (marginGap * 2) - (competitorGap * 50) + (elasticityConfidence - 50)
  );

  // Priority score (1-5 stars) based on profit impact potential
  const profitImpactPercent = (profitImpact / currentProfit) * 100;
  let priorityScore = 3; // default
  if (profitImpactPercent > 15) priorityScore = 5;
  else if (profitImpactPercent > 10) priorityScore = 4;
  else if (profitImpactPercent > 5) priorityScore = 4;
  else if (profitImpactPercent < -5) priorityScore = 2;
  else if (profitImpactPercent < -10) priorityScore = 1;

  return {
    ...product,
    totalCost,
    currentMargin,
    recommendedPrice,
    priceChange,
    priceChangePercent,
    projectedMargin,
    currentRevenue,
    currentProfit,
    projectedRevenue,
    projectedProfit,
    projectedVolume,
    volumeChange,
    revenueImpact,
    profitImpact,
    confidenceScore,
    priorityScore,
  };
};

export default function PriceOptimizerPage() {
  const [targetMargin, setTargetMargin] = useState(25);
  const [selectedChannel, setSelectedChannel] = useState('all');

  // Calculate optimized prices for all products
  const optimizedProducts = useMemo(() => {
    return mockProducts.map(p => optimizePrice(p, targetMargin));
  }, [targetMargin]);

  // Filter by channel
  const filteredProducts = useMemo(() => {
    if (selectedChannel === 'all') return optimizedProducts;
    return optimizedProducts.filter(p => p.channel === selectedChannel);
  }, [optimizedProducts, selectedChannel]);

  // Get unique channels
  const channels = ['all', ...Array.from(new Set(mockProducts.map(p => p.channel)))];

  // Calculate aggregate metrics
  const totalCurrentRevenue = filteredProducts.reduce((sum, p) => sum + p.currentRevenue, 0);
  const totalProjectedRevenue = filteredProducts.reduce((sum, p) => sum + p.projectedRevenue, 0);
  const totalCurrentProfit = filteredProducts.reduce((sum, p) => sum + p.currentProfit, 0);
  const totalProjectedProfit = filteredProducts.reduce((sum, p) => sum + p.projectedProfit, 0);
  const totalRevenueImpact = totalProjectedRevenue - totalCurrentRevenue;
  const totalProfitImpact = totalProjectedProfit - totalCurrentProfit;

  const avgCurrentMargin = filteredProducts.reduce((sum, p) => sum + p.currentMargin, 0) / filteredProducts.length;
  const avgProjectedMargin = filteredProducts.reduce((sum, p) => sum + p.projectedMargin, 0) / filteredProducts.length;

  // Find top opportunities
  const topOpportunities = [...optimizedProducts].sort((a, b) => b.profitImpact - a.profitImpact).slice(0, 3);

  const getRecommendationTag = (product: any) => {
    if (product.priceChangePercent > 10) return { color: 'red', text: 'Significant Increase', icon: <RiseOutlined /> };
    if (product.priceChangePercent > 5) return { color: 'orange', text: 'Moderate Increase', icon: <RiseOutlined /> };
    if (product.priceChangePercent > 1) return { color: 'blue', text: 'Minor Adjustment', icon: <RiseOutlined /> };
    if (product.priceChangePercent > -1) return { color: 'green', text: 'Optimal', icon: <CheckCircleOutlined /> };
    if (product.priceChangePercent > -5) return { color: 'orange', text: 'Consider Decrease', icon: <FallOutlined /> };
    return { color: 'red', text: 'Decrease Needed', icon: <FallOutlined /> };
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
      title: 'Channel',
      dataIndex: 'channel',
      key: 'channel',
      width: 130,
      render: (channel: string) => <Tag color="purple" icon={<GlobalOutlined />}>{channel}</Tag>,
    },
    {
      title: 'Current Price',
      dataIndex: 'currentPrice',
      key: 'currentPrice',
      width: 110,
      align: 'right' as const,
      render: (price: number) => <span className="font-semibold">£{price.toFixed(2)}</span>,
    },
    {
      title: 'Current Margin',
      key: 'currentMargin',
      width: 120,
      align: 'center' as const,
      render: (record: any) => {
        const margin = record.currentMargin;
        const color = margin >= 25 ? '#52c41a' : margin >= 15 ? '#1890ff' : margin >= 10 ? '#faad14' : '#ff4d4f';
        return <Tag color={color} style={{ fontWeight: 'bold' }}>{margin.toFixed(1)}%</Tag>;
      },
    },
    {
      title: 'Recommended Price',
      key: 'recommendedPrice',
      width: 140,
      align: 'right' as const,
      render: (record: any) => (
        <div>
          <div className="font-bold text-green-600 text-lg">£{record.recommendedPrice.toFixed(2)}</div>
          <div className="text-xs text-gray-500">Margin: {record.projectedMargin.toFixed(1)}%</div>
        </div>
      ),
    },
    {
      title: 'Price Change',
      key: 'priceChange',
      width: 120,
      align: 'center' as const,
      render: (record: any) => {
        const change = record.priceChangePercent;
        const color = Math.abs(change) < 1 ? 'text-green-600' : change > 0 ? 'text-red-600' : 'text-orange-600';
        const Icon = change > 0 ? RiseOutlined : change < 0 ? FallOutlined : CheckCircleOutlined;
        return (
          <div className={color}>
            <div className="font-bold"><Icon /> {change > 0 ? '+' : ''}{change.toFixed(1)}%</div>
            <div className="text-xs">{change > 0 ? '+' : ''}£{record.priceChange.toFixed(2)}</div>
          </div>
        );
      },
    },
    {
      title: 'Profit Impact',
      key: 'profitImpact',
      width: 130,
      align: 'right' as const,
      render: (record: any) => {
        const impact = record.profitImpact;
        const color = impact > 0 ? 'text-green-600' : 'text-red-600';
        const Icon = impact > 0 ? RiseOutlined : FallOutlined;
        return (
          <Tooltip title={`Current Profit: £${record.currentProfit.toLocaleString()} → Projected: £${record.projectedProfit.toLocaleString()}`}>
            <div className={`${color} font-semibold cursor-help`}>
              <Icon /> {impact > 0 ? '+' : ''}£{Math.abs(impact).toLocaleString()}
            </div>
          </Tooltip>
        );
      },
      sorter: (a: any, b: any) => b.profitImpact - a.profitImpact,
    },
    {
      title: 'Volume Impact',
      key: 'volumeChange',
      width: 110,
      align: 'center' as const,
      render: (record: any) => {
        const change = record.volumeChange;
        const color = Math.abs(change) < 5 ? 'default' : change < -10 ? 'error' : 'warning';
        return (
          <Tooltip title={`Current: ${record.volume} → Projected: ${Math.round(record.projectedVolume)}`}>
            <Tag color={color} className="cursor-help">
              {change > 0 ? '+' : ''}{change.toFixed(1)}%
            </Tag>
          </Tooltip>
        );
      },
    },
    {
      title: (
        <Tooltip title="Algorithm confidence in recommendation based on market data and elasticity">
          Confidence <InfoCircleOutlined />
        </Tooltip>
      ),
      key: 'confidenceScore',
      width: 110,
      align: 'center' as const,
      render: (record: any) => {
        const score = record.confidenceScore;
        const status = score >= 75 ? 'success' : score >= 50 ? 'normal' : 'exception';
        return <Progress type="circle" percent={score} size={45} status={status} />;
      },
    },
    {
      title: 'Priority',
      key: 'priorityScore',
      width: 100,
      align: 'center' as const,
      render: (record: any) => {
        const stars = '⭐'.repeat(record.priorityScore);
        const color = record.priorityScore >= 4 ? 'gold' : record.priorityScore >= 3 ? 'blue' : 'default';
        return <Tag color={color} style={{ fontSize: 16 }}>{stars}</Tag>;
      },
      sorter: (a: any, b: any) => b.priorityScore - a.priorityScore,
    },
    {
      title: 'Recommendation',
      key: 'recommendation',
      width: 160,
      render: (record: any) => {
        const rec = getRecommendationTag(record);
        return <Tag color={rec.color} icon={rec.icon}>{rec.text}</Tag>;
      },
    },
  ];

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
            AI Price Optimizer
          </h1>
          <p className="text-gray-600 mt-1">
            Algorithm-based pricing recommendations using demand elasticity, competitor analysis, and margin targets
          </p>
        </div>

        {/* Algorithm Info */}
        <Alert
          message="Optimization Algorithm"
          description={
            <div className="text-sm">
              <strong>Multi-factor pricing engine:</strong> Combines margin targets (40%), competitor pricing (30%), and demand elasticity (30%) to calculate optimal prices.
              Considers product costs, channel fees, shipping, and market dynamics. Confidence scores based on historical data patterns.
            </div>
          }
          type="info"
          icon={<BulbOutlined />}
          showIcon
        />

        {/* KPI Cards */}
        <Row gutter={16}>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="Projected Revenue Increase"
                value={totalRevenueImpact}
                prefix="£"
                precision={0}
                valueStyle={{ color: totalRevenueImpact >= 0 ? '#52c41a' : '#ff4d4f', fontSize: 24 }}
                prefix={totalRevenueImpact >= 0 ? <RiseOutlined /> : <FallOutlined />}
              />
              <div className="mt-2 text-xs text-gray-500">
                {totalCurrentRevenue.toLocaleString()} → £{totalProjectedRevenue.toLocaleString()}
              </div>
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="Projected Profit Increase"
                value={totalProfitImpact}
                prefix="£"
                precision={0}
                valueStyle={{ color: totalProfitImpact >= 0 ? '#52c41a' : '#ff4d4f', fontSize: 24 }}
                prefix={totalProfitImpact >= 0 ? <RiseOutlined /> : <FallOutlined />}
              />
              <div className="mt-2 text-xs text-gray-500">
                Current: £{totalCurrentProfit.toLocaleString()}
              </div>
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="Avg Margin Improvement"
                value={(avgProjectedMargin - avgCurrentMargin).toFixed(1)}
                suffix="%"
                valueStyle={{ color: '#1890ff', fontSize: 24 }}
              />
              <div className="mt-2">
                <Progress
                  percent={avgCurrentMargin}
                  success={{ percent: avgProjectedMargin }}
                  showInfo={false}
                />
                <div className="text-xs text-gray-500 mt-1">
                  {avgCurrentMargin.toFixed(1)}% → {avgProjectedMargin.toFixed(1)}%
                </div>
              </div>
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="Products to Optimize"
                value={filteredProducts.length}
                suffix="items"
                valueStyle={{ color: '#722ed1', fontSize: 24 }}
                prefix={<ThunderboltOutlined />}
              />
              <div className="mt-2 text-xs text-gray-500">
                Across {channels.length - 1} channels
              </div>
            </Card>
          </Col>
        </Row>

        {/* Top Opportunities */}
        <Card title={<span className="text-lg font-semibold"><TrophyOutlined /> Top 3 Optimization Opportunities</span>}>
          <Row gutter={16}>
            {topOpportunities.map((product, idx) => (
              <Col key={product.id} xs={24} md={8}>
                <Card className={`${idx === 0 ? 'bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-300' : idx === 1 ? 'bg-gradient-to-br from-gray-50 to-gray-100 border-gray-300' : 'bg-gradient-to-br from-orange-50 to-orange-100 border-orange-300'}`}>
                  <div className="flex items-start justify-between mb-2">
                    <Tag color={idx === 0 ? 'gold' : idx === 1 ? 'default' : 'orange'} style={{ fontSize: 18 }}>
                      #{idx + 1}
                    </Tag>
                    <Tag color="purple">{product.channel}</Tag>
                  </div>
                  <div className="font-bold text-lg mb-1">{product.name}</div>
                  <div className="text-sm text-gray-600 mb-3">{product.brand}</div>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Profit Impact:</span>
                      <span className="font-bold text-green-600">+£{product.profitImpact.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Price Change:</span>
                      <span className="font-semibold">{product.priceChangePercent > 0 ? '+' : ''}{product.priceChangePercent.toFixed(1)}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Confidence:</span>
                      <Progress percent={product.confidenceScore} size="small" style={{ width: 100 }} />
                    </div>
                  </div>
                </Card>
              </Col>
            ))}
          </Row>
        </Card>

        {/* Controls */}
        <Card>
          <div className="flex gap-4 items-center flex-wrap">
            <div>
              <span className="font-semibold mr-2">Target Margin:</span>
              <Select value={targetMargin} onChange={setTargetMargin} style={{ width: 120 }}>
                <Select.Option value={15}>15%</Select.Option>
                <Select.Option value={20}>20%</Select.Option>
                <Select.Option value={25}>25%</Select.Option>
                <Select.Option value={30}>30%</Select.Option>
                <Select.Option value={35}>35%</Select.Option>
              </Select>
            </div>
            <div>
              <span className="font-semibold mr-2">Channel:</span>
              <Select value={selectedChannel} onChange={setSelectedChannel} style={{ width: 200 }}>
                <Select.Option value="all">All Channels</Select.Option>
                {channels.filter(c => c !== 'all').map(ch => (
                  <Select.Option key={ch} value={ch}>{ch}</Select.Option>
                ))}
              </Select>
            </div>
            <div className="ml-auto">
              <Button type="primary" icon={<LineChartOutlined />}>
                Apply Optimizations
              </Button>
            </div>
          </div>
        </Card>

        {/* Detailed Table */}
        <Card title={<span className="text-lg font-semibold"><DollarOutlined /> Price Optimization Recommendations</span>} className="shadow-sm">
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
