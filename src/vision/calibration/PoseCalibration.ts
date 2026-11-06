import type { Point3D } from '../smoothing/OneEuroFilter';

export interface CalibrationBaselines {
  neutralShoulderCenterX: number;
  neutralHipCenterY: number;
  shoulderWidth: number;
  torsoLength: number;
  standingHipHeight: number;
  isCalibrated: boolean;
}

export class PoseCalibration {
  private samples: CalibrationBaselines[] = [];
  private holdStartTime: number | null = null;
  private holdRequiredDuration = 3000; // 3 seconds hold

  private baselines: CalibrationBaselines = {
    neutralShoulderCenterX: 0.5,
    neutralHipCenterY: 0.55,
    shoulderWidth: 0.22,
    torsoLength: 0.35,
    standingHipHeight: 0.55,
    isCalibrated: false,
  };

  public getBaselines(): CalibrationBaselines {
    return this.baselines;
  }

  public setBaselines(b: CalibrationBaselines): void {
    this.baselines = { ...b, isCalibrated: true };
  }

  public resetCalibration(): void {
    this.samples = [];
    this.holdStartTime = null;
    this.baselines.isCalibrated = false;
  }

  public updateCalibration(landmarks: Point3D[], timestamp: number): { progress: number; isComplete: boolean } {
    if (landmarks.length < 25) {
      this.holdStartTime = null;
      this.samples = [];
      return { progress: 0, isComplete: false };
    }

    const leftShoulder = landmarks[11];
    const rightShoulder = landmarks[12];
    const leftHip = landmarks[23];
    const rightHip = landmarks[24];

    // Check visibility
    const visible =
      (leftShoulder.visibility ?? 1) > 0.4 &&
      (rightShoulder.visibility ?? 1) > 0.4 &&
      (leftHip.visibility ?? 1) > 0.4 &&
      (rightHip.visibility ?? 1) > 0.4;

    if (!visible) {
      this.holdStartTime = null;
      this.samples = [];
      return { progress: 0, isComplete: false };
    }

    const shoulderCenterX = (leftShoulder.x + rightShoulder.x) * 0.5;
    const shoulderCenterY = (leftShoulder.y + rightShoulder.y) * 0.5;
    const hipCenterX = (leftHip.x + rightHip.x) * 0.5;
    const hipCenterY = (leftHip.y + rightHip.y) * 0.5;

    const shoulderWidth = Math.hypot(leftShoulder.x - rightShoulder.x, leftShoulder.y - rightShoulder.y);
    const torsoLength = Math.hypot(shoulderCenterX - hipCenterX, shoulderCenterY - hipCenterY);

    if (this.holdStartTime === null) {
      this.holdStartTime = timestamp;
      this.samples = [];
    }

    const elapsed = timestamp - this.holdStartTime;
    const progress = Math.min(1.0, elapsed / this.holdRequiredDuration);

    this.samples.push({
      neutralShoulderCenterX: shoulderCenterX,
      neutralHipCenterY: hipCenterY,
      shoulderWidth,
      torsoLength,
      standingHipHeight: hipCenterY,
      isCalibrated: false,
    });

    if (progress >= 1.0 && this.samples.length >= 15) {
      // Average the samples for rock-solid baselines
      let sumShoulderX = 0;
      let sumHipY = 0;
      let sumWidth = 0;
      let sumTorso = 0;

      for (const s of this.samples) {
        sumShoulderX += s.neutralShoulderCenterX;
        sumHipY += s.neutralHipCenterY;
        sumWidth += s.shoulderWidth;
        sumTorso += s.torsoLength;
      }

      const count = this.samples.length;
      this.baselines = {
        neutralShoulderCenterX: sumShoulderX / count,
        neutralHipCenterY: sumHipY / count,
        shoulderWidth: Math.max(0.1, sumWidth / count),
        torsoLength: Math.max(0.15, sumTorso / count),
        standingHipHeight: sumHipY / count,
        isCalibrated: true,
      };

      return { progress: 1.0, isComplete: true };
    }

    return { progress, isComplete: false };
  }
}
