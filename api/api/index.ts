import 'reflect-metadata';
import type { INestApplication } from '@nestjs/common';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createApp } from '../src/app.setup';

let cached: INestApplication | null = null;

async function app(): Promise<INestApplication> {
  if (!cached) {
    cached = await createApp();
    await cached.init();
  }
  return cached;
}

/** Vercel serverless entry — all /api/* traffic is rewritten here (see vercel.json). */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  const nest = await app();
  const server = nest.getHttpAdapter().getInstance();
  return server(req, res);
}
