# Test images

The image-tab buttons in the UI load files from this folder. Drop the
following files in here so the buttons work:

| File                  | Tab button   | Status | Source / notes |
| --------------------- | ------------ | ------ | -------------- |
| `kodim04.png`         | portrait     | ✓ in repo | Kodak Lossless True Color Image Suite (https://r0k.us/graphics/kodak/) — kodim04 (woman in red hat) |
| `kodim13.png`         | nature       | ✓ in repo | Kodak suite — kodim13 (alpine stream) |
| `kodim23.png`         | parrots      | ✓ in repo | Kodak suite — kodim23 (vivid macaws) |
| `starry-night.jpg`    | starry night | ✓ in repo | Van Gogh — *The Starry Night* (public domain). Wikimedia: https://commons.wikimedia.org/wiki/File:Van_Gogh_-_Starry_Night_-_Google_Art_Project.jpg |
| `portrait2.png`       | portrait 2   | ✓ in repo (kodim15) | Kodak suite — kodim15 (woman by stairs). Swap for any other portrait if you want |
| `landscape2.png`      | landscape 2  | ✓ in repo (kodim21) | Kodak suite — kodim21 (lighthouse + sailboats) |
| `anime2.png`          | anime 2      | ✓ in repo | *Brendo magical girl* — Wikimedia Commons, CC-licensed anime-style illustration |
| `groupshot.jpg`       | group shot   | ✓ in repo | Lathmar Holi 2022 in Nandgaon, Uttar Pradesh — Wikimedia Commons (featured picture). Festival crowd with vivid color powders — strong chroma + diverse skin tones, hard LUT test. |
| `gamescreen.png`      | game shot    | ✓ in repo | 0 A.D. — Romans gameplay screenshot from Wikimedia Commons (CC-BY-SA). Saturated game palette with terrain greens, unit colors, and atmospheric sky. |

Reasonable sizing: long edge around 720–1280 px keeps the LUT preview
snappy. The page loader downscales anything larger via `MAX_DIM`.

Notes:
- Anything dropped here is served by VS Code Live Server (or any other
  static server) at `/images/<file>`. The relative paths in
  `index.html` resolve same-origin, no CORS setup needed.
- We don't include the binary files in git history (they're not part of
  the codebase) — add a `.gitignore` rule if you want to keep them out
  of commits.
