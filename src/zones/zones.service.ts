import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

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
}
