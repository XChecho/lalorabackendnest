import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreateProductDto, UpdateProductDto } from './dto/create-product.dto';

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  async findByCategory(categoryId: string) {
    return this.prisma.product.findMany({
      where: { categoryId },
      include: { modifiers: true },
    });
  }

  async findById(id: string) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: { category: true, modifiers: true },
    });
    if (!product) {
      throw new NotFoundException(`Product with id ${id} not found`);
    }
    return product;
  }

  async create(data: CreateProductDto) {
    return this.prisma.product.create({
      data: {
        name: data.name,
        description: data.description,
        price: data.price,
        categoryId: data.categoryId,
        image: data.image,
        available: data.available ?? true,
      },
    });
  }

  async update(id: string, data: UpdateProductDto) {
    await this.findById(id);
    return this.prisma.product.update({
      where: { id },
      data: {
        name: data.name,
        description: data.description,
        price: data.price,
        image: data.image,
        available: data.available,
      },
    });
  }

  async delete(id: string) {
    await this.findById(id);
    await this.prisma.productModifier.deleteMany({ where: { productId: id } });
    return this.prisma.product.delete({ where: { id } });
  }
}
