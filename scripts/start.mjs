// The production server must never fall back to the development JWT key.
process.env.NODE_ENV ??= 'production';
await import('../dist/server/entry.mjs');
