# Painted vanilla study

This branch is a playable study, separate from the public v2.4 release. Do not merge it into `main` or run the Pages deployment before visual review. The existing Pages workflow only deploys pushes to `main`.

The hosted `?demo=vanilla` entry skips importing a public recipe on the first visit so the new style is immediately visible. Existing preview progress still resumes; the public save stays untouched.

## Try it

Run `npm ci`, `npm run build:preview`, then `npm run preview` and open `http://localhost:5174`. Alternatively, open the generated `dist-preview/vanilla-preview.html` in Chrome or Edge. It embeds its code and images and needs no network requests or package installation. If a browser/device blocks local HTML, serve it using `node server.js` or Python's HTTP server. To test on a phone, open the development server's forwarded port or the computer's LAN address on the same network.

Choose Round > Vanilla > Place this sponge > Keep one layer. In Frost choose **Full frosting** or **Top-only frosting**, then hold and sweep over the cake. At 85% it advances to Decorate. Add several strawberries; drag one and use its selection controls. Back returns to Frost for comparing modes. Finish cake and Save image export the current recipe. Double-layer filling, text, all shapes/flavors, six plates, scenes, slice view, undo, reset, and autosave remain available.

## Scope and material sources

- Only the preset **round vanilla sponge** uses the new painted body and frosting. Other shapes, sponge flavors, and custom sponge colors use the existing drawing system.
- Six supplied originals live unchanged in `assets/painted/`: whole strawberry, strawberry slice, blueberry, cream swirl, spatula, and cream bowl. Their alpha-aware source rectangles exclude transparent padding and the faint outer glow. Drawing preserves each crop's aspect ratio; the spatula receives a calibrated rotation so its blade follows the pointer. A cream-bowl image represents Vanilla; other cream colors retain their existing bowl icons.
- The supplied screenshot is a reference only. It is not shipped as the cake or embedded in the standalone preview.
- `material-atlas.png` is an original generated set of four **surface textures** for porous sponge and cream strokes. `painted-demo.js` clips these independent textures to procedural geometry and actual user-painted masks. It never flattens the entire cake, toppings, tools, and stand into one reference image. Other frosting colors have a procedural fallback.
- On Top-only frosting, sides remain exposed. On Full frosting, top-plane gestures also gradually cover the sides; users do not have to drag a separate vertical face. Switching mode preserves the top strokes and completion flag, so the choice is reversible without erasing progress. Fully covered sides hide the sponge and filling.
- New preview saves use `little-dessert-painted-preview-v1`. If absent, an existing public recipe can be read and migrated, but the public `little-dessert-v1` entry is never written or cleared. Missing/invalid mode values safely default to Full frosting.

## Verification

`npm run test:preview` covers mouse and native touch painting for both modes, in-progress refresh, preserved strokes when switching, differing side pixels, strawberry placement/drag/transforms/delete/undo, restored positions, PNG agreement, all six original PNGs, legacy-save isolation, shape/flavor availability, and the self-contained HTML with external requests blocked. Existing studio regression tests use the preview save key on this branch.

The headless environment blocks `file://` navigation, so the exact standalone file is verified over HTTP with every subsequent resource request denied. Physical iOS/Safari and device-specific local-HTML restrictions are not verified. Art direction is a playable prototype for review; the existing pedestal, other flavors/shapes, and general slice geometry have not been repainted.
