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
} from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { AuthGuard } from '@nestjs/passport';

import { firstValueFrom } from 'rxjs';
import { Role } from 'src/auth/role.decorator';
import { RoleGuard } from 'src/auth/role.guard';

@Controller('event')
export class EventsController {
  constructor(private readonly httpService: HttpService) {}

  @Post('register')
  @UseGuards(AuthGuard('jwt'), RoleGuard)
  @Role('ADMIN', 'OPERATOR')
  async registerEvent(@Body() body: any, @Request() req) {
    try {
      const { sub: userId } = req.user;
      const enrichedBody = {
        ...body,
        adminId: userId,
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
}
