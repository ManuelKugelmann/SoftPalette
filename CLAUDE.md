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

Soft 3D Voronoi LUT in OkLab. Single build method (IDW Shepard), shared
post-build late stages. (Stripes was removed — one algo.)

**Terms.** "LUT texel" = N³ cube cell at (L, a, b). "anchor" = palette
seed. Voronoi cells implicit. OkLab: Luma=`lab.x`, Chroma=`length(lab.yz)`,
Hue=`atan2(lab.z, lab.y)`. Chroma absolute, not Saturation.

**Step ownership.** step1 = interpolate anchors; step2 = restore L/C ramps
under envelope; step3 = effects on top. Params stay in their step (audited).
**Global tier** (top UI section, below the preset buttons, own separators —
not step-scoped): `lutSize` + `hueGate` + `chromaGate`.

**Sliders.**
- `hueGate` — GLOBAL opposing-hue safety net. `FS_LUT_BUILD` (step 1) AND
  `FS_LUT_BLUR` (step 3). `mix(-0.3,-0.97,hueGate)` cos cutoff; faded off near
  grey by a chroma-confidence ramp (no pinwheel feathering). UI [0,1], def 0.5.
- `chromaGate` — GLOBAL near-grey desat net. `mix(smoothstep,1.0,chromaGate)`:
  **1 = max relaxation (keep chroma)**, 0 = full desat. UI [0,1], def 0.5.
- `wLuma` / `wHue` — two **barycentric L/C/H** anchor-distance metrics (draggable
  triangle widgets, replace lRange/abRange/hRange). `wLuma` = WEIGHTING (luma
  blend); `wHue` = DECOUPLING (chroma/hue blend); their separation = luma↔colour
  decoupling. C/H via projection onto the anchor's hue axis (stable at grey, no
  atan). Each `[wL,wC,wH]` sums to 1, clamped ≥0.06 (tinted border bar); def centroid.
- `softness` — Shepard power. UI [1, 8].
- `lPreserve` / `cPreserve` — texel→identity blend in `FS_LUT_BUILD` (o1),
  coherence-gated. 0=snap, 1=passthrough.
- Envelope = dual-thumb floor/ceil **extension** per channel:
  `lExtLo`/`lExtHi` (luma, [0,1]) + `cExtLo`/`cExtHi` (chroma, [0,1]
  fraction × `LUT_AB_RANGE`). Each EXTENDS the per-hue curve bound
  outward on its side; at max that side is a noop (= old toggle off).
  No floor/ceil checkboxes anymore.

### Step 1 (IDW) — `FS_LUT_BUILD`, per texel per L-slice

Single dispatch, **MRT** two outputs (the IDW loop runs once):
`o0` = step-1 core, `o1` = step-2 (preserve+envelope). The `gate`
scalar (1e) is computed once and applied to both.

- 1a. Pass 1: per-metric min `d²` (`dmin2L` luma, `dmin2H` colour) +
  nearest-by-hue `nearAB`. `d²` = `dot(lchComp(L,cab,s), w)` — barycentric
  L/C/H over (dL², dC², dH²), C/H from projection onto the anchor's hue axis.
- 1b. Pass 2: Shepard IDW on `d²/d_min²` per metric — luma uses `uWLuma`,
  chroma/hue uses `uWHue`. No Gaussian hue gate (dropped). Accumulate Lab+Chroma.
- 1c. Chroma-preserving rescale → `target`, coherence-modulated.
- gate. Safety net `hueGate` (rotate opposing→nearest palette hue, fade by
  chroma confidence) × `chromaGate` (near-grey desat).
- **o0 / step 1** = `lab.x` (IDW luma), `yz = dir·target·gate`. No
  preserve, no envelope.
- **o1 / step 2** = 1d `cPreserve` mix→identity Chroma (`finalMag`),
  `yz = dir·finalMag·gate`; 1f `lPreserve` mix→identity Luma; 1g
  envelope clamp (`lExtLo/Hi`, `cExtLo/Hi`) w/ soft skirts.

Captured intermediates feed the inline stage previews: `lutTexStep1`
(o0), `lutTexStep2` (o1 snapshot, top of `applyLateStages`), and the
final `lutTex` (step 3). The step-2 luma envelope (`lExtLo/Hi`) is RE-ASSERTED
late (`applyLEnvelopePass`, `FS_LUT_L_ENVELOPE`) after luma-look — luma-look /
blur can drift L back out of band. Same control, keyed on output hue; noop when
`lExt=1`.

### Shared late stages — `applyLateStages`

2. Anchor stamp.
3. Blur × `smoothness` iters (3 axes + restamp). `FS_LUT_BLUR`:
   chroma-preserving rescale + hue safety net; no
   `cPreserve`/`lPreserve` (build-stage only). `uBlurStrength` tapers
   1.0→0.3 across iters.
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
