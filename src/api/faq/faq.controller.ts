import { Body, Controller, Delete, Get, Param, Post, Put } from '@nestjs/common';
import { FaqService } from './faq.service';
import { CreateCategoryDto, EditCategoryDto, CreateFaqDto, EditFaqDto } from './dto';

@Controller('faq')
export class FaqController {
  constructor(private readonly faqService: FaqService) {}

  // Категории
  @Get('categories')
  getCategories() {
    return this.faqService.getCategories();
  }

  @Post('categories')
  createCategory(@Body() dto: CreateCategoryDto) {
    return this.faqService.createCategory(dto);
  }

  @Put('categories/:id')
  updateCategory(@Param('id') id: number, @Body() dto: EditCategoryDto) {
    return this.faqService.updateCategory(Number(id), dto);
  }

  @Delete('categories/:id')
  deleteCategory(@Param('id') id: number) {
    return this.faqService.deleteCategory(Number(id));
  }

  // Вопросы
  @Get()
  getFaqs() {
    return this.faqService.getFaqs();
  }

  @Post()
  createFaq(@Body() dto: CreateFaqDto) {
    return this.faqService.createFaq(dto);
  }

  @Put(':id')
  updateFaq(@Param('id') id: number, @Body() dto: EditFaqDto) {
    return this.faqService.updateFaq(Number(id), dto);
  }

  @Delete(':id')
  deleteFaq(@Param('id') id: number) {
    return this.faqService.deleteFaq(Number(id));
  }
}
