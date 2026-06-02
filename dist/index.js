var __defProp = Object.defineProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// drizzle/schema.ts
import {
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
  decimal,
  boolean
} from "drizzle-orm/mysql-core";
var users, categories, products, productCategories, researchCitations, productResearch, orders, orderItems, discountCodes, giftCards, siteSettings, cartItems, productVariants;
var init_schema = __esm({
  "drizzle/schema.ts"() {
    "use strict";
    users = mysqlTable("users", {
      id: int("id").autoincrement().primaryKey(),
      openId: varchar("openId", { length: 64 }).notNull().unique(),
      name: text("name"),
      email: varchar("email", { length: 320 }),
      loginMethod: varchar("loginMethod", { length: 64 }),
      role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
      // Custom auth fields
      passwordHash: varchar("passwordHash", { length: 255 }),
      username: varchar("username", { length: 100 }),
      phone: varchar("phone", { length: 20 }),
      shippingAddress: text("shippingAddress"),
      savedPaymentInfo: text("savedPaymentInfo"),
      createdAt: timestamp("createdAt").defaultNow().notNull(),
      updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
      lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull()
    });
    categories = mysqlTable("categories", {
      id: int("id").autoincrement().primaryKey(),
      name: varchar("name", { length: 100 }).notNull().unique(),
      slug: varchar("slug", { length: 100 }).notNull().unique(),
      description: text("description"),
      sortOrder: int("sortOrder").default(0).notNull(),
      createdAt: timestamp("createdAt").defaultNow().notNull()
    });
    products = mysqlTable("products", {
      id: int("id").autoincrement().primaryKey(),
      name: varchar("name", { length: 255 }).notNull(),
      slug: varchar("slug", { length: 255 }).notNull().unique(),
      description: text("description"),
      shortDescription: text("shortDescription"),
      price: decimal("price", { precision: 10, scale: 2 }).notNull(),
      compareAtPrice: decimal("compareAtPrice", { precision: 10, scale: 2 }),
      sku: varchar("sku", { length: 50 }),
      imageUrl: text("imageUrl"),
      // Product specs (like corepeptides)
      size: varchar("size", { length: 100 }),
      contents: varchar("contents", { length: 255 }),
      form: varchar("form", { length: 100 }),
      purity: varchar("purity", { length: 50 }),
      molecularFormula: varchar("molecularFormula", { length: 255 }),
      molecularWeight: varchar("molecularWeight", { length: 100 }),
      otherNames: text("otherNames"),
      // Inventory
      stockQuantity: int("stockQuantity").default(100).notNull(),
      lowStockThreshold: int("lowStockThreshold").default(10).notNull(),
      inStock: boolean("inStock").default(true).notNull(),
      // Discount
      discountPercent: decimal("discountPercent", { precision: 5, scale: 2 }),
      discountActive: boolean("discountActive").default(false).notNull(),
      // Document URLs (for tabs)
      coaUrl: text("coaUrl"),
      hplcUrl: text("hplcUrl"),
      massSpecUrl: text("massSpecUrl"),
      // Status
      isActive: boolean("isActive").default(true).notNull(),
      isFeatured: boolean("isFeatured").default(false).notNull(),
      sortOrder: int("sortOrder").default(0).notNull(),
      createdAt: timestamp("createdAt").defaultNow().notNull(),
      updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull()
    });
    productCategories = mysqlTable("productCategories", {
      id: int("id").autoincrement().primaryKey(),
      productId: int("productId").notNull(),
      categoryId: int("categoryId").notNull()
    });
    researchCitations = mysqlTable("researchCitations", {
      id: int("id").autoincrement().primaryKey(),
      productId: int("productId").notNull(),
      citationNumber: int("citationNumber").notNull(),
      title: text("title").notNull(),
      authors: text("authors"),
      journal: varchar("journal", { length: 255 }),
      year: varchar("year", { length: 10 }),
      url: text("url"),
      summary: text("summary"),
      sortOrder: int("sortOrder").default(0).notNull(),
      createdAt: timestamp("createdAt").defaultNow().notNull()
    });
    productResearch = mysqlTable("productResearch", {
      id: int("id").autoincrement().primaryKey(),
      productId: int("productId").notNull(),
      overview: text("overview"),
      chemicalMakeup: text("chemicalMakeup"),
      researchContent: text("researchContent"),
      // Rich text / markdown
      createdAt: timestamp("createdAt").defaultNow().notNull(),
      updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull()
    });
    orders = mysqlTable("orders", {
      id: int("id").autoincrement().primaryKey(),
      orderNumber: varchar("orderNumber", { length: 50 }).notNull().unique(),
      userId: int("userId"),
      // null for guest checkout
      guestEmail: varchar("guestEmail", { length: 320 }),
      guestName: varchar("guestName", { length: 255 }),
      status: mysqlEnum("status", [
        "pending",
        "paid",
        "processing",
        "shipped",
        "delivered",
        "cancelled",
        "refunded"
      ]).default("pending").notNull(),
      // Shipping
      shippingName: varchar("shippingName", { length: 255 }),
      shippingAddress: text("shippingAddress"),
      shippingCity: varchar("shippingCity", { length: 100 }),
      shippingState: varchar("shippingState", { length: 100 }),
      shippingZip: varchar("shippingZip", { length: 20 }),
      shippingCountry: varchar("shippingCountry", { length: 100 }),
      trackingNumber: varchar("trackingNumber", { length: 255 }),
      trackingCarrier: varchar("trackingCarrier", { length: 100 }),
      // Payment
      paymentMethod: varchar("paymentMethod", { length: 50 }).default("nowpayments"),
      paymentId: varchar("paymentId", { length: 255 }),
      paymentStatus: varchar("paymentStatus", { length: 50 }),
      // Totals
      subtotal: decimal("subtotal", { precision: 10, scale: 2 }).notNull(),
      discountAmount: decimal("discountAmount", { precision: 10, scale: 2 }).default("0.00"),
      shippingCost: decimal("shippingCost", { precision: 10, scale: 2 }).default("0.00"),
      total: decimal("total", { precision: 10, scale: 2 }).notNull(),
      // Discount code used
      discountCode: varchar("discountCode", { length: 50 }),
      notes: text("notes"),
      createdAt: timestamp("createdAt").defaultNow().notNull(),
      updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull()
    });
    orderItems = mysqlTable("orderItems", {
      id: int("id").autoincrement().primaryKey(),
      orderId: int("orderId").notNull(),
      productId: int("productId").notNull(),
      productName: varchar("productName", { length: 255 }).notNull(),
      variantId: int("variantId"),
      variantLabel: varchar("variantLabel", { length: 255 }),
      quantity: int("quantity").notNull(),
      unitPrice: decimal("unitPrice", { precision: 10, scale: 2 }).notNull(),
      totalPrice: decimal("totalPrice", { precision: 10, scale: 2 }).notNull()
    });
    discountCodes = mysqlTable("discountCodes", {
      id: int("id").autoincrement().primaryKey(),
      code: varchar("code", { length: 50 }).notNull().unique(),
      description: text("description"),
      type: mysqlEnum("type", ["percentage", "fixed"]).default("percentage").notNull(),
      value: decimal("value", { precision: 10, scale: 2 }).notNull(),
      minOrderAmount: decimal("minOrderAmount", { precision: 10, scale: 2 }),
      maxUses: int("maxUses"),
      currentUses: int("currentUses").default(0).notNull(),
      isActive: boolean("isActive").default(true).notNull(),
      appliesToAll: boolean("appliesToAll").default(true).notNull(),
      productId: int("productId"),
      // If applies to specific product
      startsAt: timestamp("startsAt"),
      expiresAt: timestamp("expiresAt"),
      createdAt: timestamp("createdAt").defaultNow().notNull()
    });
    giftCards = mysqlTable("giftCards", {
      id: int("id").autoincrement().primaryKey(),
      code: varchar("code", { length: 9 }).notNull().unique(),
      originalAmount: decimal("originalAmount", { precision: 10, scale: 2 }).notNull(),
      balance: decimal("balance", { precision: 10, scale: 2 }).notNull(),
      purchaserEmail: varchar("purchaserEmail", { length: 320 }),
      orderId: int("orderId"),
      isActive: boolean("isActive").default(true).notNull(),
      createdAt: timestamp("createdAt").defaultNow().notNull(),
      updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull()
    });
    siteSettings = mysqlTable("siteSettings", {
      id: int("id").autoincrement().primaryKey(),
      settingKey: varchar("settingKey", { length: 100 }).notNull().unique(),
      settingValue: text("settingValue"),
      settingType: mysqlEnum("settingType", ["text", "image", "boolean", "json", "html"]).default("text").notNull(),
      label: varchar("label", { length: 255 }),
      description: text("description"),
      groupName: varchar("groupName", { length: 100 }).default("general"),
      updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull()
    });
    cartItems = mysqlTable("cartItems", {
      id: int("id").autoincrement().primaryKey(),
      userId: int("userId").notNull(),
      productId: int("productId").notNull(),
      variantId: int("variantId"),
      variantLabel: varchar("variantLabel", { length: 255 }),
      quantity: int("quantity").default(1).notNull(),
      createdAt: timestamp("createdAt").defaultNow().notNull(),
      updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull()
    });
    productVariants = mysqlTable("product_variants", {
      id: int("id").autoincrement().primaryKey(),
      productId: int("productId").notNull(),
      label: varchar("label", { length: 255 }).notNull(),
      // e.g. "5mg", "10mg"
      price: decimal("price", { precision: 10, scale: 2 }).notNull(),
      compareAtPrice: decimal("compareAtPrice", { precision: 10, scale: 2 }),
      sku: varchar("sku", { length: 50 }),
      stockQuantity: int("stockQuantity").default(100).notNull(),
      inStock: boolean("inStock").default(true).notNull(),
      imageUrl: text("imageUrl"),
      sortOrder: int("sortOrder").default(0).notNull(),
      createdAt: timestamp("createdAt").defaultNow().notNull()
    });
  }
});

// server/db-init.ts
import mysql from "mysql2/promise";
import fs from "fs";
import path from "path";
function slugify(value) {
  return value.toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}
