import * as THREE from 'three';
import { GAME_CONSTANTS } from '../engine/GameTypes';
import type { TrackChunk, ObstacleEntity, PickupEntity, ObstacleType } from '../engine/GameTypes';

export class TrackGenerator {
  private nextChunkId = 0;
  private lanes = [-1, 0, 1]; // Left, Center, Right

  public createInitialChunks(count: number): TrackChunk[] {
    const chunks: TrackChunk[] = [];
    for (let i = 0; i < count; i++) {
      const zPos = -i * GAME_CONSTANTS.CHUNK_LENGTH;
      // First 2 chunks have no obstacles so player can get ready
      chunks.push(this.generateChunk(zPos, i < 2));
    }
    return chunks;
  }

  public generateChunk(zPosition: number, isSafe: boolean = false): TrackChunk {
    const chunkId = this.nextChunkId++;
    const obstacles: ObstacleEntity[] = [];
    const pickups: PickupEntity[] = [];

    if (!isSafe) {
      // Pick 1 or 2 lanes for obstacles (never block all 3 lanes simultaneously!)
      const shuffledLanes = [...this.lanes].sort(() => Math.random() - 0.5);
      const obstacleCount = Math.random() < 0.6 ? 1 : 2;

      const obstacleTypes: ObstacleType[] = ['hurdle_low', 'laser_high', 'drone_guard', 'plasma_blast'];

      for (let i = 0; i < obstacleCount; i++) {
        const lane = shuffledLanes[i];
        const type = obstacleTypes[Math.floor(Math.random() * obstacleTypes.length)];
        const zOffset = (Math.random() - 0.5) * (GAME_CONSTANTS.CHUNK_LENGTH * 0.6);

        let yPos = 0.4;
        let size = new THREE.Vector3(1.8, 0.7, 0.6);

        if (type === 'laser_high') {
          yPos = 1.6;
          size = new THREE.Vector3(2.2, 0.9, 0.5);
        } else if (type === 'drone_guard') {
          yPos = 1.1;
          size = new THREE.Vector3(1.2, 1.2, 1.2);
        } else if (type === 'plasma_blast') {
          yPos = 1.0;
          size = new THREE.Vector3(1.4, 1.4, 1.4);
        }

        obstacles.push({
          id: `obs_${chunkId}_${i}`,
          type,
          lane,
          position: new THREE.Vector3(lane * GAME_CONSTANTS.LANE_WIDTH, yPos, zPosition + zOffset),
          size,
          active: true,
          destroyed: false,
        });
      }

      // Spawn coins in the safe lane or around obstacles
      const safeLane = shuffledLanes[obstacleCount];
      const coinCount = 3 + Math.floor(Math.random() * 3);
      for (let c = 0; c < coinCount; c++) {
        const coinZ = zPosition - 10 + c * 3;
        pickups.push({
          id: `coin_${chunkId}_${c}`,
          type: 'coin',
          lane: safeLane,
          position: new THREE.Vector3(safeLane * GAME_CONSTANTS.LANE_WIDTH, 0.8, coinZ),
          size: new THREE.Vector3(0.6, 0.6, 0.6),
          active: true,
          collected: false,
          rotation: 0,
        });
      }

      // Occasional health pack
      if (Math.random() < 0.25) {
        pickups.push({
          id: `hp_${chunkId}`,
          type: 'health_pack',
          lane: safeLane,
          position: new THREE.Vector3(safeLane * GAME_CONSTANTS.LANE_WIDTH, 0.9, zPosition + 5),
          size: new THREE.Vector3(0.8, 0.8, 0.8),
          active: true,
          collected: false,
          rotation: 0,
        });
      }
    } else {
      // Safe chunk still has a line of coins
      for (let c = 0; c < 4; c++) {
        pickups.push({
          id: `coin_safe_${chunkId}_${c}`,
          type: 'coin',
          lane: 0,
          position: new THREE.Vector3(0, 0.8, zPosition - 8 + c * 4),
          size: new THREE.Vector3(0.6, 0.6, 0.6),
          active: true,
          collected: false,
          rotation: 0,
        });
      }
    }

    return {
      id: chunkId,
      zPosition,
      length: GAME_CONSTANTS.CHUNK_LENGTH,
      obstacles,
      pickups,
    };
  }
}
