import { Test, TestingModule } from '@nestjs/testing';
import { CategoriesController } from './categories.controller';
import { CategoriesService } from './categories.service';

describe('CategoriesController', () => {
  let controller: CategoriesController;
  let service: CategoriesService;

  beforeEach(async () => {
    const mockService = {
      findAll: jest.fn(),
      findAllWithProducts: jest.fn(),
      findById: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [CategoriesController],
      providers: [
        { provide: CategoriesService, useValue: mockService },
      ],
    }).compile();

    controller = module.get<CategoriesController>(CategoriesController);
    service = module.get<CategoriesService>(CategoriesService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /categories', () => {
    it('debería delegar a categoriesService.findAll()', async () => {
      const mockCategories = [
        { id: 'cat-1', name: 'Bebidas', displayOrder: 1 },
        { id: 'cat-2', name: 'Comidas', displayOrder: 2 },
      ];

      service.findAll = jest.fn().mockResolvedValue(mockCategories);

      const result = await controller.findAll();

      expect(service.findAll).toHaveBeenCalled();
      expect(result).toEqual(mockCategories);
    });
  });

  describe('GET /categories/all-products', () => {
    it('debería delegar a categoriesService.findAllWithProducts()', async () => {
      const mockCategoriesWithProducts = [
        {
          id: 'cat-1',
          name: 'Bebidas',
          products: [{ id: 'prod-1', name: 'Café' }],
          modifierLists: [],
        },
      ];

      service.findAllWithProducts = jest.fn().mockResolvedValue(mockCategoriesWithProducts);

      const result = await controller.findAllWithProducts();

      expect(service.findAllWithProducts).toHaveBeenCalled();
      expect(result).toEqual(mockCategoriesWithProducts);
    });
  });

  describe('GET /categories/:id', () => {
    it('debería delegar a categoriesService.findById() con el ID correcto', async () => {
      const mockCategory = {
        id: 'cat-1',
        name: 'Bebidas',
        products: [],
      };

      service.findById = jest.fn().mockResolvedValue(mockCategory);

      const result = await controller.findOne('cat-1');

      expect(service.findById).toHaveBeenCalledWith('cat-1');
      expect(result).toEqual(mockCategory);
    });
  });
});
