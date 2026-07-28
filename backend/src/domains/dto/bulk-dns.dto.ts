import { IsString, IsNotEmpty, IsArray, IsOptional, IsNumber, Min, Max, IsIn, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class BulkCreateItemDto {
  @IsString()
  @IsNotEmpty()
  domainId: string;

  @IsString()
  @IsNotEmpty()
  @IsIn(['A', 'AAAA', 'CNAME', 'MX', 'TXT', 'NS', 'SOA', 'SRV', 'CAA', 'PTR'])
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

export class BulkUpdateItemDto {
  @IsString()
  @IsNotEmpty()
  domainId: string;

  @IsString()
  @IsNotEmpty()
  recordId: string;

  @IsOptional()
  @IsString()
  @IsIn(['A', 'AAAA', 'CNAME', 'MX', 'TXT', 'NS', 'SOA', 'SRV', 'CAA', 'PTR'])
  type?: string;

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  value?: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(86400)
  ttl?: number;

  @IsOptional()
  @IsNumber()
  priority?: number;
}

export class BulkDeleteItemDto {
  @IsString()
  @IsNotEmpty()
  domainId: string;

  @IsString()
  @IsNotEmpty()
  recordId: string;
}

export class BulkCreateDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BulkCreateItemDto)
  items: BulkCreateItemDto[];
}

export class BulkUpdateDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BulkUpdateItemDto)
  items: BulkUpdateItemDto[];
}

export class BulkDeleteDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BulkDeleteItemDto)
  items: BulkDeleteItemDto[];
}