function normalizeVariantGroupName(name) {
  let working = name.trim().replace(/\s+/g, " ");
  const hasCapsules = /\bcapsules?\b/i.test(working);
  const parenMatch = working.match(/\s*\(([^)]*)\)\s*$/);
  if (parenMatch && !hasCapsules) {
    working = working.slice(0, parenMatch.index).trim();
  }
  const doseMatch = working.match(/(?:\s|^)(\d+(?:\.\d+)?\s*(?:mg|mcg|g|iu|ml)(?:\s*\/\s*(?:ml|vial))?)(?:\s*)$/i);
  if (!doseMatch) return { base: name.trim(), label: null };
  const label = doseMatch[1].replace(/\s+/g, "");
  let base = working.slice(0, doseMatch.index).trim();
  if (!base) return { base: name.trim(), label: null };
  if (hasCapsules) {
    return { base: name.trim(), label: null };
  }
  return { base, label };
}
function slugifyValue(value) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}
function stripAssetHash(filename) {
  const base = filename.replace(/\.(png|jpg|jpeg|webp)$/i, "");
  return base.replace(/_[a-f0-9]{8}$/i, "");
}
function getLocalAssetMap() {
  if (_assetMap) return _assetMap;
  _assetMap = /* @__PURE__ */ new Map();
  const assetsDir = path.join(process.cwd(), "client", "public", "assets");
  try {
    for (const file of fs.readdirSync(assetsDir)) {
      if (!/\.(png|jpg|jpeg|webp)$/i.test(file)) continue;
      const key = slugifyValue(stripAssetHash(file));
      if (key && !_assetMap.has(key)) _assetMap.set(key, `/assets/${file}`);
    }
  } catch {
  }
  for (const product of DEFAULT_PRODUCTS) {
    if (!_assetMap.has(product.slug)) _assetMap.set(product.slug, product.image);
  }
  return _assetMap;
}
function assetBySlug(slug) {
  const normalized = slugifyValue(slug);
  return getLocalAssetMap().get(normalized);
}
function exactAssetByProduct(row) {
  const slug = String(row.slug || "");
  const name = String(row.name || "");
  return assetBySlug(slug) || assetBySlug(name);
}
function assetByProduct(row) {
  const slug = String(row.slug || "");
  const name = String(row.name || "");
  const exact = assetBySlug(slug) || assetBySlug(name);
  if (exact) return exact;
  const normalizedSlug = slugifyValue(slug);
  const normalizedName = slugifyValue(name);
  for (const [assetSlug, assetPath] of getLocalAssetMap().entries()) {
    if (assetSlug === normalizedSlug || assetSlug === normalizedName) return assetPath;
    if (normalizedSlug && assetSlug.startsWith(`${normalizedSlug}-`)) return assetPath;
    if (normalizedName && assetSlug.startsWith(`${normalizedName}-`)) return assetPath;
  }
  return void 0;
}
function localAssetExists(image) {
  if (!image.startsWith("/assets/")) return false;
  const filename = image.replace(/^\/assets\//, "");
  return fs.existsSync(path.join(process.cwd(), "client", "public", "assets", filename));
}

const NON_VIAL_TERMS2 = ["capsule", "capsules", "cream", "cleanser", "sunscreen", "mask", "lotion", "serum", "kit", "box", "card", "storage", "cap", "bottle", "spray", "dropper"];
function rowIsNonVialProduct(row) {
  const text = [row.slug, row.name, row.form, row.category].filter(Boolean).join(" ").toLowerCase();
  return NON_VIAL_TERMS2.some((term) => text.includes(term));
}
function generatedVialUrlForRow(row) {
  const slug = slugifyValue(String(row.slug || row.name || "product")) || "product";
  const params = new URLSearchParams();
  if (row.name) params.set("name", String(row.name));
  if (row.size || row.contents) params.set("size", String(row.size || row.contents));
  params.set("v", "rvr-photoreal-adaptive-fit-v1");
  return `/api/vial/${slug}.png?${params.toString()}`;
}
function isLegacyBundledVialAsset2(value) {
  const image = String(value || "").toLowerCase();
  if (!image) return false;
  if (image.startsWith("/assets/products/")) return false;
  return image.includes("rvr-vial-template-single") || image.includes("rvr-company-blank-vial") || image.includes("bacteriostatic-water") || image.startsWith("/assets/") && /_[0-9a-f]{8}\.(webp|png|jpg|jpeg)(?:\?|$)/i.test(image) && !/(gift-card|capsule|capsules|tube|cream|cleanser|sunscreen|mask|kit|box|storage|cap)/i.test(image);
}
function isGeneratedOrFallbackImage(value) {
  const image = String(value || "");
  if (!image) return true;
  return image.startsWith("/api/vial/") || image.includes("generated-vials/") || image.includes("rvr-vial-template-single") || image.includes("/vials/") || image.includes("placeholder") || image.startsWith("/assets/") && !localAssetExists(image);
}
function getNihResearchProfile(row) {
  const haystack = `${String(row.slug || "")} ${String(row.name || "")}`.toLowerCase();
  return NIH_RESEARCH_PROFILES.find((profile) => profile.keys.some((key) => haystack.includes(key))) || NIH_GENERIC_RESEARCH_PROFILE;
}
async function ensureNihResearchDescriptions(conn) {
  const [rows] = await conn.execute(`SELECT id, name, slug FROM products ORDER BY id ASC`);
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
          i
        ]
      );
    }
  }
  console.log(`[DB init] NIH/PubMed descriptions and citations verified for ${rows.length} products.`);
}
async function ensureProductDisplayData(conn) {
  const [rows] = await conn.execute(
    `SELECT id, name, slug, price, imageUrl, size, contents, form, isActive, sortOrder FROM products ORDER BY sortOrder ASC, id ASC`
  );
  if (!rows.length) return;
  for (const row of rows) {
    const currentImage = String(row.imageUrl || "");
    if (!rowIsNonVialProduct(row)) {
      if (isGeneratedOrFallbackImage(currentImage) || isLegacyBundledVialAsset2(currentImage)) {
        const hdVialUrl = generatedVialUrlForRow(row);
        await conn.execute(`UPDATE products SET imageUrl = ? WHERE id = ?`, [hdVialUrl, row.id]);
        row.imageUrl = hdVialUrl;
      }
      continue;
    }
    const exactAsset = exactAssetByProduct(row);
    const repairAsset = exactAsset || assetByProduct(row);
    if (repairAsset && isGeneratedOrFallbackImage(currentImage)) {
      await conn.execute(`UPDATE products SET imageUrl = ? WHERE id = ?`, [repairAsset, row.id]);
      row.imageUrl = repairAsset;
    }
  }
  const groups = /* @__PURE__ */ new Map();
  for (const row of rows) {
    const { base, label } = normalizeVariantGroupName(String(row.name));
    if (!label) continue;
    const key = slugifyValue(base);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(row);
  }
  for (const [baseSlug, group] of groups.entries()) {
    if (group.length < 2) continue;
    const baseName = normalizeVariantGroupName(String(group[0].name)).base;
    const sorted = [...group].sort((a, b) => Number(a.price) - Number(b.price));
    const canonical = sorted[0];
    const canonicalAsset = rowIsNonVialProduct(canonical) ? assetByProduct(canonical) || String(canonical.imageUrl || "") : generatedVialUrlForRow(canonical);
    await conn.execute(
      `UPDATE products SET name = ?, slug = ?, price = ?, imageUrl = ?, isActive = true WHERE id = ?`,
      [baseName, baseSlug, canonical.price, canonicalAsset || canonical.imageUrl, canonical.id]
    );
    for (let i = 0; i < sorted.length; i++) {
      const row = sorted[i];
      const { label } = normalizeVariantGroupName(String(row.name));
      if (!label) continue;
      const variantImage = rowIsNonVialProduct(row) ? assetByProduct(row) || row.imageUrl || canonicalAsset || null : generatedVialUrlForRow(row);
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
async function ensureDefaultCatalog(conn) {
  const [productCountRows] = await conn.execute(`SELECT COUNT(*) as count FROM products`);
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
  const categoryIds = /* @__PURE__ */ new Map();
  const [categoryRows] = await conn.execute(`SELECT id, name FROM categories`);
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
        i
      ]
    );
    const [productRows] = await conn.execute(`SELECT id FROM products WHERE slug = ? LIMIT 1`, [product.slug]);
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
async function ensureProductColumnTypes(conn) {
  const statements = [
    "ALTER TABLE products MODIFY COLUMN description LONGTEXT",
    "ALTER TABLE products MODIFY COLUMN shortDescription LONGTEXT",
    "ALTER TABLE products MODIFY COLUMN imageUrl TEXT",
    "ALTER TABLE products MODIFY COLUMN otherNames TEXT",
    "ALTER TABLE products MODIFY COLUMN coaUrl TEXT",
    "ALTER TABLE products MODIFY COLUMN hplcUrl TEXT",
    "ALTER TABLE products MODIFY COLUMN massSpecUrl TEXT"
  ];
  for (const statement of statements) {
    try {
      await conn.execute(statement);
    } catch (error) {
      console.warn("[DB init] Could not normalize product column type:", statement, error);
    }
  }
}
async function addColumnIfMissing(conn, table, column, definition) {
  const [rows] = await conn.execute(
    `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ? LIMIT 1`,
    [table, column]
  );
  if (rows.length === 0) {
    console.log(`[DB init] Adding missing column ${table}.${column}`);
    await conn.execute(`ALTER TABLE \`${table}\` ADD COLUMN \`${column}\` ${definition}`);
  }
}
async function ensureDatabaseReady() {
  if (initialized) return;
  if (initPromise) return initPromise;
  initPromise = (async () => {
    const url = process.env.DATABASE_URL;
    if (!url) {
      console.warn("[DB init] DATABASE_URL not set; skipping database initialization");
      return;
    }
    console.log("[DB init] Connecting to database...");
    const conn = await mysql.createConnection({ uri: url, connectTimeout: 1e4 });
    try {
      console.log("[DB init] Ensuring required tables and columns exist...");
      for (const statement of TABLES) {
        await conn.execute(statement);
      }
      for (const [table, column, definition] of REQUIRED_COLUMNS) {
        await addColumnIfMissing(conn, table, column, definition);
      }
      await ensureProductColumnTypes(conn);
      await ensureDefaultCatalog(conn);
      await ensureProductDisplayData(conn);
      await ensureNihResearchDescriptions(conn);
      console.log("[DB init] Database schema ready. Users table columns verified. Catalog verified. Product display data verified. NIH/PubMed descriptions verified.");
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
var TABLES, REQUIRED_COLUMNS, DEFAULT_PRODUCTS, DEFAULT_CATEGORIES, _assetMap, NIH_RESEARCH_PROFILES, NIH_GENERIC_RESEARCH_PROFILE, initialized, initPromise;
var init_db_init = __esm({
  "server/db-init.ts"() {
    "use strict";
    TABLES = [
      `CREATE TABLE IF NOT EXISTS users (
  id int AUTO_INCREMENT NOT NULL,
  openId varchar(64) NOT NULL,
  name text,
  email varchar(320),
  loginMethod varchar(64),
  role enum('user','admin') NOT NULL DEFAULT 'user',
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
  orderId int,
  isActive boolean NOT NULL DEFAULT true,
  createdAt timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY giftCards_code_unique (code)
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
)`
    ];
    REQUIRED_COLUMNS = [
      ["users", "openId", "varchar(64)"],
      ["users", "name", "text"],
      ["users", "email", "varchar(320)"],
      ["users", "loginMethod", "varchar(64)"],
      ["users", "role", "enum('user','admin') NOT NULL DEFAULT 'user'"],
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
      ["cartItems", "variantLabel", "varchar(255)"]
    ];
    DEFAULT_PRODUCTS = [
      { slug: "bpc-157-5mg", name: "BPC-157 5mg", image: "/assets/bpc-157-5mg_1e10350a.webp", category: "Peptides", price: "39.99" },
      { slug: "bpc-157-10mg", name: "BPC-157 10mg", image: "/assets/bpc-157-5mg_1e10350a.webp", category: "Peptides", price: "69.99" },
      { slug: "bpc-157-capsules-500mcg-30", name: "BPC-157 Capsules 500mcg (30)", image: "/assets/bpc-157-capsules-500mcg-30_hd.webp?v=4", category: "Peptides", price: "49.99" },
      { slug: "tb-500", name: "TB-500", image: "/api/vial/tb-500.png?name=TB-500&v=rvr-photoreal-adaptive-fit-v1", category: "Peptides", price: "49.99" },
      { slug: "cagrilintide-5mg", name: "Cagrilintide 5mg", image: "/assets/cagrilintide-5mg_f51eb3cf.webp", category: "Peptides", price: "99.99" },
      { slug: "cagrilintide-semaglutide-5mg-5mg", name: "Cagrilintide/Semaglutide 5mg/5mg", image: "/assets/cagrilintide-semaglutide-5mg-5mg_7655c129.webp", category: "Blends", price: "129.99" },
      { slug: "cjc-1295-no-dac-ipamorelin-5mg-5mg", name: "CJC-1295 No DAC/Ipamorelin 5mg/5mg", image: "/assets/cjc-1295-no-dac-ipamorelin-5mg-5mg_446f4b27.webp", category: "Blends", price: "79.99" },
      { slug: "dsip-5mg", name: "DSIP 5mg", image: "/assets/dsip-5mg_72b0cefc.webp", category: "Peptides", price: "39.99" },
      { slug: "epithalon-10mg", name: "Epithalon 10mg", image: "/assets/epithalon-10mg_dc0b8639.webp", category: "Peptides", price: "49.99" },
      { slug: "ghk-cu-50mg", name: "GHK-Cu 50mg", image: "/assets/ghk-cu-50mg_274d06be.webp", category: "Peptides", price: "59.99" },
      { slug: "glp-1-semaglutide-5mg", name: "GLP-1 Semaglutide 5mg", image: "/assets/glp-1-semaglutide-5mg_7dd36c7e.webp", category: "Peptides", price: "89.99" },
      { slug: "glp-1-semaglutide-10mg", name: "GLP-1 Semaglutide 10mg", image: "/assets/glp-1-semaglutide-5mg_7dd36c7e.webp", category: "Peptides", price: "149.99" },
      { slug: "kisspeptin-10mg", name: "Kisspeptin 10mg", image: "/assets/kisspeptin-10mg_55d055de.webp", category: "Peptides", price: "49.99" },
      { slug: "kpv-10mg", name: "KPV 10mg", image: "/assets/kpv-10mg_87cf383a.webp", category: "Peptides", price: "44.99" },
      { slug: "mazdutide-5mg", name: "Mazdutide 5mg", image: "/assets/mazdutide-5mg_6985cdd3.webp", category: "Peptides", price: "99.99" },
      { slug: "melanotan-1-10mg", name: "Melanotan 1 10mg", image: "/assets/melanotan-1-10mg_a80a33e8.webp", category: "Peptides", price: "39.99" },
      { slug: "melanotan-2-10mg", name: "Melanotan 2 10mg", image: "/assets/melanotan-2-10mg_be5b73dc.webp", category: "Peptides", price: "39.99" },
      { slug: "mots-c-5mg", name: "MOTS-c 5mg", image: "/assets/mots-c-5mg_35dd3374.webp", category: "Peptides", price: "49.99" },
      { slug: "mots-c-10mg", name: "MOTS-c 10mg", image: "/assets/mots-c-5mg_35dd3374.webp", category: "Peptides", price: "79.99" },
      { slug: "nad-500mg", name: "NAD+ 500mg", image: "/assets/nad-500mg_d3520d40.webp", category: "Wellness", price: "79.99" },
      { slug: "nad-1000mg", name: "NAD+ 1000mg", image: "/assets/nad-500mg_d3520d40.webp", category: "Wellness", price: "129.99" },
      { slug: "oxytocin-acetate-5mg", name: "Oxytocin Acetate 5mg", image: "/assets/oxytocin-acetate-5mg_930aff12.webp", category: "Peptides", price: "39.99" },
      { slug: "pe-22-28-10mg", name: "PE-22-28 10mg", image: "/assets/pe-22-28-10mg_4ae32cc2.webp", category: "Peptides", price: "49.99" },
      { slug: "pinealon-20mg", name: "Pinealon 20mg", image: "/assets/pinealon-20mg_9c886336.webp", category: "Peptides", price: "49.99" },
      { slug: "pt-141-10mg", name: "PT-141 10mg", image: "/assets/pt-141-10mg_15229f16.webp", category: "Peptides", price: "44.99" },
      { slug: "retatrutide-5mg", name: "Retatrutide 5mg", image: "/assets/retatrutide-5mg_16793f06.webp", category: "Peptides", price: "99.99" },
      { slug: "retatrutide-15mg", name: "Retatrutide 15mg", image: "/assets/retatrutide-5mg_16793f06.webp", category: "Peptides", price: "199.99" },
      { slug: "selank-10mg", name: "Selank 10mg", image: "/assets/selank-10mg_ec5aa57c.webp", category: "Peptides", price: "39.99" },
      { slug: "selank-semax-blend-10mg-10mg", name: "Selank/Semax Blend 10mg/10mg", image: "/assets/selank-semax-blend-10mg-10mg_f9249ead.webp", category: "Blends", price: "69.99" },
      { slug: "semax-10mg", name: "Semax 10mg", image: "/assets/semax-10mg_24238dd4.webp", category: "Peptides", price: "39.99" },
      { slug: "sermorelin-10mg", name: "Sermorelin 10mg", image: "/assets/sermorelin-10mg_92bb2dc6.webp", category: "Peptides", price: "49.99" },
      { slug: "ss-31-30mg", name: "SS-31 30mg", image: "/assets/ss-31-30mg_d6fe070b.webp", category: "Peptides", price: "89.99" },
      { slug: "super-wolf-10mg-10mg-10mg", name: "Super Wolf 10mg/10mg/10mg", image: "/assets/super-wolf-10mg-10mg-10mg_4bc7be3f.webp", category: "Blends", price: "99.99" },
      { slug: "survodutide-5mg", name: "Survodutide 5mg", image: "/assets/survodutide-5mg_1d1a18da.webp", category: "Peptides", price: "99.99" },
      { slug: "tesamorelin-10mg", name: "Tesamorelin 10mg", image: "/assets/tesamorelin-10mg_15b1bd0e.webp", category: "Peptides", price: "89.99" },
      { slug: "thymosin-alpha-1-10mg", name: "Thymosin Alpha-1 10mg", image: "/assets/thymosin-alpha-1-10mg_1be0818b.webp", category: "Peptides", price: "49.99" },
      { slug: "tirzepatide-5mg", name: "Tirzepatide 5mg", image: "/assets/tirzepatide-5mg_3d0c0d8c.webp", category: "Peptides", price: "99.99" },
      { slug: "tirzepatide-15mg", name: "Tirzepatide 15mg", image: "/assets/tirzepatide-5mg_3d0c0d8c.webp", category: "Peptides", price: "199.99" },
      { slug: "wolverine-blend-20mg", name: "Wolverine Blend 20mg", image: "/assets/wolverine-blend-20mg_5d66e1ac.webp", category: "Blends", price: "89.99" },
      { slug: "5-amino-1mq-50mg", name: "5-Amino-1MQ 50mg", image: "/assets/5-amino-1mq-50mg_06697bbc.webp", category: "Peptides", price: "59.99" },
      { slug: "bacteriostatic-water-10ml", name: "Bacteriostatic Water 10ml", image: "/assets/bacteriostatic-water-10ml_764a84d1.webp", category: "Reconstitution", price: "9.99" },
      { slug: "bacteriostatic-water-30ml", name: "Bacteriostatic Water 30ml", image: "/assets/bacteriostatic-water-10ml_764a84d1.webp", category: "Reconstitution", price: "14.99" },
      { slug: "hospira-bacteriostatic-water-30ml", name: "Hospira Bacteriostatic Water 30ml", image: "/assets/bacteriostatic-water-10ml_764a84d1.webp", category: "Reconstitution", price: "19.99" },
      { slug: "reconstitution-kit", name: "Reconstitution Kit", image: "/assets/reconstitution-kit-hd.png", category: "Reconstitution", price: "24.99" },
      { slug: "glutathione-1200mg", name: "Glutathione 1200mg", image: "/assets/glutathione-1200mg_e3e41ad9.webp", category: "Wellness", price: "79.99" },
      { slug: "l-carnitine-300mg-ml-30ml", name: "L-Carnitine 300mg/ml 30ml", image: "/assets/l-carnitine-300mg-ml-30ml_a7fbf7c4.webp", category: "Wellness", price: "59.99" },
      { slug: "vitamin-b-complex", name: "Vitamin B Complex", image: "/assets/vitamin-b-complex_75a8cb81.webp", category: "Wellness", price: "39.99" },
      { slug: "vitamin-d-100-000-iu-ml", name: "Vitamin D 100,000 IU/ml", image: "/assets/vitamin-d-100-000-iu-ml_ee0dac38.webp", category: "Wellness", price: "39.99" },
      { slug: "curenex-daily-care-rejuvenating-cream", name: "Curenex Daily Care Rejuvenating Cream", image: "/assets/curenex-daily-care-rejuvenating-cream-hd-tube.png", category: "Skin Care", price: "49.99" },
      { slug: "curenex-daily-care-skin-booster", name: "Curenex Daily Care Skin Booster", image: "/assets/curenex-daily-care-skin-booster-hd-tube.png", category: "Skin Care", price: "59.99" },
      { slug: "curenex-hydrating-cleanser", name: "Curenex Hydrating Cleanser", image: "/assets/curenex-hydrating-cleanser-hd-tube.png", category: "Skin Care", price: "34.99" },
      { slug: "curenex-sheer-sunscreen-50-spf", name: "Curenex Sheer Sunscreen 50 SPF", image: "/assets/curenex-sheer-sunscreen-50-spf-hd-tube.png", category: "Skin Care", price: "34.99" },
      { slug: "rm-repair-moisturizing-cream", name: "RM Repair Moisturizing Cream", image: "/assets/rm-repair-moisturizing-cream-hd-tube.png", category: "Skin Care", price: "49.99" },
      { slug: "urea-cream-skin-softener", name: "Urea Cream Skin Softener", image: "/assets/urea-cream-skin-softener-hd-tube.png", category: "Skin Care", price: "29.99" }
    ];
    DEFAULT_CATEGORIES = ["Peptides", "Blends", "Reconstitution", "Wellness", "Skin Care"];
    _assetMap = null;
    NIH_RESEARCH_PROFILES = [
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
          { title: "Impact of pentadecapeptide BPC 157 on muscle healing...", authors: "Pevec et al.", journal: "PubMed", year: "2010", url: "https://pubmed.ncbi.nlm.nih.gov/20190676/", summary: "Preclinical muscle-healing research." }
        ]
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
          { title: "Comparative effectiveness of GLP-1 receptor agonists...", authors: "Yao et al.", journal: "PubMed", year: "2024", url: "https://pubmed.ncbi.nlm.nih.gov/38286487/", summary: "Comparative GLP-1 receptor agonist research." }
        ]
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
          { title: "In Vitro Observations on the Influence of Copper Peptide...", authors: "Huang et al.", journal: "PubMed", year: "2007", url: "https://pubmed.ncbi.nlm.nih.gov/17603859/", summary: "In vitro fibroblast/remodeling research." }
        ]
      },
      {
        keys: ["thymosin-alpha", "thymosin alpha", "tb-500", "thymosin beta", "super-wolf", "super wolf"],
        shortDescription: "NIH-indexed thymosin literature focuses on immune modulation and regenerative biology research.",
        description: "NIH-indexed thymosin literature describes thymosin alpha-1 primarily in immunomodulation research and thymosin beta-4 related topics in regenerative and tissue-repair biology. Study conclusions are context-dependent and vary by model, disease state, and study design. This material is offered for research, laboratory, or analytical use only.",
        overview: "Thymosin-family peptides are discussed in NIH-indexed literature across immune regulation, inflammatory models, and tissue-repair biology.",
        researchContent: "Description\nNIH-indexed thymosin studies include immune-regulation research involving thymosin alpha-1 and regenerative biology literature involving thymosin beta-4 related topics. These publications do not establish universal effects and should be interpreted within their stated research models.",
        citations: [
          { title: "Thymosin alpha 1 alleviates inflammation and prevents infection...", authors: "Tian et al.", journal: "PubMed", year: "2025", url: "https://pubmed.ncbi.nlm.nih.gov/40599771/", summary: "Clinical immune-regulation research context." },
          { title: "Efficacy of thymosin \u03B11 for sepsis: a systematic review and meta-analysis", authors: "Gu et al.", journal: "PubMed", year: "2025", url: "https://pubmed.ncbi.nlm.nih.gov/40969554/", summary: "Systematic review of thymosin alpha-1 research." },
          { title: "Impact of the immunomodulating peptide thymosin alpha 1...", authors: "Binsfeld et al.", journal: "PubMed", year: "2015", url: "https://pubmed.ncbi.nlm.nih.gov/25971542/", summary: "Immunomodulation model research." },
          { title: "Thymosin \u03B24: a multi-functional regenerative peptide", authors: "Goldstein et al.", journal: "PubMed", year: "2012", url: "https://pubmed.ncbi.nlm.nih.gov/22074294/", summary: "Review of thymosin beta-4 regenerative biology." },
          { title: "The efficacy of thymosin alpha-1 therapy in moderate to critical COVID-19 patients", authors: "Soeroto et al.", journal: "PubMed", year: "2023", url: "https://pubmed.ncbi.nlm.nih.gov/37845598/", summary: "Clinical-context thymosin alpha-1 research." }
        ]
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
          { title: "Ipamorelin, the first selective growth hormone secretagogue", authors: "Raun et al.", journal: "PubMed", year: "1998", url: "https://pubmed.ncbi.nlm.nih.gov/9849822/", summary: "Ipamorelin GH-secretagogue selectivity research." }
        ]
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
          { title: "Critical role of PepT1 in promoting colitis-associated cancer...", authors: "Viennois et al.", journal: "PubMed", year: "2016", url: "https://pubmed.ncbi.nlm.nih.gov/27458604/", summary: "KPV in colitis-associated model research." }
        ]
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
          { title: "SS-31 as a Mitochondrial Protectant...", authors: "Zhang et al.", journal: "PubMed", year: "2022", url: "https://pubmed.ncbi.nlm.nih.gov/35984013/", summary: "SS-31 tendon-healing mitochondrial model." }
        ]
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
          { title: "Semax peptide targets the \u03BC opioid receptor gene Oprm1...", authors: "Liu et al.", journal: "PubMed", year: "2025", url: "https://pubmed.ncbi.nlm.nih.gov/40692165/", summary: "Semax neurologic-model research." },
          { title: "Effects of delta sleep-inducing peptide on sleep...", authors: "Bes et al.", journal: "PubMed", year: "1992", url: "https://pubmed.ncbi.nlm.nih.gov/1299794/", summary: "DSIP sleep research with limited clinical significance." },
          { title: "Overview of Epitalon\u2014Highly Bioactive Pineal Tetrapeptide", authors: "Araj et al.", journal: "PubMed", year: "2025", url: "https://pubmed.ncbi.nlm.nih.gov/40141333/", summary: "Epitalon review literature." }
        ]
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
          { title: "PubMed search: bremelanotide melanocortin", journal: "NIH/PubMed", year: "Current", url: "https://pubmed.ncbi.nlm.nih.gov/?term=bremelanotide+melanocortin", summary: "Current NIH-indexed bremelanotide/melanocortin literature search." }
        ]
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
          { title: "PubMed search: kisspeptin oxytocin", journal: "NIH/PubMed", year: "Current", url: "https://pubmed.ncbi.nlm.nih.gov/?term=kisspeptin+oxytocin", summary: "Current NIH-indexed literature search." }
        ]
      }
    ];
    NIH_GENERIC_RESEARCH_PROFILE = {
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
        { title: "NIH/PubMed toxicology literature search", journal: "NIH/PubMed", year: "Current", url: "https://pubmed.ncbi.nlm.nih.gov/?term=toxicology+research", summary: "Current NIH-indexed toxicology research literature search." }
      ]
    };
    initialized = false;
    initPromise = null;
  }
});

