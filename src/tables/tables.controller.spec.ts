import { Test, TestingModule } from '@nestjs/testing';
import { TablesController } from './tables.controller';
import { TablesService } from './tables.service';

describe('TablesController', () => {
  let controller: TablesController;
  let service: TablesService;

  beforeEach(async () => {
    // Arrange: configurar módulo de testing con mock del servicio
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TablesController],
      providers: [
        {
          provide: TablesService,
          useValue: {
            findAll: jest.fn(),
            findByZone: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<TablesController>(TablesController);
    service = module.get<TablesService>(TablesService);
  });

  describe('GET /tables', () => {
    it('debería delegar al servicio para listar todas las mesas', async () => {
      // Arrange: preparar datos mock del servicio
      const mockTables = [
        {
          id: 'table-1',
          name: 'Mesa 01',
          capacity: 4,
          status: 'AVAILABLE',
          zone: { id: 'zone-1', name: 'Interior' },
        },
      ];
      jest.spyOn(service, 'findAll').mockResolvedValue(mockTables);

      // Act: ejecutar el método del controlador
      const result = await controller.findAll();

      // Assert: verificar que delegó al servicio y retornó el resultado
      expect(service.findAll).toHaveBeenCalled();
      expect(result).toEqual(mockTables);
    });
  });

  describe('GET /zones/:zoneId/tables', () => {
    it('debería delegar al servicio para listar mesas por zona', async () => {
      // Arrange: preparar datos mock del servicio
      const mockTables = [
        {
          id: 'table-1',
          name: 'Mesa 01',
          capacity: 4,
          zone: { id: 'zone-1', name: 'Terraza' },
        },
        {
          id: 'table-2',
          name: 'Mesa 02',
          capacity: 2,
          zone: { id: 'zone-1', name: 'Terraza' },
        },
      ];
      jest.spyOn(service, 'findByZone').mockResolvedValue(mockTables);

      // Act: ejecutar el método del controlador con un zoneId
      const result = await controller.findByZone('zone-1');

      // Assert: verificar que delegó al servicio con el zoneId correcto
      expect(service.findByZone).toHaveBeenCalledWith('zone-1');
      expect(result).toEqual(mockTables);
    });
  });
});
