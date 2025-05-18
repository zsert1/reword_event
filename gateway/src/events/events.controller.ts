import {
  Controller,
  Post,
  Body,
  UseGuards,
  HttpException,
  Request,
  Get,
  Query,
  Param,
  Patch,
  Delete,
} from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { AuthGuard } from '@nestjs/passport';

import { firstValueFrom } from 'rxjs';
import { Role } from 'src/auth/role.decorator';
import { RoleGuard } from 'src/auth/role.guard';
import { EventGatewayService } from './event-gateway.service';

@Controller('event')
export class EventsController {
  constructor(
    private readonly httpService: HttpService,
    private readonly eventGatewayService: EventGatewayService,
  ) {}

  @Post('register')
  @UseGuards(AuthGuard('jwt'), RoleGuard)
  @Role('ADMIN', 'OPERATOR')
  async registerEvent(@Body() body: any, @Request() req) {
    try {
      const userIds = await this.eventGatewayService.getUserIdsByRole('USER');
      const { sub: userId } = req.user;
      const enrichedBody = {
        ...body,
        adminId: userId,
        userIds,
      };
      const response = await firstValueFrom(
        this.httpService.post(
          'http://event:3002/event/register/event',
          enrichedBody,
        ),
      );
      return response.data;
    } catch (error) {
      const status = error.response?.status || 500;
      const message =
        error.response?.data?.message || 'Event registration failed';

      throw new HttpException(
        {
          statusCode: status,
          message,
          from: 'event-service',
        },
        status,
      );
    }
  }
  @Get()
  @UseGuards(AuthGuard('jwt'))
  async getAllEvents(@Query('status') status: 'ongoing' | 'ended') {
    try {
      const response = await firstValueFrom(
        this.httpService.get('http://event:3002/event', {
          params: { status },
        }),
      );
      return response.data;
    } catch (error) {
      throw new HttpException(
        {
          statusCode: error.response?.status || 500,
          message: error.response?.data?.message || '이벤트 조회 실패',
          from: 'event-service',
        },
        error.response?.status || 500,
      );
    }
  }
  @Get(':id')
  @UseGuards(AuthGuard('jwt'))
  async getEventById(@Param('id') id: string) {
    try {
      const response = await firstValueFrom(
        this.httpService.get(`http://event:3002/event/${id}`),
      );
      return response.data;
    } catch (error) {
      throw new HttpException(
        {
          statusCode: error.response?.status || 500,
          message: error.response?.data?.message || '이벤트 상세 조회 실패',
          from: 'event-service',
        },
        error.response?.status || 500,
      );
    }
  }
  @Post(':id/claim')
  @UseGuards(AuthGuard('jwt'))
  @Role('USER')
  async claimReward(@Param('id') eventId: string, @Request() req) {
    try {
      const userId = req.user.sub;

      const response = await firstValueFrom(
        this.httpService.post(
          `http://event:3002/event/${eventId}/claim`,
          {},
          {
            headers: {
              'x-user-id': userId,
            },
          },
        ),
      );

      return response.data;
    } catch (error) {
      const status = error.response?.status || 500;
      const message =
        error.response?.data?.message ||
        error.message ||
        'Internal server error';

      throw new HttpException(
        {
          statusCode: status,
          message,
          from: 'event-service',
        },
        status,
      );
    }
  }

  @Post('log-action')
  @UseGuards(AuthGuard('jwt'), RoleGuard)
  @Role('USER', 'OPERATOR', 'ADMIN')
  async logUserAction(@Request() req, @Body() body: any) {
    const userId = req.user.sub;

    const response = await firstValueFrom(
      this.httpService.post(
        'http://event:3002/event/log-action',
        {
          ...body,
        },
        {
          headers: {
            'x-user-id': userId,
          },
        },
      ),
    );

    return response.data;
  }

  @Get('reward/history')
  @UseGuards(AuthGuard('jwt'))
  @Role('USER')
  async getMyRewardHistory(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Request() req,
  ) {
    const userId = req.user.sub;
    const url = `http://event:3002/event/reward/history?startDate=${startDate}&endDate=${endDate}`;

    const response = await firstValueFrom(
      this.httpService.get(url, {
        headers: {
          'x-user-id': userId,
        },
      }),
    );
    return response.data;
  }

  @Get('reward/history/:userId')
  @UseGuards(AuthGuard('jwt'))
  @Role('ADMIN', 'OPERATOR', 'AUDITOR')
  async getRewardHistoryByAdmin(
    @Param('userId') userId: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    const url = `http://event:3002/event/reward/history/${userId}?startDate=${startDate}&endDate=${endDate}`;

    const response = await firstValueFrom(this.httpService.get(url));
    return response.data;
  }

  @Get(':eventId/progress')
  @UseGuards(AuthGuard('jwt'))
  @Role('USER')
  async getMyEventProgress(@Param('eventId') eventId: string, @Request() req) {
    const userId = req.user.sub;
    const response = await firstValueFrom(
      this.httpService.get(`http://event:3002/event/${eventId}/progress`, {
        headers: {
          'x-user-id': userId,
        },
      }),
    );
    return response.data;
  }

  @Get('progress')
  @UseGuards(AuthGuard('jwt'))
  @Role('USER')
  async getAllMyProgress(@Request() req) {
    const userId = req.user.sub;
    const response = await firstValueFrom(
      this.httpService.get(`http://event:3002/event/progress`, {
        headers: {
          'x-user-id': userId,
        },
      }),
    );
    return response.data;
  }

  @Patch('event/:id')
  @UseGuards(AuthGuard('jwt'))
  @Role('OPERATOR', 'ADMIN')
  async patchEventById(
    @Param('id') id: string,
    @Body() dto: any,
    @Request() req,
  ) {
    const adminId = req.user.sub;
    const response = await firstValueFrom(
      this.httpService.patch(`http://event:3002/event/${id}`, dto, {
        headers: {
          'x-user-id': adminId,
        },
      }),
    );
    return response.data;
  }

  @Delete('event/:id')
  @UseGuards(AuthGuard('jwt'))
  @Role('OPERATOR', 'ADMIN')
  async deleteEventProxy(@Param('id') id: string, @Request() req) {
    const adminId = req.user.sub;
    const response = await firstValueFrom(
      this.httpService.delete(`http://event:3002/event/${id}`, {
        headers: { 'x-user-id': adminId },
      }),
    );
    return response.data;
  }

  // ✅ 전체 보상 조회
  @Get('reward')
  @UseGuards(AuthGuard('jwt'))
  @Role('OPERATOR', 'ADMIN')
  async getAllRewards() {
    const response = await firstValueFrom(
      this.httpService.get(`http://event:3002/event/reward`),
    );
    return response.data;
  }

  // ✅ 보상 단건 조회
  @Get('reward/:id')
  @UseGuards(AuthGuard('jwt'))
  @Role('OPERATOR', 'ADMIN')
  async getRewardById(@Param('id') id: string) {
    const response = await firstValueFrom(
      this.httpService.get(`http://event:3002/event/reward/${id}`),
    );
    return response.data;
  }

  // ✅ 보상 생성 + 이벤트 연결
  @Post('reward')
  @UseGuards(AuthGuard('jwt'))
  @Role('OPERATOR', 'ADMIN')
  async createReward(@Body() dto: any, @Request() req) {
    const adminId = req.user.sub;
    const response = await firstValueFrom(
      this.httpService.post(`http://event:3002/event/reward`, dto, {
        headers: {
          'x-user-id': adminId,
        },
      }),
    );
    return response.data;
  }
}
