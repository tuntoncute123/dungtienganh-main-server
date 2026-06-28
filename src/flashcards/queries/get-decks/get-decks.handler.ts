import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { GetDecksQuery } from './get-decks.query.js';
import { PrismaService } from '../../../prisma/prisma.service.js';
import { RedisService } from '../../../redis/redis.service.js';
import { NotFoundException } from '@nestjs/common';

const CACHE_TTL = 10 * 60; // 10 phút

@QueryHandler(GetDecksQuery)
export class GetDecksHandler implements IQueryHandler<GetDecksQuery> {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  async execute(query: GetDecksQuery) {
    if (query.id) {
      const cacheKey = `flashcards:${query.id}`;
      const cached = await this.redis.get(cacheKey);
      if (cached) return JSON.parse(cached);

      const deck = await this.prisma.flashcardDeck.findUnique({
        where: { id: query.id },
        include: { cards: true },
      });
      if (!deck) throw new NotFoundException('Flashcard deck not found');
      await this.redis.set(cacheKey, JSON.stringify(deck), CACHE_TTL);
      return deck;
    }

    const cacheKey = 'flashcards:all';
    const cached = await this.redis.get(cacheKey);
    if (cached) return JSON.parse(cached);

    const decks = await this.prisma.flashcardDeck.findMany({
      orderBy: { createdAt: 'desc' },
      include: { cards: true },
    });
    await this.redis.set(cacheKey, JSON.stringify(decks), CACHE_TTL);
    return decks;
  }
}

