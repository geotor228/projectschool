"use client";

import { useEffect, useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Environment, ContactShadows, Text, MeshReflectorMaterial, RoundedBox, Instances, Instance } from "@react-three/drei";
import { EffectComposer, Bloom, Vignette, ToneMapping } from "@react-three/postprocessing";
import { ToneMappingMode } from "postprocessing";
import * as THREE from "three";
import { journeyState } from "@/lib/journeyState";
import {
  createWoodTexture,
  createParquetTexture,
  createTileFloorTexture,
  createTechPanelTexture,
  createPeriodicTableTexture,
  createLabDiagramTexture,
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
  // Modern European classroom: warm off-white walls, light natural oak, dark grey fittings. The
  // walls were a saturated sage green and the wood a warm orange-oak, which together read as a
  // styled 3D set rather than a room — a real teaching space is a warm neutral shell with the
  // wood and the people supplying the color.
  sageWall: "#e6e1d7",
  sageWallDark: "#d3ccc0",
  sageWallLight: "#f3efe8",
  wainscot: "#cdc6b8",
  // Light oak: warm, but well back from honey or orange. It has to sit a clear couple of stops
  // under the off-white walls — when floor and walls land on the same value the room flattens into
  // one beige mass with no sense of a floor at all.
  oak: "#c3ab86",
  oakDark: "#a68c66",
  oakLight: "#d8c5a4",
  // Furniture is a lighter, pinker beech than the floor oak, so desks read as separate newer timber.
  deskWood: "#cdb590",
  deskWoodDark: "#ab9270",
  deskWoodLight: "#e0cdae",
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

type FadeState = THREE.Material & { __baseOpacity?: number; __baseTransparent?: boolean; __baseDepthWrite?: boolean };

/** Like useStationVisibility, but dissolves the set instead of flipping it off. The camera's path
 * runs straight *through* a room, not up to it: it passes through the classroom's blackboard and
 * the wall behind it on the way to the lab. With a hard visibility flip that means a stretch where
 * an opaque wall is a foot from the lens and fills the entire frame — a flat green screen behind
 * the chapter text. Fading the whole set out over the last couple of units before the camera would
 * reach that wall turns it into the room dissolving behind you as you leave it.
 *
 * Original opacity/transparent/depthWrite are cached per material and restored at full strength,
 * so materials that are deliberately semi-transparent (chalk marks, glow) keep their own look. */
function useStationDissolve(
  ref: React.RefObject<THREE.Group | null>,
  stationZ: number,
  { inAt = 13.5, outAt = 6, fade = 2.5 }: { inAt?: number; outAt?: number; fade?: number } = {},
) {
  useFrame(() => {
    const group = ref.current;
    if (!group) return;
    const cameraZ = THREE.MathUtils.lerp(STATIONS.hero, STATIONS.horizon, journeyState.progress);
    // Positive while the camera is still short of the station, negative once it's past.
    const ahead = cameraZ - stationZ;
    const t =
      ahead >= 0
        ? THREE.MathUtils.clamp((inAt - ahead) / fade, 0, 1)
        : THREE.MathUtils.clamp((outAt + ahead) / fade, 0, 1);

    group.visible = t > 0.01;
    if (!group.visible) return;

    group.traverse((object) => {
      const material = (object as THREE.Mesh).material;
      if (!material) return;
      for (const m of Array.isArray(material) ? material : [material]) {
        const mat = m as FadeState;
        if (mat.__baseOpacity === undefined) {
          mat.__baseOpacity = mat.opacity;
          mat.__baseTransparent = mat.transparent;
          mat.__baseDepthWrite = mat.depthWrite;
        }
        mat.opacity = mat.__baseOpacity * t;
        mat.transparent = t < 1 ? true : mat.__baseTransparent!;
        mat.depthWrite = t < 1 ? false : mat.__baseDepthWrite!;
      }
    });
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
      {/* Cross-brace between the front legs — real desks aren't four unconnected sticks */}
      <mesh position={[0, 0.16, -0.32]} rotation={[0, 0, Math.PI / 2]} material={metalMat}>
        <cylinderGeometry args={[0.018, 0.018, 1.1, 8]} />
      </mesh>

      {/* Chair, offset behind the desk — its own olive plastic-shell material, not the desk's wood.
       * A shallow molded dish for the seat and a gently reclined, two-segment back read as a real
       * stackable classroom chair instead of two flat boards nailed together. */}
      <mesh position={[0, 0.42, 0.62]} scale={[0.62, 0.16, 0.56]} material={chairMat} castShadow>
        <sphereGeometry args={[0.5, 20, 12, 0, Math.PI * 2, 0, Math.PI * 0.5]} />
      </mesh>
      <RoundedBox args={[0.55, 0.42, 0.055]} radius={0.03} smoothness={2} position={[0, 0.62, 0.87]} rotation={[-0.22, 0, 0]} material={chairMat} castShadow />
      <RoundedBox args={[0.5, 0.28, 0.05]} radius={0.03} smoothness={2} position={[0, 0.93, 0.79]} rotation={[-0.36, 0, 0]} material={chairMat} castShadow />
      {[
        [-0.24, 0.2, 0.6],
        [0.24, 0.2, 0.6],
        [-0.22, 0.31, 0.86],
        [0.22, 0.31, 0.86],
      ].map((p, i) => (
        <mesh key={i} position={p as THREE.Vector3Tuple} material={metalMat}>
          <cylinderGeometry args={[0.022, 0.022, i < 2 ? 0.4 : 0.62, 6]} />
        </mesh>
      ))}
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
  useStationDissolve(groupRef, STATIONS.classroom);

  // Shared material + texture instances (created once, reused across every desk/chair mesh)
  // rather than one meshStandardMaterial per box, per the threejs "share material instances" guideline.
  // Warm-neutral shell, light natural wood, dark grey fittings — a real modern teaching room
  // rather than the styled sage-and-honey set this was before.
  const materials = useMemo(() => {
    const deskWood = createWoodTexture({
      base: PALETTE.deskWood,
      dark: PALETTE.deskWoodDark,
      light: PALETTE.deskWoodLight,
      size: 512,
      repeat: [1, 1],
      seed: 3,
    });
    const floorWood = createParquetTexture({
      base: PALETTE.oak,
      dark: PALETTE.oakDark,
      light: PALETTE.oakLight,
      size: 512,
      // Six blocks of three boards per tile, tiled five times across a 14-unit floor: boards land
      // at roughly 15cm wide, the size of real parquet, instead of oversized slabs.
      repeat: [5, 5],
      seed: 11,
    });
    const woodMat = new THREE.MeshStandardMaterial({
      map: deskWood.map,
      roughnessMap: deskWood.roughnessMap,
      normalMap: deskWood.normalMap,
      normalScale: new THREE.Vector2(0.45, 0.45),
      // Desk tops are varnished: low enough roughness to catch a soft sheen off the windows and
      // the ceiling fitting, which is most of what makes a surface read as a real material.
      roughness: 0.38,
      envMapIntensity: 0.25,
    });
    const metalMat = new THREE.MeshStandardMaterial({
      color: "#3a3c3e",
      metalness: 0.55,
      roughness: 0.42,
      envMapIntensity: 0.5,
    });
    // Chairs: bent light-beech ply on the same dark frames, the standard of every modern European
    // classroom — the flat olive plastic was the single most toy-like material in the room.
    const chairMat = new THREE.MeshStandardMaterial({
      map: deskWood.map,
      roughnessMap: deskWood.roughnessMap,
      normalMap: deskWood.normalMap,
      normalScale: new THREE.Vector2(0.35, 0.35),
      color: "#d8bf95",
      roughness: 0.42,
      envMapIntensity: 0.25,
    });
    const floorMat = new THREE.MeshStandardMaterial({
      map: floorWood.map,
      roughnessMap: floorWood.roughnessMap,
      // Kept very weak on purpose: the floor is only ever seen at a raking angle, where a strong
      // per-pixel bump turns every seam into a hard dark crease.
      normalMap: floorWood.normalMap,
      normalScale: new THREE.Vector2(0.06, 0.06),
      // Satin varnish rather than raw timber — this is what gives the soft, wide highlight stretched
      // along the floor under the windows and the ceiling light.
      roughness: 0.42,
      envMapIntensity: 0.35,
    });
    const slateMat = new THREE.MeshStandardMaterial({ map: createSlateTexture(512), roughness: 0.7 });
    // Walls: warm off-white plaster, matte. Not white — there's enough warm grey in it to hold a
    // gradient across the room instead of blowing out flat.
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
      normalScale: new THREE.Vector2(0.28, 0.28),
      roughness: 0.95,
      envMapIntensity: 0.08,
    });
    // The lower metre of a school wall is always a harder, slightly darker finish — scuff-resistant
    // paint or lining. It also stops the room reading as one flat tone floor to ceiling.
    const wainscotMat = new THREE.MeshStandardMaterial({
      map: wallPlaster.map,
      roughnessMap: wallPlaster.roughnessMap,
      normalMap: wallPlaster.normalMap,
      normalScale: new THREE.Vector2(0.22, 0.22),
      color: PALETTE.wainscot,
      roughness: 0.72,
      envMapIntensity: 0.14,
    });
    const ceilingTiles = createAcousticTileTexture(512, 4, "#f0ece4");
    ceilingTiles.repeat.set(3.5, 7.5);
    ceilingTiles.anisotropy = 8;
    const ceilingMat = new THREE.MeshStandardMaterial({ map: ceilingTiles, roughness: 0.95 });
    const trimMat = new THREE.MeshStandardMaterial({ color: "#b9b0a2", roughness: 0.5 });
    return { woodMat, metalMat, chairMat, floorMat, slateMat, wallMat, wainscotMat, ceilingMat, trimMat };
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

      {/* Wainscot: the lower metre of both side walls in the harder, slightly darker finish every
       * school corridor and classroom has, capped with a slim rail. Two tones stacked floor to
       * ceiling is most of what separates a real painted room from one flat extruded color. */}
      <mesh position={[-6.98, 0.62, -2]} rotation={[0, Math.PI / 2, 0]} material={materials.wainscotMat} receiveShadow>
        <planeGeometry args={[30, 0.96]} />
      </mesh>
      {/* The right wall's run is broken either side of the door at z 3.45-4.55: wainscot, rail and
       * skirting all die into a door casing in a real room rather than running across the leaf. */}
      <mesh position={[6.98, 0.62, -6.85]} rotation={[0, -Math.PI / 2, 0]} material={materials.wainscotMat} receiveShadow>
        <planeGeometry args={[20.3, 0.96]} />
      </mesh>
      <mesh position={[6.98, 0.62, 8.85]} rotation={[0, -Math.PI / 2, 0]} material={materials.wainscotMat} receiveShadow>
        <planeGeometry args={[8.3, 0.96]} />
      </mesh>
      <mesh position={[0, 0.62, -6.48]} material={materials.wainscotMat} receiveShadow>
        <planeGeometry args={[13.8, 0.96]} />
      </mesh>
      <mesh position={[-6.95, 1.12, -2]} material={materials.trimMat} castShadow>
        <boxGeometry args={[0.05, 0.05, 30]} />
      </mesh>
      <mesh position={[6.95, 1.12, -6.85]} material={materials.trimMat} castShadow>
        <boxGeometry args={[0.05, 0.05, 20.3]} />
      </mesh>
      <mesh position={[6.95, 1.12, 8.85]} material={materials.trimMat} castShadow>
        <boxGeometry args={[0.05, 0.05, 8.3]} />
      </mesh>
      <mesh position={[0, 1.12, -6.45]} material={materials.trimMat} castShadow>
        <boxGeometry args={[13.8, 0.05, 0.05]} />
      </mesh>

      {/* Baseboard trim along both walls — a small thing, but a wall that just ends flush into
       * the floor with no transition is one of the fastest tells of a CG room. */}
      <mesh position={[-6.95, 0.07, -2]} material={materials.trimMat}>
        <boxGeometry args={[0.06, 0.14, 30]} />
      </mesh>
      <mesh position={[6.95, 0.07, -6.85]} material={materials.trimMat}>
        <boxGeometry args={[0.06, 0.14, 20.3]} />
      </mesh>
      <mesh position={[6.95, 0.07, 8.85]} material={materials.trimMat}>
        <boxGeometry args={[0.06, 0.14, 8.3]} />
      </mesh>
      <mesh position={[0, 0.07, -6.44]} material={materials.trimMat}>
        <boxGeometry args={[13.8, 0.14, 0.06]} />
      </mesh>

      {/* Light switch + outlet — mundane wall hardware nobody designs on purpose but every real
       * room has, and its absence is part of why a bare wall reads as a stage set. Sat proud of the
       * wainscot rather than buried behind it. */}
      <group position={[6.93, 1.4, 2]} rotation={[0, Math.PI / 2, 0]}>
        <mesh>
          <boxGeometry args={[0.09, 0.14, 0.012]} />
          <meshStandardMaterial color="#f2efe6" roughness={0.5} />
        </mesh>
        <mesh position={[0, 0, 0.009]}>
          <boxGeometry args={[0.025, 0.05, 0.01]} />
          <meshStandardMaterial color="#dedacc" roughness={0.4} />
        </mesh>
      </group>
      <group position={[6.93, 0.28, 2.6]} rotation={[0, Math.PI / 2, 0]}>
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

      {/* Back wall behind the blackboard — this was open space before, so everything past the board
       * (and past the cork board and plant beside it) read as a flat black void. Split into two
       * planes only so the band above the board can be lit and shadowed separately from the strip
       * below it; together they close the wall off floor to ceiling. */}
      <mesh position={[0, 4.8, -6.5]} material={materials.wallMat} receiveShadow>
        <planeGeometry args={[13.8, 6.4]} />
      </mesh>
      <mesh position={[0, 0.8, -6.5]} material={materials.wallMat} receiveShadow>
        <planeGeometry args={[13.8, 1.6]} />
      </mesh>

      {/* Potted plants — the biophilic counterweight to the noir gold/wine palette used elsewhere:
       * real green, real life, not just another metal-and-varnish surface. */}
      <PottedPlant position={[-6.35, 0, -3.35]} scale={1.05} />
      <PottedPlant position={[-6.35, 0, -0.35]} scale={0.95} />
      <PottedPlant position={[6.1, 0, -6.2]} scale={1.3} />

      {/* Wall decor: a clock and two botanical posters, mounted on the right side wall instead of
       * flanking the board — that keeps the newly-solid back wall reading as an actual wall, not
       * another surface to pin things to. */}
      <WallClock position={[6.85, 5.0, -1.8]} rotationY={-Math.PI / 2} />
      <Poster position={[6.85, 3.1, -3.4]} rotationY={-Math.PI / 2} label={"PLANTES\nAROMÀTIQUES"} />
      <Poster position={[6.85, 3.1, -0.2]} rotationY={-Math.PI / 2} label={"NATURA · CIÈNCIA\nFUTUR"} />

      {/* Cork board with pinned notes, still on the back wall near the corner — the board isn't the
       * only thing on this wall */}
      <group position={[6.15, 3.0, -5.8]}>
        <mesh castShadow receiveShadow>
          <boxGeometry args={[1.3, 1.6, 0.06]} />
          <meshStandardMaterial color="#c9ab7a" roughness={0.95} />
        </mesh>
        <mesh position={[0, 0, -0.035]}>
          <boxGeometry args={[1.44, 1.74, 0.03]} />
          <meshStandardMaterial color="#4a3a26" roughness={0.6} />
        </mesh>
        {[
          { x: -0.35, y: 0.45, c: "#e8c96a", r: 0.05 },
          { x: 0.3, y: 0.5, c: "#e8ece0", r: -0.1 },
          { x: -0.25, y: -0.15, c: "#c98a7a", r: 0.12 },
          { x: 0.35, y: -0.35, c: "#8fb0a0", r: -0.06 },
        ].map((n, i) => (
          <group key={i} position={[n.x, n.y, 0.035]} rotation={[0, 0, n.r]}>
            <mesh>
              <planeGeometry args={[0.34, 0.26]} />
              <meshStandardMaterial color={n.c} roughness={0.8} />
            </mesh>
            <mesh position={[0, 0.1, 0.002]}>
              <circleGeometry args={[0.012, 10]} />
              <meshStandardMaterial color="#c0392b" roughness={0.4} />
            </mesh>
          </group>
        ))}
      </group>

      {/* Blackboard — sized to leave real wall around it instead of filling the whole back wall */}
      <mesh position={[0, 3.2, -6]} material={materials.slateMat} receiveShadow>
        <planeGeometry args={[7, 3.6]} />
      </mesh>
      <mesh position={[0, 4.15, -5.94]}>
        <planeGeometry args={[5.5, 0.05]} />
        <meshStandardMaterial color={PALETTE.accent} emissive={PALETTE.accent} emissiveIntensity={1.2} />
      </mesh>

      {/* Wooden frame + chalk tray — an unframed slate plane floating on the wall is what read as
       * "flat fill", not the slate texture itself; the frame and tray are what make it a mounted
       * board someone actually uses. */}
      <mesh position={[0, 5.05, -5.95]} material={materials.woodMat} castShadow>
        <boxGeometry args={[7.3, 0.1, 0.08]} />
      </mesh>
      <mesh position={[0, 1.35, -5.95]} material={materials.woodMat} castShadow>
        <boxGeometry args={[7.3, 0.1, 0.08]} />
      </mesh>
      <mesh position={[-3.55, 3.2, -5.95]} material={materials.woodMat} castShadow>
        <boxGeometry args={[0.1, 3.7, 0.08]} />
      </mesh>
      <mesh position={[3.55, 3.2, -5.95]} material={materials.woodMat} castShadow>
        <boxGeometry args={[0.1, 3.7, 0.08]} />
      </mesh>
      <mesh position={[0, 1.27, -5.75]} material={materials.woodMat} castShadow receiveShadow>
        <boxGeometry args={[6.3, 0.06, 0.22]} />
      </mesh>
      <mesh position={[1.6, 1.32, -5.75]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.014, 0.014, 0.18, 8]} />
        <meshStandardMaterial color="#f4f1e8" roughness={0.6} />
      </mesh>
      <mesh position={[1.85, 1.32, -5.72]} rotation={[0, 0.3, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.014, 0.014, 0.16, 8]} />
        <meshStandardMaterial color="#f4f1e8" roughness={0.6} />
      </mesh>
      <mesh position={[-1.7, 1.32, -5.72]} castShadow>
        <boxGeometry args={[0.16, 0.06, 0.09]} />
        <meshStandardMaterial color="#2a2a26" roughness={0.85} />
      </mesh>
      {/* A real lesson written on the board, not a floating logo — title, the molecule of the
       * day, the actual yield formula the TDR uses, and the terpene family it belongs to. */}
      <Text position={[-3.2, 4.65, -5.93]} fontSize={0.4} color="#f4f1e4" anchorX="left" anchorY="middle" letterSpacing={0.02}>
        {"ТЕРПЕНЫ"}
      </Text>

      <mesh position={[-2.6, 3.35, -5.93]} rotation={[0, 0, 0.2]}>
        <ringGeometry args={[0.32, 0.35, 6]} />
        <meshBasicMaterial color="#eef1e8" transparent opacity={0.55} side={THREE.DoubleSide} />
      </mesh>
      <Text position={[-1.85, 3.4, -5.93]} fontSize={0.28} color="#eef1e8" anchorX="left" anchorY="middle">
        {"β-Pineno"}
      </Text>
      <Text position={[-1.85, 2.98, -5.93]} fontSize={0.2} color="#c9d0bf" anchorX="left" anchorY="middle">
        {"C10H16"}
      </Text>

      <Text position={[-3.2, 2.35, -5.93]} fontSize={0.16} color="#eef1e8" anchorX="left" anchorY="middle" maxWidth={6.6}>
        {"Rendiment (%) = m(масла) / m(лепестков) × 100"}
      </Text>
      <Text position={[-3.2, 1.78, -5.93]} fontSize={0.17} color="#b9c7b6" anchorX="left" anchorY="middle" maxWidth={6.6}>
        {"Лимонен · Мирцен · Линалоол · Гераниол"}
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

        {/* Stack of papers + a couple of books — an empty desk reads as a stage prop */}
        <mesh position={[0.6, 0.545, 0.15]} rotation={[0, 0.15, 0]} castShadow>
          <boxGeometry args={[0.22, 0.03, 0.28]} />
          <meshStandardMaterial color="#f4f1e6" roughness={0.7} />
        </mesh>
        <mesh position={[0.62, 0.575, 0.14]} rotation={[0, -0.08, 0]} castShadow>
          <boxGeometry args={[0.19, 0.035, 0.25]} />
          <meshStandardMaterial color="#dfe0d8" roughness={0.7} />
        </mesh>
        <mesh position={[-0.65, 0.555, -0.1]} rotation={[0, -0.1, 0]} castShadow>
          <boxGeometry args={[0.16, 0.045, 0.22]} />
          <meshStandardMaterial color={PALETTE.secondary} roughness={0.6} />
        </mesh>

        {/* Small desk lamp */}
        <group position={[-0.75, 0.54, 0.25]}>
          <mesh castShadow>
            <cylinderGeometry args={[0.06, 0.07, 0.02, 16]} />
            <meshStandardMaterial color="#2a2b26" roughness={0.4} metalness={0.3} />
          </mesh>
          <mesh position={[0, 0.18, 0]} rotation={[0, 0, 0.3]} castShadow>
            <cylinderGeometry args={[0.012, 0.012, 0.36, 8]} />
            <meshStandardMaterial color="#2a2b26" roughness={0.4} metalness={0.3} />
          </mesh>
          <mesh position={[0.1, 0.34, 0]} rotation={[0, 0, 1.1]} castShadow>
            <coneGeometry args={[0.09, 0.13, 16, 1, true]} />
            <meshStandardMaterial color="#2a2b26" roughness={0.4} metalness={0.3} side={THREE.DoubleSide} />
          </mesh>
          <pointLight position={[0.16, 0.3, 0]} intensity={1.5} distance={1.5} color="#ffdfa8" />
        </group>

        {/* Teacher's chair, tucked in on the board side of the desk facing the class */}
        <group position={[0, 0, -0.75]}>
          <mesh position={[0, 0.44, 0]} scale={[0.6, 0.15, 0.55]} material={materials.chairMat} castShadow>
            <sphereGeometry args={[0.5, 20, 12, 0, Math.PI * 2, 0, Math.PI * 0.5]} />
          </mesh>
          <RoundedBox args={[0.52, 0.5, 0.055]} radius={0.03} smoothness={2} position={[0, 0.68, -0.24]} rotation={[0.22, 0, 0]} material={materials.chairMat} castShadow />
          {[
            [-0.22, 0.22, 0.18],
            [0.22, 0.22, 0.18],
            [-0.2, 0.34, -0.2],
            [0.2, 0.34, -0.2],
          ].map((p, i) => (
            <mesh key={i} position={p as THREE.Vector3Tuple} material={materials.metalMat}>
              <cylinderGeometry args={[0.022, 0.022, i < 2 ? 0.44 : 0.68, 6]} />
            </mesh>
          ))}
        </group>
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

      {/* The room's entrance — every real classroom has one; this one had none */}
      <LabDoor position={[6.95, 1.25, 4]} rotationY={-Math.PI / 2} />

      {/* A little lived-in clutter — a notebook and pencil on a couple of desks, a backpack
       * leaning against a chair — an otherwise-empty room reads as a showroom, not a classroom. */}
      <group position={[desks[2]?.x ?? 1.3, 0.785, desks[2]?.z ?? 0.7]} rotation={[0, 0.2, 0]}>
        <mesh castShadow>
          <boxGeometry args={[0.22, 0.015, 0.28]} />
          <meshStandardMaterial color="#eef0e6" roughness={0.75} />
        </mesh>
        <mesh position={[0.16, 0.012, -0.08]} rotation={[0, 0.9, Math.PI / 2 - 0.15]}>
          <cylinderGeometry args={[0.007, 0.007, 0.19, 8]} />
          <meshStandardMaterial color={PALETTE.primary} roughness={0.5} />
        </mesh>
      </group>
      <group position={[(desks[0]?.x ?? -1.3) - 0.35, 0, (desks[0]?.z ?? -1.5) + 0.62]} rotation={[0, 0.3, 0]}>
        <RoundedBox args={[0.26, 0.32, 0.14]} radius={0.05} smoothness={2} position={[0, 0.16, 0]} castShadow>
          <meshStandardMaterial color={PALETTE.secondary} roughness={0.75} />
        </RoundedBox>
        <mesh position={[0, 0.32, -0.02]} rotation={[0.3, 0, 0]}>
          <torusGeometry args={[0.07, 0.012, 8, 16, Math.PI]} />
          <meshStandardMaterial color="#2a2a26" roughness={0.6} />
        </mesh>
      </group>

      {/* Soft grounding contact shadow under the furniture. Higher resolution and a wider blur than
       * before, and warm-grey rather than pure black: a real shadow on a pale wood floor is a warm
       * desaturated grey, and black contact shadows are a large part of why a light floor reads as
       * a render. This is what puts the desks and chairs on the floor instead of hovering over it. */}
      <ContactShadows
        position={[0, 0.002, -2]}
        opacity={0.58}
        scale={16}
        blur={3}
        far={4}
        resolution={1024}
        color="#4a4034"
      />

      {/* Daylight bounce: cool sky from above, warm wood bounce from the floor. The upward tone was
       * the old orange oak, which tinted the whole room amber from below. */}
      <hemisphereLight args={["#eaf0f6", PALETTE.oakDark, 0.55]} />

      {/* Invisible aim point for the window light — keeps the target in the same local space as the group. */}
      <object3D ref={sunTargetRef} position={[1, 0.6, -2]} />
      {/* Daylight through the windows: wide and soft rather than a narrow dramatic shaft, so it
       * reads as "sunlit room" instead of "single spotlight in the dark." */}
      <spotLight
        ref={sunRef}
        position={[-6.2, 4.6, -1.4]}
        intensity={30}
        distance={18}
        angle={0.9}
        penumbra={0.95}
        decay={1.5}
        // Daylight, not tungsten: the old #fff6e2 was warm enough to push the new off-white walls
        // back towards cream. Near-neutral with the faintest warm cast keeps them reading as paint.
        color="#fdfaf4"
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-bias={-0.0004}
        shadow-radius={6}
      />

      {/* Interior fill, deliberately modest: with the hemisphere bounce and the window spot already
       * lighting the room, more fill here just flattens it — the shading on the desks and the
       * falloff toward the corners is what stops it looking like a flat-lit render. */}
      <pointLight position={[0, 4, 2]} intensity={3.2} color="#fff4de" />
      <pointLight position={[0, 3, -5]} intensity={2.6} color="#fff4de" />
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

/** A wall-mounted poster printed from a canvas texture — periodic table, process chart, structure
 * sheet. Height follows the artwork's own aspect so nothing is stretched, and it sits in a thin
 * aluminium frame the way a real chart on a lab wall does. */
function ChartPoster({
  position,
  rotationY = 0,
  texture,
  aspect,
  width = 2,
}: {
  position: THREE.Vector3Tuple;
  rotationY?: number;
  texture: THREE.Texture;
  aspect: number;
  width?: number;
}) {
  const height = width / aspect;
  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      <mesh castShadow receiveShadow>
        <planeGeometry args={[width, height]} />
        <meshStandardMaterial map={texture} roughness={0.85} envMapIntensity={0.08} />
      </mesh>
      <mesh position={[0, 0, -0.012]}>
        <boxGeometry args={[width + 0.06, height + 0.06, 0.02]} />
        <meshStandardMaterial color="#aeb3b7" metalness={0.5} roughness={0.4} />
      </mesh>
    </group>
  );
}

/** Fume hood: the single most recognisable object in a chemistry lab. Glazed sash raised about
 * halfway on a white cabinet body, interior lit, with a stainless spoil tray and a duct running up
 * into the ceiling. */
function FumeHood({ position, rotationY = 0 }: { position: THREE.Vector3Tuple; rotationY?: number }) {
  const body = useMemo(() => new THREE.MeshStandardMaterial({ color: "#eceef0", roughness: 0.5, envMapIntensity: 0.3 }), []);
  const steel = useMemo(
    () => new THREE.MeshStandardMaterial({ color: "#b7bcc0", metalness: 0.7, roughness: 0.3, envMapIntensity: 0.6 }),
    [],
  );
  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      {/* Lower cabinet */}
      <mesh position={[0, 0.42, 0]} material={body} castShadow receiveShadow>
        <boxGeometry args={[2.4, 0.84, 0.9]} />
      </mesh>
      <mesh position={[0, 0.86, 0]} material={steel} castShadow>
        <boxGeometry args={[2.44, 0.06, 0.94]} />
      </mesh>
      {/* Hood shell */}
      <mesh position={[0, 1.72, -0.1]} material={body} castShadow receiveShadow>
        <boxGeometry args={[2.4, 1.66, 0.7]} />
      </mesh>
      {/* Recessed working chamber, lit from inside */}
      <mesh position={[0, 1.55, 0.28]}>
        <boxGeometry args={[2.16, 1.2, 0.12]} />
        <meshStandardMaterial color="#e4e8ea" roughness={0.6} />
      </mesh>
      <pointLight position={[0, 1.95, 0.2]} intensity={2.4} distance={2.6} decay={2} color="#eaf2f6" />
      {/* Sash glass, raised halfway, with its handle rail */}
      <mesh position={[0, 1.98, 0.36]}>
        <planeGeometry args={[2.16, 0.78]} />
        <meshPhysicalMaterial color="#dfeaef" transmission={0.82} roughness={0.06} thickness={0.05} ior={1.5} />
      </mesh>
      <mesh position={[0, 1.57, 0.37]} material={steel} castShadow>
        <boxGeometry args={[2.2, 0.05, 0.05]} />
      </mesh>
      {/* Duct up to the ceiling */}
      <mesh position={[0, 3.1, -0.1]} material={steel}>
        <cylinderGeometry args={[0.19, 0.19, 1.1, 16]} />
      </mesh>
      {/* Control panel */}
      <mesh position={[0.94, 1.05, 0.36]}>
        <planeGeometry args={[0.34, 0.18]} />
        <meshStandardMaterial color="#2c3238" roughness={0.4} />
      </mesh>
      <mesh position={[0.86, 1.05, 0.371]}>
        <circleGeometry args={[0.022, 12]} />
        <meshStandardMaterial color="#6fdca0" emissive="#6fdca0" emissiveIntensity={1.4} />
      </mesh>
    </group>
  );
}

/** Sink run: a stainless basin let into a white worktop, with a tall swan-neck lab tap and an
 * eyewash station beside it. */
function LabSink({ position, rotationY = 0 }: { position: THREE.Vector3Tuple; rotationY?: number }) {
  const steel = useMemo(
    () => new THREE.MeshStandardMaterial({ color: "#c0c5c9", metalness: 0.78, roughness: 0.24, envMapIntensity: 0.7 }),
    [],
  );
  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      <mesh position={[0, 0.42, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.7, 0.84, 0.72]} />
        <meshStandardMaterial color="#e7eaec" roughness={0.5} />
      </mesh>
      <mesh position={[0, 0.87, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.76, 0.06, 0.78]} />
        <meshStandardMaterial color="#dfe3e5" roughness={0.35} envMapIntensity={0.4} />
      </mesh>
      {/* Basin recess */}
      <mesh position={[0, 0.84, 0.02]} material={steel}>
        <boxGeometry args={[0.62, 0.06, 0.46]} />
      </mesh>
      <mesh position={[0, 0.78, 0.02]}>
        <boxGeometry args={[0.56, 0.14, 0.4]} />
        <meshStandardMaterial color="#9aa1a6" metalness={0.7} roughness={0.35} />
      </mesh>
      {/* Swan-neck tap */}
      <mesh position={[0, 1.02, -0.22]} material={steel}>
        <cylinderGeometry args={[0.022, 0.022, 0.34, 12]} />
      </mesh>
      <mesh position={[0, 1.19, -0.12]} rotation={[Math.PI / 2, 0, 0]} material={steel}>
        <torusGeometry args={[0.1, 0.022, 8, 16, Math.PI]} />
      </mesh>
      {/* Eyewash */}
      <mesh position={[0.62, 1.0, -0.18]} material={steel}>
        <cylinderGeometry args={[0.018, 0.018, 0.3, 10]} />
      </mesh>
      <mesh position={[0.62, 1.16, -0.1]} rotation={[0.5, 0, 0]}>
        <coneGeometry args={[0.05, 0.08, 12]} />
        <meshStandardMaterial color="#3f9d63" roughness={0.5} />
      </mesh>
    </group>
  );
}

