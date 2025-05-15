import {
  Body,
  Controller,
  Get,
  Post,
  UseGuards,
  Request,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthGuard } from '@nestjs/passport';
import { Roles } from 'src/roles.decorator';
import { RolesGuard } from 'src/roles.guard';
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get()
  getHello(): string {
    return this.authService.getHello();
  }

  @Post('singup')
  singup(@Body() body: { username: string; password: string }) {
    return this.authService.signup(body.username, body.password);
  }

  @Post('login')
  async login(
    @Body() body: { username: string; password: string },
    @Request() req,
  ) {
    return this.authService.login(body.username, body.password, req);
  }
  @UseGuards(AuthGuard('jwt'))
  @Get('me')
  getMe(@Request() req) {
    return req.user;
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('ADMIN')
  @Get('admin-only')
  getAdminOnly(@Request() req) {
    return req.user;
  }
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('USER')
  @Get('user-only')
  getUserOnly(@Request() req) {
    return req.user;
  }
}
