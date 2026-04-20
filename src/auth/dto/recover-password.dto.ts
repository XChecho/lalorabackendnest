import { IsEmail } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RecoverPasswordDto {
  @ApiProperty({ example: 'john.doe@lalora.com' })
  @IsEmail()
  email: string;
}
