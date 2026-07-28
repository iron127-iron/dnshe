import { Injectable, NotFoundException, ConflictException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EncryptionService } from '../encryption/encryption.service';
import { AuditService } from '../audit/audit.service';
import { DnsheApiService } from './dnshe-api.service';
import { CreateAccountDto } from './dto/create-account.dto';
import { UpdateAccountDto } from './dto/update-account.dto';

@Injectable()
export class DnsheService {
  private readonly logger = new Logger(DnsheService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly encryptionService: EncryptionService,
    private readonly dnsheApiService: DnsheApiService,
    private readonly auditService: AuditService,
  ) {}

  async create(userId: string, dto: CreateAccountDto) {
    const encryptedKey = this.encryptionService.encrypt(dto.apiKey);
    const encryptedSecret = this.encryptionService.encrypt(dto.apiSecret);

    const account = await this.prisma.dnsheAccount.create({
      data: {
        name: dto.name,
        apiKey: JSON.stringify(encryptedKey),
        apiSecret: JSON.stringify(encryptedSecret),
        notes: dto.notes,
        tags: dto.tags || [],
        userId,
      },
    });

    await this.auditService.log({
      userId,
      action: 'DNSHE_ACCOUNT_CREATE',
      resource: 'dnsheAccount',
      resourceId: account.id,
    });

    return this.decryptAccount(account);
  }

  async findAll(userId: string) {
    const accounts = await this.prisma.dnsheAccount.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    return accounts.map((account: any) => this.decryptAccount(account));
  }

  async findOne(userId: string, id: string) {
    const account = await this.prisma.dnsheAccount.findFirst({
      where: { id, userId },
    });

    if (!account) {
      throw new NotFoundException('DNSHE account not found');
    }

    return this.decryptAccount(account);
  }

  async update(userId: string, id: string, dto: UpdateAccountDto) {
    const account = await this.findOne(userId, id);

    const updateData: any = {};

    if (dto.name !== undefined) updateData.name = dto.name;
    if (dto.notes !== undefined) updateData.notes = dto.notes;
    if (dto.tags !== undefined) updateData.tags = dto.tags;

    if (dto.apiKey) {
      const encryptedKey = this.encryptionService.encrypt(dto.apiKey);
      updateData.apiKey = JSON.stringify(encryptedKey);
    }

    if (dto.apiSecret) {
      const encryptedSecret = this.encryptionService.encrypt(dto.apiSecret);
      updateData.apiSecret = JSON.stringify(encryptedSecret);
    }

    const updated = await this.prisma.dnsheAccount.update({
      where: { id },
      data: updateData,
    });

    await this.auditService.log({
      userId,
      action: 'DNSHE_ACCOUNT_UPDATE',
      resource: 'dnsheAccount',
      resourceId: id,
    });

    return this.decryptAccount(updated);
  }

  async remove(userId: string, id: string) {
    const account = await this.findOne(userId, id);

    await this.prisma.dnsheAccount.delete({ where: { id } });

    await this.auditService.log({
      userId,
      action: 'DNSHE_ACCOUNT_DELETE',
      resource: 'dnsheAccount',
      resourceId: id,
    });

    return { message: 'Account deleted successfully' };
  }

  async sync(userId: string, id: string) {
    const account = await this.findOne(userId, id);
    const decrypted = this.decryptAccount(account);

    try {
      const domains = await this.dnsheApiService.getDomains(decrypted.apiKey, decrypted.apiSecret);

      for (const domain of (domains as any[]) || []) {
        await this.prisma.domain.upsert({
          where: { dnsheAccountId_domainId: { dnsheAccountId: id, domainId: domain.id } },
          update: {
            name: domain.name,
            status: domain.status,
            expiresAt: domain.expiresAt ? new Date(domain.expiresAt) : null,
            autoRenew: domain.autoRenew || false,
            lastSyncAt: new Date(),
          },
          create: {
            dnsheAccountId: id,
            domainId: domain.id,
            name: domain.name,
            status: domain.status,
            expiresAt: domain.expiresAt ? new Date(domain.expiresAt) : null,
            autoRenew: domain.autoRenew || false,
            lastSyncAt: new Date(),
          },
        });
      }

      await this.prisma.dnsheAccount.update({
        where: { id },
        data: { lastSyncAt: new Date() },
      });

      await this.auditService.log({
        userId,
        action: 'DNSHE_ACCOUNT_SYNC',
        resource: 'dnsheAccount',
        resourceId: id,
        details: { domainsCount: (domains as any[])?.length || 0 },
      });

      return { message: 'Sync completed', domainsCount: (domains as any[])?.length || 0 };
    } catch (error) {
      this.logger.error(`Sync failed for account ${id}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      throw new Error('Failed to sync with DNSHE API');
    }
  }

  async syncAll(userId: string) {
    const accounts = await this.prisma.dnsheAccount.findMany({
      where: { userId, isActive: true },
    });

    const results = [];
    for (const account of accounts) {
      try {
        const result = await this.sync(userId, account.id);
        results.push({ accountId: account.id, name: account.name, status: 'success', ...result });
      } catch (error) {
        results.push({ accountId: account.id, name: account.name, status: 'failed' });
      }
    }

    return { results };
  }

  async getApiStatus(userId: string, id: string) {
    const account = await this.findOne(userId, id);
    const decrypted = this.decryptAccount(account);

    try {
      const status = await this.dnsheApiService.getStatus(decrypted.apiKey, decrypted.apiSecret);
      return { status: 'connected', details: status };
    } catch {
      return { status: 'disconnected' };
    }
  }

  async getApiUsage(userId: string, id: string) {
    const account = await this.findOne(userId, id);
    const decrypted = this.decryptAccount(account);

    try {
      const usage = await this.dnsheApiService.getUsage(decrypted.apiKey, decrypted.apiSecret);
      return usage;
    } catch {
      throw new Error('Failed to fetch API usage');
    }
  }

  private decryptAccount(account: any) {
    try {
      const apiKeyData = JSON.parse(account.apiKey);
      const apiSecretData = JSON.parse(account.apiSecret);

      return {
        ...account,
        apiKey: this.encryptionService.decrypt(apiKeyData.encrypted, apiKeyData.iv, apiKeyData.tag),
        apiSecret: this.encryptionService.decrypt(apiSecretData.encrypted, apiSecretData.iv, apiSecretData.tag),
      };
    } catch {
      return {
        ...account,
        apiKey: '***decryption-error***',
        apiSecret: '***decryption-error***',
      };
    }
  }
}
