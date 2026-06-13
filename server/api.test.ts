import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import { COOKIE_NAME } from "../shared/const";
import type { TrpcContext } from "./_core/context";

// ─── Test Helpers ─────────────────────────────────────────────────────

type CookieCall = { name: string; value?: string; options: Record<string, unknown> };

function createPublicContext(): { ctx: TrpcContext; setCookies: CookieCall[]; clearedCookies: CookieCall[] } {
  const setCookies: CookieCall[] = [];
  const clearedCookies: CookieCall[] = [];

  const ctx: TrpcContext = {
    user: null,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      cookie: (name: string, value: string, options: Record<string, unknown>) => {
        setCookies.push({ name, value, options });
      },
      clearCookie: (name: string, options: Record<string, unknown>) => {
        clearedCookies.push({ name, options });
      },
    } as TrpcContext["res"],
  };

  return { ctx, setCookies, clearedCookies };
}

function createAuthContext(role: "user" | "admin" = "user"): { ctx: TrpcContext; setCookies: CookieCall[]; clearedCookies: CookieCall[] } {
  const setCookies: CookieCall[] = [];
  const clearedCookies: CookieCall[] = [];

  const user = {
    id: 1,
    openId: "local_test-user",
    email: "test@example.com",
    name: "Test User",
    username: "testuser",
    passwordHash: "$2a$12$dummy",
    loginMethod: "local",
    role,
    phone: null,
    shippingAddress: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  const ctx: TrpcContext = {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      cookie: (name: string, value: string, options: Record<string, unknown>) => {
        setCookies.push({ name, value, options });
      },
      clearCookie: (name: string, options: Record<string, unknown>) => {
        clearedCookies.push({ name, options });
      },
    } as TrpcContext["res"],
  };

  return { ctx, setCookies, clearedCookies };
}

// ─── Auth Tests ───────────────────────────────────────────────────────

describe("auth.me", () => {
  it("returns null for unauthenticated users", async () => {
    const { ctx } = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.auth.me();
    expect(result).toBeNull();
  });

  it("returns user data for authenticated users", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.auth.me();
    expect(result).toBeDefined();
    expect(result?.email).toBe("test@example.com");
    expect(result?.role).toBe("user");
  });
});

describe("auth.logout", () => {
  it("clears the session cookie and reports success", async () => {
    const { ctx, clearedCookies } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.auth.logout();
    expect(result).toEqual({ success: true });
    expect(clearedCookies).toHaveLength(1);
    expect(clearedCookies[0]?.name).toBe(COOKIE_NAME);
    expect(clearedCookies[0]?.options).toMatchObject({ maxAge: -1 });
  });
});

// ─── Public Products Tests ────────────────────────────────────────────

describe("products.list", () => {
  it("returns products with total count", async () => {
    const { ctx } = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.products.list();
    expect(result).toHaveProperty("products");
    expect(result).toHaveProperty("total");
    expect(Array.isArray(result.products)).toBe(true);
    expect(typeof result.total).toBe("number");
  });

  it("supports search parameter", async () => {
    const { ctx } = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.products.list({ search: "BPC" });
    expect(result).toHaveProperty("products");
    for (const p of result.products) {
      expect(p.name.toLowerCase()).toContain("bpc");
    }
  });

  it("supports limit parameter", async () => {
    const { ctx } = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.products.list({ limit: 5 });
    expect(result.products.length).toBeLessThanOrEqual(5);
  });
});

describe("products.featured", () => {
  it("returns an array of featured products", async () => {
    const { ctx } = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.products.featured();
    expect(Array.isArray(result)).toBe(true);
    for (const p of result) {
      expect(p.isFeatured).toBe(true);
    }
  });
});

describe("products.bySlug", () => {
  it("returns a product by slug", async () => {
    const { ctx } = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.products.bySlug({ slug: "bpc-157-5mg" });
    expect(result).toBeDefined();
    expect(result?.slug).toBe("bpc-157-5mg");
    expect(result?.name).toContain("BPC-157");
  });

  it("throws NOT_FOUND for non-existent slug", async () => {
    const { ctx } = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    await expect(caller.products.bySlug({ slug: "non-existent-product-xyz" })).rejects.toThrow();
  });
});

// ─── Categories Tests ─────────────────────────────────────────────────

describe("categories.list", () => {
  it("returns an array of categories", async () => {
    const { ctx } = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.categories.list();
    expect(Array.isArray(result)).toBe(true);
    if (result.length > 0) {
      expect(result[0]).toHaveProperty("name");
      expect(result[0]).toHaveProperty("slug");
    }
  });
});

// ─── Settings Tests ───────────────────────────────────────────────────

describe("settings.public", () => {
  it("returns public settings as a map without sensitive keys", async () => {
    const { ctx } = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.settings.public();
    expect(typeof result).toBe("object");
    // Should not contain sensitive payment credentials
    expect(result).not.toHaveProperty("nowpayments_api_key");
    expect(result).not.toHaveProperty("nowpayments_ipn_secret");
    expect(result).not.toHaveProperty("paymentcloud_api_login_id");
    expect(result).not.toHaveProperty("paymentcloud_transaction_key");
    expect(result).not.toHaveProperty("paymentcloud_security_key");
  });
});

// ─── Admin Access Control Tests ───────────────────────────────────────

describe("admin access control", () => {
  it("rejects non-admin users from admin.dashboard", async () => {
    const { ctx } = createAuthContext("user");
    const caller = appRouter.createCaller(ctx);
    await expect(caller.admin.dashboard()).rejects.toThrow();
  });

  it("allows admin users to access admin.dashboard", async () => {
    const { ctx } = createAuthContext("admin");
    const caller = appRouter.createCaller(ctx);
    const result = await caller.admin.dashboard();
    expect(result).toHaveProperty("totalOrders");
    expect(result).toHaveProperty("totalRevenue");
    expect(result).toHaveProperty("totalProducts");
    expect(result).toHaveProperty("totalUsers");
  });

  it("rejects non-admin users from admin.products.list", async () => {
    const { ctx } = createAuthContext("user");
    const caller = appRouter.createCaller(ctx);
    await expect(caller.admin.products.list()).rejects.toThrow();
  });

  it("allows admin to list all products", async () => {
    const { ctx } = createAuthContext("admin");
    const caller = appRouter.createCaller(ctx);
    const result = await caller.admin.products.list();
    expect(result).toHaveProperty("products");
    expect(result).toHaveProperty("total");
    expect(result.total).toBeGreaterThan(0);
  });
});

// ─── Admin Orders Tests ───────────────────────────────────────────────

describe("admin.orders", () => {
  it("allows admin to list orders", async () => {
    const { ctx } = createAuthContext("admin");
    const caller = appRouter.createCaller(ctx);
    const result = await caller.admin.orders.list();
    expect(result).toHaveProperty("orders");
    expect(result).toHaveProperty("total");
    expect(Array.isArray(result.orders)).toBe(true);
  });
});

// ─── Admin Discounts Tests ────────────────────────────────────────────

describe("admin.discounts", () => {
  it("allows admin to list discounts", async () => {
    const { ctx } = createAuthContext("admin");
    const caller = appRouter.createCaller(ctx);
    const result = await caller.admin.discounts.list();
    expect(Array.isArray(result)).toBe(true);
  });
});

// ─── Cart Tests ───────────────────────────────────────────────────────

describe("cart operations", () => {
  it("returns cart items array for authenticated user", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.cart.get();
    expect(Array.isArray(result)).toBe(true);
  });
});
