import { IsString, IsOptional, IsNumber } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateCategoryDto {
  @ApiProperty({ example: 'Bebidas', description: 'Category name' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ example: 'Bebidas frías y calientes' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: 'local_bar' })
  @IsOptional()
  @IsString()
  icon?: string;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @IsNumber()
  displayOrder?: number;
}
