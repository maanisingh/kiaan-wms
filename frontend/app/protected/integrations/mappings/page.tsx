'use client';

import React, { useState, useEffect } from 'react';
import { Table, Button, Input, Select, Card, Modal, Form, message, Tag, Tabs, Space } from 'antd';
import { PlusOutlined, SearchOutlined, EyeOutlined, ApiOutlined, ShoppingOutlined, UserOutlined, DatabaseOutlined, SyncOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import apiService from '@/services/api';
import { useRouter } from 'next/navigation';

const { Search } = Input;
const { Option } = Select;

export default function IntegrationMappingsPage() {
  const [loading, setLoading] = useState(false);
  const [mappings, setMappings] = useState([]);
  const [activeTab, setActiveTab] = useState('all');
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedMapping, setSelectedMapping] = useState<any>(null);
  const [form] = Form.useForm();
  const router = useRouter();

  useEffect(() => {
    fetchMappings();
  }, []);

  const fetchMappings = async () => {
    setLoading(true);
    try {
      const data = await apiService.get('/sku-mappings');
      // Map type from API format (PRODUCT/CUSTOMER/ORDER) to display format
      const formattedData = (Array.isArray(data) ? data : []).map((m: any) => ({
        ...m,
        type: m.type === 'PRODUCT' ? 'Product' : m.type === 'CUSTOMER' ? 'Customer' : m.type === 'ORDER' ? 'Order' : m.type
      }));
      setMappings(formattedData);
    } catch (error) {
      console.error('Error fetching mappings:', error);
      message.error('Failed to fetch SKU mappings');
      setMappings([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAddMapping = () => {
    setIsEditMode(false);
    setSelectedMapping(null);
    form.resetFields();
    setIsModalVisible(true);
  };

  const handleEditMapping = (record: any) => {
    setIsEditMode(true);
    setSelectedMapping(record);
    form.setFieldsValue(record);
    setIsModalVisible(true);
  };

  const handleDeleteMapping = async (mappingId: string, field: string) => {
    Modal.confirm({
      title: 'Delete Mapping',
      content: `Are you sure you want to delete mapping "${field}"?`,
      okText: 'Delete',
      okType: 'danger',
      onOk: async () => {
        try {
          await apiService.delete(`/sku-mappings/${mappingId}`);
          message.success('Mapping deleted successfully');
          fetchMappings();
        } catch (error) {
          message.error('Failed to delete mapping');
        }
      },
    });
  };

  const handleSubmit = async (values: any) => {
    try {
      if (isEditMode && selectedMapping) {
        await apiService.put(`/sku-mappings/${selectedMapping.id}`, values);
        message.success('Mapping updated successfully');
      } else {
        await apiService.post('/sku-mappings', values);
        message.success('Mapping created successfully');
      }
      setIsModalVisible(false);
      form.resetFields();
      fetchMappings();
    } catch (error) {
      message.error(`Failed to ${isEditMode ? 'update' : 'create'} mapping`);
    }
  };

  const columns = [
    {
      title: 'Field Name',
      dataIndex: 'field',
      key: 'field',
      width: 180,
      render: (text: string) => <span className="font-medium text-blue-600">{text}</span>
    },
    {
      title: 'External Field',
      dataIndex: 'external',
      key: 'external',
      width: 150,
      render: (text: string) => <code className="bg-gray-100 px-2 py-1 rounded">{text}</code>
    },
    {
      title: 'Internal Field',
      dataIndex: 'internal',
      key: 'internal',
      width: 150,
      render: (text: string) => <code className="bg-blue-50 px-2 py-1 rounded">{text}</code>
    },
    {
      title: 'Channel',
      dataIndex: 'channel',
      key: 'channel',
      width: 120
    },
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      width: 100,
      render: (type: string) => <Tag color="purple">{type}</Tag>
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => <Tag color={status === 'active' ? 'green' : 'red'}>{status || 'active'}</Tag>
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 200,
      render: (_: any, record: any) => (
        <Space size="small">
          <Button type="link" icon={<EditOutlined />} size="small" onClick={() => handleEditMapping(record)}>
            Edit
          </Button>
          <Button type="link" danger icon={<DeleteOutlined />} size="small" onClick={() => handleDeleteMapping(record.id, record.field)}>
            Delete
          </Button>
        </Space>
      ),
    },
  ];

  const allMappings = mappings;
  const productMappings = mappings.filter((m: any) => m.type === 'Product');
  const customerMappings = mappings.filter((m: any) => m.type === 'Customer');
  const orderMappings = mappings.filter((m: any) => m.type === 'Order');

  const renderFiltersAndTable = (dataSource: any[]) => (
    <>
      <div className="flex gap-4 mb-4">
        <Search placeholder="Search mappings..." style={{ width: 300 }} prefix={<SearchOutlined />} />
      </div>
      <Table columns={columns} dataSource={dataSource} rowKey="id" loading={loading} scroll={{ x: 1100 }} pagination={{ pageSize: 10 }} />
    </>
  );

  const tabItems = [
    {
      key: 'all',
      label: <span className="flex items-center gap-2"><ApiOutlined />All Mappings ({allMappings.length})</span>,
      children: renderFiltersAndTable(allMappings),
    },
    {
      key: 'product',
      label: <span className="flex items-center gap-2"><ShoppingOutlined />Product ({productMappings.length})</span>,
      children: renderFiltersAndTable(productMappings),
    },
    {
      key: 'customer',
      label: <span className="flex items-center gap-2"><UserOutlined />Customer ({customerMappings.length})</span>,
      children: renderFiltersAndTable(customerMappings),
    },
    {
      key: 'order',
      label: <span className="flex items-center gap-2"><DatabaseOutlined />Order ({orderMappings.length})</span>,
      children: renderFiltersAndTable(orderMappings),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            Field Mappings
          </h1>
          <p className="text-gray-600 mt-1">Map external fields to internal system</p>
        </div>
        <Space>
          <Button onClick={fetchMappings} icon={<SyncOutlined />}>
            Refresh
          </Button>
          <Button type="primary" icon={<PlusOutlined />} size="large" onClick={handleAddMapping}>
            Add Mapping
          </Button>
        </Space>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <div className="text-center">
            <p className="text-gray-500 text-sm">Total Mappings</p>
            <p className="text-3xl font-bold text-blue-600">{allMappings.length}</p>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <p className="text-gray-500 text-sm">Product Fields</p>
            <p className="text-3xl font-bold text-purple-600">{productMappings.length}</p>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <p className="text-gray-500 text-sm">Customer Fields</p>
            <p className="text-3xl font-bold text-green-600">{customerMappings.length}</p>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <p className="text-gray-500 text-sm">Order Fields</p>
            <p className="text-3xl font-bold text-orange-600">{orderMappings.length}</p>
          </div>
        </Card>
      </div>

      <Card className="shadow-sm">
        <Tabs activeKey={activeTab} onChange={setActiveTab} items={tabItems} size="large" />
      </Card>

      <Modal
        title={isEditMode ? 'Edit Mapping' : 'Add Mapping'}
        open={isModalVisible}
        onCancel={() => {
          setIsModalVisible(false);
          form.resetFields();
        }}
        onOk={() => form.submit()}
        width={600}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item label="Field Name" name="field" rules={[{ required: true }]}>
            <Input placeholder="Enter field name" />
          </Form.Item>
          <Form.Item label="External Field" name="external" rules={[{ required: true }]}>
            <Input placeholder="e.g., item_code" />
          </Form.Item>
          <Form.Item label="Internal Field" name="internal" rules={[{ required: true }]}>
            <Input placeholder="e.g., sku" />
          </Form.Item>
          <Form.Item label="Channel" name="channel" rules={[{ required: true }]}>
            <Select placeholder="Select channel">
              <Option value="Shopify">Shopify</Option>
              <Option value="Amazon">Amazon</Option>
              <Option value="eBay">eBay</Option>
            </Select>
          </Form.Item>
          <Form.Item label="Type" name="type" rules={[{ required: true }]}>
            <Select placeholder="Select type">
              <Option value="Product">Product</Option>
              <Option value="Customer">Customer</Option>
              <Option value="Order">Order</Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
