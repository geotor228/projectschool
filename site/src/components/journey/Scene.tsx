"use client";

import { useEffect, useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Environment, ContactShadows, Text, MeshReflectorMaterial, RoundedBox } from "@react-three/drei";
import { EffectComposer, Bloom, Vignette, ToneMapping } from "@react-three/postprocessing";
import { ToneMappingMode } from "postprocessing";
import * as THREE from "three";
import { journeyState } from "@/lib/journeyState";
import {
  createWoodTexture,
  createSlateTexture,
  createPlasterTexture,
  createAcousticTileTexture,
  createDataScreenTexture,
  createGlowSpriteTexture,
  createPastelGradientTexture,
} from "@/lib/proceduralTextures";

const STATIONS = {
  hero: 6,
  classroom: -14,
  lab: -34,
  molecule: -54,
  horizon: -76,
};

/** Deterministic 0-1 pseudo-random value from two integers — a pure stand-in for Math.random()
 * inside useMemo, where calling an impure function during render trips react-hooks/purity. */
function seededJitter(a: number, b: number): number {
  const s = Math.sin(a * 12.9898 + b * 78.233) * 43758.5453;
  return s - Math.floor(s);
}

const PALETTE = {
  primary: "#c9a24b",
  secondary: "#7a2e3a",
  accent: "#d4af37",
  fog: "#0b0908",
  // Biophilic accents — this is a biotech/botany project, not a pure jewelry-ad noir piece, so
  // the gold/wine palette gets a living green counterpoint via plants and warmer wall tones.
  leafDeep: "#3c6238",
  leafBright: "#6f9c4f",
  terracotta: "#8a4a34",
  // Bright biophilic classroom repaint, matched directly to the reference photo: daylight, sage
  // walls, warm oak — a deliberate departure from the noir gold/wine mood used in the other
  // scenes. Those scenes keep their own dramatic lighting; this one reads like a real, lived-in,
  // sunlit eco-classroom.
  sageWall: "#aab89a",
  sageWallDark: "#8b9a7c",
  sageWallLight: "#c7d0b6",
  oak: "#cdb188",
  oakDark: "#a9885d",
  oakLight: "#e3cda3",
  oliveChair: "#66754a",
  chalkGreen: "#3c4a3c",
  // Soft pastel palette for the closing "scent captured in a bottle" scene — warm peach and cool
  // lavender smoke, cream light, a world away from the noir gold/wine used everywhere else.
  pastelPeach: "#f3c79b",
  pastelLavender: "#c6b7ea",
  pastelPink: "#f0c7d3",
  pastelCream: "#faf1e3",
};

/** Camera z/x/y is driven by scroll progress, not the clock, so it stays fine under
 * reduced-motion (it's user-controlled, not autoplaying). Only the free-running clock-driven
 * spins (starfield, flask, molecule) get frozen here — those are the actual autoplay motion. */
const prefersReducedMotion =
  typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/** Each scene's own lights cluster tightly around its set dressing, so the stretch of travel
 * between two stations — where neither scene's lights reach — was falling to near-black fog for
 * a good second of scroll (worst around classroom→lab, since the classroom's lights sit up near
 * the blackboard, not out toward the back wall). A soft light that always travels with the camera
 * fixes every transition at once instead of patching each corridor individually. */
function TravelLight() {
  const ref = useRef<THREE.PointLight>(null);
  useFrame((state) => {
    if (ref.current) ref.current.position.set(state.camera.position.x, state.camera.position.y + 1, state.camera.position.z - 3);
  });
  return <pointLight ref={ref} intensity={5} distance={14} decay={2} color={PALETTE.primary} />;
}

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

    // Look-ahead was 12 units, which meant that during the empty stretch between two stations'
    // set dressing, the camera was aimed at a point even further into that empty stretch than
    // its own position — so no amount of light near the camera helped, the frame was centered on
    // genuinely empty space. A shorter look-ahead keeps the aim point closer to what's actually
    // built out around the camera at any given moment.
    target.set(sway * 0.5, 1, z - 5);
    state.camera.lookAt(target);
  });
  return null;
}

/** Stations sit only 20-22 units apart with nothing occluding between them, so without this a
 * strongly-lit neighboring scene (e.g. the lab's podium light) shows through the fog at the edge
 * of frame while you're still in the previous scene. Hide each scene once the camera is well past
 * it. Radius is deliberately bigger than half the station spacing (~10-11) so neighboring scenes
 * overlap for a good stretch instead of both being near the edge of their fade at the same time —
 * that edge-of-both-ranges gap is what read as the screen going black for a second on transitions. */
function useStationVisibility(ref: React.RefObject<THREE.Group | null>, stationZ: number, radius = 13.5) {
  useFrame(() => {
    if (!ref.current) return;
    const cameraZ = THREE.MathUtils.lerp(STATIONS.hero, STATIONS.horizon, journeyState.progress);
    ref.current.visible = Math.abs(cameraZ - stationZ) < radius;
  });
}

/** Drifting motes along the whole travel corridor, in two tones (gold + leaf green) rather than
 * one flat color — this is what keeps the space *between* stations from reading as empty black
 * dead air during scroll transitions, and doubles as the "living, botanical" texture the piece
 * wants throughout, not just inside each set. */
function Starfield() {
  const { positions, colors } = useMemo(() => {
    const count = 900;
    const posArr = new Float32Array(count * 3);
    const colorArr = new Float32Array(count * 3);
    const gold = new THREE.Color(PALETTE.primary);
    const leaf = new THREE.Color(PALETTE.leafBright);
    for (let i = 0; i < count; i++) {
      posArr[i * 3] = (Math.random() - 0.5) * 60;
      posArr[i * 3 + 1] = (Math.random() - 0.5) * 40;
      posArr[i * 3 + 2] = Math.random() * -100 + 10;
      const c = Math.random() > 0.62 ? leaf : gold;
      colorArr[i * 3] = c.r;
      colorArr[i * 3 + 1] = c.g;
      colorArr[i * 3 + 2] = c.b;
    }
    return { positions: posArr, colors: colorArr };
  }, []);

  const ref = useRef<THREE.Points>(null);
  useFrame((_, delta) => {
    if (ref.current && !prefersReducedMotion) ref.current.rotation.y += delta * 0.01;
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-color" args={[colors, 3]} />
      </bufferGeometry>
      <pointsMaterial size={0.06} vertexColors transparent opacity={0.5} sizeAttenuation />
    </points>
  );
}

/** A small cluster of glowing spore/pollen particles with a soft light of their own, sitting at
 * the midpoint between two stations. Each set's own lighting is tightly clustered around its
 * furniture, so the travel corridor between sets was falling to near-black fog no matter how the
 * camera happened to be aimed at that moment — this gives every corridor a guaranteed lit anchor,
 * and reads as living spores drifting in the dark rather than a bare technical fix. */
function TransitGlow({ z, color = PALETTE.leafBright }: { z: number; color?: string }) {
  const positions = useMemo(() => {
    const count = 26;
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const a = seededJitter(i, 300) * Math.PI * 2;
      const r = 0.3 + seededJitter(i, 301) * 1.3;
      arr[i * 3] = Math.cos(a) * r;
      arr[i * 3 + 1] = (seededJitter(i, 302) - 0.5) * 2.2;
      arr[i * 3 + 2] = Math.sin(a) * r * 0.6;
    }
    return arr;
  }, []);

  // Offset off the camera's own path (it sways at most ±0.6) rather than sitting on the
  // centerline — a small prop directly in the flight line reads as a huge blown-out orb the
  // instant the camera passes close to it, the same trap the teacher's desk fell into earlier.
  return (
    <group position={[3.4, 1.2, z]}>
      <pointLight intensity={4} distance={11} decay={2} color={color} />
      <mesh>
        <sphereGeometry args={[0.14, 16, 16]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.5} roughness={0.4} />
      </mesh>
      <points>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        </bufferGeometry>
        <pointsMaterial size={0.045} color={color} transparent opacity={0.65} sizeAttenuation />
      </points>
    </group>
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

/** One desk + chair pair: tabletop on four legs, a seat and backrest behind it.
 * Materials are shared instances passed in from ClassroomScene (see the ui-ux-pro-max
 * threejs guideline on sharing materials instead of allocating one per mesh). */
function Desk({
  position,
  rotationY = 0,
  woodMat,
  metalMat,
  chairMat,
}: {
  position: THREE.Vector3Tuple;
  rotationY?: number;
  woodMat: THREE.Material;
  metalMat: THREE.Material;
  chairMat: THREE.Material;
}) {
  const legPositions: THREE.Vector3Tuple[] = [
    [-0.55, 0, -0.32],
    [0.55, 0, -0.32],
    [-0.55, 0, 0.32],
    [0.55, 0, 0.32],
  ];
  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      {/* Tabletop — a real eased edge instead of a razor-sharp CG box corner */}
      <RoundedBox args={[1.3, 0.06, 0.75]} radius={0.015} smoothness={2} position={[0, 0.75, 0]} material={woodMat} castShadow receiveShadow />
      {legPositions.map((lp, i) => (
        <mesh key={i} position={[lp[0], 0.37, lp[2]]} material={metalMat}>
          <cylinderGeometry args={[0.03, 0.03, 0.74, 8]} />
        </mesh>
      ))}
      {/* Chair, offset behind the desk — its own olive plastic-shell material, not the desk's wood */}
      <RoundedBox args={[0.55, 0.06, 0.5]} radius={0.02} smoothness={2} position={[0, 0.42, 0.62]} material={chairMat} castShadow />
      <RoundedBox args={[0.55, 0.65, 0.06]} radius={0.03} smoothness={2} position={[0, 0.75, 0.85]} material={chairMat} castShadow />
      <mesh position={[-0.24, 0.2, 0.6]} material={metalMat}>
        <cylinderGeometry args={[0.025, 0.025, 0.4, 6]} />
      </mesh>
      <mesh position={[0.24, 0.2, 0.6]} material={metalMat}>
        <cylinderGeometry args={[0.025, 0.025, 0.4, 6]} />
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
        <meshStandardMaterial color="#f4ecd8" emissive="#f4ecd8" emissiveIntensity={0.8} transparent opacity={0.55} />
      </mesh>
      {[-0.46, 0, 0.46].map((x, i) => (
        <mesh key={i} position={[x, 0, 0.02]}>
          <boxGeometry args={[0.04, 3.2, 0.04]} />
          <meshStandardMaterial color="#3a3a36" />
        </mesh>
      ))}
      <pointLight position={[0.4, 0, 1.5]} intensity={5} color="#fff3dc" />
    </group>
  );
}

/** A round wall clock — one small, instantly-readable "this is a real room" detail. */
function WallClock({ position, rotationY = 0 }: { position: THREE.Vector3Tuple; rotationY?: number }) {
  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      <mesh>
        <circleGeometry args={[0.34, 32]} />
        <meshStandardMaterial color="#f7f3e8" roughness={0.5} />
      </mesh>
      <mesh position={[0, 0, -0.002]}>
        <ringGeometry args={[0.34, 0.37, 32]} />
        <meshStandardMaterial color="#2a2b26" roughness={0.5} />
      </mesh>
      <group rotation={[0, 0, -0.5]}>
        <mesh position={[0, 0.09, 0.002]}>
          <planeGeometry args={[0.022, 0.18]} />
          <meshBasicMaterial color="#2a2b26" />
        </mesh>
      </group>
      <group rotation={[0, 0, 2.1]}>
        <mesh position={[0, 0.13, 0.002]}>
          <planeGeometry args={[0.016, 0.26]} />
          <meshBasicMaterial color="#2a2b26" />
        </mesh>
      </group>
      <mesh position={[0, 0, 0.003]}>
        <circleGeometry args={[0.02, 12]} />
        <meshBasicMaterial color="#2a2b26" />
      </mesh>
    </group>
  );
}

