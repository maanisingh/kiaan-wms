'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Card, Descriptions, Tag, Button, Space, Table, Spin, Alert, Modal, Form, Input, InputNumber, DatePicker, message, Divider, Typography, Timeline, App, Tabs } from 'antd';
import {
  ArrowLeftOutlined,
  PrinterOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  EditOutlined,
  DeleteOutlined,
  DollarOutlined,
  InboxOutlined,
  FileTextOutlined,
  ReloadOutlined,
  HistoryOutlined,
  ShoppingCartOutlined,
} from '@ant-design/icons';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { formatCurrency, formatDate, getStatusColor } from '@/lib/utils';
import apiService from '@/services/api';
import dayjs from 'dayjs';

const { Text, Title } = Typography;

interface PurchaseOrderItem {
  id: string;
  productId: string;
  productName: string;
  productSku: string;
  quantity: number;
  receivedQuantity?: number;
  unitPrice: number;
  totalPrice: number;
  isBundle?: boolean;
}

interface PurchaseOrder {
  id: string;
  poNumber: string;
  supplier: string;
  supplierId: string;
  supplierContact?: string;
  supplierEmail?: string;
  status: string;
  paymentStatus?: string;
  items: PurchaseOrderItem[];
  totalAmount: number;
  paidAmount?: number;
  orderDate: string;
  expectedDelivery?: string;
  receivedDate?: string;
  approvedDate?: string;
  approvedBy?: string;
  paidDate?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  history?: Array<{
    action: string;
    user: string;
    date: string;
    notes?: string;
  }>;
}

