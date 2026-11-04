# My Little Dessert Studio

This is the `preview/painted-vanilla` study branch. See [PREVIEW.md](PREVIEW.md) for the playable offline preview, the six supplied assets, two frosting modes, save isolation, and test coverage. The public release remains unchanged.

An original, sunlit 2D baking game. Start with a bare sponge, spread cream, tuck in a little filling, and make a cake that feels like you. No timers, scores, accounts, or failure states.

## Run locally

Node.js 20+ is required; the cloud environment uses Node.js 24.

```sh
npm ci
npm run dev
```

The development server listens on port 5173 and accepts an optional `PORT` variable. Use an HTTP server rather than opening the HTML directly: the game uses native JavaScript modules. There are no runtime npm dependencies, external images, fonts, analytics, APIs, database, or credentials.

## The baking ritual

1. **Sponge** — Round, Heart, Square, or Flower. Choose a preset or custom sponge color. “Place this sponge” opens the layer decision before any filling work begins.
2. **Layers** — Illustrated single/double-layer options explain the choice. A single layer goes straight to Frost; fruit and lettering belong on top later, in Decorate. Two layers open Cream and Filling. Switching between these choices preserves existing fillings instead of deleting them.
3. **Cream (two layers)** — Pick a cream bowl or custom color, then hold and sweep across the cake. The spatula follows the pointer or finger; hovering never paints. At 85%, the coat finishes and Filling opens automatically. Revisited coats offer “Keep this coat”.
4. **Filling (two layers)** — A persistent “Inside, not on top” note explains that fruit will be sandwiched between sponges and revealed in the final slice. Add and drag fruit, chocolate, cookies, or macarons. “Cover with the second layer →” plays the falling-sponge transition and opens Frost. It is safe to leave the filling empty. The early Finish action is disabled until Decorate, so this middle step cannot accidentally appear to be the end of the game.
5. **Frost** — In this study choose Full frosting or Top-only frosting before painting (details in PREVIEW.md). Hand-spread a separate outer coat with the same spatula control and 85% completion rule. Each gesture, including its automatic finish, is one undo action. The sides gradually take on the cream color as coverage increases; reaching 85% automatically opens Decorate.
6. **Decorate** — All original fruit, sliced fruit, sweets, flowers, bows, pearls, cream piping, and custom lettering remain available. Enter a message of up to 20 characters, or use “Happy Day” / “For You”. Add multiple pieces, drag them, and select them to resize, rotate, or delete. On a keyboard, arrow keys move a selected decoration; Delete / Backspace removes it. Clear requires confirmation and can be undone. Select “Ready to plate” after arranging your decorations.
7. **Plate** — Compare six plates without losing anything: Classic Ivory (the existing cream porcelain with gold dots), Blue Ribbon, Matcha Dots, Pink Gingham, Blue Stripes, and Garden Flowers. Select “Set the scene” when ready.
8. **Scene** — Choose Cream linen, Pink gingham, Warm wood, or Garden picnic. Selecting a scene opens the final photo with a small pull-back. Name the cake, and export a 1000 × 900 PNG containing only the artwork. Mobile users can also press and hold the finished image.

In the final photo, **Peek inside** moves a wedge aside and turns it to expose a cut face. **Turn the cut** cycles three front-facing cut directions; **Whole cake** restores the uncut photograph. Either view exports as the same 1000 × 900 PNG, with the selected plate and scene. The cut direction and preferred view are saved; returning to edit never changes the recipe.

Cut faces use original Canvas fruit-section illustrations, sponge crumb texture, and the recipe's independent sponge, filling, and frosting colors. Spatial distance from each radial cut determines which placed fillings intersect and how wide the exposed section is. Distant fillings remain hidden; single-layer cakes never gain an invented middle layer. Top decorations and lettering are clipped in the top plane, split across the cut, and move with their portion. No AI service, network generation, or physics engine is used.

This is a stylized 2.5D approximation: fruit volumes use simple radii, three cut directions are preset, and the detached wedge uses simplified side frosting. Text crossing a cut is visually split. Exact three-dimensional fruit orientation and deformable cutting are not simulated. Plate artwork is preserved unchanged. Mobile tests use Chromium touch/device emulation; physical Safari/iOS devices still need hands-on verification.