/** A botanical poster: procedurally painted (cream ground + a leaf silhouette + an accent rule),
 * with real drei/troika text for the label — echoes the reference photo's "PLANTES AROMÀTIQUES"
 * wall print instead of a bare wall. */
function Poster({
  position,
  rotationY = 0,
  label,
}: {
  position: THREE.Vector3Tuple;
  rotationY?: number;
  label: string;
}) {
  const texture = useMemo(() => {
    const size = 512;
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = Math.round(size * 1.3);
    const ctx = canvas.getContext("2d")!;
    ctx.fillStyle = "#f4efe2";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#8b9a7c";
    ctx.fillRect(0, canvas.height * 0.62, canvas.width, canvas.height * 0.38);
    // A simple stylized leaf/stem sketch.
    ctx.strokeStyle = "#3c6238";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(canvas.width / 2, canvas.height * 0.15);
    ctx.lineTo(canvas.width / 2, canvas.height * 0.58);
    ctx.stroke();
    ctx.fillStyle = "#4f7c47";
    for (const t of [0.22, 0.32, 0.42, 0.5]) {
      const y = canvas.height * (0.15 + t);
      const dir = t % 0.2 < 0.1 ? 1 : -1;
      ctx.beginPath();
      ctx.moveTo(canvas.width / 2, y);
      ctx.quadraticCurveTo(canvas.width / 2 + dir * 90, y - 30, canvas.width / 2 + dir * 130, y + 10);
      ctx.quadraticCurveTo(canvas.width / 2 + dir * 90, y + 35, canvas.width / 2, y + 20);
      ctx.fill();
    }
    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }, []);

  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      <mesh castShadow receiveShadow>
        <planeGeometry args={[1, 1.3]} />
        <meshStandardMaterial map={texture} roughness={0.8} />
      </mesh>
      <Text
        position={[0, -0.35, 0.01]}
        fontSize={0.075}
        color="#2f2a20"
        anchorX="center"
        anchorY="middle"
        maxWidth={0.85}
        textAlign="center"
        letterSpacing={0.03}
      >
        {label}
      </Text>
    </group>
  );
}

/** A potted plant: terracotta pot + a fan of long leaf blades, reusing the same curved-teardrop
 * shape and fan-rotation trick as the Flower's petals. The main "more life, more green" device
 * for the classroom's biophilic-biotech feel, not just the gold/wine noir palette. */
function PottedPlant({ position, scale = 1 }: { position: THREE.Vector3Tuple; scale?: number }) {
  const leafGeometry = useMemo(() => {
    const shape = new THREE.Shape();
    shape.moveTo(0, 0);
    shape.bezierCurveTo(0.16, 0.2, 0.2, 0.68, 0, 1.05);
    shape.bezierCurveTo(-0.2, 0.68, -0.16, 0.2, 0, 0);
    return new THREE.ShapeGeometry(shape, 10);
  }, []);

  const leaves = useMemo(
    () =>
      Array.from({ length: 9 }, (_, i) => ({
        angle: (i / 9) * Math.PI * 2 + seededJitter(i, 200) * 0.6,
        tilt: 0.5 + seededJitter(i, 201) * 0.45,
        s: 0.7 + seededJitter(i, 202) * 0.45,
        color: seededJitter(i, 203) > 0.45 ? PALETTE.leafDeep : PALETTE.leafBright,
      })),
    [],
  );

  return (
    <group position={position} scale={scale}>
      <mesh position={[0, 0.22, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.24, 0.19, 0.44, 16]} />
        <meshStandardMaterial color={PALETTE.terracotta} roughness={0.85} />
      </mesh>
      <mesh position={[0, 0.445, 0]}>
        <cylinderGeometry args={[0.25, 0.25, 0.05, 16]} />
        <meshStandardMaterial color="#5c3122" roughness={0.9} />
      </mesh>
      <mesh position={[0, 0.47, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.22, 16]} />
        <meshStandardMaterial color="#1c140d" roughness={1} />
      </mesh>
      {leaves.map((leaf, i) => (
        <mesh
          key={i}
          geometry={leafGeometry}
          position={[0, 0.46, 0]}
          rotation={[leaf.tilt, leaf.angle, 0]}
          scale={leaf.s}
          castShadow
        >
          <meshStandardMaterial
            color={leaf.color}
            side={THREE.DoubleSide}
            roughness={0.45}
            emissive={leaf.color}
            emissiveIntensity={0.07}
          />
        </mesh>
      ))}
    </group>
  );
}

