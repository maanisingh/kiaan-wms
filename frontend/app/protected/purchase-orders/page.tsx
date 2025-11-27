'use client';

import React, { useState, useEffect } from 'react';
import { Table, Button, Input, Select, Tag, Space, Card, Modal, Form, DatePicker, InputNumber, message, Tabs, Popconfirm, Drawer, List, Empty, Divider, Typography } from 'antd';
import {
  PlusOutlined,
  SearchOutlined,
  FilterOutlined,
  EyeOutlined,
  EditOutlined,
  DeleteOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  FileTextOutlined,
  ClockCircleOutlined,
  CheckOutlined,
  InboxOutlined,
  ReloadOutlined,
  ShoppingCartOutlined,
  MinusCircleOutlined,
} from '@ant-design/icons';
import { formatCurrency, formatDate, getStatusColor } from '@/lib/utils';
import apiService from '@/services/api';
import dayjs from 'dayjs';

const { Search } = Input;
const { Option } = Select;
const { Text } = Typography;

interface PurchaseOrderItem {
  id?: string;
  productId: string;
  productName: string;
  productSku: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  isBundle: boolean;
}

interface PurchaseOrder {
  id: string;
  poNumber: string;
  supplier: string;
  supplierId: string;
  status: string;
  items: number | PurchaseOrderItem[];
  totalAmount: number;
  orderDate: string;
  expectedDelivery: string;
  notes?: string;
}

interface Supplier {
  id: string;
  name: string;
  code: string;
}

interface Product {
  id: string;
  name: string;
  sku: string;
  costPrice: number;
  type: string;
}

