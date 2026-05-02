import { Test, TestingModule } from '@nestjs/testing';
import { LoggerService, createLogger } from './logger.service';

// Mock del logger de winston
jest.mock('./winston.config', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
    silly: jest.fn(),
  },
}));

// Importar el mock después de mockear
import { logger as winstonLogger } from './winston.config';

describe('LoggerService', () => {
  let service: LoggerService;

  beforeEach(async () => {
    // Arrange: configurar módulo de testing y limpiar mocks
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [LoggerService],
    }).compile();

    service = module.get<LoggerService>(LoggerService);
  });

  it('debería estar definido', () => {
    // Assert: verificar que el servicio se instancia correctamente
    expect(service).toBeDefined();
  });

  it('debería registrar un mensaje de info con log()', () => {
    // Arrange: preparar mensaje y contexto
    const message = 'Usuario creado exitosamente';

    // Act: llamar al método log
    service.log(message);

    // Assert: verificar que winston.info fue llamado con el mensaje y metadata
    expect(winstonLogger.info).toHaveBeenCalledWith(message, {
      context: 'Application',
    });
  });

  it('debería registrar un mensaje de info con metadata adicional', () => {
    // Arrange: preparar mensaje con metadata
    const message = 'Orden procesada';
    const meta = { orderId: '123', total: 50.0 };

    // Act: llamar a log con objeto de metadata
    service.log(message, meta);

    // Assert: verificar que la metadata se pasa correctamente
    expect(winstonLogger.info).toHaveBeenCalledWith(message, {
      context: 'Application',
      orderId: '123',
      total: 50.0,
    });
  });

  it('debería registrar un mensaje de error con error()', () => {
    // Arrange: preparar mensaje de error
    const message = 'Error al conectar con la base de datos';

    // Act: llamar al método error
    service.error(message);

    // Assert: verificar que winston.error fue llamado
    expect(winstonLogger.error).toHaveBeenCalledWith(message, {
      context: 'Application',
    });
  });

  it('debería registrar un error con stack trace', () => {
    // Arrange: preparar error con stack
    const message = 'Fallo crítico';
    const error = new Error('Connection refused');

    // Act: llamar a error con objeto de error
    service.error(message, { error });

    // Assert: verificar que el error se incluye en la metadata
    expect(winstonLogger.error).toHaveBeenCalledWith(message, {
      context: 'Application',
      error,
    });
  });

  it('debería registrar una advertencia con warn()', () => {
    // Arrange: preparar mensaje de advertencia
    const message = 'Intento de login fallido';

    // Act: llamar al método warn
    service.warn(message);

    // Assert: verificar que winston.warn fue llamado
    expect(winstonLogger.warn).toHaveBeenCalledWith(message, {
      context: 'Application',
    });
  });

  it('debería registrar un mensaje de debug con debug()', () => {
    // Arrange: preparar mensaje de debug
    const message = 'Query ejecutada en 50ms';

    // Act: llamar al método debug
    service.debug(message);

    // Assert: verificar que winston.debug fue llamado
    expect(winstonLogger.debug).toHaveBeenCalledWith(message, {
      context: 'Application',
    });
  });

  it('debería registrar un mensaje verbose con verbose()', () => {
    // Arrange: preparar mensaje verbose
    const message = 'Detalle adicional de ejecución';

    // Act: llamar al método verbose
    service.verbose(message);

    // Assert: verificar que winston.silly fue llamado (verbose mapea a silly)
    expect(winstonLogger.silly).toHaveBeenCalledWith(message, {
      context: 'Application',
    });
  });

  it('debería cambiar el contexto con setContext()', () => {
    // Arrange: preparar nuevo contexto
    const newContext = 'UserService';

    // Act: cambiar el contexto y registrar un mensaje
    service.setContext(newContext);
    service.log('Mensaje con contexto personalizado');

    // Assert: verificar que el nuevo contexto se usa en el log
    expect(winstonLogger.info).toHaveBeenCalledWith(
      'Mensaje con contexto personalizado',
      {
        context: 'UserService',
      },
    );
  });

  it('debería manejar argumentos extra como array cuando no son objetos', () => {
    // Arrange: preparar argumentos simples
    const message = 'Procesando datos';

    // Act: llamar con argumentos primitivos
    service.log(message, 'arg1', 'arg2');

    // Assert: verificar que los argumentos se agrupan en "extra"
    expect(winstonLogger.info).toHaveBeenCalledWith(message, {
      context: 'Application',
      extra: ['arg1', 'arg2'],
    });
  });

  it('debería manejar objeto metadata con argumentos extra adicionales', () => {
    // Arrange: preparar metadata + args extra
    const message = 'Evento registrado';
    const meta = { eventId: 'evt-1' };

    // Act: llamar con objeto metadata y args adicionales
    service.log(message, meta, 'extra1');

    // Assert: verificar que los args extra se agrupan en "extra" dentro de la metadata
    expect(winstonLogger.info).toHaveBeenCalledWith(message, {
      context: 'Application',
      eventId: 'evt-1',
      extra: ['extra1'],
    });
  });
});

describe('createLogger', () => {
  beforeEach(() => {
    // Limpiar mocks antes de cada test
    jest.clearAllMocks();
  });

  it('debería crear un logger con contexto personalizado', () => {
    // Arrange: crear logger con contexto específico
    const logger = createLogger('AuthService');

    // Act: usar el logger
    logger.log('Login attempt');

    // Assert: verificar que usa el contexto correcto
    expect(winstonLogger.info).toHaveBeenCalledWith('Login attempt', {
      context: 'AuthService',
    });
  });

  it('debería permitir cambiar el contexto del logger creado', () => {
    // Arrange: crear logger y cambiar contexto
    const logger = createLogger('Inicial');
    logger.setContext('NuevoContexto');

    // Act: registrar mensaje
    logger.log('Mensaje con nuevo contexto');

    // Assert: verificar que usa el nuevo contexto
    expect(winstonLogger.info).toHaveBeenCalledWith(
      'Mensaje con nuevo contexto',
      {
        context: 'NuevoContexto',
      },
    );
  });

  it('debería exponer todos los métodos de logging', () => {
    // Arrange: crear logger
    const logger = createLogger('TestContext');

    // Act: llamar a cada método
    logger.log('info');
    logger.error('error');
    logger.warn('warn');
    logger.debug('debug');
    logger.verbose('verbose');

    // Assert: verificar que cada método llama al winston correspondiente
    expect(winstonLogger.info).toHaveBeenCalledWith('info', {
      context: 'TestContext',
    });
    expect(winstonLogger.error).toHaveBeenCalledWith('error', {
      context: 'TestContext',
    });
    expect(winstonLogger.warn).toHaveBeenCalledWith('warn', {
      context: 'TestContext',
    });
    expect(winstonLogger.debug).toHaveBeenCalledWith('debug', {
      context: 'TestContext',
    });
    expect(winstonLogger.silly).toHaveBeenCalledWith('verbose', {
      context: 'TestContext',
    });
  });
});
