import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class BankDetailsService {
  constructor(private prisma: PrismaService) {}

  async getDetails() {
    const details = await this.prisma.bankDetail.findFirst();
    if (!details) {
      throw new NotFoundException('Bank details not found');
    }
    return details;
  }

  async updateDetails(data: { accountNumber: string; bankName: string; accountName: string }) {
    const existing = await this.prisma.bankDetail.findFirst();
    
    if (existing) {
      return this.prisma.bankDetail.update({
        where: { id: existing.id },
        data,
      });
    } else {
      return this.prisma.bankDetail.create({
        data,
      });
    }
  }
}
