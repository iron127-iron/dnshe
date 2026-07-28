import { PartialType } from '@nestjs/swagger';
import { CreateDnsRecordDto } from './create-dns-record.dto';

export class UpdateDnsRecordDto extends PartialType(CreateDnsRecordDto) {}
