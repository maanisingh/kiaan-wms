'use client';

import React, { useState } from 'react';

import { Card, Form, Input, Select, Button, Row, Col, message, DatePicker, InputNumber, Table } from 'antd';
import { SaveOutlined, ArrowLeftOutlined, PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import { useMutation } from '@apollo/client';
import { ADJUST_INVENTORY } from '@/lib/graphql/mutations';

const { Option } = Select;
const { TextArea } = Input;

export default function NewStockAdjustmentPage() {
  const router = useRouter();
  const [form] = Form.useForm();
  const [adjustInventory, { loading }] = useMutation(ADJUST_INVENTORY);
  const [adjustmentItems, setAdjustmentItems] = useState<any[]>([]);

  const handleAddItem = () => {
    const newItem = {
      key: Date.now(),
      product: '',
      currentStock: 0,
      adjustmentQty: 0,
      newStock: 0,
      reason: '',
    };
    setAdjustmentItems([...adjustmentItems, newItem]);
  };

  const handleRemoveItem = (key: number) => {
    setAdjustmentItems(adjustmentItems.filter(item => item.key !== key));
  };

  const handleItemChange = (key: number, field: string, value: any) => {
    const updatedItems = adjustmentItems.map(item => {
      if (item.key === key) {
        const updated = { ...item, [field]: value };
        if (field === 'adjustmentQty' || field === 'currentStock') {
          updated.newStock = updated.currentStock + updated.adjustmentQty;
        }
        return updated;
      }
      return item;
    });
    setAdjustmentItems(updatedItems);
  };

  const handleSubmit = async (values: any) => {
    if (adjustmentItems.length === 0) {
      message.error('Please add at least one adjustment item');
      return;
    }

    try {
      // Process each adjustment item
      const adjustmentPromises = adjustmentItems.map(item =>
        adjustInventory({
          variables: {
            id: item.product, // This would be the inventory ID
            quantity: item.adjustmentQty,
            reason: values.reason || item.reason,
          },
        })
      );

      await Promise.all(adjustmentPromises);

      message.success('Stock adjustment created successfully!');
      router.push('/inventory/adjustments');
    } catch (error: any) {
      console.error('Error creating stock adjustment:', error);
      message.error(error?.message || 'Failed to create stock adjustment. Please try again.');
    }
  };

  const itemColumns = [
    {
      title: 'Product',
      dataIndex: 'product',
      key: 'product',
      width: '25%',
      render: (text: string, record: any) => (
        <Select
          style={{ width: '100%' }}
          placeholder="Select product"
          value={text || undefined}
          onChange={(value) => {
            handleItemChange(record.key, 'product', value);
            // Simulate fetching current stock
            handleItemChange(record.key, 'currentStock', Math.floor(Math.random() * 100));
          }}
        >
          <Option value="PROD-001">Laptop Stand - PRD-001</Option>
          <Option value="PROD-002">Wireless Mouse - PRD-002</Option>
          <Option value="PROD-003">USB-C Cable - PRD-003</Option>
        </Select>
      ),
    },
    {
      title: 'Current Stock',
      dataIndex: 'currentStock',
      key: 'currentStock',
      width: '15%',
      render: (value: number) => <span className="font-semibold">{value}</span>,
    },
    {
      title: 'Adjustment Qty',
      dataIndex: 'adjustmentQty',
      key: 'adjustmentQty',
      width: '15%',
      render: (value: number, record: any) => (
        <InputNumber
          value={value}
          onChange={(val) => handleItemChange(record.key, 'adjustmentQty', val || 0)}
          style={{ width: '100%' }}
        />
      ),
    },
    {
      title: 'New Stock',
      dataIndex: 'newStock',
      key: 'newStock',
      width: '15%',
      render: (value: number) => <span className="font-semibold text-blue-600">{value}</span>,
    },
    {
      title: 'Reason',
      dataIndex: 'reason',
      key: 'reason',
      width: '20%',
      render: (value: string, record: any) => (
        <Select
          style={{ width: '100%' }}
          placeholder="Select reason"
          value={value || undefined}
          onChange={(val) => handleItemChange(record.key, 'reason', val)}
        >
          <Option value="damaged">Damaged</Option>
          <Option value="expired">Expired</Option>
          <Option value="lost">Lost/Stolen</Option>
          <Option value="found">Found</Option>
          <Option value="count_correction">Count Correction</Option>
          <Option value="other">Other</Option>
        </Select>
      ),
    },
    {
      title: 'Action',
      key: 'action',
      width: '10%',
      render: (_: any, record: any) => (
        <Button
          type="link"
          danger
          icon={<DeleteOutlined />}
          onClick={() => handleRemoveItem(record.key)}
        >
          Remove
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button
            icon={<ArrowLeftOutlined />}
            onClick={() => router.back()}
          >
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold">New Stock Adjustment</h1>
            <p className="text-gray-600 mt-1">Adjust inventory quantities</p>
          </div>
        </div>

        <Card>
          <Form
            form={form}
            layout="vertical"
            onFinish={handleSubmit}
            initialValues={{
              type: 'manual',
              status: 'pending',
            }}
          >
            <h3 className="text-lg font-semibold mb-4">Adjustment Information</h3>

            <Row gutter={16}>
              <Col xs={24} md={12}>
                <Form.Item
                  label="Adjustment Number"
                  name="adjustmentNumber"
                  rules={[{ required: true, message: 'Please enter adjustment number' }]}
                >
                  <Input placeholder="ADJ-2024-001" size="large" />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item
                  label="Warehouse"
                  name="warehouseId"
                  rules={[{ required: true, message: 'Please select warehouse' }]}
                >
                  <Select size="large" placeholder="Select warehouse">
                    <Option value="1">Main Warehouse</Option>
                    <Option value="2">East Coast DC</Option>
                    <Option value="3">West Coast DC</Option>
                  </Select>
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col xs={24} md={12}>
                <Form.Item
                  label="Adjustment Date"
                  name="adjustmentDate"
                  rules={[{ required: true, message: 'Please select date' }]}
                >
                  <DatePicker size="large" style={{ width: '100%' }} />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item
                  label="Adjustment Type"
                  name="type"
                  rules={[{ required: true }]}
                >
                  <Select size="large">
                    <Option value="manual">Manual Adjustment</Option>
                    <Option value="cycle_count">Cycle Count</Option>
                    <Option value="physical_count">Physical Count</Option>
                    <Option value="damage">Damage Write-off</Option>
                  </Select>
                </Form.Item>
              </Col>
            </Row>

            <Form.Item label="Notes" name="notes">
              <TextArea rows={3} placeholder="Add notes or reason for adjustment..." />
            </Form.Item>

            <h3 className="text-lg font-semibold mb-4 mt-6">Adjustment Items</h3>

            <Table
              dataSource={adjustmentItems}
              columns={itemColumns}
              pagination={false}
              locale={{ emptyText: 'No items added yet' }}
              scroll={{ x: 800 }}
            />

            <Button
              type="dashed"
              onClick={handleAddItem}
              icon={<PlusOutlined />}
              block
              size="large"
              className="mt-4"
            >
              Add Item
            </Button>

            <div className="flex gap-4 mt-6">
              <Button
                type="primary"
                htmlType="submit"
                icon={<SaveOutlined />}
                size="large"
                loading={loading}
              >
                Create Adjustment
              </Button>
              <Button size="large" onClick={() => router.back()}>
                Cancel
              </Button>
            </div>
          </Form>
        </Card>
      </div>
      );
}
