import { IsString, IsNotEmpty, IsEmail, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateUserDto {
  @ApiProperty({ example: 'John' })
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @ApiProperty({ example: 'Doe' })
  @IsString()
  @IsNotEmpty()
  lastName: string;

  @ApiProperty({ example: 'john.doe@lalora.com' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiPropertyOptional({ example: '+1234567890' })
  @IsString()
  @IsOptional()
  phoneNumber?: string;

  @ApiPropertyOptional({
    example: '1990-01-15',
    description: 'ISO date format (YYYY-MM-DD)',
  })
  @IsString()
  @IsOptional()
  birthdate?: string;

  @ApiPropertyOptional({
    example: '2024-03-01',
    description: 'ISO date format (YYYY-MM-DD)',
  })
  @IsString()
  @IsOptional()
  entryDate?: string;
}
