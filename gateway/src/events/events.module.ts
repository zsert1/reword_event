import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { EventsController } from './events.controller';
import { EventGatewayService } from './event-gateway.service';

@Module({
  imports: [HttpModule],
  controllers: [EventsController],
  providers: [EventGatewayService],
})
export class EventsModule {}
