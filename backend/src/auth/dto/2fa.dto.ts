import { IsString, IsNotEmpty } from 'class-validator';

export class TwoFactorDto {
  @IsString()
  @IsNotEmpty()
  token: string;
}