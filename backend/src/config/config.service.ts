import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class ConfigService {
  private readonly logger = new Logger(ConfigService.name);

  get port(): number {
    return parseInt(process.env.PORT || '3000', 10);
  }

  get nodeEnv(): string {
    return process.env.NODE_ENV || 'development';
  }

  get isProduction(): boolean {
    return this.nodeEnv === 'production';
  }

  get isDevelopment(): boolean {
    return this.nodeEnv === 'development';
  }

  get databaseUrl(): string {
    return process.env.DATABASE_URL || '';
  }

  get jwtSecret(): string {
    return process.env.JWT_SECRET || '';
  }

  get jwtAccessExpiresIn(): string {
    return process.env.JWT_ACCESS_EXPIRES_IN || '15m';
  }

  get jwtRefreshExpiresIn(): string {
    return process.env.JWT_REFRESH_EXPIRES_IN || '7d';
  }

  get encryptionKey(): string {
    return process.env.ENCRYPTION_KEY || '';
  }

  get frontendUrl(): string {
    return process.env.FRONTEND_URL || 'http://localhost:5173';
  }

  get redisHost(): string {
    return process.env.REDIS_HOST || 'localhost';
  }

  get redisPort(): number {
    return parseInt(process.env.REDIS_PORT || '6379', 10);
  }

  get redisPassword(): string {
    return process.env.REDIS_PASSWORD || '';
  }

  get googleClientId(): string {
    return process.env.GOOGLE_CLIENT_ID || '';
  }

  get googleClientSecret(): string {
    return process.env.GOOGLE_CLIENT_SECRET || '';
  }

  get googleCallbackUrl(): string {
    return process.env.GOOGLE_CALLBACK_URL || '';
  }

  get discordClientId(): string {
    return process.env.DISCORD_CLIENT_ID || '';
  }

  get discordClientSecret(): string {
    return process.env.DISCORD_CLIENT_SECRET || '';
  }

  get discordCallbackUrl(): string {
    return process.env.DISCORD_CALLBACK_URL || '';
  }

  get smtpHost(): string {
    return process.env.SMTP_HOST || '';
  }

  get smtpPort(): number {
    return parseInt(process.env.SMTP_PORT || '587', 10);
  }

  get smtpUser(): string {
    return process.env.SMTP_USER || '';
  }

  get smtpPass(): string {
    return process.env.SMTP_PASS || '';
  }

  get smtpFrom(): string {
    return process.env.SMTP_FROM || 'noreply@dnshe.io';
  }

  get throttleTtl(): number {
    return parseInt(process.env.THROTTLE_TTL || '60', 10);
  }

  get throttleLimit(): number {
    return parseInt(process.env.THROTTLE_LIMIT || '100', 10);
  }

  get csrfSecret(): string {
    return process.env.CSRF_SECRET || '';
  }

  get(key: string, defaultValue?: string): string {
    return process.env[key] || defaultValue || '';
  }

  getNumber(key: string, defaultValue?: number): number {
    const value = process.env[key];
    if (value === undefined || value === null) {
      return defaultValue || 0;
    }
    return parseInt(value, 10);
  }

  getBoolean(key: string, defaultValue?: boolean): boolean {
    const value = process.env[key];
    if (value === undefined || value === null) {
      return defaultValue || false;
    }
    return value.toLowerCase() === 'true' || value === '1';
  }
}
