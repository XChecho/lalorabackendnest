import { Module } from '@nestjs/common';
import { AdminZonesService } from './admin-zones.service';
import { AdminZonesController } from './admin-zones.controller';
import { PrismaService } from '../prisma.service';

@Module({
  controllers: [AdminZonesController],
  providers: [AdminZonesService, PrismaService],
  exports: [AdminZonesService],
})
export class AdminZonesModule {}