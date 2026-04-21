import { Module } from '@nestjs/common';
import { AdminCategoriesController } from './admin-categories.controller';
import { AdminCategoriesService } from './admin-categories.service';
import { PrismaService } from '../prisma.service';

@Module({
  controllers: [AdminCategoriesController],
  providers: [AdminCategoriesService, PrismaService],
})
export class AdminCategoriesModule {}
