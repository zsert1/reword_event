import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Request,
} from '@nestjs/common';
import { EventService } from './event.service';
import { CreateEventDto } from './dto/create-event.dto';
import { EventResponseDto } from './dto/event-response.dto';
import { LogUserActionDto } from './dto/log-user-action.dto';

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

  @Post('log-action')
  async logUserAction(@Request() req, @Body() dto: LogUserActionDto) {
    const userId = req.headers['x-user-id'];
    return this.eventService.logUserAction(userId, dto);
  }
  @Post(':id/claim')
  async claimReward(@Request() req, @Param('id') eventId: string) {
    const userId = req.headers['x-user-id'];
    return this.eventService.claimReward(userId, eventId);
  }
}
