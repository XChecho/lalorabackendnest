# Agent Guidelines for Lalora Backend

> Este archivo define las reglas, patrones y mejores prácticas que se deben seguir en el desarrollo del backend de Lalora.

---

## 1. Arquitectura y Estructura

### Stack Tecnológico

- **Framework**: NestJS (Node.js + TypeScript)
- **ORM**: Prisma 7.x con PostgreSQL
- **Contenedores**: Docker + Docker Compose
- **Logging**: Winston + Morgan + Correlation IDs
- **Autenticación**: JWT + Passport
- **Validación**: Class-validator + Class-transformer

### Estructura de Carpetas

```
src/
├── main.ts                    # Punto de entrada
├── app.module.ts              # Módulo raíz
├── auth/                      # Módulo de autenticación
│   ├── auth.module.ts
│   ├── dto/                   # Data Transfer Objects
│   ├── guards/
│   └── strategies/
├── common/                    # Código compartido
│   ├── decorators/
│   ├── filters/
│   ├── interceptors/
│   ├── logger/                # Sistema de logging centralizado
│   │   ├── winston.config.ts
│   │   ├── logger.service.ts
│   │   ├── logger.module.ts
│   │   ├── request-context.ts
│   │   ├── request-id.middleware.ts
│   │   └── http-logging.middleware.ts
└── [módulos]/                 # Nuevos módulos por feature
prisma/
├── schema.prisma              # Schema de base de datos
└── migrations/                # Migraciones (generadas automáticamente)
```

---

## 2. Reglas de Desarrollo

### 2.1 Validación de Datos (RTK - Request Type Validation)

TODOS los DTOs que representan entrada de datos (request bodies, query params) DEBEN usar decoradores de `class-validator`:

```typescript
import { IsEmail, IsString, MinLength, MaxLength } from 'class-validator';

export class CreateUserDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  password: string;

  @IsString()
  name: string;
}
```

**Reglas estrictas**:

- `@IsNotEmpty()` para campos requeridos
- `@IsOptional()` solo si el campo es verdaderamente opcional
- `@ValidateIf()` para validación condicional
- Usar `@Type()` para transformaciones (ej. `new Date()`)

### 2.2 Transformación de Datos

Siempre usar `class-transformer` con `@Type` para conversiones de tipo:

```typescript
import { Type } from 'class-transformer';

export class QueryParamsDto {
  @Type(() => Number)
  page: number;

  @Type(() => Date)
  dateFrom: Date;
}
```

### 2.3 Response Format

El `SuccessResponseInterceptor` envuelve todas las respuestas exitosas en:

```json
{
  "success": true,
  "data": { ... },
  "message": "Operation successful"
}
```

**NO** modificar esta estructura en controladores. Devolver directamente el dato.

### 2.4 Manejo de Errores

- TODOS los errores deben ser manejados por `GlobalExceptionFilter`
- Lanzar excepciones de NestJS (`BadRequestException`, `NotFoundException`, etc.)
- NO hacer `console.error` - usar `LoggerService` con método apropiado:
  - `logger.error()` para errores
  - `logger.warn()` para advertencias
  - `logger.debug()` para info de debug

### 2.5 Logging y Observabilidad

Cada request recibe:

- **Request ID** único (UUID) en header `X-Request-Id`
- Logs estructurados en JSON ( stdout )
- `response_time` automático
- **TODOS** los logs deben inyectar `LoggerService`:

```typescript
@Injectable()
export class UserService {
  constructor(private readonly logger: LoggerService) {}

  async findOne(id: string) {
    this.logger.debug(`Fetching user ${id}`, { userId: id });
    // ...
    this.logger.log(`User ${id} found`);
  }
}
```

### 2.6 Base de Datos y Prisma

**Reglas para el schema de Prisma**:

1. Cada modelo DEBE tener `createdAt` y `updatedAt`:
   ```prisma
   createdAt DateTime @default(now())
   updatedAt DateTime @updatedAt
   ```
2. IDs usan `@id @default(uuid())` (UUIDv4)
3. Campos soft-delete: `deletedAt DateTime?` (si aplica)
4. Enums para campos con valores predefinidos (ej. `Role`)
5. Relaciones explícitas con `@relation`

**Reglas para migraciones**:

- Cada cambio de schema = nueva migración con nombre descriptivo
- NO editar migraciones ya aplicadas en producción
- Migraciones se ejecutan manualmente: `npx prisma migrate dev --name <desc>`

### 2.7 Autenticación y Autorización

- Usar `@UseGuards(JwtAuthGuard)` en endpoints protegidos
- Usar `@Roles(ADMIN, CASHIER)` para autorización por rol
- El decorador `@CurrentUser()` inyecta el usuario autenticado
- Roles definidos en `prisma/schema.prisma` enum `Role`

### 2.8 Controllers

- Un controller por módulo/feature
- Rutas RESTful convencionales
- Usar `@Get()`, `@Post()`, `@Put()`, `@Delete()`, `@Patch()`
- Agrupación lógica de endpoints por recurso

### 2.9 Services

- Lógica de negocio en Services, no en Controllers
- Inyectar `PrismaService` (extiende `PrismaClient`) para acceso a BD
- Un Service por modelo/recurso

---

## 3. Docker y Desarrollo

