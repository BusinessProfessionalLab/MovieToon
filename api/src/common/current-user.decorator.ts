import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export interface RequestUser {
  id: string;
}

/** Extracts the authenticated user id placed on the request by JwtAuthGuard. */
export const CurrentUserId = createParamDecorator((_data: unknown, ctx: ExecutionContext): string => {
  const req = ctx.switchToHttp().getRequest<{ user?: RequestUser }>();
  if (!req.user?.id) throw new Error('CurrentUserId used without JwtAuthGuard');
  return req.user.id;
});
