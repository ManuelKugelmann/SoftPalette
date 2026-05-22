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

**Terminology:** "LUT texel" = one texel of the N³ output LUT cube,
addressed by its (L, a, b) coordinate. "anchor" = a palette seed.
Voronoi cells (the regions of LUT texels that adopt a given anchor)
are implicit — never materialized; they emerge from per-texel IDW or
nearest-hue selection.

**Color terms:** SoftPalette works in OkLab. Luma = `lab.x`, Chroma =
`length(lab.yz)`, Hue = `atan2(lab.z, lab.y)`. Chroma is absolute
colorfulness (not Saturation, which is Chroma relative to Luma — we
don't use Saturation anywhere).

**Slider names** (and their roles per method):
- `lRange` / `abRange` — anisotropic distance weights (Luma axis,
  (a, b) axes). IDW: σL / σab in the Shepard IDW distance metric.
  Stripes: weights for nearest-seed selection in step 1a.
- `hRange` — IDW: Gaussian Hue gate width. Stripes: restamp Hue band
  width in step 1b.
- `softness` — IDW: Shepard power exponent. Stripes: drives step-1b
  iter count via `stripeItersFromSoftness(softness) = round(10 / softness)`.
  Single unified slider; no separate `stripeIters` param.
- `lPreserve` / `cPreserve` (UI "luma preserve" / "chroma preserve")
  — texel→identity-LUT blend (Luma / Chroma magnitude). Applied
  inside `FS_LUT_BUILD` with anchor-coherence gate. 0 = snap to
  anchor's Luma/Chroma; 1 = passthrough identity (image Luma/Chroma
  preserved). IDW only — Stripes' step 1 does not consult these.

### Step 1 (IDW) — `FS_LUT_BUILD`, per LUT texel per Luma slice

1a. IDW Pass 1: track `d_min²` (anisotropic, weighted by `lRange` /
    `abRange`) + `d_min²` (isotropic) and record the nearest anchor's
    Luma and Chroma
1b. IDW Pass 2: Shepard IDW on the ratio `d² / d_min²` with a Gaussian
    Hue gate against the LUT texel's own (a, b) direction, gate width
    set by `hRange`; accumulates weighted Lab and weighted Chroma
1c. Chroma-preserving rescale, coherence-modulated — counters Chroma
    cancellation when opposing-Hue anchors blend toward grey
1d. `cPreserve` mix toward the texel's identity Chroma, gated by anchor
    coherence (low coherence → don't push noisy direction up to
    identity magnitude)
1e. `lPreserve` mix toward the texel's identity Luma (ungated)
1f. Envelope clamp — per-channel Luma/Chroma clamp from the
    Hue-interpolated `(L_lo, L_hi, C_lo, C_hi)` curve, with soft-min/max
    transition outside the band

### Step 1 (Stripes) — `stripes_buildLut`, CPU

1a. Voronoi-rotate every LUT texel to its nearest seed's Hue, where
    "nearest" is anisotropic Lab distance weighted by `lRange` /
    `abRange` (same metric as IDW). Cell keeps its own Luma and Chroma
    magnitude (raw "stripes" cube).
1b. Iterate `stripeIters` × { 3D blur the whole cube (CPU
    `stripes_blur3D`, plain Cartesian), then restamp only texels whose
    Hue lies within `hRange` of a seed }
1c. Pin the LUT texel at each anchor's (L, a, b) to the anchor's exact value

Stripes' step 1 does not consult `cPreserve` / `lPreserve` / envelope
clamp. Stripes currently has no texel→identity blend — the slider
values are ignored on this path (open question whether to wire them in).

### Shared late stages — `applyLateStages`

2. Anchor stamp (overwrite the LUT texel nearest each anchor with the
   anchor's exact value)
3. Blur loop × `smoothness` iters — each iter = 3 separable axis blurs
   + anchor restamp. The blur shader (`FS_LUT_BLUR`) applies the
   chroma-preserving rescale (Cartesian sum + scalar Chroma mean,
   rescale toward Cavg modulated by coherence) but does NOT re-apply
   `cPreserve` / `lPreserve` — those are build-stage only.
4. Final anchor stamp
5. Reach desaturation (`applyReachPass`) — Chroma falloff with distance
   from any anchor
6. Luma-look rotation (`applyLumaLookPass`, UI "luma look") — rotates
   `arg(yz)` toward the Luma→Hue curve. Operates on the cached
   pre-luma-look LUT (`state.lutTexRaw`), so moving only the `lumaLook`
   slider re-runs this single pass with no full rebuild

The per-texel late stages (reach, luma look, luma order) touch disjoint
axes — `|yz|`, `arg(yz)`, `lab.x` — so reordering within that group is
safe. Only the build/blur/stamp sequence is order-sensitive.

CPU `idwLab()` (defined at index.html:1207) is currently unused — kept
as a reference but not called from the preview path. `rawIdwLab()` is
the actual IDW hue preview; `rawStripesLab()` is the Stripes hue
preview (mirrors step 1a of `stripes_buildLut`).
