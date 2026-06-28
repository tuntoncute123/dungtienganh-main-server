import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { GetStoriesQuery } from './get-stories.query.js';
import { PrismaService } from '../../../prisma/prisma.service.js';
import { NotFoundException } from '@nestjs/common';

@QueryHandler(GetStoriesQuery)
export class GetStoriesHandler implements IQueryHandler<GetStoriesQuery> {
  constructor(private readonly prisma: PrismaService) {}

  async execute(query: GetStoriesQuery) {
    if (query.id) {
      const story = await this.prisma.story.findUnique({ where: { id: query.id } });
      if (!story) throw new NotFoundException('Story not found');
      return story;
    }
    const isAdmin = query.admin === 'true';
    return this.prisma.story.findMany({
      where: isAdmin ? {} : { isApproved: true },
      orderBy: { createdAt: 'desc' },
    });
  }
}
