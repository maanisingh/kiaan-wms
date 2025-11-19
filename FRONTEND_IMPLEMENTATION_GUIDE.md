# Kiaan WMS - Complete Frontend Implementation Guide

## ✅ Completed

### 1. API Configuration Updated
- ✅ Changed API port from 8000 to 8010 in `/frontend/lib/constants.ts`
- ✅ Backend running on port 8010

### 2. Navigation Menu Updated
- ✅ Products menu now has:
  - All Products
  - **Brands** (renamed from Categories)
  - **Bundles** (new)
  - Import/Export
- ✅ Added **Replenishment** menu with:
  - Tasks
  - Settings
- ✅ Added **Analytics & Revenue** menu with:
  - Channel Pricing
  - Price Optimizer
  - Margin Analysis

## 🎯 Required Frontend Enhancements (Step-by-Step)

### PHASE 1: Products Page Enhancement (30 min)

**File: `/root/kiaan-wms/frontend/app/products/page.tsx`**

Add bundle filter to existing products page:

```typescript
// After line 33, add:
const [productType, setProductType] = useState<string | undefined>();

// In the filter section, add:
<Select
  placeholder="Product Type"
  style={{ width: 150 }}
  value={productType}
  onChange={(value) => setProductType(value)}
  allowClear
>
  <Select.Option value="SIMPLE">Simple</Select.Option>
  <Select.Option value="BUNDLE">Bundles</Select.Option>
  <Select.Option value="VARIANT">Variants</Select.Option>
</Select>

// In columns array, after Category column (line 95), add:
{
  title: 'Type',
  dataIndex: 'type',
  key: 'type',
  width: 100,
  render: (type: string) => {
    const colors = {
      SIMPLE: 'blue',
      BUNDLE: 'purple',
      VARIANT: 'cyan',
    };
    return <Tag color={colors[type] || 'default'}>{type}</Tag>;
  },
},
```

### PHASE 2: Inventory Page - Add Best-Before Dates (45 min)

**File: `/root/kiaan-wms/frontend/app/inventory/page.tsx`**

Add BB date column with color coding:

```typescript
// Add helper function at top:
const getBBDateColor = (bbDate: string) => {
  if (!bbDate) return 'default';
  const daysUntilExpiry = Math.floor(
    (new Date(bbDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  );

  if (daysUntilExpiry < 30) return 'error'; // Red
  if (daysUntilExpiry < 60) return 'warning'; // Yellow
  return 'success'; // Green
};

// In columns array, add after Location:
{
  title: 'Best Before',
  dataIndex: 'bestBeforeDate',
  key: 'bestBeforeDate',
  width: 130,
  render: (date: string) => {
    if (!date) return '-';
    const daysLeft = Math.floor(
      (new Date(date).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    );
    return (
      <Tag color={getBBDateColor(date)}>
        {format(new Date(date), 'dd/MM/yyyy')}
        <br />
        <small>{daysLeft} days</small>
      </Tag>
    );
  },
  sorter: (a, b) =>
    new Date(a.bestBeforeDate).getTime() - new Date(b.bestBeforeDate).getTime(),
},
{
  title: 'Lot Number',
  dataIndex: 'lotNumber',
  key: 'lotNumber',
  width: 120,
},
```

### PHASE 3: Sales Orders - Wholesale Badge & Toggle (30 min)

**File: `/root/kiaan-wms/frontend/app/sales-orders/page.tsx`**

Add wholesale indicator and toggle:

