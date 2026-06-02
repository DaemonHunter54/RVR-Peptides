import { eq, and, like, desc, asc, sql, inArray, or, gte, lte } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  InsertUser, users,
  categories, InsertCategory,
  products, InsertProduct,
  productCategories,
  researchCitations, InsertResearchCitation,
  productResearch,
  orders, InsertOrder,
  orderItems,
  discountCodes, InsertDiscountCode,
  siteSettings,
  cartItems,
  productVariants,
  giftCards, InsertGiftCard,
} from "../drizzle/schema";
import { ensureDatabaseReady } from "./db-init";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
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

// ─── Users ───────────────────────────────────────────────────────────
export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) return;
  const values: InsertUser = { openId: user.openId };
  const updateSet: Record<string, unknown> = {};
  const textFields = ["name", "email", "loginMethod"] as const;
  type TextField = (typeof textFields)[number];
  const assignNullable = (field: TextField) => {
    const value = user[field];
    if (value === undefined) return;
    const normalized = value ?? null;
    values[field] = normalized;
    updateSet[field] = normalized;
  };
  textFields.forEach(assignNullable);
  if (user.lastSignedIn !== undefined) { values.lastSignedIn = user.lastSignedIn; updateSet.lastSignedIn = user.lastSignedIn; }
  if (user.role !== undefined) { values.role = user.role; updateSet.role = user.role; }
  if (!values.lastSignedIn) values.lastSignedIn = new Date();
  if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();
  await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getUserById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return result[0];
}

export async function getUserByEmail(email: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
  return result[0];
}

export async function getUserByUsername(username: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.username, username)).limit(1);
  return result[0];
}

