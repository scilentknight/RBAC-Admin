import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

if (!process.env.JWT_SECRET && process.env.NODE_ENV === "production") {
  throw new Error("FATAL: JWT_SECRET environment variable is not set. The application cannot start without it.");
}

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET ?? "super-secret-jwt-key-for-rbac-admin-system-2026-dev-only"
);

export const AUTH_COOKIE_NAME = "rbac_auth_token";

/**
 * Hash plain text password
 */
export async function hashPassword(plainPassword) {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(plainPassword, salt);
}

/**
 * Compare plain password with hashed password
 */
export async function verifyPassword(plainPassword, hashedPassword) {
  return bcrypt.compare(plainPassword, hashedPassword);
}

/**
 * Create a signed JWT session token
 */
export async function createSessionToken(payload) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(JWT_SECRET);
}

/**
 * Verify JWT session token
 */
export async function verifySessionToken(token) {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload;
  } catch (err) {
    return null;
  }
}

/**
 * Get session payload from Next.js cookies or Authorization header
 */
export async function getSessionUser(req) {
  let token = null;

  // Check Authorization Bearer header if req is provided
  if (req && typeof req.headers?.get === "function") {
    const authHeader = req.headers.get("authorization");
    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.substring(7);
    }
  }

  // Check Next.js cookies if not found in header
  if (!token) {
    try {
      const cookieStore = await cookies();
      const cookie = cookieStore.get(AUTH_COOKIE_NAME);
      if (cookie) {
        token = cookie.value;
      }
    } catch (e) {
      // In non-Server-Action context or direct req inspection
      if (req && req.cookies && typeof req.cookies.get === "function") {
        const cookie = req.cookies.get(AUTH_COOKIE_NAME);
        if (cookie) token = cookie.value;
      }
    }
  }

  if (!token) return null;
  return verifySessionToken(token);
}
