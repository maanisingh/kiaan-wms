'use client';

import React from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, Button, Form, Input, message, Alert } from 'antd';
import Link from 'next/link';
import { LockOutlined, UserOutlined } from '@ant-design/icons';

export default function DemoPage() {
  const [form] = Form.useForm();

  const handleSubmit = (values: any) => {
    console.log('Demo request:', values);
    message.success('Demo request submitted successfully!');
    form.resetFields();
  };

  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="text-center">
          <h1 className="text-4xl font-bold">Request a Demo</h1>
          <p className="text-gray-600 mt-2">See Kiaan WMS in action</p>
        </div>

        {/* Live Demo Access Card */}
        <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
          <div className="text-center space-y-4">
            <h2 className="text-2xl font-bold text-blue-900">Try Our Live Demo Now!</h2>
            <p className="text-gray-700">Access a fully functional WMS system with sample data</p>

            <Alert
              message="Demo Credentials"
              description={
                <div className="text-left space-y-2 mt-2">
                  <div className="flex items-center gap-2">
                    <UserOutlined className="text-blue-600" />
                    <strong>Email:</strong> <code className="bg-white px-2 py-1 rounded">demo@kiaan.com</code>
                  </div>
                  <div className="flex items-center gap-2">
                    <LockOutlined className="text-blue-600" />
                    <strong>Password:</strong> <code className="bg-white px-2 py-1 rounded">demo123</code>
                  </div>
                </div>
              }
              type="info"
              showIcon
            />

            <Link href="/auth/login">
              <Button type="primary" size="large" className="mt-4">
                Access Live Demo →
              </Button>
            </Link>
          </div>
        </Card>

        {/* Contact Form */}
        <Card title="Or Request a Personalized Demo">
          <Form form={form} layout="vertical" onFinish={handleSubmit}>
            <Form.Item label="Company Name" name="company" rules={[{ required: true }]}>
              <Input placeholder="Enter company name" size="large" />
            </Form.Item>
            <Form.Item label="Full Name" name="name" rules={[{ required: true }]}>
              <Input placeholder="Enter your name" size="large" />
            </Form.Item>
            <Form.Item label="Email" name="email" rules={[{ required: true, type: 'email' }]}>
              <Input placeholder="Enter email address" size="large" />
            </Form.Item>
            <Form.Item label="Phone" name="phone" rules={[{ required: true }]}>
              <Input placeholder="Enter phone number" size="large" />
            </Form.Item>
            <Form.Item label="Message" name="message">
              <Input.TextArea rows={4} placeholder="Tell us about your requirements" />
            </Form.Item>
            <Form.Item>
              <Button type="primary" htmlType="submit" size="large" block>
                Request Personalized Demo
              </Button>
            </Form.Item>
          </Form>
        </Card>
      </div>
    </MainLayout>
  );
}
