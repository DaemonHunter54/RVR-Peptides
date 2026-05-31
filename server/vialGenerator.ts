import { createCanvas, loadImage, GlobalFonts, Image } from '@napi-rs/canvas';
import { storagePut } from './storage';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Register Inter font
const fontPath = '/usr/share/fonts/truetype/inter/InterVariable.ttf';
if (fs.existsSync(fontPath)) {
  GlobalFonts.registerFromPath(fontPath, 'Inter');
}

// Cache the loaded vial template image
let cachedVialTemplate: Image | null = null;
let cachedHeroImage: Buffer | null = null;

const VIAL_TEMPLATE_PATHS = [
  path.join(__dirname, 'vial-template.png'),
  path.join(process.cwd(), 'client/public/assets/rvr-vial-template-single_c7ba8797.png'),
];

const HD_VIAL_BASE_PATHS = [
  path.join(process.cwd(), 'client/public/assets/bpc-157-5mg_1e10350a.png'),
  path.join(process.cwd(), 'client/public/assets/bpc-157-10mg_358b8e1b.png'),
  path.join(process.cwd(), 'client/public/assets/sermorelin-10mg_92bb2dc6.png'),
];

const HERO_IMAGE_PATHS = [
  path.join(__dirname, 'hero-3vials.png'),
  path.join(process.cwd(), 'client/public/assets/rvr-hero-3vials-composed_5511eda3.png'),
];

function firstExisting(paths: string[]): string {
  const found = paths.find((p) => fs.existsSync(p));
  if (!found) throw new Error(`Required image asset not found. Checked: ${paths.join(', ')}`);
  return found;
}

async function getVialTemplate(): Promise<Image> {
  if (!cachedVialTemplate) {
    cachedVialTemplate = await loadImage(firstExisting(VIAL_TEMPLATE_PATHS));
  }
  return cachedVialTemplate;
}

function getHeroImageBuffer(): Buffer {
  if (!cachedHeroImage) {
    cachedHeroImage = fs.readFileSync(firstExisting(HERO_IMAGE_PATHS));
  }
  return cachedHeroImage;
}

function extractDosage(name: string): string {
  const multiMatch = name.match(/(\d+(?:,\d+)?(?:\.\d+)?)\s*(mg|mcg|iu|ml)(?:\s*\/\s*\d+(?:,\d+)?(?:\.\d+)?\s*(?:mg|mcg|iu|ml))+/i);
  if (multiMatch) {
    const allDosages = multiMatch[0].match(/(\d+(?:,\d+)?(?:\.\d+)?)\s*(mg|mcg|iu|ml)/gi);
    if (allDosages && allDosages.length > 1) {
      return allDosages.map(d => {
        const m = d.match(/(\d+(?:,\d+)?(?:\.\d+)?)\s*(mg|mcg|iu|ml)/i);
        return m ? `${m[1]}${m[2].toUpperCase()}` : d;
      }).join('/');
    }
  }
  const match = name.match(/(\d+(?:,\d+)?(?:\.\d+)?)\s*(mg|mcg|iu|ml|mL)(?:\s*\/\s*mL)?/i);
  if (match) {
    const perMl = match[0].match(/\/\s*mL/i) ? '/ML' : '';
    return `${match[1]}${match[2].toUpperCase()}${perMl}`;
  }
  return '';
}

