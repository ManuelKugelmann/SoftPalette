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
- Adjust params
- The grade applies live to the canvas. Inspect
  before / after split.

## Use cases
- Stylize photos to a palette.
- Map a moodboard's palette onto reference photos.
- A consistent look across many images from one palette.
- Realtime color grading LUT for a game or movie.
- Explore how a palette feels in continuous tone.

## How it works
SoftPalette builds a 3D LUT that maps the image colors to new colors. 
The base is a soft 3D Voronoi via Shepard IDW — 
each cell is a distance-weighted blend of the palette anchors.
Additional steps adjust luma and chroma ramps, envelopes, smoothness, reach, ...

## Controls
The LUT params are top to bottom in processing order.

| **Global** | |
|---|---|
| lut size | 17³ → 129³ cube. Higher = more precise, slightly slower |
| hue gate | opposing-hue safety net |
| chroma gate | low-chroma hue noise safety net |
| **Step 1** | **interpolate anchors**  |
| luma blend (triangle) | axis based weighting of anchors that drive each cell's luma |
| color blend (triangle) | axis based weighting of anchors that drive each cell's hue and chroma |
| anchor softness | interpolation sharpness  |
| blur | smoothing iterations |
| **Step 2** | **restore luma and chroma ramp, bounded by palette envelope** |
| luma / chroma preserve | keep raw interpolated palette values or keep luma / chroma ramp |
| luma / chroma envelope | how far output may leave the palette's per-hue envelope |
| **Step 3** | **effects** |
| blur | smoothing iterations |
| reach | distance beyond which colors desaturate |
| lut blend | mix the result with the identity LUT |
