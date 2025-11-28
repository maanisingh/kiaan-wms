'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Table, Button, Input, Select, Tag, Card, Modal, Form, Tabs, Spin, Alert, App, Row, Col, Statistic, Space, Divider, Switch, InputNumber, Badge, Tooltip } from 'antd';
import { PlusOutlined, SearchOutlined, EyeOutlined, PrinterOutlined, BarcodeOutlined, TagsOutlined, DeleteOutlined, EditOutlined, ReloadOutlined, DownloadOutlined, SettingOutlined, WifiOutlined, UsbOutlined, CheckCircleOutlined, CloseCircleOutlined, ApiOutlined, CodeOutlined, CloudServerOutlined, DesktopOutlined, ThunderboltOutlined, SendOutlined } from '@ant-design/icons';
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
  width?: number;
  height?: number;
  dpi?: number;
  uses?: number;
  lastUsed?: string;
  status: string;
  createdAt?: string;
  updatedAt?: string;
}

interface Printer {
  id: string;
  name: string;
  type: string;
  connection: string;
  status: string;
  location: string;
  ipAddress?: string;
}

interface PrinterSettings {
  id: string;
  defaultPrinter: string;
  printerType: string;
  connectionType: string;
  ipAddress: string;
  port: number;
  labelWidth: number;
  labelHeight: number;
  dpi: number;
  autoprint: boolean;
  printCopies: number;
  darkness: number;
  speed: number;
  testModeEnabled: boolean;
  printers: Printer[];
}

interface PrintAgent {
  agentId: string;
  agentName: string;
  computerName: string;
  printers: string[];
  version: string;
  status: string;
  lastHeartbeat: string;
  registeredAt: string;
}

interface PrintJob {
  jobId: string;
  agentId: string;
  printerName: string;
  labelType: string;
  status: string;
  createdAt: string;
  completedAt?: string;
  error?: string;
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

  // Printer settings state
  const [printerSettings, setPrinterSettings] = useState<PrinterSettings | null>(null);
  const [printerModalOpen, setPrinterModalOpen] = useState(false);
  const [addPrinterModalOpen, setAddPrinterModalOpen] = useState(false);
  const [printerForm] = Form.useForm();
  const [addPrinterForm] = Form.useForm();

  // Print Agent state
  const [printAgents, setPrintAgents] = useState<PrintAgent[]>([]);
  const [printJobs, setPrintJobs] = useState<PrintJob[]>([]);
  const [printAgentModalOpen, setPrintAgentModalOpen] = useState(false);

  // ZPL Preview state
  const [zplPreviewOpen, setZplPreviewOpen] = useState(false);
  const [zplCode, setZplCode] = useState('');
  const [zplLoading, setZplLoading] = useState(false);
  const [selectedLabelForPrint, setSelectedLabelForPrint] = useState<LabelTemplate | null>(null);
  const [printOptionsOpen, setPrintOptionsOpen] = useState(false);
  const [printForm] = Form.useForm();

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

  // Fetch printer settings
  const fetchPrinterSettings = useCallback(async () => {
    try {
      const data = await apiService.get('/printer-settings');
      setPrinterSettings(data);
    } catch (err: any) {
      console.error('Failed to fetch printer settings:', err);
    }
  }, []);

  // Fetch print agents
  const fetchPrintAgents = useCallback(async () => {
    try {
      const data = await apiService.get('/print-agent/list');
      setPrintAgents(Array.isArray(data) ? data : []);
    } catch (err: any) {
      console.error('Failed to fetch print agents:', err);
    }
  }, []);

  // Fetch print jobs
  const fetchPrintJobs = useCallback(async () => {
    try {
      const data = await apiService.get('/print-agent/jobs?limit=20');
      setPrintJobs(Array.isArray(data) ? data : []);
    } catch (err: any) {
      console.error('Failed to fetch print jobs:', err);
    }
  }, []);