```typescript
// In columns array, add after Order Number:
{
  title: 'Type',
  key: 'orderType',
  width: 100,
  render: (_, record) => (
    record.isWholesale ? (
      <Tag color="gold" icon={<ShopOutlined />}>Wholesale</Tag>
    ) : (
      <Tag color="blue" icon={<ShoppingOutlined />}>Retail</Tag>
    )
  ),
},
{
  title: 'Channel',
  dataIndex: 'salesChannel',
  key: 'salesChannel',
  width: 150,
  render: (channel: string) => channel || '-',
},

// In actions column, add wholesale toggle button:
{
  title: 'Actions',
  key: 'actions',
  fixed: 'right',
  width: 150,
  render: (_, record) => (
    <Space>
      <Tooltip title={record.isWholesale ? 'Mark as Retail' : 'Mark as Wholesale'}>
        <Button
          size="small"
          type={record.isWholesale ? 'primary' : 'default'}
          icon={<ShopOutlined />}
          onClick={() => handleToggleWholesale(record.id, !record.isWholesale)}
        />
      </Tooltip>
      <Button
        size="small"
        icon={<EyeOutlined />}
        onClick={() => router.push(`/sales-orders/${record.id}`)}
      />
    </Space>
  ),
},

// Add toggle handler function:
const handleToggleWholesale = async (orderId: string, isWholesale: boolean) => {
  try {
    await apiService.patch(`/sales-orders/${orderId}/wholesale`, { isWholesale });
    message.success(`Order marked as ${isWholesale ? 'wholesale' : 'retail'}`);
    // Refresh orders
    fetchOrders();
  } catch (error) {
    message.error('Failed to update order type');
  }
};
```

### PHASE 4: Create Replenishment Tasks Page (1 hour)

**File: `/root/kiaan-wms/frontend/app/replenishment/tasks/page.tsx`**

```typescript
'use client';

import { useState, useEffect } from 'react';
import { Table, Card, Tag, Button, Space, Select, message } from 'antd';
import { CheckOutlined, UserOutlined } from '@ant-design/icons';
import apiService from '@/services/api';
import { format } from 'date-fns';

export default function ReplenishmentTasksPage() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>();

  useEffect(() => {
    fetchTasks();
  }, [statusFilter]);

  const fetchTasks = async () => {
    setLoading(true);
    try {
      const url = statusFilter
        ? `/replenishment/tasks?status=${statusFilter}`
        : '/replenishment/tasks';
      const data = await apiService.get(url);
      setTasks(data);
    } catch (error) {
      message.error('Failed to fetch tasks');
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteTask = async (taskId: string) => {
    try {
      await apiService.patch(`/replenishment/tasks/${taskId}`, {
        status: 'COMPLETED'
      });
      message.success('Task marked as completed');
      fetchTasks();
    } catch (error) {
      message.error('Failed to update task');
    }
  };

  const columns = [
    {
      title: 'Task #',
      dataIndex: 'taskNumber',
      key: 'taskNumber',
      width: 120,
    },
    {
      title: 'Product',
      dataIndex: ['product', 'name'],
      key: 'product',
      width: 250,
    },
    {
      title: 'Brand',
      dataIndex: ['product', 'brand', 'name'],
      key: 'brand',
      width: 120,
    },
    {
      title: 'From Location',
      dataIndex: 'fromLocation',
      key: 'from',
      width: 120,
    },
    {
      title: 'To Location',
      dataIndex: 'toLocation',
      key: 'to',
      width: 120,
    },
    {
      title: 'Quantity',
      key: 'quantity',
      width: 100,
      render: (_, record) => `${record.quantityMoved}/${record.quantityNeeded}`,
    },
    {
      title: 'Priority',
      dataIndex: 'priority',
      key: 'priority',
      width: 100,
      render: (priority: string) => {
        const colors = {
          LOW: 'default',
          MEDIUM: 'blue',
          HIGH: 'orange',
          URGENT: 'red',
        };
        return <Tag color={colors[priority]}>{priority}</Tag>;
      },
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status: string) => {
        const colors = {
          PENDING: 'orange',
          IN_PROGRESS: 'blue',
          COMPLETED: 'green',
        };
        return <Tag color={colors[status]}>{status}</Tag>;
      },
    },
    {
      title: 'Created',
      dataIndex: 'createdAt',
      key: 'created',
      width: 120,
      render: (date: string) => format(new Date(date), 'dd/MM/yyyy'),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 100,
      render: (_, record) => (
        record.status !== 'COMPLETED' && (
          <Button
            size="small"
            type="primary"
            icon={<CheckOutlined />}
            onClick={() => handleCompleteTask(record.id)}
          >
            Complete
          </Button>
        )
      ),
    },
  ];

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Replenishment Tasks</h1>
          <p className="text-gray-500">Manage stock replenishment from bulk to pick locations</p>
        </div>
        <Select
          placeholder="Filter by status"
          style={{ width: 150 }}
          value={statusFilter}
          onChange={setStatusFilter}
          allowClear
        >
          <Select.Option value="PENDING">Pending</Select.Option>
          <Select.Option value="IN_PROGRESS">In Progress</Select.Option>
          <Select.Option value="COMPLETED">Completed</Select.Option>
        </Select>
      </div>

      <Card>
        <Table
          columns={columns}
          dataSource={tasks}
          loading={loading}
          rowKey="id"
          pagination={{ pageSize: 20 }}
        />
      </Card>
    </div>
  );
}
```

