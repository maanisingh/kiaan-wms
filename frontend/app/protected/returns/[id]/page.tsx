'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Card, Descriptions, Tag, Button, Tabs, Timeline, Space, Table, Spin, message, Modal, Form, Input, Select, InputNumber, Popconfirm } from 'antd';
import { ArrowLeftOutlined, CheckOutlined, CloseOutlined, LoadingOutlined, ReloadOutlined, PrinterOutlined, EditOutlined, PlusOutlined, DeleteOutlined, SaveOutlined } from '@ant-design/icons';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { formatDate, formatCurrency } from '@/lib/utils';
import apiService from '@/services/api';

const { Option } = Select;

interface ReturnItem {
  id: string;
  sku: string;
  name: string;
  quantity: number;
  condition: string;
  refundAmount: number;
}

interface ReturnOrder {
  id: string;
  rmaNumber: string;
  orderNumber: string;
  customer: string;
  status: string;
  type: string;
  reason: string;
  requestedDate: string;
  approvedDate?: string;
  completedDate?: string;
  value: number;
  items?: ReturnItem[];
  notes?: string;
}

interface TimelineEvent {
  time: string;
  status: string;
  user: string;
}

export default function ReturnDetailPage({ params }: { params: { id: string } }) {
  const [activeTab, setActiveTab] = useState('details');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [returnOrder, setReturnOrder] = useState<ReturnOrder | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [addItemModal, setAddItemModal] = useState(false);
  const [editForm] = Form.useForm();
  const [itemForm] = Form.useForm();
  const router = useRouter();
  const printRef = useRef<HTMLDivElement>(null);

  // Fetch return details
  const fetchReturnDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await apiService.get(`/returns/${params.id}`);
      setReturnOrder(data);
      editForm.setFieldsValue(data);
    } catch (err: any) {
      console.error('Failed to fetch return details:', err);
      setError(err.message || 'Failed to fetch return details');
      message.error(err.message || 'Failed to fetch return details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReturnDetails();
  }, [params.id]);

  // Handle status update
  const handleStatusUpdate = async (newStatus: string, actionName: string) => {
    Modal.confirm({
      title: `${actionName} Return`,
      content: `Are you sure you want to ${actionName.toLowerCase()} this return?`,
      okText: 'Yes',
      cancelText: 'No',
      onOk: async () => {
        try {
          setActionLoading(true);
          await apiService.patch(`/returns/${params.id}`, { status: newStatus });
          message.success(`Return ${actionName.toLowerCase()}d successfully!`);
          fetchReturnDetails();
        } catch (err: any) {
          console.error(`Failed to ${actionName.toLowerCase()} return:`, err);
          message.error(err.message || `Failed to ${actionName.toLowerCase()} return`);
        } finally {
          setActionLoading(false);
        }
      }
    });
  };

  // Handle edit save
  const handleEditSave = async (values: any) => {
    try {
      setActionLoading(true);
      await apiService.patch(`/returns/${params.id}`, values);
      message.success('Return updated successfully!');
      setIsEditing(false);
      fetchReturnDetails();
    } catch (err: any) {
      message.error(err.message || 'Failed to update return');
    } finally {
      setActionLoading(false);
    }
  };

  // Handle delete return
  const handleDelete = async () => {
    try {
      setActionLoading(true);
      await apiService.delete(`/returns/${params.id}`);
      message.success('Return deleted successfully!');
      router.push('/returns');
    } catch (err: any) {
      message.error(err.message || 'Failed to delete return');
    } finally {
      setActionLoading(false);
    }
  };

  // Handle add item
  const handleAddItem = async (values: any) => {
    try {
      await apiService.post(`/returns/${params.id}/items`, values);
      message.success('Item added successfully!');
      itemForm.resetFields();
      setAddItemModal(false);
      fetchReturnDetails();
    } catch (err: any) {
      message.error(err.message || 'Failed to add item');
    }
  };

  // Handle delete item
  const handleDeleteItem = async (itemId: string) => {
    try {
      await apiService.delete(`/returns/${params.id}/items/${itemId}`);
      message.success('Item removed successfully!');
      fetchReturnDetails();
    } catch (err: any) {
      message.error(err.message || 'Failed to remove item');
    }
  };

  // Handle print
  const handlePrint = () => {
    const printContent = printRef.current;
    if (!printContent) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      message.error('Please allow pop-ups to print');
      return;
    }

    printWindow.document.write(`
      <html>
        <head>
          <title>RMA ${returnOrder?.rmaNumber || ''} - Print</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            h1 { color: #333; }
            .info-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
            .info-table td, .info-table th { border: 1px solid #ddd; padding: 10px; text-align: left; }
            .info-table th { background: #f5f5f5; }
            .items-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
            .items-table td, .items-table th { border: 1px solid #ddd; padding: 8px; text-align: left; }
            .items-table th { background: #f0f0f0; }
            .status { padding: 4px 8px; border-radius: 4px; font-weight: bold; }
            .status-pending { background: #fff7e6; color: #fa8c16; }
            .status-processing { background: #e6f7ff; color: #1890ff; }
            .status-approved { background: #e6fffb; color: #13c2c2; }
            .status-completed { background: #f6ffed; color: #52c41a; }
            .status-rejected { background: #fff1f0; color: #ff4d4f; }
            @media print { body { padding: 0; } }
          </style>
        </head>
        <body>
          <h1>Return Material Authorization (RMA)</h1>
          <table class="info-table">
            <tr><th>RMA Number</th><td>${returnOrder?.rmaNumber || ''}</td></tr>
            <tr><th>Order Number</th><td>${returnOrder?.orderNumber || ''}</td></tr>
            <tr><th>Customer</th><td>${returnOrder?.customer || ''}</td></tr>
            <tr><th>Type</th><td>${returnOrder?.type || ''}</td></tr>
            <tr><th>Reason</th><td>${returnOrder?.reason || ''}</td></tr>
            <tr><th>Status</th><td><span class="status status-${returnOrder?.status || ''}">${(returnOrder?.status || '').toUpperCase()}</span></td></tr>
            <tr><th>Requested Date</th><td>${returnOrder?.requestedDate ? formatDate(returnOrder.requestedDate) : ''}</td></tr>
            <tr><th>Total Value</th><td>${formatCurrency(returnOrder?.value || 0)}</td></tr>
          </table>
          <h2>Returned Items</h2>
          <table class="items-table">
            <thead>
              <tr><th>SKU</th><th>Product Name</th><th>Quantity</th><th>Condition</th><th>Refund Amount</th></tr>
            </thead>
            <tbody>
              ${(returnOrder?.items || []).map(item => `
                <tr>
                  <td>${item.sku}</td>
                  <td>${item.name}</td>
                  <td>${item.quantity}</td>
                  <td>${item.condition}</td>
                  <td>${formatCurrency(item.refundAmount)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          <p><strong>Printed on:</strong> ${new Date().toLocaleString()}</p>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  const handleApprove = () => handleStatusUpdate('approved', 'Approve');
  const handleReject = () => handleStatusUpdate('rejected', 'Reject');
  const handleComplete = () => handleStatusUpdate('completed', 'Complete');
  const handleProcess = () => handleStatusUpdate('processing', 'Process');

  // Generate timeline from return data
  const generateTimeline = (): TimelineEvent[] => {
    if (!returnOrder) return [];

    const timeline: TimelineEvent[] = [];

    if (returnOrder.requestedDate) {
      timeline.push({
        time: formatDate(returnOrder.requestedDate),
        status: 'Return Requested',
        user: returnOrder.customer
      });
    }

    if (returnOrder.status === 'processing' || returnOrder.status === 'approved' || returnOrder.status === 'completed') {
      timeline.push({
        time: formatDate(returnOrder.approvedDate || new Date().toISOString()),
        status: 'Processing Started',
        user: 'System'
      });
    }

    if (returnOrder.status === 'approved' || returnOrder.status === 'completed') {
      timeline.push({
        time: formatDate(returnOrder.approvedDate || new Date().toISOString()),
        status: 'Return Approved',
        user: 'Admin'
      });
    }

    if (returnOrder.status === 'completed') {
      timeline.push({
        time: formatDate(returnOrder.completedDate || new Date().toISOString()),
        status: 'Return Completed',
        user: 'System'
      });
    }

    if (returnOrder.status === 'rejected') {
      timeline.push({
        time: formatDate(new Date().toISOString()),
        status: 'Return Rejected',
        user: 'Admin'
      });
    }

    return timeline;
  };

  // Default items if none provided
  const items: ReturnItem[] = returnOrder?.items || [];

  const itemColumns = [
    { title: 'SKU', dataIndex: 'sku', key: 'sku', width: 120 },
    { title: 'Product Name', dataIndex: 'name', key: 'name', width: 250 },
    { title: 'Quantity', dataIndex: 'quantity', key: 'quantity', width: 100 },
    {
      title: 'Condition',
      dataIndex: 'condition',
      key: 'condition',
      width: 120,
      render: (c: string) => {
        const colors: Record<string, string> = {
          'Damaged': 'red',
          'Defective': 'orange',
          'Wrong Item': 'blue',
          'Good': 'green'
        };
        return <Tag color={colors[c] || 'default'}>{c}</Tag>;
      }
    },
    { title: 'Refund Amount', dataIndex: 'refundAmount', key: 'refund', width: 120, render: (v: number) => formatCurrency(v) },
    {
      title: 'Actions',
      key: 'actions',
      width: 80,
      render: (_: any, record: ReturnItem) => (
        <Popconfirm
          title="Remove this item?"
          onConfirm={() => handleDeleteItem(record.id)}
          okText="Yes"
          cancelText="No"
        >
          <Button type="link" danger icon={<DeleteOutlined />} size="small">
            Remove
          </Button>
        </Popconfirm>
      ),
    },
  ];

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'orange',
      processing: 'blue',
      approved: 'cyan',
      completed: 'green',
      rejected: 'red'
    };
    return colors[status] || 'default';
  };

  const timeline = generateTimeline();

  const tabItems = [
    {
      key: 'details',
      label: 'Return Details',
      children: returnOrder ? (
        <div className="space-y-6" ref={printRef}>
          <Card title="RMA Information" extra={
            <Button icon={<EditOutlined />} onClick={() => setIsEditing(true)}>Edit</Button>
          }>
            {isEditing ? (
              <Form form={editForm} layout="vertical" onFinish={handleEditSave}>
                <div className="grid grid-cols-2 gap-4">
                  <Form.Item label="Order Number" name="orderNumber">
                    <Input />
                  </Form.Item>
                  <Form.Item label="Customer" name="customer">
                    <Input />
                  </Form.Item>
                  <Form.Item label="Type" name="type">
                    <Select>
                      <Option value="Return">Return</Option>
                      <Option value="Exchange">Exchange</Option>
                      <Option value="Refund">Refund</Option>
                    </Select>
                  </Form.Item>
                  <Form.Item label="Reason" name="reason">
                    <Select>
                      <Option value="Damaged">Damaged</Option>
                      <Option value="Wrong Item">Wrong Item</Option>
                      <Option value="Defective">Defective</Option>
                      <Option value="Not as Described">Not as Described</Option>
                      <Option value="Changed Mind">Changed Mind</Option>
                    </Select>
                  </Form.Item>
                  <Form.Item label="Value" name="value">
                    <InputNumber prefix="$" style={{ width: '100%' }} />
                  </Form.Item>
                  <Form.Item label="Notes" name="notes">
                    <Input.TextArea rows={2} />
                  </Form.Item>
                </div>
                <Space>
                  <Button type="primary" htmlType="submit" icon={<SaveOutlined />} loading={actionLoading}>
                    Save Changes
                  </Button>
                  <Button onClick={() => setIsEditing(false)}>Cancel</Button>
                </Space>
              </Form>
            ) : (
              <Descriptions column={2} bordered>
                <Descriptions.Item label="RMA Number">{returnOrder.rmaNumber}</Descriptions.Item>
                <Descriptions.Item label="Order Number">{returnOrder.orderNumber}</Descriptions.Item>
                <Descriptions.Item label="Customer">{returnOrder.customer}</Descriptions.Item>
                <Descriptions.Item label="Type"><Tag color="purple">{returnOrder.type}</Tag></Descriptions.Item>
                <Descriptions.Item label="Reason">{returnOrder.reason}</Descriptions.Item>
                <Descriptions.Item label="Status">
                  <Tag color={getStatusColor(returnOrder.status)}>{returnOrder.status.toUpperCase()}</Tag>
                </Descriptions.Item>
                <Descriptions.Item label="Requested Date">{formatDate(returnOrder.requestedDate)}</Descriptions.Item>
                <Descriptions.Item label="Approved Date">
                  {returnOrder.approvedDate ? formatDate(returnOrder.approvedDate) : '-'}
                </Descriptions.Item>
                <Descriptions.Item label="Total Value">{formatCurrency(returnOrder.value)}</Descriptions.Item>
                {returnOrder.notes && (
                  <Descriptions.Item label="Notes" span={2}>{returnOrder.notes}</Descriptions.Item>
                )}
              </Descriptions>
            )}
          </Card>
          <Card title="Returned Items" extra={
            <Button type="primary" icon={<PlusOutlined />} onClick={() => setAddItemModal(true)}>
              Add Item
            </Button>
          }>
            {items.length > 0 ? (
              <Table dataSource={items} columns={itemColumns} rowKey="id" pagination={false} />
            ) : (
              <div className="text-center py-8 text-gray-500">
                <p>No items added yet.</p>
                <Button type="link" icon={<PlusOutlined />} onClick={() => setAddItemModal(true)}>
                  Add the first item
                </Button>
              </div>
            )}
          </Card>
        </div>
      ) : null,
    },
    {
      key: 'timeline',
      label: 'Timeline',
      children: (
        <Card title="Return Timeline">
          {timeline.length > 0 ? (
            <Timeline>
              {timeline.map((event, index) => (
                <Timeline.Item key={index} color="blue">
                  <div className="font-semibold">{event.status}</div>
                  <div className="text-sm text-gray-600">{event.time} - {event.user}</div>
                </Timeline.Item>
              ))}
            </Timeline>
          ) : (
            <p className="text-gray-500">No timeline events yet.</p>
          )}
        </Card>
      ),
    },
  ];

  // Loading state
  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <Spin indicator={<LoadingOutlined style={{ fontSize: 48 }} spin />} />
      </div>
    );
  }

  // Error state
  if (error || !returnOrder) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/protected/returns">
            <Button icon={<ArrowLeftOutlined />}>Back to Returns</Button>
          </Link>
        </div>
        <Card className="text-center py-12">
          <p className="text-red-500 text-lg mb-4">{error || 'Return not found'}</p>
          <Button onClick={fetchReturnDetails} icon={<ReloadOutlined />}>
            Retry
          </Button>
        </Card>
      </div>
    );
  }

  // Determine which action buttons to show based on status
  const renderActionButtons = () => {
    const status = returnOrder.status;

    if (status === 'pending') {
      return (
        <>
          <Button
            icon={<CheckOutlined />}
            onClick={handleProcess}
            loading={actionLoading}
            size="large"
          >
            Start Processing
          </Button>
          <Button
            icon={<CloseOutlined />}
            danger
            size="large"
            onClick={handleReject}
            loading={actionLoading}
          >
            Reject
          </Button>
        </>
      );
    }

    if (status === 'processing') {
      return (
        <>
          <Button
            icon={<CheckOutlined />}
            type="primary"
            size="large"
            onClick={handleApprove}
            loading={actionLoading}
          >
            Approve Refund
          </Button>
          <Button
            icon={<CloseOutlined />}
            danger
            size="large"
            onClick={handleReject}
            loading={actionLoading}
          >
            Reject
          </Button>
        </>
      );
    }

    if (status === 'approved') {
      return (
        <Button
          icon={<CheckOutlined />}
          type="primary"
          size="large"
          onClick={handleComplete}
          loading={actionLoading}
        >
          Mark as Completed
        </Button>
      );
    }

    return null;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <Link href="/protected/returns">
            <Button icon={<ArrowLeftOutlined />}>Back to Returns</Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">{returnOrder.rmaNumber}</h1>
            <p className="text-gray-600 mt-1">{returnOrder.customer} - {returnOrder.orderNumber}</p>
          </div>
          <Tag color={getStatusColor(returnOrder.status)} className="text-lg px-3 py-1">
            {returnOrder.status.toUpperCase()}
          </Tag>
        </div>
        <Space>
          <Button icon={<PrinterOutlined />} size="large" onClick={handlePrint}>
            Print
          </Button>
          <Popconfirm
            title="Delete this return?"
            description="This action cannot be undone."
            onConfirm={handleDelete}
            okText="Yes, Delete"
            cancelText="No"
            okButtonProps={{ danger: true }}
          >
            <Button icon={<DeleteOutlined />} danger size="large">
              Delete
            </Button>
          </Popconfirm>
          {renderActionButtons()}
        </Space>
      </div>

      <Card className="shadow-sm">
        <Tabs activeKey={activeTab} onChange={setActiveTab} items={tabItems} size="large" />
      </Card>

      {/* Add Item Modal */}
      <Modal
        title="Add Returned Item"
        open={addItemModal}
        onCancel={() => { setAddItemModal(false); itemForm.resetFields(); }}
        onOk={() => itemForm.submit()}
        okText="Add Item"
      >
        <Form form={itemForm} layout="vertical" onFinish={handleAddItem}>
          <Form.Item label="SKU" name="sku" rules={[{ required: true }]}>
            <Input placeholder="Enter product SKU" />
          </Form.Item>
          <Form.Item label="Product Name" name="name" rules={[{ required: true }]}>
            <Input placeholder="Enter product name" />
          </Form.Item>
          <Form.Item label="Quantity" name="quantity" rules={[{ required: true }]}>
            <InputNumber min={1} style={{ width: '100%' }} placeholder="Enter quantity" />
          </Form.Item>
          <Form.Item label="Condition" name="condition" rules={[{ required: true }]}>
            <Select placeholder="Select condition">
              <Option value="Damaged">Damaged</Option>
              <Option value="Defective">Defective</Option>
              <Option value="Wrong Item">Wrong Item</Option>
              <Option value="Good">Good</Option>
            </Select>
          </Form.Item>
          <Form.Item label="Refund Amount ($)" name="refundAmount" rules={[{ required: true }]}>
            <InputNumber min={0} precision={2} style={{ width: '100%' }} placeholder="Enter refund amount" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
