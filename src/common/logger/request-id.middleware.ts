import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { requestContext, RequestContextData } from './request-context';

export const RequestIdMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const requestId = uuidv4();
  const startTime = Date.now();

  // Attach requestId to request for downstream use
  (req as any).requestId = requestId;
  // Set response header for client tracking
  res.setHeader('X-Request-Id', requestId);

  // Initialize request context for this async flow
  const context: RequestContextData = {
    requestId,
    startTime,
    method: req.method,
    url: req.url,
    ip: req.ip,
  };

  // Optional userAgent
  const userAgent = req.get('user-agent');
  if (userAgent) {
    context.userAgent = userAgent;
  }

  // Run the request within this context
  requestContext.run(context, () => {
    next();
  });
};
