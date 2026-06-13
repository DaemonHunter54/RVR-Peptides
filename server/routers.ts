import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";
import * as db from "./db";
import { nanoid } from "nanoid";
import { createHostedPayment, getHostedPaymentForm, getApiStatus } from "./paymentcloud";
import { generateVialImage, generateHeroVialsImage, generateVialBuffer, generateHeroVialsBuffer } from "./vialGenerator";
import crypto from "crypto";
import fs from "fs";
import path from "path";

const JWT_SECRET_KEY = new TextEncoder().encode(process.env.JWT_SECRET || "fallback-secret-key");

function makeProductSlug(value: string): string {
  return String(value || "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

let cachedProductAssets: Map<string, string> | null = null;
function getProductAssetMap(): Map<string, string> {
  if (cachedProductAssets) return cachedProductAssets;
  cachedProductAssets = new Map();
  const assetsDir = path.join(process.cwd(), "client", "public", "assets");
  try {
    for (const file of fs.readdirSync(assetsDir)) {
      if (!/\.(png|jpg|jpeg|webp)$/i.test(file)) continue;
      const key = makeProductSlug(file.replace(/\.[^.]+$/, "").replace(/_[0-9a-f]{8}$/i, ""));
      if (key && !key.startsWith("rvr-logo") && !key.startsWith("rvr-hero") && !key.startsWith("rvr-vial-template")) {
        cachedProductAssets.set(key, `/assets/${file}`);
      }
    }
  } catch {
    // Assets may be unavailable in some local tooling; return an empty map.
  }
  return cachedProductAssets;
}


const NON_VIAL_TERMS = ["capsule", "capsules", "cream", "cleanser", "sunscreen", "mask", "lotion", "serum", "kit", "box", "card", "storage", "cap", "bottle", "spray", "dropper"];
function isNonVialProduct(input: { slug?: string | null; name?: string | null; form?: string | null; category?: string | null; categories?: any[] | null }): boolean {
  const slug = makeProductSlug(input.slug || "");
  if (slug === "bpc-157") return false;
  if (slug === "bpc-157-capsules-500mcg-30") return true;

  const text = [input.slug, input.name, input.form, input.category, ...(input.categories || []).map((c: any) => c?.name)]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return NON_VIAL_TERMS.some((term) => text.includes(term));
}
function generatedVialUrlForProduct(input: { slug?: string | null; name?: string | null; size?: string | null; contents?: string | null }): string {
  const slug = makeProductSlug(input.slug || input.name || "product") || "product";
  const params = new URLSearchParams();
  if (input.name) params.set("name", String(input.name));
  if (input.size || input.contents) params.set("size", String(input.size || input.contents));
  params.set("v", "rvr-photoreal-adaptive-fit-v1");
  return `/api/vial/${slug}.png?${params.toString()}`;
}

function productAssetForInput(input: { slug?: string | null; name?: string | null; imageUrl?: string | null }): string {
  const assets = getProductAssetMap();
  const slugKey = makeProductSlug(input.slug || "");
  if (slugKey && assets.has(slugKey)) return assets.get(slugKey)!;
  const nameKey = makeProductSlug(input.name || "");
  if (nameKey && assets.has(nameKey)) return assets.get(nameKey)!;
  return "";
}

function shouldReplaceGeneratedImage(image?: string | null): boolean {
  if (!image) return true;
  const value = String(image);
  return value.startsWith("/api/vial/")
    || value.includes("rvr-vial-template-single")
    || value.includes("rvr-vial-template")
    || value.includes("/assets/generated/");
}


function isLegacyBundledVialAsset(value?: string | null): boolean {
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

function shouldReplaceVialImage(product: any, image?: string | null): boolean {
  return shouldReplaceGeneratedImage(image) || (!isNonVialProduct(product) && isLegacyBundledVialAsset(image));
}

function productAssetForDisplay(input: { slug?: string | null; name?: string | null; imageUrl?: string | null; size?: string | null; contents?: string | null }): string {
  const assets = getProductAssetMap();
  const exact = productAssetForInput(input);
  if (exact) return exact;

  const baseKeys = [makeProductSlug(input.slug || ""), makeProductSlug(input.name || "")].filter(Boolean);
  const sizeKey = makeProductSlug(input.size || input.contents || "");

  for (const baseKey of baseKeys) {
    if (sizeKey && assets.has(`${baseKey}-${sizeKey}`)) return assets.get(`${baseKey}-${sizeKey}`)!;
    const matches = Array.from(assets.entries())
      .filter(([key]) => {
        if (!(key === baseKey || key.startsWith(`${baseKey}-`))) return false;
        // Do not let capsule bottle assets satisfy vial/grouped products.
        // Example: bpc-157 must stay an HD vial; only the explicit capsules slug can use bottle art.
        if (!isNonVialProduct(input) && /capsule|capsules/i.test(key)) return false;
        return true;
      })
      .sort(([a], [b]) => {
        const aCaps = a.includes("capsule");
        const bCaps = b.includes("capsule");
        if (aCaps !== bCaps) return aCaps ? 1 : -1;
        return a.localeCompare(b, undefined, { numeric: true });
      });
    if (matches.length) return matches[0][1];
  }

  return "";
}

function preserveManusImage(product: any): any {
  if (!product) return product;
  const mappedImage = productAssetForDisplay(product);
  if (!isNonVialProduct(product)) {
    if (mappedImage && shouldReplaceVialImage(product, product.imageUrl)) {
      return { ...product, imageUrl: mappedImage };
    }
    return shouldReplaceVialImage(product, product.imageUrl)
      ? { ...product, imageUrl: generatedVialUrlForProduct(product) }
      : product;
  }
  if (mappedImage && shouldReplaceGeneratedImage(product.imageUrl)) {
    return { ...product, imageUrl: mappedImage };
  }
  return product;
}

// Admin middleware
const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "admin" && ctx.user.role !== "super_admin") throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
  return next({ ctx });
});


const superAdminProcedure = adminProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "super_admin") {
    throw new TRPCError({ code: "FORBIDDEN", message: "Super admin access required" });
  }
  return next({ ctx });
});



