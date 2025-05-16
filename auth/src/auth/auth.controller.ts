import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Request,
} from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('signup')
  signup(@Body() body: { username: string; password: string }) {
    return this.authService.signup(body.username, body.password);
  }

  @Post('login')
  async login(
    @Body() body: { username: string; password: string },
    @Request() req,
  ) {
    return this.authService.login(body.username, body.password, req);
  }
  @Get('user/:id')
  async getUser(@Param('id') id: string) {
    return this.authService.getMyInfo(id);
  }

  @Post('admin')
  createAdmin(@Body() body: { username: string; password: string }) {
    return this.authService.createAdmin(body.username, body.password);
  }

  @Patch('updateroles')
  updateRoles(@Body() body: { userId: string; role: string }) {
    return this.authService.updateRoles(body.userId, body.role);
  }

  @Delete(':id')
  deleteUser(@Param('id') id: string) {
    return this.authService.deleteUser(id);
  }
}
