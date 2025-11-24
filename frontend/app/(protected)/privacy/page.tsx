'use client';

import React from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card } from 'antd';

export default function PrivacyPage() {
  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="text-center">
          <h1 className="text-4xl font-bold">Privacy Policy</h1>
          <p className="text-gray-600 mt-2">Last updated: November 2024</p>
        </div>

        <Card>
          <div className="prose max-w-none">
            <h2>Introduction</h2>
            <p>
              This Privacy Policy describes how Kiaan WMS collects, uses, and protects your personal
              information when you use our services.
            </p>

            <h2>Information We Collect</h2>
            <p>We collect information that you provide directly to us, including:</p>
            <ul>
              <li>Account information (name, email, company details)</li>
              <li>Warehouse and inventory data</li>
              <li>Order and shipment information</li>
              <li>Usage data and analytics</li>
            </ul>

            <h2>How We Use Your Information</h2>
            <p>We use the collected information to:</p>
            <ul>
              <li>Provide and improve our services</li>
              <li>Process transactions and manage your account</li>
              <li>Send you updates and notifications</li>
              <li>Analyze usage patterns and optimize performance</li>
            </ul>

            <h2>Data Security</h2>
            <p>
              We implement industry-standard security measures to protect your data. All data is
              encrypted in transit and at rest. We regularly audit our security practices and
              comply with relevant data protection regulations.
            </p>

            <h2>Contact Us</h2>
            <p>
              If you have questions about this Privacy Policy, please contact us at
              privacy@kiaanwms.com
            </p>
          </div>
        </Card>
      </div>
    </MainLayout>
  );
}
