// gateway/src/auth/auth.controller.ts
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Request,
  HttpStatus,
  UseGuards,
  InternalServerErrorException,
  Query,
} from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { AuthGuard } from '@nestjs/passport';
import { RoleGuard } from './role.guard';
import { Role } from './role.decorator';

@Controller('auth')
export class AuthController {
  constructor(private readonly httpService: HttpService) {}

  @Post('signup')
  async signup(@Body() body) {
    const response$ = this.httpService.post(
      'http://auth:3001/auth/signup',
      body,
    );
    const response = await firstValueFrom(response$);
    return { statusCode: HttpStatus.CREATED, data: response.data };
  }

  @Post('login')
  async login(@Body() body) {
    const response$ = this.httpService.post(
      'http://auth:3001/auth/login',
      body,
    );
    const response = await firstValueFrom(response$);
    return { statusCode: HttpStatus.OK, data: response.data };
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('me')
  async getMe(@Request() req) {
    const { sub: userId } = req.user;
    const response$ = this.httpService.get(
      `http://auth:3001/auth/user/${userId}`,
    );
    const response = await firstValueFrom(response$);

    return { statusCode: 200, data: response.data };
  }

  @UseGuards(AuthGuard('jwt'), RoleGuard)
  @Role('ADMIN')
  @Post('admin')
  async createAdmin(@Body() body, @Request() req) {
    const response$ = this.httpService.post(
      'http://auth:3001/auth/admin',
      body,
      {
        headers: { Authorization: req.headers.authorization },
      },
    );
    const response = await firstValueFrom(response$);
    return { statusCode: HttpStatus.CREATED, data: response.data };
  }

  @UseGuards(AuthGuard('jwt'), RoleGuard)
  @Role('ADMIN')
  @Patch('updateRole')
  async updateRole(@Body() body, @Request() req) {
    const response$ = this.httpService.patch(
      'http://auth:3001/auth/updateRole',
      body,
      {
        headers: { Authorization: req.headers.authorization },
      },
    );
    const response = await firstValueFrom(response$);
    return { statusCode: HttpStatus.OK, data: response.data };
  }

  @UseGuards(AuthGuard('jwt'), RoleGuard)
  @Role('ADMIN')
  @Delete(':id')
  async deleteUser(@Param('id') id: string, @Request() req) {
    const response$ = this.httpService.delete(`http://auth:3001/auth/${id}`, {
      headers: { Authorization: req.headers.authorization },
    });
    const response = await firstValueFrom(response$);
    return { statusCode: HttpStatus.OK, data: response.data };
  }

  @UseGuards(AuthGuard('jwt'), RoleGuard)
  @Role('ADMIN')
  @Get('users')
  async getUsersByRole(
    @Query('role') role: string,
  ): Promise<{ _id: string; username: string; role: string }[]> {
    try {
      const { data } = await firstValueFrom(
        this.httpService.get(`http://auth:3001/auth/users?role=${role}`),
      );
      return data;
    } catch (error) {
      console.error(`❌ ${role} 유저 목록 조회 실패:`, error.message);
      throw new InternalServerErrorException('유저 목록 조회 실패');
    }
  }
}
