// Original transparent artwork is retained unchanged. The source rectangles exclude
// stray transparent padding; every texture shares the cake's orthographic view.
export const plates = [
  { name: "Classic Ivory" },
  {
    name: "Blue Ribbon",
    file: "Blue_Ribbon.png",
    crop: [244, 98, 690, 1086],
    long: true,
  },
  { name: "Matcha Dots", file: "Matcha_Dots.png", crop: [329, 69, 875, 876] },
  {
    name: "Pink Gingham",
    file: "Pink_Gingham.png",
    crop: [151, 182, 933, 910],
  },
  { name: "Blue Stripes", file: "Blue_Stripes.png", crop: [342, 75, 844, 844] },
  {
    name: "Garden Flowers",
    file: "Garden_Flowers.png",
    crop: [288, 59, 930, 907],
  },
];
export async function loadPlateAssets() {
  const results = await Promise.allSettled(
    plates
      .filter((p) => p.file)
      .map(async (p) => {
        const image = new Image();
        image.src = new URL(`./assets/plates/${p.file}`, import.meta.url).href;
        await image.decode();
        p.image = image;
        // Use the exact same cropped artwork for the material tray and final scene.
        const thumb = document.createElement("canvas");
        thumb.width = p.long ? 126 : 100;
        thumb.height = p.long ? 80 : 100;
        const ctx = thumb.getContext("2d");
        ctx.translate(thumb.width / 2, thumb.height / 2);
        if (p.long) ctx.rotate(Math.PI / 2);
        const scale = p.long
          ? 120 / p.crop[3]
          : 96 / Math.max(p.crop[2], p.crop[3]);
        ctx.scale(scale, scale);
        ctx.drawImage(
          image,
          ...p.crop,
          -p.crop[2] / 2,
          -p.crop[3] / 2,
          p.crop[2],
          p.crop[3],
        );
        p.thumbnail = thumb.toDataURL();
      }),
  );
  if (results.some((result) => result.status === "rejected"))
    throw new Error("Plate artwork unavailable");
}
function imagePlate(c, plate) {
  if (!plate.scene) {
    plate.scene = document.createElement("canvas");
    plate.scene.width = 1000;
    plate.scene.height = 900;
    projectPlate(plate.scene.getContext("2d"), plate);
  }
  c.drawImage(plate.scene, 0, 0);
}
function projectPlate(c, plate) {
  const [sx, sy, sw, sh] = plate.crop;
  c.save();
  c.translate(500, 552);
  c.scale(1, 0.65);
  if (plate.long) c.rotate(Math.PI / 2);
  const scale = (plate.long ? 850 : 790) / (plate.long ? sh : Math.max(sw, sh));
  c.scale(scale, scale);
  c.shadowColor = "#73543a35";
  c.shadowBlur = 20 / scale;
  c.shadowOffsetY = 13 / scale;
  c.drawImage(plate.image, sx, sy, sw, sh, -sw / 2, -sh / 2, sw, sh);
  c.restore();
}
export const cakeColors = ["#ecd3a5", "#80513d", "#e7a3aa", "#a6b77b"];
export const creamColors = [
  "#fff2dc",
  "#f3c4cf",
  "#d9cae9",
  "#f6df97",
  "#c4dfe9",
  "#86543e",
  "#a9ba80",
];
export const toppingNames = {
  strawberry: "Strawberry",
  strawberryHalf: "Strawberry half",
  strawberryFan: "Strawberry fan",
  kiwi: "Kiwi slice",
  orange: "Orange wedge",
  mango: "Mango fan",
  mangoCubes: "Mango cubes",
  banana: "Banana slices",
  mint: "Mint leaves",
  grapes: "Green grapes",
  blueberry: "Blueberry",
  cherry: "Cherries",
  lemon: "Lemon slice",
  cookie: "Cookie",
  chocolate: "Chocolate",
  macaron: "Macaron",
  flower: "Daisy",
  bow: "Ribbon bow",
  pearls: "Sugar pearls",
  cream: "Cream swirl",
  text: "Sweet lettering",
};
export function cakePath(shape, scale = 1) {
  const p = new Path2D();
  if (shape === 0) p.ellipse(0, 0, 245 * scale, 160 * scale, 0, 0, Math.PI * 2);
  if (shape === 1) {
    p.moveTo(0, 160 * scale);
    p.bezierCurveTo(
      -400 * scale,
      -20 * scale,
      -220 * scale,
      -235 * scale,
      0,
      -95 * scale,
    );
    p.bezierCurveTo(
      220 * scale,
      -235 * scale,
      400 * scale,
      -20 * scale,
      0,
      160 * scale,
    );
  }
  if (shape === 2) {
    p.roundRect(
      -222 * scale,
      -155 * scale,
      444 * scale,
      310 * scale,
      35 * scale,
    );
  }
  if (shape === 3) {
    for (let i = 0; i <= 180; i++) {
      const a = (i / 180) * Math.PI * 2;
      const r = 1 + 0.12 * Math.cos(a * 6);
      const x = Math.cos(a) * 215 * scale * r,
        y = Math.sin(a) * 145 * scale * r;
      i ? p.lineTo(x, y) : p.moveTo(x, y);
    }
    p.closePath();
  }
  return p;
}
function ellipse(c, x, y, rx, ry, color) {
  c.fillStyle = color;
  c.beginPath();
  c.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
  c.fill();
}
function stroke(c, color, width = 2) {
  c.strokeStyle = color;
  c.lineWidth = width;
  c.stroke();
}
function fruitSlice(c, type) {
  if (type === "strawberryHalf") {
    c.beginPath();
    c.moveTo(0, 34);
    c.bezierCurveTo(-7, 35, -35, -3, -29, -24);
    c.bezierCurveTo(-24, -41, 20, -41, 28, -23);
    c.bezierCurveTo(36, -3, 8, 31, 0, 34);
    c.closePath();
    const g = c.createLinearGradient(-25, -25, 25, 28);
    g.addColorStop(0, "#ed6a70");
    g.addColorStop(0.5, "#d94054");
    g.addColorStop(1, "#ab3046");
    c.fillStyle = g;
    c.fill();
    stroke(c, "#af3b4c", 1.5);
    c.save();
    c.clip();
    c.beginPath();
    c.moveTo(-2, 28);
    c.bezierCurveTo(-13, 9, -26, -6, -23, -23);
    c.bezierCurveTo(-17, -36, 15, -36, 22, -23);
    c.bezierCurveTo(23, -3, 7, 15, -2, 28);
    c.fillStyle = "#fff0ce";
    c.fill();
    c.beginPath();
    c.moveTo(-2, 24);
    c.bezierCurveTo(-7, 4, -22, -4, -19, -21);
    c.bezierCurveTo(-13, -30, 12, -31, 18, -20);
    c.bezierCurveTo(21, -5, 7, 10, -2, 24);
    c.fillStyle = "#ef9a9a";
    c.fill();
    c.beginPath();
    c.moveTo(-1, 20);
    c.bezierCurveTo(-4, 0, -11, -5, -7, -18);
    c.quadraticCurveTo(0, -24, 7, -17);
    c.quadraticCurveTo(10, -5, -1, 20);
    c.fillStyle = "#ffe7ce";
    c.fill();
    for (let i = 0; i < 14; i++) {
      const a = (i * Math.PI * 2) / 14;
      const x = Math.cos(a) * 23,
        y = -8 + Math.sin(a) * 24;
      ellipse(c, x, y, 1.2, 2, "#ffeab2");
    }
    c.restore();
    return true;
  }
  if (type === "strawberryFan") {
    for (let i = 0; i < 4; i++) {
      c.save();
      c.translate((i - 1.5) * 12, Math.abs(i - 1.5) * 3);
      c.rotate((i - 1.5) * 0.24);
      c.scale(0.68, 0.82);
      fruitSlice(c, "strawberryHalf");
      c.restore();
    }
    return true;
  }
  if (type === "kiwi") {
    ellipse(c, 0, 0, 35, 28, "#8a8153");
    ellipse(c, 0, -1, 32, 25, "#afd16d");
    const g = c.createRadialGradient(0, -1, 4, 0, -1, 30);
    g.addColorStop(0, "#f1efb3");
    g.addColorStop(0.42, "#c7df82");
    g.addColorStop(1, "#8fb447");
    ellipse(c, 0, -1, 30, 23, g);
    for (let i = 0; i < 28; i++) {
      const a = (i * Math.PI * 2) / 28;
      c.beginPath();
      c.moveTo(Math.cos(a) * 9, -1 + Math.sin(a) * 6);
      c.lineTo(Math.cos(a) * 28, -1 + Math.sin(a) * 21);
      stroke(c, "#e2e79c", 1);
      c.save();
      c.translate(Math.cos(a) * 19, -1 + Math.sin(a) * 14);
      c.rotate(a);
      ellipse(c, 0, 0, 2.2, 1.1, "#595b32");
      c.restore();
    }
    ellipse(c, 0, -1, 8, 6, "#f6f0c1");
    return true;
  }
  if (type === "orange") {
    c.rotate(-0.25);
    c.beginPath();
    c.ellipse(0, -12, 38, 37, 0, 0, Math.PI);
    c.closePath();
    c.fillStyle = "#ec9d39";
    c.fill();
    c.beginPath();
    c.ellipse(0, -12, 34, 32, 0, 0, Math.PI);
    c.closePath();
    c.fillStyle = "#fff1bd";
    c.fill();
    c.beginPath();
    c.ellipse(0, -12, 29, 27, 0, 0, Math.PI);
    c.closePath();
    c.fillStyle = "#f5b84d";
    c.fill();
    for (let i = 1; i < 7; i++) {
      const a = (i * Math.PI) / 7;
      c.beginPath();
      c.moveTo(0, -12);
      c.lineTo(Math.cos(a) * 30, -12 + Math.sin(a) * 28);
      stroke(c, "#fff0bf", 2);
    }
    return true;
  }
  if (type === "mango") {
    for (let i = 0; i < 5; i++) {
      c.save();
      c.translate((i - 2) * 11, (i - 2) ** 2 * 1.3);
      c.rotate((i - 2) * 0.16);
      c.beginPath();
      c.moveTo(-11, 22);
      c.bezierCurveTo(-23, 0, -8, -33, 9, -27);
      c.bezierCurveTo(18, -20, 14, 13, -11, 22);
      const g = c.createLinearGradient(-15, -20, 15, 20);
      g.addColorStop(0, "#ffdf74");
      g.addColorStop(0.7, "#efb136");
      g.addColorStop(1, "#e99427");
      c.fillStyle = g;
      c.fill();
      stroke(c, "#dba039", 1);
      c.restore();
    }
    return true;
  }
  if (type === "mangoCubes") {
    for (const [x, y] of [
      [-19, -10],
      [9, -17],
      [23, 6],
      [-4, 12],
      [-24, 17],
    ]) {
      c.save();
      c.translate(x, y);
      c.rotate(0.2);
      c.fillStyle = "#eead37";
      c.beginPath();
      c.roundRect(-11, -10, 23, 22, 4);
      c.fill();
      c.fillStyle = "#ffdb69";
      c.beginPath();
      c.roundRect(-11, -14, 23, 19, 4);
      c.fill();
      c.beginPath();
      c.moveTo(-7, -11);
      c.lineTo(7, -11);
      stroke(c, "#fff0aa", 2);
      c.restore();
    }
    return true;
  }
  if (type === "banana") {
    for (const [x, y, r] of [
      [-15, 5, -0.3],
      [14, -5, 0.2],
    ]) {
      c.save();
      c.translate(x, y);
      c.rotate(r);
      ellipse(c, 0, 3, 22, 22, "#d7b96b");
      ellipse(c, 0, 0, 22, 21, "#f4dda0");
      ellipse(c, 0, 0, 18, 17, "#fff0be");
      for (let i = 0; i < 5; i++) {
        const a = (i * 2 * Math.PI) / 5;
        c.beginPath();
        c.moveTo(0, 0);
        c.lineTo(Math.cos(a) * 12, Math.sin(a) * 12);
        stroke(c, "#e3c88d", 1);
        ellipse(c, Math.cos(a) * 5, Math.sin(a) * 5, 1, 1.5, "#ae8c50");
      }
      c.restore();
    }
    return true;
  }
  if (type === "grapes") {
    c.beginPath();
    c.moveTo(-9, -17);
    c.quadraticCurveTo(0, -32, 16, -29);
    stroke(c, "#8b955e", 2);
    for (const [x, y, rx, ry] of [
      [-15, -8, 17, 23],
      [14, -4, 18, 24],
      [0, 18, 18, 23],
    ]) {
      const g = c.createRadialGradient(x - 6, y - 9, 2, x, y, 26);
      g.addColorStop(0, "#ecedb9");
      g.addColorStop(0.35, "#c9db89");
      g.addColorStop(1, "#8eb555");
      ellipse(c, x, y, rx, ry, g);
      ellipse(c, x - 5, y - 8, 4, 8, "#ffffff65");
      c.beginPath();
      c.ellipse(x + 1, y, rx - 2, ry - 2, 0.08, -0.2, 1.2);
      stroke(c, "#78984935", 1);
    }
    return true;
  }
  if (type === "mint") {
    for (let i = 0; i < 3; i++) {
      c.save();
      c.rotate(-0.8 + i * 0.8);
      c.beginPath();
      c.moveTo(0, 16);
      c.bezierCurveTo(-30, -2, -23, -31, 0, -40);
      c.bezierCurveTo(21, -19, 24, -2, 0, 16);
      c.fillStyle = ["#8ca977", "#6f9663", "#9db985"][i];
      c.fill();
      c.beginPath();
      c.moveTo(0, 16);
      c.lineTo(0, -34);
      stroke(c, "#d1dca9", 1);
      for (let y = -24; y < 8; y += 8) {
        c.beginPath();
        c.moveTo(0, y);
        c.lineTo(-12, y - 5);
        c.moveTo(0, y);
        c.lineTo(12, y - 5);
        stroke(c, "#c1d09a", 0.8);
      }
      c.restore();
    }
    return true;
  }
  return false;
}
export function drawBowl(c, x, y, color, scale = 1) {
  c.save();
  c.translate(x, y);
  c.scale(scale, scale);
  c.save();
  c.filter = "blur(7px)";
  ellipse(c, 6, 40, 83, 16, "#87654520");
  c.restore();
  c.beginPath();
  c.moveTo(-85, -3);
  c.bezierCurveTo(-82, 65, 77, 65, 85, -3);
  c.closePath();
  const g = c.createLinearGradient(-85, 0, 85, 30);
  g.addColorStop(0, "#d6d9d3");
  g.addColorStop(0.4, "#fffdf5");
  g.addColorStop(1, "#c4cbbf");
  c.fillStyle = g;
  c.fill();
  ellipse(c, 0, -3, 85, 33, "#fefcf2");
  ellipse(c, 0, -4, 75, 26, color);
  c.beginPath();
  c.ellipse(-4, -7, 58, 17, 0, 0.3, 5.6);
  stroke(c, "#fff9e785", 3);
  c.beginPath();
  c.ellipse(3, 0, 31, 10, 0, 2.7, 6);
  stroke(c, "#fff9e75c", 2);
  c.restore();
}
function spatula(c, x, y, rotation = -0.7, scale = 1) {
  c.save();
  c.translate(x, y);
  c.rotate(rotation);
  c.scale(scale, scale);
  c.save();
  c.shadowBlur = 8;
  c.shadowColor = "#7a56382b";
  c.shadowOffsetY = 5;
  c.fillStyle = "#93674b";
  c.beginPath();
  c.roundRect(-9, 6, 18, 74, 9);
  c.fill();
  c.fillStyle = "#d0b28d";
  c.fillRect(-8, 8, 16, 8);
  const g = c.createLinearGradient(-21, 0, 20, 0);
  g.addColorStop(0, "#e2e4dc");
  g.addColorStop(0.4, "#fffdf5");
  g.addColorStop(1, "#b7c1b8");
  c.fillStyle = g;
  c.beginPath();
  c.roundRect(-20, -84, 40, 100, 16);
  c.fill();
  c.restore();
  c.beginPath();
  c.moveTo(-9, -67);
  c.lineTo(-9, -4);
  stroke(c, "#ffffffc9", 3);
  c.restore();
}
const geometry = document.createElement("canvas").getContext("2d"),
  edges = new Map();
