'use client';

import React from 'react';
import { Card, Typography, Row, Col, Statistic, Timeline, Tag, Divider, Button } from 'antd';
import {
  RocketOutlined, SafetyOutlined, TeamOutlined, GlobalOutlined,
  CheckCircleOutlined, ClockCircleOutlined, CodeOutlined, CloudServerOutlined,
  ArrowLeftOutlined
} from '@ant-design/icons';
import { useRouter } from 'next/navigation';

const { Title, Paragraph, Text } = Typography;

export default function AboutPage() {
  const router = useRouter();

  const features = [
    {
      icon: <SafetyOutlined style={{ fontSize: 32, color: '#1890ff' }} />,
      title: 'Secure & Reliable',
      description: 'Enterprise-grade security with role-based access control and encrypted data storage.'
    },
    {
      icon: <CloudServerOutlined style={{ fontSize: 32, color: '#52c41a' }} />,
      title: 'Cloud-Native',
      description: 'Built for the cloud with automatic scaling and high availability.'
    },
    {
      icon: <GlobalOutlined style={{ fontSize: 32, color: '#722ed1' }} />,
      title: 'Multi-Location',
      description: 'Manage inventory across multiple warehouses and locations seamlessly.'
    },
    {
      icon: <CodeOutlined style={{ fontSize: 32, color: '#fa8c16' }} />,
      title: 'Modern Technology',
      description: 'Built with Next.js, React, and Node.js for optimal performance.'
    },
  ];

  const roadmap = [
    {
      status: 'completed',
      title: 'Core WMS Features',
      description: 'Product management, inventory tracking, order processing',
      date: 'Q4 2024'
    },
    {
      status: 'completed',
      title: 'Best-Before Date Tracking',
      description: 'FEFO picking, expiry alerts, lot management',
      date: 'Q4 2024'
    },
    {
      status: 'in-progress',
      title: 'Goods Receiving Module',
      description: 'Full GRN workflow with variance tracking',
      date: 'Q1 2025'
    },
    {
      status: 'planned',
      title: 'Mobile App',
      description: 'Barcode scanning, mobile picking, real-time updates',
      date: 'Q2 2025'
    },
    {
      status: 'planned',
      title: 'Advanced Analytics',
      description: 'AI-powered demand forecasting and inventory optimization',
      date: 'Q3 2025'
    },
  ];

  return (
    <div className="p-6 space-y-8">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button icon={<ArrowLeftOutlined />} onClick={() => router.back()}>
          Back
        </Button>
        <div>
          <Title level={2} className="!mb-0">
            <span className="bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
              About Kiaan WMS
            </span>
          </Title>
          <Text type="secondary">Warehouse Management System</Text>
        </div>
      </div>

      {/* Hero Section */}
      <Card className="bg-gradient-to-r from-blue-50 to-cyan-50">
        <Row gutter={[32, 32]} align="middle">
          <Col xs={24} md={14}>
            <Title level={3}>
              Modern Warehouse Management for Growing Businesses
            </Title>
            <Paragraph className="text-lg text-gray-600">
              Kiaan WMS is a comprehensive warehouse management solution designed to streamline
              your inventory operations. From receiving goods to fulfilling orders, we help you
              manage every aspect of your warehouse with precision and efficiency.
            </Paragraph>
            <Paragraph className="text-gray-600">
              Built with modern technology and best practices, Kiaan WMS provides real-time
              visibility into your inventory, supports FEFO (First-Expiry, First-Out) picking
              for perishable goods, and integrates seamlessly with your existing business processes.
            </Paragraph>
          </Col>
          <Col xs={24} md={10}>
            <Row gutter={[16, 16]}>
              <Col span={12}>
                <Card>
                  <Statistic
                    title="Products Managed"
                    value={10000}
                    prefix={<RocketOutlined />}
                    suffix="+"
                  />
                </Card>
              </Col>
              <Col span={12}>
                <Card>
                  <Statistic
                    title="Orders Processed"
                    value={50000}
                    prefix={<CheckCircleOutlined />}
                    suffix="+"
                  />
                </Card>
              </Col>
              <Col span={12}>
                <Card>
                  <Statistic
                    title="Warehouses"
                    value={100}
                    prefix={<GlobalOutlined />}
                    suffix="+"
                  />
                </Card>
              </Col>
              <Col span={12}>
                <Card>
                  <Statistic
                    title="Users"
                    value={1000}
                    prefix={<TeamOutlined />}
                    suffix="+"
                  />
                </Card>
              </Col>
            </Row>
          </Col>
        </Row>
      </Card>

      {/* Features Section */}
      <div>
        <Title level={3} className="text-center mb-6">Key Features</Title>
        <Row gutter={[24, 24]}>
          {features.map((feature, index) => (
            <Col xs={24} sm={12} md={6} key={index}>
              <Card className="h-full text-center hover:shadow-lg transition-shadow">
                <div className="mb-4">{feature.icon}</div>
                <Title level={5}>{feature.title}</Title>
                <Text type="secondary">{feature.description}</Text>
              </Card>
            </Col>
          ))}
        </Row>
      </div>

      {/* Capabilities Section */}
      <Card>
        <Title level={3}>What You Can Do</Title>
        <Row gutter={[32, 16]}>
          <Col xs={24} md={12}>
            <ul className="space-y-3">
              <li className="flex items-start gap-2">
                <CheckCircleOutlined className="text-green-500 mt-1" />
                <span>Manage products with full details including SKU, barcode, pricing</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircleOutlined className="text-green-500 mt-1" />
                <span>Track inventory across multiple warehouses and locations</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircleOutlined className="text-green-500 mt-1" />
                <span>Process goods receiving with lot numbers and best-before dates</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircleOutlined className="text-green-500 mt-1" />
                <span>Create and manage sales orders with picking workflows</span>
              </li>
            </ul>
          </Col>
          <Col xs={24} md={12}>
            <ul className="space-y-3">
              <li className="flex items-start gap-2">
                <CheckCircleOutlined className="text-green-500 mt-1" />
                <span>Set up product bundles and kits for efficient order fulfillment</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircleOutlined className="text-green-500 mt-1" />
                <span>Monitor expiring stock with FEFO picking recommendations</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircleOutlined className="text-green-500 mt-1" />
                <span>Generate reports and analytics for inventory insights</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircleOutlined className="text-green-500 mt-1" />
                <span>Import/export data via Excel for bulk operations</span>
              </li>
            </ul>
          </Col>
        </Row>
      </Card>

      {/* Roadmap Section */}
      <Card>
        <Title level={3}>Product Roadmap</Title>
        <Timeline
          mode="left"
          items={roadmap.map(item => ({
            color: item.status === 'completed' ? 'green' : item.status === 'in-progress' ? 'blue' : 'gray',
            children: (
              <div className="pb-4">
                <div className="flex items-center gap-2 mb-1">
                  <Text strong>{item.title}</Text>
                  <Tag color={
                    item.status === 'completed' ? 'green' :
                    item.status === 'in-progress' ? 'blue' : 'default'
                  }>
                    {item.status === 'completed' ? 'Completed' :
                     item.status === 'in-progress' ? 'In Progress' : 'Planned'}
                  </Tag>
                </div>
                <Text type="secondary">{item.description}</Text>
                <div className="mt-1">
                  <Text type="secondary" className="text-xs">{item.date}</Text>
                </div>
              </div>
            ),
          }))}
        />
      </Card>

      {/* Tech Stack Section */}
      <Card>
        <Title level={3}>Technology Stack</Title>
        <Row gutter={[16, 16]}>
          <Col xs={12} sm={8} md={4}>
            <Card size="small" className="text-center">
              <Text strong>Next.js 14</Text>
              <div><Text type="secondary">Frontend</Text></div>
            </Card>
          </Col>
          <Col xs={12} sm={8} md={4}>
            <Card size="small" className="text-center">
              <Text strong>React 18</Text>
              <div><Text type="secondary">UI Library</Text></div>
            </Card>
          </Col>
          <Col xs={12} sm={8} md={4}>
            <Card size="small" className="text-center">
              <Text strong>Node.js</Text>
              <div><Text type="secondary">Backend</Text></div>
            </Card>
          </Col>
          <Col xs={12} sm={8} md={4}>
            <Card size="small" className="text-center">
              <Text strong>PostgreSQL</Text>
              <div><Text type="secondary">Database</Text></div>
            </Card>
          </Col>
          <Col xs={12} sm={8} md={4}>
            <Card size="small" className="text-center">
              <Text strong>Prisma</Text>
              <div><Text type="secondary">ORM</Text></div>
            </Card>
          </Col>
          <Col xs={12} sm={8} md={4}>
            <Card size="small" className="text-center">
              <Text strong>Railway</Text>
              <div><Text type="secondary">Hosting</Text></div>
            </Card>
          </Col>
        </Row>
      </Card>

      {/* Footer */}
      <Card className="text-center bg-gray-50">
        <Title level={4}>Need Help?</Title>
        <Paragraph type="secondary">
          Contact our support team or check out the documentation for assistance.
        </Paragraph>
        <Text type="secondary">Version 1.0.0 | Built with love by the Kiaan Team</Text>
      </Card>
    </div>
  );
}
