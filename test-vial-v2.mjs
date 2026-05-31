import { createCanvas, loadImage, GlobalFonts } from '@napi-rs/canvas';
import fs from 'fs';

const fontPath = '/usr/share/fonts/truetype/inter/InterVariable.ttf';
if (fs.existsSync(fontPath)) {
  GlobalFonts.registerFromPath(fontPath, 'Inter');
}

const width = 500;
const height = 900;
const canvas = createCanvas(width, height);
const ctx = canvas.getContext('2d');
ctx.clearRect(0, 0, width, height);

// === CYLINDRICAL VIAL SHAPE ===
const vialCenterX = width / 2;
const vialWidth = 180;
const vialTop = 160;
const vialBottom = 820;
const vialHeight = vialBottom - vialTop;

// Draw vial body as a rounded rectangle (simulating cylinder)
const bodyLeft = vialCenterX - vialWidth / 2;
const bodyRight = vialCenterX + vialWidth / 2;

// Main glass body with gradient for 3D cylindrical effect
const glassGrad = ctx.createLinearGradient(bodyLeft, 0, bodyRight, 0);
glassGrad.addColorStop(0, '#b8b8b8');
glassGrad.addColorStop(0.08, '#d0d0d0');
glassGrad.addColorStop(0.2, '#e8e8e8');
glassGrad.addColorStop(0.35, '#f5f5f5');
glassGrad.addColorStop(0.5, '#fafafa');
glassGrad.addColorStop(0.65, '#f2f2f2');
glassGrad.addColorStop(0.8, '#e0e0e0');
glassGrad.addColorStop(0.92, '#c8c8c8');
glassGrad.addColorStop(1, '#a8a8a8');

// Rounded bottom vial shape
ctx.beginPath();
ctx.moveTo(bodyLeft, vialTop);
ctx.lineTo(bodyLeft, vialBottom - 30);
ctx.quadraticCurveTo(bodyLeft, vialBottom, bodyLeft + 30, vialBottom);
ctx.lineTo(bodyRight - 30, vialBottom);
ctx.quadraticCurveTo(bodyRight, vialBottom, bodyRight, vialBottom - 30);
ctx.lineTo(bodyRight, vialTop);
ctx.closePath();
ctx.fillStyle = glassGrad;
ctx.fill();

// Subtle border
ctx.strokeStyle = 'rgba(0,0,0,0.1)';
ctx.lineWidth = 1;
ctx.stroke();

// Glass highlight (left side reflection)
ctx.beginPath();
ctx.rect(bodyLeft + 12, vialTop + 20, 8, vialHeight - 60);
ctx.fillStyle = 'rgba(255,255,255,0.5)';
ctx.fill();

// Secondary highlight
ctx.beginPath();
ctx.rect(bodyLeft + 25, vialTop + 40, 4, vialHeight - 100);
ctx.fillStyle = 'rgba(255,255,255,0.25)';
ctx.fill();

// === NECK (narrower part at top) ===
const neckWidth = vialWidth * 0.45;
const neckHeight = 40;
const neckLeft = vialCenterX - neckWidth / 2;
const neckTop = vialTop - neckHeight;

const neckGrad = ctx.createLinearGradient(neckLeft, 0, neckLeft + neckWidth, 0);
neckGrad.addColorStop(0, '#c0c0c0');
neckGrad.addColorStop(0.3, '#e8e8e8');
neckGrad.addColorStop(0.5, '#f0f0f0');
neckGrad.addColorStop(0.7, '#e0e0e0');
neckGrad.addColorStop(1, '#b0b0b0');

ctx.beginPath();
ctx.moveTo(bodyLeft + 15, vialTop);
ctx.lineTo(neckLeft, neckTop + 15);
ctx.lineTo(neckLeft, neckTop);
ctx.lineTo(neckLeft + neckWidth, neckTop);
ctx.lineTo(neckLeft + neckWidth, neckTop + 15);
ctx.lineTo(bodyRight - 15, vialTop);
ctx.closePath();
ctx.fillStyle = neckGrad;
ctx.fill();

// === CAP (aluminum crimp cap) ===
const capWidth = neckWidth + 10;
const capHeight = 55;
const capLeft = vialCenterX - capWidth / 2;
const capTop = neckTop - capHeight + 5;

const capGrad = ctx.createLinearGradient(capLeft, 0, capLeft + capWidth, 0);
capGrad.addColorStop(0, '#707070');
capGrad.addColorStop(0.15, '#a0a0a0');
capGrad.addColorStop(0.3, '#c8c8c8');
capGrad.addColorStop(0.5, '#d8d8d8');
capGrad.addColorStop(0.7, '#c0c0c0');
capGrad.addColorStop(0.85, '#a0a0a0');
capGrad.addColorStop(1, '#707070');

ctx.beginPath();
ctx.roundRect(capLeft, capTop, capWidth, capHeight, [8, 8, 2, 2]);
ctx.fillStyle = capGrad;
ctx.fill();

