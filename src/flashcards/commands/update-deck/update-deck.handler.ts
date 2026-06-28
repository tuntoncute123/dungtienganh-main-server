import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { UpdateDeckCommand } from './update-deck.command.js';
import { PrismaService } from '../../../prisma/prisma.service.js';
import { RedisService } from '../../../redis/redis.service.js';
import { BadRequestException } from '@nestjs/common';

@CommandHandler(UpdateDeckCommand)
export class UpdateDeckHandler implements ICommandHandler<UpdateDeckCommand> {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  async execute(command: UpdateDeckCommand) {
    const { id, category, categoryLabel, title, isLocked, type, cards } = command.dto;
    if (!id) throw new BadRequestException('ID is required');

    const hasCards = Array.isArray(cards);
    if (hasCards) {
      await this.prisma.flashcardCard.deleteMany({ where: { deckId: id } });
    }

    const deck = await this.prisma.flashcardDeck.update({
      where: { id },
      data: {
        category,
        categoryLabel,
        title,
        isLocked: isLocked !== undefined ? !!isLocked : undefined,
        type,
        cardCount: hasCards ? cards.length : undefined,
        ...(hasCards && {
          cards: { create: cards.map((c) => ({ front: c.front || '', back: c.back || '' })) },
        }),
      },
      include: { cards: true },
    });
    await this.redis.del('flashcards:all', `flashcards:${id}`);
    return deck;
  }
}

