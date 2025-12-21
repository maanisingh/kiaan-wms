'use client';

import React, { useState, useEffect } from 'react';
import { Card, Form, Select, InputNumber, Button, Space, Divider, Statistic, Row, Col, Tag, message } from 'antd';
import { CalculatorOutlined, DollarOutlined, ReloadOutlined } from '@ant-design/icons';
import apiService from '@/services/api';

const CHANNELS = [
  { value: 'Amazon_FBA', label: 'Amazon FBA', feePercent: 15, fulfillment: 3.50 },
  { value: 'Amazon_UK_FBA', label: 'Amazon UK FBA', feePercent: 15.3, fulfillment: 3.25 },
  { value: 'Amazon_UK_MFN', label: 'Amazon UK MFN', feePercent: 13.5, fulfillment: 0 },
  { value: 'Shopify', label: 'Shopify', feePercent: 2.9, fulfillment: 0 },
  { value: 'eBay', label: 'eBay', feePercent: 12.8, fulfillment: 0 },
  { value: 'TikTok', label: 'TikTok Shop', feePercent: 5.0, fulfillment: 0 },
  { value: 'Temu', label: 'Temu', feePercent: 8.0, fulfillment: 0 },
  { value: 'Direct', label: 'Direct / Website', feePercent: 0, fulfillment: 0 },
];

