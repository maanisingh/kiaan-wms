#!/bin/bash

# Kiaan WMS - Frontend Enhancement Script
# This script applies all requested frontend updates

set -e

echo "🚀 Starting Kiaan WMS Frontend Updates..."
echo ""

CD="/root/kiaan-wms/frontend"
cd $CD

# ===================================
# 1. UPDATE API CONSTANTS
# ===================================
echo "📝 1. Updating API constants..."

# Add new constants for product types, channels, etc.
cat >> lib/constants.ts << 'CONSTANTS_EOF'

// Product bundle types
export const BUNDLE_TYPES = [
  { value: 'simple', label: 'Simple Bundle', description: 'Fixed quantity bundle' },
  { value: 'multi', label: 'Multi-Product Bundle', description: 'Multiple different products' },
  { value: 'custom', label: 'Custom Bundle', description: 'Customer-selectable bundle' },
];

// Wholesale/B2B flags
export const CUSTOMER_TYPES = [
  { value: 'B2C', label: 'Retail (B2C)', icon: '🛒' },
  { value: 'B2B', label: 'Wholesale (B2B)', icon: '🏢' },
];

// Sales channels (updated with real data)
export const SALES_CHANNELS = [
  { value: 'SHOPIFY-RETAIL', label: 'Shopify Retail', type: 'SHOPIFY' },
  { value: 'SHOPIFY-B2B', label: 'Shopify Wholesale', type: 'SHOPIFY' },
  { value: 'AMAZON-FBA-UK', label: 'Amazon FBA UK', type: 'AMAZON_FBA' },
  { value: 'EBAY-UK', label: 'eBay UK', type: 'EBAY' },
  { value: 'DIRECT-WHOLESALE', label: 'Direct Wholesale', type: 'WHOLESALE' },
];

// Warehouse types (updated for food distribution)
export const WMS_WAREHOUSE_TYPES = [
  { value: 'MAIN', label: 'Main Distribution Center' },
  { value: 'PREP', label: 'FBA Prep Warehouse' },
  { value: 'RETURNS', label: 'Returns Processing' },
  { value: 'OVERFLOW', label: 'Overflow Storage' },
];

// Replenishment priorities
export const REPLEN_PRIORITIES = [
  { value: 'LOW', label: 'Low', color: 'default' },
  { value: 'MEDIUM', label: 'Medium', color: 'blue' },
  { value: 'HIGH', label: 'High', color: 'orange' },
  { value: 'URGENT', label: 'Urgent', color: 'red' },
];

// Best-before date alert thresholds (days)
export const BB_DATE_THRESHOLDS = {
  CRITICAL: 30,   // Red alert
  WARNING: 60,    // Yellow warning
  NORMAL: 90,     // Green/normal
};

// API Endpoints - Extended
export const EXTENDED_API_ENDPOINTS = {
  BRANDS: '/brands',
  BUNDLES: '/products?type=BUNDLE',
  REPLENISHMENT_TASKS: '/replenishment/tasks',
  REPLENISHMENT_CONFIG: '/replenishment/config',
  CHANNELS: '/channels',
  CHANNEL_PRICES: '/analytics/channel-prices',
  FBA_TRANSFERS: '/transfers?type=FBA_PREP',
};
CONSTANTS_EOF

echo "  ✅ Constants updated"

# ===================================
# 2. RENAME CATEGORIES TO BRANDS
# ===================================
echo ""
echo "📝 2. Renaming Categories to Brands..."

# Rename the categories directory to brands
if [ -d "app/products/categories" ]; then
  mv app/products/categories app/products/brands
  echo "  ✅ Renamed categories directory to brands"
fi

# Update MainLayout.tsx - Products menu
sed -i 's/Categories/Brands/g' components/layout/MainLayout.tsx
sed -i 's/products\/categories/products\/brands/g' components/layout/MainLayout.tsx

echo "  ✅ Updated navigation menu"

# ===================================
# 3. CREATE BUNDLE MANAGEMENT
# ===================================
echo ""
echo "📝 3. Creating Bundle Management page..."

mkdir -p app/products/bundles

cat > app/products/bundles/page.tsx << 'BUNDLE_EOF'
'use client';

import { useState, useEffect } from 'react';
import { Card, Table, Button, Tag, Modal, Form, Input, InputNumber, Select, message, Space, Divider } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, EyeOutlined } from '@ant-design/icons';
import apiService from '@/services/api';

