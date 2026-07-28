import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string) {
    return this.prisma.user.findUnique({ where: { id } });
  }

  async findByEmail(email: string) {
    return this.prisma.user.findUnique({ where: { email } });
  }

  async findByUsername(username: string) {
    return this.prisma.user.findUnique({ where: { username } });
  }

  async create(data: {
    email: string;
    username: string;
    password: string;
    displayName?: string;
    avatar?: string;
  }) {
    const existingEmail = await this.findByEmail(data.email);
    if (existingEmail) {
      throw new ConflictException('Email already registered');
    }

    const existingUsername = await this.findByUsername(data.username);
    if (existingUsername) {
      throw new ConflictException('Username already taken');
    }

    const hashedPassword = await bcrypt.hash(data.password, 12);

    return this.prisma.user.create({
      data: {
        email: data.email,
        username: data.username,
        password: hashedPassword,
        displayName: data.displayName || data.username,
        avatar: data.avatar,
      },
    });
  }

  async update(id: string, data: any) {
    const user = await this.findById(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (data.email && data.email !== user.email) {
      const existing = await this.findByEmail(data.email);
      if (existing) {
        throw new ConflictException('Email already in use');
      }
    }

    if (data.username && data.username !== user.username) {
      const existing = await this.findByUsername(data.username);
      if (existing) {
        throw new ConflictException('Username already taken');
      }
    }

    if (data.password) {
      data.password = await bcrypt.hash(data.password, 12);
    }

    return this.prisma.user.update({
      where: { id },
      data,
    });
  }

  async updatePassword(id: string, oldPassword: string, newPassword: string) {
    const user = await this.findById(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const isOldPasswordValid = await bcrypt.compare(oldPassword, user.password);
    if (!isOldPasswordValid) {
      throw new BadRequestException('Current password is incorrect');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12);

    return this.prisma.user.update({
      where: { id },
      data: { password: hashedPassword },
    });
  }

  async updateProfile(id: string, data: { displayName?: string; avatar?: string }) {
    const user = await this.findById(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    return this.prisma.user.update({
      where: { id },
      data,
      select: {
        id: true,
        email: true,
        username: true,
        displayName: true,
        avatar: true,
        role: true,
        isEmailVerified: true,
        createdAt: true,
      },
    });
  }

  async getApiUsage(userId: string) {
    const totalRequests = await this.prisma.auditLog.count({
      where: { userId },
    });

    const recentRequests = await this.prisma.auditLog.count({
      where: {
        userId,
        createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
      },
    });

    const accounts = await this.prisma.dnsheAccount.count({
      where: { userId },
    });

    const domains = await this.prisma.domain.count({
      where: { dnsheAccount: { userId } },
    });

    return {
      totalRequests,
      recentRequests,
      totalAccounts: accounts,
      totalDomains: domains,
    };
  }

  async getDashboardStats(userId: string) {
    const accounts = await this.prisma.dnsheAccount.count({
      where: { userId, isActive: true },
    });

    const domains = await this.prisma.domain.count({
      where: { dnsheAccount: { userId } },
    });

    const dnsRecords = await this.prisma.dnsRecord.count({
      where: { domain: { dnsheAccount: { userId } } },
    });

    const recentActivity = await this.prisma.auditLog.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    return {
      accounts,
      domains,
      dnsRecords,
      recentActivity,
    };
  }
}
