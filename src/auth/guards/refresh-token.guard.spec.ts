import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException, ExecutionContext } from '@nestjs/common';
import { RefreshTokenGuard } from './refresh-token.guard';
import { PrismaService } from '../../prisma.service';

/**
 * ============================================================
 * SUITE DE PRUEBAS: RefreshTokenGuard
 * ============================================================
 *
 * Probamos que el guard valida correctamente los refresh tokens.
 * MOCKING:
 * - PrismaService → mock de refreshToken.findUnique y delete
 */
describe('RefreshTokenGuard', () => {
  let guard: RefreshTokenGuard;
  let prisma: any;

  beforeEach(async () => {
    /**
     * Arrange: configurar módulo de testing con mock de PrismaService
     */
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RefreshTokenGuard,
        {
          provide: PrismaService,
          useValue: {
            refreshToken: {
              findUnique: jest.fn(),
              delete: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    guard = module.get<RefreshTokenGuard>(RefreshTokenGuard);
    prisma = module.get(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  /**
   * ============================================================
   * PRUEBA 1: canActivate con refresh token válido
   * ============================================================
   *
   * QUÉ probamos:
   * Que un refresh token válido y no expirado permite acceso.
   *
   * Arrange:
   * - Authorization header con Bearer token
   * - refreshToken.findUnique retorna token válido con usuario
   *
   * Act: Ejecutamos guard.canActivate(context)
   *
   * Assert: Retorna true y request.user se establece
   */
  it('debería permitir acceso con refresh token válido', async () => {
    const mockRequest = {
      headers: { authorization: 'Bearer valid_refresh_token' },
      user: undefined,
    };

    const mockContext = createMockExecutionContext(mockRequest);

    const storedToken = {
      token: 'valid_refresh_token',
      userId: 'user-1',
      expiresAt: new Date(Date.now() + 86400000), // 1 día en el futuro
      user: {
        id: 'user-1',
        email: 'test@lalora.com',
        role: 'ADMIN',
      },
    };

    prisma.refreshToken.findUnique.mockResolvedValue(storedToken);

    const result = await guard.canActivate(mockContext);

    expect(result).toBe(true);
    expect(prisma.refreshToken.findUnique).toHaveBeenCalledWith({
      where: { token: 'valid_refresh_token' },
      include: { user: true },
    });
    expect(mockRequest.user).toEqual({
      userId: 'user-1',
      email: 'test@lalora.com',
      role: 'ADMIN',
      refreshToken: 'valid_refresh_token',
    });
  });

  /**
   * ============================================================
   * PRUEBA 2: canActivate sin token en header
   * ============================================================
   */
  it('debería lanzar UnauthorizedException cuando no hay token', async () => {
    const mockRequest = {
      headers: {},
      user: undefined,
    };

    const mockContext = createMockExecutionContext(mockRequest);

    await expect(guard.canActivate(mockContext)).rejects.toThrow(
      'Invalid or missing refresh token',
    );
    expect(prisma.refreshToken.findUnique).not.toHaveBeenCalled();
  });

  /**
   * ============================================================
   * PRUEBA 3: canActivate con token expirado
   * ============================================================
   */
  it('debería lanzar UnauthorizedException cuando el token está expirado', async () => {
    const mockRequest = {
      headers: { authorization: 'Bearer expired_token' },
      user: undefined,
    };

    const mockContext = createMockExecutionContext(mockRequest);

    const expiredToken = {
      token: 'expired_token',
      userId: 'user-1',
      expiresAt: new Date(Date.now() - 86400000), // 1 día en el pasado
      user: {
        id: 'user-1',
        email: 'test@lalora.com',
        role: 'ADMIN',
      },
    };

    prisma.refreshToken.findUnique.mockResolvedValue(expiredToken);
    prisma.refreshToken.delete.mockResolvedValue({ token: 'expired_token' });

    await expect(guard.canActivate(mockContext)).rejects.toThrow(
      'Refresh token expired or invalid',
    );
    expect(prisma.refreshToken.delete).toHaveBeenCalledWith({
      where: { token: 'expired_token' },
    });
  });

  /**
   * ============================================================
   * PRUEBA 4: canActivate con token no encontrado
   * ============================================================
   */
  it('debería lanzar UnauthorizedException cuando el token no existe', async () => {
    const mockRequest = {
      headers: { authorization: 'Bearer nonexistent_token' },
      user: undefined,
    };

    const mockContext = createMockExecutionContext(mockRequest);

    prisma.refreshToken.findUnique.mockResolvedValue(null);

    await expect(guard.canActivate(mockContext)).rejects.toThrow(
      'Refresh token expired or invalid',
    );
    expect(prisma.refreshToken.delete).not.toHaveBeenCalled();
  });
});

/**
 * Helper para crear un mock de ExecutionContext
 */
function createMockExecutionContext(request: any): ExecutionContext {
  return {
    switchToHttp: jest.fn().mockReturnValue({
      getRequest: jest.fn().mockReturnValue(request),
    }),
  } as unknown as ExecutionContext;
}
