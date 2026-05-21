import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class FarmsService {
  constructor(private prisma: PrismaService) {}

  async create(data: { name: string; location: string }) {
    return this.prisma.farm.create({ data });
  }

  async findAll() {
    return this.prisma.farm.findMany({
      include: {
        animals: {
          include: {
            animalType: true,
          },
        },
      },
    });
  }

  async findOne(id: string) {
    const farm = await this.prisma.farm.findUnique({
      where: { id },
      include: {
        animals: {
          include: {
            animalType: true,
          },
        },
      },
    });
    if (!farm) throw new NotFoundException('Farm not found');
    return farm;
  }

  async update(id: string, data: { name?: string; location?: string }) {
    return this.prisma.farm.update({
      where: { id },
      data,
    });
  }

  async remove(id: string) {
    const farm = await this.prisma.farm.findUnique({
      where: { id },
      include: { _count: { select: { batchFarms: true } } },
    });
    if (!farm) throw new NotFoundException('Farm not found');
    if (farm._count.batchFarms > 0) {
      throw new BadRequestException('Cannot delete a farm that is allocated to batches');
    }

    await this.prisma.farmAnimal.deleteMany({ where: { farmId: id } });
    return this.prisma.farm.delete({ where: { id } });
  }

  // --- Animal Inventory Management ---

  async addAnimals(farmId: string, animalTypeId: string, quantity: number) {
    return this.prisma.farmAnimal.upsert({
      where: {
        farmId_animalTypeId: { farmId, animalTypeId },
      },
      update: {
        quantity: { increment: quantity },
      },
      create: {
        farmId,
        animalTypeId,
        quantity,
      },
    });
  }

  async setAnimals(farmId: string, animalTypeId: string, quantity: number) {
    return this.prisma.farmAnimal.upsert({
      where: {
        farmId_animalTypeId: { farmId, animalTypeId },
      },
      update: { quantity },
      create: { farmId, animalTypeId, quantity },
    });
  }
}
