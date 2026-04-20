import {
  IsEmail,
  IsString,
  MinLength,
  IsEnum,
  IsOptional,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum UserType {
  ADMIN = 'admin',
  KITCHEN = 'kitchen',
  CASHIER = 'cashier',
  WAITER = 'waiter',
  CANCHA_MANAGER = 'cancha_manager',
}

export class CreateUserDto {
  @ApiProperty({ example: 'John' })
  @IsString()
  firstName: string;

  @ApiProperty({ example: 'Doe' })
  @IsString()
  lastName: string;

  @ApiProperty({ example: 'john.doe@lalora.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: '+1234567890' })
  @IsString()
  phoneNumber: string;

  @ApiProperty({ enum: UserType, example: 'waiter' })
  @IsEnum(UserType)
  userType: UserType;

  @ApiPropertyOptional({ example: 'Temporal123' })
  @IsOptional()
  @IsString()
  @MinLength(6)
  tempPassword?: string;
}
