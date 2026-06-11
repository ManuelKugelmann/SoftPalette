# SoftPalette — Claude conventions

## Style

Telegram. Fragments, no preambles, no recap, no apologies. Drop articles.
Results > narration. Same in this file.

## Build timestamp

Auto-bumped by `.githooks/pre-commit` (`scripts/sync-build-timestamp.sh`) +
server fallback `.github/workflows/sync-build-timestamp.yml`. Don't edit the
literals. Install hook: `git config core.hooksPath .githooks`.

## Git

Work on `main`; commit + push there. The pre-commit hook bumps the timestamp,
so `git pull --rebase` after a commit usually hits a 1-line `index.html`
conflict (timestamp, + CRLF under `core.autocrlf`). Resolve:
`git checkout --theirs -- index.html && sed -i 's/\r$//' index.html && git add
index.html && GIT_EDITOR=true git rebase --continue`, then push. `PostToolUse`
hook emits a `githack` URL after push.

## Algorithm

Soft 3D Voronoi LUT in OkLab. ONE build method (IDW Shepard) + shared late
stages. OkLab: Luma=`lab.x`, Chroma=`length(lab.yz)`, Hue=`atan2(lab.z,lab.y)`;
Chroma absolute, not Saturation. "anchor" = palette seed (real OR synthetic —
treated identically everywhere). "LUT texel" = N³ cell at (L,a,b).

**Steps.** step1 = interpolate anchors; step2 = restore L/C ramps under
envelope; step3 = effects. Params stay in their step.
**Global tier** (top UI, own separators): `lutSize` + `hueGate` + `chromaGate`.

### Build — `FS_LUT_BUILD`, per texel per L-slice, MRT

Single dispatch, two outputs: `o0` = step1 core, `o1` = step2 (+preserve
+envelope). Two **barycentric L/C/H** anchor-distance metrics via `lchComp`
(dL², dC², dH² — C/H from PROJECTION onto the anchor's hue axis, no atan →
stable at grey):
- `uWLuma` (WEIGHTING triangle) drives the LUMA blend; `uWHue` (DECOUPLING
  triangle) drives the CHROMA/HUE blend. Pin separation = luma↔colour
  decoupling (lean `wHue`→L for a luma-look-style L→hue coupling). Each
  `[wL,wC,wH]` sums to 1, clamped ≥0.06 (tinted border in the triangle widget);
  default centroid.
- Pass 1: per-metric `dmin2L`/`dmin2H` + nearest-by-hue `nearAB`. Pass 2:
  Shepard IDW on `d²/dmin²` per metric; chroma-preserving rescale (coherence).
- `gate` = `hueGate` (rotate a confidently-opposing hue → nearest palette hue,
  faded off near grey by a chroma-confidence ramp → no pinwheel) × `chromaGate`
  (near-grey desat; **1 = relaxed/keep chroma**, 0 = full desat). Soft smoothsteps.
- `o0` = IDW luma + `dir·target·gate` (no preserve/envelope). `o1` = +
  `cPreserve`/`lPreserve` mix→identity + envelope clamp.

`softness` = Shepard power, UI [1,8] (inverted: shown = 11−exp). `lPreserve` /
`cPreserve` = texel→identity blend (o1, coherence-gated; 0=snap, 1=passthrough).

### Envelope — `computeHueLCCurve` → `uHueLCCurve` (32-bin hue→Llo,Lhi,Clo,Chi)

Per-hue palette L/C band, from ALL anchors. SMOOTH and contains every anchor:
log-sum-exp soft band → ×12 circular blur along hue → **metaball** Gaussian
re-inclusion bumps (each anchor adds a bump sized to its deficit so the band
reaches it, staying smooth) → ceil≥floor guard (collapse to mean if inverted).
Achromatic anchors (black/white/grey, `C < 0.25·C_REF`) are included RING-WIDE
(bound L at every hue, flat); chromatic ones locally. Chroma ceil keeps a hard
local inclusion.
Clamp (o1 1g): dual-thumb **extension** `lExtLo/Hi`, `cExtLo/Hi` EXTEND the band
outward (1 = noop/relaxed, 0 = clamp at curve). Luma clamp = order-preserving
COMPRESSION skirt (below-floor stays below floor — no overbrighten; input-L
ordering preserved). Looked up by **output** hue (stable near grey). Re-asserted
late (`applyLEnvelopePass`, `FS_LUT_L_ENVELOPE`).

### Late stages — `applyLateStages`

Capture `lutTexStep2` (o1) → **monotonic-L pass on the step1 & step2 snapshots**
(`makeColumnMonotonic`/`applyLumaOrderPass`) → anchor stamp → blur × `smoothness`
(`FS_LUT_BLUR`: chroma-preserving + hue net, taper 1→0.3) → reach desat
(`applyReachPass`) → luma-look (`applyLumaLookPass`) → final monotonic-L → soft
closing stamp (`stampStrength`). Final blend = `lutStrength`.
**Luma-look is RETIRED**: slider hidden, default 0 → the pass is a no-op (pass +
`computeLumaCurve` + `lutTexRaw` kept). Modellable via `wHue`→L instead.

### Previews / debug

3 inline stage strips render the EXACT per-pixel shader vs `lutTexStep1/2`,
`lutTex` (no CPU re-derivation). `step2cPreview` = a **chroma-ramp** source
(hue×chroma at fixed L) through step2; also a `chroma` test-image button. LUT
slice = a/b plane at `lutSliceL`. `lutStage` (1/2/3) drives the test image
(def 2). Envelope overlays (`debugEnvVizL`/`C`): blue floor / red ceil curves
(pale base + saturated effective) on the step2 (luma) and chroma previews — NOT
the slice. Markers show all build seeds.

## Static checks — `scripts/check.mjs`

Dep-free Node: inline-`<script>` syntax, `images/<file>` refs, `data-preset` ↔
`PRESETS`, `bindImageBtn` wiring. Pre-commit runs + blocks on fail.

## Headless — Chrome + SwiftShader

SwiftShader exposes `EXT_color_buffer_float` → full LUT pipeline runs. Run GPU
code yourself before declaring done. Use a private `--user-data-dir` (else it
attaches to a running Chrome); `Start-Process -Wait -RedirectStandardOutput` is
reliable.

```powershell
& $chrome --headless=new --enable-unsafe-swiftshader --use-angle=swiftshader `
  --no-sandbox --user-data-dir=$env:TEMP\sp_prof --virtual-time-budget=12000 `
  --dump-dom file:///C:/Projects/SoftPalette/index.html > dom.html 2> err.txt
```

Verify via **stderr** (clean = 0 of `shader`/`compile`/`Uncaught`/`TypeError`/
`ReferenceError`; benign `usb_service`/`gcm` noise aside) **+ a `--screenshot`**.
(The old on-page `#lutStatus` build-status line was removed — don't rely on it;
`state.lutBuildMs` / `validateAnchorNeighbours` still exist if a probe is needed.)
**A/B**: full-window pixel diff of two temp copies with a flipped `state.params`
default — sub-crops often hit only the dark background and read 0.
