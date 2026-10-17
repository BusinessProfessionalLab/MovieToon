import type { APIRoute } from 'astro';
import { checkRateLimit } from '../../../lib/auth/database';
import { hasSameOrigin, json, normalizeEmail, readJson, setAuthCookies } from '../../../lib/auth/http';
import { loginUser, publicUser } from '../../../lib/auth/tokens';

export const POST: APIRoute = async ({ request, cookies }) => {
  if (!hasSameOrigin(request)) return json({ error: 'درخواست نامعتبر است.' }, 403);
  const body = await readJson(request);
  const email = normalizeEmail(body?.email);
  const password = typeof body?.password === 'string' ? body.password : '';
  if (!email || !password || Buffer.byteLength(password) > 128) return json({ error: 'ایمیل یا گذرواژه معتبر نیست.' }, 400);
  if (!checkRateLimit('login', email)) return json({ error: 'تعداد تلاش‌ها زیاد است. ۱۵ دقیقه بعد دوباره امتحان کنید.' }, 429);
  const result = await loginUser(email, password);
  if (!result) return json({ error: 'ایمیل یا گذرواژه نادرست است.' }, 401);
  setAuthCookies(cookies, result.tokens, new URL(request.url).protocol === 'https:');
  return json({ user: publicUser(result.user) });
};