/** Open glassware rack: a light steel frame of shelves holding beakers, flasks and measuring
 * cylinders — the background clutter that makes a lab read as a working room. */
function GlasswareRack({ position, rotationY = 0 }: { position: THREE.Vector3Tuple; rotationY?: number }) {
  const frame = useMemo(
    () => new THREE.MeshStandardMaterial({ color: "#b0b5b9", metalness: 0.55, roughness: 0.4, envMapIntensity: 0.5 }),
    [],
  );
  const glass = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        color: "#e6eef0",
        transmission: 0.88,
        roughness: 0.08,
        thickness: 0.1,
        ior: 1.5,
      }),
    [],
  );
  const shelves = [0.5, 1.05, 1.6, 2.15];
  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      {shelves.map((y, i) => (
        <mesh key={i} position={[0, y, 0]} material={frame} castShadow receiveShadow>
          <boxGeometry args={[2, 0.04, 0.44]} />
        </mesh>
      ))}
      {[-0.96, 0.96].map((x, i) => (
        <mesh key={i} position={[x, 1.32, 0]} material={frame}>
          <boxGeometry args={[0.05, 1.75, 0.05]} />
        </mesh>
      ))}
      {shelves.slice(0, 3).map((y, s) =>
        Array.from({ length: 5 }, (_, i) => {
          const x = -0.75 + i * 0.375;
          const kind = (s + i) % 3;
          const h = kind === 0 ? 0.22 : kind === 1 ? 0.3 : 0.16;
          const r = kind === 2 ? 0.06 : 0.075;
          return (
            <mesh key={`${s}-${i}`} position={[x, y + 0.02 + h / 2, 0]} material={glass} castShadow>
              <cylinderGeometry args={[r, r * (kind === 1 ? 0.8 : 1), h, 16, 1, true]} />
            </mesh>
          );
        }),
      )}
    </group>
  );
}

