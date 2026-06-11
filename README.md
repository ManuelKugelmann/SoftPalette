# SoftPalette
Map any image into a palette you choose.
SoftPalette turns a handful of colors into a smooth color grade.

![SoftPalette](softpalette.jpg)

## Try it
- main: <https://manuelkugelmann.github.io/SoftPalette/>
- branch HEAD: <https://raw.githack.com/ManuelKugelmann/SoftPalette/main/index.html>

## Usage
- Drop an image (or paste with Ctrl+V, or click to browse) — or pick a built-in
  test image (including the hue and chroma ramps).
- Pick a palette: use a preset or hand-roll.
- The grade applies live to the canvas. Inspect
  before / after split.

## Use cases
- Stylize photos to a game / film palette (Quake, Moebius|Ghibli, Old CRT, …).
- Map a moodboard's palette onto reference photos.
- A consistent look across many images from one palette.
- Explore how a palette feels in continuous tone.

## How it works (short version)
SoftPalette builds a 3D LUT and maps the image through it on the GPU. 
Base is a soft 3D Voronoi via Shepard IDW — 
each cell is a distance-weighted blend of the palette anchors,
kept vivid where anchors agree on a hue and easing toward grey where they don't. 

## Controls
The LUT params card runs top → bottom in pipeline order.

**Global**

| Control | What it does |
|---|---|
| lut size | 17³ → 257³ cube. Higher = more precise, slightly slower |
| hue gate | Opposing-hue safety net — curbs confidently-wrong hues |
| chroma gate | Near-grey desaturation. 1 = keep chroma, 0 = full desat |

**Step 1 — interpolate anchors.** Two draggable **L/C/H triangles** set how the
anchor blend weights luma vs chroma vs hue:

| Control | What it does |
|---|---|
| luma blend (triangle) | which anchors drive each cell's **luma** |
| hue blend (triangle) | which drive its **colour** (chroma + hue). Pull the two pins apart to decouple luma from colour |
| anchor softness | blend sharpness (low = mushy, high = near-Voronoi) |
| blur | post-build smoothing iterations |

**Step 2 — restore luma and chroma ramps, bounded by the palette envelope.** 

| Control | What it does |
|---|---|
| luma / chroma preserve | keep interpolated palette values (0) or keep identity ramp (1) |
| luma / chroma envelope | dual-thumb limit on how far output may leave the palette's per-hue range (0 = clamp at the band, 1 = no limit) |

**Step 3 — effects.**

| Control | What it does |
|---|---|
| blur | post-build smoothing iterations |
| reach | distance beyond which far-out colors desaturate instead of latching to a wrong hue |
| lut blend | mix the result with the original (100 % = full effect) |

**extend palette** (toggle) auto-fills each anchor with a constellation of
luma / chroma / hue variants.
