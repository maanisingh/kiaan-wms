'use client';

import React, { useState } from 'react';
import { Card, Form, Input, Button, message, Alert, Typography } from 'antd';
import { MailOutlined, ArrowLeftOutlined, CheckCircleOutlined } from '@ant-design/icons';
import Link from 'next/link';

const { Title, Text, Paragraph } = Typography;

export default function ForgotPasswordPage() {
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [email, setEmail] = useState('');

  const handleSubmit = async (values: { email: string }) => {
    try {
      setLoading(true);
      // In a real app, this would call the API
      // await apiService.post('/auth/forgot-password', { email: values.email });

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));

      setEmail(values.email);
      setSubmitted(true);
      message.success('Password reset instructions sent!');
    } catch (error: any) {
      message.error(error?.message || 'Failed to send reset instructions');
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <Card className="w-full max-w-md shadow-xl">
          <div className="text-center py-6">
            <CheckCircleOutlined style={{ fontSize: 64, color: '#52c41a' }} />
            <Title level={3} className="mt-4">Check Your Email</Title>
            <Paragraph className="text-gray-600">
              We've sent password reset instructions to:
            </Paragraph>
            <Text strong className="text-lg">{email}</Text>
            <Paragraph className="text-gray-500 mt-4 text-sm">
              If you don't see the email, check your spam folder.
            </Paragraph>
            <div className="mt-6">
              <Link href="/auth/login">
                <Button type="primary" size="large">
                  Return to Login
                </Button>
              </Link>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="w-full max-w-md shadow-xl">
        <div className="text-center mb-6">
          <Title level={2} className="!mb-2">
            <span className="bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
              Forgot Password?
            </span>
          </Title>
          <Text type="secondary">
            Enter your email and we'll send you instructions to reset your password
          </Text>
        </div>

        <Form layout="vertical" onFinish={handleSubmit}>
          <Form.Item
            label="Email Address"
            name="email"
            rules={[
              { required: true, message: 'Please enter your email' },
              { type: 'email', message: 'Please enter a valid email' }
            ]}
          >
            <Input
              prefix={<MailOutlined className="text-gray-400" />}
              placeholder="Enter your email address"
              size="large"
            />
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              size="large"
              block
              loading={loading}
            >
              Send Reset Instructions
            </Button>
          </Form.Item>
        </Form>

        <div className="text-center mt-4">
          <Link href="/auth/login" className="text-blue-600 hover:text-blue-800">
            <ArrowLeftOutlined className="mr-2" />
            Back to Login
          </Link>
        </div>

        <Alert
          message="Demo Mode"
          description="In production, this will send a real password reset email."
          type="info"
          showIcon
          className="mt-6"
        />
      </Card>
    </div>
  );
}
