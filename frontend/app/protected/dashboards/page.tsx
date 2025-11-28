'use client';

import React from 'react';
import { Card, Row, Col } from 'antd';
import { UserOutlined, InboxOutlined, CarOutlined, TeamOutlined } from '@ant-design/icons';
import Link from 'next/link';

export default function DashboardsPage() {
  const dashboards = [
    {
      title: 'Manager Dashboard',
      description: 'Overview of all warehouse operations',
      icon: <UserOutlined style={{ fontSize: 48, color: '#1890ff' }} />,
      href: '/protected/dashboards/manager',
    },
    {
      title: 'Picker Dashboard',
      description: 'Pick lists and picking performance',
      icon: <InboxOutlined style={{ fontSize: 48, color: '#52c41a' }} />,
      href: '/protected/dashboards/picker',
    },
    {
      title: 'Packer Dashboard',
      description: 'Packing tasks and shipment status',
      icon: <CarOutlined style={{ fontSize: 48, color: '#722ed1' }} />,
      href: '/protected/dashboards/packer',
    },
    {
      title: 'Warehouse Staff',
      description: 'Daily tasks and inventory management',
      icon: <TeamOutlined style={{ fontSize: 48, color: '#fa8c16' }} />,
      href: '/protected/dashboards/warehouse-staff',
    },
  ];

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Role-Based Dashboards</h1>
      <Row gutter={[16, 16]}>
        {dashboards.map((dashboard, index) => (
          <Col xs={24} sm={12} lg={6} key={index}>
            <Link href={dashboard.href}>
              <Card hoverable className="text-center h-full">
                <div className="py-4">{dashboard.icon}</div>
                <h3 className="text-lg font-semibold">{dashboard.title}</h3>
                <p className="text-gray-500">{dashboard.description}</p>
              </Card>
            </Link>
          </Col>
        ))}
      </Row>
    </div>
  );
}
