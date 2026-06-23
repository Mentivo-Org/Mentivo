"use client";

import { useRef, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Float, Points, PointMaterial } from '@react-three/drei';
import * as THREE from 'three';

// Generates abstract wave particles
function ParticleWave() {
  const ref = useRef<THREE.Points>(null!);
  const { mouse, viewport } = useThree();

  const count = 5000;
  const positions = useMemo(() => {
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 20; // x
      positions[i * 3 + 1] = (Math.random() - 0.5) * 20; // y
      positions[i * 3 + 2] = (Math.random() - 0.5) * 20; // z
    }
    return positions;
  }, [count]);

  useFrame((state, delta) => {
    if (ref.current) {
      ref.current.rotation.x -= delta / 10;
      ref.current.rotation.y -= delta / 15;

      // React to mouse movement
      const targetX = (mouse.x * viewport.width) / 10;
      const targetY = (mouse.y * viewport.height) / 10;

      ref.current.position.x += (targetX - ref.current.position.x) * delta * 2;
      ref.current.position.y += (targetY - ref.current.position.y) * delta * 2;
    }
  });

  return (
    <Points ref={ref} positions={positions} stride={3} frustumCulled={false}>
      <PointMaterial
        transparent
        color="#0077cb"
        size={0.05}
        sizeAttenuation={true}
        depthWrite={false}
        opacity={0.4}
      />
    </Points>
  );
}

// Geometric shapes floating around
function FloatingShapes() {
  const groupRef = useRef<THREE.Group>(null!);
  const { mouse, viewport } = useThree();

  useFrame((state, delta) => {
    if (groupRef.current) {
      const targetX = (mouse.x * viewport.width) / 20;
      const targetY = (mouse.y * viewport.height) / 20;
      
      groupRef.current.rotation.y += delta * 0.1;
      groupRef.current.position.x += (targetX - groupRef.current.position.x) * delta * 2;
      groupRef.current.position.y += (targetY - groupRef.current.position.y) * delta * 2;
    }
  });

  return (
    <group ref={groupRef}>
      <Float speed={1.5} rotationIntensity={1.5} floatIntensity={2}>
        <mesh position={[4, 2, -5]}>
          <octahedronGeometry args={[1]} />
          <meshStandardMaterial color="#39b8fd" wireframe />
        </mesh>
      </Float>
      
      <Float speed={2} rotationIntensity={2} floatIntensity={1.5}>
        <mesh position={[-5, -2, -8]}>
          <torusGeometry args={[1.5, 0.4, 16, 100]} />
          <meshStandardMaterial color="#004666" transparent opacity={0.8} />
        </mesh>
      </Float>

      <Float speed={1} rotationIntensity={1} floatIntensity={2.5}>
        <mesh position={[5, -4, -10]}>
          <icosahedronGeometry args={[2]} />
          <meshStandardMaterial color="#eff4ff" wireframe />
        </mesh>
      </Float>

      <Float speed={2.5} rotationIntensity={1.5} floatIntensity={1}>
        <mesh position={[-3, 4, -6]}>
          <sphereGeometry args={[0.8, 32, 32]} />
          <meshStandardMaterial color="#0077cb" transparent opacity={0.6} />
        </mesh>
      </Float>
    </group>
  );
}

export default function ThreeBackground() {
  return (
    <div className="absolute inset-0 z-0 pointer-events-auto">
      <Canvas camera={{ position: [0, 0, 5], fov: 75 }}>
        <ambientLight intensity={0.5} />
        <directionalLight position={[10, 10, 5]} intensity={1} />
        <ParticleWave />
        <FloatingShapes />
      </Canvas>
    </div>
  );
}
