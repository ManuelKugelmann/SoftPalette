# SoftPalette — repo conventions for Claude

## Build timestamp — auto-bumped, don't touch by hand

The `<meta name="build" content="...">` tag and the `#buildBadge` span in
`index.html` carry an ISO-8601 UTC timestamp the user reads from the
header (click-to-copy). It's kept fresh automatically:

- `.githooks/pre-commit` runs `scripts/sync-build-timestamp.sh` and
  re-stages `index.html` so every commit lands with the current time.
- `.github/workflows/sync-build-timestamp.yml` is the server-side
  fallback — if a push arrives with an older timestamp, the workflow
  rewrites and pushes a `[skip build-timestamp]` follow-up.

Don't edit the two literals manually; the hook overwrites them anyway.
If the local hook isn't installed, run `git config core.hooksPath .githooks`
once in the worktree.

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
