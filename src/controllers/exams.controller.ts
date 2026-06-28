import { Controller, Get, Post, Put, Delete, Body, Query, HttpCode, HttpStatus, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Controller('api/exams')
export class ExamsController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async getExams(@Query('id') id?: string, @Query('category') category?: string) {
    if (id) {
      const exam = await this.prisma.exam.findUnique({
        where: { id },
        include: { questions: true },
      });
      if (!exam) {
        throw new NotFoundException('Exam not found');
      }
      return exam;
    }

    if (category) {
      return this.prisma.exam.findMany({
        where: { category },
        orderBy: { createdAt: 'desc' },
        include: { questions: true },
      });
    }

    return this.prisma.exam.findMany({
      orderBy: { createdAt: 'desc' },
      include: { questions: true },
    });
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createExam(@Body() body: { title: string; category: string; duration: number; questions?: Array<{ number: number; text: string; options: any; correctAnswer: string; explanation?: string }> }) {
    const { title, category, duration, questions } = body;
    if (!title || !category || !duration) {
      throw new BadRequestException('Title, category and duration are required');
    }

    const questionList = Array.isArray(questions) ? questions : [];

    return this.prisma.exam.create({
      data: {
        title,
        category,
        duration: parseInt(duration as any) || 60,
        cardCount: questionList.length,
        questions: {
          create: questionList.map((q) => ({
            number: parseInt(q.number as any) || 1,
            text: q.text || '',
            options: q.options || {},
            correctAnswer: q.correctAnswer || 'A',
            explanation: q.explanation || null,
          })),
        },
      },
      include: { questions: true },
    });
  }

  @Put()
  async updateExam(@Body() body: { id: string; title?: string; category?: string; duration?: number; questions?: Array<{ number: number; text: string; options: any; correctAnswer: string; explanation?: string }> }) {
    const { id, title, category, duration, questions } = body;
    if (!id) {
      throw new BadRequestException('ID is required');
    }

    const hasQuestions = Array.isArray(questions);

    if (hasQuestions) {
      // Clear current questions
      await this.prisma.question.deleteMany({
        where: { examId: id },
      });
    }

    return this.prisma.exam.update({
      where: { id },
      data: {
        title,
        category,
        duration: duration !== undefined ? parseInt(duration as any) : undefined,
        cardCount: hasQuestions ? questions.length : undefined,
        ...(hasQuestions && {
          questions: {
            create: questions.map((q) => ({
              number: parseInt(q.number as any) || 1,
              text: q.text || '',
              options: q.options || {},
              correctAnswer: q.correctAnswer || 'A',
              explanation: q.explanation || null,
            })),
          },
        }),
      },
      include: { questions: true },
    });
  }

  @Delete()
  async deleteExam(@Query('id') id: string) {
    if (!id) {
      throw new BadRequestException('ID query parameter is required');
    }
    await this.prisma.exam.delete({ where: { id } });
    return { success: true, message: 'Exam deleted successfully' };
  }
}
