'use client';

import React, { useState, useEffect } from 'react';
import {
  Card, Table, Button, Space, Tag, Input, message, Modal, Form, InputNumber, Upload
} from 'antd';
import {
  PlusOutlined, EditOutlined, DeleteOutlined, UploadOutlined, DownloadOutlined,
  ReloadOutlined
} from '@ant-design/icons';
import apiService from '@/services/api';

interface VATRate {
  id: string;
  countryCode: string;
  countryName: string;
  rate: number;
  isActive: boolean;
}

interface VATCode {
  id: string;
  code: string;
  description: string;
  rates: VATRate[];
}

export default function VATRatesPage() {
  const [vatCodes, setVatCodes] = useState<VATCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCodeModal, setShowCodeModal] = useState(false);
  const [showRateModal, setShowRateModal] = useState(false);
  const [editingCode, setEditingCode] = useState<VATCode | null>(null);
  const [selectedCodeForRate, setSelectedCodeForRate] = useState<string | null>(null);
  const [codeForm] = Form.useForm();
  const [rateForm] = Form.useForm();

  const fetchVATCodes = async () => {
    try {
      setLoading(true);
      const data = await apiService.get('/vat-codes');
      setVatCodes(data.vatCodes || []);
    } catch (err: any) {
      console.error('Failed to fetch VAT codes:', err);
      message.error(err.message || 'Failed to load VAT codes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVATCodes();
  }, []);

  const handleAddCode = () => {
    setEditingCode(null);
    codeForm.resetFields();
    setShowCodeModal(true);
  };

  const handleEditCode = (code: VATCode) => {
    setEditingCode(code);
    codeForm.setFieldsValue(code);
    setShowCodeModal(true);
  };

  const handleSaveCode = async (values: any) => {
    try {
      if (editingCode) {
        await apiService.put(`/vat-codes/${editingCode.id}`, values);
        message.success('VAT code updated');
      } else {
        await apiService.post('/vat-codes', values);
        message.success('VAT code created');
      }
      setShowCodeModal(false);
      fetchVATCodes();
    } catch (err: any) {
      message.error(err.message || 'Failed to save VAT code');
    }
  };

  const handleDeleteCode = (id: string) => {
    Modal.confirm({
      title: 'Delete VAT Code',
      content: 'Are you sure? This will delete all associated country rates.',
      okText: 'Delete',
      okType: 'danger',
      onOk: async () => {
        try {
          await apiService.delete(`/vat-codes/${id}`);
          message.success('VAT code deleted');
          fetchVATCodes();
        } catch (err: any) {
          message.error(err.message || 'Failed to delete VAT code');
        }
      },
    });
  };

  const handleAddRate = (codeId: string) => {
    setSelectedCodeForRate(codeId);
    rateForm.resetFields();
    setShowRateModal(true);
  };

  const handleSaveRate = async (values: any) => {
    try {
      await apiService.post(`/vat-codes/${selectedCodeForRate}/rates`, values);
      message.success('Country rate added');
      setShowRateModal(false);
      fetchVATCodes();
    } catch (err: any) {
      message.error(err.message || 'Failed to add rate');
    }
  };

  const handleImportCSV = async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    try {
      await apiService.post('/vat-codes/import', formData);
      message.success('VAT codes imported successfully');
      fetchVATCodes();
    } catch (err: any) {
      message.error(err.message || 'Failed to import VAT codes');
    }
    return false; // Prevent auto upload
  };

  const columns = [
    {
      title: 'VAT Code',
      dataIndex: 'code',
      key: 'code',
      render: (code: string) => (
        <span className="font-mono font-semibold text-blue-600">{code}</span>
      ),
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
    },
    {
      title: 'Country Rates',
      dataIndex: 'rates',
      key: 'rates',
      render: (rates: VATRate[]) => (
        <Tag color="purple">{rates?.length || 0} countries</Tag>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, record: VATCode) => (
        <Space>
          <Button size="small" onClick={() => handleEditCode(record)}>
            Edit
          </Button>
          <Button size="small" onClick={() => handleAddRate(record.id)}>
            Add Rate
          </Button>
          <Button
            size="small"
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDeleteCode(record.id)}
          >
            Delete
          </Button>
        </Space>
      ),
    },
  ];

  const expandedRowRender = (record: VATCode) => {
    const rateColumns = [
      {
        title: 'Country',
        dataIndex: 'countryName',
        key: 'country',
        render: (name: string, rate: VATRate) => (
          <Space>
            <Tag>{rate.countryCode}</Tag>
            <span>{name}</span>
          </Space>
        ),
      },
      {
        title: 'VAT Rate',
        dataIndex: 'rate',
        key: 'rate',
        render: (rate: number) => (
          <span className="font-semibold">{(rate * 100).toFixed(1)}%</span>
        ),
      },
      {
        title: 'Status',
        dataIndex: 'isActive',
        key: 'status',
        render: (isActive: boolean) => (
          <Tag color={isActive ? 'green' : 'red'}>
            {isActive ? 'Active' : 'Inactive'}
          </Tag>
        ),
      },
    ];

    return (
      <Table
        columns={rateColumns}
        dataSource={record.rates}
        pagination={false}
        size="small"
        rowKey="id"
      />
    );
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">VAT Rates Management</h1>
          <p className="text-gray-500 mt-1">
            Manage VAT codes and country-specific tax rates for EU compliance
          </p>
        </div>
        <Space>
          <Upload
            beforeUpload={handleImportCSV}
            showUploadList={false}
            accept=".csv"
          >
            <Button icon={<UploadOutlined />}>Import CSV</Button>
          </Upload>
          <Button icon={<DownloadOutlined />}>
            Export Template
          </Button>
          <Button icon={<ReloadOutlined />} onClick={fetchVATCodes}>
            Refresh
          </Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAddCode}>
            Add VAT Code
          </Button>
        </Space>
      </div>

      {/* Info Card */}
      <Card size="small" className="bg-blue-50 border-blue-200">
        <div className="text-sm">
          <strong>VAT Code Examples:</strong>
          <ul className="mt-2 ml-4 list-disc text-gray-700">
            <li><strong>A_FOOD_GEN:</strong> General food items (0% UK, 7% DE, 5.5% FR)</li>
            <li><strong>A_FOOD_CNDY:</strong> Chocolates and sweets (20% UK, 7% DE, 20% FR)</li>
            <li><strong>A_FOOD_CEREALBARS:</strong> Cereal bars without chocolate (20% UK, 7% DE)</li>
          </ul>
        </div>
      </Card>

      {/* VAT Codes Table */}
      <Card>
        <Table
          dataSource={vatCodes}
          columns={columns}
          rowKey="id"
          loading={loading}
          expandable={{
            expandedRowRender,
            rowExpandable: (record) => (record.rates?.length || 0) > 0,
          }}
          pagination={{
            pageSize: 20,
            showTotal: (total) => `Total ${total} VAT codes`,
          }}
        />
      </Card>

      {/* Add/Edit VAT Code Modal */}
      <Modal
        title={editingCode ? 'Edit VAT Code' : 'Add VAT Code'}
        open={showCodeModal}
        onCancel={() => setShowCodeModal(false)}
        onOk={() => codeForm.submit()}
        width={600}
      >
        <Form
          form={codeForm}
          layout="vertical"
          onFinish={handleSaveCode}
        >
          <Form.Item
            label="VAT Code"
            name="code"
            rules={[{ required: true, message: 'Code is required' }]}
            tooltip="e.g., A_FOOD_GEN, A_FOOD_CNDY"
          >
            <Input placeholder="A_FOOD_GEN" />
          </Form.Item>

          <Form.Item
            label="Description"
            name="description"
            rules={[{ required: true, message: 'Description is required' }]}
          >
            <Input.TextArea
              rows={3}
              placeholder="Describe what products this VAT code covers..."
            />
          </Form.Item>
        </Form>
      </Modal>

      {/* Add Country Rate Modal */}
      <Modal
        title="Add Country VAT Rate"
        open={showRateModal}
        onCancel={() => setShowRateModal(false)}
        onOk={() => rateForm.submit()}
      >
        <Form
          form={rateForm}
          layout="vertical"
          onFinish={handleSaveRate}
          initialValues={{ isActive: true }}
        >
          <Form.Item
            label="Country Code"
            name="countryCode"
            rules={[{ required: true, message: 'Country code is required' }]}
          >
            <Input placeholder="GB, DE, FR, etc." maxLength={2} />
          </Form.Item>

          <Form.Item
            label="Country Name"
            name="countryName"
            rules={[{ required: true, message: 'Country name is required' }]}
          >
            <Input placeholder="United Kingdom, Germany, etc." />
          </Form.Item>

          <Form.Item
            label="VAT Rate (%)"
            name="rate"
            rules={[{ required: true, message: 'VAT rate is required' }]}
            tooltip="Enter as percentage, will be converted to decimal (e.g., 20 becomes 0.20)"
          >
            <InputNumber
              min={0}
              max={100}
              step={0.1}
              style={{ width: '100%' }}
              formatter={value => `${value}%`}
              parser={value => value!.replace('%', '')}
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
