"use client";

import { useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { journeyState } from "@/lib/journeyState";

const STATIONS = {
  hero: 6,
  classroom: -14,
  lab: -34,
  molecule: -54,
  horizon: -76,
};

const PALETTE = {
  primary: "#15803d",
  secondary: "#22c55e",
  accent: "#d97706",
  fog: "#0b1a10",
};

function CameraRig() {
  const target = useMemo(() => new THREE.Vector3(), []);
  useFrame((state) => {
    const p = journeyState.progress;
    // Camera z travels from the hero station to the horizon station.
    const z = THREE.MathUtils.lerp(STATIONS.hero, STATIONS.horizon, p);
    const sway = Math.sin(p * Math.PI * 6) * 0.6;
    const bob = Math.sin(p * Math.PI * 10) * 0.15;

    state.camera.position.x = THREE.MathUtils.damp(state.camera.position.x, sway, 4, 0.1);
    state.camera.position.y = THREE.MathUtils.damp(state.camera.position.y, 1.2 + bob, 4, 0.1);
    state.camera.position.z = THREE.MathUtils.damp(state.camera.position.z, z, 6, 0.1);

    target.set(sway * 0.5, 1, z - 12);
    state.camera.lookAt(target);
  });
  return null;
}

function Starfield() {
  const positions = useMemo(() => {
    const count = 600;
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      arr[i * 3] = (Math.random() - 0.5) * 60;
      arr[i * 3 + 1] = (Math.random() - 0.5) * 40;
      arr[i * 3 + 2] = Math.random() * -100 + 10;
    }
    return arr;
  }, []);

  const ref = useRef<THREE.Points>(null);
  useFrame((_, delta) => {
    if (ref.current) ref.current.rotation.y += delta * 0.01;
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial size={0.06} color={PALETTE.secondary} transparent opacity={0.5} />
    </points>
  );
}

function ClassroomScene() {
  const desks = useMemo(
    () =>
      Array.from({ length: 9 }, (_, i) => ({
        x: (i % 3) * 3 - 3,
        z: Math.floor(i / 3) * 3 - 3,
      })),
    [],
  );

  return (
    <group position={[0, -1.5, STATIONS.classroom]}>
      {/* Floor */}
      <mesh position={[0, -0.02, -2]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[14, 12]} />
        <meshStandardMaterial color="#0a1a10" roughness={1} />
      </mesh>
      {/* Blackboard, glowing like a projected slide */}
      <mesh position={[0, 3.2, -6]} receiveShadow>
        <planeGeometry args={[10, 5]} />
        <meshStandardMaterial
          color="#0f2417"
          emissive={PALETTE.secondary}
          emissiveIntensity={0.12}
          roughness={0.6}
        />
      </mesh>
      <mesh position={[0, 3.2, -5.94]}>
        <planeGeometry args={[7, 0.06]} />
        <meshStandardMaterial color={PALETTE.secondary} emissive={PALETTE.secondary} emissiveIntensity={1.2} />
      </mesh>
      {desks.map((d, i) => (
        <mesh key={i} position={[d.x, 0.4, d.z]} castShadow>
          <boxGeometry args={[1.4, 0.8, 0.9]} />
          <meshStandardMaterial
            color={PALETTE.primary}
            emissive={PALETTE.primary}
            emissiveIntensity={0.25}
            roughness={0.4}
          />
        </mesh>
      ))}
      <pointLight position={[0, 4, 2]} intensity={30} color={PALETTE.accent} />
      <pointLight position={[0, 3, -6]} intensity={20} color={PALETTE.secondary} />
      <spotLight position={[0, 8, 4]} intensity={25} angle={0.6} penumbra={0.6} color="#ffffff" />
    </group>
  );
}

function LabScene() {
  const flaskRef = useRef<THREE.Mesh>(null);
  useFrame((state) => {
    if (flaskRef.current) {
      flaskRef.current.rotation.y = state.clock.elapsedTime * 0.3;
    }
  });

  const steam = useMemo(() => {
    const count = 120;
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      arr[i * 3] = (Math.random() - 0.5) * 2;
      arr[i * 3 + 1] = Math.random() * 4;
      arr[i * 3 + 2] = (Math.random() - 0.5) * 2;
    }
    return arr;
  }, []);

  return (
    <group position={[0, -1, STATIONS.lab]}>
      {/* Flask */}
      <mesh ref={flaskRef} position={[0, 0.6, 0]} castShadow>
        <sphereGeometry args={[1, 32, 32]} />
        <meshPhysicalMaterial
          color={PALETTE.secondary}
          transmission={0.85}
          roughness={0.1}
          thickness={0.6}
          ior={1.4}
        />
      </mesh>
      {/* Condenser */}
      <mesh position={[0, 2.6, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.18, 0.18, 2.4, 16]} />
        <meshPhysicalMaterial color="#a7f3d0" transmission={0.7} roughness={0.15} />
      </mesh>
      {/* Ring stand */}
      <mesh position={[0, 0.6, 0]}>
        <torusGeometry args={[1.3, 0.03, 8, 32]} />
        <meshStandardMaterial color={PALETTE.accent} metalness={0.6} roughness={0.3} />
      </mesh>

      <points position={[0, 1.5, 0]}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[steam, 3]} />
        </bufferGeometry>
        <pointsMaterial size={0.05} color="#ffffff" transparent opacity={0.3} />
      </points>

      <pointLight position={[2, 3, 2]} intensity={15} color={PALETTE.secondary} />
    </group>
  );
}

