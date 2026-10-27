import {
  render,
  drawTopping,
  cakePath,
  cakeColors,
  creamColors,
  toppingNames,
} from "./renderer.js";
const $ = (s) => document.querySelector(s),
  canvas = $("#cake"),
  ctx = canvas.getContext("2d");
const KEY = "little-dessert-v1";
const fresh = () => ({
  shape: 0,
  cake: 0,
  cream: 1,
  plate: 0,
  slices: 0,
  background: 0,
  toppings: [],
});
let state = fresh(),
  step = 0,
  category = "水果",
  selected = null,
  history = [],
  drag = null,
  id = 0,
  storageAvailable = true;
const clone = (v) => structuredClone(v);
function valid(s) {
  return (
    s &&
    ["shape", "cake", "cream", "plate", "background"].every(
      (k) =>
        Number.isInteger(s[k]) && s[k] >= 0 && s[k] < (k === "cream" ? 5 : 4),
    ) &&
    [0, 2, 4, 6, 8].includes(s.slices) &&
    Array.isArray(s.toppings) &&
    s.toppings.length <= 250 &&
    s.toppings.every(
      (t) =>
        t &&
        Object.hasOwn(toppingNames, t.type) &&
        typeof t.id === "string" &&
        [t.x, t.y, t.scale, t.rotation].every(Number.isFinite) &&
        Math.abs(t.x) <= 300 &&
        Math.abs(t.y) <= 200 &&
        t.scale >= 0.4 &&
        t.scale <= 1.8 &&
        typeof t.text === "string" &&
        t.text.length <= 20,
    )
  );
}
let restored = false;
try {
  const data = JSON.parse(localStorage.getItem(KEY));
  if (valid(data)) {
    state = data;
    restored = true;
  }
} catch {
  storageAvailable = false;
}
function save() {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
    $("#saved").textContent = "✓ 已自动保存";
  } catch {
    storageAvailable = false;
    $("#saved").textContent = "无法自动保存";
    toast("浏览器存储不可用，请保存图片以保留作品");
  }
}
function checkpoint() {
  history.push(clone(state));
  if (history.length > 60) history.shift();
}
function paint() {
  render(ctx, state, { selected });
  $("#undo").disabled = !history.length;
  $("#selectionTools").hidden = !state.toppings.some((t) => t.id === selected);
}
function change(fn, { refresh = true } = {}) {
  checkpoint();
  fn();
  save();
  paint();
  if (refresh) panel();
}
let toastTimer;
function toast(message) {
  $("#toast").textContent = message;
  $("#toast").classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => $("#toast").classList.remove("show"), 2600);
}
const stepNames = ["形状", "配色", "装饰", "盘子", "切块", "背景"];
const subtitles = [
  "先选一个心动的形状",
  "为甜蜜，调一份颜色",
  "让小小灵感开花",
  "好看的甜点，也要好看的盘子",
  "分享，或独享这一份甜",
  "选一个喜欢的好天气",
];
const descriptions = [
  "每一种形状，都装得下今天的小确幸。",
  "蛋糕与奶油的颜色，可以自由搭配。",
  "点击添加，拖动摆放。选中后可调整或删除。",
  "让盘子轻轻托住你的甜蜜想象。",
  "轻轻画上切线，让快乐有更多份。",
  "最后，为你的作品找一个温柔的角落。",
];
function button(label, active, fn, html) {
  const b = document.createElement("button");
  b.className = "option" + (active ? " active" : "");
  b.setAttribute("aria-pressed", String(active));
  b.setAttribute("aria-label", label);
  if (html) b.innerHTML = html;
  const span = document.createElement("span");
  span.textContent = label;
  b.append(span);
  b.onclick = fn;
  return b;
}
const shapeSvgs = [
  `<ellipse cx="40" cy="27" rx="30" ry="17"/>`,
  `<path d="M40 46C-10 15 25-8 40 12C62-8 88 17 40 46Z"/>`,
  `<rect x="10" y="9" width="60" height="37" rx="6"/>`,
  `<path d="M40 7C54-3 62 8 59 15C78 13 82 30 66 34C72 49 53 57 43 44C30 59 12 48 18 35C-2 30 4 12 22 15C20 2 34-4 40 7Z"/>`,
];
function panel() {
  $("#steps").replaceChildren();
  stepNames.forEach((name, i) => {
    const b = document.createElement("button");
    b.textContent = name;
    b.className = i === step ? "active" : "";
    b.setAttribute("aria-current", i === step ? "step" : "false");
    b.onclick = () => {
      step = i;
      panel();
    };
    $("#steps").append(b);
  });
  $("#stepCount").textContent = `0${step + 1} / 06`;
  const p = $("#panel");
  p.replaceChildren();
  const title = document.createElement("h2");
  title.textContent = subtitles[step];
  const d = document.createElement("p");
  d.textContent = descriptions[step];
  p.append(title, d);
  const grid = document.createElement("div");
  grid.className = "options";
  if (step === 0)
    ["圆形", "爱心形", "方形", "花朵形"].forEach((n, i) =>
      grid.append(
        button(
          n,
          state.shape === i,
          () =>
            change(() => {
              state.shape = i;
              state.toppings.forEach(constrain);
            }),
          `<svg viewBox="0 0 80 55" fill="#ebc6bd" stroke="#c68e85" stroke-width="1.4">${shapeSvgs[i]}</svg>`,
        ),
      ),
    );
  if (step === 1) {
    for (const [key, label, colors, names] of [
      [
        "cake",
        "蛋糕主体",
        cakeColors,
        ["香草米白", "巧克力棕", "草莓粉", "抹茶绿"],
      ],
      [
        "cream",
        "表面奶油",
        creamColors,
        ["奶油白", "浅粉", "淡紫", "浅黄", "浅蓝"],
      ],
    ]) {
      const l = document.createElement("div");
      l.className = "field-label";
      l.textContent = label + " · " + names[state[key]];
      const row = document.createElement("div");
      row.className = "swatches";
      colors.forEach((color, i) => {
        const b = document.createElement("button");
        b.className = "swatch" + (state[key] === i ? " active" : "");
        b.style.background = color;
        b.title = names[i];
        b.setAttribute("aria-label", label + " " + names[i]);
        b.setAttribute("aria-pressed", String(state[key] === i));
        b.onclick = () => change(() => (state[key] = i));
        row.append(b);
      });
      p.append(l, row);
    }
  }
  if (step === 2) {
    const cats = document.createElement("div");
    cats.className = "topping-categories";
    ["水果", "甜点", "装饰", "文字"].forEach((n) => {
      const b = document.createElement("button");
      b.textContent = n;
      b.className = n === category ? "active" : "";
      b.onclick = () => {
        category = n;
        panel();
      };
      cats.append(b);
    });
    p.append(cats);
    grid.classList.add("toppings");
    const types = {
      水果: ["strawberry", "blueberry", "cherry", "lemon"],
      甜点: ["cookie", "chocolate", "macaron"],
      装饰: ["flower", "bow", "pearls", "cream"],
      文字: ["text"],
    }[category];
    for (const type of types) {
      const b = button(toppingNames[type], false, () => add(type));
      const mini = document.createElement("canvas");
      mini.width = 100;
      mini.height = 100;
      const c = mini.getContext("2d");
      drawTopping(c, type, 50, 52, type === "text" ? 0.6 : 1.1);
      b.prepend(mini);
      grid.append(b);
    }
    if (category === "文字") {
      const input = document.createElement("input");
      input.className = "text-input";
      input.id = "customText";
      input.placeholder = "写一句甜蜜的话（最多 20 字）";
      input.maxLength = 20;
      input.setAttribute("aria-label", "自定义短文字");
      p.append(input);
      const row = document.createElement("div");
      row.className = "topping-categories";
      ["Happy Day", "For You"].forEach((text) => {
        const b = document.createElement("button");
        b.textContent = text;
        b.onclick = () => add("text", text);
        row.append(b);
      });
      p.append(row);
    }
  }
  if (step === 3)
    ["经典白瓷盘", "花边盘", "粉色盘", "透明玻璃盘"].forEach((n, i) => {
      const color = ["#fffaf0", "#fff8e5", "#e7b8c0", "#deece7"][i];
      grid.append(
        button(
          n,
          state.plate === i,
          () => change(() => (state.plate = i)),
          `<svg viewBox="0 0 80 55"><ellipse cx="40" cy="29" rx="34" ry="21" fill="${color}" stroke="#d3bd9f"/><ellipse cx="40" cy="29" rx="27" ry="15" fill="none" stroke="#d3bd9f"/>${i === 1 ? '<ellipse cx="40" cy="29" rx="31" ry="18" fill="none" stroke="#ba9d77" stroke-dasharray="1 5"/>' : ""}</svg>`,
        ),
      );
    });
  if (step === 4)
    [0, 2, 4, 6, 8].forEach((n) =>
      grid.append(
        button(
          n ? `${n} 块` : "不切",
          state.slices === n,
          () => change(() => (state.slices = n)),
          `<svg viewBox="0 0 80 55"><ellipse cx="40" cy="27" rx="28" ry="20" fill="#f4d7c7" stroke="#c69485"/>${Array.from(
            { length: n },
            (_, i) => {
              const a = -Math.PI / 2 + (i * 2 * Math.PI) / n;
              return `<path d="M40 27L${40 + 28 * Math.cos(a)} ${27 + 20 * Math.sin(a)}" stroke="#b98778" stroke-dasharray="2 2"/>`;
            },
          ).join("")}</svg>`,
        ),
      ),
    );
  if (step === 5)
    ["奶油白桌面", "粉色格纹桌布", "木质桌面", "花园野餐布"].forEach((n, i) =>
      grid.append(
        button(
          n,
          state.background === i,
          () => change(() => (state.background = i)),
          `<svg viewBox="0 0 80 55"><rect x="8" y="4" width="64" height="45" rx="5" fill="${["#f0e5d3", "#edc9ca", "#c49b74", "#dae1c6"][i]}"/>${i === 1 || i === 3 ? '<path d="M20 4V49M40 4V49M60 4V49M8 17H72M8 34H72" stroke="#ffffff70" stroke-width="7"/>' : i === 2 ? '<path d="M8 16H72M8 31H72M8 44H72" stroke="#8c63423d"/>' : ""}</svg>`,
        ),
      ),
    );
  p.append(grid);
  if (step === 2) {
    const b = document.createElement("button");
    b.textContent = "清空装饰";
    b.className = "subtle clear";
    b.disabled = !state.toppings.length;
    b.onclick = () =>
      change(() => {
        state.toppings = [];
        selected = null;
      });
    p.append(b);
  }
  $("#prev").disabled = step === 0;
  $("#next").textContent = step === 5 ? "完成作品 ♡" : "下一步 →";
  $("#hint").textContent =
    step === 2
      ? "点击素材添加 · 拖动摆放 · 点击选中"
      : "随时切换步骤，慢慢搭配你的喜欢";
}
function constrain(t) {
  const path = cakePath(state.shape, 0.8);
  let n = 0;
  while (!ctx.isPointInPath(path, t.x, t.y) && n++ < 120) {
    t.x *= 0.94;
    t.y *= 0.94;
  }
  return t;
}
function add(type, text) {
  if (state.toppings.length >= 250) {
    toast("装饰已经很多啦，先整理一下画面吧");
    return;
  }
  change(() => {
    const i = state.toppings.length,
      a = i * 2.4,
      r = i === 0 || type === "text" ? 0 : 85 + ((i - 1) % 3) * 25;
    const t = constrain({
      id: `${Date.now()}-${id++}`,
      type,
      x: Math.cos(a) * r,
      y: Math.sin(a) * r * 0.6,
      scale: 1,
      rotation: 0,
      text: (text || $("#customText")?.value.trim() || "Happy Day").slice(
        0,
        20,
      ),
    });
    state.toppings.push(t);
    selected = t.id;
  });
  toast("已添加" + toppingNames[type] + "，拖动试试看");
}
function coordinates(e) {
  const r = canvas.getBoundingClientRect();
  return {
    x: ((e.clientX - r.left) * 1000) / r.width - 500,
    y: ((e.clientY - r.top) * 900) / r.height - 402,
  };
}
canvas.addEventListener("pointerdown", (e) => {
  if (e.button !== 0) return;
  const pos = coordinates(e);
  const t = [...state.toppings].reverse().find((t) => {
    const dx = pos.x - t.x,
      dy = pos.y - t.y;
    return Math.hypot(dx, dy) < (t.type === "text" ? 70 : 43) * t.scale;
  });
  selected = t?.id || null;
  if (t) {
    drag = {
      pointer: e.pointerId,
      id: t.id,
      start: pos,
      original: { x: t.x, y: t.y },
      before: clone(state),
      moved: false,
    };
    canvas.setPointerCapture(e.pointerId);
  }
  paint();
});
canvas.addEventListener("pointermove", (e) => {
  if (!drag || e.pointerId !== drag.pointer) return;
  const p = coordinates(e),
    t = state.toppings.find((t) => t.id === drag.id);
  if (!t) return;
  const dx = p.x - drag.start.x,
    dy = p.y - drag.start.y;
  if (Math.hypot(dx, dy) > 3) drag.moved = true;
  if (drag.moved) {
    t.x = drag.original.x + dx;
    t.y = drag.original.y + dy;
    constrain(t);
    paint();
  }
});
function endDrag(e) {
  if (!drag || drag.pointer !== e.pointerId) return;
  if (drag.moved) {
    history.push(drag.before);
    if (history.length > 60) history.shift();
    save();
  }
  drag = null;
  paint();
}
canvas.addEventListener("pointerup", endDrag);
canvas.addEventListener("pointercancel", (e) => {
  if (drag) {
    state = drag.before;
    drag = null;
    paint();
  }
});
function selection(fn) {
  const t = state.toppings.find((t) => t.id === selected);
  if (t) change(() => fn(t), { refresh: false });
}
$("#smaller").onclick = () =>
  selection((t) => (t.scale = Math.max(0.4, +(t.scale - 0.1).toFixed(1))));
