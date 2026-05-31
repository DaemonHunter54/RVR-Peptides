import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import type { User } from "../../drizzle/schema";
import { COOKIE_NAME } from "@shared/const";
import { parse as parseCookieHeader } from "cookie";
import { jwtVerify } from "jose";
import * as db from "../db";

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: User | null;
};

export async function createContext(
  opts: CreateExpressContextOptions
): Promise<TrpcContext> {
  let user: User | null = null;

  try {
    const cookies = parseCookieHeader(opts.req.headers.cookie || "");
    const token = cookies[COOKIE_NAME];

    if (token) {
      const secret = new TextEncoder().encode(process.env.JWT_SECRET || "fallback-secret-key");
      const { payload } = await jwtVerify(token, secret, { algorithms: ["HS256"] });

      const userId = typeof payload.userId === "number" ? payload.userId : undefined;
      const openId = typeof payload.sub === "string" ? payload.sub : undefined;

      if (userId) {
        user = (await db.getUserById(userId)) ?? null;
      }
      if (!user && openId) {
        user = (await db.getUserByOpenId(openId)) ?? null;
      }
    }
  } catch {
    user = null;
  }

  return {
    req: opts.req,
    res: opts.res,
    user,
  };
}
