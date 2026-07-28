import { IsBoolean, IsString, IsNotEmpty, IsOptional, IsIn, MinLength, MaxLength, Matches } from 'class-validator';

export class BlockUserDto {
  @IsBoolean()
  @IsNotEmpty()
  isBlocked: boolean;
}

export class ChangeRoleDto {
  @IsString()
  @IsNotEmpty()
  @IsIn(['USER', 'ADMIN', 'SUPER_ADMIN'])
  role: string;
}

export class ResetPasswordDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  @MaxLength(128)
  @Matches(/(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])/, {
    message: 'Password must contain uppercase, lowercase, and number',
  })
  newPassword: string;
}
