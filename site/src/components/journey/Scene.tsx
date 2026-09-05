"use client";

import { useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Environment } from "@react-three/drei";
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
  primary: "#c9a24b",
  secondary: "#7a2e3a",
  accent: "#d4af37",
  fog: "#0b0908",
};

/** Camera z/x/y is driven by scroll progress, not the clock, so it stays fine under
 * reduced-motion (it's user-controlled, not autoplaying). Only the free-running clock-driven
 * spins (starfield, flask, molecule) get frozen here — those are the actual autoplay motion. */
const prefersReducedMotion =
  typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

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
    const count = 500;
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
    if (ref.current && !prefersReducedMotion) ref.current.rotation.y += delta * 0.01;
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial size={0.05} color={PALETTE.primary} transparent opacity={0.35} />
    </points>
  );
}

/** A single dramatic volumetric-looking light shaft, like a spotlight cutting through dust —
 * the "NOIR ÉTERNEL" perfume-ad look. Pure additive-blended geometry, no post-processing needed. */
function LightBeam({
  position,
  rotation = [0, 0, 0],
  length = 14,
  radius = 2.2,
  color = PALETTE.accent,
  opacity = 0.16,
}: {
  position: THREE.Vector3Tuple;
  rotation?: [number, number, number];
  length?: number;
  radius?: number;
  color?: string;
  opacity?: number;
}) {
  return (
    <mesh position={position} rotation={rotation}>
      <coneGeometry args={[radius, length, 24, 1, true]} />
      <meshBasicMaterial
        color={color}
        transparent
        opacity={opacity}
        side={THREE.DoubleSide}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </mesh>
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
        <meshStandardMaterial color="#0f0c09" roughness={1} />
      </mesh>
      {/* Blackboard, glowing like a projected slide */}
      <mesh position={[0, 3.2, -6]} receiveShadow>
        <planeGeometry args={[10, 5]} />
        <meshStandardMaterial
          color="#1a140f"
          emissive={PALETTE.primary}
          emissiveIntensity={0.1}
          roughness={0.6}
        />
      </mesh>
      <mesh position={[0, 3.2, -5.94]}>
        <planeGeometry args={[7, 0.06]} />
        <meshStandardMaterial color={PALETTE.accent} emissive={PALETTE.accent} emissiveIntensity={1.2} />
      </mesh>
      {desks.map((d, i) => (
        <mesh key={i} position={[d.x, 0.4, d.z]} castShadow>
          <boxGeometry args={[1.4, 0.8, 0.9]} />
          <meshStandardMaterial
            color="#241c14"
            emissive={PALETTE.primary}
            emissiveIntensity={0.12}
            roughness={0.4}
          />
        </mesh>
      ))}
      <LightBeam position={[0, 9, 1]} rotation={[Math.PI, 0, 0]} length={11} radius={2.6} opacity={0.14} />
      <pointLight position={[0, 4, 2]} intensity={22} color={PALETTE.accent} />
      <pointLight position={[0, 3, -6]} intensity={14} color={PALETTE.secondary} />
      <spotLight position={[0, 8, 4]} intensity={20} angle={0.5} penumbra={0.7} color="#fff4dd" />
    </group>
  );
}

function LabScene() {
  const flaskRef = useRef<THREE.Mesh>(null);
  useFrame((state) => {
    if (flaskRef.current && !prefersReducedMotion) {
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
      {/* Podium the flask sits on, perfume-ad style */}
      <mesh position={[0, -0.55, 0]}>
        <cylinderGeometry args={[1.6, 1.8, 0.5, 48]} />
        <meshStandardMaterial color="#15100b" roughness={0.5} metalness={0.3} />
      </mesh>
      {/* Flask */}
      <mesh ref={flaskRef} position={[0, 0.6, 0]} castShadow>
        <sphereGeometry args={[1, 32, 32]} />
        <meshPhysicalMaterial
          color={PALETTE.secondary}
          transmission={0.85}
          roughness={0.08}
          thickness={0.6}
          ior={1.4}
        />
      </mesh>
      {/* Condenser */}
      <mesh position={[0, 2.6, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.18, 0.18, 2.4, 16]} />
        <meshPhysicalMaterial color="#e8d9b5" transmission={0.7} roughness={0.15} />
      </mesh>
      {/* Ring stand */}
      <mesh position={[0, 0.6, 0]}>
        <torusGeometry args={[1.3, 0.03, 8, 32]} />
        <meshStandardMaterial color={PALETTE.accent} metalness={0.7} roughness={0.25} />
      </mesh>

      <points position={[0, 1.5, 0]}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[steam, 3]} />
        </bufferGeometry>
        <pointsMaterial size={0.05} color="#f2ece2" transparent opacity={0.25} />
      </points>

      {/* Dramatic diagonal shaft, echoing the perfume-bottle reference */}
      <LightBeam position={[2.2, 5, -1]} rotation={[0, 0, 0.5]} length={9} radius={1.6} opacity={0.18} />
      <pointLight position={[0, 1.5, 2.5]} intensity={20} color={PALETTE.accent} />
      <pointLight position={[2, 3, 2]} intensity={10} color={PALETTE.secondary} />
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
      <meshStandardMaterial color="#3a2f26" metalness={0.4} roughness={0.3} />
    </mesh>
  );
}

function MoleculeScene() {
  const groupRef = useRef<THREE.Group>(null);
  useFrame((state) => {
    if (groupRef.current && !prefersReducedMotion) groupRef.current.rotation.y = state.clock.elapsedTime * 0.25;
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
    <group position={[0, 0, STATIONS.molecule]}>
      <LightBeam position={[0, 6, 0]} rotation={[Math.PI, 0, 0]} length={10} radius={2} opacity={0.2} />
      <group ref={groupRef}>
        {atoms.map((pos, i) => (
          <Bond key={i} to={pos} />
        ))}
        <mesh>
          <sphereGeometry args={[0.75, 32, 32]} />
          <meshStandardMaterial
            color={PALETTE.secondary}
            emissive={PALETTE.secondary}
            emissiveIntensity={0.5}
            roughness={0.25}
          />
        </mesh>
        {atoms.map((pos, i) => (
          <mesh key={i} position={pos}>
            <sphereGeometry args={[0.38, 24, 24]} />
            <meshStandardMaterial
              color={PALETTE.accent}
              emissive={PALETTE.accent}
              emissiveIntensity={0.45}
              roughness={0.25}
            />
          </mesh>
        ))}
      </group>
      <pointLight position={[0, 0, 4]} intensity={16} color="#fff4dd" />
      <pointLight position={[-3, 2, -2]} intensity={9} color={PALETTE.secondary} />
    </group>
  );
}

function HorizonScene() {
  return (
    <group position={[0, 0, STATIONS.horizon]}>
      <LightBeam position={[0, 5, -3]} rotation={[Math.PI, 0, 0]} length={12} radius={2.4} opacity={0.15} />
      <pointLight position={[0, 2, -5]} intensity={20} color={PALETTE.primary} />
      <mesh>
        <ringGeometry args={[3, 3.05, 64]} />
        <meshBasicMaterial color={PALETTE.accent} transparent opacity={0.45} side={THREE.DoubleSide} />
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
      <ambientLight intensity={0.25} />
      <Environment preset="studio" background={false} environmentIntensity={0.6} />
      <CameraRig />
      <Starfield />
      <ClassroomScene />
      <LabScene />
      <MoleculeScene />
      <HorizonScene />
    </Canvas>
  );
}
