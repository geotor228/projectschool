"use client";

import { useEffect, useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Environment, ContactShadows } from "@react-three/drei";
import { EffectComposer, Bloom, Vignette, ToneMapping } from "@react-three/postprocessing";
import { ToneMappingMode } from "postprocessing";
import * as THREE from "three";
import { journeyState } from "@/lib/journeyState";
import { createWoodTexture, createSlateTexture, createPlasterTexture } from "@/lib/proceduralTextures";

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
    target.set(sway * 0.5, 1, z - 7);
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
}: {
  position: THREE.Vector3Tuple;
  rotationY?: number;
  woodMat: THREE.Material;
  metalMat: THREE.Material;
}) {
  const legPositions: THREE.Vector3Tuple[] = [
    [-0.55, 0, -0.32],
    [0.55, 0, -0.32],
    [-0.55, 0, 0.32],
    [0.55, 0, 0.32],
  ];
  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      {/* Tabletop */}
      <mesh position={[0, 0.75, 0]} material={woodMat} castShadow receiveShadow>
        <boxGeometry args={[1.3, 0.06, 0.75]} />
      </mesh>
      {legPositions.map((lp, i) => (
        <mesh key={i} position={[lp[0], 0.37, lp[2]]} material={metalMat}>
          <cylinderGeometry args={[0.03, 0.03, 0.74, 8]} />
        </mesh>
      ))}
      {/* Chair, offset behind the desk */}
      <mesh position={[0, 0.42, 0.62]} material={woodMat} castShadow>
        <boxGeometry args={[0.55, 0.06, 0.5]} />
      </mesh>
      <mesh position={[0, 0.75, 0.85]} material={woodMat} castShadow>
        <boxGeometry args={[0.55, 0.65, 0.06]} />
      </mesh>
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
  const materials = useMemo(() => {
    const deskWood = createWoodTexture({
      base: "#241a10",
      dark: "#120b06",
      light: "#3c2b18",
      size: 512,
      repeat: [1, 1],
      seed: 3,
    });
    const floorWood = createWoodTexture({
      base: "#160f0a",
      dark: "#0a0604",
      light: "#251a10",
      size: 512,
      repeat: [5, 4],
      plankLines: true,
      seed: 11,
    });
    const woodMat = new THREE.MeshStandardMaterial({
      map: deskWood.map,
      roughnessMap: deskWood.roughnessMap,
      roughness: 0.6,
      envMapIntensity: 0.12,
      emissive: new THREE.Color(PALETTE.primary),
      emissiveIntensity: 0.04,
    });
    const metalMat = new THREE.MeshStandardMaterial({
      color: "#1a1410",
      metalness: 0.6,
      roughness: 0.55,
      envMapIntensity: 0.4,
    });
    // Floor gets zero environment contribution: a matte wood floor has nothing to gain from HDRI
    // reflections, and the "studio" preset's bright softbox region was blowing out the near floor
    // as a hot, view-angle-dependent specular patch under grazing camera angles — not a light bug,
    // an IBL-on-a-flat-plane bug. Direct scene lights still shade it normally.
    const floorMat = new THREE.MeshStandardMaterial({
      map: floorWood.map,
      roughnessMap: floorWood.roughnessMap,
      roughness: 1,
      envMapIntensity: 0,
    });
    const slateMat = new THREE.MeshStandardMaterial({ map: createSlateTexture(512), roughness: 0.7 });
    // Walls: warm, muted olive-charcoal plaster — not pure black, not pure brown. Reads as
    // "greenhouse-adjacent lab" rather than either a jewelry-ad void or a plain office wall.
    const wallPlaster = createPlasterTexture({
      base: "#2b2c23",
      dark: "#1a1b15",
      light: "#454636",
      size: 512,
      repeat: [3, 2],
      seed: 21,
    });
    const wallMat = new THREE.MeshStandardMaterial({
      map: wallPlaster.map,
      roughnessMap: wallPlaster.roughnessMap,
      roughness: 0.95,
      envMapIntensity: 0.08,
      // A faint self-glow so the far stretches of wall (past the reach of any point light) still
      // read as a dim surface instead of crushing to pure fog-black — a baseline visibility floor.
      emissive: new THREE.Color(PALETTE.primary),
      emissiveIntensity: 0.06,
    });
    return { woodMat, metalMat, floorMat, slateMat, wallMat };
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
        <planeGeometry args={[20, 8]} />
      </mesh>
      <mesh position={[7, 4, -2]} rotation={[0, -Math.PI / 2, 0]} material={materials.wallMat} receiveShadow>
        <planeGeometry args={[20, 8]} />
      </mesh>
      <mesh position={[0, 8, -2]} rotation={[Math.PI / 2, 0, 0]} material={materials.wallMat} receiveShadow>
        <planeGeometry args={[14, 20]} />
      </mesh>

      {/* Potted plants — the biophilic counterweight to the gold/wine palette: real green, real
       * life, not just another metal-and-varnish surface. */}
      <PottedPlant position={[-6.35, 0, -3.35]} scale={1.05} />
      <PottedPlant position={[-6.35, 0, -0.35]} scale={0.95} />
      <PottedPlant position={[6.1, 0, -6.2]} scale={1.3} />

      {/* Blackboard, real chalk-slate texture instead of a flat fill */}
      <mesh position={[0, 3.2, -6]} material={materials.slateMat} receiveShadow>
        <planeGeometry args={[10, 5]} />
      </mesh>
      <mesh position={[0, 3.2, -5.94]}>
        <planeGeometry args={[7, 0.06]} />
        <meshStandardMaterial color={PALETTE.accent} emissive={PALETTE.accent} emissiveIntensity={1.2} />
      </mesh>
      {/* Chalk molecule sketch on the board — a small nod to the subject matter */}
      <mesh position={[-2.6, 4, -5.93]}>
        <ringGeometry args={[0.28, 0.32, 24]} />
        <meshBasicMaterial color={PALETTE.accent} transparent opacity={0.22} />
      </mesh>
      <mesh position={[-1.9, 3.7, -5.93]}>
        <ringGeometry args={[0.18, 0.21, 24]} />
        <meshBasicMaterial color={PALETTE.accent} transparent opacity={0.18} />
      </mesh>

      {/* Teacher's desk, larger, facing the class — pushed back near the board so the camera's
       * flight path (which runs straight down the center aisle) never grazes it at close range. */}
      <group position={[0, 0, -5.5]}>
        <mesh position={[0, 0.5, 0]} material={materials.woodMat} castShadow receiveShadow>
          <boxGeometry args={[2.2, 0.08, 0.9]} />
        </mesh>
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
        />
      ))}

      {/* Windows down the left wall */}
      <Window position={[-6.9, 2.8, -3]} />
      <Window position={[-6.9, 2.8, 0]} />

      {/* Soft grounding contact shadow under the furniture — cheap, reads as ambient occlusion */}
      <ContactShadows position={[0, 0.001, -2]} opacity={0.55} scale={14} blur={2.4} far={3.5} color="#000000" />

      {/* Invisible aim point for the window light — keeps the target in the same local space as the group. */}
      <object3D ref={sunTargetRef} position={[1, 0.6, -2]} />
      {/* Late-afternoon light pouring through the windows: a spotlight, not a directional sun, so it
       * naturally falls off with distance — bright near the glass, dim and moody by the back wall. */}
      <spotLight
        ref={sunRef}
        position={[-6.2, 4.6, -1.4]}
        intensity={16}
        distance={11}
        angle={0.6}
        penumbra={0.65}
        decay={2}
        color="#ffe6b8"
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-bias={-0.0004}
        shadow-radius={4}
      />

      <LightBeam position={[0, 9, 1]} rotation={[Math.PI, 0, 0]} length={11} radius={2.6} opacity={0.14} />
      <pointLight position={[0, 4, 2]} intensity={6} color={PALETTE.accent} />
      <pointLight position={[0, 2.6, -4.6]} intensity={1.8} color={PALETTE.secondary} />
      <spotLight position={[0, 8, 4]} intensity={5} angle={0.5} penumbra={0.7} color="#fff4dd" />
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
  const groupRef = useRef<THREE.Group>(null);
  useStationVisibility(groupRef, STATIONS.lab);

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
    <group ref={groupRef} position={[0, -1, STATIONS.lab]}>
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
  const sceneRef = useRef<THREE.Group>(null);
  useStationVisibility(sceneRef, STATIONS.molecule);

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
    <group ref={sceneRef} position={[0, 0, STATIONS.molecule]}>
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
  const sceneRef = useRef<THREE.Group>(null);
  useStationVisibility(sceneRef, STATIONS.horizon, 15);

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
    <group ref={sceneRef} position={[0, 0, STATIONS.horizon]}>
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
      shadows={{ type: THREE.VSMShadowMap }}
      gl={{ antialias: true, powerPreference: "high-performance" }}
      camera={{ fov: 55, near: 0.1, far: 120, position: [0, 1.2, STATIONS.hero] }}
    >
      <color attach="background" args={[PALETTE.fog]} />
      <fogExp2 attach="fog" args={[PALETTE.fog, 0.034]} />
      <ambientLight intensity={0.32} />
      <Environment preset="studio" background={false} environmentIntensity={0.25} />
      <CameraRig />
      <TravelLight />
      <Starfield />
      <ClassroomScene />
      <LabScene />
      <MoleculeScene />
      <HorizonScene />
      <EffectComposer multisampling={0}>
        <Bloom mipmapBlur luminanceThreshold={0.45} luminanceSmoothing={0.3} intensity={0.5} radius={0.75} />
        <Vignette eskil={false} offset={0.22} darkness={0.6} />
        <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
      </EffectComposer>
    </Canvas>
  );
}
