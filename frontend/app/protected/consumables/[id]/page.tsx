'use client';

import React, { useState, useEffect } from 'react';
import {
  Card, Button, Descriptions, Tag, Spin, Alert, Space, message, Modal, Form,
  Input, InputNumber, Select, Switch, Row, Col
} from 'antd';
import {
  ArrowLeftOutlined, EditOutlined, DeleteOutlined, SaveOutlined, ReloadOutlined
} from '@ant-design/icons';
import { useRouter, useParams } from 'next/navigation';
import { formatCurrency } from '@/lib/utils';
import apiService from '@/services/api';

interface Consumable {
  id: string;
  sku: string;
  name: string;
  description?: string;
  category: string;
  costPriceEach?: number;
  unitPerPack?: number;
  costPricePack?: number;
  onStock: number;
  reorderLevel?: number;
  weight?: number;
  length?: number;
  height?: number;
  depth?: number;
  dimensionUnit?: string;
  supplier?: { id: string; name: string };
  isActive: boolean;
  createdAt: string;
}

export default function ConsumableDetailPage() {
  const router = useRouter();
  const params = useParams();
  const [consumable, setConsumable] = useState<Consumable | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [form] = Form.useForm();

  const fetchConsumable = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await apiService.get(`/consumables/${params.id}`);
      setConsumable(data);
      form.setFieldsValue(data);
    } catch (err: any) {
      console.error('Failed to fetch consumable:', err);
      setError(err.message || 'Failed to load consumable');
    } finally {
      setLoading(false);
    }
  };

  const fetchSuppliers = async () => {
    try {
      const data = await apiService.get('/suppliers');
      setSuppliers(data.suppliers || []);
    } catch (err) {
      console.error('Failed to fetch suppliers:', err);
    }
  };

  useEffect(() => {
    if (params.id) {
      fetchConsumable();
      fetchSuppliers();
    }
  }, [params.id]);

  const handleEdit = () => {
    setEditMode(true);
  };

  const handleSave = async (values: any) => {
    try {
      await apiService.put(`/consumables/${params.id}`, values);
      message.success('Consumable updated successfully');
      setEditMode(false);
      fetchConsumable();
    } catch (err: any) {
      message.error(err.message || 'Failed to update consumable');
    }
  };

  const handleDelete = () => {
    Modal.confirm({
      title: 'Delete Consumable',
      content: `Are you sure you want to delete ${consumable?.name}?`,
      okText: 'Delete',
      okType: 'danger',
      onOk: async () => {
        try {
          await apiService.delete(`/consumables/${params.id}`);
          message.success('Consumable deleted successfully');
          router.push('/protected/consumables');
        } catch (err: any) {
          message.error(err.message || 'Failed to delete consumable');
        }
      },
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <Spin size="large" tip="Loading consumable..." />
      </div>
    );
  }

  if (error || !consumable) {
    return (
      <div className="p-6">
        <Alert
          message="Error"
          description={error || 'Consumable not found'}
          type="error"
          showIcon
          action={
            <Space>
              <Button onClick={fetchConsumable} icon={<ReloadOutlined />}>
                Retry
              </Button>
              <Button onClick={() => router.push('/protected/consumables')}>
                Back to List
              </Button>
            </Space>
          }
        />
      </div>
    );
  }

  const stockValue = consumable.onStock * (consumable.costPriceEach || 0);
  const isLowStock = consumable.reorderLevel && consumable.onStock <= consumable.reorderLevel;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div className="flex items-center gap-4">
          <Button icon={<ArrowLeftOutlined />} onClick={() => router.push('/protected/consumables')}>
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{consumable.name}</h1>
            <p className="text-gray-500">SKU: {consumable.sku}</p>
          </div>
        </div>
        <Space>
          {!editMode && (
            <>
              <Button icon={<EditOutlined />} onClick={handleEdit}>
                Edit
              </Button>
              <Button danger icon={<DeleteOutlined />} onClick={handleDelete}>
                Delete
              </Button>
            </>
          )}
        </Space>
      </div>

      {/* Stats */}
      <Row gutter={16}>
        <Col span={6}>
          <Card>
            <div className="text-center">
              <div className="text-2xl font-bold">{consumable.onStock}</div>
              <div className="text-gray-500 text-sm">In Stock</div>
              {isLowStock && (
                <Tag color="red" className="mt-2">Low Stock</Tag>
              )}
            </div>
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <div className="text-center">
              <div className="text-2xl font-bold">{formatCurrency(stockValue)}</div>
              <div className="text-gray-500 text-sm">Stock Value</div>
            </div>
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <div className="text-center">
              <div className="text-2xl font-bold">{formatCurrency(consumable.costPriceEach || 0)}</div>
              <div className="text-gray-500 text-sm">Cost Per Unit</div>
            </div>
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <div className="text-center">
              <div className="text-2xl font-bold">
                <Tag color={consumable.isActive ? 'green' : 'red'}>
                  {consumable.isActive ? 'Active' : 'Inactive'}
                </Tag>
              </div>
              <div className="text-gray-500 text-sm">Status</div>
            </div>
          </Card>
        </Col>
      </Row>

      {/* Details */}
      <Card title="Consumable Details">
        {editMode ? (
          <Form
            form={form}
            layout="vertical"
            onFinish={handleSave}
            initialValues={consumable}
          >
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item label="SKU" name="sku" rules={[{ required: true }]}>
                  <Input />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item label="Name" name="name" rules={[{ required: true }]}>
                  <Input />
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
              <Space>
                <Button type="primary" htmlType="submit" icon={<SaveOutlined />}>
                  Save Changes
                </Button>
                <Button onClick={() => setEditMode(false)}>
                  Cancel
                </Button>
              </Space>
            </Form.Item>
          </Form>
        ) : (
          <Descriptions column={2} bordered>
            <Descriptions.Item label="SKU">{consumable.sku}</Descriptions.Item>
            <Descriptions.Item label="Name">{consumable.name}</Descriptions.Item>
            <Descriptions.Item label="Category">
              <Tag color="blue">{consumable.category}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Supplier">
              {consumable.supplier?.name || '-'}
            </Descriptions.Item>
            <Descriptions.Item label="Cost Price Each">
              {formatCurrency(consumable.costPriceEach || 0)}
            </Descriptions.Item>
            <Descriptions.Item label="Units Per Pack">
              {consumable.unitPerPack || '-'}
            </Descriptions.Item>
            <Descriptions.Item label="Cost Price Pack">
              {formatCurrency(consumable.costPricePack || 0)}
            </Descriptions.Item>
            <Descriptions.Item label="On Stock">
              <span className={isLowStock ? 'text-red-600 font-semibold' : ''}>
                {consumable.onStock}
              </span>
            </Descriptions.Item>
            <Descriptions.Item label="Reorder Level">
              {consumable.reorderLevel || '-'}
            </Descriptions.Item>
            <Descriptions.Item label="Stock Value">
              {formatCurrency(stockValue)}
            </Descriptions.Item>
            <Descriptions.Item label="Weight">
              {consumable.weight ? `${consumable.weight} kg` : '-'}
            </Descriptions.Item>
            <Descriptions.Item label="Dimensions">
              {consumable.length && consumable.height && consumable.depth
                ? `${consumable.length} x ${consumable.height} x ${consumable.depth} ${consumable.dimensionUnit || 'cm'}`
                : '-'
              }
            </Descriptions.Item>
            <Descriptions.Item label="Description" span={2}>
              {consumable.description || '-'}
            </Descriptions.Item>
            <Descriptions.Item label="Status">
              <Tag color={consumable.isActive ? 'green' : 'red'}>
                {consumable.isActive ? 'Active' : 'Inactive'}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Created">
              {new Date(consumable.createdAt).toLocaleDateString()}
            </Descriptions.Item>
          </Descriptions>
        )}
      </Card>
    </div>
  );
}
