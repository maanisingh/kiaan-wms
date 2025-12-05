'use client';

import React, { useState, useEffect } from 'react';
import { Card, Table, Select, Button, Space, Tag, Collapse, DatePicker } from 'antd';
import { ReloadOutlined, CalendarOutlined, InboxOutlined } from '@ant-design/icons';
import apiService from '@/services/api';
import dayjs from 'dayjs';

const { RangePicker } = DatePicker;
const { Panel } = Collapse;

interface InventoryByBBD {
  product: {
    id: string;
    sku: string;
    name: string;
    brand?: { name: string };
  };
  byBestBeforeDate: {
    [key: string]: {
      bestBeforeDate: string | null;
      totalQuantity: number;
      availableQuantity: number;
      reservedQuantity: number;
      locations: Array<{
        locationCode: string;
        locationName: string;
        quantity: number;
        availableQuantity: number;
      }>;
    };
  };
}

export default function InventoryByBBDPage() {
  const [loading, setLoading] = useState(false);
  const [inventory, setInventory] = useState<InventoryByBBD[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<string | undefined>();
  const [selectedWarehouse, setSelectedWarehouse] = useState<string | undefined>();
  const [dateRange, setDateRange] = useState<any>(null);

  useEffect(() => {
    fetchProducts();
    fetchWarehouses();
  }, []);

  useEffect(() => {
    fetchInventory();
  }, [selectedProduct, selectedWarehouse, dateRange]);

  const fetchProducts = async () => {
    try {
      const data = await apiService.get('/products');
      setProducts(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to load products:', error);
    }
  };

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
      let url = '/inventory/by-best-before-date?';
      if (selectedProduct) url += `productId=${selectedProduct}&`;
      if (selectedWarehouse) url += `warehouseId=${selectedWarehouse}&`;
      if (dateRange && dateRange[0]) url += `minDate=${dateRange[0].format('YYYY-MM-DD')}&`;
      if (dateRange && dateRange[1]) url += `maxDate=${dateRange[1].format('YYYY-MM-DD')}&`;

      const response = await apiService.get(url);
      setInventory(response.inventory || []);
    } catch (error) {
      console.error('Failed to load inventory:', error);
    } finally {
      setLoading(false);
    }
  };

  const getBBDColor = (bbdDate: string | null) => {
    if (!bbdDate) return 'default';
    const days = dayjs(bbdDate).diff(dayjs(), 'days');
    if (days < 30) return 'red';
    if (days < 90) return 'orange';
    return 'green';
  };

  const columns = [
    {
      title: 'Product',
      key: 'product',
      render: (_: any, record: InventoryByBBD) => (
        <div>
          <div><strong>{record.product.sku}</strong></div>
          <div style={{ fontSize: '12px', color: '#666' }}>{record.product.name}</div>
          {record.product.brand && (
            <Tag color="blue">{record.product.brand.name}</Tag>
          )}
        </div>
      )
    },
    {
      title: 'Best Before Date',
      key: 'bbd',
      render: (_: any, record: InventoryByBBD) => {
        const bbdEntries = Object.entries(record.byBestBeforeDate);
        return (
          <Collapse>
            {bbdEntries.map(([bbdKey, data]) => (
              <Panel
                key={bbdKey}
                header={
                  <Space>
                    <CalendarOutlined />
                    <Tag color={getBBDColor(data.bestBeforeDate)}>
                      {data.bestBeforeDate
                        ? dayjs(data.bestBeforeDate).format('DD MMM YYYY')
                        : 'No BBD'}
                    </Tag>
                    <span>Qty: {data.availableQuantity}</span>
                  </Space>
                }
              >
                <div>
                  <p><strong>Total:</strong> {data.totalQuantity}</p>
                  <p><strong>Available:</strong> {data.availableQuantity}</p>
                  <p><strong>Reserved:</strong> {data.reservedQuantity}</p>
                  <p><strong>Locations:</strong></p>
                  <ul>
                    {data.locations.map((loc, idx) => (
                      <li key={idx}>
                        {loc.locationCode} - {loc.quantity} units
                      </li>
                    ))}
                  </ul>
                </div>
              </Panel>
            ))}
          </Collapse>
        );
      }
    },
    {
      title: 'Total Available',
      key: 'totalAvailable',
      render: (_: any, record: InventoryByBBD) => {
        const total = Object.values(record.byBestBeforeDate).reduce(
          (sum, bbd) => sum + bbd.availableQuantity,
          0
        );
        return <Tag color="green">{total}</Tag>;
      }
    },
    {
      title: 'BBD Count',
      key: 'bbdCount',
      render: (_: any, record: InventoryByBBD) => {
        return Object.keys(record.byBestBeforeDate).length;
      }
    }
  ];

  return (
    <div style={{ padding: '24px' }}>
      <Card
        title={
          <Space>
            <CalendarOutlined />
            Inventory by Best Before Date
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
            placeholder="Select Product"
            style={{ width: 250 }}
            allowClear
            showSearch
            optionFilterProp="children"
            value={selectedProduct}
            onChange={setSelectedProduct}
          >
            {products.map(p => (
              <Select.Option key={p.id} value={p.id}>
                {p.sku} - {p.name}
              </Select.Option>
            ))}
          </Select>

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

          <RangePicker
            value={dateRange}
            onChange={setDateRange}
            placeholder={['Min BBD', 'Max BBD']}
          />
        </Space>

        <Table
          loading={loading}
          columns={columns}
          dataSource={inventory}
          rowKey={(record) => record.product.id}
          pagination={{ pageSize: 20 }}
          locale={{
            emptyText: (
              <div style={{ textAlign: 'center', padding: '40px' }}>
                <InboxOutlined style={{ fontSize: 48, color: '#ccc' }} />
                <p>No inventory data found</p>
              </div>
            )
          }}
        />
      </Card>
    </div>
  );
}
