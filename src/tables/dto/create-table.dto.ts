import { IsString, IsNotEmpty, IsOptional, IsNumber, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateTableDto {
  @ApiProperty({ example: 'Mesa 1' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'zone-uuid' })
  @IsString()
  @IsNotEmpty()
  zoneId: string;

  @ApiPropertyOptional({ example: 4 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  capacity?: number;
}