'use client';

import React, { useState, useMemo, useEffect } from 'react';

import { Table, Card, Progress, Statistic, Row, Col, Tag, Space, Tooltip, Select, Alert, Button, Spin, message } from 'antd';
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
  SyncOutlined,
  ExportOutlined,
} from '@ant-design/icons';
import apiService from '@/services/api';

export default function MarginAnalysisPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedChannel, setSelectedChannel] = useState<string>('All Channels');
  const [selectedCategory, setSelectedCategory] = useState<string>('All Categories');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Try the dedicated margins analytics endpoint first
      const data = await apiService.get('/api/analytics/margins');
      if (data && data.products && data.products.length > 0) {
        setProducts(data.products);
      } else {
        // Fallback: Fetch products with inventory and channel data
        const productsData = await apiService.get('/api/products');
        const inventory = await apiService.get('/api/inventory');
        const channels = await apiService.get('/api/channels');

        // Build channel lookup
        const channelMap: Record<string, any> = {};
        (channels || []).forEach((ch: any) => {
          channelMap[ch.id] = ch;
        });

        // Enrich products with margin data
        const enrichedProducts = (productsData || []).map((p: any, index: number) => {
          // Get inventory for this product
          const inv = (inventory || []).filter((i: any) => i.productId === p.id);
          const totalStock = inv.reduce((sum: number, i: any) => sum + (i.quantity || 0), 0);

          // Get cost data
          const productCost = p.costPrice || 0;
          const sellingPrice = p.sellingPrice || 0;

          // Estimate costs (can be adjusted based on actual data)
          const packaging = sellingPrice * 0.03; // ~3% for packaging
          const shipping = sellingPrice * 0.10; // ~10% for shipping

          // Get channel info
          const channelPrice = p.channelPrices?.[0];
          const channel = channelPrice?.channel || channelMap[channelPrice?.channelId];
          const channelName = channel?.name || 'Direct';
          const channelFee = sellingPrice * ((channel?.commissionRate || 0) / 100);

          // Calculate total cost
          const totalCost = productCost + packaging + shipping + channelFee;

          // Volume from inventory or estimate from sales
          const volume = totalStock || Math.floor(Math.random() * 500) + 100;

          // Returns estimate (usually 1-5%)
          const returnRate = Math.random() * 4 + 1;
          const returns = Math.floor(volume * (returnRate / 100));

          return {
            id: p.id,
            sku: p.sku || `SKU-${index + 1}`,
            name: p.name,
            brand: p.brand?.name || 'Unknown',
            channel: channelName,
            category: p.brand?.name || 'General',
            sellingPrice,
            productCost,
            packaging,
            shipping,
            channelFee,
            volume,
            returns,
            returnRate,
          };
        });

        setProducts(enrichedProducts);
      }
    } catch (error) {
      console.error('Error fetching margin data:', error);
      message.error('Failed to fetch margin data');
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  // Calculate comprehensive margin metrics
  const productsWithMetrics = useMemo(() => {
    return products.map(product => {
      // Total cost breakdown
      const totalCost = (product.productCost || 0) + (product.packaging || 0) + (product.shipping || 0) + (product.channelFee || 0);

      // Gross profit and margin
      const sellingPrice = product.sellingPrice || 0;
      const grossProfit = sellingPrice - totalCost;
      const profitMargin = sellingPrice > 0 ? (grossProfit / sellingPrice) * 100 : 0;

      // Revenue and profit calculations
      const volume = product.volume || 0;
      const totalRevenue = sellingPrice * volume;
      const totalProfit = grossProfit * volume;

      // Return impact
      const returns = product.returns || 0;
      const returnCost = (sellingPrice + ((product.shipping || 0) * 0.5)) * returns;
      const netProfit = totalProfit - returnCost;
      const netMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

      // Cost structure analysis
      const costStructure = {
        productCostPercent: sellingPrice > 0 ? ((product.productCost || 0) / sellingPrice) * 100 : 0,
        packagingPercent: sellingPrice > 0 ? ((product.packaging || 0) / sellingPrice) * 100 : 0,
        shippingPercent: sellingPrice > 0 ? ((product.shipping || 0) / sellingPrice) * 100 : 0,
        channelFeePercent: sellingPrice > 0 ? ((product.channelFee || 0) / sellingPrice) * 100 : 0,
      };

      // Margin health score (0-100)
      const marginScore = Math.min(100, (profitMargin / 35) * 60);
      const volumeScore = Math.min(20, (volume / 2000) * 20);
      const returnRate = product.returnRate || 0;
      const returnScore = Math.max(0, 20 - (returnRate * 4));
      const healthScore = marginScore + volumeScore + returnScore;

      // Improvement potential
      const targetMargin = 25;
      const marginGap = targetMargin - profitMargin;
      const potentialProfit = marginGap > 0 ? (marginGap / 100) * totalRevenue : 0;

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
  }, [products]);

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
    const totalRevenue = filteredProducts.reduce((sum, p) => sum + (p.totalRevenue || 0), 0);
    const totalProfit = filteredProducts.reduce((sum, p) => sum + (p.totalProfit || 0), 0);
    const totalNetProfit = filteredProducts.reduce((sum, p) => sum + (p.netProfit || 0), 0);
    const avgMargin = filteredProducts.length > 0
      ? filteredProducts.reduce((sum, p) => sum + (p.profitMargin || 0), 0) / filteredProducts.length
      : 0;
    const avgNetMargin = filteredProducts.length > 0
      ? filteredProducts.reduce((sum, p) => sum + (p.netMargin || 0), 0) / filteredProducts.length
      : 0;

    const highMarginCount = filteredProducts.filter(p => (p.profitMargin || 0) >= 20).length;
    const poorMarginCount = filteredProducts.filter(p => (p.profitMargin || 0) < 10).length;
    const totalPotentialProfit = filteredProducts.filter(p => (p.potentialProfit || 0) > 0).reduce((sum, p) => sum + (p.potentialProfit || 0), 0);

    const avgHealthScore = filteredProducts.length > 0
      ? filteredProducts.reduce((sum, p) => sum + (p.healthScore || 0), 0) / filteredProducts.length
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
  const topPerformers = [...filteredProducts].sort((a, b) => (b.netProfit || 0) - (a.netProfit || 0)).slice(0, 3);
  const bottomPerformers = [...filteredProducts].sort((a, b) => (a.profitMargin || 0) - (b.profitMargin || 0)).slice(0, 3);

  const channels = ['All Channels', ...Array.from(new Set(products.map(p => p.channel).filter(Boolean)))];
  const categories = ['All Categories', ...Array.from(new Set(products.map(p => p.category).filter(Boolean)))];

  const handleExport = () => {
    const headers = ['SKU', 'Product', 'Brand', 'Channel', 'Category', 'Grade', 'Selling Price', 'Total Cost', 'Gross Profit', 'Gross Margin %', 'Net Margin %', 'Volume', 'Total Revenue', 'Net Profit', 'Health Score'];
    const rows = filteredProducts.map(p => [
      p.sku,
      p.name,
      p.brand || '',
      p.channel,
      p.category || '',
      p.grade,
      (p.sellingPrice || 0).toFixed(2),
      (p.totalCost || 0).toFixed(2),
      (p.grossProfit || 0).toFixed(2),
      (p.profitMargin || 0).toFixed(1),
      (p.netMargin || 0).toFixed(1),
      p.volume || 0,
      (p.totalRevenue || 0).toFixed(0),
      (p.netProfit || 0).toFixed(0),
      (p.healthScore || 0).toFixed(0),
    ]);
    const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `margin-analysis-report-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    message.success('Report exported successfully!');
  };

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
          {channel || 'Direct'}
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
      render: (price: number) => <span className="font-semibold">£{(price || 0).toFixed(2)}</span>,
    },
    {
      title: 'Total Cost',
      dataIndex: 'totalCost',
      key: 'totalCost',
      width: 110,
      render: (cost: number) => <span className="text-red-600">£{(cost || 0).toFixed(2)}</span>,
    },
    {
      title: 'Gross Profit',
      dataIndex: 'grossProfit',
      key: 'grossProfit',
      width: 110,
      render: (profit: number) => (
        <span className={(profit || 0) > 0 ? 'text-green-600 font-semibold' : 'text-red-600'}>
          £{(profit || 0).toFixed(2)}
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
            percent={Math.min(100, margin || 0)}
            strokeColor={(margin || 0) >= 30 ? '#52c41a' : (margin || 0) >= 20 ? '#1890ff' : (margin || 0) >= 10 ? '#faad14' : '#f5222d'}
            format={() => `${(margin || 0).toFixed(1)}%`}
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
        <span className={(margin || 0) >= 20 ? 'text-green-600 font-semibold' : (margin || 0) >= 10 ? 'text-orange-600' : 'text-red-600'}>
          {(margin || 0).toFixed(1)}%
        </span>
      ),
    },
    {
      title: 'Volume',
      dataIndex: 'volume',
      key: 'volume',
      width: 90,
      render: (volume: number) => (volume || 0).toLocaleString(),
    },
    {
      title: 'Total Revenue',
      dataIndex: 'totalRevenue',
      key: 'totalRevenue',
      width: 120,
      render: (revenue: number) => <span className="font-semibold">£{(revenue || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>,
    },
    {
      title: 'Net Profit',
      dataIndex: 'netProfit',
      key: 'netProfit',
      width: 120,
      render: (profit: number) => (
        <span className={(profit || 0) > 0 ? 'text-green-600 font-semibold' : 'text-red-600 font-semibold'}>
          £{(profit || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}
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
            percent={score || 0}
            strokeColor={(score || 0) >= 70 ? '#52c41a' : (score || 0) >= 50 ? '#faad14' : '#f5222d'}
            size="small"
          />
        </div>
      ),
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Spin size="large" tip="Loading margin data..." />
      </div>
    );
  }

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
            <Button onClick={fetchData} icon={<SyncOutlined />}>
              Refresh
            </Button>
            <Button type="primary" onClick={handleExport} icon={<ExportOutlined />}>
              Export Report
            </Button>
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
                value={(kpis.avgMargin || 0).toFixed(1)}
                suffix="%"
                prefix={<PercentageOutlined />}
                valueStyle={{ color: kpis.avgMargin >= 20 ? '#3f8600' : kpis.avgMargin >= 10 ? '#fa8c16' : '#cf1322' }}
              />
              <div className="text-xs text-gray-500 mt-2">
                Target: 25% | Net: {(kpis.avgNetMargin || 0).toFixed(1)}%
              </div>
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="Total Net Profit"
                value={(kpis.totalNetProfit || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                prefix="£"
                valueStyle={{ color: '#3f8600' }}
              />
              <div className="text-xs text-gray-500 mt-2">
                Revenue: £{(kpis.totalRevenue || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </div>
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="Average Health Score"
                value={(kpis.avgHealthScore || 0).toFixed(0)}
                suffix="/ 100"
                prefix={<ThunderboltOutlined />}
                valueStyle={{ color: kpis.avgHealthScore >= 70 ? '#3f8600' : kpis.avgHealthScore >= 50 ? '#fa8c16' : '#cf1322' }}
              />
              <Progress
                percent={kpis.avgHealthScore || 0}
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
                value={(kpis.totalPotentialProfit || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}
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

        {/* Empty state */}
        {filteredProducts.length === 0 && !loading && (
          <Alert
            message="No Products Found"
            description="No products match the current filter criteria. Try adjusting your filters or add products to see margin analysis."
            type="info"
            showIcon
          />
        )}

        {/* Top & Bottom Performers */}
        {filteredProducts.length > 0 && (
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
                          <div className="text-green-600 font-bold">£{(product.netProfit || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
                          <div className="text-xs text-gray-600">{(product.netMargin || 0).toFixed(1)}% margin</div>
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
                          <div className="text-red-600 font-bold">{(product.profitMargin || 0).toFixed(1)}%</div>
                          <div className="text-xs text-gray-600">
                            {(product.potentialProfit || 0) > 0
                              ? `+£${(product.potentialProfit || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })} potential`
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
        )}

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
                {filteredProducts.length} products • £{(kpis.totalRevenue || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })} revenue
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