// server/db.ts
var db_exports = {};
__export(db_exports, {
  addToCart: () => addToCart,
  applyGiftCard: () => applyGiftCard,
  clearCart: () => clearCart,
  createCategory: () => createCategory,
  createCitation: () => createCitation,
  createDiscount: () => createDiscount,
  createGiftCard: () => createGiftCard,
  createLocalUser: () => createLocalUser,
  createOrder: () => createOrder,
  createProduct: () => createProduct,
  createProductVariant: () => createProductVariant,
  deleteCategory: () => deleteCategory,
  deleteCitation: () => deleteCitation,
  deleteDiscount: () => deleteDiscount,
  deleteProduct: () => deleteProduct,
  deleteProductVariant: () => deleteProductVariant,
  getAllCategories: () => getAllCategories,
  getAllDiscountCodes: () => getAllDiscountCodes,
  getAllOrders: () => getAllOrders,
  getAllProducts: () => getAllProducts,
  getAllProductsWithVariantCount: () => getAllProductsWithVariantCount,
  getAllSettings: () => getAllSettings,
  getAllUsers: () => getAllUsers,
  getCartItems: () => getCartItems,
  getCategoryBySlug: () => getCategoryBySlug,
  getDashboardStats: () => getDashboardStats,
  getDb: () => getDb,
  getDiscountByCode: () => getDiscountByCode,
  getFeaturedProducts: () => getFeaturedProducts,
  getGiftCardByCode: () => getGiftCardByCode,
  getOrderById: () => getOrderById,
  getOrderByNumber: () => getOrderByNumber,
  getOrderItems: () => getOrderItems,
  getProductById: () => getProductById,
  getProductBySlug: () => getProductBySlug,
  getProductCategories: () => getProductCategories,
  getProductCitations: () => getProductCitations,
  getProductResearch: () => getProductResearch,
  getProductVariants: () => getProductVariants,
  getSetting: () => getSetting,
  getSettingsByGroup: () => getSettingsByGroup,
  getUserByEmail: () => getUserByEmail,
  getUserById: () => getUserById,
  getUserByOpenId: () => getUserByOpenId,
  getUserByUsername: () => getUserByUsername,
  getUserOrders: () => getUserOrders,
  getVariantById: () => getVariantById,
  incrementDiscountUse: () => incrementDiscountUse,
  issueGiftCardsForOrder: () => issueGiftCardsForOrder,
  removeFromCart: () => removeFromCart,
  replaceProductVariants: () => replaceProductVariants,
  updateCartItem: () => updateCartItem,
  updateCategory: () => updateCategory,
  updateCitation: () => updateCitation,
  updateDiscount: () => updateDiscount,
  updateOrder: () => updateOrder,
  updateOrderPayment: () => updateOrderPayment,
  updateOrderTracking: () => updateOrderTracking,
  updateProduct: () => updateProduct,
  updateProductVariant: () => updateProductVariant,
  updateSetting: () => updateSetting,
  updateUserPassword: () => updateUserPassword,
  updateUserProfile: () => updateUserProfile,
  upsertProductResearch: () => upsertProductResearch,
  upsertSetting: () => upsertSetting,
  upsertUser: () => upsertUser
});
import { eq, and, like, desc, asc, sql, inArray, lte } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
async function getDb() {
  if (process.env.DATABASE_URL) {
    await ensureDatabaseReady();
  }
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}
async function upsertUser(user) {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) return;
  const values = { openId: user.openId };
  const updateSet = {};
  const textFields = ["name", "email", "loginMethod"];
  const assignNullable = (field) => {
    const value = user[field];
    if (value === void 0) return;
    const normalized = value ?? null;
    values[field] = normalized;
    updateSet[field] = normalized;
  };
  textFields.forEach(assignNullable);
  if (user.lastSignedIn !== void 0) {
    values.lastSignedIn = user.lastSignedIn;
    updateSet.lastSignedIn = user.lastSignedIn;
  }
  if (user.role !== void 0) {
    values.role = user.role;
    updateSet.role = user.role;
  }
  if (!values.lastSignedIn) values.lastSignedIn = /* @__PURE__ */ new Date();
  if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = /* @__PURE__ */ new Date();
  await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
}
async function getUserByOpenId(openId) {
  const db = await getDb();
  if (!db) return void 0;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : void 0;
}
async function getUserById(id) {
  const db = await getDb();
  if (!db) return void 0;
  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return result[0];
}
async function getUserByEmail(email) {
  const db = await getDb();
  if (!db) return void 0;
  const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
  return result[0];
}
async function getUserByUsername(username) {
  const db = await getDb();
  if (!db) return void 0;
  const result = await db.select().from(users).where(eq(users.username, username)).limit(1);
  return result[0];
}
async function createLocalUser(data) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const openId = `local_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
  const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const adminUsername = process.env.ADMIN_USERNAME?.trim().toLowerCase();
  const isConfiguredAdmin = !!adminEmail && data.email.trim().toLowerCase() === adminEmail || !!adminUsername && data.username.trim().toLowerCase() === adminUsername;
  await db.insert(users).values({
    openId,
    email: data.email,
    username: data.username,
    passwordHash: data.passwordHash,
    name: data.name || data.username,
    loginMethod: "local",
    role: isConfiguredAdmin ? "admin" : "user",
    lastSignedIn: /* @__PURE__ */ new Date()
  });
  return getUserByOpenId(openId);
}
async function updateUserPassword(userId, passwordHash) {
  const db = await getDb();
  if (!db) return;
  await db.update(users).set({ passwordHash }).where(eq(users.id, userId));
}
async function updateUserProfile(userId, data) {
  const db = await getDb();
  if (!db) return;
  await db.update(users).set(data).where(eq(users.id, userId));
}
async function getAllUsers() {
  const db = await getDb();
  if (!db) return [];
  return db.select({ id: users.id, name: users.name, email: users.email, username: users.username, role: users.role, createdAt: users.createdAt, lastSignedIn: users.lastSignedIn }).from(users).orderBy(desc(users.createdAt));
}
async function getAllCategories() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(categories).orderBy(asc(categories.sortOrder), asc(categories.name));
}
async function getCategoryBySlug(slug) {
  const db = await getDb();
  if (!db) return void 0;
  const result = await db.select().from(categories).where(eq(categories.slug, slug)).limit(1);
  return result[0];
}
async function createCategory(data) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.insert(categories).values(data);
}
async function updateCategory(id, data) {
  const db = await getDb();
  if (!db) return;
  await db.update(categories).set(data).where(eq(categories.id, id));
}
async function deleteCategory(id) {
  const db = await getDb();
  if (!db) return;
  await db.delete(productCategories).where(eq(productCategories.categoryId, id));
  await db.delete(categories).where(eq(categories.id, id));
}
async function getAllProducts(opts) {
  const db = await getDb();
  if (!db) return { products: [], total: 0 };
  const conditions = [];
  if (opts?.activeOnly) conditions.push(eq(products.isActive, true));
  if (opts?.search) conditions.push(like(products.name, `%${opts.search}%`));
  let query = db.select().from(products);
  if (conditions.length > 0) {
    query = query.where(and(...conditions));
  }
  const countResult = await db.select({ count: sql`count(*)` }).from(products).where(conditions.length > 0 ? and(...conditions) : void 0);
  const total = Number(countResult[0]?.count || 0);
  let results = await query.orderBy(asc(products.sortOrder), asc(products.name)).limit(opts?.limit || 100).offset(opts?.offset || 0);
  if (opts?.categorySlug) {
    const cat = await getCategoryBySlug(opts.categorySlug);
    if (cat) {
      const pcRows = await db.select({ productId: productCategories.productId }).from(productCategories).where(eq(productCategories.categoryId, cat.id));
      const productIds = pcRows.map((r) => r.productId);
      if (productIds.length > 0) {
        results = results.filter((p) => productIds.includes(p.id));
      } else {
        results = [];
      }
    }
  }
  return { products: results, total };
}
async function getProductBySlug(slug) {
  const db = await getDb();
  if (!db) return void 0;
  const result = await db.select().from(products).where(eq(products.slug, slug)).limit(1);
  return result[0];
}
async function getProductById(id) {
  const db = await getDb();
  if (!db) return void 0;
  const result = await db.select().from(products).where(eq(products.id, id)).limit(1);
  return result[0];
}
async function getProductCategories(productId) {
  const db = await getDb();
  if (!db) return [];
  const rows = await db.select({ categoryId: productCategories.categoryId }).from(productCategories).where(eq(productCategories.productId, productId));
  if (rows.length === 0) return [];
  const catIds = rows.map((r) => r.categoryId);
  return db.select().from(categories).where(inArray(categories.id, catIds));
}
async function getProductVariants(productId) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(productVariants).where(eq(productVariants.productId, productId)).orderBy(asc(productVariants.sortOrder));
}
async function getVariantById(variantId) {
  const db = await getDb();
  if (!db) return void 0;
  const result = await db.select().from(productVariants).where(eq(productVariants.id, variantId)).limit(1);
  return result[0];
}
async function createProductVariant(data) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const result = await db.insert(productVariants).values(data);
  return Number(result[0].insertId);
}
async function updateProductVariant(id, data) {
  const db = await getDb();
  if (!db) return;
  await db.update(productVariants).set(cleanVariantMutationData(data)).where(eq(productVariants.id, id));
}
async function deleteProductVariant(id) {
  const db = await getDb();
  if (!db) return;
  await db.delete(productVariants).where(eq(productVariants.id, id));
}
function cleanVariantMutationData(data) {
  const cleaned = {};
  for (const [key, value] of Object.entries(data || {})) {
    if (value === void 0) continue;
    if (key === "price") {
      const normalized = value === "" || value === null ? "0" : String(value);
      cleaned[key] = normalized.trim() === "" ? "0" : normalized;
      continue;
    }
    if (key === "stockQuantity" || key === "sortOrder") {
      if (value === "" || value === null) continue;
      const parsed = Number(value);
      if (Number.isFinite(parsed)) cleaned[key] = parsed;
      continue;
    }
    if (["compareAtPrice", "sku", "imageUrl"].includes(key)) {
      cleaned[key] = value === "" || value === null ? null : value;
      continue;
    }
    cleaned[key] = value;
  }
  return cleaned;
}
async function replaceProductVariants(productId, variants) {
  const db = await getDb();
  if (!db) return;
  await db.delete(productVariants).where(eq(productVariants.productId, productId));
  const rows = variants.filter((v) => String(v.label || "").trim()).map((v, index) => cleanVariantMutationData({
    productId,
    label: String(v.label || "").trim(),
    price: String(v.price || "0"),
    compareAtPrice: v.compareAtPrice,
    sku: v.sku,
    stockQuantity: v.stockQuantity ?? 100,
    inStock: v.inStock ?? true,
    imageUrl: v.imageUrl,
    sortOrder: v.sortOrder ?? index
  }));
  if (rows.length > 0) {
    await db.insert(productVariants).values(rows);
  }
}
async function getAllProductsWithVariantCount(opts) {
  const { products: prods, total } = await getAllProducts(opts);
  const db = await getDb();
  if (!db) return { products: prods.map((p) => ({ ...p, hasVariants: false, variantCount: 0 })), total };
  const variantCounts = await db.select({
    productId: productVariants.productId,
    count: sql`count(*)`
  }).from(productVariants).groupBy(productVariants.productId);
  const countMap = new Map(variantCounts.map((vc) => [vc.productId, Number(vc.count)]));
  const enriched = prods.map((p) => ({
    ...p,
    hasVariants: (countMap.get(p.id) || 0) > 1,
    variantCount: countMap.get(p.id) || 0
  }));
  return { products: enriched, total };
}
function cleanProductMutationData(data) {
  const cleaned = {};
  const nullableDecimalFields = /* @__PURE__ */ new Set(["compareAtPrice", "discountPercent"]);
  const nullableTextFields = /* @__PURE__ */ new Set([
    "sku",
    "imageUrl",
    "size",
    "contents",
    "form",
    "purity",
    "molecularFormula",
    "molecularWeight",
    "otherNames",
    "coaUrl",
    "hplcUrl",
    "massSpecUrl"
  ]);
  const integerFields = /* @__PURE__ */ new Set(["stockQuantity", "lowStockThreshold", "sortOrder"]);
  for (const [key, value] of Object.entries(data)) {
    if (value === void 0) continue;
    if (key === "price") {
      const normalized = value === "" || value === null ? "0" : String(value);
      cleaned[key] = normalized.trim() === "" ? "0" : normalized;
      continue;
    }
    if (nullableDecimalFields.has(key)) {
      const normalized = value === "" || value === null ? null : String(value);
      cleaned[key] = typeof normalized === "string" && normalized.trim() === "" ? null : normalized;
      continue;
    }
    if (integerFields.has(key)) {
      if (value === "" || value === null) continue;
      const parsed = Number(value);
      if (Number.isFinite(parsed)) cleaned[key] = parsed;
      continue;
    }
    if (nullableTextFields.has(key)) {
      cleaned[key] = value === "" || value === null ? null : value;
      continue;
    }
    if (key === "description" || key === "shortDescription") {
      cleaned[key] = value === null || value === void 0 ? "" : String(value);
      continue;
    }
    cleaned[key] = value;
  }
  return cleaned;
}
async function createProduct(data, categoryIds) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const result = await db.insert(products).values(cleanProductMutationData(data));
  const productId = Number(result[0].insertId);
  if (categoryIds && categoryIds.length > 0) {
    await db.insert(productCategories).values(categoryIds.map((cid) => ({ productId, categoryId: cid })));
  }
  return productId;
}
async function updateProduct(id, data, categoryIds) {
  const db = await getDb();
  if (!db) return;
  await db.update(products).set(cleanProductMutationData(data)).where(eq(products.id, id));
  if (categoryIds !== void 0) {
    await db.delete(productCategories).where(eq(productCategories.productId, id));
    if (categoryIds.length > 0) {
      await db.insert(productCategories).values(categoryIds.map((cid) => ({ productId: id, categoryId: cid })));
    }
  }
}
async function deleteProduct(id) {
  const db = await getDb();
  if (!db) return;
  await db.delete(productCategories).where(eq(productCategories.productId, id));
  await db.delete(researchCitations).where(eq(researchCitations.productId, id));
  await db.delete(productResearch).where(eq(productResearch.productId, id));
  await db.delete(products).where(eq(products.id, id));
}
async function getFeaturedProducts() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(products).where(and(eq(products.isFeatured, true), eq(products.isActive, true))).orderBy(asc(products.sortOrder)).limit(12);
}
async function getProductResearch(productId) {
  const db = await getDb();
  if (!db) return void 0;
  const result = await db.select().from(productResearch).where(eq(productResearch.productId, productId)).limit(1);
  return result[0];
}
async function upsertProductResearch(productId, data) {
  const db = await getDb();
  if (!db) return;
  const existing = await getProductResearch(productId);
  if (existing) {
    await db.update(productResearch).set(data).where(eq(productResearch.productId, productId));
  } else {
    await db.insert(productResearch).values({ productId, ...data });
  }
}
async function getProductCitations(productId) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(researchCitations).where(eq(researchCitations.productId, productId)).orderBy(asc(researchCitations.citationNumber));
}
async function createCitation(data) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.insert(researchCitations).values(data);
}
async function updateCitation(id, data) {
  const db = await getDb();
  if (!db) return;
  await db.update(researchCitations).set(data).where(eq(researchCitations.id, id));
}
async function deleteCitation(id) {
  const db = await getDb();
  if (!db) return;
  await db.delete(researchCitations).where(eq(researchCitations.id, id));
}
async function createOrder(data, items) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const result = await db.insert(orders).values(data);
  const orderId = Number(result[0].insertId);
  if (items.length > 0) {
    await db.insert(orderItems).values(items.map((item) => ({ ...item, orderId })));
  }
  for (const item of items) {
    await db.update(products).set({ stockQuantity: sql`GREATEST(${products.stockQuantity} - ${item.quantity}, 0)` }).where(eq(products.id, item.productId));
  }
  return orderId;
}
async function getOrderByNumber(orderNumber) {
  const db = await getDb();
  if (!db) return void 0;
  const result = await db.select().from(orders).where(eq(orders.orderNumber, orderNumber)).limit(1);
  return result[0];
}
async function getOrderById(id) {
  const db = await getDb();
  if (!db) return void 0;
  const result = await db.select().from(orders).where(eq(orders.id, id)).limit(1);
  return result[0];
}
async function getOrderItems(orderId) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(orderItems).where(eq(orderItems.orderId, orderId));
}
async function getUserOrders(userId) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(orders).where(eq(orders.userId, userId)).orderBy(desc(orders.createdAt));
}
async function getAllOrders(opts) {
  const db = await getDb();
  if (!db) return { orders: [], total: 0 };
  const conditions = [];
  if (opts?.status && opts.status !== "all") conditions.push(eq(orders.status, opts.status));
  const countResult = await db.select({ count: sql`count(*)` }).from(orders).where(conditions.length > 0 ? and(...conditions) : void 0);
  const total = Number(countResult[0]?.count || 0);
  let query = db.select().from(orders);
  if (conditions.length > 0) query = query.where(and(...conditions));
  const result = await query.orderBy(desc(orders.createdAt)).limit(opts?.limit || 50).offset(opts?.offset || 0);
  return { orders: result, total };
}
async function updateOrder(id, data) {
  const db = await getDb();
  if (!db) return;
  await db.update(orders).set(data).where(eq(orders.id, id));
}
async function updateOrderTracking(id, trackingNumber, trackingCarrier) {
  const db = await getDb();
  if (!db) return;
  await db.update(orders).set({ trackingNumber, trackingCarrier, status: "shipped" }).where(eq(orders.id, id));
}
async function updateOrderPayment(paymentId, paymentStatus) {
  const db = await getDb();
  if (!db) return;
  const newStatus = paymentStatus === "finished" ? "paid" : paymentStatus === "failed" ? "cancelled" : void 0;
  const updateData = { paymentStatus };
  if (newStatus) updateData.status = newStatus;
  await db.update(orders).set(updateData).where(eq(orders.paymentId, paymentId));
  if (newStatus === "paid") {
    const paidOrders = await db.select().from(orders).where(eq(orders.paymentId, paymentId)).limit(1);
    const order = paidOrders[0];
    if (order) await issueGiftCardsForOrder(order.id, order.guestEmail || void 0);
  }
}
async function issueGiftCardsForOrder(orderId, purchaserEmail) {
  const db = await getDb();
  if (!db) return;
  const items = await getOrderItems(orderId);
  for (const item of items) {
    if (!String(item.productName || "").toLowerCase().includes("gift card")) continue;
    const amount = Number(item.unitPrice || item.totalPrice || 0);
    for (let i = 0; i < item.quantity; i += 1) {
      let code = "";
      for (let attempt = 0; attempt < 20; attempt += 1) {
        const raw = Math.random().toString(36).slice(2, 10).toUpperCase().replace(/[^A-Z0-9]/g, "").padEnd(8, "X").slice(0, 8);
        code = `${raw.slice(0, 4)}-${raw.slice(4)}`;
        const existing = await getGiftCardByCode(code);
        if (!existing) break;
      }
      await createGiftCard({ code, originalAmount: amount.toFixed(2), balance: amount.toFixed(2), purchaserEmail, orderId, isActive: true });
      console.log(`[Gift Card] Issued ${code} for order ${orderId}`);
    }
  }
}
function normalizeGiftCardCode(code) {
  return String(code || "").toUpperCase().replace(/[^A-Z0-9]/g, "").replace(/^(.{4})(.+)$/, "$1-$2").slice(0, 9);
}
async function getGiftCardByCode(code) {
  const db = await getDb();
  if (!db) return void 0;
  const normalized = normalizeGiftCardCode(code);
  const result = await db.select().from(giftCards).where(eq(giftCards.code, normalized)).limit(1);
  return result[0];
}
async function createGiftCard(data) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.insert(giftCards).values({ ...data, code: normalizeGiftCardCode(data.code) });
}
async function applyGiftCard(code, amount) {
  const db = await getDb();
  if (!db) return { applied: 0, remainingBalance: 0 };
  const card = await getGiftCardByCode(code);
  if (!card || !card.isActive) return { applied: 0, remainingBalance: 0 };
  const balance = Number(card.balance || 0);
  const applied = Math.max(0, Math.min(balance, amount));
  const remainingBalance = Math.max(0, balance - applied);
  await db.update(giftCards).set({ balance: remainingBalance.toFixed(2), isActive: remainingBalance > 0 }).where(eq(giftCards.id, card.id));
  return { applied, remainingBalance };
}
async function getAllDiscountCodes() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(discountCodes).orderBy(desc(discountCodes.createdAt));
}
async function getDiscountByCode(code) {
  const db = await getDb();
  if (!db) return void 0;
  const result = await db.select().from(discountCodes).where(eq(discountCodes.code, code.toUpperCase())).limit(1);
  return result[0];
}
async function createDiscount(data) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.insert(discountCodes).values({ ...data, code: data.code.toUpperCase() });
}
async function updateDiscount(id, data) {
  const db = await getDb();
  if (!db) return;
  if (data.code) data.code = data.code.toUpperCase();
  await db.update(discountCodes).set(data).where(eq(discountCodes.id, id));
}
async function deleteDiscount(id) {
  const db = await getDb();
  if (!db) return;
  await db.delete(discountCodes).where(eq(discountCodes.id, id));
}
async function incrementDiscountUse(id) {
  const db = await getDb();
  if (!db) return;
  await db.update(discountCodes).set({ currentUses: sql`${discountCodes.currentUses} + 1` }).where(eq(discountCodes.id, id));
}
async function getAllSettings() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(siteSettings).orderBy(asc(siteSettings.groupName), asc(siteSettings.settingKey));
}
async function getSetting(key) {
  const db = await getDb();
  if (!db) return void 0;
  const result = await db.select().from(siteSettings).where(eq(siteSettings.settingKey, key)).limit(1);
  return result[0]?.settingValue;
}
async function getSettingsByGroup(groupName) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(siteSettings).where(eq(siteSettings.groupName, groupName));
}
async function updateSetting(key, value) {
  const db = await getDb();
  if (!db) return;
  await db.update(siteSettings).set({ settingValue: value }).where(eq(siteSettings.settingKey, key));
}
async function getCartItems(userId) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(cartItems).where(eq(cartItems.userId, userId));
}
async function addToCart(userId, productId, quantity, variantId, variantLabel) {
  const db = await getDb();
  if (!db) return;
  const conditions = [eq(cartItems.userId, userId), eq(cartItems.productId, productId)];
  if (variantId) {
    conditions.push(eq(cartItems.variantId, variantId));
  }
  const existing = await db.select().from(cartItems).where(and(...conditions)).limit(1);
  if (existing.length > 0) {
    await db.update(cartItems).set({ quantity: sql`${cartItems.quantity} + ${quantity}` }).where(eq(cartItems.id, existing[0].id));
  } else {
    await db.insert(cartItems).values({ userId, productId, quantity, variantId: variantId || null, variantLabel: variantLabel || null });
  }
}
async function updateCartItem(userId, productId, quantity) {
  const db = await getDb();
  if (!db) return;
  if (quantity <= 0) {
    await db.delete(cartItems).where(and(eq(cartItems.userId, userId), eq(cartItems.productId, productId)));
  } else {
    await db.update(cartItems).set({ quantity }).where(and(eq(cartItems.userId, userId), eq(cartItems.productId, productId)));
  }
}
async function removeFromCart(userId, productId) {
  const db = await getDb();
  if (!db) return;
  await db.delete(cartItems).where(and(eq(cartItems.userId, userId), eq(cartItems.productId, productId)));
}
async function clearCart(userId) {
  const db = await getDb();
  if (!db) return;
  await db.delete(cartItems).where(eq(cartItems.userId, userId));
}
async function getDashboardStats() {
  const db = await getDb();
  if (!db) return { totalOrders: 0, totalRevenue: 0, totalProducts: 0, totalUsers: 0, recentOrders: [], lowStockProducts: [] };
  const [orderCount] = await db.select({ count: sql`count(*)` }).from(orders);
  const [revenue] = await db.select({ total: sql`COALESCE(SUM(total), 0)` }).from(orders).where(eq(orders.status, "paid"));
  const [productCount] = await db.select({ count: sql`count(*)` }).from(products);
  const [userCount] = await db.select({ count: sql`count(*)` }).from(users);
  const recentOrders = await db.select().from(orders).orderBy(desc(orders.createdAt)).limit(10);
  const lowStockProducts = await db.select().from(products).where(and(eq(products.isActive, true), lte(products.stockQuantity, products.lowStockThreshold)));
  return {
    totalOrders: Number(orderCount.count),
    totalRevenue: Number(revenue.total),
    totalProducts: Number(productCount.count),
    totalUsers: Number(userCount.count),
    recentOrders,
    lowStockProducts
  };
}
async function upsertSetting(key, value, groupName) {
  const db = await getDb();
  if (!db) return;
  const existing = await db.select().from(siteSettings).where(eq(siteSettings.settingKey, key)).limit(1);
  if (existing.length > 0) {
    await db.update(siteSettings).set({ settingValue: value }).where(eq(siteSettings.settingKey, key));
  } else {
    await db.insert(siteSettings).values({ settingKey: key, settingValue: value, groupName: groupName || "payment" });
  }
}
var _db;
var init_db = __esm({
  "server/db.ts"() {
    "use strict";
    init_schema();
    init_db_init();
    _db = null;
  }
});

// server/_core/env.ts
var ENV;
var init_env = __esm({
  "server/_core/env.ts"() {
    "use strict";
    ENV = {
      appId: process.env.VITE_APP_ID ?? "",
      cookieSecret: process.env.JWT_SECRET ?? "",
      databaseUrl: process.env.DATABASE_URL ?? "",
      oAuthServerUrl: process.env.OAUTH_SERVER_URL ?? "",
      ownerOpenId: process.env.OWNER_OPEN_ID ?? "",
      isProduction: process.env.NODE_ENV === "production",
      forgeApiUrl: process.env.BUILT_IN_FORGE_API_URL ?? "",
      forgeApiKey: process.env.BUILT_IN_FORGE_API_KEY ?? ""
    };
  }
});

// server/storage.ts
function getForgeConfig() {
  const forgeUrl = ENV.forgeApiUrl;
  const forgeKey = ENV.forgeApiKey;
  if (!forgeUrl || !forgeKey) {
    throw new Error(
      "Storage config missing: set BUILT_IN_FORGE_API_URL and BUILT_IN_FORGE_API_KEY"
    );
  }
  return { forgeUrl: forgeUrl.replace(/\/+$/, ""), forgeKey };
}
function normalizeKey(relKey) {
  return relKey.replace(/^\/+/, "");
}
function appendHashSuffix(relKey) {
  const hash = crypto.randomUUID().replace(/-/g, "").slice(0, 8);
  const lastDot = relKey.lastIndexOf(".");
  if (lastDot === -1) return `${relKey}_${hash}`;
  return `${relKey.slice(0, lastDot)}_${hash}${relKey.slice(lastDot)}`;
}
async function storagePut(relKey, data, contentType = "application/octet-stream") {
  const { forgeUrl, forgeKey } = getForgeConfig();
  const key = appendHashSuffix(normalizeKey(relKey));
  const presignUrl = new URL("v1/storage/presign/put", forgeUrl + "/");
  presignUrl.searchParams.set("path", key);
  const presignResp = await fetch(presignUrl, {
    headers: { Authorization: `Bearer ${forgeKey}` }
  });
  if (!presignResp.ok) {
    const msg = await presignResp.text().catch(() => presignResp.statusText);
    throw new Error(`Storage presign failed (${presignResp.status}): ${msg}`);
  }
  const { url: s3Url } = await presignResp.json();
  if (!s3Url) throw new Error("Forge returned empty presign URL");
  const blob = typeof data === "string" ? new Blob([data], { type: contentType }) : new Blob([data], { type: contentType });
  const uploadResp = await fetch(s3Url, {
    method: "PUT",
    headers: { "Content-Type": contentType },
    body: blob
  });
  if (!uploadResp.ok) {
    throw new Error(`Storage upload to S3 failed (${uploadResp.status})`);
  }
  return { key, url: `/manus-storage/${key}` };
}
var init_storage = __esm({
  "server/storage.ts"() {
    "use strict";
    init_env();
  }
});

// server/vialGenerator.ts
var vialGenerator_exports = {};
__export(vialGenerator_exports, {
  generateHeroVialsBuffer: () => generateHeroVialsBuffer,
  generateHeroVialsImage: () => generateHeroVialsImage,
  generateVialBuffer: () => generateVialBuffer,
  generateVialImage: () => generateVialImage,
  generateVialSvgBuffer: () => generateVialSvgBuffer
});
import { createCanvas, loadImage, GlobalFonts } from "@napi-rs/canvas";
import fs3 from "fs";
import path3 from "path";
import { fileURLToPath } from "url";
function firstExisting(paths) {
  const found = paths.find((p) => fs3.existsSync(p));
  if (!found) throw new Error(`Required image asset not found. Checked: ${paths.join(", ")}`);
  return found;
}
async function getLogo() {
  if (!cachedLogo) cachedLogo = await loadImage(firstExisting(LOGO_PATHS));
  return cachedLogo;
}
function getHeroImageBuffer() {
  if (!cachedHeroImage) cachedHeroImage = fs3.readFileSync(firstExisting(HERO_IMAGE_PATHS));
  return cachedHeroImage;
}
async function getPhotorealVialTemplate() {
  if (!cachedPhotorealVialTemplate) cachedPhotorealVialTemplate = await loadImage(firstExisting(PHOTOREAL_VIAL_TEMPLATE_PATHS));
  return cachedPhotorealVialTemplate;
}
function normalizeDoseText(value) {
  const m = value.match(/(\d+(?:,\d+)?(?:\.\d+)?)\s*(mg|mcg|iu|ml|g)(?:\s*\/\s*(ml|vial))?/i);
  if (!m) return value.toUpperCase().trim();
  const unit = m[2].toUpperCase();
  const per = m[3] ? `/${m[3].toUpperCase()}` : "";
  return `${m[1]} ${unit}${per}`;
}
function extractDosage(name) {
  const matches = String(name || "").match(/\d+(?:,\d+)?(?:\.\d+)?\s*(?:mg|mcg|iu|ml|g)(?:\s*\/\s*(?:ml|vial))?/gi);
  if (!matches || !matches.length) return "";
  return matches.map(normalizeDoseText).join(" / ");
}
function extractPeptideName(name) {
  return String(name || "").replace(/\([^)]*\)/g, " ").replace(/\d+(?:,\d+)?(?:\.\d+)?\s*(?:mg|mcg|iu|ml|g)(?:\s*\/\s*(?:ml|vial))?/gi, " ").replace(/\s*\/\s*$/g, "").replace(/^\s*\/\s*/g, "").replace(/\s+/g, " ").trim();
}
function roundRect(ctx, x, y, w, h, r) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}
function fitLines(ctx, text2, maxWidth, maxLines, startSize, minSize) {
  const words = String(text2 || "").replace(/\s*\/\s*/g, " / ").split(/\s+/).filter(Boolean);
  for (let size = startSize; size >= minSize; size -= 2) {
    ctx.font = `900 ${size}px Inter, Arial, sans-serif`;
    const lines = [];
    let line = "";
    for (const word of words) {
      if (word === "/") {
        if (line) {
          lines.push(line.trim());
          line = "";
        }
        continue;
      }
      const test = line ? `${line} ${word}` : word;
      if (ctx.measureText(test).width > maxWidth && line) {
        lines.push(line.trim());
        line = word;
      } else {
        line = test;
      }
    }
    if (line) lines.push(line.trim());
    if (lines.length <= maxLines && lines.every((l) => ctx.measureText(l).width <= maxWidth)) return { lines, size };
  }
  ctx.font = `900 ${minSize}px Inter, Arial, sans-serif`;
  const cleaned = words.filter((w) => w !== "/").join(" ");
  return { lines: [cleaned], size: minSize };
}
function escXml(value) {
  return String(value || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");
}
function assetDataUri(filePath, mime) {
  const data = fs3.readFileSync(filePath).toString("base64");
  return `data:${mime};base64,${data}`;
}
function estimateSvgTextWidth(text2, fontSize) {
  let units = 0;
  for (const ch of String(text2 || "")) {
    if (ch === " ") units += 0.32;
    else if (ch === "/") units += 0.34;
    else if (ch === "-" || ch === "(" || ch === ")") units += 0.34;
    else if (ch === "1" || ch === "I" || ch === "L") units += 0.38;
    else if (ch === "M" || ch === "W") units += 0.86;
    else units += 0.66;
  }
  return units * fontSize;
}
function tokenizeSvgLabel(text2) {
  return String(text2 || "").trim().replace(/\s*\/\s*/g, " / ").replace(/\s+/g, " ").split(" ").filter(Boolean);
}
function wrapSvgTokens(tokens, fontSize, maxWidth, maxLines) {
  const lines = [];
  let line = "";
  for (const token of tokens) {
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
function fitSvgLines(text2, maxWidth, maxLines, startSize, minSize) {
  const clean = String(text2 || "").trim().replace(/\s+/g, " ");
  if (!clean) return { lines: [], fontSize: startSize };
  const tokens = tokenizeSvgLabel(clean);
  for (let size = startSize; size >= minSize; size -= 2) {
    const wrapped = wrapSvgTokens(tokens, size, maxWidth, maxLines);
    if (wrapped?.length && wrapped.every((l) => estimateSvgTextWidth(l, size) <= maxWidth)) {
      return { lines: wrapped, fontSize: size };
    }
  }
  return { lines: [clean], fontSize: minSize };
}
function svgTextBlock(lines, x, y, fontSize, lineHeight, fill, maxWidth = 430) {
  if (!lines.length) return "";
  const startY = y - (lines.length - 1) * lineHeight / 2;
  return `<text x="${x}" y="${startY}" text-anchor="middle" dominant-baseline="middle" font-family="Arial, Helvetica, sans-serif" font-size="${fontSize}" font-weight="900" fill="${fill}">${lines.map((line, i) => {
    const needsFit = estimateSvgTextWidth(line, fontSize) > maxWidth;
    const fitAttrs = needsFit ? ` textLength="${maxWidth}" lengthAdjust="spacingAndGlyphs"` : "";
    return `<tspan x="${x}" dy="${i === 0 ? 0 : lineHeight}"${fitAttrs}>${escXml(line)}</tspan>`;
  }).join("")}</text>`;
}
async function generateVialSvgBuffer(productName) {
  const templatePath = firstExisting(PHOTOREAL_VIAL_TEMPLATE_PATHS);
  const logoPath = firstExisting(LOGO_PATHS);
  const templateUri = assetDataUri(templatePath, "image/png");
  const logoUri = assetDataUri(logoPath, "image/png");
  const W = 1116;
  const H = 1410;
  const cx = W / 2;
  const combined = String(productName || "").trim();
  const peptideName = (extractPeptideName(combined) || "PRODUCT").toUpperCase();
  const dosage = extractDosage(combined).toUpperCase();
  const blue = "#005AA4";
  const nameFit = fitSvgLines(peptideName.replace(/\s*\/\s*/g, " / "), 410, 3, 72, 30);
  const doseFit = fitSvgLines(dosage.replace(/\s*\/\s*/g, " / "), 410, 2, 70, 30);
  const nameLines = nameFit.lines;
  const doseLines = doseFit.lines;
  const nameFont = nameFit.fontSize;
  const doseFont = doseFit.fontSize;
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
    ${doseLines.length ? svgTextBlock(doseLines, cx, 1042, doseFont, Math.round(doseFont * 1.06), blue) : ""}
  </g>
</svg>`;
  return Buffer.from(svg, "utf8");
}
async function drawVialWithLabel(productName) {
  const template = await getPhotorealVialTemplate();
  const W = template.width;
  const H = template.height;
  const canvas = createCanvas(W, H);
  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, W, H);
  ctx.drawImage(template, 0, 0, W, H);
  const cx = W / 2;
  const combined = String(productName || "").trim();
  const peptideName = (extractPeptideName(combined) || "PRODUCT").toUpperCase();
  const dosage = extractDosage(combined).toUpperCase();
  ctx.fillStyle = "rgba(255,255,255,1.0)";
  roundRect(ctx, 275, 455, 566, 660, 70);
  ctx.fill();
  const glass = ctx.createLinearGradient(245, 0, 875, 0);
  glass.addColorStop(0, "rgba(255,255,255,0.00)");
  glass.addColorStop(0.12, "rgba(245,250,255,0.24)");
  glass.addColorStop(0.22, "rgba(185,205,225,0.08)");
  glass.addColorStop(0.8, "rgba(245,250,255,0.18)");
  glass.addColorStop(1, "rgba(255,255,255,0.00)");
  ctx.fillStyle = glass;
  roundRect(ctx, 292, 475, 532, 620, 64);
  ctx.fill();
  const blue = "#005AA4";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = blue;
  const labelName = peptideName.replace(/\s*\/\s*/g, " / ");
  const nameFit = fitLines(ctx, labelName, 380, 3, 50, 24);
  ctx.font = `900 ${nameFit.size}px Inter, Arial, sans-serif`;
  const nameLineGap = nameFit.size * 0.95;
  const nameStartY = 645 - (nameFit.lines.length - 1) * nameLineGap / 2;
  for (let i = 0; i < nameFit.lines.length; i++) {
    ctx.fillText(nameFit.lines[i], cx, nameStartY + i * nameLineGap);
  }
  try {
    const logo = await getLogo();
    const maxLogoW = 440;
    const maxLogoH = 225;
    const scale = Math.min(maxLogoW / logo.width, maxLogoH / logo.height);
    const lw = logo.width * scale;
    const lh = logo.height * scale;
    ctx.drawImage(logo, cx - lw / 2, 850 - lh / 2, lw, lh);
  } catch {
    ctx.font = "900 46px Inter, Arial, sans-serif";
    ctx.fillStyle = "#8c939b";
    ctx.fillText("RIVER VALLEY", cx, 690);
    ctx.font = "800 31px Inter, Arial, sans-serif";
    ctx.fillStyle = blue;
    ctx.fillText("RESEARCH PEPTIDES LLC", cx, 735);
  }
  if (dosage) {
    ctx.fillStyle = blue;
    const doseFit = fitLines(ctx, dosage.replace(/\s*\/\s*/g, " / "), 380, 2, 52, 26);
    ctx.font = `900 ${doseFit.size}px Inter, Arial, sans-serif`;
    const doseLineGap = doseFit.size * 1.02;
    const doseStartY = 1042 - (doseFit.lines.length - 1) * doseLineGap / 2;
    for (let i = 0; i < doseFit.lines.length; i++) {
      ctx.fillText(doseFit.lines[i], cx, doseStartY + i * doseLineGap);
    }
  }
  return Buffer.from(canvas.toBuffer("image/png"));
}
async function generateVialImage(productName, productSlug) {
  return `/api/vial/${productSlug}.png`;
}
async function generateHeroVialsImage(products2) {
  const buffer = getHeroImageBuffer();
  const fileKey = `product-vials/hero-vials.png`;
  const { url } = await storagePut(fileKey, buffer, "image/png");
  return url;
}
async function generateVialBuffer(productName) {
  return drawVialWithLabel(productName);
}
function generateHeroVialsBuffer(products2) {
  return getHeroImageBuffer();
}
var __filename, __dirname, fontPath, cachedHeroImage, cachedLogo, cachedPhotorealVialTemplate, HERO_IMAGE_PATHS, LOGO_PATHS, PHOTOREAL_VIAL_TEMPLATE_PATHS;
var init_vialGenerator = __esm({
  "server/vialGenerator.ts"() {
    "use strict";
    init_storage();
    __filename = fileURLToPath(import.meta.url);
    __dirname = path3.dirname(__filename);
    fontPath = "/usr/share/fonts/truetype/inter/InterVariable.ttf";
    if (fs3.existsSync(fontPath)) GlobalFonts.registerFromPath(fontPath, "Inter");
    cachedHeroImage = null;
    cachedLogo = null;
    cachedPhotorealVialTemplate = null;
    HERO_IMAGE_PATHS = [
      path3.join(process.cwd(), "client/public/assets/rvr-company-hero-3-vials.png"),
      path3.join(__dirname, "hero-3vials.png"),
      path3.join(process.cwd(), "client/public/assets/rvr-hero-vials-new-transparent.png")
    ];
    LOGO_PATHS = [
      path3.join(process.cwd(), "client/public/assets/rvr-company-logo-small.png"),
      path3.join(process.cwd(), "client/public/assets/rvr-logo_19fbf80f.png")
    ];
    PHOTOREAL_VIAL_TEMPLATE_PATHS = [
      path3.join(process.cwd(), "client/public/assets/rvr-photoreal-vial-template.png"),
      path3.join(__dirname, "rvr-photoreal-vial-template.png")
    ];
  }
});

