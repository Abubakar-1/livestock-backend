import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { BatchStatus, HealthStatus } from '@prisma/client';

@Injectable()
export class BatchesService {
  constructor(private prisma: PrismaService) {}

  async create(data: {
    name: string;
    description?: string;
    animalTypeId: string;
    animalPrice: number;
    serviceFee: number;
    estimatedSalePriceLow: number;
    estimatedSalePriceHigh: number;
    startDate: Date;
    endDate: Date;
    campaignStartDate?: Date;
    campaignEndDate?: Date;
    currentMarketValueLow?: number;
    currentMarketValueHigh?: number;
    status?: BatchStatus;
    farms: { farmId: string; quantity: number }[];
  }) {
    const totalUnits = data.farms.reduce((acc, f) => acc + f.quantity, 0);

    return this.prisma.$transaction(async (tx) => {
      for (const farmContrib of data.farms) {
        const inventory = await tx.farmAnimal.findUnique({
          where: {
            farmId_animalTypeId: {
              farmId: farmContrib.farmId,
              animalTypeId: data.animalTypeId,
            },
          },
        });

        if (!inventory || inventory.quantity < farmContrib.quantity) {
          throw new BadRequestException(
            `Farm ${farmContrib.farmId} does not have enough animals of this type`,
          );
        }

        await tx.farmAnimal.update({
          where: { id: inventory.id },
          data: { quantity: { decrement: farmContrib.quantity } },
        });
      }

      const batch = await tx.batch.create({
        data: {
          name: data.name,
          description: data.description,
          animalTypeId: data.animalTypeId,
          totalUnits,
          animalPrice: data.animalPrice,
          serviceFee: data.serviceFee,
          estimatedSalePriceLow: data.estimatedSalePriceLow,
          estimatedSalePriceHigh: data.estimatedSalePriceHigh,
          startDate: new Date(data.startDate),
          endDate: new Date(data.endDate),
          campaignStartDate: data.campaignStartDate ? new Date(data.campaignStartDate) : null,
          campaignEndDate: data.campaignEndDate ? new Date(data.campaignEndDate) : null,
          currentMarketValueLow: data.currentMarketValueLow,
          currentMarketValueHigh: data.currentMarketValueHigh,
          status: data.status || BatchStatus.DRAFT,
        },
      });

      await tx.batchFarm.createMany({
        data: data.farms.map((f) => ({
          batchId: batch.id,
          farmId: f.farmId,
          quantity: f.quantity,
        })),
      });

      return batch;
    });
  }

