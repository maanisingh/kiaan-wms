import type { Product, ListResponse, FilterParams } from '@/types';
import { mockProducts } from '@/lib/mockData';
import { sleep } from '@/lib/utils';

/**
 * Product Service - Handles all product-related API calls
 * Currently using mock data - replace with real API calls
 */
class ProductService {
  async getProducts(params?: FilterParams): Promise<ListResponse<Product>> {
    // Simulate API delay
    await sleep(500);

    let filtered = [...mockProducts];

    // Apply filters
    if (params?.search) {
      const search = params.search.toLowerCase();
      filtered = filtered.filter(
        p => p.name.toLowerCase().includes(search) ||
             p.sku.toLowerCase().includes(search) ||
             p.barcode?.toLowerCase().includes(search)
      );
    }

    if (params?.status) {
      filtered = filtered.filter(p => p.status === params.status);
    }

    if (params?.categoryId) {
      filtered = filtered.filter(p => p.categoryId === params.categoryId);
    }

    if (params?.companyId) {
      filtered = filtered.filter(p => p.companyId === params.companyId);
    }

    // Pagination
    const page = params?.page || 1;
    const pageSize = params?.pageSize || 20;
    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    const items = filtered.slice(start, end);

    return {
      items,
      pagination: {
        page,
        pageSize,
        total: filtered.length,
      },
    };
  }

  async getProduct(id: string): Promise<Product> {
    await sleep(300);

    const product = mockProducts.find(p => p.id === id);
    if (!product) {
      throw new Error('Product not found');
    }

    return product;
  }

  async createProduct(data: Partial<Product>): Promise<Product> {
    await sleep(800);

    const newProduct: Product = {
      id: `product-${Date.now()}`,
      sku: data.sku || `SKU${Date.now()}`,
      name: data.name || '',
      companyId: data.companyId || '',
      type: data.type || 'simple',
      status: data.status || 'active',
      dimensions: data.dimensions || {
        length: 0,
        width: 0,
        height: 0,
        weight: 0,
        unit: 'cm',
        weightUnit: 'kg',
      },
      pricing: data.pricing || {
        cost: 0,
        price: 0,
        currency: 'USD',
      },
      inventory: data.inventory || {
        reorderPoint: 0,
        reorderQuantity: 0,
        minStock: 0,
        maxStock: 0,
      },
      images: data.images || [],
      requiresSerial: data.requiresSerial || false,
      requiresBatch: data.requiresBatch || false,
      isPerishable: data.isPerishable || false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    mockProducts.push(newProduct);
    return newProduct;
  }

  async updateProduct(id: string, data: Partial<Product>): Promise<Product> {
    await sleep(800);

    const index = mockProducts.findIndex(p => p.id === id);
    if (index === -1) {
      throw new Error('Product not found');
    }

    mockProducts[index] = {
      ...mockProducts[index],
      ...data,
      updatedAt: new Date().toISOString(),
    };

    return mockProducts[index];
  }

  async deleteProduct(id: string): Promise<void> {
    await sleep(500);

    const index = mockProducts.findIndex(p => p.id === id);
    if (index !== -1) {
      mockProducts.splice(index, 1);
    }
  }

  async importProducts(file: File): Promise<{ success: number; failed: number }> {
    await sleep(2000);

    // Mock import result
    return {
      success: 45,
      failed: 5,
    };
  }

  async exportProducts(params?: FilterParams): Promise<Blob> {
    await sleep(1000);

    // Mock CSV export
    const csv = mockProducts.map(p =>
      `${p.sku},${p.name},${p.status},${p.pricing.price}`
    ).join('\n');

    return new Blob([csv], { type: 'text/csv' });
  }
}

export const productService = new ProductService();
export default productService;
