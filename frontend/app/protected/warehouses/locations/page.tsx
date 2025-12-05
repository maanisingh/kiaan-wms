'use client';

import React, { useState } from 'react';

import { Table, Button, Input, InputNumber, Select, Tag, Space, Card, Form, Drawer, message, Modal } from 'antd';
import {
  PlusOutlined,
  SearchOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  EnvironmentOutlined,
  HomeOutlined,
  InboxOutlined,
} from '@ant-design/icons';
import { useModal } from '@/hooks/useModal';
import { useQuery, useMutation } from '@apollo/client';
import { GET_LOCATIONS, GET_WAREHOUSES } from '@/lib/graphql/queries';
import { CREATE_LOCATION, UPDATE_LOCATION, DELETE_LOCATION } from '@/lib/graphql/mutations';

const { Search } = Input;
const { Option } = Select;

export default function WarehouseLocationsPage() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<any>(null);
  const [searchText, setSearchText] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<any>(null);
  const addModal = useModal();
  const editModal = useModal();
  const deleteModal = useModal();
  const [form] = Form.useForm();

  // GraphQL query for locations
  const { data, loading, error, refetch } = useQuery(GET_LOCATIONS, {
    variables: {
      limit: 100,
      offset: 0,
    },
  });

  // GraphQL query for warehouses (for dropdown)
  const { data: warehousesData } = useQuery(GET_WAREHOUSES, {
    variables: {
      limit: 100,
      offset: 0,
    },
  });

  // GraphQL mutations
  const [createLocation, { loading: creating }] = useMutation(CREATE_LOCATION, {
    onCompleted: () => {
      message.success('Location created successfully!');
      form.resetFields();
      addModal.close();
      refetch();
    },
    onError: (err) => {
      message.error(`Failed to create location: ${err.message}`);
    },
  });

  const [updateLocation, { loading: updating }] = useMutation(UPDATE_LOCATION, {
    onCompleted: () => {
      message.success('Location updated successfully!');
      form.resetFields();
      editModal.close();
      refetch();
    },
    onError: (err) => {
      message.error(`Failed to update location: ${err.message}`);
    },
  });

  const [deleteLocation] = useMutation(DELETE_LOCATION, {
    onCompleted: () => {
      message.success('Location deleted successfully!');
      refetch();
    },
    onError: (err) => {
      if (err.message.includes('foreign key') || err.message.includes('constraint')) {
        message.error('Cannot delete location: Please remove all inventory from this location first.');
      } else {
        message.error(`Failed to delete location: ${err.message}`);
      }
    },
  });

  // Get data from GraphQL
  const locations = data?.Location || [];
  const warehouses = warehousesData?.Warehouse || [];

  // Filter locations by search text
  const filteredLocations = locations.filter((l: any) => {
    const matchesSearch = !searchText ||
      l.name?.toLowerCase().includes(searchText.toLowerCase()) ||
      l.code?.toLowerCase().includes(searchText.toLowerCase()) ||
      l.warehouse?.name?.toLowerCase().includes(searchText.toLowerCase());
    return matchesSearch;
  });

  const handleSubmit = async (values: any) => {
    try {
      if (selectedLocation) {
        // UPDATE existing location
        await updateLocation({
          variables: {
            id: selectedLocation.id,
            set: {
              name: values.name,
              warehouseId: values.warehouseId,
              aisle: values.aisle || null,
              rack: values.rack || null,
              shelf: values.shelf || null,
              bin: values.bin || null,
              locationType: values.locationType || 'PICK',
              pickSequence: values.pickSequence || null,
              maxWeight: values.maxWeight || null,
              isHeatSensitive: values.isHeatSensitive || false,
              updatedAt: new Date().toISOString(),
            },
          },
        });
      } else {
        // CREATE new location
        const uuid = crypto.randomUUID();
        const locationCode = `LOC-${Date.now().toString().slice(-6)}`;

        await createLocation({
          variables: {
            object: {
              id: uuid,
              code: locationCode,
              name: values.name,
              warehouseId: values.warehouseId,
              aisle: values.aisle || null,
              rack: values.rack || null,
              shelf: values.shelf || null,
              bin: values.bin || null,
              locationType: values.locationType || 'PICK',
              pickSequence: values.pickSequence || null,
              maxWeight: values.maxWeight || null,
              isHeatSensitive: values.isHeatSensitive || false,
              updatedAt: new Date().toISOString(),
            },
          },
        });
      }
    } catch (error: any) {
      console.error('Error saving location:', error);
      message.error(error?.message || 'Failed to save location');
    }
  };

  const handleEdit = (record: any) => {
    setSelectedLocation(record);
    form.setFieldsValue({
      name: record.name,
      warehouseId: record.warehouseId,
      aisle: record.aisle,
      rack: record.rack,
      shelf: record.shelf,
      bin: record.bin,
      locationType: record.locationType || 'PICK',
      pickSequence: record.pickSequence,
      maxWeight: record.maxWeight,
      isHeatSensitive: record.isHeatSensitive || false,
    });
    editModal.open();
  };

  const handleDelete = (record: any) => {
    setDeleteTarget(record);
    deleteModal.open();
  };

  const confirmDelete = async () => {
    if (deleteTarget) {
      await deleteLocation({ variables: { id: deleteTarget.id } });
      deleteModal.close();
      setDeleteTarget(null);
    }
  };

  const handleAddLocation = () => {
    setSelectedLocation(null);
    form.resetFields();
    addModal.open();
  };

  const columns = [
    {
      title: 'Location Code',
      dataIndex: 'code',
      key: 'code',
      width: 130,
      render: (text: string) => (
        <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">{text}</span>
      ),
    },
    {
      title: 'Location Name',
      dataIndex: 'name',
      key: 'name',
      width: 200,
      render: (text: string) => (
        <div className="flex items-center gap-2">
          <EnvironmentOutlined className="text-green-500" />
          <span className="font-medium">{text}</span>
        </div>
      ),
    },
    {
      title: 'Warehouse',
      dataIndex: 'warehouse',
      key: 'warehouse',
      width: 180,
      render: (warehouse: any) => (
        <div className="flex items-center gap-2">
          <HomeOutlined className="text-blue-500" />
          <span>{warehouse?.name || '-'}</span>
        </div>
      ),
    },
    {
      title: 'Aisle',
      dataIndex: 'aisle',
      key: 'aisle',
      width: 100,
      render: (text: string) => text || <span className="text-gray-400">-</span>,
    },
    {
      title: 'Rack',
      dataIndex: 'rack',
      key: 'rack',
      width: 100,
      render: (text: string) => text || <span className="text-gray-400">-</span>,
    },
    {
      title: 'Shelf',
      dataIndex: 'shelf',
      key: 'shelf',
      width: 100,
      render: (text: string) => text || <span className="text-gray-400">-</span>,
    },
    {
      title: 'Bin',
      dataIndex: 'bin',
      key: 'bin',
      width: 100,
      render: (text: string) => text || <span className="text-gray-400">-</span>,
    },
    {
      title: 'Type',
      dataIndex: 'locationType',
      key: 'locationType',
      width: 100,
      render: (type: string) => {
        const colors: any = { PICK: 'green', BULK: 'blue', BULK_LW: 'orange' };
        return <Tag color={colors[type] || 'green'}>{type || 'PICK'}</Tag>;
      },
    },
    {
      title: 'Pick Seq',
      dataIndex: 'pickSequence',
      key: 'pickSequence',
      width: 90,
      render: (seq: number) => seq ? <Tag color="purple">{seq}</Tag> : <span className="text-gray-400">-</span>,
    },
    {
      title: 'Max Weight',
      dataIndex: 'maxWeight',
      key: 'maxWeight',
      width: 100,
      render: (weight: number) => weight ? `${weight}kg` : <span className="text-gray-400">-</span>,
    },
    {
      title: 'Heat',
      dataIndex: 'isHeatSensitive',
      key: 'isHeatSensitive',
      width: 80,
      render: (isHot: boolean) => isHot ? <Tag color="red">Hot</Tag> : <Tag color="default">Normal</Tag>,
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 150,
      fixed: 'right' as const,
      render: (_: any, record: any) => (
        <Space size="small">
          <Button
            type="text"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => {
              setSelectedLocation(record);
              setDrawerOpen(true);
            }}
          />
          <Button type="text" size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)} />
          <Button type="text" size="small" danger icon={<DeleteOutlined />} onClick={() => handleDelete(record)} />
        </Space>
      ),
    },
  ];

  // Stats
  const totalLocations = filteredLocations.length;
  const locationsWithAisle = filteredLocations.filter((l: any) => l.aisle).length;
  const uniqueWarehouses = new Set(filteredLocations.map((l: any) => l.warehouseId)).size;

  return (
    <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 bg-gradient-to-r from-green-600 to-teal-600 bg-clip-text text-transparent">
              Warehouse Locations
            </h1>
            <p className="text-gray-600 mt-1">Manage storage locations across warehouses</p>
          </div>
          <Button type="primary" icon={<PlusOutlined />} size="large" onClick={handleAddLocation}>
            Add Location
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <div className="text-center">
              <p className="text-gray-500 text-sm">Total Locations</p>
              <p className="text-3xl font-bold text-green-600">{totalLocations}</p>
            </div>
          </Card>
          <Card>
            <div className="text-center">
              <p className="text-gray-500 text-sm">With Aisle Info</p>
              <p className="text-3xl font-bold text-teal-600">{locationsWithAisle}</p>
            </div>
          </Card>
          <Card>
            <div className="text-center">
              <p className="text-gray-500 text-sm">Warehouses</p>
              <p className="text-3xl font-bold text-blue-600">{uniqueWarehouses}</p>
            </div>
          </Card>
        </div>

        {/* Table */}
        <Card className="shadow-sm">
          <div className="flex gap-4 flex-wrap mb-4">
            <Search
              placeholder="Search by location, code, or warehouse..."
              allowClear
              style={{ width: 350 }}
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
            />
          </div>
          <Table
            columns={columns}
            dataSource={filteredLocations}
            rowKey="id"
            loading={loading}
            scroll={{ x: 1200 }}
            pagination={{
              total: filteredLocations.length,
              pageSize: 10,
              showSizeChanger: true,
              showTotal: (total) => `Total ${total} locations`,
            }}
          />
        </Card>

        {/* Details Drawer */}
        <Drawer
          title="Location Details"
          placement="right"
          width={600}
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
        >
          {selectedLocation && (
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-lg">{selectedLocation.name}</h3>
                <p className="text-gray-600">{selectedLocation.warehouse?.name}</p>
              </div>
              <div className="border-t pt-4 space-y-2">
                <p><strong>Location Code:</strong> <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">{selectedLocation.code}</span></p>
                <p><strong>Warehouse:</strong> {selectedLocation.warehouse?.name} ({selectedLocation.warehouse?.code})</p>
                <p><strong>Aisle:</strong> {selectedLocation.aisle || 'Not specified'}</p>
                <p><strong>Rack:</strong> {selectedLocation.rack || 'Not specified'}</p>
                <p><strong>Shelf:</strong> {selectedLocation.shelf || 'Not specified'}</p>
                <p><strong>Bin:</strong> {selectedLocation.bin || 'Not specified'}</p>
                <p className="text-xs text-gray-500 mt-4">Created: {new Date(selectedLocation.createdAt).toLocaleDateString()}</p>
              </div>
            </div>
          )}
        </Drawer>

        {/* Add Modal */}
        <Modal
          title="Add Location"
          open={addModal.isOpen}
          onCancel={addModal.close}
          onOk={() => form.submit()}
          width={600}
          confirmLoading={creating}
        >
          <Form form={form} layout="vertical" onFinish={handleSubmit}>
            <Form.Item
              label="Location Name"
              name="name"
              rules={[{ required: true, message: 'Please enter location name' }]}
            >
              <Input placeholder="Enter location name (e.g., A1-R2-S3)" />
            </Form.Item>
            <Form.Item
              label="Warehouse"
              name="warehouseId"
              rules={[{ required: true, message: 'Please select warehouse' }]}
            >
              <Select placeholder="Select warehouse">
                {warehouses.map((w: any) => (
                  <Option key={w.id} value={w.id}>
                    {w.name} ({w.code})
                  </Option>
                ))}
              </Select>
            </Form.Item>
            <div className="grid grid-cols-2 gap-4">
              <Form.Item label="Aisle" name="aisle">
                <Input placeholder="e.g., A1" />
              </Form.Item>
              <Form.Item label="Rack" name="rack">
                <Input placeholder="e.g., R2" />
              </Form.Item>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Form.Item label="Shelf" name="shelf">
                <Input placeholder="e.g., S3" />
              </Form.Item>
              <Form.Item label="Bin" name="bin">
                <Input placeholder="e.g., B4" />
              </Form.Item>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Form.Item label="Location Type" name="locationType" initialValue="PICK">
                <Select>
                  <Option value="PICK">PICK - Active Picking</Option>
                  <Option value="BULK">BULK - Bulk Storage</Option>
                  <Option value="BULK_LW">BULK_LW - Bulk Light Weight (200kg max)</Option>
                </Select>
              </Form.Item>
              <Form.Item label="Pick Sequence" name="pickSequence" tooltip="Order for picking routes (lower = pick first)">
                <InputNumber min={1} placeholder="e.g., 1" style={{ width: '100%' }} />
              </Form.Item>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Form.Item label="Max Weight (kg)" name="maxWeight" tooltip="Maximum weight capacity">
                <InputNumber min={0} step={0.1} placeholder="e.g., 200" style={{ width: '100%' }} />
              </Form.Item>
              <Form.Item label="Heat Sensitive Location" name="isHeatSensitive" initialValue={false} tooltip="Near heat sources (roof, hot areas)">
                <Select>
                  <Option value={false}>No - Normal</Option>
                  <Option value={true}>Yes - Hot Location</Option>
                </Select>
              </Form.Item>
            </div>

            <p className="text-xs text-gray-500">
              Location code will be auto-generated (e.g., LOC-123456).
              Aisle, Rack, Shelf, and Bin are optional fields for detailed organization.
            </p>
          </Form>
        </Modal>

        {/* Edit Modal */}
        <Modal
          title="Edit Location"
          open={editModal.isOpen}
          onCancel={editModal.close}
          onOk={() => form.submit()}
          width={600}
          confirmLoading={updating}
        >
          <Form form={form} layout="vertical" onFinish={handleSubmit}>
            <Form.Item
              label="Location Name"
              name="name"
              rules={[{ required: true, message: 'Please enter location name' }]}
            >
              <Input placeholder="Enter location name" />
            </Form.Item>
            <Form.Item
              label="Warehouse"
              name="warehouseId"
              rules={[{ required: true, message: 'Please select warehouse' }]}
            >
              <Select placeholder="Select warehouse">
                {warehouses.map((w: any) => (
                  <Option key={w.id} value={w.id}>
                    {w.name} ({w.code})
                  </Option>
                ))}
              </Select>
            </Form.Item>
            <div className="grid grid-cols-2 gap-4">
              <Form.Item label="Aisle" name="aisle">
                <Input placeholder="e.g., A1" />
              </Form.Item>
              <Form.Item label="Rack" name="rack">
                <Input placeholder="e.g., R2" />
              </Form.Item>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Form.Item label="Shelf" name="shelf">
                <Input placeholder="e.g., S3" />
              </Form.Item>
              <Form.Item label="Bin" name="bin">
                <Input placeholder="e.g., B4" />
              </Form.Item>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Form.Item label="Location Type" name="locationType">
                <Select>
                  <Option value="PICK">PICK - Active Picking</Option>
                  <Option value="BULK">BULK - Bulk Storage</Option>
                  <Option value="BULK_LW">BULK_LW - Bulk Light Weight (200kg max)</Option>
                </Select>
              </Form.Item>
              <Form.Item label="Pick Sequence" name="pickSequence" tooltip="Order for picking routes (lower = pick first)">
                <InputNumber min={1} placeholder="e.g., 1" style={{ width: '100%' }} />
              </Form.Item>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Form.Item label="Max Weight (kg)" name="maxWeight" tooltip="Maximum weight capacity">
                <InputNumber min={0} step={0.1} placeholder="e.g., 200" style={{ width: '100%' }} />
              </Form.Item>
              <Form.Item label="Heat Sensitive Location" name="isHeatSensitive" tooltip="Near heat sources (roof, hot areas)">
                <Select>
                  <Option value={false}>No - Normal</Option>
                  <Option value={true}>Yes - Hot Location</Option>
                </Select>
              </Form.Item>
            </div>
          </Form>
        </Modal>

        {/* Delete Confirmation Modal */}
        <Modal
          title="Delete Location"
          open={deleteModal.isOpen}
          onCancel={() => {
            deleteModal.close();
            setDeleteTarget(null);
          }}
          onOk={confirmDelete}
          okText="Delete"
          okType="danger"
          okButtonProps={{ danger: true }}
        >
          <p>Are you sure you want to delete location "{deleteTarget?.name}"?</p>
          <p className="text-gray-500 text-sm">This action cannot be undone.</p>
        </Modal>
      </div>
      );
}
