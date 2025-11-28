'use client';

import React, { useState, useEffect } from 'react';

import { Table, Card, Tag, Button, Select, Space, Statistic, Row, Col, message, Modal, Form, Input, InputNumber } from 'antd';
import { CheckOutlined, ClockCircleOutlined, SyncOutlined, PlusOutlined, EditOutlined, DeleteOutlined, EyeOutlined } from '@ant-design/icons';
import apiService from '@/services/api';
import { format } from 'date-fns';
import { useRouter } from 'next/navigation';

export default function ReplenishmentTasksPage() {
  const router = useRouter();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string | undefined>();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedTask, setSelectedTask] = useState<any>(null);
  const [form] = Form.useForm();
  const [products, setProducts] = useState<any[]>([]);
  const [locations, setLocations] = useState<string[]>([]);

  useEffect(() => {
    fetchTasks();
    fetchProducts();
    fetchLocations();
  }, [statusFilter]);

  const fetchProducts = async () => {
    try {
      const data = await apiService.get('/products');
      setProducts(data || []);
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  const fetchLocations = async () => {
    try {
      // Fetch from inventory to get unique locations
      const inventory = await apiService.get('/inventory');
      const uniqueLocations = [...new Set((inventory || []).map((i: any) => i.locationId).filter(Boolean))];
      // Add common location prefixes
      const defaultLocations = ['BULK-A1', 'BULK-A2', 'BULK-B1', 'BULK-B2', 'PICK-A1', 'PICK-A2', 'PICK-B1', 'PICK-B2', 'SHELF-01', 'SHELF-02'];
      const allLocations = [...new Set([...uniqueLocations, ...defaultLocations])];
      setLocations(allLocations as string[]);
    } catch (error) {
      console.error('Error fetching locations:', error);
      setLocations(['BULK-A1', 'BULK-A2', 'BULK-B1', 'PICK-A1', 'PICK-A2', 'PICK-B1', 'SHELF-01', 'SHELF-02']);
    }
  };

  const fetchTasks = async () => {
    setLoading(true);
    try {
      const url = statusFilter
        ? `/replenishment/tasks?status=${statusFilter}`
        : '/replenishment/tasks';
      const data = await apiService.get(url);
      setTasks(data || []);
    } catch (error) {
      console.error('Error fetching tasks:', error);
      message.error('Failed to fetch tasks');
      setTasks([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteTask = async (taskId: string) => {
    try {
      await apiService.patch(`/replenishment/tasks/${taskId}`, {
        status: 'COMPLETED',
        completedAt: new Date().toISOString()
      });
      message.success('Task marked as completed');
      fetchTasks();
    } catch (error) {
      message.error('Failed to update task');
    }
  };

  const handleAddTask = () => {
    setIsEditMode(false);
    setSelectedTask(null);
    form.resetFields();
    setIsModalVisible(true);
  };

  const handleEditTask = (record: any) => {
    setIsEditMode(true);
    setSelectedTask(record);
    form.setFieldsValue({
      productId: record.productId,
      fromLocation: record.fromLocation,
      toLocation: record.toLocation,
      quantityNeeded: record.quantityNeeded,
      priority: record.priority,
      status: record.status,
    });
    setIsModalVisible(true);
  };

  const handleDeleteTask = async (taskId: string) => {
    Modal.confirm({
      title: 'Delete Task',
      content: 'Are you sure you want to delete this replenishment task?',
      okText: 'Delete',
      okType: 'danger',
      onOk: async () => {
        try {
          await apiService.delete(`/replenishment/tasks/${taskId}`);
          message.success('Task deleted successfully');
          fetchTasks();
        } catch (error) {
          message.error('Failed to delete task');
        }
      },
    });
  };

  const handleSubmit = async (values: any) => {
    try {
      if (isEditMode && selectedTask) {
        await apiService.patch(`/replenishment/tasks/${selectedTask.id}`, values);
        message.success('Task updated successfully');
      } else {
        await apiService.post('/replenishment/tasks', values);
        message.success('Task created successfully');
      }
      setIsModalVisible(false);
      form.resetFields();
      fetchTasks();
    } catch (error) {
      message.error(`Failed to ${isEditMode ? 'update' : 'create'} task`);
    }
  };

  const handleViewTask = (record: any) => {
    Modal.info({
      title: `Task Details: ${record.taskNumber}`,
      width: 600,
      content: (
        <div className="space-y-3 mt-4">
          <p><strong>Product:</strong> {record.product?.name || record.productId}</p>
          <p><strong>Brand:</strong> {record.product?.brand?.name || '-'}</p>
          <p><strong>From Location:</strong> {record.fromLocation}</p>
          <p><strong>To Location:</strong> {record.toLocation}</p>
          <p><strong>Quantity Needed:</strong> {record.quantityNeeded}</p>
          <p><strong>Quantity Moved:</strong> {record.quantityMoved || 0}</p>
          <p><strong>Priority:</strong> <Tag color={record.priority === 'URGENT' ? 'red' : record.priority === 'HIGH' ? 'orange' : 'blue'}>{record.priority}</Tag></p>
          <p><strong>Status:</strong> <Tag color={record.status === 'COMPLETED' ? 'green' : record.status === 'IN_PROGRESS' ? 'blue' : 'orange'}>{record.status}</Tag></p>
          <p><strong>Created:</strong> {record.createdAt ? format(new Date(record.createdAt), 'dd/MM/yyyy HH:mm') : '-'}</p>
          {record.completedAt && <p><strong>Completed:</strong> {format(new Date(record.completedAt), 'dd/MM/yyyy HH:mm')}</p>}
          {record.notes && <p><strong>Notes:</strong> {record.notes}</p>}
        </div>
      ),
    });
  };

  const columns = [
    {
      title: 'Task #',
      dataIndex: 'taskNumber',
      key: 'taskNumber',
      width: 120,
      fixed: 'left' as const,
    },
    {
      title: 'Product',
      dataIndex: ['product', 'name'],
      key: 'product',
      width: 250,
    },
    {
      title: 'Brand',
      dataIndex: ['product', 'brand', 'name'],
      key: 'brand',
      width: 120,
    },
    {
      title: 'From',
      dataIndex: 'fromLocation',
      key: 'from',
      width: 120,
      render: (loc: string) => loc || '-',
    },
    {
      title: 'To',
      dataIndex: 'toLocation',
      key: 'to',
      width: 120,
      render: (loc: string) => loc || '-',
    },
    {
      title: 'Quantity',
      key: 'quantity',
      width: 120,
      render: (_: any, record: any) => (
        <span className={record.quantityMoved >= record.quantityNeeded ? 'text-green-600' : ''}>
          {record.quantityMoved || 0} / {record.quantityNeeded}
        </span>
      ),
    },
    {
      title: 'Priority',
      dataIndex: 'priority',
      key: 'priority',
      width: 100,
      render: (priority: string) => {
        const colors: Record<string, string> = {
          LOW: 'default',
          MEDIUM: 'blue',
          HIGH: 'orange',
          URGENT: 'red',
        };
        return <Tag color={colors[priority] || 'default'}>{priority}</Tag>;
      },
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status: string) => {
        const config: Record<string, { color: string; icon: React.ReactNode }> = {
          PENDING: { color: 'orange', icon: <ClockCircleOutlined /> },
          IN_PROGRESS: { color: 'blue', icon: <SyncOutlined spin /> },
          COMPLETED: { color: 'green', icon: <CheckOutlined /> },
        };
        const { color, icon } = config[status] || { color: 'default', icon: null };
        return <Tag color={color} icon={icon}>{status.replace('_', ' ')}</Tag>;
      },
    },
    {
      title: 'Created',
      dataIndex: 'createdAt',
      key: 'created',
      width: 120,
      render: (date: string) => date ? format(new Date(date), 'dd/MM/yyyy') : '-',
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 250,
      fixed: 'right' as const,
      render: (_: any, record: any) => (
        <Space>
          <Button
            size="small"
            icon={<EyeOutlined />}
            onClick={() => handleViewTask(record)}
          >
            View
          </Button>
          {record.status !== 'COMPLETED' && (
            <Button
              size="small"
              type="primary"
              icon={<CheckOutlined />}
              onClick={() => handleCompleteTask(record.id)}
            >
              Complete
            </Button>
          )}
          <Button
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEditTask(record)}
          />
          <Button
            size="small"
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDeleteTask(record.id)}
          />
        </Space>
      ),
    },
  ];

  const pendingCount = tasks.filter((t: any) => t.status === 'PENDING').length;
  const inProgressCount = tasks.filter((t: any) => t.status === 'IN_PROGRESS').length;
  const completedCount = tasks.filter((t: any) => t.status === 'COMPLETED').length;

  return (
    <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold">Replenishment Tasks</h1>
            <p className="text-gray-500">Manage stock replenishment from bulk to pick locations</p>
          </div>
          <Space>
            <Button onClick={fetchTasks} icon={<SyncOutlined />}>
              Refresh
            </Button>
            <Button type="primary" onClick={handleAddTask} icon={<PlusOutlined />}>
              Add Task
            </Button>
          </Space>
        </div>

        <Row gutter={16} className="mb-6">
          <Col span={8}>
            <Card>
              <Statistic
                title="Pending Tasks"
                value={pendingCount}
                valueStyle={{ color: '#faad14' }}
                prefix={<ClockCircleOutlined />}
              />
            </Card>
          </Col>
          <Col span={8}>
            <Card>
              <Statistic
                title="In Progress"
                value={inProgressCount}
                valueStyle={{ color: '#1890ff' }}
                prefix={<SyncOutlined spin={inProgressCount > 0} />}
              />
            </Card>
          </Col>
          <Col span={8}>
            <Card>
              <Statistic
                title="Completed"
                value={completedCount}
                valueStyle={{ color: '#52c41a' }}
                prefix={<CheckOutlined />}
              />
            </Card>
          </Col>
        </Row>

        <Card>
          <div className="mb-4">
            <Space>
              <span>Filter by status:</span>
              <Select
                placeholder="All statuses"
                style={{ width: 150 }}
                value={statusFilter}
                onChange={setStatusFilter}
                allowClear
              >
                <Select.Option value="PENDING">Pending</Select.Option>
                <Select.Option value="IN_PROGRESS">In Progress</Select.Option>
                <Select.Option value="COMPLETED">Completed</Select.Option>
              </Select>
            </Space>
          </div>

          <Table
            columns={columns}
            dataSource={tasks}
            loading={loading}
            rowKey="id"
            pagination={{ pageSize: 20 }}
            scroll={{ x: 1400 }}
          />
        </Card>

        <Modal
          title={isEditMode ? 'Edit Replenishment Task' : 'Create Replenishment Task'}
          open={isModalVisible}
          onCancel={() => {
            setIsModalVisible(false);
            form.resetFields();
          }}
          onOk={() => form.submit()}
          width={600}
        >
          <Form form={form} layout="vertical" onFinish={handleSubmit}>
            <Form.Item
              label="Product"
              name="productId"
              rules={[{ required: true, message: 'Please select a product' }]}
            >
              <Select
                showSearch
                placeholder="Select a product"
                optionFilterProp="children"
                filterOption={(input, option) =>
                  (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                }
                options={products.map(p => ({
                  value: p.id,
                  label: `${p.name} (${p.sku})`,
                }))}
              />
            </Form.Item>
            <Form.Item
              label="From Location (Bulk/Storage)"
              name="fromLocation"
              rules={[{ required: true, message: 'Please select source location' }]}
            >
              <Select
                showSearch
                placeholder="Select source location"
                optionFilterProp="children"
                filterOption={(input, option) =>
                  (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                }
                options={locations.filter(l => l.includes('BULK') || l.includes('SHELF')).map(loc => ({
                  value: loc,
                  label: loc,
                }))}
              />
            </Form.Item>
            <Form.Item
              label="To Location (Pick Area)"
              name="toLocation"
              rules={[{ required: true, message: 'Please select destination location' }]}
            >
              <Select
                showSearch
                placeholder="Select destination location"
                optionFilterProp="children"
                filterOption={(input, option) =>
                  (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                }
                options={locations.filter(l => l.includes('PICK') || !l.includes('BULK')).map(loc => ({
                  value: loc,
                  label: loc,
                }))}
              />
            </Form.Item>
            <Form.Item
              label="Quantity Needed"
              name="quantityNeeded"
              rules={[{ required: true, message: 'Please enter quantity' }]}
            >
              <InputNumber min={1} style={{ width: '100%' }} placeholder="Enter quantity" />
            </Form.Item>
            <Form.Item
              label="Priority"
              name="priority"
              rules={[{ required: true, message: 'Please select priority' }]}
              initialValue="MEDIUM"
            >
              <Select placeholder="Select priority">
                <Select.Option value="LOW">Low</Select.Option>
                <Select.Option value="MEDIUM">Medium</Select.Option>
                <Select.Option value="HIGH">High</Select.Option>
                <Select.Option value="URGENT">Urgent</Select.Option>
              </Select>
            </Form.Item>
            {isEditMode && (
              <Form.Item
                label="Status"
                name="status"
              >
                <Select placeholder="Select status">
                  <Select.Option value="PENDING">Pending</Select.Option>
                  <Select.Option value="IN_PROGRESS">In Progress</Select.Option>
                  <Select.Option value="COMPLETED">Completed</Select.Option>
                </Select>
              </Form.Item>
            )}
          </Form>
        </Modal>
      </div>
      );
}
