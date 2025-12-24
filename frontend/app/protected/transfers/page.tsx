'use client';

import React, { useState, useEffect } from 'react';
import {
  Table, Button, Tag, Card, Space, Statistic, Row, Col, Modal, Form,
  Input, Select, InputNumber, Drawer, Tabs, Switch, DatePicker, App
} from 'antd';
import {
  PlusOutlined, EditOutlined, DeleteOutlined, EyeOutlined,
  ClockCircleOutlined, TruckOutlined, CheckCircleOutlined, FileTextOutlined,
  MinusCircleOutlined, SearchOutlined, SwapOutlined, InboxOutlined, ReloadOutlined
} from '@ant-design/icons';
import { useModal } from '@/hooks/useModal';
import Link from 'next/link';
import dayjs from 'dayjs';
import apiService from '@/services/api';
import { usePermissions } from '@/hooks/usePermissions';

const { Option } = Select;
const { Search } = Input;
const { TextArea } = Input;

export default function TransfersPage() {
  const { modal, message } = App.useApp();
  const { canDelete } = usePermissions();
  const [selectedTransfer, setSelectedTransfer] = useState<any>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [transfers, setTransfers] = useState<any[]>([]);
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [availableInventory, setAvailableInventory] = useState<any[]>([]);
  const [selectedFromWarehouse, setSelectedFromWarehouse] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingInventory, setLoadingInventory] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const addModal = useModal();
  const editModal = useModal();
  const [form] = Form.useForm();

  // Fetch transfers
  const fetchTransfers = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await apiService.get('/transfers');
      setTransfers(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch transfers');
      message.error(err.message || 'Failed to fetch transfers');
    } finally {
      setLoading(false);
    }
  };

  // Fetch warehouses
  const fetchWarehouses = async () => {
    try {
      const data = await apiService.get('/warehouses?limit=100');
      setWarehouses(Array.isArray(data) ? data : []);
    } catch (err: any) {
      console.error('Error fetching warehouses:', err);
    }
  };

  // Fetch products
  const fetchProducts = async () => {
    try {
      const data = await apiService.get('/products?type=SIMPLE&limit=1000');
      setProducts(Array.isArray(data) ? data : []);
    } catch (err: any) {
      console.error('Error fetching products:', err);
    }
  };

  // Fetch available inventory for a warehouse
  const fetchAvailableInventory = async (warehouseId: string) => {
    try {
      setLoadingInventory(true);
      const data = await apiService.get(`/transfers/available-inventory/${warehouseId}`);
      setAvailableInventory(Array.isArray(data) ? data : []);
    } catch (err: any) {
      console.error('Error fetching available inventory:', err);
      message.error('Failed to fetch available inventory');
      setAvailableInventory([]);
    } finally {
      setLoadingInventory(false);
    }
  };

  // Handle source warehouse change
  const handleFromWarehouseChange = (warehouseId: string) => {
    setSelectedFromWarehouse(warehouseId);
    // Reset destination and items when source warehouse changes
    form.setFieldsValue({ toWarehouseId: undefined, transferItems: [{}] });
    if (warehouseId) {
      fetchAvailableInventory(warehouseId);
    } else {
      setAvailableInventory([]);
    }
  };

  // Get max quantity for a product
  const getMaxQuantity = (productId: string) => {
    const item = availableInventory.find(inv => inv.productId === productId);
    return item?.availableQty || 0;
  };

  useEffect(() => {
    fetchTransfers();
    fetchWarehouses();
    fetchProducts();
  }, []);

  const handleSubmit = async (values: any) => {
    try {
      if (selectedTransfer) {
        // UPDATE existing transfer
        await apiService.patch(`/transfers/${selectedTransfer.id}`, {
          type: values.type,
          fromWarehouseId: values.fromWarehouseId,
          toWarehouseId: values.toWarehouseId,
          status: values.status,
          fbaShipmentId: values.fbaShipmentId || null,
          fbaDestination: values.fbaDestination || null,
          shipmentBuilt: values.shipmentBuilt || false,
          notes: values.notes || null,
          shippedAt: values.shippedAt ? values.shippedAt.toISOString() : null,
          receivedAt: values.receivedAt ? values.receivedAt.toISOString() : null,
        });

        message.success('Transfer updated successfully!');
        editModal.close();
      } else {
        // CREATE new transfer
        const payload = {
          type: values.type,
          fromWarehouseId: values.fromWarehouseId,
          toWarehouseId: values.toWarehouseId,
          fbaShipmentId: values.fbaShipmentId || null,
          fbaDestination: values.fbaDestination || null,
          shipmentBuilt: values.shipmentBuilt || false,
          notes: values.notes || null,
          items: values.transferItems?.map((item: any) => ({
            productId: item.productId,
            quantity: item.quantity,
            notes: item.notes
          })) || [],
        };

        await apiService.post('/transfers', payload);
        message.success('Transfer created successfully!');
        addModal.close();
        setSelectedFromWarehouse(null);
        setAvailableInventory([]);
      }

      form.resetFields();
      fetchTransfers();
    } catch (error: any) {
      console.error('Error saving transfer:', error);
      message.error(error?.message || 'Failed to save transfer');
    }
  };

  const handleEdit = (record: any) => {
    setSelectedTransfer(record);
    form.setFieldsValue({
      type: record.type,
      fromWarehouseId: record.fromWarehouseId,
      toWarehouseId: record.toWarehouseId,
      status: record.status,
      fbaShipmentId: record.fbaShipmentId,
      fbaDestination: record.fbaDestination,
      shipmentBuilt: record.shipmentBuilt,
      notes: record.notes,
      shippedAt: record.shippedAt ? dayjs(record.shippedAt) : null,
      receivedAt: record.receivedAt ? dayjs(record.receivedAt) : null,
    });
    editModal.open();
  };

  const handleDelete = (record: any) => {
    modal.confirm({
      title: 'Delete Transfer',
      content: `Are you sure you want to delete transfer "${record.transferNumber}"? This will also delete all transfer items.`,
      okText: 'Delete',
      okType: 'danger',
      onOk: async () => {
        try {
          await apiService.delete(`/transfers/${record.id}`);
          message.success('Transfer deleted successfully!');
          fetchTransfers();
        } catch (err: any) {
          message.error(err.message || 'Failed to delete transfer');
        }
      },
    });
  };

  const handleAddTransfer = () => {
    setSelectedTransfer(null);
    form.resetFields();
    form.setFieldsValue({
      type: 'WAREHOUSE',
      shipmentBuilt: false,
      transferItems: [{}],
    });
    addModal.open();
  };

  const columns = [
    {
      title: 'Transfer #',
      dataIndex: 'transferNumber',
      key: 'transferNumber',
      width: 140,
      render: (text: string, record: any) => (
        <Link href={`/transfers/${record.id}`}>
          <span className="font-medium text-blue-600 hover:underline cursor-pointer">{text}</span>
        </Link>
      ),
    },
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      width: 140,
      render: (type: string) => {
        const colors: any = {
          WAREHOUSE: 'blue',
          FBA_PREP: 'purple',
          FBA_SHIPMENT: 'green',
        };
        return <Tag color={colors[type] || 'default'}>{type.replace('_', ' ')}</Tag>;
      },
    },
    {
      title: 'From',
      dataIndex: 'fromWarehouse',
      key: 'from',
      width: 180,
      render: (wh: any) => wh?.name || '-',
    },
    {
      title: 'To',
      dataIndex: 'toWarehouse',
      key: 'to',
      width: 180,
      render: (wh: any) => wh?.name || '-',
    },
    {
      title: 'Items',
      key: 'items',
      width: 80,
      render: (_: any, record: any) => (
        <Tag color="purple">{record.transferItems?.length || 0}</Tag>
      ),
    },
    {
      title: 'Qty',
      key: 'quantity',
      width: 100,
      render: (_: any, record: any) => {
        const total = record.transferItems?.reduce((sum: number, item: any) => sum + item.quantity, 0) || 0;
        const received = record.transferItems?.reduce((sum: number, item: any) => sum + item.receivedQuantity, 0) || 0;
        return `${received}/${total}`;
      },
    },
    {
      title: 'FBA Shipment',
      dataIndex: 'fbaShipmentId',
      key: 'fbaShipment',
      width: 140,
      render: (text: string) => text || <span className="text-gray-400">-</span>,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status: string) => {
        const colors: any = {
          PENDING: 'orange',
          IN_TRANSIT: 'blue',
          RECEIVING: 'purple',
          COMPLETED: 'green',
          CANCELLED: 'red',
        };
        return <Tag color={colors[status] || 'default'}>{status.replace('_', ' ')}</Tag>;
      },
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 200,
      fixed: 'right' as const,
      render: (_: any, record: any) => (
        <Space>
          <Button
            type="link"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => {
              setSelectedTransfer(record);
              setDrawerOpen(true);
            }}
          >
            View
          </Button>
          {record.status === 'PENDING' && (
            <Button type="link" size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)}>
              Edit
            </Button>
          )}
          {canDelete() && (
            <Button type="link" size="small" danger icon={<DeleteOutlined />} onClick={() => handleDelete(record)}>
              Delete
            </Button>
          )}
        </Space>
      ),
    },
  ];

  // Filter by search and tab
  const filteredTransfers = transfers.filter((t: any) => {
    const matchesSearch = !searchText ||
      t.transferNumber?.toLowerCase().includes(searchText.toLowerCase()) ||
      t.fromWarehouse?.name?.toLowerCase().includes(searchText.toLowerCase()) ||
      t.toWarehouse?.name?.toLowerCase().includes(searchText.toLowerCase()) ||
      t.fbaShipmentId?.toLowerCase().includes(searchText.toLowerCase());

    const matchesTab = activeTab === 'all' || t.status === activeTab.toUpperCase();

    return matchesSearch && matchesTab;
  });

  // Stats
  const totalTransfers = transfers.length;
  const pendingTransfers = transfers.filter((t: any) => t.status === 'PENDING').length;
  const inTransitTransfers = transfers.filter((t: any) => t.status === 'IN_TRANSIT').length;
  const completedTransfers = transfers.filter((t: any) => t.status === 'COMPLETED').length;

  const renderTable = () => (
    <>
      <div className="flex gap-4 mb-4">
        <Search
          placeholder="Search by transfer #, warehouse, or FBA shipment..."
          allowClear
          style={{ width: 450 }}
          prefix={<SearchOutlined />}
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
        />
        <Button icon={<ReloadOutlined />} onClick={fetchTransfers}>
          Refresh
        </Button>
      </div>
      <Table
        columns={columns}
        dataSource={filteredTransfers}
        rowKey="id"
        loading={loading}
        scroll={{ x: 1400 }}
        pagination={{ pageSize: 20, showSizeChanger: true }}
        expandable={{
          expandedRowRender: (record: any) => (
            <div className="p-4 bg-gray-50">
              <h4 className="font-semibold mb-2">Transfer Items ({record.transferItems?.length || 0}):</h4>
              <ul className="list-disc list-inside">
                {record.transferItems?.map((item: any, idx: number) => (
                  <li key={item.id}>
                    #{idx + 1}: {item.product?.name || 'Unknown'} ({item.product?.sku || '-'}) -
                    Qty: {item.receivedQuantity}/{item.quantity}
                    {item.isFBABundle && <Tag color="purple" className="ml-2">FBA Bundle</Tag>}
                    {item.fbaSku && ` - FBA SKU: ${item.fbaSku}`}
                  </li>
                ))}
              </ul>
            </div>
          ),
        }}
      />
    </>
  );

  const tabItems = [
    {
      key: 'all',
      label: <span className="flex items-center gap-2"><FileTextOutlined />All ({totalTransfers})</span>,
      children: renderTable(),
    },
    {
      key: 'pending',
      label: <span className="flex items-center gap-2"><ClockCircleOutlined />Pending ({pendingTransfers})</span>,
      children: renderTable(),
    },
    {
      key: 'in_transit',
      label: <span className="flex items-center gap-2"><TruckOutlined />In Transit ({inTransitTransfers})</span>,
      children: renderTable(),
    },
    {
      key: 'completed',
      label: <span className="flex items-center gap-2"><CheckCircleOutlined />Completed ({completedTransfers})</span>,
      children: renderTable(),
    },
  ];

  return (
    <div className="p-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 bg-gradient-to-r from-teal-600 to-green-600 bg-clip-text text-transparent">
              Warehouse Transfers
            </h1>
            <p className="text-gray-600 mt-1">Manage warehouse-to-warehouse transfers and FBA shipments</p>
          </div>
          <Button type="primary" icon={<PlusOutlined />} size="large" onClick={handleAddTransfer}>
            Create Transfer
          </Button>
        </div>

        {/* Stats */}
        <Row gutter={16} className="mb-6">
          <Col span={6}>
            <Card>
              <Statistic
                title="Total Transfers"
                value={totalTransfers}
                prefix={<SwapOutlined />}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="Pending"
                value={pendingTransfers}
                valueStyle={{ color: '#faad14' }}
                prefix={<ClockCircleOutlined />}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="In Transit"
                value={inTransitTransfers}
                valueStyle={{ color: '#1890ff' }}
                prefix={<TruckOutlined />}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="Completed"
                value={completedTransfers}
                valueStyle={{ color: '#52c41a' }}
                prefix={<CheckCircleOutlined />}
              />
            </Card>
          </Col>
        </Row>

        {/* Table with Tabs */}
        <Card>
          <Tabs
            activeKey={activeTab}
            onChange={setActiveTab}
            items={tabItems}
            size="large"
          />
        </Card>

        {/* Details Drawer */}
        <Drawer
          title="Transfer Details"
          placement="right"
          width={700}
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
        >
          {selectedTransfer && (
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-lg">{selectedTransfer.transferNumber}</h3>
                <p className="text-gray-600">
                  {selectedTransfer.fromWarehouse?.name} → {selectedTransfer.toWarehouse?.name}
                </p>
              </div>
              <div className="border-t pt-4 space-y-2">
                <p><strong>Type:</strong> <Tag color="blue">{selectedTransfer.type.replace('_', ' ')}</Tag></p>
                <p><strong>Status:</strong> <Tag color="green">{selectedTransfer.status.replace('_', ' ')}</Tag></p>
                <p><strong>FBA Shipment ID:</strong> {selectedTransfer.fbaShipmentId || 'N/A'}</p>
                <p><strong>FBA Destination:</strong> {selectedTransfer.fbaDestination || 'N/A'}</p>
                <p><strong>Shipment Built:</strong> {selectedTransfer.shipmentBuilt ? 'Yes' : 'No'}</p>
                <p><strong>Notes:</strong> {selectedTransfer.notes || 'No notes'}</p>
                <p><strong>Created:</strong> {new Date(selectedTransfer.createdAt).toLocaleDateString()}</p>
                {selectedTransfer.shippedAt && (
                  <p><strong>Shipped:</strong> {new Date(selectedTransfer.shippedAt).toLocaleDateString()}</p>
                )}
                {selectedTransfer.receivedAt && (
                  <p><strong>Received:</strong> {new Date(selectedTransfer.receivedAt).toLocaleDateString()}</p>
                )}
                <div className="border-t pt-4">
                  <p className="font-semibold mb-2">Transfer Items ({selectedTransfer.transferItems?.length}):</p>
                  <ul className="list-disc list-inside space-y-1">
                    {selectedTransfer.transferItems?.map((item: any, idx: number) => (
                      <li key={item.id} className="text-sm">
                        #{idx + 1}: {item.product?.name} ({item.product?.sku}) -
                        Qty: {item.receivedQuantity}/{item.quantity}
                        {item.isFBABundle && <Tag color="purple" className="ml-2" size="small">FBA</Tag>}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}
        </Drawer>

        {/* Add/Edit Modal */}
        <Modal
          title={selectedTransfer ? 'Edit Transfer' : 'Create Transfer'}
          open={addModal.isOpen || editModal.isOpen}
          onCancel={() => {
            addModal.close();
            editModal.close();
          }}
          onOk={() => form.submit()}
          width={1000}
        >
          <Form form={form} layout="vertical" onFinish={handleSubmit}>
            <div className="grid grid-cols-2 gap-4">
              <Form.Item
                label="Transfer Type"
                name="type"
                rules={[{ required: true, message: 'Please select type' }]}
              >
                <Select placeholder="Select transfer type">
                  <Option value="WAREHOUSE">Warehouse to Warehouse</Option>
                  <Option value="FBA_PREP">FBA Prep</Option>
                  <Option value="FBA_SHIPMENT">FBA Shipment</Option>
                </Select>
              </Form.Item>

              {selectedTransfer && (
                <Form.Item
                  label="Status"
                  name="status"
                  rules={[{ required: true, message: 'Please select status' }]}
                >
                  <Select placeholder="Select status">
                    <Option value="PENDING">Pending</Option>
                    <Option value="IN_TRANSIT">In Transit</Option>
                    <Option value="RECEIVING">Receiving</Option>
                    <Option value="COMPLETED">Completed</Option>
                    <Option value="CANCELLED">Cancelled</Option>
                  </Select>
                </Form.Item>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Form.Item
                label="From Warehouse"
                name="fromWarehouseId"
                rules={[{ required: true, message: 'Please select source warehouse' }]}
              >
                <Select
                  placeholder="Select source warehouse"
                  showSearch
                  onChange={handleFromWarehouseChange}
                  filterOption={(input, option: any) =>
                    option.children.toLowerCase().includes(input.toLowerCase())
                  }
                >
                  {warehouses.map((wh: any) => (
                    <Option key={wh.id} value={wh.id}>
                      {wh.name} ({wh.code})
                    </Option>
                  ))}
                </Select>
              </Form.Item>

              <Form.Item
                label="To Warehouse"
                name="toWarehouseId"
                rules={[
                  { required: true, message: 'Please select destination warehouse' },
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      if (value && value === getFieldValue('fromWarehouseId')) {
                        return Promise.reject(new Error('Destination must be different from source'));
                      }
                      return Promise.resolve();
                    },
                  }),
                ]}
              >
                <Select
                  placeholder="Select destination warehouse"
                  showSearch
                  filterOption={(input, option: any) =>
                    option.children.toLowerCase().includes(input.toLowerCase())
                  }
                >
                  {warehouses
                    .filter((wh: any) => wh.id !== selectedFromWarehouse)
                    .map((wh: any) => (
                      <Option key={wh.id} value={wh.id}>
                        {wh.name} ({wh.code})
                      </Option>
                    ))}
                </Select>
              </Form.Item>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Form.Item label="FBA Shipment ID (Optional)" name="fbaShipmentId">
                <Input placeholder="Enter FBA shipment ID" />
              </Form.Item>

              <Form.Item label="FBA Destination (Optional)" name="fbaDestination">
                <Input placeholder="Enter FBA destination (e.g., PHX7)" />
              </Form.Item>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {selectedTransfer && (
                <>
                  <Form.Item label="Shipped At (Optional)" name="shippedAt">
                    <DatePicker style={{ width: '100%' }} showTime />
                  </Form.Item>

                  <Form.Item label="Received At (Optional)" name="receivedAt">
                    <DatePicker style={{ width: '100%' }} showTime />
                  </Form.Item>
                </>
              )}
            </div>

            <Form.Item label="Shipment Built" name="shipmentBuilt" valuePropName="checked">
              <Switch />
            </Form.Item>

            <Form.Item label="Notes (Optional)" name="notes">
              <TextArea rows={3} placeholder="Enter any notes about this transfer" />
            </Form.Item>

            {!selectedTransfer && (
              <div className="border-t pt-4 mt-4">
                <h4 className="font-semibold mb-3">Transfer Items</h4>
                {!selectedFromWarehouse ? (
                  <div className="text-gray-500 text-center py-4 bg-gray-50 rounded">
                    Please select a source warehouse first to see available inventory
                  </div>
                ) : loadingInventory ? (
                  <div className="text-gray-500 text-center py-4 bg-gray-50 rounded">
                    Loading available inventory...
                  </div>
                ) : availableInventory.length === 0 ? (
                  <div className="text-orange-500 text-center py-4 bg-orange-50 rounded">
                    No inventory available in the selected warehouse
                  </div>
                ) : (
                  <Form.List name="transferItems">
                    {(fields, { add, remove }) => (
                      <>
                        {fields.map(({ key, name, ...restField }) => {
                          const selectedProductId = form.getFieldValue(['transferItems', name, 'productId']);
                          const maxQty = getMaxQuantity(selectedProductId);
                          return (
                            <div key={key} className="grid grid-cols-12 gap-2 mb-2 items-start">
                              <Form.Item
                                {...restField}
                                name={[name, 'productId']}
                                rules={[{ required: true, message: 'Select product' }]}
                                className="col-span-6"
                              >
                                <Select
                                  placeholder="Select product from available inventory"
                                  showSearch
                                  filterOption={(input, option: any) =>
                                    option?.label?.toLowerCase().includes(input.toLowerCase())
                                  }
                                  options={availableInventory.map((inv: any) => ({
                                    value: inv.productId,
                                    label: `${inv.productName} (${inv.productSku}) - Available: ${inv.availableQty}`
                                  }))}
                                  onChange={() => {
                                    // Reset quantity when product changes
                                    const items = form.getFieldValue('transferItems');
                                    items[name].quantity = undefined;
                                    form.setFieldsValue({ transferItems: items });
                                  }}
                                />
                              </Form.Item>
                              <Form.Item
                                {...restField}
                                name={[name, 'quantity']}
                                rules={[
                                  { required: true, message: 'Qty required' },
                                  {
                                    validator: (_, value) => {
                                      const productId = form.getFieldValue(['transferItems', name, 'productId']);
                                      const max = getMaxQuantity(productId);
                                      if (value > max) {
                                        return Promise.reject(`Max: ${max}`);
                                      }
                                      return Promise.resolve();
                                    }
                                  }
                                ]}
                                className="col-span-2"
                                help={selectedProductId ? `Max: ${maxQty}` : ''}
                              >
                                <InputNumber
                                  placeholder="Qty"
                                  min={1}
                                  max={maxQty || 1}
                                  style={{ width: '100%' }}
                                />
                              </Form.Item>
                              <Form.Item
                                {...restField}
                                name={[name, 'notes']}
                                className="col-span-3"
                              >
                                <Input placeholder="Notes (optional)" />
                              </Form.Item>
                              <Button
                                type="link"
                                danger
                                icon={<MinusCircleOutlined />}
                                onClick={() => remove(name)}
                                className="col-span-1"
                              />
                            </div>
                          );
                        })}
                        <Button
                          type="dashed"
                          onClick={() => add()}
                          block
                          icon={<PlusOutlined />}
                          disabled={availableInventory.length === 0}
                        >
                          Add Transfer Item
                        </Button>
                      </>
                    )}
                  </Form.List>
                )}
              </div>
            )}

            <p className="text-xs text-gray-500 mt-4">
              Transfers move inventory between warehouses or prepare products for FBA shipments.
            </p>
          </Form>
        </Modal>
      </div>
      );
}
