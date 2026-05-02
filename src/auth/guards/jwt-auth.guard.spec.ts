import { Test, TestingModule } from '@nestjs/testing';
import { JwtAuthGuard } from './jwt-auth.guard';

/**
 * ============================================================
 * SUITE DE PRUEBAS: JwtAuthGuard
 * ============================================================
 *
 * Este guard es un wrapper de AuthGuard('jwt') de Passport.
 * Las pruebas se limitan a verificar que la instancia se crea
 * correctamente, ya que la lógica de validación está en Passport.
 */
describe('JwtAuthGuard', () => {
  let guard: JwtAuthGuard;

  beforeEach(async () => {
    /**
     * Arrange: crear instancia del guard directamente
     * (no necesita providers especiales, extiende AuthGuard)
     */
    const module: TestingModule = await Test.createTestingModule({
      providers: [JwtAuthGuard],
    }).compile();

    guard = module.get<JwtAuthGuard>(JwtAuthGuard);
  });

  /**
   * ============================================================
   * PRUEBA 1: El guard se instancia correctamente
   * ============================================================
   *
   * QUÉ probamos:
   * Que JwtAuthGuard puede ser instanciado por NestJS.
   *
   * Assert: Verificamos que es una instancia de JwtAuthGuard
   */
  it('debería estar definido', () => {
    expect(guard).toBeDefined();
  });

  /**
   * ============================================================
   * PRUEBA 2: El guard tiene método canActivate
   * ============================================================
   */
  it('debería tener el método canActivate', () => {
    expect(typeof guard.canActivate).toBe('function');
  });

  /**
   * ============================================================
   * PRUEBA 3: El guard tiene método handleRequest
   * ============================================================
   */
  it('debería tener el método handleRequest', () => {
    expect(typeof guard.handleRequest).toBe('function');
  });

  /**
   * ============================================================
   * PRUEBA 4: handleRequest retorna usuario cuando es válido
   * ============================================================
   *
   * QUÉ probamos:
   * Que handleRequest retorna el usuario cuando no hay error.
   *
   * Arrange: user válido, sin error
   * Act: Ejecutamos guard.handleRequest(err, user, info)
   * Assert: Retorna el usuario
   */
  it('debería retornar el usuario cuando es válido', () => {
    const user = { userId: 'user-1', email: 'test@lalora.com' };

    const result = guard.handleRequest(null, user, null);

    expect(result).toBe(user);
  });

  /**
   * ============================================================
   * PRUEBA 5: handleRequest lanza error cuando hay error
   * ============================================================
   */
  it('debería lanzar el error cuando hay un error de validación', () => {
    const error = new Error('Token expired');

    expect(() => guard.handleRequest(error, null, null)).toThrow(error);
  });

  /**
   * ============================================================
   * PRUEBA 6: handleRequest lanza UnauthorizedException cuando no hay usuario
   * ============================================================
   */
  it('debería lanzar UnauthorizedException cuando no hay usuario', () => {
    expect(() => guard.handleRequest(null, null, null)).toThrow(
      'Invalid or missing token',
    );
  });

  /**
   * ============================================================
   * PRUEBA 7: handleRequest lanza error cuando usuario es null con info
   * ============================================================
   */
  it('debería lanzar UnauthorizedException con info de error', () => {
    const info = { message: 'jwt expired' };

    expect(() => guard.handleRequest(null, null, info)).toThrow(
      'Invalid or missing token',
    );
  });
});
