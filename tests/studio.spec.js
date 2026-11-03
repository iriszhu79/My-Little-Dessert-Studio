import { test, expect } from "@playwright/test";
import { readFile } from "node:fs/promises";
const saved = (page) =>
  page.evaluate(() => JSON.parse(localStorage.getItem("little-dessert-v1")));
const button = (page, name) => page.getByRole("button", { name, exact: true });
async function settled(page) {
  await expect(page.locator(".workspace")).not.toHaveAttribute(
    "aria-busy",
    "true",
  );
}
async function start(page) {
  await page.goto("/");
  await button(page, "Start baking →").click();
  await settled(page);
}
async function step(page, name) {
  await page
    .getByRole("navigation")
    .getByRole("button", { name, exact: true })
    .click();
  await settled(page);
}
async function click(page, name) {
  await button(page, name).click();
  await settled(page);
}
async function brush(
  page,
  mobile,
  from = { x: -110, y: -25 },
  to = { x: 110, y: -25 },
) {
  await page.locator("#cake").scrollIntoViewIfNeeded();
  const box = await page.locator("#cake").boundingBox();
  const point = (p) => ({
    x: box.x + ((500 + p.x) * box.width) / 1000,
    y: box.y + ((402 + p.y) * box.height) / 900,
  });
  const a = point(from),
    b = point(to);
  if (mobile) {
    const client = await page.context().newCDPSession(page);
    await client.send("Input.dispatchTouchEvent", {
      type: "touchStart",
      touchPoints: [a],
    });
    for (let i = 1; i <= 6; i++)
      await client.send("Input.dispatchTouchEvent", {
        type: "touchMove",
        touchPoints: [
          { x: a.x + ((b.x - a.x) * i) / 6, y: a.y + ((b.y - a.y) * i) / 6 },
        ],
      });
    await client.send("Input.dispatchTouchEvent", {
      type: "touchEnd",
      touchPoints: [],
    });
  } else {
    await page.mouse.move(a.x, a.y);
    await page.mouse.down();
    await page.mouse.move(b.x, b.y, { steps: 12 });
    await page.mouse.up();
  }
}
async function coat(page, mobile) {
  await page.locator("#cake").scrollIntoViewIfNeeded();
  const b = await page.locator("#cake").boundingBox();
  const point = (x, y) => ({
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
  const client = mobile ? await page.context().newCDPSession(page) : null;
  const first = point(...points[0]);
  if (mobile)
    await client.send("Input.dispatchTouchEvent", {
      type: "touchStart",
      touchPoints: [first],
    });
  else {
    await page.mouse.move(first.x, first.y);
    await page.mouse.down();
  }
  for (const p of points.slice(1)) {
    const pos = point(...p);
    if (mobile)
      await client.send("Input.dispatchTouchEvent", {
        type: "touchMove",
        touchPoints: [pos],
      });
    else await page.mouse.move(pos.x, pos.y, { steps: 2 });
    if ((await page.locator("#frostProgress").evaluate((e) => e.value)) >= 100)
      break;
  }
  if (mobile)
    await client.send("Input.dispatchTouchEvent", {
      type: "touchEnd",
      touchPoints: [],
    });
  else await page.mouse.up();
  await settled(page);
  await expect(page.locator("#frostPercent")).toHaveText("100%");
}
test("complete baking ritual preserves every feature and exports the actual named artwork", async ({
  page,
}, info) => {
  test.setTimeout(60000);
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await start(page);
  expect(await saved(page)).toMatchObject({
    layered: false,
    frosted: false,
    baseCream: false,
    toppings: [],
  });
  for (const [i, name] of ["Round", "Heart", "Square", "Flower"].entries()) {
    await click(page, name);
    expect((await saved(page)).shape).toBe(i);
  }
  await click(page, "Sponge color Matcha");
  const custom = page.getByLabel("Custom sponge color");
  await custom.fill("#bbc781");
  expect((await saved(page)).customCake).toBe("#bbc781");
  await click(page, "Next →");
  await click(page, "Strawberry");
  const before = await page.locator("#cake").evaluate((c) => c.toDataURL());
  expect((await saved(page)).baseCream).toBe(false);
  await expect(button(page, "Spread to 85%")).toBeDisabled();
  await brush(page, info.project.name === "mobile");
  expect((await saved(page)).baseCream).toBe(false);
  expect(
    (await page.locator("#cake").evaluate((c) => c.toDataURL())) !== before,
  ).toBe(true);
  await coat(page, info.project.name === "mobile");
  expect((await saved(page)).baseCream).toBe(true);
  await click(page, "Next →");
  await click(page, "Strawberry half");
  await click(page, "Mango fan");
  await page
    .locator(".topping-categories")
    .getByRole("button", { name: "Sweets", exact: true })
    .click();
  await click(page, "Chocolate");
  expect((await saved(page)).fillingToppings).toHaveLength(3);
  await click(page, "Next →");
  await click(page, "Add a second layer");
  expect((await saved(page)).layered).toBe(true);
  await click(page, "Add a second layer");
  expect((await saved(page)).fillingToppings).toHaveLength(3);
  await click(page, "Next →");
  await click(page, "Vanilla");
  await brush(page, info.project.name === "mobile");
  expect((await saved(page)).frosting).toHaveLength(1);
  expect((await saved(page)).frosted).toBe(false);
  await coat(page, info.project.name === "mobile");
  expect((await saved(page)).frosted).toBe(true);
  await click(page, "Next →");
  await page
    .locator(".topping-categories")
    .getByRole("button", { name: "Fruit", exact: true })
    .click();
  await click(page, "Strawberry fan");
  await click(page, "Blueberry");
  await click(page, "Kiwi slice");
  await page
    .locator(".topping-categories")
    .getByRole("button", { name: "Details", exact: true })
    .click();
  await click(page, "Daisy");
  await page
    .locator(".topping-categories")
    .getByRole("button", { name: "Lettering", exact: true })
    .click();
  await page.getByLabel("Your sweet message").fill("Hello, sunshine");
  await click(page, "Sweet lettering");
  const tops = (await saved(page)).toppings;
  expect(tops).toHaveLength(5);
  expect(tops.at(-1).text).toBe("Hello, sunshine");
  await step(page, "Filling");
  expect((await saved(page)).fillingToppings).toHaveLength(3);
  await step(page, "Layers");
  expect((await saved(page)).layered).toBe(true);
  await step(page, "Decorate");
  expect((await saved(page)).toppings).toEqual(tops);
  await step(page, "Plate");
  for (const name of ["Porcelain", "Scalloped", "Blush pink", "Glass"])
    await click(page, name);
  await expect(
    page
      .getByRole("navigation")
      .getByRole("button", { name: "Slice", exact: true }),
  ).toHaveCount(0);
  await step(page, "Scene");
  for (const name of [
    "Cream linen",
    "Pink gingham",
    "Warm wood",
    "Garden picnic",
  ])
    await click(page, name);
  const state = await saved(page);
  await page.reload();
  expect(await saved(page)).toEqual(state);
  await expect(page.locator("#welcome")).not.toBeVisible();
  await page.screenshot({
    path: info.outputPath("studio.png"),
    fullPage: true,
  });
  await page.locator("#finish").click();
  await expect(page.locator("#result")).toBeVisible();
  await page.getByLabel("Give your cake a name").fill("Sunshine picnic");
  expect((await saved(page)).name).toBe("Sunshine picnic");
  const downloaded = page.waitForEvent("download");
  await click(page, "Save image");
  const download = await downloaded;
  const png = await readFile(await download.path());
  expect(download.suggestedFilename()).toBe("Sunshine-picnic.png");
  expect(png.subarray(1, 4).toString()).toBe("PNG");
  expect(png.readUInt32BE(16)).toBe(1000);
  expect(png.readUInt32BE(20)).toBe(900);
  expect(png.length).toBeGreaterThan(20000);
  const equal = await page.evaluate(async () => {
    const img = document.querySelector("#resultImage");
    await img.decode();
    const c = document.createElement("canvas");
    c.width = 1000;
    c.height = 900;
    c.getContext("2d").drawImage(img, 0, 0);
    const a = c.getContext("2d").getImageData(0, 0, 1000, 900).data,
      b = document
        .querySelector("#cake")
        .getContext("2d")
        .getImageData(0, 0, 1000, 900).data;
    return a.every((v, i) => v === b[i]);
  });
  expect(equal).toBe(true);
  expect(
    png.equals(
      Buffer.from(
        (await page.locator("#resultImage").getAttribute("src")).split(",")[1],
        "base64",
      ),
    ),
  ).toBe(true);
  await click(page, "Keep editing");
  expect((await saved(page)).toppings).toEqual(tops);
  expect(errors).toEqual([]);
});

test("one layer stays one layer, cream is not implicit, and backtracking never adds ingredients", async ({
  page,
}, info) => {
  await start(page);
  await step(page, "Decorate");
  expect(await saved(page)).toMatchObject({
    layered: false,
    frosted: false,
    baseCream: false,
  });
  await click(page, "Strawberry");
  const topping = (await saved(page)).toppings[0];
  await step(page, "Layers");
  await click(page, "Keep one layer");
  await step(page, "Frost");
  await coat(page, info.project.name === "mobile");
  expect((await saved(page)).layered).toBe(false);
  await step(page, "Sponge");
  await click(page, "Heart");
  await step(page, "Layers");
  expect(await saved(page)).toMatchObject({
    shape: 1,
    layered: false,
    frosted: true,
    layersChosen: true,
  });
  await step(page, "Decorate");
  expect((await saved(page)).toppings[0].id).toBe(topping.id);
  await page.reload();
  expect((await saved(page)).layered).toBe(false);
});

test("mouse and native touch strokes persist, undo as one gesture, and stay inside the sponge", async ({
  page,
}, info) => {
  await start(page);
  await step(page, "Cream");
  await brush(page, info.project.name === "mobile");
  let s = await saved(page);
  expect(s.baseStrokes).toHaveLength(1);
  expect(s.baseStrokes[0].length).toBeGreaterThan(5);
  expect(s.baseCream).toBe(false);
  expect(
    await page.locator("#frostProgress").evaluate((e) => e.value),
  ).toBeGreaterThan(10);
  await click(page, "Undo");
  expect((await saved(page)).baseStrokes).toHaveLength(0);
  const empty = await page.locator("#cake").boundingBox();
  await page
    .locator("#cake")
    .click({ position: { x: empty.width - 30, y: 30 } });
  expect((await saved(page)).baseStrokes).toHaveLength(0);
  await brush(page, info.project.name === "mobile");
  s = await saved(page);
  await page.reload();
  expect(await saved(page)).toEqual(s);
  await coat(page, info.project.name === "mobile");
  await expect(page.locator("#frostPercent")).toHaveText("100%");
  s = await saved(page);
  await step(page, "Frost");
  expect((await saved(page)).frosted).toBe(false);
  expect((await saved(page)).layered).toBe(false);
  await brush(page, info.project.name === "mobile");
  expect((await saved(page)).frosting).toHaveLength(1);
  await click(page, "Undo");
  expect((await saved(page)).frosting).toHaveLength(0);
  expect((await saved(page)).baseStrokes).toEqual(s.baseStrokes);
});

test("decorations drag, resize, rotate, delete, confirm clear and undo without data loss", async ({
  page,
}, info) => {
  await start(page);
  await step(page, "Decorate");
  await click(page, "Strawberry");
  await brush(
    page,
    info.project.name === "mobile",
    { x: 0, y: 0 },
    { x: 90, y: 35 },
  );
  let t = (await saved(page)).toppings[0];
  expect(t.x).toBeGreaterThan(50);
  expect(t.y).toBeGreaterThan(10);
  await click(page, "Undo");
  expect((await saved(page)).toppings[0].x).toBe(0);
  await page.locator("#cake").scrollIntoViewIfNeeded();
  const box = await page.locator("#cake").boundingBox();
  await page
    .locator("#cake")
    [info.project.name === "mobile" ? "tap" : "click"]({
      position: { x: (500 * box.width) / 1000, y: (402 * box.height) / 900 },
    });
  await click(page, "Make larger");
  await click(page, "Rotate");
  t = (await saved(page)).toppings[0];
  expect(t.scale).toBe(1.1);
  expect(t.rotation).toBeGreaterThan(0);
  await click(page, "Delete");
  expect((await saved(page)).toppings).toHaveLength(0);
  await click(page, "Undo");
  expect((await saved(page)).toppings).toHaveLength(1);
  await click(page, "Blueberry");
  await button(page, "Clear decorations").click();
  await expect(page.locator("#clearConfirm")).toBeVisible();
  await click(page, "Keep them");
  expect((await saved(page)).toppings).toHaveLength(2);
  await button(page, "Clear decorations").click();
  await click(page, "Clear them");
  expect((await saved(page)).toppings).toHaveLength(0);
  await click(page, "Undo");
  expect((await saved(page)).toppings).toHaveLength(2);
  await page.locator("#cake").scrollIntoViewIfNeeded();
  const b = await page.locator("#cake").boundingBox(),
    current = (await saved(page)).toppings[1];
  await page.mouse.move(
    b.x + ((500 + current.x) * b.width) / 1000,
    b.y + ((402 + current.y) * b.height) / 900,
  );
  await page.mouse.down();
  await page.mouse.move(b.x + b.width + 100, b.y + b.height + 100, {
    steps: 5,
  });
  await page.mouse.up();
  t = (await saved(page)).toppings[1];
  expect(Math.abs(t.x)).toBeLessThan(245);
  expect(Math.abs(t.y)).toBeLessThan(160);
});

test("ingredient tray accepts placement, all original materials remain, and UI stays English at every width", async ({
  page,
}, info) => {
  test.setTimeout(60000);
  await start(page);
  await step(page, "Filling");
  await page
    .locator(".topping-categories")
    .getByRole("button", { name: "Sweets", exact: true })
    .click();
  await click(page, "Chocolate");
  expect((await saved(page)).fillingToppings[0].type).toBe("chocolate");
  await step(page, "Decorate");
  await page
    .locator(".topping-categories")
    .getByRole("button", { name: "Fruit", exact: true })
    .click();
  if (info.project.name === "desktop") {
    const source = await button(page, "Strawberry half").boundingBox(),
      target = await page.locator("#cake").boundingBox();
    await page.mouse.move(
      source.x + source.width / 2,
      source.y + source.height / 2,
    );
    await page.mouse.down();
    await page.mouse.move(
      target.x + target.width / 2,
      target.y + (target.height * 402) / 900,
      { steps: 15 },
    );
    await page.mouse.up();
    await settled(page);
    expect((await saved(page)).toppings).toHaveLength(1);
  } else {
    await click(page, "Strawberry half");
    expect((await saved(page)).toppings).toHaveLength(1);
  }
  for (const [category, names] of Object.entries({
    Fruit: [
      "Strawberry",
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
    ],
    Sweets: ["Cookie", "Chocolate", "Macaron"],
    Details: ["Daisy", "Ribbon bow", "Sugar pearls", "Cream swirl"],
  })) {
    await page
      .locator(".topping-categories")
      .getByRole("button", { name: category, exact: true })
      .click();
    for (const name of names) await click(page, name);
  }
  expect((await saved(page)).toppings).toHaveLength(19);
  for (const name of [
    "Sponge",
    "Cream",
    "Filling",
    "Layers",
    "Frost",
    "Decorate",
    "Plate",
    "Scene",
  ]) {
    await step(page, name);
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
  }
  for (const width of [320, 375, 768, 1440]) {
    await page.setViewportSize({ width, height: 1000 });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    const b = await page.locator("#cake").boundingBox();
    expect(b.x).toBeGreaterThanOrEqual(0);
    expect(b.x + b.width).toBeLessThanOrEqual(width);
  }
});

test("legacy and damaged saves open safely, and reset requires confirmation", async ({
  page,
}) => {
  await page.goto("/");
  await page.evaluate(() =>
    localStorage.setItem(
      "little-dessert-v1",
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
  let s = await saved(page);
  expect(s).toMatchObject({
    schemaVersion: 3,
    shape: 1,
    baseCream: true,
    frosted: true,
    stage: 5,
  });
  expect(s.toppings).toHaveLength(2);
  expect(s.toppings[0].id).toBe("legacy");
  await button(page, "Start over").first().click();
  await click(page, "Keep my cake");
  expect((await saved(page)).toppings).toHaveLength(2);
  await button(page, "Start over").first().click();
  await click(page, "Yes, start fresh");
  expect(await saved(page)).toMatchObject({
    shape: 0,
    layered: false,
    frosted: false,
    baseCream: false,
    toppings: [],
  });
  await page.evaluate(() =>
    localStorage.setItem("little-dessert-v1", "{broken"),
  );
  await page.reload();
  await expect(page.locator("#welcome")).toBeVisible();
  await click(page, "Start baking →");
  expect((await saved(page)).toppings).toHaveLength(0);
  await page.reload();
  await expect(page.locator("#welcome")).not.toBeVisible();
});

test("reduced motion removes transition waits and unavailable storage still allows image export", async ({
  page,
}, info) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.addInitScript(() => {
    Storage.prototype.setItem = function () {
      throw new DOMException("Disabled", "QuotaExceededError");
    };
  });
  await page.goto("/");
  await click(page, "Start baking →");
  await expect(page.locator("#saved")).toHaveText("Autosave unavailable");
  await step(page, "Cream");
  await coat(page, info.project.name === "mobile");
  await expect(page.locator(".workspace")).not.toHaveAttribute(
    "aria-busy",
    "true",
  );
  await expect(page.locator("#frostPercent")).toHaveText("100%");
  await page.locator("#finish").click();
  await expect(page.locator("#result")).toBeVisible();
  const downloaded = page.waitForEvent("download");
  await click(page, "Save image");
  expect((await downloaded).suggestedFilename()).toBe("My-little-cake.png");
});

test("spatula follows the pointer without painting on hover; both coats finish at 85 percent of real brush area", async ({
  page,
}, info) => {
  test.setTimeout(60000);
  await start(page);
  for (const [stage, key, flag] of [
    ["Cream", "baseStrokes", "baseCream"],
    ["Frost", "frosting", "frosted"],
  ]) {
    await step(page, stage);
    await click(page, "Strawberry");
    expect((await saved(page))[flag]).toBe(false);
    expect((await saved(page))[key]).toHaveLength(0);
    await expect(button(page, "Spread to 85%")).toBeDisabled();
    await expect(button(page, "Smooth it for me")).toHaveCount(0);
    await page.locator("#cake").scrollIntoViewIfNeeded();
    const box = await page.locator("#cake").boundingBox();
    const patch = () =>
      page
        .locator("#cake")
        .evaluate((c) => [
          ...c.getContext("2d").getImageData(490, 392, 20, 20).data,
        ]);
    const original = await patch();
    await page.mouse.move(
      box.x + box.width / 2,
      box.y + (402 * box.height) / 900,
    );
    await page.evaluate(
      () =>
        new Promise((r) =>
          requestAnimationFrame(() => requestAnimationFrame(r)),
        ),
    );
    expect(await patch()).not.toEqual(original);
    expect((await saved(page))[key]).toHaveLength(0);
    await page.mouse.move(
      box.x + (590 * box.width) / 1000,
      box.y + (402 * box.height) / 900,
    );
    await page.evaluate(
      () =>
        new Promise((r) =>
          requestAnimationFrame(() => requestAnimationFrame(r)),
        ),
    );
    expect(await patch()).toEqual(original);
    await brush(page, info.project.name === "mobile");
    const partial = await saved(page);
    expect(partial[flag]).toBe(false);
    const partialProgress = await page
      .locator("#frostProgress")
      .evaluate((e) => e.value);
    expect(partialProgress).toBeGreaterThan(0);
    expect(partialProgress).toBeLessThan(85);
    await coat(page, info.project.name === "mobile");
    const done = await saved(page);
    expect(done[flag]).toBe(true);
    const raw = await page.evaluate(async (key) => {
      const { cakePath } = await import("/renderer.js"),
        s = JSON.parse(localStorage.getItem("little-dessert-v1"));
      const mask = document.createElement("canvas"),
        paint = document.createElement("canvas");
      for (const c of [mask, paint]) {
        c.width = 128;
        c.height = 96;
      }
      const a = mask.getContext("2d"),
        b = paint.getContext("2d");
      for (const c of [a, b]) c.setTransform(0.18, 0, 0, 0.18, 64, 43);
      a.fill(cakePath(s.shape));
      b.clip(cakePath(s.shape));
      b.lineWidth = 86;
      b.lineCap = "round";
      b.lineJoin = "round";
      for (const stroke of s[key]) {
        if (!stroke.length) continue;
        b.beginPath();
        b.moveTo(stroke[0].x, stroke[0].y);
        for (const p of stroke) b.lineTo(p.x, p.y);
        b.stroke();
        b.beginPath();
        b.arc(stroke[0].x, stroke[0].y, 43, 0, Math.PI * 2);
        b.fill();
      }
      const x = a.getImageData(0, 0, 128, 96).data,
        y = b.getImageData(0, 0, 128, 96).data;
      let area = 0,
        covered = 0;
      for (let i = 3; i < x.length; i += 4)
        if (x[i] > 127) {
          area++;
          if (y[i] > 127) covered++;
        }
      return covered / area;
    }, key);
    expect(raw).toBeGreaterThan(0.83);
    expect(raw).toBeLessThan(0.9);
    await click(page, "Undo");
    expect((await saved(page))[flag]).toBe(false);
    expect((await saved(page))[key]).toEqual(partial[key]);
    await expect(button(page, "Spread to 85%")).toBeDisabled();
  }
});

test("grapes replace filling mint, slices are absent, legacy recipes migrate, and the open worktop is centered", async ({
  page,
}, info) => {
  await start(page);
  await step(page, "Filling");
  await expect(button(page, "Mint leaves")).toHaveCount(0);
  await click(page, "Green grapes");
  expect((await saved(page)).fillingToppings[0].type).toBe("grapes");
  await expect(
    page
      .getByRole("navigation")
      .getByRole("button", { name: "Slice", exact: true }),
  ).toHaveCount(0);
  await expect(page.getByRole("navigation").getByRole("button")).toHaveCount(8);
  if (info.project.name === "desktop") {
    const canvas = await page.locator("#cake").boundingBox(),
      aside = await page.locator("aside").boundingBox(),
      width = await page.evaluate(() => innerWidth);
    expect(Math.abs(canvas.x + canvas.width / 2 - width / 2)).toBeLessThan(1);
    expect(aside.x + aside.width).toBeLessThan(
      canvas.x + canvas.width / 2 - 80,
    );
    const styles = await page.evaluate(() =>
      ["aside", ".canvas-wrap"].map((s) => {
        const c = getComputedStyle(document.querySelector(s));
        return [c.borderTopWidth, c.boxShadow];
      }),
    );
    expect(styles).toEqual([
      ["0px", "none"],
      ["0px", "none"],
    ]);
  }
  await page.evaluate(() => {
    const s = JSON.parse(localStorage.getItem("little-dessert-v1"));
    s.schemaVersion = 2;
    s.stage = 8;
    s.slices = 6;
    s.fillingToppings[0].type = "mint";
    localStorage.setItem("little-dessert-v1", JSON.stringify(s));
  });
  await page.reload();
  await expect(
    page
      .getByRole("navigation")
      .getByRole("button", { name: "Scene", exact: true }),
  ).toHaveAttribute("aria-current", "step");
  await step(page, "Filling");
  const s = await saved(page);
  expect(s.schemaVersion).toBe(3);
  expect(s.slices).toBe(0);
  expect(s.fillingToppings[0].type).toBe("grapes");
  await expect(button(page, "Mint leaves")).toHaveCount(0);
});
