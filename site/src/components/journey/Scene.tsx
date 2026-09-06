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

/** One desk + chair pair: tabletop on four legs, a seat and backrest behind it. */
function Desk({ position }: { position: THREE.Vector3Tuple }) {
  const woodMat = (
    <meshStandardMaterial color="#241c14" emissive={PALETTE.primary} emissiveIntensity={0.12} roughness={0.45} />
  );
  const legPositions: THREE.Vector3Tuple[] = [
    [-0.55, 0, -0.32],
    [0.55, 0, -0.32],
    [-0.55, 0, 0.32],
    [0.55, 0, 0.32],
  ];
  return (
    <group position={position}>
      {/* Tabletop */}
      <mesh position={[0, 0.75, 0]} castShadow>
        <boxGeometry args={[1.3, 0.06, 0.75]} />
        {woodMat}
      </mesh>
      {legPositions.map((lp, i) => (
        <mesh key={i} position={[lp[0], 0.37, lp[2]]}>
          <cylinderGeometry args={[0.03, 0.03, 0.74, 8]} />
          <meshStandardMaterial color="#15100b" metalness={0.5} roughness={0.4} />
        </mesh>
      ))}
      {/* Chair, offset behind the desk */}
      <mesh position={[0, 0.42, 0.62]} castShadow>
        <boxGeometry args={[0.55, 0.06, 0.5]} />
        {woodMat}
      </mesh>
      <mesh position={[0, 0.75, 0.85]} castShadow>
        <boxGeometry args={[0.55, 0.65, 0.06]} />
        {woodMat}
      </mesh>
      <mesh position={[-0.24, 0.2, 0.6]}>
        <cylinderGeometry args={[0.025, 0.025, 0.4, 6]} />
        <meshStandardMaterial color="#15100b" metalness={0.5} roughness={0.4} />
      </mesh>
      <mesh position={[0.24, 0.2, 0.6]}>
        <cylinderGeometry args={[0.025, 0.025, 0.4, 6]} />
        <meshStandardMaterial color="#15100b" metalness={0.5} roughness={0.4} />
      </mesh>
    </group>
  );
}

/** A tall window strip on the side wall, glowing like late-afternoon light through glass. */
function Window({ position }: { position: THREE.Vector3Tuple }) {
  return (
    <group position={position}>
      <mesh>
        <planeGeometry args={[1.4, 3.2]} />
        <meshStandardMaterial
          color={PALETTE.accent}
          emissive={PALETTE.accent}
          emissiveIntensity={0.6}
          transparent
          opacity={0.35}
        />
      </mesh>
      {[-0.46, 0, 0.46].map((x, i) => (
        <mesh key={i} position={[x, 0, 0.02]}>
          <boxGeometry args={[0.04, 3.2, 0.04]} />
          <meshStandardMaterial color="#0d0a07" />
        </mesh>
      ))}
      <pointLight position={[0.4, 0, 1.5]} intensity={6} color={PALETTE.accent} />
    </group>
  );
}

