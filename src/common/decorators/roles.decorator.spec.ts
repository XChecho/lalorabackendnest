import { Roles } from './roles.decorator';
import { Reflector } from '@nestjs/core';

describe('Roles Decorator', () => {
  it('debería setear metadata con los roles proporcionados', () => {
    // Arrange: definir roles a asignar
    const roles = ['ADMIN', 'CASHIER'];

    // Act: ejecutar el decorator para obtener el metadata factory
    const decorator = Roles(...roles);

    // Assert: verificar que el decorator está configurado correctamente
    // El decorator de NestJS usa SetMetadata internamente, verificamos
    // que se puede recuperar con Reflector
    expect(decorator).toBeDefined();
    expect(typeof decorator).toBe('function');
  });

  it('debería permitir recuperar roles desde el contexto con Reflector', () => {
    // Arrange: crear un Reflector y definir roles
    const reflector = new Reflector();
    const roles = ['ADMIN', 'WAITER', 'KITCHEN'];

    // Act: usar el decorator en una clase mock y recuperar los roles
    class MockController {
      @Roles(...roles)
      handleRequest() {}
    }

    const retrievedRoles = reflector.get<string[]>(
      'roles',
      MockController.prototype.handleRequest,
    );

    // Assert: verificar que los roles recuperados coinciden con los definidos
    expect(retrievedRoles).toEqual(['ADMIN', 'WAITER', 'KITCHEN']);
  });

  it('debería funcionar con un solo rol', () => {
    // Arrange: definir un único rol
    const reflector = new Reflector();

    // Act: aplicar decorator con un solo rol
    class MockController {
      @Roles('ADMIN')
      handleRequest() {}
    }

    const retrievedRoles = reflector.get<string[]>(
      'roles',
      MockController.prototype.handleRequest,
    );

    // Assert: verificar que el array contiene un solo elemento
    expect(retrievedRoles).toEqual(['ADMIN']);
  });

  it('debería funcionar sin roles (array vacío)', () => {
    // Arrange: llamar al decorator sin argumentos
    const reflector = new Reflector();

    // Act: aplicar decorator sin roles
    class MockController {
      @Roles()
      handleRequest() {}
    }

    const retrievedRoles = reflector.get<string[]>(
      'roles',
      MockController.prototype.handleRequest,
    );

    // Assert: verificar que retorna array vacío
    expect(retrievedRoles).toEqual([]);
  });

  it('debería permitir roles personalizados no estándar', () => {
    // Arrange: definir roles personalizados
    const reflector = new Reflector();
    const customRoles = ['SUPER_ADMIN', 'REGIONAL_MANAGER'];

    // Act: aplicar decorator con roles custom
    class MockController {
      @Roles(...customRoles)
      handleRequest() {}
    }

    const retrievedRoles = reflector.get<string[]>(
      'roles',
      MockController.prototype.handleRequest,
    );

    // Assert: verificar que los roles custom se guardan correctamente
    expect(retrievedRoles).toEqual(['SUPER_ADMIN', 'REGIONAL_MANAGER']);
  });
});
