import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Request,
} from '@nestjs/common';
import { EventService } from './event.service';
import { CreateEventDto } from './dto/event/create-event.dto';
import { EventResponseDto } from './dto/event/event-response.dto';
import { LogUserActionDto } from './dto/action/log-user-action.dto';
import { RewardHistoryQueryDto } from './dto/reward/reward-history-query.dto';
import { UpdateEventDto } from './dto/event/update-event.dto';
import { CreateRewardDto } from './dto/reward/create-reward.dto';

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

  @Get('reward/history')
  async getUserRewardHistory(
    @Request() req,
    @Query() query: RewardHistoryQueryDto,
  ) {
    const userId = req.headers['x-user-id'];
    const { startDate, endDate } = query;

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (start > end) {
      throw new BadRequestException('시작일은 종료일보다 앞서야 합니다.');
    }

    return this.eventService.getUserRewardHistory(userId, start, end);
  }

  @Get('reward/history/:userId')
  async getUserRewardHistoryByAdmin(
    @Param('userId') userId: string,
    @Query() query: RewardHistoryQueryDto,
  ) {
    const { startDate, endDate } = query;
    return this.eventService.getUserRewardHistory(
      userId,
      new Date(startDate),
      new Date(endDate),
    );
  }
  @Get(':eventId/progress')
  async getUserProgress(@Request() req, @Param('eventId') eventId: string) {
    const userId = req.headers['x-user-id'];
    return this.eventService.getUserEventProgress(userId, eventId);
  }
  @Get('progress')
  async getAllProgress(@Request() req) {
    const userId = req.headers['x-user-id'];
    return this.eventService.getUserAllProgress(userId);
  }

  @Patch(':id')
  async updateEvent(
    @Param('id') id: string,
    @Body() dto: UpdateEventDto,
    @Request() req,
  ) {
    const adminId = req.headers['x-user-id'];
    return this.eventService.updateEvent(id, dto, adminId);
  }

  @Delete(':id')
  async deleteEvent(@Param('id') id: string, @Request() req) {
    const adminId = req.headers['x-user-id'];
    return this.eventService.deleteEvent(id, adminId);
  }

  @Get('/reward')
  async getAllRewards() {
    return this.eventService.getAllRewards();
  }

  @Get('/reward/:id')
  async getRewardById(@Param('id') id: string) {
    return this.eventService.getRewardById(id);
  }

  @Post('/reward')
  async createReward(@Body() dto: CreateRewardDto, @Request() req) {
    const adminId = req.headers['x-user-id'];
    return this.eventService.createReward(dto, adminId);
  }
}
