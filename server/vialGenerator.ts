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
  path.join(process.cwd(), 'client/public/assets/rvr-company-blank-vial.png'),
  path.join(process.cwd(), 'client/public/assets/rvr-vial-template-single_c7ba8797.png'),
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

  const combined = productName.trim();
  const peptideName = extractPeptideName(combined) || 'PRODUCT';
  const dosage = extractDosage(combined);

  // Coordinates are tuned for the company blank vial artwork. The provided
  // blank already includes the correct glass, label, logo, and transparent
  // background, so we only add editable product information below the logo.
  const labelX = Math.round(outW * 0.315);
  const labelY = Math.round(outH * 0.420);
  const labelW = Math.round(outW * 0.370);
  const maxNameW = labelW * 0.94;

  const productTextY = Math.round(outH * 0.710);
  let nameFontSize = Math.round(outW * 0.044);
  const words = peptideName.split(/\s+/).filter(Boolean);
  let lines: string[] = [];
  while (nameFontSize >= Math.round(outW * 0.024)) {
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
    nameFontSize -= 2;
  }

  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#0b3767';
  const lineGap = nameFontSize * 1.02;
  const firstY = productTextY - ((Math.min(lines.length, 2) - 1) * lineGap) / 2;
  lines.slice(0, 2).forEach((line, i) => {
    ctx.font = `900 ${nameFontSize}px Inter, Arial, sans-serif`;
    ctx.fillText(line.toUpperCase(), centerX, firstY + i * lineGap);
  });

  if (dosage) {
    ctx.font = `900 ${Math.round(outW * 0.036)}px Inter, Arial, sans-serif`;
    ctx.fillStyle = '#0b3767';
    ctx.fillText(dosage, centerX, Math.round(outH * 0.765));
  }

  ctx.font = `700 ${Math.round(outW * 0.014)}px Inter, Arial, sans-serif`;
  ctx.fillStyle = '#657487';
  ctx.fillText('Research Use Only', centerX, Math.round(outH * 0.805));

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
