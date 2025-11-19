import { mockWarehouses, mockProducts, mockSalesOrders } from '@/lib/mockData';

export async function GET() {
  return Response.json({
    warehouses: mockWarehouses.map(w => ({ id: w.id, name: w.name })),
    products: mockProducts.slice(0, 5).map(p => ({ id: p.id, name: p.name })),
    orders: mockSalesOrders.slice(0, 5).map(o => ({ id: o.id, orderNumber: o.orderNumber }))
  });
}
