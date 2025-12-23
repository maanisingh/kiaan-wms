const http = require('http');

const API_BASE = 'http://91.98.157.75:8010/api';
let TOKEN = '';

async function apiRequest(method, endpoint, data = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(API_BASE + endpoint);
    const options = {
      hostname: url.hostname,
      port: url.port || 80,
      path: url.pathname,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        ...(TOKEN && { 'Authorization': 'Bearer ' + TOKEN })
      },
      timeout: 10000
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(body) });
        } catch (e) {
          resolve({ status: res.statusCode, data: body });
        }
      });
    });

    req.on('error', (e) => resolve({ status: 0, error: e.message }));
    req.on('timeout', () => { req.destroy(); resolve({ status: 0, error: 'Timeout' }); });

    if (data) req.write(JSON.stringify(data));
    req.end();
  });
}

async function testEndpoint(name, method, endpoint, data = null, expectField = null) {
  const result = await apiRequest(method, endpoint, data);
  const items = Array.isArray(result.data) ? result.data : (result.data?.data || []);
  const count = Array.isArray(items) ? items.length : (result.data ? 1 : 0);
  const status = result.status >= 200 && result.status < 300 ? 'PASS' : 'FAIL';

  console.log(`  ${status === 'PASS' ? '✓' : '✗'} ${name}: ${result.status} (${count} items)`);

  if (expectField && items.length > 0) {
    const sample = items[0];
    console.log(`    Sample: ${JSON.stringify(sample).substring(0, 150)}...`);
  }

  return { name, status, count, statusCode: result.status };
}

