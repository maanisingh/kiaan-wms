'use client';

import React, { useState, useMemo } from 'react';

import { Table, Card, Progress, Statistic, Row, Col, Tag, Space, Tooltip, Select, Alert, Button } from 'antd';
import {
  DollarOutlined,
  RiseOutlined,
  FallOutlined,
  WarningOutlined,
  CheckCircleOutlined,
  LineChartOutlined,
  PercentageOutlined,
  ThunderboltOutlined,
  TrophyOutlined,
  InfoCircleOutlined,
} from '@ant-design/icons';
import Link from 'next/link';

// Real product data with comprehensive cost breakdown
const mockProducts = [
  // High-margin products (>30%)
  { id: 1, sku: 'NK-CC-35G', name: 'Nakd Cashew Cookie Bar 35g', brand: 'Nakd', channel: 'Amazon UK', category: 'Snack Bars', sellingPrice: 1.45, productCost: 0.85, packaging: 0.05, shipping: 0.15, channelFee: 0.22, volume: 2500, returns: 25, returnRate: 1.0 },
  { id: 2, sku: 'GR-VB-50G', name: 'Graze Vanilla Bliss 50g', brand: 'Graze', channel: 'Amazon UK', category: 'Snack Bars', sellingPrice: 2.15, productCost: 1.20, packaging: 0.06, shipping: 0.18, channelFee: 0.32, volume: 1800, returns: 36, returnRate: 2.0 },
  { id: 3, sku: 'KD-DC-40G', name: 'KIND Dark Chocolate Bar 40g', brand: 'KIND', channel: 'Amazon UK', category: 'Snack Bars', sellingPrice: 2.49, productCost: 1.45, packaging: 0.07, shipping: 0.20, channelFee: 0.37, volume: 1200, returns: 12, returnRate: 1.0 },
  { id: 4, sku: 'NK-CC-12PK', name: 'Nakd Cashew Cookie 12-Pack', brand: 'Nakd', channel: 'Amazon UK', category: 'Multi-Packs', sellingPrice: 15.99, productCost: 10.20, packaging: 0.25, shipping: 0.50, channelFee: 2.40, volume: 850, returns: 17, returnRate: 2.0 },
  { id: 5, sku: 'GR-MIX-8PK', name: 'Graze Mixed Box 8-Pack', brand: 'Graze', channel: 'Amazon UK', category: 'Multi-Packs', sellingPrice: 14.49, productCost: 9.60, packaging: 0.30, shipping: 0.55, channelFee: 2.17, volume: 650, returns: 20, returnRate: 3.1 },

  // Medium-margin products (15-30%)
  { id: 6, sku: 'NK-CC-35G', name: 'Nakd Cashew Cookie Bar 35g', brand: 'Nakd', channel: 'Shopify', category: 'Snack Bars', sellingPrice: 1.59, productCost: 0.85, packaging: 0.05, shipping: 0.40, channelFee: 0.06, volume: 1500, returns: 15, returnRate: 1.0 },
  { id: 7, sku: 'GR-VB-50G', name: 'Graze Vanilla Bliss 50g', brand: 'Graze', channel: 'Shopify', category: 'Snack Bars', sellingPrice: 2.29, productCost: 1.20, packaging: 0.06, shipping: 0.45, channelFee: 0.09, volume: 1200, returns: 24, returnRate: 2.0 },
  { id: 8, sku: 'KD-DC-40G', name: 'KIND Dark Chocolate Bar 40g', brand: 'KIND', channel: 'Shopify', category: 'Snack Bars', sellingPrice: 2.59, productCost: 1.45, packaging: 0.07, shipping: 0.42, channelFee: 0.10, volume: 900, returns: 18, returnRate: 2.0 },
  { id: 9, sku: 'NK-CC-24PK', name: 'Nakd Cashew Cookie 24-Pack', brand: 'Nakd', channel: 'B2B Wholesale', category: 'Bulk', sellingPrice: 28.99, productCost: 20.40, packaging: 0.40, shipping: 0.80, channelFee: 0.00, volume: 450, returns: 5, returnRate: 1.1 },
  { id: 10, sku: 'GR-MIX-24PK', name: 'Graze Mixed Box 24-Pack', brand: 'Graze', channel: 'B2B Wholesale', category: 'Bulk', sellingPrice: 39.99, productCost: 28.80, packaging: 0.50, shipping: 1.00, channelFee: 0.00, volume: 320, returns: 6, returnRate: 1.9 },

  // Lower-margin products (10-15%)
  { id: 11, sku: 'NK-CC-35G', name: 'Nakd Cashew Cookie Bar 35g', brand: 'Nakd', channel: 'eBay', category: 'Snack Bars', sellingPrice: 1.39, productCost: 0.85, packaging: 0.05, shipping: 0.35, channelFee: 0.14, volume: 800, returns: 16, returnRate: 2.0 },
  { id: 12, sku: 'GR-VB-50G', name: 'Graze Vanilla Bliss 50g', brand: 'Graze', channel: 'eBay', category: 'Snack Bars', sellingPrice: 2.09, productCost: 1.20, packaging: 0.06, shipping: 0.38, channelFee: 0.21, volume: 650, returns: 19, returnRate: 2.9 },
  { id: 13, sku: 'NK-BP-12PK', name: 'Nakd Berry Protein 12-Pack', brand: 'Nakd', channel: 'Amazon UK', category: 'Multi-Packs', sellingPrice: 16.99, productCost: 11.50, packaging: 0.25, shipping: 0.50, channelFee: 2.55, volume: 420, returns: 13, returnRate: 3.1 },
  { id: 14, sku: 'KD-AB-12PK', name: 'KIND Almond Butter 12-Pack', brand: 'KIND', channel: 'Amazon UK', category: 'Multi-Packs', sellingPrice: 18.99, productCost: 13.20, packaging: 0.28, shipping: 0.52, channelFee: 2.85, volume: 380, returns: 8, returnRate: 2.1 },

  // Poor-margin products (<10% - need attention)
  { id: 15, sku: 'GR-SP-6PK', name: 'Graze Sharing Pack 6-Pack', brand: 'Graze', channel: 'eBay', category: 'Multi-Packs', sellingPrice: 11.99, productCost: 9.00, packaging: 0.20, shipping: 0.60, channelFee: 1.20, volume: 280, returns: 14, returnRate: 5.0 },
  { id: 16, sku: 'NK-CC-6PK', name: 'Nakd Cashew Cookie 6-Pack', brand: 'Nakd', channel: 'eBay', category: 'Multi-Packs', sellingPrice: 7.99, productCost: 5.10, packaging: 0.15, shipping: 0.45, channelFee: 0.80, volume: 350, returns: 21, returnRate: 6.0 },
  { id: 17, sku: 'KD-MX-6PK', name: 'KIND Mixed Nuts 6-Pack', brand: 'KIND', channel: 'Direct', category: 'Multi-Packs', sellingPrice: 8.99, productCost: 6.30, packaging: 0.18, shipping: 0.85, channelFee: 0.00, volume: 220, returns: 11, returnRate: 5.0 },
  { id: 18, sku: 'GR-NT-4PK', name: 'Graze Nut Mix 4-Pack', brand: 'Graze', channel: 'Direct', category: 'Multi-Packs', sellingPrice: 6.49, productCost: 4.50, packaging: 0.12, shipping: 0.75, channelFee: 0.00, volume: 180, returns: 9, returnRate: 5.0 },
];

