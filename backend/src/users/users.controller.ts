import { Controller, Get, Patch, Post, Body, Param, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('Users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('profile')
  @ApiOperation({ summary: 'Get current user profile' })
  async getProfile(@CurrentUser() user: any) {
    return this.usersService.findById(user.id);
  }

  @Patch('profile')
  @ApiOperation({ summary: 'Update profile (displayName, avatar)' })
  async updateProfile(@CurrentUser() user: any, @Body() dto: UpdateProfileDto) {
    return this.usersService.updateProfile(user.id, dto);
  }

  @Patch('password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update password' })
  async updatePassword(
    @CurrentUser() user: any,
    @Body('oldPassword') oldPassword: string,
    @Body('newPassword') newPassword: string,
  ) {
    await this.usersService.updatePassword(user.id, oldPassword, newPassword);
    return { message: 'Password updated successfully' };
  }

  @Get('api-usage')
  @ApiOperation({ summary: 'Get API usage stats' })
  async getApiUsage(@CurrentUser() user: any) {
    return this.usersService.getApiUsage(user.id);
  }

  @Get('dashboard')
  @ApiOperation({ summary: 'Get dashboard counts' })
  async getDashboard(@CurrentUser() user: any) {
    return this.usersService.getDashboardStats(user.id);
  }
}
