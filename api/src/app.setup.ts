import { INestApplication, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import cookieParser from 'cookie-parser';
import type { NextFunction, Request, Response } from 'express';
import { AppModule } from './app.module';
import { PersianErrorFilter } from './common/persian-error.filter';

export type { INestApplication };

/** Shared bootstrap used by the long-running server (main.ts) and the Vercel function (api/index.ts). */
export async function createApp(): Promise<INestApplication> {
  const app = await NestFactory.create(AppModule, { cors: false });
  const config = app.get(ConfigService);

  app.use(cookieParser());
  // Minimal request log so SSR/API calls per page are visible in this terminal.
  app.use((req: Request, res: Response, next: NextFunction) => {
    const started = Date.now();
    res.on('finish', () => {
      // eslint-disable-next-line no-console
      console.log(`${req.method} ${req.originalUrl} -> ${res.statusCode} (${Date.now() - started}ms)`);
    });
    next();
  });
  app.enableCors({
    origin: config.get<string>('CORS_ORIGIN'),
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    maxAge: 86400,
  });
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true, forbidNonWhitelisted: true }));
  app.useGlobalFilters(new PersianErrorFilter());

  const doc = new DocumentBuilder()
    .setTitle('مووی‌تون API')
    .setDescription('کاتالوگ فیلم، سریال و انیمیشن + حساب کاربری (فارسی، راست‌چین).')
    .setVersion('1.0.0')
    .build();
  const document = SwaggerModule.createDocument(app, doc);
  // Never expose interactive docs from a production deployment.
  if (process.env.NODE_ENV !== 'production') {
    SwaggerModule.setup('docs', app, document);
  }
  return app as unknown as INestApplication;
}
