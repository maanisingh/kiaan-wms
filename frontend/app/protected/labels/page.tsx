'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Table, Button, Input, Select, Tag, Card, Modal, Form, Tabs, Spin, Alert, App } from 'antd';
import { PlusOutlined, SearchOutlined, EyeOutlined, PrinterOutlined, BarcodeOutlined, TagsOutlined, DeleteOutlined, EditOutlined, ReloadOutlined, DownloadOutlined } from '@ant-design/icons';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import apiService from '@/services/api';
import { formatDate } from '@/lib/utils';

const { Search } = Input;
const { Option } = Select;

interface LabelTemplate {
  id: string;
  templateName: string;
  name?: string;
  type: string;
  format: string;
  uses?: number;
  lastUsed?: string;
  status: string;
  createdAt?: string;
  updatedAt?: string;
}

export default function LabelPrintingPage() {
  const { modal, message } = App.useApp();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [labels, setLabels] = useState<LabelTemplate[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('all');
  const [searchText, setSearchText] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedLabel, setSelectedLabel] = useState<LabelTemplate | null>(null);
  const [saving, setSaving] = useState(false);
  const [form] = Form.useForm();

  // Fetch labels from API
  const fetchLabels = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await apiService.get('/labels');
      setLabels(Array.isArray(data) ? data : []);
    } catch (err: any) {
      console.error('Failed to fetch labels:', err);
      setError(err.message || 'Failed to load labels');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLabels();
  }, [fetchLabels]);

  // Filter labels based on search and tab
  const getFilteredLabels = () => {
    let filtered = labels;

    // Filter by tab/type
    if (activeTab === 'shipping') {
      filtered = filtered.filter(l => l.type?.toLowerCase() === 'shipping');
    } else if (activeTab === 'product') {
      filtered = filtered.filter(l => l.type?.toLowerCase() === 'product');
    } else if (activeTab === 'location') {
      filtered = filtered.filter(l => l.type?.toLowerCase() === 'location' || l.type?.toLowerCase() === 'pallet');
    }

    // Filter by search
    if (searchText) {
      const search = searchText.toLowerCase();
      filtered = filtered.filter(l =>
        l.templateName?.toLowerCase().includes(search) ||
        l.name?.toLowerCase().includes(search) ||
        l.type?.toLowerCase().includes(search) ||
        l.format?.toLowerCase().includes(search)
      );
    }

    return filtered;
  };

  const handleSubmit = async (values: any) => {
    try {
      setSaving(true);

      if (editMode && selectedLabel) {
        // Update label
        await apiService.put(`/labels/${selectedLabel.id}`, {
          templateName: values.templateName,
          name: values.templateName,
          type: values.type,
          format: values.format,
          status: values.status || 'active'
        });
        message.success('Label template updated successfully!');
      } else {
        // Create label
        await apiService.post('/labels', {
          templateName: values.templateName,
          name: values.templateName,
          type: values.type,
          format: values.format,
          status: 'active'
        });
        message.success('Label template created successfully!');
      }

      form.resetFields();
      setModalOpen(false);
      setEditMode(false);
      setSelectedLabel(null);
      fetchLabels();
    } catch (err: any) {
      console.error('Failed to save label:', err);
      message.error(err.message || 'Failed to save label template');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (record: LabelTemplate) => {
    setSelectedLabel(record);
    form.setFieldsValue({
      templateName: record.templateName || record.name,
      type: record.type,
      format: record.format,
      status: record.status
    });
    setEditMode(true);
    setModalOpen(true);
  };

  const handleDelete = (record: LabelTemplate) => {
    modal.confirm({
      title: 'Delete Label Template',
      content: `Are you sure you want to delete "${record.templateName || record.name}"? This action cannot be undone.`,
      okText: 'Delete',
      okType: 'danger',
      onOk: async () => {
        try {
          await apiService.delete(`/labels/${record.id}`);
          message.success('Label template deleted successfully!');
          fetchLabels();
        } catch (err: any) {
          message.error(err.message || 'Failed to delete label template');
        }
      }
    });
  };

  const handlePrint = async (record: LabelTemplate) => {
    try {
      message.loading('Generating label...', 1);
      // Call print API
      await apiService.post(`/labels/${record.id}/print`);
      message.success('Label sent to printer!');
    } catch (err: any) {
      message.error(err.message || 'Failed to print label');
    }
  };

  const columns = [
    {
      title: 'Template Name',
      key: 'templateName',
      width: 220,
      render: (_: any, record: LabelTemplate) => (
        <Link href={`/protected/labels/${record.id}`}>
          <span className="font-medium text-blue-600 cursor-pointer hover:underline">
            {record.templateName || record.name}
          </span>
        </Link>
      )
    },
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      width: 120,
      render: (type: string) => <Tag color="blue">{type || '-'}</Tag>
    },
    {
      title: 'Format',
      dataIndex: 'format',
      key: 'format',
      width: 100,
      render: (format: string) => format || 'PDF'
    },
    {
      title: 'Uses',
      dataIndex: 'uses',
      key: 'uses',
      width: 100,
      render: (uses: number) => uses || 0
    },
    {
      title: 'Last Used',
      key: 'lastUsed',
      width: 120,
      render: (_: any, record: LabelTemplate) => formatDate(record.lastUsed || record.updatedAt || '') || '-'
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => (
        <Tag color={status === 'active' ? 'green' : 'red'}>
          {status || 'active'}
        </Tag>
      )
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 220,
      render: (_: any, record: LabelTemplate) => (
        <div className="flex gap-1">
          <Link href={`/protected/labels/${record.id}`}>
            <Button type="link" icon={<EyeOutlined />} size="small">View</Button>
          </Link>
          <Button type="link" icon={<PrinterOutlined />} size="small" onClick={() => handlePrint(record)}>
            Print
          </Button>
          <Button type="link" icon={<EditOutlined />} size="small" onClick={() => handleEdit(record)}>
            Edit
          </Button>
          <Button type="link" danger icon={<DeleteOutlined />} size="small" onClick={() => handleDelete(record)}>
            Delete
          </Button>
        </div>
      )
    },
  ];

  const allLabels = getFilteredLabels();
  const shippingLabels = labels.filter(l => l.type?.toLowerCase() === 'shipping');
  const productLabels = labels.filter(l => l.type?.toLowerCase() === 'product');
  const locationLabels = labels.filter(l => l.type?.toLowerCase() === 'location' || l.type?.toLowerCase() === 'pallet');

  const renderFiltersAndTable = () => (
    <>
      <div className="flex gap-4 mb-4">
        <Search
          placeholder="Search templates..."
          style={{ width: 300 }}
          prefix={<SearchOutlined />}
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          allowClear
        />
        <Select placeholder="Format" style={{ width: 150 }} allowClear>
          <Option value="PDF">PDF</Option>
          <Option value="ZPL">ZPL</Option>
          <Option value="PNG">PNG</Option>
        </Select>
        <Button icon={<ReloadOutlined />} onClick={fetchLabels}>Refresh</Button>
      </div>
      {error && (
        <Alert
          message="Error"
          description={error}
          type="error"
          showIcon
          className="mb-4"
          closable
          onClose={() => setError(null)}
        />
      )}
      <Table
        columns={columns}
        dataSource={getFilteredLabels()}
        rowKey="id"
        loading={loading}
        scroll={{ x: 1000 }}
        onRow={(record) => ({
          onClick: () => router.push(`/protected/labels/${record.id}`),
          style: { cursor: 'pointer' }
        })}
        pagination={{
          showSizeChanger: true,
          showTotal: (total) => `Total ${total} templates`,
        }}
      />
    </>
  );

  const tabItems = [
    {
      key: 'all',
      label: <span className="flex items-center gap-2"><TagsOutlined />All Templates ({labels.length})</span>,
      children: renderFiltersAndTable(),
    },
    {
      key: 'shipping',
      label: <span className="flex items-center gap-2"><PrinterOutlined />Shipping ({shippingLabels.length})</span>,
      children: renderFiltersAndTable(),
    },
    {
      key: 'product',
      label: <span className="flex items-center gap-2"><BarcodeOutlined />Product ({productLabels.length})</span>,
      children: renderFiltersAndTable(),
    },
    {
      key: 'location',
      label: <span className="flex items-center gap-2"><TagsOutlined />Location ({locationLabels.length})</span>,
      children: renderFiltersAndTable(),
    },
  ];

  if (loading && labels.length === 0) {
    return (
      <div className="flex justify-center items-center h-96">
        <Spin size="large" tip="Loading labels..." />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-blue-600 bg-clip-text text-transparent">
            Label Printing & Barcodes
          </h1>
          <p className="text-gray-600 mt-1">Generate and print shipping and product labels</p>
        </div>
        <Button type="primary" icon={<PlusOutlined />} size="large" onClick={() => {
          setEditMode(false);
          setSelectedLabel(null);
          form.resetFields();
          setModalOpen(true);
        }}>
          Create Template
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <div className="text-center">
            <p className="text-gray-500 text-sm">Total Templates</p>
            <p className="text-3xl font-bold text-blue-600">{labels.length}</p>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <p className="text-gray-500 text-sm">Shipping Labels</p>
            <p className="text-3xl font-bold text-orange-600">{shippingLabels.length}</p>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <p className="text-gray-500 text-sm">Product Labels</p>
            <p className="text-3xl font-bold text-green-600">{productLabels.length}</p>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <p className="text-gray-500 text-sm">Location Labels</p>
            <p className="text-3xl font-bold text-purple-600">{locationLabels.length}</p>
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
        title={editMode ? 'Edit Label Template' : 'Create Label Template'}
        open={modalOpen}
        onCancel={() => {
          setModalOpen(false);
          setEditMode(false);
          setSelectedLabel(null);
          form.resetFields();
        }}
        onOk={() => form.submit()}
        confirmLoading={saving}
        width={600}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item label="Template Name" name="templateName" rules={[{ required: true, message: 'Please enter template name' }]}>
            <Input placeholder="Enter template name" />
          </Form.Item>
          <Form.Item label="Type" name="type" rules={[{ required: true, message: 'Please select type' }]}>
            <Select placeholder="Select type">
              <Option value="Shipping">Shipping</Option>
              <Option value="Product">Product</Option>
              <Option value="Location">Location</Option>
              <Option value="Pallet">Pallet</Option>
            </Select>
          </Form.Item>
          <Form.Item label="Format" name="format" rules={[{ required: true, message: 'Please select format' }]}>
            <Select placeholder="Select format">
              <Option value="PDF">PDF</Option>
              <Option value="ZPL">ZPL</Option>
              <Option value="PNG">PNG</Option>
            </Select>
          </Form.Item>
          {editMode && (
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
