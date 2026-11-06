import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { GAME_CONSTANTS } from '../engine/GameTypes';
import type { TrackChunk, ObstacleEntity, PickupEntity, ParticleEffect } from '../engine/GameTypes';

interface TrackRendererProps {
  chunks: TrackChunk[];
  particles: ParticleEffect[];
}

export const TrackRenderer: React.FC<TrackRendererProps> = ({ chunks, particles }) => {
  const coinGroupRef = useRef<THREE.Group>(null);

  useFrame((_, delta) => {
    if (coinGroupRef.current) {
      coinGroupRef.current.children.forEach((c) => {
        c.rotation.y += delta * 3;
      });
    }
  });

  return (
    <group>
      {/* Track Road Chunks */}
      {chunks.map((chunk) => (
        <group key={chunk.id} position={[0, 0, chunk.zPosition]}>
          {/* Main 3-Lane Road surface */}
          <mesh receiveShadow position={[0, -0.05, 0]}>
            <boxGeometry args={[GAME_CONSTANTS.LANE_WIDTH * 3.6, 0.1, chunk.length]} />
            <meshStandardMaterial color="#070a14" roughness={0.3} metalness={0.7} />
          </mesh>

          {/* Left Neon Curb */}
          <mesh position={[-GAME_CONSTANTS.LANE_WIDTH * 1.8, 0.1, 0]}>
            <boxGeometry args={[0.2, 0.25, chunk.length]} />
            <meshStandardMaterial color="#00f0ff" emissive="#00f0ff" emissiveIntensity={1.5} />
          </mesh>

          {/* Right Neon Curb */}
          <mesh position={[GAME_CONSTANTS.LANE_WIDTH * 1.8, 0.1, 0]}>
            <boxGeometry args={[0.2, 0.25, chunk.length]} />
            <meshStandardMaterial color="#00f0ff" emissive="#00f0ff" emissiveIntensity={1.5} />
          </mesh>

          {/* Lane Divider 1 (-1 to 0) */}
          <mesh position={[-GAME_CONSTANTS.LANE_WIDTH * 0.5, 0.01, 0]}>
            <planeGeometry args={[0.1, chunk.length]} />
            <meshStandardMaterial
              color="#38bdf8"
              emissive="#38bdf8"
              emissiveIntensity={0.8}
              transparent
              opacity={0.6}
            />
          </mesh>

          {/* Lane Divider 2 (0 to 1) */}
          <mesh position={[GAME_CONSTANTS.LANE_WIDTH * 0.5, 0.01, 0]}>
            <planeGeometry args={[0.1, chunk.length]} />
            <meshStandardMaterial
              color="#38bdf8"
              emissive="#38bdf8"
              emissiveIntensity={0.8}
              transparent
              opacity={0.6}
            />
          </mesh>

          {/* Torii Gate at start of each chunk */}
          <group position={[0, 0, -chunk.length * 0.45]}>
            <mesh position={[-GAME_CONSTANTS.LANE_WIDTH * 1.7, 2.2, 0]}>
              <cylinderGeometry args={[0.18, 0.22, 4.4, 12]} />
              <meshStandardMaterial color="#b91c1c" roughness={0.4} />
            </mesh>
            <mesh position={[GAME_CONSTANTS.LANE_WIDTH * 1.7, 2.2, 0]}>
              <cylinderGeometry args={[0.18, 0.22, 4.4, 12]} />
              <meshStandardMaterial color="#b91c1c" roughness={0.4} />
            </mesh>
            <mesh position={[0, 4.2, 0]}>
              <boxGeometry args={[GAME_CONSTANTS.LANE_WIDTH * 4.2, 0.35, 0.4]} />
              <meshStandardMaterial color="#111" />
            </mesh>
            <mesh position={[0, 3.8, 0]}>
              <boxGeometry args={[GAME_CONSTANTS.LANE_WIDTH * 3.8, 0.15, 0.25]} />
              <meshStandardMaterial color="#00f0ff" emissive="#00f0ff" emissiveIntensity={1.4} />
            </mesh>
          </group>

          {/* Render Obstacles in Chunk */}
          {chunk.obstacles.map((obs) => {
            if (!obs.active || obs.destroyed) return null;
            return <ObstacleMesh key={obs.id} obstacle={obs} chunkZ={chunk.zPosition} />;
          })}
        </group>
      ))}

      {/* Render Pickups */}
      <group ref={coinGroupRef}>
        {chunks.flatMap((ch) => ch.pickups).map((p) => {
          if (!p.active || p.collected) return null;
          return <PickupMesh key={p.id} pickup={p} />;
        })}
      </group>

      {/* Render Particles */}
      {particles.map((pt) => (
        <mesh key={pt.id} position={pt.position}>
          {pt.type === 'special' ? (
            <ringGeometry args={[1.5 * (1 - pt.life / pt.maxLife), 2.2 * (1 - pt.life / pt.maxLife), 32]} />
          ) : (
            <sphereGeometry args={[0.15, 8, 8]} />
          )}
          <meshBasicMaterial
            color={pt.color}
            transparent
            opacity={pt.life / pt.maxLife}
            blending={THREE.AdditiveBlending}
          />
        </mesh>
      ))}
    </group>
  );
};

