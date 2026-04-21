import { Module } from '@nestjs/common';
import { ZonesService } from './zones.service';
import { ZonesController } from './zones.controller';
import { PrismaService } from '../prisma.service';

@Module({
  providers: [ZonesService, PrismaService],
  controllers: [ZonesController],
  exports: [ZonesService],
})
export class ZonesModule {}