function ClassroomScene() {
  const groupRef = useRef<THREE.Group>(null);
  useStationVisibility(groupRef, STATIONS.classroom);

  // Shared material + texture instances (created once, reused across every desk/chair mesh)
  // rather than one meshStandardMaterial per box, per the threejs "share material instances" guideline.
  // Bright warm-oak-and-sage repaint, matched to the reference photo — a deliberate departure from
  // the dark noir palette used in the rest of the journey.
  const materials = useMemo(() => {
    const deskWood = createWoodTexture({
      base: PALETTE.oak,
      dark: PALETTE.oakDark,
      light: PALETTE.oakLight,
      size: 512,
      repeat: [1, 1],
      seed: 3,
    });
    const floorWood = createWoodTexture({
      base: PALETTE.oak,
      dark: PALETTE.oakDark,
      light: PALETTE.oakLight,
      size: 512,
      repeat: [5, 4],
      plankLines: true,
      seed: 11,
    });
    const woodMat = new THREE.MeshStandardMaterial({
      map: deskWood.map,
      roughnessMap: deskWood.roughnessMap,
      normalMap: deskWood.normalMap,
      normalScale: new THREE.Vector2(0.6, 0.6),
      roughness: 0.5,
      envMapIntensity: 0.2,
    });
    const metalMat = new THREE.MeshStandardMaterial({
      color: "#2a2b26",
      metalness: 0.6,
      roughness: 0.5,
      envMapIntensity: 0.4,
    });
    const chairMat = new THREE.MeshStandardMaterial({
      color: PALETTE.oliveChair,
      roughness: 0.45,
      envMapIntensity: 0.25,
    });
    const floorMat = new THREE.MeshStandardMaterial({
      map: floorWood.map,
      roughnessMap: floorWood.roughnessMap,
      normalMap: floorWood.normalMap,
      normalScale: new THREE.Vector2(0.5, 0.5),
      roughness: 0.55,
      envMapIntensity: 0.18,
    });
    const slateMat = new THREE.MeshStandardMaterial({ map: createSlateTexture(512), roughness: 0.7 });
    // Walls: soft sage plaster, bright enough to read as a real sunlit room instead of a void.
    const wallPlaster = createPlasterTexture({
      base: PALETTE.sageWall,
      dark: PALETTE.sageWallDark,
      light: PALETTE.sageWallLight,
      size: 512,
      repeat: [3, 2],
      seed: 21,
    });
    const wallMat = new THREE.MeshStandardMaterial({
      map: wallPlaster.map,
      roughnessMap: wallPlaster.roughnessMap,
      normalMap: wallPlaster.normalMap,
      normalScale: new THREE.Vector2(0.35, 0.35),
      roughness: 0.92,
      envMapIntensity: 0.1,
    });
    const ceilingMat = new THREE.MeshStandardMaterial({ color: "#e9e5d8", roughness: 0.95 });
    const trimMat = new THREE.MeshStandardMaterial({ color: "#4a3a26", roughness: 0.55 });
    return { woodMat, metalMat, chairMat, floorMat, slateMat, wallMat, ceilingMat, trimMat };
  }, []);

  // Slight per-desk position/rotation jitter so the row reads as real furniture, not a grid of
  // clones. Deterministic hash instead of Math.random() — keeps this useMemo a pure function.
  const desks = useMemo(
    () =>
      Array.from({ length: 6 }, (_, i) => ({
        x: (i % 2) * 2.6 - 1.3 + (seededJitter(i, 1) - 0.5) * 0.12,
        z: Math.floor(i / 2) * 2.2 - 1.5 + (seededJitter(i, 2) - 0.5) * 0.12,
        rotationY: (seededJitter(i, 3) - 0.5) * 0.08,
      })),
    [],
  );

  const sunRef = useRef<THREE.SpotLight>(null);
  const sunTargetRef = useRef<THREE.Object3D>(null);
  useEffect(() => {
    if (sunRef.current && sunTargetRef.current) sunRef.current.target = sunTargetRef.current;
  }, []);

  return (
    <group ref={groupRef} position={[0, -1.5, STATIONS.classroom]}>
      {/* Floor */}
      <mesh position={[0, -0.02, -2]} rotation={[-Math.PI / 2, 0, 0]} material={materials.floorMat} receiveShadow>
        <planeGeometry args={[14, 12]} />
      </mesh>

      {/* Room shell: side walls + ceiling only — never a front/back wall, since the camera flies
       * straight through the whole journey along z and would clip through anything perpendicular
       * to its path. Side walls run parallel to that path, so there's no collision risk, and they're
       * what actually fixes "everything past the furniture is just black": there was no room here
       * before, just floating objects in the fog. */}
      <mesh position={[-7, 4, -2]} rotation={[0, Math.PI / 2, 0]} material={materials.wallMat} receiveShadow>
        <planeGeometry args={[30, 8]} />
      </mesh>
      <mesh position={[7, 4, -2]} rotation={[0, -Math.PI / 2, 0]} material={materials.wallMat} receiveShadow>
        <planeGeometry args={[30, 8]} />
      </mesh>
      <mesh position={[0, 8, -2]} rotation={[Math.PI / 2, 0, 0]} material={materials.ceilingMat} receiveShadow>
        <planeGeometry args={[14, 30]} />
      </mesh>

      {/* Baseboard trim along both walls — a small thing, but a wall that just ends flush into
       * the floor with no transition is one of the fastest tells of a CG room. */}
      <mesh position={[-6.97, 0.07, -2]} material={materials.trimMat}>
        <boxGeometry args={[0.04, 0.14, 30]} />
      </mesh>
      <mesh position={[6.97, 0.07, -2]} material={materials.trimMat}>
        <boxGeometry args={[0.04, 0.14, 30]} />
      </mesh>

      {/* Light switch + outlet — mundane wall hardware nobody designs on purpose but every real
       * room has, and its absence is part of why a bare wall reads as a stage set. */}
      <group position={[6.97, 1.15, 2]} rotation={[0, Math.PI / 2, 0]}>
        <mesh>
          <boxGeometry args={[0.09, 0.14, 0.012]} />
          <meshStandardMaterial color="#f2efe6" roughness={0.5} />
        </mesh>
        <mesh position={[0, 0, 0.009]}>
          <boxGeometry args={[0.025, 0.05, 0.01]} />
          <meshStandardMaterial color="#dedacc" roughness={0.4} />
        </mesh>
      </group>
      <group position={[6.97, 0.28, 2.6]} rotation={[0, Math.PI / 2, 0]}>
        <mesh>
          <boxGeometry args={[0.1, 0.1, 0.012]} />
          <meshStandardMaterial color="#f2efe6" roughness={0.5} />
        </mesh>
        <mesh position={[-0.02, 0, 0.009]}>
          <boxGeometry args={[0.012, 0.03, 0.01]} />
          <meshStandardMaterial color="#2a2a26" />
        </mesh>
        <mesh position={[0.02, 0, 0.009]}>
          <boxGeometry args={[0.012, 0.03, 0.01]} />
          <meshStandardMaterial color="#2a2a26" />
        </mesh>
      </group>

      {/* Ceiling fixtures: a long linear pendant light and a small projector, both mundane real-room
       * details that do a lot of work to sell "this is a real classroom, not a stage set." */}
      <PendantLight position={[0, 7.4, -2]} width={5} dropFrom={0.55} />
      <group position={[0, 7.85, -0.5]}>
        <mesh castShadow>
          <boxGeometry args={[0.4, 0.22, 0.28]} />
          <meshStandardMaterial color="#e8e5da" roughness={0.6} />
        </mesh>
        <mesh position={[0, -0.14, 0.08]}>
          <cylinderGeometry args={[0.06, 0.08, 0.08, 16]} />
          <meshStandardMaterial color="#2a2b26" roughness={0.4} />
        </mesh>
      </group>

      {/* Potted plants — the biophilic counterweight to the noir gold/wine palette used elsewhere:
       * real green, real life, not just another metal-and-varnish surface. */}
      <PottedPlant position={[-6.35, 0, -3.35]} scale={1.05} />
      <PottedPlant position={[-6.35, 0, -0.35]} scale={0.95} />
      <PottedPlant position={[6.1, 0, -6.2]} scale={1.3} />

      {/* Wall décor: a clock and two botanical posters, echoing the reference photo's wall-dressing */}
      <WallClock position={[-1.6, 4.6, -5.95]} />
      <Poster position={[-4.4, 3.1, -5.95]} label={"PLANTES\nAROMÀTIQUES"} />
      <Poster position={[4.3, 3.1, -5.95]} label={"NATURA · CIÈNCIA\nFUTUR"} />

      {/* Blackboard, real chalk-slate texture instead of a flat fill */}
      <mesh position={[0, 3.2, -6]} material={materials.slateMat} receiveShadow>
        <planeGeometry args={[10, 5]} />
      </mesh>
      <mesh position={[0, 3.2, -5.94]}>
        <planeGeometry args={[7, 0.06]} />
        <meshStandardMaterial color={PALETTE.accent} emissive={PALETTE.accent} emissiveIntensity={1.2} />
      </mesh>
      {/* Chalk molecule sketch + formula — legible chalk text instead of an abstract ring pair */}
      <mesh position={[-2.4, 4, -5.93]} rotation={[0, 0, 0.2]}>
        <ringGeometry args={[0.42, 0.46, 6]} />
        <meshBasicMaterial color="#eef1e8" transparent opacity={0.55} side={THREE.DoubleSide} />
      </mesh>
      <Text position={[-1, 4, -5.93]} fontSize={0.32} color="#eef1e8" anchorX="left" anchorY="middle">
        {"β-Pineno"}
      </Text>
      <Text position={[-1, 3.5, -5.93]} fontSize={0.24} color="#c9d0bf" anchorX="left" anchorY="middle">
        {"C10H16"}
      </Text>

      {/* Teacher's desk, larger, facing the class — pushed back near the board so the camera's
       * flight path (which runs straight down the center aisle) never grazes it at close range. */}
      <group position={[0, 0, -5.5]}>
        <RoundedBox args={[2.2, 0.08, 0.9]} radius={0.018} smoothness={2} position={[0, 0.5, 0]} material={materials.woodMat} castShadow receiveShadow />
        <mesh position={[-0.95, 0.25, 0]} material={materials.metalMat}>
          <boxGeometry args={[0.08, 0.5, 0.85]} />
        </mesh>
        <mesh position={[0.95, 0.25, 0]} material={materials.metalMat}>
          <boxGeometry args={[0.08, 0.5, 0.85]} />
        </mesh>
      </group>

      {desks.map((d, i) => (
        <Desk
          key={i}
          position={[d.x, 0, d.z]}
          rotationY={d.rotationY}
          woodMat={materials.woodMat}
          metalMat={materials.metalMat}
          chairMat={materials.chairMat}
        />
      ))}

      {/* Windows down the left wall */}
      <Window position={[-6.9, 2.8, -3]} />
      <Window position={[-6.9, 2.8, 0]} />

      {/* Soft grounding contact shadow under the furniture — cheap, reads as ambient occlusion */}
      <ContactShadows position={[0, 0.001, -2]} opacity={0.4} scale={14} blur={2.4} far={3.5} color="#000000" />

      {/* Soft, even daylight fill bounced around the room — the reference photo has no visible
       * dramatic beam, just a bright, evenly-lit room, so the fill light matters more than any
       * single "hero" light source here. */}
      <hemisphereLight args={["#eef2e6", PALETTE.oakDark, 0.7]} />

      {/* Invisible aim point for the window light — keeps the target in the same local space as the group. */}
      <object3D ref={sunTargetRef} position={[1, 0.6, -2]} />
      {/* Daylight through the windows: wide and soft rather than a narrow dramatic shaft, so it
       * reads as "sunlit room" instead of "single spotlight in the dark." */}
      <spotLight
        ref={sunRef}
        position={[-6.2, 4.6, -1.4]}
        intensity={26}
        distance={16}
        angle={0.85}
        penumbra={0.85}
        decay={1.6}
        color="#fff6e2"
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-bias={-0.0004}
        shadow-radius={5}
      />

      <pointLight position={[0, 4, 2]} intensity={5} color="#fff4de" />
      <pointLight position={[0, 3, -5]} intensity={4} color="#fff4de" />
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

/** A long linear pendant fixture hanging over a bench — reused between the classroom and the lab. */
/** A slim linear pendant: black housing hung on two thin cables, glowing warmly from its
 * underside — the housing + cables are what make it read as a suspended fixture rather than a
 * bare glowing bar floating in the air. */
function PendantLight({ position, width = 5, dropFrom = 1.1 }: { position: THREE.Vector3Tuple; width?: number; dropFrom?: number }) {
  return (
    <group position={position}>
      <mesh castShadow>
        <boxGeometry args={[width, 0.14, 0.22]} />
        <meshStandardMaterial color="#161616" roughness={0.4} metalness={0.3} />
      </mesh>
      <mesh position={[0, -0.09, 0]}>
        <boxGeometry args={[width * 0.94, 0.03, 0.14]} />
        <meshStandardMaterial color="#fff6df" emissive="#fff6df" emissiveIntensity={1.6} />
      </mesh>
      {[-width * 0.38, width * 0.38].map((x, i) => (
        <mesh key={i} position={[x, dropFrom / 2 + 0.07, 0]}>
          <cylinderGeometry args={[0.006, 0.006, dropFrom, 6]} />
          <meshStandardMaterial color="#0d0d0d" />
        </mesh>
      ))}
    </group>
  );
}

/** A real retort-stand silhouette — heavy round base, thin rod, a boss-head block, and a C-shaped
 * ring clamp (a partial torus, not a full donut) gripping the flask. The full-torus "ring stand"
 * this replaces was the single biggest thing reading as a crude floating shape in the reference
 * comparison — a real clamp has a gap where it opens to receive the flask. */
function RetortStand({
  position,
  rotationY = 0,
  rodHeight = 1.7,
  clampHeight = 0.6,
  clampRadius = 0.5,
  standReach = clampRadius,
}: {
  position: THREE.Vector3Tuple;
  rotationY?: number;
  rodHeight?: number;
  clampHeight?: number;
  clampRadius?: number;
  standReach?: number;
}) {
  const metal = useMemo(() => new THREE.MeshStandardMaterial({ color: "#181818", metalness: 0.75, roughness: 0.35 }), []);
  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      <mesh position={[0, 0.025, 0]} castShadow receiveShadow material={metal}>
        <cylinderGeometry args={[0.32, 0.34, 0.05, 24]} />
      </mesh>
      <mesh position={[0, rodHeight / 2, 0]} castShadow material={metal}>
        <cylinderGeometry args={[0.016, 0.016, rodHeight, 12]} />
      </mesh>
      {/* Boss-head clamp block where the ring attaches to the rod */}
      <mesh position={[0, clampHeight, 0]} castShadow material={metal}>
        <boxGeometry args={[0.1, 0.09, 0.1]} />
      </mesh>
      {/* C-ring: a torus with an arc short of a full circle, leaving a real gap to slide the flask
       * in — `standReach` is the horizontal distance from the rod to the object it grips, so the
       * ring (radius `clampRadius`) actually centers on that object instead of floating nearby. */}
      <mesh position={[0, clampHeight, standReach]} rotation={[Math.PI / 2, 0, Math.PI * 0.62]} castShadow material={metal}>
        <torusGeometry args={[clampRadius, 0.014, 8, 32, Math.PI * 1.5]} />
      </mesh>
    </group>
  );
}

/** A Liebig-style vertical condenser: a slim inner vapor tube inside a wider glass water jacket,
 * with a few graduation rings and two hose-barb stubs — the horizontal plain cylinder this
 * replaces read as a random glass rod, not a condenser. */
function LiebigCondenser({ position }: { position: THREE.Vector3Tuple }) {
  const glass = useMemo(
    () => new THREE.MeshPhysicalMaterial({ color: "#eef3ee", transmission: 0.92, roughness: 0.04, thickness: 0.15, ior: 1.47 }),
    [],
  );
  const height = 1.15;
  return (
    <group position={position}>
      <mesh castShadow material={glass}>
        <cylinderGeometry args={[0.065, 0.065, height, 16]} />
      </mesh>
      <mesh material={glass}>
        <cylinderGeometry args={[0.15, 0.15, height * 0.8, 20, 1, true]} />
      </mesh>
      {[-0.55, 0, 0.55].map((y, i) => (
        <mesh key={i} position={[0, y, 0]} rotation={[Math.PI / 2, 0, 0]} material={glass}>
          <torusGeometry args={[0.15, 0.012, 8, 24]} />
        </mesh>
      ))}
      {/* Hose barbs, water in/out */}
      <mesh position={[0.16, height * 0.32, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.03, 0.03, 0.14, 10]} />
        <meshStandardMaterial color="#1c1c1c" roughness={0.6} />
      </mesh>
      <mesh position={[0.16, -height * 0.32, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.03, 0.03, 0.14, 10]} />
        <meshStandardMaterial color="#1c1c1c" roughness={0.6} />
      </mesh>
    </group>
  );
}

/** A boxy hotplate/stirrer with a ceramic top plate and a small digital-readout glow — reads as
 * lab equipment instead of the bare glowing ring it replaces. */
function HotPlate({ position }: { position: THREE.Vector3Tuple }) {
  return (
    <group position={position}>
      <mesh castShadow receiveShadow>
        <boxGeometry args={[0.62, 0.14, 0.5]} />
        <meshStandardMaterial color="#141414" roughness={0.5} />
      </mesh>
      <mesh position={[0, 0.09, 0]}>
        <cylinderGeometry args={[0.24, 0.24, 0.025, 32]} />
        <meshStandardMaterial color="#2a2a2a" roughness={0.3} metalness={0.4} />
      </mesh>
      <mesh position={[0, 0.075, 0.255]}>
        <planeGeometry args={[0.16, 0.05]} />
        <meshStandardMaterial color="#3a0f0f" emissive="#ff4d2e" emissiveIntensity={1.2} />
      </mesh>
      <mesh position={[-0.2, 0.075, 0.255]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.025, 0.025, 0.02, 12]} />
        <meshStandardMaterial color="#3a3a3a" roughness={0.4} />
      </mesh>
    </group>
  );
}

