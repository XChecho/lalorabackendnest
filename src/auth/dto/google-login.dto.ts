import { IsString, IsEmail, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class GoogleLoginDto {
  @ApiProperty({ example: 'eyJhbGciOiJSUzI1NiIsImtpZCI6...' })
  @IsString()
  idToken: string;

  @ApiProperty({ example: 'user@gmail.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'John Doe' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ example: 'https://lh3.googleusercontent.com/...' })
  @IsOptional()
  @IsString()
  picture?: string;
}
