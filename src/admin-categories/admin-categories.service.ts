import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import {
  CreateModifierListDto,
  CreateModifierOptionDto,
} from './dto/create-modifier-list.dto';
import { UpdateModifierListDto, UpdateModifierOptionDto } from './dto/update-modifier-list.dto';

@Injectable()
export class AdminCategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    const categories = await this.prisma.category.findMany({
      include: {
        _count: {
          select: { products: true },
        },
      },
      orderBy: { displayOrder: 'asc' },
    });

    return categories.map((category) => ({
      id: category.id,
      name: category.name,
      productsCount: category._count.products,
      enabled: category.active,
    }));
  }

  async findById(id: string) {
    const category = await this.prisma.category.findUnique({
      where: { id },
      include: {
        _count: {
          select: { products: true },
        },
        modifierLists: {
          include: {
            options: true,
          },
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!category) {
      throw new NotFoundException(`Category with id ${id} not found`);
    }

    return {
      id: category.id,
      name: category.name,
      productsCount: category._count.products,
      enabled: category.active,
      modifiers: category.modifierLists.map((list) => ({
        id: list.id,
        name: list.name,
        required: list.required,
        multiple: list.multiple,
        options: list.options.map((opt) => ({
          id: opt.id,
          name: opt.name,
          priceExtra: opt.priceExtra,
        })),
      })),
    };
  }

  async create(data: CreateCategoryDto) {
    const category = await this.prisma.category.create({
      data: {
        name: data.name,
        description: data.description,
        icon: data.icon || 'restaurant',
        displayOrder: data.displayOrder || 0,
      },
    });

    return {
      id: category.id,
      name: category.name,
      productsCount: 0,
      enabled: category.active,
    };
  }

  async update(id: string, data: UpdateCategoryDto) {
    await this.findById(id);

    const category = await this.prisma.category.update({
      where: { id },
      data: {
        name: data.name,
        description: data.description,
        icon: data.icon,
        displayOrder: data.displayOrder,
      },
    });

    const productsCount = await this.prisma.product.count({
      where: { categoryId: id },
    });

    return {
      id: category.id,
      name: category.name,
      productsCount,
      enabled: category.active,
    };
  }

  async toggleStatus(id: string, enabled: boolean) {
    await this.findById(id);

    const category = await this.prisma.category.update({
      where: { id },
      data: { active: enabled },
    });

    const productsCount = await this.prisma.product.count({
      where: { categoryId: id },
    });

    return {
      id: category.id,
      name: category.name,
      productsCount,
      enabled: category.active,
    };
  }

  async remove(id: string) {
    await this.findById(id);

    const category = await this.prisma.category.update({
      where: { id },
      data: { active: false },
    });

    return {
      id: category.id,
      name: category.name,
      productsCount: 0,
      enabled: category.active,
    };
  }

  async findModifierListById(listId: string) {
    const list = await this.prisma.categoryModifierList.findUnique({
      where: { id: listId },
      include: { options: true },
    });

    if (!list) {
      throw new NotFoundException(`Modifier list with id ${listId} not found`);
    }

    return list;
  }

  async createModifierList(categoryId: string, data: CreateModifierListDto) {
    const category = await this.prisma.category.findUnique({
      where: { id: categoryId },
    });

    if (!category) {
      throw new NotFoundException(`Category with id ${categoryId} not found`);
    }

    const list = await this.prisma.categoryModifierList.create({
      data: {
        name: data.name,
        required: data.required || false,
        multiple: data.multiple || false,
        categoryId,
        options: data.options
          ? {
              create: data.options.map((opt) => ({
                name: opt.name,
                priceExtra: opt.priceExtra || 0,
              })),
            }
          : undefined,
      },
      include: {
        options: true,
      },
    });

    return {
      id: list.id,
      name: list.name,
      required: list.required,
      multiple: list.multiple,
      options: list.options.map((opt) => ({
        id: opt.id,
        name: opt.name,
        priceExtra: opt.priceExtra,
      })),
    };
  }

  async updateModifierList(listId: string, data: UpdateModifierListDto) {
    await this.findModifierListById(listId);

    const list = await this.prisma.categoryModifierList.update({
      where: { id: listId },
      data: {
        name: data.name,
        required: data.required,
        multiple: data.multiple,
      },
      include: {
        options: true,
      },
    });

    return {
      id: list.id,
      name: list.name,
      required: list.required,
      multiple: list.multiple,
      options: list.options.map((opt) => ({
        id: opt.id,
        name: opt.name,
        priceExtra: opt.priceExtra,
      })),
    };
  }

  async deleteModifierList(listId: string) {
    await this.findModifierListById(listId);

    await this.prisma.categoryModifierList.delete({
      where: { id: listId },
    });

    return { message: 'Modifier list deleted' };
  }

  async createModifierOption(listId: string, optionData: CreateModifierOptionDto) {
    await this.findModifierListById(listId);

    const option = await this.prisma.categoryModifierOption.create({
      data: {
        name: optionData.name,
        priceExtra: optionData.priceExtra || 0,
        modifierListId: listId,
      },
    });

    return {
      id: option.id,
      name: option.name,
      priceExtra: option.priceExtra,
    };
  }

  async updateModifierOption(optionId: string, data: UpdateModifierOptionDto) {
    const option = await this.prisma.categoryModifierOption.findUnique({
      where: { id: optionId },
    });

    if (!option) {
      throw new NotFoundException(`Modifier option with id ${optionId} not found`);
    }

    const updated = await this.prisma.categoryModifierOption.update({
      where: { id: optionId },
      data: {
        name: data.name,
        priceExtra: data.priceExtra,
      },
    });

    return {
      id: updated.id,
      name: updated.name,
      priceExtra: updated.priceExtra,
    };
  }

  async deleteModifierOption(optionId: string) {
    const option = await this.prisma.categoryModifierOption.findUnique({
      where: { id: optionId },
    });

    if (!option) {
      throw new NotFoundException(`Modifier option with id ${optionId} not found`);
    }

    await this.prisma.categoryModifierOption.delete({
      where: { id: optionId },
    });

    return { message: 'Modifier option deleted' };
  }
}
