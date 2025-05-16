import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { EventsController } from './events.controller';

@Module({
  imports: [HttpModule],
  controllers: [EventsController],
})
export class EventsModule {}
