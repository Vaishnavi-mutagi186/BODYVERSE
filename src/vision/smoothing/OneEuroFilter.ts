/**
 * 1€ Filter (One Euro Filter) for noise reduction and low-latency landmark tracking.
 * Casiez, Roussel, Vogel (CHI 2012)
 */

class LowPassFilter {
  private y: number | null = null;
  private s: number | null = null;

  public filter(val: number, alpha: number): number {
    if (this.y === null) {
      this.s = val;
      this.y = val;
    } else {
      this.y = val;
      this.s = alpha * val + (1.0 - alpha) * (this.s as number);
    }
    return this.s;
  }

  public lastValue(): number {
    return this.y ?? 0;
  }

  public reset(): void {
    this.y = null;
    this.s = null;
  }
}

export class OneEuroFilter {
  private minCutoff: number;
  private beta: number;
  private dCutoff: number;
  private xFilter = new LowPassFilter();
  private dxFilter = new LowPassFilter();
  private lastTime: number | null = null;

  constructor(minCutoff = 1.0, beta = 0.007, dCutoff = 1.0) {
    this.minCutoff = minCutoff;
    this.beta = beta;
    this.dCutoff = dCutoff;
  }

  private alpha(cutoff: number, dt: number): number {
    const tau = 1.0 / (2 * Math.PI * cutoff);
    return 1.0 / (1.0 + tau / dt);
  }

  public filter(val: number, timestamp: number): number {
    if (this.lastTime === null) {
      this.lastTime = timestamp;
      return this.xFilter.filter(val, 1.0);
    }

    const dt = Math.max(1e-4, (timestamp - this.lastTime) / 1000.0);
    this.lastTime = timestamp;

    const prevVal = this.xFilter.lastValue();
    const dx = (val - prevVal) / dt;
    const edx = this.dxFilter.filter(dx, this.alpha(this.dCutoff, dt));

    const cutoff = this.minCutoff + this.beta * Math.abs(edx);
    return this.xFilter.filter(val, this.alpha(cutoff, dt));
  }

  public reset(): void {
    this.xFilter.reset();
    this.dxFilter.reset();
    this.lastTime = null;
  }
}

export interface Point3D {
  x: number;
  y: number;
  z: number;
  visibility?: number;
}

export class LandmarkSmoother {
  private filters: Map<number, { x: OneEuroFilter; y: OneEuroFilter; z: OneEuroFilter }> = new Map();

  public smooth(landmarks: Point3D[], timestamp: number): Point3D[] {
    return landmarks.map((pt, idx) => {
      // If low visibility, return original or skip filtering
      if (pt.visibility !== undefined && pt.visibility < 0.35) {
        return pt;
      }

      if (!this.filters.has(idx)) {
        this.filters.set(idx, {
          x: new OneEuroFilter(1.2, 0.015, 1.0),
          y: new OneEuroFilter(1.2, 0.015, 1.0),
          z: new OneEuroFilter(0.8, 0.008, 1.0),
        });
      }

      const f = this.filters.get(idx)!;
      return {
        x: f.x.filter(pt.x, timestamp),
        y: f.y.filter(pt.y, timestamp),
        z: f.z.filter(pt.z, timestamp),
        visibility: pt.visibility,
      };
    });
  }

  public reset(): void {
    this.filters.clear();
  }
}
