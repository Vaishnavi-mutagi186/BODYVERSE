import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// Procedural Torii Gate
function ToriiGate({ position, scale = 1 }: { position: [number, number, number]; scale?: number }) {
  return (
    <group position={position} scale={[scale, scale, scale]}>
      {/* Pillars */}
      <mesh position={[-2, 2.5, 0]}>
        <cylinderGeometry args={[0.2, 0.25, 5, 16]} />
        <meshStandardMaterial color="#ff1e56" emissive="#aa0e36" emissiveIntensity={0.6} roughness={0.3} />
      </mesh>
      <mesh position={[2, 2.5, 0]}>
        <cylinderGeometry args={[0.2, 0.25, 5, 16]} />
        <meshStandardMaterial color="#ff1e56" emissive="#aa0e36" emissiveIntensity={0.6} roughness={0.3} />
      </mesh>
      {/* Top lintel */}
      <mesh position={[0, 4.8, 0]}>
        <boxGeometry args={[5.2, 0.35, 0.5]} />
        <meshStandardMaterial color="#111" roughness={0.2} metalness={0.8} />
      </mesh>
      <mesh position={[0, 4.4, 0]}>
        <boxGeometry args={[4.4, 0.2, 0.3]} />
        <meshStandardMaterial color="#00f0ff" emissive="#00f0ff" emissiveIntensity={1.2} />
      </mesh>
    </group>
  );
}

// Floating cyber lanterns
function FloatingLanterns({ count = 25 }: { count?: number }) {
  const lanterns = useMemo(() => {
    return Array.from({ length: count }, (_, i) => ({
      x: (Math.random() - 0.5) * 35,
      y: 1 + Math.random() * 8,
      z: -5 - Math.random() * 35,
      speed: 0.2 + Math.random() * 0.4,
      offset: i * 0.4,
    }));
  }, [count]);

  const groupRef = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    if (!groupRef.current) return;
    const t = clock.getElapsedTime();
    groupRef.current.children.forEach((child, idx) => {
      const data = lanterns[idx];
      child.position.y = data.y + Math.sin(t * data.speed + data.offset) * 0.4;
      child.rotation.y = t * 0.5 + data.offset;
    });
  });

  return (
    <group ref={groupRef}>
      {lanterns.map((l, i) => (
        <group key={i} position={[l.x, l.y, l.z]}>
          <mesh>
            <octahedronGeometry args={[0.3, 0]} />
            <meshStandardMaterial
              color={i % 2 === 0 ? '#00f0ff' : '#f43f5e'}
              emissive={i % 2 === 0 ? '#00f0ff' : '#f43f5e'}
              emissiveIntensity={1.5}
            />
          </mesh>
          <pointLight color={i % 2 === 0 ? '#00f0ff' : '#f43f5e'} intensity={0.4} distance={3} />
        </group>
      ))}
    </group>
  );
}

// Glowing cyber grid floor
function CyberGrid() {
  const gridRef = useRef<THREE.Mesh>(null);

  useFrame((_, delta) => {
    if (gridRef.current) {
      gridRef.current.position.z = (gridRef.current.position.z + delta * 4) % 10;
    }
  });

  return (
    <group position={[0, -0.5, 0]}>
      {/* Endless animated grid */}
      <mesh ref={gridRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
        <planeGeometry args={[60, 80, 30, 40]} />
        <meshStandardMaterial
          color="#060919"
          wireframe
          wireframeLinewidth={1.5}
          emissive="#004488"
          emissiveIntensity={0.8}
        />
      </mesh>
      {/* Ground plane with subtle reflection */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.05, -20]}>
        <planeGeometry args={[80, 100]} />
        <meshStandardMaterial color="#02040a" roughness={0.1} metalness={0.9} />
      </mesh>
    </group>
  );
}

// Sakura Energy Particles
function CyberParticles({ count = 120 }: { count?: number }) {
  const pointsRef = useRef<THREE.Points>(null);

  const [positions, velocities] = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const vel = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 30;
      pos[i * 3 + 1] = Math.random() * 12;
      pos[i * 3 + 2] = -Math.random() * 40;

      vel[i * 3] = (Math.random() - 0.5) * 0.3;
      vel[i * 3 + 1] = -0.2 - Math.random() * 0.3;
      vel[i * 3 + 2] = 0.5 + Math.random() * 0.5;
    }
    return [pos, vel];
  }, [count]);

  useFrame((_, delta) => {
    if (!pointsRef.current) return;
    const posAttr = pointsRef.current.geometry.attributes.position;
    const arr = posAttr.array as Float32Array;

    for (let i = 0; i < count; i++) {
      arr[i * 3] += velocities[i * 3] * delta;
      arr[i * 3 + 1] += velocities[i * 3 + 1] * delta;
      arr[i * 3 + 2] += velocities[i * 3 + 2] * delta;

      if (arr[i * 3 + 1] < 0) arr[i * 3 + 1] = 10;
      if (arr[i * 3 + 2] > 5) arr[i * 3 + 2] = -35;
    }
    posAttr.needsUpdate = true;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.12}
        color="#c084fc"
        transparent
        opacity={0.8}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

// Camera parallax controller
function CameraRig() {
  useFrame(({ camera, pointer }) => {
    camera.position.x += (pointer.x * 1.5 - camera.position.x) * 0.05;
    camera.position.y += (3 + pointer.y * 0.8 - camera.position.y) * 0.05;
    camera.lookAt(0, 2, -15);
  });
  return null;
}

export const Background3DScene: React.FC = () => {
  return (
    <div className="absolute inset-0 pointer-events-none">
      <Canvas
        camera={{ position: [0, 3, 5], fov: 60 }}
        gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
      >
        <color attach="background" args={['#03050c']} />
        <fog attach="fog" args={['#03050c', 12, 45]} />

        <ambientLight intensity={0.4} />
        <directionalLight position={[10, 15, 10]} intensity={1.2} color="#00f0ff" />
        <directionalLight position={[-10, 10, -5]} intensity={0.8} color="#f43f5e" />

        <ToriiGate position={[0, 0, -18]} scale={1.8} />
        <ToriiGate position={[-8, 0, -28]} scale={1.4} />
        <ToriiGate position={[8, 0, -28]} scale={1.4} />

        <CyberGrid />
        <FloatingLanterns count={24} />
        <CyberParticles count={150} />
        <CameraRig />
      </Canvas>
    </div>
  );
};
