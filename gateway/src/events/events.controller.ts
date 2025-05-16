import {
  Body,
  Controller,
  Post,
  UseGuards,
  Request,
  HttpStatus,
  Get,
  Param,
} from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { AuthGuard } from '@nestjs/passport';
import { Role } from '../auth/role.decorator';
import { RoleGuard } from '../auth/role.guard';
import { firstValueFrom } from 'rxjs';

@Controller('events')
@UseGuards(AuthGuard('jwt'), RoleGuard)
export class EventsController {
  constructor(private readonly httpService: HttpService) {}

  @Post()
  @Role('OPERATOR', 'ADMIN')
  async createEvent(@Body() body, @Request() req) {
    const response$ = this.httpService.post(
      'http://localhost:3002/events',
      body,
      {
        headers: {
          Authorization: req.headers.authorization,
        },
      },
    );

    const response = await firstValueFrom(response$);
    return {
      statusCode: HttpStatus.CREATED,
      data: response.data,
    };
  }
  @Get()
  async getEvents(@Request() req) {
    const response$ = this.httpService.get('http://localhost:3002/events', {
      headers: {
        Authorization: req.headers.authorization,
      },
    });
    const response = await firstValueFrom(response$);
    return {
      statusCode: HttpStatus.OK,
      data: response.data,
    };
  }

  @Get(':id')
  async getEventDetail(@Param('id') id: string, @Request() req) {
    const response$ = this.httpService.get(
      `http://localhost:3002/events/${id}`,
      {
        headers: {
          Authorization: req.headers.authorization,
        },
      },
    );
    const response = await firstValueFrom(response$);
    return {
      statusCode: HttpStatus.OK,
      data: response.data,
    };
  }
}
