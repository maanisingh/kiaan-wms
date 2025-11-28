'use client';

import React, { useState, useEffect } from 'react';
import { Card, Table, Tag, Button, Statistic, Row, Col, Spin, Alert, Input, Select, Progress, Modal, Form, InputNumber, DatePicker, App, Tooltip, Popconfirm, Space } from 'antd';
import {
  ArrowLeftOutlined,
  DatabaseOutlined,
  InboxOutlined,
  WarningOutlined,
  CheckCircleOutlined,
  SearchOutlined,
  ReloadOutlined,
  LoadingOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  LinkOutlined,
  ExportOutlined,
} from '@ant-design/icons';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import dayjs from 'dayjs';
import apiService from '@/services/api';

const { Search } = Input;
const { Option } = Select;

interface Client {
  id: string;
  name: string;
  code: string;
}

interface InventoryItem {
  id: string;
  productId: string;
  productName: string;
  productSku: string;
  warehouseId?: string;
  warehouseName?: string;
  locationId?: string;
  locationCode?: string;
  lotNumber?: string;
  batchNumber?: string;
  serialNumber?: string;
  bestBeforeDate?: string;
  receivedDate?: string;
  quantity: number;
  availableQuantity: number;
  reservedQuantity: number;
  damagedQuantity?: number;
  reorderLevel?: number;
  maxStock?: number;
  unitCost?: number;
  status: string;
  createdAt: string;
}

interface Stats {
  totalSKUs: number;
  totalUnits: number;
  availableUnits: number;
  reservedUnits: number;
  lowStockItems: number;
  outOfStockItems: number;
  totalValue: number;
}

interface Warehouse {
  id: string;
  name: string;
  code: string;
}

interface Location {
  id: string;
  code: string;
  warehouseId: string;
}

