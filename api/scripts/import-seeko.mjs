/**
 * seeko.film bulk importer — Node 24 + native fetch + pg.
 * Python is not installed on this machine, so this ESM script does the same job
 * (user asked for python, but speed matters: same logic, fiber-friendly concurrency).
 *
 * Usage (from api/):
 *   node --env-file=.env scripts/import-seeko.mjs [--limit=N] [--phase=all|titles|movies|series|links|load] [--concurrency=N]
 *
 * Flow:
 *   1. titles: GET getAllTitles (68MB) -> .cache/seeko-all.json, group movies + series
 *   2. movies: GET /ghost/get/movie/:id (concurrent) -> .cache/seeko-movies.json
 *   3. series: GET /ghost/get/series/:id?affiliate=1 -> .cache/seeko-series.json (authoritative seasons/episodes)
 *   4. links:  POST getaffiliatelinks for every movie + every episode -> .cache/seeko-aff-*.json
 *   5. load:   batch upsert into Postgres (titles, episodes, download_links, genres)
 *
 * Resume-safe: every phase checkpoints to .cache and skips already-fetched ids on rerun.
 */
import { mkdir, readFile, writeFile, stat } from 'node:fs/promises';
import path from 'node:path';
import pg from 'pg';

const API = 'https://seeko.film/api/v1';
const POSTER_PREFIX = 'https://thumb.upera.tv/thumb?w=142&h=212&q=100&a=c&src=https://cdn.upera.tv/s3/posters/';
const BACKDROP_PREFIX =
  'https://thumb.upera.tv/thumb?w=1120&h=576&q=95&a=t&zc=1&src=https://cdn.upera.tv/s3/backdrops/';
const UA = { 'User-Agent': 'Mozilla/5.0 (MovieToon importer)' };

const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const m = a.match(/^--([^=]+)(=(.*))?$/);
    return m ? [m[1], m[3] ?? '1'] : [a, '1'];
  }),
);
const LIMIT = Number(args.limit ?? 0);
const PHASE = args.phase ?? 'all';
const CONC = Number(args.concurrency ?? 20);
const CACHE = path.resolve('C:/Users/sydev10/source/repos/MovieToon/api/.cache');

const log = (...a) => console.log(new Date().toISOString(), ...a);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function fetchJson(url, { method = 'GET', body } = {}, retries = 4) {
  let last;
  for (let i = 0; i < retries; i++) {
    const ctl = new AbortController();
    const t = setTimeout(() => ctl.abort(), 60000);
    try {
      const r = await fetch(url, {
        method,
        headers: { ...UA, 'Content-Type': 'application/json' },
        body,
        signal: ctl.signal,
      });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const j = await r.json();
      if (!j || typeof j !== 'object') throw new Error('bad json');
      return j;
    } catch (e) {
      last = e;
      await sleep(1500 * (i + 1));
    } finally {
      clearTimeout(t);
    }
  }
  throw last;
}

async function pool(items, limit, fn, onProgress) {
  const out = new Array(items.length);
  let idx = 0, done = 0;
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (true) {
      const i = idx++;
      if (i >= items.length) return;
      try { out[i] = await fn(items[i], i); }
      catch (e) { out[i] = { __error: String(e?.message ?? e) }; }
      if (++done % 200 === 0 || done === items.length) onProgress?.(done, items.length);
    }
  });
  await Promise.all(workers);
  return out;
}