function Bond({ to }: { to: THREE.Vector3Tuple }) {
  const { position, quaternion, length } = useMemo(() => {
    const start = new THREE.Vector3(0, 0, 0);
    const end = new THREE.Vector3(...to);
    const dir = end.clone().sub(start);
    const len = dir.length();
    const quat = new THREE.Quaternion().setFromUnitVectors(
      new THREE.Vector3(0, 1, 0),
      dir.clone().normalize(),
    );
    return { position: start.add(end).multiplyScalar(0.5), quaternion: quat, length: len };
  }, [to]);

  return (
    <mesh position={position} quaternion={quaternion}>
      <cylinderGeometry args={[0.09, 0.09, length, 12]} />
      <meshStandardMaterial color="#e2e8f0" metalness={0.3} roughness={0.35} />
    </mesh>
  );
}

function MoleculeScene() {
  const groupRef = useRef<THREE.Group>(null);
  useFrame((state) => {
    if (groupRef.current) groupRef.current.rotation.y = state.clock.elapsedTime * 0.25;
  });

  const atoms = useMemo(
    () =>
      [
        [1.6, 0.6, 0],
        [-1.6, 0.6, 0],
        [0, -1.2, 1.2],
        [0, -1.2, -1.2],
        [0.9, 1.7, -0.9],
        [-0.9, 1.7, 0.9],
      ] as THREE.Vector3Tuple[],
    [],
  );

  return (
    <group position={[0, 0, STATIONS.molecule]} ref={groupRef}>
      {atoms.map((pos, i) => (
        <Bond key={i} to={pos} />
      ))}
      <mesh>
        <sphereGeometry args={[0.75, 32, 32]} />
        <meshStandardMaterial
          color={PALETTE.primary}
          emissive={PALETTE.primary}
          emissiveIntensity={0.5}
          roughness={0.3}
        />
      </mesh>
      {atoms.map((pos, i) => (
        <mesh key={i} position={pos}>
          <sphereGeometry args={[0.38, 24, 24]} />
          <meshStandardMaterial
            color={PALETTE.accent}
            emissive={PALETTE.accent}
            emissiveIntensity={0.4}
            roughness={0.3}
          />
        </mesh>
      ))}
      <pointLight position={[0, 0, 4]} intensity={18} color="#ffffff" />
      <pointLight position={[-3, 2, -2]} intensity={10} color={PALETTE.secondary} />
    </group>
  );
}

function HorizonScene() {
  return (
    <group position={[0, 0, STATIONS.horizon]}>
      <pointLight position={[0, 2, -5]} intensity={25} color={PALETTE.secondary} />
      <mesh>
        <ringGeometry args={[3, 3.05, 64]} />
        <meshBasicMaterial color={PALETTE.secondary} transparent opacity={0.4} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

export default function Scene() {
  return (
    <Canvas
      dpr={[1, 1.5]}
      gl={{ antialias: true, powerPreference: "high-performance" }}
      camera={{ fov: 55, near: 0.1, far: 120, position: [0, 1.2, STATIONS.hero] }}
    >
      <color attach="background" args={[PALETTE.fog]} />
      <fogExp2 attach="fog" args={[PALETTE.fog, 0.045]} />
      <ambientLight intensity={0.35} />
      <CameraRig />
      <Starfield />
      <ClassroomScene />
      <LabScene />
      <MoleculeScene />
      <HorizonScene />
    </Canvas>
  );
}
