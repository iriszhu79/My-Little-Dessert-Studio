import { test, expect } from "@playwright/test";
import { readFile } from "node:fs/promises";
const stages = [
  "Sponge",
  "Cream",
  "Filling",
  "Layers",
  "Frost",
  "Decorate",
  "Plate",
  "Scene",
];
const saved = (p) =>
  p.evaluate(() =>
    JSON.parse(localStorage.getItem("little-dessert-painted-preview-v1")),
  );
const button = (p, n) => p.getByRole("button", { name: n, exact: true });
async function settled(p) {
  await expect(p.locator(".workspace")).not.toHaveAttribute(
    "aria-busy",
    "true",
  );
}
async function click(p, n) {
  await button(p, n).click();
  await settled(p);
}
async function current(p) {
  return stages.indexOf((await p.locator("#phaseTitle").textContent()).trim());
}
async function start(p) {
  await p.goto("/");
  await button(p, "Start baking →").click();
  await settled(p);
}
async function coat(p, mobile, hold = false) {
  const from = await current(p);
  await p.locator("#cake").scrollIntoViewIfNeeded();
  const b = await p.locator("#cake").boundingBox(),
    pt = (x, y) => ({
      x: b.x + ((500 + x) * b.width) / 1000,
      y: b.y + ((402 + y) * b.height) / 900,
    });
  const points = [
    [0, 0],
    [0, -130],
    [-220, -100],
    [220, -100],
    [220, -35],
    [-220, -35],
    [-220, 30],
    [220, 30],
    [220, 95],
    [-220, 95],
    [0, 145],
    [0, -150],
    [-240, 0],
    [240, 0],
  ];
  const client = mobile ? await p.context().newCDPSession(p) : null,
    first = pt(...points[0]);
  if (mobile)
    await client.send("Input.dispatchTouchEvent", {
      type: "touchStart",
      touchPoints: [first],
    });
  else {
    await p.mouse.move(first.x, first.y);
    await p.mouse.down();
  }
  for (const point of points.slice(1)) {
    const q = pt(...point);
    if (mobile)
      await client.send("Input.dispatchTouchEvent", {
        type: "touchMove",
        touchPoints: [q],
      });
    else await p.mouse.move(q.x, q.y, { steps: 2 });
    if (
      (await current(p)) !== from ||
      (await p.locator("#frostProgress").evaluate((e) => e.value)) >= 100
    )
      break;
  }
  if (hold) {
    await expect(p.locator("#phaseTitle")).toHaveText(stages[from + 1]);
    const q = pt(90, 30);
    if (mobile)
      await client.send("Input.dispatchTouchEvent", {
        type: "touchMove",
        touchPoints: [q],
      });
    else await p.mouse.move(q.x, q.y);
  }
  if (mobile)
    await client.send("Input.dispatchTouchEvent", {
      type: "touchEnd",
      touchPoints: [],
    });
  else await p.mouse.up();
  await expect(p.locator("#phaseTitle")).toHaveText(stages[from + 1]);
  await settled(p);
}
async function partial(p, mobile) {
  const b = await p.locator("#cake").boundingBox(),
    a = { x: b.x + (390 * b.width) / 1000, y: b.y + (377 * b.height) / 900 },
    z = { x: b.x + (610 * b.width) / 1000, y: a.y };
  if (mobile) {
    const c = await p.context().newCDPSession(p);
    await c.send("Input.dispatchTouchEvent", {
      type: "touchStart",
      touchPoints: [a],
    });
    await c.send("Input.dispatchTouchEvent", {
      type: "touchMove",
      touchPoints: [z],
    });
    await c.send("Input.dispatchTouchEvent", {
      type: "touchEnd",
      touchPoints: [],
    });
  } else {
    await p.mouse.move(a.x, a.y);
    await p.mouse.down();
    await p.mouse.move(z.x, z.y, { steps: 8 });
    await p.mouse.up();
  }
}
async function stage(p, target, mobile) {
  const n = stages.indexOf(target);
  for (let guard = 0; guard < 20; guard++) {
    const i = await current(p);
    if (i === n) return;
    const order = [0, 3, 1, 2, 4, 5, 6, 7];
    if (order.indexOf(i) > order.indexOf(n)) {
      await p.locator("#prev").click();
      await settled(p);
      continue;
    }
    if ([0, 2, 5].includes(i)) {
      await p.locator("#completeStage").click();
      await settled(p);
    } else if ([1, 4].includes(i)) {
      if (await p.locator("#completeStage").count()) {
        await p.locator("#completeStage").click();
        await settled(p);
      } else await coat(p, mobile);
    } else if (i === 3) await click(p, "Add a second layer");
    else if (i === 6) await click(p, "Set the scene");
  }
  throw Error("Could not reach " + target);
}
async function category(p, name) {
  await p
    .locator(".topping-categories")
    .getByRole("button", { name, exact: true })
    .click();
}

