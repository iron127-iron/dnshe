import { IsString, IsNotEmpty, IsOptional, IsNumber, Min, Max, IsIn } from 'class-validator';

const RECORD_TYPES = ['A', 'AAAA', 'CNAME', 'MX', 'TXT', 'NS', 'SOA', 'SRV', 'CAA', 'PTR'];

export class CreateDnsRecordDto {
  @IsString()
  @IsNotEmpty()
  @IsIn(RECORD_TYPES)
  type: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  value: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(86400)
  ttl?: number;

  @IsOptional()
  @IsNumber()
  priority?: number;
}
