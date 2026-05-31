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
  const words = text.replace(/\s*\/\s*/g, ' / ').split(/\s+/).filter(Boolean);
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


function escXml(value: string): string {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function assetDataUri(filePath: string, mime: string): string {
  const data = fs.readFileSync(filePath).toString('base64');
  return `data:${mime};base64,${data}`;
}

function splitSvgLines(text: string, maxChars: number, maxLines: number): string[] {
  const cleaned = String(text || '').trim().replace(/\s+/g, ' ');
  if (!cleaned) return [];
  const words = cleaned.split(' ');
  const lines: string[] = [];
  let line = '';
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (test.length > maxChars && line) {
      lines.push(line);
      line = word;
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);
  if (lines.length <= maxLines) return lines;
  const kept = lines.slice(0, maxLines);
  kept[maxLines - 1] = `${kept[maxLines - 1].replace(/\.{3}$/,'')}…`;
  return kept;
}

function svgTextBlock(lines: string[], x: number, y: number, fontSize: number, lineHeight: number, fill: string): string {
  if (!lines.length) return '';
  const startY = y - ((lines.length - 1) * lineHeight) / 2;
  return `<text x="${x}" y="${startY}" text-anchor="middle" dominant-baseline="middle" font-family="Arial, Helvetica, sans-serif" font-size="${fontSize}" font-weight="900" fill="${fill}">${lines.map((line, i) => `<tspan x="${x}" dy="${i === 0 ? 0 : lineHeight}">${escXml(line)}</tspan>`).join('')}</text>`;
}

export async function generateVialSvgBuffer(productName: string): Promise<Buffer> {
  const templatePath = firstExisting(PHOTOREAL_VIAL_TEMPLATE_PATHS);
  const logoPath = firstExisting(LOGO_PATHS);
  const templateUri = assetDataUri(templatePath, 'image/png');
  const logoUri = assetDataUri(logoPath, 'image/png');

  const W = 1116;
  const H = 1410;
  const cx = W / 2;
  const combined = String(productName || '').trim();
  const peptideName = (extractPeptideName(combined) || 'PRODUCT').toUpperCase();
  const dosage = extractDosage(combined).toUpperCase();
  const blue = '#005AA4';

  // Tight, center-mounted label area that matches the approved sample vial.
  // Everything is clipped inside this rounded rectangle so no letters can spill
  // past the glass/body sides when long blend names are used.
  const nameLines = splitSvgLines(peptideName.replace(/\s*\/\s*/g, ' / '), peptideName.length > 24 ? 13 : 16, 3);
  const doseLines = splitSvgLines(dosage.replace(/\s*\/\s*/g, ' / '), 15, 2);
  const nameFont = nameLines.length >= 3 ? 43 : peptideName.length > 24 ? 48 : peptideName.length > 15 ? 58 : 72;
  const doseFont = doseLines.length > 1 || dosage.length > 14 ? 50 : 70;

  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <image href="${templateUri}" x="0" y="0" width="${W}" height="${H}" preserveAspectRatio="xMidYMid meet"/>
  <defs>
    <clipPath id="labelClip"><rect x="318" y="452" width="480" height="660" rx="72"/></clipPath>
    <linearGradient id="glassSheen" x1="318" y1="0" x2="798" y2="0" gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="#ffffff" stop-opacity="0"/>
      <stop offset="0.12" stop-color="#eaf4ff" stop-opacity="0.24"/>
      <stop offset="0.24" stop-color="#8fa8be" stop-opacity="0.08"/>
      <stop offset="0.78" stop-color="#eaf4ff" stop-opacity="0.18"/>
      <stop offset="1" stop-color="#ffffff" stop-opacity="0"/>
    </linearGradient>
  </defs>
  <g clip-path="url(#labelClip)">
    <rect x="318" y="452" width="480" height="660" rx="72" fill="#ffffff" opacity="1"/>
    <rect x="330" y="470" width="456" height="620" rx="66" fill="url(#glassSheen)"/>
    ${svgTextBlock(nameLines, cx, 645, nameFont, Math.round(nameFont * 1.02), blue)}
    <image href="${logoUri}" x="328" y="725" width="460" height="242" preserveAspectRatio="xMidYMid meet"/>
    ${doseLines.length ? svgTextBlock(doseLines, cx, 1042, doseFont, Math.round(doseFont * 1.06), blue) : ''}
  </g>
</svg>`;
  return Buffer.from(svg, 'utf8');
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
  roundRect(ctx, 275, 455, 566, 660, 70);
  ctx.fill();

  // Restore subtle glass vertical highlights over the clean label zone.
  const glass = ctx.createLinearGradient(245, 0, 875, 0);
  glass.addColorStop(0.00, 'rgba(255,255,255,0.00)');
  glass.addColorStop(0.12, 'rgba(245,250,255,0.24)');
  glass.addColorStop(0.22, 'rgba(185,205,225,0.08)');
  glass.addColorStop(0.80, 'rgba(245,250,255,0.18)');
  glass.addColorStop(1.00, 'rgba(255,255,255,0.00)');
  ctx.fillStyle = glass;
  roundRect(ctx, 292, 475, 532, 620, 64);
  ctx.fill();

  const blue = '#005AA4';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = blue;

  // Product name at the top. Long blend names wrap and shrink instead of overflowing.
  const labelName = peptideName.replace(/\s*\/\s*/g, ' / ');
  const nameFit = fitLines(ctx, labelName, 380, 3, 50, 24);
  ctx.font = `900 ${nameFit.size}px Inter, Arial, sans-serif`;
  const nameLineGap = nameFit.size * 0.95;
  const nameStartY = 645 - ((nameFit.lines.length - 1) * nameLineGap) / 2;
  for (let i = 0; i < nameFit.lines.length; i++) {
    ctx.fillText(nameFit.lines[i], cx, nameStartY + i * nameLineGap);
  }

  // Company logo in the middle, sized close to the approved sample.
  try {
    const logo = await getLogo();
    const maxLogoW = 440;
    const maxLogoH = 225;
    const scale = Math.min(maxLogoW / logo.width, maxLogoH / logo.height);
    const lw = logo.width * scale;
    const lh = logo.height * scale;
    ctx.drawImage(logo, cx - lw / 2, 850 - lh / 2, lw, lh);
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
    const doseFit = fitLines(ctx, dosage.replace(/\s*\/\s*/g, ' / '), 380, 2, 52, 26);
    ctx.font = `900 ${doseFit.size}px Inter, Arial, sans-serif`;
    const doseLineGap = doseFit.size * 1.02;
    const doseStartY = 1042 - ((doseFit.lines.length - 1) * doseLineGap) / 2;
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
