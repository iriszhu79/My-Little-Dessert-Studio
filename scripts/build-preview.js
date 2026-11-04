import { readFile, writeFile, mkdir } from "node:fs/promises";
import { resolve } from "node:path";
// A self-contained, editable offline study: the reference picture is never embedded.
// Inline module code and plate data allow double-click preview without a web server.
const output = resolve(process.env.PREVIEW_OUTPUT || "dist-preview");
await mkdir(output, { recursive: true });
let painted = await readFile("painted-demo.js", "utf8");
const paintedSources = {};
for (const item of painted.matchAll(/file: "([^"]+)"/g))
  paintedSources[item[1]] =
    `data:image/png;base64,${(await readFile(`assets/painted/${item[1]}`)).toString("base64")}`;
painted = painted.replace(
  "new URL(`./assets/painted/${a.file}`, import.meta.url).href",
  "PREVIEW_PAINTED[a.file]",
);
let renderer = await readFile("renderer.js", "utf8");
const sources = {};
for (const file of renderer.matchAll(/file: "([^"]+)"/g)) {
  sources[file[1]] =
    `data:image/png;base64,${(await readFile(`assets/plates/${file[1]}`)).toString("base64")}`;
}
renderer = renderer
  .replace(/^import\s*\{[\s\S]*?\}\s*from\s*"\.\/painted-demo.js";\s*/, "")
  .replace(/export \{ isPaintedDemo, loadDemoAssets \};\s*/, "")
  .replace(
    "new URL(`./assets/plates/${p.file}`, import.meta.url).href",
    "PREVIEW_PLATES[p.file]",
  );
let app = (await readFile("app.js", "utf8")).replace(
  /^import\s*\{[\s\S]*?\}\s*from\s*"\.\/renderer.js";\s*/,
  "",
);
const moduleCode =
  `const PREVIEW_PAINTED=${JSON.stringify(paintedSources)};\nconst PREVIEW_PLATES=${JSON.stringify(sources)};\n${painted}\n${renderer}\n${app}`.replace(
    /\bexport (?=(?:async )?function|const)/g,
    "",
  );
let html = await readFile("index.html", "utf8");
html = html
  .replace(
    '<link rel="stylesheet" href="style.css" />',
    `<style>${await readFile("style.css", "utf8")}</style>`,
  )
  .replace(
    '<script type="module" src="app.js"></script>',
    `<script type="module">${moduleCode.replace(/<\/script/gi, "<\\/script")}</script>`,
  );
await writeFile(resolve(output, "vanilla-preview.html"), html);
await writeFile(
  resolve(output, "README.txt"),
  `My Little Dessert Studio — private vanilla style study\n\nOpen vanilla-preview.html in Chrome or Edge. No installation or server is needed.\nStart baking > Place this sponge > Keep one layer > choose Full frosting or Top-only frosting. Drag on the cake; at 85% it advances to Decorate. Add strawberries, drag/select/resize/rotate/delete them. Use Back to compare frosting modes. Finish cake > Save image exports your actual recipe.\n\nThis study covers round preset vanilla sponge only. Other shapes/flavors and existing gameplay remain available. It uses a separate local save key and never overwrites the public game's save.\n\nAll six supplied ingredient PNGs are installed. Their originals are unchanged; source rectangles omit transparent padding and the faint outer glow. Aspect ratios are preserved. The complete reference screenshot is only a visual reference, not part of the game artwork. The new cake is procedural, not a flattened reference picture.\n`,
);
console.log(`Offline preview written to ${output}/vanilla-preview.html`);