test("guided baking preserves shapes, colors, lettering, plate and named PNG without a step picker", async ({
  page,
}, info) => {
  test.setTimeout(60000);
  const mobile = info.project.name === "mobile",
    errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await start(page);
  for (const [i, n] of ["Round", "Heart", "Square", "Flower"].entries()) {
    await click(page, n);
    expect((await saved(page)).shape).toBe(i);
  }
  await click(page, "Sponge color Matcha");
  await page.getByLabel("Custom sponge color").fill("#bbc781");
  expect((await saved(page)).customCake).toBe("#bbc781");
  await click(page, "Place this sponge");
  await expect(page.locator("#phaseTitle")).toHaveText("Layers");
  await click(page, "Add a second layer");
  await expect(page.locator("#phaseTitle")).toHaveText("Cream");
  await click(page, "Strawberry");
  await partial(page, mobile);
  expect(await current(page)).toBe(1);
  expect((await saved(page)).baseCream).toBe(false);
  await coat(page, mobile);
  expect((await saved(page)).baseCream).toBe(true);
  await click(page, "Green grapes");
  await click(page, "Strawberry half");
  await category(page, "Sweets");
  await click(page, "Chocolate");
  const filling = (await saved(page)).fillingToppings;
  expect(filling).toHaveLength(3);
  await click(page, "Cover with the second layer →");
  await expect(page.locator("#phaseTitle")).toHaveText("Frost");
  await click(page, "Vanilla");
  await coat(page, mobile);
  await category(page, "Fruit");
  for (const n of ["Strawberry fan", "Blueberry", "Kiwi slice"])
    await click(page, n);
  await category(page, "Details");
  await click(page, "Daisy");
  await category(page, "Lettering");
  await page.getByLabel("Your sweet message").fill("Hello, sunshine");
  await click(page, "Sweet lettering");
  const tops = (await saved(page)).toppings;
  expect(tops).toHaveLength(5);
  expect(tops.at(-1).text).toBe("Hello, sunshine");
  await click(page, "Ready to plate");
  await click(page, "Classic Ivory");
  await click(page, "Set the scene");
  await expect(page.locator("#phaseTitle")).toHaveText("Scene");
  await click(page, "Pink gingham");
  await expect(page.locator("#result")).toBeVisible();
  await page.getByLabel("Give your cake a name").fill("Sunshine picnic");
  const promise = page.waitForEvent("download");
  await click(page, "Save image");
  const d = await promise,
    png = await readFile(await d.path());
  expect(d.suggestedFilename()).toBe("Sunshine-picnic.png");
  expect(png.subarray(1, 4).toString()).toBe("PNG");
  expect(png.readUInt32BE(16)).toBe(1000);
  expect(png.readUInt32BE(20)).toBe(900);
  const same = await page.evaluate(async () => {
    const image = document.querySelector("#resultImage");
    await image.decode();
    const c = document.createElement("canvas");
    c.width = 1000;
    c.height = 900;
    c.getContext("2d").drawImage(image, 0, 0);
    const a = c.getContext("2d").getImageData(0, 0, 1000, 900).data,
      b = document
        .querySelector("#cake")
        .getContext("2d")
        .getImageData(0, 0, 1000, 900).data;
    return a.every((v, i) => v === b[i]);
  });
  expect(same).toBe(true);
  expect(
    png.equals(
      Buffer.from(
        (await page.locator("#resultImage").getAttribute("src")).split(",")[1],
        "base64",
      ),
    ),
  ).toBe(true);
  await click(page, "Keep editing");
  const state = await saved(page);
  await page.reload();
  expect(await saved(page)).toEqual(state);
  expect((await saved(page)).toppings).toEqual(tops);
  expect((await saved(page)).fillingToppings).toEqual(filling);
  await expect(page.locator("#steps")).toHaveCount(0);
  await expect(page.locator("#next")).toHaveCount(0);
  expect(errors).toEqual([]);
  await page.screenshot({ path: info.outputPath("studio.png") });
});

test("85% coating advances safely even while held, hover does not paint, and Undo returns to the original stroke stage", async ({
  page,
}, info) => {
  test.setTimeout(60000);
  const mobile = info.project.name === "mobile",
    errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await start(page);
  await click(page, "Place this sponge");
  for (const [name, key, flag, next] of [
    ["Cream", "baseStrokes", "baseCream", "Filling"],
    ["Frost", "frosting", "frosted", "Decorate"],
  ]) {
    await stage(page, name, mobile);
    await click(page, "Strawberry");
    const b = await page.locator("#cake").boundingBox(),
      patch = () =>
        page
          .locator("#cake")
          .evaluate((c) => [
            ...c.getContext("2d").getImageData(490, 392, 20, 20).data,
          ]);
    const before = await patch();
    await page.mouse.move(b.x + b.width / 2, b.y + (402 * b.height) / 900);
    await page.evaluate(
      () =>
        new Promise((r) =>
          requestAnimationFrame(() => requestAnimationFrame(r)),
        ),
    );
    expect(await patch()).not.toEqual(before);
    expect((await saved(page))[key]).toHaveLength(0);
    await partial(page, mobile);
    const prior = await saved(page);
    expect(prior[flag]).toBe(false);
    expect(await current(page)).toBe(stages.indexOf(name));
    await coat(page, mobile, true);
    expect((await saved(page))[flag]).toBe(true);
    await expect(page.locator("#phaseTitle")).toHaveText(next);
    const raw = await page.evaluate(async (key) => {
      const { cakePath } = await import("/renderer.js"),
        s = JSON.parse(
          localStorage.getItem("little-dessert-painted-preview-v1"),
        );
      const a = document.createElement("canvas"),
        b = document.createElement("canvas");
      for (const c of [a, b]) {
        c.width = 128;
        c.height = 96;
      }
      const x = a.getContext("2d"),
        y = b.getContext("2d");
      for (const c of [x, y]) c.setTransform(0.18, 0, 0, 0.18, 64, 43);
      x.fill(cakePath(s.shape));
      y.clip(cakePath(s.shape));
      y.lineWidth = 86;
      y.lineCap = "round";
      y.lineJoin = "round";
      for (const st of s[key]) {
        if (!st.length) continue;
        y.beginPath();
        y.moveTo(st[0].x, st[0].y);
        for (const p of st) y.lineTo(p.x, p.y);
        y.stroke();
        y.beginPath();
        y.arc(st[0].x, st[0].y, 43, 0, Math.PI * 2);
        y.fill();
      }
      const m = x.getImageData(0, 0, 128, 96).data,
        n = y.getImageData(0, 0, 128, 96).data;
      let total = 0,
        covered = 0;
      for (let i = 3; i < m.length; i += 4)
        if (m[i] > 127) {
          total++;
          if (n[i] > 127) covered++;
        }
      return covered / total;
    }, key);
    expect(raw).toBeGreaterThan(0.83);
    expect(raw).toBeLessThan(0.9);
    await click(page, "Undo");
    await expect(page.locator("#phaseTitle")).toHaveText(name);
    expect((await saved(page))[flag]).toBe(false);
    expect((await saved(page))[key]).toEqual(prior[key]);
  }
  expect(errors).toEqual([]);
});

