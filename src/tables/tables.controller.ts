import { Controller, Get, Param } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { TablesService } from './tables.service';

@ApiTags('tables')
@Controller()
export class TablesController {
  constructor(private readonly tablesService: TablesService) {}

  @Get('tables')
  @ApiOperation({ summary: 'List all tables' })
  findAll() {
    return this.tablesService.findAll();
  }

  @Get('zones/:zoneId/tables')
  @ApiOperation({ summary: 'List tables by zone' })
  findByZone(@Param('zoneId') zoneId: string) {
    return this.tablesService.findByZone(zoneId);
  }
}
