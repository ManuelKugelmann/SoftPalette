# SoftPalette
Map any image into a palette you choose. SoftPalette turns a handful of
hex colors into a smooth color grade — anchored to your palette where
the image hits a palette hue, blending continuously between them
everywhere else.

## Try it
- Main: <https://manuelkugelmann.github.io/SoftPalette/>
- Branch: <https://raw.githack.com/ManuelKugelmann/SoftPalette/claude/extend-256-color-palette-b6Lmh/index.html>

## Usage
- Drop an image (or paste with Ctrl+V, or click to browse).
- Pick a palette (one of the presets, extract from the image, or hand-roll
  hex colors — up to 256).
- The result is applied live to the canvas. Drag anywhere on it to scrub
  a before / after split.

## Use cases
- Stylize photos to a game's palette (Quake, Moebius, Ghibli presets included).
- Map a moodboard's palette onto reference photos.
- Generate a consistent look across many images using the same palette.
- Explore how a palette feels in continuous tone.

## Controls

Two algorithms — pick one with the tabs at the top of the LUT params card.

**IDW** blends every palette anchor with distance-weighted falloff. Smooth,
painterly transitions between hues.

**Stripes** snaps every cell to its nearest palette hue (Voronoi by hue
distance), keeping the cell's own L and chroma magnitude. Then iterates
`stripe iters` times: blur the whole cube, restamp only cells near a
seed hue. Graphical, posterised look with distinct hue regions.

Both methods share the same controls and presets — only step 1 of the
build differs (IDW Shepard bake vs Stripes hue-ray stamps).

| Control | What it does |
|---|---|
| image | Drop / paste / browse, or pick a built-in test image |
| presets | Curated palettes (Quake, Moebius, Ghibli, …). Click to apply |
| palette | Swatch grid. Click → color picker. Right-click → remove. Up to 256 |
| extend palette | Auto-extend each anchor with a constellation of luma / chroma / hue variants. Fills the palette out without you adding every shade by hand |
| lut size | 17 → 257 cube edges. Higher = more precise, slightly slower |
| luma anchor range / chroma anchor range | Anchor pull radius in luma vs chroma. Tight = sharp regions, wide = washy blends |
| anchor softness | IDW: Shepard exponent (low = mushy, high = near-Voronoi). Stripes: unused |
| reach | Distance beyond which the palette gives up — far-out colors desaturate instead of latching to a wrong hue |
| anchor hue range | IDW: soft hue-gate width. Stripes: restamp tolerance during iters (cells within this hue distance of a seed get restamped after each blur) |
| stripe iters | Stripes only: number of (blur → restamp narrow stripes) iterations after the initial Voronoi rotation. 0 = raw Voronoi rotation, higher = smoother bleed between hue regions |
| luma blend / chroma blend | Keep image structure (1) or snap to palette values (0) on each axis |
| luma envelope ± + floor / ceil | Limit how far output luma can go from the palette's natural luma range. Toggle floor / ceil to disable that side |
| chroma envelope ± + floor / ceil | Same idea for chroma — limit how saturated outputs can get relative to the palette |
| blur | Post-build blur+restamp iterations. For Stripes this is also what diffuses the 1-cell stripes into the neutral background (0 = raw stripes visible) |
| luma look | Tints output toward the palette's natural dark / light hue bias. Applied late (rotates LUT cells, palette anchors preserved). Slider doesn't trigger a rebuild — instant feedback |
| lut blend | Mix the result with the original. 100 % = full effect |

## How it works (short version)

Both algorithms build a 3D LUT — one cell per (luma, chroma_a, chroma_b)
position in OkLab space — and the image is mapped through it on the GPU.

- **IDW**: each LUT cell is a distance-weighted blend of all palette anchors
  in OkLab, with chroma kept honest where anchors agree on a hue and falling
  back to grey where they don't. Built entirely on the GPU.
- **Stripes**: every cell gets Voronoi-snapped to its nearest seed's hue
  (cell keeps its own L and chroma magnitude). Then `stripe iters`
  iterations of (3D blur the whole cube, restamp cells within
  `anchor hue range` of any seed) interleave smoothing with hue locking.
  Built on the CPU and uploaded.

After step 1, both methods run the **identical** late-stage pipeline:
anchor stamp → smoothness blur+restamp loop → reach desaturation → luma
look.

After either build, **luma look** runs as a late stage that rotates each
non-anchor cell's chroma direction toward the palette's natural dark /
light hue bias — the "cool shadows, warm highlights" feel for teal-orange
type palettes. Palette anchor cells are restamped after to stay exact.

The LUT is sampled per-pixel with hardware trilinear filtering, converted
back to sRGB, and displayed.
