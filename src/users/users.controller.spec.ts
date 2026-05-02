import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

/**
 * ============================================================
 * SUITE DE PRUEBAS: UsersController
 * ============================================================
 *
 * QUÉ probamos:
 * Que el controller delega correctamente en UsersService y
 * que los parámetros de la request llegan bien al servicio.
 *
 * POR QUÉ NO testeamos lógica de negocio aquí:
 * El controller es una "capa delgada" (thin layer). La lógica
 * de acceso a BD vive en el Service. Aquí solo verificamos
 * "enrutamiento" de datos.
 *
 * MOCKING:
 * Reemplazamos UsersService completo. No nos importa QUÉ hace
 * el servicio; solo nos importa QUE se llame con los argumentos
 * correctos.
 */
describe('UsersController', () => {
  let controller: UsersController;
  let usersService: jest.Mocked<UsersService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        {
          provide: UsersService,
          useValue: {
            findAll: jest.fn(),
            findById: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<UsersController>(UsersController);
    usersService = module.get(UsersService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  /**
   * ============================================================
   * PRUEBA 1: GET /users — listar todos los usuarios
   * ============================================================
   *
   * QUÉ probamos:
   * Que el controller delega en usersService.findAll() sin
   * parámetros adicionales.
   */
  it('GET /users debería delegar en findAll', async () => {
    const expected = [
      {
        id: 'user-1',
        email: 'admin@lalora.com',
        firstName: 'Admin',
        lastName: 'User',
        role: 'ADMIN',
        active: true,
      },
      {
        id: 'user-2',
        email: 'mesero@lalora.com',
        firstName: 'Mesero',
        lastName: 'Uno',
        role: 'WAITER',
        active: true,
      },
    ];

    usersService.findAll.mockResolvedValue(expected as any);

    const result = await controller.findAll();

    expect(usersService.findAll).toHaveBeenCalled();
    expect(result).toEqual(expected);
  });

  /**
   * ============================================================
   * PRUEBA 2: GET /users/:id — obtener un usuario
   * ============================================================
   *
   * QUÉ probamos:
   * Que el controller extrae id de los params y lo pasa
   * correctamente al servicio.
   */
  it('GET /users/:id debería delegar en findById', async () => {
    const expected = {
      id: 'user-1',
      email: 'admin@lalora.com',
      firstName: 'Admin',
      lastName: 'User',
      role: 'ADMIN',
      active: true,
    };

    usersService.findById.mockResolvedValue(expected as any);

    const result = await controller.findOne('user-1');

    expect(usersService.findById).toHaveBeenCalledWith('user-1');
    expect(result).toEqual(expected);
  });
});
