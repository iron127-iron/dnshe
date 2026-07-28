import { Module } from '@nestjs/common';
import { NotificationsController } from '../../notifications/notifications.controller';
import { NotificationsService } from '../../notifications/notifications.service';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [NotificationsController],
  providers: [NotificationsService],
  exports: [NotificationsService],
})
export class NotificationsModule {}
