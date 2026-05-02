import { Test, TestingModule } from '@nestjs/testing';
import { ZonesController } from './zones.controller';
import { ZonesService } from './zones.service';

describe('ZonesController', () => {
  let controller: ZonesController;
  let service: ZonesService;

  beforeEach(async () => {
    // Arrange: configurar módulo de testing con mock del servicio
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ZonesController],
      providers: [
        {
          provide: ZonesService,
          useValue: {
            findAll: jest.fn(),
            findById: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<ZonesController>(ZonesController);
    service = module.get<ZonesService>(ZonesService);
  });

  describe('findAll', () => {
    it('debería delegar al servicio para listar todas las zonas', async () => {
      // Arrange: preparar datos mock del servicio
      const mockZones = [
        { id: 'zone-1', name: 'Terraza', icon: 'sun', _count: { tables: 5 } },
        { id: 'zone-2', name: 'Interior', icon: 'home', _count: { tables: 10 } },
      ];
      jest.spyOn(service, 'findAll').mockResolvedValue(mockZones);

      // Act: ejecutar el método del controlador
      const result = await controller.findAll();

      // Assert: verificar que delegó al servicio y retornó el resultado
      expect(service.findAll).toHaveBeenCalled();
      expect(result).toEqual(mockZones);
    });
  });

  describe('findOne', () => {
    it('debería delegar al servicio para obtener una zona por ID', async () => {
      // Arrange: preparar datos mock del servicio
      const mockZone = {
        id: 'zone-1',
        name: 'Terraza',
        icon: 'sun',
        tables: [],
      };
      jest.spyOn(service, 'findById').mockResolvedValue(mockZone);

      // Act: ejecutar el método del controlador con un ID
      const result = await controller.findOne('zone-1');

      // Assert: verificar que delegó al servicio con el ID correcto
      expect(service.findById).toHaveBeenCalledWith('zone-1');
      expect(result).toEqual(mockZone);
    });
  });
});
