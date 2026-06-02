import {
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
  decimal,
  boolean,
  json,
} from "drizzle-orm/mysql-core";

// ─── Users ───────────────────────────────────────────────────────────
export const users = mysqlTable("users", {
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
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// ─── Categories ──────────────────────────────────────────────────────
export const categories = mysqlTable("categories", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 100 }).notNull().unique(),
  slug: varchar("slug", { length: 100 }).notNull().unique(),
  description: text("description"),
  sortOrder: int("sortOrder").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Category = typeof categories.$inferSelect;
export type InsertCategory = typeof categories.$inferInsert;

// ─── Products ────────────────────────────────────────────────────────
export const products = mysqlTable("products", {
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
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Product = typeof products.$inferSelect;
export type InsertProduct = typeof products.$inferInsert;

// ─── Product ↔ Category (many-to-many) ──────────────────────────────
export const productCategories = mysqlTable("productCategories", {
  id: int("id").autoincrement().primaryKey(),
  productId: int("productId").notNull(),
  categoryId: int("categoryId").notNull(),
});

export type ProductCategory = typeof productCategories.$inferSelect;

// ─── Research Citations ──────────────────────────────────────────────
export const researchCitations = mysqlTable("researchCitations", {
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
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ResearchCitation = typeof researchCitations.$inferSelect;
export type InsertResearchCitation = typeof researchCitations.$inferInsert;

// ─── Product Research Content ────────────────────────────────────────
export const productResearch = mysqlTable("productResearch", {
  id: int("id").autoincrement().primaryKey(),
  productId: int("productId").notNull(),
  overview: text("overview"),
  chemicalMakeup: text("chemicalMakeup"),
  researchContent: text("researchContent"), // Rich text / markdown
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ProductResearch = typeof productResearch.$inferSelect;

// ─── Orders ──────────────────────────────────────────────────────────
export const orders = mysqlTable("orders", {
  id: int("id").autoincrement().primaryKey(),
  orderNumber: varchar("orderNumber", { length: 50 }).notNull().unique(),
  userId: int("userId"), // null for guest checkout
  guestEmail: varchar("guestEmail", { length: 320 }),
  guestName: varchar("guestName", { length: 255 }),
  status: mysqlEnum("status", [
    "pending",
    "paid",
    "processing",
    "shipped",
    "delivered",
    "cancelled",
    "refunded",
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
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Order = typeof orders.$inferSelect;
export type InsertOrder = typeof orders.$inferInsert;

// ─── Order Items ─────────────────────────────────────────────────────
export const orderItems = mysqlTable("orderItems", {
  id: int("id").autoincrement().primaryKey(),
  orderId: int("orderId").notNull(),
  productId: int("productId").notNull(),
  productName: varchar("productName", { length: 255 }).notNull(),
  variantId: int("variantId"),
  variantLabel: varchar("variantLabel", { length: 255 }),
  quantity: int("quantity").notNull(),
  unitPrice: decimal("unitPrice", { precision: 10, scale: 2 }).notNull(),
  totalPrice: decimal("totalPrice", { precision: 10, scale: 2 }).notNull(),
});

export type OrderItem = typeof orderItems.$inferSelect;

// ─── Discount Codes ──────────────────────────────────────────────────
export const discountCodes = mysqlTable("discountCodes", {
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
  productId: int("productId"), // If applies to specific product
  startsAt: timestamp("startsAt"),
  expiresAt: timestamp("expiresAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type DiscountCode = typeof discountCodes.$inferSelect;
export type InsertDiscountCode = typeof discountCodes.$inferInsert;


// ─── Gift Cards ─────────────────────────────────────────────────────
export const giftCards = mysqlTable("giftCards", {
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
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type GiftCard = typeof giftCards.$inferSelect;
export type InsertGiftCard = typeof giftCards.$inferInsert;

export const giftCardTransactions = mysqlTable("giftCardTransactions", {
  id: int("id").autoincrement().primaryKey(),
  giftCardId: int("giftCardId").notNull(),
  orderId: int("orderId"),
  type: mysqlEnum("type", ["issue", "reserve", "redeem", "release", "void"]).notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  balanceAfter: decimal("balanceAfter", { precision: 10, scale: 2 }),
  note: text("note"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type GiftCardTransaction = typeof giftCardTransactions.$inferSelect;
export type InsertGiftCardTransaction = typeof giftCardTransactions.$inferInsert;


// ─── Site Settings ───────────────────────────────────────────────────
export const siteSettings = mysqlTable("siteSettings", {
  id: int("id").autoincrement().primaryKey(),
  settingKey: varchar("settingKey", { length: 100 }).notNull().unique(),
  settingValue: text("settingValue"),
  settingType: mysqlEnum("settingType", ["text", "image", "boolean", "json", "html"])
    .default("text")
    .notNull(),
  label: varchar("label", { length: 255 }),
  description: text("description"),
  groupName: varchar("groupName", { length: 100 }).default("general"),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type SiteSetting = typeof siteSettings.$inferSelect;

// ─── Cart (server-side for logged-in users) ──────────────────────────
export const cartItems = mysqlTable("cartItems", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  productId: int("productId").notNull(),
  variantId: int("variantId"),
  variantLabel: varchar("variantLabel", { length: 255 }),
  quantity: int("quantity").default(1).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type CartItem = typeof cartItems.$inferSelect;

// ─── Product Variants (multiple doses per product) ──────────────────
export const productVariants = mysqlTable("product_variants", {
  id: int("id").autoincrement().primaryKey(),
  productId: int("productId").notNull(),
  label: varchar("label", { length: 255 }).notNull(), // e.g. "5mg", "10mg"
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  compareAtPrice: decimal("compareAtPrice", { precision: 10, scale: 2 }),
  sku: varchar("sku", { length: 50 }),
  stockQuantity: int("stockQuantity").default(100).notNull(),
  inStock: boolean("inStock").default(true).notNull(),
  imageUrl: text("imageUrl"),
  sortOrder: int("sortOrder").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ProductVariant = typeof productVariants.$inferSelect;
export type InsertProductVariant = typeof productVariants.$inferInsert;
