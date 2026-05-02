import { Test, TestingModule } from '@nestjs/testing';
import { TablesService } from './tables.service';
import { PrismaService } from '../prisma.service';
import { createMockPrismaService } from '../__mocks__/prisma.mock';

describe('TablesService', () => {
  let service: TablesService;
  let prisma: ReturnType<typeof createMockPrismaService>;

  beforeEach(async () => {
    // Arrange: configurar módulo de testing con mocks
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TablesService,
        { provide: PrismaService, useValue: createMockPrismaService() },
      ],
    }).compile();

    service = module.get<TablesService>(TablesService);
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
          zone: { id: 'zone-1', name: 'Interior' },
        },
        {
          id: 'table-3',
          name: 'Mesa 01',
          capacity: 6,
          status: 'AVAILABLE',
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
      expect(result).toHaveLength(3);
    });

    it('debería retornar un array vacío si no hay mesas', async () => {
      // Arrange: mock retorna array vacío
      prisma.table.findMany.mockResolvedValue([]);

      // Act: ejecutar el método bajo prueba
      const result = await service.findAll();

      // Assert: verificar que retorna array vacío
      expect(result).toEqual([]);
      expect(prisma.table.findMany).toHaveBeenCalled();
    });
  });

  describe('findByZone', () => {
    it('debería listar todas las mesas de una zona específica', async () => {
      // Arrange: preparar mesas mock para una zona
      const mockTables = [
        {
          id: 'table-1',
          name: 'Mesa 01',
          capacity: 4,
          status: 'AVAILABLE',
          zone: { id: 'zone-1', name: 'Terraza' },
        },
        {
          id: 'table-2',
          name: 'Mesa 02',
          capacity: 2,
          status: 'RESERVED',
          zone: { id: 'zone-1', name: 'Terraza' },
        },
      ];
      prisma.table.findMany.mockResolvedValue(mockTables);

      // Act: ejecutar el método bajo prueba
      const result = await service.findByZone('zone-1');

      // Assert: verificar que se llamó findMany con el zoneId correcto
      expect(prisma.table.findMany).toHaveBeenCalledWith({
        where: { zoneId: 'zone-1' },
        include: { zone: true },
        orderBy: { name: 'asc' },
      });
      expect(result).toEqual(mockTables);
      expect(result).toHaveLength(2);
    });

    it('debería retornar un array vacío si la zona no tiene mesas', async () => {
      // Arrange: mock retorna array vacío
      prisma.table.findMany.mockResolvedValue([]);

      // Act: ejecutar el método bajo prueba
      const result = await service.findByZone('zone-vacia');

      // Assert: verificar que retorna array vacío
      expect(result).toEqual([]);
    });
  });
});
