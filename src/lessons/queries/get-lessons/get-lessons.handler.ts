import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { GetLessonsQuery } from './get-lessons.query.js';
import { PrismaService } from '../../../prisma/prisma.service.js';
import { RedisService } from '../../../redis/redis.service.js';
import { NotFoundException } from '@nestjs/common';

const CACHE_TTL = 5 * 60; // 5 phút

@QueryHandler(GetLessonsQuery)
export class GetLessonsHandler implements IQueryHandler<GetLessonsQuery> {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  async execute(query: GetLessonsQuery) {
    if (query.id) {
      const cacheKey = `lessons:${query.id}`;
      const cached = await this.redis.get(cacheKey);
      if (cached) return JSON.parse(cached);

      const lesson = await this.prisma.lesson.findUnique({
        where: { id: query.id },
        include: { comments: true },
      });
      if (!lesson) throw new NotFoundException('Lesson not found');

      await this.redis.set(cacheKey, JSON.stringify(lesson), CACHE_TTL);
      return lesson;
    }

    const cacheKey = 'lessons:all';
    const cached = await this.redis.get(cacheKey);
    if (cached) return JSON.parse(cached);

    const lessons = await this.prisma.lesson.findMany({ orderBy: { createdAt: 'desc' } });
    await this.redis.set(cacheKey, JSON.stringify(lessons), CACHE_TTL);
    return lessons;
  }
}

