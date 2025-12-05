'use client';

import React, { useState, useEffect } from 'react';
import { Card, Form, Select, InputNumber, Button, Space, Divider, Statistic, Row, Col, Tag } from 'antd';
import { CalculatorOutlined, DollarOutlined } from '@ant-design/icons';
import apiService from '@/services/api';

const CHANNELS = [
  { value: 'Amazon_FBA', label: 'Amazon FBA' },
  { value: 'Amazon_UK_FBA', label: 'Amazon UK FBA' },
  { value: 'Amazon_UK_MFN', label: 'Amazon UK MFN' },
  { value: 'Shopify', label: 'Shopify' },
  { value: 'eBay', label: 'eBay' },
  { value: 'TikTok', label: 'TikTok Shop' },
  { value: 'Temu', label: 'Temu' },
];

export default function PricingCalculatorPage() {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [consumables, setConsumables] = useState<any[]>([]);

  useEffect(() => {
    fetchProducts();
    fetchConsumables();
  }, []);

  const fetchProducts = async () => {
    try {
      const data = await apiService.get('/products');
      setProducts(Array.isArray(data) ? data : []);
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

  const handleCalculate = async (values: any) => {
    try {
      setLoading(true);
      const response = await apiService.post('/pricing/calculate', values);
      setResult(response);
    } catch (error: any) {
      console.error('Failed to calculate price:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '24px' }}>
      <Row gutter={16}>
        <Col span={12}>
          <Card
            title={
              <Space>
                <CalculatorOutlined />
                Marketplace Price Calculator
              </Space>
            }
          >
            <p style={{ marginBottom: '24px', color: '#666' }}>
              Calculate the optimal selling price for your product on different marketplaces.
              Enter costs and desired margin to get recommended pricing.
            </p>

            <Form
              form={form}
              layout="vertical"
              onFinish={handleCalculate}
              initialValues={{
                desiredMargin: 0.20,
                shippingCost: 0,
                laborCost: 0
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
                  filterOption={(input, option: any) =>
                    option.children.toLowerCase().includes(input.toLowerCase())
                  }
                >
                  {products.map(p => (
                    <Select.Option key={p.id} value={p.id}>
                      {p.sku} - {p.name}
                      {p.costPrice && ` (£${p.costPrice.toFixed(2)})`}
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
                      {c.label}
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>

              <Form.Item
                name="consumableIds"
                label="Consumables (Packaging)"
              >
                <Select
                  mode="multiple"
                  placeholder="Select consumables"
                  showSearch
                  optionFilterProp="children"
                >
                  {consumables.map(c => (
                    <Select.Option key={c.id} value={c.id}>
                      {c.name}
                      {c.costPriceEach && ` (£${c.costPriceEach.toFixed(2)})`}
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>

              <Form.Item
                name="shippingCost"
                label="Shipping Cost (£)"
              >
                <InputNumber
                  min={0}
                  step={0.01}
                  style={{ width: '100%' }}
                  prefix="£"
                  placeholder="3.50"
                />
              </Form.Item>

              <Form.Item
                name="laborCost"
                label="Labor Cost (£)"
              >
                <InputNumber
                  min={0}
                  step={0.01}
                  style={{ width: '100%' }}
                  prefix="£"
                  placeholder="0.75"
                />
              </Form.Item>

              <Form.Item
                name="desiredMargin"
                label="Desired Margin (%)"
                tooltip="Target profit margin percentage"
              >
                <InputNumber
                  min={0}
                  max={1}
                  step={0.01}
                  style={{ width: '100%' }}
                  formatter={value => `${(parseFloat(value as string) * 100).toFixed(0)}%`}
                  parser={value => (parseFloat(value?.replace('%', '') || '0') / 100).toString()}
                />
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
                  Calculate Price
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
