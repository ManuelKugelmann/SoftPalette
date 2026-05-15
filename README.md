# SoftPalette
Creates LUTs for soft palette color matching.
Palette-based color grading via 3D LUT. Smooth-snap any image to your palette's hues while keeping continuous gradients.

Drop an image.

Pick a palette (preset, extract-from-image, or hand-roll hex colors).

The tool builds a 17³ 3D LUT in OkLab space where every cell is mapped to the nearest palette anchor's hue, with smooth chroma falloff between anchors.

The result is applied to the image at GPU speed via a single fragment shader pass. Drag anywhere on the canvas to scrub a before/after split.

Use cases
- Stylize photos to a game's palette (Quake, Moebius, Ghibli presets included).
- Map a moodboard's palette onto reference photos.
- Generate a consistent look across many images using the same palette.
- Explore how a palette feels in continuous tone.

Controls
---

- image
Drop, paste (Ctrl+V), click to browse, or pick a built-in test image

- presets
Curated palette presets — click to apply

- palette
Swatch grid. Edit hex, delete, add new, extract from current image, or clear

- lut params
One-click bundles: default, +50, +100, +200 (envelope boost)

- stripe thickness
Width of each palette anchor's "stripe" in hue space (radians)

- smoothness
Iterations of blur+restamp during LUT build (higher = smoother gradients)

- luma floor / ceil
Clamp output lightness range

- chroma floor / ceil
Clamp output chroma range

- palette envelope
When on, per-hue chroma is capped to a smooth envelope of palette anchors

- envelope boost
Inflates the envelope by 0–200% (boost beyond strict palette while keeping shape)

- luma blur ratio
0 = blur only in chroma axes (preserves L contrast), 1 = isotropic 3D blur

- lut strength
Blends LUT output with identity (passthrough). 0% = original, 100% = full LUT

- extend palette
Synthesizes muted ghost anchors in wide hue gaps so missing hues don't collapse

- gap threshold
Minimum gap (rad) that triggers synthesis

- synth mutedness
Synth chroma relative to neighbors: 0 = full inheritance, 1 = grey


Algorithm
---

Seeds: each palette color → an OkLab cell, stored as (L, a, b, h, C).

Voronoi by hue: every LUT cell gets assigned to its nearest seed by angular hue distance.

Stamping: cells inside a seed's hue stripe (stripeThickness rad) are clamped to that seed's hue with chroma capped by the envelope.

Iterative blur: separable 3D Gaussian blur of the LUT, anisotropic so chroma axes blur more than lightness. Followed by re-stamping. Repeats smoothness times. This is what produces smooth gradients between anchors.

Envelope: a smooth per-hue chroma ceiling built from the seed chromas, falloff radius = 4 × stripeThickness. Optional envelopeBoost inflates uniformly.

Palette extension (optional): finds hue gaps wider than threshold, inserts distance-weighted synthetic anchors with chroma lerp(boundary_C) × (1−mutedness). Distinct in the swatch UI (dashed border, "SYNTH" label, read-only).


LUT layout
---
The LUT is a 17×17×17 atlas stored as a 2D texture (289×17 pixels), packed as (L_slice × N + a_idx, b_idx). Trilinear lookup in shader.
