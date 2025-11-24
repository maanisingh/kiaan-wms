'use client';

import React, { useState } from 'react';

import { Table, Button, Tag, Tabs, Card, Space } from 'antd';
import {
  PlusOutlined,
  InboxOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  TruckOutlined,
  FileTextOutlined
} from '@ant-design/icons';
import { formatDate, getStatusColor } from '@/lib/utils';
import Link from 'next/link';

export default function InboundPage() {
  const [activeTab, setActiveTab] = useState('receiving');

  const mockReceivingData = [
    { id: 'RCV-001', poNumber: 'PO-2024-001', supplier: 'Global Suppliers Inc', status: 'pending', items: 5, expectedDate: '2024-11-20', receivedDate: null },
    { id: 'RCV-002', poNumber: 'PO-2024-002', supplier: 'TechParts Ltd', status: 'partial', items: 8, expectedDate: '2024-11-22', receivedDate: '2024-11-22' },
    { id: 'RCV-003', poNumber: 'PO-2024-003', supplier: 'Manufacturing Co', status: 'completed', items: 12, expectedDate: '2024-11-15', receivedDate: '2024-11-15' },
  ];

  const mockASNData = [
    { id: 'ASN-001', shipmentId: 'SHP-001', supplier: 'Global Suppliers Inc', status: 'in-transit', items: 15, shipDate: '2024-11-10', eta: '2024-11-20' },
    { id: 'ASN-002', shipmentId: 'SHP-002', supplier: 'TechParts Ltd', status: 'arrived', items: 25, shipDate: '2024-11-12', eta: '2024-11-22' },
  ];

  const mockQualityData = [
    { id: 'QC-001', poNumber: 'PO-2024-001', product: 'Laptop Computer', quantity: 50, status: 'passed', inspector: 'John Doe', date: '2024-11-15' },
    { id: 'QC-002', poNumber: 'PO-2024-002', product: 'Office Chair', quantity: 30, status: 'failed', inspector: 'Jane Smith', date: '2024-11-16' },
    { id: 'QC-003', poNumber: 'PO-2024-003', product: 'Wireless Mouse', quantity: 100, status: 'in-progress', inspector: 'Mike Johnson', date: '2024-11-17' },
  ];

  const mockPutawayData = [
    { id: 'PUT-001', product: 'Laptop Computer', quantity: 50, fromLocation: 'RECV-01', toLocation: 'A-01-01', status: 'completed', user: 'John Doe', date: '2024-11-15' },
    { id: 'PUT-002', product: 'Office Chair', quantity: 30, fromLocation: 'RECV-02', toLocation: 'B-02-03', status: 'in-progress', user: 'Jane Smith', date: '2024-11-16' },
    { id: 'PUT-003', product: 'Wireless Mouse', quantity: 100, fromLocation: 'RECV-01', toLocation: 'C-03-05', status: 'pending', user: null, date: null },
  ];

  const receivingColumns = [
    { title: 'Receipt ID', dataIndex: 'id', key: 'id', width: 120 },
    { title: 'PO Number', dataIndex: 'poNumber', key: 'poNumber', width: 150 },
    { title: 'Supplier', dataIndex: 'supplier', key: 'supplier', width: 200 },
    { title: 'Items', dataIndex: 'items', key: 'items', width: 80 },
    { title: 'Expected Date', dataIndex: 'expectedDate', key: 'expected', width: 130, render: (date: string) => formatDate(date) },
    { title: 'Received Date', dataIndex: 'receivedDate', key: 'received', width: 130, render: (date: string) => date ? formatDate(date) : '-' },
    { title: 'Status', dataIndex: 'status', key: 'status', width: 120, render: (status: string) => <Tag color={getStatusColor(status)}>{status}</Tag> },
    { title: 'Actions', key: 'actions', width: 150, render: () => <Space><Button type="link" size="small">View</Button><Button type="link" size="small">Process</Button></Space> },
  ];

  const asnColumns = [
    { title: 'ASN Number', dataIndex: 'id', key: 'id', width: 120 },
    { title: 'Shipment ID', dataIndex: 'shipmentId', key: 'shipmentId', width: 120 },
    { title: 'Supplier', dataIndex: 'supplier', key: 'supplier', width: 200 },
    { title: 'Items', dataIndex: 'items', key: 'items', width: 80 },
    { title: 'Ship Date', dataIndex: 'shipDate', key: 'shipDate', width: 120, render: (date: string) => formatDate(date) },
    { title: 'ETA', dataIndex: 'eta', key: 'eta', width: 120, render: (date: string) => formatDate(date) },
    { title: 'Status', dataIndex: 'status', key: 'status', width: 120, render: (status: string) => <Tag color={getStatusColor(status)}>{status}</Tag> },
    { title: 'Actions', key: 'actions', width: 150, render: () => <Space><Button type="link" size="small">View</Button><Button type="link" size="small">Track</Button></Space> },
  ];

  const qualityColumns = [
    { title: 'QC ID', dataIndex: 'id', key: 'id', width: 100 },
    { title: 'PO Number', dataIndex: 'poNumber', key: 'poNumber', width: 130 },
    { title: 'Product', dataIndex: 'product', key: 'product', width: 200 },
    { title: 'Quantity', dataIndex: 'quantity', key: 'quantity', width: 100 },
    { title: 'Inspector', dataIndex: 'inspector', key: 'inspector', width: 150 },
    { title: 'Date', dataIndex: 'date', key: 'date', width: 120, render: (date: string) => formatDate(date) },
    { title: 'Status', dataIndex: 'status', key: 'status', width: 120, render: (status: string) => <Tag color={getStatusColor(status)}>{status}</Tag> },
    { title: 'Actions', key: 'actions', width: 150, render: () => <Space><Button type="link" size="small">View</Button><Button type="link" size="small">Report</Button></Space> },
  ];

  const putawayColumns = [
    { title: 'Task ID', dataIndex: 'id', key: 'id', width: 100 },
    { title: 'Product', dataIndex: 'product', key: 'product', width: 200 },
    { title: 'Quantity', dataIndex: 'quantity', key: 'quantity', width: 100 },
    { title: 'From', dataIndex: 'fromLocation', key: 'from', width: 120 },
    { title: 'To', dataIndex: 'toLocation', key: 'to', width: 120 },
    { title: 'User', dataIndex: 'user', key: 'user', width: 150, render: (user: string) => user || '-' },
    { title: 'Date', dataIndex: 'date', key: 'date', width: 120, render: (date: string) => date ? formatDate(date) : '-' },
    { title: 'Status', dataIndex: 'status', key: 'status', width: 120, render: (status: string) => <Tag color={getStatusColor(status)}>{status}</Tag> },
    { title: 'Actions', key: 'actions', width: 150, render: () => <Space><Button type="link" size="small">View</Button><Button type="link" size="small">Complete</Button></Space> },
  ];

  const tabItems = [
    {
      key: 'receiving',
      label: <span className="flex items-center gap-2"><InboxOutlined />Receiving</span>,
      children: (
        <div className="bg-white rounded-lg shadow-sm">
          <Table dataSource={mockReceivingData} columns={receivingColumns} rowKey="id" scroll={{ x: 1200 }} pagination={{ pageSize: 20 }} />
        </div>
      ),
    },
    {
      key: 'asn',
      label: <span className="flex items-center gap-2"><FileTextOutlined />Advanced Shipping Notices</span>,
      children: (
        <div className="bg-white rounded-lg shadow-sm">
          <Table dataSource={mockASNData} columns={asnColumns} rowKey="id" scroll={{ x: 1200 }} pagination={{ pageSize: 20 }} />
        </div>
      ),
    },
    {
      key: 'quality',
      label: <span className="flex items-center gap-2"><CheckCircleOutlined />Quality Control</span>,
      children: (
        <div className="bg-white rounded-lg shadow-sm">
          <Table dataSource={mockQualityData} columns={qualityColumns} rowKey="id" scroll={{ x: 1200 }} pagination={{ pageSize: 20 }} />
        </div>
      ),
    },
    {
      key: 'putaway',
      label: <span className="flex items-center gap-2"><TruckOutlined />Putaway Tasks</span>,
      children: (
        <div className="bg-white rounded-lg shadow-sm">
          <Table dataSource={mockPutawayData} columns={putawayColumns} rowKey="id" scroll={{ x: 1200 }} pagination={{ pageSize: 20 }} />
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Inbound Operations</h1>
            <p className="text-gray-600 mt-1">Manage receiving, quality control, and putaway</p>
          </div>
          <Button type="primary" icon={<PlusOutlined />} size="large">
            Create Receipt
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <div className="text-center">
              <p className="text-gray-500 text-sm">Pending Receipts</p>
              <p className="text-3xl font-bold text-orange-600">8</p>
            </div>
          </Card>
          <Card>
            <div className="text-center">
              <p className="text-gray-500 text-sm">In Transit</p>
              <p className="text-3xl font-bold text-blue-600">12</p>
            </div>
          </Card>
          <Card>
            <div className="text-center">
              <p className="text-gray-500 text-sm">QC In Progress</p>
              <p className="text-3xl font-bold text-purple-600">5</p>
            </div>
          </Card>
          <Card>
            <div className="text-center">
              <p className="text-gray-500 text-sm">Putaway Pending</p>
              <p className="text-3xl font-bold text-green-600">15</p>
            </div>
          </Card>
        </div>

        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={tabItems}
          size="large"
          className="bg-white rounded-lg shadow-sm p-4"
        />
      </div>
      );
}
