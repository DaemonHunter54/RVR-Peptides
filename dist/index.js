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
var users, categories, products, productCategories, researchCitations, productResearch, orders, orderItems, discountCodes, giftCards, giftCardTransactions, siteSettings, cartItems, productVariants;
var init_schema = __esm({
  "drizzle/schema.ts"() {
    "use strict";
    users = mysqlTable("users", {
      id: int("id").autoincrement().primaryKey(),
      openId: varchar("openId", { length: 64 }).notNull().unique(),
      name: text("name"),
      email: varchar("email", { length: 320 }),
      loginMethod: varchar("loginMethod", { length: 64 }),
      role: mysqlEnum("role", ["user", "admin", "super_admin"]).default("user").notNull(),
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
      giftCardCode: varchar("giftCardCode", { length: 9 }),
      giftCardAmount: decimal("giftCardAmount", { precision: 10, scale: 2 }).default("0.00"),
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
      recipientEmail: varchar("recipientEmail", { length: 320 }),
      orderId: int("orderId"),
      isActive: boolean("isActive").default(true).notNull(),
      emailStatus: varchar("emailStatus", { length: 50 }).default("pending"),
      expiresAt: timestamp("expiresAt"),
      lastUsedAt: timestamp("lastUsedAt"),
      createdAt: timestamp("createdAt").defaultNow().notNull(),
      updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull()
    });
    giftCardTransactions = mysqlTable("giftCardTransactions", {
      id: int("id").autoincrement().primaryKey(),
      giftCardId: int("giftCardId").notNull(),
      orderId: int("orderId"),
      type: mysqlEnum("type", ["issue", "reserve", "redeem", "release", "void"]).notNull(),
      amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
      balanceAfter: decimal("balanceAfter", { precision: 10, scale: 2 }),
      note: text("note"),
      createdAt: timestamp("createdAt").defaultNow().notNull()
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
function rowIsNonVialProduct(row) {
  const text2 = [row.slug, row.name, row.form, row.category].filter(Boolean).join(" ").toLowerCase();
  return NON_VIAL_TERMS.some((term) => text2.includes(term));
}
function generatedVialUrlForRow(row) {
  const slug = slugifyValue(String(row.slug || row.name || "product")) || "product";
  const params = new URLSearchParams();
  if (row.name) params.set("name", String(row.name));
  if (row.size || row.contents) params.set("size", String(row.size || row.contents));
  params.set("v", "rvr-photoreal-adaptive-fit-v1");
  return `/api/vial/${slug}.png?${params.toString()}`;
}
function isLegacyBundledVialAsset(value) {
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
async function ensureProductDisplayData(conn) {
  const [rows] = await conn.execute(
    `SELECT id, name, slug, price, imageUrl, size, contents, form, isActive, sortOrder FROM products ORDER BY sortOrder ASC, id ASC`
  );
  if (!rows.length) return;
  for (const row of rows) {
    const currentImage = String(row.imageUrl || "");
    if (!rowIsNonVialProduct(row)) {
      if (isGeneratedOrFallbackImage(currentImage) || isLegacyBundledVialAsset(currentImage)) {
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
async function ensureConfiguredSuperAdmin(conn) {
  const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const adminUsername = process.env.ADMIN_USERNAME?.trim().toLowerCase();
  if (adminEmail) {
    await conn.execute("UPDATE users SET role = 'super_admin' WHERE LOWER(email) = ?", [adminEmail]);
  }
  if (adminUsername) {
    await conn.execute("UPDATE users SET role = 'super_admin' WHERE LOWER(username) = ?", [adminUsername]);
  }
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
async function ensureUserRoleEnum(conn) {
  try {
    await conn.execute("ALTER TABLE users MODIFY COLUMN role enum('user','admin','super_admin') NOT NULL DEFAULT 'user'");
  } catch (error) {
    console.warn("[DB init] Could not normalize users.role enum:", error);
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
async function ensureDefaultSiteSettings(conn) {
  const defaults = [
    ["nowpayments_api_key", "", "text", "NowPayments API Key", "payments"],
    ["nowpayments_ipn_secret", "", "text", "NowPayments IPN Secret", "payments"],
    ["nowpayments_webhook_url", "", "text", "NowPayments Webhook URL", "payments"],
    ["nowpayments_sandbox_mode", "false", "boolean", "NowPayments Sandbox Mode", "payments"],
    ["flat_rate_shipping", "0", "text", "Flat Rate Shipping", "shipping"],
    ["contact_email", "", "text", "Contact Email", "contact"],
    ["contact_phone", "", "text", "Contact Phone", "contact"],
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
    ["banner_text_color", "", "text", "Banner Text Color", "branding"]
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
}
async function clearLegacyResearchDefaultsOnce(conn) {
  const cleanupKey = "research_content_citations_cleared_2026_06_02_v2";
  const [existing] = await conn.execute(
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
async function disableFeaturedProductsOnce(conn) {
  const cleanupKey = "featured_products_disabled_2026_06_02";
  const [existing] = await conn.execute(
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
async function clearProductDescriptionsAndFeaturedOnce(conn) {
  const cleanupKey = "product_descriptions_cleared_featured_off_2026_06_02";
  const [existing] = await conn.execute(
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
      await ensureUserRoleEnum(conn);
      await ensureConfiguredSuperAdmin(conn);
      await ensureProductColumnTypes(conn);
      await ensureDefaultSiteSettings(conn);
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
var TABLES, REQUIRED_COLUMNS, DEFAULT_PRODUCTS, DEFAULT_CATEGORIES, _assetMap, NON_VIAL_TERMS, initialized, initPromise;
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
)`
    ];
    REQUIRED_COLUMNS = [
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
      // Gift card checkout, lifecycle, and audit columns for existing Railway DBs.
      ["orders", "giftCardCode", "varchar(9)"],
      ["orders", "giftCardAmount", "decimal(10,2) DEFAULT '0.00'"],
      ["giftCards", "recipientEmail", "varchar(320)"],
      ["giftCards", "emailStatus", "varchar(50) DEFAULT 'pending'"],
      ["giftCards", "expiresAt", "timestamp NULL"],
      ["giftCards", "lastUsedAt", "timestamp NULL"]
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
    NON_VIAL_TERMS = ["capsule", "capsules", "cream", "cleanser", "sunscreen", "mask", "lotion", "serum", "kit", "box", "card", "storage", "cap", "bottle", "spray", "dropper"];
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
  deleteProductCitations: () => deleteProductCitations,
  deleteProductVariant: () => deleteProductVariant,
  finalizeGiftCardRedemptionForOrder: () => finalizeGiftCardRedemptionForOrder,
  getAdminUsers: () => getAdminUsers,
  getAllCategories: () => getAllCategories,
  getAllDiscountCodes: () => getAllDiscountCodes,
  getAllGiftCards: () => getAllGiftCards,
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
  getGiftCardTransactions: () => getGiftCardTransactions,
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
  previewGiftCardApplication: () => previewGiftCardApplication,
  releaseGiftCardReservationForOrder: () => releaseGiftCardReservationForOrder,
  removeFromCart: () => removeFromCart,
  replaceProductVariants: () => replaceProductVariants,
  reserveGiftCardForOrder: () => reserveGiftCardForOrder,
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
  updateUserRole: () => updateUserRole,
  upsertProductResearch: () => upsertProductResearch,
  upsertSetting: () => upsertSetting,
  upsertUser: () => upsertUser
});
import { eq, and, like, desc, asc, sql, inArray, or, lte } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import crypto2 from "crypto";
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
    role: isConfiguredAdmin ? "super_admin" : "user",
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
async function updateUserRole(userId, role) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(users).set({ role }).where(eq(users.id, userId));
  return getUserById(userId);
}
async function getAdminUsers() {
  const db = await getDb();
  if (!db) return [];
  return db.select({ id: users.id, name: users.name, email: users.email, username: users.username, role: users.role, createdAt: users.createdAt, lastSignedIn: users.lastSignedIn }).from(users).where(or(eq(users.role, "admin"), eq(users.role, "super_admin"))).orderBy(desc(users.createdAt));
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
async function deleteProductCitations(productId) {
  const db = await getDb();
  if (!db) return;
  await db.delete(researchCitations).where(eq(researchCitations.productId, productId));
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
  const matchedOrders = await db.select().from(orders).where(eq(orders.paymentId, paymentId)).limit(1);
  const order = matchedOrders[0];
  if (!order) return;
  if (newStatus === "paid") {
    await finalizeGiftCardRedemptionForOrder(order.id);
    await issueGiftCardsForOrder(order.id, order.guestEmail || void 0);
  } else if (newStatus === "cancelled") {
    await releaseGiftCardReservationForOrder(order.id);
  }
}
function parseGiftCardRecipientEmail(label) {
  const text2 = String(label || "");
  const match = text2.match(/Recipient:\s*([^|\s]+@[^|\s]+\.[^|\s]+)/i);
  return match ? match[1].trim() : void 0;
}
function normalizeGiftCardCode(code) {
  const alnum = String(code || "").replace(/[^A-Za-z0-9]/g, "").slice(0, 8);
  return alnum.length > 4 ? `${alnum.slice(0, 4)}-${alnum.slice(4)}` : alnum;
}
function generateGiftCardCode() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
  let raw = "";
  for (let i = 0; i < 8; i += 1) {
    raw += alphabet[crypto2.randomInt(0, alphabet.length)];
  }
  return `${raw.slice(0, 4)}-${raw.slice(4)}`;
}
function giftCardExpiryDate(from = /* @__PURE__ */ new Date()) {
  const expiresAt = new Date(from);
  expiresAt.setFullYear(expiresAt.getFullYear() + 1);
  return expiresAt;
}
async function sendGiftCardEmail(to, code, amount, expiresAt) {
  if (!to) return false;
  const subject = "Your River Valley Research Peptides Gift Card";
  const text2 = [
    "Thank you for your gift card purchase.",
    "",
    `Gift card code: ${code}`,
    `Amount: $${amount.toFixed(2)}`,
    expiresAt ? `Expires: ${expiresAt.toLocaleDateString()}` : "Expires: 1 year from purchase date",
    "",
    "Use this code during checkout in the Use gift card field."
  ].join("\n");
  const resendKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.GIFT_CARD_FROM_EMAIL || process.env.FROM_EMAIL || "orders@rivervalleyresearchpeptides.com";
  if (resendKey) {
    try {
      await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: `Bearer ${resendKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({ from: fromEmail, to, subject, text: text2 })
      });
      return true;
    } catch (error) {
      console.warn("[Gift Card Email] Resend delivery failed.", error);
    }
  }
  const webhookUrl = process.env.GIFT_CARD_EMAIL_WEBHOOK_URL;
  if (webhookUrl) {
    try {
      await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to, subject, text: text2, code, amount, expiresAt })
      });
      return true;
    } catch (error) {
      console.warn("[Gift Card Email] Webhook delivery failed.", error);
    }
  }
  console.log(`[Gift Card Email Pending] ${to}: ${code} for $${amount.toFixed(2)}`);
  return false;
}
async function addGiftCardTransaction(data) {
  const db = await getDb();
  if (!db) return;
  await db.insert(giftCardTransactions).values(data);
}
async function getGiftCardTransactions(giftCardId) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(giftCardTransactions).where(eq(giftCardTransactions.giftCardId, giftCardId)).orderBy(desc(giftCardTransactions.createdAt));
}
async function getOpenReservedAmount(giftCardId) {
  const txns = await getGiftCardTransactions(giftCardId);
  const reserves = /* @__PURE__ */ new Map();
  const closed = /* @__PURE__ */ new Set();
  for (const txn of txns) {
    const orderId = Number(txn.orderId || 0);
    if (!orderId) continue;
    if (txn.type === "reserve") {
      reserves.set(orderId, (reserves.get(orderId) || 0) + Number(txn.amount || 0));
    }
    if (txn.type === "redeem" || txn.type === "release" || txn.type === "void") {
      closed.add(orderId);
    }
  }
  let total = 0;
  for (const [orderId, amount] of reserves.entries()) {
    if (!closed.has(orderId)) total += amount;
  }
  return total;
}
function giftCardExpired(card) {
  return card?.expiresAt && new Date(card.expiresAt).getTime() < Date.now();
}
async function getGiftCardByCode(code) {
  const db = await getDb();
  if (!db) return void 0;
  const normalized = normalizeGiftCardCode(code);
  const result = await db.select().from(giftCards).where(eq(giftCards.code, normalized)).limit(1);
  return result[0];
}
async function getAllGiftCards() {
  const db = await getDb();
  if (!db) return [];
  const cards = await db.select().from(giftCards).orderBy(desc(giftCards.createdAt));
  return Promise.all(cards.map(async (card) => {
    const reservedAmount = await getOpenReservedAmount(card.id);
    const balance = Number(card.balance || 0);
    return {
      ...card,
      reservedAmount: reservedAmount.toFixed(2),
      availableBalance: Math.max(0, balance - reservedAmount).toFixed(2),
      expired: giftCardExpired(card)
    };
  }));
}
async function createGiftCard(data) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.insert(giftCards).values({ ...data, code: normalizeGiftCardCode(data.code) });
}
async function previewGiftCardApplication(code, amountDue) {
  const card = await getGiftCardByCode(code);
  if (!card || !card.isActive || giftCardExpired(card)) {
    return { valid: false, applied: 0, availableBalance: 0, remainingDue: amountDue, message: "Invalid, expired, or depleted gift card" };
  }
  const reserved = await getOpenReservedAmount(card.id);
  const balance = Number(card.balance || 0);
  const availableBalance = Math.max(0, balance - reserved);
  if (availableBalance <= 0) {
    return { valid: false, applied: 0, availableBalance: 0, remainingDue: amountDue, message: "Gift card has no available balance" };
  }
  const applied = Math.max(0, Math.min(availableBalance, amountDue));
  return {
    valid: applied > 0,
    applied,
    availableBalance,
    remainingDue: Math.max(0, amountDue - applied),
    message: `Gift card available balance: $${availableBalance.toFixed(2)}`
  };
}
async function reserveGiftCardForOrder(code, amount, orderId) {
  const card = await getGiftCardByCode(code);
  if (!card || !card.isActive || giftCardExpired(card)) return { applied: 0, remainingBalance: 0 };
  const preview = await previewGiftCardApplication(code, amount);
  const applied = Math.min(preview.applied, amount);
  if (applied <= 0) return { applied: 0, remainingBalance: preview.availableBalance };
  await addGiftCardTransaction({
    giftCardId: card.id,
    orderId,
    type: "reserve",
    amount: applied.toFixed(2),
    balanceAfter: Number(card.balance || 0).toFixed(2),
    note: "Reserved for pending checkout"
  });
  return { applied, remainingBalance: Math.max(0, preview.availableBalance - applied) };
}
async function releaseGiftCardReservationForOrder(orderId) {
  const db = await getDb();
  if (!db) return;
  const order = await getOrderById(orderId);
  const code = order?.giftCardCode;
  const amount = Number(order?.giftCardAmount || 0);
  if (!code || amount <= 0) return;
  const card = await getGiftCardByCode(code);
  if (!card) return;
  await addGiftCardTransaction({
    giftCardId: card.id,
    orderId,
    type: "release",
    amount: amount.toFixed(2),
    balanceAfter: Number(card.balance || 0).toFixed(2),
    note: "Released because checkout payment did not complete"
  });
}
async function finalizeGiftCardRedemptionForOrder(orderId) {
  const db = await getDb();
  if (!db) return;
  const order = await getOrderById(orderId);
  const code = order?.giftCardCode;
  const amount = Number(order?.giftCardAmount || 0);
  if (!code || amount <= 0) return;
  const card = await getGiftCardByCode(code);
  if (!card || !card.isActive || giftCardExpired(card)) return;
  const existing = await getGiftCardTransactions(card.id);
  if (existing.some((txn) => txn.orderId === orderId && txn.type === "redeem")) return;
  const currentBalance = Number(card.balance || 0);
  const applied = Math.max(0, Math.min(currentBalance, amount));
  const remainingBalance = Math.max(0, currentBalance - applied);
  await db.update(giftCards).set({
    balance: remainingBalance.toFixed(2),
    isActive: remainingBalance > 0,
    lastUsedAt: /* @__PURE__ */ new Date()
  }).where(eq(giftCards.id, card.id));
  await addGiftCardTransaction({
    giftCardId: card.id,
    orderId,
    type: "redeem",
    amount: applied.toFixed(2),
    balanceAfter: remainingBalance.toFixed(2),
    note: "Redeemed after verified payment"
  });
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
      for (let attempt = 0; attempt < 50; attempt += 1) {
        code = generateGiftCardCode();
        const existing = await getGiftCardByCode(code);
        if (!existing) break;
      }
      const recipientEmail = parseGiftCardRecipientEmail(item.variantLabel) || purchaserEmail;
      const expiresAt = giftCardExpiryDate();
      await createGiftCard({
        code,
        originalAmount: amount.toFixed(2),
        balance: amount.toFixed(2),
        purchaserEmail,
        recipientEmail,
        orderId,
        isActive: true,
        emailStatus: "pending",
        expiresAt
      });
      const created = await getGiftCardByCode(code);
      if (created) {
        await addGiftCardTransaction({
          giftCardId: created.id,
          orderId,
          type: "issue",
          amount: amount.toFixed(2),
          balanceAfter: amount.toFixed(2),
          note: "Issued after verified payment"
        });
      }
      const delivered = await sendGiftCardEmail(recipientEmail, code, amount, expiresAt);
      if (created) {
        await db.update(giftCards).set({ emailStatus: delivered ? "sent" : "pending" }).where(eq(giftCards.id, created.id));
      }
      console.log(`[Gift Card] Issued ${code} for order ${orderId}`);
    }
  }
}
async function applyGiftCard(code, amount) {
  const preview = await previewGiftCardApplication(code, amount);
  return { applied: preview.applied, remainingBalance: Math.max(0, preview.availableBalance - preview.applied) };
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
function inferSettingType(key, value) {
  if (value === "true" || value === "false" || key.endsWith("_enabled") || key.endsWith("_mode")) return "boolean";
  if (key.endsWith("_url") || key.includes("logo")) return "image";
  if (key.includes("html")) return "html";
  if (value.trim().startsWith("{") && value.trim().endsWith("}") || value.trim().startsWith("[") && value.trim().endsWith("]")) return "json";
  return "text";
}
function inferSettingGroup(key) {
  if (key.startsWith("nowpayments_")) return "payments";
  if (key.includes("shipping")) return "shipping";
  if (key.includes("tax")) return "tax";
  if (key.includes("logo") || key.includes("color") || key.includes("hero") || key.includes("banner")) return "branding";
  if (key.includes("contact")) return "contact";
  return "general";
}
function settingLabel(key) {
  return key.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
}
async function updateSetting(key, value) {
  const db = await getDb();
  if (!db) return;
  await db.insert(siteSettings).values({
    settingKey: key,
    settingValue: value,
    settingType: inferSettingType(key, value),
    label: settingLabel(key),
    groupName: inferSettingGroup(key)
  }).onDuplicateKeyUpdate({
    set: {
      settingValue: value,
      settingType: inferSettingType(key, value),
      label: settingLabel(key),
      groupName: inferSettingGroup(key)
    }
  });
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
    if (!ctx.user || ctx.user.role !== "admin" && ctx.user.role !== "super_admin") {
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
import crypto3 from "crypto";
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
  const hmac = crypto3.createHmac("sha512", ipnSecret);
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
  const order = await getOrderByNumber(orderId);
  if (paymentStatus === "finished" || paymentStatus === "confirmed") {
    if (order) {
      await updateOrder(order.id, { status: "paid", paymentStatus: "finished", paymentId });
      await finalizeGiftCardRedemptionForOrder(order.id);
      await issueGiftCardsForOrder(order.id, order.guestEmail || void 0);
    } else {
      await updateOrderPayment(paymentId, "finished");
    }
  } else if (paymentStatus === "failed" || paymentStatus === "expired" || paymentStatus === "refunded") {
    if (order) {
      await updateOrder(order.id, { status: "cancelled", paymentStatus: "failed", paymentId });
      await releaseGiftCardReservationForOrder(order.id);
    } else {
      await updateOrderPayment(paymentId, "failed");
    }
  } else if (paymentStatus === "partially_paid") {
    if (order) {
      await updateOrder(order.id, { paymentStatus: "partially_paid", paymentId });
    } else {
      await updateOrderPayment(paymentId, "partially_paid");
    }
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
var NON_VIAL_TERMS2 = ["capsule", "capsules", "cream", "cleanser", "sunscreen", "mask", "lotion", "serum", "kit", "box", "card", "storage", "cap", "bottle", "spray", "dropper"];
function isNonVialProduct(input) {
  const text2 = [input.slug, input.name, input.form, input.category, ...(input.categories || []).map((c) => c?.name)].filter(Boolean).join(" ").toLowerCase();
  return NON_VIAL_TERMS2.some((term) => text2.includes(term));
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
function isLegacyBundledVialAsset2(value) {
  const image = String(value || "").toLowerCase();
  if (!image) return false;
  if (image.startsWith("/assets/products/")) return false;
  return image.includes("rvr-vial-template-single") || image.includes("rvr-company-blank-vial") || image.includes("bacteriostatic-water") || image.startsWith("/assets/") && /_[0-9a-f]{8}\.(webp|png|jpg|jpeg)(?:\?|$)/i.test(image) && !/(gift-card|capsule|capsules|tube|cream|cleanser|sunscreen|mask|kit|box|storage|cap)/i.test(image);
}
function shouldReplaceVialImage(product, image) {
  return shouldReplaceGeneratedImage(image) || !isNonVialProduct(product) && isLegacyBundledVialAsset2(image);
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
  if (ctx.user.role !== "admin" && ctx.user.role !== "super_admin") throw new TRPCError3({ code: "FORBIDDEN", message: "Admin access required" });
  return next({ ctx });
});
var superAdminProcedure = adminProcedure2.use(({ ctx, next }) => {
  if (ctx.user.role !== "super_admin") {
    throw new TRPCError3({ code: "FORBIDDEN", message: "Super admin access required" });
  }
  return next({ ctx });
});
function isGiftCardProduct(product) {
  return makeProductSlug(product?.slug || product?.name || "") === "gift-card" || String(product?.name || "").toLowerCase().includes("gift card");
}
function parseGiftCardAmountFromLabel(label) {
  const text2 = String(label || "");
  const match = text2.match(/(?:gift\s*card\s*)?\$?([0-9]+(?:\.[0-9]{1,2})?)/i);
  if (!match) return null;
  const amount = Number(match[1]);
  return Number.isFinite(amount) && amount > 0 ? amount : null;
}
function giftCardVariantLabel(amount) {
  return `Gift Card $${amount.toFixed(2)}`;
}
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
  compareAtPrice: z2.string().nullable().optional(),
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
          const giftAmount = isGiftCardProduct(product) ? parseGiftCardAmountFromLabel(item.variantLabel) : null;
          enriched.push({
            ...item,
            product: giftAmount ? { ...product, name: `${product.name} ($${giftAmount.toFixed(2)})`, price: giftAmount.toFixed(2) } : product
          });
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
      let hasShippableItems = false;
      const orderItems2 = [];
      for (const item of input.items) {
        const product = await getProductById(item.productId);
        if (!product) throw new TRPCError3({ code: "NOT_FOUND", message: `Product ${item.productId} not found` });
        if (!product.inStock || product.stockQuantity < item.quantity) throw new TRPCError3({ code: "BAD_REQUEST", message: `${product.name} is out of stock` });
        const productIsGiftCard = isGiftCardProduct(product);
        if (!productIsGiftCard) hasShippableItems = true;
        const giftAmount = productIsGiftCard ? parseGiftCardAmountFromLabel(item.variantLabel) : null;
        let unitPrice = giftAmount ?? Number(product.price);
        if (!giftAmount && product.discountActive && product.discountPercent) {
          unitPrice = unitPrice * (1 - Number(product.discountPercent) / 100);
        }
        const totalPrice = unitPrice * item.quantity;
        subtotal += totalPrice;
        const displayName = giftAmount ? `${product.name} ($${giftAmount.toFixed(2)})` : item.variantLabel ? `${product.name} (${item.variantLabel})` : product.name;
        orderItems2.push({ productId: item.productId, productName: displayName, variantId: item.variantId || null, variantLabel: giftAmount ? giftCardVariantLabel(giftAmount) : item.variantLabel || null, quantity: item.quantity, unitPrice: unitPrice.toFixed(2), totalPrice: totalPrice.toFixed(2) });
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
      const containsGiftCardPurchase = orderItems2.some((item) => String(item.productName || "").toLowerCase().includes("gift card"));
      if (input.giftCardCode && containsGiftCardPurchase) {
        throw new TRPCError3({ code: "BAD_REQUEST", message: "Gift cards cannot be used to purchase new gift cards." });
      }
      const flatRateShipping = Number(await getSetting("flat_rate_shipping") || "9.99");
      const shippingCost = hasShippableItems ? flatRateShipping : 0;
      let giftCardApplied = 0;
      if (input.giftCardCode) {
        const amountDueBeforeGiftCard = Math.max(0, subtotal - discountAmount + shippingCost);
        const gift = await previewGiftCardApplication(input.giftCardCode, amountDueBeforeGiftCard);
        giftCardApplied = gift.applied;
        if (!gift.valid || giftCardApplied <= 0) throw new TRPCError3({ code: "BAD_REQUEST", message: gift.message || "Invalid or depleted gift card code" });
        discountAmount += giftCardApplied;
      }
      const total = Math.max(0, subtotal - discountAmount + shippingCost);
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
        giftCardCode: input.giftCardCode ? String(input.giftCardCode).replace(/[^A-Za-z0-9]/g, "").replace(/^(.{4})(.+)$/, "$1-$2").slice(0, 9) : null,
        giftCardAmount: giftCardApplied.toFixed(2),
        notes: input.notes
      }, orderItems2);
      if (input.giftCardCode && giftCardApplied > 0) {
        await reserveGiftCardForOrder(input.giftCardCode, giftCardApplied, orderId);
      }
      if (total <= 0) {
        await updateOrder(orderId, { status: "paid", paymentStatus: "gift_card_paid" });
        await finalizeGiftCardRedemptionForOrder(orderId);
        await issueGiftCardsForOrder(orderId, input.guestEmail || void 0);
      }
      if (input.userId) await clearCart(input.userId);
      return { orderId, orderNumber, total: total.toFixed(2), subtotal: subtotal.toFixed(2), discountAmount: discountAmount.toFixed(2), shippingCost: shippingCost.toFixed(2), giftCardApplied: giftCardApplied.toFixed(2), paid: total <= 0 };
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
      const gift = await previewGiftCardApplication(input.code, input.subtotal);
      return {
        valid: gift.valid,
        balance: gift.availableBalance,
        appliedAmount: gift.applied,
        remainingDue: gift.remainingDue,
        message: gift.message
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
      if (order.status !== "pending") {
        if (order.status === "paid") return { invoiceUrl: `/order/${order.orderNumber}?status=success`, paymentId: "gift_card_paid", invoiceId: "gift_card_paid" };
        throw new TRPCError3({ code: "BAD_REQUEST", message: "Order is no longer pending" });
      }
      if (Number(order.total || 0) <= 0) {
        await updateOrder(order.id, { status: "paid", paymentStatus: "gift_card_paid" });
        await finalizeGiftCardRedemptionForOrder(order.id);
        await issueGiftCardsForOrder(order.id, input.email || order.guestEmail || void 0);
        return { invoiceUrl: `/order/${order.orderNumber}?status=success`, paymentId: "gift_card_paid", invoiceId: "gift_card_paid" };
      }
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
        compareAtPrice: z2.string().nullable().optional(),
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
        variants: z2.array(productVariantInput).optional(),
        researchDraft: z2.object({
          chemicalMakeup: z2.string().optional(),
          researchContent: z2.string().optional(),
          citations: z2.array(z2.object({
            title: z2.string(),
            authors: z2.string().optional(),
            journal: z2.string().optional(),
            year: z2.string().optional(),
            url: z2.string().optional(),
            summary: z2.string().optional()
          })).optional()
        }).optional()
      })).mutation(async ({ input }) => {
        const { categoryIds, variants, researchDraft, ...rawData } = input;
        const data = normalizeAdminProductInput(rawData);
        const mappedImage = productAssetForInput(data);
        if (!isNonVialProduct(data)) {
          if (shouldReplaceVialImage(data, data.imageUrl)) data.imageUrl = generatedVialUrlForProduct(data);
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
        if (researchDraft) {
          await upsertProductResearch(id, {
            overview: "",
            chemicalMakeup: researchDraft.chemicalMakeup || "",
            researchContent: researchDraft.researchContent || ""
          });
          const citations = Array.isArray(researchDraft.citations) ? researchDraft.citations.slice(0, 3) : [];
          for (let index = 0; index < citations.length; index++) {
            const citation = citations[index];
            if (!String(citation.title || "").trim()) continue;
            await createCitation({
              productId: id,
              citationNumber: index + 1,
              title: citation.title,
              authors: citation.authors || "",
              journal: citation.journal || "NIH/PubMed",
              year: citation.year || "",
              url: citation.url || "",
              summary: citation.summary || ""
            });
          }
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
        compareAtPrice: z2.string().nullable().optional(),
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
        researchDraft: z2.object({
          chemicalMakeup: z2.string().optional(),
          researchContent: z2.string().optional(),
          citations: z2.array(z2.object({
            title: z2.string(),
            authors: z2.string().optional(),
            journal: z2.string().optional(),
            year: z2.string().optional(),
            url: z2.string().optional(),
            summary: z2.string().optional()
          })).optional()
        }).optional(),
        regenerateVial: z2.boolean().optional()
      })).mutation(async ({ input }) => {
        const { id, categoryIds, variants, researchDraft, regenerateVial, ...rawData } = input;
        const data = normalizeAdminProductInput(rawData);
        const mappedImage = productAssetForInput(data);
        if (!isNonVialProduct(data)) {
          if (regenerateVial || shouldReplaceVialImage(data, data.imageUrl)) data.imageUrl = generatedVialUrlForProduct(data);
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
        if (researchDraft) {
          await upsertProductResearch(id, {
            overview: "",
            chemicalMakeup: researchDraft.chemicalMakeup || "",
            researchContent: researchDraft.researchContent || ""
          });
          await deleteProductCitations(id);
          const citations = Array.isArray(researchDraft.citations) ? researchDraft.citations.slice(0, 3) : [];
          for (let index = 0; index < citations.length; index++) {
            const citation = citations[index];
            if (!String(citation.title || "").trim()) continue;
            await createCitation({
              productId: id,
              citationNumber: index + 1,
              title: citation.title,
              authors: citation.authors || "",
              journal: citation.journal || "NIH/PubMed",
              year: citation.year || "",
              url: citation.url || "",
              summary: citation.summary || ""
            });
          }
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
    // Gift Cards
    giftCards: router({
      list: adminProcedure2.query(async () => getAllGiftCards()),
      byCode: adminProcedure2.input(z2.object({ code: z2.string() })).query(async ({ input }) => {
        const card = await getGiftCardByCode(input.code);
        if (!card) throw new TRPCError3({ code: "NOT_FOUND", message: "Gift card not found" });
        const transactions = await getGiftCardTransactions(card.id);
        return { ...card, transactions };
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
    // Users / database-backed roles
    users: router({
      list: adminProcedure2.query(async () => getAllUsers()),
      admins: adminProcedure2.query(async () => getAdminUsers()),
      updateRole: superAdminProcedure.input(z2.object({
        id: z2.number(),
        role: z2.enum(["user", "admin", "super_admin"])
      })).mutation(async ({ input, ctx }) => {
        if (input.id === ctx.user.id && input.role !== "super_admin") {
          throw new TRPCError3({ code: "BAD_REQUEST", message: "You cannot remove your own super admin role." });
        }
        const target = await getUserById(input.id);
        if (!target) throw new TRPCError3({ code: "NOT_FOUND", message: "User not found" });
        const updated = await updateUserRole(input.id, input.role);
        return { success: true, user: updated };
      })
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
init_storage();
import mysql2 from "mysql2/promise";
function getProductAssetDirs() {
  const cwd = process.cwd();
  const dirs = [
    path6.join(cwd, "dist", "public", "assets"),
    path6.join(cwd, "client", "public", "assets")
  ];
  dirs.push(path6.join(import.meta.dirname, "public", "assets"));
  return Array.from(new Set(dirs));
}
function writeProductAssetToServedLocations(relativeName, data) {
  for (const assetsDir of getProductAssetDirs()) {
    fs6.mkdirSync(assetsDir, { recursive: true });
    fs6.writeFileSync(path6.join(assetsDir, relativeName), data);
  }
}
function readServedAsset(relativeName) {
  const searchDirs = [
    ...getProductAssetDirs(),
    path6.join(process.cwd(), "public", "assets"),
    path6.join(process.cwd(), "client", "public", "assets"),
    path6.join(process.cwd(), "dist", "public", "assets"),
    path6.join(import.meta.dirname, "public", "assets")
  ];
  for (const assetsDir of searchDirs) {
    const fullPath = path6.join(assetsDir, relativeName);
    if (fs6.existsSync(fullPath)) return fs6.readFileSync(fullPath);
  }
  throw new Error(`Asset not found: ${relativeName}`);
}
async function getProductAssetConnection() {
  const url = process.env.DATABASE_URL;
  if (!url) return null;
  try {
    return await mysql2.createConnection({ uri: url, connectTimeout: 1e4 });
  } catch (error) {
    console.warn("[Product Asset Storage] Database connection unavailable; using local asset path.", error);
    return null;
  }
}
async function ensureProductAssetsTable(conn) {
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
}
async function saveProductAssetToDatabase(relativeName, data, contentType) {
  const conn = await getProductAssetConnection();
  if (!conn) return false;
  try {
    await ensureProductAssetsTable(conn);
    const buffer = Buffer.isBuffer(data) ? data : Buffer.from(data);
    await conn.execute(
      `INSERT INTO productAssets (name, contentType, data)
       VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE contentType = VALUES(contentType), data = VALUES(data), updatedAt = CURRENT_TIMESTAMP`,
      [relativeName, contentType, buffer]
    );
    return true;
  } catch (error) {
    console.warn("[Product Asset Storage] Database asset save failed; using local asset path.", error);
    return false;
  } finally {
    await conn.end().catch(() => {
    });
  }
}
async function readProductAssetFromDatabase(relativeName) {
  const conn = await getProductAssetConnection();
  if (!conn) return null;
  try {
    await ensureProductAssetsTable(conn);
    const [rows] = await conn.execute(
      `SELECT contentType, data FROM productAssets WHERE name = ? LIMIT 1`,
      [relativeName]
    );
    const row = rows?.[0];
    if (!row) return null;
    return {
      data: Buffer.from(row.data),
      contentType: String(row.contentType || "application/octet-stream")
    };
  } catch (error) {
    console.warn("[Product Asset Storage] Database asset read failed; trying local asset path.", error);
    return null;
  } finally {
    await conn.end().catch(() => {
    });
  }
}
async function saveProductAsset(relativeName, data, contentType) {
  writeProductAssetToServedLocations(relativeName, data);
  const savedToDatabase = await saveProductAssetToDatabase(relativeName, data, contentType);
  if (savedToDatabase) {
    return { name: relativeName, url: `/api/product-assets/${encodeURIComponent(relativeName)}` };
  }
  try {
    const stored = await storagePut(`assets/${relativeName}`, data, contentType);
    return { name: relativeName, url: stored.url };
  } catch (error) {
    console.warn("[Product Asset Storage] Persistent storage unavailable; using local asset path.", error);
    return { name: relativeName, url: `/assets/${relativeName}` };
  }
}
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
function normalizeResearchName(value) {
  return String(value || "").replace(/\s+/g, " ").replace(/\b\d+\s*(mg|mcg|ml|iu|capsules?|caps?)\b/gi, "").trim();
}
function uniqueStrings(values) {
  const seen = /* @__PURE__ */ new Set();
  const out = [];
  for (const value of values) {
    const text2 = String(value || "").trim();
    if (!text2) continue;
    const key = text2.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(text2);
  }
  return out;
}
function stripXml(value) {
  return String(value || "").replace(/<!\[CDATA\[/g, "").replace(/\]\]>/g, "").replace(/<[^>]+>/g, " ").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/\s+/g, " ").trim();
}
async function fetchJsonWithTimeout(url, timeoutMs = 12e3) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: { "Accept": "application/json" }
    });
    if (!response.ok) return null;
    return await response.json();
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}
async function fetchTextWithTimeout(url, timeoutMs = 12e3) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: { "Accept": "application/xml,text/xml,text/plain,*/*" }
    });
    if (!response.ok) return null;
    return await response.text();
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}
function sourceKey(source) {
  return `${source.database}:${source.url || source.title}`.toLowerCase();
}
function rankedSources(sources) {
  const priority = {
    PubChem: 1,
    PubMed: 2,
    "Europe PMC": 2,
    UniProt: 3,
    ChEMBL: 4,
    RCSB: 5,
    IUPHAR: 6
  };
  const seen = /* @__PURE__ */ new Set();
  return sources.filter((source) => source.title && source.url).filter((source) => {
    const key = sourceKey(source);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  }).sort((a, b) => (priority[a.database] || 99) - (priority[b.database] || 99)).slice(0, 3);
}
function ensureThreeSources(sources, peptideName) {
  const cleanName = normalizeResearchName(peptideName) || "peptide";
  const base = rankedSources(sources);
  const fallbacks = [
    {
      title: `${cleanName} - PubMed literature search`,
      url: `https://pubmed.ncbi.nlm.nih.gov/?term=${encodeURIComponent(cleanName)}`,
      database: "PubMed",
      supports: "Peer-reviewed biomedical literature discovery for exact product-name research context."
    },
    {
      title: `${cleanName} - Europe PMC literature search`,
      url: `https://europepmc.org/search?query=${encodeURIComponent(cleanName)}`,
      database: "Europe PMC",
      supports: "Additional biomedical literature metadata and abstract discovery."
    },
    {
      title: `${cleanName} - PubChem compound search`,
      url: `https://pubchem.ncbi.nlm.nih.gov/#query=${encodeURIComponent(cleanName)}`,
      database: "PubChem",
      supports: "Public chemistry identifier and property search when an exact compound record is available."
    }
  ];
  return rankedSources([...base, ...fallbacks]).slice(0, 3);
}
async function getResearchCacheConnection() {
  const url = process.env.DATABASE_URL;
  if (!url) return null;
  try {
    return await mysql2.createConnection({ uri: url, connectTimeout: 1e4 });
  } catch (error) {
    console.warn("[Research Details] Database cache unavailable.", error);
    return null;
  }
}
async function ensureResearchCacheTable(conn) {
  await conn.execute(`CREATE TABLE IF NOT EXISTS researchDetailsCache (
    id int AUTO_INCREMENT NOT NULL,
    cacheKey varchar(255) NOT NULL,
    productId int,
    peptideName varchar(255) NOT NULL,
    researchDescription MEDIUMTEXT,
    chemicalMakeup MEDIUMTEXT,
    researchSummary MEDIUMTEXT,
    source1Title text,
    source1Url text,
    source1Supports text,
    source2Title text,
    source2Url text,
    source2Supports text,
    source3Title text,
    source3Url text,
    source3Supports text,
    researchConfidence varchar(20) DEFAULT 'low',
    rawSourceJson LONGTEXT,
    lastResearchedAt timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
    createdAt timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updatedAt timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY researchDetailsCache_cacheKey_unique (cacheKey)
  )`);
}
function makeResearchCacheKey(peptideName) {
  return normalizeResearchName(peptideName).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "unknown";
}
async function getCachedResearchDetails(cacheKey) {
  const conn = await getResearchCacheConnection();
  if (!conn) return null;
  try {
    await ensureResearchCacheTable(conn);
    const [rows] = await conn.execute(
      `SELECT * FROM researchDetailsCache WHERE cacheKey = ? AND lastResearchedAt > DATE_SUB(NOW(), INTERVAL 30 DAY) LIMIT 1`,
      [cacheKey]
    );
    const row = rows?.[0];
    if (!row) return null;
    const sources = [
      { title: row.source1Title, url: row.source1Url, database: "Cached", supports: row.source1Supports },
      { title: row.source2Title, url: row.source2Url, database: "Cached", supports: row.source2Supports },
      { title: row.source3Title, url: row.source3Url, database: "Cached", supports: row.source3Supports }
    ].filter((source) => source.title && source.url);
    return {
      description_block: row.researchDescription || "",
      chemical_makeup_block: row.chemicalMakeup || "",
      research_block: row.researchSummary || "",
      sources,
      confidence: row.researchConfidence || "low",
      missing_fields: [],
      raw_source_json: row.rawSourceJson ? JSON.parse(row.rawSourceJson) : void 0
    };
  } catch (error) {
    console.warn("[Research Details] Cache read failed.", error);
    return null;
  } finally {
    await conn.end().catch(() => {
    });
  }
}
async function saveCachedResearchDetails(cacheKey, productId, peptideName, result) {
  const conn = await getResearchCacheConnection();
  if (!conn) return;
  try {
    await ensureResearchCacheTable(conn);
    const sources = ensureThreeSources(result.sources, peptideName);
    await conn.execute(
      `INSERT INTO researchDetailsCache (
        cacheKey, productId, peptideName, researchDescription, chemicalMakeup, researchSummary,
        source1Title, source1Url, source1Supports, source2Title, source2Url, source2Supports,
        source3Title, source3Url, source3Supports, researchConfidence, rawSourceJson, lastResearchedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
      ON DUPLICATE KEY UPDATE
        productId = VALUES(productId),
        peptideName = VALUES(peptideName),
        researchDescription = VALUES(researchDescription),
        chemicalMakeup = VALUES(chemicalMakeup),
        researchSummary = VALUES(researchSummary),
        source1Title = VALUES(source1Title),
        source1Url = VALUES(source1Url),
        source1Supports = VALUES(source1Supports),
        source2Title = VALUES(source2Title),
        source2Url = VALUES(source2Url),
        source2Supports = VALUES(source2Supports),
        source3Title = VALUES(source3Title),
        source3Url = VALUES(source3Url),
        source3Supports = VALUES(source3Supports),
        researchConfidence = VALUES(researchConfidence),
        rawSourceJson = VALUES(rawSourceJson),
        lastResearchedAt = NOW()`,
      [
        cacheKey,
        productId,
        peptideName,
        result.description_block,
        result.chemical_makeup_block,
        result.research_block,
        sources[0]?.title || "",
        sources[0]?.url || "",
        sources[0]?.supports || "",
        sources[1]?.title || "",
        sources[1]?.url || "",
        sources[1]?.supports || "",
        sources[2]?.title || "",
        sources[2]?.url || "",
        sources[2]?.supports || "",
        result.confidence,
        JSON.stringify(result.raw_source_json || {})
      ]
    );
  } catch (error) {
    console.warn("[Research Details] Cache save failed.", error);
  } finally {
    await conn.end().catch(() => {
    });
  }
}
async function lookupPubChem(peptideName, synonyms) {
  const terms = uniqueStrings([peptideName, ...synonyms]).slice(0, 4);
  for (const term of terms) {
    const url = `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/name/${encodeURIComponent(term)}/property/MolecularFormula,MolecularWeight,IUPACName,CanonicalSMILES,IsomericSMILES,InChIKey/JSON`;
    const json2 = await fetchJsonWithTimeout(url);
    const props = json2?.PropertyTable?.Properties?.[0];
    if (props) {
      const cid = props.CID ? String(props.CID) : "";
      const source = {
        title: `${term} PubChem compound record${cid ? ` (CID ${cid})` : ""}`,
        url: cid ? `https://pubchem.ncbi.nlm.nih.gov/compound/${cid}` : `https://pubchem.ncbi.nlm.nih.gov/#query=${encodeURIComponent(term)}`,
        database: "PubChem",
        supports: "Chemical identifiers, molecular formula, molecular weight, IUPAC name, SMILES, and InChIKey."
      };
      return { term, props, source, raw: json2 };
    }
  }
  return null;
}
async function lookupPubMed(peptideName, synonyms) {
  const cleanName = normalizeResearchName(peptideName);
  const termParts = uniqueStrings([cleanName, ...synonyms]).slice(0, 3);
  const exactTerm = termParts.map((term) => `"${term}"`).join(" OR ") || `"${cleanName}"`;
  const searchUrl = new URL("https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi");
  searchUrl.searchParams.set("db", "pubmed");
  searchUrl.searchParams.set("retmode", "json");
  searchUrl.searchParams.set("retmax", "8");
  searchUrl.searchParams.set("sort", "relevance");
  searchUrl.searchParams.set("term", `${exactTerm} AND (peptide OR compound OR pharmacology OR mechanism OR chemistry OR assay OR receptor OR pathway)`);
  if (process.env.NCBI_API_KEY) searchUrl.searchParams.set("api_key", process.env.NCBI_API_KEY);
  const searchJson = await fetchJsonWithTimeout(searchUrl);
  const ids = (searchJson?.esearchresult?.idlist || []).slice(0, 8);
  if (!ids.length) return { sources: [], abstracts: [], raw: searchJson };
  const summaryUrl = new URL("https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi");
  summaryUrl.searchParams.set("db", "pubmed");
  summaryUrl.searchParams.set("retmode", "json");
  summaryUrl.searchParams.set("id", ids.join(","));
  if (process.env.NCBI_API_KEY) summaryUrl.searchParams.set("api_key", process.env.NCBI_API_KEY);
  const summaryJson = await fetchJsonWithTimeout(summaryUrl);
  const fetchUrl = new URL("https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi");
  fetchUrl.searchParams.set("db", "pubmed");
  fetchUrl.searchParams.set("retmode", "xml");
  fetchUrl.searchParams.set("id", ids.slice(0, 5).join(","));
  if (process.env.NCBI_API_KEY) fetchUrl.searchParams.set("api_key", process.env.NCBI_API_KEY);
  const xml = await fetchTextWithTimeout(fetchUrl);
  const abstracts = xml ? Array.from(xml.matchAll(/<AbstractText[^>]*>([\s\S]*?)<\/AbstractText>/gi)).map((match) => stripXml(match[1])).filter(Boolean).slice(0, 6) : [];
  const sources = ids.map((id) => summaryJson?.result?.[id]).filter(Boolean).slice(0, 3).map((item) => ({
    title: String(item.title || `${cleanName} PubMed article`).replace(/\.$/, ""),
    authors: Array.isArray(item.authors) ? item.authors.map((author) => author.name).filter(Boolean).join(", ") : "",
    journal: item.fulljournalname || item.source || "PubMed",
    year: item.pubdate ? String(item.pubdate).slice(0, 4) : "",
    url: item.uid ? `https://pubmed.ncbi.nlm.nih.gov/${item.uid}/` : `https://pubmed.ncbi.nlm.nih.gov/?term=${encodeURIComponent(cleanName)}`,
    database: "PubMed",
    supports: "Peer-reviewed literature describing research context, mechanisms, targets, assay findings, or compound-specific investigation."
  }));
  return { sources, abstracts, raw: { searchJson, summaryJson } };
}
async function lookupEuropePmc(peptideName, synonyms) {
  const cleanName = normalizeResearchName(peptideName);
  const query = uniqueStrings([cleanName, ...synonyms]).slice(0, 3).map((term) => `"${term}"`).join(" OR ");
  const url = new URL("https://www.ebi.ac.uk/europepmc/webservices/rest/search");
  url.searchParams.set("query", `${query || `"${cleanName}"`} AND (peptide OR pharmacology OR mechanism OR assay OR chemistry)`);
  url.searchParams.set("format", "json");
  url.searchParams.set("pageSize", "5");
  const json2 = await fetchJsonWithTimeout(url);
  const records = json2?.resultList?.result || [];
  const sources = records.slice(0, 2).map((item) => ({
    title: item.title || `${cleanName} Europe PMC source`,
    authors: item.authorString || "",
    journal: item.journalTitle || "Europe PMC",
    year: item.pubYear || "",
    url: item.doi ? `https://doi.org/${item.doi}` : item.pmid ? `https://europepmc.org/article/MED/${item.pmid}` : `https://europepmc.org/search?query=${encodeURIComponent(cleanName)}`,
    database: "Europe PMC",
    supports: "Biomedical literature metadata, abstract context, and additional citation support.",
    abstract: item.abstractText || ""
  }));
  return { sources, abstracts: records.map((item) => String(item.abstractText || "")).filter(Boolean).slice(0, 4), raw: json2 };
}
async function lookupUniProt(peptideName, synonyms) {
  const cleanName = normalizeResearchName(peptideName);
  const query = uniqueStrings([cleanName, ...synonyms]).slice(0, 2).map((term) => `"${term}"`).join(" OR ");
  const url = new URL("https://rest.uniprot.org/uniprotkb/search");
  url.searchParams.set("query", query || `"${cleanName}"`);
  url.searchParams.set("format", "json");
  url.searchParams.set("size", "3");
  const json2 = await fetchJsonWithTimeout(url);
  const item = json2?.results?.[0];
  if (!item) return { sources: [], notes: [], raw: json2 };
  const accession = item.primaryAccession || "";
  const proteinName = item.proteinDescription?.recommendedName?.fullName?.value || item.proteinDescription?.submissionNames?.[0]?.fullName?.value || "";
  return {
    sources: [{
      title: `${proteinName || cleanName} UniProt record${accession ? ` (${accession})` : ""}`,
      url: accession ? `https://www.uniprot.org/uniprotkb/${accession}/entry` : `https://www.uniprot.org/uniprotkb?query=${encodeURIComponent(cleanName)}`,
      database: "UniProt",
      supports: "Protein/peptide sequence context, organism, gene names, and functional annotations when applicable."
    }],
    notes: [
      accession ? `UniProt accession: ${accession}` : "",
      proteinName ? `Protein/sequence context: ${proteinName}` : "",
      item.organism?.scientificName ? `Organism: ${item.organism.scientificName}` : ""
    ].filter(Boolean),
    raw: json2
  };
}
async function lookupChembl(peptideName, synonyms) {
  const cleanName = normalizeResearchName(peptideName);
  const url = `https://www.ebi.ac.uk/chembl/api/data/molecule/search.json?q=${encodeURIComponent(cleanName)}`;
  const json2 = await fetchJsonWithTimeout(url);
  const molecule = json2?.molecules?.[0];
  if (!molecule) return { sources: [], notes: [], raw: json2 };
  const id = molecule.molecule_chembl_id || "";
  return {
    sources: [{
      title: `${molecule.pref_name || cleanName} ChEMBL molecule record${id ? ` (${id})` : ""}`,
      url: id ? `https://www.ebi.ac.uk/chembl/explore/compound/${id}` : `https://www.ebi.ac.uk/chembl/g/#search_results/all/query=${encodeURIComponent(cleanName)}`,
      database: "ChEMBL",
      supports: "Bioactivity, molecule, target, and assay metadata where the compound is represented in ChEMBL."
    }],
    notes: [
      id ? `ChEMBL ID: ${id}` : "",
      molecule.molecule_type ? `Molecule type: ${molecule.molecule_type}` : "",
      molecule.max_phase !== void 0 ? `Development phase metadata: ${molecule.max_phase}` : ""
    ].filter(Boolean),
    raw: json2
  };
}
async function lookupRcsb(peptideName, synonyms) {
  const cleanName = normalizeResearchName(peptideName);
  const query = {
    query: {
      type: "terminal",
      service: "text",
      parameters: {
        attribute: "struct.title",
        operator: "contains_phrase",
        value: cleanName
      }
    },
    return_type: "entry",
    request_options: { paginate: { start: 0, rows: 3 } }
  };
  const json2 = await fetchJsonWithTimeout("https://search.rcsb.org/rcsbsearch/v2/query?json=" + encodeURIComponent(JSON.stringify(query)));
  const id = json2?.result_set?.[0]?.identifier;
  if (!id) return { sources: [], notes: [], raw: json2 };
  return {
    sources: [{
      title: `${cleanName} RCSB PDB structure search (${id})`,
      url: `https://www.rcsb.org/structure/${id}`,
      database: "RCSB",
      supports: "3D structure or structure-search context where related peptide, receptor, or complex records are available."
    }],
    notes: [`RCSB PDB matching entry: ${id}`],
    raw: json2
  };
}
function buildChemicalMakeupBlock(peptideName, pubChem, provided, notes) {
  const lines = [];
  const missing = [];
  const props = pubChem?.props;
  lines.push(`${peptideName}`);
  if (props?.CID) lines.push(`PubChem CID: ${props.CID}`);
  const formula = provided.molecularFormula || props?.MolecularFormula;
  const mw = provided.molecularWeight || props?.MolecularWeight;
  if (formula) lines.push(`Molecular formula: ${formula}`);
  else {
    lines.push("Molecular formula: Not confirmed from available sources.");
    missing.push("molecularFormula");
  }
  if (mw) lines.push(`Molecular weight: ${mw}`);
  else {
    lines.push("Molecular weight: Not confirmed from available sources.");
    missing.push("molecularWeight");
  }
  if (provided.sequence) lines.push(`Sequence: ${provided.sequence}`);
  else {
    lines.push("Sequence: Not confirmed from available sources.");
    missing.push("sequence");
  }
  if (props?.IUPACName) lines.push(`IUPAC name: ${props.IUPACName}`);
  if (props?.CanonicalSMILES) lines.push(`Canonical SMILES: ${props.CanonicalSMILES}`);
  if (props?.IsomericSMILES) lines.push(`Isomeric SMILES: ${props.IsomericSMILES}`);
  if (props?.InChIKey) lines.push(`InChIKey: ${props.InChIKey}`);
  if (notes.length) lines.push(...notes);
  return { text: lines.join("\n"), missing };
}
function buildDescriptionBlock(peptideName, chemicalText, abstracts, sources, confidence) {
  const sourceTitles = sources.map((s) => s.title).slice(0, 3).join("; ");
  const abstractSummary = abstracts.join(" ").replace(/\s+/g, " ").slice(0, 1800);
  return [
    `${peptideName} is presented as a research-use compound for laboratory, analytical, and scientific investigation. Source-backed records are used to describe the compound identity, available chemistry, and the literature context associated with the exact product name or its closest confirmed synonyms.`,
    `Available chemical and identifier information is summarized from public scientific databases. ${chemicalText.includes("Molecular formula: Not confirmed") ? "Some chemistry fields were not confirmed from the available records, so those values should be verified against the product certificate of analysis before publication." : "The available chemistry record provides a confirmed starting point for identity review, including formula, molecular weight, and structural identifiers where available."}`,
    abstractSummary ? `Published biomedical literature describes research interest in ${peptideName} through experimental, mechanism-focused, assay, formulation, analytical, or pharmacology contexts. The most relevant available records discuss the compound in relation to its investigated pathways, measurable laboratory effects, and study-model findings.` : `Public literature searches returned limited exact abstract text for ${peptideName}; the description is therefore limited to verified database identifiers and source-backed discovery links rather than unconfirmed mechanism claims.`,
    sourceTitles ? `The most useful source context currently comes from ${sourceTitles}. These sources support the product description, chemistry review, and research-summary sections without implying approved clinical use.` : "",
    `Research confidence: ${confidence}. This product is not intended to diagnose, treat, cure, or prevent any disease. It is offered for research, laboratory, or analytical use only and is not for human or animal consumption.`
  ].filter(Boolean).join("\n\n");
}
function buildResearchBlock(peptideName, abstracts, notes, sources, confidence) {
  const snippets = abstracts.join("\n\n").replace(/\s+/g, " ").trim();
  const noteText = notes.length ? `Additional database context: ${notes.join("; ")}.` : "";
  return [
    `Research summary for ${peptideName}`,
    "",
    snippets ? snippets.slice(0, 4200) : `${peptideName} currently has limited exact-name abstract text available through the queried public databases. The available source records should be used to confirm compound identity, chemistry, and literature relevance before publishing detailed mechanism-specific claims.`,
    "",
    `Mechanism, pathway, receptor, or assay information is included only when it appears in the retrieved scientific records or product metadata. If a target, receptor relationship, or pathway is not represented in the confirmed records, it should be treated as not confirmed rather than inferred from broad peptide-category language.`,
    noteText,
    `The cited sources below provide the evidence basis for this entry. The content is written for a neutral research-use catalog and intentionally avoids dosing, treatment, cure, or human-use claims.`,
    "",
    `Disclaimer: This product is not intended to diagnose, treat, cure, or prevent any disease. It is offered for research, laboratory, or analytical use only and is not for human or animal consumption.`
  ].filter(Boolean).join("\n");
}
async function buildResearchDetails(input, allowCache = true) {
  const peptideName = normalizeResearchName(input.peptideName);
  if (!peptideName) throw new Error("peptideName is required");
  const cacheKey = makeResearchCacheKey(peptideName);
  if (allowCache) {
    const cached = await getCachedResearchDetails(cacheKey);
    if (cached?.description_block || cached?.research_block) return cached;
  }
  const synonyms = uniqueStrings(input.synonyms || []);
  const [pubChem, pubMed, europePmc, uniProt, chembl, rcsb] = await Promise.all([
    lookupPubChem(peptideName, synonyms),
    lookupPubMed(peptideName, synonyms),
    lookupEuropePmc(peptideName, synonyms),
    lookupUniProt(peptideName, synonyms),
    lookupChembl(peptideName, synonyms),
    lookupRcsb(peptideName, synonyms)
  ]);
  const notes = [
    ...uniProt?.notes || [],
    ...chembl?.notes || [],
    ...rcsb?.notes || []
  ];
  const abstracts = uniqueStrings([...pubMed?.abstracts || [], ...europePmc?.abstracts || []]).slice(0, 8);
  const sources = ensureThreeSources([
    pubChem?.source,
    ...pubMed?.sources || [],
    ...europePmc?.sources || [],
    ...uniProt?.sources || [],
    ...chembl?.sources || [],
    ...rcsb?.sources || []
  ].filter(Boolean), peptideName);
  const chem = buildChemicalMakeupBlock(peptideName, pubChem, {
    sequence: input.sequence,
    molecularFormula: input.molecularFormula,
    molecularWeight: input.molecularWeight
  }, notes);
  const confidence = !!pubChem && (pubMed?.sources?.length || europePmc?.sources?.length) ? "high" : pubMed?.sources?.length || europePmc?.sources?.length || !!pubChem ? "medium" : "low";
  const result = {
    description_block: buildDescriptionBlock(peptideName, chem.text, abstracts, sources, confidence),
    chemical_makeup_block: chem.text,
    research_block: buildResearchBlock(peptideName, abstracts, notes, sources, confidence),
    sources,
    confidence,
    missing_fields: chem.missing,
    raw_source_json: {
      pubchem: pubChem?.raw,
      pubmed: pubMed?.raw,
      europepmc: europePmc?.raw,
      uniprot: uniProt?.raw,
      chembl: chembl?.raw,
      rcsb: rcsb?.raw
    }
  };
  await saveCachedResearchDetails(cacheKey, input.productId ? Number(input.productId) : null, peptideName, result);
  return result;
}
function researchDetailsToLegacyResponse(details) {
  return {
    overview: "",
    description: details.description_block,
    chemicalMakeup: details.chemical_makeup_block,
    researchContent: details.research_block,
    citations: details.sources.slice(0, 3).map((source, index) => ({
      title: source.title,
      authors: source.authors || "",
      journal: source.database || source.journal || "",
      year: source.year || "",
      url: source.url,
      summary: source.supports,
      citationNumber: index + 1
    })),
    description_block: details.description_block,
    chemical_makeup_block: details.chemical_makeup_block,
    research_block: details.research_block,
    sources: details.sources,
    confidence: details.confidence,
    missing_fields: details.missing_fields
  };
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
  app.get("/api/product-assets/:name", async (req, res) => {
    try {
      const requestedName = path6.basename(String(req.params.name || ""));
      if (!requestedName) {
        res.status(400).send("Missing asset name");
        return;
      }
      const databaseAsset = await readProductAssetFromDatabase(requestedName);
      if (databaseAsset) {
        res.setHeader("Content-Type", databaseAsset.contentType);
        res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
        res.send(databaseAsset.data);
        return;
      }
      const localBuffer = readServedAsset(requestedName);
      const ext = path6.extname(requestedName).toLowerCase();
      const contentType = ext === ".png" ? "image/png" : ext === ".jpg" || ext === ".jpeg" ? "image/jpeg" : ext === ".webp" ? "image/webp" : ext === ".gif" ? "image/gif" : ext === ".svg" ? "image/svg+xml" : "application/octet-stream";
      res.setHeader("Content-Type", contentType);
      res.setHeader("Cache-Control", "public, max-age=3600");
      res.send(localBuffer);
    } catch (err) {
      res.status(404).send("Product asset not found");
    }
  });
  app.get("/api/product-assets", async (req, res) => {
    try {
      const seen = /* @__PURE__ */ new Set();
      const assets = getProductAssetDirs().flatMap((assetsDir) => fs6.existsSync(assetsDir) ? fs6.readdirSync(assetsDir) : []).filter((file) => /\.(png|jpg|jpeg|webp|gif|svg)$/i.test(file)).filter((file) => {
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
  app.post("/api/get-research-details", async (req, res) => {
    try {
      const body = req.body || {};
      const peptideName = normalizeResearchName(body.peptideName || body.name || body.productName);
      if (!peptideName) {
        res.status(400).json({ error: "peptideName is required" });
        return;
      }
      const details = await buildResearchDetails({
        productId: body.productId || "",
        peptideName,
        synonyms: Array.isArray(body.synonyms) ? body.synonyms : [],
        sequence: String(body.sequence || ""),
        molecularFormula: String(body.molecularFormula || ""),
        molecularWeight: String(body.molecularWeight || "")
      });
      res.json(details);
    } catch (err) {
      console.error("[Research Details API Error]", err);
      res.status(500).json({ error: err?.message || "Unable to get research details" });
    }
  });
  app.get("/api/product-research-details", async (req, res) => {
    try {
      const name = String(req.query?.name || "").trim();
      if (!name) {
        res.status(400).send("Product name is required");
        return;
      }
      const details = await buildResearchDetails({
        peptideName: name,
        synonyms: [],
        sequence: "",
        molecularFormula: "",
        molecularWeight: ""
      });
      res.json(researchDetailsToLegacyResponse(details));
    } catch (err) {
      console.error("[Research Details Error]", err);
      res.status(500).send(err?.message || "Unable to get research details");
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
      const originalBuffer = Buffer.from(match[2], "base64");
      const baseSlug = makeSafeSlug(req.body?.slug || req.body?.filename);
      const requestedName = String(req.body?.filename || "").toLowerCase();
      if (mimeType === "image/svg+xml" || mimeType === "image/svg" || requestedName.endsWith(".svg")) {
        const svgText = originalBuffer.toString("utf8").trim();
        if (!/<svg[\s>]/i.test(svgText) || /<script[\s>]/i.test(svgText) || /on\w+\s*=/i.test(svgText)) {
          res.status(400).send("SVG uploads must be valid, safe SVG files. Please upload a PNG, JPG, WEBP, GIF, or a clean SVG.");
          return;
        }
        const filename = `${baseSlug}-${Date.now()}.svg`;
        const saved = await saveProductAsset(filename, svgText, "image/svg+xml");
        res.json(saved);
        return;
      }
      try {
        const { createCanvas: createCanvas2, loadImage: loadImage2 } = await import("@napi-rs/canvas");
        const image = await loadImage2(originalBuffer);
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
        const saved = await saveProductAsset(filename, processedBuffer, "image/png");
        res.json(saved);
        return;
      } catch (imageError) {
        console.warn("[Product Image Upload] Transparent-background conversion failed; saving original image.", imageError);
        const extension = mimeType.includes("webp") ? "webp" : mimeType.includes("jpeg") || mimeType.includes("jpg") ? "jpg" : mimeType.includes("gif") ? "gif" : mimeType.includes("png") ? "png" : "bin";
        const filename = `${baseSlug}-${Date.now()}.${extension}`;
        const saved = await saveProductAsset(filename, originalBuffer, mimeType);
        res.json(saved);
      }
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
      const minAmount = String(req.body?.minAmount || "").trim();
      const displayName = size && !name.toLowerCase().includes(size.toLowerCase()) ? `${name} ${size}` : name;
      const formatGiftCardAmount = (value) => {
        const parsed = Number(String(value || "").replace(/[^0-9.]/g, ""));
        return Number.isFinite(parsed) && parsed > 0 ? `$${parsed.toLocaleString("en-US", { maximumFractionDigits: 2 })}+` : "";
      };
      const giftCardRange = formatGiftCardAmount(minAmount);
      let buffer;
      let extension = "png";
      let contentType = "image/png";
      if (type === "cream") {
        buffer = readServedAsset("lotion-bottle-blank-hd-tube.png");
      } else if (type === "face-mask") {
        buffer = readServedAsset("face-mask-blank-hd.png");
      } else if (type === "gift-card") {
        const giftCardBuffer = readServedAsset("Gift-Card.png");
        if (giftCardRange) {
          try {
            const { createCanvas: createCanvas2, loadImage: loadImage2 } = await import("@napi-rs/canvas");
            const image = await loadImage2(giftCardBuffer);
            const canvas = createCanvas2(image.width, image.height);
            const context = canvas.getContext("2d");
            context.drawImage(image, 0, 0);
            const fontSize = Math.max(34, Math.round(image.width * 0.035));
            context.font = `700 ${fontSize}px Arial, sans-serif`;
            context.textAlign = "right";
            context.textBaseline = "top";
            context.shadowColor = "rgba(0,0,0,0.55)";
            context.shadowBlur = Math.round(fontSize * 0.16);
            context.shadowOffsetY = Math.max(1, Math.round(fontSize * 0.035));
            context.fillStyle = "#ffffff";
            context.textAlign = "left";
            context.fillText(giftCardRange, Math.round(image.width * 0.64), Math.round(image.height * 0.22));
            buffer = await canvas.encode("png");
          } catch (giftCardError) {
            console.warn("[Gift Card Preview] Amount-range rendering failed; saving base gift card image.", giftCardError);
            buffer = giftCardBuffer;
          }
        } else {
          buffer = giftCardBuffer;
        }
      } else {
        const { generateVialBuffer: generateVialBuffer3 } = await Promise.resolve().then(() => (init_vialGenerator(), vialGenerator_exports));
        buffer = await generateVialBuffer3(displayName);
      }
      const amountSlug = type === "gift-card" && giftCardRange ? `-${makeSafeSlug(giftCardRange)}` : "";
      const filename = `${slug}-${type}${amountSlug}-preview.${extension}`;
      const saved = await saveProductAsset(filename, buffer, contentType);
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
