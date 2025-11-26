const { PrismaClient } = require('@prisma/client');

async function clearData() {
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: "postgresql://postgres:yEkWQHVAKNqJnZdRZVpVrLHubDRAnUqa@junction.proxy.rlwy.net:12957/railway"
      }
    }
  });
  
  try {
    console.log('Clearing all data except users...');
    
    // Delete in order (respecting foreign keys)
    console.log('Deleting order items...');
    await prisma.$executeRaw`DELETE FROM "OrderItem"`;
    
    console.log('Deleting orders...');
    await prisma.$executeRaw`DELETE FROM "Order"`;
    
    console.log('Deleting purchase order items...');
    await prisma.$executeRaw`DELETE FROM "PurchaseOrderItem"`;
    
    console.log('Deleting purchase orders...');
    await prisma.$executeRaw`DELETE FROM "PurchaseOrder"`;
    
    console.log('Deleting shipment items...');
    await prisma.$executeRaw`DELETE FROM "ShipmentItem"`;
    
    console.log('Deleting shipments...');
    await prisma.$executeRaw`DELETE FROM "Shipment"`;
    
    console.log('Deleting inventory batches...');
    await prisma.$executeRaw`DELETE FROM "InventoryBatch"`;
    
    console.log('Deleting inventory...');
    await prisma.$executeRaw`DELETE FROM "Inventory"`;
    
    console.log('Deleting bundle items...');
    await prisma.$executeRaw`DELETE FROM "BundleItem"`;
    
    console.log('Deleting products...');
    await prisma.$executeRaw`DELETE FROM "Product"`;
    
    console.log('Deleting brands...');
    await prisma.$executeRaw`DELETE FROM "Brand"`;
    
    console.log('Deleting categories...');
    await prisma.$executeRaw`DELETE FROM "Category"`;
    
    console.log('Deleting suppliers...');
    await prisma.$executeRaw`DELETE FROM "Supplier"`;
    
    console.log('Deleting customers...');
    await prisma.$executeRaw`DELETE FROM "Customer"`;
    
    console.log('Deleting locations...');
    await prisma.$executeRaw`DELETE FROM "Location"`;
    
    console.log('Deleting warehouses...');
    await prisma.$executeRaw`DELETE FROM "Warehouse"`;
    
    console.log('Deleting channels...');
    await prisma.$executeRaw`DELETE FROM "Channel"`;
    
    console.log('Deleting companies...');
    await prisma.$executeRaw`DELETE FROM "Company"`;
    
    console.log('\n=== ALL DATA CLEARED ===');
    
    // Verify counts
    const companies = await prisma.company.count();
    const products = await prisma.product.count();
    const orders = await prisma.order.count();
    const users = await prisma.user.count();
    
    console.log(`Companies: ${companies}`);
    console.log(`Products: ${products}`);
    console.log(`Orders: ${orders}`);
    console.log(`Users (kept): ${users}`);
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

clearData();