// Procedural Obstacle Meshes
function ObstacleMesh({ obstacle, chunkZ }: { obstacle: ObstacleEntity; chunkZ: number }) {
  // Relative to chunk position
  const relZ = obstacle.position.z - chunkZ;

  if (obstacle.type === 'hurdle_low') {
    return (
      <group position={[obstacle.position.x, obstacle.position.y, relZ]}>
        {/* Neon Trip Barrier */}
        <mesh position={[0, 0, 0]}>
          <boxGeometry args={[obstacle.size.x, obstacle.size.y, obstacle.size.z]} />
          <meshStandardMaterial
            color="#ef4444"
            emissive="#ef4444"
            emissiveIntensity={1.8}
            roughness={0.2}
          />
        </mesh>
        {/* Spikes */}
        {[-0.6, 0, 0.6].map((ox, idx) => (
          <mesh key={idx} position={[ox, 0.45, 0]}>
            <coneGeometry args={[0.15, 0.4, 8]} />
            <meshStandardMaterial color="#ffedd5" emissive="#f97316" emissiveIntensity={1.2} />
          </mesh>
        ))}
      </group>
    );
  }

  if (obstacle.type === 'laser_high') {
    return (
      <group position={[obstacle.position.x, obstacle.position.y, relZ]}>
        {/* Archway Posts */}
        <mesh position={[-1.1, -0.6, 0]}>
          <boxGeometry args={[0.2, 1.4, 0.2]} />
          <meshStandardMaterial color="#1e293b" />
        </mesh>
        <mesh position={[1.1, -0.6, 0]}>
          <boxGeometry args={[0.2, 1.4, 0.2]} />
          <meshStandardMaterial color="#1e293b" />
        </mesh>
        {/* Horizontal Laser Beam */}
        <mesh position={[0, 0.1, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.08, 0.08, 2.3, 12]} />
          <meshStandardMaterial
            color="#f43f5e"
            emissive="#f43f5e"
            emissiveIntensity={3.5}
            transparent
            opacity={0.9}
          />
        </mesh>
      </group>
    );
  }

  if (obstacle.type === 'drone_guard') {
    return (
      <group position={[obstacle.position.x, obstacle.position.y, relZ]}>
        {/* Drone Center Core */}
        <mesh>
          <sphereGeometry args={[0.4, 16, 16]} />
          <meshStandardMaterial color="#0f172a" roughness={0.3} metalness={0.9} />
        </mesh>
        {/* Red Ominous Eye */}
        <mesh position={[0, 0, 0.35]}>
          <sphereGeometry args={[0.16, 12, 12]} />
          <meshStandardMaterial color="#f43f5e" emissive="#f43f5e" emissiveIntensity={3.5} />
        </mesh>
        {/* Rotary Ring */}
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.65, 0.06, 8, 24]} />
          <meshStandardMaterial color="#38bdf8" emissive="#38bdf8" emissiveIntensity={1.2} />
        </mesh>
      </group>
    );
  }

  if (obstacle.type === 'plasma_blast') {
    return (
      <group position={[obstacle.position.x, obstacle.position.y, relZ]}>
        <mesh>
          <sphereGeometry args={[0.45, 16, 16]} />
          <meshStandardMaterial
            color="#ec4899"
            emissive="#ec4899"
            emissiveIntensity={3.0}
            wireframe
          />
        </mesh>
        <pointLight color="#ec4899" intensity={1.5} distance={4} />
      </group>
    );
  }

  return null;
}

// Procedural Pickups
function PickupMesh({ pickup }: { pickup: PickupEntity }) {
  if (pickup.type === 'coin') {
    return (
      <group position={pickup.position}>
        <mesh>
          <octahedronGeometry args={[0.3, 0]} />
          <meshStandardMaterial
            color="#facc15"
            emissive="#eab308"
            emissiveIntensity={2.0}
            roughness={0.2}
            metalness={0.8}
          />
        </mesh>
        <pointLight color="#facc15" intensity={0.5} distance={2.5} />
      </group>
    );
  }

  if (pickup.type === 'health_pack') {
    return (
      <group position={pickup.position}>
        {/* Green Health Cross */}
        <mesh>
          <boxGeometry args={[0.45, 0.16, 0.16]} />
          <meshStandardMaterial color="#10b981" emissive="#10b981" emissiveIntensity={2.5} />
        </mesh>
        <mesh>
          <boxGeometry args={[0.16, 0.45, 0.16]} />
          <meshStandardMaterial color="#10b981" emissive="#10b981" emissiveIntensity={2.5} />
        </mesh>
        <pointLight color="#10b981" intensity={0.8} distance={3} />
      </group>
    );
  }

  return null;
}
