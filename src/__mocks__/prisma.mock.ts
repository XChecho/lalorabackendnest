/**
 * ============================================================
 * UTILIDAD: Fábrica de mocks reutilizable para PrismaService
 * ============================================================
 *
 * ¿Por qué existe este archivo?
 * NestJS inyecta PrismaService (que extiende PrismaClient) en los
 * servicios. PrismaClient tiene "delegates" como `order`, `table`,
 * `product`, etc., y cada uno tiene métodos como findMany,
 * findUnique, create, update, delete...
 *
 * En pruebas unitarias NO queremos tocar PostgreSQL real. Esta
 * utilidad crea un objeto que "parece" PrismaService pero con
 * todos sus métodos reemplazados por jest.fn().
 *
 * Uso típico en beforeEach:
 *
 *   const mockPrisma = createMockPrismaService();
 *   const module = await Test.createTestingModule({
 *     providers: [
 *       OrdersService,
 *       { provide: PrismaService, useValue: mockPrisma },
 *     ],
 *   }).compile();
 */

export interface MockPrismaDelegate {
  findMany: jest.Mock;
  findUnique: jest.Mock;
  findFirst: jest.Mock;
  create: jest.Mock;
  update: jest.Mock;
  delete: jest.Mock;
  count: jest.Mock;
  createMany: jest.Mock;
  deleteMany: jest.Mock;
  updateMany: jest.Mock;
}

export interface MockPrismaService {
  order: Pick<
    MockPrismaDelegate,
    | 'findMany'
    | 'findUnique'
    | 'findFirst'
    | 'create'
    | 'update'
    | 'delete'
    | 'count'
  >;
  table: Pick<
    MockPrismaDelegate,
    'findMany' | 'findUnique' | 'findFirst' | 'create' | 'update' | 'delete'
  >;
  product: Pick<
    MockPrismaDelegate,
    'findMany' | 'findUnique' | 'findFirst' | 'create' | 'update' | 'delete' | 'count'
  >;
  category: Pick<
    MockPrismaDelegate,
    'findMany' | 'findUnique' | 'findFirst' | 'create' | 'update' | 'delete' | 'count'
  >;
  categoryModifierList: Pick<
    MockPrismaDelegate,
    'findMany' | 'findUnique' | 'findFirst' | 'create' | 'update' | 'delete'
  >;
  categoryModifierOption: Pick<
    MockPrismaDelegate,
    'findMany' | 'findUnique' | 'findFirst' | 'create' | 'update' | 'delete'
  >;
  orderItem: Pick<
    MockPrismaDelegate,
    'findMany' | 'findUnique' | 'create' | 'update' | 'delete' | 'createMany'
  >;
  orderItemModifier: Pick<MockPrismaDelegate, 'createMany'>;
  productModifier: Pick<MockPrismaDelegate, 'deleteMany'>;
  refreshToken: Pick<
    MockPrismaDelegate,
    'create' | 'delete' | 'deleteMany' | 'findUnique'
  >;
  user: Pick<
    MockPrismaDelegate,
    'findMany' | 'findUnique' | 'findFirst' | 'create' | 'update' | 'delete'
  >;
  $connect: jest.Mock;
  $disconnect: jest.Mock;
  $transaction: jest.Mock;
}

/**
 * Crea una instancia fresca del mock de PrismaService.
 *
 * Cada llamada devuelve un objeto nuevo, evitando que el estado
 * de un test contamine al siguiente (aislamiento).
 */
export const createMockPrismaService = (): MockPrismaService => ({
  zone: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    deleteMany: jest.fn(),
    count: jest.fn(),
  },
  table: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    deleteMany: jest.fn(),
    createMany: jest.fn(),
  },
  order: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
  },
  product: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
  },
  category: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
  },
  categoryModifierList: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  categoryModifierOption: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  orderItem: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    createMany: jest.fn(),
  },
  orderItemModifier: {
    createMany: jest.fn(),
  },
  productModifier: {
    deleteMany: jest.fn(),
  },
  refreshToken: {
    create: jest.fn(),
    delete: jest.fn(),
    deleteMany: jest.fn(),
    findUnique: jest.fn(),
  },
  user: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  $connect: jest.fn(),
  $disconnect: jest.fn(),
  $transaction: jest.fn(),
});