/** Wall-mounted fire extinguisher on its bracket — mandatory in any real lab, and one of those
 * mundane objects whose absence quietly reads as "this room is a set". */
function FireExtinguisher({ position, rotationY = 0 }: { position: THREE.Vector3Tuple; rotationY?: number }) {
  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      <mesh castShadow>
        <cylinderGeometry args={[0.1, 0.1, 0.52, 18]} />
        <meshStandardMaterial color="#b02b22" roughness={0.42} metalness={0.25} />
      </mesh>
      <mesh position={[0, 0.3, 0]}>
        <cylinderGeometry args={[0.045, 0.075, 0.1, 14]} />
        <meshStandardMaterial color="#8e2019" roughness={0.45} />
      </mesh>
      <mesh position={[0, 0.38, 0]}>
        <cylinderGeometry args={[0.022, 0.022, 0.08, 10]} />
        <meshStandardMaterial color="#2f3438" metalness={0.6} roughness={0.4} />
      </mesh>
      <mesh position={[0, 0.42, 0.03]} rotation={[0.4, 0, 0]}>
        <boxGeometry args={[0.16, 0.02, 0.05]} />
        <meshStandardMaterial color="#2f3438" metalness={0.6} roughness={0.4} />
      </mesh>
      <mesh position={[0, 0.02, -0.11]}>
        <boxGeometry args={[0.1, 0.3, 0.03]} />
        <meshStandardMaterial color="#9aa0a4" metalness={0.5} roughness={0.45} />
      </mesh>
      <mesh position={[0, -0.06, 0.101]}>
        <planeGeometry args={[0.1, 0.14]} />
        <meshStandardMaterial color="#f2f2ee" roughness={0.7} />
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
  // The lab now has a back wall at z -41, and the camera's path runs straight through it on the way
  // to the molecule scene — so this dissolves out like the classroom rather than flipping off. It
  // also has to fade *in* early (16 units out): the classroom is gone by z -20, so the lab has to
  // be on screen before that or there's a bare stretch between the two.
  useStationDissolve(groupRef, STATIONS.lab, { inAt: 16, outAt: 6.5, fade: 2.5 });

  const flaskRef = useRef<THREE.Mesh>(null);
  useFrame((state) => {
    if (flaskRef.current && !prefersReducedMotion) {
      flaskRef.current.rotation.y = state.clock.elapsedTime * 0.3;
    }
  });

  // A real teaching lab, not a moody set: white matte walls, white glazed tile underfoot, light
  // worktops on steel. The room used to be near-black with dramatic gold and wine accents, which
  // read as a jewellery advert rather than the room where the experiment actually happens.
  const materials = useMemo(() => {
    const wallPlaster = createPlasterTexture({
      base: "#f2f3f2",
      dark: "#e2e4e3",
      light: "#fbfbfa",
      size: 512,
      repeat: [2, 2],
      seed: 41,
    });
    const wallMat = new THREE.MeshStandardMaterial({
      map: wallPlaster.map,
      roughnessMap: wallPlaster.roughnessMap,
      normalMap: wallPlaster.normalMap,
      normalScale: new THREE.Vector2(0.18, 0.18),
      // Matte emulsion: high roughness and almost no environment response, so a white wall stays
      // white instead of turning into a glare panel under the bench lights.
      roughness: 0.96,
      envMapIntensity: 0.05,
    });
    const tile = createTileFloorTexture({ size: 1024, tiles: 4, repeat: [5, 11], seed: 7 });
    const floorMat = new THREE.MeshStandardMaterial({
      map: tile.map,
      roughnessMap: tile.roughnessMap,
      normalMap: tile.normalMap,
      normalScale: new THREE.Vector2(0.05, 0.05),
      // Glazed, so there is a soft sheen and a hint of the room in it, but nowhere near a mirror.
      roughness: 0.28,
      metalness: 0.02,
      envMapIntensity: 0.45,
    });
    const counterMat = new THREE.MeshStandardMaterial({
      color: "#e3e6e8",
      metalness: 0.1,
      roughness: 0.34,
      envMapIntensity: 0.4,
    });
    const cabinetMat = new THREE.MeshStandardMaterial({ color: "#e9ebec", roughness: 0.52, envMapIntensity: 0.25 });
    const frameMat = new THREE.MeshStandardMaterial({
      color: "#8d9296",
      metalness: 0.7,
      roughness: 0.32,
      envMapIntensity: 0.6,
    });
    const ceilingTiles = createAcousticTileTexture(512, 5, "#f4f4f1");
    ceilingTiles.repeat.set(2.5, 6);
    ceilingTiles.anisotropy = 8;
    const ceilingMat = new THREE.MeshStandardMaterial({ map: ceilingTiles, roughness: 0.95 });
    return { wallMat, floorMat, counterMat, cabinetMat, frameMat, ceilingMat };
  }, []);

  // Wall charts, drawn once to canvas: the periodic table plus the three schematics this project
  // actually needs — the Clevenger rig, the hydrodistillation process, and the terpene structures.
  const charts = useMemo(
    () => ({
      periodic: createPeriodicTableTexture(1600),
      clevenger: createLabDiagramTexture("clevenger", 640),
      distillation: createLabDiagramTexture("distillation", 640),
      molecules: createLabDiagramTexture("molecules", 640),
    }),
    [],
  );

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
      {/* Floor + wall shell. Tile underfoot, matte white walls, and — new — a real back wall, so
       * the room ends in something instead of fading into fog behind the apparatus. */}
      <mesh position={[0, -0.82, 0]} rotation={[-Math.PI / 2, 0, 0]} material={materials.floorMat} receiveShadow>
        <planeGeometry args={[11, 26]} />
      </mesh>
      <mesh position={[-5, 3, 0]} rotation={[0, Math.PI / 2, 0]} material={materials.wallMat} receiveShadow>
        <planeGeometry args={[26, 8]} />
      </mesh>
      <mesh position={[5, 3, 0]} rotation={[0, -Math.PI / 2, 0]} material={materials.wallMat} receiveShadow>
        <planeGeometry args={[26, 8]} />
      </mesh>
      {/* Set well back at z -10. The room dissolves out by z -40.5 in world terms, and at anything
       * closer than about 3.5 units a 5-metre chart simply fills the frame — the camera ended up
       * nose-to-nose with the periodic table while the lab chapter was still being read. */}
      <mesh position={[0, 1.79, -10]} material={materials.wallMat} receiveShadow>
        <planeGeometry args={[11, 5.22]} />
      </mesh>
      <mesh position={[0, 4.4, 0]} rotation={[Math.PI / 2, 0, 0]} material={materials.ceilingMat} receiveShadow>
        <planeGeometry args={[11, 26]} />
      </mesh>
      {/* Skirting where the tile meets the wall — a coved edge, as in any wet-work room */}
      <mesh position={[0, -0.75, -9.96]} material={materials.frameMat}>
        <boxGeometry args={[11, 0.14, 0.05]} />
      </mesh>
      {/* Ceiling vent grille — a small mundane detail, recessed and darker than the tiles around it */}
      <mesh position={[2, 4.38, -4]} rotation={[Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.9, 0.5]} />
        <meshStandardMaterial color="#b9bdbf" roughness={0.6} metalness={0.3} />
      </mesh>

      {/* Back wall charts: the periodic table as the centrepiece, with the three schematics this
       * project runs on ranged beside it. */}
      <ChartPoster
        position={[-0.6, 2.35, -9.93]}
        texture={charts.periodic.map}
        aspect={charts.periodic.aspect}
        width={5.2}
      />
      <ChartPoster
        position={[3.3, 2.75, -9.93]}
        texture={charts.clevenger.map}
        aspect={charts.clevenger.aspect}
        width={1.5}
      />
      <ChartPoster
        position={[3.3, 1.2, -9.93]}
        texture={charts.distillation.map}
        aspect={charts.distillation.aspect}
        width={1.5}
      />
      <ChartPoster
        position={[-3.85, 1.45, -9.93]}
        texture={charts.molecules.map}
        aspect={charts.molecules.aspect}
        width={1.4}
      />

      {/* Raised worktop on a cabinet base — light laminate on steel rather than the old dark slab */}
      <mesh position={[0, BENCH_Y - 0.04, 0.7]} material={materials.counterMat} castShadow receiveShadow>
        <boxGeometry args={[7.6, 0.08, 2.4]} />
      </mesh>
      <mesh position={[0, -0.525, 0.7]} material={materials.cabinetMat} receiveShadow>
        <boxGeometry args={[7.4, 0.59, 2.2]} />
      </mesh>
      {/* Steel frame and toe kick under the worktop, so the bench reads as lab furniture on legs */}
      <mesh position={[0, -0.79, 0.7]} material={materials.frameMat}>
        <boxGeometry args={[7.2, 0.06, 2]} />
      </mesh>
      {[-3.5, 3.5].map((x, i) => (
        <mesh key={i} position={[x, -0.5, 0.7]} material={materials.frameMat}>
          <boxGeometry args={[0.07, 0.64, 2.2]} />
        </mesh>
      ))}
      {/* Cabinet doors + handles */}
      {[-2.6, -0.9, 0.9, 2.6].map((x, i) => (
        <group key={i} position={[x, -0.5, 1.81]}>
          <mesh receiveShadow>
            <boxGeometry args={[1.5, 0.5, 0.03]} />
            <meshStandardMaterial color="#f1f3f4" roughness={0.45} />
          </mesh>
          <mesh position={[0, 0.16, 0.03]} material={materials.frameMat}>
            <boxGeometry args={[0.5, 0.025, 0.025]} />
          </mesh>
        </group>
      ))}

      <FumeHood position={[-3.5, -0.82, -8.6]} />
      <LabSink position={[1.9, -0.82, -9.2]} />
      <GlasswareRack position={[-4.72, -0.82, 1.6]} rotationY={Math.PI / 2} />
      <FireExtinguisher position={[4.82, 0.75, 5.1]} rotationY={-Math.PI / 2} />
      <WallCabinet position={[-4.83, 1.6, -2.6]} rotationY={Math.PI / 2} />
      <LabWindow position={[4.85, 1.9, -3.4]} rotationY={-Math.PI / 2} />
      <PottedPlant position={[4.3, -0.82, -5.2]} scale={1.1} />
      <LabDoor position={[4.92, 0.44, 6.6]} rotationY={-Math.PI / 2} />
      <ChartPoster
        position={[4.83, 2.1, 1.6]}
        rotationY={-Math.PI / 2}
        texture={charts.molecules.map}
        aspect={charts.molecules.aspect}
        width={1.3}
      />
      <Poster position={[4.83, 2.1, 4]} rotationY={-Math.PI / 2} label={"NATURAL SCIENCE\nBETTER FUTURE"} />
      <PendantLight position={[0, 2.9, 0.7]} width={4} dropFrom={1.4} />
      <PendantLight position={[0, 2.9, -4.2]} width={4} dropFrom={1.4} />
      <BarStool position={[0, -0.82, 2.6]} />

      {/* Room lighting for a white room: broad, soft and even. Sky-toned bounce from above and a
       * cool grey bounce off the tile below, then two gentle fills under the pendant fittings —
       * enough to light the walls without pushing them to pure white. */}
      <hemisphereLight args={["#f4f8fa", "#b8bcbe", 0.5]} />
      <pointLight position={[0, 3.2, 0.7]} intensity={5.5} distance={13} decay={1.8} color="#f7fbfd" />
      <pointLight position={[0, 3.2, -4.2]} intensity={4.5} distance={12} decay={1.8} color="#f7fbfd" />
      <pointLight position={[0, 1.6, 5.5]} intensity={2.5} distance={10} decay={1.9} color="#eef3f6" />

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

      {/* Accent on the apparatus itself: a soft, near-neutral spot from the ceiling, aimed down at
       * the bench. The old lighting here was a gold volumetric shaft plus gold and wine point
       * lights — the perfume-advert look, which against white walls and white tile just stained
       * the whole room amber. The equipment's own sources (the mantle's orange, the ultrasonic
       * bath's cyan) are what carry colour now, and they read far better against neutral surfaces. */}
      <spotLight
        position={[0.4, 3.6, 1.4]}
        target-position={[0, 0, 0]}
        intensity={14}
        distance={8}
        angle={0.75}
        penumbra={0.9}
        decay={1.8}
        color="#fdfdfb"
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-bias={-0.0005}
        shadow-radius={4}
      />
      <pointLight position={[1.6, 1.2, 1.6]} intensity={3.4} distance={4.5} decay={2} color="#eef4f6" />
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

/** Indicator LEDs, drawn as one instanced draw call. There are well over a hundred of these across
 * the racks and consoles; as individual meshes they'd be the single biggest draw-call cost in the
 * scene, and they're all the same sphere. */
function IndicatorLights({
  points,
  color,
  radius = 0.018,
}: {
  points: THREE.Vector3Tuple[];
  color: string;
  radius?: number;
}) {
  return (
    <Instances limit={points.length} range={points.length}>
      <sphereGeometry args={[radius, 6, 6]} />
      <meshStandardMaterial color={color} emissive={color} emissiveIntensity={2.2} roughness={0.4} />
      {points.map((p, i) => (
        <Instance key={i} position={p} />
      ))}
    </Instances>
  );
}

/** A server / instrument rack: dark chassis, vented blanking panels, and a column of status LEDs. */
function ServerRack({ position, rotationY = 0, height = 2.2 }: { position: THREE.Vector3Tuple; rotationY?: number; height?: number }) {
  const shell = useMemo(
    () => new THREE.MeshStandardMaterial({ color: "#2b3138", metalness: 0.6, roughness: 0.38, envMapIntensity: 0.7 }),
    [],
  );
  const units = Math.max(4, Math.round(height / 0.28));
  const leds = useMemo(() => {
    const pts: THREE.Vector3Tuple[] = [];
    for (let u = 0; u < units; u++) {
      if (seededJitter(u, 91) > 0.55) continue;
      for (let k = 0; k < 3; k++) pts.push([-0.24 + k * 0.06, 0.16 + u * 0.28, 0.221]);
    }
    return pts;
  }, [units]);

  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      <mesh material={shell} castShadow receiveShadow position={[0, height / 2, 0]}>
        <boxGeometry args={[0.78, height, 0.44]} />
      </mesh>
      {Array.from({ length: units }, (_, u) => (
        <mesh key={u} position={[0, 0.16 + u * 0.28, 0.225]}>
          <planeGeometry args={[0.7, 0.2]} />
          <meshStandardMaterial color={u % 3 === 0 ? "#1b2026" : "#343b43"} metalness={0.5} roughness={0.45} />
        </mesh>
      ))}
      <IndicatorLights points={leds} color="#5fe0a8" />
      <mesh position={[0, height + 0.03, 0]} material={shell}>
        <boxGeometry args={[0.84, 0.06, 0.5]} />
      </mesh>
    </group>
  );
}

