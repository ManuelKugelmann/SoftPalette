// Procedural sunset landscape. Returns a 720x460 HTMLCanvasElement.
// Sky gradient (blue → magenta → orange → pale), sun glow, layered hill
// silhouettes from violet (distant) to near-black (foreground), pine
// silhouettes. Exercises the LUT pipeline across a wide hue range with
// smooth shading; good for spotting hue drift in dark zones.
function makeDefaultImage(){
  const W = 720, H = 460;
  const cv = document.createElement('canvas');
  cv.width = W; cv.height = H;
  const ctx = cv.getContext('2d');

  // Sky: deep blue → magenta → orange → pale yellow horizon
  const sky = ctx.createLinearGradient(0, 0, 0, H * 0.78);
  sky.addColorStop(0.00, '#162048');
  sky.addColorStop(0.35, '#5a3870');
  sky.addColorStop(0.65, '#c8684c');
  sky.addColorStop(0.90, '#e8a868');
  sky.addColorStop(1.00, '#f0d090');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, W, H);

  // Subtle horizontal hue drift (cooler left, warmer right) via overlay
  const drift = ctx.createLinearGradient(0, 0, W, 0);
  drift.addColorStop(0,   'rgba(40, 60, 140, 0.18)');
  drift.addColorStop(0.5, 'rgba(0, 0, 0, 0)');
  drift.addColorStop(1,   'rgba(220, 120, 60, 0.18)');
  ctx.fillStyle = drift;
  ctx.fillRect(0, 0, W, H * 0.78);

  // Sun
  const sx = W * 0.70, sy = H * 0.56;
  const sun = ctx.createRadialGradient(sx, sy, 3, sx, sy, 110);
  sun.addColorStop(0.00, '#fff8dc');
  sun.addColorStop(0.20, '#ffd878');
  sun.addColorStop(0.55, 'rgba(255, 170, 90, 0.35)');
  sun.addColorStop(1.00, 'rgba(255, 140, 80, 0)');
  ctx.fillStyle = sun;
  ctx.fillRect(0, 0, W, H);

  // Distant mountains (cool magenta-purple)
  ctx.fillStyle = '#3e2e58';
  ctx.beginPath();
  ctx.moveTo(0, H * 0.70);
  ctx.bezierCurveTo(W * 0.20, H * 0.60, W * 0.42, H * 0.72, W * 0.58, H * 0.64);
  ctx.bezierCurveTo(W * 0.74, H * 0.58, W * 0.88, H * 0.70, W, H * 0.66);
  ctx.lineTo(W, H); ctx.lineTo(0, H); ctx.closePath(); ctx.fill();

  // Mid hills (deeper, cooler)
  ctx.fillStyle = '#221e3c';
  ctx.beginPath();
  ctx.moveTo(0, H * 0.82);
  ctx.bezierCurveTo(W * 0.28, H * 0.74, W * 0.50, H * 0.86, W * 0.72, H * 0.78);
  ctx.bezierCurveTo(W * 0.86, H * 0.74, W * 0.95, H * 0.82, W, H * 0.80);
  ctx.lineTo(W, H); ctx.lineTo(0, H); ctx.closePath(); ctx.fill();

  // Foreground hill (near-black, low chroma)
  ctx.fillStyle = '#0c0e1a';
  ctx.beginPath();
  ctx.moveTo(0, H * 0.92);
  ctx.bezierCurveTo(W * 0.40, H * 0.86, W * 0.70, H * 0.95, W, H * 0.90);
  ctx.lineTo(W, H); ctx.lineTo(0, H); ctx.closePath(); ctx.fill();

  // Tree silhouettes (triangle pines)
  ctx.fillStyle = '#06080f';
  const trees = [
    [80, 22, 56], [140, 16, 38], [240, 26, 70], [330, 18, 44],
    [420, 30, 78], [510, 20, 50], [600, 24, 62], [670, 14, 34],
  ];
  for (const [x, w, th] of trees){
    const baseY = H * 0.91;
    ctx.beginPath();
    ctx.moveTo(x, baseY - th);
    ctx.lineTo(x - w/2, baseY);
    ctx.lineTo(x + w/2, baseY);
    ctx.closePath();
    ctx.fill();
  }

  return cv;
}
