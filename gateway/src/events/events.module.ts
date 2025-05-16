import { Module } from '@nestjs/common';
import { EventsController } from './events.controller';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [HttpModule],
  controllers: [EventsController],
})
export class EventsModule {}