test("desktop fits one viewport, artwork centers in its right pane, and only three bottom actions are fixed", async ({
  page,
}, info) => {
  await start(page);
  for (const [width, height] of [
    [1440, 900],
    [1366, 768],
    [1280, 720],
    [1024, 600],
    [390, 844],
    [320, 640],
  ]) {
    await page.setViewportSize({ width, height });
    await page.evaluate(
      () =>
        new Promise((r) =>
          requestAnimationFrame(() => requestAnimationFrame(r)),
        ),
    );
    const layout = await page.evaluate(() => ({
      w: innerWidth,
      h: innerHeight,
      sw: document.documentElement.scrollWidth,
      sh: document.documentElement.scrollHeight,
      art: document.querySelector(".art-area").getBoundingClientRect().toJSON(),
      aside: document.querySelector("aside").getBoundingClientRect().toJSON(),
      canvas: document.querySelector("#cake").getBoundingClientRect().toJSON(),
      footer: document
        .querySelector("#studioActions")
        .getBoundingClientRect()
        .toJSON(),
    }));
    expect(layout.sw).toBeLessThanOrEqual(width);
    expect(layout.sh).toBeLessThanOrEqual(height);
    expect(layout.canvas.left).toBeGreaterThanOrEqual(layout.art.left - 0.5);
    expect(layout.canvas.right).toBeLessThanOrEqual(layout.art.right + 0.5);
    expect(layout.canvas.top).toBeGreaterThanOrEqual(layout.art.top - 0.5);
    expect(layout.canvas.bottom).toBeLessThanOrEqual(layout.footer.top + 0.5);
    expect(layout.footer.bottom).toBeLessThanOrEqual(height);
    if (width > 900) {
      expect(layout.aside.right).toBeLessThan(layout.art.left);
      expect(
        Math.abs(
          (layout.canvas.left + layout.canvas.right) / 2 -
            (layout.art.left + layout.art.right) / 2,
        ),
      ).toBeLessThan(1);
    } else expect(layout.art.bottom).toBeLessThanOrEqual(layout.aside.top + 1);
    for (const id of ["prev", "reset", "finish"]) {
      const b = await page.locator("#" + id).boundingBox();
      expect(b.y + b.height).toBeLessThanOrEqual(height);
      expect(b.y).toBeGreaterThanOrEqual(layout.footer.top);
    }
  }
  await expect(page.locator("#studioActions button")).toHaveCount(3);
  await expect(page.locator("#panel #prev")).toHaveCount(0);
  await expect(page.getByRole("navigation")).toHaveCount(0);
  await expect(button(page, "Spread to 85%")).toHaveCount(0);
});

test("every tablecloth stays separate from the ingredients and preserves the cake while opening its final photo", async ({
  page,
}, info) => {
  test.setTimeout(60000);
  const mobile = info.project.name === "mobile";
  await start(page);
  await stage(page, "Decorate", mobile);
  await click(page, "Strawberry fan");
  const tops = (await saved(page)).toppings;
  await click(page, "Ready to plate");
  await click(page, "Pink Gingham");
  await click(page, "Set the scene");
  for (const name of [
    "Cream linen",
    "Pink gingham",
    "Warm wood",
    "Garden picnic",
  ]) {
    await click(page, name);
    await expect(page.locator("#result")).toBeVisible();
    await click(page, "Keep editing");
    expect((await saved(page)).toppings).toEqual(tops);
    expect((await saved(page)).plate).toBe(3);
    const [art, aside, canvas] = await Promise.all(
      [".art-area", "aside", "#cake"].map((s) => page.locator(s).boundingBox()),
    );
    if (!mobile) expect(canvas.x).toBeGreaterThan(aside.x + aside.width);
    else expect(art.y + art.height).toBeLessThanOrEqual(aside.y + 1);
    expect(canvas.x + canvas.width).toBeLessThanOrEqual(art.x + art.width + 1);
    expect(
      await page
        .locator("aside")
        .evaluate((e) => getComputedStyle(e).backgroundColor),
    ).toBe("rgba(0, 0, 0, 0)");
  }
  await page.screenshot({ path: info.outputPath("scene-no-overlap.png") });
});

