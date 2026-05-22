// Procedural photo-style image: still-life with fruit on a wooden surface.
// Designed to exercise the LUT pipeline well — wide hue range (red/orange/
// yellow/green), varied lightness, near-grays in specular highlights, and
// deep shadow tones. Smooth shading, not flat color blocks.
function makePhotoImage(){
  const W = 720, H = 460;
  const cv = document.createElement('canvas');
  cv.width = W; cv.height = H;
  const ctx = cv.getContext('2d');

  // Background wall: warm beige with subtle vertical light gradient
  const wall = ctx.createLinearGradient(0, 0, 0, H * 0.62);
  wall.addColorStop(0.00, '#5a4838');
  wall.addColorStop(0.55, '#8a7058');
  wall.addColorStop(1.00, '#a8866a');
  ctx.fillStyle = wall;
  ctx.fillRect(0, 0, W, H * 0.62);

  // Wooden table surface: warm orange-brown, perspective-stretched gradient
  const table = ctx.createLinearGradient(0, H * 0.58, 0, H);
  table.addColorStop(0.00, '#6e4a2c');
  table.addColorStop(0.50, '#8c5a32');
  table.addColorStop(1.00, '#5e3a1e');
  ctx.fillStyle = table;
  ctx.fillRect(0, H * 0.58, W, H * 0.42);

  // Wood grain stripes (subtle dark variations)
  ctx.save();
  ctx.globalAlpha = 0.18;
  for (let i = 0; i < 14; i++){
    const y = H * 0.58 + (i / 14) * H * 0.42 + Math.sin(i * 1.7) * 4;
    ctx.fillStyle = i % 2 === 0 ? '#3e2818' : '#9a6a44';
    ctx.fillRect(0, y, W, 2 + Math.sin(i) * 1);
  }
  ctx.restore();

  // Soft ambient occlusion at wall/table junction
  const ao = ctx.createLinearGradient(0, H * 0.55, 0, H * 0.66);
  ao.addColorStop(0.00, 'rgba(0,0,0,0)');
  ao.addColorStop(0.50, 'rgba(0,0,0,0.35)');
  ao.addColorStop(1.00, 'rgba(0,0,0,0)');
  ctx.fillStyle = ao;
  ctx.fillRect(0, H * 0.55, W, H * 0.11);

  // Fruit: 3 round objects with smooth shading and specular highlights.
  // Shadow is drawn BEFORE the sphere body so the fruit sits on top of its
  // contact shadow rather than getting its bottom half painted over by it.
  function drawSphere(cx, cy, r, hueRGB, highlight){
    // Soft contact shadow — painted on the table first
    ctx.save();
    const shGrad = ctx.createRadialGradient(cx, cy + r*0.95, r*0.2, cx, cy + r*0.95, r*1.4);
    shGrad.addColorStop(0.00, 'rgba(0,0,0,0.45)');
    shGrad.addColorStop(1.00, 'rgba(0,0,0,0)');
    ctx.fillStyle = shGrad;
    ctx.beginPath();
    ctx.ellipse(cx, cy + r*0.95, r*1.3, r*0.35, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Sphere body on top of the shadow.
    // hueRGB = [base, mid, shadow] dark→light triplet; highlight = specular.
    const grad = ctx.createRadialGradient(cx - r*0.35, cy - r*0.45, r*0.05, cx, cy, r);
    grad.addColorStop(0.00, highlight);
    grad.addColorStop(0.20, hueRGB[2]);
    grad.addColorStop(0.55, hueRGB[1]);
    grad.addColorStop(1.00, hueRGB[0]);
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();
  }

  // Red apple (left) — deep red body, white-pink highlight
  drawSphere(W * 0.27, H * 0.66, 86,
    ['#3e0e0e', '#7a1a14', '#b8281c'],
    '#f8d8c8'
  );
  // Stem
  ctx.fillStyle = '#3a2818';
  ctx.fillRect(W * 0.27 - 2, H * 0.66 - 90, 4, 12);

  // Green apple (center) — yellow-green body, white-yellow highlight
  drawSphere(W * 0.51, H * 0.70, 80,
    ['#2a3a14', '#6a7a28', '#a8b840'],
    '#f4f0c0'
  );
  ctx.fillStyle = '#3a2818';
  ctx.fillRect(W * 0.51 - 2, H * 0.70 - 84, 4, 11);

  // Orange (right) — orange body, yellow highlight
  drawSphere(W * 0.74, H * 0.68, 78,
    ['#6a2a08', '#c8541a', '#f08030'],
    '#fff0b0'
  );
  // Orange has stippled texture — small dark dots
  ctx.save();
  ctx.fillStyle = 'rgba(80, 40, 10, 0.4)';
  for (let i = 0; i < 50; i++){
    const ang = i * 2.4;
    const dist = 18 + (i % 7) * 9;
    const x = W * 0.74 + Math.cos(ang) * dist;
    const y = H * 0.68 + Math.sin(ang) * dist - 4;
    ctx.beginPath();
    ctx.arc(x, y, 1.2, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();

  // Vignette (mild) — pulls eye to center
  const vig = ctx.createRadialGradient(W/2, H/2, H*0.35, W/2, H/2, H*0.85);
  vig.addColorStop(0.00, 'rgba(0,0,0,0)');
  vig.addColorStop(1.00, 'rgba(0,0,0,0.45)');
  ctx.fillStyle = vig;
  ctx.fillRect(0, 0, W, H);

  return cv;
}
