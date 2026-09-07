export interface HydraulicStatus {
  capacityM3s: number;
  incomingFlowM3s: number;
  utilizationPercent: number;
  isSurcharged: boolean;
  overflowVolumeM3s: number;
  status: 'NORMAL' | 'NEAR_CAPACITY' | 'SURCHARGED' | 'CRITICAL_OVERFLOW';
}

export class HydraulicService {
  /**
   * Calculates conduit discharge capacity using Manning's Equation for full pipe flow:
   * Q = (1 / n) * A * R^(2/3) * S^(1/2)
   * where:
   *  - n: Manning roughness coefficient (e.g., 0.013 for smooth concrete pipe)
   *  - A: Cross-sectional area = pi * (D/2)^2
   *  - R: Hydraulic radius = D / 4
   *  - S: Slope (m/m)
   */
  static calculateManningCapacity(diameterM: number, slopePercent: number, roughnessN: number = 0.013): number {
    const radius = diameterM / 2.0;
    const area = Math.PI * Math.pow(radius, 2);
    const hydraulicRadius = diameterM / 4.0;
    const slopeMperM = Math.max(0.001, slopePercent / 100.0);

    const Q = (1.0 / roughnessN) * area * Math.pow(hydraulicRadius, 2.0 / 3.0) * Math.sqrt(slopeMperM);
    return parseFloat(Q.toFixed(2));
  }

  /**
   * Evaluates hydraulic node/edge load against incoming surface runoff volume.
   */
  static evaluateHydraulics(capacityM3s: number, incomingFlowM3s: number): HydraulicStatus {
    const utilization = parseFloat(((incomingFlowM3s / Math.max(0.1, capacityM3s)) * 100).toFixed(1));
    const isSurcharged = utilization >= 100.0;
    const overflow = isSurcharged ? parseFloat((incomingFlowM3s - capacityM3s).toFixed(2)) : 0.0;

    let status: HydraulicStatus['status'] = 'NORMAL';
    if (utilization >= 140.0) {
      status = 'CRITICAL_OVERFLOW';
    } else if (isSurcharged) {
      status = 'SURCHARGED';
    } else if (utilization >= 80.0) {
      status = 'NEAR_CAPACITY';
    }

    return {
      capacityM3s,
      incomingFlowM3s,
      utilizationPercent: utilization,
      isSurcharged,
      overflowVolumeM3s: overflow,
      status,
    };
  }
}
