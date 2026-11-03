import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile, readdir } from "node:fs/promises";
import { resolve } from "node:path";

// Fingerprint the entire module chain so old browser caches cannot mix releases.
const output = resolve(process.env.SITE_OUTPUT || "dist");
await mkdir(output, { recursive: true });
async function asset(file, content) {
  const hash = createHash("sha256").update(content).digest("hex").slice(0, 12);
  const name = file.replace(/(\.[^.]+)$/, `.${hash}$1`);
  await writeFile(resolve(output, name), content);
  return name;
}
await mkdir(resolve(output, "assets/plates"), { recursive: true });
let rendererSource = await readFile("renderer.js", "utf8");
for (const file of await readdir("assets/plates")) {
  const content = await readFile(`assets/plates/${file}`);
  const name = await asset(`assets/plates/${file}`, content);
  rendererSource = rendererSource.replace(
    `file: "${file}"`,
    `file: "${name.split("/").pop()}"`,
  );
}
const renderer = await asset("renderer.js", rendererSource);
const app = await asset(
  "app.js",
  (await readFile("app.js", "utf8")).replace(
    '"./renderer.js"',
    `"./${renderer}"`,
  ),
);
const style = await asset("style.css", await readFile("style.css", "utf8"));
const html = (await readFile("index.html", "utf8"))
  .replace('href="style.css"', `href="${style}"`)
  .replace('src="app.js"', `src="${app}"`);
await writeFile(resolve(output, "index.html"), html);
await writeFile(resolve(output, ".nojekyll"), "");
console.log(`Static website prepared in ${output}`);
