'use client';

import React, { useState, useEffect } from 'react';
import {
  Card,
  Button,
  Modal,
  Form,
  Input,
  Select,
  message,
  Row,
  Col,
  Tabs,
  Typography,
  Space,
  Divider,
  Table,
  Tag,
  Empty,
  Badge
} from 'antd';
import {
  FileTextOutlined,
  InboxOutlined,
  TagOutlined,
  TruckOutlined,
  BarcodeOutlined,
  QrcodeOutlined,
  PrinterOutlined,
  DownloadOutlined,
  EyeOutlined,
  PlusOutlined
} from '@ant-design/icons';
import dynamic from 'next/dynamic';

const { Title, Text } = Typography;
const { Option } = Select;
const { TabPane } = Tabs;
const { TextArea } = Input;

// Dynamically import barcode component
const Barcode = dynamic(() => import('react-barcode'), { ssr: false });

interface DocumentTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  icon: string;
  requiresId: boolean;
}

interface PickListDocument {
  pickListNumber: string;
  status: string;
  priority: string;
  createdAt: string;
  assignedTo: string;
  createdBy: string;
  totalItems: number;
  groupedItems: Record<string, any[]>;
  notes: string;
}

interface PackingSlipDocument {
  packingSlipNumber: string;
  orderId: string;
  date: string;
  items: Array<{
    productName: string;
    sku: string;
    brand: string;
    quantity: number;
    price: number;
  }>;
  totalItems: number;
  totalQuantity: number;
  subtotal: number;
  shippingInfo: {
    name: string;
    address: string;
    city: string;
    state: string;
    zip: string;
    country: string;
  };
}

interface ShippingLabelDocument {
  labelNumber: string;
  orderId: string;
  trackingNumber: string;
  date: string;
  shipTo: any;
  shipFrom: any;
  weight: any;
  dimensions: any;
  service: string;
  barcode: string;
}