function extractPeptideName(name: string): string {
  return name
    .replace(/\s*\d+(?:,\d+)?(?:\.\d+)?\s*(?:mg|mcg|iu|ml)(?:\s*\/\s*\d+(?:,\d+)?(?:\.\d+)?\s*(?:mg|mcg|iu|ml))*(?:\s*\/\s*(?:mL|ml))?\s*(?:\(\d+(?:mL|ml)?\))?\s*/gi, ' ')
    .replace(/\s*\(\d+\)\s*/g, ' ')
    .replace(/\s*\/\s*$/g, '')
    .replace(/^\s*\/\s*/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Draw text that appears wrapped around a cylindrical vial surface.
 * Uses subtle letter spacing compression at edges to simulate curvature.
 */
function drawWrappedText(
  ctx: any,
  text: string,
  centerX: number,
  y: number,
  maxWidth: number,
  fontSize: number,
  fontWeight: string = 'bold',
  color: string = '#ffffff'
) {
  ctx.fillStyle = color;
  ctx.font = `${fontWeight} ${fontSize}px Inter, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  const measured = ctx.measureText(text);
  
  // If text fits easily, draw with subtle perspective effect
  if (measured.width <= maxWidth * 0.9) {
    // Draw character by character with slight compression at edges for wrap effect
    const chars = text.split('');
    const totalWidth = measured.width;
    let startX = centerX - totalWidth / 2;
    
    for (let i = 0; i < chars.length; i++) {
      const charWidth = ctx.measureText(chars[i]).width;
      const progress = (startX + charWidth / 2 - (centerX - totalWidth / 2)) / totalWidth;
      // Slight compression at edges (simulating cylinder wrap)
      const edgeFactor = 1 - Math.pow((progress - 0.5) * 2, 2) * 0.08;
      const adjustedWidth = charWidth * edgeFactor;
      
      // Slight opacity reduction at edges
      const alpha = 1 - Math.pow((progress - 0.5) * 2, 4) * 0.15;
      ctx.globalAlpha = alpha;
      ctx.fillText(chars[i], startX + adjustedWidth / 2, y);
      ctx.globalAlpha = 1.0;
      
      startX += adjustedWidth;
    }
  } else {
    // Text is too wide, just draw centered (will be scaled down by caller)
    ctx.fillText(text, centerX, y);
  }
}

/**
 * Generate a single product vial image using the real vial template photo
 * with product-specific text overlaid on the black label area
 */
async function drawVialWithLabel(productName: string): Promise<Buffer> {
  // Use the real Manus/RVR HD vial artwork as the visual base, but repaint the
  // label area before adding dynamic product text. This keeps the HD transparent
  // vial style and prevents drawing a new label on top of an already-labeled vial.
  const base = await loadImage(firstExisting(HD_VIAL_BASE_PATHS));
  const outW = base.width;
  const outH = base.height;
  const canvas = createCanvas(outW, outH);
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, outW, outH);
  ctx.drawImage(base, 0, 0, outW, outH);

  const centerX = outW / 2;

  // Coordinates tuned to the Manus HD vial assets in client/public/assets.
  // The rectangle fully covers existing Manus product text/logo while preserving
  // the glass, cap, transparent background, and overall visual design.
  const labelX = Math.round(outW * 0.305);
  const labelY = Math.round(outH * 0.365);
  const labelW = Math.round(outW * 0.390);
  const labelH = Math.round(outH * 0.445);
  const labelR = Math.round(outW * 0.020);

  // Repaint a clean, blank curved black label over the pre-labeled asset.
  const labelGrad = ctx.createLinearGradient(labelX, 0, labelX + labelW, 0);
  labelGrad.addColorStop(0, '#02050b');
  labelGrad.addColorStop(0.12, '#141922');
  labelGrad.addColorStop(0.30, '#070b12');
  labelGrad.addColorStop(0.50, '#020409');
  labelGrad.addColorStop(0.70, '#070b12');
  labelGrad.addColorStop(0.88, '#151a22');
  labelGrad.addColorStop(1, '#02050b');
  ctx.fillStyle = labelGrad;
  roundRect(ctx, labelX, labelY, labelW, labelH, labelR);
  ctx.fill();

  // Blue foil bands matching the Manus vial style.
  const bandGrad = ctx.createLinearGradient(labelX, 0, labelX + labelW, 0);
  bandGrad.addColorStop(0, '#003d65');
  bandGrad.addColorStop(0.18, '#0b78b8');
  bandGrad.addColorStop(0.50, '#55d0ff');
  bandGrad.addColorStop(0.82, '#0b78b8');
  bandGrad.addColorStop(1, '#003d65');
  ctx.fillStyle = bandGrad;
  roundRect(ctx, labelX, labelY, labelW, Math.max(12, Math.round(outH * 0.012)), 8);
  ctx.fill();
  roundRect(ctx, labelX, labelY + labelH - Math.max(12, Math.round(outH * 0.012)), labelW, Math.max(12, Math.round(outH * 0.012)), 8);
  ctx.fill();

  // Subtle cylindrical label highlights so the covered label still looks like it
  // belongs on the HD vial artwork.
  const labelShine = ctx.createLinearGradient(labelX, 0, labelX + labelW, 0);
  labelShine.addColorStop(0, 'rgba(255,255,255,0.00)');
  labelShine.addColorStop(0.18, 'rgba(255,255,255,0.13)');
  labelShine.addColorStop(0.35, 'rgba(255,255,255,0.03)');
  labelShine.addColorStop(0.77, 'rgba(255,255,255,0.09)');
  labelShine.addColorStop(1, 'rgba(255,255,255,0.00)');
  ctx.fillStyle = labelShine;
  roundRect(ctx, labelX, labelY, labelW, labelH, labelR);
  ctx.fill();

  const combined = productName.trim();
  const peptideName = extractPeptideName(combined) || 'PRODUCT';
  const dosage = extractDosage(combined);

  // Logo text; drawn dynamically instead of keeping the old product asset label.
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#d7dbe0';
  ctx.font = `900 ${Math.round(outW * 0.095)}px Inter, Arial, sans-serif`;
  ctx.fillText('RVR', centerX, labelY + labelH * 0.19);
  ctx.font = `700 ${Math.round(outW * 0.018)}px Inter, Arial, sans-serif`;
  ctx.fillStyle = '#a4acb7';
  ctx.fillText('RIVER VALLEY RESEARCH', centerX, labelY + labelH * 0.31);

  const maxNameW = labelW * 0.86;
  let nameFontSize = Math.round(outW * 0.070);
  const words = peptideName.split(/\s+/).filter(Boolean);
  let lines: string[] = [];
  while (nameFontSize >= Math.round(outW * 0.035)) {
    ctx.font = `900 ${nameFontSize}px Inter, Arial, sans-serif`;
    lines = [];
    let line = '';
    for (const word of words) {
      const test = line ? `${line} ${word}` : word;
      if (ctx.measureText(test).width > maxNameW && line) {
        lines.push(line);
        line = word;
      } else {
        line = test;
      }
    }
    if (line) lines.push(line);
    if (lines.length <= 2 && lines.every(l => ctx.measureText(l).width <= maxNameW)) break;
    nameFontSize -= 3;
  }

  ctx.fillStyle = '#ffffff';
  const nameCenterY = labelY + labelH * 0.58;
  const lineGap = nameFontSize * 1.03;
  const firstY = nameCenterY - ((Math.min(lines.length, 2) - 1) * lineGap) / 2;
  lines.slice(0, 2).forEach((line, i) => {
    ctx.font = `900 ${nameFontSize}px Inter, Arial, sans-serif`;
    ctx.fillText(line.toUpperCase(), centerX, firstY + i * lineGap);
  });

  if (dosage) {
    ctx.font = `900 ${Math.round(outW * 0.052)}px Inter, Arial, sans-serif`;
    ctx.fillStyle = '#f7f9fb';
    ctx.fillText(dosage, centerX, labelY + labelH * 0.74);
  }

  ctx.font = `700 ${Math.round(outW * 0.026)}px Inter, Arial, sans-serif`;
  ctx.fillStyle = '#d8dde3';
  ctx.fillText('Research Use Only', centerX, labelY + labelH * 0.88);

  return Buffer.from(canvas.toBuffer('image/png'));
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

/**
 * Generate a single product vial image and upload to storage
 */
export async function generateVialImage(productName: string, productSlug: string): Promise<string> {
  // Railway-native: generated vial images are served dynamically by /api/vial/:slug.png.
  // This avoids Manus/Forge storage requirements while preserving the auto-filled Image URL field.
  return `/api/vial/${productSlug}.png`;
}

/**
 * Generate hero image - returns the user's actual 3-vial photo
 */
export async function generateHeroVialsImage(
  products: Array<{ name: string }>
): Promise<string> {
  const buffer = getHeroImageBuffer();
  const fileKey = `product-vials/hero-vials.png`;
  const { url } = await storagePut(fileKey, buffer, 'image/png');
  return url;
}

/**
 * Generate a vial image and return as a buffer (for dynamic endpoint)
 */
export async function generateVialBuffer(productName: string): Promise<Buffer> {
  return drawVialWithLabel(productName);
}

export function generateHeroVialsBuffer(
  products: Array<{ name: string }>
): Buffer {
  return getHeroImageBuffer();
}
