import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { AddItemsDto } from './dto/add-items.dto';
import { LoggerService } from '../common/logger/logger.service';

const VALID_TRANSITIONS: Record<string, string[]> = {
  PENDING: ['CONFIRMED', 'CANCELLED'],
  CONFIRMED: ['IN_PREPARATION', 'CANCELLED'],
  IN_PREPARATION: ['READY', 'CANCELLED'],
  READY: ['DELIVERED'],
  DELIVERED: ['CLOSED'],
  CANCELLED: [],
  CLOSED: [],
};

@Injectable()
export class OrdersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly logger: LoggerService,
  ) {}

  async create(dto: CreateOrderDto, userId: string) {
    this.logger.log(`Creating order for user ${userId}`, {
      userId,
      tableId: dto.tableId,
    });

    if (dto.tableId) {
      const table = await this.prisma.table.findUnique({
        where: { id: dto.tableId },
      });
      if (!table) {
        this.logger.warn(`Table not found: ${dto.tableId}`, {
          tableId: dto.tableId,
        });
        throw new NotFoundException(`Table with id ${dto.tableId} not found`);
      }

      const activeOrder = await this.prisma.order.findFirst({
        where: {
          tableId: dto.tableId,
          status: { notIn: ['CLOSED', 'CANCELLED'] },
        },
      });
      if (activeOrder) {
        this.logger.warn(`Table already has active order: ${dto.tableId}`, {
          tableId: dto.tableId,
          activeOrderId: activeOrder.id,
        });
        throw new BadRequestException('Table already has an active order');
      }
    }

    const order = await this.prisma.order.create({
      data: {
        tableId: dto.tableId,
        userId,
        customerName: dto.customerName,
        orderType: (dto.orderType as any) || 'LOCAL',
        status: 'PENDING',
        total: 0,
      },
    });

    this.logger.log(`Order created: ${order.id}`, {
      orderId: order.id,
      userId,
    });

    if (dto.tableId) {
      await this.prisma.table.update({
        where: { id: dto.tableId },
        data: { status: 'OCCUPIED' },
      });
      this.logger.log(`Table status updated to OCCUPIED: ${dto.tableId}`, {
        tableId: dto.tableId,
      });
    }

    if (dto.items && dto.items.length > 0) {
      await this.addItemsInternal(order.id, dto.items);
    }

    return this.findById(order.id);
  }

  async findById(id: string) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            product: true,
            modifiers: true,
          },
          orderBy: { createdAt: 'asc' },
        },
        table: true,
      },
    });
    if (!order) {
      throw new NotFoundException(`Order with id ${id} not found`);
    }
    return order;
  }

  async addItems(orderId: string, dto: AddItemsDto) {
    const order = await this.findById(orderId);
    if (order.status === 'CLOSED' || order.status === 'CANCELLED') {
      throw new BadRequestException(
        'Cannot add items to a closed or cancelled order',
      );
    }

    await this.addItemsInternal(orderId, dto.items);
    return this.findById(orderId);
  }

  private async addItemsInternal(orderId: string, items: any[]) {
    let total = 0;

    const existingItems = await this.prisma.orderItem.findMany({
      where: { orderId },
      select: { price: true },
    });
    total = existingItems.reduce((sum, item) => sum + item.price, 0);

    for (const item of items) {
      const product = await this.prisma.product.findUnique({
        where: { id: item.productId },
      });
      if (!product) {
        throw new NotFoundException(
          `Product with id ${item.productId} not found`,
        );
      }

      const itemTotal = item.price * item.quantity;
      total += itemTotal;

      const orderItem = await this.prisma.orderItem.create({
        data: {
          orderId,
          productId: item.productId,
          quantity: item.quantity,
          price: itemTotal,
          notes: item.notes,
        },
      });

      if (item.modifiers && item.modifiers.length > 0) {
        await this.prisma.orderItemModifier.createMany({
          data: item.modifiers.map((m: any) => ({
            orderItemId: orderItem.id,
            modifierName: m.modifierName,
            selectedOption: m.selectedOption,
          })),
        });
      }
    }

    await this.prisma.order.update({
      where: { id: orderId },
      data: { total },
    });
  }

  async updateStatus(orderId: string, status: string) {
    const order = await this.findById(orderId);
    const validTransitions = VALID_TRANSITIONS[order.status];

    if (!validTransitions || !validTransitions.includes(status)) {
      throw new BadRequestException(
        `Cannot transition from ${order.status} to ${status}`,
      );
    }

    const updated = await this.prisma.order.update({
      where: { id: orderId },
      data: { status: status as any },
      include: {
        items: { include: { product: true, modifiers: true } },
        table: true,
      },
    });

    if (status === 'CLOSED' && order.tableId) {
      await this.prisma.table.update({
        where: { id: order.tableId },
        data: { status: 'AVAILABLE' },
      });
    }

    return updated;
  }

  async findActiveByTable(tableId: string) {
    const table = await this.prisma.table.findUnique({
      where: { id: tableId },
    });
    if (!table) {
      throw new NotFoundException(`Table with id ${tableId} not found`);
    }

    const order = await this.prisma.order.findFirst({
      where: {
        tableId,
        status: { notIn: ['CLOSED', 'CANCELLED'] },
      },
      include: {
        items: {
          include: {
            product: true,
            modifiers: true,
          },
          orderBy: { createdAt: 'asc' },
        },
        table: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return order;
  }

  async cancel(orderId: string) {
    const order = await this.findById(orderId);

    const updated = await this.prisma.order.update({
      where: { id: orderId },
      data: { status: 'CANCELLED' },
      include: {
        items: { include: { product: true, modifiers: true } },
        table: true,
      },
    });

    if (order.tableId) {
      await this.prisma.table.update({
        where: { id: order.tableId },
        data: { status: 'AVAILABLE' },
      });
    }

    return updated;
  }
}
