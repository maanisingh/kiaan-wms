import type { SalesOrder, ListResponse, FilterParams } from '@/types';
import { mockSalesOrders } from '@/lib/mockData';
import { sleep } from '@/lib/utils';

class OrderService {
  async getOrders(params?: FilterParams): Promise<ListResponse<SalesOrder>> {
    await sleep(500);

    let filtered = [...mockSalesOrders];

    if (params?.search) {
      const search = params.search.toLowerCase();
      filtered = filtered.filter(
        o => o.orderNumber.toLowerCase().includes(search) ||
             o.customer?.name.toLowerCase().includes(search)
      );
    }

    if (params?.status) {
      filtered = filtered.filter(o => o.status === params.status);
    }

    if (params?.warehouseId) {
      filtered = filtered.filter(o => o.warehouseId === params.warehouseId);
    }

    const page = params?.page || 1;
    const pageSize = params?.pageSize || 20;
    const start = (page - 1) * pageSize;
    const end = start + pageSize;

    return {
      items: filtered.slice(start, end),
      pagination: {
        page,
        pageSize,
        total: filtered.length,
      },
    };
  }

  async getOrder(id: string): Promise<SalesOrder> {
    await sleep(300);

    const order = mockSalesOrders.find(o => o.id === id);
    if (!order) {
      throw new Error('Order not found');
    }

    return order;
  }

  async createOrder(data: Partial<SalesOrder>): Promise<SalesOrder> {
    await sleep(800);

    const newOrder: SalesOrder = {
      id: `order-${Date.now()}`,
      orderNumber: `SO${Date.now().toString().slice(-6)}`,
      companyId: data.companyId || '',
      customerId: data.customerId || '',
      warehouseId: data.warehouseId || '',
      channel: data.channel || 'direct',
      status: 'pending',
      priority: data.priority || 'normal',
      orderDate: new Date().toISOString(),
      shippingAddress: data.shippingAddress || {} as any,
      items: data.items || [],
      subtotal: data.subtotal || 0,
      tax: data.tax || 0,
      shipping: data.shipping || 0,
      discount: data.discount || 0,
      total: data.total || 0,
      currency: 'USD',
      shippingMethod: data.shippingMethod || 'Standard',
      tags: data.tags || [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    mockSalesOrders.push(newOrder);
    return newOrder;
  }

  async updateOrder(id: string, data: Partial<SalesOrder>): Promise<SalesOrder> {
    await sleep(800);

    const index = mockSalesOrders.findIndex(o => o.id === id);
    if (index === -1) {
      throw new Error('Order not found');
    }

    mockSalesOrders[index] = {
      ...mockSalesOrders[index],
      ...data,
      updatedAt: new Date().toISOString(),
    };

    return mockSalesOrders[index];
  }

  async cancelOrder(id: string): Promise<SalesOrder> {
    return this.updateOrder(id, { status: 'cancelled' });
  }

  async allocateOrder(id: string): Promise<SalesOrder> {
    return this.updateOrder(id, { status: 'allocated' });
  }
}

export const orderService = new OrderService();
export default orderService;
