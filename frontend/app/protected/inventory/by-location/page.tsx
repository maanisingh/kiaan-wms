'use client';

import React, { useState, useEffect } from 'react';
import { Card, Table, Select, Button, Space, Tag, Alert, Badge } from 'antd';
import { ReloadOutlined, EnvironmentOutlined, WarningOutlined } from '@ant-design/icons';
import apiService from '@/services/api';

interface InventoryByLocation {
  location: {
    id: string;
    code: string;
    name: string;
    locationType: 'PICK' | 'BULK' | 'BULK_LW';
    isHeatSensitive: boolean;
    maxWeight?: number;
    pickSequence?: number;
    zone?: {
      name: string;
      code: string;
    };
  };
  products: Array<{
    product: {
      sku: string;
      name: string;
      isHeatSensitive: boolean;
      weight?: number;
    };
    quantity: number;
    availableQuantity: number;
    bestBeforeDate?: string;
    lotNumber?: string;
  }>;
  totalItems: number;
  utilizationWarnings: Array<{
    type: string;
    message: string;
    severity: string;
  }>;
}

export default function InventoryByLocationPage() {
  const [loading, setLoading] = useState(false);
  const [locations, setLocations] = useState<InventoryByLocation[]>([]);
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [selectedWarehouse, setSelectedWarehouse] = useState<string | undefined>();
  const [selectedLocationType, setSelectedLocationType] = useState<string | undefined>();

  useEffect(() => {
    fetchWarehouses();
  }, []);

  useEffect(() => {
    fetchInventory();
  }, [selectedWarehouse, selectedLocationType]);

  const fetchWarehouses = async () => {
    try {
      const data = await apiService.get('/warehouses');
      setWarehouses(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to load warehouses:', error);
    }
  };

  const fetchInventory = async () => {
    try {
      setLoading(true);
      let url = '/inventory/by-location?';
      if (selectedWarehouse) url += `warehouseId=${selectedWarehouse}&`;
      if (selectedLocationType) url += `locationType=${selectedLocationType}&`;

      const response = await apiService.get(url);
      setLocations(response.locations || []);
    } catch (error) {
      console.error('Failed to load inventory:', error);
    } finally {
      setLoading(false);
    }
  };

  const getLocationTypeColor = (type: string) => {
    switch (type) {
      case 'PICK': return 'green';
      case 'BULK': return 'blue';
      case 'BULK_LW': return 'orange';
      default: return 'default';
    }
  };

  const expandedRowRender = (record: InventoryByLocation) => {
    const productColumns = [
      {
        title: 'Product',
        key: 'product',
        render: (_: any, item: any) => (
          <div>
            <div><strong>{item.product.sku}</strong></div>
            <div style={{ fontSize: '12px', color: '#666' }}>{item.product.name}</div>
            {item.product.isHeatSensitive && (
              <Tag color="red" icon={<WarningOutlined />}>Heat Sensitive</Tag>
            )}
          </div>
        )
      },
      {
        title: 'Quantity',
        dataIndex: 'quantity',
        key: 'quantity',
        render: (qty: number) => <Tag color="blue">{qty}</Tag>
      },
      {
        title: 'Available',
        dataIndex: 'availableQuantity',
        key: 'availableQuantity',
        render: (qty: number) => <Tag color="green">{qty}</Tag>
      },
      {
        title: 'Lot/Batch',
        dataIndex: 'lotNumber',
        key: 'lotNumber',
        render: (lot: string) => lot || '-'
      },
      {
        title: 'Weight',
        key: 'weight',
        render: (_: any, item: any) => {
          if (!item.product.weight) return '-';
          const totalWeight = item.product.weight * item.quantity;
          return `${totalWeight.toFixed(2)} kg`;
        }
      }
    ];

    return (
      <div>
        {record.utilizationWarnings.length > 0 && (
          <div style={{ marginBottom: '16px' }}>
            {record.utilizationWarnings.map((warning, idx) => (
              <Alert
                key={idx}
                type={warning.severity === 'ERROR' ? 'error' : 'warning'}
                message={warning.message}
                showIcon
                style={{ marginBottom: '8px' }}
              />
            ))}
          </div>
        )}
        <Table
          columns={productColumns}
          dataSource={record.products}
          pagination={false}
          size="small"
        />
      </div>
    );
  };

  const columns = [
    {
      title: 'Location',
      key: 'location',
      render: (_: any, record: InventoryByLocation) => (
        <div>
          <div>
            <strong>{record.location.code}</strong>
            {record.location.pickSequence && (
              <Tag color="purple" style={{ marginLeft: '8px' }}>
                Seq: {record.location.pickSequence}
              </Tag>
            )}
          </div>
          <div style={{ fontSize: '12px', color: '#666' }}>{record.location.name}</div>
        </div>
      )
    },
    {
      title: 'Type',
      key: 'type',
      render: (_: any, record: InventoryByLocation) => (
        <Tag color={getLocationTypeColor(record.location.locationType)}>
          {record.location.locationType}
        </Tag>
      )
    },
    {
      title: 'Zone',
      key: 'zone',
      render: (_: any, record: InventoryByLocation) =>
        record.location.zone ? record.location.zone.name : '-'
    },
    {
      title: 'Properties',
      key: 'properties',
      render: (_: any, record: InventoryByLocation) => (
        <Space>
          {record.location.isHeatSensitive && (
            <Tag color="red" icon={<WarningOutlined />}>Hot Location</Tag>
          )}
          {record.location.maxWeight && (
            <Tag>Max: {record.location.maxWeight}kg</Tag>
          )}
        </Space>
      )
    },
    {
      title: 'Total Items',
      dataIndex: 'totalItems',
      key: 'totalItems',
      render: (count: number) => (
        <Badge count={count} showZero style={{ backgroundColor: '#52c41a' }} />
      )
    },
    {
      title: 'Product Count',
      key: 'productCount',
      render: (_: any, record: InventoryByLocation) => record.products.length
    },
    {
      title: 'Warnings',
      key: 'warnings',
      render: (_: any, record: InventoryByLocation) => {
        if (record.utilizationWarnings.length === 0) return null;
        return (
          <Badge
            count={record.utilizationWarnings.length}
            style={{ backgroundColor: '#ff4d4f' }}
          />
        );
      }
    }
  ];

  // Sort by pick sequence if available
  const sortedLocations = [...locations].sort((a, b) => {
    const seqA = a.location.pickSequence || 999999;
    const seqB = b.location.pickSequence || 999999;
    return seqA - seqB;
  });

  return (
    <div style={{ padding: '24px' }}>
      <Card
        title={
          <Space>
            <EnvironmentOutlined />
            Inventory by Location
          </Space>
        }
        extra={
          <Button
            icon={<ReloadOutlined />}
            onClick={fetchInventory}
            loading={loading}
          >
            Refresh
          </Button>
        }
      >
        <Space style={{ marginBottom: '16px', width: '100%', flexWrap: 'wrap' }}>
          <Select
            placeholder="Select Warehouse"
            style={{ width: 200 }}
            allowClear
            value={selectedWarehouse}
            onChange={setSelectedWarehouse}
          >
            {warehouses.map(w => (
              <Select.Option key={w.id} value={w.id}>
                {w.name}
              </Select.Option>
            ))}
          </Select>

          <Select
            placeholder="Location Type"
            style={{ width: 150 }}
            allowClear
            value={selectedLocationType}
            onChange={setSelectedLocationType}
          >
            <Select.Option value="PICK">Pick Locations</Select.Option>
            <Select.Option value="BULK">Bulk Storage</Select.Option>
            <Select.Option value="BULK_LW">Bulk Light Weight</Select.Option>
          </Select>
        </Space>

        <Table
          loading={loading}
          columns={columns}
          dataSource={sortedLocations}
          rowKey={(record) => record.location.id}
          expandable={{
            expandedRowRender,
            rowExpandable: (record) => record.products.length > 0
          }}
          pagination={{ pageSize: 20 }}
        />
      </Card>
    </div>
  );
}