  useEffect(() => {
    fetchLabels();
    fetchPrinterSettings();
    fetchPrintAgents();
    fetchPrintJobs();
  }, [fetchLabels, fetchPrinterSettings, fetchPrintAgents, fetchPrintJobs]);

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
        await apiService.put(`/labels/${selectedLabel.id}`, {
          templateName: values.templateName,
          name: values.templateName,
          type: values.type,
          format: values.format,
          width: values.width,
          height: values.height,
          dpi: values.dpi,
          status: values.status || 'active'
        });
        message.success('Label template updated successfully!');
      } else {
        await apiService.post('/labels', {
          templateName: values.templateName,
          name: values.templateName,
          type: values.type,
          format: values.format,
          width: values.width,
          height: values.height,
          dpi: values.dpi,
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
      width: record.width || 4,
      height: record.height || 6,
      dpi: record.dpi || 203,
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
      await apiService.post(`/labels/${record.id}/print`);
      message.success(`Label sent to ${printerSettings?.defaultPrinter || 'printer'}!`);
      fetchLabels(); // Refresh to update usage count
    } catch (err: any) {
      message.error(err.message || 'Failed to print label');
    }
  };

  const handleSavePrinterSettings = async (values: any) => {
    try {
      setSaving(true);
      await apiService.put('/printer-settings', values);
      message.success('Printer settings saved successfully!');
      fetchPrinterSettings();
      setPrinterModalOpen(false);
    } catch (err: any) {
      message.error(err.message || 'Failed to save printer settings');
    } finally {
      setSaving(false);
    }
  };

  const handleTestPrinter = async (printerId: string) => {
    try {
      message.loading('Testing printer connection...', 1);
      const result = await apiService.post('/printer-settings/test', { printerId });
      if (result.success) {
        message.success(result.message);
      } else {
        message.warning(result.message);
      }
    } catch (err: any) {
      message.error(err.message || 'Failed to test printer');
    }
  };

  const handleAddPrinter = async (values: any) => {
    try {
      setSaving(true);
      await apiService.post('/printer-settings/printers', values);
      message.success('Printer added successfully!');
      fetchPrinterSettings();
      setAddPrinterModalOpen(false);
      addPrinterForm.resetFields();
    } catch (err: any) {
      message.error(err.message || 'Failed to add printer');
    } finally {
      setSaving(false);
    }
  };

  const handleDeletePrinter = async (printerId: string) => {
    modal.confirm({
      title: 'Delete Printer',
      content: 'Are you sure you want to remove this printer?',
      okText: 'Delete',
      okType: 'danger',
      onOk: async () => {
        try {
          await apiService.delete(`/printer-settings/printers/${printerId}`);
          message.success('Printer removed successfully!');
          fetchPrinterSettings();
        } catch (err: any) {
          message.error(err.message || 'Failed to remove printer');
        }
      }
    });
  };

  // Generate and preview ZPL code
  const handleGenerateZPL = async (record: LabelTemplate) => {
    try {
      setZplLoading(true);
      setSelectedLabelForPrint(record);

      // Sample data for preview - in real app this would come from order/product data
      const sampleData = {
        shipping: {
          shipTo: { name: 'John Smith', address: '123 Main St', city: 'New York', state: 'NY', zip: '10001', country: 'USA' },
          shipFrom: { name: 'Kiaan Warehouse', address: '456 Industrial Ave', city: 'Los Angeles', state: 'CA', zip: '90001' },
          trackingNumber: '1Z999AA10123456784',
          carrier: 'UPS',
          weight: '2.5',
          dimensions: '12x8x6',
          orderNumber: 'ORD-12345',
          serviceType: 'GROUND'
        },
        product: {
          sku: 'SKU-001',
          name: 'Sample Product',
          barcode: '012345678901',
          price: 29.99,
          location: 'A-01-01',
          brand: 'Kiaan',
          quantity: 10
        },
        location: {
          locationCode: 'A-01-01-A',
          zone: 'A',
          aisle: '01',
          rack: '01',
          shelf: 'A',
          bin: '1',
          warehouseName: 'Main Warehouse',
          locationType: 'STORAGE'
        },
        pallet: {
          palletId: 'PLT-00001',
          contents: 'Mixed Products',
          totalItems: 48,
          totalWeight: 250,
          destination: 'Warehouse B',
          poNumber: 'PO-2024-001'
        }
      };

      const dataType = record.type?.toLowerCase() || 'product';
      const requestData = sampleData[dataType as keyof typeof sampleData] || sampleData.product;

      const response = await apiService.post('/labels/generate-zpl', {
        templateType: record.type,
        templateId: record.id,
        data: requestData
      });

      setZplCode(response.zpl || '');
      setZplPreviewOpen(true);
    } catch (err: any) {
      message.error(err.message || 'Failed to generate ZPL');
    } finally {
      setZplLoading(false);
    }
  };

  // Open print options modal
  const handlePrintOptions = (record: LabelTemplate) => {
    setSelectedLabelForPrint(record);
    printForm.setFieldsValue({
      copies: printerSettings?.printCopies || 1,
      printer: printerSettings?.defaultPrinter,
      printMethod: 'agent'
    });
    setPrintOptionsOpen(true);
  };

  // Submit print job to print agent
  const handleSubmitPrintJob = async (values: any) => {
    try {
      setSaving(true);
      const { copies, printer, printMethod, ipAddress, port } = values;

      if (printMethod === 'direct' && ipAddress) {
        // Direct network printing
        await apiService.post('/labels/print-direct', {
          ipAddress,
          port: port || 9100,
          labelType: selectedLabelForPrint?.type,
          data: {} // In real app, pass actual data
        });
        message.success('Label sent directly to printer!');
      } else if (printMethod === 'agent' && printAgents.length > 0) {
        // Submit to print agent
        await apiService.post('/print-agent/submit-job', {
          agentId: printAgents[0]?.agentId,
          printerName: printer,
          labelType: selectedLabelForPrint?.type,
          copies
        });
        message.success('Print job submitted to agent!');
        fetchPrintJobs();
      } else {
        // Simple print (increment usage)
        await apiService.post(`/labels/${selectedLabelForPrint?.id}/print`);
        message.success(`Label sent to ${printer}!`);
      }

      setPrintOptionsOpen(false);
      fetchLabels();
    } catch (err: any) {
      message.error(err.message || 'Failed to print');
    } finally {
      setSaving(false);
    }
  };

  // Copy ZPL to clipboard
  const copyZPLToClipboard = () => {
    navigator.clipboard.writeText(zplCode);
    message.success('ZPL code copied to clipboard!');
  };

  // Download ZPL as file
  const downloadZPL = () => {
    const blob = new Blob([zplCode], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${selectedLabelForPrint?.templateName || 'label'}.zpl`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    message.success('ZPL file downloaded!');
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
      render: (type: string) => {
        const colors: Record<string, string> = {
          'Shipping': 'orange',
          'Product': 'blue',
          'Location': 'green',
          'Pallet': 'purple'
        };
        return <Tag color={colors[type] || 'default'}>{type || '-'}</Tag>;
      }
    },
    {
      title: 'Format',
      dataIndex: 'format',
      key: 'format',
      width: 100,
      render: (format: string) => <Tag>{format || 'PDF'}</Tag>
    },
    {
      title: 'Size',
      key: 'size',
      width: 100,
      render: (_: any, record: LabelTemplate) => (
        <span className="text-gray-600">{record.width || 4}" × {record.height || 6}"</span>
      )
    },
    {
      title: 'DPI',
      dataIndex: 'dpi',
      key: 'dpi',
      width: 80,
      render: (dpi: number) => dpi || 203
    },
    {
      title: 'Uses',
      dataIndex: 'uses',
      key: 'uses',
      width: 80,
      render: (uses: number) => <Badge count={uses || 0} showZero color={uses > 100 ? 'green' : uses > 0 ? 'blue' : 'default'} />
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
      width: 280,
      render: (_: any, record: LabelTemplate) => (
        <Space size="small">
          <Tooltip title="View">
            <Button type="text" icon={<EyeOutlined />} size="small" onClick={() => router.push(`/protected/labels/${record.id}`)} />
          </Tooltip>
          <Tooltip title="Print Options">
            <Button type="text" icon={<PrinterOutlined />} size="small" onClick={() => handlePrintOptions(record)} />
          </Tooltip>
          <Tooltip title="Preview ZPL">
            <Button type="text" icon={<CodeOutlined />} size="small" loading={zplLoading && selectedLabelForPrint?.id === record.id} onClick={() => handleGenerateZPL(record)} />
          </Tooltip>
          <Tooltip title="Edit">
            <Button type="text" icon={<EditOutlined />} size="small" onClick={() => handleEdit(record)} />
          </Tooltip>
          <Tooltip title="Delete">
            <Button type="text" danger icon={<DeleteOutlined />} size="small" onClick={() => handleDelete(record)} />
          </Tooltip>
        </Space>
      )
    },
  ];

  const allLabels = getFilteredLabels();
  const shippingLabels = labels.filter(l => l.type?.toLowerCase() === 'shipping');
  const productLabels = labels.filter(l => l.type?.toLowerCase() === 'product');
  const locationLabels = labels.filter(l => l.type?.toLowerCase() === 'location' || l.type?.toLowerCase() === 'pallet');
  const onlinePrinters = printerSettings?.printers?.filter(p => p.status === 'online').length || 0;

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
        <Select placeholder="Format" style={{ width: 150 }} allowClear onChange={(val) => setSearchText(val || '')}>
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
        scroll={{ x: 1200 }}
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
        <Space>
          <Button icon={<SettingOutlined />} onClick={() => {
            if (printerSettings) {
              printerForm.setFieldsValue(printerSettings);
            }
            setPrinterModalOpen(true);
          }}>
            Printer Settings
          </Button>
          <Button type="primary" icon={<PlusOutlined />} size="large" onClick={() => {
            setEditMode(false);
            setSelectedLabel(null);
            form.resetFields();
            form.setFieldsValue({ width: 4, height: 6, dpi: 203 });
            setModalOpen(true);
          }}>
            Create Template
          </Button>
        </Space>
      </div>

      <Row gutter={16}>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Total Templates"
              value={labels.length}
              prefix={<TagsOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Shipping Labels"
              value={shippingLabels.length}
              prefix={<PrinterOutlined />}
              valueStyle={{ color: '#fa8c16' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Product Labels"
              value={productLabels.length}
              prefix={<BarcodeOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Location Labels"
              value={locationLabels.length}
              prefix={<TagsOutlined />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Printer Connection Status */}
      <Card title={<span><ApiOutlined /> Connected Printers</span>} size="small">
        <div className="flex flex-wrap gap-4">
          {printerSettings?.printers?.map(printer => (
            <Card key={printer.id} size="small" className="w-64">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">{printer.name}</div>
                  <div className="text-xs text-gray-500">{printer.location}</div>
                </div>
                <Badge
                  status={printer.status === 'online' ? 'success' : 'error'}
                  text={printer.status}
                />
              </div>
              <div className="mt-2 text-xs text-gray-500">
                {printer.connection === 'network' ? <WifiOutlined className="mr-1" /> : <UsbOutlined className="mr-1" />}
                {printer.connection.toUpperCase()}
                {printer.ipAddress && ` • ${printer.ipAddress}`}
              </div>
              <div className="mt-2 flex gap-1">
                <Button size="small" onClick={() => handleTestPrinter(printer.id)}>Test</Button>
                <Button size="small" danger onClick={() => handleDeletePrinter(printer.id)}>Remove</Button>
              </div>
            </Card>
          ))}
          <Card size="small" className="w-64 flex items-center justify-center border-dashed cursor-pointer hover:border-blue-400" onClick={() => setAddPrinterModalOpen(true)}>
            <div className="text-center text-gray-400">
              <PlusOutlined className="text-2xl mb-2" />
              <div>Add Printer</div>
            </div>
          </Card>
        </div>
      </Card>

      <Card className="shadow-sm">
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={tabItems}
          size="large"
        />
      </Card>

      {/* Create/Edit Label Template Modal */}
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
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="Type" name="type" rules={[{ required: true, message: 'Please select type' }]}>
                <Select placeholder="Select type">
                  <Option value="Shipping">Shipping</Option>
                  <Option value="Product">Product</Option>
                  <Option value="Location">Location</Option>
                  <Option value="Pallet">Pallet</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Format" name="format" rules={[{ required: true, message: 'Please select format' }]}>
                <Select placeholder="Select format">
                  <Option value="PDF">PDF</Option>
                  <Option value="ZPL">ZPL (Zebra)</Option>
                  <Option value="PNG">PNG Image</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item label="Width (inches)" name="width" initialValue={4}>
                <InputNumber min={1} max={10} step={0.5} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="Height (inches)" name="height" initialValue={6}>
                <InputNumber min={1} max={12} step={0.5} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="DPI" name="dpi" initialValue={203}>
                <Select>
                  <Option value={203}>203 DPI</Option>
                  <Option value={300}>300 DPI</Option>
                  <Option value={600}>600 DPI</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
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

      {/* Printer Settings Modal */}
      <Modal
        title="Printer Settings"
        open={printerModalOpen}
        onCancel={() => setPrinterModalOpen(false)}
        onOk={() => printerForm.submit()}
        confirmLoading={saving}
        width={700}
      >
        <Form form={printerForm} layout="vertical" onFinish={handleSavePrinterSettings}>
          <Divider orientation="left">Default Settings</Divider>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="Default Printer" name="defaultPrinter">
                <Select placeholder="Select default printer">
                  {printerSettings?.printers?.map(p => (
                    <Option key={p.id} value={p.name}>{p.name} ({p.location})</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Print Copies" name="printCopies">
                <InputNumber min={1} max={10} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item label="Label Width (in)" name="labelWidth">
                <InputNumber min={1} max={10} step={0.5} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="Label Height (in)" name="labelHeight">
                <InputNumber min={1} max={12} step={0.5} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="DPI" name="dpi">
                <Select>
                  <Option value={203}>203 DPI</Option>
                  <Option value={300}>300 DPI</Option>
                  <Option value={600}>600 DPI</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Divider orientation="left">Advanced Settings</Divider>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item label="Print Darkness (0-30)" name="darkness">
                <InputNumber min={0} max={30} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="Print Speed (1-14)" name="speed">
                <InputNumber min={1} max={14} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="Network Port" name="port">
                <InputNumber min={1} max={65535} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="Auto-print on Order" name="autoprint" valuePropName="checked">
                <Switch />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Test Mode (No actual print)" name="testModeEnabled" valuePropName="checked">
                <Switch />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>

      {/* Add Printer Modal */}
      <Modal
        title="Add New Printer"
        open={addPrinterModalOpen}
        onCancel={() => {
          setAddPrinterModalOpen(false);
          addPrinterForm.resetFields();
        }}
        onOk={() => addPrinterForm.submit()}
        confirmLoading={saving}
      >
        <Form form={addPrinterForm} layout="vertical" onFinish={handleAddPrinter}>
          <Form.Item label="Printer Name" name="name" rules={[{ required: true, message: 'Please enter printer name' }]}>
            <Input placeholder="e.g., Zebra ZD420" />
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="Printer Type" name="type" initialValue="thermal">
                <Select>
                  <Option value="thermal">Thermal</Option>
                  <Option value="laser">Laser</Option>
                  <Option value="inkjet">Inkjet</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Connection" name="connection" initialValue="usb">
                <Select>
                  <Option value="usb">USB</Option>
                  <Option value="network">Network (TCP/IP)</Option>
                  <Option value="bluetooth">Bluetooth</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Form.Item label="IP Address (if network)" name="ipAddress">
            <Input placeholder="192.168.1.100" />
          </Form.Item>
          <Form.Item label="Location" name="location">
            <Input placeholder="e.g., Warehouse A, Shipping Desk" />
          </Form.Item>
        </Form>
      </Modal>

      {/* ZPL Preview Modal */}
      <Modal
        title={<span><CodeOutlined /> ZPL Code Preview - {selectedLabelForPrint?.templateName}</span>}
        open={zplPreviewOpen}
        onCancel={() => {
          setZplPreviewOpen(false);
          setZplCode('');
        }}
        width={900}
        footer={[
          <Button key="close" onClick={() => setZplPreviewOpen(false)}>Close</Button>,
          <Button key="copy" icon={<DownloadOutlined />} onClick={copyZPLToClipboard}>Copy to Clipboard</Button>,
          <Button key="download" icon={<DownloadOutlined />} onClick={downloadZPL}>Download .zpl</Button>,
          <Button key="print" type="primary" icon={<PrinterOutlined />} onClick={() => {
            setZplPreviewOpen(false);
            handlePrintOptions(selectedLabelForPrint!);
          }}>Print</Button>,
        ]}
      >
        <Alert
          message="ZPL (Zebra Programming Language)"
          description="This code can be sent directly to Zebra thermal printers. Copy and paste into Labelary.com to preview, or send to printer via print agent."
          type="info"
          showIcon
          className="mb-4"
        />
        <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm overflow-auto max-h-96">
          <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
            {zplCode || 'No ZPL code generated'}
          </pre>
        </div>
        <div className="mt-4 flex gap-4">
          <Card size="small" className="flex-1">
            <div className="text-sm text-gray-500">Template Type</div>
            <div className="font-semibold">{selectedLabelForPrint?.type || '-'}</div>
          </Card>
          <Card size="small" className="flex-1">
            <div className="text-sm text-gray-500">Size</div>
            <div className="font-semibold">{selectedLabelForPrint?.width || 4}" × {selectedLabelForPrint?.height || 6}"</div>
          </Card>
          <Card size="small" className="flex-1">
            <div className="text-sm text-gray-500">DPI</div>
            <div className="font-semibold">{selectedLabelForPrint?.dpi || 203}</div>
          </Card>
          <Card size="small" className="flex-1">
            <div className="text-sm text-gray-500">Format</div>
            <div className="font-semibold">{selectedLabelForPrint?.format || 'ZPL'}</div>
          </Card>
        </div>
        <div className="mt-4 p-3 bg-blue-50 rounded-lg">
          <div className="font-semibold text-blue-700 mb-2">
            <ThunderboltOutlined /> Quick Preview Options
          </div>
          <Space>
            <a href="http://labelary.com/viewer.html" target="_blank" rel="noopener noreferrer">
              <Button size="small">Labelary Online Viewer</Button>
            </a>
            <a href="https://www.zebra.com/us/en/support-downloads/printer-software/zpl-emulator.html" target="_blank" rel="noopener noreferrer">
              <Button size="small">Zebra ZPL Emulator</Button>
            </a>
          </Space>
        </div>
      </Modal>

      {/* Print Options Modal */}
      <Modal
        title={<span><PrinterOutlined /> Print Options - {selectedLabelForPrint?.templateName}</span>}
        open={printOptionsOpen}
        onCancel={() => setPrintOptionsOpen(false)}
        onOk={() => printForm.submit()}
        confirmLoading={saving}
        width={600}
      >
        <Form form={printForm} layout="vertical" onFinish={handleSubmitPrintJob}>
          <Form.Item label="Print Method" name="printMethod" initialValue="agent">
            <Select>
              <Option value="agent">
                <Space><DesktopOutlined /> Print Agent (Recommended)</Space>
              </Option>
              <Option value="direct">
                <Space><WifiOutlined /> Direct Network Print (TCP/IP)</Space>
              </Option>
              <Option value="browser">
                <Space><CloudServerOutlined /> Browser Print (PDF)</Space>
              </Option>
            </Select>
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="Printer" name="printer">
                <Select placeholder="Select printer">
                  {printerSettings?.printers?.map(p => (
                    <Option key={p.id} value={p.name} disabled={p.status !== 'online'}>
                      {p.name} {p.status !== 'online' && '(Offline)'}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Copies" name="copies" initialValue={1}>
                <InputNumber min={1} max={100} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item noStyle shouldUpdate={(prev, curr) => prev.printMethod !== curr.printMethod}>
            {({ getFieldValue }) =>
              getFieldValue('printMethod') === 'direct' && (
                <Row gutter={16}>
                  <Col span={16}>
                    <Form.Item label="Printer IP Address" name="ipAddress" rules={[{ required: true, message: 'IP required for direct print' }]}>
                      <Input placeholder="192.168.1.100" />
                    </Form.Item>
                  </Col>
                  <Col span={8}>
                    <Form.Item label="Port" name="port" initialValue={9100}>
                      <InputNumber min={1} max={65535} style={{ width: '100%' }} />
                    </Form.Item>
                  </Col>
                </Row>
              )
            }
          </Form.Item>
          {printAgents.length === 0 && (
            <Alert
              message="No Print Agents Connected"
              description={
                <div>
                  <p>Install the Kiaan Print Agent on a Windows PC connected to your printers.</p>
                  <Button size="small" className="mt-2" onClick={() => setPrintAgentModalOpen(true)}>
                    Learn More
                  </Button>
                </div>
              }
              type="warning"
              showIcon
              className="mt-4"
            />
          )}
        </Form>
      </Modal>

      {/* Print Agent Info Modal */}
      <Modal
        title={<span><DesktopOutlined /> Windows Print Agent Setup</span>}
        open={printAgentModalOpen}
        onCancel={() => setPrintAgentModalOpen(false)}
        footer={[<Button key="close" onClick={() => setPrintAgentModalOpen(false)}>Close</Button>]}
        width={700}
      >
        <Alert
          message="Print Agent Overview"
          description="The Kiaan Print Agent is a lightweight Windows application that bridges your local printers with the WMS cloud system."
          type="info"
          showIcon
          className="mb-4"
        />
        <div className="space-y-4">
          <Card size="small" title="How It Works">
            <ol className="list-decimal list-inside space-y-2 text-sm">
              <li>Install the Print Agent on a Windows PC connected to your label printers</li>
              <li>The agent registers with your WMS server and reports available printers</li>
              <li>When you print a label from WMS, the job is queued on the server</li>
              <li>The Print Agent polls for pending jobs and sends ZPL/PDF to local printers</li>
            </ol>
          </Card>
          <Card size="small" title="System Requirements">
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li>Windows 10 or later</li>
              <li>.NET 6.0 Runtime or Electron</li>
              <li>USB or Network connected thermal printer (Zebra recommended)</li>
              <li>Network access to WMS server</li>
            </ul>
          </Card>
          <Card size="small" title="Connected Print Agents">
            {printAgents.length > 0 ? (
              <Table
                size="small"
                dataSource={printAgents}
                rowKey="agentId"
                pagination={false}
                columns={[
                  { title: 'Name', dataIndex: 'agentName', key: 'name' },
                  { title: 'Computer', dataIndex: 'computerName', key: 'computer' },
                  { title: 'Status', dataIndex: 'status', key: 'status', render: (s: string) => <Tag color={s === 'online' ? 'green' : 'red'}>{s}</Tag> },
                  { title: 'Version', dataIndex: 'version', key: 'version' },
                ]}
              />
            ) : (
              <div className="text-center text-gray-500 py-4">
                <CloudServerOutlined className="text-3xl mb-2" />
                <div>No print agents connected yet</div>
              </div>
            )}
          </Card>
          <Card size="small" title="Recent Print Jobs">
            {printJobs.length > 0 ? (
              <Table
                size="small"
                dataSource={printJobs.slice(0, 5)}
                rowKey="jobId"
                pagination={false}
                columns={[
                  { title: 'Type', dataIndex: 'labelType', key: 'type' },
                  { title: 'Printer', dataIndex: 'printerName', key: 'printer' },
                  { title: 'Status', dataIndex: 'status', key: 'status', render: (s: string) => <Tag color={s === 'completed' ? 'green' : s === 'pending' ? 'orange' : 'red'}>{s}</Tag> },
                  { title: 'Created', dataIndex: 'createdAt', key: 'created', render: (d: string) => formatDate(d) },
                ]}
              />
            ) : (
              <div className="text-center text-gray-500 py-4">
                <PrinterOutlined className="text-3xl mb-2" />
                <div>No print jobs yet</div>
              </div>
            )}
          </Card>
        </div>
      </Modal>
    </div>
  );
}
