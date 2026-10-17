import { defineMiddleware } from 'astro:middleware';
import { ACCESS_COOKIE } from './lib/auth/http';
import { getUserFromAccessToken } from './lib/auth/tokens';

export const onRequest = defineMiddleware(async (context, next) => {
  context.locals.user = getUserFromAccessToken(context.cookies.get(ACCESS_COOKIE)?.value);
  return next();
});
