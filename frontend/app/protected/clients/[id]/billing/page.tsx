'use client';

import React, { useState, useEffect } from 'react';
import { Card, Table, Tag, Button, Statistic, Row, Col, Spin, Alert, Input, Select, Descriptions, Modal, Form, InputNumber, DatePicker, Popconfirm, Tabs, App, Progress, Tooltip } from 'antd';
import {
  ArrowLeftOutlined,
  DollarOutlined,
  FileTextOutlined,
  CalendarOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  WarningOutlined,
  SearchOutlined,
  ReloadOutlined,
  LoadingOutlined,
  PrinterOutlined,
  DownloadOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  CreditCardOutlined,
  SendOutlined,
  EyeOutlined,
  BankOutlined,
  HistoryOutlined,
} from '@ant-design/icons';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import apiService from '@/services/api';
import dayjs from 'dayjs';

const { Search } = Input;
const { Option } = Select;
const { TextArea } = Input;
const { TabPane } = Tabs;

interface Client {
  id: string;
  name: string;
  code: string;
  creditLimit?: number;
  paymentTerms?: string;
  storageRatePerPallet?: number;
  handlingRatePerUnit?: number;
  pickPackRatePerOrder?: number;
  returnsProcessingRate?: number;
}

interface Invoice {
  id: string;
  invoiceNumber: string;
  invoiceDate: string;
  dueDate: string;
  billingPeriodStart?: string;
  billingPeriodEnd?: string;
  status: 'PAID' | 'PENDING' | 'OVERDUE' | 'DRAFT' | 'PARTIAL' | 'CANCELLED';
  storageCharges: number;
  handlingCharges: number;
  pickPackCharges: number;
  shippingCharges: number;
  returnsCharges: number;
  additionalCharges: number;
  totalAmount: number;
  paidAmount: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

interface InvoiceStats {
  totalInvoices: number;
  totalBilled: number;
  totalPaid: number;
  totalOutstanding: number;
  overdueAmount: number;
  overdueCount: number;
  draftCount: number;
  pendingCount: number;
  paidCount: number;
}

interface Payment {
  id: string;
  amount: number;
  paymentDate: string;
  paymentMethod: string;
  reference?: string;
  notes?: string;
}

export default function ClientBillingPage() {
  const { message } = App.useApp();
  const router = useRouter();
  const params = useParams();
  const [client, setClient] = useState<Client | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [stats, setStats] = useState<InvoiceStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Modal states
  const [invoiceModalOpen, setInvoiceModalOpen] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);
  const [saving, setSaving] = useState(false);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [form] = Form.useForm();
  const [paymentForm] = Form.useForm();

