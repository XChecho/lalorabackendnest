// Dashboard module temporarily disabled - will be re-enabled when web panel is implemented
// import { Module } from '@nestjs/common';
// import { DashboardService } from './dashboard.service';
// import { DashboardController } from './dashboard.controller';
// import { PrismaService } from '../prisma.service';
// import { LoggerModule } from '../common/logger/logger.module';
//
// @Module({
//   imports: [LoggerModule],
//   providers: [DashboardService, PrismaService],
//   controllers: [DashboardController],
// })
// export class DashboardModule {}

import { Module } from '@nestjs/common';

@Module({})
export class DashboardModule {}
