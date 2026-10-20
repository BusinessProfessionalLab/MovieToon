import { CanActivate, ExecutionContext, ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Request } from 'express';
import { Repository } from 'typeorm';
import { User } from '../../database/entities/user.entity';
import { AuthService } from './auth.service';

/** Enforces logged-in admin (mt_access cookie + users.role === 'admin'). */
@Injectable()
export class AdminGuard implements CanActivate {
  constructor(
    private readonly auth: AuthService,
    @InjectRepository(User) private readonly users: Repository<User>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<Request & { user?: { id: string; role: string } }>();
    const raw = req.cookies?.['mt_access'] as string | undefined;
    const userId = await this.auth.verifyAccess(raw);
    if (!userId) {
      throw new UnauthorizedException({ code: 'UNAUTHORIZED', error: 'وارد حساب کاربری شوید.' });
    }
    const u = await this.users.findOne({ where: { id: userId } });
    if (!u || u.role !== 'admin') {
      throw new ForbiddenException({ code: 'FORBIDDEN', error: 'دسترسی ادمین لازم است.' });
    }
    req.user = { id: u.id, role: u.role };
    return true;
  }
}
