import {
  Body,
  Controller,
  Get,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { Request as ExpressRequest } from 'express';
import { JwtPayload } from '@food-delivery/types';

@Controller('auth') // api/auth
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register') //api/auth/register
  async register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post('login') // api/auth/login
  async login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me') // api/auth/me
  me(@Request() req: ExpressRequest & { user: JwtPayload }) {
    return req.user;
  }
}
