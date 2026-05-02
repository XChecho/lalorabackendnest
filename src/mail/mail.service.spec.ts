import { Test, TestingModule } from '@nestjs/testing';
import { MailService } from './mail.service';
import { LoggerService } from '../common/logger/logger.service';

describe('MailService', () => {
  let service: MailService;
  let mockLogger: jest.Mocked<LoggerService>;

  beforeEach(async () => {
    // Arrange: crear mock del LoggerService y configurar el módulo
    mockLogger = {
      log: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn(),
      verbose: jest.fn(),
      setContext: jest.fn(),
    } as unknown as jest.Mocked<LoggerService>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MailService,
        { provide: LoggerService, useValue: mockLogger },
      ],
    }).compile();

    service = module.get<MailService>(MailService);
  });

  it('debería estar definido', () => {
    // Assert: verificar que el servicio se instancia
    expect(service).toBeDefined();
  });

  it('debería enviar email con código de recuperación', async () => {
    // Arrange: preparar email y código
    const email = 'test@example.com';
    const code = 'ABC123';

    // Act: llamar al método sendRecoverCode
    const result = await service.sendRecoverCode(email, code);

    // Assert: verificar que retorna true y loguea la acción
    expect(result).toBe(true);
    expect(mockLogger.log).toHaveBeenCalledWith('Sending recover code', {
      email,
    });
  });

  it('debería loguear el email correcto al enviar código', async () => {
    // Arrange: preparar datos de prueba
    const email = 'usuario@restaurante.com';
    const code = '999888';

    // Act: ejecutar el envío
    await service.sendRecoverCode(email, code);

    // Assert: verificar que el logger recibe el email exacto
    expect(mockLogger.log).toHaveBeenCalledWith('Sending recover code', {
      email: 'usuario@restaurante.com',
    });
  });

  it('debería manejar emails con caracteres especiales', async () => {
    // Arrange: email con caracteres especiales
    const email = 'usuario+tag@sub.domain.com';
    const code = 'XYZ789';

    // Act: ejecutar el envío
    const result = await service.sendRecoverCode(email, code);

    // Assert: verificar que se procesa correctamente
    expect(result).toBe(true);
    expect(mockLogger.log).toHaveBeenCalledWith('Sending recover code', {
      email: 'usuario+tag@sub.domain.com',
    });
  });
});
