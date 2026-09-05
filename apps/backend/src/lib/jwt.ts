import jwt from "jsonwebtoken";
import type { AuthUser } from "../types/express";

const JWT_SECRET = process.env.JWT_SECRET || "peoplepay360_super_secret_jwt_key_2026";
const JWT_EXPIRES_IN = "7d";

export function signJwt(payload: AuthUser): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

export function verifyJwt(token: string): AuthUser | null {
  try {
    return jwt.verify(token, JWT_SECRET) as AuthUser;
  } catch {
    return null;
  }
}
