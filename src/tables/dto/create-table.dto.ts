import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateTableDto {
  @ApiProperty({ example: 'Mesa 1' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'zone-uuid' })
  @IsString()
  @IsNotEmpty()
  zoneId: string;
}
