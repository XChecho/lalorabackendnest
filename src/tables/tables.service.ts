import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreateTableDto } from './dto/create-table.dto';
import { TableStatus } from '@prisma/client';

@Injectable()
export class TablesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.table.findMany({
      include: { zone: true },
      orderBy: [
        { zone: { name: 'asc' } },
        { name: 'asc' },
      ],
    });
  }

  async findByZone(zoneId: string) {
    return this.prisma.table.findMany({
      where: { zoneId },
      include: { zone: true },
      orderBy: { name: 'asc' },
    });
  }

  async findById(id: string) {
    const table = await this.prisma.table.findUnique({
      where: { id },
      include: { zone: true },
    });
    if (!table) {
      throw new NotFoundException(`Table with id ${id} not found`);
    }
    return table;
  }

  async create(data: CreateTableDto) {
    const count = await this.prisma.table.count({
      where: { zoneId: data.zoneId },
    });
    if (count >= 30) {
      throw new BadRequestException('Maximum 30 tables per zone');
    }
    return this.prisma.table.create({
      data: {
        name: data.name,
        capacity: 4,
        zoneId: data.zoneId,
      },
    });
  }

  async updateStatus(id: string, status: TableStatus) {
    await this.findById(id);
    return this.prisma.table.update({
      where: { id },
      data: { status },
    });
  }

  async delete(id: string) {
    await this.findById(id);
    return this.prisma.table.delete({ where: { id } });
  }
}