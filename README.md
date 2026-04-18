<div align="center">

# Lalora Backend

**API RESTful para sistema de gestión de restaurantes/negocio**

[![NestJS](https://img.shields.io/badge/NestJS-EA5800?style=flat&logo=nestjs&logoColor=white)](https://nestjs.com/)
[![Prisma](https://img.shields.io/badge/Prisma-0C344B?style=flat&logo=prisma&logoColor=white)](https://prisma.io)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=flat&logo=postgresql&logoColor=white)](https://postgresql.org)
[![Docker](https://img.shields.io/badge/Docker-2496ED?style=flat&logo=docker&logoColor=white)](https://docker.com)
[![Winston](https://img.shields.io/badge/Winston-4A4A4A?style=flat&logo=javascript&logoColor=white)](https://github.com/winstonjs/winston)

</div>

---

## 📋 Descripción

Backend API construido con **NestJS** y **TypeScript** para el sistema **Lalora**, un restaurante/negocio que requiere gestión de usuarios, mesas, pedidos, y más.

El proyecto está completamente dockerizado con **PostgreSQL 16** para base de datos y un sistema de **logging estructurado** con Winston para trazabilidad completa de todas las operaciones.

---

## 🚀 Características

- **Arquitectura modular**: Patrón por features, escalable y mantenible
- **Autenticación JWT**: Login, registro, guards por roles
- **Roles de usuario**: ADMIN, CASHIER, KITCHEN, WAITRESS, CANCHA_MANAGER
- **Base de datos PostgreSQL**: Con Prisma ORM, migrations versionadas
- **Logging completo**: Cada request tracked con request ID único
- **Hot reload**: Desarrollo rápido sin rebuilds
- **Contenedores Docker**: Setup reproducible en cualquier entorno
- **Validación robusta**: class-validator + class-transformer
- **API documentada**: Swagger disponible en `/api`

---

## 🛠️ Stack Tecnológico

| Tecnología       | Versión | Propósito         |
| ---------------- | ------- | ----------------- |
| NestJS           | 11.x    | Framework backend |
| TypeScript       | 5.x     | Lenguaje          |
| Prisma           | 7.x     | ORM / Migrations  |
| PostgreSQL       | 16      | Base de datos     |
| Docker + Compose | -       | Contenedores      |
| Winston          | -       | Logging           |
| Morgan           | -       | HTTP request logs |
| Passport + JWT   | -       | Auth              |
| Swagger          | -       | API docs          |

---

## 📁 Estructura del Proyecto

```
lalorabackendnest/
├── src/
│   ├── common/
│   │   ├── decorators/     # @Roles(), @CurrentUser()
│   │   ├── filters/         # Global exception filter
│   │   ├── interceptors/    # Success response wrapper
│   │   └── logger/          # Sistema de logging central
│   │       ├── winston.config.ts    # Config Winston
│   │       ├── logger.service.ts    # Implementación Nest Logger
│   │       ├── request-context.ts   # Async Context per request
│   │       ├── request-id.middleware.ts  # Genera UUID por request
│   │       └── http-logging.middleware.ts # Morgan → Winston
│   ├── auth/                # Módulo autenticación
│   │   ├── guards/          # JwtAuthGuard, RolesGuard
│   │   ├── strategies/      # JwtStrategy
│   │   └── dto/             # LoginDto, etc.
│   ├── app.controller.ts
│   ├── app.module.ts
│   └── main.ts              # Bootstrap + middleware
├── prisma/
│   ├── schema.prisma        # Schema de BD
│   └── migrations/          # Migraciones versionadas
├── docker-compose.yml       # PostgreSQL + Backend
├── Dockerfile               # Imagen backend
├── entrypoint.sh            # Script inicio (wait DB + dev server)
├── .env                     # Variables (NO committear)
├── .env.example             # Template de variables
└── package.json
```

---

## 🐳 Quick Start (Docker)

### Requisitos previos

- [Docker](https://docs.docker.com/get-docker/) + [Docker Compose](https://docs.docker.com/compose/install/)
- Node.js 20+ (opcional, para desarrollo fuera de Docker)

### 1. Clonar y configurar entorno

```bash
git clone https://github.com/XChecho/lalorabackendnest.git
cd lalorabackendnest

# Copiar template de variables de entorno
cp .env.example .env

# Editar .env con tus valores (al menos DATABASE_PASSWORD y JWT_SECRET)
nano .env  # o usa tu editor favorito
```

### 2. Iniciar servicios

```bash
# Build de imágenes y arranque en background
docker compose up --build -d

# Ver logs en tiempo real
docker compose logs -f backend

# Esperar a que diga "Nest application successfully started"
```

### 3. Aplicar migración inicial

```bash
# Primera vez only
docker compose exec backend npx prisma migrate dev --name init
```

### 4. Verificar que funciona

```bash
# Health check
curl http://localhost:3000/

# Respuesta esperada:
# {"data":"Hello World!","success":true,"message":"Operation successful"}
```

### 5. Acceder a la API

- **Swagger UI**: http://localhost:3000/api
- **Base URL**: `http://localhost:3000`

---

## 🔧 Desarrollo

### Trabajar con código (hot reload)

El contenedor tiene bind-mount del source code. Cualquier cambio en `/src` se recarga automáticamente.

```bash
# Editar archivos en tu editor favorito
code src/auth/auth.module.ts

# Los cambios se reflejan en ~1s en el contenedor
# Revisar logs: docker compose logs -f backend
```

### Ejecutar migraciones de Prisma

Cuando modifiques `prisma/schema.prisma`:

```bash
# Dentro del contenedor backend
docker compose exec backend npx prisma migrate dev --name descripcion_cambio

# Los archivos de migración se guardan en prisma/migrations/
# Commit esos archivos a git
```

### Ver base de datos

```bash
# Conectar a psql desde host (exposed en puerto 5432)
psql -h localhost -U $DATABASE_USER -d $DATABASE_NAME

# O dentro del contenedor
docker compose exec postgres psql -U $DATABASE_USER -d $DATABASE_NAME

# Listar tablas
\dt
```

### Prisma Studio (GUI visual)

```bash
docker compose exec backend npx prisma studio --host 0.0.0.0
# Abre http://localhost:5555 en tu navegador
```

### Logs de la aplicación

```bash
# Todos los servicios
docker compose logs -f

# Solo backend
docker compose logs -f backend

# Solo PostgreSQL
docker compose logs -f postgres

# Buscar errores
docker compose logs backend | grep -i error

# Últimas 50 líneas
docker compose logs --tail=50 backend
```

---

## 🗄️ Base de Datos

### Schema actual

**User** (usuarios del sistema):

- `id` (UUID)
- `email` (unique)
- `password` (hash)
- `name`
- `role` (enum: ADMIN, CASHIER, KITCHEN, WAITRESS, CANCHA_MANAGER)
- `active` (boolean)
- `createdAt`, `updatedAt`

### Próximas tablas (sugerencia)

- `Table` - Mesas del restaurante
- `Category` - Categorías de productos
- `Product` - Menú
- `Order` - Pedidos
- `OrderItem` - Ítems de pedido
- `Invoice` - Facturas
- `Payment` - Pagos

---

## 🔐 Autenticación y Roles

### Flujo de login

```http
POST /auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

Respuesta:

```json
{
  "success": true,
  "data": {
    "access_token": "eyJhbGciOiJIUzI1NiIs...",
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "role": "WAITRESS"
    }
  }
}
```

### Uso del token

```http
GET /api/protected
Authorization: Bearer <access_token>
```

### Roles

| Rol              | Descripción                    |
| ---------------- | ------------------------------ |
| `ADMIN`          | Acceso total                   |
| `CASHIER`        | Caja, facturación              |
| `KITCHEN`        | Cocina, órdenes                |
| `WAITRESS`       | Meseros, toma de pedidos       |
| `CANCHA_MANAGER` | Gestión de canchas (si aplica) |

---

## 📝 Logs y Monitoreo

Cada request genera logs estructurados en JSON:

```json
{
  "timestamp": "2026-04-18T13:47:30.473Z",
  "level": "http",
  "message": "::ffff:192.168.65.1 - - [18/Apr/2026:13:47:30 +0000] \"GET / HTTP/1.1\" 200 71 \"-\" \"curl/8.7.1\"",
  "requestId": "60d795b1-fed9-4144-b761-1b1460eb74fb",
  "responseTime": 15,
  "service": "lalora-backend",
  "method": "::ffff:192.168.65.1",
  "url": "-"
}
```

**Headers de respuesta**:

- `X-Request-Id` - UUID único por request (para correlación en logs)

**Niveles de log** (configurables en `.env`):

- `error` - Errores críticos
- `warn` - Advertencias
- `info` - Info general (default)
- `http` - Requests HTTP
- `debug` - Detalle de desarrollo

Para cambiar verbosidad:

```bash
# En .env
LOG_LEVEL=debug   # o 'info', 'warn', 'error'
```

---

## 🔄 Workflow: Añadir Nueva Tabla

Ejemplo: agregar tabla `Product`

**1. Actualizar schema Prisma** (`prisma/schema.prisma`):

```prisma
model Product {
  id        String   @id @default(uuid())
  name      String
  price     Float
  active    Boolean  @default(true)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Relaciones (opcional)
  orderItems OrderItem[]
}
```

**2. Crear migración**:

```bash
docker compose exec backend npx prisma migrate dev --name add_product_table
```

**3. Generar módulo**:

```bash
# Estructura sugerida
mkdir -p src/products/{dto,interfaces}
touch src/products/products.module.ts \
      src/products/products.service.ts \
      src/products/products.controller.ts \
      src/products/dto/create-product.dto.ts \
      src/products/dto/update-product.dto.ts
```

**4. Implementar**:

```typescript
// products.service.ts
@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.product.findMany({ where: { active: true } });
  }
}
```

**5. Registrar en AppModule**:

```typescript
@Module({
  imports: [PrismaModule, ProductsModule],
  // ...
})
export class AppModule {}
```

**6. Commit**:

```bash
git add .
git commit -m "feat(products): add product management module

- Add Product model to Prisma schema
- Migration: 20260418_add_product_table
- CRUD endpoints: GET /products, POST /products, etc.
- DTOs with validation"
```

---

## 🧪 Testing

```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Test coverage
npm run test:cov

# Watch mode
npm run test:watch
```

---

## 🎨 Validación de Datos (RTK)

TODOS los DTOs de entrada usan **class-validator**:

```typescript
import {
  IsEmail,
  IsString,
  IsNumber,
  Min,
  Max,
  IsOptional,
  ValidateIf,
} from 'class-validator';

export class CreateUserDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  password: string;

  @IsString()
  @MaxLength(100)
  @IsOptional()
  name?: string;

  @IsNumber()
  @Min(0)
  @IsOptional()
  age?: number;

  // Validación condicional
  @ValidateIf((o) => o.age !== null)
  @IsNumber()
  age: number;
}
```

Los DTOs se aplican globalmente en `main.ts` con `ValidationPipe`:

- `whitelist`: elimina propiedades no definidas
- `forbidNonWhitelisted`: lanza error si hay props extra
- `transform`: convierte tipos automáticamente (string → number, etc.)

---

## 📊 Sistema de Logs

**Características**:

- ✅ **Correlation IDs**: Cada request tiene UUID único
- ✅ **JSON structured logs**: Fácil parseo por herramientas (ELK, Datadog)
- ✅ **Request/response logging**: Morgan captura método, URL, status, tiempo
- ✅ **Context propagation**: AsyncLocalStorage mantiene contexto en toda la call stack
- ✅ **File transport opcional**: `LOG_FILE_ENABLED=true` escribe a `/logs/`

**Transportes configurados**:

1. **Console** - Salida a stdout (capturada por Docker)
2. **File** (opcional) - `logs/combined.log` y `logs/error.log`

**Ver logs en Docker**:

```bash
docker compose logs -f backend  # Tiempo real
docker compose logs --tail=100 backend  # últimas 100 líneas
```

---

## 🐛 Debugging

### Ver logs de un contenedor específico

```bash
docker compose logs -f backend
```

### Entrar al contenedor backend

```bash
docker compose exec backend sh
# Dentro:
node -e "console.log(require('@prisma/client'))"
```

### Ver estado de Prisma

```bash
docker compose exec backend npx prisma migrate status
```

### Resetear DB (solo desarrollo)

```bash
docker compose down -v
docker compose up -d
docker compose exec backend npx prisma migrate dev --name init
```

### Logs de PostgreSQL

```bash
docker compose logs postgres
```

---

## 📦 Variables de Entorno

`.env` (no committear):

```bash
# PostgreSQL (Docker)
DATABASE_USER=lalora
DATABASE_PASSWORD=tu_password_seguro
DATABASE_NAME=lalora_db
DATABASE_PORT=5432

# Conexión local (no Docker)
DATABASE_URL=postgresql://localhost:5432/lalora_db

# JWT
JWT_SECRET=tu_jwt_secret_muy_seguro_min_32_chars

# Servidor
PORT=3000
NODE_ENV=development

# Logging
LOG_LEVEL=debug
LOG_FILE_ENABLED=false
```

---

## 🔐 Seguridad

- ✅ Passwords hasheados (bcrypt en auth)
- ✅ JWT con expiración (24h por defecto)
- ✅ Validación estricta en todos los inputs
- ✅ Headers de seguridad (X-Request-Id)
- ✅ Secrets en `.env` (nunco en código)
- ✅ Sanitización de logs (no loguear passwords)

---

## 🚢 Despliegue a Producción

> **TODO**: configurar CI/CD y variables de producción

**Preparación**:

1. Cambiar `NODE_ENV=production`
2. Desactivar hot reload (usar imagen multi-stage)
3. Build: `docker compose -f docker-compose.yml -f docker-compose.prod.yml build`
4. Migraciones: `npx prisma migrate deploy`

**Docker Compose producción** (ejemplo):

```yaml
services:
  backend:
    build:
      context: .
      target: production # multi-stage
    command: node dist/main
    volumes: [] # sin bind mount
  postgres:
    ports: [] # no exponer 5432
```

---

## 📚 Recursos

- [NestJS Docs](https://docs.nestjs.com)
- [Prisma Docs](https://prisma.io/docs)
- [PostgreSQL Tutorial](https://postgresqltutorial.com)
- [Winston Logging](https://github.com/winstonjs/winston)

---

## 🤝 Contribuir

1. Fork el repo
2. Crear branch: `git checkout -b feat/nueva-feature`
3. Commit siguiendo [Conventional Commits](#-commit-guidelines)
4. Push: `git push origin feat/nueva-feature`
5. Abrir Pull Request

**Antes de PR**:

- [ ] `npm run lint` passing
- [ ] `npm run build` passing
- [ ] Tests (si aplica)
- [ ] Migraciones creadas (si hay BD changes)
- [ ] README actualizado (si es user-facing)

---

## 📄 Licencia

MIT License - Ver `LICENSE` para detalles.

---

## 👥 Autores

- **Sergio Morales** - _Desarrollo inicial_ - [GitHub](https://github.com/XChecho)

---

**Última actualización**: Abril 2026

</div>