const posterUrl = (f) => (!f ? '' : /^https?:\/\//i.test(f) ? f : POSTER_PREFIX + f);
const backdropUrl = (f) => (!f ? '' : /^https?:\/\//i.test(f) ? f : BACKDROP_PREFIX + f);
const num = (v, d = 0) => { const n = Number(v); return Number.isFinite(n) ? Math.round(n) : d; };
const flt = (v, d = 0) => { const n = Number(v); return Number.isFinite(n) ? n : d; };
const epMinutes = (e) => {
  const sec = Number(e.exact_runtime);
  if (Number.isFinite(sec) && sec > 300) return Math.round(sec / 60);
  const m = Number(e.exact_runtime);
  if (Number.isFinite(m) && m > 0 && m <= 300) return Math.round(m);
  return 45;
};
const date10 = (s) => (typeof s === 'string' && s.length >= 10 ? s.slice(0, 10) : new Date().toISOString().slice(0, 10));

function genresFrom(detail, flat) {
  if (detail?.new_genres && typeof detail.new_genres === 'object') {
    const vals = Object.values(detail.new_genres).filter(Boolean).map(String);
    if (vals.length) return [...new Set(vals)];
  }
  if (detail?.genre_fa) return String(detail.genre_fa).split(',').map((s) => s.trim()).filter(Boolean);
  if (flat?.genre) return String(flat.genre).split(',').map((s) => s.trim()).filter(Boolean);
  return [];
}

function qualityRank(links) {
  const order = ['BLURAY', 'HQ_1080', '1080', '720', '480'];
  const titles = (links ?? []).map((l) => String(l.title ?? ''));
  for (const q of order) if (titles.some((t) => t.includes(q))) return q === 'HQ_1080' ? '۱۰۸۰p HQ' : q.includes('1080') ? '۱۰۸۰p' : q.includes('720') ? '۷۲۰p' : q.includes('480') ? '۴۸۰p' : 'بلوری';
  return '';
}

function parseQuality(title) {
  const t = String(title ?? '');
  const m = t.match(/کیفیت\s+(\S+)/);
  if (m) return m[1].replace(/[()]/g, '');
  if (t === 'HLS' || t.startsWith('لینک پلیر')) return t.slice(0, 20);
  if (t.startsWith('لینک آپرا')) return 'VOD';
  return t.slice(0, 40);
}

async function loadCache(name, fallback) {
  try { return JSON.parse(await readFile(path.join(CACHE, name), 'utf8')); }
  catch { return fallback; }
}
async function saveCache(name, obj) {
  await mkdir(CACHE, { recursive: true });
  await writeFile(path.join(CACHE, name), JSON.stringify(obj));
}

// ---------- PHASE 1: all titles ----------
async function phaseTitles() {
  await mkdir(CACHE, { recursive: true });
  const cached = await loadCache('seeko-all.json', null);
  if (cached?.data?.all_titles?.data?.length) {
    log(`titles: cache hit (${cached.data.all_titles.data.length} rows)`);
    return cached;
  }
  log('titles: downloading getAllTitles (~68MB)...');
  const j = await fetchJson(`${API}/get/getAllTitles?sort_by=created_at&age=&lang=&country=&f_type=&traffic=1&imdb=&limitbyhour=`);
  await saveCache('seeko-all.json', j);
  log(`titles: saved ${j.data.all_titles.data.length} rows`);
  return j;
}

// ---------- PHASE 2/3: details ----------
async function phaseDetails(all) {
  let rows = all.data.all_titles.data;
  if (LIMIT > 0) {
    // deterministic sample: first N movies + series covering them
    const movies = rows.filter((r) => r.type === 'movie').slice(0, LIMIT);
    const seriesIds = [...new Set(rows.filter((r) => r.type === 'episode').map((r) => r.series_id))].slice(0, Math.max(2, Math.floor(LIMIT / 10)));
    const eps = rows.filter((r) => seriesIds.includes(r.series_id));
    rows = [...movies, ...eps];
    log(`LIMIT mode: ${movies.length} movies + ${eps.length} episodes (${seriesIds.length} series)`);
  }
  const movies = rows.filter((r) => r.type === 'movie');
  const seriesIds = [...new Set(rows.filter((r) => r.type === 'episode').map((r) => r.series_id).filter(Boolean))];
  log(`detail targets: ${movies.length} movies, ${seriesIds.length} series`);

  let movieDetails = await loadCache('seeko-movies.json', {});
  const needMovies = movies.filter((m) => !movieDetails[m.id]);
  log(`movies: ${Object.keys(movieDetails).length} cached, ${needMovies.length} to fetch`);
  if (needMovies.length) {
    await pool(needMovies, CONC, async (m) => {
      const j = await fetchJson(`${API}/ghost/get/movie/${m.id}`);
      movieDetails[m.id] = j.data?.movie ?? null;
      return 1;
    }, (d, t) => log(`movies ${d}/${t}`));
    await saveCache('seeko-movies.json', movieDetails);
  }

  let seriesDetails = await loadCache('seeko-series.json', {});
  const needSeries = seriesIds.filter((id) => !seriesDetails[id]);
  log(`series: ${Object.keys(seriesDetails).length} cached, ${needSeries.length} to fetch`);
  if (needSeries.length) {
    await pool(needSeries, Math.min(8, CONC), async (id) => {
      const j = await fetchJson(`${API}/ghost/get/series/${id}?affiliate=1`);
      seriesDetails[id] = { series: j.data?.series ?? null, season: j.data?.season ?? {} };
      return 1;
    }, (d, t) => log(`series ${d}/${t}`));
    await saveCache('seeko-series.json', seriesDetails);
  }
  return { rows, movies, seriesIds, movieDetails, seriesDetails };
}

// ---------- PHASE 4: affiliate links ----------
async function phaseLinks(ctx) {
  const { movies, seriesDetails } = ctx;
  // episode list authoritative from series season payloads
  const episodes = [];
  for (const [sid, s] of Object.entries(seriesDetails)) {
    const season = s?.season ?? {};
    for (const eps of Object.values(season)) for (const e of Array.isArray(eps) ? eps : []) episodes.push(e);
  }
  log(`links: ${movies.length} movies + ${episodes.length} episodes`);
  let affM = await loadCache('seeko-aff-movie.json', {});
  let affE = await loadCache('seeko-aff-ep.json', {});
  const LINK_CONC = Number(args.linkConcurrency ?? 24);
  let failM = 0, failE = 0;
  for (let attempt = 1; attempt <= 3; attempt++) {
    const needM = movies.filter((m) => !affM[m.id]);
    const needE = episodes.filter((e) => e?.id && !affE[e.id]);
    log(`links attempt ${attempt}: to fetch ${needM.length} movies / ${needE.length} episodes (conc ${LINK_CONC})`);
    if (!needM.length && !needE.length) break;
    if (needM.length) {
      let done = 0;
      const res = await pool(needM, LINK_CONC, async (m) => {
        try {
          const j = await fetchJson(`${API}/ghost/get/getaffiliatelinks?id=${m.id}&type=movie&ref=2&traffic=1&token=`, { method: 'POST', body: '{}' }, 6);
          affM[m.id] = j.data?.links ?? [];
        } catch (e) { failM++; }
        if (++done % 500 === 0) await saveCache('seeko-aff-movie.json', affM);
        return 1;
      }, (d, t) => log(`aff-movie ${d}/${t}`));
      void res;
      await saveCache('seeko-aff-movie.json', affM);
    }
    if (needE.length) {
      let done = 0;
      await pool(needE, LINK_CONC, async (e) => {
        try {
          const j = await fetchJson(`${API}/ghost/get/getaffiliatelinks?id=${e.id}&type=episode&ref=2&traffic=1&token=`, { method: 'POST', body: '{}' }, 6);
          affE[e.id] = j.data?.links ?? [];
        } catch (e2) { failE++; }
        if (++done % 500 === 0) await saveCache('seeko-aff-ep.json', affE);
        return 1;
      }, (d, t) => log(`aff-ep ${d}/${t}`));
      await saveCache('seeko-aff-ep.json', affE);
    }
  }
  log(`links fetch failures total: movies=${failM} episodes=${failE}`);
  return { ...ctx, episodes, affM, affE };
}

// ---------- PHASE 5: load into postgres ----------
async function phaseLoad(ctx) {
  const { movieDetails, seriesDetails, affM, affE } = ctx;
  const client = new pg.Client({
    host: process.env.DB_HOST ?? 'localhost',
    port: Number(process.env.DB_PORT ?? 5432),
    user: process.env.DB_USERNAME ?? 'movietoon',
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME ?? 'movietoon',
  });
  await client.connect();

  const flatById = Object.fromEntries((ctx.rows ?? []).map((r) => [r.id, r]));
  const titles = [];
  const genreMap = new Map(); // slug -> fa name

  for (const [id, d] of Object.entries(movieDetails)) {
    if (!d) continue;
    const f = flatById[id] ?? {};
    const g = genresFrom(d, f);
    g.forEach((name, i) => { if (!genreMap.has(name)) genreMap.set(name, name); });
    titles.push({
      slug: id, type: 'movie', titleFa: d.name_fa || d.name || '', titleEn: d.name || '',
      year: num(d.year || f.year, 2024), runtime: num(d.runtime || d.exact_runtime || f.runtime || f.exact_runtime, null),
      seasons: null, epsCount: null, countries: d.ir == 1 || f.ir == 1 ? ['ایران'] : ['خارجی'],
      genres: g, director: '', cast: [], desc: d.overview_fa || d.overview || '',
      rate: flt(d.rate ?? f.rate, 0), age: d.age || f.age || '', quality: qualityRank(affM[id]),
      dubbed: (d.dubbed ?? f.dubbed) == 1, subbed: (d.subbed ?? f.subbed ?? 1) != 0,
      poster: posterUrl(d.poster || f.poster), backdrop: backdropUrl(d.backdrop || f.backdrop),
      added: date10(f.created_at), lang: (d.persian ?? f.persian) == 1 ? 'فارسی' : 'انگلیسی',
      imdbId: f.imdb || '', upera: String(d.upera ?? f.upera ?? ''), persian: (d.persian ?? f.persian) == 1,
    });
  }
  for (const [sid, s] of Object.entries(seriesDetails)) {
    const d = s?.series;
    if (!d) continue;
    const season = s?.season ?? {};
    const eps = Object.values(season).flatMap((a) => (Array.isArray(a) ? a : []));
    const seasonsCount = Object.keys(season).length || null;
    const g = genresFrom(d, null);
    g.forEach((name) => { if (!genreMap.has(name)) genreMap.set(name, name); });
    const f0 = flatById[eps[0]?.id] ?? {};
    titles.push({
      slug: sid, type: 'series', titleFa: d.name_fa || d.name || '', titleEn: d.name || '',
      year: num(d.year, 2024), runtime: null, seasons: seasonsCount, epsCount: eps.length || null,
      countries: d.ir == 1 ? ['ایران'] : ['خارجی'],
      genres: g, director: '', cast: [], desc: d.overview_fa || d.overview || '',
      rate: flt(d.rate, 0), age: d.age || '', quality: '',
      dubbed: d.dubbed == 1, subbed: d.subbed != 0,
      poster: posterUrl(d.poster), backdrop: backdropUrl(d.backdrop),
      added: date10(f0.created_at), lang: d.persian == 1 ? 'فارسی' : 'انگلیسی',
      imdbId: '', upera: String(d.upera ?? ''), persian: d.persian == 1,
    });
  }
  log(`load: upserting ${titles.length} titles + ${genreMap.size} genres...`);
  for (const [name] of genreMap) {
    const slug = name; // Persian display name doubles as slug (matches existing seed semantics)
    await client.query(`INSERT INTO genres (slug, name) VALUES ($1,$2) ON CONFLICT (slug) DO UPDATE SET name=EXCLUDED.name`, [slug, name]);
  }
  const TC = 500;
  for (let i = 0; i < titles.length; i += TC) {
    const ch = titles.slice(i, i + TC);
    await Promise.all(ch.map((t) => client.query(
      `INSERT INTO titles (slug,type,title_fa,title_en,year,jalali_year,runtime_min,seasons_count,episodes_count,countries,genres,director,"cast",description,imdb,site_score,age_rating,quality,dubbed,subtitled,poster,backdrop,views,added_at,featured,language,external_id,imdb_id,upera_id,source_type,persian)
       VALUES ($1,$2,$3,$4,$5,$5,$6,$7,$8,$9::jsonb,$10::jsonb,$11,$12::jsonb,$13,$14,$14,$15,$16,$17,$18,$19,$20,0,$21,false,$22,$1,$23,$24,$2,$25)
       ON CONFLICT (slug) DO UPDATE SET type=EXCLUDED.type,title_fa=EXCLUDED.title_fa,title_en=EXCLUDED.title_en,year=EXCLUDED.year,runtime_min=EXCLUDED.runtime_min,seasons_count=EXCLUDED.seasons_count,episodes_count=EXCLUDED.episodes_count,countries=EXCLUDED.countries,genres=EXCLUDED.genres,description=EXCLUDED.description,imdb=EXCLUDED.imdb,site_score=EXCLUDED.site_score,age_rating=EXCLUDED.age_rating,quality=EXCLUDED.quality,dubbed=EXCLUDED.dubbed,subtitled=EXCLUDED.subtitled,poster=EXCLUDED.poster,backdrop=EXCLUDED.backdrop,language=EXCLUDED.language,imdb_id=EXCLUDED.imdb_id,upera_id=EXCLUDED.upera_id,persian=EXCLUDED.persian`,
      [t.slug, t.type, t.titleFa.slice(0, 500), t.titleEn.slice(0, 500), t.year, t.runtime, t.seasons, t.epsCount, JSON.stringify(t.countries), JSON.stringify(t.genres), t.director, JSON.stringify(t.cast), t.desc, t.rate, t.age, t.quality, t.dubbed, t.subbed, t.poster.slice(0, 500), t.backdrop.slice(0, 500), t.added, t.lang, t.imdbId.slice(0, 50), t.upera.slice(0, 50), t.persian],
    )));
    log(`titles ${Math.min(i + TC, titles.length)}/${titles.length}`);
  }

  // episodes
  const epRows = [];
  for (const [sid, s] of Object.entries(seriesDetails)) {
    for (const eps of Object.values(s?.season ?? {})) for (const e of Array.isArray(eps) ? eps : []) {
      if (!e?.id) continue;
      epRows.push({
        slug: sid, season: num(e.season_number, 1), number: num(e.episode_number, 1),
        fa: (e.name_fa || e.name || '').slice(0, 500), dur: epMinutes(e),
        thumb: posterUrl(e.poster), desc: (e.overview_fa || e.overview || ''),
        ext: e.id, series: sid, upera: String(e.upera ?? ''), master: String(e.master_file ?? '').slice(0, 500),
      });
    }
  }
  log(`load: upserting ${epRows.length} episodes...`);
  const extToDb = new Map();
  for (let i = 0; i < epRows.length; i += TC) {
    const ch = epRows.slice(i, i + TC);
    const res = await Promise.all(ch.map((e) => client.query(
      `INSERT INTO episodes (title_slug,season,number,title_fa,duration_min,thumbnail,description,external_id,external_series_id,upera_id,master_file)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
       ON CONFLICT (external_id) DO UPDATE SET title_slug=EXCLUDED.title_slug,season=EXCLUDED.season,number=EXCLUDED.number,title_fa=EXCLUDED.title_fa,duration_min=EXCLUDED.duration_min,thumbnail=EXCLUDED.thumbnail,description=EXCLUDED.description,upera_id=EXCLUDED.upera_id,master_file=EXCLUDED.master_file
       RETURNING id, external_id`,
      [e.slug, e.season, e.number, e.fa, e.dur, e.thumb.slice(0, 500), e.desc, e.ext, e.series, e.upera.slice(0, 50), e.master],
    )));
    res.forEach((r) => { const row = r.rows[0]; if (row) extToDb.set(row.external_id, row.id); });
    log(`episodes ${Math.min(i + TC, epRows.length)}/${epRows.length}`);
  }
  // episodes whose links exist but season payload missed them (edge): ensure mapping via fallback lookup
  if (extToDb.size < Object.keys(affE).length) {
    const missing = Object.keys(affE).filter((id) => !extToDb.has(id));
    if (missing.length) {
      const r = await client.query(`SELECT id, external_id FROM episodes WHERE external_id = ANY($1)`, [missing]);
      r.rows.forEach((row) => extToDb.set(row.external_id, row.id));
    }
  }

  // download links: wipe per-title first for idempotency, then bulk insert
  log('load: rebuilding download_links...');
  const linkRows = [];
  for (const [mid, links] of Object.entries(affM)) {
    for (const l of links ?? []) linkRows.push({ slug: mid, ep: null, ext: mid, type: l.type ?? '', url: l.link ?? '', q: parseQuality(l.title), size: String(l.size ?? ''), label: String(l.title ?? '').slice(0, 200) });
  }
  // need series slug per episode external id
  const epSeries = new Map(epRows.map((e) => [e.ext, e.slug]));
  for (const [eid, links] of Object.entries(affE)) {
    const slug = epSeries.get(eid);
    const dbId = extToDb.get(eid) ?? null;
    if (!slug) continue;
    for (const l of links ?? []) linkRows.push({ slug, ep: dbId, ext: eid, type: l.type ?? '', url: l.link ?? '', q: parseQuality(l.title), size: String(l.size ?? ''), label: String(l.title ?? '').slice(0, 200) });
  }
  const slugs = [...new Set(linkRows.map((l) => l.slug))];
  for (let i = 0; i < slugs.length; i += 1000) {
    await client.query(`DELETE FROM download_links WHERE title_slug = ANY($1)`, [slugs.slice(i, i + 1000)]);
  }
  for (let i = 0; i < linkRows.length; i += TC) {
    const ch = linkRows.slice(i, i + TC);
    await Promise.all(ch.map((l) => client.query(
      `INSERT INTO download_links (title_slug,episode_id,external_id,link_type,url,quality,size,label) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
      [l.slug, l.ep, l.ext, l.type.slice(0, 50), l.url, l.q.slice(0, 50), l.size.slice(0, 50), l.label],
    )));
    if (i % 5000 === 0) log(`links ${Math.min(i + TC, linkRows.length)}/${linkRows.length}`);
  }

  const counts = await client.query(`SELECT (SELECT COUNT(*)::int FROM titles) AS titles,(SELECT COUNT(*)::int FROM episodes) AS episodes,(SELECT COUNT(*)::int FROM download_links) AS links,(SELECT COUNT(*)::int FROM genres) AS genres`);
  log('DONE:', JSON.stringify(counts.rows[0]));
  await client.end();
}

const run = async () => {
  if (!['all', 'titles', 'movies', 'series', 'links', 'load'].includes(PHASE)) throw new Error('bad --phase');
  const all = (PHASE === 'all' || PHASE === 'titles' || PHASE === 'movies' || PHASE === 'series' || PHASE === 'load') ? await phaseTitles() : null;
  let ctx = null;
  if (PHASE === 'all' || PHASE === 'movies' || PHASE === 'series' || PHASE === 'links' || PHASE === 'load') {
    const src = all ?? await phaseTitles();
    ctx = await phaseDetails(src);
    if (PHASE === 'all' || PHASE === 'links' || PHASE === 'load') Object.assign(ctx, await phaseLinks(ctx));
    if (PHASE === 'all' || PHASE === 'load') await phaseLoad(ctx);
  }
  log('phase complete:', PHASE);
};
run().catch((e) => { console.error('IMPORT_FAIL:', e); process.exit(1); });
