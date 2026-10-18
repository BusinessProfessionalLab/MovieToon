import * as Joi from 'joi';

export const envValidationSchema = Joi.object({
  PORT: Joi.number().port().default(3001),
  DATABASE_PATH: Joi.string().default('./dev.sqlite'),
  CORS_ORIGIN: Joi.string().uri().default('http://localhost:4321'),
  JWT_ACCESS_SECRET: Joi.string().min(32).required(),
  JWT_REFRESH_SECRET: Joi.string().min(32).required().invalid(Joi.ref('JWT_ACCESS_SECRET')),
  ACCESS_TOKEN_TTL: Joi.string()
    .pattern(/^\d+[smhd]$/)
    .default('15m'),
  REFRESH_TOKEN_TTL: Joi.string()
    .pattern(/^\d+[smhd]$/)
    .default('7d'),
  COOKIE_SECURE: Joi.boolean().default(false),
  COOKIE_DOMAIN: Joi.string().domain().allow('').optional(),
});

export interface AppConfig {
  port: number;
  databasePath: string;
  corsOrigin: string;
  jwtAccessSecret: string;
  jwtRefreshSecret: string;
  accessTokenTtl: string;
  refreshTokenTtl: string;
  cookieSecure: boolean;
  cookieDomain?: string;
}
