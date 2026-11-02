# My Little Dessert Studio

An original, sunlit 2D baking game. Start with a bare sponge, spread cream, tuck in a little filling, and make a cake that feels like you. No timers, scores, accounts, or failure states.

## Run locally

Node.js 20+ is required; the cloud environment uses Node.js 24.

```sh
npm ci
npm run dev
```

The development server listens on port 5173 and accepts an optional `PORT` variable. Use an HTTP server rather than opening the HTML directly: the game uses native JavaScript modules. There are no runtime npm dependencies, external images, fonts, analytics, APIs, database, or credentials.

## The baking ritual

1. **Sponge** — Round, Heart, Square, or Flower. Choose Vanilla, Chocolate, Strawberry, Matcha, or mix a custom sponge color. A soft drop introduces the sponge on its pedestal.
2. **Cream** — Pick one of seven cream bowls, or mix your own color. Tap or drag over the cake to spread a first coat. “Smooth it for me” reveals the remaining cream in a short animation. “Spread & continue” finishes this coat before the filling step.
3. **Filling** — Add fruit, chocolate, cookies, or macarons. Click to add, or drag a material from its tray to the cake. Filling and outer decorations are stored separately.
4. **Layers** — Keep one layer, or explicitly add a second sponge with a short falling animation. Revisiting a stage never adds a layer or silently finishes the frosting.
5. **Frost** — Spread a separate outer coat. Each pointer gesture is one undo action; assisted smoothing is also available. The sides gradually take on the cream color as coverage increases.
6. **Decorate** — All original fruit, sliced fruit, sweets, flowers, bows, pearls, cream piping, and custom lettering remain available. Enter a message of up to 20 characters, or use “Happy Day” / “For You”. Add multiple pieces, drag them, and select them to resize, rotate, or delete. On a keyboard, arrow keys move a selected decoration; Delete / Backspace removes it. Clear requires confirmation and can be undone.
7. **Plate** — Move from the pedestal to Porcelain, Scalloped, Blush pink, or Glass without losing anything.
8. **Slice** — Keep whole, or cut 2 / 4 / 6 / 8 portions. A short knife pass reveals silhouette-clipped cut lines.
9. **Scene** — Choose Cream linen, Pink gingham, Warm wood, or Garden picnic. Finish with a small pull-back, name the cake, and export a 1000 × 900 PNG containing only the artwork. Mobile users can also press and hold the finished image.

All interface copy, accessible names, prompts, errors, and download messages are English. User-authored messages in older saves are preserved as entered. Mobile materials and step strips scroll horizontally. Animations are short and respect the system's reduced-motion preference.

Players may jump between stages and revisit earlier choices. Jumping ahead preserves the actual cake rather than implicitly adding layers or cream. Undo retains the last 60 edits in the current session. Start over requires confirmation and clears the recipe and undo history.

## Autosave and privacy

Every edit is saved locally under `little-dessert-v1`. The current stage, independent cream strokes, single/double-layer choice, fillings, decorations, colors, plating, slicing, scene, and cake name survive refresh. Undo history does not survive refresh. No artwork or personal data is uploaded.

V1 / V1.1 saves migrate into the expanded schema while preserving their shapes, colors, messages, and decorations. Invalid recipe data falls back safely; a corrupt JSON save displays an English recovery message. If browser storage is disabled, the game remains playable and PNG export works, with an autosave warning.

## Verify

```sh
npm test
npm run format:check
npm run build
```

Playwright runs 14 desktop / Pixel 7 browser cases covering the full baking ritual, visible intermediate cream frames, explicit layering, backtracking, native touch and mouse gestures, ingredient placement, resizing, rotation, deletion, confirmed clear/reset, custom lettering and colors, all plates and scenes, cuts, reduced motion, English interface copy, migration, damaged saves, disabled storage, and PNG dimensions and pixel agreement with the final preview.

Layout checks include widths of 320, 375, 768, and 1440 pixels. Reports/screenshots are generated in ignored `test-results/`. Mobile coverage uses Chromium device emulation and native touch events; real iOS / Safari hardware is not yet verified.

The cloud image provides `/usr/bin/chromium`. Elsewhere, set `CHROMIUM_PATH=/path/to/chromium`, or install the Playwright browser with `npx playwright install chromium`. The test server starts automatically if needed.

## Structure

| File                    | Purpose                                                                                                                    |
| ----------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| `index.html`            | English studio, accessible controls, welcome, confirmation, and final photo dialogs                                        |
| `style.css`             | Responsive cream-paper studio, mobile trays, and reduced-motion styling                                                    |
| `app.js`                | Existing recipe model, migration, workflow, animation orchestration, pointer interactions, history, and image export       |
| `renderer.js`           | Original Canvas illustrations: all silhouettes, sponge grain, frosting, fruit, bowls, spatula, pedestal, plates, and scene |
| `server.js`             | Development server using Node.js built-in modules                                                                          |
| `scripts/build-site.js` | Production asset fingerprinting, including the renderer's module import                                                    |
| `tests/studio.spec.js`  | Browser acceptance and regression checks                                                                                   |

Add a material by extending `toppingNames` / `drawTopping` in the renderer and its ingredient category in the existing app. The visual assets are original vector drawings; no video frames or third-party artwork are shipped.

## Publish

```sh
npm run build
```

Deploy the generated `dist/` directory to a static host. Content-derived JS/CSS filenames prevent cached resources from mixing releases. GitHub Pages deploys automatically from `main` via `.github/workflows/pages.yml`.

For a fresh repository, select **Settings → Pages → Source → GitHub Actions**, then run the workflow. Site: `https://iriszhu79.github.io/My-Little-Dessert-Studio/`. Confirm a successful Actions deployment before calling a release live.

## Deliberate simplifications

Cream is rendered from clipped vector brush strokes with an assisted reveal and side-color blending; it is not a fluid or mesh simulation. Cutting is a knife animation plus visual seams, without physical slices separating. Fruit is provided already cut; there is no knife-controlled fruit cutting. Ingredient drop shadows and surface foreshortening are stylized 2D. There is no sound, cloud album, account system, or new dessert type. Each surface supports up to 250 decorations to protect mobile performance.
