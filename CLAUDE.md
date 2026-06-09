# SoftPalette — Claude conventions

## Style

Telegram. Fragments, no preambles, no recap, no apologies. Drop
articles. Results > narration. Same style in this file.

## Build timestamp

Auto-bumped by `.githooks/pre-commit` (`scripts/sync-build-timestamp.sh`)
+ server fallback `.github/workflows/sync-build-timestamp.yml`. Don't
edit literals. Install hook: `git config core.hooksPath .githooks`.

## Branch + push

`claude/extend-256-color-palette-b6Lmh`. `git push -u origin <branch>`.
`PostToolUse` hook emits `githack` URL after push.

## Algorithm

Soft 3D Voronoi LUT in OkLab. Two build methods, shared post-build.

**Terms.** "LUT texel" = N³ cube cell at (L, a, b). "anchor" = palette
seed. Voronoi cells implicit. OkLab: Luma=`lab.x`, Chroma=`length(lab.yz)`,
Hue=`atan2(lab.z, lab.y)`. Chroma absolute, not Saturation.

**Sliders.**
- `lRange` / `abRange` — anisotropic distance weights (σL / σab in IDW;
  nearest-seed weights in Stripes 1a). UI [0.25, 1].
- `hRange` — IDW Gaussian Hue gate σ (rad); Stripes restamp band radius.
  UI [0.25, 1].
- `softness` — IDW Shepard power; Stripes 1b iters via
  `round(10/s)`. UI [1, 10].
- `lPreserve` / `cPreserve` — texel→identity blend in `FS_LUT_BUILD`,
  coherence-gated. 0=snap, 1=passthrough. **IDW only.**
- Envelope = dual-thumb floor/ceil **extension** per channel:
  `lExtLo`/`lExtHi` (luma, [0,1]) + `cExtLo`/`cExtHi` (chroma, [0,1]
  fraction × `LUT_AB_RANGE`). Each EXTENDS the per-hue curve bound
  outward on its side; at max that side is a noop (= old toggle off).
  No floor/ceil checkboxes anymore.

### Step 1 (IDW) — `FS_LUT_BUILD`, per texel per L-slice

Single dispatch, **MRT** two outputs (the IDW loop runs once):
`o0` = step-1 core, `o1` = step-2 (preserve+envelope). The `gate`
scalar (1e) is computed once and applied to both.

- 1a. Pass 1: nearest-anchor anisotropic + isotropic `d_min²`; record
  nearest Luma/Chroma.
- 1b. Pass 2: Shepard IDW on `d²/d_min²` w/ Gaussian Hue gate vs.
  texel's own (a,b); accumulate weighted Lab + Chroma.
- 1c. Chroma-preserving rescale → `target`, coherence-modulated.
- gate. Safety net scalar `hueGate × chromaTrust × lumaTrust` (kills
  opposing-Hue, fades near-grey + Luma extremes).
- **o0 / step 1** = `lab.x` (IDW luma), `yz = dir·target·gate`. No
  preserve, no envelope.
- **o1 / step 2** = 1d `cPreserve` mix→identity Chroma (`finalMag`),
  `yz = dir·finalMag·gate`; 1f `lPreserve` mix→identity Luma; 1g
  envelope clamp (`lExtLo/Hi`, `cExtLo/Hi`) w/ soft skirts.

Captured intermediates feed the inline stage previews: `lutTexStep1`
(o0), `lutTexStep2` (o1 snapshot, top of `applyLateStages`), and the
final `lutTex` (step 3). Stripes has no preserve/envelope → step1 ==
step2 (it copies its build into `lutTexStep1`). A late L-only re-clamp
(`applyLEnvelopePass`, `FS_LUT_L_ENVELOPE`) runs after luma-look when
`debugEnvelope` is on, using the same `lExtLo/Hi`.

### Step 1 (Stripes) — `stripes_buildLutGpu` (GPU, real seeds only)

- 1a. Voronoi-rotate texel→nearest seed Hue (same anisotropic Lab
  metric); keep own Luma+|C|.
- 1b. Iterate `stripeIters` (`stripeItersFromSoftness`) × { plain 3D
  blur, restamp texels w/in `hRange` of a seed Hue }.
- 1c. Pin each anchor texel to exact (L, a, b).

Shaders `FS_LUT_STRIPES_SEED` + `FS_LUT_GAUSS` + `FS_LUT_STRIPES_RESTAMP`.
The CPU builder + GPU/CPU toggle were retired — GPU is the only path.
Stripes 1 ignores `cPreserve`/`lPreserve`/envelope (so step1 == step2).

### Shared late stages — `applyLateStages`

2. Anchor stamp.
3. Blur × `smoothness` iters (3 axes + restamp). `FS_LUT_BLUR`:
   chroma-preserving rescale + hue safety net; no
   `cPreserve`/`lPreserve` (build-stage only). `uBlurStrength` tapers
   1.0→0.3 across iters (also `FS_LUT_GAUSS`).
4. Final anchor stamp.
5. Reach desaturation (`applyReachPass`) — Chroma falloff vs.
   anchor distance.
6. Luma-look (`applyLumaLookPass`) — rotates `arg(yz)` toward Luma→Hue
   curve. Reads cached `state.lutTexRaw`; moving only `lumaLook`
   reruns just this pass.

## Static checks — `scripts/check.mjs`

Dep-free Node. Checks inline-`<script>` syntax, `images/<file>` refs,
`data-preset` ↔ `PRESETS` keys, `bindImageBtn` wiring. Pre-commit hook
runs + blocks on fail.

## Headless runtime testing — Chrome + SwiftShader

SwiftShader here exposes `EXT_color_buffer_float` → LUT pipeline runs
end-to-end. Run GPU code yourself before declaring done.

```powershell
$chrome = "${env:ProgramFiles}\Google\Chrome\Application\chrome.exe"
& $chrome --headless=new --enable-unsafe-swiftshader `
  --use-angle=swiftshader --no-sandbox `
  --enable-logging=stderr --virtual-time-budget=10000 `
  --dump-dom file:///C:/Projects/SoftPalette/index.html `
  > $env:TEMP\dom.html 2> $env:TEMP\err.txt
# read #lutStatus from dom.html; grep err.txt for shader-compile/Uncaught/TypeError.
```

`#lutStatus` set by `updateLutStatus()`. Empty=init crashed. Clean:
`built in <N>ms · neighbours ΔE avg ≈0.02 · anchor self ΔE max 0.000`.
`anchor self ΔE > 0` = `stampAnchors` FBO regression. `GPU stall …
ReadPixels` warnings benign.

**A/B**: `Get-Content -Raw -replace` index.html → temp file w/ flipped
`state.params` default, run, delete. ΔE within ~0.001 = paths agree.

**Per-pixel/canvas shaders** invisible to `#lutStatus`. Use
`--screenshot=path.png --window-size=W,H` or inject JS.
