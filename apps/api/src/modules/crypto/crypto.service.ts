import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import {
  decryptSecretFromString,
  deriveEncryptionKey,
  encryptSecretToString,
  ENCRYPTION_KEY_VERSION
} from "@p2phunt/shared";

@Injectable()
export class CryptoService {
  private readonly key: Buffer;

  constructor(config: ConfigService) {
    const secret = config.get<string>("ENCRYPTION_KEY", "change-me-32-byte-minimum-development-key");
    this.key = deriveEncryptionKey(secret);
  }

  get keyVersion(): string {
    return ENCRYPTION_KEY_VERSION;
  }

  encryptToString(plaintext: string): string {
    return encryptSecretToString(plaintext, this.key);
  }

  decryptFromString(serialized: string): string {
    return decryptSecretFromString(serialized, this.key);
  }

  mask(value: string, visible = 4): string {
    if (value.length <= visible) return "*".repeat(value.length);
    return `${"*".repeat(value.length - visible)}${value.slice(-visible)}`;
  }
}
