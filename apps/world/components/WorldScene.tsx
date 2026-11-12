"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useMemo, useRef, useState, useEffect } from "react";
import * as THREE from "three";
import type { DistrictId } from "../lib/world";

// OSA Cyberpunk Color Palette - Black & Yellow Primary
const COLORS = {
  black: "#000000",
  yellow: "#ffd700",
  gold: "#ffb900",
  yellowDim: "#ccaa00",
  
  nexus: "#ffd700",
  agents: "#8a2be2",
  defi: "#00ffff",
  bridge: "#ff1493",
  proof: "#ffa500",
  chain: "#0088ff",
  nodes: "#20d9ff",
  market: "#ff6600",
  
  buildingDark: "#1a1a1a",
  buildingMid: "#2a2a2a",
};

interface DistrictConfig {
  id: DistrictId;
  position: [number, number, number];
  size: [number, number, number];
  color: string;
  buildingCount: number;
  buildingHeightRange: [number, number];
  hasTower: boolean;
  towerHeight: number;
}

const districts: readonly DistrictConfig[] = [
  {
    id: "nexus",
    position: [0, 0, 0],
    size: [8, 0.1, 8],
    color: COLORS.nexus,
    buildingCount: 8,
    buildingHeightRange: [2, 5],
    hasTower: true,
    towerHeight: 8
  },
  {
    id: "agents",
    position: [-12, 0, -8],
    size: [6, 0.1, 6],
    color: COLORS.agents,
    buildingCount: 6,
    buildingHeightRange: [2, 4],
    hasTower: true,
    towerHeight: 6
  },
  {
    id: "defi",
    position: [12, 0, -8],
    size: [6, 0.1, 6],
    color: COLORS.defi,
    buildingCount: 6,
    buildingHeightRange: [2, 4.5],
    hasTower: true,
    towerHeight: 7
  },
  {
    id: "bridge",
    position: [0, 0, -18],
    size: [5, 0.1, 5],
    color: COLORS.bridge,
    buildingCount: 4,
    buildingHeightRange: [1.5, 3.5],
    hasTower: true,
    towerHeight: 9
  },
  {
    id: "proof",
    position: [-12, 0, -25],
    size: [5, 0.1, 5],
    color: COLORS.proof,
    buildingCount: 5,
    buildingHeightRange: [2, 4],
    hasTower: true,
    towerHeight: 6
  },
  {
    id: "chain",
    position: [12, 0, -25],
    size: [5, 0.1, 5],
    color: COLORS.chain,
    buildingCount: 5,
    buildingHeightRange: [2, 4.5],
    hasTower: true,
    towerHeight: 7
  },
  {
    id: "nodes",
    position: [0, 0, -35],
    size: [7, 0.1, 7],
    color: COLORS.nodes,
    buildingCount: 8,
    buildingHeightRange: [1.5, 3],
    hasTower: true,
    towerHeight: 5
  },
  {
    id: "market",
    position: [-18, 0, -15],
    size: [5, 0.1, 5],
    color: COLORS.market,
    buildingCount: 5,
    buildingHeightRange: [2, 3.5],
    hasTower: true,
    towerHeight: 6
  }
];

const cameraTargets: Record<DistrictId, THREE.Vector3> = {
  nexus: new THREE.Vector3(0, 12, 25),
  agents: new THREE.Vector3(-10, 8, 8),
  defi: new THREE.Vector3(10, 8, 8),
  bridge: new THREE.Vector3(0, 10, -5),
  proof: new THREE.Vector3(-10, 8, -18),
  chain: new THREE.Vector3(10, 8, -18),
  nodes: new THREE.Vector3(0, 8, -27),
  market: new THREE.Vector3(-16, 8, -10)
};

const lookTargets: Record<DistrictId, THREE.Vector3> = {
  nexus: new THREE.Vector3(0, 2, 0),
  agents: new THREE.Vector3(-12, 1, -8),
  defi: new THREE.Vector3(12, 1, -8),
  bridge: new THREE.Vector3(0, 2, -18),
  proof: new THREE.Vector3(-12, 1, -25),
  chain: new THREE.Vector3(12, 1, -25),
  nodes: new THREE.Vector3(0, 1, -35),
  market: new THREE.Vector3(-18, 1, -15)
};

// Reusable component for creating line geometries
function LineSegment({ start, end, color, opacity }: { 
  start: [number, number, number]; 
  end: [number, number, number]; 
  color: string; 
  opacity: number 
}) {
  return (
    <mesh position={[
      (start[0] + end[0]) / 2,
      (start[1] + end[1]) / 2,
      (start[2] + end[2]) / 2
    ]}>
      <boxGeometry args={[
        Math.sqrt(Math.pow(end[0] - start[0], 2) + Math.pow(end[2] - start[2], 2)),
        0.02,
        0.02
      ]} />
      <meshBasicMaterial color={color} transparent opacity={opacity} />
    </mesh>
  );
}

