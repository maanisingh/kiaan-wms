'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Card, Button, Tag, Descriptions, Table, Space, Timeline, Divider, Row, Col,
  Spin, Alert, Statistic, Modal, Form, Input, Select, message, InputNumber
} from 'antd';
import {
  ArrowLeftOutlined,
  EditOutlined,
  PrinterOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  ShopOutlined,
  CalendarOutlined,
  WarningOutlined,
  GlobalOutlined,
  ReloadOutlined,
  DollarOutlined,
  CreditCardOutlined,
  InboxOutlined,
  FileTextOutlined,
  CarOutlined,
  CloseCircleOutlined,
  FilePdfOutlined,
} from '@ant-design/icons';
import { useRouter, useParams } from 'next/navigation';
import { formatCurrency, formatDate, getStatusColor } from '@/lib/utils';
import apiService from '@/services/api';
import Link from 'next/link';

const { Option } = Select;
const { TextArea } = Input;

interface SalesOrderItem {
  id: string;
  productId: string;
  quantity: number;
  unitPrice: number;
  discount?: number;
  tax?: number;
  totalPrice: number;
  product?: {
    id: string;
    name: string;
    sku: string;
  };
}

interface SalesOrder {
  id: string;
  orderNumber: string;
  orderDate: string;
  requiredDate?: string;
  status: string;
  priority?: string;
  salesChannel?: string;
  isWholesale?: boolean;
  subtotal?: number;
  taxAmount?: number;
  shippingCost?: number;
  discountAmount?: number;
  totalAmount?: number;
  notes?: string;
  referenceNumber?: string;
  customer?: {
    id: string;
    name: string;
    email?: string;
    phone?: string;
    address?: string;
  };
  salesOrderItems?: SalesOrderItem[];
  createdAt: string;
  updatedAt: string;
}

