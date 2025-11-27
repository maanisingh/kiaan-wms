'use client';

import React, { useState, useEffect } from 'react';
import {
  Table, Button, Input, Select, Tag, Card, Modal, Form, message,
  Drawer, Descriptions, Space, InputNumber, DatePicker, Progress,
  Popconfirm, Badge, Tabs, Divider, Typography
} from 'antd';
import {
  PlusOutlined, SearchOutlined, InboxOutlined, ReloadOutlined,
  EyeOutlined, EditOutlined, DeleteOutlined, CheckCircleOutlined,
  CloseCircleOutlined, FileTextOutlined
} from '@ant-design/icons';
import { formatDate } from '@/lib/utils';
import apiService from '@/services/api';
import dayjs from 'dayjs';

const { Search } = Input;
const { Option } = Select;
const { TextArea } = Input;
const { Title, Text } = Typography;

interface GoodsReceipt {
  id: string;
  grNumber: string;
  poNumber: string;
  purchaseOrderId: string;
  supplier: string;
  supplierId: string;
  status: string;
  items: number;
  totalExpected: number;
  totalReceived: number;
  totalDamaged: number;
  receivedDate: string | null;
  receivedBy: string | null;
  qualityStatus: string | null;
  qualityNotes: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

interface GoodsReceiptDetail extends GoodsReceipt {
  items: GoodsReceiptItem[];
  purchaseOrder: {
    id: string;
    poNumber: string;
    status: string;
    totalAmount: number;
    items: PurchaseOrderItem[];
  };
}

interface GoodsReceiptItem {
  id: string;
  purchaseOrderItemId: string;
  productId: string;
  productName: string;
  productSku: string;
  expectedQty: number;
  receivedQty: number;
  damagedQty: number;
  batchNumber: string | null;
  lotNumber: string | null;
  bestBeforeDate: string | null;
  locationId: string | null;
  qualityStatus: string | null;
  qualityNotes: string | null;
  notes: string | null;
}

interface PurchaseOrderItem {
  id: string;
  productId: string;
  productName: string;
  productSku: string;
  quantity: number;
  unitPrice: number;
}

interface ApprovedPO {
  id: string;
  poNumber: string;
  supplier: {
    id: string;
    name: string;
    code: string;
  };
  status: string;
  totalAmount: number;
  expectedDate: string | null;
  items: PurchaseOrderItem[];
  createdAt: string;
}

export default function GoodsReceivingPage() {
  const [loading, setLoading] = useState(false);
  const [receipts, setReceipts] = useState<GoodsReceipt[]>([]);
  const [approvedPOs, setApprovedPOs] = useState<ApprovedPO[]>([]);
  const [selectedPO, setSelectedPO] = useState<ApprovedPO | null>(null);
  const [selectedReceipt, setSelectedReceipt] = useState<GoodsReceiptDetail | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Modals
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [viewDrawerOpen, setViewDrawerOpen] = useState(false);
  const [receiveModalOpen, setReceiveModalOpen] = useState(false);

  const [form] = Form.useForm();
  const [receiveForm] = Form.useForm();

  // Fetch goods receipts
  const fetchReceipts = async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (statusFilter !== 'all') params.status = statusFilter;
      if (searchTerm) params.search = searchTerm;

      const data = await apiService.get('/goods-receiving', { params });
      setReceipts(Array.isArray(data) ? data : []);
    } catch (err: any) {
      message.error(err.message || 'Failed to fetch receipts');
    } finally {
      setLoading(false);
    }
  };

  // Fetch approved purchase orders
  const fetchApprovedPOs = async () => {
    try {
      const data = await apiService.get('/goods-receiving/purchase-orders/approved');
      setApprovedPOs(Array.isArray(data) ? data : []);
    } catch (err: any) {
      console.error('Failed to fetch approved POs:', err);
    }
  };

  // Fetch single goods receipt details
  const fetchReceiptDetails = async (id: string) => {
    try {
      const data = await apiService.get(`/goods-receiving/${id}`);
      setSelectedReceipt(data);
      return data;
    } catch (err: any) {
      message.error(err.message || 'Failed to fetch receipt details');
      return null;
    }
  };

  useEffect(() => {
    fetchReceipts();
  }, [statusFilter]);

  // Create goods receipt
  const handleCreate = async (values: any) => {
    try {
      await apiService.post('/goods-receiving', {
        purchaseOrderId: values.purchaseOrderId,
        notes: values.notes
      });
      message.success('Goods receipt created successfully!');
      form.resetFields();
      setSelectedPO(null);
      setCreateModalOpen(false);
      fetchReceipts();
      fetchApprovedPOs();
    } catch (err: any) {
      message.error(err.message || 'Failed to create goods receipt');
    }
  };

  // View receipt details
  const handleView = async (record: GoodsReceipt) => {
    await fetchReceiptDetails(record.id);
    setViewDrawerOpen(true);
  };

  // Open receive modal
  const handleOpenReceive = async (record: GoodsReceipt) => {
    const details = await fetchReceiptDetails(record.id);
    if (details) {
      // Set initial values for receive form
      const initialItems = details.items.map((item: GoodsReceiptItem) => ({
        id: item.id,
        productName: item.productName,
        productSku: item.productSku,
        expectedQty: item.expectedQty,
        receivedQty: item.receivedQty,
        damagedQty: item.damagedQty,
        batchNumber: item.batchNumber,
        lotNumber: item.lotNumber,
        bestBeforeDate: item.bestBeforeDate ? dayjs(item.bestBeforeDate) : null,
        qualityStatus: item.qualityStatus || 'GOOD',
        notes: item.notes
      }));
      receiveForm.setFieldsValue({ items: initialItems });
      setReceiveModalOpen(true);
    }
  };

  // Submit receive items
  const handleReceiveItems = async (values: any) => {
    if (!selectedReceipt) return;

    try {
      const items = values.items.map((item: any) => ({
        id: item.id,
        receivedQty: item.receivedQty || 0,
        damagedQty: item.damagedQty || 0,
        batchNumber: item.batchNumber,
        lotNumber: item.lotNumber,
        bestBeforeDate: item.bestBeforeDate?.toISOString(),
        qualityStatus: item.qualityStatus,
        notes: item.notes
      }));

      await apiService.post(`/goods-receiving/${selectedReceipt.id}/receive-items`, {
        items,
        receivedBy: 'Current User' // In real app, get from auth context
      });

      message.success('Items received successfully!');
      receiveForm.resetFields();
      setReceiveModalOpen(false);
      setSelectedReceipt(null);
      fetchReceipts();
    } catch (err: any) {
      message.error(err.message || 'Failed to receive items');
    }
  };

  // Complete goods receipt
  const handleComplete = async (record: GoodsReceipt) => {
    try {
      await apiService.post(`/goods-receiving/${record.id}/complete`, {
        qualityStatus: 'PASSED'
      });
      message.success('Goods receipt completed!');
      fetchReceipts();
      if (viewDrawerOpen) {
        fetchReceiptDetails(record.id);
      }
    } catch (err: any) {
      message.error(err.message || 'Failed to complete goods receipt');
    }
  };

  // Delete goods receipt
  const handleDelete = async (id: string) => {
    try {
      await apiService.delete(`/goods-receiving/${id}`);
      message.success('Goods receipt deleted successfully');
      fetchReceipts();
    } catch (err: any) {
      message.error(err.message || 'Failed to delete goods receipt');
    }
  };

  // Cancel goods receipt
  const handleCancel = async (id: string) => {
    try {
      await apiService.post(`/goods-receiving/${id}/cancel`, {
        reason: 'Cancelled by user'
      });
      message.success('Goods receipt cancelled');
      fetchReceipts();
    } catch (err: any) {
      message.error(err.message || 'Failed to cancel goods receipt');
    }
  };

  // Handle PO selection
  const handlePOSelect = (poId: string) => {
    const po = approvedPOs.find(p => p.id === poId);
    setSelectedPO(po || null);
    form.setFieldsValue({ purchaseOrderId: poId });
  };

  // Open create modal
  const handleOpenCreate = () => {
    fetchApprovedPOs();
    setCreateModalOpen(true);
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'orange',
      in_progress: 'blue',
      completed: 'green',
      cancelled: 'red'
    };
    return colors[status] || 'default';
  };

  const columns = [
    {
      title: 'GRN Number',
      dataIndex: 'grNumber',
      key: 'grNumber',
      render: (text: string) => <span className="font-medium text-blue-600">{text}</span>,
      sorter: (a: GoodsReceipt, b: GoodsReceipt) => a.grNumber.localeCompare(b.grNumber)
    },
    {
      title: 'PO Number',
      dataIndex: 'poNumber',
      key: 'poNumber',
      render: (text: string) => <span className="text-gray-700">{text}</span>
    },
    {
      title: 'Supplier',
      dataIndex: 'supplier',
      key: 'supplier'
    },
    {
      title: 'Expected',
      dataIndex: 'totalExpected',
      key: 'totalExpected',
      render: (val: number) => <Badge count={val} showZero color="blue" overflowCount={9999} />
    },
    {
      title: 'Received',
      dataIndex: 'totalReceived',
      key: 'totalReceived',
      render: (val: number, record: GoodsReceipt) => (
        <div>
          <Badge count={val} showZero color={val >= record.totalExpected ? 'green' : 'orange'} overflowCount={9999} />
          {record.totalExpected > 0 && (
            <Progress
              percent={Math.round((val / record.totalExpected) * 100)}
              size="small"
              className="mt-1"
              status={val >= record.totalExpected ? 'success' : 'active'}
            />
          )}
        </div>
      )
    },
    {
      title: 'Damaged',
      dataIndex: 'totalDamaged',
      key: 'totalDamaged',
      render: (val: number) => val > 0 ? <Badge count={val} color="red" /> : <span className="text-gray-400">0</span>
    },
    {
      title: 'Received Date',
      dataIndex: 'receivedDate',
      key: 'receivedDate',
      render: (date: string | null) => date ? formatDate(date) : <span className="text-gray-400">Not received</span>
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={getStatusColor(status)}>
          {status.replace('_', ' ').toUpperCase()}
        </Tag>
      )
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 200,
      render: (_: any, record: GoodsReceipt) => (
        <Space size="small">
          <Button
            type="text"
            icon={<EyeOutlined />}
            onClick={() => handleView(record)}
            title="View Details"
          />
          {record.status !== 'completed' && record.status !== 'cancelled' && (
            <>
              <Button
                type="text"
                icon={<InboxOutlined />}
                onClick={() => handleOpenReceive(record)}
                title="Receive Items"
                className="text-blue-500"
              />
              <Popconfirm
                title="Complete this goods receipt?"
                description="This will mark all items as received and update the PO status."
                onConfirm={() => handleComplete(record)}
                okText="Complete"
                cancelText="Cancel"
              >
                <Button
                  type="text"
                  icon={<CheckCircleOutlined />}
                  title="Complete"
                  className="text-green-500"
                  disabled={record.totalReceived === 0}
                />
              </Popconfirm>
              <Popconfirm
                title="Cancel this goods receipt?"
                onConfirm={() => handleCancel(record.id)}
                okText="Yes"
                cancelText="No"
              >
                <Button
                  type="text"
                  icon={<CloseCircleOutlined />}
                  title="Cancel"
                  className="text-orange-500"
                />
              </Popconfirm>
            </>
          )}
          {record.status !== 'completed' && (
            <Popconfirm
              title="Delete this goods receipt?"
              description="This action cannot be undone."
              onConfirm={() => handleDelete(record.id)}
              okText="Delete"
              cancelText="Cancel"
              okButtonProps={{ danger: true }}
            >
              <Button
                type="text"
                icon={<DeleteOutlined />}
                danger
                title="Delete"
              />
            </Popconfirm>
          )}
        </Space>
      )
    }
  ];

  // Stats
  const stats = {
    pending: receipts.filter(r => r.status === 'pending').length,
    inProgress: receipts.filter(r => r.status === 'in_progress').length,
    completed: receipts.filter(r => r.status === 'completed').length,
    totalItems: receipts.reduce((sum, r) => sum + (r.totalReceived || 0), 0)
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
            Goods Receiving
          </h1>
          <p className="text-gray-600 mt-1">Receive and process incoming inventory from purchase orders</p>
        </div>
        <Button
          type="primary"
          icon={<InboxOutlined />}
          size="large"
          onClick={handleOpenCreate}
        >
          Receive Goods
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <div className="text-center">
            <p className="text-gray-500 text-sm">Pending</p>
            <p className="text-3xl font-bold text-orange-600">{stats.pending}</p>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <p className="text-gray-500 text-sm">In Progress</p>
            <p className="text-3xl font-bold text-blue-600">{stats.inProgress}</p>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <p className="text-gray-500 text-sm">Completed</p>
            <p className="text-3xl font-bold text-green-600">{stats.completed}</p>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <p className="text-gray-500 text-sm">Items Received</p>
            <p className="text-3xl font-bold text-purple-600">{stats.totalItems}</p>
          </div>
        </Card>
      </div>

      {/* Main Table */}
      <Card>
        <div className="flex gap-4 mb-4">
          <Search
            placeholder="Search by GRN, PO, or supplier..."
            style={{ width: 300 }}
            prefix={<SearchOutlined />}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onSearch={fetchReceipts}
            allowClear
          />
          <Select
            placeholder="Filter by status"
            style={{ width: 150 }}
            value={statusFilter}
            onChange={setStatusFilter}
          >
            <Option value="all">All Status</Option>
            <Option value="pending">Pending</Option>
            <Option value="in_progress">In Progress</Option>
            <Option value="completed">Completed</Option>
            <Option value="cancelled">Cancelled</Option>
          </Select>
          <Button icon={<ReloadOutlined />} onClick={fetchReceipts}>
            Refresh
          </Button>
        </div>
        <Table
          columns={columns}
          dataSource={receipts}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 10, showSizeChanger: true, showTotal: (total) => `Total ${total} records` }}
        />
      </Card>

      {/* Create Goods Receipt Modal */}
      <Modal
        title="Create Goods Receipt"
        open={createModalOpen}
        onCancel={() => {
          setCreateModalOpen(false);
          form.resetFields();
          setSelectedPO(null);
        }}
        onOk={() => form.submit()}
        width={700}
        okText="Create"
      >
        <Form form={form} layout="vertical" onFinish={handleCreate}>
          <Form.Item
            label="Select Purchase Order"
            name="purchaseOrderId"
            rules={[{ required: true, message: 'Please select a purchase order' }]}
          >
            <Select
              placeholder="Select an approved purchase order"
              onChange={handlePOSelect}
              showSearch
              optionFilterProp="children"
              notFoundContent={approvedPOs.length === 0 ? 'No approved purchase orders available' : null}
            >
              {approvedPOs.map(po => (
                <Option key={po.id} value={po.id}>
                  {po.poNumber} - {po.supplier.name} ({po.items.length} items)
                </Option>
              ))}
            </Select>
          </Form.Item>

          {selectedPO && (
            <div className="bg-gray-50 p-4 rounded-lg mb-4">
              <Title level={5}>Purchase Order Details</Title>
              <Descriptions column={2} size="small">
                <Descriptions.Item label="PO Number">{selectedPO.poNumber}</Descriptions.Item>
                <Descriptions.Item label="Supplier">{selectedPO.supplier.name}</Descriptions.Item>
                <Descriptions.Item label="Total Amount">${selectedPO.totalAmount?.toFixed(2)}</Descriptions.Item>
                <Descriptions.Item label="Items">{selectedPO.items.length}</Descriptions.Item>
              </Descriptions>
              <Divider className="my-3" />
              <Title level={5}>Items to Receive</Title>
              <Table
                dataSource={selectedPO.items}
                columns={[
                  { title: 'Product', dataIndex: 'productName', key: 'productName' },
                  { title: 'SKU', dataIndex: 'productSku', key: 'productSku' },
                  { title: 'Quantity', dataIndex: 'quantity', key: 'quantity' }
                ]}
                rowKey="id"
                size="small"
                pagination={false}
              />
            </div>
          )}

          <Form.Item label="Notes" name="notes">
            <TextArea rows={3} placeholder="Optional notes for this goods receipt" />
          </Form.Item>
        </Form>
      </Modal>

      {/* View Details Drawer */}
      <Drawer
        title={`Goods Receipt: ${selectedReceipt?.grNumber || ''}`}
        placement="right"
        width={700}
        open={viewDrawerOpen}
        onClose={() => {
          setViewDrawerOpen(false);
          setSelectedReceipt(null);
        }}
        extra={
          selectedReceipt && selectedReceipt.status !== 'completed' && selectedReceipt.status !== 'cancelled' && (
            <Space>
              <Button
                icon={<InboxOutlined />}
                onClick={() => {
                  setViewDrawerOpen(false);
                  handleOpenReceive(selectedReceipt as any);
                }}
              >
                Receive Items
              </Button>
              <Button
                type="primary"
                icon={<CheckCircleOutlined />}
                onClick={() => handleComplete(selectedReceipt as any)}
                disabled={(selectedReceipt?.totalReceived || 0) === 0}
              >
                Complete
              </Button>
            </Space>
          )
        }
      >
        {selectedReceipt && (
          <div className="space-y-6">
            <Descriptions title="Receipt Information" bordered column={2}>
              <Descriptions.Item label="GRN Number">{selectedReceipt.grNumber}</Descriptions.Item>
              <Descriptions.Item label="PO Number">{selectedReceipt.poNumber}</Descriptions.Item>
              <Descriptions.Item label="Supplier">{selectedReceipt.supplier?.name}</Descriptions.Item>
              <Descriptions.Item label="Status">
                <Tag color={getStatusColor(selectedReceipt.status)}>
                  {selectedReceipt.status.replace('_', ' ').toUpperCase()}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Total Expected">{selectedReceipt.totalExpected}</Descriptions.Item>
              <Descriptions.Item label="Total Received">{selectedReceipt.totalReceived}</Descriptions.Item>
              <Descriptions.Item label="Total Damaged">{selectedReceipt.totalDamaged}</Descriptions.Item>
              <Descriptions.Item label="Received Date">
                {selectedReceipt.receivedDate ? formatDate(selectedReceipt.receivedDate) : 'Not received yet'}
              </Descriptions.Item>
              <Descriptions.Item label="Received By" span={2}>{selectedReceipt.receivedBy || '-'}</Descriptions.Item>
              <Descriptions.Item label="Quality Status" span={2}>
                {selectedReceipt.qualityStatus ? (
                  <Tag color={selectedReceipt.qualityStatus === 'PASSED' ? 'green' : 'red'}>
                    {selectedReceipt.qualityStatus}
                  </Tag>
                ) : '-'}
              </Descriptions.Item>
              <Descriptions.Item label="Notes" span={2}>{selectedReceipt.notes || '-'}</Descriptions.Item>
            </Descriptions>

            <Divider />

            <Title level={5}>Items</Title>
            <Table
              dataSource={selectedReceipt.items}
              columns={[
                { title: 'Product', dataIndex: 'productName', key: 'productName' },
                { title: 'SKU', dataIndex: 'productSku', key: 'productSku' },
                { title: 'Expected', dataIndex: 'expectedQty', key: 'expectedQty' },
                {
                  title: 'Received',
                  dataIndex: 'receivedQty',
                  key: 'receivedQty',
                  render: (val: number, record: GoodsReceiptItem) => (
                    <span className={val >= record.expectedQty ? 'text-green-600' : 'text-orange-600'}>
                      {val}
                    </span>
                  )
                },
                {
                  title: 'Damaged',
                  dataIndex: 'damagedQty',
                  key: 'damagedQty',
                  render: (val: number) => val > 0 ? <span className="text-red-600">{val}</span> : '0'
                },
                { title: 'Batch #', dataIndex: 'batchNumber', key: 'batchNumber', render: (v: string) => v || '-' },
                {
                  title: 'Quality',
                  dataIndex: 'qualityStatus',
                  key: 'qualityStatus',
                  render: (status: string) => status ? (
                    <Tag color={status === 'GOOD' ? 'green' : status === 'DAMAGED' ? 'red' : 'orange'}>
                      {status}
                    </Tag>
                  ) : '-'
                }
              ]}
              rowKey="id"
              size="small"
              pagination={false}
            />
          </div>
        )}
      </Drawer>

      {/* Receive Items Modal */}
      <Modal
        title={`Receive Items - ${selectedReceipt?.grNumber || ''}`}
        open={receiveModalOpen}
        onCancel={() => {
          setReceiveModalOpen(false);
          receiveForm.resetFields();
          setSelectedReceipt(null);
        }}
        onOk={() => receiveForm.submit()}
        width={900}
        okText="Save Received Items"
      >
        <Form form={receiveForm} onFinish={handleReceiveItems}>
          <Form.List name="items">
            {(fields) => (
              <div className="space-y-4">
                {fields.map((field, index) => {
                  const item = receiveForm.getFieldValue(['items', index]);
                  return (
                    <Card key={field.key} size="small" className="bg-gray-50">
                      <div className="flex justify-between items-center mb-2">
                        <div>
                          <Text strong>{item?.productName}</Text>
                          <Text type="secondary" className="ml-2">({item?.productSku})</Text>
                        </div>
                        <Text type="secondary">Expected: {item?.expectedQty}</Text>
                      </div>
                      <div className="grid grid-cols-4 gap-4">
                        <Form.Item name={[field.name, 'id']} hidden>
                          <Input />
                        </Form.Item>
                        <Form.Item
                          label="Received Qty"
                          name={[field.name, 'receivedQty']}
                          rules={[{ required: true, message: 'Required' }]}
                        >
                          <InputNumber min={0} max={item?.expectedQty} style={{ width: '100%' }} />
                        </Form.Item>
                        <Form.Item label="Damaged Qty" name={[field.name, 'damagedQty']}>
                          <InputNumber min={0} style={{ width: '100%' }} />
                        </Form.Item>
                        <Form.Item label="Batch Number" name={[field.name, 'batchNumber']}>
                          <Input placeholder="Batch #" />
                        </Form.Item>
                        <Form.Item label="Best Before" name={[field.name, 'bestBeforeDate']}>
                          <DatePicker style={{ width: '100%' }} />
                        </Form.Item>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <Form.Item label="Quality Status" name={[field.name, 'qualityStatus']}>
                          <Select>
                            <Option value="GOOD">Good</Option>
                            <Option value="DAMAGED">Damaged</Option>
                            <Option value="REJECTED">Rejected</Option>
                          </Select>
                        </Form.Item>
                        <Form.Item label="Notes" name={[field.name, 'notes']}>
                          <Input placeholder="Item notes" />
                        </Form.Item>
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
          </Form.List>
        </Form>
      </Modal>
    </div>
  );
}
