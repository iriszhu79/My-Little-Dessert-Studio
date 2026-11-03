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

1. **Sponge** — Round, Heart, Square, or Flower. Choose Vanilla, Chocolate, Strawberry, Matcha, or mix a custom sponge color. Select “Place this sponge” when your shape and color are ready; the sponge drops onto the pedestal and the cream stage opens.
2. **Cream** — Pick a cream bowl or custom color, then hold and sweep across the cake. The spatula follows the pointer (or your finger), and only actual strokes apply cream. Hovering moves the spatula without painting. At 85% coverage, the remaining surface settles into a smooth finish and the filling stage opens automatically, even if the pointer is still held. Picking a bowl starts a fresh coat; there is no instant-fill button.
3. **Filling** — Add fruit, including green grapes, chocolate, cookies, or macarons. Mint is replaced by green grapes in this tray. Click to add, or drag a material from its tray to the cake. Filling and outer decorations are stored separately. Select “Finish filling” when ready (or “Keep it simple” to leave it empty).
4. **Layers** — Keep one layer, or explicitly add a second sponge with a short falling animation. Either layer choice automatically opens Frost. Revisiting a stage never adds a layer or silently finishes the frosting.
5. **Frost** — Hand-spread a separate outer coat with the same spatula control and 85% completion rule. Each gesture, including its automatic finish, is one undo action. The sides gradually take on the cream color as coverage increases; reaching 85% automatically opens Decorate.
6. **Decorate** — All original fruit, sliced fruit, sweets, flowers, bows, pearls, cream piping, and custom lettering remain available. Enter a message of up to 20 characters, or use “Happy Day” / “For You”. Add multiple pieces, drag them, and select them to resize, rotate, or delete. On a keyboard, arrow keys move a selected decoration; Delete / Backspace removes it. Clear requires confirmation and can be undone. Select “Ready to plate” after arranging your decorations.
7. **Plate** — Move from the pedestal to Porcelain, Scalloped, Blush pink, or Glass without losing anything. Selecting a plate opens Scene automatically.
8. **Scene** — Choose Cream linen, Pink gingham, Warm wood, or Garden picnic. Selecting a scene opens the final photo with a small pull-back. Name the cake, and export a 1000 × 900 PNG containing only the artwork. Mobile users can also press and hold the finished image.

All interface copy, accessible names, prompts, errors, and download messages are English. User-authored messages in older saves are preserved as entered. On desktop, the entire studio fits one viewport: a compact ingredient area on the left and a separately clipped drawing area on the right. The cake is centered inside that right pane. Back, Start over, and Finish stay in the bottom action bar. On mobile, the cake is above the ingredient area, with horizontal material trays. There is no interactive step strip, generic Next button, or disabled “Spread to 85%” button. Animations are short and respect the system's reduced-motion preference.

The game guides players forward after completing each stage. Free-form filling and decoration stages have one explicit completion action, because the game cannot infer when the player has added enough. Use the persistent Back action to revisit earlier choices without losing the cake. Completed cream stages offer “Keep this coat” when revisited. Undo retains the last 60 edits in the current session and returns to the stage where the edit happened. Start over requires confirmation and clears the recipe and undo history.

## Autosave and privacy

Every edit is saved locally under `little-dessert-v1`. The current stage, independent cream strokes, single/double-layer choice, fillings, decorations, colors, plating, scene, and cake name survive refresh. Undo history does not survive refresh. No artwork or personal data is uploaded.

V1 / V1.1 / V2 saves migrate into the expanded schema while preserving their shapes, colors, messages, and decorations. The removed Slice stage migrates to Scene, saved cut lines are cleared, and mint fillings become grapes while keeping their placement. Invalid recipe data falls back safely; a corrupt JSON save displays an English recovery message. If browser storage is disabled, the game remains playable and PNG export works, with an autosave warning.

## Verify

```sh
npm test
npm run format:check
npm run build
```

Playwright runs 20 desktop / Pixel 7 browser cases covering the full baking ritual, pointer-following spatulas, real partial strokes, independent raster checks of 85% auto-completion, explicit layering, backtracking, native touch and mouse gestures, ingredient placement, resizing, rotation, deletion, confirmed clear/reset, custom lettering and colors, all plates and scenes, the removed Slice stage, green grapes, viewport fitting, fixed bottom actions, non-overlapping scene backgrounds, automatic stage changes (including held pointers and throttled animation frames), frameless layout, reduced motion, English interface copy, migration, damaged saves, disabled storage, and PNG dimensions and pixel agreement with the final preview.

Layout checks include 1440×900, 1366×768, 1280×720, 1024×600, 390×844, and 320×640 viewports. The page itself does not scroll; exceptionally small screens may scroll within the material area without visible scroll rails. Reports/screenshots are generated in ignored `test-results/`. Mobile coverage uses Chromium device emulation and native touch events; real iOS / Safari hardware is not yet verified.

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

Cream is rendered from actual clipped pointer strokes, geometric coverage measurement, automatic finishing at 85%, and side-color blending; it is not a fluid or mesh simulation. Cake slicing has been removed. Fruit is provided already cut; there is no knife-controlled fruit cutting. Ingredient drop shadows and surface foreshortening are stylized 2D. There is no sound, cloud album, account system, or new dessert type. Each surface supports up to 250 decorations to protect mobile performance.
