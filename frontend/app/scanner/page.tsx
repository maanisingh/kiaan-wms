'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Card,
  Input,
  Button,
  message,
  Typography,
  Divider,
  Row,
  Col,
  Tag,
  Space,
  Table,
  Badge,
  Empty,
  Alert
} from 'antd';
import {
  ScanOutlined,
  BarcodeOutlined,
  SearchOutlined,
  ClearOutlined,
  CheckCircleOutlined
} from '@ant-design/icons';

const { Title, Text } = Typography;

interface ProductLookup {
  id: string;
  name: string;
  sku: string;
  barcode: string;
  brand: string;
  price: number;
  totalAvailable: number;
  locations: Array<{
    id: string;
    locationCode: string;
    warehouse: string;
    quantity: number;
    expiryDate?: string;
  }>;
}

export default function ScannerPage() {
  const [loading, setLoading] = useState(false);
  const [barcode, setBarcode] = useState('');
  const [lookupResult, setLookupResult] = useState<ProductLookup | null>(null);
  const [scanHistory, setScanHistory] = useState<ProductLookup[]>([]);
  const inputRef = useRef<any>(null);

  useEffect(() => {
    // Auto-focus on input when page loads
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  const handleLookup = async (barcodeValue?: string) => {
    const searchBarcode = barcodeValue || barcode;

    if (!searchBarcode.trim()) {
      message.warning('Please enter a barcode');
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8010'}/api/barcode/lookup/${searchBarcode.trim()}`,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );

      if (response.ok) {
        const data = await response.json();
        setLookupResult(data);

        // Add to scan history (avoid duplicates)
        if (!scanHistory.find(item => item.id === data.id)) {
          setScanHistory([data, ...scanHistory.slice(0, 9)]); // Keep last 10
        }

        message.success('Product found!');

        // Clear input and refocus
        setBarcode('');
        if (inputRef.current) {
          inputRef.current.focus();
        }
      } else {
        message.error('Product not found with this barcode');
        setLookupResult(null);
        setBarcode('');
      }
    } catch (error) {
      console.error('Lookup error:', error);
      message.error('Error looking up barcode');
      setLookupResult(null);
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setBarcode('');
    setLookupResult(null);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const handleClearHistory = () => {
    setScanHistory([]);
    message.success('Scan history cleared');
  };

  const historyColumns = [
    {
      title: 'Product',
      dataIndex: 'name',
      key: 'name',
      width: 200,
    },
    {
      title: 'SKU',
      dataIndex: 'sku',
      key: 'sku',
      width: 120,
    },
    {
      title: 'Brand',
      dataIndex: 'brand',
      key: 'brand',
      width: 120,
    },
    {
      title: 'Stock',
      dataIndex: 'totalAvailable',
      key: 'totalAvailable',
      width: 100,
      render: (qty: number) => (
        <Tag color={qty > 0 ? 'green' : 'red'}>{qty} units</Tag>
      ),
    },
    {
      title: 'Action',
      key: 'action',
      width: 100,
      render: (_: any, record: ProductLookup) => (
        <Button
          size="small"
          icon={<SearchOutlined />}
          onClick={() => handleLookup(record.sku)}
        >
          View
        </Button>
      ),
    },
  ];

  return (
    <div className="p-6">
      <div className="mb-6">
        <Title level={2}>
          <ScanOutlined className="mr-2" />
          Barcode Scanner
        </Title>
        <Text type="secondary">Scan or enter product barcodes for quick inventory lookup</Text>
      </div>

      {/* Scanner Input */}
      <Card className="mb-6">
        <div className="text-center mb-4">
          <BarcodeOutlined className="text-6xl text-blue-500 mb-4" />
          <Title level={4}>Scan Barcode</Title>
          <Text type="secondary">Use a barcode scanner or manually enter SKU</Text>
        </div>

        <Row gutter={16} justify="center">
          <Col xs={24} sm={20} md={16} lg={12}>
            <Input
              ref={inputRef}
              size="large"
              prefix={<ScanOutlined />}
              placeholder="Scan barcode or enter SKU..."
              value={barcode}
              onChange={(e) => setBarcode(e.target.value)}
              onPressEnter={() => handleLookup()}
              autoFocus
              className="text-2xl py-3"
            />
            <div className="mt-4 text-center">
              <Space>
                <Button
                  type="primary"
                  size="large"
                  icon={<SearchOutlined />}
                  onClick={() => handleLookup()}
                  loading={loading}
                >
                  Lookup
                </Button>
                <Button
                  size="large"
                  icon={<ClearOutlined />}
                  onClick={handleClear}
                >
                  Clear
                </Button>
              </Space>
            </div>
          </Col>
        </Row>
      </Card>

      {/* Lookup Result */}
      {lookupResult && (
        <Card
          title={
            <Space>
              <CheckCircleOutlined style={{ color: '#52c41a' }} />
              <span>Product Found</span>
            </Space>
          }
          className="mb-6"
        >
          <Row gutter={16}>
            <Col xs={24} md={12}>
              <div className="mb-3">
                <Text strong className="text-lg">{lookupResult.name}</Text>
              </div>
              <div className="space-y-2">
                <div>
                  <Text type="secondary">SKU:</Text>{' '}
                  <Tag color="blue">{lookupResult.sku}</Tag>
                </div>
                <div>
                  <Text type="secondary">Brand:</Text>{' '}
                  <Tag color="purple">{lookupResult.brand}</Tag>
                </div>
                <div>
                  <Text type="secondary">Price:</Text>{' '}
                  <Text strong className="text-lg">${lookupResult.price}</Text>
                </div>
                <div>
                  <Text type="secondary">Total Available:</Text>{' '}
                  <Badge
                    count={lookupResult.totalAvailable}
                    showZero
                    style={{
                      backgroundColor: lookupResult.totalAvailable > 0 ? '#52c41a' : '#ff4d4f',
                      fontSize: '16px',
                      height: '28px',
                      lineHeight: '28px',
                    }}
                  />
                </div>
              </div>
            </Col>

            <Col xs={24} md={12}>
              <Title level={5}>Stock Locations</Title>
              {lookupResult.locations.length > 0 ? (
                <div className="space-y-2">
                  {lookupResult.locations.map((loc, index) => (
                    <Card key={index} size="small" className="bg-gray-50">
                      <div className="flex justify-between items-center">
                        <div>
                          <Text strong>{loc.locationCode}</Text>
                          <br />
                          <Text type="secondary" className="text-xs">
                            {loc.warehouse}
                          </Text>
                        </div>
                        <div className="text-right">
                          <Tag color="blue" className="text-sm">
                            {loc.quantity} units
                          </Tag>
                          {loc.expiryDate && (
                            <div className="mt-1">
                              <Text type="secondary" className="text-xs">
                                Exp: {new Date(loc.expiryDate).toLocaleDateString()}
                              </Text>
                            </div>
                          )}
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              ) : (
                <Empty description="No inventory locations" image={Empty.PRESENTED_IMAGE_SIMPLE} />
              )}
            </Col>
          </Row>
        </Card>
      )}

      {/* Scan History */}
      {scanHistory.length > 0 && (
        <Card
          title="Recent Scans"
          extra={
            <Button
              size="small"
              icon={<ClearOutlined />}
              onClick={handleClearHistory}
            >
              Clear History
            </Button>
          }
        >
          <Table
            columns={historyColumns}
            dataSource={scanHistory}
            rowKey="id"
            pagination={false}
            size="small"
          />
        </Card>
      )}

      {/* Instructions */}
      {!lookupResult && scanHistory.length === 0 && (
        <Alert
          message="Scanner Instructions"
          description={
            <div className="space-y-2">
              <p>• Use a USB or Bluetooth barcode scanner to scan product barcodes</p>
              <p>• Alternatively, manually enter the product SKU and press Enter</p>
              <p>• The scanner will automatically look up the product and display inventory information</p>
              <p>• Recent scans are saved in the history below for quick reference</p>
            </div>
          }
          type="info"
          showIcon
        />
      )}
    </div>
  );
}
