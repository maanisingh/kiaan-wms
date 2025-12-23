'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Card, Descriptions, Tag, Button, Tabs, Timeline, Table, Space, Modal, Form, Input, Select, message, Spin, Progress, Alert, Tooltip, Divider, InputNumber, Row, Col, Statistic } from 'antd';
import {
  ArrowLeftOutlined, CheckCircleOutlined, PrinterOutlined, UserOutlined, RocketOutlined,
  BarcodeOutlined, ScanOutlined, InboxOutlined, EnvironmentOutlined, PhoneOutlined,
  MailOutlined, CalendarOutlined, ClockCircleOutlined, CarOutlined, ReloadOutlined,
  ExclamationCircleOutlined, CheckOutlined, CloseOutlined, EditOutlined, ScissorOutlined
} from '@ant-design/icons';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import apiService from '@/services/api';
import { formatDate } from '@/lib/utils';
import BarcodeScanner from '@/components/BarcodeScanner';

const { Option } = Select;
const { TextArea } = Input;

interface PackingItem {
  id: string;
  productId: string;
  sku: string;
  name: string;
  barcode: string;
  quantity: number;
  quantityPicked: number;
  quantityPacked: number;
  weight: number;
  location: string;
  batchNumber?: string;
  expiryDate?: string;
  status: 'pending' | 'packed';
}

interface PackingTask {
  id: string;
  packingSlip: string;
  pickListId: string;
  pickListNumber: string;
  orderId: string;
  orderNumber: string;
  customer: {
    id: string;
    name: string;
    email: string;
    phone: string;
  };
  shippingAddress: {
    street: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
  status: string;
  priority: string;
  packer?: string;
  packerId?: string;
  totalItems: number;
  totalSKUs: number;
  packedItems: number;
  weight: string;
  shippingMethod?: string;
  carrier?: string;
  trackingNumber?: string;
  notes?: string;
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
  items: PackingItem[];
}

export default function PackingDetailPage() {
  const router = useRouter();
  const params = useParams();
  const [loading, setLoading] = useState(true);
  const [packingTask, setPackingTask] = useState<PackingTask | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('items');
  const [scanModalVisible, setScanModalVisible] = useState(false);
  const [trackingModalVisible, setTrackingModalVisible] = useState(false);
  const [shippingModalVisible, setShippingModalVisible] = useState(false);
  const [currentItem, setCurrentItem] = useState<PackingItem | null>(null);
  const [processing, setProcessing] = useState(false);
  const [karrioToken, setKarrioToken] = useState<string | null>(null);
  const [carriers, setCarriers] = useState<any[]>([]);
  const [shippingRates, setShippingRates] = useState<any[]>([]);
  const [loadingRates, setLoadingRates] = useState(false);
  const [weightBreakdown, setWeightBreakdown] = useState<any>(null);
  const [manualWeight, setManualWeight] = useState<number | null>(null);
  const [weightModalVisible, setWeightModalVisible] = useState(false);
  const [loadingWeight, setLoadingWeight] = useState(false);
  const scanInputRef = useRef<any>(null);
  const [scanForm] = Form.useForm();
  const [trackingForm] = Form.useForm();
  const [shippingForm] = Form.useForm();
  const [weightForm] = Form.useForm();

  const fetchPackingTask = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await apiService.get(`/packing/${params.id}`);
      setPackingTask(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch packing task');
      message.error(err.message || 'Failed to fetch packing task');
    } finally {
      setLoading(false);
    }
  };

  // Fetch Karrio token from localStorage
  const loadKarrioToken = () => {
    const token = localStorage.getItem('karrio_token');
    if (token) {
      setKarrioToken(token);
      return token;
    }
    return null;
  };

  // Fetch connected carriers from Karrio
  const fetchCarriers = async (token: string) => {
    try {
      const response = await apiService.get('/shipping/connections', {
        headers: { 'X-Karrio-Token': token }
      });
      setCarriers(response?.results || []);
    } catch (err) {
      console.error('Failed to fetch carriers:', err);
    }
  };

  // Fetch weight calculation from backend
  const fetchWeightCalculation = async (orderId: string, customWeight?: number | null) => {
    setLoadingWeight(true);
    try {
      const payload: any = { orderId };
      if (customWeight && customWeight > 0) {
        payload.manualWeight = customWeight;
      }
      const response = await apiService.post('/shipping/rates', payload);
      if (response?.weightBreakdown) {
        setWeightBreakdown(response.weightBreakdown);
      }
    } catch (err) {
      console.error('Failed to fetch weight calculation:', err);
    } finally {
      setLoadingWeight(false);
    }
  };

  // Handle saving manual weight
  const handleSaveWeight = async (values: any) => {
    const newWeight = values.weight;
    setManualWeight(newWeight);
    if (packingTask?.orderId) {
      await fetchWeightCalculation(packingTask.orderId, newWeight);
    }
    setWeightModalVisible(false);
    message.success('Weight updated successfully');
  };

  // Reset to auto-calculated weight
  const handleResetWeight = async () => {
    setManualWeight(null);
    if (packingTask?.orderId) {
      await fetchWeightCalculation(packingTask.orderId, null);
    }
    message.success('Weight reset to auto-calculated value');
  };