// Cyberpunk Building
function CyberpunkBuilding(props: {
  position: [number, number, number];
  width: number;
  depth: number;
  height: number;
  color: string;
  districtColor: string;
  index: number;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  
  useFrame(({ clock }) => {
    if (!meshRef.current) return;
    const time = clock.elapsedTime * 0.5 + props.index * 0.3;
    const pulse = 0.8 + Math.sin(time) * 0.2;
    const material = meshRef.current.material as THREE.MeshStandardMaterial;
    material.emissiveIntensity = pulse * 0.3;
  });

  return (
    <mesh ref={meshRef} position={props.position}>
      <boxGeometry args={[props.width, props.height, props.depth]} />
      <meshStandardMaterial
        color={props.color}
        emissive={props.districtColor}
        emissiveIntensity={0.2}
        metalness={0.3}
        roughness={0.7}
      />
    </mesh>
  );
}

// District Tower
function DistrictTower(props: {
  position: [number, number, number];
  height: number;
  color: string;
  active: boolean;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const topRef = useRef<THREE.Mesh>(null);
  
  useFrame(({ clock }) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = clock.elapsedTime * 0.05;
    }
    if (topRef.current) {
      const pulse = 1 + Math.sin(clock.elapsedTime * 2) * 0.05;
      topRef.current.scale.setScalar(props.active ? pulse * 1.1 : pulse);
    }
  });

  const segments = Math.floor(props.height / 2);
  const segmentHeight = props.height / segments;

  return (
    <group ref={groupRef} position={props.position}>
      {Array.from({ length: segments }).map((_, i) => {
        const segmentColor = i % 2 === 0 ? "#1a1a1a" : "#2a2a2a";
        const yPos = (i + 0.5) * segmentHeight - props.height / 2;
        return (
          <mesh key={i} position={[0, yPos, 0]}>
            <boxGeometry args={[1.2, segmentHeight * 0.95, 1.2]} />
            <meshStandardMaterial
              color={segmentColor}
              emissive={props.color}
              emissiveIntensity={props.active ? 0.4 : 0.15}
              metalness={0.4}
              roughness={0.5}
            />
          </mesh>
        );
      })}
      
      <mesh ref={topRef} position={[0, props.height / 2 + 0.2, 0]}>
        <coneGeometry args={[1.8, 2, 32]} />
        <meshStandardMaterial
          color={props.color}
          emissive={props.color}
          emissiveIntensity={props.active ? 2 : 0.8}
          metalness={0.6}
          roughness={0.3}
        />
      </mesh>
      
      <pointLight
        color={props.color}
        intensity={props.active ? 30 : 10}
        distance={20}
        position={[0, props.height / 2 + 1, 0]}
      />
    </group>
  );
}

// District Platform
function DistrictPlatform(props: {
  position: [number, number, number];
  size: [number, number, number];
  color: string;
  active: boolean;
  onClick: () => void;
}) {
  const platformRef = useRef<THREE.Mesh>(null);
  
  useFrame(({ clock }) => {
    if (platformRef.current) {
      const pulse = 1 + Math.sin(clock.elapsedTime * 1.5) * 0.02;
      platformRef.current.scale.set(
        props.size[0] * (props.active ? pulse * 1.02 : pulse),
        props.size[1],
        props.size[2] * (props.active ? pulse * 1.02 : pulse)
      );
    }
  });

  return (
    <group position={props.position} onClick={props.onClick}>
      <mesh ref={platformRef}>
        <boxGeometry args={[props.size[0], props.size[1], props.size[2]]} />
        <meshStandardMaterial
          color={COLORS.buildingDark}
          emissive={props.color}
          emissiveIntensity={props.active ? 0.3 : 0.1}
          metalness={0.5}
          roughness={0.4}
        />
      </mesh>
      
      <mesh position={[0, props.size[1] / 2 + 0.01, 0]}>
        <boxGeometry args={[props.size[0] * 0.98, 0.02, props.size[2] * 0.98]} />
        <meshBasicMaterial
          color={props.color}
          transparent
          opacity={props.active ? 0.6 : 0.2}
        />
      </mesh>
    </group>
  );
}

