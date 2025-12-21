'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, Descriptions, Tag, Button, Tabs, Table, Timeline, Spin, Alert, Form, InputNumber, Input, message, Modal, App } from 'antd';
import { ArrowLeftOutlined, PrinterOutlined, CheckCircleOutlined, WarningOutlined, SaveOutlined, EditOutlined, ReloadOutlined } from '@ant-design/icons';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { formatDate } from '@/lib/utils';
import apiService from '@/services/api';

interface CycleCountItem {
  id: string;
  productId: string;
  product: {
    id: string;
    name: string;
    sku: string;
  };
  expectedQuantity: number;
  countedQuantity: number | null;
  variance: number;
  status: 'PENDING' | 'COUNTED' | 'DISCREPANCY' | 'VERIFIED';
  notes?: string;
}

interface CycleCount {
  id: string;
  referenceNumber?: string;
  name?: string;
  type: string;
  locationId?: string;
  location?: {
    id: string;
    name?: string;
    aisle: string;
    rack: string;
    bin: string;
    zone?: { name: string };
  };
  scheduledDate?: string;
  completedDate?: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  countedBy?: {
    id: string;
    name: string;
    email: string;
  };
  items?: CycleCountItem[];
  itemsCount?: number;
  discrepancies?: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export default function CycleCountDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { modal, message: msg } = App.useApp();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('details');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cycleCount, setCycleCount] = useState<CycleCount | null>(null);
  const [items, setItems] = useState<CycleCountItem[]>([]);
  const [saving, setSaving] = useState(false);
  const [editingItem, setEditingItem] = useState<string | null>(null);
  const [countForm] = Form.useForm();
  const [cycleCountId, setCycleCountId] = useState<string | null>(null);

  // Unwrap params (Next.js 15+ async params)
  useEffect(() => {
    params.then(p => setCycleCountId(p.id));
  }, [params]);

  // Fetch cycle count details
  const fetchCycleCount = useCallback(async () => {
    if (!cycleCountId) return;
    try {
      setLoading(true);
      setError(null);
      const data = await apiService.get(`/inventory/cycle-counts/${cycleCountId}`);
      setCycleCount(data);
      setItems(data.items || []);
    } catch (err: any) {
      console.error('Failed to fetch cycle count:', err);
      setError(err.message || 'Failed to load cycle count details');
    } finally {
      setLoading(false);
    }
  }, [cycleCountId]);

  useEffect(() => {
    if (cycleCountId) {
      fetchCycleCount();
    }
  }, [cycleCountId, fetchCycleCount]);

  // Update item count
  const handleUpdateCount = async (itemId: string, countedQuantity: number, notes?: string) => {
    if (!cycleCountId) return;
    try {
      setSaving(true);
      await apiService.patch(`/inventory/cycle-counts/${cycleCountId}/items/${itemId}`, {
        countedQuantity,
        notes,
      });
      msg.success('Count updated successfully');
      setEditingItem(null);
      countForm.resetFields();
      fetchCycleCount();
    } catch (err: any) {
      console.error('Failed to update count:', err);
      msg.error(err.message || 'Failed to update count');
    } finally {
      setSaving(false);
    }
  };

  // Complete cycle count
  const handleComplete = async () => {
    modal.confirm({
      title: 'Complete Cycle Count',
      content: 'Are you sure you want to mark this cycle count as completed? Make sure all items have been counted.',
      okText: 'Complete',
      okType: 'primary',
      onOk: async () => {
        try {
          await apiService.patch(`/inventory/cycle-counts/${cycleCountId}`, {
            status: 'COMPLETED',
            completedDate: new Date().toISOString(),
          });
          msg.success('Cycle count completed successfully');
          fetchCycleCount();
        } catch (err: any) {
          console.error('Failed to complete cycle count:', err);
          msg.error(err.message || 'Failed to complete cycle count');
        }
      },
    });
  };

  // Start counting (change status to IN_PROGRESS)
  const handleStartCounting = async () => {
    try {
      await apiService.patch(`/inventory/cycle-counts/${cycleCountId}`, {
        status: 'IN_PROGRESS',
      });
      msg.success('Cycle count started');
      fetchCycleCount();
    } catch (err: any) {
      console.error('Failed to start counting:', err);
      msg.error(err.message || 'Failed to start counting');
    }
  };

  // Cancel cycle count
  const handleCancel = async () => {
    modal.confirm({
      title: 'Cancel Cycle Count',
      content: 'Are you sure you want to cancel this cycle count?',
      okText: 'Cancel Count',
      okType: 'danger',
      onOk: async () => {
        try {
          await apiService.patch(`/inventory/cycle-counts/${cycleCountId}`, {
            status: 'CANCELLED',
          });
          msg.success('Cycle count cancelled');
          router.push('/inventory/cycle-counts');
        } catch (err: any) {
          console.error('Failed to cancel cycle count:', err);
          msg.error(err.message || 'Failed to cancel cycle count');
        }
      },
    });
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      COMPLETED: 'green',
      IN_PROGRESS: 'blue',
      PENDING: 'orange',
      CANCELLED: 'red',
      COUNTED: 'green',
      DISCREPANCY: 'red',
      VERIFIED: 'cyan',
    };
    return colors[status] || 'default';
  };

  const itemColumns = [
    {
      title: 'SKU',
      dataIndex: ['product', 'sku'],
      key: 'sku',
      width: 120,
      render: (sku: string) => <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">{sku || '-'}</span>
    },
    {
      title: 'Product',
      dataIndex: ['product', 'name'],
      key: 'product',
      width: 200
    },
    {
      title: 'Expected',
      dataIndex: 'expectedQuantity',
      key: 'expected',
      width: 100,
      render: (qty: number) => qty || 0
    },
    {
      title: 'Counted',
      dataIndex: 'countedQuantity',
      key: 'counted',
      width: 120,
      render: (qty: number | null, record: CycleCountItem) => {
        if (editingItem === record.id) {
          return (
            <Form form={countForm} layout="inline" onFinish={(values) => handleUpdateCount(record.id, values.countedQuantity, values.notes)}>
              <Form.Item name="countedQuantity" initialValue={qty} rules={[{ required: true }]} style={{ marginBottom: 0 }}>
                <InputNumber min={0} style={{ width: 80 }} />
              </Form.Item>
              <Button type="primary" size="small" htmlType="submit" loading={saving} icon={<SaveOutlined />} />
              <Button size="small" onClick={() => { setEditingItem(null); countForm.resetFields(); }}>Cancel</Button>
            </Form>
          );
        }
        return (
          <div className="flex items-center gap-2">
            <span>{qty !== null ? qty : '-'}</span>
            {cycleCount?.status !== 'COMPLETED' && cycleCount?.status !== 'CANCELLED' && (
              <Button
                type="text"
                size="small"
                icon={<EditOutlined />}
                onClick={() => {
                  setEditingItem(record.id);
                  countForm.setFieldsValue({ countedQuantity: qty });
                }}
              />
            )}
          </div>
        );
      }
    },
    {
      title: 'Variance',
      key: 'variance',
      width: 100,
      render: (_: any, record: CycleCountItem) => {
        if (record.countedQuantity === null) return '-';
        const variance = record.countedQuantity - record.expectedQuantity;
        return (
          <span className={variance === 0 ? 'text-green-600' : 'text-red-600 font-semibold'}>
            {variance > 0 ? `+${variance}` : variance}
          </span>
        );
      }
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status: string) => <Tag color={getStatusColor(status)}>{status?.replace('_', ' ') || 'PENDING'}</Tag>
    },
    {
      title: 'Notes',
      dataIndex: 'notes',
      key: 'notes',
      width: 150,
      ellipsis: true,
      render: (notes: string) => notes || '-'
    },
  ];

  // Calculate statistics
  const totalExpected = items.reduce((sum, item) => sum + (item.expectedQuantity || 0), 0);
  const totalCounted = items.reduce((sum, item) => sum + (item.countedQuantity || 0), 0);
  const discrepancyCount = items.filter(item =>
    item.countedQuantity !== null && item.countedQuantity !== item.expectedQuantity
  ).length;
  const accuracy = items.length > 0 && items.every(i => i.countedQuantity !== null)
    ? ((items.length - discrepancyCount) / items.length * 100).toFixed(1)
    : null;

  const tabItems = [
    {
      key: 'details',
      label: 'Count Details',
      children: (
        <div className="space-y-6">
          <Card title="Cycle Count Information">
            <Descriptions column={2} bordered>
              <Descriptions.Item label="Reference">{cycleCount?.referenceNumber || cycleCount?.id}</Descriptions.Item>
              <Descriptions.Item label="Status">
                <Tag color={getStatusColor(cycleCount?.status || '')}>{cycleCount?.status?.replace('_', ' ')}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Type">{cycleCount?.type || '-'}</Descriptions.Item>
              <Descriptions.Item label="Location">
                {cycleCount?.location
                  ? `${cycleCount.location.aisle}-${cycleCount.location.rack}-${cycleCount.location.bin}`
                  : '-'}
              </Descriptions.Item>
              <Descriptions.Item label="Scheduled Date">{cycleCount?.scheduledDate ? formatDate(cycleCount.scheduledDate) : '-'}</Descriptions.Item>
              <Descriptions.Item label="Completed Date">{cycleCount?.completedDate ? formatDate(cycleCount.completedDate) : 'In Progress'}</Descriptions.Item>
              <Descriptions.Item label="Counter">{cycleCount?.countedBy?.name || '-'}</Descriptions.Item>
              <Descriptions.Item label="Items Count">{items.length}</Descriptions.Item>
              <Descriptions.Item label="Discrepancies">
                {discrepancyCount > 0 ? (
                  <Tag color="red" icon={<WarningOutlined />}>{discrepancyCount}</Tag>
                ) : (
                  <Tag color="green" icon={<CheckCircleOutlined />}>{discrepancyCount}</Tag>
                )}
              </Descriptions.Item>
              <Descriptions.Item label="Accuracy">
                {accuracy ? `${accuracy}%` : 'Pending'}
              </Descriptions.Item>
            </Descriptions>
          </Card>

          {cycleCount?.notes && (
            <Card title="Notes">
              <p>{cycleCount.notes}</p>
            </Card>
          )}

          <Card title="Counted Items">
            <Table
              dataSource={items}
              columns={itemColumns}
              rowKey="id"
              pagination={false}
              scroll={{ x: 900 }}
            />
          </Card>
        </div>
      ),
    },
    {
      key: 'summary',
      label: 'Summary',
      children: (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <div className="text-center">
                <p className="text-gray-500 text-sm">Total Expected</p>
                <p className="text-3xl font-bold text-blue-600">{totalExpected}</p>
              </div>
            </Card>
            <Card>
              <div className="text-center">
                <p className="text-gray-500 text-sm">Total Counted</p>
                <p className="text-3xl font-bold text-green-600">{totalCounted}</p>
              </div>
            </Card>
            <Card>
              <div className="text-center">
                <p className="text-gray-500 text-sm">Total Variance</p>
                <p className={`text-3xl font-bold ${totalCounted - totalExpected === 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {totalCounted - totalExpected > 0 ? `+${totalCounted - totalExpected}` : totalCounted - totalExpected}
                </p>
              </div>
            </Card>
          </div>

          {discrepancyCount > 0 && (
            <Card title="Items with Discrepancies" className="border-red-200">
              <Table
                dataSource={items.filter(item => item.countedQuantity !== null && item.countedQuantity !== item.expectedQuantity)}
                columns={itemColumns}
                rowKey="id"
                pagination={false}
                scroll={{ x: 900 }}
              />
            </Card>
          )}
        </div>
      ),
    },
  ];

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <Spin size="large" tip="Loading cycle count details..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/inventory/cycle-counts">
            <Button icon={<ArrowLeftOutlined />}>Back to Cycle Counts</Button>
          </Link>
        </div>
        <Alert
          message="Error"
          description={error}
          type="error"
          showIcon
          action={
            <Button size="small" onClick={fetchCycleCount}>
              Retry
            </Button>
          }
        />
      </div>
    );
  }

  if (!cycleCount) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/inventory/cycle-counts">
            <Button icon={<ArrowLeftOutlined />}>Back to Cycle Counts</Button>
          </Link>
        </div>
        <Alert
          message="Not Found"
          description="Cycle count not found"
          type="warning"
          showIcon
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <Link href="/inventory/cycle-counts">
            <Button icon={<ArrowLeftOutlined />}>Back to Cycle Counts</Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">{cycleCount.name || cycleCount.referenceNumber || `Cycle Count ${cycleCount.id.slice(0, 8)}`}</h1>
            <p className="text-gray-600 mt-1">
              {cycleCount.location
                ? `Location: ${cycleCount.location.aisle}-${cycleCount.location.rack}-${cycleCount.location.bin}`
                : 'Cycle Count'}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button icon={<ReloadOutlined />} onClick={fetchCycleCount}>Refresh</Button>
          <Button icon={<PrinterOutlined />} size="large">Print</Button>
          {cycleCount.status === 'PENDING' && (
            <Button type="primary" size="large" onClick={handleStartCounting}>
              Start Counting
            </Button>
          )}
          {cycleCount.status === 'IN_PROGRESS' && (
            <>
              <Button danger size="large" onClick={handleCancel}>
                Cancel
              </Button>
              <Button icon={<CheckCircleOutlined />} type="primary" size="large" onClick={handleComplete}>
                Complete Count
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <div className="text-center">
            <p className="text-gray-500 text-sm">Items to Count</p>
            <p className="text-2xl font-bold text-blue-600">{items.length}</p>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <p className="text-gray-500 text-sm">Items Counted</p>
            <p className="text-2xl font-bold text-green-600">{items.filter(i => i.countedQuantity !== null).length}</p>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <p className="text-gray-500 text-sm">Discrepancies</p>
            <p className="text-2xl font-bold text-red-600">{discrepancyCount}</p>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <p className="text-gray-500 text-sm">Accuracy</p>
            <p className="text-2xl font-bold text-purple-600">{accuracy ? `${accuracy}%` : 'N/A'}</p>
          </div>
        </Card>
      </div>

      <Card className="shadow-sm">
        <Tabs activeKey={activeTab} onChange={setActiveTab} items={tabItems} size="large" />
      </Card>
    </div>
  );
}
