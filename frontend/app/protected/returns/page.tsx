'use client';

import React, { useState, useEffect } from 'react';
import { Table, Button, Input, Select, Tag, Card, Modal, Form, message, Tabs, Space, Checkbox, InputNumber, Divider, Row, Col, Descriptions, List, Avatar } from 'antd';
import { PlusOutlined, SearchOutlined, FilterOutlined, FileTextOutlined, ClockCircleOutlined, SyncOutlined, CheckCircleOutlined, CloseCircleOutlined, EyeOutlined, ReloadOutlined, ShoppingCartOutlined, SwapOutlined, DollarOutlined, DeleteOutlined, EditOutlined, PrinterOutlined } from '@ant-design/icons';
import { useModal } from '@/hooks/useModal';
import { formatDate, formatCurrency } from '@/lib/utils';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import apiService from '@/services/api';
import { usePermissions } from '@/hooks/usePermissions';

const { Search } = Input;
const { Option } = Select;
const { TextArea } = Input;

interface OrderItem {
  id: string;
  productId: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  product: {
    id: string;
    sku: string;
    name: string;
    barcode: string;
    sellingPrice: number;
  };
}

interface Order {
  id: string;
  orderNumber: string;
  status: string;
  totalAmount: number;
  customer: {
    id: string;
    name: string;
    email: string;
  };
  items: OrderItem[];
  shippedDate: string;
}

interface ReturnItem {
  id: string;
  productId: string;
  productName: string;
  sku: string;
  quantity: number;
  returnQuantity: number;
  reason: string;
  condition: string;
  exchangeProductId?: string;
  exchangeProductName?: string;
}

