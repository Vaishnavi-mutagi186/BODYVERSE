import * as THREE from 'three';

export type ObstacleType = 
  | 'hurdle_low'    // Jump over
  | 'laser_high'    // Slide under
  | 'drone_guard'   // Punch or Dodge
  | 'plasma_blast'; // Shield or Dodge

export type PickupType = 
  | 'coin'
  | 'health_pack';

export interface ObstacleEntity {
  id: string;
  type: ObstacleType;
  lane: number; // -1, 0, 1
  position: THREE.Vector3;
  size: THREE.Vector3;
  active: boolean;
  destroyed: boolean;
}

export interface PickupEntity {
  id: string;
  type: PickupType;
  lane: number;
  position: THREE.Vector3;
  size: THREE.Vector3;
  active: boolean;
  collected: boolean;
  rotation: number;
}

export interface TrackChunk {
  id: number;
  zPosition: number;
  length: number;
  obstacles: ObstacleEntity[];
  pickups: PickupEntity[];
}

export interface ParticleEffect {
  id: string;
  position: THREE.Vector3;
  color: string;
  type: 'hit' | 'coin' | 'special' | 'sparks';
  life: number;
  maxLife: number;
}

export const GAME_CONSTANTS = {
  LANE_WIDTH: 2.6,
  BASE_SPEED: 18.0,
  SPEED_RAMP_PER_KM: 2.5,
  JUMP_FORCE: 9.5,
  GRAVITY: -24.0,
  SLIDE_DURATION: 0.75, // seconds
  PUNCH_DURATION: 0.45,
  DODGE_DURATION: 0.4,
  SHIELD_DURATION: 3.5, // seconds
  SHIELD_COOLDOWN: 5.0, // seconds
  SPECIAL_COST: 100, // special meter max
  CHUNK_LENGTH: 30.0,
  VISIBLE_CHUNKS: 5,
};
