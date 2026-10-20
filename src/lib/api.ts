/**
 * Single data-access layer for the whole frontend.
 *
 * - Browser (client islands, forms): same-origin relative `/api/*` calls,
 *   which the dev server proxies to Nest (see astro.config) and production
 *   serves via host rewrites. No CORS involved.
 * - SSR / build time: absolute `PUBLIC_API_URL` when set; otherwise the
 *   bundled local mock (identical content to the DB seed) so builds and
 *   offline work never break.
 * - Every function falls back to the local mock when the API is unreachable.
 */
import type { Actor, Collection, DownloadLink, Genre, Title, TitleComment } from '../types';
import { actors as localActors, collections as localCollections, comments as localComments, genres as localGenres, titles as localTitles } from '../data';
import { filterTitles, paginate, routeFor, searchTitles as localSearch, similarTitles } from './repository';

const API = (import.meta.env.PUBLIC_API_URL as string | undefined)?.replace(/\/$/, '');
const isBrowser = typeof window !== 'undefined';

function base(): string {
  // Browser: same-origin relative URL (dev proxy / prod rewrite). SSR: absolute URL.
  if (isBrowser) return API ?? '';
  if (!API) throw new Error('NO_API');
  return API;
}

async function apiGet<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${base()}${path}`, { credentials: 'include', ...init });
  if (!res.ok) throw new Error(`API ${res.status}`);
  const body = (await res.json()) as { success: boolean; data: T; meta?: PageMeta };
  if (!body || body.success !== true) throw new Error('API error');
  return body.data as T;
}

async function apiGetPaged<T>(path: string): Promise<{ data: T[]; meta: PageMeta }> {
  const res = await fetch(`${base()}${path}`, { credentials: 'include' });
  if (!res.ok) throw new Error(`API ${res.status}`);
  const body = (await res.json()) as { success: boolean; data: T[]; meta: PageMeta };
  if (!body || body.success !== true) throw new Error('API error');
  return { data: body.data, meta: body.meta };
}

export interface HomeData {
  hero: Title[];
  movies: Title[];
  series: Title[];
  animations: Title[];
  top10: Title[];
  fresh: Title[];
  collections: Collection[];
  genres: Genre[];
}

export interface PageMeta {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface ListParams {
  type?: 'movie' | 'series' | 'animation';
  genre?: string;
  year?: number;
  country?: string;
  minRating?: number;
  ageGroup?: string;
  featured?: boolean;
  homeAnimation?: boolean;
  sort?: 'rating' | 'newest' | 'year' | 'views';
  page?: number;
  pageSize?: number;
  q?: string;
}

function toTitle(t: Record<string, unknown>): Title {
  const genres = Array.isArray(t['genres']) ? (t['genres'] as string[]) : [];
  const rawLinks = Array.isArray(t['downloadLinks']) ? (t['downloadLinks'] as Array<Record<string, unknown>>) : [];
  return {
    slug: String(t['slug'] ?? ''),
    type: (t['type'] as Title['type']) ?? 'movie',
    titleFa: String(t['titleFa'] ?? ''),
    titleEn: String(t['titleEn'] ?? ''),
    year: Number(t['year'] ?? t['jalaliYear'] ?? 0),
    jalaliYear: Number(t['jalaliYear'] ?? t['year'] ?? 0),
    runtimeMin: (t['runtimeMin'] as number | null) ?? (t['durationMin'] as number | null) ?? null,
    seasonsCount: (t['seasonsCount'] as number | null) ?? (t['seasons'] as number | null) ?? null,
    episodesCount: (t['episodesCount'] as number | null) ?? null,
    countries: (t['countries'] as string[]) ?? [],
    genres,
    director: String(t['director'] ?? ''),
    cast: (t['cast'] as string[]) ?? [],
    description: String(t['description'] ?? t['overview'] ?? ''),
    imdb: Number(t['imdb'] ?? t['rating'] ?? 0),
    siteScore: Number(t['siteScore'] ?? t['imdb'] ?? t['rating'] ?? 0),
    ageRating: String(t['ageRating'] ?? ''),
    quality: String(t['quality'] ?? ''),
    dubbed: Boolean(t['dubbed']),
    subtitled: t['subtitled'] !== false,
    poster: String(t['poster'] ?? ''),
    backdrop: String(t['backdrop'] ?? t['backdropUrl'] ?? ''),
    views: Number(t['views'] ?? 0),
    addedAt: String(t['addedAt'] ?? t['createdAt'] ?? '2024-01-01'),
    featured: Boolean(t['featured']),
    top10Rank: (t['top10Rank'] as number | undefined) ?? undefined,
    ageGroup: (t['ageGroup'] as Title['ageGroup']) ?? undefined,
    language: String(t['language'] ?? 'فارسی'),
    seasons: toSeasons(t),
    downloadLinks: rawLinks.map((l) => ({
      id: Number(l['id'] ?? 0),
      episodeId: l['episodeId'] == null ? null : Number(l['episodeId']),
      type: String(l['type'] ?? ''),
      url: String(l['url'] ?? ''),
      quality: String(l['quality'] ?? ''),
      size: String(l['size'] ?? ''),
      label: String(l['label'] ?? ''),
    })),
    ...(Array.isArray(t['actors']) ? { actors: t['actors'] as Array<{ slug: string; name: string; photo?: string }> } : {}),
    ...(Array.isArray(t['collectionSlugs']) ? { collectionSlugs: t['collectionSlugs'] as string[] } : {}),
  };
}

export interface TitleWithExtras extends Title {
  actors?: Array<{ slug: string; name: string; photo?: string }>;
  collectionSlugs?: string[];
}

function toSeasons(t: Record<string, unknown>): Title['seasons'] {
  if (Array.isArray(t['seasons'])) {
    return (t['seasons'] as Array<Record<string, unknown>>).map((s) => ({
      number: Number(s['number'] ?? 0),
      episodes: ((s['episodes'] as Array<Record<string, unknown>>) ?? []).map((e) => ({
        id: String(e['id'] ?? `${t['slug']}-s${s['number']}e${e['number']}`),
        episodeId: e['episodeId'] == null ? undefined : Number(e['episodeId']),
        season: Number(e['season'] ?? s['number'] ?? 0),
        number: Number(e['number'] ?? 0),
        title: String(e['title'] ?? ''),
        durationMin: Number(e['durationMin'] ?? 0),
        thumbnail: String(e['thumbnail'] ?? ''),
        description: String(e['description'] ?? ''),
      })),
    }));
  }
  const flat = t['episodes'];
  if (!Array.isArray(flat) || flat.length === 0) return undefined;
  const bySeason = new Map<number, Array<Record<string, unknown>>>();
  for (const e of flat as Array<Record<string, unknown>>) {
    const sn = Number(e['season'] ?? 1);
    if (!bySeason.has(sn)) bySeason.set(sn, []);
    bySeason.get(sn)!.push(e);
  }
  return [...bySeason.entries()].map(([season, eps]) => ({
    number: season,
    episodes: eps.map((e) => ({
      id: String(e['id'] ?? `${t['slug']}-s${season}e${e['number']}`),
      season,
      number: Number(e['number'] ?? 0),
      title: String(e['title'] ?? ''),
      durationMin: Number(e['durationMin'] ?? 0),
      thumbnail: String(e['thumbnail'] ?? ''),
      description: String(e['description'] ?? ''),
    })),
  }));
}

/* ------------------------------- catalog ------------------------------ */

export async function getHeroTitles(limit = 5): Promise<Title[]> {
  try {
    const r = await apiGet<Array<Record<string, unknown>>>(`/api/titles?sort=rating&featured=true&page=1&pageSize=${limit}`);
    return r.map(toTitle);
  } catch {
    return localTitles
      .filter((t) => t.featured)
      .sort((a, b) => b.imdb - a.imdb)
      .slice(0, limit);
  }
}

/** Admin: full replace of the Hero set. Checked slugs stay, unchecked are removed. */
export async function setHeroSlugs(slugs: string[]): Promise<{ count: number }> {
  const res = await fetch('/api/titles/featured', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ slugs }),
  });
  if (!res.ok) {
    let message = 'خطا در ثبت.';
    try {
      const b = (await res.json()) as { error?: string };
      if (b?.error) message = b.error;
    } catch { /* keep default */ }
    throw new Error(message);
  }
  const parsed = (await res.json()) as { success: boolean; data: { count: number } };
  if (!parsed || parsed.success !== true) throw new Error('خطا در ثبت.');
  return parsed.data;
}

async function putSlugs(path: string, slugs: string[]): Promise<{ count: number }> {
  const res = await fetch(path, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ slugs }),
  });
  if (!res.ok) {
    let message = 'خطا در ثبت.';
    try {
      const b = (await res.json()) as { error?: string };
      if (b?.error) message = b.error;
    } catch { /* keep default */ }
    throw new Error(message);
  }
  const parsed = (await res.json()) as { success: boolean; data: { count: number } };
  if (!parsed || parsed.success !== true) throw new Error('خطا در ثبت.');
  return parsed.data;
}

/** Admin: replace the Top10 set (rank = selection order). */
export async function setTop10Slugs(slugs: string[]): Promise<{ count: number }> {
  return putSlugs('/api/titles/top10', slugs);
}

/** Admin: replace the homepage "popular animations" set. */
export async function setHomeAnimationSlugs(slugs: string[]): Promise<{ count: number }> {
  return putSlugs('/api/titles/home-animation', slugs);
}

export async function getMovies(limit = 10): Promise<Title[]> {
  return (await listTitles({ type: 'movie', sort: 'newest', pageSize: limit })).data;
}

export async function getSeries(limit = 10): Promise<Title[]> {
  return (await listTitles({ type: 'series', sort: 'views', pageSize: limit })).data;
}

export async function getAnimations(limit = 10): Promise<Title[]> {
  return (await listTitles({ type: 'animation', sort: 'newest', pageSize: limit })).data;
}

export async function getTop10(): Promise<Title[]> {
  try {
    const r = await apiGet<Array<Record<string, unknown>>>('/api/titles/top');
    return r.map(toTitle);
  } catch {
    return localTitles
      .filter((t) => t.top10Rank != null)
      .sort((a, b) => (a.top10Rank ?? 99) - (b.top10Rank ?? 99))
      .slice(0, 10);
  }
}

export async function getFresh(limit = 10): Promise<Title[]> {
  return (await listTitles({ sort: 'newest', pageSize: limit })).data;
}

export async function listTitles(params: ListParams = {}): Promise<{ data: Title[]; meta: PageMeta }> {
  const { page = 1, pageSize = 12, ...rest } = params;
  try {
    const qs = new URLSearchParams();
    for (const [k, v] of Object.entries({ ...rest, page, pageSize })) {
      if (v !== undefined && v !== '') qs.set(k, String(v));
    }
    const r = await apiGetPaged<Record<string, unknown>>(`/api/titles?${qs.toString()}`);
    return { data: r.data.map(toTitle), meta: r.meta };
  } catch {
    const out = filterTitles(localTitles, { ...rest, sort: rest.sort ?? 'newest' });
    const totalPages = Math.max(1, Math.ceil(out.length / pageSize));
    const safe = Math.min(Math.max(1, page), totalPages);
    const items = out.slice((safe - 1) * pageSize, safe * pageSize);
    return { data: items, meta: { page: safe, pageSize, total: out.length, totalPages } };
  }
}

export interface TitleDetail extends Title {
  actors: { slug: string; name: string }[];
  episodes: { season: number; number: number; title: string; durationMin: number }[];
  collectionSlugs: string[];
}

export async function getTitle(slug: string): Promise<TitleWithExtras | undefined> {
  try {
    const t = await apiGet<Record<string, unknown>>(`/api/titles/${encodeURIComponent(slug)}`);
    return toTitle(t) as TitleWithExtras;
  } catch {
    return localTitles.find((t) => t.slug === slug);
  }
}

export async function getTitleLinks(slug: string, episodeId?: number): Promise<DownloadLink[]> {
  try {
    const qs = episodeId !== undefined ? `?episodeId=${episodeId}` : '';
    const rows = await apiGet<Array<Record<string, unknown>>>(`/api/titles/${encodeURIComponent(slug)}/links${qs}`);
    return rows.map((l) => ({
      id: Number(l['id'] ?? 0),
      episodeId: l['episodeId'] == null ? null : Number(l['episodeId']),
      type: String(l['type'] ?? l['linkType'] ?? ''),
      url: String(l['url'] ?? ''),
      quality: String(l['quality'] ?? ''),
      size: String(l['size'] ?? ''),
      label: String(l['label'] ?? ''),
    }));
  } catch {
    return [];
  }
}

export async function getRelated(slug: string, limit = 6): Promise<Title[]> {
  try {
    const r = await apiGet<Array<Record<string, unknown>>>(`/api/titles/${encodeURIComponent(slug)}/related?limit=${limit}`);
    return r.map(toTitle);
  } catch {
    const base = localTitles.find((t) => t.slug === slug);
    if (!base) return [];
    return similarTitles(localTitles, base, limit);
  }
}

export async function getTitleSlugs(type?: Title['type']): Promise<string[]> {
  try {
    const qs = type ? `?type=${type}&page=1&pageSize=100` : '?page=1&pageSize=100';
    const r = await apiGetPaged<{ slug: string }>(`/api/titles${qs}`);
    return r.data.map((t) => t.slug);
  } catch {
    return (type ? localTitles.filter((t) => t.type === type) : localTitles).map((t) => t.slug);
  }
}

export async function getGenres(): Promise<Genre[]> {
  try {
    return await apiGet<Genre[]>('/api/genres');
  } catch {
    return localGenres;
  }
}

export async function getGenreSlugs(): Promise<string[]> {
  return (await getGenres()).map((g) => g.slug);
}

export async function getGenre(slug: string): Promise<{ genre: Genre; titles: Title[] } | undefined> {
  try {
    const r = await apiGet<{ genre: Genre; titles: Title[] }>(`/api/genres/${encodeURIComponent(slug)}`);
    return { genre: r.genre, titles: r.titles.map((t) => toTitle(t as unknown as Record<string, unknown>)) };
  } catch {
    const genre = localGenres.find((g) => g.slug === slug);
    if (!genre) return undefined;
    return { genre, titles: localTitles.filter((t) => t.genres.includes(genre.name)) };
  }
}

export async function getCollections(): Promise<Collection[]> {
  try {
    const r = await apiGet<Array<Collection & { titleSlugs?: string[] }>>('/api/collections');
    return r.map((c) => ({ slug: c.slug, name: c.name, description: c.description, cover: c.cover, titleSlugs: c.titleSlugs ?? [] }));
  } catch {
    return localCollections;
  }
}

export async function getCollection(slug: string): Promise<{ collection: Collection; titles: Title[] } | undefined> {
  try {
    const r = await apiGet<{ collection: Collection & { titleSlugs?: string[] }; titles: Array<Record<string, unknown>> }>(
      `/api/collections/${encodeURIComponent(slug)}`,
    );
    return {
      collection: { slug: r.collection.slug, name: r.collection.name, description: r.collection.description, cover: r.collection.cover, titleSlugs: r.collection.titleSlugs ?? r.titles.map((t) => String(t['slug'])) },
      titles: r.titles.map(toTitle),
    };
  } catch {
    const collection = localCollections.find((c) => c.slug === slug);
    if (!collection) return undefined;
    return { collection, titles: localTitles.filter((t) => collection.titleSlugs.includes(t.slug)) };
  }
}

export async function getActor(slug: string): Promise<{ actor: Actor; titles: Title[] } | undefined> {
  try {
    // Backend returns { success, data: { actor, titles } } — accept both nested and legacy flat shapes.
    const r = await apiGet<{ actor: Actor & { titles?: Array<Record<string, unknown>> }; titles: Array<Record<string, unknown>> } & Actor & { titles: Array<Record<string, unknown>> }>(
      `/api/actors/${encodeURIComponent(slug)}`,
    );
    const nested = r as { actor?: Actor; titles?: Array<Record<string, unknown>> };
    if (nested.actor && Array.isArray(nested.titles)) {
      return { actor: nested.actor as Actor, titles: (nested.titles as Array<Record<string, unknown>>).map(toTitle) };
    }
    const flat = r as unknown as { slug: string; name: string; latinName: string; photo: string; birthYear: number; birthPlace: string; bio: string; titles: Array<Record<string, unknown>> };
    const { titles: ts, ...actor } = flat;
    return { actor: actor as Actor, titles: ts.map(toTitle) };
  } catch {
    const { actors } = await import('../data');
    const actor = actors.find((a) => a.slug === slug);
    if (!actor) return undefined;
    const { actorTitles } = await import('../data');
    return { actor, titles: actorTitles(actor.name) };
  }
}

export async function getActorSlugs(): Promise<string[]> {
  const { actors } = await import('../data');
  return actors.map((a) => a.slug);
}

export async function searchTitles(query: string, type?: Title['type']): Promise<Title[]> {
  const q = query.trim();
  if (!q) return [];
  try {
    const qs = new URLSearchParams({ q, page: '1', pageSize: '24' });
    if (type) qs.set('type', type);
    const r = await apiGetPaged<Record<string, unknown>>(`/api/search?${qs.toString()}`);
    return r.data.map(toTitle);
  } catch {
    const { searchTitles: localSearch } = await import('./repository');
    return localSearch(localTitles, q)
      .filter((t) => !type || t.type === type)
      .slice(0, 24);
  }
}

export async function getAllTitles(): Promise<Title[]> {
  return (await listTitles({ page: 1, pageSize: 100 })).data;
}

export async function getFilterOptions(): Promise<{ years: number[]; countries: string[] }> {
  const all = await getAllTitles();
  const years = [...new Set(all.map((t) => t.year))].sort((a, b) => b - a);
  const countries = [...new Set(all.flatMap((t) => t.countries))];
  return { years, countries };
}

export async function getCollectionsWithTitles(): Promise<Array<{ collection: Collection; titles: Title[] }>> {
  const cols = await getCollections();
  return Promise.all(
    cols.map(async (collection) => {
      const full = await getCollection(collection.slug);
      return { collection, titles: full?.titles ?? [] };
    }),
  );
}

export async function getTitlesBySlugs(slugs: string[]): Promise<Title[]> {
  if (slugs.length === 0) return [];
  const found = (await Promise.all(slugs.map((s) => getTitle(s).catch(() => undefined)))).filter(Boolean) as Title[];
  if (found.length > 0) return found;
  const set = new Set(slugs);
  return localTitles.filter((t) => set.has(t.slug));
}

export async function getHomeData(): Promise<HomeData> {
  const [hero, movies, series, animations, top10, fresh, homeCollections, homeGenres] = await Promise.all([
    getHeroTitles(),
    getMovies(),
    getSeries(),
    getAnimations(),
    getTop10(),
    getFresh(),
    getCollections(),
    getGenres(),
  ]);
  return { hero, movies, series, animations, top10, fresh, collections: homeCollections, genres: homeGenres };
}

/* --------------------- homepage: database only ---------------------- */

/**
 * Homepage data, always from the live API (database).
 * Unlike the generic helpers above, there is intentionally NO local-mock
 * fallback here: each section is one API call, and a failed section renders
 * as an empty state instead of mock data.
 */
export async function listTitlesLive(params: ListParams = {}): Promise<{ data: Title[]; meta: PageMeta }> {
  const { page = 1, pageSize = 12, ...rest } = params;
  try {
    const qs = new URLSearchParams();
    for (const [k, v] of Object.entries({ ...rest, page, pageSize })) {
      if (v !== undefined && v !== '') qs.set(k, String(v));
    }
    const r = await apiGetPaged<Record<string, unknown>>(`/api/titles?${qs.toString()}`);
    return { data: r.data.map(toTitle), meta: r.meta };
  } catch {
    return { data: [], meta: { page, pageSize, total: 0, totalPages: 1 } };
  }
}

export async function getHomeDataLive(): Promise<HomeData> {
  const [hero, movies, series, animations, top10, fresh, collections, genres] = await Promise.all([
    apiGet<Array<Record<string, unknown>>>('/api/titles?sort=rating&featured=true&page=1&pageSize=12')
      .then((r) => r.map(toTitle))
      .catch(() => [] as Title[]),
    listTitlesLive({ type: 'movie', sort: 'newest', pageSize: 10 })
      .then((r) => r.data)
      .catch(() => [] as Title[]),
    listTitlesLive({ type: 'series', sort: 'views', pageSize: 10 })
      .then((r) => r.data)
      .catch(() => [] as Title[]),
    listTitlesLive({ homeAnimation: true, sort: 'rating', pageSize: 12 })
      .then((r) => r.data)
      .catch(() => [] as Title[]),
    apiGet<Array<Record<string, unknown>>>('/api/titles/top')
      .then((r) => r.map(toTitle))
      .catch(() => [] as Title[]),
    listTitlesLive({ sort: 'newest', pageSize: 10 })
      .then((r) => r.data)
      .catch(() => [] as Title[]),
    apiGet<Array<Collection & { titleSlugs?: string[] }>>('/api/collections')
      .then((r) =>
        r.map((c) => ({ slug: c.slug, name: c.name, description: c.description, cover: c.cover, titleSlugs: c.titleSlugs ?? [] })),
      )
      .catch(() => [] as Collection[]),
    apiGet<Genre[]>('/api/genres').catch(() => [] as Genre[]),
  ]);
  return { hero, movies, series, animations, top10, fresh, collections, genres };
}

/* ------------------ listing pages: database only ------------------ */

/**
 * Listing/filter pages, always from the live API (database).
 * No local-mock fallback anywhere on these paths: failures yield empty
 * results (pages already render EmptyState for those).
 */
export async function getGenresLive(): Promise<Genre[]> {
  try {
    return await apiGet<Genre[]>('/api/genres');
  } catch {
    return [];
  }
}

export async function getGenreSlugsLive(): Promise<string[]> {
  return (await getGenresLive()).map((g) => g.slug);
}

export async function getGenreLive(slug: string): Promise<{ genre: Genre; titles: Title[] } | undefined> {
  try {
    const first = await apiGet<{ genre: Genre; titles: Array<Record<string, unknown>>; meta?: PageMeta }>(
      `/api/genres/${encodeURIComponent(slug)}?page=1&pageSize=50`,
    );
    const titles = first.titles.map((t) => toTitle(t));
    const totalPages = first.meta?.totalPages ?? 1;
    for (let p = 2; p <= totalPages; p++) {
      try {
        const r = await apiGet<{ titles: Array<Record<string, unknown>> }>(
          `/api/genres/${encodeURIComponent(slug)}?page=${p}&pageSize=50`,
        );
        titles.push(...r.titles.map((t) => toTitle(t)));
      } catch {
        /* keep titles gathered so far */
      }
    }
    return { genre: first.genre, titles };
  } catch {
    return undefined;
  }
}

export async function getCollectionsLive(): Promise<Collection[]> {
  try {
    const r = await apiGet<Array<Collection & { titleSlugs?: string[] }>>('/api/collections');
    return r.map((c) => ({ slug: c.slug, name: c.name, description: c.description, cover: c.cover, titleSlugs: c.titleSlugs ?? [] }));
  } catch {
    return [];
  }
}

export async function getCollectionLive(slug: string): Promise<{ collection: Collection; titles: Title[] } | undefined> {
  try {
    const r = await apiGet<{ collection: Collection & { titleSlugs?: string[] }; titles: Array<Record<string, unknown>> }>(
      `/api/collections/${encodeURIComponent(slug)}`,
    );
    return {
      collection: { slug: r.collection.slug, name: r.collection.name, description: r.collection.description, cover: r.collection.cover, titleSlugs: r.collection.titleSlugs ?? r.titles.map((t) => String(t['slug'])) },
      titles: r.titles.map(toTitle),
    };
  } catch {
    return undefined;
  }
}

export async function getCollectionsWithTitlesLive(): Promise<Array<{ collection: Collection; titles: Title[] }>> {
  const cols = await getCollectionsLive();
  const out: Array<{ collection: Collection; titles: Title[] }> = [];
  for (const collection of cols) {
    const full = await getCollectionLive(collection.slug);
    out.push({ collection, titles: full?.titles ?? [] });
  }
  return out;
}

export async function getAllTitlesLive(): Promise<Title[]> {
  const first = await listTitlesLive({ page: 1, pageSize: 50 });
  const out = [...first.data];
  for (let p = 2; p <= first.meta.totalPages; p++) {
    out.push(...(await listTitlesLive({ page: p, pageSize: 50 })).data);
  }
  return out;
}

/* ------------------------------- comments ----------------------------- */

export interface CommentItem {
  id: string;
  author: string;
  avatar: string;
  date: string;
  rating: number;
  text: string;
  likes: number;
}

export async function getTitleComments(slug: string): Promise<CommentItem[]> {
  try {
    const rows = await apiGet<Array<Record<string, unknown>>>(`/api/titles/${encodeURIComponent(slug)}/comments`);
    return rows.map((c) => ({
      id: String(c['id'] ?? `${slug}-${Date.now()}`),
      author: String(c['author'] ?? 'مهمان'),
      avatar: String(c['avatar'] ?? '/images/actors/a1.svg'),
      date: String(c['date'] ?? ''),
      rating: Number(c['rating'] ?? 0),
      text: String(c['text'] ?? ''),
      likes: Number(c['likes'] ?? 0),
    }));
  } catch {
    const { comments } = await import('../data');
    return comments
      .filter((c) => c.titleSlug === slug)
      .map((c) => ({ id: c.id, author: c.author, avatar: c.avatar, date: c.date, rating: c.rating, text: c.text, likes: c.likes }));
  }
}

export async function postComment(slug: string, input: { author: string; text: string }): Promise<CommentItem> {
  const res = await fetch(`${isBrowser && !API ? '' : API ?? ''}/api/titles/${encodeURIComponent(slug)}/comments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ author: input.author, text: input.text }),
  });
  if (!res.ok) throw new Error(`API ${res.status}`);
  const body = (await res.json()) as { success: boolean; data: Record<string, unknown> };
  if (!body || body.success !== true) throw new Error('API error');
  const c = body.data;
  return {
    id: String(c['id'] ?? `${slug}-${Date.now()}`),
    author: String(c['author'] ?? input.author),
    avatar: String(c['avatar'] ?? '/images/actors/a1.svg'),
    date: String(c['date'] ?? 'امروز'),
    rating: Number(c['rating'] ?? 0),
    text: String(c['text'] ?? input.text),
    likes: Number(c['likes'] ?? 0),
  };
}

