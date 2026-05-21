import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PurchasesService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, batchId: string, units: number) {
    // Validate the batch
    const batch = await this.prisma.batch.findUnique({ where: { id: batchId } });
    if (!batch) throw new NotFoundException('Batch not found');
    if (batch.status !== 'OPEN' && batch.status !== 'ACTIVE') {
      throw new BadRequestException('Batch is not open for purchases');
    }

    // Calculate how many units are already purchased
    const currentInvestments = await this.prisma.investment.aggregate({
      where: { batchId, status: { not: 'CANCELLED' } },
      _sum: { units: true },
    });
    
    const purchasedUnits = currentInvestments._sum.units || 0;
    const availableUnits = batch.totalUnits - purchasedUnits;

    if (units > availableUnits) {
      throw new BadRequestException(`Only ${availableUnits} units available in this batch`);
    }

    // Calculate cost
    const costPerUnit =
      Number(batch.animalPrice) + Number(batch.feedingFee) + Number(batch.medicationFee);
    const totalAmount = costPerUnit * units;

    // Optional: deduct from wallet if there's balance, otherwise we leave it PENDING for a payment gateway
    // For now we just create the record as PENDING. The user will be redirected to payment.
    const purchase = await this.prisma.investment.create({
      data: {
        userId,
        batchId,
        units,
        amount: totalAmount,
        status: 'PENDING',
      },
    });

    return purchase;
  }

  async findAll() {
    return this.prisma.investment.findMany({
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          }
        },
        batch: {
          include: { animalType: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  async findAllByUser(userId: string) {
    return this.prisma.investment.findMany({
      where: { userId },
      include: {
        batch: {
          include: { animalType: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  async findOne(id: string, userId: string) {
    const purchase = await this.prisma.investment.findFirst({
      where: { id, userId },
      include: {
        batch: {
          include: { animalType: true }
        }
      }
    });
    if (!purchase) throw new NotFoundException('Purchase not found');
    return purchase;
  }

  async confirmPurchase(id: string) {
    const purchase = await this.prisma.investment.findUnique({ where: { id } });
    if (!purchase) throw new NotFoundException('Purchase not found');
    
    if (purchase.status === 'CONFIRMED') {
      throw new BadRequestException('Purchase is already confirmed');
    }
    
    if (purchase.status === 'CANCELLED') {
      throw new BadRequestException('Cannot confirm a cancelled purchase');
    }

    return this.prisma.investment.update({
      where: { id },
      data: { status: 'CONFIRMED' },
    });
  }

  async cancelPurchase(id: string, userId: string) {
    const purchase = await this.prisma.investment.findFirst({
      where: { id, userId },
    });

    if (!purchase) throw new NotFoundException('Purchase not found');
    
    if (purchase.status !== 'PENDING') {
      throw new BadRequestException('Only pending purchases can be cancelled');
    }

    return this.prisma.investment.update({
      where: { id },
      data: { status: 'CANCELLED' },
    });
  }
}