  useEffect(() => {
    if (params.id) {
      fetchData();
    }
  }, [params.id]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch client details
      const clientData = await apiService.get(`/clients/${params.id}`);
      setClient(clientData);

      // Fetch invoices from real API
      const invoicesResponse = await apiService.get(`/clients/${params.id}/invoices`);
      setInvoices(invoicesResponse.invoices || []);
      setStats(invoicesResponse.stats || {
        totalInvoices: 0,
        totalBilled: 0,
        totalPaid: 0,
        totalOutstanding: 0,
        overdueAmount: 0,
        overdueCount: 0,
        draftCount: 0,
        pendingCount: 0,
        paidCount: 0,
      });

    } catch (err: any) {
      console.error('Failed to fetch data:', err);
      setError(err.message || 'Failed to load billing');
    } finally {
      setLoading(false);
    }
  };

  // Filter invoices
  const filteredInvoices = invoices.filter(inv => {
    let matches = true;

    if (searchText) {
      const search = searchText.toLowerCase();
      matches = inv.invoiceNumber?.toLowerCase().includes(search) ||
                inv.notes?.toLowerCase().includes(search);
    }

    if (statusFilter !== 'all') {
      matches = matches && inv.status === statusFilter;
    }

    return matches;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PAID': return 'green';
      case 'PENDING': return 'orange';
      case 'OVERDUE': return 'red';
      case 'DRAFT': return 'default';
      case 'PARTIAL': return 'blue';
      case 'CANCELLED': return 'gray';
      default: return 'default';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PAID': return <CheckCircleOutlined />;
      case 'PENDING': return <ClockCircleOutlined />;
      case 'OVERDUE': return <WarningOutlined />;
      case 'PARTIAL': return <CreditCardOutlined />;
      default: return <FileTextOutlined />;
    }
  };

  const handleCreateInvoice = () => {
    setEditingInvoice(null);
    form.resetFields();
    // Set defaults
    form.setFieldsValue({
      invoiceDate: dayjs(),
      dueDate: dayjs().add(30, 'day'),
      billingPeriodStart: dayjs().startOf('month'),
      billingPeriodEnd: dayjs().endOf('month'),
      storageCharges: 0,
      handlingCharges: 0,
      pickPackCharges: 0,
      shippingCharges: 0,
      returnsCharges: 0,
      additionalCharges: 0,
      status: 'DRAFT',
    });
    setInvoiceModalOpen(true);
  };

  const handleEditInvoice = (invoice: Invoice) => {
    setEditingInvoice(invoice);
    form.setFieldsValue({
      invoiceDate: dayjs(invoice.invoiceDate),
      dueDate: dayjs(invoice.dueDate),
      billingPeriodStart: invoice.billingPeriodStart ? dayjs(invoice.billingPeriodStart) : undefined,
      billingPeriodEnd: invoice.billingPeriodEnd ? dayjs(invoice.billingPeriodEnd) : undefined,
      storageCharges: invoice.storageCharges,
      handlingCharges: invoice.handlingCharges,
      pickPackCharges: invoice.pickPackCharges,
      shippingCharges: invoice.shippingCharges,
      returnsCharges: invoice.returnsCharges,
      additionalCharges: invoice.additionalCharges,
      status: invoice.status,
      notes: invoice.notes,
    });
    setInvoiceModalOpen(true);
  };

  const handleSaveInvoice = async (values: any) => {
    try {
      setSaving(true);

      const invoiceData = {
        invoiceDate: values.invoiceDate.toISOString(),
        dueDate: values.dueDate.toISOString(),
        periodStart: values.billingPeriodStart?.toISOString(),
        periodEnd: values.billingPeriodEnd?.toISOString(),
        storageCharges: values.storageCharges || 0,
        handlingCharges: values.handlingCharges || 0,
        pickPackCharges: values.pickPackCharges || 0,
        shippingCharges: values.shippingCharges || 0,
        returnsCharges: values.returnsCharges || 0,
        additionalCharges: values.additionalCharges || 0,
        status: values.status,
        notes: values.notes,
      };

      if (editingInvoice) {
        await apiService.put(`/clients/${params.id}/invoices/${editingInvoice.id}`, invoiceData);
        message.success('Invoice updated successfully!');
      } else {
        await apiService.post(`/clients/${params.id}/invoices`, invoiceData);
        message.success('Invoice created successfully!');
      }

      setInvoiceModalOpen(false);
      fetchData();
    } catch (err: any) {
      console.error('Failed to save invoice:', err);
      message.error(err.message || 'Failed to save invoice');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteInvoice = async (invoiceId: string) => {
    try {
      await apiService.delete(`/clients/${params.id}/invoices/${invoiceId}`);
      message.success('Invoice deleted successfully!');
      fetchData();
    } catch (err: any) {
      console.error('Failed to delete invoice:', err);
      message.error(err.message || 'Failed to delete invoice');
    }
  };

  const handleRecordPayment = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    paymentForm.resetFields();
    paymentForm.setFieldsValue({
      amount: invoice.totalAmount - invoice.paidAmount,
      paymentDate: dayjs(),
      paymentMethod: 'BANK_TRANSFER',
    });
    setPaymentModalOpen(true);
  };

  const handleSavePayment = async (values: any) => {
    if (!selectedInvoice) return;

    try {
      setSaving(true);

      await apiService.post(`/clients/${params.id}/invoices/${selectedInvoice.id}/payments`, {
        amount: values.amount,
        paymentDate: values.paymentDate.toISOString(),
        paymentMethod: values.paymentMethod,
        reference: values.reference,
        notes: values.notes,
      });

      message.success('Payment recorded successfully!');
      setPaymentModalOpen(false);
      fetchData();
    } catch (err: any) {
      console.error('Failed to record payment:', err);
      message.error(err.message || 'Failed to record payment');
    } finally {
      setSaving(false);
    }
  };

  const handleViewInvoice = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setViewModalOpen(true);
  };

  const handleSendInvoice = async (invoiceId: string) => {
    try {
      await apiService.put(`/clients/${params.id}/invoices/${invoiceId}`, {
        status: 'PENDING',
      });
      message.success('Invoice sent to client!');
      fetchData();
    } catch (err: any) {
      message.error(err.message || 'Failed to send invoice');
    }
  };

  // Calculate form total
  const formValues = Form.useWatch([], form);
  const calculatedTotal = (formValues?.storageCharges || 0) +
    (formValues?.handlingCharges || 0) +
    (formValues?.pickPackCharges || 0) +
    (formValues?.shippingCharges || 0) +
    (formValues?.returnsCharges || 0) +
    (formValues?.additionalCharges || 0);

  const columns = [
    {
      title: 'Invoice #',
      dataIndex: 'invoiceNumber',
      key: 'invoiceNumber',
      width: 140,
      render: (num: string, record: Invoice) => (
        <Button type="link" onClick={() => handleViewInvoice(record)} className="p-0 font-semibold">
          {num}
        </Button>
      ),
    },
    {
      title: 'Invoice Date',
      dataIndex: 'invoiceDate',
      key: 'date',
      width: 110,
      render: (date: string) => new Date(date).toLocaleDateString('en-GB'),
    },
    {
      title: 'Due Date',
      dataIndex: 'dueDate',
      key: 'dueDate',
      width: 110,
      render: (date: string, record: Invoice) => {
        const isOverdue = new Date(date) < new Date() && record.status !== 'PAID';
        return (
          <span className={isOverdue ? 'text-red-600 font-semibold' : ''}>
            {new Date(date).toLocaleDateString('en-GB')}
          </span>
        );
      },
    },
    {
      title: 'Total',
      dataIndex: 'totalAmount',
      key: 'total',
      width: 120,
      render: (amt: number) => (
        <span className="font-bold">£{amt.toLocaleString()}</span>
      ),
    },
    {
      title: 'Paid',
      dataIndex: 'paidAmount',
      key: 'paid',
      width: 100,
      render: (amt: number) => (
        <span className="text-green-600">£{amt.toLocaleString()}</span>
      ),
    },
    {
      title: 'Outstanding',
      key: 'outstanding',
      width: 110,
      render: (_: any, record: Invoice) => {
        const outstanding = record.totalAmount - record.paidAmount;
        return (
          <span className={outstanding > 0 ? 'text-orange-600 font-semibold' : 'text-green-600'}>
            £{outstanding.toLocaleString()}
          </span>
        );
      },
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 130,
      render: (status: string) => (
        <Tag color={getStatusColor(status)}>
          {getStatusIcon(status)} {status.replace('_', ' ')}
        </Tag>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 200,
      render: (_: any, record: Invoice) => (
        <div className="flex gap-1 flex-wrap">
          <Tooltip title="View Details">
            <Button type="text" icon={<EyeOutlined />} size="small" onClick={() => handleViewInvoice(record)} />
          </Tooltip>
          {record.status === 'DRAFT' && (
            <Tooltip title="Send to Client">
              <Button type="text" icon={<SendOutlined />} size="small" className="text-blue-500" onClick={() => handleSendInvoice(record.id)} />
            </Tooltip>
          )}
          {(record.status === 'PENDING' || record.status === 'OVERDUE' || record.status === 'PARTIAL') && (
            <Tooltip title="Record Payment">
              <Button type="text" icon={<CreditCardOutlined />} size="small" className="text-green-500" onClick={() => handleRecordPayment(record)} />
            </Tooltip>
          )}
          {record.status !== 'PAID' && (
            <Tooltip title="Edit">
              <Button type="text" icon={<EditOutlined />} size="small" onClick={() => handleEditInvoice(record)} />
            </Tooltip>
          )}
          {record.status === 'DRAFT' && (
            <Popconfirm
              title="Delete Invoice"
              description="Are you sure you want to delete this invoice?"
              onConfirm={() => handleDeleteInvoice(record.id)}
              okText="Delete"
              okButtonProps={{ danger: true }}
            >
              <Tooltip title="Delete">
                <Button type="text" icon={<DeleteOutlined />} size="small" danger />
              </Tooltip>
            </Popconfirm>
          )}
        </div>
      ),
    },
  ];

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spin indicator={<LoadingOutlined style={{ fontSize: 48 }} spin />} tip="Loading billing..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <Alert
          type="error"
          message="Error Loading Billing"
          description={error}
          action={
            <Button onClick={() => router.push('/clients')}>
              Back to Clients
            </Button>
          }
        />
      </div>
    );
  }

  const outstanding = (stats?.totalOutstanding || 0);
  const creditUsedPercent = client?.creditLimit ? Math.min((outstanding / client.creditLimit) * 100, 100) : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <Button
            icon={<ArrowLeftOutlined />}
            onClick={() => router.push(`/clients/${params.id}`)}
          >
            Back to Client
          </Button>
          <div>
            <h1 className="text-3xl font-bold">
              <DollarOutlined className="mr-2 text-green-500" />
              {client?.name} - Billing
            </h1>
            <p className="text-gray-600 mt-1">
              3PL service charges and invoices for this client
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button type="primary" icon={<PlusOutlined />} onClick={handleCreateInvoice}>
            Create Invoice
          </Button>
          <Button icon={<ReloadOutlined />} onClick={fetchData}>
            Refresh
          </Button>
        </div>
      </div>

      {/* Breadcrumb Links */}
      <div className="flex gap-2 text-sm">
        <Link href="/clients" className="text-blue-600 hover:underline">Clients</Link>
        <span>/</span>
        <Link href={`/clients/${params.id}`} className="text-blue-600 hover:underline">{client?.name}</Link>
        <span>/</span>
        <span className="text-gray-600">Billing</span>
      </div>

      {/* Stats Overview */}
      <Row gutter={16}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Total Billed"
              value={stats?.totalBilled || 0}
              prefix="£"
              valueStyle={{ color: '#1890ff' }}
            />
            <div className="text-xs text-gray-500 mt-1">
              {stats?.totalInvoices || 0} invoices
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Total Paid"
              value={stats?.totalPaid || 0}
              prefix="£"
              valueStyle={{ color: '#52c41a' }}
            />
            <div className="text-xs text-gray-500 mt-1">
              {stats?.paidCount || 0} paid invoices
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Outstanding"
              value={stats?.totalOutstanding || 0}
              prefix="£"
              valueStyle={{ color: '#faad14' }}
            />
            <div className="text-xs text-gray-500 mt-1">
              {stats?.pendingCount || 0} pending
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Overdue"
              value={stats?.overdueAmount || 0}
              prefix="£"
              valueStyle={{ color: '#ff4d4f' }}
            />
            <div className="text-xs text-gray-500 mt-1">
              {stats?.overdueCount || 0} overdue invoices
            </div>
          </Card>
        </Col>
      </Row>

      {/* Credit Status & Rates */}
      <Row gutter={16}>
        <Col xs={24} lg={12}>
          <Card title={<span><BankOutlined className="mr-2" />Credit Status</span>}>
            <div className="space-y-4">
              <Descriptions column={2} size="small">
                <Descriptions.Item label="Credit Limit">
                  <span className="font-bold text-lg">£{(client?.creditLimit || 0).toLocaleString()}</span>
                </Descriptions.Item>
                <Descriptions.Item label="Payment Terms">
                  <Tag color="blue">{client?.paymentTerms || 'Not set'}</Tag>
                </Descriptions.Item>
                <Descriptions.Item label="Available Credit">
                  <span className="font-bold text-green-600">
                    £{Math.max(0, (client?.creditLimit || 0) - outstanding).toLocaleString()}
                  </span>
                </Descriptions.Item>
                <Descriptions.Item label="Credit Used">
                  <span className="font-bold text-orange-500">
                    £{outstanding.toLocaleString()}
                  </span>
                </Descriptions.Item>
              </Descriptions>
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm text-gray-600">Credit Utilization</span>
                  <span className="text-sm font-semibold">{creditUsedPercent.toFixed(1)}%</span>
                </div>
                <Progress
                  percent={creditUsedPercent}
                  showInfo={false}
                  strokeColor={creditUsedPercent > 80 ? '#ff4d4f' : creditUsedPercent > 50 ? '#faad14' : '#52c41a'}
                />
              </div>
            </div>
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="3PL Service Rates" className="bg-gradient-to-r from-blue-50 to-purple-50">
            <Row gutter={[16, 16]}>
              <Col span={12}>
                <div className="text-center p-3 bg-white rounded-lg shadow-sm">
                  <div className="text-gray-500 text-xs">Storage (per pallet/month)</div>
                  <div className="text-xl font-bold text-blue-600">
                    £{(client?.storageRatePerPallet || 15.00).toFixed(2)}
                  </div>
                </div>
              </Col>
              <Col span={12}>
                <div className="text-center p-3 bg-white rounded-lg shadow-sm">
                  <div className="text-gray-500 text-xs">Handling (per unit)</div>
                  <div className="text-xl font-bold text-green-600">
                    £{(client?.handlingRatePerUnit || 0.50).toFixed(2)}
                  </div>
                </div>
              </Col>
              <Col span={12}>
                <div className="text-center p-3 bg-white rounded-lg shadow-sm">
                  <div className="text-gray-500 text-xs">Pick & Pack (per order)</div>
                  <div className="text-xl font-bold text-purple-600">
                    £{(client?.pickPackRatePerOrder || 2.50).toFixed(2)}
                  </div>
                </div>
              </Col>
              <Col span={12}>
                <div className="text-center p-3 bg-white rounded-lg shadow-sm">
                  <div className="text-gray-500 text-xs">Returns Processing</div>
                  <div className="text-xl font-bold text-orange-600">
                    £{(client?.returnsProcessingRate || 3.00).toFixed(2)}
                  </div>
                </div>
              </Col>
            </Row>
          </Card>
        </Col>
      </Row>

      {/* Filters */}
      <Card>
        <div className="flex flex-wrap gap-4 items-center justify-between">
          <div className="flex gap-4 flex-wrap">
            <Search
              placeholder="Search invoices..."
              style={{ width: 250 }}
              prefix={<SearchOutlined />}
              allowClear
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
            />
            <Select
              value={statusFilter}
              onChange={setStatusFilter}
              style={{ width: 150 }}
              placeholder="Status"
            >
              <Option value="all">All Status</Option>
              <Option value="DRAFT">Draft</Option>
              <Option value="PENDING">Pending</Option>
              <Option value="PARTIAL">Partially Paid</Option>
              <Option value="PAID">Paid</Option>
              <Option value="OVERDUE">Overdue</Option>
              <Option value="CANCELLED">Cancelled</Option>
            </Select>
          </div>
          <div className="text-gray-500">
            Showing {filteredInvoices.length} of {invoices.length} invoices
          </div>
        </div>
      </Card>

      {/* Invoices Table */}
      <Card title="Invoices">
        <Table
          dataSource={filteredInvoices}
          columns={columns}
          rowKey="id"
          scroll={{ x: 1200 }}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total) => `Total ${total} invoices`,
          }}
        />
      </Card>

      {/* Create/Edit Invoice Modal */}
      <Modal
        title={editingInvoice ? `Edit Invoice ${editingInvoice.invoiceNumber}` : 'Create New Invoice'}
        open={invoiceModalOpen}
        onCancel={() => setInvoiceModalOpen(false)}
        onOk={() => form.submit()}
        width={800}
        confirmLoading={saving}
        okText={editingInvoice ? 'Update Invoice' : 'Create Invoice'}
      >
        <Form form={form} layout="vertical" onFinish={handleSaveInvoice}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="Invoice Date"
                name="invoiceDate"
                rules={[{ required: true, message: 'Please select invoice date' }]}
              >
                <DatePicker className="w-full" format="DD/MM/YYYY" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="Due Date"
                name="dueDate"
                rules={[{ required: true, message: 'Please select due date' }]}
              >
                <DatePicker className="w-full" format="DD/MM/YYYY" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="Billing Period Start" name="billingPeriodStart">
                <DatePicker className="w-full" format="DD/MM/YYYY" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Billing Period End" name="billingPeriodEnd">
                <DatePicker className="w-full" format="DD/MM/YYYY" />
              </Form.Item>
            </Col>
          </Row>

          <div className="bg-gray-50 p-4 rounded-lg mb-4">
            <h4 className="font-semibold mb-3">Service Charges</h4>
            <Row gutter={16}>
              <Col span={8}>
                <Form.Item label="Storage Charges" name="storageCharges">
                  <InputNumber
                    className="w-full"
                    prefix="£"
                    precision={2}
                    min={0}
                  />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item label="Handling Charges" name="handlingCharges">
                  <InputNumber
                    className="w-full"
                    prefix="£"
                    precision={2}
                    min={0}
                  />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item label="Pick & Pack Charges" name="pickPackCharges">
                  <InputNumber
                    className="w-full"
                    prefix="£"
                    precision={2}
                    min={0}
                  />
                </Form.Item>
              </Col>
            </Row>
            <Row gutter={16}>
              <Col span={8}>
                <Form.Item label="Shipping Charges" name="shippingCharges">
                  <InputNumber
                    className="w-full"
                    prefix="£"
                    precision={2}
                    min={0}
                  />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item label="Returns Charges" name="returnsCharges">
                  <InputNumber
                    className="w-full"
                    prefix="£"
                    precision={2}
                    min={0}
                  />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item label="Additional Charges" name="additionalCharges">
                  <InputNumber
                    className="w-full"
                    prefix="£"
                    precision={2}
                    min={0}
                  />
                </Form.Item>
              </Col>
            </Row>
            <div className="text-right border-t pt-3 mt-2">
              <span className="text-lg font-semibold">
                Total: <span className="text-green-600">£{calculatedTotal.toLocaleString()}</span>
              </span>
            </div>
          </div>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="Status"
                name="status"
                rules={[{ required: true, message: 'Please select status' }]}
              >
                <Select>
                  <Option value="DRAFT">Draft</Option>
                  <Option value="PENDING">Pending (Send to Client)</Option>
                  {editingInvoice && <Option value="PAID">Paid</Option>}
                  {editingInvoice && <Option value="CANCELLED">Cancelled</Option>}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item label="Notes" name="notes">
            <TextArea rows={3} placeholder="Any additional notes for this invoice..." />
          </Form.Item>
        </Form>
      </Modal>

      {/* Record Payment Modal */}
      <Modal
        title={`Record Payment - ${selectedInvoice?.invoiceNumber}`}
        open={paymentModalOpen}
        onCancel={() => setPaymentModalOpen(false)}
        onOk={() => paymentForm.submit()}
        confirmLoading={saving}
        okText="Record Payment"
      >
        {selectedInvoice && (
          <div className="mb-4 p-3 bg-blue-50 rounded-lg">
            <div className="flex justify-between">
              <span>Invoice Total:</span>
              <span className="font-bold">£{selectedInvoice.totalAmount.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span>Already Paid:</span>
              <span className="text-green-600">£{selectedInvoice.paidAmount.toLocaleString()}</span>
            </div>
            <div className="flex justify-between border-t mt-2 pt-2">
              <span className="font-semibold">Outstanding:</span>
              <span className="font-bold text-orange-600">
                £{(selectedInvoice.totalAmount - selectedInvoice.paidAmount).toLocaleString()}
              </span>
            </div>
          </div>
        )}
        <Form form={paymentForm} layout="vertical" onFinish={handleSavePayment}>
          <Form.Item
            label="Payment Amount"
            name="amount"
            rules={[
              { required: true, message: 'Please enter payment amount' },
              {
                validator: (_, value) => {
                  if (selectedInvoice && value > (selectedInvoice.totalAmount - selectedInvoice.paidAmount)) {
                    return Promise.reject('Amount cannot exceed outstanding balance');
                  }
                  return Promise.resolve();
                }
              }
            ]}
          >
            <InputNumber
              className="w-full"
              prefix="£"
              precision={2}
              min={0.01}
              max={selectedInvoice ? selectedInvoice.totalAmount - selectedInvoice.paidAmount : undefined}
            />
          </Form.Item>

          <Form.Item
            label="Payment Date"
            name="paymentDate"
            rules={[{ required: true, message: 'Please select payment date' }]}
          >
            <DatePicker className="w-full" format="DD/MM/YYYY" />
          </Form.Item>

          <Form.Item
            label="Payment Method"
            name="paymentMethod"
            rules={[{ required: true, message: 'Please select payment method' }]}
          >
            <Select>
              <Option value="BANK_TRANSFER">Bank Transfer</Option>
              <Option value="CREDIT_CARD">Credit Card</Option>
              <Option value="DEBIT_CARD">Debit Card</Option>
              <Option value="CHEQUE">Cheque</Option>
              <Option value="CASH">Cash</Option>
              <Option value="OTHER">Other</Option>
            </Select>
          </Form.Item>

          <Form.Item label="Reference Number" name="reference">
            <Input placeholder="e.g., Bank transfer reference" />
          </Form.Item>

          <Form.Item label="Notes" name="notes">
            <TextArea rows={2} placeholder="Payment notes..." />
          </Form.Item>
        </Form>
      </Modal>

      {/* View Invoice Modal */}
      <Modal
        title={`Invoice ${selectedInvoice?.invoiceNumber}`}
        open={viewModalOpen}
        onCancel={() => setViewModalOpen(false)}
        footer={[
          <Button key="close" onClick={() => setViewModalOpen(false)}>
            Close
          </Button>,
          selectedInvoice?.status === 'DRAFT' && (
            <Button
              key="send"
              type="primary"
              icon={<SendOutlined />}
              onClick={() => {
                handleSendInvoice(selectedInvoice.id);
                setViewModalOpen(false);
              }}
            >
              Send to Client
            </Button>
          ),
          (selectedInvoice?.status === 'PENDING' || selectedInvoice?.status === 'OVERDUE') && (
            <Button
              key="pay"
              type="primary"
              icon={<CreditCardOutlined />}
              onClick={() => {
                setViewModalOpen(false);
                handleRecordPayment(selectedInvoice);
              }}
            >
              Record Payment
            </Button>
          ),
        ].filter(Boolean)}
        width={700}
      >
        {selectedInvoice && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <Tag color={getStatusColor(selectedInvoice.status)} className="text-lg px-3 py-1">
                  {getStatusIcon(selectedInvoice.status)} {selectedInvoice.status.replace('_', ' ')}
                </Tag>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-green-600">
                  £{selectedInvoice.totalAmount.toLocaleString()}
                </div>
                <div className="text-sm text-gray-500">Total Amount</div>
              </div>
            </div>

            <Descriptions bordered column={2} size="small">
              <Descriptions.Item label="Invoice Date">
                {new Date(selectedInvoice.invoiceDate).toLocaleDateString('en-GB')}
              </Descriptions.Item>
              <Descriptions.Item label="Due Date">
                {new Date(selectedInvoice.dueDate).toLocaleDateString('en-GB')}
              </Descriptions.Item>
              {selectedInvoice.billingPeriodStart && (
                <Descriptions.Item label="Billing Period" span={2}>
                  {new Date(selectedInvoice.billingPeriodStart).toLocaleDateString('en-GB')} - {' '}
                  {selectedInvoice.billingPeriodEnd ? new Date(selectedInvoice.billingPeriodEnd).toLocaleDateString('en-GB') : 'N/A'}
                </Descriptions.Item>
              )}
            </Descriptions>

            <Card title="Charge Breakdown" size="small">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Storage Charges</span>
                  <span>£{selectedInvoice.storageCharges.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Handling Charges</span>
                  <span>£{selectedInvoice.handlingCharges.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Pick & Pack Charges</span>
                  <span>£{selectedInvoice.pickPackCharges.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Shipping Charges</span>
                  <span>£{selectedInvoice.shippingCharges.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Returns Charges</span>
                  <span>£{selectedInvoice.returnsCharges.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Additional Charges</span>
                  <span>£{selectedInvoice.additionalCharges.toLocaleString()}</span>
                </div>
                <div className="flex justify-between border-t pt-2 font-bold text-lg">
                  <span>Total</span>
                  <span>£{selectedInvoice.totalAmount.toLocaleString()}</span>
                </div>
              </div>
            </Card>

            <Card title="Payment Status" size="small">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Total Amount</span>
                  <span>£{selectedInvoice.totalAmount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-green-600">
                  <span>Paid Amount</span>
                  <span>£{selectedInvoice.paidAmount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between border-t pt-2 font-bold">
                  <span>Outstanding</span>
                  <span className={selectedInvoice.totalAmount - selectedInvoice.paidAmount > 0 ? 'text-orange-600' : 'text-green-600'}>
                    £{(selectedInvoice.totalAmount - selectedInvoice.paidAmount).toLocaleString()}
                  </span>
                </div>
              </div>
              {selectedInvoice.paidAmount > 0 && selectedInvoice.totalAmount > 0 && (
                <Progress
                  percent={Math.round((selectedInvoice.paidAmount / selectedInvoice.totalAmount) * 100)}
                  status={selectedInvoice.paidAmount >= selectedInvoice.totalAmount ? 'success' : 'active'}
                  className="mt-3"
                />
              )}
            </Card>

            {selectedInvoice.notes && (
              <Card title="Notes" size="small">
                <p className="text-gray-600">{selectedInvoice.notes}</p>
              </Card>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