/** A small amber reagent bottle — cheap, reusable set dressing scattered on the bench. */
function ReagentBottle({ position, scale = 1, capColor = "#161616" }: { position: THREE.Vector3Tuple; scale?: number; capColor?: string }) {
  return (
    <group position={position} scale={scale}>
      <mesh castShadow>
        <cylinderGeometry args={[0.055, 0.06, 0.16, 16]} />
        <meshPhysicalMaterial color="#7a4a1a" transmission={0.55} roughness={0.25} thickness={0.1} />
      </mesh>
      <mesh position={[0, 0.1, 0]}>
        <cylinderGeometry args={[0.02, 0.03, 0.05, 12]} />
        <meshPhysicalMaterial color="#7a4a1a" transmission={0.55} roughness={0.25} thickness={0.1} />
      </mesh>
      <mesh position={[0, 0.135, 0]}>
        <cylinderGeometry args={[0.021, 0.021, 0.03, 12]} />
        <meshStandardMaterial color={capColor} roughness={0.5} />
      </mesh>
    </group>
  );
}

/** A tall lab stool matching the bench height, tucked in the foreground like the reference photo. */
function BarStool({ position }: { position: THREE.Vector3Tuple }) {
  const metal = useMemo(() => new THREE.MeshStandardMaterial({ color: "#1c1c1c", metalness: 0.6, roughness: 0.45 }), []);
  const legOffsets: [number, number][] = [
    [-0.18, -0.18],
    [0.18, -0.18],
    [-0.18, 0.18],
    [0.18, 0.18],
  ];
  return (
    <group position={position}>
      <mesh position={[0, 0.62, 0]} castShadow material={metal}>
        <cylinderGeometry args={[0.22, 0.22, 0.05, 24]} />
      </mesh>
      {legOffsets.map(([x, z], i) => (
        <mesh key={i} position={[x, 0.3, z]} material={metal}>
          <cylinderGeometry args={[0.02, 0.02, 0.6, 8]} />
        </mesh>
      ))}
      <mesh position={[0, 0.15, 0]} material={metal}>
        <torusGeometry args={[0.22, 0.012, 8, 20]} />
      </mesh>
    </group>
  );
}

