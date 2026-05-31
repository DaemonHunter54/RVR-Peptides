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

const VIAL_TEMPLATE_PATH = path.join(__dirname, 'vial-template.png');
const HERO_IMAGE_PATH = path.join(__dirname, 'hero-3vials.png');

async function getVialTemplate(): Promise<Image> {
  if (!cachedVialTemplate) {
    cachedVialTemplate = await loadImage(VIAL_TEMPLATE_PATH);
  }
  return cachedVialTemplate;
}

function getHeroImageBuffer(): Buffer {
  if (!cachedHeroImage) {
    cachedHeroImage = fs.readFileSync(HERO_IMAGE_PATH);
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
  const template = await getVialTemplate();
  
  // Output size for product cards (smaller than template for performance)
  const outW = 528;
  const outH = 704;
  
  const canvas = createCanvas(outW, outH);
  const ctx = canvas.getContext('2d');
  
  // Draw the vial template image scaled to output size
  ctx.drawImage(template, 0, 0, outW, outH);
  
  // The black label area on the white-bg template (measured):
  // Top: 33.3%, Bottom: 76.7%, Left: 33.3%, Right: 67.4%
  const labelTop = outH * 0.333;
  const labelBottom = outH * 0.767;
  const labelLeft = outW * 0.333;
  const labelRight = outW * 0.674;
  const labelW = labelRight - labelLeft;
  const labelH = labelBottom - labelTop;
  const labelCenterX = (labelLeft + labelRight) / 2;
  
  const peptideName = extractPeptideName(productName);
  const dosage = extractDosage(productName);
  
  // === VR LOGO at top of label ===
  // Draw a simplified VR mountain logo
  const logoY = labelTop + labelH * 0.08;
  const logoSize = labelW * 0.35;
  
  // Mountain peaks
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.moveTo(labelCenterX - logoSize * 0.45, logoY + logoSize * 0.45);
  ctx.lineTo(labelCenterX - logoSize * 0.15, logoY - logoSize * 0.05);
  ctx.lineTo(labelCenterX - logoSize * 0.05, logoY + logoSize * 0.12);
  ctx.lineTo(labelCenterX + logoSize * 0.15, logoY - logoSize * 0.15);
  ctx.lineTo(labelCenterX + logoSize * 0.35, logoY + logoSize * 0.25);
  ctx.lineTo(labelCenterX + logoSize * 0.45, logoY + logoSize * 0.45);
  ctx.closePath();
  ctx.fill();
  
  // VR text above mountains
  ctx.fillStyle = '#ffffff';
  ctx.font = `bold ${Math.round(labelW * 0.14)}px Inter, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('VR', labelCenterX, logoY - logoSize * 0.08);
  
  // River curve
  ctx.beginPath();
  ctx.strokeStyle = '#4a9eff';
  ctx.lineWidth = 2.5;
  ctx.moveTo(labelCenterX - logoSize * 0.35, logoY + logoSize * 0.38);
  ctx.quadraticCurveTo(labelCenterX, logoY + logoSize * 0.28, labelCenterX + logoSize * 0.4, logoY + logoSize * 0.42);
  ctx.stroke();
  
  // === "RIVER VALLEY RESEARCH" text ===
  const companyY = labelTop + labelH * 0.28;
  drawWrappedText(ctx, 'RIVER VALLEY RESEARCH', labelCenterX, companyY, labelW * 0.85, Math.round(labelW * 0.075), '600', '#a8b8cc');
  
  // === PRODUCT NAME (large, centered) ===
  const maxNameW = labelW * 0.82;
  let nameFontSize = Math.round(labelW * 0.17);
  ctx.font = `bold ${nameFontSize}px Inter, sans-serif`;
  
  // Shrink font until it fits
  while (nameFontSize > labelW * 0.08 && ctx.measureText(peptideName).width > maxNameW) {
    nameFontSize -= 2;
    ctx.font = `bold ${nameFontSize}px Inter, sans-serif`;
  }
  
  // Word wrap if still too long
  const words = peptideName.split(/(?<=[\s\/-])|(?=[\s\/-])/);
  const lines: string[] = [];
  let curLine = '';
  
  for (const word of words) {
    const test = curLine + word;
    ctx.font = `bold ${nameFontSize}px Inter, sans-serif`;
    if (ctx.measureText(test.trim()).width > maxNameW && curLine.trim()) {
      lines.push(curLine.trim());
      curLine = word;
    } else {
      curLine = test;
    }
  }
  if (curLine.trim()) lines.push(curLine.trim());
  
  const lineSpacing = nameFontSize * 1.2;
  const nameBlockHeight = lines.length * lineSpacing;
  const nameStartY = labelTop + labelH * 0.48 - nameBlockHeight / 2 + lineSpacing / 2;
  
  for (let i = 0; i < lines.length; i++) {
    drawWrappedText(
      ctx, lines[i], labelCenterX, nameStartY + i * lineSpacing,
      maxNameW, nameFontSize, 'bold', '#ffffff'
    );
  }
  
  // === DOSAGE ===
  if (dosage) {
    const dosageY = nameStartY + lines.length * lineSpacing + nameFontSize * 0.4;
    drawWrappedText(ctx, dosage, labelCenterX, dosageY, labelW * 0.7, Math.round(labelW * 0.12), 'bold', '#e0e8f0');
  }
  
  // === "Research Use Only" at bottom ===
  const footerY = labelTop + labelH * 0.90;
  drawWrappedText(ctx, 'Research Use Only', labelCenterX, footerY, labelW * 0.8, Math.round(labelW * 0.065), '500', '#666680');
  
  return Buffer.from(canvas.toBuffer('image/png'));
}

/**
 * Generate a single product vial image and upload to storage
 */
export async function generateVialImage(productName: string, productSlug: string): Promise<string> {
  const buffer = await drawVialWithLabel(productName);
  const fileKey = `product-vials/${productSlug}.png`;
  const { url } = await storagePut(fileKey, buffer, 'image/png');
  return url;
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
