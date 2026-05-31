import mysql, { RowDataPacket } from "mysql2/promise";

const TABLES = [
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

const REQUIRED_COLUMNS: Array<[string, string, string]> = [
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
  ["cartItems", "variantLabel", "varchar(255)"],
];


type SeedProduct = {
  slug: string;
  name: string;
  image: string;
  category: string;
  price: string;
};

const DEFAULT_PRODUCTS: SeedProduct[] = [
  { slug: "bpc-157-5mg", name: "BPC-157 5mg", image: "/assets/bpc-157-5mg_1e10350a.png", category: "Peptides", price: "39.99" },
  { slug: "bpc-157-10mg", name: "BPC-157 10mg", image: "/assets/bpc-157-10mg_358b8e1b.png", category: "Peptides", price: "69.99" },
  { slug: "bpc-157-capsules-500mcg-30", name: "BPC-157 Capsules 500mcg (30)", image: "/assets/bpc-157-capsules-500mcg-30_a35e1c7b.png", category: "Peptides", price: "49.99" },
  { slug: "tb-500", name: "TB-500", image: "/assets/rvr-vial-template-single_c7ba8797.png", category: "Peptides", price: "49.99" },
  { slug: "cagrilintide-5mg", name: "Cagrilintide 5mg", image: "/assets/cagrilintide-5mg_f51eb3cf.png", category: "Peptides", price: "99.99" },
  { slug: "cagrilintide-semaglutide-5mg-5mg", name: "Cagrilintide/Semaglutide 5mg/5mg", image: "/assets/cagrilintide-semaglutide-5mg-5mg_7655c129.png", category: "Blends", price: "129.99" },
  { slug: "cjc-1295-no-dac-ipamorelin-5mg-5mg", name: "CJC-1295 No DAC/Ipamorelin 5mg/5mg", image: "/assets/cjc-1295-no-dac-ipamorelin-5mg-5mg_446f4b27.png", category: "Blends", price: "79.99" },
  { slug: "dsip-5mg", name: "DSIP 5mg", image: "/assets/dsip-5mg_72b0cefc.png", category: "Peptides", price: "39.99" },
  { slug: "epithalon-10mg", name: "Epithalon 10mg", image: "/assets/epithalon-10mg_dc0b8639.png", category: "Peptides", price: "49.99" },
  { slug: "ghk-cu-50mg", name: "GHK-Cu 50mg", image: "/assets/ghk-cu-50mg_274d06be.png", category: "Peptides", price: "59.99" },
  { slug: "glp-1-semaglutide-5mg", name: "GLP-1 Semaglutide 5mg", image: "/assets/glp-1-semaglutide-5mg_7dd36c7e.png", category: "Peptides", price: "89.99" },
  { slug: "glp-1-semaglutide-10mg", name: "GLP-1 Semaglutide 10mg", image: "/assets/glp-1-semaglutide-10mg_29953948.png", category: "Peptides", price: "149.99" },
  { slug: "kisspeptin-10mg", name: "Kisspeptin 10mg", image: "/assets/kisspeptin-10mg_55d055de.png", category: "Peptides", price: "49.99" },
  { slug: "kpv-10mg", name: "KPV 10mg", image: "/assets/kpv-10mg_87cf383a.png", category: "Peptides", price: "44.99" },
  { slug: "mazdutide-5mg", name: "Mazdutide 5mg", image: "/assets/mazdutide-5mg_6985cdd3.png", category: "Peptides", price: "99.99" },
  { slug: "melanotan-1-10mg", name: "Melanotan 1 10mg", image: "/assets/melanotan-1-10mg_a80a33e8.png", category: "Peptides", price: "39.99" },
  { slug: "melanotan-2-10mg", name: "Melanotan 2 10mg", image: "/assets/melanotan-2-10mg_be5b73dc.png", category: "Peptides", price: "39.99" },
  { slug: "mots-c-5mg", name: "MOTS-c 5mg", image: "/assets/mots-c-5mg_35dd3374.png", category: "Peptides", price: "49.99" },
  { slug: "mots-c-10mg", name: "MOTS-c 10mg", image: "/assets/mots-c-10mg_bf3f9730.png", category: "Peptides", price: "79.99" },
  { slug: "nad-500mg", name: "NAD+ 500mg", image: "/assets/nad-500mg_d3520d40.png", category: "Wellness", price: "79.99" },
  { slug: "nad-1000mg", name: "NAD+ 1000mg", image: "/assets/nad-1000mg_ede58afe.png", category: "Wellness", price: "129.99" },
  { slug: "oxytocin-acetate-5mg", name: "Oxytocin Acetate 5mg", image: "/assets/oxytocin-acetate-5mg_930aff12.png", category: "Peptides", price: "39.99" },
  { slug: "pe-22-28-10mg", name: "PE-22-28 10mg", image: "/assets/pe-22-28-10mg_4ae32cc2.png", category: "Peptides", price: "49.99" },
  { slug: "pinealon-20mg", name: "Pinealon 20mg", image: "/assets/pinealon-20mg_9c886336.png", category: "Peptides", price: "49.99" },
  { slug: "pt-141-10mg", name: "PT-141 10mg", image: "/assets/pt-141-10mg_15229f16.png", category: "Peptides", price: "44.99" },
  { slug: "retatrutide-5mg", name: "Retatrutide 5mg", image: "/assets/retatrutide-5mg_16793f06.png", category: "Peptides", price: "99.99" },
  { slug: "retatrutide-15mg", name: "Retatrutide 15mg", image: "/assets/retatrutide-15mg_a7725833.png", category: "Peptides", price: "199.99" },
  { slug: "selank-10mg", name: "Selank 10mg", image: "/assets/selank-10mg_ec5aa57c.png", category: "Peptides", price: "39.99" },
  { slug: "selank-semax-blend-10mg-10mg", name: "Selank/Semax Blend 10mg/10mg", image: "/assets/selank-semax-blend-10mg-10mg_f9249ead.png", category: "Blends", price: "69.99" },
  { slug: "semax-10mg", name: "Semax 10mg", image: "/assets/semax-10mg_24238dd4.png", category: "Peptides", price: "39.99" },
  { slug: "sermorelin-10mg", name: "Sermorelin 10mg", image: "/assets/sermorelin-10mg_92bb2dc6.png", category: "Peptides", price: "49.99" },
  { slug: "ss-31-30mg", name: "SS-31 30mg", image: "/assets/ss-31-30mg_d6fe070b.png", category: "Peptides", price: "89.99" },
  { slug: "super-wolf-10mg-10mg-10mg", name: "Super Wolf 10mg/10mg/10mg", image: "/assets/super-wolf-10mg-10mg-10mg_4bc7be3f.png", category: "Blends", price: "99.99" },
  { slug: "survodutide-5mg", name: "Survodutide 5mg", image: "/assets/survodutide-5mg_1d1a18da.png", category: "Peptides", price: "99.99" },
  { slug: "tesamorelin-10mg", name: "Tesamorelin 10mg", image: "/assets/tesamorelin-10mg_15b1bd0e.png", category: "Peptides", price: "89.99" },
  { slug: "thymosin-alpha-1-10mg", name: "Thymosin Alpha-1 10mg", image: "/assets/thymosin-alpha-1-10mg_1be0818b.png", category: "Peptides", price: "49.99" },
  { slug: "tirzepatide-5mg", name: "Tirzepatide 5mg", image: "/assets/tirzepatide-5mg_3d0c0d8c.png", category: "Peptides", price: "99.99" },
  { slug: "tirzepatide-15mg", name: "Tirzepatide 15mg", image: "/assets/tirzepatide-15mg_fed2967c.png", category: "Peptides", price: "199.99" },
  { slug: "wolverine-blend-20mg", name: "Wolverine Blend 20mg", image: "/assets/wolverine-blend-20mg_5d66e1ac.png", category: "Blends", price: "89.99" },
  { slug: "5-amino-1mq-50mg", name: "5-Amino-1MQ 50mg", image: "/assets/5-amino-1mq-50mg_06697bbc.png", category: "Peptides", price: "59.99" },
  { slug: "bacteriostatic-water-10ml", name: "Bacteriostatic Water 10ml", image: "/assets/bacteriostatic-water-10ml_764a84d1.png", category: "Reconstitution", price: "9.99" },
  { slug: "bacteriostatic-water-30ml", name: "Bacteriostatic Water 30ml", image: "/assets/bacteriostatic-water-30ml_0d6cfc45.png", category: "Reconstitution", price: "14.99" },
  { slug: "hospira-bacteriostatic-water-30ml", name: "Hospira Bacteriostatic Water 30ml", image: "/assets/hospira-bacteriostatic-water-30ml_80bb2c12.png", category: "Reconstitution", price: "19.99" },
  { slug: "reconstitution-kit", name: "Reconstitution Kit", image: "/assets/reconstitution-kit_62db9cd5.png", category: "Reconstitution", price: "24.99" },
  { slug: "glutathione-1200mg", name: "Glutathione 1200mg", image: "/assets/glutathione-1200mg_e3e41ad9.png", category: "Wellness", price: "79.99" },
  { slug: "l-carnitine-300mg-ml-30ml", name: "L-Carnitine 300mg/ml 30ml", image: "/assets/l-carnitine-300mg-ml-30ml_a7fbf7c4.png", category: "Wellness", price: "59.99" },
  { slug: "vitamin-b-complex", name: "Vitamin B Complex", image: "/assets/vitamin-b-complex_75a8cb81.png", category: "Wellness", price: "39.99" },
  { slug: "vitamin-d-100-000-iu-ml", name: "Vitamin D 100,000 IU/ml", image: "/assets/vitamin-d-100-000-iu-ml_ee0dac38.png", category: "Wellness", price: "39.99" },
  { slug: "curenex-daily-care-rejuvenating-cream", name: "Curenex Daily Care Rejuvenating Cream", image: "/assets/curenex-daily-care-rejuvenating-cream_633ba9dc.png", category: "Skin Care", price: "49.99" },
  { slug: "curenex-daily-care-skin-booster", name: "Curenex Daily Care Skin Booster", image: "/assets/curenex-daily-care-skin-booster_197ee291.png", category: "Skin Care", price: "59.99" },
  { slug: "curenex-hydrating-cleanser", name: "Curenex Hydrating Cleanser", image: "/assets/curenex-hydrating-cleanser_1edb764f.png", category: "Skin Care", price: "34.99" },
  { slug: "curenex-sheer-sunscreen-50-spf", name: "Curenex Sheer Sunscreen 50 SPF", image: "/assets/curenex-sheer-sunscreen-50-spf_fa687400.png", category: "Skin Care", price: "34.99" },
  { slug: "rm-repair-moisturizing-cream", name: "RM Repair Moisturizing Cream", image: "/assets/rm-repair-moisturizing-cream_56a48eed.png", category: "Skin Care", price: "49.99" },
  { slug: "urea-cream-skin-softener", name: "Urea Cream Skin Softener", image: "/assets/urea-cream-skin-softener_f87a0c24.png", category: "Skin Care", price: "29.99" },
];

const DEFAULT_CATEGORIES = ["Peptides", "Blends", "Reconstitution", "Wellness", "Skin Care"];

function slugify(value: string) {
  return value.toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
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
      await ensureDefaultCatalog(conn);
      console.log("[DB init] Database schema ready. Users table columns verified. Catalog verified.");
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
