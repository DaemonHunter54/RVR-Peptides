import mysql, { RowDataPacket } from "mysql2/promise";
import fs from "fs";
import path from "path";
import { DEFAULT_PRODUCTS } from "../shared/rvrProductCatalog";
import {
  SITE_THEME_FIELDS,
  buildThemeBaselineSnapshot,
  VISUAL_BUILDER_BASELINE_KEY,
} from "../shared/siteTheme";

const TABLES = [
`CREATE TABLE IF NOT EXISTS users (
  id int AUTO_INCREMENT NOT NULL,
  openId varchar(64) NOT NULL,
  name text,
  email varchar(320),
  loginMethod varchar(64),
  role enum('user','admin','super_admin') NOT NULL DEFAULT 'user',
  passwordHash varchar(255),
  username varchar(100),
  phone varchar(20),
  shippingAddress text,
  savedPaymentInfo text,
  createdAt timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  lastSignedIn timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY users_openId_unique (openId)
)`,
`CREATE TABLE IF NOT EXISTS categories (
  id int AUTO_INCREMENT NOT NULL,
  name varchar(100) NOT NULL,
  slug varchar(100) NOT NULL,
  description text,
  sortOrder int NOT NULL DEFAULT 0,
  createdAt timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY categories_name_unique (name),
  UNIQUE KEY categories_slug_unique (slug)
)`,
`CREATE TABLE IF NOT EXISTS products (
  id int AUTO_INCREMENT NOT NULL,
  name varchar(255) NOT NULL,
  slug varchar(255) NOT NULL,
  description text,
  shortDescription text,
  price decimal(10,2) NOT NULL,
  compareAtPrice decimal(10,2),
  sku varchar(50),
  imageUrl text,
  size varchar(100),
  contents varchar(255),
  form varchar(100),
  purity varchar(50),
  molecularFormula varchar(255),
  molecularWeight varchar(100),
  otherNames text,
  stockQuantity int NOT NULL DEFAULT 100,
  lowStockThreshold int NOT NULL DEFAULT 10,
  inStock boolean NOT NULL DEFAULT true,
  discountPercent decimal(5,2),
  discountActive boolean NOT NULL DEFAULT false,
  coaUrl text,
  hplcUrl text,
  massSpecUrl text,
  isActive boolean NOT NULL DEFAULT true,
  isFeatured boolean NOT NULL DEFAULT false,
  sortOrder int NOT NULL DEFAULT 0,
  createdAt timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY products_slug_unique (slug)
)`,
`CREATE TABLE IF NOT EXISTS productCategories (
  id int AUTO_INCREMENT NOT NULL,
  productId int NOT NULL,
  categoryId int NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY productCategories_unique (productId, categoryId)
)`,
`CREATE TABLE IF NOT EXISTS productResearch (
  id int AUTO_INCREMENT NOT NULL,
  productId int NOT NULL,
  overview text,
  chemicalMakeup text,
  researchContent text,
  createdAt timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
)`,
`CREATE TABLE IF NOT EXISTS researchCitations (
  id int AUTO_INCREMENT NOT NULL,
  productId int NOT NULL,
  citationNumber int NOT NULL,
  title text NOT NULL,
  authors text,
  journal varchar(255),
  year varchar(10),
  url text,
  summary text,
  sortOrder int NOT NULL DEFAULT 0,
  createdAt timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
)`,
`CREATE TABLE IF NOT EXISTS researchKnowledgeTemplates (
  id int AUTO_INCREMENT NOT NULL,
  templateSlug varchar(255) NOT NULL,
  title varchar(255) NOT NULL,
  sourceSize varchar(100),
  sourceContents varchar(255),
  sourceForm varchar(100),
  sourcePurity varchar(50),
  sourceSku varchar(50),
  overview text NOT NULL,
  chemicalBlock text NOT NULL,
  researchContent text NOT NULL,
  citations json NOT NULL,
  syncedAt timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY researchKnowledgeTemplates_slug_unique (templateSlug)
)`,
`CREATE TABLE IF NOT EXISTS orders (
  id int AUTO_INCREMENT NOT NULL,
  orderNumber varchar(50) NOT NULL,
  userId int,
  guestEmail varchar(320),
  guestName varchar(255),
  status enum('pending','paid','processing','shipped','delivered','cancelled','refunded') NOT NULL DEFAULT 'pending',
  shippingName varchar(255),
  shippingAddress text,
  savedPaymentInfo text,
  shippingCity varchar(100),
  shippingState varchar(100),
  shippingZip varchar(20),
  shippingCountry varchar(100),
  trackingNumber varchar(255),
  trackingCarrier varchar(100),
  paymentMethod varchar(50) DEFAULT 'nowpayments',
  paymentId varchar(255),
  paymentStatus varchar(50),
  subtotal decimal(10,2) NOT NULL,
  discountAmount decimal(10,2) DEFAULT '0.00',
  shippingCost decimal(10,2) DEFAULT '0.00',
  total decimal(10,2) NOT NULL,
  discountCode varchar(50),
  giftCardCode varchar(9),
  giftCardAmount decimal(10,2) DEFAULT '0.00',
  notes text,
  createdAt timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY orders_orderNumber_unique (orderNumber)
)`,
`CREATE TABLE IF NOT EXISTS orderItems (
  id int AUTO_INCREMENT NOT NULL,
  orderId int NOT NULL,
  productId int NOT NULL,
  productName varchar(255) NOT NULL,
  quantity int NOT NULL,
  unitPrice decimal(10,2) NOT NULL,
  totalPrice decimal(10,2) NOT NULL,
  PRIMARY KEY (id)
)`,
`CREATE TABLE IF NOT EXISTS discountCodes (
  id int AUTO_INCREMENT NOT NULL,
  code varchar(50) NOT NULL,
  description text,
  type enum('percentage','fixed') NOT NULL DEFAULT 'percentage',
  value decimal(10,2) NOT NULL,
  minOrderAmount decimal(10,2),
  maxUses int,
  currentUses int NOT NULL DEFAULT 0,
  isActive boolean NOT NULL DEFAULT true,
  appliesToAll boolean NOT NULL DEFAULT true,
  productId int,
  startsAt timestamp NULL,
  expiresAt timestamp NULL,
  createdAt timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY discountCodes_code_unique (code)
)`,
`CREATE TABLE IF NOT EXISTS giftCards (
  id int AUTO_INCREMENT NOT NULL,
  code varchar(9) NOT NULL,
  originalAmount decimal(10,2) NOT NULL,
  balance decimal(10,2) NOT NULL,
  purchaserEmail varchar(320),
  recipientEmail varchar(320),
  orderId int,
  isActive boolean NOT NULL DEFAULT true,
  emailStatus varchar(50) DEFAULT 'pending',
  expiresAt timestamp NULL,
  lastUsedAt timestamp NULL,
  createdAt timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY giftCards_code_unique (code)
)`,
`CREATE TABLE IF NOT EXISTS giftCardTransactions (
  id int AUTO_INCREMENT NOT NULL,
  giftCardId int NOT NULL,
  orderId int,
  type enum('issue','reserve','redeem','release','void') NOT NULL,
  amount decimal(10,2) NOT NULL,
  balanceAfter decimal(10,2),
  note text,
  createdAt timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
)`,
`CREATE TABLE IF NOT EXISTS productAssets (
  id int AUTO_INCREMENT NOT NULL,
  name varchar(255) NOT NULL,
  contentType varchar(100) NOT NULL,
  data LONGBLOB NOT NULL,
  createdAt timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY productAssets_name_unique (name)
)`,
`CREATE TABLE IF NOT EXISTS siteSettings (
  id int AUTO_INCREMENT NOT NULL,
  settingKey varchar(100) NOT NULL,
  settingValue text,
  settingType enum('text','image','boolean','json','html') NOT NULL DEFAULT 'text',
  label varchar(255),
  description text,
  groupName varchar(100) DEFAULT 'general',
  updatedAt timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY siteSettings_settingKey_unique (settingKey)
)`,
`CREATE TABLE IF NOT EXISTS cartItems (
  id int AUTO_INCREMENT NOT NULL,
  userId int NOT NULL,
  productId int NOT NULL,
  quantity int NOT NULL DEFAULT 1,
  createdAt timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
)`,
`CREATE TABLE IF NOT EXISTS product_variants (
  id int AUTO_INCREMENT NOT NULL,
  productId int NOT NULL,
  label varchar(255) NOT NULL,
  price decimal(10,2) NOT NULL,
  compareAtPrice decimal(10,2),
  sku varchar(50),
  stockQuantity int NOT NULL DEFAULT 100,
  inStock boolean NOT NULL DEFAULT true,
  imageUrl text,
  sortOrder int NOT NULL DEFAULT 0,
  createdAt timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  INDEX idx_product_variants_productId (productId)
)`,
`CREATE TABLE IF NOT EXISTS pickupSlots (
  id int AUTO_INCREMENT NOT NULL,
  startsAt timestamp NOT NULL,
  endsAt timestamp NOT NULL,
  status enum('available','booked','blocked') NOT NULL DEFAULT 'available',
  orderId int,
  createdAt timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  INDEX idx_pickupSlots_startsAt (startsAt),
  INDEX idx_pickupSlots_status (status)
)`
];

