/**
 * Inventory Optimization Algorithms for Kiaan WMS
 *
 * This module implements intelligent inventory management strategies:
 * - ABC Analysis: Classify products by value/importance
 * - Reorder Point Calculation: When to reorder
 * - Safety Stock: Buffer stock for demand variability
 * - Demand Forecasting: Predict future needs
 * - Stock Valuation: FIFO/Weighted Average cost
 *
 * Based on industry best practices and lean inventory principles
 */

export interface ProductStats {
  productId: string;
  productName: string;
  productSku: string;
  totalQuantity: number;
  availableQuantity: number;
  reservedQuantity: number;
  averageDailySales: number;
  leadTimeDays: number;
  unitCost: number;
  annualRevenue: number;
  stockTurnoverRate: number;
}

export interface ABCClassification {
  productId: string;
  productSku: string;
  productName: string;
  classification: 'A' | 'B' | 'C';
  annualRevenue: number;
  percentageOfTotal: number;
  cumulativePercentage: number;
  recommendedReviewFrequency: 'Daily' | 'Weekly' | 'Monthly';
  stockingPriority: 'High' | 'Medium' | 'Low';
}

export interface ReorderPoint {
  productId: string;
  productSku: string;
  currentStock: number;
  reorderPoint: number;
  reorderQuantity: number;
  safetyStock: number;
  maxStock: number;
  daysOfStockRemaining: number;
  shouldReorder: boolean;
  urgency: 'Critical' | 'High' | 'Medium' | 'Low' | 'OK';
}

export interface StockValuation {
  productId: string;
  productSku: string;
  method: 'FIFO' | 'WEIGHTED_AVERAGE';
  totalQuantity: number;
  averageCost: number;
  totalValue: number;
  inventoryItems: {
    lotNumber: string;
    quantity: number;
    unitCost: number;
    value: number;
  }[];
}

/**
 * ABC Analysis
 * Classify products based on annual revenue (Pareto 80/20 principle)
 * A items: 80% of revenue (top 20% of products) - High priority
 * B items: 15% of revenue (next 30% of products) - Medium priority
 * C items: 5% of revenue (bottom 50% of products) - Low priority
 */
export function performABCAnalysis(
  products: ProductStats[]
): ABCClassification[] {
  // Sort by annual revenue (descending)
  const sortedProducts = [...products].sort(
    (a, b) => b.annualRevenue - a.annualRevenue
  );

  const totalRevenue = sortedProducts.reduce(
    (sum, p) => sum + p.annualRevenue,
    0
  );

  const classifications: ABCClassification[] = [];
  let cumulativeRevenue = 0;

  sortedProducts.forEach((product, index) => {
    cumulativeRevenue += product.annualRevenue;
    const cumulativePercentage = (cumulativeRevenue / totalRevenue) * 100;
    const percentageOfTotal = (product.annualRevenue / totalRevenue) * 100;

    let classification: 'A' | 'B' | 'C';
    let reviewFrequency: 'Daily' | 'Weekly' | 'Monthly';
    let stockingPriority: 'High' | 'Medium' | 'Low';

    if (cumulativePercentage <= 80) {
      // A items: Top revenue generators
      classification = 'A';
      reviewFrequency = 'Daily';
      stockingPriority = 'High';
    } else if (cumulativePercentage <= 95) {
      // B items: Moderate revenue
      classification = 'B';
      reviewFrequency = 'Weekly';
      stockingPriority = 'Medium';
    } else {
      // C items: Low revenue
      classification = 'C';
      reviewFrequency = 'Monthly';
      stockingPriority = 'Low';
    }

    classifications.push({
      productId: product.productId,
      productSku: product.productSku,
      productName: product.productName,
      classification,
      annualRevenue: product.annualRevenue,
      percentageOfTotal,
      cumulativePercentage,
      recommendedReviewFrequency: reviewFrequency,
      stockingPriority,
    });
  });

  return classifications;
}

/**
 * Calculate Reorder Point
 * Formula: ROP = (Average Daily Sales × Lead Time) + Safety Stock
 */
