import { createCanvas, loadImage, GlobalFonts, Image } from '@napi-rs/canvas';
import { storagePut } from './storage';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const fontPath = '/usr/share/fonts/truetype/inter/InterVariable.ttf';
if (fs.existsSync(fontPath)) GlobalFonts.registerFromPath(fontPath, 'Inter');

let cachedHeroImage: Buffer | null = null;
let cachedLogo: Image | null = null;

const HERO_IMAGE_PATHS = [
  path.join(process.cwd(), 'client/public/assets/rvr-company-hero-3-vials.png'),
  path.join(__dirname, 'hero-3vials.png'),
  path.join(process.cwd(), 'client/public/assets/rvr-hero-3vials-composed_5511eda3.png'),
];

const LOGO_PATHS = [
  path.join(process.cwd(), 'client/public/assets/rvr-company-logo-small.png'),
  path.join(process.cwd(), 'client/public/assets/rvr-logo_19fbf80f.png'),
];

function firstExisting(paths: string[]): string {
  const found = paths.find((p) => fs.existsSync(p));
  if (!found) throw new Error(`Required image asset not found. Checked: ${paths.join(', ')}`);
  return found;
}

async function getLogo(): Promise<Image> {
  if (!cachedLogo) cachedLogo = await loadImage(firstExisting(LOGO_PATHS));
  return cachedLogo;
}

function getHeroImageBuffer(): Buffer {
  if (!cachedHeroImage) cachedHeroImage = fs.readFileSync(firstExisting(HERO_IMAGE_PATHS));
  return cachedHeroImage;
}

function normalizeDoseText(value: string): string {
  const m = value.match(/(\d+(?:,\d+)?(?:\.\d+)?)\s*(mg|mcg|iu|ml|g)(?:\s*\/\s*(ml|vial))?/i);
  if (!m) return value.toUpperCase().trim();
  const unit = m[2].toUpperCase();
  const per = m[3] ? `/${m[3].toUpperCase()}` : '';
  return `${m[1]} ${unit}${per}`;
}

function extractDosage(name: string): string {
  const matches = String(name || '').match(/\d+(?:,\d+)?(?:\.\d+)?\s*(?:mg|mcg|iu|ml|g)(?:\s*\/\s*(?:ml|vial))?/gi);
  if (!matches || !matches.length) return '';
  return matches.map(normalizeDoseText).join(' / ');
}

function extractPeptideName(name: string): string {
  return String(name || '')
    .replace(/\([^)]*\)/g, ' ')
    .replace(/\d+(?:,\d+)?(?:\.\d+)?\s*(?:mg|mcg|iu|ml|g)(?:\s*\/\s*(?:ml|vial))?/gi, ' ')
    .replace(/\s*\/\s*$/g, '')
    .replace(/^\s*\/\s*/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function roundRect(ctx: any, x: number, y: number, w: number, h: number, r: number) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}

function fitLines(ctx: any, text: string, maxWidth: number, maxLines: number, startSize: number, minSize: number) {
  const words = text.split(/\s+/).filter(Boolean);
  for (let size = startSize; size >= minSize; size -= 2) {
    ctx.font = `900 ${size}px Inter, Arial, sans-serif`;
    const lines: string[] = [];
    let line = '';
    for (const word of words) {
      const test = line ? `${line} ${word}` : word;
      if (ctx.measureText(test).width > maxWidth && line) {
        lines.push(line);
        line = word;
      } else {
        line = test;
      }
    }
    if (line) lines.push(line);
    if (lines.length <= maxLines && lines.every((l) => ctx.measureText(l).width <= maxWidth)) return { lines, size };
  }
  ctx.font = `900 ${minSize}px Inter, Arial, sans-serif`;
  return { lines: [text], size: minSize };
}

