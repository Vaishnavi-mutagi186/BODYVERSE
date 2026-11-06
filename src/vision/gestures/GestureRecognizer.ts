import type { Point3D } from '../smoothing/OneEuroFilter';
import type { CalibrationBaselines } from '../calibration/PoseCalibration';
import type { GestureSettings } from '../../store/useGameStore';

export interface RecognizedGestures {
  targetLane: number; // -1, 0, 1
  laneOffset: number; // continuous normalized offset
  jumpTriggered: boolean;
  crouchTriggered: boolean;
  isCrouching: boolean;
  attackTriggered: boolean;
  dodgeLeftTriggered: boolean;
  dodgeRightTriggered: boolean;
  shieldTriggered: boolean;
  isShielding: boolean;
  specialTriggered: boolean;

  // Diagnostics for debugging / calibration view
  elbowAngleLeft: number;
  elbowAngleRight: number;
  torsoOffsetX: number;
  hipDeltaY: number;
  dodgeVelocity: number;
}

export class GestureRecognizer {
  // Previous frame tracking for velocities
  private prevTimestamp = 0;
  private prevTorsoCenterX = 0.5;
  private prevHipCenterY = 0.55;
  private prevLeftWristX = 0;
  private prevLeftWristY = 0;
  private prevRightWristX = 0;
  private prevRightWristY = 0;

  // Hold timers
  private specialHoldStart: number | null = null;
  private shieldHoldStart: number | null = null;

  // Cooldown timestamps
  private lastJumpTime = 0;
  private lastPunchTime = 0;
  private lastDodgeTime = 0;
  private wasJumping = false;

  // Lane hysteresis state
  private currentLane = 0;

  private calculateAngle(a: Point3D, b: Point3D, c: Point3D): number {
    // Vector BA and Vector BC
    const vBAx = a.x - b.x;
    const vBAy = a.y - b.y;
    const vBAz = a.z - b.z;

    const vBCx = c.x - b.x;
    const vBCy = c.y - b.y;
    const vBCz = c.z - b.z;

    const dot = vBAx * vBCx + vBAy * vBCy + vBAz * vBCz;
    const magBA = Math.hypot(vBAx, vBAy, vBAz);
    const magBC = Math.hypot(vBCx, vBCy, vBCz);

    if (magBA < 1e-5 || magBC < 1e-5) return 0;
    const cosAngle = Math.max(-1.0, Math.min(1.0, dot / (magBA * magBC)));
    return (Math.acos(cosAngle) * 180) / Math.PI;
  }