export async function createLocalUser(data: { email: string; username: string; passwordHash: string; name?: string }) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const openId = `local_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
  const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const adminUsername = process.env.ADMIN_USERNAME?.trim().toLowerCase();
  const isConfiguredAdmin =
    (!!adminEmail && data.email.trim().toLowerCase() === adminEmail) ||
    (!!adminUsername && data.username.trim().toLowerCase() === adminUsername);

  await db.insert(users).values({
    openId,
    email: data.email,
    username: data.username,
    passwordHash: data.passwordHash,
    name: data.name || data.username,
    loginMethod: "local",
    role: isConfiguredAdmin ? "admin" : "user",
    lastSignedIn: new Date(),
  });
  return getUserByOpenId(openId);
}

export async function updateUserPassword(userId: number, passwordHash: string) {
  const db = await getDb();
  if (!db) return;
  await db.update(users).set({ passwordHash }).where(eq(users.id, userId));
}

export async function updateUserProfile(userId: number, data: Partial<{ name: string; username: string; email: string; phone: string; shippingAddress: string; savedPaymentInfo: string }>) {
  const db = await getDb();
  if (!db) return;
  await db.update(users).set(data).where(eq(users.id, userId));
}

export async function getAllUsers() {
  const db = await getDb();
  if (!db) return [];
  return db.select({ id: users.id, name: users.name, email: users.email, username: users.username, role: users.role, createdAt: users.createdAt, lastSignedIn: users.lastSignedIn }).from(users).orderBy(desc(users.createdAt));
}

// ─── Categories ──────────────────────────────────────────────────────
export async function getAllCategories() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(categories).orderBy(asc(categories.sortOrder), asc(categories.name));
}

export async function getCategoryBySlug(slug: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(categories).where(eq(categories.slug, slug)).limit(1);
  return result[0];
}

export async function createCategory(data: InsertCategory) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.insert(categories).values(data);
}

export async function updateCategory(id: number, data: Partial<InsertCategory>) {
  const db = await getDb();
  if (!db) return;
  await db.update(categories).set(data).where(eq(categories.id, id));
}

export async function deleteCategory(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(productCategories).where(eq(productCategories.categoryId, id));
  await db.delete(categories).where(eq(categories.id, id));
}

// ─── Products ────────────────────────────────────────────────────────
export async function getAllProducts(opts?: { activeOnly?: boolean; categorySlug?: string; search?: string; limit?: number; offset?: number }) {
  const db = await getDb();
  if (!db) return { products: [], total: 0 };
  const conditions = [];
  if (opts?.activeOnly) conditions.push(eq(products.isActive, true));
  if (opts?.search) conditions.push(like(products.name, `%${opts.search}%`));

  let query = db.select().from(products);
  if (conditions.length > 0) {
    query = query.where(and(...conditions)) as any;
  }

  // Get total count
  const countResult = await db.select({ count: sql<number>`count(*)` }).from(products).where(conditions.length > 0 ? and(...conditions) : undefined);
  const total = Number(countResult[0]?.count || 0);

  let results = await (query as any).orderBy(asc(products.sortOrder), asc(products.name)).limit(opts?.limit || 100).offset(opts?.offset || 0);

  // If category filter, join with productCategories
  if (opts?.categorySlug) {
    const cat = await getCategoryBySlug(opts.categorySlug);
    if (cat) {
      const pcRows = await db.select({ productId: productCategories.productId }).from(productCategories).where(eq(productCategories.categoryId, cat.id));
      const productIds = pcRows.map(r => r.productId);
      if (productIds.length > 0) {
        results = results.filter((p: any) => productIds.includes(p.id));
      } else {
        results = [];
      }
    }
  }

  return { products: results, total };
}

export async function getProductBySlug(slug: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(products).where(eq(products.slug, slug)).limit(1);
  return result[0];
}
export async function getProductById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(products).where(eq(products.id, id)).limit(1);
  return result[0];
}

export async function getProductCategories(productId: number) {
  const db = await getDb();
  if (!db) return [];
  const rows = await db.select({ categoryId: productCategories.categoryId }).from(productCategories).where(eq(productCategories.productId, productId));
  if (rows.length === 0) return [];
  const catIds = rows.map(r => r.categoryId);
  return db.select().from(categories).where(inArray(categories.id, catIds));
}

// ─── Product Variants ────────────────────────────────────────────────
export async function getProductVariants(productId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(productVariants).where(eq(productVariants.productId, productId)).orderBy(asc(productVariants.sortOrder));
}

export async function getVariantById(variantId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(productVariants).where(eq(productVariants.id, variantId)).limit(1);
  return result[0];
}

export async function createProductVariant(data: { productId: number; label: string; price: string; compareAtPrice?: string; sku?: string; stockQuantity?: number; imageUrl?: string; sortOrder?: number }) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const result = await db.insert(productVariants).values(data as any);
  return Number(result[0].insertId);
}

export async function updateProductVariant(id: number, data: Partial<{ label: string; price: string; compareAtPrice: string; sku: string; stockQuantity: number; inStock: boolean; imageUrl: string; sortOrder: number }>) {
  const db = await getDb();
  if (!db) return;
  await db.update(productVariants).set(cleanVariantMutationData(data) as any).where(eq(productVariants.id, id));
}

export async function deleteProductVariant(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(productVariants).where(eq(productVariants.id, id));
}

function cleanVariantMutationData(data: any) {
  const cleaned: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(data || {})) {
    if (value === undefined) continue;

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

export async function replaceProductVariants(productId: number, variants: Array<{ label: string; price: string; compareAtPrice?: string; sku?: string; stockQuantity?: number; inStock?: boolean; imageUrl?: string; sortOrder?: number }>) {
  const db = await getDb();
  if (!db) return;
  await db.delete(productVariants).where(eq(productVariants.productId, productId));
  const rows = variants
    .filter(v => String(v.label || "").trim())
    .map((v, index) => cleanVariantMutationData({
      productId,
      label: String(v.label || "").trim(),
      price: String(v.price || "0"),
      compareAtPrice: v.compareAtPrice,
      sku: v.sku,
      stockQuantity: v.stockQuantity ?? 100,
      inStock: v.inStock ?? true,
      imageUrl: v.imageUrl,
      sortOrder: v.sortOrder ?? index,
    }));
  if (rows.length > 0) {
    await db.insert(productVariants).values(rows as any);
  }
}

export async function getAllProductsWithVariantCount(opts?: { activeOnly?: boolean; categorySlug?: string; search?: string; limit?: number; offset?: number }) {
  const { products: prods, total } = await getAllProducts(opts);
  const db = await getDb();
  if (!db) return { products: prods.map((p: any) => ({ ...p, hasVariants: false, variantCount: 0 })), total };
  
  // Get variant counts for all products
  const variantCounts = await db.select({
    productId: productVariants.productId,
    count: sql<number>`count(*)`
  }).from(productVariants).groupBy(productVariants.productId);
  
  const countMap = new Map(variantCounts.map(vc => [vc.productId, Number(vc.count)]));
  
  const enriched = prods.map((p: any) => ({
    ...p,
    hasVariants: (countMap.get(p.id) || 0) > 1,
    variantCount: countMap.get(p.id) || 0,
  }));
  
  return { products: enriched, total };
}


function cleanProductMutationData(data: Partial<InsertProduct>): Partial<InsertProduct> {
  const cleaned: Record<string, unknown> = {};
  const nullableDecimalFields = new Set(["compareAtPrice", "discountPercent"]);
  const nullableTextFields = new Set([
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
    "massSpecUrl",
  ]);
  const integerFields = new Set(["stockQuantity", "lowStockThreshold", "sortOrder"]);

  for (const [key, value] of Object.entries(data as Record<string, unknown>)) {
    if (value === undefined) continue;

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
      cleaned[key] = value === null || value === undefined ? "" : String(value);
      continue;
    }

    cleaned[key] = value;
  }

  return cleaned as Partial<InsertProduct>;
}

export async function createProduct(data: InsertProduct, categoryIds?: number[]) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const result = await db.insert(products).values(cleanProductMutationData(data) as InsertProduct);
  const productId = Number(result[0].insertId);
  if (categoryIds && categoryIds.length > 0) {
    await db.insert(productCategories).values(categoryIds.map(cid => ({ productId, categoryId: cid })));
  }
  return productId;
}

export async function updateProduct(id: number, data: Partial<InsertProduct>, categoryIds?: number[]) {
  const db = await getDb();
  if (!db) return;
  await db.update(products).set(cleanProductMutationData(data)).where(eq(products.id, id));
  if (categoryIds !== undefined) {
    await db.delete(productCategories).where(eq(productCategories.productId, id));
    if (categoryIds.length > 0) {
      await db.insert(productCategories).values(categoryIds.map(cid => ({ productId: id, categoryId: cid })));
    }
  }
}

export async function deleteProduct(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(productCategories).where(eq(productCategories.productId, id));
  await db.delete(researchCitations).where(eq(researchCitations.productId, id));
  await db.delete(productResearch).where(eq(productResearch.productId, id));
  await db.delete(products).where(eq(products.id, id));
}

export async function getFeaturedProducts() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(products).where(and(eq(products.isFeatured, true), eq(products.isActive, true))).orderBy(asc(products.sortOrder)).limit(12);
}

// ─── Research ────────────────────────────────────────────────────────
export async function getProductResearch(productId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(productResearch).where(eq(productResearch.productId, productId)).limit(1);
  return result[0];
}

export async function upsertProductResearch(productId: number, data: { overview?: string; chemicalMakeup?: string; researchContent?: string }) {
  const db = await getDb();
  if (!db) return;
  const existing = await getProductResearch(productId);
  if (existing) {
    await db.update(productResearch).set(data).where(eq(productResearch.productId, productId));
  } else {
    await db.insert(productResearch).values({ productId, ...data });
  }
}

export async function getProductCitations(productId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(researchCitations).where(eq(researchCitations.productId, productId)).orderBy(asc(researchCitations.citationNumber));
}

export async function createCitation(data: InsertResearchCitation) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.insert(researchCitations).values(data);
}

export async function updateCitation(id: number, data: Partial<InsertResearchCitation>) {
  const db = await getDb();
  if (!db) return;
  await db.update(researchCitations).set(data).where(eq(researchCitations.id, id));
}

export async function deleteCitation(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(researchCitations).where(eq(researchCitations.id, id));
}

// ─── Orders ──────────────────────────────────────────────────────────
export async function createOrder(data: InsertOrder, items: { productId: number; productName: string; variantId?: number | null; variantLabel?: string | null; quantity: number; unitPrice: string; totalPrice: string }[]) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const result = await db.insert(orders).values(data);
  const orderId = Number(result[0].insertId);
  if (items.length > 0) {
    await db.insert(orderItems).values(items.map(item => ({ ...item, orderId })));
  }
  // Decrement stock
  for (const item of items) {
    await db.update(products).set({ stockQuantity: sql`GREATEST(${products.stockQuantity} - ${item.quantity}, 0)` }).where(eq(products.id, item.productId));
  }
  return orderId;
}

export async function getOrderByNumber(orderNumber: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(orders).where(eq(orders.orderNumber, orderNumber)).limit(1);
  return result[0];
}

export async function getOrderById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(orders).where(eq(orders.id, id)).limit(1);
  return result[0];
}

export async function getOrderItems(orderId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(orderItems).where(eq(orderItems.orderId, orderId));
}

export async function getUserOrders(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(orders).where(eq(orders.userId, userId)).orderBy(desc(orders.createdAt));
}

export async function getAllOrders(opts?: { status?: string; limit?: number; offset?: number }) {
  const db = await getDb();
  if (!db) return { orders: [], total: 0 };
  const conditions = [];
  if (opts?.status && opts.status !== 'all') conditions.push(eq(orders.status, opts.status as any));
  const countResult = await db.select({ count: sql<number>`count(*)` }).from(orders).where(conditions.length > 0 ? and(...conditions) : undefined);
  const total = Number(countResult[0]?.count || 0);
  let query = db.select().from(orders);
  if (conditions.length > 0) query = query.where(and(...conditions)) as any;
  const result = await (query as any).orderBy(desc(orders.createdAt)).limit(opts?.limit || 50).offset(opts?.offset || 0);
  return { orders: result, total };
}

export async function updateOrder(id: number, data: Partial<InsertOrder>) {
  const db = await getDb();
  if (!db) return;
  await db.update(orders).set(data).where(eq(orders.id, id));
}

export async function updateOrderTracking(id: number, trackingNumber: string, trackingCarrier: string) {
  const db = await getDb();
  if (!db) return;
  await db.update(orders).set({ trackingNumber, trackingCarrier, status: "shipped" }).where(eq(orders.id, id));
}

export async function updateOrderPayment(paymentId: string, paymentStatus: string) {
  const db = await getDb();
  if (!db) return;
  const newStatus = paymentStatus === "finished" ? "paid" : paymentStatus === "failed" ? "cancelled" : undefined;
  const updateData: any = { paymentStatus };
  if (newStatus) updateData.status = newStatus;
  await db.update(orders).set(updateData).where(eq(orders.paymentId, paymentId));

  if (newStatus === "paid") {
    const paidOrders = await db.select().from(orders).where(eq(orders.paymentId, paymentId)).limit(1);
    const order = paidOrders[0];
    if (order) await issueGiftCardsForOrder(order.id, order.guestEmail || undefined);
  }
}



async function sendGiftCardEmail(to: string | undefined, code: string, amount: number) {
  if (!to) return;
  const subject = "Your River Valley Research Peptides Gift Card";
  const text = [
    "Thank you for your gift card purchase.",
    "",
    `Gift card code: ${code}`,
    `Amount: $${amount.toFixed(2)}`,
    "",
    "Use this code during checkout in the Use gift card field.",
  ].join("\n");

  const resendKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.GIFT_CARD_FROM_EMAIL || process.env.FROM_EMAIL || "orders@rivervalleyresearchpeptides.com";
  if (resendKey) {
    try {
      await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: `Bearer ${resendKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({ from: fromEmail, to, subject, text }),
      });
      return;
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
        body: JSON.stringify({ to, subject, text, code, amount }),
      });
      return;
    } catch (error) {
      console.warn("[Gift Card Email] Webhook delivery failed.", error);
    }
  }

  console.log(`[Gift Card Email Pending] ${to}: ${code} for $${amount.toFixed(2)}`);
}

