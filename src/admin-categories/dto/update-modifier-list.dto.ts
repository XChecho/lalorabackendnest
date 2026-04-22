import { IsString, IsOptional, IsBoolean, IsArray, ValidateNested, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateModifierOptionDto {
  @ApiPropertyOptional({ example: 'Pollo', description: 'Option name' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ example: 0, description: 'Additional price for this option' })
  @IsOptional()
  @IsNumber()
  priceExtra?: number;

  @ApiPropertyOptional({ example: 20, description: 'Stock available for this option' })
  @IsOptional()
  @IsNumber()
  stock?: number;
}

export class UpdateModifierListDto {
  @ApiPropertyOptional({ example: 'Proteína', description: 'List name' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ example: true, description: 'Is selection required' })
  @IsOptional()
  @IsBoolean()
  required?: boolean;

  @ApiPropertyOptional({ example: false, description: 'Can select multiple options' })
  @IsOptional()
  @IsBoolean()
  multiple?: boolean;
}