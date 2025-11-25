'use client';

import React, { useState } from 'react';

import { Table, Button, Input, Select, Tag, Space, Card, Form, Drawer, Modal, Tabs, App } from 'antd';
import {
  PlusOutlined,
  SearchOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  ContactsOutlined,
  MailOutlined,
  PhoneOutlined,
  InboxOutlined,
  CheckCircleOutlined,
} from '@ant-design/icons';
import { useModal } from '@/hooks/useModal';
import { useQuery, useMutation } from '@apollo/client';
import { GET_SUPPLIERS } from '@/lib/graphql/queries';
import { CREATE_SUPPLIER, UPDATE_SUPPLIER, DELETE_SUPPLIER } from '@/lib/graphql/mutations';
import { useRouter } from 'next/navigation';

const { Search } = Input;
const { Option } = Select;

export default function SuppliersPage() {
  const { modal, message } = App.useApp(); // Use App context for modal and message
  const router = useRouter();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState<any>(null);
  const [searchText, setSearchText] = useState('');
  const addModal = useModal();
  const editModal = useModal();
  const [form] = Form.useForm();

  // GraphQL query for suppliers
  const { data, loading, error, refetch } = useQuery(GET_SUPPLIERS, {
    variables: {
      limit: 100,
      offset: 0,
    },
  });

  // GraphQL mutations
  const [createSupplier, { loading: creating }] = useMutation(CREATE_SUPPLIER, {
    onCompleted: () => {
      message.success('Supplier created successfully!');
      form.resetFields();
      addModal.close();
      refetch();
    },
    onError: (err) => {
      message.error(`Failed to create supplier: ${err.message}`);
    },
  });

  const [updateSupplier, { loading: updating }] = useMutation(UPDATE_SUPPLIER, {
    onCompleted: () => {
      message.success('Supplier updated successfully!');
      form.resetFields();
      editModal.close();
      refetch();
    },
    onError: (err) => {
      message.error(`Failed to update supplier: ${err.message}`);
    },
  });

  const [deleteSupplier] = useMutation(DELETE_SUPPLIER, {
    onCompleted: () => {
      message.success('Supplier deleted successfully!');
      refetch();
    },
    onError: (err) => {
      message.error(`Failed to delete supplier: ${err.message}`);
    },
  });

  // Get suppliers from GraphQL data
  const suppliers = data?.Supplier || [];

  // Filter suppliers by search text
  const filteredSuppliers = suppliers.filter((s: any) => {
    const matchesSearch = !searchText ||
      s.name?.toLowerCase().includes(searchText.toLowerCase()) ||
      s.email?.toLowerCase().includes(searchText.toLowerCase()) ||
      s.code?.toLowerCase().includes(searchText.toLowerCase());
    return matchesSearch;
  });

  const handleSubmit = async (values: any) => {
    try {
      if (selectedSupplier) {
        // UPDATE existing supplier
        await updateSupplier({
          variables: {
            id: selectedSupplier.id,
            set: {
              name: values.name,
              email: values.email || null,
              phone: values.phone || null,
              address: values.address || null,
              updatedAt: new Date().toISOString(),
            },
          },
        });
      } else {
        // CREATE new supplier
        const uuid = crypto.randomUUID();
        const supplierCode = `SUPP-${Date.now().toString().slice(-6)}`;

        await createSupplier({
          variables: {
            object: {
              id: uuid,
              code: supplierCode,
              name: values.name,
              email: values.email || null,
              phone: values.phone || null,
              address: values.address || null,
              companyId: '53c65d84-4606-4b0a-8aa5-6eda9e50c3df',
              updatedAt: new Date().toISOString(),
            },
          },
        });
      }
    } catch (error: any) {
      console.error('Error saving supplier:', error);
      message.error(error?.message || 'Failed to save supplier');
    }
  };

  const handleEdit = (record: any) => {
    setSelectedSupplier(record);
    form.setFieldsValue({
      name: record.name,
      email: record.email,
      phone: record.phone,
      address: record.address,
    });
    editModal.open();
  };

  const handleDelete = (record: any) => {
    modal.confirm({
      title: 'Delete Supplier',
      content: `Are you sure you want to delete supplier "${record.name}"? This action cannot be undone.`,
      okText: 'Delete',
      okType: 'danger',
      onOk: async () => {
        await deleteSupplier({ variables: { id: record.id } });
      },
    });
  };

  const handleAddSupplier = () => {
    setSelectedSupplier(null);
    form.resetFields();
    addModal.open();
  };

  const columns = [
    {
      title: 'Supplier Code',
      dataIndex: 'code',
      key: 'code',
      width: 130,
      render: (text: string) => (
        <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">{text}</span>
      ),
    },
    {
      title: 'Supplier Name',
      dataIndex: 'name',
      key: 'name',
      width: 200,
      render: (text: string) => (
        <div className="flex items-center gap-2">
          <ContactsOutlined className="text-blue-500" />
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
      title: 'Actions',
      key: 'actions',
      width: 200,
      render: (_: any, record: any) => (
        <Space>
          <Button
            type="link"
            icon={<EyeOutlined />}
            onClick={() => {
              setSelectedSupplier(record);
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

  return (
    <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Supplier Management
            </h1>
            <p className="text-gray-600 mt-1">Manage your supplier database and relationships</p>
          </div>
          <Button type="primary" icon={<PlusOutlined />} size="large" onClick={handleAddSupplier}>
            Add Supplier
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <div className="text-center">
              <p className="text-gray-500 text-sm">Total Suppliers</p>
              <p className="text-3xl font-bold text-blue-600">{filteredSuppliers.length}</p>
            </div>
          </Card>
          <Card>
            <div className="text-center">
              <p className="text-gray-500 text-sm">Active Suppliers</p>
              <p className="text-3xl font-bold text-green-600">{filteredSuppliers.length}</p>
            </div>
          </Card>
        </div>

        {/* Table */}
        <Card className="shadow-sm">
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
            dataSource={filteredSuppliers}
            rowKey="id"
            loading={loading}
            pagination={{
              total: filteredSuppliers.length,
              pageSize: 10,
              showSizeChanger: true,
              showTotal: (total) => `Total ${total} suppliers`,
            }}
          />
        </Card>

        {/* Details Drawer */}
        <Drawer
          title="Supplier Details"
          placement="right"
          width={600}
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
        >
          {selectedSupplier && (
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-lg">{selectedSupplier.name}</h3>
                <p className="text-gray-600">{selectedSupplier.email || 'No email provided'}</p>
              </div>
              <div className="border-t pt-4">
                <p><strong>Supplier Code:</strong> <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">{selectedSupplier.code}</span></p>
                <p><strong>Phone:</strong> {selectedSupplier.phone || 'Not provided'}</p>
                <p><strong>Address:</strong> {selectedSupplier.address || 'Not provided'}</p>
                <p className="text-xs text-gray-500 mt-4">Created: {new Date(selectedSupplier.createdAt).toLocaleDateString()}</p>
              </div>
            </div>
          )}
        </Drawer>

        {/* Add Modal */}
        <Modal
          title="Add Supplier"
          open={addModal.isOpen}
          onCancel={addModal.close}
          onOk={() => form.submit()}
          width={600}
          confirmLoading={creating}
        >
          <Form form={form} layout="vertical" onFinish={handleSubmit}>
            <Form.Item label="Supplier Name" name="name" rules={[{ required: true, message: 'Please enter supplier name' }]}>
              <Input placeholder="Enter supplier name" />
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

        {/* Edit Modal */}
        <Modal
          title="Edit Supplier"
          open={editModal.isOpen}
          onCancel={editModal.close}
          onOk={() => form.submit()}
          width={600}
          confirmLoading={updating}
        >
          <Form form={form} layout="vertical" onFinish={handleSubmit}>
            <Form.Item label="Supplier Name" name="name" rules={[{ required: true, message: 'Please enter supplier name' }]}>
              <Input placeholder="Enter supplier name" />
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
      );
}
