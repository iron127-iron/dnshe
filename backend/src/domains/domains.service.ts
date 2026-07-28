import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { DnsheApiService } from '../dnshe/dnshe-api.service';
import { DnsheService } from '../dnshe/dnshe.service';
import { CreateDnsRecordDto } from './dto/create-dns-record.dto';
import { UpdateDnsRecordDto } from './dto/update-dns-record.dto';

@Injectable()
export class DomainsService {
  private readonly logger = new Logger(DomainsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly dnsheApiService: DnsheApiService,
    private readonly dnsheService: DnsheService,
    private readonly auditService: AuditService,
  ) {}

  async findAll(userId: string, dnsheAccountId?: string) {
    const where: any = { dnsheAccount: { userId } };

    if (dnsheAccountId) {
      where.dnsheAccountId = dnsheAccountId;
    }

    return this.prisma.domain.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        dnsheAccount: {
          select: { id: true, name: true },
        },
        _count: {
          select: { dnsRecords: true },
        },
      },
    });
  }

  async findOne(userId: string, id: string) {
    const domain = await this.prisma.domain.findFirst({
      where: { id, dnsheAccount: { userId } },
      include: {
        dnsheAccount: {
          select: { id: true, name: true },
        },
      },
    });

    if (!domain) {
      throw new NotFoundException('Domain not found');
    }

    return domain;
  }

  async getRecords(userId: string, domainId: string) {
    const domain = await this.findOne(userId, domainId);

    return this.prisma.dnsRecord.findMany({
      where: { domainId: domain.id },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createRecord(userId: string, domainId: string, dto: CreateDnsRecordDto) {
    const domain = await this.findOne(userId, domainId);
    const account = await this.dnsheService.findOne(userId, domain.dnsheAccountId);

    try {
      const result = await this.dnsheApiService.createDnsRecord(
        account.apiKey,
        account.apiSecret,
        domain.domainId,
        dto,
      );

      const record = await this.prisma.dnsRecord.create({
        data: {
          domainId: domain.id,
          recordId: (result as any)?.id || '',
          type: dto.type,
          name: dto.name,
          value: dto.value,
          ttl: dto.ttl,
          priority: dto.priority,
        },
      });

      await this.auditService.log({
        userId,
        action: 'DNS_RECORD_CREATE',
        resource: 'dnsRecord',
        resourceId: record.id,
        details: { domainId: domain.id, type: dto.type, name: dto.name },
      });

      return record;
    } catch (error) {
      this.logger.error(`Failed to create DNS record: ${error instanceof Error ? error.message : 'Unknown error'}`);
      throw new Error('Failed to create DNS record via API');
    }
  }

  async updateRecord(userId: string, domainId: string, recordId: string, dto: UpdateDnsRecordDto) {
    const domain = await this.findOne(userId, domainId);
    const account = await this.dnsheService.findOne(userId, domain.dnsheAccountId);

    const existing = await this.prisma.dnsRecord.findFirst({
      where: { id: recordId, domainId: domain.id },
    });

    if (!existing) {
      throw new NotFoundException('DNS record not found');
    }

    try {
      await this.dnsheApiService.updateDnsRecord(
        account.apiKey,
        account.apiSecret,
        domain.domainId,
        existing.recordId,
        dto,
      );

      const updated = await this.prisma.dnsRecord.update({
        where: { id: recordId },
        data: {
          ...(dto.type && { type: dto.type }),
          ...(dto.name && { name: dto.name }),
          ...(dto.value && { value: dto.value }),
          ...(dto.ttl !== undefined && { ttl: dto.ttl }),
          ...(dto.priority !== undefined && { priority: dto.priority }),
        },
      });

      await this.auditService.log({
        userId,
        action: 'DNS_RECORD_UPDATE',
        resource: 'dnsRecord',
        resourceId: recordId,
        details: { domainId: domain.id },
      });

      return updated;
    } catch (error) {
      this.logger.error(`Failed to update DNS record: ${error instanceof Error ? error.message : 'Unknown error'}`);
      throw new Error('Failed to update DNS record via API');
    }
  }

  async deleteRecord(userId: string, domainId: string, recordId: string) {
    const domain = await this.findOne(userId, domainId);
    const account = await this.dnsheService.findOne(userId, domain.dnsheAccountId);

    const existing = await this.prisma.dnsRecord.findFirst({
      where: { id: recordId, domainId: domain.id },
    });

    if (!existing) {
      throw new NotFoundException('DNS record not found');
    }

    try {
      await this.dnsheApiService.deleteDnsRecord(
        account.apiKey,
        account.apiSecret,
        domain.domainId,
        existing.recordId,
      );

      await this.prisma.dnsRecord.delete({ where: { id: recordId } });

      await this.auditService.log({
        userId,
        action: 'DNS_RECORD_DELETE',
        resource: 'dnsRecord',
        resourceId: recordId,
        details: { domainId: domain.id },
      });

      return { message: 'DNS record deleted successfully' };
    } catch (error) {
      this.logger.error(`Failed to delete DNS record: ${error instanceof Error ? error.message : 'Unknown error'}`);
      throw new Error('Failed to delete DNS record via API');
    }
  }

  async bulkCreate(userId: string, items: { domainId: string; type: string; name: string; value: string; ttl?: number; priority?: number }[]) {
    const results = [];
    for (const item of items) {
      try {
        const record = await this.createRecord(userId, item.domainId, item);
        results.push({ ...item, status: 'success', record });
      } catch (error) {
        results.push({ ...item, status: 'failed', error: error instanceof Error ? error.message : 'Unknown error' });
      }
    }
    return { results };
  }

  async bulkUpdate(userId: string, items: { domainId: string; recordId: string; type?: string; name?: string; value?: string; ttl?: number; priority?: number }[]) {
    const results = [];
    for (const item of items) {
      try {
        const record = await this.updateRecord(userId, item.domainId, item.recordId, item);
        results.push({ ...item, status: 'success', record });
      } catch (error) {
        results.push({ ...item, status: 'failed', error: error instanceof Error ? error.message : 'Unknown error' });
      }
    }
    return { results };
  }

  async bulkDelete(userId: string, items: { domainId: string; recordId: string }[]) {
    const results = [];
    for (const item of items) {
      try {
        await this.deleteRecord(userId, item.domainId, item.recordId);
        results.push({ ...item, status: 'success' });
      } catch (error) {
        results.push({ ...item, status: 'failed', error: error instanceof Error ? error.message : 'Unknown error' });
      }
    }
    return { results };
  }

  async bulkSync(userId: string, dnsheAccountId?: string) {
    if (dnsheAccountId) {
      return this.dnsheService.sync(userId, dnsheAccountId);
    }
    return this.dnsheService.syncAll(userId);
  }

  async getWhois(userId: string, domainId: string) {
    const domain = await this.findOne(userId, domainId);
    const account = await this.dnsheService.findOne(userId, domain.dnsheAccountId);

    try {
      return this.dnsheApiService.getWhois(account.apiKey, account.apiSecret, domain.name);
    } catch {
      throw new Error('Failed to fetch WHOIS data');
    }
  }

  async checkRenew(userId: string, domainId: string) {
    const domain = await this.findOne(userId, domainId);
    const account = await this.dnsheService.findOne(userId, domain.dnsheAccountId);

    try {
      return this.dnsheApiService.checkRenew(account.apiKey, account.apiSecret, domain.name);
    } catch {
      throw new Error('Failed to check renewal status');
    }
  }

  async export(userId: string, format: string, dnsheAccountId?: string) {
    const domains = await this.findAll(userId, dnsheAccountId);

    const records = await this.prisma.dnsRecord.findMany({
      where: {
        domain: {
          id: { in: domains.map((d: any) => d.id) },
        },
      },
    });

    if (format === 'json') {
      return { domains, records };
    }

    if (format === 'csv') {
      const header = 'domain,type,name,value,ttl,priority';
      const rows = records.map((r: any) => `${r.domain?.name || ''},${r.type},${r.name},${r.value},${r.ttl || ''},${r.priority || ''}`);
      return [header, ...rows].join('\n');
    }

    return { domains, records };
  }
}
