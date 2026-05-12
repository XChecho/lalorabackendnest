import { IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateUserStatusDto {
  @ApiProperty({ example: true, description: 'Whether the user is active' })
  @IsBoolean()
  active: boolean;
}
