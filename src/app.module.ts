import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { ActivityModule } from './activity/activity.module';
import { ActivityInterceptor } from './common/interceptors/activity.interceptor';
import { FarmsModule } from './farms/farms.module';
import { BatchesModule } from './batches/batches.module';
import { AnimalTypesModule } from './animal-types/animal-types.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { PurchasesModule } from './purchases/purchases.module';
import { BankDetailsModule } from './bank-details/bank-details.module';

import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 20, // 20 requests per minute by default
      },
    ]),
    PrismaModule,
    UsersModule,
    AuthModule,
    ActivityModule,
    FarmsModule,
    BatchesModule,
    AnimalTypesModule,
    AnalyticsModule,
    PurchasesModule,
    BankDetailsModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: ActivityInterceptor,
    },
  ],
})
export class AppModule {}

