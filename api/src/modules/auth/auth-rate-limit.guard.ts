import { CanActivate, ExecutionContext, HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { Request } from 'express';

/**
 * Best-effort in-memory rate limit for login/register: 5 attempts per
 * 15 minutes per IP+email. Single-instance only (documented limitation).
 */
const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 5;

const hits = new Map<string, number[]>();

@Injectable()
export class AuthRateLimitGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<Request>();
    const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : 'unknown';
    const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req.ip || 'unknown';
    const key = `${req.method}:${req.path}:${ip}:${email}`;
    const now = Date.now();
    const recent = (hits.get(key) ?? []).filter((t) => now - t < WINDOW_MS);
    if (recent.length >= MAX_ATTEMPTS) {
      hits.set(key, recent);
      throw new HttpException(
        { code: 'RATE_LIMITED', error: 'درخواست‌های زیادی ثبت شد. چند دقیقه بعد تلاش کنید.' },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
    recent.push(now);
    hits.set(key, recent);
    return true;
  }
}

export function resetAuthRateLimits(): void {
  hits.clear();
}
