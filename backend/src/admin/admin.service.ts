import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class AdminService {
  private readonly logger = new Logger(AdminService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  async listUsers(options: {
    page?: number;
    limit?: number;
    search?: string;
    role?: string;
    isBlocked?: boolean;
  }) {
    const page = options.page || 1;
    const limit = options.limit || 10;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (options.search) {
      where.OR = [
        { email: { contains: options.search } },
        { username: { contains: options.search } },
        { displayName: { contains: options.search } },
      ];
    }

    if (options.role) {
      where.role = options.role;
    }

    if (options.isBlocked !== undefined) {
      where.isBlocked = options.isBlocked;
    }

    const [items, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          email: true,
          username: true,
          displayName: true,
          role: true,
          isBlocked: true,
          isEmailVerified: true,
          isTwoFactorEnabled: true,
          createdAt: true,
          lastLoginAt: true,
          lastLoginIp: true,
          _count: {
            select: {
              dnsheAccounts: true,
              sessions: { where: { isActive: true } },
            },
          },
        },
      }),
      this.prisma.user.count({ where }),
    ]);

    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async getUser(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            dnsheAccounts: true,
            domains: true,
            auditLogs: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const { password, twoFactorSecret, emailVerifyToken, emailVerifyTokenExpires, ...safeUser } = user;
    return safeUser;
  }

  async blockUser(adminId: string, userId: string, isBlocked: boolean) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: { isBlocked },
    });

    if (isBlocked) {
      await this.prisma.refreshToken.updateMany({
        where: { userId, isRevoked: false },
        data: { isRevoked: true, revokedAt: new Date() },
      });

      await this.prisma.session.updateMany({
        where: { userId, isActive: true },
        data: { isActive: false, endedAt: new Date() },
      });
    }

    await this.auditService.log({
      userId: adminId,
      action: isBlocked ? 'ADMIN_BLOCK_USER' : 'ADMIN_UNBLOCK_USER',
      resource: 'user',
      resourceId: userId,
      details: { targetUserId: userId },
    });

    return { message: `User ${isBlocked ? 'blocked' : 'unblocked'} successfully` };
  }

  async resetUserPassword(adminId: string, userId: string, newPassword: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12);

    await this.prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    await this.prisma.refreshToken.updateMany({
      where: { userId, isRevoked: false },
      data: { isRevoked: true, revokedAt: new Date() },
    });

    await this.auditService.log({
      userId: adminId,
      action: 'ADMIN_RESET_PASSWORD',
      resource: 'user',
      resourceId: userId,
    });

    return { message: 'Password reset successfully' };
  }

  async changeUserRole(adminId: string, userId: string, role: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: { role: role as any },
    });

    await this.auditService.log({
      userId: adminId,
      action: 'ADMIN_CHANGE_ROLE',
      resource: 'user',
      resourceId: userId,
      details: { oldRole: user.role, newRole: role },
    });

    return { message: 'Role updated successfully' };
  }

  async deleteUser(adminId: string, userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    await this.prisma.user.delete({ where: { id: userId } });

    await this.auditService.log({
      userId: adminId,
      action: 'ADMIN_DELETE_USER',
      resource: 'user',
      resourceId: userId,
    });

    return { message: 'User deleted successfully' };
  }

  async getStats() {
    const [totalUsers, activeUsers, totalAccounts, totalDomains, totalRecords, recentUsers] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.user.count({ where: { isBlocked: false } }),
      this.prisma.dnsheAccount.count(),
      this.prisma.domain.count(),
      this.prisma.dnsRecord.count(),
      this.prisma.user.findMany({
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: { id: true, email: true, username: true, createdAt: true },
      }),
    ]);

    return {
      totalUsers,
      activeUsers,
      blockedUsers: totalUsers - activeUsers,
      totalAccounts,
      totalDomains,
      totalRecords,
      recentUsers,
    };
  }

  async getApiUsage(period?: string) {
    let startDate: Date;
    const now = new Date();

    switch (period) {
      case '24h':
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '90d':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    }

    const logs = await this.prisma.auditLog.findMany({
      where: { createdAt: { gte: startDate } },
      orderBy: { createdAt: 'desc' },
    });

    const actions: Record<string, number> = {};
    for (const log of logs) {
      actions[log.action] = (actions[log.action] || 0) + 1;
    }

    return {
      period: period || '7d',
      totalRequests: logs.length,
      actions,
      startDate,
      endDate: now,
    };
  }

  async getAuditLogs(options: {
    page?: number;
    limit?: number;
    userId?: string;
    action?: string;
  }) {
    const page = options.page || 1;
    const limit = options.limit || 50;
    const skip = (page - 1) * limit;

    return this.auditService.findAll({
      limit,
      offset: skip,
      userId: options.userId,
      action: options.action,
    });
  }

  async getSettings() {
    const settings = await this.prisma.systemSetting.findMany();
    const result: Record<string, string> = {};
    for (const s of settings) {
      result[s.key] = s.value;
    }
    return result;
  }

  async updateSettings(adminId: string, settings: Record<string, string>) {
    for (const [key, value] of Object.entries(settings)) {
      await this.prisma.systemSetting.upsert({
        where: { key },
        update: { value },
        create: { key, value },
      });
    }

    await this.auditService.log({
      userId: adminId,
      action: 'ADMIN_UPDATE_SETTINGS',
      resource: 'settings',
      details: { keys: Object.keys(settings) },
    });

    return { message: 'Settings updated successfully' };
  }

  async sendNotification(adminId: string, data: { title: string; message: string; userId?: string }) {
    if (data.userId) {
      await this.prisma.notification.create({
        data: {
          userId: data.userId,
          title: data.title,
          message: data.message,
        },
      });
    } else {
      const users = await this.prisma.user.findMany({ select: { id: true } });
      await this.prisma.notification.createMany({
        data: users.map((u: { id: string }) => ({
          userId: u.id,
          title: data.title,
          message: data.message,
        })),
      });
    }

    await this.auditService.log({
      userId: adminId,
      action: 'ADMIN_SEND_NOTIFICATION',
      resource: 'notification',
      details: { title: data.title, target: data.userId || 'all' },
    });

    return { message: 'Notification sent successfully' };
  }
}
