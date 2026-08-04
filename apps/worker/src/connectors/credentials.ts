import { decryptSecretFromString, deriveEncryptionKey } from "@p2phunt/shared";
import { prisma } from "../prisma/client.js";

const encryptionKey = deriveEncryptionKey(process.env.ENCRYPTION_KEY ?? "change-me-32-byte-minimum-development-key");

/** Loads and decrypts the most recent active secret for an account, if any, for use as
 * ConnectorContext.credentials. Real connectors (Binance/Bybit) read `apiKey`/`apiSecret` off
 * this object; the mock connector optionally reads `simulateFailures`. */
export async function loadAccountCredentials(accountId: string): Promise<Record<string, unknown> | undefined> {
  const secret = await prisma.accountSecret.findFirst({
    where: { accountId, status: "active" },
    orderBy: { createdAt: "desc" }
  });

  if (!secret) return undefined;

  try {
    const decrypted = decryptSecretFromString(secret.encryptedPayload, encryptionKey);
    return JSON.parse(decrypted) as Record<string, unknown>;
  } catch {
    return undefined;
  }
}