// server/_core/index.ts
import "dotenv/config";
import express2 from "express";
import { createServer } from "http";
import net from "net";
import fs6 from "fs";
import path6 from "path";
import { createExpressMiddleware } from "@trpc/server/adapters/express";

// shared/const.ts
var COOKIE_NAME = "app_session_id";
var ONE_YEAR_MS = 1e3 * 60 * 60 * 24 * 365;
var AXIOS_TIMEOUT_MS = 3e4;
var UNAUTHED_ERR_MSG = "Please login (10001)";
var NOT_ADMIN_ERR_MSG = "You do not have required permission (10002)";

// server/_core/oauth.ts
init_db();

// server/_core/cookies.ts
function isSecureRequest(req) {
  if (req.protocol === "https") return true;
  const forwardedProto = req.headers["x-forwarded-proto"];
  if (!forwardedProto) return false;
  const protoList = Array.isArray(forwardedProto) ? forwardedProto : forwardedProto.split(",");
  return protoList.some((proto) => proto.trim().toLowerCase() === "https");
}
function getSessionCookieOptions(req) {
  return {
    httpOnly: true,
    path: "/",
    sameSite: "none",
    secure: isSecureRequest(req)
  };
}

// shared/_core/errors.ts
var HttpError = class extends Error {
  constructor(statusCode, message) {
    super(message);
    this.statusCode = statusCode;
    this.name = "HttpError";
  }
};
var ForbiddenError = (msg) => new HttpError(403, msg);

