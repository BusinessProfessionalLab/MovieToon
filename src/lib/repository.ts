import type { Title } from '../types';

export interface FilterOptions {
  q?: string;
  type?: 'movie' | 'series' | 'animation';
  genre?: string;
  year?: number;
  country?: string;
  minRating?: number;
  language?: string;
  ageGroup?: string;
  sort?: 'newest' | 'views' | 'rating' | 'year';
}

export function searchTitles(titles: Title[], q: string): Title[] {
  const query = q.trim().toLowerCase();
  if (!query) return [];
  return titles.filter((t) =>
    [t.titleFa, t.titleEn, t.director, ...t.cast, ...t.genres].join(' ').toLowerCase().includes(query),
  );
}

export function filterTitles(titles: Title[], opts: FilterOptions): Title[] {
  let out = [...titles];
  if (opts.type) out = out.filter((t) => t.type === opts.type);
  if (opts.q) {
    const query = opts.q.trim().toLowerCase();
    if (query) {
      out = out.filter((t) =>
        [t.titleFa, t.titleEn, t.director, ...t.cast].join(' ').toLowerCase().includes(query),
      );
    }
  }
  if (opts.genre) out = out.filter((t) => t.genres.includes(opts.genre!));
  if (opts.year) out = out.filter((t) => t.year === opts.year);
  if (opts.country) out = out.filter((t) => t.countries.includes(opts.country!));
  if (opts.minRating) out = out.filter((t) => t.imdb >= opts.minRating!);
  if (opts.language) out = out.filter((t) => t.language === opts.language);
  if (opts.ageGroup) out = out.filter((t) => t.ageGroup === (opts.ageGroup as Title['ageGroup']));
  switch (opts.sort ?? 'newest') {
    case 'views':
      out.sort((a, b) => b.views - a.views);
      break;
    case 'rating':
      out.sort((a, b) => b.imdb - a.imdb);
      break;
    case 'year':
      out.sort((a, b) => b.year - a.year);
      break;
    default:
      out.sort((a, b) => b.addedAt.localeCompare(a.addedAt));
  }
  return out;
}

export function paginate<T>(items: T[], page: number, perPage: number): { items: T[]; totalPages: number; page: number } {
  const totalPages = Math.max(1, Math.ceil(items.length / perPage));
  const safe = Math.min(Math.max(1, page), totalPages);
  const start = (safe - 1) * perPage;
  return { items: items.slice(start, start + perPage), totalPages, page: safe };
}

export function similarTitles(all: Title[], current: Title, count = 8): Title[] {
  return all
    .filter((t) => t.slug !== current.slug)
    .map((t) => ({
      t,
      score:
        t.genres.filter((g) => current.genres.includes(g)).length * 3 +
        (t.type === current.type ? 2 : 0) +
        t.countries.filter((c) => current.countries.includes(c)).length,
    }))
    .sort((a, b) => b.score - a.score || b.t.imdb - a.t.imdb)
    .slice(0, count)
    .map((x) => x.t);
}

export function routeFor(t: Pick<Title, 'type' | 'slug'>): string {
  if (t.type === 'movie') return `/movies/${t.slug}`;
  if (t.type === 'series') return `/series/${t.slug}`;
  return `/animations/${t.slug}`;
}
