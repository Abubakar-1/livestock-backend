import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { ActivityService } from '../../activity/activity.service';
import { TRACK_ACTIVITY_KEY, TrackActivityOptions } from '../decorators/track-activity.decorator';

@Injectable()
export class ActivityInterceptor implements NestInterceptor {
  constructor(
    private reflector: Reflector,
    private activityService: ActivityService,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const trackOptions = this.reflector.get<TrackActivityOptions>(
      TRACK_ACTIVITY_KEY,
      context.getHandler(),
    );

    if (!trackOptions) {
      return next.handle();
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const ip = request.ip;
    const userAgent = request.headers['user-agent'];

    return next.handle().pipe(
      tap(async (response) => {
        // Extract entityId from response if possible
        let entityId: string | undefined = undefined;
        if (response?.data?.id) {
          entityId = response.data.id;
        } else if (response?.id) {
          entityId = response.id;
        }

        await this.activityService.log({
          userId: user?.id || user?.sub,
          action: trackOptions.action,
          entity: trackOptions.entity,
          entityId,
          details: `Method: ${request.method} Path: ${request.url}`,
          ip,
          userAgent,
        });
      }),
    );
  }
}
