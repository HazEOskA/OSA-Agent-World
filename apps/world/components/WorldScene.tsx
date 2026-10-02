"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import type { DistrictId } from "../lib/world";

interface DistrictVisual {
  id: DistrictId;
  position: [number, number, number];
  height: number;
  radius: number;
  color: string;
}

const visuals: readonly DistrictVisual[] = [
  { id: "nexus", position: [0, 0, 0], height: 4.8, radius: 1.25, color: "#65f7ff" },
  { id: "agents", position: [-4.4, -0.25, -3.3], height: 3.2, radius: 0.82, color: "#9d66ff" },
  { id: "defi", position: [4.2, -0.35, -3.2], height: 2.8, radius: 0.9, color: "#00ff9d" },
  { id: "bridge", position: [0.2, 0.3, -7.2], height: 5.6, radius: 1.1, color: "#ff43d1" },
  { id: "proof", position: [-4.5, 0.1, -7.5], height: 3.8, radius: 0.78, color: "#ffdb66" }
] as const;

const cameraTargets: Record<DistrictId, THREE.Vector3> = {
  nexus: new THREE.Vector3(0, 4.6, 11.5),
  agents: new THREE.Vector3(-4.2, 2.9, 4.6),
  defi: new THREE.Vector3(4.3, 2.8, 4.4),
  bridge: new THREE.Vector3(0.2, 3.7, 1.3),
  proof: new THREE.Vector3(-4.2, 3.1, 0.6)
};

function TeleportCamera({ activeDistrict }: { activeDistrict: DistrictId }) {
  const { camera } = useThree();

  useFrame(() => {
    camera.position.lerp(cameraTargets[activeDistrict], 0.045);
    camera.lookAt(
      activeDistrict === "bridge" ? 0.2 : activeDistrict === "agents" ? -2 : activeDistrict === "defi" ? 2 : -0.4,
      0.5,
      activeDistrict === "nexus" ? -2.4 : -4.2
    );
  });

  return null;
}

function EnergyCore() {
  const shell = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    if (!shell.current) return;
    shell.current.rotation.y = clock.elapsedTime * 0.28;
    shell.current.rotation.x = clock.elapsedTime * 0.12;
  });

  return (
    <group position={[0, 2.7, 0]}>
      <mesh ref={shell}>
        <icosahedronGeometry args={[0.78, 1]} />
        <meshStandardMaterial
          color="#0d1725"
          emissive="#65f7ff"
          emissiveIntensity={2.8}
          wireframe
          transparent
          opacity={0.88}
        />
      </mesh>
      <pointLight color="#65f7ff" intensity={22} distance={9} />
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[1.35, 0.018, 8, 96]} />
        <meshBasicMaterial color="#9d66ff" transparent opacity={0.8} />
      </mesh>
    </group>
  );
}

function DistrictNode({
  visual,
  active,
  onSelect
}: {
  visual: DistrictVisual;
  active: boolean;
  onSelect: (district: DistrictId) => void;
}) {
  const group = useRef<THREE.Group>(null);
  const ring = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    if (group.current) {
      const pulse = 1 + Math.sin(clock.elapsedTime * 1.8 + visual.position[0]) * 0.025;
      group.current.scale.setScalar(active ? pulse * 1.08 : pulse);
    }
    if (ring.current) ring.current.rotation.z = clock.elapsedTime * (active ? 0.55 : 0.2);
  });

  return (
    <group ref={group} position={visual.position} onClick={() => onSelect(visual.id)}>
      <mesh position={[0, visual.height / 2, 0]}>
        <cylinderGeometry args={[visual.radius * 0.42, visual.radius, visual.height, 8]} />
        <meshStandardMaterial
          color="#080b12"
          emissive={visual.color}
          emissiveIntensity={active ? 1.35 : 0.55}
          metalness={0.95}
          roughness={0.2}
        />
      </mesh>

      <mesh position={[0, visual.height * 0.62, 0]}>
        <cylinderGeometry args={[visual.radius * 0.66, visual.radius * 0.66, 0.035, 64]} />
        <meshBasicMaterial color={visual.color} transparent opacity={active ? 0.95 : 0.45} />
      </mesh>

      <mesh ref={ring} position={[0, 0.18, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[visual.radius * 1.35, active ? 0.045 : 0.02, 8, 72]} />
        <meshBasicMaterial color={visual.color} transparent opacity={active ? 1 : 0.45} />
      </mesh>

      {active ? <pointLight color={visual.color} intensity={18} distance={6} position={[0, 1.1, 0]} /> : null}
    </group>
  );
}

function DataRails() {
  return (
    <group position={[0, 0.05, -3.6]}>
      {[-4, -2, 0, 2, 4].map((x) => (
        <mesh key={x} position={[x, 0, 0]}>
          <boxGeometry args={[0.015, 0.015, 10]} />
          <meshBasicMaterial color={x === 0 ? "#ff43d1" : "#245978"} transparent opacity={x === 0 ? 0.7 : 0.26} />
        </mesh>
      ))}
    </group>
  );
}

function StarField() {
  const positions = useMemo(() => {
    const data = new Float32Array(900);
    for (let i = 0; i < 300; i += 1) {
      const phase = i * 2.399963;
      const radius = 10 + (i % 31) * 0.5;
      data[i * 3] = Math.cos(phase) * radius;
      data[i * 3 + 1] = ((i * 17) % 140) / 10 - 4;
      data[i * 3 + 2] = Math.sin(phase) * radius - 8;
    }
    return data;
  }, []);

  return (
    <points>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial color="#b8f8ff" size={0.025} transparent opacity={0.7} sizeAttenuation />
    </points>
  );
}

function Scene({
  activeDistrict,
  onSelect
}: {
  activeDistrict: DistrictId;
  onSelect: (district: DistrictId) => void;
}) {
  return (
    <>
      <color attach="background" args={["#02030a"]} />
      <fog attach="fog" args={["#02030a", 9, 31]} />
      <ambientLight intensity={0.35} />
      <directionalLight position={[2, 8, 5]} intensity={1.4} color="#839cff" />
      <TeleportCamera activeDistrict={activeDistrict} />
      <StarField />
      <DataRails />
      <EnergyCore />

      <gridHelper args={[30, 60, "#173c52", "#07131c"]} position={[0, 0, -4]} />

      {visuals.map((visual) => (
        <DistrictNode
          key={visual.id}
          visual={visual}
          active={activeDistrict === visual.id}
          onSelect={onSelect}
        />
      ))}

      <mesh position={[0, -0.12, -3.8]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[26, 26]} />
        <meshStandardMaterial color="#03050a" metalness={0.55} roughness={0.72} />
      </mesh>
    </>
  );
}

export function WorldScene({
  activeDistrict,
  onSelect
}: {
  activeDistrict: DistrictId;
  onSelect: (district: DistrictId) => void;
}) {
  return (
    <Canvas
      className="world-canvas"
      camera={{ position: [0, 4.6, 11.5], fov: 48, near: 0.1, far: 80 }}
      dpr={[1, 1.8]}
      gl={{ antialias: true, alpha: false, powerPreference: "high-performance" }}
    >
      <Scene activeDistrict={activeDistrict} onSelect={onSelect} />
    </Canvas>
  );
}
