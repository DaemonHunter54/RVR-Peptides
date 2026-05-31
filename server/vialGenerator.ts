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
  // Generate a transparent HD-style blank vial from vector/canvas pieces, then
  // render the admin-entered product name and dose onto the empty label. This
  // avoids using a pre-labeled Manus asset as the base, which caused label-on-label
  // artifacts for new products without an existing Manus image.
  const outW = 1248;
  const outH = 1248;
  const canvas = createCanvas(outW, outH);
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, outW, outH);

  const centerX = outW / 2;
  const vialX = 418;
  const vialY = 118;
  const vialW = 412;
  const vialH = 1010;
  const capH = 88;
  const neckH = 138;
  const bodyY = vialY + capH + neckH - 28;
  const bodyH = vialH - capH - neckH + 24;
  const bodyX = vialX + 28;
  const bodyW = vialW - 56;

  // Soft transparent base shadow only; the background remains transparent.
  const shadow = ctx.createRadialGradient(centerX, vialY + vialH - 28, 30, centerX, vialY + vialH - 18, 280);
  shadow.addColorStop(0, 'rgba(20, 42, 70, 0.22)');
  shadow.addColorStop(0.55, 'rgba(20, 42, 70, 0.10)');
  shadow.addColorStop(1, 'rgba(20, 42, 70, 0)');
  ctx.fillStyle = shadow;
  ctx.beginPath();
  ctx.ellipse(centerX, vialY + vialH - 15, 260, 58, 0, 0, Math.PI * 2);
  ctx.fill();

  // Glass body outer shape.
  const bodyGrad = ctx.createLinearGradient(bodyX, 0, bodyX + bodyW, 0);
  bodyGrad.addColorStop(0, 'rgba(35,150,255,0.32)');
  bodyGrad.addColorStop(0.10, 'rgba(235,250,255,0.62)');
  bodyGrad.addColorStop(0.27, 'rgba(255,255,255,0.24)');
  bodyGrad.addColorStop(0.50, 'rgba(155,210,255,0.12)');
  bodyGrad.addColorStop(0.73, 'rgba(255,255,255,0.28)');
  bodyGrad.addColorStop(0.90, 'rgba(86,185,255,0.48)');
  bodyGrad.addColorStop(1, 'rgba(0,94,190,0.34)');
  ctx.fillStyle = bodyGrad;
  roundRect(ctx, bodyX, bodyY, bodyW, bodyH, 76);
  ctx.fill();

  ctx.strokeStyle = 'rgba(80, 174, 255, 0.60)';
  ctx.lineWidth = 4;
  roundRect(ctx, bodyX + 2, bodyY + 2, bodyW - 4, bodyH - 4, 74);
  ctx.stroke();

  // Inner transparent glass fill.
  const innerGrad = ctx.createLinearGradient(bodyX + 34, 0, bodyX + bodyW - 34, 0);
  innerGrad.addColorStop(0, 'rgba(255,255,255,0.32)');
  innerGrad.addColorStop(0.22, 'rgba(255,255,255,0.10)');
  innerGrad.addColorStop(0.50, 'rgba(135,210,255,0.08)');
  innerGrad.addColorStop(0.82, 'rgba(255,255,255,0.16)');
  innerGrad.addColorStop(1, 'rgba(28,154,255,0.24)');
  ctx.fillStyle = innerGrad;
  roundRect(ctx, bodyX + 20, bodyY + 18, bodyW - 40, bodyH - 36, 60);
  ctx.fill();

  // Blue liquid/base at bottom.
  const liquidY = bodyY + bodyH - 155;
  const liquidGrad = ctx.createLinearGradient(bodyX + 40, liquidY, bodyX + bodyW - 40, liquidY);
  liquidGrad.addColorStop(0, 'rgba(25, 124, 210, 0.28)');
  liquidGrad.addColorStop(0.5, 'rgba(185, 232, 255, 0.24)');
  liquidGrad.addColorStop(1, 'rgba(20, 128, 220, 0.28)');
  ctx.fillStyle = liquidGrad;
  roundRect(ctx, bodyX + 34, liquidY, bodyW - 68, 105, 30);
  ctx.fill();
  ctx.strokeStyle = 'rgba(85,190,255,0.38)';
  ctx.lineWidth = 3;
  roundRect(ctx, bodyX + 34, liquidY, bodyW - 68, 105, 30);
  ctx.stroke();

  // Neck and shoulder glass.
  const neckX = centerX - 92;
  const neckY = vialY + capH - 6;
  const neckGrad = ctx.createLinearGradient(neckX, 0, neckX + 184, 0);
  neckGrad.addColorStop(0, 'rgba(255,255,255,0.26)');
  neckGrad.addColorStop(0.5, 'rgba(145,215,255,0.14)');
  neckGrad.addColorStop(1, 'rgba(255,255,255,0.30)');
  ctx.fillStyle = neckGrad;
  roundRect(ctx, neckX, neckY, 184, 180, 40);
  ctx.fill();

  const shoulderGrad = ctx.createLinearGradient(bodyX, 0, bodyX + bodyW, 0);
  shoulderGrad.addColorStop(0, 'rgba(35,160,255,0.22)');
  shoulderGrad.addColorStop(0.50, 'rgba(255,255,255,0.18)');
  shoulderGrad.addColorStop(1, 'rgba(35,160,255,0.22)');
  ctx.fillStyle = shoulderGrad;
  roundRect(ctx, bodyX + 8, bodyY - 52, bodyW - 16, 92, 60);
  ctx.fill();

  // Metallic cap.
  const capX = centerX - 160;
  const capY = vialY;
  const capW = 320;
  const capGrad = ctx.createLinearGradient(capX, 0, capX + capW, 0);
  capGrad.addColorStop(0, '#5e6872');
  capGrad.addColorStop(0.13, '#d9e0e7');
  capGrad.addColorStop(0.30, '#f9fbfd');
  capGrad.addColorStop(0.50, '#707984');
  capGrad.addColorStop(0.68, '#f4f7fa');
  capGrad.addColorStop(0.86, '#a9b1ba');
  capGrad.addColorStop(1, '#46515b');
  ctx.fillStyle = capGrad;
  roundRect(ctx, capX, capY, capW, capH, 38);
  ctx.fill();
  ctx.strokeStyle = 'rgba(40,50,60,0.35)';
  ctx.lineWidth = 3;
  roundRect(ctx, capX, capY, capW, capH, 38);
  ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,0.40)';
  roundRect(ctx, capX + 42, capY + 12, capW - 84, 16, 10);
  ctx.fill();

  // Blank label, fully empty before dynamic text is rendered.
  const labelX = bodyX + 42;
  const labelY = bodyY + 235;
  const labelW = bodyW - 84;
  const labelH = 405;
  const labelR = 10;
  const labelGrad = ctx.createLinearGradient(labelX, 0, labelX + labelW, 0);
  labelGrad.addColorStop(0, '#020612');
  labelGrad.addColorStop(0.18, '#1d222b');
  labelGrad.addColorStop(0.50, '#05070c');
  labelGrad.addColorStop(0.82, '#1d222b');
  labelGrad.addColorStop(1, '#020612');
  ctx.fillStyle = labelGrad;
  roundRect(ctx, labelX, labelY, labelW, labelH, labelR);
  ctx.fill();

  const bandGrad = ctx.createLinearGradient(labelX, 0, labelX + labelW, 0);
  bandGrad.addColorStop(0, '#004872');
  bandGrad.addColorStop(0.5, '#2fbaff');
  bandGrad.addColorStop(1, '#004872');
  ctx.fillStyle = bandGrad;
  roundRect(ctx, labelX, labelY, labelW, 14, 7);
  ctx.fill();
  roundRect(ctx, labelX, labelY + labelH - 14, labelW, 14, 7);
  ctx.fill();

  const combined = productName.trim();
  const peptideName = extractPeptideName(combined) || 'PRODUCT';
  const dosage = extractDosage(combined);

  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#d9dde2';
  ctx.font = `900 72px Inter, sans-serif`;
  ctx.fillText('RVR', centerX, labelY + 92);
  ctx.font = `700 16px Inter, sans-serif`;
  ctx.fillStyle = '#909aa7';
  ctx.fillText('RIVER VALLEY RESEARCH', centerX, labelY + 142);

  const maxNameW = labelW * 0.86;
  let nameFontSize = 54;
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
  const nameCenterY = labelY + 250;
  const lineGap = nameFontSize * 1.05;
  const firstY = nameCenterY - ((lines.length - 1) * lineGap) / 2;
  lines.slice(0, 2).forEach((line, i) => {
    ctx.font = `900 ${nameFontSize}px Inter, sans-serif`;
    ctx.fillText(line, centerX, firstY + i * lineGap);
  });

  if (dosage) {
    ctx.font = `900 44px Inter, sans-serif`;
    ctx.fillStyle = '#f4f7fb';
    ctx.fillText(dosage, centerX, labelY + 322);
  }

  ctx.font = `700 20px Inter, sans-serif`;
  ctx.fillStyle = '#d7dbe0';
  ctx.fillText('Research Use Only', centerX, labelY + 372);

  // Glass shine over the printed label.
  const shine = ctx.createLinearGradient(labelX, 0, labelX + labelW, 0);
  shine.addColorStop(0, 'rgba(255,255,255,0)');
  shine.addColorStop(0.18, 'rgba(255,255,255,0.16)');
  shine.addColorStop(0.32, 'rgba(255,255,255,0.04)');
  shine.addColorStop(0.78, 'rgba(255,255,255,0.10)');
  shine.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = shine;
  roundRect(ctx, labelX, labelY, labelW, labelH, labelR);
  ctx.fill();

  // Tall side highlights over glass.
  const glassShine = ctx.createLinearGradient(bodyX, 0, bodyX + bodyW, 0);
  glassShine.addColorStop(0, 'rgba(255,255,255,0)');
  glassShine.addColorStop(0.18, 'rgba(255,255,255,0.22)');
  glassShine.addColorStop(0.25, 'rgba(255,255,255,0.05)');
  glassShine.addColorStop(0.74, 'rgba(255,255,255,0.12)');
  glassShine.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = glassShine;
  roundRect(ctx, bodyX + 10, bodyY + 10, bodyW - 20, bodyH - 20, 68);
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