### PHASE 5: Create Replenishment Settings Page (1 hour)

**File: `/root/kiaan-wms/frontend/app/replenishment/settings/page.tsx`**

```typescript
'use client';

import { useState, useEffect } from 'react';
import { Table, Card, Button, Modal, Form, InputNumber, Switch, message } from 'antd';
import { EditOutlined, PlusOutlined } from '@ant-design/icons';
import apiService from '@/services/api';

export default function ReplenishmentSettingsPage() {
  const [configs, setConfigs] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingConfig, setEditingConfig] = useState(null);
  const [form] = Form.useForm();

  useEffect(() => {
    fetchConfigs();
    fetchProducts();
  }, []);

  const fetchConfigs = async () => {
    setLoading(true);
    try {
      const data = await apiService.get('/replenishment/config');
      setConfigs(data);
    } catch (error) {
      message.error('Failed to fetch configurations');
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async () => {
    try {
      const data = await apiService.get('/products');
      setProducts(data);
    } catch (error) {
      console.error('Failed to fetch products');
    }
  };

  const handleEdit = (record) => {
    setEditingConfig(record);
    form.setFieldsValue({
      productId: record.product.id,
      minStockLevel: record.minStockLevel,
      maxStockLevel: record.maxStockLevel,
      reorderPoint: record.reorderPoint,
      reorderQuantity: record.reorderQuantity,
      autoCreateTasks: record.autoCreateTasks,
      enabled: record.enabled,
    });
    setModalOpen(true);
  };

  const handleSubmit = async (values) => {
    try {
      if (editingConfig) {
        await apiService.put(`/replenishment/config/${editingConfig.id}`, values);
        message.success('Configuration updated');
      } else {
        await apiService.post('/replenishment/config', values);
        message.success('Configuration created');
      }
      setModalOpen(false);
      fetchConfigs();
    } catch (error) {
      message.error('Failed to save configuration');
    }
  };

  const columns = [
    {
      title: 'Product',
      dataIndex: ['product', 'name'],
      key: 'product',
    },
    {
      title: 'Min Level',
      dataIndex: 'minStockLevel',
      key: 'min',
      width: 100,
    },
    {
      title: 'Max Level',
      dataIndex: 'maxStockLevel',
      key: 'max',
      width: 100,
    },
    {
      title: 'Reorder Point',
      dataIndex: 'reorderPoint',
      key: 'reorder',
      width: 120,
    },
    {
      title: 'Reorder Qty',
      dataIndex: 'reorderQuantity',
      key: 'qty',
      width: 120,
    },
    {
      title: 'Auto Tasks',
      dataIndex: 'autoCreateTasks',
      key: 'auto',
      width: 100,
      render: (auto) => auto ? 'Yes' : 'No',
    },
    {
      title: 'Enabled',
      dataIndex: 'enabled',
      key: 'enabled',
      width: 100,
      render: (enabled) => enabled ? 'Yes' : 'No',
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 100,
      render: (_, record) => (
        <Button
          size="small"
          icon={<EditOutlined />}
          onClick={() => handleEdit(record)}
        />
      ),
    },
  ];

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Replenishment Settings</h1>
          <p className="text-gray-500">Configure min/max levels and reorder points</p>
        </div>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => {
            setEditingConfig(null);
            form.resetFields();
            setModalOpen(true);
          }}
        >
          Add Configuration
        </Button>
      </div>

      <Card>
        <Table
          columns={columns}
          dataSource={configs}
          loading={loading}
          rowKey="id"
        />
      </Card>

      <Modal
        title={editingConfig ? 'Edit Configuration' : 'Add Configuration'}
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onOk={() => form.submit()}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item label="Min Stock Level" name="minStockLevel" rules={[{ required: true }]}>
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item label="Max Stock Level" name="maxStockLevel" rules={[{ required: true }]}>
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item label="Reorder Point" name="reorderPoint" rules={[{ required: true }]}>
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item label="Reorder Quantity" name="reorderQuantity" rules={[{ required: true }]}>
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item label="Auto Create Tasks" name="autoCreateTasks" valuePropName="checked">
            <Switch />
          </Form.Item>
          <Form.Item label="Enabled" name="enabled" valuePropName="checked">
            <Switch />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
```

