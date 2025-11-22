'use client';

import React, { useState } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import { MainLayout } from '@/components/layout/MainLayout';
import {
  Table, Button, Tag, Card, Space, Statistic, Row, Col, Modal, Form,
  Input, Select, message, Drawer
} from 'antd';
import {
  PlusOutlined, EditOutlined, DeleteOutlined, EyeOutlined,
  EnvironmentOutlined, InboxOutlined, HomeOutlined, SearchOutlined
} from '@ant-design/icons';
import { GET_ZONES, GET_WAREHOUSES } from '@/lib/graphql/queries';
import { CREATE_ZONE, UPDATE_ZONE, DELETE_ZONE } from '@/lib/graphql/mutations';
import { useModal } from '@/hooks/useModal';

const { Option } = Select;
const { Search } = Input;

export default function WarehouseZonesPage() {
  const [selectedZone, setSelectedZone] = useState<any>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [searchText, setSearchText] = useState('');
  const addModal = useModal();
  const editModal = useModal();
  const [form] = Form.useForm();

  // Query zones
  const { data, loading, refetch } = useQuery(GET_ZONES, {
    variables: {
      limit: 100,
      offset: 0,
    },
  });

  // Query warehouses for dropdown
  const { data: warehousesData } = useQuery(GET_WAREHOUSES, {
    variables: {
      limit: 100,
      offset: 0,
    },
  });

  const zones = data?.Zone || [];
  const warehouses = warehousesData?.Warehouse || [];

  // GraphQL mutations
  const [createZone, { loading: creating }] = useMutation(CREATE_ZONE, {
    onCompleted: () => {
      message.success('Zone created successfully!');
      form.resetFields();
      addModal.close();
      refetch();
    },
    onError: (err) => {
      message.error(`Failed to create zone: ${err.message}`);
    },
  });

  const [updateZone, { loading: updating }] = useMutation(UPDATE_ZONE, {
    onCompleted: () => {
      message.success('Zone updated successfully!');
      form.resetFields();
      editModal.close();
      refetch();
    },
    onError: (err) => {
      message.error(`Failed to update zone: ${err.message}`);
    },
  });

  const [deleteZone] = useMutation(DELETE_ZONE, {
    onCompleted: () => {
      message.success('Zone deleted successfully!');
      refetch();
    },
    onError: (err) => {
      message.error(`Failed to delete zone: ${err.message}`);
    },
  });

  // Filter zones by search text
  const filteredZones = zones.filter((z: any) => {
    const matchesSearch = !searchText ||
      z.name?.toLowerCase().includes(searchText.toLowerCase()) ||
      z.code?.toLowerCase().includes(searchText.toLowerCase()) ||
      z.warehouse?.name?.toLowerCase().includes(searchText.toLowerCase());
    return matchesSearch;
  });

  const handleSubmit = async (values: any) => {
    try {
      if (selectedZone) {
        // UPDATE existing zone
        await updateZone({
          variables: {
            id: selectedZone.id,
            set: {
              name: values.name,
              warehouseId: values.warehouseId,
              zoneType: values.zoneType,
              updatedAt: new Date().toISOString(),
            },
          },
        });
      } else {
        // CREATE new zone
        const uuid = crypto.randomUUID();

        await createZone({
          variables: {
            object: {
              id: uuid,
              code: values.code,
              name: values.name,
              warehouseId: values.warehouseId,
              zoneType: values.zoneType,
              updatedAt: new Date().toISOString(),
            },
          },
        });
      }
    } catch (error: any) {
      console.error('Error saving zone:', error);
      message.error(error?.message || 'Failed to save zone');
    }
  };

  const handleEdit = (record: any) => {
    setSelectedZone(record);
    form.setFieldsValue({
      name: record.name,
      warehouseId: record.warehouseId,
      zoneType: record.zoneType,
    });
    editModal.open();
  };

  const handleDelete = (record: any) => {
    Modal.confirm({
      title: 'Delete Zone',
      content: `Are you sure you want to delete zone "${record.name}"? This action cannot be undone.`,
      okText: 'Delete',
      okType: 'danger',
      onOk: async () => {
        await deleteZone({ variables: { id: record.id } });
      },
    });
  };

  const handleAddZone = () => {
    setSelectedZone(null);
    form.resetFields();
    form.setFieldsValue({ zoneType: 'STANDARD' });
    addModal.open();
  };

  const columns = [
    {
      title: 'Zone Code',
      dataIndex: 'code',
      key: 'code',
      width: 120,
      render: (text: string) => (
        <span className="font-mono text-xs bg-blue-100 px-2 py-1 rounded">{text}</span>
      ),
    },
    {
      title: 'Zone Name',
      dataIndex: 'name',
      key: 'name',
      width: 200,
      render: (text: string) => (
        <div className="flex items-center gap-2">
          <EnvironmentOutlined className="text-blue-500" />
          <span className="font-medium">{text}</span>
        </div>
      ),
    },
    {
      title: 'Warehouse',
      dataIndex: 'warehouse',
      key: 'warehouse',
      width: 200,
      render: (warehouse: any) => (
        <div className="flex items-center gap-2">
          <HomeOutlined className="text-green-500" />
          <span>{warehouse?.name || '-'} ({warehouse?.code || '-'})</span>
        </div>
      ),
    },
    {
      title: 'Zone Type',
      dataIndex: 'zoneType',
      key: 'zoneType',
      width: 140,
      render: (type: string) => {
        const colors: any = {
          STANDARD: 'blue',
          COLD: 'cyan',
          FROZEN: 'purple',
          HAZMAT: 'red',
          QUARANTINE: 'orange',
        };
        return <Tag color={colors[type] || 'default'}>{type}</Tag>;
      },
    },
    {
      title: 'Locations',
      key: 'locations',
      width: 100,
      render: (_: any, record: any) => (
        <Tag color="purple">{record.locations?.length || 0}</Tag>
      ),
    },
    {
      title: 'Created',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 120,
      render: (date: string) => new Date(date).toLocaleDateString(),
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
            icon={<EyeOutlined />}
            onClick={() => {
              setSelectedZone(record);
              setDrawerOpen(true);
            }}
          >
            View
          </Button>
          <Button type="link" icon={<EditOutlined />} onClick={() => handleEdit(record)}>
            Edit
          </Button>
          <Button type="link" danger icon={<DeleteOutlined />} onClick={() => handleDelete(record)}>
            Delete
          </Button>
        </Space>
      ),
    },
  ];

  // Stats
  const totalZones = filteredZones.length;
  const standardZones = filteredZones.filter((z: any) => z.zoneType === 'STANDARD').length;
  const coldZones = filteredZones.filter((z: any) => z.zoneType === 'COLD').length;
  const frozenZones = filteredZones.filter((z: any) => z.zoneType === 'FROZEN').length;
  const hazmatZones = filteredZones.filter((z: any) => z.zoneType === 'HAZMAT').length;
  const quarantineZones = filteredZones.filter((z: any) => z.zoneType === 'QUARANTINE').length;

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              Warehouse Zones
            </h1>
            <p className="text-gray-600 mt-1">Manage warehouse zones and specialized storage areas</p>
          </div>
          <Button type="primary" icon={<PlusOutlined />} size="large" onClick={handleAddZone}>
            Add Zone
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
          <Card>
            <div className="text-center">
              <p className="text-gray-500 text-sm">Total Zones</p>
              <p className="text-3xl font-bold text-blue-600">{totalZones}</p>
            </div>
          </Card>
          <Card>
            <div className="text-center">
              <p className="text-gray-500 text-sm">Standard</p>
              <p className="text-2xl font-bold text-blue-600">{standardZones}</p>
            </div>
          </Card>
          <Card>
            <div className="text-center">
              <p className="text-gray-500 text-sm">Cold</p>
              <p className="text-2xl font-bold text-cyan-600">{coldZones}</p>
            </div>
          </Card>
          <Card>
            <div className="text-center">
              <p className="text-gray-500 text-sm">Frozen</p>
              <p className="text-2xl font-bold text-purple-600">{frozenZones}</p>
            </div>
          </Card>
          <Card>
            <div className="text-center">
              <p className="text-gray-500 text-sm">Hazmat</p>
              <p className="text-2xl font-bold text-red-600">{hazmatZones}</p>
            </div>
          </Card>
          <Card>
            <div className="text-center">
              <p className="text-gray-500 text-sm">Quarantine</p>
              <p className="text-2xl font-bold text-orange-600">{quarantineZones}</p>
            </div>
          </Card>
        </div>

        {/* Table */}
        <Card className="shadow-sm">
          <div className="flex gap-4 flex-wrap mb-4">
            <Search
              placeholder="Search by zone name, code, or warehouse..."
              allowClear
              style={{ width: 400 }}
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
            />
          </div>
          <Table
            columns={columns}
            dataSource={filteredZones}
            rowKey="id"
            loading={loading}
            scroll={{ x: 1200 }}
            pagination={{
              total: filteredZones.length,
              pageSize: 10,
              showSizeChanger: true,
              showTotal: (total) => `Total ${total} zones`,
            }}
            expandable={{
              expandedRowRender: (record: any) => (
                <div className="p-4 bg-gray-50">
                  <h4 className="font-semibold mb-2">Locations in this zone ({record.locations?.length || 0}):</h4>
                  {record.locations && record.locations.length > 0 ? (
                    <ul className="list-disc list-inside">
                      {record.locations.map((loc: any) => (
                        <li key={loc.id}>
                          {loc.code} - {loc.name}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-gray-500">No locations assigned to this zone yet.</p>
                  )}
                </div>
              ),
            }}
          />
        </Card>

        {/* Details Drawer */}
        <Drawer
          title="Zone Details"
          placement="right"
          width={600}
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
        >
          {selectedZone && (
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-lg">{selectedZone.name}</h3>
                <p className="text-gray-600">{selectedZone.warehouse?.name}</p>
              </div>
              <div className="border-t pt-4 space-y-2">
                <p><strong>Zone Code:</strong> <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">{selectedZone.code}</span></p>
                <p><strong>Warehouse:</strong> {selectedZone.warehouse?.name} ({selectedZone.warehouse?.code})</p>
                <p><strong>Zone Type:</strong> <Tag color="blue">{selectedZone.zoneType}</Tag></p>
                <p><strong>Locations:</strong> {selectedZone.locations?.length || 0}</p>
                <div className="border-t pt-4">
                  <p className="font-semibold mb-2">Locations in this zone:</p>
                  {selectedZone.locations && selectedZone.locations.length > 0 ? (
                    <ul className="list-disc list-inside space-y-1">
                      {selectedZone.locations.map((loc: any) => (
                        <li key={loc.id} className="text-sm">
                          {loc.code} - {loc.name}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-gray-500 text-sm">No locations assigned yet.</p>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-4">Created: {new Date(selectedZone.createdAt).toLocaleDateString()}</p>
              </div>
            </div>
          )}
        </Drawer>

        {/* Add Modal */}
        <Modal
          title="Add Zone"
          open={addModal.isOpen}
          onCancel={addModal.close}
          onOk={() => form.submit()}
          width={600}
          confirmLoading={creating}
        >
          <Form form={form} layout="vertical" onFinish={handleSubmit}>
            <Form.Item
              label="Zone Code"
              name="code"
              rules={[{ required: true, message: 'Please enter zone code' }]}
            >
              <Input placeholder="Enter zone code (e.g., Z-01, COLD-A)" />
            </Form.Item>
            <Form.Item
              label="Zone Name"
              name="name"
              rules={[{ required: true, message: 'Please enter zone name' }]}
            >
              <Input placeholder="Enter zone name (e.g., Main Storage Area)" />
            </Form.Item>
            <Form.Item
              label="Warehouse"
              name="warehouseId"
              rules={[{ required: true, message: 'Please select warehouse' }]}
            >
              <Select placeholder="Select warehouse">
                {warehouses.map((wh: any) => (
                  <Option key={wh.id} value={wh.id}>
                    {wh.name} ({wh.code})
                  </Option>
                ))}
              </Select>
            </Form.Item>
            <Form.Item
              label="Zone Type"
              name="zoneType"
              rules={[{ required: true, message: 'Please select zone type' }]}
            >
              <Select placeholder="Select zone type">
                <Option value="STANDARD">Standard Storage</Option>
                <Option value="COLD">Cold Storage (2-8°C)</Option>
                <Option value="FROZEN">Frozen Storage (-18°C)</Option>
                <Option value="HAZMAT">Hazardous Materials</Option>
                <Option value="QUARANTINE">Quarantine Area</Option>
              </Select>
            </Form.Item>
            <p className="text-xs text-gray-500">
              Zone codes must be unique within each warehouse. Locations can be assigned to zones for better organization.
            </p>
          </Form>
        </Modal>

        {/* Edit Modal */}
        <Modal
          title="Edit Zone"
          open={editModal.isOpen}
          onCancel={editModal.close}
          onOk={() => form.submit()}
          width={600}
          confirmLoading={updating}
        >
          <Form form={form} layout="vertical" onFinish={handleSubmit}>
            <Form.Item
              label="Zone Name"
              name="name"
              rules={[{ required: true, message: 'Please enter zone name' }]}
            >
              <Input placeholder="Enter zone name" />
            </Form.Item>
            <Form.Item
              label="Warehouse"
              name="warehouseId"
              rules={[{ required: true, message: 'Please select warehouse' }]}
            >
              <Select placeholder="Select warehouse">
                {warehouses.map((wh: any) => (
                  <Option key={wh.id} value={wh.id}>
                    {wh.name} ({wh.code})
                  </Option>
                ))}
              </Select>
            </Form.Item>
            <Form.Item
              label="Zone Type"
              name="zoneType"
              rules={[{ required: true, message: 'Please select zone type' }]}
            >
              <Select placeholder="Select zone type">
                <Option value="STANDARD">Standard Storage</Option>
                <Option value="COLD">Cold Storage (2-8°C)</Option>
                <Option value="FROZEN">Frozen Storage (-18°C)</Option>
                <Option value="HAZMAT">Hazardous Materials</Option>
                <Option value="QUARANTINE">Quarantine Area</Option>
              </Select>
            </Form.Item>
            <p className="text-xs text-gray-500">
              Note: Zone code cannot be changed after creation to maintain referential integrity.
            </p>
          </Form>
        </Modal>
      </div>
    </MainLayout>
  );
}
