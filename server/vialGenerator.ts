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
let cachedPhotorealVialTemplate: Image | null = null;

const HERO_IMAGE_PATHS = [
  path.join(process.cwd(), 'client/public/assets/rvr-company-hero-3-vials.png'),
  path.join(__dirname, 'hero-3vials.png'),
  path.join(process.cwd(), 'client/public/assets/rvr-hero-3vials-composed_5511eda3.png'),
];

const LOGO_PATHS = [
  path.join(process.cwd(), 'client/public/assets/rvr-company-logo-small.png'),
  path.join(process.cwd(), 'client/public/assets/rvr-logo_19fbf80f.png'),
];

const PHOTOREAL_VIAL_TEMPLATE_PATHS = [
  path.join(process.cwd(), 'client/public/assets/rvr-photoreal-vial-template.png'),
  path.join(__dirname, 'rvr-photoreal-vial-template.png'),
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

async function getPhotorealVialTemplate(): Promise<Image> {
  if (!cachedPhotorealVialTemplate) cachedPhotorealVialTemplate = await loadImage(firstExisting(PHOTOREAL_VIAL_TEMPLATE_PATHS));
  return cachedPhotorealVialTemplate;
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
  // IMPORTANT: this uses the approved photorealistic RVR vial image as the base.
  // The only generated pieces are the product name, RVR logo, and selected dose.
  const template = await getPhotorealVialTemplate();
  const W = template.width;
  const H = template.height;
  const canvas = createCanvas(W, H);
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, W, H);
  ctx.drawImage(template, 0, 0, W, H);

  const cx = W / 2;
  const combined = String(productName || '').trim();
  const peptideName = (extractPeptideName(combined) || 'PRODUCT').toUpperCase();
  const dosage = extractDosage(combined).toUpperCase();

  // The template image originally contains sample text. Softly wash out the printable
  // glass area without changing the vial, cap, metal ring, shadows, or HD glass edges.
  // This keeps the "clear label" look while making every product name/dose clean.
  // Fully clear the old sample text from the approved template. This area is
  // clipped to the vial body so the HD cap, glass edges, bottom, and shadow remain.
  ctx.fillStyle = 'rgba(255,255,255,1.0)';
  roundRect(ctx, 238, 420, 640, 665, 76);
  ctx.fill();

  // Restore subtle glass vertical highlights over the clean label zone.
  const glass = ctx.createLinearGradient(245, 0, 875, 0);
  glass.addColorStop(0.00, 'rgba(255,255,255,0.00)');
  glass.addColorStop(0.12, 'rgba(245,250,255,0.24)');
  glass.addColorStop(0.22, 'rgba(185,205,225,0.08)');
  glass.addColorStop(0.80, 'rgba(245,250,255,0.18)');
  glass.addColorStop(1.00, 'rgba(255,255,255,0.00)');
  ctx.fillStyle = glass;
  roundRect(ctx, 255, 440, 606, 625, 70);
  ctx.fill();

  const blue = '#005AA4';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = blue;

  // Product name at the top. Long blend names wrap and shrink instead of overflowing.
  const nameFit = fitLines(ctx, peptideName, 430, 2, 58, 30);
  ctx.font = `900 ${nameFit.size}px Inter, Arial, sans-serif`;
  const nameLineGap = nameFit.size * 0.98;
  const nameStartY = 555 - ((nameFit.lines.length - 1) * nameLineGap) / 2;
  for (let i = 0; i < nameFit.lines.length; i++) {
    ctx.fillText(nameFit.lines[i], cx, nameStartY + i * nameLineGap);
  }

  // Company logo in the middle, sized close to the approved sample.
  try {
    const logo = await getLogo();
    const maxLogoW = 300;
    const maxLogoH = 130;
    const scale = Math.min(maxLogoW / logo.width, maxLogoH / logo.height);
    const lw = logo.width * scale;
    const lh = logo.height * scale;
    ctx.drawImage(logo, cx - lw / 2, 710 - lh / 2, lw, lh);
  } catch {
    ctx.font = '900 46px Inter, Arial, sans-serif';
    ctx.fillStyle = '#8c939b';
    ctx.fillText('RIVER VALLEY', cx, 690);
    ctx.font = '800 31px Inter, Arial, sans-serif';
    ctx.fillStyle = blue;
    ctx.fillText('RESEARCH PEPTIDES LLC', cx, 735);
  }

  // Dose at the bottom. If there is no dose, leave the lower glass clean.
  if (dosage) {
    ctx.fillStyle = blue;
    const doseFit = fitLines(ctx, dosage, 400, 2, 56, 30);
    ctx.font = `900 ${doseFit.size}px Inter, Arial, sans-serif`;
    const doseLineGap = doseFit.size * 1.02;
    const doseStartY = 895 - ((doseFit.lines.length - 1) * doseLineGap) / 2;
    for (let i = 0; i < doseFit.lines.length; i++) {
      ctx.fillText(doseFit.lines[i], cx, doseStartY + i * doseLineGap);
    }
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
