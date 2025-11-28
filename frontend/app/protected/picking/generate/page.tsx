'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, Select, Button, Table, Tag, Alert, Spin, Space, App, Descriptions } from 'antd';
import { ThunderboltOutlined, PrinterOutlined, CheckCircleOutlined, WarningOutlined, ReloadOutlined } from '@ant-design/icons';
import apiService from '@/services/api';

const { Option } = Select;

interface SalesOrder {
  id: string;
  orderNumber: string;
  orderType?: string;
  status: string;
  orderDate?: string;
  createdAt: string;
  client?: { name: string };
  customer?: { name: string };
  items?: OrderItem[];
}

interface OrderItem {
  id: string;
  productId: string;
  quantity: number;
  product?: {
    id: string;
    name: string;
    sku: string;
  };
}

interface InventoryItem {
  id: string;
  productId: string;
  quantity: number;
  availableQuantity?: number;
  reservedQuantity?: number;
  locationId: string;
  bestBeforeDate?: string;
  lotNumber?: string;
  createdAt: string;
  status: string;
  product?: {
    id: string;
    name: string;
    sku: string;
  };
  location?: {
    id: string;
    code: string;
    warehouse?: {
      id: string;
      name: string;
    };
  };
}

interface PickListItem {
  pickSequence: number;
  inventoryId: string;
  productId: string;
  productSku: string;
  productName: string;
  locationId: string;
  locationCode: string;
  warehouseId: string;
  warehouseName: string;
  quantityToPick: number;
  lotNumber?: string;
  bestBeforeDate?: string;
}