/** Benchtop centrifuge: drum body, a smoked domed lid and a small readout. */
function Centrifuge({ position, rotationY = 0 }: { position: THREE.Vector3Tuple; rotationY?: number }) {
  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      <mesh castShadow receiveShadow position={[0, 0.17, 0]}>
        <cylinderGeometry args={[0.32, 0.35, 0.34, 20]} />
        <meshStandardMaterial color="#e9edef" metalness={0.25} roughness={0.35} envMapIntensity={0.6} />
      </mesh>
      <mesh position={[0, 0.36, 0]}>
        <sphereGeometry args={[0.31, 20, 10, 0, Math.PI * 2, 0, Math.PI * 0.5]} />
        <meshPhysicalMaterial color="#8fa3ad" transmission={0.6} roughness={0.12} thickness={0.1} ior={1.4} />
      </mesh>
      <mesh position={[0, 0.2, 0.34]} rotation={[0.35, 0, 0]}>
        <planeGeometry args={[0.26, 0.12]} />
        <meshStandardMaterial color="#0d1b22" emissive="#3fd0e8" emissiveIntensity={0.8} roughness={0.3} />
      </mesh>
    </group>
  );
}

/** A six-axis handling arm parked over a bench — the piece of kit that reads "automated lab"
 * fastest, even completely still. */
