import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { PrismaService } from '../prisma.service';
import { createMockPrismaService } from '../__mocks__/prisma.mock';

describe('CategoriesService', () => {
  let service: CategoriesService;
  let prisma: ReturnType<typeof createMockPrismaService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CategoriesService,
        { provide: PrismaService, useValue: createMockPrismaService() },
      ],
    }).compile();

    service = module.get<CategoriesService>(CategoriesService);
    prisma = module.get(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('debería listar todas las categorías ordenadas por displayOrder', async () => {
      const mockCategories = [
        { id: 'cat-1', name: 'Bebidas', displayOrder: 1, _count: { products: 5 } },
        { id: 'cat-2', name: 'Comidas', displayOrder: 2, _count: { products: 10 } },
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
      expect(result).toEqual(mockCategories);
    });

    it('debería retornar un arreglo vacío si no hay categorías', async () => {
      prisma.category.findMany.mockResolvedValue([]);

      const result = await service.findAll();

      expect(result).toEqual([]);
      expect(prisma.category.findMany).toHaveBeenCalledTimes(1);
    });
  });

  describe('findAllWithProducts', () => {
    it('debería obtener categorías activas con productos y modificadores', async () => {
      const mockCategories = [
        {
          id: 'cat-1',
          name: 'Bebidas',
          active: true,
          displayOrder: 1,
          modifierLists: [
            {
              id: 'list-1',
              name: 'Tamaño',
              options: [
                { id: 'opt-1', name: 'Grande', priceExtra: 2000 },
              ],
            },
          ],
          products: [
            {
              id: 'prod-1',
              name: 'Café',
              available: true,
              modifiers: [],
              category: {
                modifierLists: [
                  { id: 'list-1', name: 'Tamaño', options: [{ id: 'opt-1', name: 'Grande', priceExtra: 2000 }] },
                ],
              },
            },
          ],
        },
      ];

      prisma.category.findMany.mockResolvedValue(mockCategories);

      const result = await service.findAllWithProducts();

      expect(prisma.category.findMany).toHaveBeenCalledWith({
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
      expect(result).toEqual(mockCategories);
    });

    it('debería retornar un arreglo vacío si no hay categorías activas', async () => {
      prisma.category.findMany.mockResolvedValue([]);

      const result = await service.findAllWithProducts();

      expect(result).toEqual([]);
    });
  });

  describe('findById', () => {
    it('debería obtener una categoría por ID con sus productos', async () => {
      const mockCategory = {
        id: 'cat-1',
        name: 'Bebidas',
        products: [
          { id: 'prod-1', name: 'Café', price: 5000 },
        ],
      };

      prisma.category.findUnique.mockResolvedValue(mockCategory);

      const result = await service.findById('cat-1');

      expect(prisma.category.findUnique).toHaveBeenCalledWith({
        where: { id: 'cat-1' },
        include: { products: true },
      });
      expect(result).toEqual(mockCategory);
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
});
