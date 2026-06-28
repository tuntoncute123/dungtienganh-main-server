import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { GetExamsQuery } from './get-exams.query.js';
import { PrismaService } from '../../../prisma/prisma.service.js';
import { RedisService } from '../../../redis/redis.service.js';
import { NotFoundException } from '@nestjs/common';

const CACHE_TTL = 10 * 60; // 10 phút

@QueryHandler(GetExamsQuery)
export class GetExamsHandler implements IQueryHandler<GetExamsQuery> {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  async execute(query: GetExamsQuery) {
    if (query.id) {
      const cacheKey = `exams:${query.id}`;
      const cached = await this.redis.get(cacheKey);
      if (cached) return JSON.parse(cached);

      const exam = await this.prisma.exam.findUnique({
        where: { id: query.id },
        include: { questions: true },
      });
      if (!exam) throw new NotFoundException('Exam not found');
      await this.redis.set(cacheKey, JSON.stringify(exam), CACHE_TTL);
      return exam;
    }

    if (query.category) {
      const cacheKey = `exams:category:${query.category}`;
      const cached = await this.redis.get(cacheKey);
      if (cached) return JSON.parse(cached);

      const exams = await this.prisma.exam.findMany({
        where: { category: query.category },
        orderBy: { createdAt: 'desc' },
        include: { questions: true },
      });
      await this.redis.set(cacheKey, JSON.stringify(exams), CACHE_TTL);
      return exams;
    }

    const cacheKey = 'exams:all';
    const cached = await this.redis.get(cacheKey);
    if (cached) return JSON.parse(cached);

    const exams = await this.prisma.exam.findMany({
      orderBy: { createdAt: 'desc' },
      include: { questions: true },
    });
    await this.redis.set(cacheKey, JSON.stringify(exams), CACHE_TTL);
    return exams;
  }
}

