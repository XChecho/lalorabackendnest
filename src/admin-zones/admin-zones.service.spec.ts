import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { AdminZonesService } from './admin-zones.service';
import { PrismaService } from '../prisma.service';
import { createMockPrismaService } from '../__mocks__/prisma.mock';
import { CreateZoneDto, UpdateZoneDto, AddTablesDto, UpdateTableDto } from './dto';

describe('AdminZonesService', () => {
  let service: AdminZonesService;
  let prisma: ReturnType<typeof createMockPrismaService>;

  beforeEach(async () => {
    // Arrange: configurar módulo de testing con mocks
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminZonesService,
        { provide: PrismaService, useValue: createMockPrismaService() },
      ],
    }).compile();

    service = module.get<AdminZonesService>(AdminZonesService);
    prisma = module.get(PrismaService);
  });

  describe('findAll', () => {
    it('debería listar todas las zonas con mesas y conteo ordenadas por createdAt', async () => {
      // Arrange: preparar datos de prueba y configurar el mock
      const mockZones = [
        {
          id: 'zone-1',
          name: 'Terraza',
          icon: 'sun',
          tables: [{ id: 'table-1', name: 'Mesa 01' }],
          _count: { tables: 1 },
          createdAt: new Date('2026-01-01'),
        },
      ];
      prisma.zone.findMany.mockResolvedValue(mockZones);

      // Act: ejecutar el método bajo prueba
      const result = await service.findAll();

      // Assert: verificar que se llamó findMany con los parámetros correctos
      expect(prisma.zone.findMany).toHaveBeenCalledWith({
        include: {
          tables: { orderBy: { name: 'asc' } },
          _count: { select: { tables: true } },
        },
        orderBy: { createdAt: 'desc' },
      });
      expect(result).toEqual(mockZones);
    });

    it('debería retornar un array vacío si no hay zonas', async () => {
      // Arrange: mock retorna array vacío
      prisma.zone.findMany.mockResolvedValue([]);

      // Act: ejecutar el método bajo prueba
      const result = await service.findAll();

      // Assert: verificar que retorna array vacío
      expect(result).toEqual([]);
    });
  });

  describe('findById', () => {
    it('debería obtener una zona con sus mesas ordenadas por nombre', async () => {
      // Arrange: preparar zona mock con mesas
      const mockZone = {
        id: 'zone-1',
        name: 'Terraza',
        icon: 'sun',
        tables: [
          { id: 'table-1', name: 'Mesa 01', capacity: 4 },
          { id: 'table-2', name: 'Mesa 02', capacity: 2 },
        ],
        createdAt: new Date('2026-01-01'),
      };
      prisma.zone.findUnique.mockResolvedValue(mockZone);

      // Act: ejecutar el método bajo prueba
      const result = await service.findById('zone-1');

      // Assert: verificar que se llamó findUnique con el ID correcto
      expect(prisma.zone.findUnique).toHaveBeenCalledWith({
        where: { id: 'zone-1' },
        include: { tables: { orderBy: { name: 'asc' } } },
      });
      expect(result).toEqual(mockZone);
    });

    it('debería lanzar NotFoundException si la zona no existe', async () => {
      // Arrange: mock retorna null
      prisma.zone.findUnique.mockResolvedValue(null);

      // Act & Assert: verificar que se lanza la excepción
      await expect(service.findById('zone-inexistente')).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.findById('zone-inexistente')).rejects.toThrow(
        'Zone with id zone-inexistente not found',
      );
    });
  });

  describe('create', () => {
    it('debería crear una zona nueva con nombre e icono', async () => {
      // Arrange: preparar DTO y mock de creación
      const createZoneDto: CreateZoneDto = {
        name: 'Terraza Principal',
        icon: 'sun',
      };
      const mockCreatedZone = {
        id: 'zone-new',
        name: 'Terraza Principal',
        icon: 'sun',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      prisma.zone.create.mockResolvedValue(mockCreatedZone);

      // Act: ejecutar el método bajo prueba
      const result = await service.create(createZoneDto);

      // Assert: verificar que se llamó create con los datos correctos
      expect(prisma.zone.create).toHaveBeenCalledWith({
        data: { name: 'Terraza Principal', icon: 'sun' },
      });
      expect(result).toEqual(mockCreatedZone);
    });

    it('debería usar icono por defecto "restaurant" si no se proporciona', async () => {
      // Arrange: preparar DTO sin icono
      const createZoneDto: CreateZoneDto = { name: 'Interior' };
      const mockCreatedZone = {
        id: 'zone-new',
        name: 'Interior',
        icon: 'restaurant',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      prisma.zone.create.mockResolvedValue(mockCreatedZone);

      // Act: ejecutar el método bajo prueba
      const result = await service.create(createZoneDto);

      // Assert: verificar que usó el icono por defecto
      expect(prisma.zone.create).toHaveBeenCalledWith({
        data: { name: 'Interior', icon: 'restaurant' },
      });
      expect(result.icon).toBe('restaurant');
    });
  });

  describe('update', () => {
    it('debería actualizar una zona existente', async () => {
      // Arrange: preparar datos mock
      const mockZone = {
        id: 'zone-1',
        name: 'Terraza',
        icon: 'sun',
        tables: [],
        createdAt: new Date(),
      };
      const mockUpdatedZone = {
        id: 'zone-1',
        name: 'Terraza Actualizada',
        icon: 'leaf',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      const updateZoneDto: UpdateZoneDto = {
        name: 'Terraza Actualizada',
        icon: 'leaf',
      };

      prisma.zone.findUnique.mockResolvedValue(mockZone);
      prisma.zone.update.mockResolvedValue(mockUpdatedZone);

      // Act: ejecutar el método bajo prueba
      const result = await service.update('zone-1', updateZoneDto);

      // Assert: verificar que se llamó update con los datos correctos
      expect(prisma.zone.update).toHaveBeenCalledWith({
        where: { id: 'zone-1' },
        data: { name: 'Terraza Actualizada', icon: 'leaf' },
      });
      expect(result).toEqual(mockUpdatedZone);
    });

    it('debería lanzar NotFoundException si la zona no existe', async () => {
      // Arrange: mock retorna null en findById
      prisma.zone.findUnique.mockResolvedValue(null);

      // Act & Assert: verificar que se lanza la excepción
      const updateDto: UpdateZoneDto = { name: 'Nuevo Nombre' };
      await expect(service.update('zone-inexistente', updateDto)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('delete', () => {
    it('debería eliminar una zona y sus mesas', async () => {
      // Arrange: preparar zona mock existente
      const mockZone = {
        id: 'zone-1',
        name: 'Terraza',
        icon: 'sun',
        tables: [],
        createdAt: new Date(),
      };
      const mockDeletedZone = { id: 'zone-1', name: 'Terraza', icon: 'sun' };

      prisma.zone.findUnique.mockResolvedValue(mockZone);
      prisma.table.deleteMany.mockResolvedValue({ count: 3 });
      prisma.zone.delete.mockResolvedValue(mockDeletedZone);

      // Act: ejecutar el método bajo prueba
      const result = await service.delete('zone-1');

      // Assert: verificar que se eliminaron las mesas y luego la zona
      expect(prisma.table.deleteMany).toHaveBeenCalledWith({
        where: { zoneId: 'zone-1' },
      });
      expect(prisma.zone.delete).toHaveBeenCalledWith({ where: { id: 'zone-1' } });
      expect(result).toEqual(mockDeletedZone);
    });

    it('debería lanzar NotFoundException si la zona no existe', async () => {
      // Arrange: mock retorna null
      prisma.zone.findUnique.mockResolvedValue(null);

      // Act & Assert: verificar que se lanza la excepción
      await expect(service.delete('zone-inexistente')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('addTables', () => {
    it('debería agregar múltiples mesas a una zona con nombres autoincrementales', async () => {
      // Arrange: preparar zona con mesas existentes y DTO
      const mockZone = {
        id: 'zone-1',
        name: 'Terraza',
        icon: 'sun',
        tables: [
          { id: 'table-1', name: 'Mesa 01' },
          { id: 'table-2', name: 'Mesa 02' },
        ],
        createdAt: new Date(),
      };
      const addTablesDto: AddTablesDto = { quantity: 3 };
      const mockUpdatedZone = {
        ...mockZone,
        tables: [
          ...mockZone.tables,
          { id: 'table-3', name: 'Mesa 03' },
          { id: 'table-4', name: 'Mesa 04' },
          { id: 'table-5', name: 'Mesa 05' },
        ],
      };

      prisma.zone.findUnique.mockResolvedValue(mockZone);
      prisma.table.createMany.mockResolvedValue({ count: 3 });
      // findById se llama dos veces: una al inicio y otra al final
      prisma.zone.findUnique
        .mockResolvedValueOnce(mockZone)
        .mockResolvedValueOnce(mockUpdatedZone);

      // Act: ejecutar el método bajo prueba
      const result = await service.addTables('zone-1', addTablesDto);

      // Assert: verificar que se crearon las mesas con nombres correctos
      expect(prisma.table.createMany).toHaveBeenCalledWith({
        data: [
          { name: 'Mesa 03', capacity: 4, zoneId: 'zone-1' },
          { name: 'Mesa 04', capacity: 4, zoneId: 'zone-1' },
          { name: 'Mesa 05', capacity: 4, zoneId: 'zone-1' },
        ],
      });
      expect(result).toEqual(mockUpdatedZone);
    });

    it('debería lanzar NotFoundException si la zona no existe', async () => {
      // Arrange: mock retorna null
      prisma.zone.findUnique.mockResolvedValue(null);

      // Act & Assert: verificar que se lanza la excepción
      const addTablesDto: AddTablesDto = { quantity: 2 };
      await expect(service.addTables('zone-inexistente', addTablesDto)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('addTable', () => {
    it('debería agregar una sola mesa a una zona con nombre autoincremental', async () => {
      // Arrange: preparar zona con una mesa existente
      const mockZone = {
        id: 'zone-1',
        name: 'Terraza',
        icon: 'sun',
        tables: [{ id: 'table-1', name: 'Mesa 01' }],
        createdAt: new Date(),
      };
      const mockNewTable = {
        id: 'table-2',
        name: 'Mesa 02',
        capacity: 4,
        zoneId: 'zone-1',
      };

      prisma.zone.findUnique.mockResolvedValue(mockZone);
      prisma.table.create.mockResolvedValue(mockNewTable);

      // Act: ejecutar el método bajo prueba
      const result = await service.addTable('zone-1');

      // Assert: verificar que se creó la mesa con nombre autoincremental
      expect(prisma.table.create).toHaveBeenCalledWith({
        data: {
          name: 'Mesa 02',
          capacity: 4,
          zoneId: 'zone-1',
        },
      });
      expect(result).toEqual(mockNewTable);
    });

    it('debería agregar una mesa con nombre y capacidad personalizados', async () => {
      // Arrange: preparar zona y DTO personalizado
      const mockZone = {
        id: 'zone-1',
        name: 'Terraza',
        icon: 'sun',
        tables: [],
        createdAt: new Date(),
      };
      const customTableDto: UpdateTableDto = {
        name: 'Mesa VIP',
        capacity: 8,
      };
      const mockNewTable = {
        id: 'table-1',
        name: 'Mesa VIP',
        capacity: 8,
        zoneId: 'zone-1',
      };

      prisma.zone.findUnique.mockResolvedValue(mockZone);
      prisma.table.create.mockResolvedValue(mockNewTable);

      // Act: ejecutar el método bajo prueba
      const result = await service.addTable('zone-1', customTableDto);

      // Assert: verificar que usó los valores personalizados
      expect(prisma.table.create).toHaveBeenCalledWith({
        data: {
          name: 'Mesa VIP',
          capacity: 8,
          zoneId: 'zone-1',
        },
      });
      expect(result).toEqual(mockNewTable);
    });

    it('debería lanzar NotFoundException si la zona no existe', async () => {
      // Arrange: mock retorna null
      prisma.zone.findUnique.mockResolvedValue(null);

      // Act & Assert: verificar que se lanza la excepción
      await expect(service.addTable('zone-inexistente')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('removeTable', () => {
    it('debería remover una mesa de una zona', async () => {
      // Arrange: preparar zona y mesa existentes
      const mockZone = {
        id: 'zone-1',
        name: 'Terraza',
        icon: 'sun',
        tables: [{ id: 'table-1', name: 'Mesa 01' }],
        createdAt: new Date(),
      };
      const mockTable = {
        id: 'table-1',
        name: 'Mesa 01',
        capacity: 4,
        zoneId: 'zone-1',
        status: 'AVAILABLE',
      };
      const mockDeletedTable = { id: 'table-1', name: 'Mesa 01' };

      prisma.zone.findUnique.mockResolvedValue(mockZone);
      prisma.table.findUnique.mockResolvedValue(mockTable);
      prisma.table.delete.mockResolvedValue(mockDeletedTable);

      // Act: ejecutar el método bajo prueba
      const result = await service.removeTable('zone-1', 'table-1');

      // Assert: verificar que se eliminó la mesa
      expect(prisma.table.delete).toHaveBeenCalledWith({ where: { id: 'table-1' } });
      expect(result).toEqual(mockDeletedTable);
    });

    it('debería lanzar NotFoundException si la mesa no pertenece a la zona', async () => {
      // Arrange: mesa existe pero pertenece a otra zona
      const mockZone = {
        id: 'zone-1',
        name: 'Terraza',
        icon: 'sun',
        tables: [],
        createdAt: new Date(),
      };
      const mockTable = {
        id: 'table-1',
        name: 'Mesa 01',
        zoneId: 'zone-2', // zona diferente
      };

      prisma.zone.findUnique.mockResolvedValue(mockZone);
      prisma.table.findUnique.mockResolvedValue(mockTable);

      // Act & Assert: verificar que se lanza la excepción
      await expect(service.removeTable('zone-1', 'table-1')).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.removeTable('zone-1', 'table-1')).rejects.toThrow(
        'Table with id table-1 not found in zone',
      );
    });

    it('debería lanzar NotFoundException si la mesa no existe', async () => {
      // Arrange: zona existe pero mesa no
      const mockZone = {
        id: 'zone-1',
        name: 'Terraza',
        icon: 'sun',
        tables: [],
        createdAt: new Date(),
      };

      prisma.zone.findUnique.mockResolvedValue(mockZone);
      prisma.table.findUnique.mockResolvedValue(null);

      // Act & Assert: verificar que se lanza la excepción
      await expect(service.removeTable('zone-1', 'table-inexistente')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('toggleTableStatus', () => {
    it('debería cambiar el estado de una mesa', async () => {
      // Arrange: preparar zona y mesa existentes
      const mockZone = {
        id: 'zone-1',
        name: 'Terraza',
        icon: 'sun',
        tables: [{ id: 'table-1', name: 'Mesa 01' }],
        createdAt: new Date(),
      };
      const mockTable = {
        id: 'table-1',
        name: 'Mesa 01',
        zoneId: 'zone-1',
        status: 'AVAILABLE',
      };
      const mockUpdatedTable = {
        id: 'table-1',
        name: 'Mesa 01',
        zoneId: 'zone-1',
        status: 'OCCUPIED',
      };

      prisma.zone.findUnique.mockResolvedValue(mockZone);
      prisma.table.findUnique.mockResolvedValue(mockTable);
      prisma.table.update.mockResolvedValue(mockUpdatedTable);

      // Act: ejecutar el método bajo prueba
      const result = await service.toggleTableStatus('zone-1', 'table-1', 'OCCUPIED');

      // Assert: verificar que se actualizó el estado
      expect(prisma.table.update).toHaveBeenCalledWith({
        where: { id: 'table-1' },
        data: { status: 'OCCUPIED' },
      });
      expect(result).toEqual(mockUpdatedTable);
    });

    it('debería lanzar NotFoundException si la mesa no pertenece a la zona', async () => {
      // Arrange: mesa pertenece a otra zona
      const mockZone = {
        id: 'zone-1',
        name: 'Terraza',
        icon: 'sun',
        tables: [],
        createdAt: new Date(),
      };
      const mockTable = {
        id: 'table-1',
        name: 'Mesa 01',
        zoneId: 'zone-2',
      };

      prisma.zone.findUnique.mockResolvedValue(mockZone);
      prisma.table.findUnique.mockResolvedValue(mockTable);

      // Act & Assert: verificar que se lanza la excepción
      await expect(
        service.toggleTableStatus('zone-1', 'table-1', 'RESERVED'),
      ).rejects.toThrow(NotFoundException);
    });

    it('debería lanzar NotFoundException si la zona no existe', async () => {
      // Arrange: zona no existe
      prisma.zone.findUnique.mockResolvedValue(null);

      // Act & Assert: verificar que se lanza la excepción
      await expect(
        service.toggleTableStatus('zone-inexistente', 'table-1', 'AVAILABLE'),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
