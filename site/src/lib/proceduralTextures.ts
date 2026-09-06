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

type ParquetOptions = {
  base: string;
  dark: string;
  light: string;
  size?: number;
  repeat?: [number, number];
  seed?: number;
};

/** Blends two "#rrggbb" colors — used to keep parquet seams and plank tones as small steps off the
 * base wood color, instead of the hard black outlines that read as a wireframe grid. */
function mixHex(a: string, b: string, t: number): string {
  const pa = [1, 3, 5].map((i) => parseInt(a.slice(i, i + 2), 16));
  const pb = [1, 3, 5].map((i) => parseInt(b.slice(i, i + 2), 16));
  const out = pa.map((v, i) => Math.round(v + (pb[i] - v) * t));
  return `rgb(${out[0]},${out[1]},${out[2]})`;
}

/** Light-oak basket-weave parquet: square blocks of several narrow boards, orientation alternating
 * block to block. Every edge here is a seam between two pieces of wood, so it's drawn as a hairline
 * a couple of shades under the board it sits next to — never an outline. An earlier version stroked
 * each block in 25%-black at three pixels wide, which at floor scale tiled into a thick black grid
 * that read as an unfinished wireframe rather than a floor. Plank tone varies board by board and
 * the grain runs along each board's length, which is what makes the pattern read as laid wood. */
