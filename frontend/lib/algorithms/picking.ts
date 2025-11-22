/**
 * FEFO/FIFO Picking Algorithm for Kiaan WMS
 *
 * This module implements intelligent inventory picking strategies:
 * - FEFO (First-Expired-First-Out): For products with best-before dates
 * - FIFO (First-In-First-Out): For non-perishable products
 *
 * Features:
 * - Automatic expiry date checking
 * - Wholesale vs Retail order type support
 * - Location-based pick route optimization
 * - Reserved quantity management
 * - Multi-warehouse support
 */

export interface InventoryItem {
  id: string;
  productId: string;
  productName: string;
  productSku: string;
  quantity: number;
  availableQuantity: number;
  reservedQuantity: number;
  locationId: string;
  locationCode: string;
  warehouseId: string;
  warehouseName: string;
  bestBeforeDate?: string;
  lotNumber?: string;
  createdAt: string;
  status: string;
}

export interface PickRequest {
  productId: string;
  quantityNeeded: number;
  orderType: 'WHOLESALE' | 'RETAIL';
  preferredWarehouseId?: string;
}

export interface PickListItem {
  inventoryId: string;
  productId: string;
  productName: string;
  productSku: string;
  quantityToPick: number;
  locationCode: string;
  warehouseName: string;
  lotNumber?: string;
  bestBeforeDate?: string;
  pickSequence: number;
}

export interface PickResult {
  success: boolean;
  pickList: PickListItem[];
  totalPicked: number;
  shortfall: number;
  warnings: string[];
}

/**
 * Main picking algorithm - FEFO/FIFO logic
 */
export function generatePickList(
  inventoryItems: InventoryItem[],
  pickRequest: PickRequest
): PickResult {
  const warnings: string[] = [];
  const pickList: PickListItem[] = [];
  let remainingQuantity = pickRequest.quantityNeeded;

  // Filter available inventory for this product
  let availableInventory = inventoryItems.filter(
    (item) =>
      item.productId === pickRequest.productId &&
      item.availableQuantity > 0 &&
      item.status === 'AVAILABLE'
  );

  // Prefer specified warehouse if provided
  if (pickRequest.preferredWarehouseId) {
    const warehouseInventory = availableInventory.filter(
      (item) => item.warehouseId === pickRequest.preferredWarehouseId
    );
    if (warehouseInventory.length > 0) {
      availableInventory = warehouseInventory;
    } else {
      warnings.push(
        `Preferred warehouse ${pickRequest.preferredWarehouseId} has no available inventory. Using other warehouses.`
      );
    }
  }

  // Check if there's any inventory at all
  if (availableInventory.length === 0) {
    return {
      success: false,
      pickList: [],
      totalPicked: 0,
      shortfall: pickRequest.quantityNeeded,
      warnings: ['No available inventory for this product'],
    };
  }

  // Sort inventory based on order type and expiry
  const sortedInventory = sortInventoryForPicking(
    availableInventory,
    pickRequest.orderType
  );

  // Check for expiring items
  const expiringItems = sortedInventory.filter((item) => {
    if (!item.bestBeforeDate) return false;
    const daysUntilExpiry = getDaysUntilExpiry(item.bestBeforeDate);
    return daysUntilExpiry <= 30 && daysUntilExpiry >= 0;
  });

  if (expiringItems.length > 0) {
    warnings.push(
      `${expiringItems.length} item(s) expiring within 30 days will be picked first`
    );
  }

  // For WHOLESALE orders, try to fulfill from a single lot if possible
  if (pickRequest.orderType === 'WHOLESALE') {
    const singleLotItem = sortedInventory.find(
      (item) => item.availableQuantity >= remainingQuantity
    );

    if (singleLotItem) {
      // Perfect! Can fulfill from single lot
      pickList.push({
        inventoryId: singleLotItem.id,
        productId: singleLotItem.productId,
        productName: singleLotItem.productName,
        productSku: singleLotItem.productSku,
        quantityToPick: remainingQuantity,
        locationCode: singleLotItem.locationCode,
        warehouseName: singleLotItem.warehouseName,
        lotNumber: singleLotItem.lotNumber,
        bestBeforeDate: singleLotItem.bestBeforeDate,
        pickSequence: 1,
      });

      return {
        success: true,
        pickList,
        totalPicked: remainingQuantity,
        shortfall: 0,
        warnings,
      };
    } else {
      warnings.push(
        'WHOLESALE order cannot be fulfilled from single lot. Using multiple lots.'
      );
    }
  }

  // RETAIL or WHOLESALE (when single lot not available)
  // Pick from multiple locations following FEFO/FIFO
  let pickSequence = 1;
  for (const item of sortedInventory) {
    if (remainingQuantity <= 0) break;

    const quantityToPick = Math.min(item.availableQuantity, remainingQuantity);

    pickList.push({
      inventoryId: item.id,
      productId: item.productId,
      productName: item.productName,
      productSku: item.productSku,
      quantityToPick,
      locationCode: item.locationCode,
      warehouseName: item.warehouseName,
      lotNumber: item.lotNumber,
      bestBeforeDate: item.bestBeforeDate,
      pickSequence: pickSequence++,
    });

    remainingQuantity -= quantityToPick;
  }

  const totalPicked = pickRequest.quantityNeeded - remainingQuantity;
  const success = remainingQuantity === 0;

  if (!success) {
    warnings.push(
      `Insufficient inventory: Need ${pickRequest.quantityNeeded}, available ${totalPicked}`
    );
  }

  return {
    success,
    pickList,
    totalPicked,
    shortfall: remainingQuantity,
    warnings,
  };
}

