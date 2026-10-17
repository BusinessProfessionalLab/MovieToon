/**
 * Home-page data-access layer.
 *
 * Everything the home page needs flows through here — pages and components
 * must not import `../data` directly. The functions are async on purpose:
 * swapping the local mock for `fetch` calls to a real API is a one-file
 * change, and the returned shapes already match what an API would return.
 * No new endpoints are introduced by this module.
 */
import type { Collection, Genre, Title } from '../types';
import { collections, genres, titles } from '../data';
import { filterTitles } from './repository';

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

/**
 * Featured rail for the hero.
 * Uses the existing `featured` flag (highest-rated first). If the backend
 * ever gains a real "featured" concept, only this function changes.
 */
export async function getHeroTitles(limit = 5): Promise<Title[]> {
  return titles
    .filter((t) => t.featured)
    .sort((a, b) => b.imdb - a.imdb)
    .slice(0, limit);
}

export async function getMovies(limit = 10): Promise<Title[]> {
  return filterTitles(titles, { type: 'movie', sort: 'newest' }).slice(0, limit);
}

export async function getSeries(limit = 10): Promise<Title[]> {
  return filterTitles(titles, { type: 'series', sort: 'views' }).slice(0, limit);
}

export async function getAnimations(limit = 10): Promise<Title[]> {
  return filterTitles(titles, { type: 'animation', sort: 'newest' }).slice(0, limit);
}

export async function getTop10(): Promise<Title[]> {
  return titles
    .filter((t) => t.top10Rank != null)
    .sort((a, b) => (a.top10Rank ?? 99) - (b.top10Rank ?? 99))
    .slice(0, 10);
}

export async function getFresh(limit = 10): Promise<Title[]> {
  return filterTitles(titles, { sort: 'newest' }).slice(0, limit);
}

export async function getCollections(): Promise<Collection[]> {
  return collections;
}

export async function getGenres(): Promise<Genre[]> {
  return genres;
}

export async function getHomeData(): Promise<HomeData> {
  const [hero, movies, series, animations, top10, fresh, homeCollections, homeGenres] =
    await Promise.all([
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
