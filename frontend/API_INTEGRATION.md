# API Integration Guide

This guide explains how to connect the frontend to a real backend API.

## Current State

The application currently uses **mock data** generated with Faker.js. All API calls return simulated responses with realistic data.

## Backend Integration Steps

### 1. Environment Configuration

Update `.env.local` with your backend URL:

```env
NEXT_PUBLIC_API_URL=https://your-api-domain.com/api
```

### 2. Authentication Flow

#### Update Auth Store

File: `store/authStore.ts`

Replace the mock login implementation:

```typescript
login: async (email: string, password: string) => {
  set({ isLoading: true });
  try {
    // Replace this with actual API call
    const response = await apiService.post('/auth/login', {
      email,
      password,
    });

    const { user, token } = response.data;

    set({
      user,
      token,
      isAuthenticated: true,
      isLoading: false,
    });

    // Store token for subsequent requests
    localStorage.setItem('wms_auth_token', token);
  } catch (error) {
    set({ isLoading: false });
    throw error;
  }
},
```

### 3. Update API Services

#### Products Service Example

File: `services/products.service.ts`

Replace mock implementation with real API calls:

```typescript
async getProducts(params?: FilterParams): Promise<ListResponse<Product>> {
  const queryString = buildQueryString(params || {});
  const response = await apiService.get(`/products${queryString}`);
  return response.data;
}

async getProduct(id: string): Promise<Product> {
  const response = await apiService.get(`/products/${id}`);
  return response.data;
}

async createProduct(data: Partial<Product>): Promise<Product> {
  const response = await apiService.post('/products', data);
  return response.data;
}

async updateProduct(id: string, data: Partial<Product>): Promise<Product> {
  const response = await apiService.put(`/products/${id}`, data);
  return response.data;
}

async deleteProduct(id: string): Promise<void> {
  await apiService.delete(`/products/${id}`);
}
```

#### Orders Service Example

File: `services/orders.service.ts`

```typescript
async getOrders(params?: FilterParams): Promise<ListResponse<SalesOrder>> {
  const queryString = buildQueryString(params || {});
  const response = await apiService.get(`/sales-orders${queryString}`);
  return response.data;
}

async createOrder(data: Partial<SalesOrder>): Promise<SalesOrder> {
  const response = await apiService.post('/sales-orders', data);
  return response.data;
}

// ... other methods
```

### 4. Expected API Response Format

#### Success Response

```json
{
  "success": true,
  "data": {
    // Your data here
  },
  "message": "Operation successful"
}
```

#### List Response with Pagination

```json
{
  "success": true,
  "data": {
    "items": [...],
    "pagination": {
      "page": 1,
      "pageSize": 20,
      "total": 150
    }
  }
}
```

#### Error Response

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": {
      "field": "email",
      "message": "Invalid email format"
    }
  }
}
```

### 5. API Endpoints

The backend should implement these endpoints:

#### Authentication
- `POST /auth/login` - User login
- `POST /auth/register` - User registration
- `POST /auth/logout` - User logout
- `POST /auth/refresh` - Refresh token
- `POST /auth/forgot-password` - Request password reset
- `POST /auth/reset-password` - Reset password

#### Users
- `GET /users` - List users
- `GET /users/:id` - Get user
- `POST /users` - Create user
- `PUT /users/:id` - Update user
- `DELETE /users/:id` - Delete user

#### Companies
- `GET /companies` - List companies
- `GET /companies/:id` - Get company
- `POST /companies` - Create company
- `PUT /companies/:id` - Update company
- `DELETE /companies/:id` - Delete company

#### Warehouses
- `GET /warehouses` - List warehouses
- `GET /warehouses/:id` - Get warehouse
- `POST /warehouses` - Create warehouse
- `PUT /warehouses/:id` - Update warehouse
- `DELETE /warehouses/:id` - Delete warehouse

#### Products
- `GET /products` - List products (with filters)
- `GET /products/:id` - Get product
- `POST /products` - Create product
- `PUT /products/:id` - Update product
- `DELETE /products/:id` - Delete product
- `POST /products/import` - Import from CSV
- `GET /products/export` - Export to CSV

#### Inventory
- `GET /inventory` - List inventory
- `GET /inventory/:id` - Get inventory item
- `POST /inventory/adjustments` - Create adjustment
- `GET /inventory/adjustments` - List adjustments
- `POST /inventory/cycle-counts` - Create cycle count
- `GET /inventory/movements` - List movements

#### Sales Orders
- `GET /sales-orders` - List orders
- `GET /sales-orders/:id` - Get order
- `POST /sales-orders` - Create order
- `PUT /sales-orders/:id` - Update order
- `POST /sales-orders/:id/allocate` - Allocate order
- `POST /sales-orders/:id/cancel` - Cancel order

#### Purchase Orders
- `GET /purchase-orders` - List POs
- `GET /purchase-orders/:id` - Get PO
- `POST /purchase-orders` - Create PO
- `PUT /purchase-orders/:id` - Update PO
- `POST /purchase-orders/:id/approve` - Approve PO

#### Shipments
- `GET /shipments` - List shipments
- `GET /shipments/:id` - Get shipment
- `POST /shipments` - Create shipment
- `PUT /shipments/:id` - Update shipment

#### Reports
- `GET /reports` - List reports
- `POST /reports/generate` - Generate report
- `GET /reports/:id/download` - Download report

### 6. Authentication Headers

The API client automatically adds auth headers:

```typescript
// In services/api.ts
config.headers.Authorization = `Bearer ${token}`;
```

Ensure your backend validates this JWT token.

### 7. Multi-tenant Support

The API client adds company/warehouse headers:

```typescript
config.headers['X-Company-ID'] = companyId;
config.headers['X-Warehouse-ID'] = warehouseId;
```

Your backend should:
- Validate these headers
- Filter data by company/warehouse
- Enforce access control

### 8. Error Handling

The API client has global error handling:

```typescript
// 401 - Redirect to login
if (error.response?.status === 401) {
  localStorage.removeItem('wms_auth_token');
  window.location.href = '/auth/login';
}

