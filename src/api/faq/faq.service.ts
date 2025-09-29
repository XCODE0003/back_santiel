import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/infra/prisma/prisma.service';
import { CreateCategoryDto, EditCategoryDto, CreateFaqDto, EditFaqDto } from './dto';

@Injectable()
export class FaqService {
  constructor(private readonly prisma: PrismaService) {}

  // Категории
  getCategories() {
    return this.prisma.faqCategory.findMany();
  }

  createCategory(dto: CreateCategoryDto) {
    return this.prisma.faqCategory.create({
      data: { name: dto.name },
    });
  }

  async updateCategory(id: number, dto: EditCategoryDto) {
    const category = await this.prisma.faqCategory.findUnique({ where: { id } });
    if (!category) throw new NotFoundException('Категория не найдена');
    return this.prisma.faqCategory.update({
      where: { id },
      data: { name: dto.name },
    });
  }

  async deleteCategory(id: number) {
    const category = await this.prisma.faqCategory.findUnique({ where: { id } });
    if (!category) throw new NotFoundException('Категория не найдена');
    return this.prisma.faqCategory.delete({ where: { id } });
  }

  // Вопросы
  getFaqs() {
    return this.prisma.faq.findMany({
      include: {
        category: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  createFaq(dto: CreateFaqDto) {
    return this.prisma.faq.create({
      data: {
        question: dto.question,
        answer: dto.answer,
        categoryId: dto.categoryId,
      },
    });
  }

  async updateFaq(id: number, dto: EditFaqDto) {
    const faq = await this.prisma.faq.findUnique({ where: { id } });
    if (!faq) throw new NotFoundException('Вопрос не найден');
    return this.prisma.faq.update({
      where: { id },
      data: {
        question: dto.question,
        answer: dto.answer,
        categoryId: dto.categoryId,
      },
    });
  }

  async deleteFaq(id: number) {
    const faq = await this.prisma.faq.findUnique({ where: { id } });
    if (!faq) throw new NotFoundException('Вопрос не найден');
    return this.prisma.faq.delete({ where: { id } });
  }
}