function surfaceEdge(shape, a) {
  const key = shape + ":" + a;
  if (edges.has(key)) return edges.get(key);
  let lo = 0,
    hi = 380;
  const path = cakePath(shape);
  for (let i = 0; i < 11; i++) {
    const r = (lo + hi) / 2;
    if (geometry.isPointInPath(path, Math.cos(a) * r, Math.sin(a) * r)) lo = r;
    else hi = r;
  }
  const p = { x: Math.cos(a) * lo * 0.985, y: Math.sin(a) * lo * 0.985 };
  edges.set(key, p);
  return p;
}
function blend(a, b, t) {
  return (
    "#" +
    [1, 3, 5]
      .map((i) =>
        Math.round(
          parseInt(a.slice(i, i + 2), 16) * (1 - t) +
            parseInt(b.slice(i, i + 2), 16) * t,
        )
          .toString(16)
          .padStart(2, "0"),
      )
      .join("")
  );
}
export function drawTopping(
  c,
  type,
  x = 0,
  y = 0,
  size = 1,
  rotation = 0,
  text = "Happy Day",
) {
  c.save();
  c.translate(x, y);
  c.rotate(rotation);
  c.scale(size, size);
  c.lineCap = "round";
  c.lineJoin = "round";
  if (fruitSlice(c, type)) {
    c.restore();
    return;
  }
  if (type === "strawberry") {
    c.rotate(-0.2);
    c.beginPath();
    c.moveTo(0, 31);
    c.bezierCurveTo(-10, 30, -36, -4, -27, -20);
    c.bezierCurveTo(-20, -35, -6, -31, 0, -26);
    c.bezierCurveTo(23, -38, 39, -19, 25, 3);
    c.bezierCurveTo(15, 21, 7, 32, 0, 31);
    const g = c.createLinearGradient(-25, -20, 25, 30);
    g.addColorStop(0, "#f18c7d");
    g.addColorStop(0.5, "#dc5659");
    g.addColorStop(1, "#b73d49");
    c.fillStyle = g;
    c.fill();
    stroke(c, "#b95150", 1);
    for (const [a, b] of [
      [-15, -15],
      [4, -14],
      [18, -7],
      [-18, -1],
      [-3, 0],
      [10, 7],
      [-7, 13],
      [1, 23],
    ]) {
      ellipse(c, a, b, 1.5, 2.5, "#ffe3a6");
    }
    c.fillStyle = "#6b9058";
    c.beginPath();
    c.moveTo(0, -22);
    for (let i = 0; i < 5; i++) {
      let a = i * 1.256;
      c.lineTo(Math.sin(a) * 23, -25 + Math.cos(a) * 11);
      c.lineTo(Math.sin(a + 0.6) * 6, -25 + Math.cos(a + 0.6) * 4);
    }
    c.closePath();
    c.fill();
  } else if (type === "blueberry") {
    const g = c.createRadialGradient(-7, -9, 1, 0, 0, 24);
    g.addColorStop(0, "#a5a5c9");
    g.addColorStop(0.45, "#6a769c");
    g.addColorStop(1, "#454c76");
    ellipse(c, 0, 0, 23, 22, g);
    c.fillStyle = "#434965";
    c.beginPath();
    for (let i = 0; i < 10; i++) {
      const a = (i * Math.PI) / 5,
        r = i % 2 ? 4 : 9;
      i
        ? c.lineTo(Math.cos(a) * r, Math.sin(a) * r - 7)
        : c.moveTo(Math.cos(a) * r, Math.sin(a) * r - 7);
    }
    c.closePath();
    c.fill();
    ellipse(c, -9, -10, 4, 3, "#d2d2e25c");
  } else if (type === "cherry") {
    c.beginPath();
    c.moveTo(-14, 4);
    c.quadraticCurveTo(-9, -40, 20, -45);
    c.quadraticCurveTo(5, -23, 17, 8);
    stroke(c, "#7c8051", 3);
    c.beginPath();
    c.moveTo(14, -38);
    c.quadraticCurveTo(47, -49, 39, -31);
    c.quadraticCurveTo(21, -27, 14, -38);
    c.fillStyle = "#7c9859";
    c.fill();
    for (const [a, b] of [
      [-15, 12],
      [18, 16],
    ]) {
      let g = c.createRadialGradient(a - 6, b - 7, 1, a, b, 21);
      g.addColorStop(0, "#ec8684");
      g.addColorStop(0.5, "#c94e60");
      g.addColorStop(1, "#97374f");
      ellipse(c, a, b, 20, 20, g);
      ellipse(c, a - 6, b - 8, 4, 3, "#ffffff80");
    }
  } else if (type === "lemon") {
    ellipse(c, 0, 0, 32, 29, "#e9bf55");
    ellipse(c, 0, 0, 28, 25, "#fff7cb");
    ellipse(c, 0, 0, 24, 21, "#f6d677");
    for (let i = 0; i < 8; i++) {
      const a = (i * Math.PI) / 4;
      c.beginPath();
      c.moveTo(0, 0);
      c.lineTo(Math.cos(a) * 25, Math.sin(a) * 22);
      stroke(c, "#fff9d8", 2.5);
    }
    ellipse(c, 0, 0, 4, 4, "#fff9d8");
  } else if (type === "cookie") {
    c.beginPath();
    for (let i = 0; i < 40; i++) {
      const a = (i * Math.PI) / 20,
        r = i % 2 ? 30 : 32;
      i
        ? c.lineTo(Math.cos(a) * r, Math.sin(a) * r * 0.9)
        : c.moveTo(Math.cos(a) * r, Math.sin(a) * r * 0.9);
    }
    c.closePath();
    c.fillStyle = "#d6a36c";
    c.fill();
    stroke(c, "#ba8256", 2);
    ellipse(c, 0, 0, 26, 23, "#eac08a");
    for (const [a, b] of [
      [-13, -9],
      [8, -13],
      [16, 6],
      [-6, 10],
      [-18, 7],
      [2, -1],
    ]) {
      ellipse(c, a, b, 4, 3, "#79513c");
    }
    for (let i = 0; i < 18; i++) {
      const a = i * 2.4,
        r = 7 + (i % 5) * 4;
      ellipse(c, Math.cos(a) * r, Math.sin(a) * r, 1, 1, "#b98b61");
    }
  } else if (type === "chocolate") {
    c.rotate(-0.3);
    c.fillStyle = "#684335";
    c.beginPath();
    c.roundRect(-30, -28, 60, 56, 4);
    c.fill();
    for (let i = 0; i < 2; i++)
      for (let j = 0; j < 2; j++) {
        c.fillStyle = "#885b46";
        c.fillRect(-26 + i * 28, -24 + j * 26, 24, 22);
        c.beginPath();
        c.moveTo(-24 + i * 28, -21 + j * 26);
        c.lineTo(-5 + i * 28, -21 + j * 26);
        stroke(c, "#b17f60", 2);
      }
  } else if (type === "macaron") {
    c.rotate(-0.2);
    ellipse(c, 0, 10, 34, 15, "#ad8499");
    c.fillStyle = "#f9e8d6";
    c.fillRect(-32, -2, 64, 14);
    ellipse(c, 0, 8, 32, 9, "#f9e8d6");
    ellipse(c, 0, -5, 35, 21, "#d3a3b9");
    ellipse(c, -2, -12, 29, 15, "#e8becd");
    for (let i = 0; i < 13; i++)
      ellipse(c, -29 + i * 4.8, 4 + Math.sin(i) * 2, 2, 2, "#b985a0");
  } else if (type === "flower") {
    for (let i = 0; i < 5; i++) {
      c.save();
      c.rotate((i * Math.PI * 2) / 5);
      ellipse(c, 0, -15, 11, 17, "#fff8e9");
      c.restore();
    }
    ellipse(c, 0, 0, 10, 9, "#e9bf69");
    for (let i = 0; i < 7; i++) {
      let a = i * 2.4;
      ellipse(c, Math.cos(a) * 5, Math.sin(a) * 5, 1.5, 1.5, "#b99143");
    }
  } else if (type === "bow") {
    c.fillStyle = "#d48c9c";
    c.beginPath();
    c.moveTo(0, 0);
    c.bezierCurveTo(-58, -43, -45, 39, 0, 0);
    c.moveTo(0, 0);
    c.bezierCurveTo(58, -43, 45, 39, 0, 0);
    c.fill();
    c.fillStyle = "#e6a8b6";
    c.beginPath();
    c.moveTo(-4, 3);
    c.lineTo(-25, 39);
    c.lineTo(-10, 34);
    c.lineTo(-2, 42);
    c.lineTo(8, 4);
    c.moveTo(4, 3);
    c.lineTo(25, 36);
    c.lineTo(12, 33);
    c.lineTo(5, 41);
    c.lineTo(-7, 4);
    c.fill();
    ellipse(c, 0, 0, 8, 10, "#be7385");
  } else if (type === "pearls") {
    for (let i = 0; i < 9; i++) {
      let a = i * 2.4,
        r = i === 0 ? 0 : 12 + i;
      ellipse(
        c,
        Math.cos(a) * r,
        Math.sin(a) * r * 0.7,
        5,
        5,
        ["#e7adba", "#faf4dd", "#d9bd81"][i % 3],
      );
      ellipse(
        c,
        Math.cos(a) * r - 1,
        Math.sin(a) * r * 0.7 - 2,
        1.5,
        1.5,
        "#fffefa",
      );
    }
  } else if (type === "cream") {
    for (let i = 0; i < 9; i++) {
      c.save();
      c.rotate((i * Math.PI * 2) / 9);
      c.beginPath();
      c.moveTo(0, 0);
      c.bezierCurveTo(-31, -4, -24, -38, 0, -28);
      c.bezierCurveTo(18, -14, 19, -9, 0, 0);
      c.fillStyle = i % 2 ? "#fff7e6" : "#f0dfc6";
      c.fill();
      c.restore();
    }
    ellipse(c, 0, -2, 10, 11, "#fff8e9");
    c.beginPath();
    c.moveTo(-4, -6);
    c.quadraticCurveTo(15, -17, 6, -25);
    c.quadraticCurveTo(25, -9, 7, 2);
    c.fillStyle = "#fff8e9";
    c.fill();
  } else if (type === "text") {
    c.font = "italic 25px Georgia, serif";
    c.textAlign = "center";
    c.textBaseline = "middle";
    c.lineWidth = 3;
    c.strokeStyle = "#fff2de";
    c.strokeText(text, 0, 0);
    c.fillStyle = "#935966";
    c.fillText(text, 0, 0);
  }
  c.restore();
}
function backdrop(c, bg) {
  c.fillStyle = ["#f3eadb", "#f5e0dc", "#cfa77f", "#e6ead5"][bg];
  c.fillRect(0, 0, 1000, 900);
  if (bg === 1 || bg === 3) {
    const color = bg === 1 ? "#d99fa12b" : "#9ab58b2e";
    c.fillStyle = color;
    for (let i = 0; i < 1000; i += 100) {
      c.fillRect(i, 0, 48, 900);
      c.fillRect(0, i, 1000, 48);
    }
    if (bg === 3) {
      for (let i = 0; i < 28; i++) {
        const x = (i * 197) % 1000,
          y = (i * 311) % 900;
        c.save();
        c.translate(x, y);
        c.scale(0.35, 0.35);
        drawTopping(c, "flower");
        c.restore();
      }
    }
  }
  if (bg === 2) {
    for (let y = 0; y < 900; y += 110) {
      c.beginPath();
      c.moveTo(0, y);
      c.lineTo(1000, y + 10);
      stroke(c, "#a7795440", 3);
      for (let j = 0; j < 6; j++) {
        c.beginPath();
        c.moveTo(0, y + j * 15 + 12);
        c.bezierCurveTo(
          320,
          y + j * 15 - 8,
          550,
          y + j * 15 + 28,
          1000,
          y + j * 15 + 5,
        );
        stroke(c, "#e9c49b50", 1.3);
      }
    }
  }
  const light = c.createRadialGradient(350, 200, 40, 500, 450, 650);
  light.addColorStop(0, "#ffffff50");
  light.addColorStop(1, "#fff8ee00");
  c.fillStyle = light;
  c.fillRect(0, 0, 1000, 900);
}
function brushMarks(c, p, strokes, cream) {
  // Clip vector brush strokes to the current silhouette, including heart/flower edges.
  c.save();
  c.clip(p);
  c.strokeStyle = cream;
  c.fillStyle = cream;
  c.lineWidth = 86;
  c.lineCap = "round";
  c.lineJoin = "round";
  for (const points of strokes) {
    if (!points.length) continue;
    c.beginPath();
    c.moveTo(points[0].x, points[0].y);
    for (const point of points) c.lineTo(point.x, point.y);
    c.stroke();
    ellipse(c, points[0].x, points[0].y, 43, 43, cream);
    c.save();
    c.strokeStyle = "#fff7e745";
    c.lineWidth = 3;
    for (const offset of [-24, 24]) {
      c.beginPath();
      c.moveTo(points[0].x, points[0].y + offset);
      for (const point of points) c.lineTo(point.x, point.y + offset);
      c.stroke();
    }
    c.restore();
  }
  c.restore();
}
export function render(
  c,
  state,
  {
    selected = null,
    exporting = false,
    stage = 5,
    presentation = false,
    effect = null,
    coverage = 0,
    tool = null,
  } = {},
) {
  stage = presentation ? 7 : stage;
  const workbench = !presentation && stage < 6;
  const showFilling = stage === 2 || (stage === 3 && !state.layered);
  const useBase =
    stage === 1 ||
    stage === 2 ||
    (stage === 3 && !state.layered) ||
    (stage >= 5 && !state.layered && !state.frosted);
  const showCream =
    (useBase && state.baseCream) || (stage >= 4 && state.frosted);
  const cream = useBase
    ? state.customFilling || creamColors[state.fillingCream]
    : state.customCream || creamColors[state.cream];
  const spongeColor = state.customCake || cakeColors[state.cake];
  const undercoat = stage === 4 && !state.layered && state.baseCream;
  const fillingColor = state.customFilling || creamColors[state.fillingCream];
  const strokes = useBase ? state.baseStrokes : state.frosting;
  const progress = effect?.progress ?? 1;
  const reveal = effect?.kind === "cream-complete" ? progress : 1;
  const drop =
    effect?.kind === "sponge"
      ? -75 * (1 - progress) ** 3
      : effect?.kind === "layer"
        ? -150 * (1 - progress) ** 3
        : 0;
  c.clearRect(0, 0, 1000, 900);
  const bg = workbench ? 0 : state.background;
  if (workbench) {
    c.fillStyle = "#f6eee0";
    c.fillRect(0, 0, 1000, 900);
  } else backdrop(c, bg);
  if (
    effect?.kind === "scene" &&
    effect.previousBackground !== undefined &&
    effect.previousBackground !== bg
  ) {
    c.save();
    c.globalAlpha = 1 - progress;
    backdrop(c, effect.previousBackground);
    c.restore();
  }
  c.save();
  const camera = presentation
    ? 0.91 + (effect?.kind === "finish" ? 0.09 * (1 - progress) : 0)
    : effect?.kind === "scene"
      ? 1 + 0.025 * (1 - progress)
      : 1;
  c.translate(500, 450);
  c.scale(camera, camera);
  c.translate(-500, -450);
  // Soft cast shadow and handmade porcelain.
  c.save();
  c.filter = "blur(18px)";
  ellipse(c, 520, 592, 337, 130, "#75523b25");
  c.restore();
  if (workbench) {
    c.save();
    c.filter = "blur(15px)";
    ellipse(c, 510, 831, 167, 38, "#8a66492c");
    c.restore();
    const foot = c.createLinearGradient(360, 770, 625, 850);
    foot.addColorStop(0, "#fffaf0");
    foot.addColorStop(0.5, "#f4e1c9");
    foot.addColorStop(1, "#d8bfa3");
    ellipse(c, 500, 818, 145, 45, foot);
    ellipse(c, 500, 807, 137, 37, "#fcf1de");
    c.beginPath();
    c.moveTo(471, 640);
    c.bezierCurveTo(480, 704, 475, 761, 444, 794);
    c.quadraticCurveTo(500, 826, 555, 794);
    c.bezierCurveTo(525, 753, 522, 703, 530, 640);
    c.closePath();
    const stem = c.createLinearGradient(450, 0, 550, 0);
    stem.addColorStop(0, "#e8d2b7");
    stem.addColorStop(0.4, "#fff8e9");
    stem.addColorStop(1, "#e0c5a6");
    c.fillStyle = stem;
    c.fill();
  }
  if (!workbench && state.plate > 0 && plates[state.plate]?.image) {
    imagePlate(c, plates[state.plate]);
  } else {
    c.save();
    c.translate(500, 492);
    if (!workbench && state.plate === 0) {
      for (let i = 0; i < 48; i++) {
        const a = (i * Math.PI) / 24;
        ellipse(
          c,
          Math.cos(a) * 323,
          Math.sin(a) * 210 + 42,
          22,
          16,
          "#f9f4e8",
        );
      }
    }
    const plate = workbench ? "#fff5e5" : "#fffaf0";
    ellipse(c, 0, 53, workbench ? 330 : 350, workbench ? 180 : 224, "#c9bfae");
    ellipse(c, 0, 43, workbench ? 330 : 350, workbench ? 180 : 224, plate);
    c.strokeStyle = "#d5c8b4";
    c.lineWidth = 2;
    c.beginPath();
    c.ellipse(
      0,
      43,
      workbench ? 313 : 331,
      workbench ? 166 : 207,
      0,
      0,
      Math.PI * 2,
    );
    c.stroke();
    c.beginPath();
    c.ellipse(
      0,
      43,
      workbench ? 288 : 292,
      workbench ? 144 : 179,
      0,
      0,
      Math.PI * 2,
    );
    c.strokeStyle = "#dfd4c0";
    c.stroke();
    if (!workbench && state.plate === 0) {
      for (let i = 0; i < 42; i++) {
        let a = (i * Math.PI) / 21;
        ellipse(c, Math.cos(a) * 321, 43 + Math.sin(a) * 197, 3, 2, "#bd9b72");
      }
    }
    c.restore();
  }
  // Scale the entire cake, including lettering and toppings, around its foot.
  // The oblong platter needs a smaller cake to leave the ribbon rim visible.
  c.save();
  if (!workbench) {
    const foot = 402 + (state.layered && stage >= 3 ? 145 : 85);
    c.translate(500, 552);
    const fit = state.plate === 1 ? 0.64 : state.plate > 0 ? 0.86 : 1;
    c.scale(fit, fit);
    c.translate(-500, -foot);
  }
  c.save();
  c.translate(500, 402);
  const p = cakePath(state.shape);
  const depth = state.layered && stage >= 3 ? 145 : 85;
  const base =
    stage >= 4 && state.frosted
      ? blend(
          spongeColor,
          cream,
          effect?.kind === "cream-complete" ? 0.61 + 0.39 * reveal : 1,
        )
      : stage === 4
        ? blend(spongeColor, cream, (coverage / 100) * 0.72)
        : spongeColor;
  // Extrude the same silhouette downwards, retaining a recognizable shape.
  for (let y = depth; y >= 0; y -= 2) {
    c.save();
    c.translate(0, y + (effect?.kind === "layer" ? (y < 60 ? drop : 0) : drop));
    c.fillStyle = base;
    c.fill(p);
    c.restore();
  }
  c.translate(0, drop);
  c.save();
  c.clip(bodyPath(state.shape, depth));
  c.translate(0, 8);
  const side = c.createLinearGradient(-260, 0, 260, 0);
  side.addColorStop(0, "#ffffff30");
  side.addColorStop(0.45, "#ffffff08");
  side.addColorStop(1, "#56332036");
  c.fillStyle = side;
  c.fillRect(-300, 0, 600, 270);
  c.restore();
  // The side grain and faint frosting ridges share the same silhouette as every sponge.
  c.save();
  c.clip(bodyPath(state.shape, depth));
  const sideOnly = new Path2D();
  sideOnly.rect(-400, -250, 800, 700);
  sideOnly.addPath(p);
  c.clip(sideOnly, "evenodd");
  if (stage >= 4 && state.frosted) {
    for (let y = 55; y < 305; y += 23) {
      c.beginPath();
      c.moveTo(-280, y);
      c.quadraticCurveTo(0, y + 18, 280, y - 6);
      stroke(c, "#fff9e51f", 2);
    }
  } else {
    for (let i = 0; i < 170; i++) {
      ellipse(
        c,
        ((i * 137.6) % 540) - 270,
        ((i * 61.3) % 300) - 15,
        0.6 + (i % 3) * 0.3,
        0.7,
        i % 2 ? "#7e522115" : "#fff0bf26",
      );
    }
  }
  c.restore();
  // Layers on the front of the sponge, clipped to the extruded body.
  c.save();
  const body = new Path2D();
  for (let y = 0; y <= depth; y += 4) {
    const q = cakePath(state.shape);
    const m = new DOMMatrix().translate(0, y);
    body.addPath(q, m);
  }
  c.clip(body);
  c.translate(0, 68);
  c.strokeStyle = !state.layered
    ? "#00000000"
    : stage >= 4 && state.frosted
      ? "#fff7e44d"
      : creamColors[state.fillingCream] + "e0";
  c.lineWidth = 10;
  c.stroke(p);
  c.translate(0, 26);
  c.strokeStyle = "#925d4540";
  c.lineWidth = 2;
  c.stroke(p);
  c.restore();
  // Naked sponge before frosting: warm baked edge and a soft, porous surface.
  c.fillStyle = undercoat ? fillingColor : spongeColor;
  c.fill(p);
  const sponge = c.createRadialGradient(-70, -65, 20, 0, 0, 290);
  sponge.addColorStop(0, "#fff3c67a");
  sponge.addColorStop(0.7, "#fff1c81c");
  sponge.addColorStop(1, "#86502c55");
  c.fillStyle = sponge;
  c.fill(p);
  c.strokeStyle = "#ae79474d";
  c.lineWidth = 5;
  c.stroke(p);
  c.save();
  c.clip(p);
  for (let i = 0; i < (undercoat ? 0 : 280); i++) {
    const x = ((i * 173.17) % 500) - 250,
      y = ((i * 97.31) % 330) - 165;
    ellipse(
      c,
      x,
      y,
      0.7 + (i % 3) * 0.25,
      0.6 + (i % 2) * 0.3,
      i % 2 ? "#9e75411b" : "#fff3cd30",
    );
  }
  c.restore();
  if (
    stage >= 1 &&
    strokes?.length &&
    (!showCream || effect?.kind === "cream-complete")
  )
    brushMarks(c, p, strokes, cream);
  if (showCream) {
    c.save();
    if (effect?.kind === "cream-complete") c.globalAlpha *= reveal;
    c.save();
    c.shadowColor = "#9c6c4840";
    c.shadowBlur = 8;
    c.shadowOffsetY = 6;
    c.fillStyle = cream;
    c.fill(p);
    c.restore();
    // Rounded frosting lip and delicate drips.
    c.save();
    c.clip(bodyPath(state.shape, depth));
    c.strokeStyle = cream;
    c.lineWidth = 12;
    c.stroke(p);
    for (let i = 0; i < 15; i++) {
      let a = 0.12 + (i * Math.PI) / 15;
      const { x, y } = surfaceEdge(state.shape, a);
      c.beginPath();
      c.moveTo(x, y - 7);
      c.quadraticCurveTo(x + 9, y + 48 + (i % 3) * 7, x + 16, y - 4);
      c.lineWidth = 10;
      c.stroke();
    }
    c.restore();
    const top = c.createLinearGradient(-220, -160, 200, 160);
    top.addColorStop(0, "#ffffff55");
    top.addColorStop(0.6, "#ffffff00");
    top.addColorStop(1, "#ae797417");
    c.fillStyle = top;
    c.fill(p);
    c.strokeStyle = "#fff7eb8c";
    c.lineWidth = 2;
    c.stroke(p);
    // Spatula ridges catch the light on the hand-smoothed frosting.
    c.save();
    c.clip(p);
    c.strokeStyle = "#fff9ed80";
    c.lineWidth = 4;
    for (const [rx, ry, a, b] of [
      [205, 126, 0.2, 4.9],
      [165, 95, 2.9, 6.4],
      [112, 64, 0.1, 3.8],
    ]) {
      c.beginPath();
      c.ellipse(-3, -5, rx, ry, -0.04, a, b);
      c.stroke();
    }
    c.restore();
    c.restore();
  }
  c.restore();
  const visibleToppings = showFilling
    ? state.fillingToppings
    : stage >= 5
      ? [
          ...(!state.layered && !state.frosted ? state.fillingToppings : []),
          ...state.toppings,
        ]
      : [];
  for (const t of visibleToppings) {
    c.save();
    c.shadowColor = "#61432d35";
    c.shadowBlur = 3;
    c.shadowOffsetY = 3;
    const fall =
      effect?.kind === "topping" && effect.id === t.id
        ? -35 * (1 - progress) ** 2
        : 0;
    c.translate(500 + t.x, 402 + t.y + drop + fall);
    c.scale(1, 0.82);
    drawTopping(
      c,
      t.type,
      0,
      0,
      t.scale * (0.96 + t.y * 0.0006),
      t.rotation,
      t.text,
    );
    c.restore();
    if (!exporting && t.id === selected) {
      c.save();
      c.translate(500 + t.x, 402 + t.y);
      c.rotate(t.rotation);
      c.strokeStyle = "#ac6d79";
      c.lineWidth = 2;
      c.setLineDash([5, 5]);
      c.strokeRect(-43 * t.scale, -35 * t.scale, 86 * t.scale, 70 * t.scale);
      c.restore();
    }
  }
  c.restore();
  if (workbench && [1, 4].includes(stage)) {
    const travel = effect?.kind === "tools" ? 100 * (1 - progress) ** 3 : 0;
    drawBowl(c, 210 - travel, 735, cream, 0.85);
    if (tool) {
      const a = tool.angle || -0.55,
        scale = 0.82;
      spatula(
        c,
        500 + tool.x - 34 * scale * Math.sin(a),
        402 + tool.y + 34 * scale * Math.cos(a),
        a,
        scale,
      );
    } else spatula(c, 796 + travel, 700, -0.6, 0.9);
  }
  if (!workbench) {
    // Botanical sprig to frame the composition without using external assets.
    c.save();
    c.translate(840, 735);
    c.rotate(-0.55);
    c.beginPath();
    c.moveTo(0, 80);
    c.quadraticCurveTo(-5, -25, 25, -100);
    stroke(c, "#82936c", 3);
    for (let i = 0; i < 6; i++) {
      const yy = 50 - i * 24;
      for (const sign of [-1, 1]) {
        c.save();
        c.translate(6, yy);
        c.rotate(sign * 0.65);
        ellipse(c, sign * 14, -12, 10, 25, i % 2 ? "#9ba983" : "#b4bd95");
        c.restore();
      }
    }
    c.restore();
  }
  c.restore();
  if (presentation) {
    c.save();
    c.font = "italic 27px Georgia, serif";
    c.textAlign = "center";
    c.fillStyle = "#91765f";
    c.fillText(state.name || "My little cake", 500, 861, 650);
    c.restore();
  }
}
function bodyPath(shape, depth) {
  const p = new Path2D();
  for (let y = 0; y <= depth + 2; y += 4)
    p.addPath(cakePath(shape), new DOMMatrix().translate(0, y));
  return p;
}