export default function ReturnsAndRMAManagementPage() {
  const { canDelete } = usePermissions();
  const [loading, setLoading] = useState(false);
  const [returns, setReturns] = useState<any[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [selectedItems, setSelectedItems] = useState<Map<string, ReturnItem>>(new Map());
  const [returnType, setReturnType] = useState<'return' | 'exchange' | 'refund'>('return');

  // Modals
  const addModal = useModal();
  const viewModal = useModal();
  const editModal = useModal();

  const [form] = Form.useForm();
  const [editForm] = Form.useForm();
  const [currentReturn, setCurrentReturn] = useState<any>(null);
  const router = useRouter();

  // Fetch returns
  const fetchReturns = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await apiService.get('/returns');
      setReturns(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch returns');
      message.error(err.message || 'Failed to fetch returns');
    } finally {
      setLoading(false);
    }
  };

  // Fetch orders (shipped/delivered only - eligible for returns)
  const fetchOrders = async () => {
    try {
      const data = await apiService.get('/orders');
      // Filter to only shipped/delivered orders
      const eligibleOrders = (Array.isArray(data) ? data : []).filter(
        (o: Order) => ['SHIPPED', 'DELIVERED', 'COMPLETED'].includes(o.status)
      );
      setOrders(eligibleOrders);
    } catch (err: any) {
      console.error('Failed to fetch orders:', err);
    }
  };

  // Fetch products for exchange selection
  const fetchProducts = async () => {
    try {
      const data = await apiService.get('/products');
      setProducts(Array.isArray(data) ? data : (data.products || []));
    } catch (err: any) {
      console.error('Failed to fetch products:', err);
    }
  };

  useEffect(() => {
    fetchReturns();
    fetchOrders();
    fetchProducts();
  }, []);

  // Handle order selection
  const handleOrderSelect = (orderId: string) => {
    const order = orders.find(o => o.id === orderId);
    setSelectedOrder(order || null);
    setSelectedItems(new Map());
  };

  // Handle item selection toggle
  const handleItemToggle = (item: OrderItem, checked: boolean) => {
    const newItems = new Map(selectedItems);
    if (checked) {
      newItems.set(item.id, {
        id: item.id,
        productId: item.productId,
        productName: item.product.name,
        sku: item.product.sku,
        quantity: item.quantity,
        returnQuantity: item.quantity,
        reason: 'Damaged',
        condition: 'Unopened',
      });
    } else {
      newItems.delete(item.id);
    }
    setSelectedItems(newItems);
  };

  // Handle select all items
  const handleSelectAll = (checked: boolean) => {
    if (!selectedOrder) return;
    const newItems = new Map<string, ReturnItem>();
    if (checked) {
      selectedOrder.items.forEach(item => {
        newItems.set(item.id, {
          id: item.id,
          productId: item.productId,
          productName: item.product.name,
          sku: item.product.sku,
          quantity: item.quantity,
          returnQuantity: item.quantity,
          reason: 'Damaged',
          condition: 'Unopened',
        });
      });
    }
    setSelectedItems(newItems);
  };

  // Update item details
  const updateItemDetail = (itemId: string, field: string, value: any) => {
    const newItems = new Map(selectedItems);
    const item = newItems.get(itemId);
    if (item) {
      (item as any)[field] = value;
      newItems.set(itemId, item);
      setSelectedItems(newItems);
    }
  };

  // Calculate total return value
  const calculateTotalValue = () => {
    let total = 0;
    selectedItems.forEach((item) => {
      const orderItem = selectedOrder?.items.find(i => i.id === item.id);
      if (orderItem) {
        total += (orderItem.unitPrice * item.returnQuantity);
      }
    });
    return total;
  };

  // Submit new return
  const handleSubmit = async () => {
    if (!selectedOrder || selectedItems.size === 0) {
      message.error('Please select an order and at least one item');
      return;
    }

    try {
      const itemsArray = Array.from(selectedItems.values());
      const returnData = {
        orderId: selectedOrder.id,
        orderNumber: selectedOrder.orderNumber,
        customer: selectedOrder.customer.name,
        customerId: selectedOrder.customer.id,
        type: returnType.charAt(0).toUpperCase() + returnType.slice(1),
        reason: itemsArray[0]?.reason || 'Damaged',
        value: calculateTotalValue(),
        items: itemsArray.map(item => ({
          productId: item.productId,
          productName: item.productName,
          sku: item.sku,
          quantity: item.returnQuantity,
          reason: item.reason,
          condition: item.condition,
          exchangeProductId: item.exchangeProductId,
          exchangeProductName: item.exchangeProductName,
        })),
        notes: form.getFieldValue('notes'),
      };

      await apiService.post('/returns', returnData);
      message.success('RMA created successfully!');
      form.resetFields();
      setSelectedOrder(null);
      setSelectedItems(new Map());
      setReturnType('return');
      addModal.close();
      fetchReturns();
    } catch (err: any) {
      message.error(err.message || 'Failed to create RMA');
    }
  };

  // View return details
  const handleView = async (record: any) => {
    try {
      const data = await apiService.get(`/returns/${record.id}`);
      setCurrentReturn(data);
      viewModal.open();
    } catch (err: any) {
      message.error('Failed to load return details');
    }
  };

  // Open edit modal
  const handleEdit = async (record: any) => {
    try {
      const data = await apiService.get(`/returns/${record.id}`);
      setCurrentReturn(data);
      editForm.setFieldsValue({
        type: data.type,
        reason: data.reason,
        status: data.status,
        notes: data.notes,
      });
      editModal.open();
    } catch (err: any) {
      message.error('Failed to load return for editing');
    }
  };

  // Save edit
  const handleEditSave = async () => {
    try {
      const values = editForm.getFieldsValue();
      await apiService.patch(`/returns/${currentReturn.id}`, values);
      message.success('Return updated successfully!');
      editModal.close();
      fetchReturns();
    } catch (err: any) {
      message.error(err.message || 'Failed to update return');
    }
  };

  // Delete return
  const handleDelete = (record: any) => {
    console.log('handleDelete called for:', record.id, record.rmaNumber);
    Modal.confirm({
      title: 'Delete Return',
      content: `Are you sure you want to delete RMA ${record.rmaNumber}?`,
      okText: 'Yes, Delete',
      okType: 'danger',
      cancelText: 'Cancel',
      onOk: async () => {
        console.log('Modal onOk - Deleting return:', record.id);
        try {
          await apiService.delete(`/returns/${record.id}`);
          message.success('Return deleted successfully!');
          fetchReturns();
        } catch (err: any) {
          console.error('Delete error:', err);
          message.error(err.message || 'Failed to delete return');
        }
      },
    });
  };

  // Quick process action
  const handleQuickProcess = async (record: any) => {
    try {
      await apiService.patch(`/returns/${record.id}`, { status: 'processing' });
      message.success('Return is now processing!');
      fetchReturns();
    } catch (err: any) {
      message.error(err.message || 'Failed to process return');
    }
  };

  // Quick approve action
  const handleQuickApprove = async (record: any) => {
    try {
      await apiService.patch(`/returns/${record.id}`, { status: 'approved' });
      message.success('Return approved!');
      fetchReturns();
    } catch (err: any) {
      message.error(err.message || 'Failed to approve return');
    }
  };

  // Print RMA
  const handlePrint = (record: any) => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      const items = record.items || [];
      printWindow.document.write(`
        <html>
          <head>
            <title>RMA ${record.rmaNumber}</title>
            <style>
              body { font-family: Arial, sans-serif; padding: 20px; }
              .header { text-align: center; margin-bottom: 30px; }
              .info { margin-bottom: 20px; }
              .info-row { display: flex; margin-bottom: 8px; }
              .info-label { font-weight: bold; width: 150px; }
              table { width: 100%; border-collapse: collapse; margin-top: 20px; }
              th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
              th { background-color: #f5f5f5; }
              .footer { margin-top: 40px; text-align: center; }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>Return Merchandise Authorization</h1>
              <h2>${record.rmaNumber}</h2>
            </div>
            <div class="info">
              <div class="info-row"><span class="info-label">Order Number:</span> ${record.orderNumber}</div>
              <div class="info-row"><span class="info-label">Customer:</span> ${record.customer}</div>
              <div class="info-row"><span class="info-label">Type:</span> ${record.type}</div>
              <div class="info-row"><span class="info-label">Reason:</span> ${record.reason}</div>
              <div class="info-row"><span class="info-label">Status:</span> ${record.status}</div>
              <div class="info-row"><span class="info-label">Requested Date:</span> ${formatDate(record.requestedDate)}</div>
              <div class="info-row"><span class="info-label">Total Value:</span> $${record.value}</div>
            </div>
            <h3>Return Items</h3>
            <table>
              <thead>
                <tr>
                  <th>SKU</th>
                  <th>Product</th>
                  <th>Qty</th>
                  <th>Reason</th>
                  <th>Condition</th>
                </tr>
              </thead>
              <tbody>
                ${items.map((item: any) => `
                  <tr>
                    <td>${item.sku}</td>
                    <td>${item.productName}</td>
                    <td>${item.quantity}</td>
                    <td>${item.reason}</td>
                    <td>${item.condition || 'N/A'}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
            <div class="footer">
              <p>Generated on ${new Date().toLocaleString()}</p>
            </div>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

  const allReturns = returns;
  const pendingReturns = returns.filter(r => r.status === 'pending');
  const processingReturns = returns.filter(r => r.status === 'processing');
  const approvedReturns = returns.filter(r => r.status === 'approved');
  const completedReturns = returns.filter(r => r.status === 'completed');

  const columns = [
    {
      title: 'RMA #',
      dataIndex: 'rmaNumber',
      key: 'rmaNumber',
      width: 120,
      render: (text: string, record: any) => (
        <span className="font-medium text-blue-600 cursor-pointer hover:underline" onClick={() => handleView(record)}>
          {text}
        </span>
      )
    },
    { title: 'Order #', dataIndex: 'orderNumber', key: 'orderNumber', width: 130 },
    { title: 'Customer', dataIndex: 'customer', key: 'customer', width: 180 },
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      width: 100,
      render: (type: string) => {
        const icons: any = { Return: <ShoppingCartOutlined />, Exchange: <SwapOutlined />, Refund: <DollarOutlined /> };
        const colors: any = { Return: 'purple', Exchange: 'blue', Refund: 'green' };
        return <Tag icon={icons[type]} color={colors[type]}>{type}</Tag>;
      }
    },
    { title: 'Reason', dataIndex: 'reason', key: 'reason', width: 150 },
    { title: 'Requested', dataIndex: 'requestedDate', key: 'requestedDate', width: 120, render: (date: string) => formatDate(date) },
    { title: 'Value', dataIndex: 'value', key: 'value', width: 100, render: (val: number) => formatCurrency(val) },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status: string) => {
        const colors: any = {
          pending: 'orange',
          processing: 'blue',
          approved: 'cyan',
          completed: 'green',
          rejected: 'red'
        };
        return <Tag color={colors[status]}>{status?.toUpperCase()}</Tag>;
      }
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 280,
      render: (_: any, record: any) => (
        <Space>
          <Button type="link" icon={<EyeOutlined />} size="small" onClick={(e) => { e.stopPropagation(); handleView(record); }}>View</Button>
          <Button type="link" icon={<EditOutlined />} size="small" onClick={(e) => { e.stopPropagation(); handleEdit(record); }}>Edit</Button>
          <Button type="link" icon={<PrinterOutlined />} size="small" onClick={(e) => { e.stopPropagation(); handlePrint(record); }}>Print</Button>
          {record.status === 'pending' && (
            <Button type="link" size="small" onClick={(e) => { e.stopPropagation(); handleQuickProcess(record); }}>Process</Button>
          )}
          {record.status === 'processing' && (
            <Button type="link" size="small" onClick={(e) => { e.stopPropagation(); handleQuickApprove(record); }}>Approve</Button>
          )}
          {canDelete() && (
            <Button type="link" danger icon={<DeleteOutlined />} size="small" onClick={(e) => { e.stopPropagation(); handleDelete(record); }} />
          )}
        </Space>
      ),
    },
  ];

  const renderFiltersAndTable = (dataSource: any[]) => (
    <>
      <div className="flex gap-4 mb-4">
        <Search placeholder="Search RMAs..." style={{ width: 300 }} prefix={<SearchOutlined />} />
        <Select placeholder="Return Type" style={{ width: 150 }} allowClear>
          <Option value="Return">Return</Option>
          <Option value="Exchange">Exchange</Option>
          <Option value="Refund">Refund</Option>
        </Select>
        <Select placeholder="Reason" style={{ width: 150 }} allowClear>
          <Option value="Damaged">Damaged</Option>
          <Option value="Wrong Item">Wrong Item</Option>
          <Option value="Defective">Defective</Option>
        </Select>
        <Button icon={<FilterOutlined />}>More Filters</Button>
        <Button icon={<ReloadOutlined />} onClick={fetchReturns}>Refresh</Button>
      </div>
      <Table
        columns={columns}
        dataSource={dataSource}
        rowKey="id"
        loading={loading}
        scroll={{ x: 1400 }}
      />
    </>
  );

  const tabItems = [
    {
      key: 'all',
      label: <span className="flex items-center gap-2"><FileTextOutlined />All Returns ({allReturns.length})</span>,
      children: renderFiltersAndTable(allReturns),
    },
    {
      key: 'pending',
      label: <span className="flex items-center gap-2"><ClockCircleOutlined />Pending ({pendingReturns.length})</span>,
      children: renderFiltersAndTable(pendingReturns),
    },
    {
      key: 'processing',
      label: <span className="flex items-center gap-2"><SyncOutlined />Processing ({processingReturns.length})</span>,
      children: renderFiltersAndTable(processingReturns),
    },
    {
      key: 'approved',
      label: <span className="flex items-center gap-2"><CheckCircleOutlined />Approved ({approvedReturns.length})</span>,
      children: renderFiltersAndTable(approvedReturns),
    },
    {
      key: 'completed',
      label: <span className="flex items-center gap-2"><CheckCircleOutlined />Completed ({completedReturns.length})</span>,
      children: renderFiltersAndTable(completedReturns),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-red-600 to-orange-600 bg-clip-text text-transparent">
            Returns & RMA Management
          </h1>
          <p className="text-gray-600 mt-1">Process product returns, exchanges, and refunds</p>
        </div>
        <Button type="primary" icon={<PlusOutlined />} size="large" onClick={addModal.open}>
          Create RMA
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <div className="text-center">
            <p className="text-gray-500 text-sm">Pending Returns</p>
            <p className="text-3xl font-bold text-orange-600">{pendingReturns.length}</p>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <p className="text-gray-500 text-sm">Processing</p>
            <p className="text-3xl font-bold text-blue-600">{processingReturns.length}</p>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <p className="text-gray-500 text-sm">Completed</p>
            <p className="text-3xl font-bold text-green-600">{completedReturns.length}</p>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <p className="text-gray-500 text-sm">Total Value</p>
            <p className="text-3xl font-bold text-purple-600">{formatCurrency(returns.reduce((sum, r) => sum + (r.value || 0), 0))}</p>
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

      {/* Create RMA Modal */}
      <Modal
        title="Create Return/Exchange/Refund"
        open={addModal.isOpen}
        onCancel={() => {
          addModal.close();
          setSelectedOrder(null);
          setSelectedItems(new Map());
          form.resetFields();
        }}
        onOk={handleSubmit}
        width={900}
        okText="Create RMA"
        okButtonProps={{ disabled: !selectedOrder || selectedItems.size === 0 }}
      >
        <Form form={form} layout="vertical">
          {/* Step 1: Select Order */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-3">Step 1: Select Order</h3>
            <Select
              placeholder="Search and select an order..."
              style={{ width: '100%' }}
              showSearch
              optionFilterProp="children"
              onChange={handleOrderSelect}
              value={selectedOrder?.id}
              size="large"
            >
              {orders.map(order => (
                <Option key={order.id} value={order.id}>
                  <div className="flex justify-between items-center">
                    <span><strong>{order.orderNumber}</strong> - {order.customer?.name}</span>
                    <Tag color="blue">{formatCurrency(order.totalAmount)}</Tag>
                  </div>
                </Option>
              ))}
            </Select>
          </div>

          {/* Step 2: Select Items */}
          {selectedOrder && (
            <>
              <Divider />
              <div className="mb-6">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-lg font-semibold">Step 2: Select Items to Return</h3>
                  <Checkbox
                    checked={selectedItems.size === selectedOrder.items.length}
                    indeterminate={selectedItems.size > 0 && selectedItems.size < selectedOrder.items.length}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                  >
                    Select All
                  </Checkbox>
                </div>

                <div className="border rounded-lg divide-y">
                  {selectedOrder.items.map(item => {
                    const isSelected = selectedItems.has(item.id);
                    const returnItem = selectedItems.get(item.id);

                    return (
                      <div key={item.id} className={`p-4 ${isSelected ? 'bg-blue-50' : ''}`}>
                        <div className="flex items-start gap-4">
                          <Checkbox
                            checked={isSelected}
                            onChange={(e) => handleItemToggle(item, e.target.checked)}
                          />
                          <div className="flex-1">
                            <div className="flex justify-between items-start">
                              <div>
                                <p className="font-medium">{item.product.name}</p>
                                <p className="text-sm text-gray-500">SKU: {item.product.sku}</p>
                              </div>
                              <div className="text-right">
                                <p className="font-medium">{formatCurrency(item.unitPrice)} x {item.quantity}</p>
                                <p className="text-sm text-gray-500">Total: {formatCurrency(item.totalPrice)}</p>
                              </div>
                            </div>

                            {isSelected && returnItem && (
                              <div className="mt-4 grid grid-cols-4 gap-4 bg-white p-3 rounded border">
                                <div>
                                  <label className="text-xs text-gray-500 block mb-1">Return Qty</label>
                                  <InputNumber
                                    min={1}
                                    max={item.quantity}
                                    value={returnItem.returnQuantity}
                                    onChange={(val) => updateItemDetail(item.id, 'returnQuantity', val)}
                                    style={{ width: '100%' }}
                                  />
                                </div>
                                <div>
                                  <label className="text-xs text-gray-500 block mb-1">Reason</label>
                                  <Select
                                    value={returnItem.reason}
                                    onChange={(val) => updateItemDetail(item.id, 'reason', val)}
                                    style={{ width: '100%' }}
                                    size="small"
                                  >
                                    <Option value="Damaged">Damaged</Option>
                                    <Option value="Wrong Item">Wrong Item</Option>
                                    <Option value="Defective">Defective</Option>
                                    <Option value="Not as Described">Not as Described</Option>
                                    <Option value="Changed Mind">Changed Mind</Option>
                                    <Option value="Other">Other</Option>
                                  </Select>
                                </div>
                                <div>
                                  <label className="text-xs text-gray-500 block mb-1">Condition</label>
                                  <Select
                                    value={returnItem.condition}
                                    onChange={(val) => updateItemDetail(item.id, 'condition', val)}
                                    style={{ width: '100%' }}
                                    size="small"
                                  >
                                    <Option value="Unopened">Unopened</Option>
                                    <Option value="Opened">Opened</Option>
                                    <Option value="Used">Used</Option>
                                    <Option value="Damaged">Damaged</Option>
                                  </Select>
                                </div>
                                {returnType === 'exchange' && (
                                  <div>
                                    <label className="text-xs text-gray-500 block mb-1">Exchange For</label>
                                    <Select
                                      placeholder="Select product"
                                      value={returnItem.exchangeProductId}
                                      onChange={(val) => {
                                        const product = products.find(p => p.id === val);
                                        updateItemDetail(item.id, 'exchangeProductId', val);
                                        updateItemDetail(item.id, 'exchangeProductName', product?.name);
                                      }}
                                      style={{ width: '100%' }}
                                      size="small"
                                      showSearch
                                      optionFilterProp="children"
                                    >
                                      {products.map(p => (
                                        <Option key={p.id} value={p.id}>{p.name}</Option>
                                      ))}
                                    </Select>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Step 3: Return Type & Details */}
              <Divider />
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-3">Step 3: Return Details</h3>
                <Row gutter={16}>
                  <Col span={8}>
                    <Form.Item label="Return Type">
                      <Select value={returnType} onChange={setReturnType} size="large">
                        <Option value="return">
                          <Space><ShoppingCartOutlined /> Return</Space>
                        </Option>
                        <Option value="exchange">
                          <Space><SwapOutlined /> Exchange</Space>
                        </Option>
                        <Option value="refund">
                          <Space><DollarOutlined /> Refund</Space>
                        </Option>
                      </Select>
                    </Form.Item>
                  </Col>
                  <Col span={16}>
                    <Form.Item label="Notes" name="notes">
                      <TextArea rows={2} placeholder="Additional notes..." />
                    </Form.Item>
                  </Col>
                </Row>
              </div>

              {/* Summary */}
              {selectedItems.size > 0 && (
                <Card className="bg-gray-50">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-gray-500">Selected Items: <strong>{selectedItems.size}</strong></p>
                      <p className="text-gray-500">Customer: <strong>{selectedOrder.customer?.name}</strong></p>
                    </div>
                    <div className="text-right">
                      <p className="text-gray-500">Total Return Value</p>
                      <p className="text-2xl font-bold text-blue-600">{formatCurrency(calculateTotalValue())}</p>
                    </div>
                  </div>
                </Card>
              )}
            </>
          )}
        </Form>
      </Modal>

      {/* View Return Modal */}
      <Modal
        title={`RMA Details - ${currentReturn?.rmaNumber}`}
        open={viewModal.isOpen}
        onCancel={viewModal.close}
        footer={[
          <Button key="print" icon={<PrinterOutlined />} onClick={() => handlePrint(currentReturn)}>Print</Button>,
          <Button key="edit" type="primary" icon={<EditOutlined />} onClick={() => { viewModal.close(); handleEdit(currentReturn); }}>Edit</Button>,
          <Button key="close" onClick={viewModal.close}>Close</Button>,
        ]}
        width={800}
      >
        {currentReturn && (
          <div className="space-y-6">
            <Descriptions bordered column={2}>
              <Descriptions.Item label="RMA Number">{currentReturn.rmaNumber}</Descriptions.Item>
              <Descriptions.Item label="Order Number">{currentReturn.orderNumber}</Descriptions.Item>
              <Descriptions.Item label="Customer">{currentReturn.customer}</Descriptions.Item>
              <Descriptions.Item label="Type">
                <Tag color={currentReturn.type === 'Exchange' ? 'blue' : currentReturn.type === 'Refund' ? 'green' : 'purple'}>
                  {currentReturn.type}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Reason">{currentReturn.reason}</Descriptions.Item>
              <Descriptions.Item label="Status">
                <Tag color={currentReturn.status === 'completed' ? 'green' : currentReturn.status === 'pending' ? 'orange' : 'blue'}>
                  {currentReturn.status?.toUpperCase()}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Requested Date">{formatDate(currentReturn.requestedDate)}</Descriptions.Item>
              <Descriptions.Item label="Total Value">{formatCurrency(currentReturn.value)}</Descriptions.Item>
              {currentReturn.notes && (
                <Descriptions.Item label="Notes" span={2}>{currentReturn.notes}</Descriptions.Item>
              )}
            </Descriptions>

            <div>
              <h4 className="font-semibold mb-3">Return Items</h4>
              <List
                bordered
                dataSource={currentReturn.items || []}
                renderItem={(item: any) => (
                  <List.Item>
                    <List.Item.Meta
                      avatar={<Avatar icon={<ShoppingCartOutlined />} />}
                      title={<span>{item.productName} <Tag>{item.sku}</Tag></span>}
                      description={
                        <Space>
                          <span>Qty: {item.quantity}</span>
                          <span>Reason: {item.reason}</span>
                          {item.condition && <span>Condition: {item.condition}</span>}
                          {item.exchangeProductName && <Tag color="blue">Exchange: {item.exchangeProductName}</Tag>}
                        </Space>
                      }
                    />
                  </List.Item>
                )}
              />
            </div>
          </div>
        )}
      </Modal>

      {/* Edit Return Modal */}
      <Modal
        title={`Edit RMA - ${currentReturn?.rmaNumber}`}
        open={editModal.isOpen}
        onCancel={editModal.close}
        onOk={handleEditSave}
        okText="Save Changes"
        width={600}
      >
        <Form form={editForm} layout="vertical">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="Type" name="type">
                <Select>
                  <Option value="Return">Return</Option>
                  <Option value="Exchange">Exchange</Option>
                  <Option value="Refund">Refund</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Status" name="status">
                <Select>
                  <Option value="pending">Pending</Option>
                  <Option value="processing">Processing</Option>
                  <Option value="approved">Approved</Option>
                  <Option value="completed">Completed</Option>
                  <Option value="rejected">Rejected</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Form.Item label="Reason" name="reason">
            <Select>
              <Option value="Damaged">Damaged</Option>
              <Option value="Wrong Item">Wrong Item</Option>
              <Option value="Defective">Defective</Option>
              <Option value="Not as Described">Not as Described</Option>
              <Option value="Changed Mind">Changed Mind</Option>
              <Option value="Other">Other</Option>
            </Select>
          </Form.Item>
          <Form.Item label="Notes" name="notes">
            <TextArea rows={3} placeholder="Additional notes..." />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
