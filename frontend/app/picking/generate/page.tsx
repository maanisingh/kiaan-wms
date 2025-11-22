'use client';

import React, { useState } from 'react';
import { useQuery, useMutation } from '@apollo/client/react';
import { gql } from '@apollo/client';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, Select, Button, Table, Tag, Alert, Spin, Space, message } from 'antd';
import { ThunderboltOutlined, PrinterOutlined, CheckCircleOutlined, WarningOutlined } from '@ant-design/icons';
import { generatePickList } from '@/lib/algorithms/picking';
import type { InventoryItem, PickRequest, PickListItem } from '@/lib/algorithms/picking';

const { Option } = Select;

// GraphQL Queries
const GET_SALES_ORDERS = gql`
  query GetSalesOrders {
    SalesOrder(
      where: { status: { _in: ["CONFIRMED", "PENDING"] } }
      order_by: { createdAt: desc }
      limit: 50
    ) {
      id
      orderNumber
      orderType
      status
      orderDate
      Customer {
        name
      }
    }
  }
`;

const GET_INVENTORY_FOR_ORDER = gql`
  query GetInventoryForOrder($productIds: [uuid!]!) {
    Inventory(
      where: {
        productId: { _in: $productIds }
        availableQuantity: { _gt: 0 }
        status: { _eq: "AVAILABLE" }
      }
      order_by: [
        { bestBeforeDate: asc_nulls_last }
        { createdAt: asc }
      ]
    ) {
      id
      productId
      quantity
      availableQuantity
      reservedQuantity
      locationId
      bestBeforeDate
      lotNumber
      createdAt
      status
      Product {
        id
        name
        sku
      }
      Location {
        code
        Warehouse {
          name
        }
      }
    }
  }
`;

const GET_ORDER_ITEMS = gql`
  query GetOrderItems($orderId: uuid!) {
    SalesOrderItem(where: { salesOrderId: { _eq: $orderId } }) {
      id
      productId
      quantity
      Product {
        id
        name
        sku
      }
    }
  }
`;

