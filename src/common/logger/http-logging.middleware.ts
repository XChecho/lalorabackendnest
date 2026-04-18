import { Request, Response, NextFunction } from 'express';
import morgan from 'morgan';
import { logger as winstonLogger } from './winston.config';
import { getRequestContext } from './request-context';

export const HttpLoggingMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  // Skip logging in test environment
  if (process.env.NODE_ENV === 'test') {
    return next();
  }

  const morganStream = {
    write: (message: string) => {
      const context = getRequestContext();
      const requestId = context?.requestId || 'unknown';
      const responseTime = context ? Date.now() - context.startTime : undefined;

      // Parse morgan's message to extract status code (if available)
      const parts = message.trim().split(' ');
      const statusCode = parts[2] ? parseInt(parts[2], 10) : undefined;
      const method = parts[0] || undefined;
      const url = parts[1] || undefined;

      const meta: any = {
        requestId,
        responseTime,
      };
      if (statusCode) meta.statusCode = statusCode;
      if (method) meta.method = method;
      if (url) meta.url = url;

      winstonLogger.http(message.trim(), meta);
    },
  };

  morgan('combined', { stream: morganStream })(req, res, next);
};
