'use client';

import React, { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Table, Button, Input, Select, Tag, Space, Drawer, Form, message, Modal, Tabs, Card } from 'antd';
import {
  PlusOutlined,
  SearchOutlined,
  FilterOutlined,
  ExportOutlined,
  ImportOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  InboxOutlined,
  CheckCircleOutlined,
  StopOutlined,
  CloseCircleOutlined,
} from '@ant-design/icons';
import { mockProducts, mockCategories } from '@/lib/mockData';
import { formatCurrency, getStatusColor } from '@/lib/utils';
import Link from 'next/link';
import type { Product } from '@/types';

const { Search } = Input;
const { Option } = Select;

export default function ProductsPage() {
  const [products, setProducts] = useState(mockProducts);
  const [loading, setLoading] = useState(false);
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState('all');

  const [filters, setFilters] = useState({
    search: '',
    status: undefined,
    categoryId: undefined,
  });

  // Filter products by status
  const allProducts = products;
  const activeProducts = products.filter(p => p.status === 'active');
  const inactiveProducts = products.filter(p => p.status === 'inactive');
  const discontinuedProducts = products.filter(p => p.status === 'discontinued');

  const handleSearch = (value: string) => {
    setFilters({ ...filters, search: value });
    // Apply filter logic here
  };

  const handleDelete = (id: string) => {
    Modal.confirm({
      title: 'Delete Product',
      content: 'Are you sure you want to delete this product?',
      onOk: () => {
        setProducts(products.filter(p => p.id !== id));
        message.success('Product deleted successfully');
      },
    });
  };

  const handleBulkDelete = () => {
    Modal.confirm({
      title: 'Delete Products',
      content: `Are you sure you want to delete ${selectedRows.length} products?`,
      onOk: () => {
        setProducts(products.filter(p => !selectedRows.includes(p.id)));
        setSelectedRows([]);
        message.success(`${selectedRows.length} products deleted successfully`);
      },
    });
  };

  const columns = [
    {
      title: 'SKU',
      dataIndex: 'sku',
      key: 'sku',
      fixed: 'left' as const,
      width: 120,
      render: (text: string, record: Product) => (
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
      title: 'Category',
      dataIndex: ['category', 'name'],
      key: 'category',
      width: 150,
      render: (text: string) => text || '-',
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status: string) => (
        <Tag color={getStatusColor(status)} className="uppercase">
          {status}
        </Tag>
      ),
    },
    {
      title: 'Cost',
      dataIndex: ['pricing', 'cost'],
      key: 'cost',
      width: 100,
      render: (cost: number) => formatCurrency(cost),
    },
    {
      title: 'Price',
      dataIndex: ['pricing', 'price'],
      key: 'price',
      width: 100,
      render: (price: number) => formatCurrency(price),
    },
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      width: 100,
      render: (type: string) => (
        <Tag color="blue" className="uppercase">
          {type}
        </Tag>
      ),
    },
    {
      title: 'Barcode',
      dataIndex: 'barcode',
      key: 'barcode',
      width: 150,
      render: (text: string) => text || '-',
    },
    {
      title: 'Actions',
      key: 'actions',
      fixed: 'right' as const,
      width: 150,
      render: (_: any, record: Product) => (
        <Space size="small">
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

  const rowSelection = {
    selectedRowKeys: selectedRows,
    onChange: (selectedRowKeys: React.Key[]) => {
      setSelectedRows(selectedRowKeys as string[]);
    },
  };

  const renderTable = (dataSource: Product[]) => (
    <>
      <div className="flex gap-4 mb-4">
        <Search
          placeholder="Search by SKU, name, or barcode..."
          onSearch={handleSearch}
          prefix={<SearchOutlined />}
          style={{ width: 300 }}
          allowClear
        />
        <Select
          placeholder="Filter by category"
          onChange={(value) => setFilters({ ...filters, categoryId: value })}
          style={{ width: 200 }}
          allowClear
        >
          {mockCategories.map(cat => (
            <Option key={cat.id} value={cat.id}>{cat.name}</Option>
          ))}
        </Select>
        <Button
          icon={<FilterOutlined />}
          onClick={() => setFilterDrawerOpen(true)}
        >
          Advanced Filters
        </Button>
      </div>

      {selectedRows.length > 0 && (
        <div className="flex items-center gap-4 bg-blue-50 p-3 rounded mb-4">
          <span className="text-blue-900 font-medium">
            {selectedRows.length} items selected
          </span>
          <Button size="small" onClick={() => setSelectedRows([])}>
            Clear Selection
          </Button>
          <Button danger size="small" onClick={handleBulkDelete}>
            Delete Selected
          </Button>
          <Button size="small">Bulk Edit</Button>
          <Button size="small">Export Selected</Button>
        </div>
      )}

      <Table
        dataSource={dataSource}
        columns={columns}
        rowKey="id"
        loading={loading}
        rowSelection={rowSelection}
        scroll={{ x: 1500 }}
        pagination={{
          total: dataSource.length,
          pageSize: 15,
          showSizeChanger: true,
          showTotal: (total) => `Total ${total} products`,
        }}
      />
    </>
  );

  const tabItems = [
    {
      key: 'all',
      label: <span className="flex items-center gap-2"><InboxOutlined />All Products ({allProducts.length})</span>,
      children: renderTable(allProducts),
    },
    {
      key: 'active',
      label: <span className="flex items-center gap-2"><CheckCircleOutlined />Active ({activeProducts.length})</span>,
      children: renderTable(activeProducts),
    },
    {
      key: 'inactive',
      label: <span className="flex items-center gap-2"><StopOutlined />Inactive ({inactiveProducts.length})</span>,
      children: renderTable(inactiveProducts),
    },
    {
      key: 'discontinued',
      label: <span className="flex items-center gap-2"><CloseCircleOutlined />Discontinued ({discontinuedProducts.length})</span>,
      children: renderTable(discontinuedProducts),
    },
  ];

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              Products
            </h1>
            <p className="text-gray-600 mt-1">
              Manage your product catalog
            </p>
          </div>
          <div className="flex gap-2">
            <Button icon={<ImportOutlined />} size="large">
              Import
            </Button>
            <Button icon={<ExportOutlined />} size="large">
              Export
            </Button>
            <Link href="/products/new">
              <Button type="primary" icon={<PlusOutlined />} size="large">
                Add Product
              </Button>
            </Link>
          </div>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <div className="text-center">
              <p className="text-gray-500 text-sm">Total Products</p>
              <p className="text-3xl font-bold text-blue-600">{allProducts.length}</p>
            </div>
          </Card>
          <Card>
            <div className="text-center">
              <p className="text-gray-500 text-sm">Active</p>
              <p className="text-3xl font-bold text-green-600">{activeProducts.length}</p>
            </div>
          </Card>
          <Card>
            <div className="text-center">
              <p className="text-gray-500 text-sm">Inactive</p>
              <p className="text-3xl font-bold text-orange-600">{inactiveProducts.length}</p>
            </div>
          </Card>
          <Card>
            <div className="text-center">
              <p className="text-gray-500 text-sm">Discontinued</p>
              <p className="text-3xl font-bold text-red-600">{discontinuedProducts.length}</p>
            </div>
          </Card>
        </div>

        {/* Tabs with Tables */}
        <Card className="shadow-sm">
          <Tabs
            activeKey={activeTab}
            onChange={setActiveTab}
            items={tabItems}
            size="large"
          />
        </Card>

        {/* Advanced Filters Drawer */}
        <Drawer
          title="Advanced Filters"
          placement="right"
          open={filterDrawerOpen}
          onClose={() => setFilterDrawerOpen(false)}
          width={400}
        >
          <Form layout="vertical">
            <Form.Item label="Price Range">
              <Input.Group compact>
                <Input style={{ width: '45%' }} placeholder="Min" />
                <Input
                  style={{ width: '10%', textAlign: 'center', pointerEvents: 'none' }}
                  placeholder="-"
                  disabled
                />
                <Input style={{ width: '45%' }} placeholder="Max" />
              </Input.Group>
            </Form.Item>

            <Form.Item label="Product Type">
              <Select placeholder="Select type" allowClear>
                <Option value="simple">Simple</Option>
                <Option value="variant">Variant</Option>
                <Option value="bundle">Bundle</Option>
              </Select>
            </Form.Item>

            <Form.Item label="Stock Status">
              <Select placeholder="Select status" allowClear>
                <Option value="in_stock">In Stock</Option>
                <Option value="low_stock">Low Stock</Option>
                <Option value="out_of_stock">Out of Stock</Option>
              </Select>
            </Form.Item>

            <Form.Item>
              <Space>
                <Button type="primary" block>
                  Apply Filters
                </Button>
                <Button block>
                  Reset
                </Button>
              </Space>
            </Form.Item>
          </Form>
        </Drawer>
      </div>
    </MainLayout>
  );
}
