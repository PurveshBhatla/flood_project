import test from 'node:test';
import assert from 'node:assert/strict';
import { PredictionService } from '../lib/services/prediction.service.ts';
import { getRiskLevelColor } from '../lib/utils.ts';

test('Hydrological Engine Risk Scoring Test - Low Risk', () => {
  const result = PredictionService.calculateBaselineRisk({
    latitude: 19.076,
    longitude: 72.8777,
    rainfall: 5.0,
    temperature: 24.0,
    waterLevel: 1.5,
    soilMoisture: 40.0,
  });

  assert.equal(result.riskLevel, 'LOW');
  assert.ok(result.riskScore < 35);
  assert.equal(typeof result.probability, 'number');
});

test('Hydrological Engine Risk Scoring Test - Critical Risk', () => {
  const result = PredictionService.calculateBaselineRisk({
    latitude: 26.1445,
    longitude: 91.7362,
    rainfall: 140.0,
    rainfallIntensity: 30.0,
    temperature: 26.0,
    waterLevel: 7.5,
    soilMoisture: 95.0,
  });

  assert.equal(result.riskLevel, 'CRITICAL');
  assert.ok(result.riskScore >= 75);
  assert.ok(result.probability >= 0.75);
});

test('Risk Color Helper Function Mapping', () => {
  assert.equal(getRiskLevelColor('CRITICAL').hex, '#ef4444');
  assert.equal(getRiskLevelColor('HIGH').hex, '#f97316');
  assert.equal(getRiskLevelColor('MODERATE').hex, '#f59e0b');
  assert.equal(getRiskLevelColor('LOW').hex, '#10b981');
});