export async function issueGiftCardsForOrder(orderId: number, purchaserEmail?: string) {
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
      await sendGiftCardEmail(purchaserEmail, code, amount);
      console.log(`[Gift Card] Issued ${code} for order ${orderId}`);
    }
  }
}


// ─── Gift Cards ─────────────────────────────────────────────────────
function normalizeGiftCardCode(code: string) {
  return String(code || "").toUpperCase().replace(/[^A-Z0-9]/g, "").replace(/^(.{4})(.+)$/, "$1-$2").slice(0, 9);
}

export async function getGiftCardByCode(code: string) {
  const db = await getDb();
  if (!db) return undefined;
  const normalized = normalizeGiftCardCode(code);
  const result = await db.select().from(giftCards).where(eq(giftCards.code, normalized)).limit(1);
  return result[0];
}

export async function createGiftCard(data: InsertGiftCard) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.insert(giftCards).values({ ...data, code: normalizeGiftCardCode(data.code) });
}

export async function applyGiftCard(code: string, amount: number) {
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


// ─── Discounts ───────────────────────────────────────────────────────
export async function getAllDiscountCodes() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(discountCodes).orderBy(desc(discountCodes.createdAt));
}

export async function getDiscountByCode(code: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(discountCodes).where(eq(discountCodes.code, code.toUpperCase())).limit(1);
  return result[0];
}

