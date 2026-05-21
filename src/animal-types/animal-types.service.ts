import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AnimalTypesService {
  constructor(private prisma: PrismaService) {}

  async create(data: { name: string; description?: string }) {
    return this.prisma.animalType.create({ data });
  }

  async findAll() {
    return this.prisma.animalType.findMany();
  }

  async findOne(id: string) {
    return this.prisma.animalType.findUnique({ where: { id } });
  }

  async update(id: string, data: { name?: string; description?: string }) {
    return this.prisma.animalType.update({
      where: { id },
      data,
    });
  }

  async remove(id: string) {
    const animalType = await this.prisma.animalType.findUnique({
      where: { id },
      include: { _count: { select: { batches: true } } },
    });
    if (!animalType) throw new NotFoundException('Animal type not found');
    if (animalType._count.batches > 0) {
      throw new BadRequestException('Cannot delete an animal type that has batches');
    }

    await this.prisma.farmAnimal.deleteMany({ where: { animalTypeId: id } });
    return this.prisma.animalType.delete({ where: { id } });
  }
}
