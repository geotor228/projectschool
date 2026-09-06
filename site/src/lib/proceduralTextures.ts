import * as THREE from "three";

/** Cheap deterministic hash noise — good enough for grain/speckle without a texture download. */
function hash(x: number, y: number, seed: number): number {
  const s = Math.sin(x * 127.1 + y * 311.7 + seed * 74.7) * 43758.5453123;
  return s - Math.floor(s);
}

function makeCanvas(size: number): { canvas: HTMLCanvasElement; ctx: CanvasRenderingContext2D } {
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  return { canvas, ctx };
}

function speckle(ctx: CanvasRenderingContext2D, size: number, seed: number, density: number, color: string, opacityRange: [number, number]) {
  const count = Math.floor(size * size * density);
  for (let i = 0; i < count; i++) {
    const x = hash(i, 0, seed) * size;
    const y = hash(0, i, seed + 1) * size;
    const r = 0.4 + hash(i, i, seed + 2) * 1.1;
    ctx.globalAlpha = opacityRange[0] + hash(i, i * 2, seed + 3) * (opacityRange[1] - opacityRange[0]);
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

/** Converts a grayscale height canvas into a tangent-space normal map via a finite-difference
 * (Sobel-like) gradient — real per-pixel surface detail (grain ridges, plaster pitting) that
 * catches light correctly under moving/angled lights, instead of just a flat color+roughness
 * surface that only ever looks like a photo pasted on a plane. */
function heightToNormalMap(heightCanvas: HTMLCanvasElement, strength = 2.2): HTMLCanvasElement {
  const w = heightCanvas.width;
  const h = heightCanvas.height;
  const src = heightCanvas.getContext("2d")!.getImageData(0, 0, w, h).data;
  const heightAt = (x: number, y: number) => {
    const xi = (x + w) % w;
    const yi = (y + h) % h;
    return src[(yi * w + xi) * 4] / 255;
  };
  const out = document.createElement("canvas");
  out.width = w;
  out.height = h;
  const outCtx = out.getContext("2d")!;
  const outData = outCtx.createImageData(w, h);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const dx = (heightAt(x - 1, y) - heightAt(x + 1, y)) * strength;
      const dy = (heightAt(x, y - 1) - heightAt(x, y + 1)) * strength;
      const len = Math.sqrt(dx * dx + dy * dy + 1);
      const idx = (y * w + x) * 4;
      outData.data[idx] = ((dx / len) * 0.5 + 0.5) * 255;
      outData.data[idx + 1] = ((dy / len) * 0.5 + 0.5) * 255;
      outData.data[idx + 2] = ((1 / len) * 0.5 + 0.5) * 255;
      outData.data[idx + 3] = 255;
    }
  }
  outCtx.putImageData(outData, 0, 0);
  return out;
}

type WoodOptions = {
  base: string;
  dark: string;
  light: string;
  size?: number;
  repeat?: [number, number];
  plankLines?: boolean;
  seed?: number;
};

/** Warm wood grain: base fill + wavy bezier grain streaks + fine speckle, plus a matching
 * grayscale roughness/bump map so the surface reads as real wood instead of flat plastic. */
