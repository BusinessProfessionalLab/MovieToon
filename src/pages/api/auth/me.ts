import type { APIRoute } from 'astro';
import { ACCESS_COOKIE, json } from '../../../lib/auth/http';
import { publicUser, getUserFromAccessToken } from '../../../lib/auth/tokens';

export const GET: APIRoute = async ({ cookies }) => {
  const user = getUserFromAccessToken(cookies.get(ACCESS_COOKIE)?.value);
  return user ? json({ user: publicUser(user) }) : json({ error: 'وارد حساب کاربری شوید.' }, 401);
};
