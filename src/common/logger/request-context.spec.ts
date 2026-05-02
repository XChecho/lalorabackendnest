import {
  requestContext,
  getRequestContext,
  setRequestContextValue,
} from './request-context';

describe('RequestContext', () => {
  beforeEach(() => {
    // No hay necesidad de limpiar ya que AsyncLocalStorage
    // maneja el contexto por ejecución async
  });

  it('debería retornar undefined cuando no hay contexto activo', () => {
    // Arrange: no hay contexto activo (fuera de requestContext.run)

    // Act: intentar obtener el contexto
    const context = getRequestContext();

    // Assert: verificar que retorna undefined
    expect(context).toBeUndefined();
  });

  it('debería almacenar y recuperar contexto dentro de requestContext.run', () => {
    // Arrange: preparar datos de contexto
    const contextData = {
      requestId: 'req-123',
      startTime: Date.now(),
      method: 'GET',
      url: '/api/users',
      ip: '127.0.0.1',
      userAgent: 'Mozilla/5.0',
    };

    // Act: ejecutar dentro del contexto async
    let retrievedContext: any;
    requestContext.run(contextData, () => {
      retrievedContext = getRequestContext();
    });

    // Assert: verificar que el contexto se recupera correctamente
    expect(retrievedContext).toEqual(contextData);
  });

  it('debería obtener el request ID desde el contexto', () => {
    // Arrange: preparar contexto con requestId
    const contextData = {
      requestId: 'req-456',
      startTime: Date.now(),
      method: 'POST',
      url: '/api/orders',
    };

    // Act: ejecutar dentro del contexto y extraer requestId
    let requestId: string | undefined;
    requestContext.run(contextData, () => {
      const ctx = getRequestContext();
      requestId = ctx?.requestId;
    });

    // Assert: verificar que el requestId es correcto
    expect(requestId).toBe('req-456');
  });

  it('debería actualizar un valor en el contexto con setRequestContextValue', () => {
    // Arrange: preparar contexto inicial
    const contextData = {
      requestId: 'req-789',
      startTime: Date.now(),
      method: 'GET',
      url: '/api/products',
    };

    // Act: modificar el contexto dentro de la ejecución async
    requestContext.run(contextData, () => {
      setRequestContextValue('userId', 'user-001');
    });

    // Assert: verificar que el valor se actualizó
    expect(contextData).toHaveProperty('userId', 'user-001');
  });

  it('debería permitir agregar campos custom al contexto', () => {
    // Arrange: preparar contexto básico
    const contextData = {
      requestId: 'req-custom',
      startTime: Date.now(),
      method: 'PUT',
      url: '/api/users/1',
    };

    // Act: agregar múltiples campos custom
    requestContext.run(contextData, () => {
      setRequestContextValue('tenantId', 'tenant-abc');
      setRequestContextValue('sessionId', 'session-xyz');
      const ctx = getRequestContext();
      // Assert: verificar que los campos custom están presentes
      expect(ctx?.tenantId).toBe('tenant-abc');
      expect(ctx?.sessionId).toBe('session-xyz');
    });
  });

  it('debería mantener contextos separados en ejecuciones async diferentes', () => {
    // Arrange: preparar dos contextos diferentes
    const contextA = {
      requestId: 'req-A',
      startTime: Date.now(),
      method: 'GET',
      url: '/api/a',
    };
    const contextB = {
      requestId: 'req-B',
      startTime: Date.now(),
      method: 'GET',
      url: '/api/b',
    };

    // Act: ejecutar ambos contextos y capturar resultados
    let resultA: any;
    let resultB: any;

    const promiseA = requestContext.run(contextA, async () => {
      await new Promise((resolve) => setTimeout(resolve, 10));
      resultA = getRequestContext();
    });

    const promiseB = requestContext.run(contextB, async () => {
      resultB = getRequestContext();
    });

    return Promise.all([promiseA, promiseB]).then(() => {
      // Assert: verificar que cada contexto mantiene su propio requestId
      expect(resultA?.requestId).toBe('req-A');
      expect(resultB?.requestId).toBe('req-B');
    });
  });

  it('debería no modificar el contexto si se llama setRequestContextValue fuera de run', () => {
    // Arrange: no hay contexto activo

    // Act: intentar setear un valor fuera de contexto
    setRequestContextValue('orphanKey', 'orphanValue');

    // Assert: no hay error, simplemente no hace nada
    // getRequestContext retorna undefined fuera de run
    expect(getRequestContext()).toBeUndefined();
  });

  it('debería incluir campos opcionales ip y userAgent', () => {
    // Arrange: preparar contexto con campos opcionales
    const contextData = {
      requestId: 'req-full',
      startTime: Date.now(),
      method: 'DELETE',
      url: '/api/products/5',
      ip: '192.168.1.100',
      userAgent: 'TestAgent/1.0',
    };

    // Act: recuperar contexto
    let retrieved: any;
    requestContext.run(contextData, () => {
      retrieved = getRequestContext();
    });

    // Assert: verificar campos opcionales
    expect(retrieved?.ip).toBe('192.168.1.100');
    expect(retrieved?.userAgent).toBe('TestAgent/1.0');
  });
});
