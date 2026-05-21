# SoftPalette
Palette-based color grading via 3D LUT. Maps any image into a palette
using soft 3D Voronoi interpolation in OkLab space — gradients stay
continuous, gaps fill cleanly, and the cube extends to its borders by
construction.

## Try it
- Main: <https://manuelkugelmann.github.io/SoftPalette/>
- Branch: <https://raw.githack.com/ManuelKugelmann/SoftPalette/claude/extend-256-color-palette-b6Lmh/index.html>

## Usage
- Drop an image.
- Pick a palette (preset, extract-from-image, or hand-roll hex colors — up to 256 anchors).
- The tool bakes a 3D LUT on the GPU (default 33³, selectable up to 257³)
  by computing, for every cell, an inverse-distance-weighted blend of all
  palette anchors in OkLab.
- The result is applied to the image in real time. Drag anywhere on the
  canvas to scrub a before/after split.

## Use cases
- Stylize photos to a game's palette (Quake, Moebius, Ghibli presets included).
- Map a moodboard's palette onto reference photos.
- Generate a consistent look across many images using the same palette.
- Explore how a palette feels in continuous tone.

## Controls
| Section | What it does |
|---|---|
### Shared (both methods)
| Control | What it does |
|---|---|
| **image** | Drop, paste (Ctrl+V), click to browse, or pick a built-in test image |
| **presets** | Curated palette presets — click to apply. `Quake256` is the full canonical 256-entry Quake 1 palette (gfx/palette.lmp); `FullQuake` is its 28-entry hue-binned subset; `SlimQuake` is a hue-deduped subset of `FullQuake` |
| **palette** | 16-per-row swatch grid (left column). Click a swatch → native color picker. Right-click → remove. Up to 256 anchors |
| **extend palette** | Optional auto-extension: each palette anchor stamps an N×N (L, C) constellation at its hue. `grid` chooses 1 (off), 3 (9 entries / anchor), 5, or 7. `L spread` and `chroma spread` set the ±range per axis. Total seeds are capped to 256 |
| **IDW / Stripes** (tabs) | Choose the LUT-build method. Method-specific controls appear below |
| **lut params · preset row** | `wash` · `soft` · `balanced` · `vivid` · `hard` — bundled (σ_L, σ_ab, softness, envelope, smoothness, lumaLook) operating points. Currently tuned for IDW; Stripes follows along but only its own controls have effect |
| **lut size** | Cube edge: 17 / 33 / 65 / 129 / 257 (production-standard sizes; odd values keep neutral grey cell-centered) |
| **smoothness** | Post-build Gaussian blur iterations (IDW: 3D blur on the baked LUT; Stripes: blur + restamp loop count) |
| **lut strength** | Blends LUT output with identity (passthrough). 0% = original, 100% = full LUT |

### IDW only
| Control | What it does |
|---|---|
| **L tolerance (σ_L)** | Anchor's pull radius along the L axis. Small = tight luminance "stripe", large = anchor reaches across the L range |
| **chroma tolerance (σ_ab)** | Anchor's pull radius across the A/B (chroma) plane. Small = tight color stripe, large = washy blending |
| **softness** | IDW power exponent. `1` = mushy linear blend, `~4` = balanced, `>10` = effectively hard-nearest (sharp Voronoi cells). Operates on the *ratio* `d² / d_min²` so the transition width is scale-free — same softness behaves the same regardless of palette spacing |
| **L range / chroma range** | Per-axis blend of the output toward the input cell's own L and C. `0` = snap fully to the anchor's nominal L/C (palette flattens the image). `1` = pass input L/C straight through (anchor only steers hue). Lets the image's lightness/saturation structure survive the palette mapping |
| **reach** | Anchor rejection radius (OkLab units). Cells farther than `reach` from the nearest anchor desaturate — palette has no good answer for that hue/L combination |
| **L env ± / C env ±** (with `floor` / `ceil` toggles) | Per-hue envelope half-width. Bounds come from a Gaussian-weighted soft-min/soft-max of palette anchor L (and C) within the local hue radius. Output is hard-clamped to `[envLLo − lExt, envLHi + lExt]` and analogously for chroma. The `floor` / `ceil` toggles disable that side individually |
| **luma look** | L→hue bias. 0 = off; 1 = pre-shift each cell's (a, b) fully toward the palette's L-conditional mean hue. Captures the teal-orange-style "cool shadows, warm highlights" automatically from the palette's L→(a,b) profile |

### Stripes only
| Control | What it does |
|---|---|
| **stripe thickness** | Hue radius (rad) for the stripe stamp pass. Cells within this angular distance of a seed's hue get hue-snapped to that seed |
| **chroma envelope** (`ceil` / `floor` + boost) | `ceil` caps stamped chroma at the per-hue palette envelope; `floor` lifts low-chroma cells up to the envelope. Boost inflates the envelope by −50 % … +200 % of the palette's natural per-hue chroma |
| **luma envelope** (`ceil` / `floor` + boost) | `ceil` clamps output L at the palette's max L; `floor` clamps at min L. Boost extends the bounds by −50 % … +100 % of the palette's L range |

## Algorithm
**Chroma-preserving soft 3D Voronoi in OkLab via scale-free Shepard IDW.**

For every LUT cell at OkLab `(L, a, b)`:

