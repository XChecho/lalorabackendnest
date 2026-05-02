import { Test, TestingModule } from '@nestjs/testing';
import { AdminCategoriesController } from './admin-categories.controller';
import { AdminCategoriesService } from './admin-categories.service';
import { AdminCreateCategoryDto, AdminUpdateCategoryDto } from './dto';
import { CreateModifierListDto, CreateModifierOptionDto } from './dto/create-modifier-list.dto';
import { UpdateModifierListDto, UpdateModifierOptionDto } from './dto/update-modifier-list.dto';

describe('AdminCategoriesController', () => {
  let controller: AdminCategoriesController;
  let service: AdminCategoriesService;

  const mockService = {
    findAll: jest.fn(),
    findById: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    toggleStatus: jest.fn(),
    remove: jest.fn(),
    getModifierLists: jest.fn(),
    createModifierList: jest.fn(),
    updateModifierList: jest.fn(),
    deleteModifierList: jest.fn(),
    createModifierOption: jest.fn(),
    updateModifierOption: jest.fn(),
    deleteModifierOption: jest.fn(),
    restockModifierOption: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AdminCategoriesController],
      providers: [
        { provide: AdminCategoriesService, useValue: mockService },
      ],
    }).compile();

    controller = module.get<AdminCategoriesController>(AdminCategoriesController);
    service = module.get<AdminCategoriesService>(AdminCategoriesService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /admin/categories', () => {
    it('debería delegar a adminCategoriesService.findAll()', async () => {
      const mockCategories = [
        { id: 'cat-1', name: 'Bebidas', productsCount: 5, enabled: true },
      ];

      mockService.findAll.mockResolvedValue(mockCategories);

      const result = await controller.findAll();

      expect(mockService.findAll).toHaveBeenCalled();
      expect(result).toEqual(mockCategories);
    });
  });

  describe('GET /admin/categories/:id', () => {
    it('debería delegar a adminCategoriesService.findById() con el ID correcto', async () => {
      const mockCategory = {
        id: 'cat-1',
        name: 'Bebidas',
        productsCount: 5,
        enabled: true,
        modifiers: [],
      };

      mockService.findById.mockResolvedValue(mockCategory);

      const result = await controller.findOne('cat-1');

      expect(mockService.findById).toHaveBeenCalledWith('cat-1');
      expect(result).toEqual(mockCategory);
    });
  });

  describe('POST /admin/categories', () => {
    it('debería delegar a adminCategoriesService.create() con el DTO correcto', async () => {
      const createDto: AdminCreateCategoryDto = {
        name: 'Postres',
        description: 'Dulces',
      };

      const mockCreated = {
        id: 'cat-1',
        name: 'Postres',
        productsCount: 0,
        enabled: true,
      };

      mockService.create.mockResolvedValue(mockCreated);

      const result = await controller.create(createDto);

      expect(mockService.create).toHaveBeenCalledWith(createDto);
      expect(result).toEqual(mockCreated);
    });
  });

  describe('PUT /admin/categories/:id', () => {
    it('debería delegar a adminCategoriesService.update() con ID y DTO', async () => {
      const updateDto: AdminUpdateCategoryDto = {
        name: 'Bebidas Actualizadas',
      };

      const mockUpdated = {
        id: 'cat-1',
        name: 'Bebidas Actualizadas',
        productsCount: 5,
        enabled: true,
      };

      mockService.update.mockResolvedValue(mockUpdated);

      const result = await controller.update('cat-1', updateDto);

      expect(mockService.update).toHaveBeenCalledWith('cat-1', updateDto);
      expect(result).toEqual(mockUpdated);
    });
  });

  describe('PUT /admin/categories/:id/status', () => {
    it('debería delegar a adminCategoriesService.toggleStatus() con ID y enabled', async () => {
      const mockResult = {
        id: 'cat-1',
        name: 'Bebidas',
        productsCount: 5,
        enabled: false,
      };

      mockService.toggleStatus.mockResolvedValue(mockResult);

      const result = await controller.toggleStatus('cat-1', false);

      expect(mockService.toggleStatus).toHaveBeenCalledWith('cat-1', false);
      expect(result).toEqual(mockResult);
    });
  });

  describe('DELETE /admin/categories/:id', () => {
    it('debería delegar a adminCategoriesService.remove() con el ID correcto', async () => {
      const mockResult = {
        id: 'cat-1',
        name: 'Bebidas',
        productsCount: 0,
        enabled: false,
      };

      mockService.remove.mockResolvedValue(mockResult);

      const result = await controller.remove('cat-1');

      expect(mockService.remove).toHaveBeenCalledWith('cat-1');
      expect(result).toEqual(mockResult);
    });
  });

  describe('GET /admin/categories/:id/lists', () => {
    it('debería delegar a adminCategoriesService.findById() para obtener listas', async () => {
      const mockCategory = {
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
            options: [],
          },
        ],
      };

      mockService.findById.mockResolvedValue(mockCategory);

      const result = await controller.getModifierLists('cat-1');

      expect(mockService.findById).toHaveBeenCalledWith('cat-1');
      expect(result).toEqual(mockCategory);
    });
  });

  describe('POST /admin/categories/:id/lists', () => {
    it('debería delegar a adminCategoriesService.createModifierList()', async () => {
      const createDto: CreateModifierListDto = {
        name: 'Tamaño',
        required: true,
      };

      const mockCreated = {
        id: 'list-1',
        name: 'Tamaño',
        required: true,
        multiple: false,
        affectsKitchen: false,
        options: [],
      };

      mockService.createModifierList.mockResolvedValue(mockCreated);

      const result = await controller.createModifierList('cat-1', createDto);

      expect(mockService.createModifierList).toHaveBeenCalledWith('cat-1', createDto);
      expect(result).toEqual(mockCreated);
    });
  });

  describe('PUT /admin/categories/:id/lists/:listId', () => {
    it('debería delegar a adminCategoriesService.updateModifierList()', async () => {
      const updateDto: UpdateModifierListDto = {
        name: 'Tamaño Grande',
        required: false,
      };

      const mockUpdated = {
        id: 'list-1',
        name: 'Tamaño Grande',
        required: false,
        multiple: false,
        affectsKitchen: false,
        options: [],
      };

      mockService.updateModifierList.mockResolvedValue(mockUpdated);

      const result = await controller.updateModifierList('cat-1', 'list-1', updateDto);

      expect(mockService.updateModifierList).toHaveBeenCalledWith('list-1', updateDto);
      expect(result).toEqual(mockUpdated);
    });
  });

  describe('DELETE /admin/categories/:id/lists/:listId', () => {
    it('debería delegar a adminCategoriesService.deleteModifierList()', async () => {
      const mockResult = { message: 'Modifier list deleted' };

      mockService.deleteModifierList.mockResolvedValue(mockResult);

      const result = await controller.deleteModifierList('cat-1', 'list-1');

      expect(mockService.deleteModifierList).toHaveBeenCalledWith('list-1');
      expect(result).toEqual(mockResult);
    });
  });

  describe('POST /admin/categories/:id/lists/:listId/options', () => {
    it('debería delegar a adminCategoriesService.createModifierOption()', async () => {
      const optionDto: CreateModifierOptionDto = {
        name: 'Grande',
        priceExtra: 2000,
        stock: 30,
      };

      const mockCreated = {
        id: 'opt-1',
        name: 'Grande',
        priceExtra: 2000,
        stock: 30,
      };

      mockService.createModifierOption.mockResolvedValue(mockCreated);

      const result = await controller.createModifierOption('cat-1', 'list-1', optionDto);

      expect(mockService.createModifierOption).toHaveBeenCalledWith('list-1', optionDto);
      expect(result).toEqual(mockCreated);
    });
  });

  describe('PUT /admin/categories/:id/lists/:listId/options/:optionId', () => {
    it('debería delegar a adminCategoriesService.updateModifierOption()', async () => {
      const updateDto: UpdateModifierOptionDto = {
        name: 'Extra Grande',
        priceExtra: 3000,
      };

      const mockUpdated = {
        id: 'opt-1',
        name: 'Extra Grande',
        priceExtra: 3000,
        stock: 30,
      };

      mockService.updateModifierOption.mockResolvedValue(mockUpdated);

      const result = await controller.updateModifierOption('cat-1', 'list-1', 'opt-1', updateDto);

      expect(mockService.updateModifierOption).toHaveBeenCalledWith('opt-1', updateDto);
      expect(result).toEqual(mockUpdated);
    });
  });

  describe('DELETE /admin/categories/:id/lists/:listId/options/:optionId', () => {
    it('debería delegar a adminCategoriesService.deleteModifierOption()', async () => {
      const mockResult = { message: 'Modifier option deleted' };

      mockService.deleteModifierOption.mockResolvedValue(mockResult);

      const result = await controller.deleteModifierOption('cat-1', 'list-1', 'opt-1');

      expect(mockService.deleteModifierOption).toHaveBeenCalledWith('opt-1');
      expect(result).toEqual(mockResult);
    });
  });

  describe('PUT /admin/categories/:id/lists/:listId/options/:optionId/restock', () => {
    it('debería delegar a adminCategoriesService.restockModifierOption()', async () => {
      const mockResult = {
        id: 'opt-1',
        name: 'Extra queso',
        priceExtra: 1500,
        stock: 50,
      };

      mockService.restockModifierOption.mockResolvedValue(mockResult);

      const result = await controller.restockModifierOption('cat-1', 'list-1', 'opt-1', 30);

      expect(mockService.restockModifierOption).toHaveBeenCalledWith('opt-1', 30);
      expect(result).toEqual(mockResult);
    });
  });
});
