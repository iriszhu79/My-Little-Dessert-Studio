// This study only changes the round, preset vanilla sponge. Other recipes retain
// their existing renderer. Supplied ingredient files are installed separately.
export function isPaintedDemo(s) {
  return s.shape === 0 && s.cake === 0 && !s.customCake;
}
export const demoAssets = {
  materials: { label: "Painted material textures", file: "material-atlas.png" },
  strawberry: {
    label: "Whole strawberry",
    file: "whole_strawberry.png",
    crop: [523, 218, 511, 555],
  },
  strawberryHalf: {
    label: "Strawberry slice",
    file: "strawberry_slice.png",
    crop: [406, 221, 708, 610],
  },
  blueberry: {
    label: "Blueberry",
    file: "blueberry.png",
    crop: [479, 207, 571, 580],
  },
  cream: {
    label: "Cream swirl",
    file: "cream_swirl.png",
    crop: [410, 183, 695, 627],
  },
  spatula: {
    label: "Spatula",
    file: "spatula.png",
    crop: [310, 202, 953, 606],
  },
  bowl: {
    label: "Cream bowl",
    file: "cream_bowl.png",
    crop: [429, 179, 677, 657],
  },
};
export async function loadDemoAssets() {
  const results = await Promise.allSettled(
    Object.values(demoAssets)
      .filter((a) => a.file)
      .map(async (a) => {
        const image = new Image();
        image.src = new URL(`./assets/painted/${a.file}`, import.meta.url).href;
        await image.decode();
        a.image = image;
      }),
  );
  textures.clear();
  if (results.some((r) => r.status === "rejected"))
    throw new Error("Demo artwork unavailable");
}
export function demoAsset(c, name, x, y, width, height) {
  const a = demoAssets[name];
  if (!a?.image) return false;
  const crop = a.crop || [0, 0, a.image.width, a.image.height];
  const scale = Math.min(width / crop[2], height / crop[3]);
  const w = crop[2] * scale,
    h = crop[3] * scale;
  c.drawImage(a.image, ...crop, x - w / 2, y - h / 2, w, h);
  return true;
}
const textures = new Map();
const strokeCanvas = document.createElement("canvas");
strokeCanvas.width = 600;
strokeCanvas.height = 540;
const noise = (n) => {
  const f = Math.sin(n * 12.9898 + 78.233) * 43758.5453;
  return f - Math.floor(f);
};
function oval(c, x, y, rx, ry, color) {
  c.beginPath();
  c.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
  c.fillStyle = color;
  c.fill();
}
function rim(c, y = 0) {
  c.beginPath();
  c.ellipse(0, y, 245, 160, 0, 0, Math.PI * 2);
}
function body(depth) {
  const p = new Path2D();
  for (let y = 0; y <= depth; y += 2)
    p.ellipse(0, y, 245, 160, 0, 0, Math.PI * 2);
  return p;
}
function layer(depth, color, kind) {
  const key = `${depth}:${color}:${kind}`;
  if (textures.has(key)) return textures.get(key);
  const canvas = document.createElement("canvas");
  canvas.width = 600;
  canvas.height = 540;
  const c = canvas.getContext("2d");
  c.translate(300, 190);
  const sponge = kind === "sponge";
  c.save();
  c.clip(body(depth));
  const shade = c.createLinearGradient(-245, -100, 245, 230);
  shade.addColorStop(0, sponge ? "#f9df9e" : color);
  shade.addColorStop(0.45, sponge ? "#f2cd82" : color);
  shade.addColorStop(1, sponge ? "#dca45c" : color);
  c.fillStyle = shade;
  c.fillRect(-280, -180, 560, depth + 400);
  const wash = c.createLinearGradient(-240, 0, 260, 120);
  wash.addColorStop(0, "#fff9da45");
  wash.addColorStop(0.5, "#fff9e400");
  wash.addColorStop(1, sponge ? "#a46c3825" : "#b0856633");
  c.fillStyle = wash;
  c.fillRect(-280, -180, 560, depth + 400);
  if (sponge) {
    for (let i = 0; i < 1400; i++) {
      const x = noise(i * 3 + 1) * 510 - 255,
        y = noise(i * 3 + 2) * (depth + 335) - 165;
      const r = 0.45 + noise(i * 3 + 3) ** 2 * 2.4;
      oval(
        c,
        x,
        y,
        r,
        r * (0.45 + noise(i + 92) * 0.45),
        i % 4 ? "#b77b3950" : "#fff5c58c",
      );
      if (i % 3 === 0) oval(c, x - 0.5, y - 0.6, r * 0.6, r * 0.3, "#fff3c584");
    }
  } else {
    c.lineCap = "round";
    for (
      let i = 0;
      i < (demoAssets.materials.image && color === "#fff2dc" ? 0 : 75);
      i++
    ) {
      const y = 12 + i * 4.3,
        x = -245 + noise(i + 3) * 70;
      c.beginPath();
      c.moveTo(x, y);
      c.bezierCurveTo(-120, y + 12, 80, y - 7, 245, y - 18);
      c.strokeStyle = i % 3 ? "#fffaf26a" : "#b68b5f20";
      c.lineWidth = 1 + noise(i + 5) * 2;
      c.stroke();
    }
    for (let i = 0; i < 750; i++)
      oval(
        c,
        noise(i * 2) * 510 - 255,
        noise(i * 2 + 1) * (depth + 330) - 160,
        0.45,
        0.3,
        "#fffaf238",
      );
  }
  if (demoAssets.materials.image && (sponge || color === "#fff2dc")) {
    c.save();
    c.globalAlpha = sponge ? 0.72 : 0.85;
    c.drawImage(
      demoAssets.materials.image,
      629,
      sponge ? 2 : 629,
      623,
      623,
      -250,
      -170,
      500,
      depth + 335,
    );
    c.globalAlpha = 1;
    c.fillStyle = wash;
    c.fillRect(-280, -180, 560, depth + 400);
    c.restore();
  }
  c.restore();
  c.save();
  rim(c);
  c.clip();
  const top = c.createRadialGradient(-90, -75, 20, 45, 35, 320);
  top.addColorStop(0, sponge ? "#fff1c9" : color);
  top.addColorStop(1, sponge ? "#efca84" : color);
  c.fillStyle = top;
  c.fillRect(-260, -170, 520, 340);
  if (sponge) {
    for (let i = 0; i < 510; i++) {
      const x = noise(i * 5) * 500 - 250,
        y = noise(i * 5 + 1) * 330 - 165,
        r = 0.45 + noise(i * 5 + 2) * 1.65;
      oval(c, x, y, r, r * 0.65, i % 3 ? "#be8a434a" : "#fff6d5aa");
    }
  } else {
    c.lineCap = "round";
    for (
      let i = 0;
      i < (demoAssets.materials.image && color === "#fff2dc" ? 0 : 48);
      i++
    ) {
      const y = -148 + i * 6.4;
      c.beginPath();
      c.moveTo(-245, y);
      c.bezierCurveTo(-110, y - 20 + noise(i) * 10, 65, y + 28, 245, y - 6);
      c.strokeStyle = i % 3 ? "#fffaf196" : "#b88e6021";
      c.lineWidth = 2 + noise(i + 77) * 4;
      c.stroke();
    }
    for (let i = 0; i < 550; i++)
      oval(
        c,
        noise(i * 5) * 500 - 250,
        noise(i * 5 + 1) * 330 - 165,
        0.5,
        0.32,
        "#fff9ee35",
      );
  }
  if (demoAssets.materials.image && (sponge || color === "#fff2dc")) {
    c.save();
    c.globalAlpha = sponge ? 0.68 : 0.9;
    c.drawImage(
      demoAssets.materials.image,
      2,
      sponge ? 2 : 629,
      623,
      623,
      -245,
      -160,
      490,
      320,
    );
    c.restore();
  }
  c.restore();
  c.strokeStyle = sponge ? "#b47a3c91" : "#bf98634f";
  c.lineWidth = sponge ? 2 : 1.5;
  rim(c);
  c.stroke();
  if (textures.size > 12) textures.delete(textures.keys().next().value);
  textures.set(key, canvas);
  return canvas;
}
function creamMask(c, p, strokes) {
  c.save();
  c.clip(p);
  c.lineWidth = 86;
  c.lineJoin = "round";
  c.lineCap = "round";
  c.beginPath();
  for (const points of strokes || []) {
    if (!points.length) continue;
    c.moveTo(points[0].x, points[0].y);
    for (const pt of points) c.lineTo(pt.x, pt.y);
  }
  c.strokeStyle = "#fff";
  c.stroke();
  for (const pts of strokes || [])
    if (pts.length) oval(c, pts[0].x, pts[0].y, 43, 43, "#fff");
  c.restore();
}
function strawberryInFilling(c, x, y, size) {
  if (demoAsset(c, "strawberryHalf", x, y, size * 1.4, size)) return;
  c.save();
  c.translate(x, y);
  c.scale(size / 30, size / 30);
  c.beginPath();
  c.moveTo(0, -14);
  c.bezierCurveTo(8, -13, 20, 10, 15, 13);
  c.quadraticCurveTo(0, 20, -15, 13);
  c.bezierCurveTo(-20, 10, -8, -13, 0, -14);
  const g = c.createRadialGradient(0, 1, 1, 0, 0, 23);
  g.addColorStop(0, "#ffe3c8");
  g.addColorStop(1, "#db7568");
  c.fillStyle = g;
  c.fill();
  for (let i = -2; i <= 2; i++) {
    c.beginPath();
    c.moveTo(0, -10);
    c.quadraticCurveTo(i * 3, 3, i * 6, 12);
    c.strokeStyle = "#fff3d296";
    c.lineWidth = 0.8;
    c.stroke();
  }
  c.restore();
}
export function drawPaintedCake(c, s, o) {
  const {
    depth,
    p,
    cream,
    strokes,
    showCream,
    coverage,
    stage,
    useBase,
    drop,
    effect,
  } = o;
  const full = (s.frostingMode || "full") === "full" && !useBase && stage >= 4;
  const completing = effect?.kind === "cream-complete";
  const covered = Math.min(1, coverage / 100);
  const amount = full
    ? s.frosted
      ? completing
        ? covered + (1 - covered) * effect.progress
        : 1
      : covered
    : 0;
  c.drawImage(layer(depth, "#efd09b", "sponge"), -300, -190);
  // The visible sandwich follows the chosen recipe; it is covered by Full frosting.
  if (s.layered && stage >= 3 && amount < 1) {
    c.save();
    c.clip(body(depth));
    const outsideTop = new Path2D();
    outsideTop.rect(-300, -190, 600, depth + 390);
    outsideTop.addPath(p);
    c.clip(outsideTop, "evenodd");
    c.globalAlpha = 1 - amount;
    c.lineWidth = 30;
    c.strokeStyle =
      s.customFilling ||
      [
        "#fff2dc",
        "#f3c4cf",
        "#d9cae9",
        "#f6df97",
        "#c4dfe9",
        "#86543e",
        "#a9ba80",
      ][s.fillingCream];
    rim(c, 70);
    c.stroke();
    for (const t of s.fillingToppings || [])
      if (t.y > 45) {
        const x = t.x,
          y = 70 + 160 * Math.sqrt(Math.max(0, 1 - (x / 245) ** 2));
        if (t.type.startsWith("strawberry"))
          strawberryInFilling(c, x, y, 22 * t.scale);
      }
    c.restore();
  }
  if (amount > 0) {
    c.save();
    c.clip(body(depth));
    const outside = new Path2D();
    outside.rect(-300, -190, 600, depth + 390);
    outside.addPath(p);
    c.clip(outside, "evenodd");
    c.globalAlpha = amount;
    c.drawImage(layer(depth, cream, "cream"), -300, -190);
    c.restore();
  }
  c.save();
  c.translate(0, drop);
  // A separate masked texture follows the user's actual paths, never a full-cake image.
  if (strokes?.length && (!showCream || completing)) {
    const mask = strokeCanvas;
    const m = mask.getContext("2d");
    m.setTransform(1, 0, 0, 1, 0, 0);
    m.globalCompositeOperation = "source-over";
    m.clearRect(0, 0, 600, 540);
    m.translate(300, 190);
    creamMask(m, p, strokes);
    m.setTransform(1, 0, 0, 1, 0, 0);
    m.globalCompositeOperation = "source-in";
    m.drawImage(layer(depth, cream, "cream"), 0, 0);
    c.drawImage(mask, -300, -190);
  }
  if (showCream) {
    c.save();
    c.clip(p);
    if (effect?.kind === "cream-complete") c.globalAlpha = effect.progress;
    c.drawImage(layer(depth, cream, "cream"), -300, -190);
    c.restore();
    c.save();
    c.strokeStyle = cream;
    c.lineWidth = 9;
    rim(c, 2);
    c.stroke();
    c.restore();
  }
  c.restore();
}
