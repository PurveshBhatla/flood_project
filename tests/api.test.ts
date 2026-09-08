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

test('8. Centralized 4-Tier Rainfall Classification & Thresholds', () => {
  const { classifyRainfallIntensity, RAINFALL_THRESHOLDS } = require('../lib/utils');
  assert.equal(RAINFALL_THRESHOLDS.LOW_MAX, 10);
  assert.equal(RAINFALL_THRESHOLDS.MODERATE_MAX, 25);
  assert.equal(RAINFALL_THRESHOLDS.HEAVY_MAX, 50);

  const low = classifyRainfallIntensity(5.0);
  assert.equal(low.category, 'LOW');
  assert.equal(low.color, 'GREEN');
  assert.equal(low.hex, '#10b981');

  const mod = classifyRainfallIntensity(18.5);
  assert.equal(mod.category, 'MODERATE');
  assert.equal(mod.color, 'YELLOW');
  assert.equal(mod.hex, '#f59e0b');

  const heavy = classifyRainfallIntensity(35.0);
  assert.equal(heavy.category, 'HEAVY');
  assert.equal(heavy.color, 'ORANGE');
  assert.equal(heavy.hex, '#f97316');

  const extreme = classifyRainfallIntensity(65.0);
  assert.equal(extreme.category, 'EXTREME');
  assert.equal(extreme.color, 'RED');
  assert.equal(extreme.hex, '#ef4444');
});

test('9. Dynamic India-Wide Rainfall Grid & Hotspot Ranking', async () => {
  const { RainfallService, HeavyRainfallDetectionService } = require('../lib/services/rainfall.service');
  const result = await RainfallService.getRainfall();
  assert.ok(['live', 'demo'].includes(result.mode));
  assert.ok(result.cells.length >= 10);
  assert.ok(Array.isArray(result.hotspots));

  if (result.hotspots.length > 0) {
    const topSpot = result.hotspots[0];
    assert.ok(topSpot.rainfallMmPerHour >= 25.0);
    assert.ok(['HEAVY', 'EXTREME'].includes(topSpot.severity));
    assert.ok(topSpot.name);
    assert.ok(topSpot.state);
  }
});

test('10. HeavyRainfallDetectionService Filters & Sorts Hotspots', () => {
  const { HeavyRainfallDetectionService } = require('../lib/services/rainfall.service');
  const sampleCells = [
    { id: '1', lat: 26.14, lng: 91.73, rainfallMmPerHour: 72.0, category: 'EXTREME', color: 'RED', region: 'Guwahati', state: 'Assam', locationName: 'Guwahati, Assam', timestamp: '2026-09-08' },
    { id: '2', lat: 19.07, lng: 72.87, rainfallMmPerHour: 18.0, category: 'MODERATE', color: 'YELLOW', region: 'Mumbai', state: 'Maharashtra', locationName: 'Mumbai, Maharashtra', timestamp: '2026-09-08' },
    { id: '3', lat: 20.29, lng: 85.82, rainfallMmPerHour: 43.0, category: 'HEAVY', color: 'ORANGE', region: 'Bhubaneswar', state: 'Odisha', locationName: 'Bhubaneswar, Odisha', timestamp: '2026-09-08' },
  ];

  const hotspots = HeavyRainfallDetectionService.detectHotspots(sampleCells, 25.0);
  assert.equal(hotspots.length, 2);
  assert.equal(hotspots[0].name, 'Guwahati'); // Highest first
  assert.equal(hotspots[1].name, 'Bhubaneswar');
});

test('11. RescueResourceService Emergency Availability Feed', async () => {
  const { RescueResourceService } = require('../lib/services/rescue-resource.service');
  const data = await RescueResourceService.getResources(19.076, 72.8777);
  assert.ok(['live', 'demo'].includes(data.mode));
  assert.ok(data.summary.ambulances.count >= 0);
  assert.ok(data.summary.rescueTeams.count >= 0);
  assert.ok(data.summary.shelters.count >= 0);
  assert.ok(data.summary.rescueBoats.count >= 0);
  assert.ok(data.resources.length > 0);
  assert.ok(data.resources[0].latitude);
  assert.ok(data.resources[0].longitude);
});

