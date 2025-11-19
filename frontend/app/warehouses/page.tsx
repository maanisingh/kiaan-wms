'use client';

import React from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, Row, Col, Button, Tag, Progress } from 'antd';
import { PlusOutlined, HomeOutlined, EnvironmentOutlined } from '@ant-design/icons';
import { mockWarehouses } from '@/lib/mockData';
import Link from 'next/link';
import { calculatePercentage } from '@/lib/utils';

export default function WarehousesPage() {
  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Warehouses</h1>
            <p className="text-gray-600 mt-1">Manage your warehouse locations</p>
          </div>
          <Link href="/warehouses/new">
            <Button type="primary" icon={<PlusOutlined />} size="large">
              Add Warehouse
            </Button>
          </Link>
        </div>

        <Row gutter={[16, 16]}>
          {mockWarehouses.map(warehouse => {
            const utilizationPercent = calculatePercentage(warehouse.capacity.used, warehouse.capacity.total);

            return (
              <Col key={warehouse.id} xs={24} sm={12} lg={8}>
                <Card
                  hoverable
                  className="h-full"
                  title={
                    <div className="flex items-center gap-2">
                      <HomeOutlined className="text-blue-600" />
                      <span>{warehouse.name}</span>
                    </div>
                  }
                  extra={<Tag color="green">{warehouse.status}</Tag>}
                >
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm text-gray-500">Code</p>
                      <p className="font-semibold">{warehouse.code}</p>
                    </div>

                    <div>
                      <p className="text-sm text-gray-500 mb-1">
                        <EnvironmentOutlined /> Location
                      </p>
                      <p className="text-sm">{warehouse.address.city}, {warehouse.address.state}</p>
                    </div>

                    <div>
                      <p className="text-sm text-gray-500 mb-2">Capacity Utilization</p>
                      <Progress percent={utilizationPercent} status={utilizationPercent > 80 ? 'exception' : 'active'} />
                      <p className="text-xs text-gray-500 mt-1">
                        {warehouse.capacity.used.toLocaleString()} / {warehouse.capacity.total.toLocaleString()} {warehouse.capacity.unit}
                      </p>
                    </div>

                    <div>
                      <Tag color="blue">{warehouse.type}</Tag>
                    </div>

                    <Link href={`/warehouses/${warehouse.id}`}>
                      <Button type="primary" block>
                        View Details
                      </Button>
                    </Link>
                  </div>
                </Card>
              </Col>
            );
          })}
        </Row>
      </div>
    </MainLayout>
  );
}
