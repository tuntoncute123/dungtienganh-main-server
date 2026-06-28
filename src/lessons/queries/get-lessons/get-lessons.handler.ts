import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { GetLessonsQuery } from './get-lessons.query.js';
import { PrismaService } from '../../../prisma/prisma.service.js';
import { NotFoundException } from '@nestjs/common';

@QueryHandler(GetLessonsQuery)
export class GetLessonsHandler implements IQueryHandler<GetLessonsQuery> {
  constructor(private readonly prisma: PrismaService) {}

  async execute(query: GetLessonsQuery) {
    if (query.id) {
      const lesson = await this.prisma.lesson.findUnique({
        where: { id: query.id },
        include: { comments: true },
      });
      if (!lesson) throw new NotFoundException('Lesson not found');
      return lesson;
    }
    return this.prisma.lesson.findMany({ orderBy: { createdAt: 'desc' } });
  }
}
