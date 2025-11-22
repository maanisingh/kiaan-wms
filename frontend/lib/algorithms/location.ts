/**
 * Location Assignment Algorithm for Kiaan WMS
 *
 * Intelligent storage location assignment based on:
 * - Product velocity (fast-movers near dispatch)
 * - Product dimensions (heavy items on ground level)
 * - Product category (grouping similar items)
 * - Order frequency (high-frequency near picking area)
 *
 * Goal: Minimize picking time and walking distance
 */

export interface LocationInfo {
  id: string;
  code: string;
  warehouseId: string;
  warehouseName: string;
  zone: 'A' | 'B' | 'C' | 'D'; // A=Front/Fast, B=Middle, C=Back, D=Overflow
  level: number; // 1=Ground, 2-5=Upper shelves
  aisle: string;
  capacity: number;
  currentOccupancy: number;
  distanceFromDispatch: number; // meters
  isAccessible: boolean;
  temperature: 'AMBIENT' | 'CHILLED' | 'FROZEN';
  status: 'AVAILABLE' | 'OCCUPIED' | 'RESERVED' | 'MAINTENANCE';
}

export interface ProductCharacteristics {
  productId: string;
  productSku: string;
  productName: string;
  weight: number; // kg
  volume: number; // cubic meters
  dimensions: {
    length: number;
    width: number;
    height: number;
  };
  category: string;
  brandId: string;
  velocity: 'FAST' | 'MEDIUM' | 'SLOW'; // ABC classification
  ordersPerDay: number;
  unitsPerOrder: number;
  requiresTemperature?: 'AMBIENT' | 'CHILLED' | 'FROZEN';
  isFragile: boolean;
  isHazardous: boolean;
}

export interface LocationAssignment {
  productId: string;
  productSku: string;
  recommendedLocations: {
    locationId: string;
    locationCode: string;
    zone: string;
    level: number;
    score: number;
    reasons: string[];
    distanceFromDispatch: number;
  }[];
  primaryLocation: string;
  overflowLocations: string[];
}

/**
 * Main location assignment algorithm
 * Recommends optimal storage locations for a product
 */
export function recommendStorageLocation(
  product: ProductCharacteristics,
  availableLocations: LocationInfo[]
): LocationAssignment {
  const scoredLocations = availableLocations
    .filter((loc) => loc.isAccessible && loc.status === 'AVAILABLE')
    .map((location) => ({
      location,
      score: calculateLocationScore(product, location),
      reasons: getAssignmentReasons(product, location),
    }))
    .sort((a, b) => b.score - a.score);

  const recommendations = scoredLocations.slice(0, 5).map((scored) => ({
    locationId: scored.location.id,
    locationCode: scored.location.code,
    zone: scored.location.zone,
    level: scored.location.level,
    score: Math.round(scored.score * 100) / 100,
    reasons: scored.reasons,
    distanceFromDispatch: scored.location.distanceFromDispatch,
  }));

  return {
    productId: product.productId,
    productSku: product.productSku,
    recommendedLocations: recommendations,
    primaryLocation: recommendations[0]?.locationCode || '',
    overflowLocations: recommendations.slice(1).map((r) => r.locationCode),
  };
}

/**
 * Calculate location score for a product
 * Higher score = better match
 */
function calculateLocationScore(
  product: ProductCharacteristics,
  location: LocationInfo
): number {
  let score = 100; // Base score
  const reasons: string[] = [];

  // 1. Velocity-based scoring (40 points)
  if (product.velocity === 'FAST' && location.zone === 'A') {
    score += 40;
  } else if (product.velocity === 'FAST' && location.zone === 'B') {
    score += 20;
  } else if (product.velocity === 'MEDIUM' && location.zone === 'B') {
    score += 40;
  } else if (product.velocity === 'MEDIUM' && location.zone === 'A') {
    score += 30;
  } else if (product.velocity === 'SLOW' && (location.zone === 'C' || location.zone === 'D')) {
    score += 40;
  } else if (product.velocity === 'SLOW' && location.zone === 'B') {
    score += 20;
  }

  // 2. Weight-based scoring (30 points)
  if (product.weight > 20) {
    // Heavy items
    if (location.level === 1) {
      score += 30; // Ground level for heavy items
    } else {
      score -= 20; // Penalize upper levels for heavy items
    }
  } else if (product.weight < 5) {
    // Light items
    if (location.level >= 3) {
      score += 20; // Upper levels OK for light items
    }
  }

  // 3. Distance from dispatch (20 points)
  // Fast movers should be close to dispatch
  const distanceScore = Math.max(0, 20 - location.distanceFromDispatch / 5);
  if (product.velocity === 'FAST') {
    score += distanceScore;
  } else if (product.velocity === 'SLOW') {
    score += 20 - distanceScore; // Far is OK for slow movers
  }

  // 4. Temperature requirements (critical)
  if (product.requiresTemperature) {
    if (location.temperature === product.requiresTemperature) {
      score += 50; // Critical match
    } else {
      score -= 100; // Wrong temperature zone = unusable
    }
  }

  // 5. Capacity check (10 points)
  const availableSpace = location.capacity - location.currentOccupancy;
  if (availableSpace >= product.volume) {
    score += 10;
  } else {
    score -= 50; // Not enough space
  }

  // 6. Fragile items (prefer lower levels)
  if (product.isFragile) {
    if (location.level <= 2) {
      score += 15;
    } else {
      score -= 10;
    }
  }

  // 7. Hazardous items (special zones)
  if (product.isHazardous) {
    if (location.zone === 'D') {
      score += 30; // Isolated zone for hazardous
    } else {
      score -= 20;
    }
  }

  return score;
}

