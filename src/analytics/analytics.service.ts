import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AnalyticsService {
  constructor(private prisma: PrismaService) {}

  async getDashboardStats() {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // ── Parallel aggregations ─────────────────────────────────────
    const [
      // Users
      totalUsers,
      newUsersLast30Days,
      // Batches
      batchCounts,
      // Investments
      investmentAgg,
      recentInvestments,
      // Farms
      totalFarms,
      // Animal Types
      totalSpecies,
      // Activity
      recentActivity,
      // Inventory totals
      inventoryAgg,
      // Top batches by investment
      topBatches,
    ] = await Promise.all([
      this.prisma.user.count({ where: { role: 'USER' } }),
      this.prisma.user.count({
        where: { role: 'USER', createdAt: { gte: thirtyDaysAgo } },
      }),
      this.prisma.batch.groupBy({
        by: ['status'],
        _count: { status: true },
      }),
      this.prisma.investment.aggregate({
        _sum: { amount: true, units: true },
        where: { status: 'CONFIRMED' },
        _count: { id: true },
      }),
      this.prisma.investment.aggregate({
        _sum: { amount: true },
        where: { 
          status: 'CONFIRMED',
          createdAt: { gte: thirtyDaysAgo } 
        },
        _count: { id: true },
      }),
      this.prisma.farm.count(),
      this.prisma.animalType.count(),
      this.prisma.activity.findMany({
        orderBy: { createdAt: 'desc' },
        take: 10,
        include: { user: { select: { firstName: true, lastName: true, email: true } } },
      }),
      this.prisma.farmAnimal.aggregate({
        _sum: { quantity: true },
      }),
      this.prisma.batch.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        where: { status: { in: ['OPEN', 'ACTIVE'] } },
        include: {
          animalType: true,
          _count: { select: { investments: true } },
        },
      }),
    ]);

    // Weekly investment series (last 7 days)
    const weeklyInvestments = await Promise.all(
      Array.from({ length: 7 }, (_, i) => {
        const day = new Date(now);
        day.setDate(day.getDate() - (6 - i));
        day.setHours(0, 0, 0, 0);
        const nextDay = new Date(day);
        nextDay.setDate(nextDay.getDate() + 1);
        return this.prisma.investment
          .aggregate({
            _sum: { amount: true },
            where: { 
              status: 'CONFIRMED',
              createdAt: { gte: day, lt: nextDay } 
            },
          })
          .then((r) => ({
            day: day.toLocaleDateString('en', { weekday: 'short' }),
            amount: Number(r._sum.amount || 0),
          }));
      }),
    );

    // Batch status map
    const batchStatusMap: Record<string, number> = {};
    for (const b of batchCounts) {
      batchStatusMap[b.status] = b._count.status;
    }

    return {
      users: {
        total: totalUsers,
        newLast30Days: newUsersLast30Days,
      },
      batches: {
        total: Object.values(batchStatusMap).reduce((a, b) => a + b, 0),
        byStatus: batchStatusMap,
        activeLive: (batchStatusMap['OPEN'] || 0) + (batchStatusMap['ACTIVE'] || 0),
      },
      investments: {
        totalCapital: Number(investmentAgg._sum.amount || 0),
        totalUnits: Number(investmentAgg._sum.units || 0),
        totalCount: investmentAgg._count.id,
        last30DaysCapital: Number(recentInvestments._sum.amount || 0),
        last30DaysCount: recentInvestments._count.id,
      },
      farms: {
        total: totalFarms,
        totalLivestock: Number(inventoryAgg._sum.quantity || 0),
      },
      species: {
        total: totalSpecies,
      },
      weeklyInvestments,
      recentActivity,
      topBatches,
    };
  }
}
