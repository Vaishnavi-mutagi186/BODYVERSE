import React, { useRef, useEffect, useState, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useGameStore } from '../../store/useGameStore';
import { NinjaCharacter } from '../player/NinjaCharacter';
import { TrackRenderer } from './TrackRenderer';
import { TrackGenerator } from '../levels/TrackGenerator';
import { CollisionSystem } from '../physics/CollisionSystem';
import type { NinjaHitbox } from '../physics/CollisionSystem';
import { soundManager } from '../../audio/SoundManager';
import type { InputProvider, InputState } from '../../input/InputTypes';
import { KeyboardInputProvider } from '../../input/KeyboardInputProvider';
import { GAME_CONSTANTS } from '../engine/GameTypes';
import type { TrackChunk, ParticleEffect } from '../engine/GameTypes';

interface ShadowNinjaGameProps {
  inputProvider?: InputProvider;
  onUpdateHUD?: (hud: {
    health: number;
    score: number;
    coins: number;
    distance: number;
    specialMeter: number;
    shieldActive: boolean;
    shieldCooldown: number;
    fps: number;
  }) => void;
  onGameOver?: () => void;
}

export const ShadowNinjaGame: React.FC<ShadowNinjaGameProps> = ({
  inputProvider,
  onUpdateHUD,
  onGameOver,
}) => {
  // Fallback to keyboard if none provided
  const activeInputProvider = useMemo(() => {
    return inputProvider || new KeyboardInputProvider();
  }, [inputProvider]);

  useEffect(() => {
    activeInputProvider.init();
    return () => {
      activeInputProvider.destroy();
    };
  }, [activeInputProvider]);

  return (
    <div className="absolute inset-0 w-full h-full">
      <Canvas
        camera={{ position: [0, 3.2, 5.5], fov: 65 }}
        gl={{ antialias: true, powerPreference: 'high-performance' }}
      >
        <color attach="background" args={['#03050e']} />
        <fog attach="fog" args={['#03050e', 20, 90]} />

        <ambientLight intensity={0.5} />
        <directionalLight
          position={[10, 20, 15]}
          intensity={1.4}
          color="#38bdf8"
          castShadow
          shadow-mapSize-width={1024}
          shadow-mapSize-height={1024}
        />
        <directionalLight position={[-10, 10, -10]} intensity={0.6} color="#f43f5e" />

        <GameEngineLoop
          inputProvider={activeInputProvider}
          onUpdateHUD={onUpdateHUD}
          onGameOver={onGameOver}
        />
      </Canvas>
    </div>
  );
};

