# Design System

This document outlines the design guidelines, component usage, and styling patterns for the Kiaan WMS frontend.

## Color Palette

### Primary Colors
- **Primary Blue:** `#1890ff` - Main brand color, primary buttons, links
- **Success Green:** `#52c41a` - Success states, positive actions
- **Warning Orange:** `#faad14` - Warnings, pending states
- **Error Red:** `#f5222d` - Errors, destructive actions, alerts

### Secondary Colors
- **Purple:** `#722ed1` - Picking/Packing, special highlights
- **Cyan:** `#13c2c2` - Allocation, info states
- **Geekblue:** `#2f54eb` - Alternative primary

### Neutral Colors
- **Gray Scale:**
  - Gray 1: `#ffffff` - White
  - Gray 2: `#fafafa` - Lightest gray
  - Gray 3: `#f5f5f5` - Background
  - Gray 4: `#f0f0f0` - Borders
  - Gray 5: `#d9d9d9` - Disabled backgrounds
  - Gray 6: `#bfbfbf` - Disabled text
  - Gray 7: `#8c8c8c` - Secondary text
  - Gray 8: `#595959` - Text
  - Gray 9: `#262626` - Headings
  - Gray 10: `#000000` - Black

## Typography

### Font Family
- **Primary:** Inter (via next/font/google)
- **Fallback:** -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto

### Font Sizes
- **H1:** 30px / 2rem (Page titles)
- **H2:** 24px / 1.5rem (Section headers)
- **H3:** 20px / 1.25rem (Subsection headers)
- **H4:** 16px / 1rem (Card titles)
- **Body:** 14px / 0.875rem (Default text)
- **Small:** 12px / 0.75rem (Helper text)

### Font Weights
- **Bold:** 700 (Headings, important text)
- **Semibold:** 600 (Labels, table headers)
- **Medium:** 500 (Buttons)
- **Regular:** 400 (Body text)

## Spacing

Based on 4px grid system:

- **xs:** 4px
- **sm:** 8px
- **md:** 16px
- **lg:** 24px
- **xl:** 32px
- **2xl:** 48px

## Component Styles

### Buttons

#### Primary Button
```tsx
<Button type="primary" size="large">
  Primary Action
</Button>
```
- Use for main actions (Create, Save, Submit)
- One primary button per screen/section

#### Secondary Button
```tsx
<Button size="large">
  Secondary Action
</Button>
```
- Use for secondary actions (Cancel, Back)

#### Danger Button
```tsx
<Button danger>
  Delete
</Button>
```
- Use for destructive actions (Delete, Remove)

### Cards

#### Standard Card
```tsx
<Card title="Card Title" extra={<Button>Action</Button>}>
  Card content
</Card>
```
- Use for grouping related information
- Include title and optional extra actions

#### Hoverable Card
```tsx
<Card hoverable>
  Interactive content
</Card>
```
- Use for clickable cards (product cards, warehouse cards)

### Tables

#### Standard Table
```tsx
<Table
  dataSource={data}
  columns={columns}
  rowKey="id"
  pagination={{ pageSize: 20, showSizeChanger: true }}
  scroll={{ x: 1200 }}
/>
```
- Always include pagination
- Set scroll for responsive tables
- Use rowKey for unique identification

### Forms

#### Form Layout
```tsx
<Form layout="vertical" size="large">
  <Form.Item label="Label" name="field" rules={[{ required: true }]}>
    <Input />
  </Form.Item>
</Form>
```
- Use vertical layout for better mobile support
- Include validation rules
- Show helpful error messages

### Tags

#### Status Tags
```tsx
<Tag color={getStatusColor(status)}>
  {status.toUpperCase()}
</Tag>
```
- Use helper function `getStatusColor()` for consistent colors
- Always uppercase status text

### KPI Cards

```tsx
<KPICard
  title="Total Stock"
  value={10000}
  change={5.2}
  trend="up"
  icon={<DatabaseOutlined />}
/>
```
- Use for dashboard metrics
- Include trend indicators
- Consistent icon placement

## Layout Guidelines

### Page Structure
```tsx
<MainLayout>
  <div className="space-y-6">
    {/* Page Header */}
    <div className="flex justify-between items-center">
      <div>
        <h1 className="text-3xl font-bold">Page Title</h1>
        <p className="text-gray-600 mt-1">Description</p>
      </div>
      <div className="flex gap-2">
        {/* Action buttons */}
      </div>
    </div>

    {/* Content sections */}
  </div>
</MainLayout>
```

### Grid System
```tsx
<Row gutter={[16, 16]}>
  <Col xs={24} sm={12} lg={6}>
    {/* Content */}
  </Col>
</Row>
```
- Use Ant Design Grid for responsive layouts
- Standard gutter: 16px

## Icons

