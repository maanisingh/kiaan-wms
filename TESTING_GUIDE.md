# 🧪 WMS Platform - Comprehensive Testing Guide

## Overview

This guide covers all open-source testing tools for comprehensive testing of the WMS platform including forms, flows, navigation, accessibility, performance, and visual regression.

---

## 🎯 **1. Playwright (E2E Testing) - PRIMARY TOOL**

### What it Tests
✅ Complete user flows and workflows
✅ Form validation and submissions
✅ Navigation and routing
✅ Button clicks and interactions
✅ Modal dialogs and popups
✅ API integrations
✅ Multi-browser compatibility
✅ Mobile responsiveness

### Installation
```bash
cd /root/kiaan-wms/frontend
npm install -D @playwright/test playwright
npx playwright install # Install browsers
```

### Run Tests
```bash
# Run all tests
npx playwright test

# Run specific test file
npx playwright test tests/e2e/products.spec.ts

# Run in headed mode (see browser)
npx playwright test --headed

# Run in debug mode
npx playwright test --debug

# Run in specific browser
npx playwright test --project=firefox

# Generate test report
npx playwright show-report
```

### Interactive Test Generation
```bash
# Auto-generate tests by recording actions
npx playwright codegen http://localhost:3011
```

### Test Files Created
- `tests/e2e/products.spec.ts` - Product CRUD operations
- `tests/e2e/forms.spec.ts` - Form validation & functionality
- `tests/e2e/navigation.spec.ts` - Navigation & routing
- `tests/e2e/workflows.spec.ts` - Complete user workflows

### Key Features
- ✅ **Auto-wait**: Waits for elements automatically
- ✅ **Screenshots**: Captures on failure
- ✅ **Videos**: Records test execution
- ✅ **Traces**: Full debugging traces
- ✅ **Parallel**: Runs tests in parallel
- ✅ **Multi-browser**: Chrome, Firefox, Safari

---

## 🧪 **2. Jest + React Testing Library (Unit/Component Testing)**

### What it Tests
✅ Individual React components
✅ Component props and state
✅ Hooks functionality
✅ Utility functions
✅ Component rendering

### Installation
```bash
npm install -D jest @testing-library/react @testing-library/jest-dom \
  @testing-library/user-event jest-environment-jsdom
```

### Example Component Test
```typescript
// __tests__/components/ProductCard.test.tsx
import { render, screen } from '@testing-library/react';
import ProductCard from '@/components/ProductCard';

test('renders product information', () => {
  const product = {
    name: 'Test Product',
    sku: 'TEST-001',
    price: 99.99
  };

  render(<ProductCard product={product} />);

  expect(screen.getByText('Test Product')).toBeInTheDocument();
  expect(screen.getByText('TEST-001')).toBeInTheDocument();
  expect(screen.getByText('$99.99')).toBeInTheDocument();
});
```

### Run Tests
```bash
npm test
npm test -- --coverage
```

---

## ♿ **3. Axe-core (Accessibility Testing)**

### What it Tests
✅ WCAG compliance
✅ Screen reader compatibility
✅ Keyboard navigation
✅ Color contrast
✅ ARIA labels
✅ Semantic HTML

### Installation
```bash
npm install -D @axe-core/playwright
```

### Example Accessibility Test
```typescript
// tests/e2e/accessibility.spec.ts
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test('should not have accessibility violations', async ({ page }) => {
  await page.goto('/products');

  const accessibilityScanResults = await new AxeBuilder({ page }).analyze();

  expect(accessibilityScanResults.violations).toEqual([]);
});
```

### Run Tests
```bash
npx playwright test tests/e2e/accessibility.spec.ts
```

---

## 📊 **4. Lighthouse (Performance & Best Practices)**

### What it Tests
✅ Page load performance
✅ SEO optimization
✅ Best practices
✅ Accessibility score
✅ Progressive Web App

### Installation
```bash
npm install -D lighthouse
```

### Run Lighthouse
```bash
# Command line
npx lighthouse http://localhost:3011 --view

# Generate report
npx lighthouse http://localhost:3011 \
  --output=html \
  --output-path=./lighthouse-report.html
```

### Playwright Integration
```bash
npm install -D playwright-lighthouse
```

```typescript
import { playAudit } from 'playwright-lighthouse';

test('should pass lighthouse audit', async ({ page }) => {
  await page.goto('/products');

  await playAudit({
    page,
    thresholds: {
      performance: 50,
      accessibility: 90,
      'best-practices': 80,
      seo: 80,
    },
  });
});
```

---

## 🎨 **5. BackstopJS (Visual Regression Testing)**

### What it Tests
✅ UI changes detection
✅ CSS regression
✅ Layout breakages
✅ Cross-browser visual differences

### Installation
```bash
npm install -D backstopjs
```

### Initialize
```bash
npx backstop init
```

