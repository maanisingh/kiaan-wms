'use client';

import React from 'react';
import { Card } from 'antd';
import { ArrowUpOutlined, ArrowDownOutlined, MinusOutlined } from '@ant-design/icons';
import { cn, formatNumber } from '@/lib/utils';

interface KPICardProps {
  title: string;
  value: string | number;
  change?: number;
  trend?: 'up' | 'down' | 'stable';
  icon?: React.ReactNode;
  suffix?: string;
  loading?: boolean;
  className?: string;
}

export const KPICard: React.FC<KPICardProps> = ({
  title,
  value,
  change,
  trend = 'stable',
  icon,
  suffix,
  loading = false,
  className,
}) => {
  const getTrendColor = () => {
    if (trend === 'up') return 'text-green-600';
    if (trend === 'down') return 'text-red-600';
    return 'text-gray-600';
  };

  const getTrendIcon = () => {
    if (trend === 'up') return <ArrowUpOutlined />;
    if (trend === 'down') return <ArrowDownOutlined />;
    return <MinusOutlined />;
  };

  return (
    <Card loading={loading} className={cn('hover:shadow-md transition-shadow', className)}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-gray-500 text-sm mb-2">{title}</p>
          <div className="flex items-baseline gap-2">
            <h3 className="text-3xl font-bold text-gray-900">
              {typeof value === 'number' ? formatNumber(value) : value}
            </h3>
            {suffix && <span className="text-gray-500 text-sm">{suffix}</span>}
          </div>
          {change !== undefined && (
            <div className={cn('flex items-center gap-1 mt-2 text-sm', getTrendColor())}>
              {getTrendIcon()}
              <span>
                {change > 0 ? '+' : ''}{change}% from last period
              </span>
            </div>
          )}
        </div>
        {icon && (
          <div className="flex-shrink-0 ml-4">
            <div className="w-12 h-12 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 text-2xl">
              {icon}
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};
