import { IsString, IsOptional } from 'class-validator';
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