function isGiftCardProduct(product: any) {
  return makeProductSlug(product?.slug || product?.name || "") === "gift-card" || String(product?.name || "").toLowerCase().includes("gift card");
}

function parseGiftCardAmountFromLabel(label?: string | null) {
  const text = String(label || "");
  const match = text.match(/(?:gift\s*card\s*)?\$?([0-9]+(?:\.[0-9]{1,2})?)/i);
  if (!match) return null;
  const amount = Number(match[1]);
  return Number.isFinite(amount) && amount > 0 ? amount : null;
}

function giftCardVariantLabel(amount: number) {
  return `Gift Card $${amount.toFixed(2)}`;
}

function normalizeAdminProductInput<T extends Record<string, any>>(input: T): T {
  const out: Record<string, any> = { ...input };

  // Required decimal field in MySQL: blank admin input should not become an invalid decimal.
  if (out.price === undefined || out.price === null || String(out.price).trim() === "") out.price = "0";

  // Optional decimal fields: blank string should be NULL, not an invalid decimal.
  for (const key of ["compareAtPrice", "discountPercent"]) {
    if (out[key] === undefined || out[key] === null || String(out[key]).trim() === "") out[key] = null;
  }

  // Optional URL/text fields: blank strings should be NULL to avoid bad SQL payloads.
  for (const key of [
    "sku", "imageUrl", "size", "contents", "form", "purity",
    "molecularFormula", "molecularWeight", "otherNames",
    "coaUrl", "hplcUrl", "massSpecUrl"
  ]) {
    if (out[key] === undefined || out[key] === null || String(out[key]).trim() === "") out[key] = null;
  }

  if (out.stockQuantity === undefined || out.stockQuantity === null || out.stockQuantity === "") out.stockQuantity = 100;
  if (out.lowStockThreshold === "" || out.lowStockThreshold === null) delete out.lowStockThreshold;
  if (out.sortOrder === "" || out.sortOrder === null) delete out.sortOrder;

  return out as T;
}

function normalizeAdminVariantInput<T extends Record<string, any>>(variant: T, fallbackPrice = "0"): T {
  const out: Record<string, any> = { ...variant };
  if (out.price === undefined || out.price === null || String(out.price).trim() === "") out.price = fallbackPrice || "0";
  if (out.compareAtPrice === undefined || out.compareAtPrice === null || String(out.compareAtPrice).trim() === "") out.compareAtPrice = null;
  for (const key of ["sku", "imageUrl"]) {
    if (out[key] === undefined || out[key] === null || String(out[key]).trim() === "") out[key] = null;
  }
  if (out.stockQuantity === undefined || out.stockQuantity === null || out.stockQuantity === "") out.stockQuantity = 100;
  return out as T;
}

const productVariantInput = z.object({
  id: z.number().optional(),
  label: z.string().optional(),
  price: z.string().optional(),
  compareAtPrice: z.string().nullable().optional(),
  sku: z.string().optional(),
  stockQuantity: z.number().optional(),
  inStock: z.boolean().optional(),
  imageUrl: z.string().optional(),
  sortOrder: z.number().optional(),
});


