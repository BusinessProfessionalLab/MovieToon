// One-off: create admin user + e2e the hero featured endpoint.
const pg = require('pg');
const bcrypt = require('bcryptjs');
const BASE = 'http://localhost:3001';
(async () => {
  const c = new pg.Client({
    host: process.env.DB_HOST, port: Number(process.env.DB_PORT),
    user: process.env.DB_USERNAME, password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  });
  await c.connect();
  const hash = await bcrypt.hash('admin123', 10);
  await c.query(
    `INSERT INTO users (id, email, name, password_hash, role, created_at)
     VALUES ('00000000-0000-4000-8000-000000000099', 'admin@movietoon.example.ir', 'مدیر', $1, 'admin', $2)
     ON CONFLICT (email) DO UPDATE SET role='admin', password_hash=EXCLUDED.password_hash`,
    [hash, Math.floor(Date.now() / 1000)],
  );
  const t = await c.query(`SELECT slug FROM titles WHERE type='movie' ORDER BY imdb DESC LIMIT 2`);
  const slugs = t.rows.map((r) => r.slug);
  console.log('pick slugs:', slugs);
  await c.end();

  const login = await fetch(BASE + '/api/auth/login', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@movietoon.example.ir', password: 'admin123' }),
  });
  console.log('login:', login.status);
  const setCookies = login.headers.getSetCookie ? login.headers.getSetCookie() : [];
  const cookie = setCookies.map((s) => s.split(';')[0]).join('; ');

  const put = await fetch(BASE + '/api/titles/featured', {
    method: 'PUT', headers: { 'Content-Type': 'application/json', cookie },
    body: JSON.stringify({ slugs }),
  });
  console.log('PUT featured:', put.status, (await put.text()).slice(0, 200));

  const feat = await fetch(BASE + '/api/titles?featured=true&page=1&pageSize=30');
  const fj = await feat.json();
  console.log('featured count:', fj.meta.total, '| first:', fj.data[0]?.titleFa);

  const clear = await fetch(BASE + '/api/titles/featured', {
    method: 'PUT', headers: { 'Content-Type': 'application/json', cookie },
    body: JSON.stringify({ slugs: [] }),
  });
  console.log('PUT clear:', clear.status, (await clear.text()).slice(0, 200));
  const feat2 = await (await fetch(BASE + '/api/titles?featured=true&page=1&pageSize=5')).json();
  console.log('featured after clear:', feat2.meta.total);

  // Non-admin must be rejected
  const anon = await fetch(BASE + '/api/titles/featured', {
    method: 'PUT', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ slugs }),
  });
  console.log('PUT anon (expect 401):', anon.status);
})().catch((e) => { console.error('E2E_ERR:', e.message); process.exit(1); });