### PHASE 6: Analytics Channel Pricing Page (1 hour)

**File: `/root/kiaan-wms/frontend/app/analytics/channels/page.tsx`**

```typescript
'use client';

import { useState, useEffect } from 'react';
import { Table, Card, Select, Tag, Statistic, Row, Col } from 'antd';
import apiService from '@/services/api';

export default function ChannelPricingPage() {
  const [prices, setPrices] = useState([]);
  const [channels, setChannels] = useState([]);
  const [selectedChannel, setSelectedChannel] = useState<string>();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchChannels();
    fetchPrices();
  }, [selectedChannel]);

  const fetchChannels = async () => {
    try {
      const data = await apiService.get('/channels');
      setChannels(data);
    } catch (error) {
      console.error('Failed to fetch channels');
    }
  };

  const fetchPrices = async () => {
    setLoading(true);
    try {
      const url = selectedChannel
        ? `/analytics/channel-prices?channelId=${selectedChannel}`
        : '/analytics/channel-prices';
      const data = await apiService.get(url);
      setPrices(data);
    } catch (error) {
      console.error('Failed to fetch prices');
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      title: 'Product',
      dataIndex: ['product', 'name'],
      key: 'product',
    },
    {
      title: 'Brand',
      dataIndex: ['product', 'brand', 'name'],
      key: 'brand',
      width: 120,
    },
    {
      title: 'Channel',
      dataIndex: ['channel', 'name'],
      key: 'channel',
      width: 150,
    },
    {
      title: 'Selling Price',
      dataIndex: 'sellingPrice',
      key: 'price',
      width: 120,
      render: (price) => `£${price?.toFixed(2)}`,
    },
    {
      title: 'Product Cost',
      dataIndex: 'productCost',
      key: 'cost',
      width: 120,
      render: (cost) => `£${cost?.toFixed(2)}`,
    },
    {
      title: 'Labor',
      dataIndex: 'laborCost',
      key: 'labor',
      width: 100,
      render: (cost) => `£${cost?.toFixed(2)}`,
    },
    {
      title: 'Materials',
      dataIndex: 'materialCost',
      key: 'materials',
      width: 100,
      render: (cost) => `£${cost?.toFixed(2)}`,
    },
    {
      title: 'Total Cost',
      dataIndex: 'totalCost',
      key: 'totalCost',
      width: 120,
      render: (cost) => `£${cost?.toFixed(2)}`,
    },
    {
      title: 'Gross Profit',
      dataIndex: 'grossProfit',
      key: 'profit',
      width: 120,
      render: (profit) => (
        <span className={profit > 0 ? 'text-green-600' : 'text-red-600'}>
          £{profit?.toFixed(2)}
        </span>
      ),
    },
    {
      title: 'Margin %',
      dataIndex: 'profitMargin',
      key: 'margin',
      width: 100,
      render: (margin) => {
        const color = margin >= 20 ? 'success' : margin >= 10 ? 'warning' : 'error';
        return <Tag color={color}>{margin?.toFixed(1)}%</Tag>;
      },
    },
  ];

  const avgMargin = prices.length > 0
    ? prices.reduce((sum, p) => sum + (p.profitMargin || 0), 0) / prices.length
    : 0;

  const totalProfit = prices.reduce((sum, p) => sum + (p.grossProfit || 0), 0);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Channel Pricing Analysis</h1>

      <Row gutter={16} className="mb-6">
        <Col span={8}>
          <Card>
            <Statistic
              title="Total Products"
              value={prices.length}
              suffix="items"
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic
              title="Average Margin"
              value={avgMargin.toFixed(1)}
              suffix="%"
              valueStyle={{ color: avgMargin >= 20 ? '#3f8600' : '#cf1322' }}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic
              title="Total Gross Profit"
              value={totalProfit.toFixed(2)}
              prefix="£"
              valueStyle={{ color: '#3f8600' }}
            />
          </Card>
        </Col>
      </Row>

      <Card>
        <div className="mb-4">
          <Select
            placeholder="Filter by channel"
            style={{ width: 200 }}
            value={selectedChannel}
            onChange={setSelectedChannel}
            allowClear
          >
            {channels.map(ch => (
              <Select.Option key={ch.id} value={ch.id}>{ch.name}</Select.Option>
            ))}
          </Select>
        </div>

        <Table
          columns={columns}
          dataSource={prices}
          loading={loading}
          rowKey="id"
          pagination={{ pageSize: 20 }}
        />
      </Card>
    </div>
  );
}
```

