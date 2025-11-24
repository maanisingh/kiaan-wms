'use client';

import React, { useState, useEffect } from 'react';

import { Table, Card, Tag, Statistic, Row, Col } from 'antd';
import { SettingOutlined, CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';
import apiService from '@/services/api';

export default function ReplenishmentSettingsPage() {
  const [configs, setConfigs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchConfigs();
  }, []);

  const fetchConfigs = async () => {
    setLoading(true);
    try {
      const data = await apiService.get('/replenishment/config');
      setConfigs(data || []);
    } catch (error) {
      console.error('Error fetching configs:', error);
      setConfigs([]);
    } finally {
      setLoading(false);
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
  ];

  const enabledCount = configs.filter((c: any) => c.enabled).length;
  const autoTasksCount = configs.filter((c: any) => c.autoCreateTasks).length;

  return (
    <div className="p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">Replenishment Settings</h1>
          <p className="text-gray-500">Configure proactive replenishment limits and reorder points</p>
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
      </div>
      );
}