function RoboticArm({ position, rotationY = 0, scale = 1 }: { position: THREE.Vector3Tuple; rotationY?: number; scale?: number }) {
  const shell = useMemo(
    () => new THREE.MeshStandardMaterial({ color: "#eceef0", metalness: 0.35, roughness: 0.3, envMapIntensity: 0.8 }),
    [],
  );
  const joint = useMemo(
    () => new THREE.MeshStandardMaterial({ color: "#2f363d", metalness: 0.7, roughness: 0.3, envMapIntensity: 0.8 }),
    [],
  );
  return (
    <group position={position} rotation={[0, rotationY, 0]} scale={scale}>
      <mesh material={joint} castShadow position={[0, 0.05, 0]}>
        <cylinderGeometry args={[0.22, 0.26, 0.1, 18]} />
      </mesh>
      <mesh material={shell} castShadow position={[0, 0.28, 0]}>
        <cylinderGeometry args={[0.15, 0.18, 0.36, 16]} />
      </mesh>
      <group position={[0, 0.46, 0]} rotation={[0, 0, -0.5]}>
        <mesh material={shell} castShadow position={[0, 0.34, 0]}>
          <boxGeometry args={[0.16, 0.7, 0.18]} />
        </mesh>
        <mesh material={joint} castShadow position={[0, 0.7, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.1, 0.1, 0.2, 14]} />
        </mesh>
        <group position={[0, 0.7, 0]} rotation={[0, 0, 1.15]}>
          <mesh material={shell} castShadow position={[0, 0.3, 0]}>
            <boxGeometry args={[0.13, 0.62, 0.15]} />
          </mesh>
          <mesh material={joint} castShadow position={[0, 0.63, 0]}>
            <boxGeometry args={[0.1, 0.12, 0.12]} />
          </mesh>
          {[-0.05, 0.05].map((x, i) => (
            <mesh key={i} material={joint} castShadow position={[x, 0.73, 0]}>
              <boxGeometry args={[0.025, 0.14, 0.04]} />
            </mesh>
          ))}
        </group>
      </group>
    </group>
  );
}