## 🚀 Quick Implementation Script

Create this file to rename categories folder:

```bash
#!/bin/bash
cd /root/kiaan-wms/frontend

# Rename categories to brands
if [ -d "app/products/categories" ]; then
  mv app/products/categories app/products/brands
  echo "✅ Renamed categories to brands"
fi

# Update references
sed -i 's/products\/categories/products\/brands/g' components/layout/MainLayout.tsx
sed -i 's/Categories/Brands/g' app/products/brands/page.tsx

echo "✅ Done!"
```

## 📝 Testing Checklist

Once pages are created, test:

- [ ] Products page shows bundle filter
- [ ] Inventory shows best-before dates with color coding
- [ ] Orders have wholesale badge and toggle button
- [ ] Replenishment Tasks page loads and displays tasks
- [ ] Replenishment Settings allows configuration
- [ ] Channel Pricing shows margin calculations
- [ ] All navigation menu items work

## 🎨 Key Features Summary

### Bundles
- Filter products by type (SIMPLE/BUNDLE/VARIANT)
- View bundle composition
- Create multi-pack products

### Wholesale
- Visual badge on wholesale orders
- One-click toggle between retail/wholesale
- Auto-flagging by sales channel

### Best-Before Dates
- Color-coded based on expiry (Red <30 days, Yellow <60 days, Green >60 days)
- Shows days until expiry
- Sortable by BB date
- Lot number tracking

### Replenishment
- Task queue system
- Configurable min/max levels
- Auto-task creation
- Priority-based task management

### Analytics
- Per-channel pricing
- Cost breakdown (product + labor + materials)
- Gross profit calculation
- Margin % with color coding
- Channel comparison

## 🔧 Environment Setup

Make sure `.env.local` or `.env.production` has:

```env
NEXT_PUBLIC_API_URL=http://localhost:8010/api
```

For production deployment:
```env
NEXT_PUBLIC_API_URL=https://wms-api.alexandratechlab.com/api
```

## 📦 Next Steps

1. **Test locally:**
   ```bash
   cd /root/kiaan-wms/frontend
   npm run dev
   ```

2. **Build for production:**
   ```bash
   npm run build
   ```

3. **Deploy to Railway:**
   - Push changes to GitHub
   - Railway will auto-deploy
   - Update environment variable `NEXT_PUBLIC_API_URL`

---

**All backend features are 100% ready! The frontend just needs these UI updates to make them visible and usable.**