### Icon Library
- Use Ant Design Icons
- Common icons:
  - `<PlusOutlined />` - Add/Create
  - `<EditOutlined />` - Edit
  - `<DeleteOutlined />` - Delete
  - `<EyeOutlined />` - View
  - `<SearchOutlined />` - Search
  - `<FilterOutlined />` - Filter
  - `<DownloadOutlined />` - Download/Export

### Icon Usage
- Always include icons with buttons for clarity
- Use consistent icon placement (left of text)

## Status Colors

### Order Statuses
- **Pending:** Orange
- **Confirmed:** Blue
- **Allocated:** Cyan
- **Picking:** Purple
- **Packing:** Purple
- **Shipped:** Green
- **Delivered:** Green
- **Cancelled:** Red
- **On Hold:** Orange

### Inventory Statuses
- **Available:** Green
- **Reserved:** Blue
- **Quarantine:** Orange
- **Damaged:** Red
- **Expired:** Red

### Priority Levels
- **Low:** Gray
- **Normal:** Blue
- **High:** Orange
- **Urgent:** Red

## Responsive Design

### Breakpoints
- **xs:** < 576px (Mobile)
- **sm:** ≥ 576px (Tablet)
- **md:** ≥ 768px (Small desktop)
- **lg:** ≥ 992px (Desktop)
- **xl:** ≥ 1200px (Large desktop)

### Mobile Considerations
- Stack columns on mobile (xs={24})
- Reduce padding/margins
- Collapse tables to scroll horizontally
- Use mobile-specific interfaces for picking/packing

## Accessibility

### Guidelines
- Maintain color contrast ratio ≥ 4.5:1
- Include alt text for images
- Use semantic HTML
- Support keyboard navigation
- Include ARIA labels where needed

## Component Examples

### Data Display Pattern
```tsx
<div className="grid grid-cols-2 gap-4">
  <div>
    <p className="text-sm text-gray-500">Label</p>
    <p className="font-semibold">Value</p>
  </div>
</div>
```

### Empty State Pattern
```tsx
<Empty
  description="No items found"
  image={Empty.PRESENTED_IMAGE_SIMPLE}
>
  <Button type="primary">Create New Item</Button>
</Empty>
```

### Loading State Pattern
```tsx
<Spin spinning={loading}>
  {/* Content */}
</Spin>
```

## Animation & Transitions

- Use Ant Design's built-in animations
- Hover transitions: 0.3s ease
- Page transitions: Smooth, subtle
- Loading states: Skeleton screens

## Best Practices

1. **Consistency:** Use the same patterns throughout
2. **Clarity:** Clear labels and instructions
3. **Feedback:** Always show loading/success/error states
4. **Efficiency:** Minimize clicks to complete tasks
5. **Accessibility:** Follow WCAG guidelines
6. **Responsiveness:** Test on multiple devices

## Utility Classes (Tailwind)

### Common Patterns
```tsx
// Spacing
className="space-y-6"  // Vertical spacing
className="gap-4"      // Grid/Flex gap

// Shadows
className="shadow-sm"   // Subtle shadow
className="shadow-md"   // Medium shadow
className="shadow-lg"   // Large shadow

// Rounded corners
className="rounded-lg"  // Large rounded

// Hover effects
className="hover:shadow-md transition-shadow"
```

## Dark Mode Support

Infrastructure is in place for dark mode:
- Theme toggle in UI store
- Ant Design theme configuration
- Tailwind dark mode classes

To activate:
```tsx
// Toggle theme
const { theme, toggleTheme } = useUIStore();
```

## Charts & Visualizations

### Chart.js Configuration
- Responsive: true
- Maintain aspect ratio
- Consistent color palette
- Clear labels and legends

### Example
```tsx
<Line
  data={chartData}
  options={{
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
      legend: { position: 'bottom' }
    }
  }}
/>
```

## Form Validation

### Rules
```tsx
rules={[
  { required: true, message: 'This field is required' },
  { type: 'email', message: 'Please enter a valid email' },
  { min: 3, message: 'Minimum 3 characters' },
  { max: 50, message: 'Maximum 50 characters' }
]}
```

### Custom Validation
Use Zod schemas for complex validation:
```tsx
import { z } from 'zod';

const schema = z.object({
  email: z.string().email(),
  quantity: z.number().positive(),
});
```

## Performance Guidelines

1. Use React.memo for expensive components
2. Implement virtualization for long lists
3. Lazy load heavy components
4. Optimize images with next/image
5. Use pagination for large datasets

## Resources

- [Ant Design Documentation](https://ant.design/)
- [Tailwind CSS Documentation](https://tailwindcss.com/)
- [Next.js Documentation](https://nextjs.org/)
- [Chart.js Documentation](https://www.chartjs.org/)
