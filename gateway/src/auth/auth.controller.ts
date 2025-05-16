import {
  Body,
  Controller,
  Get,
  Post,
  Request,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { AuthGuard } from '@nestjs/passport';

@Controller('auth')
export class AuthController {
  constructor(private readonly httpService: HttpService) {}

  @Post('login')
  async login(@Body() body) {
    const response$ = this.httpService.post(
      'http://localhost:3001/auth/login',
      body,
    );
    const response = await firstValueFrom(response$);
    return {
      statusCode: HttpStatus.OK,
      data: response.data,
    };
  }

  @Post('signup')
  async signup(@Body() body) {
    const response$ = this.httpService.post(
      'http://localhost:3001/auth/signup',
      body,
    );
    const response = await firstValueFrom(response$);
    return {
      statusCode: HttpStatus.CREATED,
      data: response.data,
    };
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('me')
  async getMe(@Request() req) {
    const response$ = this.httpService.get('http://localhost:3001/auth/me', {
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
}
