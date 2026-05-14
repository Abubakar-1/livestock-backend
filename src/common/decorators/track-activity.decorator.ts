import { SetMetadata } from '@nestjs/common';

export const TRACK_ACTIVITY_KEY = 'track_activity';

export interface TrackActivityOptions {
  action: string;
  entity?: string;
}

export const TrackActivity = (action: string, entity?: string) =>
  SetMetadata(TRACK_ACTIVITY_KEY, { action, entity });