export default function BundlesPage() {
  const [bundles, setBundles] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingBundle, setEditingBundle] = useState(null);
  const [form] = Form.useForm();

  useEffect(() => {
    fetchBundles();
    fetchProducts();
  }, []);

  const fetchBundles = async () => {
    setLoading(true);
    try {
      const data = await apiService.get('/products?type=BUNDLE');
      setBundles(data);
    } catch (error) {
      message.error('Failed to fetch bundles');
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async () => {
    try {
      const data = await apiService.get('/products?type=SIMPLE');
      setProducts(data);
    } catch (error) {
      console.error('Failed to fetch products');
    }
  };

  const handleCreate = () => {
    form.resetFields();
    setEditingBundle(null);
    setModalOpen(true);
  };

  const handleEdit = (record) => {
    setEditingBundle(record);
    form.setFieldsValue({
      name: record.name,
      sku: record.sku,
      costPrice: record.costPrice,
      sellingPrice: record.sellingPrice,
      bundleItems: record.bundleItems?.map(item => ({
        productId: item.child?.id,
        quantity: item.quantity
      })) || []
    });
    setModalOpen(true);
  };

  const handleSubmit = async (values) => {
    try {
      const payload = {
        ...values,
        type: 'BUNDLE',
        isPerishable: true,
        requiresBatch: true
      };

      if (editingBundle) {
        await apiService.put(`/products/${editingBundle.id}`, payload);
        message.success('Bundle updated successfully');
      } else {
        await apiService.post('/products', payload);
        message.success('Bundle created successfully');
      }

      setModalOpen(false);
      fetchBundles();
    } catch (error) {
      message.error('Failed to save bundle');
    }
  };

  const columns = [
    {
      title: 'SKU',
      dataIndex: 'sku',
      key: 'sku',
      width: 120,
    },
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Brand',
      dataIndex: ['brand', 'name'],
      key: 'brand',
      width: 120,
    },
    {
      title: 'Items',
      key: 'items',
      width: 100,
      render: (_, record) => (
        <Tag color="blue">{record.bundleItems?.length || 0} items</Tag>
      ),
    },
    {
      title: 'Cost',
      dataIndex: 'costPrice',
      key: 'costPrice',
      width: 100,
      render: (price) => `£${price?.toFixed(2)}`,
    },
    {
      title: 'Price',
      dataIndex: 'sellingPrice',
      key: 'sellingPrice',
      width: 100,
      render: (price) => `£${price?.toFixed(2)}`,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status) => (
        <Tag color={status === 'ACTIVE' ? 'green' : 'red'}>
          {status}
        </Tag>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 120,
      render: (_, record) => (
        <Space>
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          />
        </Space>
      ),
    },
  ];

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Product Bundles</h1>
          <p className="text-gray-500">Manage multi-pack and bundle products</p>
        </div>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={handleCreate}
        >
          Create Bundle
        </Button>
      </div>

      <Card>
        <Table
          columns={columns}
          dataSource={bundles}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 20 }}
        />
      </Card>

      <Modal
        title={editingBundle ? 'Edit Bundle' : 'Create Bundle'}
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onOk={() => form.submit()}
        width={700}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item
            label="Bundle Name"
            name="name"
            rules={[{ required: true }]}
          >
            <Input placeholder="e.g., Nakd Cashew Cookie 12-pack" />
          </Form.Item>

          <Form.Item
            label="SKU"
            name="sku"
            rules={[{ required: true }]}
          >
            <Input placeholder="e.g., NAKD-BDL-001" />
          </Form.Item>

          <div className="grid grid-cols-2 gap-4">
            <Form.Item label="Cost Price" name="costPrice" rules={[{ required: true }]}>
              <InputNumber prefix="£" min={0} step={0.01} style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item label="Selling Price" name="sellingPrice" rules={[{ required: true }]}>
              <InputNumber prefix="£" min={0} step={0.01} style={{ width: '100%' }} />
            </Form.Item>
          </div>

          <Divider>Bundle Contents</Divider>

          <Form.List name="bundleItems">
            {(fields, { add, remove }) => (
              <>
                {fields.map(({ key, name, ...restField }) => (
                  <Space key={key} style={{ display: 'flex', marginBottom: 8 }} align="baseline">
                    <Form.Item
                      {...restField}
                      name={[name, 'productId']}
                      rules={[{ required: true, message: 'Select product' }]}
                    >
                      <Select
                        placeholder="Select product"
                        style={{ width: 300 }}
                        showSearch
                        optionFilterProp="children"
                      >
                        {products.map(p => (
                          <Select.Option key={p.id} value={p.id}>
                            {p.name} ({p.sku})
                          </Select.Option>
                        ))}
                      </Select>
                    </Form.Item>
                    <Form.Item
                      {...restField}
                      name={[name, 'quantity']}
                      rules={[{ required: true }]}
                    >
                      <InputNumber min={1} placeholder="Qty" />
                    </Form.Item>
                    <Button onClick={() => remove(name)} danger>Remove</Button>
                  </Space>
                ))}
                <Form.Item>
                  <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />}>
                    Add Product to Bundle
                  </Button>
                </Form.Item>
              </>
            )}
          </Form.List>
        </Form>
      </Modal>
    </div>
  );
}
BUNDLE_EOF

echo "  ✅ Bundle Management page created"

# ===================================
# SUMMARY
# ===================================
echo ""
echo "✅ Frontend updates applied successfully!"
echo ""
echo "Next steps:"
echo "  1. Run: cd /root/kiaan-wms/frontend && npm run dev"
echo "  2. Visit: http://localhost:3011"
echo "  3. Check Products > Bundles page"
echo ""
echo "Remaining features (manual implementation recommended):"
echo "  - Wholesale toggle on orders page"
echo "  - Best-before dates in inventory"
echo "  - Replenishment menu and pages"
echo "  - FBA Shipment Builder"
echo "  - Analytics/Revenue Planner"
echo ""
