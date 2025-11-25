'use client';

import React, { useState } from 'react';
import { useQuery, useMutation } from '@apollo/client';

import {
  Table, Button, Tag, Card, Space, Statistic, Row, Col, Modal, Form,
  Input, Select, InputNumber, Drawer, Tabs, Switch, App
} from 'antd';
import {
  PlusOutlined, EditOutlined, DeleteOutlined, EyeOutlined,
  ClockCircleOutlined, SyncOutlined, CheckCircleOutlined, InboxOutlined,
  MinusCircleOutlined, SearchOutlined
} from '@ant-design/icons';
import { GET_PICK_LISTS, GET_SALES_ORDERS, GET_PRODUCTS, GET_LOCATIONS } from '@/lib/graphql/queries';
import {
  CREATE_PICK_LIST, UPDATE_PICK_LIST, DELETE_PICK_LIST,
  CREATE_PICK_ITEM, COMPLETE_PICK_LIST
} from '@/lib/graphql/mutations';
import { useModal } from '@/hooks/useModal';
import Link from 'next/link';

const { Option } = Select;
const { Search } = Input;

export default function PickListsPage() {
  const { modal, message } = App.useApp(); // Use App context for modal and message
  const [selectedPickList, setSelectedPickList] = useState<any>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const addModal = useModal();
  const editModal = useModal();
  const [form] = Form.useForm();

  // Query pick lists
  const { data, loading, refetch } = useQuery(GET_PICK_LISTS, {
    variables: {
      limit: 100,
      offset: 0,
    },
  });

  // Query sales orders for dropdown
  const { data: ordersData } = useQuery(GET_SALES_ORDERS, {
    variables: {
      limit: 100,
      offset: 0,
      where: { status: { _eq: 'PENDING' } },
    },
  });

  // Query products for pick items
  const { data: productsData } = useQuery(GET_PRODUCTS, {
    variables: {
      limit: 1000,
      offset: 0,
      where: { type: { _eq: 'SIMPLE' } },
    },
  });

  // Query locations for pick items
  const { data: locationsData } = useQuery(GET_LOCATIONS, {
    variables: {
      limit: 1000,
      offset: 0,
    },
  });

  const pickLists = data?.PickList || [];
  const salesOrders = ordersData?.SalesOrder || [];
  const products = productsData?.Product || [];
  const locations = locationsData?.Location || [];

  // GraphQL mutations
  const [createPickList, { loading: creating }] = useMutation(CREATE_PICK_LIST);
  const [updatePickList, { loading: updating }] = useMutation(UPDATE_PICK_LIST);
  const [deletePickList] = useMutation(DELETE_PICK_LIST);
  const [createPickItem] = useMutation(CREATE_PICK_ITEM);
  const [completePickList] = useMutation(COMPLETE_PICK_LIST);

  const handleSubmit = async (values: any) => {
    try {
      if (selectedPickList) {
        // UPDATE existing pick list
        await updatePickList({
          variables: {
            id: selectedPickList.id,
            set: {
              type: values.type,
              orderId: values.orderId || null,
              status: values.status,
              priority: values.priority,
              enforceSingleBBDate: values.enforceSingleBBDate || false,
              updatedAt: new Date().toISOString(),
            },
          },
        });

        message.success('Pick list updated successfully!');
        editModal.close();
      } else {
        // CREATE new pick list
        const pickListId = crypto.randomUUID();
        const pickListNumber = `PICK-${Date.now().toString().slice(-8)}`;

        // 1. Create pick list
        await createPickList({
          variables: {
            object: {
              id: pickListId,
              pickListNumber: pickListNumber,
              type: values.type,
              orderId: values.orderId || null,
              assignedUserId: null, // TODO: Add user assignment
              status: 'PENDING',
              priority: values.priority,
              enforceSingleBBDate: values.enforceSingleBBDate || false,
              updatedAt: new Date().toISOString(),
            },
          },
        });

        // 2. Create pick items
        for (let i = 0; i < (values.pickItems || []).length; i++) {
          const item = values.pickItems[i];
          await createPickItem({
            variables: {
              object: {
                id: crypto.randomUUID(),
                pickListId: pickListId,
                productId: item.productId,
                locationId: item.locationId || null,
                lotNumber: item.lotNumber || null,
                quantityRequired: parseInt(item.quantityRequired),
                quantityPicked: 0,
                status: 'PENDING',
                sequenceNumber: i + 1,
                updatedAt: new Date().toISOString(),
              },
            },
          });
        }

        message.success('Pick list created successfully!');
        addModal.close();
      }

      form.resetFields();
      refetch();
    } catch (error: any) {
      console.error('Error saving pick list:', error);
      message.error(error?.message || 'Failed to save pick list');
    }
  };

  const handleEdit = (record: any) => {
    setSelectedPickList(record);
    form.setFieldsValue({
      type: record.type,
      orderId: record.orderId,
      status: record.status,
      priority: record.priority,
      enforceSingleBBDate: record.enforceSingleBBDate,
    });
    editModal.open();
  };

  const handleDelete = (record: any) => {
    modal.confirm({
      title: 'Delete Pick List',
      content: `Are you sure you want to delete pick list "${record.pickListNumber}"? This will also delete all pick items.`,
      okText: 'Delete',
      okType: 'danger',
      onOk: async () => {
        await deletePickList({ variables: { id: record.id } });
        message.success('Pick list deleted successfully!');
        refetch();
      },
    });
  };

  const handleComplete = (record: any) => {
    modal.confirm({
      title: 'Complete Pick List',
      content: `Mark pick list "${record.pickListNumber}" as completed?`,
      okText: 'Complete',
      okType: 'primary',
      onOk: async () => {
        await completePickList({
          variables: {
            id: record.id,
            completedAt: new Date().toISOString(),
          },
        });
        message.success('Pick list completed!');
        refetch();
      },
    });
  };

  const handleAddPickList = () => {
    setSelectedPickList(null);
    form.resetFields();
    form.setFieldsValue({
      priority: 'MEDIUM',
      type: 'SINGLE',
      enforceSingleBBDate: false,
      pickItems: [{}],
    });
    addModal.open();
  };

  const columns = [
    {
      title: 'Pick List #',
      dataIndex: 'pickListNumber',
      key: 'pickListNumber',
      width: 140,
      render: (text: string, record: any) => (
        <Link href={`/picking/${record.id}`}>
          <span className="font-medium text-blue-600 hover:underline cursor-pointer">{text}</span>
        </Link>
      ),
    },
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      width: 100,
      render: (type: string) => {
        const colors: any = {
          SINGLE: 'blue',
          BATCH: 'green',
          WAVE: 'purple',
          ZONE: 'orange',
        };
        return <Tag color={colors[type] || 'default'}>{type}</Tag>;
      },
    },
    {
      title: 'Order #',
      dataIndex: 'SalesOrder',
      key: 'order',
      width: 130,
      render: (order: any) => order?.orderNumber || <span className="text-gray-400">-</span>,
    },
    {
      title: 'Customer',
      key: 'customer',
      width: 150,
      render: (_: any, record: any) => record.SalesOrder?.customer?.name || <span className="text-gray-400">-</span>,
    },
    {
      title: 'Items',
      key: 'items',
      width: 100,
      render: (_: any, record: any) => (
        <Tag color="purple">{record.pickItems?.length || 0}</Tag>
      ),
    },
    {
      title: 'Picked',
      key: 'picked',
      width: 100,
      render: (_: any, record: any) => {
        const total = record.pickItems?.reduce((sum: number, item: any) => sum + item.quantityRequired, 0) || 0;
        const picked = record.pickItems?.reduce((sum: number, item: any) => sum + item.quantityPicked, 0) || 0;
        const percent = total > 0 ? Math.round((picked / total) * 100) : 0;
        return `${picked}/${total} (${percent}%)`;
      },
    },
    {
      title: 'Priority',
      dataIndex: 'priority',
      key: 'priority',
      width: 100,
      render: (priority: string) => {
        const colors: any = { HIGH: 'red', MEDIUM: 'orange', LOW: 'blue' };
        return <Tag color={colors[priority] || 'default'}>{priority}</Tag>;
      },
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status: string) => {
        const colors: any = {
          PENDING: 'orange',
          IN_PROGRESS: 'blue',
          COMPLETED: 'green',
          CANCELLED: 'red',
        };
        return <Tag color={colors[status] || 'default'}>{status.replace('_', ' ')}</Tag>;
      },
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 250,
      fixed: 'right' as const,
      render: (_: any, record: any) => (
        <Space>
          <Button
            type="link"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => {
              setSelectedPickList(record);
              setDrawerOpen(true);
            }}
          >
            View
          </Button>
          {record.status === 'PENDING' && (
            <>
              <Button type="link" size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)}>
                Edit
              </Button>
              <Button
                type="link"
                size="small"
                onClick={() => handleComplete(record)}
                style={{ color: '#52c41a' }}
              >
                Complete
              </Button>
            </>
          )}
          <Button type="link" size="small" danger icon={<DeleteOutlined />} onClick={() => handleDelete(record)}>
            Delete
          </Button>
        </Space>
      ),
    },
  ];

  // Filter by search and tab
  const filteredPickLists = pickLists.filter((pl: any) => {
    const matchesSearch = !searchText ||
      pl.pickListNumber?.toLowerCase().includes(searchText.toLowerCase()) ||
      pl.SalesOrder?.orderNumber?.toLowerCase().includes(searchText.toLowerCase()) ||
      pl.SalesOrder?.customer?.name?.toLowerCase().includes(searchText.toLowerCase());

    const matchesTab = activeTab === 'all' || pl.status === activeTab.toUpperCase();

    return matchesSearch && matchesTab;
  });

  // Stats
  const totalPickLists = pickLists.length;
  const pendingPickLists = pickLists.filter((pl: any) => pl.status === 'PENDING').length;
  const inProgressPickLists = pickLists.filter((pl: any) => pl.status === 'IN_PROGRESS').length;
  const completedPickLists = pickLists.filter((pl: any) => pl.status === 'COMPLETED').length;

  const renderTable = () => (
    <>
      <div className="flex gap-4 mb-4">
        <Search
          placeholder="Search by pick list #, order #, or customer..."
          allowClear
          style={{ width: 400 }}
          prefix={<SearchOutlined />}
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
        />
      </div>
      <Table
        columns={columns}
        dataSource={filteredPickLists}
        rowKey="id"
        loading={loading}
        scroll={{ x: 1400 }}
        pagination={{ pageSize: 20, showSizeChanger: true }}
        expandable={{
          expandedRowRender: (record: any) => (
            <div className="p-4 bg-gray-50">
              <h4 className="font-semibold mb-2">Pick Items ({record.pickItems?.length || 0}):</h4>
              <ul className="list-disc list-inside">
                {record.pickItems?.map((item: any, idx: number) => (
                  <li key={item.id}>
                    #{idx + 1}: {item.product?.name || 'Unknown'} ({item.product?.sku || '-'}) -
                    Required: {item.quantityRequired}, Picked: {item.quantityPicked} -
                    Location: {item.location?.code || 'Not assigned'} -
                    Status: <Tag color={item.status === 'PICKED' ? 'green' : 'orange'}>{item.status}</Tag>
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
      label: <span className="flex items-center gap-2"><InboxOutlined />All ({totalPickLists})</span>,
      children: renderTable(),
    },
    {
      key: 'pending',
      label: <span className="flex items-center gap-2"><ClockCircleOutlined />Pending ({pendingPickLists})</span>,
      children: renderTable(),
    },
    {
      key: 'in_progress',
      label: <span className="flex items-center gap-2"><SyncOutlined />In Progress ({inProgressPickLists})</span>,
      children: renderTable(),
    },
    {
      key: 'completed',
      label: <span className="flex items-center gap-2"><CheckCircleOutlined />Completed ({completedPickLists})</span>,
      children: renderTable(),
    },
  ];

  return (
    <div className="p-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              Pick Lists
            </h1>
            <p className="text-gray-600 mt-1">Manage warehouse picking operations</p>
          </div>
          <Button type="primary" icon={<PlusOutlined />} size="large" onClick={handleAddPickList}>
            Create Pick List
          </Button>
        </div>

        {/* Stats */}
        <Row gutter={16} className="mb-6">
          <Col span={6}>
            <Card>
              <Statistic
                title="Total Pick Lists"
                value={totalPickLists}
                prefix={<InboxOutlined />}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="Pending"
                value={pendingPickLists}
                valueStyle={{ color: '#faad14' }}
                prefix={<ClockCircleOutlined />}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="In Progress"
                value={inProgressPickLists}
                valueStyle={{ color: '#1890ff' }}
                prefix={<SyncOutlined />}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="Completed"
                value={completedPickLists}
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
          title="Pick List Details"
          placement="right"
          width={700}
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
        >
          {selectedPickList && (
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-lg">{selectedPickList.pickListNumber}</h3>
                <p className="text-gray-600">
                  Order: {selectedPickList.SalesOrder?.orderNumber || 'Not assigned'}
                </p>
              </div>
              <div className="border-t pt-4 space-y-2">
                <p><strong>Type:</strong> <Tag color="blue">{selectedPickList.type}</Tag></p>
                <p><strong>Status:</strong> <Tag color="green">{selectedPickList.status}</Tag></p>
                <p><strong>Priority:</strong> <Tag color="orange">{selectedPickList.priority}</Tag></p>
                <p><strong>Enforce Single BB Date:</strong> {selectedPickList.enforceSingleBBDate ? 'Yes' : 'No'}</p>
                <p><strong>Customer:</strong> {selectedPickList.SalesOrder?.customer?.name || 'N/A'}</p>
                <p><strong>Assigned To:</strong> {selectedPickList.User?.name || 'Unassigned'}</p>
                <div className="border-t pt-4">
                  <p className="font-semibold mb-2">Pick Items ({selectedPickList.pickItems?.length}):</p>
                  <ul className="list-disc list-inside space-y-1">
                    {selectedPickList.pickItems?.map((item: any, idx: number) => (
                      <li key={item.id} className="text-sm">
                        #{idx + 1}: {item.product?.name} ({item.product?.sku}) -
                        Qty: {item.quantityPicked}/{item.quantityRequired} -
                        Loc: {item.location?.code || 'N/A'}
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
          title={selectedPickList ? 'Edit Pick List' : 'Create Pick List'}
          open={addModal.isOpen || editModal.isOpen}
          onCancel={() => {
            addModal.close();
            editModal.close();
          }}
          onOk={() => form.submit()}
          width={900}
          confirmLoading={creating || updating}
        >
          <Form form={form} layout="vertical" onFinish={handleSubmit}>
            <div className="grid grid-cols-2 gap-4">
              <Form.Item
                label="Pick Type"
                name="type"
                rules={[{ required: true, message: 'Please select type' }]}
              >
                <Select placeholder="Select pick type">
                  <Option value="SINGLE">Single Order</Option>
                  <Option value="BATCH">Batch Picking</Option>
                  <Option value="WAVE">Wave Picking</Option>
                  <Option value="ZONE">Zone Picking</Option>
                </Select>
              </Form.Item>

              <Form.Item
                label="Priority"
                name="priority"
                rules={[{ required: true, message: 'Please select priority' }]}
              >
                <Select placeholder="Select priority">
                  <Option value="HIGH">High</Option>
                  <Option value="MEDIUM">Medium</Option>
                  <Option value="LOW">Low</Option>
                </Select>
              </Form.Item>
            </div>

            <Form.Item label="Sales Order (Optional)" name="orderId">
              <Select
                placeholder="Select sales order"
                showSearch
                allowClear
                optionFilterProp="label"
                options={salesOrders.map((order: any) => ({
                  value: order.id,
                  label: `${order.orderNumber} - ${order.customer?.name || 'Unknown'}`,
                }))}
              />
            </Form.Item>

            {selectedPickList && (
              <Form.Item label="Status" name="status">
                <Select placeholder="Select status">
                  <Option value="PENDING">Pending</Option>
                  <Option value="IN_PROGRESS">In Progress</Option>
                  <Option value="COMPLETED">Completed</Option>
                  <Option value="CANCELLED">Cancelled</Option>
                </Select>
              </Form.Item>
            )}

            <Form.Item label="Enforce Single Best-Before Date" name="enforceSingleBBDate" valuePropName="checked">
              <Switch />
            </Form.Item>

            {!selectedPickList && (
              <div className="border-t pt-4 mt-4">
                <h4 className="font-semibold mb-3">Pick Items</h4>
                <Form.List name="pickItems">
                  {(fields, { add, remove }) => (
                    <>
                      {fields.map(({ key, name, ...restField }) => (
                        <div key={key} className="grid grid-cols-12 gap-2 mb-2">
                          <Form.Item
                            {...restField}
                            name={[name, 'productId']}
                            rules={[{ required: true, message: 'Select product' }]}
                            className="col-span-5"
                          >
                            <Select
                              placeholder="Select product"
                              showSearch
                              optionFilterProp="label"
                              options={products.map((p: any) => ({
                                value: p.id,
                                label: `${p.name} (${p.sku})`,
                              }))}
                            />
                          </Form.Item>
                          <Form.Item
                            {...restField}
                            name={[name, 'locationId']}
                            className="col-span-3"
                          >
                            <Select
                              placeholder="Location (optional)"
                              showSearch
                              allowClear
                              optionFilterProp="label"
                              options={locations.map((loc: any) => ({
                                value: loc.id,
                                label: `${loc.code} - ${loc.name}`,
                              }))}
                            />
                          </Form.Item>
                          <Form.Item
                            {...restField}
                            name={[name, 'quantityRequired']}
                            rules={[{ required: true, message: 'Qty' }]}
                            className="col-span-2"
                          >
                            <InputNumber placeholder="Qty" min={1} style={{ width: '100%' }} />
                          </Form.Item>
                          <Form.Item
                            {...restField}
                            name={[name, 'lotNumber']}
                            className="col-span-2"
                          >
                            <Input placeholder="Lot# (opt)" />
                          </Form.Item>
                          <Button
                            type="link"
                            danger
                            icon={<MinusCircleOutlined />}
                            onClick={() => remove(name)}
                            className="col-span-1"
                          />
                        </div>
                      ))}
                      <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />}>
                        Add Pick Item
                      </Button>
                    </>
                  )}
                </Form.List>
              </div>
            )}

            <p className="text-xs text-gray-500 mt-4">
              A pick list groups items to be picked from warehouse locations for order fulfillment.
            </p>
          </Form>
        </Modal>
      </div>
      );
}
