import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { UpdateTableDto, ToggleTableStatusDto } from '../admin-zones/dto';

@Injectable()
export class AdminTablesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.table.findMany({
      include: {
        zone: true,
      },
      orderBy: [
        { zone: { name: 'asc' } },
        { name: 'asc' },
      ],
    });
  }

  async findById(id: string) {
    const table = await this.prisma.table.findUnique({
      where: { id },
      include: {
        zone: true,
      },
    });
    if (!table) {
      throw new NotFoundException(`Table with id ${id} not found`);
    }
    return table;
  }

  async update(id: string, data: UpdateTableDto) {
    await this.findById(id);
    return this.prisma.table.update({
      where: { id },
      data: {
        name: data.name,
        capacity: data.capacity,
      },
    });
  }

  async updateStatus(id: string, status: 'AVAILABLE' | 'OCCUPIED' | 'RESERVED') {
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

  async findByZone(zoneId: string) {
    const zone = await this.prisma.zone.findUnique({
      where: { id: zoneId },
    });
    if (!zone) {
      throw new NotFoundException(`Zone with id ${zoneId} not found`);
    }
    return this.prisma.table.findMany({
      where: { zoneId },
      orderBy: { name: 'asc' },
    });
  }

  async create(data: { zoneId: string; name: string; capacity: number }) {
    const zone = await this.prisma.zone.findUnique({ where: { id: data.zoneId } });
    if (!zone) {
      throw new NotFoundException(`Zone with id ${data.zoneId} not found`);
    }
    return this.prisma.table.create({
      data: {
        name: data.name,
        capacity: data.capacity,
        zoneId: data.zoneId,
      },
    });
  }
}