export default function MarginAnalysisPage() {
  const [selectedChannel, setSelectedChannel] = useState<string>('All Channels');
  const [selectedCategory, setSelectedCategory] = useState<string>('All Categories');

  // Calculate comprehensive margin metrics
  const productsWithMetrics = useMemo(() => {
    return mockProducts.map(product => {
      // Total cost breakdown
      const totalCost = product.productCost + product.packaging + product.shipping + product.channelFee;

      // Gross profit and margin
      const grossProfit = product.sellingPrice - totalCost;
      const profitMargin = (grossProfit / product.sellingPrice) * 100;

      // Revenue and profit calculations
      const totalRevenue = product.sellingPrice * product.volume;
      const totalProfit = grossProfit * product.volume;

      // Return impact
      const returnCost = (product.sellingPrice + (product.shipping * 0.5)) * product.returns; // Returns cost includes partial shipping
      const netProfit = totalProfit - returnCost;
      const netMargin = (netProfit / totalRevenue) * 100;

      // Cost structure analysis
      const costStructure = {
        productCostPercent: (product.productCost / product.sellingPrice) * 100,
        packagingPercent: (product.packaging / product.sellingPrice) * 100,
        shippingPercent: (product.shipping / product.sellingPrice) * 100,
        channelFeePercent: (product.channelFee / product.sellingPrice) * 100,
      };

      // Margin health score (0-100)
      // Algorithm: Base on margin (60%), volume impact (20%), return rate (20%)
      const marginScore = Math.min(100, (profitMargin / 35) * 60); // 35% is excellent margin
      const volumeScore = Math.min(20, (product.volume / 2000) * 20); // 2000 units is high volume
      const returnScore = Math.max(0, 20 - (product.returnRate * 4)); // Lower returns = better score
      const healthScore = marginScore + volumeScore + returnScore;

      // Improvement potential
      const targetMargin = 25; // Industry target
      const marginGap = targetMargin - profitMargin;
      const potentialProfit = (marginGap / 100) * totalRevenue;

      // Performance grade
      let grade = 'D';
      if (profitMargin >= 30) grade = 'A';
      else if (profitMargin >= 20) grade = 'B';
      else if (profitMargin >= 15) grade = 'C';

      return {
        ...product,
        totalCost,
        grossProfit,
        profitMargin,
        totalRevenue,
        totalProfit,
        returnCost,
        netProfit,
        netMargin,
        costStructure,
        healthScore,
        potentialProfit,
        grade,
      };
    });
  }, []);

  // Filter products
  const filteredProducts = useMemo(() => {
    return productsWithMetrics.filter(p => {
      const channelMatch = selectedChannel === 'All Channels' || p.channel === selectedChannel;
      const categoryMatch = selectedCategory === 'All Categories' || p.category === selectedCategory;
      return channelMatch && categoryMatch;
    });
  }, [productsWithMetrics, selectedChannel, selectedCategory]);

  // Calculate aggregate KPIs
  const kpis = useMemo(() => {
    const totalRevenue = filteredProducts.reduce((sum, p) => sum + p.totalRevenue, 0);
    const totalProfit = filteredProducts.reduce((sum, p) => sum + p.totalProfit, 0);
    const totalNetProfit = filteredProducts.reduce((sum, p) => sum + p.netProfit, 0);
    const avgMargin = filteredProducts.length > 0
      ? filteredProducts.reduce((sum, p) => sum + p.profitMargin, 0) / filteredProducts.length
      : 0;
    const avgNetMargin = filteredProducts.length > 0
      ? filteredProducts.reduce((sum, p) => sum + p.netMargin, 0) / filteredProducts.length
      : 0;

    const highMarginCount = filteredProducts.filter(p => p.profitMargin >= 20).length;
    const poorMarginCount = filteredProducts.filter(p => p.profitMargin < 10).length;
    const totalPotentialProfit = filteredProducts.filter(p => p.potentialProfit > 0).reduce((sum, p) => sum + p.potentialProfit, 0);

    const avgHealthScore = filteredProducts.length > 0
      ? filteredProducts.reduce((sum, p) => sum + p.healthScore, 0) / filteredProducts.length
      : 0;

    return {
      totalRevenue,
      totalProfit,
      totalNetProfit,
      avgMargin,
      avgNetMargin,
      highMarginCount,
      poorMarginCount,
      totalPotentialProfit,
      avgHealthScore,
    };
  }, [filteredProducts]);

  // Top and bottom performers
  const topPerformers = [...filteredProducts].sort((a, b) => b.netProfit - a.netProfit).slice(0, 3);
  const bottomPerformers = [...filteredProducts].sort((a, b) => a.profitMargin - b.profitMargin).slice(0, 3);

  const channels = ['All Channels', ...Array.from(new Set(mockProducts.map(p => p.channel)))];
  const categories = ['All Categories', ...Array.from(new Set(mockProducts.map(p => p.category)))];

  const columns = [
    {
      title: 'Product',
      dataIndex: 'name',
      key: 'product',
      width: 280,
      render: (text: string, record: any) => (
        <div>
          <div className="font-semibold">{text}</div>
          <div className="text-xs text-gray-500">{record.sku} • {record.brand}</div>
        </div>
      ),
    },
    {
      title: 'Channel',
      dataIndex: 'channel',
      key: 'channel',
      width: 140,
      render: (channel: string) => (
        <Tag color={channel === 'Amazon UK' ? 'orange' : channel === 'Shopify' ? 'green' : channel === 'B2B Wholesale' ? 'blue' : 'default'}>
          {channel}
        </Tag>
      ),
    },
    {
      title: 'Grade',
      dataIndex: 'grade',
      key: 'grade',
      width: 80,
      render: (grade: string) => (
        <Tag color={grade === 'A' ? 'green' : grade === 'B' ? 'blue' : grade === 'C' ? 'orange' : 'red'} style={{ fontSize: 16, fontWeight: 'bold' }}>
          {grade}
        </Tag>
      ),
    },
    {
      title: 'Selling Price',
      dataIndex: 'sellingPrice',
      key: 'sellingPrice',
      width: 110,
      render: (price: number) => <span className="font-semibold">£{price.toFixed(2)}</span>,
    },
    {
      title: 'Total Cost',
      dataIndex: 'totalCost',
      key: 'totalCost',
      width: 110,
      render: (cost: number) => <span className="text-red-600">£{cost.toFixed(2)}</span>,
    },
    {
      title: 'Gross Profit',
      dataIndex: 'grossProfit',
      key: 'grossProfit',
      width: 110,
      render: (profit: number) => (
        <span className={profit > 0 ? 'text-green-600 font-semibold' : 'text-red-600'}>
          £{profit.toFixed(2)}
        </span>
      ),
    },
    {
      title: 'Gross Margin',
      dataIndex: 'profitMargin',
      key: 'profitMargin',
      width: 180,
      render: (margin: number) => (
        <div>
          <Progress
            percent={Math.min(100, margin)}
            strokeColor={margin >= 30 ? '#52c41a' : margin >= 20 ? '#1890ff' : margin >= 10 ? '#faad14' : '#f5222d'}
            format={(percent) => `${margin.toFixed(1)}%`}
            size="small"
          />
        </div>
      ),
    },
    {
      title: (
        <Tooltip title="Margin after accounting for returns">
          Net Margin <InfoCircleOutlined className="ml-1" />
        </Tooltip>
      ),
      dataIndex: 'netMargin',
      key: 'netMargin',
      width: 100,
      render: (margin: number) => (
        <span className={margin >= 20 ? 'text-green-600 font-semibold' : margin >= 10 ? 'text-orange-600' : 'text-red-600'}>
          {margin.toFixed(1)}%
        </span>
      ),
    },
    {
      title: 'Volume',
      dataIndex: 'volume',
      key: 'volume',
      width: 90,
      render: (volume: number) => volume.toLocaleString(),
    },
    {
      title: 'Total Revenue',
      dataIndex: 'totalRevenue',
      key: 'totalRevenue',
      width: 120,
      render: (revenue: number) => <span className="font-semibold">£{revenue.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>,
    },
    {
      title: 'Net Profit',
      dataIndex: 'netProfit',
      key: 'netProfit',
      width: 120,
      render: (profit: number) => (
        <span className={profit > 0 ? 'text-green-600 font-semibold' : 'text-red-600 font-semibold'}>
          £{profit.toLocaleString(undefined, { maximumFractionDigits: 0 })}
        </span>
      ),
    },
    {
      title: (
        <Tooltip title="Overall profitability health (0-100 scale)">
          Health Score <InfoCircleOutlined className="ml-1" />
        </Tooltip>
      ),
      dataIndex: 'healthScore',
      key: 'healthScore',
      width: 120,
      render: (score: number) => (
        <div>
          <Progress
            percent={score}
            strokeColor={score >= 70 ? '#52c41a' : score >= 50 ? '#faad14' : '#f5222d'}
            size="small"
          />
        </div>
      ),
    },
  ];

  return (
    <div className="p-6 space-y-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <PercentageOutlined className="text-blue-600" />
              Margin Analysis
            </h1>
            <p className="text-gray-600 mt-2">
              Comprehensive profitability analysis with cost breakdown and optimization opportunities
            </p>
          </div>
          <Space>
            <Select
              value={selectedChannel}
              onChange={setSelectedChannel}
              style={{ width: 180 }}
              options={channels.map(c => ({ label: c, value: c }))}
            />
            <Select
              value={selectedCategory}
              onChange={setSelectedCategory}
              style={{ width: 180 }}
              options={categories.map(c => ({ label: c, value: c }))}
            />
          </Space>
        </div>

        {/* Key Performance Indicators */}
        <Row gutter={16}>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="Average Gross Margin"
                value={kpis.avgMargin.toFixed(1)}
                suffix="%"
                prefix={<PercentageOutlined />}
                valueStyle={{ color: kpis.avgMargin >= 20 ? '#3f8600' : kpis.avgMargin >= 10 ? '#fa8c16' : '#cf1322' }}
              />
              <div className="text-xs text-gray-500 mt-2">
                Target: 25% | Net: {kpis.avgNetMargin.toFixed(1)}%
              </div>
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="Total Net Profit"
                value={kpis.totalNetProfit.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                prefix="£"
                valueStyle={{ color: '#3f8600' }}
              />
              <div className="text-xs text-gray-500 mt-2">
                Revenue: £{kpis.totalRevenue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </div>
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="Average Health Score"
                value={kpis.avgHealthScore.toFixed(0)}
                suffix="/ 100"
                prefix={<ThunderboltOutlined />}
                valueStyle={{ color: kpis.avgHealthScore >= 70 ? '#3f8600' : kpis.avgHealthScore >= 50 ? '#fa8c16' : '#cf1322' }}
              />
              <Progress
                percent={kpis.avgHealthScore}
                strokeColor={kpis.avgHealthScore >= 70 ? '#52c41a' : kpis.avgHealthScore >= 50 ? '#faad14' : '#f5222d'}
                showInfo={false}
                size="small"
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="Improvement Potential"
                value={kpis.totalPotentialProfit.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                prefix="£"
                valueStyle={{ color: '#1890ff' }}
              />
              <div className="text-xs text-gray-500 mt-2">
                {kpis.poorMarginCount} products need attention
              </div>
            </Card>
          </Col>
        </Row>

        {/* Performance Alerts */}
        {kpis.poorMarginCount > 0 && (
          <Alert
            message="Low Margin Alert"
            description={`${kpis.poorMarginCount} products have margins below 10%. These require immediate attention to improve profitability.`}
            type="warning"
            icon={<WarningOutlined />}
            showIcon
            closable
          />
        )}

        {/* Top & Bottom Performers */}
        <Row gutter={16}>
          <Col xs={24} lg={12}>
            <Card
              title={
                <span className="flex items-center gap-2">
                  <TrophyOutlined className="text-green-600" /> Top 3 Profit Generators
                </span>
              }
            >
              <Space direction="vertical" style={{ width: '100%' }}>
                {topPerformers.map((product, index) => (
                  <Card key={product.id} size="small" className="bg-green-50">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="font-semibold">
                          {index + 1}. {product.name}
                        </div>
                        <div className="text-xs text-gray-600">{product.channel} • {product.sku}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-green-600 font-bold">£{product.netProfit.toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
                        <div className="text-xs text-gray-600">{product.netMargin.toFixed(1)}% margin</div>
                      </div>
                    </div>
                  </Card>
                ))}
              </Space>
            </Card>
          </Col>

          <Col xs={24} lg={12}>
            <Card
              title={
                <span className="flex items-center gap-2">
                  <WarningOutlined className="text-red-600" /> Bottom 3 Margins (Need Attention)
                </span>
              }
            >
              <Space direction="vertical" style={{ width: '100%' }}>
                {bottomPerformers.map((product, index) => (
                  <Card key={product.id} size="small" className="bg-red-50">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="font-semibold">
                          {index + 1}. {product.name}
                        </div>
                        <div className="text-xs text-gray-600">{product.channel} • {product.sku}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-red-600 font-bold">{product.profitMargin.toFixed(1)}%</div>
                        <div className="text-xs text-gray-600">
                          {product.potentialProfit > 0
                            ? `+£${product.potentialProfit.toLocaleString(undefined, { maximumFractionDigits: 0 })} potential`
                            : 'At target'}
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </Space>
            </Card>
          </Col>
        </Row>

        {/* Detailed Margin Table */}
        <Card
          title={
            <span className="flex items-center gap-2">
              <LineChartOutlined /> Product Margin Details
            </span>
          }
          extra={
            <Space>
              <span className="text-sm text-gray-600">
                {filteredProducts.length} products • £{kpis.totalRevenue.toLocaleString(undefined, { maximumFractionDigits: 0 })} revenue
              </span>
            </Space>
          }
        >
          <Table
            dataSource={filteredProducts}
            columns={columns}
            rowKey="id"
            pagination={{ pageSize: 20, showSizeChanger: true, showTotal: (total) => `Total ${total} products` }}
            scroll={{ x: 1600 }}
          />
        </Card>
      </div>
      );
}
