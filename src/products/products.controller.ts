import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiConsumes } from '@nestjs/swagger';
import { ProductsService } from './products.service';
import { CreateProductDto, UpdateProductDto } from './dto/create-product.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@ApiTags('products')
@Controller()
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get('categories/:categoryId/products')
  @ApiOperation({ summary: 'List products by category (user)' })
  findByCategory(@Param('categoryId') categoryId: string) {
    return this.productsService.findByCategory(categoryId);
  }

  @Get('products/:id')
  @ApiOperation({ summary: 'Get product by ID (user)' })
  findOne(@Param('id') id: string) {
    return this.productsService.findById(id);
  }

  @Post('products')
  @ApiOperation({ summary: 'Create product (user)' })
  create(@Body() createProductDto: CreateProductDto) {
    return this.productsService.create(createProductDto);
  }

  @Put('products/:id')
  @ApiOperation({ summary: 'Update product (user)' })
  update(@Param('id') id: string, @Body() updateProductDto: UpdateProductDto) {
    return this.productsService.update(id, updateProductDto);
  }

  @Delete('products/:id')
  @ApiOperation({ summary: 'Delete product (user)' })
  delete(@Param('id') id: string) {
    return this.productsService.delete(id);
  }
}

@ApiTags('admin-products')
@Controller('admin/products')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
@Roles('ADMIN')
export class AdminProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  @ApiOperation({ summary: 'List all products (admin)' })
  findAll() {
    return this.productsService.findAll();
  }

  @Get('categories/:categoryId')
  @ApiOperation({ summary: 'List products by category (admin)' })
  findByCategory(@Param('categoryId') categoryId: string) {
    return this.productsService.findByCategory(categoryId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get product by ID (admin)' })
  findOne(@Param('id') id: string) {
    return this.productsService.findById(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create product (admin)' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('image'))
  create(@Body() createProductDto: CreateProductDto, @UploadedFile() file: Express.Multer.File) {
    const dataWithBuffer = file
      ? { ...createProductDto, imageBuffer: file.buffer }
      : createProductDto;
    return this.productsService.create(dataWithBuffer);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update product (admin)' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('image'))
  update(
    @Param('id') id: string,
    @Body() updateProductDto: UpdateProductDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    const dataWithBuffer = file
      ? { ...updateProductDto, imageBuffer: file.buffer }
      : updateProductDto;
    return this.productsService.update(id, dataWithBuffer);
  }

  @Put(':id/status')
  @ApiOperation({ summary: 'Toggle product status (admin)' })
  toggleStatus(@Param('id') id: string, @Body('enabled') enabled: boolean) {
    return this.productsService.toggleStatus(id, enabled);
  }

  @Put(':id/restock')
  @ApiOperation({ summary: 'Update product stock (admin)' })
  restock(@Param('id') id: string, @Body('quantity') quantity: number) {
    return this.productsService.updateStock(id, quantity);
  }

  @Post('restock-all')
  @ApiOperation({ summary: 'Restock all products (admin)' })
  restockAll(@Body('categoryId') categoryId?: string) {
    return this.productsService.restockAll(categoryId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete product (admin)' })
  delete(@Param('id') id: string) {
    return this.productsService.delete(id);
  }
}
