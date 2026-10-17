import type { APIRoute } from 'astro';
import { checkRateLimit, findUserByEmail } from '../../../lib/auth/database';
import { publicUser, registerUser } from '../../../lib/auth/tokens';
import { hasSameOrigin, json, normalizeEmail, readJson, setAuthCookies } from '../../../lib/auth/http';

export const POST: APIRoute = async ({ request, cookies }) => {
  if (!hasSameOrigin(request)) return json({ error: 'درخواست نامعتبر است.' }, 403);
  const body = await readJson(request);
  const name = typeof body?.name === 'string' ? body.name.trim() : '';
  const email = normalizeEmail(body?.email);
  const password = typeof body?.password === 'string' ? body.password : '';
  if (name.length < 2 || name.length > 80 || !email || password.length < 12 || Buffer.byteLength(password) > 128) {
    return json({ error: 'نام، ایمیل یا گذرواژه معتبر نیست. گذرواژه باید دست‌کم ۱۲ نویسه داشته باشد.' }, 400);
  }
  if (!checkRateLimit('register', email, 5)) return json({ error: 'تعداد درخواست‌ها زیاد است. کمی بعد دوباره تلاش کنید.' }, 429);
  if (findUserByEmail(email)) return json({ error: 'با این ایمیل حسابی وجود دارد.' }, 409);
  try {
    const { user, tokens } = await registerUser(name, email, password);
    setAuthCookies(cookies, tokens, new URL(request.url).protocol === 'https:');
    return json({ user: publicUser(user) }, 201);
  } catch (error) {
    if (error instanceof Error && error.message.includes('UNIQUE constraint failed')) {
      return json({ error: 'با این ایمیل حسابی وجود دارد.' }, 409);
    }
    throw error;
  }
};