export const appRouter = router({
  system: systemRouter,

  // ─── Auth ────────────────────────────────────────────────────────
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
    register: publicProcedure.input(z.object({
      email: z.string().email(),
      username: z.string().min(3).max(50),
      password: z.string().min(6),
      name: z.string().optional(),
    })).mutation(async ({ input, ctx }) => {
      const existingEmail = await db.getUserByEmail(input.email);
      if (existingEmail) throw new TRPCError({ code: "CONFLICT", message: "Email already registered" });
      const existingUsername = await db.getUserByUsername(input.username);
      if (existingUsername) throw new TRPCError({ code: "CONFLICT", message: "Username already taken" });
      const passwordHash = await bcrypt.hash(input.password, 12);
      const user = await db.createLocalUser({ email: input.email, username: input.username, passwordHash, name: input.name });
      if (!user) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to create account" });
      // Set session cookie
      const token = await new SignJWT({ sub: user.openId, userId: user.id }).setProtectedHeader({ alg: "HS256" }).setExpirationTime("30d").sign(JWT_SECRET_KEY);
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.cookie(COOKIE_NAME, token, { ...cookieOptions, maxAge: 30 * 24 * 60 * 60 * 1000 });
      return { success: true, user: { id: user.id, name: user.name, email: user.email, username: user.username, role: user.role } };
    }),
    login: publicProcedure.input(z.object({
      emailOrUsername: z.string(),
      password: z.string(),
    })).mutation(async ({ input, ctx }) => {
      let user = await db.getUserByEmail(input.emailOrUsername);
      if (!user) user = await db.getUserByUsername(input.emailOrUsername);
      if (!user || !user.passwordHash) throw new TRPCError({ code: "UNAUTHORIZED", message: "Invalid credentials" });
      const valid = await bcrypt.compare(input.password, user.passwordHash);
      if (!valid) throw new TRPCError({ code: "UNAUTHORIZED", message: "Invalid credentials" });
      const token = await new SignJWT({ sub: user.openId, userId: user.id }).setProtectedHeader({ alg: "HS256" }).setExpirationTime("30d").sign(JWT_SECRET_KEY);
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.cookie(COOKIE_NAME, token, { ...cookieOptions, maxAge: 30 * 24 * 60 * 60 * 1000 });
      await db.upsertUser({ openId: user.openId, lastSignedIn: new Date() });
      return { success: true, user: { id: user.id, name: user.name, email: user.email, username: user.username, role: user.role } };
    }),
    updateProfile: protectedProcedure.input(z.object({
      name: z.string().optional(),
      username: z.string().min(3).max(50).optional(),
      email: z.string().email().optional(),
      phone: z.string().optional(),
      shippingAddress: z.string().optional(),
      savedPaymentInfo: z.string().optional(),
    })).mutation(async ({ input, ctx }) => {
      await db.updateUserProfile(ctx.user.id, input);
      return { success: true };
    }),
  }),

  // ─── Products (public) ──────────────────────────────────────────
  products: router({
    list: publicProcedure.input(z.object({
      category: z.string().optional(),
      search: z.string().optional(),
      limit: z.number().optional(),
      offset: z.number().optional(),
    }).optional()).query(async ({ input }) => {
      const result = await db.getAllProductsWithVariantCount({ activeOnly: true, categorySlug: input?.category, search: input?.search, limit: input?.limit, offset: input?.offset });
      return { ...result, products: result.products.map(preserveManusImage) };
    }),
    featured: publicProcedure.query(async () => {
      const products = await db.getFeaturedProducts();
      return products.map(preserveManusImage);
    }),
    bySlug: publicProcedure.input(z.object({ slug: z.string() })).query(async ({ input }) => {
      const product = await db.getProductBySlug(input.slug);
      if (!product) throw new TRPCError({ code: "NOT_FOUND", message: "Product not found" });
      const cats = await db.getProductCategories(product.id);
      const research = await db.getProductResearch(product.id);
      const citations = await db.getProductCitations(product.id);
      const variants = await db.getProductVariants(product.id);
      return { ...preserveManusImage(product), categories: cats, research, citations, variants };
    }),
    variants: publicProcedure.input(z.object({ productId: z.number() })).query(async ({ input }) => {
      return db.getProductVariants(input.productId);
    }),
  }),

  // ─── Categories (public) ───────────────────────────────────────
  categories: router({
    list: publicProcedure.query(async () => {
      return db.getAllCategories();
    }),
  }),

  // ─── Cart ──────────────────────────────────────────────────────
  cart: router({
    get: protectedProcedure.query(async ({ ctx }) => {
      const items = await db.getCartItems(ctx.user.id);
      const enriched = [];
      for (const item of items) {
        const product = await db.getProductById(item.productId);
        if (product) {
          const giftAmount = isGiftCardProduct(product) ? parseGiftCardAmountFromLabel(item.variantLabel) : null;
          enriched.push({
            ...item,
            product: giftAmount
              ? { ...product, name: `${product.name} ($${giftAmount.toFixed(2)})`, price: giftAmount.toFixed(2) }
              : product,
          });
        }
      }
      return enriched;
    }),
    add: protectedProcedure.input(z.object({ productId: z.number(), quantity: z.number().min(1).default(1), variantId: z.number().optional(), variantLabel: z.string().optional() })).mutation(async ({ input, ctx }) => {
      await db.addToCart(ctx.user.id, input.productId, input.quantity, input.variantId, input.variantLabel);
      return { success: true };
    }),
    update: protectedProcedure.input(z.object({ productId: z.number(), quantity: z.number() })).mutation(async ({ input, ctx }) => {
      await db.updateCartItem(ctx.user.id, input.productId, input.quantity);
      return { success: true };
    }),
    remove: protectedProcedure.input(z.object({ productId: z.number() })).mutation(async ({ input, ctx }) => {
      await db.removeFromCart(ctx.user.id, input.productId);
      return { success: true };
    }),
    clear: protectedProcedure.mutation(async ({ ctx }) => {
      await db.clearCart(ctx.user.id);
      return { success: true };
    }),
  }),

  // ─── Orders (customer) ─────────────────────────────────────────
  orders: router({
    myOrders: protectedProcedure.query(async ({ ctx }) => {
      const orderList = await db.getUserOrders(ctx.user.id);
      return orderList;
    }),
    byNumber: publicProcedure.input(z.object({ orderNumber: z.string() })).query(async ({ input }) => {
      const order = await db.getOrderByNumber(input.orderNumber);
      if (!order) throw new TRPCError({ code: "NOT_FOUND", message: "Order not found" });
      const items = await db.getOrderItems(order.id);
      return { ...order, items };
    }),
    create: publicProcedure.input(z.object({
      userId: z.number().optional(),
      guestEmail: z.string().optional(),
      guestName: z.string().optional(),
      shippingName: z.string(),
      shippingAddress: z.string(),
      shippingCity: z.string(),
      shippingState: z.string(),
      shippingZip: z.string(),
      shippingCountry: z.string().default("US"),
      discountCode: z.string().optional(),
      giftCardCode: z.string().optional(),
      items: z.array(z.object({
        productId: z.number(),
        quantity: z.number().min(1),
        variantId: z.number().optional(),
        variantLabel: z.string().optional(),
      })),
      notes: z.string().optional(),
    })).mutation(async ({ input }) => {
      // Calculate totals
      let subtotal = 0;
      let discountAmount = 0;
      let hasShippableItems = false;
      const orderItems = [];
      for (const item of input.items) {
        const product = await db.getProductById(item.productId);
        if (!product) throw new TRPCError({ code: "NOT_FOUND", message: `Product ${item.productId} not found` });
        if (!product.inStock || product.stockQuantity < item.quantity) throw new TRPCError({ code: "BAD_REQUEST", message: `${product.name} is out of stock` });
        const productIsGiftCard = isGiftCardProduct(product);
        if (!productIsGiftCard) hasShippableItems = true;
        const giftAmount = productIsGiftCard ? parseGiftCardAmountFromLabel(item.variantLabel) : null;
        let unitPrice = giftAmount ?? Number(product.price);
        if (!giftAmount && product.discountActive && product.discountPercent) {
          unitPrice = unitPrice * (1 - Number(product.discountPercent) / 100);
        }
        const totalPrice = unitPrice * item.quantity;
        subtotal += totalPrice;
        const displayName = giftAmount ? `${product.name} ($${giftAmount.toFixed(2)})` : (item.variantLabel ? `${product.name} (${item.variantLabel})` : product.name);
        orderItems.push({ productId: item.productId, productName: displayName, variantId: item.variantId || null, variantLabel: giftAmount ? giftCardVariantLabel(giftAmount) : (item.variantLabel || null), quantity: item.quantity, unitPrice: unitPrice.toFixed(2), totalPrice: totalPrice.toFixed(2) });
      }

      // Apply discount code
      if (input.discountCode) {
        const discount = await db.getDiscountByCode(input.discountCode);
        if (discount && discount.isActive) {
          if (discount.maxUses && discount.currentUses >= discount.maxUses) throw new TRPCError({ code: "BAD_REQUEST", message: "Discount code has been used too many times" });
          if (discount.minOrderAmount && subtotal < Number(discount.minOrderAmount)) throw new TRPCError({ code: "BAD_REQUEST", message: `Minimum order amount of $${discount.minOrderAmount} required` });
          if (discount.type === "percentage") {
            discountAmount = subtotal * (Number(discount.value) / 100);
          } else {
            discountAmount = Number(discount.value);
          }
          await db.incrementDiscountUse(discount.id);
        }
      }

      // Gift cards cannot be used to purchase new gift cards. That prevents value-cycling/replenishment.
      const containsGiftCardPurchase = orderItems.some((item) => String(item.productName || "").toLowerCase().includes("gift card"));
      if (input.giftCardCode && containsGiftCardPurchase) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Gift cards cannot be used to purchase new gift cards." });
      }

      // Shipping: gift-card-only orders are delivered by email and do not need shipping.
      const flatRateShipping = Number(await db.getSetting("flat_rate_shipping") || "9.99");
      const shippingCost = hasShippableItems ? flatRateShipping : 0;

      // Reserve gift card value after discounts + shipping are known. Balance is only depleted after payment is verified.
      let giftCardApplied = 0;
      if (input.giftCardCode) {
        const amountDueBeforeGiftCard = Math.max(0, subtotal - discountAmount + shippingCost);
        const gift = await db.previewGiftCardApplication(input.giftCardCode, amountDueBeforeGiftCard);
        giftCardApplied = gift.applied;
        if (!gift.valid || giftCardApplied <= 0) throw new TRPCError({ code: "BAD_REQUEST", message: gift.message || "Invalid or depleted gift card code" });
        discountAmount += giftCardApplied;
      }

      const total = Math.max(0, subtotal - discountAmount + shippingCost);

      const orderNumber = `RVR-${Date.now().toString(36).toUpperCase()}-${nanoid(4).toUpperCase()}`;
      const orderId = await db.createOrder({
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
        notes: input.notes,
      }, orderItems);

      if (input.giftCardCode && giftCardApplied > 0) {
        await db.reserveGiftCardForOrder(input.giftCardCode, giftCardApplied, orderId);
      }

      if (total <= 0) {
        await db.updateOrder(orderId, { status: "paid", paymentStatus: "gift_card_paid" } as any);
        await db.finalizeGiftCardRedemptionForOrder(orderId);
        await db.issueGiftCardsForOrder(orderId, input.guestEmail || undefined);
      }

      // Clear cart if logged in user
      if (input.userId) await db.clearCart(input.userId);

      return { orderId, orderNumber, total: total.toFixed(2), subtotal: subtotal.toFixed(2), discountAmount: discountAmount.toFixed(2), shippingCost: shippingCost.toFixed(2), giftCardApplied: giftCardApplied.toFixed(2), paid: total <= 0 };
    }),
  }),

  // ─── Discounts (public validate) ───────────────────────────────
  discounts: router({
    validate: publicProcedure.input(z.object({ code: z.string(), subtotal: z.number() })).query(async ({ input }) => {
      const discount = await db.getDiscountByCode(input.code);
      if (!discount || !discount.isActive) return { valid: false, message: "Invalid discount code" };
      if (discount.maxUses && discount.currentUses >= discount.maxUses) return { valid: false, message: "Discount code expired" };
      if (discount.minOrderAmount && input.subtotal < Number(discount.minOrderAmount)) return { valid: false, message: `Minimum order of $${discount.minOrderAmount} required` };
      if (discount.expiresAt && new Date(discount.expiresAt) < new Date()) return { valid: false, message: "Discount code expired" };
      let amount = 0;
      if (discount.type === "percentage") {
        amount = input.subtotal * (Number(discount.value) / 100);
      } else {
        amount = Number(discount.value);
      }
      return { valid: true, type: discount.type, value: Number(discount.value), discountAmount: amount, message: `${discount.type === "percentage" ? `${discount.value}%` : `$${discount.value}`} off applied!` };
    }),
  }),



  // ─── Gift Cards ────────────────────────────────────────────────
  giftCards: router({
    validate: publicProcedure.input(z.object({ code: z.string(), subtotal: z.number() })).query(async ({ input }) => {
      const gift = await db.previewGiftCardApplication(input.code, input.subtotal);
      return {
        valid: gift.valid,
        balance: gift.availableBalance,
        appliedAmount: gift.applied,
        remainingDue: gift.remainingDue,
        message: gift.message,
      };
    }),
  }),

  // ─── Site Settings (public) ────────────────────────────────────
  settings: router({
    public: publicProcedure.query(async () => {
      const SENSITIVE_KEYS = [
        "nowpayments_api_key",
        "nowpayments_ipn_secret",
        "paymentcloud_api_login_id",
        "paymentcloud_transaction_key",
        "paymentcloud_security_key",
        "admin_inbox_email",
      ];
      const all = await db.getAllSettings();
      const map: Record<string, string> = {};
      for (const s of all) {
        if (!SENSITIVE_KEYS.includes(s.settingKey)) {
          map[s.settingKey] = s.settingValue || "";
        }
      }
      return map;
    }),
    // Admin-only: includes sensitive payment keys
    all: adminProcedure.query(async () => {
      const all = await db.getAllSettings();
      const map: Record<string, string> = {};
      for (const s of all) { map[s.settingKey] = s.settingValue || ""; }
      return map;
    }),
  }),

  // ─── Payments ─────────────────────────────────────────────────
  payments: router({
    createInvoice: publicProcedure.input(z.object({
      orderNumber: z.string(),
      email: z.string().optional(),
    })).mutation(async ({ input }) => {
      const order = await db.getOrderByNumber(input.orderNumber);
      if (!order) throw new TRPCError({ code: "NOT_FOUND", message: "Order not found" });
      if (order.status !== "pending") {
        if (order.status === "paid") return { invoiceUrl: `/order/${order.orderNumber}?status=success`, paymentId: "gift_card_paid", invoiceId: "gift_card_paid" };
        throw new TRPCError({ code: "BAD_REQUEST", message: "Order is no longer pending" });
      }
      if (Number(order.total || 0) <= 0) {
        await db.updateOrder(order.id, { status: "paid", paymentStatus: "gift_card_paid" } as any);
        await db.finalizeGiftCardRedemptionForOrder(order.id);
        await db.issueGiftCardsForOrder(order.id, input.email || order.guestEmail || undefined);
        return { invoiceUrl: `/order/${order.orderNumber}?status=success`, paymentId: "gift_card_paid", invoiceId: "gift_card_paid" };
      }
      const result = await createHostedPayment(order.id, order.orderNumber, String(order.total), input.email || order.guestEmail || undefined);
      return result;
    }),
    hostedForm: publicProcedure.input(z.object({ orderNumber: z.string() })).query(async ({ input }) => {
      return getHostedPaymentForm(input.orderNumber);
    }),
    status: publicProcedure.input(z.object({ paymentId: z.string() })).query(async () => {
      return getApiStatus();
    }),
  }),

  // ─── Admin ─────────────────────────────────────────────────────
  admin: router({
    dashboard: adminProcedure.query(async () => {
      return db.getDashboardStats();
    }),

    // Products
    products: router({
      list: adminProcedure.input(z.object({ search: z.string().optional(), limit: z.number().optional(), offset: z.number().optional() }).optional()).query(async ({ input }) => {
        const result = await db.getAllProducts({ search: input?.search, limit: input?.limit, offset: input?.offset });
        const researchMap = await db.getProductResearchSummaryMap();
        const { getMissingResearchFields, isResearchIncomplete } = await import("../shared/researchCompleteness");
        const enrichedProducts = await Promise.all(result.products.map(async (product: any) => {
          const research = researchMap.get(product.id);
          const missingResearchFields = getMissingResearchFields(research);
          return {
            ...preserveManusImage(product),
            variants: await db.getProductVariants(product.id),
            researchMissing: isResearchIncomplete(research, product),
            missingResearchFields,
          };
        }));
        return { ...result, products: enrichedProducts };
      }),
      get: adminProcedure.input(z.object({ id: z.number() })).query(async ({ input }) => {
        const product = await db.getProductById(input.id);
        if (!product) throw new TRPCError({ code: "NOT_FOUND" });
        const cats = await db.getProductCategories(product.id);
        const research = await db.getProductResearch(product.id);
        const citations = await db.getProductCitations(product.id);
        const variants = await db.getProductVariants(product.id);
        return { ...preserveManusImage(product), categories: cats, research, citations, variants };
      }),
      create: adminProcedure.input(z.object({
        name: z.string(), slug: z.string(), description: z.string().optional(), shortDescription: z.string().optional(),
        price: z.string(), compareAtPrice: z.string().nullable().optional(), sku: z.string().optional(), imageUrl: z.string().optional(),
        size: z.string().optional(), contents: z.string().optional(), form: z.string().optional(), purity: z.string().optional(),
        molecularFormula: z.string().optional(), molecularWeight: z.string().optional(), otherNames: z.string().optional(),
        stockQuantity: z.number().optional(), inStock: z.boolean().optional(), isActive: z.boolean().optional(), isFeatured: z.boolean().optional(),
        discountPercent: z.string().optional(), discountActive: z.boolean().optional(),
        coaUrl: z.string().optional(), hplcUrl: z.string().optional(), massSpecUrl: z.string().optional(),
        categoryIds: z.array(z.number()).optional(),
        variants: z.array(productVariantInput).optional(),
        researchDraft: z.object({
          productBrief: z.string().optional(),
          qualityNotes: z.string().optional(),
          overview: z.string().optional(),
          chemicalMakeup: z.string().optional(),
          researchContent: z.string().optional(),
          citations: z.array(z.object({
            title: z.string(),
            authors: z.string().optional(),
            journal: z.string().optional(),
            year: z.string().optional(),
            url: z.string().optional(),
            summary: z.string().optional(),
          })).optional(),
        }).optional(),
      })).mutation(async ({ input }) => {
        const { categoryIds, variants, researchDraft, ...rawData } = input;
        const data = normalizeAdminProductInput(rawData);
        const mappedImage = productAssetForInput(data);
        if (!isNonVialProduct(data)) {
          if (shouldReplaceVialImage(data, data.imageUrl)) data.imageUrl = generatedVialUrlForProduct(data);
        } else if (mappedImage && shouldReplaceGeneratedImage(data.imageUrl)) {
          data.imageUrl = mappedImage;
        }
        const id = await db.createProduct(data as any, categoryIds);
        if (variants?.length) {
          await db.replaceProductVariants(id, variants.map((variant, index) => {
            const cleanVariant = normalizeAdminVariantInput(variant, data.price);
            return {
              label: cleanVariant.label || data.size || data.name,
              price: cleanVariant.price || data.price || "0",
              compareAtPrice: cleanVariant.compareAtPrice || undefined,
              sku: cleanVariant.sku || undefined,
              stockQuantity: cleanVariant.stockQuantity ?? data.stockQuantity ?? 100,
              inStock: cleanVariant.inStock ?? data.inStock ?? true,
              imageUrl: cleanVariant.imageUrl || data.imageUrl,
              sortOrder: cleanVariant.sortOrder ?? index,
            };
          }));
        }
        if (researchDraft) {
          await db.upsertProductResearch(id, {
            productBrief: researchDraft.productBrief || "",
            qualityNotes: researchDraft.qualityNotes || "",
            overview: researchDraft.overview || "",
            chemicalMakeup: researchDraft.chemicalMakeup || "",
            researchContent: researchDraft.researchContent || "",
          });
          const citations = Array.isArray(researchDraft.citations) ? researchDraft.citations.slice(0, 5) : [];
          for (let index = 0; index < citations.length; index++) {
            const citation = citations[index];
            if (!String(citation.title || "").trim()) continue;
            await db.createCitation({
              productId: id,
              citationNumber: index + 1,
              title: citation.title,
              authors: citation.authors || "",
              journal: citation.journal || "NIH/PubMed",
              year: citation.year || "",
              url: citation.url || "",
              summary: citation.summary || "",
            } as any);
          }
        }
        return { id };
      }),
      update: adminProcedure.input(z.object({
        id: z.number(), name: z.string().optional(), slug: z.string().optional(), description: z.string().optional(),
        shortDescription: z.string().optional(), price: z.string().optional(), compareAtPrice: z.string().nullable().optional(),
        sku: z.string().optional(), imageUrl: z.string().optional(), size: z.string().optional(), contents: z.string().optional(),
        form: z.string().optional(), purity: z.string().optional(), molecularFormula: z.string().optional(),
        molecularWeight: z.string().optional(), otherNames: z.string().optional(), stockQuantity: z.number().optional(),
        lowStockThreshold: z.number().optional(), inStock: z.boolean().optional(), isActive: z.boolean().optional(),
        isFeatured: z.boolean().optional(), discountPercent: z.string().optional(), discountActive: z.boolean().optional(),
        coaUrl: z.string().optional(), hplcUrl: z.string().optional(), massSpecUrl: z.string().optional(),
        sortOrder: z.number().optional(), categoryIds: z.array(z.number()).optional(),
        variants: z.array(productVariantInput).optional(),
        researchDraft: z.object({
          productBrief: z.string().optional(),
          qualityNotes: z.string().optional(),
          overview: z.string().optional(),
          chemicalMakeup: z.string().optional(),
          researchContent: z.string().optional(),
          citations: z.array(z.object({
            title: z.string(),
            authors: z.string().optional(),
            journal: z.string().optional(),
            year: z.string().optional(),
            url: z.string().optional(),
            summary: z.string().optional(),
          })).optional(),
        }).optional(),
        regenerateVial: z.boolean().optional(),
      })).mutation(async ({ input }) => {
        const { id, categoryIds, variants, researchDraft, regenerateVial, ...rawData } = input;
        const existingProduct = await db.getProductById(id);
        const data = normalizeAdminProductInput(rawData);
        const incomingImage = String(data.imageUrl || "");
        const existingImage = String(existingProduct?.imageUrl || "");
        const mappedImage = productAssetForInput(data) || productAssetForDisplay({ ...existingProduct, ...data });

        if (regenerateVial) {
          data.imageUrl = !isNonVialProduct(data)
            ? (mappedImage || generatedVialUrlForProduct(data))
            : (mappedImage || data.imageUrl || existingImage);
        } else if (!incomingImage) {
          data.imageUrl = existingImage || mappedImage || "";
        } else if (!isNonVialProduct(data) && shouldReplaceVialImage(data, incomingImage)) {
          // Prevent edit screens from accidentally saving a blank/generated preview over
          // an established product image. Use the product-specific asset when available.
          data.imageUrl = mappedImage || existingImage || generatedVialUrlForProduct(data);
        } else if (mappedImage && shouldReplaceGeneratedImage(incomingImage)) {
          data.imageUrl = mappedImage;
        }
        await db.updateProduct(id, data as any, categoryIds);
        if (variants !== undefined) {
          const product = await db.getProductById(id);
          await db.replaceProductVariants(id, variants.map((variant, index) => {
            const cleanVariant = normalizeAdminVariantInput(variant, String(product?.price || data.price || "0"));
            return {
              label: cleanVariant.label || product?.size || product?.name || `Option ${index + 1}`,
              price: cleanVariant.price || String(product?.price || data.price || "0"),
              compareAtPrice: cleanVariant.compareAtPrice || undefined,
              sku: cleanVariant.sku || undefined,
              stockQuantity: cleanVariant.stockQuantity ?? product?.stockQuantity ?? 100,
              inStock: cleanVariant.inStock ?? product?.inStock ?? true,
              imageUrl: cleanVariant.imageUrl || data.imageUrl || product?.imageUrl || undefined,
              sortOrder: cleanVariant.sortOrder ?? index,
            };
          }));
        }
        if (researchDraft) {
          await db.upsertProductResearch(id, {
            productBrief: researchDraft.productBrief || "",
            qualityNotes: researchDraft.qualityNotes || "",
            overview: researchDraft.overview || "",
            chemicalMakeup: researchDraft.chemicalMakeup || "",
            researchContent: researchDraft.researchContent || "",
          });
          await db.deleteProductCitations(id);
          const citations = Array.isArray(researchDraft.citations) ? researchDraft.citations.slice(0, 5) : [];
          for (let index = 0; index < citations.length; index++) {
            const citation = citations[index];
            if (!String(citation.title || "").trim()) continue;
            await db.createCitation({
              productId: id,
              citationNumber: index + 1,
              title: citation.title,
              authors: citation.authors || "",
              journal: citation.journal || "NIH/PubMed",
              year: citation.year || "",
              url: citation.url || "",
              summary: citation.summary || "",
            } as any);
          }
        }
        return { success: true };
      }),
      delete: adminProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => {
        await db.deleteProduct(input.id);
        return { success: true };
      }),
      generateAllVials: adminProcedure.mutation(async () => {
        const { products: allProducts } = await db.getAllProducts({});
        let generated = 0;
        for (const p of allProducts) {
          try {
            const vialUrl = await generateVialImage(p.name, p.slug);
            await db.updateProduct(p.id, { imageUrl: vialUrl } as any);
            generated++;
          } catch (e) {
            console.error(`Failed to generate vial for ${p.name}:`, e);
          }
        }
        return { success: true, generated, total: allProducts.length };
      }),
      generateHero: adminProcedure.mutation(async () => {
        const { products: allProducts } = await db.getAllProducts({});
        const featured = allProducts.filter((p: any) => p.isFeatured).slice(0, 3);
        const heroProducts = featured.length >= 3 ? featured : allProducts.slice(0, 3);
        const heroUrl = await generateHeroVialsImage(heroProducts.map((p: any) => ({ name: p.name })));
        return { success: true, url: heroUrl };
      }),
    }),

    // Categories
    categories: router({
      list: adminProcedure.query(async () => db.getAllCategories()),
      create: adminProcedure.input(z.object({ name: z.string(), slug: z.string(), description: z.string().optional(), sortOrder: z.number().optional() })).mutation(async ({ input }) => {
        await db.createCategory(input);
        return { success: true };
      }),
      update: adminProcedure.input(z.object({ id: z.number(), name: z.string().optional(), slug: z.string().optional(), description: z.string().optional(), sortOrder: z.number().optional() })).mutation(async ({ input }) => {
        const { id, ...data } = input;
        await db.updateCategory(id, data);
        return { success: true };
      }),
      delete: adminProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => {
        await db.deleteCategory(input.id);
        return { success: true };
      }),
    }),

    // Research
    research: router({
      get: adminProcedure.input(z.object({ productId: z.number() })).query(async ({ input }) => {
        const research = await db.getProductResearch(input.productId);
        const citations = await db.getProductCitations(input.productId);
        return { research, citations };
      }),
      generateDraft: adminProcedure.input(z.object({
        productName: z.string(),
        productBrief: z.string().optional(),
        qualityNotes: z.string().optional(),
        size: z.string().optional(),
        purity: z.string().optional(),
        form: z.string().optional(),
        contents: z.string().optional(),
        sku: z.string().optional(),
        otherNames: z.string().optional(),
        molecularFormula: z.string().optional(),
        molecularWeight: z.string().optional(),
        shortDescription: z.string().optional(),
        sourceChemicalMakeup: z.string().optional(),
        citations: z.array(z.object({
          title: z.string(),
          authors: z.string().optional(),
          journal: z.string().optional(),
          year: z.string().optional(),
          url: z.string().optional(),
          summary: z.string().optional(),
        })).optional(),
      })).mutation(async ({ input }) => {
        const { generateProductCopyDraft } = await import("./productCopy");
        return generateProductCopyDraft(input);
      }),
      searchTemplate: adminProcedure.input(z.object({
        productSlug: z.string(),
        productName: z.string(),
      })).query(async ({ input }) => {
        const { searchResearchTemplates } = await import("./corePeptidesImport");
        return searchResearchTemplates(input.productSlug, input.productName);
      }),
      resolveTemplateSource: adminProcedure.input(z.object({
        sourceUrl: z.string(),
      })).query(async ({ input }) => {
        const { parseResearchTemplateSourceUrl } = await import("../shared/researchTemplateSource");
        const { slugToTitle } = await import("../shared/researchTemplateMatch");
        const templateSlug = parseResearchTemplateSourceUrl(input.sourceUrl);
        if (!templateSlug) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Could not read a product slug from that URL. Use a link that ends with /peptides/product-slug/",
          });
        }
        return { templateSlug, title: slugToTitle(templateSlug) };
      }),
      importTemplate: adminProcedure.input(z.object({
        productSlug: z.string(),
        productName: z.string(),
        templateSlug: z.string().optional(),
        sourceUrl: z.string().optional(),
        size: z.string().optional(),
        purity: z.string().optional(),
        form: z.string().optional(),
        contents: z.string().optional(),
        sku: z.string().optional(),
        otherNames: z.string().optional(),
        molecularFormula: z.string().optional(),
        molecularWeight: z.string().optional(),
      })).mutation(async ({ input }) => {
        const { fetchResearchTemplate } = await import("./corePeptidesImport");
        const { parseResearchTemplateSourceUrl } = await import("../shared/researchTemplateSource");
        const { productSlug, productName, templateSlug, sourceUrl, ...specs } = input;
        const resolvedTemplateSlug =
          templateSlug?.trim() ||
          (sourceUrl ? parseResearchTemplateSourceUrl(sourceUrl) : null);

        if (!resolvedTemplateSlug) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Provide a template slug or a source product URL ending in /peptides/product-slug/",
          });
        }

        const result = await fetchResearchTemplate(
          resolvedTemplateSlug,
          { productName, ...specs },
          productSlug,
          { forceFresh: Boolean(sourceUrl?.trim()) }
        );

        return {
          ...result,
          sourceUrl: sourceUrl?.trim() || null,
          resolvedTemplateSlug,
        };
      }),
      importFromCore: adminProcedure.input(z.object({
        productSlug: z.string(),
        productName: z.string(),
        templateSlug: z.string().optional(),
        size: z.string().optional(),
        purity: z.string().optional(),
        form: z.string().optional(),
        contents: z.string().optional(),
        sku: z.string().optional(),
        otherNames: z.string().optional(),
        molecularFormula: z.string().optional(),
        molecularWeight: z.string().optional(),
      })).mutation(async ({ input }) => {
        const { fetchResearchTemplate, searchResearchTemplates } = await import("./corePeptidesImport");
        const { productSlug, productName, templateSlug, ...specs } = input;
        const search = await searchResearchTemplates(productSlug, productName);
        const resolvedTemplateSlug = templateSlug || search.match?.slug || search.suggestions[0]?.slug;

        if (!resolvedTemplateSlug) {
          throw new Error("No matching research template was found for this product.");
        }

        return fetchResearchTemplate(resolvedTemplateSlug, { productName, ...specs }, productSlug);
      }),
      syncKnowledgeBase: adminProcedure
        .input(z.object({ force: z.boolean().optional() }).optional())
        .mutation(async ({ input }) => {
          const { syncFullKnowledgeBase } = await import("./researchKnowledgeBase");
          return syncFullKnowledgeBase({ force: input?.force });
        }),
      bulkImportReport: adminProcedure.query(async () => {
        const { buildBulkImportReport } = await import("./researchBulkImport");
        const { products: allProducts } = await db.getAllProducts({});
        return buildBulkImportReport(
          allProducts.map((product) => ({
            id: product.id,
            slug: product.slug,
            name: product.name,
            size: product.size,
            purity: product.purity,
            form: product.form,
            contents: product.contents,
            sku: product.sku,
            otherNames: product.otherNames,
            molecularFormula: product.molecularFormula,
            molecularWeight: product.molecularWeight,
          }))
        );
      }),
      importAllFromCore: adminProcedure.mutation(async () => {
        const { runBulkResearchImport } = await import("./researchBulkImport");
        return runBulkResearchImport({ apply: true, syncKnowledgeBase: true });
      }),
      upsert: adminProcedure.input(z.object({
        productId: z.number(),
        productBrief: z.string().optional(),
        qualityNotes: z.string().optional(),
        templateSourceUrl: z.string().optional(),
        overview: z.string().optional(),
        chemicalMakeup: z.string().optional(),
        researchContent: z.string().optional(),
      })).mutation(async ({ input }) => {
        const { productId, ...data } = input;
        await db.upsertProductResearch(productId, data);
        return { success: true };
      }),
      addCitation: adminProcedure.input(z.object({
        productId: z.number(), citationNumber: z.number(), title: z.string(), authors: z.string().optional(),
        journal: z.string().optional(), year: z.string().optional(), url: z.string().optional(), summary: z.string().optional(),
      })).mutation(async ({ input }) => {
        await db.createCitation(input);
        return { success: true };
      }),
      updateCitation: adminProcedure.input(z.object({
        id: z.number(), citationNumber: z.number().optional(), title: z.string().optional(), authors: z.string().optional(),
        journal: z.string().optional(), year: z.string().optional(), url: z.string().optional(), summary: z.string().optional(),
      })).mutation(async ({ input }) => {
        const { id, ...data } = input;
        await db.updateCitation(id, data);
        return { success: true };
      }),
      deleteCitation: adminProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => {
        await db.deleteCitation(input.id);
        return { success: true };
      }),
    }),

    // Orders
    orders: router({
      list: adminProcedure.input(z.object({ status: z.string().optional(), limit: z.number().optional(), offset: z.number().optional() }).optional()).query(async ({ input }) => {
        return db.getAllOrders({ status: input?.status, limit: input?.limit, offset: input?.offset });
      }),
      get: adminProcedure.input(z.object({ id: z.number() })).query(async ({ input }) => {
        const order = await db.getOrderById(input.id);
        if (!order) throw new TRPCError({ code: "NOT_FOUND" });
        const items = await db.getOrderItems(order.id);
        return { ...order, items };
      }),
      updateStatus: adminProcedure.input(z.object({ id: z.number(), status: z.enum(["pending", "paid", "processing", "shipped", "delivered", "cancelled", "refunded"]) })).mutation(async ({ input }) => {
        await db.updateOrder(input.id, { status: input.status });
        return { success: true };
      }),
      updateTracking: adminProcedure.input(z.object({ id: z.number(), trackingNumber: z.string(), trackingCarrier: z.string() })).mutation(async ({ input }) => {
        await db.updateOrderTracking(input.id, input.trackingNumber, input.trackingCarrier);
        return { success: true };
      }),
    }),


    // Gift Cards
    giftCards: router({
      list: adminProcedure.query(async () => db.getAllGiftCards()),
      byCode: adminProcedure.input(z.object({ code: z.string() })).query(async ({ input }) => {
        const card = await db.getGiftCardByCode(input.code);
        if (!card) throw new TRPCError({ code: "NOT_FOUND", message: "Gift card not found" });
        const transactions = await db.getGiftCardTransactions(card.id);
        return { ...card, transactions };
      }),
    }),

    // Discounts
    discounts: router({
      list: adminProcedure.query(async () => db.getAllDiscountCodes()),
      create: adminProcedure.input(z.object({
        code: z.string(), description: z.string().optional(), type: z.enum(["percentage", "fixed"]),
        value: z.string(), minOrderAmount: z.string().optional(), maxUses: z.number().optional(),
        isActive: z.boolean().optional(), appliesToAll: z.boolean().optional(), productId: z.number().optional(),
        expiresAt: z.date().optional(),
      })).mutation(async ({ input }) => {
        await db.createDiscount(input as any);
        return { success: true };
      }),
      update: adminProcedure.input(z.object({
        id: z.number(), code: z.string().optional(), description: z.string().optional(),
        type: z.enum(["percentage", "fixed"]).optional(), value: z.string().optional(),
        minOrderAmount: z.string().optional(), maxUses: z.number().optional(),
        isActive: z.boolean().optional(), appliesToAll: z.boolean().optional(),
        productId: z.number().optional(), expiresAt: z.date().optional(),
      })).mutation(async ({ input }) => {
        const { id, ...data } = input;
        await db.updateDiscount(id, data as any);
        return { success: true };
      }),
      delete: adminProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => {
        await db.deleteDiscount(input.id);
        return { success: true };
      }),
    }),

    // Site Settings
    settings: router({
      list: adminProcedure.query(async () => db.getAllSettings()),
      update: adminProcedure.input(z.object({ key: z.string(), value: z.string() })).mutation(async ({ input }) => {
        await db.updateSetting(input.key, input.value);
        return { success: true };
      }),
      bulkUpdate: adminProcedure.input(z.array(z.object({ key: z.string(), value: z.string() }))).mutation(async ({ input }) => {
        for (const { key, value } of input) {
          await db.updateSetting(key, value);
        }
        return { success: true };
      }),
    }),

    // Users / database-backed roles
    users: router({
      list: adminProcedure.query(async () => db.getAllUsers()),
      admins: adminProcedure.query(async () => db.getAdminUsers()),
      updateRole: superAdminProcedure.input(z.object({
        id: z.number(),
        role: z.enum(["user", "admin", "super_admin"]),
      })).mutation(async ({ input, ctx }) => {
        if (input.id === ctx.user.id && input.role !== "super_admin") {
          throw new TRPCError({ code: "BAD_REQUEST", message: "You cannot remove your own super admin role." });
        }

        const target = await db.getUserById(input.id);
        if (!target) throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });

        const updated = await db.updateUserRole(input.id, input.role);
        return { success: true, user: updated };
      }),
    }),

    // PaymentCloud gateway status check
    paymentStatus: adminProcedure.query(async () => {
      return getApiStatus();
    }),
  }),
});

export type AppRouter = typeof appRouter;
