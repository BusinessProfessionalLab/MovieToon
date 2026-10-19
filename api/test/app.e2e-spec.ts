import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import cookieParser from 'cookie-parser';
import request from 'supertest';
import { DataSource } from 'typeorm';
import { AppModule } from '../src/app.module';
import { PersianErrorFilter } from '../src/common/persian-error.filter';

describe('MovieToon API (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    process.env.DB_NAME = 'movietoon_test';
    process.env.JWT_ACCESS_SECRET = 'test-access-secret-00000000000000000000000000';
    process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-0000000000000000000000000';
    process.env.ACCESS_TOKEN_TTL = '15m';
    process.env.REFRESH_TOKEN_TTL = '30d';
    process.env.CORS_ORIGIN = 'http://localhost:4321';
    process.env.COOKIE_SECURE = 'false';

    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    app.use(cookieParser());
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true, forbidNonWhitelisted: true }));
    app.useGlobalFilters(new PersianErrorFilter());
    await app.init();

    const ds = app.get(DataSource);
    await ds.runMigrations();
    // Minimal catalog fixtures.
    await ds.query(`INSERT INTO genres (slug, name, description) VALUES ('drama', 'درام', 'd'), ('comedy', 'کمدی', 'c')`);
    await ds.query(`INSERT INTO actors (slug, name, "latin_name", photo, "birth_year", "birth_place", bio) VALUES ('a1', 'بازیگر یک', 'Actor One', '', 1360, 'تهران', '')`);
    await ds.query(
      `INSERT INTO titles (slug, type, title_fa, title_en, year, jalali_year, runtime_min, seasons_count, episodes_count, countries, genres, director, "cast", description, imdb, site_score, age_rating, quality, dubbed, subtitled, poster, backdrop, views, added_at, featured, top10_rank, age_group, language)
       VALUES
       ('film-1', 'movie', 'فیلم یک', 'Film One', 2024, 1403, 100, NULL, NULL, '["ایران"]', '["درام"]', 'کارگردان', '["بازیگر یک"]', 'توضیح', 8.5, 8.8, '+12', '۱۰۸۰p', true, true, '/p1.svg', '/b1.svg', 1000, '2024-01-05', true, 1, NULL, 'فارسی'),
       ('series-1', 'series', 'سریال یک', 'Series One', 2023, 1402, NULL, 1, 2, '["ایران"]', '["کمدی"]', 'کارگردان', '[]', 'توضیح', 7.0, 7.2, '+7', '۷۲۰p', false, true, '/p2.svg', '/b2.svg', 500, '2023-05-01', false, 2, NULL, 'فارسی')`,
    );
    await ds.query(`INSERT INTO title_actors (title_slug, actor_slug) VALUES ('film-1', 'a1')`);
    await ds.query(`INSERT INTO episodes (title_slug, season, number, title_fa, duration_min, thumbnail, description) VALUES ('series-1', 1, 1, 'قسمت اول', 45, '', ''), ('series-1', 1, 2, 'قسمت دوم', 47, '', '')`);
    await ds.query(`INSERT INTO collections (slug, name, description, cover) VALUES ('best', 'بهترین‌ها', 'd', '/b1.svg')`);
    await ds.query(`INSERT INTO collection_titles (collection_slug, title_slug) VALUES ('best', 'film-1')`);
    await ds.query(`INSERT INTO comments (title_slug, author, avatar, date, rating, text, likes) VALUES ('film-1', 'مهمان', '', '2024-01-01', 8, 'عالی بود.', 3)`);
  });

  afterAll(async () => {
    await app.close();
  });

  const setCookiesOf = (res: request.Response): string[] =>
    (res.headers['set-cookie'] ?? []) as unknown as string[];
  const uid = () => `u${Date.now().toString(36)}${Math.floor(Math.random() * 1e6)}`;
  const jarOf = (res: request.Response): string =>
    setCookiesOf(res)
      .map((c) => c.split(';')[0])
      .join('; ');
  const refreshCookie = (res: request.Response): string | undefined => {
    const found = setCookiesOf(res).find((c) => c.startsWith('mt_refresh='));
    return found ? found.split(';')[0] : undefined;
  };

  it('GET /api/health', async () => {
    await request(app.getHttpServer()).get('/api/health').expect(200);
  });

  describe('auth', () => {
    const registerUser = async (tag: string) => {
      const email = `${tag}-${uid()}@example.com`;
      const res = await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({ name: 'تست', email, password: 's3cure-password' })
        .expect(201);
      return { email, res };
    };

    it('registers, rejects duplicates with 409, validates input', async () => {
      const email = `User-${uid()}@Example.com`;
      const ok = await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({ name: 'تست', email, password: 's3cure-password' })
        .expect(201);
      expect(ok.body.data.user.email).toBe(email.toLowerCase());
      expect(ok.body.data.user).not.toHaveProperty('passwordHash');
      expect(refreshCookie(ok)).toBeTruthy();

      const dup = await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({ name: 'تست', email: email.toLowerCase(), password: 's3cure-password' })
        .expect(409);
      expect(dup.body.code).toBe('EMAIL_EXISTS');

      const bad = await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({ name: 'x', email: 'bad', password: 'short' })
        .expect(400);
      expect(bad.body.code).toBe('VALIDATION_ERROR');
    });

    it('login ok + generic failure for wrong email or password', async () => {
      const { email } = await registerUser('login');
      const ok = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email, password: 's3cure-password' })
        .expect(200);
      expect(ok.body.data.accessToken).toBeUndefined();
      expect(ok.body.data.user.email).toBe(email);

      const badPass = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email, password: 'wrong-password' })
        .expect(401);
      const noUser = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email: `nobody-${uid()}@example.com`, password: 'wrong-password' })
        .expect(401);
      expect(badPass.body.error).toBe(noUser.body.error);
      expect(badPass.body.error).toBe('ایمیل یا رمز عبور اشتباه است.');
    });

    it('refresh rotates; reuse revokes everything; logout clears', async () => {
      const { email } = await registerUser('rotate');
      const login = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email, password: 's3cure-password' })
        .expect(200);
      const c1 = refreshCookie(login);
      expect(c1).toBeTruthy();

      const r1 = await request(app.getHttpServer()).post('/api/auth/refresh').set('Cookie', c1!).expect(200);
      const c2 = refreshCookie(r1);
      expect(c2).toBeTruthy();
      expect(c2).not.toBe(c1);

      await request(app.getHttpServer()).post('/api/auth/refresh').set('Cookie', c1!).expect(401);
      await request(app.getHttpServer()).post('/api/auth/refresh').set('Cookie', c2!).expect(401);

      const fresh = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email, password: 's3cure-password' })
        .expect(200);
      const me = await request(app.getHttpServer())
        .get('/api/auth/me')
        .set('Cookie', jarOf(fresh))
        .expect(200);
      expect(me.body.data.email).toBe(email);
      expect(me.body.data).not.toHaveProperty('passwordHash');

      const anon = await request(app.getHttpServer()).get('/api/auth/me');
      expect(anon.status).toBe(401);

      const out = await request(app.getHttpServer())
        .post('/api/auth/logout')
        .set('Cookie', refreshCookie(fresh)!)
        .expect(200);
      expect(setCookiesOf(out).some((c) => c.startsWith('mt_refresh=;') || c.includes('Max-Age=0'))).toBe(true);
      await request(app.getHttpServer()).post('/api/auth/refresh').set('Cookie', refreshCookie(fresh)!).expect(401);
    });

    it('me works with the mt_access cookie; refresh token is rejected in its place', async () => {
      const { email } = await registerUser('me');
      const login = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email, password: 's3cure-password' })
        .expect(200);
      const jar = jarOf(login);
      const me = await request(app.getHttpServer()).get('/api/auth/me').set('Cookie', jar).expect(200);
      expect(me.body.data.email).toBe(email);
      // Smuggle the raw refresh JWT where the access cookie belongs.
      const rawRefresh = (setCookiesOf(login).find((c) => c.startsWith('mt_refresh=')) ?? '').split(';')[0].slice('mt_refresh='.length);
      const spoof = await request(app.getHttpServer())
        .get('/api/auth/me')
        .set('Cookie', `mt_access=${rawRefresh}`)
        .expect(401);
      expect(spoof.body.code).toBe('UNAUTHORIZED');
    });
  });

  describe('catalog', () => {
    it('lists with filters, sort, pagination envelope', async () => {
      const all = await request(app.getHttpServer()).get('/api/titles').expect(200);
      expect(all.body.meta.total).toBe(2);
      const movies = await request(app.getHttpServer()).get('/api/titles?type=movie').expect(200);
      expect(movies.body.data.map((t: { slug: string }) => t.slug)).toEqual(['film-1']);
      const sorted = await request(app.getHttpServer()).get('/api/titles?sort=rating').expect(200);
      expect(sorted.body.data[0].slug).toBe('film-1');
      const paged = await request(app.getHttpServer()).get('/api/titles?page=2&pageSize=1').expect(200);
      expect(paged.body.meta).toMatchObject({ page: 2, pageSize: 1, total: 2, totalPages: 2 });
    });

    it('detail (full shape), related, top', async () => {
      const d = await request(app.getHttpServer()).get('/api/titles/film-1').expect(200);
      expect(d.body.data.titleFa).toBe('فیلم یک');
      expect(d.body.data.actors[0]).toMatchObject({ slug: 'a1', name: 'بازیگر یک' });
      expect(d.body.data.cast).toContain('بازیگر یک');
      expect(d.body.data.collectionSlugs).toEqual(['best']);
      await request(app.getHttpServer()).get('/api/titles/nope').expect(404);
      const rel = await request(app.getHttpServer()).get('/api/titles/film-1/related').expect(200);
      expect(Array.isArray(rel.body.data)).toBe(true);
      const top = await request(app.getHttpServer()).get('/api/titles/top').expect(200);
      expect(top.body.data.map((t: { slug: string }) => t.slug)).toEqual(['film-1', 'series-1']);
      expect(top.body.data[0].top10Rank).toBe(1);
      const sd = await request(app.getHttpServer()).get('/api/titles/series-1').expect(200);
      expect(sd.body.data.seasons).toHaveLength(1);
      expect(sd.body.data.seasons[0].episodes).toHaveLength(2);
    });

    it('genres, collections, actors', async () => {
      const g = await request(app.getHttpServer()).get('/api/genres').expect(200);
      expect(g.body.data.length).toBe(2);
      const gd = await request(app.getHttpServer()).get('/api/genres/drama').expect(200);
      expect(gd.body.data.genre.slug).toBe('drama');
      const c = await request(app.getHttpServer()).get('/api/collections').expect(200);
      expect(c.body.data[0].count).toBe(1);
      const cd = await request(app.getHttpServer()).get('/api/collections/best').expect(200);
      expect(cd.body.data.titles.map((t: { slug: string }) => t.slug)).toEqual(['film-1']);
      const a = await request(app.getHttpServer()).get('/api/actors/a1').expect(200);
      expect(a.body.data.titles.map((t: { slug: string }) => t.slug)).toEqual(['film-1']);
      await request(app.getHttpServer()).get('/api/actors/nope').expect(404);
    });

    it('search finds Persian titles (FTS)', async () => {
      const r = await request(app.getHttpServer()).get('/api/search').query({ q: 'فیلم' }).expect(200);
      expect(r.body.data.map((t: { slug: string }) => t.slug)).toContain('film-1');
      const empty = await request(app.getHttpServer()).get('/api/search').query({ q: 'zzzz-no-match' }).expect(200);
      expect(empty.body.data).toEqual([]);
    });

    it('comments list + post + validation', async () => {
      const list = await request(app.getHttpServer()).get('/api/titles/film-1/comments').expect(200);
      expect(list.body.data).toHaveLength(1);
      const created = await request(app.getHttpServer())
        .post('/api/titles/film-1/comments')
        .send({ author: 'تست', text: 'خیلی خوب بود، پیشنهاد می‌کنم.' })
        .expect(201);
      expect(created.body.data.author).toBe('تست');
      await request(app.getHttpServer())
        .post('/api/titles/film-1/comments')
        .send({ author: 'x', text: 'short' })
        .expect(400);
      await request(app.getHttpServer()).get('/api/titles/nope/comments').expect(404);
    });

    it('contact + reports validate and persist', async () => {
      await request(app.getHttpServer()).post('/api/contact').send({ name: 'x' }).expect(400);
      const c = await request(app.getHttpServer())
        .post('/api/contact')
        .send({ name: 'کاربر', email: 'u@example.com', subject: 'سلام', message: 'این یک پیام تستی با بیش از ده حرف است.' })
        .expect(201);
      expect(c.body.data.id).toBeDefined();
      await request(app.getHttpServer()).post('/api/reports').send({ type: 'bad', description: 'short' }).expect(400);
      const rpt = await request(app.getHttpServer())
        .post('/api/reports')
        .send({ type: 'نقض حق نشر', description: 'توضیح کافی برای گزارش تستی.' })
        .expect(201);
      expect(rpt.body.data.id).toBeDefined();
    });
  });

  describe('user library (auth required)', () => {
    it('rejects anonymous, syncs lists and progress for a user', async () => {
      await request(app.getHttpServer()).get('/api/users/me/favorites').expect(401);

      const email = `lib-${uid()}@example.com`;
      await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({ name: 'کتابخانه', email, password: 's3cure-password' })
        .expect(201);
      const login = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email, password: 's3cure-password' })
        .expect(200);
      const jar = jarOf(login);
      const auth = (req: request.Test) => req.set('Cookie', jar);

      let favs = await auth(request(app.getHttpServer()).get('/api/users/me/favorites')).expect(200);
      expect(favs.body.data).toEqual([]);
      await auth(
        request(app.getHttpServer()).put('/api/users/me/favorites').send({ slugs: ['film-1', 'series-1'] }),
      ).expect(200);
      favs = await auth(request(app.getHttpServer()).get('/api/users/me/favorites')).expect(200);
      expect(favs.body.data).toEqual(['film-1', 'series-1']);

      await auth(request(app.getHttpServer()).put('/api/users/me/watchlist').send({ slugs: ['film-1'] })).expect(200);
      await auth(request(app.getHttpServer()).put('/api/users/me/progress').send({ slug: 'film-1', seconds: 125 })).expect(200);
      const prog = await auth(request(app.getHttpServer()).get('/api/users/me/progress')).expect(200);
      expect(prog.body.data).toEqual({ 'film-1': 125 });
    });
  });
});
