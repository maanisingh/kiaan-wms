'use client';

import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Button,
  Modal,
  Form,
  Input,
  Select,
  message,
  Tabs,
  Statistic,
  Row,
  Col,
  Tag,
  Space,
  Divider,
  Typography,
  Empty,
  Badge,
  Tooltip
} from 'antd';
import {
  BarcodeOutlined,
  QrcodeOutlined,
  PrinterOutlined,
  SearchOutlined,
  PlusOutlined,
  FileTextOutlined,
  ScanOutlined,
  DownloadOutlined
} from '@ant-design/icons';
import dynamic from 'next/dynamic';

const { Title, Text } = Typography;
const { Option } = Select;
const { TabPane } = Tabs;

// Dynamically import barcode and QR code components (client-side only)
const Barcode = dynamic(() => import('react-barcode'), { ssr: false });
const QRCode = dynamic(() => import('qrcode.react').then(mod => mod.QRCodeSVG), { ssr: false });

interface BarcodeData {
  productId: string;
  productName: string;
  sku: string;
  barcode: string;
  format: string;
  brand?: string;
  width?: number;
  height?: number;
  createdAt: string;
}

interface QRCodeData {
  locationId: string;
  locationCode: string;
  warehouse: string;
  qrData: string;
  type: string;
  createdAt: string;
}

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

interface Statistics {
  totalProducts: number;
  productsWithBarcode: number;
  productsWithoutBarcode: number;
  totalLocations: number;
  barcodeFormat: string;
  qrCodeFormat: string;
}

