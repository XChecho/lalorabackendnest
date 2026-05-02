import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { AdminCategoriesService } from './admin-categories.service';
import { PrismaService } from '../prisma.service';
import { createMockPrismaService } from '../__mocks__/prisma.mock';
import { AdminCreateCategoryDto, AdminUpdateCategoryDto } from './dto';
import { CreateModifierListDto, CreateModifierOptionDto } from './dto/create-modifier-list.dto';
import { UpdateModifierListDto, UpdateModifierOptionDto } from './dto/update-modifier-list.dto';

describe('AdminCategoriesService', () => {
  let service: AdminCategoriesService;
  let prisma: ReturnType<typeof createMockPrismaService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminCategoriesService,
        { provide: PrismaService, useValue: createMockPrismaService() },
      ],
    }).compile();

    service = module.get<AdminCategoriesService>(AdminCategoriesService);
    prisma = module.get(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('debería listar todas las categorías con conteo de productos', async () => {
      const mockCategories = [
        {
          id: 'cat-1',
          name: 'Bebidas',
          active: true,
          displayOrder: 1,
          _count: { products: 5 },
        },
        {
          id: 'cat-2',
          name: 'Comidas',
          active: false,
          displayOrder: 2,
          _count: { products: 10 },
        },
      ];

      prisma.category.findMany.mockResolvedValue(mockCategories);

      const result = await service.findAll();

      expect(prisma.category.findMany).toHaveBeenCalledWith({
        include: {
          _count: {
            select: { products: true },
          },
        },
        orderBy: { displayOrder: 'asc' },
      });
      expect(result).toEqual([
        { id: 'cat-1', name: 'Bebidas', productsCount: 5, enabled: true },
        { id: 'cat-2', name: 'Comidas', productsCount: 10, enabled: false },
      ]);
    });

    it('debería retornar un arreglo vacío si no hay categorías', async () => {
      prisma.category.findMany.mockResolvedValue([]);

      const result = await service.findAll();

      expect(result).toEqual([]);
    });
  });

  describe('findById', () => {
    it('debería obtener categoría con modificadores y conteo de productos', async () => {
      const mockCategory = {
        id: 'cat-1',
        name: 'Bebidas',
        active: true,
        _count: { products: 5 },
        modifierLists: [
          {
            id: 'list-1',
            name: 'Tamaño',
            required: true,
            multiple: false,
            affectsKitchen: false,
            options: [
              { id: 'opt-1', name: 'Grande', priceExtra: 2000, stock: 20 },
            ],
          },
        ],
      };

      prisma.category.findUnique.mockResolvedValue(mockCategory);

      const result = await service.findById('cat-1');

      expect(prisma.category.findUnique).toHaveBeenCalledWith({
        where: { id: 'cat-1' },
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
      expect(result).toEqual({
        id: 'cat-1',
        name: 'Bebidas',
        productsCount: 5,
        enabled: true,
        modifiers: [
          {
            id: 'list-1',
            name: 'Tamaño',
            required: true,
            multiple: false,
            affectsKitchen: false,
            options: [
              { id: 'opt-1', name: 'Grande', priceExtra: 2000, stock: 20 },
            ],
          },
        ],
      });
    });

    it('debería lanzar NotFoundException si la categoría no existe', async () => {
      prisma.category.findUnique.mockResolvedValue(null);

      await expect(service.findById('cat-ghost')).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.findById('cat-ghost')).rejects.toThrow(
        'Category with id cat-ghost not found',
      );
    });
  });

  describe('create', () => {
    it('debería crear una categoría nueva con valores por defecto', async () => {
      const createDto: AdminCreateCategoryDto = {
        name: 'Postres',
        description: 'Dulces y postres',
      };

      const mockCreated = {
        id: 'cat-1',
        name: 'Postres',
        description: 'Dulces y postres',
        icon: 'restaurant',
        displayOrder: 0,
        active: true,
      };

      prisma.category.create.mockResolvedValue(mockCreated);

      const result = await service.create(createDto);

      expect(prisma.category.create).toHaveBeenCalledWith({
        data: {
          name: 'Postres',
          description: 'Dulces y postres',
          icon: 'restaurant',
          displayOrder: 0,
        },
      });
      expect(result).toEqual({
        id: 'cat-1',
        name: 'Postres',
        productsCount: 0,
        enabled: true,
      });
    });

    it('debería crear una categoría con valores personalizados', async () => {
      const createDto: AdminCreateCategoryDto = {
        name: 'Bebidas',
        icon: 'local_bar',
        displayOrder: 5,
      };

      const mockCreated = {
        id: 'cat-2',
        name: 'Bebidas',
        description: undefined,
        icon: 'local_bar',
        displayOrder: 5,
        active: true,
      };

      prisma.category.create.mockResolvedValue(mockCreated);

      const result = await service.create(createDto);

      expect(prisma.category.create).toHaveBeenCalledWith({
        data: {
          name: 'Bebidas',
          description: undefined,
          icon: 'local_bar',
          displayOrder: 5,
        },
      });
      expect(result).toEqual({
        id: 'cat-2',
        name: 'Bebidas',
        productsCount: 0,
        enabled: true,
      });
    });
  });

  describe('update', () => {
    it('debería actualizar una categoría existente', async () => {
      const updateDto: AdminUpdateCategoryDto = {
        name: 'Bebidas Actualizadas',
        icon: 'local_drink',
      };

      prisma.category.findUnique.mockResolvedValue({
        id: 'cat-1',
        name: 'Bebidas',
        active: true,
        _count: { products: 5 },
        modifierLists: [],
      });

      prisma.category.update.mockResolvedValue({
        id: 'cat-1',
        name: 'Bebidas Actualizadas',
        icon: 'local_drink',
        active: true,
      });

      prisma.product.count.mockResolvedValue(8);

      const result = await service.update('cat-1', updateDto);

      expect(prisma.category.findUnique).toHaveBeenCalledWith({
        where: { id: 'cat-1' },
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
      expect(prisma.category.update).toHaveBeenCalledWith({
        where: { id: 'cat-1' },
        data: {
          name: 'Bebidas Actualizadas',
          description: undefined,
          icon: 'local_drink',
          displayOrder: undefined,
        },
      });
      expect(prisma.product.count).toHaveBeenCalledWith({
        where: { categoryId: 'cat-1' },
      });
      expect(result).toEqual({
        id: 'cat-1',
        name: 'Bebidas Actualizadas',
        productsCount: 8,
        enabled: true,
      });
    });

    it('debería lanzar NotFoundException si la categoría no existe', async () => {
      prisma.category.findUnique.mockResolvedValue(null);

      await expect(
        service.update('cat-ghost', { name: 'Nuevo' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('toggleStatus', () => {
    it('debería activar una categoría', async () => {
      prisma.category.findUnique.mockResolvedValue({
        id: 'cat-1',
        name: 'Bebidas',
        active: false,
        _count: { products: 5 },
        modifierLists: [],
      });

      prisma.category.update.mockResolvedValue({
        id: 'cat-1',
        name: 'Bebidas',
        active: true,
      });

      prisma.product.count.mockResolvedValue(5);

      const result = await service.toggleStatus('cat-1', true);

      expect(prisma.category.update).toHaveBeenCalledWith({
        where: { id: 'cat-1' },
        data: { active: true },
      });
      expect(result).toEqual({
        id: 'cat-1',
        name: 'Bebidas',
        productsCount: 5,
        enabled: true,
      });
    });

    it('debería desactivar una categoría', async () => {
      prisma.category.findUnique.mockResolvedValue({
        id: 'cat-1',
        name: 'Bebidas',
        active: true,
        _count: { products: 5 },
        modifierLists: [],
      });

      prisma.category.update.mockResolvedValue({
        id: 'cat-1',
        name: 'Bebidas',
        active: false,
      });

      prisma.product.count.mockResolvedValue(5);

      const result = await service.toggleStatus('cat-1', false);

      expect(result.enabled).toBe(false);
    });

    it('debería lanzar NotFoundException si la categoría no existe', async () => {
      prisma.category.findUnique.mockResolvedValue(null);

      await expect(service.toggleStatus('cat-ghost', true)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('remove', () => {
    it('debería hacer soft delete desactivando la categoría', async () => {
      prisma.category.findUnique.mockResolvedValue({
        id: 'cat-1',
        name: 'Bebidas',
        active: true,
        _count: { products: 5 },
        modifierLists: [],
      });

      prisma.category.update.mockResolvedValue({
        id: 'cat-1',
        name: 'Bebidas',
        active: false,
      });

      const result = await service.remove('cat-1');

      expect(prisma.category.update).toHaveBeenCalledWith({
        where: { id: 'cat-1' },
        data: { active: false },
      });
      expect(result).toEqual({
        id: 'cat-1',
        name: 'Bebidas',
        productsCount: 0,
        enabled: false,
      });
    });

    it('debería lanzar NotFoundException si la categoría no existe', async () => {
      prisma.category.findUnique.mockResolvedValue(null);

      await expect(service.remove('cat-ghost')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('findModifierListById', () => {
    it('debería obtener una lista de modificadores por ID', async () => {
      const mockList = {
        id: 'list-1',
        name: 'Tamaño',
        required: true,
        options: [
          { id: 'opt-1', name: 'Grande', priceExtra: 2000 },
        ],
      };

      prisma.categoryModifierList.findUnique.mockResolvedValue(mockList);

      const result = await service.findModifierListById('list-1');

      expect(prisma.categoryModifierList.findUnique).toHaveBeenCalledWith({
        where: { id: 'list-1' },
        include: { options: true },
      });
      expect(result).toEqual(mockList);
    });

    it('debería lanzar NotFoundException si la lista no existe', async () => {
      prisma.categoryModifierList.findUnique.mockResolvedValue(null);

      await expect(service.findModifierListById('list-ghost')).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.findModifierListById('list-ghost')).rejects.toThrow(
        'Modifier list with id list-ghost not found',
      );
    });
  });

  describe('createModifierList', () => {
    it('debería crear una lista de modificadores con opciones', async () => {
      const createDto: CreateModifierListDto = {
        name: 'Tamaño',
        required: true,
        multiple: false,
        affectsKitchen: false,
        options: [
          { name: 'Grande', priceExtra: 2000 },
          { name: 'Mediano', priceExtra: 1000 },
        ],
      };

      prisma.category.findUnique.mockResolvedValue({
        id: 'cat-1',
        name: 'Bebidas',
      });

      const mockCreated = {
        id: 'list-1',
        name: 'Tamaño',
        required: true,
        multiple: false,
        affectsKitchen: false,
        options: [
          { id: 'opt-1', name: 'Grande', priceExtra: 2000 },
          { id: 'opt-2', name: 'Mediano', priceExtra: 1000 },
        ],
      };

      prisma.categoryModifierList.create.mockResolvedValue(mockCreated);

      const result = await service.createModifierList('cat-1', createDto);

      expect(prisma.category.findUnique).toHaveBeenCalledWith({
        where: { id: 'cat-1' },
      });
      expect(prisma.categoryModifierList.create).toHaveBeenCalledWith({
        data: {
          name: 'Tamaño',
          required: true,
          multiple: false,
          affectsKitchen: false,
          categoryId: 'cat-1',
          options: {
            create: [
              { name: 'Grande', priceExtra: 2000 },
              { name: 'Mediano', priceExtra: 1000 },
            ],
          },
        },
        include: {
          options: true,
        },
      });
      expect(result).toEqual({
        id: 'list-1',
        name: 'Tamaño',
        required: true,
        multiple: false,
        affectsKitchen: false,
        options: [
          { id: 'opt-1', name: 'Grande', priceExtra: 2000 },
          { id: 'opt-2', name: 'Mediano', priceExtra: 1000 },
        ],
      });
    });

    it('debería crear una lista de modificadores sin opciones', async () => {
      const createDto: CreateModifierListDto = {
        name: 'Extras',
        required: false,
      };

      prisma.category.findUnique.mockResolvedValue({
        id: 'cat-1',
        name: 'Bebidas',
      });

      const mockCreated = {
        id: 'list-2',
        name: 'Extras',
        required: false,
        multiple: false,
        affectsKitchen: false,
        options: [],
      };

      prisma.categoryModifierList.create.mockResolvedValue(mockCreated);

      const result = await service.createModifierList('cat-1', createDto);

      expect(prisma.categoryModifierList.create).toHaveBeenCalledWith({
        data: {
          name: 'Extras',
          required: false,
          multiple: false,
          affectsKitchen: false,
          categoryId: 'cat-1',
          options: undefined,
        },
        include: {
          options: true,
        },
      });
      expect(result.options).toEqual([]);
    });

    it('debería lanzar NotFoundException si la categoría no existe', async () => {
      prisma.category.findUnique.mockResolvedValue(null);

      await expect(
        service.createModifierList('cat-ghost', { name: 'Tamaño' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateModifierList', () => {
    it('debería actualizar una lista de modificadores', async () => {
      const updateDto: UpdateModifierListDto = {
        name: 'Tamaño Grande',
        required: false,
      };

      const mockList = {
        id: 'list-1',
        name: 'Tamaño',
        required: true,
        multiple: false,
        affectsKitchen: false,
        options: [
          { id: 'opt-1', name: 'Grande', priceExtra: 2000 },
        ],
      };

      prisma.categoryModifierList.findUnique.mockResolvedValue(mockList);

      const mockUpdated = {
        ...mockList,
        name: 'Tamaño Grande',
        required: false,
      };

      prisma.categoryModifierList.update.mockResolvedValue(mockUpdated);

      const result = await service.updateModifierList('list-1', updateDto);

      expect(prisma.categoryModifierList.findUnique).toHaveBeenCalledWith({
        where: { id: 'list-1' },
        include: { options: true },
      });
      expect(prisma.categoryModifierList.update).toHaveBeenCalledWith({
        where: { id: 'list-1' },
        data: {
          name: 'Tamaño Grande',
          required: false,
          multiple: undefined,
          affectsKitchen: undefined,
        },
        include: {
          options: true,
        },
      });
      expect(result.name).toBe('Tamaño Grande');
    });

    it('debería lanzar NotFoundException si la lista no existe', async () => {
      prisma.categoryModifierList.findUnique.mockResolvedValue(null);

      await expect(
        service.updateModifierList('list-ghost', { name: 'Nuevo' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('deleteModifierList', () => {
    it('debería eliminar una lista de modificadores', async () => {
      const mockList = {
        id: 'list-1',
        name: 'Tamaño',
        options: [],
      };

      prisma.categoryModifierList.findUnique.mockResolvedValue(mockList);
      prisma.categoryModifierList.delete.mockResolvedValue(mockList);

      const result = await service.deleteModifierList('list-1');

      expect(prisma.categoryModifierList.findUnique).toHaveBeenCalledWith({
        where: { id: 'list-1' },
        include: { options: true },
      });
      expect(prisma.categoryModifierList.delete).toHaveBeenCalledWith({
        where: { id: 'list-1' },
      });
      expect(result).toEqual({ message: 'Modifier list deleted' });
    });

    it('debería lanzar NotFoundException si la lista no existe', async () => {
      prisma.categoryModifierList.findUnique.mockResolvedValue(null);

      await expect(service.deleteModifierList('list-ghost')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('createModifierOption', () => {
    it('debería crear una opción de modificador', async () => {
      const optionDto: CreateModifierOptionDto = {
        name: 'Extra queso',
        priceExtra: 1500,
        stock: 30,
      };

      const mockList = {
        id: 'list-1',
        name: 'Extras',
        options: [],
      };

      const mockCreated = {
        id: 'opt-1',
        name: 'Extra queso',
        priceExtra: 1500,
        stock: 30,
        modifierListId: 'list-1',
      };

      prisma.categoryModifierList.findUnique.mockResolvedValue(mockList);
      prisma.categoryModifierOption.create.mockResolvedValue(mockCreated);

      const result = await service.createModifierOption('list-1', optionDto);

      expect(prisma.categoryModifierList.findUnique).toHaveBeenCalledWith({
        where: { id: 'list-1' },
        include: { options: true },
      });
      expect(prisma.categoryModifierOption.create).toHaveBeenCalledWith({
        data: {
          name: 'Extra queso',
          priceExtra: 1500,
          stock: 30,
          modifierListId: 'list-1',
        },
      });
      expect(result).toEqual({
        id: 'opt-1',
        name: 'Extra queso',
        priceExtra: 1500,
        stock: 30,
      });
    });

    it('debería crear una opción con valores por defecto', async () => {
      const optionDto: CreateModifierOptionDto = {
        name: 'Extra salsa',
      };

      const mockList = {
        id: 'list-1',
        name: 'Extras',
        options: [],
      };

      const mockCreated = {
        id: 'opt-2',
        name: 'Extra salsa',
        priceExtra: 0,
        stock: 20,
        modifierListId: 'list-1',
      };

      prisma.categoryModifierList.findUnique.mockResolvedValue(mockList);
      prisma.categoryModifierOption.create.mockResolvedValue(mockCreated);

      const result = await service.createModifierOption('list-1', optionDto);

      expect(prisma.categoryModifierOption.create).toHaveBeenCalledWith({
        data: {
          name: 'Extra salsa',
          priceExtra: 0,
          stock: 20,
          modifierListId: 'list-1',
        },
      });
      expect(result.stock).toBe(20);
    });

    it('debería lanzar NotFoundException si la lista no existe', async () => {
      prisma.categoryModifierList.findUnique.mockResolvedValue(null);

      await expect(
        service.createModifierOption('list-ghost', { name: 'Extra' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateModifierOption', () => {
    it('debería actualizar una opción de modificador', async () => {
      const updateDto: UpdateModifierOptionDto = {
        name: 'Extra queso grande',
        priceExtra: 2500,
        stock: 50,
      };

      const mockOption = {
        id: 'opt-1',
        name: 'Extra queso',
        priceExtra: 1500,
        stock: 30,
      };

      const mockUpdated = {
        id: 'opt-1',
        name: 'Extra queso grande',
        priceExtra: 2500,
        stock: 50,
      };

      prisma.categoryModifierOption.findUnique.mockResolvedValue(mockOption);
      prisma.categoryModifierOption.update.mockResolvedValue(mockUpdated);

      const result = await service.updateModifierOption('opt-1', updateDto);

      expect(prisma.categoryModifierOption.findUnique).toHaveBeenCalledWith({
        where: { id: 'opt-1' },
      });
      expect(prisma.categoryModifierOption.update).toHaveBeenCalledWith({
        where: { id: 'opt-1' },
        data: {
          name: 'Extra queso grande',
          priceExtra: 2500,
          stock: 50,
        },
      });
      expect(result).toEqual(mockUpdated);
    });

    it('debería lanzar NotFoundException si la opción no existe', async () => {
      prisma.categoryModifierOption.findUnique.mockResolvedValue(null);

      await expect(
        service.updateModifierOption('opt-ghost', { name: 'Nuevo' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('deleteModifierOption', () => {
    it('debería eliminar una opción de modificador', async () => {
      const mockOption = {
        id: 'opt-1',
        name: 'Extra queso',
        priceExtra: 1500,
        stock: 30,
      };

      prisma.categoryModifierOption.findUnique.mockResolvedValue(mockOption);
      prisma.categoryModifierOption.delete.mockResolvedValue(mockOption);

      const result = await service.deleteModifierOption('opt-1');

      expect(prisma.categoryModifierOption.findUnique).toHaveBeenCalledWith({
        where: { id: 'opt-1' },
      });
      expect(prisma.categoryModifierOption.delete).toHaveBeenCalledWith({
        where: { id: 'opt-1' },
      });
      expect(result).toEqual({ message: 'Modifier option deleted' });
    });

    it('debería lanzar NotFoundException si la opción no existe', async () => {
      prisma.categoryModifierOption.findUnique.mockResolvedValue(null);

      await expect(service.deleteModifierOption('opt-ghost')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('restockModifierOption', () => {
    it('debería agregar stock a una opción de modificador', async () => {
      const mockOption = {
        id: 'opt-1',
        name: 'Extra queso',
        priceExtra: 1500,
        stock: 10,
      };

      const mockUpdated = {
        id: 'opt-1',
        name: 'Extra queso',
        priceExtra: 1500,
        stock: 30,
      };

      prisma.categoryModifierOption.findUnique.mockResolvedValue(mockOption);
      prisma.categoryModifierOption.update.mockResolvedValue(mockUpdated);

      const result = await service.restockModifierOption('opt-1', 20);

      expect(prisma.categoryModifierOption.update).toHaveBeenCalledWith({
        where: { id: 'opt-1' },
        data: { stock: 30 },
      });
      expect(result.stock).toBe(30);
    });

    it('debería reducir stock pero no bajar de cero', async () => {
      const mockOption = {
        id: 'opt-1',
        name: 'Extra queso',
        priceExtra: 1500,
        stock: 5,
      };

      const mockUpdated = {
        id: 'opt-1',
        name: 'Extra queso',
        priceExtra: 1500,
        stock: 0,
      };

      prisma.categoryModifierOption.findUnique.mockResolvedValue(mockOption);
      prisma.categoryModifierOption.update.mockResolvedValue(mockUpdated);

      const result = await service.restockModifierOption('opt-1', -10);

      expect(result.stock).toBe(0);
    });

    it('debería lanzar NotFoundException si la opción no existe', async () => {
      prisma.categoryModifierOption.findUnique.mockResolvedValue(null);

      await expect(service.restockModifierOption('opt-ghost', 10)).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