  public process(
    landmarks: Point3D[],
    timestamp: number,
    baselines: CalibrationBaselines,
    settings: GestureSettings
  ): RecognizedGestures {
    const result: RecognizedGestures = {
      targetLane: this.currentLane,
      laneOffset: 0,
      jumpTriggered: false,
      crouchTriggered: false,
      isCrouching: false,
      attackTriggered: false,
      dodgeLeftTriggered: false,
      dodgeRightTriggered: false,
      shieldTriggered: false,
      isShielding: false,
      specialTriggered: false,
      elbowAngleLeft: 0,
      elbowAngleRight: 0,
      torsoOffsetX: 0,
      hipDeltaY: 0,
      dodgeVelocity: 0,
    };

    if (landmarks.length < 25) return result;

    if (this.prevTimestamp === 0) {
      this.prevTimestamp = timestamp;
      this.prevTorsoCenterX = (landmarks[11].x + landmarks[12].x + landmarks[23].x + landmarks[24].x) * 0.25;
      this.prevHipCenterY = (landmarks[23].y + landmarks[24].y) * 0.5;
      this.prevLeftWristX = landmarks[15].x;
      this.prevLeftWristY = landmarks[15].y;
      this.prevRightWristX = landmarks[16].x;
      this.prevRightWristY = landmarks[16].y;
      return result;
    }

    const dt = Math.max(1e-3, (timestamp - this.prevTimestamp) / 1000);
    this.prevTimestamp = timestamp;

    const nose = landmarks[0];
    const leftShoulder = landmarks[11];
    const rightShoulder = landmarks[12];
    const leftElbow = landmarks[13];
    const rightElbow = landmarks[14];
    const leftWrist = landmarks[15];
    const rightWrist = landmarks[16];
    const leftHip = landmarks[23];
    const rightHip = landmarks[24];

    // Reference measurements
    const shoulderWidth = Math.max(0.12, baselines.shoulderWidth);
    const torsoLength = Math.max(0.18, baselines.torsoLength);

    const shoulderCenterX = (leftShoulder.x + rightShoulder.x) * 0.5;
    const hipCenterX = (leftHip.x + rightHip.x) * 0.5;
    const hipCenterY = (leftHip.y + rightHip.y) * 0.5;
    const torsoCenterX = (shoulderCenterX + hipCenterX) * 0.5;

    // 1. Lane Detection with Hysteresis
    // In mirrored webcam view, leaning left lowers torsoCenterX -> targetLane = -1
    const rawOffset = torsoCenterX - baselines.neutralShoulderCenterX;
    const normalizedOffset = rawOffset / (shoulderWidth * 0.9);
    result.laneOffset = Math.max(-1.5, Math.min(1.5, normalizedOffset));
    result.torsoOffsetX = normalizedOffset;

    const enterThreshold = settings.laneHysteresis * 3.5;
    const exitThreshold = settings.laneHysteresis * 1.8;

    if (this.currentLane === 0) {
      if (normalizedOffset < -enterThreshold) {
        this.currentLane = -1;
      } else if (normalizedOffset > enterThreshold) {
        this.currentLane = 1;
      }
    } else if (this.currentLane === -1) {
      if (normalizedOffset > enterThreshold) {
        this.currentLane = 1;
      } else if (normalizedOffset > -exitThreshold) {
        this.currentLane = 0;
      }
    } else if (this.currentLane === 1) {
      if (normalizedOffset < -enterThreshold) {
        this.currentLane = -1;
      } else if (normalizedOffset < exitThreshold) {
        this.currentLane = 0;
      }
    }
    result.targetLane = this.currentLane;

    // 2. Dodge: Fast sideways velocity burst
    const torsoVelX = -(torsoCenterX - this.prevTorsoCenterX) / dt / shoulderWidth;
    result.dodgeVelocity = torsoVelX;

    if (Math.abs(torsoVelX) > settings.dodgeVelocityThreshold && timestamp - this.lastDodgeTime > 600) {
      if (torsoVelX < -settings.dodgeVelocityThreshold) {
        result.dodgeLeftTriggered = true;
        this.lastDodgeTime = timestamp;
      } else if (torsoVelX > settings.dodgeVelocityThreshold) {
        result.dodgeRightTriggered = true;
        this.lastDodgeTime = timestamp;
      }
    }

    // 3. Jump: Rising edge with hip delta & upward velocity
    // Y is 0 at top, so rising upward means hipCenterY < baseline
    const hipRise = baselines.neutralHipCenterY - hipCenterY;
    const normalizedRise = hipRise / torsoLength;
    result.hipDeltaY = normalizedRise;

    const hipVelY = (this.prevHipCenterY - hipCenterY) / dt / torsoLength;
    const isJumpingNow = normalizedRise > settings.jumpThreshold && hipVelY > 0.4;

    if (isJumpingNow && !this.wasJumping && timestamp - this.lastJumpTime > 500) {
      result.jumpTriggered = true;
      this.lastJumpTime = timestamp;
    }
    this.wasJumping = isJumpingNow;

    // 4. Crouch / Slide: Hip center drops below baseline
    const hipDrop = hipCenterY - baselines.neutralHipCenterY;
    const normalizedDrop = hipDrop / torsoLength;
    if (normalizedDrop > settings.crouchThreshold) {
      result.isCrouching = true;
      result.crouchTriggered = true;
    }

    // 5. Punch: Elbow extension angle + wrist speed
    const leftElbowAngle = this.calculateAngle(leftShoulder, leftElbow, leftWrist);
    const rightElbowAngle = this.calculateAngle(rightShoulder, rightElbow, rightWrist);
    result.elbowAngleLeft = leftElbowAngle;
    result.elbowAngleRight = rightElbowAngle;

    const leftWristSpeed = Math.hypot(leftWrist.x - this.prevLeftWristX, leftWrist.y - this.prevLeftWristY) / dt / shoulderWidth;
    const rightWristSpeed = Math.hypot(rightWrist.x - this.prevRightWristX, rightWrist.y - this.prevRightWristY) / dt / shoulderWidth;

    if (timestamp - this.lastPunchTime > 400) {
      const leftPunch = leftElbowAngle > settings.punchThreshold && leftWristSpeed > 1.2;
      const rightPunch = rightElbowAngle > settings.punchThreshold && rightWristSpeed > 1.2;
      if (leftPunch || rightPunch) {
        result.attackTriggered = true;
        this.lastPunchTime = timestamp;
      }
    }

    // 6. Special Power: Both wrists above nose level, held for 400ms
    const bothWristsAboveNose = leftWrist.y < nose.y - 0.02 && rightWrist.y < nose.y - 0.02;
    if (bothWristsAboveNose) {
      if (this.specialHoldStart === null) {
        this.specialHoldStart = timestamp;
      } else if (timestamp - this.specialHoldStart >= 400) {
        result.specialTriggered = true;
        this.specialHoldStart = null; // one-shot trigger
      }
    } else {
      this.specialHoldStart = null;
    }

    // 7. Shield: Both arms extended horizontally (T-Pose), level with shoulders, held 300ms
    // Must be distinguished from special power
    const leftLevel = Math.abs(leftWrist.y - leftShoulder.y) / torsoLength < 0.28;
    const rightLevel = Math.abs(rightWrist.y - rightShoulder.y) / torsoLength < 0.28;
    const armsExtended = leftElbowAngle > settings.punchThreshold - 10 && rightElbowAngle > settings.punchThreshold - 10;
    const isTPose = leftLevel && rightLevel && armsExtended && !bothWristsAboveNose;

    if (isTPose) {
      result.isShielding = true;
      if (this.shieldHoldStart === null) {
        this.shieldHoldStart = timestamp;
      } else if (timestamp - this.shieldHoldStart >= 300) {
        result.shieldTriggered = true;
        this.shieldHoldStart = null;
      }
    } else {
      this.shieldHoldStart = null;
    }

    // Update previous frame references
    this.prevTorsoCenterX = torsoCenterX;
    this.prevHipCenterY = hipCenterY;
    this.prevLeftWristX = leftWrist.x;
    this.prevLeftWristY = leftWrist.y;
    this.prevRightWristX = rightWrist.x;
    this.prevRightWristY = rightWrist.y;

    return result;
  }
}