/** A two-tier storage wall like the reference photo's back wall: an upper glass-fronted cabinet
 * (a shelf of bottles, a shelf of books/binders, warm under-shelf LEDs) sitting over a lower
 * solid cabinet with its own counter strip — mounted flush against a side wall, parallel to the
 * camera's path so it's never in front of or behind it. */
function WallCabinet({ position, rotationY = 0, width = 3.2 }: { position: THREE.Vector3Tuple; rotationY?: number; width?: number }) {
  const bottleRow = (seed: number, count: number, y: number) =>
    Array.from({ length: count }, (_, i) => ({
      x: -width / 2 + 0.3 + i * ((width - 0.6) / (count - 1)) + seededJitter(i, seed) * 0.05,
      s: 0.8 + seededJitter(i, seed + 1) * 0.35,
      y,
    }));
  const bottles = useMemo(() => bottleRow(500, 8, -0.72), [width]);
  const books = useMemo(
    () =>
      Array.from({ length: 12 }, (_, i) => ({
        x: -width / 2 + 0.35 + i * ((width - 0.7) / 11),
        h: 0.32 + seededJitter(i, 520) * 0.12,
        w: 0.045 + seededJitter(i, 521) * 0.02,
        color: [`#6b2e2e`, `#2e4a6b`, `#3c5c3c`, `#6b5a2e`, `#3a3238`][i % 5],
      })),
    [width],
  );

  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      {/* Upper glass cabinet: books shelf above, bottles shelf below */}
      <mesh receiveShadow castShadow>
        <boxGeometry args={[width, 1.5, 0.34]} />
        <meshStandardMaterial color="#16181a" roughness={0.5} metalness={0.15} />
      </mesh>
      <mesh position={[0, 0, 0.18]}>
        <planeGeometry args={[width - 0.1, 1.4]} />
        <meshPhysicalMaterial color="#1c2224" transmission={0.35} roughness={0.15} thickness={0.05} />
      </mesh>
      <mesh position={[0, -0.05, 0.1]}>
        <boxGeometry args={[width - 0.06, 0.03, 0.3]} />
        <meshStandardMaterial color="#e8c884" emissive="#e8c884" emissiveIntensity={0.7} />
      </mesh>
      <mesh position={[0, -0.75, 0.1]}>
        <boxGeometry args={[width - 0.06, 0.03, 0.3]} />
        <meshStandardMaterial color="#e8c884" emissive="#e8c884" emissiveIntensity={0.9} />
      </mesh>
      {books.map((b, i) => (
        <mesh key={i} position={[b.x, -0.05 + b.h / 2 + 0.02, 0.05]} castShadow>
          <boxGeometry args={[b.w, b.h, 0.2]} />
          <meshStandardMaterial color={b.color} roughness={0.7} />
        </mesh>
      ))}
      {bottles.map((b, i) => (
        <ReagentBottle key={i} position={[b.x, b.y, 0.05]} scale={b.s} />
      ))}

      {/* Lower solid cabinet + counter strip, the second tier of the storage wall */}
      <mesh position={[0, -1.15, 0.02]} receiveShadow castShadow>
        <boxGeometry args={[width, 0.85, 0.4]} />
        <meshStandardMaterial color="#101214" roughness={0.55} />
      </mesh>
      <mesh position={[0, -0.72, 0.05]}>
        <boxGeometry args={[width + 0.06, 0.04, 0.44]} />
        <meshStandardMaterial color="#3a3d40" metalness={0.6} roughness={0.35} />
      </mesh>
    </group>
  );
}

/** A large window with a partially-lowered roller blind — bright, slightly warm daylight glow
 * rather than the desk-lamp warmth of the interior lights, so it reads as an outside source. */
function LabWindow({ position, rotationY = 0 }: { position: THREE.Vector3Tuple; rotationY?: number }) {
  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      <mesh>
        <planeGeometry args={[2.4, 3.4]} />
        <meshStandardMaterial color="#dfe8ec" emissive="#dfe8ec" emissiveIntensity={0.9} transparent opacity={0.75} />
      </mesh>
      {/* Mullions */}
      {[-0.78, 0, 0.78].map((x, i) => (
        <mesh key={i} position={[x, 0, 0.03]}>
          <boxGeometry args={[0.05, 3.4, 0.05]} />
          <meshStandardMaterial color="#2b2b28" />
        </mesh>
      ))}
      <mesh position={[0, 1.2, 0.03]}>
        <boxGeometry args={[2.4, 0.05, 0.05]} />
        <meshStandardMaterial color="#2b2b28" />
      </mesh>
      {/* Roller blind, pulled about a third of the way down */}
      <mesh position={[0, 1.15, 0.06]}>
        <planeGeometry args={[2.3, 1.05]} />
        <meshStandardMaterial color="#c9c2ac" roughness={0.9} />
      </mesh>
      <pointLight position={[0, 0, 1.6]} intensity={5} color="#eef2ee" />
    </group>
  );
}

/** A plain wood door with a small vision panel — the "this room connects to a building" detail
 * that keeps the lab from feeling like a stage set floating in a void. */
function LabDoor({ position, rotationY = 0 }: { position: THREE.Vector3Tuple; rotationY?: number }) {
  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      <mesh>
        <boxGeometry args={[1.1, 2.5, 0.08]} />
        <meshStandardMaterial color="#5a4632" roughness={0.6} />
      </mesh>
      <mesh position={[0, 0.55, 0.045]}>
        <planeGeometry args={[0.32, 0.32]} />
        <meshStandardMaterial color="#2a3230" emissive="#3a4a44" emissiveIntensity={0.3} />
      </mesh>
      <mesh position={[0.42, -0.1, 0.06]}>
        <sphereGeometry args={[0.035, 12, 12]} />
        <meshStandardMaterial color="#c9c2ac" metalness={0.7} roughness={0.3} />
      </mesh>
      <mesh position={[0, 1.29, 0.02]}>
        <boxGeometry args={[1.3, 0.08, 0.14]} />
        <meshStandardMaterial color="#3a2f22" roughness={0.6} />
      </mesh>
    </group>
  );
}

