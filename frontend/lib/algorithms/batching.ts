/**
 * Batch Picking (Wave Picking) Algorithm for Kiaan WMS
 *
 * Implements intelligent order batching strategies:
 * - Wave Picking: Group multiple orders for single pick run
 * - Zone Picking: Assign pickers to specific zones
 * - Batch Picking: Pick for multiple orders simultaneously
 * - Cluster Picking: Group similar orders together
 *
 * Benefits:
 * - Reduce walking distance by 40-60%
 * - Increase picker productivity by 30-50%
 * - Minimize pick time and labor costs
 */

export interface Order {
  id: string;
  orderNumber: string;
  customerId: string;
  customerName: string;
  priority: number; // 1 = highest
  orderDate: string;
  shipByDate: string;
  orderType: 'WHOLESALE' | 'RETAIL';
  status: 'PENDING' | 'CONFIRMED' | 'IN_PROGRESS';
  totalItems: number;
  totalUnits: number;
}

export interface OrderLine {
  orderId: string;
  productId: string;
  productSku: string;
  productName: string;
  quantity: number;
  locationId: string;
  locationCode: string;
  zone: 'A' | 'B' | 'C' | 'D';
  aisle: string;
}

export interface WaveDefinition {
  waveId: string;
  waveName: string;
  orders: Order[];
  orderCount: number;
  totalLines: number;
  totalUnits: number;
  zones: string[];
  estimatedPickTime: number; // minutes
  assignedPickers: string[];
  priority: 'Critical' | 'High' | 'Medium' | 'Low';
}

export interface BatchPick {
  batchId: string;
  locationCode: string;
  zone: string;
  aisle: string;
  productId: string;
  productSku: string;
  productName: string;
  totalQuantity: number;
  orders: {
    orderId: string;
    orderNumber: string;
    quantity: number;
    containerNumber: number;
  }[];
  pickSequence: number;
}

/**
 * Create optimal picking waves
 * Groups orders based on multiple criteria
 */
