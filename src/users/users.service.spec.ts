import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { UsersService } from './users.service';
import { PrismaService } from '../prisma.service';
import { createMockPrismaService } from '../__mocks__/prisma.mock';
import * as bcrypt from 'bcrypt';

jest.mock('bcrypt');

/**
 * ============================================================
 * SUITE DE PRUEBAS: UsersService
 * ============================================================
 *
 * QUÉ probamos:
 * Operaciones de lectura de usuarios (findAll, findById) y
 * el manejo de errores cuando un usuario no existe.
 *
 * MOCKING:
 * - PrismaService → base de datos simulada con createMockPrismaService
 */
describe('UsersService', () => {
  let service: UsersService;
  let prisma: ReturnType<typeof createMockPrismaService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: PrismaService, useValue: createMockPrismaService() },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    prisma = module.get(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  /**
   * ============================================================
   * PRUEBA 1: findAll — listar todos los usuarios
   * ============================================================
   *
   * QUÉ probamos:
   * Que el servicio retorna todos los usuarios con los campos
   * seleccionados (sin password).
   */
  it('debería listar todos los usuarios con campos seleccionados', async () => {
    const expected = [
      {
        id: 'user-1',
        email: 'admin@lalora.com',
        firstName: 'Admin',
        lastName: 'User',
        phoneNumber: '8888-8888',
        role: 'ADMIN',
        active: true,
        createdAt: new Date(),
      },
      {
        id: 'user-2',
        email: 'mesero@lalora.com',
        firstName: 'Mesero',
        lastName: 'Uno',
        phoneNumber: '7777-7777',
        role: 'WAITER',
        active: true,
        createdAt: new Date(),
      },
    ];

    prisma.user.findMany.mockResolvedValue(expected);

    const result = await service.findAll();

    expect(prisma.user.findMany).toHaveBeenCalledWith({
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phoneNumber: true,
        role: true,
        active: true,
        createdAt: true,
      },
    });
    expect(result).toEqual(expected);
  });

  /**
   * ============================================================
   * PRUEBA 2: findAll — retorna array vacío si no hay usuarios
   * ============================================================
   */
  it('debería retornar un array vacío si no hay usuarios', async () => {
    prisma.user.findMany.mockResolvedValue([]);

    const result = await service.findAll();

    expect(result).toEqual([]);
  });

  /**
   * ============================================================
   * PRUEBA 3: findById — obtener usuario existente
   * ============================================================
   *
   * QUÉ probamos:
   * Que el servicio retorna el usuario cuando existe en la BD.
   */
  it('debería retornar un usuario si existe', async () => {
    const user = {
      id: 'user-1',
      email: 'admin@lalora.com',
      firstName: 'Admin',
      lastName: 'User',
      phoneNumber: '8888-8888',
      role: 'ADMIN',
      active: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    prisma.user.findUnique.mockResolvedValue(user);

    const result = await service.findById('user-1');

    expect(prisma.user.findUnique).toHaveBeenCalledWith({
      where: { id: 'user-1' },
    });
    expect(result).toEqual(user);
  });

  /**
   * ============================================================
   * PRUEBA 4: findById — lanzar NotFoundException si no existe
   * ============================================================
   *
   * QUÉ probamos:
   * Que el servicio lanza una excepción cuando el usuario no
   * se encuentra en la base de datos.
   */
  it('debería lanzar NotFoundException si el usuario no existe', async () => {
    prisma.user.findUnique.mockResolvedValue(null);

    await expect(service.findById('user-ghost')).rejects.toThrow(
      NotFoundException,
    );
    await expect(service.findById('user-ghost')).rejects.toThrow(
      'User with id user-ghost not found',
    );
  });

  /**
   * ============================================================
   * PRUEBA 5: findByEmail — buscar usuario por email
   * ============================================================
   */
  it('debería encontrar un usuario por email', async () => {
    const user = {
      id: 'user-1',
      email: 'admin@lalora.com',
      password: 'hashed123',
    };

    prisma.user.findUnique.mockResolvedValue(user);

    const result = await service.findByEmail('admin@lalora.com');

    expect(prisma.user.findUnique).toHaveBeenCalledWith({
      where: { email: 'admin@lalora.com' },
    });
    expect(result).toEqual(user);
  });

  it('debería retornar null si el email no existe', async () => {
    prisma.user.findUnique.mockResolvedValue(null);

    const result = await service.findByEmail('nobody@lalora.com');

    expect(result).toBeNull();
  });

  /**
   * ============================================================
   * PRUEBA 6: create — crear usuario con password hasheado
   * ============================================================
   */
  it('debería crear un usuario con password hasheado', async () => {
    const userData = {
      email: 'new@lalora.com',
      password: 'plain123',
      name: 'New User',
      firstName: 'New',
      lastName: 'User',
      phoneNumber: '9999-9999',
      role: 'WAITER',
    };

    (bcrypt.hash as jest.Mock).mockResolvedValue('hashed_plain123');
    prisma.user.create.mockResolvedValue({
      id: 'user-new',
      ...userData,
      password: 'hashed_plain123',
    });

    const result = await service.create(userData);

    expect(bcrypt.hash).toHaveBeenCalledWith('plain123', 10);
    expect(prisma.user.create).toHaveBeenCalledWith({
      data: {
        email: 'new@lalora.com',
        password: 'hashed_plain123',
        name: 'New User',
        firstName: 'New',
        lastName: 'User',
        phoneNumber: '9999-9999',
        role: 'WAITER',
      },
    });
    expect(result.password).toBe('hashed_plain123');
  });

  /**
   * ============================================================
   * PRUEBA 7: validatePassword — validar contraseña correcta
   * ============================================================
   */
  it('debería validar una contraseña correcta', async () => {
    const user = { password: 'hashed123' };
    (bcrypt.compare as jest.Mock).mockResolvedValue(true);

    const result = await service.validatePassword(user, 'plain123');

    expect(bcrypt.compare).toHaveBeenCalledWith('plain123', 'hashed123');
    expect(result).toBe(true);
  });

  it('debería rechazar una contraseña incorrecta', async () => {
    const user = { password: 'hashed123' };
    (bcrypt.compare as jest.Mock).mockResolvedValue(false);

    const result = await service.validatePassword(user, 'wrongpass');

    expect(result).toBe(false);
  });

  /**
   * ============================================================
   * PRUEBA 8: hashPassword — hashear una contraseña
   * ============================================================
   */
  it('debería hashear una contraseña', async () => {
    (bcrypt.hash as jest.Mock).mockResolvedValue('hashed_secret');

    const result = await service.hashPassword('secret');

    expect(bcrypt.hash).toHaveBeenCalledWith('secret', 10);
    expect(result).toBe('hashed_secret');
  });

  /**
   * ============================================================
   * PRUEBA 9: setRecoverCode — establecer código de recuperación
   * ============================================================
   *
   * QUÉ probamos:
   * El código de recuperación se guarda con una expiración de 15 min.
   */
  it('debería establecer un código de recuperación con expiración', async () => {
    const user = { id: 'user-1', email: 'admin@lalora.com' };
    prisma.user.update.mockResolvedValue(user);

    const result = await service.setRecoverCode(
      'admin@lalora.com',
      '123456',
    );

    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { email: 'admin@lalora.com' },
      data: {
        recoverCode: '123456',
        recoverCodeExpires: expect.any(Date),
      },
    });
    expect(result).toEqual(user);
  });

  /**
   * ============================================================
   * PRUEBA 10: findByRecoverCode — encontrar usuario con código válido
   * ============================================================
   */
  it('debería encontrar usuario con código de recuperación válido', async () => {
    const user = { id: 'user-1', email: 'admin@lalora.com' };
    prisma.user.findFirst.mockResolvedValue(user);

    const result = await service.findByRecoverCode(
      'admin@lalora.com',
      '123456',
    );

    expect(prisma.user.findFirst).toHaveBeenCalledWith({
      where: {
        email: 'admin@lalora.com',
        recoverCode: '123456',
        recoverCodeExpires: {
          gt: expect.any(Date),
        },
      },
    });
    expect(result).toEqual(user);
  });

  it('debería retornar null si el código es inválido o expirado', async () => {
    prisma.user.findFirst.mockResolvedValue(null);

    const result = await service.findByRecoverCode(
      'admin@lalora.com',
      'wrong',
    );

    expect(result).toBeNull();
  });

  /**
   * ============================================================
   * PRUEBA 11: resetPassword — resetear contraseña
   * ============================================================
   *
   * QUÉ probamos:
   * La nueva contraseña se hashea y los campos de recoverCode
   * se limpian (null).
   */
  it('debería resetear la contraseña y limpiar recoverCode', async () => {
    (bcrypt.hash as jest.Mock).mockResolvedValue('hashed_newpass');
    prisma.user.update.mockResolvedValue({
      id: 'user-1',
      email: 'admin@lalora.com',
      password: 'hashed_newpass',
    });

    const result = await service.resetPassword(
      'admin@lalora.com',
      'newpass',
    );

    expect(bcrypt.hash).toHaveBeenCalledWith('newpass', 10);
    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { email: 'admin@lalora.com' },
      data: {
        password: 'hashed_newpass',
        recoverCode: null,
        recoverCodeExpires: null,
      },
    });
    expect(result.password).toBe('hashed_newpass');
  });
});
