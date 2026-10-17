import { createHash, createHmac, randomBytes, randomUUID, scrypt as scryptCallback, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';
import { clearRateLimit, createUser, db, findUserByEmail, findUserById, withTransaction, type User } from './database';

const scrypt = promisify(scryptCallback);
const ISSUER = 'movietoon';
const AUDIENCE = 'movietoon-web';
const ACCESS_TTL = 15 * 60;
const REFRESH_TTL = 7 * 24 * 60 * 60;
const PASSWORD_N = 16_384;
const PASSWORD_R = 8;
const PASSWORD_P = 1;
const PASSWORD_KEYLEN = 64;
const PASSWORD_MAXMEM = 64 * 1024 * 1024;
const dummySalt = Buffer.alloc(16, 9);

const configuredSecret = process.env.AUTH_JWT_SECRET;
if (process.env.NODE_ENV === 'production' && (!configuredSecret || Buffer.byteLength(configuredSecret) < 32)) {
  throw new Error('AUTH_JWT_SECRET must be set to at least 32 bytes in production.');
}
const secret = Buffer.from(configuredSecret ?? 'local-development-only-movietoon-secret-change-before-production');

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  refreshExpiresAt: number;
}

interface Claims {
  iss: string;
  aud: string;
  typ: 'access' | 'refresh';
  sub: string;
  iat: number;
  exp: number;
  jti?: string;
  family?: string;
}

function base64url(value: Buffer | string): string {
  return Buffer.from(value).toString('base64url');
}

function sign(claims: Claims): string {
  const header = base64url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const payload = base64url(JSON.stringify(claims));
  const input = `${header}.${payload}`;
  return `${input}.${createHmac('sha256', secret).update(input).digest('base64url')}`;
}

function verify(token: string, expectedType: Claims['typ'], allowExpired = false): Claims | null {
  try {
    if (token.length > 4096) return null;
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const [headerPart, payloadPart, signaturePart] = parts;
    const header = JSON.parse(Buffer.from(headerPart, 'base64url').toString('utf8')) as { alg?: string; typ?: string };
    if (header.alg !== 'HS256' || header.typ !== 'JWT') return null;
    const expected = createHmac('sha256', secret).update(`${headerPart}.${payloadPart}`).digest();
    const actual = Buffer.from(signaturePart, 'base64url');
    if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) return null;
    const claims = JSON.parse(Buffer.from(payloadPart, 'base64url').toString('utf8')) as Claims;
    const now = Math.floor(Date.now() / 1000);
    if (
      claims.iss !== ISSUER ||
      claims.aud !== AUDIENCE ||
      claims.typ !== expectedType ||
      typeof claims.sub !== 'string' ||
      !Number.isSafeInteger(claims.iat) ||
      !Number.isSafeInteger(claims.exp) ||
      claims.iat > now + 30 ||
      (!allowExpired && claims.exp <= now)
    ) return null;
    return claims;
  } catch {
    return null;
  }
}

function tokenHash(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

function safeHashEqual(a: string, b: string): boolean {
  const aa = Buffer.from(a, 'hex');
  const bb = Buffer.from(b, 'hex');
  return aa.length === bb.length && aa.length > 0 && timingSafeEqual(aa, bb);
}

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const key = (await scrypt(password, salt, PASSWORD_KEYLEN, {
    N: PASSWORD_N,
    r: PASSWORD_R,
    p: PASSWORD_P,
    maxmem: PASSWORD_MAXMEM,
  })) as Buffer;
  return `scrypt$${PASSWORD_N}$${PASSWORD_R}$${PASSWORD_P}$${salt.toString('base64url')}$${key.toString('base64url')}`;
}

async function verifyPassword(password: string, encoded?: string): Promise<boolean> {
  const parts = encoded?.split('$') ?? [];
  const isValidFormat = parts.length === 6 && parts[0] === 'scrypt';
  const N = isValidFormat ? Number(parts[1]) : PASSWORD_N;
  const r = isValidFormat ? Number(parts[2]) : PASSWORD_R;
  const p = isValidFormat ? Number(parts[3]) : PASSWORD_P;
  const salt = isValidFormat ? Buffer.from(parts[4], 'base64url') : dummySalt;
  const stored = isValidFormat ? Buffer.from(parts[5], 'base64url') : Buffer.alloc(PASSWORD_KEYLEN);
  if (!Number.isSafeInteger(N) || N < 16_384 || N > 131_072 || r !== PASSWORD_R || p !== PASSWORD_P || stored.length !== PASSWORD_KEYLEN) {
    return false;
  }
  const derived = (await scrypt(password, salt, stored.length, { N, r, p, maxmem: PASSWORD_MAXMEM })) as Buffer;
  return isValidFormat && timingSafeEqual(derived, stored);
}

function createAccessToken(user: User): string {
  const now = Math.floor(Date.now() / 1000);
  return sign({ iss: ISSUER, aud: AUDIENCE, typ: 'access', sub: user.id, iat: now, exp: now + ACCESS_TTL });
}