export async function createDiscount(data: InsertDiscountCode) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.insert(discountCodes).values({ ...data, code: data.code.toUpperCase() });
}

export async function updateDiscount(id: number, data: Partial<InsertDiscountCode>) {
  const db = await getDb();
  if (!db) return;
  if (data.code) data.code = data.code.toUpperCase();
  await db.update(discountCodes).set(data).where(eq(discountCodes.id, id));
}

export async function deleteDiscount(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(discountCodes).where(eq(discountCodes.id, id));
}

export async function incrementDiscountUse(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.update(discountCodes).set({ currentUses: sql`${discountCodes.currentUses} + 1` }).where(eq(discountCodes.id, id));
}

// ─── Site Settings ───────────────────────────────────────────────────
export async function getAllSettings() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(siteSettings).orderBy(asc(siteSettings.groupName), asc(siteSettings.settingKey));
}

export async function getSetting(key: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(siteSettings).where(eq(siteSettings.settingKey, key)).limit(1);
  return result[0]?.settingValue;
}

export async function getSettingsByGroup(groupName: string) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(siteSettings).where(eq(siteSettings.groupName, groupName));
}

export async function updateSetting(key: string, value: string) {
  const db = await getDb();
  if (!db) return;
  await db.update(siteSettings).set({ settingValue: value }).where(eq(siteSettings.settingKey, key));
}

