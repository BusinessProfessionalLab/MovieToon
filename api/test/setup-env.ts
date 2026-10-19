// Test env must be set before app.module.ts is imported (decorators run at import time).
process.env.DB_HOST = process.env.DB_HOST ?? 'localhost';
process.env.DB_PORT = process.env.DB_PORT ?? '5432';
process.env.DB_USERNAME = process.env.DB_USERNAME ?? 'movietoon';
process.env.DB_PASSWORD = process.env.DB_PASSWORD ?? '';
process.env.DB_NAME = process.env.DB_NAME ?? 'movietoon_test';
process.env.JWT_ACCESS_SECRET = 'test-access-secret-00000000000000000000000000';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-0000000000000000000000000';
process.env.ACCESS_TOKEN_TTL = '15m';
process.env.REFRESH_TOKEN_TTL = '30d';
process.env.CORS_ORIGIN = 'http://localhost:4321';
process.env.COOKIE_SECURE = 'false';

export {};