// Street Light
function StreetLight(props: {
  position: [number, number, number];
  color: string;
}) {
  return (
    <group position={props.position}>
      <mesh>
        <cylinderGeometry args={[0.03, 0.03, 3, 8]} />
        <meshStandardMaterial color="#333333" metalness={0.8} />
      </mesh>
      
      <mesh position={[0, 1.5, 0]}>
        <sphereGeometry args={[0.15, 16, 16]} />
        <meshBasicMaterial color={props.color} />
      </mesh>
      
      <pointLight
        color={props.color}
        intensity={2}
        distance={10}
        position={[0, 1.5, 0]}
      />
    </group>
  );
}

// Holographic Grid - simplified using box geometries
function HolographicGrid() {
  const gridSize = 50;
  const spacing = 2;
  
  return (
    <group>
      {Array.from({ length: Math.floor(gridSize * 2 / spacing) + 1 }).map((_, i) => {
        const x = -gridSize + i * spacing;
        return (
          <mesh key={`x-${i}`} position={[x, 0.01, 0]}>
            <boxGeometry args={[0.01, 0.01, gridSize * 2]} />
            <meshBasicMaterial color={COLORS.yellow} transparent opacity={0.1} />
          </mesh>
        );
      })}
      {Array.from({ length: Math.floor(gridSize * 2 / spacing) + 1 }).map((_, i) => {
        const z = -gridSize + i * spacing;
        return (
          <mesh key={`z-${i}`} position={[0, 0.01, z]}>
            <boxGeometry args={[gridSize * 2, 0.01, 0.01]} />
            <meshBasicMaterial color={COLORS.yellow} transparent opacity={0.1} />
          </mesh>
        );
      })}
    </group>
  );
}

// Floating Particles
function CyberpunkParticles() {
  const positions = useMemo(() => {
    const count = 200;
    const data = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      data[i * 3] = (Math.random() - 0.5) * 60;
      data[i * 3 + 1] = Math.random() * 15 + 0.5;
      data[i * 3 + 2] = (Math.random() - 0.5) * 60;
    }
    return data;
  }, []);

  return (
    <points>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial color={COLORS.yellow} size={0.05} transparent opacity={0.6} sizeAttenuation />
    </points>
  );
}

// Central Energy Core
function EnergyCore() {
  const shell = useRef<THREE.Mesh>(null);
  const core = useRef<THREE.Mesh>(null);
  
  useFrame(({ clock }) => {
    if (shell.current) {
      shell.current.rotation.y = clock.elapsedTime * 0.28;
      shell.current.rotation.x = clock.elapsedTime * 0.12;
    }
    if (core.current) {
      core.current.rotation.y = clock.elapsedTime * 0.4;
      core.current.rotation.x = clock.elapsedTime * 0.2;
    }
  });

  return (
    <group position={[0, 0.5, 0]}>
      <mesh ref={shell}>
        <icosahedronGeometry args={[2, 1]} />
        <meshStandardMaterial
          color={COLORS.black}
          emissive={COLORS.yellow}
          emissiveIntensity={1.5}
          wireframe
          transparent
          opacity={0.6}
        />
      </mesh>
      
      <mesh ref={core}>
        <icosahedronGeometry args={[0.8, 1]} />
        <meshStandardMaterial
          color={COLORS.yellow}
          emissive={COLORS.yellow}
          emissiveIntensity={3}
          metalness={0.8}
          roughness={0.2}
        />
      </mesh>
      
      <pointLight
        color={COLORS.yellow}
        intensity={40}
        distance={25}
        position={[0, 0, 0]}
      />
      
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
        <torusGeometry args={[3, 0.02, 8, 96]} />
        <meshBasicMaterial color={COLORS.yellow} transparent opacity={0.4} />
      </mesh>
      
      <mesh rotation={[Math.PI / 2, Math.PI / 4, 0]} position={[0, 0, 0]}>
        <torusGeometry args={[3.5, 0.015, 8, 96]} />
        <meshBasicMaterial color={COLORS.gold} transparent opacity={0.3} />
      </mesh>
    </group>
  );
}

// Roads connecting districts - using simple box geometries as lines
function RoadNetwork() {
  const connections = [
    [[0, 0.05, 0], [-12, 0.05, -8]],
    [[0, 0.05, 0], [12, 0.05, -8]],
    [[0, 0.05, 0], [0, 0.05, -18]],
    [[-12, 0.05, -8], [-12, 0.05, -25]],
    [[12, 0.05, -8], [12, 0.05, -25]],
    [[0, 0.05, -18], [0, 0.05, -35]],
    [[0, 0.05, -18], [-18, 0.05, -15]],
  ];
  
  return (
    <group>
      {connections.map(([start, end], i) => (
        <LineSegment
          key={i}
          start={start as [number, number, number]}
          end={end as [number, number, number]}
          color={COLORS.yellowDim}
          opacity={0.4}
        />
      ))}
    </group>
  );
}

