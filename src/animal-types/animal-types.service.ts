import { Injectable } from '@nestjs/common';
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
    return this.prisma.animalType.delete({ where: { id } });
  }
}
