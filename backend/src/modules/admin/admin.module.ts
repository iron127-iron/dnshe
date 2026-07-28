import { Module, forwardRef } from '@nestjs/common';
import { AdminController } from '../../admin/admin.controller';
import { AdminService } from '../../admin/admin.service';
import { PrismaModule } from '../../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { AuditModule } from '../../audit/audit.module';

@Module({
  imports: [PrismaModule, forwardRef(() => AuthModule), AuditModule],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}