/** An angled control desk: dark glass top, a lit readout strip and a field of small buttons. */
function ControlConsole({ position, rotationY = 0, width = 1.6 }: { position: THREE.Vector3Tuple; rotationY?: number; width?: number }) {
  const buttons = useMemo(() => {
    const pts: THREE.Vector3Tuple[] = [];
    const cols = Math.round(width / 0.13);
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < cols; c++) {
        if (seededJitter(r * cols + c, 77) > 0.72) continue;
        pts.push([-width / 2 + 0.09 + c * 0.13, 0.02 + r * 0.06, 0.03 - r * 0.05]);
      }
    }
    return pts;
  }, [width]);

  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      <mesh castShadow receiveShadow position={[0, 0.42, 0]}>
        <boxGeometry args={[width, 0.84, 0.6]} />
        <meshStandardMaterial color="#dfe3e6" metalness={0.2} roughness={0.42} envMapIntensity={0.5} />
      </mesh>
      <mesh position={[0, 0.87, 0.02]} rotation={[-0.42, 0, 0]} castShadow>
        <boxGeometry args={[width, 0.42, 0.05]} />
        <meshStandardMaterial color="#232a31" metalness={0.5} roughness={0.28} envMapIntensity={0.7} />
      </mesh>
      <group position={[0, 0.88, 0.03]} rotation={[-0.42, 0, 0]}>
        <mesh position={[0, 0.12, 0.03]}>
          <planeGeometry args={[width - 0.12, 0.12]} />
          <meshStandardMaterial color="#0a1a22" emissive="#3fd0e8" emissiveIntensity={0.9} roughness={0.3} />
        </mesh>
        <IndicatorLights points={buttons} color="#ffb469" radius={0.016} />
      </group>
    </group>
  );
}

