'use client';

import React from 'react';
import { Result, Button } from 'antd';
import { useRouter } from 'next/navigation';
import { LockOutlined } from '@ant-design/icons';

export default function UnauthorizedPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Result
        status="403"
        icon={<LockOutlined style={{ fontSize: 72, color: '#ff4d4f' }} />}
        title="Access Denied"
        subTitle="Sorry, you don't have permission to access this page."
        extra={[
          <Button type="primary" key="dashboard" onClick={() => router.push('/dashboard')}>
            Go to Dashboard
          </Button>,
          <Button key="back" onClick={() => router.back()}>
            Go Back
          </Button>,
        ]}
      />
    </div>
  );
}
