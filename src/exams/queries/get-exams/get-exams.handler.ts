import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { GetExamsQuery } from './get-exams.query.js';
import { PrismaService } from '../../../prisma/prisma.service.js';
import { NotFoundException } from '@nestjs/common';

@QueryHandler(GetExamsQuery)
export class GetExamsHandler implements IQueryHandler<GetExamsQuery> {
  constructor(private readonly prisma: PrismaService) {}

  async execute(query: GetExamsQuery) {
    if (query.id) {
      const exam = await this.prisma.exam.findUnique({
        where: { id: query.id },
        include: { questions: true },
      });
      if (!exam) throw new NotFoundException('Exam not found');
      return exam;
    }

    if (query.category) {
      return this.prisma.exam.findMany({
        where: { category: query.category },
        orderBy: { createdAt: 'desc' },
        include: { questions: true },
      });
    }

    return this.prisma.exam.findMany({
      orderBy: { createdAt: 'desc' },
      include: { questions: true },
    });
  }
}
