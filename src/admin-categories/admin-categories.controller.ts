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
  ApiBadRequestResponse,
  ApiNotFoundResponse,
} from '@nestjs/swagger';
import { AdminCategoriesService } from './admin-categories.service';
import {
  CreateCategoryDto,
  UpdateCategoryDto,
  CreateModifierListDto,
  UpdateModifierListDto,
  CreateModifierOptionDto,
  UpdateModifierOptionDto,
} from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

class CategoryResponse {
  id: string;
  name: string;
  productsCount: number;
  enabled: boolean;
}

class ModifierListResponse {
  id: string;
  name: string;
  required: boolean;
  multiple: boolean;
  options: { id: string; name: string; priceExtra: number }[];
}

class ModifierOptionResponse {
  id: string;
  name: string;
  priceExtra: number;
}

@ApiTags('admin-categories')
@Controller('admin/categories')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class AdminCategoriesController {
  constructor(
    private readonly adminCategoriesService: AdminCategoriesService,
  ) {}

  @Get()
  @Roles('ADMIN')
  @ApiOperation({ summary: 'List all categories (admin)' })
  @ApiResponse({
    status: 200,
    description: 'List of categories',
    type: [CategoryResponse],
  })
  findAll() {
    return this.adminCategoriesService.findAll();
  }

  @Get(':id')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Get category by ID with modifiers (admin)' })
  @ApiResponse({
    status: 200,
    description: 'Category found with modifiers',
  })
  @ApiNotFoundResponse({ description: 'Category not found' })
  findOne(@Param('id') id: string) {
    return this.adminCategoriesService.findById(id);
  }

  @Post()
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Create category (admin)' })
  @ApiResponse({
    status: 201,
    description: 'Category created',
    type: CategoryResponse,
  })
  @ApiBadRequestResponse({ description: 'Invalid data' })
  create(@Body() createCategoryDto: CreateCategoryDto) {
    return this.adminCategoriesService.create(createCategoryDto);
  }

  @Put(':id')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Update category (admin)' })
  @ApiResponse({
    status: 200,
    description: 'Category updated',
    type: CategoryResponse,
  })
  @ApiNotFoundResponse({ description: 'Category not found' })
  @ApiBadRequestResponse({ description: 'Invalid data' })
  update(
    @Param('id') id: string,
    @Body() updateCategoryDto: UpdateCategoryDto,
  ) {
    return this.adminCategoriesService.update(id, updateCategoryDto);
  }

  @Put(':id/status')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Toggle category status (admin)' })
  @ApiResponse({
    status: 200,
    description: 'Category status updated',
    type: CategoryResponse,
  })
  @ApiNotFoundResponse({ description: 'Category not found' })
  @ApiBadRequestResponse({ description: 'Invalid enabled value' })
  toggleStatus(@Param('id') id: string, @Body('enabled') enabled: boolean) {
    return this.adminCategoriesService.toggleStatus(id, enabled);
  }

  @Delete(':id')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Delete category (soft delete - admin)' })
  @ApiResponse({
    status: 200,
    description: 'Category deleted (soft delete)',
    type: CategoryResponse,
  })
  @ApiNotFoundResponse({ description: 'Category not found' })
  remove(@Param('id') id: string) {
    return this.adminCategoriesService.remove(id);
  }

  @Get(':id/lists')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Get all modifier lists for a category (admin)' })
  @ApiResponse({
    status: 200,
    description: 'List of modifier lists',
    type: [ModifierListResponse],
  })
  @ApiNotFoundResponse({ description: 'Category not found' })
  getModifierLists(@Param('id') id: string) {
    return this.adminCategoriesService.findById(id);
  }

  @Post(':id/lists')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Create modifier list for category (admin)' })
  @ApiResponse({
    status: 201,
    description: 'Modifier list created',
    type: ModifierListResponse,
  })
  @ApiBadRequestResponse({ description: 'Invalid data' })
  @ApiNotFoundResponse({ description: 'Category not found' })
  createModifierList(
    @Param('id') categoryId: string,
    @Body() createListDto: CreateModifierListDto,
  ) {
    return this.adminCategoriesService.createModifierList(
      categoryId,
      createListDto,
    );
  }

  @Put(':id/lists/:listId')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Update modifier list (admin)' })
  @ApiResponse({
    status: 200,
    description: 'Modifier list updated',
    type: ModifierListResponse,
  })
  @ApiNotFoundResponse({ description: 'Modifier list not found' })
  @ApiBadRequestResponse({ description: 'Invalid data' })
  updateModifierList(
    @Param('id') categoryId: string,
    @Param('listId') listId: string,
    @Body() updateListDto: UpdateModifierListDto,
  ) {
    return this.adminCategoriesService.updateModifierList(
      listId,
      updateListDto,
    );
  }

  @Delete(':id/lists/:listId')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Delete modifier list (admin)' })
  @ApiResponse({
    status: 200,
    description: 'Modifier list deleted',
  })
  @ApiNotFoundResponse({ description: 'Modifier list not found' })
  deleteModifierList(
    @Param('id') categoryId: string,
    @Param('listId') listId: string,
  ) {
    return this.adminCategoriesService.deleteModifierList(listId);
  }

  @Post(':id/lists/:listId/options')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Create modifier option (admin)' })
  @ApiResponse({
    status: 201,
    description: 'Modifier option created',
    type: ModifierOptionResponse,
  })
  @ApiBadRequestResponse({ description: 'Invalid data' })
  @ApiNotFoundResponse({ description: 'Modifier list not found' })
  createModifierOption(
    @Param('id') categoryId: string,
    @Param('listId') listId: string,
    @Body() optionDto: CreateModifierOptionDto,
  ) {
    return this.adminCategoriesService.createModifierOption(listId, optionDto);
  }

  @Put(':id/lists/:listId/options/:optionId')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Update modifier option (admin)' })
  @ApiResponse({
    status: 200,
    description: 'Modifier option updated',
    type: ModifierOptionResponse,
  })
  @ApiNotFoundResponse({ description: 'Modifier option not found' })
  @ApiBadRequestResponse({ description: 'Invalid data' })
  updateModifierOption(
    @Param('id') categoryId: string,
    @Param('listId') listId: string,
    @Param('optionId') optionId: string,
    @Body() optionDto: UpdateModifierOptionDto,
  ) {
    return this.adminCategoriesService.updateModifierOption(
      optionId,
      optionDto,
    );
  }

  @Delete(':id/lists/:listId/options/:optionId')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Delete modifier option (admin)' })
  @ApiResponse({
    status: 200,
    description: 'Modifier option deleted',
  })
  @ApiNotFoundResponse({ description: 'Modifier option not found' })
  deleteModifierOption(
    @Param('id') categoryId: string,
    @Param('listId') listId: string,
    @Param('optionId') optionId: string,
  ) {
    return this.adminCategoriesService.deleteModifierOption(optionId);
  }

  @Put(':id/lists/:listId/options/:optionId/restock')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Restock modifier option (admin)' })
  @ApiResponse({
    status: 200,
    description: 'Modifier option restocked',
  })
  @ApiNotFoundResponse({ description: 'Modifier option not found' })
  restockModifierOption(
    @Param('id') categoryId: string,
    @Param('listId') listId: string,
    @Param('optionId') optionId: string,
    @Body('quantity') quantity: number,
  ) {
    return this.adminCategoriesService.restockModifierOption(
      optionId,
      quantity,
    );
  }
}