/**
 * Get human-readable reasons for location assignment
 */
function getAssignmentReasons(
  product: ProductCharacteristics,
  location: LocationInfo
): string[] {
  const reasons: string[] = [];

  // Velocity matching
  if (product.velocity === 'FAST' && location.zone === 'A') {
    reasons.push('Fast-moving product in front zone');
  } else if (product.velocity === 'SLOW' && (location.zone === 'C' || location.zone === 'D')) {
    reasons.push('Slow-moving product in back zone');
  }

  // Weight considerations
  if (product.weight > 20 && location.level === 1) {
    reasons.push('Heavy item on ground level');
  } else if (product.weight < 5 && location.level >= 3) {
    reasons.push('Light item on upper shelf');
  }

  // Distance
  if (location.distanceFromDispatch < 20 && product.velocity === 'FAST') {
    reasons.push('Close to dispatch area');
  }

  // Temperature
  if (product.requiresTemperature === location.temperature) {
    reasons.push(`Correct temperature zone (${location.temperature})`);
  }

  // Capacity
  const availableSpace = location.capacity - location.currentOccupancy;
  if (availableSpace >= product.volume * 2) {
    reasons.push('Ample storage space');
  }

  // Special handling
  if (product.isFragile && location.level <= 2) {
    reasons.push('Low level for fragile items');
  }

  if (product.isHazardous && location.zone === 'D') {
    reasons.push('Isolated zone for hazardous materials');
  }

  return reasons;
}

/**
 * Slotting Optimization
 * Redistribute products across locations to minimize picking time
 */
export interface CurrentSlotting {
  productId: string;
  productSku: string;
  currentLocationId: string;
  currentLocationCode: string;
  velocity: 'FAST' | 'MEDIUM' | 'SLOW';
  ordersPerDay: number;
}

export interface SlottingRecommendation {
  productId: string;
  productSku: string;
  currentLocation: string;
  recommendedLocation: string;
  reason: string;
  estimatedTimeSaved: number; // seconds per pick
  priority: 'High' | 'Medium' | 'Low';
}

export function optimizeSlotting(
  currentSlotting: CurrentSlotting[],
  allLocations: LocationInfo[]
): SlottingRecommendation[] {
  const recommendations: SlottingRecommendation[] = [];

  // Find misplaced fast movers
  currentSlotting.forEach((slot) => {
    const currentLocation = allLocations.find(
      (loc) => loc.id === slot.currentLocationId
    );

    if (!currentLocation) return;

    // Fast movers in back zones = inefficient
    if (slot.velocity === 'FAST' && currentLocation.zone !== 'A') {
      const betterLocation = allLocations.find(
        (loc) =>
          loc.zone === 'A' &&
          loc.status === 'AVAILABLE' &&
          loc.isAccessible
      );

      if (betterLocation) {
        const timeSaved =
          (currentLocation.distanceFromDispatch -
            betterLocation.distanceFromDispatch) *
          0.5; // 0.5 sec per meter

        recommendations.push({
          productId: slot.productId,
          productSku: slot.productSku,
          currentLocation: currentLocation.code,
          recommendedLocation: betterLocation.code,
          reason: 'Fast-moving product should be in front zone',
          estimatedTimeSaved: Math.round(timeSaved * slot.ordersPerDay),
          priority: 'High',
        });
      }
    }

    // Slow movers in front zones = wasting prime space
    if (slot.velocity === 'SLOW' && currentLocation.zone === 'A') {
      const betterLocation = allLocations.find(
        (loc) =>
          (loc.zone === 'C' || loc.zone === 'D') &&
          loc.status === 'AVAILABLE' &&
          loc.isAccessible
      );

      if (betterLocation) {
        recommendations.push({
          productId: slot.productId,
          productSku: slot.productSku,
          currentLocation: currentLocation.code,
          recommendedLocation: betterLocation.code,
          reason: 'Slow-moving product wasting prime space',
          estimatedTimeSaved: 0,
          priority: 'Medium',
        });
      }
    }
  });

  return recommendations.sort(
    (a, b) => b.estimatedTimeSaved - a.estimatedTimeSaved
  );
}

