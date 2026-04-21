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
import { ProductsService } from './products.service';
import { CreateProductDto, UpdateProductDto } from './dto/create-product.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('products')
@Controller()
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get('categories/:categoryId/products')
  @ApiOperation({ summary: 'List products by category' })
  findByCategory(@Param('categoryId') categoryId: string) {
    return this.productsService.findByCategory(categoryId);
  }

  @Get('products/:id')
  @ApiOperation({ summary: 'Get product by ID' })
  findOne(@Param('id') id: string) {
    return this.productsService.findById(id);
  }

  @Post('products')
  @ApiOperation({ summary: 'Create product' })
  create(@Body() createProductDto: CreateProductDto) {
    return this.productsService.create(createProductDto);
  }

  @Put('products/:id')
  @ApiOperation({ summary: 'Update product' })
  update(@Param('id') id: string, @Body() updateProductDto: UpdateProductDto) {
    return this.productsService.update(id, updateProductDto);
  }

  @Delete('products/:id')
  @ApiOperation({ summary: 'Delete product' })
  delete(@Param('id') id: string) {
    return this.productsService.delete(id);
  }
}
