export interface SuccessEnvelope<T> {
  success: true;
  data: T;
  message?: string;
  meta?: PageMeta;
}

export interface PageMeta {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface ErrorEnvelope {
  success: false;
  code: string;
  error: string;
}

export function ok<T>(data: T, message?: string, meta?: PageMeta): SuccessEnvelope<T> {
  return { success: true, data, ...(message ? { message } : {}), ...(meta ? { meta } : {}) };
}

export function pageMeta(total: number, page: number, pageSize: number): PageMeta {
  return { page, pageSize, total, totalPages: Math.max(1, Math.ceil(total / pageSize)) };
}

export function clampPageSize(n: number, max = 50): number {
  if (!Number.isFinite(n)) return 12;
  return Math.min(Math.max(1, Math.floor(n)), max);
}
