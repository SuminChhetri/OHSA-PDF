/**
 * Field-level encryption for sensitive Case PII.
 *
 * Algorithm: AES-256-GCM
 * Key:        FIELD_ENCRYPTION_KEY env var — 64-char hex string (32 bytes).
 *             If not set, fields are stored plaintext (dev/demo mode).
 *
 * Ciphertext format (all hex, colon-separated): enc:<iv>:<authTag>:<ciphertext>
 * The "enc:" prefix lets decrypt() detect and skip already-plain values.
 *
 * Customer-managed key: the operator sets FIELD_ENCRYPTION_KEY and it never
 * leaves their environment. Backend operators who only have DB access see
 * opaque hex blobs, not plaintext PII.
 */

import crypto from "crypto";

const KEY_HEX = process.env.FIELD_ENCRYPTION_KEY ?? "";
const ENCRYPTION_ENABLED = KEY_HEX.length === 64;

function getKey(): Buffer {
  if (!ENCRYPTION_ENABLED) throw new Error("FIELD_ENCRYPTION_KEY not set");
  return Buffer.from(KEY_HEX, "hex");
}

export function encryptField(plaintext: string | null | undefined): string | null {
  if (plaintext == null) return null;
  if (!ENCRYPTION_ENABLED) return plaintext;

  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", getKey(), iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();

  return `enc:${iv.toString("hex")}:${tag.toString("hex")}:${encrypted.toString("hex")}`;
}

export function decryptField(value: string | null | undefined): string | null {
  if (value == null) return null;
  if (!value.startsWith("enc:")) return value; // plaintext passthrough

  const parts = value.split(":");
  if (parts.length !== 4) return value;

  const [, ivHex, tagHex, ctHex] = parts;
  try {
    const decipher = crypto.createDecipheriv("aes-256-gcm", getKey(), Buffer.from(ivHex, "hex"));
    decipher.setAuthTag(Buffer.from(tagHex, "hex"));
    return decipher.update(Buffer.from(ctHex, "hex")).toString("utf8") + decipher.final("utf8");
  } catch {
    return "[DECRYPTION ERROR]";
  }
}

/** Encrypt all sensitive fields of a raw Case input object. */
export function encryptCaseFields<T extends Record<string, unknown>>(data: T): T {
  if (!ENCRYPTION_ENABLED) return data;
  const out = { ...data };
  for (const field of SENSITIVE_CASE_FIELDS) {
    if (field in out && typeof out[field] === "string") {
      (out as Record<string, unknown>)[field] = encryptField(out[field] as string);
    }
  }
  return out;
}

/** Decrypt all sensitive fields of a Case row read from DB. */
export function decryptCaseFields<T extends Record<string, unknown>>(row: T): T {
  const out = { ...row };
  for (const field of SENSITIVE_CASE_FIELDS) {
    if (field in out && typeof out[field] === "string") {
      (out as Record<string, unknown>)[field] = decryptField(out[field] as string);
    }
  }
  return out;
}

export const SENSITIVE_CASE_FIELDS = [
  "employeeName",
  "employeeStreet",
  "employeeCity",
  "employeeState",
  "employeeZip",
  "physicianName",
  "facilityName",
  "facilityStreet",
  "facilityCity",
  "facilityState",
  "facilityZip",
  "whatHappened",
  "whatEmployeeWasDoing",
  "bodyPartAffected",
  "objectOrSubstance",
  "timeOfInjury",
] as const;

export const isEncryptionEnabled = ENCRYPTION_ENABLED;
