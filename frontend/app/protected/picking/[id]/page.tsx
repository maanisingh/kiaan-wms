'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Card, Descriptions, Tag, Button, Tabs, Timeline, Table, Spin, Alert,
  Progress, Modal, Form, InputNumber, Input, App, Row, Col, Statistic
} from 'antd';
import {
  ArrowLeftOutlined, CheckCircleOutlined, PrinterOutlined, UserOutlined,
  ScanOutlined, LoadingOutlined, BarcodeOutlined, EnvironmentOutlined,
  InboxOutlined, ReloadOutlined, PlayCircleOutlined
} from '@ant-design/icons';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import apiService from '@/services/api';
import BarcodeScanner from '@/components/BarcodeScanner';

interface PickItem {
  id: string;
  productId: string;
  product: {
    id: string;
    name: string;
    sku: string;
    barcode?: string;
  };
  locationId?: string;
  location?: {
    id: string;
    code: string;
    name: string;
  };
  quantityRequired: number;
  quantityPicked: number;
  status: 'PENDING' | 'PICKED' | 'SHORT_PICKED' | 'SKIPPED';
  lotNumber?: string;
  sequenceNumber: number;
}

interface PickList {
  id: string;
  pickListNumber: string;
  type: 'SINGLE' | 'BATCH' | 'WAVE' | 'ZONE';
  orderId?: string;
  SalesOrder?: {
    id: string;
    orderNumber: string;
    customer?: { id: string; name: string };
    items?: any[];
  };
  assignedUserId?: string;
  User?: { id: string; name: string; email: string };
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  enforceSingleBBDate: boolean;
  pickItems: PickItem[];
  startedAt?: string;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export default function PickingDetailPage() {
  const { message } = App.useApp();
  const router = useRouter();
  const params = useParams();
  const [pickList, setPickList] = useState<PickList | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('details');
  const [scanModalOpen, setScanModalOpen] = useState(false);
  const [scanningItem, setScanningItem] = useState<PickItem | null>(null);
  const [scanning, setScanning] = useState(false);
  const [scanForm] = Form.useForm();
  const scanInputRef = useRef<any>(null);

  const fetchPickList = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await apiService.get(`/picking/${params.id}`);
      setPickList(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch pick list');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Guard against undefined or invalid ID
    if (!params?.id || params.id === 'undefined' || params.id === 'null') {
      router.push('/protected/picking');
      return;
    }
    fetchPickList();
  }, [params?.id, router]);

  const handleStartPicking = async () => {
    try {
      await apiService.patch(`/picking/${params.id}`, {
        status: 'IN_PROGRESS'
      });
      message.success('Picking started!');
      fetchPickList();
    } catch (err: any) {
      message.error(err.message || 'Failed to start picking');
    }
  };

  const handleCompletePicking = async () => {
    try {
      await apiService.patch(`/picking/${params.id}`, {
        status: 'COMPLETED'
      });
      message.success('Pick list completed!');
      fetchPickList();
    } catch (err: any) {
      message.error(err.message || 'Failed to complete pick list');
    }
  };

  const handleOpenScanModal = (item: PickItem) => {
    setScanningItem(item);
    scanForm.resetFields();
    scanForm.setFieldsValue({
      quantityPicked: item.quantityRequired - item.quantityPicked,
    });
    setScanModalOpen(true);
    // Focus scan input after modal opens
    setTimeout(() => {
      scanInputRef.current?.focus();
    }, 100);
  };

  const handleScanSubmit = async (values: any) => {
    if (!scanningItem) return;

    try {
      setScanning(true);
      await apiService.patch(`/picking/${params.id}/items/${scanningItem.id}/pick`, {
        quantityPicked: scanningItem.quantityPicked + values.quantityPicked,
        scannedBarcode: values.barcode || undefined,
        lotNumber: values.lotNumber || undefined,
      });
      message.success(`Picked ${values.quantityPicked} units of ${scanningItem.product.name}`);
      setScanModalOpen(false);
      fetchPickList();
    } catch (err: any) {
      message.error(err.message || 'Failed to record pick');
    } finally {
      setScanning(false);
    }
  };

