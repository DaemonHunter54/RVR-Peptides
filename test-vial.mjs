import { createCanvas, loadImage, GlobalFonts } from '@napi-rs/canvas';
import fs from 'fs';

// Register Inter font
const fontPath = '/usr/share/fonts/truetype/inter/InterVariable.ttf';
if (fs.existsSync(fontPath)) {
  GlobalFonts.registerFromPath(fontPath, 'Inter');
}

const width = 600;
const height = 800;
const canvas = createCanvas(width, height);
const ctx = canvas.getContext('2d');

// Clear
ctx.clearRect(0, 0, width, height);

// Draw vial body
const vialX = width * 0.2;
const vialWidth = width * 0.6;
const vialTop = height * 0.15;
const vialBottom = height * 0.88;
const vialHeight = vialBottom - vialTop;
const cornerRadius = 12;

const glassGradient = ctx.createLinearGradient(vialX, 0, vialX + vialWidth, 0);
glassGradient.addColorStop(0, '#e8e8e8');
glassGradient.addColorStop(0.3, '#ffffff');
glassGradient.addColorStop(0.7, '#f0f0f0');
glassGradient.addColorStop(1, '#d0d0d0');

ctx.beginPath();
ctx.roundRect(vialX, vialTop, vialWidth, vialHeight, cornerRadius);
ctx.fillStyle = glassGradient;
ctx.fill();

// Cap
const capHeight = height * 0.12;
const capWidth = vialWidth * 0.55;
const capX = vialX + (vialWidth - capWidth) / 2;
const capY = vialTop - capHeight + 10;
const capGradient = ctx.createLinearGradient(capX, 0, capX + capWidth, 0);
capGradient.addColorStop(0, '#a0a0a0');
capGradient.addColorStop(0.5, '#e0e0e0');
capGradient.addColorStop(1, '#909090');
ctx.beginPath();
ctx.roundRect(capX, capY, capWidth, capHeight, [6, 6, 0, 0]);
ctx.fillStyle = capGradient;
ctx.fill();

// Label
const labelPadding = 15;
const labelX = vialX + labelPadding;
const labelWidth2 = vialWidth - labelPadding * 2;
const labelTop = vialTop + vialHeight * 0.18;
const labelBottom = vialBottom - vialHeight * 0.08;
const labelHeight = labelBottom - labelTop;
ctx.beginPath();
ctx.roundRect(labelX, labelTop, labelWidth2, labelHeight, 6);
ctx.fillStyle = '#1a1a2e';
ctx.fill();

const centerX = labelX + labelWidth2 / 2;

// Logo
try {
  const logoImg = await loadImage('/home/ubuntu/webdev-static-assets/rvr-logo.png');
  const logoW = labelWidth2 * 0.45;
  const logoH = (logoW / logoImg.width) * logoImg.height;
  ctx.drawImage(logoImg, centerX - logoW / 2, labelTop + labelHeight * 0.04, logoW, logoH);
} catch(e) {
  console.log('Logo load error:', e.message);
}

// Text
ctx.fillStyle = '#cccccc';
ctx.font = '600 14px Inter, sans-serif';
ctx.textAlign = 'center';
ctx.fillText('RIVER VALLEY RESEARCH', centerX, labelTop + labelHeight * 0.25);

ctx.fillStyle = '#ffffff';
ctx.font = 'bold 42px Inter, sans-serif';
ctx.fillText('BPC-157', centerX, labelTop + labelHeight * 0.47);

ctx.font = 'bold 30px Inter, sans-serif';
ctx.fillText('5MG', centerX, labelTop + labelHeight * 0.57);

// Accent strip
const stripY = labelTop + labelHeight * 0.72;
ctx.beginPath();
ctx.roundRect(centerX - labelWidth2 * 0.35, stripY, labelWidth2 * 0.7, 4, 2);
ctx.fillStyle = '#C9A961';
ctx.fill();

// Research Use Only
ctx.fillStyle = '#999999';
ctx.font = '500 13px Inter, sans-serif';
ctx.fillText('Research Use Only', centerX, labelTop + labelHeight * 0.9);

// Outline
ctx.beginPath();
ctx.roundRect(vialX, vialTop, vialWidth, vialHeight, cornerRadius);
ctx.strokeStyle = 'rgba(0, 0, 0, 0.15)';
ctx.lineWidth = 1.5;
ctx.stroke();

const buffer = canvas.toBuffer('image/png');
fs.writeFileSync('/home/ubuntu/test-vial-output.png', buffer);
console.log('Vial generated! Size:', buffer.length, 'bytes');
