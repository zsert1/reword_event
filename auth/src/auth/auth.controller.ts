import { Body, Controller, Get, Post } from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller()
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
}