test("ingredients and decorations still support dragging, transforms, deletion, clear confirmation and undo", async ({
  page,
}, info) => {
  test.setTimeout(60000);
  const mobile = info.project.name === "mobile";
  await start(page);
  await stage(page, "Filling", mobile);
  await expect(button(page, "Mint leaves")).toHaveCount(0);
  await click(page, "Green grapes");
  expect((await saved(page)).fillingToppings[0].type).toBe("grapes");
  await click(page, "Cover with the second layer →");
  await coat(page, mobile);
  await click(page, "Strawberry");
  const b = await page.locator("#cake").boundingBox(),
    a = { x: b.x + b.width / 2, y: b.y + (402 * b.height) / 900 },
    z = { x: b.x + (590 * b.width) / 1000, y: b.y + (437 * b.height) / 900 };
  if (mobile) {
    const c = await page.context().newCDPSession(page);
    await c.send("Input.dispatchTouchEvent", {
      type: "touchStart",
      touchPoints: [a],
    });
    await c.send("Input.dispatchTouchEvent", {
      type: "touchMove",
      touchPoints: [z],
    });
    await c.send("Input.dispatchTouchEvent", {
      type: "touchEnd",
      touchPoints: [],
    });
  } else {
    await page.mouse.move(a.x, a.y);
    await page.mouse.down();
    await page.mouse.move(z.x, z.y, { steps: 8 });
    await page.mouse.up();
  }
  expect((await saved(page)).toppings[0].x).toBeGreaterThan(50);
  await click(page, "Make larger");
  await click(page, "Rotate");
  expect((await saved(page)).toppings[0].scale).toBe(1.1);
  expect((await saved(page)).toppings[0].rotation).toBeGreaterThan(0);
  await click(page, "Delete");
  expect((await saved(page)).toppings).toHaveLength(0);
  await click(page, "Undo");
  expect((await saved(page)).toppings).toHaveLength(1);
  await click(page, "Blueberry");
  await button(page, "Clear decorations").click();
  await click(page, "Keep them");
  expect((await saved(page)).toppings).toHaveLength(2);
  await button(page, "Clear decorations").click();
  await click(page, "Clear them");
  expect((await saved(page)).toppings).toHaveLength(0);
  await click(page, "Undo");
  expect((await saved(page)).toppings).toHaveLength(2);
});

test("Back edits an earlier recipe without duplicating layers or dropping filling", async ({
  page,
}, info) => {
  test.setTimeout(60000);
  const mobile = info.project.name === "mobile";
  await start(page);
  await stage(page, "Filling", mobile);
  await click(page, "Strawberry half");
  const filling = (await saved(page)).fillingToppings;
  await click(page, "Cover with the second layer →");
  await expect(page.locator("#phaseTitle")).toHaveText("Frost");
  await stage(page, "Layers", mobile);
  await click(page, "Keep one layer");
  await expect(page.locator("#phaseTitle")).toHaveText("Frost");
  expect((await saved(page)).layered).toBe(false);
  await click(page, "← Back");
  await expect(page.locator("#phaseTitle")).toHaveText("Layers");
  await click(page, "Add a second layer");
  await click(page, "Keep this coat");
  await expect(page.locator("#phaseTitle")).toHaveText("Filling");
  expect((await saved(page)).fillingToppings).toEqual(filling);
  await click(page, "Cover with the second layer →");
  expect((await saved(page)).layered).toBe(true);
  expect((await saved(page)).fillingToppings).toEqual(filling);
});

test("all materials remain and every current-stage label and dialog is English", async ({
  page,
}, info) => {
  test.setTimeout(60000);
  const mobile = info.project.name === "mobile";
  await start(page);
  for (const name of stages) {
    await stage(page, name, mobile);
    const text = await page.evaluate(
      () =>
        document.body.innerText +
        " " +
        [...document.querySelectorAll("[aria-label],[placeholder],[title]")]
          .map((e) =>
            [
              e.getAttribute("aria-label"),
              e.getAttribute("placeholder"),
              e.getAttribute("title"),
            ].join(" "),
          )
          .join(" "),
    );
    expect(text).not.toMatch(/\p{Script=Han}/u);
    if (name === "Decorate")
      for (const [cat, names] of Object.entries({
        Fruit: [
          "Strawberry",
          "Strawberry half",
          "Strawberry fan",
          "Blueberry",
          "Kiwi slice",
          "Orange wedge",
          "Lemon slice",
          "Mango fan",
          "Mango cubes",
          "Banana slices",
          "Cherries",
          "Mint leaves",
          "Green grapes",
        ],
        Sweets: ["Cookie", "Chocolate", "Macaron"],
        Details: ["Daisy", "Ribbon bow", "Sugar pearls", "Cream swirl"],
        Lettering: ["Sweet lettering"],
      })) {
        await category(page, cat);
        for (const label of names)
          await expect(button(page, label)).toHaveCount(1);
      }
  }
  await page.locator("#reset").click();
  await expect(page.locator("#confirm")).toBeVisible();
  await click(page, "Keep my cake");
  expect(await current(page)).toBe(7);
});