export function calculateReorderPoint(
  product: ProductStats,
  serviceLevel: number = 95 // 95% service level (Z-score = 1.65)
): ReorderPoint {
  const { averageDailySales, leadTimeDays, totalQuantity } = product;

  // Safety Stock = Z-score × Standard Deviation × √Lead Time
  // Simplified: Use 30% of average demand during lead time
  const averageLeadTimeDemand = averageDailySales * leadTimeDays;
  const safetyStock = Math.ceil(averageLeadTimeDemand * 0.3);

  // Reorder Point
  const reorderPoint = Math.ceil(averageLeadTimeDemand + safetyStock);

  // Economic Order Quantity (simplified)
  // EOQ = √(2 × Annual Demand × Order Cost / Holding Cost)
  // Simplified: Order enough for 30 days
  const reorderQuantity = Math.ceil(averageDailySales * 30);

  // Maximum stock level
  const maxStock = reorderPoint + reorderQuantity;

  // Days of stock remaining
  const daysOfStockRemaining =
    averageDailySales > 0
      ? Math.floor(totalQuantity / averageDailySales)
      : 999;

  // Should reorder?
  const shouldReorder = totalQuantity <= reorderPoint;

  // Urgency level
  let urgency: 'Critical' | 'High' | 'Medium' | 'Low' | 'OK';
  if (totalQuantity <= safetyStock) {
    urgency = 'Critical';
  } else if (totalQuantity <= reorderPoint) {
    urgency = 'High';
  } else if (totalQuantity <= reorderPoint * 1.5) {
    urgency = 'Medium';
  } else if (totalQuantity <= maxStock * 0.8) {
    urgency = 'Low';
  } else {
    urgency = 'OK';
  }

  return {
    productId: product.productId,
    productSku: product.productSku,
    currentStock: totalQuantity,
    reorderPoint,
    reorderQuantity,
    safetyStock,
    maxStock,
    daysOfStockRemaining,
    shouldReorder,
    urgency,
  };
}

/**
 * Demand Forecasting (Simple Moving Average)
 * Predicts future demand based on historical sales
 */
export interface SalesHistory {
  date: string;
  quantity: number;
}

export interface DemandForecast {
  productId: string;
  forecastMethod: 'SMA' | 'EMA' | 'LINEAR_REGRESSION';
  next7Days: number;
  next30Days: number;
  next90Days: number;
  confidenceLevel: number;
  trend: 'Increasing' | 'Stable' | 'Decreasing';
}

export function forecastDemand(
  productId: string,
  salesHistory: SalesHistory[],
  method: 'SMA' | 'EMA' = 'SMA'
): DemandForecast {
  if (salesHistory.length < 7) {
    return {
      productId,
      forecastMethod: method,
      next7Days: 0,
      next30Days: 0,
      next90Days: 0,
      confidenceLevel: 0,
      trend: 'Stable',
    };
  }

  // Sort by date
  const sorted = [...salesHistory].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  let dailyAverage: number;

  if (method === 'SMA') {
    // Simple Moving Average (last 30 days)
    const recent = sorted.slice(-30);
    const totalSales = recent.reduce((sum, s) => sum + s.quantity, 0);
    dailyAverage = totalSales / recent.length;
  } else {
    // Exponential Moving Average (gives more weight to recent data)
    const alpha = 0.3;
    let ema = sorted[0].quantity;
    for (let i = 1; i < sorted.length; i++) {
      ema = alpha * sorted[i].quantity + (1 - alpha) * ema;
    }
    dailyAverage = ema;
  }

  // Trend analysis
  const firstHalf = sorted.slice(0, Math.floor(sorted.length / 2));
  const secondHalf = sorted.slice(Math.floor(sorted.length / 2));

  const firstHalfAvg =
    firstHalf.reduce((sum, s) => sum + s.quantity, 0) / firstHalf.length;
  const secondHalfAvg =
    secondHalf.reduce((sum, s) => sum + s.quantity, 0) / secondHalf.length;

  let trend: 'Increasing' | 'Stable' | 'Decreasing';
  if (secondHalfAvg > firstHalfAvg * 1.1) {
    trend = 'Increasing';
  } else if (secondHalfAvg < firstHalfAvg * 0.9) {
    trend = 'Decreasing';
  } else {
    trend = 'Stable';
  }

  // Apply trend factor
  let trendFactor = 1.0;
  if (trend === 'Increasing') trendFactor = 1.1;
  if (trend === 'Decreasing') trendFactor = 0.9;

  return {
    productId,
    forecastMethod: method,
    next7Days: Math.ceil(dailyAverage * 7 * trendFactor),
    next30Days: Math.ceil(dailyAverage * 30 * trendFactor),
    next90Days: Math.ceil(dailyAverage * 90 * trendFactor),
    confidenceLevel: Math.min(salesHistory.length / 30, 1) * 100,
    trend,
  };
}

/**
 * Stock Turnover Rate
 * Measures how many times inventory is sold and replaced
 * Formula: Annual Sales / Average Inventory
 * Good turnover: 4-6 times per year (varies by industry)
 */
export function calculateStockTurnover(
  annualSales: number,
  averageInventory: number
): {
  turnoverRate: number;
  daysInInventory: number;
  performance: 'Excellent' | 'Good' | 'Average' | 'Poor';
} {
  const turnoverRate = averageInventory > 0 ? annualSales / averageInventory : 0;
  const daysInInventory = turnoverRate > 0 ? 365 / turnoverRate : 365;

  let performance: 'Excellent' | 'Good' | 'Average' | 'Poor';
  if (turnoverRate >= 8) {
    performance = 'Excellent';
  } else if (turnoverRate >= 4) {
    performance = 'Good';
  } else if (turnoverRate >= 2) {
    performance = 'Average';
  } else {
    performance = 'Poor';
  }

  return {
    turnoverRate: Math.round(turnoverRate * 100) / 100,
    daysInInventory: Math.round(daysInInventory),
    performance,
  };
}