// server/_core/sdk.ts
init_db();
init_env();
import axios from "axios";
import { parse as parseCookieHeader } from "cookie";
import { SignJWT, jwtVerify } from "jose";
var isNonEmptyString = (value) => typeof value === "string" && value.length > 0;
var EXCHANGE_TOKEN_PATH = `/webdev.v1.WebDevAuthPublicService/ExchangeToken`;
var GET_USER_INFO_PATH = `/webdev.v1.WebDevAuthPublicService/GetUserInfo`;
var GET_USER_INFO_WITH_JWT_PATH = `/webdev.v1.WebDevAuthPublicService/GetUserInfoWithJwt`;
var OAuthService = class {
  constructor(client) {
    this.client = client;
    console.log("[OAuth] Initialized with baseURL:", ENV.oAuthServerUrl);
    if (!ENV.oAuthServerUrl) {
      console.error(
        "[OAuth] ERROR: OAUTH_SERVER_URL is not configured! Set OAUTH_SERVER_URL environment variable."
      );
    }
  }
  decodeState(state) {
    const redirectUri = atob(state);
    return redirectUri;
  }
  async getTokenByCode(code, state) {
    const payload = {
      clientId: ENV.appId,
      grantType: "authorization_code",
      code,
      redirectUri: this.decodeState(state)
    };
    const { data } = await this.client.post(
      EXCHANGE_TOKEN_PATH,
      payload
    );
    return data;
  }
  async getUserInfoByToken(token) {
    const { data } = await this.client.post(
      GET_USER_INFO_PATH,
      {
        accessToken: token.accessToken
      }
    );
    return data;
  }
};
var createOAuthHttpClient = () => axios.create({
  baseURL: ENV.oAuthServerUrl,
  timeout: AXIOS_TIMEOUT_MS
});
var SDKServer = class {
  constructor(client = createOAuthHttpClient()) {
    this.client = client;
    this.oauthService = new OAuthService(this.client);
  }
  deriveLoginMethod(platforms, fallback) {
    if (fallback && fallback.length > 0) return fallback;
    if (!Array.isArray(platforms) || platforms.length === 0) return null;
    const set = new Set(
      platforms.filter((p) => typeof p === "string")
    );
    if (set.has("REGISTERED_PLATFORM_EMAIL")) return "email";
    if (set.has("REGISTERED_PLATFORM_GOOGLE")) return "google";
    if (set.has("REGISTERED_PLATFORM_APPLE")) return "apple";
    if (set.has("REGISTERED_PLATFORM_MICROSOFT") || set.has("REGISTERED_PLATFORM_AZURE"))
      return "microsoft";
    if (set.has("REGISTERED_PLATFORM_GITHUB")) return "github";
    const first = Array.from(set)[0];
    return first ? first.toLowerCase() : null;
  }
  /**
   * Exchange OAuth authorization code for access token
   * @example
   * const tokenResponse = await sdk.exchangeCodeForToken(code, state);
   */
  async exchangeCodeForToken(code, state) {
    return this.oauthService.getTokenByCode(code, state);
  }
  /**
   * Get user information using access token
   * @example
   * const userInfo = await sdk.getUserInfo(tokenResponse.accessToken);
   */
  async getUserInfo(accessToken) {
    const data = await this.oauthService.getUserInfoByToken({
      accessToken
    });
    const loginMethod = this.deriveLoginMethod(
      data?.platforms,
      data?.platform ?? data.platform ?? null
    );
    return {
      ...data,
      platform: loginMethod,
      loginMethod
    };
  }
  parseCookies(cookieHeader) {
    if (!cookieHeader) {
      return /* @__PURE__ */ new Map();
    }
    const parsed = parseCookieHeader(cookieHeader);
    return new Map(Object.entries(parsed));
  }
  getSessionSecret() {
    const secret = ENV.cookieSecret;
    return new TextEncoder().encode(secret);
  }
  /**
   * Create a session token for a Manus user openId
   * @example
   * const sessionToken = await sdk.createSessionToken(userInfo.openId);
   */
  async createSessionToken(openId, options = {}) {
    return this.signSession(
      {
        openId,
        appId: ENV.appId,
        name: options.name || ""
      },
      options
    );
  }
  async signSession(payload, options = {}) {
    const issuedAt = Date.now();
    const expiresInMs = options.expiresInMs ?? ONE_YEAR_MS;
    const expirationSeconds = Math.floor((issuedAt + expiresInMs) / 1e3);
    const secretKey = this.getSessionSecret();
    return new SignJWT({
      openId: payload.openId,
      appId: payload.appId,
      name: payload.name
    }).setProtectedHeader({ alg: "HS256", typ: "JWT" }).setExpirationTime(expirationSeconds).sign(secretKey);
  }
  async verifySession(cookieValue) {
    if (!cookieValue) {
      console.warn("[Auth] Missing session cookie");
      return null;
    }
    try {
      const secretKey = this.getSessionSecret();
      const { payload } = await jwtVerify(cookieValue, secretKey, {
        algorithms: ["HS256"]
      });
      const { openId, appId, name } = payload;
      if (!isNonEmptyString(openId) || !isNonEmptyString(appId) || !isNonEmptyString(name)) {
        console.warn("[Auth] Session payload missing required fields");
        return null;
      }
      return {
        openId,
        appId,
        name
      };
    } catch (error) {
      console.warn("[Auth] Session verification failed", String(error));
      return null;
    }
  }
  async getUserInfoWithJwt(jwtToken) {
    const payload = {
      jwtToken,
      projectId: ENV.appId
    };
    const { data } = await this.client.post(
      GET_USER_INFO_WITH_JWT_PATH,
      payload
    );
    const loginMethod = this.deriveLoginMethod(
      data?.platforms,
      data?.platform ?? data.platform ?? null
    );
    return {
      ...data,
      platform: loginMethod,
      loginMethod
    };
  }
  async authenticateRequest(req) {
    const cookies = this.parseCookies(req.headers.cookie);
    const sessionCookie = cookies.get(COOKIE_NAME);
    if (sessionCookie) {
      try {
        const localSecret = new TextEncoder().encode(process.env.JWT_SECRET || "fallback-secret-key");
        const { payload } = await jwtVerify(sessionCookie, localSecret, { algorithms: ["HS256"] });
        if (payload.sub && typeof payload.sub === "string" && payload.sub.startsWith("local_")) {
          const user2 = await getUserByOpenId(payload.sub);
          if (user2) return user2;
        }
      } catch {
      }
    }
    const session = await this.verifySession(sessionCookie);
    if (!session) {
      throw ForbiddenError("Invalid session cookie");
    }
    if (session.openId.startsWith(CRON_OPEN_ID_PREFIX)) {
      const userInfo = await this.getUserInfoWithJwt(sessionCookie ?? "");
      const taskUid = userInfo.taskUid ?? null;
      if (!taskUid) {
        throw ForbiddenError("Cron session missing task_uid");
      }
      return buildCronUser(userInfo);
    }
    const sessionUserId = session.openId;
    const signedInAt = /* @__PURE__ */ new Date();
    let user = await getUserByOpenId(sessionUserId);
    if (!user) {
      try {
        const userInfo = await this.getUserInfoWithJwt(sessionCookie ?? "");
        await upsertUser({
          openId: userInfo.openId,
          name: userInfo.name || null,
          email: userInfo.email ?? null,
          loginMethod: userInfo.loginMethod ?? userInfo.platform ?? null,
          lastSignedIn: signedInAt
        });
        user = await getUserByOpenId(userInfo.openId);
      } catch (error) {
        console.error("[Auth] Failed to sync user from OAuth:", error);
        throw ForbiddenError("Failed to sync user info");
      }
    }
    if (!user) {
      throw ForbiddenError("User not found");
    }
    await upsertUser({
      openId: user.openId,
      lastSignedIn: signedInAt
    });
    return user;
  }
};
var CRON_OPEN_ID_PREFIX = "cron_";
function buildCronUser(userInfo) {
  const now = /* @__PURE__ */ new Date();
  return {
    id: -1,
    openId: userInfo.openId,
    name: userInfo.name || "Manus Scheduled Task",
    email: null,
    loginMethod: null,
    role: "user",
    createdAt: now,
    updatedAt: now,
    lastSignedIn: now,
    taskUid: userInfo.taskUid ?? void 0,
    isCron: true
  };
}
var sdk = new SDKServer();

// server/_core/oauth.ts
function getQueryParam(req, key) {
  const value = req.query[key];
  return typeof value === "string" ? value : void 0;
}
function registerOAuthRoutes(app) {
  app.get("/api/oauth/callback", async (req, res) => {
    const code = getQueryParam(req, "code");
    const state = getQueryParam(req, "state");
    if (!code || !state) {
      res.status(400).json({ error: "code and state are required" });
      return;
    }
    try {
      const tokenResponse = await sdk.exchangeCodeForToken(code, state);
      const userInfo = await sdk.getUserInfo(tokenResponse.accessToken);
      if (!userInfo.openId) {
        res.status(400).json({ error: "openId missing from user info" });
        return;
      }
      await upsertUser({
        openId: userInfo.openId,
        name: userInfo.name || null,
        email: userInfo.email ?? null,
        loginMethod: userInfo.loginMethod ?? userInfo.platform ?? null,
        lastSignedIn: /* @__PURE__ */ new Date()
      });
      const sessionToken = await sdk.createSessionToken(userInfo.openId, {
        name: userInfo.name || "",
        expiresInMs: ONE_YEAR_MS
      });
      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });
      res.redirect(302, "/");
    } catch (error) {
      console.error("[OAuth] Callback failed", error);
      res.status(500).json({ error: "OAuth callback failed" });
    }
  });
}

// server/_core/storageProxy.ts
init_env();
import path2 from "path";
import fs2 from "fs";
function registerStorageProxy(app) {
  app.get("/manus-storage/*", async (req, res) => {
    const key = req.params[0];
    if (!key) {
      res.status(400).send("Missing storage key");
      return;
    }
    const localPath = path2.join(process.cwd(), "client", "public", "assets", key);
    if (fs2.existsSync(localPath)) {
      res.set("Cache-Control", "public, max-age=31536000, immutable");
      res.redirect(301, `/assets/${key}`);
      return;
    }
    if (!ENV.forgeApiUrl || !ENV.forgeApiKey) {
      res.status(404).send("Asset not found");
      return;
    }
    try {
      const forgeUrl = new URL(
        "v1/storage/presign/get",
        ENV.forgeApiUrl.replace(/\/+$/, "") + "/"
      );
      forgeUrl.searchParams.set("path", key);
      const forgeResp = await fetch(forgeUrl, {
        headers: { Authorization: `Bearer ${ENV.forgeApiKey}` }
      });
      if (!forgeResp.ok) {
        const body = await forgeResp.text().catch(() => "");
        console.error(`[StorageProxy] forge error: ${forgeResp.status} ${body}`);
        res.status(502).send("Storage backend error");
        return;
      }
      const { url } = await forgeResp.json();
      if (!url) {
        res.status(502).send("Empty signed URL from backend");
        return;
      }
      res.set("Cache-Control", "no-store");
      res.redirect(307, url);
    } catch (err) {
      console.error("[StorageProxy] failed:", err);
      res.status(502).send("Storage proxy error");
    }
  });
}

// server/_core/systemRouter.ts
import { z } from "zod";