function createRefreshToken(user: User, family: string): { token: string; jti: string; expiresAt: number } {
  const now = Math.floor(Date.now() / 1000);
  const jti = randomUUID();
  const expiresAt = now + REFRESH_TTL;
  return {
    token: sign({ iss: ISSUER, aud: AUDIENCE, typ: 'refresh', sub: user.id, iat: now, exp: expiresAt, jti, family }),
    jti,
    expiresAt,
  };
}

function saveRefreshToken(user: User, family: string): string {
  const refresh = createRefreshToken(user, family);
  db.prepare('INSERT INTO refresh_tokens (jti, user_id, family_id, token_hash, expires_at) VALUES (?, ?, ?, ?, ?)').run(
    refresh.jti,
    user.id,
    family,
    tokenHash(refresh.token),
    refresh.expiresAt,
  );
  return refresh.token;
}

function makeTokens(user: User, refreshToken: string): AuthTokens {
  const claims = verify(refreshToken, 'refresh', true)!;
  return { accessToken: createAccessToken(user), refreshToken, refreshExpiresAt: claims.exp };
}

export function publicUser(user: User): Omit<User, 'created_at'> & { createdAt: number } {
  return { id: user.id, email: user.email, name: user.name, role: user.role, createdAt: user.created_at };
}

export async function registerUser(name: string, email: string, password: string): Promise<{ user: User; tokens: AuthTokens }> {
  const passwordHash = await hashPassword(password);
  return withTransaction(() => {
    const user = createUser({ id: randomUUID(), name, email, passwordHash, role: 'user' });
    const refreshToken = saveRefreshToken(user, randomUUID());
    return { user, tokens: makeTokens(user, refreshToken) };
  });
}

export async function createAdminUser(name: string, email: string, password: string): Promise<User> {
  return createUser({ id: randomUUID(), name, email, passwordHash: await hashPassword(password), role: 'admin' });
}

export function issueSession(user: User): AuthTokens {
  const refreshToken = withTransaction(() => saveRefreshToken(user, randomUUID()));
  return makeTokens(user, refreshToken);
}

export async function loginUser(email: string, password: string): Promise<{ user: User; tokens: AuthTokens } | null> {
  const user = findUserByEmail(email);
  const valid = await verifyPassword(password, user?.password_hash);
  if (!user || !valid) return null;
  clearRateLimit('login', email);
  return { user, tokens: issueSession(user) };
}

export function getUserFromAccessToken(token: string | undefined): User | null {
  if (!token) return null;
  const claims = verify(token, 'access');
  return claims ? findUserById(claims.sub) ?? null : null;
}

export function rotateRefreshToken(token: string | undefined): { user: User; tokens: AuthTokens } | null {
  if (!token) return null;
  const claims = verify(token, 'refresh');
  if (!claims?.jti || !claims.family) return null;
  return withTransaction(() => {
    const row = db.prepare('SELECT jti, user_id, family_id, token_hash, expires_at, consumed_at, revoked_at FROM refresh_tokens WHERE jti = ?').get(claims.jti) as
      | { jti: string; user_id: string; family_id: string; token_hash: string; expires_at: number; consumed_at: number | null; revoked_at: number | null }
      | undefined;
    if (!row || row.user_id !== claims.sub || row.family_id !== claims.family || !safeHashEqual(row.token_hash, tokenHash(token))) return null;
    const now = Math.floor(Date.now() / 1000);
    if (row.consumed_at) {
      db.prepare('UPDATE refresh_tokens SET revoked_at = COALESCE(revoked_at, ?) WHERE family_id = ?').run(now, row.family_id);
      return null;
    }
    if (row.revoked_at || row.expires_at <= now) return null;
    const user = findUserById(row.user_id);
    if (!user) return null;
    const next = createRefreshToken(user, row.family_id);
    db.prepare('UPDATE refresh_tokens SET consumed_at = ?, replaced_by = ? WHERE jti = ?').run(now, next.jti, row.jti);
    db.prepare('INSERT INTO refresh_tokens (jti, user_id, family_id, token_hash, expires_at) VALUES (?, ?, ?, ?, ?)').run(
      next.jti,
      user.id,
      row.family_id,
      tokenHash(next.token),
      next.expiresAt,
    );
    return { user, tokens: { accessToken: createAccessToken(user), refreshToken: next.token, refreshExpiresAt: next.expiresAt } };
  });
}

export function revokeRefreshToken(token: string | undefined): void {
  if (!token) return;
  const claims = verify(token, 'refresh', true);
  if (!claims?.jti || !claims.family) return;
  const row = db.prepare('SELECT token_hash, family_id FROM refresh_tokens WHERE jti = ?').get(claims.jti) as
    | { token_hash: string; family_id: string }
    | undefined;
  if (!row || row.family_id !== claims.family || !safeHashEqual(row.token_hash, tokenHash(token))) return;
  db.prepare('UPDATE refresh_tokens SET revoked_at = COALESCE(revoked_at, ?) WHERE family_id = ?').run(
    Math.floor(Date.now() / 1000),
    claims.family,
  );
}
