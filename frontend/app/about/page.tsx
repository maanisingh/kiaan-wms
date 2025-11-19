'use client';

import React from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card } from 'antd';

export default function AboutPage() {
  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="text-center">
          <h1 className="text-4xl font-bold">About Kiaan WMS</h1>
          <p className="text-gray-600 mt-2">Revolutionizing Warehouse Management</p>
        </div>

        <Card>
          <div className="prose max-w-none">
            <h2>Our Mission</h2>
            <p>
              Kiaan WMS is a modern, cloud-based warehouse management system designed to streamline
              your operations and maximize efficiency. We provide comprehensive solutions for
              multi-warehouse management, order fulfillment, and inventory control.
            </p>

            <h2>Features</h2>
            <ul>
              <li>Multi-warehouse management</li>
              <li>Real-time inventory tracking</li>
              <li>Advanced order fulfillment</li>
              <li>Integrated shipping solutions</li>
              <li>Comprehensive reporting and analytics</li>
              <li>E-commerce integrations</li>
            </ul>

            <h2>Why Choose Us</h2>
            <p>
              With years of experience in logistics and technology, we understand the challenges
              of modern warehouse management. Our platform is built to scale with your business
              and adapt to your unique requirements.
            </p>
          </div>
        </Card>
      </div>
    </MainLayout>
  );
}