/**
 * Zone-based Picking Route
 * Determine optimal walking route through zones
 */
export interface PickLocation {
  locationCode: string;
  zone: 'A' | 'B' | 'C' | 'D';
  aisle: string;
  level: number;
  distanceFromDispatch: number;
}

export interface PickRoute {
  stops: {
    sequence: number;
    locationCode: string;
    zone: string;
    aisle: string;
    cumulativeDistance: number;
  }[];
  totalDistance: number;
  estimatedTime: number; // seconds
}

export function calculateOptimalPickRoute(
  pickLocations: PickLocation[]
): PickRoute {
  // Sort by zone first (A -> B -> C -> D), then by aisle
  const sortedLocations = [...pickLocations].sort((a, b) => {
    // Zone priority
    if (a.zone !== b.zone) {
      return a.zone.localeCompare(b.zone);
    }
    // Then by aisle
    if (a.aisle !== b.aisle) {
      return a.aisle.localeCompare(b.aisle);
    }
    // Then by level (bottom to top)
    return a.level - b.level;
  });

  let cumulativeDistance = 0;
  const stops = sortedLocations.map((location, index) => {
    if (index > 0) {
      // Estimate distance between picks (simplified)
      const prevLocation = sortedLocations[index - 1];
      if (prevLocation.zone === location.zone) {
        cumulativeDistance += 5; // Same zone = 5 meters
      } else {
        cumulativeDistance += 15; // Different zone = 15 meters
      }
    } else {
      cumulativeDistance = location.distanceFromDispatch;
    }

    return {
      sequence: index + 1,
      locationCode: location.locationCode,
      zone: location.zone,
      aisle: location.aisle,
      cumulativeDistance: Math.round(cumulativeDistance),
    };
  });

  // Estimate time: 1.4 m/s walking speed + 10 seconds per pick
  const walkingTime = cumulativeDistance / 1.4;
  const pickingTime = pickLocations.length * 10;
  const totalTime = Math.round(walkingTime + pickingTime);

  return {
    stops,
    totalDistance: Math.round(cumulativeDistance),
    estimatedTime: totalTime,
  };
}

/**
 * Dynamic Slotting (Machine Learning inspired)
 * Adjust locations based on actual picking performance
 */
export interface PickingPerformance {
  productId: string;
  locationId: string;
  averagePickTime: number; // seconds
  pickFrequency: number; // picks per day
  errorRate: number; // percentage
}

export function analyzePutawayPerformance(
  performance: PickingPerformance[]
): {
  productId: string;
  currentPerformance: number;
  benchmarkPerformance: number;
  improvementPotential: number;
  recommendation: string;
}[] {
  const results = performance.map((perf) => {
    // Benchmark: Fast items should pick in < 30 seconds
    const benchmarkTime = perf.pickFrequency > 10 ? 30 : 60;
    const currentScore = (benchmarkTime / perf.averagePickTime) * 100;
    const benchmarkScore = 100;
    const improvementPotential = Math.max(0, benchmarkScore - currentScore);

    let recommendation = '';
    if (perf.averagePickTime > benchmarkTime * 1.5) {
      recommendation = 'Move to faster-access location';
    } else if (perf.errorRate > 5) {
      recommendation = 'Improve labeling or consolidate locations';
    } else if (currentScore > 90) {
      recommendation = 'Well optimized';
    } else {
      recommendation = 'Monitor performance';
    }

    return {
      productId: perf.productId,
      currentPerformance: Math.round(currentScore),
      benchmarkPerformance: benchmarkScore,
      improvementPotential: Math.round(improvementPotential),
      recommendation,
    };
  });

  return results.sort((a, b) => b.improvementPotential - a.improvementPotential);
}
