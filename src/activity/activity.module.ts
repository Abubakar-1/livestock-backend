import { Module } from '@nestjs/common';
import { ActivityService } from './activity.service';
import { ActivityInterceptor } from '../common/interceptors/activity.interceptor';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [ActivityService, ActivityInterceptor],
  exports: [ActivityService],
})
export class ActivityModule {}
