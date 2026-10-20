import 'reflect-metadata';
import { ConfigService } from '@nestjs/config';
import { createApp } from './app.setup';

async function bootstrap() {
  const app = await createApp();
  const config = app.get(ConfigService);
  const port = config.get<number>('PORT', 3001);
  await app.listen(port);
  // eslint-disable-next-line no-console
  console.log(`مووی‌تون API on http://localhost:${port} (docs: /docs)`);
}

void bootstrap();
