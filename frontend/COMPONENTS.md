# Components Reference

Complete list of components created for the Kiaan WMS frontend.

## Layout Components

### MainLayout
**Location:** `components/layout/MainLayout.tsx`

Main application layout with sidebar navigation and header.

**Features:**
- Collapsible sidebar with navigation menu
- Header with search, notifications, and user menu
- Responsive design
- Integration with auth and UI stores

**Usage:**
```tsx
<MainLayout>
  <YourPageContent />
</MainLayout>
```

## UI Components

### KPICard
**Location:** `components/ui/KPICard.tsx`

Card component for displaying KPIs with trend indicators.

**Props:**
- `title`: string - Card title
- `value`: string | number - Main value to display
- `change?`: number - Percentage change
- `trend?`: 'up' | 'down' | 'stable' - Trend direction
- `icon?`: ReactNode - Icon to display
- `suffix?`: string - Unit suffix (e.g., "units")
- `loading?`: boolean - Loading state
- `className?`: string - Additional classes

**Usage:**
```tsx
<KPICard
  title="Total Stock"
  value={10000}
  change={5.2}
  trend="up"
  icon={<DatabaseOutlined />}
  suffix="units"
/>
```

## Ant Design Components Used

### Core Components
- **Layout:** Layout, Header, Sider, Content
- **Navigation:** Menu, Breadcrumb, Dropdown
- **Data Display:** Table, Card, Tag, Badge, Avatar, Empty, Statistic
- **Data Entry:** Form, Input, Select, Checkbox, Radio, DatePicker, Upload
- **Feedback:** Message, Notification, Modal, Drawer, Spin, Progress
- **General:** Button, Icon, Typography

### Advanced Components
- **ProComponents:** Not yet implemented but can be added

## Chart Components

### Used from Libraries
- **Line Chart:** From react-chartjs-2
- **Bar Chart:** From react-chartjs-2
- **Doughnut Chart:** From react-chartjs-2
- **Recharts:** Available for more complex visualizations

**Configuration:**
- Responsive by default
- Consistent color palette from constants
- Proper legends and tooltips

## Form Components

All forms use:
- **React Hook Form** for form state management
- **Zod** for validation schemas
- **Ant Design Form** components for UI

**Pattern:**
```tsx
const form = useForm({
  resolver: zodResolver(schema),
});

<Form layout="vertical">
  <Form.Item label="Email" name="email">
    <Input />
  </Form.Item>
</Form>
```

## Table Components

Standard table pattern:

```tsx
<Table
  dataSource={data}
  columns={columns}
  rowKey="id"
  loading={loading}
  pagination={{
    pageSize: 20,
    showSizeChanger: true,
    showTotal: (total) => `Total ${total} items`,
  }}
  scroll={{ x: 1200 }}
/>
```

**Features:**
- Sortable columns
- Filterable data
- Pagination
- Responsive scrolling
- Row selection for bulk actions

## Custom Hooks

### useAuth
```tsx
const { user, login, logout } = useAuthStore();
```

### useUI
```tsx
const { theme, toggleTheme, sidebarCollapsed, toggleSidebar } = useUIStore();
```

## Utilities

### Format Functions
- `formatCurrency(amount, currency)` - Format money values
- `formatDate(date, format)` - Format dates
- `formatNumber(num, decimals)` - Format numbers
- `formatRelativeTime(date)` - Relative time (e.g., "2 hours ago")
- `formatFileSize(bytes)` - Format file sizes

### Helper Functions
- `getStatusColor(status)` - Get color for status tags
- `calculatePercentage(value, total)` - Calculate percentage
- `generateId()` - Generate unique IDs
- `debounce(func, wait)` - Debounce function calls
- `cn(...classes)` - Merge CSS classes (clsx + tailwind-merge)

### Validation
- `isValidEmail(email)` - Email validation
- `isValidPhone(phone)` - Phone validation
- `isEmpty(value)` - Check if value is empty

## State Management

### Zustand Stores

#### authStore
- `user`: Current user object
- `token`: Auth token
- `isAuthenticated`: boolean
- `login(email, password)`: Login function
- `logout()`: Logout function

#### uiStore
- `theme`: 'light' | 'dark'
- `sidebarCollapsed`: boolean
- `selectedWarehouseId`: string | null
- `selectedCompanyId`: string | null
- `toggleTheme()`: Toggle theme
- `toggleSidebar()`: Toggle sidebar

## Icon Usage

### Common Icons (from @ant-design/icons)

