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
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
  ApiNotFoundResponse,
  ApiBadRequestResponse,
} from '@nestjs/swagger';
import { AdminTablesService } from './admin-tables.service';
import { UpdateTableDto, ToggleTableStatusDto, CreateTableDto } from '../admin-zones/dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@ApiTags('admin-tables')
@Controller('admin/tables')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class AdminTablesController {
  constructor(private readonly adminTablesService: AdminTablesService) {}

  @Post()
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Create new table (admin)' })
  @ApiResponse({ status: 201, description: 'Table created' })
  @ApiBadRequestResponse({ description: 'Invalid data' })
  create(@Body() createTableDto: CreateTableDto) {
    return this.adminTablesService.create(createTableDto);
  }

  @Get()
  @Roles('ADMIN')
  @ApiOperation({ summary: 'List all tables (admin)' })
  @ApiResponse({
    status: 200,
    description: 'List of all tables with zone info',
  })
  findAll() {
    return this.adminTablesService.findAll();
  }

  @Get(':id')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Get table by ID (admin)' })
  @ApiResponse({
    status: 200,
    description: 'Table found',
  })
  @ApiNotFoundResponse({ description: 'Table not found' })
  findOne(@Param('id') id: string) {
    return this.adminTablesService.findById(id);
  }

  @Put(':id')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Update table (admin)' })
  @ApiResponse({
    status: 200,
    description: 'Table updated',
  })
  @ApiNotFoundResponse({ description: 'Table not found' })
  @ApiBadRequestResponse({ description: 'Invalid data' })
  update(@Param('id') id: string, @Body() updateTableDto: UpdateTableDto) {
    return this.adminTablesService.update(id, updateTableDto);
  }

  @Put(':id/status')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Update table status (admin)' })
  @ApiResponse({
    status: 200,
    description: 'Table status updated',
  })
  @ApiNotFoundResponse({ description: 'Table not found' })
  @ApiBadRequestResponse({ description: 'Invalid status' })
  updateStatus(@Param('id') id: string, @Body() statusDto: ToggleTableStatusDto) {
    return this.adminTablesService.updateStatus(id, statusDto.status);
  }

  @Delete(':id')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Delete table (admin)' })
  @ApiResponse({
    status: 200,
    description: 'Table deleted',
  })
  @ApiNotFoundResponse({ description: 'Table not found' })
  delete(@Param('id') id: string) {
    return this.adminTablesService.delete(id);
  }

  @Get('zone/:zoneId')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'List tables by zone (admin)' })
  @ApiResponse({
    status: 200,
    description: 'List of tables in zone',
  })
  @ApiNotFoundResponse({ description: 'Zone not found' })
  findByZone(@Param('zoneId') zoneId: string) {
    return this.adminTablesService.findByZone(zoneId);
  }
}