// Procedural anime-style scene: sunset sky, cel-shaded mountains, cherry
// blossom branch, falling petals. Tests cel-shaded palettes (bold sakura
// pink, sky cyan, mountain violet) and how palettes handle high-saturation
// flat-shaded regions. No embedded assets — fully procedural, license-free.
function makeAnimeImage(){
  const W = 720, H = 460;
  const cv = document.createElement('canvas');
  cv.width = W; cv.height = H;
  const ctx = cv.getContext('2d');

  // Sky: deep sapphire top → cyan → sakura horizon
  const sky = ctx.createLinearGradient(0, 0, 0, H * 0.7);
  sky.addColorStop(0,    '#2c5aa0');
  sky.addColorStop(0.45, '#7fc6e0');
  sky.addColorStop(0.85, '#f4b4b8');
  sky.addColorStop(1.0,  '#f8c8b0');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, W, H * 0.7);

  // Big anime sun — soft white core, warm halo
  const sunX = W * 0.68, sunY = H * 0.48, sunR = 55;
  ctx.fillStyle = 'rgba(255,232,176,0.9)';
  ctx.beginPath(); ctx.arc(sunX, sunY, sunR + 14, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#fff6e0';
  ctx.beginPath(); ctx.arc(sunX, sunY, sunR, 0, Math.PI * 2); ctx.fill();

  // Round puffy clouds — overlapping discs in off-white
  function cloud(cx, cy, scale){
    ctx.fillStyle = '#fff8f2';
    const r = 22 * scale;
    const offsets = [[-30,2],[-12,-6],[8,-4],[26,2],[38,6]];
    for (const [dx, dy] of offsets){
      ctx.beginPath();
      ctx.arc(cx + dx * scale, cy + dy * scale, r * 0.9, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  cloud(W * 0.18, H * 0.18, 1.0);
  cloud(W * 0.44, H * 0.11, 0.7);
  cloud(W * 0.88, H * 0.30, 0.85);

  // Far mountain — soft violet silhouette
  ctx.fillStyle = '#7a6aa0';
  ctx.beginPath();
  ctx.moveTo(0, H * 0.62);
  ctx.lineTo(W * 0.15, H * 0.50);
  ctx.lineTo(W * 0.28, H * 0.56);
  ctx.lineTo(W * 0.45, H * 0.46);
  ctx.lineTo(W * 0.62, H * 0.55);
  ctx.lineTo(W * 0.85, H * 0.48);
  ctx.lineTo(W, H * 0.58);
  ctx.lineTo(W, H * 0.7);
  ctx.lineTo(0, H * 0.7);
  ctx.closePath();
  ctx.fill();

  // Near mountain — deeper indigo, sits in front of the far range
  ctx.fillStyle = '#3e2f5a';
  ctx.beginPath();
  ctx.moveTo(0, H * 0.7);
  ctx.lineTo(W * 0.22, H * 0.56);
  ctx.lineTo(W * 0.35, H * 0.63);
  ctx.lineTo(W * 0.55, H * 0.52);
  ctx.lineTo(W * 0.78, H * 0.62);
  ctx.lineTo(W, H * 0.66);
  ctx.lineTo(W, H * 0.72);
  ctx.lineTo(0, H * 0.72);
  ctx.closePath();
  ctx.fill();

  // Snow caps — small white triangles on the highest peaks
  ctx.fillStyle = '#f4eef4';
  ctx.beginPath();
  ctx.moveTo(W * 0.41, H * 0.49);
  ctx.lineTo(W * 0.45, H * 0.46);
  ctx.lineTo(W * 0.49, H * 0.49);
  ctx.closePath(); ctx.fill();
  ctx.beginPath();
  ctx.moveTo(W * 0.52, H * 0.55);
  ctx.lineTo(W * 0.55, H * 0.52);
  ctx.lineTo(W * 0.58, H * 0.55);
  ctx.closePath(); ctx.fill();

  // Foreground field — saturated cel-shaded green
  const ground = ctx.createLinearGradient(0, H * 0.72, 0, H);
  ground.addColorStop(0, '#7ec460');
  ground.addColorStop(1, '#3e7028');
  ctx.fillStyle = ground;
  ctx.fillRect(0, H * 0.72, W, H * 0.28);

  // Cherry blossom branch — curves in from upper-left corner
  ctx.strokeStyle = '#3a2820';
  ctx.lineCap = 'round';
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.moveTo(0, H * 0.05);
  ctx.bezierCurveTo(W * 0.15, H * 0.12, W * 0.28, H * 0.20, W * 0.42, H * 0.22);
  ctx.stroke();
  ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(W * 0.18, H * 0.15); ctx.lineTo(W * 0.22, H * 0.30); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(W * 0.34, H * 0.21); ctx.lineTo(W * 0.38, H * 0.34); ctx.stroke();

  // Blossom clusters — pink overlaid circles with white highlight
  function blossom(cx, cy, scale=1){
    const petals = [[0,0,11],[10,3,9],[-9,5,9],[3,-9,8],[-6,-6,7]];
    ctx.fillStyle = '#f8b6cf';
    for (const [dx,dy,r] of petals){
      ctx.beginPath(); ctx.arc(cx+dx*scale, cy+dy*scale, r*scale, 0, Math.PI*2); ctx.fill();
    }
    ctx.fillStyle = '#ffd8e4';
    ctx.beginPath(); ctx.arc(cx-2*scale, cy-3*scale, 3*scale, 0, Math.PI*2); ctx.fill();
  }
  blossom(W * 0.04, H * 0.08);
  blossom(W * 0.12, H * 0.14, 0.9);
  blossom(W * 0.22, H * 0.31, 0.85);
  blossom(W * 0.26, H * 0.18, 0.9);
  blossom(W * 0.36, H * 0.22, 0.95);
  blossom(W * 0.38, H * 0.34, 0.8);
  blossom(W * 0.42, H * 0.22, 0.85);

  // Falling petals — deterministic scatter (PRNG seed = constant)
  ctx.fillStyle = '#f5a8c4';
  let seed = 12345;
  for (let i = 0; i < 35; i++){
    seed = (seed * 1103515245 + 12345) >>> 0;
    const x = (seed >>> 0) % W;
    seed = (seed * 1103515245 + 12345) >>> 0;
    const y = ((seed >>> 0) % (H * 0.65)) | 0;
    ctx.beginPath(); ctx.arc(x, y, 2.5, 0, Math.PI*2); ctx.fill();
  }

  return cv;
}