  const handleQuickPick = async (item: PickItem) => {
    try {
      await apiService.patch(`/picking/${params.id}/items/${item.id}/pick`, {
        quantityPicked: item.quantityRequired,
      });
      message.success(`${item.product.name} fully picked!`);
      fetchPickList();
    } catch (err: any) {
      message.error(err.message || 'Failed to pick item');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spin indicator={<LoadingOutlined style={{ fontSize: 48 }} spin />} tip="Loading pick list..." />
      </div>
    );
  }

  if (error || !pickList) {
    return (
      <div className="p-6">
        <Alert
          type="error"
          message="Error Loading Pick List"
          description={error || 'Pick list not found'}
          action={
            <Button onClick={() => router.push('/picking')}>
              Back to Pick Lists
            </Button>
          }
        />
      </div>
    );
  }

  const totalRequired = pickList.pickItems.reduce((sum, item) => sum + item.quantityRequired, 0);
  const totalPicked = pickList.pickItems.reduce((sum, item) => sum + item.quantityPicked, 0);
  const progressPercent = totalRequired > 0 ? Math.round((totalPicked / totalRequired) * 100) : 0;
  const pendingItems = pickList.pickItems.filter(i => i.status === 'PENDING').length;
  const pickedItems = pickList.pickItems.filter(i => i.status === 'PICKED').length;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return 'orange';
      case 'IN_PROGRESS': return 'blue';
      case 'COMPLETED': return 'green';
      case 'CANCELLED': return 'red';
      case 'PICKED': return 'green';
      case 'SHORT_PICKED': return 'volcano';
      case 'SKIPPED': return 'gray';
      default: return 'default';
    }
  };

  const itemColumns = [
    {
      title: '#',
      dataIndex: 'sequenceNumber',
      key: 'seq',
      width: 50,
    },
    {
      title: 'SKU',
      key: 'sku',
      width: 120,
      render: (_: any, record: PickItem) => (
        <code className="bg-gray-100 px-2 py-1 rounded text-sm">{record.product?.sku}</code>
      ),
    },
    {
      title: 'Product',
      key: 'product',
      width: 200,
      render: (_: any, record: PickItem) => (
        <div>
          <div className="font-medium">{record.product?.name}</div>
          {record.product?.barcode && (
            <div className="text-xs text-gray-400">
              <BarcodeOutlined className="mr-1" />
              {record.product.barcode}
            </div>
          )}
        </div>
      ),
    },
    {
      title: 'Location',
      key: 'location',
      width: 120,
      render: (_: any, record: PickItem) => (
        record.location ? (
          <Tag icon={<EnvironmentOutlined />} color="purple">
            {record.location.code}
          </Tag>
        ) : (
          <span className="text-gray-400">Not assigned</span>
        )
      ),
    },
    {
      title: 'Required',
      dataIndex: 'quantityRequired',
      key: 'required',
      width: 90,
      render: (qty: number) => <span className="font-semibold">{qty}</span>,
    },
    {
      title: 'Picked',
      dataIndex: 'quantityPicked',
      key: 'picked',
      width: 90,
      render: (qty: number, record: PickItem) => (
        <span className={qty >= record.quantityRequired ? 'text-green-600 font-bold' : 'text-orange-500'}>
          {qty}
        </span>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 110,
      render: (status: string) => (
        <Tag color={getStatusColor(status)}>{status.replace('_', ' ')}</Tag>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 180,
      render: (_: any, record: PickItem) => (
        pickList.status !== 'COMPLETED' && record.status !== 'PICKED' ? (
          <div className="flex gap-2">
            <Button
              type="primary"
              size="small"
              icon={<ScanOutlined />}
              onClick={() => handleOpenScanModal(record)}
            >
              Scan
            </Button>
            <Button
              size="small"
              onClick={() => handleQuickPick(record)}
            >
              Quick Pick
            </Button>
          </div>
        ) : (
          <CheckCircleOutlined className="text-green-500 text-lg" />
        )
      ),
    },
  ];

  const tabItems = [
    {
      key: 'details',
      label: 'Pick List Details',
      children: (
        <div className="space-y-6">
          <Card title="Pick List Information">
            <Descriptions column={2} bordered size="small">
              <Descriptions.Item label="Pick List Number">
                <span className="font-semibold">{pickList.pickListNumber}</span>
              </Descriptions.Item>
              <Descriptions.Item label="Type">
                <Tag color="blue">{pickList.type}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Order Number">
                {pickList.SalesOrder?.orderNumber || <span className="text-gray-400">N/A</span>}
              </Descriptions.Item>
              <Descriptions.Item label="Customer">
                {pickList.SalesOrder?.customer?.name || <span className="text-gray-400">N/A</span>}
              </Descriptions.Item>
              <Descriptions.Item label="Assigned To">
                {pickList.User ? (
                  <Tag icon={<UserOutlined />} color="blue">{pickList.User.name}</Tag>
                ) : (
                  <span className="text-gray-400">Unassigned</span>
                )}
              </Descriptions.Item>
              <Descriptions.Item label="Priority">
                <Tag color={pickList.priority === 'HIGH' ? 'red' : pickList.priority === 'MEDIUM' ? 'orange' : 'blue'}>
                  {pickList.priority}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Status">
                <Tag color={getStatusColor(pickList.status)}>{pickList.status.replace('_', ' ')}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Single BB Date">
                {pickList.enforceSingleBBDate ? 'Yes' : 'No'}
              </Descriptions.Item>
              <Descriptions.Item label="Created">
                {new Date(pickList.createdAt).toLocaleString()}
              </Descriptions.Item>
              {pickList.startedAt && (
                <Descriptions.Item label="Started">
                  {new Date(pickList.startedAt).toLocaleString()}
                </Descriptions.Item>
              )}
              {pickList.completedAt && (
                <Descriptions.Item label="Completed">
                  {new Date(pickList.completedAt).toLocaleString()}
                </Descriptions.Item>
              )}
            </Descriptions>
          </Card>

          <Card
            title={`Items to Pick (${pickList.pickItems.length})`}
            extra={
              <div className="flex items-center gap-4">
                <span className="text-sm text-gray-500">
                  Progress: {totalPicked} / {totalRequired} units
                </span>
                <Progress
                  percent={progressPercent}
                  size="small"
                  style={{ width: 150 }}
                  status={progressPercent === 100 ? 'success' : 'active'}
                />
              </div>
            }
          >
            <Table
              dataSource={pickList.pickItems}
              columns={itemColumns}
              rowKey="id"
              pagination={false}
              rowClassName={(record) =>
                record.status === 'PICKED' ? 'bg-green-50' : ''
              }
            />
          </Card>
        </div>
      ),
    },
    {
      key: 'order',
      label: 'Order Details',
      children: pickList.SalesOrder ? (
        <Card title={`Order: ${pickList.SalesOrder.orderNumber}`}>
          <Descriptions column={2} bordered size="small">
            <Descriptions.Item label="Order Number">{pickList.SalesOrder.orderNumber}</Descriptions.Item>
            <Descriptions.Item label="Customer">{pickList.SalesOrder.customer?.name || 'N/A'}</Descriptions.Item>
          </Descriptions>
          {pickList.SalesOrder.items && pickList.SalesOrder.items.length > 0 && (
            <div className="mt-4">
              <h4 className="font-semibold mb-2">Order Items:</h4>
              <Table
                dataSource={pickList.SalesOrder.items}
                columns={[
                  { title: 'Product', dataIndex: ['product', 'name'], key: 'name' },
                  { title: 'SKU', dataIndex: ['product', 'sku'], key: 'sku' },
                  { title: 'Qty', dataIndex: 'quantity', key: 'qty' },
                ]}
                rowKey="id"
                pagination={false}
                size="small"
              />
            </div>
          )}
        </Card>
      ) : (
        <Alert message="No order linked to this pick list" type="info" />
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <Link href="/protected/picking">
            <Button icon={<ArrowLeftOutlined />}>Back to Pick Lists</Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">{pickList.pickListNumber}</h1>
            <p className="text-gray-600 mt-1">
              {pickList.SalesOrder ? `Order: ${pickList.SalesOrder.orderNumber}` : 'Manual Pick List'}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button icon={<ReloadOutlined />} onClick={fetchPickList}>
            Refresh
          </Button>
          <Button icon={<PrinterOutlined />}>Print</Button>
          {pickList.status === 'PENDING' && (
            <Button type="primary" icon={<PlayCircleOutlined />} onClick={handleStartPicking}>
              Start Picking
            </Button>
          )}
          {pickList.status === 'IN_PROGRESS' && pickedItems === pickList.pickItems.length && (
            <Button type="primary" icon={<CheckCircleOutlined />} onClick={handleCompletePicking}>
              Complete
            </Button>
          )}
        </div>
      </div>

      {/* Stats */}
      <Row gutter={16}>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic
              title="Total Items"
              value={pickList.pickItems.length}
              prefix={<InboxOutlined />}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic
              title="Picked"
              value={pickedItems}
              valueStyle={{ color: '#52c41a' }}
              prefix={<CheckCircleOutlined />}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic
              title="Remaining"
              value={pendingItems}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic
              title="Progress"
              value={progressPercent}
              suffix="%"
              valueStyle={{ color: progressPercent === 100 ? '#52c41a' : '#1890ff' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Main Content */}
      <Card>
        <Tabs activeKey={activeTab} onChange={setActiveTab} items={tabItems} size="large" />
      </Card>

      {/* Scan Modal */}
      <Modal
        title={
          <div className="flex items-center gap-2">
            <ScanOutlined className="text-blue-500" />
            <span>Scan & Pick Item</span>
          </div>
        }
        open={scanModalOpen}
        onCancel={() => setScanModalOpen(false)}
        onOk={() => scanForm.submit()}
        confirmLoading={scanning}
        okText="Confirm Pick"
      >
        {scanningItem && (
          <>
            <div className="bg-blue-50 p-4 rounded-lg mb-4">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-bold text-lg">{scanningItem.product.name}</h3>
                  <p className="text-gray-600">SKU: {scanningItem.product.sku}</p>
                  {scanningItem.product.barcode && (
                    <p className="text-gray-500 text-sm">
                      <BarcodeOutlined className="mr-1" />
                      Barcode: {scanningItem.product.barcode}
                    </p>
                  )}
                </div>
                {scanningItem.location && (
                  <Tag icon={<EnvironmentOutlined />} color="purple" className="text-lg px-3 py-1">
                    {scanningItem.location.code}
                  </Tag>
                )}
              </div>
              <div className="mt-3 flex justify-between">
                <span>Required: <strong>{scanningItem.quantityRequired}</strong></span>
                <span>Already Picked: <strong>{scanningItem.quantityPicked}</strong></span>
                <span>Remaining: <strong className="text-orange-600">{scanningItem.quantityRequired - scanningItem.quantityPicked}</strong></span>
              </div>
            </div>

            <Form form={scanForm} layout="vertical" onFinish={handleScanSubmit}>
              <Form.Item
                label="Scan Barcode (Optional)"
                name="barcode"
                help="Use camera or enter barcode manually to verify correct item"
              >
                <div className="flex gap-2">
                  <Input
                    ref={scanInputRef}
                    prefix={<BarcodeOutlined />}
                    placeholder="Scan or enter barcode..."
                    size="large"
                    className="flex-1"
                  />
                  <BarcodeScanner
                    onScan={(barcode) => {
                      scanForm.setFieldsValue({ barcode });
                      message.success(`Scanned: ${barcode}`);
                    }}
                    buttonText="Camera"
                    buttonSize="large"
                  />
                </div>
              </Form.Item>

              <Form.Item
                label="Quantity to Pick"
                name="quantityPicked"
                rules={[
                  { required: true, message: 'Enter quantity' },
                  {
                    validator: (_, value) => {
                      const remaining = scanningItem.quantityRequired - scanningItem.quantityPicked;
                      if (value > remaining) {
                        return Promise.reject(`Cannot pick more than ${remaining} units`);
                      }
                      return Promise.resolve();
                    }
                  }
                ]}
              >
                <InputNumber
                  min={1}
                  max={scanningItem.quantityRequired - scanningItem.quantityPicked}
                  size="large"
                  style={{ width: '100%' }}
                />
              </Form.Item>

              <Form.Item label="Lot Number (Optional)" name="lotNumber">
                <Input placeholder="Enter lot/batch number if applicable" />
              </Form.Item>
            </Form>
          </>
        )}
      </Modal>
    </div>
  );
}