function LabScene() {
  const groupRef = useRef<THREE.Group>(null);
  useStationVisibility(groupRef, STATIONS.lab);

  const flaskRef = useRef<THREE.Mesh>(null);
  useFrame((state) => {
    if (flaskRef.current && !prefersReducedMotion) {
      flaskRef.current.rotation.y = state.clock.elapsedTime * 0.3;
    }
  });

  // Dark charcoal room shell + bench, same technique as the classroom (side walls only — never
  // front/back, the camera flies straight through) but kept moody: near-black, minimal texture,
  // no daylight. This is the control condition next to the UAHD ultrasonic bath, matching the
  // TDR's actual two-condition design instead of one flask floating alone.
  const materials = useMemo(() => {
    const wallPlaster = createPlasterTexture({
      base: "#171410",
      dark: "#0c0a08",
      light: "#241f19",
      size: 512,
      repeat: [2, 2],
      seed: 41,
    });
    const wallMat = new THREE.MeshStandardMaterial({
      map: wallPlaster.map,
      roughnessMap: wallPlaster.roughnessMap,
      roughness: 0.9,
      envMapIntensity: 0.1,
    });
    const floorMat = new THREE.MeshStandardMaterial({ color: "#0f0c09", roughness: 0.4, envMapIntensity: 0.3 });
    const counterMat = new THREE.MeshStandardMaterial({ color: "#7d8286", metalness: 0.75, roughness: 0.32, envMapIntensity: 0.5 });
    const cabinetMat = new THREE.MeshStandardMaterial({ color: "#141414", roughness: 0.55 });
    const ceilingTiles = createAcousticTileTexture(512, 5, "#3a352e");
    ceilingTiles.repeat.set(2.5, 6);
    const ceilingMat = new THREE.MeshStandardMaterial({ map: ceilingTiles, roughness: 0.95 });
    return { wallMat, floorMat, counterMat, cabinetMat, ceilingMat };
  }, []);

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

  const bubbles = useMemo(() => {
    const count = 40;
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      arr[i * 3] = (seededJitter(i, 400) - 0.5) * 0.9;
      arr[i * 3 + 1] = seededJitter(i, 401) * 0.35;
      arr[i * 3 + 2] = (seededJitter(i, 402) - 0.5) * 0.55;
    }
    return arr;
  }, []);

  const BENCH_Y = -0.15;
  const flaskY = BENCH_Y + 0.55;
  const flaskRadius = 0.38;

  return (
    <group ref={groupRef} position={[0, -1, STATIONS.lab]}>
      {/* Floor + side-wall shell — grounds the apparatus instead of leaving it floating in pure
       * fog, without giving up the moody dark-lab read (near-black, almost no fill light). */}
      <mesh position={[0, -0.82, 0]} rotation={[-Math.PI / 2, 0, 0]} material={materials.floorMat} receiveShadow>
        <planeGeometry args={[11, 26]} />
      </mesh>
      <mesh position={[-5, 3, 0]} rotation={[0, Math.PI / 2, 0]} material={materials.wallMat} receiveShadow>
        <planeGeometry args={[26, 8]} />
      </mesh>
      <mesh position={[5, 3, 0]} rotation={[0, -Math.PI / 2, 0]} material={materials.wallMat} receiveShadow>
        <planeGeometry args={[26, 8]} />
      </mesh>
      <mesh position={[0, 4.4, 0]} rotation={[Math.PI / 2, 0, 0]} material={materials.ceilingMat} receiveShadow>
        <planeGeometry args={[11, 26]} />
      </mesh>
      {/* Ceiling vent grille — a small mundane detail, recessed and darker than the tiles around it */}
      <mesh position={[2, 4.38, -4]} rotation={[Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.9, 0.5]} />
        <meshStandardMaterial color="#111311" roughness={0.6} />
      </mesh>

      {/* Raised stainless bench on a dark cabinet base, replacing the round "perfume podium" —
       * the reference is a real lab bench at counter height, not a display pedestal. */}
      <mesh position={[0, BENCH_Y - 0.04, 0.7]} material={materials.counterMat} castShadow receiveShadow>
        <boxGeometry args={[7.6, 0.08, 2.4]} />
      </mesh>
      <mesh position={[0, -0.525, 0.7]} material={materials.cabinetMat} receiveShadow>
        <boxGeometry args={[7.4, 0.59, 2.2]} />
      </mesh>
      <WallCabinet position={[-4.83, 1.6, -2.6]} rotationY={Math.PI / 2} />
      <LabWindow position={[4.85, 1.9, -3.4]} rotationY={-Math.PI / 2} />
      <PottedPlant position={[4.3, -0.82, -5.2]} scale={1.1} />
      <LabDoor position={[4.92, 0.44, 6.6]} rotationY={-Math.PI / 2} />
      <Poster position={[4.83, 2.1, 1.6]} rotationY={-Math.PI / 2} label={"AROMATIC COMPOUNDS\nTERPENES"} />
      <Poster position={[4.83, 2.1, 4]} rotationY={-Math.PI / 2} label={"NATURAL SCIENCE\nBETTER FUTURE"} />
      <PendantLight position={[0, 2.9, 0.7]} width={4} dropFrom={1.4} />
      <BarStool position={[0, -0.82, 2.6]} />

      {/* The whole apparatus cluster sits pushed back from the camera's exact path — a tall
       * vertical condenser sitting right on the flight line at the "hero" moment reads as an
       * extreme, cropped close-up instead of the wide establishing shot the reference has, the
       * same trap the classroom's teacher's desk fell into. */}
      <group position={[0, 0, -1.3]}>
      {/* Heating mantle / hotplate the flask sits on */}
      <HotPlate position={[0, BENCH_Y + 0.07, 0]} />
      <pointLight position={[0, BENCH_Y + 0.2, 0]} intensity={3} distance={3} decay={2} color="#ff5a30" />

      {/* Retort stand gripping the flask with a real C-shaped clamp, not a floating donut */}
      <RetortStand
        position={[-0.75, BENCH_Y, 0]}
        rotationY={Math.PI / 2}
        rodHeight={1.15}
        clampHeight={flaskY - BENCH_Y}
        clampRadius={flaskRadius + 0.02}
        standReach={0.75}
      />

      {/* Flask — clear glass with a separate amber liquid pool, not one flat tinted-glass sphere */}
      <mesh ref={flaskRef} position={[0, flaskY, 0]} castShadow>
        <sphereGeometry args={[flaskRadius, 32, 32]} />
        <meshPhysicalMaterial color="#f2f6f2" transmission={0.93} roughness={0.04} thickness={0.25} ior={1.5} />
      </mesh>
      <mesh position={[0, flaskY - flaskRadius * 0.32, 0]}>
        <sphereGeometry args={[flaskRadius * 0.82, 24, 24]} />
        <meshPhysicalMaterial color={PALETTE.primary} transmission={0.55} roughness={0.15} thickness={0.3} />
      </mesh>
      <mesh position={[0, flaskY + flaskRadius * 0.92, 0]}>
        <cylinderGeometry args={[flaskRadius * 0.24, flaskRadius * 0.3, flaskRadius * 0.4, 16]} />
        <meshPhysicalMaterial color="#f2f6f2" transmission={0.9} roughness={0.05} thickness={0.15} />
      </mesh>

      {/* Liebig condenser, vertical, feeding straight up out of the flask neck */}
      <LiebigCondenser position={[0, flaskY + flaskRadius * 1.5, 0]} />

      <points position={[0, flaskY + 0.6, 0]}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[steam, 3]} />
        </bufferGeometry>
        <pointsMaterial size={0.05} color="#f2ece2" transparent opacity={0.25} />
      </points>

      {/* Graduated collection cylinder — a small glass tube catching the separated oil, the actual
       * measurement the whole experiment comes down to (yield %, per the methodology text). */}
      <group position={[1.7, BENCH_Y, 1.3]}>
        <mesh position={[0, 0.35, 0]} castShadow>
          <cylinderGeometry args={[0.14, 0.14, 0.7, 20, 1, true]} />
          <meshPhysicalMaterial color="#dfe6e0" transmission={0.9} roughness={0.05} thickness={0.15} side={THREE.DoubleSide} />
        </mesh>
        <mesh position={[0, 0.14, 0]}>
          <cylinderGeometry args={[0.13, 0.13, 0.22, 20]} />
          <meshPhysicalMaterial color="#cfe0e8" transmission={0.6} roughness={0.1} thickness={0.2} />
        </mesh>
        <mesh position={[0, 0.27, 0]}>
          <cylinderGeometry args={[0.132, 0.132, 0.04, 20]} />
          <meshStandardMaterial color={PALETTE.primary} emissive={PALETTE.primary} emissiveIntensity={0.4} roughness={0.3} />
        </mesh>
      </group>
      <ReagentBottle position={[2.15, BENCH_Y + 0.08, 1.1]} />
      <ReagentBottle position={[2.35, BENCH_Y + 0.08, 1.45]} scale={0.85} />

      {/* Ultrasonic bath — Condition B (UAHD) sitting right next to the classic setup, the actual
       * comparison the whole TDR is built around, not just a lone hero flask. */}
      <group position={[-2.3, BENCH_Y + 0.3, 0.4]}>
        <mesh castShadow receiveShadow>
          <boxGeometry args={[1.3, 0.6, 0.9]} />
          <meshStandardMaterial color="#3a3d40" roughness={0.4} metalness={0.5} />
        </mesh>
        <mesh position={[0, 0, 0.46]}>
          <planeGeometry args={[1.1, 0.3]} />
          <meshStandardMaterial color="#101214" roughness={0.4} />
        </mesh>
        <mesh position={[0.35, 0, 0.465]}>
          <circleGeometry args={[0.03, 16]} />
          <meshStandardMaterial color="#7ee0b8" emissive="#7ee0b8" emissiveIntensity={1.2} />
        </mesh>
        <mesh position={[0, 0.31, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[1.15, 0.75]} />
          <meshStandardMaterial color="#5fb8c9" emissive="#5fb8c9" emissiveIntensity={0.9} transparent opacity={0.75} />
        </mesh>
        <points position={[0, 0.32, 0]}>
          <bufferGeometry>
            <bufferAttribute attach="attributes-position" args={[bubbles, 3]} />
          </bufferGeometry>
          <pointsMaterial size={0.025} color="#dff5fa" transparent opacity={0.8} />
        </points>
        <pointLight position={[0, 0.4, 0]} intensity={3} distance={3} decay={2} color="#5fb8c9" />
      </group>

      {/* Raw material floating beside the flask — kept on the right, clear of the left-aligned text card */}
      <Flower position={[2.3, flaskY + 0.15, 1.1]} scale={0.75} />

      {/* Dramatic diagonal shaft, echoing the perfume-bottle reference */}
      <LightBeam position={[2.2, 5, -1]} rotation={[0, 0, 0.5]} length={9} radius={1.6} opacity={0.18} />
      <pointLight position={[0, 1.5, 2.5]} intensity={20} color={PALETTE.accent} />
      <pointLight position={[2, 3, 2]} intensity={10} color={PALETTE.secondary} />
      <pointLight position={[2.6, 2, 1.4]} intensity={10} color={PALETTE.primary} />
      </group>
    </group>
  );
}

function Bond({ to, material }: { to: THREE.Vector3Tuple; material?: THREE.Material }) {
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
    <mesh position={position} quaternion={quaternion} material={material} castShadow>
      <cylinderGeometry args={[0.09, 0.09, length, 16]} />
      {!material && <meshStandardMaterial color="#3a2f26" metalness={0.4} roughness={0.3} />}
    </mesh>
  );
}

/** A stylized, abstracted scientist — architectural-visualization "entourage" style (a peg-doll
 * silhouette: coat, head, no detailed anatomy) rather than an attempt at a realistic figure. This
 * reads fine at the mid-distance the reference photos place people at; a crude attempt at real
 * anatomy would look worse than this simplification, not better. */
