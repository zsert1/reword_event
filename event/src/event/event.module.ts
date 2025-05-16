import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Event, EventSchema } from './schema/event.schema';
import { Reward, RewardSchema } from './schema/reward.schema';
import {
  EventRewardMapping,
  EventRewardMappingSchema,
} from './schema/event-reward-mapping.schema';
import { EventController } from './event.controller';
import { EventService } from './event.service';
import {
  EventAdminLog,
  EventAdminLogSchema,
} from './schema/event-admin-log.schema';
import {
  RewardAdminLog,
  RewardAdminLogSchema,
} from './schema/reward-admin-log.schema';

@Module({
  imports: [
    MongooseModule.forRoot('mongodb://mongodb:27017/event_db'),
    MongooseModule.forFeature([
      { name: Event.name, schema: EventSchema },
      { name: Reward.name, schema: RewardSchema },
      { name: EventRewardMapping.name, schema: EventRewardMappingSchema },
      { name: EventAdminLog.name, schema: EventAdminLogSchema },
      { name: RewardAdminLog.name, schema: RewardAdminLogSchema },
    ]),
  ],
  controllers: [EventController],
  providers: [EventService],
})
export class EventModule {}
