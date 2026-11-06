import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface NinjaCharacterProps {
  laneOffset: number; // -1 to 1 continuous
  yPos: number; // vertical position (jump / ground)
  isJumping: boolean;
  isSliding: boolean;
  isPunching: boolean;
  isShieldActive: boolean;
  isDodging: boolean;
  dodgeDir: 'left' | 'right' | null;
  isHit: boolean;
  colorTheme?: string;
}

export const NinjaCharacter: React.FC<NinjaCharacterProps> = ({
  laneOffset,
  yPos,
  isJumping,
  isSliding,
  isPunching,
  isShieldActive,
  isDodging,
  dodgeDir,
  isHit,
  colorTheme = '#00f0ff',
}) => {
  const rootRef = useRef<THREE.Group>(null);
  const torsoRef = useRef<THREE.Group>(null);
  const headRef = useRef<THREE.Group>(null);
  const scarfRef = useRef<THREE.Group>(null);
  const leftArmRef = useRef<THREE.Group>(null);
  const rightArmRef = useRef<THREE.Group>(null);
  const leftLegRef = useRef<THREE.Group>(null);
  const rightLegRef = useRef<THREE.Group>(null);
  const shieldRef = useRef<THREE.Mesh>(null);
  const punchFistRef = useRef<THREE.Mesh>(null);

  // Anim state
  const runCycle = useRef(0);
  const punchAnim = useRef(0);
  const dodgeAnim = useRef(0);
  const hitAnim = useRef(0);

  useFrame((_, delta) => {
    if (!rootRef.current) return;

    // Run cycle
    if (!isJumping && !isSliding) {
      runCycle.current += delta * 15;
    }

    const t = runCycle.current;
    const bodyX = laneOffset * 2.6;
    const targetY = yPos;

    // Root position & bank angle on lane movement
    rootRef.current.position.x = bodyX;
    rootRef.current.position.y = targetY;

    // Leaning bank
    const targetBank = -laneOffset * 0.25;
    rootRef.current.rotation.z += (targetBank - rootRef.current.rotation.z) * 0.15;

    // Scarf wind wave
    if (scarfRef.current) {
      scarfRef.current.rotation.x = Math.PI / 4 + Math.sin(t * 1.5) * 0.2;
      scarfRef.current.rotation.y = Math.cos(t * 1.2) * 0.2;
    }

    // Shield effect animation
    if (shieldRef.current) {
      if (isShieldActive) {
        shieldRef.current.scale.lerp(new THREE.Vector3(1, 1, 1), 0.2);
        shieldRef.current.rotation.y += delta * 2;
        shieldRef.current.rotation.x += delta * 1.5;
      } else {
        shieldRef.current.scale.lerp(new THREE.Vector3(0.001, 0.001, 0.001), 0.25);
      }
    }

    // Hit flinch
    if (isHit) {
      hitAnim.current = 1.0;
    } else {
      hitAnim.current = Math.max(0, hitAnim.current - delta * 4);
    }

    // Punch animation progress
    if (isPunching) {
      punchAnim.current = Math.min(1.0, punchAnim.current + delta * 6);
    } else {
      punchAnim.current = Math.max(0, punchAnim.current - delta * 5);
    }

    // Dodge spin
    if (isDodging) {
      dodgeAnim.current = Math.min(1.0, dodgeAnim.current + delta * 5);
      const spinAngle = (dodgeDir === 'left' ? -Math.PI * 2 : Math.PI * 2) * dodgeAnim.current;
      rootRef.current.rotation.y = spinAngle;
    } else {
      dodgeAnim.current = 0;
      rootRef.current.rotation.y = 0;
    }

    // Limb animation blending
    if (leftArmRef.current && rightArmRef.current && leftLegRef.current && rightLegRef.current && torsoRef.current) {
      if (isSliding) {
        // Slide pose: lower torso, legs forward, arms stabilizing
        torsoRef.current.position.y = -0.4;
        torsoRef.current.rotation.x = -Math.PI / 4;
        leftLegRef.current.rotation.x = -Math.PI / 3;
        rightLegRef.current.rotation.x = -Math.PI / 3;
        leftArmRef.current.rotation.x = Math.PI / 4;
        rightArmRef.current.rotation.x = Math.PI / 4;
      } else if (isJumping) {
        // Jump pose: tuck legs, arms out
        torsoRef.current.position.y = 0;
        torsoRef.current.rotation.x = Math.PI / 10;
        leftLegRef.current.rotation.x = -Math.PI / 3;
        rightLegRef.current.rotation.x = -Math.PI / 3.5;
        leftArmRef.current.rotation.x = -Math.PI / 3;
        rightArmRef.current.rotation.x = -Math.PI / 3;
      } else {
        // Running stride
        torsoRef.current.position.y = Math.abs(Math.sin(t)) * 0.08;
        torsoRef.current.rotation.x = 0.12 - hitAnim.current * 0.3;

        leftLegRef.current.rotation.x = Math.sin(t) * 0.7;
        rightLegRef.current.rotation.x = -Math.sin(t) * 0.7;

        if (punchAnim.current > 0) {
          // Punch: right arm snaps forward
          const p = punchAnim.current;
          rightArmRef.current.rotation.x = -Math.PI / 2 * p;
          rightArmRef.current.position.z = p * 0.4;
          leftArmRef.current.rotation.x = Math.PI / 4;
        } else {
          rightArmRef.current.position.z = 0;
          leftArmRef.current.rotation.x = -Math.sin(t) * 0.65;
          rightArmRef.current.rotation.x = Math.sin(t) * 0.65;
        }
      }
    }
  });

  return (
    <group ref={rootRef} position={[0, 0, 0]}>
      {/* Dynamic Hex Energy Shield */}
      <mesh ref={shieldRef} scale={[0.001, 0.001, 0.001]} position={[0, 1.0, 0]}>
        <icosahedronGeometry args={[1.5, 2]} />
        <meshStandardMaterial
          color={colorTheme}
          emissive={colorTheme}
          emissiveIntensity={1.8}
          wireframe
          transparent
          opacity={0.7}
        />
      </mesh>

      {/* Articulated Ninja Skeleton Root */}
      <group position={[0, 0, 0]}>
        {/* Torso & Upper Body */}
        <group ref={torsoRef} position={[0, 0.9, 0]}>
          {/* Main Chestplate */}
          <mesh castShadow position={[0, 0.25, 0]}>
            <boxGeometry args={[0.55, 0.55, 0.3]} />
            <meshStandardMaterial color="#131722" roughness={0.3} metalness={0.8} />
          </mesh>

          {/* Glowing Cyber Emblem */}
          <mesh position={[0, 0.28, 0.16]}>
            <planeGeometry args={[0.22, 0.22]} />
            <meshStandardMaterial
              color={colorTheme}
              emissive={colorTheme}
              emissiveIntensity={2.5}
              transparent
              opacity={0.9}
            />
          </mesh>

          {/* Dual Katana Sheath on Back */}
          <group position={[0, 0.25, -0.2]} rotation={[0, 0, Math.PI / 5]}>
            <mesh>
              <cylinderGeometry args={[0.04, 0.04, 1.1, 8]} />
              <meshStandardMaterial color="#0a0a0f" roughness={0.5} />
            </mesh>
            <mesh position={[0, 0.6, 0]}>
              <cylinderGeometry args={[0.05, 0.05, 0.25, 8]} />
              <meshStandardMaterial color={colorTheme} emissive={colorTheme} emissiveIntensity={1.5} />
            </mesh>
          </group>

          {/* Head & Ninja Cowl */}
          <group ref={headRef} position={[0, 0.65, 0]}>
            <mesh castShadow>
              <boxGeometry args={[0.34, 0.36, 0.34]} />
              <meshStandardMaterial color="#0b0e14" roughness={0.4} />
            </mesh>
            {/* Cyber Visor Eyes */}
            <mesh position={[0, 0.03, 0.18]}>
              <boxGeometry args={[0.26, 0.06, 0.02]} />
              <meshStandardMaterial color={colorTheme} emissive={colorTheme} emissiveIntensity={3} />
            </mesh>

            {/* Trailing Ninja Scarf */}
            <group ref={scarfRef} position={[0, -0.15, -0.18]}>
              <mesh>
                <boxGeometry args={[0.18, 0.5, 0.04]} />
                <meshStandardMaterial color={colorTheme} emissive={colorTheme} emissiveIntensity={1.2} />
              </mesh>
            </group>
          </group>

          {/* Left Arm */}
          <group ref={leftArmRef} position={[-0.38, 0.42, 0]}>
            {/* Shoulder guard */}
            <mesh position={[0, 0, 0]}>
              <boxGeometry args={[0.16, 0.16, 0.18]} />
              <meshStandardMaterial color={colorTheme} emissive={colorTheme} emissiveIntensity={0.8} />
            </mesh>
            {/* Upper arm & Forearm */}
            <mesh position={[0, -0.24, 0]}>
              <boxGeometry args={[0.12, 0.36, 0.12]} />
              <meshStandardMaterial color="#1a202c" roughness={0.4} />
            </mesh>
            {/* Fist */}
            <mesh position={[0, -0.45, 0]}>
              <boxGeometry args={[0.13, 0.13, 0.13]} />
              <meshStandardMaterial color="#0f172a" />
            </mesh>
          </group>

          {/* Right Arm (Punch Arm) */}
          <group ref={rightArmRef} position={[0.38, 0.42, 0]}>
            <mesh position={[0, 0, 0]}>
              <boxGeometry args={[0.16, 0.16, 0.18]} />
              <meshStandardMaterial color={colorTheme} emissive={colorTheme} emissiveIntensity={0.8} />
            </mesh>
            <mesh position={[0, -0.24, 0]}>
              <boxGeometry args={[0.12, 0.36, 0.12]} />
              <meshStandardMaterial color="#1a202c" roughness={0.4} />
            </mesh>
            <mesh ref={punchFistRef} position={[0, -0.45, 0]}>
              <boxGeometry args={[0.15, 0.15, 0.15]} />
              <meshStandardMaterial color={colorTheme} emissive={colorTheme} emissiveIntensity={2.0} />
            </mesh>
          </group>
        </group>

        {/* Pelvis / Hips */}
        <mesh position={[0, 0.85, 0]}>
          <boxGeometry args={[0.42, 0.18, 0.26]} />
          <meshStandardMaterial color="#0f172a" />
        </mesh>

        {/* Left Leg */}
        <group ref={leftLegRef} position={[-0.18, 0.76, 0]}>
          <mesh position={[0, -0.36, 0]}>
            <boxGeometry args={[0.15, 0.68, 0.15]} />
            <meshStandardMaterial color="#131722" roughness={0.5} />
          </mesh>
          {/* Cyber Tabi Boot */}
          <mesh position={[0, -0.72, 0.05]}>
            <boxGeometry args={[0.16, 0.12, 0.24]} />
            <meshStandardMaterial color={colorTheme} emissive={colorTheme} emissiveIntensity={1.0} />
          </mesh>
        </group>

        {/* Right Leg */}
        <group ref={rightLegRef} position={[0.18, 0.76, 0]}>
          <mesh position={[0, -0.36, 0]}>
            <boxGeometry args={[0.15, 0.68, 0.15]} />
            <meshStandardMaterial color="#131722" roughness={0.5} />
          </mesh>
          <mesh position={[0, -0.72, 0.05]}>
            <boxGeometry args={[0.16, 0.12, 0.24]} />
            <meshStandardMaterial color={colorTheme} emissive={colorTheme} emissiveIntensity={1.0} />
          </mesh>
        </group>
      </group>
    </group>
  );
};