// Cap top disc
ctx.beginPath();
ctx.ellipse(vialCenterX, capTop + 5, capWidth / 2 - 3, 8, 0, 0, Math.PI * 2);
ctx.fillStyle = '#b0b0b0';
ctx.fill();

// Crimp ring at bottom of cap
ctx.beginPath();
ctx.roundRect(capLeft - 3, neckTop - 8, capWidth + 6, 12, 2);
const crimpGrad = ctx.createLinearGradient(capLeft - 3, 0, capLeft + capWidth + 3, 0);
crimpGrad.addColorStop(0, '#606060');
crimpGrad.addColorStop(0.3, '#909090');
crimpGrad.addColorStop(0.5, '#a8a8a8');
crimpGrad.addColorStop(0.7, '#909090');
crimpGrad.addColorStop(1, '#606060');
ctx.fillStyle = crimpGrad;
ctx.fill();

// === LABEL (dark navy/black) ===
const labelMargin = 12;
const labelLeft = bodyLeft + labelMargin;
const labelRight = bodyRight - labelMargin;
const labelW = labelRight - labelLeft;
const labelTop2 = vialTop + vialHeight * 0.12;
const labelBottom2 = vialBottom - vialHeight * 0.06;
const labelH = labelBottom2 - labelTop2;

ctx.beginPath();
ctx.roundRect(labelLeft, labelTop2, labelW, labelH, 4);
ctx.fillStyle = '#0d1117';
ctx.fill();

const labelCenterX = labelLeft + labelW / 2;

// === LABEL CONTENT ===

// RVR Logo (draw as white mountain/river icon since the original has white bg)
// We'll draw a simplified white version
const logoY = labelTop2 + labelH * 0.04;
const logoSize = labelW * 0.35;

// Draw simplified mountain+river logo in white
ctx.save();
const mtnCenterX = labelCenterX;
const mtnY = logoY + logoSize * 0.3;

// Mountains
ctx.fillStyle = '#ffffff';
ctx.beginPath();
ctx.moveTo(mtnCenterX - logoSize * 0.4, mtnY + logoSize * 0.3);
ctx.lineTo(mtnCenterX - logoSize * 0.15, mtnY - logoSize * 0.1);
ctx.lineTo(mtnCenterX - logoSize * 0.05, mtnY + logoSize * 0.05);
ctx.lineTo(mtnCenterX + logoSize * 0.1, mtnY - logoSize * 0.25);
ctx.lineTo(mtnCenterX + logoSize * 0.3, mtnY + logoSize * 0.15);
ctx.lineTo(mtnCenterX + logoSize * 0.4, mtnY + logoSize * 0.3);
ctx.closePath();
ctx.fill();

// River curve
ctx.beginPath();
ctx.strokeStyle = '#4a9eff';
ctx.lineWidth = 2.5;
ctx.moveTo(mtnCenterX - logoSize * 0.3, mtnY + logoSize * 0.25);
ctx.quadraticCurveTo(mtnCenterX, mtnY + logoSize * 0.15, mtnCenterX + logoSize * 0.35, mtnY + logoSize * 0.3);
ctx.stroke();
ctx.restore();

// "RIVER VALLEY RESEARCH" text
ctx.fillStyle = '#a0a0a0';
ctx.font = '500 11px Inter, sans-serif';
ctx.textAlign = 'center';
ctx.fillText('RIVER VALLEY RESEARCH', labelCenterX, labelTop2 + labelH * 0.22);

// Product name - LARGE BOLD
ctx.fillStyle = '#ffffff';
ctx.font = 'bold 38px Inter, sans-serif';
ctx.textAlign = 'center';
ctx.fillText('BPC-157', labelCenterX, labelTop2 + labelH * 0.44);

// Dosage
ctx.font = 'bold 24px Inter, sans-serif';
ctx.fillText('5MG', labelCenterX, labelTop2 + labelH * 0.54);

// Color accent strip
const stripY = labelTop2 + labelH * 0.65;
const stripW = labelW * 0.6;
ctx.beginPath();
ctx.roundRect(labelCenterX - stripW / 2, stripY, stripW, 4, 2);
ctx.fillStyle = '#C9A961';
ctx.fill();

// "Research Use Only"
ctx.fillStyle = '#777777';
ctx.font = '500 11px Inter, sans-serif';
ctx.fillText('Research Use Only', labelCenterX, labelTop2 + labelH * 0.88);

// === Shadow under vial ===
ctx.beginPath();
ctx.ellipse(vialCenterX, vialBottom + 15, vialWidth * 0.4, 10, 0, 0, Math.PI * 2);
ctx.fillStyle = 'rgba(0,0,0,0.08)';
ctx.fill();

const buffer = canvas.toBuffer('image/png');
fs.writeFileSync('/home/ubuntu/test-vial-v2.png', buffer);
console.log('Vial v2 generated! Size:', buffer.length, 'bytes');
