const XLSX = require('xlsx');
const path = require('path');

// Create sample product data
const sampleData = [
  {
    'SKU': 'PROD-001',
    'Product Name': 'Organic Granola Bar',
    'Description': 'Healthy organic granola bar with nuts',
    'Barcode': '5012345678901',
    'Cost Price': 0.85,
    'Selling Price': 1.99,
    'Status': 'ACTIVE',
    'Type': 'SIMPLE',
    'Reorder Point': 50,
    'Max Stock Level': 500,
    'Brand': 'Nakd'
  },
  {
    'SKU': 'PROD-002',
    'Product Name': 'Protein Cookie',
    'Description': 'High protein cookie with chocolate chips',
    'Barcode': '5012345678902',
    'Cost Price': 1.20,
    'Selling Price': 2.49,
    'Status': 'ACTIVE',
    'Type': 'SIMPLE',
    'Reorder Point': 30,
    'Max Stock Level': 300,
    'Brand': 'Graze'
  },
  {
    'SKU': 'PROD-003',
    'Product Name': 'Energy Drink 500ml',
    'Description': 'Natural energy drink with vitamins',
    'Barcode': '5012345678903',
    'Cost Price': 0.75,
    'Selling Price': 1.79,
    'Status': 'ACTIVE',
    'Type': 'SIMPLE',
    'Reorder Point': 100,
    'Max Stock Level': 1000,
    'Brand': 'Monster'
  },
  {
    'SKU': 'PROD-004',
    'Product Name': 'Mixed Nuts 200g',
    'Description': 'Premium mixed nuts - almonds, cashews, walnuts',
    'Barcode': '5012345678904',
    'Cost Price': 2.50,
    'Selling Price': 4.99,
    'Status': 'ACTIVE',
    'Type': 'SIMPLE',
    'Reorder Point': 25,
    'Max Stock Level': 200,
    'Brand': 'Graze'
  },
  {
    'SKU': 'PROD-005',
    'Product Name': 'Fruit Snack Pack',
    'Description': 'Dried fruit snack pack',
    'Barcode': '5012345678905',
    'Cost Price': 0.65,
    'Selling Price': 1.49,
    'Status': 'ACTIVE',
    'Type': 'SIMPLE',
    'Reorder Point': 75,
    'Max Stock Level': 600,
    'Brand': 'Nakd'
  }
];

// Create workbook
const workbook = XLSX.utils.book_new();

// Create worksheet from data
const worksheet = XLSX.utils.json_to_sheet(sampleData);

// Set column widths
worksheet['!cols'] = [
  { wch: 12 },  // SKU
  { wch: 25 },  // Product Name
  { wch: 40 },  // Description
  { wch: 15 },  // Barcode
  { wch: 12 },  // Cost Price
  { wch: 12 },  // Selling Price
  { wch: 10 },  // Status
  { wch: 10 },  // Type
  { wch: 14 },  // Reorder Point
  { wch: 15 },  // Max Stock Level
  { wch: 12 },  // Brand
];

// Add worksheet to workbook
XLSX.utils.book_append_sheet(workbook, worksheet, 'Products');

// Create an instructions sheet
const instructionsData = [
  { 'Field': 'SKU', 'Required': 'Yes', 'Description': 'Unique product identifier (e.g., PROD-001)' },
  { 'Field': 'Product Name', 'Required': 'Yes', 'Description': 'Name of the product' },
  { 'Field': 'Description', 'Required': 'No', 'Description': 'Product description' },
  { 'Field': 'Barcode', 'Required': 'No', 'Description': 'Product barcode (EAN/UPC)' },
  { 'Field': 'Cost Price', 'Required': 'Yes', 'Description': 'Cost price in GBP' },
  { 'Field': 'Selling Price', 'Required': 'Yes', 'Description': 'Selling price in GBP' },
  { 'Field': 'Status', 'Required': 'Yes', 'Description': 'ACTIVE or INACTIVE' },
  { 'Field': 'Type', 'Required': 'Yes', 'Description': 'SIMPLE or BUNDLE' },
  { 'Field': 'Reorder Point', 'Required': 'No', 'Description': 'Minimum stock level for reorder alert' },
  { 'Field': 'Max Stock Level', 'Required': 'No', 'Description': 'Maximum stock capacity' },
  { 'Field': 'Brand', 'Required': 'No', 'Description': 'Brand name (must exist in system)' },
];

const instructionsSheet = XLSX.utils.json_to_sheet(instructionsData);
instructionsSheet['!cols'] = [
  { wch: 15 },
  { wch: 10 },
  { wch: 50 },
];
XLSX.utils.book_append_sheet(workbook, instructionsSheet, 'Instructions');

// Write file
const outputPath = path.join(__dirname, '../public/templates/product-import-template.xlsx');
XLSX.writeFile(workbook, outputPath);

console.log('Template created at:', outputPath);
