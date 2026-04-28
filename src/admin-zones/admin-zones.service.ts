import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import {
  CreateZoneDto,
  UpdateZoneDto,
  AddTablesDto,
  UpdateTableDto,
} from './dto';

@Injectable()
export class AdminZonesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.zone.findMany({
      include: {
        tables: {
          orderBy: { name: 'asc' },
        },
        _count: {
          select: { tables: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findById(id: string) {
    const zone = await this.prisma.zone.findUnique({
      where: { id },
      include: {
        tables: {
          orderBy: { name: 'asc' },
        },
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

  async addTables(zoneId: string, data: AddTablesDto) {
    const zone = await this.findById(zoneId);

    const existingTablesCount = zone.tables.length;
    const tablesToCreate: { name: string; capacity: number }[] = [];

    for (let i = 1; i <= data.quantity; i++) {
      const tableNumber = existingTablesCount + i;
      tablesToCreate.push({
        name: `Mesa ${String(tableNumber).padStart(2, '0')}`,
        capacity: 4,
      });
    }

    await this.prisma.table.createMany({
      data: tablesToCreate.map((table) => ({
        name: table.name,
        capacity: table.capacity,
        zoneId,
      })),
    });

    return this.findById(zoneId);
  }

  async addTable(zoneId: string, data?: UpdateTableDto) {
    const zone = await this.findById(zoneId);
    const existingCount = zone.tables.length;
    const tableNumber = existingCount + 1;

    return this.prisma.table.create({
      data: {
        name: data?.name || `Mesa ${String(tableNumber).padStart(2, '0')}`,
        capacity: data?.capacity || 4,
        zoneId,
      },
    });
  }

  async removeTable(zoneId: string, tableId: string) {
    await this.findById(zoneId);

    const table = await this.prisma.table.findUnique({
      where: { id: tableId },
    });

    if (!table || table.zoneId !== zoneId) {
      throw new NotFoundException(`Table with id ${tableId} not found in zone`);
    }

    return this.prisma.table.delete({ where: { id: tableId } });
  }

  async toggleTableStatus(
    zoneId: string,
    tableId: string,
    status: 'AVAILABLE' | 'OCCUPIED' | 'RESERVED',
  ) {
    await this.findById(zoneId);

    const table = await this.prisma.table.findUnique({
      where: { id: tableId },
    });

    if (!table || table.zoneId !== zoneId) {
      throw new NotFoundException(`Table with id ${tableId} not found in zone`);
    }

    return this.prisma.table.update({
      where: { id: tableId },
      data: { status },
    });
  }
}