function LabFigure({
  position,
  rotationY = 0,
  hairColor = "#3a2c20",
}: {
  position: THREE.Vector3Tuple;
  rotationY?: number;
  hairColor?: string;
}) {
  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      <mesh position={[0, 0.4, 0]} castShadow>
        <cylinderGeometry args={[0.12, 0.14, 0.8, 12]} />
        <meshStandardMaterial color="#2b2f3a" roughness={0.7} />
      </mesh>
      <mesh position={[0, 1.05, 0]} castShadow>
        <cylinderGeometry args={[0.22, 0.18, 0.72, 12]} />
        <meshStandardMaterial color="#f2f2ef" roughness={0.55} />
      </mesh>
      <mesh position={[-0.24, 1.0, 0]} rotation={[0, 0, 0.15]} castShadow>
        <cylinderGeometry args={[0.045, 0.05, 0.6, 8]} />
        <meshStandardMaterial color="#f2f2ef" roughness={0.55} />
      </mesh>
      <mesh position={[0.24, 1.0, 0]} rotation={[0, 0, -0.15]} castShadow>
        <cylinderGeometry args={[0.045, 0.05, 0.6, 8]} />
        <meshStandardMaterial color="#f2f2ef" roughness={0.55} />
      </mesh>
      <mesh position={[0, 1.56, 0]} castShadow>
        <sphereGeometry args={[0.135, 16, 16]} />
        <meshStandardMaterial color="#caa27a" roughness={0.6} />
      </mesh>
      <mesh position={[0, 1.62, 0]}>
        <sphereGeometry args={[0.14, 16, 16, 0, Math.PI * 2, 0, Math.PI * 0.5]} />
        <meshStandardMaterial color={hairColor} roughness={0.8} />
      </mesh>
    </group>
  );
}

/** A monitor on a small stand, screen glowing with a data-chart texture — background-equipment
 * set dressing that reads as "busy modern lab" from across the room. */
function MonitorProp({ position, rotationY = 0, hue = "blue" }: { position: THREE.Vector3Tuple; rotationY?: number; hue?: "blue" | "green" }) {
  const screen = useMemo(() => createDataScreenTexture(256, hue), [hue]);
  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      <mesh position={[0, 0.32, 0]} castShadow>
        <boxGeometry args={[0.62, 0.4, 0.03]} />
        <meshBasicMaterial map={screen} toneMapped={false} />
      </mesh>
      <mesh position={[0, 0.08, 0]}>
        <cylinderGeometry args={[0.02, 0.05, 0.16, 10]} />
        <meshStandardMaterial color="#1c1c1c" roughness={0.5} />
      </mesh>
      <mesh position={[0, 0.005, 0]}>
        <cylinderGeometry args={[0.14, 0.14, 0.01, 20]} />
        <meshStandardMaterial color="#1c1c1c" roughness={0.5} />
      </mesh>
    </group>
  );
}

function MoleculeScene() {
  const sceneRef = useRef<THREE.Group>(null);
  useStationVisibility(sceneRef, STATIONS.molecule);

  const groupRef = useRef<THREE.Group>(null);
  useFrame((state) => {
    if (groupRef.current && !prefersReducedMotion) groupRef.current.rotation.y = state.clock.elapsedTime * 0.25;
  });

  // Glossy "product render" molecule materials — chrome bonds, glossy plastic atoms — matching
  // the reference photo's ball-and-stick model instead of flat emissive-tinted spheres.
  const molMaterials = useMemo(() => {
    const chrome = new THREE.MeshStandardMaterial({ color: "#e2e6e8", metalness: 1, roughness: 0.18, envMapIntensity: 1.2 });
    const dark = new THREE.MeshPhysicalMaterial({ color: "#17181a", roughness: 0.14, clearcoat: 1, clearcoatRoughness: 0.08, envMapIntensity: 1 });
    const white = new THREE.MeshPhysicalMaterial({ color: "#f2f2ef", roughness: 0.1, clearcoat: 1, clearcoatRoughness: 0.06, envMapIntensity: 1 });
    return { chrome, dark, white };
  }, []);

  // Bright, clean modern-lab room shell — cool light gray-blue, a world away from the noir
  // gold/wine palette elsewhere, matching the reference photos directly.
  const roomMaterials = useMemo(() => {
    const wallPlaster = createPlasterTexture({
      base: "#cdd4d8",
      dark: "#b9c1c6",
      light: "#dee4e6",
      size: 512,
      repeat: [3, 2],
      seed: 71,
    });
    const wallMat = new THREE.MeshStandardMaterial({ map: wallPlaster.map, roughnessMap: wallPlaster.roughnessMap, roughness: 0.85 });
    const floorMat = new THREE.MeshStandardMaterial({ color: "#a9afb2", roughness: 0.35, metalness: 0.15, envMapIntensity: 0.4 });
    const ceilingTiles = createAcousticTileTexture(512, 5, "#eef0ee");
    ceilingTiles.repeat.set(3, 5);
    const ceilingMat = new THREE.MeshStandardMaterial({ map: ceilingTiles, roughness: 0.95 });
    const counterMat = new THREE.MeshStandardMaterial({ color: "#232a33", roughness: 0.4 });
    const cabinetMat = new THREE.MeshStandardMaterial({ color: "#d7dadc", roughness: 0.6 });
    return { wallMat, floorMat, ceilingMat, counterMat, cabinetMat };
  }, []);

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

  const FLOOR_Y = -2;
  const CEILING_Y = 4.3;
  const WALL_X = 6;

  return (
    <group ref={sceneRef} position={[0, 0, STATIONS.molecule]}>
      {/* Room shell: bright, cool, symmetrical — side walls only (camera-safe), floor, and a
       * suspended white acoustic-tile ceiling with flush light panels instead of one dramatic beam. */}
      <mesh position={[-WALL_X, (FLOOR_Y + CEILING_Y) / 2, 0]} rotation={[0, Math.PI / 2, 0]} material={roomMaterials.wallMat} receiveShadow>
        <planeGeometry args={[26, CEILING_Y - FLOOR_Y]} />
      </mesh>
      <mesh position={[WALL_X, (FLOOR_Y + CEILING_Y) / 2, 0]} rotation={[0, -Math.PI / 2, 0]} material={roomMaterials.wallMat} receiveShadow>
        <planeGeometry args={[26, CEILING_Y - FLOOR_Y]} />
      </mesh>
      <mesh position={[0, FLOOR_Y, 0]} rotation={[-Math.PI / 2, 0, 0]} material={roomMaterials.floorMat} receiveShadow>
        <planeGeometry args={[WALL_X * 2, 26]} />
      </mesh>
      <mesh position={[0, CEILING_Y, 0]} rotation={[Math.PI / 2, 0, 0]} material={roomMaterials.ceilingMat} receiveShadow>
        <planeGeometry args={[WALL_X * 2, 26]} />
      </mesh>
      {[-3.2, 0, 3.2].map((z, i) => (
        <mesh key={i} position={[0, CEILING_Y - 0.02, z]} rotation={[Math.PI / 2, 0, 0]}>
          <planeGeometry args={[2.6, 1.3]} />
          <meshStandardMaterial color="#f6f7f4" emissive="#eef2ff" emissiveIntensity={1.3} />
        </mesh>
      ))}

      {/* Side benches with glowing monitors, echoing the reference's data-screen-lined walls */}
      <mesh position={[-WALL_X + 0.9, FLOOR_Y + 0.5, -3]} material={roomMaterials.cabinetMat} receiveShadow castShadow>
        <boxGeometry args={[1.5, 1, 2.6]} />
      </mesh>
      <mesh position={[-WALL_X + 0.9, FLOOR_Y + 1.02, -3]} material={roomMaterials.counterMat}>
        <boxGeometry args={[1.56, 0.05, 2.66]} />
      </mesh>
      <MonitorProp position={[-WALL_X + 0.9, FLOOR_Y + 1.05, -3.7]} rotationY={Math.PI * 0.15} hue="blue" />
      <MonitorProp position={[-WALL_X + 0.9, FLOOR_Y + 1.05, -2.2]} rotationY={Math.PI * 0.15} hue="green" />

      <mesh position={[WALL_X - 0.9, FLOOR_Y + 0.5, 2]} material={roomMaterials.cabinetMat} receiveShadow castShadow>
        <boxGeometry args={[1.5, 1, 2.6]} />
      </mesh>
      <mesh position={[WALL_X - 0.9, FLOOR_Y + 1.02, 2]} material={roomMaterials.counterMat}>
        <boxGeometry args={[1.56, 0.05, 2.66]} />
      </mesh>
      <MonitorProp position={[WALL_X - 0.9, FLOOR_Y + 1.05, 1.3]} rotationY={-Math.PI * 0.15} hue="blue" />

      {/* Scientists at work — stylized entourage figures, not an attempt at realistic people;
       * placed at a distance the reference photos also keep them at, where the abstraction reads
       * as "a person" rather than inviting scrutiny. */}
      <LabFigure position={[-WALL_X + 0.9, FLOOR_Y, -1.4]} rotationY={Math.PI * 0.85} />
      <LabFigure position={[WALL_X - 0.9, FLOOR_Y, 1.7]} rotationY={-Math.PI * 0.85} hairColor="#1c1712" />
      <LabFigure position={[-1.6, FLOOR_Y, -4.4]} rotationY={0.6} hairColor="#5a4a34" />

      {/* Hero molecule — glossy chrome-and-plastic ball-and-stick model, sharp in the foreground */}
      <group ref={groupRef}>
        {atoms.map((pos, i) => (
          <Bond key={i} to={pos} material={molMaterials.chrome} />
        ))}
        <mesh castShadow>
          <sphereGeometry args={[0.75, 32, 32]} />
          <primitive object={molMaterials.dark} attach="material" />
        </mesh>
        {atoms.map((pos, i) => (
          <mesh key={i} position={pos} castShadow>
            <sphereGeometry args={[0.38, 24, 24]} />
            <primitive object={molMaterials.white} attach="material" />
          </mesh>
        ))}
      </group>

      <hemisphereLight args={["#eef4ff", "#8f9aa3", 0.85]} />
      <pointLight position={[0, 2, 3]} intensity={10} color="#f2f6ff" />
      <pointLight position={[-2.5, 1.5, -1]} intensity={6} color="#dfeeff" />
      <pointLight position={[2.5, 1, 1]} intensity={5} color="#ffffff" />
    </group>
  );
}

