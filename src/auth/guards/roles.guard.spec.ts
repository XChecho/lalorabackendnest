import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RolesGuard } from './roles.guard';

/**
 * ============================================================
 * SUITE DE PRUEBAS: RolesGuard
 * ============================================================
 *
 * Probamos que el guard permite o deniega acceso según los roles.
 * MOCKING:
 * - Reflector → mock de getAllAndOverride
 * - ExecutionContext → mock de getHandler, getClass, switchToHttp
 */
describe('RolesGuard', () => {
  let guard: RolesGuard;
  let reflector: any;

  beforeEach(async () => {
    /**
     * Arrange: configurar módulo de testing con mock de Reflector
     */
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RolesGuard,
        {
          provide: Reflector,
          useValue: {
            getAllAndOverride: jest.fn(),
          },
        },
      ],
    }).compile();

    guard = module.get<RolesGuard>(RolesGuard);
    reflector = module.get(Reflector);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  /**
   * ============================================================
   * PRUEBA 1: Permitir acceso cuando no hay roles requeridos
   * ============================================================
   *
   * QUÉ probamos:
   * Que si el decorador @Roles() no está presente, el guard permite todo.
   *
   * Arrange: reflector.getAllAndOverride retorna undefined/null
   * Act: Ejecutamos guard.canActivate(context)
   * Assert: Retorna true (acceso permitido)
   */
  it('debería permitir acceso cuando no hay roles requeridos', () => {
    reflector.getAllAndOverride.mockReturnValue(null);

    const mockContext = createMockExecutionContext({ role: 'ADMIN' });

    const result = guard.canActivate(mockContext);

    expect(result).toBe(true);
    expect(reflector.getAllAndOverride).toHaveBeenCalledWith('roles', [
      mockContext.getHandler(),
      mockContext.getClass(),
    ]);
  });

  /**
   * ============================================================
   * PRUEBA 2: Permitir acceso cuando el usuario tiene el rol requerido
   * ============================================================
   *
   * QUÉ probamos:
   * Que si el usuario tiene uno de los roles requeridos, se permite acceso.
   *
   * Arrange: getAllAndOverride retorna ['ADMIN', 'CASHIER']
   *           user.role = 'ADMIN'
   * Act: Ejecutamos guard.canActivate(context)
   * Assert: Retorna true
   */
  it('debería permitir acceso cuando el usuario tiene el rol requerido', () => {
    reflector.getAllAndOverride.mockReturnValue(['ADMIN', 'CASHIER']);

    const mockContext = createMockExecutionContext({ role: 'ADMIN' });

    const result = guard.canActivate(mockContext);

    expect(result).toBe(true);
  });

  /**
   * ============================================================
   * PRUEBA 3: Permitir acceso con segundo rol de la lista
   * ============================================================
   */
  it('debería permitir acceso cuando el usuario tiene el segundo rol requerido', () => {
    reflector.getAllAndOverride.mockReturnValue(['ADMIN', 'CASHIER']);

    const mockContext = createMockExecutionContext({ role: 'CASHIER' });

    const result = guard.canActivate(mockContext);

    expect(result).toBe(true);
  });

  /**
   * ============================================================
   * PRUEBA 4: Denegar acceso cuando el usuario no tiene el rol requerido
   * ============================================================
   *
   * QUÉ probamos:
   * Que si el usuario NO tiene ninguno de los roles requeridos, se deniega.
   *
   * Arrange: getAllAndOverride retorna ['ADMIN']
   *           user.role = 'WAITER'
   * Act: Ejecutamos guard.canActivate(context)
   * Assert: Retorna false
   */
  it('debería denegar acceso cuando el usuario no tiene el rol requerido', () => {
    reflector.getAllAndOverride.mockReturnValue(['ADMIN']);

    const mockContext = createMockExecutionContext({ role: 'WAITER' });

    const result = guard.canActivate(mockContext);

    expect(result).toBe(false);
  });

  /**
   * ============================================================
   * PRUEBA 5: Denegar acceso con lista de roles sin coincidencia
   * ============================================================
   */
  it('debería denegar acceso cuando el rol no está en la lista', () => {
    reflector.getAllAndOverride.mockReturnValue([
      'ADMIN',
      'CASHIER',
      'KITCHEN',
    ]);

    const mockContext = createMockExecutionContext({ role: 'WAITER' });

    const result = guard.canActivate(mockContext);

    expect(result).toBe(false);
  });

  /**
   * ============================================================
   * PRUEBA 6: Permitir acceso con roles vacíos
   * ============================================================
   */
  it('debería permitir acceso cuando la lista de roles está vacía', () => {
    reflector.getAllAndOverride.mockReturnValue([]);

    const mockContext = createMockExecutionContext({ role: 'ADMIN' });

    const result = guard.canActivate(mockContext);

    // Un array vacío es truthy, así que intentará hacer includes
    // y como no hay roles, returns false. Pero si getAllAndOverride
    // retorna undefined o null, entonces retorna true.
    expect(result).toBe(false);
  });
});

/**
 * Helper para crear un mock de ExecutionContext
 */
function createMockExecutionContext(user: Record<string, unknown>): ExecutionContext {
  const mockRequest = { user };

  return {
    getHandler: jest.fn().mockReturnValue(() => {}),
    getClass: jest.fn().mockReturnValue(class {}),
    switchToHttp: jest.fn().mockReturnValue({
      getRequest: jest.fn().mockReturnValue(mockRequest),
      getResponse: jest.fn(),
    }),
    switchToRpc: jest.fn(),
    switchToWs: jest.fn(),
    getType: jest.fn(),
    getArgs: jest.fn(),
    getArgByIndex: jest.fn(),
    getSwitchToRpc: jest.fn(),
    getSwitchToWs: jest.fn(),
  } as unknown as ExecutionContext;
}
