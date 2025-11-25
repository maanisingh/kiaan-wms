'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Table, Button, Input, Select, Tag, Space, Modal, Card, Spin, Alert, message } from 'antd';
import {
  PlusOutlined,
  SearchOutlined,
  ExportOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  InboxOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import { formatCurrency, getStatusColor } from '@/lib/utils';
import Link from 'next/link';
import apiService from '@/services/api';

const { Search } = Input;
const { Option } = Select;

interface Product {
  id: string;
  sku: string;
  name: string;
  barcode?: string;
  description?: string;
  sellingPrice?: number;
  costPrice?: number;
  status: string;
  type: string;
  brand?: { id: string; name: string };
  _count?: { inventory: number };
  inventory?: Array<{ quantity: number }>;
}

interface Brand {
  id: string;
  name: string;
  code: string;
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined);
  const [brandFilter, setBrandFilter] = useState<string | undefined>(undefined);

  // Fetch products
  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await apiService.get('/products');
      setProducts(Array.isArray(data) ? data : []);
    } catch (err: any) {
      console.error('Failed to fetch products:', err);
      setError(err.message || 'Failed to load products');
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch brands
  const fetchBrands = useCallback(async () => {
    try {
      const data = await apiService.get('/brands');
      setBrands(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to fetch brands:', err);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
    fetchBrands();
  }, [fetchProducts, fetchBrands]);

  // Filter products
  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      !searchText ||
      p.name?.toLowerCase().includes(searchText.toLowerCase()) ||
      p.sku?.toLowerCase().includes(searchText.toLowerCase()) ||
      p.barcode?.toLowerCase().includes(searchText.toLowerCase());

    const matchesStatus = !statusFilter || p.status?.toUpperCase() === statusFilter.toUpperCase();
    const matchesBrand = !brandFilter || p.brand?.id === brandFilter;

    return matchesSearch && matchesStatus && matchesBrand;
  });

  const handleSearch = (value: string) => {
    setSearchText(value);
  };

  const handleDelete = (id: string, name: string) => {
    Modal.confirm({
      title: 'Delete Product',
      content: `Are you sure you want to delete "${name}"? This action cannot be undone.`,
      okText: 'Delete',
      okType: 'danger',
      onOk: async () => {
        try {
          await apiService.delete(`/products/${id}`);
          message.success('Product deleted successfully');
          fetchProducts();
        } catch (err: any) {
          message.error(err.message || 'Failed to delete product');
        }
      },
    });
  };

  const handleBulkDelete = () => {
    Modal.confirm({
      title: 'Delete Products',
      content: `Are you sure you want to delete ${selectedRows.length} products? This action cannot be undone.`,
      okText: 'Delete All',
      okType: 'danger',
      onOk: async () => {
        try {
          for (const id of selectedRows) {
            await apiService.delete(`/products/${id}`);
          }
          message.success(`${selectedRows.length} products deleted successfully`);
          setSelectedRows([]);
          fetchProducts();
        } catch (err: any) {
          message.error(err.message || 'Failed to delete products');
        }
      },
    });
  };

  const handleExport = () => {
    const headers = ['SKU', 'Name', 'Brand', 'Price', 'Cost', 'Stock', 'Status'];
    const csvData = filteredProducts.map((p) => [
      p.sku,
      p.name,
      p.brand?.name || '',
      p.sellingPrice || 0,
      p.costPrice || 0,
      p.inventory?.reduce((sum, inv) => sum + (inv.quantity || 0), 0) || p._count?.inventory || 0,
      p.status,
    ]);

    const csv = [headers.join(','), ...csvData.map((row) => row.join(','))].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `products_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    message.success('Products exported successfully');
  };

  const columns = [
    {
      title: 'SKU',
      dataIndex: 'sku',
      key: 'sku',
      width: 130,
      fixed: 'left' as const,
      render: (text: string, record: Product) => (
        <Link href={`/protected/products/${record.id}`} className="text-blue-600 hover:text-blue-800 font-medium">
          {text}
        </Link>
      ),
    },
    {
      title: 'Product Name',
      dataIndex: 'name',
      key: 'name',
      width: 220,
      ellipsis: true,
    },
    {
      title: 'Brand',
      dataIndex: ['brand', 'name'],
      key: 'brand',
      width: 130,
      render: (text: string) => text || <span className="text-gray-400">-</span>,
    },
    {
      title: 'Barcode',
      dataIndex: 'barcode',
      key: 'barcode',
      width: 140,
      render: (text: string) => text || <span className="text-gray-400">-</span>,
    },
    {
      title: 'Price',
      dataIndex: 'sellingPrice',
      key: 'price',
      width: 100,
      align: 'right' as const,
      render: (price: number) => formatCurrency(price || 0),
    },
    {
      title: 'Cost',
      dataIndex: 'costPrice',
      key: 'cost',
      width: 100,
      align: 'right' as const,
      render: (cost: number) => formatCurrency(cost || 0),
    },
    {
      title: 'Stock',
      key: 'stock',
      width: 90,
      align: 'right' as const,
      render: (_: any, record: Product) => {
        const totalStock =
          record.inventory?.reduce((sum, inv) => sum + (inv.quantity || 0), 0) || record._count?.inventory || 0;
        return (
          <Space>
            <InboxOutlined className="text-gray-400" />
            <span>{totalStock}</span>
          </Space>
        );
      },
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => (
        <Tag color={getStatusColor(status?.toLowerCase() || 'active')}>{status || 'ACTIVE'}</Tag>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 180,
      fixed: 'right' as const,
      render: (_: any, record: Product) => (
        <Space size="small">
          <Link href={`/protected/products/${record.id}`}>
            <Button type="link" icon={<EyeOutlined />} size="small">
              View
            </Button>
          </Link>
          <Link href={`/protected/products/${record.id}/edit`}>
            <Button type="link" icon={<EditOutlined />} size="small">
              Edit
            </Button>
          </Link>
          <Button
            type="link"
            danger
            icon={<DeleteOutlined />}
            size="small"
            onClick={() => handleDelete(record.id, record.name)}
          >
            Delete
          </Button>
        </Space>
      ),
    },
  ];

  if (loading && products.length === 0) {
    return (
      <div className="flex justify-center items-center h-96">
        <Spin size="large" tip="Loading products..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <Alert
          message="Error Loading Products"
          description={error}
          type="error"
          showIcon
          action={
            <Button onClick={fetchProducts} icon={<ReloadOutlined />}>
              Retry
            </Button>
          }
        />
      </div>
    );
  }

  const activeCount = products.filter((p) => p.status?.toUpperCase() === 'ACTIVE').length;
  const inactiveCount = products.filter((p) => p.status?.toUpperCase() === 'INACTIVE').length;

  return (
    <div className="p-6">
      {/* Page Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Products</h1>
          <p className="text-gray-500">Manage your product catalog ({products.length} total)</p>
        </div>
        <Space>
          <Button icon={<ReloadOutlined />} onClick={fetchProducts} loading={loading}>
            Refresh
          </Button>
          <Link href="/protected/products/import">
            <Button icon={<ExportOutlined />}>Import</Button>
          </Link>
          <Button icon={<ExportOutlined />} onClick={handleExport}>
            Export
          </Button>
          <Link href="/protected/products/new">
            <Button type="primary" icon={<PlusOutlined />}>
              Add Product
            </Button>
          </Link>
        </Space>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <Card size="small">
          <div className="text-center">
            <p className="text-gray-500 text-sm">Total Products</p>
            <p className="text-2xl font-bold text-blue-600">{products.length}</p>
          </div>
        </Card>
        <Card size="small">
          <div className="text-center">
            <p className="text-gray-500 text-sm">Active</p>
            <p className="text-2xl font-bold text-green-600">{activeCount}</p>
          </div>
        </Card>
        <Card size="small">
          <div className="text-center">
            <p className="text-gray-500 text-sm">Inactive</p>
            <p className="text-2xl font-bold text-red-600">{inactiveCount}</p>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card className="mb-4">
        <Space wrap className="w-full">
          <Search
            placeholder="Search by name, SKU, or barcode"
            allowClear
            onSearch={handleSearch}
            onChange={(e) => e.target.value === '' && handleSearch('')}
            style={{ width: 300 }}
            prefix={<SearchOutlined />}
          />
          <Select
            placeholder="Filter by brand"
            allowClear
            style={{ width: 180 }}
            value={brandFilter}
            onChange={(value) => setBrandFilter(value)}
          >
            {brands.map((brand) => (
              <Option key={brand.id} value={brand.id}>
                {brand.name}
              </Option>
            ))}
          </Select>
          <Select
            placeholder="Filter by status"
            allowClear
            style={{ width: 140 }}
            value={statusFilter}
            onChange={(value) => setStatusFilter(value)}
          >
            <Option value="ACTIVE">Active</Option>
            <Option value="INACTIVE">Inactive</Option>
            <Option value="DISCONTINUED">Discontinued</Option>
          </Select>
          {selectedRows.length > 0 && (
            <Button danger onClick={handleBulkDelete}>
              Delete Selected ({selectedRows.length})
            </Button>
          )}
        </Space>
      </Card>

      {/* Products Table */}
      <Card>
        <Table
          dataSource={filteredProducts}
          columns={columns}
          rowKey="id"
          loading={loading}
          scroll={{ x: 1300 }}
          rowSelection={{
            selectedRowKeys: selectedRows,
            onChange: (keys) => setSelectedRows(keys as string[]),
          }}
          pagination={{
            total: filteredProducts.length,
            pageSize: 20,
            showSizeChanger: true,
            showTotal: (total) => `Total ${total} products`,
          }}
        />
      </Card>
    </div>
  );
}
