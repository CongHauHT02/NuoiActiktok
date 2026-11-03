import crypto from "crypto";

const ALGORITHM = "aes-256-gcm";
const DEFAULT_KEY = "0123456789abcdef0123456789abcdef"; // 32 bytes

function getKey(): Buffer {
  const secret = process.env.ENCRYPTION_KEY || DEFAULT_KEY;
  return crypto.scryptSync(secret, "tiktok-salt-2026", 32);
}

/**
 * Encrypt a plaintext string using AES-256-GCM
 */
export function encrypt(text: string): string {
  if (!text) return "";
  try {
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv(ALGORITHM, getKey(), iv);
    let encrypted = cipher.update(text, "utf8", "hex");
    encrypted += cipher.final("hex");
    const authTag = cipher.getAuthTag().toString("hex");
    return `${iv.toString("hex")}:${authTag}:${encrypted}`;
  } catch (err) {
    console.error("Encryption error:", err);
    return text;
  }
}

/**
 * Decrypt a ciphertext string using AES-256-GCM
 */
export function decrypt(encryptedText: string): string {
  if (!encryptedText) return "";
  try {
    const parts = encryptedText.split(":");
    if (parts.length !== 3) return encryptedText; // not encrypted format
    const [ivHex, authTagHex, cipherText] = parts;
    const decipher = crypto.createDecipheriv(
      ALGORITHM,
      getKey(),
      Buffer.from(ivHex, "hex")
    );
    decipher.setAuthTag(Buffer.from(authTagHex, "hex"));
    let decrypted = decipher.update(cipherText, "hex", "utf8");
    decrypted += decipher.final("utf8");
    return decrypted;
  } catch (err) {
    console.error("Decryption error:", err);
    return "••••••••";
  }
}

/**
 * Mask a secret string for UI presentation (e.g. `pass1234` -> `••••••••`)
 */
export function maskSecret(secret?: string | null): string {
  if (!secret) return "";
  return "••••••••";
}

