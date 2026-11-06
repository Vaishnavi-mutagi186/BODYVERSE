import type { InputProvider, InputState } from './InputTypes';

export class KeyboardInputProvider implements InputProvider {
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

  private pressedKeys = new Set<string>();
  private onKeyDownBound: (e: KeyboardEvent) => void;
  private onKeyUpBound: (e: KeyboardEvent) => void;

  constructor() {
    this.onKeyDownBound = this.handleKeyDown.bind(this);
    this.onKeyUpBound = this.handleKeyUp.bind(this);
  }

  public init(): void {
    window.addEventListener('keydown', this.onKeyDownBound);
    window.addEventListener('keyup', this.onKeyUpBound);
  }

  private handleKeyDown(e: KeyboardEvent): void {
    // Prevent default browser scrolling on game keys
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) {
      e.preventDefault();
    }

    if (this.pressedKeys.has(e.code)) {
      return; // Ignore repeated auto-fire for single-action triggers
    }
    this.pressedKeys.add(e.code);
    this.state.lastActionTime = performance.now();

    switch (e.code) {
      case 'ArrowLeft':
      case 'KeyA':
        this.state.targetLane = Math.max(-1, this.state.targetLane - 1);
        break;

      case 'ArrowRight':
      case 'KeyD':
        this.state.targetLane = Math.min(1, this.state.targetLane + 1);
        break;

      case 'ArrowUp':
      case 'KeyW':
      case 'Space':
        this.state.jumpTriggered = true;
        break;

      case 'ArrowDown':
      case 'KeyS':
        this.state.crouchTriggered = true;
        this.state.isCrouching = true;
        break;

      case 'KeyJ':
      case 'KeyF':
        this.state.attackTriggered = true;
        break;

      case 'KeyK':
      case 'KeyE':
        this.state.shieldTriggered = true;
        this.state.isShielding = true;
        break;

      case 'KeyL':
      case 'KeyQ':
        this.state.specialTriggered = true;
        break;

      case 'KeyZ':
        this.state.dodgeLeftTriggered = true;
        break;

      case 'KeyX':
      case 'KeyC':
        this.state.dodgeRightTriggered = true;
        break;
    }
  }

  private handleKeyUp(e: KeyboardEvent): void {
    this.pressedKeys.delete(e.code);

    if (e.code === 'ArrowDown' || e.code === 'KeyS') {
      this.state.isCrouching = false;
    }
    if (e.code === 'KeyK' || e.code === 'KeyE') {
      this.state.isShielding = false;
    }
  }

  public update(_delta: number): InputState {
    // Smooth lane offset to target lane
    this.state.laneOffset += (this.state.targetLane - this.state.laneOffset) * 0.25;
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
    window.removeEventListener('keydown', this.onKeyDownBound);
    window.removeEventListener('keyup', this.onKeyUpBound);
    this.pressedKeys.clear();
  }
}