/**
 * Sort inventory based on picking strategy
 * FEFO for items with expiry, FIFO for others
 */
function sortInventoryForPicking(
  inventory: InventoryItem[],
  orderType: 'WHOLESALE' | 'RETAIL'
): InventoryItem[] {
  return [...inventory].sort((a, b) => {
    // 1. Items with best-before dates come first (FEFO)
    if (a.bestBeforeDate && !b.bestBeforeDate) return -1;
    if (!a.bestBeforeDate && b.bestBeforeDate) return 1;

    // 2. If both have expiry dates, pick expiring items first
    if (a.bestBeforeDate && b.bestBeforeDate) {
      const dateA = new Date(a.bestBeforeDate);
      const dateB = new Date(b.bestBeforeDate);
      if (dateA < dateB) return -1;
      if (dateA > dateB) return 1;
    }

    // 3. For non-expiry items, use FIFO (created date)
    if (!a.bestBeforeDate && !b.bestBeforeDate) {
      const createdA = new Date(a.createdAt);
      const createdB = new Date(b.createdAt);
      if (createdA < createdB) return -1;
      if (createdA > createdB) return 1;
    }

    // 4. For WHOLESALE, prefer larger quantities (fewer picks)
    if (orderType === 'WHOLESALE') {
      if (a.availableQuantity > b.availableQuantity) return -1;
      if (a.availableQuantity < b.availableQuantity) return 1;
    }

    // 5. Location optimization: prefer same location (A1 < A2 < B1)
    const locA = a.locationCode || '';
    const locB = b.locationCode || '';
    return locA.localeCompare(locB);
  });
}

/**
 * Calculate days until expiry
 */
function getDaysUntilExpiry(bestBeforeDate: string): number {
  const today = new Date();
  const expiryDate = new Date(bestBeforeDate);
  const diffTime = expiryDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
}

/**
 * Optimize pick route by grouping locations
 * Groups picks by warehouse and zone for efficient walking route
 */
export function optimizePickRoute(pickList: PickListItem[]): PickListItem[] {
  // Group by warehouse first
  const byWarehouse = pickList.reduce((acc, item) => {
    if (!acc[item.warehouseName]) {
      acc[item.warehouseName] = [];
    }
    acc[item.warehouseName].push(item);
    return acc;
  }, {} as Record<string, PickListItem[]>);

  // Sort locations within each warehouse
  const optimized: PickListItem[] = [];
  let sequence = 1;

  Object.entries(byWarehouse).forEach(([warehouse, items]) => {
    // Sort by location code (A1, A2, B1, B2, C1...)
    const sorted = items.sort((a, b) =>
      a.locationCode.localeCompare(b.locationCode)
    );

    sorted.forEach((item) => {
      optimized.push({
        ...item,
        pickSequence: sequence++,
      });
    });
  });

  return optimized;
}

/**
 * Calculate optimal pick wave
 * Groups multiple orders for batch picking
 */
