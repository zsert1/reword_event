import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import { EventService } from './event.service';
import { CreateEventDto } from './dto/create-event.dto';
import { EventResponseDto } from './dto/event-response.dto';

@Controller('event')
export class EventController {
  constructor(private readonly eventService: EventService) {}

  @Post('register/event')
  async createEvent(@Body() dto: CreateEventDto) {
    return this.eventService.createEvent(dto);
  }
  @Get()
  async getAllEvents(
    @Query('status') status?: 'ongoing' | 'ended',
  ): Promise<EventResponseDto[]> {
    if (status && status !== 'ongoing' && status !== 'ended') {
      throw new BadRequestException(
        'status는 ongoing 또는 ended만 허용됩니다.',
      );
    }
    return this.eventService.getAllEvents(status);
  }

  @Get(':id')
  async getEventById(@Param('id') id: string): Promise<EventResponseDto> {
    return this.eventService.getEventById(id);
  }
}
