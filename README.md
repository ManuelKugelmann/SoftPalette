# SoftPalette
Palette-based color grading.
Maps any discrete palette into a soft 3D LUT — gradients stay continuous, gaps fill cleanly.

## Try it
- Main: <https://manuelkugelmann.github.io/SoftPalette/>
- Branch: <https://raw.githack.com/ManuelKugelmann/SoftPalette/claude/extend-256-color-palette-b6Lmh/index.html>

## Usage
- Drop an image.
- Pick a palette (preset, extract-from-image, or hand-roll hex colors — up to 256 anchors).
- The tool bakes a 3D LUT (default 33³, selectable up to 257³)
- The result is applied to the test image.
  Drag anywhere on the canvas to scrub a before/after split.

## Use cases
- Stylize photos to a game's palette (Quake, Moebius, Ghibli presets included).
- Map a moodboard's palette onto reference photos.
- Generate a consistent look across many images using the same palette.
- Explore how a palette feels in continuous tone.

## Controls

| Control | What it does |
|---|---|
| image | Drop, paste (Ctrl+V), click to browse, or pick a built-in test image |
| presets | Curated palette presets — click to apply. `Quake256` is the full canonical 256-entry Quake 1 palette (gfx/palette.lmp); `FullQuake` is its 28-entry hue-binned subset; `SlimQuake` is a hue-deduped subset of `FullQuake` |
| palette | 16-per-row swatch grid (left column). Click a swatch → native color picker. Right-click → remove. Up to 256 anchors |
| extend palette | Optional auto-extension: each palette anchor stamps an N×N (L, C) constellation at its hue. `grid` chooses 1 (off), 3 (9 entries / anchor), 5, or 7. `L spread` and `chroma spread` set the ±range per axis. Total seeds are capped to 256 |
| lut size | Cube edge: 17 / 33 / 65 / 129 / 257 (production-standard sizes; odd values keep neutral grey cell-centered) |
| lut strength | Blends LUT output with identity (passthrough). 0% = original, 100% = full LUT |
| **IDW** | |
| luma tolerance (σ_L) | Anchor's pull radius along the L axis. Small = tight luminance "stripe", large = anchor reaches across the L range |
| chroma tolerance (σ_ab) | Anchor's pull radius across the A/B (chroma) plane. Small = tight color stripe, large = washy blending |
| softness | IDW power exponent. `1` = mushy linear blend, `~4` = balanced, `>10` = effectively hard-nearest (sharp Voronoi cells). Operates on the *ratio* `d² / d_min²` so the transition width is scale-free — same softness behaves the same regardless of palette spacing |
| Luma range / chroma range | Per-axis blend of the output toward the input cell's own L and C. `0` = snap fully to the anchor's nominal L/C (palette flattens the image). `1` = pass input L/C straight through (anchor only steers hue). Lets the image's lightness/saturation structure survive the palette mapping |
| reach | Anchor rejection radius (OkLab units). Cells farther than `reach` from the nearest anchor desaturate — palette has no good answer for that hue/L combination |
| luma envelope ± / chroma envelope env ±** | Per-hue envelope half-width. Bounds come from a Gaussian-weighted soft-min/soft-max of palette anchor L (and C) within the local hue radius. Output is hard-clamped to `[envLLo − lExt, envLHi + lExt]` and analogously for chroma. The `floor` / `ceil` toggles disable that side individually |
| smoothness | Gaussian blur iterations |
| luma look | luma→hue bias. 0 = off; 1 = pre-shift each cell's (a, b) fully toward the palette's L-conditional mean hue. Captures the teal-orange-style "cool shadows, warm highlights" automatically from the palette's L→(a,b) profile |
| **Stripes** | |
| stripe thickness | Hue radius (rad) for the stripe stamp pass. Cells within this angular distance of a seed's hue get hue-snapped to that seed |
| chroma envelope  | `ceil` caps stamped chroma at the per-hue palette envelope; `floor` lifts low-chroma cells up to the envelope. Boost inflates the envelope by −50 % … +200 % of the palette's natural per-hue chroma |
| luma envelope | `ceil` clamps output L at the palette's max L; `floor` clamps at min L. Boost extends the bounds by −50 % … +100 % of the palette's L range |
| smoothness | blur + restamp loop count |

## Algorithm: IDW

- **IDW**: Chroma-preserving soft 3D Voronoi in OkLab via scale-free Shepard IDW.
  **Softness** is the IDW exponent. Low values give smooth interpolation
  between anchors (3D voronoi blending); high values give hard nearest-
  neighbor quantization (sharp voronoi cells with no gradient between).
  Operates on the *ratio* `d² / d_min²` so transition behavior is
  scale-free — a `softness=4` produces the same fractional transition
  width whether anchors are 0.05 or 0.5 apart in Lab.
  **L and ab tolerances** (`σ_L`, `σ_ab`) shape an anisotropic ellipsoid
  around each anchor.
- **Chroma preservation** rescales the blended (a, b) magnitude toward
  the weighted-average source chroma, but only as far as anchors *agree*
  on hue (coherence ∈ [0, 1]). High coherence → full chroma boost (no
  brownish mush in transition zones near aligned anchors). Low coherence
  (opposing anchors with equal weight) → fall back to the Lab average,
  which is honestly grey rather than a falsely confident hue invention.
- **Smoothness** post-blur runs separable 3D Gaussian iterations on the
  finished LUT — pairs well with high softness for "saturated regions
  with soft edges."
- **Extends to the cube borders**: at the far corners of OkLab
  space, the closest anchor dominates the weighted sum, so cells inherit
  its color cleanly. No hue gaps need patching, no "missing hue collapses
  to grey" failure mode.

## Algorithm: Stripes

-  **Seeds**: each palette color → an OkLab cell, stored as `(L, a, b, h, C)`.
   Synthetic blackpoint / whitepoint anchors are skipped.
-  **Voronoi by hue**: every LUT cell is initially assigned to its nearest
   palette seed by angular hue distance and stamped (clamps output L to the
   palette's L extremes, output chroma to the per-hue envelope).
-  *Stripe stamping**: cells inside a seed's hue stripe (radius
   `stripeRad`, default 0.04 rad ≈ 2.3°) get their hue snapped to that
   seed's hue, with chroma capped at the envelope.
-  **Iterative blur**: separable 3D Gaussian — 5-tap `(1, 4, 6, 4, 1)/16`
   on the chroma axes, 3-tap `(s, 1−2s, s)` with `s = wL/4` on the L axis
   (anisotropic: chroma blurs more than lightness). Followed by re-stamping
   stripe cells. Repeats `smoothness` times. This is what produces smooth
   gradients between anchors.
-  **Smooth chroma envelope**: a per-hue chroma ceiling, built as
   `max over seeds of (s.C × max(0, 1 − d_hue/(4·stripeRad)))`. Optional
   `stripeEnvBoost` inflates uniformly; an optional floor lifts low-chroma
   cells to the envelope rather than passing them through.
-  **Final cosmetic blur** hides the last stamp discontinuities.




