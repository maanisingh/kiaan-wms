'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Table, Button, Tag, Tabs, Card, Input, InputNumber, Spin, Alert, Space, Modal, Form, Select, DatePicker, Drawer, App } from 'antd';
import {
  PlusOutlined, InboxOutlined, CheckCircleOutlined, WarningOutlined, StopOutlined,
  SearchOutlined, ExportOutlined, EditOutlined, DeleteOutlined, EyeOutlined, ReloadOutlined
} from '@ant-design/icons';
import { formatDate } from '@/lib/utils';
import apiService from '@/services/api';
import dayjs from 'dayjs';
import { usePermissions } from '@/hooks/usePermissions';

const { Search } = Input;

interface InventoryItem {
  id: string;
  productId: string;
  warehouseId: string;
  locationId?: string;
  lotNumber?: string;
  batchNumber?: string;
  serialNumber?: string;
  bestBeforeDate?: string;
  receivedDate: string;
  quantity: number;
  availableQuantity: number;
  reservedQuantity: number;
  status: string;
  product?: { id: string; name: string; sku: string; barcode?: string };
  warehouse?: { id: string; name: string; code: string };
  location?: { id: string; code: string; name: string };
}

interface Product {
  id: string;
  name: string;
  sku: string;
}

interface Warehouse {
  id: string;
  name: string;
  code: string;
}

interface Location {
  id: string;
  name: string;
  code: string;
}

