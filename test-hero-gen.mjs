import { createCanvas, GlobalFonts } from '@napi-rs/canvas';
import fs from 'fs';

const fontPath = '/usr/share/fonts/truetype/inter/InterVariable.ttf';
if (fs.existsSync(fontPath)) {
  GlobalFonts.registerFromPath(fontPath, 'Inter');
}

const ACCENT_COLORS = ['#C9A961','#4ECDC4','#FF6B6B','#45B7D1','#96CEB4','#DDA0DD','#F39C12','#1ABC9C','#E74C3C','#9B59B6'];

function getAccentColor(name) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) { hash = ((hash << 5) - hash) + name.charCodeAt(i); hash |= 0; }
  return ACCENT_COLORS[Math.abs(hash) % ACCENT_COLORS.length];
}

function drawVial(ctx, centerX, offsetY, scale, productName, dosage) {
  const accentColor = getAccentColor(productName);
  const vialWidth = 220 * scale;
  const vialTop = offsetY + 80 * scale;
  const vialBottom = offsetY + 620 * scale;
  const vialHeight = vialBottom - vialTop;
  const bodyLeft = centerX - vialWidth / 2;
  const bodyRight = centerX + vialWidth / 2;

  // Glass body
  const glassGrad = ctx.createLinearGradient(bodyLeft, 0, bodyRight, 0);
  glassGrad.addColorStop(0, '#a8a8a8');
  glassGrad.addColorStop(0.06, '#c0c0c0');
  glassGrad.addColorStop(0.15, '#dcdcdc');
  glassGrad.addColorStop(0.3, '#eeeeee');
  glassGrad.addColorStop(0.45, '#f5f5f5');
  glassGrad.addColorStop(0.55, '#f8f8f8');
  glassGrad.addColorStop(0.7, '#f0f0f0');
  glassGrad.addColorStop(0.85, '#d8d8d8');
  glassGrad.addColorStop(0.94, '#b8b8b8');
  glassGrad.addColorStop(1, '#a0a0a0');
  ctx.beginPath();
  ctx.moveTo(bodyLeft, vialTop);
  ctx.lineTo(bodyLeft, vialBottom - 30 * scale);
  ctx.quadraticCurveTo(bodyLeft, vialBottom, bodyLeft + 30 * scale, vialBottom);
  ctx.lineTo(bodyRight - 30 * scale, vialBottom);
  ctx.quadraticCurveTo(bodyRight, vialBottom, bodyRight, vialBottom - 30 * scale);
  ctx.lineTo(bodyRight, vialTop);
  ctx.closePath();
  ctx.fillStyle = glassGrad;
  ctx.fill();
  ctx.strokeStyle = 'rgba(0,0,0,0.1)';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Glass highlights
  ctx.beginPath();
  ctx.rect(bodyLeft + 8 * scale, vialTop + 20 * scale, 5 * scale, vialHeight - 60 * scale);
  ctx.fillStyle = 'rgba(255,255,255,0.6)';
  ctx.fill();
  ctx.beginPath();
  ctx.rect(bodyLeft + 16 * scale, vialTop + 40 * scale, 3 * scale, vialHeight - 100 * scale);
  ctx.fillStyle = 'rgba(255,255,255,0.3)';
  ctx.fill();

  // Neck
  const neckWidth = vialWidth * 0.38;
  const neckHeight = 30 * scale;
  const neckLeft = centerX - neckWidth / 2;
  const neckTop = vialTop - neckHeight;
  const neckGrad = ctx.createLinearGradient(neckLeft, 0, neckLeft + neckWidth, 0);
  neckGrad.addColorStop(0, '#b0b0b0');
  neckGrad.addColorStop(0.3, '#d8d8d8');
  neckGrad.addColorStop(0.5, '#e8e8e8');
  neckGrad.addColorStop(0.7, '#d0d0d0');
  neckGrad.addColorStop(1, '#a0a0a0');
  ctx.beginPath();
  ctx.moveTo(bodyLeft + 20 * scale, vialTop);
  ctx.lineTo(neckLeft, neckTop + 10 * scale);
  ctx.lineTo(neckLeft, neckTop);
  ctx.lineTo(neckLeft + neckWidth, neckTop);
  ctx.lineTo(neckLeft + neckWidth, neckTop + 10 * scale);
  ctx.lineTo(bodyRight - 20 * scale, vialTop);
  ctx.closePath();
  ctx.fillStyle = neckGrad;
  ctx.fill();

  // Cap
  const capWidth = neckWidth + 12 * scale;
  const capHeight = 55 * scale;
  const capLeft = centerX - capWidth / 2;
  const capTop = neckTop - capHeight + 6 * scale;
  const capGrad = ctx.createLinearGradient(capLeft, 0, capLeft + capWidth, 0);
  capGrad.addColorStop(0, '#606060');
  capGrad.addColorStop(0.12, '#909090');
  capGrad.addColorStop(0.25, '#b8b8b8');
  capGrad.addColorStop(0.4, '#d0d0d0');
  capGrad.addColorStop(0.55, '#d8d8d8');
  capGrad.addColorStop(0.7, '#c8c8c8');
  capGrad.addColorStop(0.85, '#a0a0a0');
  capGrad.addColorStop(1, '#686868');
  ctx.beginPath();
  ctx.roundRect(capLeft, capTop, capWidth, capHeight, [8 * scale, 8 * scale, 2, 2]);
  ctx.fillStyle = capGrad;
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(centerX, capTop + 5 * scale, capWidth / 2 - 3 * scale, 7 * scale, 0, 0, Math.PI * 2);
  ctx.fillStyle = '#b0b0b0';
  ctx.fill();
  // Crimp
  ctx.beginPath();
  ctx.roundRect(capLeft - 3 * scale, neckTop - 8 * scale, capWidth + 6 * scale, 12 * scale, 3);
  const crimpGrad = ctx.createLinearGradient(capLeft, 0, capLeft + capWidth, 0);
  crimpGrad.addColorStop(0, '#505050');
  crimpGrad.addColorStop(0.3, '#808080');
  crimpGrad.addColorStop(0.5, '#a0a0a0');
  crimpGrad.addColorStop(0.7, '#808080');
  crimpGrad.addColorStop(1, '#505050');
  ctx.fillStyle = crimpGrad;
  ctx.fill();

  // Label
  const labelMargin = 12 * scale;
  const labelLeft = bodyLeft + labelMargin;
  const labelW = vialWidth - labelMargin * 2;
  const labelTop2 = vialTop + vialHeight * 0.10;
  const labelBottom2 = vialBottom - vialHeight * 0.05;
  const labelH = labelBottom2 - labelTop2;
  ctx.beginPath();
  ctx.roundRect(labelLeft, labelTop2, labelW, labelH, 4 * scale);
  ctx.fillStyle = '#0d1117';
  ctx.fill();

  const labelCenterX = labelLeft + labelW / 2;

  // VR Logo
  ctx.fillStyle = '#ffffff';
  ctx.font = `bold ${Math.round(28 * scale)}px Inter, sans-serif`;
  ctx.textAlign = 'center';
  const logoY = labelTop2 + labelH * 0.04;
  const mtnY = logoY + labelW * 0.32 * 0.3;
  ctx.fillText('VR', labelCenterX, mtnY + labelW * 0.32 * 0.05);

  // Mountains
  const logoSize = labelW * 0.32;
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.moveTo(labelCenterX - logoSize * 0.5, mtnY + logoSize * 0.35);
  ctx.lineTo(labelCenterX - logoSize * 0.2, mtnY - logoSize * 0.05);
  ctx.lineTo(labelCenterX - logoSize * 0.08, mtnY + logoSize * 0.1);
  ctx.lineTo(labelCenterX + logoSize * 0.12, mtnY - logoSize * 0.2);
  ctx.lineTo(labelCenterX + logoSize * 0.35, mtnY + logoSize * 0.2);
  ctx.lineTo(labelCenterX + logoSize * 0.5, mtnY + logoSize * 0.35);
  ctx.closePath();
  ctx.fill();
  // River
  ctx.beginPath();
  ctx.strokeStyle = '#4a9eff';
  ctx.lineWidth = 3 * scale;
  ctx.moveTo(labelCenterX - logoSize * 0.35, mtnY + logoSize * 0.3);
  ctx.quadraticCurveTo(labelCenterX, mtnY + logoSize * 0.2, labelCenterX + logoSize * 0.4, mtnY + logoSize * 0.35);
  ctx.stroke();

  // Company name
  ctx.fillStyle = '#a0a0a0';
  ctx.font = `600 ${Math.round(11 * scale)}px Inter, sans-serif`;
  ctx.fillText('RIVER VALLEY RESEARCH', labelCenterX, labelTop2 + labelH * 0.24);

  // Product name - auto-scale
  let fontSize;
  if (productName.length > 22) fontSize = Math.round(18 * scale);
  else if (productName.length > 16) fontSize = Math.round(22 * scale);
  else if (productName.length > 12) fontSize = Math.round(28 * scale);
  else if (productName.length > 8) fontSize = Math.round(34 * scale);
  else fontSize = Math.round(40 * scale);

  ctx.fillStyle = '#ffffff';
  ctx.font = `bold ${fontSize}px Inter, sans-serif`;
  ctx.textAlign = 'center';
  ctx.fillText(productName, labelCenterX, labelTop2 + labelH * 0.44);

  // Dosage
  ctx.font = `bold ${Math.round(20 * scale)}px Inter, sans-serif`;
  ctx.fillStyle = '#e0e0e0';
  ctx.fillText(dosage, labelCenterX, labelTop2 + labelH * 0.54);

  // Accent strip
  const stripY = labelTop2 + labelH * 0.70;
  const stripW = labelW * 0.55;
  ctx.beginPath();
  ctx.roundRect(labelCenterX - stripW / 2, stripY, stripW, 5 * scale, 3);
  ctx.fillStyle = accentColor;
  ctx.fill();

  // Research Use Only
  ctx.fillStyle = '#666666';
  ctx.font = `500 ${Math.round(10 * scale)}px Inter, sans-serif`;
  ctx.fillText('Research Use Only', labelCenterX, labelTop2 + labelH * 0.90);
}

// Generate hero with 3 vials
const width = 1200;
const height = 700;
const canvas = createCanvas(width, height);
const ctx = canvas.getContext('2d');
ctx.clearRect(0, 0, width, height);

drawVial(ctx, 230, 50, 0.78, 'Semaglutide', '5MG');
drawVial(ctx, 600, 10, 0.92, 'BPC-157', '5MG');
drawVial(ctx, 970, 40, 0.80, 'GHK-Cu', '50MG');

const buffer = canvas.toBuffer('image/png');
fs.writeFileSync('/home/ubuntu/test-hero-vials-v2.png', buffer);
console.log('Hero vials v2 generated:', buffer.length, 'bytes');

// Also generate a single product vial to test
const singleCanvas = createCanvas(500, 700);
const sCtx = singleCanvas.getContext('2d');
sCtx.clearRect(0, 0, 500, 700);
drawVial(sCtx, 250, 10, 0.95, 'BPC-157', '5MG');
fs.writeFileSync('/home/ubuntu/test-single-vial.png', singleCanvas.toBuffer('image/png'));
console.log('Single vial generated');
