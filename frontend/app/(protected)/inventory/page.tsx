'use client';

import React, { useState } from 'react';
import { useQuery, useMutation } from '@apollo/client';

import { Table, Button, Tag, Tabs, Card, Input, Spin, Alert, Space, Modal, Form, Select, DatePicker, message, Drawer } from 'antd';
import {
  PlusOutlined, InboxOutlined, CheckCircleOutlined, WarningOutlined, StopOutlined,
  SearchOutlined, ExportOutlined, EditOutlined, DeleteOutlined, EyeOutlined
} from '@ant-design/icons';
import { GET_INVENTORY, GET_PRODUCTS, GET_WAREHOUSES, GET_LOCATIONS } from '@/lib/graphql/queries';
import { CREATE_INVENTORY, UPDATE_INVENTORY, DELETE_INVENTORY } from '@/lib/graphql/mutations';
import { formatDate, getStatusColor } from '@/lib/utils';
import { useModal } from '@/hooks/useModal';
import dayjs from 'dayjs';

const { Search } = Input;
const { Option } = Select;

export default function InventoryPageReal() {
  const [activeTab, setActiveTab] = useState('all');
  const [searchText, setSearchText] = useState('');
  const [selectedInventory, setSelectedInventory] = useState<any>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const addModal = useModal();
  const editModal = useModal();
  const [form] = Form.useForm();

  // Build where clause
  const buildWhereClause = () => {
    const where: any = {};

    if (searchText) {
      where._or = [
        { product: { name: { _ilike: `%${searchText}%` } } },
        { product: { sku: { _ilike: `%${searchText}%` } } },
        { lotNumber: { _ilike: `%${searchText}%` } },
      ];
    }

    // Filter by tab
    if (activeTab === 'in_stock') {
      where.quantity = { _gt: 50 };
    } else if (activeTab === 'low_stock') {
      where.quantity = { _gt: 0, _lte: 50 };
    } else if (activeTab === 'out_of_stock') {
      where.quantity = { _eq: 0 };
    } else if (activeTab === 'expiring') {
      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
      where.bestBeforeDate = { _lte: thirtyDaysFromNow.toISOString().split('T')[0] };
      where.quantity = { _gt: 0 };
    }

    return Object.keys(where).length > 0 ? where : undefined;
  };

  // Fetch inventory from Hasura
  const { data, loading, error, refetch } = useQuery(GET_INVENTORY, {
    variables: {
      limit: 100,
      offset: 0,
      where: buildWhereClause(),
    },
    fetchPolicy: 'cache-and-network',
  });

  // Fetch dropdowns data
  const { data: productsData } = useQuery(GET_PRODUCTS, { variables: { limit: 1000, offset: 0 } });
  const { data: warehousesData } = useQuery(GET_WAREHOUSES, { variables: { limit: 100, offset: 0 } });
  const { data: locationsData } = useQuery(GET_LOCATIONS, { variables: { limit: 1000, offset: 0 } });

  const products = productsData?.Product || [];
  const warehouses = warehousesData?.Warehouse || [];
  const locations = locationsData?.Location || [];

  // GraphQL mutations
  const [createInventory, { loading: creating }] = useMutation(CREATE_INVENTORY, {
    onCompleted: () => {
      message.success('Inventory created successfully!');
      form.resetFields();
      addModal.close();
      refetch();
    },
    onError: (err) => {
      message.error(`Failed to create inventory: ${err.message}`);
    },
  });

  const [updateInventory, { loading: updating }] = useMutation(UPDATE_INVENTORY, {
    onCompleted: () => {
      message.success('Inventory updated successfully!');
      form.resetFields();
      editModal.close();
      refetch();
    },
    onError: (err) => {
      message.error(`Failed to update inventory: ${err.message}`);
    },
  });

  const [deleteInventory] = useMutation(DELETE_INVENTORY, {
    onCompleted: () => {
      message.success('Inventory deleted successfully!');
      refetch();
    },
    onError: (err) => {
      message.error(`Failed to delete inventory: ${err.message}`);
    },
  });

  const inventory = data?.Inventory || [];
  const totalCount = data?.Inventory_aggregate?.aggregate?.count || 0;
  const totalQty = data?.Inventory_aggregate?.aggregate?.sum?.quantity || 0;
  const availableQty = data?.Inventory_aggregate?.aggregate?.sum?.availableQuantity || 0;
  const reservedQty = data?.Inventory_aggregate?.aggregate?.sum?.reservedQuantity || 0;

  const handleSubmit = async (values: any) => {
    try {
      if (selectedInventory) {
        // UPDATE existing inventory
        await updateInventory({
          variables: {
            id: selectedInventory.id,
            set: {
              productId: values.productId,
              warehouseId: values.warehouseId,
              locationId: values.locationId || null,
              lotNumber: values.lotNumber || null,
              batchNumber: values.batchNumber || null,
              serialNumber: values.serialNumber || null,
              bestBeforeDate: values.bestBeforeDate ? values.bestBeforeDate.toISOString() : null,
              quantity: parseInt(values.quantity),
              availableQuantity: parseInt(values.availableQuantity || values.quantity),
              reservedQuantity: parseInt(values.reservedQuantity || 0),
              status: values.status,
              updatedAt: new Date().toISOString(),
            },
          },
        });
      } else {
        // CREATE new inventory
        const uuid = crypto.randomUUID();

        await createInventory({
          variables: {
            object: {
              id: uuid,
              productId: values.productId,
              warehouseId: values.warehouseId,
              locationId: values.locationId || null,
              lotNumber: values.lotNumber || null,
              batchNumber: values.batchNumber || null,
              serialNumber: values.serialNumber || null,
              bestBeforeDate: values.bestBeforeDate ? values.bestBeforeDate.toISOString() : null,
              receivedDate: new Date().toISOString(),
              quantity: parseInt(values.quantity),
              availableQuantity: parseInt(values.availableQuantity || values.quantity),
              reservedQuantity: parseInt(values.reservedQuantity || 0),
              status: values.status,
              updatedAt: new Date().toISOString(),
            },
          },
        });
      }
    } catch (error: any) {
      console.error('Error saving inventory:', error);
      message.error(error?.message || 'Failed to save inventory');
    }
  };

  const handleEdit = (record: any) => {
    setSelectedInventory(record);
    form.setFieldsValue({
      productId: record.productId,
      warehouseId: record.warehouseId,
      locationId: record.locationId,
      lotNumber: record.lotNumber,
      batchNumber: record.batchNumber,
      serialNumber: record.serialNumber,
      bestBeforeDate: record.bestBeforeDate ? dayjs(record.bestBeforeDate) : null,
      quantity: record.quantity,
      availableQuantity: record.availableQuantity,
      reservedQuantity: record.reservedQuantity,
      status: record.status,
    });
    editModal.open();
  };

  const handleDelete = (record: any) => {
    Modal.confirm({
      title: 'Delete Inventory',
      content: `Are you sure you want to delete this inventory record? This action cannot be undone.`,
      okText: 'Delete',
      okType: 'danger',
      onOk: async () => {
        await deleteInventory({ variables: { id: record.id } });
      },
    });
  };

  const handleAddInventory = () => {
    setSelectedInventory(null);
    form.resetFields();
    form.setFieldsValue({ status: 'AVAILABLE' });
    addModal.open();
  };

  const inventoryColumns = [
    {
      title: 'Product SKU',
      dataIndex: ['product', 'sku'],
      key: 'sku',
      width: 120,
      render: (text: string) => <span className="font-medium">{text || '-'}</span>,
    },
    {
      title: 'Product Name',
      dataIndex: ['product', 'name'],
      key: 'name',
      width: 200,
      ellipsis: true,
    },
    {
      title: 'Warehouse',
      dataIndex: ['warehouse', 'name'],
      key: 'warehouse',
      width: 150,
      render: (text: string) => text || '-',
    },
    {
      title: 'Location',
      dataIndex: ['location', 'code'],
      key: 'location',
      width: 100,
      render: (text: string) => text || '-',
    },
    {
      title: 'Quantity',
      dataIndex: 'quantity',
      key: 'quantity',
      width: 100,
      align: 'right' as const,
      render: (qty: number) => <span className="font-semibold">{qty?.toLocaleString() || 0}</span>,
    },
    {
      title: 'Available',
      dataIndex: 'availableQuantity',
      key: 'available',
      width: 100,
      align: 'right' as const,
      render: (qty: number) => <span className="text-green-600">{qty?.toLocaleString() || 0}</span>,
    },
    {
      title: 'Reserved',
      dataIndex: 'reservedQuantity',
      key: 'reserved',
      width: 100,
      align: 'right' as const,
      render: (qty: number) => <span className="text-orange-600">{qty?.toLocaleString() || 0}</span>,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status: string) => {
        const colors: any = {
          AVAILABLE: 'green',
          RESERVED: 'orange',
          QUARANTINE: 'red',
          DAMAGED: 'volcano',
          EXPIRED: 'magenta',
        };
        return <Tag color={colors[status] || 'default'}>{status || 'AVAILABLE'}</Tag>;
      },
    },
    {
      title: 'Lot Number',
      dataIndex: 'lotNumber',
      key: 'lot',
      width: 120,
      render: (text: string) => text || '-',
    },
    {
      title: 'Best Before',
      dataIndex: 'bestBeforeDate',
      key: 'bestBefore',
      width: 120,
      render: (date: string) => {
        if (!date) return '-';
        const isExpiringSoon = new Date(date) < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
        return (
          <span className={isExpiringSoon ? 'text-red-600 font-semibold' : ''}>
            {formatDate(date)}
          </span>
        );
      },
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 180,
      fixed: 'right' as const,
      render: (_: any, record: any) => (
        <Space>
          <Button
            type="link"
            size="small"
            icon={<EyeOutlined />}
            onClick={(e) => {
              e.stopPropagation();
              setSelectedInventory(record);
              setDrawerOpen(true);
            }}
          >
            View
          </Button>
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={(e) => {
              e.stopPropagation();
              handleEdit(record);
            }}
          >
            Edit
          </Button>
          <Button
            type="link"
            size="small"
            danger
            icon={<DeleteOutlined />}
            onClick={(e) => {
              e.stopPropagation();
              handleDelete(record);
            }}
          >
            Delete
          </Button>
        </Space>
      ),
    },
  ];

  if (loading && !data) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
          <Spin size="large" tip="Loading inventory..." />
        </div>
      </MainLayout>
    );
  }

  if (error) {
    return (
      <Alert
          message="Error Loading Inventory"
          description={error.message}
          type="error"
          showIcon
          action={<Button onClick={() => refetch()}>Retry</Button>}
        />
          );
  }

  // Calculate counts for tabs
  const allCount = totalCount;
  const inStockCount = inventory.filter((i: any) => (i.quantity || 0) > 50).length;
  const lowStockCount = inventory.filter((i: any) => (i.quantity || 0) > 0 && (i.quantity || 0) <= 50).length;
  const outOfStockCount = inventory.filter((i: any) => (i.quantity || 0) === 0).length;
  const expiringCount = inventory.filter((i: any) => {
    if (!i.bestBeforeDate) return false;
    const thirtyDaysFromNow = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    return new Date(i.bestBeforeDate) < thirtyDaysFromNow && (i.quantity || 0) > 0;
  }).length;

  const renderTable = (dataSource: any[]) => (
    <>
      <div className="flex gap-4 mb-4">
        <Search
          placeholder="Search by product name, SKU, or lot number..."
          style={{ width: 400 }}
          prefix={<SearchOutlined />}
          onSearch={setSearchText}
          onChange={(e) => e.target.value === '' && setSearchText('')}
        />
      </div>
      <Table
        dataSource={dataSource}
        columns={inventoryColumns}
        rowKey="id"
        scroll={{ x: 1600 }}
        loading={loading}
        pagination={{
          pageSize: 50,
          showSizeChanger: true,
          showTotal: (total) => `Total ${total} items`,
        }}
      />
    </>
  );

  const tabItems = [
    {
      key: 'all',
      label: <span className="flex items-center gap-2"><InboxOutlined />All Items ({allCount})</span>,
      children: renderTable(inventory),
    },
    {
      key: 'in_stock',
      label: <span className="flex items-center gap-2"><CheckCircleOutlined />In Stock ({inStockCount})</span>,
      children: renderTable(inventory.filter((i: any) => (i.quantity || 0) > 50)),
    },
    {
      key: 'low_stock',
      label: <span className="flex items-center gap-2"><WarningOutlined />Low Stock ({lowStockCount})</span>,
      children: renderTable(inventory.filter((i: any) => (i.quantity || 0) > 0 && (i.quantity || 0) <= 50)),
    },
    {
      key: 'out_of_stock',
      label: <span className="flex items-center gap-2"><StopOutlined />Out of Stock ({outOfStockCount})</span>,
      children: renderTable(inventory.filter((i: any) => (i.quantity || 0) === 0)),
    },
    {
      key: 'expiring',
      label: <span className="flex items-center gap-2"><WarningOutlined className="text-red-500" />Expiring Soon ({expiringCount})</span>,
      children: renderTable(inventory.filter((i: any) => {
        if (!i.bestBeforeDate) return false;
        const thirtyDaysFromNow = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
        return new Date(i.bestBeforeDate) < thirtyDaysFromNow && (i.quantity || 0) > 0;
      })),
    },
  ];

  return (
    <MainLayout>
      <div className="p-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              Inventory Management
            </h1>
            <p className="text-gray-600 mt-1">
              Total: {totalQty.toLocaleString()} units | Available: {availableQty.toLocaleString()} | Reserved: {reservedQty.toLocaleString()}
            </p>
          </div>
          <Space>
            <Button icon={<ExportOutlined />}>Export</Button>
            <Button type="primary" icon={<PlusOutlined />} size="large" onClick={handleAddInventory}>
              Add Inventory
            </Button>
          </Space>
        </div>

        {/* Tabs */}
        <Card>
          <Tabs activeKey={activeTab} onChange={setActiveTab} items={tabItems} />
        </Card>

        {/* Details Drawer */}
        <Drawer
          title="Inventory Details"
          placement="right"
          width={600}
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
        >
          {selectedInventory && (
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-lg">{selectedInventory.product?.name}</h3>
                <p className="text-gray-600">SKU: {selectedInventory.product?.sku}</p>
              </div>
              <div className="border-t pt-4 space-y-2">
                <p><strong>Warehouse:</strong> {selectedInventory.warehouse?.name}</p>
                <p><strong>Location:</strong> {selectedInventory.location?.code || 'Not specified'}</p>
                <p><strong>Quantity:</strong> {selectedInventory.quantity?.toLocaleString()}</p>
                <p><strong>Available:</strong> {selectedInventory.availableQuantity?.toLocaleString()}</p>
                <p><strong>Reserved:</strong> {selectedInventory.reservedQuantity?.toLocaleString()}</p>
                <p><strong>Status:</strong> <Tag color={selectedInventory.status === 'AVAILABLE' ? 'green' : 'orange'}>{selectedInventory.status}</Tag></p>
                <p><strong>Lot Number:</strong> {selectedInventory.lotNumber || 'Not specified'}</p>
                <p><strong>Batch Number:</strong> {selectedInventory.batchNumber || 'Not specified'}</p>
                <p><strong>Serial Number:</strong> {selectedInventory.serialNumber || 'Not specified'}</p>
                <p><strong>Best Before Date:</strong> {selectedInventory.bestBeforeDate ? formatDate(selectedInventory.bestBeforeDate) : 'Not specified'}</p>
                <p className="text-xs text-gray-500 mt-4">Received: {formatDate(selectedInventory.receivedDate)}</p>
              </div>
            </div>
          )}
        </Drawer>

        {/* Add/Edit Modal */}
        <Modal
          title={selectedInventory ? 'Edit Inventory' : 'Add Inventory'}
          open={addModal.isOpen || editModal.isOpen}
          onCancel={() => {
            addModal.close();
            editModal.close();
          }}
          onOk={() => form.submit()}
          width={700}
          confirmLoading={creating || updating}
        >
          <Form form={form} layout="vertical" onFinish={handleSubmit}>
            <Form.Item
              label="Product"
              name="productId"
              rules={[{ required: true, message: 'Please select product' }]}
            >
              <Select placeholder="Select product" showSearch filterOption={(input, option: any) =>
                option.children.toLowerCase().includes(input.toLowerCase())
              }>
                {products.map((p: any) => (
                  <Option key={p.id} value={p.id}>
                    {p.name} ({p.sku})
                  </Option>
                ))}
              </Select>
            </Form.Item>

            <div className="grid grid-cols-2 gap-4">
              <Form.Item
                label="Warehouse"
                name="warehouseId"
                rules={[{ required: true, message: 'Please select warehouse' }]}
              >
                <Select placeholder="Select warehouse">
                  {warehouses.map((w: any) => (
                    <Option key={w.id} value={w.id}>
                      {w.name}
                    </Option>
                  ))}
                </Select>
              </Form.Item>

              <Form.Item label="Location" name="locationId">
                <Select placeholder="Select location (optional)">
                  {locations.map((l: any) => (
                    <Option key={l.id} value={l.id}>
                      {l.name} ({l.code})
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <Form.Item
                label="Quantity"
                name="quantity"
                rules={[{ required: true, message: 'Required' }]}
              >
                <Input type="number" placeholder="0" />
              </Form.Item>

              <Form.Item label="Available" name="availableQuantity">
                <Input type="number" placeholder="Auto-set to Quantity" />
              </Form.Item>

              <Form.Item label="Reserved" name="reservedQuantity">
                <Input type="number" placeholder="0" />
              </Form.Item>
            </div>

            <Form.Item
              label="Status"
              name="status"
              rules={[{ required: true, message: 'Please select status' }]}
            >
              <Select placeholder="Select status">
                <Option value="AVAILABLE">Available</Option>
                <Option value="RESERVED">Reserved</Option>
                <Option value="QUARANTINE">Quarantine</Option>
                <Option value="DAMAGED">Damaged</Option>
                <Option value="EXPIRED">Expired</Option>
              </Select>
            </Form.Item>

            <div className="grid grid-cols-2 gap-4">
              <Form.Item label="Lot Number" name="lotNumber">
                <Input placeholder="Enter lot number (optional)" />
              </Form.Item>

              <Form.Item label="Batch Number" name="batchNumber">
                <Input placeholder="Enter batch number (optional)" />
              </Form.Item>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Form.Item label="Serial Number" name="serialNumber">
                <Input placeholder="Enter serial number (optional)" />
              </Form.Item>

              <Form.Item label="Best Before Date" name="bestBeforeDate">
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </div>

            <p className="text-xs text-gray-500">
              Fill in batch tracking fields for perishable or serialized products.
            </p>
          </Form>
        </Modal>
      </div>
      );
}
