import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ZonesService } from './zones.service';
import { CreateZoneDto, UpdateZoneDto } from './dto/create-zone.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('zones')
@Controller('zones')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ZonesController {
  constructor(private readonly zonesService: ZonesService) {}

  @Get()
  @ApiOperation({ summary: 'List all zones' })
  findAll() {
    return this.zonesService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get zone by ID' })
  findOne(@Param('id') id: string) {
    return this.zonesService.findById(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new zone' })
  create(@Body() createZoneDto: CreateZoneDto) {
    return this.zonesService.create(createZoneDto);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update zone' })
  update(@Param('id') id: string, @Body() updateZoneDto: UpdateZoneDto) {
    return this.zonesService.update(id, updateZoneDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete zone' })
  delete(@Param('id') id: string) {
    return this.zonesService.delete(id);
  }
}
