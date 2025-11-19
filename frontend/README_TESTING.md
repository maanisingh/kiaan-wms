# 🧪 WMS Testing Setup - Quick Start

## 📋 Prerequisites

1. **WMS application running on port 3011**
   ```bash
   npm start
   ```

2. **Browsers installed**
   ```bash
   npm run install:browsers
   ```

## 🚀 Quick Test Commands

### Run All Tests
```bash
npm test
```

### Run Specific Test Suites
```bash
npm run test:products        # Product CRUD tests
npm run test:forms          # Form validation tests  
npm run test:navigation     # Navigation & routing tests
npm run test:workflows      # Complete user workflows
npm run test:accessibility  # Accessibility tests
```

### Interactive Testing
```bash
npm run test:ui             # Beautiful UI mode
npm run test:headed         # See browser in action
npm run test:debug          # Step-by-step debugging
npm run test:codegen        # Auto-generate tests
```

### Browser-Specific Tests
```bash
npm run test:chrome         # Chrome only
npm run test:firefox        # Firefox only
npm run test:safari         # Safari only
```

### View Reports
```bash
npm run test:report         # Open HTML report
```

## 📊 Test Coverage

### ✅ Created Test Files

1. **products.spec.ts** (8 tests)
   - Display products list
   - Navigate to detail page
   - Navigate to edit page
   - Form validation
   - Search functionality
   - Filter by status

2. **forms.spec.ts** (7 tests)
   - Required field validation
   - Email format validation
   - Modal open/close
   - Form submission
   - Dropdown selections
   - Date picker
   - Number input validation

3. **navigation.spec.ts** (9 tests)
   - Navigate all main pages
   - Sidebar menu navigation
   - Browser back button
   - Deep linking
   - Submenu expansion
   - Active menu highlighting
   - Breadcrumbs
   - Footer navigation

4. **workflows.spec.ts** (8 tests)
   - Complete product creation flow
   - Warehouse management flow
   - Sales order processing
   - Purchase order to receiving
   - Pick-pack-ship workflow
   - Return processing
   - User management
   - Inventory adjustment

5. **accessibility.spec.ts** (12 tests)
   - No accessibility violations
   - Proper heading hierarchy
   - Accessible button labels
   - Form labels
   - Image alt text
   - Link descriptions
   - Color contrast
   - Keyboard navigation
   - Skip links
   - Table headers
   - Modal focus trap
   - Error message association

### 📈 Total: 44 Test Cases

## 🎯 What Each Tool Tests

| Tool | Purpose | Command |
|------|---------|---------|
| **Playwright** | E2E flows, forms, navigation | `npm test` |
| **ESLint** | Code quality | `npm run lint` |
| **TypeScript** | Type safety | `tsc --noEmit` |

## 🔧 Troubleshooting

### Tests fail with "Target closed"
**Solution**: Make sure WMS is running on port 3011
```bash
pm2 status wms-frontend
```

### Browser not found
**Solution**: Install browsers
```bash
npm run install:browsers
```

### Port already in use
**Solution**: Stop other processes on port 3011
```bash
lsof -ti:3011 | xargs kill -9
```

## 📝 Writing New Tests

### Example: Testing a new page

```typescript
import { test, expect } from '@playwright/test';

test.describe('My New Feature', () => {
  test('should work correctly', async ({ page }) => {
    // Navigate
    await page.goto('/my-feature');

    // Interact
    await page.locator('button').click();

    // Assert
    await expect(page.locator('h1')).toBeVisible();
  });
});
```

## 🎨 Best Practices

1. ✅ Use data-testid for critical elements
2. ✅ Test user workflows, not implementation
3. ✅ Keep tests independent
4. ✅ Use meaningful test descriptions
5. ✅ Clean up after tests
6. ✅ Use page object pattern for complex pages
7. ✅ Mock external APIs
8. ✅ Test edge cases and errors

## 📚 Resources

- [Full Testing Guide](./TESTING_GUIDE.md)
- [Playwright Docs](https://playwright.dev)
- [Best Practices](https://playwright.dev/docs/best-practices)

---

**Last Updated**: November 17, 2024
