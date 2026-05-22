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

The LUT pipeline is a soft 3D Voronoi in OkLab. Two build methods
share the post-build pipeline — only step 1 differs.

### Step 1 (IDW) — `FS_LUT_BUILD`, per cell per L-slice

1a. IDW Pass 1: track `d_min²` (anisotropic) + `d_min²` (isotropic) and
    record the nearest anchor's L and C
1b. IDW Pass 2: Shepard IDW on the ratio `d² / d_min²` with a Gaussian
    hue gate against the cell's own (a, b) direction; accumulates
    weighted Lab and weighted chroma
1c. Chroma-preserving rescale, coherence-modulated
1d. `cRange` blend toward cell chroma, gated by coherence
1e. `lRange` blend toward cell L
1f. Per-channel L/C envelope clamp from the hue-interpolated
    `(L_lo, L_hi, C_lo, C_hi)` curve (soft-min/max transition)

### Step 1 (Stripes) — `stripes_buildLut`, CPU

1a. Voronoi-rotate every cell to its nearest seed's hue, preserving the
    cell's own L and chroma magnitude (raw "stripes" cube)
1b. Iterate `stripeIters` × { 3D blur the whole cube, then restamp only
    cells whose hue lies within `hRange` of a seed }
1c. Pin exact anchor cells

Stripes' step 1 produces a complete LUT directly — it does not use
`cRange` / `lRange` / envelope clamp (effectively cRange = lRange = 1,
envelope = passthrough).

### Shared late stages — `applyLateStages`

2. Anchor stamp
3. Blur loop × `smoothness` iters — each iter = 3 separable axis blurs
   + anchor restamp
4. Final anchor stamp
5. Reach desaturation (`applyReachPass`)
6. Luma-look rotation (`applyLumaLookPass`) — operates on the cached
   pre-luma-look LUT (`state.lutTexRaw`), so moving only the `lumaLook`
   slider re-runs this single pass with no full rebuild

The three per-cell late stages (reach, lumaLook, lumaOrder) touch
disjoint axes — `|yz|`, `arg(yz)`, `lab.x` — so their order is
commutative; only the build/blur/stamp sequence is order-sensitive.

CPU `idwLab()` (hue preview, IDW only) must mirror `FS_LUT_BUILD`
exactly. If behavior changes in the shader, update `idwLab()` in the
same commit. The Stripes hue preview uses `rawStripesLab()`, which
mirrors step 1a of `stripes_buildLut`.
