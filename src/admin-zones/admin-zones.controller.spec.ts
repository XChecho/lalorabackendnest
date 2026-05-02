import { Test, TestingModule } from '@nestjs/testing';
import { AdminZonesController } from './admin-zones.controller';
import { AdminZonesService } from './admin-zones.service';
import { CreateZoneDto, UpdateZoneDto, AddTablesDto, UpdateTableDto, ToggleTableStatusDto } from './dto';

describe('AdminZonesController', () => {
  let controller: AdminZonesController;
  let service: AdminZonesService;

  beforeEach(async () => {
    // Arrange: configurar módulo de testing con mock del servicio
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AdminZonesController],
      providers: [
        {
          provide: AdminZonesService,
          useValue: {
            findAll: jest.fn(),
            findById: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
            addTables: jest.fn(),
            addTable: jest.fn(),
            removeTable: jest.fn(),
            toggleTableStatus: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<AdminZonesController>(AdminZonesController);
    service = module.get<AdminZonesService>(AdminZonesService);
  });

  describe('GET /admin/zones', () => {
    it('debería delegar al servicio para listar todas las zonas', async () => {
      // Arrange: preparar datos mock del servicio
      const mockZones = [
        { id: 'zone-1', name: 'Terraza', _count: { tables: 5 }, tables: [] },
      ];
      jest.spyOn(service, 'findAll').mockResolvedValue(mockZones);

      // Act: ejecutar el método del controlador
      const result = await controller.findAll();

      // Assert: verificar que delegó al servicio
      expect(service.findAll).toHaveBeenCalled();
      expect(result).toEqual(mockZones);
    });
  });

  describe('GET /admin/zones/:id', () => {
    it('debería delegar al servicio para obtener una zona por ID', async () => {
      // Arrange: preparar datos mock
      const mockZone = { id: 'zone-1', name: 'Terraza', tables: [] };
      jest.spyOn(service, 'findById').mockResolvedValue(mockZone);

      // Act: ejecutar el método del controlador
      const result = await controller.findOne('zone-1');

      // Assert: verificar que delegó con el ID correcto
      expect(service.findById).toHaveBeenCalledWith('zone-1');
      expect(result).toEqual(mockZone);
    });
  });

  describe('POST /admin/zones', () => {
    it('debería delegar al servicio para crear una zona nueva', async () => {
      // Arrange: preparar DTO y mock
      const createZoneDto: CreateZoneDto = { name: 'Terraza', icon: 'sun' };
      const mockCreated = { id: 'zone-new', name: 'Terraza', icon: 'sun' };
      jest.spyOn(service, 'create').mockResolvedValue(mockCreated);

      // Act: ejecutar el método del controlador
      const result = await controller.create(createZoneDto);

      // Assert: verificar que delegó con el DTO correcto
      expect(service.create).toHaveBeenCalledWith(createZoneDto);
      expect(result).toEqual(mockCreated);
    });
  });

  describe('PUT /admin/zones/:id', () => {
    it('debería delegar al servicio para actualizar una zona', async () => {
      // Arrange: preparar DTO y mock
      const updateZoneDto: UpdateZoneDto = { name: 'Terraza Actualizada' };
      const mockUpdated = { id: 'zone-1', name: 'Terraza Actualizada' };
      jest.spyOn(service, 'update').mockResolvedValue(mockUpdated);

      // Act: ejecutar el método del controlador
      const result = await controller.update('zone-1', updateZoneDto);

      // Assert: verificar que delegó con los parámetros correctos
      expect(service.update).toHaveBeenCalledWith('zone-1', updateZoneDto);
      expect(result).toEqual(mockUpdated);
    });
  });

  describe('DELETE /admin/zones/:id', () => {
    it('debería delegar al servicio para eliminar una zona', async () => {
      // Arrange: preparar mock
      const mockDeleted = { id: 'zone-1', name: 'Terraza' };
      jest.spyOn(service, 'delete').mockResolvedValue(mockDeleted);

      // Act: ejecutar el método del controlador
      const result = await controller.delete('zone-1');

      // Assert: verificar que delegó con el ID correcto
      expect(service.delete).toHaveBeenCalledWith('zone-1');
      expect(result).toEqual(mockDeleted);
    });
  });

  describe('POST /admin/zones/:id/tables', () => {
    it('debería delegar al servicio para agregar múltiples mesas', async () => {
      // Arrange: preparar DTO y mock
      const addTablesDto: AddTablesDto = { quantity: 3 };
      const mockResult = { id: 'zone-1', name: 'Terraza', tables: [] };
      jest.spyOn(service, 'addTables').mockResolvedValue(mockResult);

      // Act: ejecutar el método del controlador
      const result = await controller.addTables('zone-1', addTablesDto);

      // Assert: verificar que delegó con los parámetros correctos
      expect(service.addTables).toHaveBeenCalledWith('zone-1', addTablesDto);
      expect(result).toEqual(mockResult);
    });
  });

  describe('POST /admin/zones/:id/table', () => {
    it('debería delegar al servicio para agregar una mesa individual', async () => {
      // Arrange: preparar DTO y mock
      const updateTableDto: UpdateTableDto = { name: 'Mesa VIP', capacity: 6 };
      const mockTable = { id: 'table-1', name: 'Mesa VIP', capacity: 6 };
      jest.spyOn(service, 'addTable').mockResolvedValue(mockTable);

      // Act: ejecutar el método del controlador
      const result = await controller.addTable('zone-1', updateTableDto);

      // Assert: verificar que delegó con los parámetros correctos
      expect(service.addTable).toHaveBeenCalledWith('zone-1', updateTableDto);
      expect(result).toEqual(mockTable);
    });

    it('debería delegar sin DTO cuando no se proporcionan datos', async () => {
      // Arrange: preparar mock
      const mockTable = { id: 'table-1', name: 'Mesa 01', capacity: 4 };
      jest.spyOn(service, 'addTable').mockResolvedValue(mockTable);

      // Act: ejecutar sin DTO
      const result = await controller.addTable('zone-1');

      // Assert: verificar que delegó con undefined
      expect(service.addTable).toHaveBeenCalledWith('zone-1', undefined);
      expect(result).toEqual(mockTable);
    });
  });

  describe('DELETE /admin/zones/:id/tables/:tableId', () => {
    it('debería delegar al servicio para remover una mesa', async () => {
      // Arrange: preparar mock
      const mockDeleted = { id: 'table-1', name: 'Mesa 01' };
      jest.spyOn(service, 'removeTable').mockResolvedValue(mockDeleted);

      // Act: ejecutar el método del controlador
      const result = await controller.removeTable('zone-1', 'table-1');

      // Assert: verificar que delegó con los IDs correctos
      expect(service.removeTable).toHaveBeenCalledWith('zone-1', 'table-1');
      expect(result).toEqual(mockDeleted);
    });
  });

  describe('PUT /admin/zones/:id/tables/:tableId/status', () => {
    it('debería delegar al servicio para cambiar el estado de una mesa', async () => {
      // Arrange: preparar DTO y mock
      const statusDto: ToggleTableStatusDto = { status: 'OCCUPIED' };
      const mockUpdated = { id: 'table-1', name: 'Mesa 01', status: 'OCCUPIED' };
      jest.spyOn(service, 'toggleTableStatus').mockResolvedValue(mockUpdated);

      // Act: ejecutar el método del controlador
      const result = await controller.toggleTableStatus('zone-1', 'table-1', statusDto);

      // Assert: verificar que delegó extrayendo el status del DTO
      expect(service.toggleTableStatus).toHaveBeenCalledWith(
        'zone-1',
        'table-1',
        'OCCUPIED',
      );
      expect(result).toEqual(mockUpdated);
    });
  });
});
