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
  ["users", "createdAt", "timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP"],
  ["users", "updatedAt", "timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP"],
  ["users", "lastSignedIn", "timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP"],
];

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

    const conn = await mysql.createConnection(url);
    try {
      console.log("[DB init] Ensuring required tables and columns exist...");
      for (const statement of TABLES) {
        await conn.execute(statement);
      }
      for (const [table, column, definition] of REQUIRED_COLUMNS) {
        await addColumnIfMissing(conn, table, column, definition);
      }
      console.log("[DB init] Database schema ready. Users table columns verified.");
      initialized = true;
    } finally {
      await conn.end();
    }
  })();

  return initPromise;
}
