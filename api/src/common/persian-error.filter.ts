import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus } from '@nestjs/common';
import { Request, Response } from 'express';

/**
 * Consistent Persian error envelope: { success: false, code, error }.
 * Zod-style validation errors from ValidationPipe are mapped to VALIDATION_ERROR.
 */
@Catch()
export class PersianErrorFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse<Response>();
    const req = ctx.getRequest<Request>();

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const body = exception.getResponse() as unknown;
      let code = 'ERROR';
      let message = 'خطای سرور.';

      if (typeof body === 'object' && body !== null) {
        const b = body as Record<string, unknown>;
        if (typeof b['code'] === 'string') code = b['code'];
        if (typeof b['error'] === 'string') message = b['error'];
        else if (typeof b['message'] === 'string') message = b['message'];
        else if (Array.isArray(b['message'])) message = 'ورودی معتبر نیست.';
      } else if (typeof body === 'string') {
        message = body;
      }

      // Map class-validator array messages to the stable Persian validation error.
      if (status === HttpStatus.BAD_REQUEST && code === 'ERROR') {
        code = 'VALIDATION_ERROR';
        if (message === 'Bad Request Exception' || Array.isArray((body as Record<string, unknown>)?.['message'])) {
          message = 'ورودی معتبر نیست.';
        }
      }

      // Never leak stack traces; log server-side instead.
      if (status >= 500) {
        console.error(`[${req.method} ${req.url}]`, exception);
        code = 'INTERNAL_ERROR';
        message = 'خطای داخلی سرور.';
      }
      res.status(status).json({ success: false, code, error: message });
      return;
    }

    console.error(`[${req.method} ${req.url}]`, exception);
    res.status(500).json({ success: false, code: 'INTERNAL_ERROR', error: 'خطای داخلی سرور.' });
  }
}