// ─── Cart ────────────────────────────────────────────────────────────
export async function getCartItems(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(cartItems).where(eq(cartItems.userId, userId));
}

export async function addToCart(userId: number, productId: number, quantity: number, variantId?: number, variantLabel?: string) {
  const db = await getDb();
  if (!db) return;
  // Match on productId + variantId combination
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

export async function updateCartItem(userId: number, productId: number, quantity: number) {
  const db = await getDb();
  if (!db) return;
  if (quantity <= 0) {
    await db.delete(cartItems).where(and(eq(cartItems.userId, userId), eq(cartItems.productId, productId)));
  } else {
    await db.update(cartItems).set({ quantity }).where(and(eq(cartItems.userId, userId), eq(cartItems.productId, productId)));
  }
}

export async function removeFromCart(userId: number, productId: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(cartItems).where(and(eq(cartItems.userId, userId), eq(cartItems.productId, productId)));
}

export async function clearCart(userId: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(cartItems).where(eq(cartItems.userId, userId));
}

// ─── Dashboard Stats ─────────────────────────────────────────────────
export async function getDashboardStats() {
  const db = await getDb();
  if (!db) return { totalOrders: 0, totalRevenue: 0, totalProducts: 0, totalUsers: 0, recentOrders: [], lowStockProducts: [] };

  const [orderCount] = await db.select({ count: sql<number>`count(*)` }).from(orders);
  const [revenue] = await db.select({ total: sql<number>`COALESCE(SUM(total), 0)` }).from(orders).where(eq(orders.status, "paid"));
  const [productCount] = await db.select({ count: sql<number>`count(*)` }).from(products);
  const [userCount] = await db.select({ count: sql<number>`count(*)` }).from(users);
  const recentOrders = await db.select().from(orders).orderBy(desc(orders.createdAt)).limit(10);
  const lowStockProducts = await db.select().from(products).where(and(eq(products.isActive, true), lte(products.stockQuantity, products.lowStockThreshold)));

  return {
    totalOrders: Number(orderCount.count),
    totalRevenue: Number(revenue.total),
    totalProducts: Number(productCount.count),
    totalUsers: Number(userCount.count),
    recentOrders,
    lowStockProducts,
  };
}

// ─── Upsert Setting ─────────────────────────────────────────────────
export async function upsertSetting(key: string, value: string, groupName?: string) {
  const db = await getDb();
  if (!db) return;
  const existing = await db.select().from(siteSettings).where(eq(siteSettings.settingKey, key)).limit(1);
  if (existing.length > 0) {
    await db.update(siteSettings).set({ settingValue: value }).where(eq(siteSettings.settingKey, key));
  } else {
    await db.insert(siteSettings).values({ settingKey: key, settingValue: value, groupName: groupName || "payment" });
  }
}
