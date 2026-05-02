import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { PrismaService } from '../prisma.service';
import { LoggerService } from '../common/logger/logger.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { AddItemsDto } from './dto/add-items.dto';

/**
 * ============================================================
 * SUITE DE PRUEBAS: OrdersService
 * ============================================================
 *
 * Estamos probando la lógica de negocio del servicio de órdenes.
 * Como buena práctica en NestJS, testeamos el servicio (unidad de
 * lógica) de forma aislada, sin levantar HTTP ni tocar la BD.
 *
 * MOCKING:
 * - PrismaService → lo reemplazamos por un objeto con jest.fn()
 * - LoggerService → lo mockeamos para no escribir en consola/logs
 */
describe('OrdersService', () => {
  let service: OrdersService;
  let prisma: any;
  let logger: jest.Mocked<LoggerService>;

  beforeEach(async () => {
    /**
     * Arrange (configuración global de cada test):
     * Test.createTestingModule simula el compilador de NestJS.
     * Aquí definimos los providers que normalmente inyecta el framework.
     */
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrdersService,
        {
          provide: PrismaService,
          useValue: {
            order: {
              findMany: jest.fn(),
              findUnique: jest.fn(),
              findFirst: jest.fn(),
              create: jest.fn(),
              update: jest.fn(),
              delete: jest.fn(),
            },
            table: {
              findUnique: jest.fn(),
              update: jest.fn(),
            },
            product: {
              findUnique: jest.fn(),
            },
            orderItem: {
              findMany: jest.fn(),
              create: jest.fn(),
            },
            orderItemModifier: {
              createMany: jest.fn(),
            },
          },
        },
        {
          provide: LoggerService,
          useValue: {
            log: jest.fn(),
            warn: jest.fn(),
            error: jest.fn(),
            debug: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<OrdersService>(OrdersService);
    prisma = module.get(PrismaService);
    logger = module.get(LoggerService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // ==========================================================
  // create()
  // ==========================================================
  describe('create', () => {
    /**
     * ============================================================
     * PRUEBA 1: Crear orden sin mesa (pedido para llevar)
     * ============================================================
     *
     * QUÉ probamos:
     * Que el servicio puede crear una orden sin asociarla a una mesa.
     *
     * POR QUÉ importa:
     * No todos los pedidos vienen de mesas; algunos son para llevar.
     *
     * Arrange:
     * - DTO sin tableId
     * - Mock de order.create devuelve orden recién creada
     * - Mock de order.findUnique (llamado por findById al final)
     *   devuelve la orden con relaciones
     *
     * Act:
     * - Ejecutamos service.create(dto, userId)
     *
     * Assert:
     * - NO se consultó la tabla (table.findUnique no se llama)
     * - order.create recibió los datos correctos
     * - Retorna la orden completa
     */
    it('debería crear una orden sin mesa (takeaway)', async () => {
      const dto: CreateOrderDto = {
        customerName: 'Juan Pérez',
        orderType: 'TAKEAWAY',
        items: [],
      };
      const userId = 'user-1';

      const createdOrder = {
        id: 'order-1',
        tableId: null,
        userId: 'user-1',
        customerName: 'Juan Pérez',
        orderType: 'TAKEAWAY',
        status: 'PENDING',
        total: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const orderWithRelations = {
        ...createdOrder,
        items: [],
        table: null,
      };

      prisma.order.create.mockResolvedValue(createdOrder);
      prisma.order.findUnique.mockResolvedValue(orderWithRelations);

      const result = await service.create(dto, userId);

      expect(prisma.table.findUnique).not.toHaveBeenCalled();
      expect(prisma.order.create).toHaveBeenCalledWith({
        data: {
          tableId: undefined,
          userId: 'user-1',
          customerName: 'Juan Pérez',
          orderType: 'TAKEAWAY',
          status: 'PENDING',
          total: 0,
        },
      });
      expect(result).toEqual(orderWithRelations);
      expect(logger.log).toHaveBeenCalled();
    });

    /**
     * ============================================================
     * PRUEBA 2: Crear orden con una mesa válida
     * ============================================================
     *
     * QUÉ probamos:
     * Flujo completo de creación con mesa: validar que existe,
     * validar que no tiene orden activa, crear orden, marcar mesa
     * como OCUPADA.
     */
    it('debería crear una orden con una mesa válida', async () => {
      const dto: CreateOrderDto = {
        tableId: 'table-1',
        customerName: 'María García',
      };
      const userId = 'user-2';

      const table = {
        id: 'table-1',
        name: 'Mesa 4',
        status: 'AVAILABLE',
        zoneId: 'zone-1',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const createdOrder = {
        id: 'order-2',
        tableId: 'table-1',
        userId: 'user-2',
        customerName: 'María García',
        orderType: 'LOCAL',
        status: 'PENDING',
        total: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const orderWithRelations = {
        ...createdOrder,
        items: [],
        table,
      };

      prisma.table.findUnique.mockResolvedValue(table);
      prisma.order.findFirst.mockResolvedValue(null);
      prisma.order.create.mockResolvedValue(createdOrder);
      prisma.table.update.mockResolvedValue({ ...table, status: 'OCCUPIED' });
      prisma.order.findUnique.mockResolvedValue(orderWithRelations);

      const result = await service.create(dto, userId);

      expect(prisma.table.findUnique).toHaveBeenCalledWith({
        where: { id: 'table-1' },
      });
      expect(prisma.order.findFirst).toHaveBeenCalledWith({
        where: {
          tableId: 'table-1',
          status: { notIn: ['CLOSED', 'CANCELLED'] },
        },
      });
      expect(prisma.table.update).toHaveBeenCalledWith({
        where: { id: 'table-1' },
        data: { status: 'OCCUPIED' },
      });
      expect(result).toEqual(orderWithRelations);
    });

    /**
     * ============================================================
     * PRUEBA 3: Crear orden cuando mesa ya tiene orden activa
     * ============================================================
     *
     * QUÉ probamos:
     * Que el sistema impide crear dos órdenes activas en la misma mesa.
     *
     * POR QUÉ importa:
     * Regla de negocio crítica: una mesa solo puede tener una orden
     * abierta a la vez para evitar confusiones en cocina y caja.
     */
    it('debería lanzar error si la mesa ya tiene una orden activa', async () => {
      const dto: CreateOrderDto = { tableId: 'table-1' };
      const userId = 'user-1';

      prisma.table.findUnique.mockResolvedValue({
        id: 'table-1',
        name: 'Mesa 1',
        status: 'AVAILABLE',
      });
      prisma.order.findFirst.mockResolvedValue({
        id: 'order-active',
        tableId: 'table-1',
        status: 'PENDING',
      });

      await expect(service.create(dto, userId)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.create(dto, userId)).rejects.toThrow(
        'Table already has an active order',
      );
    });

    /**
     * ============================================================
     * PRUEBA 4: Crear orden cuando la mesa no existe
     * ============================================================
     */
    it('debería lanzar error si la mesa no existe', async () => {
      const dto: CreateOrderDto = { tableId: 'table-ghost' };
      const userId = 'user-1';

      prisma.table.findUnique.mockResolvedValue(null);

      await expect(service.create(dto, userId)).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.create(dto, userId)).rejects.toThrow(
        'Table with id table-ghost not found',
      );
    });
  });

  // ==========================================================
  // findById()
  // ==========================================================
  describe('findById', () => {
    it('debería retornar una orden existente', async () => {
      const orderWithRelations = {
        id: 'order-1',
        status: 'PENDING',
        total: 15000,
        items: [],
        table: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      prisma.order.findUnique.mockResolvedValue(orderWithRelations);

      const result = await service.findById('order-1');

      expect(prisma.order.findUnique).toHaveBeenCalledWith({
        where: { id: 'order-1' },
        include: {
          items: {
            include: { product: true, modifiers: true },
            orderBy: { createdAt: 'asc' },
          },
          table: true,
        },
      });
      expect(result).toEqual(orderWithRelations);
    });

    it('debería lanzar error si la orden no existe', async () => {
      prisma.order.findUnique.mockResolvedValue(null);

      await expect(service.findById('order-ghost')).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.findById('order-ghost')).rejects.toThrow(
        'Order with id order-ghost not found',
      );
    });
  });

  // ==========================================================
  // addItems()
  // ==========================================================
  describe('addItems', () => {
    /**
     * ============================================================
     * PRUEBA 7: Agregar items a una orden abierta
     * ============================================================
     *
     * MOCKING AVANZADO:
     * - findUnique se llama DOS veces: una al inicio (findById)
     *   y otra al final (retornar orden actualizada).
     * - Usamos mockResolvedValueOnce para devolver valores distintos
     *   en cada llamada, en el orden correcto.
     */
    it('debería agregar items a una orden abierta', async () => {
      const orderId = 'order-1';
      const dto: AddItemsDto = {
        items: [
          {
            productId: 'prod-1',
            quantity: 2,
            price: 10000,
            notes: 'Sin cebolla',
            modifiers: [],
          },
        ],
      };

      const openOrder = {
        id: 'order-1',
        status: 'PENDING',
        tableId: null,
        items: [],
        table: null,
      };

      const product = {
        id: 'prod-1',
        name: 'Hamburguesa',
        price: 10000,
      };

      const createdItem = {
        id: 'item-1',
        orderId: 'order-1',
        productId: 'prod-1',
        quantity: 2,
        price: 20000,
        notes: 'Sin cebolla',
      };

      const orderWithItems = {
        ...openOrder,
        items: [{ ...createdItem, product, modifiers: [] }],
      };

      prisma.order.findUnique.mockResolvedValueOnce(openOrder);
      prisma.order.findUnique.mockResolvedValueOnce(orderWithItems);

      prisma.orderItem.findMany.mockResolvedValue([]);
      prisma.product.findUnique.mockResolvedValue(product);
      prisma.orderItem.create.mockResolvedValue(createdItem);
      prisma.orderItemModifier.createMany.mockResolvedValue({ count: 0 });
      prisma.order.update.mockResolvedValue({ ...openOrder, total: 20000 });

      const result = await service.addItems(orderId, dto);

      expect(prisma.product.findUnique).toHaveBeenCalledWith({
        where: { id: 'prod-1' },
      });
      expect(prisma.orderItem.create).toHaveBeenCalledWith({
        data: {
          orderId: 'order-1',
          productId: 'prod-1',
          quantity: 2,
          price: 20000,
          notes: 'Sin cebolla',
        },
      });
      expect(prisma.order.update).toHaveBeenCalledWith({
        where: { id: 'order-1' },
        data: { total: 20000 },
      });
      expect(result).toEqual(orderWithItems);
    });

    it('debería lanzar error al agregar items a una orden cerrada', async () => {
      const dto: AddItemsDto = {
        items: [{ productId: 'prod-1', quantity: 1, price: 5000 }],
      };

      prisma.order.findUnique.mockResolvedValue({
        id: 'order-1',
        status: 'CLOSED',
        items: [],
        table: null,
      });

      await expect(service.addItems('order-1', dto)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.addItems('order-1', dto)).rejects.toThrow(
        'Cannot add items to a closed or cancelled order',
      );
    });
  });

  // ==========================================================
  // updateStatus()
  // ==========================================================
  describe('updateStatus', () => {
    /**
     * ============================================================
     * PRUEBA 9: Transición válida PENDING → CONFIRMED
     * ============================================================
     *
     * QUÉ probamos:
     * Que la máquina de estados permite transiciones definidas en
     * VALID_TRANSITIONS.
     */
    it('debería permitir transición válida PENDING → CONFIRMED', async () => {
      const order = {
        id: 'order-1',
        status: 'PENDING',
        tableId: null,
        items: [],
        table: null,
      };

      const updatedOrder = { ...order, status: 'CONFIRMED' };

      prisma.order.findUnique.mockResolvedValue(order);
      prisma.order.update.mockResolvedValue(updatedOrder);

      const result = await service.updateStatus('order-1', 'CONFIRMED');

      expect(prisma.order.update).toHaveBeenCalledWith({
        where: { id: 'order-1' },
        data: { status: 'CONFIRMED' },
        include: {
          items: { include: { product: true, modifiers: true } },
          table: true,
        },
      });
      expect(result).toEqual(updatedOrder);
    });

    /**
     * ============================================================
     * PRUEBA 10: Transición inválida PENDING → DELIVERED
     * ============================================================
     *
     * POR QUÉ importa:
     * Evita que un mesero marque como entregado una orden que
     * nunca pasó por preparación.
     */
    it('debería lanzar error en transición inválida PENDING → DELIVERED', async () => {
      prisma.order.findUnique.mockResolvedValue({
        id: 'order-1',
        status: 'PENDING',
        items: [],
        table: null,
      });

      await expect(
        service.updateStatus('order-1', 'DELIVERED'),
      ).rejects.toThrow(BadRequestException);

      await expect(
        service.updateStatus('order-1', 'DELIVERED'),
      ).rejects.toThrow('Cannot transition from PENDING to DELIVERED');
    });
  });

  // ==========================================================
  // cancel()
  // ==========================================================
  describe('cancel', () => {
    /**
     * ============================================================
     * PRUEBA 11: Cancelar orden libera la mesa
     * ============================================================
     *
     * QUÉ probamos:
     * Al cancelar, la orden pasa a CANCELLED y la mesa asociada
     * vuelve a AVAILABLE para ser reutilizada.
     */
    it('debería cancelar la orden y liberar la mesa', async () => {
      const order = {
        id: 'order-1',
        status: 'PENDING',
        tableId: 'table-1',
        items: [],
        table: { id: 'table-1' },
      };

      const cancelledOrder = { ...order, status: 'CANCELLED' };

      prisma.order.findUnique.mockResolvedValue(order);
      prisma.order.update.mockResolvedValue(cancelledOrder);
      prisma.table.update.mockResolvedValue({
        id: 'table-1',
        status: 'AVAILABLE',
      });

      const result = await service.cancel('order-1');

      expect(prisma.order.update).toHaveBeenCalledWith({
        where: { id: 'order-1' },
        data: { status: 'CANCELLED' },
        include: {
          items: { include: { product: true, modifiers: true } },
          table: true,
        },
      });
      expect(prisma.table.update).toHaveBeenCalledWith({
        where: { id: 'table-1' },
        data: { status: 'AVAILABLE' },
      });
      expect(result).toEqual(cancelledOrder);
    });
  });

  // ==========================================================
  // findActiveByTable()
  // ==========================================================
  describe('findActiveByTable', () => {
    it('debería encontrar la orden activa de una mesa', async () => {
      const table = {
        id: 'table-1',
        name: 'Mesa 2',
        status: 'OCCUPIED',
      };

      const activeOrder = {
        id: 'order-3',
        status: 'PENDING',
        tableId: 'table-1',
        items: [],
        table,
      };

      prisma.table.findUnique.mockResolvedValue(table);
      prisma.order.findFirst.mockResolvedValue(activeOrder);

      const result = await service.findActiveByTable('table-1');

      expect(prisma.table.findUnique).toHaveBeenCalledWith({
        where: { id: 'table-1' },
      });
      expect(prisma.order.findFirst).toHaveBeenCalledWith({
        where: {
          tableId: 'table-1',
          status: { notIn: ['CLOSED', 'CANCELLED'] },
        },
        include: {
          items: {
            include: { product: true, modifiers: true },
            orderBy: { createdAt: 'asc' },
          },
          table: true,
        },
        orderBy: { createdAt: 'desc' },
      });
      expect(result).toEqual(activeOrder);
    });

    it('debería lanzar error si la mesa no existe', async () => {
      prisma.table.findUnique.mockResolvedValue(null);

      await expect(service.findActiveByTable('table-ghost')).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.findActiveByTable('table-ghost')).rejects.toThrow(
        'Table with id table-ghost not found',
      );
    });
  });

  // ==========================================================
  // Casos edge adicionales para cobertura
  // ==========================================================
  describe('create con items', () => {
    /**
     * ============================================================
     * PRUEBA: Crear orden con items iniciales
     * ============================================================
     *
     * QUÉ probamos:
     * Cuando se crea una orden con items en el DTO,
     * se llama a addItemsInternal automáticamente (línea 87).
     */
    it('debería crear una orden con items iniciales', async () => {
      const dto: CreateOrderDto = {
        customerName: 'Pedro López',
        items: [
          {
            productId: 'prod-1',
            quantity: 1,
            price: 10000,
            notes: '',
            modifiers: [],
          },
        ],
      };
      const userId = 'user-1';

      const createdOrder = {
        id: 'order-items',
        tableId: null,
        userId: 'user-1',
        customerName: 'Pedro López',
        orderType: 'LOCAL',
        status: 'PENDING',
        total: 0,
      };

      const product = { id: 'prod-1', name: 'Cerveza', price: 10000 };
      const createdItem = {
        id: 'item-1',
        orderId: 'order-items',
        productId: 'prod-1',
        quantity: 1,
        price: 10000,
      };

      const orderWithItems = {
        ...createdOrder,
        items: [{ ...createdItem, product, modifiers: [] }],
        table: null,
      };

      prisma.order.create.mockResolvedValue(createdOrder);
      prisma.orderItem.findMany.mockResolvedValue([]);
      prisma.product.findUnique.mockResolvedValue(product);
      prisma.orderItem.create.mockResolvedValue(createdItem);
      prisma.orderItemModifier.createMany.mockResolvedValue({ count: 0 });
      prisma.order.update.mockResolvedValue({ ...createdOrder, total: 10000 });
      prisma.order.findUnique.mockResolvedValue(orderWithItems);

      const result = await service.create(dto, userId);

      expect(prisma.orderItem.create).toHaveBeenCalled();
      expect(result.items.length).toBe(1);
    });
  });

  describe('addItemsInternal con modificadores', () => {
    /**
     * ============================================================
     * PRUEBA: Agregar items con modificadores
     * ============================================================
     *
     * QUÉ probamos:
     * Cuando un item tiene modificadores, se crean con createMany
     * (líneas 158-159).
     */
    it('debería crear modificadores al agregar items', async () => {
      const orderId = 'order-mod';
      const dto: AddItemsDto = {
        items: [
          {
            productId: 'prod-1',
            quantity: 1,
            price: 10000,
            notes: '',
            modifiers: [
              {
                modifierName: 'Término',
                selectedOption: 'Medio',
              },
            ],
          },
        ],
      };

      const openOrder = {
        id: 'order-mod',
        status: 'PENDING',
        tableId: null,
        items: [],
        table: null,
      };

      const product = { id: 'prod-1', name: 'Hamburguesa', price: 10000 };
      const createdItem = {
        id: 'item-mod',
        orderId: 'order-mod',
        productId: 'prod-1',
        quantity: 1,
        price: 10000,
      };

      prisma.order.findUnique.mockResolvedValueOnce(openOrder);
      prisma.order.findUnique.mockResolvedValueOnce({
        ...openOrder,
        items: [{ ...createdItem, product, modifiers: [] }],
      });

      prisma.orderItem.findMany.mockResolvedValue([]);
      prisma.product.findUnique.mockResolvedValue(product);
      prisma.orderItem.create.mockResolvedValue(createdItem);
      prisma.orderItemModifier.createMany.mockResolvedValue({ count: 1 });
      prisma.order.update.mockResolvedValue({ ...openOrder, total: 10000 });

      await service.addItems(orderId, dto);

      expect(prisma.orderItemModifier.createMany).toHaveBeenCalledWith({
        data: [
          {
            orderItemId: 'item-mod',
            modifierName: 'Término',
            selectedOption: 'Medio',
          },
        ],
      });
    });
  });

  describe('addItems - producto no encontrado', () => {
    /**
     * ============================================================
     * PRUEBA: Error al agregar item con producto inexistente
     * ============================================================
     *
     * QUÉ probamos:
     * Que se lanza NotFoundException si el producto no existe
     * (línea 139).
     */
    it('debería lanzar error si el producto no existe', async () => {
      const orderId = 'order-1';
      const dto: AddItemsDto = {
        items: [
          {
            productId: 'prod-ghost',
            quantity: 1,
            price: 5000,
            notes: '',
            modifiers: [],
          },
        ],
      };

      const openOrder = {
        id: 'order-1',
        status: 'PENDING',
        tableId: null,
        items: [],
        table: null,
      };

      prisma.order.findUnique.mockResolvedValue(openOrder);
      prisma.orderItem.findMany.mockResolvedValue([]);
      prisma.product.findUnique.mockResolvedValue(null);

      await expect(service.addItems(orderId, dto)).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.addItems(orderId, dto)).rejects.toThrow(
        'Product with id prod-ghost not found',
      );
    });
  });

  describe('updateStatus - cerrar orden con mesa', () => {
    /**
     * ============================================================
     * PRUEBA: Cerrar orden libera la mesa
     * ============================================================
     *
     * QUÉ probamos:
     * Cuando una orden con mesa pasa a CLOSED,
     * la mesa se marca como AVAILABLE (línea 194).
     */
    it('debería liberar la mesa al cerrar la orden', async () => {
      const order = {
        id: 'order-1',
        status: 'DELIVERED',
        tableId: 'table-1',
        items: [],
        table: { id: 'table-1' },
      };

      const closedOrder = { ...order, status: 'CLOSED' };

      prisma.order.findUnique.mockResolvedValue(order);
      prisma.order.update.mockResolvedValue(closedOrder);
      prisma.table.update.mockResolvedValue({
        id: 'table-1',
        status: 'AVAILABLE',
      });

      const result = await service.updateStatus('order-1', 'CLOSED');

      expect(prisma.table.update).toHaveBeenCalledWith({
        where: { id: 'table-1' },
        data: { status: 'AVAILABLE' },
      });
      expect(result.status).toBe('CLOSED');
    });
  });
});
