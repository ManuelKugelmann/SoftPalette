# Test images

The image-tab buttons in the UI load files from this folder. Drop the
following files in here so the buttons work:

| File                  | Tab button   | Status | Source / notes |
| --------------------- | ------------ | ------ | -------------- |
| `portrait.jpg`        | portrait     | ✓ in repo | Gonzalo Bazgan at Wikiconference 2026 (© Ezarate) — Wikimedia Commons, CC-BY 4.0. Modern male portrait; plain navy tee, soft colourful painterly backdrop, no brand merch. |
| `kodim13.png`         | nature       | ✓ in repo | Kodak suite (https://r0k.us/graphics/kodak/) — kodim13 (alpine stream) |
| `kodim23.png`         | parrots      | ✓ in repo | Kodak suite — kodim23 (vivid macaws) |
| `groupshot.jpg`       | colorful     | ✓ in repo | Lathmar Holi 2022 in Nandgaon, Uttar Pradesh — Wikimedia Commons (featured picture). Festival crowd with vivid color powders — strong chroma + full hue circle, hard LUT test. Sits next to parrots as the colorful example. |
| `starry-night.jpg`    | starry night | ✓ in repo | Van Gogh — *The Starry Night* (public domain). Wikimedia: File:Van_Gogh_-_Starry_Night_-_Google_Art_Project.jpg |
| `wave.jpg`            | the wave     | ✓ in repo | Hokusai — *The Great Wave off Kanagawa* (public domain). Wikimedia: File:Tsunami_by_hokusai_19th_century.jpg. Prussian-blue woodblock. |
| `monalisa.jpg`        | mona lisa    | ✓ in repo | Leonardo da Vinci — *Mona Lisa* (public domain). Wikimedia: File:Mona_Lisa,_by_Leonardo_da_Vinci,_from_C2RMF_retouched.jpg. Muted earth tones, sfumato. |
| `candid.jpg`          | candid       | ✓ in repo | Riddhi Sharma at the Jaipur Literature Festival 2026 — Wikimedia Commons (CC-BY). Modern portrait of a person of colour; warm tones, colourful bokeh. |
| `manga.png`           | manga        | ✓ in repo | *Wikipe-tan* (full length) — Wikipedia's anime mascot, Wikimedia Commons (CC-BY-SA). Flattened onto white. Flat anime shading, blue/navy/white. |
| `lake.jpg`            | lake         | ✓ in repo | Llao Llao Peninsula, Argentina — Wikimedia Commons (featured picture). Turquoise lake, green forest, blue mountains — broad hue + tonal range. |
| `crowd.jpg`           | crowd        | ✓ in repo | Kumbh Mela 2019, Prayagraj (Mauni Amavasya) — Wikimedia Commons. Dense pilgrimage crowd; varied skin tones + vivid clothing across the full hue circle. |
| `strategy.png`        | strategy     | ✓ in repo | 0 A.D. — Romans gameplay screenshot from Wikimedia Commons (CC-BY-SA). Real-time strategy; saturated game palette with terrain greens, unit colors, and atmospheric sky. |
| `shooter.jpg`         | shooter      | ✓ in repo | Xonotic 0.8.2 FPS screenshot — Wikimedia Commons (CC). Sci-fi blues + metal, orange explosion, HUD — saturated, stylized. |

Reasonable sizing: long edge around 720–1280 px keeps the LUT preview
snappy. The page loader downscales anything larger via `MAX_DIM`.

Notes:
- Anything dropped here is served by VS Code Live Server (or any other
  static server) at `/images/<file>`. The relative paths in
  `index.html` resolve same-origin, no CORS setup needed.
- We don't include the binary files in git history (they're not part of
  the codebase) — add a `.gitignore` rule if you want to keep them out
  of commits.
