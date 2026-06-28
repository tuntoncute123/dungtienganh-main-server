import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { GetDecksQuery } from './get-decks.query.js';
import { PrismaService } from '../../../prisma/prisma.service.js';
import { NotFoundException } from '@nestjs/common';

@QueryHandler(GetDecksQuery)
export class GetDecksHandler implements IQueryHandler<GetDecksQuery> {
  constructor(private readonly prisma: PrismaService) {}

  async execute(query: GetDecksQuery) {
    if (query.id) {
      const deck = await this.prisma.flashcardDeck.findUnique({
        where: { id: query.id },
        include: { cards: true },
      });
      if (!deck) throw new NotFoundException('Flashcard deck not found');
      return deck;
    }
    return this.prisma.flashcardDeck.findMany({
      orderBy: { createdAt: 'desc' },
      include: { cards: true },
    });
  }
}