export function createParquetTexture({ base, dark, light, size = 512, repeat = [1, 1], seed = 1 }: ParquetOptions) {
  const { canvas, ctx } = makeCanvas(size);
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, size, size);

  const cells = 6;
  const cell = size / cells;
  const boards = 3;
  const boardSize = cell / boards;
  const seam = mixHex(base, dark, 0.55);

  const drawBoard = (x: number, y: number, w: number, h: number, vertical: boolean, id: number) => {
    // Board tone: a small step either side of the base, never a flat swap to dark or light.
    const lean = hash(id, 1, seed);
    const amount = 0.1 + hash(id, 2, seed) * 0.3;
    ctx.fillStyle = mixHex(base, lean > 0.5 ? light : dark, amount);
    ctx.fillRect(x, y, w, h);

    ctx.save();
    ctx.beginPath();
    ctx.rect(x, y, w, h);
    ctx.clip();

    // Grain: fine wavy streaks running the length of the board.
    const streaks = 7;
    for (let k = 0; k < streaks; k++) {
      const t = (k + 0.5) / streaks;
      ctx.globalAlpha = 0.05 + hash(id, k + 10, seed) * 0.07;
      ctx.strokeStyle = hash(id, k + 20, seed) > 0.5 ? dark : light;
      ctx.lineWidth = 0.6 + hash(id, k + 30, seed) * 0.9;
      ctx.beginPath();
      const span = vertical ? h : w;
      const segments = 5;
      for (let s = 0; s <= segments; s++) {
        const along = (s / segments) * span;
        const wobble = Math.sin(s * 1.6 + k * 0.9 + hash(id, s, seed) * 5) * (vertical ? w : h) * 0.05;
        const across = (vertical ? x + t * w : y + t * h) + wobble;
        const px = vertical ? across : x + along;
        const py = vertical ? y + along : across;
        if (s === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.stroke();
    }
    ctx.restore();
    ctx.globalAlpha = 1;

    // Hairline seam on the two edges that butt against the neighbouring board.
    ctx.strokeStyle = seam;
    ctx.globalAlpha = 0.4;
    ctx.lineWidth = 1;
    ctx.beginPath();
    if (vertical) {
      ctx.moveTo(x + 0.5, y);
      ctx.lineTo(x + 0.5, y + h);
    } else {
      ctx.moveTo(x, y + 0.5);
      ctx.lineTo(x + w, y + 0.5);
    }
    ctx.stroke();
    ctx.globalAlpha = 1;
  };

  for (let cy = 0; cy < cells; cy++) {
    for (let cx = 0; cx < cells; cx++) {
      const bx = cx * cell;
      const by = cy * cell;
      const vertical = (cx + cy) % 2 === 0;
      for (let b = 0; b < boards; b++) {
        const id = (cy * cells + cx) * boards + b;
        if (vertical) drawBoard(bx + b * boardSize, by, boardSize, cell, true, id);
        else drawBoard(bx, by + b * boardSize, cell, boardSize, false, id);
      }
    }
  }

  speckle(ctx, size, seed + 80, 0.0015, light, [0.015, 0.045]);
  speckle(ctx, size, seed + 90, 0.001, dark, [0.02, 0.05]);

  const map = new THREE.CanvasTexture(canvas);
  map.colorSpace = THREE.SRGBColorSpace;
  map.wrapS = map.wrapT = THREE.RepeatWrapping;
  map.repeat.set(repeat[0], repeat[1]);
  // A floor is always seen at a grazing angle, where isotropic filtering smears it into mush.
  map.anisotropy = 8;

  // Roughness/height: soft, board-to-board variation in how worn the varnish is, plus the faintest
  // dip at the seams. Deliberately no hard dark lines — those became embossed ridges in the normal
  // map and threw a dark crease along every seam at grazing angles.
  const rough = makeCanvas(size);
  rough.ctx.fillStyle = "#b4b4b4";
  rough.ctx.fillRect(0, 0, size, size);
  for (let cy = 0; cy < cells; cy++) {
    for (let cx = 0; cx < cells; cx++) {
      const vertical = (cx + cy) % 2 === 0;
      for (let b = 0; b < boards; b++) {
        const id = (cy * cells + cx) * boards + b;
        const v = 168 + Math.round(hash(id, 40, seed) * 34);
        rough.ctx.fillStyle = `rgb(${v},${v},${v})`;
        if (vertical) rough.ctx.fillRect(cx * cell + b * boardSize, cy * cell, boardSize, cell);
        else rough.ctx.fillRect(cx * cell, cy * cell + b * boardSize, cell, boardSize);
      }
    }
  }
  speckle(rough.ctx, size, seed + 100, 0.002, "#d0d0d0", [0.03, 0.07]);
  const roughnessMap = new THREE.CanvasTexture(rough.canvas);
  roughnessMap.wrapS = roughnessMap.wrapT = THREE.RepeatWrapping;
  roughnessMap.repeat.set(repeat[0], repeat[1]);
  roughnessMap.anisotropy = 8;

  const normalMap = new THREE.CanvasTexture(heightToNormalMap(rough.canvas, 0.6));
  normalMap.wrapS = normalMap.wrapT = THREE.RepeatWrapping;
  normalMap.repeat.set(repeat[0], repeat[1]);
  normalMap.anisotropy = 8;

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
  map.anisotropy = 8;

  const rough = makeCanvas(size);
  rough.ctx.fillStyle = "#cfcfcf";
  rough.ctx.fillRect(0, 0, size, size);
  speckle(rough.ctx, size, seed + 60, 0.004, "#e8e8e8", [0.05, 0.12]);
  speckle(rough.ctx, size, seed + 70, 0.004, "#9a9a9a", [0.05, 0.12]);
  const roughnessMap = new THREE.CanvasTexture(rough.canvas);
  roughnessMap.wrapS = roughnessMap.wrapT = THREE.RepeatWrapping;
  roughnessMap.repeat.set(repeat[0], repeat[1]);
  roughnessMap.anisotropy = 8;

  const normalMap = new THREE.CanvasTexture(heightToNormalMap(rough.canvas, 1.1));
  normalMap.wrapS = normalMap.wrapT = THREE.RepeatWrapping;
  normalMap.repeat.set(repeat[0], repeat[1]);
  normalMap.anisotropy = 8;

  return { map, roughnessMap, normalMap };
}

type TileFloorOptions = {
  size?: number;
  tiles?: number;
  base?: string;
  grout?: string;
  repeat?: [number, number];
  seed?: number;
};

/** White ceramic lab tile: square tiles with thin grey grout joints, a faint tone drift tile to
 * tile, and a smooth glazed finish. Grout is a light grey hairline, never a black line — a dark
 * heavy joint tiles into the same wireframe grid that ruined the classroom floor. */
export function createTileFloorTexture({
  size = 1024,
  tiles = 4,
  base = "#f2f3f1",
  grout = "#c8cac6",
  repeat = [1, 1],
  seed = 5,
}: TileFloorOptions = {}) {
  const { canvas, ctx } = makeCanvas(size);
  const cell = size / tiles;
  const joint = Math.max(1.5, cell * 0.014);

  ctx.fillStyle = grout;
  ctx.fillRect(0, 0, size, size);

  const baseRgb = [1, 3, 5].map((i) => parseInt(base.slice(i, i + 2), 16));
  for (let ty = 0; ty < tiles; ty++) {
    for (let tx = 0; tx < tiles; tx++) {
      // Fired ceramic is never perfectly uniform; a couple of levels of drift per tile is what
      // stops a tiled floor reading as one flat plane with lines drawn on it.
      const drift = Math.round((hash(tx, ty, seed) - 0.5) * 9);
      ctx.fillStyle = `rgb(${baseRgb[0] + drift},${baseRgb[1] + drift},${baseRgb[2] + drift})`;
      ctx.fillRect(tx * cell + joint, ty * cell + joint, cell - joint * 2, cell - joint * 2);

      // A soft sheen gradient across each tile, so the glaze catches light unevenly.
      const g = ctx.createLinearGradient(tx * cell, ty * cell, (tx + 1) * cell, (ty + 1) * cell);
      g.addColorStop(0, "rgba(255,255,255,0.05)");
      g.addColorStop(1, "rgba(0,0,0,0.02)");
      ctx.fillStyle = g;
      ctx.fillRect(tx * cell + joint, ty * cell + joint, cell - joint * 2, cell - joint * 2);
    }
  }

  speckle(ctx, size, seed + 12, 0.0012, "#ffffff", [0.02, 0.05]);
  speckle(ctx, size, seed + 13, 0.0008, "#b9bbb7", [0.02, 0.05]);

  const map = new THREE.CanvasTexture(canvas);
  map.colorSpace = THREE.SRGBColorSpace;
  map.wrapS = map.wrapT = THREE.RepeatWrapping;
  map.repeat.set(repeat[0], repeat[1]);
  map.anisotropy = 8;

  // Glazed tile face is smooth (dark in a roughness map), grout is matte and porous (light).
  const rough = makeCanvas(size);
  rough.ctx.fillStyle = "#b4b4b4";
  rough.ctx.fillRect(0, 0, size, size);
  for (let ty = 0; ty < tiles; ty++) {
    for (let tx = 0; tx < tiles; tx++) {
      const v = 58 + Math.round(hash(tx, ty, seed + 3) * 18);
      rough.ctx.fillStyle = `rgb(${v},${v},${v})`;
      rough.ctx.fillRect(tx * cell + joint, ty * cell + joint, cell - joint * 2, cell - joint * 2);
    }
  }
  const roughnessMap = new THREE.CanvasTexture(rough.canvas);
  roughnessMap.wrapS = roughnessMap.wrapT = THREE.RepeatWrapping;
  roughnessMap.repeat.set(repeat[0], repeat[1]);
  roughnessMap.anisotropy = 8;

  const normalMap = new THREE.CanvasTexture(heightToNormalMap(rough.canvas, 0.5));
  normalMap.wrapS = normalMap.wrapT = THREE.RepeatWrapping;
  normalMap.repeat.set(repeat[0], repeat[1]);
  normalMap.anisotropy = 8;

  return { map, roughnessMap, normalMap };
}

type TechPanelOptions = {
  size?: number;
  panelsX?: number;
  panelsY?: number;
  base?: string;
  seam?: string;
  repeat?: [number, number];
  seed?: number;
  bolts?: boolean;
};

/** Brushed light-alloy cladding: large rectangular panels divided by fine recessed seams, with a
 * faint horizontal brush grain and optional bolt heads at the corners. The wall and floor surface
 * of a high-spec research facility, where every surface is a manufactured panel rather than paint. */
export function createTechPanelTexture({
  size = 1024,
  panelsX = 4,
  panelsY = 3,
  base = "#d5dade",
  seam = "#9aa4ab",
  repeat = [1, 1],
  seed = 9,
  bolts = true,
}: TechPanelOptions = {}) {
  const { canvas, ctx } = makeCanvas(size);
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, size, size);

  const cw = size / panelsX;
  const ch = size / panelsY;
  const baseRgb = [1, 3, 5].map((i) => parseInt(base.slice(i, i + 2), 16));

  for (let py = 0; py < panelsY; py++) {
    for (let px = 0; px < panelsX; px++) {
      const drift = Math.round((hash(px, py, seed) - 0.5) * 8);
      ctx.fillStyle = `rgb(${baseRgb[0] + drift},${baseRgb[1] + drift},${baseRgb[2] + drift})`;
      ctx.fillRect(px * cw, py * ch, cw, ch);
    }
  }

  // Brushed grain: long, very low-contrast horizontal streaks.
  for (let i = 0; i < 260; i++) {
    const y = hash(i, 1, seed) * size;
    ctx.globalAlpha = 0.02 + hash(i, 2, seed) * 0.03;
    ctx.strokeStyle = hash(i, 3, seed) > 0.5 ? "#ffffff" : "#8d979e";
    ctx.lineWidth = 0.6 + hash(i, 4, seed) * 1.2;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(size, y + (hash(i, 5, seed) - 0.5) * 4);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;

  // Recessed seams: a fine shadow line with a highlight just under it, the way a real panel gap
  // catches light. Two hairlines, never one thick dark stroke.
  ctx.lineWidth = 1.5;
  for (let px = 0; px <= panelsX; px++) {
    const x = px * cw;
    ctx.strokeStyle = seam;
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, size);
    ctx.stroke();
    ctx.strokeStyle = "rgba(255,255,255,0.35)";
    ctx.beginPath();
    ctx.moveTo(x + 1.6, 0);
    ctx.lineTo(x + 1.6, size);
    ctx.stroke();
  }
  for (let py = 0; py <= panelsY; py++) {
    const y = py * ch;
    ctx.strokeStyle = seam;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(size, y);
    ctx.stroke();
    ctx.strokeStyle = "rgba(255,255,255,0.35)";
    ctx.beginPath();
    ctx.moveTo(0, y + 1.6);
    ctx.lineTo(size, y + 1.6);
    ctx.stroke();
  }

  if (bolts) {
    const inset = Math.max(6, cw * 0.05);
    ctx.fillStyle = "rgba(120,132,140,0.55)";
    for (let py = 0; py < panelsY; py++) {
      for (let px = 0; px < panelsX; px++) {
        for (const [ox, oy] of [
          [inset, inset],
          [cw - inset, inset],
          [inset, ch - inset],
          [cw - inset, ch - inset],
        ]) {
          ctx.beginPath();
          ctx.arc(px * cw + ox, py * ch + oy, Math.max(1.5, cw * 0.008), 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }
  }

  const map = new THREE.CanvasTexture(canvas);
  map.colorSpace = THREE.SRGBColorSpace;
  map.wrapS = map.wrapT = THREE.RepeatWrapping;
  map.repeat.set(repeat[0], repeat[1]);
  map.anisotropy = 8;

  // Panel faces are polished (dark in the roughness map), seams are matte.
  const rough = makeCanvas(size);
  rough.ctx.fillStyle = "#5a5a5a";
  rough.ctx.fillRect(0, 0, size, size);
  rough.ctx.strokeStyle = "#c4c4c4";
  rough.ctx.lineWidth = 2.5;
  for (let px = 0; px <= panelsX; px++) {
    rough.ctx.beginPath();
    rough.ctx.moveTo(px * cw, 0);
    rough.ctx.lineTo(px * cw, size);
    rough.ctx.stroke();
  }
  for (let py = 0; py <= panelsY; py++) {
    rough.ctx.beginPath();
    rough.ctx.moveTo(0, py * ch);
    rough.ctx.lineTo(size, py * ch);
    rough.ctx.stroke();
  }
  speckle(rough.ctx, size, seed + 21, 0.002, "#7a7a7a", [0.04, 0.1]);
  const roughnessMap = new THREE.CanvasTexture(rough.canvas);
  roughnessMap.wrapS = roughnessMap.wrapT = THREE.RepeatWrapping;
  roughnessMap.repeat.set(repeat[0], repeat[1]);
  roughnessMap.anisotropy = 8;

  const normalMap = new THREE.CanvasTexture(heightToNormalMap(rough.canvas, 0.55));
  normalMap.wrapS = normalMap.wrapT = THREE.RepeatWrapping;
  normalMap.repeat.set(repeat[0], repeat[1]);
  normalMap.anisotropy = 8;

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

  // Seams between tiles are a shallow shadowed joint, not a drawn line: at 35% black and three
  // pixels wide this tiled into a heavy grid across the ceiling that read as a wireframe overlay.
  const tile = size / tilesPerSide;
  ctx.strokeStyle = "rgba(90,84,74,0.16)";
  ctx.lineWidth = 1.5;
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

/** The periodic table, laid out as the real thing: 18 groups across, 7 periods down, with the
 * f-block dropped out underneath. Symbols are drawn large enough to still be legible from across
 * the room, which is the whole point of the poster on a lab wall. */
const PERIODS: (string | null)[][] = [
  ["H", ...Array(16).fill(null), "He"],
  ["Li", "Be", ...Array(10).fill(null), "B", "C", "N", "O", "F", "Ne"],
  ["Na", "Mg", ...Array(10).fill(null), "Al", "Si", "P", "S", "Cl", "Ar"],
  ["K", "Ca", "Sc", "Ti", "V", "Cr", "Mn", "Fe", "Co", "Ni", "Cu", "Zn", "Ga", "Ge", "As", "Se", "Br", "Kr"],
  ["Rb", "Sr", "Y", "Zr", "Nb", "Mo", "Tc", "Ru", "Rh", "Pd", "Ag", "Cd", "In", "Sn", "Sb", "Te", "I", "Xe"],
  ["Cs", "Ba", "La", "Hf", "Ta", "W", "Re", "Os", "Ir", "Pt", "Au", "Hg", "Tl", "Pb", "Bi", "Po", "At", "Rn"],
  ["Fr", "Ra", "Ac", "Rf", "Db", "Sg", "Bh", "Hs", "Mt", "Ds", "Rg", "Cn", "Nh", "Fl", "Mc", "Lv", "Ts", "Og"],
];
const LANTHANIDES = ["Ce", "Pr", "Nd", "Pm", "Sm", "Eu", "Gd", "Tb", "Dy", "Ho", "Er", "Tm", "Yb", "Lu"];
const ACTINIDES = ["Th", "Pa", "U", "Np", "Pu", "Am", "Cm", "Bk", "Cf", "Es", "Fm", "Md", "No", "Lr"];
const NONMETALS = new Set(["H", "C", "N", "O", "P", "S", "Se"]);
const METALLOIDS = new Set(["B", "Si", "Ge", "As", "Sb", "Te", "At"]);

function elementFill(symbol: string, group: number, period: number, fBlock: "lan" | "act" | null): string {
  if (fBlock === "lan") return "#f6ddc0";
  if (fBlock === "act") return "#f2ccc4";
  if (group === 18) return "#dcd4ef";
  if (group === 17) return "#cfe3f5";
  if (NONMETALS.has(symbol)) return "#cfe8dd";
  if (METALLOIDS.has(symbol)) return "#dfe8c8";
  if (group === 1 && period > 1) return "#f4cfcf";
  if (group === 2) return "#f7e2c4";
  if (group >= 3 && group <= 12) return "#e2e6ea";
  return "#e8e2d6";
}

export function createPeriodicTableTexture(width = 1600) {
  const cols = 18;
  const margin = Math.round(width * 0.028);
  const cell = Math.floor((width - margin * 2) / cols);
  const titleH = Math.round(cell * 1.5);
  const gap = Math.round(cell * 0.35);
  const height = margin * 2 + titleH + cell * 9 + gap;

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d")!;

  ctx.fillStyle = "#fbfaf7";
  ctx.fillRect(0, 0, width, height);

  ctx.fillStyle = "#1d2530";
  ctx.font = `600 ${Math.round(cell * 0.62)}px "Helvetica Neue", Arial, sans-serif`;
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.fillText("PERIODIC TABLE OF THE ELEMENTS", margin, margin + titleH * 0.42);
  ctx.fillStyle = "#6d7784";
  ctx.font = `400 ${Math.round(cell * 0.3)}px "Helvetica Neue", Arial, sans-serif`;
  ctx.fillText("TAULA PERIÒDICA DELS ELEMENTS", margin, margin + titleH * 0.8);

  let atomic = 0;
  const drawCell = (
    symbol: string,
    number: number,
    col: number,
    row: number,
    fBlock: "lan" | "act" | null,
  ) => {
    const x = margin + col * cell;
    const y = margin + titleH + row * cell + (fBlock ? gap : 0);
    const pad = Math.max(1, cell * 0.045);
    ctx.fillStyle = elementFill(symbol, col + 1, row + 1, fBlock);
    ctx.fillRect(x + pad, y + pad, cell - pad * 2, cell - pad * 2);
    ctx.strokeStyle = "rgba(40,52,66,0.28)";
    ctx.lineWidth = 1;
    ctx.strokeRect(x + pad, y + pad, cell - pad * 2, cell - pad * 2);

    ctx.fillStyle = "#5b6674";
    ctx.font = `400 ${Math.round(cell * 0.22)}px "Helvetica Neue", Arial, sans-serif`;
    ctx.textAlign = "left";
    ctx.fillText(String(number), x + pad * 2.2, y + cell * 0.24);

    ctx.fillStyle = "#141b24";
    ctx.font = `600 ${Math.round(cell * 0.42)}px "Helvetica Neue", Arial, sans-serif`;
    ctx.textAlign = "center";
    ctx.fillText(symbol, x + cell / 2, y + cell * 0.62);
  };

  for (let p = 0; p < PERIODS.length; p++) {
    for (let g = 0; g < cols; g++) {
      const symbol = PERIODS[p][g];
      if (!symbol) continue;
      atomic += 1;
      drawCell(symbol, atomicNumberFor(symbol, atomic), g, p, null);
    }
  }

  LANTHANIDES.forEach((s, i) => drawCell(s, 58 + i, i + 3, 7, "lan"));
  ACTINIDES.forEach((s, i) => drawCell(s, 90 + i, i + 3, 8, "act"));

  const map = new THREE.CanvasTexture(canvas);
  map.colorSpace = THREE.SRGBColorSpace;
  map.anisotropy = 8;
  return { map, aspect: width / height };
}

/** Atomic numbers run straight down the printed layout except across the two f-block breaks, where
 * the main table skips the 14 lanthanides and 14 actinides that are printed underneath. */
function atomicNumberFor(symbol: string, sequential: number): number {
  // Fr, Ra and Ac open period 7 but still sit after the 14 lanthanides in the printed layout, so
  // they carry the same offset as the rest of period 6's d-block.
  const AFTER_LANTHANIDES = new Set([
    "Hf", "Ta", "W", "Re", "Os", "Ir", "Pt", "Au", "Hg", "Tl", "Pb", "Bi", "Po", "At", "Rn",
    "Fr", "Ra", "Ac",
  ]);
  const AFTER_ACTINIDES = new Set(["Rf", "Db", "Sg", "Bh", "Hs", "Mt", "Ds", "Rg", "Cn", "Nh", "Fl", "Mc", "Lv", "Ts", "Og"]);
  if (AFTER_ACTINIDES.has(symbol)) return sequential + 28;
  if (AFTER_LANTHANIDES.has(symbol)) return sequential + 14;
  return sequential;
}

type DiagramKind = "clevenger" | "distillation" | "molecules";

/** Technical wall charts for the lab: schematic line art on paper, the kind actually pinned up in
 * a teaching lab. Drawn rather than lettered-at-you — legible as a diagram at a distance, with the
 * detail only resolving as the camera gets closer. */
export function createLabDiagramTexture(kind: DiagramKind, width = 640) {
  const height = Math.round(width * 1.32);
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d")!;
  const ink = "#22303c";
  const accent = "#b6763a";

  ctx.fillStyle = "#fcfbf7";
  ctx.fillRect(0, 0, width, height);
  ctx.strokeStyle = "rgba(34,48,60,0.18)";
  ctx.lineWidth = 2;
  ctx.strokeRect(10, 10, width - 20, height - 20);

  ctx.fillStyle = ink;
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.font = `600 ${Math.round(width * 0.062)}px "Helvetica Neue", Arial, sans-serif`;

  const cx = width / 2;
  ctx.strokeStyle = ink;
  ctx.lineWidth = 2.4;

  if (kind === "clevenger") {
    ctx.fillText("APARELL DE", 34, height * 0.075);
    ctx.fillText("CLEVENGER", 34, height * 0.128);

    // Round-bottom flask on a mantle.
    ctx.beginPath();
    ctx.arc(cx, height * 0.74, width * 0.14, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(cx - width * 0.045, height * 0.652);
    ctx.lineTo(cx - width * 0.045, height * 0.6);
    ctx.moveTo(cx + width * 0.045, height * 0.652);
    ctx.lineTo(cx + width * 0.045, height * 0.6);
    ctx.stroke();
    ctx.fillStyle = accent;
    ctx.beginPath();
    ctx.arc(cx, height * 0.762, width * 0.115, 0.15, Math.PI - 0.15);
    ctx.fill();
    ctx.fillStyle = ink;
    ctx.strokeRect(cx - width * 0.17, height * 0.855, width * 0.34, height * 0.045);

    // Column up to the condenser, with the classic coil.
    ctx.beginPath();
    ctx.moveTo(cx - width * 0.045, height * 0.6);
    ctx.lineTo(cx - width * 0.045, height * 0.42);
    ctx.moveTo(cx + width * 0.045, height * 0.6);
    ctx.lineTo(cx + width * 0.045, height * 0.42);
    ctx.stroke();
    ctx.strokeRect(cx - width * 0.08, height * 0.235, width * 0.16, height * 0.185);
    ctx.beginPath();
    for (let i = 0; i <= 26; i++) {
      const t = i / 26;
      const y = height * (0.25 + t * 0.155);
      const x = cx + Math.sin(t * Math.PI * 6) * width * 0.05;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();

    // Graduated trap branching off to the side.
    ctx.beginPath();
    ctx.moveTo(cx + width * 0.08, height * 0.33);
    ctx.lineTo(cx + width * 0.24, height * 0.33);
    ctx.lineTo(cx + width * 0.24, height * 0.52);
    ctx.stroke();
    ctx.strokeRect(cx + width * 0.2, height * 0.52, width * 0.085, height * 0.12);
    ctx.fillStyle = accent;
    ctx.fillRect(cx + width * 0.202, height * 0.598, width * 0.081, height * 0.04);
    ctx.fillStyle = ink;
    ctx.font = `400 ${Math.round(width * 0.036)}px "Helvetica Neue", Arial, sans-serif`;
    ctx.fillText("oli essencial", cx + width * 0.13, height * 0.68);
    ctx.fillText("refrigerant", 30, height * 0.3);
    ctx.fillText("matèria vegetal + H₂O", 30, height * 0.93);
  } else if (kind === "distillation") {
    ctx.fillText("HIDRODESTIL·LACIÓ", 34, height * 0.075);
    ctx.font = `400 ${Math.round(width * 0.036)}px "Helvetica Neue", Arial, sans-serif`;
    ctx.fillStyle = "#6d7784";
    ctx.fillText("procés, pas a pas", 34, height * 0.125);

    const steps = ["PÈTALS", "AIGUA + CALOR", "VAPOR", "CONDENSACIÓ", "SEPARACIÓ", "OLI ESSENCIAL"];
    steps.forEach((label, i) => {
      const y = height * (0.2 + i * 0.128);
      ctx.strokeStyle = ink;
      ctx.lineWidth = 2;
      ctx.strokeRect(width * 0.14, y, width * 0.72, height * 0.076);
      if (i === steps.length - 1) {
        ctx.fillStyle = "rgba(182,118,58,0.16)";
        ctx.fillRect(width * 0.14, y, width * 0.72, height * 0.076);
      }
      ctx.fillStyle = ink;
      ctx.font = `500 ${Math.round(width * 0.045)}px "Helvetica Neue", Arial, sans-serif`;
      ctx.textAlign = "center";
      ctx.fillText(label, cx, y + height * 0.038);
      ctx.textAlign = "left";
      if (i < steps.length - 1) {
        const ay = y + height * 0.076;
        ctx.beginPath();
        ctx.moveTo(cx, ay);
        ctx.lineTo(cx, ay + height * 0.036);
        ctx.moveTo(cx - width * 0.022, ay + height * 0.024);
        ctx.lineTo(cx, ay + height * 0.036);
        ctx.lineTo(cx + width * 0.022, ay + height * 0.024);
        ctx.stroke();
      }
    });
  } else {
    ctx.fillText("TERPENS", 34, height * 0.075);
    ctx.font = `400 ${Math.round(width * 0.036)}px "Helvetica Neue", Arial, sans-serif`;
    ctx.fillStyle = "#6d7784";
    ctx.fillText("estructures moleculars", 34, height * 0.125);

    const ring = (rx: number, ry: number, r: number, tail: boolean) => {
      ctx.strokeStyle = ink;
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      for (let i = 0; i <= 6; i++) {
        const a = (i / 6) * Math.PI * 2 - Math.PI / 2;
        const px = rx + Math.cos(a) * r;
        const py = ry + Math.sin(a) * r;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.stroke();
      // Inner double-bond strokes, the visual signature of an unsaturated ring.
      ctx.beginPath();
      for (const k of [0, 2]) {
        const a1 = (k / 6) * Math.PI * 2 - Math.PI / 2;
        const a2 = ((k + 1) / 6) * Math.PI * 2 - Math.PI / 2;
        ctx.moveTo(rx + Math.cos(a1) * r * 0.76, ry + Math.sin(a1) * r * 0.76);
        ctx.lineTo(rx + Math.cos(a2) * r * 0.76, ry + Math.sin(a2) * r * 0.76);
      }
      ctx.stroke();
      if (tail) {
        ctx.beginPath();
        ctx.moveTo(rx + r, ry);
        ctx.lineTo(rx + r * 1.7, ry - r * 0.4);
        ctx.lineTo(rx + r * 2.3, ry + r * 0.1);
        ctx.stroke();
      }
    };

    ring(cx - width * 0.12, height * 0.3, width * 0.11, true);
    ctx.fillStyle = ink;
    ctx.font = `500 ${Math.round(width * 0.042)}px "Helvetica Neue", Arial, sans-serif`;
    ctx.fillText("Limonè · C10H16", 34, height * 0.45);

    ring(cx - width * 0.12, height * 0.6, width * 0.11, false);
    ctx.fillText("β-Pinè · C10H16", 34, height * 0.75);

    // A short open chain for the alcohol.
    ctx.strokeStyle = ink;
    ctx.beginPath();
    let x = width * 0.2;
    for (let i = 0; i < 6; i++) {
      const y = height * (i % 2 === 0 ? 0.85 : 0.885);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
      x += width * 0.1;
    }
    ctx.stroke();
    ctx.fillText("Linalool · C10H18O", 34, height * 0.94);
  }

  const map = new THREE.CanvasTexture(canvas);
  map.colorSpace = THREE.SRGBColorSpace;
  map.anisotropy = 8;
  return { map, aspect: width / height };
}

/** A soft vignette: clear through the middle, darkening toward the edges. Laid over a photographic
 * backdrop it pulls the corners down so overlaid text keeps its contrast, without flattening the
 * middle of the picture. */
export function createVignetteTexture(size = 512, color = "10,16,10", strength = 0.82) {
  const { canvas, ctx } = makeCanvas(size);
  const grad = ctx.createRadialGradient(size / 2, size / 2, size * 0.12, size / 2, size / 2, size * 0.72);
  grad.addColorStop(0, `rgba(${color},0)`);
  grad.addColorStop(0.55, `rgba(${color},${strength * 0.25})`);
  grad.addColorStop(1, `rgba(${color},${strength})`);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);
  const map = new THREE.CanvasTexture(canvas);
  map.colorSpace = THREE.SRGBColorSpace;
  return map;
}

/** Chalkboard slate: near-black green base, soft chalk-dust smudges, faint scratch lines. */
export function createSlateTexture(size = 512) {
  const { canvas, ctx } = makeCanvas(size);
  // A real chalkboard green, not near-black — at "#141d18" this read as a flat black square
  // under normal room lighting, not a slate at all. Vertical, not diagonal: the board is a wide
  // 2:1 rectangle, so a corner-to-corner gradient in square texture space stretches into a
  // lopsided diagonal shadow that reads as the board itself being crooked.
  const grad = ctx.createLinearGradient(0, 0, 0, size);
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
