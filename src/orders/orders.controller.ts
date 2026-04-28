import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  Req,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
  ApiBadRequestResponse,
  ApiNotFoundResponse,
} from '@nestjs/swagger';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { AddItemsDto } from './dto/add-items.dto';
import { UpdateOrderStatusDto } from './dto/update-status.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('orders')
@Controller('orders')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new order' })
  @ApiResponse({ status: 201, description: 'Order created' })
  @ApiBadRequestResponse({
    description: 'Invalid data or table already has active order',
  })
  create(@Body() dto: CreateOrderDto, @Req() req: any) {
    const userId = req.user?.userId as string;
    return this.ordersService.create(dto, userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get order by ID' })
  @ApiResponse({ status: 200, description: 'Order found' })
  @ApiNotFoundResponse({ description: 'Order not found' })
  findOne(@Param('id') id: string) {
    return this.ordersService.findById(id);
  }

  @Post(':id/items')
  @ApiOperation({ summary: 'Add items to an order' })
  @ApiResponse({ status: 201, description: 'Items added' })
  @ApiBadRequestResponse({
    description: 'Cannot add to closed/cancelled order',
  })
  @ApiNotFoundResponse({ description: 'Order not found' })
  addItems(@Param('id') id: string, @Body() dto: AddItemsDto) {
    return this.ordersService.addItems(id, dto);
  }

  @Put(':id/status')
  @ApiOperation({ summary: 'Update order status' })
  @ApiResponse({ status: 200, description: 'Status updated' })
  @ApiBadRequestResponse({ description: 'Invalid status transition' })
  updateStatus(@Param('id') id: string, @Body() dto: UpdateOrderStatusDto) {
    return this.ordersService.updateStatus(id, dto.status);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Cancel an order' })
  @ApiResponse({ status: 200, description: 'Order cancelled' })
  cancel(@Param('id') id: string) {
    return this.ordersService.cancel(id);
  }

  @Get('tables/:tableId/orders/active')
  @ApiOperation({ summary: 'Get active order for a table' })
  @ApiResponse({ status: 200, description: 'Active order found or null' })
  @ApiNotFoundResponse({ description: 'Table not found' })
  findActiveByTable(@Param('tableId') tableId: string) {
    return this.ordersService.findActiveByTable(tableId);
  }
}