/** A glass-fronted cabinet of racked test tubes — repeated glass tubes drawn as one instanced call. */
function TubeCabinet({ position, rotationY = 0 }: { position: THREE.Vector3Tuple; rotationY?: number }) {
  const tubes = useMemo(() => {
    const pts: THREE.Vector3Tuple[] = [];
    for (let s = 0; s < 3; s++) {
      for (let i = 0; i < 12; i++) {
        pts.push([-0.62 + i * 0.113, 0.62 + s * 0.5, 0]);
      }
    }
    return pts;
  }, []);

  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      <mesh castShadow receiveShadow position={[0, 1.05, 0]}>
        <boxGeometry args={[1.5, 2.1, 0.42]} />
        <meshStandardMaterial color="#e4e8ea" metalness={0.25} roughness={0.4} envMapIntensity={0.5} />
      </mesh>
      {/* Glazed front */}
      <mesh position={[0, 1.15, 0.215]}>
        <planeGeometry args={[1.34, 1.72]} />
        <meshPhysicalMaterial color="#dceaf0" transmission={0.85} roughness={0.06} thickness={0.04} ior={1.5} />
      </mesh>
      {[0.55, 1.05, 1.55].map((y, i) => (
        <mesh key={i} position={[0, y, 0.02]}>
          <boxGeometry args={[1.34, 0.03, 0.34]} />
          <meshStandardMaterial color="#c3c9cd" metalness={0.4} roughness={0.4} />
        </mesh>
      ))}
      <Instances limit={tubes.length} range={tubes.length}>
        <cylinderGeometry args={[0.03, 0.03, 0.22, 8]} />
        <meshStandardMaterial color="#9fe0d6" emissive="#3fb9a8" emissiveIntensity={0.35} roughness={0.25} metalness={0.1} />
        {tubes.map((p, i) => (
          <Instance key={i} position={p} />
        ))}
      </Instances>
    </group>
  );
}

/** The plinth the hero molecule sits above: a lit ring, a soft column of light and a caption band —
 * it turns the free-floating model into a deliberate exhibit rather than an object hanging in a room. */
function HoloPlinth({ position, radius = 1.15 }: { position: THREE.Vector3Tuple; radius?: number }) {
  return (
    <group position={position}>
      <mesh castShadow receiveShadow position={[0, 0.3, 0]}>
        <cylinderGeometry args={[radius, radius * 1.08, 0.6, 32]} />
        <meshStandardMaterial color="#e7eaec" metalness={0.3} roughness={0.3} envMapIntensity={0.8} />
      </mesh>
      <mesh position={[0, 0.62, 0]}>
        <cylinderGeometry args={[radius * 0.94, radius * 0.94, 0.05, 32]} />
        <meshStandardMaterial color="#0d1b22" emissive="#4fd8ee" emissiveIntensity={1.6} roughness={0.3} />
      </mesh>
      {/* Column of light rising off the plinth, additive so it reads as a projection, not a solid */}
      <mesh position={[0, 2.1, 0]}>
        <cylinderGeometry args={[radius * 0.8, radius * 0.92, 3, 24, 1, true]} />
        <meshBasicMaterial
          color="#63d9f2"
          transparent
          opacity={0.07}
          side={THREE.DoubleSide}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
      <pointLight position={[0, 1.1, 0]} intensity={4} distance={5} decay={2} color="#5fd2ec" />
    </group>
  );
}

