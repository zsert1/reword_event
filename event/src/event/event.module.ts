import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Event, EventSchema } from './schema/event/event.schema';
import { Reward, RewardSchema } from './schema/reward/reward.schema';
import {
  EventRewardMapping,
  EventRewardMappingSchema,
} from './schema/mapping/event-reward-mapping.schema';
import { EventController } from './event.controller';
import { EventService } from './event.service';
import {
  EventAdminLog,
  EventAdminLogSchema,
} from './schema/event/event-admin-log.schema';
import {
  RewardAdminLog,
  RewardAdminLogSchema,
} from './schema/log/reward-admin-log.schema';
import {
  UserEventProgress,
  UserEventProgressSchema,
} from './schema/event/user-event-progress.schema';
import {
  UserActionLog,
  UserActionLogSchema,
} from './schema/log/user-action-log.schema';
import {
  UserRewardHistory,
  UserRewardHistorySchema,
} from './schema/reward/user-reward-history.schema';

@Module({
  imports: [
    MongooseModule.forRoot('mongodb://mongodb:27017/event_db?replicaSet=rs0'),
    MongooseModule.forFeature([
      { name: Event.name, schema: EventSchema },
      { name: Reward.name, schema: RewardSchema },
      { name: EventRewardMapping.name, schema: EventRewardMappingSchema },
      { name: EventAdminLog.name, schema: EventAdminLogSchema },
      { name: RewardAdminLog.name, schema: RewardAdminLogSchema },
      { name: UserEventProgress.name, schema: UserEventProgressSchema },
      { name: UserActionLog.name, schema: UserActionLogSchema },
      { name: UserRewardHistory.name, schema: UserRewardHistorySchema },
    ]),
  ],
  controllers: [EventController],
  providers: [EventService],
})
export class EventModule {}
