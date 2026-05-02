import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { ZonesService } from './zones.service';
import { PrismaService } from '../prisma.service';
import { createMockPrismaService } from '../__mocks__/prisma.mock';

describe('ZonesService', () => {
  let service: ZonesService;
  let prisma: ReturnType<typeof createMockPrismaService>;

  beforeEach(async () => {
    // Arrange: configurar módulo de testing con mocks
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ZonesService,
        { provide: PrismaService, useValue: createMockPrismaService() },
      ],
    }).compile();

    service = module.get<ZonesService>(ZonesService);
    prisma = module.get(PrismaService);
  });

  describe('findAll', () => {
    it('debería listar todas las zonas con conteo de mesas ordenadas por nombre', async () => {
      // Arrange: preparar datos de prueba y configurar el mock
      const mockZones = [
        {
          id: 'zone-1',
          name: 'Terraza',
          icon: 'sun',
          _count: { tables: 5 },
        },
        {
          id: 'zone-2',
          name: 'Interior',
          icon: 'home',
          _count: { tables: 10 },
        },
      ];
      prisma.zone.findMany.mockResolvedValue(mockZones);

      // Act: ejecutar el método bajo prueba
      const result = await service.findAll();

      // Assert: verificar que se llamó findMany con los parámetros correctos
      expect(prisma.zone.findMany).toHaveBeenCalledWith({
        include: {
          _count: {
            select: { tables: true },
          },
        },
        orderBy: { name: 'asc' },
      });
      expect(result).toEqual(mockZones);
      expect(result).toHaveLength(2);
    });

    it('debería retornar un array vacío si no hay zonas', async () => {
      // Arrange: mock retorna array vacío
      prisma.zone.findMany.mockResolvedValue([]);

      // Act: ejecutar el método bajo prueba
      const result = await service.findAll();

      // Assert: verificar que retorna array vacío
      expect(result).toEqual([]);
      expect(prisma.zone.findMany).toHaveBeenCalled();
    });
  });

  describe('findById', () => {
    it('debería obtener una zona con sus mesas por ID', async () => {
      // Arrange: preparar zona mock con mesas
      const mockZone = {
        id: 'zone-1',
        name: 'Terraza',
        icon: 'sun',
        tables: [
          { id: 'table-1', name: 'Mesa 01', capacity: 4, status: 'AVAILABLE' },
          { id: 'table-2', name: 'Mesa 02', capacity: 2, status: 'OCCUPIED' },
        ],
      };
      prisma.zone.findUnique.mockResolvedValue(mockZone);

      // Act: ejecutar el método bajo prueba
      const result = await service.findById('zone-1');

      // Assert: verificar que se llamó findUnique con el ID correcto
      expect(prisma.zone.findUnique).toHaveBeenCalledWith({
        where: { id: 'zone-1' },
        include: { tables: true },
      });
      expect(result).toEqual(mockZone);
      expect(result.tables).toHaveLength(2);
    });

    it('debería lanzar NotFoundException si la zona no existe', async () => {
      // Arrange: mock retorna null (zona no encontrada)
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
});
