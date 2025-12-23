'use client';

import React, { useState, useEffect } from 'react';
import { Card, Descriptions, Tag, Button, Tabs, Timeline, Space, Table, Spin, Alert, Statistic, Row, Col } from 'antd';
import { ArrowLeftOutlined, PrinterOutlined, TruckOutlined, ReloadOutlined, DollarOutlined } from '@ant-design/icons';
import Link from 'next/link';
import { formatDate } from '@/lib/utils';
import apiService from '@/services/api';

interface Shipment {
  id: string;
  trackingNumber: string;
  carrier: string;
  service?: string;
  status: string;
  shippingCost?: number;
  weight?: number;
  shippedAt?: string;
  deliveredAt?: string;
  estimatedDelivery?: string;
  order?: {
    id: string;
    orderNumber: string;
    customer?: { name: string; address?: string; postcode?: string };
    totalAmount?: number;
    salesChannel?: string;
    shippingAddress?: string;
  };
}

export default function ShipmentDetailPage({ params }: { params: { id: string } }) {
  const [activeTab, setActiveTab] = useState('details');
  const [shipment, setShipment] = useState<Shipment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rates, setRates] = useState<any>(null);

  useEffect(() => {
    fetchShipment();
  }, [params.id]);

  const fetchShipment = async () => {
    try {
      setLoading(true);
      setError(null);

      // Try to fetch shipment from API
      const data = await apiService.get(`/shipments/${params.id}`);
      setShipment(data);

      // Also fetch rates for this shipment's weight
      if (data.order?.id) {
        try {
          const rateData = await apiService.post('/shipping/rates', { orderId: data.order.id });
          setRates(rateData);
        } catch (e) {
          console.log('Could not fetch rates');
        }
      }
    } catch (err: any) {
      console.error('Error fetching shipment:', err);
      // Fallback to showing order as shipment if shipment not found
      try {
        const order = await apiService.get(`/sales-orders/${params.id}`);
        if (order && order.trackingNumber) {
          setShipment({
            id: order.id,
            trackingNumber: order.trackingNumber,
            carrier: order.carrier || 'Unknown',
            service: order.shippingMethod,
            status: order.status === 'SHIPPED' ? 'IN_TRANSIT' : order.status === 'COMPLETED' ? 'DELIVERED' : 'PENDING',
            shippingCost: order.shippingCost,
            weight: order.weight,
            shippedAt: order.shippedAt,
            order: {
              id: order.id,
              orderNumber: order.orderNumber,
              customer: order.customer,
              totalAmount: order.totalAmount,
              salesChannel: order.salesChannel,
              shippingAddress: order.shippingAddress,
            }
          });

          // Fetch rates
          try {
            const rateData = await apiService.post('/shipping/rates', { orderId: order.id });
            setRates(rateData);
          } catch (e) {
            console.log('Could not fetch rates');
          }
        } else {
          setError('Shipment not found');
        }
      } catch (e) {
        setError('Shipment not found');
      }
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      'PENDING': 'orange',
      'LABEL_CREATED': 'blue',
      'PICKED_UP': 'cyan',
      'IN_TRANSIT': 'processing',
      'OUT_FOR_DELIVERY': 'purple',
      'DELIVERED': 'green',
      'FAILED': 'red',
      'CANCELLED': 'default',
    };
    return colors[status?.toUpperCase()] || 'default';
  };

  const getCarrierLogo = (carrier: string) => {
    const logos: Record<string, string> = {
      'ROYAL_MAIL': '📮',
      'DPD': '🔴',
      'EVRI': '💜',
      'PARCELFORCE': '📦',
      'DHL': '🟡',
      'FEDEX': '🟣',
      'UPS': '🟤',
      'YODEL': '🟢',
      'AMAZON_LOGISTICS': '📦',
    };
    return logos[carrier?.toUpperCase()] || '📦';
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <Spin size="large" tip="Loading shipment..." />
      </div>
    );
  }

  if (error || !shipment) {
    return (
      <div className="space-y-6">
        <Link href="/protected/shipments">
          <Button icon={<ArrowLeftOutlined />}>Back to Shipments</Button>
        </Link>
        <Alert message="Error" description={error || 'Shipment not found'} type="error" showIcon />
      </div>
    );
  }

  const trackingEvents = [
    { time: shipment.shippedAt || new Date().toISOString(), status: 'Shipped', detail: `Package shipped via ${shipment.carrier}`, color: 'green' },
    ...(shipment.status === 'IN_TRANSIT' ? [{ time: new Date().toISOString(), status: 'In Transit', detail: 'Package is on its way', color: 'blue' }] : []),
    ...(shipment.status === 'DELIVERED' ? [{ time: shipment.deliveredAt || new Date().toISOString(), status: 'Delivered', detail: 'Package delivered successfully', color: 'green' }] : []),
  ];

  const tabItems = [
    {
      key: 'details',
      label: 'Shipment Details',
      children: (
        <div className="space-y-6">
          <Card title="Shipment Information">
            <Descriptions column={2} bordered>
              <Descriptions.Item label="Tracking Number">
                <span className="font-mono font-bold text-blue-600">{shipment.trackingNumber}</span>
              </Descriptions.Item>
              <Descriptions.Item label="Status">
                <Tag color={getStatusColor(shipment.status)}>{shipment.status?.replace('_', ' ')}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Carrier">
                <span>{getCarrierLogo(shipment.carrier)} {shipment.carrier?.replace('_', ' ')}</span>
              </Descriptions.Item>
              <Descriptions.Item label="Service">{shipment.service || 'Standard'}</Descriptions.Item>
              <Descriptions.Item label="Ship Date">{formatDate(shipment.shippedAt || '')}</Descriptions.Item>
              <Descriptions.Item label="Shipping Cost">
                <span className="font-bold text-green-600">£{(shipment.shippingCost || 0).toFixed(2)}</span>
              </Descriptions.Item>
              <Descriptions.Item label="Weight">{shipment.weight ? `${shipment.weight} kg` : '-'}</Descriptions.Item>
              <Descriptions.Item label="Channel">
                <Tag color="purple">{shipment.order?.salesChannel || 'DIRECT'}</Tag>
              </Descriptions.Item>
            </Descriptions>
          </Card>

          {shipment.order && (
            <Card title="Order Information">
              <Descriptions column={2} bordered>
                <Descriptions.Item label="Order Number">
                  <Link href={`/protected/sales-orders/${shipment.order.id}`}>
                    <span className="text-blue-600 cursor-pointer hover:underline">{shipment.order.orderNumber}</span>
                  </Link>
                </Descriptions.Item>
                <Descriptions.Item label="Customer">{shipment.order.customer?.name || 'Unknown'}</Descriptions.Item>
                <Descriptions.Item label="Order Value">£{(shipment.order.totalAmount || 0).toFixed(2)}</Descriptions.Item>
                <Descriptions.Item label="Sales Channel">
                  <Tag>{shipment.order.salesChannel || 'Direct'}</Tag>
                </Descriptions.Item>
                <Descriptions.Item label="Shipping Address" span={2}>
                  {shipment.order.shippingAddress || shipment.order.customer?.address || '-'}
                  {shipment.order.customer?.postcode && ` ${shipment.order.customer.postcode}`}
                </Descriptions.Item>
              </Descriptions>
            </Card>
          )}

          {rates && (
            <Card title="Shipping Rate Comparison">
              <Alert
                message={`Package Weight: ${rates.weight?.toFixed(2) || 0} kg`}
                type="info"
                showIcon
                className="mb-4"
              />
              <Row gutter={[16, 16]}>
                {rates.cheapest && (
                  <Col xs={24} md={12}>
                    <Card size="small" className="border-green-300 bg-green-50">
                      <Statistic
                        title={<span className="text-green-700">💰 Cheapest Option</span>}
                        value={rates.cheapest.price}
                        prefix="£"
                        suffix={<span className="text-sm text-gray-500">via {rates.cheapest.carrierName}</span>}
                      />
                      <div className="text-sm text-gray-600 mt-2">
                        {rates.cheapest.service} • {rates.cheapest.estimatedDays} day(s)
                      </div>
                    </Card>
                  </Col>
                )}
                {rates.fastest && (
                  <Col xs={24} md={12}>
                    <Card size="small" className="border-blue-300 bg-blue-50">
                      <Statistic
                        title={<span className="text-blue-700">⚡ Fastest Option</span>}
                        value={rates.fastest.price}
                        prefix="£"
                        suffix={<span className="text-sm text-gray-500">via {rates.fastest.carrierName}</span>}
                      />
                      <div className="text-sm text-gray-600 mt-2">
                        {rates.fastest.service} • {rates.fastest.estimatedDays === 0 ? 'Same day' : `${rates.fastest.estimatedDays} day(s)`}
                      </div>
                    </Card>
                  </Col>
                )}
              </Row>
              <div className="mt-4">
                <Table
                  dataSource={rates.rates?.slice(0, 10) || []}
                  columns={[
                    { title: 'Carrier', dataIndex: 'carrierName', key: 'carrier', width: 150 },
                    { title: 'Service', dataIndex: 'service', key: 'service', width: 200 },
                    { title: 'Price', dataIndex: 'price', key: 'price', width: 100, render: (p: number) => <span className="font-bold">£{p.toFixed(2)}</span> },
                    { title: 'Delivery', dataIndex: 'estimatedDays', key: 'days', width: 100, render: (d: number) => d === 0 ? 'Same day' : `${d} day(s)` },
                  ]}
                  rowKey={(r) => `${r.carrier}-${r.service}`}
                  pagination={false}
                  size="small"
                />
              </div>
            </Card>
          )}
        </div>
      ),
    },
    {
      key: 'tracking',
      label: 'Tracking History',
      children: (
        <Card title="Tracking Events">
          <Timeline>
            {trackingEvents.map((event, index) => (
              <Timeline.Item key={index} color={event.color}>
                <div className="font-semibold">{event.status}</div>
                <div className="text-sm text-gray-600">{formatDate(event.time)}</div>
                <div className="text-sm text-gray-500">{event.detail}</div>
              </Timeline.Item>
            ))}
          </Timeline>
        </Card>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <Link href="/protected/shipments">
            <Button icon={<ArrowLeftOutlined />}>Back to Shipments</Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              {getCarrierLogo(shipment.carrier)} Shipment {shipment.trackingNumber}
            </h1>
            <p className="text-gray-600 mt-1">
              {shipment.order?.customer?.name || 'Customer'} • {shipment.order?.orderNumber || ''}
            </p>
          </div>
        </div>
        <Space>
          <Button icon={<ReloadOutlined />} onClick={fetchShipment}>Refresh</Button>
          <Button icon={<PrinterOutlined />} size="large">Print Label</Button>
          <Button icon={<TruckOutlined />} type="primary" size="large">Track Package</Button>
        </Space>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <div className="text-center">
            <p className="text-gray-500 text-sm">Carrier</p>
            <p className="text-2xl font-bold text-blue-600">{getCarrierLogo(shipment.carrier)} {shipment.carrier?.replace('_', ' ')}</p>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <p className="text-gray-500 text-sm">Shipping Cost</p>
            <p className="text-2xl font-bold text-green-600">£{(shipment.shippingCost || rates?.cheapest?.price || 0).toFixed(2)}</p>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <p className="text-gray-500 text-sm">Weight</p>
            <p className="text-2xl font-bold text-purple-600">{rates?.weight?.toFixed(2) || shipment.weight || '0.5'} kg</p>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <p className="text-gray-500 text-sm">Order Value</p>
            <p className="text-2xl font-bold text-orange-600">£{(shipment.order?.totalAmount || 0).toFixed(2)}</p>
          </div>
        </Card>
      </div>

      <Card className="shadow-sm">
        <Tabs activeKey={activeTab} onChange={setActiveTab} items={tabItems} size="large" />
      </Card>
    </div>
  );
}
