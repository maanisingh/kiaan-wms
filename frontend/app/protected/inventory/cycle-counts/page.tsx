'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Table, Button, Input, Card, Modal, Form, message, Tag, Tabs, Select, InputNumber, Spin, Alert, App } from 'antd';
import { PlusOutlined, SearchOutlined, EyeOutlined, InboxOutlined, CheckCircleOutlined, ClockCircleOutlined, WarningOutlined, ReloadOutlined } from '@ant-design/icons';
import { formatDate } from '@/lib/utils';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import apiService from '@/services/api';

const { Search } = Input;

interface Location {
  id: string;
  name?: string;
  code?: string;
  aisle: string;
  rack: string;
  shelf?: string;
  bin: string;
  zone?: {
    id: string;
    name: string;
  };
}

interface CycleCount {
  id: string;
  referenceNumber?: string;
  locationId?: string;
  location?: Location;
  scheduledDate?: string;
  completedDate?: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  countedBy?: {
    id: string;
    name: string;
    email: string;
  };
  itemsCount?: number;
  discrepancies?: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export default function CycleCountsPage() {
  const { modal, message: msg } = App.useApp();
  const [loading, setLoading] = useState(true);
  const [cycleCounts, setCycleCounts] = useState<CycleCount[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('all');
  const [searchText, setSearchText] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [locations, setLocations] = useState<Location[]>([]);
  const [locationsLoading, setLocationsLoading] = useState(false);
  const [form] = Form.useForm();
  const router = useRouter();

  // Fetch locations for the dropdown
  const fetchLocations = useCallback(async () => {
    try {
      setLocationsLoading(true);
      const data = await apiService.get('/locations');
      setLocations(Array.isArray(data) ? data : []);
    } catch (err: any) {
      console.error('Failed to fetch locations:', err);
    } finally {
      setLocationsLoading(false);
    }
  }, []);

  // Fetch cycle counts from API
  const fetchCycleCounts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await apiService.get('/inventory/cycle-counts');
      setCycleCounts(Array.isArray(data) ? data : []);
    } catch (err: any) {
      console.error('Failed to fetch cycle counts:', err);
      setError(err.message || 'Failed to load cycle counts');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCycleCounts();
    fetchLocations();
  }, [fetchCycleCounts, fetchLocations]);

  const handleSubmit = async (values: any) => {
    try {
      setSaving(true);

      const payload = {
        name: values.name,
        type: values.type || 'FULL',
        locations: values.locationId ? [values.locationId] : [],
        scheduledDate: values.scheduledDate,
        notes: values.notes
      };

      await apiService.post('/inventory/cycle-counts', payload);
      msg.success('Cycle count created successfully!');
      form.resetFields();
      setModalOpen(false);
      fetchCycleCounts(); // Refresh the list
    } catch (err: any) {
      console.error('Failed to create cycle count:', err);
      msg.error(err.response?.data?.message || 'Failed to create cycle count');
    } finally {
      setSaving(false);
    }
  };

  // Filter cycle counts based on active tab and search
  const getFilteredCycleCounts = () => {
    let filtered = cycleCounts;

    // Filter by tab
    if (activeTab === 'completed') {
      filtered = filtered.filter(c => c.status === 'COMPLETED');
    } else if (activeTab === 'in_progress') {
      filtered = filtered.filter(c => c.status === 'IN_PROGRESS');
    } else if (activeTab === 'pending') {
      filtered = filtered.filter(c => c.status === 'PENDING');
    } else if (activeTab === 'discrepancies') {
      filtered = filtered.filter(c => (c.discrepancies || 0) > 0);
    }

    // Filter by search
    if (searchText) {
      const search = searchText.toLowerCase();
      filtered = filtered.filter(c =>
        c.referenceNumber?.toLowerCase().includes(search) ||
        c.location?.aisle?.toLowerCase().includes(search) ||
        c.countedBy?.name?.toLowerCase().includes(search)
      );
    }

    return filtered;
  };

