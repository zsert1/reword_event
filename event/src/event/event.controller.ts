import { Body, Controller, Post } from '@nestjs/common';
import { EventService } from './event.service';
import { CreateEventDto } from './dto/create-event.dto';

@Controller('event')
export class EventController {
  constructor(private readonly eventService: EventService) {}

  @Post('register/event')
  async createEvent(@Body() dto: CreateEventDto) {
    return this.eventService.createEvent(dto);
  }
}