function MoleculeScene() {
  const sceneRef = useRef<THREE.Group>(null);
  // Dissolves rather than flips off: this room now has a back wall, and the camera's path runs
  // straight through it on the way to the closing scene.
  useStationDissolve(sceneRef, STATIONS.molecule, { inAt: 13.5, outAt: 6.5, fade: 2.5 });

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

  // High-spec facility shell: light alloy panelling on every surface, polished floor, cool light.
  // Every surface here is a manufactured panel rather than paint — that, plus the lit seams, is
  // what separates a research facility from a plain bright room.
  const roomMaterials = useMemo(() => {
    const wallPanels = createTechPanelTexture({
      size: 1024,
      panelsX: 4,
      panelsY: 3,
      base: "#dbe0e4",
      seam: "#9ea8af",
      repeat: [6, 1],
      seed: 71,
    });
    const wallMat = new THREE.MeshStandardMaterial({
      map: wallPanels.map,
      roughnessMap: wallPanels.roughnessMap,
      normalMap: wallPanels.normalMap,
      normalScale: new THREE.Vector2(0.35, 0.35),
      roughness: 0.42,
      metalness: 0.25,
      envMapIntensity: 0.7,
    });
    const floorPanels = createTechPanelTexture({
      size: 1024,
      panelsX: 3,
      panelsY: 3,
      base: "#c9d0d5",
      seam: "#98a1a8",
      repeat: [4, 9],
      seed: 73,
      bolts: false,
    });
    const floorMat = new THREE.MeshStandardMaterial({
      map: floorPanels.map,
      roughnessMap: floorPanels.roughnessMap,
      normalMap: floorPanels.normalMap,
      normalScale: new THREE.Vector2(0.12, 0.12),
      // Poured resin over panel: glossy enough to carry a soft reflection of the ceiling lights
      // down the length of the room, which is most of the "clean tech facility" read.
      roughness: 0.18,
      metalness: 0.35,
      envMapIntensity: 1,
    });
    const ceilingTiles = createAcousticTileTexture(512, 5, "#eef0ee");
    ceilingTiles.repeat.set(3, 5);
    const ceilingMat = new THREE.MeshStandardMaterial({ map: ceilingTiles, roughness: 0.9 });
    const counterMat = new THREE.MeshStandardMaterial({
      color: "#2b323a",
      metalness: 0.45,
      roughness: 0.3,
      envMapIntensity: 0.8,
    });
    const cabinetMat = new THREE.MeshStandardMaterial({
      color: "#e2e6e9",
      metalness: 0.25,
      roughness: 0.4,
      envMapIntensity: 0.6,
    });
    const glassMat = new THREE.MeshPhysicalMaterial({
      color: "#cfe4ec",
      transmission: 0.86,
      roughness: 0.05,
      thickness: 0.04,
      ior: 1.5,
      envMapIntensity: 1,
    });
    const screenMats = [
      new THREE.MeshStandardMaterial({ map: createDataScreenTexture(256, "blue"), emissiveMap: createDataScreenTexture(256, "blue"), emissive: "#ffffff", emissiveIntensity: 0.55, roughness: 0.25 }),
      new THREE.MeshStandardMaterial({ map: createDataScreenTexture(256, "green"), emissiveMap: createDataScreenTexture(256, "green"), emissive: "#ffffff", emissiveIntensity: 0.55, roughness: 0.25 }),
    ];
    return { wallMat, floorMat, ceilingMat, counterMat, cabinetMat, glassMat, screenMats };
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
      {[-6.4, -3.2, 0, 3.2, 6.4].map((z, i) => (
        <mesh key={i} position={[0, CEILING_Y - 0.02, z]} rotation={[Math.PI / 2, 0, 0]}>
          <planeGeometry args={[2.6, 1.3]} />
          <meshStandardMaterial color="#f6f7f4" emissive="#eef2ff" emissiveIntensity={1.3} />
        </mesh>
      ))}

      {/* Continuous LED coves: one pair along the ceiling edges, one pair at the foot of each wall.
       * Long thin emissive strips are what make a panelled room read as engineered rather than
       * merely painted, and they light the floor's reflection down the length of the room. */}
      {[-WALL_X + 0.12, WALL_X - 0.12].map((x, i) => (
        <mesh key={`cove-${i}`} position={[x, CEILING_Y - 0.16, -1]}>
          <boxGeometry args={[0.08, 0.06, 24]} />
          <meshStandardMaterial color="#dff4ff" emissive="#7fd8f5" emissiveIntensity={2.4} roughness={0.3} />
        </mesh>
      ))}
      {[-WALL_X + 0.06, WALL_X - 0.06].map((x, i) => (
        <mesh key={`skirt-${i}`} position={[x, FLOOR_Y + 0.08, -1]}>
          <boxGeometry args={[0.05, 0.05, 24]} />
          <meshStandardMaterial color="#cfeeff" emissive="#4fc8e8" emissiveIntensity={1.8} roughness={0.3} />
        </mesh>
      ))}
      {/* Guide lines inlaid in the floor, as in a real clean-room circulation route */}
      {[-2.6, 2.6].map((x, i) => (
        <mesh key={`guide-${i}`} position={[x, FLOOR_Y + 0.012, -1]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[0.07, 22]} />
          <meshStandardMaterial color="#bfe9f7" emissive="#49c4e6" emissiveIntensity={1.1} roughness={0.4} />
        </mesh>
      ))}

      {/* Back wall: panelled, with a bank of data screens, a glazed partition onto the corridor
       * beyond, and lit seams. Set well back at z -10 — the camera's path runs through this room
       * too, and the scene dissolves out by z -60.5 in world terms, comfortably short of it. */}
      <mesh position={[0, (FLOOR_Y + CEILING_Y) / 2, -10]} material={roomMaterials.wallMat} receiveShadow>
        <planeGeometry args={[WALL_X * 2, CEILING_Y - FLOOR_Y]} />
      </mesh>
      {[-3.4, 0, 3.4].map((x, i) => (
        <group key={`screen-${i}`} position={[x, FLOOR_Y + 2.5, -9.93]}>
          <mesh material={roomMaterials.screenMats[i % 2]}>
            <planeGeometry args={[2.5, 1.4]} />
          </mesh>
          <mesh position={[0, 0, -0.02]}>
            <boxGeometry args={[2.62, 1.52, 0.04]} />
            <meshStandardMaterial color="#39424a" metalness={0.6} roughness={0.35} />
          </mesh>
        </group>
      ))}
      {/* Glazed partition band under the screens, with the corridor light behind it */}
      <mesh position={[0, FLOOR_Y + 0.95, -9.9]} material={roomMaterials.glassMat}>
        <planeGeometry args={[WALL_X * 2 - 1.2, 1.5]} />
      </mesh>
      {[-4.4, -1.5, 1.5, 4.4].map((x, i) => (
        <mesh key={`mullion-${i}`} position={[x, FLOOR_Y + 0.95, -9.88]}>
          <boxGeometry args={[0.07, 1.5, 0.06]} />
          <meshStandardMaterial color="#8b949b" metalness={0.7} roughness={0.3} />
        </mesh>
      ))}
      <mesh position={[0, FLOOR_Y + 1.73, -9.86]}>
        <boxGeometry args={[WALL_X * 2 - 1.2, 0.05, 0.05]} />
        <meshStandardMaterial color="#d8f2fb" emissive="#5cd0ec" emissiveIntensity={1.8} roughness={0.3} />
      </mesh>
      <pointLight position={[0, FLOOR_Y + 1.2, -9.4]} intensity={5} distance={7} decay={2} color="#7fd8f5" />

      {/* Cable tray running the length of the ceiling, with its bundled runs — the services no
       * real facility hides completely. */}
      <mesh position={[WALL_X - 1.1, CEILING_Y - 0.34, -1]}>
        <boxGeometry args={[0.42, 0.06, 22]} />
        <meshStandardMaterial color="#9099a0" metalness={0.65} roughness={0.4} />
      </mesh>
      {[-0.12, 0, 0.12].map((o, i) => (
        <mesh key={`cable-${i}`} position={[WALL_X - 1.1 + o, CEILING_Y - 0.28, -1]}>
          <boxGeometry args={[0.05, 0.05, 22]} />
          <meshStandardMaterial color={i === 1 ? "#2f3439" : "#3c4348"} roughness={0.7} />
        </mesh>
      ))}

      {/* Left-hand analysis bench */}
      <mesh position={[-WALL_X + 0.9, FLOOR_Y + 0.5, -3]} material={roomMaterials.cabinetMat} receiveShadow castShadow>
        <boxGeometry args={[1.5, 1, 2.6]} />
      </mesh>
      <mesh position={[-WALL_X + 0.9, FLOOR_Y + 1.02, -3]} material={roomMaterials.counterMat}>
        <boxGeometry args={[1.56, 0.05, 2.66]} />
      </mesh>
      <MonitorProp position={[-WALL_X + 0.9, FLOOR_Y + 1.05, -3.7]} rotationY={Math.PI * 0.15} hue="blue" />
      <MonitorProp position={[-WALL_X + 0.9, FLOOR_Y + 1.05, -2.2]} rotationY={Math.PI * 0.15} hue="green" />

      {/* Right-hand bench, now with a centrifuge and a handling arm working over it */}
      <mesh position={[WALL_X - 0.9, FLOOR_Y + 0.5, 2]} material={roomMaterials.cabinetMat} receiveShadow castShadow>
        <boxGeometry args={[1.5, 1, 2.6]} />
      </mesh>
      <mesh position={[WALL_X - 0.9, FLOOR_Y + 1.02, 2]} material={roomMaterials.counterMat}>
        <boxGeometry args={[1.56, 0.05, 2.66]} />
      </mesh>
      <MonitorProp position={[WALL_X - 0.9, FLOOR_Y + 1.05, 1.3]} rotationY={-Math.PI * 0.15} hue="blue" />
      <Centrifuge position={[WALL_X - 0.95, FLOOR_Y + 1.05, 2.75]} rotationY={-0.5} />
      <RoboticArm position={[WALL_X - 1.0, FLOOR_Y + 1.05, -0.6]} rotationY={-Math.PI * 0.45} scale={0.85} />

      {/* Second bench run further back, so the room has depth rather than two islands */}
      <mesh position={[-WALL_X + 0.9, FLOOR_Y + 0.5, -6.6]} material={roomMaterials.cabinetMat} receiveShadow castShadow>
        <boxGeometry args={[1.5, 1, 2.4]} />
      </mesh>
      <mesh position={[-WALL_X + 0.9, FLOOR_Y + 1.02, -6.6]} material={roomMaterials.counterMat}>
        <boxGeometry args={[1.56, 0.05, 2.46]} />
      </mesh>
      <Centrifuge position={[-WALL_X + 0.95, FLOOR_Y + 1.05, -7.2]} rotationY={0.4} />
      <MonitorProp position={[-WALL_X + 0.9, FLOOR_Y + 1.05, -6]} rotationY={Math.PI * 0.15} hue="green" />

      {/* Instrument racks and storage lining the far half of the room */}
      <ServerRack position={[WALL_X - 0.45, FLOOR_Y, -5.4]} rotationY={-Math.PI / 2} height={2.4} />
      <ServerRack position={[WALL_X - 0.45, FLOOR_Y, -6.4]} rotationY={-Math.PI / 2} height={2.4} />
      <ServerRack position={[WALL_X - 0.45, FLOOR_Y, -7.4]} rotationY={-Math.PI / 2} height={2.1} />
      <TubeCabinet position={[-WALL_X + 0.35, FLOOR_Y, -0.6]} rotationY={Math.PI / 2} />
      <ControlConsole position={[-3.5, FLOOR_Y, -8.6]} rotationY={0.12} width={1.9} />
      <ControlConsole position={[3.5, FLOOR_Y, -8.6]} rotationY={-0.12} width={1.9} />

      {/* Scientists at work — stylized entourage figures, not an attempt at realistic people.
       * They stand clear of the benches now: one was previously placed at the exact centre of the
       * right-hand bench and rendered half-sunk through the worktop. */}
      <LabFigure position={[-WALL_X + 2.2, FLOOR_Y, -2.6]} rotationY={Math.PI * 0.62} />
      <LabFigure position={[WALL_X - 2.3, FLOOR_Y, 2.1]} rotationY={-Math.PI * 0.62} hairColor="#1c1712" />
      <LabFigure position={[-1.9, FLOOR_Y, -6.2]} rotationY={0.5} hairColor="#5a4a34" />

      {/* Hero molecule, lifted onto a lit plinth and moved off the camera's centre line — the model
       * used to sit exactly on the flight path, so the camera flew straight into the middle of it
       * and the frame filled with the black of the central atom. As an exhibit standing beside the
       * route, it stays readable the whole way past. */}
      {/* Central island, filling the middle of the room. Safe to put here: the camera tracks 3.2m
       * above this floor, so anything at bench height passes well beneath it. */}
      <mesh position={[-0.4, FLOOR_Y + 0.48, -5.6]} material={roomMaterials.cabinetMat} receiveShadow castShadow>
        <boxGeometry args={[3.6, 0.96, 1.5]} />
      </mesh>
      <mesh position={[-0.4, FLOOR_Y + 0.99, -5.6]} material={roomMaterials.counterMat} receiveShadow>
        <boxGeometry args={[3.7, 0.06, 1.6]} />
      </mesh>
      <mesh position={[-0.4, FLOOR_Y + 0.08, -5.6]}>
        <boxGeometry args={[3.5, 0.04, 1.4]} />
        <meshStandardMaterial color="#cfeeff" emissive="#4fc8e8" emissiveIntensity={1.5} roughness={0.35} />
      </mesh>
      <MonitorProp position={[-1.5, FLOOR_Y + 1.02, -5.9]} rotationY={0.35} hue="green" />
      <MonitorProp position={[0.5, FLOOR_Y + 1.02, -5.9]} rotationY={-0.3} hue="blue" />
      <Centrifuge position={[0.9, FLOOR_Y + 1.02, -5.2]} rotationY={0.8} />

      <HoloPlinth position={[2.45, FLOOR_Y, -3.9]} />
      <group ref={groupRef} position={[2.45, FLOOR_Y + 2.1, -3.9]} scale={0.78}>
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

      {/* Cool, even facility light: a blue-white sky term over a grey floor bounce, then fills
       * spaced down the room so the depth stays lit rather than falling off into a dark far end. */}
      <hemisphereLight args={["#e8f2ff", "#8f9aa3", 0.7]} />
      <pointLight position={[0, 2.6, 3]} intensity={8} distance={16} decay={1.8} color="#eef6ff" />
      <pointLight position={[0, 2.6, -3.2]} intensity={7} distance={16} decay={1.8} color="#eef6ff" />
      <pointLight position={[0, 2.6, -8]} intensity={6} distance={14} decay={1.8} color="#e6f2ff" />
      <pointLight position={[-2.5, 1.5, -1]} intensity={4} distance={9} decay={2} color="#dfeeff" />
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
  // Widened to 16.5 so it is on screen before the molecule room finishes dissolving at z -60.5.
  useStationVisibility(sceneRef, STATIONS.horizon, 16.5);

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
        {/* Threshold sits high on purpose. At 0.45 it was tuned for the near-black scenes, where
         * only light sources ever got that bright — but a white-walled lab is above that threshold
         * almost everywhere, so the entire room bloomed into a milky haze. Only actual emitters
         * (fixtures, LEDs, the window, the glowing molecule) should ever bleed. */}
        <Bloom mipmapBlur luminanceThreshold={0.88} luminanceSmoothing={0.25} intensity={0.42} radius={0.7} />
        <Vignette eskil={false} offset={0.3} darkness={0.45} />
        <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
      </EffectComposer>
    </Canvas>
  );
}
