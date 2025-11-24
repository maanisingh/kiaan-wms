'use client';

import React, { useState, useEffect } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, Button, Form, Input, Select, InputNumber, message, Space } from 'antd';
import { ArrowLeftOutlined, SaveOutlined } from '@ant-design/icons';
import { useRouter, useParams } from 'next/navigation';
import { mockWarehouses } from '@/lib/mockData';

const { Option } = Select;
const { TextArea } = Input;

export default function WarehouseEditPage() {
  const router = useRouter();
  const params = useParams();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [warehouse, setWarehouse] = useState<any>(null);

  useEffect(() => {
    // Simulate fetching warehouse data
    const foundWarehouse = mockWarehouses.find((w) => w.id === params.id);
    if (foundWarehouse) {
      setWarehouse(foundWarehouse);
      // Set form values
      form.setFieldsValue({
        name: foundWarehouse.name,
        code: foundWarehouse.code,
        type: foundWarehouse.type,
        status: foundWarehouse.status,
        street: foundWarehouse.address.street,
        city: foundWarehouse.address.city,
        state: foundWarehouse.address.state,
        zipCode: foundWarehouse.address.postalCode,
        country: foundWarehouse.address.country,
        totalCapacity: foundWarehouse.capacity.total,
        capacityUnit: foundWarehouse.capacity.unit,
        phone: (foundWarehouse as any).contact?.phone || '',
        email: (foundWarehouse as any).contact?.email || '',
        manager: (foundWarehouse as any).manager || '',
        operatingHours: (foundWarehouse as any).operatingHours || '',
      });
    }
  }, [params.id, form]);

  const handleSubmit = async (values: any) => {
    setLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      console.log('Updated warehouse values:', values);
      message.success('Warehouse updated successfully!');
      router.push(`/warehouses/${params.id}`);
    } catch (error) {
      message.error('Failed to update warehouse');
    } finally {
      setLoading(false);
    }
  };

  if (!warehouse) {
    return (
      <MainLayout>
        <div className="text-center py-12">
          <h2 className="text-2xl">Warehouse not found</h2>
          <Button className="mt-4" onClick={() => router.push('/warehouses')}>
            Back to Warehouses
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
              <h1 className="text-3xl font-bold">Edit Warehouse</h1>
              <p className="text-gray-600 mt-1">Code: {warehouse.code}</p>
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
        <Card title="Warehouse Information">
          <Form
            form={form}
            layout="vertical"
            onFinish={handleSubmit}
          >
            <div className="space-y-6">
              {/* Basic Information */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Basic Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Form.Item
                    label="Warehouse Name"
                    name="name"
                    rules={[{ required: true, message: 'Please enter warehouse name' }]}
                  >
                    <Input size="large" placeholder="Enter warehouse name" />
                  </Form.Item>

                  <Form.Item
                    label="Warehouse Code"
                    name="code"
                    rules={[{ required: true, message: 'Please enter warehouse code' }]}
                  >
                    <Input size="large" placeholder="Enter warehouse code" />
                  </Form.Item>

                  <Form.Item
                    label="Type"
                    name="type"
                    rules={[{ required: true, message: 'Please select type' }]}
                  >
                    <Select size="large" placeholder="Select type">
                      <Option value="Distribution Center">Distribution Center</Option>
                      <Option value="Fulfillment Center">Fulfillment Center</Option>
                      <Option value="Cold Storage">Cold Storage</Option>
                      <Option value="Cross-Dock">Cross-Dock</Option>
                      <Option value="General Storage">General Storage</Option>
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
                      <Option value="maintenance">Maintenance</Option>
                    </Select>
                  </Form.Item>

                  <Form.Item
                    label="Manager"
                    name="manager"
                  >
                    <Input size="large" placeholder="Enter manager name" />
                  </Form.Item>

                  <Form.Item
                    label="Operating Hours"
                    name="operatingHours"
                  >
                    <Input size="large" placeholder="e.g., Monday - Friday, 8:00 AM - 6:00 PM" />
                  </Form.Item>
                </div>
              </div>

              {/* Address */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Address</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Form.Item
                    label="Street Address"
                    name="street"
                    rules={[{ required: true, message: 'Please enter street address' }]}
                    className="md:col-span-2"
                  >
                    <Input size="large" placeholder="Enter street address" />
                  </Form.Item>

                  <Form.Item
                    label="City"
                    name="city"
                    rules={[{ required: true, message: 'Please enter city' }]}
                  >
                    <Input size="large" placeholder="Enter city" />
                  </Form.Item>

                  <Form.Item
                    label="State/Province"
                    name="state"
                    rules={[{ required: true, message: 'Please enter state' }]}
                  >
                    <Input size="large" placeholder="Enter state" />
                  </Form.Item>

                  <Form.Item
                    label="ZIP/Postal Code"
                    name="zipCode"
                    rules={[{ required: true, message: 'Please enter ZIP code' }]}
                  >
                    <Input size="large" placeholder="Enter ZIP code" />
                  </Form.Item>

                  <Form.Item
                    label="Country"
                    name="country"
                    rules={[{ required: true, message: 'Please enter country' }]}
                  >
                    <Input size="large" placeholder="Enter country" />
                  </Form.Item>
                </div>
              </div>

              {/* Contact Information */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Contact Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Form.Item
                    label="Phone"
                    name="phone"
                  >
                    <Input size="large" placeholder="Enter phone number" />
                  </Form.Item>

                  <Form.Item
                    label="Email"
                    name="email"
                    rules={[{ type: 'email', message: 'Please enter valid email' }]}
                  >
                    <Input size="large" placeholder="Enter email address" />
                  </Form.Item>
                </div>
              </div>

              {/* Capacity */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Capacity</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Form.Item
                    label="Total Capacity"
                    name="totalCapacity"
                    rules={[{ required: true, message: 'Please enter total capacity' }]}
                  >
                    <InputNumber
                      size="large"
                      style={{ width: '100%' }}
                      min={0}
                      placeholder="Enter capacity"
                    />
                  </Form.Item>

                  <Form.Item
                    label="Capacity Unit"
                    name="capacityUnit"
                    rules={[{ required: true, message: 'Please select unit' }]}
                  >
                    <Select size="large" placeholder="Select unit">
                      <Option value="sq ft">Square Feet (sq ft)</Option>
                      <Option value="sq m">Square Meters (sq m)</Option>
                      <Option value="pallets">Pallets</Option>
                      <Option value="units">Units</Option>
                    </Select>
                  </Form.Item>
                </div>
              </div>
            </div>
          </Form>
        </Card>
      </div>
    </MainLayout>
  );
}
