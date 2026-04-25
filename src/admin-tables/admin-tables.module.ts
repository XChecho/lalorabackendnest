import { Module } from '@nestjs/common';
import { AdminTablesService } from './admin-tables.service';
import { AdminTablesController } from './admin-tables.controller';
import { PrismaService } from '../prisma.service';

@Module({
  controllers: [AdminTablesController],
  providers: [AdminTablesService, PrismaService],
  exports: [AdminTablesService],
})
export class AdminTablesModule {}