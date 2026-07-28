import { Injectable, Logger } from '@nestjs/common';
import * as crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const TAG_LENGTH = 16;

@Injectable()
export class EncryptionService {
  private readonly logger = new Logger(EncryptionService.name);
  private readonly key: Buffer;

  constructor() {
    const keyStr = process.env.ENCRYPTION_KEY;
    if (!keyStr) {
      throw new Error('ENCRYPTION_KEY environment variable is required');
    }
    this.key = Buffer.from(keyStr.padEnd(32).slice(0, 32));
  }

  encrypt(text: string): { encrypted: string; iv: string; tag: string } {
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, this.key, iv);

    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const tag = cipher.getAuthTag().toString('hex');

    return {
      encrypted,
      iv: iv.toString('hex'),
      tag,
    };
  }

  decrypt(encrypted: string, iv: string, tag: string): string {
    const decipher = crypto.createDecipheriv(
      ALGORITHM,
      this.key,
      Buffer.from(iv, 'hex'),
    );
    decipher.setAuthTag(Buffer.from(tag, 'hex'));

    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  }

  encryptObject<T extends Record<string, any>>(
    obj: T,
    fields: (keyof T)[],
  ): T {
    const encrypted = { ...obj };
    for (const field of fields) {
      if (encrypted[field] && typeof encrypted[field] === 'string') {
        const result = this.encrypt(encrypted[field] as string);
        encrypted[field] = JSON.stringify(result) as any;
      }
    }
    return encrypted;
  }

  decryptObject<T extends Record<string, any>>(
    obj: T,
    fields: (keyof T)[],
  ): T {
    const decrypted = { ...obj };
    for (const field of fields) {
      if (decrypted[field] && typeof decrypted[field] === 'string') {
        try {
          const parsed = JSON.parse(decrypted[field] as string);
          if (parsed.encrypted && parsed.iv && parsed.tag) {
            decrypted[field] = this.decrypt(
              parsed.encrypted,
              parsed.iv,
              parsed.tag,
            ) as any;
          }
        } catch {
          this.logger.warn(`Failed to decrypt field ${String(field)}`);
        }
      }
    }
    return decrypted;
  }

  encryptMany<T extends Record<string, any>>(
    items: T[],
    fields: (keyof T)[],
  ): T[] {
    return items.map((item) => this.encryptObject(item, fields));
  }

  decryptMany<T extends Record<string, any>>(
    items: T[],
    fields: (keyof T)[],
  ): T[] {
    return items.map((item) => this.decryptObject(item, fields));
  }

  generateRandomKey(length: number = 32): string {
    return crypto.randomBytes(length).toString('hex');
  }

  hash(text: string): string {
    return crypto.createHash('sha256').update(text).digest('hex');
  }
}
