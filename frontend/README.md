# Kiaan Technology Warehouse Management System (WMS) - Frontend

A complete, production-ready Next.js 14 frontend application for warehouse management with beautiful UI, comprehensive features, and modern architecture.

## Features

### Core Functionality
- **Multi-tenant Architecture** - Support for multiple companies with isolated data
- **Warehouse Management** - Manage multiple warehouses, zones, and locations
- **Product Catalog** - Complete product management with variants, bundles, and categories
- **Inventory Control** - Real-time stock tracking, adjustments, cycle counts, batch/serial numbers
- **Purchase Orders** - Create, approve, and track incoming shipments
- **Sales Orders** - Full order lifecycle from creation to delivery
- **Fulfillment** - Advanced picking and packing workflows
- **Shipping** - Multi-carrier integration and tracking
- **Returns (RMA)** - Complete return handling with inspection and restocking
- **Transfers** - Inter-warehouse and location transfers, FBA transfers
- **Marketplace Integration** - Connect with Amazon, Shopify, eBay, etc.
- **Reporting** - Customizable reports with scheduling
- **User Management** - Role-based access control and activity logs

### UI/UX Features
- **Beautiful Design** - Modern, clean interface with Ant Design + Tailwind CSS
- **Dark Mode Support** - Toggle between light and dark themes
- **Responsive** - Mobile-first design works on all devices
- **Data Visualization** - Charts and graphs using Chart.js and Recharts
- **Advanced Tables** - Sorting, filtering, pagination, column management
- **Kanban Boards** - Visual workflow for order management
- **Real-time Search** - Global search functionality
- **Keyboard Shortcuts** - Power user productivity features
- **Notifications** - Real-time alerts and notifications

## Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **UI Library:** Ant Design + Ant Design Pro Components
- **Styling:** Tailwind CSS
- **State Management:** Zustand
- **Data Fetching:** Axios + React Query
- **Forms:** React Hook Form + Zod validation
- **Charts:** Chart.js + Recharts
- **Icons:** Ant Design Icons

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Git

### Installation

1. Navigate to the frontend directory:
```bash
cd /root/kiaan-wms/frontend
```

2. Install dependencies:
```bash
npm install
```

3. Create environment file:
```bash
cp .env.local.example .env.local
```

4. Start development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

### Demo Credentials
- **Email:** admin@example.com
- **Password:** (any password works in demo mode)

## Available Scripts

```bash
# Development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linter
npm run lint

# Type check
npm run type-check
```

## Project Structure

```
frontend/
├── app/                          # Next.js App Router
│   ├── auth/                     # Authentication (Login, Register, Forgot Password)
│   ├── dashboard/                # Main dashboard with KPIs and charts
│   ├── companies/                # Multi-tenant company management
│   ├── warehouses/               # Warehouse, zones, locations management
│   ├── products/                 # Product catalog with variants & bundles
│   ├── inventory/                # Stock tracking, adjustments, cycle counts
│   ├── purchase-orders/          # Purchase orders management
│   ├── goods-receiving/          # GRN, QC, putaway
│   ├── customers/                # Customer management
│   ├── sales-orders/             # Sales orders (table & kanban views)
│   ├── picking/                  # Pick list management
│   ├── packing/                  # Packing interface
│   ├── shipments/                # Shipping & tracking
│   ├── returns/                  # RMA processing
│   ├── transfers/                # Stock transfers
│   ├── integrations/             # Marketplace integrations
│   ├── labels/                   # Label printing
│   ├── reports/                  # Reporting & analytics
│   └── users/                    # User management
├── components/
│   ├── ui/                       # Reusable UI components (KPICard, etc.)
│   ├── layout/                   # MainLayout with sidebar & header
│   ├── shared/                   # Shared components
│   ├── charts/                   # Chart components
│   └── forms/                    # Form components
├── lib/
│   ├── utils.ts                  # Utility functions
│   ├── constants.ts              # Application constants
│   └── mockData.ts               # Mock data with Faker.js
├── services/
│   ├── api.ts                    # Axios client with interceptors
│   ├── products.service.ts       # Product API service
│   └── orders.service.ts         # Orders API service
├── store/
│   ├── authStore.ts              # Authentication state (Zustand)
│   └── uiStore.ts                # UI preferences state
├── types/
│   └── index.ts                  # TypeScript type definitions
└── public/                       # Static assets
```

## Key Pages & Routes

### Authentication
- `/auth/login` - Login page
- `/auth/register` - Registration
- `/auth/forgot-password` - Password reset

### Main Application
- `/dashboard` - Main dashboard with KPIs, charts, recent activity
- `/companies` - Multi-tenant company management
- `/warehouses` - Warehouse management with capacity tracking
- `/products` - Product catalog with filtering and bulk actions
- `/inventory` - Inventory overview and stock tracking
- `/sales-orders` - Sales orders (table & kanban board views)
- `/picking` - Pick list queue and management
- `/packing` - Packing interface
- `/shipments` - Shipping and tracking

See `PAGES.md` for complete route listing.

## Mock Data

The application includes comprehensive mock data for testing:
- 5+ companies
- 10+ warehouses with zones and locations
- 50+ products across 8 categories
- 100+ inventory items
- 30+ customers
- 20+ sales orders with various statuses

All generated using `@faker-js/faker` for realistic data.

## API Integration

Currently using mock data. To connect to real backend:

1. Update `NEXT_PUBLIC_API_URL` in `.env.local`:
```env
NEXT_PUBLIC_API_URL=http://your-api-url/api
```

2. Replace mock implementations in `services/` directory with real API calls

3. Update authentication flow in `store/authStore.ts`

See `API_INTEGRATION.md` for detailed integration guide.

## Styling & Theming

### Colors
- Primary: #1890ff (Blue)
- Success: #52c41a (Green)
- Warning: #faad14 (Orange)
- Error: #f5222d (Red)

### Components
- Ant Design for UI components
- Tailwind CSS for utility styling
- Custom theme configuration in `app/providers.tsx`

See `DESIGN_SYSTEM.md` for complete design guidelines.

## Features Implemented

✅ Authentication (Login, Register, Forgot Password)
✅ Dashboard with KPIs and Charts
✅ Product Management (List, Create, Edit, Delete)
✅ Inventory Tracking
✅ Sales Orders (Table & Kanban views)
✅ Warehouse Management
✅ Multi-tenant Support
✅ Advanced Filtering & Search
✅ Bulk Actions
✅ Responsive Design
✅ Dark Mode Support (Infrastructure)
✅ Mock Data with Faker.js
✅ Type-safe with TypeScript
✅ State Management with Zustand
✅ Form Validation

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Performance

- Route-based code splitting
- Lazy loading for heavy components
- React Query caching
- Optimized bundle size
- Next.js Image optimization

## Documentation

- `README.md` - This file
- `DESIGN_SYSTEM.md` - Design guidelines and component usage
- `PAGES.md` - Complete page routing structure
- `API_INTEGRATION.md` - Backend integration guide

## Support

For issues or questions:
- Create an issue in the repository
- Email: support@kiaan.tech

## License

Proprietary - Kiaan Technology
