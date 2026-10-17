import type { APIRoute } from 'astro';
import { titles } from '../data';
import { routeFor } from '../lib/repository';

export const GET: APIRoute = async () => {
  const data = titles.map((t) => ({ slug: t.slug, titleFa: t.titleFa, poster: t.poster, href: routeFor(t) }));
  return new Response(JSON.stringify(data), { headers: { 'content-type': 'application/json; charset=utf-8' } });
};
