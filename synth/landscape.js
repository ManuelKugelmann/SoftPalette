// Stylized landscape: layered atmospheric depth — sky gradient, distant
// blue-haze mountains, mid-ground forested hills, foreground field with grass
// suggestion. Heavy in greens (hard for many palettes — Quake has none) and
// blues (atmospheric). Tests how palettes handle missing hues + tonal depth.
function makeLandscapeImage(){
  const W = 720, H = 460;
  const cv = document.createElement('canvas');
  cv.width = W; cv.height = H;
  const ctx = cv.getContext('2d');

  // Sky: cool blue at zenith → pale yellow-green at horizon (haze)
  const sky = ctx.createLinearGradient(0, 0, 0, H * 0.55);
  sky.addColorStop(0.00, '#3a5878');
  sky.addColorStop(0.50, '#7898b0');
  sky.addColorStop(0.85, '#c8c8a8');
  sky.addColorStop(1.00, '#d8d090');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, W, H * 0.55);

  // Sun glow (warm wash low on horizon, off-center)
  const sx = W * 0.62, sy = H * 0.50;
  const glow = ctx.createRadialGradient(sx, sy, 5, sx, sy, 200);
  glow.addColorStop(0.00, 'rgba(255, 240, 180, 0.55)');
  glow.addColorStop(0.40, 'rgba(255, 200, 130, 0.20)');
  glow.addColorStop(1.00, 'rgba(255, 180, 110, 0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, W, H * 0.65);

  // Far mountains (very desaturated cool blue — atmospheric perspective)
  ctx.fillStyle = '#7888a0';
  ctx.beginPath();
  ctx.moveTo(0, H * 0.50);
  ctx.bezierCurveTo(W*0.12, H*0.43, W*0.22, H*0.48, W*0.32, H*0.45);
  ctx.bezierCurveTo(W*0.45, H*0.40, W*0.55, H*0.47, W*0.65, H*0.43);
  ctx.bezierCurveTo(W*0.78, H*0.39, W*0.88, H*0.46, W, H*0.44);
  ctx.lineTo(W, H*0.55); ctx.lineTo(0, H*0.55);
  ctx.closePath();
  ctx.fill();

  // Mid mountains (darker, more chromatic blue-green)
  ctx.fillStyle = '#5a7268';
  ctx.beginPath();
  ctx.moveTo(0, H * 0.58);
  ctx.bezierCurveTo(W*0.18, H*0.50, W*0.32, H*0.56, W*0.48, H*0.52);
  ctx.bezierCurveTo(W*0.62, H*0.48, W*0.78, H*0.55, W, H*0.51);
  ctx.lineTo(W, H*0.62); ctx.lineTo(0, H*0.62);
  ctx.closePath();
  ctx.fill();

  // Forested hill (mid-distance — saturated teal-green with gradient)
  const hillGrad = ctx.createLinearGradient(0, H*0.58, 0, H*0.78);
  hillGrad.addColorStop(0.00, '#3e6852');
  hillGrad.addColorStop(1.00, '#2a4838');
  ctx.fillStyle = hillGrad;
  ctx.beginPath();
  ctx.moveTo(0, H * 0.68);
  ctx.bezierCurveTo(W*0.22, H*0.60, W*0.42, H*0.66, W*0.58, H*0.62);
  ctx.bezierCurveTo(W*0.74, H*0.58, W*0.88, H*0.66, W, H*0.64);
  ctx.lineTo(W, H*0.78); ctx.lineTo(0, H*0.78);
  ctx.closePath();
  ctx.fill();

  // Tree silhouettes on forested hill
  ctx.fillStyle = '#1c2e22';
  function tree(x, y, h){
    const w = h * 0.35;
    ctx.beginPath();
    ctx.moveTo(x, y - h);
    ctx.lineTo(x - w/2, y);
    ctx.lineTo(x + w/2, y);
    ctx.closePath();
    ctx.fill();
  }
  for (let i = 0; i < 30; i++){
    const x = (i / 30) * W + (Math.sin(i*7.3) * 8);
    const baseY = H * 0.68 + Math.sin(i * 0.7) * 6;
    const h = 14 + (i % 5) * 4;
    tree(x, baseY, h);
  }

  // Foreground field (warm yellow-green grass with depth gradient)
  const fieldGrad = ctx.createLinearGradient(0, H*0.72, 0, H);
  fieldGrad.addColorStop(0.00, '#7c8c3c');
  fieldGrad.addColorStop(0.45, '#9aa54a');
  fieldGrad.addColorStop(1.00, '#5a6428');
  ctx.fillStyle = fieldGrad;
  ctx.beginPath();
  ctx.moveTo(0, H * 0.78);
  ctx.bezierCurveTo(W*0.30, H*0.74, W*0.60, H*0.80, W, H*0.76);
  ctx.lineTo(W, H); ctx.lineTo(0, H);
  ctx.closePath();
  ctx.fill();

  // Grass tufts (subtle scattered dark dashes)
  ctx.save();
  ctx.strokeStyle = 'rgba(40, 50, 20, 0.35)';
  ctx.lineWidth = 1;
  for (let i = 0; i < 220; i++){
    const x = (i * 137.5) % W;
    const y = H * 0.80 + ((i * 67) % Math.floor(H * 0.18));
    const len = 3 + (i % 5);
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + 1, y - len);
    ctx.stroke();
  }
  ctx.restore();

  // Wildflower hints — small warm dots scattered in foreground
  ctx.save();
  for (let i = 0; i < 40; i++){
    const x = (i * 233.7) % W;
    const y = H * 0.82 + ((i * 113) % Math.floor(H * 0.16));
    const hue = (i % 3 === 0) ? '#e8c860' : (i % 3 === 1) ? '#d86040' : '#e8e8d8';
    ctx.fillStyle = hue;
    ctx.beginPath();
    ctx.arc(x, y, 1.5, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();

  // Soft vignette
  const vig = ctx.createRadialGradient(W/2, H*0.55, H*0.45, W/2, H*0.55, H*1.0);
  vig.addColorStop(0.00, 'rgba(0,0,0,0)');
  vig.addColorStop(1.00, 'rgba(0,0,0,0.40)');
  ctx.fillStyle = vig;
  ctx.fillRect(0, 0, W, H);

  return cv;
}
