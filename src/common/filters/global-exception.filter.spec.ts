import { GlobalExceptionFilter } from './global-exception.filter';
import {
  BadRequestException,
  UnauthorizedException,
  ForbiddenException,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';

describe('GlobalExceptionFilter', () => {
  let filter: GlobalExceptionFilter;
  let mockResponse: any;
  let mockHost: any;

  beforeEach(() => {
    // Arrange: crear el filter y mockear response/host antes de cada test
    filter = new GlobalExceptionFilter();
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    mockHost = {
      switchToHttp: jest.fn().mockReturnValue({
        getResponse: () => mockResponse,
      }),
    };
  });

  it('debería manejar BadRequestException (400) con mensaje string', () => {
    // Arrange: crear una excepción 400 con mensaje simple
    const exception = new BadRequestException('Invalid input');

    // Act: ejecutar el filter con la excepción
    filter.catch(exception, mockHost);

    // Assert: verificar que se responde con status 400 y formato correcto
    expect(mockResponse.status).toHaveBeenCalledWith(400);
    expect(mockResponse.json).toHaveBeenCalledWith({
      data: null,
      success: false,
      message: 'Invalid input',
      errors: undefined,
    });
  });

  it('debería manejar UnauthorizedException (401)', () => {
    // Arrange: crear una excepción 401
    const exception = new UnauthorizedException('Unauthorized');

    // Act: ejecutar el filter
    filter.catch(exception, mockHost);

    // Assert: verificar status 401
    expect(mockResponse.status).toHaveBeenCalledWith(401);
    expect(mockResponse.json).toHaveBeenCalledWith({
      data: null,
      success: false,
      message: 'Unauthorized',
      errors: undefined,
    });
  });

  it('debería manejar ForbiddenException (403)', () => {
    // Arrange: crear una excepción 403
    const exception = new ForbiddenException('Access denied');

    // Act: ejecutar el filter
    filter.catch(exception, mockHost);

    // Assert: verificar status 403
    expect(mockResponse.status).toHaveBeenCalledWith(403);
    expect(mockResponse.json).toHaveBeenCalledWith({
      data: null,
      success: false,
      message: 'Access denied',
      errors: undefined,
    });
  });

  it('debería manejar NotFoundException (404)', () => {
    // Arrange: crear una excepción 404
    const exception = new NotFoundException('Resource not found');

    // Act: ejecutar el filter
    filter.catch(exception, mockHost);

    // Assert: verificar status 404
    expect(mockResponse.status).toHaveBeenCalledWith(404);
    expect(mockResponse.json).toHaveBeenCalledWith({
      data: null,
      success: false,
      message: 'Resource not found',
      errors: undefined,
    });
  });

  it('debería manejar errores genéricos como 500 Internal Server Error', () => {
    // Arrange: crear un error genérico no-HttpException
    const exception = new Error('Something went wrong');

    // Act: ejecutar el filter
    filter.catch(exception, mockHost);

    // Assert: verificar que se trata como 500 con mensaje genérico
    expect(mockResponse.status).toHaveBeenCalledWith(500);
    expect(mockResponse.json).toHaveBeenCalledWith({
      data: null,
      success: false,
      message: 'Internal server error',
      errors: undefined,
    });
  });

  it('debería manejar errores de validación con array de errores', () => {
    // Arrange: crear una BadRequestException con array de errores de validación
    const validationErrors = [
      'email must be an email',
      'password must be longer than 8 characters',
    ];
    const exception = new BadRequestException({
      message: validationErrors,
      error: 'Bad Request',
      statusCode: 400,
    });

    // Act: ejecutar el filter
    filter.catch(exception, mockHost);

    // Assert: verificar que los errores se extraen como array y el message es la concatenación
    expect(mockResponse.status).toHaveBeenCalledWith(400);
    expect(mockResponse.json).toHaveBeenCalledWith({
      data: null,
      success: false,
      message:
        'email must be an email, password must be longer than 8 characters',
      errors: validationErrors,
    });
  });

  it('debería manejar HttpException con respuesta como string', () => {
    // Arrange: crear una excepción con respuesta string
    const exception = new BadRequestException('Bad request string');

    // Act: ejecutar el filter
    filter.catch(exception, mockHost);

    // Assert: verificar que el string se usa como message
    expect(mockResponse.status).toHaveBeenCalledWith(400);
    expect(mockResponse.json).toHaveBeenCalledWith({
      data: null,
      success: false,
      message: 'Bad request string',
      errors: undefined,
    });
  });

  it('debería manejar InternalServerErrorException (500)', () => {
    // Arrange: crear una excepción 500 explícita
    const exception = new InternalServerErrorException('Database error');

    // Act: ejecutar el filter
    filter.catch(exception, mockHost);

    // Assert: verificar status 500 con mensaje personalizado
    expect(mockResponse.status).toHaveBeenCalledWith(500);
    expect(mockResponse.json).toHaveBeenCalledWith({
      data: null,
      success: false,
      message: 'Database error',
      errors: undefined,
    });
  });

  it('debería manejar un valor no-Error genérico (número)', () => {
    // Arrange: lanzar un valor que no es Error ni HttpException
    const exception = 42;

    // Act: ejecutar el filter
    filter.catch(exception, mockHost);

    // Assert: verificar que se trata como 500 con mensaje por defecto
    expect(mockResponse.status).toHaveBeenCalledWith(500);
    expect(mockResponse.json).toHaveBeenCalledWith({
      data: null,
      success: false,
      message: 'Internal server error',
      errors: undefined,
    });
  });

  it('debería manejar HttpException con mensaje como objeto con campo message string', () => {
    // Arrange: crear excepción con respuesta objeto que tiene message string
    const exception = new BadRequestException({
      message: 'Custom validation error',
      statusCode: 400,
    });

    // Act: ejecutar el filter
    filter.catch(exception, mockHost);

    // Assert: verificar que extrae el message del objeto
    expect(mockResponse.status).toHaveBeenCalledWith(400);
    expect(mockResponse.json).toHaveBeenCalledWith({
      data: null,
      success: false,
      message: 'Custom validation error',
      errors: undefined,
    });
  });
});
