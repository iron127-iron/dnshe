import { Module, forwardRef } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthController } from '../../auth/auth.controller';
import { AuthService } from '../../auth/auth.service';
import { JwtStrategy } from '../../auth/strategies/jwt.strategy';
import { JwtRefreshStrategy } from '../../auth/strategies/jwt-refresh.strategy';
import { GoogleStrategy } from '../../auth/strategies/google.strategy';
import { DiscordStrategy } from '../../auth/strategies/discord.strategy';
import { UsersModule } from '../users/users.module';
import { PrismaModule } from '../../prisma/prisma.module';
import { AuditModule } from '../../audit/audit.module';

@Module({
  imports: [
    PassportModule,
    JwtModule.registerAsync({
      useFactory: () => ({
        secret: process.env.JWT_SECRET || 'super-secret-jwt-key',
        signOptions: { expiresIn: process.env.JWT_EXPIRES_IN || '15m' },
      }),
    }),
    forwardRef(() => UsersModule),
    PrismaModule,
    AuditModule,
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, JwtRefreshStrategy, GoogleStrategy, DiscordStrategy],
  exports: [AuthService, JwtModule],
})
export class AuthModule {}
