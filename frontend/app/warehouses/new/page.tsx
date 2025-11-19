'use client';

import React from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, Form, Input, Select, Button, Row, Col, message } from 'antd';
import { SaveOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import { WAREHOUSE_TYPES } from '@/lib/constants';

const { Option } = Select;
const { TextArea } = Input;

export default function NewWarehousePage() {
  const router = useRouter();
  const [form] = Form.useForm();
  const [loading, setLoading] = React.useState(false);

  const handleSubmit = async (values: any) => {
    setLoading(true);
    try {
      // TODO: API call to create warehouse
      console.log('Creating warehouse:', values);
      message.success('Warehouse created successfully!');
      setTimeout(() => {
        router.push('/warehouses');
      }, 1000);
    } catch (error) {
      message.error('Failed to create warehouse');
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
            <h1 className="text-3xl font-bold">Add New Warehouse</h1>
            <p className="text-gray-600 mt-1">Create a new warehouse location</p>
          </div>
        </div>

        <Card>
          <Form
            form={form}
            layout="vertical"
            onFinish={handleSubmit}
            initialValues={{ status: 'active', type: 'fulfillment' }}
          >
            <Row gutter={16}>
              <Col xs={24} md={12}>
                <Form.Item
                  label="Warehouse Name"
                  name="name"
                  rules={[{ required: true, message: 'Please enter warehouse name' }]}
                >
                  <Input placeholder="e.g., Main Warehouse" size="large" />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item
                  label="Warehouse Code"
                  name="code"
                  rules={[{ required: true, message: 'Please enter warehouse code' }]}
                >
                  <Input placeholder="e.g., WH-001" size="large" />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col xs={24} md={12}>
                <Form.Item
                  label="Type"
                  name="type"
                  rules={[{ required: true }]}
                >
                  <Select size="large" placeholder="Select warehouse type">
                    {WAREHOUSE_TYPES.map(type => (
                      <Option key={type.value} value={type.value}>
                        {type.label}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
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
            </Row>

            <h3 className="text-lg font-semibold mb-4 mt-6">Address Information</h3>

            <Row gutter={16}>
              <Col xs={24}>
                <Form.Item
                  label="Street Address"
                  name={['address', 'street']}
                  rules={[{ required: true, message: 'Please enter street address' }]}
                >
                  <Input placeholder="123 Main Street" size="large" />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col xs={24} md={8}>
                <Form.Item
                  label="City"
                  name={['address', 'city']}
                  rules={[{ required: true, message: 'Please enter city' }]}
                >
                  <Input placeholder="New York" size="large" />
                </Form.Item>
              </Col>
              <Col xs={24} md={8}>
                <Form.Item
                  label="State"
                  name={['address', 'state']}
                  rules={[{ required: true, message: 'Please enter state' }]}
                >
                  <Input placeholder="NY" size="large" />
                </Form.Item>
              </Col>
              <Col xs={24} md={8}>
                <Form.Item
                  label="ZIP Code"
                  name={['address', 'zipCode']}
                  rules={[{ required: true, message: 'Please enter ZIP code' }]}
                >
                  <Input placeholder="10001" size="large" />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col xs={24} md={12}>
                <Form.Item
                  label="Country"
                  name={['address', 'country']}
                  rules={[{ required: true }]}
                >
                  <Input placeholder="United States" size="large" defaultValue="United States" />
                </Form.Item>
              </Col>
            </Row>

            <h3 className="text-lg font-semibold mb-4 mt-6">Capacity Information</h3>

            <Row gutter={16}>
              <Col xs={24} md={8}>
                <Form.Item
                  label="Total Capacity"
                  name={['capacity', 'total']}
                  rules={[{ required: true, message: 'Please enter total capacity' }]}
                >
                  <Input type="number" placeholder="10000" size="large" />
                </Form.Item>
              </Col>
              <Col xs={24} md={8}>
                <Form.Item
                  label="Unit"
                  name={['capacity', 'unit']}
                  rules={[{ required: true }]}
                >
                  <Select size="large" defaultValue="sqft">
                    <Option value="sqft">Square Feet</Option>
                    <Option value="sqm">Square Meters</Option>
                    <Option value="pallets">Pallets</Option>
                  </Select>
                </Form.Item>
              </Col>
            </Row>

            <Form.Item label="Description" name="description">
              <TextArea rows={4} placeholder="Enter warehouse description..." />
            </Form.Item>

            <div className="flex gap-4 mt-6">
              <Button
                type="primary"
                htmlType="submit"
                icon={<SaveOutlined />}
                size="large"
                loading={loading}
              >
                Create Warehouse
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
