import type { APIRoute } from 'astro';
import { clearAuthCookies, hasSameOrigin, json, REFRESH_COOKIE, setAuthCookies } from '../../../lib/auth/http';
import { publicUser, rotateRefreshToken } from '../../../lib/auth/tokens';

export const POST: APIRoute = async ({ request, cookies }) => {
  const secure = new URL(request.url).protocol === 'https:';
  if (!hasSameOrigin(request)) return json({ error: 'درخواست نامعتبر است.' }, 403);
  const result = rotateRefreshToken(cookies.get(REFRESH_COOKIE)?.value);
  if (!result) {
    clearAuthCookies(cookies, secure);
    return json({ error: 'نشست شما پایان یافته است.' }, 401);
  }
  setAuthCookies(cookies, result.tokens, secure);
  return json({ user: publicUser(result.user) });
};