test("legacy and malformed saves load safely; reset remains confirmed and persistent", async ({
  page,
}) => {
  await page.goto("/");
  await page.evaluate(() =>
    localStorage.setItem(
      "little-dessert-painted-preview-v1",
      JSON.stringify({
        shape: 1,
        cake: 2,
        cream: 3,
        plate: 2,
        slices: 4,
        background: 1,
        toppings: [
          {
            id: "legacy",
            type: "strawberry",
            x: 0,
            y: 0,
            scale: 1,
            rotation: 0,
            text: "Happy Day",
          },
        ],
      }),
    ),
  );
  await page.reload();
  await expect(page.locator("#welcome")).not.toBeVisible();
  await click(page, "Strawberry half");
  const s = await saved(page);
  expect(s.shape).toBe(1);
  expect(s.toppings).toHaveLength(2);
  expect(s.toppings[0].id).toBe("legacy");
  await page.locator("#reset").click();
  await click(page, "Keep my cake");
  expect((await saved(page)).toppings).toHaveLength(2);
  await page.locator("#reset").click();
  await click(page, "Yes, start fresh");
  expect((await saved(page)).toppings).toHaveLength(0);
  await page.reload();
  expect(await current(page)).toBe(0);
  await page.evaluate(() =>
    localStorage.setItem("little-dessert-painted-preview-v1", "{broken"),
  );
  await page.reload();
  await expect(page.locator("#welcome")).toBeVisible();
  await click(page, "Start baking →");
  expect((await saved(page)).baseCream).toBe(false);
});

test("reduced motion and disabled storage still allow guided coating and a PNG download", async ({
  page,
}, info) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.addInitScript(() => {
    Storage.prototype.setItem = function () {
      throw new DOMException("Disabled", "QuotaExceededError");
    };
  });
  await start(page);
  await expect(page.locator("#saved")).toHaveText("Autosave unavailable");
  await click(page, "Place this sponge");
  await click(page, "Add a second layer");
  await coat(page, info.project.name === "mobile");
  await expect(page.locator("#phaseTitle")).toHaveText("Filling");
  await expect(page.locator(".workspace")).not.toHaveAttribute(
    "aria-busy",
    "true",
  );
  await stage(page, "Decorate", info.project.name === "mobile");
  await page.locator("#finish").click();
  await expect(page.locator("#result")).toBeVisible();
  const promise = page.waitForEvent("download");
  await click(page, "Save image");
  expect((await promise).suggestedFilename()).toBe("My-little-cake.png");
});

test("stage transitions recover from throttled animation frames without firing old callbacks twice", async ({
  page,
}) => {
  await start(page);
  await page.evaluate(() => {
    window.testNativeRAF = window.requestAnimationFrame;
    window.testStalledFrames = [];
    window.requestAnimationFrame = (cb) => {
      window.testStalledFrames.push(cb);
      return 0;
    };
    document.querySelector("#completeStage").click();
  });
  await expect(page.locator("#phaseTitle")).toHaveText("Layers");
  await settled(page);
  await page.evaluate(() => {
    window.requestAnimationFrame = window.testNativeRAF;
    for (const cb of window.testStalledFrames) cb(performance.now());
    delete window.testNativeRAF;
    delete window.testStalledFrames;
  });
  await expect(page.locator("#phaseTitle")).toHaveText("Layers");
  expect((await saved(page)).stage).toBe(3);
});

test("six original plates preserve the recipe, restore and export on all four shapes", async ({
  page,
}, info) => {
  test.setTimeout(180000);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await start(page);
  const seed = await saved(page);
  const names = [
    "Classic Ivory",
    "Blue Ribbon",
    "Matcha Dots",
    "Pink Gingham",
    "Blue Stripes",
    "Garden Flowers",
  ];
  const toppings = [
    {
      id: "message",
      type: "text",
      x: 0,
      y: 0,
      scale: 1,
      rotation: 0,
      text: "For You",
    },
  ];
  for (let shape = 0; shape < 4; shape++) {
    await page.evaluate(
      (s) =>
        localStorage.setItem(
          "little-dessert-painted-preview-v1",
          JSON.stringify(s),
        ),
      {
        ...seed,
        shape,
        stage: 6,
        baseCream: true,
        frosted: true,
        layered: true,
        toppings,
      },
    );
    await page.reload();
    await expect(page.locator("#phaseTitle")).toHaveText("Plate");
    const previews = new Set();
    for (let plate = 0; plate < names.length; plate++) {
      await click(page, names[plate]);
      await expect(button(page, names[plate])).toHaveAttribute(
        "aria-pressed",
        "true",
      );
      expect((await saved(page)).plate).toBe(plate);
      expect((await saved(page)).toppings).toEqual(toppings);
      previews.add(await page.locator("#cake").evaluate((c) => c.toDataURL()));
      if (shape === 0) {
        await page.reload();
        await expect(button(page, names[plate])).toHaveAttribute(
          "aria-pressed",
          "true",
        );
        await click(page, "← Back");
        await click(page, "Ready to plate");
        await expect(button(page, names[plate])).toHaveAttribute(
          "aria-pressed",
          "true",
        );
      }
      await click(page, "Set the scene");
      await click(page, "Cream linen");
      await expect(page.locator("#result")).toBeVisible();
      const download = page.waitForEvent("download");
      await click(page, "Save image");
      const png = await readFile(await (await download).path());
      expect(png.subarray(1, 4).toString()).toBe("PNG");
      expect(
        png.equals(
          Buffer.from(
            (await page.locator("#resultImage").getAttribute("src")).split(
              ",",
            )[1],
            "base64",
          ),
        ),
      ).toBe(true);
      await click(page, "Keep editing");
      await click(page, "← Back");
    }
    expect(previews.size).toBe(6);
  }
  await page.screenshot({ path: info.outputPath("six-plates.png") });
});