All interface copy, accessible names, prompts, errors, and download messages are English. User-authored messages in older saves are preserved as entered. On desktop, the entire studio fits one viewport: a compact ingredient area on the left and a separately clipped drawing area on the right. The cake is centered inside that right pane. Back, Start over, and Finish stay in the bottom action bar. On mobile, the cake is above the ingredient area, with horizontal material trays. There is no interactive step strip, generic Next button, or disabled “Spread to 85%” button. Animations are short and respect the system's reduced-motion preference.

The game guides players forward after completing each stage. Free-form filling and decoration stages have one explicit completion action, because the game cannot infer when the player has added enough. Use the persistent Back action to revisit earlier choices without losing the cake. Completed cream stages offer “Keep this coat” when revisited. Undo retains the last 60 edits in the current session and returns to the stage where the edit happened. Start over requires confirmation and clears the recipe and undo history.

## Autosave and privacy

The public v2.4 release saves under `little-dessert-v1`. This study reads that legacy entry only if needed, and saves edits separately under `little-dessert-painted-preview-v1`. The current stage, independent cream strokes, single/double-layer choice, fillings, decorations, colors, plating, scene, and cake name survive refresh. Undo history does not survive refresh. No artwork or personal data is uploaded.

Old recipes saved in Cream or Filling are migrated to the double-layer route so their interior work remains intact. Stage IDs are retained while their visible order changes, preserving later-stage saves. Legacy invalid cut settings fall back safely.

Legacy plate choices migrate to Classic Ivory, except Blush pink which becomes Pink Gingham. The new schema preserves all six plate choices across refresh.

V1 / V1.1 / V2 saves migrate into the expanded schema while preserving their shapes, colors, messages, and decorations. The removed Slice stage migrates to Scene, saved cut lines are cleared, and mint fillings become grapes while keeping their placement. Invalid recipe data falls back safely; a corrupt JSON save displays an English recovery message. If browser storage is disabled, the game remains playable and PNG export works, with an autosave warning.

## Verify

```sh
npm test
npm run format:check
npm run build
```

Playwright defines 40 desktop / Pixel 7 browser cases covering the full baking ritual, pointer-following spatulas, real partial strokes, independent raster checks of 85% auto-completion, explicit layering, backtracking, native touch and mouse gestures, ingredient placement, resizing, rotation, deletion, confirmed clear/reset, custom lettering and colors, all plates and scenes, the removed Slice stage, green grapes, viewport fitting, fixed bottom actions, non-overlapping scene backgrounds, automatic stage changes (including held pointers and throttled animation frames), frameless layout, reduced motion, English interface copy, migration, damaged saves, disabled storage, single-layer skip routing, cut intersections on every silhouette, slice/whole switching, cut-angle persistence, legacy filling migration, and PNG dimensions and pixel agreement with the final preview.

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
| `scripts/build-site.js` | Production asset fingerprinting, including plate PNGs and the renderer import                                              |
| `tests/studio.spec.js`  | Browser acceptance and regression checks                                                                                   |

Add a material by extending `toppingNames` / `drawTopping` in the renderer and its ingredient category in the existing app. Cake and ingredient illustrations are original Canvas drawings. Five transparent plate PNGs were supplied by the project owner; they are retained unchanged in `assets/plates/`. Runtime source rectangles exclude stray transparent padding, and a shared orthographic projection matches the cake view. Blue Ribbon is rotated horizontally and uses a smaller cake to expose its bows. Classic Ivory retains the existing vector plate. No video frames are shipped.

## Publish

```sh
npm run build
```

Deploy the generated `dist/` directory to a static host. Content-derived JS/CSS filenames prevent cached resources from mixing releases. GitHub Pages deploys automatically from `main` via `.github/workflows/pages.yml`.

For a fresh repository, select **Settings → Pages → Source → GitHub Actions**, then run the workflow. Site: `https://iriszhu79.github.io/My-Little-Dessert-Studio/`. Confirm a successful Actions deployment before calling a release live.

## Deliberate simplifications

Cream is rendered from actual clipped pointer strokes, geometric coverage measurement, automatic finishing at 85%, and side-color blending; it is not a fluid or mesh simulation. Cake slicing has been removed. Fruit is provided already cut; there is no knife-controlled fruit cutting. Ingredient drop shadows and surface foreshortening are stylized 2D. There is no sound, cloud album, account system, or new dessert type. Each surface supports up to 250 decorations to protect mobile performance.
