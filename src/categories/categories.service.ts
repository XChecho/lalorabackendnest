import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class CategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.category.findMany({
      include: {
        _count: {
          select: { products: true },
        },
      },
      orderBy: { displayOrder: 'asc' },
    });
  }

  async findAllWithProducts() {
    return this.prisma.category.findMany({
      where: { active: true },
      include: {
        modifierLists: {
          include: { options: true },
        },
        products: {
          where: { available: true },
          include: {
            modifiers: true,
            category: {
              include: {
                modifierLists: {
                  include: { options: true },
                },
              },
            },
          },
        },
      },
      orderBy: { displayOrder: 'asc' },
    });
  }

  async findById(id: string) {
    const category = await this.prisma.category.findUnique({
      where: { id },
      include: { products: true },
    });
    if (!category) {
      throw new NotFoundException(`Category with id ${id} not found`);
    }
    return category;
  }
}