export default function GeneratePickListPage() {
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [pickList, setPickList] = useState<PickListItem[]>([]);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [generating, setGenerating] = useState(false);

  // Fetch available orders
  const { data: ordersData, loading: ordersLoading } = useQuery(GET_SALES_ORDERS);

  // Fetch order items when order selected
  const { data: orderItemsData, loading: itemsLoading } = useQuery(GET_ORDER_ITEMS, {
    variables: { orderId: selectedOrderId },
    skip: !selectedOrderId,
  });

  // Fetch inventory for the products in the order
  const { data: inventoryData, loading: inventoryLoading } = useQuery(GET_INVENTORY_FOR_ORDER, {
    variables: {
      productIds: orderItemsData?.SalesOrderItem?.map((item: any) => item.productId) || [],
    },
    skip: !orderItemsData,
  });

  const selectedOrder = ordersData?.SalesOrder?.find((o: any) => o.id === selectedOrderId);

  const handleGeneratePickList = () => {
    if (!orderItemsData || !inventoryData) {
      message.error('Unable to generate pick list');
      return;
    }

    setGenerating(true);
    const allWarnings: string[] = [];
    const allPicks: PickListItem[] = [];

    try {
      // Convert Hasura data to algorithm format
      const inventory: InventoryItem[] = inventoryData.Inventory.map((inv: any) => ({
        id: inv.id,
        productId: inv.productId,
        productName: inv.Product.name,
        productSku: inv.Product.sku,
        quantity: inv.quantity,
        availableQuantity: inv.availableQuantity,
        reservedQuantity: inv.reservedQuantity,
        locationId: inv.locationId,
        locationCode: inv.Location.code,
        warehouseId: inv.Location.Warehouse?.id || '',
        warehouseName: inv.Location.Warehouse?.name || '',
        bestBeforeDate: inv.bestBeforeDate,
        lotNumber: inv.lotNumber,
        createdAt: inv.createdAt,
        status: inv.status,
      }));

      // Generate picks for each order item
      orderItemsData.SalesOrderItem.forEach((item: any) => {
        const pickRequest: PickRequest = {
          productId: item.productId,
          quantityNeeded: item.quantity,
          orderType: selectedOrder?.orderType || 'RETAIL',
        };

        const result = generatePickList(inventory, pickRequest);

        if (result.warnings.length > 0) {
          allWarnings.push(`${item.Product.sku}: ${result.warnings.join(', ')}`);
        }

        allPicks.push(...result.pickList);
      });

      setPickList(allPicks);
      setWarnings(allWarnings);
      message.success(`Generated ${allPicks.length} picks`);

    } catch (error: any) {
      message.error('Error generating pick list: ' + error.message);
    } finally {
      setGenerating(false);
    }
  };

  const columns = [
    {
      title: 'Seq',
      dataIndex: 'pickSequence',
      key: 'sequence',
      width: 60,
      render: (seq: number) => <strong>{seq}</strong>,
    },
    {
      title: 'Product SKU',
      dataIndex: 'productSku',
      key: 'sku',
      width: 120,
    },
    {
      title: 'Product Name',
      dataIndex: 'productName',
      key: 'name',
      width: 200,
      ellipsis: true,
    },
    {
      title: 'Location',
      dataIndex: 'locationCode',
      key: 'location',
      width: 100,
      render: (code: string) => <Tag color="blue">{code}</Tag>,
    },
    {
      title: 'Warehouse',
      dataIndex: 'warehouseName',
      key: 'warehouse',
      width: 150,
    },
    {
      title: 'Qty to Pick',
      dataIndex: 'quantityToPick',
      key: 'quantity',
      width: 100,
      align: 'right' as const,
      render: (qty: number) => <strong>{qty}</strong>,
    },
    {
      title: 'Lot Number',
      dataIndex: 'lotNumber',
      key: 'lot',
      width: 120,
      render: (lot: string) => lot || '-',
    },
    {
      title: 'Best Before',
      dataIndex: 'bestBeforeDate',
      key: 'bestBefore',
      width: 120,
      render: (date: string) => {
        if (!date) return '-';
        const isExpiringSoon = new Date(date) < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
        return (
          <span className={isExpiringSoon ? 'text-red-600 font-semibold' : ''}>
            {new Date(date).toLocaleDateString()}
          </span>
        );
      },
    },
  ];

  return (
    <MainLayout>
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">Generate Pick List (FEFO/FIFO)</h1>
          <p className="text-gray-500">
            Uses intelligent picking algorithm - First-Expired-First-Out for items with expiry dates
          </p>
        </div>

        {/* Order Selection */}
        <Card className="mb-6">
          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <label className="block mb-2 font-medium">Select Order</label>
              <Select
                style={{ width: '100%' }}
                placeholder="Choose a sales order..."
                loading={ordersLoading}
                onChange={setSelectedOrderId}
                value={selectedOrderId}
                showSearch
                filterOption={(input, option) =>
                  (option?.children as string)?.toLowerCase().includes(input.toLowerCase())
                }
              >
                {ordersData?.SalesOrder?.map((order: any) => (
                  <Option key={order.id} value={order.id}>
                    {order.orderNumber} - {order.Customer.name} ({order.orderType})
                  </Option>
                ))}
              </Select>
            </div>
            <Button
              type="primary"
              icon={<ThunderboltOutlined />}
              size="large"
              onClick={handleGeneratePickList}
              loading={generating || itemsLoading || inventoryLoading}
              disabled={!selectedOrderId}
            >
              Generate Pick List
            </Button>
          </div>

          {selectedOrder && (
            <div className="mt-4 p-4 bg-gray-50 rounded">
              <div className="grid grid-cols-4 gap-4">
                <div>
                  <span className="text-gray-600">Order Number:</span>
                  <div className="font-semibold">{selectedOrder.orderNumber}</div>
                </div>
                <div>
                  <span className="text-gray-600">Customer:</span>
                  <div className="font-semibold">{selectedOrder.Customer.name}</div>
                </div>
                <div>
                  <span className="text-gray-600">Type:</span>
                  <div><Tag color={selectedOrder.orderType === 'WHOLESALE' ? 'purple' : 'green'}>{selectedOrder.orderType}</Tag></div>
                </div>
                <div>
                  <span className="text-gray-600">Status:</span>
                  <div><Tag color="blue">{selectedOrder.status}</Tag></div>
                </div>
              </div>
            </div>
          )}
        </Card>

        {/* Warnings */}
        {warnings.length > 0 && (
          <Alert
            message="Warnings"
            description={
              <ul className="list-disc ml-4">
                {warnings.map((warning, idx) => (
                  <li key={idx}>{warning}</li>
                ))}
              </ul>
            }
            type="warning"
            icon={<WarningOutlined />}
            showIcon
            className="mb-6"
          />
        )}

        {/* Pick List */}
        {pickList.length > 0 && (
          <Card
            title={
              <div className="flex justify-between items-center">
                <span>
                  <CheckCircleOutlined className="text-green-500 mr-2" />
                  Pick List Generated - {pickList.length} picks
                </span>
                <Button icon={<PrinterOutlined />}>Print</Button>
              </div>
            }
          >
            <Table
              dataSource={pickList}
              columns={columns}
              rowKey="inventoryId"
              pagination={false}
              scroll={{ x: 1200 }}
            />

            <div className="mt-4 p-4 bg-blue-50 rounded">
              <h3 className="font-semibold mb-2">Algorithm Info:</h3>
              <ul className="text-sm space-y-1">
                <li>✅ FEFO (First-Expired-First-Out) applied to items with expiry dates</li>
                <li>✅ FIFO (First-In-First-Out) applied to non-expiry items</li>
                <li>✅ Route optimized by warehouse and location</li>
                <li>✅ {selectedOrder?.orderType === 'WHOLESALE' ? 'Single-lot fulfillment attempted' : 'Multi-lot picking allowed'}</li>
              </ul>
            </div>
          </Card>
        )}
      </div>
    </MainLayout>
  );
}