  // Fetch shipping rates from Karrio
  const fetchShippingRates = async () => {
    if (!packingTask || !karrioToken) return;

    setLoadingRates(true);
    try {
      // Parse weight from packingTask.weight (e.g., "2.5 kg" -> 2.5)
      const weightMatch = packingTask.weight?.match(/[\d.]+/);
      const weightValue = weightMatch ? parseFloat(weightMatch[0]) : 1;
      const weightUnit = packingTask.weight?.toLowerCase().includes('lb') ? 'LB' : 'KG';

      const rateRequest = {
        karrio_token: karrioToken,
        rate_request: {
          shipper: {
            postal_code: '10001', // Default shipper - should come from settings
            city: 'New York',
            country_code: 'US',
            state_code: 'NY'
          },
          recipient: {
            postal_code: packingTask.shippingAddress?.postalCode || '10001',
            city: packingTask.shippingAddress?.city || 'New York',
            country_code: packingTask.shippingAddress?.country === 'USA' ? 'US' : (packingTask.shippingAddress?.country || 'US'),
            state_code: packingTask.shippingAddress?.state || 'NY'
          },
          parcels: [{
            weight: weightValue,
            weight_unit: weightUnit,
            length: 10,
            width: 10,
            height: 10,
            dimension_unit: 'CM'
          }]
        }
      };

      const response = await apiService.post('/shipping/rates', rateRequest);
      setShippingRates(response?.rates || []);
    } catch (err: any) {
      console.error('Failed to fetch rates:', err);
      message.error('Failed to fetch shipping rates');
    } finally {
      setLoadingRates(false);
    }
  };

  useEffect(() => {
    if (params.id) {
      fetchPackingTask();
    }
    const token = loadKarrioToken();
    if (token) {
      fetchCarriers(token);
    }
  }, [params.id]);

  // Fetch weight calculation when packing task is loaded
  useEffect(() => {
    if (packingTask?.orderId) {
      fetchWeightCalculation(packingTask.orderId, manualWeight);
    }
  }, [packingTask?.orderId]);

  const handleStartPacking = async () => {
    try {
      setProcessing(true);
      await apiService.patch(`/packing/${params.id}`, { action: 'start_packing' });
      message.success('Packing started');
      fetchPackingTask();
    } catch (err: any) {
      message.error(err.message || 'Failed to start packing');
    } finally {
      setProcessing(false);
    }
  };

  const handleCompletePacking = async () => {
    try {
      setProcessing(true);
      await apiService.patch(`/packing/${params.id}`, { action: 'complete_packing' });
      message.success('Packing completed');
      fetchPackingTask();
    } catch (err: any) {
      message.error(err.message || 'Failed to complete packing');
    } finally {
      setProcessing(false);
    }
  };

  const handleReadyToShip = async () => {
    // Check if Karrio is configured
    if (!karrioToken) {
      message.warning('Please configure Karrio shipping in Settings > Shipping Carriers first');
      // Fall back to simple status update
      try {
        setProcessing(true);
        await apiService.patch(`/packing/${params.id}`, { action: 'ready_to_ship' });
        message.success('Marked as ready to ship');
        fetchPackingTask();
      } catch (err: any) {
        message.error(err.message || 'Failed to update status');
      } finally {
        setProcessing(false);
      }
      return;
    }

    // Open shipping modal with Karrio integration
    setShippingModalVisible(true);
    fetchShippingRates();
  };

  // Create shipment via Karrio
  const handleCreateShipment = async (values: any) => {
    if (!packingTask || !karrioToken) return;

    setProcessing(true);
    try {
      // Parse weight
      const weightMatch = packingTask.weight?.match(/[\d.]+/);
      const weightValue = weightMatch ? parseFloat(weightMatch[0]) : 1;
      const weightUnit = packingTask.weight?.toLowerCase().includes('lb') ? 'LB' : 'KG';

      const shipmentRequest = {
        karrio_token: karrioToken,
        orderId: packingTask.orderId,
        shipment: {
          service: values.service,
          shipper: {
            person_name: 'Kiaan WMS',
            company_name: 'Kiaan Warehouse',
            address_line1: '123 Warehouse St',
            city: 'New York',
            postal_code: '10001',
            country_code: 'US',
            state_code: 'NY',
            phone_number: '+1234567890',
            email: 'shipping@kiaan-wms.com'
          },
          recipient: {
            person_name: packingTask.customer.name,
            address_line1: packingTask.shippingAddress?.street || '',
            city: packingTask.shippingAddress?.city || '',
            postal_code: packingTask.shippingAddress?.postalCode || '',
            country_code: packingTask.shippingAddress?.country === 'USA' ? 'US' : (packingTask.shippingAddress?.country || 'US'),
            state_code: packingTask.shippingAddress?.state || '',
            phone_number: packingTask.customer.phone || '',
            email: packingTask.customer.email || ''
          },
          parcels: [{
            weight: weightValue,
            weight_unit: weightUnit,
            length: values.length || 10,
            width: values.width || 10,
            height: values.height || 10,
            dimension_unit: 'CM',
            packaging_type: values.packaging || 'your_packaging'
          }],
          label_type: 'PDF',
          reference: packingTask.orderNumber
        }
      };

      const response = await apiService.post('/shipping/shipments', shipmentRequest);

      if (response?.tracking_number) {
        message.success(`Shipment created! Tracking: ${response.tracking_number}`);

        // Update packing task with tracking info
        await apiService.patch(`/packing/${params.id}`, {
          action: 'add_tracking',
          trackingNumber: response.tracking_number,
          carrier: response.carrier_name || values.carrier,
          shippingMethod: response.service || values.service
        });

        // Mark as ready to ship
        await apiService.patch(`/packing/${params.id}`, { action: 'ready_to_ship' });

        // Open shipping label in new window if available
        if (response.label_url) {
          window.open(response.label_url, '_blank');
        } else if (response.docs?.label) {
          // Base64 label
          const labelWindow = window.open('', '_blank');
          if (labelWindow) {
            labelWindow.document.write(`
              <html><head><title>Shipping Label - ${response.tracking_number}</title></head>
              <body style="margin:0;padding:0;">
                <embed src="data:application/pdf;base64,${response.docs.label}" type="application/pdf" width="100%" height="100%" />
              </body></html>
            `);
          }
        }

        setShippingModalVisible(false);
        shippingForm.resetFields();
        fetchPackingTask();
      } else {
        throw new Error('No tracking number returned');
      }
    } catch (err: any) {
      console.error('Shipment error:', err);
      message.error(err.message || 'Failed to create shipment');
    } finally {
      setProcessing(false);
    }
  };