const REQUIRED_COLUMNS: Array<[string, string, string]> = [
  ["users", "openId", "varchar(64)"],
  ["users", "name", "text"],
  ["users", "email", "varchar(320)"],
  ["users", "loginMethod", "varchar(64)"],
  ["users", "role", "enum('user','admin','super_admin') NOT NULL DEFAULT 'user'"],
  ["users", "passwordHash", "varchar(255)"],
  ["users", "username", "varchar(100)"],
  ["users", "phone", "varchar(20)"],
  ["users", "shippingAddress", "text"],
  ["users", "savedPaymentInfo", "text"],
  ["users", "createdAt", "timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP"],
  ["users", "updatedAt", "timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP"],
  ["users", "lastSignedIn", "timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP"],

  // Product columns that older Railway DBs may be missing. These must match drizzle/schema.ts
  // because Drizzle SELECTs all mapped columns by default.
  ["products", "description", "text"],
  ["products", "shortDescription", "text"],
  ["products", "compareAtPrice", "decimal(10,2)"],
  ["products", "sku", "varchar(50)"],
  ["products", "imageUrl", "text"],
  ["products", "size", "varchar(100)"],
  ["products", "contents", "varchar(255)"],
  ["products", "form", "varchar(100)"],
  ["products", "purity", "varchar(50)"],
  ["products", "molecularFormula", "varchar(255)"],
  ["products", "molecularWeight", "varchar(100)"],
  ["products", "otherNames", "text"],
  ["products", "stockQuantity", "int NOT NULL DEFAULT 100"],
  ["products", "lowStockThreshold", "int NOT NULL DEFAULT 10"],
  ["products", "inStock", "boolean NOT NULL DEFAULT true"],
  ["products", "discountPercent", "decimal(5,2)"],
  ["products", "discountActive", "boolean NOT NULL DEFAULT false"],
  ["products", "coaUrl", "text"],
  ["products", "hplcUrl", "text"],
  ["products", "massSpecUrl", "text"],
  ["products", "isActive", "boolean NOT NULL DEFAULT true"],
  ["products", "isFeatured", "boolean NOT NULL DEFAULT false"],
  ["products", "sortOrder", "int NOT NULL DEFAULT 0"],
  ["products", "createdAt", "timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP"],
  ["products", "updatedAt", "timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP"],

    // Variant columns for existing order/cart tables.
  ["orderItems", "variantId", "int"],
  ["orderItems", "variantLabel", "varchar(255)"],
  ["cartItems", "variantId", "int"],
  ["cartItems", "variantLabel", "varchar(255)"],

  ["productResearch", "productBrief", "text"],
  ["productResearch", "qualityNotes", "text"],
  ["productResearch", "templateSourceUrl", "text"],

  // Gift card checkout, lifecycle, and audit columns for existing Railway DBs.
  ["orders", "giftCardCode", "varchar(9)"],
  ["orders", "giftCardAmount", "decimal(10,2) DEFAULT '0.00'"],
  ["orders", "fulfillmentMethod", "varchar(32) DEFAULT 'ship'"],
  ["orders", "paymentChoice", "varchar(32) DEFAULT 'email_invoice'"],
  ["orders", "pickupSlotId", "int"],
  ["orders", "pickupSlotStart", "timestamp NULL"],
  ["giftCards", "recipientEmail", "varchar(320)"],
  ["giftCards", "emailStatus", "varchar(50) DEFAULT 'pending'"],
  ["giftCards", "expiresAt", "timestamp NULL"],
  ["giftCards", "lastUsedAt", "timestamp NULL"],
];


const DEFAULT_CATEGORIES = ["Peptides", "Blends", "Reconstitution", "Wellness", "Skin Care"];

function slugify(value: string) {
  return value.toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}


function normalizeVariantGroupName(name: string): { base: string; label: string | null } {
  let working = name.trim().replace(/\s+/g, " ");
  const hasCapsules = /\bcapsules?\b/i.test(working);

  // Keep non-vial products separate from vial variants.
  const parenMatch = working.match(/\s*\(([^)]*)\)\s*$/);
  if (parenMatch && !hasCapsules) {
    working = working.slice(0, parenMatch.index).trim();
  }

  // Capture common dose/volume suffixes while avoiding product family numbers such as SS-31 or PE-22-28.
  const doseMatch = working.match(/(?:\s|^)(\d+(?:\.\d+)?\s*(?:mg|mcg|g|iu|ml)(?:\s*\/\s*(?:ml|vial))?)(?:\s*)$/i);
  if (!doseMatch) return { base: name.trim(), label: null };

  const label = doseMatch[1].replace(/\s+/g, "");
  let base = working.slice(0, doseMatch.index).trim();
  if (!base) return { base: name.trim(), label: null };

  // Preserve dosage in the base for capsule products so capsules do not merge with vials.
  if (hasCapsules) {
    return { base: name.trim(), label: null };
  }

  return { base, label };
}

