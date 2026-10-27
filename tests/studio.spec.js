import { test, expect } from "@playwright/test";
import { readFile } from "node:fs/promises";
const readState = (page) =>
  page.evaluate(() => JSON.parse(localStorage.getItem("little-dessert-v1")));
const step = async (page, name) =>
  page
    .getByRole("navigation")
    .getByRole("button", { name, exact: true })
    .click();
async function start(page) {
  await page.goto("/");
  await page.getByRole("button", { name: "开始制作" }).click();
}
test("complete creative workflow, colors, shapes, plate, slices, background and PNG", async ({
  page,
}, testInfo) => {
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await start(page);
  for (const [i, n] of ["圆形", "爱心形", "方形", "花朵形"].entries()) {
    await page.getByRole("button", { name: n, exact: true }).click();
    expect((await readState(page)).shape).toBe(i);
  }
  await step(page, "配色");
  await page
    .getByRole("button", { name: "蛋糕主体 抹茶绿", exact: true })
    .click();
  await page
    .getByRole("button", { name: "表面奶油 淡紫", exact: true })
    .click();
  await step(page, "装饰");
  await page.getByRole("button", { name: "草莓", exact: true }).click();
  await page.getByRole("button", { name: "草莓", exact: true }).click();
  await page.getByRole("button", { name: "蓝莓", exact: true }).click();
  await page.getByRole("button", { name: "甜点", exact: true }).click();
  await page.getByRole("button", { name: "马卡龙", exact: true }).click();
  await page.getByRole("button", { name: "装饰", exact: true }).last().click();
  await page.getByRole("button", { name: "小花", exact: true }).click();
  await page.getByRole("button", { name: "文字", exact: true }).click();
  await page.getByRole("textbox", { name: "自定义短文字" }).fill("今天也很甜");
  await page.getByRole("button", { name: "甜蜜文字", exact: true }).click();
  await step(page, "盘子");
  await page.getByRole("button", { name: "粉色盘", exact: true }).click();
  await step(page, "切块");
  for (const n of [2, 4, 6, 8]) {
    await page.getByRole("button", { name: `${n} 块`, exact: true }).click();
    expect((await readState(page)).slices).toBe(n);
  }
  await page.getByRole("button", { name: "不切", exact: true }).click();
  expect((await readState(page)).slices).toBe(0);
  await page.getByRole("button", { name: "6 块", exact: true }).click();
  await step(page, "背景");
  await page.getByRole("button", { name: "粉色格纹桌布", exact: true }).click();
  const state = await readState(page);
  expect(state).toMatchObject({
    cake: 3,
    cream: 2,
    plate: 2,
    slices: 6,
    background: 1,
  });
  expect(state.toppings).toHaveLength(6);
  await page.locator("#finish").click();
  await expect(page.getByRole("dialog")).toBeVisible();
  const downloaded = page.waitForEvent("download");
  await page.getByRole("button", { name: "保存图片 PNG" }).click();
  const download = await downloaded;
  const file = await download.path();
  const png = await readFile(file);
  expect(png.subarray(1, 4).toString()).toBe("PNG");
  expect(png.readUInt32BE(16)).toBe(1000);
  expect(png.readUInt32BE(20)).toBe(900);
  expect(png.length).toBeGreaterThan(20000);
  // Every exported pixel matches the deselected editor; no toolbars are captured.
  const pixels = await page.evaluate(async () => {
    const image = document.querySelector("#resultImage");
    await image.decode();
    const c = document.createElement("canvas");
    c.width = 1000;
    c.height = 900;
    const ctx = c.getContext("2d");
    ctx.drawImage(image, 0, 0);
    const exported = ctx.getImageData(0, 0, 1000, 900).data;
    const editor = document
      .querySelector("#cake")
      .getContext("2d")
      .getImageData(0, 0, 1000, 900).data;
    return exported.every((v, i) => v === editor[i]);
  });
  expect(pixels).toBe(true);
  const resultData = await page.locator("#resultImage").getAttribute("src");
  expect(png.equals(Buffer.from(resultData.split(",")[1], "base64"))).toBe(
    true,
  );
  await page.getByRole("button", { name: "继续编辑", exact: true }).click();
  expect(await readState(page)).toEqual(state);
  await page.reload();
  expect(await readState(page)).toEqual(state);
  await expect(page.locator("#welcome")).not.toBeVisible();
  await page.screenshot({
    path: testInfo.outputPath("studio.png"),
    fullPage: true,
  });
  expect(errors).toEqual([]);
});
test("drag with mouse/touch, constrain, undo, transform, delete and clear", async ({
  page,
}, testInfo) => {
  await start(page);
  await step(page, "装饰");
  await page.getByRole("button", { name: "草莓", exact: true }).click();
  const original = (await readState(page)).toppings[0];
  await page.locator("#cake").scrollIntoViewIfNeeded();
  let box = await page.locator("#cake").boundingBox();
  const point = (x, y) => ({
    x: box.x + ((500 + x) * box.width) / 1000,
    y: box.y + ((402 + y) * box.height) / 900,
  });
  const a = point(0, 0),
    b = point(95, 35);
  if (testInfo.project.name === "mobile") {
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
  let moved = (await readState(page)).toppings[0];
  expect(moved.x).toBeGreaterThan(50);
  expect(moved.y).toBeGreaterThan(10);
  await page.getByRole("button", { name: "撤销", exact: false }).click();
  expect((await readState(page)).toppings[0]).toEqual(original);
  // Select, resize, rotate, delete, undo deletion.
  await page
    .locator("#cake")
    [testInfo.project.name === "mobile" ? "tap" : "click"]({
      position: { x: (500 * box.width) / 1000, y: (402 * box.height) / 900 },
    });
  await page.getByRole("button", { name: "放大装饰", exact: true }).click();
  await page.getByRole("button", { name: "旋转", exact: true }).click();
  moved = (await readState(page)).toppings[0];
  expect(moved.scale).toBe(1.1);
  expect(moved.rotation).toBeGreaterThan(0);
  await page.getByRole("button", { name: "删除", exact: true }).click();
  expect((await readState(page)).toppings).toHaveLength(0);
  await page.getByRole("button", { name: "撤销", exact: false }).click();
  expect((await readState(page)).toppings).toHaveLength(1);
  await page.getByRole("button", { name: "蓝莓", exact: true }).click();
  await page.getByRole("button", { name: "清空装饰", exact: true }).click();
  expect((await readState(page)).toppings).toHaveLength(0);
  await page.getByRole("button", { name: "撤销", exact: false }).click();
  expect((await readState(page)).toppings).toHaveLength(2);
  // Drag beyond the canvas; surface constraint must retain the decoration.
  await page.locator("#cake").scrollIntoViewIfNeeded();
  box = await page.locator("#cake").boundingBox();
  const current = (await readState(page)).toppings[1];
  const pos = point(current.x, current.y);
  await page.mouse.move(pos.x, pos.y);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width + 150, box.y + box.height + 150, {
    steps: 5,
  });
  await page.mouse.up();
  const t = (await readState(page)).toppings[1];
  expect(Math.abs(t.x)).toBeLessThan(245);
  expect(Math.abs(t.y)).toBeLessThan(160);
});
test("responsive layout and confirmed reset", async ({ page }) => {
  await start(page);
  await step(page, "装饰");
  await page.getByRole("button", { name: "樱桃", exact: true }).click();
  for (const width of [320, 375, 768, 1440]) {
    await page.setViewportSize({ width, height: 950 });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    const bounds = await page.locator("#cake").boundingBox();
    expect(bounds.x).toBeGreaterThanOrEqual(0);
    expect(bounds.x + bounds.width).toBeLessThanOrEqual(width);
  }
  await page
    .getByRole("button", { name: "重新制作", exact: true })
    .first()
    .click();
  await page.getByRole("button", { name: "继续创作", exact: true }).click();
  expect((await readState(page)).toppings).toHaveLength(1);
  await page
    .getByRole("button", { name: "重新制作", exact: true })
    .first()
    .click();
  await page.getByRole("button", { name: "确认重新制作", exact: true }).click();
  expect((await readState(page)).toppings).toHaveLength(0);
  await page.reload();
  expect((await readState(page)).toppings).toHaveLength(0);
});
test("all toppings render and state survives all silhouette switches", async ({
  page,
}) => {
  await start(page);
  await step(page, "装饰");
  for (const [category, names] of Object.entries({
    水果: ["草莓", "蓝莓", "樱桃", "柠檬片"],
    甜点: ["曲奇", "巧克力", "马卡龙"],
    装饰: ["小花", "蝴蝶结", "糖珠", "奶油裱花"],
  })) {
    await page
      .locator(".topping-categories")
      .getByRole("button", { name: category, exact: true })
      .click();
    for (const name of names)
      await page.getByRole("button", { name, exact: true }).click();
  }
  expect((await readState(page)).toppings).toHaveLength(11);
  await step(page, "形状");
  for (const name of ["爱心形", "方形", "花朵形", "圆形"]) {
    await page.getByRole("button", { name, exact: true }).click();
    expect((await readState(page)).toppings).toHaveLength(11);
  }
  await step(page, "盘子");
  for (const name of ["经典白瓷盘", "花边盘", "粉色盘", "透明玻璃盘"])
    await page.getByRole("button", { name, exact: true }).click();
  await step(page, "背景");
  for (const name of ["奶油白桌面", "粉色格纹桌布", "木质桌面", "花园野餐布"])
    await page.getByRole("button", { name, exact: true }).click();
});