### Configure (backstop.json)
```json
{
  "id": "wms_visual_regression",
  "viewports": [
    {
      "label": "phone",
      "width": 375,
      "height": 667
    },
    {
      "label": "desktop",
      "width": 1920,
      "height": 1080
    }
  ],
  "scenarios": [
    {
      "label": "Products Page",
      "url": "http://localhost:3011/products"
    },
    {
      "label": "Warehouses Page",
      "url": "http://localhost:3011/warehouses"
    }
  ]
}
```

### Run Tests
```bash
# Create reference images
npx backstop reference

# Run visual tests
npx backstop test

# Approve changes
npx backstop approve
```

---

## 🔍 **6. ESLint & Prettier (Code Quality)**

### What it Tests
✅ Code style consistency
✅ Best practices
✅ Potential bugs
✅ TypeScript errors

### Already Configured
Check with:
```bash
npm run lint
npm run format
```

---

## 📱 **7. Responsive Design Testing**

### Browser DevTools
```bash
# Chrome DevTools Device Mode
# Firefox Responsive Design Mode
# Safari Responsive Design Mode
```

### Playwright Responsive Tests
```typescript
test.describe('Responsive Design', () => {
  const devices = [
    { name: 'iPhone 12', width: 390, height: 844 },
    { name: 'iPad', width: 768, height: 1024 },
    { name: 'Desktop', width: 1920, height: 1080 },
  ];

  for (const device of devices) {
    test(`should render correctly on ${device.name}`, async ({ page }) => {
      await page.setViewportSize({
        width: device.width,
        height: device.height
      });

      await page.goto('/products');
      await expect(page.locator('h1')).toBeVisible();
    });
  }
});
```

---

## 🚀 **8. Load & Stress Testing**

### Artillery (Load Testing)
```bash
npm install -D artillery
```

Create `load-test.yml`:
```yaml
config:
  target: 'http://localhost:3011'
  phases:
    - duration: 60
      arrivalRate: 10
scenarios:
  - flow:
    - get:
        url: "/products"
    - get:
        url: "/warehouses"
```

Run:
```bash
npx artillery run load-test.yml
```

### k6 (Advanced Load Testing)
```bash
# Install k6
# https://k6.io/docs/getting-started/installation/

# Create test.js
k6 run test.js
```

---

## 📋 **Complete Testing Workflow**

### 1. Before Commit
```bash
# Lint code
npm run lint

# Type check
npm run type-check

# Unit tests
npm test

# E2E tests (critical paths)
npx playwright test tests/e2e/workflows.spec.ts
```

### 2. Before Deployment
```bash
# Full E2E suite
npx playwright test

# Accessibility audit
npx playwright test tests/e2e/accessibility.spec.ts

# Performance check
npx lighthouse http://localhost:3011

# Visual regression
npx backstop test
```

### 3. CI/CD Integration
```yaml
# .github/workflows/test.yml
name: Tests
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm install
      - run: npm run lint
      - run: npm test
      - run: npx playwright install
      - run: npx playwright test
```

---

## 📊 **Testing Dashboard & Reports**

### Playwright HTML Report
```bash
npx playwright show-report
```
Opens at: `http://localhost:9323`

### Coverage Report
```bash
npm test -- --coverage
```
Opens: `coverage/lcov-report/index.html`

### Lighthouse Report
```bash
npx lighthouse http://localhost:3011 --view
```

---

## 🎯 **Recommended Testing Strategy**

### Level 1: Critical (Run Always)
- ✅ ESLint/Prettier
- ✅ TypeScript type checking
- ✅ Critical workflow E2E tests

### Level 2: Pre-Deploy (Run Before Release)
- ✅ Full E2E test suite
- ✅ Accessibility tests
- ✅ Performance audit
- ✅ Unit tests

### Level 3: Weekly (Run Periodically)
- ✅ Visual regression tests
- ✅ Load testing
- ✅ Security audits
- ✅ Dependency updates

---

## 🔧 **Quick Start Commands**

```bash
# Install all testing tools
npm install -D @playwright/test @axe-core/playwright lighthouse backstopjs artillery

# Install browsers
npx playwright install

# Run comprehensive test suite
npm run test:all

# Generate test report
npm run test:report

# Run tests in watch mode
npm run test:watch

# Debug specific test
npx playwright test --debug tests/e2e/products.spec.ts
```

---

## 📚 **Additional Resources**

- [Playwright Docs](https://playwright.dev)
- [Testing Library](https://testing-library.com)
- [Axe Accessibility](https://www.deque.com/axe/)
- [Lighthouse](https://developers.google.com/web/tools/lighthouse)
- [BackstopJS](https://github.com/garris/BackstopJS)

---

## ✅ **Current Test Coverage**

### E2E Tests (Playwright)
- ✅ Products flow (CRUD operations)
- ✅ Form validation
- ✅ Navigation & routing
- ✅ Complete workflows
- ✅ Modal interactions
- ✅ Table operations

### Total Test Files: 4
### Total Test Cases: 40+

---

## 🎯 **Next Steps**

1. Run initial test suite: `npx playwright test`
2. Review failures and fix issues
3. Add more test coverage for custom features
4. Integrate into CI/CD pipeline
5. Set up automated reporting
6. Schedule regular test runs

---

**Last Updated**: November 17, 2024
