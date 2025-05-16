import {
  Controller,
  Post,
  Body,
  UseGuards,
  HttpException,
  Request,
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
}