test("legacy pink plates migrate without losing decorations", async ({
  page,
}) => {
  await start(page);
  const seed = await saved(page);
  await page.evaluate(
    (s) =>
      localStorage.setItem(
        "little-dessert-painted-preview-v1",
        JSON.stringify({ ...s, schemaVersion: 3, plate: 2, stage: 6 }),
      ),
    seed,
  );
  await page.reload();
  await expect(button(page, "Pink Gingham")).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await click(page, "Blue Ribbon");
  expect((await saved(page)).schemaVersion).toBe(6);
});

test("single-layer route skips hidden filling and reserves finishing for decoration", async ({
  page,
}, info) => {
  test.setTimeout(60000);
  await start(page);
  await expect(page.locator("#finish")).toBeDisabled();
  await click(page, "Place this sponge");
  await expect(page.locator("#phaseTitle")).toHaveText("Layers");
  await click(page, "Keep one layer");
  await expect(page.locator("#phaseTitle")).toHaveText("Frost");
  await coat(page, info.project.name === "mobile");
  await click(page, "Strawberry");
  expect((await saved(page)).fillingToppings).toEqual([]);
  await page.locator("#finish").click();
  await settled(page);
  await click(page, "Peek inside");
  await expect(page.locator("#cutNote")).toContainText("One soft sponge");
  await expect(page.locator("#resultImage")).toBeVisible();
  await click(page, "Keep editing");
  await click(page, "← Back");
  await expect(page.locator("#phaseTitle")).toHaveText("Frost");
  await click(page, "← Back");
  await expect(page.locator("#phaseTitle")).toHaveText("Layers");
});

test("slice previews follow real fillings, rotate, preserve the recipe, restore and export", async ({
  page,
}, info) => {
  test.setTimeout(60000);
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await start(page);
  const seed = await saved(page);
  const filling = [
    {
      id: "near",
      type: "strawberryHalf",
      x: 100,
      y: 32,
      scale: 1.2,
      rotation: 0.3,
      text: "",
    },
    {
      id: "far",
      type: "blueberry",
      x: -160,
      y: -80,
      scale: 0.8,
      rotation: 0,
      text: "",
    },
  ];
  const toppings = [
    {
      id: "fruit",
      type: "strawberry",
      x: 100,
      y: 40,
      scale: 1.1,
      rotation: 0.1,
      text: "",
    },
    {
      id: "message",
      type: "text",
      x: 0,
      y: 0,
      scale: 1,
      rotation: 0,
      text: "For You",
    },
  ];
  await page.evaluate(
    (s) =>
      localStorage.setItem(
        "little-dessert-painted-preview-v1",
        JSON.stringify(s),
      ),
    {
      ...seed,
      stage: 7,
      layered: true,
      frosted: true,
      baseCream: true,
      fillingToppings: filling,
      toppings,
      plate: 5,
      fillingCream: 1,
      name: "A sweet surprise",
    },
  );
  await page.reload();
  await expect(page.locator("#phaseTitle")).toHaveText("Scene");
  await page.locator("#finish").click();
  await settled(page);
  const whole = await page.locator("#resultImage").getAttribute("src");
  await click(page, "Peek inside");
  await expect(page.locator("#cutNote")).toContainText("Strawberry half");
  await expect(page.locator("#cutNote")).not.toContainText("Blueberry");
  const cuts = new Set([
    await page.locator("#resultImage").getAttribute("src"),
  ]);
  await page.screenshot({ path: info.outputPath("slice-view.png") });
  for (let i = 0; i < 2; i++) {
    await click(page, "Turn the cut");
    cuts.add(await page.locator("#resultImage").getAttribute("src"));
  }
  expect(cuts.size).toBe(3);
  const download = page.waitForEvent("download");
  await click(page, "Save image");
  const png = await readFile(await (await download).path());
  expect(png.readUInt32BE(16)).toBe(1000);
  expect(png.readUInt32BE(20)).toBe(900);
  expect(
    png.equals(
      Buffer.from(
        (await page.locator("#resultImage").getAttribute("src")).split(",")[1],
        "base64",
      ),
    ),
  ).toBe(true);
  expect((await saved(page)).fillingToppings).toEqual(filling);
  expect((await saved(page)).toppings).toEqual(toppings);
  await click(page, "Whole cake");
  expect(await page.locator("#resultImage").getAttribute("src")).toBe(whole);
  await click(page, "Peek inside");
  await click(page, "Keep editing");
  await page.reload();
  expect((await saved(page)).sliceView).toBe(true);
  expect((await saved(page)).cutDirection).toBe(2);
  await page.locator("#finish").click();
  await settled(page);
  await expect(button(page, "Whole cake")).toBeVisible();
  expect(errors).toEqual([]);
});

