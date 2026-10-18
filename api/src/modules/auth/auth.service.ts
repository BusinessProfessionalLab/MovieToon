import { createHash, randomUUID } from 'node:crypto';
import { HttpException, HttpStatus, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { DataSource } from 'typeorm';
import { RefreshToken } from '../../database/entities/refresh-token.entity';
import { User } from '../../database/entities/user.entity';

export interface PublicUser {
  id: string;
  email: string;
  name: string;
  role: 'user' | 'admin';
  createdAt: number;
}

export interface CookieOptions {
  httpOnly: boolean;
  secure: boolean;
  sameSite: 'lax';
  path: string;
  maxAge?: number;
  domain?: string;
}

const ACCESS_COOKIE = 'mt_access';
const REFRESH_COOKIE = 'mt_refresh';

function sha256(raw: string): string {
  return createHash('sha256').update(raw, 'utf8').digest('hex');
}

function parseTtlSeconds(ttl: string): number {
  const m = /^(\d+)([smhd])$/.exec(ttl);
  if (!m) throw new Error(`Bad TTL: ${ttl}`);
  const n = Number(m[1]);
  const unit = m[2] === 's' ? 1 : m[2] === 'm' ? 60 : m[2] === 'h' ? 3600 : 86400;
  return n * unit;
}

@Injectable()
export class AuthService {
  private readonly accessTtlSec: number;
  private readonly refreshTtlSec: number;
  private readonly accessSecret: string;
  private readonly refreshSecret: string;

  constructor(
    private readonly dataSource: DataSource,
    private readonly jwt: JwtService,
    config: ConfigService,
  ) {
    this.accessTtlSec = parseTtlSeconds(config.get<string>('ACCESS_TOKEN_TTL', '15m'));
    this.refreshTtlSec = parseTtlSeconds(config.get<string>('REFRESH_TOKEN_TTL', '7d'));
    const accessSecret = config.get<string>('JWT_ACCESS_SECRET');
    const refreshSecret = config.get<string>('JWT_REFRESH_SECRET');
    if (!accessSecret || !refreshSecret) throw new Error('JWT secrets are not configured.');
    this.accessSecret = accessSecret;
    this.refreshSecret = refreshSecret;
  }

  cookieNames() {
    return { ACCESS_COOKIE, REFRESH_COOKIE };
  }

  cookieOptions(secure: boolean, domain: string | undefined, maxAge?: number): CookieOptions {
    return { httpOnly: true, secure, sameSite: 'lax', path: '/', ...(domain ? { domain } : {}), ...(maxAge !== undefined ? { maxAge } : {}) };
  }

  toPublic(user: User): PublicUser {
    return { id: user.id, email: user.email, name: user.name, role: user.role, createdAt: user.createdAt };
  }

  private signAccess(userId: string): string {
    return this.jwt.sign({ typ: 'access' }, { secret: this.accessSecret, subject: userId, expiresIn: this.accessTtlSec });
  }

  private signRefresh(userId: string, jti: string, family: string): string {
    return this.jwt.sign({ typ: 'refresh', jti, family }, { secret: this.refreshSecret, subject: userId, expiresIn: this.refreshTtlSec });
  }

  private async issuePair(user: User, family?: string) {
    const fam = family ?? randomUUID();
    const jti = randomUUID();
    const refreshToken = this.signRefresh(user.id, jti, fam);
    const expiresAt = Math.floor(Date.now() / 1000) + this.refreshTtlSec;
    await this.dataSource.getRepository(RefreshToken).insert({
      jti,
      userId: user.id,
      familyId: fam,
      tokenHash: sha256(refreshToken),
      expiresAt,
    });
    return {
      accessToken: this.signAccess(user.id),
      refreshToken,
      refreshExpiresAt: expiresAt,
    };
  }

  async register(name: string, email: string, password: string) {
    const normalized = email.trim().toLowerCase();
    const existing = await this.dataSource.getRepository(User).findOne({ where: { email: normalized } });
    if (existing) {
      throw new HttpException({ code: 'EMAIL_EXISTS', error: 'این ایمیل قبلاً ثبت شده است.' }, HttpStatus.CONFLICT);
    }
    const user = await this.dataSource.getRepository(User).save({
      id: randomUUID(),
      email: normalized,
      name: name.trim(),
      passwordHash: await bcrypt.hash(password, 10),
      role: 'user',
      createdAt: Math.floor(Date.now() / 1000),
    });
    const tokens = await this.issuePair(user);
    return { user: this.toPublic(user), ...tokens };
  }

  async login(email: string, password: string) {
    const normalized = email.trim().toLowerCase();
    const user = await this.dataSource
      .getRepository(User)
      .createQueryBuilder('u')
      .addSelect('u.passwordHash')
      .where('u.email = :email', { email: normalized })
      .getOne();
    const valid = user ? await bcrypt.compare(password, user.passwordHash).catch(() => false) : false;
    if (!user || !valid) {
      // Generic message — never reveal whether the email exists.
      throw new UnauthorizedException({ code: 'INVALID_CREDENTIALS', error: 'ایمیل یا رمز عبور اشتباه است.' });
    }
    const tokens = await this.issuePair(user);
    return { user: this.toPublic(user), ...tokens };
  }

  async refresh(rawToken: string | undefined) {
    if (!rawToken) {
      throw new UnauthorizedException({ code: 'UNAUTHORIZED', error: 'نشست یافت نشد؛ دوباره وارد شوید.' });
    }
    let claims: { sub: string; jti: string; family: string; typ: string };
    try {
      claims = this.jwt.verify(rawToken, { secret: this.refreshSecret }) as typeof claims;
    } catch {
      throw new UnauthorizedException({ code: 'UNAUTHORIZED', error: 'نشست نامعتبر است؛ دوباره وارد شوید.' });
    }
    if (claims.typ !== 'refresh' || !claims.jti || !claims.family) {
      throw new UnauthorizedException({ code: 'UNAUTHORIZED', error: 'نشست نامعتبر است؛ دوباره وارد شوید.' });
    }
    const repo = this.dataSource.getRepository(RefreshToken);
    const row = await repo.findOne({ where: { jti: claims.jti } });
    if (!row || row.userId !== claims.sub || row.familyId !== claims.family || row.tokenHash !== sha256(rawToken)) {
      throw new UnauthorizedException({ code: 'UNAUTHORIZED', error: 'نشست نامعتبر است؛ دوباره وارد شوید.' });
    }
    const now = Math.floor(Date.now() / 1000);
    if (row.revokedAt != null || (row.consumedAt != null && row.consumedAt > 0)) {
      // Reuse of a consumed/revoked token — revoke the whole family.
      await repo.update({ familyId: row.familyId }, { revokedAt: now });
      throw new UnauthorizedException({ code: 'UNAUTHORIZED', error: 'نشست باطل شد؛ دوباره وارد شوید.' });
    }
    if (row.expiresAt <= now) {
      throw new UnauthorizedException({ code: 'UNAUTHORIZED', error: 'نشست منقضی شده است؛ دوباره وارد شوید.' });
    }
    const newJti = randomUUID();
    const refreshToken = this.signRefresh(row.userId, newJti, row.familyId);
    const refreshExpiresAt = now + this.refreshTtlSec;
    await repo.update({ jti: row.jti }, { consumedAt: now, replacedBy: newJti });
    await repo.insert({
      jti: newJti,
      userId: row.userId,
      familyId: row.familyId,
      tokenHash: sha256(refreshToken),
      expiresAt: refreshExpiresAt,
    });
    const user = await this.dataSource.getRepository(User).findOneOrFail({ where: { id: row.userId } });
    return { user: this.toPublic(user), accessToken: this.signAccess(user.id), refreshToken, refreshExpiresAt };
  }

  async logout(rawToken: string | undefined): Promise<void> {
    if (!rawToken) return;
    try {
      const claims = this.jwt.verify(rawToken, { secret: this.refreshSecret }) as { jti?: string; family?: string; typ?: string };
      if (claims.typ === 'refresh' && claims.family) {
        await this.dataSource.getRepository(RefreshToken).update(
          { familyId: claims.family },
          { revokedAt: Math.floor(Date.now() / 1000) },
        );
      }
    } catch {
      // Best effort — never fail logout.
    }
  }

  async me(userId: string) {
    const user = await this.dataSource.getRepository(User).findOne({ where: { id: userId } });
    if (!user) {
      throw new UnauthorizedException({ code: 'UNAUTHORIZED', error: 'وارد حساب کاربری شوید.' });
    }
    return this.toPublic(user);
  }

  async verifyAccess(raw: string | undefined): Promise<string | null> {
    if (!raw) return null;
    try {
      const claims = this.jwt.verify(raw, { secret: this.accessSecret }) as { sub?: string; typ?: string };
      if (claims.typ !== 'access' || typeof claims.sub !== 'string') return null;
      return claims.sub;
    } catch {
      return null;
    }
  }
}
