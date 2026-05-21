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

**Stripes** rasterises each anchor as a 1-cell-wide hue stripe (along its
hue ray in OkLab), weighted strongest at the anchor's L / chroma. Iterated
blur diffuses the stripes outward into the neutral background. Graphical,
posterised look with distinct hue regions.

Shared controls (apply to both):

| Control | What it does |
|---|---|
| image | Drop / paste / browse, or pick a built-in test image |
| presets | Curated palettes (Quake, Moebius, Ghibli, …). Click to apply |
| palette | Swatch grid. Click → color picker. Right-click → remove. Up to 256 |
| extend palette | Auto-extend each anchor with a constellation of luma / chroma / hue variants. Fills the palette out without you adding every shade by hand |
| lut size | 17 → 257 cube edges. Higher = more precise, slightly slower |
| lut strength | Mix the result with the original. 100 % = full effect |
| smoothness | How much to blur the LUT after building. Smooths transitions |
| luma envelope ± + floor / ceil | Limit how far output luma can go from the palette's natural luma range. Toggle floor / ceil to disable that side |
| chroma envelope ± + floor / ceil | Same idea for chroma — limit how saturated outputs can get relative to the palette |
| luma look | Tints output toward the palette's natural dark / light hue bias. Applied late (rotates LUT cells, palette anchors preserved). Slider doesn't trigger a rebuild — instant feedback |

IDW-only:

| Control | What it does |
|---|---|
| luma tol / chroma tol | Anchor pull radius in luma vs chroma. Tight = sharp regions, wide = washy blends |
| softness | How abruptly anchors hand off. Low = mushy, high = near-Voronoi cells |
| luma range / chroma range | Keep image structure (1) or snap to palette values (0) on each axis |
| reach | Distance beyond which the palette gives up — far-out colors desaturate instead of latching to a wrong hue |

Stripes-only:

| Control | What it does |
|---|---|
| stripe iters | Build-time blur+restamp passes that diffuse the 1-cell-wide hue stripes outward. 0 = raw stripes on neutral, higher = smoother fill |

## How it works (short version)

Both algorithms build a 3D LUT — one cell per (luma, chroma_a, chroma_b)
position in OkLab space — and the image is mapped through it on the GPU.

- **IDW**: each LUT cell is a distance-weighted blend of all palette anchors
  in OkLab, with chroma kept honest where anchors agree on a hue and falling
  back to grey where they don't. Built entirely on the GPU.
- **Stripes**: starts with a palette-mean fill, then rasterises each
  anchor's hue ray as a 1-cell-wide stripe across the (a, b) plane.
  Stripe cells get a Gaussian-weighted blend of same-hue anchors in (L,
  chroma) space — strongest at the anchor's exact position, interpolating
  smoothly between same-hue anchors at different L or C, fading back to
  neutral elsewhere. Iterated blur+restamp passes diffuse the stripes
  outward. Built on the CPU and uploaded.

After either build, **luma look** runs as a late stage that rotates each
non-anchor cell's chroma direction toward the palette's natural dark /
light hue bias — the "cool shadows, warm highlights" feel for teal-orange
type palettes. Palette anchor cells are restamped after to stay exact.

The LUT is sampled per-pixel with hardware trilinear filtering, converted
back to sRGB, and displayed.
