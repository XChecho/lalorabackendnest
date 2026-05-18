import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { PrismaService } from '../prisma.service';
import { LoggerService } from '../common/logger/logger.service';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { Role } from '@prisma/client';

describe('UsersService', () => {
  let service: UsersService;
  let prisma: PrismaService;
  let logger: LoggerService;

  const mockUser = {
    id: 'user-123',
    email: 'test@example.com',
    password: 'hashedPassword123',
    name: 'Test User',
    firstName: 'Test',
    lastName: 'User',
    phoneNumber: '+1234567890',
    role: Role.WAITRESS,
    active: true,
    birthdate: new Date('1990-01-01'),
    entryDate: new Date('2024-01-01'),
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: PrismaService,
          useValue: {
            user: {
              findMany: jest.fn(),
              findUnique: jest.fn(),
              findFirst: jest.fn(),
              create: jest.fn(),
              update: jest.fn(),
              delete: jest.fn(),
            },
          },
        },
        {
          provide: LoggerService,
          useValue: {
            debug: jest.fn(),
            log: jest.fn(),
            error: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    prisma = module.get<PrismaService>(PrismaService);
    logger = module.get<LoggerService>(LoggerService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // =========================================================================
  // TESTS PARA findRecent()
  // =========================================================================

  describe('findRecent()', () => {
    it('debe devolver los últimos N usuarios ordenados por createdAt DESC con limit default de 3', async () => {
      // Arrange: Configurar el mock para simular la respuesta de Prisma
      const recentUsers = [
        { ...mockUser, id: 'user-1', createdAt: new Date('2024-03-01') },
        { ...mockUser, id: 'user-2', createdAt: new Date('2024-02-01') },
        { ...mockUser, id: 'user-3', createdAt: new Date('2024-01-01') },
      ];
      (prisma.user.findMany as jest.Mock).mockResolvedValue(recentUsers);

      // Act: Llamar al método sin argumentos (usa limit default = 3)
      const result = await service.findRecent();

      // Assert: Verificar que se llamó con los parámetros correctos
      expect(prisma.user.findMany).toHaveBeenCalledWith({
        take: 3,
        orderBy: { createdAt: 'desc' },
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
      expect(result).toEqual(recentUsers);
      // Verificar que se registró el log de debug
      expect(logger.debug).toHaveBeenCalledWith('Fetching 3 most recent users');
    });

    it('debe devolver los últimos N usuarios con un limit personalizado', async () => {
      // Arrange: Configurar el mock con 5 usuarios
      const recentUsers = [
        { ...mockUser, id: 'user-1', createdAt: new Date('2024-05-01') },
        { ...mockUser, id: 'user-2', createdAt: new Date('2024-04-01') },
        { ...mockUser, id: 'user-3', createdAt: new Date('2024-03-01') },
        { ...mockUser, id: 'user-4', createdAt: new Date('2024-02-01') },
        { ...mockUser, id: 'user-5', createdAt: new Date('2024-01-01') },
      ];
      (prisma.user.findMany as jest.Mock).mockResolvedValue(recentUsers);

      // Act: Llamar al método con limit = 5
      const result = await service.findRecent(5);

      // Assert: Verificar que se llamó con take: 5
      expect(prisma.user.findMany).toHaveBeenCalledWith({
        take: 5,
        orderBy: { createdAt: 'desc' },
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
      expect(result).toEqual(recentUsers);
      expect(logger.debug).toHaveBeenCalledWith('Fetching 5 most recent users');
    });

    it('debe excluir el password en el select', async () => {
      // Arrange: Configurar el mock
      (prisma.user.findMany as jest.Mock).mockResolvedValue([]);

      // Act: Llamar al método
      await service.findRecent();

      // Assert: Verificar que password NO está en el select
      const callArgs = (prisma.user.findMany as jest.Mock).mock.calls[0][0];
      expect(callArgs.select).not.toHaveProperty('password');
    });
  });

  // =========================================================================
  // TESTS PARA update()
  // =========================================================================

  describe('update()', () => {
    const updateData = {
      firstName: 'Updated',
      lastName: 'Name',
      email: 'updated@example.com',
      phoneNumber: '+9876543210',
      birthdate: '1995-06-15',
      entryDate: '2025-01-01',
    };

    it('debe actualizar los datos del usuario correctamente', async () => {
      // Arrange: Simular que el usuario existe y la actualización funciona
      // Primera llamada: verificar que el usuario existe
      // Segunda llamada: verificar que el email no está en uso (null)
      (prisma.user.findUnique as jest.Mock)
        .mockResolvedValueOnce(mockUser)
        .mockResolvedValueOnce(null);
      const updatedUser = {
        ...mockUser,
        firstName: 'Updated',
        lastName: 'Name',
        email: 'updated@example.com',
        phoneNumber: '+9876543210',
        birthdate: new Date('1995-06-15'),
        entryDate: new Date('2025-01-01'),
      };
      (prisma.user.update as jest.Mock).mockResolvedValue(updatedUser);

      // Act: Llamar al método con los datos de actualización
      const result = await service.update(mockUser.id, updateData);

      // Assert: Verificar que se actualizó correctamente
      expect(prisma.user.findUnique).toHaveBeenNthCalledWith(1, {
        where: { id: mockUser.id },
      });
      expect(prisma.user.findUnique).toHaveBeenNthCalledWith(2, {
        where: { email: 'updated@example.com' },
      });
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: mockUser.id },
        data: {
          firstName: 'Updated',
          lastName: 'Name',
          email: 'updated@example.com',
          phoneNumber: '+9876543210',
          birthdate: new Date('1995-06-15'),
          entryDate: new Date('2025-01-01'),
        },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          phoneNumber: true,
          role: true,
          active: true,
          birthdate: true,
          entryDate: true,
          createdAt: true,
          updatedAt: true,
        },
      });
      expect(result).toEqual(updatedUser);
      expect(logger.log).toHaveBeenCalledWith(
        `User ${mockUser.id} updated successfully`,
      );
    });

    it('debe lanzar NotFoundException si el usuario no existe', async () => {
      // Arrange: Simular que el usuario no existe
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      // Act & Assert: Verificar que se lanza la excepción
      await expect(
        service.update('non-existent-id', updateData),
      ).rejects.toThrow(NotFoundException);
      await expect(
        service.update('non-existent-id', updateData),
      ).rejects.toThrow('User with id non-existent-id not found');

      // Verificar que se registró el error y nunca se llamó a update
      expect(logger.error).toHaveBeenCalledWith(
        'User with id non-existent-id not found',
      );
      expect(prisma.user.update).not.toHaveBeenCalled();
    });

    it('debe lanzar BadRequestException si el email ya está en uso por otro usuario', async () => {
      // Arrange: Simular que el usuario existe pero el email ya lo tiene otro
      // Primera llamada: verificar que el usuario existe
      // Segunda llamada: verificar que el email está en uso por otro
      (prisma.user.findUnique as jest.Mock)
        .mockResolvedValueOnce(mockUser)
        .mockResolvedValueOnce({
          id: 'other-user',
          email: 'updated@example.com',
        });

      // Act & Assert: Verificar que se lanza BadRequestException
      const promise = service.update(mockUser.id, {
        firstName: mockUser.firstName,
        lastName: mockUser.lastName,
        email: 'updated@example.com',
      });

      await expect(promise).rejects.toThrow(BadRequestException);
      await expect(promise).rejects.toThrow(
        'Email already in use by another user',
      );

      // Verificar que se registró el error y nunca se llamó a update
      expect(logger.error).toHaveBeenCalledWith(
        'Email updated@example.com already in use',
      );
      expect(prisma.user.update).not.toHaveBeenCalled();
    });

    it('debe permitir actualizar el email si es el mismo del usuario', async () => {
      // Arrange: Simular que el usuario existe y el email es el mismo
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      const updatedUser = { ...mockUser };
      (prisma.user.update as jest.Mock).mockResolvedValue(updatedUser);

      // Act: Llamar con el mismo email
      const result = await service.update(mockUser.id, {
        firstName: mockUser.firstName,
        lastName: mockUser.lastName,
        email: mockUser.email,
      });

      // Assert: Verificar que NO se buscó el email (porque es el mismo)
      // El servicio solo llama a findUnique una vez cuando el email es el mismo
      expect(prisma.user.findUnique).toHaveBeenCalledTimes(1);
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: mockUser.id },
      });
      expect(prisma.user.update).toHaveBeenCalled();
      expect(result).toEqual(updatedUser);
    });

    it('debe actualizar correctamente firstName y lastName', async () => {
      // Arrange
      (prisma.user.findUnique as jest.Mock)
        .mockResolvedValueOnce(mockUser)
        .mockResolvedValueOnce(null);
      const updatedUser = { ...mockUser, firstName: 'New', lastName: 'Name' };
      (prisma.user.update as jest.Mock).mockResolvedValue(updatedUser);

      // Act
      const result = await service.update(mockUser.id, {
        firstName: 'New',
        lastName: 'Name',
        email: mockUser.email,
      });

      // Assert
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: mockUser.id },
        data: { firstName: 'New', lastName: 'Name', email: mockUser.email },
        select: expect.any(Object),
      });
      expect(result).toEqual(updatedUser);
    });

    it('debe actualizar correctamente phoneNumber, birthdate y entryDate', async () => {
      // Arrange
      (prisma.user.findUnique as jest.Mock)
        .mockResolvedValueOnce(mockUser)
        .mockResolvedValueOnce(null);
      const updatedUser = {
        ...mockUser,
        phoneNumber: '+1111111111',
        birthdate: new Date('1995-06-15'),
        entryDate: new Date('2025-01-01'),
      };
      (prisma.user.update as jest.Mock).mockResolvedValue(updatedUser);

      // Act
      const result = await service.update(mockUser.id, {
        firstName: mockUser.firstName,
        lastName: mockUser.lastName,
        email: mockUser.email,
        phoneNumber: '+1111111111',
        birthdate: '1995-06-15',
        entryDate: '2025-01-01',
      });

      // Assert
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: mockUser.id },
        data: {
          firstName: mockUser.firstName,
          lastName: mockUser.lastName,
          email: mockUser.email,
          phoneNumber: '+1111111111',
          birthdate: new Date('1995-06-15'),
          entryDate: new Date('2025-01-01'),
        },
        select: expect.any(Object),
      });
      expect(result).toEqual(updatedUser);
    });
  });

  // =========================================================================
  // TESTS PARA updateRole()
  // =========================================================================

  describe('updateRole()', () => {
    it('debe cambiar el rol del usuario correctamente', async () => {
      // Arrange: Simular que el usuario existe
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      const updatedUser = { ...mockUser, role: Role.ADMIN };
      (prisma.user.update as jest.Mock).mockResolvedValue(updatedUser);

      // Act: Llamar al método para cambiar el rol
      const result = await service.updateRole(mockUser.id, Role.ADMIN);

      // Assert: Verificar que el rol se actualizó
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: mockUser.id },
      });
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: mockUser.id },
        data: { role: Role.ADMIN },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          active: true,
          createdAt: true,
        },
      });
      expect(result).toEqual(updatedUser);
      expect(logger.log).toHaveBeenCalledWith(
        `Role for user ${mockUser.id} changed to ADMIN`,
      );
    });

    it('debe lanzar NotFoundException si el usuario no existe', async () => {
      // Arrange: Simular que el usuario no existe
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      // Act & Assert: Verificar que se lanza la excepción
      await expect(
        service.updateRole('non-existent-id', Role.ADMIN),
      ).rejects.toThrow(NotFoundException);
      await expect(
        service.updateRole('non-existent-id', Role.ADMIN),
      ).rejects.toThrow('User with id non-existent-id not found');

      // Verificar que se registró el error y nunca se llamó a update
      expect(logger.error).toHaveBeenCalledWith(
        'User with id non-existent-id not found',
      );
      expect(prisma.user.update).not.toHaveBeenCalled();
    });

    it('debe lanzar BadRequestException si el rol es inválido', async () => {
      // Arrange: Simular que el usuario existe
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);

      // Act & Assert: Verificar que se lanza BadRequestException con rol inválido
      await expect(
        service.updateRole(mockUser.id, 'INVALID_ROLE' as Role),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.updateRole(mockUser.id, 'INVALID_ROLE' as Role),
      ).rejects.toThrow('Invalid role: INVALID_ROLE');

      expect(logger.error).toHaveBeenCalledWith('Invalid role: INVALID_ROLE');
      expect(prisma.user.update).not.toHaveBeenCalled();
    });
  });

  // =========================================================================
  // TESTS PARA updateStatus()
  // =========================================================================

  describe('updateStatus()', () => {
    it('debe desactivar el usuario correctamente', async () => {
      // Arrange: Simular que el usuario existe
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      const deactivatedUser = { ...mockUser, active: false };
      (prisma.user.update as jest.Mock).mockResolvedValue(deactivatedUser);

      // Act: Llamar al método para desactivar
      const result = await service.updateStatus(mockUser.id, false);

      // Assert: Verificar que se desactivó
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: mockUser.id },
      });
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: mockUser.id },
        data: { active: false },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          active: true,
          createdAt: true,
        },
      });
      expect(result).toEqual(deactivatedUser);
      expect(logger.log).toHaveBeenCalledWith(
        `User ${mockUser.id} status changed to inactive`,
      );
    });

    it('debe activar el usuario correctamente', async () => {
      // Arrange: Simular que el usuario existe pero está inactivo
      const inactiveUser = { ...mockUser, active: false };
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(inactiveUser);
      const activatedUser = { ...mockUser, active: true };
      (prisma.user.update as jest.Mock).mockResolvedValue(activatedUser);

      // Act: Llamar al método para activar
      const result = await service.updateStatus(mockUser.id, true);

      // Assert: Verificar que se activó
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: mockUser.id },
        data: { active: true },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          active: true,
          createdAt: true,
        },
      });
      expect(result).toEqual(activatedUser);
      expect(logger.log).toHaveBeenCalledWith(
        `User ${mockUser.id} status changed to active`,
      );
    });

    it('debe lanzar NotFoundException si el usuario no existe', async () => {
      // Arrange: Simular que el usuario no existe
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      // Act & Assert: Verificar que se lanza la excepción
      await expect(
        service.updateStatus('non-existent-id', true),
      ).rejects.toThrow(NotFoundException);
      await expect(
        service.updateStatus('non-existent-id', true),
      ).rejects.toThrow('User with id non-existent-id not found');

      // Verificar que se registró el error y nunca se llamó a update
      expect(logger.error).toHaveBeenCalledWith(
        'User with id non-existent-id not found',
      );
      expect(prisma.user.update).not.toHaveBeenCalled();
    });
  });

  // =========================================================================
  // TESTS PARA resetPasswordById()
  // =========================================================================

  describe('resetPasswordById()', () => {
    it('debe resetear la contraseña a ChangeMe123 hasheada con bcrypt', async () => {
      // Arrange: Simular que el usuario existe
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (prisma.user.update as jest.Mock).mockResolvedValue(mockUser);

      // Act: Llamar al método para resetear la contraseña
      const result = await service.resetPasswordById(mockUser.id);

      // Assert: Verificar que se llamó a update con una contraseña hasheada
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: mockUser.id },
      });
      expect(prisma.user.update).toHaveBeenCalled();
      // Verificar que el password enviado no es texto plano
      const updateCall = (prisma.user.update as jest.Mock).mock.calls[0][0];
      expect(updateCall.data.password).not.toBe('ChangeMe123');
      expect(updateCall.data.password).toBeDefined();
      expect(updateCall.data.password.length).toBeGreaterThan(20);
      // Verificar el retorno
      expect(result).toEqual({
        success: true,
        message: 'Password reset to default',
      });
      expect(logger.log).toHaveBeenCalledWith(
        `Password reset for user ${mockUser.id}`,
      );
    });

    it('debe lanzar NotFoundException si el usuario no existe', async () => {
      // Arrange: Simular que el usuario no existe
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      // Act & Assert: Verificar que se lanza la excepción
      await expect(
        service.resetPasswordById('non-existent-id'),
      ).rejects.toThrow(NotFoundException);
      await expect(
        service.resetPasswordById('non-existent-id'),
      ).rejects.toThrow('User with id non-existent-id not found');

      // Verificar que se registró el error y nunca se llamó a update
      expect(logger.error).toHaveBeenCalledWith(
        'User with id non-existent-id not found',
      );
      expect(prisma.user.update).not.toHaveBeenCalled();
    });
  });
});
