import { Test, TestingModule } from '@nestjs/testing';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { AddItemsDto } from './dto/add-items.dto';
import { UpdateOrderStatusDto } from './dto/update-status.dto';

/**
 * ============================================================
 * SUITE DE PRUEBAS: OrdersController
 * ============================================================
 *
 * QUÉ probamos:
 * Que el controller delega correctamente en OrdersService y
 * que los parámetros de la request llegan bien al servicio.
 *
 * POR QUÉ NO testeamos lógica de negocio aquí:
 * El controller es una "capa delgada" (thin layer). La lógica
 * pesada (validaciones, cálculos, acceso a BD) vive en el
 * Service. Aquí solo verificamos "enrutamiento" de datos.
 *
 * MOCKING:
 * Reemplazamos OrdersService completo. No nos importa QUÉ hace
 * el servicio; solo nos importa QUE se llame con los argumentos
 * correctos.
 */
describe('OrdersController', () => {
  let controller: OrdersController;
  let ordersService: jest.Mocked<OrdersService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [OrdersController],
      providers: [
        {
          provide: OrdersService,
          useValue: {
            create: jest.fn(),
            findById: jest.fn(),
            addItems: jest.fn(),
            updateStatus: jest.fn(),
            cancel: jest.fn(),
            findActiveByTable: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<OrdersController>(OrdersController);
    ordersService = module.get(OrdersService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  /**
   * ============================================================
   * PRUEBA 1: POST /orders crea orden con usuario del request
   * ============================================================
   *
   * QUÉ probamos:
   * Que el controlador extrae `req.user.userId` del objeto de
   * request (inyectado por Passport/JWT) y se lo pasa al servicio.
   */
  it('POST /orders debería crear una orden con el usuario del request', async () => {
    const dto: CreateOrderDto = {
      tableId: 'table-1',
      customerName: 'Carlos Ruiz',
      items: [],
    };
    const req = { user: { userId: 'user-123' } };
    const expectedResult = { id: 'order-1', status: 'PENDING' };

    ordersService.create.mockResolvedValue(expectedResult as any);

    const result = await controller.create(dto, req);

    expect(ordersService.create).toHaveBeenCalledWith(dto, 'user-123');
    expect(result).toEqual(expectedResult);
  });

  /**
   * ============================================================
   * PRUEBA 2: GET /orders/:id retorna una orden
   * ============================================================
   */
  it('GET /orders/:id debería retornar una orden', async () => {
    const expectedResult = { id: 'order-1', items: [], table: null };
    ordersService.findById.mockResolvedValue(expectedResult as any);

    const result = await controller.findOne('order-1');

    expect(ordersService.findById).toHaveBeenCalledWith('order-1');
    expect(result).toEqual(expectedResult);
  });

  /**
   * ============================================================
   * PRUEBA 3: POST /orders/:id/items agrega items
   * ============================================================
   */
  it('POST /orders/:id/items debería agregar items a la orden', async () => {
    const dto: AddItemsDto = {
      items: [{ productId: 'prod-1', quantity: 1, price: 5000 }],
    };
    const expectedResult = { id: 'order-1', items: [{ productId: 'prod-1' }] };

    ordersService.addItems.mockResolvedValue(expectedResult as any);

    const result = await controller.addItems('order-1', dto);

    expect(ordersService.addItems).toHaveBeenCalledWith('order-1', dto);
    expect(result).toEqual(expectedResult);
  });

  /**
   * ============================================================
   * PRUEBA 4: PUT /orders/:id/status actualiza estado
   * ============================================================
   */
  it('PUT /orders/:id/status debería actualizar el estado', async () => {
    const dto: UpdateOrderStatusDto = { status: 'CONFIRMED' };
    const expectedResult = { id: 'order-1', status: 'CONFIRMED' };

    ordersService.updateStatus.mockResolvedValue(expectedResult as any);

    const result = await controller.updateStatus('order-1', dto);

    expect(ordersService.updateStatus).toHaveBeenCalledWith(
      'order-1',
      'CONFIRMED',
    );
    expect(result).toEqual(expectedResult);
  });

  /**
   * ============================================================
   * PRUEBA 5: DELETE /orders/:id cancela orden
   * ============================================================
   */
  it('DELETE /orders/:id debería cancelar la orden', async () => {
    const expectedResult = { id: 'order-1', status: 'CANCELLED' };

    ordersService.cancel.mockResolvedValue(expectedResult as any);

    const result = await controller.cancel('order-1');

    expect(ordersService.cancel).toHaveBeenCalledWith('order-1');
    expect(result).toEqual(expectedResult);
  });

  /**
   * ============================================================
   * PRUEBA 6: GET /tables/:tableId/orders/active
   * ============================================================
   */
  it('GET /tables/:tableId/orders/active debería retornar orden activa', async () => {
    const expectedResult = { id: 'order-2', status: 'PENDING' };

    ordersService.findActiveByTable.mockResolvedValue(expectedResult as any);

    const result = await controller.findActiveByTable('table-5');

    expect(ordersService.findActiveByTable).toHaveBeenCalledWith('table-5');
    expect(result).toEqual(expectedResult);
  });
});
