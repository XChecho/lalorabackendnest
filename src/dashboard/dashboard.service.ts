import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { OrderStatus, ExpenseCategory } from '@prisma/client';

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getDashboard() {
    try {
      const now = new Date();
      const colombiaOffset = -5 * 60 * 60 * 1000; // GTM-5 in milliseconds
      const todayStart = new Date(now.getTime() + colombiaOffset);
      todayStart.setHours(0, 0, 0, 0);
      const todayEnd = new Date(todayStart);
      todayEnd.setHours(23, 59, 59, 999);

      // Daily Sales (últimas 24 horas de pedidos deliverados o cerrados)
      const todayOrders = await this.prisma.order.findMany({
        where: {
          status: { in: ['DELIVERED' as any, 'CLOSED' as any] },
          createdAt: {
            gte: todayStart,
            lte: todayEnd,
          },
        },
      });

      const todayTotalSales = todayOrders.reduce(
        (sum, order) => sum + order.total,
        0,
      );
      const todayOrdersCount = todayOrders.length;

      // Account Closings (últimos 3 días)
      const closings: Array<{
        date: string;
        totalIncome: number;
        totalExpenses: number;
        balance: number;
      }> = [];
      for (let i = 1; i <= 3; i++) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);
        const dayStart = new Date(date);
        dayStart.setHours(0, 0, 0, 0);
        const dayEnd = new Date(date);
        dayEnd.setHours(23, 59, 59, 999);

        const dayOrders = await this.prisma.order.findMany({
          where: {
            status: { in: ['DELIVERED' as any, 'CLOSED' as any] },
            createdAt: { gte: dayStart, lte: dayEnd },
          },
        });

        const dayExpenses = await this.prisma.expense.findMany({
          where: {
            date: { gte: dayStart, lte: dayEnd },
          },
        });

        const totalIncome = dayOrders.reduce((sum, o) => sum + o.total, 0);
        const totalExpenses = dayExpenses.reduce((sum, e) => sum + e.amount, 0);

        const dayStr = date.toISOString().split('T')[0];
        closings.push({
          date: dayStr,
          totalIncome,
          totalExpenses,
          balance: totalIncome - totalExpenses,
        });
      }

      // Menu stats
      const categoriesCount = await this.prisma.category.count({
        where: { active: true },
      });
      const productsCount = await this.prisma.product.count({
        where: { available: true },
      });

      // Tables stats
      const zones = await this.prisma.zone.findMany({
        include: {
          _count: { select: { tables: true } },
        },
      });
      const spaces = zones.map((zone) => ({
        id: zone.id,
        name: zone.name,
        tablesCount: zone._count.tables,
      }));
      const totalTables = await this.prisma.table.count();

      // Users stats
      const recentUsers = await this.prisma.user.findMany({
        orderBy: { createdAt: 'desc' },
        take: 3,
        select: {
          id: true,
          firstName: true,
          lastName: true,
          role: true,
        },
      });
      const totalUsers = await this.prisma.user.count({
        where: { active: true },
      });

      const todayStr = todayStart.toISOString().split('T')[0];

      return {
        dailySales: {
          date: todayStr,
          todayTotalSales,
          todayOrdersCount,
          currency: 'COP',
        },
        accountClosings: closings,
        menu: {
          categoriesCount,
          productsCount,
        },
        tables: {
          spaces,
          totalTables,
        },
        users: {
          recentUsers,
          totalUsers,
        },
      };
    } catch (error) {
      console.error('Dashboard error:', error);
      throw error;
    }
  }
}
