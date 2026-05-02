import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { ProductsService } from './products.service';
import { PrismaService } from '../prisma.service';
import { CloudinaryService } from '../common/cloudinary/cloudinary.service';
import { CreateProductDto } from './dto/create-product.dto';

/**
 * ============================================================
 * SUITE DE PRUEBAS: ProductsService
 * ============================================================
 *
 * QUÉ probamos:
 * CRUD de productos, manejo de stock, toggle de disponibilidad,
 * limpieza de imágenes en Cloudinary y restock masivo.
 *
 * MOCKING:
 * - PrismaService → base de datos simulada
 * - CloudinaryService → evita subidas/borrados reales en la nube
 */
describe('ProductsService', () => {
  let service: ProductsService;
  let prisma: any;
  let cloudinary: jest.Mocked<CloudinaryService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductsService,
        {
          provide: PrismaService,
          useValue: {
            product: {
              findMany: jest.fn(),
              findUnique: jest.fn(),
              create: jest.fn(),
              update: jest.fn(),
              delete: jest.fn(),
            },
            productModifier: {
              deleteMany: jest.fn(),
            },
          },
        },
        {
          provide: CloudinaryService,
          useValue: {
            uploadImage: jest.fn(),
            deleteImage: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<ProductsService>(ProductsService);
    prisma = module.get(PrismaService);
    cloudinary = module.get(CloudinaryService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  /**
   * ============================================================
   * PRUEBA 1: Listar productos por categoría
   * ============================================================
   *
   * POR QUÉ importa:
   * La app móvil muestra el menú organizado por categorías.
   */
  it('debería encontrar productos por categoría', async () => {
    const categoryId = 'cat-1';
    const expected = [
      { id: 'prod-1', name: 'Cerveza', categoryId },
      { id: 'prod-2', name: 'Agua', categoryId },
    ];

    prisma.product.findMany.mockResolvedValue(expected);

    const result = await service.findByCategory(categoryId);

    expect(prisma.product.findMany).toHaveBeenCalledWith({
      where: { categoryId },
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
    });
    expect(result).toEqual(expected);
  });

  /**
   * ============================================================
   * PRUEBA 2: Buscar producto por ID (existe)
   * ============================================================
   */
  describe('findById', () => {
    it('debería retornar el producto si existe', async () => {
      const product = {
        id: 'prod-1',
        name: 'Hamburguesa',
        categoryId: 'cat-1',
        price: 15000,
      };

      prisma.product.findUnique.mockResolvedValue(product);

      const result = await service.findById('prod-1');

      expect(result).toEqual(product);
    });

    it('debería lanzar NotFoundException si no existe', async () => {
      prisma.product.findUnique.mockResolvedValue(null);

      await expect(service.findById('prod-ghost')).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.findById('prod-ghost')).rejects.toThrow(
        'Product with id prod-ghost not found',
      );
    });
  });

  /**
   * ============================================================
   * PRUEBA 3: Crear producto sin imagen
   * ============================================================
   *
   * POR QUÉ importa:
   * No todos los productos tienen foto inicialmente.
   */
  it('debería crear un producto sin imagen', async () => {
    const data: CreateProductDto = {
      name: 'Cerveza Poker',
      price: 2500,
      categoryId: 'cat-1',
      stock: 20,
      available: true,
    };

    const created = {
      id: 'prod-1',
      ...data,
      image: null,
      imageId: null,
    };

    prisma.product.create.mockResolvedValue(created);

    const result = await service.create(data);

    expect(cloudinary.uploadImage).not.toHaveBeenCalled();
    expect(prisma.product.create).toHaveBeenCalledWith({
      data: {
        name: 'Cerveza Poker',
        description: undefined,
        price: 2500,
        categoryId: 'cat-1',
        image: undefined,
        imageId: undefined,
        stock: 20,
        available: true,
      },
    });
    expect(result).toEqual(created);
  });

  /**
   * ============================================================
   * PRUEBA 4: Actualizar stock
   * ============================================================
   *
   * QUÉ probamos:
   * Que el stock nunca sea negativo (Math.max(0, ...)) y que
   * la disponibilidad se recalcule automáticamente.
   */
  it('debería actualizar el stock correctamente', async () => {
    const existing = {
      id: 'prod-1',
      name: 'Cerveza',
      stock: 10,
      available: true,
      categoryId: 'cat-1',
      price: 2500,
      image: null,
      imageId: null,
    };

    prisma.product.findUnique.mockResolvedValue(existing);
    prisma.product.update.mockResolvedValue({
      ...existing,
      stock: 5,
      available: true,
    });

    const result = await service.updateStock('prod-1', -5);

    expect(prisma.product.update).toHaveBeenCalledWith({
      where: { id: 'prod-1' },
      data: { stock: 5, available: true },
    });
    expect(result.stock).toBe(5);
  });

  /**
   * ============================================================
   * PRUEBA 5: Toggle de estado
   * ============================================================
   */
  it('debería alternar el estado disponible del producto', async () => {
    const existing = {
      id: 'prod-1',
      name: 'Cerveza',
      stock: 10,
      available: true,
      categoryId: 'cat-1',
      price: 2500,
      image: null,
      imageId: null,
    };

    prisma.product.findUnique.mockResolvedValue(existing);
    prisma.product.update.mockResolvedValue({ ...existing, available: false });

    const result = await service.toggleStatus('prod-1', false);

    expect(prisma.product.update).toHaveBeenCalledWith({
      where: { id: 'prod-1' },
      data: { available: false },
    });
    expect(result.available).toBe(false);
  });

  /**
   * ============================================================
   * PRUEBA 6: Borrar producto limpia imagen en Cloudinary
   * ============================================================
   *
   * POR QUÉ importa:
   * Si no borramos la imagen en la nube, acumulamos basura digital
   * y aumentamos costos de almacenamiento.
   */
  it('debería eliminar producto y su imagen en Cloudinary', async () => {
    const product = {
      id: 'prod-1',
      name: 'Cerveza',
      stock: 10,
      available: true,
      categoryId: 'cat-1',
      price: 2500,
      image: 'https://cloudinary.com/image.jpg',
      imageId: 'cloud-id-1',
    };

    prisma.product.findUnique.mockResolvedValue(product);
    cloudinary.deleteImage.mockResolvedValue(undefined);
    prisma.productModifier.deleteMany.mockResolvedValue({ count: 0 });
    prisma.product.delete.mockResolvedValue(product);

    await service.delete('prod-1');

    expect(cloudinary.deleteImage).toHaveBeenCalledWith('cloud-id-1');
    expect(prisma.productModifier.deleteMany).toHaveBeenCalledWith({
      where: { productId: 'prod-1' },
    });
    expect(prisma.product.delete).toHaveBeenCalledWith({
      where: { id: 'prod-1' },
    });
  });

  /**
   * ============================================================
   * PRUEBA 7: Restock masivo de productos
   * ============================================================
   *
   * QUÉ probamos:
   * Recalcular disponibilidad (available) de TODOS los productos
   * basándose en su stock actual.
   */
  it('debería restablecer disponibilidad de todos los productos', async () => {
    const products = [
      { id: 'p1', stock: 5, available: false },
      { id: 'p2', stock: 0, available: true },
    ];

    prisma.product.findMany.mockResolvedValue(products);
    prisma.product.update.mockResolvedValue({
      id: 'p1',
      available: true,
      stock: 5,
    });

    const result = await service.restockAll();

    expect(prisma.product.findMany).toHaveBeenCalledWith({ where: undefined });
    expect(result.restocked).toBe(2);
  });

  /**
   * ============================================================
   * PRUEBA 8: Listar todos los productos
   * ============================================================
   */
  it('debería listar todos los productos ordenados por nombre', async () => {
    const products = [
      { id: 'p1', name: 'Agua', price: 2000 },
      { id: 'p2', name: 'Cerveza', price: 2500 },
    ];

    prisma.product.findMany.mockResolvedValue(products);

    const result = await service.findAll();

    expect(prisma.product.findMany).toHaveBeenCalledWith({
      include: { category: true, modifiers: true },
      orderBy: { name: 'asc' },
    });
    expect(result).toEqual(products);
  });

  /**
   * ============================================================
   * PRUEBA 9: Crear producto con imageBuffer
   * ============================================================
   *
   * QUÉ probamos:
   * Cuando se sube un archivo desde el frontend (multipart/form-data),
   * el buffer se envía a Cloudinary y se guarda la URL resultante.
   */
  it('debería crear un producto con imageBuffer', async () => {
    const buffer = Buffer.from('fake-image-data');
    const data = {
      name: 'Hamburguesa Especial',
      price: 15000,
      categoryId: 'cat-1',
      imageBuffer: buffer,
    };

    cloudinary.uploadImage.mockResolvedValue({
      secureUrl: 'https://cloudinary.com/img.jpg',
      publicId: 'cloud-id-new',
    });

    prisma.product.create.mockResolvedValue({
      id: 'prod-new',
      ...data,
      image: 'https://cloudinary.com/img.jpg',
      imageId: 'cloud-id-new',
      stock: 0,
      available: false,
    });

    const result = await service.create(data);

    expect(cloudinary.uploadImage).toHaveBeenCalledWith(buffer, 'products');
    expect(prisma.product.create).toHaveBeenCalledWith({
      data: {
        name: 'Hamburguesa Especial',
        description: undefined,
        price: 15000,
        categoryId: 'cat-1',
        image: 'https://cloudinary.com/img.jpg',
        imageId: 'cloud-id-new',
        stock: 0,
        available: false,
      },
    });
    expect(result.image).toBe('https://cloudinary.com/img.jpg');
  });

  /**
   * ============================================================
   * PRUEBA 10: Crear producto con imageUrl
   * ============================================================
   *
   * QUÉ probamos:
   * Cuando se proporciona una URL de imagen externa,
   * Cloudinary la descarga y la guarda, retornando la URL segura.
   */
  it('debería crear un producto con imageUrl', async () => {
    const data = {
      name: 'Pizza',
      price: 20000,
      categoryId: 'cat-2',
      imageUrl: 'https://example.com/pizza.jpg',
    };

    cloudinary.uploadImage.mockResolvedValue({
      secureUrl: 'https://cloudinary.com/pizza.jpg',
      publicId: 'cloud-id-pizza',
    });

    prisma.product.create.mockResolvedValue({
      id: 'prod-pizza',
      ...data,
      image: 'https://cloudinary.com/pizza.jpg',
      imageId: 'cloud-id-pizza',
      stock: 0,
      available: false,
    });

    const result = await service.create(data);

    expect(cloudinary.uploadImage).toHaveBeenCalledWith(
      'https://example.com/pizza.jpg',
      'products',
    );
    expect(result.image).toBe('https://cloudinary.com/pizza.jpg');
  });

  /**
   * ============================================================
   * PRUEBA 11: Actualizar producto sin cambiar imagen
   * ============================================================
   *
   * QUÉ probamos:
   * Actualizar solo nombre y precio sin tocar la imagen existente.
   */
  it('debería actualizar producto sin cambiar imagen', async () => {
    const existing = {
      id: 'prod-1',
      name: 'Cerveza',
      price: 2500,
      image: 'https://cloudinary.com/old.jpg',
      imageId: 'cloud-old',
      stock: 10,
      available: true,
      categoryId: 'cat-1',
    };

    prisma.product.findUnique.mockResolvedValue(existing);
    prisma.product.update.mockResolvedValue({
      ...existing,
      name: 'Cerveza Premium',
      price: 3000,
    });

    const result = await service.update('prod-1', {
      name: 'Cerveza Premium',
      price: 3000,
    });

    expect(cloudinary.uploadImage).not.toHaveBeenCalled();
    expect(cloudinary.deleteImage).not.toHaveBeenCalled();
    expect(result.name).toBe('Cerveza Premium');
  });

  /**
   * ============================================================
   * PRUEBA 12: Actualizar producto con imageBuffer
   * ============================================================
   *
   * QUÉ probamos:
   * Al subir una nueva imagen, se borra la anterior en Cloudinary
   * y se guarda la nueva URL.
   */
  it('debería actualizar producto con imageBuffer', async () => {
    const existing = {
      id: 'prod-1',
      name: 'Cerveza',
      price: 2500,
      image: 'https://cloudinary.com/old.jpg',
      imageId: 'cloud-old',
      stock: 10,
      available: true,
      categoryId: 'cat-1',
    };
    const buffer = Buffer.from('new-image-data');

    prisma.product.findUnique
      .mockResolvedValueOnce(existing) // findById
      .mockResolvedValueOnce(existing); // get existing imageId

    cloudinary.deleteImage.mockResolvedValue(undefined);
    cloudinary.uploadImage.mockResolvedValue({
      secureUrl: 'https://cloudinary.com/new.jpg',
      publicId: 'cloud-new',
    });

    prisma.product.update.mockResolvedValue({
      ...existing,
      name: 'Cerveza',
      image: 'https://cloudinary.com/new.jpg',
      imageId: 'cloud-new',
    });

    const result = await service.update('prod-1', { imageBuffer: buffer });

    expect(cloudinary.deleteImage).toHaveBeenCalledWith('cloud-old');
    expect(cloudinary.uploadImage).toHaveBeenCalledWith(buffer, 'products');
    expect(result.image).toBe('https://cloudinary.com/new.jpg');
  });

  /**
   * ============================================================
   * PRUEBA 13: Actualizar producto con imageUrl
   * ============================================================
   *
   * QUÉ probamos:
   * Similar al anterior, pero con URL en lugar de buffer.
   */
  it('debería actualizar producto con imageUrl', async () => {
    const existing = {
      id: 'prod-1',
      name: 'Cerveza',
      price: 2500,
      image: 'https://cloudinary.com/old.jpg',
      imageId: 'cloud-old',
      stock: 10,
      available: true,
      categoryId: 'cat-1',
    };

    prisma.product.findUnique
      .mockResolvedValueOnce(existing)
      .mockResolvedValueOnce(existing);

    cloudinary.deleteImage.mockResolvedValue(undefined);
    cloudinary.uploadImage.mockResolvedValue({
      secureUrl: 'https://cloudinary.com/url-new.jpg',
      publicId: 'cloud-url-new',
    });

    prisma.product.update.mockResolvedValue({
      ...existing,
      image: 'https://cloudinary.com/url-new.jpg',
      imageId: 'cloud-url-new',
    });

    const result = await service.update('prod-1', {
      imageUrl: 'https://example.com/new.jpg',
    });

    expect(cloudinary.deleteImage).toHaveBeenCalledWith('cloud-old');
    expect(cloudinary.uploadImage).toHaveBeenCalledWith(
      'https://example.com/new.jpg',
      'products',
    );
    expect(result.image).toBe('https://cloudinary.com/url-new.jpg');
  });

  /**
   * ============================================================
   * PRUEBA 14: Actualizar stock recalcula disponibilidad
   * ============================================================
   *
   * QUÉ probamos:
   * Cuando el stock llega a 0, available se pone en false.
   */
  it('debería marcar producto como no disponible al llegar a stock 0', async () => {
    const existing = {
      id: 'prod-1',
      name: 'Cerveza',
      stock: 5,
      available: true,
      categoryId: 'cat-1',
      price: 2500,
      image: null,
      imageId: null,
    };

    prisma.product.findUnique.mockResolvedValue(existing);
    prisma.product.update.mockResolvedValue({
      ...existing,
      stock: 0,
      available: false,
    });

    const result = await service.updateStock('prod-1', -5);

    expect(prisma.product.update).toHaveBeenCalledWith({
      where: { id: 'prod-1' },
      data: { stock: 0, available: false },
    });
    expect(result.available).toBe(false);
  });

  /**
   * ============================================================
   * PRUEBA 15: Restock masivo por categoría
   * ============================================================
   *
   * QUÉ probamos:
   * Filtrar restock por categoryId específico.
   */
  it('debería restablecer disponibilidad solo de una categoría', async () => {
    const products = [
      { id: 'p1', stock: 3, available: false, categoryId: 'cat-bebidas' },
    ];

    prisma.product.findMany.mockResolvedValue(products);
    prisma.product.update.mockResolvedValue({
      id: 'p1',
      available: true,
      stock: 3,
    });

    const result = await service.restockAll('cat-bebidas');

    expect(prisma.product.findMany).toHaveBeenCalledWith({
      where: { categoryId: 'cat-bebidas' },
    });
    expect(result.restocked).toBe(1);
  });
});
