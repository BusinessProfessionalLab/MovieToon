import { Body, Controller, Get, HttpCode, HttpStatus, Post, Req, Res, UseGuards } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiTags } from '@nestjs/swagger';
import type { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { JwtAuthGuard } from './jwt-auth.guard';
import { AuthRateLimitGuard } from './auth-rate-limit.guard';
import { CurrentUserId } from '../../common/current-user.decorator';

function cookieBase(config: ConfigService) {
  return {
    httpOnly: true,
    secure: config.get<boolean>('COOKIE_SECURE', false),
    sameSite: 'lax' as const,
    path: '/',
    ...(config.get<string>('COOKIE_DOMAIN') ? { domain: config.get<string>('COOKIE_DOMAIN') } : {}),
  };
}

@ApiTags('auth')
@Controller('api/auth')
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly config: ConfigService,
  ) {}

  private setCookies(res: Response, accessToken: string, refreshToken: string, refreshExpiresAt: number): void {
    const base = cookieBase(this.config);
    // Express `maxAge` is in milliseconds (unlike `Max-Age` seconds on the wire).
    const refreshMaxAgeMs = Math.max(0, refreshExpiresAt - Math.floor(Date.now() / 1000)) * 1000;
    res.cookie('mt_access', accessToken, { ...base, maxAge: 15 * 60 * 1000 });
    res.cookie('mt_refresh', refreshToken, { ...base, maxAge: refreshMaxAgeMs });
  }

  private clearCookies(res: Response): void {
    const base = cookieBase(this.config);
    res.cookie('mt_access', '', { ...base, maxAge: 0 });
    res.cookie('mt_refresh', '', { ...base, maxAge: 0 });
  }

  @Post('register')
  @UseGuards(AuthRateLimitGuard)
  async register(@Body() dto: RegisterDto, @Res({ passthrough: true }) res: Response) {
    const { user, accessToken, refreshToken, refreshExpiresAt } = await this.auth.register(dto.name, dto.email, dto.password);
    this.setCookies(res, accessToken, refreshToken, refreshExpiresAt);
    return { success: true, data: { user } };
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @UseGuards(AuthRateLimitGuard)
  async login(@Body() dto: LoginDto, @Res({ passthrough: true }) res: Response) {
    const { user, accessToken, refreshToken, refreshExpiresAt } = await this.auth.login(dto.email, dto.password);
    this.setCookies(res, accessToken, refreshToken, refreshExpiresAt);
    return { success: true, data: { user } };
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const raw = req.cookies?.['mt_refresh'] as string | undefined;
    const { user, accessToken, refreshToken, refreshExpiresAt } = await this.auth.refresh(raw);
    this.setCookies(res, accessToken, refreshToken, refreshExpiresAt);
    return { success: true, data: { user } };
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    await this.auth.logout(req.cookies?.['mt_refresh']);
    this.clearCookies(res);
    return { success: true, data: null };
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async me(@CurrentUserId() userId: string) {
    return { success: true, data: await this.auth.me(userId) };
  }
}
