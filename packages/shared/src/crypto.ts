import { randomBytes, createCipheriv, createDecipheriv, createHash } from "node:crypto";

const ALGORITHM = "aes-256-gcm";
export const ENCRYPTION_KEY_VERSION = "v1";

export interface EncryptedPayload {
  version: string;
  iv: string;
  authTag: string;
  ciphertext: string;
}

/** Derives a 32-byte AES-256 key from an arbitrary-length secret. Shared so the API and worker
 * processes encrypt/decrypt account secrets identically without duplicating the crypto logic. */
export function deriveEncryptionKey(secret: string): Buffer {
  return createHash("sha256").update(secret).digest();
}

export function encryptSecret(plaintext: string, key: Buffer): EncryptedPayload {
  const iv = randomBytes(12);
  const cipher = createCipheriv(ALGORITHM, key, iv);
  const ciphertext = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();

  return {
    version: ENCRYPTION_KEY_VERSION,
    iv: iv.toString("base64"),
    authTag: authTag.toString("base64"),
    ciphertext: ciphertext.toString("base64")
  };
}

export function decryptSecret(payload: EncryptedPayload, key: Buffer): string {
  const decipher = createDecipheriv(ALGORITHM, key, Buffer.from(payload.iv, "base64"));
  decipher.setAuthTag(Buffer.from(payload.authTag, "base64"));
  const plaintext = Buffer.concat([
    decipher.update(Buffer.from(payload.ciphertext, "base64")),
    decipher.final()
  ]);
  return plaintext.toString("utf8");
}

export function encryptSecretToString(plaintext: string, key: Buffer): string {
  return JSON.stringify(encryptSecret(plaintext, key));
}

export function decryptSecretFromString(serialized: string, key: Buffer): string {
  return decryptSecret(JSON.parse(serialized) as EncryptedPayload, key);
}
