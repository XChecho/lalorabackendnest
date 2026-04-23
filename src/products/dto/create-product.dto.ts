import {
  IsString,
  IsOptional,
  IsNumber,
  IsBoolean,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateProductDto {
  @ApiProperty({ example: 'Cerveza Poker' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ example: 'Cerveza nacional rubia' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: 2500 })
  @IsNumber()
  @Transform(({ value }) => Number(value))
  price: number;

  @ApiProperty({ example: 'category-uuid' })
  @IsString()
  categoryId: string;

  @ApiPropertyOptional({ example: 'https://...' })
  @IsOptional()
  @IsString()
  image?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  imageId?: string;

  @ApiPropertyOptional({ example: 20 })
  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => Number(value))
  stock?: number;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  available?: boolean;
}

export class UpdateProductDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => Number(value))
  price?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  image?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  imageId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => Number(value))
  stock?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  available?: boolean;
}