```
d_i²    = ((L − s_i.L) / σ_L)² + ((a − s_i.a) / σ_ab)² + ((b − s_i.b) / σ_ab)²
d_min²  = min_i d_i²
w_i     = (d_i² / d_min²)^(−softness/2) · s_i.strength
sumLab  = Σ w_i · s_i.Lab  /  Σ w_i        (Cartesian Lab average)
C_avg   = Σ w_i · |s_i.ab| /  Σ w_i        (weighted source chroma)
coh     = |sumLab.ab| / C_avg              (∈ [0, 1] — anchor agreement on hue)
anchorMag = mix(|sumLab.ab|, C_avg, coh)   (chroma-preserving rescale magnitude)
out.|ab| = mix(anchorMag, |cell.ab|, cRange)   (blend back toward input chroma)
out.ab   = sumLab.ab direction × out.|ab|
out.L    = mix(sumLab.L,  cell.L, lRange)      (blend back toward input lightness)
```

Then optionally `smoothness` iterations of separable 3D Gaussian blur on the
LUT (also chroma-preserving, same coherence trick applied per blur tap).

- **L and ab tolerances** (`σ_L`, `σ_ab`) shape an anisotropic ellipsoid
  around each anchor. They are *the* "stripe" — bounded in luminance AND
  saturation, not just hue.
- **Softness** is the IDW exponent. Low values give smooth interpolation
  between anchors (3D voronoi blending); high values give hard nearest-
  neighbor quantization (sharp voronoi cells with no gradient between).
  Operates on the *ratio* `d² / d_min²` so transition behavior is
  scale-free — a `softness=4` produces the same fractional transition
  width whether anchors are 0.05 or 0.5 apart in Lab.
- **Chroma preservation** rescales the blended (a, b) magnitude toward
  the weighted-average source chroma, but only as far as anchors *agree*
  on hue (coherence ∈ [0, 1]). High coherence → full chroma boost (no
  brownish mush in transition zones near aligned anchors). Low coherence
  (opposing anchors with equal weight) → fall back to the Lab average,
  which is honestly grey rather than a falsely confident hue invention.
- **Smoothness** post-blur runs separable 3D Gaussian iterations on the
  finished LUT — pairs well with high softness for "saturated regions
  with soft edges."
- **Extends to the cube borders for free**: at the far corners of OkLab
  space, the closest anchor dominates the weighted sum, so cells inherit
  its color cleanly. No hue gaps need patching, no "missing hue collapses
  to grey" failure mode.

### Implementation
The LUT bake runs entirely on the GPU:
1. Palette seeds packed into a 1×256 RGBA32F sampler.
2. A 3D LUT (RGBA16F, `N×N×N`) is allocated as `TEXTURE_3D`.
3. One fragment-shader pass per L-slice: the build shader loops over all
   active seeds, accumulates the Shepard-weighted Lab blend, writes one
   `(a, b)` plane via `framebufferTextureLayer`. `N` passes total.
4. The per-pixel display shader samples `sampler3D` with hardware LINEAR
   filtering (trilinear Lab interpolation), converts back to sRGB.

## Alternate algorithm: Stripes
A second LUT-build method is selectable from the `IDW` / `Stripes` tab
pair at the top of the LUT params card. Stripes is built on the CPU
and uploaded to the same 3D LUT texture, so the rest of the pipeline
(per-pixel shader, hue preview, slice preview) is unchanged.

1. **Seeds**: each palette color → an OkLab cell, stored as `(L, a, b, h, C)`.
   Synthetic blackpoint / whitepoint anchors are skipped.
2. **Voronoi by hue**: every LUT cell is initially assigned to its nearest
   palette seed by angular hue distance and stamped (clamps output L to the
   palette's L extremes, output chroma to the per-hue envelope).
3. **Stripe stamping**: cells inside a seed's hue stripe (radius
   `stripeRad`, default 0.04 rad ≈ 2.3°) get their hue snapped to that
   seed's hue, with chroma capped at the envelope.
4. **Iterative blur**: separable 3D Gaussian — 5-tap `(1, 4, 6, 4, 1)/16`
   on the chroma axes, 3-tap `(s, 1−2s, s)` with `s = wL/4` on the L axis
   (anisotropic: chroma blurs more than lightness). Followed by re-stamping
   stripe cells. Repeats `smoothness` times. This is what produces smooth
   gradients between anchors.
5. **Smooth chroma envelope**: a per-hue chroma ceiling, built as
   `max over seeds of (s.C × max(0, 1 − d_hue/(4·stripeRad)))`. Optional
   `stripeEnvBoost` inflates uniformly; an optional floor lifts low-chroma
   cells to the envelope rather than passing them through.
6. **Final cosmetic blur** hides the last stamp discontinuities.

Stripes-only controls (visible when Stripes is selected):
- **stripe thickness** — hue radius (rad) for the stripe stamp.
- **chroma envelope** — `ceil` (default on) caps output chroma at the
  per-hue envelope; `floor` (off by default) lifts low-chroma cells up
  to the envelope.
- **envelope boost** — inflates the envelope by −50 % to +200 %.

The two methods produce visibly different looks: IDW blends every
anchor with weighted-distance falloff (smooth, painterly); Stripes
snaps each cell to its nearest anchor's hue and relies on the iterated
blur to bridge transitions (graphical, posterised, distinct hue
"regions").

Build cost is roughly `O(N³ × |palette|)` GPU work. On modern hardware,
33³ is sub-millisecond and 257³ at 256 seeds completes in a few ms.
