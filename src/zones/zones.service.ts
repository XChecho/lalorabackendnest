import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreateZoneDto, UpdateZoneDto } from './dto/create-zone.dto';

export interface ZoneWithTableCount {
  id: string;
  name: string;
  icon: string;
  _count: { tables: number };
}

@Injectable()
export class ZonesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(): Promise<ZoneWithTableCount[]> {
    return this.prisma.zone.findMany({
      include: {
        _count: {
          select: { tables: true },
        },
      },
      orderBy: { name: 'asc' },
    });
  }

  async findById(id: string) {
    const zone = await this.prisma.zone.findUnique({
      where: { id },
      include: {
        tables: true,
      },
    });
    if (!zone) {
      throw new NotFoundException(`Zone with id ${id} not found`);
    }
    return zone;
  }

  async create(data: CreateZoneDto) {
    return this.prisma.zone.create({
      data: {
        name: data.name,
        icon: data.icon || 'restaurant',
      },
    });
  }

  async update(id: string, data: UpdateZoneDto) {
    await this.findById(id);
    return this.prisma.zone.update({
      where: { id },
      data: {
        name: data.name,
        icon: data.icon,
      },
    });
  }

  async delete(id: string) {
    await this.findById(id);
    await this.prisma.table.deleteMany({ where: { zoneId: id } });
    return this.prisma.zone.delete({ where: { id } });
  }
}