// Internal 60fps Loop Component
function GameEngineLoop({
  inputProvider,
  onUpdateHUD,
  onGameOver,
}: {
  inputProvider: InputProvider;
  onUpdateHUD?: ShadowNinjaGameProps['onUpdateHUD'];
  onGameOver?: () => void;
}) {
  const { isPaused, selectedCharacter, recordRunStats, setScreen, triggerGestureFeedback } = useGameStore();

  const trackGen = useMemo(() => new TrackGenerator(), []);
  const [chunks, setChunks] = useState<TrackChunk[]>(() => trackGen.createInitialChunks(GAME_CONSTANTS.VISIBLE_CHUNKS));
  const [particles] = useState<ParticleEffect[]>([]);

  // Persistent mutable gameplay state (NO re-renders per frame)
  const engineState = useRef({
    distance: 0,
    speed: GAME_CONSTANTS.BASE_SPEED,
    score: 0,
    coins: 0,
    health: 100,
    maxHealth: 100,
    specialMeter: 0,
    shieldActive: false,
    shieldTimer: 0,
    shieldCooldown: 0,
    enemiesDefeated: 0,
    timeElapsed: 0,

    // Player Movement & Physics
    playerX: 0,
    playerY: 0,
    playerVelY: 0,
    laneOffset: 0,
    isJumping: false,
    isSliding: false,
    slideTimer: 0,
    isPunching: false,
    punchTimer: 0,
    isDodging: false,
    dodgeTimer: 0,
    dodgeDir: null as 'left' | 'right' | null,
    isHit: false,
    hitTimer: 0,

    // Camera Shake
    cameraShake: 0,

    // FPS Meter
    frameCount: 0,
    fpsTimer: 0,
    currentFps: 60,
    hudThrottleTimer: 0,
  });

  // Character color customization
  const colorTheme = useMemo(() => {
    if (selectedCharacter === 'plasma_ronin') return '#a855f7';
    if (selectedCharacter === 'neon_spectre') return '#f43f5e';
    return '#00f0ff';
  }, [selectedCharacter]);

  // Frame Loop
  useFrame(({ camera }, delta) => {
    if (isPaused) return;

    // Clamp delta to prevent spiral of death
    const dt = Math.min(delta, 0.1);
    const s = engineState.current;

    // 1. Read input state
    const input: InputState = inputProvider.update(dt);

    // 2. Process player actions
    // Target lane and continuous offset
    s.laneOffset = input.laneOffset;
    s.playerX = input.laneOffset * GAME_CONSTANTS.LANE_WIDTH;

    // Jump
    if (input.jumpTriggered && !s.isJumping && !s.isSliding) {
      s.isJumping = true;
      s.playerVelY = GAME_CONSTANTS.JUMP_FORCE;
      soundManager.playJump();
      triggerGestureFeedback('JUMP');
    }

    // Crouch / Slide
    if ((input.crouchTriggered || input.isCrouching) && !s.isSliding) {
      s.isSliding = true;
      s.slideTimer = GAME_CONSTANTS.SLIDE_DURATION;
      soundManager.playDodge();
      triggerGestureFeedback('SLIDE');
    }

    // Punch Attack
    if (input.attackTriggered && !s.isPunching) {
      s.isPunching = true;
      s.punchTimer = GAME_CONSTANTS.PUNCH_DURATION;
      soundManager.playPunch();
      triggerGestureFeedback('PUNCH');
    }

    // Shield
    if (input.shieldTriggered && !s.shieldActive && s.shieldCooldown <= 0) {
      s.shieldActive = true;
      s.shieldTimer = GAME_CONSTANTS.SHIELD_DURATION;
      s.shieldCooldown = GAME_CONSTANTS.SHIELD_COOLDOWN;
      soundManager.playShield();
      triggerGestureFeedback('SHIELD');
    }

    // Special Shockwave
    if (input.specialTriggered && s.specialMeter >= GAME_CONSTANTS.SPECIAL_COST) {
      s.specialMeter = 0;
      s.cameraShake = 0.8;
      soundManager.playSpecial();
      triggerGestureFeedback('SPECIAL SHOCKWAVE');

      // Clear all visible obstacles in front of player
      chunks.forEach((chunk) => {
        chunk.obstacles.forEach((obs) => {
          if (obs.active && !obs.destroyed) {
            obs.destroyed = true;
            obs.active = false;
            s.score += 250;
            s.enemiesDefeated++;
          }
        });
      });
    }

    // Dodge left / right
    if (input.dodgeLeftTriggered && !s.isDodging) {
      s.isDodging = true;
      s.dodgeDir = 'left';
      s.dodgeTimer = GAME_CONSTANTS.DODGE_DURATION;
      soundManager.playDodge();
      triggerGestureFeedback('DODGE LEFT');
    } else if (input.dodgeRightTriggered && !s.isDodging) {
      s.isDodging = true;
      s.dodgeDir = 'right';
      s.dodgeTimer = GAME_CONSTANTS.DODGE_DURATION;
      soundManager.playDodge();
      triggerGestureFeedback('DODGE RIGHT');
    }

    // Reset one-shot input triggers
    inputProvider.resetTriggers();

    // 3. Physics & Timers
    // Jump physics
    if (s.isJumping) {
      s.playerVelY += GAME_CONSTANTS.GRAVITY * dt;
      s.playerY += s.playerVelY * dt;
      if (s.playerY <= 0) {
        s.playerY = 0;
        s.playerVelY = 0;
        s.isJumping = false;
      }
    }

    // Slide timer
    if (s.isSliding) {
      s.slideTimer -= dt;
      if (s.slideTimer <= 0 && !input.isCrouching) {
        s.isSliding = false;
      }
    }

    // Punch timer
    if (s.isPunching) {
      s.punchTimer -= dt;
      if (s.punchTimer <= 0) {
        s.isPunching = false;
      }
    }

    // Dodge timer
    if (s.isDodging) {
      s.dodgeTimer -= dt;
      if (s.dodgeTimer <= 0) {
        s.isDodging = false;
        s.dodgeDir = null;
      }
    }

    // Shield timers
    if (s.shieldActive) {
      s.shieldTimer -= dt;
      if (s.shieldTimer <= 0) {
        s.shieldActive = false;
      }
    }
    if (s.shieldCooldown > 0) {
      s.shieldCooldown -= dt;
    }

    // Hit flinch timer
    if (s.isHit) {
      s.hitTimer -= dt;
      if (s.hitTimer <= 0) {
        s.isHit = false;
      }
    }

    // 4. Track Scrolling & Recycling
    const forwardStep = s.speed * dt;
    s.distance += forwardStep;
    s.timeElapsed += dt;
    s.score += Math.floor(forwardStep * 2);

    let needsChunkRecycle = false;
    let furthestZ = 0;

    for (let i = 0; i < chunks.length; i++) {
      const c = chunks[i];
      c.zPosition += forwardStep;
      if (c.zPosition < furthestZ) {
        furthestZ = c.zPosition;
      }
      if (c.zPosition > GAME_CONSTANTS.CHUNK_LENGTH * 1.5) {
        needsChunkRecycle = true;
      }
    }

    if (needsChunkRecycle) {
      const updated = chunks.filter((c) => c.zPosition <= GAME_CONSTANTS.CHUNK_LENGTH * 1.5);
      const newChunk = trackGen.generateChunk(furthestZ - GAME_CONSTANTS.CHUNK_LENGTH);
      updated.push(newChunk);
      setChunks(updated);
    }

    // 5. Collision Detection
    const ninjaHitbox: NinjaHitbox = {
      position: new THREE.Vector3(s.playerX, s.playerY, 0),
      size: new THREE.Vector3(0.9, 1.8, 0.9),
      isJumping: s.isJumping,
      isSliding: s.isSliding,
      isPunching: s.isPunching,
      isShieldActive: s.shieldActive,
      isDodging: s.isDodging,
    };

    chunks.forEach((chunk) => {
      // Check obstacles
      chunk.obstacles.forEach((obs) => {
        if (!obs.active || obs.destroyed) return;

        // Punch strike check
        if (s.isPunching && CollisionSystem.checkPunchHit(ninjaHitbox.position, obs)) {
          obs.destroyed = true;
          obs.active = false;
          s.score += 300;
          s.enemiesDefeated++;
          s.specialMeter = Math.min(GAME_CONSTANTS.SPECIAL_COST, s.specialMeter + 25);
          soundManager.playPunch();
          return;
        }

        // Collision check
        const result = CollisionSystem.checkObstacleCollision(ninjaHitbox, obs);
        if (result.hit) {
          obs.active = false;
          s.health -= result.damage;
          s.isHit = true;
          s.hitTimer = 0.35;
          s.cameraShake = 0.5;
          soundManager.playHit();

          if (s.health <= 0) {
            s.health = 0;
            // Record stats and trigger Game Over
            recordRunStats({
              score: s.score,
              coins: s.coins,
              distance: Math.floor(s.distance),
              enemiesDefeated: s.enemiesDefeated,
              timeAlive: Math.floor(s.timeElapsed),
              accuracy: 95,
              perfectDodges: 12,
            });
            if (onGameOver) onGameOver();
            else setScreen('results');
          }
        }
      });

      // Check pickups
      chunk.pickups.forEach((pickup) => {
        if (!pickup.active || pickup.collected) return;
        if (CollisionSystem.checkPickup(ninjaHitbox.position, pickup)) {
          pickup.collected = true;
          pickup.active = false;
          if (pickup.type === 'coin') {
            s.coins++;
            s.score += 100;
            s.specialMeter = Math.min(GAME_CONSTANTS.SPECIAL_COST, s.specialMeter + 10);
            soundManager.playCoin();
          } else if (pickup.type === 'health_pack') {
            s.health = Math.min(s.maxHealth, s.health + 30);
            soundManager.playCoin();
          }
        }
      });
    });

    // 6. Camera Position & Shake
    const shakeX = (Math.random() - 0.5) * s.cameraShake;
    const shakeY = (Math.random() - 0.5) * s.cameraShake;
    s.cameraShake = Math.max(0, s.cameraShake - dt * 2.5);

    const targetCamX = s.playerX * 0.35 + shakeX;
    const targetCamY = 3.2 + s.playerY * 0.4 + shakeY;
    const targetCamZ = 5.6;

    camera.position.x += (targetCamX - camera.position.x) * 0.12;
    camera.position.y += (targetCamY - camera.position.y) * 0.12;
    camera.position.z = targetCamZ;
    camera.lookAt(s.playerX * 0.6, 1.4 + s.playerY * 0.3, -6);

    // 7. Throttled HUD update (10Hz) to prevent React state churn
    s.frameCount++;
    s.fpsTimer += dt;
    if (s.fpsTimer >= 1.0) {
      s.currentFps = s.frameCount;
      s.frameCount = 0;
      s.fpsTimer = 0;
    }

    s.hudThrottleTimer += dt;
    if (s.hudThrottleTimer >= 0.08) {
      s.hudThrottleTimer = 0;
      if (onUpdateHUD) {
        onUpdateHUD({
          health: s.health,
          score: s.score,
          coins: s.coins,
          distance: Math.floor(s.distance),
          specialMeter: s.specialMeter,
          shieldActive: s.shieldActive,
          shieldCooldown: Math.max(0, s.shieldCooldown),
          fps: s.currentFps,
        });
      }
    }
  });

  return (
    <>
      <NinjaCharacter
        laneOffset={engineState.current.laneOffset}
        yPos={engineState.current.playerY}
        isJumping={engineState.current.isJumping}
        isSliding={engineState.current.isSliding}
        isPunching={engineState.current.isPunching}
        isShieldActive={engineState.current.shieldActive}
        isDodging={engineState.current.isDodging}
        dodgeDir={engineState.current.dodgeDir}
        isHit={engineState.current.isHit}
        colorTheme={colorTheme}
      />
      <TrackRenderer chunks={chunks} particles={particles} />
    </>
  );
}
