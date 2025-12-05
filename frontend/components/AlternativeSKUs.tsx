'use client';

import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Modal, Form, Input, Select, Tag, Space, message, Tabs } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, AmazonOutlined, ShopOutlined } from '@ant-design/icons';
import apiService from '@/services/api';

interface AlternativeSKU {
  id: string;
  productId: string;
  channelType: string;
  channelSKU: string;
  skuType?: string;
  isPrimary: boolean;
  isActive: boolean;
  notes?: string;
}

interface Props {
  productId: string;
  productSKU: string;
}

const CHANNEL_TYPES = [
  { value: 'Amazon', label: 'Amazon' },
  { value: 'Amazon_UK_FBA', label: 'Amazon UK FBA' },
  { value: 'Amazon_UK_MFN', label: 'Amazon UK MFN' },
  { value: 'Shopify', label: 'Shopify' },
  { value: 'eBay', label: 'eBay' },
  { value: 'TikTok', label: 'TikTok Shop' },
  { value: 'Temu', label: 'Temu' },
];

const SKU_TYPES = [
  { value: 'NORMAL', label: 'Normal' },
  { value: 'BB_ROTATION', label: 'BB Rotation (_BB)' },
  { value: 'MFN', label: 'MFN (_M)' },
];

export default function AlternativeSKUs({ productId, productSKU }: Props) {
  const [loading, setLoading] = useState(false);
  const [skus, setSkus] = useState<AlternativeSKU[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState<AlternativeSKU | null>(null);
  const [form] = Form.useForm();

  useEffect(() => {
    fetchSKUs();
  }, [productId]);

  const fetchSKUs = async () => {
    try {
      setLoading(true);
      const response = await apiService.get(`/alternative-skus/by-product/${productId}`);
      setSkus(response.all || []);
    } catch (error: any) {
      console.error('Failed to load alternative SKUs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setEditingItem(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (item: AlternativeSKU) => {
    setEditingItem(item);
    form.setFieldsValue(item);
    setModalVisible(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await apiService.delete(`/alternative-skus/${id}`);
      message.success('Alternative SKU deleted');
      fetchSKUs();
    } catch (error: any) {
      message.error('Failed to delete SKU');
    }
  };

  const handleQuickAddAmazon = async () => {
    try {
      // Add all 3 Amazon variants
      const variants = [
        { channelSKU: productSKU, skuType: 'NORMAL', channelType: 'Amazon' },
        { channelSKU: `${productSKU}_BB`, skuType: 'BB_ROTATION', channelType: 'Amazon' },
        { channelSKU: `${productSKU}_M`, skuType: 'MFN', channelType: 'Amazon' },
      ];

      for (const variant of variants) {
        await apiService.post('/alternative-skus', {
          productId,
          ...variant,
          isPrimary: variant.skuType === 'NORMAL',
          isActive: true
        });
      }

      message.success('Amazon variants added');
      fetchSKUs();
    } catch (error: any) {
      message.error('Failed to add Amazon variants');
    }
  };

  const handleSubmit = async (values: any) => {
    try {
      if (editingItem) {
        await apiService.put(`/alternative-skus/${editingItem.id}`, values);
        message.success('Alternative SKU updated');
      } else {
        await apiService.post('/alternative-skus', {
          ...values,
          productId
        });
        message.success('Alternative SKU added');
      }
      setModalVisible(false);
      fetchSKUs();
    } catch (error: any) {
      message.error(error.response?.data?.error || 'Failed to save SKU');
    }
  };

  const columns = [
    {
      title: 'Channel',
      dataIndex: 'channelType',
      key: 'channelType',
      render: (text: string) => <Tag color="blue">{text}</Tag>
    },
    {
      title: 'Channel SKU',
      dataIndex: 'channelSKU',
      key: 'channelSKU',
      render: (text: string) => <strong>{text}</strong>
    },
    {
      title: 'Type',
      dataIndex: 'skuType',
      key: 'skuType',
      render: (text: string) => text ? <Tag>{text}</Tag> : '-'
    },
    {
      title: 'Status',
      key: 'status',
      render: (_: any, record: AlternativeSKU) => (
        <Space>
          {record.isPrimary && <Tag color="gold">Primary</Tag>}
          <Tag color={record.isActive ? 'green' : 'red'}>
            {record.isActive ? 'Active' : 'Inactive'}
          </Tag>
        </Space>
      )
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, record: AlternativeSKU) => (
        <Space>
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            Edit
          </Button>
          <Button
            type="link"
            size="small"
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDelete(record.id)}
          >
            Delete
          </Button>
        </Space>
      )
    }
  ];

  // Group SKUs by channel
  const grouped = skus.reduce((acc: any, sku) => {
    if (!acc[sku.channelType]) {
      acc[sku.channelType] = [];
    }
    acc[sku.channelType].push(sku);
    return acc;
  }, {});

  return (
    <Card
      title="Alternative SKUs (Marketplace Mappings)"
      extra={
        <Space>
          <Button
            icon={<AmazonOutlined />}
            onClick={handleQuickAddAmazon}
          >
            Quick Add Amazon Variants
          </Button>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleAdd}
          >
            Add SKU
          </Button>
        </Space>
      }
    >
      <div style={{ marginBottom: '16px' }}>
        <p style={{ color: '#666' }}>
          Map this product to different SKUs on various marketplaces.
          Amazon uses 3 SKUs: Normal ({productSKU}), BB Rotation ({productSKU}_BB), and MFN ({productSKU}_M).
        </p>
      </div>

      <Tabs
        items={[
          {
            key: 'all',
            label: `All (${skus.length})`,
            children: (
              <Table
                loading={loading}
                columns={columns}
                dataSource={skus}
                rowKey="id"
                pagination={false}
              />
            )
          },
          ...Object.keys(grouped).map(channel => ({
            key: channel,
            label: `${channel} (${grouped[channel].length})`,
            children: (
              <Table
                loading={loading}
                columns={columns}
                dataSource={grouped[channel]}
                rowKey="id"
                pagination={false}
              />
            )
          }))
        ]}
      />

      <Modal
        title={editingItem ? 'Edit Alternative SKU' : 'Add Alternative SKU'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        onOk={() => form.submit()}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{ isActive: true, isPrimary: false }}
        >
          <Form.Item
            name="channelType"
            label="Channel"
            rules={[{ required: true, message: 'Please select a channel' }]}
          >
            <Select placeholder="Select marketplace">
              {CHANNEL_TYPES.map(c => (
                <Select.Option key={c.value} value={c.value}>
                  {c.label}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="channelSKU"
            label="Channel SKU"
            rules={[{ required: true, message: 'Please enter channel SKU' }]}
          >
            <Input placeholder="SKU on this marketplace" />
          </Form.Item>

          <Form.Item
            name="skuType"
            label="SKU Type (Amazon only)"
          >
            <Select placeholder="Select type" allowClear>
              {SKU_TYPES.map(t => (
                <Select.Option key={t.value} value={t.value}>
                  {t.label}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="isPrimary"
            label="Primary SKU for this channel"
            valuePropName="checked"
          >
            <Select>
              <Select.Option value={true}>Yes</Select.Option>
              <Select.Option value={false}>No</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="isActive"
            label="Active"
            valuePropName="checked"
          >
            <Select>
              <Select.Option value={true}>Active</Select.Option>
              <Select.Option value={false}>Inactive</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="notes"
            label="Notes"
          >
            <Input.TextArea rows={3} />
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  );
}
