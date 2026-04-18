# Laloraapp Backend — Proyecto NestJS

Este documento sirve como la guía de contexto y reglas base para la creación del backend del proyecto **Laloraapp**. El objetivo es desarrollar una API robusta, escalable y en tiempo real para soportar la aplicación móvil existente (React Native / Expo).

## 🚀 Arquitectura Core (Endpoints & Backend)
- **Framework:** NestJS con Express o Fastify.
- **Lenguaje:** TypeScript 5.x.
- **Arquitectura:** Modular (Features: Auth, Orders, Catalog, Tables, Reservations, Billing).
- **Base de Datos:** PostgreSQL con Prisma ORM.
- **Autenticación y Autorización:** JWT (JSON Web Tokens). Roles definidos: `Admin`, `Cashier`, `Kitchen`, `Waitress`, `CanchaManager`.
- **Comunicación en Tiempo Real:** Socket.io (actualización de estados de pedidos en cocina, notificaciones al mesero y estados de canchas).

## 📦 Librerías Recomendadas
1. **ORM y Base de Datos:**
   - `@prisma/client`: Cliente de Prisma para TypeScript.
   - `prisma`: CLI y migraciones.
2. **Autenticación:**
   - `@nestjs/passport`: Integración Passport.
   - `passport-jwt`: Estrategia JWT.
   - `@nestjs/jwt`: Utilidades JWT.
3. **Validación:**
   - `class-validator`: Decoradores para DTOs.
   - `class-transformer`: Transformación de clases.
4. **Tiempo Real:**
   - `@nestjs/websockets`: Módulo WebSocket.
   - `socket.io`: Servidor WebSocket.
5. **Documentación:**
   - `@nestjs/swagger`: Documentación API.
6. **Testing:**
   - `jest`: Framework de pruebas.
   - `supertest`: Pruebas E2E.

## 📂 Organização del Proyecto
Estructura de carpetas recomendada:
```
src/
├── auth/              # Módulo de autenticación
│   ├── guards/
│   ├── strategies/
│   └── dto/
├── orders/           # Módulo de órdenes
│   ├── dto/
│   └── events/
├── catalog/           # Menú y productos
├── tables-canchas/    # Mesas y canchas
├── reservations/      # Reservas
├── billing/           # Caja y reportes
├── common/           # Shared: filtros, interceptors
├── prisma/            # Schema y migraciones
└── main.ts
```

## 🏢 Dominios Principales (Basado en la App Móvil)
1. **Identity & Access Management:** Manejo de usuarios, login, roles.
2. **Catalog (Menú):** Categorías, Productos, Precios, Modificadores de menú.
3. **Orders (Cocina y Meseros):** Creación de órdenes (waitress), actualización de estado (pendientes, en preparación, listas, entregadas), cálculo de tiempos.
4. **Tables & Canchas:** Gestión del estado de las mesas del restaurante y las canchas deportivas (disponible, ocupada, reservada).
5. **Reservations:** Sistema de reservas para canchas por bloques de tiempo.
6. **Billing (Caja):** Cierre de órdenes, métodos de pago, reportes de turnos.

## 🛠️ Reglas del Agente (Instrucciones para la IA)
1. **Inicialización Única:** Comienza generando el proyecto NestJS con `nest new` e instala las dependencias principales (Prisma, JWT, Socket.io).
2. **Estructura Modular:** Cada dominio es un módulo NestJS independiente.
3. **Migraciones Prisma:** Define el schema en `prisma/schema.prisma` antes de configurar la base de datos y usa `npx prisma migrate dev` para aplicar cambios.
4. **Respuesta Estándar:** Todas las respuestas de la API deben seguir un wrapper predecible, ej: `{ "data": ..., "success": true, "message": "..." }`.
5. **WebSockets:** Implementa Gateways para comunicación en tiempo real (notificaciones de pedidos a cocina, meseros, estado de canchas).
6. **DTOs con class-validator:** Usa decoradores para validación de entrada en los endpoints.

---

**Instrucci��n de arranque para la IA:** 
"Inicia la construcción del proyecto configurando NestJS, instalando dependencias (Prisma, JWT, Socket.io, Swagger), generando el schema de Prisma con los dominios de Usuarios, Órdenes y Menú, y configurando el módulo de Autenticación JWT."