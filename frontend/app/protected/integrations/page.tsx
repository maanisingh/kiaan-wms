'use client';

import React, { useState, useEffect } from 'react';

import { Table, Button, Input, Select, Tag, Card, Modal, Form, message, Tabs, Space } from 'antd';
import { PlusOutlined, SearchOutlined, FilterOutlined, EyeOutlined, ApiOutlined, ShoppingOutlined, TruckOutlined, DatabaseOutlined, SyncOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import apiService from '@/services/api';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

const { Search } = Input;
const { Option } = Select;

export default function SystemIntegrationsPage() {
  const [loading, setLoading] = useState(false);
  const [integrations, setIntegrations] = useState([]);
  const [activeTab, setActiveTab] = useState('all');
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedIntegration, setSelectedIntegration] = useState<any>(null);
  const [form] = Form.useForm();
  const router = useRouter();

  useEffect(() => {
    fetchIntegrations();
  }, []);

  const fetchIntegrations = async () => {
    setLoading(true);
    try {
      const data = await apiService.get('/integrations');
      setIntegrations(data || []);
    } catch (error) {
      console.error('Error fetching integrations:', error);
      message.error('Failed to fetch integrations');
      setIntegrations([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAddIntegration = () => {
    setIsEditMode(false);
    setSelectedIntegration(null);
    form.resetFields();
    setIsModalVisible(true);
  };

  const handleEditIntegration = (record: any) => {
    setIsEditMode(true);
    setSelectedIntegration(record);
    form.setFieldsValue({
      name: record.name,
      type: record.type,
      apiKey: record.apiKey,
      apiUrl: record.apiUrl,
      syncFrequency: record.syncFrequency,
      status: record.status,
    });
    setIsModalVisible(true);
  };

  const handleDeleteIntegration = async (integrationId: string, name: string) => {
    Modal.confirm({
      title: 'Delete Integration',
      content: `Are you sure you want to delete integration "${name}"?`,
      okText: 'Delete',
      okType: 'danger',
      onOk: async () => {
        try {
          await apiService.delete(`/integrations/${integrationId}`);
          message.success('Integration deleted successfully');
          fetchIntegrations();
        } catch (error) {
          message.error('Failed to delete integration');
        }
      },
    });
  };

  const handleSubmit = async (values: any) => {
    try {
      if (isEditMode && selectedIntegration) {
        await apiService.put(`/integrations/${selectedIntegration.id}`, values);
        message.success('Integration updated successfully');
      } else {
        await apiService.post('/integrations', values);
        message.success('Integration created successfully');
      }
      setIsModalVisible(false);
      form.resetFields();
      fetchIntegrations();
    } catch (error) {
      message.error(`Failed to ${isEditMode ? 'update' : 'create'} integration`);
    }
  };

  const columns = [
    {
      title: 'Integration',
      dataIndex: 'name',
      key: 'name',
      width: 180,
      render: (text: string) => <span className="font-medium text-blue-600">{text}</span>
    },
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      width: 130,
      render: (type: string) => <Tag color="blue">{type}</Tag>
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => <Tag color={status === 'active' ? 'green' : 'red'}>{status}</Tag>
    },
    {
      title: 'Last Sync',
      dataIndex: 'lastSync',
      key: 'lastSync',
      width: 130,
      render: (date: string) => date || '-'
    },
    {
      title: 'Frequency',
      dataIndex: 'syncFrequency',
      key: 'frequency',
      width: 120
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 200,
      render: (_: any, record: any) => (
        <Space size="small">
          <Button
            type="link"
            icon={<EyeOutlined />}
            size="small"
            onClick={() => router.push(`/protected/integrations/${record.id}`)}
          >
            View
          </Button>
          <Button
            type="link"
            icon={<EditOutlined />}
            size="small"
            onClick={() => handleEditIntegration(record)}
          >
            Edit
          </Button>
          <Button
            type="link"
            danger
            icon={<DeleteOutlined />}
            size="small"
            onClick={() => handleDeleteIntegration(record.id, record.name)}
          >
            Delete
          </Button>
        </Space>
      )
    },
  ];

  const allIntegrations = integrations;
  const ecommerceIntegrations = integrations.filter((i: any) => i.type === 'E-Commerce' || i.type === 'Marketplace');
  const shippingIntegrations = integrations.filter((i: any) => i.type === 'Shipping');
  const erpIntegrations = integrations.filter((i: any) => i.type === 'ERP');

  const renderFiltersAndTable = (dataSource: any[]) => (
    <>
      <div className="flex gap-4 mb-4">
        <Search placeholder="Search integrations..." style={{ width: 300 }} prefix={<SearchOutlined />} />
        <Select placeholder="Status" style={{ width: 150 }} allowClear>
          <Option value="active">Active</Option>
          <Option value="inactive">Inactive</Option>
        </Select>
        <Button icon={<FilterOutlined />}>More Filters</Button>
      </div>
      <Table
        columns={columns}
        dataSource={dataSource}
        rowKey="id"
        loading={loading}
        scroll={{ x: 1200 }}
        pagination={{ pageSize: 10 }}
      />
    </>
  );

  const tabItems = [
    {
      key: 'all',
      label: <span className="flex items-center gap-2"><ApiOutlined />All Integrations ({allIntegrations.length})</span>,
      children: renderFiltersAndTable(allIntegrations),
    },
    {
      key: 'ecommerce',
      label: <span className="flex items-center gap-2"><ShoppingOutlined />E-Commerce ({ecommerceIntegrations.length})</span>,
      children: renderFiltersAndTable(ecommerceIntegrations),
    },
    {
      key: 'shipping',
      label: <span className="flex items-center gap-2"><TruckOutlined />Shipping ({shippingIntegrations.length})</span>,
      children: renderFiltersAndTable(shippingIntegrations),
    },
    {
      key: 'erp',
      label: <span className="flex items-center gap-2"><DatabaseOutlined />ERP ({erpIntegrations.length})</span>,
      children: renderFiltersAndTable(erpIntegrations),
    },
  ];

  const activeCount = integrations.filter((i: any) => i.status === 'active').length;

  return (
    <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              System Integrations
            </h1>
            <p className="text-gray-600 mt-1">Connect with ERP, e-commerce, and shipping carriers</p>
          </div>
          <Space>
            <Button onClick={fetchIntegrations} icon={<SyncOutlined />}>
              Refresh
            </Button>
            <Button icon={<ShoppingOutlined />} size="large" onClick={() => router.push('/protected/integrations/channels')}>
              Manage Channels
            </Button>
            <Button type="primary" icon={<PlusOutlined />} size="large" onClick={handleAddIntegration}>
              Add Integration
            </Button>
          </Space>
        </div>

        {/* Quick Navigation Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <Card
            hoverable
            onClick={() => router.push('/protected/integrations/channels')}
            className="cursor-pointer border-green-200 hover:border-green-400"
          >
            <div className="flex items-center gap-4">
              <ShoppingOutlined style={{ fontSize: 40, color: '#52c41a' }} />
              <div>
                <h3 className="text-lg font-semibold">Sales Channels</h3>
                <p className="text-gray-500 text-sm">Manage Amazon, Shopify, eBay, and marketplace integrations</p>
              </div>
            </div>
          </Card>
          <Card
            hoverable
            onClick={() => router.push('/protected/settings/integrations')}
            className="cursor-pointer border-blue-200 hover:border-blue-400"
          >
            <div className="flex items-center gap-4">
              <TruckOutlined style={{ fontSize: 40, color: '#1890ff' }} />
              <div>
                <h3 className="text-lg font-semibold">Shipping Carriers</h3>
                <p className="text-gray-500 text-sm">Connect UPS, FedEx, DHL, Royal Mail, and 80+ carriers</p>
              </div>
            </div>
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <div className="text-center">
              <p className="text-gray-500 text-sm">Active Integrations</p>
              <p className="text-3xl font-bold text-green-600">{activeCount}</p>
            </div>
          </Card>
          <Card>
            <div className="text-center">
              <p className="text-gray-500 text-sm">Total Integrations</p>
              <p className="text-3xl font-bold text-blue-600">{integrations.length}</p>
            </div>
          </Card>
          <Card>
            <div className="text-center">
              <p className="text-gray-500 text-sm">E-Commerce</p>
              <p className="text-3xl font-bold text-purple-600">{ecommerceIntegrations.length}</p>
            </div>
          </Card>
          <Card>
            <div className="text-center">
              <p className="text-gray-500 text-sm">Shipping</p>
              <p className="text-3xl font-bold text-orange-600">{shippingIntegrations.length}</p>
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

        <Modal
          title={isEditMode ? 'Edit Integration' : 'Add Integration'}
          open={isModalVisible}
          onCancel={() => {
            setIsModalVisible(false);
            form.resetFields();
          }}
          onOk={() => form.submit()}
          width={600}
        >
          <Form form={form} layout="vertical" onFinish={handleSubmit}>
            <Form.Item
              label="Integration Name"
              name="name"
              rules={[{ required: true, message: 'Please enter integration name' }]}
            >
              <Input placeholder="Enter integration name" />
            </Form.Item>
            <Form.Item
              label="Type"
              name="type"
              rules={[{ required: true, message: 'Please select type' }]}
            >
              <Select placeholder="Select type">
                <Option value="E-Commerce">E-Commerce</Option>
                <Option value="Marketplace">Marketplace</Option>
                <Option value="Shipping">Shipping</Option>
                <Option value="ERP">ERP</Option>
              </Select>
            </Form.Item>
            <Form.Item
              label="API Key"
              name="apiKey"
              rules={[{ required: true, message: 'Please enter API key' }]}
            >
              <Input.Password placeholder="Enter API key" />
            </Form.Item>
            <Form.Item label="API URL" name="apiUrl">
              <Input placeholder="Enter API URL (optional)" />
            </Form.Item>
            <Form.Item
              label="Sync Frequency"
              name="syncFrequency"
              rules={[{ required: true, message: 'Please select sync frequency' }]}
            >
              <Select placeholder="Select sync frequency">
                <Option value="Real-time">Real-time</Option>
                <Option value="15 min">15 minutes</Option>
                <Option value="30 min">30 minutes</Option>
                <Option value="Hourly">Hourly</Option>
                <Option value="Manual">Manual</Option>
              </Select>
            </Form.Item>
            {isEditMode && (
              <Form.Item label="Status" name="status">
                <Select placeholder="Select status">
                  <Option value="active">Active</Option>
                  <Option value="inactive">Inactive</Option>
                </Select>
              </Form.Item>
            )}
          </Form>
        </Modal>
      </div>
      );
}
