import bcrypt from "bcryptjs";
import { randomBytes } from "crypto";

export const PASSWORD_RULES_MSG =
  "8 caractères min., 1 majuscule, 1 minuscule, 1 chiffre, 1 caractère spécial";

const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;

export function isStrongPassword(password: string): boolean {
  return PASSWORD_REGEX.test(password);
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function generateTemporaryPassword(length = 12): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%";
  const bytes = randomBytes(length);
  let out = "";
  for (let i = 0; i < length; i++) out += chars[bytes[i]! % chars.length];
  if (!isStrongPassword(out)) return generateTemporaryPassword(length);
  return out;
}
