'use client';

import React from 'react';
import { Form, Input, Button, Card, Checkbox, message, Tag, Divider } from 'antd';
import { UserOutlined, LockOutlined, BoxPlotOutlined, CrownOutlined, TeamOutlined, InboxOutlined, ShoppingOutlined } from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import Link from 'next/link';
import { APP_NAME } from '@/lib/constants';

// Quick login users - Real backend accounts
const DEMO_USERS = [
  { email: 'admin@kiaan-wms.com', password: 'Admin@123', role: 'SUPER_ADMIN', name: 'Super Admin', icon: <CrownOutlined />, color: 'gold' },
  { email: 'companyadmin@kiaan-wms.com', password: 'Admin@123', role: 'COMPANY_ADMIN', name: 'Company Admin', icon: <TeamOutlined />, color: 'blue' },
  { email: 'warehousemanager@kiaan-wms.com', password: 'Admin@123', role: 'WAREHOUSE_MGR', name: 'Warehouse Manager', icon: <BoxPlotOutlined />, color: 'green' },
  { email: 'picker@kiaan-wms.com', password: 'Admin@123', role: 'PICKER', name: 'Picker', icon: <InboxOutlined />, color: 'orange' },
  { email: 'viewer@kiaan-wms.com', password: 'Admin@123', role: 'VIEWER', name: 'Viewer', icon: <ShoppingOutlined />, color: 'purple' },
];

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuthStore();
  const [loading, setLoading] = React.useState(false);
  const [quickLoginLoading, setQuickLoginLoading] = React.useState<string | null>(null);

  const onFinish = async (values: { email: string; password: string; remember: boolean }) => {
    setLoading(true);
    try {
      await login(values.email, values.password);
      message.success('Login successful!');
      router.push('/dashboard');
    } catch (error) {
      message.error('Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = async (user: typeof DEMO_USERS[0]) => {
    setQuickLoginLoading(user.email);
    try {
      await login(user.email, user.password);
      message.success(`Logged in as ${user.name}!`);
      router.push('/dashboard');
    } catch (error) {
      message.error('Quick login failed.');
    } finally {
      setQuickLoginLoading(null);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md shadow-2xl">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center">
              <BoxPlotOutlined className="text-3xl text-white" />
            </div>
          </div>
          <h2 className="text-3xl font-bold text-gray-900">{APP_NAME}</h2>
          <p className="mt-2 text-sm text-gray-600">
            Sign in to your account to continue
          </p>
        </div>

        <Form
          name="login"
          initialValues={{ remember: true }}
          onFinish={onFinish}
          layout="vertical"
          size="large"
        >
          <Form.Item
            name="email"
            label="Email"
            rules={[
              { required: true, message: 'Please input your email!' },
              { type: 'email', message: 'Please enter a valid email!' },
            ]}
          >
            <Input
              prefix={<UserOutlined className="text-gray-400" />}
              placeholder="admin@example.com"
              data-testid="email-input"
              type="email"
            />
          </Form.Item>

          <Form.Item
            name="password"
            label="Password"
            rules={[{ required: true, message: 'Please input your password!' }]}
          >
            <Input.Password
              prefix={<LockOutlined className="text-gray-400" />}
              placeholder="Enter your password"
              data-testid="password-input"
            />
          </Form.Item>

          <div className="flex items-center justify-between mb-6">
            <Form.Item name="remember" valuePropName="checked" noStyle>
              <Checkbox>Remember me</Checkbox>
            </Form.Item>

            <Link href="/auth/forgot-password" className="text-sm text-blue-600 hover:text-blue-800">
              Forgot password?
            </Link>
          </div>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              block
              loading={loading}
              className="h-12 text-base font-medium"
              data-testid="login-submit-button"
            >
              Sign In
            </Button>
          </Form.Item>

          <div className="text-center mt-4">
            <span className="text-gray-600">Don't have an account? </span>
            <Link href="/auth/register" className="text-blue-600 hover:text-blue-800 font-medium">
              Register here
            </Link>
          </div>
        </Form>

        <Divider className="my-6">Quick Login (Demo)</Divider>

        <div className="space-y-2">
          <p className="text-xs text-center text-gray-600 mb-3">Click any role to auto-login:</p>
          {DEMO_USERS.map((user) => (
            <Button
              key={user.email}
              block
              size="middle"
              icon={user.icon}
              loading={quickLoginLoading === user.email}
              onClick={() => handleQuickLogin(user)}
              className="flex items-center justify-between"
              data-testid={`quick-login-${user.role.toLowerCase()}`}
            >
              <span>{user.name}</span>
              <Tag color={user.color}>{user.role.replace('_', ' ').toUpperCase()}</Tag>
            </Button>
          ))}
        </div>

        <div className="mt-6 pt-4 border-t border-gray-200">
          <p className="text-xs text-center text-gray-500">
            🔐 Click above to login instantly • Password: <strong>Admin@123</strong>
          </p>
        </div>
      </Card>
    </div>
  );
}
