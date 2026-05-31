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
import { createPayment, getPaymentStatus, getApiStatus } from "./nowpayments";
import { generateVialImage, generateHeroVialsImage, generateVialBuffer, generateHeroVialsBuffer } from "./vialGenerator";

const JWT_SECRET_KEY = new TextEncoder().encode(process.env.JWT_SECRET || "fallback-secret-key");

// Admin middleware
const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
  return next({ ctx });
});

const productVariantInput = z.object({
  id: z.number().optional(),
  label: z.string().optional(),
  price: z.string().optional(),
  compareAtPrice: z.string().optional(),
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
      return db.getAllProductsWithVariantCount({ activeOnly: true, categorySlug: input?.category, search: input?.search, limit: input?.limit, offset: input?.offset });
    }),
    featured: publicProcedure.query(async () => {
      return db.getFeaturedProducts();
    }),
    bySlug: publicProcedure.input(z.object({ slug: z.string() })).query(async ({ input }) => {
      const product = await db.getProductBySlug(input.slug);
      if (!product) throw new TRPCError({ code: "NOT_FOUND", message: "Product not found" });
      const cats = await db.getProductCategories(product.id);
      const research = await db.getProductResearch(product.id);
      const citations = await db.getProductCitations(product.id);
      const variants = await db.getProductVariants(product.id);
      return { ...product, categories: cats, research, citations, variants };
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
          enriched.push({ ...item, product });
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
      const orderItems = [];
      for (const item of input.items) {
        const product = await db.getProductById(item.productId);
        if (!product) throw new TRPCError({ code: "NOT_FOUND", message: `Product ${item.productId} not found` });
        if (!product.inStock || product.stockQuantity < item.quantity) throw new TRPCError({ code: "BAD_REQUEST", message: `${product.name} is out of stock` });
        let unitPrice = Number(product.price);
        if (product.discountActive && product.discountPercent) {
          unitPrice = unitPrice * (1 - Number(product.discountPercent) / 100);
        }
        const totalPrice = unitPrice * item.quantity;
        subtotal += totalPrice;
        const displayName = item.variantLabel ? `${product.name} (${item.variantLabel})` : product.name;
        orderItems.push({ productId: item.productId, productName: displayName, variantId: item.variantId || null, variantLabel: item.variantLabel || null, quantity: item.quantity, unitPrice: unitPrice.toFixed(2), totalPrice: totalPrice.toFixed(2) });
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

      // Shipping
      const freeShippingThreshold = Number(await db.getSetting("free_shipping_threshold") || "200");
      const flatRateShipping = Number(await db.getSetting("flat_rate_shipping") || "9.99");
      const shippingCost = (subtotal - discountAmount) >= freeShippingThreshold ? 0 : flatRateShipping;
      const total = subtotal - discountAmount + shippingCost;

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
        notes: input.notes,
      }, orderItems);

      // Clear cart if logged in user
      if (input.userId) await db.clearCart(input.userId);

      return { orderId, orderNumber, total: total.toFixed(2), subtotal: subtotal.toFixed(2), discountAmount: discountAmount.toFixed(2), shippingCost: shippingCost.toFixed(2) };
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

  // ─── Site Settings (public) ────────────────────────────────────
  settings: router({
    public: publicProcedure.query(async () => {
      const SENSITIVE_KEYS = ["nowpayments_api_key", "nowpayments_ipn_secret"];
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
      if (order.status !== "pending") throw new TRPCError({ code: "BAD_REQUEST", message: "Order is no longer pending" });
      const result = await createPayment(order.id, order.orderNumber, String(order.total), input.email || order.guestEmail || undefined);
      return result;
    }),
    status: publicProcedure.input(z.object({ paymentId: z.string() })).query(async ({ input }) => {
      const status = await getPaymentStatus(input.paymentId);
      return status;
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
        const enrichedProducts = await Promise.all(result.products.map(async (product: any) => ({
          ...product,
          variants: await db.getProductVariants(product.id),
        })));
        return { ...result, products: enrichedProducts };
      }),
      get: adminProcedure.input(z.object({ id: z.number() })).query(async ({ input }) => {
        const product = await db.getProductById(input.id);
        if (!product) throw new TRPCError({ code: "NOT_FOUND" });
        const cats = await db.getProductCategories(product.id);
        const research = await db.getProductResearch(product.id);
        const citations = await db.getProductCitations(product.id);
        const variants = await db.getProductVariants(product.id);
        return { ...product, categories: cats, research, citations, variants };
      }),
      create: adminProcedure.input(z.object({
        name: z.string(), slug: z.string(), description: z.string().optional(), shortDescription: z.string().optional(),
        price: z.string(), compareAtPrice: z.string().optional(), sku: z.string().optional(), imageUrl: z.string().optional(),
        size: z.string().optional(), contents: z.string().optional(), form: z.string().optional(), purity: z.string().optional(),
        molecularFormula: z.string().optional(), molecularWeight: z.string().optional(), otherNames: z.string().optional(),
        stockQuantity: z.number().optional(), inStock: z.boolean().optional(), isActive: z.boolean().optional(), isFeatured: z.boolean().optional(),
        discountPercent: z.string().optional(), discountActive: z.boolean().optional(),
        coaUrl: z.string().optional(), hplcUrl: z.string().optional(), massSpecUrl: z.string().optional(),
        categoryIds: z.array(z.number()).optional(),
        variants: z.array(productVariantInput).optional(),
      })).mutation(async ({ input }) => {
        const { categoryIds, variants, ...data } = input;
        if (!data.imageUrl) {
          data.imageUrl = `/api/vial/${data.slug}.png`;
        }
        const id = await db.createProduct(data as any, categoryIds);
        if (variants?.length) {
          await db.replaceProductVariants(id, variants.map((variant, index) => ({
            label: variant.label || data.size || data.name,
            price: variant.price || data.price,
            compareAtPrice: variant.compareAtPrice || undefined,
            sku: variant.sku || undefined,
            stockQuantity: variant.stockQuantity ?? data.stockQuantity ?? 100,
            inStock: variant.inStock ?? data.inStock ?? true,
            imageUrl: variant.imageUrl || data.imageUrl,
            sortOrder: variant.sortOrder ?? index,
          })));
        }
        return { id };
      }),
      update: adminProcedure.input(z.object({
        id: z.number(), name: z.string().optional(), slug: z.string().optional(), description: z.string().optional(),
        shortDescription: z.string().optional(), price: z.string().optional(), compareAtPrice: z.string().optional(),
        sku: z.string().optional(), imageUrl: z.string().optional(), size: z.string().optional(), contents: z.string().optional(),
        form: z.string().optional(), purity: z.string().optional(), molecularFormula: z.string().optional(),
        molecularWeight: z.string().optional(), otherNames: z.string().optional(), stockQuantity: z.number().optional(),
        lowStockThreshold: z.number().optional(), inStock: z.boolean().optional(), isActive: z.boolean().optional(),
        isFeatured: z.boolean().optional(), discountPercent: z.string().optional(), discountActive: z.boolean().optional(),
        coaUrl: z.string().optional(), hplcUrl: z.string().optional(), massSpecUrl: z.string().optional(),
        sortOrder: z.number().optional(), categoryIds: z.array(z.number()).optional(),
        variants: z.array(productVariantInput).optional(),
        regenerateVial: z.boolean().optional(),
      })).mutation(async ({ input }) => {
        const { id, categoryIds, variants, regenerateVial, ...data } = input;
        if ((regenerateVial || !data.imageUrl) && (data.slug || data.name)) {
          const slug = data.slug || data.name!.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
          data.imageUrl = `/api/vial/${slug}.png`;
        }
        await db.updateProduct(id, data as any, categoryIds);
        if (variants !== undefined) {
          const product = await db.getProductById(id);
          await db.replaceProductVariants(id, variants.map((variant, index) => ({
            label: variant.label || product?.size || product?.name || `Option ${index + 1}`,
            price: variant.price || String(product?.price || data.price || "0"),
            compareAtPrice: variant.compareAtPrice || undefined,
            sku: variant.sku || undefined,
            stockQuantity: variant.stockQuantity ?? product?.stockQuantity ?? 100,
            inStock: variant.inStock ?? product?.inStock ?? true,
            imageUrl: variant.imageUrl || data.imageUrl || product?.imageUrl || undefined,
            sortOrder: variant.sortOrder ?? index,
          })));
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
      upsert: adminProcedure.input(z.object({
        productId: z.number(), overview: z.string().optional(), chemicalMakeup: z.string().optional(), researchContent: z.string().optional(),
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

    // Users
    users: router({
      list: adminProcedure.query(async () => db.getAllUsers()),
    }),

    // NowPayments status check
    paymentStatus: adminProcedure.query(async () => {
      return getApiStatus();
    }),
  }),
});

export type AppRouter = typeof appRouter;
