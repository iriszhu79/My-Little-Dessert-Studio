export const cakeColors = ["#ecd3a5", "#80513d", "#e7a3aa", "#a6b77b"];
export const creamColors = [
  "#fff2dc",
  "#f3c4cf",
  "#d9cae9",
  "#f6df97",
  "#c4dfe9",
];
export const toppingNames = {
  strawberry: "草莓",
  blueberry: "蓝莓",
  cherry: "樱桃",
  lemon: "柠檬片",
  cookie: "曲奇",
  chocolate: "巧克力",
  macaron: "马卡龙",
  flower: "小花",
  bow: "蝴蝶结",
  pearls: "糖珠",
  cream: "奶油裱花",
  text: "甜蜜文字",
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
export function render(c, state, { selected = null, exporting = false } = {}) {
  c.clearRect(0, 0, 1000, 900);
  const bg = state.background;
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
  // Soft cast shadow and handmade porcelain.
  c.save();
  c.filter = "blur(18px)";
  ellipse(c, 520, 592, 337, 130, "#75523b25");
  c.restore();
  c.save();
  c.translate(500, 492);
  if (state.plate === 1) {
    for (let i = 0; i < 48; i++) {
      const a = (i * Math.PI) / 24;
      ellipse(c, Math.cos(a) * 323, Math.sin(a) * 210 + 42, 22, 16, "#f9f4e8");
    }
  }
  const plate = ["#fffaf0", "#fbf6e9", "#e8b8be", "#ffffff55"][state.plate];
  ellipse(c, 0, 53, 350, 224, state.plate === 3 ? "#e8f4ef88" : "#c9bfae");
  ellipse(c, 0, 43, 350, 224, plate);
  c.strokeStyle = state.plate === 3 ? "#ffffffbb" : "#d5c8b4";
  c.lineWidth = 2;
  c.beginPath();
  c.ellipse(0, 43, 331, 207, 0, 0, Math.PI * 2);
  c.stroke();
  c.beginPath();
  c.ellipse(0, 43, 292, 179, 0, 0, Math.PI * 2);
  c.strokeStyle = state.plate === 2 ? "#c58c9b" : "#dfd4c0";
  c.stroke();
  if (state.plate === 1) {
    for (let i = 0; i < 42; i++) {
      let a = (i * Math.PI) / 21;
      ellipse(c, Math.cos(a) * 321, 43 + Math.sin(a) * 197, 3, 2, "#bd9b72");
    }
  }
  c.restore();
  c.save();
  c.translate(500, 402);
  const p = cakePath(state.shape);
  const base = cakeColors[state.cake];
  // Extrude the same silhouette downwards, retaining a recognizable shape.
  for (let y = 105; y >= 0; y -= 2) {
    c.save();
    c.translate(0, y);
    c.fillStyle = base;
    c.fill(p);
    c.restore();
  }
  c.save();
  c.clip(bodyPath(state.shape));
  c.translate(0, 8);
  const side = c.createLinearGradient(-260, 0, 260, 0);
  side.addColorStop(0, "#ffffff30");
  side.addColorStop(0.45, "#ffffff08");
  side.addColorStop(1, "#56332036");
  c.fillStyle = side;
  c.fillRect(-300, 0, 600, 270);
  c.restore();
  // Layers on the front of the sponge, clipped to the extruded body.
  c.save();
  const body = new Path2D();
  for (let y = 0; y <= 104; y += 4) {
    const q = cakePath(state.shape);
    const m = new DOMMatrix().translate(0, y);
    body.addPath(q, m);
  }
  c.clip(body);
  c.translate(0, 68);
  c.strokeStyle = "#fff0d19c";
  c.lineWidth = 10;
  c.stroke(p);
  c.translate(0, 26);
  c.strokeStyle = "#925d4540";
  c.lineWidth = 2;
  c.stroke(p);
  c.restore();
  c.save();
  c.shadowColor = "#9c6c4840";
  c.shadowBlur = 8;
  c.shadowOffsetY = 6;
  c.fillStyle = creamColors[state.cream];
  c.fill(p);
  c.restore();
  // Rounded frosting lip and delicate drips.
  c.save();
  c.clip(bodyPath(state.shape));
  c.strokeStyle = creamColors[state.cream];
  c.lineWidth = 12;
  c.stroke(p);
  for (let i = 0; i < 15; i++) {
    let a = 0.12 + (i * Math.PI) / 15;
    const x = Math.cos(a) * 235,
      y = Math.sin(a) * 155;
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
  // Piped border, generated along the actual silhouette.
  for (let i = 0; i < 52; i++) {
    const a = (i * Math.PI * 2) / 52;
    let x, y;
    if (state.shape === 0) {
      x = Math.cos(a) * 231;
      y = Math.sin(a) * 146;
    } else if (state.shape === 3) {
      const r = 1 + 0.12 * Math.cos(a * 6);
      x = Math.cos(a) * 202 * r;
      y = Math.sin(a) * 132 * r;
    } else if (state.shape === 2) {
      const dx = Math.cos(a),
        dy = Math.sin(a);
      const r = 1 / Math.max(Math.abs(dx) / 207, Math.abs(dy) / 140);
      x = dx * r;
      y = dy * r;
    } else continue;
    c.save();
    c.translate(x, y);
    c.scale(0.42, 0.28);
    drawTopping(c, "cream");
    c.restore();
  }
  if (state.slices) {
    c.save();
    c.clip(p);
    c.strokeStyle = "#89604e55";
    c.lineWidth = 3;
    c.setLineDash([4, 5]);
    for (let i = 0; i < state.slices; i++) {
      const a = -Math.PI / 2 + (i * Math.PI * 2) / state.slices;
      c.beginPath();
      c.moveTo(0, 0);
      c.lineTo(Math.cos(a) * 500, Math.sin(a) * 500);
      c.stroke();
    }
    c.restore();
  }
  c.restore();
  for (const t of state.toppings) {
    c.save();
    c.shadowColor = "#61432d35";
    c.shadowBlur = 4;
    c.shadowOffsetY = 4;
    drawTopping(c, t.type, 500 + t.x, 402 + t.y, t.scale, t.rotation, t.text);
    c.restore();
    if (!exporting && t.id === selected) {
      c.save();
      c.translate(500 + t.x, 402 + t.y);
      c.rotate(t.rotation);
      c.strokeStyle = "#ac6d79";
      c.lineWidth = 2;
      c.setLineDash([5, 5]);
      c.strokeRect(-43 * t.scale, -43 * t.scale, 86 * t.scale, 86 * t.scale);
      c.restore();
    }
  }
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
function bodyPath(shape) {
  const p = new Path2D();
  for (let y = 0; y <= 106; y += 4)
    p.addPath(cakePath(shape), new DOMMatrix().translate(0, y));
  return p;
}
