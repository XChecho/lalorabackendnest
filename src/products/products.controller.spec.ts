import { Test, TestingModule } from '@nestjs/testing';
import { ProductsController, AdminProductsController } from './products.controller';
import { ProductsService } from './products.service';
import { CreateProductDto, UpdateProductDto } from './dto/create-product.dto';

/**
 * ============================================================
 * SUITE DE PRUEBAS: ProductsController y AdminProductsController
 * ============================================================
 *
 * QUÉ probamos:
 * Que ambos controladores delegan correctamente en ProductsService
 * y que los parámetros de la request llegan bien al servicio.
 *
 * POR QUÉ NO testeamos lógica de negocio aquí:
 * El controller es una "capa delgada" (thin layer). La lógica
 * pesada (validaciones, acceso a BD, Cloudinary) vive en el
 * Service. Aquí solo verificamos "enrutamiento" de datos.
 *
 * MOCKING:
 * Reemplazamos ProductsService completo. No nos importa QUÉ hace
 * el servicio; solo nos importa QUE se llame con los argumentos
 * correctos.
 */
describe('ProductsController (público)', () => {
  let controller: ProductsController;
  let productsService: jest.Mocked<ProductsService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProductsController],
      providers: [
        {
          provide: ProductsService,
          useValue: {
            findByCategory: jest.fn(),
            findById: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<ProductsController>(ProductsController);
    productsService = module.get(ProductsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  /**
   * ============================================================
   * PRUEBA 1: GET /categories/:categoryId/products
   * ============================================================
   *
   * QUÉ probamos:
   * Que el controller extrae categoryId de los params y lo pasa
   * correctamente al servicio.
   */
  it('GET /categories/:categoryId/products debería delegar en findByCategory', async () => {
    const expected = [
      { id: 'prod-1', name: 'Cerveza', categoryId: 'cat-1' },
      { id: 'prod-2', name: 'Agua', categoryId: 'cat-1' },
    ];

    productsService.findByCategory.mockResolvedValue(expected as any);

    const result = await controller.findByCategory('cat-1');

    expect(productsService.findByCategory).toHaveBeenCalledWith('cat-1');
    expect(result).toEqual(expected);
  });

  /**
   * ============================================================
   * PRUEBA 2: GET /products/:id
   * ============================================================
   *
   * QUÉ probamos:
   * Que el controller extrae id de los params y lo pasa
   * correctamente al servicio.
   */
  it('GET /products/:id debería delegar en findById', async () => {
    const expected = {
      id: 'prod-1',
      name: 'Hamburguesa',
      price: 15000,
      categoryId: 'cat-1',
    };

    productsService.findById.mockResolvedValue(expected as any);

    const result = await controller.findOne('prod-1');

    expect(productsService.findById).toHaveBeenCalledWith('prod-1');
    expect(result).toEqual(expected);
  });
});

describe('AdminProductsController (admin)', () => {
  let controller: AdminProductsController;
  let productsService: jest.Mocked<ProductsService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AdminProductsController],
      providers: [
        {
          provide: ProductsService,
          useValue: {
            findAll: jest.fn(),
            findByCategory: jest.fn(),
            findById: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            toggleStatus: jest.fn(),
            updateStock: jest.fn(),
            restockAll: jest.fn(),
            delete: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<AdminProductsController>(AdminProductsController);
    productsService = module.get(ProductsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  /**
   * ============================================================
   * PRUEBA 1: GET /admin/products — listar todos
   * ============================================================
   */
  it('GET /admin/products debería delegar en findAll', async () => {
    const expected = [
      { id: 'prod-1', name: 'Cerveza' },
      { id: 'prod-2', name: 'Agua' },
    ];

    productsService.findAll.mockResolvedValue(expected as any);

    const result = await controller.findAll();

    expect(productsService.findAll).toHaveBeenCalled();
    expect(result).toEqual(expected);
  });

  /**
   * ============================================================
   * PRUEBA 2: GET /admin/products/categories/:categoryId
   * ============================================================
   */
  it('GET /admin/products/categories/:categoryId debería delegar en findByCategory', async () => {
    const expected = [
      { id: 'prod-1', name: 'Cerveza', categoryId: 'cat-1' },
    ];

    productsService.findByCategory.mockResolvedValue(expected as any);

    const result = await controller.findByCategory('cat-1');

    expect(productsService.findByCategory).toHaveBeenCalledWith('cat-1');
    expect(result).toEqual(expected);
  });

  /**
   * ============================================================
   * PRUEBA 3: GET /admin/products/:id
   * ============================================================
   */
  it('GET /admin/products/:id debería delegar en findById', async () => {
    const expected = {
      id: 'prod-1',
      name: 'Hamburguesa',
      price: 15000,
    };

    productsService.findById.mockResolvedValue(expected as any);

    const result = await controller.findOne('prod-1');

    expect(productsService.findById).toHaveBeenCalledWith('prod-1');
    expect(result).toEqual(expected);
  });

  /**
   * ============================================================
   * PRUEBA 4: POST /admin/products — crear con imagen
   * ============================================================
   *
   * QUÉ probamos:
   * Que cuando se sube un archivo, el controller agrega
   * imageBuffer al DTO antes de delegar al servicio.
   */
  it('POST /admin/products con archivo debería agregar imageBuffer al DTO', async () => {
    const dto: CreateProductDto = {
      name: 'Cerveza Poker',
      price: 2500,
      categoryId: 'cat-1',
    };
    const file = { buffer: Buffer.from('fake-image-data') } as Express.Multer.File;
    const expected = { id: 'prod-1', name: 'Cerveza Poker' };

    productsService.create.mockResolvedValue(expected as any);

    const result = await controller.create(dto, file);

    expect(productsService.create).toHaveBeenCalledWith({
      ...dto,
      imageBuffer: file.buffer,
    });
    expect(result).toEqual(expected);
  });

  /**
   * ============================================================
   * PRUEBA 5: POST /admin/products — crear sin imagen
   * ============================================================
   *
   * QUÉ probamos:
   * Que cuando NO hay archivo, el DTO se pasa sin modificaciones.
   */
  it('POST /admin/products sin archivo debería pasar el DTO sin modificar', async () => {
    const dto: CreateProductDto = {
      name: 'Agua Cristal',
      price: 2000,
      categoryId: 'cat-1',
    };
    const expected = { id: 'prod-2', name: 'Agua Cristal' };

    productsService.create.mockResolvedValue(expected as any);

    const result = await controller.create(dto, undefined as any);

    expect(productsService.create).toHaveBeenCalledWith(dto);
    expect(result).toEqual(expected);
  });

  /**
   * ============================================================
   * PRUEBA 6: PUT /admin/products/:id — actualizar con imagen
   * ============================================================
   *
   * QUÉ probamos:
   * Que al actualizar con archivo, se agrega imageBuffer al DTO.
   */
  it('PUT /admin/products/:id con archivo debería agregar imageBuffer al DTO', async () => {
    const dto: UpdateProductDto = { name: 'Cerveza Actualizada' };
    const file = { buffer: Buffer.from('new-image-data') } as Express.Multer.File;
    const expected = { id: 'prod-1', name: 'Cerveza Actualizada' };

    productsService.update.mockResolvedValue(expected as any);

    const result = await controller.update('prod-1', dto, file);

    expect(productsService.update).toHaveBeenCalledWith('prod-1', {
      ...dto,
      imageBuffer: file.buffer,
    });
    expect(result).toEqual(expected);
  });

  /**
   * ============================================================
   * PRUEBA 7: PUT /admin/products/:id — actualizar sin imagen
   * ============================================================
   */
  it('PUT /admin/products/:id sin archivo debería pasar el DTO sin modificar', async () => {
    const dto: UpdateProductDto = { price: 3000 };
    const expected = { id: 'prod-1', price: 3000 };

    productsService.update.mockResolvedValue(expected as any);

    const result = await controller.update('prod-1', dto, undefined as any);

    expect(productsService.update).toHaveBeenCalledWith('prod-1', dto);
    expect(result).toEqual(expected);
  });

  /**
   * ============================================================
   * PRUEBA 8: PUT /admin/products/:id/status
   * ============================================================
   */
  it('PUT /admin/products/:id/status debería delegar en toggleStatus', async () => {
    const expected = { id: 'prod-1', available: false };

    productsService.toggleStatus.mockResolvedValue(expected as any);

    const result = await controller.toggleStatus('prod-1', false);

    expect(productsService.toggleStatus).toHaveBeenCalledWith('prod-1', false);
    expect(result).toEqual(expected);
  });

  /**
   * ============================================================
   * PRUEBA 9: PUT /admin/products/:id/restock
   * ============================================================
   */
  it('PUT /admin/products/:id/restock debería delegar en updateStock', async () => {
    const expected = { id: 'prod-1', stock: 25, available: true };

    productsService.updateStock.mockResolvedValue(expected as any);

    const result = await controller.restock('prod-1', 10);

    expect(productsService.updateStock).toHaveBeenCalledWith('prod-1', 10);
    expect(result).toEqual(expected);
  });

  /**
   * ============================================================
   * PRUEBA 10: POST /admin/products/restock-all sin categoría
   * ============================================================
   */
  it('POST /admin/products/restock-all sin categoría debería delegar en restockAll', async () => {
    const expected = { restocked: 15 };

    productsService.restockAll.mockResolvedValue(expected as any);

    const result = await controller.restockAll();

    expect(productsService.restockAll).toHaveBeenCalledWith(undefined);
    expect(result).toEqual(expected);
  });

  /**
   * ============================================================
   * PRUEBA 11: POST /admin/products/restock-all con categoría
   * ============================================================
   */
  it('POST /admin/products/restock-all con categoría debería pasar categoryId', async () => {
    const expected = { restocked: 5 };

    productsService.restockAll.mockResolvedValue(expected as any);

    const result = await controller.restockAll('cat-beers');

    expect(productsService.restockAll).toHaveBeenCalledWith('cat-beers');
    expect(result).toEqual(expected);
  });

  /**
   * ============================================================
   * PRUEBA 12: DELETE /admin/products/:id
   * ============================================================
   */
  it('DELETE /admin/products/:id debería delegar en delete', async () => {
    const expected = { id: 'prod-1', name: 'Cerveza' };

    productsService.delete.mockResolvedValue(expected as any);

    const result = await controller.delete('prod-1');

    expect(productsService.delete).toHaveBeenCalledWith('prod-1');
    expect(result).toEqual(expected);
  });
});