async function drawVialWithLabel(productName: string): Promise<Buffer> {
  // Transparent HD-style generated vial. This keeps every vial consistent and lets
  // /api/vial render the name/dose dynamically for products and variants.
  const W = 1000;
  const H = 1200;
  const canvas = createCanvas(W, H);
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, W, H);

  const cx = W / 2;
  const vialX = 265;
  const vialY = 150;
  const vialW = 470;
  const bodyY = 355;
  const bodyH = 675;
  const bodyR = 70;

  // Soft realistic shadow.
  const shadow = ctx.createRadialGradient(cx, 1070, 30, cx, 1070, 285);
  shadow.addColorStop(0, 'rgba(0,0,0,0.25)');
  shadow.addColorStop(0.55, 'rgba(0,0,0,0.10)');
  shadow.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = shadow;
  ctx.beginPath();
  ctx.ellipse(cx, 1070, 270, 48, 0, 0, Math.PI * 2);
  ctx.fill();

  // Glass body.
  const bodyGrad = ctx.createLinearGradient(vialX, 0, vialX + vialW, 0);
  bodyGrad.addColorStop(0, 'rgba(245,250,255,0.52)');
  bodyGrad.addColorStop(0.10, 'rgba(255,255,255,0.92)');
  bodyGrad.addColorStop(0.23, 'rgba(205,218,229,0.38)');
  bodyGrad.addColorStop(0.50, 'rgba(255,255,255,0.30)');
  bodyGrad.addColorStop(0.78, 'rgba(198,214,226,0.42)');
  bodyGrad.addColorStop(0.91, 'rgba(255,255,255,0.90)');
  bodyGrad.addColorStop(1, 'rgba(225,236,246,0.50)');
  ctx.fillStyle = bodyGrad;
  roundRect(ctx, vialX, bodyY, vialW, bodyH, bodyR);
  ctx.fill();

  ctx.strokeStyle = 'rgba(30,45,58,0.28)';
  ctx.lineWidth = 4;
  roundRect(ctx, vialX, bodyY, vialW, bodyH, bodyR);
  ctx.stroke();

  // Shoulder and small neck.
  const shoulderGrad = ctx.createLinearGradient(vialX, 0, vialX + vialW, 0);
  shoulderGrad.addColorStop(0, 'rgba(240,248,255,0.15)');
  shoulderGrad.addColorStop(0.5, 'rgba(255,255,255,0.80)');
  shoulderGrad.addColorStop(1, 'rgba(210,225,238,0.18)');
  ctx.fillStyle = shoulderGrad;
  roundRect(ctx, vialX + 30, 305, vialW - 60, 95, 60);
  ctx.fill();
  ctx.strokeStyle = 'rgba(20,35,50,0.22)';
  ctx.lineWidth = 3;
  roundRect(ctx, vialX + 30, 305, vialW - 60, 95, 60);
  ctx.stroke();

  roundRect(ctx, vialX + 145, 240, vialW - 290, 105, 28);
  ctx.fillStyle = 'rgba(246,250,255,0.58)';
  ctx.fill();
  ctx.strokeStyle = 'rgba(15,30,45,0.24)';
  ctx.lineWidth = 3;
  ctx.stroke();

  // Metal ring.
  const metal = ctx.createLinearGradient(vialX + 45, 0, vialX + vialW - 45, 0);
  metal.addColorStop(0, '#9a9a9a');
  metal.addColorStop(0.16, '#eeeeee');
  metal.addColorStop(0.38, '#c8c8c8');
  metal.addColorStop(0.55, '#ffffff');
  metal.addColorStop(0.76, '#bebebe');
  metal.addColorStop(1, '#8c8c8c');
  ctx.fillStyle = metal;
  roundRect(ctx, vialX + 30, 165, vialW - 60, 115, 30);
  ctx.fill();
  ctx.strokeStyle = 'rgba(0,0,0,0.22)';
  ctx.lineWidth = 2;
  ctx.stroke();

  // Black top cap.
  const cap = ctx.createLinearGradient(vialX + 15, 0, vialX + vialW - 15, 0);
  cap.addColorStop(0, '#111111');
  cap.addColorStop(0.5, '#292929');
  cap.addColorStop(1, '#111111');
  ctx.fillStyle = cap;
  roundRect(ctx, vialX + 10, 125, vialW - 20, 72, 35);
  ctx.fill();
  ctx.strokeStyle = 'rgba(0,0,0,0.35)';
  ctx.lineWidth = 2;
  ctx.stroke();

  // Bottom glass thickness.
  ctx.strokeStyle = 'rgba(0,0,0,0.30)';
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.ellipse(cx, 1015, 200, 24, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.strokeStyle = 'rgba(255,255,255,0.80)';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.ellipse(cx, 998, 175, 16, 0, 0, Math.PI * 2);
  ctx.stroke();

  // Vertical highlights.
  const shine = ctx.createLinearGradient(vialX, 0, vialX + vialW, 0);
  shine.addColorStop(0, 'rgba(255,255,255,0)');
  shine.addColorStop(0.13, 'rgba(255,255,255,0.70)');
  shine.addColorStop(0.20, 'rgba(255,255,255,0.05)');
  shine.addColorStop(0.82, 'rgba(255,255,255,0.42)');
  shine.addColorStop(0.90, 'rgba(255,255,255,0)');
  ctx.fillStyle = shine;
  roundRect(ctx, vialX + 18, bodyY + 25, vialW - 36, bodyH - 60, bodyR - 10);
  ctx.fill();

  const combined = String(productName || '').trim();
  const peptideName = (extractPeptideName(combined) || 'PRODUCT').toUpperCase();
  const dosage = extractDosage(combined).toUpperCase();

  // Clear-label text printed directly on the glass.
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#005AA4';
  const nameFit = fitLines(ctx, peptideName, 390, 2, 68, 34);
  ctx.font = `900 ${nameFit.size}px Inter, Arial, sans-serif`;
  const nameLineGap = nameFit.size * 1.02;
  const nameStartY = 520 - ((nameFit.lines.length - 1) * nameLineGap) / 2;
  for (let i = 0; i < nameFit.lines.length; i++) ctx.fillText(nameFit.lines[i], cx, nameStartY + i * nameLineGap);

  // Company logo in the middle.
  try {
    const logo = await getLogo();
    const maxLogoW = 310;
    const maxLogoH = 150;
    const scale = Math.min(maxLogoW / logo.width, maxLogoH / logo.height);
    const lw = logo.width * scale;
    const lh = logo.height * scale;
    ctx.drawImage(logo, cx - lw / 2, 610 - lh / 2, lw, lh);
  } catch {
    ctx.font = '900 40px Inter, Arial, sans-serif';
    ctx.fillStyle = '#8c939b';
    ctx.fillText('RIVER VALLEY', cx, 595);
    ctx.font = '800 28px Inter, Arial, sans-serif';
    ctx.fillStyle = '#005AA4';
    ctx.fillText('RESEARCH PEPTIDES', cx, 635);
  }

  if (dosage) {
    ctx.fillStyle = '#005AA4';
    const doseFit = fitLines(ctx, dosage, 360, 2, 58, 34);
    ctx.font = `900 ${doseFit.size}px Inter, Arial, sans-serif`;
    const gap = doseFit.size * 1.05;
    const start = 785 - ((doseFit.lines.length - 1) * gap) / 2;
    for (let i = 0; i < doseFit.lines.length; i++) ctx.fillText(doseFit.lines[i], cx, start + i * gap);
  }

  return Buffer.from(canvas.toBuffer('image/png'));
}

export async function generateVialImage(productName: string, productSlug: string): Promise<string> {
  return `/api/vial/${productSlug}.png`;
}

export async function generateHeroVialsImage(products: Array<{ name: string }>): Promise<string> {
  const buffer = getHeroImageBuffer();
  const fileKey = `product-vials/hero-vials.png`;
  const { url } = await storagePut(fileKey, buffer, 'image/png');
  return url;
}

export async function generateVialBuffer(productName: string): Promise<Buffer> {
  return drawVialWithLabel(productName);
}

export function generateHeroVialsBuffer(products: Array<{ name: string }>): Buffer {
  return getHeroImageBuffer();
}
