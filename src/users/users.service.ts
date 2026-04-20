import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
    });
  }

  async findById(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });
    if (!user) {
      throw new NotFoundException(`User with id ${id} not found`);
    }
    return user;
  }

  async findAll() {
    return this.prisma.user.findMany({
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phoneNumber: true,
        role: true,
        active: true,
        createdAt: true,
      },
    });
  }

  async create(data: {
    email: string;
    password: string;
    name: string;
    firstName: string;
    lastName: string;
    phoneNumber: string;
    role: any;
  }) {
    const hashedPassword = await bcrypt.hash(data.password, 10);
    return this.prisma.user.create({
      data: {
        email: data.email,
        password: hashedPassword,
        name: data.name,
        firstName: data.firstName,
        lastName: data.lastName,
        phoneNumber: data.phoneNumber,
        role: data.role,
      },
    });
  }

  async validatePassword(
    user: { password: string },
    plainPassword: string,
  ): Promise<boolean> {
    return bcrypt.compare(plainPassword, user.password);
  }

  async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 10);
  }

  async setRecoverCode(email: string, code: string) {
    const expires = new Date();
    expires.setMinutes(expires.getMinutes() + 15);

    return this.prisma.user.update({
      where: { email },
      data: {
        recoverCode: code,
        recoverCodeExpires: expires,
      },
    });
  }

  async findByRecoverCode(email: string, code: string) {
    return this.prisma.user.findFirst({
      where: {
        email,
        recoverCode: code,
        recoverCodeExpires: {
          gt: new Date(),
        },
      },
    });
  }

  async resetPassword(email: string, newPassword: string) {
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    return this.prisma.user.update({
      where: { email },
      data: {
        password: hashedPassword,
        recoverCode: null,
        recoverCodeExpires: null,
      },
    });
  }
}
