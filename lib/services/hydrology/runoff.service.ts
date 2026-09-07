export type SurfaceCategory = 'ROAD' | 'CONCRETE' | 'BUILDING' | 'SOIL' | 'PARK';

export class RunoffService {
  private static RUNOFF_COEFFICIENTS: Record<SurfaceCategory, number> = {
    CONCRETE: 0.92,
    ROAD: 0.85,
    BUILDING: 0.90,
    SOIL: 0.45,
    PARK: 0.25,
  };

  static getCoefficient(surface: SurfaceCategory | string): number {
    const key = (surface || 'ROAD').toUpperCase() as SurfaceCategory;
    return this.RUNOFF_COEFFICIENTS[key] ?? 0.85;
  }

  /**
   * Calculates effective surface runoff generated from rainfall intensity & surface type.
   * Effective Runoff (mm/h) = Rainfall Intensity (mm/h) * Runoff Coefficient
   */
  static calculateRunoff(rainfallIntensityMmHr: number, surface: SurfaceCategory | string): number {
    const coeff = this.getCoefficient(surface);
    return parseFloat((rainfallIntensityMmHr * coeff).toFixed(2));
  }
}