test('12. Haversine Distance Calculation & Nearest Safe Shelters Sorting', () => {
  const { haversineDistance } = require('../lib/utils');
  
  // Coordinates for Mumbai center (19.076, 72.8777) to Bandra (19.0596, 72.8295)
  const distBand = haversineDistance(19.076, 72.8777, 19.0596, 72.8295);
  // Distance to Thane (19.2183, 72.9781)
  const distThane = haversineDistance(19.076, 72.8777, 19.2183, 72.9781);

  assert.ok(distBand > 0 && distBand < 10, 'Bandra distance should be ~5-6 km');
  assert.ok(distThane > distBand, 'Thane should be further than Bandra');

  const shelters = [
    { name: 'Far Shelter', lat: 19.2183, lng: 72.9781, status: 'AVAILABLE', count: 100 },
    { name: 'Near Safe Shelter', lat: 19.088, lng: 72.870, status: 'AVAILABLE', count: 200 },
    { name: 'Unsafe Full Shelter', lat: 19.077, lng: 72.878, status: 'UNAVAILABLE', count: 0 },
  ];

  const userLat = 19.076;
  const userLng = 72.8777;

  const sortedSafe = shelters
    .map((s) => ({
      ...s,
      dist: haversineDistance(userLat, userLng, s.lat, s.lng),
      isSafe: s.status === 'AVAILABLE' && s.count > 0,
    }))
    .filter((s) => s.isSafe)
    .sort((a, b) => a.dist - b.dist);

  assert.equal(sortedSafe[0].name, 'Near Safe Shelter');
  assert.ok(sortedSafe[0].dist < sortedSafe[1].dist);
});

test('13. WeatherService Rainfall Forecast & Early Rain Alert Pipeline', async () => {
  const { WeatherService } = require('../lib/services/weather.service');
  const weather = await WeatherService.getWeather(19.076, 72.8777);

  assert.ok(weather.forecast, 'Weather data must contain forecast object');
  assert.ok(weather.forecast.hourly.length === 7, 'Forecast must contain 7 hourly steps (0h to 6h)');
  assert.ok(weather.forecast.next1hMmHr >= 0);
  assert.ok(weather.forecast.next3hPeakMmHr >= 0);
  assert.ok(weather.forecast.next6hPeakMmHr >= 0);
  assert.ok(weather.forecast.warningTitle, 'Forecast warning title must be defined');
  assert.ok(['live', 'demo'].includes(weather.forecast.mode));
});

test('14. EmergencyKnowledgeService Protocols & Query Engine', () => {
  const { EmergencyKnowledgeService } = require('../lib/services/emergency-knowledge.service');

  const res1 = EmergencyKnowledgeService.queryEmergencyAI('Water is entering my house', 'Mumbai');
  assert.ok(res1.actionableSteps.length > 0);
  assert.ok(res1.warnings.length > 0);
  assert.equal(res1.emergencyContacts[0].number, '112');

  const res2 = EmergencyKnowledgeService.queryEmergencyAI('My car is stuck in flood water');
  assert.equal(res2.category, 'VEHICLE');
  assert.ok(res2.actionableSteps.some((s: string) => s.toLowerCase().includes('vehicle') || s.toLowerCase().includes('car')));
});

test('15. DemoScenarioService High Flood Risk (+2h Nowcast) Simulation', () => {
  const { DemoScenarioService } = require('../lib/services/demo-scenario.service');

  const demo = DemoScenarioService.getHighFloodScenario();
  assert.equal(demo.isDemoActive, true);
  assert.equal(demo.isSimulatedAlert, true);
  assert.equal(demo.prediction.riskLevel, 'CRITICAL RED ALERT');
  assert.equal(demo.prediction.riskScore, 94);
  assert.equal(demo.telemetry.drainageUtilization, 142);
  assert.equal(demo.telemetry.rainfallMmHr, 78.4);
  assert.equal(demo.telemetry.soilSaturationPercent, 96);
  assert.ok(demo.prediction.nowcastBannerText.includes('SIH26085 EARLY WARNING'));
  assert.ok(demo.prediction.drainNodePopupText.includes('Drain Node #D-14 Overflowing'));
});