// 403 - Access denied
if (error.response?.status === 403) {
  console.error('Access denied');
}
```

Ensure your backend returns appropriate HTTP status codes.

### 9. File Uploads

For file uploads (product images, CSV imports):

```typescript
async uploadImage(file: File): Promise<string> {
  const formData = new FormData();
  formData.append('file', file);

  const response = await apiService.post('/upload/image', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  return response.data.url;
}
```

### 10. Real-time Updates (Optional)

For real-time features, use WebSockets:

```typescript
// Create WebSocket connection
const ws = new WebSocket('wss://your-api-domain.com/ws');

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  // Handle real-time updates
};
```

### 11. Testing

Test your API integration:

1. **Unit Tests:** Test individual service methods
2. **Integration Tests:** Test full workflows
3. **E2E Tests:** Test user journeys

Example test:

```typescript
import { productService } from '@/services/products.service';

describe('Product Service', () => {
  it('should fetch products', async () => {
    const result = await productService.getProducts();
    expect(result.items).toBeDefined();
    expect(result.pagination).toBeDefined();
  });
});
```

### 12. Rate Limiting

Handle rate limits from backend:

```typescript
// In services/api.ts response interceptor
if (error.response?.status === 429) {
  message.warning('Too many requests. Please wait a moment.');
}
```

### 13. Caching Strategy

React Query is configured for caching:

```typescript
// In app/providers.tsx
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000, // 1 minute
      refetchOnWindowFocus: false,
    },
  },
});
```

Adjust based on your data freshness requirements.

### 14. API Documentation

Document your backend API:
- Use OpenAPI/Swagger
- Include request/response examples
- Document authentication requirements
- List all error codes

### 15. Security Considerations

- **HTTPS Only:** Use HTTPS in production
- **CORS:** Configure CORS on backend
- **Token Expiry:** Implement token refresh
- **Input Validation:** Validate on both frontend and backend
- **SQL Injection:** Use parameterized queries
- **XSS Protection:** Sanitize user input

### 16. Monitoring

Add monitoring for:
- API response times
- Error rates
- Failed requests
- Authentication failures

### 17. Deployment Checklist

- [ ] Update `NEXT_PUBLIC_API_URL` for production
- [ ] Test all API endpoints
- [ ] Verify authentication flow
- [ ] Test file uploads
- [ ] Verify multi-tenant isolation
- [ ] Load test critical endpoints
- [ ] Set up error tracking (Sentry, etc.)
- [ ] Configure CDN for static assets
- [ ] Enable gzip compression
- [ ] Set up API rate limiting

## Quick Start for Backend Developers

1. Review the TypeScript types in `types/index.ts`
2. Implement endpoints matching the structure
3. Return responses in the expected format
4. Test with the frontend
5. Update API documentation

## Support

If you encounter issues:
- Check browser console for errors
- Verify API response format
- Check network tab in DevTools
- Ensure CORS is configured
- Validate authentication headers

## Next Steps

After successful integration:
- Remove mock data files
- Remove sleep delays from services
- Update documentation
- Train team on API usage
- Set up monitoring and alerts
