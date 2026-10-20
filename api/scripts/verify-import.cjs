const pg = require('pg');
(async () => {
  const c = new pg.Client({
    host: process.env.DB_HOST, port: Number(process.env.DB_PORT),
    user: process.env.DB_USERNAME, password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  });
  await c.connect();
  const r = await c.query(`SELECT (SELECT COUNT(*)::int FROM titles) AS titles,(SELECT COUNT(*)::int FROM episodes) AS episodes,(SELECT COUNT(*)::int FROM download_links) AS links,(SELECT COUNT(*)::int FROM genres) AS genres,(SELECT COUNT(*)::int FROM titles WHERE type='movie') AS movies,(SELECT COUNT(*)::int FROM titles WHERE type='series') AS series,(SELECT COUNT(*)::int FROM titles WHERE poster LIKE 'https://thumb.upera.tv%') AS posters_ok,(SELECT COUNT(*)::int FROM episodes WHERE title_slug IN (SELECT slug FROM titles)) AS eps_linked`);
  console.log('DB:' + JSON.stringify(r.rows[0]));
  const q = await c.query(`SELECT quality, COUNT(*) AS n FROM download_links GROUP BY quality ORDER BY n DESC LIMIT 10`);
  console.log('QUAL:' + JSON.stringify(q.rows));
  const s = await c.query(`SELECT slug, type, title_fa, year, imdb, genres FROM titles ORDER BY RANDOM() LIMIT 2`);
  console.log('SAMPLE:' + JSON.stringify(s.rows).slice(0, 900));
  const l = await c.query(`SELECT quality, size, substring(url, 1, 70) AS url FROM download_links ORDER BY RANDOM() LIMIT 2`);
  console.log('LINKS:' + JSON.stringify(l.rows));
  await c.end();
})().catch((e) => { console.error('ERR:' + e.message); process.exit(1); });