$("#larger").onclick = () =>
  selection((t) => (t.scale = Math.min(1.8, +(t.scale + 0.1).toFixed(1))));
$("#rotate").onclick = () => selection((t) => (t.rotation += Math.PI / 8));
function remove() {
  if (selected)
    change(() => {
      state.toppings = state.toppings.filter((t) => t.id !== selected);
      selected = null;
    });
}
$("#delete").onclick = remove;
canvas.addEventListener("keydown", (e) => {
  const t = state.toppings.find((t) => t.id === selected);
  if (!t) return;
  if (["Delete", "Backspace"].includes(e.key)) {
    e.preventDefault();
    remove();
  } else if (
    ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(e.key)
  ) {
    e.preventDefault();
    selection((t) => {
      t.x += e.key === "ArrowRight" ? 5 : e.key === "ArrowLeft" ? -5 : 0;
      t.y += e.key === "ArrowDown" ? 5 : e.key === "ArrowUp" ? -5 : 0;
      constrain(t);
    });
  }
});
$("#undo").onclick = () => {
  if (history.length) {
    state = history.pop();
    selected = null;
    save();
    paint();
    panel();
  }
};
$("#prev").onclick = () => {
  step = Math.max(0, step - 1);
  panel();
};
$("#next").onclick = () => {
  if (step < 5) {
    step++;
    panel();
  } else finish();
};
function artwork() {
  const image = document.createElement("canvas");
  image.width = 1000;
  image.height = 900;
  // Copy the deselected artwork so PNG pixels match the preview exactly.
  image.getContext("2d").drawImage(canvas, 0, 0);
  return image;
}
function finish() {
  selected = null;
  paint();
  $("#resultImage").src = artwork().toDataURL("image/png");
  $("#result").showModal();
}
$("#finish").onclick = finish;
$("#edit").onclick = () => $("#result").close();
$("#download").onclick = () => {
  artwork().toBlob((blob) => {
    if (!blob) {
      toast("导出未成功，请再试一次");
      return;
    }
    const url = URL.createObjectURL(blob),
      a = document.createElement("a");
    a.href = url;
    a.download =
      "我的甜品工作室-" + new Date().toISOString().slice(0, 10) + ".png";
    document.body.append(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 10000);
    toast("图片已导出，手机也可长按成品图保存");
  }, "image/png");
};
function askReset() {
  $("#confirm").showModal();
}
$("#reset").onclick = askReset;
$("#restart").onclick = askReset;
$("#cancelReset").onclick = () => $("#confirm").close();
$("#confirmReset").onclick = () => {
  state = fresh();
  history = [];
  selected = null;
  step = 0;
  try {
    localStorage.removeItem(KEY);
  } catch {}
  $("#confirm").close();
  $("#result").close();
  save();
  paint();
  panel();
  toast("一份新的甜蜜，开始啦");
};
$("#begin").onclick = () => {
  $("#welcome").close();
  save();
  toast("选择蛋糕形状，开始你的创作");
};
paint();
panel();
if (!restored) $("#welcome").showModal();
if (!storageAvailable) $("#saved").textContent = "无法自动保存";
