import { Test, TestingModule } from '@nestjs/testing';
import { JwtStrategy } from './jwt.strategy';

/**
 * ============================================================
 * SUITE DE PRUEBAS: JwtStrategy
 * ============================================================
 *
 * Probamos la estrategia de Passport JWT.
 * Esta estrategia configura cómo se extrae y valida el token JWT.
 */
describe('JwtStrategy', () => {
  let strategy: JwtStrategy;

  beforeEach(async () => {
    /**
     * Arrange: crear instancia de la estrategia
     * La estrategia se configura con secretOrKey y extractor de token
     */
    const originalJwtSecret = process.env.JWT_SECRET;

    const module: TestingModule = await Test.createTestingModule({
      providers: [JwtStrategy],
    }).compile();

    strategy = module.get<JwtStrategy>(JwtStrategy);

    // Restaurar variable de entorno
    process.env.JWT_SECRET = originalJwtSecret;
  });

  /**
   * ============================================================
   * PRUEBA 1: La estrategia se instancia correctamente
   * ============================================================
   *
   * QUÉ probamos:
   * Que JwtStrategy puede ser instanciada por NestJS.
   *
   * Assert: Verificamos que es una instancia de JwtStrategy
   */
  it('debería estar definida', () => {
    expect(strategy).toBeDefined();
  });

  /**
   * ============================================================
   * PRUEBA 2: validate() retorna el payload transformado
   * ============================================================
   *
   * QUÉ probamos:
   * Que el método validate transforma el payload JWT al formato
   * que la app espera (userId, email, role).
   *
   * Arrange: payload JWT con sub, email, role
   * Act: Ejecutamos strategy.validate(payload)
   * Assert: Verificamos que retorna { userId, email, role }
   */
  it('debería retornar el usuario con userId, email y role', () => {
    const payload = {
      sub: 'user-123',
      email: 'test@lalora.com',
      role: 'ADMIN',
    };

    const result = strategy.validate(payload);

    expect(result).toEqual({
      userId: 'user-123',
      email: 'test@lalora.com',
      role: 'ADMIN',
    });
  });

  /**
   * ============================================================
   * PRUEBA 3: validate() mapea sub a userId
   * ============================================================
   *
   * QUÉ probamos:
   * Que el campo 'sub' del JWT se mapea correctamente a 'userId'.
   */
  it('debería mapear sub del payload a userId', () => {
    const payload = {
      sub: 'user-456',
      email: 'juan@lalora.com',
      role: 'WAITER',
    };

    const result = strategy.validate(payload);

    expect(result.userId).toBe('user-456');
  });

  /**
   * ============================================================
   * PRUEBA 4: validate() con rol de mesero
   * ============================================================
   */
  it('debería manejar correctamente el rol WAITER', () => {
    const payload = {
      sub: 'user-789',
      email: 'mesero@lalora.com',
      role: 'WAITER',
    };

    const result = strategy.validate(payload);

    expect(result.role).toBe('WAITER');
    expect(result.email).toBe('mesero@lalora.com');
  });

  /**
   * ============================================================
   * PRUEBA 5: validate() con rol de cocina
   * ============================================================
   */
  it('debería manejar correctamente el rol KITCHEN', () => {
    const payload = {
      sub: 'user-kitchen',
      email: 'cocina@lalora.com',
      role: 'KITCHEN',
    };

    const result = strategy.validate(payload);

    expect(result).toEqual({
      userId: 'user-kitchen',
      email: 'cocina@lalora.com',
      role: 'KITCHEN',
    });
  });

  /**
   * ============================================================
   * PRUEBA 6: validate() con rol de cajero
   * ============================================================
   */
  it('debería manejar correctamente el rol CASHIER', () => {
    const payload = {
      sub: 'user-cashier',
      email: 'caja@lalora.com',
      role: 'CASHIER',
    };

    const result = strategy.validate(payload);

    expect(result.role).toBe('CASHIER');
  });
});