### 3.1 Entorno de Desarrollo

```bash
# Iniciar servicios
docker compose up --build -d

# Ver logs
docker compose logs -f backend

# Ejecutar migración
docker compose exec backend npx prisma migrate dev --name <desc>

# Detener
docker compose down

# Detener + eliminar datos (CUIDADO)
docker compose down -v
```

### 3.2 Hot Reload

- Código fuente bind-mounteado en contenedor
- Cambios en `.ts` recargados automáticamente
- NO necesitas rebuild por cambios en código

### 3.3 Variables de Entorno

Usar `.env` (gitignored). Ver `.env.example` para variables requeridas.

### 3.4 Entornos de Base de Datos

| Entorno | Archivo | Base de datos | Puerto |
|---------|---------|---------------|--------|
| Desarrollo local | `.env` | Docker PostgreSQL | `localhost:5432` |
| Producción | `.env.production` | Supabase | URL de Supabase |

**Desarrollo local:**
```bash
docker compose up -d postgres    # Solo base de datos
npm run start:dev                # Backend local
```

**Producción con Supabase:**
```bash
cp .env.production.example .env.production
# Editar .env.production con credenciales de Supabase
./scripts/deploy-supabase.sh     # Migrar + deploy
```

### 3.5 DBeaver (Visualización de BD)

Conectar DBeaver a la base de datos local:
- Host: `localhost`
- Port: `5432`
- Database: `lalora_db`
- Username: `lalora`
- Password: `lalora_password_123`

---

## 4. Testing

### Framework
- **Unit tests**: Jest con `@nestjs/testing` y `ts-jest`.
- **E2E tests**: Jest con `supertest` y configuración en `test/jest-e2e.json`.
- **Mock de Prisma**: `src/__mocks__/prisma.mock.ts` — fábrica reutilizable para mockear PrismaService.

### Patrones de Testing
- **Services**: Mockear PrismaService y LoggerService. Probar lógica de negocio aislada.
- **Controllers**: Mockear el Service. Verificar que los parámetros de la request llegan correctamente.
- **E2E**: Montar la app NestJS en memoria con `Test.createTestingModule` + `createNestApplication()`.

### Convenciones
- Archivos: `*.spec.ts` para unitarios, `*.e2e-spec.ts` para E2E.
- Todos los tests deben incluir comentarios educativos en español explicando Arrange → Act → Assert.
- **TODO** nuevo feature debe tener tests asociados.

### Comandos
```bash
npm run test        # Ejecutar todos los tests unitarios
npm run test:watch  # Modo watch para desarrollo
npm run test:cov    # Tests con reporte de cobertura
npm run test:e2e    # Tests end-to-end
```

---

## 5. Commit Guidelines

Formato: `tipo(scope): descripción`

Tipos:

- `feat`: nueva funcionalidad
- `fix`: corrección de bug
- `docs`: cambios en documentación
- `style`: formato (sin cambio lógico)
- `refactor`: refactorización de código
- `test`: añadir tests
- `chore`: tareas de mantenimiento

Ejemplo: `feat(auth): add password reset endpoint`

---

## 6. Linting y Formato

```bash
npm run lint        # Linting con ESLint
npm run format      # Formatear con Prettier
```

Ambos deben pasar antes de commit.

---

## 7. Prohibiciones Estrictas

❌ NO committear `.env` con secrets
❌ NO hardcodear credenciales
❌ NO usar `console.log` - usar `LoggerService`
❌ NO modificar migraciones ya aplicadas en prod
❌ NO exponer passwords en respuestas
❌ NO usar `any` sin justificación (evitar `any` en tipos)

---

## 8. Flujo de Trabajo con Tablas

Para añadir una nueva tabla (modelo de Prisma):

1. **Definir schema** en `prisma/schema.prisma`:

   ```prisma
   model Product {
     id        String   @id @default(uuid())
     name      String
     price     Float
     createdAt DateTime @default(now())
   }
   ```

2. **Crear migración**:

   ```bash
   docker compose exec backend npx prisma migrate dev --name add_product_table
   ```

3. **Generar query builder** (Prisma Client ya está vinculado con hot reload):
   - No se necesita acción adicional, el cliente se regenera

4. **Crear módulo**:
   - `src/products/`
     - `products.module.ts`
     - `products.service.ts`
     - `products.controller.ts`
     - `dto/create-product.dto.ts`
     - `dto/update-product.dto.ts`

5. **Usar en endpoints**:
   - Inyectar `PrismaService` en service
   - CRUD básico: `prisma.product.findMany()`, `create()`, `update()`, `delete()`

6. **Commit**:

   ```
   feat(products): add product management

   - Add Product model to Prisma schema
   - Create migration 20260418_add_product_table
   - Implement Products module with CRUD endpoints
   ```

---

## 9. Revisión de Código (Code Review)

Antes de hacer push:

- [ ] Lint passing (`npm run lint`)
- [ ] Build passing (`npm run build`)
- [ ] Tests passing (si existen)
- [ ] Logs apropiados en servicios
- [ ] Validaciones en DTOs
- [ ] Migración de Prisma creada (si hay cambios de BD)
- [ ] `.env.example` actualizado (si nuevas variables)

---

**Última actualización**: 2026-05-01
