'use client';

import React, { useState, useEffect, useMemo } from 'react';

import { Table, Card, Select, Tag, Statistic, Row, Col, Space, Progress, Tooltip, Button, message, Spin } from 'antd';
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
  DownloadOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import apiService from '@/services/api';

// Algorithm: Calculate comprehensive pricing metrics
const calculateMetrics = (product: any) => {
  const cost = parseFloat(product.costPrice || product.cost || 0);
  const sellingPrice = parseFloat(product.sellingPrice || 0);
  const packaging = parseFloat(product.packaging || 0.05);
  const shipping = parseFloat(product.shipping || 0.15);
  const channelFee = parseFloat(product.channelFee || 0);
  const volume = parseInt(product.volume || product.totalStock || 0);

  const totalCost = cost + packaging + shipping + channelFee;
  const grossProfit = sellingPrice - totalCost;
  const profitMargin = sellingPrice > 0 ? (grossProfit / sellingPrice) * 100 : 0;
  const markup = totalCost > 0 ? (grossProfit / totalCost) * 100 : 0;
  const roi = totalCost > 0 ? (grossProfit / totalCost) * 100 : 0;
  const totalRevenue = sellingPrice * volume;
  const totalProfit = grossProfit * volume;
  const contributionMargin = sellingPrice > 0 ? ((sellingPrice - cost) / sellingPrice) * 100 : 0;

  // Performance score algorithm (0-100)
  const volumeScore = Math.min((volume / 5000) * 30, 30);
  const marginScore = Math.min((profitMargin / 50) * 40, 40);
  const revenueScore = Math.min((totalRevenue / 50000) * 30, 30);
  const performanceScore = volumeScore + marginScore + revenueScore;

  return {
    ...product,
    cost,
    sellingPrice,
    packaging,
    shipping,
    channelFee,
    volume,
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
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<any[]>([]);
  const [selectedChannel, setSelectedChannel] = useState<string>('all');
  const [selectedBrand, setSelectedBrand] = useState<string>('all');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Try to fetch from analytics endpoint first
      const data = await apiService.get('/api/analytics/channels');
      if (data && data.products && data.products.length > 0) {
        setProducts(data.products);
      } else {
        // Fallback: Fetch products with channel prices
        const productsData = await apiService.get('/api/products');
        const inventory = await apiService.get('/api/inventory');

        // Merge inventory data with products
        const enrichedProducts = (productsData || []).map((p: any) => {
          const inv = (inventory || []).filter((i: any) => i.productId === p.id);
          const totalStock = inv.reduce((sum: number, i: any) => sum + (i.quantity || 0), 0);
          return {
            ...p,
            volume: totalStock,
            channel: p.channelPrices?.[0]?.channel?.name || 'Direct',
            channelFee: p.channelPrices?.[0]?.channel?.commissionRate || 0,
          };
        });
        setProducts(enrichedProducts);
      }
    } catch (error) {
      console.error('Error fetching channel data:', error);
      message.error('Failed to fetch channel pricing data');
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  // Calculate metrics for all products
  const productsWithMetrics = useMemo(() => {
    return products.map(calculateMetrics);
  }, [products]);

  // Filter products
  const filteredProducts = useMemo(() => {
    return productsWithMetrics.filter(p => {
      const channelMatch = selectedChannel === 'all' || p.channel === selectedChannel;
      const brandMatch = selectedBrand === 'all' || p.brand?.name === selectedBrand;
      return channelMatch && brandMatch;
    });
  }, [productsWithMetrics, selectedChannel, selectedBrand]);

  // Get unique channels and brands
  const channels = useMemo(() => {
    const uniqueChannels = [...new Set(productsWithMetrics.map(p => p.channel).filter(Boolean))];
    return ['all', ...uniqueChannels];
  }, [productsWithMetrics]);

  const brands = useMemo(() => {
    const uniqueBrands = [...new Set(productsWithMetrics.map(p => p.brand?.name).filter(Boolean))];
    return ['all', ...uniqueBrands];
  }, [productsWithMetrics]);

  // Algorithm: Calculate channel-level metrics
  const channelStats = useMemo(() => {
    const stats: any = {};
    channels.filter(c => c !== 'all').forEach(channel => {
      const channelProducts = productsWithMetrics.filter(p => p.channel === channel);
      if (channelProducts.length === 0) return;

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

  const handleExport = () => {
    // Create CSV content
    const headers = ['SKU', 'Product', 'Brand', 'Channel', 'Volume', 'Price', 'Cost', 'Total Cost', 'Profit/Unit', 'Margin %', 'Total Revenue', 'Total Profit', 'Performance Score'];
    const rows = filteredProducts.map(p => [
      p.sku,
      p.name,
      p.brand?.name || '',
      p.channel,
      p.volume,
      p.sellingPrice?.toFixed(2),
      p.cost?.toFixed(2),
      p.totalCost?.toFixed(2),
      p.grossProfit?.toFixed(2),
      p.profitMargin?.toFixed(1),
      p.totalRevenue?.toFixed(0),
      p.totalProfit?.toFixed(0),
      p.performanceScore?.toFixed(0),
    ]);

    const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `channel-pricing-report-${new Date().toISOString().split('T')[0]}.csv`;
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
      title: 'Brand',
      key: 'brand',
      width: 100,
      render: (_: any, record: any) => <Tag color="blue">{record.brand?.name || '-'}</Tag>,
    },
    {
      title: 'Channel',
      dataIndex: 'channel',
      key: 'channel',
      width: 140,
      render: (channel: string) => (
        <Tag color="purple" icon={<GlobalOutlined />}>
          {channel || 'Direct'}
        </Tag>
      ),
    },
    {
      title: 'Volume',
      dataIndex: 'volume',
      key: 'volume',
      width: 100,
      align: 'right' as const,
      render: (vol: number) => (vol || 0).toLocaleString(),
      sorter: (a: any, b: any) => b.volume - a.volume,
    },
    {
      title: 'Price',
      dataIndex: 'sellingPrice',
      key: 'price',
      width: 90,
      align: 'right' as const,
      render: (price: number) => `£${(price || 0).toFixed(2)}`,
    },
    {
      title: 'Total Cost',
      key: 'totalCost',
      width: 100,
      align: 'right' as const,
      render: (record: any) => (
        <Tooltip title={`Product: £${(record.cost || 0).toFixed(2)} | Pack: £${(record.packaging || 0).toFixed(2)} | Ship: £${(record.shipping || 0).toFixed(2)} | Fee: £${(record.channelFee || 0).toFixed(2)}`}>
          <span className="cursor-help">£{(record.totalCost || 0).toFixed(2)}</span>
        </Tooltip>
      ),
    },
    {
      title: 'Profit/Unit',
      key: 'grossProfit',
      width: 100,
      align: 'right' as const,
      render: (record: any) => {
        const profit = record.grossProfit || 0;
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
        const margin = record.profitMargin || 0;
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
          £{(record.totalRevenue || 0).toLocaleString()}
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
        const profit = record.totalProfit || 0;
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
            percent={record.performanceScore || 0}
            size={50}
            status={getPerformanceColor(record.performanceScore || 0)}
            format={(percent) => `${(percent || 0).toFixed(0)}`}
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
      render: (vol: number) => (vol || 0).toLocaleString(),
    },
    {
      title: 'Total Revenue',
      dataIndex: 'totalRevenue',
      key: 'totalRevenue',
      align: 'right' as const,
      render: (rev: number) => <span className="font-semibold text-blue-600">£{(rev || 0).toLocaleString()}</span>,
      sorter: (a: any, b: any) => b.totalRevenue - a.totalRevenue,
    },
    {
      title: 'Total Profit',
      dataIndex: 'totalProfit',
      key: 'totalProfit',
      align: 'right' as const,
      render: (profit: number) => (
        <span className="font-semibold text-green-600">£{(profit || 0).toLocaleString()}</span>
      ),
      sorter: (a: any, b: any) => b.totalProfit - a.totalProfit,
    },
    {
      title: 'Avg Margin',
      dataIndex: 'avgMargin',
      key: 'avgMargin',
      align: 'center' as const,
      render: (margin: number) => {
        const color = getMarginColor(margin || 0);
        return <Tag color={color} style={{ fontSize: 16, fontWeight: 'bold' }}>{(margin || 0).toFixed(1)}%</Tag>;
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
          percent={score || 0}
          size="small"
          status={getPerformanceColor(score || 0)}
          format={(percent) => `${(percent || 0).toFixed(0)}/100`}
        />
      ),
      sorter: (a: any, b: any) => b.avgPerformance - a.avgPerformance,
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Spin size="large" tip="Loading channel analytics..." />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
        {/* Header */}
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Channel Pricing Analytics
            </h1>
            <p className="text-gray-600 mt-1">
              Algorithm-based pricing analysis across all sales channels with performance insights
            </p>
          </div>
          <Button icon={<ReloadOutlined />} onClick={fetchData}>Refresh</Button>
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
                prefix={totalProfit >= 0 ? <RiseOutlined /> : <FallOutlined />}
                precision={0}
                valueStyle={{ color: totalProfit >= 0 ? '#52c41a' : '#ff4d4f', fontSize: 28 }}
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
        {productsWithMetrics.length > 0 && (
        <Row gutter={16}>
          <Col xs={24} md={8}>
            <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-300">
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-blue-600 font-semibold flex items-center gap-2 mb-2">
                    <TrophyOutlined style={{ fontSize: 20 }} />
                    Highest Revenue
                  </div>
                  <div className="font-bold text-xl">{topRevenueProduct?.name || 'N/A'}</div>
                  <div className="text-sm text-gray-600 mt-1">{topRevenueProduct?.channel || 'N/A'}</div>
                  <div className="text-2xl font-bold text-blue-600 mt-2">
                    £{(topRevenueProduct?.totalRevenue || 0).toLocaleString()}
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
                  <div className="font-bold text-xl">{topMarginProduct?.name || 'N/A'}</div>
                  <div className="text-sm text-gray-600 mt-1">{topMarginProduct?.channel || 'N/A'}</div>
                  <div className="text-2xl font-bold text-green-600 mt-2">
                    {(topMarginProduct?.profitMargin || 0).toFixed(1)}%
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
                  <div className="font-bold text-xl">{topPerformanceProduct?.name || 'N/A'}</div>
                  <div className="text-sm text-gray-600 mt-1">{topPerformanceProduct?.channel || 'N/A'}</div>
                  <div className="text-2xl font-bold text-purple-600 mt-2">
                    {(topPerformanceProduct?.performanceScore || 0).toFixed(0)}/100
                  </div>
                </div>
              </div>
            </Card>
          </Col>
        </Row>
        )}

        {/* Channel Summary */}
        {channelStats.length > 0 && (
        <Card title={<span className="text-lg font-semibold"><BarChartOutlined /> Channel Performance Summary</span>} className="shadow-sm">
          <Table
            dataSource={channelStats}
            columns={channelColumns}
            rowKey="channel"
            pagination={false}
          />
        </Card>
        )}

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
              <Button type="primary" icon={<DownloadOutlined />} onClick={handleExport}>
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
            locale={{ emptyText: 'No products found. Add products with pricing information to see analytics.' }}
          />
        </Card>
      </div>
      );
}