/** A perfume bottle — rectangular clear glass, a metal collar and cap. The scent isn't sprayed
 * away, it's held: the closing image for a TDR about capturing aroma. */
function PerfumeBottle() {
  const glassMat = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        color: "#fdf8f2",
        transmission: 0.95,
        roughness: 0.03,
        thickness: 0.5,
        ior: 1.5,
        envMapIntensity: 1.1,
      }),
    [],
  );
  const capMat = useMemo(() => new THREE.MeshStandardMaterial({ color: "#d8c4a0", metalness: 0.85, roughness: 0.25 }), []);

  return (
    <group>
      <mesh material={glassMat} castShadow>
        <boxGeometry args={[1.5, 1.9, 0.68]} />
      </mesh>
      <mesh position={[0, 1.08, 0]} material={glassMat}>
        <cylinderGeometry args={[0.15, 0.19, 0.28, 24]} />
      </mesh>
      <mesh position={[0, 1.36, 0]} material={capMat} castShadow>
        <cylinderGeometry args={[0.165, 0.165, 0.32, 24]} />
      </mesh>
      <mesh position={[0, 1.53, 0]} material={capMat}>
        <sphereGeometry args={[0.165, 24, 12, 0, Math.PI * 2, 0, Math.PI * 0.5]} />
      </mesh>
    </group>
  );
}

/** Two intertwined ribbons of colored "smoke" — the captured scent, swirling inside the glass.
 * A CatmullRom curve run through a TubeGeometry, additive-blended so the strands glow and
 * overlap softly instead of reading as solid colored rope. */
function ScentSwirl() {
  const geometry1 = useMemo(() => {
    const pts = Array.from({ length: 22 }, (_, i) => {
      const t = i / 21;
      return new THREE.Vector3(Math.sin(t * Math.PI * 2.4) * 0.32, -0.75 + t * 1.55, Math.cos(t * Math.PI * 2.4) * 0.14);
    });
    return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 80, 0.085, 10, false);
  }, []);
  const geometry2 = useMemo(() => {
    const pts = Array.from({ length: 22 }, (_, i) => {
      const t = i / 21;
      return new THREE.Vector3(
        Math.sin(t * Math.PI * 2.4 + Math.PI * 0.55) * 0.28,
        -0.7 + t * 1.5,
        Math.cos(t * Math.PI * 2.4 + Math.PI * 0.55) * 0.17,
      );
    });
    return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 80, 0.065, 10, false);
  }, []);

  return (
    <group>
      <mesh geometry={geometry1}>
        <meshBasicMaterial color={PALETTE.pastelPeach} transparent opacity={0.55} blending={THREE.AdditiveBlending} depthWrite={false} side={THREE.DoubleSide} />
      </mesh>
      <mesh geometry={geometry2}>
        <meshBasicMaterial color={PALETTE.pastelLavender} transparent opacity={0.5} blending={THREE.AdditiveBlending} depthWrite={false} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

function HorizonScene() {
  const sceneRef = useRef<THREE.Group>(null);
  useStationVisibility(sceneRef, STATIONS.horizon, 15);

  // The bottle turns slowly to show off the glass and the swirl inside — this is the last
  // station, scroll progress caps at 1.0 exactly here, so nothing behind the backdrop plane can
  // ever be reached; unlike every earlier scene, a flat backdrop facing the camera is safe.
  const groupRef = useRef<THREE.Group>(null);
  useFrame((state) => {
    if (groupRef.current && !prefersReducedMotion) {
      groupRef.current.rotation.y = state.clock.elapsedTime * 0.12;
    }
  });

  const backdrop = useMemo(() => createPastelGradientTexture(512), []);

  const sparkles = useMemo(() => {
    const count = 140;
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const palette = [PALETTE.pastelPeach, PALETTE.pastelLavender, PALETTE.pastelPink, PALETTE.pastelCream].map(
      (c) => new THREE.Color(c),
    );
    for (let i = 0; i < count; i++) {
      positions[i * 3] = (seededJitter(i, 700) - 0.5) * 20;
      positions[i * 3 + 1] = (seededJitter(i, 701) - 0.5) * 9;
      positions[i * 3 + 2] = -1 - seededJitter(i, 702) * 6;
      const c = palette[i % palette.length];
      colors[i * 3] = c.r;
      colors[i * 3 + 1] = c.g;
      colors[i * 3 + 2] = c.b;
    }
    return { positions, colors };
  }, []);
  const sparkleMap = useMemo(() => createGlowSpriteTexture(128), []);

  return (
    <group ref={sceneRef} position={[0, 0, STATIONS.horizon]}>
      {/* Soft pastel studio backdrop — a dome surrounding the whole scene, not a flat panel, so
       * there's no edge for the camera's scroll-driven sway to swing past into black void the
       * way even a wide flat panel eventually allows. */}
      <mesh position={[0, 0.3, 0]}>
        <sphereGeometry args={[22, 32, 32]} />
        <meshBasicMaterial map={backdrop} toneMapped={false} side={THREE.BackSide} />
      </mesh>

      {/* Drifting bokeh — soft round sparkles in the same warm/cool pastel pair as the smoke inside */}
      <points>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[sparkles.positions, 3]} />
          <bufferAttribute attach="attributes-color" args={[sparkles.colors, 3]} />
        </bufferGeometry>
        <pointsMaterial size={0.5} map={sparkleMap} vertexColors transparent opacity={0.8} depthWrite={false} blending={THREE.AdditiveBlending} sizeAttenuation />
      </points>

      {/* Reflective tabletop the bottle stands on, like the reference photo's glossy surface */}
      <mesh position={[0, -1.05, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[10, 8]} />
        <MeshReflectorMaterial
          blur={[300, 80]}
          resolution={512}
          mixBlur={0.6}
          mixStrength={8}
          roughness={0.75}
          depthScale={1}
          minDepthThreshold={0.85}
          color="#ddd0c2"
          metalness={0.15}
        />
      </mesh>

      {/* The bottle, offset off the centered closing text card so the two don't fight for the eye */}
      <group ref={groupRef} position={[2.4, -0.05, 0]}>
        <PerfumeBottle />
        <ScentSwirl />
      </group>

      <hemisphereLight args={["#fff3e6", "#cdb8d8", 0.55]} />
      <pointLight position={[2, 2, 3]} intensity={4.5} color="#fff0dd" />
      <pointLight position={[-2, 1.5, 1]} intensity={3} color="#e6d6f5" />
      <pointLight position={[3, 0.5, -1]} intensity={2.5} color="#ffe6d2" />
    </group>
  );
}

export default function Scene() {
  return (
    <Canvas
      dpr={[1, 1.5]}
      shadows={{ type: THREE.VSMShadowMap }}
      gl={{ antialias: true, powerPreference: "high-performance" }}
      camera={{ fov: 55, near: 0.1, far: 120, position: [0, 1.2, STATIONS.hero] }}
    >
      <color attach="background" args={[PALETTE.fog]} />
      <fogExp2 attach="fog" args={[PALETTE.fog, 0.026]} />
      <ambientLight intensity={0.4} />
      <Environment preset="studio" background={false} environmentIntensity={0.25} />
      <CameraRig />
      <TravelLight />
      <Starfield />
      <TransitGlow z={(STATIONS.hero + STATIONS.classroom) / 2} color={PALETTE.primary} />
      <TransitGlow z={(STATIONS.classroom + STATIONS.lab) / 2} color={PALETTE.leafBright} />
      <TransitGlow z={(STATIONS.lab + STATIONS.molecule) / 2} color={PALETTE.secondary} />
      <TransitGlow z={(STATIONS.molecule + STATIONS.horizon) / 2} color={PALETTE.accent} />
      <ClassroomScene />
      <LabScene />
      <MoleculeScene />
      <HorizonScene />
      <EffectComposer multisampling={0}>
        <Bloom mipmapBlur luminanceThreshold={0.45} luminanceSmoothing={0.3} intensity={0.5} radius={0.75} />
        <Vignette eskil={false} offset={0.3} darkness={0.45} />
        <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
      </EffectComposer>
    </Canvas>
  );
}