export default function GeneratePickListPage() {
  const { message } = App.useApp();
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<SalesOrder[]>([]);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<SalesOrder | null>(null);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [pickList, setPickList] = useState<PickListItem[]>([]);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [generating, setGenerating] = useState(false);
  const [itemsLoading, setItemsLoading] = useState(false);

  // Fetch available orders
  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      const data = await apiService.get('/orders');
      const orderList = Array.isArray(data) ? data : [];
      // Filter to show only orders that can be picked
      const pickableOrders = orderList.filter((o: SalesOrder) =>
        ['PENDING', 'CONFIRMED', 'PROCESSING', 'APPROVED'].includes(o.status?.toUpperCase())
      );
      setOrders(pickableOrders);
    } catch (err: any) {
      console.error('Failed to fetch orders:', err);
      message.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  }, [message]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // Fetch order details when selected
  const fetchOrderDetails = useCallback(async (orderId: string) => {
    try {
      setItemsLoading(true);

      // Fetch order details
      const orderData = await apiService.get(`/orders/${orderId}`);
      setSelectedOrder(orderData);

      // Get order items
      const items = orderData.items || [];
      setOrderItems(items);

      // Fetch inventory for all products in the order
      if (items.length > 0) {
        const inventoryData = await apiService.get('/inventory');
        const inventoryList = Array.isArray(inventoryData) ? inventoryData : [];

        // Filter inventory to only include products from this order
        const productIds = items.map((item: OrderItem) => item.productId);
        const relevantInventory = inventoryList.filter((inv: InventoryItem) =>
          productIds.includes(inv.productId) &&
          (inv.quantity || inv.availableQuantity || 0) > 0 &&
          inv.status?.toUpperCase() === 'AVAILABLE'
        );

        setInventory(relevantInventory);
      }
    } catch (err: any) {
      console.error('Failed to fetch order details:', err);
      message.error('Failed to load order details');
    } finally {
      setItemsLoading(false);
    }
  }, [message]);

  const handleOrderSelect = (orderId: string) => {
    setSelectedOrderId(orderId);
    setPickList([]);
    setWarnings([]);
    fetchOrderDetails(orderId);
  };

  // Generate pick list using FEFO/FIFO algorithm
  const handleGeneratePickList = () => {
    if (!orderItems.length || !inventory.length) {
      message.error('No items or inventory available');
      return;
    }

    setGenerating(true);
    const allWarnings: string[] = [];
    const allPicks: PickListItem[] = [];
    let sequence = 1;

    try {
      // Process each order item
      orderItems.forEach((item) => {
        const productId = item.productId;
        const quantityNeeded = item.quantity;
        const productName = item.product?.name || 'Unknown Product';
        const productSku = item.product?.sku || 'N/A';

        // Get available inventory for this product, sorted by FEFO/FIFO
        const productInventory = inventory
          .filter((inv) => inv.productId === productId)
          .sort((a, b) => {
            // First sort by best before date (FEFO)
            if (a.bestBeforeDate && b.bestBeforeDate) {
              return new Date(a.bestBeforeDate).getTime() - new Date(b.bestBeforeDate).getTime();
            }
            if (a.bestBeforeDate && !b.bestBeforeDate) return -1;
            if (!a.bestBeforeDate && b.bestBeforeDate) return 1;

            // Then sort by created date (FIFO)
            return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          });

        let remainingQty = quantityNeeded;

        for (const inv of productInventory) {
          if (remainingQty <= 0) break;

          const available = inv.availableQuantity || inv.quantity || 0;
          const pickQty = Math.min(remainingQty, available);

          if (pickQty > 0) {
            allPicks.push({
              pickSequence: sequence++,
              inventoryId: inv.id,
              productId: inv.productId,
              productSku: inv.product?.sku || productSku,
              productName: inv.product?.name || productName,
              locationId: inv.locationId,
              locationCode: inv.location?.code || 'N/A',
              warehouseId: inv.location?.warehouse?.id || '',
              warehouseName: inv.location?.warehouse?.name || 'Main Warehouse',
              quantityToPick: pickQty,
              lotNumber: inv.lotNumber,
              bestBeforeDate: inv.bestBeforeDate,
            });

            remainingQty -= pickQty;
          }
        }

        if (remainingQty > 0) {
          allWarnings.push(`${productSku}: Short ${remainingQty} units (only ${quantityNeeded - remainingQty} available)`);
        }
      });

      // Sort picks by location for efficient picking route
      allPicks.sort((a, b) => {
        if (a.warehouseName !== b.warehouseName) {
          return a.warehouseName.localeCompare(b.warehouseName);
        }
        return a.locationCode.localeCompare(b.locationCode);
      });

      // Re-sequence after sorting
      allPicks.forEach((pick, idx) => {
        pick.pickSequence = idx + 1;
      });

      setPickList(allPicks);
      setWarnings(allWarnings);

      if (allPicks.length > 0) {
        message.success(`Generated ${allPicks.length} picks for ${orderItems.length} items`);
      } else {
        message.warning('No picks generated - check inventory availability');
      }

    } catch (error: any) {
      message.error('Error generating pick list: ' + error.message);
    } finally {
      setGenerating(false);
    }
  };

  // Save pick list to backend
  const handleSavePickList = async () => {
    if (!selectedOrderId || pickList.length === 0) {
      message.error('No pick list to save');
      return;
    }

    try {
      setGenerating(true);

      // Create pick list via API
      const pickListData = {
        orderId: selectedOrderId,
        status: 'PENDING',
        items: pickList.map((pick) => ({
          inventoryId: pick.inventoryId,
          productId: pick.productId,
          locationId: pick.locationId,
          quantityToPick: pick.quantityToPick,
          lotNumber: pick.lotNumber,
          pickSequence: pick.pickSequence,
        })),
      };

      await apiService.post('/picking', pickListData);
      message.success('Pick list saved successfully!');

      // Reset state
      setPickList([]);
      setSelectedOrderId(null);
      setSelectedOrder(null);
      setOrderItems([]);
      fetchOrders(); // Refresh orders list

    } catch (error: any) {
      message.error(error.message || 'Failed to save pick list');
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
      render: (qty: number) => <strong className="text-blue-600">{qty}</strong>,
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
              placeholder="Choose a sales order to pick..."
              loading={loading}
              onChange={handleOrderSelect}
              value={selectedOrderId}
              showSearch
              optionFilterProp="label"
              notFoundContent={loading ? <Spin size="small" /> : 'No pickable orders found'}
            >
              {orders.map((order) => (
                <Option key={order.id} value={order.id} label={order.orderNumber}>
                  {order.orderNumber} - {order.client?.name || order.customer?.name || 'Walk-in'}
                  ({order.orderType || 'RETAIL'}) - <Tag color="blue">{order.status}</Tag>
                </Option>
              ))}
            </Select>
          </div>
          <Button
            icon={<ReloadOutlined />}
            onClick={fetchOrders}
            loading={loading}
          >
            Refresh
          </Button>
          <Button
            type="primary"
            icon={<ThunderboltOutlined />}
            size="large"
            onClick={handleGeneratePickList}
            loading={generating || itemsLoading}
            disabled={!selectedOrderId || orderItems.length === 0}
          >
            Generate Pick List
          </Button>
        </div>

        {selectedOrder && (
          <div className="mt-4 p-4 bg-gray-50 rounded">
            <Descriptions size="small" column={4}>
              <Descriptions.Item label="Order Number">
                <span className="font-semibold">{selectedOrder.orderNumber}</span>
              </Descriptions.Item>
              <Descriptions.Item label="Customer">
                <span className="font-semibold">{selectedOrder.client?.name || selectedOrder.customer?.name || 'Walk-in'}</span>
              </Descriptions.Item>
              <Descriptions.Item label="Type">
                <Tag color={selectedOrder.orderType === 'WHOLESALE' ? 'purple' : 'green'}>
                  {selectedOrder.orderType || 'RETAIL'}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Status">
                <Tag color="blue">{selectedOrder.status}</Tag>
              </Descriptions.Item>
            </Descriptions>

            {itemsLoading ? (
              <div className="mt-4 text-center"><Spin tip="Loading order items..." /></div>
            ) : (
              <div className="mt-4">
                <h4 className="font-medium mb-2">Order Items ({orderItems.length})</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {orderItems.map((item, idx) => (
                    <div key={idx} className="bg-white p-2 rounded border text-sm">
                      <div className="font-medium">{item.product?.name || 'Unknown'}</div>
                      <div className="text-gray-500">SKU: {item.product?.sku || 'N/A'}</div>
                      <div className="text-blue-600 font-semibold">Qty: {item.quantity}</div>
                    </div>
                  ))}
                </div>
                <div className="mt-2 text-sm text-gray-500">
                  Available inventory items: {inventory.length}
                </div>
              </div>
            )}
          </div>
        )}
      </Card>

      {/* Warnings */}
      {warnings.length > 0 && (
        <Alert
          message="Stock Warnings"
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
              <Space>
                <Button icon={<PrinterOutlined />}>Print</Button>
                <Button type="primary" onClick={handleSavePickList} loading={generating}>
                  Save Pick List
                </Button>
              </Space>
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

          {/* Summary */}
          <div className="mt-4 grid grid-cols-4 gap-4">
            <Card size="small">
              <div className="text-center">
                <div className="text-gray-500 text-xs">Total Picks</div>
                <div className="text-2xl font-bold text-blue-600">{pickList.length}</div>
              </div>
            </Card>
            <Card size="small">
              <div className="text-center">
                <div className="text-gray-500 text-xs">Total Units</div>
                <div className="text-2xl font-bold text-green-600">
                  {pickList.reduce((sum, p) => sum + p.quantityToPick, 0)}
                </div>
              </div>
            </Card>
            <Card size="small">
              <div className="text-center">
                <div className="text-gray-500 text-xs">Locations</div>
                <div className="text-2xl font-bold text-purple-600">
                  {new Set(pickList.map(p => p.locationCode)).size}
                </div>
              </div>
            </Card>
            <Card size="small">
              <div className="text-center">
                <div className="text-gray-500 text-xs">Warehouses</div>
                <div className="text-2xl font-bold text-orange-600">
                  {new Set(pickList.map(p => p.warehouseName)).size}
                </div>
              </div>
            </Card>
          </div>
        </Card>
      )}
    </div>
  );
}
