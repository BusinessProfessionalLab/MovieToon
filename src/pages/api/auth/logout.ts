import type { APIRoute } from 'astro';
import { clearAuthCookies, hasSameOrigin, json, REFRESH_COOKIE } from '../../../lib/auth/http';
import { revokeRefreshToken } from '../../../lib/auth/tokens';

export const POST: APIRoute = async ({ request, cookies }) => {
  const secure = new URL(request.url).protocol === 'https:';
  if (!hasSameOrigin(request)) return json({ error: 'درخواست نامعتبر است.' }, 403);
  revokeRefreshToken(cookies.get(REFRESH_COOKIE)?.value);
  clearAuthCookies(cookies, secure);
  return json({ ok: true });
};
