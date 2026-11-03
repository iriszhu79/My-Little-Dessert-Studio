import {
  render,
  plates,
  loadPlateAssets,
  drawTopping,
  cakePath,
  cakeColors,
  creamColors,
  toppingNames,
  drawBowl,
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
  schemaVersion: 4,
  baseCream: false,
  baseStrokes: [],
  layersChosen: false,
  customCake: null,
  customCream: null,
  customFilling: null,
  name: "My little cake",
});
let state = fresh(),
  step = 0,
  category = "Fruit",
  selected = null,
  history = [],
  drag = null,
  id = 0,
  storageAvailable = true,
  presentation = false,
  effect = null,
  effectFrame = null,
  effectTimer = null,
  restoreNotice = "",
  tool = null,
  hoverFrame = null,
  coverageMemo = null;
const clone = (v) => structuredClone(v);
function valid(s) {
  return (
    s &&
    ["shape", "cake", "cream", "plate", "background"].every(
      (k) =>
        Number.isInteger(s[k]) &&
        s[k] >= 0 &&
        s[k] <
          (k === "cream"
            ? creamColors.length
            : k === "plate"
              ? plates.length
              : 4),
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
    if (!data.schemaVersion || data.schemaVersion < 2) {
      state.baseCream = true;
      state.layersChosen = Boolean(data.layered);
    }
    if (!Array.isArray(data.fillingToppings)) {
      state.layered = true;
      state.frosted = true;
      state.stage = 5;
      state.baseCream = true;
    }
    if ((!data.schemaVersion || data.schemaVersion < 3) && state.stage >= 7)
      state.stage = 7;
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
        baseCream: true,
        stage: 5,
      };
    state.stage =
      data.schemaVersion < 3 || !data.schemaVersion
        ? Math.min(state.stage, 7)
        : state.stage;
    state.slices = 0;
    if (!data.schemaVersion || data.schemaVersion < 4)
      state.plate = data.plate === 2 ? 3 : 0;
    state.schemaVersion = 4;
    state.fillingToppings = state.fillingToppings.map((t) =>
      t.type === "mint" ? { ...t, type: "grapes" } : t,
    );
    step = state.stage;
    restored = true;
  }
} catch {
  restoreNotice = "We could not restore that cake. A fresh sponge is ready.";
}
function validExtras(s) {
  const validToppings = valid({ ...s, toppings: s.fillingToppings });
  return (
    validToppings &&
    Number.isInteger(s.stage) &&
    s.stage >= 0 &&
    s.stage < 8 &&
    Number.isInteger(s.fillingCream) &&
    s.fillingCream >= 0 &&
    s.fillingCream < creamColors.length &&
    typeof s.baseCream === "boolean" &&
    typeof s.layersChosen === "boolean" &&
    typeof s.name === "string" &&
    s.name.length <= 32 &&
    [s.customCake, s.customCream, s.customFilling].every(
      (c) => c === null || /^#[a-f0-9]{6}$/i.test(c),
    ) &&
    Array.isArray(s.baseStrokes) &&
    validStrokes(s.baseStrokes) &&
    typeof s.layered === "boolean" &&
    typeof s.frosted === "boolean" &&
    Array.isArray(s.frosting) &&
    validStrokes(s.frosting)
  );
}
function validStrokes(strokes) {
  return (
    strokes.length <= 80 &&
    strokes.every(
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
function brushKeys() {
  return step === 1 ? ["baseStrokes", "baseCream"] : ["frosting", "frosted"];
}
const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");
function stopEffect() {
  if (effectFrame) cancelAnimationFrame(effectFrame);
  if (effectTimer) clearTimeout(effectTimer);
  effectTimer = null;
  effectFrame = null;
  effect = null;
  $(".workspace").removeAttribute("aria-busy");
}
function play(kind, done, id, previousBackground) {
  stopEffect();
  if (reducedMotion.matches) {
    paint();
    done?.();
    return;
  }
  const duration =
      kind === "cream-complete"
        ? 650
        : kind === "layer"
          ? 580
          : kind === "topping"
            ? 320
            : 420,
    start = performance.now();
  const target = { kind, progress: 0, id, previousBackground };
  effect = target;
  $(".workspace").setAttribute("aria-busy", "true");
  function complete() {
    if (effect !== target) return;
    target.progress = 1;
    paint();
    stopEffect();
    paint();
    done?.();
  }
  function frame() {
    if (effect !== target) return;
    target.progress = Math.min(1, (performance.now() - start) / duration);
    paint();
    if (target.progress < 1) effectFrame = requestAnimationFrame(frame);
    else complete();
  }
  effectFrame = requestAnimationFrame(frame);
  // Rendering can be throttled in background tabs; workflow completion must not depend on RAF alone.
  effectTimer = setTimeout(complete, duration + 100);
}

function activeToppings() {
  return step === 2 ? state.fillingToppings : state.toppings;
}
function save() {
  state.stage = step;
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
    $("#saved").textContent = "Saved on this device";
  } catch {
    storageAvailable = false;
    $("#saved").textContent = "Autosave unavailable";
    toast("Autosave is unavailable. Save an image to keep your cake.");
  }
}
function checkpoint() {
  history.push(clone(state));
  if (history.length > 60) history.shift();
}
function paint() {
  const coverage = [1, 4].includes(step) ? frostCoverage() : 0;
  render(ctx, state, {
    selected,
    stage: step,
    presentation,
    effect,
    coverage,
    tool,
  });
  $("#workMode").textContent =
    !presentation && step < 6 ? "THE CAKE STAND" : "YOUR SWEET LITTLE SCENE";
  canvas.classList.toggle(
    "frosting-mode",
    [1, 4].includes(step) && !presentation,
  );
  $(".canvas-wrap").classList.toggle("is-workbench", !presentation && step < 6);
  const progress = $("#frostProgress");
  if (progress) {
    progress.value = coverage;
    $("#frostPercent").textContent = Math.round(progress.value) + "%";
  }
  $("#hint").textContent = [1, 4].includes(step)
    ? state[brushKeys()[1]]
      ? "A lovely smooth finish. Ready for the next little step."
      : "Hold and sweep with your spatula. At 85%, we will finish the last little bit."
    : $("#hint").textContent;
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
  "Sponge",
  "Cream",
  "Filling",
  "Layers",
  "Frost",
  "Decorate",
  "Plate",
  "Scene",
];
const subtitles = [
  "Start with something soft",
  "A little cream, a little magic",
  "Something lovely in the middle",
  "One layer or two?",
  "The finishing swirl",
  "Make it wonderfully yours",
  "A plate for your creation",
  "Set a lovely little scene",
];
const descriptions = [
  "Pick a shape and a sponge flavor. We will take it from here.",
  "Choose a bowl. Hold and sweep to spread the cream yourself.",
  "Add as much filling as you like. A little chocolate is lovely, too.",
  "Keep it simple, or tuck your filling under another soft layer.",
  "Your hand, your spatula. Smooth the coat to 85% for a soft finish.",
  "Pick a treat. Place, turn, and arrange it just how you like.",
  "From the cake stand to a little moment worth keeping.",
  "Choose a cozy setting for your final photograph.",
];
function selectStep(next) {
  commitGesture();
  const previousBackground = step < 6 ? 0 : state.background;
  stopEffect();
  tool = null;
  selected = null;
  step = next;
  presentation = false;
  save();
  panel();
  $("#panel").classList.remove("materials-enter");
  void $("#panel").offsetWidth;
  $("#panel").classList.add("materials-enter");
  play(
    [1, 4].includes(step) ? "tools" : step >= 6 ? "scene" : "stage",
    undefined,
    undefined,
    previousBackground,
  );
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
const creamNames = [
  "Vanilla",
  "Strawberry",
  "Lavender",
  "Honey",
  "Blue sky",
  "Chocolate",
  "Matcha",
];
const spongeNames = ["Vanilla", "Chocolate", "Strawberry", "Matcha"];
function colorPicker(p, key, label, colors, names) {
  const custom = "custom" + key[0].toUpperCase() + key.slice(1),
    row = document.createElement("div");
  row.className = "swatches";
  colors.forEach((color, i) => {
    const b = document.createElement("button");
    b.className =
      "swatch" + (state[key] === i && !state[custom] ? " active" : "");
    b.style.background = color;
    b.setAttribute("aria-label", label + " " + names[i]);
    b.setAttribute("aria-pressed", String(state[key] === i && !state[custom]));
    b.onclick = () =>
      change(() => {
        state[key] = i;
        state[custom] = null;
      });
    row.append(b);
  });
  p.append(row);
  const field = document.createElement("label");
  field.className = "color-picker";
  field.textContent = "Mix your own " + label.toLowerCase();
  const input = document.createElement("input");
  input.type = "color";
  input.value = state[custom] || colors[state[key]];
  input.setAttribute("aria-label", "Custom " + label.toLowerCase());
  input.onchange = () => change(() => (state[custom] = input.value));
  field.append(input);
  p.append(field);
}
function bowls(p, first = false) {
  const row = document.createElement("div");
  row.className = "cream-bowls";
  const key = first ? "fillingCream" : "cream",
    custom = first ? "customFilling" : "customCream";
  creamColors.forEach((color, i) => {
    const b = button(creamNames[i], state[key] === i && !state[custom], () => {
      stopEffect();
      change(() => {
        state[key] = i;
        state[custom] = null;
        const [strokes, filled] = brushKeys();
        state[strokes] = [];
        state[filled] = false;
      });
    });
    const icon = document.createElement("canvas");
    icon.width = 130;
    icon.height = 100;
    drawBowl(icon.getContext("2d"), 65, 48, color, 0.58);
    b.prepend(icon);
    row.append(b);
  });
  p.append(row);
  const field = document.createElement("label");
  field.className = "color-picker";
  field.textContent = "Mix a custom cream";
  const input = document.createElement("input");
  input.type = "color";
  input.value = state[custom] || creamColors[state[key]];
  input.setAttribute(
    "aria-label",
    first ? "Custom filling cream" : "Custom frosting cream",
  );
  input.onchange = () =>
    change(() => {
      stopEffect();
      state[custom] = input.value;
      const [strokes, filled] = brushKeys();
      state[strokes] = [];
      state[filled] = false;
    });
  field.append(input);
  p.append(field);
}
function material(type) {
  const b = button(toppingNames[type], false, () => {}),
    mini = document.createElement("canvas");
  mini.width = 100;
  mini.height = 100;
  drawTopping(mini.getContext("2d"), type, 50, 52, type === "text" ? 0.6 : 1.1);
  b.prepend(mini);
  let start = null,
    moved = false,
    suppress = false;
  b.onclick = () => {
    if (suppress) {
      suppress = false;
      return;
    }
    add(type);
  };
  b.onpointerdown = (e) => {
    if (e.button !== 0) return;
    start = { x: e.clientX, y: e.clientY };
    moved = false;
    b.setPointerCapture(e.pointerId);
  };
  b.onpointermove = (e) => {
    if (start && Math.hypot(e.clientX - start.x, e.clientY - start.y) > 9) {
      moved = true;
      $("#hint").textContent = "Release over the cake to place your treat.";
    }
  };
  b.onpointerup = (e) => {
    if (!start) return;
    start = null;
    if (!moved) return;
    suppress = true;
    const pos = coordinates(e);
    if (ctx.isPointInPath(cakePath(state.shape, 0.8), pos.x, pos.y))
      add(type, undefined, pos);
    else toast("Drop your treat onto the cake surface.");
    setTimeout(() => (suppress = false), 50);
  };
  b.onpointercancel = () => {
    start = null;
    moved = false;
  };
  return b;
}
function panel() {
  $("#stepCount").textContent = `0${step + 1} / 08`;
  $("#phaseTitle").textContent = stepNames[step];
  const p = $("#panel");
  p.replaceChildren();
  const title = document.createElement("h2");
  title.textContent = subtitles[step];
  const d = document.createElement("p");
  d.textContent = descriptions[step];
  p.append(title, d);
  const grid = document.createElement("div");
  grid.className = "options";
  if (step === 0) {
    ["Round", "Heart", "Square", "Flower"].forEach((n, i) =>
      grid.append(
        button(
          n,
          state.shape === i,
          () => {
            change(() => {
              state.shape = i;
              state.toppings.forEach(constrain);
              state.fillingToppings.forEach(constrain);
            });
            play("sponge");
          },
          `<svg viewBox="0 0 80 55" fill="#ead0a3" stroke="#c59c6d" stroke-width="1.4">${shapeSvgs[i]}</svg>`,
        ),
      ),
    );
    p.append(grid);
    const label = document.createElement("div");
    label.className = "field-label";
    label.textContent = "SPONGE FLAVOR";
    label.style.marginTop = "20px";
    p.append(label);
    colorPicker(p, "cake", "Sponge color", cakeColors, spongeNames);
  }
  if (step === 1 || step === 4) {
    bowls(p, step === 1);
    const meter = document.createElement("div");
    meter.className = "frost-meter";
    meter.innerHTML =
      '<span>Cream coverage <b id="frostPercent"></b></span><progress id="frostProgress" class="sr-only" max="100" aria-label="Cream coverage"></progress>';
    p.append(meter);
    const tip = document.createElement("div");
    tip.className = "brush-tip";
    tip.textContent =
      "Hold and drag your spatula. Reach 85% coverage and the final swirls will settle automatically.";
    p.append(tip);
  }
  if (step === 3) {
    const row = document.createElement("div");
    row.className = "layer-options";
    row.append(
      button("Keep one layer", state.layersChosen && !state.layered, () => {
        change(() => {
          state.layered = false;
          state.layersChosen = true;
        });
        play("sponge", () => selectStep(4));
      }),
      button("Add a second layer", state.layered, () => {
        if (state.layered) {
          selectStep(4);
          return;
        }
        change(() => {
          state.layered = true;
          state.layersChosen = true;
        });
        play("layer", () => selectStep(4));
      }),
    );
    p.append(row);
    const note = document.createElement("p");
    note.className = "stage-note";
    note.textContent =
      "Your filling stays safe. Revisit it whenever inspiration strikes.";
    p.append(note);
  }
  if (step === 2 || step === 5) {
    const cats = document.createElement("div");
    cats.className = "topping-categories";
    [
      "Fruit",
      "Sweets",
      ...(step === 5 ? ["Details", "Lettering"] : []),
    ].forEach((n) => {
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
    const current =
      step === 2 && !["Fruit", "Sweets"].includes(category)
        ? "Fruit"
        : category;
    const types = {
      Fruit: [
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
      Sweets: ["cookie", "chocolate", "macaron"],
      Details: ["flower", "bow", "pearls", "cream"],
      Lettering: ["text"],
    }[current];
    if (step === 2) types[types.indexOf("mint")] = "grapes";
    else if (current === "Fruit") types.push("grapes");
    types.forEach((type) => grid.append(material(type)));
    if (step === 5 && category === "Lettering") {
      const input = document.createElement("input");
      input.className = "text-input";
      input.id = "customText";
      input.placeholder = "A sweet little message (up to 20 characters)";
      input.maxLength = 20;
      input.setAttribute("aria-label", "Your sweet message");
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
    plates.forEach((plate, i) => {
      const option = button(
        plate.name,
        state.plate === i,
        () => change(() => (state.plate = i)),
        plate.thumbnail
          ? `<img src="${plate.thumbnail}" alt="" draggable="false" />`
          : `<svg style="width:100%;height:74px" viewBox="0 0 80 55"><ellipse cx="40" cy="29" rx="34" ry="21" fill="#fffaf0" stroke="#d3bd9f"/><ellipse cx="40" cy="29" rx="29" ry="17" fill="none" stroke="#bd9b72" stroke-dasharray="1 5"/><ellipse cx="40" cy="29" rx="25" ry="14" fill="none" stroke="#dfd4c0"/></svg>`,
      );
      option.disabled = Boolean(plate.file && !plate.image);
      grid.append(option);
    });
  if (step === 7)
    ["Cream linen", "Pink gingham", "Warm wood", "Garden picnic"].forEach(
      (n, i) =>
        grid.append(
          button(
            n,
            state.background === i,
            () => {
              const previousBackground = state.background;
              change(() => (state.background = i));
              play("scene", finish, undefined, previousBackground);
            },
            `<svg viewBox="0 0 80 55"><rect x="8" y="4" width="64" height="45" rx="5" fill="${["#f0e5d3", "#edc9ca", "#c49b74", "#dae1c6"][i]}"/>${i === 1 || i === 3 ? '<path d="M20 4V49M40 4V49M60 4V49M8 17H72M8 34H72" stroke="#ffffff70" stroke-width="7"/>' : i === 2 ? '<path d="M8 16H72M8 31H72M8 44H72" stroke="#8c63423d"/>' : ""}</svg>`,
          ),
        ),
    );
  if (step !== 0) p.append(grid);
  if (step === 6) {
    const active = grid.querySelector(".active");
    if (active) grid.scrollLeft = active.offsetLeft - grid.offsetLeft;
  }
  if (step === 2 || step === 5) {
    const b = document.createElement("button");
    b.className = "subtle clear";
    b.textContent = step === 2 ? "Clear filling" : "Clear decorations";
    b.disabled = !activeToppings().length;
    b.onclick = () => $("#clearConfirm").showModal();
    p.append(b);
  }
  const completions = {
    0: ["Place this sponge", () => play("sponge", () => selectStep(1))],
    2: [
      state.fillingToppings.length ? "Finish filling" : "Keep it simple",
      () => selectStep(3),
    ],
    5: ["Ready to plate", () => selectStep(6)],
    6: ["Set the scene", () => selectStep(7)],
  };
  if ([1, 4].includes(step) && state[brushKeys()[1]])
    completions[step] = ["Keep this coat", () => selectStep(step + 1)];
  if (completions[step]) {
    const [label, action] = completions[step],
      done = document.createElement("button");
    done.id = "completeStage";
    done.className = "complete-stage";
    done.textContent = label;
    done.onclick = () => {
      if (drag) commitGesture();
      stopEffect();
      action();
    };
    p.append(done);
  }
  $("#prev").disabled = step === 0;
  $("#hint").textContent = [1, 4].includes(step)
    ? "Tap or sweep across the cake to spread cream"
    : step === 2 || step === 5
      ? "Tap to add · Drag to arrange · Select to adjust"
      : "Take your time. Every step is yours to revisit.";
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
function add(type, text, position) {
  stopEffect();
  if (activeToppings().length >= 250) {
    toast("That is a lot of sweetness! Remove a few treats to add more.");
    return;
  }
  change(() => {
    const i = activeToppings().length,
      a = i * 2.4,
      r = i === 0 || type === "text" ? 0 : 85 + ((i - 1) % 3) * 25;
    const t = constrain({
      id: `${Date.now()}-${id++}`,
      type,
      x: position?.x ?? Math.cos(a) * r,
      y: position?.y ?? Math.sin(a) * r * 0.6,
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
  play("topping", undefined, selected);
  toast("Added " + toppingNames[type] + ". Drag it into place.");
}
// Brush geometry is saved as vector strokes; a pointer gesture is one undo action.
function frostCoverage() {
  const [strokes, filled] = brushKeys();
  if (state[filled]) return 100;
  const list = state[strokes];
  if (
    !coverageMemo ||
    coverageMemo.list !== list ||
    coverageMemo.shape !== state.shape
  ) {
    const samples = [],
      path = cakePath(state.shape);
    for (let x = -294; x <= 294; x += 12)
      for (let y = -198; y <= 198; y += 12)
        if (ctx.isPointInPath(path, x, y)) samples.push({ x, y });
    coverageMemo = {
      list,
      shape: state.shape,
      samples,
      seen: [],
      covered: new Uint8Array(samples.length),
      count: 0,
    };
  }
  const m = coverageMemo;
  list.forEach((stroke, i) => {
    for (let j = m.seen[i] || 0; j < stroke.length; j++) {
      const p = stroke[j];
      m.samples.forEach((s, k) => {
        if (!m.covered[k] && (s.x - p.x) ** 2 + (s.y - p.y) ** 2 <= 43 ** 2) {
          m.covered[k] = 1;
          m.count++;
        }
      });
    }
    m.seen[i] = stroke.length;
  });
  return m.samples.length ? (m.count / m.samples.length) * 100 : 0;
}
function commitGesture() {
  if (!drag) return;
  const current = drag;
  if (current.moved) {
    history.push(current.before);
    if (history.length > 60) history.shift();
    save();
  }
  drag = null;
  if (tool) tool.painting = false;
  try {
    if (canvas.hasPointerCapture(current.pointer))
      canvas.releasePointerCapture(current.pointer);
  } catch {}
}
function maybeCompleteFrost() {
  if (![1, 4].includes(step)) return;
  const filled = brushKeys()[1];
  if (!state[filled] && frostCoverage() >= 85) {
    state[filled] = true;
    const completedStage = step;
    play("cream-complete", () => {
      commitGesture();
      if (step === completedStage) {
        selectStep(completedStage + 1);
        toast("Beautifully smooth. On to the next little step.");
      }
    });
  }
}
function moveTool(pos, painting = false) {
  const dy = tool ? pos.y - tool.y : 0;
  tool = {
    ...pos,
    angle: -0.55 + Math.max(-0.18, Math.min(0.18, dy / 100)),
    painting,
  };
}
function requestHoverPaint() {
  if (hoverFrame === null)
    hoverFrame = requestAnimationFrame(() => {
      hoverFrame = null;
      paint();
    });
}
function startFrost(e, pos) {
  if (
    !ctx.isPointInPath(cakePath(state.shape), pos.x, pos.y) ||
    state[brushKeys()[1]]
  )
    return;
  if (state[brushKeys()[0]].length >= 80) {
    toast("Try smoothing the cream, or start these strokes again.");
    return;
  }
  drag = {
    pointer: e.pointerId,
    brush: true,
    before: clone(state),
    moved: true,
  };
  state[brushKeys()[0]].push([pos]);
  moveTool(pos, true);
  maybeCompleteFrost();
  if (drag?.pointer === e.pointerId) canvas.setPointerCapture(e.pointerId);
  paint();
}
function continueFrost(pos) {
  const paintingStage = step,
    filled = brushKeys()[1];
  if (state[filled]) return;
  const points = state[brushKeys()[0]].at(-1),
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
    if (ctx.isPointInPath(cakePath(state.shape), p.x, p.y)) {
      points.push(p);
      maybeCompleteFrost();
      if (step !== paintingStage || !drag?.brush || state[filled]) break;
    }
  }
  if (step === paintingStage) maybeCompleteFrost();
}
function coordinates(e) {
  const r = canvas.getBoundingClientRect();
  return {
    x: ((e.clientX - r.left) * 1000) / r.width - 500,
    y: ((e.clientY - r.top) * 900) / r.height - 402,
  };
}
canvas.addEventListener("pointerdown", (e) => {
  if (e.button !== 0 || presentation || effect?.kind === "cream-complete")
    return;
  stopEffect();
  const pos = coordinates(e);
  if ([1, 4].includes(step)) moveTool(pos);
  if ([1, 4].includes(step) && !presentation) {
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
  if ([1, 4].includes(step) && !presentation) {
    moveTool(coordinates(e), Boolean(drag?.brush));
    requestHoverPaint();
  }
  if (!drag || e.pointerId !== drag.pointer) return;
  if (drag.brush) {
    continueFrost(coordinates(e));
    requestHoverPaint();
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
  const wasBrush = drag.brush;
  commitGesture();
  if (e.pointerType === "touch") tool = null;
  else if (tool) tool.painting = false;
  paint();
  if (wasBrush) panel();
}
canvas.addEventListener("pointerup", endDrag);
canvas.addEventListener("pointerleave", () => {
  if (!drag) {
    tool = null;
    requestHoverPaint();
  }
});
canvas.addEventListener("pointercancel", (e) => {
  tool = null;
  stopEffect();
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
  stopEffect();
  presentation = false;
  if (history.length) {
    state = history.pop();
    step = state.stage;
    selected = null;
    save();
    paint();
    panel();
  }
};
$("#prev").onclick = () => {
  selectStep(Math.max(0, step - 1));
};
$("#cancelClear").onclick = () => $("#clearConfirm").close();
$("#confirmClear").onclick = () => {
  stopEffect();
  change(() => {
    if (step === 2) state.fillingToppings = [];
    else state.toppings = [];
    selected = null;
  });
  $("#clearConfirm").close();
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
  $("#cakeName").value = state.name;
  play("finish", () => {
    $("#resultImage").src = artwork().toDataURL("image/png");
    $("#result").showModal();
  });
}
$("#finish").onclick = finish;
function edit() {
  presentation = false;
  $("#result").close();
  play("scene");
}
$("#edit").onclick = edit;
$("#result").addEventListener("cancel", () => {
  stopEffect();
  presentation = false;
  paint();
});
$("#download").onclick = () => {
  artwork().toBlob((blob) => {
    if (!blob) {
      toast("We could not save that image. Please try again.");
      return;
    }
    const url = URL.createObjectURL(blob),
      a = document.createElement("a");
    a.href = url;
    a.download =
      (state.name
        .replace(/[^a-z0-9]+/gi, "-")
        .replace(/^-|-$/g, "")
        .slice(0, 40) || "my-little-cake") + ".png";
    document.body.append(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 10000);
    toast("Image saved. On mobile, you can also press and hold the photo.");
  }, "image/png");
};
function askReset() {
  stopEffect();
  if (!$("#result").open) {
    presentation = false;
    paint();
  }
  $("#confirm").showModal();
}
$("#reset").onclick = askReset;
$("#restart").onclick = askReset;
$("#cancelReset").onclick = () => $("#confirm").close();
$("#confirmReset").onclick = () => {
  stopEffect();
  tool = null;
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
  toast("A fresh sponge, a fresh little beginning.");
};

$("#begin").onclick = () => {
  $("#welcome").close();
  save();
  play("sponge");
  toast("Choose a sponge shape. Let us make something lovely.");
};
$("#cakeName").oninput = () => {
  state.name = $("#cakeName").value.trim().slice(0, 32) || "My little cake";
  save();
  paint();
  $("#resultImage").src = artwork().toDataURL("image/png");
};
const fitCanvas = new ResizeObserver(([entry]) => {
  const { width, height } = entry.contentRect;
  $(".canvas-wrap").style.width =
    Math.max(1, Math.min(width, (height * 1000) / 900)) + "px";
});
fitCanvas.observe($(".art-area"));
try {
  await loadPlateAssets();
} catch {
  toast("Some plate artwork could not load. Please refresh to try again.");
}
const welcomeState = {
  ...fresh(),
  baseCream: true,
  layered: true,
  frosted: true,
  toppings: [
    {
      id: "welcome-1",
      type: "strawberryHalf",
      x: -50,
      y: -20,
      scale: 1.3,
      rotation: -0.2,
      text: "",
    },
    {
      id: "welcome-2",
      type: "blueberry",
      x: 12,
      y: 20,
      scale: 1,
      rotation: 0,
      text: "",
    },
    {
      id: "welcome-3",
      type: "flower",
      x: 70,
      y: -15,
      scale: 0.8,
      rotation: 0,
      text: "",
    },
  ],
};
const welcomeContext = $("#welcomeCake").getContext("2d");
welcomeContext.scale(0.5, 0.4);
render(welcomeContext, welcomeState, { stage: 5 });
paint();
panel();
if (restoreNotice) toast(restoreNotice);
if (!restored) $("#welcome").showModal();
if (!storageAvailable) $("#saved").textContent = "Autosave unavailable";