export default function PricingCalculatorPage() {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [consumables, setConsumables] = useState<any[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);

  useEffect(() => {
    fetchProducts();
    fetchConsumables();
  }, []);

  const fetchProducts = async () => {
    try {
      const data = await apiService.get('/products');
      const productList = Array.isArray(data) ? data : [];
      setProducts(productList);
      // Auto-select first product
      if (productList.length > 0) {
        const first = productList[0];
        setSelectedProduct(first);
        form.setFieldsValue({
          productId: first.id,
          channelType: 'Amazon_UK_FBA',
          productCost: first.costPrice || 0,
          sellingPrice: first.sellingPrice || 0,
          shippingCost: 3.50,
          laborCost: 0.50,
          packagingCost: 0.25,
          desiredMargin: 0.20,
        });
      }
    } catch (error) {
      console.error('Failed to load products:', error);
    }
  };

  const fetchConsumables = async () => {
    try {
      const data = await apiService.get('/consumables');
      setConsumables(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to load consumables:', error);
    }
  };

  const handleProductChange = (productId: string) => {
    const product = products.find(p => p.id === productId);
    if (product) {
      setSelectedProduct(product);
      form.setFieldsValue({
        productCost: product.costPrice || 0,
        sellingPrice: product.sellingPrice || 0,
      });
    }
  };

  const handleCalculate = async (values: any) => {
    try {
      setLoading(true);
      // Calculate locally for instant feedback
      const productCost = values.productCost || 0;
      const packagingCost = values.packagingCost || 0;
      const shippingCost = values.shippingCost || 0;
      const laborCost = values.laborCost || 0;
      const desiredMargin = values.desiredMargin || 0.20;

      const channelConfig = CHANNELS.find(c => c.value === values.channelType) || CHANNELS[0];
      const feePercent = channelConfig.feePercent / 100;
      const fulfillmentFee = channelConfig.fulfillment;

      const baseCost = productCost + packagingCost + shippingCost + laborCost + fulfillmentFee;
      const recommendedSellingPrice = baseCost / (1 - desiredMargin - feePercent);
      const channelFee = recommendedSellingPrice * feePercent;
      const totalCost = baseCost + channelFee;
      const profit = recommendedSellingPrice - totalCost;
      const actualMargin = recommendedSellingPrice > 0 ? profit / recommendedSellingPrice : 0;

      setResult({
        productCost,
        consumablesCost: packagingCost,
        shippingCost,
        laborCost,
        fulfillmentFee,
        fees: channelFee + fulfillmentFee,
        totalCost,
        recommendedSellingPrice,
        profit,
        margin: actualMargin,
        breakdown: {
          channelFeePercent: channelConfig.feePercent,
          fulfillmentFee: channelConfig.fulfillment,
        }
      });
      message.success('Price calculated successfully!');
    } catch (error: any) {
      console.error('Failed to calculate price:', error);
      message.error('Failed to calculate price');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '24px' }}>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Marketplace Price Calculator</h1>
        <p className="text-gray-500">Calculate optimal selling prices with full cost breakdown</p>
      </div>

      <Row gutter={16}>
        <Col span={12}>
          <Card
            title={
              <Space>
                <CalculatorOutlined />
                Cost Configuration
              </Space>
            }
            extra={<Button icon={<ReloadOutlined />} onClick={fetchProducts}>Refresh</Button>}
          >
            <Form
              form={form}
              layout="vertical"
              onFinish={handleCalculate}
              initialValues={{
                desiredMargin: 0.20,
                shippingCost: 3.50,
                laborCost: 0.50,
                packagingCost: 0.25,
                channelType: 'Amazon_UK_FBA',
              }}
            >
              <Form.Item
                name="productId"
                label="Product"
                rules={[{ required: true, message: 'Please select a product' }]}
              >
                <Select
                  placeholder="Select product"
                  showSearch
                  optionFilterProp="children"
                  onChange={handleProductChange}
                  filterOption={(input, option: any) =>
                    option.children.toLowerCase().includes(input.toLowerCase())
                  }
                >
                  {products.map(p => (
                    <Select.Option key={p.id} value={p.id}>
                      {p.sku} - {p.name}
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>

              <Form.Item
                name="channelType"
                label="Sales Channel"
                rules={[{ required: true, message: 'Please select a channel' }]}
              >
                <Select placeholder="Select marketplace">
                  {CHANNELS.map(c => (
                    <Select.Option key={c.value} value={c.value}>
                      {c.label} ({c.feePercent}% + £{c.fulfillment.toFixed(2)})
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>

              <Divider orientation="left">Editable Costs</Divider>

              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    name="productCost"
                    label="Product Cost (£)"
                    rules={[{ required: true, message: 'Required' }]}
                  >
                    <InputNumber
                      min={0}
                      step={0.01}
                      style={{ width: '100%' }}
                      precision={2}
                    />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name="packagingCost"
                    label="Packaging Cost (£)"
                  >
                    <InputNumber
                      min={0}
                      step={0.01}
                      style={{ width: '100%' }}
                      precision={2}
                    />
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    name="shippingCost"
                    label="Shipping Cost (£)"
                  >
                    <InputNumber
                      min={0}
                      step={0.01}
                      style={{ width: '100%' }}
                      precision={2}
                    />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name="laborCost"
                    label="Labor/Pick Cost (£)"
                  >
                    <InputNumber
                      min={0}
                      step={0.01}
                      style={{ width: '100%' }}
                      precision={2}
                    />
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item
                name="desiredMargin"
                label="Target Profit Margin"
                tooltip="The profit margin you want to achieve"
              >
                <Select style={{ width: '100%' }}>
                  <Select.Option value={0.10}>10% - Low Margin</Select.Option>
                  <Select.Option value={0.15}>15% - Budget</Select.Option>
                  <Select.Option value={0.20}>20% - Standard</Select.Option>
                  <Select.Option value={0.25}>25% - Good</Select.Option>
                  <Select.Option value={0.30}>30% - Premium</Select.Option>
                  <Select.Option value={0.35}>35% - High</Select.Option>
                  <Select.Option value={0.40}>40% - Luxury</Select.Option>
                </Select>
              </Form.Item>

              <Form.Item>
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={loading}
                  block
                  size="large"
                  icon={<CalculatorOutlined />}
                >
                  Calculate Optimal Price
                </Button>
              </Form.Item>
            </Form>
          </Card>
        </Col>

        <Col span={12}>
          {result && (
            <Card
              title={
                <Space>
                  <DollarOutlined />
                  Pricing Results
                </Space>
              }
            >
              <Space direction="vertical" size="large" style={{ width: '100%' }}>
                <div>
                  <h3>Cost Breakdown</h3>
                  <Row gutter={16}>
                    <Col span={12}>
                      <Statistic
                        title="Product Cost"
                        value={result.productCost}
                        precision={2}
                        prefix="£"
                      />
                    </Col>
                    <Col span={12}>
                      <Statistic
                        title="Consumables"
                        value={result.consumablesCost}
                        precision={2}
                        prefix="£"
                      />
                    </Col>
                  </Row>
                  <Row gutter={16} style={{ marginTop: '16px' }}>
                    <Col span={12}>
                      <Statistic
                        title="Total Cost"
                        value={result.totalCost}
                        precision={2}
                        prefix="£"
                        valueStyle={{ color: '#cf1322' }}
                      />
                    </Col>
                    <Col span={12}>
                      <Statistic
                        title="Channel Fees"
                        value={result.fees}
                        precision={2}
                        prefix="£"
                        valueStyle={{ color: '#faad14' }}
                      />
                    </Col>
                  </Row>
                </div>

                <Divider />

                <div>
                  <h3>Recommended Pricing</h3>
                  <Row gutter={16}>
                    <Col span={24}>
                      <Card style={{ backgroundColor: '#f0f9ff', border: '2px solid #1890ff' }}>
                        <Statistic
                          title="Selling Price"
                          value={result.recommendedSellingPrice}
                          precision={2}
                          prefix="£"
                          valueStyle={{ color: '#1890ff', fontSize: '32px' }}
                        />
                      </Card>
                    </Col>
                  </Row>
                  <Row gutter={16} style={{ marginTop: '16px' }}>
                    <Col span={12}>
                      <Statistic
                        title="Gross Profit"
                        value={result.profit}
                        precision={2}
                        prefix="£"
                        valueStyle={{ color: '#3f8600' }}
                      />
                    </Col>
                    <Col span={12}>
                      <Statistic
                        title="Profit Margin"
                        value={(result.margin * 100).toFixed(1)}
                        suffix="%"
                        valueStyle={{ color: '#3f8600' }}
                      />
                    </Col>
                  </Row>
                </div>

                <Divider />

                <div>
                  <h3>Analysis</h3>
                  {result.margin < 0.1 && (
                    <Tag color="red">Low Margin - Consider increasing price</Tag>
                  )}
                  {result.margin >= 0.1 && result.margin < 0.2 && (
                    <Tag color="orange">Moderate Margin</Tag>
                  )}
                  {result.margin >= 0.2 && (
                    <Tag color="green">Good Margin</Tag>
                  )}
                  <div style={{ marginTop: '16px' }}>
                    <p><strong>ROI:</strong> {((result.profit / result.totalCost) * 100).toFixed(1)}%</p>
                    <p><strong>Markup:</strong> {((result.recommendedSellingPrice / result.totalCost - 1) * 100).toFixed(1)}%</p>
                  </div>
                </div>

                <Button type="dashed" block>
                  Save to Channel Prices
                </Button>
              </Space>
            </Card>
          )}

          {!result && (
            <Card>
              <div style={{ textAlign: 'center', padding: '60px 20px', color: '#999' }}>
                <CalculatorOutlined style={{ fontSize: 64, marginBottom: '16px' }} />
                <p>Fill in the form and click Calculate to see pricing results</p>
              </div>
            </Card>
          )}
        </Col>
      </Row>
    </div>
  );
}
