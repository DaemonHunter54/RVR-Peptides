import { COOKIE_NAME } from "@shared/const";
import { ForbiddenError } from "@shared/_core/errors";
import { parse as parseCookieHeader } from "cookie";
import type { Request } from "express";
import { jwtVerify } from "jose";
import type { User } from "../../drizzle/schema";
import * as db from "../db";

/**
 * Local Railway authentication only.
 *
 * Requests are authenticated with the
 * JWT created by the local email/password login and register mutations.
 */
class LocalAuthServer {
  private parseCookies(cookieHeader: string | undefined) {
    if (!cookieHeader) return new Map<string, string>();
    const parsed = parseCookieHeader(cookieHeader);
    return new Map(Object.entries(parsed));
  }

  private getJwtSecret() {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new Error("JWT_SECRET is required for authentication");
    }
    return new TextEncoder().encode(secret);
  }

  async authenticateRequest(req: Request): Promise<AuthenticatedUser> {
    const cookies = this.parseCookies(req.headers.cookie);
    const sessionCookie = cookies.get(COOKIE_NAME);

    if (!sessionCookie) {
      throw ForbiddenError("Missing session cookie");
    }

    try {
      const { payload } = await jwtVerify(sessionCookie, this.getJwtSecret(), {
        algorithms: ["HS256"],
      });

      const openId = payload.sub;
      if (!openId || typeof openId !== "string") {
        throw ForbiddenError("Invalid session payload");
      }

      const user = await db.getUserByOpenId(openId);
      if (!user) {
        throw ForbiddenError("User not found");
      }

      await db.upsertUser({ openId: user.openId, lastSignedIn: new Date() });
      return user;
    } catch (error) {
      if (error instanceof Error && error.message.includes("JWT_SECRET")) {
        throw error;
      }
      throw ForbiddenError("Invalid session cookie");
    }
  }
}

export type AuthenticatedUser = User & {
  taskUid?: string;
  isCron?: boolean;
};

export const sdk = new LocalAuthServer();
