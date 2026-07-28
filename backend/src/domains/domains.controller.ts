import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { DomainsService } from './domains.service';
import { CreateDnsRecordDto } from './dto/create-dns-record.dto';
import { UpdateDnsRecordDto } from './dto/update-dns-record.dto';
import { BulkCreateDto, BulkUpdateDto, BulkDeleteDto } from './dto/bulk-dns.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('Domains')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('domains')
export class DomainsController {
  constructor(private readonly domainsService: DomainsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all domains' })
  @ApiQuery({ name: 'dnsheAccountId', required: false })
  async findAll(@CurrentUser() user: any, @Query('dnsheAccountId') dnsheAccountId?: string) {
    return this.domainsService.findAll(user.id, dnsheAccountId);
  }

  @Get('export')
  @ApiOperation({ summary: 'Export domains' })
  @ApiQuery({ name: 'format', required: false, enum: ['json', 'csv'] })
  @ApiQuery({ name: 'dnsheAccountId', required: false })
  async export(
    @CurrentUser() user: any,
    @Query('format') format: string = 'json',
    @Query('dnsheAccountId') dnsheAccountId?: string,
  ) {
    return this.domainsService.export(user.id, format, dnsheAccountId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get domain by ID' })
  async findOne(@CurrentUser() user: any, @Param('id') id: string) {
    return this.domainsService.findOne(user.id, id);
  }

  @Get(':id/records')
  @ApiOperation({ summary: 'Get DNS records for domain' })
  async getRecords(@CurrentUser() user: any, @Param('id') id: string) {
    return this.domainsService.getRecords(user.id, id);
  }

  @Post(':id/records')
  @ApiOperation({ summary: 'Create DNS record' })
  async createRecord(@CurrentUser() user: any, @Param('id') id: string, @Body() dto: CreateDnsRecordDto) {
    return this.domainsService.createRecord(user.id, id, dto);
  }

  @Patch(':id/records/:recordId')
  @ApiOperation({ summary: 'Update DNS record' })
  async updateRecord(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Param('recordId') recordId: string,
    @Body() dto: UpdateDnsRecordDto,
  ) {
    return this.domainsService.updateRecord(user.id, id, recordId, dto);
  }

  @Delete(':id/records/:recordId')
  @ApiOperation({ summary: 'Delete DNS record' })
  async deleteRecord(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Param('recordId') recordId: string,
  ) {
    return this.domainsService.deleteRecord(user.id, id, recordId);
  }

  @Post('bulk/create')
  @ApiOperation({ summary: 'Bulk create DNS records' })
  async bulkCreate(@CurrentUser() user: any, @Body() dto: BulkCreateDto) {
    return this.domainsService.bulkCreate(user.id, dto.items);
  }

  @Post('bulk/update')
  @ApiOperation({ summary: 'Bulk update DNS records' })
  async bulkUpdate(@CurrentUser() user: any, @Body() dto: BulkUpdateDto) {
    return this.domainsService.bulkUpdate(user.id, dto.items);
  }

  @Post('bulk/delete')
  @ApiOperation({ summary: 'Bulk delete DNS records' })
  async bulkDelete(@CurrentUser() user: any, @Body() dto: BulkDeleteDto) {
    return this.domainsService.bulkDelete(user.id, dto.items);
  }

  @Post('bulk/sync')
  @ApiOperation({ summary: 'Bulk sync domains' })
  async bulkSync(@CurrentUser() user: any, @Query('dnsheAccountId') dnsheAccountId?: string) {
    return this.domainsService.bulkSync(user.id, dnsheAccountId);
  }

  @Get(':id/whois')
  @ApiOperation({ summary: 'Get WHOIS data for domain' })
  async getWhois(@CurrentUser() user: any, @Param('id') id: string) {
    return this.domainsService.getWhois(user.id, id);
  }

  @Get(':id/renew')
  @ApiOperation({ summary: 'Check domain renewal status' })
  async checkRenew(@CurrentUser() user: any, @Param('id') id: string) {
    return this.domainsService.checkRenew(user.id, id);
  }
}
