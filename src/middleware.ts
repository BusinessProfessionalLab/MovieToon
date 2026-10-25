import { defineMiddleware } from 'astro:middleware';

// Session resolution is delegated to the NestJS API so the frontend
// never touches password hashes or signing secrets. Runs server-side
// per request; fails open (logged out) when the API is unreachable.
// Public catalog APIs never depend on this — they work logged-out too.
// Default to production so Vercel works even without dashboard env vars.
const API_BASE = process.env.API_INTERNAL_URL ?? 'https://api.movietoon.ir';

interface MeBody {
  success: boolean;
  data?: { id: string; email: string; name: string; role: string; createdAt: number };
}

interface LocalsUser {
  id: string;
  email: string;
  name: string;
  role: string;
  created_at: number;
}

function toLocalsUser(data: NonNullable<MeBody['data']>): LocalsUser {
  return { id: data.id, email: data.email, name: data.name, role: data.role, created_at: data.createdAt };
}

async function fetchJson(path: string, cookie: string, method = 'GET'): Promise<{ status: number; body: MeBody; setCookies: string[] }> {
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers: { cookie },
    signal: AbortSignal.timeout(3000),
  });
  let body: MeBody = { success: false };
  try {
    body = (await res.json()) as MeBody;
  } catch {
    /* non-JSON — treated as failure below */
  }
  const raw = res.headers.getSetCookie?.() ?? [];
  const setCookies = Array.isArray(raw) ? raw : [raw].filter(Boolean);
  return { status: res.status, body, setCookies };
}

export const onRequest = defineMiddleware(async (context, next) => {
  context.locals.user = null;
  const pendingCookies: string[] = [];
  const cookie = context.request.headers.get('cookie') ?? '';
  const hasSession = cookie.includes('mt_access=') || cookie.includes('mt_refresh=');

  if (hasSession) {
    try {
      const me = await fetchJson('/api/auth/me', cookie);
      if (me.status === 200 && me.body.success && me.body.data) {
        context.locals.user = toLocalsUser(me.body.data);
      } else if (cookie.includes('mt_refresh=')) {
        // Access token expired — silent refresh, then user (rotation happens server-side).
        // NOTE: /api/auth/refresh returns { data: { user } } while /me returns
        // { data: PublicUser } directly — accept both shapes.
        const rotated = await fetchJson('/api/auth/refresh', cookie, 'POST');
        pendingCookies.push(...rotated.setCookies);
        if (rotated.status === 200 && rotated.body.success && rotated.body.data) {
          const raw = rotated.body.data as unknown as MeBody['data'] & { user?: MeBody['data'] };
          const u = (raw as { user?: MeBody['data'] }).user ?? raw;
          if (u) context.locals.user = toLocalsUser(u as NonNullable<MeBody['data']>);
        }
      }
    } catch {
      // API unreachable — stay logged out, never break the page.
    }
  }

  const response = await next();
  for (const sc of pendingCookies) response.headers.append('set-cookie', sc);
  return response;
});