export interface WavePickRequest {
  orderId: string;
  productId: string;
  quantityNeeded: number;
  orderType: 'WHOLESALE' | 'RETAIL';
  priority: number; // 1 = highest
}

export interface WavePick {
  inventoryId: string;
  locationCode: string;
  warehouseName: string;
  quantityToPick: number;
  orders: {
    orderId: string;
    quantity: number;
  }[];
  pickSequence: number;
}

export function generateWavePickList(
  inventoryItems: InventoryItem[],
  waveRequests: WavePickRequest[]
): WavePick[] {
  const wavePicks: WavePick[] = [];

  // Group requests by product
  const byProduct = waveRequests.reduce((acc, req) => {
    if (!acc[req.productId]) {
      acc[req.productId] = [];
    }
    acc[req.productId].push(req);
    return acc;
  }, {} as Record<string, WavePickRequest[]>);

  // Process each product
  Object.entries(byProduct).forEach(([productId, requests]) => {
    // Sort by priority
    const sortedRequests = requests.sort((a, b) => a.priority - b.priority);

    // Get available inventory for this product
    const productInventory = inventoryItems.filter(
      (item) =>
        item.productId === productId &&
        item.availableQuantity > 0 &&
        item.status === 'AVAILABLE'
    );

    // Sort inventory using FEFO/FIFO
    const sortedInventory = sortInventoryForPicking(productInventory, 'RETAIL');

    // Allocate inventory to orders
    let inventoryIndex = 0;
    for (const request of sortedRequests) {
      let remainingNeeded = request.quantityNeeded;

      while (remainingNeeded > 0 && inventoryIndex < sortedInventory.length) {
        const inventory = sortedInventory[inventoryIndex];
        const available = inventory.availableQuantity;

        if (available > 0) {
          const quantityToAllocate = Math.min(available, remainingNeeded);

          // Find existing wave pick for this location or create new
          let wavePick = wavePicks.find(
            (wp) => wp.inventoryId === inventory.id
          );

          if (!wavePick) {
            wavePick = {
              inventoryId: inventory.id,
              locationCode: inventory.locationCode,
              warehouseName: inventory.warehouseName,
              quantityToPick: 0,
              orders: [],
              pickSequence: 0,
            };
            wavePicks.push(wavePick);
          }

          wavePick.quantityToPick += quantityToAllocate;
          wavePick.orders.push({
            orderId: request.orderId,
            quantity: quantityToAllocate,
          });

          remainingNeeded -= quantityToAllocate;
          inventory.availableQuantity -= quantityToAllocate;
        }

        if (inventory.availableQuantity === 0) {
          inventoryIndex++;
        }
      }
    }
  });

  // Optimize route and assign sequences
  const optimizedWave = wavePicks.sort((a, b) =>
    a.locationCode.localeCompare(b.locationCode)
  );

  optimizedWave.forEach((pick, index) => {
    pick.pickSequence = index + 1;
  });

  return optimizedWave;
}

/**
 * Validate pick list before execution
 */
export function validatePickList(
  pickList: PickListItem[],
  inventory: InventoryItem[]
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  pickList.forEach((pick) => {
    const inventoryItem = inventory.find((i) => i.id === pick.inventoryId);

    if (!inventoryItem) {
      errors.push(
        `Inventory item ${pick.inventoryId} not found for ${pick.productSku}`
      );
      return;
    }

    if (inventoryItem.availableQuantity < pick.quantityToPick) {
      errors.push(
        `Insufficient quantity at ${pick.locationCode}: Need ${pick.quantityToPick}, available ${inventoryItem.availableQuantity}`
      );
    }

    if (inventoryItem.status !== 'AVAILABLE') {
      errors.push(
        `Inventory at ${pick.locationCode} is ${inventoryItem.status}, not AVAILABLE`
      );
    }

    // Check for expired items
    if (inventoryItem.bestBeforeDate) {
      const expiryDate = new Date(inventoryItem.bestBeforeDate);
      const today = new Date();
      if (expiryDate < today) {
        errors.push(
          `Item at ${pick.locationCode} expired on ${inventoryItem.bestBeforeDate}`
        );
      }
    }
  });

  return {
    valid: errors.length === 0,
    errors,
  };
}
