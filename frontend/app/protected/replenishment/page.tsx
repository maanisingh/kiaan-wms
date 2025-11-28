'use client';

import React from 'react';
import { Card, Row, Col } from 'antd';
import { SyncOutlined, SettingOutlined } from '@ant-design/icons';
import Link from 'next/link';

export default function ReplenishmentPage() {
  const modules = [
    {
      title: 'Replenishment Tasks',
      description: 'View and manage stock replenishment tasks',
      icon: <SyncOutlined style={{ fontSize: 48, color: '#1890ff' }} />,
      href: '/protected/replenishment/tasks',
    },
    {
      title: 'Replenishment Settings',
      description: 'Configure replenishment rules and thresholds',
      icon: <SettingOutlined style={{ fontSize: 48, color: '#52c41a' }} />,
      href: '/protected/replenishment/settings',
    },
  ];

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Replenishment</h1>
      <Row gutter={[16, 16]}>
        {modules.map((module, index) => (
          <Col xs={24} sm={12} key={index}>
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