  const columns = [
    {
      title: 'Count ID',
      dataIndex: 'referenceNumber',
      key: 'referenceNumber',
      width: 150,
      render: (text: string, record: CycleCount) => (
        <Link href={`/protected/inventory/cycle-counts/${record.id}`}>
          <span className="font-medium text-blue-600 cursor-pointer hover:underline">
            {text || `CC-${record.id.slice(0, 8)}`}
          </span>
        </Link>
      )
    },
    {
      title: 'Date',
      dataIndex: 'scheduledDate',
      key: 'date',
      width: 120,
      render: (date: string) => formatDate(date)
    },
    {
      title: 'Location',
      key: 'location',
      width: 120,
      render: (_: any, record: CycleCount) => {
        if (!record.location) return '-';
        return `${record.location.aisle}-${record.location.rack}-${record.location.bin}`;
      }
    },
    {
      title: 'Items Counted',
      dataIndex: 'itemsCount',
      key: 'itemsCount',
      width: 120,
      render: (count: number) => count || 0
    },
    {
      title: 'Discrepancies',
      dataIndex: 'discrepancies',
      key: 'discrepancies',
      width: 120,
      render: (val: number) => <span className={val > 0 ? 'text-red-600 font-semibold' : ''}>{val || 0}</span>
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status: string) => {
        const colors: Record<string, string> = {
          COMPLETED: 'green',
          IN_PROGRESS: 'blue',
          PENDING: 'orange',
          CANCELLED: 'red'
        };
        return <Tag color={colors[status] || 'default'}>{status.replace('_', ' ')}</Tag>;
      }
    },
    {
      title: 'Counter',
      key: 'counter',
      width: 150,
      render: (_: any, record: CycleCount) => record.countedBy?.name || record.countedBy?.email || '-'
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 120,
      render: (_: any, record: CycleCount) => (
        <Link href={`/protected/inventory/cycle-counts/${record.id}`}>
          <Button type="link" icon={<EyeOutlined />} size="small">View</Button>
        </Link>
      ),
    },
  ];

  const completed = cycleCounts.filter(c => c.status === 'COMPLETED');
  const inProgress = cycleCounts.filter(c => c.status === 'IN_PROGRESS');
  const pending = cycleCounts.filter(c => c.status === 'PENDING');
  const withDiscrepancies = cycleCounts.filter(c => (c.discrepancies || 0) > 0);

  const renderFiltersAndTable = () => (
    <>
      <div className="flex gap-4 mb-4">
        <Search
          placeholder="Search cycle counts..."
          style={{ width: 300 }}
          prefix={<SearchOutlined />}
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          allowClear
        />
        <Button icon={<ReloadOutlined />} onClick={fetchCycleCounts}>Refresh</Button>
      </div>
      {error && (
        <Alert
          message="Error"
          description={error}
          type="error"
          showIcon
          className="mb-4"
          closable
          onClose={() => setError(null)}
        />
      )}
      <Table
        columns={columns}
        dataSource={getFilteredCycleCounts()}
        rowKey="id"
        loading={loading}
        scroll={{ x: 1100 }}
        onRow={(record) => ({
          onClick: () => router.push(`/protected/inventory/cycle-counts/${record.id}`),
          style: { cursor: 'pointer' }
        })}
        pagination={{
          showSizeChanger: true,
          showTotal: (total) => `Total ${total} cycle counts`,
        }}
      />
    </>
  );

  const tabItems = [
    {
      key: 'all',
      label: <span className="flex items-center gap-2"><InboxOutlined />All Counts ({cycleCounts.length})</span>,
      children: renderFiltersAndTable(),
    },
    {
      key: 'completed',
      label: <span className="flex items-center gap-2"><CheckCircleOutlined />Completed ({completed.length})</span>,
      children: renderFiltersAndTable(),
    },
    {
      key: 'in_progress',
      label: <span className="flex items-center gap-2"><ClockCircleOutlined />In Progress ({inProgress.length})</span>,
      children: renderFiltersAndTable(),
    },
    {
      key: 'pending',
      label: <span className="flex items-center gap-2"><ClockCircleOutlined />Pending ({pending.length})</span>,
      children: renderFiltersAndTable(),
    },
    {
      key: 'discrepancies',
      label: <span className="flex items-center gap-2"><WarningOutlined />With Discrepancies ({withDiscrepancies.length})</span>,
      children: renderFiltersAndTable(),
    },
  ];

  if (loading && cycleCounts.length === 0) {
    return (
      <div className="flex justify-center items-center h-96">
        <Spin size="large" tip="Loading cycle counts..." />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
            Cycle Counts
          </h1>
          <p className="text-gray-600 mt-1">Track inventory cycle counting operations</p>
        </div>
        <Button type="primary" icon={<PlusOutlined />} size="large" onClick={() => setModalOpen(true)}>
          Start Count
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <div className="text-center">
            <p className="text-gray-500 text-sm">Total Counts</p>
            <p className="text-3xl font-bold text-blue-600">{cycleCounts.length}</p>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <p className="text-gray-500 text-sm">Completed</p>
            <p className="text-3xl font-bold text-green-600">{completed.length}</p>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <p className="text-gray-500 text-sm">In Progress</p>
            <p className="text-3xl font-bold text-orange-600">{inProgress.length}</p>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <p className="text-gray-500 text-sm">Discrepancies</p>
            <p className="text-3xl font-bold text-red-600">{cycleCounts.reduce((sum, c) => sum + (c.discrepancies || 0), 0)}</p>
          </div>
        </Card>
      </div>

      <Card className="shadow-sm">
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={tabItems}
          size="large"
        />
      </Card>

      <Modal
        title="Start New Cycle Count"
        open={modalOpen}
        onCancel={() => {
          setModalOpen(false);
          form.resetFields();
        }}
        onOk={() => form.submit()}
        confirmLoading={saving}
        width={600}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item
            label="Count Name"
            name="name"
            rules={[{ required: true, message: 'Please enter a name for this cycle count' }]}
          >
            <Input placeholder="e.g., Weekly Zone A Count" />
          </Form.Item>

          <Form.Item
            label="Count Type"
            name="type"
            initialValue="FULL"
          >
            <Select>
              <Select.Option value="FULL">Full Count</Select.Option>
              <Select.Option value="PARTIAL">Partial Count</Select.Option>
              <Select.Option value="SPOT">Spot Check</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item
            label="Location"
            name="locationId"
            rules={[{ required: true, message: 'Please select a location' }]}
          >
            <Select
              placeholder="Select a location to count"
              loading={locationsLoading}
              showSearch
              optionFilterProp="children"
              filterOption={(input, option) =>
                (option?.children as unknown as string)?.toLowerCase().includes(input.toLowerCase())
              }
            >
              {locations.map((loc) => (
                <Select.Option key={loc.id} value={loc.id}>
                  {loc.name || `${loc.aisle}-${loc.rack}-${loc.shelf || ''}-${loc.bin}`}
                  {loc.zone?.name ? ` (${loc.zone.name})` : ''}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            label="Scheduled Date"
            name="scheduledDate"
            rules={[{ required: true, message: 'Please select a date' }]}
          >
            <Input type="date" />
          </Form.Item>

          <Form.Item
            label="Notes (Optional)"
            name="notes"
          >
            <Input.TextArea
              rows={3}
              placeholder="Add any additional notes about this cycle count"
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