export default function ClientInventoryPage() {
  const { message } = App.useApp();
  const router = useRouter();
  const params = useParams();
  const [client, setClient] = useState<Client | null>(null);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Modal states
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [saving, setSaving] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    if (params.id) {
      fetchData();
      fetchWarehouses();
    }
  }, [params.id]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch client-specific inventory using the new endpoint
      const response = await apiService.get(`/clients/${params.id}/inventory`);
      setClient(response.client);
      setInventory(response.inventory || []);
      setStats(response.stats);
    } catch (err: any) {
      console.error('Failed to fetch data:', err);
      setError(err.message || 'Failed to load inventory');
    } finally {
      setLoading(false);
    }
  };

  const fetchWarehouses = async () => {
    try {
      const data = await apiService.get('/warehouses');
      setWarehouses(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to fetch warehouses:', err);
    }
  };

  const fetchLocations = async (warehouseId: string) => {
    try {
      const data = await apiService.get(`/locations?warehouseId=${warehouseId}`);
      setLocations(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to fetch locations:', err);
    }
  };

  const handleAdd = () => {
    setEditingItem(null);
    form.resetFields();
    setModalOpen(true);
  };

  const handleEdit = (record: InventoryItem) => {
    setEditingItem(record);
    const warehouse = warehouses.find(w => w.id === record.warehouseId);
    if (warehouse) {
      fetchLocations(warehouse.id);
    }
    form.setFieldsValue({
      ...record,
      bestBeforeDate: record.bestBeforeDate ? dayjs(record.bestBeforeDate) : null,
    });
    setModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await apiService.delete(`/clients/${params.id}/inventory/${id}`);
      message.success('Inventory item deleted successfully');
      fetchData();
    } catch (err: any) {
      message.error(err.message || 'Failed to delete inventory item');
    }
  };

  const handleSave = async (values: any) => {
    try {
      setSaving(true);
      const data = {
        ...values,
        bestBeforeDate: values.bestBeforeDate?.toISOString(),
        warehouseName: warehouses.find(w => w.id === values.warehouseId)?.name,
        locationCode: locations.find(l => l.id === values.locationId)?.code,
      };

      if (editingItem) {
        await apiService.put(`/clients/${params.id}/inventory/${editingItem.id}`, data);
        message.success('Inventory item updated successfully');
      } else {
        await apiService.post(`/clients/${params.id}/inventory`, data);
        message.success('Inventory item added successfully');
      }
      setModalOpen(false);
      fetchData();
    } catch (err: any) {
      message.error(err.message || 'Failed to save inventory item');
    } finally {
      setSaving(false);
    }
  };

  // Filter inventory
  const filteredInventory = inventory.filter(item => {
    let matches = true;

    if (searchText) {
      const search = searchText.toLowerCase();
      matches = item.productName?.toLowerCase().includes(search) ||
                item.productSku?.toLowerCase().includes(search) ||
                item.batchNumber?.toLowerCase().includes(search) ||
                item.lotNumber?.toLowerCase().includes(search);
    }

    if (statusFilter === 'low') {
      matches = matches && item.quantity <= (item.reorderLevel || 10);
    } else if (statusFilter === 'out') {
      matches = matches && item.availableQuantity === 0;
    } else if (statusFilter !== 'all') {
      matches = matches && item.status === statusFilter;
    }

    return matches;
  });

  const getStockStatus = (item: InventoryItem) => {
    if (item.status === 'EXPIRED') return { color: 'red', text: 'Expired' };
    if (item.status === 'DAMAGED') return { color: 'orange', text: 'Damaged' };
    if (item.status === 'QUARANTINE') return { color: 'purple', text: 'Quarantine' };
    if (item.availableQuantity === 0) return { color: 'red', text: 'Out of Stock' };
    if (item.quantity <= (item.reorderLevel || 10)) return { color: 'orange', text: 'Low Stock' };
    return { color: 'green', text: 'In Stock' };
  };

  const columns = [
    {
      title: 'Product',
      key: 'product',
      width: 280,
      render: (record: InventoryItem) => (
        <div>
          <div className="font-semibold text-blue-600">{record.productName}</div>
          <div className="text-xs text-gray-500">SKU: {record.productSku}</div>
          {record.batchNumber && (
            <div className="text-xs text-gray-400">Batch: {record.batchNumber}</div>
          )}
          {record.lotNumber && (
            <div className="text-xs text-gray-400">Lot: {record.lotNumber}</div>
          )}
        </div>
      ),
    },
    {
      title: 'Warehouse / Location',
      key: 'location',
      width: 160,
      render: (record: InventoryItem) => (
        <div>
          <div className="font-medium">{record.warehouseName || '-'}</div>
          <div className="text-xs text-gray-500">
            {record.locationCode || 'Default'}
          </div>
        </div>
      ),
    },
    {
      title: 'Qty',
      dataIndex: 'quantity',
      key: 'quantity',
      width: 80,
      render: (qty: number) => (
        <span className="font-semibold text-lg">{qty?.toLocaleString() || 0}</span>
      ),
    },
    {
      title: 'Available',
      dataIndex: 'availableQuantity',
      key: 'available',
      width: 90,
      render: (qty: number) => (
        <span className="text-green-600 font-medium">{qty?.toLocaleString() || 0}</span>
      ),
    },
    {
      title: 'Reserved',
      dataIndex: 'reservedQuantity',
      key: 'reserved',
      width: 80,
      render: (qty: number) => (
        <span className="text-orange-500">{qty?.toLocaleString() || 0}</span>
      ),
    },
    {
      title: 'Unit Cost',
      dataIndex: 'unitCost',
      key: 'unitCost',
      width: 90,
      render: (cost: number) => cost ? `£${cost.toFixed(2)}` : '-',
    },
    {
      title: 'Stock Level',
      key: 'level',
      width: 120,
      render: (record: InventoryItem) => {
        const max = record.maxStock || 100;
        const percent = Math.min((record.quantity / max) * 100, 100);
        return (
          <Progress
            percent={percent}
            size="small"
            status={percent < 20 ? 'exception' : percent < 50 ? 'active' : 'success'}
            showInfo={false}
          />
        );
      },
    },
    {
      title: 'Status',
      key: 'status',
      width: 110,
      render: (record: InventoryItem) => {
        const status = getStockStatus(record);
        return (
          <Tag color={status.color}>
            {status.color === 'green' && <CheckCircleOutlined />}
            {status.color === 'orange' && <WarningOutlined />}
            {status.color === 'red' && <WarningOutlined />}
            {' '}{status.text}
          </Tag>
        );
      },
    },
    {
      title: 'Best Before',
      dataIndex: 'bestBeforeDate',
      key: 'bestBefore',
      width: 100,
      render: (date: string) => {
        if (!date) return '-';
        const d = new Date(date);
        const isExpired = d < new Date();
        const isExpiringSoon = !isExpired && d < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
        return (
          <span className={isExpired ? 'text-red-600' : isExpiringSoon ? 'text-orange-500' : ''}>
            {d.toLocaleDateString('en-GB')}
          </span>
        );
      },
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 120,
      fixed: 'right' as const,
      render: (_: any, record: InventoryItem) => (
        <Space>
          <Tooltip title="Edit">
            <Button type="text" icon={<EditOutlined />} onClick={() => handleEdit(record)} />
          </Tooltip>
          <Popconfirm
            title="Delete this inventory item?"
            onConfirm={() => handleDelete(record.id)}
            okText="Yes"
            cancelText="No"
          >
            <Tooltip title="Delete">
              <Button type="text" danger icon={<DeleteOutlined />} />
            </Tooltip>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spin indicator={<LoadingOutlined style={{ fontSize: 48 }} spin />} tip="Loading inventory..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <Alert
          type="error"
          message="Error Loading Inventory"
          description={error}
          action={
            <Button onClick={() => router.push('/clients')}>
              Back to Clients
            </Button>
          }
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div className="flex items-center gap-4">
          <Button
            icon={<ArrowLeftOutlined />}
            onClick={() => router.push(`/clients/${params.id}`)}
          >
            Back to Client
          </Button>
          <div>
            <h1 className="text-3xl font-bold">
              <DatabaseOutlined className="mr-2 text-blue-500" />
              {client?.name} - Inventory
            </h1>
            <p className="text-gray-600 mt-1">
              Manage inventory stored for this 3PL client
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
            Add Inventory
          </Button>
          <Button icon={<ReloadOutlined />} onClick={fetchData}>
            Refresh
          </Button>
        </div>
      </div>

      {/* Breadcrumb Links */}
      <div className="flex gap-2 text-sm">
        <Link href="/clients" className="text-blue-600 hover:underline">Clients</Link>
        <span>/</span>
        <Link href={`/clients/${params.id}`} className="text-blue-600 hover:underline">{client?.name}</Link>
        <span>/</span>
        <span className="text-gray-600">Inventory</span>
      </div>

      {/* Stats */}
      <Row gutter={16}>
        <Col xs={24} sm={12} lg={4}>
          <Card>
            <Statistic
              title="Total SKUs"
              value={stats?.totalSKUs || 0}
              prefix={<InboxOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={4}>
          <Card>
            <Statistic
              title="Total Units"
              value={stats?.totalUnits || 0}
              prefix={<DatabaseOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={4}>
          <Card>
            <Statistic
              title="Available"
              value={stats?.availableUnits || 0}
              valueStyle={{ color: '#13c2c2' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={4}>
          <Card>
            <Statistic
              title="Reserved"
              value={stats?.reservedUnits || 0}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={4}>
          <Card>
            <Statistic
              title="Low Stock"
              value={stats?.lowStockItems || 0}
              prefix={<WarningOutlined />}
              valueStyle={{ color: '#ff7a45' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={4}>
          <Card>
            <Statistic
              title="Total Value"
              value={stats?.totalValue || 0}
              prefix="£"
              precision={2}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Filters */}
      <Card>
        <div className="flex flex-wrap gap-4">
          <Search
            placeholder="Search by product, SKU, batch, or lot..."
            style={{ width: 400 }}
            prefix={<SearchOutlined />}
            allowClear
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
          />
          <Select
            value={statusFilter}
            onChange={setStatusFilter}
            style={{ width: 180 }}
            placeholder="Stock Status"
          >
            <Option value="all">All Items</Option>
            <Option value="AVAILABLE">Available</Option>
            <Option value="RESERVED">Reserved</Option>
            <Option value="low">Low Stock Only</Option>
            <Option value="out">Out of Stock</Option>
            <Option value="QUARANTINE">Quarantine</Option>
            <Option value="DAMAGED">Damaged</Option>
            <Option value="EXPIRED">Expired</Option>
          </Select>
        </div>
      </Card>

      {/* Inventory Table */}
      <Card>
        <Table
          dataSource={filteredInventory}
          columns={columns}
          rowKey="id"
          scroll={{ x: 1400 }}
          pagination={{
            pageSize: 20,
            showTotal: (total) => `Total ${total} inventory items`,
          }}
        />
      </Card>

      {/* Add/Edit Modal */}
      <Modal
        title={editingItem ? 'Edit Inventory Item' : 'Add Inventory Item'}
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onOk={() => form.submit()}
        width={700}
        confirmLoading={saving}
        okText={editingItem ? 'Update' : 'Add'}
      >
        <Form form={form} layout="vertical" onFinish={handleSave}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="Product Name"
                name="productName"
                rules={[{ required: true, message: 'Please enter product name' }]}
              >
                <Input placeholder="Enter product name" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="Product SKU"
                name="productSku"
                rules={[{ required: true, message: 'Please enter SKU' }]}
              >
                <Input placeholder="Enter SKU" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="Warehouse" name="warehouseId">
                <Select
                  placeholder="Select warehouse"
                  allowClear
                  onChange={(value) => {
                    if (value) fetchLocations(value);
                    form.setFieldValue('locationId', undefined);
                  }}
                >
                  {warehouses.map(w => (
                    <Option key={w.id} value={w.id}>{w.name}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Location" name="locationId">
                <Select placeholder="Select location" allowClear>
                  {locations.map(l => (
                    <Option key={l.id} value={l.id}>{l.code}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item label="Quantity" name="quantity" rules={[{ required: true }]}>
                <InputNumber min={0} style={{ width: '100%' }} placeholder="0" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="Reorder Level" name="reorderLevel">
                <InputNumber min={0} style={{ width: '100%' }} placeholder="10" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="Max Stock" name="maxStock">
                <InputNumber min={0} style={{ width: '100%' }} placeholder="100" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item label="Lot Number" name="lotNumber">
                <Input placeholder="LOT-001" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="Batch Number" name="batchNumber">
                <Input placeholder="BATCH-001" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="Serial Number" name="serialNumber">
                <Input placeholder="SN-001" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item label="Best Before Date" name="bestBeforeDate">
                <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="Unit Cost (£)" name="unitCost">
                <InputNumber min={0} step={0.01} style={{ width: '100%' }} placeholder="0.00" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="Status" name="status">
                <Select placeholder="Select status">
                  <Option value="AVAILABLE">Available</Option>
                  <Option value="RESERVED">Reserved</Option>
                  <Option value="QUARANTINE">Quarantine</Option>
                  <Option value="DAMAGED">Damaged</Option>
                  <Option value="EXPIRED">Expired</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>
    </div>
  );
}
