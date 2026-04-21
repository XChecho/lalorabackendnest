import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { TablesService } from './tables.service';
import { CreateTableDto } from './dto/create-table.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('tables')
@Controller()
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
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

  @Post('tables')
  @ApiOperation({ summary: 'Create a new table' })
  create(@Body() createTableDto: CreateTableDto) {
    return this.tablesService.create(createTableDto);
  }

  @Delete('tables/:id')
  @ApiOperation({ summary: 'Delete table' })
  delete(@Param('id') id: string) {
    return this.tablesService.delete(id);
  }
}
