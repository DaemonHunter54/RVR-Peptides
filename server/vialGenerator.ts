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
  // Generate a transparent HD-style vial for products that do not already have
  // a Manus-provided asset. This intentionally does not use the old photo
  // template, because that template includes a dark solid background.
  const outW = 900;
  const outH = 1200;
  const canvas = createCanvas(outW, outH);
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, outW, outH);

  const centerX = outW / 2;
  const vialX = 240;
  const vialY = 90;
  const vialW = 420;
  const vialH = 980;
  const capH = 105;
  const shoulderH = 150;
  const bottomH = 120;

  const peptideName = extractPeptideName(productName) || productName;
  const dosage = extractDosage(productName);

  // Soft transparent shadow only under the vial.
  const shadow = ctx.createRadialGradient(centerX, vialY + vialH - 18, 30, centerX, vialY + vialH - 12, 260);
  shadow.addColorStop(0, 'rgba(0, 55, 120, 0.24)');
  shadow.addColorStop(1, 'rgba(0, 55, 120, 0)');
  ctx.fillStyle = shadow;
  ctx.beginPath();
  ctx.ellipse(centerX, vialY + vialH - 10, 245, 50, 0, 0, Math.PI * 2);
  ctx.fill();

  // Glass body silhouette.
  const bodyGrad = ctx.createLinearGradient(vialX, 0, vialX + vialW, 0);
  bodyGrad.addColorStop(0, 'rgba(70, 170, 255, 0.10)');
  bodyGrad.addColorStop(0.10, 'rgba(255,255,255,0.55)');
  bodyGrad.addColorStop(0.24, 'rgba(90, 185, 255, 0.16)');
  bodyGrad.addColorStop(0.50, 'rgba(255,255,255,0.33)');
  bodyGrad.addColorStop(0.76, 'rgba(40, 145, 255, 0.22)');
  bodyGrad.addColorStop(0.90, 'rgba(255,255,255,0.58)');
  bodyGrad.addColorStop(1, 'rgba(40, 125, 220, 0.16)');

  ctx.fillStyle = bodyGrad;
  roundRect(ctx, vialX + 30, vialY + capH + shoulderH - 25, vialW - 60, vialH - capH - shoulderH - bottomH + 65, 72);
  ctx.fill();

  // Neck and shoulder glass.
  ctx.fillStyle = bodyGrad;
  roundRect(ctx, vialX + 118, vialY + capH - 5, vialW - 236, shoulderH + 40, 44);
  ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.36)';
  roundRect(ctx, vialX + 92, vialY + capH + 95, vialW - 184, 55, 30);
  ctx.fill();

  // Body outline/highlights.
  ctx.strokeStyle = 'rgba(255,255,255,0.70)';
  ctx.lineWidth = 5;
  roundRect(ctx, vialX + 30, vialY + capH + shoulderH - 25, vialW - 60, vialH - capH - shoulderH - bottomH + 65, 72);
  ctx.stroke();
  ctx.strokeStyle = 'rgba(0,125,255,0.45)';
  ctx.lineWidth = 4;
  roundRect(ctx, vialX + 45, vialY + capH + shoulderH - 10, vialW - 90, vialH - capH - shoulderH - bottomH + 35, 58);
  ctx.stroke();

  // Liquid/glass bottom.
  const liquidY = vialY + vialH - bottomH - 95;
  const liquidGrad = ctx.createLinearGradient(0, liquidY, 0, liquidY + 170);
  liquidGrad.addColorStop(0, 'rgba(165,215,255,0.30)');
  liquidGrad.addColorStop(1, 'rgba(70,170,255,0.50)');
  ctx.fillStyle = liquidGrad;
  roundRect(ctx, vialX + 55, liquidY, vialW - 110, 145, 38);
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.58)';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.ellipse(centerX, liquidY + 10, (vialW - 115) / 2, 18, 0, 0, Math.PI * 2);
  ctx.stroke();

  // Cap.
  const capGrad = ctx.createLinearGradient(vialX + 65, 0, vialX + vialW - 65, 0);
  capGrad.addColorStop(0, '#8d949d');
  capGrad.addColorStop(0.18, '#eef1f3');
  capGrad.addColorStop(0.50, '#727a84');
  capGrad.addColorStop(0.78, '#f5f7f9');
  capGrad.addColorStop(1, '#7d858f');
  ctx.fillStyle = capGrad;
  roundRect(ctx, vialX + 58, vialY, vialW - 116, capH, 42);
  ctx.fill();
  ctx.strokeStyle = 'rgba(0,0,0,0.22)';
  ctx.lineWidth = 3;
  roundRect(ctx, vialX + 58, vialY, vialW - 116, capH, 42);
  ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,0.35)';
  roundRect(ctx, vialX + 90, vialY + 12, vialW - 180, 18, 12);
  ctx.fill();

  // Black label with subtle blue edge bands.
  const labelX = vialX + 72;
  const labelY = vialY + 405;
  const labelW = vialW - 144;
  const labelH = 415;
  const labelGrad = ctx.createLinearGradient(labelX, 0, labelX + labelW, 0);
  labelGrad.addColorStop(0, '#020612');
  labelGrad.addColorStop(0.20, '#171b22');
  labelGrad.addColorStop(0.50, '#080b10');
  labelGrad.addColorStop(0.78, '#171c23');
  labelGrad.addColorStop(1, '#020612');
  ctx.fillStyle = labelGrad;
  roundRect(ctx, labelX, labelY, labelW, labelH, 18);
  ctx.fill();
  const bandGrad = ctx.createLinearGradient(labelX, 0, labelX + labelW, 0);
  bandGrad.addColorStop(0, '#004872');
  bandGrad.addColorStop(0.5, '#27b7ff');
  bandGrad.addColorStop(1, '#004872');
  ctx.fillStyle = bandGrad;
  roundRect(ctx, labelX, labelY, labelW, 14, 8);
  ctx.fill();
  roundRect(ctx, labelX, labelY + labelH - 14, labelW, 14, 8);
  ctx.fill();

  // Logo text/mark.
  ctx.fillStyle = '#d8dde2';
  ctx.font = `900 68px Inter, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('RVR', centerX, labelY + 95);
  ctx.font = `600 19px Inter, sans-serif`;
  ctx.fillStyle = '#8e99a6';
  ctx.fillText('RIVER VALLEY RESEARCH', centerX, labelY + 145);

  // Product name with wrapping.
  const maxNameW = labelW * 0.86;
  let nameFontSize = 56;
  const words = peptideName.split(/\s+/).filter(Boolean);
  let lines: string[] = [];
  while (nameFontSize >= 28) {
    ctx.font = `900 ${nameFontSize}px Inter, sans-serif`;
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
  const nameStartY = labelY + 235 - ((lines.length - 1) * nameFontSize * 0.58);
  lines.forEach((line, i) => {
    ctx.font = `900 ${nameFontSize}px Inter, sans-serif`;
    ctx.fillText(line, centerX, nameStartY + i * nameFontSize * 1.08);
  });

  if (dosage) {
    ctx.font = `900 50px Inter, sans-serif`;
    ctx.fillStyle = '#f2f5f8';
    ctx.fillText(dosage, centerX, labelY + 315);
  }
  ctx.font = `600 23px Inter, sans-serif`;
  ctx.fillStyle = '#d3d7dc';
  ctx.fillText('Research Use Only', centerX, labelY + 370);

  // Final glass shine over label edges.
  const shine = ctx.createLinearGradient(vialX, 0, vialX + vialW, 0);
  shine.addColorStop(0, 'rgba(255,255,255,0)');
  shine.addColorStop(0.18, 'rgba(255,255,255,0.18)');
  shine.addColorStop(0.28, 'rgba(255,255,255,0.02)');
  shine.addColorStop(0.76, 'rgba(255,255,255,0.10)');
  shine.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = shine;
  roundRect(ctx, vialX + 40, vialY + 145, vialW - 80, vialH - 185, 72);
  ctx.fill();

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
