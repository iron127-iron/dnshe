import { Controller, Get, Patch, Post, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { BlockUserDto, ChangeRoleDto, ResetPasswordDto } from './dto/manage-user.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('Admin')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN', 'SUPER_ADMIN')
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('users')
  @ApiOperation({ summary: 'List all users' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'role', required: false })
  @ApiQuery({ name: 'isBlocked', required: false })
  async listUsers(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('search') search?: string,
    @Query('role') role?: string,
    @Query('isBlocked') isBlocked?: string,
  ) {
    return this.adminService.listUsers({
      page: page || 1,
      limit: limit || 10,
      search,
      role,
      isBlocked: isBlocked !== undefined ? isBlocked === 'true' : undefined,
    });
  }

  @Get('users/:id')
  @ApiOperation({ summary: 'Get user details' })
  async getUser(@Param('id') id: string) {
    return this.adminService.getUser(id);
  }

  @Patch('users/:id/block')
  @ApiOperation({ summary: 'Block/unblock user' })
  async blockUser(@CurrentUser() admin: any, @Param('id') id: string, @Body() dto: BlockUserDto) {
    return this.adminService.blockUser(admin.id, id, dto.isBlocked);
  }

  @Patch('users/:id/reset-password')
  @ApiOperation({ summary: 'Reset user password' })
  async resetPassword(@CurrentUser() admin: any, @Param('id') id: string, @Body() dto: ResetPasswordDto) {
    return this.adminService.resetUserPassword(admin.id, id, dto.newPassword);
  }

  @Patch('users/:id/role')
  @ApiOperation({ summary: 'Change user role' })
  async changeRole(@CurrentUser() admin: any, @Param('id') id: string, @Body() dto: ChangeRoleDto) {
    return this.adminService.changeUserRole(admin.id, id, dto.role);
  }

  @Delete('users/:id')
  @ApiOperation({ summary: 'Delete user' })
  async deleteUser(@CurrentUser() admin: any, @Param('id') id: string) {
    return this.adminService.deleteUser(admin.id, id);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get platform stats' })
  async getStats() {
    return this.adminService.getStats();
  }

  @Get('api-usage')
  @ApiOperation({ summary: 'Get API usage stats' })
  @ApiQuery({ name: 'period', required: false, enum: ['24h', '7d', '30d', '90d'] })
  async getApiUsage(@Query('period') period?: string) {
    return this.adminService.getApiUsage(period);
  }

  @Get('audit-logs')
  @ApiOperation({ summary: 'Get audit logs' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'userId', required: false })
  @ApiQuery({ name: 'action', required: false })
  async getAuditLogs(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('userId') userId?: string,
    @Query('action') action?: string,
  ) {
    return this.adminService.getAuditLogs({ page, limit, userId, action });
  }

  @Get('settings')
  @ApiOperation({ summary: 'Get system settings' })
  async getSettings() {
    return this.adminService.getSettings();
  }

  @Patch('settings')
  @ApiOperation({ summary: 'Update system settings' })
  async updateSettings(@CurrentUser() admin: any, @Body() settings: Record<string, string>) {
    return this.adminService.updateSettings(admin.id, settings);
  }

  @Post('notifications')
  @ApiOperation({ summary: 'Send notification to users' })
  async sendNotification(
    @CurrentUser() admin: any,
    @Body() body: { title: string; message: string; userId?: string },
  ) {
    return this.adminService.sendNotification(admin.id, body);
  }
}