async function main() {
  console.log('╔══════════════════════════════════════════════════════════════╗');
  console.log('║   KIAAN WMS - COMPREHENSIVE API & FUNCTIONALITY TEST        ║');
  console.log('╚══════════════════════════════════════════════════════════════╝');
  console.log('');

  const results = [];

  // 1. Health Check
  console.log('=== CORE API HEALTH ===');
  const health = await apiRequest('GET', '/health');
  console.log(`  ✓ Health: ${health.data?.status || 'ERROR'} - ${health.data?.message || ''}`);
  console.log(`    Database: ${health.data?.database || 'N/A'}`);
  results.push({ name: 'Health', status: health.data?.status === 'ok' ? 'PASS' : 'FAIL' });

  // 2. Authentication
  console.log('\n=== AUTHENTICATION ===');
  const login = await apiRequest('POST', '/auth/login', {
    email: 'admin@kiaan-wms.com',
    password: 'Admin@123'
  });

  if (login.data?.token) {
    TOKEN = login.data.token;
    console.log(`  ✓ Login: SUCCESS`);
    console.log(`    User: ${login.data.user?.name} (${login.data.user?.role})`);
    console.log(`    Company: ${login.data.user?.company?.name}`);
    results.push({ name: 'Authentication', status: 'PASS' });
  } else {
    console.log(`  ✗ Login: FAILED - ${login.data?.error || 'Unknown error'}`);
    results.push({ name: 'Authentication', status: 'FAIL' });
    return;
  }

  // 3. Core CRUD APIs
  console.log('\n=== CORE DATA APIs ===');
  results.push(await testEndpoint('Products', 'GET', '/products', null, true));
  results.push(await testEndpoint('Inventory', 'GET', '/inventory', null, true));
  results.push(await testEndpoint('Customers', 'GET', '/customers', null, true));
  results.push(await testEndpoint('Sales Orders', 'GET', '/sales-orders', null, true));
  results.push(await testEndpoint('Warehouses', 'GET', '/warehouses', null, true));
  results.push(await testEndpoint('Users', 'GET', '/users', null, true));

  // 4. Workflow APIs
  console.log('\n=== WORKFLOW APIs ===');
  results.push(await testEndpoint('Picking Tasks', 'GET', '/picking'));
  results.push(await testEndpoint('Packing Tasks', 'GET', '/packing'));

  // 5. Integration APIs
  console.log('\n=== INTEGRATION APIs ===');
  results.push(await testEndpoint('Integrations', 'GET', '/integrations', null, true));
  results.push(await testEndpoint('Settings', 'GET', '/settings'));

  // 6. Test CRUD Operations
  console.log('\n=== CRUD OPERATIONS ===');

  // Create a test product
  const newProduct = await apiRequest('POST', '/products', {
    name: 'API Test Product ' + Date.now(),
    sku: 'API-TEST-' + Date.now(),
    barcode: '999' + Date.now(),
    price: 19.99,
    cost: 9.99,
    category: 'Test Category',
    brand: 'Test Brand',
    status: 'ACTIVE'
  });

  if (newProduct.status === 201 || newProduct.data?.id) {
    console.log(`  ✓ Create Product: SUCCESS (ID: ${newProduct.data?.id || 'created'})`);
    results.push({ name: 'Create Product', status: 'PASS' });

    // Delete the test product
    if (newProduct.data?.id) {
      const deleted = await apiRequest('DELETE', '/products/' + newProduct.data.id);
      console.log(`  ✓ Delete Product: ${deleted.status === 200 || deleted.status === 204 ? 'SUCCESS' : 'PARTIAL'}`);
    }
  } else {
    console.log(`  ✗ Create Product: FAILED (${newProduct.status}) - ${JSON.stringify(newProduct.data).substring(0, 100)}`);
    results.push({ name: 'Create Product', status: 'FAIL' });
  }

  // 7. Role-based Access Control
  console.log('\n=== ROLE-BASED ACCESS CONTROL ===');

  const roles = [
    { email: 'picker@kiaan-wms.com', password: 'Admin@123', name: 'Picker' },
    { email: 'packer@kiaan-wms.com', password: 'Admin@123', name: 'Packer' },
    { email: 'viewer@kiaan-wms.com', password: 'Admin@123', name: 'Viewer' }
  ];

  for (const role of roles) {
    const roleLogin = await apiRequest('POST', '/auth/login', {
      email: role.email,
      password: role.password
    });

    if (roleLogin.data?.token) {
      console.log(`  ✓ ${role.name} Login: SUCCESS (Role: ${roleLogin.data.user?.role})`);
      results.push({ name: `${role.name} Auth`, status: 'PASS' });
    } else {
      console.log(`  ✗ ${role.name} Login: FAILED`);
      results.push({ name: `${role.name} Auth`, status: 'FAIL' });
    }
  }

  // Summary
  console.log('\n╔══════════════════════════════════════════════════════════════╗');
  console.log('║                    TEST SUMMARY                              ║');
  console.log('╚══════════════════════════════════════════════════════════════╝');

  const passed = results.filter(r => r.status === 'PASS').length;
  const failed = results.filter(r => r.status === 'FAIL').length;

  console.log(`\n  Total Tests: ${results.length}`);
  console.log(`  Passed: ${passed}`);
  console.log(`  Failed: ${failed}`);
  console.log(`  Success Rate: ${((passed / results.length) * 100).toFixed(1)}%`);

  console.log('\n  Results:');
  for (const r of results) {
    console.log(`    ${r.status === 'PASS' ? '✓' : '✗'} ${r.name}${r.count !== undefined ? ` (${r.count} items)` : ''}`);
  }

  // Data Summary
  console.log('\n=== DATA SUMMARY ===');
  const products = await apiRequest('GET', '/products');
  const inventory = await apiRequest('GET', '/inventory');
  const orders = await apiRequest('GET', '/sales-orders');
  const customers = await apiRequest('GET', '/customers');
  const integrations = await apiRequest('GET', '/integrations');

  const pCount = Array.isArray(products.data) ? products.data.length : (products.data?.data?.length || 0);
  const iCount = Array.isArray(inventory.data) ? inventory.data.length : (inventory.data?.data?.length || 0);
  const oCount = Array.isArray(orders.data) ? orders.data.length : (orders.data?.data?.length || 0);
  const cCount = Array.isArray(customers.data) ? customers.data.length : (customers.data?.data?.length || 0);
  const intCount = Array.isArray(integrations.data) ? integrations.data.length : (integrations.data?.data?.length || 0);

  console.log(`  Products: ${pCount}`);
  console.log(`  Inventory Items: ${iCount}`);
  console.log(`  Sales Orders: ${oCount}`);
  console.log(`  Customers: ${cCount}`);
  console.log(`  Integrations: ${intCount}`);

  // Show integrations detail
  if (intCount > 0) {
    console.log('\n  Active Integrations:');
    const intItems = Array.isArray(integrations.data) ? integrations.data : (integrations.data?.data || []);
    for (const int of intItems) {
      console.log(`    - ${int.name}: ${int.status} (${int.type})`);
    }
  }

  console.log('\n✅ API Functionality Test Complete!');
}

main().catch(console.error);
