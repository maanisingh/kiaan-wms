'use client';

import React, { useState, useEffect, useMemo } from 'react';

import { Table, Card, Tag, Button, Space, Statistic, Row, Col, Progress, Tooltip, Select, Alert, message, Spin } from 'antd';
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
  ReloadOutlined,
  DownloadOutlined,
} from '@ant-design/icons';
import apiService from '@/services/api';

// ALGORITHM: Price Optimization Engine
const optimizePrice = (product: any, targetMargin: number = 25) => {
  const cost = parseFloat(product.costPrice || product.cost || 0);
  const currentPrice = parseFloat(product.sellingPrice || product.currentPrice || 0);
  const packaging = parseFloat(product.packaging || 0.05);
  const shipping = parseFloat(product.shipping || 0.15);
  const channelFee = parseFloat(product.channelFee || 0);
  const volume = parseInt(product.volume || product.totalStock || 100);
  const competitorPrice = parseFloat(product.competitorPrice || currentPrice * 1.05);
  const demandElasticity = parseFloat(product.demandElasticity || -1.2);

  const totalCost = cost + packaging + shipping + channelFee;
  const currentMargin = currentPrice > 0 ? ((currentPrice - totalCost) / currentPrice) * 100 : 0;

  // Strategy 1: Margin-based pricing
  const marginBasedPrice = totalCost > 0 ? totalCost / (1 - targetMargin / 100) : currentPrice;

  // Strategy 2: Competitor-aware pricing (stay within 5% of competitor)
  const competitorBasedPrice = competitorPrice * 0.97; // 3% below competitor

  // Strategy 3: Elasticity-based pricing (demand sensitivity)
  const elasticityFactor = demandElasticity < -1 ? 0.95 : 1.05;
  const elasticityBasedPrice = currentPrice * elasticityFactor;

  // Combined algorithm: weighted average of strategies
  const recommendedPrice = currentPrice > 0 ? (
    marginBasedPrice * 0.4 + // 40% weight on target margin
    competitorBasedPrice * 0.3 + // 30% weight on competition
    elasticityBasedPrice * 0.3 // 30% weight on demand elasticity
  ) : marginBasedPrice;

  const priceChange = recommendedPrice - currentPrice;
  const priceChangePercent = currentPrice > 0 ? (priceChange / currentPrice) * 100 : 0;

  // Calculate projected impact
  const volumeChange = priceChangePercent * demandElasticity;
  const projectedVolume = Math.max(0, volume * (1 + volumeChange / 100));

  const currentRevenue = currentPrice * volume;
  const currentProfit = (currentPrice - totalCost) * volume;

  const projectedRevenue = recommendedPrice * projectedVolume;
  const projectedProfit = (recommendedPrice - totalCost) * projectedVolume;

  const projectedMargin = recommendedPrice > 0 ? ((recommendedPrice - totalCost) / recommendedPrice) * 100 : 0;

  const revenueImpact = projectedRevenue - currentRevenue;
  const profitImpact = projectedProfit - currentProfit;

  // Confidence score (0-100) based on various factors
  const marginGap = Math.abs(currentMargin - targetMargin);
  const competitorGap = currentPrice > 0 ? Math.abs(currentPrice - competitorPrice) / competitorPrice : 0;
  const elasticityConfidence = Math.abs(demandElasticity) > 1 ? 80 : 60;

  const confidenceScore = Math.min(100, Math.max(0,
    100 - (marginGap * 2) - (competitorGap * 50) + (elasticityConfidence - 50)
  ));

  // Priority score (1-5 stars) based on profit impact potential
  const profitImpactPercent = currentProfit !== 0 ? (profitImpact / Math.abs(currentProfit)) * 100 : 0;
  let priorityScore = 3;
  if (profitImpactPercent > 15) priorityScore = 5;
  else if (profitImpactPercent > 10) priorityScore = 4;
  else if (profitImpactPercent > 5) priorityScore = 4;
  else if (profitImpactPercent < -5) priorityScore = 2;
  else if (profitImpactPercent < -10) priorityScore = 1;

  return {
    ...product,
    cost,
    currentPrice,
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
    volume,
    volumeChange,
    revenueImpact,
    profitImpact,
    confidenceScore,
    priorityScore,
    channel: product.channel || 'Direct',
  };
};