function slugifyValue(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

function stripAssetHash(filename: string) {
  const base = filename.replace(/\.(png|jpg|jpeg|webp)$/i, "");
  return base.replace(/_[a-f0-9]{8}$/i, "");
}

let _assetMap: Map<string, string> | null = null;
function getLocalAssetMap() {
  if (_assetMap) return _assetMap;
  _assetMap = new Map<string, string>();

  // First load the bundled Manus assets from client/public/assets. Railway serves these as /assets/*.
  const assetsDir = path.join(process.cwd(), "client", "public", "assets");
  try {
    for (const file of fs.readdirSync(assetsDir)) {
      if (!/\.(png|jpg|jpeg|webp)$/i.test(file)) continue;
      const key = slugifyValue(stripAssetHash(file));
      if (key && !_assetMap.has(key)) _assetMap.set(key, `/assets/${file}`);
    }
  } catch {
    // The assets directory may not exist in local tooling. Fall back to DEFAULT_PRODUCTS below.
  }

  // Keep DEFAULT_PRODUCTS as a fallback map, but do not let it override real Manus-bundled assets.
  for (const product of DEFAULT_PRODUCTS) {
    if (!_assetMap.has(product.slug)) _assetMap.set(product.slug, product.image);
  }

  return _assetMap;
}

function assetBySlug(slug: string): string | undefined {
  const normalized = slugifyValue(slug);
  return getLocalAssetMap().get(normalized);
}

const CRITICAL_PRODUCT_IMAGE_REPAIRS: Record<string, string> = {};

function criticalImageRepairAsset(row: RowDataPacket): string | undefined {
  const slug = slugifyValue(String(row.slug || ""));
  const name = slugifyValue(String(row.name || ""));
  return CRITICAL_PRODUCT_IMAGE_REPAIRS[slug] || CRITICAL_PRODUCT_IMAGE_REPAIRS[name];
}


function exactAssetByProduct(row: RowDataPacket): string | undefined {
  const overrideAsset = criticalImageRepairAsset(row);
  if (overrideAsset) return overrideAsset;

  const slug = String(row.slug || "");
  const name = String(row.name || "");
  // Only exact matches. This lets bundled Manus assets override stale/generated DB images
  // for the same product without guessing across different products.
  return assetBySlug(slug) || assetBySlug(name);
}

function assetByProduct(row: RowDataPacket): string | undefined {
  const slug = String(row.slug || "");
  const name = String(row.name || "");

  // Exact slug/name match first. This preserves the specific Manus-generated product vial.
  const exact = assetBySlug(slug) || assetBySlug(name);
  if (exact) return exact;

  // If this is a grouped parent like "bpc-157", use the lowest-dose/first matching bundled asset.
  const normalizedSlug = slugifyValue(slug);
  const normalizedName = slugifyValue(name);
  for (const [assetSlug, assetPath] of getLocalAssetMap().entries()) {
    // Do not let capsule bottle assets satisfy vial/grouped products.
    // Example: bpc-157 must stay an HD vial; only the explicit capsules slug can use bottle art.
    if (!rowIsNonVialProduct(row) && /capsule|capsules/i.test(assetSlug)) continue;
    if (assetSlug === normalizedSlug || assetSlug === normalizedName) return assetPath;
    if (normalizedSlug && assetSlug.startsWith(`${normalizedSlug}-`)) return assetPath;
    if (normalizedName && assetSlug.startsWith(`${normalizedName}-`)) return assetPath;
  }
  return undefined;
}

function localAssetExists(image: string) {
  if (!image.startsWith("/assets/")) return false;
  const filename = image.replace(/^\/assets\//, "");
  return fs.existsSync(path.join(process.cwd(), "client", "public", "assets", filename));
}


const NON_VIAL_TERMS = ["capsule", "capsules", "cream", "cleanser", "sunscreen", "mask", "lotion", "serum", "kit", "box", "card", "storage", "cap", "bottle", "spray", "dropper"];

function rowIsNonVialProduct(row: RowDataPacket): boolean {
  const slug = slugifyValue(String(row.slug || ""));
  if (slug === "bpc-157") return false;
  if (slug === "bpc-157-capsules-500mcg-30") return true;

  const text = [row.slug, row.name, row.form, row.category]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return NON_VIAL_TERMS.some((term) => text.includes(term));
}

function generatedVialUrlForRow(row: RowDataPacket): string {
  const slug = slugifyValue(String(row.slug || row.name || "product")) || "product";
  const params = new URLSearchParams();
  if (row.name) params.set("name", String(row.name));
  if (row.size || row.contents) params.set("size", String(row.size || row.contents));
  params.set("v", "rvr-photoreal-adaptive-fit-v1");
  return `/api/vial/${slug}.png?${params.toString()}`;
}

function isLegacyBundledVialAsset(value: unknown): boolean {
  const image = String(value || "").toLowerCase();
  if (!image) return false;
  if (image.startsWith("/assets/products/")) return false;

  return (
    image.includes("rvr-vial-template-single") ||
    image.includes("rvr-company-blank-vial") ||
    image.includes("bacteriostatic-water") ||
    (
      image.startsWith("/assets/") &&
      /_[0-9a-f]{8}\.(webp|png|jpg|jpeg)(?:\?|$)/i.test(image) &&
      !/(gift-card|capsule|capsules|tube|cream|cleanser|sunscreen|mask|kit|box|storage|cap)/i.test(image)
    )
  );
}

function isGeneratedOrFallbackImage(value: unknown) {
  const image = String(value || "");
  if (!image) return true;
  return (
    image.startsWith("/api/vial/") ||
    image.includes("generated-vials/") ||
    image.includes("rvr-vial-template-single") ||
    image.includes("/vials/") ||
    image.includes("placeholder") ||
    (image.startsWith("/assets/") && !localAssetExists(image))
  );
}


type NihCitation = {
  title: string;
  authors?: string;
  journal?: string;
  year?: string;
  url: string;
  summary?: string;
};

type NihResearchProfile = {
  keys: string[];
  shortDescription: string;
  description: string;
  overview: string;
  researchContent: string;
  citations: NihCitation[];
};

const NIH_RESEARCH_PROFILES: NihResearchProfile[] = [
  {
    keys: ["bpc-157", "bpc 157", "wolverine-blend", "wolverine blend"],
    shortDescription: "NIH-indexed BPC-157 literature is primarily experimental and focuses on tissue-repair and recovery models.",
    description: "NIH-indexed publications describe BPC-157 as an experimental peptide studied mainly in preclinical tissue-repair, tendon, muscle, gastrointestinal, and recovery models. Published summaries report promising research signals, while also noting that broad human validation remains limited. This material is offered for research, laboratory, or analytical use only.",
    overview: "BPC-157 research appears in NIH-indexed literature as an experimental peptide topic with most evidence coming from animal, in vitro, and early exploratory human reports.",
    researchContent: "Description\nNIH-indexed BPC-157 studies describe research interest around tissue repair, tendon and muscle models, gastrointestinal healing models, and early safety observations. The literature should be interpreted as research-focused and not as established clinical guidance.",
    citations: [
      { title: "Emerging Use of BPC-157 in Orthopaedic Sports Medicine", authors: "Vasireddi et al.", journal: "PubMed", year: "2025", url: "https://pubmed.ncbi.nlm.nih.gov/40756949/", summary: "Systematic review noting promising but low-level evidence." },
      { title: "Safety of Intravenous Infusion of BPC157 in Humans", authors: "Lee et al.", journal: "PubMed", year: "2025", url: "https://pubmed.ncbi.nlm.nih.gov/40131143/", summary: "Pilot human safety observation." },
      { title: "Gastric pentadecapeptide BPC 157 as an effective therapy...", authors: "Novinscak et al.", journal: "PubMed", year: "2008", url: "https://pubmed.ncbi.nlm.nih.gov/18668315/", summary: "Preclinical muscle-healing model." },
      { title: "Brain-gut Axis and Pentadecapeptide BPC 157", journal: "PubMed", year: "2016", url: "https://pubmed.ncbi.nlm.nih.gov/27138887/", summary: "Review of experimental brain-gut axis research." },
      { title: "Impact of pentadecapeptide BPC 157 on muscle healing...", authors: "Pevec et al.", journal: "PubMed", year: "2010", url: "https://pubmed.ncbi.nlm.nih.gov/20190676/", summary: "Preclinical muscle-healing research." },
    ],
  },
  {
    keys: ["semaglutide", "tirzepatide", "retatrutide", "cagrilintide", "cagrisema", "mazdutide", "survodutide", "glp-1"],
    shortDescription: "NIH-indexed incretin and amylin-analog literature focuses on metabolic, appetite, and body-weight endpoints.",
    description: "NIH-indexed publications on GLP-1, GIP, glucagon, and amylin-pathway analogs describe research focused on appetite, energy intake, glycemic and metabolic markers, and body-weight endpoints. Study conclusions vary by compound and population, and reported gastrointestinal tolerability is an important recurring research consideration. This material is offered for research, laboratory, or analytical use only.",
    overview: "This product belongs to a research area represented in NIH-indexed literature on incretin, amylin, and multi-agonist metabolic signaling compounds.",
    researchContent: "Description\nNIH-indexed clinical and review literature describes semaglutide, tirzepatide, retatrutide, cagrilintide, and related incretin/amylin-pathway compounds as research topics centered on energy intake, appetite regulation, glycemic markers, and body-weight outcomes. These studies are compound- and protocol-specific and should not be generalized outside a research context.",
    citations: [
      { title: "Cagrilintide-Semaglutide in Adults with Overweight or Obesity", authors: "Davies et al.", journal: "PubMed", year: "2025", url: "https://pubmed.ncbi.nlm.nih.gov/40544432/", summary: "Clinical literature on cagrilintide-semaglutide body-weight endpoints." },
      { title: "Tirzepatide as Compared with Semaglutide...", authors: "Aronne et al.", journal: "PubMed", year: "2025", url: "https://pubmed.ncbi.nlm.nih.gov/40353578/", summary: "Clinical comparison of tirzepatide and semaglutide." },
      { title: "Efficacy of GLP-1 analog peptides, semaglutide, tirzepatide and retatrutide", authors: "Hitaka et al.", journal: "PubMed", year: "2026", url: "https://pubmed.ncbi.nlm.nih.gov/41723268/", summary: "Review/meta-analysis style GLP-1 analog research." },
      { title: "Effects of once-weekly semaglutide on appetite, energy intake...", authors: "Blundell et al.", journal: "PubMed", year: "2017", url: "https://pubmed.ncbi.nlm.nih.gov/28266779/", summary: "Appetite and energy-intake endpoints." },
      { title: "Comparative effectiveness of GLP-1 receptor agonists...", authors: "Yao et al.", journal: "PubMed", year: "2024", url: "https://pubmed.ncbi.nlm.nih.gov/38286487/", summary: "Comparative GLP-1 receptor agonist research." },
    ],
  },
  {
    keys: ["ghk", "ghk-cu", "copper", "curenex", "rm-repair", "urea-cream", "sunscreen", "skin", "cleanser", "moisturizing"],
    shortDescription: "NIH-indexed copper-peptide and dermatology literature focuses on skin permeation, remodeling, and topical research models.",
    description: "NIH-indexed copper-peptide literature describes GHK and GHK-Cu as research topics in skin permeation, topical delivery, remodeling biology, and cosmetic or wound-related models. Some studies report supportive findings while others describe mixed or context-specific outcomes. This material is offered for research, laboratory, or analytical use only.",
    overview: "Copper-peptide and skin-care related products are represented in NIH-indexed literature through topical delivery, skin remodeling, permeation, and cosmetic research contexts.",
    researchContent: "Description\nNIH-indexed studies involving GHK, GHK-Cu, and related topical peptide systems focus on skin delivery, fibroblast biology, remodeling, and cosmetic research models. Results should be read as product- and protocol-specific rather than universal clinical conclusions.",
    citations: [
      { title: "Topically applied GHK as an anti-wrinkle peptide", authors: "Mortazavi et al.", journal: "PubMed", year: "2024", url: "https://pubmed.ncbi.nlm.nih.gov/39963574/", summary: "Topical GHK and GHK-Cu permeation research." },
      { title: "Microneedle-Mediated Delivery of Copper Peptide...", authors: "Li et al.", journal: "PubMed", year: "2015", url: "https://pubmed.ncbi.nlm.nih.gov/25690343/", summary: "GHK-Cu delivery and skin permeation research." },
      { title: "Stem cell recovering effect of copper-free GHK in skin", authors: "Choi et al.", journal: "PubMed", year: "2012", url: "https://pubmed.ncbi.nlm.nih.gov/23019153/", summary: "GHK skin cell research." },
      { title: "Effects of topical copper tripeptide complex on CO2 laser-resurfaced skin", authors: "Miller et al.", journal: "PubMed", year: "2006", url: "https://pubmed.ncbi.nlm.nih.gov/16847171/", summary: "Clinical-context topical copper tripeptide research." },
      { title: "In Vitro Observations on the Influence of Copper Peptide...", authors: "Huang et al.", journal: "PubMed", year: "2007", url: "https://pubmed.ncbi.nlm.nih.gov/17603859/", summary: "In vitro fibroblast/remodeling research." },
    ],
  },
  {
    keys: ["thymosin-alpha", "thymosin alpha", "tb-500", "thymosin beta", "super-wolf", "super wolf"],
    shortDescription: "NIH-indexed thymosin literature focuses on immune modulation and regenerative biology research.",
    description: "NIH-indexed thymosin literature describes thymosin alpha-1 primarily in immunomodulation research and thymosin beta-4 related topics in regenerative and tissue-repair biology. Study conclusions are context-dependent and vary by model, disease state, and study design. This material is offered for research, laboratory, or analytical use only.",
    overview: "Thymosin-family peptides are discussed in NIH-indexed literature across immune regulation, inflammatory models, and tissue-repair biology.",
    researchContent: "Description\nNIH-indexed thymosin studies include immune-regulation research involving thymosin alpha-1 and regenerative biology literature involving thymosin beta-4 related topics. These publications do not establish universal effects and should be interpreted within their stated research models.",
    citations: [
      { title: "Thymosin alpha 1 alleviates inflammation and prevents infection...", authors: "Tian et al.", journal: "PubMed", year: "2025", url: "https://pubmed.ncbi.nlm.nih.gov/40599771/", summary: "Clinical immune-regulation research context." },
      { title: "Efficacy of thymosin α1 for sepsis: a systematic review and meta-analysis", authors: "Gu et al.", journal: "PubMed", year: "2025", url: "https://pubmed.ncbi.nlm.nih.gov/40969554/", summary: "Systematic review of thymosin alpha-1 research." },
      { title: "Impact of the immunomodulating peptide thymosin alpha 1...", authors: "Binsfeld et al.", journal: "PubMed", year: "2015", url: "https://pubmed.ncbi.nlm.nih.gov/25971542/", summary: "Immunomodulation model research." },
      { title: "Thymosin β4: a multi-functional regenerative peptide", authors: "Goldstein et al.", journal: "PubMed", year: "2012", url: "https://pubmed.ncbi.nlm.nih.gov/22074294/", summary: "Review of thymosin beta-4 regenerative biology." },
      { title: "The efficacy of thymosin alpha-1 therapy in moderate to critical COVID-19 patients", authors: "Soeroto et al.", journal: "PubMed", year: "2023", url: "https://pubmed.ncbi.nlm.nih.gov/37845598/", summary: "Clinical-context thymosin alpha-1 research." },
    ],
  },
  {
    keys: ["tesamorelin", "sermorelin", "ipamorelin", "cjc-1295", "cjc 1295"],
    shortDescription: "NIH-indexed GHRH/GH-secretagogue literature focuses on GH/IGF-1 signaling and metabolic endpoints.",
    description: "NIH-indexed literature on tesamorelin, sermorelin, CJC-1295, and ipamorelin describes research on growth-hormone releasing hormone analogs and selective growth-hormone secretagogue signaling. Reported endpoints include GH/IGF-1 response, metabolic markers, visceral adipose tissue, and safety/tolerability observations depending on the study. This material is offered for research, laboratory, or analytical use only.",
    overview: "GHRH analog and GH-secretagogue research appears in NIH-indexed literature through endocrine signaling, GH/IGF-1 response, and metabolic endpoint studies.",
    researchContent: "Description\nNIH-indexed studies describe growth-hormone releasing hormone analogs and GH secretagogues as research tools for evaluating GH/IGF-1 signaling and metabolic endpoints. Findings are specific to the compound, population, and study protocol.",
    citations: [
      { title: "Effect of tesamorelin on visceral fat and liver fat...", authors: "Stanley et al.", journal: "PubMed", year: "2014", url: "https://pubmed.ncbi.nlm.nih.gov/25038357/", summary: "Tesamorelin metabolic endpoint research." },
      { title: "Safety and metabolic effects of tesamorelin...", authors: "Clemmons et al.", journal: "PubMed", year: "2017", url: "https://pubmed.ncbi.nlm.nih.gov/28617838/", summary: "Tesamorelin safety/metabolic research." },
      { title: "Efficacy and safety of tesamorelin in people with HIV...", authors: "Russo et al.", journal: "PubMed", year: "2024", url: "https://pubmed.ncbi.nlm.nih.gov/38905488/", summary: "Tesamorelin clinical-context analysis." },
      { title: "Sermorelin: a review of its use...", authors: "Prakash et al.", journal: "PubMed", year: "1999", url: "https://pubmed.ncbi.nlm.nih.gov/18031173/", summary: "Sermorelin review." },
      { title: "Ipamorelin, the first selective growth hormone secretagogue", authors: "Raun et al.", journal: "PubMed", year: "1998", url: "https://pubmed.ncbi.nlm.nih.gov/9849822/", summary: "Ipamorelin GH-secretagogue selectivity research." },
    ],
  },
  {
    keys: ["kpv"],
    shortDescription: "NIH-indexed KPV literature focuses on melanocortin-derived anti-inflammatory research models.",
    description: "NIH-indexed publications describe KPV as a melanocortin-derived tripeptide studied in anti-inflammatory signaling models, including intestinal and airway inflammation systems. Reported conclusions are largely model-specific and should be interpreted as research findings rather than clinical direction. This material is offered for research, laboratory, or analytical use only.",
    overview: "KPV is represented in NIH-indexed literature as a melanocortin-derived peptide studied for inflammation signaling and model-system research.",
    researchContent: "Description\nNIH-indexed KPV studies describe anti-inflammatory signaling in preclinical and mechanistic models, with research focused on pathways such as epithelial uptake, NF-kB signaling, and melanocortin-related biology.",
    citations: [
      { title: "Melanocortin-derived tripeptide KPV has anti-inflammatory properties", authors: "Kannengiesser et al.", journal: "PubMed", year: "2008", url: "https://pubmed.ncbi.nlm.nih.gov/18092346/", summary: "KPV anti-inflammatory research in colitis models." },
      { title: "PepT1-mediated tripeptide KPV uptake reduces intestinal inflammation", authors: "Dalmasso et al.", journal: "PubMed", year: "2008", url: "https://pubmed.ncbi.nlm.nih.gov/18061177/", summary: "KPV uptake and intestinal inflammation model." },
      { title: "Dissection of the anti-inflammatory effect of the core and C-terminal MSH peptides", authors: "Getting et al.", journal: "PubMed", year: "2003", url: "https://pubmed.ncbi.nlm.nih.gov/12750433/", summary: "Mechanistic anti-inflammatory peptide research." },
      { title: "Mechanism of KPV action and a role for MC3R agonists", authors: "Land et al.", journal: "PubMed", year: "2012", url: "https://pubmed.ncbi.nlm.nih.gov/22837805/", summary: "KPV/NF-kB signaling research." },
      { title: "Critical role of PepT1 in promoting colitis-associated cancer...", authors: "Viennois et al.", journal: "PubMed", year: "2016", url: "https://pubmed.ncbi.nlm.nih.gov/27458604/", summary: "KPV in colitis-associated model research." },
    ],
  },
  {
    keys: ["mots-c", "ss-31", "nad", "l-carnitine", "glutathione"],
    shortDescription: "NIH-indexed mitochondrial and redox literature focuses on metabolism, mitochondrial function, and oxidative-stress models.",
    description: "NIH-indexed literature on mitochondrial-derived peptides, elamipretide/SS-31, NAD-related biology, glutathione, and L-carnitine focuses on mitochondrial function, metabolic signaling, redox biology, and oxidative-stress models. Research conclusions are pathway- and model-specific. This material is offered for research, laboratory, or analytical use only.",
    overview: "Mitochondrial and redox-oriented products are represented in NIH-indexed literature through metabolism, mitochondrial quality-control, oxidative-stress, and cellular energetics research.",
    researchContent: "Description\nNIH-indexed mitochondrial peptide and redox literature describes research focused on mitochondrial function, metabolic dysfunction, oxidative stress, and cellular energetics. These topics should be interpreted as mechanistic or clinical-study findings rather than universal product claims.",
    citations: [
      { title: "MOTS-c peptide regulates adipose homeostasis...", authors: "Lu et al.", journal: "PubMed", year: "2019", url: "https://pubmed.ncbi.nlm.nih.gov/30725119/", summary: "MOTS-c metabolic model research." },
      { title: "A mitochondrial-derived peptide MOTS-c contributes to...", authors: "Bai et al.", journal: "PubMed", year: "2025", url: "https://pubmed.ncbi.nlm.nih.gov/40753494/", summary: "MOTS-c inflammatory/neurologic model research." },
      { title: "Orally administered MOTS-c analogue ameliorates...", authors: "Jiang et al.", journal: "PubMed", year: "2023", url: "https://pubmed.ncbi.nlm.nih.gov/36528071/", summary: "MOTS-c analogue experimental IBD model." },
      { title: "Elamipretide (SS-31) improves mitochondrial dysfunction...", authors: "Zhao et al.", journal: "PubMed", year: "2019", url: "https://pubmed.ncbi.nlm.nih.gov/31747905/", summary: "SS-31 mitochondrial dysfunction model." },
      { title: "SS-31 as a Mitochondrial Protectant...", authors: "Zhang et al.", journal: "PubMed", year: "2022", url: "https://pubmed.ncbi.nlm.nih.gov/35984013/", summary: "SS-31 tendon-healing mitochondrial model." },
    ],
  },
  {
    keys: ["selank", "semax", "dsip", "pe-22-28", "pinealon", "epithalon", "epitalon"],
    shortDescription: "NIH-indexed neuropeptide literature focuses on cytokine, sleep, neuroendocrine, and neurologic research models.",
    description: "NIH-indexed literature on Selank, Semax, DSIP, Epitalon/Epithalon, and related neuropeptide topics describes research in cytokine modulation, sleep measures, neuroendocrine signaling, neurologic model systems, and aging-related peptide research. Evidence strength varies substantially by compound and study model. This material is offered for research, laboratory, or analytical use only.",
    overview: "Neuropeptide and pineal-peptide topics appear in NIH-indexed literature across sleep research, cytokine biology, neurologic models, and aging-related studies.",
    researchContent: "Description\nNIH-indexed literature in this group is heterogeneous. Some publications describe measurable cytokine, sleep, neuroendocrine, or neurologic-model effects, while others report limited or model-specific findings. Descriptions should be read as summaries of research topics, not clinical claims.",
    citations: [
      { title: "The Influence of Selank on the Level of Cytokines...", authors: "Leonidovna et al.", journal: "PubMed", year: "2021", url: "https://pubmed.ncbi.nlm.nih.gov/32621722/", summary: "Selank cytokine research." },
      { title: "The Molecular Aspects of Heptapeptide Selank Biological Activity", authors: "Vyunova et al.", journal: "PubMed", year: "2018", url: "https://pubmed.ncbi.nlm.nih.gov/30255741/", summary: "Selank molecular mechanism research." },
      { title: "Semax peptide targets the μ opioid receptor gene Oprm1...", authors: "Liu et al.", journal: "PubMed", year: "2025", url: "https://pubmed.ncbi.nlm.nih.gov/40692165/", summary: "Semax neurologic-model research." },
      { title: "Effects of delta sleep-inducing peptide on sleep...", authors: "Bes et al.", journal: "PubMed", year: "1992", url: "https://pubmed.ncbi.nlm.nih.gov/1299794/", summary: "DSIP sleep research with limited clinical significance." },
      { title: "Overview of Epitalon—Highly Bioactive Pineal Tetrapeptide", authors: "Araj et al.", journal: "PubMed", year: "2025", url: "https://pubmed.ncbi.nlm.nih.gov/40141333/", summary: "Epitalon review literature." },
    ],
  },
  {
    keys: ["melanotan", "pt-141", "bremelanotide"],
    shortDescription: "NIH-indexed melanocortin literature focuses on melanocortin signaling, pigmentation, and neuroendocrine research.",
    description: "NIH-indexed melanocortin literature describes research involving melanocortin signaling, pigmentation pathways, neuroendocrine response, and bremelanotide-related topics. Safety and adverse-event reports are an important part of the published record. This material is offered for research, laboratory, or analytical use only.",
    overview: "Melanocortin peptides are represented in NIH-indexed literature through pigmentation, neuroendocrine signaling, and safety/adverse-event research contexts.",
    researchContent: "Description\nNIH-indexed literature involving melanocortin peptides includes pigmentation and neuroendocrine signaling research as well as case reports and safety considerations. Product-specific interpretation requires reading the individual study context.",
    citations: [
      { title: "Melanotan II injection resulting in systemic toxicity...", journal: "PubMed", year: "2012", url: "https://pubmed.ncbi.nlm.nih.gov/23121206/", summary: "Safety/adverse event case report." },
      { title: "The hormonal regulation of men's sexual desire, arousal...", authors: "Rastrelli et al.", journal: "PubMed", year: "2025", url: "https://pubmed.ncbi.nlm.nih.gov/40519205/", summary: "Neuroendocrine peptide signaling review." },
      { title: "Integration of the reproductive and energy balance axes...", journal: "PubMed", year: "2012", url: "https://pubmed.ncbi.nlm.nih.gov/22442260/", summary: "Melanocortin-related neuroendocrine discussion." },
      { title: "PubMed search: melanotan peptide", journal: "NIH/PubMed", year: "Current", url: "https://pubmed.ncbi.nlm.nih.gov/?term=melanotan+peptide", summary: "Current NIH-indexed melanotan literature search." },
      { title: "PubMed search: bremelanotide melanocortin", journal: "NIH/PubMed", year: "Current", url: "https://pubmed.ncbi.nlm.nih.gov/?term=bremelanotide+melanocortin", summary: "Current NIH-indexed bremelanotide/melanocortin literature search." },
    ],
  },
  {
    keys: ["kisspeptin", "oxytocin"],
    shortDescription: "NIH-indexed kisspeptin and oxytocin literature focuses on reproductive and neuroendocrine signaling research.",
    description: "NIH-indexed literature describes kisspeptin and oxytocin as neuroendocrine signaling topics studied in reproductive-axis, endocrine, behavioral, and biomarker research contexts. Conclusions are model- and population-specific. This material is offered for research, laboratory, or analytical use only.",
    overview: "Kisspeptin and oxytocin are represented in NIH-indexed literature through reproductive-axis and neuroendocrine signaling research.",
    researchContent: "Description\nNIH-indexed kisspeptin and oxytocin publications discuss endocrine signaling, reproductive-axis biology, and related neuroendocrine models. These summaries are for research context only.",
    citations: [
      { title: "Sex-dependent increases in oxytocin levels in response to kisspeptin", authors: "Galbiati et al.", journal: "PubMed", year: "2025", url: "https://pubmed.ncbi.nlm.nih.gov/39965102/", summary: "Kisspeptin and oxytocin response research." },
      { title: "The effect of oxytocin and Kisspeptin-10 in ovary and uterus", authors: "Aslan et al.", journal: "PubMed", year: "2017", url: "https://pubmed.ncbi.nlm.nih.gov/28805600/", summary: "Reproductive tissue model research." },
      { title: "Changes of placental Kiss-1 mRNA expression...", authors: "Torricelli et al.", journal: "PubMed", year: "2008", url: "https://pubmed.ncbi.nlm.nih.gov/19017815/", summary: "Placental kisspeptin/oxytocin secretion research." },
      { title: "Neuroendocrine Mechanisms Involved in Male Sexual and Emotional Behavior", authors: "Iovino et al.", journal: "PubMed", year: "2019", url: "https://pubmed.ncbi.nlm.nih.gov/30706797/", summary: "Neuroendocrine signaling review." },
      { title: "PubMed search: kisspeptin oxytocin", journal: "NIH/PubMed", year: "Current", url: "https://pubmed.ncbi.nlm.nih.gov/?term=kisspeptin+oxytocin", summary: "Current NIH-indexed literature search." },
    ],
  },
];

const NIH_GENERIC_RESEARCH_PROFILE: NihResearchProfile = {
  keys: [],
  shortDescription: "NIH/PubMed resources are provided for research-context review.",
  description: "NIH/PubMed resources are provided below for research-context review. This product is offered for research, laboratory, or analytical use only, and the listed sources should be reviewed directly for product-specific conclusions and limitations.",
  overview: "This product page includes NIH/PubMed resources for research-context review.",
  researchContent: "Description\nNIH/PubMed resources are provided for research-context review. The underlying literature should be interpreted directly and in context; this description is not clinical guidance.",
  citations: [
    { title: "NIH/PubMed peptide literature search", journal: "NIH/PubMed", year: "Current", url: "https://pubmed.ncbi.nlm.nih.gov/?term=peptide+research", summary: "Current NIH-indexed peptide research literature search." },
    { title: "NIH/PubMed pharmacology literature search", journal: "NIH/PubMed", year: "Current", url: "https://pubmed.ncbi.nlm.nih.gov/?term=pharmacology+research", summary: "Current NIH-indexed pharmacology research literature search." },
    { title: "NIH/PubMed laboratory reagent literature search", journal: "NIH/PubMed", year: "Current", url: "https://pubmed.ncbi.nlm.nih.gov/?term=laboratory+reagent+research", summary: "Current NIH-indexed reagent research literature search." },
    { title: "NIH/PubMed analytical chemistry literature search", journal: "NIH/PubMed", year: "Current", url: "https://pubmed.ncbi.nlm.nih.gov/?term=analytical+chemistry+research", summary: "Current NIH-indexed analytical chemistry research literature search." },
    { title: "NIH/PubMed toxicology literature search", journal: "NIH/PubMed", year: "Current", url: "https://pubmed.ncbi.nlm.nih.gov/?term=toxicology+research", summary: "Current NIH-indexed toxicology research literature search." },
  ],
};

function getNihResearchProfile(row: RowDataPacket): NihResearchProfile {
  const haystack = `${String(row.slug || "")} ${String(row.name || "")}`.toLowerCase();
  return NIH_RESEARCH_PROFILES.find((profile) => profile.keys.some((key) => haystack.includes(key))) || NIH_GENERIC_RESEARCH_PROFILE;
}

async function ensureNihResearchDescriptions(conn: mysql.Connection) {
  console.log("[DB init] NIH research auto-seed disabled; preserving admin-entered descriptions, research details, and citations.");
  return;
  const [rows] = await conn.execute<RowDataPacket[]>(`SELECT id, name, slug FROM products ORDER BY id ASC`);
  if (!rows.length) return;

  for (const row of rows) {
    const profile = getNihResearchProfile(row);

    await conn.execute(
      `UPDATE products SET shortDescription = ?, description = ? WHERE id = ?`,
      [profile.shortDescription, profile.description, row.id]
    );

    await conn.execute(`DELETE FROM productResearch WHERE productId = ?`, [row.id]);
    await conn.execute(
      `INSERT INTO productResearch (productId, overview, chemicalMakeup, researchContent)
       VALUES (?, ?, NULL, ?)`,
      [row.id, profile.overview, profile.researchContent]
    );

    await conn.execute(`DELETE FROM researchCitations WHERE productId = ?`, [row.id]);

    for (let i = 0; i < profile.citations.length; i++) {
      const citation = profile.citations[i];
      await conn.execute(
        `INSERT INTO researchCitations (productId, citationNumber, title, authors, journal, year, url, summary, sortOrder)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          row.id,
          i + 1,
          citation.title,
          citation.authors || null,
          citation.journal || "NIH/PubMed",
          citation.year || null,
          citation.url,
          citation.summary || null,
          i,
        ]
      );
    }
  }

  console.log(`[DB init] NIH/PubMed descriptions and citations verified for ${rows.length} products.`);
}


async function ensureDescriptionsHiddenAndFeaturedDefaults(conn: mysql.Connection) {
  await conn.execute(`UPDATE products SET description = '', isFeatured = false`);
  await conn.execute(`UPDATE productResearch SET researchContent = TRIM(REPLACE(REPLACE(researchContent, CONCAT('Research summary for ', COALESCE((SELECT name FROM products WHERE products.id = productResearch.productId), '')), ''), 'Research summary for', '')) WHERE researchContent LIKE '%Research summary for%'`);
}

async function ensureProductDisplayData(conn: mysql.Connection) {
  const [rows] = await conn.execute<RowDataPacket[]>(
    `SELECT id, name, slug, price, imageUrl, size, contents, form, isActive, sortOrder FROM products ORDER BY sortOrder ASC, id ASC`
  );

  if (!rows.length) return;

  // Repair product image paths without changing the frontend layout/design.
  // Manus bundled the real product images in client/public/assets and they are served as /assets/*.
  // Older deployments left generic/generated vial paths in the DB. If a product has an exact
  // bundled Manus asset for its slug/name, that asset is the source of truth and should replace
  // stale DB values. For products without an exact bundled asset, only repair missing/generated
  // fallback paths.
  for (const row of rows) {
    const currentImage = String(row.imageUrl || "");

    const exactAsset = exactAssetByProduct(row);
    const repairAsset = exactAsset || assetByProduct(row);

    // Vial products with a bundled exact product image should be repaired to that
    // product-specific asset if a previous edit saved a blank/generated preview.
    // Products without a bundled asset fall back to the HD vial renderer.
    if (!rowIsNonVialProduct(row)) {
      if (isGeneratedOrFallbackImage(currentImage) || isLegacyBundledVialAsset(currentImage)) {
        const repairedVialUrl = repairAsset || generatedVialUrlForRow(row);
        await conn.execute(`UPDATE products SET imageUrl = ? WHERE id = ?`, [repairedVialUrl, row.id]);
        row.imageUrl = repairedVialUrl;
      }
      continue;
    }

    // Never overwrite a real admin-selected product image during startup.
    // Only repair missing/generated/fallback image URLs. This keeps product
    // edits hard-saved in the database and prevents redeploys from reverting
    // products back to cached/template images.
    if (repairAsset && isGeneratedOrFallbackImage(currentImage)) {
      await conn.execute(`UPDATE products SET imageUrl = ? WHERE id = ?`, [repairAsset, row.id]);
      row.imageUrl = repairAsset;
    }
  }

  const groups = new Map<string, RowDataPacket[]>();
  for (const row of rows) {
    const { base, label } = normalizeVariantGroupName(String(row.name));
    if (!label) continue;
    const key = slugifyValue(base);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(row);
  }

  for (const [baseSlug, group] of groups.entries()) {
    if (group.length < 2) continue;

    const baseName = normalizeVariantGroupName(String(group[0].name)).base;
    const sorted = [...group].sort((a, b) => Number(a.price) - Number(b.price));
    const canonical = sorted[0];
    const canonicalAsset = rowIsNonVialProduct(canonical)
      ? assetByProduct(canonical) || String(canonical.imageUrl || "")
      : assetByProduct(canonical) || generatedVialUrlForRow(canonical);

    // Use one visible parent product and turn sibling dose rows into variants.
    await conn.execute(
      `UPDATE products SET name = ?, slug = ?, price = ?, imageUrl = ?, isActive = true WHERE id = ?`,
      [baseName, baseSlug, canonical.price, canonicalAsset || canonical.imageUrl, canonical.id]
    );

    for (let i = 0; i < sorted.length; i++) {
      const row = sorted[i];
      const { label } = normalizeVariantGroupName(String(row.name));
      if (!label) continue;
      const variantImage = rowIsNonVialProduct(row)
        ? assetByProduct(row) || row.imageUrl || canonicalAsset || null
        : assetByProduct(row) || generatedVialUrlForRow(row);
      await conn.execute(
        `INSERT INTO product_variants (productId, label, price, imageUrl, stockQuantity, inStock, sortOrder)
         SELECT ?, ?, ?, ?, 100, true, ? FROM DUAL
         WHERE NOT EXISTS (SELECT 1 FROM product_variants WHERE productId = ? AND label = ?)`,
        [canonical.id, label, row.price, variantImage, i, canonical.id, label]
      );
    }

    const duplicateIds = sorted.filter((row) => Number(row.id) !== Number(canonical.id)).map((row) => Number(row.id));
    if (duplicateIds.length > 0) {
      await conn.query(`UPDATE products SET isActive = false WHERE id IN (${duplicateIds.map(() => "?").join(",")})`, duplicateIds);
    }
  }
}

async function ensureDefaultCatalog(conn: mysql.Connection) {
  const [productCountRows] = await conn.execute<RowDataPacket[]>(`SELECT COUNT(*) as count FROM products`);
  const productCount = Number(productCountRows[0]?.count || 0);
  if (productCount > 0) return;

  console.log("[DB init] Products table is empty; seeding default catalog from bundled assets...");

  for (let i = 0; i < DEFAULT_CATEGORIES.length; i++) {
    const name = DEFAULT_CATEGORIES[i];
    await conn.execute(
      `INSERT IGNORE INTO categories (name, slug, description, sortOrder) VALUES (?, ?, ?, ?)`,
      [name, slugify(name), `${name} products`, i]
    );
  }

  const categoryIds = new Map<string, number>();
  const [categoryRows] = await conn.execute<RowDataPacket[]>(`SELECT id, name FROM categories`);
  for (const row of categoryRows) categoryIds.set(String(row.name), Number(row.id));

  for (let i = 0; i < DEFAULT_PRODUCTS.length; i++) {
    const product = DEFAULT_PRODUCTS[i];
    await conn.execute(
      `INSERT IGNORE INTO products (name, slug, shortDescription, description, price, imageUrl, size, form, purity, stockQuantity, inStock, isActive, isFeatured, sortOrder)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        product.name,
        product.slug,
        "Research-grade product for laboratory and analytical use only.",
        "For research, laboratory, or analytical purposes only. Not for human consumption.",
        product.price,
        product.image,
        "Research size",
        "Lyophilized powder",
        "99%+",
        100,
        true,
        true,
        i < 12,
        i,
      ]
    );

    const [productRows] = await conn.execute<RowDataPacket[]>(`SELECT id FROM products WHERE slug = ? LIMIT 1`, [product.slug]);
    const productId = Number(productRows[0]?.id || 0);
    const categoryId = categoryIds.get(product.category);
    if (productId && categoryId) {
      await conn.execute(
        `INSERT IGNORE INTO productCategories (productId, categoryId) VALUES (?, ?)`,
        [productId, categoryId]
      );
    }
  }

  console.log(`[DB init] Seeded ${DEFAULT_PRODUCTS.length} products.`);
}

let initialized = false;
let initPromise: Promise<void> | null = null;


async function ensureConfiguredSuperAdmin(conn: mysql.Connection) {
  const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const adminUsername = process.env.ADMIN_USERNAME?.trim().toLowerCase();

  if (adminEmail) {
    await conn.execute("UPDATE users SET role = 'super_admin' WHERE LOWER(email) = ?", [adminEmail]);
  }
  if (adminUsername) {
    await conn.execute("UPDATE users SET role = 'super_admin' WHERE LOWER(username) = ?", [adminUsername]);
  }
}

async function ensureProductColumnTypes(conn: mysql.Connection) {
  const statements = [
    "ALTER TABLE products MODIFY COLUMN description LONGTEXT",
    "ALTER TABLE products MODIFY COLUMN shortDescription LONGTEXT",
    "ALTER TABLE products MODIFY COLUMN imageUrl TEXT",
    "ALTER TABLE products MODIFY COLUMN otherNames TEXT",
    "ALTER TABLE products MODIFY COLUMN coaUrl TEXT",
    "ALTER TABLE products MODIFY COLUMN hplcUrl TEXT",
    "ALTER TABLE products MODIFY COLUMN massSpecUrl TEXT",
  ];

  for (const statement of statements) {
    try {
      await conn.execute(statement);
    } catch (error) {
      console.warn("[DB init] Could not normalize product column type:", statement, error);
    }
  }
}


async function ensurePickupSlotStatusEnum(conn: mysql.Connection) {
  try {
    await conn.execute(
      "ALTER TABLE pickupSlots MODIFY COLUMN status enum('available','booked','blocked') NOT NULL DEFAULT 'available'"
    );
  } catch (error) {
    console.warn("[DB init] Could not normalize pickupSlots.status enum:", error);
  }
}

async function ensureUserRoleEnum(conn: mysql.Connection) {
  try {
    await conn.execute("ALTER TABLE users MODIFY COLUMN role enum('user','admin','super_admin') NOT NULL DEFAULT 'user'");
  } catch (error) {
    console.warn("[DB init] Could not normalize users.role enum:", error);
  }
}

async function addColumnIfMissing(conn: mysql.Connection, table: string, column: string, definition: string) {
  const [rows] = await conn.execute<RowDataPacket[]>(
    `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ? LIMIT 1`,
    [table, column]
  );
  if (rows.length === 0) {
    console.log(`[DB init] Adding missing column ${table}.${column}`);
    await conn.execute(`ALTER TABLE \`${table}\` ADD COLUMN \`${column}\` ${definition}`);
  }
}


async function migrateLegacyContactEmails(conn: mysql.Connection) {
  const ownerEmail = "rvrpeptides@gmail.com";
  const legacyEmails = [
    "support@rvrpeptides.com",
    "customerservice@rvrpeptides.com",
    "orders@rvrpeptides.com",
    "mailinglist@rvrpeptides.com",
    "rvrtrainingandconsulting@gmail.com",
  ];
  const keys = [
    "contact_email",
    "customer_service_email",
    "orders_email",
    "mailing_list_email",
    "admin_inbox_email",
  ];

  for (const key of keys) {
    try {
      await conn.execute(
        `UPDATE siteSettings
         SET settingValue = ?
         WHERE settingKey = ?
           AND (
             settingValue IS NULL
             OR TRIM(settingValue) = ''
             OR LOWER(TRIM(settingValue)) IN (${legacyEmails.map(() => "?").join(", ")})
           )`,
        [ownerEmail, key, ...legacyEmails]
      );
    } catch (error) {
      console.warn(`[DB init] Could not migrate ${key} to owner inbox:`, error);
    }
  }
}

async function ensureDefaultSiteSettings(conn: mysql.Connection) {
  // Seed known admin settings only when missing. Never overwrite existing values;
  // admin changes must survive restarts, deploys, and redeploys.
  const defaults: Array<[string, string, string, string, string]> = [
    ["nowpayments_api_key", "", "text", "NowPayments API Key (legacy)", "payments"],
    ["nowpayments_ipn_secret", "", "text", "NowPayments IPN Secret (legacy)", "payments"],
    ["nowpayments_webhook_url", "", "text", "NowPayments Webhook URL (legacy)", "payments"],
    ["nowpayments_sandbox_mode", "false", "boolean", "NowPayments Sandbox Mode (legacy)", "payments"],
    ["paymentcloud_gateway", "authorize_net", "text", "PaymentCloud Gateway", "payments"],
    ["paymentcloud_api_login_id", "", "text", "Authorize.net API Login ID", "payments"],
    ["paymentcloud_transaction_key", "", "text", "Authorize.net Transaction Key", "payments"],
    ["paymentcloud_security_key", "", "text", "NMI Security Key", "payments"],
    ["paymentcloud_sandbox_mode", "true", "boolean", "PaymentCloud Sandbox Mode", "payments"],
    ["paymentcloud_billing_descriptor", "RVR Peptides LLC", "text", "Billing Descriptor", "payments"],
    ["business_legal_name", "River Valley Research Peptides LLC", "text", "Legal Business Name", "general"],
    ["flat_rate_shipping", "0", "text", "Flat Rate Shipping", "shipping"],
    ["contact_email", "rvrpeptides@gmail.com", "text", "Contact Email", "contact"],
    ["contact_phone", "", "text", "Contact Phone", "contact"],
    ["customer_service_email", "rvrpeptides@gmail.com", "text", "Customer Service Email", "contact"],
    ["orders_email", "rvrpeptides@gmail.com", "text", "Orders Email", "contact"],
    ["mailing_list_email", "rvrpeptides@gmail.com", "text", "Mailing List Email", "contact"],
    ["admin_inbox_email", "rvrpeptides@gmail.com", "text", "Admin Inbox Email (Gmail hub)", "contact"],
    ["logo_url", "", "image", "Logo URL", "branding"],
    ["site_description", "", "text", "Site Description", "general"],
    ["site_tagline", "", "text", "Site Tagline", "general"],
    ["footer_disclaimer", "", "text", "Footer Disclaimer", "general"],
    ["hero_bg_color", "", "text", "Hero Background Color", "branding"],
    ["hero_text_color", "", "text", "Hero Text Color", "branding"],
    ["accent_color", "", "text", "Accent Color", "branding"],
    ["banner_enabled", "false", "boolean", "Banner Enabled", "branding"],
    ["banner_text", "", "text", "Banner Text", "branding"],
    ["banner_bg_color", "", "text", "Banner Background Color", "branding"],
    ["banner_text_color", "", "text", "Banner Text Color", "branding"],
  ];

  for (const [key, value, type, label, groupName] of defaults) {
    await conn.execute(
      `INSERT INTO siteSettings (settingKey, settingValue, settingType, label, groupName)
       VALUES (?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         settingType = COALESCE(settingType, VALUES(settingType)),
         label = COALESCE(label, VALUES(label)),
         groupName = COALESCE(groupName, VALUES(groupName))`,
      [key, value, type, label, groupName]
    );
  }

  for (const field of SITE_THEME_FIELDS) {
    await conn.execute(
      `INSERT INTO siteSettings (settingKey, settingValue, settingType, label, groupName)
       VALUES (?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         settingType = COALESCE(settingType, VALUES(settingType)),
         label = COALESCE(label, VALUES(label)),
         groupName = COALESCE(groupName, VALUES(groupName))`,
      [field.key, field.defaultValue, field.type === "toggle" ? "boolean" : "text", field.label, field.group]
    );
  }

  await ensureVisualBuilderBaseline(conn);
}

async function ensureVisualBuilderBaseline(conn: mysql.Connection) {
  const baselineJson = JSON.stringify(buildThemeBaselineSnapshot());
  await conn.execute(
    `INSERT INTO siteSettings (settingKey, settingValue, settingType, label, groupName)
     VALUES (?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE
       settingValue = IF(settingValue IS NULL OR settingValue = '', VALUES(settingValue), settingValue),
       settingType = COALESCE(settingType, VALUES(settingType)),
       label = COALESCE(label, VALUES(label)),
       groupName = COALESCE(groupName, VALUES(groupName))`,
    [VISUAL_BUILDER_BASELINE_KEY, baselineJson, "json", "Visual Builder Baseline", "branding"]
  );
}



async function clearLegacyResearchDefaultsOnce(conn: mysql.Connection) {
  // One-time cleanup requested for existing catalog records:
  // remove seeded/default research content and citations so admin-provided
  // research starts clean and is not re-populated on restarts/redeploys.
  const cleanupKey = "research_content_citations_cleared_2026_06_02_v2";
  const [existing] = await conn.execute<RowDataPacket[]>(
    `SELECT id FROM siteSettings WHERE settingKey = ? LIMIT 1`,
    [cleanupKey]
  );

  if (existing.length) return;

  await conn.execute(`UPDATE productResearch SET overview = '', researchContent = ''`);
  await conn.execute(`DELETE FROM researchCitations`);

  await conn.execute(
    `INSERT INTO siteSettings (settingKey, settingValue, settingType, label, groupName)
     VALUES (?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE settingValue = settingValue`,
    [cleanupKey, "true", "boolean", "Research Content/Citations Cleanup Complete", "general"]
  );

  console.log("[DB init] Cleared legacy research content and citations once.");
}


async function disableFeaturedProductsOnce(conn: mysql.Connection) {
  // The site does not currently use featured products. Turn existing featured flags off once
  // and leave future admin saves under owner control.
  const cleanupKey = "featured_products_disabled_2026_06_02";
  const [existing] = await conn.execute<RowDataPacket[]>(
    `SELECT id FROM siteSettings WHERE settingKey = ? LIMIT 1`,
    [cleanupKey]
  );

  if (existing.length) return;

  await conn.execute(`UPDATE products SET isFeatured = false`);

  await conn.execute(
    `INSERT INTO siteSettings (settingKey, settingValue, settingType, label, groupName)
     VALUES (?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE settingValue = settingValue`,
    [cleanupKey, "true", "boolean", "Featured Products Disabled", "general"]
  );

  console.log("[DB init] Disabled featured product flags once.");
}


async function clearProductDescriptionsAndFeaturedOnce(conn: mysql.Connection) {
  // One-time cleanup requested by admin: clear pre-filled product descriptions
  // and start all products with Featured disabled. This does not overwrite
  // future admin-entered descriptions after the cleanup flag exists.
  const cleanupKey = "product_descriptions_cleared_featured_off_2026_06_02";
  const [existing] = await conn.execute<RowDataPacket[]>(
    `SELECT id FROM siteSettings WHERE settingKey = ? LIMIT 1`,
    [cleanupKey]
  );

  if (existing.length) return;

  await conn.execute(`UPDATE products SET description = '', isFeatured = false`);

  await conn.execute(
    `INSERT INTO siteSettings (settingKey, settingValue, settingType, label, groupName)
     VALUES (?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE settingValue = settingValue`,
    [cleanupKey, "true", "boolean", "Product Descriptions Cleared and Featured Disabled", "general"]
  );

  console.log("[DB init] Cleared product descriptions and disabled featured flags once.");
}


export async function ensureDatabaseReady() {
  if (initialized) return;
  if (initPromise) return initPromise;

  initPromise = (async () => {
    const url = process.env.DATABASE_URL;
    if (!url) {
      console.warn("[DB init] DATABASE_URL not set; skipping database initialization");
      return;
    }

    console.log("[DB init] Connecting to database...");
    const conn = await mysql.createConnection({ uri: url, connectTimeout: 10000 });
    try {
      console.log("[DB init] Ensuring required tables and columns exist...");
      for (const statement of TABLES) {
        await conn.execute(statement);
      }
      for (const [table, column, definition] of REQUIRED_COLUMNS) {
        await addColumnIfMissing(conn, table, column, definition);
      }
      await ensureUserRoleEnum(conn);
      await ensurePickupSlotStatusEnum(conn);
      await ensureConfiguredSuperAdmin(conn);
      await ensureProductColumnTypes(conn);
      await ensureDefaultSiteSettings(conn);
      await migrateLegacyContactEmails(conn);
      await clearLegacyResearchDefaultsOnce(conn);
      await disableFeaturedProductsOnce(conn);
      await clearProductDescriptionsAndFeaturedOnce(conn);
      await ensureDefaultCatalog(conn);
      await ensureProductDisplayData(conn);
      console.log("[DB init] Database schema ready. Users table columns verified. Catalog verified. Product display data verified.");
      initialized = true;
    } finally {
      await conn.end();
    }
  })().catch((error) => {
    initPromise = null;
    console.error("[DB init] Failed:", error);
    throw error;
  });

  return initPromise;
}
