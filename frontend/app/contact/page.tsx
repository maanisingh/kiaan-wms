'use client';

import React from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import {
  BoxPlotOutlined,
  ArrowLeftOutlined,
  MailOutlined,
  PhoneOutlined,
  EnvironmentOutlined,
  ClockCircleOutlined
} from '@ant-design/icons';
import { Button, Form, Input, message } from 'antd';

export default function ContactPage() {
  const [form] = Form.useForm();

  const handleSubmit = (values: any) => {
    console.log('Contact form:', values);
    message.success('Message sent successfully! We\'ll get back to you soon.');
    form.resetFields();
  };

  const contactInfo = [
    { icon: <MailOutlined className="text-3xl" />, title: 'Email', value: 'info@kiaanwms.com', link: 'mailto:info@kiaanwms.com' },
    { icon: <PhoneOutlined className="text-3xl" />, title: 'Phone', value: '+1 (555) 123-4567', link: 'tel:+15551234567' },
    { icon: <EnvironmentOutlined className="text-3xl" />, title: 'Address', value: '123 Innovation Drive, San Francisco, CA 94105', link: null },
    { icon: <ClockCircleOutlined className="text-3xl" />, title: 'Hours', value: 'Mon-Fri: 9AM - 6PM PST', link: null },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-cyan-50">
      {/* Navigation */}
      <nav className="bg-white/80 backdrop-blur-xl border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-blue-600 to-cyan-600">
              <BoxPlotOutlined className="text-2xl text-white" />
            </div>
            <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
              Kiaan WMS
            </span>
          </Link>
          <Link href="/">
            <Button icon={<ArrowLeftOutlined />}>Back to Home</Button>
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="py-20 px-6">
        <div className="max-w-7xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-cyan-600 to-blue-600 bg-clip-text text-transparent">
              Get in Touch
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Have questions about Kiaan WMS? We'd love to hear from you.
              Our team is ready to help you transform your warehouse operations.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Contact Info Cards */}
      <section className="py-8 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-6">
            {contactInfo.map((info, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="bg-white rounded-2xl p-6 shadow-lg text-center"
              >
                <div className="w-16 h-16 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl flex items-center justify-center text-white mx-auto mb-4">
                  {info.icon}
                </div>
                <h3 className="text-lg font-bold mb-2 text-gray-800">{info.title}</h3>
                {info.link ? (
                  <a href={info.link} className="text-cyan-600 hover:text-cyan-700 hover:underline">
                    {info.value}
                  </a>
                ) : (
                  <p className="text-gray-600">{info.value}</p>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Form Section */}
      <section className="py-16 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12">
            {/* Form */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="bg-white rounded-2xl p-8 shadow-lg"
            >
              <h2 className="text-2xl font-bold mb-6 text-gray-800">Send us a Message</h2>
              <Form form={form} layout="vertical" onFinish={handleSubmit}>
                <Form.Item
                  label="Name"
                  name="name"
                  rules={[{ required: true, message: 'Please enter your name' }]}
                >
                  <Input size="large" placeholder="Your name" />
                </Form.Item>
                <Form.Item
                  label="Email"
                  name="email"
                  rules={[
                    { required: true, message: 'Please enter your email' },
                    { type: 'email', message: 'Please enter a valid email' }
                  ]}
                >
                  <Input size="large" placeholder="your@email.com" />
                </Form.Item>
                <Form.Item
                  label="Company"
                  name="company"
                >
                  <Input size="large" placeholder="Your company (optional)" />
                </Form.Item>
                <Form.Item
                  label="Subject"
                  name="subject"
                  rules={[{ required: true, message: 'Please enter a subject' }]}
                >
                  <Input size="large" placeholder="How can we help?" />
                </Form.Item>
                <Form.Item
                  label="Message"
                  name="message"
                  rules={[{ required: true, message: 'Please enter your message' }]}
                >
                  <Input.TextArea rows={4} placeholder="Tell us more about your needs..." />
                </Form.Item>
                <Form.Item>
                  <Button
                    type="primary"
                    htmlType="submit"
                    size="large"
                    block
                    className="h-12 bg-gradient-to-r from-cyan-500 to-blue-600 border-none"
                  >
                    Send Message
                  </Button>
                </Form.Item>
              </Form>
            </motion.div>

            {/* Info */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="flex flex-col justify-center"
            >
              <h2 className="text-3xl font-bold mb-6 text-gray-800">Let's Talk</h2>
              <p className="text-gray-600 mb-6 leading-relaxed">
                Whether you're looking to streamline your warehouse operations, need help
                with implementation, or want to learn more about our features, we're here to help.
              </p>
              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-cyan-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <MailOutlined className="text-cyan-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-800">Sales Inquiries</h4>
                    <p className="text-gray-600">sales@kiaanwms.com</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-cyan-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <MailOutlined className="text-cyan-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-800">Technical Support</h4>
                    <p className="text-gray-600">support@kiaanwms.com</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-cyan-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <MailOutlined className="text-cyan-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-800">Partnerships</h4>
                    <p className="text-gray-600">partners@kiaanwms.com</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8 px-6">
        <div className="max-w-7xl mx-auto text-center text-gray-400">
          <p>&copy; 2024 Kiaan WMS. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