export function createWoodTexture({ base, dark, light, size = 512, repeat = [1, 1], plankLines = false, seed = 1 }: WoodOptions) {
  const { canvas, ctx } = makeCanvas(size);
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, size, size);

  const streaks = 36;
  for (let i = 0; i < streaks; i++) {
    const y0 = (i / streaks) * size + hash(i, 0, seed) * 10 - 5;
    ctx.strokeStyle = hash(i, 1, seed) > 0.5 ? dark : light;
    ctx.globalAlpha = 0.06 + hash(i, 2, seed) * 0.1;
    ctx.lineWidth = 1 + hash(i, 3, seed) * 2.5;
    ctx.beginPath();
    ctx.moveTo(0, y0);
    const segments = 6;
    for (let s = 1; s <= segments; s++) {
      const x = (s / segments) * size;
      const wobble = Math.sin(s * 1.7 + i * 0.6 + hash(i, s, seed) * 6) * 6;
      ctx.lineTo(x, y0 + wobble);
    }
    ctx.stroke();
  }

  if (plankLines) {
    const planks = 6;
    ctx.globalAlpha = 0.35;
    ctx.strokeStyle = dark;
    ctx.lineWidth = 2;
    for (let i = 1; i < planks; i++) {
      const x = (i / planks) * size;
      ctx.beginPath();
      ctx.moveTo(x + (hash(i, 9, seed) - 0.5) * 3, 0);
      ctx.lineTo(x + (hash(i, 8, seed) - 0.5) * 3, size);
      ctx.stroke();
    }
  }

  speckle(ctx, size, seed + 10, 0.0025, light, [0.03, 0.09]);
  speckle(ctx, size, seed + 20, 0.0015, dark, [0.05, 0.12]);
  ctx.globalAlpha = 1;

  const map = new THREE.CanvasTexture(canvas);
  map.colorSpace = THREE.SRGBColorSpace;
  map.wrapS = map.wrapT = THREE.RepeatWrapping;
  map.repeat.set(repeat[0], repeat[1]);

  // Roughness map: independent grayscale grain, deliberately kept in a safe mid-high range
  // (never near 0) so no pixel reads as near-mirror and throws a specular firefly under bloom.
  const rough = makeCanvas(size);
  rough.ctx.fillStyle = "#c2c2c2";
  rough.ctx.fillRect(0, 0, size, size);
  for (let i = 0; i < 24; i++) {
    const y0 = (i / 24) * size + hash(i, 40, seed) * 10 - 5;
    rough.ctx.strokeStyle = hash(i, 41, seed) > 0.5 ? "#9a9a9a" : "#d8d8d8";
    rough.ctx.globalAlpha = 0.15;
    rough.ctx.lineWidth = 2 + hash(i, 42, seed) * 3;
    rough.ctx.beginPath();
    rough.ctx.moveTo(0, y0);
    for (let s = 1; s <= 6; s++) {
      const x = (s / 6) * size;
      const wobble = Math.sin(s * 1.7 + i * 0.6) * 6;
      rough.ctx.lineTo(x, y0 + wobble);
    }
    rough.ctx.stroke();
  }
  rough.ctx.globalAlpha = 1;
  const roughnessMap = new THREE.CanvasTexture(rough.canvas);
  roughnessMap.wrapS = roughnessMap.wrapT = THREE.RepeatWrapping;
  roughnessMap.repeat.set(repeat[0], repeat[1]);

  // The grain pattern doubles as a heightmap: real ridges that catch light at an angle, instead
  // of grain that's only ever a flat painted-on color.
  const normalMap = new THREE.CanvasTexture(heightToNormalMap(rough.canvas, 1.6));
  normalMap.wrapS = normalMap.wrapT = THREE.RepeatWrapping;
  normalMap.repeat.set(repeat[0], repeat[1]);

  return { map, roughnessMap, normalMap };
}

type PlasterOptions = {
  base: string;
  dark: string;
  light: string;
  size?: number;
  repeat?: [number, number];
  seed?: number;
};

/** Warm mottled plaster: soft blotchy color variation + fine speckle, so walls read as a real
 * textured surface instead of a flat color fill. */