test("cut geometry uses spatial intersections for every silhouette and never invents single-layer filling", async ({
  page,
}) => {
  await start(page);
  const checks = await page.evaluate(async () => {
    const { cutDetails, cakePath } = await import("/renderer.js");
    const ctx = document.createElement("canvas").getContext("2d");
    const data = [];
    for (let shape = 0; shape < 4; shape++)
      for (let direction = 0; direction < 3; direction++) {
        const empty = { shape, layered: true, fillingToppings: [] };
        const detail = cutDetails(empty, direction),
          p = detail.sections[0].point;
        const near = {
          id: "near",
          type: "grapes",
          x: p.x * 0.5,
          y: p.y * 0.5,
          scale: 1,
          rotation: 0,
        };
        const far = {
          id: "far",
          type: "blueberry",
          x: -p.x * 0.8,
          y: -p.y * 0.8,
          scale: 1,
          rotation: 0,
        };
        const result = cutDetails(
          { ...empty, fillingToppings: [near, far] },
          direction,
        );
        const single = cutDetails(
          { ...empty, layered: false, fillingToppings: [near] },
          direction,
        );
        data.push({
          hits: result.sections[0].hits.map((t) => t.id),
          single: single.ingredients.length,
          inside: detail.boundary.every((p) =>
            ctx.isPointInPath(cakePath(shape), p.x * 0.99, p.y * 0.99),
          ),
        });
      }
    return data;
  });
  expect(checks).toHaveLength(12);
  for (const check of checks) {
    expect(check.hits).toEqual(["near"]);
    expect(check.single).toBe(0);
    expect(check.inside).toBe(true);
  }
});

test("legacy filling-stage recipes become double-layer cakes without losing work", async ({
  page,
}) => {
  await start(page);
  const seed = await saved(page);
  const filling = [
    {
      id: "legacy-fruit",
      type: "strawberryHalf",
      x: 35,
      y: 20,
      scale: 1,
      rotation: 0,
      text: "",
    },
  ];
  await page.evaluate(
    (s) =>
      localStorage.setItem(
        "little-dessert-painted-preview-v1",
        JSON.stringify(s),
      ),
    {
      ...seed,
      schemaVersion: 4,
      stage: 2,
      layered: false,
      plate: 5,
      fillingToppings: filling,
      cutDirection: 99,
    },
  );
  await page.reload();
  await expect(page.locator("#phaseTitle")).toHaveText("Filling");
  await expect(page.locator(".filling-guide")).toContainText(
    "Inside, not on top",
  );
  await expect(page.locator("#finish")).toBeDisabled();
  await click(page, "Cover with the second layer →");
  expect((await saved(page)).layered).toBe(true);
  expect((await saved(page)).schemaVersion).toBe(6);
  expect((await saved(page)).fillingToppings).toEqual(filling);
  expect((await saved(page)).plate).toBe(5);
  expect((await saved(page)).cutDirection).toBe(0);
});

test("painted preview frosting modes preserve strokes, expose different sides and export moved strawberries", async ({
  page,
}, info) => {
  test.setTimeout(90000);
  const mobile = info.project.name === "mobile",
    errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await start(page);
  const seed = await saved(page);
  const filling = [
    {
      id: "f",
      type: "strawberryHalf",
      x: 70,
      y: 90,
      scale: 1,
      rotation: 0,
      text: "",
    },
  ];
  await page.evaluate(
    (s) =>
      localStorage.setItem(
        "little-dessert-painted-preview-v1",
        JSON.stringify(s),
      ),
    {
      ...seed,
      stage: 4,
      layered: true,
      baseCream: true,
      fillingToppings: filling,
    },
  );
  await page.reload();
  await expect(button(page, "Top-only frosting")).toBeVisible();
  await click(page, "Top-only frosting");
  await partial(page, mobile);
  const partialState = await saved(page);
  expect(partialState.frostingMode).toBe("top");
  expect(partialState.frosting.length).toBeGreaterThan(0);
  await page.reload();
  await expect(button(page, "Top-only frosting")).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  expect((await saved(page)).frosting).toEqual(partialState.frosting);
  await coat(page, mobile);
  await expect(page.locator("#phaseTitle")).toHaveText("Decorate");
  const side = () =>
    page
      .locator("#cake")
      .evaluate((c) => [
        ...c.getContext("2d").getImageData(450, 605, 100, 25).data,
      ]);
  const topOnly = await side();
  const completedStrokes = (await saved(page)).frosting;
  await click(page, "← Back");
  await click(page, "Full frosting");
  expect((await saved(page)).frosting).toEqual(completedStrokes);
  const full = await side();
  expect(full).not.toEqual(topOnly);
  // Start a fresh Full coat to verify both choices work with actual gestures.
  await click(page, "Vanilla");
  expect((await saved(page)).frosting).toEqual([]);
  await coat(page, mobile);
  await click(page, "Strawberry");
  await click(page, "Strawberry");
  const before = (await saved(page)).toppings;
  const t = before.at(-1);
  const box = await page.locator("#cake").boundingBox();
  const point = (x, y) => ({
    x: box.x + ((500 + x) * box.width) / 1000,
    y: box.y + ((402 + y) * box.height) / 900,
  });
  const a = point(t.x, t.y),
    b = point(85, 45);
  if (mobile) {
    const client = await page.context().newCDPSession(page);
    await client.send("Input.dispatchTouchEvent", {
      type: "touchStart",
      touchPoints: [a],
    });
    await client.send("Input.dispatchTouchEvent", {
      type: "touchMove",
      touchPoints: [b],
    });
    await client.send("Input.dispatchTouchEvent", {
      type: "touchEnd",
      touchPoints: [],
    });
  } else {
    await page.mouse.move(a.x, a.y);
    await page.mouse.down();
    await page.mouse.move(b.x, b.y, { steps: 8 });
    await page.mouse.up();
  }
  const placed = (await saved(page)).toppings;
  expect(placed.at(-1).x).not.toBe(t.x);
  await click(page, "Make larger");
  await click(page, "Rotate");
  await click(page, "Delete");
  expect((await saved(page)).toppings).toHaveLength(1);
  await click(page, "Undo");
  expect((await saved(page)).toppings).toHaveLength(2);
  const recipe = await saved(page);
  await page.reload();
  await expect(page.locator("#phaseTitle")).toHaveText("Decorate");
  expect((await saved(page)).toppings).toEqual(recipe.toppings);
  await page.screenshot({ path: info.outputPath("painted-decorate.png") });
  await page.locator("#finish").click();
  await settled(page);
  const download = page.waitForEvent("download");
  await click(page, "Save image");
  const png = await readFile(await (await download).path());
  expect(
    png.equals(
      Buffer.from(
        (await page.locator("#resultImage").getAttribute("src")).split(",")[1],
        "base64",
      ),
    ),
  ).toBe(true);
  expect((await saved(page)).frostingMode).toBe("full");
  expect(errors).toEqual([]);
});

