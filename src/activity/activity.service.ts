import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ActivityService {
  constructor(private prisma: PrismaService) {}

  async log(data: {
    userId?: string;
    action: string;
    details?: string;
    entity?: string;
    entityId?: string;
    ip?: string;
    userAgent?: string;
  }) {
    try {
      return await this.prisma.activity.create({
        data: {
          ...data,
          createdAt: new Date(),
        },
      });
    } catch (error) {
      console.error('Failed to log activity:', error);
    }
  }

  async getRecent() {
    return this.prisma.activity.findMany({
      orderBy: { createdAt: 'desc' },
      take: 20,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });
  }

  async getByUser(userId: string) {
    return this.prisma.activity.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });
  }
}
