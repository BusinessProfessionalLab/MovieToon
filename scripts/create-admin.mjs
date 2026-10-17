import { randomBytes, randomUUID, scryptSync } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { DatabaseSync } from 'node:sqlite';

const email = process.env.BOOTSTRAP_ADMIN_EMAIL?.trim().toLowerCase();
const name = process.env.BOOTSTRAP_ADMIN_NAME?.trim();
const password = process.env.BOOTSTRAP_ADMIN_PASSWORD;
if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) {
  throw new Error('Set a valid BOOTSTRAP_ADMIN_EMAIL in .env before running npm run admin:create.');
}
if (!name || name.length < 2 || name.length > 80) throw new Error('Set BOOTSTRAP_ADMIN_NAME (2–80 characters) in .env.');
if (!password || password.length < 12 || Buffer.byteLength(password) > 128) {
  throw new Error('Set BOOTSTRAP_ADMIN_PASSWORD (12–128 bytes) in .env.');
}

const databasePath = resolve(process.env.AUTH_DB_PATH ?? 'data/movietoon.sqlite');
mkdirSync(dirname(databasePath), { recursive: true });
const db = new DatabaseSync(databasePath, { timeout: 5000 });
db.exec(`CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE COLLATE NOCASE,
  name TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'user' CHECK(role IN ('user', 'admin')),
  created_at INTEGER NOT NULL
)`);
if (db.prepare('SELECT 1 FROM users WHERE email = ?').get(email)) {
  db.close();
  throw new Error('That email already belongs to an account. No changes were made.');
}
const salt = randomBytes(16);
const key = scryptSync(password, salt, 64, { N: 16_384, r: 8, p: 1, maxmem: 64 * 1024 * 1024 });
const passwordHash = `scrypt$16384$8$1$${salt.toString('base64url')}$${key.toString('base64url')}`;
db.prepare('INSERT INTO users (id, email, name, password_hash, role, created_at) VALUES (?, ?, ?, ?, ?, ?)').run(
  randomUUID(), email, name, passwordHash, 'admin', Math.floor(Date.now() / 1000),
);
db.close();

// The bootstrap password is one-time input, so remove it from the local env file.
try {
  const envPath = resolve('.env');
  const envText = readFileSync(envPath, 'utf8');
  const cleaned = envText.split(/\r?\n/).filter((line) => !/^\s*BOOTSTRAP_ADMIN_(EMAIL|NAME|PASSWORD)\s*=/.test(line)).join('\n');
  writeFileSync(envPath, cleaned.endsWith('\n') ? cleaned : `${cleaned}\n`, 'utf8');
} catch (error) {
  if (error?.code !== 'ENOENT') throw error;
}
console.log(`Created admin account for ${email}. Remove the bootstrap values from any other secret store too.`);
