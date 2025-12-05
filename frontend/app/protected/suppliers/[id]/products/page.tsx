'use client';

import React, { useState, useEffect } from 'react';
import { Table, Button, Card, Modal, Form, Input, InputNumber, Select, Space, message, Tag, Descriptions } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, ArrowLeftOutlined, UploadOutlined } from '@ant-design/icons';
import { useRouter, useParams } from 'next/navigation';
import apiService from '@/services/api';

interface SupplierProduct {
  id: string;
  supplierId: string;
  productId: string;
  supplierSKU: string;
  caseSize?: number;
  minOrderQty?: number;
  leadTimeDays?: number;
  costPrice?: number;
  isPreferred: boolean;
  isActive: boolean;
  notes?: string;
  product: {
    id: string;
    sku: string;
    name: string;
    costPrice?: number;
    brand?: { name: string };
  };
}

interface Supplier {
  id: string;
  name: string;
  code: string;
  email?: string;
  phone?: string;
}

export default function SupplierProductsPage() {
  const router = useRouter();
  const params = useParams();
  const supplierId = params.id as string;

  const [loading, setLoading] = useState(false);
  const [supplier, setSupplier] = useState<Supplier | null>(null);
  const [supplierProducts, setSupplierProducts] = useState<SupplierProduct[]>([]);
  const [allProducts, setAllProducts] = useState<any[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState<SupplierProduct | null>(null);
  const [form] = Form.useForm();

  useEffect(() => {
    fetchSupplier();
    fetchSupplierProducts();
    fetchAllProducts();
  }, [supplierId]);

  const fetchSupplier = async () => {
    try {
      const data = await apiService.get(`/suppliers/${supplierId}`);
      setSupplier(data);
    } catch (error: any) {
      message.error('Failed to load supplier');
      console.error(error);
    }
  };

  const fetchSupplierProducts = async () => {
    try {
      setLoading(true);
      const data = await apiService.get(`/supplier-products?supplierId=${supplierId}`);
      setSupplierProducts(Array.isArray(data) ? data : []);
    } catch (error: any) {
      message.error('Failed to load supplier products');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAllProducts = async () => {
    try {
      const data = await apiService.get('/products');
      setAllProducts(Array.isArray(data) ? data : []);
    } catch (error: any) {
      console.error('Failed to load products:', error);
    }
  };

  const handleAdd = () => {
    setEditingItem(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (item: SupplierProduct) => {
    setEditingItem(item);
    form.setFieldsValue({
      productId: item.productId,
      supplierSKU: item.supplierSKU,
      caseSize: item.caseSize,
      minOrderQty: item.minOrderQty,
      leadTimeDays: item.leadTimeDays,
      costPrice: item.costPrice,
      isPreferred: item.isPreferred,
      isActive: item.isActive,
      notes: item.notes
    });
    setModalVisible(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await apiService.delete(`/supplier-products/${id}`);
      message.success('Supplier product deleted');
      fetchSupplierProducts();
    } catch (error: any) {
      message.error('Failed to delete supplier product');
    }
  };

  const handleSubmit = async (values: any) => {
    try {
      if (editingItem) {
        await apiService.put(`/supplier-products/${editingItem.id}`, values);
        message.success('Supplier product updated');
      } else {
        await apiService.post('/supplier-products', {
          ...values,
          supplierId
        });
        message.success('Supplier product added');
      }
      setModalVisible(false);
      fetchSupplierProducts();
    } catch (error: any) {
      message.error(error.response?.data?.error || 'Failed to save supplier product');
    }
  };

  const columns = [
    {
      title: 'Supplier SKU',
      dataIndex: 'supplierSKU',
      key: 'supplierSKU',
      render: (text: string) => <Tag color="blue">{text}</Tag>
    },
    {
      title: 'Our Product',
      key: 'product',
      render: (_: any, record: SupplierProduct) => (
        <div>
          <div><strong>{record.product.sku}</strong></div>
          <div style={{ fontSize: '12px', color: '#666' }}>{record.product.name}</div>
        </div>
      )
    },
    {
      title: 'Brand',
      key: 'brand',
      render: (_: any, record: SupplierProduct) => record.product.brand?.name || '-'
    },
    {
      title: 'Case Size',
      dataIndex: 'caseSize',
      key: 'caseSize',
      render: (size: number) => size ? `${size} units/case` : '-'
    },
    {
      title: 'Min Order',
      dataIndex: 'minOrderQty',
      key: 'minOrderQty',
      render: (qty: number) => qty || '-'
    },
    {
      title: 'Lead Time',
      dataIndex: 'leadTimeDays',
      key: 'leadTimeDays',
      render: (days: number) => days ? `${days} days` : '-'
    },
    {
      title: 'Cost Price',
      dataIndex: 'costPrice',
      key: 'costPrice',
      render: (price: number) => price ? `£${price.toFixed(2)}` : '-'
    },
    {
      title: 'Status',
      key: 'status',
      render: (_: any, record: SupplierProduct) => (
        <Space>
          {record.isPreferred && <Tag color="gold">Preferred</Tag>}
          <Tag color={record.isActive ? 'green' : 'red'}>
            {record.isActive ? 'Active' : 'Inactive'}
          </Tag>
        </Space>
      )
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, record: SupplierProduct) => (
        <Space>
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            Edit
          </Button>
          <Button
            type="link"
            size="small"
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDelete(record.id)}
          >
            Delete
          </Button>
        </Space>
      )
    }
  ];

  return (
    <div style={{ padding: '24px' }}>
      <Button
        icon={<ArrowLeftOutlined />}
        onClick={() => router.push('/protected/suppliers')}
        style={{ marginBottom: '16px' }}
      >
        Back to Suppliers
      </Button>

      {supplier && (
        <Card style={{ marginBottom: '16px' }}>
          <Descriptions title={`Supplier: ${supplier.name}`} column={3}>
            <Descriptions.Item label="Code">{supplier.code}</Descriptions.Item>
            <Descriptions.Item label="Email">{supplier.email || '-'}</Descriptions.Item>
            <Descriptions.Item label="Phone">{supplier.phone || '-'}</Descriptions.Item>
          </Descriptions>
        </Card>
      )}

      <Card
        title="Supplier Products"
        extra={
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleAdd}
          >
            Add Product
          </Button>
        }
      >
        <Table
          loading={loading}
          columns={columns}
          dataSource={supplierProducts}
          rowKey="id"
          pagination={{ pageSize: 20 }}
        />
      </Card>

      <Modal
        title={editingItem ? 'Edit Supplier Product' : 'Add Supplier Product'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        onOk={() => form.submit()}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
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
              filterOption={(input, option: any) =>
                option.children.toLowerCase().includes(input.toLowerCase())
              }
            >
              {allProducts.map(p => (
                <Select.Option key={p.id} value={p.id}>
                  {p.sku} - {p.name}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="supplierSKU"
            label="Supplier SKU"
            rules={[{ required: true, message: 'Please enter supplier SKU' }]}
          >
            <Input placeholder="Supplier's SKU for this product" />
          </Form.Item>

          <Form.Item
            name="caseSize"
            label="Case Size (units per case)"
          >
            <InputNumber min={1} style={{ width: '100%' }} placeholder="12" />
          </Form.Item>

          <Form.Item
            name="minOrderQty"
            label="Minimum Order Quantity"
          >
            <InputNumber min={1} style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item
            name="leadTimeDays"
            label="Lead Time (days)"
          >
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item
            name="costPrice"
            label="Cost Price"
          >
            <InputNumber
              min={0}
              step={0.01}
              prefix="£"
              style={{ width: '100%' }}
            />
          </Form.Item>

          <Form.Item
            name="isPreferred"
            label="Preferred Supplier"
            valuePropName="checked"
          >
            <Select>
              <Select.Option value={true}>Yes</Select.Option>
              <Select.Option value={false}>No</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="isActive"
            label="Active"
            valuePropName="checked"
            initialValue={true}
          >
            <Select>
              <Select.Option value={true}>Active</Select.Option>
              <Select.Option value={false}>Inactive</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="notes"
            label="Notes"
          >
            <Input.TextArea rows={3} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
