import { NestFactory } from '@nestjs/core';
import {
  ValidationPipe,
  LoggerService as NestLoggerService,
} from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';
import { SuccessResponseInterceptor } from './common/interceptors/success-response.interceptor';
import { RequestIdMiddleware } from './common/logger/request-id.middleware';
import { HttpLoggingMiddleware } from './common/logger/http-logging.middleware';
import { LoggerService as WinstonLoggerService } from './common/logger/logger.service';
import { logger as winstonLogger } from './common/logger/winston.config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Override default NestJS logger with our Winston-based implementation
  const customLogger = app.get(WinstonLoggerService);
  app.useLogger(customLogger as unknown as NestLoggerService);

  // Add custom middleware for request tracking and HTTP logging
  app.use(RequestIdMiddleware);
  app.use(HttpLoggingMiddleware);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.useGlobalFilters(new GlobalExceptionFilter());
  app.useGlobalInterceptors(new SuccessResponseInterceptor());

  const config = new DocumentBuilder()
    .setTitle('Laloraapp API')
    .setDescription('API para Laloraapp Backend')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  // Log startup
  winstonLogger.info(
    `NestJS application starting on port ${process.env.PORT ?? 3000}`,
    {
      env: process.env.NODE_ENV,
      database: process.env.DATABASE_NAME,
    },
  );

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
