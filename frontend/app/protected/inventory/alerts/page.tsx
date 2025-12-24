'use client';

import React, { useState, useEffect } from 'react';
import {
  Card,
  Row,
  Col,
  Table,
  Tag,
  Button,
  Space,
  Statistic,
  Alert,
  Select,
  Badge,
  Tooltip,
  Tabs,
  Empty,
  message,
  DatePicker,
} from 'antd';
import {
  WarningOutlined,
  ExclamationCircleOutlined,
  ClockCircleOutlined,
  ShoppingCartOutlined,
  ReloadOutlined,
  FilterOutlined,
  BellOutlined,
  CheckCircleOutlined,
} from '@ant-design/icons';
import { useAuthStore } from '@/store/authStore';
import Link from 'next/link';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);

const { Option } = Select;
const { RangePicker } = DatePicker;

interface StockAlert {
  id: string;
  type: 'low_stock' | 'expiring';
  severity: 'critical' | 'high' | 'medium' | 'low';
  productId: string;
  productName: string;
  sku: string;
  currentStock?: number;
  reorderPoint?: number;
  quantity?: number;
  expiryDate?: string;
  daysUntilExpiry?: number;
  location: string;
  createdAt: string;
}

export default function InventoryAlertsPage() {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [alerts, setAlerts] = useState<StockAlert[]>([]);
  const [filteredAlerts, setFilteredAlerts] = useState<StockAlert[]>([]);
  const [activeTab, setActiveTab] = useState('all');
  const [severityFilter, setSeverityFilter] = useState<string>('all');

  // Fetch alerts from API
  const fetchAlerts = async (type?: string) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const url = type ? `/api/inventory/alerts?type=${type}` : '/api/inventory/alerts';

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8010'}${url}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setAlerts(data);
        setFilteredAlerts(data);
      } else {
        message.error('Failed to fetch alerts');
      }
    } catch (error) {
      console.error('Fetch alerts error:', error);
      message.error('Error loading alerts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, []);

  // Apply filters
  useEffect(() => {
    let filtered = [...alerts];

    // Filter by tab
    if (activeTab === 'low_stock') {
      filtered = filtered.filter(a => a.type === 'low_stock');
    } else if (activeTab === 'expiring') {
      filtered = filtered.filter(a => a.type === 'expiring');
    }

    // Filter by severity
    if (severityFilter !== 'all') {
      filtered = filtered.filter(a => a.severity === severityFilter);
    }

    setFilteredAlerts(filtered);
  }, [alerts, activeTab, severityFilter]);

  const getSeverityColor = (severity: string) => {
    const colors = {
      critical: 'red',
      high: 'orange',
      medium: 'gold',
      low: 'blue',
    };
    return colors[severity as keyof typeof colors] || 'default';
  };

  const getSeverityIcon = (severity: string) => {
    const icons = {
      critical: <ExclamationCircleOutlined />,
      high: <WarningOutlined />,
      medium: <ClockCircleOutlined />,
      low: <BellOutlined />,
    };
    return icons[severity as keyof typeof icons] || <BellOutlined />;
  };

  // Statistics
  const stats = {
    total: alerts.length,
    critical: alerts.filter(a => a.severity === 'critical').length,
    high: alerts.filter(a => a.severity === 'high').length,
    medium: alerts.filter(a => a.severity === 'medium').length,
    lowStock: alerts.filter(a => a.type === 'low_stock').length,
    expiring: alerts.filter(a => a.type === 'expiring').length,
  };

  // Low Stock Alerts Table
  const lowStockColumns = [
    {
      title: 'Severity',
      dataIndex: 'severity',
      key: 'severity',
      width: 100,
      render: (severity: string) => (
        <Tag icon={getSeverityIcon(severity)} color={getSeverityColor(severity)}>
          {severity.toUpperCase()}
        </Tag>
      ),
      sorter: (a: StockAlert, b: StockAlert) => {
        const order = { critical: 0, high: 1, medium: 2, low: 3 };
        return order[a.severity] - order[b.severity];
      },
    },
    {
      title: 'Product',
      dataIndex: 'productName',
      key: 'productName',
      render: (text: string, record: StockAlert) => (
        <div>
          <div className="font-medium">{text}</div>
          <div className="text-xs text-gray-500">SKU: {record.sku}</div>
        </div>
      ),
    },
    {
      title: 'Location',
      dataIndex: 'location',
      key: 'location',
      width: 120,
    },
    {
      title: 'Current Stock',
      dataIndex: 'currentStock',
      key: 'currentStock',
      width: 120,
      render: (value: number, record: StockAlert) => (
        <div>
          <div className={`font-bold ${value < 10 ? 'text-red-600' : value < 25 ? 'text-orange-600' : 'text-blue-600'}`}>
            {value} units
          </div>
          <div className="text-xs text-gray-500">Reorder: {record.reorderPoint}</div>
        </div>
      ),
      sorter: (a: StockAlert, b: StockAlert) => (a.currentStock || 0) - (b.currentStock || 0),
    },
    {
      title: 'Stock Deficit',
      key: 'deficit',
      width: 120,
      render: (record: StockAlert) => {
        const deficit = (record.reorderPoint || 0) - (record.currentStock || 0);
        return (
          <Tag color={deficit > 20 ? 'red' : deficit > 10 ? 'orange' : 'gold'}>
            -{deficit} units
          </Tag>
        );
      },
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 200,
      render: (record: StockAlert) => (
        <Space>
          <Tooltip title="Create Purchase Order">
            <Link href="/protected/purchase-orders/new">
              <Button type="primary" size="small" icon={<ShoppingCartOutlined />}>
                Reorder
              </Button>
            </Link>
          </Tooltip>
          <Tooltip title="Adjust Stock">
            <Link href="/protected/inventory/adjustments">
              <Button size="small">Adjust</Button>
            </Link>
          </Tooltip>
        </Space>
      ),
    },
  ];

  // Expiring Items Table
  const expiringColumns = [
    {
      title: 'Severity',
      dataIndex: 'severity',
      key: 'severity',
      width: 100,
      render: (severity: string) => (
        <Tag icon={getSeverityIcon(severity)} color={getSeverityColor(severity)}>
          {severity.toUpperCase()}
        </Tag>
      ),
      sorter: (a: StockAlert, b: StockAlert) => {
        const order = { critical: 0, high: 1, medium: 2, low: 3 };
        return order[a.severity] - order[b.severity];
      },
    },
    {
      title: 'Product',
      dataIndex: 'productName',
      key: 'productName',
      render: (text: string, record: StockAlert) => (
        <div>
          <div className="font-medium">{text}</div>
          <div className="text-xs text-gray-500">SKU: {record.sku}</div>
        </div>
      ),
    },
    {
      title: 'Location',
      dataIndex: 'location',
      key: 'location',
      width: 120,
    },
    {
      title: 'Quantity',
      dataIndex: 'quantity',
      key: 'quantity',
      width: 100,
      render: (value: number) => `${value} units`,
    },
    {
      title: 'Expiry Date',
      dataIndex: 'expiryDate',
      key: 'expiryDate',
      width: 150,
      render: (date: string) => (
        <div>
          <div>{dayjs(date).format('MMM DD, YYYY')}</div>
          <div className="text-xs text-gray-500">{dayjs(date).fromNow()}</div>
        </div>
      ),
      sorter: (a: StockAlert, b: StockAlert) => {
        return new Date(a.expiryDate || '').getTime() - new Date(b.expiryDate || '').getTime();
      },
    },
    {
      title: 'Days Until Expiry',
      dataIndex: 'daysUntilExpiry',
      key: 'daysUntilExpiry',
      width: 150,
      render: (days: number) => (
        <Tag color={days < 7 ? 'red' : days < 30 ? 'orange' : 'gold'}>
          {days} day{days !== 1 ? 's' : ''}
        </Tag>
      ),
      sorter: (a: StockAlert, b: StockAlert) => (a.daysUntilExpiry || 0) - (b.daysUntilExpiry || 0),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 200,
      render: (record: StockAlert) => (
        <Space>
          <Tooltip title="Move to clearance">
            <Button type="primary" size="small" danger>
              Clearance
            </Button>
          </Tooltip>
          <Tooltip title="Create adjustment">
            <Link href="/protected/inventory/adjustments">
              <Button size="small">Adjust</Button>
            </Link>
          </Tooltip>
        </Space>
      ),
    },
  ];

  const tabItems = [
    {
      key: 'all',
      label: (
        <span className="flex items-center gap-2">
          <BellOutlined />
          All Alerts
          <Badge count={stats.total} style={{ backgroundColor: '#52c41a' }} />
        </span>
      ),
      children: null,
    },
    {
      key: 'low_stock',
      label: (
        <span className="flex items-center gap-2">
          <WarningOutlined />
          Low Stock
          <Badge count={stats.lowStock} style={{ backgroundColor: '#faad14' }} />
        </span>
      ),
      children: null,
    },
    {
      key: 'expiring',
      label: (
        <span className="flex items-center gap-2">
          <ClockCircleOutlined />
          Expiring Items
          <Badge count={stats.expiring} style={{ backgroundColor: '#ff4d4f' }} />
        </span>
      ),
      children: null,
    },
  ];

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
              <BellOutlined className="text-orange-600" />
              Stock Alerts
            </h1>
            <p className="text-gray-600 mt-1">Monitor low stock and expiring inventory items</p>
          </div>
          <Space>
            <Button icon={<ReloadOutlined />} onClick={() => fetchAlerts()}>
              Refresh
            </Button>
            <Link href="/protected/inventory/adjustments">
              <Button type="primary">Create Adjustment</Button>
            </Link>
          </Space>
        </div>
      </div>

      {/* Alert Summary Banner */}
      {stats.critical > 0 && (
        <Alert
          message={`Critical Alert: ${stats.critical} item${stats.critical > 1 ? 's' : ''} require immediate attention`}
          type="error"
          showIcon
          icon={<ExclamationCircleOutlined />}
          className="mb-4"
          action={
            <Button size="small" danger onClick={() => setSeverityFilter('critical')}>
              View Critical
            </Button>
          }
        />
      )}

      {/* KPI Statistics */}
      <Row gutter={[16, 16]} className="mb-6">
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Total Alerts"
              value={stats.total}
              prefix={<BellOutlined className="text-blue-600" />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Critical"
              value={stats.critical}
              prefix={<ExclamationCircleOutlined className="text-red-600" />}
              valueStyle={{ color: '#ff4d4f' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Low Stock Items"
              value={stats.lowStock}
              prefix={<WarningOutlined className="text-orange-600" />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Expiring Soon"
              value={stats.expiring}
              prefix={<ClockCircleOutlined className="text-orange-600" />}
              valueStyle={{ color: '#fa8c16' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Filters and Tabs */}
      <Card>
        <div className="mb-4 flex justify-between items-center">
          <Tabs activeKey={activeTab} onChange={setActiveTab} items={tabItems} />

          <Space>
            <Select
              value={severityFilter}
              onChange={setSeverityFilter}
              style={{ width: 150 }}
              placeholder="Filter by severity"
            >
              <Option value="all">All Severities</Option>
              <Option value="critical">
                <Tag color="red">Critical</Tag>
              </Option>
              <Option value="high">
                <Tag color="orange">High</Tag>
              </Option>
              <Option value="medium">
                <Tag color="gold">Medium</Tag>
              </Option>
              <Option value="low">
                <Tag color="blue">Low</Tag>
              </Option>
            </Select>
          </Space>
        </div>

        {/* Alerts Table */}
        {activeTab === 'all' && (
          <Table
            dataSource={filteredAlerts}
            columns={
              filteredAlerts.length > 0 && filteredAlerts[0].type === 'low_stock'
                ? lowStockColumns
                : filteredAlerts.length > 0 && filteredAlerts[0].type === 'expiring'
                ? expiringColumns
                : [
                    ...lowStockColumns.slice(0, 4),
                    {
                      title: 'Type',
                      dataIndex: 'type',
                      key: 'type',
                      width: 120,
                      render: (type: string) => (
                        <Tag color={type === 'low_stock' ? 'orange' : 'red'}>
                          {type === 'low_stock' ? 'Low Stock' : 'Expiring'}
                        </Tag>
                      ),
                    },
                    ...lowStockColumns.slice(4),
                  ]
            }
            rowKey="id"
            loading={loading}
            pagination={{
              pageSize: 20,
              showSizeChanger: true,
              showTotal: (total) => `Total ${total} alerts`,
            }}
            locale={{
              emptyText: (
                <Empty
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  description={
                    <span>
                      <CheckCircleOutlined className="text-green-600 text-2xl mb-2" />
                      <br />
                      No alerts! All inventory levels are healthy.
                    </span>
                  }
                />
              ),
            }}
          />
        )}

        {activeTab === 'low_stock' && (
          <Table
            dataSource={filteredAlerts}
            columns={lowStockColumns}
            rowKey="id"
            loading={loading}
            pagination={{
              pageSize: 20,
              showSizeChanger: true,
              showTotal: (total) => `Total ${total} low stock items`,
            }}
            locale={{
              emptyText: (
                <Empty
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  description="No low stock items"
                />
              ),
            }}
          />
        )}

        {activeTab === 'expiring' && (
          <Table
            dataSource={filteredAlerts}
            columns={expiringColumns}
            rowKey="id"
            loading={loading}
            pagination={{
              pageSize: 20,
              showSizeChanger: true,
              showTotal: (total) => `Total ${total} expiring items`,
            }}
            locale={{
              emptyText: (
                <Empty
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  description="No expiring items"
                />
              ),
            }}
          />
        )}
      </Card>

      {/* Action Summary */}
      <Card className="mt-6" title="Recommended Actions">
        <Row gutter={[16, 16]}>
          <Col xs={24} md={12}>
            <div className="p-4 bg-orange-50 rounded-lg">
              <div className="flex items-center gap-3 mb-2">
                <ShoppingCartOutlined className="text-2xl text-orange-600" />
                <h3 className="text-lg font-semibold">Low Stock Items</h3>
              </div>
              <p className="text-gray-600 mb-3">
                {stats.lowStock} item{stats.lowStock !== 1 ? 's are' : ' is'} below reorder point
              </p>
              <Link href="/purchase-orders/new">
                <Button type="primary">Create Purchase Order</Button>
              </Link>
            </div>
          </Col>
          <Col xs={24} md={12}>
            <div className="p-4 bg-red-50 rounded-lg">
              <div className="flex items-center gap-3 mb-2">
                <ClockCircleOutlined className="text-2xl text-red-600" />
                <h3 className="text-lg font-semibold">Expiring Items</h3>
              </div>
              <p className="text-gray-600 mb-3">
                {stats.expiring} item{stats.expiring !== 1 ? 's are' : ' is'} expiring within 90 days
              </p>
              <Space>
                <Button type="primary" danger>
                  Create Clearance Sale
                </Button>
                <Link href="/protected/inventory/adjustments">
                  <Button>Adjust Stock</Button>
                </Link>
              </Space>
            </div>
          </Col>
        </Row>
      </Card>
    </div>
  );
}
