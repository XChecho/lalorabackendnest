import { IsString, IsOptional, IsNumber, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateZoneDto {
  @ApiProperty({ example: 'Terraza Principal' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ example: 'restaurant' })
  @IsOptional()
  @IsString()
  icon?: string;
}

export class UpdateZoneDto {
  @ApiPropertyOptional({ example: 'Terraza' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ example: 'leaf' })
  @IsOptional()
  @IsString()
  icon?: string;
}

export class AddTablesDto {
  @ApiProperty({ example: 5, description: 'Number of tables to add' })
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  quantity: number;
}

export class UpdateTableDto {
  @ApiPropertyOptional({ example: 'Mesa 1' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ example: 6 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  capacity?: number;
}

export class ToggleTableStatusDto {
  @ApiProperty({ example: 'OCCUPIED' })
  @IsString()
  status: 'AVAILABLE' | 'OCCUPIED' | 'RESERVED';
}

export class CreateTableDto {
  @ApiProperty({ example: 'zone-uuid' })
  @IsString()
  zoneId: string;

  @ApiProperty({ example: 'Mesa 01' })
  @IsString()
  name: string;

  @ApiProperty({ example: 4 })
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  capacity: number;
}