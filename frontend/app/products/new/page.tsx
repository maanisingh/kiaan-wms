'use client';

import React from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, Form, Input, Select, Button, Row, Col, message, InputNumber, Upload } from 'antd';
import { SaveOutlined, ArrowLeftOutlined, UploadOutlined } from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import { PRODUCT_TYPES, UNITS_OF_MEASURE, DIMENSION_UNITS, WEIGHT_UNITS } from '@/lib/constants';

const { Option } = Select;
const { TextArea } = Input;

export default function NewProductPage() {
  const router = useRouter();
  const [form] = Form.useForm();
  const [loading, setLoading] = React.useState(false);

  const handleSubmit = async (values: any) => {
    setLoading(true);
    try {
      // TODO: API call to create product
      console.log('Creating product:', values);
      message.success('Product created successfully!');
      setTimeout(() => {
        router.push('/products');
      }, 1000);
    } catch (error) {
      message.error('Failed to create product');
    } finally {
      setLoading(false);
    }
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button
            icon={<ArrowLeftOutlined />}
            onClick={() => router.back()}
          >
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Add New Product</h1>
            <p className="text-gray-600 mt-1">Create a new product in your inventory</p>
          </div>
        </div>

        <Card>
          <Form
            form={form}
            layout="vertical"
            onFinish={handleSubmit}
            initialValues={{
              type: 'simple',
              status: 'active',
              trackInventory: true,
              unitOfMeasure: 'ea',
              dimensionUnit: 'cm',
              weightUnit: 'kg',
            }}
          >
            <h3 className="text-lg font-semibold mb-4">Basic Information</h3>

            <Row gutter={16}>
              <Col xs={24} md={12}>
                <Form.Item
                  label="Product Name"
                  name="name"
                  rules={[{ required: true, message: 'Please enter product name' }]}
                >
                  <Input placeholder="e.g., Laptop Stand" size="large" />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item
                  label="SKU"
                  name="sku"
                  rules={[{ required: true, message: 'Please enter SKU' }]}
                >
                  <Input placeholder="e.g., PRD-001" size="large" />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col xs={24} md={8}>
                <Form.Item
                  label="Product Type"
                  name="type"
                  rules={[{ required: true }]}
                >
                  <Select size="large">
                    {PRODUCT_TYPES.map(type => (
                      <Option key={type.value} value={type.value}>
                        {type.label}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
              <Col xs={24} md={8}>
                <Form.Item
                  label="Status"
                  name="status"
                  rules={[{ required: true }]}
                >
                  <Select size="large">
                    <Option value="active">Active</Option>
                    <Option value="inactive">Inactive</Option>
                  </Select>
                </Form.Item>
              </Col>
              <Col xs={24} md={8}>
                <Form.Item
                  label="Unit of Measure"
                  name="unitOfMeasure"
                  rules={[{ required: true }]}
                >
                  <Select size="large">
                    {UNITS_OF_MEASURE.map(unit => (
                      <Option key={unit.value} value={unit.value}>
                        {unit.label}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col xs={24} md={12}>
                <Form.Item label="Category" name="category">
                  <Select size="large" placeholder="Select category" allowClear>
                    <Option value="electronics">Electronics</Option>
                    <Option value="furniture">Furniture</Option>
                    <Option value="clothing">Clothing</Option>
                    <Option value="food">Food & Beverage</Option>
                    <Option value="other">Other</Option>
                  </Select>
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item label="Barcode" name="barcode">
                  <Input placeholder="Enter barcode" size="large" />
                </Form.Item>
              </Col>
            </Row>

            <Form.Item label="Description" name="description">
              <TextArea rows={4} placeholder="Enter product description..." />
            </Form.Item>

            <h3 className="text-lg font-semibold mb-4 mt-6">Pricing</h3>

            <Row gutter={16}>
              <Col xs={24} md={8}>
                <Form.Item
                  label="Cost Price"
                  name="costPrice"
                  rules={[{ required: true, message: 'Please enter cost price' }]}
                >
                  <InputNumber
                    placeholder="0.00"
                    size="large"
                    style={{ width: '100%' }}
                    prefix="$"
                    min={0}
                    step={0.01}
                  />
                </Form.Item>
              </Col>
              <Col xs={24} md={8}>
                <Form.Item
                  label="Selling Price"
                  name="sellingPrice"
                  rules={[{ required: true, message: 'Please enter selling price' }]}
                >
                  <InputNumber
                    placeholder="0.00"
                    size="large"
                    style={{ width: '100%' }}
                    prefix="$"
                    min={0}
                    step={0.01}
                  />
                </Form.Item>
              </Col>
              <Col xs={24} md={8}>
                <Form.Item label="MSRP" name="msrp">
                  <InputNumber
                    placeholder="0.00"
                    size="large"
                    style={{ width: '100%' }}
                    prefix="$"
                    min={0}
                    step={0.01}
                  />
                </Form.Item>
              </Col>
            </Row>

            <h3 className="text-lg font-semibold mb-4 mt-6">Dimensions & Weight</h3>

            <Row gutter={16}>
              <Col xs={24} md={6}>
                <Form.Item label="Length" name={['dimensions', 'length']}>
                  <InputNumber placeholder="0" size="large" style={{ width: '100%' }} min={0} />
                </Form.Item>
              </Col>
              <Col xs={24} md={6}>
                <Form.Item label="Width" name={['dimensions', 'width']}>
                  <InputNumber placeholder="0" size="large" style={{ width: '100%' }} min={0} />
                </Form.Item>
              </Col>
              <Col xs={24} md={6}>
                <Form.Item label="Height" name={['dimensions', 'height']}>
                  <InputNumber placeholder="0" size="large" style={{ width: '100%' }} min={0} />
                </Form.Item>
              </Col>
              <Col xs={24} md={6}>
                <Form.Item label="Unit" name="dimensionUnit">
                  <Select size="large">
                    {DIMENSION_UNITS.map(unit => (
                      <Option key={unit.value} value={unit.value}>
                        {unit.label}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col xs={24} md={12}>
                <Form.Item label="Weight" name="weight">
                  <InputNumber placeholder="0.00" size="large" style={{ width: '100%' }} min={0} step={0.01} />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item label="Weight Unit" name="weightUnit">
                  <Select size="large">
                    {WEIGHT_UNITS.map(unit => (
                      <Option key={unit.value} value={unit.value}>
                        {unit.label}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
            </Row>

            <h3 className="text-lg font-semibold mb-4 mt-6">Inventory Settings</h3>

            <Row gutter={16}>
              <Col xs={24} md={8}>
                <Form.Item label="Reorder Point" name="reorderPoint">
                  <InputNumber placeholder="0" size="large" style={{ width: '100%' }} min={0} />
                </Form.Item>
              </Col>
              <Col xs={24} md={8}>
                <Form.Item label="Reorder Quantity" name="reorderQuantity">
                  <InputNumber placeholder="0" size="large" style={{ width: '100%' }} min={0} />
                </Form.Item>
              </Col>
              <Col xs={24} md={8}>
                <Form.Item label="Max Stock Level" name="maxStockLevel">
                  <InputNumber placeholder="0" size="large" style={{ width: '100%' }} min={0} />
                </Form.Item>
              </Col>
            </Row>

            <h3 className="text-lg font-semibold mb-4 mt-6">Product Images</h3>

            <Form.Item label="Upload Images" name="images">
              <Upload
                listType="picture-card"
                accept="image/*"
                maxCount={5}
              >
                <div>
                  <UploadOutlined />
                  <div style={{ marginTop: 8 }}>Upload</div>
                </div>
              </Upload>
            </Form.Item>

            <div className="flex gap-4 mt-6">
              <Button
                type="primary"
                htmlType="submit"
                icon={<SaveOutlined />}
                size="large"
                loading={loading}
              >
                Create Product
              </Button>
              <Button size="large" onClick={() => router.back()}>
                Cancel
              </Button>
            </div>
          </Form>
        </Card>
      </div>
    </MainLayout>
  );
}
