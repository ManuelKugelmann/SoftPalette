# Test images

The image-tab buttons in the UI load files from this folder. Drop the
following files in here so the buttons work:

| File                  | Tab button   | Source / notes |
| --------------------- | ------------ | -------------- |
| `kodim04.jpg`         | portrait     | Kodak Lossless True Color Image Suite (https://r0k.us/graphics/kodak/) — kodim04 (woman in red hat) |
| `kodim13.jpg`         | nature       | Kodak suite — kodim13 (alpine stream) |
| `kodim23.jpg`         | parrots      | Kodak suite — kodim23 (vivid macaws) |
| `starry-night.jpg`    | starry night | Van Gogh — *The Starry Night* (public domain). Wikimedia: https://commons.wikimedia.org/wiki/File:Van_Gogh_-_Starry_Night_-_Google_Art_Project.jpg |
| `portrait2.jpg`       | portrait 2   | Any second portrait test (your choice — skin tones, neutral background) |
| `anime2.jpg`          | anime 2      | A rights-free anime / cel-shaded illustration (Creative Commons or public domain) |
| `landscape2.jpg`      | landscape 2  | A second landscape test (kodim14 lakefront and kodim21 lighthouse-and-coast from the Kodak suite work well) |
| `groupshot.jpg`       | group shot   | Full-body shot with mixed-race subjects (your choice — varied skin tones, common color-grading test case) |
| `gamescreen.jpg`      | game shot    | A video-game screenshot (stylized / saturated palette test) |

Reasonable sizing: long edge around 720–1280 px keeps the LUT preview
snappy. The page loader downscales anything larger via `MAX_DIM`.

Notes:
- Anything dropped here is served by VS Code Live Server (or any other
  static server) at `/images/<file>`. The relative paths in
  `index.html` resolve same-origin, no CORS setup needed.
- We don't include the binary files in git history (they're not part of
  the codebase) — add a `.gitignore` rule if you want to keep them out
  of commits.
