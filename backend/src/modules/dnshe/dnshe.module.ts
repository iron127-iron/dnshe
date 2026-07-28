import { Module } from '@nestjs/common';
import { DnsheController } from '../../dnshe/dnshe.controller';
import { DnsheService } from '../../dnshe/dnshe.service';
import { DnsheApiService } from '../../dnshe/dnshe-api.service';
import { PrismaModule } from '../../prisma/prisma.module';
import { EncryptionModule } from '../../encryption/encryption.module';
import { AuditModule } from '../../audit/audit.module';

@Module({
  imports: [PrismaModule, EncryptionModule, AuditModule],
  controllers: [DnsheController],
  providers: [DnsheService, DnsheApiService],
  exports: [DnsheService, DnsheApiService],
})
export class DnsheModule {}