  // Quick ship without Karrio (manual tracking entry)
  const handleQuickShip = async () => {
    try {
      setProcessing(true);
      await apiService.patch(`/packing/${params.id}`, { action: 'ready_to_ship' });
      message.success('Marked as ready to ship');
      setShippingModalVisible(false);
      fetchPackingTask();
    } catch (err: any) {
      message.error(err.message || 'Failed to update status');
    } finally {
      setProcessing(false);
    }
  };

  const handleAddTracking = async (values: any) => {
    try {
      setProcessing(true);
      await apiService.patch(`/packing/${params.id}`, {
        action: 'add_tracking',
        trackingNumber: values.trackingNumber,
        carrier: values.carrier,
        shippingMethod: values.shippingMethod
      });
      message.success('Tracking information added');
      setTrackingModalVisible(false);
      trackingForm.resetFields();
      fetchPackingTask();
    } catch (err: any) {
      message.error(err.message || 'Failed to add tracking');
    } finally {
      setProcessing(false);
    }
  };

  const handleScanItem = (item: PackingItem) => {
    setCurrentItem(item);
    setScanModalVisible(true);
    scanForm.resetFields();
    setTimeout(() => scanInputRef.current?.focus(), 100);
  };

  const handleScanSubmit = async (values: any) => {
    if (!currentItem || !packingTask) return;

    const scannedBarcode = values.barcode.trim();

    try {
      setProcessing(true);

      // Call the backend API to pack the item
      const response = await apiService.patch(
        `/packing/${packingTask.id}/items/${currentItem.id}/pack`,
        {
          quantityPacked: currentItem.quantity,
          scannedBarcode: scannedBarcode
        }
      );

      message.success(`Item ${currentItem.name} verified and packed`);

      // Check if all items are packed
      if (response.allItemsPacked) {
        message.info('All items packed! Ready to complete packing.');
      }

      // Refresh the packing task to get updated data
      fetchPackingTask();

      setScanModalVisible(false);
      scanForm.resetFields();
    } catch (err: any) {
      // Handle barcode mismatch error from backend
      if (err.response?.data?.error?.includes('Barcode does not match')) {
        message.error(`Barcode mismatch! Expected ${err.response?.data?.expectedBarcode || currentItem.barcode || currentItem.sku}, got ${scannedBarcode}`);
      } else {
        message.error(err.message || 'Failed to pack item');
      }
      scanForm.resetFields();
      scanInputRef.current?.focus();
    } finally {
      setProcessing(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ready_to_pack': return 'orange';
      case 'packing': return 'blue';
      case 'packed': return 'cyan';
      case 'ready_to_ship': return 'green';
      case 'shipped': return 'default';
      default: return 'default';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority?.toLowerCase()) {
      case 'high': return 'red';
      case 'medium': return 'orange';
      case 'low': return 'blue';
      default: return 'default';
    }
  };

  const handlePrintLabel = () => {
    if (!packingTask) return;

    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Packing Label - ${packingTask.packingSlip}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; }
          .label { border: 2px solid #000; padding: 20px; max-width: 400px; margin: 0 auto; }
          .header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 10px; margin-bottom: 10px; }
          .header h1 { margin: 0; font-size: 24px; }
          .header h2 { margin: 5px 0; font-size: 16px; color: #666; }
          .section { margin: 15px 0; }
          .section-title { font-weight: bold; font-size: 12px; color: #666; margin-bottom: 5px; }
          .section-content { font-size: 14px; }
          .address { line-height: 1.6; }
          .barcode { text-align: center; font-family: monospace; font-size: 20px; letter-spacing: 5px; margin: 15px 0; padding: 10px; border: 1px dashed #ccc; }
          .items { margin-top: 15px; }
          .items table { width: 100%; border-collapse: collapse; font-size: 12px; }
          .items th, .items td { border: 1px solid #ddd; padding: 5px; text-align: left; }
          .items th { background: #f5f5f5; }
          .footer { text-align: center; margin-top: 15px; font-size: 10px; color: #999; }
          @media print { body { padding: 0; } }
        </style>
      </head>
      <body>
        <div class="label">
          <div class="header">
            <h1>PACKING SLIP</h1>
            <h2>${packingTask.packingSlip}</h2>
          </div>

          <div class="barcode">${packingTask.packingSlip}</div>

          <div class="section">
            <div class="section-title">SHIP TO:</div>
            <div class="section-content address">
              <strong>${packingTask.customer.name}</strong><br>
              ${packingTask.shippingAddress?.street || ''}<br>
              ${packingTask.shippingAddress?.city || ''}, ${packingTask.shippingAddress?.state || ''} ${packingTask.shippingAddress?.postalCode || ''}<br>
              ${packingTask.shippingAddress?.country || ''}
            </div>
          </div>

          <div class="section">
            <div class="section-title">ORDER INFO:</div>
            <div class="section-content">
              Order: ${packingTask.orderNumber}<br>
              Items: ${packingTask.totalItems} units (${packingTask.totalSKUs} SKUs)<br>
              Weight: ${packingTask.weight}
              ${packingTask.trackingNumber ? `<br>Tracking: ${packingTask.trackingNumber}` : ''}
            </div>
          </div>

          <div class="items">
            <table>
              <thead>
                <tr><th>SKU</th><th>Product</th><th>Qty</th></tr>
              </thead>
              <tbody>
                ${packingTask.items.map(item => `
                  <tr>
                    <td>${item.sku}</td>
                    <td>${item.name}</td>
                    <td>${item.quantity}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>

          <div class="footer">
            Packed: ${new Date().toLocaleString()}<br>
            Kiaan WMS - Packing System
          </div>
        </div>
        <script>window.onload = function() { window.print(); }</script>
      </body>
      </html>
    `;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
    } else {
      message.error('Please allow popups to print labels');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <Spin size="large" tip="Loading packing task..." />
      </div>
    );
  }

  if (error || !packingTask) {
    return (
      <div className="space-y-6">
        <Link href="/protected/packing">
          <Button icon={<ArrowLeftOutlined />}>Back to Packing</Button>
        </Link>
        <Alert
          message="Error Loading Packing Task"
          description={error || 'Packing task not found'}
          type="error"
          showIcon
          action={
            <Button onClick={fetchPackingTask}>Retry</Button>
          }
        />
      </div>
    );
  }

  const packedCount = packingTask.items.filter(i => i.status === 'packed').length;
  const totalCount = packingTask.items.length;
  const packingProgress = totalCount > 0 ? Math.round((packedCount / totalCount) * 100) : 0;

  const itemColumns = [
    {
      title: 'SKU',
      dataIndex: 'sku',
      key: 'sku',
      width: 120,
      render: (text: string) => <code className="bg-gray-100 px-2 py-1 rounded text-xs">{text}</code>
    },
    {
      title: 'Product',
      dataIndex: 'name',
      key: 'name',
      width: 200,
      render: (text: string, record: PackingItem) => (
        <div>
          <div className="font-medium">{text}</div>
          {record.barcode && (
            <div className="text-xs text-gray-400">
              <BarcodeOutlined className="mr-1" />{record.barcode}
            </div>
          )}
        </div>
      )
    },
    {
      title: 'Location',
      dataIndex: 'location',
      key: 'location',
      width: 100,
      render: (text: string) => <Tag color="blue">{text}</Tag>
    },
    {
      title: 'Quantity',
      key: 'quantity',
      width: 120,
      render: (_: any, record: PackingItem) => (
        <span>
          <strong>{record.quantityPacked}</strong> / {record.quantity}
        </span>
      )
    },
    {
      title: 'Batch/Expiry',
      key: 'batch',
      width: 150,
      render: (_: any, record: PackingItem) => (
        <div className="text-xs">
          {record.batchNumber && <div>Batch: {record.batchNumber}</div>}
          {record.expiryDate && (
            <div className="text-orange-600">
              Exp: {formatDate(record.expiryDate)}
            </div>
          )}
        </div>
      )
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => (
        <Tag
          color={status === 'packed' ? 'green' : 'orange'}
          icon={status === 'packed' ? <CheckCircleOutlined /> : <ClockCircleOutlined />}
        >
          {status.toUpperCase()}
        </Tag>
      )
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 120,
      render: (_: any, record: PackingItem) => (
        <Space>
          {record.status !== 'packed' && packingTask.status === 'packing' && (
            <Tooltip title="Scan to verify and pack">
              <Button
                type="primary"
                icon={<ScanOutlined />}
                size="small"
                onClick={() => handleScanItem(record)}
              >
                Scan
              </Button>
            </Tooltip>
          )}
          {record.status === 'packed' && (
            <Tag color="green" icon={<CheckOutlined />}>Verified</Tag>
          )}
        </Space>
      )
    }
  ];

  const tabItems = [
    {
      key: 'items',
      label: (
        <span className="flex items-center gap-2">
          <InboxOutlined /> Items ({totalCount})
        </span>
      ),
      children: (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <Progress
                type="circle"
                percent={packingProgress}
                size={60}
                strokeColor={packingProgress === 100 ? '#52c41a' : '#1890ff'}
              />
              <div>
                <div className="text-lg font-semibold">{packedCount} of {totalCount} items packed</div>
                <div className="text-gray-500">{packingTask.totalItems} total units</div>
              </div>
            </div>
            {packingTask.status === 'packing' && (
              <BarcodeScanner
                onScan={(barcode) => {
                  const item = packingTask.items.find(i => i.barcode === barcode || i.sku === barcode);
                  if (item) {
                    if (item.status === 'packed') {
                      message.warning(`Item ${item.name} already packed`);
                    } else {
                      handleScanItem(item);
                      scanForm.setFieldsValue({ barcode });
                    }
                  } else {
                    message.error(`No matching item found for barcode: ${barcode}`);
                  }
                }}
                buttonText="Open Scanner"
                buttonSize="large"
              />
            )}
          </div>
          <Table
            columns={itemColumns}
            dataSource={packingTask.items}
            rowKey="id"
            pagination={false}
            rowClassName={(record) => record.status === 'packed' ? 'bg-green-50' : ''}
          />
        </div>
      )
    },
    {
      key: 'shipping',
      label: (
        <span className="flex items-center gap-2">
          <RocketOutlined /> Shipping
        </span>
      ),
      children: (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card title={<><UserOutlined className="mr-2" />Customer Information</>} size="small">
            <Descriptions column={1} size="small">
              <Descriptions.Item label="Name">{packingTask.customer.name}</Descriptions.Item>
              <Descriptions.Item label="Email">
                <a href={`mailto:${packingTask.customer.email}`} className="text-blue-600">
                  <MailOutlined className="mr-1" />{packingTask.customer.email}
                </a>
              </Descriptions.Item>
              <Descriptions.Item label="Phone">
                <a href={`tel:${packingTask.customer.phone}`} className="text-blue-600">
                  <PhoneOutlined className="mr-1" />{packingTask.customer.phone}
                </a>
              </Descriptions.Item>
            </Descriptions>
          </Card>

          <Card title={<><EnvironmentOutlined className="mr-2" />Shipping Address</>} size="small">
            <div className="text-gray-700">
              <div className="font-medium">{packingTask.customer.name}</div>
              <div>{packingTask.shippingAddress.street}</div>
              <div>
                {packingTask.shippingAddress.city}, {packingTask.shippingAddress.state} {packingTask.shippingAddress.postalCode}
              </div>
              <div>{packingTask.shippingAddress.country}</div>
            </div>
          </Card>

          <Card title={<><CarOutlined className="mr-2" />Shipping Details</>} size="small" className="md:col-span-2">
            <Descriptions column={2} size="small">
              <Descriptions.Item label="Shipping Method">
                {packingTask.shippingMethod || 'Not specified'}
              </Descriptions.Item>
              <Descriptions.Item label="Carrier">
                {packingTask.carrier || 'Not assigned'}
              </Descriptions.Item>
              <Descriptions.Item label="Tracking Number">
                {packingTask.trackingNumber ? (
                  <code className="bg-gray-100 px-2 py-1 rounded">{packingTask.trackingNumber}</code>
                ) : (
                  <span className="text-gray-400">Not assigned</span>
                )}
              </Descriptions.Item>
              <Descriptions.Item label="Weight">
                <div className="flex items-center gap-2">
                  <span className="font-medium">
                    {weightBreakdown ? `${weightBreakdown.total?.toFixed(2)} kg` : packingTask.weight}
                  </span>
                  {weightBreakdown && (
                    <span className="text-xs text-gray-400">
                      ({weightBreakdown.products?.toFixed(2)} + {weightBreakdown.packaging?.toFixed(2)} packaging)
                    </span>
                  )}
                  <Button
                    type="link"
                    size="small"
                    icon={<EditOutlined />}
                    onClick={() => {
                      weightForm.setFieldsValue({ weight: weightBreakdown?.total || 0 });
                      setWeightModalVisible(true);
                    }}
                  >
                    Edit
                  </Button>
                </div>
              </Descriptions.Item>
            </Descriptions>
            {!packingTask.trackingNumber && (packingTask.status === 'packed' || packingTask.status === 'ready_to_ship') && (
              <Button
                type="primary"
                icon={<CarOutlined />}
                onClick={() => setTrackingModalVisible(true)}
                className="mt-4"
              >
                Add Tracking Information
              </Button>
            )}
          </Card>
        </div>
      )
    },
    {
      key: 'details',
      label: (
        <span className="flex items-center gap-2">
          <CalendarOutlined /> Details
        </span>
      ),
      children: (
        <Card>
          <Descriptions column={2} bordered size="small">
            <Descriptions.Item label="Packing Slip">{packingTask.packingSlip}</Descriptions.Item>
            <Descriptions.Item label="Pick List">
              <Link href={`/protected/picking/${packingTask.pickListId}`} className="text-blue-600 hover:underline">
                {packingTask.pickListNumber}
              </Link>
            </Descriptions.Item>
            <Descriptions.Item label="Sales Order">
              <Link href={`/protected/sales-orders/${packingTask.orderId}`} className="text-blue-600 hover:underline">
                {packingTask.orderNumber}
              </Link>
            </Descriptions.Item>
            <Descriptions.Item label="Status">
              <Tag color={getStatusColor(packingTask.status)} className="uppercase">
                {packingTask.status.replace(/_/g, ' ')}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Priority">
              <Tag color={getPriorityColor(packingTask.priority)} className="uppercase">
                {packingTask.priority}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Packer">
              {packingTask.packer ? (
                <Tag icon={<UserOutlined />} color="blue">{packingTask.packer}</Tag>
              ) : (
                <span className="text-gray-400">Not assigned</span>
              )}
            </Descriptions.Item>
            <Descriptions.Item label="Created">
              {formatDate(packingTask.createdAt)}
            </Descriptions.Item>
            {packingTask.startedAt && (
              <Descriptions.Item label="Started">
                {formatDate(packingTask.startedAt)}
              </Descriptions.Item>
            )}
            {packingTask.completedAt && (
              <Descriptions.Item label="Completed">
                {formatDate(packingTask.completedAt)}
              </Descriptions.Item>
            )}
            <Descriptions.Item label="Notes" span={2}>
              {packingTask.notes || <span className="text-gray-400">No notes</span>}
            </Descriptions.Item>
          </Descriptions>
        </Card>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <Link href="/protected/packing">
            <Button icon={<ArrowLeftOutlined />}>Back to Packing</Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
              {packingTask.packingSlip}
            </h1>
            <p className="text-gray-600 mt-1">
              Order: {packingTask.orderNumber} | Customer: {packingTask.customer.name}
            </p>
          </div>
        </div>
        <Space>
          <Button icon={<ReloadOutlined />} onClick={fetchPackingTask} loading={loading}>
            Refresh
          </Button>
          <Button icon={<PrinterOutlined />} size="large" onClick={handlePrintLabel}>Print Label</Button>

          {packingTask.status === 'ready_to_pack' && (
            <Button
              type="primary"
              icon={<ScanOutlined />}
              size="large"
              onClick={handleStartPacking}
              loading={processing}
            >
              Start Packing
            </Button>
          )}

          {packingTask.status === 'packing' && packingProgress === 100 && (
            <Button
              type="primary"
              icon={<CheckCircleOutlined />}
              size="large"
              onClick={handleCompletePacking}
              loading={processing}
            >
              Complete Packing
            </Button>
          )}

          {packingTask.status === 'packed' && (
            <Button
              type="primary"
              icon={<RocketOutlined />}
              size="large"
              onClick={handleReadyToShip}
              loading={processing}
            >
              Ready to Ship
            </Button>
          )}
        </Space>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card className="border-t-4 border-t-blue-500">
          <div className="text-center">
            <p className="text-gray-500 text-sm">Total Items</p>
            <p className="text-2xl font-bold text-blue-600">{packingTask.totalItems}</p>
            <p className="text-xs text-gray-400">{packingTask.totalSKUs} SKUs</p>
          </div>
        </Card>
        <Card className="border-t-4 border-t-green-500">
          <div className="text-center">
            <p className="text-gray-500 text-sm">Packed</p>
            <p className="text-2xl font-bold text-green-600">{packingTask.packedItems}</p>
            <p className="text-xs text-gray-400">of {packingTask.totalItems}</p>
          </div>
        </Card>
        <Card
          className="border-t-4 border-t-purple-500 cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => {
            weightForm.setFieldsValue({ weight: weightBreakdown?.total || 0 });
            setWeightModalVisible(true);
          }}
        >
          <div className="text-center">
            <p className="text-gray-500 text-sm flex items-center justify-center gap-1">
              Weight <EditOutlined className="text-xs" />
            </p>
            <p className="text-2xl font-bold text-purple-600">
              {loadingWeight ? <Spin size="small" /> : `${(weightBreakdown?.total || 0).toFixed(2)} kg`}
            </p>
            {weightBreakdown && !weightBreakdown.isManual && (
              <p className="text-xs text-gray-400">Auto-calculated</p>
            )}
            {weightBreakdown?.isManual && (
              <p className="text-xs text-blue-500">Manual override</p>
            )}
          </div>
        </Card>
        <Card className="border-t-4 border-t-orange-500">
          <div className="text-center">
            <p className="text-gray-500 text-sm">Priority</p>
            <Tag color={getPriorityColor(packingTask.priority)} className="text-lg uppercase">
              {packingTask.priority}
            </Tag>
          </div>
        </Card>
        <Card className="border-t-4 border-t-cyan-500">
          <div className="text-center">
            <p className="text-gray-500 text-sm">Status</p>
            <Tag color={getStatusColor(packingTask.status)} className="text-lg uppercase">
              {packingTask.status.replace(/_/g, ' ')}
            </Tag>
          </div>
        </Card>
      </div>

      <Card className="shadow-sm">
        <Tabs activeKey={activeTab} onChange={setActiveTab} items={tabItems} size="large" />
      </Card>

      {/* Scan Item Modal */}
      <Modal
        title={
          <div className="flex items-center gap-2">
            <ScanOutlined className="text-blue-500" />
            Scan Item to Verify & Pack
          </div>
        }
        open={scanModalVisible}
        onCancel={() => {
          setScanModalVisible(false);
          setCurrentItem(null);
        }}
        footer={null}
        width={500}
      >
        {currentItem && (
          <div className="space-y-4">
            <Card size="small" className="bg-blue-50">
              <div className="flex justify-between items-center">
                <div>
                  <div className="font-semibold text-lg">{currentItem.name}</div>
                  <div className="text-gray-500">SKU: {currentItem.sku}</div>
                  <div className="text-gray-500">Location: {currentItem.location}</div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-blue-600">{currentItem.quantity}</div>
                  <div className="text-xs text-gray-500">units to pack</div>
                </div>
              </div>
              {currentItem.barcode && (
                <div className="mt-2 pt-2 border-t">
                  <span className="text-gray-500">Expected barcode: </span>
                  <code className="bg-white px-2 py-1 rounded font-mono">{currentItem.barcode}</code>
                </div>
              )}
            </Card>

            <Form form={scanForm} onFinish={handleScanSubmit} layout="vertical">
              <Form.Item
                name="barcode"
                label="Scan or Enter Barcode"
                rules={[{ required: true, message: 'Please scan or enter barcode' }]}
              >
                <div className="flex gap-2">
                  <Input
                    ref={scanInputRef}
                    prefix={<BarcodeOutlined />}
                    placeholder="Scan barcode or enter manually..."
                    size="large"
                    autoFocus
                    onPressEnter={() => scanForm.submit()}
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
              <div className="flex justify-end gap-2">
                <Button onClick={() => setScanModalVisible(false)}>Cancel</Button>
                <Button type="primary" htmlType="submit" icon={<CheckCircleOutlined />}>
                  Verify & Pack
                </Button>
              </div>
            </Form>
          </div>
        )}
      </Modal>

      {/* Add Tracking Modal */}
      <Modal
        title={
          <div className="flex items-center gap-2">
            <CarOutlined className="text-green-500" />
            Add Tracking Information
          </div>
        }
        open={trackingModalVisible}
        onCancel={() => setTrackingModalVisible(false)}
        footer={null}
        width={500}
      >
        <Form form={trackingForm} onFinish={handleAddTracking} layout="vertical">
          <Form.Item
            name="carrier"
            label="Carrier"
            rules={[{ required: true, message: 'Please select carrier' }]}
          >
            <Select placeholder="Select carrier" size="large">
              <Option value="UPS">UPS</Option>
              <Option value="FedEx">FedEx</Option>
              <Option value="DHL">DHL</Option>
              <Option value="USPS">USPS</Option>
              <Option value="Aramex">Aramex</Option>
              <Option value="Other">Other</Option>
            </Select>
          </Form.Item>
          <Form.Item
            name="trackingNumber"
            label="Tracking Number"
            rules={[{ required: true, message: 'Please enter tracking number' }]}
          >
            <Input prefix={<BarcodeOutlined />} placeholder="Enter tracking number" size="large" />
          </Form.Item>
          <Form.Item
            name="shippingMethod"
            label="Shipping Method"
          >
            <Select placeholder="Select shipping method" size="large">
              <Option value="Standard">Standard Shipping</Option>
              <Option value="Express">Express Shipping</Option>
              <Option value="Overnight">Overnight Delivery</Option>
              <Option value="Economy">Economy Shipping</Option>
            </Select>
          </Form.Item>
          <div className="flex justify-end gap-2">
            <Button onClick={() => setTrackingModalVisible(false)}>Cancel</Button>
            <Button type="primary" htmlType="submit" loading={processing} icon={<CheckCircleOutlined />}>
              Save Tracking Info
            </Button>
          </div>
        </Form>
      </Modal>

      {/* Karrio Shipping Modal */}
      <Modal
        title={
          <div className="flex items-center gap-2">
            <RocketOutlined className="text-blue-500" />
            Create Shipment
          </div>
        }
        open={shippingModalVisible}
        onCancel={() => {
          setShippingModalVisible(false);
          shippingForm.resetFields();
        }}
        footer={null}
        width={700}
      >
        {packingTask && (
          <div className="space-y-4">
            {/* Shipping Address Summary */}
            <Card size="small" className="bg-gray-50">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-xs text-gray-500 uppercase mb-1">Ship To</div>
                  <div className="font-medium">{packingTask.customer.name}</div>
                  <div className="text-sm text-gray-600">
                    {packingTask.shippingAddress?.street}<br />
                    {packingTask.shippingAddress?.city}, {packingTask.shippingAddress?.state} {packingTask.shippingAddress?.postalCode}<br />
                    {packingTask.shippingAddress?.country}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-gray-500 uppercase mb-1">Package Details</div>
                  <div className="text-sm">
                    <div>Order: <strong>{packingTask.orderNumber}</strong></div>
                    <div>Items: <strong>{packingTask.totalItems}</strong> ({packingTask.totalSKUs} SKUs)</div>
                    <div>Weight: <strong>{packingTask.weight}</strong></div>
                  </div>
                </div>
              </div>
            </Card>

            {/* Connected Carriers */}
            {carriers.length > 0 ? (
              <div>
                <div className="text-sm font-medium mb-2">Connected Carriers ({carriers.length})</div>
                <div className="flex flex-wrap gap-2 mb-4">
                  {carriers.map((carrier: any) => (
                    <Tag key={carrier.id} color="blue" className="text-sm">
                      {carrier.carrier_name}
                    </Tag>
                  ))}
                </div>
              </div>
            ) : (
              <Alert
                type="warning"
                message="No carriers connected"
                description={
                  <span>
                    Connect carriers in{' '}
                    <a href="/protected/settings/carriers" className="text-blue-600">
                      Settings → Shipping Carriers
                    </a>
                  </span>
                }
                showIcon
              />
            )}

            {/* Shipping Rates */}
            {loadingRates ? (
              <div className="text-center py-8">
                <Spin tip="Fetching shipping rates..." />
              </div>
            ) : shippingRates.length > 0 ? (
              <div>
                <div className="text-sm font-medium mb-2">Available Shipping Options</div>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {shippingRates.map((rate: any, index: number) => (
                    <Card
                      key={index}
                      size="small"
                      className="cursor-pointer hover:border-blue-400 transition-colors"
                      onClick={() => {
                        shippingForm.setFieldsValue({
                          service: rate.service,
                          carrier: rate.carrier_name
                        });
                      }}
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <div className="font-medium">{rate.service}</div>
                          <div className="text-sm text-gray-500">{rate.carrier_name}</div>
                          {rate.estimated_delivery && (
                            <div className="text-xs text-gray-400">
                              Est. delivery: {rate.estimated_delivery}
                            </div>
                          )}
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold text-green-600">
                            ${rate.total_charge?.toFixed(2) || rate.total_amount || '0.00'}
                          </div>
                          <div className="text-xs text-gray-400">{rate.currency || 'USD'}</div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            ) : carriers.length > 0 ? (
              <Alert
                type="info"
                message="No rates available"
                description="Unable to fetch rates for this shipment. You can still create a shipment manually."
                showIcon
              />
            ) : null}

            <Divider />

            {/* Shipment Form */}
            <Form form={shippingForm} onFinish={handleCreateShipment} layout="vertical">
              <div className="grid grid-cols-2 gap-4">
                <Form.Item
                  name="service"
                  label="Shipping Service"
                  rules={[{ required: true, message: 'Please select a service' }]}
                >
                  <Select placeholder="Select service" size="large">
                    <Option value="ups_ground">UPS Ground</Option>
                    <Option value="ups_express">UPS Express</Option>
                    <Option value="fedex_ground">FedEx Ground</Option>
                    <Option value="fedex_express">FedEx Express</Option>
                    <Option value="dhl_express">DHL Express</Option>
                    <Option value="usps_priority">USPS Priority</Option>
                    <Option value="usps_first_class">USPS First Class</Option>
                  </Select>
                </Form.Item>
                <Form.Item
                  name="carrier"
                  label="Carrier"
                >
                  <Select placeholder="Select carrier" size="large">
                    <Option value="ups">UPS</Option>
                    <Option value="fedex">FedEx</Option>
                    <Option value="dhl">DHL</Option>
                    <Option value="usps">USPS</Option>
                    <Option value="aramex">Aramex</Option>
                  </Select>
                </Form.Item>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <Form.Item name="length" label="Length (cm)">
                  <Input type="number" placeholder="10" size="large" />
                </Form.Item>
                <Form.Item name="width" label="Width (cm)">
                  <Input type="number" placeholder="10" size="large" />
                </Form.Item>
                <Form.Item name="height" label="Height (cm)">
                  <Input type="number" placeholder="10" size="large" />
                </Form.Item>
              </div>

              <Form.Item name="packaging" label="Packaging Type">
                <Select placeholder="Select packaging" size="large">
                  <Option value="your_packaging">Your Packaging</Option>
                  <Option value="envelope">Envelope</Option>
                  <Option value="pak">Pak</Option>
                  <Option value="tube">Tube</Option>
                  <Option value="small_box">Small Box</Option>
                  <Option value="medium_box">Medium Box</Option>
                  <Option value="large_box">Large Box</Option>
                </Select>
              </Form.Item>

              <div className="flex justify-between gap-2 pt-4 border-t">
                <Button onClick={handleQuickShip} loading={processing}>
                  Skip & Mark Ready to Ship
                </Button>
                <Space>
                  <Button onClick={() => setShippingModalVisible(false)}>Cancel</Button>
                  <Button
                    type="primary"
                    htmlType="submit"
                    loading={processing}
                    icon={<RocketOutlined />}
                    disabled={carriers.length === 0}
                  >
                    Create Shipment & Print Label
                  </Button>
                </Space>
              </div>
            </Form>
          </div>
        )}
      </Modal>

      {/* Weight Edit Modal */}
      <Modal
        title={
          <div className="flex items-center gap-2">
            <ScissorOutlined className="text-purple-500" />
            Package Weight
          </div>
        }
        open={weightModalVisible}
        onCancel={() => setWeightModalVisible(false)}
        footer={null}
        width={550}
      >
        <div className="space-y-4">
          {/* Weight Breakdown */}
          {weightBreakdown && !weightBreakdown.isManual && (
            <Card size="small" className="bg-gray-50">
              <div className="text-sm font-medium mb-3">Auto-Calculated Weight Breakdown</div>
              <Row gutter={[16, 16]}>
                <Col span={8}>
                  <Statistic
                    title={<span className="text-xs">Products</span>}
                    value={weightBreakdown.products?.toFixed(2) || '0.00'}
                    suffix="kg"
                    valueStyle={{ fontSize: '18px', color: '#3b82f6' }}
                  />
                </Col>
                <Col span={8}>
                  <Statistic
                    title={<span className="text-xs">Packaging</span>}
                    value={weightBreakdown.packaging?.toFixed(2) || '0.00'}
                    suffix="kg"
                    valueStyle={{ fontSize: '18px', color: '#8b5cf6' }}
                  />
                </Col>
                <Col span={8}>
                  <Statistic
                    title={<span className="text-xs font-bold">Total</span>}
                    value={weightBreakdown.total?.toFixed(2) || '0.00'}
                    suffix="kg"
                    valueStyle={{ fontSize: '18px', color: '#059669', fontWeight: 'bold' }}
                  />
                </Col>
              </Row>
              {weightBreakdown.details && (
                <div className="mt-3 pt-3 border-t">
                  <div className="text-xs text-gray-500 mb-2">Packaging Details:</div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="flex justify-between">
                      <span>Box ({weightBreakdown.boxType || weightBreakdown.details.boxType}):</span>
                      <span className="font-medium">{weightBreakdown.details.boxWeight?.toFixed(2)} kg</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Bubble Wrap:</span>
                      <span className="font-medium">{weightBreakdown.details.bubbleWrap?.toFixed(2)} kg</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Paper Fill:</span>
                      <span className="font-medium">{weightBreakdown.details.paperFill?.toFixed(2)} kg</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Tape & Label:</span>
                      <span className="font-medium">{weightBreakdown.details.tapeAndLabel?.toFixed(2)} kg</span>
                    </div>
                  </div>
                  <div className="mt-2 text-xs text-gray-400">
                    {weightBreakdown.itemCount} item(s) in package
                  </div>
                </div>
              )}
            </Card>
          )}

          {weightBreakdown?.isManual && (
            <Alert
              type="info"
              message="Manual Weight Override"
              description={`Using manually entered weight of ${weightBreakdown.total?.toFixed(2)} kg`}
              showIcon
              action={
                <Button size="small" onClick={handleResetWeight}>
                  Reset to Auto
                </Button>
              }
            />
          )}

          <Form form={weightForm} onFinish={handleSaveWeight} layout="vertical">
            <Form.Item
              name="weight"
              label="Override Total Weight (kg)"
              rules={[{ required: true, message: 'Please enter weight' }]}
              extra="Enter total package weight including products and packaging materials"
            >
              <InputNumber
                min={0.01}
                max={100}
                step={0.01}
                precision={2}
                style={{ width: '100%' }}
                size="large"
                placeholder="e.g., 2.50"
                addonAfter="kg"
              />
            </Form.Item>

            <div className="flex justify-end gap-2 pt-4 border-t">
              {weightBreakdown?.isManual && (
                <Button onClick={handleResetWeight}>
                  Reset to Auto-Calculated
                </Button>
              )}
              <Button onClick={() => setWeightModalVisible(false)}>Cancel</Button>
              <Button type="primary" htmlType="submit" icon={<CheckCircleOutlined />}>
                Save Weight
              </Button>
            </div>
          </Form>

          <div className="text-xs text-gray-400 mt-4">
            <strong>Tip:</strong> Auto-calculated weight includes product weights from inventory plus estimated packaging materials.
            You can override this if you've weighed the actual package.
          </div>
        </div>
      </Modal>
    </div>
  );
}
