import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import {
  CreateCategoryDto,
  UpdateCategoryDto,
} from './dto/create-category.dto';

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

  async create(data: CreateCategoryDto) {
    return this.prisma.category.create({
      data: {
        name: data.name,
        description: data.description,
        icon: data.icon || 'restaurant',
        displayOrder: data.displayOrder || 0,
      },
    });
  }

  async update(id: string, data: UpdateCategoryDto) {
    await this.findById(id);
    return this.prisma.category.update({
      where: { id },
      data: {
        name: data.name,
        description: data.description,
        icon: data.icon,
        active: data.active,
        displayOrder: data.displayOrder,
      },
    });
  }

  async delete(id: string) {
    await this.findById(id);
    await this.prisma.product.deleteMany({ where: { categoryId: id } });
    return this.prisma.category.delete({ where: { id } });
  }
}
