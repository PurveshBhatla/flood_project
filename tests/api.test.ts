import test from 'node:test';
import assert from 'node:assert/strict';
import { RainfallNowcastService } from '../lib/services/hydrology/rainfall-nowcast.service';
import { RunoffService } from '../lib/services/hydrology/runoff.service';
import { HydraulicService } from '../lib/services/hydrology/hydraulic.service';
import { SurfaceWaterRoutingService } from '../lib/services/hydrology/surface-routing.service';
import { FloodPredictionEngine } from '../lib/services/hydrology/flood-prediction.engine';
import { SafeRoutingService } from '../lib/services/routing/safe-routing.service';
import { getDepthColor } from '../lib/utils';

test('1. Rainfall Nowcast 0-3h Timeline Generation', async () => {
  const nowcast = await RainfallNowcastService.getNowcast(19.076, 72.8777);
  assert.equal(nowcast.timeline.length, 7); // 0, 30, 60, 90, 120, 150, 180 min
  assert.equal(nowcast.timeline[0].forecastMinutes, 0);
  assert.equal(nowcast.timeline[6].forecastMinutes, 180);
  assert.ok(nowcast.peakIntensityMmHr > 0);
});

test('2. Surface Runoff Coefficients Calculation', () => {
  assert.equal(RunoffService.getCoefficient('ROAD'), 0.85);
  assert.equal(RunoffService.getCoefficient('CONCRETE'), 0.92);
  assert.equal(RunoffService.getCoefficient('PARK'), 0.25);

  const runoff = RunoffService.calculateRunoff(50.0, 'ROAD');
  assert.equal(runoff, 42.5); // 50 * 0.85
});

test('3. Manning Hydraulic Capacity & Surcharge Trigger', () => {
  const capacity = HydraulicService.calculateManningCapacity(1.2, 1.0); // D=1.2m, Slope=1%
  assert.ok(capacity > 0);

  // Normal Inflow (2.0 m3/s < capacity)
  const normalEval = HydraulicService.evaluateHydraulics(capacity, 2.0);
  assert.equal(normalEval.isSurcharged, false);

  // Overloaded Inflow > 100% capacity
  const overloadEval = HydraulicService.evaluateHydraulics(capacity, capacity * 1.5);
  assert.equal(overloadEval.isSurcharged, true);
  assert.ok(overloadEval.overflowVolumeM3s > 0);
});

test('4. Surface Water Accumulation & Street Depth', () => {
  const terrain = {
    elevationMeters: 6.0,
    slopePercent: 0.5,
    flowDirectionDegrees: 180,
    isDepressionSink: true,
    sinkDepthCapacityCm: 5.0,
  };

  const hydraulic = {
    capacityM3s: 10.0,
    incomingFlowM3s: 15.0,
    utilizationPercent: 150.0,
    isSurcharged: true,
    overflowVolumeM3s: 5.0,
    status: 'SURCHARGED' as const,
  };

  const routing = SurfaceWaterRoutingService.computeStreetWaterAccumulation(45.0, 1.5, terrain, hydraulic);
  assert.ok(routing.streetDepthCm > 15.0);
  assert.equal(routing.isFlooded, true);
});

test('5. Flood Prediction Engine Classification & Explanation', async () => {
  const pred = await FloodPredictionEngine.predictStreet(
    'test-seg-1',
    'BKC Central Highway',
    19.076,
    72.8777,
    'ROAD',
    90
  );

  assert.equal(pred.streetId, 'test-seg-1');
  assert.ok(pred.depthCm >= 0);
  assert.ok(['LOW', 'MODERATE', 'HIGH', 'CRITICAL', 'DARK_RED'].includes(pred.riskLevel));
  assert.ok(pred.scientificExplanation.includes('rainfall nowcast'));
});

test('6. Safe Routing Engine Avoids Flooded Roads', async () => {
  const route = await SafeRoutingService.calculateSafeRoute(
    { lat: 19.05, lng: 72.85 },
    { lat: 19.10, lng: 72.90 },
    90
  );

  assert.ok(route.fastestRoute);
  assert.ok(route.safestRoute);
  assert.equal(route.safestRoute.isSafe, true);
  assert.ok(route.safestRoute.maxFloodDepthCm < route.fastestRoute.maxFloodDepthCm || route.safestRoute.maxFloodDepthCm <= 5.0);
});

test('7. Street Flood Depth Color Code Scheme', () => {
  assert.equal(getDepthColor(2.0).label.includes('GREEN'), true);
  assert.equal(getDepthColor(10.0).label.includes('YELLOW'), true);
  assert.equal(getDepthColor(20.0).label.includes('ORANGE'), true);
  assert.equal(getDepthColor(40.0).label.includes('RED'), true);
  assert.equal(getDepthColor(70.0).label.includes('DARK RED'), true);
});