// server/_core/notification.ts
init_env();
import { TRPCError } from "@trpc/server";
var TITLE_MAX_LENGTH = 1200;
var CONTENT_MAX_LENGTH = 2e4;
var trimValue = (value) => value.trim();
var isNonEmptyString2 = (value) => typeof value === "string" && value.trim().length > 0;
var buildEndpointUrl = (baseUrl) => {
  const normalizedBase = baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`;
  return new URL(
    "webdevtoken.v1.WebDevService/SendNotification",
    normalizedBase
  ).toString();
};
var validatePayload = (input) => {
  if (!isNonEmptyString2(input.title)) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Notification title is required."
    });
  }
  if (!isNonEmptyString2(input.content)) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Notification content is required."
    });
  }
  const title = trimValue(input.title);
  const content = trimValue(input.content);
  if (title.length > TITLE_MAX_LENGTH) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: `Notification title must be at most ${TITLE_MAX_LENGTH} characters.`
    });
  }
  if (content.length > CONTENT_MAX_LENGTH) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: `Notification content must be at most ${CONTENT_MAX_LENGTH} characters.`
    });
  }
  return { title, content };
};
async function notifyOwner(payload) {
  const { title, content } = validatePayload(payload);
  if (!ENV.forgeApiUrl) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Notification service URL is not configured."
    });
  }
  if (!ENV.forgeApiKey) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Notification service API key is not configured."
    });
  }
  const endpoint = buildEndpointUrl(ENV.forgeApiUrl);
  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        accept: "application/json",
        authorization: `Bearer ${ENV.forgeApiKey}`,
        "content-type": "application/json",
        "connect-protocol-version": "1"
      },
      body: JSON.stringify({ title, content })
    });
    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      console.warn(
        `[Notification] Failed to notify owner (${response.status} ${response.statusText})${detail ? `: ${detail}` : ""}`
      );
      return false;
    }
    return true;
  } catch (error) {
    console.warn("[Notification] Error calling notification service:", error);
    return false;
  }
}

// server/_core/trpc.ts
import { initTRPC, TRPCError as TRPCError2 } from "@trpc/server";
import superjson from "superjson";
var t = initTRPC.context().create({
  transformer: superjson
});
var router = t.router;
var publicProcedure = t.procedure;
var requireUser = t.middleware(async (opts) => {
  const { ctx, next } = opts;
  if (!ctx.user) {
    throw new TRPCError2({ code: "UNAUTHORIZED", message: UNAUTHED_ERR_MSG });
  }
  return next({
    ctx: {
      ...ctx,
      user: ctx.user
    }
  });
});
var protectedProcedure = t.procedure.use(requireUser);
var adminProcedure = t.procedure.use(
  t.middleware(async (opts) => {
    const { ctx, next } = opts;
    if (!ctx.user || ctx.user.role !== "admin") {
      throw new TRPCError2({ code: "FORBIDDEN", message: NOT_ADMIN_ERR_MSG });
    }
    return next({
      ctx: {
        ...ctx,
        user: ctx.user
      }
    });
  })
);

// server/_core/systemRouter.ts
var systemRouter = router({
  health: publicProcedure.input(
    z.object({
      timestamp: z.number().min(0, "timestamp cannot be negative")
    })
  ).query(() => ({
    ok: true
  })),
  notifyOwner: adminProcedure.input(
    z.object({
      title: z.string().min(1, "title is required"),
      content: z.string().min(1, "content is required")
    })
  ).mutation(async ({ input }) => {
    const delivered = await notifyOwner(input);
    return {
      success: delivered
    };
  })
});

// server/routers.ts
init_db();
import { TRPCError as TRPCError3 } from "@trpc/server";
import { z as z2 } from "zod";
import bcrypt from "bcryptjs";
import { SignJWT as SignJWT2 } from "jose";
import { nanoid } from "nanoid";

// server/nowpayments.ts
init_db();
import axios2 from "axios";
import crypto2 from "crypto";
var NOWPAYMENTS_API_URL = "https://api.nowpayments.io/v1";
var NOWPAYMENTS_SANDBOX_URL = "https://api-sandbox.nowpayments.io/v1";
async function getConfig() {
  const apiKey = await getSetting("nowpayments_api_key");
  const ipnSecret = await getSetting("nowpayments_ipn_secret");
  const sandboxMode = await getSetting("nowpayments_sandbox_mode");
  const isSandbox = sandboxMode === "true";
  const baseUrl = isSandbox ? NOWPAYMENTS_SANDBOX_URL : NOWPAYMENTS_API_URL;
  return { apiKey: apiKey || "", ipnSecret: ipnSecret || "", baseUrl, isSandbox };
}
async function createPayment(orderId, orderNumber, totalUsd, payerEmail) {
  const config = await getConfig();
  if (!config.apiKey) throw new Error("NowPayments API key not configured. Please set it in the admin panel.");
  const webhookUrl = await getSetting("nowpayments_webhook_url");
  const payload = {
    price_amount: parseFloat(totalUsd),
    price_currency: "usd",
    order_id: orderNumber,
    order_description: `River Valley Research Peptides - Order ${orderNumber}`,
    ipn_callback_url: webhookUrl || void 0,
    success_url: `${process.env.VITE_APP_URL || ""}/order/${orderNumber}?status=success`,
    cancel_url: `${process.env.VITE_APP_URL || ""}/order/${orderNumber}?status=cancelled`
  };
  if (payerEmail) payload.payer_email = payerEmail;
  const response = await axios2.post(`${config.baseUrl}/invoice`, payload, {
    headers: {
      "x-api-key": config.apiKey,
      "Content-Type": "application/json"
    }
  });
  const invoiceData = response.data;
  await updateOrder(orderId, {
    paymentId: String(invoiceData.id),
    paymentStatus: "waiting"
  });
  return {
    invoiceUrl: invoiceData.invoice_url,
    paymentId: String(invoiceData.id),
    invoiceId: invoiceData.id
  };
}
async function getPaymentStatus(paymentId) {
  const config = await getConfig();
  if (!config.apiKey) throw new Error("NowPayments API key not configured");
  const response = await axios2.get(`${config.baseUrl}/payment/${paymentId}`, {
    headers: { "x-api-key": config.apiKey }
  });
  return response.data;
}
function verifyIpnSignature(body, receivedSignature, ipnSecret) {
  const sortedKeys = Object.keys(body).sort();
  const sortedBody = {};
  for (const key of sortedKeys) {
    sortedBody[key] = body[key];
  }
  const hmac = crypto2.createHmac("sha512", ipnSecret);
  hmac.update(JSON.stringify(sortedBody));
  const calculatedSignature = hmac.digest("hex");
  return calculatedSignature === receivedSignature;
}
async function handleIpnWebhook(body, signature) {
  const config = await getConfig();
  if (config.ipnSecret && signature) {
    const valid = verifyIpnSignature(body, signature, config.ipnSecret);
    if (!valid) {
      console.warn("[NowPayments] Invalid IPN signature");
      throw new Error("Invalid IPN signature");
    }
  }
  const paymentStatus = body.payment_status;
  const orderId = body.order_id;
  const paymentId = String(body.payment_id);
  console.log(`[NowPayments] IPN received: order=${orderId}, status=${paymentStatus}, paymentId=${paymentId}`);
  if (paymentStatus === "finished" || paymentStatus === "confirmed") {
    await updateOrderPayment(paymentId, "finished");
  } else if (paymentStatus === "failed" || paymentStatus === "expired" || paymentStatus === "refunded") {
    await updateOrderPayment(paymentId, "failed");
  } else if (paymentStatus === "partially_paid") {
    await updateOrderPayment(paymentId, "partially_paid");
  }
  return { success: true };
}
async function getApiStatus() {
  const config = await getConfig();
  if (!config.apiKey) return { configured: false, status: "not_configured" };
  try {
    const response = await axios2.get(`${config.baseUrl}/status`, {
      headers: { "x-api-key": config.apiKey }
    });
    return { configured: true, status: response.data?.message || "ok", sandbox: config.isSandbox };
  } catch (err) {
    return { configured: true, status: "error", error: err.message, sandbox: config.isSandbox };
  }
}

// server/routers.ts
init_vialGenerator();
import fs4 from "fs";
import path4 from "path";
var JWT_SECRET_KEY = new TextEncoder().encode(process.env.JWT_SECRET || "fallback-secret-key");
function makeProductSlug(value) {
  return String(value || "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}
var cachedProductAssets = null;
function getProductAssetMap() {
  if (cachedProductAssets) return cachedProductAssets;
  cachedProductAssets = /* @__PURE__ */ new Map();
  const assetsDir = path4.join(process.cwd(), "client", "public", "assets");
  try {
    for (const file of fs4.readdirSync(assetsDir)) {
      if (!/\.(png|jpg|jpeg|webp)$/i.test(file)) continue;
      const key = makeProductSlug(file.replace(/\.[^.]+$/, "").replace(/_[0-9a-f]{8}$/i, ""));
      if (key && !key.startsWith("rvr-logo") && !key.startsWith("rvr-hero") && !key.startsWith("rvr-vial-template")) {
        cachedProductAssets.set(key, `/assets/${file}`);
      }
    }
  } catch {
  }
  return cachedProductAssets;
}
var NON_VIAL_TERMS = ["capsule", "capsules", "cream", "cleanser", "sunscreen", "mask", "lotion", "serum", "kit", "box", "card", "storage", "cap", "bottle", "spray", "dropper"];
function isNonVialProduct(input) {
  const text2 = [input.slug, input.name, input.form, input.category, ...(input.categories || []).map((c) => c?.name)].filter(Boolean).join(" ").toLowerCase();
  return NON_VIAL_TERMS.some((term) => text2.includes(term));
}
function generatedVialUrlForProduct(input) {
  const slug = makeProductSlug(input.slug || input.name || "product") || "product";
  const params = new URLSearchParams();
  if (input.name) params.set("name", String(input.name));
  if (input.size || input.contents) params.set("size", String(input.size || input.contents));
  params.set("v", "rvr-photoreal-adaptive-fit-v1");
  return `/api/vial/${slug}.png?${params.toString()}`;
}
function productAssetForInput(input) {
  const assets = getProductAssetMap();
  const slugKey = makeProductSlug(input.slug || "");
  if (slugKey && assets.has(slugKey)) return assets.get(slugKey);
  const nameKey = makeProductSlug(input.name || "");
  if (nameKey && assets.has(nameKey)) return assets.get(nameKey);
  return "";
}
function shouldReplaceGeneratedImage(image) {
  if (!image) return true;
  const value = String(image);
  return value.startsWith("/api/vial/") || value.includes("rvr-vial-template-single") || value.includes("rvr-vial-template") || value.includes("/assets/generated/");
}

function isLegacyBundledVialAsset(value) {
  const image = String(value || "").toLowerCase();
  if (!image) return false;
  if (image.startsWith("/assets/products/")) return false;
  return image.includes("rvr-vial-template-single") || image.includes("rvr-company-blank-vial") || image.includes("bacteriostatic-water") || image.startsWith("/assets/") && /_[0-9a-f]{8}\.(webp|png|jpg|jpeg)(?:\?|$)/i.test(image) && !/(gift-card|capsule|capsules|tube|cream|cleanser|sunscreen|mask|kit|box|storage|cap)/i.test(image);
}
function shouldReplaceVialImage(product, image) {
  return shouldReplaceGeneratedImage(image) || !isNonVialProduct(product) && isLegacyBundledVialAsset(image);
}
function productAssetForDisplay(input) {
  const assets = getProductAssetMap();
  const exact = productAssetForInput(input);
  if (exact) return exact;
  const baseKeys = [makeProductSlug(input.slug || ""), makeProductSlug(input.name || "")].filter(Boolean);
  const sizeKey = makeProductSlug(input.size || input.contents || "");
  for (const baseKey of baseKeys) {
    if (sizeKey && assets.has(`${baseKey}-${sizeKey}`)) return assets.get(`${baseKey}-${sizeKey}`);
    const matches = Array.from(assets.entries()).filter(([key]) => key === baseKey || key.startsWith(`${baseKey}-`)).sort(([a], [b]) => {
      const aCaps = a.includes("capsule");
      const bCaps = b.includes("capsule");
      if (aCaps !== bCaps) return aCaps ? 1 : -1;
      return a.localeCompare(b, void 0, { numeric: true });
    });
    if (matches.length) return matches[0][1];
  }
  return "";
}
function preserveManusImage(product) {
  if (!product) return product;
  if (!isNonVialProduct(product)) {
    return shouldReplaceVialImage(product, product.imageUrl) ? { ...product, imageUrl: generatedVialUrlForProduct(product) } : product;
  }
  const mappedImage = productAssetForDisplay(product);
  if (mappedImage && shouldReplaceGeneratedImage(product.imageUrl)) {
    return { ...product, imageUrl: mappedImage };
  }
  return product;
}
var adminProcedure2 = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "admin") throw new TRPCError3({ code: "FORBIDDEN", message: "Admin access required" });
  return next({ ctx });
});
function normalizeAdminProductInput(input) {
  const out = { ...input };
  if (out.price === void 0 || out.price === null || String(out.price).trim() === "") out.price = "0";
  for (const key of ["compareAtPrice", "discountPercent"]) {
    if (out[key] === void 0 || out[key] === null || String(out[key]).trim() === "") out[key] = null;
  }
  for (const key of [
    "sku",
    "imageUrl",
    "size",
    "contents",
    "form",
    "purity",
    "molecularFormula",
    "molecularWeight",
    "otherNames",
    "coaUrl",
    "hplcUrl",
    "massSpecUrl"
  ]) {
    if (out[key] === void 0 || out[key] === null || String(out[key]).trim() === "") out[key] = null;
  }
  if (out.stockQuantity === void 0 || out.stockQuantity === null || out.stockQuantity === "") out.stockQuantity = 100;
  if (out.lowStockThreshold === "" || out.lowStockThreshold === null) delete out.lowStockThreshold;
  if (out.sortOrder === "" || out.sortOrder === null) delete out.sortOrder;
  return out;
}
function normalizeAdminVariantInput(variant, fallbackPrice = "0") {
  const out = { ...variant };
  if (out.price === void 0 || out.price === null || String(out.price).trim() === "") out.price = fallbackPrice || "0";
  if (out.compareAtPrice === void 0 || out.compareAtPrice === null || String(out.compareAtPrice).trim() === "") out.compareAtPrice = null;
  for (const key of ["sku", "imageUrl"]) {
    if (out[key] === void 0 || out[key] === null || String(out[key]).trim() === "") out[key] = null;
  }
  if (out.stockQuantity === void 0 || out.stockQuantity === null || out.stockQuantity === "") out.stockQuantity = 100;
  return out;
}
var productVariantInput = z2.object({
  id: z2.number().optional(),
  label: z2.string().optional(),
  price: z2.string().optional(),
  compareAtPrice: z2.string().optional(),
  sku: z2.string().optional(),
  stockQuantity: z2.number().optional(),
  inStock: z2.boolean().optional(),
  imageUrl: z2.string().optional(),
  sortOrder: z2.number().optional()
});
var appRouter = router({
  system: systemRouter,
  // ─── Auth ────────────────────────────────────────────────────────
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true };
    }),
    register: publicProcedure.input(z2.object({
      email: z2.string().email(),
      username: z2.string().min(3).max(50),
      password: z2.string().min(6),
      name: z2.string().optional()
    })).mutation(async ({ input, ctx }) => {
      const existingEmail = await getUserByEmail(input.email);
      if (existingEmail) throw new TRPCError3({ code: "CONFLICT", message: "Email already registered" });
      const existingUsername = await getUserByUsername(input.username);
      if (existingUsername) throw new TRPCError3({ code: "CONFLICT", message: "Username already taken" });
      const passwordHash = await bcrypt.hash(input.password, 12);
      const user = await createLocalUser({ email: input.email, username: input.username, passwordHash, name: input.name });
      if (!user) throw new TRPCError3({ code: "INTERNAL_SERVER_ERROR", message: "Failed to create account" });
      const token = await new SignJWT2({ sub: user.openId, userId: user.id }).setProtectedHeader({ alg: "HS256" }).setExpirationTime("30d").sign(JWT_SECRET_KEY);
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.cookie(COOKIE_NAME, token, { ...cookieOptions, maxAge: 30 * 24 * 60 * 60 * 1e3 });
      return { success: true, user: { id: user.id, name: user.name, email: user.email, username: user.username, role: user.role } };
    }),
    login: publicProcedure.input(z2.object({
      emailOrUsername: z2.string(),
      password: z2.string()
    })).mutation(async ({ input, ctx }) => {
      let user = await getUserByEmail(input.emailOrUsername);
      if (!user) user = await getUserByUsername(input.emailOrUsername);
      if (!user || !user.passwordHash) throw new TRPCError3({ code: "UNAUTHORIZED", message: "Invalid credentials" });
      const valid = await bcrypt.compare(input.password, user.passwordHash);
      if (!valid) throw new TRPCError3({ code: "UNAUTHORIZED", message: "Invalid credentials" });
      const token = await new SignJWT2({ sub: user.openId, userId: user.id }).setProtectedHeader({ alg: "HS256" }).setExpirationTime("30d").sign(JWT_SECRET_KEY);
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.cookie(COOKIE_NAME, token, { ...cookieOptions, maxAge: 30 * 24 * 60 * 60 * 1e3 });
      await upsertUser({ openId: user.openId, lastSignedIn: /* @__PURE__ */ new Date() });
      return { success: true, user: { id: user.id, name: user.name, email: user.email, username: user.username, role: user.role } };
    }),
    updateProfile: protectedProcedure.input(z2.object({
      name: z2.string().optional(),
      username: z2.string().min(3).max(50).optional(),
      email: z2.string().email().optional(),
      phone: z2.string().optional(),
      shippingAddress: z2.string().optional(),
      savedPaymentInfo: z2.string().optional()
    })).mutation(async ({ input, ctx }) => {
      await updateUserProfile(ctx.user.id, input);
      return { success: true };
    })
  }),
  // ─── Products (public) ──────────────────────────────────────────
  products: router({
    list: publicProcedure.input(z2.object({
      category: z2.string().optional(),
      search: z2.string().optional(),
      limit: z2.number().optional(),
      offset: z2.number().optional()
    }).optional()).query(async ({ input }) => {
      const result = await getAllProductsWithVariantCount({ activeOnly: true, categorySlug: input?.category, search: input?.search, limit: input?.limit, offset: input?.offset });
      return { ...result, products: result.products.map(preserveManusImage) };
    }),
    featured: publicProcedure.query(async () => {
      const products2 = await getFeaturedProducts();
      return products2.map(preserveManusImage);
    }),
    bySlug: publicProcedure.input(z2.object({ slug: z2.string() })).query(async ({ input }) => {
      const product = await getProductBySlug(input.slug);
      if (!product) throw new TRPCError3({ code: "NOT_FOUND", message: "Product not found" });
      const cats = await getProductCategories(product.id);
      const research = await getProductResearch(product.id);
      const citations = await getProductCitations(product.id);
      const variants = await getProductVariants(product.id);
      return { ...preserveManusImage(product), categories: cats, research, citations, variants };
    }),
    variants: publicProcedure.input(z2.object({ productId: z2.number() })).query(async ({ input }) => {
      return getProductVariants(input.productId);
    })
  }),
  // ─── Categories (public) ───────────────────────────────────────
  categories: router({
    list: publicProcedure.query(async () => {
      return getAllCategories();
    })
  }),
  // ─── Cart ──────────────────────────────────────────────────────
  cart: router({
    get: protectedProcedure.query(async ({ ctx }) => {
      const items = await getCartItems(ctx.user.id);
      const enriched = [];
      for (const item of items) {
        const product = await getProductById(item.productId);
        if (product) {
          enriched.push({ ...item, product });
        }
      }
      return enriched;
    }),
    add: protectedProcedure.input(z2.object({ productId: z2.number(), quantity: z2.number().min(1).default(1), variantId: z2.number().optional(), variantLabel: z2.string().optional() })).mutation(async ({ input, ctx }) => {
      await addToCart(ctx.user.id, input.productId, input.quantity, input.variantId, input.variantLabel);
      return { success: true };
    }),
    update: protectedProcedure.input(z2.object({ productId: z2.number(), quantity: z2.number() })).mutation(async ({ input, ctx }) => {
      await updateCartItem(ctx.user.id, input.productId, input.quantity);
      return { success: true };
    }),
    remove: protectedProcedure.input(z2.object({ productId: z2.number() })).mutation(async ({ input, ctx }) => {
      await removeFromCart(ctx.user.id, input.productId);
      return { success: true };
    }),
    clear: protectedProcedure.mutation(async ({ ctx }) => {
      await clearCart(ctx.user.id);
      return { success: true };
    })
  }),
  // ─── Orders (customer) ─────────────────────────────────────────
  orders: router({
    myOrders: protectedProcedure.query(async ({ ctx }) => {
      const orderList = await getUserOrders(ctx.user.id);
      return orderList;
    }),
    byNumber: publicProcedure.input(z2.object({ orderNumber: z2.string() })).query(async ({ input }) => {
      const order = await getOrderByNumber(input.orderNumber);
      if (!order) throw new TRPCError3({ code: "NOT_FOUND", message: "Order not found" });
      const items = await getOrderItems(order.id);
      return { ...order, items };
    }),
    create: publicProcedure.input(z2.object({
      userId: z2.number().optional(),
      guestEmail: z2.string().optional(),
      guestName: z2.string().optional(),
      shippingName: z2.string(),
      shippingAddress: z2.string(),
      shippingCity: z2.string(),
      shippingState: z2.string(),
      shippingZip: z2.string(),
      shippingCountry: z2.string().default("US"),
      discountCode: z2.string().optional(),
      giftCardCode: z2.string().optional(),
      items: z2.array(z2.object({
        productId: z2.number(),
        quantity: z2.number().min(1),
        variantId: z2.number().optional(),
        variantLabel: z2.string().optional()
      })),
      notes: z2.string().optional()
    })).mutation(async ({ input }) => {
      let subtotal = 0;
      let discountAmount = 0;
      const orderItems2 = [];
      for (const item of input.items) {
        const product = await getProductById(item.productId);
        if (!product) throw new TRPCError3({ code: "NOT_FOUND", message: `Product ${item.productId} not found` });
        if (!product.inStock || product.stockQuantity < item.quantity) throw new TRPCError3({ code: "BAD_REQUEST", message: `${product.name} is out of stock` });
        let unitPrice = Number(product.price);
        if (product.discountActive && product.discountPercent) {
          unitPrice = unitPrice * (1 - Number(product.discountPercent) / 100);
        }
        const totalPrice = unitPrice * item.quantity;
        subtotal += totalPrice;
        const displayName = item.variantLabel ? `${product.name} (${item.variantLabel})` : product.name;
        orderItems2.push({ productId: item.productId, productName: displayName, variantId: item.variantId || null, variantLabel: item.variantLabel || null, quantity: item.quantity, unitPrice: unitPrice.toFixed(2), totalPrice: totalPrice.toFixed(2) });
      }
      if (input.discountCode) {
        const discount = await getDiscountByCode(input.discountCode);
        if (discount && discount.isActive) {
          if (discount.maxUses && discount.currentUses >= discount.maxUses) throw new TRPCError3({ code: "BAD_REQUEST", message: "Discount code has been used too many times" });
          if (discount.minOrderAmount && subtotal < Number(discount.minOrderAmount)) throw new TRPCError3({ code: "BAD_REQUEST", message: `Minimum order amount of $${discount.minOrderAmount} required` });
          if (discount.type === "percentage") {
            discountAmount = subtotal * (Number(discount.value) / 100);
          } else {
            discountAmount = Number(discount.value);
          }
          await incrementDiscountUse(discount.id);
        }
      }
      let giftCardApplied = 0;
      if (input.giftCardCode) {
        const gift = await applyGiftCard(input.giftCardCode, Math.max(0, subtotal - discountAmount));
        giftCardApplied = gift.applied;
        if (giftCardApplied <= 0) throw new TRPCError3({ code: "BAD_REQUEST", message: "Invalid or depleted gift card code" });
        discountAmount += giftCardApplied;
      }
      const freeShippingThreshold = Number(await getSetting("free_shipping_threshold") || "200");
      const flatRateShipping = Number(await getSetting("flat_rate_shipping") || "9.99");
      const shippingCost = subtotal - discountAmount >= freeShippingThreshold ? 0 : flatRateShipping;
      const total = subtotal - discountAmount + shippingCost;
      const orderNumber = `RVR-${Date.now().toString(36).toUpperCase()}-${nanoid(4).toUpperCase()}`;
      const orderId = await createOrder({
        orderNumber,
        userId: input.userId || null,
        guestEmail: input.guestEmail,
        guestName: input.guestName,
        status: "pending",
        shippingName: input.shippingName,
        shippingAddress: input.shippingAddress,
        shippingCity: input.shippingCity,
        shippingState: input.shippingState,
        shippingZip: input.shippingZip,
        shippingCountry: input.shippingCountry,
        subtotal: subtotal.toFixed(2),
        discountAmount: discountAmount.toFixed(2),
        shippingCost: shippingCost.toFixed(2),
        total: total.toFixed(2),
        discountCode: input.discountCode,
        notes: input.notes
      }, orderItems2);
      if (input.userId) await clearCart(input.userId);
      return { orderId, orderNumber, total: total.toFixed(2), subtotal: subtotal.toFixed(2), discountAmount: discountAmount.toFixed(2), shippingCost: shippingCost.toFixed(2) };
    })
  }),
  // ─── Discounts (public validate) ───────────────────────────────
  discounts: router({
    validate: publicProcedure.input(z2.object({ code: z2.string(), subtotal: z2.number() })).query(async ({ input }) => {
      const discount = await getDiscountByCode(input.code);
      if (!discount || !discount.isActive) return { valid: false, message: "Invalid discount code" };
      if (discount.maxUses && discount.currentUses >= discount.maxUses) return { valid: false, message: "Discount code expired" };
      if (discount.minOrderAmount && input.subtotal < Number(discount.minOrderAmount)) return { valid: false, message: `Minimum order of $${discount.minOrderAmount} required` };
      if (discount.expiresAt && new Date(discount.expiresAt) < /* @__PURE__ */ new Date()) return { valid: false, message: "Discount code expired" };
      let amount = 0;
      if (discount.type === "percentage") {
        amount = input.subtotal * (Number(discount.value) / 100);
      } else {
        amount = Number(discount.value);
      }
      return { valid: true, type: discount.type, value: Number(discount.value), discountAmount: amount, message: `${discount.type === "percentage" ? `${discount.value}%` : `$${discount.value}`} off applied!` };
    })
  }),
  // ─── Gift Cards ────────────────────────────────────────────────
  giftCards: router({
    validate: publicProcedure.input(z2.object({ code: z2.string(), subtotal: z2.number() })).query(async ({ input }) => {
      const card = await getGiftCardByCode(input.code);
      if (!card || !card.isActive || Number(card.balance) <= 0) {
        return { valid: false, message: "Invalid or depleted gift card" };
      }
      const balance = Number(card.balance);
      return {
        valid: true,
        balance,
        appliedAmount: Math.min(balance, input.subtotal),
        remainingDue: Math.max(0, input.subtotal - balance),
        message: `Gift card balance: $${balance.toFixed(2)}`
      };
    })
  }),
  // ─── Site Settings (public) ────────────────────────────────────
  settings: router({
    public: publicProcedure.query(async () => {
      const SENSITIVE_KEYS = ["nowpayments_api_key", "nowpayments_ipn_secret"];
      const all = await getAllSettings();
      const map = {};
      for (const s of all) {
        if (!SENSITIVE_KEYS.includes(s.settingKey)) {
          map[s.settingKey] = s.settingValue || "";
        }
      }
      return map;
    }),
    // Admin-only: includes sensitive payment keys
    all: adminProcedure2.query(async () => {
      const all = await getAllSettings();
      const map = {};
      for (const s of all) {
        map[s.settingKey] = s.settingValue || "";
      }
      return map;
    })
  }),
  // ─── Payments ─────────────────────────────────────────────────
  payments: router({
    createInvoice: publicProcedure.input(z2.object({
      orderNumber: z2.string(),
      email: z2.string().optional()
    })).mutation(async ({ input }) => {
      const order = await getOrderByNumber(input.orderNumber);
      if (!order) throw new TRPCError3({ code: "NOT_FOUND", message: "Order not found" });
      if (order.status !== "pending") throw new TRPCError3({ code: "BAD_REQUEST", message: "Order is no longer pending" });
      const result = await createPayment(order.id, order.orderNumber, String(order.total), input.email || order.guestEmail || void 0);
      return result;
    }),
    status: publicProcedure.input(z2.object({ paymentId: z2.string() })).query(async ({ input }) => {
      const status = await getPaymentStatus(input.paymentId);
      return status;
    })
  }),
  // ─── Admin ─────────────────────────────────────────────────────
  admin: router({
    dashboard: adminProcedure2.query(async () => {
      return getDashboardStats();
    }),
    // Products
    products: router({
      list: adminProcedure2.input(z2.object({ search: z2.string().optional(), limit: z2.number().optional(), offset: z2.number().optional() }).optional()).query(async ({ input }) => {
        const result = await getAllProducts({ search: input?.search, limit: input?.limit, offset: input?.offset });
        const enrichedProducts = await Promise.all(result.products.map(async (product) => ({
          ...preserveManusImage(product),
          variants: await getProductVariants(product.id)
        })));
        return { ...result, products: enrichedProducts };
      }),
      get: adminProcedure2.input(z2.object({ id: z2.number() })).query(async ({ input }) => {
        const product = await getProductById(input.id);
        if (!product) throw new TRPCError3({ code: "NOT_FOUND" });
        const cats = await getProductCategories(product.id);
        const research = await getProductResearch(product.id);
        const citations = await getProductCitations(product.id);
        const variants = await getProductVariants(product.id);
        return { ...preserveManusImage(product), categories: cats, research, citations, variants };
      }),
      create: adminProcedure2.input(z2.object({
        name: z2.string(),
        slug: z2.string(),
        description: z2.string().optional(),
        shortDescription: z2.string().optional(),
        price: z2.string(),
        compareAtPrice: z2.string().optional(),
        sku: z2.string().optional(),
        imageUrl: z2.string().optional(),
        size: z2.string().optional(),
        contents: z2.string().optional(),
        form: z2.string().optional(),
        purity: z2.string().optional(),
        molecularFormula: z2.string().optional(),
        molecularWeight: z2.string().optional(),
        otherNames: z2.string().optional(),
        stockQuantity: z2.number().optional(),
        inStock: z2.boolean().optional(),
        isActive: z2.boolean().optional(),
        isFeatured: z2.boolean().optional(),
        discountPercent: z2.string().optional(),
        discountActive: z2.boolean().optional(),
        coaUrl: z2.string().optional(),
        hplcUrl: z2.string().optional(),
        massSpecUrl: z2.string().optional(),
        categoryIds: z2.array(z2.number()).optional(),
        variants: z2.array(productVariantInput).optional()
      })).mutation(async ({ input }) => {
        const { categoryIds, variants, ...rawData } = input;
        const data = normalizeAdminProductInput(rawData);
        const mappedImage = productAssetForInput(data);
        if (!isNonVialProduct(data)) {
          data.imageUrl = generatedVialUrlForProduct(data);
        } else if (mappedImage && shouldReplaceGeneratedImage(data.imageUrl)) {
          data.imageUrl = mappedImage;
        }
        const id = await createProduct(data, categoryIds);
        if (variants?.length) {
          await replaceProductVariants(id, variants.map((variant, index) => {
            const cleanVariant = normalizeAdminVariantInput(variant, data.price);
            return {
              label: cleanVariant.label || data.size || data.name,
              price: cleanVariant.price || data.price || "0",
              compareAtPrice: cleanVariant.compareAtPrice || void 0,
              sku: cleanVariant.sku || void 0,
              stockQuantity: cleanVariant.stockQuantity ?? data.stockQuantity ?? 100,
              inStock: cleanVariant.inStock ?? data.inStock ?? true,
              imageUrl: cleanVariant.imageUrl || data.imageUrl,
              sortOrder: cleanVariant.sortOrder ?? index
            };
          }));
        }
        return { id };
      }),
      update: adminProcedure2.input(z2.object({
        id: z2.number(),
        name: z2.string().optional(),
        slug: z2.string().optional(),
        description: z2.string().optional(),
        shortDescription: z2.string().optional(),
        price: z2.string().optional(),
        compareAtPrice: z2.string().optional(),
        sku: z2.string().optional(),
        imageUrl: z2.string().optional(),
        size: z2.string().optional(),
        contents: z2.string().optional(),
        form: z2.string().optional(),
        purity: z2.string().optional(),
        molecularFormula: z2.string().optional(),
        molecularWeight: z2.string().optional(),
        otherNames: z2.string().optional(),
        stockQuantity: z2.number().optional(),
        lowStockThreshold: z2.number().optional(),
        inStock: z2.boolean().optional(),
        isActive: z2.boolean().optional(),
        isFeatured: z2.boolean().optional(),
        discountPercent: z2.string().optional(),
        discountActive: z2.boolean().optional(),
        coaUrl: z2.string().optional(),
        hplcUrl: z2.string().optional(),
        massSpecUrl: z2.string().optional(),
        sortOrder: z2.number().optional(),
        categoryIds: z2.array(z2.number()).optional(),
        variants: z2.array(productVariantInput).optional(),
        regenerateVial: z2.boolean().optional()
      })).mutation(async ({ input }) => {
        const { id, categoryIds, variants, regenerateVial, ...rawData } = input;
        const data = normalizeAdminProductInput(rawData);
        const mappedImage = productAssetForInput(data);
        if (!isNonVialProduct(data)) {
          data.imageUrl = generatedVialUrlForProduct(data);
        } else if (mappedImage && (regenerateVial || shouldReplaceGeneratedImage(data.imageUrl))) {
          data.imageUrl = mappedImage;
        }
        await updateProduct(id, data, categoryIds);
        if (variants !== void 0) {
          const product = await getProductById(id);
          await replaceProductVariants(id, variants.map((variant, index) => {
            const cleanVariant = normalizeAdminVariantInput(variant, String(product?.price || data.price || "0"));
            return {
              label: cleanVariant.label || product?.size || product?.name || `Option ${index + 1}`,
              price: cleanVariant.price || String(product?.price || data.price || "0"),
              compareAtPrice: cleanVariant.compareAtPrice || void 0,
              sku: cleanVariant.sku || void 0,
              stockQuantity: cleanVariant.stockQuantity ?? product?.stockQuantity ?? 100,
              inStock: cleanVariant.inStock ?? product?.inStock ?? true,
              imageUrl: cleanVariant.imageUrl || data.imageUrl || product?.imageUrl || void 0,
              sortOrder: cleanVariant.sortOrder ?? index
            };
          }));
        }
        return { success: true };
      }),
      delete: adminProcedure2.input(z2.object({ id: z2.number() })).mutation(async ({ input }) => {
        await deleteProduct(input.id);
        return { success: true };
      }),
      generateAllVials: adminProcedure2.mutation(async () => {
        const { products: allProducts } = await getAllProducts({});
        let generated = 0;
        for (const p of allProducts) {
          try {
            const vialUrl = await generateVialImage(p.name, p.slug);
            await updateProduct(p.id, { imageUrl: vialUrl });
            generated++;
          } catch (e) {
            console.error(`Failed to generate vial for ${p.name}:`, e);
          }
        }
        return { success: true, generated, total: allProducts.length };
      }),
      generateHero: adminProcedure2.mutation(async () => {
        const { products: allProducts } = await getAllProducts({});
        const featured = allProducts.filter((p) => p.isFeatured).slice(0, 3);
        const heroProducts = featured.length >= 3 ? featured : allProducts.slice(0, 3);
        const heroUrl = await generateHeroVialsImage(heroProducts.map((p) => ({ name: p.name })));
        return { success: true, url: heroUrl };
      })
    }),
    // Categories
    categories: router({
      list: adminProcedure2.query(async () => getAllCategories()),
      create: adminProcedure2.input(z2.object({ name: z2.string(), slug: z2.string(), description: z2.string().optional(), sortOrder: z2.number().optional() })).mutation(async ({ input }) => {
        await createCategory(input);
        return { success: true };
      }),
      update: adminProcedure2.input(z2.object({ id: z2.number(), name: z2.string().optional(), slug: z2.string().optional(), description: z2.string().optional(), sortOrder: z2.number().optional() })).mutation(async ({ input }) => {
        const { id, ...data } = input;
        await updateCategory(id, data);
        return { success: true };
      }),
      delete: adminProcedure2.input(z2.object({ id: z2.number() })).mutation(async ({ input }) => {
        await deleteCategory(input.id);
        return { success: true };
      })
    }),
    // Research
    research: router({
      get: adminProcedure2.input(z2.object({ productId: z2.number() })).query(async ({ input }) => {
        const research = await getProductResearch(input.productId);
        const citations = await getProductCitations(input.productId);
        return { research, citations };
      }),
      upsert: adminProcedure2.input(z2.object({
        productId: z2.number(),
        overview: z2.string().optional(),
        chemicalMakeup: z2.string().optional(),
        researchContent: z2.string().optional()
      })).mutation(async ({ input }) => {
        const { productId, ...data } = input;
        await upsertProductResearch(productId, data);
        return { success: true };
      }),
      addCitation: adminProcedure2.input(z2.object({
        productId: z2.number(),
        citationNumber: z2.number(),
        title: z2.string(),
        authors: z2.string().optional(),
        journal: z2.string().optional(),
        year: z2.string().optional(),
        url: z2.string().optional(),
        summary: z2.string().optional()
      })).mutation(async ({ input }) => {
        await createCitation(input);
        return { success: true };
      }),
      updateCitation: adminProcedure2.input(z2.object({
        id: z2.number(),
        citationNumber: z2.number().optional(),
        title: z2.string().optional(),
        authors: z2.string().optional(),
        journal: z2.string().optional(),
        year: z2.string().optional(),
        url: z2.string().optional(),
        summary: z2.string().optional()
      })).mutation(async ({ input }) => {
        const { id, ...data } = input;
        await updateCitation(id, data);
        return { success: true };
      }),
      deleteCitation: adminProcedure2.input(z2.object({ id: z2.number() })).mutation(async ({ input }) => {
        await deleteCitation(input.id);
        return { success: true };
      })
    }),
    // Orders
    orders: router({
      list: adminProcedure2.input(z2.object({ status: z2.string().optional(), limit: z2.number().optional(), offset: z2.number().optional() }).optional()).query(async ({ input }) => {
        return getAllOrders({ status: input?.status, limit: input?.limit, offset: input?.offset });
      }),
      get: adminProcedure2.input(z2.object({ id: z2.number() })).query(async ({ input }) => {
        const order = await getOrderById(input.id);
        if (!order) throw new TRPCError3({ code: "NOT_FOUND" });
        const items = await getOrderItems(order.id);
        return { ...order, items };
      }),
      updateStatus: adminProcedure2.input(z2.object({ id: z2.number(), status: z2.enum(["pending", "paid", "processing", "shipped", "delivered", "cancelled", "refunded"]) })).mutation(async ({ input }) => {
        await updateOrder(input.id, { status: input.status });
        return { success: true };
      }),
      updateTracking: adminProcedure2.input(z2.object({ id: z2.number(), trackingNumber: z2.string(), trackingCarrier: z2.string() })).mutation(async ({ input }) => {
        await updateOrderTracking(input.id, input.trackingNumber, input.trackingCarrier);
        return { success: true };
      })
    }),
    // Discounts
    discounts: router({
      list: adminProcedure2.query(async () => getAllDiscountCodes()),
      create: adminProcedure2.input(z2.object({
        code: z2.string(),
        description: z2.string().optional(),
        type: z2.enum(["percentage", "fixed"]),
        value: z2.string(),
        minOrderAmount: z2.string().optional(),
        maxUses: z2.number().optional(),
        isActive: z2.boolean().optional(),
        appliesToAll: z2.boolean().optional(),
        productId: z2.number().optional(),
        expiresAt: z2.date().optional()
      })).mutation(async ({ input }) => {
        await createDiscount(input);
        return { success: true };
      }),
      update: adminProcedure2.input(z2.object({
        id: z2.number(),
        code: z2.string().optional(),
        description: z2.string().optional(),
        type: z2.enum(["percentage", "fixed"]).optional(),
        value: z2.string().optional(),
        minOrderAmount: z2.string().optional(),
        maxUses: z2.number().optional(),
        isActive: z2.boolean().optional(),
        appliesToAll: z2.boolean().optional(),
        productId: z2.number().optional(),
        expiresAt: z2.date().optional()
      })).mutation(async ({ input }) => {
        const { id, ...data } = input;
        await updateDiscount(id, data);
        return { success: true };
      }),
      delete: adminProcedure2.input(z2.object({ id: z2.number() })).mutation(async ({ input }) => {
        await deleteDiscount(input.id);
        return { success: true };
      })
    }),
    // Site Settings
    settings: router({
      list: adminProcedure2.query(async () => getAllSettings()),
      update: adminProcedure2.input(z2.object({ key: z2.string(), value: z2.string() })).mutation(async ({ input }) => {
        await updateSetting(input.key, input.value);
        return { success: true };
      }),
      bulkUpdate: adminProcedure2.input(z2.array(z2.object({ key: z2.string(), value: z2.string() }))).mutation(async ({ input }) => {
        for (const { key, value } of input) {
          await updateSetting(key, value);
        }
        return { success: true };
      })
    }),
    // Users
    users: router({
      list: adminProcedure2.query(async () => getAllUsers())
    }),
    // NowPayments status check
    paymentStatus: adminProcedure2.query(async () => {
      return getApiStatus();
    })
  })
});

// server/_core/context.ts
async function createContext(opts) {
  let user = null;
  try {
    user = await sdk.authenticateRequest(opts.req);
  } catch (error) {
    user = null;
  }
  return {
    req: opts.req,
    res: opts.res,
    user
  };
}

// server/_core/vite.ts
import express from "express";
import fs5 from "fs";
import { nanoid as nanoid2 } from "nanoid";
import path5 from "path";
async function setupVite(app, server) {
  const { createServer: createViteServer } = await import("vite");
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true
  };
  const vite = await createViteServer({
    configFile: false,
    root: path5.resolve(import.meta.dirname, "../..", "client"),
    server: serverOptions,
    appType: "custom"
  });
  app.use(vite.middlewares);
  app.use("*", async (req, res, next) => {
    const url = req.originalUrl;
    try {
      const clientTemplate = path5.resolve(
        import.meta.dirname,
        "../..",
        "client",
        "index.html"
      );
      let template = await fs5.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid2()}"`
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e);
      next(e);
    }
  });
}
function serveStatic(app) {
  const distPath = process.env.NODE_ENV === "development" ? path5.resolve(import.meta.dirname, "../..", "dist", "public") : path5.resolve(import.meta.dirname, "public");
  if (!fs5.existsSync(distPath)) {
    console.error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }
  app.use(express.static(distPath, {
    maxAge: "30d",
    immutable: true,
    setHeaders: (res, filePath) => {
      if (filePath.endsWith("index.html")) {
        res.setHeader("Cache-Control", "no-cache");
      } else if (/\.(?:js|css|png|jpg|jpeg|webp|svg|ico|woff2?)$/i.test(filePath)) {
        res.setHeader("Cache-Control", "public, max-age=2592000, immutable");
      }
    }
  }));
  app.use("*", (_req, res) => {
    res.sendFile(path5.resolve(distPath, "index.html"));
  });
}