function ClassroomScene() {
  const desks = useMemo(
    () =>
      Array.from({ length: 6 }, (_, i) => ({
        x: (i % 2) * 2.6 - 1.3,
        z: Math.floor(i / 2) * 2.2 - 1.5,
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
      {/* Chalk molecule sketch on the board — a small nod to the subject matter */}
      <mesh position={[-2.6, 4, -5.93]}>
        <ringGeometry args={[0.28, 0.32, 24]} />
        <meshBasicMaterial color={PALETTE.accent} transparent opacity={0.5} />
      </mesh>
      <mesh position={[-1.9, 3.7, -5.93]}>
        <ringGeometry args={[0.18, 0.21, 24]} />
        <meshBasicMaterial color={PALETTE.accent} transparent opacity={0.4} />
      </mesh>

      {/* Teacher's desk, larger, facing the class */}
      <group position={[0, 0, -4]}>
        <mesh position={[0, 0.5, 0]} castShadow>
          <boxGeometry args={[2.2, 0.08, 0.9]} />
          <meshStandardMaterial color="#1c150f" emissive={PALETTE.primary} emissiveIntensity={0.1} roughness={0.4} />
        </mesh>
        <mesh position={[-0.95, 0.25, 0]}>
          <boxGeometry args={[0.08, 0.5, 0.85]} />
          <meshStandardMaterial color="#120d09" />
        </mesh>
        <mesh position={[0.95, 0.25, 0]}>
          <boxGeometry args={[0.08, 0.5, 0.85]} />
          <meshStandardMaterial color="#120d09" />
        </mesh>
      </group>

      {desks.map((d, i) => (
        <Desk key={i} position={[d.x, 0, d.z]} />
      ))}

      {/* Windows down the left wall */}
      <Window position={[-6.9, 2.8, -3]} />
      <Window position={[-6.9, 2.8, 0]} />

      <LightBeam position={[0, 9, 1]} rotation={[Math.PI, 0, 0]} length={11} radius={2.6} opacity={0.14} />
      <pointLight position={[0, 4, 2]} intensity={22} color={PALETTE.accent} />
      <pointLight position={[0, 3, -6]} intensity={14} color={PALETTE.secondary} />
      <spotLight position={[0, 8, 4]} intensity={20} angle={0.5} penumbra={0.7} color="#fff4dd" />
    </group>
  );
}

/** Procedural bloom: two rings of curved petal shapes around a beaded stamen center.
 * Stands in for a literal flower model — the raw material that goes into the flask. */
function Flower({ position = [0, 0, 0] as THREE.Vector3Tuple, scale = 1 }) {
  const groupRef = useRef<THREE.Group>(null);
  useFrame((state) => {
    if (groupRef.current && !prefersReducedMotion) {
      groupRef.current.rotation.y = state.clock.elapsedTime * 0.15;
    }
  });

  const petalGeometry = useMemo(() => {
    const shape = new THREE.Shape();
    shape.moveTo(0, 0);
    shape.bezierCurveTo(0.32, 0.25, 0.42, 0.9, 0, 1.3);
    shape.bezierCurveTo(-0.42, 0.9, -0.32, 0.25, 0, 0);
    return new THREE.ShapeGeometry(shape, 12);
  }, []);

  const rings = useMemo(
    () => [
      { count: 6, radiusTilt: 1.15, y: 0.05, scale: 1, color: PALETTE.secondary },
      { count: 5, radiusTilt: 0.65, y: 0.18, scale: 0.65, color: "#9c4a56" },
    ],
    [],
  );

  const stamens = useMemo(
    () =>
      Array.from({ length: 14 }, (_, i) => {
        const a = (i / 14) * Math.PI * 2;
        const r = 0.08 + Math.random() * 0.1;
        return [Math.cos(a) * r, 0.28 + Math.random() * 0.08, Math.sin(a) * r] as THREE.Vector3Tuple;
      }),
    [],
  );

  return (
    <group ref={groupRef} position={position} scale={scale}>
      {rings.map((ring, ringIdx) =>
        Array.from({ length: ring.count }, (_, i) => {
          const angle = (i / ring.count) * Math.PI * 2 + (ringIdx * Math.PI) / ring.count;
          return (
            <mesh
              key={`${ringIdx}-${i}`}
              geometry={petalGeometry}
              position={[0, ring.y, 0]}
              rotation={[ring.radiusTilt, angle, 0]}
              scale={ring.scale}
            >
              <meshPhysicalMaterial
                color={ring.color}
                side={THREE.DoubleSide}
                roughness={0.35}
                transmission={0.25}
                thickness={0.3}
                emissive={ring.color}
                emissiveIntensity={0.08}
              />
            </mesh>
          );
        }),
      )}
      <mesh position={[0, 0.24, 0]}>
        <sphereGeometry args={[0.14, 16, 16]} />
        <meshStandardMaterial color={PALETTE.accent} emissive={PALETTE.accent} emissiveIntensity={0.3} roughness={0.4} />
      </mesh>
      {stamens.map((pos, i) => (
        <mesh key={i} position={pos}>
          <sphereGeometry args={[0.035, 8, 8]} />
          <meshStandardMaterial color={PALETTE.primary} emissive={PALETTE.primary} emissiveIntensity={0.5} />
        </mesh>
      ))}
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

      {/* Raw material floating beside the flask — kept on the right, clear of the left-aligned text card */}
      <Flower position={[2.6, 1.2, 1.4]} scale={0.85} />

      {/* Dramatic diagonal shaft, echoing the perfume-bottle reference */}
      <LightBeam position={[2.2, 5, -1]} rotation={[0, 0, 0.5]} length={9} radius={1.6} opacity={0.18} />
      <pointLight position={[0, 1.5, 2.5]} intensity={20} color={PALETTE.accent} />
      <pointLight position={[2, 3, 2]} intensity={10} color={PALETTE.secondary} />
      <pointLight position={[2.6, 2, 1.4]} intensity={10} color={PALETTE.primary} />
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
  const groupRef = useRef<THREE.Group>(null);
  useFrame((state) => {
    if (groupRef.current && !prefersReducedMotion) {
      groupRef.current.rotation.z = state.clock.elapsedTime * 0.03;
    }
  });

  const motes = useMemo(() => {
    const count = 90;
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const a = Math.random() * Math.PI * 2;
      const r = 1.5 + Math.random() * 5;
      arr[i * 3] = Math.cos(a) * r;
      arr[i * 3 + 1] = (Math.random() - 0.5) * 4;
      arr[i * 3 + 2] = Math.sin(a) * r;
    }
    return arr;
  }, []);

  const rings = [
    { radius: 2.2, opacity: 0.55 },
    { radius: 3, opacity: 0.4 },
    { radius: 3.9, opacity: 0.22 },
  ];

  return (
    <group position={[0, 0, STATIONS.horizon]}>
      <LightBeam position={[0, 5, -3]} rotation={[Math.PI, 0, 0]} length={12} radius={2.4} opacity={0.15} />
      <pointLight position={[0, 2, -5]} intensity={20} color={PALETTE.primary} />
      <pointLight position={[0, 0, 2]} intensity={10} color={PALETTE.accent} />

      {/* Soft glowing core — the open, unfinished center of the story */}
      <mesh>
        <sphereGeometry args={[0.5, 32, 32]} />
        <meshStandardMaterial
          color={PALETTE.accent}
          emissive={PALETTE.accent}
          emissiveIntensity={0.6}
          roughness={0.3}
        />
      </mesh>

      <group ref={groupRef}>
        {rings.map((ring, i) => (
          <mesh key={i} rotation={[0, 0, (i * Math.PI) / 6]}>
            <ringGeometry args={[ring.radius, ring.radius + 0.03, 64]} />
            <meshBasicMaterial color={PALETTE.accent} transparent opacity={ring.opacity} side={THREE.DoubleSide} />
          </mesh>
        ))}
      </group>

      <points>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[motes, 3]} />
        </bufferGeometry>
        <pointsMaterial size={0.07} color={PALETTE.primary} transparent opacity={0.6} />
      </points>
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
