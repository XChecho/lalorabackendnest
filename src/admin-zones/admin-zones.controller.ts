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
import { AdminZonesService } from './admin-zones.service';
import {
  CreateZoneDto,
  UpdateZoneDto,
  AddTablesDto,
  UpdateTableDto,
  ToggleTableStatusDto,
} from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@ApiTags('admin-zones')
@Controller('admin/zones')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class AdminZonesController {
  constructor(private readonly adminZonesService: AdminZonesService) {}

  @Get()
  @Roles('ADMIN')
  @ApiOperation({ summary: 'List all zones (admin)' })
  @ApiResponse({
    status: 200,
    description: 'List of zones with table count',
  })
  findAll() {
    return this.adminZonesService.findAll();
  }

  @Get(':id')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Get zone by ID with tables (admin)' })
  @ApiResponse({
    status: 200,
    description: 'Zone found with tables',
  })
  @ApiNotFoundResponse({ description: 'Zone not found' })
  findOne(@Param('id') id: string) {
    return this.adminZonesService.findById(id);
  }

  @Post()
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Create new zone (admin)' })
  @ApiResponse({
    status: 201,
    description: 'Zone created',
  })
  @ApiBadRequestResponse({ description: 'Invalid data' })
  create(@Body() createZoneDto: CreateZoneDto) {
    return this.adminZonesService.create(createZoneDto);
  }

  @Put(':id')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Update zone (admin)' })
  @ApiResponse({
    status: 200,
    description: 'Zone updated',
  })
  @ApiNotFoundResponse({ description: 'Zone not found' })
  @ApiBadRequestResponse({ description: 'Invalid data' })
  update(@Param('id') id: string, @Body() updateZoneDto: UpdateZoneDto) {
    return this.adminZonesService.update(id, updateZoneDto);
  }

  @Delete(':id')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Delete zone (admin)' })
  @ApiResponse({
    status: 200,
    description: 'Zone deleted',
  })
  @ApiNotFoundResponse({ description: 'Zone not found' })
  delete(@Param('id') id: string) {
    return this.adminZonesService.delete(id);
  }

  @Post(':id/tables')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Add tables to zone (admin)' })
  @ApiResponse({
    status: 201,
    description: 'Tables added to zone',
  })
  @ApiNotFoundResponse({ description: 'Zone not found' })
  @ApiBadRequestResponse({ description: 'Invalid quantity' })
  addTables(@Param('id') id: string, @Body() addTablesDto: AddTablesDto) {
    return this.adminZonesService.addTables(id, addTablesDto);
  }

  @Post(':id/table')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Add single table to zone (admin)' })
  @ApiResponse({
    status: 201,
    description: 'Table added to zone',
  })
  @ApiNotFoundResponse({ description: 'Zone not found' })
  addTable(@Param('id') id: string, @Body() updateTableDto?: UpdateTableDto) {
    return this.adminZonesService.addTable(id, updateTableDto);
  }

  @Delete(':id/tables/:tableId')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Remove table from zone (admin)' })
  @ApiResponse({
    status: 200,
    description: 'Table removed',
  })
  @ApiNotFoundResponse({ description: 'Table or zone not found' })
  removeTable(@Param('id') id: string, @Param('tableId') tableId: string) {
    return this.adminZonesService.removeTable(id, tableId);
  }

  @Put(':id/tables/:tableId/status')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Toggle table status (admin)' })
  @ApiResponse({
    status: 200,
    description: 'Table status updated',
  })
  @ApiNotFoundResponse({ description: 'Table not found' })
  @ApiBadRequestResponse({ description: 'Invalid status' })
  toggleTableStatus(
    @Param('id') id: string,
    @Param('tableId') tableId: string,
    @Body() statusDto: ToggleTableStatusDto,
  ) {
    return this.adminZonesService.toggleTableStatus(id, tableId, statusDto.status);
  }
}