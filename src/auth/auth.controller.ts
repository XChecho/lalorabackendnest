import {
  Controller,
  Post,
  Body,
  UseGuards,
  Get,
  Req,
  UnauthorizedException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiCreatedResponse,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { RecoverPasswordDto } from './dto/recover-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { Request } from 'express';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @ApiOperation({ summary: 'User login' })
  login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Post('create-user')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new user (admin only)' })
  @ApiCreatedResponse({ description: 'User created successfully' })
  createUser(@Body() createUserDto: CreateUserDto, @Req() req: any) {
    const adminEmail = req.user?.email as string;
    if (!adminEmail) {
      throw new UnauthorizedException('Invalid token');
    }
    return this.authService.createUser(createUserDto, adminEmail);
  }

  @Post('recover-password')
  @ApiOperation({ summary: 'Send recovery code to email' })
  recoverPassword(@Body() recoverDto: RecoverPasswordDto) {
    return this.authService.recoverPassword(recoverDto);
  }

  @Post('reset-password')
  @ApiOperation({ summary: 'Reset password with code' })
  resetPassword(@Body() resetDto: ResetPasswordDto) {
    return this.authService.resetPassword(resetDto);
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user profile' })
  getProfile(@Req() req: Request & { user: Record<string, unknown> }) {
    return req.user;
  }
}
