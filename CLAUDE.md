# SoftPalette — repo conventions for Claude

## Build timestamp — bump on every commit

The `<meta name="build" content="...">` tag and the `#buildBadge` span in
`index.html` carry an ISO-8601 UTC timestamp that the user reads from the
header (it's also click-to-copy). **Update both to the current UTC time
right before each `git commit`** so the badge always reflects the freshest
push.

```bash
TS=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
# Then edit index.html: replace the timestamp in both the <meta name="build">
# tag and the <span id="buildBadge">…</span> body with $TS.
```

The two literals must match exactly. The header tooltip tells users to
hard-reload if the badge doesn't match the latest edit, so a stale
timestamp is misleading.

## Branch + push

Work happens on `claude/extend-256-color-palette-b6Lmh`. Push with
`git push -u origin <branch>`; the `PostToolUse` hook in
`~/.claude/settings.json` emits a `githack` URL message after push.

## Algorithm-level notes

The LUT pipeline is a soft 3D Voronoi in OkLab with several composable
features. Order of operations inside the build fragment shader:

1. Read curve direction for this cell's L (luma look)
2. IDW Pass 1: find `d_min²` (anisotropic + isotropic)
3. IDW Pass 2: weighted sum with
   - soft hue gate (smoothstep) against a cell↔curve blended direction
   - luma-look alignment bonus toward the curve direction
4. Chroma-preserving rescale (coherence-modulated)
5. `cRange` blend toward cell chroma
6. Rejection envelope (exp falloff outside `reach`)
7. `lRange` blend toward cell L
8. Output

After the build pass: anchor stamps → blur iters (each: 3 axis blurs
+ stamp) → final stamp.

CPU `idwLab()` (hue preview) must mirror the GPU build exactly. If
behavior changes in the shader, update `idwLab()` in the same commit.