export function createPlasterTexture({ base, dark, light, size = 512, repeat = [1, 1], seed = 1 }: PlasterOptions) {
  const { canvas, ctx } = makeCanvas(size);
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, size, size);

  const blotches = 22;
  for (let i = 0; i < blotches; i++) {
    const x = hash(i, 50, seed) * size;
    const y = hash(i, 51, seed) * size;
    const r = 40 + hash(i, 52, seed) * 140;
    const grad = ctx.createRadialGradient(x, y, 0, x, y, r);
    const tint = hash(i, 53, seed) > 0.5 ? light : dark;
    grad.addColorStop(0, tint);
    grad.addColorStop(1, "rgba(0,0,0,0)");
    ctx.globalAlpha = 0.05 + hash(i, 54, seed) * 0.06;
    ctx.fillStyle = grad;
    ctx.fillRect(x - r, y - r, r * 2, r * 2);
  }
  ctx.globalAlpha = 1;

  speckle(ctx, size, seed + 30, 0.003, light, [0.02, 0.06]);
  speckle(ctx, size, seed + 40, 0.002, dark, [0.03, 0.08]);

  const map = new THREE.CanvasTexture(canvas);
  map.colorSpace = THREE.SRGBColorSpace;
  map.wrapS = map.wrapT = THREE.RepeatWrapping;
  map.repeat.set(repeat[0], repeat[1]);

  const rough = makeCanvas(size);
  rough.ctx.fillStyle = "#cfcfcf";
  rough.ctx.fillRect(0, 0, size, size);
  speckle(rough.ctx, size, seed + 60, 0.004, "#e8e8e8", [0.05, 0.12]);
  speckle(rough.ctx, size, seed + 70, 0.004, "#9a9a9a", [0.05, 0.12]);
  const roughnessMap = new THREE.CanvasTexture(rough.canvas);
  roughnessMap.wrapS = roughnessMap.wrapT = THREE.RepeatWrapping;
  roughnessMap.repeat.set(repeat[0], repeat[1]);

  const normalMap = new THREE.CanvasTexture(heightToNormalMap(rough.canvas, 1.1));
  normalMap.wrapS = normalMap.wrapT = THREE.RepeatWrapping;
  normalMap.repeat.set(repeat[0], repeat[1]);

  return { map, roughnessMap, normalMap };
}

/** Suspended acoustic ceiling tiles: a grid of panels with dark seam lines and a fine speckled
 * texture within each tile, so the ceiling reads as a real office/lab drop-ceiling instead of a
 * flat color fill. */
export function createAcousticTileTexture(size = 512, tilesPerSide = 4, color = "#d8d4c6") {
  const { canvas, ctx } = makeCanvas(size);
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, size, size);
  speckle(ctx, size, 90, 0.02, "#00000022".slice(0, 7), [0.02, 0.05]);
  speckle(ctx, size, 91, 0.015, "#ffffff", [0.02, 0.05]);

  const tile = size / tilesPerSide;
  ctx.strokeStyle = "rgba(0,0,0,0.35)";
  ctx.lineWidth = 3;
  for (let i = 0; i <= tilesPerSide; i++) {
    const p = i * tile;
    ctx.beginPath();
    ctx.moveTo(p, 0);
    ctx.lineTo(p, size);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, p);
    ctx.lineTo(size, p);
    ctx.stroke();
  }

  const map = new THREE.CanvasTexture(canvas);
  map.colorSpace = THREE.SRGBColorSpace;
  map.wrapS = map.wrapT = THREE.RepeatWrapping;
  return map;
}

/** A monitor screen showing a glowing data chart — background-equipment set dressing for a modern
 * research-lab scene, cheap to read as "busy computer" even at a glance/distance. */
