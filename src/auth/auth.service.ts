import {
  Injectable,
  UnauthorizedException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { MailService } from '../mail/mail.service';
import { LoginDto } from './dto/login.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { RecoverPasswordDto } from './dto/recover-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { Role } from '@prisma/client';

function generateRecoverCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly mailService: MailService,
  ) {}

  async login(loginDto: LoginDto) {
    const user = await this.usersService.findByEmail(loginDto.email);

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.active) {
      throw new UnauthorizedException('User account is inactive');
    }

    const isPasswordValid = await this.usersService.validatePassword(
      user,
      loginDto.password,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    return {
      access_token: this.jwtService.sign(payload),
      firstName: user.firstName,
      lastName: user.lastName,
      userType: user.role.toLowerCase(),
    };
  }

  async createUser(createUserDto: CreateUserDto, adminEmail: string) {
    try {
      const admin = await this.usersService.findByEmail(adminEmail);
      if (!admin || admin.role !== Role.ADMIN) {
        throw new UnauthorizedException('Only admins can create users');
      }

      const existingUser = await this.usersService.findByEmail(
        createUserDto.email,
      );
      if (existingUser) {
        throw new BadRequestException('Email already exists');
      }

      const tempPassword = createUserDto.tempPassword || 'ChangeMe123';

      const roleMap: Record<string, any> = {
        admin: 'ADMIN',
        kitchen: 'KITCHEN',
        cashier: 'CASHIER',
        waiter: 'WAITRESS',
        cancha_manager: 'CANCHA_MANAGER',
      };

      const user = await this.usersService.create({
        email: createUserDto.email,
        password: tempPassword,
        name: `${createUserDto.firstName} ${createUserDto.lastName}`,
        firstName: createUserDto.firstName,
        lastName: createUserDto.lastName,
        phoneNumber: createUserDto.phoneNumber,
        role: roleMap[createUserDto.userType] || 'WAITRESS',
      });

      return {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        phoneNumber: user.phoneNumber,
        userType: user.role,
      };
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }

  async recoverPassword(recoverDto: RecoverPasswordDto) {
    const user = await this.usersService.findByEmail(recoverDto.email);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const code = generateRecoverCode();
    await this.usersService.setRecoverCode(recoverDto.email, code);
    await this.mailService.sendRecoverCode(recoverDto.email, code);

    return { message: 'Recovery code sent to email' };
  }

  async resetPassword(resetDto: ResetPasswordDto) {
    const user = await this.usersService.findByRecoverCode(
      resetDto.email,
      resetDto.code,
    );

    if (!user) {
      throw new BadRequestException('Invalid or expired code');
    }

    await this.usersService.resetPassword(resetDto.email, resetDto.newPassword);

    return { message: 'Password reset successfully' };
  }

  async devLogin(email: string) {
    const user = await this.usersService.findByEmail(email);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (!user.active) {
      throw new UnauthorizedException('User is inactive');
    }

    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    return {
      access_token: this.jwtService.sign(payload),
      role: user.role,
    };
  }
}
