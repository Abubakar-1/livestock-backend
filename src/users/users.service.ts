import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phoneNumber: true,
        avatarUrl: true,
        bankName: true,
        accountNumber: true,
        accountName: true,
        role: true,
        createdAt: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async findAll() {
    return this.prisma.user.findMany({
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phoneNumber: true,
        role: true,
        createdAt: true,
        wallet: {
          select: {
            balance: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  }

  async findAssetOwners() {
    const owners = await this.prisma.user.findMany({
      where: { role: 'USER' },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phoneNumber: true,
        avatarUrl: true,
        createdAt: true,
        investments: {
          include: {
            batch: {
              include: { animalType: true },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const ownerCards = owners.map((owner) => {
      const confirmed = owner.investments.filter((investment) => investment.status === 'CONFIRMED');
      const activeBatchIds = new Set(
        confirmed
          .filter((investment) => ['OPEN', 'ACTIVE', 'FULL'].includes(investment.batch.status))
          .map((investment) => investment.batchId),
      );

      const totalAssetsValue = confirmed.reduce((sum, investment) => {
        const batch = investment.batch;
        const currentMarketValue = Number(batch.currentMarketValueLow || 0);
        const unitValue =
          currentMarketValue > 0
            ? currentMarketValue
            : Number(batch.animalPrice) + Number(batch.feedingFee) + Number(batch.medicationFee);
        return sum + investment.units * unitValue;
      }, 0);

      const totalCost = confirmed.reduce(
        (sum, investment) => sum + Number(investment.amount || 0),
        0,
      );
      const performance =
        totalCost > 0 ? ((totalAssetsValue - totalCost) / totalCost) * 100 : 0;

      return {
        id: owner.id,
        name:
          [owner.firstName, owner.lastName].filter(Boolean).join(' ') ||
          owner.email,
        email: owner.email,
        phoneNumber: owner.phoneNumber,
        avatarUrl: owner.avatarUrl,
        joinedAt: owner.createdAt,
        totalAssetsValue,
        activeBatches: activeBatchIds.size,
        totalOrders: owner.investments.length,
        confirmedOrders: confirmed.length,
        performance,
        latestAsset: confirmed[0]?.batch?.name || null,
      };
    });

    const platformAum = ownerCards.reduce((sum, owner) => sum + owner.totalAssetsValue, 0);
    const confirmedInvestments = owners.flatMap((owner) =>
      owner.investments.filter((investment) => investment.status === 'CONFIRMED'),
    );
    const avgPurchase =
      confirmedInvestments.length > 0
        ? confirmedInvestments.reduce((sum, investment) => sum + Number(investment.amount || 0), 0) /
          confirmedInvestments.length
        : 0;

    return {
      stats: {
        totalOwners: ownerCards.length,
        platformAum,
        avgPurchase,
      },
      owners: ownerCards,
    };
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        wallet: true,
        investments: {
          include: {
            batch: true,
          },
          orderBy: {
            createdAt: "desc",
          },
        },
        transactions: {
          take: 10,
          orderBy: {
            createdAt: "desc",
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException("User not found");
    }

    return user;
  }

  async updateProfile(userId: string, data: any) {
    // Only allow updating certain fields
    const { firstName, lastName, phoneNumber, avatarUrl, bankName, accountNumber, accountName } = data;

    return this.prisma.user.update({
      where: { id: userId },
      data: {
        ...(firstName && { firstName }),
        ...(lastName && { lastName }),
        ...(phoneNumber && { phoneNumber }),
        ...(avatarUrl && { avatarUrl }),
        ...(bankName !== undefined && { bankName }),
        ...(accountNumber !== undefined && { accountNumber }),
        ...(accountName !== undefined && { accountName }),
      },
    });
  }
}
