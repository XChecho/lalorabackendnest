import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { LoggerService } from '../common/logger/logger.service';
import { Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly logger: LoggerService,
  ) {}

  async findByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
    });
  }

  async findById(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phoneNumber: true,
        role: true,
        active: true,
        birthdate: true,
        entryDate: true,
        companyId: true,
        createdAt: true,
        updatedAt: true,
      },
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

  async findRecent(limit = 3) {
    this.logger.debug(`Fetching ${limit} most recent users`);
    return this.prisma.user.findMany({
      take: limit,
      orderBy: { createdAt: 'desc' },
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

  async update(id: string, data: UpdateUserDto) {
    this.logger.debug(`Updating user ${id}`, { userId: id });

    const existingUser = await this.prisma.user.findUnique({ where: { id } });
    if (!existingUser) {
      this.logger.error(`User with id ${id} not found`);
      throw new NotFoundException(`User with id ${id} not found`);
    }

    if (data.email && data.email !== existingUser.email) {
      const emailInUse = await this.prisma.user.findUnique({
        where: { email: data.email },
      });
      if (emailInUse) {
        this.logger.error(`Email ${data.email} already in use`);
        throw new BadRequestException('Email already in use by another user');
      }
    }

    const updateData: Record<string, unknown> = {};
    if (data.firstName !== undefined) updateData.firstName = data.firstName;
    if (data.lastName !== undefined) updateData.lastName = data.lastName;
    if (data.email !== undefined) updateData.email = data.email;
    if (data.phoneNumber !== undefined)
      updateData.phoneNumber = data.phoneNumber;
    if (data.birthdate !== undefined)
      updateData.birthdate = new Date(data.birthdate);
    if (data.entryDate !== undefined)
      updateData.entryDate = new Date(data.entryDate);

    const updatedUser = await this.prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phoneNumber: true,
        role: true,
        active: true,
        birthdate: true,
        entryDate: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    this.logger.log(`User ${id} updated successfully`);
    return updatedUser;
  }

  async updateRole(id: string, role: Role) {
    this.logger.debug(`Updating role for user ${id} to ${role}`, {
      userId: id,
      role,
    });

    const existingUser = await this.prisma.user.findUnique({ where: { id } });
    if (!existingUser) {
      this.logger.error(`User with id ${id} not found`);
      throw new NotFoundException(`User with id ${id} not found`);
    }

    const validRoles: Role[] = ['ADMIN', 'CASHIER', 'KITCHEN', 'WAITRESS'];
    if (!validRoles.includes(role)) {
      this.logger.error(`Invalid role: ${role}`);
      throw new BadRequestException(`Invalid role: ${role}`);
    }

    const updatedUser = await this.prisma.user.update({
      where: { id },
      data: { role },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        active: true,
        createdAt: true,
      },
    });

    this.logger.log(`Role for user ${id} changed to ${role}`);
    return updatedUser;
  }

  async updateStatus(id: string, active: boolean) {
    this.logger.debug(
      `Updating status for user ${id} to ${active ? 'active' : 'inactive'}`,
      { userId: id, active },
    );

    const existingUser = await this.prisma.user.findUnique({ where: { id } });
    if (!existingUser) {
      this.logger.error(`User with id ${id} not found`);
      throw new NotFoundException(`User with id ${id} not found`);
    }

    const updatedUser = await this.prisma.user.update({
      where: { id },
      data: { active },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        active: true,
        createdAt: true,
      },
    });

    this.logger.log(
      `User ${id} status changed to ${active ? 'active' : 'inactive'}`,
    );
    return updatedUser;
  }

  async resetPasswordById(id: string) {
    this.logger.debug(`Resetting password for user ${id}`, { userId: id });

    const existingUser = await this.prisma.user.findUnique({ where: { id } });
    if (!existingUser) {
      this.logger.error(`User with id ${id} not found`);
      throw new NotFoundException(`User with id ${id} not found`);
    }

    const defaultPassword = 'ChangeMe123';
    const hashedPassword = await bcrypt.hash(defaultPassword, 10);

    await this.prisma.user.update({
      where: { id },
      data: { password: hashedPassword },
    });

    this.logger.log(`Password reset for user ${id}`);
    return { success: true, message: 'Password reset to default' };
  }
}
