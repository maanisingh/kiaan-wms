'use client';

import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Tag,
  Button,
  Space,
  Modal,
  Form,
  Input,
  InputNumber,
  Select,
  message,
  Tabs,
  Badge,
  Statistic,
  Row,
  Col,
  DatePicker,
  Timeline,
} from 'antd';
import {
  PlusOutlined,
  ReloadOutlined,
  EyeOutlined,
  SwapOutlined,
  ArrowRightOutlined,
  InboxOutlined,
  CarOutlined,
  DatabaseOutlined,
  FilterOutlined,
  EditOutlined,
  DeleteOutlined,
} from '@ant-design/icons';
import { useAuthStore } from '@/store/authStore';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import apiService from '@/services/api';

dayjs.extend(relativeTime);

const { Option } = Select;
const { RangePicker } = DatePicker;

interface Movement {
  id: string;
  type: string;
  productId: string;
  product: any;
  batchId?: string;
  batch?: any;
  fromLocationId?: string;
  fromLocation?: any;
  toLocationId?: string;
  toLocation?: any;
  quantity: number;
  reason?: string;
  notes?: string;
  userId: string;
  user: any;
  createdAt: string;
}

export default function InventoryMovementsPage() {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [movements, setMovements] = useState<Movement[]>([]);
  const [filteredMovements, setFilteredMovements] = useState<Movement[]>([]);
  const [activeTab, setActiveTab] = useState('all');
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [productHistoryVisible, setProductHistoryVisible] = useState(false);
  const [selectedProductMovements, setSelectedProductMovements] = useState<Movement[]>([]);
  const [form] = Form.useForm();
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs | null, dayjs.Dayjs | null]>([null, null]);
  const [typeFilter, setTypeFilter] = useState<string>('all');

  // Dropdown data state
  const [products, setProducts] = useState<any[]>([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [batches, setBatches] = useState<any[]>([]);
  const [batchesLoading, setBatchesLoading] = useState(false);
  const [locations, setLocations] = useState<any[]>([]);
  const [locationsLoading, setLocationsLoading] = useState(false);
  const [inventory, setInventory] = useState<any[]>([]);
  const [inventoryLoading, setInventoryLoading] = useState(false);

  // Edit modal state
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingMovement, setEditingMovement] = useState<Movement | null>(null);
  const [editForm] = Form.useForm();

  // Detail view modal state
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedMovement, setSelectedMovement] = useState<Movement | null>(null);

  // Fetch movements
  const fetchMovements = async () => {
    setLoading(true);
    try {
      let url = '/inventory/movements?limit=100';

      if (dateRange[0] && dateRange[1]) {
        url += `&startDate=${dateRange[0].toISOString()}&endDate=${dateRange[1].toISOString()}`;
      }

      if (typeFilter !== 'all') {
        url += `&type=${typeFilter}`;
      }

      const data = await apiService.get(url);
      setMovements(Array.isArray(data) ? data : []);
      setFilteredMovements(Array.isArray(data) ? data : []);
    } catch (error: any) {
      console.error('Fetch movements error:', error);
      message.error(error.message || 'Error loading movements');
    } finally {
      setLoading(false);
    }
  };

  // Fetch product movement history
  const fetchProductHistory = async (productId: string) => {
    try {
      const data = await apiService.get(`/inventory/movements/product/${productId}`);
      setSelectedProductMovements(Array.isArray(data) ? data : []);
      setProductHistoryVisible(true);
    } catch (error: any) {
      console.error('Fetch product history error:', error);
      message.error(error.message || 'Error loading product history');
    }
  };

  // Fetch products for dropdown
  const fetchProducts = async () => {
    try {
      setProductsLoading(true);
      const data = await apiService.get('/products');
      setProducts(Array.isArray(data) ? data : (data?.data || []));
    } catch (error: any) {
      console.error('Fetch products error:', error);
    } finally {
      setProductsLoading(false);
    }
  };

  // Fetch batches for dropdown
  const fetchBatches = async () => {
    try {
      setBatchesLoading(true);
      const data = await apiService.get('/inventory/batches');
      setBatches(Array.isArray(data) ? data : []);
    } catch (error: any) {
      console.error('Fetch batches error:', error);
    } finally {
      setBatchesLoading(false);
    }
  };

  // Fetch locations for dropdown
  const fetchLocations = async () => {
    try {
      setLocationsLoading(true);
      const data = await apiService.get('/locations');
      setLocations(Array.isArray(data) ? data : []);
    } catch (error: any) {
      console.error('Fetch locations error:', error);
    } finally {
      setLocationsLoading(false);
    }
  };

  // Fetch inventory (products with available quantities)
  const fetchInventory = async () => {
    try {
      setInventoryLoading(true);
      const data = await apiService.get('/inventory');
      setInventory(Array.isArray(data) ? data : []);
    } catch (error: any) {
      console.error('Fetch inventory error:', error);
    } finally {
      setInventoryLoading(false);
    }
  };

  useEffect(() => {
    fetchMovements();
  }, [dateRange, typeFilter]);

  useEffect(() => {
    fetchProducts();
    fetchBatches();
    fetchLocations();
    fetchInventory();
  }, []);

  // Apply tab filters
  useEffect(() => {
    let filtered = [...movements];

    if (activeTab !== 'all') {
      filtered = filtered.filter(m => m.type === activeTab.toUpperCase());
    }

    setFilteredMovements(filtered);
  }, [movements, activeTab]);

  // Create new movement
  const handleCreateMovement = async (values: any) => {
    try {
      await apiService.post('/inventory/movements', values);
      message.success('Movement created successfully');
      form.resetFields();
      setCreateModalVisible(false);
      fetchMovements();
    } catch (error: any) {
      console.error('Create movement error:', error);
      message.error(error.response?.data?.error || error.message || 'Failed to create movement');
    }
  };

  // Edit movement
  const handleEditMovement = (movement: Movement) => {
    setEditingMovement(movement);
    editForm.setFieldsValue({
      type: movement.type,
      productId: movement.productId,
      batchId: movement.batchId,
      fromLocationId: movement.fromLocationId,
      toLocationId: movement.toLocationId,
      quantity: movement.quantity,
      reason: movement.reason,
      notes: movement.notes,
    });
    setEditModalVisible(true);
  };

  // Save edited movement
  const handleSaveEdit = async (values: any) => {
    if (!editingMovement) return;
    try {
      await apiService.patch(`/inventory/movements/${editingMovement.id}`, values);
      message.success('Movement updated successfully');
      editForm.resetFields();
      setEditModalVisible(false);
      setEditingMovement(null);
      fetchMovements();
    } catch (error: any) {
      console.error('Edit movement error:', error);
      message.error(error.response?.data?.error || error.message || 'Failed to update movement');
    }
  };

  // View movement details
  const handleViewMovement = (movement: Movement) => {
    setSelectedMovement(movement);
    setDetailModalVisible(true);
  };

  // Delete movement
  const handleDeleteMovement = (movement: Movement) => {
    Modal.confirm({
      title: 'Delete Movement',
      content: `Are you sure you want to delete this ${movement.type} movement for ${movement.product?.name || 'Unknown Product'}? This action cannot be undone.`,
      okText: 'Delete',
      okType: 'danger',
      cancelText: 'Cancel',
      onOk: async () => {
        try {
          await apiService.delete(`/inventory/movements/${movement.id}`);
          message.success('Movement deleted successfully');
          fetchMovements();
        } catch (error: any) {
          console.error('Delete movement error:', error);
          message.error(error.response?.data?.error || error.message || 'Failed to delete movement');
        }
      },
    });
  };

  const getMovementTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      RECEIVE: 'green',
      PICK: 'red',
      TRANSFER: 'blue',
      ADJUST: 'orange',
      RETURN: 'purple',
      CYCLE_COUNT: 'cyan',
      SHIPMENT: 'magenta',
      DAMAGE: 'volcano',
      LOSS: 'default',
    };
    return colors[type] || 'default';
  };

  // Statistics
  const stats = {
    total: movements.length,
    receive: movements.filter(m => m.type === 'RECEIVE').length,
    pick: movements.filter(m => m.type === 'PICK').length,
    transfers: movements.filter(m => m.type === 'TRANSFER').length,
    adjustments: movements.filter(m => m.type === 'ADJUST').length,
    totalQuantity: movements.reduce((sum, m) => sum + m.quantity, 0),
  };

  // Table columns
  const columns = [
    {
      title: 'Date',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 150,
      render: (date: string) => (
        <div>
          <div>{dayjs(date).format('MMM DD, YYYY')}</div>
          <div className="text-xs text-gray-500">{dayjs(date).format('HH:mm')}</div>
        </div>
      ),
      sorter: (a: Movement, b: Movement) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    },
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      width: 120,
      render: (type: string) => (
        <Tag color={getMovementTypeColor(type)}>
          {type}
        </Tag>
      ),
    },
    {
      title: 'Product',
      dataIndex: 'product',
      key: 'product',
      width: 200,
      render: (product: any, record: Movement) => (
        <div>
          <div className="font-medium">{product?.name || 'Unknown'}</div>
          <div className="text-xs text-gray-500">
            SKU: {product?.sku || 'N/A'}
            {record.batch && ` • Batch: ${record.batch.batchNumber}`}
          </div>
        </div>
      ),
    },
    {
      title: 'From Location',
      dataIndex: 'fromLocation',
      key: 'fromLocation',
      width: 130,
      render: (location: any) =>
        location ? (
          <Tag color="orange">
            {location.aisle}-{location.rack}-{location.bin}
          </Tag>
        ) : (
          <Tag>N/A</Tag>
        ),
    },
    {
      title: 'To Location',
      dataIndex: 'toLocation',
      key: 'toLocation',
      width: 130,
      render: (location: any) =>
        location ? (
          <Tag color="green">
            {location.aisle}-{location.rack}-{location.bin}
          </Tag>
        ) : (
          <Tag>N/A</Tag>
        ),
    },
    {
      title: 'Quantity',
      dataIndex: 'quantity',
      key: 'quantity',
      width: 100,
      render: (qty: number) => <strong>{qty} units</strong>,
    },
    {
      title: 'User',
      dataIndex: 'user',
      key: 'user',
      width: 150,
      render: (user: any) => (
        <div>
          <div>{user?.name || 'Unknown'}</div>
          <div className="text-xs text-gray-500">{user?.email || 'N/A'}</div>
        </div>
      ),
    },
    {
      title: 'Reason',
      dataIndex: 'reason',
      key: 'reason',
      width: 150,
      ellipsis: true,
      render: (reason: string) => reason || '-',
    },
    {
      title: 'Actions',
      key: 'actions',
      fixed: 'right' as const,
      width: 200,
      render: (record: Movement) => (
        <Space>
          <Button
            type="text"
            icon={<EyeOutlined />}
            onClick={(e) => { e.stopPropagation(); fetchProductHistory(record.productId); }}
            title="View History"
          />
          <Button
            type="text"
            icon={<EditOutlined />}
            onClick={(e) => { e.stopPropagation(); handleEditMovement(record); }}
            title="Edit Movement"
          />
          <Button
            type="text"
            danger
            icon={<DeleteOutlined />}
            onClick={(e) => { e.stopPropagation(); handleDeleteMovement(record); }}
            title="Delete Movement"
          />
        </Space>
      ),
    },
  ];

  const tabItems = [
    {
      key: 'all',
      label: (
        <span>
          All Movements
          <Badge count={stats.total} style={{ marginLeft: 8, backgroundColor: '#52c41a' }} />
        </span>
      ),
    },
    {
      key: 'receive',
      label: (
        <span>
          Receive
          <Badge count={stats.receive} style={{ marginLeft: 8, backgroundColor: '#52c41a' }} />
        </span>
      ),
    },
    {
      key: 'pick',
      label: (
        <span>
          Pick
          <Badge count={stats.pick} style={{ marginLeft: 8, backgroundColor: '#ff4d4f' }} />
        </span>
      ),
    },
    {
      key: 'transfer',
      label: (
        <span>
          Transfers
          <Badge count={stats.transfers} style={{ marginLeft: 8, backgroundColor: '#1890ff' }} />
        </span>
      ),
    },
    {
      key: 'adjust',
      label: (
        <span>
          Adjustments
          <Badge count={stats.adjustments} style={{ marginLeft: 8, backgroundColor: '#faad14' }} />
        </span>
      ),
    },
  ];

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
              <CarOutlined className="text-blue-600" />
              Inventory Movements
            </h1>
            <p className="text-gray-600 mt-1">Track all inventory movements and transfers</p>
          </div>
          <Space>
            <Button icon={<ReloadOutlined />} onClick={() => fetchMovements()}>
              Refresh
            </Button>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => setCreateModalVisible(true)}>
              Create Movement
            </Button>
          </Space>
        </div>
      </div>

      {/* KPI Statistics */}
      <Row gutter={[16, 16]} className="mb-6">
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Total Movements"
              value={stats.total}
              prefix={<DatabaseOutlined className="text-blue-600" />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Receive"
              value={stats.receive}
              prefix={<InboxOutlined className="text-green-600" />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Transfers"
              value={stats.transfers}
              prefix={<SwapOutlined className="text-blue-600" />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Total Quantity Moved"
              value={stats.totalQuantity}
              suffix="units"
            />
          </Card>
        </Col>
      </Row>

      {/* Filters */}
      <Card className="mb-4">
        <Space>
          <RangePicker
            value={dateRange as any}
            onChange={(dates) => setDateRange(dates as any)}
            format="MMM DD, YYYY"
          />
          <Select
            value={typeFilter}
            onChange={setTypeFilter}
            style={{ width: 150 }}
            placeholder="Filter by Type"
          >
            <Option value="all">All Types</Option>
            <Option value="RECEIVE">Receive</Option>
            <Option value="PICK">Pick</Option>
            <Option value="TRANSFER">Transfer</Option>
            <Option value="ADJUST">Adjust</Option>
            <Option value="RETURN">Return</Option>
            <Option value="SHIPMENT">Shipment</Option>
            <Option value="DAMAGE">Damage</Option>
            <Option value="LOSS">Loss</Option>
          </Select>
        </Space>
      </Card>

      {/* Movements Table */}
      <Card>
        <Tabs activeKey={activeTab} onChange={setActiveTab} items={tabItems} className="mb-4" />

        <Table
          dataSource={filteredMovements}
          columns={columns}
          rowKey="id"
          loading={loading}
          scroll={{ x: 1300 }}
          pagination={{
            pageSize: 20,
            showSizeChanger: true,
            showTotal: (total) => `Total ${total} movements`,
          }}
          onRow={(record) => ({
            onClick: () => handleViewMovement(record),
            style: { cursor: 'pointer' },
          })}
        />
      </Card>

      {/* Create Movement Modal */}
      <Modal
        title="Create Inventory Movement"
        open={createModalVisible}
        onCancel={() => setCreateModalVisible(false)}
        onOk={() => form.submit()}
        width={600}
      >
        <Form form={form} layout="vertical" onFinish={handleCreateMovement}>
          <Form.Item
            name="type"
            label="Movement Type"
            rules={[{ required: true, message: 'Please select movement type' }]}
          >
            <Select placeholder="Select type">
              <Option value="RECEIVE">Receive (Inbound)</Option>
              <Option value="PICK">Pick (Outbound)</Option>
              <Option value="TRANSFER">Transfer (Between Locations)</Option>
              <Option value="ADJUST">Adjustment</Option>
              <Option value="RETURN">Return</Option>
              <Option value="SHIPMENT">Shipment</Option>
              <Option value="DAMAGE">Damage</Option>
              <Option value="LOSS">Loss</Option>
            </Select>
          </Form.Item>

          <Form.Item
            noStyle
            shouldUpdate={(prevValues, currentValues) => prevValues.type !== currentValues.type}
          >
            {({ getFieldValue }) => {
              const movementType = getFieldValue('type');
              // For outbound movements, only show products with available inventory
              const outboundTypes = ['PICK', 'TRANSFER', 'SHIPMENT', 'DAMAGE', 'LOSS'];
              const isOutbound = outboundTypes.includes(movementType);

              // Get products that have inventory
              const productsWithInventory = isOutbound
                ? products.filter(product => {
                    const productInventory = inventory.find(inv => inv.productId === product.id);
                    return productInventory && (productInventory.quantity > 0 || productInventory.availableQuantity > 0);
                  })
                : products;

              return (
                <Form.Item
                  name="productId"
                  label="Product"
                  rules={[{ required: true, message: 'Please select a product' }]}
                  extra={isOutbound && productsWithInventory.length === 0 ?
                    <span className="text-orange-500">No products with available inventory</span> :
                    isOutbound ? <span className="text-gray-500">Showing {productsWithInventory.length} products with available inventory</span> : null
                  }
                >
                  <Select
                    placeholder={isOutbound ? "Select a product with inventory" : "Select a product"}
                    loading={productsLoading || inventoryLoading}
                    showSearch
                    optionFilterProp="label"
                    options={productsWithInventory.map((product) => {
                      const productInventory = inventory.find(inv => inv.productId === product.id);
                      const availableQty = productInventory?.availableQuantity || productInventory?.quantity || 0;
                      return {
                        key: product.id,
                        value: product.id,
                        label: isOutbound
                          ? `${product.name || 'Unnamed'} (${product.sku || 'No SKU'}) - Qty: ${availableQty}`
                          : `${product.name || 'Unnamed'} ${product.sku ? `(${product.sku})` : ''}`
                      };
                    })}
                  />
                </Form.Item>
              );
            }}
          </Form.Item>

          <Form.Item name="batchId" label="Batch (Optional)">
            <Select
              placeholder="Select a batch (optional)"
              loading={batchesLoading}
              showSearch
              allowClear
              optionFilterProp="label"
              options={batches.map((batch) => ({
                key: batch.id,
                value: batch.id,
                label: `${batch.batchNumber} - ${batch.product?.name || 'Unknown Product'} (Qty: ${batch.availableQuantity})`
              }))}
            />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="fromLocationId" label="From Location">
                <Select
                  placeholder="Select source location"
                  loading={locationsLoading}
                  showSearch
                  allowClear
                  optionFilterProp="label"
                  options={locations.map((location) => ({
                    key: location.id,
                    value: location.id,
                    label: `${location.name || location.code} (${location.aisle}-${location.rack}-${location.bin})`
                  }))}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="toLocationId" label="To Location">
                <Select
                  placeholder="Select destination location"
                  loading={locationsLoading}
                  showSearch
                  allowClear
                  optionFilterProp="label"
                  options={locations.map((location) => ({
                    key: location.id,
                    value: location.id,
                    label: `${location.name || location.code} (${location.aisle}-${location.rack}-${location.bin})`
                  }))}
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="quantity"
            label="Quantity"
            rules={[{ required: true, message: 'Please enter quantity' }]}
          >
            <InputNumber min={1} style={{ width: '100%' }} placeholder="Units" />
          </Form.Item>

          <Form.Item name="reason" label="Reason">
            <Input placeholder="e.g., Stock replenishment, Customer order, etc." />
          </Form.Item>

          <Form.Item name="notes" label="Notes">
            <Input.TextArea rows={3} placeholder="Additional notes (optional)" />
          </Form.Item>
        </Form>
      </Modal>

      {/* Product History Modal */}
      <Modal
        title="Product Movement History"
        open={productHistoryVisible}
        onCancel={() => setProductHistoryVisible(false)}
        footer={null}
        width={700}
      >
        {selectedProductMovements.length > 0 && (
          <div>
            <div className="mb-4">
              <p className="text-gray-600">
                <strong>Product:</strong> {selectedProductMovements[0].product?.name}
              </p>
              <p className="text-gray-600">
                <strong>SKU:</strong> {selectedProductMovements[0].product?.sku}
              </p>
            </div>

            <Timeline
              items={selectedProductMovements.map((movement) => ({
                color: getMovementTypeColor(movement.type),
                children: (
                  <div>
                    <div className="flex justify-between items-start">
                      <div>
                        <Tag color={getMovementTypeColor(movement.type)}>{movement.type}</Tag>
                        <div className="mt-2 text-sm text-gray-600">
                          {movement.fromLocation && (
                            <span>
                              From: {movement.fromLocation.aisle}-{movement.fromLocation.rack}-
                              {movement.fromLocation.bin}
                            </span>
                          )}
                          {movement.fromLocation && movement.toLocation && <span> → </span>}
                          {movement.toLocation && (
                            <span>
                              To: {movement.toLocation.aisle}-{movement.toLocation.rack}-
                              {movement.toLocation.bin}
                            </span>
                          )}
                        </div>
                        <div className="mt-1 text-sm">
                          <strong>Quantity:</strong> {movement.quantity} units
                        </div>
                        {movement.reason && (
                          <div className="mt-1 text-sm text-gray-600">
                            <strong>Reason:</strong> {movement.reason}
                          </div>
                        )}
                        <div className="mt-1 text-xs text-gray-500">
                          {movement.user?.name} • {dayjs(movement.createdAt).format('MMM DD, YYYY HH:mm')}
                        </div>
                      </div>
                    </div>
                  </div>
                ),
              }))}
            />
          </div>
        )}
      </Modal>

      {/* Edit Movement Modal */}
      <Modal
        title="Edit Movement"
        open={editModalVisible}
        onCancel={() => {
          setEditModalVisible(false);
          setEditingMovement(null);
          editForm.resetFields();
        }}
        onOk={() => editForm.submit()}
        width={600}
      >
        <Form form={editForm} layout="vertical" onFinish={handleSaveEdit}>
          <Form.Item
            name="type"
            label="Movement Type"
            rules={[{ required: true, message: 'Please select movement type' }]}
          >
            <Select placeholder="Select type">
              <Option value="RECEIVE">Receive (Inbound)</Option>
              <Option value="PICK">Pick (Outbound)</Option>
              <Option value="TRANSFER">Transfer (Between Locations)</Option>
              <Option value="ADJUST">Adjustment</Option>
              <Option value="RETURN">Return</Option>
              <Option value="SHIPMENT">Shipment</Option>
              <Option value="DAMAGE">Damage</Option>
              <Option value="LOSS">Loss</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="productId"
            label="Product"
            rules={[{ required: true, message: 'Please select a product' }]}
          >
            <Select
              placeholder="Select a product"
              loading={productsLoading}
              showSearch
              optionFilterProp="label"
              options={products.map((product) => ({
                key: product.id,
                value: product.id,
                label: `${product.name || 'Unnamed'} ${product.sku ? `(${product.sku})` : ''}`
              }))}
            />
          </Form.Item>

          <Form.Item name="batchId" label="Batch (Optional)">
            <Select
              placeholder="Select a batch (optional)"
              loading={batchesLoading}
              showSearch
              allowClear
              optionFilterProp="label"
              options={batches.map((batch) => ({
                key: batch.id,
                value: batch.id,
                label: `${batch.batchNumber} - ${batch.product?.name || 'Unknown Product'} (Qty: ${batch.availableQuantity})`
              }))}
            />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="fromLocationId" label="From Location">
                <Select
                  placeholder="Select source location"
                  loading={locationsLoading}
                  showSearch
                  allowClear
                  optionFilterProp="label"
                  options={locations.map((location) => ({
                    key: location.id,
                    value: location.id,
                    label: `${location.name || location.code} (${location.aisle}-${location.rack}-${location.bin})`
                  }))}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="toLocationId" label="To Location">
                <Select
                  placeholder="Select destination location"
                  loading={locationsLoading}
                  showSearch
                  allowClear
                  optionFilterProp="label"
                  options={locations.map((location) => ({
                    key: location.id,
                    value: location.id,
                    label: `${location.name || location.code} (${location.aisle}-${location.rack}-${location.bin})`
                  }))}
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="quantity"
            label="Quantity"
            rules={[{ required: true, message: 'Please enter quantity' }]}
          >
            <InputNumber min={1} style={{ width: '100%' }} placeholder="Units" />
          </Form.Item>

          <Form.Item name="reason" label="Reason">
            <Input placeholder="e.g., Stock replenishment, Customer order, etc." />
          </Form.Item>

          <Form.Item name="notes" label="Notes">
            <Input.TextArea rows={3} placeholder="Additional notes (optional)" />
          </Form.Item>
        </Form>
      </Modal>

      {/* Movement Detail Modal */}
      <Modal
        title="Movement Details"
        open={detailModalVisible}
        onCancel={() => {
          setDetailModalVisible(false);
          setSelectedMovement(null);
        }}
        footer={[
          <Button key="close" onClick={() => setDetailModalVisible(false)}>
            Close
          </Button>,
          <Button
            key="edit"
            type="primary"
            icon={<EditOutlined />}
            onClick={() => {
              setDetailModalVisible(false);
              if (selectedMovement) handleEditMovement(selectedMovement);
            }}
          >
            Edit
          </Button>,
        ]}
        width={700}
      >
        {selectedMovement && (
          <div className="space-y-4">
            <Row gutter={[16, 16]}>
              <Col span={12}>
                <div className="bg-gray-50 p-4 rounded">
                  <p className="text-gray-500 text-sm mb-1">Movement Type</p>
                  <Tag color={getMovementTypeColor(selectedMovement.type)} className="text-lg">
                    {selectedMovement.type}
                  </Tag>
                </div>
              </Col>
              <Col span={12}>
                <div className="bg-gray-50 p-4 rounded">
                  <p className="text-gray-500 text-sm mb-1">Quantity</p>
                  <p className="text-2xl font-bold">{selectedMovement.quantity} units</p>
                </div>
              </Col>
            </Row>

            <div className="bg-gray-50 p-4 rounded">
              <p className="text-gray-500 text-sm mb-1">Product</p>
              <p className="text-lg font-medium">{selectedMovement.product?.name || 'Unknown'}</p>
              <p className="text-gray-500">SKU: {selectedMovement.product?.sku || 'N/A'}</p>
            </div>

            {selectedMovement.batch && (
              <div className="bg-gray-50 p-4 rounded">
                <p className="text-gray-500 text-sm mb-1">Batch</p>
                <p className="text-lg font-medium">{selectedMovement.batch.batchNumber}</p>
              </div>
            )}

            <Row gutter={[16, 16]}>
              <Col span={12}>
                <div className="bg-gray-50 p-4 rounded">
                  <p className="text-gray-500 text-sm mb-1">From Location</p>
                  {selectedMovement.fromLocation ? (
                    <>
                      <p className="text-lg font-medium">{selectedMovement.fromLocation.name || selectedMovement.fromLocation.code}</p>
                      <p className="text-gray-500">
                        {selectedMovement.fromLocation.aisle}-{selectedMovement.fromLocation.rack}-{selectedMovement.fromLocation.bin}
                      </p>
                    </>
                  ) : (
                    <p className="text-gray-400">N/A</p>
                  )}
                </div>
              </Col>
              <Col span={12}>
                <div className="bg-gray-50 p-4 rounded">
                  <p className="text-gray-500 text-sm mb-1">To Location</p>
                  {selectedMovement.toLocation ? (
                    <>
                      <p className="text-lg font-medium">{selectedMovement.toLocation.name || selectedMovement.toLocation.code}</p>
                      <p className="text-gray-500">
                        {selectedMovement.toLocation.aisle}-{selectedMovement.toLocation.rack}-{selectedMovement.toLocation.bin}
                      </p>
                    </>
                  ) : (
                    <p className="text-gray-400">N/A</p>
                  )}
                </div>
              </Col>
            </Row>

            {selectedMovement.reason && (
              <div className="bg-gray-50 p-4 rounded">
                <p className="text-gray-500 text-sm mb-1">Reason</p>
                <p className="text-lg">{selectedMovement.reason}</p>
              </div>
            )}

            {selectedMovement.notes && (
              <div className="bg-gray-50 p-4 rounded">
                <p className="text-gray-500 text-sm mb-1">Notes</p>
                <p className="text-lg">{selectedMovement.notes}</p>
              </div>
            )}

            <Row gutter={[16, 16]}>
              <Col span={12}>
                <div className="bg-gray-50 p-4 rounded">
                  <p className="text-gray-500 text-sm mb-1">Created By</p>
                  <p className="text-lg">{selectedMovement.user?.name || 'Unknown'}</p>
                  <p className="text-gray-500">{selectedMovement.user?.email || 'N/A'}</p>
                </div>
              </Col>
              <Col span={12}>
                <div className="bg-gray-50 p-4 rounded">
                  <p className="text-gray-500 text-sm mb-1">Created At</p>
                  <p className="text-lg">{dayjs(selectedMovement.createdAt).format('MMM DD, YYYY')}</p>
                  <p className="text-gray-500">{dayjs(selectedMovement.createdAt).format('HH:mm:ss')}</p>
                </div>
              </Col>
            </Row>
          </div>
        )}
      </Modal>
    </div>
  );
}