export function createDataScreenTexture(size = 256, hue: "blue" | "green" = "blue") {
  const { canvas, ctx } = makeCanvas(size);
  ctx.fillStyle = "#081018";
  ctx.fillRect(0, 0, size, size);
  const line = hue === "blue" ? "#5ec8f2" : "#6bd88a";
  ctx.strokeStyle = line;
  ctx.lineWidth = 2;
  ctx.beginPath();
  const points = 24;
  for (let i = 0; i <= points; i++) {
    const x = (i / points) * size;
    const y = size * 0.65 - Math.abs(Math.sin(i * 0.9 + hash(i, 0, 60) * 4)) * size * 0.35 - hash(i, 1, 61) * size * 0.08;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.stroke();
  ctx.strokeStyle = "rgba(255,255,255,0.12)";
  ctx.lineWidth = 1;
  for (let i = 1; i < 5; i++) {
    const y = (i / 5) * size;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(size, y);
    ctx.stroke();
  }
  ctx.fillStyle = line;
  for (let i = 0; i < 6; i++) {
    ctx.globalAlpha = 0.6;
    ctx.fillRect(size * 0.05 + i * size * 0.14, size * 0.08, size * 0.08, size * 0.02);
  }
  ctx.globalAlpha = 1;

  const map = new THREE.CanvasTexture(canvas);
  map.colorSpace = THREE.SRGBColorSpace;
  return map;
}

/** A soft radial-gradient disc — white center fading to transparent — used as a point-sprite map
 * so particles render as soft glowing circles (bokeh) instead of hard-edged squares. */
export function createGlowSpriteTexture(size = 128) {
  const { canvas, ctx } = makeCanvas(size);
  const grad = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  grad.addColorStop(0, "rgba(255,255,255,1)");
  grad.addColorStop(0.4, "rgba(255,255,255,0.5)");
  grad.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);
  const map = new THREE.CanvasTexture(canvas);
  return map;
}

/** A soft pastel gradient backdrop — peach through pink to lavender, with a few softly glowing
 * blobs baked in — for the closing scene's dreamy studio-photo background. */
export function createPastelGradientTexture(size = 512) {
  const { canvas, ctx } = makeCanvas(size);
  const grad = ctx.createLinearGradient(0, 0, size, size);
  grad.addColorStop(0, "#fbead9");
  grad.addColorStop(0.35, "#f6d9c9");
  grad.addColorStop(0.65, "#ecd2e2");
  grad.addColorStop(1, "#cdc0ea");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);

  for (let i = 0; i < 7; i++) {
    const x = hash(i, 200, 80) * size;
    const y = hash(i, 201, 81) * size;
    const r = 70 + hash(i, 202, 82) * 170;
    const g2 = ctx.createRadialGradient(x, y, 0, x, y, r);
    g2.addColorStop(0, "rgba(255,255,255,0.4)");
    g2.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = g2;
    ctx.fillRect(x - r, y - r, r * 2, r * 2);
  }

  const map = new THREE.CanvasTexture(canvas);
  map.colorSpace = THREE.SRGBColorSpace;
  return map;
}

/** Chalkboard slate: near-black green base, soft chalk-dust smudges, faint scratch lines. */
export function createSlateTexture(size = 512) {
  const { canvas, ctx } = makeCanvas(size);
  // A real chalkboard green, not near-black — at "#141d18" this read as a flat black square
  // under normal room lighting, not a slate at all.
  const grad = ctx.createLinearGradient(0, 0, size, size);
  grad.addColorStop(0, "#2f5c40");
  grad.addColorStop(1, "#1f4530");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);

  for (let i = 0; i < 10; i++) {
    const x = hash(i, 4, 5) * size;
    const y = hash(i, 5, 5) * size;
    const r = 30 + hash(i, 6, 5) * 90;
    const smudge = ctx.createRadialGradient(x, y, 0, x, y, r);
    smudge.addColorStop(0, "rgba(255,255,255,0.05)");
    smudge.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = smudge;
    ctx.fillRect(x - r, y - r, r * 2, r * 2);
  }

  ctx.strokeStyle = "rgba(255,255,255,0.06)";
  ctx.lineWidth = 1;
  for (let i = 0; i < 14; i++) {
    ctx.beginPath();
    const x0 = hash(i, 7, 6) * size;
    const y0 = hash(i, 8, 6) * size;
    ctx.moveTo(x0, y0);
    ctx.lineTo(x0 + (hash(i, 9, 6) - 0.5) * 120, y0 + (hash(i, 10, 6) - 0.5) * 40);
    ctx.stroke();
  }

  speckle(ctx, size, 7, 0.002, "#ffffff", [0.02, 0.05]);

  const map = new THREE.CanvasTexture(canvas);
  map.colorSpace = THREE.SRGBColorSpace;
  return map;
}
