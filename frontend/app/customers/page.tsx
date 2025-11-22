'use client';

import React, { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Table, Button, Input, Select, Tag, Space, Card, Form, Drawer, message, Modal, Tabs } from 'antd';
import {
  PlusOutlined,
  SearchOutlined,
  FilterOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  UserOutlined,
  MailOutlined,
  PhoneOutlined,
  InboxOutlined,
  CheckCircleOutlined,
  StopOutlined,
} from '@ant-design/icons';
import { useModal } from '@/hooks/useModal';
import { useQuery, useMutation } from '@apollo/client';
import { GET_CUSTOMERS } from '@/lib/graphql/queries';
import { CREATE_CUSTOMER, UPDATE_CUSTOMER, DELETE_CUSTOMER } from '@/lib/graphql/mutations';
import { useRouter } from 'next/navigation';

const { Search } = Input;
const { Option } = Select;

export default function CustomersPage() {
  const router = useRouter();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('all');
  const [searchText, setSearchText] = useState('');
  const addModal = useModal();
  const editModal = useModal();
  const [form] = Form.useForm();

  // GraphQL query for customers
  const { data, loading, error, refetch } = useQuery(GET_CUSTOMERS, {
    variables: {
      limit: 100,
      offset: 0,
    },
  });

  // GraphQL mutations
  const [createCustomer, { loading: creating }] = useMutation(CREATE_CUSTOMER, {
    onCompleted: () => {
      message.success('Customer created successfully!');
      form.resetFields();
      addModal.close();
      refetch();
    },
    onError: (err) => {
      message.error(`Failed to create customer: ${err.message}`);
    },
  });

  const [updateCustomer, { loading: updating }] = useMutation(UPDATE_CUSTOMER, {
    onCompleted: () => {
      message.success('Customer updated successfully!');
      form.resetFields();
      editModal.close();
      refetch();
    },
    onError: (err) => {
      message.error(`Failed to update customer: ${err.message}`);
    },
  });

  const [deleteCustomer] = useMutation(DELETE_CUSTOMER, {
    onCompleted: () => {
      message.success('Customer deleted successfully!');
      refetch();
    },
    onError: (err) => {
      message.error(`Failed to delete customer: ${err.message}`);
    },
  });

  // Get customers from GraphQL data
  const customers = data?.Customer || [];

  // Filter customers by search text and status
  const filteredCustomers = customers.filter((c: any) => {
    const matchesSearch = !searchText ||
      c.name?.toLowerCase().includes(searchText.toLowerCase()) ||
      c.email?.toLowerCase().includes(searchText.toLowerCase()) ||
      c.code?.toLowerCase().includes(searchText.toLowerCase());
    return matchesSearch;
  });

  const allCustomers = filteredCustomers;
  const b2cCustomers = filteredCustomers.filter((c: any) => c.customerType === 'B2C');
  const b2bCustomers = filteredCustomers.filter((c: any) => c.customerType === 'B2B');

  const handleSubmit = async (values: any) => {
    try {
      if (selectedCustomer) {
        // UPDATE existing customer
        await updateCustomer({
          variables: {
            id: selectedCustomer.id,
            set: {
              name: values.name,
              email: values.email || null,
              phone: values.phone || null,
              address: values.address || null,
              customerType: values.customerType,
              updatedAt: new Date().toISOString(),
            },
          },
        });
      } else {
        // CREATE new customer
        const uuid = crypto.randomUUID();
        const customerCode = `CUST-${Date.now().toString().slice(-6)}`;

        await createCustomer({
          variables: {
            object: {
              id: uuid,
              code: customerCode,
              name: values.name,
              email: values.email || null,
              phone: values.phone || null,
              address: values.address || null,
              customerType: values.customerType,
              companyId: '53c65d84-4606-4b0a-8aa5-6eda9e50c3df',
              updatedAt: new Date().toISOString(),
            },
          },
        });
      }
    } catch (error: any) {
      console.error('Error saving customer:', error);
      message.error(error?.message || 'Failed to save customer');
    }
  };

  const handleEdit = (record: any) => {
    setSelectedCustomer(record);
    form.setFieldsValue({
      name: record.name,
      email: record.email,
      phone: record.phone,
      address: record.address,
      customerType: record.customerType,
    });
    editModal.open();
  };

  const handleDelete = (record: any) => {
    Modal.confirm({
      title: 'Delete Customer',
      content: `Are you sure you want to delete customer "${record.name}"? This action cannot be undone.`,
      okText: 'Delete',
      okType: 'danger',
      onOk: async () => {
        await deleteCustomer({ variables: { id: record.id } });
      },
    });
  };

  const handleAddCustomer = () => {
    setSelectedCustomer(null);
    form.resetFields();
    addModal.open();
  };

  const columns = [
    {
      title: 'Customer Code',
      dataIndex: 'code',
      key: 'code',
      width: 130,
      render: (text: string) => (
        <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">{text}</span>
      ),
    },
    {
      title: 'Customer Name',
      dataIndex: 'name',
      key: 'name',
      width: 200,
      render: (text: string) => (
        <div className="flex items-center gap-2">
          <UserOutlined className="text-blue-500" />
          <span className="font-medium">{text}</span>
        </div>
      ),
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
      width: 200,
      render: (email: string) => (
        <div className="flex items-center gap-2">
          <MailOutlined className="text-gray-400" />
          <span>{email || '-'}</span>
        </div>
      ),
    },
    {
      title: 'Phone',
      dataIndex: 'phone',
      key: 'phone',
      width: 150,
      render: (phone: string) => (
        <div className="flex items-center gap-2">
          <PhoneOutlined className="text-gray-400" />
          <span>{phone || '-'}</span>
        </div>
      ),
    },
    {
      title: 'Type',
      dataIndex: 'customerType',
      key: 'customerType',
      width: 100,
      render: (type: string) => (
        <Tag color={type === 'B2B' ? 'blue' : 'green'} className="uppercase">
          {type || 'N/A'}
        </Tag>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, record: any) => (
        <Space>
          <Button
            type="link"
            icon={<EyeOutlined />}
            onClick={() => {
              setSelectedCustomer(record);
              setDrawerOpen(true);
            }}
          >
            View
          </Button>
          <Button type="link" icon={<EditOutlined />} onClick={() => handleEdit(record)}>
            Edit
          </Button>
          <Button type="link" danger icon={<DeleteOutlined />} onClick={() => handleDelete(record)}>
            Delete
          </Button>
        </Space>
      ),
    },
  ];

  const renderTable = (dataSource: any[]) => (
    <>
      <div className="flex gap-4 flex-wrap mb-4">
        <Search
          placeholder="Search by name, email, or code..."
          allowClear
          style={{ width: 350 }}
          prefix={<SearchOutlined />}
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
        />
      </div>
      <Table
        columns={columns}
        dataSource={dataSource}
        rowKey="id"
        loading={loading}
        pagination={{
          total: dataSource.length,
          pageSize: 10,
          showSizeChanger: true,
          showTotal: (total) => `Total ${total} customers`,
        }}
      />
    </>
  );

  const tabItems = [
    {
      key: 'all',
      label: <span className="flex items-center gap-2"><InboxOutlined />All Customers ({allCustomers.length})</span>,
      children: renderTable(allCustomers),
    },
    {
      key: 'b2c',
      label: <span className="flex items-center gap-2"><UserOutlined />B2C ({b2cCustomers.length})</span>,
      children: renderTable(b2cCustomers),
    },
    {
      key: 'b2b',
      label: <span className="flex items-center gap-2"><CheckCircleOutlined />B2B ({b2bCustomers.length})</span>,
      children: renderTable(b2bCustomers),
    },
  ];

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Customer Management
            </h1>
            <p className="text-gray-600 mt-1">Manage your customer database and relationships</p>
          </div>
          <Button type="primary" icon={<PlusOutlined />} size="large" onClick={handleAddCustomer}>
            Add Customer
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <div className="text-center">
              <p className="text-gray-500 text-sm">Total Customers</p>
              <p className="text-3xl font-bold text-blue-600">{allCustomers.length}</p>
            </div>
          </Card>
          <Card>
            <div className="text-center">
              <p className="text-gray-500 text-sm">B2C Customers</p>
              <p className="text-3xl font-bold text-green-600">{b2cCustomers.length}</p>
            </div>
          </Card>
          <Card>
            <div className="text-center">
              <p className="text-gray-500 text-sm">B2B Customers</p>
              <p className="text-3xl font-bold text-purple-600">{b2bCustomers.length}</p>
            </div>
          </Card>
        </div>

        {/* Tabs with Tables */}
        <Card className="shadow-sm">
          <Tabs
            activeKey={activeTab}
            onChange={setActiveTab}
            items={tabItems}
            size="large"
          />
        </Card>

        {/* Details Drawer */}
        <Drawer
          title="Customer Details"
          placement="right"
          width={600}
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
        >
          {selectedCustomer && (
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-lg">{selectedCustomer.name}</h3>
                <p className="text-gray-600">{selectedCustomer.email || 'No email provided'}</p>
              </div>
              <div className="border-t pt-4">
                <p><strong>Customer Code:</strong> <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">{selectedCustomer.code}</span></p>
                <p><strong>Type:</strong> <Tag color={selectedCustomer.customerType === 'B2B' ? 'blue' : 'green'}>{selectedCustomer.customerType}</Tag></p>
                <p><strong>Phone:</strong> {selectedCustomer.phone || 'Not provided'}</p>
                <p><strong>Address:</strong> {selectedCustomer.address || 'Not provided'}</p>
                <p className="text-xs text-gray-500 mt-4">Created: {new Date(selectedCustomer.createdAt).toLocaleDateString()}</p>
              </div>
            </div>
          )}
        </Drawer>

        <Modal
          title="Add Customer"
          open={addModal.isOpen}
          onCancel={addModal.close}
          onOk={() => form.submit()}
          width={600}
          confirmLoading={creating}
        >
          <Form form={form} layout="vertical" onFinish={handleSubmit}>
            <Form.Item label="Customer Name" name="name" rules={[{ required: true, message: 'Please enter customer name' }]}>
              <Input placeholder="Enter customer name" />
            </Form.Item>
            <Form.Item label="Customer Type" name="customerType" rules={[{ required: true, message: 'Please select customer type' }]}>
              <Select placeholder="Select customer type">
                <Option value="B2C">B2C (Business to Consumer)</Option>
                <Option value="B2B">B2B (Business to Business)</Option>
              </Select>
            </Form.Item>
            <Form.Item label="Email" name="email" rules={[{ type: 'email', message: 'Please enter a valid email' }]}>
              <Input placeholder="Enter email (optional)" />
            </Form.Item>
            <Form.Item label="Phone" name="phone">
              <Input placeholder="Enter phone number (optional)" />
            </Form.Item>
            <Form.Item label="Address" name="address">
              <Input.TextArea placeholder="Enter address (optional)" rows={3} />
            </Form.Item>
          </Form>
        </Modal>

        <Modal
          title="Edit Customer"
          open={editModal.isOpen}
          onCancel={editModal.close}
          onOk={() => form.submit()}
          width={600}
          confirmLoading={updating}
        >
          <Form form={form} layout="vertical" onFinish={handleSubmit}>
            <Form.Item label="Customer Name" name="name" rules={[{ required: true, message: 'Please enter customer name' }]}>
              <Input placeholder="Enter customer name" />
            </Form.Item>
            <Form.Item label="Customer Type" name="customerType" rules={[{ required: true, message: 'Please select customer type' }]}>
              <Select placeholder="Select customer type">
                <Option value="B2C">B2C (Business to Consumer)</Option>
                <Option value="B2B">B2B (Business to Business)</Option>
              </Select>
            </Form.Item>
            <Form.Item label="Email" name="email" rules={[{ type: 'email', message: 'Please enter a valid email' }]}>
              <Input placeholder="Enter email (optional)" />
            </Form.Item>
            <Form.Item label="Phone" name="phone">
              <Input placeholder="Enter phone number (optional)" />
            </Form.Item>
            <Form.Item label="Address" name="address">
              <Input.TextArea placeholder="Enter address (optional)" rows={3} />
            </Form.Item>
          </Form>
        </Modal>
      </div>
    </MainLayout>
  );
}
