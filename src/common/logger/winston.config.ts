import winston from 'winston';

// Log levels
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

// Colors
const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'blue',
};

winston.addColors(colors);

// Console format (development)
const consoleFormat = winston.format.combine(
  winston.format.colorize({ all: true }),
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.printf(({ timestamp, level, message, context, ...meta }) => {
    let log = `${timestamp} [${level}]`;
    if (context) log += ` [${context}]`;
    log += `: ${message}`;

    const metaStr = Object.keys(meta).length
      ? JSON.stringify(meta, null, 2)
      : '';
    if (metaStr) log += ` ${metaStr}`;

    return log;
  }),
);

// JSON format for structured logging
const jsonFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.errors({ stack: true }),
  winston.format.json(),
);

// Transports array
const transports: winston.transport[] = [];

// Console transport (always)
transports.push(
  new winston.transports.Console({
    format: process.env.NODE_ENV === 'production' ? jsonFormat : consoleFormat,
  }),
);

// File transports (optional)
if (process.env.LOG_FILE_ENABLED === 'true') {
  // Combined log (all levels)
  transports.push(
    new winston.transports.File({
      filename: 'logs/combined.log',
      format: jsonFormat,
    }),
  );

  // Error-only log
  transports.push(
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
      format: jsonFormat,
    }),
  );
}

// Create logger
export const logger = winston.createLogger({
  level:
    process.env.LOG_LEVEL ||
    (process.env.NODE_ENV === 'production' ? 'info' : 'debug'),
  levels,
  format: jsonFormat,
  defaultMeta: { service: 'lalora-backend' },
  transports,
  exitOnError: false,
});

// Error handling
export const handleExitErrors = () => {
  logger.exceptions.handle(
    new winston.transports.Console({
      format: consoleFormat,
    }),
  );

  logger.rejections.handle(
    new winston.transports.Console({
      format: consoleFormat,
    }),
  );

  process.on('uncaughtException', (error: Error) => {
    logger.error('Uncaught Exception:', error);
  });

  process.on('unhandledRejection', (reason: unknown) => {
    logger.error('Unhandled Rejection:', reason);
  });
};

export default logger;
