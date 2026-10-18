import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { Request } from 'express';
import { AuthService } from './auth.service';

/** Reads the mt_access HttpOnly cookie, enforces typ=access, attaches user id. */
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly auth: AuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<Request & { user?: { id: string } }>();
    const raw = req.cookies?.['mt_access'] as string | undefined;
    const userId = await this.auth.verifyAccess(raw);
    if (!userId) {
      throw new UnauthorizedException({ code: 'UNAUTHORIZED', error: 'وارد حساب کاربری شوید.' });
    }
    req.user = { id: userId };
    return true;
  }
}
