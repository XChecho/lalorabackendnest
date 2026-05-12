import { IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum UserRole {
  ADMIN = 'ADMIN',
  CASHIER = 'CASHIER',
  KITCHEN = 'KITCHEN',
  WAITRESS = 'WAITRESS',
}

export class UpdateRoleDto {
  @ApiProperty({ enum: UserRole, example: 'WAITRESS' })
  @IsEnum(UserRole)
  role: UserRole;
}
