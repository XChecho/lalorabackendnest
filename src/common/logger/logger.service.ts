import { Injectable, LoggerService as NestLoggerService } from '@nestjs/common';
import { logger as winstonLogger } from './winston.config';

@Injectable()
export class LoggerService implements NestLoggerService {
  private context: string = 'Application';

  constructor() {}

  log(message: any, ...args: any[]) {
    const meta = this.buildMeta(args);
    winstonLogger.info(message, { context: this.context, ...meta } as any);
  }

  error(message: any, ...args: any[]) {
    const meta = this.buildMeta(args);
    winstonLogger.error(message, { context: this.context, ...meta } as any);
  }

  warn(message: any, ...args: any[]) {
    const meta = this.buildMeta(args);
    winstonLogger.warn(message, { context: this.context, ...meta } as any);
  }

  debug(message: any, ...args: any[]) {
    const meta = this.buildMeta(args);
    winstonLogger.debug(message, { context: this.context, ...meta } as any);
  }

  verbose(message: any, ...args: any[]) {
    const meta = this.buildMeta(args);
    winstonLogger.silly(message, { context: this.context, ...meta } as any);
  }

  private buildMeta(args: any[]): Record<string, any> {
    if (args.length === 0) return {};

    if (typeof args[0] === 'object' && !Array.isArray(args[0])) {
      const meta = { ...args[0] };
      if (args.length > 1) {
        meta.extra = args.slice(1);
      }
      return meta;
    }

    return { extra: args };
  }

  setContext(context: string) {
    this.context = context;
  }
}

// Scoped logger factory
export const createLogger = (context: string) => {
  const logger = new LoggerService();
  logger.setContext(context);
  return {
    log: logger.log.bind(logger),
    error: logger.error.bind(logger),
    warn: logger.warn.bind(logger),
    debug: logger.debug.bind(logger),
    verbose: logger.verbose.bind(logger),
    setContext: logger.setContext.bind(logger),
  };
};
