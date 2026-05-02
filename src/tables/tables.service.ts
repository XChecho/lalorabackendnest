import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class TablesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.table.findMany({
      include: { zone: true },
      orderBy: [{ zone: { name: 'asc' } }, { name: 'asc' }],
    });
  }

  async findByZone(zoneId: string) {
    return this.prisma.table.findMany({
      where: { zoneId },
      include: { zone: true },
      orderBy: { name: 'asc' },
    });
  }
}
