import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { AdminTablesService } from './admin-tables.service';
import { PrismaService } from '../prisma.service';
import { createMockPrismaService } from '../__mocks__/prisma.mock';
import { UpdateTableDto, ToggleTableStatusDto } from '../admin-zones/dto';

describe('AdminTablesService', () => {
  let service: AdminTablesService;
  let prisma: ReturnType<typeof createMockPrismaService>;

  beforeEach(async () => {
    // Arrange: configurar módulo de testing con mocks
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminTablesService,
        { provide: PrismaService, useValue: createMockPrismaService() },
      ],
    }).compile();

    service = module.get<AdminTablesService>(AdminTablesService);
    prisma = module.get(PrismaService);
  });

  describe('findAll', () => {
    it('debería listar todas las mesas con su zona ordenadas por zona y nombre', async () => {
      // Arrange: preparar datos de prueba y configurar el mock
      const mockTables = [
        {
          id: 'table-1',
          name: 'Mesa 01',
          capacity: 4,
          status: 'AVAILABLE',
          zone: { id: 'zone-1', name: 'Interior' },
        },
        {
          id: 'table-2',
          name: 'Mesa 02',
          capacity: 2,
          status: 'OCCUPIED',
          zone: { id: 'zone-2', name: 'Terraza' },
        },
      ];
      prisma.table.findMany.mockResolvedValue(mockTables);

      // Act: ejecutar el método bajo prueba
      const result = await service.findAll();

      // Assert: verificar que se llamó findMany con los parámetros correctos
      expect(prisma.table.findMany).toHaveBeenCalledWith({
        include: { zone: true },
        orderBy: [{ zone: { name: 'asc' } }, { name: 'asc' }],
      });
      expect(result).toEqual(mockTables);
    });

    it('debería retornar un array vacío si no hay mesas', async () => {
      // Arrange: mock retorna array vacío
      prisma.table.findMany.mockResolvedValue([]);

      // Act: ejecutar el método bajo prueba
      const result = await service.findAll();

      // Assert: verificar que retorna array vacío
      expect(result).toEqual([]);
    });
  });

  describe('findById', () => {
    it('debería obtener una mesa por ID con su zona', async () => {
      // Arrange: preparar mesa mock con zona
      const mockTable = {
        id: 'table-1',
        name: 'Mesa 01',
        capacity: 4,
        status: 'AVAILABLE',
        zone: { id: 'zone-1', name: 'Terraza', icon: 'sun' },
      };
      prisma.table.findUnique.mockResolvedValue(mockTable);

      // Act: ejecutar el método bajo prueba
      const result = await service.findById('table-1');

      // Assert: verificar que se llamó findUnique con el ID correcto
      expect(prisma.table.findUnique).toHaveBeenCalledWith({
        where: { id: 'table-1' },
        include: { zone: true },
      });
      expect(result).toEqual(mockTable);
    });

    it('debería lanzar NotFoundException si la mesa no existe', async () => {
      // Arrange: mock retorna null
      prisma.table.findUnique.mockResolvedValue(null);

      // Act & Assert: verificar que se lanza la excepción
      await expect(service.findById('table-inexistente')).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.findById('table-inexistente')).rejects.toThrow(
        'Table with id table-inexistente not found',
      );
    });
  });

  describe('create', () => {
    it('debería crear una mesa nueva en una zona existente', async () => {
      // Arrange: preparar datos y mocks
      const createData = {
        zoneId: 'zone-1',
        name: 'Mesa 01',
        capacity: 4,
      };
      const mockZone = { id: 'zone-1', name: 'Terraza', icon: 'sun' };
      const mockCreatedTable = {
        id: 'table-new',
        name: 'Mesa 01',
        capacity: 4,
        zoneId: 'zone-1',
        status: 'AVAILABLE',
      };

      prisma.zone.findUnique.mockResolvedValue(mockZone);
      prisma.table.create.mockResolvedValue(mockCreatedTable);

      // Act: ejecutar el método bajo prueba
      const result = await service.create(createData);

      // Assert: verificar que se validó la zona y se creó la mesa
      expect(prisma.zone.findUnique).toHaveBeenCalledWith({
        where: { id: 'zone-1' },
      });
      expect(prisma.table.create).toHaveBeenCalledWith({
        data: {
          name: 'Mesa 01',
          capacity: 4,
          zoneId: 'zone-1',
        },
      });
      expect(result).toEqual(mockCreatedTable);
    });

    it('debería lanzar NotFoundException si la zona no existe', async () => {
      // Arrange: zona no existe
      prisma.zone.findUnique.mockResolvedValue(null);

      // Act & Assert: verificar que se lanza la excepción
      const createData = {
        zoneId: 'zone-inexistente',
        name: 'Mesa 01',
        capacity: 4,
      };
      await expect(service.create(createData)).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.create(createData)).rejects.toThrow(
        'Zone with id zone-inexistente not found',
      );
    });
  });

  describe('update', () => {
    it('debería actualizar una mesa existente', async () => {
      // Arrange: preparar datos mock
      const mockTable = {
        id: 'table-1',
        name: 'Mesa 01',
        capacity: 4,
        status: 'AVAILABLE',
        zone: { id: 'zone-1', name: 'Terraza' },
      };
      const mockUpdatedTable = {
        id: 'table-1',
        name: 'Mesa VIP',
        capacity: 8,
        status: 'AVAILABLE',
        zone: { id: 'zone-1', name: 'Terraza' },
      };
      const updateTableDto: UpdateTableDto = {
        name: 'Mesa VIP',
        capacity: 8,
      };

      prisma.table.findUnique.mockResolvedValue(mockTable);
      prisma.table.update.mockResolvedValue(mockUpdatedTable);

      // Act: ejecutar el método bajo prueba
      const result = await service.update('table-1', updateTableDto);

      // Assert: verificar que se llamó update con los datos correctos
      expect(prisma.table.update).toHaveBeenCalledWith({
        where: { id: 'table-1' },
        data: { name: 'Mesa VIP', capacity: 8 },
      });
      expect(result).toEqual(mockUpdatedTable);
    });

    it('debería lanzar NotFoundException si la mesa no existe', async () => {
      // Arrange: mock retorna null en findById
      prisma.table.findUnique.mockResolvedValue(null);

      // Act & Assert: verificar que se lanza la excepción
      const updateDto: UpdateTableDto = { name: 'Nuevo Nombre' };
      await expect(service.update('table-inexistente', updateDto)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('updateStatus', () => {
    it('debería cambiar el estado de una mesa', async () => {
      // Arrange: preparar datos mock
      const mockTable = {
        id: 'table-1',
        name: 'Mesa 01',
        capacity: 4,
        status: 'AVAILABLE',
        zone: { id: 'zone-1', name: 'Terraza' },
      };
      const mockUpdatedTable = {
        id: 'table-1',
        name: 'Mesa 01',
        capacity: 4,
        status: 'OCCUPIED',
        zone: { id: 'zone-1', name: 'Terraza' },
      };

      prisma.table.findUnique.mockResolvedValue(mockTable);
      prisma.table.update.mockResolvedValue(mockUpdatedTable);

      // Act: ejecutar el método bajo prueba
      const result = await service.updateStatus('table-1', 'OCCUPIED');

      // Assert: verificar que se actualizó el estado
      expect(prisma.table.update).toHaveBeenCalledWith({
        where: { id: 'table-1' },
        data: { status: 'OCCUPIED' },
      });
      expect(result).toEqual(mockUpdatedTable);
    });

    it('debería lanzar NotFoundException si la mesa no existe', async () => {
      // Arrange: mock retorna null
      prisma.table.findUnique.mockResolvedValue(null);

      // Act & Assert: verificar que se lanza la excepción
      await expect(
        service.updateStatus('table-inexistente', 'RESERVED'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('delete', () => {
    it('debería eliminar una mesa existente', async () => {
      // Arrange: preparar datos mock
      const mockTable = {
        id: 'table-1',
        name: 'Mesa 01',
        capacity: 4,
        status: 'AVAILABLE',
        zone: { id: 'zone-1', name: 'Terraza' },
      };
      const mockDeleted = { id: 'table-1', name: 'Mesa 01' };

      prisma.table.findUnique.mockResolvedValue(mockTable);
      prisma.table.delete.mockResolvedValue(mockDeleted);

      // Act: ejecutar el método bajo prueba
      const result = await service.delete('table-1');

      // Assert: verificar que se eliminó la mesa
      expect(prisma.table.delete).toHaveBeenCalledWith({
        where: { id: 'table-1' },
      });
      expect(result).toEqual(mockDeleted);
    });

    it('debería lanzar NotFoundException si la mesa no existe', async () => {
      // Arrange: mock retorna null
      prisma.table.findUnique.mockResolvedValue(null);

      // Act & Assert: verificar que se lanza la excepción
      await expect(service.delete('table-inexistente')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('findByZone', () => {
    it('debería listar todas las mesas de una zona existente', async () => {
      // Arrange: preparar datos mock
      const mockZone = { id: 'zone-1', name: 'Terraza', icon: 'sun' };
      const mockTables = [
        { id: 'table-1', name: 'Mesa 01', capacity: 4, zoneId: 'zone-1' },
        { id: 'table-2', name: 'Mesa 02', capacity: 2, zoneId: 'zone-1' },
      ];

      prisma.zone.findUnique.mockResolvedValue(mockZone);
      prisma.table.findMany.mockResolvedValue(mockTables);

      // Act: ejecutar el método bajo prueba
      const result = await service.findByZone('zone-1');

      // Assert: verificar que se validó la zona y se listaron las mesas
      expect(prisma.zone.findUnique).toHaveBeenCalledWith({
        where: { id: 'zone-1' },
      });
      expect(prisma.table.findMany).toHaveBeenCalledWith({
        where: { zoneId: 'zone-1' },
        orderBy: { name: 'asc' },
      });
      expect(result).toEqual(mockTables);
    });

    it('debería lanzar NotFoundException si la zona no existe', async () => {
      // Arrange: zona no existe
      prisma.zone.findUnique.mockResolvedValue(null);

      // Act & Assert: verificar que se lanza la excepción
      await expect(service.findByZone('zone-inexistente')).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.findByZone('zone-inexistente')).rejects.toThrow(
        'Zone with id zone-inexistente not found',
      );
    });

    it('debería retornar un array vacío si la zona no tiene mesas', async () => {
      // Arrange: zona existe pero sin mesas
      const mockZone = { id: 'zone-1', name: 'Terraza', icon: 'sun' };

      prisma.zone.findUnique.mockResolvedValue(mockZone);
      prisma.table.findMany.mockResolvedValue([]);

      // Act: ejecutar el método bajo prueba
      const result = await service.findByZone('zone-1');

      // Assert: verificar que retorna array vacío
      expect(result).toEqual([]);
    });
  });
});