// server/_core/index.ts
function isPortAvailable(port) {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}
async function findAvailablePort(startPort = 3e3) {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}
async function startServer() {
  const app = express2();
  const server = createServer(app);
  app.use(express2.json({ limit: "50mb" }));
  app.use(express2.urlencoded({ limit: "50mb", extended: true }));
  registerStorageProxy(app);
  registerOAuthRoutes(app);
  app.get("/api/vial/hero.png", (req, res) => {
    res.redirect("/assets/rvr-hero-vials-new-transparent.png");
  });
  app.get("/api/vial/:slug.png", async (req, res) => {
    try {
      const { getProductBySlug: getProductBySlug2 } = await Promise.resolve().then(() => (init_db(), db_exports));
      const { generateVialSvgBuffer: generateVialSvgBuffer2 } = await Promise.resolve().then(() => (init_vialGenerator(), vialGenerator_exports));
      const product = await getProductBySlug2(req.params.slug);
      const queryName = typeof req.query.name === "string" ? req.query.name : "";
      const querySize = typeof req.query.size === "string" ? req.query.size : "";
      const productName = (queryName || product?.name || req.params.slug.replace(/-/g, " ")).trim();
      const productSize = (querySize || product?.size || "").trim();
      const displayName = productSize && !productName.toLowerCase().includes(productSize.toLowerCase()) ? `${productName} ${productSize}` : productName;
      const buffer = await generateVialSvgBuffer2(displayName);
      res.setHeader("Content-Type", "image/svg+xml; charset=utf-8");
      res.setHeader("Cache-Control", "no-store");
      res.send(buffer);
    } catch (err) {
      console.error("[Vial Generate Error]", err.message);
      res.status(500).send("Error");
    }
  });
  const getRuntimeProductAssetDirs = () => {
    const dirs = [
      path6.join(process.cwd(), "dist", "public", "assets"),
      path6.join(process.cwd(), "client", "public", "assets"),
      path6.join(import.meta.dirname, "public", "assets")
    ];
    return Array.from(new Set(dirs));
  };
  const writeRuntimeProductAsset = (relativeName, data) => {
    for (const assetsDir of getRuntimeProductAssetDirs()) {
      fs6.mkdirSync(assetsDir, { recursive: true });
      fs6.writeFileSync(path6.join(assetsDir, relativeName), data);
    }
  };
  const getProductAssetConnection2 = async () => {
    const url = process.env.DATABASE_URL;
    if (!url) return null;
    try {
      return await mysql.createConnection({ uri: url, connectTimeout: 1e4 });
    } catch (error) {
      console.warn("[Product Asset Storage] Database connection unavailable; using local asset path.", error);
      return null;
    }
  };
  const ensureProductAssetsTable2 = async (conn) => {
    await conn.execute(`CREATE TABLE IF NOT EXISTS productAssets (
      id int AUTO_INCREMENT NOT NULL,
      name varchar(255) NOT NULL,
      contentType varchar(100) NOT NULL,
      data LONGBLOB NOT NULL,
      createdAt timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updatedAt timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      UNIQUE KEY productAssets_name_unique (name)
    )`);
  };
  const saveRuntimeProductAsset = async (relativeName, data, contentType) => {
    writeRuntimeProductAsset(relativeName, data);
    const conn = await getProductAssetConnection2();
    if (!conn) return { name: relativeName, url: `/assets/${relativeName}` };
    try {
      await ensureProductAssetsTable2(conn);
      const assetBuffer = Buffer.isBuffer(data) ? data : Buffer.from(data);
      await conn.execute(
        `INSERT INTO productAssets (name, contentType, data)
         VALUES (?, ?, ?)
         ON DUPLICATE KEY UPDATE contentType = VALUES(contentType), data = VALUES(data), updatedAt = CURRENT_TIMESTAMP`,
        [relativeName, contentType, assetBuffer]
      );
      return { name: relativeName, url: `/api/product-assets/${encodeURIComponent(relativeName)}` };
    } catch (error) {
      console.warn("[Product Asset Storage] Database asset save failed; using local asset path.", error);
      return { name: relativeName, url: `/assets/${relativeName}` };
    } finally {
      await conn.end().catch(() => {});
    }
  };
  const readRuntimeProductAsset = async (relativeName) => {
    const conn = await getProductAssetConnection2();
    if (!conn) return null;
    try {
      await ensureProductAssetsTable2(conn);
      const [rows] = await conn.execute(`SELECT contentType, data FROM productAssets WHERE name = ? LIMIT 1`, [relativeName]);
      const row = rows?.[0];
      return row ? { contentType: String(row.contentType || "application/octet-stream"), data: Buffer.from(row.data) } : null;
    } catch (error) {
      console.warn("[Product Asset Storage] Database asset read failed; trying local asset path.", error);
      return null;
    } finally {
      await conn.end().catch(() => {});
    }
  };
  app.get("/api/product-assets/:name", async (req, res) => {
    try {
      const requestedName = path6.basename(String(req.params.name || ""));
      if (!requestedName) {
        res.status(400).send("Missing asset name");
        return;
      }
      const dbAsset = await readRuntimeProductAsset(requestedName);
      if (dbAsset) {
        res.setHeader("Content-Type", dbAsset.contentType);
        res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
        res.send(dbAsset.data);
        return;
      }
      for (const assetsDir of getRuntimeProductAssetDirs()) {
        const fullPath = path6.join(assetsDir, requestedName);
        if (fs6.existsSync(fullPath)) {
          const ext = path6.extname(requestedName).toLowerCase();
          const contentType = ext === ".png" ? "image/png" : ext === ".jpg" || ext === ".jpeg" ? "image/jpeg" : ext === ".webp" ? "image/webp" : ext === ".gif" ? "image/gif" : ext === ".svg" ? "image/svg+xml" : "application/octet-stream";
          res.setHeader("Content-Type", contentType);
          res.send(fs6.readFileSync(fullPath));
          return;
        }
      }
      res.status(404).send("Product asset not found");
    } catch (err) {
      res.status(404).send("Product asset not found");
    }
  });
  app.get("/api/product-assets", async (req, res) => {
    try {
      const seen = /* @__PURE__ */ new Set();
      const assets = getRuntimeProductAssetDirs().flatMap((assetsDir) => fs6.existsSync(assetsDir) ? fs6.readdirSync(assetsDir) : []).filter((file) => /\.(png|jpg|jpeg|webp|gif|svg)$/i.test(file)).filter((file) => {
        if (seen.has(file)) return false;
        seen.add(file);
        return true;
      }).map((file) => ({ name: file, url: `/assets/${file}` })).sort((a, b) => a.name.localeCompare(b.name));
      res.json(assets);
    } catch (err) {
      res.status(500).send(err?.message || "Unable to list assets");
    }
  });
  app.get("/api/nih-report", async (req, res) => {
    try {
      const name = String(req.query?.name || "").trim();
      if (!name) {
        res.status(400).send("Product name is required");
        return;
      }
      const searchUrl = new URL("https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi");
      searchUrl.searchParams.set("db", "pubmed");
      searchUrl.searchParams.set("retmode", "json");
      searchUrl.searchParams.set("retmax", "8");
      searchUrl.searchParams.set("sort", "relevance");
      searchUrl.searchParams.set("term", `${name} peptide OR ${name}`);
      const searchResponse = await fetch(searchUrl);
      if (!searchResponse.ok) throw new Error("NIH search failed");
      const searchJson = await searchResponse.json();
      const ids = searchJson?.esearchresult?.idlist || [];
      if (!ids.length) {
        res.status(404).send(`No NIH/PubMed report found for ${name}`);
        return;
      }
      const summaryUrl = new URL("https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi");
      summaryUrl.searchParams.set("db", "pubmed");
      summaryUrl.searchParams.set("retmode", "json");
      summaryUrl.searchParams.set("id", ids.join(","));
      const summaryResponse = await fetch(summaryUrl);
      if (!summaryResponse.ok) throw new Error("NIH summary failed");
      const summaryJson = await summaryResponse.json();
      const articles = ids.map((id) => summaryJson?.result?.[id]).filter(Boolean).map((item, index) => {
        const authors = Array.isArray(item.authors) ? item.authors.map((author) => author.name).filter(Boolean).join(", ") : "";
        return [
          `${index + 1}. ${item.title || "Untitled NIH/PubMed record"}`,
          authors ? `Authors: ${authors}` : "",
          item.fulljournalname ? `Journal: ${item.fulljournalname}${item.pubdate ? ` (${item.pubdate})` : ""}` : "",
          `NIH/PubMed: https://pubmed.ncbi.nlm.nih.gov/${item.uid}/`
        ].filter(Boolean).join("\n");
      });
      res.json({
        description: [
          `NIH/PubMed Research Report for ${name}`,
          "",
          "The following NIH-indexed PubMed records were found for this product name. Review for accuracy before publishing.",
          "",
          ...articles
        ].join("\n\n")
      });
    } catch (err) {
      console.error("[NIH Report Error]", err);
      res.status(500).send(err?.message || "Unable to pull NIH report");
    }
  });
  app.post("/api/product-image/upload", async (req, res) => {
    try {
      const makeSafeSlug = (value) => String(value || "product-image").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "product-image";
      const dataUrl = String(req.body?.dataUrl || "");
      const match = dataUrl.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);
      if (!match) {
        res.status(400).send("Invalid image upload");
        return;
      }
      const mimeType = match[1].toLowerCase();
      const buffer = Buffer.from(match[2], "base64");
      const baseSlug = makeSafeSlug(req.body?.slug || req.body?.filename);
      if (mimeType === "image/svg+xml" || mimeType === "image/svg") {
        const svgText = buffer.toString("utf8").trim();
        if (!/<svg[\s>]/i.test(svgText) || /<script[\s>]/i.test(svgText) || /on\w+\s*=/i.test(svgText)) {
          res.status(400).send("SVG uploads must be valid, safe SVG files. Please upload a PNG, JPG, WEBP, or a clean SVG.");
          return;
        }
        const filename2 = `${baseSlug}-${Date.now()}.svg`;
        const saved = await saveRuntimeProductAsset(filename2, svgText, "image/svg+xml");
        res.json(saved);
        return;
      }
      const { createCanvas: createCanvas2, loadImage: loadImage2 } = await import("@napi-rs/canvas");
      const image = await loadImage2(buffer);
      const canvas = createCanvas2(image.width, image.height);
      const context = canvas.getContext("2d");
      context.drawImage(image, 0, 0);
      const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
      const pixels = imageData.data;
      for (let index = 0; index < pixels.length; index += 4) {
        const red = pixels[index];
        const green = pixels[index + 1];
        const blue = pixels[index + 2];
        const alpha = pixels[index + 3];
        if (alpha > 0 && red > 238 && green > 238 && blue > 238 && Math.abs(red - green) < 12 && Math.abs(red - blue) < 12 && Math.abs(green - blue) < 12) {
          const whiteness = Math.min(red, green, blue);
          pixels[index + 3] = whiteness > 250 ? 0 : Math.max(0, Math.min(alpha, (255 - whiteness) * 12));
        }
      }
      context.putImageData(imageData, 0, 0);
      const processedBuffer = await canvas.encode("png");
      const filename = `${baseSlug}-${Date.now()}.png`;
      const saved = await saveRuntimeProductAsset(filename, processedBuffer, "image/png");
      res.json(saved);
    } catch (err) {
      console.error("[Product Image Upload Error]", err);
      res.status(500).send(err?.message || "Unable to upload product image");
    }
  });
  app.post("/api/product-preview/link", async (req, res) => {
    try {
      const makeSafeSlug = (value) => String(value || "preview-product").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "preview-product";
      const type = String(req.body?.type || "vial");
      const slug = makeSafeSlug(req.body?.slug || req.body?.name);
      const name = String(req.body?.name || slug.replace(/-/g, " ")).trim();
      const size = String(req.body?.size || "").trim();
      const displayName = size && !name.toLowerCase().includes(size.toLowerCase()) ? `${name} ${size}` : name;
      const assetsDir = path6.join(process.cwd(), "client", "public", "assets");
      fs6.mkdirSync(assetsDir, { recursive: true });
      let buffer;
      let extension = "png";
      let contentType = "image/png";
      if (type === "cream") {
        buffer = fs6.readFileSync(path6.join(assetsDir, "lotion-bottle-blank-hd-tube.png"));
      } else if (type === "face-mask") {
        buffer = fs6.readFileSync(path6.join(assetsDir, "face-mask-blank-hd.png"));
      } else if (type === "gift-card") {
        buffer = fs6.readFileSync(path6.join(assetsDir, "Gift-Card.png"));
      } else {
        const { generateVialBuffer: generateVialBuffer3 } = await Promise.resolve().then(() => (init_vialGenerator(), vialGenerator_exports));
        buffer = await generateVialBuffer3(displayName);
      }
      const amountSlug = type === "gift-card" && giftCardRange ? `-${makeSafeSlug(giftCardRange)}` : "";
      const filename = `${slug}-${type}${amountSlug}-preview.${extension}`;
      const saved = await saveRuntimeProductAsset(filename, buffer, contentType);
      res.json({ url: saved.url, contentType });
    } catch (err) {
      console.error("[Product Preview Link Error]", err);
      res.status(500).send(err?.message || "Unable to link preview image");
    }
  });
  app.post("/api/nowpayments/ipn", async (req, res) => {
    try {
      const signature = req.headers["x-nowpayments-sig"] || "";
      const result = await handleIpnWebhook(req.body, signature);
      res.json(result);
    } catch (err) {
      console.error("[NowPayments IPN Error]", err.message);
      res.status(400).json({ error: err.message });
    }
  });
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext
    })
  );
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }
  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);
  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }
  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}
startServer().catch(console.error);