export default function BarcodePage() {
  const [loading, setLoading] = useState(false);
  const [statistics, setStatistics] = useState<Statistics | null>(null);
  const [generatedBarcodes, setGeneratedBarcodes] = useState<BarcodeData[]>([]);
  const [generatedQRCodes, setGeneratedQRCodes] = useState<QRCodeData[]>([]);
  const [lookupResult, setLookupResult] = useState<ProductLookup | null>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [locations, setLocations] = useState<any[]>([]);

  const [generateModalVisible, setGenerateModalVisible] = useState(false);
  const [batchModalVisible, setBatchModalVisible] = useState(false);
  const [qrModalVisible, setQrModalVisible] = useState(false);
  const [lookupModalVisible, setLookupModalVisible] = useState(false);

  const [generateForm] = Form.useForm();
  const [batchForm] = Form.useForm();
  const [qrForm] = Form.useForm();
  const [lookupForm] = Form.useForm();

  useEffect(() => {
    fetchStatistics();
    fetchProducts();
    fetchLocations();
  }, []);

  const fetchStatistics = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8010'}/api/barcode/statistics`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setStatistics(data);
      }
    } catch (error) {
      console.error('Fetch statistics error:', error);
    }
  };

  const fetchProducts = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8010'}/api/products`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setProducts(data);
      }
    } catch (error) {
      console.error('Fetch products error:', error);
    }
  };

  const fetchLocations = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8010'}/api/locations`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setLocations(data);
      }
    } catch (error) {
      console.error('Fetch locations error:', error);
    }
  };

  const handleGenerateBarcode = async (values: any) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8010'}/api/barcode/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(values),
      });

      if (response.ok) {
        const data = await response.json();
        setGeneratedBarcodes([data, ...generatedBarcodes]);
        message.success('Barcode generated successfully!');
        setGenerateModalVisible(false);
        generateForm.resetFields();
      } else {
        message.error('Failed to generate barcode');
      }
    } catch (error) {
      console.error('Generate barcode error:', error);
      message.error('Error generating barcode');
    } finally {
      setLoading(false);
    }
  };

  const handleBatchGenerate = async (values: any) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8010'}/api/barcode/generate/batch`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(values),
      });

      if (response.ok) {
        const data = await response.json();
        setGeneratedBarcodes([...data.barcodes, ...generatedBarcodes]);
        message.success(`Generated ${data.total} barcodes successfully!`);
        setBatchModalVisible(false);
        batchForm.resetFields();
      } else {
        message.error('Failed to generate barcodes');
      }
    } catch (error) {
      console.error('Batch generate error:', error);
      message.error('Error generating barcodes');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateQRCode = async (values: any) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8010'}/api/qrcode/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(values),
      });

      if (response.ok) {
        const data = await response.json();
        setGeneratedQRCodes([data, ...generatedQRCodes]);
        message.success('QR code generated successfully!');
        setQrModalVisible(false);
        qrForm.resetFields();
      } else {
        message.error('Failed to generate QR code');
      }
    } catch (error) {
      console.error('Generate QR code error:', error);
      message.error('Error generating QR code');
    } finally {
      setLoading(false);
    }
  };

  const handleLookup = async (values: any) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8010'}/api/barcode/lookup/${values.barcode}`,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );

      if (response.ok) {
        const data = await response.json();
        setLookupResult(data);
        message.success('Product found!');
      } else {
        message.error('Product not found with this barcode');
        setLookupResult(null);
      }
    } catch (error) {
      console.error('Lookup error:', error);
      message.error('Error looking up barcode');
      setLookupResult(null);
    } finally {
      setLoading(false);
    }
  };

  const handlePrintBarcodes = () => {
    window.print();
  };

  const barcodeColumns = [
    {
      title: 'Product',
      dataIndex: 'productName',
      key: 'productName',
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
      render: (brand: string) => brand || 'N/A',
    },
    {
      title: 'Barcode',
      dataIndex: 'barcode',
      key: 'barcode',
      width: 250,
      render: (barcode: string, record: BarcodeData) => (
        <div className="p-2 bg-white border rounded">
          <Barcode
            value={barcode}
            width={1.5}
            height={40}
            displayValue={true}
            fontSize={12}
          />
        </div>
      ),
    },
    {
      title: 'Format',
      dataIndex: 'format',
      key: 'format',
      width: 100,
      render: (format: string) => <Tag color="blue">{format}</Tag>,
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 120,
      render: (_: any, record: BarcodeData) => (
        <Space>
          <Button
            size="small"
            icon={<DownloadOutlined />}
            onClick={() => {
              // Download barcode as image
              const canvas = document.querySelector(`canvas[value="${record.barcode}"]`) as HTMLCanvasElement;
              if (canvas) {
                const url = canvas.toDataURL('image/png');
                const link = document.createElement('a');
                link.download = `barcode-${record.sku}.png`;
                link.href = url;
                link.click();
              }
            }}
          >
            Download
          </Button>
        </Space>
      ),
    },
  ];

  const qrCodeColumns = [
    {
      title: 'Location',
      dataIndex: 'locationCode',
      key: 'locationCode',
      width: 150,
    },
    {
      title: 'Warehouse',
      dataIndex: 'warehouse',
      key: 'warehouse',
      width: 150,
    },
    {
      title: 'QR Code',
      dataIndex: 'qrData',
      key: 'qrData',
      width: 200,
      render: (qrData: string, record: QRCodeData) => (
        <div className="p-2 bg-white border rounded inline-block">
          <QRCode value={qrData} size={100} />
        </div>
      ),
    },
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      width: 100,
      render: (type: string) => <Tag color="green">{type}</Tag>,
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 120,
      render: (_: any, record: QRCodeData) => (
        <Space>
          <Button
            size="small"
            icon={<DownloadOutlined />}
            onClick={() => {
              // Download QR code as image
              const svg = document.querySelector(`svg[data-location="${record.locationId}"]`);
              if (svg) {
                const svgData = new XMLSerializer().serializeToString(svg);
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                const img = new Image();
                img.onload = () => {
                  canvas.width = img.width;
                  canvas.height = img.height;
                  ctx?.drawImage(img, 0, 0);
                  const url = canvas.toDataURL('image/png');
                  const link = document.createElement('a');
                  link.download = `qrcode-${record.locationCode}.png`;
                  link.href = url;
                  link.click();
                };
                img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
              }
            }}
          >
            Download
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div className="p-6">
      <div className="mb-6">
        <Title level={2}>
          <BarcodeOutlined className="mr-2" />
          Barcode & QR Code Management
        </Title>
        <Text type="secondary">Generate, scan, and manage barcodes and QR codes for products and locations</Text>
      </div>

      {/* Statistics */}
      {statistics && (
        <Row gutter={16} className="mb-6">
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="Total Products"
                value={statistics.totalProducts}
                prefix={<FileTextOutlined />}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="With Barcode"
                value={statistics.productsWithBarcode}
                prefix={<BarcodeOutlined />}
                valueStyle={{ color: '#52c41a' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="Without Barcode"
                value={statistics.productsWithoutBarcode}
                prefix={<BarcodeOutlined />}
                valueStyle={{ color: '#ff4d4f' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="Total Locations"
                value={statistics.totalLocations}
                prefix={<QrcodeOutlined />}
              />
            </Card>
          </Col>
        </Row>
      )}

      {/* Action Buttons */}
      <Card className="mb-6">
        <Space wrap>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setGenerateModalVisible(true)}
          >
            Generate Barcode
          </Button>
          <Button
            icon={<BarcodeOutlined />}
            onClick={() => setBatchModalVisible(true)}
          >
            Batch Generate
          </Button>
          <Button
            icon={<QrcodeOutlined />}
            onClick={() => setQrModalVisible(true)}
          >
            Generate QR Code
          </Button>
          <Button
            icon={<SearchOutlined />}
            onClick={() => setLookupModalVisible(true)}
          >
            Lookup Barcode
          </Button>
          <Button
            icon={<PrinterOutlined />}
            onClick={handlePrintBarcodes}
          >
            Print All
          </Button>
        </Space>
      </Card>

      {/* Main Content */}
      <Card>
        <Tabs defaultActiveKey="barcodes">
          <TabPane
            tab={
              <span>
                <BarcodeOutlined />
                Product Barcodes ({generatedBarcodes.length})
              </span>
            }
            key="barcodes"
          >
            {generatedBarcodes.length > 0 ? (
              <Table
                columns={barcodeColumns}
                dataSource={generatedBarcodes}
                rowKey="productId"
                pagination={{ pageSize: 10 }}
                scroll={{ x: 1000 }}
              />
            ) : (
              <Empty description="No barcodes generated yet. Click 'Generate Barcode' to get started." />
            )}
          </TabPane>

          <TabPane
            tab={
              <span>
                <QrcodeOutlined />
                Location QR Codes ({generatedQRCodes.length})
              </span>
            }
            key="qrcodes"
          >
            {generatedQRCodes.length > 0 ? (
              <Table
                columns={qrCodeColumns}
                dataSource={generatedQRCodes}
                rowKey="locationId"
                pagination={{ pageSize: 10 }}
                scroll={{ x: 800 }}
              />
            ) : (
              <Empty description="No QR codes generated yet. Click 'Generate QR Code' to get started." />
            )}
          </TabPane>
        </Tabs>
      </Card>

      {/* Generate Barcode Modal */}
      <Modal
        title="Generate Barcode"
        open={generateModalVisible}
        onCancel={() => setGenerateModalVisible(false)}
        footer={null}
        width={600}
      >
        <Form
          form={generateForm}
          layout="vertical"
          onFinish={handleGenerateBarcode}
        >
          <Form.Item
            name="productId"
            label="Product"
            rules={[{ required: true, message: 'Please select a product' }]}
          >
            <Select
              showSearch
              placeholder="Select product"
              optionFilterProp="children"
              filterOption={(input, option) =>
                (option?.children as string).toLowerCase().includes(input.toLowerCase())
              }
            >
              {products.map((product) => (
                <Option key={product.id} value={product.id}>
                  {product.name} - {product.sku || 'No SKU'}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item name="format" label="Barcode Format" initialValue="CODE128">
            <Select>
              <Option value="CODE128">CODE128</Option>
              <Option value="EAN13">EAN-13</Option>
              <Option value="UPC">UPC</Option>
            </Select>
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="width" label="Width" initialValue={2}>
                <Input type="number" min={1} max={5} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="height" label="Height" initialValue={100}>
                <Input type="number" min={50} max={200} />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" loading={loading}>
                Generate
              </Button>
              <Button onClick={() => setGenerateModalVisible(false)}>
                Cancel
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* Batch Generate Modal */}
      <Modal
        title="Batch Generate Barcodes"
        open={batchModalVisible}
        onCancel={() => setBatchModalVisible(false)}
        footer={null}
        width={600}
      >
        <Form
          form={batchForm}
          layout="vertical"
          onFinish={handleBatchGenerate}
        >
          <Form.Item
            name="productIds"
            label="Products"
            rules={[{ required: true, message: 'Please select products' }]}
          >
            <Select
              mode="multiple"
              showSearch
              placeholder="Select multiple products"
              optionFilterProp="children"
              filterOption={(input, option) =>
                (option?.children as string).toLowerCase().includes(input.toLowerCase())
              }
            >
              {products.map((product) => (
                <Option key={product.id} value={product.id}>
                  {product.name} - {product.sku || 'No SKU'}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item name="format" label="Barcode Format" initialValue="CODE128">
            <Select>
              <Option value="CODE128">CODE128</Option>
              <Option value="EAN13">EAN-13</Option>
              <Option value="UPC">UPC</Option>
            </Select>
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" loading={loading}>
                Generate All
              </Button>
              <Button onClick={() => setBatchModalVisible(false)}>
                Cancel
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* Generate QR Code Modal */}
      <Modal
        title="Generate QR Code"
        open={qrModalVisible}
        onCancel={() => setQrModalVisible(false)}
        footer={null}
        width={600}
      >
        <Form
          form={qrForm}
          layout="vertical"
          onFinish={handleGenerateQRCode}
        >
          <Form.Item
            name="locationId"
            label="Location"
            rules={[{ required: true, message: 'Please select a location' }]}
          >
            <Select
              showSearch
              placeholder="Select location"
              optionFilterProp="children"
              filterOption={(input, option) =>
                (option?.children as string).toLowerCase().includes(input.toLowerCase())
              }
            >
              {locations.map((location) => (
                <Option key={location.id} value={location.id}>
                  {location.aisle}-{location.rack}-{location.bin} ({location.warehouse?.name || 'N/A'})
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item name="type" label="QR Code Type" initialValue="location">
            <Select>
              <Option value="location">Location</Option>
              <Option value="zone">Zone</Option>
            </Select>
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" loading={loading}>
                Generate QR Code
              </Button>
              <Button onClick={() => setQrModalVisible(false)}>
                Cancel
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* Barcode Lookup Modal */}
      <Modal
        title="Barcode Lookup"
        open={lookupModalVisible}
        onCancel={() => {
          setLookupModalVisible(false);
          setLookupResult(null);
          lookupForm.resetFields();
        }}
        footer={null}
        width={700}
      >
        <Form
          form={lookupForm}
          layout="vertical"
          onFinish={handleLookup}
        >
          <Form.Item
            name="barcode"
            label="Scan or Enter Barcode"
            rules={[{ required: true, message: 'Please enter a barcode' }]}
          >
            <Input
              prefix={<ScanOutlined />}
              placeholder="Scan or type barcode (SKU)"
              size="large"
              autoFocus
            />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading} block>
              <SearchOutlined /> Lookup
            </Button>
          </Form.Item>
        </Form>

        {lookupResult && (
          <div className="mt-4">
            <Divider>Product Details</Divider>
            <div className="space-y-2">
              <div>
                <Text strong>Product:</Text> <Text>{lookupResult.name}</Text>
              </div>
              <div>
                <Text strong>SKU:</Text> <Text>{lookupResult.sku}</Text>
              </div>
              <div>
                <Text strong>Brand:</Text> <Tag color="blue">{lookupResult.brand}</Tag>
              </div>
              <div>
                <Text strong>Price:</Text> <Text>${lookupResult.price}</Text>
              </div>
              <div>
                <Text strong>Total Available:</Text>{' '}
                <Tag color={lookupResult.totalAvailable > 0 ? 'green' : 'red'}>
                  {lookupResult.totalAvailable} units
                </Tag>
              </div>
            </div>

            <Divider>Locations</Divider>
            {lookupResult.locations.length > 0 ? (
              <div className="space-y-2">
                {lookupResult.locations.map((loc, index) => (
                  <Card key={index} size="small">
                    <div className="flex justify-between items-center">
                      <div>
                        <Text strong>{loc.locationCode}</Text>
                        <br />
                        <Text type="secondary">{loc.warehouse}</Text>
                      </div>
                      <Tag color="blue">{loc.quantity} units</Tag>
                    </div>
                    {loc.expiryDate && (
                      <div className="mt-2">
                        <Text type="secondary">Expires: {new Date(loc.expiryDate).toLocaleDateString()}</Text>
                      </div>
                    )}
                  </Card>
                ))}
              </div>
            ) : (
              <Empty description="No inventory locations found" />
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
