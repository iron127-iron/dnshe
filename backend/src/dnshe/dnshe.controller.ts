import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { DnsheService } from './dnshe.service';
import { CreateAccountDto } from './dto/create-account.dto';
import { UpdateAccountDto } from './dto/update-account.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('DNSHE')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('dnshe')
export class DnsheController {
  constructor(private readonly dnsheService: DnsheService) {}

  @Get('accounts')
  @ApiOperation({ summary: 'Get all DNSHE accounts' })
  async findAll(@CurrentUser() user: any) {
    return this.dnsheService.findAll(user.id);
  }

  @Post('accounts')
  @ApiOperation({ summary: 'Create a DNSHE account' })
  async create(@CurrentUser() user: any, @Body() dto: CreateAccountDto) {
    return this.dnsheService.create(user.id, dto);
  }

  @Get('accounts/:id')
  @ApiOperation({ summary: 'Get a DNSHE account by ID' })
  async findOne(@CurrentUser() user: any, @Param('id') id: string) {
    return this.dnsheService.findOne(user.id, id);
  }

  @Patch('accounts/:id')
  @ApiOperation({ summary: 'Update a DNSHE account' })
  async update(@CurrentUser() user: any, @Param('id') id: string, @Body() dto: UpdateAccountDto) {
    return this.dnsheService.update(user.id, id, dto);
  }

  @Delete('accounts/:id')
  @ApiOperation({ summary: 'Delete a DNSHE account' })
  async remove(@CurrentUser() user: any, @Param('id') id: string) {
    return this.dnsheService.remove(user.id, id);
  }

  @Post('accounts/:id/sync')
  @ApiOperation({ summary: 'Sync domains from DNSHE account' })
  async sync(@CurrentUser() user: any, @Param('id') id: string) {
    return this.dnsheService.sync(user.id, id);
  }

  @Post('accounts/sync-all')
  @ApiOperation({ summary: 'Sync all active accounts' })
  async syncAll(@CurrentUser() user: any) {
    return this.dnsheService.syncAll(user.id);
  }

  @Get('accounts/:id/status')
  @ApiOperation({ summary: 'Check API connectivity status' })
  async getStatus(@CurrentUser() user: any, @Param('id') id: string) {
    return this.dnsheService.getApiStatus(user.id, id);
  }

  @Get('accounts/:id/usage')
  @ApiOperation({ summary: 'Get API usage for account' })
  async getUsage(@CurrentUser() user: any, @Param('id') id: string) {
    return this.dnsheService.getApiUsage(user.id, id);
  }
}
