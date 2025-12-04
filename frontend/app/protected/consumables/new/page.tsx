'use client';

import React, { useState, useEffect } from 'react';
import {
  Card, Form, Input, InputNumber, Select, Button, message, Switch, Row, Col
} from 'antd';
import { ArrowLeftOutlined, SaveOutlined } from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import apiService from '@/services/api';

export default function NewConsumablePage() {
  const router = useRouter();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [suppliers, setSuppliers] = useState<any[]>([]);

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const fetchSuppliers = async () => {
    try {
      const data = await apiService.get('/suppliers');
      setSuppliers(data.suppliers || []);
    } catch (err) {
      console.error('Failed to fetch suppliers:', err);
    }
  };

  const handleSubmit = async (values: any) => {
    try {
      setLoading(true);
      await apiService.post('/consumables', values);
      message.success('Consumable created successfully');
      router.push('/protected/consumables');
    } catch (err: any) {
      message.error(err.message || 'Failed to create consumable');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button icon={<ArrowLeftOutlined />} onClick={() => router.back()}>
          Back
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Add New Consumable</h1>
          <p className="text-gray-500">Create a new packaging material or consumable item</p>
        </div>
      </div>

      <Card>
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{ isActive: true, category: 'Packaging', onStock: 0 }}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="SKU"
                name="sku"
                rules={[{ required: true, message: 'SKU is required' }]}
              >
                <Input placeholder="e.g., BOX_6x5x4" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="Name"
                name="name"
                rules={[{ required: true, message: 'Name is required' }]}
              >
                <Input placeholder="e.g., Cardboard Box 6x5x4" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="Category" name="category">
                <Select>
                  <Select.Option value="Packaging">Packaging</Select.Option>
                  <Select.Option value="Cardboard">Cardboard</Select.Option>
                  <Select.Option value="Tape">Tape</Select.Option>
                  <Select.Option value="Labels">Labels</Select.Option>
                  <Select.Option value="Bubble Wrap">Bubble Wrap</Select.Option>
                  <Select.Option value="Other">Other</Select.Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Supplier" name="supplierId">
                <Select placeholder="Select supplier" allowClear>
                  {suppliers.map((s) => (
                    <Select.Option key={s.id} value={s.id}>
                      {s.name}
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item label="Cost Price Each (£)" name="costPriceEach">
                <InputNumber min={0} step={0.01} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="Units Per Pack" name="unitPerPack">
                <InputNumber min={1} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="Cost Price Pack (£)" name="costPricePack">
                <InputNumber min={0} step={0.01} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item label="On Stock" name="onStock">
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="Reorder Level" name="reorderLevel">
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="Active" name="isActive" valuePropName="checked">
                <Switch />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={6}>
              <Form.Item label="Weight (kg)" name="weight">
                <InputNumber min={0} step={0.01} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item label="Length (cm)" name="length">
                <InputNumber min={0} step={0.1} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item label="Height (cm)" name="height">
                <InputNumber min={0} step={0.1} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item label="Depth (cm)" name="depth">
                <InputNumber min={0} step={0.1} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item label="Description" name="description">
            <Input.TextArea rows={3} />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading} icon={<SaveOutlined />} size="large">
              Create Consumable
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
}
