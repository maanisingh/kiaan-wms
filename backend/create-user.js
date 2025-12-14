const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function createUser() {
  const password = await bcrypt.hash('Admin@123', 10);

  try {
    const user = await prisma.user.create({
      data: {
        id: 'admin-001',
        email: 'admin@kiaan-wms.com',
        name: 'Super Administrator',
        password: password,
        role: 'SUPER_ADMIN',
        companyId: 'c1234567-89ab-cdef-0123-456789abcdef'
      }
    });
    console.log('User created:', user.email);

    // Create a few more users
    const users = [
      { id: 'manager-001', email: 'manager@kiaan-wms.com', name: 'Warehouse Manager', role: 'WAREHOUSE_MANAGER' },
      { id: 'picker-001', email: 'picker@kiaan-wms.com', name: 'Picker User', role: 'PICKER' },
    ];

    for (const u of users) {
      await prisma.user.create({
        data: {
          ...u,
          password: password,
          companyId: 'c1234567-89ab-cdef-0123-456789abcdef'
        }
      });
      console.log('User created:', u.email);
    }
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

createUser();
