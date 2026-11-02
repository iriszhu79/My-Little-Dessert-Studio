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
  cream: 0,
  plate: 0,
  slices: 0,
  background: 0,
  toppings: [],
  fillingToppings: [],
  fillingCream: 0,
  layered: false,
  frosted: false,
  frosting: [],
  stage: 0,
});
let state = fresh(),
  step = 0,
  category = "水果",
  selected = null,
  history = [],
  drag = null,
  id = 0,
  storageAvailable = true,
  presentation = false;
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
    // Upgrade existing V1 works without losing any decorations.
    state = { ...fresh(), ...data };
    if (!Array.isArray(data.fillingToppings)) {
      state.layered = true;
      state.frosted = true;
      state.stage = 5;
    }
    if (!validExtras(state))
      state = {
        ...fresh(),
        shape: data.shape,
        cake: data.cake,
        cream: data.cream,
        plate: data.plate,
        slices: data.slices,
        background: data.background,
        toppings: data.toppings,
        layered: true,
        frosted: true,
      };
    step = state.stage;
    restored = true;
  }
} catch {
  storageAvailable = false;
}
function validExtras(s) {
  const validToppings = valid({ ...s, toppings: s.fillingToppings });
  return (
    validToppings &&
    Number.isInteger(s.stage) &&
    s.stage >= 0 &&
    s.stage < 9 &&
    Number.isInteger(s.fillingCream) &&
    s.fillingCream >= 0 &&
    s.fillingCream < 5 &&
    typeof s.layered === "boolean" &&
    typeof s.frosted === "boolean" &&
    Array.isArray(s.frosting) &&
    s.frosting.length <= 80 &&
    s.frosting.every(
      (stroke) =>
        Array.isArray(stroke) &&
        stroke.length <= 1800 &&
        stroke.every(
          (p) =>
            p &&
            Number.isFinite(p.x) &&
            Number.isFinite(p.y) &&
            Math.abs(p.x) < 350 &&
            Math.abs(p.y) < 250,
        ),
    )
  );
}
function activeToppings() {
  return step === 2 ? state.fillingToppings : state.toppings;
}
function save() {
  state.stage = step;
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
  render(ctx, state, { selected, stage: step, presentation });
  $("#workMode").textContent =
    !presentation && step < 6 ? "制作中 · 蛋糕转台" : "成品布景 · 甜蜜留影";
  canvas.classList.toggle("frosting-mode", step === 4 && !presentation);
  $(".canvas-wrap").classList.toggle("is-workbench", !presentation && step < 6);
  const progress = $("#frostProgress");
  if (progress) {
    progress.value = frostCoverage();
    $("#frostPercent").textContent = Math.round(progress.value) + "%";
  }
  $("#undo").disabled = !history.length;
  $("#selectionTools").hidden =
    !activeToppings().some((t) => t.id === selected) || ![2, 5].includes(step);
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
const stepNames = [
  "形状",
  "配色",
  "夹心",
  "叠层",
  "抹面",
  "装饰",
  "盘子",
  "切块",
  "背景",
];
const subtitles = [
  "先选一个心动的形状",
  "为蛋糕胚，调一份颜色",
  "铺上这一层小幸福",
  "再盖上一层松软",
  "用奶油，温柔地包裹",
  "把喜欢的水果摆上去",
  "为作品挑一只盘子",
  "把甜蜜分成几份",
  "选一个喜欢的好天气",
];
const descriptions = [
  "蛋糕胚已经放上转台，今天想做哪一种？",
  "蛋糕胚与外层奶油，可以分别搭配。",
  "选择夹心奶油，再加入水果。夹心与表面装饰分别保存。",
  "把另一片蛋糕胚轻轻盖上，夹心会藏在中间。",
  "按住蛋糕表面拖动，像用抹刀一样涂开奶油。也可以一键抹匀。",
  "整颗、半颗、切片和扇形水果，自由摆放。点击选中可调整。",
  "制作完成，移到盘子上，再慢慢布置。",
  "切线只改变外观，快乐可以自由分享。",
  "拍下今天这一份甜蜜，收藏起来。",
];
function selectStep(next) {
  if (next === 4 && !state.layered) {
    checkpoint();
    state.layered = true;
  }
  if (next >= 5 && (!state.layered || !state.frosted)) {
    checkpoint();
    state.layered = true;
    state.frosted = true;
  }
  selected = null;
  step = next;
  presentation = false;
  save();
  paint();
  panel();
}
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
      selectStep(i);
    };
    $("#steps").append(b);
  });
  const nav = $("#steps"),
    active = nav.querySelector(".active");
  // Scroll only the step strip; do not move the mobile page away from the cake.
  nav.scrollLeft +=
    active.getBoundingClientRect().left -
    nav.getBoundingClientRect().left -
    (nav.clientWidth - active.clientWidth) / 2;
  $("#stepCount").textContent = `0${step + 1} / 09`;
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
              state.fillingToppings.forEach(constrain);
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
    const label = document.createElement("div");
    label.className = "field-label";
    label.textContent = "夹心奶油";
    p.append(label);
    const row = document.createElement("div");
    row.className = "swatches";
    creamColors.forEach((color, i) => {
      const b = document.createElement("button");
      b.className = "swatch" + (state.fillingCream === i ? " active" : "");
      b.style.background = color;
      b.setAttribute(
        "aria-label",
        "夹心奶油 " + ["奶油白", "浅粉", "淡紫", "浅黄", "浅蓝"][i],
      );
      b.onclick = () => change(() => (state.fillingCream = i));
      row.append(b);
    });
    p.append(row);
  }
  if (step === 3) {
    const illustration = document.createElement("div");
    illustration.className = "layer-illustration";
    illustration.innerHTML =
      "<span>松软蛋糕胚</span><span>水果与奶油夹心</span><span>松软蛋糕胚</span>";
    p.append(illustration);
    const b = document.createElement("button");
    b.className = "wide-action";
    b.textContent = state.layered ? "✓ 第二层已盖好" : "盖上第二层蛋糕胚";
    b.disabled = state.layered;
    b.onclick = () => {
      change(() => (state.layered = true));
      toast("轻轻盖好，接下来抹奶油吧");
    };
    p.append(b);
    const note = document.createElement("p");
    note.className = "stage-note";
    note.textContent = "想换夹心？随时回到“夹心”步骤调整，水果不会丢失。";
    p.append(note);
  }
  if (step === 4) {
    const meter = document.createElement("div");
    meter.className = "frost-meter";
    meter.innerHTML =
      '<span>奶油覆盖 <b id="frostPercent"></b></span><progress id="frostProgress" max="100"></progress>';
    p.append(meter);
    const tip = document.createElement("div");
    tip.className = "brush-tip";
    tip.textContent = "按住表面，来回抹开奶油。每一笔都可以撤销。";
    p.append(tip);
    const done = document.createElement("button");
    done.className = "wide-action";
    done.textContent = "一键抹匀奶油";
    done.onclick = () => change(() => (state.frosted = true));
    p.append(done);
    const reset = document.createElement("button");
    reset.className = "subtle clear";
    reset.textContent = "重新抹面";
    reset.onclick = () =>
      change(() => {
        state.frosted = false;
        state.frosting = [];
      });
    p.append(reset);
  }
  if (step === 2 || step === 5) {
    const cats = document.createElement("div");
    cats.className = "topping-categories";
    (step === 2 ? ["水果"] : ["水果", "甜点", "装饰", "文字"]).forEach((n) => {
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
      水果: [
        "strawberry",
        "strawberryHalf",
        "strawberryFan",
        "blueberry",
        "kiwi",
        "orange",
        "lemon",
        "mango",
        "mangoCubes",
        "banana",
        "cherry",
        "mint",
      ],
      甜点: ["cookie", "chocolate", "macaron"],
      装饰: ["flower", "bow", "pearls", "cream"],
      文字: ["text"],
    }[step === 2 ? "水果" : category];
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
    if (step === 5 && category === "文字") {
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
  if (step === 6)
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
  if (step === 7)
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
  if (step === 8)
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
  if (step === 2 || step === 5) {
    const b = document.createElement("button");
    b.textContent = step === 2 ? "清空夹心水果" : "清空装饰";
    b.className = "subtle clear";
    b.disabled = !activeToppings().length;
    b.onclick = () =>
      change(() => {
        if (step === 2) state.fillingToppings = [];
        else state.toppings = [];
        selected = null;
      });
    p.append(b);
  }
  $("#prev").disabled = step === 0;
  $("#next").textContent = step === 8 ? "完成作品 ♡" : "下一步 →";
  $("#hint").textContent =
    step === 2 || step === 5
      ? "点击素材添加 · 拖动摆放 · 点击选中"
      : step === 4
        ? "按住表面拖动 · 一笔笔抹开奶油"
        : "随时切换步骤，慢慢搭配你的喜欢";
  paint();
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
  if (activeToppings().length >= 250) {
    toast("装饰已经很多啦，先整理一下画面吧");
    return;
  }
  change(() => {
    const i = activeToppings().length,
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
    activeToppings().push(t);
    selected = t.id;
  });
  toast("已添加" + toppingNames[type] + "，拖动试试看");
}
// Brush geometry is saved as vector strokes; a pointer gesture is one undo action.
function frostCoverage() {
  if (state.frosted) return 100;
  const points = state.frosting.flat();
  if (!points.length) return 0;
  let count = 0,
    covered = 0;
  const path = cakePath(state.shape);
  for (let x = -240; x <= 240; x += 24)
    for (let y = -160; y <= 160; y += 20) {
      if (ctx.isPointInPath(path, x, y)) {
        count++;
        if (points.some((p) => Math.hypot(p.x - x, p.y - y) < 43)) covered++;
      }
    }
  return count ? (covered / count) * 100 : 0;
}
function startFrost(e, pos) {
  if (!ctx.isPointInPath(cakePath(state.shape), pos.x, pos.y) || state.frosted)
    return;
  if (state.frosting.length >= 80) {
    toast("可以一键抹匀，或重新抹面");
    return;
  }
  drag = {
    pointer: e.pointerId,
    brush: true,
    before: clone(state),
    moved: true,
  };
  state.layered = true;
  state.frosting.push([pos]);
  canvas.setPointerCapture(e.pointerId);
  paint();
}
function continueFrost(pos) {
  const points = state.frosting.at(-1),
    last = points.at(-1);
  if (points.length >= 1700) return;
  const distance = Math.hypot(pos.x - last.x, pos.y - last.y);
  if (distance < 4) return;
  const n = Math.min(60, Math.ceil(distance / 10));
  for (let i = 1; i <= n; i++) {
    const p = {
      x: last.x + ((pos.x - last.x) * i) / n,
      y: last.y + ((pos.y - last.y) * i) / n,
    };
    if (ctx.isPointInPath(cakePath(state.shape), p.x, p.y)) points.push(p);
  }
  if (frostCoverage() >= 94) state.frosted = true;
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
  if (step === 4 && !presentation) {
    startFrost(e, pos);
    return;
  }
  if (![2, 5].includes(step) || presentation) return;
  const t = [...activeToppings()].reverse().find((t) => {
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
  if (drag.brush) {
    continueFrost(coordinates(e));
    paint();
    return;
  }
  const p = coordinates(e),
    t = activeToppings().find((t) => t.id === drag.id);
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
  const wasBrush = drag.brush;
  drag = null;
  paint();
  if (wasBrush) panel();
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
  const t = activeToppings().find((t) => t.id === selected);
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
      if (step === 2)
        state.fillingToppings = state.fillingToppings.filter(
          (t) => t.id !== selected,
        );
      else state.toppings = state.toppings.filter((t) => t.id !== selected);
      selected = null;
    });
}
$("#delete").onclick = remove;
canvas.addEventListener("keydown", (e) => {
  const t = activeToppings().find((t) => t.id === selected);
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
  selectStep(Math.max(0, step - 1));
};
$("#next").onclick = () => {
  if (step === 3 && !state.layered) change(() => (state.layered = true));
  if (step === 4 && !state.frosted) change(() => (state.frosted = true));
  if (step < 8) {
    selectStep(step + 1);
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
  presentation = true;
  paint();
  $("#resultImage").src = artwork().toDataURL("image/png");
  $("#result").showModal();
}
$("#finish").onclick = finish;
function edit() {
  presentation = false;
  $("#result").close();
  paint();
}
$("#edit").onclick = edit;
$("#result").addEventListener("cancel", () => {
  presentation = false;
  paint();
});
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
  presentation = false;
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
$("#showMaking").onclick = () => selectStep(2);
$("#begin").onclick = () => {
  $("#welcome").close();
  save();
  toast("选择蛋糕形状，开始你的创作");
};
paint();
panel();
if (!restored) $("#welcome").showModal();
if (!storageAvailable) $("#saved").textContent = "无法自动保存";
