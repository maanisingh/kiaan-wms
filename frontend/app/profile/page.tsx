'use client';

import React, { useState } from 'react';
import { Card, Form, Input, Button, message, Descriptions, Tag, Divider, Typography, Avatar, Space } from 'antd';
import { UserOutlined, MailOutlined, PhoneOutlined, LockOutlined, CrownOutlined, CalendarOutlined, IdcardOutlined } from '@ant-design/icons';
import { useAuthStore } from '@/store/authStore';
import { APP_NAME } from '@/lib/constants';

const { Title, Text } = Typography;

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8010';

export default function ProfilePage() {
  const { user, token, setUser } = useAuthStore();
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [loadingPassword, setLoadingPassword] = useState(false);
  const [profileForm] = Form.useForm();
  const [passwordForm] = Form.useForm();

  // Initialize form with user data
  React.useEffect(() => {
    if (user) {
      profileForm.setFieldsValue({
        name: user.name,
        email: user.email,
        phone: user.phone || '',
      });
    }
  }, [user, profileForm]);

  const handleUpdateProfile = async (values: { name: string; email: string; phone: string }) => {
    setLoadingProfile(true);
    try {
      const response = await fetch(`${API_URL}/api/auth/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(values),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update profile');
      }

      // Update user in store
      setUser({
        ...user!,
        name: data.user.name,
        email: data.user.email,
        phone: data.user.phone,
      });

      message.success('Profile updated successfully!');
    } catch (error: any) {
      message.error(error.message || 'Failed to update profile');
    } finally {
      setLoadingProfile(false);
    }
  };

  const handleChangePassword = async (values: { currentPassword: string; newPassword: string }) => {
    setLoadingPassword(true);
    try {
      const response = await fetch(`${API_URL}/api/auth/change-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          currentPassword: values.currentPassword,
          newPassword: values.newPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to change password');
      }

      message.success('Password changed successfully!');
      passwordForm.resetFields();
    } catch (error: any) {
      message.error(error.message || 'Failed to change password');
    } finally {
      setLoadingPassword(false);
    }
  };

  const validateConfirmPassword = (_: any, value: string) => {
    if (!value) {
      return Promise.reject(new Error('Please confirm your new password!'));
    }
    if (value !== passwordForm.getFieldValue('newPassword')) {
      return Promise.reject(new Error('Passwords do not match!'));
    }
    return Promise.resolve();
  };

  const getRoleColor = (role: string) => {
    const colors: Record<string, string> = {
      'super_admin': 'gold',
      'company_admin': 'blue',
      'warehouse_manager': 'green',
      'inventory_manager': 'purple',
      'admin': 'red',
      'manager': 'cyan',
      'picker': 'orange',
      'packer': 'magenta',
      'warehouse_staff': 'geekblue',
      'viewer': 'default',
    };
    return colors[role] || 'default';
  };

  const formatRole = (role: string) => {
    return role.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  const formatDate = (date: string | undefined) => {
    if (!date) return 'Never';
    return new Date(date).toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (!user) {
    return (
      <div className="p-6">
        <Card>
          <Text>Please log in to view your profile.</Text>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <Title level={2} className="mb-6">
        <UserOutlined className="mr-2" />
        My Profile
      </Title>

      {/* User Information Card */}
      <Card className="mb-6 shadow-md">
        <div className="flex items-start gap-6">
          <Avatar
            size={100}
            icon={<UserOutlined />}
            className="bg-blue-500"
            src={user.avatar}
          />
          <div className="flex-1">
            <Space direction="vertical" size="small" className="w-full">
              <div>
                <Title level={3} className="mb-0">{user.name}</Title>
                <Text type="secondary">{user.email}</Text>
              </div>
              <div className="flex gap-2 flex-wrap">
                <Tag color={getRoleColor(user.role)} icon={<CrownOutlined />}>
                  {formatRole(user.role)}
                </Tag>
                <Tag color={user.status === 'active' ? 'green' : 'red'}>
                  {user.status.toUpperCase()}
                </Tag>
              </div>
            </Space>
          </div>
        </div>

        <Divider />

        <Descriptions bordered column={{ xxl: 2, xl: 2, lg: 2, md: 1, sm: 1, xs: 1 }}>
          <Descriptions.Item label={<><IdcardOutlined /> User ID</>}>
            <Text copyable>{user.id}</Text>
          </Descriptions.Item>
          <Descriptions.Item label={<><MailOutlined /> Email</>}>
            {user.email}
          </Descriptions.Item>
          <Descriptions.Item label={<><PhoneOutlined /> Phone</>}>
            {user.phone || 'Not provided'}
          </Descriptions.Item>
          <Descriptions.Item label={<><CrownOutlined /> Role</>}>
            <Tag color={getRoleColor(user.role)}>{formatRole(user.role)}</Tag>
          </Descriptions.Item>
          <Descriptions.Item label={<><CalendarOutlined /> Member Since</>}>
            {formatDate(user.createdAt)}
          </Descriptions.Item>
          <Descriptions.Item label={<><CalendarOutlined /> Last Login</>}>
            {formatDate(user.lastLogin)}
          </Descriptions.Item>
        </Descriptions>
      </Card>

      {/* Edit Profile Card */}
      <Card title="Edit Profile" className="mb-6 shadow-md">
        <Form
          form={profileForm}
          layout="vertical"
          onFinish={handleUpdateProfile}
          size="large"
        >
          <Form.Item
            name="name"
            label="Full Name"
            rules={[
              { required: true, message: 'Please enter your name!' },
              { min: 2, message: 'Name must be at least 2 characters!' },
            ]}
          >
            <Input prefix={<UserOutlined />} placeholder="Your full name" />
          </Form.Item>

          <Form.Item
            name="email"
            label="Email Address"
            rules={[
              { required: true, message: 'Please enter your email!' },
              { type: 'email', message: 'Please enter a valid email!' },
            ]}
          >
            <Input prefix={<MailOutlined />} placeholder="your.email@example.com" />
          </Form.Item>

          <Form.Item
            name="phone"
            label="Phone Number"
            rules={[
              { pattern: /^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,9}$/, message: 'Please enter a valid phone number!' },
            ]}
          >
            <Input prefix={<PhoneOutlined />} placeholder="+1 234 567 8900" />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loadingProfile} size="large">
              Update Profile
            </Button>
          </Form.Item>
        </Form>
      </Card>

      {/* Change Password Card */}
      <Card title="Change Password" className="shadow-md">
        <Form
          form={passwordForm}
          layout="vertical"
          onFinish={handleChangePassword}
          size="large"
        >
          <Form.Item
            name="currentPassword"
            label="Current Password"
            rules={[{ required: true, message: 'Please enter your current password!' }]}
          >
            <Input.Password prefix={<LockOutlined />} placeholder="Enter current password" />
          </Form.Item>

          <Form.Item
            name="newPassword"
            label="New Password"
            rules={[
              { required: true, message: 'Please enter a new password!' },
              { min: 8, message: 'Password must be at least 8 characters!' },
              {
                pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
                message: 'Password must include uppercase, lowercase, number, and special character!',
              },
            ]}
            hasFeedback
          >
            <Input.Password prefix={<LockOutlined />} placeholder="Enter new password" />
          </Form.Item>

          <Form.Item
            name="confirmPassword"
            label="Confirm New Password"
            dependencies={['newPassword']}
            rules={[{ validator: validateConfirmPassword }]}
            hasFeedback
          >
            <Input.Password prefix={<LockOutlined />} placeholder="Confirm new password" />
          </Form.Item>

          <div className="mb-4">
            <Text type="secondary" className="text-xs">
              Password requirements: At least 8 characters with uppercase, lowercase, number, and special character.
            </Text>
          </div>

          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loadingPassword} size="large" danger>
              Change Password
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
}