  async update(
    id: string,
    data: {
      name?: string;
      description?: string;
      animalPrice?: number;
      serviceFee?: number;
      estimatedSalePriceLow?: number;
      estimatedSalePriceHigh?: number;
      startDate?: Date;
      endDate?: Date;
      campaignStartDate?: Date;
      campaignEndDate?: Date;
      currentMarketValueLow?: number;
      currentMarketValueHigh?: number;
      status?: BatchStatus;
      healthStatus?: HealthStatus;
      isCampaignOpen?: boolean;
    },
  ) {
    const batch = await this.prisma.batch.findUnique({ where: { id } });
    if (!batch) throw new NotFoundException('Batch not found');

    return this.prisma.batch.update({
      where: { id },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.animalPrice !== undefined && { animalPrice: data.animalPrice }),
        ...(data.serviceFee !== undefined && { serviceFee: data.serviceFee }),
        ...(data.estimatedSalePriceLow !== undefined && { estimatedSalePriceLow: data.estimatedSalePriceLow }),
        ...(data.estimatedSalePriceHigh !== undefined && { estimatedSalePriceHigh: data.estimatedSalePriceHigh }),
        ...(data.startDate && { startDate: new Date(data.startDate) }),
        ...(data.endDate && { endDate: new Date(data.endDate) }),
        ...(data.campaignStartDate !== undefined && {
          campaignStartDate: data.campaignStartDate ? new Date(data.campaignStartDate) : null,
        }),
        ...(data.campaignEndDate !== undefined && {
          campaignEndDate: data.campaignEndDate ? new Date(data.campaignEndDate) : null,
        }),
        ...(data.currentMarketValueLow !== undefined && {
          currentMarketValueLow: data.currentMarketValueLow,
        }),
        ...(data.currentMarketValueHigh !== undefined && {
          currentMarketValueHigh: data.currentMarketValueHigh,
        }),
        ...(data.status && data.status !== BatchStatus.COMPLETED && { status: data.status }),
        ...(data.healthStatus && { healthStatus: data.healthStatus }),
      },
    });
  }

  async findAll() {
    return this.prisma.batch.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        animalType: true,
        batchFarms: {
          include: { farm: true },
        },
        _count: {
          select: { investments: true },
        },
      },
    });
  }

  async findOne(id: string) {
    const batch = await this.prisma.batch.findUnique({
      where: { id },
      include: {
        animalType: true,
        batchFarms: {
          include: { farm: true },
        },
        investments: {
          include: { user: true },
        },
      },
    });
    if (!batch) throw new NotFoundException('Batch not found');
    return batch;
  }

  async updateHealth(id: string, healthStatus: HealthStatus) {
    return this.prisma.batch.update({
      where: { id },
      data: { healthStatus },
    });
  }

  async updateStatus(id: string, status: BatchStatus) {
    if (status === BatchStatus.COMPLETED) {
      throw new BadRequestException('Cannot set batch to COMPLETED manually. Use End Batch Lifecycle.');
    }
    return this.prisma.batch.update({
      where: { id },
      data: { status },
    });
  }


  /**
   * End a batch — sets status to COMPLETED and records completion time.
   * Does NOT require a final sale price (admin can set it later).
   */
  async endBatch(id: string) {
    const batch = await this.prisma.batch.findUnique({ where: { id } });
    if (!batch) throw new NotFoundException('Batch not found');

    return this.prisma.batch.update({
      where: { id },
      data: {
        status: BatchStatus.COMPLETED,
        completedAt: new Date(),
      },
    });
  }

  /**
   * Set the final sale price per unit for a completed batch.
   * Automatically computes payoutAmount for each CONFIRMED investment
   * and sets their payoutStatus to PENDING.
   */
  async setFinalPrice(id: string, finalSalePrice: number) {
    const batch = await this.prisma.batch.findUnique({ where: { id } });
    if (!batch) throw new NotFoundException('Batch not found');

    return this.prisma.$transaction(async (tx) => {
      // Update the batch with the final sale price
      const updatedBatch = await tx.batch.update({
        where: { id },
        data: { finalSalePrice },
      });

      // Find all confirmed investments for this batch
      const investments = await tx.investment.findMany({
        where: { batchId: id, status: 'CONFIRMED' },
      });

      // Compute payout for each and set status to PENDING
      for (const inv of investments) {
        const payoutAmount = inv.units * finalSalePrice;
        await tx.investment.update({
          where: { id: inv.id },
          data: {
            payoutAmount,
            payoutStatus: 'PENDING',
          },
        });
      }

      return updatedBatch;
    });
  }

  /**
   * Mark a single investment as paid out.
   */
  async markInvestmentPaid(batchId: string, investmentId: string) {
    const investment = await this.prisma.investment.findFirst({
      where: { id: investmentId, batchId },
    });
    if (!investment) throw new NotFoundException('Investment not found in this batch');

    return this.prisma.investment.update({
      where: { id: investmentId },
      data: {
        payoutStatus: 'PAID',
        paidAt: new Date(),
      },
    });
  }

  /**
   * Bulk mark all PENDING payouts in a batch as paid.
   */
  async markAllPaid(batchId: string) {
    const batch = await this.prisma.batch.findUnique({ where: { id: batchId } });
    if (!batch) throw new NotFoundException('Batch not found');

    return this.prisma.investment.updateMany({
      where: {
        batchId,
        status: 'CONFIRMED',
        payoutStatus: 'PENDING',
      },
      data: {
        payoutStatus: 'PAID',
        paidAt: new Date(),
      },
    });
  }
}
