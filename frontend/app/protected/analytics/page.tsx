'use client';

import React from 'react';
import { Card, Row, Col } from 'antd';
import { BarChartOutlined, DollarOutlined, LineChartOutlined } from '@ant-design/icons';
import Link from 'next/link';

export default function AnalyticsPage() {
  const analyticsModules = [
    {
      title: 'Channel Analytics',
      description: 'Sales performance across different channels',
      icon: <BarChartOutlined style={{ fontSize: 48, color: '#1890ff' }} />,
      href: '/protected/analytics/channels',
    },
    {
      title: 'Margin Analysis',
      description: 'Profit margins and cost analysis',
      icon: <DollarOutlined style={{ fontSize: 48, color: '#52c41a' }} />,
      href: '/protected/analytics/margins',
    },
    {
      title: 'Price Optimizer',
      description: 'Dynamic pricing recommendations',
      icon: <LineChartOutlined style={{ fontSize: 48, color: '#722ed1' }} />,
      href: '/protected/analytics/optimizer',
    },
  ];

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Analytics</h1>
      <Row gutter={[16, 16]}>
        {analyticsModules.map((module, index) => (
          <Col xs={24} sm={12} lg={8} key={index}>
            <Link href={module.href}>
              <Card hoverable className="text-center h-full">
                <div className="py-4">{module.icon}</div>
                <h3 className="text-lg font-semibold">{module.title}</h3>
                <p className="text-gray-500">{module.description}</p>
              </Card>
            </Link>
          </Col>
        ))}
      </Row>
    </div>
  );
}
