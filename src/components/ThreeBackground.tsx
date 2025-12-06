import { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

function FloatingLines() {
  const linesRef = useRef<THREE.Group>(null);
  const mouseRef = useRef({ x: 0, y: 0 });

  const lines = useMemo(() => {
    const lineData = [];
    for (let i = 0; i < 30; i++) {
      const points = [];
      const startX = (Math.random() - 0.5) * 20;
      const startY = (Math.random() - 0.5) * 15;
      const startZ = (Math.random() - 0.5) * 10 - 5;

      for (let j = 0; j < 50; j++) {
        points.push(
          new THREE.Vector3(
            startX + Math.sin(j * 0.2) * 2,
            startY + j * 0.15,
            startZ + Math.cos(j * 0.15) * 1.5
          )
        );
      }

      const curve = new THREE.CatmullRomCurve3(points);
      const geometry = new THREE.TubeGeometry(curve, 50, 0.02 + Math.random() * 0.03, 8, false);

      const isPink = Math.random() > 0.5;
      const color = isPink ? new THREE.Color(0xe947f5) : new THREE.Color(0x2f4ba2);

      lineData.push({
        geometry,
        color,
        speed: 0.3 + Math.random() * 0.5,
        offset: Math.random() * Math.PI * 2,
      });
    }
    return lineData;
  }, []);

  useFrame(({ clock }) => {
    if (!linesRef.current) return;
    const time = clock.getElapsedTime();

    linesRef.current.children.forEach((child, i) => {
      const line = lines[i];
      child.position.y = Math.sin(time * line.speed + line.offset) * 0.5;
      child.rotation.z = Math.sin(time * 0.2 + line.offset) * 0.1;
    });

    linesRef.current.rotation.y = mouseRef.current.x * 0.05;
    linesRef.current.rotation.x = mouseRef.current.y * 0.03;
  });

  return (
    <group ref={linesRef}>
      {lines.map((line, i) => (
        <mesh key={i} geometry={line.geometry}>
          <meshBasicMaterial
            color={line.color}
            transparent
            opacity={0.4}
            blending={THREE.AdditiveBlending}
          />
        </mesh>
      ))}
    </group>
  );
}

function GlowOrbs() {
  const orbsRef = useRef<THREE.Group>(null);

  const orbs = useMemo(() => {
    return Array.from({ length: 8 }, () => ({
      position: [
        (Math.random() - 0.5) * 15,
        (Math.random() - 0.5) * 10,
        (Math.random() - 0.5) * 8 - 3,
      ] as [number, number, number],
      scale: 0.5 + Math.random() * 1.5,
      isPink: Math.random() > 0.5,
      speed: 0.2 + Math.random() * 0.3,
      offset: Math.random() * Math.PI * 2,
    }));
  }, []);

  useFrame(({ clock }) => {
    if (!orbsRef.current) return;
    const time = clock.getElapsedTime();

    orbsRef.current.children.forEach((child, i) => {
      const orb = orbs[i];
      child.position.y = orb.position[1] + Math.sin(time * orb.speed + orb.offset) * 1;
      child.position.x = orb.position[0] + Math.cos(time * orb.speed * 0.5 + orb.offset) * 0.5;
    });
  });

  return (
    <group ref={orbsRef}>
      {orbs.map((orb, i) => (
        <mesh key={i} position={orb.position}>
          <sphereGeometry args={[orb.scale, 32, 32]} />
          <meshBasicMaterial
            color={orb.isPink ? 0xe947f5 : 0x2f4ba2}
            transparent
            opacity={0.15}
            blending={THREE.AdditiveBlending}
          />
        </mesh>
      ))}
    </group>
  );
}

export function ThreeBackground() {
  return (
    <div className="fixed inset-0 -z-10">
      <Canvas
        camera={{ position: [0, 0, 10], fov: 60 }}
        gl={{ antialias: true, alpha: true }}
      >
        <color attach="background" args={['#0a0d14']} />
        <fog attach="fog" args={['#0a0d14', 5, 25]} />
        <FloatingLines />
        <GlowOrbs />
      </Canvas>
    </div>
  );
}
