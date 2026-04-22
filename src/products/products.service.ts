import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CloudinaryService } from '../common/cloudinary/cloudinary.service';
import { CreateProductDto, UpdateProductDto } from './dto/create-product.dto';

@Injectable()
export class ProductsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cloudinary: CloudinaryService,
  ) {}

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

  async create(data: CreateProductDto & { imageBuffer?: Buffer; imageUrl?: string }) {
    let imageUrl = data.image;
    let imageId = data.imageId;

    if (data.imageBuffer) {
      const result = await this.cloudinary.uploadImage(data.imageBuffer, 'products');
      imageUrl = result.secureUrl;
      imageId = result.publicId;
    } else if (data.imageUrl) {
      const result = await this.cloudinary.uploadImage(data.imageUrl, 'products');
      imageUrl = result.secureUrl;
      imageId = result.publicId;
    }

    const stock = data.stock ?? 0;
    const available = stock > 0 ? (data.available ?? true) : false;

    return this.prisma.product.create({
      data: {
        name: data.name,
        description: data.description,
        price: data.price,
        categoryId: data.categoryId,
        image: imageUrl,
        imageId: imageId,
        stock,
        available,
      },
    });
  }

  async update(id: string, data: UpdateProductDto & { imageBuffer?: Buffer; imageUrl?: string }) {
    await this.findById(id);

    let imageUrl = data.image;
    let imageId = data.imageId;

    if (data.imageBuffer) {
      const existing = await this.prisma.product.findUnique({ where: { id } });
      if (existing?.imageId) {
        await this.cloudinary.deleteImage(existing.imageId);
      }
      const result = await this.cloudinary.uploadImage(data.imageBuffer, 'products');
      imageUrl = result.secureUrl;
      imageId = result.publicId;
    } else if (data.imageUrl && data.imageUrl !== data.image) {
      const existing = await this.prisma.product.findUnique({ where: { id } });
      if (existing?.imageId) {
        await this.cloudinary.deleteImage(existing.imageId);
      }
      const result = await this.cloudinary.uploadImage(data.imageUrl, 'products');
      imageUrl = result.secureUrl;
      imageId = result.publicId;
    }

    const stock = data.stock !== undefined ? data.stock : undefined;
    const available = stock !== undefined ? stock > 0 : data.available;

    return this.prisma.product.update({
      where: { id },
      data: {
        name: data.name,
        description: data.description,
        price: data.price,
        image: imageUrl,
        imageId: imageId,
        stock: data.stock,
        available,
      },
    });
  }

  async delete(id: string) {
    const product = await this.findById(id);
    if (product.imageId) {
      await this.cloudinary.deleteImage(product.imageId);
    }
    await this.prisma.productModifier.deleteMany({ where: { productId: id } });
    return this.prisma.product.delete({ where: { id } });
  }

  async findAll() {
    return this.prisma.product.findMany({
      include: { category: true, modifiers: true },
      orderBy: { name: 'asc' },
    });
  }

  async toggleStatus(id: string, enabled: boolean) {
    await this.findById(id);
    return this.prisma.product.update({
      where: { id },
      data: { available: enabled },
    });
  }

  async updateStock(id: string, quantity: number) {
    const product = await this.findById(id);
    const newStock = Math.max(0, product.stock + quantity);
    const available = newStock > 0 && product.available;

    return this.prisma.product.update({
      where: { id },
      data: {
        stock: newStock,
        available,
      },
    });
  }

  async restockAll(categoryId?: string) {
    const products = await this.prisma.product.findMany({
      where: categoryId ? { categoryId } : undefined,
    });

    const updates = await Promise.all(
      products.map((product) =>
        this.prisma.product.update({
          where: { id: product.id },
          data: { available: product.stock > 0 },
        }),
      ),
    );

    return { restocked: updates.length };
  }
}