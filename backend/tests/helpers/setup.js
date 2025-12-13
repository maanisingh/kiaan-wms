/**
 * Jest test setup file
 * Runs before each test suite
 */

// Load environment variables
require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });

// Set test environment
process.env.NODE_ENV = 'test';

// Increase timeout for integration tests
jest.setTimeout(30000);

// Global test helpers
global.sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Clean up Prisma connections after tests
afterAll(async () => {
  const { PrismaClient } = require('@prisma/client');
  const prisma = new PrismaClient();
  await prisma.$disconnect();
});

// Console log timestamp prefix
const originalLog = console.log;
console.log = (...args) => {
  originalLog(`[${new Date().toISOString()}]`, ...args);
};
