// E2E: top10 + home-animation admin endpoints.
const BASE = 'http://localhost:3001';
const pg = require('pg');
(async () => {
  const c = new pg.Client({
    host: process.env.DB_HOST, port: Number(process.env.DB_PORT),
    user: process.env.DB_USERNAME, password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  });
  await c.connect();
  const t = await c.query(`SELECT slug FROM titles WHERE type='movie' ORDER BY imdb DESC LIMIT 3`);
  await c.end();
  const slugs = t.rows.map((r) => r.slug);

  const login = await fetch(BASE + '/api/auth/login', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@movietoon.example.ir', password: 'admin123' }),
  });
  console.log('login:', login.status);
  const cookie = (login.headers.getSetCookie ? login.headers.getSetCookie() : []).map((s) => s.split(';')[0]).join('; ');
  const put = (path, body) => fetch(BASE + path, {
    method: 'PUT', headers: { 'Content-Type': 'application/json', cookie }, body: JSON.stringify(body),
  });

  let r = await put('/api/titles/top10', { slugs });
  console.log('PUT top10:', r.status, (await r.text()).slice(0, 120));
  let top = await (await fetch(BASE + '/api/titles/top')).json();
  console.log('top count:', top.data.length, '| ranks:', top.data.map((x) => x.top10Rank).join(','));

  r = await put('/api/titles/home-animation', { slugs: slugs.slice(0, 2) });
  console.log('PUT home-animation:', r.status, (await r.text()).slice(0, 120));
  const ha = await (await fetch(BASE + '/api/titles?homeAnimation=true&page=1&pageSize=30')).json();
  console.log('homeAnimation count:', ha.meta.total);

  r = await put('/api/titles/top10', { slugs: [] });
  console.log('PUT top10 clear:', r.status);
  top = await (await fetch(BASE + '/api/titles/top')).json();
  console.log('top after clear:', top.data.length);
  r = await put('/api/titles/home-animation', { slugs: [] });
  console.log('PUT home-animation clear:', r.status);

  r = await fetch(BASE + '/api/titles/top10', {
    method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ slugs }),
  });
  console.log('PUT top10 anon (expect 401):', r.status);
  r = await put('/api/titles/top10', { slugs: Array.from({ length: 11 }, (_, i) => 'x' + i) });
  console.log('PUT top10 11 slugs (expect 400):', r.status);
})().catch((e) => { console.error('E2E_ERR:', e.message); process.exit(1); });
