import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { LoggerService } from '../common/logger/logger.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RefreshTokenGuard } from './guards/refresh-token.guard';
import { LoginDto } from './dto/login.dto';
import { CreateUserDto, UserType } from './dto/create-user.dto';
import { RecoverPasswordDto } from './dto/recover-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';

/**
 * ============================================================
 * SUITE DE PRUEBAS: AuthController
 * ============================================================
 *
 * Probamos que el controller delega correctamente al servicio.
 * MOCKING:
 * - AuthService → mock de todos los métodos
 * - JwtService → mock de sign y decode
 * - LoggerService → mock de log/error/warn
 * - Guards → mocks para evitar resolver dependencias
 */

// Mock guards que no ejecutan lógica real
const mockJwtAuthGuard = { canActivate: jest.fn(() => true) };
const mockRefreshTokenGuard = { canActivate: jest.fn(() => true) };

describe('AuthController', () => {
  let controller: AuthController;
  let authService: any;
  let jwtService: any;
  let logger: any;

  beforeEach(async () => {
    /**
     * Arrange: configurar módulo de testing con mocks
     */
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: {
            login: jest.fn(),
            createUser: jest.fn(),
            recoverPassword: jest.fn(),
            resetPassword: jest.fn(),
            devLogin: jest.fn(),
            refreshToken: jest.fn(),
            logout: jest.fn(),
          },
        },
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn(),
            decode: jest.fn(),
          },
        },
        {
          provide: LoggerService,
          useValue: {
            log: jest.fn(),
            error: jest.fn(),
            warn: jest.fn(),
            debug: jest.fn(),
          },
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue(mockJwtAuthGuard)
      .overrideGuard(RefreshTokenGuard)
      .useValue(mockRefreshTokenGuard)
      .compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get(AuthService);
    jwtService = module.get(JwtService);
    logger = module.get(LoggerService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // ==========================================================
  // POST /auth/login
  // ==========================================================
  describe('login', () => {
    /**
     * ============================================================
     * PRUEBA 1: POST /auth/login delega al servicio
     * ============================================================
     *
     * QUÉ probamos:
     * Que el controller recibe el DTO y lo pasa al servicio.
     *
     * Arrange: loginDto preparado, authService.login mockeado
     * Act: Ejecutamos controller.login(dto)
     * Assert: Verificamos que authService.login fue llamado con dto
     */
    it('debería delegar el login al AuthService', async () => {
      const loginDto: LoginDto = {
        email: 'test@lalora.com',
        password: 'password123',
      };

      const loginResponse = {
        access_token: 'token_123',
        refresh_token: 'refresh_123',
        firstName: 'Test',
        lastName: 'User',
        userType: 'admin',
      };

      authService.login.mockResolvedValue(loginResponse);

      const result = await controller.login(loginDto);

      expect(authService.login).toHaveBeenCalledWith(loginDto);
      expect(result).toEqual(loginResponse);
    });
  });

  // ==========================================================
  // POST /auth/create-user
  // ==========================================================
  describe('createUser', () => {
    /**
     * ============================================================
     * PRUEBA 2: POST /auth/create-user con token válido
     * ============================================================
     *
     * QUÉ probamos:
     * Que el controller extrae el email del request y lo pasa al servicio.
     *
     * Arrange: createUserDto y req con user.email mockeados
     * Act: Ejecutamos controller.createUser(dto, req)
     * Assert: Verificamos que authService.createUser fue llamado
     */
    it('debería delegar la creación de usuario al AuthService con email del admin', async () => {
      const createUserDto: CreateUserDto = {
        firstName: 'Juan',
        lastName: 'Pérez',
        email: 'juan@lalora.com',
        phoneNumber: '+1234567890',
        userType: UserType.WAITER,
      };

      const req = { user: { email: 'admin@lalora.com' } };

      const createdUser = {
        id: 'user-1',
        email: 'juan@lalora.com',
        firstName: 'Juan',
        lastName: 'Pérez',
        phoneNumber: '+1234567890',
        userType: 'WAITRESS',
      };

      authService.createUser.mockResolvedValue(createdUser);

      const result = await controller.createUser(createUserDto, req);

      expect(authService.createUser).toHaveBeenCalledWith(
        createUserDto,
        'admin@lalora.com',
      );
      expect(result).toEqual(createdUser);
    });

    /**
     * ============================================================
     * PRUEBA 3: POST /auth/create-user sin email en token
     * ============================================================
     */
    it('debería lanzar UnauthorizedException cuando el token no tiene email', () => {
      const createUserDto: CreateUserDto = {
        firstName: 'Juan',
        lastName: 'Pérez',
        email: 'juan@lalora.com',
        phoneNumber: '+1234567890',
        userType: UserType.WAITER,
      };

      const req = { user: {} };

      expect(() => controller.createUser(createUserDto, req)).toThrow(
        'Invalid token',
      );
      expect(authService.createUser).not.toHaveBeenCalled();
    });
  });

  // ==========================================================
  // POST /auth/recover-password
  // ==========================================================
  describe('recoverPassword', () => {
    /**
     * ============================================================
     * PRUEBA 4: POST /auth/recover-password delega al servicio
     * ============================================================
     */
    it('debería delegar la recuperación de contraseña al AuthService', async () => {
      const recoverDto: RecoverPasswordDto = {
        email: 'test@lalora.com',
      };

      const response = { message: 'Recovery code sent to email' };

      authService.recoverPassword.mockResolvedValue(response);

      const result = await controller.recoverPassword(recoverDto);

      expect(authService.recoverPassword).toHaveBeenCalledWith(recoverDto);
      expect(result).toEqual(response);
    });
  });

  // ==========================================================
  // POST /auth/reset-password
  // ==========================================================
  describe('resetPassword', () => {
    /**
     * ============================================================
     * PRUEBA 5: POST /auth/reset-password delega al servicio
     * ============================================================
     */
    it('debería delegar el reset de contraseña al AuthService', async () => {
      const resetDto: ResetPasswordDto = {
        email: 'test@lalora.com',
        code: '123456',
        newPassword: 'NewPassword123',
      };

      const response = { message: 'Password reset successfully' };

      authService.resetPassword.mockResolvedValue(response);

      const result = await controller.resetPassword(resetDto);

      expect(authService.resetPassword).toHaveBeenCalledWith(resetDto);
      expect(result).toEqual(response);
    });
  });

  // ==========================================================
  // POST /auth/dev-login
  // ==========================================================
  describe('devLogin', () => {
    /**
     * ============================================================
     * PRUEBA 6: POST /auth/dev-login en entorno de desarrollo
     * ============================================================
     *
     * QUÉ probamos:
     * Que dev login funciona en desarrollo o cuando ALLOW_DEV_LOGIN=true.
     *
     * Arrange: NODE_ENV=development, req mockeado
     * Act: Ejecutamos controller.devLogin(dto, req)
     * Assert: Verificamos que authService.devLogin fue llamado
     */
    it('debería permitir dev login en entorno de desarrollo', async () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      const devLoginDto = { email: 'dev@lalora.com' };
      const req = { headers: {}, ip: '127.0.0.1' };

      const response = {
        access_token: 'dev_token',
        refresh_token: 'dev_refresh',
        role: 'ADMIN',
      };

      authService.devLogin.mockResolvedValue(response);

      const result = await controller.devLogin(devLoginDto, req);

      expect(authService.devLogin).toHaveBeenCalledWith('dev@lalora.com');
      expect(result).toEqual(response);

      process.env.NODE_ENV = originalEnv;
    });

    /**
     * ============================================================
     * PRUEBA 7: POST /auth/dev-login con ALLOW_DEV_LOGIN=true
     * ============================================================
     */
    it('debería permitir dev login cuando ALLOW_DEV_LOGIN es true', async () => {
      const originalEnv = process.env.NODE_ENV;
      const originalAllow = process.env.ALLOW_DEV_LOGIN;

      process.env.NODE_ENV = 'production';
      process.env.ALLOW_DEV_LOGIN = 'true';

      const devLoginDto = { email: 'dev@lalora.com' };
      const req = { headers: {}, ip: '1.2.3.4' };

      const response = {
        access_token: 'dev_token',
        refresh_token: 'dev_refresh',
        role: 'ADMIN',
      };

      authService.devLogin.mockResolvedValue(response);

      const result = await controller.devLogin(devLoginDto, req);

      expect(authService.devLogin).toHaveBeenCalledWith('dev@lalora.com');
      expect(result).toEqual(response);

      process.env.NODE_ENV = originalEnv;
      process.env.ALLOW_DEV_LOGIN = originalAllow;
    });

    /**
     * ============================================================
     * PRUEBA 8: POST /auth/dev-login bloqueado en producción desde IP externa
     * ============================================================
     */
    it('debería bloquear dev login en producción desde IP no localhost', async () => {
      const originalEnv = process.env.NODE_ENV;
      const originalAllow = process.env.ALLOW_DEV_LOGIN;

      process.env.NODE_ENV = 'production';
      process.env.ALLOW_DEV_LOGIN = 'false';

      const devLoginDto = { email: 'dev@lalora.com' };
      const req = { headers: {}, ip: '1.2.3.4' };

      expect(() => controller.devLogin(devLoginDto, req)).toThrow(
        'Dev login only available from localhost',
      );
      expect(logger.warn).toHaveBeenCalledWith('Dev login blocked', {
        ip: '1.2.3.4',
      });
      expect(authService.devLogin).not.toHaveBeenCalled();

      process.env.NODE_ENV = originalEnv;
      process.env.ALLOW_DEV_LOGIN = originalAllow;
    });

    /**
     * ============================================================
     * PRUEBA 9: POST /auth/dev-login permite localhost en producción
     * ============================================================
     */
    it('debería permitir dev login desde localhost incluso en producción', async () => {
      const originalEnv = process.env.NODE_ENV;
      const originalAllow = process.env.ALLOW_DEV_LOGIN;

      process.env.NODE_ENV = 'production';
      process.env.ALLOW_DEV_LOGIN = 'false';

      const devLoginDto = { email: 'dev@lalora.com' };
      const req = { headers: {}, ip: '127.0.0.1' };

      const response = {
        access_token: 'dev_token',
        refresh_token: 'dev_refresh',
        role: 'ADMIN',
      };

      authService.devLogin.mockResolvedValue(response);

      const result = await controller.devLogin(devLoginDto, req);

      expect(authService.devLogin).toHaveBeenCalledWith('dev@lalora.com');
      expect(result).toEqual(response);

      process.env.NODE_ENV = originalEnv;
      process.env.ALLOW_DEV_LOGIN = originalAllow;
    });

    /**
     * ============================================================
     * PRUEBA 10: POST /auth/dev-login permite IPv6 localhost
     * ============================================================
     */
    it('debería permitir dev login desde IPv6 localhost (::1)', async () => {
      const originalEnv = process.env.NODE_ENV;
      const originalAllow = process.env.ALLOW_DEV_LOGIN;

      process.env.NODE_ENV = 'production';
      process.env.ALLOW_DEV_LOGIN = 'false';

      const devLoginDto = { email: 'dev@lalora.com' };
      const req = { headers: {}, ip: '::1' };

      const response = {
        access_token: 'dev_token',
        refresh_token: 'dev_refresh',
        role: 'ADMIN',
      };

      authService.devLogin.mockResolvedValue(response);

      const result = await controller.devLogin(devLoginDto, req);

      expect(authService.devLogin).toHaveBeenCalledWith('dev@lalora.com');
      expect(result).toEqual(response);

      process.env.NODE_ENV = originalEnv;
      process.env.ALLOW_DEV_LOGIN = originalAllow;
    });

    /**
     * ============================================================
     * PRUEBA 11: POST /auth/dev-login permite IPs de Docker
     * ============================================================
     */
    it('debería permitir dev login desde IPs de Docker (172.17.x.x)', async () => {
      const originalEnv = process.env.NODE_ENV;
      const originalAllow = process.env.ALLOW_DEV_LOGIN;

      process.env.NODE_ENV = 'production';
      process.env.ALLOW_DEV_LOGIN = 'false';

      const devLoginDto = { email: 'dev@lalora.com' };
      const req = { headers: {}, ip: '172.17.0.1' };

      const response = {
        access_token: 'dev_token',
        refresh_token: 'dev_refresh',
        role: 'ADMIN',
      };

      authService.devLogin.mockResolvedValue(response);

      const result = await controller.devLogin(devLoginDto, req);

      expect(authService.devLogin).toHaveBeenCalledWith('dev@lalora.com');
      expect(result).toEqual(response);

      process.env.NODE_ENV = originalEnv;
      process.env.ALLOW_DEV_LOGIN = originalAllow;
    });

    /**
     * ============================================================
     * PRUEBA 12: POST /auth/dev-login usa x-forwarded-for
     * ============================================================
     */
    it('debería usar x-forwarded-for cuando ip no está disponible', async () => {
      const originalEnv = process.env.NODE_ENV;
      const originalAllow = process.env.ALLOW_DEV_LOGIN;

      process.env.NODE_ENV = 'production';
      process.env.ALLOW_DEV_LOGIN = 'false';

      const devLoginDto = { email: 'dev@lalora.com' };
      const req = {
        headers: { 'x-forwarded-for': '127.0.0.1' },
        ip: undefined,
        socket: { remoteAddress: undefined },
      };

      const response = {
        access_token: 'dev_token',
        refresh_token: 'dev_refresh',
        role: 'ADMIN',
      };

      authService.devLogin.mockResolvedValue(response);

      const result = await controller.devLogin(devLoginDto, req);

      expect(authService.devLogin).toHaveBeenCalledWith('dev@lalora.com');
      expect(result).toEqual(response);

      process.env.NODE_ENV = originalEnv;
      process.env.ALLOW_DEV_LOGIN = originalAllow;
    });

    /**
     * ============================================================
     * PRUEBA 13: POST /auth/dev-login bloquea IP unknown
     * ============================================================
     */
    it('debería bloquear dev login cuando la IP es unknown', async () => {
      const originalEnv = process.env.NODE_ENV;
      const originalAllow = process.env.ALLOW_DEV_LOGIN;

      process.env.NODE_ENV = 'production';
      process.env.ALLOW_DEV_LOGIN = 'false';

      const devLoginDto = { email: 'dev@lalora.com' };
      const req = {
        headers: {},
        ip: undefined,
        socket: { remoteAddress: undefined },
      };

      expect(() => controller.devLogin(devLoginDto, req)).toThrow(
        'Dev login only available from localhost',
      );
      expect(logger.warn).toHaveBeenCalledWith('Dev login blocked', {
        ip: 'unknown',
      });

      process.env.NODE_ENV = originalEnv;
      process.env.ALLOW_DEV_LOGIN = originalAllow;
    });
  });

  // ==========================================================
  // GET /auth/profile
  // ==========================================================
  describe('getProfile', () => {
    /**
     * ============================================================
     * PRUEBA 14: GET /auth/profile retorna el usuario del request
     * ============================================================
     *
     * QUÉ probamos:
     * Que el controller retorna el usuario extraído del JWT guard.
     *
     * Arrange: req con user mockeado
     * Act: Ejecutamos controller.getProfile(req)
     * Assert: Verificamos que retorna req.user
     */
    it('debería retornar el usuario del request', () => {
      const req = {
        user: {
          userId: 'user-1',
          email: 'test@lalora.com',
          role: 'ADMIN',
        },
      };

      const result = controller.getProfile(req as any);

      expect(result).toEqual(req.user);
    });
  });

  // ==========================================================
  // POST /auth/refresh
  // ==========================================================
  describe('refreshToken', () => {
    /**
     * ============================================================
     * PRUEBA 15: POST /auth/refresh delega al servicio
     * ============================================================
     *
     * QUÉ probamos:
     * Que el controller extrae userId y refreshToken del request.
     *
     * Arrange: req con user.userId y user.refreshToken
     * Act: Ejecutamos controller.refreshToken(req)
     * Assert: Verificamos que authService.refreshToken fue llamado
     */
    it('debería delegar el refresh token al AuthService', async () => {
      const req = {
        user: {
          userId: 'user-1',
          refreshToken: 'old_refresh_token',
          email: 'test@lalora.com',
          role: 'ADMIN',
        },
      };

      const response = {
        access_token: 'new_access_token',
        refresh_token: 'new_refresh_token',
      };

      authService.refreshToken.mockResolvedValue(response);

      const result = await controller.refreshToken(req);

      expect(authService.refreshToken).toHaveBeenCalledWith(
        'user-1',
        'old_refresh_token',
      );
      expect(result).toEqual(response);
    });
  });

  // ==========================================================
  // POST /auth/logout
  // ==========================================================
  describe('logout', () => {
    /**
     * ============================================================
     * PRUEBA 16: POST /auth/logout con token válido
     * ============================================================
     */
    it('debería delegar el logout al AuthService', async () => {
      const req = { user: { userId: 'user-1', email: 'test@lalora.com' } };

      authService.logout.mockResolvedValue(undefined);

      await controller.logout(req);

      expect(authService.logout).toHaveBeenCalledWith('user-1');
    });

    /**
     * ============================================================
     * PRUEBA 17: POST /auth/logout sin userId en token
     * ============================================================
     */
    it('debería lanzar UnauthorizedException cuando no hay userId en el token', async () => {
      const req = { user: {} };

      expect(() => controller.logout(req)).toThrow('Invalid token');
      expect(authService.logout).not.toHaveBeenCalled();
    });
  });

  // ==========================================================
  // GET /auth/token-status
  // ==========================================================
  describe('tokenStatus', () => {
    /**
     * ============================================================
     * PRUEBA 18: GET /auth/token-status con token válido
     * ============================================================
     *
     * QUÉ probamos:
     * Que el controller decodifica el token y calcula tiempo restante.
     *
     * Arrange: req con Authorization header, jwtService.decode mockeado
     * Act: Ejecutamos controller.tokenStatus(req)
     * Assert: Verificamos que retorna expiresIn y needsRefresh
     */
    it('debería retornar el tiempo restante del token', () => {
      const futureExp = Math.floor(Date.now() / 1000) + 3600; // 1 hora

      const req = {
        headers: { authorization: 'Bearer some_token' },
      };

      jwtService.decode.mockReturnValue({
        sub: 'user-1',
        email: 'test@lalora.com',
        exp: futureExp,
      });

      const result = controller.tokenStatus(req);

      expect(jwtService.decode).toHaveBeenCalledWith('some_token');
      expect(result).toHaveProperty('expiresIn');
      expect(result).toHaveProperty('needsRefresh');
      expect(result.expiresIn).toBeGreaterThan(0);
      expect(result.needsRefresh).toBe(false);
    });

    /**
     * ============================================================
     * PRUEBA 19: GET /auth/token-status con token por expirar
     * ============================================================
     */
    it('debería indicar que necesita refresh cuando quedan menos de 5 minutos', () => {
      const nearExp = Math.floor(Date.now() / 1000) + 60; // 1 minuto

      const req = {
        headers: { authorization: 'Bearer some_token' },
      };

      jwtService.decode.mockReturnValue({
        sub: 'user-1',
        email: 'test@lalora.com',
        exp: nearExp,
      });

      const result = controller.tokenStatus(req);

      expect(result.needsRefresh).toBe(true);
    });

    /**
     * ============================================================
     * PRUEBA 20: GET /auth/token-status sin token
     * ============================================================
     */
    it('debería retornar 0 de expiresIn cuando no hay token', () => {
      const req = {
        headers: {},
      };

      jwtService.decode.mockReturnValue(null);

      const result = controller.tokenStatus(req);

      expect(result.expiresIn).toBe(0);
      expect(result.needsRefresh).toBe(true);
    });
  });
});
