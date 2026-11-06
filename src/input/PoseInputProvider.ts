import type { InputProvider, InputState } from './InputTypes';
import { GestureRecognizer } from '../vision/gestures/GestureRecognizer';
import type { RecognizedGestures } from '../vision/gestures/GestureRecognizer';
import type { CalibrationBaselines } from '../vision/calibration/PoseCalibration';
import type { GestureSettings } from '../store/useGameStore';
import type { Point3D } from '../vision/smoothing/OneEuroFilter';

export class PoseInputProvider implements InputProvider {
  private recognizer = new GestureRecognizer();
  private baselines: CalibrationBaselines;
  private settings: GestureSettings;

  private state: InputState = {
    targetLane: 0,
    laneOffset: 0,
    jumpTriggered: false,
    crouchTriggered: false,
    attackTriggered: false,
    dodgeLeftTriggered: false,
    dodgeRightTriggered: false,
    shieldTriggered: false,
    specialTriggered: false,
    isCrouching: false,
    isShielding: false,
    lastActionTime: 0,
  };

  private latestGestures: RecognizedGestures | null = null;

  constructor(baselines: CalibrationBaselines, settings: GestureSettings) {
    this.baselines = baselines;
    this.settings = settings;
  }

  public updateBaselines(b: CalibrationBaselines): void {
    this.baselines = b;
  }

  public updateSettings(s: GestureSettings): void {
    this.settings = s;
  }

  public onNewPose(landmarks: Point3D[], timestamp: number): RecognizedGestures {
    const gestures = this.recognizer.process(landmarks, timestamp, this.baselines, this.settings);
    this.latestGestures = gestures;

    this.state.targetLane = gestures.targetLane;
    this.state.isCrouching = gestures.isCrouching;
    this.state.isShielding = gestures.isShielding;

    if (gestures.jumpTriggered) {
      this.state.jumpTriggered = true;
      this.state.lastActionTime = timestamp;
    }
    if (gestures.crouchTriggered) {
      this.state.crouchTriggered = true;
      this.state.lastActionTime = timestamp;
    }
    if (gestures.attackTriggered) {
      this.state.attackTriggered = true;
      this.state.lastActionTime = timestamp;
    }
    if (gestures.shieldTriggered) {
      this.state.shieldTriggered = true;
      this.state.lastActionTime = timestamp;
    }
    if (gestures.specialTriggered) {
      this.state.specialTriggered = true;
      this.state.lastActionTime = timestamp;
    }
    if (gestures.dodgeLeftTriggered) {
      this.state.dodgeLeftTriggered = true;
      this.state.lastActionTime = timestamp;
    }
    if (gestures.dodgeRightTriggered) {
      this.state.dodgeRightTriggered = true;
      this.state.lastActionTime = timestamp;
    }

    return gestures;
  }

  public init(): void {
    // Initialized by tracker
  }

  public update(_delta: number): InputState {
    if (this.latestGestures) {
      // Smooth continuous lane offset toward recognized torso offset
      this.state.laneOffset += (this.latestGestures.laneOffset - this.state.laneOffset) * 0.25;
    }
    return this.state;
  }

  public resetTriggers(): void {
    this.state.jumpTriggered = false;
    this.state.crouchTriggered = false;
    this.state.attackTriggered = false;
    this.state.dodgeLeftTriggered = false;
    this.state.dodgeRightTriggered = false;
    this.state.shieldTriggered = false;
    this.state.specialTriggered = false;
  }

  public destroy(): void {
    this.latestGestures = null;
  }
}
