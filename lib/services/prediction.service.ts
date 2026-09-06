export interface PredictionInput {
  latitude: number;
  longitude: number;
  rainfall: number; // mm
  rainfallIntensity?: number; // mm/h
  temperature: number; // °C
  humidity?: number; // %
  waterLevel: number; // meters
  historicalRisk?: number; // 0 to 1
  soilMoisture?: number; // %
}

export interface PredictionOutput {
  riskScore: number; // 0 - 100
  probability: number; // 0.0 - 1.0
  riskLevel: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';
  confidence: number; // 0.0 - 1.0
  recommendation: string;
  source: 'ML_SERVICE' | 'HYDROLOGICAL_ENGINE';
  timestamp: string;
}

export class PredictionService {
  private static ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://127.0.0.1:8000';

  static async predict(input: PredictionInput): Promise<PredictionOutput> {
    try {
      const response = await fetch(`${this.ML_SERVICE_URL}/predict`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          latitude: input.latitude,
          longitude: input.longitude,
          rainfall: input.rainfall,
          rainfallIntensity: input.rainfallIntensity ?? input.rainfall / 3,
          temperature: input.temperature,
          humidity: input.humidity ?? 80,
          waterLevel: input.waterLevel,
          historicalRisk: input.historicalRisk ?? 0.5,
          soilMoisture: input.soilMoisture ?? 65,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        return {
          ...data,
          source: 'ML_SERVICE',
          timestamp: new Date().toISOString(),
        };
      }
    } catch (err) {
      console.warn('Python ML Service offline. Falling back to Hydrological Engine:', err);
    }

    // Hydrological baseline algorithm fallback
    return this.calculateBaselineRisk(input);
  }

  static calculateBaselineRisk(input: PredictionInput): PredictionOutput {
    const rainfall = input.rainfall;
    const waterLevel = input.waterLevel;
    const intensity = input.rainfallIntensity ?? rainfall / 2.5;
    const history = input.historicalRisk ?? 0.4;
    const soil = input.soilMoisture ?? 70;

    // Weighted scoring equation:
    // Water level (meters, threshold ~3m normal, >6m critical): weight 0.35
    const waterScore = Math.min(100, Math.max(0, (waterLevel / 8.0) * 100));

    // Rainfall (mm, threshold ~20mm normal, >100mm critical): weight 0.30
    const rainScore = Math.min(100, Math.max(0, (rainfall / 120.0) * 100));

    // Rainfall Intensity (mm/h): weight 0.15
    const intensityScore = Math.min(100, Math.max(0, (intensity / 30.0) * 100));

    // Soil Saturation (%): weight 0.10
    const soilScore = Math.min(100, Math.max(0, soil));

    // Historical Risk (0-1): weight 0.10
    const historyScore = history * 100;

    const rawScore =
      0.35 * waterScore +
      0.30 * rainScore +
      0.15 * intensityScore +
      0.10 * soilScore +
      0.10 * historyScore;

    const riskScore = parseFloat(Math.min(100, Math.max(0, rawScore)).toFixed(1));
    const probability = parseFloat((riskScore / 100).toFixed(2));

    let riskLevel: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL' = 'LOW';
    let recommendation = 'Normal environmental conditions. Continue standard monitoring.';

    if (riskScore >= 75) {
      riskLevel = 'CRITICAL';
      recommendation =
        'CRITICAL FLOOD DANGER: Move to elevated ground immediately. Prepare emergency supplies and follow evacuation directives.';
    } else if (riskScore >= 55) {
      riskLevel = 'HIGH';
      recommendation =
        'HIGH FLOOD RISK: Avoid low-lying river areas. Inspect drainage and secure emergency kits.';
    } else if (riskScore >= 35) {
      riskLevel = 'MODERATE';
      recommendation =
        'MODERATE RISK: Stay informed of local weather bulletins. Keep emergency contact details ready.';
    }

    return {
      riskScore,
      probability,
      riskLevel,
      confidence: 0.93,
      recommendation,
      source: 'HYDROLOGICAL_ENGINE',
      timestamp: new Date().toISOString(),
    };
  }
}
