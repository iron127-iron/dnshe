import { Injectable, UnauthorizedException, ConflictException, BadRequestException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';
import * as speakeasy from 'speakeasy';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly auditService: AuditService,
  ) {}

  async register(dto: RegisterDto) {
    const existingEmail = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existingEmail) {
      throw new ConflictException('Email already registered');
    }

    const existingUsername = await this.prisma.user.findUnique({ where: { username: dto.username } });
    if (existingUsername) {
      throw new ConflictException('Username already taken');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 12);

    const emailVerifyToken = crypto.randomBytes(32).toString('hex');

    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        username: dto.username,
        password: hashedPassword,
        displayName: dto.displayName || dto.username,
        emailVerifyToken,
      },
    });

    const { accessToken, refreshToken } = await this.generateTokens(user);

    await this.auditService.log({
      userId: user.id,
      action: 'REGISTER',
      resource: 'user',
      resourceId: user.id,
    });

    return {
      user: this.sanitizeUser(user),
      accessToken,
      refreshToken,
    };
  }

  async login(dto: LoginDto, rememberMe?: boolean) {
    const user = await this.prisma.user.findFirst({
      where: {
        OR: [
          { email: dto.emailOrUsername },
          { username: dto.emailOrUsername },
        ],
      },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (user.isBlocked) {
      throw new UnauthorizedException('Account is blocked');
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        lastLoginAt: new Date(),
        lastLoginIp: null,
      },
    });

    const { accessToken, refreshToken } = await this.generateTokens(user, rememberMe);

    await this.auditService.log({
      userId: user.id,
      action: 'LOGIN',
      resource: 'user',
      resourceId: user.id,
    });

    return {
      user: this.sanitizeUser(user),
      accessToken,
      refreshToken,
    };
  }

  async logout(userId: string) {
    await this.prisma.refreshToken.updateMany({
      where: { userId, isRevoked: false },
      data: { isRevoked: true, revokedAt: new Date() },
    });

    await this.prisma.session.updateMany({
      where: { userId, isActive: true },
      data: { isActive: false, endedAt: new Date() },
    });

    await this.auditService.log({
      userId,
      action: 'LOGOUT',
      resource: 'user',
      resourceId: userId,
    });
  }

  async refreshToken(token: string) {
    if (!token) {
      throw new UnauthorizedException('Refresh token not provided');
    }

    const storedToken = await this.prisma.refreshToken.findUnique({
      where: { token },
      include: { user: true },
    });

    if (!storedToken || storedToken.isRevoked) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    if (storedToken.expiresAt < new Date()) {
      throw new UnauthorizedException('Refresh token expired');
    }

    await this.prisma.refreshToken.update({
      where: { id: storedToken.id },
      data: { isRevoked: true, revokedAt: new Date() },
    });

    return this.generateTokens(storedToken.user);
  }

  async verifyEmail(token: string) {
    const user = await this.prisma.user.findFirst({
      where: { emailVerifyToken: token },
    });

    if (!user) {
      throw new BadRequestException('Invalid verification token');
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        isEmailVerified: true,
        emailVerifyToken: null,
      },
    });

    return { message: 'Email verified successfully' };
  }

  async forgotPassword(email: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) {
      return { message: 'If the email exists, a reset link has been sent' };
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetExpires = new Date(Date.now() + 60 * 60 * 1000);

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerifyToken: resetToken,
        emailVerifyTokenExpires: resetExpires,
      },
    });

    await this.auditService.log({
      userId: user.id,
      action: 'FORGOT_PASSWORD',
      resource: 'user',
      resourceId: user.id,
    });

    return { message: 'If the email exists, a reset link has been sent' };
  }

  async resetPassword(token: string, password: string) {
    const user = await this.prisma.user.findFirst({
      where: {
        emailVerifyToken: token,
        emailVerifyTokenExpires: { gt: new Date() },
      },
    });

    if (!user) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        emailVerifyToken: null,
        emailVerifyTokenExpires: null,
      },
    });

    await this.prisma.refreshToken.updateMany({
      where: { userId: user.id, isRevoked: false },
      data: { isRevoked: true, revokedAt: new Date() },
    });

    return { message: 'Password reset successfully' };
  }

  async enable2FA(userId: string) {
    const secret = speakeasy.generateSecret({
      name: `DNSHE:${userId}`,
    });

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        twoFactorSecret: secret.base32,
        isTwoFactorEnabled: false,
      },
    });

    const otpauthUrl = speakeasy.otpauthURL({
      secret: secret.ascii,
      label: `DNSHE:${userId}`,
      issuer: 'DNSHE',
    });

    return {
      secret: secret.base32,
      qrCode: otpauthUrl,
    };
  }

  async verify2FA(userId: string, token: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.twoFactorSecret) {
      throw new BadRequestException('2FA not enabled');
    }

    const verified = speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: 'base32',
      token,
      window: 1,
    });

    if (!verified) {
      throw new BadRequestException('Invalid 2FA token');
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: { isTwoFactorEnabled: true },
    });

    return { message: '2FA enabled successfully' };
  }

  async disable2FA(userId: string) {
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        twoFactorSecret: null,
        isTwoFactorEnabled: false,
      },
    });

    return { message: '2FA disabled successfully' };
  }

  async getSessions(userId: string) {
    return this.prisma.session.findMany({
      where: { userId, isActive: true },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        ipAddress: true,
        userAgent: true,
        createdAt: true,
        lastActivityAt: true,
      },
    });
  }

  async revokeSession(userId: string, sessionId: string) {
    const session = await this.prisma.session.findFirst({
      where: { id: sessionId, userId },
    });

    if (!session) {
      throw new BadRequestException('Session not found');
    }

    await this.prisma.session.update({
      where: { id: sessionId },
      data: { isActive: false, endedAt: new Date() },
    });

    return { message: 'Session revoked successfully' };
  }

  async getLoginHistory(userId: string) {
    const { items } = await this.auditService.findByUser(userId, {
      action: 'LOGIN',
      limit: 50,
    });
    return items;
  }

  async validateRefreshToken(userId: string, token: string) {
    return this.prisma.refreshToken.findFirst({
      where: {
        token,
        userId,
        isRevoked: false,
        expiresAt: { gt: new Date() },
      },
    });
  }

  private async generateTokens(user: any, rememberMe?: boolean) {
    const payload = { sub: user.id, email: user.email, role: user.role };

    const accessToken = this.jwtService.sign(payload);

    const refreshTokenValue = crypto.randomBytes(40).toString('hex');
    const refreshExpiresIn = rememberMe ? 30 : 7;

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + refreshExpiresIn);

    await this.prisma.refreshToken.create({
      data: {
        token: refreshTokenValue,
        userId: user.id,
        expiresAt,
      },
    });

    return { accessToken, refreshToken: refreshTokenValue };
  }

  private sanitizeUser(user: any) {
    const { password, twoFactorSecret, emailVerifyToken, emailVerifyTokenExpires, ...sanitized } = user;
    return sanitized;
  }
}