export default function PurchaseOrderDetailPage({ params }: { params: { id: string } }) {
  const { modal, message: msg } = App.useApp();
  const router = useRouter();
  const printRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [purchaseOrder, setPurchaseOrder] = useState<PurchaseOrder | null>(null);
  const [activeTab, setActiveTab] = useState('details');

  // Payment modal state
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [paymentForm] = Form.useForm();
  const [paymentLoading, setPaymentLoading] = useState(false);

  // Fetch purchase order details
  const fetchPurchaseOrder = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await apiService.get(`/purchase-orders/${params.id}`);
      setPurchaseOrder(data);
    } catch (err: any) {
      console.error('Failed to fetch purchase order:', err);
      setError(err.message || 'Failed to load purchase order details');
    } finally {
      setLoading(false);
    }
  }, [params.id]);

  useEffect(() => {
    fetchPurchaseOrder();
  }, [fetchPurchaseOrder]);

  // Approve PO
  const handleApprove = async () => {
    modal.confirm({
      title: 'Approve Purchase Order',
      content: `Are you sure you want to approve ${purchaseOrder?.poNumber}?`,
      okText: 'Approve',
      okType: 'primary',
      onOk: async () => {
        try {
          await apiService.post(`/purchase-orders/${params.id}/approve`, {});
          msg.success('Purchase order approved successfully');
          fetchPurchaseOrder();
        } catch (err: any) {
          msg.error(err.message || 'Failed to approve purchase order');
        }
      },
    });
  };

  // Reject PO
  const handleReject = async () => {
    modal.confirm({
      title: 'Reject Purchase Order',
      content: `Are you sure you want to reject ${purchaseOrder?.poNumber}?`,
      okText: 'Reject',
      okType: 'danger',
      onOk: async () => {
        try {
          await apiService.post(`/purchase-orders/${params.id}/reject`, { reason: 'Rejected by user' });
          msg.success('Purchase order rejected');
          fetchPurchaseOrder();
        } catch (err: any) {
          msg.error(err.message || 'Failed to reject purchase order');
        }
      },
    });
  };

  // Mark as Paid
  const handleMarkPaid = async (values: any) => {
    try {
      setPaymentLoading(true);
      await apiService.post(`/purchase-orders/${params.id}/payment`, {
        amount: values.amount,
        paymentMethod: values.paymentMethod,
        reference: values.reference,
        notes: values.notes,
        paymentDate: values.paymentDate?.toISOString() || new Date().toISOString(),
      });
      msg.success('Payment recorded successfully');
      setPaymentModalOpen(false);
      paymentForm.resetFields();
      fetchPurchaseOrder();
    } catch (err: any) {
      msg.error(err.message || 'Failed to record payment');
    } finally {
      setPaymentLoading(false);
    }
  };

  // Print PO
  const handlePrint = () => {
    if (!purchaseOrder) {
      msg.error('No purchase order data to print');
      return;
    }

    const printWindow = window.open('', '_blank', 'width=800,height=600');
    if (!printWindow) {
      msg.error('Please allow popups to print. Check your browser settings.');
      return;
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Purchase Order - ${purchaseOrder.poNumber}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; color: #333; }
            .header { display: flex; justify-content: space-between; border-bottom: 2px solid #333; padding-bottom: 20px; margin-bottom: 20px; }
            .company-info { font-size: 12px; }
            .po-title { font-size: 24px; font-weight: bold; color: #1890ff; }
            .po-number { font-size: 18px; margin-top: 5px; }
            .section { margin: 20px 0; }
            .section-title { font-weight: bold; font-size: 14px; border-bottom: 1px solid #ddd; padding-bottom: 5px; margin-bottom: 10px; }
            .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
            .info-item { margin-bottom: 5px; }
            .info-label { color: #666; font-size: 12px; }
            .info-value { font-weight: 500; }
            table { width: 100%; border-collapse: collapse; margin: 20px 0; }
            th, td { border: 1px solid #ddd; padding: 10px; text-align: left; }
            th { background: #f5f5f5; font-weight: bold; }
            .text-right { text-align: right; }
            .total-row { font-weight: bold; background: #f9f9f9; }
            .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #ddd; text-align: center; font-size: 12px; color: #666; }
            .status { display: inline-block; padding: 4px 12px; border-radius: 4px; font-size: 12px; font-weight: 500; }
            .status-pending { background: #fff7e6; color: #fa8c16; }
            .status-approved { background: #f6ffed; color: #52c41a; }
            .status-received { background: #f9f0ff; color: #722ed1; }
            @media print { body { print-color-adjust: exact; -webkit-print-color-adjust: exact; } }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <div class="po-title">PURCHASE ORDER</div>
              <div class="po-number">${purchaseOrder.poNumber}</div>
            </div>
            <div class="company-info">
              <strong>Kiaan WMS</strong><br/>
              Order Date: ${formatDate(purchaseOrder.orderDate)}<br/>
              ${purchaseOrder.expectedDelivery ? `Expected: ${formatDate(purchaseOrder.expectedDelivery)}` : ''}
            </div>
          </div>

          <div class="info-grid">
            <div class="section">
              <div class="section-title">Supplier Information</div>
              <div class="info-item">
                <div class="info-value">${purchaseOrder.supplier}</div>
              </div>
              ${purchaseOrder.supplierContact ? `<div class="info-item"><div class="info-label">Contact:</div><div class="info-value">${purchaseOrder.supplierContact}</div></div>` : ''}
              ${purchaseOrder.supplierEmail ? `<div class="info-item"><div class="info-label">Email:</div><div class="info-value">${purchaseOrder.supplierEmail}</div></div>` : ''}
            </div>
            <div class="section">
              <div class="section-title">Order Status</div>
              <div class="info-item">
                <span class="status status-${purchaseOrder.status}">${purchaseOrder.status?.toUpperCase()}</span>
              </div>
              ${purchaseOrder.paymentStatus ? `<div class="info-item"><div class="info-label">Payment:</div><div class="info-value">${purchaseOrder.paymentStatus}</div></div>` : ''}
            </div>
          </div>

          <div class="section">
            <div class="section-title">Order Items</div>
            <table>
              <thead>
                <tr>
                  <th>SKU</th>
                  <th>Product</th>
                  <th class="text-right">Qty</th>
                  <th class="text-right">Unit Price</th>
                  <th class="text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                ${purchaseOrder.items?.map(item => `
                  <tr>
                    <td>${item.productSku}</td>
                    <td>${item.productName}${item.isBundle ? ' [BUNDLE]' : ''}</td>
                    <td class="text-right">${item.quantity}</td>
                    <td class="text-right">${formatCurrency(item.unitPrice)}</td>
                    <td class="text-right">${formatCurrency(item.totalPrice)}</td>
                  </tr>
                `).join('') || '<tr><td colspan="5">No items</td></tr>'}
                <tr class="total-row">
                  <td colspan="4" class="text-right">Total Amount:</td>
                  <td class="text-right">${formatCurrency(purchaseOrder.totalAmount)}</td>
                </tr>
              </tbody>
            </table>
          </div>

          ${purchaseOrder.notes ? `
            <div class="section">
              <div class="section-title">Notes</div>
              <p>${purchaseOrder.notes}</p>
            </div>
          ` : ''}

          <div class="footer">
            <p>This is a computer-generated document. Printed on ${new Date().toLocaleString()}</p>
          </div>
        </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      try {
        printWindow.print();
      } catch (err) {
        console.error('Print error:', err);
        msg.error('Failed to print. Please try again.');
      }
    }, 500);
  };

  // Delete PO
  const handleDelete = () => {
    modal.confirm({
      title: 'Delete Purchase Order',
      content: `Are you sure you want to delete ${purchaseOrder?.poNumber}? This action cannot be undone.`,
      okText: 'Delete',
      okType: 'danger',
      onOk: async () => {
        try {
          await apiService.delete(`/purchase-orders/${params.id}`);
          msg.success('Purchase order deleted');
          router.push('/purchase-orders');
        } catch (err: any) {
          msg.error(err.message || 'Failed to delete purchase order');
        }
      },
    });
  };

  // Item columns
  const itemColumns = [
    {
      title: 'SKU',
      dataIndex: 'productSku',
      key: 'sku',
      width: 120,
      render: (sku: string) => <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">{sku}</span>
    },
    {
      title: 'Product',
      dataIndex: 'productName',
      key: 'product',
      render: (name: string, record: PurchaseOrderItem) => (
        <div>
          <span className="font-medium">{name}</span>
          {record.isBundle && <Tag color="purple" className="ml-2">BUNDLE</Tag>}
        </div>
      )
    },
    {
      title: 'Quantity',
      dataIndex: 'quantity',
      key: 'quantity',
      width: 100,
      align: 'right' as const,
    },
    {
      title: 'Received',
      dataIndex: 'receivedQuantity',
      key: 'received',
      width: 100,
      align: 'right' as const,
      render: (qty: number, record: PurchaseOrderItem) => (
        <span className={qty === record.quantity ? 'text-green-600' : qty > 0 ? 'text-orange-500' : 'text-gray-400'}>
          {qty || 0} / {record.quantity}
        </span>
      )
    },
    {
      title: 'Unit Price',
      dataIndex: 'unitPrice',
      key: 'unitPrice',
      width: 120,
      align: 'right' as const,
      render: (price: number) => formatCurrency(price)
    },
    {
      title: 'Total',
      dataIndex: 'totalPrice',
      key: 'total',
      width: 120,
      align: 'right' as const,
      render: (total: number) => <strong>{formatCurrency(total)}</strong>
    },
  ];

  // Payment status color
  const getPaymentStatusColor = (status?: string) => {
    if (!status) return 'default';
    const colors: Record<string, string> = {
      paid: 'green',
      partial: 'orange',
      unpaid: 'red',
      pending: 'gold',
    };
    return colors[status.toLowerCase()] || 'default';
  };

  const tabItems = [
    {
      key: 'details',
      label: <span><FileTextOutlined /> Details</span>,
      children: (
        <div className="space-y-6">
          <Card title="Order Information" size="small">
            <Descriptions column={2} bordered size="small">
              <Descriptions.Item label="PO Number">{purchaseOrder?.poNumber}</Descriptions.Item>
              <Descriptions.Item label="Status">
                <Tag color={getStatusColor(purchaseOrder?.status || '')}>{purchaseOrder?.status?.toUpperCase()}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Supplier">{purchaseOrder?.supplier}</Descriptions.Item>
              <Descriptions.Item label="Payment Status">
                <Tag color={getPaymentStatusColor(purchaseOrder?.paymentStatus)}>
                  {purchaseOrder?.paymentStatus?.toUpperCase() || 'PENDING'}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Order Date">{purchaseOrder?.orderDate ? formatDate(purchaseOrder.orderDate) : '-'}</Descriptions.Item>
              <Descriptions.Item label="Expected Delivery">{purchaseOrder?.expectedDelivery ? formatDate(purchaseOrder.expectedDelivery) : '-'}</Descriptions.Item>
              <Descriptions.Item label="Total Amount">
                <Text strong className="text-lg text-green-600">{formatCurrency(purchaseOrder?.totalAmount || 0)}</Text>
              </Descriptions.Item>
              <Descriptions.Item label="Paid Amount">
                <Text className="text-lg">{formatCurrency(purchaseOrder?.paidAmount || 0)}</Text>
              </Descriptions.Item>
              {purchaseOrder?.approvedDate && (
                <>
                  <Descriptions.Item label="Approved Date">{formatDate(purchaseOrder.approvedDate)}</Descriptions.Item>
                  <Descriptions.Item label="Approved By">{purchaseOrder.approvedBy || '-'}</Descriptions.Item>
                </>
              )}
              {purchaseOrder?.receivedDate && (
                <Descriptions.Item label="Received Date" span={2}>{formatDate(purchaseOrder.receivedDate)}</Descriptions.Item>
              )}
            </Descriptions>
          </Card>

          {purchaseOrder?.notes && (
            <Card title="Notes" size="small">
              <Text>{purchaseOrder.notes}</Text>
            </Card>
          )}
        </div>
      ),
    },
    {
      key: 'items',
      label: <span><ShoppingCartOutlined /> Items ({purchaseOrder?.items?.length || 0})</span>,
      children: (
        <Card size="small">
          <Table
            dataSource={purchaseOrder?.items || []}
            columns={itemColumns}
            rowKey="id"
            pagination={false}
            scroll={{ x: 800 }}
            summary={() => (
              <Table.Summary.Row className="bg-gray-50">
                <Table.Summary.Cell index={0} colSpan={5} className="text-right">
                  <strong>Total:</strong>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={1} className="text-right">
                  <strong className="text-lg text-green-600">{formatCurrency(purchaseOrder?.totalAmount || 0)}</strong>
                </Table.Summary.Cell>
              </Table.Summary.Row>
            )}
          />
        </Card>
      ),
    },
    {
      key: 'history',
      label: <span><HistoryOutlined /> History</span>,
      children: (
        <Card size="small">
          {purchaseOrder?.history && purchaseOrder.history.length > 0 ? (
            <Timeline
              items={purchaseOrder.history.map((entry, index) => ({
                color: index === 0 ? 'green' : 'blue',
                children: (
                  <div>
                    <div className="font-medium">{entry.action}</div>
                    <div className="text-sm text-gray-500">
                      {entry.user} • {formatDate(entry.date)}
                    </div>
                    {entry.notes && <div className="text-sm mt-1">{entry.notes}</div>}
                  </div>
                ),
              }))}
            />
          ) : (
            <div className="text-center text-gray-500 py-8">
              <HistoryOutlined className="text-4xl mb-2" />
              <p>No history available</p>
            </div>
          )}
        </Card>
      ),
    },
  ];

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <Spin size="large" tip="Loading purchase order..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/protected/purchase-orders">
            <Button icon={<ArrowLeftOutlined />}>Back to Purchase Orders</Button>
          </Link>
        </div>
        <Alert
          message="Error"
          description={error}
          type="error"
          showIcon
          action={<Button size="small" onClick={fetchPurchaseOrder}>Retry</Button>}
        />
      </div>
    );
  }

  if (!purchaseOrder) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/protected/purchase-orders">
            <Button icon={<ArrowLeftOutlined />}>Back to Purchase Orders</Button>
          </Link>
        </div>
        <Alert message="Not Found" description="Purchase order not found" type="warning" showIcon />
      </div>
    );
  }

  const isPending = purchaseOrder.status === 'pending' || purchaseOrder.status === 'draft';
  const isApproved = purchaseOrder.status === 'approved';
  const canMarkPaid = (purchaseOrder.paymentStatus !== 'paid') && (isApproved || purchaseOrder.status === 'received' || purchaseOrder.status === 'partially_received');

  return (
    <div className="space-y-6" ref={printRef}>
      <div className="flex justify-between items-start">
        <div className="flex items-center gap-4">
          <Link href="/protected/purchase-orders">
            <Button icon={<ArrowLeftOutlined />}>Back</Button>
          </Link>
          <div>
            <Title level={2} className="!mb-0">{purchaseOrder.poNumber}</Title>
            <Text type="secondary">
              {purchaseOrder.supplier} • {formatDate(purchaseOrder.orderDate)}
            </Text>
          </div>
          <Tag color={getStatusColor(purchaseOrder.status)} className="text-base px-3 py-1">
            {purchaseOrder.status?.toUpperCase()}
          </Tag>
        </div>

        <Space wrap>
          <Button icon={<ReloadOutlined />} onClick={fetchPurchaseOrder}>Refresh</Button>
          <Button icon={<PrinterOutlined />} onClick={handlePrint}>Print</Button>

          {isPending && (
            <>
              <Link href={`/purchase-orders/${params.id}/edit`}>
                <Button icon={<EditOutlined />}>Edit</Button>
              </Link>
              <Button
                type="primary"
                icon={<CheckCircleOutlined />}
                onClick={handleApprove}
                style={{ background: '#52c41a' }}
              >
                Approve
              </Button>
              <Button
                danger
                icon={<CloseCircleOutlined />}
                onClick={handleReject}
              >
                Reject
              </Button>
            </>
          )}

          {canMarkPaid && (
            <Button
              type="primary"
              icon={<DollarOutlined />}
              onClick={() => {
                paymentForm.setFieldsValue({
                  amount: (purchaseOrder.totalAmount || 0) - (purchaseOrder.paidAmount || 0),
                  paymentDate: dayjs(),
                });
                setPaymentModalOpen(true);
              }}
            >
              Record Payment
            </Button>
          )}

          {isApproved && (
            <Link href={`/goods-receiving/new?poId=${params.id}`}>
              <Button type="primary" icon={<InboxOutlined />}>
                Receive Goods
              </Button>
            </Link>
          )}

          <Button danger icon={<DeleteOutlined />} onClick={handleDelete}>
            Delete
          </Button>
        </Space>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <div className="text-center">
            <p className="text-gray-500 text-sm">Total Items</p>
            <p className="text-2xl font-bold text-blue-600">{purchaseOrder.items?.length || 0}</p>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <p className="text-gray-500 text-sm">Total Quantity</p>
            <p className="text-2xl font-bold text-green-600">
              {purchaseOrder.items?.reduce((sum, item) => sum + item.quantity, 0) || 0}
            </p>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <p className="text-gray-500 text-sm">Total Amount</p>
            <p className="text-2xl font-bold text-purple-600">{formatCurrency(purchaseOrder.totalAmount)}</p>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <p className="text-gray-500 text-sm">Balance Due</p>
            <p className={`text-2xl font-bold ${(purchaseOrder.totalAmount - (purchaseOrder.paidAmount || 0)) > 0 ? 'text-red-600' : 'text-green-600'}`}>
              {formatCurrency((purchaseOrder.totalAmount || 0) - (purchaseOrder.paidAmount || 0))}
            </p>
          </div>
        </Card>
      </div>

      {/* Tabs */}
      <Card>
        <Tabs activeKey={activeTab} onChange={setActiveTab} items={tabItems} />
      </Card>

      {/* Payment Modal */}
      <Modal
        title="Record Payment"
        open={paymentModalOpen}
        onCancel={() => {
          setPaymentModalOpen(false);
          paymentForm.resetFields();
        }}
        onOk={() => paymentForm.submit()}
        confirmLoading={paymentLoading}
      >
        <Form form={paymentForm} layout="vertical" onFinish={handleMarkPaid}>
          <Form.Item
            label="Amount"
            name="amount"
            rules={[{ required: true, message: 'Please enter amount' }]}
          >
            <InputNumber
              style={{ width: '100%' }}
              prefix="$"
              min={0}
              max={(purchaseOrder?.totalAmount || 0) - (purchaseOrder?.paidAmount || 0)}
              precision={2}
            />
          </Form.Item>

          <Form.Item
            label="Payment Method"
            name="paymentMethod"
            rules={[{ required: true, message: 'Please select payment method' }]}
          >
            <Input placeholder="e.g., Bank Transfer, Check, Credit Card" />
          </Form.Item>

          <Form.Item label="Reference Number" name="reference">
            <Input placeholder="Transaction ID or check number" />
          </Form.Item>

          <Form.Item label="Payment Date" name="paymentDate">
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item label="Notes" name="notes">
            <Input.TextArea rows={2} placeholder="Optional notes" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
