'use client';

import React from 'react';

import { Card, Form, Input, Button, message } from 'antd';
import { MailOutlined, PhoneOutlined, EnvironmentOutlined } from '@ant-design/icons';

export default function ContactPage() {
  const [form] = Form.useForm();

  const handleSubmit = (values: any) => {
    console.log('Contact form:', values);
    message.success('Message sent successfully!');
    form.resetFields();
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
        <div className="text-center">
          <h1 className="text-4xl font-bold">Contact Us</h1>
          <p className="text-gray-600 mt-2">Get in touch with our team</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <div className="text-center">
              <MailOutlined className="text-4xl text-blue-600 mb-2" />
              <h3 className="font-semibold">Email</h3>
              <p className="text-gray-600">info@kiaanwms.com</p>
            </div>
          </Card>
          <Card>
            <div className="text-center">
              <PhoneOutlined className="text-4xl text-blue-600 mb-2" />
              <h3 className="font-semibold">Phone</h3>
              <p className="text-gray-600">+1 (555) 123-4567</p>
            </div>
          </Card>
          <Card>
            <div className="text-center">
              <EnvironmentOutlined className="text-4xl text-blue-600 mb-2" />
              <h3 className="font-semibold">Address</h3>
              <p className="text-gray-600">123 Business St, NY</p>
            </div>
          </Card>
        </div>

        <Card title="Send us a message">
          <Form form={form} layout="vertical" onFinish={handleSubmit}>
            <Form.Item label="Name" name="name" rules={[{ required: true }]}>
              <Input placeholder="Your name" />
            </Form.Item>
            <Form.Item label="Email" name="email" rules={[{ required: true, type: 'email' }]}>
              <Input placeholder="Your email" />
            </Form.Item>
            <Form.Item label="Subject" name="subject" rules={[{ required: true }]}>
              <Input placeholder="Message subject" />
            </Form.Item>
            <Form.Item label="Message" name="message" rules={[{ required: true }]}>
              <Input.TextArea rows={4} placeholder="Your message" />
            </Form.Item>
            <Form.Item>
              <Button type="primary" htmlType="submit" size="large" block>
                Send Message
              </Button>
            </Form.Item>
          </Form>
        </Card>
      </div>
      );
}
