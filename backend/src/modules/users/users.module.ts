import { Module, forwardRef } from '@nestjs/common';
import { UsersController } from '../../users/users.controller';
import { UsersService } from '../../users/users.service';
import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [forwardRef(() => AuthModule), PrismaModule],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