/**
 * Stock Valuation (FIFO Method)
 */
export interface InventoryLot {
  lotNumber: string;
  quantity: number;
  unitCost: number;
  purchaseDate: string;
}

export function calculateStockValuation(
  productId: string,
  productSku: string,
  inventoryLots: InventoryLot[],
  method: 'FIFO' | 'WEIGHTED_AVERAGE' = 'FIFO'
): StockValuation {
  const totalQuantity = inventoryLots.reduce((sum, lot) => sum + lot.quantity, 0);

  if (method === 'FIFO') {
    // FIFO: First-In-First-Out
    // Value is based on most recent purchases
    const sortedLots = [...inventoryLots].sort(
      (a, b) =>
        new Date(b.purchaseDate).getTime() - new Date(a.purchaseDate).getTime()
    );

    const totalValue = sortedLots.reduce(
      (sum, lot) => sum + lot.quantity * lot.unitCost,
      0
    );
    const averageCost = totalQuantity > 0 ? totalValue / totalQuantity : 0;

    return {
      productId,
      productSku,
      method: 'FIFO',
      totalQuantity,
      averageCost: Math.round(averageCost * 100) / 100,
      totalValue: Math.round(totalValue * 100) / 100,
      inventoryItems: sortedLots.map((lot) => ({
        lotNumber: lot.lotNumber,
        quantity: lot.quantity,
        unitCost: lot.unitCost,
        value: Math.round(lot.quantity * lot.unitCost * 100) / 100,
      })),
    };
  } else {
    // Weighted Average Cost
    const totalCost = inventoryLots.reduce(
      (sum, lot) => sum + lot.quantity * lot.unitCost,
      0
    );
    const averageCost = totalQuantity > 0 ? totalCost / totalQuantity : 0;

    return {
      productId,
      productSku,
      method: 'WEIGHTED_AVERAGE',
      totalQuantity,
      averageCost: Math.round(averageCost * 100) / 100,
      totalValue: Math.round(totalCost * 100) / 100,
      inventoryItems: inventoryLots.map((lot) => ({
        lotNumber: lot.lotNumber,
        quantity: lot.quantity,
        unitCost: lot.unitCost,
        value: Math.round(lot.quantity * lot.unitCost * 100) / 100,
      })),
    };
  }
}

/**
 * Identify Slow-Moving Items
 * Products that haven't sold much in the last 90 days
 */
export interface SlowMovingItem {
  productId: string;
  productSku: string;
  productName: string;
  currentStock: number;
  salesLast90Days: number;
  stockValue: number;
  daysOfStockRemaining: number;
  recommendation: string;
}

export function identifySlowMovingItems(
  products: ProductStats[],
  threshold: number = 2 // Less than 2 units per month = slow
): SlowMovingItem[] {
  const slowMovers: SlowMovingItem[] = [];

  products.forEach((product) => {
    const salesPerMonth = (product.averageDailySales * 30) || 0;

    if (salesPerMonth < threshold && product.totalQuantity > 0) {
      const stockValue = product.totalQuantity * product.unitCost;
      const daysRemaining =
        product.averageDailySales > 0
          ? Math.floor(product.totalQuantity / product.averageDailySales)
          : 999;

      let recommendation: string;
      if (daysRemaining > 365) {
        recommendation = 'Consider clearance sale or discontinue';
      } else if (daysRemaining > 180) {
        recommendation = 'Reduce reorder quantity';
      } else {
        recommendation = 'Monitor closely';
      }

      slowMovers.push({
        productId: product.productId,
        productSku: product.productSku,
        productName: product.productName,
        currentStock: product.totalQuantity,
        salesLast90Days: Math.round(product.averageDailySales * 90),
        stockValue: Math.round(stockValue * 100) / 100,
        daysOfStockRemaining: daysRemaining,
        recommendation,
      });
    }
  });

  return slowMovers.sort((a, b) => b.stockValue - a.stockValue);
}

/**
 * Calculate Economic Order Quantity (EOQ)
 * Optimal order quantity that minimizes total inventory costs
 * Formula: EOQ = √(2 × D × S / H)
 * D = Annual demand, S = Order cost, H = Holding cost per unit
 */
export function calculateEOQ(
  annualDemand: number,
  orderCost: number,
  holdingCostPerUnit: number
): {
  economicOrderQuantity: number;
  numberOfOrders: number;
  timeBetweenOrders: number;
  totalCost: number;
} {
  const eoq = Math.ceil(
    Math.sqrt((2 * annualDemand * orderCost) / holdingCostPerUnit)
  );
  const numberOfOrders = Math.ceil(annualDemand / eoq);
  const timeBetweenOrders = Math.floor(365 / numberOfOrders);
  const totalCost =
    (annualDemand / eoq) * orderCost + (eoq / 2) * holdingCostPerUnit;

  return {
    economicOrderQuantity: eoq,
    numberOfOrders,
    timeBetweenOrders,
    totalCost: Math.round(totalCost * 100) / 100,
  };
}
