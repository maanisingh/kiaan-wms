'use client';

import React, { useState } from 'react';
import { useQuery, useMutation } from '@apollo/client';

import { Table, Button, Input, Select, Tag, Space, Modal, Tabs, Card, Spin, Alert, message } from 'antd';
import {
  PlusOutlined,
  SearchOutlined,
  ExportOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  InboxOutlined,
} from '@ant-design/icons';
import { GET_PRODUCTS, GET_BRANDS } from '@/lib/graphql/queries';
import { DELETE_PRODUCT } from '@/lib/graphql/mutations';
import { formatCurrency, getStatusColor } from '@/lib/utils';
import Link from 'next/link';

const { Search } = Input;
const { Option } = Select;

export default function ProductsPageWithRealData() {
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState('all');
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined);

  // Build where clause for filtering
  const buildWhereClause = () => {
    const where: any = {};

    if (searchText) {
      where._or = [
        { name: { _ilike: `%${searchText}%` } },
        { sku: { _ilike: `%${searchText}%` } },
        { barcode: { _ilike: `%${searchText}%` } },
      ];
    }

    if (statusFilter) {
      where.status = { _eq: statusFilter.toUpperCase() };
    } else if (activeTab !== 'all') {
      where.status = { _eq: activeTab.toUpperCase() };
    }

    return Object.keys(where).length > 0 ? where : undefined;
  };

  // Fetch products from Hasura
  const { data, loading, error, refetch } = useQuery(GET_PRODUCTS, {
    variables: {
      limit: 100,
      offset: 0,
      where: buildWhereClause(),
    },
    fetchPolicy: 'cache-and-network',
  });

  // Fetch brands for filter
  const { data: brandsData } = useQuery(GET_BRANDS);

  // Delete product mutation
  const [deleteProduct] = useMutation(DELETE_PRODUCT, {
    onCompleted: () => {
      message.success('Product deleted successfully');
      refetch();
    },
    onError: (err) => {
      message.error(`Failed to delete product: ${err.message}`);
    },
  });

  const products = data?.Product || [];
  const totalCount = data?.Product_aggregate?.aggregate?.count || 0;
  const brands = brandsData?.Brand || [];

  const handleSearch = (value: string) => {
    setSearchText(value);
  };

  const handleDelete = (id: string) => {
    Modal.confirm({
      title: 'Delete Product',
      content: 'Are you sure you want to delete this product? This action cannot be undone.',
      okText: 'Delete',
      okType: 'danger',
      onOk: async () => {
        await deleteProduct({ variables: { id } });
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
        for (const id of selectedRows) {
          await deleteProduct({ variables: { id } });
        }
        setSelectedRows([]);
      },
    });
  };

  const handleExport = () => {
    // Export products to CSV
    const headers = ['SKU', 'Name', 'Brand', 'Price', 'Cost', 'Stock', 'Status'];
    const csvData = products.map((p: any) => [
      p.sku,
      p.name,
      p.brand?.name || '',
      p.sellingPrice || 0,
      p.costPrice || 0,
      p.inventoryItems?.reduce((sum: number, inv: any) => sum + (inv.quantity || 0), 0) || 0,
      p.status,
    ]);

    const csv = [
      headers.join(','),
      ...csvData.map(row => row.join(','))
    ].join('\n');

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
      fixed: 'left' as const,
      width: 120,
      render: (text: string, record: any) => (
        <Link href={`/products/${record.id}`} className="text-blue-600 hover:text-blue-800 font-medium">
          {text}
        </Link>
      ),
    },
    {
      title: 'Product Name',
      dataIndex: 'name',
      key: 'name',
      width: 250,
      ellipsis: true,
    },
    {
      title: 'Brand',
      dataIndex: ['Brand', 'name'],
      key: 'brand',
      width: 150,
      render: (text: string) => text || '-',
    },
    {
      title: 'Barcode',
      dataIndex: 'barcode',
      key: 'barcode',
      width: 150,
      render: (text: string) => text || '-',
    },
    {
      title: 'Price',
      dataIndex: 'price',
      key: 'price',
      width: 120,
      render: (price: number) => formatCurrency(price || 0),
      align: 'right' as const,
    },
    {
      title: 'Cost',
      dataIndex: 'costPrice',
      key: 'costPrice',
      width: 120,
      render: (cost: number) => formatCurrency(cost || 0),
      align: 'right' as const,
    },
    {
      title: 'Stock',
      key: 'stock',
      width: 100,
      render: (_: any, record: any) => {
        const totalStock = record.inventoryItems?.reduce((sum: number, inv: any) =>
          sum + (inv.quantity || 0), 0) || 0;
        return (
          <Space>
            <InboxOutlined />
            {totalStock}
          </Space>
        );
      },
      align: 'right' as const,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status: string) => (
        <Tag color={getStatusColor(status?.toLowerCase() || 'active')}>
          {status || 'ACTIVE'}
        </Tag>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      fixed: 'right' as const,
      width: 150,
      render: (_: any, record: any) => (
        <Space>
          <Link href={`/products/${record.id}`}>
            <Button type="link" icon={<EyeOutlined />} size="small">
              View
            </Button>
          </Link>
          <Link href={`/products/${record.id}/edit`}>
            <Button type="link" icon={<EditOutlined />} size="small">
              Edit
            </Button>
          </Link>
          <Button
            type="link"
            danger
            icon={<DeleteOutlined />}
            size="small"
            onClick={() => handleDelete(record.id)}
          >
            Delete
          </Button>
        </Space>
      ),
    },
  ];

  // Show loading spinner
  if (loading && !data) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
          <Spin size="large" tip="Loading products..." />
        </div>
    );
  }

  // Show error
  if (error) {
    return (
      <Alert
          message="Error Loading Products"
          description={error.message}
          type="error"
          showIcon
          action={
            <Button onClick={() => refetch()}>
              Retry
            </Button>
          }
        />
          );
  }

  // Calculate counts for tabs
  const allCount = totalCount;
  const activeCount = products.filter((p: any) => p.status === 'ACTIVE').length;
  const inactiveCount = products.filter((p: any) => p.status === 'INACTIVE').length;

  const tabItems = [
    {
      key: 'all',
      label: `All Products (${allCount})`,
    },
    {
      key: 'active',
      label: `Active (${activeCount})`,
    },
    {
      key: 'inactive',
      label: `Inactive (${inactiveCount})`,
    },
  ];

  return (
      <div className="p-6">
        {/* Page Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold">Products</h1>
            <p className="text-gray-500">Manage your product catalog</p>
          </div>
          <Space>
            <Link href="/products/import">
              <Button icon={<ExportOutlined />}>Import</Button>
            </Link>
            <Button icon={<ExportOutlined />} onClick={handleExport}>
              Export
            </Button>
            <Link href="/products/new">
              <Button type="primary" icon={<PlusOutlined />}>
                Add Product
              </Button>
            </Link>
          </Space>
        </div>

        {/* Filters */}
        <Card className="mb-4">
          <Space wrap style={{ width: '100%' }}>
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
              style={{ width: 200 }}
              onChange={(value) => setStatusFilter(value)}
            >
              {brands.map((brand: any) => (
                <Option key={brand.id} value={brand.id}>
                  {brand.name}
                </Option>
              ))}
            </Select>
            <Select
              placeholder="Filter by status"
              allowClear
              style={{ width: 150 }}
              value={statusFilter}
              onChange={(value) => setStatusFilter(value)}
            >
              <Option value="active">Active</Option>
              <Option value="inactive">Inactive</Option>
              <Option value="discontinued">Discontinued</Option>
            </Select>
            {selectedRows.length > 0 && (
              <Button danger onClick={handleBulkDelete}>
                Delete Selected ({selectedRows.length})
              </Button>
            )}
          </Space>
        </Card>

        {/* Tabs */}
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={tabItems}
        />

        {/* Products Table */}
        <Card>
          <Table
            dataSource={products}
            columns={columns}
            rowKey="id"
            loading={loading}
            scroll={{ x: 1200 }}
            rowSelection={{
              selectedRowKeys: selectedRows,
              onChange: (keys) => setSelectedRows(keys as string[]),
            }}
            pagination={{
              total: totalCount,
              pageSize: 50,
              showSizeChanger: true,
              showTotal: (total) => `Total ${total} products`,
            }}
          />
        </Card>
      </div>
      );
}
