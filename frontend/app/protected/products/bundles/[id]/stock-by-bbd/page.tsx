'use client';

import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Space, Tag, Alert, Statistic, Row, Col, Collapse } from 'antd';
import { ArrowLeftOutlined, CalendarOutlined, WarningOutlined, InboxOutlined } from '@ant-design/icons';
import { useRouter, useParams } from 'next/navigation';
import apiService from '@/services/api';
import dayjs from 'dayjs';

const { Panel } = Collapse;

export default function BundleStockByBBDPage() {
  const router = useRouter();
  const params = useParams();
  const bundleId = params.id as string;

  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    fetchBundleStock();
  }, [bundleId]);

  const fetchBundleStock = async () => {
    try {
      setLoading(true);
      const response = await apiService.get(`/bundles/${bundleId}/stock-by-bbd`);
      setData(response);
    } catch (error) {
      console.error('Failed to load bundle stock:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !data) {
    return <div style={{ padding: '24px' }}>Loading...</div>;
  }

  const bbdColumns = [
    {
      title: 'Best Before Date',
      dataIndex: 'bestBeforeDate',
      key: 'bestBeforeDate',
      render: (date: string) => date ? dayjs(date).format('DD MMM YYYY') : 'No BBD'
    },
    {
      title: 'Bundle Quantity',
      dataIndex: 'bundleQuantity',
      key: 'bundleQuantity',
      render: (qty: number) => <Tag color="green">{qty}</Tag>
    }
  ];

  const componentColumns = [
    {
      title: 'Component',
      key: 'component',
      render: (_: any, record: any) => (
        <div>
          <div><strong>{record.sku}</strong></div>
          <div style={{ fontSize: '12px', color: '#666' }}>{record.name}</div>
        </div>
      )
    },
    {
      title: 'Required per Bundle',
      dataIndex: 'requiredPerBundle',
      key: 'requiredPerBundle',
      render: (qty: number) => <Tag>{qty}x</Tag>
    },
    {
      title: 'Total Possible Bundles',
      dataIndex: 'totalPossibleBundles',
      key: 'totalPossibleBundles',
      render: (qty: number, record: any) => {
        const isLimiting = record.productId === data.limitingComponent?.productId;
        return (
          <Tag color={isLimiting ? 'red' : 'blue'}>
            {qty} {isLimiting && '(Limiting)'}
          </Tag>
        );
      }
    },
    {
      title: 'Stock by BBD',
      key: 'stockByBBD',
      render: (_: any, record: any) => (
        <Collapse>
          {Object.entries(record.stockByBBD).map(([bbdKey, stock]: [string, any]) => (
            <Panel
              key={bbdKey}
              header={
                <Space>
                  <CalendarOutlined />
                  {bbdKey !== 'NO_BBD' ? dayjs(stock.bestBeforeDate).format('DD MMM YYYY') : 'No BBD'}
                  <Tag>Qty: {stock.availableQty}</Tag>
                  <Tag color="green">Bundles: {stock.possibleBundles}</Tag>
                </Space>
              }
            >
              <div>
                <p><strong>Total Quantity:</strong> {stock.totalQty}</p>
                <p><strong>Available:</strong> {stock.availableQty}</p>
                <p><strong>Possible Bundles:</strong> {stock.possibleBundles}</p>
              </div>
            </Panel>
          ))}
        </Collapse>
      )
    }
  ];

  const bbdData = Object.entries(data.bundlesByBestBeforeDate || {}).map(([bbd, info]: [string, any]) => ({
    bestBeforeDate: bbd !== 'NO_BBD' ? bbd : null,
    bundleQuantity: info.bundleQuantity
  }));

  return (
    <div style={{ padding: '24px' }}>
      <Button
        icon={<ArrowLeftOutlined />}
        onClick={() => router.push(`/protected/products/bundles/${bundleId}`)}
        style={{ marginBottom: '16px' }}
      >
        Back to Bundle
      </Button>

      <Row gutter={16} style={{ marginBottom: '16px' }}>
        <Col span={8}>
          <Card>
            <Statistic
              title="Bundle"
              value={data.bundleName}
              prefix={data.bundleSKU}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic
              title="Total Possible Bundles"
              value={data.totalPossibleBundles}
              valueStyle={{ color: '#3f8600' }}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic
              title="Limiting Component"
              value={data.limitingComponent?.sku || '-'}
              valueStyle={{ color: '#cf1322' }}
            />
          </Card>
        </Col>
      </Row>

      {data.limitingComponent && (
        <Alert
          type="warning"
          icon={<WarningOutlined />}
          message="Limiting Component Detected"
          description={`${data.limitingComponent.name} (${data.limitingComponent.sku}) is limiting bundle production.
            Need ${data.limitingComponent.requiredPerBundle} per bundle.`}
          style={{ marginBottom: '16px' }}
        />
      )}

      <Card title="Bundle Quantities by Best Before Date" style={{ marginBottom: '16px' }}>
        <Table
          columns={bbdColumns}
          dataSource={bbdData}
          pagination={false}
          size="small"
          locale={{
            emptyText: (
              <div style={{ textAlign: 'center', padding: '40px' }}>
                <InboxOutlined style={{ fontSize: 48, color: '#ccc' }} />
                <p>No bundles can be made with matching BBDs</p>
              </div>
            )
          }}
        />
      </Card>

      <Card title="Component Stock Details">
        <p style={{ marginBottom: '16px', color: '#666' }}>
          Each component's stock grouped by Best Before Date.
          For wholesale orders requiring same BBD, bundles can only be made from matching BBDs.
        </p>
        <Table
          columns={componentColumns}
          dataSource={data.componentStock || []}
          pagination={false}
          rowKey="productId"
        />
      </Card>
    </div>
  );
}
