import { SuccessResponseInterceptor } from './success-response.interceptor';
import { of } from 'rxjs';

describe('SuccessResponseInterceptor', () => {
  let interceptor: SuccessResponseInterceptor;

  beforeEach(() => {
    // Arrange: crear una nueva instancia del interceptor antes de cada test
    interceptor = new SuccessResponseInterceptor();
  });

  it('debería interceptar respuesta exitosa y envolverla en formato estándar', () => {
    // Arrange: preparar datos de respuesta y un CallHandler mockeado
    const responseData = { id: 1, name: 'Test Product' };
    const mockCallHandler = {
      handle: jest.fn().mockReturnValue(of(responseData)),
    };

    // Act: ejecutar el interceptor y suscribirse al resultado
    let result: any;
    interceptor.intercept(null as any, mockCallHandler).subscribe((value) => {
      result = value;
    });

    // Assert: verificar que la respuesta está envuelta correctamente
    expect(result).toEqual({
      data: responseData,
      success: true,
      message: 'Operation successful',
    });
  });

  it('debería usar el message por defecto "Operation successful"', () => {
    // Arrange: preparar datos simples
    const responseData = { message: 'Hello' };
    const mockCallHandler = {
      handle: jest.fn().mockReturnValue(of(responseData)),
    };

    // Act: ejecutar el interceptor
    let result: any;
    interceptor.intercept(null as any, mockCallHandler).subscribe((value) => {
      result = value;
    });

    // Assert: verificar que el message es el valor por defecto
    expect(result.message).toBe('Operation successful');
  });

  it('debería envolver un array de datos correctamente', () => {
    // Arrange: preparar un array como respuesta
    const responseData = [
      { id: 1, name: 'Product 1' },
      { id: 2, name: 'Product 2' },
    ];
    const mockCallHandler = {
      handle: jest.fn().mockReturnValue(of(responseData)),
    };

    // Act: ejecutar el interceptor
    let result: any;
    interceptor.intercept(null as any, mockCallHandler).subscribe((value) => {
      result = value;
    });

    // Assert: verificar que el array se envuelve como data
    expect(result.data).toEqual(responseData);
    expect(result.success).toBe(true);
  });

  it('debería envolver un valor null como data', () => {
    // Arrange: preparar null como respuesta (ej. DELETE exitoso)
    const mockCallHandler = {
      handle: jest.fn().mockReturnValue(of(null)),
    };

    // Act: ejecutar el interceptor
    let result: any;
    interceptor.intercept(null as any, mockCallHandler).subscribe((value) => {
      result = value;
    });

    // Assert: verificar que null se envuelve correctamente
    expect(result.data).toBeNull();
    expect(result.success).toBe(true);
  });

  it('debería envolver un string como data', () => {
    // Arrange: preparar un string como respuesta
    const responseData = 'Deleted successfully';
    const mockCallHandler = {
      handle: jest.fn().mockReturnValue(of(responseData)),
    };

    // Act: ejecutar el interceptor
    let result: any;
    interceptor.intercept(null as any, mockCallHandler).subscribe((value) => {
      result = value;
    });

    // Assert: verificar que el string se envuelve como data
    expect(result.data).toBe('Deleted successfully');
    expect(result.success).toBe(true);
  });
});