export function createPickingWaves(
  orders: Order[],
  orderLines: OrderLine[],
  maxWaveSize: number = 20 // Maximum orders per wave
): WaveDefinition[] {
  const waves: WaveDefinition[] = [];

  // Separate by priority and ship date
  const criticalOrders = orders.filter((o) => {
    const shipDate = new Date(o.shipByDate);
    const today = new Date();
    const daysUntilShip = Math.ceil(
      (shipDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    );
    return o.priority === 1 || daysUntilShip <= 1;
  });

  const highPriorityOrders = orders.filter((o) => {
    const shipDate = new Date(o.shipByDate);
    const today = new Date();
    const daysUntilShip = Math.ceil(
      (shipDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    );
    return o.priority === 2 || (daysUntilShip <= 2 && daysUntilShip > 1);
  });

  const normalOrders = orders.filter(
    (o) => !criticalOrders.includes(o) && !highPriorityOrders.includes(o)
  );

  // Create waves for critical orders
  if (criticalOrders.length > 0) {
    const criticalWaves = createWavesFromOrders(
      criticalOrders,
      orderLines,
      maxWaveSize,
      'Critical'
    );
    waves.push(...criticalWaves);
  }

  // Create waves for high priority orders
  if (highPriorityOrders.length > 0) {
    const highWaves = createWavesFromOrders(
      highPriorityOrders,
      orderLines,
      maxWaveSize,
      'High'
    );
    waves.push(...highWaves);
  }

  // Create waves for normal orders
  if (normalOrders.length > 0) {
    const normalWaves = createWavesFromOrders(
      normalOrders,
      orderLines,
      maxWaveSize,
      'Medium'
    );
    waves.push(...normalWaves);
  }

  return waves;
}

/**
 * Helper: Create waves from a set of orders
 */
function createWavesFromOrders(
  orders: Order[],
  orderLines: OrderLine[],
  maxWaveSize: number,
  priority: 'Critical' | 'High' | 'Medium' | 'Low'
): WaveDefinition[] {
  const waves: WaveDefinition[] = [];
  let currentWave: Order[] = [];
  let waveNumber = 1;

  // Sort by order type (group WHOLESALE together)
  const sortedOrders = [...orders].sort((a, b) => {
    if (a.orderType === 'WHOLESALE' && b.orderType === 'RETAIL') return -1;
    if (a.orderType === 'RETAIL' && b.orderType === 'WHOLESALE') return 1;
    return 0;
  });

  for (const order of sortedOrders) {
    currentWave.push(order);

    // Create wave when we hit max size or different order type
    if (
      currentWave.length >= maxWaveSize ||
      (currentWave.length > 0 &&
        currentWave[0].orderType !== order.orderType)
    ) {
      waves.push(buildWaveDefinition(currentWave, orderLines, waveNumber, priority));
      currentWave = [];
      waveNumber++;
    }
  }

  // Add remaining orders
  if (currentWave.length > 0) {
    waves.push(buildWaveDefinition(currentWave, orderLines, waveNumber, priority));
  }

  return waves;
}

/**
 * Build wave definition with metadata
 */
function buildWaveDefinition(
  orders: Order[],
  allOrderLines: OrderLine[],
  waveNumber: number,
  priority: 'Critical' | 'High' | 'Medium' | 'Low'
): WaveDefinition {
  const orderIds = orders.map((o) => o.id);
  const waveLines = allOrderLines.filter((line) =>
    orderIds.includes(line.orderId)
  );

  const zones = [...new Set(waveLines.map((line) => line.zone))];
  const totalLines = waveLines.length;
  const totalUnits = waveLines.reduce((sum, line) => sum + line.quantity, 0);

  // Estimate pick time: 15 seconds per line + 30 seconds per order
  const estimatedPickTime = Math.ceil(
    (totalLines * 15 + orders.length * 30) / 60
  );

  return {
    waveId: `WAVE-${Date.now()}-${waveNumber}`,
    waveName: `${priority} Wave ${waveNumber}`,
    orders,
    orderCount: orders.length,
    totalLines,
    totalUnits,
    zones: zones.sort(),
    estimatedPickTime,
    assignedPickers: [], // To be assigned
    priority,
  };
}

/**
 * Generate batch pick list from wave
 * Groups picks by location across multiple orders
 */
export function generateBatchPickList(
  wave: WaveDefinition,
  orderLines: OrderLine[]
): BatchPick[] {
  const batchPicks: BatchPick[] = [];
  const orderIds = wave.orders.map((o) => o.id);
  const waveLines = orderLines.filter((line) => orderIds.includes(line.orderId));

  // Group by location and product
  const grouped = waveLines.reduce((acc, line) => {
    const key = `${line.locationCode}-${line.productId}`;
    if (!acc[key]) {
      acc[key] = {
        locationCode: line.locationCode,
        zone: line.zone,
        aisle: line.aisle,
        productId: line.productId,
        productSku: line.productSku,
        productName: line.productName,
        lines: [],
      };
    }
    acc[key].lines.push(line);
    return acc;
  }, {} as Record<string, any>);

  // Convert to batch picks
  Object.values(grouped).forEach((group: any) => {
    const totalQuantity = group.lines.reduce(
      (sum: number, line: any) => sum + line.quantity,
      0
    );

    // Assign container numbers to orders
    const ordersWithContainers = group.lines.map((line: any, index: number) => {
      const order = wave.orders.find((o) => o.id === line.orderId);
      return {
        orderId: line.orderId,
        orderNumber: order?.orderNumber || '',
        quantity: line.quantity,
        containerNumber: index + 1,
      };
    });

    batchPicks.push({
      batchId: `BATCH-${Date.now()}-${batchPicks.length + 1}`,
      locationCode: group.locationCode,
      zone: group.zone,
      aisle: group.aisle,
      productId: group.productId,
      productSku: group.productSku,
      productName: group.productName,
      totalQuantity,
      orders: ordersWithContainers,
      pickSequence: 0, // Will be set during route optimization
    });
  });

  // Sort by location for optimal route
  const sortedPicks = batchPicks.sort((a, b) => {
    if (a.zone !== b.zone) return a.zone.localeCompare(b.zone);
    if (a.aisle !== b.aisle) return a.aisle.localeCompare(b.aisle);
    return a.locationCode.localeCompare(b.locationCode);
  });

  // Assign pick sequences
  sortedPicks.forEach((pick, index) => {
    pick.pickSequence = index + 1;
  });

  return sortedPicks;
}

/**
 * Zone-based picking assignment
 * Assign pickers to specific zones for efficiency
 */
export interface Picker {
  id: string;
  name: string;
  assignedZone?: 'A' | 'B' | 'C' | 'D';
  skillLevel: 'TRAINEE' | 'STANDARD' | 'EXPERT';
  currentWorkload: number; // minutes
  maxWorkload: number; // minutes per shift
}

export interface ZoneAssignment {
  zone: 'A' | 'B' | 'C' | 'D';
  picker: Picker;
  picks: BatchPick[];
  estimatedTime: number;
}

export function assignPickersToZones(
  batchPicks: BatchPick[],
  availablePickers: Picker[]
): ZoneAssignment[] {
  const assignments: ZoneAssignment[] = [];

  // Group picks by zone
  const byZone = batchPicks.reduce((acc, pick) => {
    if (!acc[pick.zone]) {
      acc[pick.zone] = [];
    }
    acc[pick.zone].push(pick);
    return acc;
  }, {} as Record<string, BatchPick[]>);

  // Assign pickers to zones
  Object.entries(byZone).forEach(([zone, picks]) => {
    // Find best available picker for this zone
    const picker = findBestPickerForZone(
      zone as 'A' | 'B' | 'C' | 'D',
      picks,
      availablePickers
    );

    if (picker) {
      const estimatedTime = calculateZonePickTime(picks);
      assignments.push({
        zone: zone as 'A' | 'B' | 'C' | 'D',
        picker,
        picks,
        estimatedTime,
      });

      // Update picker workload
      picker.currentWorkload += estimatedTime;
    }
  });

  return assignments;
}

/**
 * Find best picker for a zone
 */
function findBestPickerForZone(
  zone: 'A' | 'B' | 'C' | 'D',
  picks: BatchPick[],
  pickers: Picker[]
): Picker | null {
  const estimatedTime = calculateZonePickTime(picks);

  // Filter available pickers
  const available = pickers.filter(
    (p) => p.currentWorkload + estimatedTime <= p.maxWorkload
  );

  if (available.length === 0) return null;

  // Prefer picker already assigned to this zone
  const zoneExpert = available.find((p) => p.assignedZone === zone);
  if (zoneExpert) return zoneExpert;

  // Otherwise, pick least loaded expert
  return available
    .filter((p) => p.skillLevel === 'EXPERT')
    .sort((a, b) => a.currentWorkload - b.currentWorkload)[0] || available[0];
}

/**
 * Calculate estimated pick time for zone
 */
function calculateZonePickTime(picks: BatchPick[]): number {
  // 20 seconds per pick + 5 seconds per order split
  const pickTime = picks.length * 20;
  const splitTime = picks.reduce((sum, pick) => sum + pick.orders.length * 5, 0);
  return Math.ceil((pickTime + splitTime) / 60); // Convert to minutes
}

/**
 * Cluster Picking: Group orders by similarity
 * Similar orders (same products) picked together
 */
export interface OrderCluster {
  clusterId: string;
  orders: Order[];
  commonProducts: string[];
  similarity: number; // 0-100%
}

export function clusterSimilarOrders(
  orders: Order[],
  orderLines: OrderLine[],
  minSimilarity: number = 50 // Minimum 50% similarity
): OrderCluster[] {
  const clusters: OrderCluster[] = [];

  const unassigned = [...orders];

  while (unassigned.length > 0) {
    const seedOrder = unassigned.shift()!;
    const seedLines = orderLines.filter((line) => line.orderId === seedOrder.id);
    const seedProducts = new Set(seedLines.map((line) => line.productId));

    const cluster: Order[] = [seedOrder];
    const commonProducts = [...seedProducts];

    // Find similar orders
    for (let i = unassigned.length - 1; i >= 0; i--) {
      const order = unassigned[i];
      const orderProducts = new Set(
        orderLines
          .filter((line) => line.orderId === order.id)
          .map((line) => line.productId)
      );

      const overlap = [...seedProducts].filter((p) => orderProducts.has(p));
      const similarity =
        (overlap.length / Math.max(seedProducts.size, orderProducts.size)) * 100;

      if (similarity >= minSimilarity) {
        cluster.push(order);
        unassigned.splice(i, 1);
      }
    }

    if (cluster.length > 1) {
      clusters.push({
        clusterId: `CLUSTER-${Date.now()}-${clusters.length + 1}`,
        orders: cluster,
        commonProducts,
        similarity: 100, // Will be calculated properly
      });
    }
  }

  return clusters;
}

/**
 * Calculate wave efficiency metrics
 */
export interface WaveEfficiency {
  waveId: string;
  linesPerOrder: number;
  unitsPerLine: number;
  uniqueLocations: number;
  zoneSpread: number; // How many zones
  estimatedDistance: number; // meters
  estimatedTime: number; // minutes
  efficiency: number; // 0-100%
  recommendation: string;
}

export function analyzeWaveEfficiency(
  wave: WaveDefinition,
  batchPicks: BatchPick[]
): WaveEfficiency {
  const linesPerOrder = wave.totalLines / wave.orderCount;
  const unitsPerLine = wave.totalUnits / wave.totalLines;
  const uniqueLocations = new Set(batchPicks.map((p) => p.locationCode)).size;
  const zoneSpread = wave.zones.length;

  // Estimate walking distance (simplified)
  const estimatedDistance = uniqueLocations * 10 + zoneSpread * 50;

  // Estimate time
  const walkingTime = estimatedDistance / 1.4 / 60; // 1.4 m/s to minutes
  const pickingTime = batchPicks.length * 0.3; // 20 seconds per pick
  const estimatedTime = Math.ceil(walkingTime + pickingTime + wave.orderCount * 0.5);

  // Calculate efficiency (higher is better)
  // Good: 10+ lines per order, < 3 zones, < 30 locations
  let efficiency = 100;
  if (linesPerOrder < 5) efficiency -= 20;
  if (zoneSpread > 3) efficiency -= 15;
  if (uniqueLocations > 30) efficiency -= 20;
  if (estimatedTime > 60) efficiency -= 10;

  efficiency = Math.max(0, efficiency);

  let recommendation = '';
  if (efficiency >= 80) {
    recommendation = 'Well optimized wave';
  } else if (efficiency >= 60) {
    recommendation = 'Consider reducing zone spread';
  } else {
    recommendation = 'Wave may be too fragmented - consider splitting';
  }

  return {
    waveId: wave.waveId,
    linesPerOrder: Math.round(linesPerOrder * 10) / 10,
    unitsPerLine: Math.round(unitsPerLine * 10) / 10,
    uniqueLocations,
    zoneSpread,
    estimatedDistance,
    estimatedTime,
    efficiency: Math.round(efficiency),
    recommendation,
  };
}