/* -------------------------------- forms ------------------------------- */

export async function postContact(input: { name: string; email: string; subject?: string; message: string }): Promise<{ id: number }> {
  const r = await apiPost<{ id: number }>('/api/contact', input);
  return r;
}

export async function postReport(input: { link?: string; type: string; description: string }): Promise<{ id: number }> {
  const r = await apiPost<{ id: number }>('/api/reports', input);
  return r;
}

export interface TitlePageData {
  title: Title;
  similar: Title[];
  comments: CommentItem[];
  castActors: { name: string; actor: { slug: string; name: string; photo: string } | null }[];
  collectionSlugs: string[];
}

export async function getTitleDetail(slug: string): Promise<TitlePageData | undefined> {
  try {
    const [title, similar, comments] = await Promise.all([
      getTitle(slug),
      getRelated(slug, 10),
      getTitleComments(slug),
    ]);
    if (!title) return undefined;
    const actorsByName = new Map((title.actors ?? []).map((a) => [a.name, a] as const));
    const castActors = title.cast.map((name) => ({ name, actor: actorsByName.get(name) ?? null }));
    return { title, similar, comments, castActors, collectionSlugs: title.collectionSlugs ?? [] };
  } catch {
    return undefined;
  }
}

async function apiPost<T>(path: string, body: unknown): Promise<T> {
  const base = isBrowser && !API ? '' : API;
  if (!isBrowser && !API) throw new Error('NO_API');
  const res = await fetch(`${base}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    let message = 'خطا در ارسال.';
    try {
      const b = (await res.json()) as { error?: string };
      if (b?.error) message = b.error;
    } catch { /* keep default */ }
    throw new Error(message);
  }
  const parsed = (await res.json()) as { success: boolean; data: T };
  if (!parsed || parsed.success !== true) throw new Error('خطا در ارسال.');
  return parsed.data;
}

/* ------------------------------ user lists ---------------------------- */

export type UserListKind = 'favorites' | 'watchlist';

export async function fetchMe(): Promise<{ id: string; email: string; name: string } | null> {
  try {
    const r = await apiGet<{ user?: { id: string; email: string; name: string } } & { id?: string; email?: string; name?: string }>('/api/auth/me');
    // Backend GET /api/auth/me returns { success, data: PublicUser } directly,
    // while login/register/refresh return { success, data: { user } } — accept both.
    const u = (r as { user?: { id: string; email: string; name: string } }).user ?? (r as unknown as { id: string; email: string; name: string });
    if (!u || typeof u.id !== 'string') return null;
    return { id: u.id, email: u.email, name: u.name };
  } catch {
    return null;
  }
}

async function readSlugs(kind: UserListKind): Promise<string[]> {
  try {
    return await apiGet<string[]>(`/api/users/me/${kind}`);
  } catch {
    const { readList, FAV_KEY, WATCH_KEY } = await import('./store');
    try {
      return readList(kind === 'favorites' ? FAV_KEY : WATCH_KEY);
    } catch {
      return [];
    }
  }
}

async function writeSlugs(kind: UserListKind, slugs: string[]): Promise<void> {
  const { writeList, FAV_KEY, WATCH_KEY } = await import('./store');
  try {
    await apiPut<void>(`/api/users/me/${kind}`, { slugs });
  } catch {
    /* offline or anonymous — localStorage remains the source of truth */
  }
  try {
    writeList(kind === 'favorites' ? FAV_KEY : WATCH_KEY, slugs);
  } catch { /* ignore */ }
}

async function apiPut<T>(path: string, body: unknown): Promise<T> {
  const base = isBrowser && !API ? '' : API;
  if (!isBrowser && !API) throw new Error('NO_API');
  const res = await fetch(`${base}${path}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`API ${res.status}`);
  const parsed = (await res.json()) as { success: boolean; data: T };
  if (!parsed || parsed.success !== true) throw new Error('API error');
  return parsed.data;
}

export async function getUserList(kind: UserListKind): Promise<string[]> {
  return readSlugs(kind);
}

export async function toggleUserList(kind: UserListKind, slug: string): Promise<string[]> {
  const current = await readSlugs(kind);
  const next = current.includes(slug) ? current.filter((s) => s !== slug) : [...current, slug];
  await writeSlugs(kind, next);
  return next;
}

export async function inUserList(kind: UserListKind, slug: string): Promise<boolean> {
  return (await readSlugs(kind)).includes(slug);
}

export async function getProgressMap(): Promise<Record<string, number>> {
  try {
    return await apiGet<Record<string, number>>('/api/users/me/progress');
  } catch {
    return {};
  }
}

export async function setProgress(slug: string, seconds: number): Promise<void> {
  try {
    await apiPut('/api/users/me/progress', { slug, seconds });
  } catch {
    /* offline — page-level localStorage fallback stays untouched */
  }
}

export { routeFor } from './repository';
