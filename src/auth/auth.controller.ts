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
import { RefreshTokenGuard } from './guards/refresh-token.guard';

interface DevLoginDto {
  email: string;
}

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

  @Post('dev-login')
  @ApiOperation({ summary: 'Dev login - localhost only' })
  devLogin(@Body() devLoginDto: DevLoginDto, @Req() req: any) {
    const env = process.env.NODE_ENV || 'production';
    const allowDevLoginAnywhere = process.env.ALLOW_DEV_LOGIN === 'true';
    if (allowDevLoginAnywhere || env === 'development') {
      return this.authService.devLogin(devLoginDto.email);
    }
    const forwardedFor = req.headers['x-forwarded-for'];
    const ipFromHeader =
      typeof forwardedFor === 'string'
        ? forwardedFor.split(',')[0].trim()
        : Array.isArray(forwardedFor)
          ? forwardedFor[0]
          : null;
    const ip = req.ip || req.socket?.remoteAddress || ipFromHeader || 'unknown';
    const isLocalhost =
      ip === '127.0.0.1' ||
      ip === '::1' ||
      ip === '::ffff:127.0.0.1' ||
      ip?.startsWith('127.') ||
      ip?.startsWith('172.17.') ||
      ip?.startsWith('172.18.') ||
      ip?.startsWith('172.19.') ||
      ip?.startsWith('172.16.') ||
      ip === 'localhost';
    if (!isLocalhost || ip === 'unknown') {
      console.log('Dev login blocked - IP:', ip);
      throw new UnauthorizedException(
        'Dev login only available from localhost',
      );
    }
    return this.authService.devLogin(devLoginDto.email);
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user profile' })
  getProfile(@Req() req: Request & { user: Record<string, unknown> }) {
    return req.user;
  }

  @Post('refresh')
  @UseGuards(RefreshTokenGuard)
  @ApiOperation({ summary: 'Refresh access token using refresh token' })
  refreshToken(@Req() req: any) {
    return this.authService.refreshToken(req.user.userId);
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Logout and revoke refresh tokens' })
  logout(@Req() req: any) {
    const userId = req.user?.sub as string;
    if (!userId) {
      throw new UnauthorizedException('Invalid token');
    }
    return this.authService.logout(userId);
  }
}
