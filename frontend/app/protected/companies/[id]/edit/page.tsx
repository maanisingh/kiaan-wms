'use client';

import React, { useState, useEffect } from 'react';
import { Card, Form, Input, Button, Spin, message } from 'antd';
import { ArrowLeftOutlined, SaveOutlined } from '@ant-design/icons';
import { useParams, useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';

interface Company {
  id: string;
  name: string;
  code: string;
  description?: string;
  address?: string;
  phone?: string;
  email?: string;
}

export default function EditCompanyPage() {
  const params = useParams();
  const router = useRouter();
  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form] = Form.useForm();
  const { token } = useAuthStore();

  // Ensure API URL doesn't have duplicate /api prefix
  const rawApiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://wms-api.alexandratechlab.com';
  const API_URL = rawApiUrl.endsWith('/api') ? rawApiUrl.replace(/\/api$/, '') : rawApiUrl;

  useEffect(() => {
    const fetchCompany = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${API_URL}/api/companies/${params.id}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) {
          throw new Error('Company not found');
        }

        const data = await response.json();
        setCompany(data);
        form.setFieldsValue(data);
      } catch (error) {
        console.error('Error fetching company:', error);
        message.error('Failed to load company details');
      } finally {
        setLoading(false);
      }
    };

    if (token && params.id) {
      fetchCompany();
    }
  }, [token, params.id]);

  const handleSubmit = async (values: any) => {
    try {
      setSaving(true);
      const response = await fetch(`${API_URL}/api/companies/${params.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(values)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update company');
      }

      message.success('Company updated successfully!');
      router.push(`/protected/companies/${params.id}`);
    } catch (error: any) {
      message.error(error.message || 'Failed to update company');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <Spin size="large" tip="Loading company..." />
      </div>
    );
  }

  if (!company) {
    return (
      <div className="text-center py-20">
        <h2 className="text-xl text-gray-500">Company not found</h2>
        <Button type="primary" className="mt-4" onClick={() => router.push('/protected/companies')}>
          Back to Companies
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button icon={<ArrowLeftOutlined />} onClick={() => router.push(`/protected/companies/${params.id}`)}>
          Back
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Edit Company</h1>
          <p className="text-gray-500">Update company information</p>
        </div>
      </div>

      <Card>
        <Form form={form} layout="vertical" onFinish={handleSubmit} className="max-w-2xl">
          <Form.Item
            label="Company Name"
            name="name"
            rules={[{ required: true, message: 'Please enter company name' }]}
          >
            <Input placeholder="Enter company name" size="large" />
          </Form.Item>

          <Form.Item
            label="Company Code"
            name="code"
            rules={[{ required: true, message: 'Please enter company code' }]}
          >
            <Input placeholder="Enter unique company code" size="large" disabled />
          </Form.Item>

          <Form.Item label="Description" name="description">
            <Input.TextArea placeholder="Company description" rows={3} />
          </Form.Item>

          <Form.Item label="Address" name="address">
            <Input.TextArea placeholder="Company address" rows={2} />
          </Form.Item>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Form.Item label="Phone" name="phone">
              <Input placeholder="Phone number" size="large" />
            </Form.Item>
            <Form.Item label="Email" name="email">
              <Input placeholder="Email address" type="email" size="large" />
            </Form.Item>
          </div>

          <div className="flex gap-4 pt-4">
            <Button
              type="primary"
              htmlType="submit"
              icon={<SaveOutlined />}
              loading={saving}
              size="large"
            >
              Save Changes
            </Button>
            <Button
              size="large"
              onClick={() => router.push(`/protected/companies/${params.id}`)}
            >
              Cancel
            </Button>
          </div>
        </Form>
      </Card>
    </div>
  );
}