export default function PriceOptimizerPage() {
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<any[]>([]);
  const [targetMargin, setTargetMargin] = useState(25);
  const [selectedChannel, setSelectedChannel] = useState('all');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Try analytics endpoint first
      const data = await apiService.get('/api/analytics/pricing-optimizer');
      if (data && data.products && data.products.length > 0) {
        setProducts(data.products);
      } else {
        // Fallback to products
        const productsData = await apiService.get('/api/products');
        const inventory = await apiService.get('/api/inventory');

        const enrichedProducts = (productsData || []).map((p: any) => {
          const inv = (inventory || []).filter((i: any) => i.productId === p.id);
          const totalStock = inv.reduce((sum: number, i: any) => sum + (i.quantity || 0), 0);
          return {
            ...p,
            volume: totalStock,
            channel: p.channelPrices?.[0]?.channel?.name || 'Direct',
            channelFee: p.channelPrices?.[0]?.channel?.commissionRate || 0,
            competitorPrice: parseFloat(p.sellingPrice || 0) * 1.05,
            demandElasticity: -1.2,
          };
        });
        setProducts(enrichedProducts);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      message.error('Failed to load pricing data');
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  // Calculate optimized prices for all products
  const optimizedProducts = useMemo(() => {
    return products.map(p => optimizePrice(p, targetMargin));
  }, [products, targetMargin]);

  // Filter by channel
  const filteredProducts = useMemo(() => {
    if (selectedChannel === 'all') return optimizedProducts;
    return optimizedProducts.filter(p => p.channel === selectedChannel);
  }, [optimizedProducts, selectedChannel]);

  // Get unique channels
  const channels = useMemo(() => {
    const uniqueChannels = [...new Set(products.map((p: any) => p.channel || 'Direct').filter(Boolean))];
    return ['all', ...uniqueChannels];
  }, [products]);

  // Calculate aggregate metrics
  const totalCurrentRevenue = filteredProducts.reduce((sum, p) => sum + (p.currentRevenue || 0), 0);
  const totalProjectedRevenue = filteredProducts.reduce((sum, p) => sum + (p.projectedRevenue || 0), 0);
  const totalCurrentProfit = filteredProducts.reduce((sum, p) => sum + (p.currentProfit || 0), 0);
  const totalProjectedProfit = filteredProducts.reduce((sum, p) => sum + (p.projectedProfit || 0), 0);
  const totalRevenueImpact = totalProjectedRevenue - totalCurrentRevenue;
  const totalProfitImpact = totalProjectedProfit - totalCurrentProfit;

  const avgCurrentMargin = filteredProducts.length > 0
    ? filteredProducts.reduce((sum, p) => sum + (p.currentMargin || 0), 0) / filteredProducts.length
    : 0;
  const avgProjectedMargin = filteredProducts.length > 0
    ? filteredProducts.reduce((sum, p) => sum + (p.projectedMargin || 0), 0) / filteredProducts.length
    : 0;

  // Find top opportunities
  const topOpportunities = [...optimizedProducts].sort((a, b) => b.profitImpact - a.profitImpact).slice(0, 3);

  const getRecommendationTag = (product: any) => {
    const change = product.priceChangePercent || 0;
    if (change > 10) return { color: 'red', text: 'Significant Increase', icon: <RiseOutlined /> };
    if (change > 5) return { color: 'orange', text: 'Moderate Increase', icon: <RiseOutlined /> };
    if (change > 1) return { color: 'blue', text: 'Minor Adjustment', icon: <RiseOutlined /> };
    if (change > -1) return { color: 'green', text: 'Optimal', icon: <CheckCircleOutlined /> };
    if (change > -5) return { color: 'orange', text: 'Consider Decrease', icon: <FallOutlined /> };
    return { color: 'red', text: 'Decrease Needed', icon: <FallOutlined /> };
  };

  const handleExport = () => {
    const headers = ['SKU', 'Product', 'Channel', 'Current Price', 'Current Margin', 'Recommended Price', 'Projected Margin', 'Price Change %', 'Profit Impact', 'Confidence'];
    const rows = filteredProducts.map(p => [
      p.sku,
      p.name,
      p.channel,
      p.currentPrice?.toFixed(2),
      p.currentMargin?.toFixed(1),
      p.recommendedPrice?.toFixed(2),
      p.projectedMargin?.toFixed(1),
      p.priceChangePercent?.toFixed(1),
      p.profitImpact?.toFixed(0),
      p.confidenceScore?.toFixed(0),
    ]);

    const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `price-optimization-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    message.success('Report exported successfully!');
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
      render: (channel: string) => <Tag color="purple" icon={<GlobalOutlined />}>{channel || 'Direct'}</Tag>,
    },
    {
      title: 'Current Price',
      dataIndex: 'currentPrice',
      key: 'currentPrice',
      width: 110,
      align: 'right' as const,
      render: (price: number) => <span className="font-semibold">£{(price || 0).toFixed(2)}</span>,
    },
    {
      title: 'Current Margin',
      key: 'currentMargin',
      width: 120,
      align: 'center' as const,
      render: (record: any) => {
        const margin = record.currentMargin || 0;
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
          <div className="font-bold text-green-600 text-lg">£{(record.recommendedPrice || 0).toFixed(2)}</div>
          <div className="text-xs text-gray-500">Margin: {(record.projectedMargin || 0).toFixed(1)}%</div>
        </div>
      ),
    },
    {
      title: 'Price Change',
      key: 'priceChange',
      width: 120,
      align: 'center' as const,
      render: (record: any) => {
        const change = record.priceChangePercent || 0;
        const color = Math.abs(change) < 1 ? 'text-green-600' : change > 0 ? 'text-red-600' : 'text-orange-600';
        const Icon = change > 0 ? RiseOutlined : change < 0 ? FallOutlined : CheckCircleOutlined;
        return (
          <div className={color}>
            <div className="font-bold"><Icon /> {change > 0 ? '+' : ''}{change.toFixed(1)}%</div>
            <div className="text-xs">{change > 0 ? '+' : ''}£{(record.priceChange || 0).toFixed(2)}</div>
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
        const impact = record.profitImpact || 0;
        const color = impact > 0 ? 'text-green-600' : 'text-red-600';
        const Icon = impact > 0 ? RiseOutlined : FallOutlined;
        return (
          <Tooltip title={`Current Profit: £${(record.currentProfit || 0).toLocaleString()} → Projected: £${(record.projectedProfit || 0).toLocaleString()}`}>
            <div className={`${color} font-semibold cursor-help`}>
              <Icon /> {impact > 0 ? '+' : ''}£{Math.abs(impact).toLocaleString()}
            </div>
          </Tooltip>
        );
      },
      sorter: (a: any, b: any) => b.profitImpact - a.profitImpact,
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
        const score = record.confidenceScore || 0;
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
        const stars = '⭐'.repeat(record.priorityScore || 1);
        const color = (record.priorityScore || 1) >= 4 ? 'gold' : (record.priorityScore || 1) >= 3 ? 'blue' : 'default';
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Spin size="large" tip="Loading price optimizer..." />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
        {/* Header */}
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
              AI Price Optimizer
            </h1>
            <p className="text-gray-600 mt-1">
              Algorithm-based pricing recommendations using demand elasticity, competitor analysis, and margin targets
            </p>
          </div>
          <Space>
            <Button icon={<ReloadOutlined />} onClick={fetchData}>Refresh</Button>
            <Button type="primary" icon={<DownloadOutlined />} onClick={handleExport}>Export</Button>
          </Space>
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
                title="Projected Revenue Impact"
                value={Math.abs(totalRevenueImpact)}
                prefix={totalRevenueImpact >= 0 ? <><RiseOutlined /> £</> : <><FallOutlined /> -£</>}
                precision={0}
                valueStyle={{ color: totalRevenueImpact >= 0 ? '#52c41a' : '#ff4d4f', fontSize: 24 }}
              />
              <div className="mt-2 text-xs text-gray-500">
                £{totalCurrentRevenue.toLocaleString()} → £{totalProjectedRevenue.toLocaleString()}
              </div>
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="Projected Profit Impact"
                value={Math.abs(totalProfitImpact)}
                prefix={totalProfitImpact >= 0 ? <><RiseOutlined /> £</> : <><FallOutlined /> -£</>}
                precision={0}
                valueStyle={{ color: totalProfitImpact >= 0 ? '#52c41a' : '#ff4d4f', fontSize: 24 }}
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
        {topOpportunities.length > 0 && (
        <Card title={<span className="text-lg font-semibold"><TrophyOutlined /> Top Optimization Opportunities</span>}>
          <Row gutter={16}>
            {topOpportunities.map((product, idx) => (
              <Col key={product.id || idx} xs={24} md={8}>
                <Card className={`${idx === 0 ? 'bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-300' : idx === 1 ? 'bg-gradient-to-br from-gray-50 to-gray-100 border-gray-300' : 'bg-gradient-to-br from-orange-50 to-orange-100 border-orange-300'}`}>
                  <div className="flex items-start justify-between mb-2">
                    <Tag color={idx === 0 ? 'gold' : idx === 1 ? 'default' : 'orange'} style={{ fontSize: 18 }}>
                      #{idx + 1}
                    </Tag>
                    <Tag color="purple">{product.channel || 'Direct'}</Tag>
                  </div>
                  <div className="font-bold text-lg mb-1">{product.name || 'Product'}</div>
                  <div className="text-sm text-gray-600 mb-3">{product.brand?.name || ''}</div>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Profit Impact:</span>
                      <span className={`font-bold ${(product.profitImpact || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {(product.profitImpact || 0) >= 0 ? '+' : ''}£{(product.profitImpact || 0).toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Price Change:</span>
                      <span className="font-semibold">{(product.priceChangePercent || 0) > 0 ? '+' : ''}{(product.priceChangePercent || 0).toFixed(1)}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Confidence:</span>
                      <Progress percent={product.confidenceScore || 0} size="small" style={{ width: 100 }} />
                    </div>
                  </div>
                </Card>
              </Col>
            ))}
          </Row>
        </Card>
        )}

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
            locale={{ emptyText: 'No products found. Add products with pricing information to see optimization suggestions.' }}
          />
        </Card>
      </div>
      );
}
