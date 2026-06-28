import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { GetStoriesQuery } from './get-stories.query.js';
import { PrismaService } from '../../../prisma/prisma.service.js';
import { RedisService } from '../../../redis/redis.service.js';
import { NotFoundException } from '@nestjs/common';

const CACHE_TTL = 2 * 60; // 2 phút (stories thay đổi thường xuyên hơn)

@QueryHandler(GetStoriesQuery)
export class GetStoriesHandler implements IQueryHandler<GetStoriesQuery> {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  async execute(query: GetStoriesQuery) {
    if (query.id) {
      const story = await this.prisma.story.findUnique({ where: { id: query.id } });
      if (!story) throw new NotFoundException('Story not found');
      return story;
    }
    const isAdmin = query.admin === 'true';
    const cacheKey = isAdmin ? 'stories:admin' : 'stories:approved';
    const cached = await this.redis.get(cacheKey);
    if (cached) return JSON.parse(cached);

    const stories = await this.prisma.story.findMany({
      where: isAdmin ? {} : { isApproved: true },
      orderBy: { createdAt: 'desc' },
    });
    await this.redis.set(cacheKey, JSON.stringify(stories), CACHE_TTL);
    return stories;
  }
}

