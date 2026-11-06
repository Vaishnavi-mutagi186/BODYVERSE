export interface InputState {
  // Current discrete lane: -1 (left), 0 (center), 1 (right)
  targetLane: number;
  
  // Continuous lane offset for smooth visual leaning (-1 to 1)
  laneOffset: number;

  // Discrete action triggers (consumed by game logic once per press/gesture)
  jumpTriggered: boolean;
  crouchTriggered: boolean;
  attackTriggered: boolean;
  dodgeLeftTriggered: boolean;
  dodgeRightTriggered: boolean;
  shieldTriggered: boolean;
  specialTriggered: boolean;

  // Continuous held states
  isCrouching: boolean;
  isShielding: boolean;

  // Metadata
  lastActionTime: number;
}

export interface InputProvider {
  init(): Promise<void> | void;
  update(delta: number): InputState;
  resetTriggers(): void;
  destroy(): void;
}
