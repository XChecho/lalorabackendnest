import { Test, TestingModule } from '@nestjs/testing';
import {
  UnauthorizedException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma.service';
import { UsersService } from '../users/users.service';
import { MailService } from '../mail/mail.service';
import { LoggerService } from '../common/logger/logger.service';
import { LoginDto } from './dto/login.dto';
import { CreateUserDto, UserType } from './dto/create-user.dto';
import { RecoverPasswordDto } from './dto/recover-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { Role } from '@prisma/client';
import * as crypto from 'crypto';

// Mock de randomUUID para controlar los tokens generados
jest.mock('crypto', () => ({
  randomUUID: jest.fn(() => 'mocked-uuid-token'),
}));

/**
 * ============================================================
 * SUITE DE PRUEBAS: AuthService
 * ============================================================
 *
 * Probamos la lógica de autenticación de forma aislada.
 * MOCKING:
 * - PrismaService → mock con createMockPrismaService
 * - UsersService → mock completo de todos sus métodos
 * - JwtService → mock de sign y decode
 * - MailService → mock de sendRecoverCode
 * - LoggerService → mock de log/error/warn/debug
 */
describe('AuthService', () => {
  let service: AuthService;
  let prisma: any;
  let usersService: any;
  let jwtService: any;
  let mailService: any;
  let logger: any;

  beforeEach(async () => {
    /**
     * Arrange: configurar módulo de testing con mocks
     */
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: PrismaService,
          useValue: {
            refreshToken: {
              create: jest.fn(),
              delete: jest.fn(),
              deleteMany: jest.fn(),
              findUnique: jest.fn(),
            },
          },
        },
        {
          provide: UsersService,
          useValue: {
            findByEmail: jest.fn(),
            findById: jest.fn(),
            validatePassword: jest.fn(),
            create: jest.fn(),
            setRecoverCode: jest.fn(),
            findByRecoverCode: jest.fn(),
            resetPassword: jest.fn(),
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
          provide: MailService,
          useValue: {
            sendRecoverCode: jest.fn(),
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
    }).compile();

    service = module.get<AuthService>(AuthService);
    prisma = module.get(PrismaService);
    usersService = module.get(UsersService);
    jwtService = module.get(JwtService);
    mailService = module.get(MailService);
    logger = module.get(LoggerService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // ==========================================================
  // login()
  // ==========================================================
  describe('login', () => {
    /**
     * ============================================================
     * PRUEBA 1: Login exitoso con credenciales válidas
     * ============================================================
     *
     * QUÉ probamos:
     * Que un usuario con email/password correctos recibe tokens.
     *
     * Arrange:
     * - findByEmail retorna usuario válido y activo
     * - validatePassword retorna true
     * - jwtService.sign retorna access_token
     * - refreshToken.create retorna refresh_token
     *
     * Act: Ejecutamos service.login(dto)
     *
     * Assert: Verificamos tokens y datos de usuario en respuesta
     */
    it('debería retornar tokens cuando las credenciales son válidas', async () => {
      const loginDto: LoginDto = {
        email: 'test@lalora.com',
        password: 'password123',
      };

      const user = {
        id: 'user-1',
        email: 'test@lalora.com',
        password: 'hashed_password',
        firstName: 'Test',
        lastName: 'User',
        role: Role.ADMIN,
        active: true,
      };

      usersService.findByEmail.mockResolvedValue(user);
      usersService.validatePassword.mockResolvedValue(true);
      jwtService.sign.mockReturnValue('access_token_123');
      prisma.refreshToken.create.mockResolvedValue({
        token: 'refresh_token_123',
        userId: 'user-1',
        expiresAt: new Date(),
      });

      const result = await service.login(loginDto);

      expect(usersService.findByEmail).toHaveBeenCalledWith('test@lalora.com');
      expect(usersService.validatePassword).toHaveBeenCalledWith(
        user,
        'password123',
      );
      expect(prisma.refreshToken.deleteMany).toHaveBeenCalledWith({
        where: { userId: 'user-1', expiresAt: { lt: expect.any(Date) } },
      });
      expect(jwtService.sign).toHaveBeenCalledWith({
        sub: 'user-1',
        email: 'test@lalora.com',
        role: Role.ADMIN,
      });
      expect(result).toEqual({
        access_token: 'access_token_123',
        refresh_token: 'mocked-uuid-token',
        firstName: 'Test',
        lastName: 'User',
        userType: 'admin',
      });
    });

    /**
     * ============================================================
     * PRUEBA 2: Login con usuario no encontrado
     * ============================================================
     */
    it('debería lanzar UnauthorizedException cuando el usuario no existe', async () => {
      const loginDto: LoginDto = {
        email: 'nonexistent@lalora.com',
        password: 'password123',
      };

      usersService.findByEmail.mockResolvedValue(null);

      await expect(service.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(service.login(loginDto)).rejects.toThrow('Invalid credentials');
      expect(usersService.validatePassword).not.toHaveBeenCalled();
    });

    /**
     * ============================================================
     * PRUEBA 3: Login con contraseña incorrecta
     * ============================================================
     */
    it('debería lanzar UnauthorizedException cuando la contraseña es incorrecta', async () => {
      const loginDto: LoginDto = {
        email: 'test@lalora.com',
        password: 'wrong_password',
      };

      const user = {
        id: 'user-1',
        email: 'test@lalora.com',
        password: 'hashed_password',
        firstName: 'Test',
        lastName: 'User',
        role: Role.ADMIN,
        active: true,
      };

      usersService.findByEmail.mockResolvedValue(user);
      usersService.validatePassword.mockResolvedValue(false);

      await expect(service.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(service.login(loginDto)).rejects.toThrow('Invalid credentials');
    });

    /**
     * ============================================================
     * PRUEBA 4: Login con cuenta inactiva
     * ============================================================
     */
    it('debería lanzar UnauthorizedException cuando la cuenta está inactiva', async () => {
      const loginDto: LoginDto = {
        email: 'inactive@lalora.com',
        password: 'password123',
      };

      const user = {
        id: 'user-1',
        email: 'inactive@lalora.com',
        password: 'hashed_password',
        firstName: 'Test',
        lastName: 'User',
        role: Role.ADMIN,
        active: false,
      };

      usersService.findByEmail.mockResolvedValue(user);

      await expect(service.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(service.login(loginDto)).rejects.toThrow(
        'User account is inactive',
      );
      expect(usersService.validatePassword).not.toHaveBeenCalled();
    });
  });

  // ==========================================================
  // createUser()
  // ==========================================================
  describe('createUser', () => {
    /**
     * ============================================================
     * PRUEBA 5: Crear usuario exitosamente como admin
     * ============================================================
     *
     * QUÉ probamos:
     * Que un admin puede crear un nuevo usuario con rol específico.
     *
     * Arrange:
     * - findByEmail(admin) retorna usuario con rol ADMIN
     * - findByEmail(nuevo) retorna null (no existe)
     * - usersService.create retorna usuario creado
     *
     * Act: Ejecutamos service.createUser(dto, adminEmail)
     *
     * Assert: Verificamos que el usuario fue creado con datos correctos
     */
    it('debería crear un usuario cuando el solicitante es admin', async () => {
      const adminEmail = 'admin@lalora.com';
      const createUserDto: CreateUserDto = {
        firstName: 'Juan',
        lastName: 'Pérez',
        email: 'juan@lalora.com',
        phoneNumber: '+1234567890',
        userType: UserType.WAITER,
      };

      const admin = {
        id: 'admin-1',
        email: 'admin@lalora.com',
        role: Role.ADMIN,
      };

      const newUser = {
        id: 'user-2',
        email: 'juan@lalora.com',
        firstName: 'Juan',
        lastName: 'Pérez',
        phoneNumber: '+1234567890',
        role: 'WAITRESS',
      };

      usersService.findByEmail
        .mockResolvedValueOnce(admin)
        .mockResolvedValueOnce(null);
      usersService.create.mockResolvedValue(newUser);

      const result = await service.createUser(createUserDto, adminEmail);

      expect(usersService.findByEmail).toHaveBeenCalledWith(adminEmail);
      expect(usersService.findByEmail).toHaveBeenCalledWith('juan@lalora.com');
      expect(usersService.create).toHaveBeenCalledWith({
        email: 'juan@lalora.com',
        password: 'ChangeMe123',
        name: 'Juan Pérez',
        firstName: 'Juan',
        lastName: 'Pérez',
        phoneNumber: '+1234567890',
        role: 'WAITRESS',
      });
      expect(result).toEqual({
        id: 'user-2',
        email: 'juan@lalora.com',
        firstName: 'Juan',
        lastName: 'Pérez',
        phoneNumber: '+1234567890',
        userType: 'WAITRESS',
      });
    });

    /**
     * ============================================================
     * PRUEBA 6: Crear usuario con contraseña temporal personalizada
     * ============================================================
     */
    it('debería usar la contraseña temporal proporcionada en el DTO', async () => {
      const adminEmail = 'admin@lalora.com';
      const createUserDto: CreateUserDto = {
        firstName: 'María',
        lastName: 'García',
        email: 'maria@lalora.com',
        phoneNumber: '+1234567890',
        userType: UserType.KITCHEN,
        tempPassword: 'CustomPass123',
      };

      const admin = { id: 'admin-1', email: 'admin@lalora.com', role: Role.ADMIN };

      usersService.findByEmail
        .mockResolvedValueOnce(admin)
        .mockResolvedValueOnce(null);
      usersService.create.mockResolvedValue({
        id: 'user-3',
        email: 'maria@lalora.com',
        firstName: 'María',
        lastName: 'García',
        phoneNumber: '+1234567890',
        role: 'KITCHEN',
      });

      await service.createUser(createUserDto, adminEmail);

      expect(usersService.create).toHaveBeenCalledWith(
        expect.objectContaining({
          password: 'CustomPass123',
        }),
      );
    });

    /**
     * ============================================================
     * PRUEBA 7: Intentar crear usuario sin ser admin
     * ============================================================
     */
    it('debería lanzar UnauthorizedException cuando el solicitante no es admin', async () => {
      const adminEmail = 'waiter@lalora.com';
      const createUserDto: CreateUserDto = {
        firstName: 'Juan',
        lastName: 'Pérez',
        email: 'juan@lalora.com',
        phoneNumber: '+1234567890',
        userType: UserType.WAITER,
      };

      const nonAdmin = {
        id: 'user-1',
        email: 'waiter@lalora.com',
        role: Role.WAITER,
      };

      usersService.findByEmail.mockResolvedValue(nonAdmin);

      await expect(
        service.createUser(createUserDto, adminEmail),
      ).rejects.toThrow(UnauthorizedException);
      await expect(
        service.createUser(createUserDto, adminEmail),
      ).rejects.toThrow('Only admins can create users');
    });

    /**
     * ============================================================
     * PRUEBA 8: Intentar crear usuario con email duplicado
     * ============================================================
     */
    it('debería lanzar BadRequestException cuando el email ya existe', async () => {
      const adminEmail = 'admin@lalora.com';
      const createUserDto: CreateUserDto = {
        firstName: 'Juan',
        lastName: 'Pérez',
        email: 'existing@lalora.com',
        phoneNumber: '+1234567890',
        userType: UserType.WAITER,
      };

      const admin = { id: 'admin-1', email: 'admin@lalora.com', role: 'ADMIN' };
      const existingUser = { id: 'user-1', email: 'existing@lalora.com' };

      usersService.findByEmail.mockImplementation((email: string) => {
        if (email === adminEmail) return Promise.resolve(admin);
        if (email === 'existing@lalora.com') return Promise.resolve(existingUser);
        return Promise.resolve(null);
      });

      await expect(
        service.createUser(createUserDto, adminEmail),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.createUser(createUserDto, adminEmail),
      ).rejects.toThrow('Email already exists');
    });

    /**
     * ============================================================
     * PRUEBA 9: Intentar crear usuario cuando admin no existe
     * ============================================================
     */
    it('debería lanzar UnauthorizedException cuando el admin no existe', async () => {
      const adminEmail = 'ghost@lalora.com';
      const createUserDto: CreateUserDto = {
        firstName: 'Juan',
        lastName: 'Pérez',
        email: 'juan@lalora.com',
        phoneNumber: '+1234567890',
        userType: UserType.WAITER,
      };

      usersService.findByEmail.mockResolvedValue(null);

      await expect(
        service.createUser(createUserDto, adminEmail),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  // ==========================================================
  // recoverPassword()
  // ==========================================================
  describe('recoverPassword', () => {
    /**
     * ============================================================
     * PRUEBA 10: Recuperación de contraseña exitosa
     * ============================================================
     *
     * QUÉ probamos:
     * Que se genera un código y se envía por email.
     *
     * Arrange:
     * - findByEmail retorna usuario existente
     * - setRecoverCode y sendRecoverCode mockeados
     *
     * Act: Ejecutamos service.recoverPassword(dto)
     *
     * Assert: Verificamos que se envió el código al email
     */
    it('debería generar código y enviar email cuando el usuario existe', async () => {
      const recoverDto: RecoverPasswordDto = {
        email: 'test@lalora.com',
      };

      const user = { id: 'user-1', email: 'test@lalora.com' };

      usersService.findByEmail.mockResolvedValue(user);
      usersService.setRecoverCode.mockResolvedValue(user);
      mailService.sendRecoverCode.mockResolvedValue(true);

      const result = await service.recoverPassword(recoverDto);

      expect(usersService.findByEmail).toHaveBeenCalledWith('test@lalora.com');
      expect(usersService.setRecoverCode).toHaveBeenCalledWith(
        'test@lalora.com',
        expect.any(String),
      );
      expect(mailService.sendRecoverCode).toHaveBeenCalled();
      expect(result).toEqual({ message: 'Recovery code sent to email' });
    });

    /**
     * ============================================================
     * PRUEBA 11: Recuperación con usuario no encontrado
     * ============================================================
     */
    it('debería lanzar NotFoundException cuando el usuario no existe', async () => {
      const recoverDto: RecoverPasswordDto = {
        email: 'nonexistent@lalora.com',
      };

      usersService.findByEmail.mockResolvedValue(null);

      await expect(service.recoverPassword(recoverDto)).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.recoverPassword(recoverDto)).rejects.toThrow(
        'User not found',
      );
      expect(usersService.setRecoverCode).not.toHaveBeenCalled();
      expect(mailService.sendRecoverCode).not.toHaveBeenCalled();
    });
  });

  // ==========================================================
  // resetPassword()
  // ==========================================================
  describe('resetPassword', () => {
    /**
     * ============================================================
     * PRUEBA 12: Reset de contraseña exitoso con código válido
     * ============================================================
     *
     * QUÉ probamos:
     * Que un código válido permite actualizar la contraseña.
     *
     * Arrange:
     * - findByRecoverCode retorna usuario (código válido y no expirado)
     * - resetPassword mockeado
     *
     * Act: Ejecutamos service.resetPassword(dto)
     *
     * Assert: Verificamos que la contraseña fue actualizada
     */
    it('debería actualizar la contraseña cuando el código es válido', async () => {
      const resetDto: ResetPasswordDto = {
        email: 'test@lalora.com',
        code: '123456',
        newPassword: 'NewPassword123',
      };

      const user = { id: 'user-1', email: 'test@lalora.com' };

      usersService.findByRecoverCode.mockResolvedValue(user);
      usersService.resetPassword.mockResolvedValue(user);

      const result = await service.resetPassword(resetDto);

      expect(usersService.findByRecoverCode).toHaveBeenCalledWith(
        'test@lalora.com',
        '123456',
      );
      expect(usersService.resetPassword).toHaveBeenCalledWith(
        'test@lalora.com',
        'NewPassword123',
      );
      expect(result).toEqual({ message: 'Password reset successfully' });
    });

    /**
     * ============================================================
     * PRUEBA 13: Reset con código inválido o expirado
     * ============================================================
     */
    it('debería lanzar BadRequestException cuando el código es inválido o expirado', async () => {
      const resetDto: ResetPasswordDto = {
        email: 'test@lalora.com',
        code: '999999',
        newPassword: 'NewPassword123',
      };

      usersService.findByRecoverCode.mockResolvedValue(null);

      await expect(service.resetPassword(resetDto)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.resetPassword(resetDto)).rejects.toThrow(
        'Invalid or expired code',
      );
      expect(usersService.resetPassword).not.toHaveBeenCalled();
    });
  });

  // ==========================================================
  // devLogin()
  // ==========================================================
  describe('devLogin', () => {
    /**
     * ============================================================
     * PRUEBA 14: Dev login exitoso
     * ============================================================
     */
    it('debería retornar tokens para dev login', async () => {
      const email = 'dev@lalora.com';

      const user = {
        id: 'user-1',
        email: 'dev@lalora.com',
        role: Role.ADMIN,
        active: true,
      };

      usersService.findByEmail.mockResolvedValue(user);
      jwtService.sign.mockReturnValue('dev_access_token');
      prisma.refreshToken.create.mockResolvedValue({
        token: 'dev_refresh_token',
        userId: 'user-1',
        expiresAt: new Date(),
      });

      const result = await service.devLogin(email);

      expect(result).toEqual({
        access_token: 'dev_access_token',
        refresh_token: 'mocked-uuid-token',
        role: Role.ADMIN,
      });
    });

    /**
     * ============================================================
     * PRUEBA 15: Dev login con usuario no encontrado
     * ============================================================
     */
    it('debería lanzar NotFoundException cuando el usuario no existe', async () => {
      usersService.findByEmail.mockResolvedValue(null);

      await expect(service.devLogin('ghost@lalora.com')).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.devLogin('ghost@lalora.com')).rejects.toThrow(
        'User not found',
      );
    });

    /**
     * ============================================================
     * PRUEBA 16: Dev login con usuario inactivo
     * ============================================================
     */
    it('debería lanzar UnauthorizedException cuando el usuario está inactivo', async () => {
      const user = {
        id: 'user-1',
        email: 'inactive@lalora.com',
        role: Role.ADMIN,
        active: false,
      };

      usersService.findByEmail.mockResolvedValue(user);

      await expect(service.devLogin('inactive@lalora.com')).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(service.devLogin('inactive@lalora.com')).rejects.toThrow(
        'User is inactive',
      );
    });
  });

  // ==========================================================
  // refreshToken()
  // ==========================================================
  describe('refreshToken', () => {
    /**
     * ============================================================
     * PRUEBA 17: Refresh token exitoso
     * ============================================================
     *
     * QUÉ probamos:
     * Que un refresh token válido genera nuevos tokens.
     *
     * Arrange:
     * - findById retorna usuario activo
     * - refreshToken.delete elimina el token viejo
     * - jwtService.sign genera nuevo access token
     * - generateRefreshToken crea nuevo refresh token
     *
     * Act: Ejecutamos service.refreshToken(userId, oldToken)
     *
     * Assert: Verificamos nuevos tokens generados
     */
    it('debería generar nuevos tokens cuando el refresh token es válido', async () => {
      const userId = 'user-1';
      const oldRefreshToken = 'old_refresh_token';

      const user = {
        id: 'user-1',
        email: 'test@lalora.com',
        role: Role.ADMIN,
        active: true,
      };

      usersService.findById.mockResolvedValue(user);
      prisma.refreshToken.delete.mockResolvedValue({ token: oldRefreshToken });
      jwtService.sign.mockReturnValue('new_access_token');
      prisma.refreshToken.create.mockResolvedValue({
        token: 'new_refresh_token',
        userId: 'user-1',
        expiresAt: new Date(),
      });

      const result = await service.refreshToken(userId, oldRefreshToken);

      expect(usersService.findById).toHaveBeenCalledWith(userId);
      expect(prisma.refreshToken.delete).toHaveBeenCalledWith({
        where: { token: oldRefreshToken },
      });
      expect(jwtService.sign).toHaveBeenCalledWith({
        sub: 'user-1',
        email: 'test@lalora.com',
        role: Role.ADMIN,
      });
      expect(result).toEqual({
        access_token: 'new_access_token',
        refresh_token: 'mocked-uuid-token',
      });
    });

    /**
     * ============================================================
     * PRUEBA 18: Refresh token con usuario no encontrado
     * ============================================================
     */
    it('debería lanzar UnauthorizedException cuando el usuario no existe', async () => {
      usersService.findById.mockResolvedValue(null);

      await expect(
        service.refreshToken('ghost-user', 'some_token'),
      ).rejects.toThrow(UnauthorizedException);
      await expect(
        service.refreshToken('ghost-user', 'some_token'),
      ).rejects.toThrow('User not found or inactive');
    });

    /**
     * ============================================================
     * PRUEBA 19: Refresh token con usuario inactivo
     * ============================================================
     */
    it('debería lanzar UnauthorizedException cuando el usuario está inactivo', async () => {
      const user = {
        id: 'user-1',
        email: 'test@lalora.com',
        role: Role.ADMIN,
        active: false,
      };

      usersService.findById.mockResolvedValue(user);

      await expect(
        service.refreshToken('user-1', 'some_token'),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  // ==========================================================
  // logout()
  // ==========================================================
  describe('logout', () => {
    /**
     * ============================================================
     * PRUEBA 20: Logout exitoso revoca todos los refresh tokens
     * ============================================================
     *
     * QUÉ probamos:
     * Que logout elimina todos los refresh tokens del usuario.
     *
     * Arrange: deleteMany mockeado
     * Act: Ejecutamos service.logout(userId)
     * Assert: Verificamos que deleteMany fue llamado con userId
     */
    it('debería eliminar todos los refresh tokens del usuario', async () => {
      const userId = 'user-1';

      prisma.refreshToken.deleteMany.mockResolvedValue({ count: 2 });

      await service.logout(userId);

      expect(prisma.refreshToken.deleteMany).toHaveBeenCalledWith({
        where: { userId },
      });
    });
  });
});