test("painted preview loads all six originals and isolates public saves while keeping every shape and flavor", async ({
  page,
}) => {
  await start(page);
  const seed = await saved(page);
  const original = JSON.stringify({
    ...seed,
    schemaVersion: 5,
    stage: 5,
    toppings: [
      {
        id: "old",
        type: "text",
        x: 0,
        y: 0,
        scale: 1,
        rotation: 0,
        text: "Keep me",
      },
    ],
  });
  await page.evaluate((value) => {
    localStorage.removeItem("little-dessert-painted-preview-v1");
    localStorage.setItem("little-dessert-v1", value);
  }, original);
  await page.reload();
  await expect(page.locator("#phaseTitle")).toHaveText("Decorate");
  await click(page, "Strawberry");
  expect(
    await page.evaluate(() => localStorage.getItem("little-dessert-v1")),
  ).toBe(original);
  const result = await page.evaluate(async () => {
    const { demoAssets, isPaintedDemo } = await import("/painted-demo.js");
    const assets = Object.entries(demoAssets)
      .filter(([k]) => k !== "materials")
      .map(([key, a]) => ({
        key,
        ready: a.image?.complete && a.image.naturalWidth > 0,
      }));
    const recipes = [];
    for (let shape = 0; shape < 4; shape++)
      for (let cake = 0; cake < 4; cake++)
        recipes.push({
          shape,
          cake,
          painted: isPaintedDemo({ shape, cake, customCake: null }),
        });
    return { assets, recipes };
  });
  expect(result.assets).toHaveLength(6);
  expect(result.assets.every((a) => a.ready)).toBe(true);
  expect(result.recipes.filter((r) => r.painted)).toEqual([
    { shape: 0, cake: 0, painted: true },
  ]);
  await stage(page, "Sponge", false);
  for (const shape of ["Heart", "Square", "Flower", "Round"])
    await click(page, shape);
  for (const flavor of ["Chocolate", "Strawberry", "Matcha", "Vanilla"])
    await click(page, "Sponge color " + flavor);
});

test("painted standalone preview runs without external resource requests", async ({
  page,
}) => {
  test.setTimeout(45000);
  const errors = [],
    requests = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.route("**/*", (route) => {
    if (route.request().isNavigationRequest()) return route.continue();
    requests.push(route.request().url());
    return route.abort();
  });
  await page.goto("/dist-preview/vanilla-preview.html");
  await button(page, "Start baking →").click();
  await settled(page);
  await click(page, "Place this sponge");
  await click(page, "Keep one layer");
  await expect(button(page, "Top-only frosting")).toBeVisible();
  await click(page, "Top-only frosting");
  expect((await saved(page)).frostingMode).toBe("top");
  expect(requests).toEqual([]);
  expect(errors).toEqual([]);
});

test("painted completion retains existing cream at the start of its finishing animation", async ({
  page,
}) => {
  await start(page);
  const identical = await page.evaluate(async () => {
    const { render } = await import("/renderer.js");
    const s = JSON.parse(
      localStorage.getItem("little-dessert-painted-preview-v1"),
    );
    Object.assign(s, {
      stage: 4,
      layered: true,
      baseCream: true,
      frostingMode: "full",
      frosted: false,
      frosting: [
        [
          { x: 0, y: 0 },
          { x: 80, y: 0 },
        ],
      ],
    });
    const a = document.createElement("canvas"),
      b = document.createElement("canvas");
    a.width = b.width = 1000;
    a.height = b.height = 900;
    render(a.getContext("2d"), s, { stage: 4, coverage: 86 });
    render(
      b.getContext("2d"),
      { ...s, frosted: true },
      {
        stage: 4,
        coverage: 86,
        effect: { kind: "cream-complete", progress: 0 },
      },
    );
    const x = a.getContext("2d").getImageData(480, 385, 40, 30).data,
      y = b.getContext("2d").getImageData(480, 385, 40, 30).data;
    return x.every((v, i) => v === y[i]);
  });
  expect(identical).toBe(true);
});