export default function SalesOrderDetailPage() {
  const router = useRouter();
  const params = useParams();
  const [order, setOrder] = useState<SalesOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Action states
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [shipModalOpen, setShipModalOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [paymentForm] = Form.useForm();
  const [cancelForm] = Form.useForm();
  const [shipForm] = Form.useForm();

  const fetchOrder = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await apiService.get(`/sales-orders/${params.id}`);
      setOrder(data);
    } catch (err: any) {
      console.error('Failed to fetch order:', err);
      setError(err.message || 'Failed to load order');
    } finally {
      setLoading(false);
    }
  }, [params.id]);

  useEffect(() => {
    if (params.id) {
      fetchOrder();
    }
  }, [params.id, fetchOrder]);

  // Process Payment Handler
  const handleProcessPayment = async (values: any) => {
    try {
      setActionLoading('payment');
      await apiService.post(`/sales-orders/${params.id}/process-payment`, {
        paymentMethod: values.paymentMethod,
        paymentReference: values.paymentReference,
        amount: values.amount,
      });
      message.success('Payment processed successfully!');
      setPaymentModalOpen(false);
      paymentForm.resetFields();
      fetchOrder();
    } catch (err: any) {
      message.error(err.message || 'Failed to process payment');
    } finally {
      setActionLoading(null);
    }
  };

  // Allocate Inventory Handler
  const handleAllocateInventory = async () => {
    try {
      setActionLoading('allocate');
      const result = await apiService.post(`/sales-orders/${params.id}/allocate-inventory`);
      if (result.insufficientStock && result.insufficientStock.length > 0) {
        Modal.warning({
          title: 'Insufficient Stock',
          content: (
            <div>
              <p>Some items have insufficient stock:</p>
              <ul className="list-disc pl-4 mt-2">
                {result.insufficientStock.map((item: any, idx: number) => (
                  <li key={idx}>
                    {item.productName} (SKU: {item.sku}): Need {item.required}, Available {item.available}
                  </li>
                ))}
              </ul>
            </div>
          ),
        });
      } else {
        message.success('Inventory allocated successfully!');
      }
      fetchOrder();
    } catch (err: any) {
      message.error(err.message || 'Failed to allocate inventory');
    } finally {
      setActionLoading(null);
    }
  };

  // Create Pick List Handler
  const handleCreatePickList = async () => {
    try {
      setActionLoading('picklist');
      const result = await apiService.post(`/sales-orders/${params.id}/create-pick-list`);
      message.success(`Pick list ${result.pickList?.pickListNumber || ''} created successfully!`);
      fetchOrder();
    } catch (err: any) {
      message.error(err.message || 'Failed to create pick list');
    } finally {
      setActionLoading(null);
    }
  };

  // Print Packing Slip Handler
  const handlePrintPackingSlip = async () => {
    try {
      setActionLoading('packingslip');
      const result = await apiService.get(`/sales-orders/${params.id}/packing-slip`);

      // Create a printable packing slip
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(`
          <!DOCTYPE html>
          <html>
          <head>
            <title>Packing Slip - ${result.orderNumber}</title>
            <style>
              body { font-family: Arial, sans-serif; padding: 20px; }
              h1 { font-size: 24px; margin-bottom: 20px; }
              .header { display: flex; justify-content: space-between; margin-bottom: 20px; }
              .section { margin-bottom: 20px; }
              .section h3 { border-bottom: 1px solid #ccc; padding-bottom: 5px; }
              table { width: 100%; border-collapse: collapse; }
              th, td { border: 1px solid #ccc; padding: 8px; text-align: left; }
              th { background: #f5f5f5; }
              .total { font-weight: bold; font-size: 18px; text-align: right; margin-top: 20px; }
            </style>
          </head>
          <body>
            <h1>PACKING SLIP</h1>
            <div class="header">
              <div>
                <strong>Order Number:</strong> ${result.orderNumber}<br>
                <strong>Date:</strong> ${result.orderDate}<br>
                <strong>Channel:</strong> ${result.salesChannel || 'DIRECT'}
              </div>
            </div>
            <div class="section">
              <h3>Ship To</h3>
              <p>
                <strong>${result.customer?.name || 'N/A'}</strong><br>
                ${result.customer?.address || ''}<br>
                ${result.customer?.phone ? 'Phone: ' + result.customer.phone : ''}
              </p>
            </div>
            <div class="section">
              <h3>Items</h3>
              <table>
                <thead>
                  <tr>
                    <th>SKU</th>
                    <th>Product</th>
                    <th>Qty</th>
                    <th>Unit Price</th>
                    <th>Total</th>
                  </tr>
                </thead>
                <tbody>
                  ${result.items?.map((item: any) => `
                    <tr>
                      <td>${item.sku}</td>
                      <td>${item.productName}</td>
                      <td>${item.quantity}</td>
                      <td>£${item.unitPrice?.toFixed(2)}</td>
                      <td>£${item.totalPrice?.toFixed(2)}</td>
                    </tr>
                  `).join('') || ''}
                </tbody>
              </table>
            </div>
            <div class="total">
              Total: £${result.totalAmount?.toFixed(2) || '0.00'}
            </div>
            <p style="margin-top: 40px; font-size: 12px; color: #666;">
              Thank you for your order!
            </p>
          </body>
          </html>
        `);
        printWindow.document.close();
        printWindow.print();
      }
      message.success('Packing slip generated!');
    } catch (err: any) {
      message.error(err.message || 'Failed to generate packing slip');
    } finally {
      setActionLoading(null);
    }
  };

  // Generate Invoice Handler
  const handleGenerateInvoice = async () => {
    try {
      setActionLoading('invoice');
      const result = await apiService.post(`/sales-orders/${params.id}/generate-invoice`);

      // Create a printable invoice
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(`
          <!DOCTYPE html>
          <html>
          <head>
            <title>Invoice - ${result.invoiceNumber}</title>
            <style>
              body { font-family: Arial, sans-serif; padding: 20px; }
              h1 { font-size: 24px; margin-bottom: 20px; }
              .header { display: flex; justify-content: space-between; margin-bottom: 20px; }
              .section { margin-bottom: 20px; }
              .section h3 { border-bottom: 1px solid #ccc; padding-bottom: 5px; }
              table { width: 100%; border-collapse: collapse; }
              th, td { border: 1px solid #ccc; padding: 8px; text-align: left; }
              th { background: #f5f5f5; }
              .totals { text-align: right; margin-top: 20px; }
              .totals p { margin: 5px 0; }
              .grand-total { font-weight: bold; font-size: 20px; color: #1890ff; }
            </style>
          </head>
          <body>
            <h1>INVOICE</h1>
            <div class="header">
              <div>
                <strong>Invoice Number:</strong> ${result.invoiceNumber}<br>
                <strong>Invoice Date:</strong> ${result.invoiceDate}<br>
                <strong>Order Number:</strong> ${result.orderNumber}
              </div>
            </div>
            <div class="section">
              <h3>Bill To</h3>
              <p>
                <strong>${result.customer?.name || 'N/A'}</strong><br>
                ${result.customer?.email || ''}<br>
                ${result.customer?.address || ''}<br>
                ${result.customer?.phone ? 'Phone: ' + result.customer.phone : ''}
              </p>
            </div>
            <div class="section">
              <h3>Items</h3>
              <table>
                <thead>
                  <tr>
                    <th>SKU</th>
                    <th>Description</th>
                    <th>Qty</th>
                    <th>Unit Price</th>
                    <th>Total</th>
                  </tr>
                </thead>
                <tbody>
                  ${result.items?.map((item: any) => `
                    <tr>
                      <td>${item.sku}</td>
                      <td>${item.productName}</td>
                      <td>${item.quantity}</td>
                      <td>£${item.unitPrice?.toFixed(2)}</td>
                      <td>£${item.totalPrice?.toFixed(2)}</td>
                    </tr>
                  `).join('') || ''}
                </tbody>
              </table>
            </div>
            <div class="totals">
              <p>Subtotal: £${result.subtotal?.toFixed(2) || '0.00'}</p>
              <p>Tax: £${result.taxAmount?.toFixed(2) || '0.00'}</p>
              <p>Shipping: £${result.shippingCost?.toFixed(2) || '0.00'}</p>
              ${result.discountAmount ? `<p>Discount: -£${result.discountAmount?.toFixed(2)}</p>` : ''}
              <p class="grand-total">Total: £${result.totalAmount?.toFixed(2) || '0.00'}</p>
            </div>
            <p style="margin-top: 40px; font-size: 12px; color: #666;">
              Payment Terms: Net 30 days<br>
              Thank you for your business!
            </p>
          </body>
          </html>
        `);
        printWindow.document.close();
        printWindow.print();
      }
      message.success(`Invoice ${result.invoiceNumber} generated successfully!`);
      fetchOrder();
    } catch (err: any) {
      message.error(err.message || 'Failed to generate invoice');
    } finally {
      setActionLoading(null);
    }
  };

  // Ship Order Handler
  const handleShipOrder = async (values: any) => {
    try {
      setActionLoading('ship');
      await apiService.post(`/sales-orders/${params.id}/ship`, {
        trackingNumber: values.trackingNumber,
        carrier: values.carrier,
        notes: values.notes,
      });
      message.success('Order marked as shipped!');
      setShipModalOpen(false);
      shipForm.resetFields();
      fetchOrder();
    } catch (err: any) {
      message.error(err.message || 'Failed to ship order');
    } finally {
      setActionLoading(null);
    }
  };

  // Cancel Order Handler
  const handleCancelOrder = async (values: any) => {
    try {
      setActionLoading('cancel');
      await apiService.post(`/sales-orders/${params.id}/cancel`, {
        reason: values.reason,
      });
      message.success('Order cancelled successfully');
      setCancelModalOpen(false);
      cancelForm.resetFields();
      fetchOrder();
    } catch (err: any) {
      message.error(err.message || 'Failed to cancel order');
    } finally {
      setActionLoading(null);
    }
  };

  // Check if actions are allowed based on status
  const canProcessPayment = ['PENDING'].includes(order?.status?.toUpperCase() || '');
  const canAllocate = ['PENDING', 'CONFIRMED'].includes(order?.status?.toUpperCase() || '');
  const canCreatePickList = ['CONFIRMED', 'ALLOCATED'].includes(order?.status?.toUpperCase() || '');
  const canGenerateInvoice = !['CANCELLED'].includes(order?.status?.toUpperCase() || '');
  const canShip = !['SHIPPED', 'COMPLETED', 'CANCELLED'].includes(order?.status?.toUpperCase() || '');
  const canCancel = !['SHIPPED', 'COMPLETED', 'CANCELLED'].includes(order?.status?.toUpperCase() || '');

  // Print order handler
  const handlePrint = async () => {
    if (!order) return;

    const printWindow = window.open('', '_blank', 'width=800,height=600');
    if (!printWindow) {
      message.error('Please allow popups to print');
      return;
    }

    const itemsHtml = order.salesOrderItems?.map(item =>
      '<tr>' +
      '<td>' + (item.product?.sku || '-') + '</td>' +
      '<td>' + (item.product?.name || '-') + '</td>' +
      '<td class="text-right">' + item.quantity + '</td>' +
      '<td class="text-right">£' + (item.unitPrice || 0).toFixed(2) + '</td>' +
      '<td class="text-right">£' + (item.totalPrice || 0).toFixed(2) + '</td>' +
      '</tr>'
    ).join('') || '<tr><td colspan="5">No items</td></tr>';

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Sales Order - ${order.orderNumber}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; color: #333; }
            .header { display: flex; justify-content: space-between; border-bottom: 2px solid #333; padding-bottom: 20px; margin-bottom: 20px; }
            .title { font-size: 24px; font-weight: bold; color: #1890ff; }
            .section { margin: 20px 0; }
            .section-title { font-weight: bold; font-size: 14px; border-bottom: 1px solid #ddd; padding-bottom: 5px; margin-bottom: 10px; }
            table { width: 100%; border-collapse: collapse; margin: 20px 0; }
            th, td { border: 1px solid #ddd; padding: 10px; text-align: left; }
            th { background: #f5f5f5; font-weight: bold; }
            .text-right { text-align: right; }
            .total-row { font-weight: bold; background: #f9f9f9; }
            .footer { margin-top: 40px; text-align: center; font-size: 12px; color: #666; }
            @media print { body { print-color-adjust: exact; } }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <div class="title">SALES ORDER</div>
              <div style="font-size: 18px; margin-top: 5px;">${order.orderNumber}</div>
            </div>
            <div>
              <strong>Order Date:</strong> ${formatDate(order.orderDate)}<br/>
              <strong>Channel:</strong> ${order.salesChannel || 'DIRECT'}<br/>
              <strong>Status:</strong> ${order.status?.toUpperCase()}
            </div>
          </div>

          <div class="section">
            <div class="section-title">Customer</div>
            <p>
              <strong>${order.customer?.name || 'N/A'}</strong><br/>
              ${order.customer?.email || ''}<br/>
              ${order.customer?.phone || ''}<br/>
              ${order.customer?.address || ''}
            </p>
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
                ${itemsHtml}
                <tr class="total-row">
                  <td colspan="4" class="text-right">Subtotal:</td>
                  <td class="text-right">£${(order.subtotal || 0).toFixed(2)}</td>
                </tr>
                <tr>
                  <td colspan="4" class="text-right">Tax:</td>
                  <td class="text-right">£${(order.taxAmount || 0).toFixed(2)}</td>
                </tr>
                <tr>
                  <td colspan="4" class="text-right">Shipping:</td>
                  <td class="text-right">£${(order.shippingCost || 0).toFixed(2)}</td>
                </tr>
                <tr class="total-row">
                  <td colspan="4" class="text-right">Total Amount:</td>
                  <td class="text-right">£${(order.totalAmount || 0).toFixed(2)}</td>
                </tr>
              </tbody>
            </table>
          </div>

          ${order.notes ? '<div class="section"><div class="section-title">Notes</div><p>' + order.notes + '</p></div>' : ''}

          <div class="footer">
            <p>Printed on ${new Date().toLocaleString()}</p>
          </div>
        </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 500);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <Spin size="large" tip="Loading order..." />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="p-6">
        <Alert
          message="Error Loading Order"
          description={error || 'Order not found'}
          type="error"
          showIcon
          action={
            <Space>
              <Button onClick={fetchOrder} icon={<ReloadOutlined />}>
                Retry
              </Button>
              <Button onClick={() => router.push('/protected/sales-orders')}>
                Back to Orders
              </Button>
            </Space>
          }
        />
      </div>
    );
  }

  const itemColumns = [
    {
      title: 'Product',
      dataIndex: ['product', 'name'],
      key: 'product',
      render: (text: string) => text || 'Unknown Product',
    },
    {
      title: 'SKU',
      dataIndex: ['product', 'sku'],
      key: 'sku',
      render: (text: string) => <span className="font-mono text-sm">{text || '-'}</span>,
    },
    {
      title: 'Quantity',
      dataIndex: 'quantity',
      key: 'quantity',
      align: 'center' as const,
    },
    {
      title: 'Unit Price',
      dataIndex: 'unitPrice',
      key: 'unitPrice',
      align: 'right' as const,
      render: (price: number) => formatCurrency(price || 0),
    },
    {
      title: 'Discount',
      dataIndex: 'discount',
      key: 'discount',
      align: 'right' as const,
      render: (discount: number) => formatCurrency(discount || 0),
    },
    {
      title: 'Total',
      dataIndex: 'totalPrice',
      key: 'total',
      align: 'right' as const,
      render: (total: number) => <strong>{formatCurrency(total || 0)}</strong>,
    },
  ];

  // Build timeline based on status
  const getTimeline = () => {
    const statuses = ['PENDING', 'CONFIRMED', 'ALLOCATED', 'PICKING', 'PACKING', 'SHIPPED', 'COMPLETED'];
    const currentIndex = statuses.indexOf(order.status?.toUpperCase() || 'PENDING');

    return statuses.map((status, index) => ({
      status: status.replace('_', ' '),
      completed: index <= currentIndex,
      current: index === currentIndex,
    }));
  };

  const timeline = getTimeline();

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div className="flex items-center gap-4">
          <Button icon={<ArrowLeftOutlined />} onClick={() => router.back()}>
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Order {order.orderNumber}</h1>
            <p className="text-gray-600 mt-1">
              Created on {formatDate(order.orderDate || order.createdAt)}
            </p>
          </div>
        </div>
        <Space>
          <Button icon={<ReloadOutlined />} onClick={fetchOrder}>
            Refresh
          </Button>
          <Button icon={<PrinterOutlined />} size="large" onClick={handlePrint}>
            Print
          </Button>
          <Link href={`/protected/sales-orders/${order.id}/edit`}>
            <Button icon={<EditOutlined />} type="primary" size="large">
              Edit Order
            </Button>
          </Link>
        </Space>
      </div>

      {/* Status Banner */}
      <Card>
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <Tag
              color={order.isWholesale ? 'purple' : 'blue'}
              style={{ fontSize: 18, padding: '8px 16px' }}
            >
              <ShopOutlined /> {order.isWholesale ? 'B2B' : 'B2C'} Order
            </Tag>
            <Tag color="cyan" icon={<GlobalOutlined />} style={{ fontSize: 16, padding: '6px 12px' }}>
              {order.salesChannel || 'DIRECT'}
            </Tag>
          </div>
          <div className="flex items-center gap-4">
            <div>
              <span className="text-gray-600">Status:</span>
              <Tag
                color={getStatusColor(order.status?.toLowerCase() || 'pending')}
                className="ml-2 uppercase text-lg px-4 py-1"
              >
                {order.status?.replace('_', ' ') || 'PENDING'}
              </Tag>
            </div>
            <div>
              <span className="text-gray-600">Priority:</span>
              <Tag
                color={
                  order.priority === 'HIGH' ? 'red' :
                  order.priority === 'MEDIUM' ? 'orange' : 'green'
                }
                className="ml-2 uppercase text-lg px-4 py-1"
              >
                {order.priority || 'NORMAL'}
              </Tag>
            </div>
          </div>
        </div>
      </Card>

      {/* Stats Row */}
      <Row gutter={16}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Subtotal"
              value={order.subtotal || order.totalAmount || 0}
              prefix="£"
              precision={2}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Tax"
              value={order.taxAmount || 0}
              prefix="£"
              precision={2}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Shipping"
              value={order.shippingCost || 0}
              prefix="£"
              precision={2}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Total Amount"
              value={order.totalAmount || 0}
              prefix="£"
              precision={2}
              valueStyle={{ color: '#1890ff', fontWeight: 'bold' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Order Details */}
      <Row gutter={16}>
        <Col xs={24} lg={16}>
          <Card title="Order Information">
            <Descriptions column={2} bordered>
              <Descriptions.Item label="Order Number">{order.orderNumber}</Descriptions.Item>
              <Descriptions.Item label="Channel">
                <Tag color="blue" className="uppercase">{order.salesChannel || 'DIRECT'}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Customer">{order.customer?.name || '-'}</Descriptions.Item>
              <Descriptions.Item label="Email">{order.customer?.email || '-'}</Descriptions.Item>
              <Descriptions.Item label="Phone">{order.customer?.phone || '-'}</Descriptions.Item>
              <Descriptions.Item label="Order Date">{formatDate(order.orderDate)}</Descriptions.Item>
              <Descriptions.Item label="Required Date">
                {order.requiredDate ? formatDate(order.requiredDate) : '-'}
              </Descriptions.Item>
              <Descriptions.Item label="Reference">{order.referenceNumber || '-'}</Descriptions.Item>
            </Descriptions>

            {order.customer?.address && (
              <>
                <Divider />
                <h3 className="text-lg font-semibold mb-4">Customer Address</h3>
                <p>{order.customer.address}</p>
              </>
            )}

            {order.notes && (
              <>
                <Divider />
                <h3 className="text-lg font-semibold mb-2">Notes</h3>
                <p className="text-gray-600">{order.notes}</p>
              </>
            )}
          </Card>

          <Card title="Order Items" className="mt-4">
            <Table
              dataSource={order.salesOrderItems || []}
              columns={itemColumns}
              rowKey="id"
              pagination={false}
              summary={() => (
                <Table.Summary fixed>
                  <Table.Summary.Row>
                    <Table.Summary.Cell index={0} colSpan={5} align="right">
                      <strong>Subtotal:</strong>
                    </Table.Summary.Cell>
                    <Table.Summary.Cell index={1} align="right">
                      <strong>{formatCurrency(order.subtotal || order.totalAmount || 0)}</strong>
                    </Table.Summary.Cell>
                  </Table.Summary.Row>
                  {(order.taxAmount || 0) > 0 && (
                    <Table.Summary.Row>
                      <Table.Summary.Cell index={0} colSpan={5} align="right">
                        Tax:
                      </Table.Summary.Cell>
                      <Table.Summary.Cell index={1} align="right">
                        {formatCurrency(order.taxAmount || 0)}
                      </Table.Summary.Cell>
                    </Table.Summary.Row>
                  )}
                  {(order.shippingCost || 0) > 0 && (
                    <Table.Summary.Row>
                      <Table.Summary.Cell index={0} colSpan={5} align="right">
                        Shipping:
                      </Table.Summary.Cell>
                      <Table.Summary.Cell index={1} align="right">
                        {formatCurrency(order.shippingCost || 0)}
                      </Table.Summary.Cell>
                    </Table.Summary.Row>
                  )}
                  {(order.discountAmount || 0) > 0 && (
                    <Table.Summary.Row>
                      <Table.Summary.Cell index={0} colSpan={5} align="right">
                        Discount:
                      </Table.Summary.Cell>
                      <Table.Summary.Cell index={1} align="right">
                        -{formatCurrency(order.discountAmount || 0)}
                      </Table.Summary.Cell>
                    </Table.Summary.Row>
                  )}
                  <Table.Summary.Row>
                    <Table.Summary.Cell index={0} colSpan={5} align="right">
                      <strong className="text-lg">Total:</strong>
                    </Table.Summary.Cell>
                    <Table.Summary.Cell index={1} align="right">
                      <strong className="text-xl text-blue-600">
                        {formatCurrency(order.totalAmount || 0)}
                      </strong>
                    </Table.Summary.Cell>
                  </Table.Summary.Row>
                </Table.Summary>
              )}
            />
          </Card>
        </Col>

        <Col xs={24} lg={8}>
          <Card title="Order Progress">
            <Timeline>
              {timeline.map((item, index) => (
                <Timeline.Item
                  key={index}
                  color={item.completed ? 'green' : 'gray'}
                  dot={item.completed ? <CheckCircleOutlined /> : <ClockCircleOutlined />}
                >
                  <p className={`font-medium ${item.current ? 'text-blue-600' : ''}`}>
                    {item.status}
                  </p>
                  <p className="text-sm text-gray-500">
                    {item.completed ? (item.current ? 'Current Status' : 'Completed') : 'Pending'}
                  </p>
                </Timeline.Item>
              ))}
            </Timeline>
          </Card>

          <Card title="Quick Actions" className="mt-4">
            <Space direction="vertical" style={{ width: '100%' }}>
              <Button
                block
                icon={<CreditCardOutlined />}
                onClick={() => {
                  paymentForm.setFieldsValue({ amount: order.totalAmount });
                  setPaymentModalOpen(true);
                }}
                disabled={!canProcessPayment}
                loading={actionLoading === 'payment'}
              >
                Process Payment
              </Button>
              <Button
                block
                icon={<InboxOutlined />}
                onClick={handleAllocateInventory}
                disabled={!canAllocate}
                loading={actionLoading === 'allocate'}
              >
                Allocate Inventory
              </Button>
              <Button
                block
                icon={<FileTextOutlined />}
                onClick={handleCreatePickList}
                disabled={!canCreatePickList}
                loading={actionLoading === 'picklist'}
              >
                Create Pick List
              </Button>
              <Button
                block
                icon={<FilePdfOutlined />}
                onClick={handlePrintPackingSlip}
                loading={actionLoading === 'packingslip'}
              >
                Print Packing Slip
              </Button>
              <Button
                block
                icon={<DollarOutlined />}
                onClick={handleGenerateInvoice}
                disabled={!canGenerateInvoice}
                loading={actionLoading === 'invoice'}
              >
                Generate Invoice
              </Button>
              <Button
                block
                type="primary"
                icon={<CarOutlined />}
                onClick={() => setShipModalOpen(true)}
                disabled={!canShip}
                loading={actionLoading === 'ship'}
              >
                Mark as Shipped
              </Button>
              <Button
                block
                danger
                icon={<CloseCircleOutlined />}
                onClick={() => setCancelModalOpen(true)}
                disabled={!canCancel}
                loading={actionLoading === 'cancel'}
              >
                Cancel Order
              </Button>
            </Space>
          </Card>
        </Col>
      </Row>

      {/* Payment Modal */}
      <Modal
        title="Process Payment"
        open={paymentModalOpen}
        onCancel={() => setPaymentModalOpen(false)}
        footer={null}
      >
        <Form form={paymentForm} layout="vertical" onFinish={handleProcessPayment}>
          <Form.Item
            label="Payment Method"
            name="paymentMethod"
            rules={[{ required: true, message: 'Please select payment method' }]}
          >
            <Select placeholder="Select payment method">
              <Option value="CREDIT_CARD">Credit Card</Option>
              <Option value="DEBIT_CARD">Debit Card</Option>
              <Option value="BANK_TRANSFER">Bank Transfer</Option>
              <Option value="CASH">Cash</Option>
              <Option value="PAYPAL">PayPal</Option>
              <Option value="STRIPE">Stripe</Option>
            </Select>
          </Form.Item>
          <Form.Item
            label="Amount"
            name="amount"
            rules={[{ required: true, message: 'Please enter amount' }]}
          >
            <InputNumber
              style={{ width: '100%' }}
              prefix="£"
              precision={2}
              min={0}
            />
          </Form.Item>
          <Form.Item label="Payment Reference" name="paymentReference">
            <Input placeholder="Transaction ID or reference number" />
          </Form.Item>
          <Form.Item className="mb-0">
            <Space className="w-full justify-end">
              <Button onClick={() => setPaymentModalOpen(false)}>Cancel</Button>
              <Button
                type="primary"
                htmlType="submit"
                loading={actionLoading === 'payment'}
                icon={<CreditCardOutlined />}
              >
                Process Payment
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* Ship Order Modal */}
      <Modal
        title="Ship Order"
        open={shipModalOpen}
        onCancel={() => setShipModalOpen(false)}
        footer={null}
      >
        <Form form={shipForm} layout="vertical" onFinish={handleShipOrder}>
          <Form.Item
            label="Carrier"
            name="carrier"
            rules={[{ required: true, message: 'Please select carrier' }]}
          >
            <Select placeholder="Select carrier">
              <Option value="DHL">DHL</Option>
              <Option value="FEDEX">FedEx</Option>
              <Option value="UPS">UPS</Option>
              <Option value="ROYAL_MAIL">Royal Mail</Option>
              <Option value="PARCELFORCE">Parcelforce</Option>
              <Option value="DPD">DPD</Option>
              <Option value="HERMES">Hermes</Option>
              <Option value="OTHER">Other</Option>
            </Select>
          </Form.Item>
          <Form.Item
            label="Tracking Number"
            name="trackingNumber"
            rules={[{ required: true, message: 'Please enter tracking number' }]}
          >
            <Input placeholder="Enter tracking number" />
          </Form.Item>
          <Form.Item label="Shipping Notes" name="notes">
            <TextArea rows={3} placeholder="Any shipping notes..." />
          </Form.Item>
          <Form.Item className="mb-0">
            <Space className="w-full justify-end">
              <Button onClick={() => setShipModalOpen(false)}>Cancel</Button>
              <Button
                type="primary"
                htmlType="submit"
                loading={actionLoading === 'ship'}
                icon={<CarOutlined />}
              >
                Mark as Shipped
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* Cancel Order Modal */}
      <Modal
        title="Cancel Order"
        open={cancelModalOpen}
        onCancel={() => setCancelModalOpen(false)}
        footer={null}
      >
        <Alert
          message="Warning"
          description="This action cannot be undone. The order will be marked as cancelled."
          type="warning"
          showIcon
          className="mb-4"
        />
        <Form form={cancelForm} layout="vertical" onFinish={handleCancelOrder}>
          <Form.Item
            label="Cancellation Reason"
            name="reason"
            rules={[{ required: true, message: 'Please provide a reason for cancellation' }]}
          >
            <TextArea rows={4} placeholder="Enter reason for cancellation..." />
          </Form.Item>
          <Form.Item className="mb-0">
            <Space className="w-full justify-end">
              <Button onClick={() => setCancelModalOpen(false)}>Go Back</Button>
              <Button
                type="primary"
                danger
                htmlType="submit"
                loading={actionLoading === 'cancel'}
                icon={<CloseCircleOutlined />}
              >
                Cancel Order
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
