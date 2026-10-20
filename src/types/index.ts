export type TitleType = 'movie' | 'series' | 'animation';

export interface Genre {
  slug: string;
  name: string;
  description: string;
}

export interface Actor {
  slug: string;
  name: string;
  latinName: string;
  photo: string;
  birthYear: number;
  birthPlace: string;
  bio: string;
}

export interface Episode {
  id: string;
  episodeId?: number;
  season: number;
  number: number;
  title: string;
  durationMin: number;
  thumbnail: string;
  description: string;
}

export interface DownloadLink {
  id: number;
  episodeId: number | null;
  type: string;
  url: string;
  quality: string;
  size: string;
  label: string;
}

export interface Season {
  number: number;
  episodes: Episode[];
}

export interface TitleComment {
  id: string;
  titleSlug: string;
  author: string;
  avatar: string;
  date: string;
  rating: number;
  text: string;
  likes: number;
}

export interface Title {
  slug: string;
  type: TitleType;
  titleFa: string;
  titleEn: string;
  year: number;
  jalaliYear: number;
  runtimeMin: number | null;
  seasonsCount: number | null;
  episodesCount: number | null;
  countries: string[];
  genres: string[];
  director: string;
  cast: string[];
  description: string;
  imdb: number;
  siteScore: number;
  ageRating: string;
  quality: string;
  dubbed: boolean;
  subtitled: boolean;
  poster: string;
  backdrop: string;
  views: number;
  addedAt: string;
  featured?: boolean;
  top10Rank?: number;
  ageGroup?: 'کودک' | 'نوجوان' | 'خانواده';
  language: string;
  seasons?: Season[];
  downloadLinks?: DownloadLink[];
}

export interface Plan {
  id: string;
  name: string;
  priceMonthly: number;
  priceYearly: number;
  features: string[];
  highlighted?: boolean;
}

export interface Collection {
  slug: string;
  name: string;
  description: string;
  cover: string;
  titleSlugs: string[];
}
