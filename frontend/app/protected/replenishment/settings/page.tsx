'use client';

import React, { useState, useEffect } from 'react';

import { Table, Card, Tag, Statistic, Row, Col, Button, Space, Modal, Form, Select, InputNumber, Switch, message } from 'antd';
import { SettingOutlined, CheckCircleOutlined, CloseCircleOutlined, SyncOutlined, PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import apiService from '@/services/api';

export default function ReplenishmentSettingsPage() {
  const [configs, setConfigs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedConfig, setSelectedConfig] = useState<any>(null);
  const [form] = Form.useForm();
  const [products, setProducts] = useState<any[]>([]);

  useEffect(() => {
    fetchConfigs();
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const data = await apiService.get('/api/products');
      setProducts(data || []);
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  const fetchConfigs = async () => {
    setLoading(true);
    try {
      const data = await apiService.get('/api/replenishment/configs');
      setConfigs(data || []);
    } catch (error) {
      console.error('Error fetching configs:', error);
      message.error('Failed to fetch replenishment settings');
      setConfigs([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAddConfig = () => {
    setIsEditMode(false);
    setSelectedConfig(null);
    form.resetFields();
    setIsModalVisible(true);
  };

  const handleEditConfig = (record: any) => {
    setIsEditMode(true);
    setSelectedConfig(record);
    form.setFieldsValue({
      productId: record.productId,
      minStockLevel: record.minStockLevel,
      maxStockLevel: record.maxStockLevel,
      reorderPoint: record.reorderPoint,
      reorderQuantity: record.reorderQuantity,
      autoCreateTasks: record.autoCreateTasks,
      enabled: record.enabled,
    });
    setIsModalVisible(true);
  };

  const handleDeleteConfig = async (configId: string) => {
    Modal.confirm({
      title: 'Delete Configuration',
      content: 'Are you sure you want to delete this replenishment configuration?',
      okText: 'Delete',
      okType: 'danger',
      onOk: async () => {
        try {
          await apiService.delete(`/api/replenishment/configs/${configId}`);
          message.success('Configuration deleted successfully');
          fetchConfigs();
        } catch (error) {
          message.error('Failed to delete configuration');
        }
      },
    });
  };

  const handleSubmit = async (values: any) => {
    try {
      const payload = {
        ...values,
        autoCreateTasks: values.autoCreateTasks || false,
        enabled: values.enabled !== undefined ? values.enabled : true,
      };

      if (isEditMode && selectedConfig) {
        await apiService.put(`/api/replenishment/configs/${selectedConfig.id}`, payload);
        message.success('Configuration updated successfully');
      } else {
        await apiService.post('/api/replenishment/configs', payload);
        message.success('Configuration created successfully');
      }
      setIsModalVisible(false);
      form.resetFields();
      fetchConfigs();
    } catch (error) {
      message.error(`Failed to ${isEditMode ? 'update' : 'create'} configuration`);
    }
  };

  const columns = [
    {
      title: 'Product',
      dataIndex: ['product', 'name'],
      key: 'product',
      width: 250,
    },
    {
      title: 'Brand',
      dataIndex: ['product', 'brand', 'name'],
      key: 'brand',
      width: 150,
    },
    {
      title: 'Min Level',
      dataIndex: 'minStockLevel',
      key: 'min',
      width: 100,
      align: 'center' as const,
    },
    {
      title: 'Max Level',
      dataIndex: 'maxStockLevel',
      key: 'max',
      width: 100,
      align: 'center' as const,
    },
    {
      title: 'Reorder Point',
      dataIndex: 'reorderPoint',
      key: 'reorder',
      width: 120,
      align: 'center' as const,
    },
    {
      title: 'Reorder Qty',
      dataIndex: 'reorderQuantity',
      key: 'qty',
      width: 120,
      align: 'center' as const,
    },
    {
      title: 'Auto Tasks',
      dataIndex: 'autoCreateTasks',
      key: 'auto',
      width: 120,
      align: 'center' as const,
      render: (auto: boolean) => (
        auto ? (
          <Tag color="green" icon={<CheckCircleOutlined />}>Enabled</Tag>
        ) : (
          <Tag color="default" icon={<CloseCircleOutlined />}>Disabled</Tag>
        )
      ),
    },
    {
      title: 'Status',
      dataIndex: 'enabled',
      key: 'enabled',
      width: 100,
      align: 'center' as const,
      render: (enabled: boolean) => (
        enabled ? (
          <Tag color="success">Active</Tag>
        ) : (
          <Tag color="error">Inactive</Tag>
        )
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 150,
      fixed: 'right' as const,
      render: (_: any, record: any) => (
        <Space size="small">
          <Button
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEditConfig(record)}
          />
          <Button
            size="small"
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDeleteConfig(record.id)}
          />
        </Space>
      ),
    },
  ];

  const enabledCount = configs.filter((c: any) => c.enabled).length;
  const autoTasksCount = configs.filter((c: any) => c.autoCreateTasks).length;

  return (
    <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold">Replenishment Settings</h1>
            <p className="text-gray-500">Configure proactive replenishment limits and reorder points</p>
          </div>
          <Space>
            <Button onClick={fetchConfigs} icon={<SyncOutlined />}>
              Refresh
            </Button>
            <Button type="primary" onClick={handleAddConfig} icon={<PlusOutlined />}>
              Add Configuration
            </Button>
          </Space>
        </div>

        <Row gutter={16} className="mb-6">
          <Col span={8}>
            <Card>
              <Statistic
                title="Total Configured"
                value={configs.length}
                prefix={<SettingOutlined />}
              />
            </Card>
          </Col>
          <Col span={8}>
            <Card>
              <Statistic
                title="Active Configs"
                value={enabledCount}
                valueStyle={{ color: '#3f8600' }}
                prefix={<CheckCircleOutlined />}
              />
            </Card>
          </Col>
          <Col span={8}>
            <Card>
              <Statistic
                title="Auto-Task Enabled"
                value={autoTasksCount}
                valueStyle={{ color: '#1890ff' }}
              />
            </Card>
          </Col>
        </Row>

        <Card>
          <Table
            columns={columns}
            dataSource={configs}
            loading={loading}
            rowKey="id"
            pagination={{ pageSize: 20 }}
            scroll={{ x: 1200 }}
            expandable={{
              expandedRowRender: (record: any) => (
                <div className="p-4 bg-gray-50">
                  <h4 className="font-semibold mb-2">Configuration Details:</h4>
                  <ul className="list-none space-y-1">
                    <li><strong>Product SKU:</strong> {record.product?.sku || '-'}</li>
                    <li><strong>Alert Threshold:</strong> When stock drops below {record.reorderPoint} units</li>
                    <li><strong>Target Range:</strong> Maintain between {record.minStockLevel} and {record.maxStockLevel} units</li>
                    <li><strong>Suggested Reorder:</strong> {record.reorderQuantity} units</li>
                    <li><strong>Automation:</strong> {record.autoCreateTasks ? 'Tasks created automatically' : 'Manual task creation'}</li>
                  </ul>
                </div>
              ),
            }}
          />
        </Card>

        <Modal
          title={isEditMode ? 'Edit Replenishment Configuration' : 'Create Replenishment Configuration'}
          open={isModalVisible}
          onCancel={() => {
            setIsModalVisible(false);
            form.resetFields();
          }}
          onOk={() => form.submit()}
          width={600}
        >
          <Form form={form} layout="vertical" onFinish={handleSubmit}>
            <Form.Item
              label="Product"
              name="productId"
              rules={[{ required: true, message: 'Please select a product' }]}
            >
              <Select
                showSearch
                placeholder="Select a product"
                optionFilterProp="children"
                filterOption={(input, option) =>
                  (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                }
                options={products.map(p => ({
                  value: p.id,
                  label: `${p.name} (${p.sku})`,
                }))}
              />
            </Form.Item>
            <Form.Item
              label="Minimum Stock Level"
              name="minStockLevel"
              rules={[{ required: true, message: 'Please enter minimum stock level' }]}
              tooltip="Alert when stock goes below this level"
            >
              <InputNumber min={0} style={{ width: '100%' }} placeholder="Minimum stock" />
            </Form.Item>
            <Form.Item
              label="Maximum Stock Level"
              name="maxStockLevel"
              rules={[{ required: true, message: 'Please enter maximum stock level' }]}
              tooltip="Target level to replenish to"
            >
              <InputNumber min={0} style={{ width: '100%' }} placeholder="Maximum stock" />
            </Form.Item>
            <Form.Item
              label="Reorder Point"
              name="reorderPoint"
              rules={[{ required: true, message: 'Please enter reorder point' }]}
              tooltip="Trigger replenishment when stock reaches this level"
            >
              <InputNumber min={0} style={{ width: '100%' }} placeholder="Reorder when stock reaches" />
            </Form.Item>
            <Form.Item
              label="Reorder Quantity"
              name="reorderQuantity"
              rules={[{ required: true, message: 'Please enter reorder quantity' }]}
              tooltip="Default quantity to order when replenishing"
            >
              <InputNumber min={1} style={{ width: '100%' }} placeholder="Quantity to reorder" />
            </Form.Item>
            <Form.Item
              label="Auto-Create Tasks"
              name="autoCreateTasks"
              valuePropName="checked"
              tooltip="Automatically create replenishment tasks when stock falls below reorder point"
            >
              <Switch />
            </Form.Item>
            <Form.Item
              label="Enabled"
              name="enabled"
              valuePropName="checked"
              initialValue={true}
            >
              <Switch />
            </Form.Item>
          </Form>
        </Modal>
      </div>
      );
}