export default function InventoryPage() {
  const { modal, message } = App.useApp();
  const { canDelete } = usePermissions();
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('all');
  const [searchText, setSearchText] = useState('');
  const [selectedInventory, setSelectedInventory] = useState<InventoryItem | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form] = Form.useForm();

  // Fetch inventory from REST API
  const fetchInventory = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await apiService.get('/inventory');
      setInventory(Array.isArray(data) ? data : []);
    } catch (err: any) {
      console.error('Failed to fetch inventory:', err);
      setError(err.message || 'Failed to load inventory');
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch products for dropdown
  const fetchProducts = useCallback(async () => {
    try {
      const data = await apiService.get('/products');
      setProducts(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to fetch products:', err);
    }
  }, []);

  // Fetch warehouses for dropdown
  const fetchWarehouses = useCallback(async () => {
    try {
      const data = await apiService.get('/warehouses');
      setWarehouses(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to fetch warehouses:', err);
    }
  }, []);

  // Fetch locations for dropdown
  const fetchLocations = useCallback(async () => {
    try {
      const data = await apiService.get('/locations');
      setLocations(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to fetch locations:', err);
    }
  }, []);

  // Export inventory as CSV
  const handleExport = async () => {
    try {
      message.loading({ content: 'Exporting inventory...', key: 'export' });

      // Get the auth token from Zustand persist storage
      let token = null;
      try {
        const authStorage = localStorage.getItem('wms-auth-storage');
        if (authStorage) {
          const parsed = JSON.parse(authStorage);
          token = parsed?.state?.token;
        }
      } catch (e) {
        console.error('Failed to parse auth storage:', e);
      }

      // Fallback to direct token storage
      if (!token) {
        token = localStorage.getItem('wms_auth_token');
      }

      if (!token) {
        message.error({ content: 'Please log in to export', key: 'export' });
        return;
      }

      // Fetch the CSV file
      const response = await fetch('/api/inventory/export?format=csv', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Export failed');
      }

      // Get the blob and create download link
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `inventory-export-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      message.success({ content: 'Inventory exported successfully!', key: 'export' });
    } catch (err: any) {
      console.error('Export failed:', err);
      message.error({ content: 'Failed to export inventory', key: 'export' });
    }
  };

  useEffect(() => {
    fetchInventory();
    fetchProducts();
    fetchWarehouses();
    fetchLocations();
  }, [fetchInventory, fetchProducts, fetchWarehouses, fetchLocations]);

  // Filter inventory based on search and tab
  const filteredInventory = inventory.filter((item) => {
    // Search filter
    const matchesSearch = !searchText ||
      item.product?.name?.toLowerCase().includes(searchText.toLowerCase()) ||
      item.product?.sku?.toLowerCase().includes(searchText.toLowerCase()) ||
      item.lotNumber?.toLowerCase().includes(searchText.toLowerCase());

    if (!matchesSearch) return false;

    // Tab filter
    if (activeTab === 'in_stock') {
      return (item.quantity || 0) > 50;
    } else if (activeTab === 'low_stock') {
      return (item.quantity || 0) > 0 && (item.quantity || 0) <= 50;
    } else if (activeTab === 'out_of_stock') {
      return (item.quantity || 0) === 0;
    } else if (activeTab === 'expiring') {
      if (!item.bestBeforeDate) return false;
      const thirtyDaysFromNow = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
      return new Date(item.bestBeforeDate) < thirtyDaysFromNow && (item.quantity || 0) > 0;
    }
    return true;
  });

  // Calculate stats
  const totalQty = inventory.reduce((sum, i) => sum + (i.quantity || 0), 0);
  const availableQty = inventory.reduce((sum, i) => sum + (i.availableQuantity || 0), 0);
  const reservedQty = inventory.reduce((sum, i) => sum + (i.reservedQuantity || 0), 0);

  // Calculate counts for tabs
  const inStockCount = inventory.filter((i) => (i.quantity || 0) > 50).length;
  const lowStockCount = inventory.filter((i) => (i.quantity || 0) > 0 && (i.quantity || 0) <= 50).length;
  const outOfStockCount = inventory.filter((i) => (i.quantity || 0) === 0).length;
  const expiringCount = inventory.filter((i) => {
    if (!i.bestBeforeDate) return false;
    const thirtyDaysFromNow = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    return new Date(i.bestBeforeDate) < thirtyDaysFromNow && (i.quantity || 0) > 0;
  }).length;

  const handleSubmit = async (values: any) => {
    try {
      setSaving(true);
      const qty = values.quantity || 0;
      const payload = {
        productId: values.productId,
        warehouseId: values.warehouseId,
        locationId: values.locationId || null,
        lotNumber: values.lotNumber || null,
        batchNumber: values.batchNumber || null,
        serialNumber: values.serialNumber || null,
        bestBeforeDate: values.bestBeforeDate ? values.bestBeforeDate.toISOString() : null,
        quantity: qty,
        availableQuantity: values.availableQuantity ?? qty,
        reservedQuantity: values.reservedQuantity ?? 0,
        status: values.status,
      };

      if (selectedInventory) {
        await apiService.put(`/inventory/${selectedInventory.id}`, payload);
        message.success('Inventory updated successfully!');
      } else {
        await apiService.post('/inventory', payload);
        message.success('Inventory created successfully!');
      }

      setModalOpen(false);
      form.resetFields();
      setSelectedInventory(null);
      fetchInventory();
    } catch (err: any) {
      console.error('Error saving inventory:', err);
      message.error(err.message || 'Failed to save inventory');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (record: InventoryItem) => {
    setSelectedInventory(record);
    form.setFieldsValue({
      productId: record.productId,
      warehouseId: record.warehouseId,
      locationId: record.locationId,
      lotNumber: record.lotNumber,
      batchNumber: record.batchNumber,
      serialNumber: record.serialNumber,
      bestBeforeDate: record.bestBeforeDate ? dayjs(record.bestBeforeDate) : null,
      quantity: record.quantity,
      availableQuantity: record.availableQuantity,
      reservedQuantity: record.reservedQuantity,
      status: record.status,
    });
    setModalOpen(true);
  };

  const handleDelete = (record: InventoryItem) => {
    modal.confirm({
      title: 'Delete Inventory',
      content: 'Are you sure you want to delete this inventory record? This action cannot be undone.',
      okText: 'Delete',
      okType: 'danger',
      onOk: async () => {
        try {
          await apiService.delete(`/inventory/${record.id}`);
          message.success('Inventory deleted successfully!');
          fetchInventory();
        } catch (err: any) {
          message.error(err.message || 'Failed to delete inventory');
        }
      },
    });
  };

  const handleAddInventory = () => {
    setSelectedInventory(null);
    form.resetFields();
    form.setFieldsValue({ status: 'AVAILABLE' });
    setModalOpen(true);
  };

  const inventoryColumns = [
    {
      title: 'Product SKU',
      dataIndex: ['product', 'sku'],
      key: 'sku',
      width: 120,
      render: (text: string) => <span className="font-medium">{text || '-'}</span>,
    },
    {
      title: 'Product Name',
      dataIndex: ['product', 'name'],
      key: 'name',
      width: 200,
      ellipsis: true,
    },
    {
      title: 'Warehouse',
      dataIndex: ['warehouse', 'name'],
      key: 'warehouse',
      width: 150,
      render: (text: string) => text || '-',
    },
    {
      title: 'Location',
      dataIndex: ['location', 'code'],
      key: 'location',
      width: 100,
      render: (text: string) => text || '-',
    },
    {
      title: 'Quantity',
      dataIndex: 'quantity',
      key: 'quantity',
      width: 100,
      align: 'right' as const,
      render: (qty: number) => <span className="font-semibold">{qty?.toLocaleString() || 0}</span>,
    },
    {
      title: 'Available',
      dataIndex: 'availableQuantity',
      key: 'available',
      width: 100,
      align: 'right' as const,
      render: (qty: number) => <span className="text-green-600">{qty?.toLocaleString() || 0}</span>,
    },
    {
      title: 'Reserved',
      dataIndex: 'reservedQuantity',
      key: 'reserved',
      width: 100,
      align: 'right' as const,
      render: (qty: number) => <span className="text-orange-600">{qty?.toLocaleString() || 0}</span>,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status: string) => {
        const colors: Record<string, string> = {
          AVAILABLE: 'green',
          RESERVED: 'orange',
          QUARANTINE: 'red',
          DAMAGED: 'volcano',
          EXPIRED: 'magenta',
        };
        return <Tag color={colors[status] || 'default'}>{status || 'AVAILABLE'}</Tag>;
      },
    },
    {
      title: 'Lot Number',
      dataIndex: 'lotNumber',
      key: 'lot',
      width: 120,
      render: (text: string) => text || '-',
    },
    {
      title: 'Best Before',
      dataIndex: 'bestBeforeDate',
      key: 'bestBefore',
      width: 120,
      render: (date: string) => {
        if (!date) return '-';
        const isExpiringSoon = new Date(date) < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
        return (
          <span className={isExpiringSoon ? 'text-red-600 font-semibold' : ''}>
            {formatDate(date)}
          </span>
        );
      },
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 180,
      fixed: 'right' as const,
      render: (_: any, record: InventoryItem) => (
        <Space>
          <Button
            type="link"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => {
              setSelectedInventory(record);
              setDrawerOpen(true);
            }}
          >
            View
          </Button>
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            Edit
          </Button>
          {canDelete() && (
            <Button
              type="link"
              size="small"
              danger
              icon={<DeleteOutlined />}
              onClick={() => handleDelete(record)}
            >
              Delete
            </Button>
          )}
        </Space>
      ),
    },
  ];

  if (loading && inventory.length === 0) {
    return (
      <div className="flex justify-center items-center h-96">
        <Spin size="large" tip="Loading inventory..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <Alert
          message="Error Loading Inventory"
          description={error}
          type="error"
          showIcon
          action={
            <Button onClick={fetchInventory} icon={<ReloadOutlined />}>
              Retry
            </Button>
          }
        />
      </div>
    );
  }

  const tabItems = [
    {
      key: 'all',
      label: <span className="flex items-center gap-2"><InboxOutlined />All Items ({inventory.length})</span>,
    },
    {
      key: 'in_stock',
      label: <span className="flex items-center gap-2"><CheckCircleOutlined />In Stock ({inStockCount})</span>,
    },
    {
      key: 'low_stock',
      label: <span className="flex items-center gap-2"><WarningOutlined />Low Stock ({lowStockCount})</span>,
    },
    {
      key: 'out_of_stock',
      label: <span className="flex items-center gap-2"><StopOutlined />Out of Stock ({outOfStockCount})</span>,
    },
    {
      key: 'expiring',
      label: <span className="flex items-center gap-2"><WarningOutlined className="text-red-500" />Expiring Soon ({expiringCount})</span>,
    },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            Inventory Management
          </h1>
          <p className="text-gray-600 mt-1">
            Total: {totalQty.toLocaleString()} units | Available: {availableQty.toLocaleString()} | Reserved: {reservedQty.toLocaleString()}
          </p>
        </div>
        <Space>
          <Button icon={<ReloadOutlined />} onClick={fetchInventory} loading={loading}>
            Refresh
          </Button>
          <Button icon={<ExportOutlined />} onClick={handleExport}>Export</Button>
          <Button type="primary" icon={<PlusOutlined />} size="large" onClick={handleAddInventory}>
            Add Inventory
          </Button>
        </Space>
      </div>

      {/* Tabs and Table */}
      <Card>
        <Tabs activeKey={activeTab} onChange={setActiveTab} items={tabItems} />
        <div className="flex gap-4 mb-4 mt-4">
          <Search
            placeholder="Search by product name, SKU, or lot number..."
            style={{ width: 400 }}
            prefix={<SearchOutlined />}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            allowClear
          />
        </div>
        <Table
          dataSource={filteredInventory}
          columns={inventoryColumns}
          rowKey="id"
          scroll={{ x: 1600 }}
          loading={loading}
          pagination={{
            pageSize: 50,
            showSizeChanger: true,
            showTotal: (total) => `Total ${total} items`,
          }}
        />
      </Card>

      {/* Details Drawer */}
      <Drawer
        title="Inventory Details"
        placement="right"
        width={600}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
      >
        {selectedInventory && (
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold text-lg">{selectedInventory.product?.name}</h3>
              <p className="text-gray-600">SKU: {selectedInventory.product?.sku}</p>
            </div>
            <div className="border-t pt-4 space-y-2">
              <p><strong>Warehouse:</strong> {selectedInventory.warehouse?.name || 'N/A'}</p>
              <p><strong>Location:</strong> {selectedInventory.location?.code || 'Not specified'}</p>
              <p><strong>Quantity:</strong> {selectedInventory.quantity?.toLocaleString()}</p>
              <p><strong>Available:</strong> {selectedInventory.availableQuantity?.toLocaleString()}</p>
              <p><strong>Reserved:</strong> {selectedInventory.reservedQuantity?.toLocaleString()}</p>
              <p><strong>Status:</strong> <Tag color={selectedInventory.status === 'AVAILABLE' ? 'green' : 'orange'}>{selectedInventory.status}</Tag></p>
              <p><strong>Lot Number:</strong> {selectedInventory.lotNumber || 'Not specified'}</p>
              <p><strong>Batch Number:</strong> {selectedInventory.batchNumber || 'Not specified'}</p>
              <p><strong>Serial Number:</strong> {selectedInventory.serialNumber || 'Not specified'}</p>
              <p><strong>Best Before Date:</strong> {selectedInventory.bestBeforeDate ? formatDate(selectedInventory.bestBeforeDate) : 'Not specified'}</p>
              <p className="text-xs text-gray-500 mt-4">Received: {formatDate(selectedInventory.receivedDate)}</p>
            </div>
          </div>
        )}
      </Drawer>

      {/* Add/Edit Modal */}
      <Modal
        title={selectedInventory ? 'Edit Inventory' : 'Add Inventory'}
        open={modalOpen}
        onCancel={() => {
          setModalOpen(false);
          setSelectedInventory(null);
          form.resetFields();
        }}
        onOk={() => form.submit()}
        width={700}
        confirmLoading={saving}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item
            label="Product"
            name="productId"
            rules={[{ required: true, message: 'Please select product' }]}
          >
            <Select
              placeholder="Select product"
              showSearch
              optionFilterProp="label"
              options={products.map((p) => ({
                value: p.id,
                label: `${p.name} (${p.sku})`,
              }))}
            />
          </Form.Item>

          <div className="grid grid-cols-2 gap-4">
            <Form.Item
              label="Warehouse"
              name="warehouseId"
              rules={[{ required: true, message: 'Please select warehouse' }]}
            >
              <Select
                placeholder="Select warehouse"
                showSearch
                optionFilterProp="label"
                options={warehouses.map((w) => ({
                  value: w.id,
                  label: w.name,
                }))}
              />
            </Form.Item>

            <Form.Item label="Location" name="locationId">
              <Select
                placeholder="Select location (optional)"
                allowClear
                showSearch
                optionFilterProp="label"
                options={locations.map((l) => ({
                  value: l.id,
                  label: `${l.name} (${l.code})`,
                }))}
              />
            </Form.Item>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <Form.Item
              label="Quantity"
              name="quantity"
              rules={[{ required: true, message: 'Required' }]}
            >
              <InputNumber min={0} placeholder="0" style={{ width: '100%' }} />
            </Form.Item>

            <Form.Item label="Available" name="availableQuantity">
              <InputNumber min={0} placeholder="Auto-set" style={{ width: '100%' }} />
            </Form.Item>

            <Form.Item label="Reserved" name="reservedQuantity">
              <InputNumber min={0} placeholder="0" style={{ width: '100%' }} />
            </Form.Item>
          </div>

          <Form.Item
            label="Status"
            name="status"
            rules={[{ required: true, message: 'Please select status' }]}
          >
            <Select
              placeholder="Select status"
              options={[
                { value: 'AVAILABLE', label: 'Available' },
                { value: 'RESERVED', label: 'Reserved' },
                { value: 'QUARANTINE', label: 'Quarantine' },
                { value: 'DAMAGED', label: 'Damaged' },
                { value: 'EXPIRED', label: 'Expired' },
              ]}
            />
          </Form.Item>

          <div className="grid grid-cols-2 gap-4">
            <Form.Item label="Lot Number" name="lotNumber">
              <Input placeholder="Enter lot number (optional)" />
            </Form.Item>

            <Form.Item label="Batch Number" name="batchNumber">
              <Input placeholder="Enter batch number (optional)" />
            </Form.Item>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Form.Item label="Serial Number" name="serialNumber">
              <Input placeholder="Enter serial number (optional)" />
            </Form.Item>

            <Form.Item label="Best Before Date" name="bestBeforeDate">
              <DatePicker style={{ width: '100%' }} />
            </Form.Item>
          </div>

          <p className="text-xs text-gray-500">
            Fill in batch tracking fields for perishable or serialized products.
          </p>
        </Form>
      </Modal>
    </div>
  );
}
