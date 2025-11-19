'use client';

import React, { useState, useEffect } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, Button, Form, Input, Select, InputNumber, message, Space, Tabs, Switch } from 'antd';
import { ArrowLeftOutlined, SaveOutlined, CalendarOutlined } from '@ant-design/icons';
import { useRouter, useParams } from 'next/navigation';
import { mockProducts, mockCategories } from '@/lib/mockData';

const { Option } = Select;
const { TextArea } = Input;

export default function ProductEditPage() {
  const router = useRouter();
  const params = useParams();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [product, setProduct] = useState<any>(null);

  useEffect(() => {
    // Simulate fetching product data
    const foundProduct = mockProducts.find((p) => p.id === params.id);
    if (foundProduct) {
      setProduct(foundProduct);
      // Set form values
      form.setFieldsValue({
        name: foundProduct.name,
        sku: foundProduct.sku,
        barcode: foundProduct.barcode,
        description: foundProduct.description,
        categoryId: foundProduct.category?.id,
        type: foundProduct.type,
        status: foundProduct.status,
        cost: foundProduct.pricing?.cost,
        price: foundProduct.pricing?.price,
        weight: foundProduct.dimensions?.weight,
        weightUnit: foundProduct.dimensions?.weightUnit,
        length: foundProduct.dimensions?.length,
        width: foundProduct.dimensions?.width,
        height: foundProduct.dimensions?.height,
        dimensionUnit: foundProduct.dimensions?.unit,
        // Expiry tracking fields (defaults)
        shelfLifeDays: 365,
        expiryTrackingEnabled: true,
        fefoEnabled: true,
        alertThresholdDays: 180,
      });
    }
  }, [params.id, form]);

  const handleSubmit = async (values: any) => {
    setLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      console.log('Updated product values:', values);
      message.success('Product updated successfully!');
      router.push(`/products/${params.id}`);
    } catch (error) {
      message.error('Failed to update product');
    } finally {
      setLoading(false);
    }
  };

  if (!product) {
    return (
      <MainLayout>
        <div className="text-center py-12">
          <h2 className="text-2xl">Product not found</h2>
          <Button className="mt-4" onClick={() => router.push('/products')}>
            Back to Products
          </Button>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Button
              icon={<ArrowLeftOutlined />}
              onClick={() => router.back()}
            >
              Back
            </Button>
            <div>
              <h1 className="text-3xl font-bold">Edit Product</h1>
              <p className="text-gray-600 mt-1">SKU: {product.sku}</p>
            </div>
          </div>
          <Space>
            <Button onClick={() => router.back()}>
              Cancel
            </Button>
            <Button
              type="primary"
              icon={<SaveOutlined />}
              onClick={() => form.submit()}
              loading={loading}
              size="large"
            >
              Save Changes
            </Button>
          </Space>
        </div>

        {/* Form */}
        <Card>
          <Form
            form={form}
            layout="vertical"
            onFinish={handleSubmit}
          >
            <Tabs
              defaultActiveKey="basic"
              items={[
                {
                  key: 'basic',
                  label: 'Basic Information',
                  children: (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Form.Item
                        label="Product Name"
                        name="name"
                        rules={[{ required: true, message: 'Please enter product name' }]}
                      >
                        <Input size="large" placeholder="Enter product name" />
                      </Form.Item>

                      <Form.Item
                        label="SKU"
                        name="sku"
                        rules={[{ required: true, message: 'Please enter SKU' }]}
                      >
                        <Input size="large" placeholder="Enter SKU" />
                      </Form.Item>

                      <Form.Item
                        label="Barcode"
                        name="barcode"
                      >
                        <Input size="large" placeholder="Enter barcode" />
                      </Form.Item>

                      <Form.Item
                        label="Category"
                        name="categoryId"
                        rules={[{ required: true, message: 'Please select category' }]}
                      >
                        <Select size="large" placeholder="Select category">
                          {mockCategories.map(cat => (
                            <Option key={cat.id} value={cat.id}>{cat.name}</Option>
                          ))}
                        </Select>
                      </Form.Item>

                      <Form.Item
                        label="Type"
                        name="type"
                        rules={[{ required: true, message: 'Please select type' }]}
                      >
                        <Select size="large" placeholder="Select type">
                          <Option value="physical">Physical</Option>
                          <Option value="digital">Digital</Option>
                          <Option value="service">Service</Option>
                        </Select>
                      </Form.Item>

                      <Form.Item
                        label="Status"
                        name="status"
                        rules={[{ required: true, message: 'Please select status' }]}
                      >
                        <Select size="large" placeholder="Select status">
                          <Option value="active">Active</Option>
                          <Option value="inactive">Inactive</Option>
                          <Option value="discontinued">Discontinued</Option>
                        </Select>
                      </Form.Item>

                      <Form.Item
                        label="Description"
                        name="description"
                        className="md:col-span-2"
                      >
                        <TextArea rows={4} placeholder="Enter product description" />
                      </Form.Item>
                    </div>
                  ),
                },
                {
                  key: 'pricing',
                  label: 'Pricing',
                  children: (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Form.Item
                        label="Unit Cost"
                        name="cost"
                        rules={[{ required: true, message: 'Please enter unit cost' }]}
                      >
                        <InputNumber
                          size="large"
                          style={{ width: '100%' }}
                          min={0}
                          precision={2}
                          prefix="$"
                          placeholder="0.00"
                        />
                      </Form.Item>

                      <Form.Item
                        label="Unit Price"
                        name="price"
                        rules={[{ required: true, message: 'Please enter unit price' }]}
                      >
                        <InputNumber
                          size="large"
                          style={{ width: '100%' }}
                          min={0}
                          precision={2}
                          prefix="$"
                          placeholder="0.00"
                        />
                      </Form.Item>
                    </div>
                  ),
                },
                {
                  key: 'dimensions',
                  label: 'Dimensions & Weight',
                  children: (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Form.Item
                          label="Weight"
                          name="weight"
                        >
                          <InputNumber
                            size="large"
                            style={{ width: '100%' }}
                            min={0}
                            precision={2}
                            placeholder="0.00"
                          />
                        </Form.Item>

                        <Form.Item
                          label="Weight Unit"
                          name="weightUnit"
                        >
                          <Select size="large" placeholder="Select unit">
                            <Option value="kg">Kilograms (kg)</Option>
                            <Option value="lb">Pounds (lb)</Option>
                            <Option value="g">Grams (g)</Option>
                          </Select>
                        </Form.Item>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <Form.Item
                          label="Length"
                          name="length"
                        >
                          <InputNumber
                            size="large"
                            style={{ width: '100%' }}
                            min={0}
                            precision={2}
                            placeholder="0.00"
                          />
                        </Form.Item>

                        <Form.Item
                          label="Width"
                          name="width"
                        >
                          <InputNumber
                            size="large"
                            style={{ width: '100%' }}
                            min={0}
                            precision={2}
                            placeholder="0.00"
                          />
                        </Form.Item>

                        <Form.Item
                          label="Height"
                          name="height"
                        >
                          <InputNumber
                            size="large"
                            style={{ width: '100%' }}
                            min={0}
                            precision={2}
                            placeholder="0.00"
                          />
                        </Form.Item>

                        <Form.Item
                          label="Unit"
                          name="dimensionUnit"
                        >
                          <Select size="large" placeholder="Select unit">
                            <Option value="cm">Centimeters (cm)</Option>
                            <Option value="in">Inches (in)</Option>
                            <Option value="m">Meters (m)</Option>
                          </Select>
                        </Form.Item>
                      </div>
                    </div>
                  ),
                },
                {
                  key: 'expiry',
                  label: (
                    <span>
                      <CalendarOutlined /> Expiry & Tracking
                    </span>
                  ),
                  children: (
                    <div className="space-y-4">
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                        <p className="text-blue-800 text-sm">
                          <strong>📅 Expiry Tracking:</strong> Configure how this product's expiration dates are managed.
                          Best-Before dates and lot numbers help ensure FIFO/FEFO compliance.
                        </p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Form.Item
                          label="Shelf Life (Days)"
                          name="shelfLifeDays"
                          tooltip="Default number of days from manufacturing date until expiry"
                          rules={[{ required: true, message: 'Please enter shelf life' }]}
                        >
                          <InputNumber
                            size="large"
                            style={{ width: '100%' }}
                            min={1}
                            max={3650}
                            placeholder="365"
                            suffix="days"
                          />
                        </Form.Item>

                        <Form.Item
                          label="Alert Threshold (Days)"
                          name="alertThresholdDays"
                          tooltip="Show warnings when stock is within this many days of expiry"
                          rules={[{ required: true, message: 'Please enter alert threshold' }]}
                        >
                          <InputNumber
                            size="large"
                            style={{ width: '100%' }}
                            min={1}
                            max={365}
                            placeholder="180"
                            suffix="days"
                          />
                        </Form.Item>

                        <Form.Item
                          label="Enable Expiry Tracking"
                          name="expiryTrackingEnabled"
                          valuePropName="checked"
                          tooltip="Track Best-Before dates for all inventory of this product"
                        >
                          <Switch
                            checkedChildren="Enabled"
                            unCheckedChildren="Disabled"
                            defaultChecked
                          />
                        </Form.Item>

                        <Form.Item
                          label="Enable FEFO Picking"
                          name="fefoEnabled"
                          valuePropName="checked"
                          tooltip="First-Expiry, First-Out: Always pick items with nearest expiry date first"
                        >
                          <Switch
                            checkedChildren="Enabled"
                            unCheckedChildren="Disabled"
                            defaultChecked
                          />
                        </Form.Item>
                      </div>

                      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mt-6">
                        <h4 className="font-semibold mb-2 text-gray-700">Lot & Batch Tracking</h4>
                        <p className="text-sm text-gray-600 mb-3">
                          When receiving inventory of this product, you will be prompted to enter:
                        </p>
                        <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                          <li>Lot Number (unique identifier for this batch)</li>
                          <li>Batch Number (manufacturer's batch code)</li>
                          <li>Best-Before Date (when this lot expires)</li>
                          <li>Manufacturing Date (optional)</li>
                        </ul>
                      </div>
                    </div>
                  ),
                },
              ]}
            />
          </Form>
        </Card>
      </div>
    </MainLayout>
  );
}
