import * as THREE from 'three';
import type { ObstacleEntity, PickupEntity } from '../engine/GameTypes';

export interface NinjaHitbox {
  position: THREE.Vector3;
  size: THREE.Vector3;
  isJumping: boolean;
  isSliding: boolean;
  isPunching: boolean;
  isShieldActive: boolean;
  isDodging: boolean;
}

export class CollisionSystem {
  // AABB Intersection check
  public static checkAABB(
    posA: THREE.Vector3,
    sizeA: THREE.Vector3,
    posB: THREE.Vector3,
    sizeB: THREE.Vector3
  ): boolean {
    const halfA = sizeA.clone().multiplyScalar(0.5);
    const halfB = sizeB.clone().multiplyScalar(0.5);

    return (
      Math.abs(posA.x - posB.x) < halfA.x + halfB.x &&
      Math.abs(posA.y - posB.y) < halfA.y + halfB.y &&
      Math.abs(posA.z - posB.z) < halfA.z + halfB.z
    );
  }

  // Check punch strike collision against drone guards
  public static checkPunchHit(ninjaPos: THREE.Vector3, obstacle: ObstacleEntity): boolean {
    if (obstacle.type !== 'drone_guard' || !obstacle.active || obstacle.destroyed) {
      return false;
    }

    // Punch strike box in front of player
    const punchReachZ = 3.0;
    const punchWidth = 1.8;
    const inPunchReach =
      Math.abs(ninjaPos.x - obstacle.position.x) < punchWidth &&
      obstacle.position.z <= ninjaPos.z &&
      obstacle.position.z >= ninjaPos.z - punchReachZ;

    return inPunchReach;
  }

  // Check ninja collision against an obstacle
  public static checkObstacleCollision(
    ninja: NinjaHitbox,
    obstacle: ObstacleEntity
  ): { hit: boolean; avoided: boolean; damage: number } {
    if (!obstacle.active || obstacle.destroyed) {
      return { hit: false, avoided: false, damage: 0 };
    }

    // Adjust ninja hitbox based on stance
    let ninjaY = ninja.position.y + 0.9;
    let ninjaHeight = 1.7;
    let ninjaDepth = 0.8;

    if (ninja.isSliding) {
      ninjaY = ninja.position.y + 0.35;
      ninjaHeight = 0.7;
      ninjaDepth = 1.4;
    }

    const ninjaCenter = new THREE.Vector3(ninja.position.x, ninjaY, ninja.position.z);
    const ninjaSize = new THREE.Vector3(0.9, ninjaHeight, ninjaDepth);

    const isColliding = this.checkAABB(ninjaCenter, ninjaSize, obstacle.position, obstacle.size);
    if (!isColliding) {
      return { hit: false, avoided: false, damage: 0 };
    }

    // If shield active, absorbs hit completely
    if (ninja.isShieldActive) {
      obstacle.active = false;
      return { hit: false, avoided: true, damage: 0 };
    }

    // If dodging, grants invulnerability
    if (ninja.isDodging) {
      obstacle.active = false;
      return { hit: false, avoided: true, damage: 0 };
    }

    // Specific obstacle evasion checks:
    if (obstacle.type === 'hurdle_low') {
      // Must jump over hurdle
      if (ninja.position.y > 0.8) {
        return { hit: false, avoided: true, damage: 0 };
      }
      return { hit: true, avoided: false, damage: 25 };
    }

    if (obstacle.type === 'laser_high') {
      // Must slide under laser arch
      if (ninja.isSliding) {
        return { hit: false, avoided: true, damage: 0 };
      }
      return { hit: true, avoided: false, damage: 30 };
    }

    if (obstacle.type === 'drone_guard') {
      if (ninja.isPunching) {
        obstacle.destroyed = true;
        obstacle.active = false;
        return { hit: false, avoided: true, damage: 0 };
      }
      return { hit: true, avoided: false, damage: 25 };
    }

    if (obstacle.type === 'plasma_blast') {
      return { hit: true, avoided: false, damage: 35 };
    }

    return { hit: true, avoided: false, damage: 20 };
  }

  // Check pickup collision
  public static checkPickup(ninjaPos: THREE.Vector3, pickup: PickupEntity): boolean {
    if (!pickup.active || pickup.collected) return false;
    const ninjaCenter = new THREE.Vector3(ninjaPos.x, ninjaPos.y + 0.8, ninjaPos.z);
    const ninjaSize = new THREE.Vector3(1.0, 1.6, 1.0);
    return this.checkAABB(ninjaCenter, ninjaSize, pickup.position, pickup.size);
  }
}