// Teleport Camera
function TeleportCamera(props: { activeDistrict: DistrictId }) {
  const { camera } = useThree();
  useFrame(() => {
    camera.position.lerp(cameraTargets[props.activeDistrict], 0.045);
    camera.lookAt(lookTargets[props.activeDistrict]);
  });
  return null;
}

// Scene Content
function Scene(props: {
  activeDistrict: DistrictId;
  onSelect: (district: DistrictId) => void;
}) {
  return (
    <>
      <color attach="background" args={[COLORS.black]} />
      <fog attach="fog" args={[COLORS.black, 15, 50]} />
      
      <ambientLight intensity={0.2} color={COLORS.yellowDim} />
      <directionalLight
        position={[10, 20, 10]}
        intensity={1.5}
        color={COLORS.yellow}
        castShadow
      />
      <directionalLight
        position={[-10, 20, -10]}
        intensity={1}
        color="#00ffff"
      />
      
      <CyberpunkParticles />
      <HolographicGrid />
      <RoadNetwork />
      <EnergyCore />
      
      {districts.map((district) => {
        const isActive = props.activeDistrict === district.id;
        
        return (
          <group key={district.id}>
            <DistrictPlatform
              position={district.position}
              size={district.size}
              color={district.color}
              active={isActive}
              onClick={() => props.onSelect(district.id)}
            />
            
            {Array.from({ length: district.buildingCount }).map((_, i) => {
              const angle = (i / district.buildingCount) * Math.PI * 2;
              const radius = district.size[0] * 0.4;
              const x = district.position[0] + Math.cos(angle) * radius;
              const z = district.position[2] + Math.sin(angle) * radius;
              const height = district.buildingHeightRange[0] + 
                Math.random() * (district.buildingHeightRange[1] - district.buildingHeightRange[0]);
              const width = 0.8 + Math.random() * 0.4;
              const depth = 0.8 + Math.random() * 0.4;
              
              return (
                <CyberpunkBuilding
                  key={i}
                  position={[x, height / 2, z]}
                  width={width}
                  depth={depth}
                  height={height}
                  color={COLORS.buildingMid}
                  districtColor={district.color}
                  index={i}
                />
              );
            })}
            
            {district.hasTower && (
              <DistrictTower
                position={[
                  district.position[0],
                  district.towerHeight / 2,
                  district.position[2]
                ]}
                height={district.towerHeight}
                color={district.color}
                active={isActive}
              />
            )}
            
            {Array.from({ length: 3 }).map((_, i) => {
              const angle = (i / 3) * Math.PI * 2;
              const radius = district.size[0] * 0.6;
              return (
                <StreetLight
                  key={`light-${i}`}
                  position={[
                    district.position[0] + Math.cos(angle) * radius,
                    0.01,
                    district.position[2] + Math.sin(angle) * radius
                  ]}
                  color={district.color}
                />
              );
            })}
          </group>
        );
      })}
      
      <mesh position={[0, -0.1, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[100, 100]} />
        <meshStandardMaterial
          color={COLORS.buildingDark}
          metalness={0.3}
          roughness={0.9}
        />
      </mesh>
      
      <TeleportCamera activeDistrict={props.activeDistrict} />
    </>
  );
}

// Main WorldScene component with 2D fallback detection
interface WorldSceneProps {
  activeDistrict: DistrictId;
  onSelect: (district: DistrictId) => void;
}

export function WorldScene({ activeDistrict, onSelect }: WorldSceneProps) {
  const [hasWebGL, setHasWebGL] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    setHasWebGL(!!gl);

    const checkMobile = () => {
      const userAgent = navigator.userAgent.toLowerCase();
      const isMobileDevice = /android|webos|iphone|ipad|ipod|blackberry|windows phone/g.test(userAgent);
      setIsMobile(isMobileDevice || window.innerWidth <= 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Optimize for mobile - reduce quality
  const dpr: [number, number] = isMobile ? [1, 1.2] : [1, 1.8];

  if (!hasWebGL) {
    return (
      <div className="webgl-warning">
        <h3>3D Acceleration Not Available</h3>
        <p>Your device doesn&apos;t support WebGL. Switching to 2D mode for better performance.</p>
        <button onClick={() => setHasWebGL(true)}>Try 3D Anyway</button>
      </div>
    );
  }

  return (
    <Canvas
      className="world-canvas"
      camera={{ position: [0, 12, 25], fov: 50, near: 0.1, far: 100 }}
      dpr={dpr}
      gl={{ antialias: true, alpha: false, powerPreference: "high-performance" }}
    >
      <Scene activeDistrict={activeDistrict} onSelect={onSelect} />
    </Canvas>
  );
}
