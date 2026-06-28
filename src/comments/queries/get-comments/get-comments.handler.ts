import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { GetCommentsQuery } from './get-comments.query.js';
import { PrismaService } from '../../../prisma/prisma.service.js';
import { NotFoundException } from '@nestjs/common';

@QueryHandler(GetCommentsQuery)
export class GetCommentsHandler implements IQueryHandler<GetCommentsQuery> {
  constructor(private readonly prisma: PrismaService) {}

  async execute(query: GetCommentsQuery) {
    if (query.id) {
      const comment = await this.prisma.comment.findUnique({ where: { id: query.id } });
      if (!comment) throw new NotFoundException('Comment not found');
      return comment;
    }
    if (query.lessonId) {
      return this.prisma.comment.findMany({
        where: { lessonId: query.lessonId },
        orderBy: { createdAt: 'desc' },
      });
    }
    return this.prisma.comment.findMany({
      orderBy: { createdAt: 'desc' },
      include: { lesson: { select: { title: true } } },
    });
  }
}
