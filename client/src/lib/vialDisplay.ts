export function makeSlug(value: string): string {
  return String(value || "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

const NON_VIAL_TERMS = [
  "capsule", "capsules", "cream", "cleanser", "sunscreen", "mask", "lotion", "serum",
  "kit", "box", "card", "storage", "cap", "bottle", "spray", "dropper"
];

export function isNonVialProduct(product: any): boolean {
  const text = [product?.slug, product?.name, product?.form, product?.category, ...(product?.categories || []).map((c: any) => c?.name)]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return NON_VIAL_TERMS.some((term) => text.includes(term));
}

function escXml(value: string): string {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function normalizeDoseText(value: string): string {
  const m = String(value || "").match(/(\d+(?:,\d+)?(?:\.\d+)?)\s*(mg|mcg|iu|ml|g)(?:\s*\/\s*(ml|vial))?/i);
  if (!m) return String(value || "").toUpperCase().trim();
  const per = m[3] ? `/${m[3].toUpperCase()}` : "";
  return `${m[1]} ${m[2].toUpperCase()}${per}`;
}

function extractDosage(name: string, explicitSize?: string): string {
  const source = explicitSize && String(explicitSize).trim() ? explicitSize : name;
  const matches = String(source || "").match(/\d+(?:,\d+)?(?:\.\d+)?\s*(?:mg|mcg|iu|ml|g)(?:\s*\/\s*(?:ml|vial))?/gi);
  if (!matches?.length) return "";
  return matches.map(normalizeDoseText).join(" / ");
}

function extractPeptideName(name: string): string {
  return String(name || "")
    .replace(/\([^)]*\)/g, " ")
    .replace(/\d+(?:,\d+)?(?:\.\d+)?\s*(?:mg|mcg|iu|ml|g)(?:\s*\/\s*(?:ml|vial))?/gi, " ")
    .replace(/\s*\/\s*$/g, "")
    .replace(/^\s*\/\s*/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function estimateSvgTextWidth(text: string, fontSize: number): number {
  // Conservative approximation for bold uppercase product text. This is used only
  // to choose wrapping/font size before the browser renders the SVG.
  let units = 0;
  for (const ch of String(text || "")) {
    if (ch === " ") units += 0.32;
    else if (ch === "/") units += 0.34;
    else if (ch === "-" || ch === "(") units += 0.34;
    else if (ch === ")") units += 0.34;
    else if (ch === "1" || ch === "I" || ch === "L") units += 0.38;
    else if (ch === "M" || ch === "W") units += 0.86;
    else units += 0.66;
  }
  return units * fontSize;
}

function tokenizeLabel(text: string): string[] {
  return String(text || "")
    .trim()
    .replace(/\s*\/\s*/g, " / ")
    .replace(/\s+/g, " ")
    .split(" ")
    .filter(Boolean);
}

function wrapTokens(tokens: string[], fontSize: number, maxWidth: number, maxLines: number): string[] | null {
  const lines: string[] = [];
  let line = "";
  for (const token of tokens) {
    // Treat slashes as a preferred line break for blends instead of printing a
    // slash at the edge of the vial.
    if (token === "/") {
      if (line) {
        lines.push(line.trim());
        line = "";
      }
      continue;
    }
    const test = line ? `${line} ${token}` : token;
    if (line && estimateSvgTextWidth(test, fontSize) > maxWidth) {
      lines.push(line.trim());
      line = token;
    } else {
      line = test;
    }
    if (estimateSvgTextWidth(line, fontSize) > maxWidth) return null;
  }
  if (line) lines.push(line.trim());
  if (lines.length > maxLines) return null;
  return lines;
}

function fitSvgLines(text: string, maxWidth: number, maxLines: number, startSize: number, minSize: number): { lines: string[]; fontSize: number } {
  const clean = String(text || "").trim().replace(/\s+/g, " ");
  if (!clean) return { lines: [], fontSize: startSize };
  const tokens = tokenizeLabel(clean);
  for (let size = startSize; size >= minSize; size -= 2) {
    const wrapped = wrapTokens(tokens, size, maxWidth, maxLines);
    if (wrapped?.length && wrapped.every((l) => estimateSvgTextWidth(l, size) <= maxWidth)) {
      return { lines: wrapped, fontSize: size };
    }
  }
  // Last-resort fallback for an unusually long single token. Keep it centered
  // and compressed by SVG textLength so it cannot spill outside the vial face.
  return { lines: [clean], fontSize: minSize };
}

function textBlock(lines: string[], x: number, y: number, fontSize: number, lineHeight: number, maxWidth = 430): string {
  if (!lines.length) return "";
  const startY = y - ((lines.length - 1) * lineHeight) / 2;
  return `<text x="${x}" y="${startY}" text-anchor="middle" dominant-baseline="middle" font-family="Inter, Arial, Helvetica, sans-serif" font-size="${fontSize}" font-weight="900" fill="#005AA4">${lines.map((line, i) => {
    const needsFit = estimateSvgTextWidth(line, fontSize) > maxWidth;
    const fitAttrs = needsFit ? ` textLength="${maxWidth}" lengthAdjust="spacingAndGlyphs"` : "";
    return `<tspan x="${x}" dy="${i === 0 ? 0 : lineHeight}"${fitAttrs}>${escXml(line)}</tspan>`;
  }).join("")}</text>`;
}

function buildPhotorealVialSvg(name?: string, size?: string): string {
  const W = 1116;
  const H = 1410;
  const cx = W / 2;
  const peptideName = (extractPeptideName(name || "") || "PRODUCT").toUpperCase();
  const dosage = extractDosage(name || "", size).toUpperCase();

  const nameFit = fitSvgLines(peptideName, 410, 3, 72, 30);
  const doseFit = fitSvgLines(dosage, 410, 2, 70, 30);
  const nameLines = nameFit.lines;
  const doseLines = doseFit.lines;
  const nameFont = nameFit.fontSize;
  const doseFont = doseFit.fontSize;

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <image href="/assets/rvr-photoreal-vial-template.png" x="0" y="0" width="${W}" height="${H}" preserveAspectRatio="xMidYMid meet"/>
  <defs>
    <clipPath id="labelClip"><rect x="318" y="452" width="480" height="660" rx="72"/></clipPath>
    <linearGradient id="sheen" x1="318" y1="0" x2="798" y2="0" gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="#ffffff" stop-opacity="0"/>
      <stop offset="0.12" stop-color="#eaf4ff" stop-opacity="0.24"/>
      <stop offset="0.24" stop-color="#8fa8be" stop-opacity="0.08"/>
      <stop offset="0.78" stop-color="#eaf4ff" stop-opacity="0.18"/>
      <stop offset="1" stop-color="#ffffff" stop-opacity="0"/>
    </linearGradient>
  </defs>
  <g clip-path="url(#labelClip)">
    <rect x="318" y="452" width="480" height="660" rx="72" fill="#fff" opacity="1"/>
    <rect x="330" y="470" width="456" height="620" rx="66" fill="url(#sheen)"/>
    ${textBlock(nameLines, cx, 645, nameFont, Math.round(nameFont * 1.02))}
    <image href="/assets/rvr-company-logo-large.png" x="328" y="725" width="460" height="242" preserveAspectRatio="xMidYMid meet"/>
    ${doseLines.length ? textBlock(doseLines, cx, 1042, doseFont, Math.round(doseFont * 1.06)) : ""}
  </g>
</svg>`;
}

export function generatedVialUrl(slug: string, name?: string, size?: string): string {
  const safeSlug = makeSlug(slug || name || "preview-product") || "preview-product";
  const params = new URLSearchParams();
  if (name) params.set("name", name);
  if (size) params.set("size", size);
  params.set("v", "rvr-photoreal-adaptive-fit-v1");
  return `/api/vial/${safeSlug}.png?${params.toString()}`;
}

export function productImageUrl(product: any, variant?: any): string {
  if (!isNonVialProduct(product)) {
    const variantLabel = variant?.label ? String(variant.label) : "";
    return generatedVialUrl(product?.slug || "product", product?.name || "Product", variantLabel || product?.size || "");
  }
  return variant?.imageUrl || product?.imageUrl || "";
}
