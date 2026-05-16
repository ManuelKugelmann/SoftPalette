# SoftPalette
Palette-based color grading via 3D LUT. Maps any image into a palette
using soft 3D Voronoi interpolation in OkLab space — gradients stay
continuous, gaps fill cleanly, and the cube extends to its borders by
construction.

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
| **image** | Drop, paste (Ctrl+V), click to browse, or pick a built-in test image |
| **presets** | Curated palette presets — click to apply. `SlimQuake` is a hue-deduped subset of `FullQuake` |
| **palette** | Swatch grid (left column). Edit hex, delete, add new, extract from current image, or clear. Up to 256 anchors |
| **lut params · presets row** | `soft` · `balanced` · `hard` — bundled (σ_L, σ_ab, softness) operating points |
| **lut size** | Cube edge: 17 / 33 / 65 / 129 / 257 (production-standard sizes; odd values keep neutral grey cell-centered) |
| **L tolerance (σ_L)** | Anchor's pull radius along the L axis. Small = tight luminance "stripe", large = anchor reaches across the L range |
| **chroma tolerance (σ_ab)** | Anchor's pull radius across the A/B (chroma) plane. Small = tight color stripe, large = washy blending |
| **softness** | IDW power exponent. `1` = mushy linear blend, `~4` = balanced, `>10` = effectively hard-nearest (sharp Voronoi cells) |
| **lut strength** | Blends LUT output with identity (passthrough). 0% = original, 100% = full LUT |

## Algorithm
**Soft 3D Voronoi in OkLab via Shepard inverse-distance weighting.**

For every LUT cell at OkLab `(L, a, b)`:

```
d_i² = ((L − s_i.L) / σ_L)²  +  ((a − s_i.a) / σ_ab)²  +  ((b − s_i.b) / σ_ab)²
w_i  = (d_i² + ε)^(−softness/2) · s_i.strength
out  = Σ wᵢ · sᵢ.Lab  /  Σ wᵢ
```

- **L and ab tolerances** (`σ_L`, `σ_ab`) shape an anisotropic ellipsoid
  around each anchor. They are *the* "stripe" — bounded in luminance AND
  saturation, not just hue.
- **Softness** is the IDW exponent. Low values give smooth interpolation
  between anchors (3D voronoi blending); high values give hard nearest-
  neighbor quantization (sharp voronoi cells with no gradient between).
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

Build cost is roughly `O(N³ × |palette|)` GPU work. On modern hardware,
33³ is sub-millisecond and 257³ at 256 seeds completes in a few ms.