export default function DocumentsPage() {
  const [loading, setLoading] = useState(false);
  const [templates, setTemplates] = useState<DocumentTemplate[]>([]);
  const [pickLists, setPickLists] = useState<any[]>([]);
  const [transfers, setTransfers] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);

  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [generatedDocument, setGeneratedDocument] = useState<any>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [previewVisible, setPreviewVisible] = useState(false);

  const [form] = Form.useForm();

  useEffect(() => {
    fetchTemplates();
    fetchPickLists();
    fetchTransfers();
    fetchProducts();
  }, []);

  const fetchTemplates = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8010'}/api/documents/templates`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setTemplates(data);
      }
    } catch (error) {
      console.error('Fetch templates error:', error);
    }
  };

  const fetchPickLists = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8010'}/api/pick-lists`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setPickLists(data);
      }
    } catch (error) {
      console.error('Fetch pick lists error:', error);
    }
  };

  const fetchTransfers = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8010'}/api/transfers`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setTransfers(data);
      }
    } catch (error) {
      console.error('Fetch transfers error:', error);
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

  const handleGenerateDocument = async (values: any) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      let endpoint = '';
      let method = 'GET';
      let body = null;

      switch (selectedTemplate) {
        case 'pick-list':
          endpoint = `/api/documents/pick-list/${values.pickListId}`;
          break;
        case 'transfer-document':
          endpoint = `/api/documents/transfer/${values.transferId}`;
          break;
        case 'packing-slip':
          endpoint = '/api/documents/packing-slip';
          method = 'POST';
          body = JSON.stringify(values);
          break;
        case 'shipping-label':
          endpoint = '/api/documents/shipping-label';
          method = 'POST';
          body = JSON.stringify(values);
          break;
        case 'product-label':
          endpoint = '/api/documents/product-label';
          method = 'POST';
          body = JSON.stringify(values);
          break;
        default:
          message.error('Invalid template selected');
          setLoading(false);
          return;
      }

      const options: RequestInit = {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      };

      if (body) {
        options.body = body;
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8010'}${endpoint}`, options);

      if (response.ok) {
        const data = await response.json();
        setGeneratedDocument(data);
        setPreviewVisible(true);
        message.success('Document generated successfully!');
        setModalVisible(false);
        form.resetFields();
      } else {
        message.error('Failed to generate document');
      }
    } catch (error) {
      console.error('Generate document error:', error);
      message.error('Error generating document');
    } finally {
      setLoading(false);
    }
  };

  const handlePrintDocument = () => {
    window.print();
  };

  const getIconComponent = (iconName: string) => {
    const icons: Record<string, any> = {
      FileText: <FileTextOutlined />,
      Package: <InboxOutlined />,
      Tag: <TagOutlined />,
      Truck: <TruckOutlined />,
      Barcode: <BarcodeOutlined />,
      QrCode: <QrcodeOutlined />,
    };
    return icons[iconName] || <FileTextOutlined />;
  };

  const renderTemplateForm = () => {
    switch (selectedTemplate) {
      case 'pick-list':
        return (
          <Form.Item
            name="pickListId"
            label="Select Pick List"
            rules={[{ required: true, message: 'Please select a pick list' }]}
          >
            <Select placeholder="Select pick list" showSearch>
              {pickLists.map((pl) => (
                <Option key={pl.id} value={pl.id}>
                  {pl.id.substring(0, 8)} - {pl.status} ({pl.items?.length || 0} items)
                </Option>
              ))}
            </Select>
          </Form.Item>
        );

      case 'transfer-document':
        return (
          <Form.Item
            name="transferId"
            label="Select Transfer"
            rules={[{ required: true, message: 'Please select a transfer' }]}
          >
            <Select placeholder="Select transfer" showSearch>
              {transfers.map((t) => (
                <Option key={t.id} value={t.id}>
                  {t.id.substring(0, 8)} - {t.status} ({t.items?.length || 0} items)
                </Option>
              ))}
            </Select>
          </Form.Item>
        );

      case 'packing-slip':
        return (
          <>
            <Form.Item name="orderId" label="Order ID">
              <Input placeholder="Order reference number" />
            </Form.Item>
            <Form.Item
              name="items"
              label="Items"
              rules={[{ required: true, message: 'Please select items' }]}
            >
              <Select mode="tags" placeholder="Select products">
                {products.map((p) => (
                  <Option key={p.id} value={JSON.stringify({ productId: p.id, quantity: 1 })}>
                    {p.name}
                  </Option>
                ))}
              </Select>
            </Form.Item>
            <Divider>Shipping Information</Divider>
            <Form.Item name={['shippingInfo', 'name']} label="Recipient Name">
              <Input />
            </Form.Item>
            <Form.Item name={['shippingInfo', 'address']} label="Address">
              <Input />
            </Form.Item>
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item name={['shippingInfo', 'city']} label="City">
                  <Input />
                </Form.Item>
              </Col>
              <Col span={6}>
                <Form.Item name={['shippingInfo', 'state']} label="State">
                  <Input />
                </Form.Item>
              </Col>
              <Col span={6}>
                <Form.Item name={['shippingInfo', 'zip']} label="ZIP">
                  <Input />
                </Form.Item>
              </Col>
            </Row>
          </>
        );

      case 'shipping-label':
        return (
          <>
            <Form.Item name="orderId" label="Order ID">
              <Input placeholder="Order reference number" />
            </Form.Item>
            <Divider>Ship To</Divider>
            <Form.Item
              name={['shipTo', 'name']}
              label="Name"
              rules={[{ required: true, message: 'Required' }]}
            >
              <Input />
            </Form.Item>
            <Form.Item name={['shipTo', 'address']} label="Address">
              <Input />
            </Form.Item>
            <Row gutter={16}>
              <Col span={8}>
                <Form.Item name={['shipTo', 'city']} label="City">
                  <Input />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item name={['shipTo', 'state']} label="State">
                  <Input />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item name={['shipTo', 'zip']} label="ZIP">
                  <Input />
                </Form.Item>
              </Col>
            </Row>
          </>
        );

      case 'product-label':
        return (
          <>
            <Form.Item
              name="productId"
              label="Product"
              rules={[{ required: true, message: 'Please select a product' }]}
            >
              <Select placeholder="Select product" showSearch>
                {products.map((p) => (
                  <Option key={p.id} value={p.id}>
                    {p.name} - {p.sku}
                  </Option>
                ))}
              </Select>
            </Form.Item>
            <Form.Item name="quantity" label="Number of Labels" initialValue={1}>
              <Input type="number" min={1} max={100} />
            </Form.Item>
          </>
        );

      default:
        return null;
    }
  };

  const renderDocumentPreview = () => {
    if (!generatedDocument) return null;

    switch (selectedTemplate) {
      case 'pick-list':
        return (
          <div className="print-container p-6 bg-white">
            <div className="text-center mb-6">
              <Title level={3}>PICK LIST</Title>
              <Text type="secondary">#{generatedDocument.pickListNumber}</Text>
            </div>

            <Row gutter={16} className="mb-4">
              <Col span={12}>
                <Text strong>Status:</Text> <Tag color="blue">{generatedDocument.status}</Tag>
              </Col>
              <Col span={12}>
                <Text strong>Priority:</Text> <Tag color="orange">{generatedDocument.priority}</Tag>
              </Col>
            </Row>

            <Row gutter={16} className="mb-4">
              <Col span={12}>
                <Text strong>Assigned To:</Text> <Text>{generatedDocument.assignedTo}</Text>
              </Col>
              <Col span={12}>
                <Text strong>Created By:</Text> <Text>{generatedDocument.createdBy}</Text>
              </Col>
            </Row>

            <Divider />

            {Object.entries(generatedDocument.groupedItems).map(([zone, items]: [string, any]) => (
              <div key={zone} className="mb-6">
                <Title level={5} className="bg-gray-100 p-2">Zone: {zone}</Title>
                <Table
                  dataSource={items}
                  pagination={false}
                  size="small"
                  columns={[
                    { title: 'Product', dataIndex: 'productName', key: 'productName' },
                    { title: 'SKU', dataIndex: 'sku', key: 'sku' },
                    { title: 'Brand', dataIndex: 'brand', key: 'brand' },
                    { title: 'Quantity', dataIndex: 'quantity', key: 'quantity' },
                    { title: 'Location', dataIndex: 'location', key: 'location' },
                  ]}
                />
              </div>
            ))}

            {generatedDocument.notes && (
              <>
                <Divider />
                <div>
                  <Text strong>Notes:</Text>
                  <div className="mt-2 p-2 bg-gray-50 rounded">{generatedDocument.notes}</div>
                </div>
              </>
            )}
          </div>
        );

      case 'packing-slip':
        return (
          <div className="print-container p-6 bg-white">
            <div className="text-center mb-6">
              <Title level={3}>PACKING SLIP</Title>
              <Text type="secondary">#{generatedDocument.packingSlipNumber}</Text>
            </div>

            <Row gutter={16} className="mb-4">
              <Col span={12}>
                <Text strong>Order ID:</Text> <Text>{generatedDocument.orderId}</Text>
              </Col>
              <Col span={12}>
                <Text strong>Date:</Text> <Text>{new Date(generatedDocument.date).toLocaleDateString()}</Text>
              </Col>
            </Row>

            {generatedDocument.shippingInfo && (
              <>
                <Divider>Ship To</Divider>
                <div className="mb-4">
                  <Text strong>{generatedDocument.shippingInfo.name}</Text>
                  <br />
                  <Text>{generatedDocument.shippingInfo.address}</Text>
                  <br />
                  <Text>
                    {generatedDocument.shippingInfo.city}, {generatedDocument.shippingInfo.state}{' '}
                    {generatedDocument.shippingInfo.zip}
                  </Text>
                </div>
              </>
            )}

            <Divider>Items</Divider>
            <Table
              dataSource={generatedDocument.items}
              pagination={false}
              size="small"
              columns={[
                { title: 'Product', dataIndex: 'productName', key: 'productName' },
                { title: 'SKU', dataIndex: 'sku', key: 'sku' },
                { title: 'Brand', dataIndex: 'brand', key: 'brand' },
                { title: 'Quantity', dataIndex: 'quantity', key: 'quantity' },
                {
                  title: 'Price',
                  dataIndex: 'price',
                  key: 'price',
                  render: (price: number) => `$${price.toFixed(2)}`,
                },
                {
                  title: 'Total',
                  key: 'total',
                  render: (_: any, record: any) => `$${(record.price * record.quantity).toFixed(2)}`,
                },
              ]}
            />

            <div className="text-right mt-4">
              <Text strong className="text-lg">
                Subtotal: ${generatedDocument.subtotal.toFixed(2)}
              </Text>
            </div>
          </div>
        );

      case 'shipping-label':
        return (
          <div className="print-container p-6 bg-white border-2 border-black">
            <div className="text-center mb-4">
              <Title level={4}>SHIPPING LABEL</Title>
              <div className="my-2">
                <Barcode value={generatedDocument.barcode} height={50} />
              </div>
              <Text strong>Tracking: {generatedDocument.trackingNumber}</Text>
            </div>

            <Divider />

            <Row gutter={16}>
              <Col span={12}>
                <div className="border p-3 rounded">
                  <Text strong className="block mb-2">SHIP FROM:</Text>
                  <Text>{generatedDocument.shipFrom.name}</Text>
                  <br />
                  <Text>{generatedDocument.shipFrom.address}</Text>
                  <br />
                  <Text>
                    {generatedDocument.shipFrom.city}, {generatedDocument.shipFrom.state}{' '}
                    {generatedDocument.shipFrom.zip}
                  </Text>
                </div>
              </Col>
              <Col span={12}>
                <div className="border p-3 rounded bg-yellow-50">
                  <Text strong className="block mb-2">SHIP TO:</Text>
                  <Text strong className="text-lg">{generatedDocument.shipTo.name}</Text>
                  <br />
                  <Text>{generatedDocument.shipTo.address}</Text>
                  <br />
                  <Text>
                    {generatedDocument.shipTo.city}, {generatedDocument.shipTo.state}{' '}
                    {generatedDocument.shipTo.zip}
                  </Text>
                </div>
              </Col>
            </Row>

            <Divider />

            <Row gutter={16}>
              <Col span={12}>
                <Text>
                  <strong>Service:</strong> {generatedDocument.service}
                </Text>
              </Col>
              <Col span={12}>
                <Text>
                  <strong>Weight:</strong> {generatedDocument.weight.value} {generatedDocument.weight.unit}
                </Text>
              </Col>
            </Row>
          </div>
        );

      case 'product-label':
        return (
          <div className="print-container p-4">
            {generatedDocument.labels.map((label: any, index: number) => (
              <div key={index} className="border-2 border-dashed p-4 mb-4 bg-white page-break">
                <div className="text-center">
                  <Title level={5}>{label.productName}</Title>
                  <Text type="secondary">SKU: {label.sku}</Text>
                  <div className="my-3">
                    <Barcode value={label.barcode} height={60} />
                  </div>
                  <Row gutter={8}>
                    <Col span={12}>
                      <Text strong>Brand:</Text> {label.brand}
                    </Col>
                    <Col span={12}>
                      <Text strong>Price:</Text> ${label.price}
                    </Col>
                  </Row>
                  <div className="mt-2">
                    <Text type="secondary">Location: {label.location}</Text>
                  </div>
                </div>
              </div>
            ))}
          </div>
        );

      default:
        return <Empty description="Document preview not available" />;
    }
  };

  const templatesByCategory = templates.reduce((acc, template) => {
    if (!acc[template.category]) {
      acc[template.category] = [];
    }
    acc[template.category].push(template);
    return acc;
  }, {} as Record<string, DocumentTemplate[]>);

  return (
    <div className="p-6">
      <div className="mb-6">
        <Title level={2}>
          <FileTextOutlined className="mr-2" />
          Document Templates
        </Title>
        <Text type="secondary">Generate printable documents for warehouse operations</Text>
      </div>

      {/* Templates Grid */}
      {Object.entries(templatesByCategory).map(([category, categoryTemplates]) => (
        <div key={category} className="mb-6">
          <Title level={4}>{category}</Title>
          <Row gutter={16}>
            {categoryTemplates.map((template) => (
              <Col xs={24} sm={12} lg={8} key={template.id} className="mb-4">
                <Card
                  hoverable
                  actions={[
                    <Button
                      key="generate"
                      type="primary"
                      icon={<PlusOutlined />}
                      onClick={() => {
                        setSelectedTemplate(template.id);
                        setModalVisible(true);
                      }}
                    >
                      Generate
                    </Button>,
                  ]}
                >
                  <Card.Meta
                    avatar={
                      <div className="text-3xl text-blue-500">
                        {getIconComponent(template.icon)}
                      </div>
                    }
                    title={template.name}
                    description={template.description}
                  />
                </Card>
              </Col>
            ))}
          </Row>
        </div>
      ))}

      {/* Generate Document Modal */}
      <Modal
        title={`Generate ${templates.find((t) => t.id === selectedTemplate)?.name || 'Document'}`}
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          form.resetFields();
        }}
        footer={null}
        width={700}
      >
        <Form form={form} layout="vertical" onFinish={handleGenerateDocument}>
          {renderTemplateForm()}

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" loading={loading}>
                Generate Document
              </Button>
              <Button onClick={() => setModalVisible(false)}>Cancel</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* Document Preview Modal */}
      <Modal
        title="Document Preview"
        open={previewVisible}
        onCancel={() => setPreviewVisible(false)}
        width={900}
        footer={[
          <Button key="print" type="primary" icon={<PrinterOutlined />} onClick={handlePrintDocument}>
            Print
          </Button>,
          <Button key="close" onClick={() => setPreviewVisible(false)}>
            Close
          </Button>,
        ]}
      >
        {renderDocumentPreview()}
      </Modal>

      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .print-container,
          .print-container * {
            visibility: visible;
          }
          .print-container {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
          .page-break {
            page-break-after: always;
          }
        }
      `}</style>
    </div>
  );
}