**Actions:**
- PlusOutlined - Create/Add
- EditOutlined - Edit
- DeleteOutlined - Delete
- EyeOutlined - View
- SaveOutlined - Save
- CloseOutlined - Close/Cancel

**Navigation:**
- HomeOutlined - Home/Dashboard
- ArrowLeftOutlined - Back
- ArrowRightOutlined - Forward
- UpOutlined - Up
- DownOutlined - Down

**Data:**
- SearchOutlined - Search
- FilterOutlined - Filter
- SortAscendingOutlined - Sort
- DownloadOutlined - Download/Export
- UploadOutlined - Upload/Import

**Status:**
- CheckCircleOutlined - Success
- CloseCircleOutlined - Error
- WarningOutlined - Warning
- InfoCircleOutlined - Info

**Business:**
- ShoppingCartOutlined - Orders
- InboxOutlined - Inventory
- DatabaseOutlined - Stock
- BoxPlotOutlined - Warehouse
- TeamOutlined - Users

## Responsive Patterns

### Grid System
```tsx
<Row gutter={[16, 16]}>
  <Col xs={24} sm={12} lg={6}>
    Content
  </Col>
</Row>
```

### Mobile-First Classes
```tsx
className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4"
```

## Loading States

### Spin Component
```tsx
<Spin spinning={loading}>
  Content
</Spin>
```

### Skeleton Screens
```tsx
<Card loading={loading}>
  Content
</Card>
```

### Table Loading
```tsx
<Table loading={loading} dataSource={data} />
```

## Empty States

```tsx
<Empty
  description="No data available"
  image={Empty.PRESENTED_IMAGE_SIMPLE}
>
  <Button type="primary">Create Item</Button>
</Empty>
```

## Modal Patterns

### Confirmation Modal
```tsx
Modal.confirm({
  title: 'Confirm Delete',
  content: 'Are you sure you want to delete this item?',
  onOk: handleDelete,
});
```

### Form Modal
```tsx
const [modalOpen, setModalOpen] = useState(false);

<Modal
  title="Create Item"
  open={modalOpen}
  onCancel={() => setModalOpen(false)}
  footer={null}
>
  <Form onFinish={handleSubmit}>
    {/* Form fields */}
  </Form>
</Modal>
```

## Drawer Patterns

### Filter Drawer
```tsx
<Drawer
  title="Advanced Filters"
  placement="right"
  open={drawerOpen}
  onClose={() => setDrawerOpen(false)}
  width={400}
>
  <Form layout="vertical">
    {/* Filter fields */}
  </Form>
</Drawer>
```

## Notification Patterns

### Success Message
```tsx
import { message } from 'antd';

message.success('Operation successful!');
```

### Error Message
```tsx
message.error('Operation failed!');
```

### Loading Message
```tsx
const hide = message.loading('Processing...', 0);
// Do work
hide();
message.success('Done!');
```

## Best Practices

1. **Consistency:** Use existing components and patterns
2. **Accessibility:** Include ARIA labels and keyboard support
3. **Performance:** Use React.memo for expensive components
4. **Responsiveness:** Test on mobile devices
5. **Error Handling:** Always handle errors gracefully
6. **Loading States:** Show feedback during async operations
7. **Validation:** Validate user input on both client and server
8. **Type Safety:** Use TypeScript types for all props

## Creating New Components

### Component Template

```tsx
'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface MyComponentProps {
  title: string;
  className?: string;
  children?: React.ReactNode;
}

export const MyComponent: React.FC<MyComponentProps> = ({
  title,
  className,
  children,
}) => {
  return (
    <div className={cn('base-classes', className)}>
      <h3>{title}</h3>
      {children}
    </div>
  );
};
```

## Component Library Expansion

To add more components:

1. Create component file in appropriate directory
2. Export from index file
3. Add to this documentation
4. Create Storybook story (if using Storybook)
5. Write tests
6. Update design system documentation

## Third-party Components

### Available for Use
- All Ant Design components
- All Ant Design Pro components
- Chart.js charts
- Recharts components
- QRCode.react for QR codes
- React-barcode for barcodes

### Integration Example

```tsx
import QRCode from 'qrcode.react';

<QRCode value={orderNumber} size={128} />
```

## Future Component Additions

Recommended components to build:
- [ ] Data grid with advanced filtering
- [ ] Timeline component for order tracking
- [ ] File uploader with drag-drop
- [ ] Image gallery with lightbox
- [ ] Tree view for hierarchical data
- [ ] Kanban board (partially implemented)
- [ ] Calendar/scheduler
- [ ] Rich text editor
- [ ] Barcode scanner interface
- [ ] Mobile-optimized picking interface
