import { Test, TestingModule } from '@nestjs/testing';
import { AdminTablesController } from './admin-tables.controller';
import { AdminTablesService } from './admin-tables.service';
import { UpdateTableDto, ToggleTableStatusDto } from '../admin-zones/dto';

describe('AdminTablesController', () => {
  let controller: AdminTablesController;
  let service: AdminTablesService;

  beforeEach(async () => {
    // Arrange: configurar módulo de testing con mock del servicio
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AdminTablesController],
      providers: [
        {
          provide: AdminTablesService,
          useValue: {
            findAll: jest.fn(),
            findById: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            updateStatus: jest.fn(),
            delete: jest.fn(),
            findByZone: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<AdminTablesController>(AdminTablesController);
    service = module.get<AdminTablesService>(AdminTablesService);
  });

  describe('GET /admin/tables', () => {
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

      // Assert: verificar que delegó al servicio
      expect(service.findAll).toHaveBeenCalled();
      expect(result).toEqual(mockTables);
    });
  });

  describe('GET /admin/tables/:id', () => {
    it('debería delegar al servicio para obtener una mesa por ID', async () => {
      // Arrange: preparar datos mock
      const mockTable = {
        id: 'table-1',
        name: 'Mesa 01',
        capacity: 4,
        status: 'AVAILABLE',
        zone: { id: 'zone-1', name: 'Terraza' },
      };
      jest.spyOn(service, 'findById').mockResolvedValue(mockTable);

      // Act: ejecutar el método del controlador
      const result = await controller.findOne('table-1');

      // Assert: verificar que delegó con el ID correcto
      expect(service.findById).toHaveBeenCalledWith('table-1');
      expect(result).toEqual(mockTable);
    });
  });

  describe('POST /admin/tables', () => {
    it('debería delegar al servicio para crear una mesa nueva', async () => {
      // Arrange: preparar DTO y mock
      const createTableDto = {
        zoneId: 'zone-1',
        name: 'Mesa 01',
        capacity: 4,
      };
      const mockCreated = {
        id: 'table-new',
        name: 'Mesa 01',
        capacity: 4,
        zoneId: 'zone-1',
        status: 'AVAILABLE',
      };
      jest.spyOn(service, 'create').mockResolvedValue(mockCreated);

      // Act: ejecutar el método del controlador
      const result = await controller.create(createTableDto);

      // Assert: verificar que delegó con el DTO correcto
      expect(service.create).toHaveBeenCalledWith(createTableDto);
      expect(result).toEqual(mockCreated);
    });
  });

  describe('PUT /admin/tables/:id', () => {
    it('debería delegar al servicio para actualizar una mesa', async () => {
      // Arrange: preparar DTO y mock
      const updateTableDto: UpdateTableDto = {
        name: 'Mesa VIP',
        capacity: 8,
      };
      const mockUpdated = {
        id: 'table-1',
        name: 'Mesa VIP',
        capacity: 8,
        status: 'AVAILABLE',
      };
      jest.spyOn(service, 'update').mockResolvedValue(mockUpdated);

      // Act: ejecutar el método del controlador
      const result = await controller.update('table-1', updateTableDto);

      // Assert: verificar que delegó con los parámetros correctos
      expect(service.update).toHaveBeenCalledWith('table-1', updateTableDto);
      expect(result).toEqual(mockUpdated);
    });
  });

  describe('PUT /admin/tables/:id/status', () => {
    it('debería delegar al servicio para actualizar el estado de una mesa', async () => {
      // Arrange: preparar DTO y mock
      const statusDto: ToggleTableStatusDto = { status: 'OCCUPIED' };
      const mockUpdated = {
        id: 'table-1',
        name: 'Mesa 01',
        capacity: 4,
        status: 'OCCUPIED',
      };
      jest.spyOn(service, 'updateStatus').mockResolvedValue(mockUpdated);

      // Act: ejecutar el método del controlador
      const result = await controller.updateStatus('table-1', statusDto);

      // Assert: verificar que delegó extrayendo el status del DTO
      expect(service.updateStatus).toHaveBeenCalledWith('table-1', 'OCCUPIED');
      expect(result).toEqual(mockUpdated);
    });
  });

  describe('DELETE /admin/tables/:id', () => {
    it('debería delegar al servicio para eliminar una mesa', async () => {
      // Arrange: preparar mock
      const mockDeleted = { id: 'table-1', name: 'Mesa 01' };
      jest.spyOn(service, 'delete').mockResolvedValue(mockDeleted);

      // Act: ejecutar el método del controlador
      const result = await controller.delete('table-1');

      // Assert: verificar que delegó con el ID correcto
      expect(service.delete).toHaveBeenCalledWith('table-1');
      expect(result).toEqual(mockDeleted);
    });
  });

  describe('GET /admin/tables/zone/:zoneId', () => {
    it('debería delegar al servicio para listar mesas por zona', async () => {
      // Arrange: preparar datos mock
      const mockTables = [
        { id: 'table-1', name: 'Mesa 01', capacity: 4, zoneId: 'zone-1' },
        { id: 'table-2', name: 'Mesa 02', capacity: 2, zoneId: 'zone-1' },
      ];
      jest.spyOn(service, 'findByZone').mockResolvedValue(mockTables);

      // Act: ejecutar el método del controlador
      const result = await controller.findByZone('zone-1');

      // Assert: verificar que delegó con el zoneId correcto
      expect(service.findByZone).toHaveBeenCalledWith('zone-1');
      expect(result).toEqual(mockTables);
    });
  });
});
