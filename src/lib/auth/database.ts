import { mkdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { dirname, resolve } from 'node:path';
import { DatabaseSync } from 'node:sqlite';

const databasePath = resolve(process.env.AUTH_DB_PATH ?? 'data/movietoon.sqlite');
mkdirSync(dirname(databasePath), { recursive: true });

export const db = new DatabaseSync(databasePath, { timeout: 5000 });
db.exec('PRAGMA foreign_keys = ON; PRAGMA journal_mode = WAL;');
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT NOT NULL UNIQUE COLLATE NOCASE,
    name TEXT NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'user' CHECK(role IN ('user', 'admin')),
    created_at INTEGER NOT NULL
  );
  CREATE TABLE IF NOT EXISTS refresh_tokens (
    jti TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    family_id TEXT NOT NULL,
    token_hash TEXT NOT NULL,
    expires_at INTEGER NOT NULL,
    consumed_at INTEGER,
    revoked_at INTEGER,
    replaced_by TEXT
  );
  CREATE INDEX IF NOT EXISTS refresh_tokens_user_id ON refresh_tokens(user_id);
  CREATE INDEX IF NOT EXISTS refresh_tokens_family_id ON refresh_tokens(family_id);
  CREATE TABLE IF NOT EXISTS auth_rate_limits (
    key TEXT PRIMARY KEY,
    window_started_at INTEGER NOT NULL,
    attempts INTEGER NOT NULL
  );
`);

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'user' | 'admin';
  created_at: number;
}

export function findUserByEmail(email: string): (User & { password_hash: string }) | undefined {
  return db.prepare('SELECT id, email, name, role, created_at, password_hash FROM users WHERE email = ?').get(email) as
    | (User & { password_hash: string })
    | undefined;
}

export function findUserById(id: string): User | undefined {
  return db.prepare('SELECT id, email, name, role, created_at FROM users WHERE id = ?').get(id) as User | undefined;
}

export function createUser(input: { id: string; email: string; name: string; passwordHash: string; role?: User['role'] }): User {
  const createdAt = Math.floor(Date.now() / 1000);
  db.prepare('INSERT INTO users (id, email, name, password_hash, role, created_at) VALUES (?, ?, ?, ?, ?, ?)').run(
    input.id,
    input.email,
    input.name,
    input.passwordHash,
    input.role ?? 'user',
    createdAt,
  );
  return findUserById(input.id)!;
}

export function withTransaction<T>(operation: () => T): T {
  db.exec('BEGIN IMMEDIATE');
  try {
    const result = operation();
    db.exec('COMMIT');
    return result;
  } catch (error) {
    db.exec('ROLLBACK');
    throw error;
  }
}

export function checkRateLimit(scope: string, identity: string, limit = 10, windowSeconds = 900): boolean {
  const now = Math.floor(Date.now() / 1000);
  const key = createHash('sha256').update(`${scope}:${identity}`).digest('hex');
  const row = db.prepare('SELECT window_started_at, attempts FROM auth_rate_limits WHERE key = ?').get(key) as
    | { window_started_at: number; attempts: number }
    | undefined;
  if (!row || now - row.window_started_at >= windowSeconds) {
    db.prepare(`INSERT INTO auth_rate_limits (key, window_started_at, attempts) VALUES (?, ?, 1)
      ON CONFLICT(key) DO UPDATE SET window_started_at = excluded.window_started_at, attempts = 1`).run(key, now);
    return true;
  }
  if (row.attempts >= limit) return false;
  db.prepare('UPDATE auth_rate_limits SET attempts = attempts + 1 WHERE key = ?').run(key);
  return true;
}

export function clearRateLimit(scope: string, identity: string): void {
  const key = createHash('sha256').update(`${scope}:${identity}`).digest('hex');
  db.prepare('DELETE FROM auth_rate_limits WHERE key = ?').run(key);
}