export default function PurchaseOrdersPage() {
  const [loading, setLoading] = useState(false);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [detailDrawerOpen, setDetailDrawerOpen] = useState(false);
  const [selectedPO, setSelectedPO] = useState<PurchaseOrder | null>(null);
  const [selectedItems, setSelectedItems] = useState<PurchaseOrderItem[]>([]);
  const [activeTab, setActiveTab] = useState('all');
  const [form] = Form.useForm();
  const [editForm] = Form.useForm();

  // Fetch purchase orders
  const fetchPurchaseOrders = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await apiService.get('/purchase-orders');
      setPurchaseOrders(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch purchase orders');
      message.error(err.message || 'Failed to fetch purchase orders');
    } finally {
      setLoading(false);
    }
  };

  // Fetch suppliers
  const fetchSuppliers = async () => {
    try {
      const data = await apiService.get('/suppliers');
      setSuppliers(Array.isArray(data) ? data : []);
    } catch (err: any) {
      console.error('Failed to fetch suppliers:', err);
    }
  };

  // Fetch products
  const fetchProducts = async () => {
    try {
      const data = await apiService.get('/products');
      setProducts(Array.isArray(data) ? data : []);
    } catch (err: any) {
      console.error('Failed to fetch products:', err);
    }
  };

  useEffect(() => {
    fetchPurchaseOrders();
    fetchSuppliers();
    fetchProducts();
  }, []);

  // Add item to selected items
  const addItem = (product: Product) => {
    const existingItem = selectedItems.find(item => item.productId === product.id);
    if (existingItem) {
      setSelectedItems(selectedItems.map(item =>
        item.productId === product.id
          ? { ...item, quantity: item.quantity + 1, totalPrice: (item.quantity + 1) * item.unitPrice }
          : item
      ));
    } else {
      setSelectedItems([...selectedItems, {
        productId: product.id,
        productName: product.name,
        productSku: product.sku,
        quantity: 1,
        unitPrice: product.costPrice || 0,
        totalPrice: product.costPrice || 0,
        isBundle: product.type === 'BUNDLE'
      }]);
    }
  };

  // Remove item from selected items
  const removeItem = (productId: string) => {
    setSelectedItems(selectedItems.filter(item => item.productId !== productId));
  };

  // Update item quantity
  const updateItemQuantity = (productId: string, quantity: number) => {
    setSelectedItems(selectedItems.map(item =>
      item.productId === productId
        ? { ...item, quantity, totalPrice: quantity * item.unitPrice }
        : item
    ));
  };

  // Calculate total amount
  const calculateTotal = () => {
    return selectedItems.reduce((sum, item) => sum + item.totalPrice, 0);
  };

  const handleSubmit = async (values: any) => {
    try {
      const payload = {
        supplierId: values.supplierId,
        expectedDelivery: values.expectedDelivery?.toISOString(),
        notes: values.notes,
        items: selectedItems.map(item => ({
          productId: item.productId,
          productName: item.productName,
          productSku: item.productSku,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          isBundle: item.isBundle
        })),
        totalAmount: calculateTotal()
      };

      await apiService.post('/purchase-orders', payload);
      message.success('Purchase order created successfully!');
      setModalOpen(false);
      form.resetFields();
      setSelectedItems([]);
      fetchPurchaseOrders();
    } catch (err: any) {
      message.error(err.message || 'Failed to create purchase order');
    }
  };

  // Handle Edit
  const handleEdit = async (record: PurchaseOrder) => {
    try {
      const poDetail = await apiService.get(`/purchase-orders/${record.id}`);
      setSelectedPO(poDetail);
      setSelectedItems(Array.isArray(poDetail.items) ? poDetail.items : []);
      editForm.setFieldsValue({
        supplierId: poDetail.supplierId,
        expectedDelivery: poDetail.expectedDelivery ? dayjs(poDetail.expectedDelivery) : null,
        notes: poDetail.notes
      });
      setEditModalOpen(true);
    } catch (err: any) {
      message.error('Failed to load purchase order details');
    }
  };

  const handleEditSubmit = async (values: any) => {
    if (!selectedPO) return;
    try {
      const payload = {
        supplierId: values.supplierId,
        expectedDelivery: values.expectedDelivery?.toISOString(),
        notes: values.notes,
        items: selectedItems.map(item => ({
          productId: item.productId,
          productName: item.productName,
          productSku: item.productSku,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          isBundle: item.isBundle
        }))
      };

      await apiService.put(`/purchase-orders/${selectedPO.id}`, payload);
      message.success('Purchase order updated successfully!');
      setEditModalOpen(false);
      editForm.resetFields();
      setSelectedItems([]);
      setSelectedPO(null);
      fetchPurchaseOrders();
    } catch (err: any) {
      message.error(err.message || 'Failed to update purchase order');
    }
  };

  // Handle Delete
  const handleDelete = async (id: string) => {
    try {
      await apiService.delete(`/purchase-orders/${id}`);
      message.success('Purchase order deleted successfully!');
      fetchPurchaseOrders();
    } catch (err: any) {
      message.error(err.message || 'Failed to delete purchase order');
    }
  };

  // Handle Approve
  const handleApprove = async (id: string) => {
    try {
      await apiService.post(`/purchase-orders/${id}/approve`, {});
      message.success('Purchase order approved successfully!');
      fetchPurchaseOrders();
    } catch (err: any) {
      message.error(err.message || 'Failed to approve purchase order');
    }
  };

  // Handle Reject
  const handleReject = async (id: string) => {
    try {
      await apiService.post(`/purchase-orders/${id}/reject`, { reason: 'Rejected by user' });
      message.success('Purchase order rejected!');
      fetchPurchaseOrders();
    } catch (err: any) {
      message.error(err.message || 'Failed to reject purchase order');
    }
  };

  // View PO Details
  const handleView = async (record: PurchaseOrder) => {
    try {
      const poDetail = await apiService.get(`/purchase-orders/${record.id}`);
      setSelectedPO(poDetail);
      setDetailDrawerOpen(true);
    } catch (err: any) {
      message.error('Failed to load purchase order details');
    }
  };

  const allOrders = purchaseOrders;
  const pendingOrders = purchaseOrders.filter(po => po.status === 'pending' || po.status === 'draft');
  const approvedOrders = purchaseOrders.filter(po => po.status === 'approved');
  const receivedOrders = purchaseOrders.filter(po => po.status === 'received' || po.status === 'partially_received');

  const columns = [
    {
      title: 'PO Number',
      dataIndex: 'poNumber',
      key: 'poNumber',
      render: (text: string) => <span className="font-medium text-blue-600">{text}</span>,
    },
    {
      title: 'Supplier',
      dataIndex: 'supplier',
      key: 'supplier',
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={getStatusColor(status)} className="uppercase">
          {status}
        </Tag>
      ),
    },
    {
      title: 'Items',
      dataIndex: 'items',
      key: 'items',
      render: (items: number | any[]) => typeof items === 'number' ? items : items?.length || 0,
    },
    {
      title: 'Total Amount',
      dataIndex: 'totalAmount',
      key: 'totalAmount',
      render: (amount: number) => formatCurrency(amount),
    },
    {
      title: 'Order Date',
      dataIndex: 'orderDate',
      key: 'orderDate',
      render: (date: string) => formatDate(date),
    },
    {
      title: 'Expected Delivery',
      dataIndex: 'expectedDelivery',
      key: 'expectedDelivery',
      render: (date: string) => date ? formatDate(date) : '-',
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, record: PurchaseOrder) => (
        <Space>
          <Button type="link" icon={<EyeOutlined />} size="small" onClick={() => handleView(record)}>
            View
          </Button>
          {(record.status === 'pending' || record.status === 'draft') && (
            <>
              <Button type="link" icon={<EditOutlined />} size="small" onClick={() => handleEdit(record)}>
                Edit
              </Button>
              <Popconfirm
                title="Approve this purchase order?"
                onConfirm={() => handleApprove(record.id)}
                okText="Yes"
                cancelText="No"
              >
                <Button type="link" icon={<CheckCircleOutlined />} size="small" style={{ color: 'green' }}>
                  Approve
                </Button>
              </Popconfirm>
              <Popconfirm
                title="Reject this purchase order?"
                onConfirm={() => handleReject(record.id)}
                okText="Yes"
                cancelText="No"
              >
                <Button type="link" icon={<CloseCircleOutlined />} size="small" danger>
                  Reject
                </Button>
              </Popconfirm>
            </>
          )}
          <Popconfirm
            title="Delete this purchase order?"
            description="This action cannot be undone."
            onConfirm={() => handleDelete(record.id)}
            okText="Yes"
            cancelText="No"
            okButtonProps={{ danger: true }}
          >
            <Button type="link" icon={<DeleteOutlined />} size="small" danger>
              Delete
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const renderFiltersAndTable = (dataSource: PurchaseOrder[]) => (
    <>
      <div className="flex gap-4 mb-4">
        <Search placeholder="Search POs..." style={{ width: 300 }} prefix={<SearchOutlined />} />
        <Select placeholder="Supplier" style={{ width: 200 }} allowClear>
          {suppliers.map(s => (
            <Option key={s.id} value={s.id}>{s.name}</Option>
          ))}
        </Select>
        <Button icon={<FilterOutlined />}>More Filters</Button>
        <Button icon={<ReloadOutlined />} onClick={fetchPurchaseOrders}>
          Refresh
        </Button>
      </div>
      <Table columns={columns} dataSource={dataSource} rowKey="id" loading={loading} />
    </>
  );

  // Item selection component for modals
  const ItemSelector = () => (
    <div className="border rounded-lg p-4 bg-gray-50">
      <h4 className="font-semibold mb-3 flex items-center gap-2">
        <ShoppingCartOutlined /> Add Products/Bundles
      </h4>
      <Select
        showSearch
        placeholder="Search and select products..."
        style={{ width: '100%', marginBottom: 16 }}
        filterOption={(input, option) =>
          (option?.label?.toString() || '').toLowerCase().includes(input.toLowerCase())
        }
        onChange={(value) => {
          const product = products.find(p => p.id === value);
          if (product) addItem(product);
        }}
        options={products.map(p => ({
          value: p.id,
          label: `${p.name} (${p.sku}) - ${formatCurrency(p.costPrice || 0)}${p.type === 'BUNDLE' ? ' [BUNDLE]' : ''}`
        }))}
      />

      {selectedItems.length > 0 ? (
        <List
          size="small"
          dataSource={selectedItems}
          renderItem={(item) => (
            <List.Item
              actions={[
                <Button
                  key="remove"
                  type="text"
                  danger
                  icon={<MinusCircleOutlined />}
                  onClick={() => removeItem(item.productId)}
                />
              ]}
            >
              <div className="flex items-center gap-4 flex-1">
                <div className="flex-1">
                  <div className="font-medium">
                    {item.productName}
                    {item.isBundle && <Tag color="purple" className="ml-2">BUNDLE</Tag>}
                  </div>
                  <Text type="secondary" className="text-xs">{item.productSku}</Text>
                </div>
                <InputNumber
                  min={1}
                  value={item.quantity}
                  onChange={(val) => updateItemQuantity(item.productId, val || 1)}
                  style={{ width: 80 }}
                />
                <Text className="w-20 text-right">x {formatCurrency(item.unitPrice)}</Text>
                <Text strong className="w-24 text-right">{formatCurrency(item.totalPrice)}</Text>
              </div>
            </List.Item>
          )}
        />
      ) : (
        <Empty description="No items added yet" image={Empty.PRESENTED_IMAGE_SIMPLE} />
      )}

      {selectedItems.length > 0 && (
        <>
          <Divider />
          <div className="flex justify-end">
            <Text strong className="text-lg">Total: {formatCurrency(calculateTotal())}</Text>
          </div>
        </>
      )}
    </div>
  );

  const tabItems = [
    {
      key: 'all',
      label: (
        <span className="flex items-center gap-2">
          <FileTextOutlined />
          All Orders ({allOrders.length})
        </span>
      ),
      children: renderFiltersAndTable(allOrders),
    },
    {
      key: 'pending',
      label: (
        <span className="flex items-center gap-2">
          <ClockCircleOutlined />
          Pending ({pendingOrders.length})
        </span>
      ),
      children: renderFiltersAndTable(pendingOrders),
    },
    {
      key: 'approved',
      label: (
        <span className="flex items-center gap-2">
          <CheckOutlined />
          Approved ({approvedOrders.length})
        </span>
      ),
      children: renderFiltersAndTable(approvedOrders),
    },
    {
      key: 'received',
      label: (
        <span className="flex items-center gap-2">
          <InboxOutlined />
          Received ({receivedOrders.length})
        </span>
      ),
      children: renderFiltersAndTable(receivedOrders),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Purchase Orders
          </h1>
          <p className="text-gray-600 mt-1">Manage supplier purchase orders and procurement</p>
        </div>
        <Button type="primary" icon={<PlusOutlined />} size="large" onClick={() => {
          setSelectedItems([]);
          form.resetFields();
          setModalOpen(true);
        }}>
          Create PO
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <div className="text-center">
            <p className="text-gray-500 text-sm">Total POs</p>
            <p className="text-3xl font-bold text-blue-600">{allOrders.length}</p>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <p className="text-gray-500 text-sm">Pending</p>
            <p className="text-3xl font-bold text-orange-600">{pendingOrders.length}</p>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <p className="text-gray-500 text-sm">Approved</p>
            <p className="text-3xl font-bold text-green-600">{approvedOrders.length}</p>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <p className="text-gray-500 text-sm">Received</p>
            <p className="text-3xl font-bold text-purple-600">{receivedOrders.length}</p>
          </div>
        </Card>
      </div>

      <Card className="shadow-sm">
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={tabItems}
          size="large"
        />
      </Card>

      {/* Create PO Modal */}
      <Modal
        title="Create Purchase Order"
        open={modalOpen}
        onCancel={() => {
          setModalOpen(false);
          form.resetFields();
          setSelectedItems([]);
        }}
        onOk={() => form.submit()}
        width={900}
        okText="Create"
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
        >
          <div className="grid grid-cols-2 gap-4">
            <Form.Item
              label="Supplier"
              name="supplierId"
              rules={[{ required: true, message: 'Please select a supplier' }]}
            >
              <Select placeholder="Select supplier" size="large" showSearch filterOption={(input, option) =>
                (option?.children?.toString() || '').toLowerCase().includes(input.toLowerCase())
              }>
                {suppliers.map(s => (
                  <Option key={s.id} value={s.id}>{s.name}</Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item
              label="Expected Delivery Date"
              name="expectedDelivery"
            >
              <DatePicker style={{ width: '100%' }} size="large" />
            </Form.Item>
          </div>

          <Form.Item label="Products/Bundles">
            <ItemSelector />
          </Form.Item>

          <Form.Item label="Notes" name="notes">
            <Input.TextArea rows={3} placeholder="Add any notes..." />
          </Form.Item>
        </Form>
      </Modal>

      {/* Edit PO Modal */}
      <Modal
        title={`Edit Purchase Order - ${selectedPO?.poNumber || ''}`}
        open={editModalOpen}
        onCancel={() => {
          setEditModalOpen(false);
          editForm.resetFields();
          setSelectedItems([]);
          setSelectedPO(null);
        }}
        onOk={() => editForm.submit()}
        width={900}
        okText="Save Changes"
      >
        <Form
          form={editForm}
          layout="vertical"
          onFinish={handleEditSubmit}
        >
          <div className="grid grid-cols-2 gap-4">
            <Form.Item
              label="Supplier"
              name="supplierId"
              rules={[{ required: true, message: 'Please select a supplier' }]}
            >
              <Select placeholder="Select supplier" size="large" showSearch filterOption={(input, option) =>
                (option?.children?.toString() || '').toLowerCase().includes(input.toLowerCase())
              }>
                {suppliers.map(s => (
                  <Option key={s.id} value={s.id}>{s.name}</Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item
              label="Expected Delivery Date"
              name="expectedDelivery"
            >
              <DatePicker style={{ width: '100%' }} size="large" />
            </Form.Item>
          </div>

          <Form.Item label="Products/Bundles">
            <ItemSelector />
          </Form.Item>

          <Form.Item label="Notes" name="notes">
            <Input.TextArea rows={3} placeholder="Add any notes..." />
          </Form.Item>
        </Form>
      </Modal>

      {/* PO Details Drawer */}
      <Drawer
        title={`Purchase Order Details - ${selectedPO?.poNumber || ''}`}
        open={detailDrawerOpen}
        onClose={() => {
          setDetailDrawerOpen(false);
          setSelectedPO(null);
        }}
        width={600}
      >
        {selectedPO && (
          <div className="space-y-4">
            <Card size="small" title="Order Information">
              <div className="grid grid-cols-2 gap-2">
                <div><Text type="secondary">PO Number:</Text></div>
                <div><Text strong>{selectedPO.poNumber}</Text></div>
                <div><Text type="secondary">Supplier:</Text></div>
                <div><Text>{selectedPO.supplier}</Text></div>
                <div><Text type="secondary">Status:</Text></div>
                <div><Tag color={getStatusColor(selectedPO.status)}>{selectedPO.status?.toUpperCase()}</Tag></div>
                <div><Text type="secondary">Order Date:</Text></div>
                <div><Text>{formatDate(selectedPO.orderDate)}</Text></div>
                <div><Text type="secondary">Expected Delivery:</Text></div>
                <div><Text>{selectedPO.expectedDelivery ? formatDate(selectedPO.expectedDelivery) : '-'}</Text></div>
                <div><Text type="secondary">Total Amount:</Text></div>
                <div><Text strong className="text-green-600">{formatCurrency(selectedPO.totalAmount)}</Text></div>
              </div>
            </Card>

            <Card size="small" title="Items">
              {Array.isArray(selectedPO.items) && selectedPO.items.length > 0 ? (
                <List
                  size="small"
                  dataSource={selectedPO.items as PurchaseOrderItem[]}
                  renderItem={(item: PurchaseOrderItem) => (
                    <List.Item>
                      <div className="flex justify-between w-full">
                        <div>
                          <div className="font-medium">{item.productName}</div>
                          <Text type="secondary" className="text-xs">{item.productSku}</Text>
                        </div>
                        <div className="text-right">
                          <div>{item.quantity} x {formatCurrency(item.unitPrice)}</div>
                          <Text strong>{formatCurrency(item.totalPrice)}</Text>
                        </div>
                      </div>
                    </List.Item>
                  )}
                />
              ) : (
                <Empty description="No items" image={Empty.PRESENTED_IMAGE_SIMPLE} />
              )}
            </Card>

            {selectedPO.notes && (
              <Card size="small" title="Notes">
                <Text>{selectedPO.notes}</Text>
              </Card>
            )}
          </div>
        )}
      </Drawer>
    </div>
  );
}
