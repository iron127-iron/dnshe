import { Module } from '@nestjs/common';
import { DomainsController } from '../../domains/domains.controller';
import { DomainsService } from '../../domains/domains.service';
import { DnsheModule } from '../dnshe/dnshe.module';
import { PrismaModule } from '../../prisma/prisma.module';
import { AuditModule } from '../../audit/audit.module';

@Module({
  imports: [PrismaModule, DnsheModule, AuditModule],
  controllers: [DomainsController],
  providers: [DomainsService],
  exports: [DomainsService],
})
export class DomainsModule {}
