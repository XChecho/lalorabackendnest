import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateOrderStatusDto {
  @ApiProperty({ example: 'CONFIRMED' })
  @IsString()
  status: string;
}
