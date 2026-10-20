// One-off: copy ALL local data to Neon. Secrets via env only (never in files).
// Usage: $env:NEON_URL='postgresql://...'; node --env-file=.env scripts/transfer-neon.cjs
const pg = require('pg');

const TABLES = [
  'users', 'genres', 'actors', 'titles', 'collections', 'episodes',
  'download_links', 'title_actors', 'collection_titles', 'comments',
  'contact_messages', 'reports', 'refresh_tokens', 'favorites',
  'watchlist_items', 'watch_progress',
];
const SERIAL_ID = new Set(['episodes', 'download_links', 'comments', 'contact_messages', 'reports']);

const stripChannelBinding = (url) => url.replace(/[?&]channel_binding=[^&]*/g, (m) => (m[0] === '?' ? '?' : '')).replace(/\?$/, '').replace(/\?&/, '?');

async function connect(url, label) {
  const tries = [url, stripChannelBinding(url)];
  let last;
  for (const u of tries) {
    const c = new pg.Client({ connectionString: u, connectionTimeoutMillis: 60000 });
    try {
      await c.connect();
      console.log(label + ': connected');
      return c;
    } catch (e) {
      last = e;
      console.log(label + ': connect failed (' + e.message + '), retrying...');
      try { await c.end().catch(() => {}); } catch {}
    }
  }
  throw last;
}

(async () => {
  const neonUrl = process.env.NEON_URL;
  if (!neonUrl) throw new Error('NEON_URL env missing');
  const src = new pg.Client({
    host: process.env.DB_HOST, port: Number(process.env.DB_PORT),
    user: process.env.DB_USERNAME, password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  });
  await src.connect();
  console.log('local: connected');
  const dst = await connect(neonUrl, 'neon');

  // Safety: destination must be empty
  const pre = await dst.query('SELECT COUNT(*)::int AS n FROM titles');
  if (pre.rows[0].n > 0) throw new Error('Neon titles not empty — refusing to overwrite');

  const summary = {};
  for (const tbl of TABLES) {
    const cols = (await src.query(
      'SELECT column_name FROM information_schema.columns WHERE table_schema=$1 AND table_name=$2 ORDER BY ordinal_position',
      ['public', tbl],
    )).rows.map((r) => r.column_name);
    const idents = cols.map((c) => '"' + c.replace(/"/g, '""') + '"').join(',');
    const { rows } = await src.query('SELECT ' + idents + ' FROM "public"."' + tbl + '"');
    let maxId = 0;
    const CH = 500;
    for (let i = 0; i < rows.length; i += CH) {
      const ch = rows.slice(i, i + CH);
      const vals = [];
      const ph = ch.map((row, ri) => {
        const ps = cols.map((c, ci) => {
          let v = row[c];
          if (v !== null && typeof v === 'object' && !(v instanceof Date) && !Buffer.isBuffer(v)) v = JSON.stringify(v);
          vals.push(v);
          return '$' + (ri * cols.length + ci + 1);
        });
        return '(' + ps.join(',') + ')';
      });
      await dst.query(
        'INSERT INTO "public"."' + tbl + '" (' + idents + ') VALUES ' + ph.join(',') + ' ON CONFLICT DO NOTHING',
        vals,
      );
      if (SERIAL_ID.has(tbl)) for (const row of ch) if (row.id > maxId) maxId = row.id;
    }
    if (SERIAL_ID.has(tbl) && rows.length > 0) {
      await dst.query(
        "SELECT setval(pg_get_serial_sequence('public.\"" + tbl + '"\', \'id\'), $1)',
        [maxId],
      );
    }
    summary[tbl] = rows.length;
    console.log(tbl + ': ' + rows.length + ' rows copied');
  }

  // Verify counts match on both sides
  let ok = true;
  for (const tbl of TABLES) {
    const a = await src.query('SELECT COUNT(*)::int AS n FROM "public"."' + tbl + '"');
    const b = await dst.query('SELECT COUNT(*)::int AS n FROM "public"."' + tbl + '"');
    const match = a.rows[0].n === b.rows[0].n;
    if (!match) ok = false;
    console.log((match ? 'OK  ' : 'DIFF') + ' ' + tbl + ': local=' + a.rows[0].n + ' neon=' + b.rows[0].n);
  }
  await src.end();
  await dst.end();
  console.log(ok ? 'TRANSFER COMPLETE — all counts match' : 'TRANSFER DONE WITH DIFFS — investigate');
  if (!ok) process.exit(2);
})().catch((e) => { console.error('TRANSFER_ERR:', e.message); process.exit(1); });
